// Checks the live delta and the sector colours.
"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { DeltaTracker } = require("../delta.js");

const drive = (d, key, lap, ms, len = 5000) => { for (let x = 0; x <= len; x += 25) d.sample(key, lap, x, (x / len) * ms); };

test("delta against the best lap, kept across sessions", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-"));
  const d = new DeltaTracker(dir);
  const key = "F1 25|Monza|McLaren MCL40";
  assert.strictEqual(d.delta(key, 100, 1000), null); // no best lap yet
  drive(d, key, 1, 80000);
  d.sample(key, 2, 0, 0); // next lap starts
  assert.ok(d.finish(key, 80000, true, [26000, 27000, 27000]).improved);
  // halfway at 40.5 s = 0.5 s slower than the best
  assert.strictEqual(d.delta(key, 2500, 40500), 500);
  assert.strictEqual(d.delta(key, 2500, 39800), -200);
  // a slower lap does not replace the best
  drive(d, key, 2, 81000);
  d.sample(key, 3, 0, 0);
  assert.ok(!d.finish(key, 81000, true, [26500, 27200, 27300]).improved);
  // invalid faster lap does not count either
  drive(d, key, 3, 79000);
  d.sample(key, 4, 0, 0);
  assert.ok(!d.finish(key, 79000, false, [25000, 27000, 27000]).improved);
  // a new app start reads the best lap from disk
  const d2 = new DeltaTracker(dir);
  assert.strictEqual(d2.delta(key, 2500, 40500), 500);
  assert.deepStrictEqual(d2.bestSectors(key), [26000, 27000, 27000]);
});

test("sector colours: purple best ever, green best this session, yellow slower", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-"));
  const d = new DeltaTracker(dir);
  const key = "x";
  assert.strictEqual(d.colour(key, 0, 30000), "purple"); // nothing to beat yet
  d.finish(key, 90000, true, [30000, 30000, 30000]);
  d.newSession(key);
  assert.strictEqual(d.colour(key, 0, 29900), "purple");
  assert.strictEqual(d.colour(key, 0, 30500), "green"); // first of this session
  d.finish(key, 91000, true, [30400, 30300, 30300]);
  assert.strictEqual(d.colour(key, 0, 30500), "yellow");
  assert.strictEqual(d.colour(key, 0, 30200), "green");
});
