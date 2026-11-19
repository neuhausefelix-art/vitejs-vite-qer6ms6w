// Reads laps from Assetto Corsa Competizione's official "broadcasting" UDP API.
// ACC is the server: Lapbook registers as a read-only client (like a TV
// broadcast tool) and ACC then streams the cars, lap times and sector splits.
// The port and password come from Documents\Assetto Corsa Competizione\
// Config\broadcasting.json. Read-only: nothing is sent to the car or the session.
"use strict";
const { EventEmitter } = require("events");
const dgram = require("dgram");
const fs = require("fs");
const path = require("path");

const OUT = { REGISTER: 1, UNREGISTER: 9, ENTRY_LIST: 10, TRACK_DATA: 11 };
const IN = { REGISTRATION: 1, REALTIME: 2, CAR: 3, ENTRY_LIST: 4, TRACK: 5, ENTRY_CAR: 6, EVENT: 7 };
const PROTOCOL = 4;
const NO_TIME = 2147483647; // int.MaxValue = no time

// CarModelType ids of ACC (GT3, GT4, GT2, Cup, Challenge, TCX)
const CARS = {
  0: "Porsche 991 GT3 R", 1: "Mercedes-AMG GT3", 2: "Ferrari 488 GT3", 3: "Audi R8 LMS", 4: "Lamborghini Huracán GT3", 5: "McLaren 650S GT3",
  6: "Nissan GT-R Nismo GT3 2018", 7: "BMW M6 GT3", 8: "Bentley Continental GT3 2018", 9: "Porsche 991 II GT3 Cup", 10: "Nissan GT-R Nismo GT3 2017",
  11: "Bentley Continental GT3 2016", 12: "Aston Martin V12 Vantage GT3", 13: "Lamborghini Gallardo R-EX", 14: "Jaguar G3", 15: "Lexus RC F GT3",
  16: "Lamborghini Huracán GT3 Evo", 17: "Honda NSX GT3", 18: "Lamborghini Huracán Super Trofeo", 19: "Audi R8 LMS Evo", 20: "Aston Martin V8 Vantage GT3",
  21: "Honda NSX GT3 Evo", 22: "McLaren 720S GT3", 23: "Porsche 911 II GT3 R", 24: "Ferrari 488 GT3 Evo", 25: "Mercedes-AMG GT3 2020",
  26: "Ferrari 488 Challenge Evo", 27: "BMW M2 CS Racing", 28: "Porsche 992 GT3 Cup", 29: "Lamborghini Huracán Super Trofeo EVO2", 30: "BMW M4 GT3",
  31: "Audi R8 LMS GT3 evo II", 32: "Ferrari 296 GT3", 33: "Lamborghini Huracán GT3 EVO2", 34: "Porsche 992 GT3 R", 35: "McLaren 720S GT3 Evo",
  36: "Ford Mustang GT3",
  50: "Alpine A110 GT4", 51: "Aston Martin V8 Vantage GT4", 52: "Audi R8 LMS GT4", 53: "BMW M4 GT4", 55: "Chevrolet Camaro GT4R", 56: "Ginetta G55 GT4",
  57: "KTM X-Bow GT4", 58: "Maserati MC GT4", 59: "McLaren 570S GT4", 60: "Mercedes-AMG GT4", 61: "Porsche 718 Cayman GT4 Clubsport",
  80: "Audi R8 LMS GT2", 82: "KTM X-Bow GT2", 83: "Maserati MC20 GT2", 84: "Mercedes-AMG GT2", 85: "Porsche 911 GT2 RS CS Evo", 86: "Porsche 935",
};
const TRACKS = {
  monza: "Monza", zolder: "Zolder", brands_hatch: "Brands Hatch", silverstone: "Silverstone", paul_ricard: "Paul Ricard", misano: "Misano",
  spa: "Spa-Francorchamps", nurburgring: "Nürburgring", nurburgring_24h: "Nürburgring 24h", barcelona: "Barcelona", hungaroring: "Hungaroring",
  zandvoort: "Zandvoort", kyalami: "Kyalami", mount_panorama: "Mount Panorama", suzuka: "Suzuka", laguna_seca: "Laguna Seca", imola: "Imola",
  oulton_park: "Oulton Park", donington: "Donington Park", snetterton: "Snetterton", cota: "Circuit of the Americas", indianapolis: "Indianapolis",
  watkins_glen: "Watkins Glen", valencia: "Valencia", red_bull_ring: "Red Bull Ring",
};
const trackName = s => {
  const k = String(s || "").trim();
  const id = k.toLowerCase().replace(/[\s-]+/g, "_");
  if (TRACKS[id]) return TRACKS[id];
  return /[A-Z]/.test(k) ? k : k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
};
const carName = id => CARS[id] || `ACC car ${id}`;

