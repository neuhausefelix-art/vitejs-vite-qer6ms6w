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

// ---- career championship ----
const C = require("./packets.js");
const GRID = [{ name: "Felix", teamId: 8, driverId: 255, ai: false }, { name: "OSCAR PIASTRI", teamId: 8, driverId: 9 }, { name: "Max Verstappen", teamId: 2, driverId: 3 }];
test("F1 25 career: every session sends the full result with season and weekend", () => {
  const { F1Telemetry } = require("../f1-25.js");
  const t = new F1Telemetry(), cls = [], races = [];
  t.on("classification", x => cls.push(x)); t.on("race", x => races.push(x));
  // qualifying
  let o = { player: 0, uid: 101n };
  t.handle(C.careerSession(o, { type: 7, weekend: 5, structure: [1, 5, 6, 7, 15] })); t.handle(C.participantsAll(o, GRID));
  t.handle(C.finalAll(o, [{ position: 2 }, { position: 1 }, { position: 3 }]));
  // race
  o = { player: 0, uid: 102n };
  t.handle(C.careerSession(o, { type: 15, weekend: 5, structure: [1, 5, 6, 7, 15] })); t.handle(C.participantsAll(o, GRID));
  const fin = C.finalAll(o, [{ position: 1, grid: 2, points: 25, best: 81234 }, { position: 2, points: 18 }, { position: 3, points: 15, status: 5 }]);
  t.handle(fin); t.handle(fin); // the game repeats it
  assert.equal(cls.length, 2);
  assert.deepEqual([cls[0].kind, cls[0].season, cls[0].weekend, cls[0].mode, cls[0].session], ["qualifying", 777, 5, "Driver Career", "Q3"]);
  assert.deepEqual(cls[1].cars.map(c => [c.position, c.name, c.team, c.points, c.status, c.me, c.key]), [[1, "Felix", "McLaren", 25, "", true, "n:Felix"], [2, "Oscar Piastri", "McLaren", 18, "", false, "d9"], [3, "Max Verstappen", "Red Bull Racing", 15, "DNF", false, "d3"]]);
  assert.equal(cls[1].cars[0].best, 81234, "best lap is read after the F1 25 result reason byte");
  assert.equal(races.length, 1); assert.equal(races[0].bestLap, 81234); assert.equal(races[0].career.kind, "race");
});
test("F1 25 career: sprint weekend, sprint and Grand Prix apart", () => {
  const { F1Telemetry } = require("../f1-25.js");
  const t = new F1Telemetry(), cls = [];
  t.on("classification", x => cls.push(x));
  const st = [1, 10, 11, 12, 15, 5, 6, 7, 16];
  [[15, 201n], [16, 202n]].forEach(([type, uid]) => { const o = { player: 0, uid }; t.handle(C.careerSession(o, { type, structure: st })); t.handle(C.participantsAll(o, GRID)); t.handle(C.finalAll(o, [{ position: 1, points: 8 }, { position: 2, points: 7 }, { position: 3, points: 6 }])); });
  assert.deepEqual(cls.map(c => [c.kind, c.sprintWeekend]), [["sprint", true], ["race", true]]);
});
test("F1 25: no championship outside the career, races still logged", () => {
  const { F1Telemetry } = require("../f1-25.js");
  const t = new F1Telemetry(), cls = [], races = [];
  t.on("classification", x => cls.push(x)); t.on("race", x => races.push(x));
  const o = { player: 0, uid: 301n };
  t.handle(C.careerSession(o, { type: 15, mode: 3 })); t.handle(C.participantsAll(o, GRID)); t.handle(C.finalAll(o, [{ position: 2 }, { position: 1 }, { position: 3 }]));
  assert.equal(cls.length, 0); assert.equal(races.length, 1); assert.equal(races[0].career, null);
});
test("F1 25 career: practice without a final result uses the last live order", () => {
  const { F1Telemetry } = require("../f1-25.js");
  const t = new F1Telemetry(), cls = [];
  t.on("classification", x => cls.push(x));
  const o = { player: 0, uid: 401n };
  t.handle(C.careerSession(o, { type: 1 })); t.handle(C.participantsAll(o, GRID));
  const ld = C.lapData(o, { position: 3 }); ld.writeUInt8(1, 29 + 57 + 32); ld.writeUInt8(2, 29 + 2 * 57 + 32); t.handle(ld);
  t.handle(C.careerSession({ player: 0, uid: 402n }, { type: 5 })); // next session starts
  assert.equal(cls.length, 1); assert.equal(cls[0].kind, "practice"); assert.equal(cls[0].source, "live");
  assert.deepEqual(cls[0].cars.map(c => c.name), ["Oscar Piastri", "Max Verstappen", "Felix"]);
});
