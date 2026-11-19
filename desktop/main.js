// Lapbook for Windows: the Lapbook page in its own window, plus a listener
// for the F1 25 UDP telemetry so finished laps are logged automatically.
"use strict";
const { app, BrowserWindow, ipcMain, shell, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const dgram = require("dgram");
const { F1Telemetry } = require("./f1-25.js");

const DEFAULTS = { port: 20777, saveInvalid: false, network: false };
let win = null;
let sock = null;
let settings = { ...DEFAULTS };
let status = { listening: false, port: DEFAULTS.port, error: "", lastPacket: 0, format: 0, unsupported: 0 };
const f1 = new F1Telemetry();

const settingsFile = () => path.join(app.getPath("userData"), "settings.json");
const backupDir = () => path.join(app.getPath("documents"), "Lapbook");

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
const clampPort = p => {
  const n = Math.round(Number(p));
  return n >= 1024 && n <= 65535 ? n : DEFAULTS.port;
};

function send(channel, data) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, data);
}
function pushStatus() {
  send("telemetry:status", { ...status, lastPacket: f1.lastPacket, format: f1.format, settings });
}

function listen() {
  if (sock) {
    try { sock.close(); } catch (e) {}
    sock = null;
  }
  status = { ...status, listening: false, error: "", port: settings.port };
  const s = dgram.createSocket({ type: "udp4", reuseAddr: true });
  s.on("message", msg => f1.handle(msg));
  s.on("error", err => {
    status.listening = false;
    status.error = err.code === "EADDRINUSE"
      ? `Port ${settings.port} is already used by another program (for example SimHub). Pick another port in Lapbook and in the game.`
      : String(err.message || err);
    pushStatus();
    try { s.close(); } catch (e) {}
  });
  s.on("listening", () => {
    status.listening = true;
    pushStatus();
  });
  // 127.0.0.1 = only this PC. "network" also accepts a console or a second PC.
  s.bind(settings.port, settings.network ? "0.0.0.0" : "127.0.0.1");
  sock = s;
}

f1.on("lap", lap => {
  if (!lap.valid && !settings.saveInvalid) {
    send("telemetry:skipped", lap);
    return;
  }
  send("telemetry:lap", lap);
});
f1.on("unsupported", format => {
  status.unsupported = format;
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
    // keep the last 14 daily copies
    fs.readdirSync(dir)
      .filter(f => /^lapbook-\d{4}-\d{2}-\d{2}\.json$/.test(f))
      .sort()
      .slice(0, -14)
      .forEach(f => fs.unlinkSync(path.join(dir, f)));
    lastBackup = json;
  } catch (e) {}
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
  win.webContents.on("did-finish-load", pushStatus);

  // links open in the normal browser, the app never navigates away
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith("file://")) {
      e.preventDefault();
      if (/^https?:\/\//.test(url)) shell.openExternal(url);
    }
  });
  // "Download backup" asks where to save, starting in Documents\Lapbook
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

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
  app.whenReady().then(() => {
    loadSettings();
    createWindow();
    listen();
    setInterval(pushStatus, 2000);
  });
  app.on("window-all-closed", () => app.quit());
}

process.on("uncaughtException", err => {
  try {
    dialog.showErrorBox("Lapbook", String(err && err.stack || err));
  } catch (e) {}
});
