// Reads Forza's official "Data Out" UDP telemetry (Forza Horizon 4/5/6 and Forza
// Motorsport). Read-only: the game sends these packets once Data Out is switched
// on in its settings. Nothing here touches the game process.
//
// Forza sends no car name, no track name and not what you are doing (race,
// Trailblazer, drag strip, free roam all look the same). So:
// - Cars come as a number (car ordinal); you name each car once.
// - Time trials: you record a run once (start and finish point, hotkey), and from
//   then on every pass through that start, in the same direction, is timed until
//   the finish. A run recorded from a standstill is a drag run: it is timed from
//   the moment the car moves, like a drag strip.
// - Race laps (optional): races are recognised by where the finish line is.
"use strict";
const { EventEmitter } = require("events");

const CLASSES = ["D", "C", "B", "A", "S1", "S2", "X", "X"];
const NEAR = 45; // metres: laps ending this close belong to the same route

// Horizon "dash" packets are 324 bytes with 12 extra bytes after the car data;
// Motorsport sends 311 (Forza Motorsport 7) or 331 (Forza Motorsport 2023).
function layout(len) {
  // Horizon 6 documents the 12 bytes after the car data (CarGroup, SmashableVelDiff, SmashableMass)
  if (len === 324 || len === 323) return { dash: 244, kind: "horizon" };
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
    ts: buf.readUInt32LE(4), // game clock in ms
    ordinal: buf.readInt32LE(212),
    cls: buf.readInt32LE(216),
    pi: buf.readInt32LE(220),
    x: buf.readFloatLE(d),
    y: buf.readFloatLE(d + 4),
    z: buf.readFloatLE(d + 8),
    speed: buf.readFloatLE(d + 12),
    distance: buf.readFloatLE(d + 48),
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
    this.raceLaps = false; // also save laps of normal races
    this.segments = {}; // game -> [{ id, n, name, kind: "run" | "drag", start, dir, finish, len }]
    this.rec = null; // recording a new time trial
    this.run = null; // timing a known time trial
    this.near = {}; // segment id -> closest approach to its start
    this.armed = {}; // drag: car stood still at the start
    this.prevP = null;
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
    if (!p.on) { // menu or paused: a running time trial does not count
      if (this.run) { this.run = null; this.emit("run", null); }
      return;
    }
    this.cur = p;
    this.trials(p);
    const inRace = p.racePos > 0;
    // metres driven since this lap started, for the live delta
    if (!this.lapStart || this.lapStart.lap !== p.lapNum || !inRace) this.lapStart = { lap: p.lapNum, dist: p.distance };
    this.live = { current: Math.round(p.current * 1000), lapNum: p.lapNum, inRace, x: p.distance - this.lapStart.dist, racePos: p.racePos, at: Date.now() };

    // a lap has ended: LapNumber went up. The new LastLap can arrive a frame later.
    if (this.pending) {
      const pd = this.pending;
      if ((p.last > 0 && Math.abs(p.last - pd.lastBefore) > 0.0005) || Date.now() - pd.at > 600) {
        this.pending = null;
        if (p.last > 1 && this.raceLaps) this.finish(pd, p.last);
      }
    }
    if (inRace && this.prevLap !== null && p.lapNum === this.prevLap + 1) {
      this.pending = { x: p.x, z: p.z, at: Date.now(), lastBefore: this.prevLast, ordinal: p.ordinal, label: carLabel(p) };
    }
    this.prevLap = inRace ? p.lapNum : null;
    this.prevLast = p.last;
  }

  // ---------- time trials ----------
  list() {
    return (this.segments[this.game] = this.segments[this.game] || []);
  }

  // hotkey: first press marks the start, second press the finish
  mark() {
    const p = this.cur;
    if (!p || Date.now() - this.lastPacket > 3000) return { state: "nodata" };
    if (!this.rec) {
      const dir = this.heading();
      this.run = null;
      this.rec = { start: { x: p.x, z: p.z }, dir, ts0: p.ts, dist0: p.distance, standing: p.speed < 1, launch: null, ordinal: p.ordinal, label: carLabel(p) };
      this.emit("rec", this.rec);
      return { state: "recording", standing: this.rec.standing };
    }
    const r = this.rec;
    this.rec = null;
    const t0 = r.standing ? r.launch : r.ts0;
    const len = p.distance - (r.standing && r.launchDist !== undefined ? r.launchDist : r.dist0);
    if (!t0 || p.ts - t0 < 2000 || len < 50) { this.emit("rec", null); return { state: "tooShort" }; }
    const list = this.list();
    const n = list.reduce((m, x) => Math.max(m, x.n || 0), 0) + 1;
    const kind = r.standing ? "drag" : "run";
    const seg = { id: `${Date.now().toString(36)}t${n}`, n, kind, name: kind === "drag" ? `Unnamed drag ${n}` : `Unnamed time trial ${n}`, start: r.start, dir: r.dir || this.heading(), finish: { x: p.x, z: p.z }, len: Math.round(len) };
    list.push(seg);
    this.emit("segments", this.segments);
    this.emit("rec", null);
    this.saveRun(seg, p.ts - t0, p.ordinal, carLabel(p));
    return { state: "saved", segment: seg };
  }

  cancelRecording() {
    this.rec = null;
    this.emit("rec", null);
  }

  heading() {
    const a = this.prevP, b = this.cur;
    if (!a || !b) return null;
    const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz);
    return l > 0.05 ? { x: dx / l, z: dz / l } : null;
  }

  trials(p) {
    const prev = this.prevP;
    this.prevP = p;
    const R = 20;
    if (this.rec) {
      // standing start: time from the moment the car moves
      if (this.rec.standing && !this.rec.launch && p.speed > 0.8) { this.rec.launch = p.ts; this.rec.launchDist = p.distance; }
      if (p.ts - this.rec.ts0 > 20 * 60e3) this.cancelRecording();
      return;
    }
    const mv = prev ? { x: p.x - prev.x, z: p.z - prev.z } : null;
    const along = seg => !seg.dir || !mv || Math.hypot(mv.x, mv.z) < 0.01 || (mv.x * seg.dir.x + mv.z * seg.dir.z) / Math.hypot(mv.x, mv.z) > 0.5;
    if (this.run) {
      const r = this.run, seg = r.seg, d = Math.hypot(p.x - seg.finish.x, p.z - seg.finish.z);
      if (p.ts - r.t0 > Math.max(15 * 60e3, (r.best || 0) * 3)) { this.run = null; this.emit("run", null); return; }
      this.run.x = p.distance - r.dist0;
      this.run.t = p.ts - r.t0;
      const far = p.distance - r.dist0 > Math.min(100, seg.len * 0.5);
      if (d < R && far) {
        if (!r.fin || d < r.fin.d) r.fin = { d, ts: p.ts };
      } else if (r.fin) {
        // passed the finish: take the closest moment
        const t = r.fin.ts - r.t0;
        this.run = null;
        this.emit("run", null);
        this.saveRun(seg, t, p.ordinal, carLabel(p));
      }
      return;
    }
    for (const seg of this.list()) {
      const d = Math.hypot(p.x - seg.start.x, p.z - seg.start.z);
      if (seg.kind === "drag") {
        if (d < R && p.speed < 0.5) this.armed[seg.id] = true;
        else if (this.armed[seg.id] && p.speed >= 0.8 && d < R + 15) { delete this.armed[seg.id]; this.begin(seg, p.ts, p.distance); return; }
        else if (d >= R + 15) delete this.armed[seg.id];
        continue;
      }
      const nr = this.near[seg.id];
      if (d < R && along(seg)) {
        if (!nr || d < nr.d) this.near[seg.id] = { d, ts: p.ts, dist: p.distance };
      } else if (nr) {
        delete this.near[seg.id];
        // went through the start line: the run began at the closest moment
        if (d >= R || !along(seg)) { this.begin(seg, nr.ts, nr.dist); return; }
      }
    }
  }

  begin(seg, t0, dist0) {
    this.run = { seg, t0, dist0, t: 0, x: 0, best: this.bestOf ? this.bestOf(seg) : 0 };
    this.near = {};
    this.emit("run", { segment: seg.name, kind: seg.kind });
  }

  saveRun(seg, ms, ordinal, label) {
    if (!(ms > 500)) return;
    const lap = { game: this.game, track: seg.name, segmentId: seg.id, trial: seg.kind, car: this.carName(ordinal), ordinal, carClass: label, timeInMs: Math.round(ms), valid: true, session: label };
    this.lastLap = { track: lap.track, car: lap.car, timeInMs: lap.timeInMs, at: Date.now() };
    this.emit("lap", lap);
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
      lastSegment: this.lastLap ? this.list().find(r => r.name === this.lastLap.track) || null : null,
      recording: this.rec ? { standing: this.rec.standing, launched: !!this.rec.launch } : null,
      run: this.run ? { name: this.run.seg.name, kind: this.run.seg.kind, t: this.run.t } : null,
      segments: this.list().length,
      raceLaps: this.raceLaps,
      near,
    };
  }
}

module.exports = { ForzaTelemetry, parse, layout, placeholderCar, CLASSES, NEAR };