// ---- reading and writing the wire format (little endian, strings: u16 length + UTF-8) ----
class Reader {
  constructor(buf) { this.b = buf; this.o = 0; }
  u8() { return this.b.readUInt8(this.o++); }
  u16() { const v = this.b.readUInt16LE(this.o); this.o += 2; return v; }
  i32() { const v = this.b.readInt32LE(this.o); this.o += 4; return v; }
  f32() { const v = this.b.readFloatLE(this.o); this.o += 4; return v; }
  str() { const n = this.u16(); const s = this.b.toString("utf8", this.o, this.o + n); this.o += n; return s; }
  lap() {
    const t = this.i32(), carIndex = this.u16(), driverIndex = this.u16(), n = this.u8(), splits = [];
    for (let i = 0; i < n; i++) splits.push(this.i32());
    const invalid = this.u8() > 0, validForBest = this.u8() > 0, outLap = this.u8() > 0, inLap = this.u8() > 0;
    const ok = x => (x > 0 && x !== NO_TIME ? x : 0);
    return { ms: ok(t), carIndex, driverIndex, splits: splits.map(ok), invalid, validForBest, outLap, inLap };
  }
}
const wstr = s => { const b = Buffer.from(String(s || ""), "utf8"); const h = Buffer.alloc(2); h.writeUInt16LE(b.length); return Buffer.concat([h, b]); };
function registerMsg(name, password, intervalMs, commandPassword) {
  const head = Buffer.from([OUT.REGISTER, PROTOCOL]);
  const iv = Buffer.alloc(4); iv.writeInt32LE(intervalMs);
  return Buffer.concat([head, wstr(name), wstr(password), iv, wstr(commandPassword)]);
}
function idMsg(type, id) { const b = Buffer.alloc(5); b.writeUInt8(type, 0); b.writeInt32LE(id, 1); return b; }

function parse(buf) {
  const r = new Reader(buf), type = r.u8();
  switch (type) {
    case IN.REGISTRATION: return { type, id: r.i32(), ok: r.u8() > 0, readOnly: r.u8() === 0, error: r.str() };
    case IN.REALTIME: {
      const m = { type, event: r.u16(), session: r.u16(), sessionType: r.u8(), phase: r.u8(), time: r.f32(), end: r.f32(), focused: r.i32() };
      r.str(); r.str(); r.str();
      m.replay = r.u8() > 0;
      if (m.replay) { r.f32(); r.f32(); }
      m.timeOfDay = r.f32(); m.air = r.u8(); m.track = r.u8(); m.clouds = r.u8() / 10; m.rain = r.u8() / 10; m.wet = r.u8() / 10;
      m.best = r.lap();
      return m;
    }
    case IN.CAR: {
      const m = { type, car: r.u16(), driver: r.u16(), drivers: r.u8(), gear: r.u8() - 2, x: r.f32(), y: r.f32(), yaw: r.f32(), location: r.u8(), kmh: r.u16(), position: r.u16(), cupPosition: r.u16(), trackPosition: r.u16(), spline: r.f32(), laps: r.u16(), delta: r.i32() };
      m.best = r.lap(); m.last = r.lap(); m.current = r.lap();
      return m;
    }
    case IN.ENTRY_LIST: { const m = { type, id: r.i32(), cars: [] }; const n = r.u16(); for (let i = 0; i < n; i++) m.cars.push(r.u16()); return m; }
    case IN.TRACK: return { type, id: r.i32(), name: r.str(), trackId: r.i32(), meters: r.i32() };
    case IN.ENTRY_CAR: {
      const m = { type, car: r.u16(), model: r.u8(), team: r.str(), number: r.i32(), cup: r.u8(), driverIndex: r.u8(), nationality: r.u16(), drivers: [] };
      const n = r.u8();
      for (let i = 0; i < n; i++) m.drivers.push({ first: r.str(), last: r.str(), short: r.str(), category: r.u8(), nationality: r.u16() });
      return m;
    }
    case IN.EVENT: return { type, kind: r.u8(), msg: r.str(), ms: r.i32(), car: r.i32() };
    default: return { type };
  }
}

