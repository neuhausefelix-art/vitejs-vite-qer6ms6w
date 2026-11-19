"use strict";
const test = require("node:test");
const assert = require("node:assert");
const { LMUTelemetry, cleanCar } = require("../lmu.js");
const { lmuServer } = require("./simpackets.js");
const wait = ms => new Promise(r => setTimeout(r, ms));

test("LMU: car names without number", () => {
  assert.equal(cleanCar("Porsche Penske Motorsport #6:LM"), "Porsche Penske Motorsport");
  assert.equal(cleanCar("Ferrari 499P"), "Ferrari 499P");
});
test("LMU: reads laps and sectors from the web API", async () => {
  const me = { player: true, driverName: "Me", vehicleName: "Ferrari AF Corse #50:LM", carClass: "Hypercar", lapsCompleted: 2, lastLapTime: 210.5, lastSectorTime1: 60, lastSectorTime2: 140, currentSectorTime1: -1, currentSectorTime2: -1, sector: "SECTOR1", lapDistance: 120, timeIntoLap: 3.5, position: 2 };
  const state = { standings: [{ player: false, vehicleName: "Other", lapsCompleted: 2 }, me], session: { trackName: "Circuit de la Sarthe", session: "RACE1", lapDistance: 13626 } };
  const srv = await lmuServer(state);
  const t = new LMUTelemetry({ port: srv.address().port, fastMs: 20, slowMs: 20, hosts: ["127.0.0.1"] }), laps = [];
  t.on("lap", l => laps.push(l));
  t.start();
  await wait(120);
  assert.ok(t.connected); assert.equal(t.track, "Circuit de la Sarthe");
  assert.equal(t.live.t, 3500); assert.equal(t.live.race, true); assert.equal(t.live.distance, 120);
  Object.assign(me, { lapsCompleted: 3, sector: "SECTOR1" }); // counter first, time a moment later
  await wait(80);
  assert.equal(laps.length, 0);
  Object.assign(me, { lastLapTime: 208.25, lastSectorTime1: 59.5, lastSectorTime2: 139.0 });
  await wait(80);
  t.stop(); srv.close();
  assert.equal(laps.length, 1);
  assert.deepEqual([laps[0].track, laps[0].car, laps[0].timeInMs, laps[0].valid, laps[0].session], ["Circuit de la Sarthe", "Ferrari AF Corse", 208250, true, "Race"]);
  assert.deepEqual(laps[0].sectors, [59500, 79500, 69250]);
});
test("LMU: no game = not connected, no error", async () => {
  const t = new LMUTelemetry({ port: 1, fastMs: 20, slowMs: 20, hosts: ["127.0.0.1"] });
  t.start(); await wait(60); t.stop();
  assert.equal(t.connected, false);
});
