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
const updates = require("./updates.js");

const META = global.LAPBOOK || { shellVersion: app.getVersion(), version: app.getVersion(), overlay: null, bootError: "" };
const OVERLAY = { on: false, locked: true, scale: 1, opacity: 0.82, bounds: null };
const DEFAULTS = { port: 20777, saveInvalid: false, network: false, carNames: {}, acPath: "", acOn: true, overlay: { ...OVERLAY }, forzaOn: true, forzaPort: 5300, forzaGame: "auto", forzaCars: {}, forzaRoutes: {} };
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
  for (const k of ["forzaCars", "forzaRoutes"]) if (!settings[k] || typeof settings[k] !== "object") settings[k] = {};
  settings.forzaPort = clampPort(settings.forzaPort || 5300);
  fz.cars = settings.forzaCars;
  fz.routes = settings.forzaRoutes;
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
  s.on("message", msg => f1.handle(msg));
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
  s.on("message", msg => fz.handle(msg));
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
  send("telemetry:lap", lap);
  pushStatus();
});
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

f1.on("lap", lap => {
  if (!lap.valid && !settings.saveInvalid) {
    send("telemetry:skipped", lap);
    return;
  }
  status.lastLap = { track: lap.track, car: lap.car, timeInMs: lap.timeInMs, at: Date.now() };
  status.lapsSaved++;
  send("telemetry:lap", lap);
  pushStatus();
});

ac.on("lap", lap => {
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
  return { width: Math.round(300 * k), height: Math.round(168 * k) };
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
    overlay.webContents.send("overlay:live", { f1: f1.live, fz: fz.live, acAt: ac.lastLap ? ac.lastLap.at : 0 });
  }, 100);
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
  };
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
  fz.routes = settings.forzaRoutes;
  saveSettings();
  pushStatus();
  return { ok: true, old, name: n };
});
ipcMain.handle("forza:list", () => ({ cars: settings.forzaCars, routes: settings.forzaRoutes, game: fz.game }));
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
    createWindow();
    listen();
    if (settings.acOn) ac.start();
    listenForza();
    setInterval(detectForza, 3000);
    if (ov().on) openOverlay();
    // Ctrl+Shift+O: overlay on/off, Ctrl+Shift+L: lock/unlock (to move it)
    globalShortcut.register("CommandOrControl+Shift+O", () => setOverlay({ on: !ov().on }));
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