// ---- broadcasting.json: where ACC says on which port it listens ----
const configFile = docs => path.join(docs, "Assetto Corsa Competizione", "Config", "broadcasting.json");
function readConfig(file) {
  try {
    const raw = fs.readFileSync(file);
    const utf16 = raw.length > 1 && ((raw[0] === 0xff && raw[1] === 0xfe) || raw[1] === 0);
    const txt = (utf16 ? raw.toString("utf16le") : raw.toString("utf8")).replace(/^﻿/, "");
    const j = JSON.parse(txt);
    return { found: true, port: Number(j.updListenerPort ?? j.udpListenerPort) || 0, password: String(j.connectionPassword ?? ""), commandPassword: String(j.commandPassword ?? ""), utf16 };
  } catch (e) {
    return { found: fs.existsSync(file), port: 0, password: "", commandPassword: "", error: e.code === "ENOENT" ? "" : String(e.message || e) };
  }
}
// switches the broadcasting API on (port 9000). The old file is kept next to it.
function enableConfig(file, port = 9000) {
  const cur = readConfig(file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (fs.existsSync(file)) fs.copyFileSync(file, file + ".lapbook-backup");
  const j = { updListenerPort: port, connectionPassword: cur.password || "asd", commandPassword: cur.commandPassword || "" };
  const txt = JSON.stringify(j, null, 2);
  // ACC writes this file as UTF-16 LE, so keep it that way
  fs.writeFileSync(file, Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(txt, "utf16le")]));
  return readConfig(file);
}

