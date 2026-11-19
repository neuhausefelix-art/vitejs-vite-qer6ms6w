// Lapbook for Windows: the Lapbook page in its own window, plus a listener
// for the F1 25 UDP telemetry so finished laps are logged automatically.
"use strict";
const { app, BrowserWindow, ipcMain, shell, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const dgram = require("dgram");
const { F1Telemetry } = require("./f1-25.js");
const updates = require("./updates.js");

const META = global.LAPBOOK || { shellVersion: app.getVersion(), version: app.getVersion(), overlay: null, bootError: "" };
const DEFAULTS = { port: 20777, saveInvalid: false, network: false };
const AUTO_PORTS = 5; // if the port is taken, try the next few by itself
let win = null;
let sock = null;
let settings = { ...DEFAULTS };
let status = { listening: false, port: DEFAULTS.port, error: "", movedFrom: 0, lastLap: null, lapsSaved: 0 };
let pendingUpdate = "";
const f1 = new F1Telemetry();

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
  send("telemetry:status", { ...status, lastPacket: f1.lastPacket, format: f1.format, info: f1.info(), settings });
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
  win.on("closed", () => (win = null));
}

ipcMain.handle("settings:get", () => settings);
ipcMain.handle("settings:set", (e, next) => {
  const before = { ...settings };
  settings = {
    port: clampPort(next && next.port),
    saveInvalid: !!(next && next.saveInvalid),
    network: !!(next && next.network),
  };
  saveSettings();
  if (before.port !== settings.port || before.network !== settings.network) listen();
  pushStatus();
  return settings;
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
    offerUpdate(updateArg(process.argv));
    setInterval(pushStatus, 2000);
  });
  app.on("window-all-closed", () => app.quit());
}

process.on("uncaughtException", err => {
  try {
    dialog.showErrorBox("Lapbook", String((err && err.stack) || err));
  } catch (e) {}
});
