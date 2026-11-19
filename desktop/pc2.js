// Reads laps from Project CARS 2's UDP telemetry ("Project CARS 2" protocol,
// port 5606). Packet layouts follow SMS_UDP_Definitions.hpp from Slightly Mad
// Studios. Read-only: the game sends, Lapbook only listens.
"use strict";
const { EventEmitter } = require("events");

const TYPE = { TELEMETRY: 0, RACE: 1, PARTICIPANTS: 2, TIMINGS: 3, GAME_STATE: 4, TIME_STATS: 7, VEHICLE_NAMES: 8 };
const SIZE = { RACE: 308, TIMINGS: 1059, TIME_STATS: 1040, VEHICLE_NAMES: 1164, CLASS_NAMES: 1452, TELEMETRY: 556 };
const P = 32; // participants per timings packet, 32 bytes each, from offset 33

const cstr = (b, off, len) => { const s = b.toString("latin1", off, off + len); const z = s.indexOf("\0"); return (z >= 0 ? s.slice(0, z) : s).trim(); };
const SESSION = ["", "Practice", "Test", "Qualifying", "Formation lap", "Race", "Time trial"];

function parseRace(b) {
  return {
    length: b.readFloatLE(44),
    location: cstr(b, 48, 64), variation: cstr(b, 112, 64),
    tLocation: cstr(b, 176, 64), tVariation: cstr(b, 240, 64),
  };
}
function parseTimings(b) {
  const list = [];
  for (let i = 0; i < P; i++) {
    const o = 33 + i * 32, pos = b.readUInt8(o + 14), race = b.readUInt8(o + 20), carIndex = b.readUInt16LE(o + 18);
    list.push({
      lapDistance: b.readUInt16LE(o + 12), position: pos & 0x7f, active: !!(pos & 0x80), sector: b.readUInt8(o + 15) & 0x07,
      carIndex: carIndex & 0x7fff, human: !!(carIndex & 0x8000), raceState: race & 0x07, invalid: !!(race & 0x80),
      lap: b.readUInt8(o + 21), current: b.readFloatLE(o + 22), sectorTime: b.readFloatLE(o + 26),
    });
  }
  return { count: b.readInt8(12), list, local: b.readUInt16LE(1057) };
}
function parseStats(b) {
  const list = [];
  for (let i = 0; i < P; i++) {
    const o = 16 + i * 32;
    list.push({ fastest: b.readFloatLE(o), last: b.readFloatLE(o + 4), lastSector: b.readFloatLE(o + 8) });
  }
  return list;
}
// vehicle index -> name; the name starts at byte 8 (after padding) or 6 (packed)
function parseVehicles(b) {
  const out = [];
  for (let i = 0; i < 16; i++) {
    const o = 12 + i * 72, at = b.readUInt8(o + 6) >= 32 ? 6 : 8, name = cstr(b, o + at, 64);
    if (name) out.push({ index: b.readUInt16LE(o), name });
  }
  return out;
}