class ACCTelemetry extends EventEmitter {
  constructor({ host = "127.0.0.1", configPath = "", intervalMs = 100, retryMs = 4000, timeoutMs = 6000 } = {}) {
    super();
    Object.assign(this, { host, configPath, intervalMs, retryMs, timeoutMs });
    this.game = "Assetto Corsa Competizione";
    this.reset();
    this.sock = null;
    this.timer = null;
  }
  reset() {
    this.connId = -1;
    this.connected = false;
    this.error = "";
    this.lastSeen = 0;
    this.track = "";
    this.trackMeters = 0;
    this.focused = -1;
    this.entries = {};
    this.cars = {}; // carIndex -> last car update
    this.laps = {}; // carIndex -> laps counted
    this.live = null;
    this.sessionType = -1;
    this.replay = false;
    this.lastLap = null;
  }
  config() { return this.configPath ? readConfig(this.configPath) : { found: false, port: 9000, password: "asd", commandPassword: "" }; }
  start() {
    if (this.sock) return;
    const s = dgram.createSocket("udp4");
    s.on("message", m => { try { this.handle(m); } catch (e) {} });
    s.on("error", err => { this.error = String(err.message || err); this.emit("status"); });
    s.bind(0, this.host === "127.0.0.1" ? "127.0.0.1" : undefined);
    this.sock = s;
    this.timer = setInterval(() => this.tick(), 1000);
    this.tick(true);
  }
  stop() {
    clearInterval(this.timer); this.timer = null;
    if (this.sock) {
      try { if (this.connId >= 0) this.sendTo(idMsg(OUT.UNREGISTER, this.connId)); } catch (e) {}
      try { this.sock.close(); } catch (e) {}
    }
    this.sock = null;
    this.reset();
    this.emit("status");
  }
  sendTo(buf) {
    const c = this.cfg || this.config();
    if (!this.sock || !(c.port > 0)) return;
    this.sock.send(buf, c.port, this.host);
  }
  tick(force) {
    const now = Date.now();
    if (this.connected && now - this.lastSeen > this.timeoutMs) { this.connected = false; this.connId = -1; this.live = null; this.emit("status"); }
    if (this.connected) return;
    if (!force && now - (this.tried || 0) < this.retryMs) return;
    this.tried = now;
    this.cfg = this.config();
    if (!(this.cfg.port > 0)) return;
    // a random command password keeps Lapbook read-only
    this.sendTo(registerMsg("Lapbook", this.cfg.password, this.intervalMs, "lapbook-" + Math.random().toString(36).slice(2, 10)));
  }
  handle(buf) {
    const m = parse(buf);
    this.lastSeen = Date.now();
    if (m.type === IN.REGISTRATION) {
      if (!m.ok) { this.error = m.error || "ACC refused the connection (password in broadcasting.json?)"; this.connected = false; this.emit("status"); return; }
      this.connId = m.id; this.connected = true; this.error = "";
      this.sendTo(idMsg(OUT.ENTRY_LIST, m.id));
      this.sendTo(idMsg(OUT.TRACK_DATA, m.id));
      this.emit("status");
      return;
    }
    if (!this.connected) { this.connected = true; this.emit("status"); }
    if (m.type === IN.TRACK) { this.track = trackName(m.name); this.trackMeters = m.meters > 0 ? m.meters : 0; this.emit("status"); }
    else if (m.type === IN.ENTRY_CAR) this.entries[m.car] = { model: m.model, team: m.team, number: m.number };
    else if (m.type === IN.ENTRY_LIST) { for (const id of Object.keys(this.entries)) if (!m.cars.includes(Number(id))) delete this.entries[id]; }
    else if (m.type === IN.REALTIME) {
      if (m.session !== this.sessionIndex) { this.sessionIndex = m.session; this.laps = {}; this.emit("session"); }
      this.focused = m.focused; this.sessionType = m.sessionType; this.replay = m.replay;
      if (!this.track && this.connId >= 0 && Date.now() - (this.askedTrack || 0) > 5000) { this.askedTrack = Date.now(); this.sendTo(idMsg(OUT.TRACK_DATA, this.connId)); }
    } else if (m.type === IN.CAR) this.onCar(m);
  }
  carOf(index) {
    const e = this.entries[index];
    if (!e && this.connId >= 0 && Date.now() - (this.askedEntries || 0) > 2000) { this.askedEntries = Date.now(); this.sendTo(idMsg(OUT.ENTRY_LIST, this.connId)); }
    return e ? carName(e.model) : "";
  }
  onCar(m) {
    this.cars[m.car] = m;
    if (m.car !== this.focused || this.replay) return;
    const car = this.carOf(m.car);
    // the lap counter went up: the last lap is finished
    const before = this.laps[m.car];
    this.laps[m.car] = m.laps;
    if (before !== undefined && m.laps === before + 1 && m.last.ms > 0 && this.track && car) {
      const sp = m.last.splits.slice(0, 3);
      const sectors = sp.length === 3 && sp.every(x => x > 0) ? sp : null;
      const lap = { game: this.game, track: this.track, car, timeInMs: m.last.ms, valid: !m.last.invalid, lapNum: m.laps, session: ["Practice", , , , "Qualifying", , , , , "Superpole", "Race", "Hotlap", "Hotstint", "Hotlap superpole"][this.sessionType] || "", sectors, position: m.position, outLap: m.last.outLap, inLap: m.last.inLap };
      this.lastLap = { ...lap, at: Date.now() };
      this.emit("lap", lap);
    }
    const cur = m.current, sp = cur.splits;
    this.live = {
      at: Date.now(), t: cur.ms, lapNum: m.laps + 1, distance: this.trackMeters ? m.spline * this.trackMeters : m.spline * 5000, spline: m.spline,
      sector: sp.filter(x => x > 0).length, s1: sp[0] || 0, s2: sp[1] || 0, invalid: cur.invalid, position: m.position, cars: Object.keys(this.cars).length,
      pit: m.location !== 1, track: this.track, car, race: this.sessionType === 10,
    };
    this.emit("car", this.live);
  }
  info() {
    const c = this.cfg || this.config();
    return { connected: this.connected && Date.now() - this.lastSeen < this.timeoutMs, live: !!(this.live && Date.now() - this.live.at < 3000), track: this.track, car: this.live ? this.live.car : "", error: this.error, port: c.port, configFound: c.found, needsSetup: !(c.port > 0), lastLap: this.lastLap };
  }
}

module.exports = { ACCTelemetry, parse, registerMsg, idMsg, readConfig, enableConfig, configFile, carName, trackName, CARS, IN, OUT, NO_TIME };
