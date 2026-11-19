// Update packages (.lapbook-update): one JSON file that holds the app files,
// each with a SHA-256 checksum. Installing one writes the files to
// %APPDATA%\Lapbook\updates\<version> and restarts. Lap data is never touched.
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const FORMAT = "lapbook-update";
const REQUIRED = ["main.js", "preload.js", "f1-25.js", "updates.js", "app/lapbook.html", "app/desktop-bridge.js"];
const SAFE = /^[A-Za-z0-9_\-]+(\/[A-Za-z0-9_\-]+)*\.[A-Za-z0-9]+$/;
const MAX_SIZE = 40e6;

const parts = v => String(v).split(".").map(n => parseInt(n, 10) || 0);
function newer(a, b) {
  const x = parts(a), y = parts(b);
  for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
  return false;
}
const sha = buf => crypto.createHash("sha256").update(buf).digest("hex");

const currentFile = userData => path.join(userData, "updates", "current.json");
function readCurrent(userData) {
  try { return JSON.parse(fs.readFileSync(currentFile(userData), "utf8")); } catch (e) { return null; }
}
function writeCurrent(userData, data) {
  fs.mkdirSync(path.dirname(currentFile(userData)), { recursive: true });
  fs.writeFileSync(currentFile(userData), JSON.stringify(data, null, 2));
}

// Reads and checks a package. Returns { ok, manifest, files } or { ok:false, error }.
function readPackage(file, shellVersion) {
  let raw;
  try {
    const st = fs.statSync(file);
    if (st.size > MAX_SIZE) return { ok: false, error: "This file is too big to be a Lapbook update." };
    raw = fs.readFileSync(file, "utf8");
  } catch (e) {
    return { ok: false, error: "The file could not be read." };
  }
  let pkg;
  try { pkg = JSON.parse(raw); } catch (e) { return { ok: false, error: "This is not a Lapbook update file." }; }
  if (!pkg || pkg.format !== FORMAT || pkg.formatVersion !== 1) return { ok: false, error: "This is not a Lapbook update file." };
  if (!/^\d+\.\d+\.\d+$/.test(String(pkg.version))) return { ok: false, error: "The update has no valid version number." };
  if (pkg.minShell && newer(pkg.minShell, shellVersion))
    return { ok: false, error: `This update needs Lapbook ${pkg.minShell} or newer as a full install. You have ${shellVersion}. Download the new full app once.` };
  const files = {};
  for (const [name, f] of Object.entries(pkg.files || {})) {
    if (!SAFE.test(name) || name.includes("..")) return { ok: false, error: `The update contains an unsafe file name: ${name}` };
    if (!f || typeof f.data !== "string" || typeof f.sha256 !== "string") return { ok: false, error: `The update is damaged (${name}).` };
    const buf = Buffer.from(f.data, "base64");
    if (sha(buf) !== f.sha256) return { ok: false, error: `The update is damaged: ${name} does not match its checksum. Download it again.` };
    files[name] = buf;
  }
  const missing = REQUIRED.filter(n => !files[n]);
  if (missing.length) return { ok: false, error: `The update is incomplete (missing ${missing.join(", ")}).` };
  return {
    ok: true,
    manifest: { version: pkg.version, date: pkg.date || "", notes: Array.isArray(pkg.notes) ? pkg.notes.map(String).slice(0, 30) : [], minShell: pkg.minShell || "" },
    files,
  };
}

// Writes the files and makes them the version used on the next start.
function install(userData, pkg) {
  const root = path.join(userData, "updates");
  const dir = path.join(root, `${pkg.manifest.version}-${Date.now()}`);
  for (const [name, buf] of Object.entries(pkg.files)) {
    const target = path.join(dir, ...name.split("/"));
    if (!target.startsWith(dir + path.sep)) throw new Error("unsafe path");
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, buf);
  }
  const prev = readCurrent(userData);
  writeCurrent(userData, { version: pkg.manifest.version, dir, notes: pkg.manifest.notes, installed: new Date().toISOString(), previous: prev && !prev.bad ? { version: prev.version, dir: prev.dir } : null });
  // keep only the new version and the one before it
  const keep = new Set([dir, prev && prev.dir].filter(Boolean));
  for (const d of fs.readdirSync(root)) {
    const full = path.join(root, d);
    if (d !== "current.json" && !keep.has(full)) fs.rmSync(full, { recursive: true, force: true });
  }
  return dir;
}

// Goes back one step: to the previous update, or to the built-in version.
function rollback(userData) {
  const cur = readCurrent(userData);
  if (cur && cur.previous && cur.previous.dir && fs.existsSync(cur.previous.dir)) writeCurrent(userData, { ...cur.previous, previous: null });
  else {
    try { fs.unlinkSync(currentFile(userData)); } catch (e) {}
  }
}

// Builds a package from a folder (used by tools/make-update.js).
function build(srcDir, files, version, notes, minShell) {
  const out = { format: FORMAT, formatVersion: 1, version, minShell, date: new Date().toISOString().slice(0, 10), notes, files: {} };
  for (const name of files) {
    const buf = fs.readFileSync(path.join(srcDir, ...name.split("/")));
    out.files[name] = { sha256: sha(buf), data: buf.toString("base64") };
  }
  return JSON.stringify(out);
}

module.exports = { newer, readCurrent, writeCurrent, readPackage, install, rollback, build, REQUIRED, FORMAT };
