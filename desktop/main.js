// Lapbook for Windows: the Lapbook page in its own window, plus a listener
// for the F1 25 UDP telemetry so finished laps are logged automatically.
"use strict";
const { app, BrowserWindow, ipcMain, shell, dialog, globalShortcut, screen } = require("electron");
const path = require("path");
const fs = require("fs");
const dgram = require("dgram");
const { F1Telemetry, knownCars, unknownCar, oldNames } = require("./f1-25.js");
const { ACTelemetry } = require("./ac.js");
const { ACNames } = require("./acnames.js");
const { ForzaTelemetry, placeholderCar } = require("./forza.js");
const { execFile, spawn } = require("child_process");
const { DeltaTracker } = require("./delta.js");
const updates = require("./updates.js");

const META = global.LAPBOOK || { shellVersion: app.getVersion(), version: app.getVersion(), overlay: null, bootError: "" };
const OVERLAY = { on: false, locked: true, scale: 1, opacity: 0.88, bounds: null, v: 2 };
const DEFAULTS = { port: 20777, saveInvalid: false, network: false, carNames: {}, acPath: "", acOn: true, overlay: { ...OVERLAY }, forzaOn: true, forzaPort: 5300, forzaGame: "auto", forzaCars: {}, forzaRoutes: {}, forzaSegments: {}, forzaRaceLaps: false };
const AUTO_PORTS = 5; // if the port is taken, try the next few by itself
let win = null;
let sock = null;
let settings = { ...DEFAULTS };
let status = { listening: false, port: DEFAULTS.port, error: "", movedFrom: 0, lastLap: null, lapsSaved: 0 };
let pendingUpdate = "";
const f1 = new F1Telemetry();
const acNames = new ACNames();
const ac = new ACTelemetry({ names: acNames });
const fz = new ForzaTelemetry();
let delta = null; // created when the app is ready (needs the user folder)
const dkey = (game, track, car) => (track && car ? `${game}|${track}|${car}` : "");
let f1Uid = "", lastSectors = { game: "", list: [] }; // sectors of the last finished lap, with colours
let fzRace = { route: "", ordinal: null }; // route of the Forza race you are in
let fzSock = null, fzStatus = { listening: false, port: 5300, error: "", movedFrom: 0 };

const settingsFile = () => path.join(app.getPath("userData"), "settings.json");
const backupDir = () => path.join(app.getPath("documents"), "Lapbook");
const clampPort = p => {
  const n = Math.round(Number(p));
  return n >= 1024 && n <= 65535 ? n : DEFAULTS.port;
};

function loadSettings() {
  try {
    settings = { ...DEFAULTS, ...JSON.parse(fs.readFileSync(settingsFile(), "utf8")) };
  } catch (e) {
    settings = { ...DEFAULTS };
  }
  settings.port = clampPort(settings.port);
  if (!settings.carNames || typeof settings.carNames !== "object") settings.carNames = {};
  settings.overlay = { ...OVERLAY, ...(settings.overlay || {}) };
  if (settings.overlay.v !== OVERLAY.v) settings.overlay = { ...settings.overlay, v: OVERLAY.v, bounds: settings.overlay.bounds ? { x: settings.overlay.bounds.x, y: settings.overlay.bounds.y } : null };
  for (const k of ["forzaCars", "forzaRoutes", "forzaSegments"]) if (!settings[k] || typeof settings[k] !== "object") settings[k] = {};
  settings.forzaPort = clampPort(settings.forzaPort || 5300);
  fz.cars = settings.forzaCars;
  fz.routes = settings.forzaRoutes;
  fz.segments = settings.forzaSegments;
  fz.raceLaps = !!settings.forzaRaceLaps;
  if (settings.forzaGame && settings.forzaGame !== "auto") fz.game = settings.forzaGame;
  f1.names = settings.carNames;
  acNames.setFolder(settings.acPath);
}
function saveSettings() {
  try {
    fs.writeFileSync(settingsFile(), JSON.stringify(settings, null, 2));
  } catch (e) {}
}

