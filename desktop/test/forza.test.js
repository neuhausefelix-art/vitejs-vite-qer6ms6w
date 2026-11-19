// Builds Forza Horizon "Data Out" packets and checks lap and route detection.
"use strict";
const test = require("node:test");
const assert = require("node:assert");
const { ForzaTelemetry, parse, placeholderCar } = require("../forza.js");

function pkt({ on = 1, ordinal = 3021, cls = 4, pi = 812, x = 0, z = 0, last = 0, current = 0, lap = 0, pos = 1, len = 324, ts = 0, speed = 30, dist = 0 } = {}) {
  const b = Buffer.alloc(len);
  const d = len === 324 ? 244 : 232;
  b.writeInt32LE(on, 0);
  b.writeUInt32LE(ts, 4);
  b.writeInt32LE(ordinal, 212);
  b.writeInt32LE(cls, 216);
  b.writeInt32LE(pi, 220);
  b.writeFloatLE(x, d);
  b.writeFloatLE(z, d + 8);
  b.writeFloatLE(speed, d + 12);
  b.writeFloatLE(dist, d + 48);
  b.writeFloatLE(last, d + 56);
  b.writeFloatLE(current, d + 60);
  b.writeUInt16LE(lap, d + 68);
  b.writeUInt8(pos, d + 70);
  return b;
}
module.exports = { pkt };

test("reads the Horizon and Motorsport layouts", () => {
  const h = parse(pkt({ x: 100, z: -50, last: 62.5, lap: 2, ordinal: 77 }));
  assert.deepStrictEqual([h.kind, h.x, h.z, h.last, h.lapNum, h.ordinal], ["horizon", 100, -50, 62.5, 2, 77]);
  assert.strictEqual(parse(pkt({ len: 331, lap: 3 })).lapNum, 3);
  assert.strictEqual(parse(Buffer.alloc(100)), null);
});

test("a lap is saved when the lap number goes up, routes are recognised by place", () => {
  const f = new ForzaTelemetry(), laps = [];
  f.raceLaps = true;
  f.on("lap", l => laps.push(l));
  const drive = (lap, last, x, z) => f.handle(pkt({ lap, last, x, z }));
  drive(0, 0, 500, 500); // race starts
  drive(0, 0, 400, 300);
  drive(1, 0, 10, 20); // crossed the line, time not there yet
  drive(1, 61.234, 12, 21); // time arrives one frame later
  drive(1, 61.234, 300, 300);
  drive(2, 60.9, 14, 18); // second lap, time in the same frame
  drive(2, 60.9, 200, 100);
  assert.deepStrictEqual(laps.map(l => [l.track, l.timeInMs]), [["Unnamed route 1", 61234], ["Unnamed route 1", 60900]]);
  assert.strictEqual(laps[0].car, placeholderCar(3021));
  assert.strictEqual(laps[0].carClass, "S1 812");
  // another race far away
  f.handle(pkt({ lap: 0, x: 5000, z: 5000, pos: 0 }));
  f.handle(pkt({ lap: 0, x: 5000, z: 5000 }));
  f.handle(pkt({ lap: 1, last: 120.5, x: 5000, z: 5010 }));
  f.handle(pkt({ lap: 1, last: 120.5, x: 5100, z: 5010 }));
  assert.strictEqual(laps[2].track, "Unnamed route 2");
});

test("named cars and routes are used, free roam and pause save nothing", () => {
  const f = new ForzaTelemetry(), laps = [];
  f.raceLaps = true;
  f.cars = { 3021: "Porsche 911 GT3 RS" };
  f.routes = { "Forza Horizon 6": [{ id: "a", n: 1, name: "Goliath", x: 0, z: 0 }] };
  f.on("lap", l => laps.push(l));
  f.handle(pkt({ lap: 0, pos: 0 })); // free roam
  f.handle(pkt({ lap: 1, pos: 0, last: 50 }));
  f.handle(pkt({ on: 0, lap: 2, pos: 1, last: 51 })); // paused
  f.handle(pkt({ lap: 4, pos: 1 }));
  f.handle(pkt({ lap: 5, pos: 1, last: 400.25, x: 20, z: -10 }));
  f.handle(pkt({ lap: 5, pos: 1, last: 400.25, x: 90, z: -10 }));
  assert.deepStrictEqual(laps.map(l => [l.track, l.car, l.timeInMs]), [["Goliath", "Porsche 911 GT3 RS", 400250]]);
});

