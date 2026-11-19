// Builds an update package from the current files:
//   node tools/make-update.js "What changed" "Another change"
// Writes dist/Lapbook-Update-<version>.lapbook-update
"use strict";
const fs = require("fs");
const path = require("path");
const { build } = require("../updates.js");

const root = path.join(__dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const FILES = ["main.js", "preload.js", "overlay-preload.js", "f1-25.js", "ac.js", "acnames.js", "forza.js", "delta.js", "updates.js", "app/lapbook.html", "app/desktop-bridge.js", "app/overlay.html", "build/icon.png"];
// files the update needs from the full app (boot.js is part of the full app only)
const MIN_SHELL = "1.1.0";
const notes = process.argv.slice(2);
const out = path.join(root, "dist", `Lapbook-Update-${pkg.version}.lapbook-update`);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, build(root, FILES, pkg.version, notes, MIN_SHELL));
console.log(`${out} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