function send(channel, data) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, data);
}
function pushStatus() {
  send("telemetry:status", { ...status, lastPacket: f1.lastPacket, format: f1.format, info: f1.info(), settings, ac: { ...ac.info(), on: settings.acOn, folder: acNames.folder }, fz: { ...fz.info(), ...fzStatus, on: settings.forzaOn } });
}

// Opens the UDP port. If another program already uses it, the next free port
// is taken and the live card tells you which port to set in F1 25.
function listen(port = settings.port, tries = 0) {
  if (sock) {
    try { sock.close(); } catch (e) {}
    sock = null;
  }
  if (tries === 0) status.movedFrom = 0;
  status = { ...status, listening: false, error: "", port };
  const s = dgram.createSocket({ type: "udp4" });
  s.on("message", msg => {
    f1.handle(msg);
    if (!delta || msg.length < 29) return;
    const i = f1.info();
    if (i.uid && i.uid !== f1Uid) {
      f1Uid = i.uid;
      if (i.track && i.car) delta.newSession(dkey("F1 25", i.track, i.car));
    }
    if (msg.readUInt8(6) === 2 && f1.live && i.track && i.car) delta.sample(dkey("F1 25", i.track, i.car), f1.live.lapNum, f1.live.distance, f1.live.current);
  });
  s.on("error", err => {
    try { s.close(); } catch (e) {}
    if (sock === s) sock = null;
    if (err.code === "EADDRINUSE" && tries < AUTO_PORTS) {
      if (tries === 0) status.movedFrom = port;
      return listen(port + 1, tries + 1);
    }
    status.listening = false;
    status.error = err.code === "EADDRINUSE"
      ? `Ports ${settings.port} to ${port} are all used by other programs. Pick another port in the live tracking settings.`
      : String(err.message || err);
    pushStatus();
  });
  s.on("listening", () => {
    status.listening = true;
    if (status.movedFrom) {
      settings.port = port;
      saveSettings();
    }
    pushStatus();
  });
  // 127.0.0.1 = only this PC. "network" also accepts a console or a second PC.
  s.bind(port, settings.network ? "0.0.0.0" : "127.0.0.1");
  sock = s;
}

