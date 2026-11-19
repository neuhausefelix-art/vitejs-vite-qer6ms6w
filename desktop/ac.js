// Reads laps from Assetto Corsa's built-in UDP "remote telemetry" (port 9996).
// Lapbook asks the game for data (handshake), the game answers with car, track
// and driver, and then sends a short message every time a lap is completed.
// Read-only: nothing here touches the game process.
"use strict";
const { EventEmitter } = require("events");
const dgram = require("dgram");

const OP = { HANDSHAKE: 0, SUBSCRIBE_UPDATE: 1, SUBSCRIBE_SPOT: 2, DISMISS: 3 };
const SIZE = { HANDSHAKE_RESPONSE: 408, LAP: 212, CAR_INFO: 328 };

// AC strings are UTF-16, padded with zeros or "%" characters
function wstr(buf, off, bytes) {
  let s = buf.toString("utf16le", off, off + bytes);
  const cut = s.search(/[\u0000%]/);
  if (cut >= 0) s = s.slice(0, cut);
  return s.trim();
}

function request(op) {
  const b = Buffer.alloc(12);
  b.writeInt32LE(1, 0); // identifier: 1 = desktop client
  b.writeInt32LE(1, 4); // version
  b.writeInt32LE(op, 8);
  return b;
}

function parseHandshake(buf) {
  return {
    carId: wstr(buf, 0, 100),
    driver: wstr(buf, 100, 100),
    trackId: wstr(buf, 208, 100),
    config: wstr(buf, 308, 100),
  };
}

function parseLap(buf) {
  return {
    carIndex: buf.readInt32LE(0),
    lap: buf.readInt32LE(4),
    driver: wstr(buf, 8, 100),
    carId: wstr(buf, 108, 100),
    time: buf.readInt32LE(208),
  };
}

class ACTelemetry extends EventEmitter {
  constructor({ host = "127.0.0.1", port = 9996, names } = {}) {
    super();
    this.host = host;
    this.port = port;
    this.names = names || { car: id => id, track: (id, cfg) => (cfg ? `${id} ${cfg}` : id) };
    this.session = null; // { carId, driver, trackId, config, car, track }
    this.lastSeen = 0;
    this.lastLap = null;
    this.sent = new Set();
    this.sock = null;
    this.timer = null;
    this.lastAsk = 0;
  }

  get connected() {
    return Date.now() - this.lastSeen < 20000;
  }

  start() {
    if (this.sock) return;
    const s = dgram.createSocket("udp4");
    s.on("message", msg => this.handle(msg));
    s.on("error", err => this.emit("error", err));
    s.bind(0, "0.0.0.0", () => this.poke());
    this.sock = s;
    // ask again and again: the game only answers while a session is running,
    // and every new session in Content Manager starts a new game process
    this.timer = setInterval(() => this.poke(), 4000);
    this.timer.unref && this.timer.unref();
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
    if (this.sock) {
      try { this.sock.send(request(OP.DISMISS), this.port, this.host); } catch (e) {}
      try { this.sock.close(); } catch (e) {}
    }
    this.sock = null;
  }

  poke() {
    if (!this.sock) return;
    // refresh car and track every 15 s while connected, every 4 s while waiting
    if (this.connected && Date.now() - this.lastAsk < 15000) return;
    this.lastAsk = Date.now();
    try { this.sock.send(request(OP.HANDSHAKE), this.port, this.host); } catch (e) {}
  }

  handle(buf) {
    if (!Buffer.isBuffer(buf)) return;
    if (buf.length === SIZE.HANDSHAKE_RESPONSE) {
      const h = parseHandshake(buf);
      if (!h.carId || !h.trackId) return;
      const changed = !this.session || this.session.carId !== h.carId || this.session.trackId !== h.trackId || this.session.config !== h.config;
      this.session = { ...h, car: this.names.car(h.carId), track: this.names.track(h.trackId, h.config) };
      this.lastSeen = Date.now();
      if (changed) this.emit("session", this.session);
      try { this.sock && this.sock.send(request(OP.SUBSCRIBE_SPOT), this.port, this.host); } catch (e) {}
      return;
    }
    if (buf.length === SIZE.LAP) {
      this.lastSeen = Date.now();
      if (!this.session) return;
      const l = parseLap(buf);
      // in online races laps of other drivers arrive too: keep only your own
      if (this.session.driver && l.driver && l.driver !== this.session.driver) return;
      if (l.carId && l.carId !== this.session.carId) return;
      if (!(l.time > 0) || l.time > 3600000) return;
      const key = `${this.session.trackId}|${this.session.config}|${this.session.carId}|${l.lap}|${l.time}`;
      if (this.sent.has(key)) return;
      this.sent.add(key);
      this.lastLap = { track: this.session.track, car: this.session.car, timeInMs: l.time, at: Date.now() };
      this.emit("lap", {
        game: "Assetto Corsa",
        track: this.session.track,
        car: this.session.car,
        timeInMs: l.time,
        valid: true, // AC does not send whether a lap was cut
        lapNum: l.lap,
        session: "",
      });
      return;
    }
    if (buf.length === SIZE.CAR_INFO) this.lastSeen = Date.now();
  }

  info() {
    const s = this.session;
    return { connected: this.connected, lastSeen: this.lastSeen, car: s ? s.car : "", track: s ? s.track : "", carId: s ? s.carId : "", trackId: s ? s.trackId : "", lastLap: this.lastLap };
  }
}

module.exports = { ACTelemetry, OP, SIZE, wstr, request, parseHandshake, parseLap };
