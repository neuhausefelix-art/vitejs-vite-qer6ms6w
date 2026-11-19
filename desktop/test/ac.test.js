// Fakes the Assetto Corsa remote telemetry server and checks that laps come through.
"use strict";
const test = require("node:test");
const assert = require("node:assert");
const dgram = require("dgram");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { ACTelemetry, SIZE, OP } = require("../ac.js");
const { ACNames, tidy } = require("../acnames.js");

const w = (b, off, s, bytes) => { const x = Buffer.from(s + "%".repeat(3), "utf16le"); x.copy(b, off, 0, Math.min(bytes, x.length)); };
function handshakeResponse(car, driver, track, cfg) {
  const b = Buffer.alloc(SIZE.HANDSHAKE_RESPONSE);
  w(b, 0, car, 100); w(b, 100, driver, 100); b.writeInt32LE(4242, 200); b.writeInt32LE(1, 204); w(b, 208, track, 100); w(b, 308, cfg, 100);
  return b;
}
function lap(n, time, driver, car) {
  const b = Buffer.alloc(SIZE.LAP);
  b.writeInt32LE(0, 0); b.writeInt32LE(n, 4); w(b, 8, driver, 100); w(b, 108, car, 100); b.writeInt32LE(time, 208);
  return b;
}

test("folder names are tidied when no AC folder is found", () => {
  assert.strictEqual(tidy("ks_mclaren_650_gt3"), "Mclaren 650 GT3");
  const n = new ACNames("/nope");
  assert.strictEqual(n.track("ks_nurburgring", "layout_gp_a"), "Nurburgring GP A");
});

test("names come from ui_car.json / ui_track.json", () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "ac-"));
  fs.mkdirSync(path.join(d, "content", "cars", "ks_ferrari_488_gt3", "ui"), { recursive: true });
  fs.writeFileSync(path.join(d, "content", "cars", "ks_ferrari_488_gt3", "ui", "ui_car.json"), '{\n\t"name": "Ferrari 488 GT3",\n\t"brand":"Ferrari",\n}');
  fs.mkdirSync(path.join(d, "content", "tracks", "spa", "ui"), { recursive: true });
  fs.writeFileSync(path.join(d, "content", "tracks", "spa", "ui", "ui_track.json"), '{"name":"Spa-Francorchamps"}');
  const n = new ACNames(d);
  assert.strictEqual(n.folder, d);
  assert.strictEqual(n.car("ks_ferrari_488_gt3"), "Ferrari 488 GT3");
  assert.strictEqual(n.track("spa", ""), "Spa-Francorchamps");
});

function carInfo({ lapTime, lastLap = 0, lapCount = 0, pos = 0 }) {
  const b = Buffer.alloc(SIZE.CAR_INFO);
  b.writeInt32LE(SIZE.CAR_INFO, 4);
  b.writeInt32LE(lapTime, 40); b.writeInt32LE(lastLap, 44); b.writeInt32LE(lapCount, 52); b.writeFloatLE(pos, 308);
  return b;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function fakeGame(onOp) {
  const game = dgram.createSocket("udp4");
  await new Promise(r => game.bind(0, "127.0.0.1", r));
  const ops = [];
  game.on("message", (m, from) => {
    const op = m.readInt32LE(8);
    ops.push(op);
    if (op === OP.HANDSHAKE) game.send(handshakeResponse("ks_ferrari_488_gt3", "Felix", "spa", ""), from.port, from.address);
    onOp(op, b => game.send(b, from.port, from.address));
  });
  return { game, ops };
}

test("car data every frame: laps with splits at a third and two thirds", async () => {
  let push = null;
  const { game, ops } = await fakeGame((op, send) => { if (op === OP.SUBSCRIBE_UPDATE) push = send; });
  const ac = new ACTelemetry({ port: game.address().port, names: { car: id => id, track: id => id } });
  const laps = [];
  ac.on("lap", l => laps.push(l));
  ac.start();
  await sleep(150);
  assert.ok(push, "subscribed to car data");
  // one lap of 90 s, from the line to the line, then the counter goes up
  for (let i = 0; i <= 30; i++) { push(carInfo({ lapTime: i * 3000, lapCount: 0, pos: i / 30 === 1 ? 0.999 : i / 30 })); await sleep(5); }
  push(carInfo({ lapTime: 100, lapCount: 1, lastLap: 90000, pos: 0.001 }));
  await sleep(150);
  ac.stop();
  game.close();
  assert.deepStrictEqual(ops.slice(0, 2), [OP.HANDSHAKE, OP.SUBSCRIBE_UPDATE]);
  assert.strictEqual(ac.mode, "update");
  assert.strictEqual(laps.length, 1);
  assert.strictEqual(laps[0].timeInMs, 90000);
  assert.deepStrictEqual(laps[0].sectors, [30000, 30000, 30000]);
  assert.ok(ac.live && ac.live.lapCount === 1);
});

test("falls back to one message per lap when no car data comes", async () => {
  const { game, ops } = await fakeGame((op, send) => {
    if (op === OP.SUBSCRIBE_SPOT) {
      send(lap(1, 139456, "Felix", "ks_ferrari_488_gt3"));
      send(lap(1, 139456, "Felix", "ks_ferrari_488_gt3")); // repeat
      send(lap(1, 141000, "Someone", "ks_ferrari_488_gt3")); // other driver
      send(lap(2, 138900, "Felix", "ks_ferrari_488_gt3"));
    }
  });
  const ac = new ACTelemetry({ port: game.address().port, names: { car: id => "Car " + id, track: id => "Track " + id }, pokeMs: 100, refreshMs: 100, updateTimeout: 200 });
  const laps = [];
  ac.on("lap", l => laps.push(l));
  ac.start();
  await sleep(900);
  ac.stop();
  game.close();
  assert.strictEqual(ac.mode, "spot");
  assert.ok(ops.includes(OP.SUBSCRIBE_UPDATE) && ops.includes(OP.SUBSCRIBE_SPOT));
  assert.deepStrictEqual(laps.map(l => [l.track, l.car, l.timeInMs]), [["Track spa", "Car ks_ferrari_488_gt3", 139456], ["Track spa", "Car ks_ferrari_488_gt3", 138900]]);
});
