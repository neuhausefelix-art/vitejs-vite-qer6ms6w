// Reads Forza's official "Data Out" UDP telemetry (Forza Horizon 4/5/6 and Forza
// Motorsport). Read-only: the game sends these packets once Data Out is switched
// on in its settings. Nothing here touches the game process.
//
// Forza sends no car name and no track name. Cars come as a number (car ordinal),
// so you name each car once. Races are recognised by where the finish line is:
// the first lap at a new place creates an unnamed route, every later lap that
// ends within a few metres of it belongs to the same route.
"use strict";
const { EventEmitter } = require("events");

const CLASSES = ["D", "C", "B", "A", "S1", "S2", "X", "X"];
const NEAR = 45; // metres: laps ending this close belong to the same route

// Horizon "dash" packets are 324 bytes with 12 extra bytes after the car data;
// Motorsport sends 311 (Forza Motorsport 7) or 331 (Forza Motorsport 2023).
function layout(len) {
  if (len === 324) return { dash: 244, kind: "horizon" };
  if (len === 311 || len === 331) return { dash: 232, kind: "motorsport" };
  return null;
}

function parse(buf) {
  const L = layout(buf.length);
  if (!L) return null;
  const d = L.dash;
  return {
    kind: L.kind,
    on: buf.readInt32LE(0) === 1,
    ordinal: buf.readInt32LE(212),
    cls: buf.readInt32LE(216),
    pi: buf.readInt32LE(220),
    x: buf.readFloatLE(d),
    y: buf.readFloatLE(d + 4),
    z: buf.readFloatLE(d + 8),
    speed: buf.readFloatLE(d + 12),
    best: buf.readFloatLE(d + 52),
    last: buf.readFloatLE(d + 56),
    current: buf.readFloatLE(d + 60),
    raceTime: buf.readFloatLE(d + 64),
    lapNum: buf.readUInt16LE(d + 68),
    racePos: buf.readUInt8(d + 70),
  };
}

const carLabel = p => `${CLASSES[p.cls] || "?"} ${p.pi}`;
const placeholderCar = ordinal => `Forza car #${ordinal}`;

class ForzaTelemetry extends EventEmitter {
  constructor() {
    super();
    this.game = "Forza Horizon 6"; // set from outside (running process or setting)
    this.cars = {}; // ordinal -> your name
    this.routes = {}; // game -> [{ id, name, x, z }]
    this.lastPacket = 0;
    this.unsupported = 0;
    this.kind = "";
    this.cur = null; // last packet while driving
    this.prevLap = null;
    this.pending = null; // lap that just ended, waiting for its time
    this.live = null; // { current, lapNum, inRace, at } for the overlay
    this.lastLap = null;
  }

  carName(ordinal) {
    return this.cars[ordinal] || placeholderCar(ordinal);
  }

  // finds the route whose finish line is near (x, z), or creates a new one
  route(x, z) {
    const list = (this.routes[this.game] = this.routes[this.game] || []);
    let best = null, bd = Infinity;
    for (const r of list) {
      const dd = Math.hypot(r.x - x, r.z - z);
      if (dd < bd) { bd = dd; best = r; }
    }
    if (best && bd <= NEAR) return { route: best, created: false };
    const n = list.reduce((m, r) => Math.max(m, r.n || 0), 0) + 1;
    const r = { id: `${Date.now().toString(36)}${n}`, n, name: `Unnamed route ${n}`, x: Math.round(x * 10) / 10, z: Math.round(z * 10) / 10 };
    list.push(r);
    return { route: r, created: true };
  }

  handle(buf) {
    if (!Buffer.isBuffer(buf)) return;
    const p = parse(buf);
    if (!p) {
      this.unsupported = buf.length;
      return;
    }
    this.lastPacket = Date.now();
    this.kind = p.kind;
    if (!p.on) return; // menu or paused
    this.cur = p;
    const inRace = p.racePos > 0;
    this.live = { current: Math.round(p.current * 1000), lapNum: p.lapNum, inRace, at: Date.now() };

    // a lap has ended: LapNumber went up. The new LastLap can arrive a frame later.
    if (this.pending) {
      const pd = this.pending;
      if ((p.last > 0 && Math.abs(p.last - pd.lastBefore) > 0.0005) || Date.now() - pd.at > 600) {
        this.pending = null;
        if (p.last > 1) this.finish(pd, p.last);
      }
    }
    if (inRace && this.prevLap !== null && p.lapNum === this.prevLap + 1) {
      this.pending = { x: p.x, z: p.z, at: Date.now(), lastBefore: this.prevLast, ordinal: p.ordinal, label: carLabel(p) };
    }
    this.prevLap = inRace ? p.lapNum : null;
    this.prevLast = p.last;
  }

  finish(pd, lastSec) {
    const { route, created } = this.route(pd.x, pd.z);
    if (created) this.emit("routes", this.routes);
    const lap = {
      game: this.game,
      track: route.name,
      routeId: route.id,
      car: this.carName(pd.ordinal),
      ordinal: pd.ordinal,
      carClass: pd.label,
      timeInMs: Math.round(lastSec * 1000),
      valid: true, // Forza does not send whether a lap was clean
      session: pd.label,
    };
    this.lastLap = { track: lap.track, car: lap.car, timeInMs: lap.timeInMs, at: Date.now() };
    this.emit("lap", lap);
  }

  info() {
    const p = this.cur;
    const fresh = Date.now() - this.lastPacket < 5000;
    let near = null;
    if (p && fresh) {
      const list = this.routes[this.game] || [];
      near = list.find(r => Math.hypot(r.x - p.x, r.z - p.z) <= NEAR) || null;
    }
    return {
      live: fresh,
      game: this.game,
      kind: this.kind,
      unsupported: this.unsupported,
      inRace: !!(p && p.racePos > 0 && fresh),
      ordinal: p ? p.ordinal : null,
      car: p ? this.carName(p.ordinal) : "",
      carKnown: p ? !!this.cars[p.ordinal] : true,
      carClass: p ? carLabel(p) : "",
      lastLap: this.lastLap,
      lastRoute: this.lastLap ? (this.routes[this.game] || []).find(r => r.name === this.lastLap.track) || null : null,
      near,
    };
  }
}

module.exports = { ForzaTelemetry, parse, layout, placeholderCar, CLASSES, NEAR };
