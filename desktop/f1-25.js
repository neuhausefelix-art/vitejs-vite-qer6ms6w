// Reads the official F1 25 UDP telemetry and turns it into finished laps.
// Read-only: the game sends these packets on its own once UDP telemetry is
// switched on in its settings. Nothing here touches the game process.
"use strict";
const { EventEmitter } = require("events");

const HEADER = 29;
const PACKET = { SESSION: 1, LAP_DATA: 2, PARTICIPANTS: 4, SESSION_HISTORY: 11 };
const LAP_SIZE = 14; // LapHistoryData
const MAX_LAPS = 100;
const STINT_SIZE = 3; // TyreStintHistoryData

const TRACKS = {
  0: "Melbourne", 1: "Paul Ricard", 2: "Shanghai", 3: "Bahrain", 4: "Barcelona", 5: "Monaco",
  6: "Montreal", 7: "Silverstone", 8: "Hockenheim", 9: "Hungaroring", 10: "Spa-Francorchamps",
  11: "Monza", 12: "Singapore", 13: "Suzuka", 14: "Abu Dhabi", 15: "Austin (COTA)", 16: "Interlagos",
  17: "Red Bull Ring", 18: "Sochi", 19: "Mexico City", 20: "Baku", 21: "Bahrain Short",
  22: "Silverstone Short", 23: "Austin Short", 24: "Suzuka Short", 25: "Hanoi", 26: "Zandvoort",
  27: "Imola", 28: "Portimão", 29: "Jeddah", 30: "Miami", 31: "Las Vegas", 32: "Lusail",
  39: "Silverstone Reverse", 40: "Red Bull Ring Reverse", 41: "Zandvoort Reverse",
};
const TEAMS = {
  0: "Mercedes", 1: "Ferrari", 2: "Red Bull Racing", 3: "Williams", 4: "Aston Martin", 5: "Alpine",
  6: "Racing Bulls", 7: "Haas", 8: "McLaren", 9: "Kick Sauber", 41: "F1 Generic", 104: "My Team",
};
// 2026 season cars. 228 is confirmed as the 2026 McLaren; the others follow the
// same order as the 2025 teams and can be renamed in Lapbook if one is off.
const TEAMS_2026 = {
  220: "Mercedes", 221: "Ferrari", 222: "Red Bull Racing", 223: "Williams", 224: "Aston Martin", 225: "Alpine",
  226: "Racing Bulls", 227: "Haas", 228: "McLaren", 229: "Audi", 230: "Cadillac",
};
const SESSIONS = {
  1: "Practice 1", 2: "Practice 2", 3: "Practice 3", 4: "Short Practice", 5: "Q1", 6: "Q2", 7: "Q3",
  8: "Short Qualifying", 9: "One-Shot Qualifying", 10: "Sprint Shootout 1", 11: "Sprint Shootout 2",
  12: "Sprint Shootout 3", 13: "Short Sprint Shootout", 14: "One-Shot Sprint Shootout", 15: "Race",
  16: "Race 2", 17: "Race 3", 18: "Time Trial",
};
// Lapbook weather keys
const WEATHER = { 0: "sun", 1: "light_cloud", 2: "cloud", 3: "light_rain", 4: "rain", 5: "storm" };
// visual tyre compound -> Lapbook tire keys
const TYRES = { 16: "soft", 17: "medium", 18: "hard", 7: "inter", 8: "wet" };

const trackName = id => TRACKS[id] || `Track ${id}`;
const unknownCar = id => `F1 25 car (team ${id})`;
// own names (set in Lapbook) win over the built-in list
const carName = (id, own = {}) =>
  own[id] ? String(own[id]) : TEAMS[id] ? `${TEAMS[id]} F1 25` : TEAMS_2026[id] ? `${TEAMS_2026[id]} 2026` : unknownCar(id);
const knownCars = () => {
  const o = {};
  for (const id of Object.keys(TEAMS)) o[id] = carName(Number(id));
  for (const id of Object.keys(TEAMS_2026)) o[id] = carName(Number(id));
  return o;
};

class F1Telemetry extends EventEmitter {
  constructor() {
    super();
    this.session = null; // { uid, trackId, weather, airTemp, trackTemp, type }
    this.teamId = null;
    this.uid = "";
    this.sent = new Set(); // "<sessionUID>:<lapNum>"
    this.lastPacket = 0;
    this.format = 0;
    this.names = {}; // your own names for team IDs
    this.live = null; // { current, last, lapNum, invalid, at } for the overlay
  }

