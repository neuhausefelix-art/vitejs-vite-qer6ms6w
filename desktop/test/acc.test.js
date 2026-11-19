"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs"), os = require("os"), path = require("path");
const { ACCTelemetry, parse, registerMsg, readConfig, enableConfig, carName, trackName } = require("../acc.js");
const { acc } = require("./simpackets.js");

test("ACC: register message has the protocol layout", () => {
  const m = registerMsg("Lapbook", "asd", 100, "x");
  assert.equal(m[0], 1); assert.equal(m[1], 4);
  assert.equal(m.readUInt16LE(2), 7); assert.equal(m.toString("utf8", 4, 11), "Lapbook");
  assert.equal(m.readUInt16LE(11), 3); assert.equal(m.readInt32LE(16), 100);
});
test("ACC: parses car updates with laps and splits", () => {
  const m = parse(acc.car({ laps: 2, last: 108123, lastSplits: [35000, 40000, 33123], cur: 4000, curSplits: [] }));
  assert.equal(m.laps, 2); assert.equal(m.last.ms, 108123); assert.deepEqual(m.last.splits, [35000, 40000, 33123]); assert.equal(m.current.ms, 4000);
  assert.equal(m.best.ms, 0, "int.MaxValue means no time");
});
test("ACC: a finished lap of the focused car becomes a Lapbook lap", () => {
  const t = new ACCTelemetry(), laps = [];
  t.on("lap", l => laps.push(l));
  for (const p of [acc.registration(), acc.track("monza", 5793), acc.entryCar(3, 30), acc.entryCar(4, 1), acc.realtime(3, 10)]) t.handle(p);
  t.handle(acc.car({ car: 4, laps: 0 })); t.handle(acc.car({ car: 4, laps: 1, last: 99999 })); // other car: ignored
  t.handle(acc.car({ laps: 0, cur: 60000, curSplits: [35000] }));
  assert.equal(t.live.sector, 1); assert.equal(t.live.s1, 35000); assert.ok(Math.abs(t.live.distance - 2896.5) < 1);
  t.handle(acc.car({ laps: 1, last: 108123, lastSplits: [35000, 40000, 33123], cur: 200 }));
  t.handle(acc.car({ laps: 2, last: 109000, lastSplits: [35000, 41000, 33000], lastInvalid: true, cur: 100 }));
  assert.equal(laps.length, 2);
  assert.deepEqual({ ...laps[0], sectors: laps[0].sectors }, { game: "Assetto Corsa Competizione", track: "Monza", car: "BMW M4 GT3", timeInMs: 108123, valid: true, lapNum: 1, session: "Race", sectors: [35000, 40000, 33123], position: 4, outLap: false, inLap: false });
  assert.equal(laps[1].valid, false);
  assert.equal(t.live.race, true);
});
test("ACC: refused registration shows the reason", () => {
  const t = new ACCTelemetry();
  t.handle(acc.registration(-1, false, "Wrong password"));
  assert.equal(t.connected, false); assert.equal(t.error, "Wrong password");
});
test("ACC: names for cars and tracks", () => {
  assert.equal(carName(36), "Ford Mustang GT3"); assert.equal(carName(250), "ACC car 250");
  assert.equal(trackName("brands_hatch"), "Brands Hatch"); assert.equal(trackName("Spa"), "Spa-Francorchamps"); assert.equal(trackName("new_track"), "New Track");
});
test("ACC: broadcasting.json is read (UTF-16) and can be switched on", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "acc-")), f = path.join(dir, "Config", "broadcasting.json");
  assert.equal(readConfig(f).found, false);
  fs.mkdirSync(path.dirname(f));
  fs.writeFileSync(f, Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from('{\n "updListenerPort": 0,\n "connectionPassword": "pw",\n "commandPassword": ""\n}', "utf16le")]));
  assert.deepEqual([readConfig(f).port, readConfig(f).password], [0, "pw"]);
  const c = enableConfig(f);
  assert.equal(c.port, 9000); assert.equal(c.password, "pw"); assert.ok(c.utf16);
  assert.ok(fs.existsSync(f + ".lapbook-backup"));
});
test("ACC: talks to a real UDP server", async () => {
  const dgram = require("dgram"), os2 = require("os");
  const dir = fs.mkdtempSync(path.join(os2.tmpdir(), "acc-")), f = path.join(dir, "b.json");
  const srv = dgram.createSocket("udp4"), got = [];
  await new Promise(r => srv.bind(0, "127.0.0.1", r));
  fs.writeFileSync(f, JSON.stringify({ updListenerPort: srv.address().port, connectionPassword: "asd", commandPassword: "" }));
  srv.on("message", (m, r) => { got.push(m[0]); if (m[0] === 1) srv.send(acc.registration(5), r.port, r.address); });
  const t = new ACCTelemetry({ configPath: f });
  t.start();
  await new Promise(r => setTimeout(r, 300));
  t.stop(); srv.close();
  assert.ok(got.includes(1) && got.includes(10) && got.includes(11), "register, entry list, track data: " + got);
});
