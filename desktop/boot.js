// Starts Lapbook. If an update package was installed (see updates.js), its files
// live in %APPDATA%\Lapbook\updates\<version> and are started instead of the
// built-in ones. If that update fails to start, Lapbook falls back to the
// built-in version and remembers that the update is broken.
"use strict";
const { app } = require("electron");
const path = require("path");
const fs = require("fs");
const { newer, readCurrent, writeCurrent } = require("./updates.js");

const builtIn = app.getVersion();
global.LAPBOOK = { shellVersion: builtIn, version: builtIn, overlay: null, bootError: "" };

function start() {
  const cur = readCurrent(app.getPath("userData"));
  if (!cur || cur.bad || !cur.dir || !cur.version) return false;
  // a newer full install wins over an older update package
  if (!newer(cur.version, builtIn) && cur.version !== builtIn) return false;
  const entry = path.join(cur.dir, "main.js");
  if (!fs.existsSync(entry)) return false;
  try {
    global.LAPBOOK.version = cur.version;
    global.LAPBOOK.overlay = cur;
    require(entry);
    return true;
  } catch (err) {
    writeCurrent(app.getPath("userData"), { ...cur, bad: true, error: String(err && err.message || err) });
    global.LAPBOOK.version = builtIn;
    global.LAPBOOK.overlay = null;
    global.LAPBOOK.bootError = `Update ${cur.version} could not start, so Lapbook went back to version ${builtIn}.`;
    return false;
  }
}

if (!start()) require("./main.js");
