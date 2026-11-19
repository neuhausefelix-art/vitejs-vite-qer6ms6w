// The only bridge between the Lapbook page and the desktop side.
"use strict";
const { contextBridge, ipcRenderer, webUtils } = require("electron");

contextBridge.exposeInMainWorld("lapbridge", {
  onLap: cb => ipcRenderer.on("telemetry:lap", (e, lap) => cb(lap)),
  onSkipped: cb => ipcRenderer.on("telemetry:skipped", (e, lap) => cb(lap)),
  onStatus: cb => ipcRenderer.on("telemetry:status", (e, s) => cb(s)),
  getSettings: () => ipcRenderer.invoke("settings:get"),
  setSettings: s => ipcRenderer.invoke("settings:set", s),
  backup: json => ipcRenderer.send("backup:write", json),
  openBackups: () => ipcRenderer.invoke("backup:open"),
  // updates
  appInfo: () => ipcRenderer.invoke("app:info"),
  pathOf: file => {
    try { return webUtils.getPathForFile(file) || ""; } catch (e) { return ""; }
  },
  pickUpdate: () => ipcRenderer.invoke("update:pick"),
  checkUpdate: file => ipcRenderer.invoke("update:check", file),
  installUpdate: file => ipcRenderer.invoke("update:install", file),
  rollback: () => ipcRenderer.invoke("update:rollback"),
  knownCars: () => ipcRenderer.invoke("cars:known"),
  nameCar: (teamId, name) => ipcRenderer.invoke("cars:name", teamId, name),
  setACFolder: dir => ipcRenderer.invoke("ac:folder", dir),
  pickACFolder: () => ipcRenderer.invoke("ac:pick"),
  setOverlay: o => ipcRenderer.invoke("overlay:set", o),
  overlayData: d => ipcRenderer.send("overlay:data", d),
  forzaNameCar: (ordinal, name) => ipcRenderer.invoke("forza:nameCar", ordinal, name),
  forzaNameRoute: (game, id, name) => ipcRenderer.invoke("forza:nameRoute", game, id, name),
  forzaList: () => ipcRenderer.invoke("forza:list"),
  forzaDeleteRoute: (game, id) => ipcRenderer.invoke("forza:deleteRoute", game, id),
  forzaLoopback: () => ipcRenderer.invoke("forza:loopback"),
  onOpenUpdate: cb => ipcRenderer.on("update:open", (e, file) => cb(file)),
});