// ---- Forza "Data Out" on its own port (default 5300), same auto-fallback ----
function listenForza(port = settings.forzaPort, tries = 0) {
  if (fzSock) {
    try { fzSock.close(); } catch (e) {}
    fzSock = null;
  }
  if (tries === 0) fzStatus.movedFrom = 0;
  fzStatus = { ...fzStatus, listening: false, error: "", port };
  if (!settings.forzaOn) return pushStatus();
  const s = dgram.createSocket({ type: "udp4" });
  s.on("message", msg => {
    fz.handle(msg);
    const L = fz.live;
    if (!delta || !L || !fz.cur) return;
    // a time trial is running: record it for the delta
    if (fz.run) delta.sample(dkey(fz.game, fz.run.seg.name, fz.carName(fz.cur.ordinal)), fz.run.t0, fz.run.x, fz.run.t);
    // the run that is being recorded becomes the first one to compare against
    const R = fz.rec;
    if (R && (!R.standing || R.launch)) {
      const t0 = R.standing ? R.launch : R.ts0, d0 = R.standing ? R.launchDist : R.dist0;
      delta.sample(`${fz.game}|~rec|${fz.cur.ordinal}`, t0, fz.cur.distance - d0, fz.cur.ts - t0);
    }
    if (!L.inRace) { fzRace = { route: "", ordinal: null }; return; }
    if (fzRace.ordinal !== fz.cur.ordinal) fzRace = { route: "", ordinal: fz.cur.ordinal };
    delta.sample(`${fz.game}|~|${fz.cur.ordinal}`, L.lapNum, L.x, L.current);
  });
  s.on("error", err => {
    try { s.close(); } catch (e) {}
    if (fzSock === s) fzSock = null;
    if (err.code === "EADDRINUSE" && tries < AUTO_PORTS) {
      if (tries === 0) fzStatus.movedFrom = port;
      return listenForza(port + 1, tries + 1);
    }
    fzStatus.error = err.code === "EADDRINUSE" ? `Forza: ports ${settings.forzaPort} to ${port} are used by other programs.` : String(err.message || err);
    pushStatus();
  });
  s.on("listening", () => {
    fzStatus.listening = true;
    if (fzStatus.movedFrom) {
      settings.forzaPort = port;
      saveSettings();
    }
    pushStatus();
  });
  s.bind(port, settings.network ? "0.0.0.0" : "127.0.0.1");
  fzSock = s;
}
fz.on("lap", lap => {
  if (delta) {
    if (lap.segmentId) delta.moveRun(`${fz.game}|~rec|${lap.ordinal}`, dkey(lap.game, lap.track, lap.car));
    if (!lap.segmentId) {
      delta.moveRun(`${fz.game}|~|${lap.ordinal}`, dkey(lap.game, lap.track, lap.car));
      fzRace.route = lap.track;
    }
    lapDone(lap.game, lap);
  }
  send("telemetry:lap", lap);
  pushStatus();
});
fz.on("segments", seg => {
  settings.forzaSegments = seg;
  saveSettings();
  pushStatus();
});
fz.on("rec", () => pushStatus());
fz.on("run", () => pushStatus());
fz.bestOf = seg => {
  const b = delta && fz.cur ? delta.load(dkey(fz.game, seg.name, fz.carName(fz.cur.ordinal))) : null;
  return b ? b.ms : 0;
};
// Ctrl+Shift+T in the game: start / finish recording a time trial
function markTrial() {
  const r = fz.mark();
  send("forza:mark", r);
  pushStatus();
  return r;
}
fz.on("routes", routes => {
  settings.forzaRoutes = routes;
  saveSettings();
});
// Which Forza is running? Forza sends no game name, so look at the running programs.
let fzCheck = 0;
function detectForza() {
  if (settings.forzaGame && settings.forzaGame !== "auto") { fz.game = settings.forzaGame; return; }
  if (process.platform !== "win32" || Date.now() - fz.lastPacket > 5000 || Date.now() - fzCheck < 15000) return;
  fzCheck = Date.now();
  execFile("tasklist", ["/FO", "CSV", "/NH"], { windowsHide: true, timeout: 8000 }, (err, out) => {
    if (err || !out) return;
    const t = out.toLowerCase();
    const g = t.includes("forzahorizon6") ? "Forza Horizon 6" : t.includes("forzahorizon5") ? "Forza Horizon 5" : t.includes("forzahorizon4") ? "Forza Horizon 4" : t.includes("forza") && t.includes("motorsport") ? "Forza Motorsport" : "";
    if (g && g !== fz.game) {
      fz.game = g;
      pushStatus();
    }
  });
}

// the lap is done: colour its sectors, then let it count for the best lap
function lapDone(game, lap) {
  if (!delta) return;
  const k = dkey(game, lap.track, lap.car);
  if (Array.isArray(lap.sectors)) lastSectors = { game, list: lap.sectors.map((t, i) => ({ t, c: lap.valid ? delta.colour(k, i, t) : "invalid" })), at: Date.now() };
  delta.finish(k, lap.timeInMs, lap.valid, lap.sectors);
}
f1.on("race", race => send("telemetry:race", race));
f1.on("lap", lap => {
  lapDone("F1 25", lap);
  if (!lap.valid && !settings.saveInvalid) {
    send("telemetry:skipped", lap);
    return;
  }
  status.lastLap = { track: lap.track, car: lap.car, timeInMs: lap.timeInMs, at: Date.now() };
  status.lapsSaved++;
  send("telemetry:lap", lap);
  pushStatus();
});

ac.on("car", c => {
  const s = ac.session;
  if (delta && s) delta.sample(dkey("Assetto Corsa", s.track, s.car), c.lapCount, c.pos * 5000, c.lapTime);
});
ac.on("session", s => { if (delta && s) delta.newSession(dkey("Assetto Corsa", s.track, s.car)); });
ac.on("lap", lap => {
  lapDone("Assetto Corsa", lap);
  send("telemetry:lap", lap);
  pushStatus();
});
ac.on("session", pushStatus);
ac.on("error", () => {});