  // what is being driven right now, for the live card
  info() {
    return {
      track: this.session ? trackName(this.session.trackId) : "",
      car: this.teamId === null ? "" : carName(this.teamId, this.names),
      teamId: this.teamId,
      known: this.teamId === null || this.teamId in TEAMS || this.teamId in TEAMS_2026 || this.teamId in this.names,
      session: this.session ? SESSIONS[this.session.type] || "" : "",
    };
  }

  handle(buf) {
    if (!Buffer.isBuffer(buf) || buf.length < HEADER) return;
    const format = buf.readUInt16LE(0);
    if (format !== 2025 && format !== 2024) {
      this.emit("unsupported", format);
      return;
    }
    this.format = format;
    this.lastPacket = Date.now();
    const id = buf.readUInt8(6);
    const uid = buf.readBigUInt64LE(7).toString();
    const player = buf.readUInt8(27);
    if (uid !== this.uid) {
      // a new session started: forget the old track and car
      this.uid = uid;
      this.session = null;
      this.teamId = null;
      this.live = null;
    }
    if (id === PACKET.SESSION) this.onSession(buf, uid);
    else if (id === PACKET.PARTICIPANTS) this.onParticipants(buf, player);
    else if (id === PACKET.SESSION_HISTORY) this.onHistory(buf, uid, player);
    else if (id === PACKET.LAP_DATA) this.onLapData(buf, player);
  }

  onSession(buf, uid) {
    if (buf.length < HEADER + 8) return;
    this.session = {
      uid,
      weather: buf.readUInt8(29),
      trackTemp: buf.readInt8(30),
      airTemp: buf.readInt8(31),
      type: buf.readUInt8(35),
      trackId: buf.readInt8(36),
    };
  }

  // running lap time of your car (Lap Data packet: 22 cars, then 2 time-trial bytes)
  onLapData(buf, player) {
    const stride = (buf.length - HEADER - 2) / 22;
    if (!Number.isInteger(stride) || stride < 38 || player >= 22) return;
    const o = HEADER + player * stride;
    const inv = buf.readUInt8(o + 37);
    this.live = {
      last: buf.readUInt32LE(o),
      current: buf.readUInt32LE(o + 4),
      lapNum: buf.readUInt8(o + 33),
      invalid: inv === 1,
      at: Date.now(),
    };
  }

  onParticipants(buf, player) {
    const stride = (buf.length - HEADER - 1) / 22;
    if (!Number.isInteger(stride) || stride < 8 || player >= 22) return;
    this.teamId = buf.readUInt8(HEADER + 1 + player * stride + 3);
  }

  onHistory(buf, uid, player) {
    const base = HEADER + 7;
    const stints = base + MAX_LAPS * LAP_SIZE;
    if (buf.length < stints + 8 * STINT_SIZE) return;
    if (buf.readUInt8(HEADER) !== player) return; // only your own car
    if (!this.session || this.teamId === null) return; // wait until we know track and car
    const numLaps = Math.min(buf.readUInt8(HEADER + 1), MAX_LAPS);
    const numStints = Math.min(buf.readUInt8(HEADER + 2), 8);
    for (let i = 0; i < numLaps; i++) {
      const o = base + i * LAP_SIZE;
      const ms = buf.readUInt32LE(o);
      const key = `${uid}:${i + 1}`;
      if (!ms || this.sent.has(key)) continue; // 0 = lap still running
      this.sent.add(key);
      const flags = buf.readUInt8(o + 13);
      this.emit("lap", {
        game: "F1 25",
        track: trackName(this.session.trackId),
        car: carName(this.teamId, this.names),
        teamId: this.teamId,
        timeInMs: ms,
        valid: (flags & 1) === 1,
        lapNum: i + 1,
        tire: this.tyreFor(buf, stints, numStints, i + 1),
        weather: WEATHER[this.session.weather] || "sun",
        airTemp: this.session.airTemp,
        trackTemp: this.session.trackTemp,
        session: SESSIONS[this.session.type] || "",
      });
    }
  }

  tyreFor(buf, stints, numStints, lapNum) {
    for (let s = 0; s < numStints; s++) {
      const o = stints + s * STINT_SIZE;
      const end = buf.readUInt8(o);
      if (end === 255 || lapNum <= end) return TYRES[buf.readUInt8(o + 2)] || "";
    }
    return "";
  }
}

module.exports = { F1Telemetry, TRACKS, TEAMS, TEAMS_2026, carName, unknownCar, knownCars, HEADER, LAP_SIZE, MAX_LAPS, STINT_SIZE, PACKET };
