// Checks reading, installing and rolling back update packages.
"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const U = require("../updates.js");

const src = path.join(__dirname, "..");
const FILES = ["main.js", "preload.js", "f1-25.js", "updates.js", "app/lapbook.html", "app/desktop-bridge.js"];
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "lbu-"));
const write = (dir, json) => { const f = path.join(dir, "x.lapbook-update"); fs.writeFileSync(f, json); return f; };

test("version compare", () => {
  assert.ok(U.newer("1.2.0", "1.1.9"));
  assert.ok(U.newer("1.10.0", "1.9.0"));
  assert.ok(!U.newer("1.1.0", "1.1.0"));
  assert.ok(!U.newer("1.0.9", "1.1.0"));
});

test("a good package is read, installed and rolled back", () => {
  const d = tmp(), ud = tmp();
  const f = write(d, U.build(src, FILES, "1.2.0", ["Faster"], "1.1.0"));
  const p = U.readPackage(f, "1.1.0");
  assert.ok(p.ok, p.error);
  assert.deepStrictEqual(p.manifest.notes, ["Faster"]);
  const dir = U.install(ud, p);
  assert.ok(fs.existsSync(path.join(dir, "app", "lapbook.html")));
  assert.strictEqual(U.readCurrent(ud).version, "1.2.0");
  const p2 = U.readPackage(write(d, U.build(src, FILES, "1.3.0", [], "1.1.0")), "1.1.0");
  U.install(ud, p2);
  assert.strictEqual(U.readCurrent(ud).previous.version, "1.2.0");
  U.rollback(ud);
  assert.strictEqual(U.readCurrent(ud).version, "1.2.0");
  U.rollback(ud);
  assert.strictEqual(U.readCurrent(ud), null);
});

test("damaged, foreign, unsafe or too-new packages are refused", () => {
  const d = tmp();
  const good = JSON.parse(U.build(src, FILES, "1.2.0", [], "1.1.0"));
  const bad = JSON.parse(JSON.stringify(good));
  bad.files["main.js"].data = Buffer.from("evil").toString("base64");
  assert.match(U.readPackage(write(d, JSON.stringify(bad)), "1.1.0").error, /checksum/);
  assert.match(U.readPackage(write(d, "{}"), "1.1.0").error, /not a Lapbook update/);
  assert.match(U.readPackage(write(d, "hello"), "1.1.0").error, /not a Lapbook update/);
  const evil = JSON.parse(JSON.stringify(good));
  evil.files["../../x.js"] = good.files["main.js"];
  assert.match(U.readPackage(write(d, JSON.stringify(evil)), "1.1.0").error, /unsafe/);
  const miss = JSON.parse(JSON.stringify(good));
  delete miss.files["preload.js"];
  assert.match(U.readPackage(write(d, JSON.stringify(miss)), "1.1.0").error, /incomplete/);
  assert.match(U.readPackage(write(d, JSON.stringify({ ...good, minShell: "2.0.0" })), "1.1.0").error, /full install/);
});
