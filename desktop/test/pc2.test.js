"use strict";
const test = require("node:test");
const assert = require("node:assert");
const { PC2Telemetry, parseVehicles } = require("../pc2.js");
const { pc2 } = require("./simpackets.js");

test("PC2: vehicle names, padded or packed", () => {
  assert.deepEqual(parseVehicles(pc2.vehicles([[5, "McLaren 720S GT3"]])), [{ index: 5, name: "McLaren 720S GT3" }]);
  assert.deepEqual(parseVehicles(pc2.vehicles([[5, "Audi R8"]], true)), [{ index: 5, name: "Audi R8" }]);
});
test("PC2: a lap with sectors, time from the time-stats packet", () => {
  const t = new PC2Telemetry(), laps = [];
  t.on("lap", l => laps.push(l));
  t.handle(pc2.gameState(1)); t.handle(pc2.race()); t.handle(pc2.vehicles());
  t.handle(pc2.timings({ lap: 1, current: 1, sector: 1 }));
  t.handle(pc2.timings({ lap: 1, current: 20.5, sector: 2 }));
  t.handle(pc2.timings({ lap: 1, current: 45.25, sector: 3, distance: 1500 }));
  assert.equal(t.live.sector, 2); assert.equal(t.live.s1, 20500); assert.equal(t.live.s2, 24750); assert.equal(t.live.distance, 1500);
  t.handle(pc2.timings({ lap: 1, current: 59.9, sector: 3 }));
  t.handle(pc2.timings({ lap: 2, current: 0.1, sector: 1 }));
  assert.equal(laps.length, 0, "waits for the exact time");
  t.handle(pc2.stats(60.012));
  assert.equal(laps.length, 1);
  assert.equal(laps[0].track, "Brands Hatch Indy"); assert.equal(laps[0].car, "McLaren 720S GT3");
  assert.equal(laps[0].timeInMs, 60012); assert.deepEqual(laps[0].sectors, [20500, 24750, 14762]); assert.equal(laps[0].valid, true); assert.equal(laps[0].session, "Practice");
});
test("PC2: invalid lap and the fallback time", async () => {
  const t = new PC2Telemetry({ statsWaitMs: 30 }), laps = [];
  t.on("lap", l => laps.push(l));
  t.handle(pc2.gameState(5)); t.handle(pc2.race("Spa", "Grand Prix")); t.handle(pc2.vehicles());
  t.handle(pc2.timings({ lap: 3, current: 5 }));
  t.handle(pc2.timings({ lap: 3, current: 30, invalid: true }));
  t.handle(pc2.timings({ lap: 3, current: 140.5, invalid: false }));
  t.handle(pc2.timings({ lap: 4, current: 0.2 }));
  await new Promise(r => setTimeout(r, 50));
  t.handle(pc2.timings({ lap: 4, current: 0.3 }));
  assert.equal(laps.length, 1); assert.equal(laps[0].valid, false); assert.equal(laps[0].timeInMs, 140500); assert.equal(laps[0].exact, false);
  assert.equal(t.live.race, true); assert.equal(t.live.position, 3);
});
