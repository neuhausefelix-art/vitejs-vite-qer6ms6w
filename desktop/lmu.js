// Reads laps from Le Mans Ultimate through the game's own local web API
// (the server behind LMU's menus, http://localhost:6397). It needs no plugin
// and no setting in the game. Lapbook only reads (GET), it never changes anything.
"use strict";
const { EventEmitter } = require("events");
const http = require("http");

const num = (...v) => { for (const x of v) { const n = Number(x); if (x !== undefined && x !== null && x !== "" && isFinite(n)) return n; } return undefined; };
const ms = s => (s > 0 ? Math.round(s * 1000) : 0); // seconds -> ms, -1 / 0 = no time
const SESSION = s => {
  const t = String(s || "").toUpperCase();
  return /RACE/.test(t) ? "Race" : /QUAL/.test(t) ? "Qualifying" : /PRAC/.test(t) ? "Practice" : /WARM/.test(t) ? "Warm-up" : /TEST/.test(t) ? "Test day" : "";
};
const sectorOf = v => { const m = String(v ?? "").match(/(\d)/); return m ? Number(m[1]) : 0; }; // "SECTOR2" -> 2
// "Porsche Penske Motorsport #6:LM" -> "Porsche Penske Motorsport"
const cleanCar = s => String(s || "").replace(/\s*#\d+.*$/, "").replace(/:[A-Z0-9]+$/, "").trim();

function getJson(host, port, path, timeout = 900) {
  return new Promise((resolve, reject) => {
    const req = http.get({ host, port, path, timeout, headers: { Accept: "application/json" } }, res => {
      if (res.statusCode !== 200) { res.resume(); return reject(new Error("HTTP " + res.statusCode)); }
      let body = "";
      res.setEncoding("utf8");
      res.on("data", c => { body += c; if (body.length > 4e6) req.destroy(); });
      res.on("end", () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
    });
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
  });
}

class LMUTelemetry extends EventEmitter {
  constructor({ port = 6397, fastMs = 250, slowMs = 2000, hosts = ["127.0.0.1", "::1"] } = {}) {
    super();
    Object.assign(this, { port, fastMs, slowMs, hosts });
    this.game = "Le Mans Ultimate";
    this.host = hosts[0];
    this.timer = null;
    this.running = false;
    this.reset();
  }
  reset() {
    this.connected = false;
    this.lastSeen = 0;
    this.track = "";
    this.trackLength = 0;
    this.session = "";
    this.me = null;
    this.live = null;
    this.lastLap = null;
    this.error = "";
    this.sessionAt = 0;
  }
  start() {
    if (this.running) return;
    this.running = true;
    this.loop();
  }
  stop() {
    this.running = false;
    clearTimeout(this.timer);
    this.reset();
    this.emit("status");
  }
  async loop() {
    if (!this.running) return;
    try { await this.poll(); } catch (e) {}
    if (this.running) this.timer = setTimeout(() => this.loop(), this.connected ? this.fastMs : this.slowMs);
  }
  async get(path) {
    try { return await getJson(this.host, this.port, path); }
    catch (e) {
      // some LMU versions only answer on IPv6 (::1)
      if (this.connected) throw e;
      const other = this.hosts.find(h => h !== this.host);
      if (!other) throw e;
      const r = await getJson(other, this.port, path);
      this.host = other;
      return r;
    }
  }
  async poll() {
    let list;
    try { list = await this.get("/rest/watch/standings"); }
    catch (e) {
      if (this.connected) { this.connected = false; this.live = null; this.emit("status"); }
      return;
    }
    const was = this.connected;
    this.connected = true;
    this.lastSeen = Date.now();
    if (Date.now() - this.sessionAt > 4000 || !this.track) {
      this.sessionAt = Date.now();
      try { this.onSession(await this.get("/rest/watch/sessionInfo")); } catch (e) {}
    }
    this.onStandings(Array.isArray(list) ? list : Array.isArray(list && list.standings) ? list.standings : []);
    if (!was) this.emit("status");
  }
  onSession(s) {
    if (!s || typeof s !== "object") return;
    const track = String(s.trackName || s.track || "").trim(), before = this.track;
    this.track = track;
    this.trackLength = num(s.lapDistance, s.trackLength) || this.trackLength;
    this.session = SESSION(s.session);
    this.eventTime = num(s.currentEventTime);
    if (track !== before) { this.me = null; this.emit("session"); }
  }
  onStandings(list) {
    const p = list.find(x => x && (x.player === true || x.isPlayer === true));
    if (!p) { this.live = null; return; }
    const now = Date.now(), car = cleanCar(p.vehicleName || p.fullTeamName || p.carClass), laps = num(p.lapsCompleted, p.totalLaps, p.laps) ?? 0;
    const last = ms(num(p.lastLapTime)), l1 = ms(num(p.lastSectorTime1)), l2 = ms(num(p.lastSectorTime2));
    let me = this.me;
    if (!me || me.car !== car) me = this.me = { car, laps, last, lapStart: now, invalid: false };
    if (laps === me.laps + 1) {
      me.laps = laps; me.lapStart = now;
      me.pending = { laps, oldLast: me.last, at: now, invalid: me.invalid };
      me.invalid = false;
    } else if (laps !== me.laps) { me.laps = laps; me.lapStart = now; me.pending = null; }
    // the lap time can arrive one poll after the lap counter
    const q = me.pending;
    if (q && last > 0 && last !== q.oldLast) {
      me.pending = null;
      if (this.track && car) {
        // rF2 sector 2 is counted from the start of the lap
        const s1 = l1, s2 = l2 > l1 ? l2 - l1 : l2, s3 = last - s1 - s2;
        const sectors = s1 > 0 && s2 > 0 && s3 > 0 ? [s1, s2, s3] : null;
        const lap = { game: this.game, track: this.track, car, carClass: String(p.carClass || ""), timeInMs: last, valid: !q.invalid, lapNum: laps, session: this.session, sectors, position: num(p.position) || 0 };
        this.lastLap = { ...lap, at: now };
        this.emit("lap", lap);
      }
    } else if (q && now - q.at > 5000) me.pending = null; // no time: the lap did not count
    me.last = last;
    if (p.lapInvalidated === true || p.invalidLap === true || p.countLapFlag === 0 || p.countLapFlag === 1) me.invalid = true;
    const into = num(p.timeIntoLap);
    const start = num(p.lapStartET);
    const t = into !== undefined && into >= 0 ? Math.round(into * 1000) : start !== undefined && this.eventTime !== undefined && this.eventTime >= start ? Math.round((this.eventTime - start) * 1000) : now - me.lapStart;
    const sec = sectorOf(p.sector), c1 = ms(num(p.currentSectorTime1)), c2 = ms(num(p.currentSectorTime2));
    this.live = {
      at: now, t, lapNum: laps + 1, distance: num(p.lapDistance) || 0, sector: sec ? sec - 1 : 0, s1: c1, s2: c2 > c1 ? c2 - c1 : 0,
      invalid: me.invalid, position: num(p.position) || 0, cars: list.length, track: this.track, car, pit: !!(p.pitting || p.inGarageStall), race: this.session === "Race",
    };
    this.emit("car", this.live);
  }
  info() {
    return { connected: this.connected && Date.now() - this.lastSeen < 5000, live: !!(this.live && Date.now() - this.live.at < 3000), track: this.track, car: this.live ? this.live.car : "", lastLap: this.lastLap, port: this.port, error: this.error };
  }
}

module.exports = { LMUTelemetry, cleanCar, sectorOf, getJson };
