// Reads the official F1 25 UDP telemetry and turns it into finished laps.
// Read-only: the game sends these packets on its own once UDP telemetry is
// switched on in its settings. Nothing here touches the game process.
"use strict";
const { EventEmitter } = require("events");

const HEADER = 29;
const PACKET = { SESSION: 1, LAP_DATA: 2, PARTICIPANTS: 4, CAR_SETUPS: 5, FINAL_CLASSIFICATION: 8, SESSION_HISTORY: 11 };
const RACES = new Set([15, 16, 17]); // session types that are races
// game modes (m_gameMode) that are a career season
const CAREER = { 27: "My Team Career", 28: "Driver Career", 29: "Career Online" };
const kindOf = type => (type >= 1 && type <= 4 ? "practice" : type >= 5 && type <= 9 ? "qualifying" : type >= 10 && type <= 14 ? "sprintShootout" : RACES.has(type) ? "race" : "");
// driver names come in capitals from some modes: "MAX VERSTAPPEN" -> "Max Verstappen"
const nice = n => (/[a-z]/.test(n) ? n : n.toLowerCase().replace(/(^|[\s'-])\p{L}/gu, c => c.toUpperCase()));
const teamName = id => TEAMS[id] || TEAMS_2026[id] || `Team ${id}`;
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
// the real car names (chassis) per team ID
const CHASSIS = {
  0: "Mercedes W16", 1: "Ferrari SF-25", 2: "Red Bull Racing RB21", 3: "Williams FW47", 4: "Aston Martin AMR25",
  5: "Alpine A525", 6: "Racing Bulls VCARB 02", 7: "Haas VF-25", 8: "McLaren MCL39", 9: "Kick Sauber C45",
  220: "Mercedes W17", 221: "Ferrari SF-26", 222: "Red Bull Racing RB22", 223: "Williams FW48", 224: "Aston Martin AMR26",
  225: "Alpine A526", 226: "Racing Bulls VCARB 03", 227: "Haas VF-26", 228: "McLaren MCL40", 229: "Audi R26",
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
  own[id] ? String(own[id]) : CHASSIS[id] || (TEAMS[id] ? `${TEAMS[id]} F1 25` : TEAMS_2026[id] ? `${TEAMS_2026[id]} 2026` : unknownCar(id));
// names earlier Lapbook versions used, so old laps can be renamed to the real car
const oldNames = id => [unknownCar(id), TEAMS[id] && `${TEAMS[id]} F1 25`, TEAMS_2026[id] && `${TEAMS_2026[id]} 2026`].filter(Boolean);
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
    this.drivers = []; // all cars of the session (participants packet)
    this.order = []; // live position of every car, for sessions without a final result
    this.bests = []; // best lap of every car (session history)
  }

  // what is being driven right now, for the live card
  info() {
    return {
      track: this.session ? trackName(this.session.trackId) : "",
      car: this.teamId === null ? "" : carName(this.teamId, this.names),
      teamId: this.teamId,
      known: this.teamId === null || this.teamId in TEAMS || this.teamId in TEAMS_2026 || this.teamId in this.names,
      session: this.session ? SESSIONS[this.session.type] || "" : "",
      uid: this.uid,
      race: !!(this.session && RACES.has(this.session.type)),
      trackLength: this.session ? this.session.trackLength : 0,
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
    this.player = player;
    if (uid !== this.uid) {
      // a new session started: forget the old track and car
      this.flushSnapshot();
      this.uid = uid;
      this.drivers = [];
      this.order = [];
      this.bests = [];
      this.session = null;
      this.teamId = null;
      this.live = null;
    }
    if (id === PACKET.SESSION) this.onSession(buf, uid);
    else if (id === PACKET.PARTICIPANTS) this.onParticipants(buf, player);
    else if (id === PACKET.SESSION_HISTORY) this.onHistory(buf, uid, player);
    else if (id === PACKET.LAP_DATA) this.onLapData(buf, player);
    else if (id === PACKET.FINAL_CLASSIFICATION) this.onFinal(buf, uid, player);
    else if (id === PACKET.CAR_SETUPS) this.onSetup(buf, player);
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
      trackLength: buf.readUInt16LE(33),
    };
    // career season: which season, which weekend, and how the weekend is built
    if (buf.length >= 753) {
      const n = Math.min(buf.readUInt8(732), 12), structure = [];
      for (let i = 0; i < n; i++) structure.push(buf.readUInt8(733 + i));
      Object.assign(this.session, {
        season: buf.readUInt32LE(670), weekend: buf.readUInt32LE(674), link: buf.readUInt32LE(678),
        gameMode: buf.readUInt8(694), structure,
      });
    }
  }
  // what kind of session this is inside a career weekend
  career() {
    const s = this.session;
    if (!s || !CAREER[s.gameMode] || !s.season) return null;
    let kind = kindOf(s.type);
    const st = s.structure || [], sprintWeekend = st.some(t => t >= 10 && t <= 14);
    // in a sprint weekend the first race is the sprint, the last one the Grand Prix
    if (kind === "race" && sprintWeekend) {
      const races = st.filter(t => RACES.has(t));
      if (races.length > 1 && s.type !== races[races.length - 1]) kind = "sprint";
    }
    return { season: s.season, weekend: s.weekend, link: s.link, mode: CAREER[s.gameMode], kind, sprintWeekend };
  }

  // running lap time of your car (Lap Data packet: 22 cars, then 2 time-trial bytes)
  onLapData(buf, player) {
    const stride = (buf.length - HEADER - 2) / 22;
    if (!Number.isInteger(stride) || stride < 38 || player >= 22) return;
    for (let i = 0; i < 22; i++) this.order[i] = buf.readUInt8(HEADER + i * stride + 32);
    const o = HEADER + player * stride;
    const inv = buf.readUInt8(o + 37);
    const sec = (ms, min) => buf.readUInt16LE(o + ms) + buf.readUInt8(o + min) * 60000;
    this.live = {
      last: buf.readUInt32LE(o),
      current: buf.readUInt32LE(o + 4),
      s1: sec(8, 10), // sector 1 of the running lap (0 until done)
      s2: sec(11, 13),
      distance: buf.readFloatLE(o + 20), // metres into the lap (negative before the line)
      position: buf.readUInt8(o + 32),
      lapNum: buf.readUInt8(o + 33),
      sector: buf.readUInt8(o + 36), // 0, 1, 2
      invalid: inv === 1,
      grid: stride >= 44 ? buf.readUInt8(o + 43) : 0,
      cars: this.numCars || 0,
      at: Date.now(),
    };
  }

  onParticipants(buf, player) {
    const stride = (buf.length - HEADER - 1) / 22;
    if (!Number.isInteger(stride) || stride < 8 || player >= 22) return;
    this.teamId = buf.readUInt8(HEADER + 1 + player * stride + 3);
    this.numCars = buf.readUInt8(HEADER);
    // every driver: F1 25 names are 32 bytes, F1 24 had 48
    const nameLen = stride >= 60 ? 48 : 32;
    this.drivers = [];
    for (let i = 0; i < 22; i++) {
      const o = HEADER + 1 + i * stride;
      if (stride < 7 + nameLen) break;
      const raw = buf.toString("utf8", o + 7, o + 7 + nameLen), name = nice(raw.slice(0, (raw.indexOf("\0") + 1 || raw.length + 1) - 1).trim());
      this.drivers.push({ ai: buf.readUInt8(o) === 1, driverId: buf.readUInt8(o + 1), teamId: buf.readUInt8(o + 3), myTeam: buf.readUInt8(o + 4) === 1, number: buf.readUInt8(o + 5), name });
    }
  }
  // the same driver in every session: by the game's driver id, players by name
  driverKey(i) {
    const d = this.drivers[i];
    if (!d) return "car" + i;
    return d.driverId !== 255 ? "d" + d.driverId : "n:" + d.name;
  }
  row(i, player, extra) {
    const d = this.drivers[i] || {}, teamId = d.teamId !== undefined ? d.teamId : null;
    return { key: this.driverKey(i), name: d.name || (i === player ? "You" : `Car ${i + 1}`), number: d.number || 0, teamId, team: teamId === null ? "" : teamName(teamId), car: teamId === null ? "" : carName(teamId, this.names), ai: !!d.ai, me: i === player, ...extra };
  }
  // the whole result of a session, for the championship
  classification(rows, source) {
    const c = this.career(), s = this.session;
    if (!c || !c.kind || !rows.length) return;
    const key = "cls:" + s.uid;
    if (this.sent.has(key)) return;
    this.sent.add(key);
    this.emit("classification", { game: "F1 25", ...c, uid: s.uid, type: s.type, session: SESSIONS[s.type] || "", track: trackName(s.trackId), source, cars: rows.sort((a, b) => a.position - b.position) });
  }
  // practice and qualifying: if the game sent no final result, use the last live order
  flushSnapshot() {
    const s = this.session, player = this.player;
    if (!s || !this.order.length || !this.drivers.length || RACES.has(s.type)) return;
    const n = this.numCars || this.drivers.length, rows = [];
    for (let i = 0; i < Math.min(22, this.drivers.length); i++) if (this.order[i] > 0 && this.order[i] <= n) rows.push(this.row(i, player, { position: this.order[i], grid: 0, laps: 0, points: 0, pits: 0, status: "", best: this.bests[i] || 0, time: 0 }));
    this.classification(rows, "live");
  }

  // end of a race: your result, for the automatic race log
  onFinal(buf, uid, player) {
    const stride = (buf.length - HEADER - 1) / 22;
    if (!Number.isInteger(stride) || stride < 20 || player >= 22) return;
    if (!this.session) return;
    // F1 25 added m_resultReason after the status, so later fields moved one byte
    const r = stride >= 46 ? 1 : 0, STATUS = { 3: "", 4: "", 5: "DNF", 6: "DSQ", 7: "NC", 8: "Retired" };
    const n = buf.readUInt8(HEADER), rows = [];
    for (let i = 0; i < Math.min(22, n || 22); i++) {
      const o = HEADER + 1 + i * stride, pos = buf.readUInt8(o);
      if (!pos) continue;
      rows.push(this.row(i, player, {
        position: pos, laps: buf.readUInt8(o + 1), grid: buf.readUInt8(o + 2), points: buf.readUInt8(o + 3), pits: buf.readUInt8(o + 4),
        status: STATUS[buf.readUInt8(o + 5)] || "", best: buf.readUInt32LE(o + 6 + r), time: Math.round(buf.readDoubleLE(o + 10 + r) * 1000),
      }));
    }
    this.classification(rows, "final");
    if (this.teamId === null || !RACES.has(this.session.type)) return;
    const key = "race:" + uid;
    if (this.sent.has(key)) return;
    const o = HEADER + 1 + player * stride;
    const cars = buf.readUInt8(HEADER);
    const status = buf.readUInt8(o + 5); // 3 active, 4 finished, 5 DNF, 6 DSQ, 7 not classified, 8 retired
    this.sent.add(key);
    this.emit("race", {
      game: "F1 25",
      track: trackName(this.session.trackId),
      car: carName(this.teamId, this.names),
      finish: buf.readUInt8(o),
      laps: buf.readUInt8(o + 1),
      start: buf.readUInt8(o + 2),
      pits: buf.readUInt8(o + 4),
      dnf: status >= 5,
      field: Math.max(0, cars - 1),
      bestLap: buf.readUInt32LE(o + 6 + r),
      weather: WEATHER[this.session.weather] || "sun",
      session: SESSIONS[this.session.type] || "Race",
      career: this.career(),
    });
  }

  // your car setup: every option of the game's setup menu
  onSetup(buf, player) {
    const stride = (buf.length - HEADER - 4) / 22;
    if (!Number.isInteger(stride) || stride < 49 || player >= 22 || !this.session || this.teamId === null) return;
    const o = HEADER + player * stride, eb = stride >= 50 ? 1 : 0, f = (x, d = 2) => Math.round(buf.readFloatLE(x) * 10 ** d) / 10 ** d;
    const v = {
      frontWing: buf.readUInt8(o), rearWing: buf.readUInt8(o + 1), onThrottle: buf.readUInt8(o + 2), offThrottle: buf.readUInt8(o + 3),
      frontCamber: f(o + 4), rearCamber: f(o + 8), frontToe: f(o + 12), rearToe: f(o + 16),
      frontSuspension: buf.readUInt8(o + 20), rearSuspension: buf.readUInt8(o + 21), frontAntiRollBar: buf.readUInt8(o + 22), rearAntiRollBar: buf.readUInt8(o + 23),
      frontRideHeight: buf.readUInt8(o + 24), rearRideHeight: buf.readUInt8(o + 25), brakePressure: buf.readUInt8(o + 26), brakeBias: buf.readUInt8(o + 27),
    };
    if (eb) v.engineBraking = buf.readUInt8(o + 28);
    const t = o + 28 + eb;
    Object.assign(v, { pressureRL: f(t, 1), pressureRR: f(t + 4, 1), pressureFL: f(t + 8, 1), pressureFR: f(t + 12, 1), ballast: buf.readUInt8(t + 16), fuel: f(t + 17, 1) });
    if (!v.frontWing && !v.rearWing && !v.brakeBias) return; // not loaded yet (menus)
    // fuel goes down while you drive, so it does not make a new setup
    const { fuel, ...rest } = v, key = JSON.stringify(rest) + "|" + this.uid;
    if (key === this.setupKey) return;
    this.setupKey = key;
    this.emit("setup", { game: "F1 25", track: trackName(this.session.trackId), car: carName(this.teamId, this.names), values: v, session: SESSIONS[this.session.type] || "" });
  }

  onHistory(buf, uid, player) {
    const base = HEADER + 7;
    const stints = base + MAX_LAPS * LAP_SIZE;
    if (buf.length < stints + 8 * STINT_SIZE) return;
    const car = buf.readUInt8(HEADER);
    if (car < 22) {
      const bl = buf.readUInt8(HEADER + 3);
      if (bl >= 1 && bl <= MAX_LAPS) this.bests[car] = buf.readUInt32LE(base + (bl - 1) * LAP_SIZE);
    }
    if (car !== player) return; // laps only of your own car
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
      const sec = (ms, min) => buf.readUInt16LE(o + ms) + buf.readUInt8(o + min) * 60000;
      const sectors = [sec(4, 6), sec(7, 9), sec(10, 12)];
      this.emit("lap", {
        game: "F1 25",
        track: trackName(this.session.trackId),
        car: carName(this.teamId, this.names),
        teamId: this.teamId,
        timeInMs: ms,
        valid: (flags & 1) === 1,
        lapNum: i + 1,
        sectors: sectors.every(x => x > 0) ? sectors : null,
        sessionUid: uid,
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

module.exports = { CAREER, kindOf, F1Telemetry, TRACKS, TEAMS, TEAMS_2026, CHASSIS, carName, unknownCar, oldNames, knownCars, HEADER, LAP_SIZE, MAX_LAPS, STINT_SIZE, PACKET };
