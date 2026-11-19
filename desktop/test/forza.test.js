// Builds Forza Horizon "Data Out" packets and checks lap and route detection.
"use strict";
const test = require("node:test");
const assert = require("node:assert");
const { ForzaTelemetry, parse, placeholderCar } = require("../forza.js");

function pkt({ on = 1, ordinal = 3021, cls = 4, pi = 812, x = 0, z = 0, last = 0, current = 0, lap = 0, pos = 1, len = 324 } = {}) {
  const b = Buffer.alloc(len);
  const d = len === 324 ? 244 : 232;
  b.writeInt32LE(on, 0);
  b.writeInt32LE(ordinal, 212);
  b.writeInt32LE(cls, 216);
  b.writeInt32LE(pi, 220);
  b.writeFloatLE(x, d);
  b.writeFloatLE(z, d + 8);
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
