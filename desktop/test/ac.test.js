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

test("handshake, subscribe and laps against a fake game", async () => {
  const game = dgram.createSocket("udp4");
  const ops = [];
  await new Promise(r => game.bind(0, "127.0.0.1", r));
  game.on("message", (m, from) => {
    const op = m.readInt32LE(8);
    ops.push(op);
    if (op === OP.HANDSHAKE) game.send(handshakeResponse("ks_ferrari_488_gt3", "Felix", "spa", ""), from.port, from.address);
    if (op === OP.SUBSCRIBE_SPOT) {
      game.send(lap(1, 139456, "Felix", "ks_ferrari_488_gt3"), from.port, from.address);
      game.send(lap(1, 139456, "Felix", "ks_ferrari_488_gt3"), from.port, from.address); // repeat
      game.send(lap(1, 141000, "Someone", "ks_ferrari_488_gt3"), from.port, from.address); // other driver
      game.send(lap(2, 138900, "Felix", "ks_ferrari_488_gt3"), from.port, from.address);
    }
  });
  const ac = new ACTelemetry({ port: game.address().port, names: { car: id => "Car " + id, track: id => "Track " + id } });
  const laps = [];
  ac.on("lap", l => laps.push(l));
  ac.start();
  await new Promise(r => setTimeout(r, 400));
  ac.stop();
  game.close();
  assert.deepStrictEqual(ops.slice(0, 2), [OP.HANDSHAKE, OP.SUBSCRIBE_SPOT]);
  assert.deepStrictEqual(laps.map(l => [l.track, l.car, l.timeInMs]), [["Track spa", "Car ks_ferrari_488_gt3", 139456], ["Track spa", "Car ks_ferrari_488_gt3", 138900]]);
  assert.ok(ac.info().connected);
});
