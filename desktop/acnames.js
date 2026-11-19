// Turns Assetto Corsa folder names (ks_mclaren_650_gt3, ks_nurburgring + layout_gp)
// into the names shown in the game, by reading ui_car.json / ui_track.json from
// your Assetto Corsa folder. Falls back to a tidied-up folder name.
"use strict";
const fs = require("fs");
const path = require("path");

const UP = new Set(["gt", "gt1", "gt2", "gt3", "gt4", "gte", "gtr", "gts", "gtb", "rs", "rsr", "amg", "bmw", "f1", "f2", "f3", "lmp1", "lmp2", "lmp3", "dtm", "wrc", "srt", "sls", "slr", "cs", "csl", "gp", "rx", "zl1", "z06", "zr1", "ss", "nsx", "rsr", "cup", "evo", "jgtc", "imsa", "fia", "uk", "usa"]);
const tidy = id =>
  String(id || "")
    .replace(/^(ks|rss|rsr|vrc|urd|tatuusfa1|ac)_/i, "")
    .split(/[_\s]+/)
    .filter(Boolean)
    .map(w => (UP.has(w.toLowerCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");

// ui json files from mods often contain tabs, line breaks or trailing commas
function readName(file) {
  try {
    const raw = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
    try {
      const j = JSON.parse(raw.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, " ").replace(/[\r\n\t]+/g, " ").replace(/,\s*([}\]])/g, "$1"));
      if (j && typeof j.name === "string" && j.name.trim()) return j.name.trim();
    } catch (e) {}
    const m = raw.match(/"name"\s*:\s*"([^"]+)"/);
    return m ? m[1].trim() : "";
  } catch (e) {
    return "";
  }
}

// Steam libraries listed in libraryfolders.vdf, plus the usual places
function candidates(env = process.env) {
  const out = [];
  const steams = [
    path.join(env["ProgramFiles(x86)"] || "C:\\Program Files (x86)", "Steam"),
    path.join(env.ProgramFiles || "C:\\Program Files", "Steam"),
  ];
  for (const st of steams) {
    out.push(path.join(st, "steamapps", "common", "assettocorsa"));
    try {
      const vdf = fs.readFileSync(path.join(st, "steamapps", "libraryfolders.vdf"), "utf8");
      for (const m of vdf.matchAll(/"path"\s+"([^"]+)"/g)) out.push(path.join(m[1].replace(/\\\\/g, "\\"), "steamapps", "common", "assettocorsa"));
    } catch (e) {}
  }
  for (const d of "CDEFGHIJ") {
    out.push(`${d}:\\SteamLibrary\\steamapps\\common\\assettocorsa`);
    out.push(`${d}:\\Steam\\steamapps\\common\\assettocorsa`);
  }
  return [...new Set(out)];
}
const isAC = dir => {
  try { return fs.statSync(path.join(dir, "content", "cars")).isDirectory(); } catch (e) { return false; }
};
function findFolder(preferred) {
  if (preferred && isAC(preferred)) return preferred;
  return candidates().find(isAC) || "";
}

class ACNames {
  constructor(folder = "") {
    this.setFolder(folder);
  }
  setFolder(preferred) {
    this.folder = findFolder(preferred);
    this.cache = new Map();
    return this.folder;
  }
  car(id) {
    const k = "c:" + id;
    if (!this.cache.has(k)) {
      const n = this.folder ? readName(path.join(this.folder, "content", "cars", id, "ui", "ui_car.json")) : "";
      this.cache.set(k, n || tidy(id));
    }
    return this.cache.get(k);
  }
  track(id, config) {
    const k = "t:" + id + "|" + (config || "");
    if (!this.cache.has(k)) {
      let n = "";
      if (this.folder) {
        const ui = path.join(this.folder, "content", "tracks", id, "ui");
        n = (config && readName(path.join(ui, config, "ui_track.json"))) || readName(path.join(ui, "ui_track.json"));
      }
      if (!n) n = tidy(id) + (config ? " " + tidy(config.replace(/^layout_/, "")) : "");
      this.cache.set(k, n);
    }
    return this.cache.get(k);
  }
}

module.exports = { ACNames, tidy, readName, findFolder };
