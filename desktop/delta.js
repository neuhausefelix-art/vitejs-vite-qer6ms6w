// Live delta to your best lap, and sector colours like on TV.
// While you drive, the lap is recorded as "time at position x" (metres into the
// lap, or a share of the lap). Your fastest valid lap per circuit and car is kept
// on disk, so the delta also works against laps from earlier sessions.
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const MIN_POINTS = 20;

class DeltaTracker {
  constructor(dir, { bin = 10 } = {}) {
    this.dir = dir;
    this.bin = bin; // distance between stored points
    this.best = new Map(); // key -> { ms, bin, t: [], sectors: [] }
    this.runs = new Map(); // key -> { lap, pts: [[x, t]], prev }
    this.sessionSectors = new Map(); // key -> best sectors this session
  }

  file(key) {
    return path.join(this.dir, crypto.createHash("sha1").update(key).digest("hex").slice(0, 20) + ".json");
  }

  load(key) {
    if (this.best.has(key)) return this.best.get(key);
    let b = null;
    try {
      b = JSON.parse(fs.readFileSync(this.file(key), "utf8"));
      if (!b || !Array.isArray(b.t) || !(b.ms > 0)) b = null;
    } catch (e) {}
    this.best.set(key, b);
    return b;
  }

  store(key, b) {
    this.best.set(key, b);
    try {
      fs.mkdirSync(this.dir, { recursive: true });
      fs.writeFileSync(this.file(key), JSON.stringify({ key, ...b }));
    } catch (e) {}
  }

  // a new session: session-best sectors start again
  newSession(key) {
    this.sessionSectors.delete(key);
  }

  // one point of the running lap: x = position in the lap, t = lap time in ms
  sample(key, lap, x, t) {
    let r = this.runs.get(key);
    if (!r || r.lap !== lap) {
      r = { lap, pts: [], prev: r ? { lap: r.lap, pts: r.pts } : null };
      this.runs.set(key, r);
    }
    if (!(x >= 0) || !(t >= 0)) return;
    const last = r.pts[r.pts.length - 1];
    if (!last || (x > last[0] && t >= last[1])) r.pts.push([x, t]);
  }

  // delta in ms against the best lap at the same place (negative = faster)
  delta(key, x, t) {
    const b = this.load(key);
    if (!b || !(x >= 0)) return null;
    const i = x / b.bin, k = Math.floor(i);
    if (k + 1 >= b.t.length) return null;
    const bt = b.t[k] + (b.t[k + 1] - b.t[k]) * (i - k);
    return Math.round(t - bt);
  }

  // colour of a sector time: purple = best ever, green = best this session, yellow = slower
  colour(key, i, ms) {
    if (!(ms > 0)) return "";
    const b = this.load(key), all = b && b.sectors ? b.sectors[i] : 0, ses = (this.sessionSectors.get(key) || [])[i] || 0;
    if (!all || ms <= all) return "purple";
    if (!ses || ms <= ses) return "green";
    return "yellow";
  }

  // a lap is done: keep it if it is the fastest valid one so far
  finish(key, ms, valid, sectors) {
    const r = this.runs.get(key);
    const pts = r ? (r.prev && r.prev.pts.length >= MIN_POINTS ? r.prev.pts : r.pts) : [];
    const b = this.load(key);
    const out = { improved: false };
    if (valid && Array.isArray(sectors)) {
      const ses = this.sessionSectors.get(key) || [];
      this.sessionSectors.set(key, sectors.map((s, i) => (s > 0 && (!ses[i] || s < ses[i]) ? s : ses[i] || 0)));
    }
    const allSec = b && b.sectors ? b.sectors.slice() : [];
    if (valid && Array.isArray(sectors)) sectors.forEach((s, i) => { if (s > 0 && (!allSec[i] || s < allSec[i])) allSec[i] = s; });
    if (valid && ms > 0 && pts.length >= MIN_POINTS && (!b || ms < b.ms)) {
      this.store(key, { ms, bin: this.bin, t: resample(pts, this.bin, ms), sectors: allSec, at: Date.now() });
      out.improved = true;
    } else if (b && allSec.length && JSON.stringify(allSec) !== JSON.stringify(b.sectors || [])) {
      this.store(key, { ...b, sectors: allSec });
    } else if (!b && allSec.length) {
      this.store(key, { ms: 0, bin: this.bin, t: [], sectors: allSec, at: Date.now() });
    }
    if (r) r.prev = null;
    return out;
  }

  // a circuit or car got a new name: keep its best lap
  rename(from, to) {
    if (!from || !to || from === to) return;
    const b = this.load(from);
    if (!b || this.load(to)) return;
    this.store(to, b);
    this.best.delete(from);
    try { fs.unlinkSync(this.file(from)); } catch (e) {}
  }

  moveRun(from, to) {
    const r = this.runs.get(from);
    if (r) { this.runs.set(to, r); this.runs.delete(from); }
  }

  bestSectors(key) {
    const b = this.load(key);
    return b && b.sectors ? b.sectors : [];
  }
}

// time at x = 0, bin, 2*bin, ... from the recorded points; the lap ends at its full time
function resample(pts, bin, ms) {
  const out = [];
  let j = 0;
  const end = pts[pts.length - 1][0];
  for (let x = 0; x <= end; x += bin) {
    while (j + 1 < pts.length && pts[j + 1][0] < x) j++;
    const a = pts[j], b = pts[Math.min(j + 1, pts.length - 1)];
    const t = x <= a[0] ? a[1] * (x / Math.max(a[0], 1e-9)) : b[0] === a[0] ? a[1] : a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0]);
    out.push(Math.round(Math.min(t, ms)));
  }
  return out;
}

module.exports = { DeltaTracker, resample };
