// The only bridge between the Lapbook page and the desktop side.
"use strict";
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("lapbridge", {
  onLap: cb => ipcRenderer.on("telemetry:lap", (e, lap) => cb(lap)),
  onSkipped: cb => ipcRenderer.on("telemetry:skipped", (e, lap) => cb(lap)),
  onStatus: cb => ipcRenderer.on("telemetry:status", (e, s) => cb(s)),
  getSettings: () => ipcRenderer.invoke("settings:get"),
  setSettings: s => ipcRenderer.invoke("settings:set", s),
  backup: json => ipcRenderer.send("backup:write", json),
  openBackups: () => ipcRenderer.invoke("backup:open"),
});