// ---- in-game overlay: a small always-on-top window above the game ----
// It is a normal window drawn on top, nothing is injected into the game.
// Shows over games in borderless / windowed fullscreen mode.
let overlay = null, overlayData = {}, overlayTimer = null;
const ov = () => settings.overlay;
function overlaySize() {
  const k = Math.max(0.6, Math.min(2.5, Number(ov().scale) || 1));
  return { width: Math.round(360 * k), height: Math.round(186 * k) };
}
function placeOverlay() {
  const b = ov().bounds;
  const d = screen.getPrimaryDisplay().workArea;
  const sz = overlaySize();
  if (b && screen.getAllDisplays().some(x => b.x >= x.bounds.x - 50 && b.y >= x.bounds.y - 50 && b.x < x.bounds.x + x.bounds.width && b.y < x.bounds.y + x.bounds.height))
    return { x: b.x, y: b.y, width: b.width || sz.width, height: b.height || sz.height };
  return { x: d.x + d.width - sz.width - 24, y: d.y + 24, ...sz };
}
function pushOverlayConfig() {
  if (!overlay || overlay.isDestroyed()) return;
  overlay.setIgnoreMouseEvents(!!ov().locked);
  overlay.setFocusable(!ov().locked);
  overlay.setResizable(!ov().locked);
  overlay.webContents.send("overlay:config", { locked: ov().locked, scale: ov().scale, opacity: ov().opacity });
}
function openOverlay() {
  if (overlay && !overlay.isDestroyed()) return pushOverlayConfig();
  overlay = new BrowserWindow({
    ...placeOverlay(),
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: !ov().locked,
    focusable: !ov().locked,
    show: false,
    title: "Lapbook overlay",
    webPreferences: { preload: path.join(__dirname, "overlay-preload.js"), contextIsolation: true, sandbox: true, nodeIntegration: false },
  });
  overlay.setAlwaysOnTop(true, "screen-saver");
  overlay.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlay.loadFile(path.join(__dirname, "app", "overlay.html"));
  overlay.webContents.on("did-finish-load", () => {
    pushOverlayConfig();
    overlay.webContents.send("overlay:data", overlayData);
    overlay.showInactive();
  });
  const keep = () => {
    if (!overlay || overlay.isDestroyed()) return;
    ov().bounds = overlay.getBounds();
    saveSettings();
  };
  overlay.on("moved", keep);
  overlay.on("resized", keep);
  overlay.on("closed", () => (overlay = null));
  clearInterval(overlayTimer);
  overlayTimer = setInterval(() => {
    if (!overlay || overlay.isDestroyed()) return;
    overlay.webContents.send("overlay:live", liveForOverlay());
  }, 100);
}
// what the overlay shows right now: running lap, delta, sectors, position
function liveForOverlay() {
  const now = Date.now(), out = { f1: f1.live, fz: fz.live, acAt: ac.lastLap ? ac.lastLap.at : 0 };
  const last = lastSectors.at && now - lastSectors.at < 15000 ? lastSectors : null;
  const i = f1.info();
  if (f1.live && now - f1.live.at < 3000) {
    const L = f1.live, k = dkey("F1 25", i.track, i.car);
    const secs = [L.sector >= 1 ? L.s1 : 0, L.sector >= 2 ? L.s2 : 0, 0];
    Object.assign(out, {
      game: "F1 25", t: L.current, delta: delta && L.distance > 50 ? delta.delta(k, L.distance, L.current) : null, invalid: L.invalid,
      sectors: last && last.game === "F1 25" && L.sector === 0 && L.current < 8000 ? last.list : secs.map((t, j) => ({ t, c: L.invalid ? "invalid" : delta ? delta.colour(k, j, t) : "" })),
      position: i.race ? L.position : 0, cars: i.race ? L.cars : 0,
    });
    return out;
  }
  if (ac.live && now - ac.live.at < 3000 && ac.session) {
    const L = ac.live, s = ac.session, k = dkey("Assetto Corsa", s.track, s.car), sp = ac.split || {};
    const secs = [sp.t1 || 0, sp.t2 && sp.t1 ? sp.t2 - sp.t1 : 0, 0];
    Object.assign(out, {
      game: "Assetto Corsa", t: L.t, delta: delta && L.pos > 0.01 && L.pos < 0.99 ? delta.delta(k, L.pos * 5000, L.t) : null,
      sectors: last && last.game === "Assetto Corsa" && L.t < 8000 ? last.list : secs.map((t, j) => ({ t, c: delta ? delta.colour(k, j, t) : "" })), splits: true,
    });
    return out;
  }
  if (fz.live && now - fz.live.at < 3000 && (fz.rec || fz.run)) {
    const car = fz.cur ? fz.carName(fz.cur.ordinal) : "";
    if (fz.rec) Object.assign(out, { game: fz.game, t: fz.rec.launch || !fz.rec.standing ? (fz.cur ? fz.cur.ts : 0) - (fz.rec.standing ? fz.rec.launch : fz.rec.ts0) : 0, rec: fz.rec.standing && !fz.rec.launch ? "drag" : "rec", trial: "Recording" });
    else Object.assign(out, { game: fz.game, t: fz.run.t, trial: fz.run.seg.name, delta: delta && fz.run.x > 30 ? delta.delta(dkey(fz.game, fz.run.seg.name, car), fz.run.x, fz.run.t) : null });
    return out;
  }
  if (fz.live && now - fz.live.at < 3000 && fz.live.inRace && fz.raceLaps) {
    const L = fz.live, car = fz.cur ? fz.carName(fz.cur.ordinal) : "", k = fzRace.route ? dkey(fz.game, fzRace.route, car) : "";
    Object.assign(out, { game: fz.game, t: L.current, delta: delta && k && L.x > 50 ? delta.delta(k, L.x, L.current) : null, position: L.racePos || 0 });
    return out;
  }
  return out;
}
function closeOverlay() {
  clearInterval(overlayTimer);
  if (overlay && !overlay.isDestroyed()) overlay.close();
  overlay = null;
}
function setOverlay(next) {
  const o = ov();
  Object.assign(o, {
    on: next.on !== undefined ? !!next.on : o.on,
    locked: next.locked !== undefined ? !!next.locked : o.locked,
    scale: next.scale !== undefined ? Math.max(0.6, Math.min(2.5, Number(next.scale) || 1)) : o.scale,
    opacity: next.opacity !== undefined ? Math.max(0.2, Math.min(1, Number(next.opacity) || 0.82)) : o.opacity,
  });
  if (next.scale !== undefined) o.bounds = o.bounds ? { ...o.bounds, ...overlaySize() } : null;
  if (next.reset) o.bounds = null;
  saveSettings();
  if (o.on) {
    openOverlay();
    if (next.scale !== undefined || next.reset) overlay.setBounds(placeOverlay());
  } else closeOverlay();
  pushStatus();
  return o;
}
ipcMain.handle("overlay:set", (e, next) => setOverlay(next || {}));
ipcMain.on("overlay:data", (e, d) => {
  overlayData = d && typeof d === "object" ? d : {};
  if (overlay && !overlay.isDestroyed()) overlay.webContents.send("overlay:data", overlayData);
});

