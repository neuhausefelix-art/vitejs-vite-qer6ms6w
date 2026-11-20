// Reads car setups that the games saved on this PC. Read-only: Lapbook never
// changes or writes anything in the games' folders.
//   Assetto Corsa:  Documents\Assetto Corsa\setups\<car>\<track>\*.ini  (and \generic)
//   ACC:            Documents\Assetto Corsa Competizione\Setups\<car>\<track>\*.json
// Every option of the file is kept, the catalog in the app gives it a name.
"use strict";
const fs = require("fs");
const path = require("path");

const SKIP = /^(CAR|__.*|HEADER|VERSION|SETUP_INFO)$/i;

// [SECTION] VALUE=5  ->  { SECTION: 5 }
function parseIni(text) {
  const out = {};
  let sec = "";
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.replace(/[;#].*$/, "").trim();
    if (!line) continue;
    const m = line.match(/^\[(.+)\]$/);
    if (m) { sec = m[1].trim(); continue; }
    const kv = line.match(/^([^=]+)=(.*)$/);
    if (!kv || !sec || SKIP.test(sec)) continue;
    const k = kv[1].trim().toUpperCase(), v = kv[2].trim();
    if (k !== "VALUE") continue;
    const n = Number(v);
    out[sec.toUpperCase()] = v !== "" && isFinite(n) ? n : v;
  }
  return out;
}
// nested JSON -> flat keys: basicSetup.tyres.tyrePressure.0 = 55
function flatten(obj, pre = "", out = {}) {
  if (Array.isArray(obj)) obj.forEach((v, i) => flatten(v, pre + (pre ? "." : "") + i, out));
  else if (obj && typeof obj === "object") Object.entries(obj).forEach(([k, v]) => flatten(v, pre + (pre ? "." : "") + k, out));
  else if (pre && (typeof obj === "number" || typeof obj === "string" || typeof obj === "boolean")) out[pre] = obj;
  return out;
}
function parseAccJson(text) {
  const j = JSON.parse(String(text).replace(/^﻿/, ""));
  const out = {};
  for (const part of ["basicSetup", "advancedSetup"]) if (j[part]) flatten(j[part], part, out);
  return { values: out, carName: j.carName || "" };
}

function listDir(dir, ext) {
  try {
    return fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith(ext)).map(f => {
      const file = path.join(dir, f);
      return { file, name: f.slice(0, -ext.length), mtime: fs.statSync(file).mtimeMs };
    });
  } catch (e) {
    return [];
  }
}
const sortNew = list => list.sort((a, b) => b.mtime - a.mtime);

// Assetto Corsa: setups for a car on a track, plus the car's generic setups
function acSetups(docs, carId, trackId) {
  if (!carId) return [];
  const base = path.join(docs, "Assetto Corsa", "setups", carId);
  const found = [];
  for (const [folder, generic] of [[trackId, false], ["generic", true]]) {
    if (!folder) continue;
    for (const f of listDir(path.join(base, folder), ".ini")) {
      try { found.push({ ...f, generic, values: parseIni(fs.readFileSync(f.file, "utf8")) }); } catch (e) {}
    }
  }
  return sortNew(found).filter(s => Object.keys(s.values).length);
}

// ACC: car folder names by car model id
const ACC_FOLDERS = {
  0: "porsche_991_gt3_r", 1: "mercedes_amg_gt3", 2: "ferrari_488_gt3", 3: "audi_r8_lms", 4: "lamborghini_huracan_gt3", 5: "mclaren_650s_gt3",
  6: "nissan_gt_r_gt3_2018", 7: "bmw_m6_gt3", 8: "bentley_continental_gt3_2018", 9: "porsche_991ii_gt3_cup", 10: "nissan_gt_r_gt3_2017",
  11: "bentley_continental_gt3_2016", 12: "amr_v12_vantage_gt3", 13: "lamborghini_gallardo_rex", 14: "jaguar_g3", 15: "lexus_rc_f_gt3",
  16: "lamborghini_huracan_gt3_evo", 17: "honda_nsx_gt3", 18: "lamborghini_huracan_st", 19: "audi_r8_lms_evo", 20: "amr_v8_vantage_gt3",
  21: "honda_nsx_gt3_evo", 22: "mclaren_720s_gt3", 23: "porsche_991ii_gt3_r", 24: "ferrari_488_gt3_evo", 25: "mercedes_amg_gt3_evo",
  26: "ferrari_488_challenge_evo", 27: "bmw_m2_cs_racing", 28: "porsche_992_gt3_cup", 29: "lamborghini_huracan_st_evo2", 30: "bmw_m4_gt3",
  31: "audi_r8_lms_evo_ii", 32: "ferrari_296_gt3", 33: "lamborghini_huracan_gt3_evo2", 34: "porsche_992_gt3_r", 35: "mclaren_720s_gt3_evo",
  36: "ford_mustang_gt3",
  50: "alpine_a110_gt4", 51: "amr_v8_vantage_gt4", 52: "audi_r8_gt4", 53: "bmw_m4_gt4", 55: "chevrolet_camaro_gt4r", 56: "ginetta_g55_gt4",
  57: "ktm_xbow_gt4", 58: "maserati_mc_gt4", 59: "mclaren_570s_gt4", 60: "mercedes_amg_gt4", 61: "porsche_718_cayman_gt4_mr",
  80: "audi_r8_lms_gt2", 82: "ktm_xbow_gt2", 83: "maserati_mc20_gt2", 84: "mercedes_amg_gt2", 85: "porsche_911_gt2_rs_cs_evo", 86: "porsche_935",
};
const tokens = s => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").split(" ").filter(Boolean);
function pickFolder(dirs, want, carName) {
  if (want && dirs.includes(want)) return want;
  // folder names change now and then: take the one sharing most words with the car name
  const t = new Set(tokens(carName));
  let best = "", score = 1;
  for (const d of dirs) { const s = tokens(d).filter(x => t.has(x)).length; if (s > score) { score = s; best = d; } }
  return best;
}
function accSetups(docs, model, carName, track) {
  const root = path.join(docs, "Assetto Corsa Competizione", "Setups");
  let cars = [];
  try { cars = fs.readdirSync(root).filter(d => fs.statSync(path.join(root, d)).isDirectory()); } catch (e) { return []; }
  const car = pickFolder(cars, ACC_FOLDERS[model], carName);
  if (!car) return [];
  let tracks = [];
  try { tracks = fs.readdirSync(path.join(root, car)); } catch (e) {}
  const want = String(track || "").toLowerCase().replace(/[\s-]+/g, "_");
  const tdir = tracks.find(t => t.toLowerCase() === want) || tracks.find(t => want && (t.toLowerCase().includes(want) || want.includes(t.toLowerCase())));
  if (!tdir) return [];
  const found = [];
  for (const f of listDir(path.join(root, car, tdir), ".json")) {
    try { const j = parseAccJson(fs.readFileSync(f.file, "utf8")); found.push({ ...f, folder: car, values: j.values }); } catch (e) {}
  }
  return sortNew(found).filter(s => Object.keys(s.values).length);
}

// same values = same setup (order of keys does not matter)
const valuesKey = v => JSON.stringify(Object.keys(v || {}).sort().map(k => [k, v[k]]));

module.exports = { parseIni, parseAccJson, flatten, acSetups, accSetups, pickFolder, ACC_FOLDERS, valuesKey };