class PC2Telemetry extends EventEmitter {
  constructor({ statsWaitMs = 2500 } = {}) {
    super();
    this.game = "Project CARS 2";
    this.statsWaitMs = statsWaitMs;
    this.vehicles = {};
    this.race = null;
    this.timings = null;
    this.stats = null;
    this.lastPacket = 0;
    this.me = null; // { lap, sectorsAt, invalid }
    this.pending = null;
    this.lastLap = null;
    this.live = null;
    this.session = 0;
    this.unsupported = 0;
    this.version = 0;
  }
  get track() {
    const r = this.race;
    if (!r) return "";
    const loc = r.tLocation || r.location, v = r.tVariation || r.variation;
    return [loc, v && v.toLowerCase() !== loc.toLowerCase() ? v : ""].filter(Boolean).join(" ").replace(/_/g, " ");
  }
  handle(b) {
    if (b.length < 12) return;
    this.lastPacket = Date.now();
    const type = b.readUInt8(10);
    if (type === TYPE.RACE && b.length >= SIZE.RACE) { const before = this.track; this.race = parseRace(b); if (this.track !== before) { this.me = null; this.emit("session"); } }
    else if (type === TYPE.TIMINGS && b.length >= SIZE.TIMINGS) this.onTimings(parseTimings(b));
    else if (type === TYPE.TIME_STATS && b.length >= SIZE.TIME_STATS) this.onStats(parseStats(b));
    else if (type === TYPE.VEHICLE_NAMES && b.length >= SIZE.VEHICLE_NAMES && b.length < SIZE.CLASS_NAMES) for (const v of parseVehicles(b)) this.vehicles[v.index] = v.name;
    else if (type === TYPE.GAME_STATE && b.length >= 15) this.session = (b.readUInt8(14) >> 4) & 0x07;
    else if (type > 8) this.unsupported = b.length;
    this.flush();
  }
  localIndex(t) {
    const i = t.local;
    if (i < P && t.list[i] && t.list[i].active) return i;
    const h = t.list.findIndex(p => p.active && p.human);
    return h >= 0 ? h : 0;
  }
  carName(p) { return (p && this.vehicles[p.carIndex]) || ""; }
  onTimings(t) {
    this.timings = t;
    const i = this.localIndex(t), p = t.list[i];
    if (!p || !p.active) return;
    const car = this.carName(p), track = this.track;
    let me = this.me;
    if (!me || me.index !== i || me.track !== track) me = this.me = { index: i, track, lap: p.lap, sector: p.sector, cross: [], invalid: p.invalid, lastCurrent: p.current };
    if (p.lap === me.lap + 1) {
      // crossed the line: the last lap is done. The exact time comes with the next
      // time-stats packet; until then we keep our own measurement.
      const s1 = me.cross[0] || 0, s2 = me.cross[1] ? me.cross[1] - me.cross[0] : 0;
      this.pending = { lapNum: me.lap, at: Date.now(), measured: Math.round(me.lastCurrent * 1000), s1, s2, invalid: me.invalid, track, car: car || me.car, oldLast: this.stats ? this.stats[i].last : 0, index: i, position: p.position };
      me.lap = p.lap; me.cross = []; me.invalid = p.invalid; me.sector = p.sector;
    } else if (p.lap !== me.lap) { me.lap = p.lap; me.cross = []; me.invalid = p.invalid; me.sector = p.sector; }
    else {
      if (p.sector !== me.sector && p.current > 0) { if (me.cross.length < 2) me.cross.push(Math.round(p.current * 1000)); me.sector = p.sector; }
      if (p.invalid) me.invalid = true;
    }
    if (car) me.car = car;
    me.lastCurrent = p.current;
    const cur = p.current > 0 ? Math.round(p.current * 1000) : 0;
    this.live = {
      at: Date.now(), t: cur, lapNum: p.lap, distance: p.lapDistance, sector: me.cross.length, s1: me.cross[0] || 0, s2: me.cross[1] ? me.cross[1] - me.cross[0] : 0,
      invalid: me.invalid, position: p.position, cars: t.list.filter(x => x.active).length, track, car: me.car || "", race: this.session === 5,
    };
    this.emit("car", this.live);
  }
  onStats(list) {
    this.stats = list;
  }
  flush() {
    const q = this.pending;
    if (!q) return;
    const st = this.stats && this.stats[q.index];
    const fromStats = st && st.last > 0 && Math.round(st.last * 1000) !== Math.round((q.oldLast || 0) * 1000) ? Math.round(st.last * 1000) : 0;
    if (!fromStats && Date.now() - q.at < this.statsWaitMs) return;
    this.pending = null;
    const ms = fromStats || q.measured;
    if (!(ms > 0) || !q.track || !q.car) return;
    const sectors = q.s1 > 0 && q.s2 > 0 && ms - q.s1 - q.s2 > 0 ? [q.s1, q.s2, ms - q.s1 - q.s2] : null;
    const lap = { game: this.game, track: q.track, car: q.car, timeInMs: ms, valid: !q.invalid, lapNum: q.lapNum, session: SESSION[this.session] || "", sectors, position: q.position, exact: !!fromStats };
    this.lastLap = { ...lap, at: Date.now() };
    this.emit("lap", lap);
  }
  info() {
    return { live: !!(this.live && Date.now() - this.live.at < 3000), connected: Date.now() - this.lastPacket < 5000, track: this.track, car: this.live ? this.live.car : "", lastLap: this.lastLap, unsupported: this.unsupported };
  }
}

module.exports = { PC2Telemetry, parseRace, parseTimings, parseStats, parseVehicles, TYPE, SIZE };