// ---- automatic backup into Documents\Lapbook ----
let lastBackup = "";
function writeBackup(json) {
  if (typeof json !== "string" || json === lastBackup || json.length > 50e6) return;
  try {
    JSON.parse(json);
  } catch (e) {
    return;
  }
  try {
    const dir = backupDir();
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "lapbook-autosave.json"), json);
    const day = new Date().toISOString().slice(0, 10);
    fs.writeFileSync(path.join(dir, `lapbook-${day}.json`), json);
    fs.readdirSync(dir)
      .filter(f => /^lapbook-\d{4}-\d{2}-\d{2}\.json$/.test(f))
      .sort()
      .slice(0, -14)
      .forEach(f => fs.unlinkSync(path.join(dir, f)));
    lastBackup = json;
  } catch (e) {}
}

// ---- update packages ----
const updateArg = argv => (argv || []).find(a => /\.lapbook-update$/i.test(a) && fs.existsSync(a)) || "";
function offerUpdate(file) {
  if (!file) return;
  if (win && !win.isDestroyed() && !win.webContents.isLoading()) send("update:open", file);
  else pendingUpdate = file;
}

function createWindow() {
  win = new BrowserWindow({
    width: 1180,
    height: 900,
    minWidth: 380,
    minHeight: 500,
    backgroundColor: "#0b0b0d",
    title: "Lapbook",
    icon: path.join(__dirname, "build", "icon.png"),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });
  win.removeMenu();
  win.loadFile(path.join(__dirname, "app", "lapbook.html"));
  win.webContents.on("did-finish-load", () => {
    pushStatus();
    if (pendingUpdate) {
      send("update:open", pendingUpdate);
      pendingUpdate = "";
    }
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  // dropping a file must never navigate the window away from Lapbook
  win.webContents.on("will-navigate", (e, url) => {
    e.preventDefault();
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
  });
  win.webContents.session.on("will-download", (e, item) => {
    fs.mkdirSync(backupDir(), { recursive: true });
    item.setSaveDialogOptions({ defaultPath: path.join(backupDir(), item.getFilename()) });
  });
  win.on("closed", () => {
    win = null;
    closeOverlay();
  });
}

ipcMain.handle("settings:get", () => settings);
ipcMain.handle("settings:set", (e, next) => {
  const before = { ...settings };
  const beforeFz = { on: settings.forzaOn, port: settings.forzaPort };
  settings = {
    ...settings,
    port: clampPort(next && next.port),
    saveInvalid: !!(next && next.saveInvalid),
    network: !!(next && next.network),
    acOn: next && next.acOn !== undefined ? !!next.acOn : settings.acOn,
    forzaOn: next && next.forzaOn !== undefined ? !!next.forzaOn : settings.forzaOn,
    forzaPort: next && next.forzaPort !== undefined ? clampPort(next.forzaPort) : settings.forzaPort,
    forzaGame: next && next.forzaGame ? String(next.forzaGame) : settings.forzaGame,
    forzaRaceLaps: next && next.forzaRaceLaps !== undefined ? !!next.forzaRaceLaps : settings.forzaRaceLaps,
  };
  fz.raceLaps = !!settings.forzaRaceLaps;
  if (settings.forzaGame !== "auto") fz.game = settings.forzaGame;
  saveSettings();
  if (before.port !== settings.port || before.network !== settings.network) listen();
  if (settings.acOn) ac.start();
  else ac.stop();
  if (beforeFz.on !== settings.forzaOn || beforeFz.port !== settings.forzaPort || before.network !== settings.network) listenForza();
  pushStatus();
  return settings;
});
// Forza: name a car (by its number) or a route; laps keep their link by name
ipcMain.handle("forza:nameCar", (e, ordinal, name) => {
  const id = String(Math.round(Number(ordinal)));
  const n = String(name || "").trim().slice(0, 80);
  if (!/^\d+$/.test(id) || !n) return { ok: false };
  const old = settings.forzaCars[id] || placeholderCar(id);
  settings.forzaCars[id] = n;
  if (delta) for (const r of settings.forzaRoutes[fz.game] || []) delta.rename(dkey(fz.game, r.name, old), dkey(fz.game, r.name, n));
  fz.cars = settings.forzaCars;
  saveSettings();
  pushStatus();
  return { ok: true, old, name: n };
});
ipcMain.handle("forza:nameRoute", (e, game, id, name) => {
  const list = settings.forzaRoutes[game] || [];
  const r = list.find(x => x.id === id);
  const n = String(name || "").trim().slice(0, 80);
  if (!r || !n) return { ok: false };
  const old = r.name;
  r.name = n;
  if (delta && fz.cur) delta.rename(dkey(game, old, fz.carName(fz.cur.ordinal)), dkey(game, n, fz.carName(fz.cur.ordinal)));
  if (fzRace.route === old) fzRace.route = n;
  fz.routes = settings.forzaRoutes;
  saveSettings();
  pushStatus();
  return { ok: true, old, name: n };
});
ipcMain.handle("forza:list", () => ({ cars: settings.forzaCars, routes: settings.forzaRoutes, segments: settings.forzaSegments, game: fz.game }));
ipcMain.handle("forza:mark", () => markTrial());
ipcMain.handle("forza:cancel", () => { fz.cancelRecording(); pushStatus(); return { ok: true }; });
ipcMain.handle("forza:nameSegment", (e, game, id, name) => {
  const list = settings.forzaSegments[game] || [];
  const r = list.find(x => x.id === id);
  const n = String(name || "").trim().slice(0, 80);
  if (!r) return { ok: false };
  if (!n) {
    settings.forzaSegments[game] = list.filter(x => x.id !== id);
    fz.segments = settings.forzaSegments;
    saveSettings();
    pushStatus();
    return { ok: true, deleted: true, old: r.name };
  }
  if (list.some(x => x !== r && x.name === n)) return { ok: false, error: "A time trial with that name exists already." };
  const old = r.name;
  r.name = n;
  fz.segments = settings.forzaSegments;
  const cars = [...Object.values(settings.forzaCars), ...Object.keys(settings.forzaCars).map(placeholderCar)];
  if (fz.cur) cars.push(fz.carName(fz.cur.ordinal));
  if (delta) for (const car of new Set(cars)) delta.rename(dkey(game, old, car), dkey(game, n, car));
  saveSettings();
  pushStatus();
  return { ok: true, old, name: n, kind: r.kind };
});
ipcMain.handle("forza:deleteRoute", (e, game, id) => {
  settings.forzaRoutes[game] = (settings.forzaRoutes[game] || []).filter(x => x.id !== id);
  fz.routes = settings.forzaRoutes;
  saveSettings();
  return { ok: true };
});
// Microsoft Store / Game Pass versions of Forza may not send to 127.0.0.1 until
// Windows allows it ("loopback exemption"). This asks Windows for admin rights once.
ipcMain.handle("forza:loopback", () => {
  if (process.platform !== "win32") return { ok: false, error: "Only needed on Windows." };
  const script = [
    "$fams = Get-AppxPackage | Where-Object { $_.Name -match 'Forza|SunriseBaseGame|624F8B84B80' -or (((Get-AppxPackageManifest $_ -ErrorAction SilentlyContinue).Package.Properties.DisplayName) -match 'Forza') } | ForEach-Object { $_.PackageFamilyName }",
    "if (-not $fams) { Write-Host 'No Microsoft Store / Game Pass version of Forza found. The Steam version does not need this.'; Start-Sleep 6; exit }",
    "foreach ($f in $fams) { CheckNetIsolation.exe LoopbackExempt -a -n=$f; Write-Host ('Allowed: ' + $f) }",
    "Write-Host 'Done. Restart Forza.'; Start-Sleep 5",
  ].join("\n");
  const enc = Buffer.from(script, "utf16le").toString("base64");
  try {
    spawn("powershell.exe", ["-NoProfile", "-Command", `Start-Process powershell.exe -Verb RunAs -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-EncodedCommand','${enc}'`], { windowsHide: true, detached: true, stdio: "ignore" }).unref();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
});

// F1 25 car names: the built-in list plus your own names for unknown team IDs
ipcMain.handle("cars:known", () => {
  const all = { ...knownCars() };
  for (const [id, n] of Object.entries(settings.carNames)) all[id] = n;
  return { names: all, placeholder: Object.fromEntries(Object.keys(all).map(id => [id, unknownCar(id)])), old: Object.fromEntries(Object.keys(all).map(id => [id, oldNames(Number(id))])) };
});
ipcMain.handle("cars:name", (e, teamId, name) => {
  const id = String(Math.round(Number(teamId)));
  const n = String(name || "").trim().slice(0, 60);
  if (!/^\d+$/.test(id)) return { ok: false };
  if (n) settings.carNames[id] = n;
  else delete settings.carNames[id];
  f1.names = settings.carNames;
  saveSettings();
  pushStatus();
  return { ok: true, id, name: n };
});
// Assetto Corsa folder for real car and track names
ipcMain.handle("ac:folder", (e, dir) => {
  settings.acPath = String(dir || "");
  saveSettings();
  const found = acNames.setFolder(settings.acPath);
  pushStatus();
  return found;
});
ipcMain.handle("ac:pick", async () => {
  const r = await dialog.showOpenDialog(win, { title: "Choose your Assetto Corsa folder (the one with content\\cars inside)", properties: ["openDirectory"] });
  return r.canceled ? "" : r.filePaths[0] || "";
});
ipcMain.on("backup:write", (e, json) => writeBackup(json));
ipcMain.handle("backup:open", async () => {
  fs.mkdirSync(backupDir(), { recursive: true });
  return shell.openPath(backupDir());
});

ipcMain.handle("app:info", () => {
  const cur = updates.readCurrent(app.getPath("userData"));
  return {
    version: META.version,
    shellVersion: META.shellVersion,
    overlay: !!META.overlay,
    canRollback: !!META.overlay || !!(cur && cur.previous),
    previous: cur && cur.previous ? cur.previous.version : META.overlay ? META.shellVersion : "",
    bootError: META.bootError,
  };
});
ipcMain.handle("update:check", (e, file) => {
  const pkg = updates.readPackage(String(file || ""), META.shellVersion);
  if (!pkg.ok) return pkg;
  return { ok: true, manifest: pkg.manifest, current: META.version, isNewer: updates.newer(pkg.manifest.version, META.version), same: pkg.manifest.version === META.version };
});
ipcMain.handle("update:install", async (e, file) => {
  const pkg = updates.readPackage(String(file || ""), META.shellVersion);
  if (!pkg.ok) return pkg;
  try {
    updates.install(app.getPath("userData"), pkg);
  } catch (err) {
    return { ok: false, error: "The update could not be saved: " + String(err.message || err) };
  }
  setTimeout(() => {
    app.relaunch();
    app.exit(0);
  }, 900);
  return { ok: true };
});
ipcMain.handle("update:rollback", () => {
  updates.rollback(app.getPath("userData"));
  setTimeout(() => {
    app.relaunch();
    app.exit(0);
  }, 600);
  return { ok: true };
});
ipcMain.handle("update:pick", async () => {
  const r = await dialog.showOpenDialog(win, { title: "Choose a Lapbook update", filters: [{ name: "Lapbook update", extensions: ["lapbook-update"] }], properties: ["openFile"] });
  return r.canceled ? "" : r.filePaths[0] || "";
});

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", (e, argv) => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
    offerUpdate(updateArg(argv));
  });
  app.whenReady().then(() => {
    loadSettings();
    delta = new DeltaTracker(path.join(app.getPath("userData"), "best-laps"));
    createWindow();
    listen();
    if (settings.acOn) ac.start();
    listenForza();
    setInterval(detectForza, 3000);
    if (ov().on) openOverlay();
    // Ctrl+Shift+O: overlay on/off, Ctrl+Shift+L: lock/unlock (to move it)
    globalShortcut.register("CommandOrControl+Shift+O", () => setOverlay({ on: !ov().on }));
    globalShortcut.register("CommandOrControl+Shift+T", () => markTrial());
    globalShortcut.register("CommandOrControl+Shift+L", () => { if (ov().on) setOverlay({ locked: !ov().locked }); });
    offerUpdate(updateArg(process.argv));
    setInterval(pushStatus, 2000);
  });
  app.on("will-quit", () => globalShortcut.unregisterAll());
  app.on("window-all-closed", () => app.quit());
}

process.on("uncaughtException", err => {
  try {
    dialog.showErrorBox("Lapbook", String((err && err.stack) || err));
  } catch (e) {}
});
