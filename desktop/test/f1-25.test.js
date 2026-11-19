// Builds packets the way F1 25 lays them out and checks the parser.
"use strict";
const test = require("node:test");
const assert = require("node:assert");
const { F1Telemetry } = require("../f1-25.js");
const { session, participants, history } = require("./packets.js");

test("history packet is 1460 bytes like the F1 25 spec", () => {
  assert.strictEqual(history({}, [], []).length, 1460);
});

test("emits each finished lap once, with track, car, tyre and weather", () => {
  const t = new F1Telemetry(), got = [];
  t.on("lap", l => got.push(l));
  const opt = { player: 3 };
  t.handle(session(opt, { trackId: 11, weather: 1, type: 18 }));
  t.handle(participants(opt, 8));
  t.handle(history(opt, [[81234, true], [0, true]], [[255, 16]]));
  t.handle(history(opt, [[81234, true], [80999, false], [0, true]], [[255, 16]]));
  t.handle(history(opt, [[81234, true], [80999, false], [0, true]], [[255, 16]]));
  assert.strictEqual(got.length, 2);
  assert.deepStrictEqual(
    { track: got[0].track, car: got[0].car, ms: got[0].timeInMs, valid: got[0].valid, tire: got[0].tire, w: got[0].weather, s: got[0].session },
    { track: "Monza", car: "McLaren MCL39", ms: 81234, valid: true, tire: "soft", w: "light_cloud", s: "Time Trial" }
  );
  assert.strictEqual(got[1].valid, false);
  assert.strictEqual(got[1].lapNum, 2);
});

test("ignores other cars and waits until track and car are known", () => {
  const t = new F1Telemetry(), got = [];
  t.on("lap", l => got.push(l));
  const opt = { player: 0 };
  t.handle(history(opt, [[90000, true]], [[255, 17]])); // nothing known yet
  t.handle(session(opt));
  t.handle(history(opt, [[90000, true]], [[255, 17]], 5)); // another car
  assert.strictEqual(got.length, 0);
  t.handle(participants(opt, 1));
  t.handle(history(opt, [[90000, true]], [[255, 17]]));
  assert.strictEqual(got.length, 1);
  assert.strictEqual(got[0].car, "Ferrari SF-25");
  assert.strictEqual(got[0].tire, "medium");
});

test("tyre follows the stint the lap was driven in", () => {
  const t = new F1Telemetry(), got = [];
  t.on("lap", l => got.push(l));
  const opt = {};
  t.handle(session(opt, { type: 15 }));
  t.handle(participants(opt, 2));
  t.handle(history(opt, [[90000, true], [91000, true], [92000, true], [0, true]], [[2, 16], [255, 18]]));
  assert.deepStrictEqual(got.map(l => l.tire), ["soft", "soft", "hard"]);
  assert.strictEqual(got[0].session, "Race");
});

test("a new session forgets the old track and car", () => {
  const t = new F1Telemetry(), got = [];
  t.on("lap", l => got.push(l));
  t.handle(session({ uid: 1n }, { trackId: 7 }));
  t.handle(participants({ uid: 1n }, 0));
  t.handle(history({ uid: 2n }, [[85000, true]], [[255, 16]]));
  assert.strictEqual(got.length, 0);
});

test("ignores packets from other games or years", () => {
  const t = new F1Telemetry(), bad = [];
  t.on("unsupported", f => bad.push(f));
  t.handle(session({ format: 2023 }));
  t.handle(Buffer.alloc(5));
  assert.deepStrictEqual(bad, [2023]);
});

test("2026 McLaren (team 228) and your own names", () => {
  const { carName, unknownCar } = require("../f1-25.js");
  assert.strictEqual(carName(228), "McLaren MCL40");
  assert.strictEqual(carName(8), "McLaren MCL39");
  assert.strictEqual(carName(230), "Cadillac 2026");
  assert.strictEqual(carName(250), unknownCar(250));
  assert.strictEqual(carName(250, { 250: "Konnersport" }), "Konnersport");
  const t = new F1Telemetry(), got = [];
  t.names = { 251: "APXGP" };
  t.on("lap", l => got.push(l));
  t.handle(session({}));
  t.handle(participants({}, 251));
  t.handle(history({}, [[90000, true]], [[255, 16]]));
  assert.strictEqual(got[0].car, "APXGP");
  assert.strictEqual(got[0].teamId, 251);
});

test("running lap time for the overlay", () => {
  const { lapData } = require("./packets.js");
  const t = new F1Telemetry();
  t.handle(lapData({ player: 2 }, { last: 81000, current: 12345, lapNum: 4, invalid: 1 }));
  assert.strictEqual(lapData({}).length, 1285);
  const { last, current, lapNum, invalid } = t.live;
  assert.deepStrictEqual({ last, current, lapNum, invalid }, { last: 81000, current: 12345, lapNum: 4, invalid: true });
});

test("sectors of each lap and the race result", () => {
  const { final, lapData } = require("./packets.js");
  const t = new F1Telemetry(), laps = [], races = [];
  t.on("lap", l => laps.push(l));
  t.on("race", r => races.push(r));
  t.handle(session({}, { type: 15, trackId: 11 }));
  t.handle(participants({}, 228));
  t.handle(history({}, [[81234, true, [27100, 28050, 26084]], [0, true]], [[255, 16]]));
  assert.deepStrictEqual(laps[0].sectors, [27100, 28050, 26084]);
  t.handle(lapData({}, { current: 30000, distance: 1234.5, position: 4, sector: 1, s1: 27000 }));
  assert.deepStrictEqual([t.live.distance, t.live.position, t.live.sector, t.live.s1], [1234.5, 4, 1, 27000]);
  t.handle(final({}, { finish: 3, start: 7, laps: 10, cars: 20 }));
  t.handle(final({}, { finish: 3 })); // only once per race
  assert.strictEqual(races.length, 1);
  assert.deepStrictEqual([races[0].track, races[0].car, races[0].finish, races[0].start, races[0].field, races[0].laps, races[0].dnf], ["Monza", "McLaren MCL40", 3, 7, 19, 10, false]);
});
