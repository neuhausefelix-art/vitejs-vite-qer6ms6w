// Bridge for the in-game overlay window: it receives data and reports its size.
"use strict";
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("overlay", {
  onData: cb => ipcRenderer.on("overlay:data", (e, d) => cb(d)),
  onLive: cb => ipcRenderer.on("overlay:live", (e, d) => cb(d)),
  onConfig: cb => ipcRenderer.on("overlay:config", (e, d) => cb(d)),
  // the overlay tells Lapbook how big its content is
  size: s => ipcRenderer.send("overlay:size", s),
});