// drives in a straight line along x at speed v (m/s), one packet every 50 ms
function straight(f, { from, to, v = 40, z = 0, t0 = 0, d0 = 0 }) {
  let t = t0, d = d0;
  const step = v * 0.05, dir = to > from ? 1 : -1;
  for (let x = from; dir > 0 ? x <= to : x >= to; x += step * dir) { f.handle(pkt({ x, z, ts: Math.round(t), speed: v, dist: d, pos: 0 })); t += 50; d += step; }
  return { t, d };
}

test("race laps are not saved unless switched on", () => {
  const f = new ForzaTelemetry(), laps = [];
  f.on("lap", l => laps.push(l));
  f.handle(pkt({ lap: 0 })); f.handle(pkt({ lap: 1 })); f.handle(pkt({ lap: 1, last: 61 })); f.handle(pkt({ lap: 1, last: 61 }));
  assert.strictEqual(laps.length, 0);
});

test("time trial: record once, then every pass in the same direction is timed", () => {
  const f = new ForzaTelemetry(), laps = [];
  f.on("lap", l => laps.push(l));
  // drive towards the start, press the hotkey at x=0, drive 2 km, press again
  let s = straight(f, { from: -200, to: 0, v: 40 });
  assert.strictEqual(f.mark().state, "recording");
  s = straight(f, { from: 2, to: 2000, v: 40, t0: s.t, d0: s.d });
  const r = f.mark();
  assert.strictEqual(r.state, "saved");
  assert.strictEqual(r.segment.kind, "run");
  assert.strictEqual(laps.length, 1);
  assert.ok(Math.abs(laps[0].timeInMs - 50000) < 200, laps[0].timeInMs);
  // drive away, come back and do it again faster (50 m/s): 40 s
  s = straight(f, { from: 2100, to: 3000, v: 40, t0: s.t + 1000, d0: s.d });
  s = straight(f, { from: -300, to: 2200, v: 50, t0: s.t + 60000, d0: s.d });
  assert.strictEqual(laps.length, 2);
  assert.strictEqual(laps[1].track, "Unnamed time trial 1");
  assert.ok(Math.abs(laps[1].timeInMs - 40000) < 200, laps[1].timeInMs);
  // the wrong way round does not start it
  straight(f, { from: 2200, to: -300, v: 50, t0: s.t + 5000, d0: s.d });
  assert.strictEqual(laps.length, 2);
});

test("drag run: recorded from a standstill, timed from the launch", () => {
  const f = new ForzaTelemetry(), laps = [];
  f.on("lap", l => laps.push(l));
  for (let i = 0; i < 20; i++) f.handle(pkt({ x: 0, z: 0, ts: i * 50, speed: 0, dist: 0, pos: 0 }));
  assert.strictEqual(f.mark().standing, true);
  for (let i = 0; i < 20; i++) f.handle(pkt({ x: 0, z: 0, ts: 1000 + i * 50, speed: 0, dist: 0, pos: 0 })); // waiting for green
  let s = straight(f, { from: 0.5, to: 400, v: 40, t0: 2000, d0: 0.5 }); // 10 s
  const r = f.mark();
  assert.strictEqual(r.segment.kind, "drag");
  assert.ok(Math.abs(laps[0].timeInMs - 10000) < 200, laps[0].timeInMs);
  // later: stop at the start, launch, finish
  for (let i = 0; i < 10; i++) f.handle(pkt({ x: 1, z: 0, ts: 100000 + i * 50, speed: 0, dist: 5000, pos: 0 }));
  straight(f, { from: 1.5, to: 450, v: 50, t0: 100500, d0: 5000.5 });
  assert.strictEqual(laps.length, 2);
  assert.strictEqual(laps[1].track, "Unnamed drag 1");
  assert.ok(Math.abs(laps[1].timeInMs - 8000) < 200, laps[1].timeInMs);
});
