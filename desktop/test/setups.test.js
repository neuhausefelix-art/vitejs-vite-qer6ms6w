"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs"), os = require("os"), path = require("path");
const S = require("../setups.js");
global.window = {};
require("../app/setup-catalog.js");
const C = window.SetupCatalog;

// a full AC setup with every area, plus a mod field
const AC_INI = `[CAR]
MODEL=ks_porsche_911_gt3_r_2016
[TYRES]
VALUE=1
${["LF", "RF", "LR", "RR"].map(w => `[PRESSURE_${w}]\nVALUE=26\n[CAMBER_${w}]\nVALUE=-30\n[TOE_OUT_${w}]\nVALUE=2\n[SPRING_RATE_${w}]\nVALUE=5\n[ROD_LENGTH_${w}]\nVALUE=10\n[PACKER_RANGE_${w}]\nVALUE=3\n[DAMP_BUMP_${w}]\nVALUE=4\n[DAMP_FAST_BUMP_${w}]\nVALUE=6\n[DAMP_REBOUND_${w}]\nVALUE=7\n[DAMP_FAST_REBOUND_${w}]\nVALUE=8`).join("\n")}
[WING_1]
VALUE=3
[WING_2]
VALUE=8
[ARB_FRONT]
VALUE=4
[ARB_REAR]
VALUE=2
[DIFF_POWER]
VALUE=40
[DIFF_COAST]
VALUE=30
[DIFF_PRELOAD]
VALUE=60
[FINAL_RATIO]
VALUE=2
${[2, 3, 4, 5, 6].map(g => `[INTERNAL_GEAR_${g}]\nVALUE=${g}`).join("\n")}
[FRONT_BIAS]
VALUE=57
[BRAKE_POWER_MULT]
VALUE=95
[ABS]
VALUE=3
[TRACTION_CONTROL]
VALUE=2
[TURBO_0]
VALUE=100
[FUEL]
VALUE=40
[MOD_SPECIAL_THING]
VALUE=9
[__EXT_PATCH]
VALUE=0.1
`;
const ACC_JSON = { carName: "bmw_m4_gt3", basicSetup: { tyres: { tyreCompound: 0, tyrePressure: [55, 56, 57, 58] }, alignment: { camber: [1, 2, 3, 4], toe: [5, 6, 7, 8], casterLF: 30, casterRF: 31, steerRatio: 2 }, electronics: { tC1: 5, tC2: 3, abs: 4, eCUMap: 1, fuelMix: 0, telemetryLaps: 0 }, strategy: { fuel: 60, nPitStops: 0, tyreSet: 0, frontBrakePadCompound: 1, rearBrakePadCompound: 1, pitStrategy: [{ fuelToAdd: 10 }] } }, advancedSetup: { mechanicalBalance: { aRBFront: 5, aRBRear: 3, wheelRate: [1, 1, 2, 2], bumpStopRateUp: [3, 3, 3, 3], bumpStopRateDn: [4, 4, 4, 4], bumpStopWindow: [5, 5, 5, 5], brakeTorque: 20, brakeBias: 52 }, dampers: { bumpSlow: [1, 2, 3, 4], bumpFast: [5, 6, 7, 8], reboundSlow: [9, 10, 11, 12], reboundFast: [13, 14, 15, 16] }, aeroBalance: { rideHeight: [10, 20, 30, 40], rodLength: [1, 1, 1, 1], splitter: 0, rearWing: 5, brakeDuct: [2, 3] }, drivetrain: { preload: 10 } } };

test("AC setup: every option of the file is read and gets an area", () => {
  const v = S.parseIni(AC_INI);
  assert.equal(v.MODEL, undefined, "the [CAR] header is not a setup value");
  assert.equal(v.__EXT_PATCH, undefined);
  assert.equal(Object.keys(v).length, 1 + 4 * 10 + 4 + 4 + 5 + 6 + 1, "all sections arrive");
  const areas = Object.fromEntries(C.layout("Assetto Corsa", Object.keys(v)).map(a => [a.area, a.rows.map(r => r.label)]));
  assert.deepEqual(Object.keys(areas), ["Tyres", "Alignment", "Aero", "Suspension", "Dampers", "Drivetrain", "Brakes", "Electronics", "Fuel & strategy", "Other"]);
  assert.deepEqual(areas.Dampers, ["Slow bump", "Fast bump", "Slow rebound", "Fast rebound"]);
  assert.ok(areas.Drivetrain.includes("Gear 6") && areas.Drivetrain.includes("Diff preload"));
  assert.deepEqual(areas.Other, ["Mod special thing"], "an unknown mod option is kept");
  const pressure = C.layout("Assetto Corsa", Object.keys(v))[0].rows.find(r => r.label === "Pressure");
  assert.deepEqual(pressure.cells.map(c => c.wheel), ["FL", "FR", "RL", "RR"]);
});
test("ACC setup: the whole JSON is read and sorted into the game's tabs", () => {
  const { values } = S.parseAccJson(JSON.stringify(ACC_JSON));
  assert.equal(values["advancedSetup.dampers.bumpSlow.2"], 3);
  assert.equal(values["basicSetup.strategy.pitStrategy.0.fuelToAdd"], 10);
  const L = C.layout("Assetto Corsa Competizione", Object.keys(values)), areas = L.map(a => a.area);
  for (const a of ["Tyres", "Alignment", "Electronics", "Fuel & strategy", "Suspension", "Dampers", "Aero", "Drivetrain", "Brakes"]) assert.ok(areas.includes(a), a);
  assert.ok(!areas.includes("Other"), "every ACC option is known: " + JSON.stringify(L.find(a => a.area === "Other")));
  const duct = L.find(a => a.area === "Brakes").rows.find(r => r.label === "Brake ducts");
  assert.deepEqual(duct.cells.map(c => c.wheel), ["Front", "Rear"]);
});
test("setup files are found in the game folders, newest first", () => {
  const docs = fs.mkdtempSync(path.join(os.tmpdir(), "setups-"));
  const ac = path.join(docs, "Assetto Corsa", "setups", "ks_porsche", "monza"), gen = path.join(docs, "Assetto Corsa", "setups", "ks_porsche", "generic");
  fs.mkdirSync(ac, { recursive: true }); fs.mkdirSync(gen, { recursive: true });
  fs.writeFileSync(path.join(ac, "low_df.ini"), AC_INI); fs.writeFileSync(path.join(gen, "safe.ini"), "[FUEL]\nVALUE=60\n");
  const old = Date.now() / 1000 - 3600; fs.utimesSync(path.join(gen, "safe.ini"), old, old);
  const list = S.acSetups(docs, "ks_porsche", "monza");
  assert.deepEqual(list.map(x => [x.name, x.generic]), [["low_df", false], ["safe", true]]);
  const accDir = path.join(docs, "Assetto Corsa Competizione", "Setups", "bmw_m4_gt3", "monza");
  fs.mkdirSync(accDir, { recursive: true }); fs.writeFileSync(path.join(accDir, "quali.json"), JSON.stringify(ACC_JSON));
  assert.deepEqual(S.accSetups(docs, 30, "BMW M4 GT3", "monza").map(x => x.name), ["quali"]);
  assert.equal(S.pickFolder(["bmw_m4_gt3_new", "audi_r8"], "bmw_m4_gt3", "BMW M4 GT3"), "bmw_m4_gt3_new", "a renamed folder is still found");
  assert.equal(S.valuesKey({ a: 1, b: 2 }), S.valuesKey({ b: 2, a: 1 }));
});
