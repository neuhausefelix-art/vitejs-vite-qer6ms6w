// Packet builders shaped like the F1 25 UDP spec, shared by the tests.
"use strict";
const { HEADER, LAP_SIZE, MAX_LAPS, STINT_SIZE, PACKET } = require("../f1-25.js");

function header(id, { uid = 42n, player = 0, format = 2025 } = {}, len) {
  const b = Buffer.alloc(len);
  b.writeUInt16LE(format, 0);
  b.writeUInt8(25, 2);
  b.writeUInt8(id, 6);
  b.writeBigUInt64LE(uid, 7);
  b.writeUInt8(player, 27);
  b.writeUInt8(255, 28);
  return b;
}
function session(opt, { trackId = 11, weather = 0, air = 24, track = 33, type = 18 } = {}) {
  const b = header(PACKET.SESSION, opt, 753);
  b.writeUInt8(weather, 29);
  b.writeInt8(track, 30);
  b.writeInt8(air, 31);
  b.writeUInt8(type, 35);
  b.writeInt8(trackId, 36);
  return b;
}
function participants(opt, teamId) {
  const stride = 57; // F1 25 participant size
  const b = header(PACKET.PARTICIPANTS, opt, HEADER + 1 + 22 * stride);
  b.writeUInt8(20, HEADER);
  const p = opt.player || 0;
  b.writeUInt8(teamId, HEADER + 1 + p * stride + 3);
  return b;
}
function history(opt, laps, stints, car = opt.player || 0) {
  const b = header(PACKET.SESSION_HISTORY, opt, HEADER + 7 + MAX_LAPS * LAP_SIZE + 8 * STINT_SIZE);
  b.writeUInt8(car, HEADER);
  b.writeUInt8(laps.length, HEADER + 1);
  b.writeUInt8(stints.length, HEADER + 2);
  laps.forEach(([ms, valid, secs], i) => {
    const o = HEADER + 7 + i * LAP_SIZE;
    b.writeUInt32LE(ms, o);
    if (secs) { b.writeUInt16LE(secs[0] % 60000, o + 4); b.writeUInt8(Math.floor(secs[0] / 60000), o + 6); b.writeUInt16LE(secs[1] % 60000, o + 7); b.writeUInt8(Math.floor(secs[1] / 60000), o + 9); b.writeUInt16LE(secs[2] % 60000, o + 10); b.writeUInt8(Math.floor(secs[2] / 60000), o + 12); }
    b.writeUInt8(valid ? 15 : 0, o + 13);
  });
  stints.forEach(([end, visual], i) => {
    const o = HEADER + 7 + MAX_LAPS * LAP_SIZE + i * STINT_SIZE;
    b.writeUInt8(end, o);
    b.writeUInt8(visual, o + 1);
    b.writeUInt8(visual, o + 2);
  });
  return b;
}

module.exports = { header, session, participants, history };
const { PACKET: _P } = require("../f1-25.js");

// Lap Data: 22 cars of 57 bytes (F1 25) + 2 time-trial bytes
function lapData(opt, { last = 0, current = 0, lapNum = 1, invalid = 0, distance = 0, position = 1, sector = 0, s1 = 0, s2 = 0 } = {}) {
  const stride = 57;
  const b = header(PACKET.LAP_DATA, opt, HEADER + 22 * stride + 2);
  const o = HEADER + (opt.player || 0) * stride;
  b.writeUInt32LE(last, o);
  b.writeUInt32LE(current, o + 4);
  b.writeUInt8(lapNum, o + 33);
  b.writeUInt8(invalid, o + 37);
  b.writeFloatLE(distance, o + 20);
  b.writeUInt8(position, o + 32);
  b.writeUInt8(sector, o + 36);
  b.writeUInt16LE(s1, o + 8);
  b.writeUInt16LE(s2, o + 11);
  return b;
}
module.exports.lapData = lapData;

// Final Classification: 22 cars of 46 bytes (F1 25)
function final(opt, { finish = 3, laps = 10, start = 7, status = 4, cars = 20, best = 81000 } = {}) {
  const stride = 46;
  const b = header(PACKET.FINAL_CLASSIFICATION, opt, HEADER + 1 + 22 * stride);
  b.writeUInt8(cars, HEADER);
  const o = HEADER + 1 + (opt.player || 0) * stride;
  b.writeUInt8(finish, o); b.writeUInt8(laps, o + 1); b.writeUInt8(start, o + 2); b.writeUInt8(status, o + 5); b.writeUInt32LE(best, o + 6);
  return b;
}
module.exports.final = final;

// ---- career weekend: session with season/weekend ids, all drivers, full results ----
function careerSession(opt, { type = 15, trackId = 11, season = 777, weekend = 1, link = 1, mode = 28, structure = [1, 2, 3, 5, 6, 7, 15] } = {}) {
  const b = session(opt, { type, trackId });
  b.writeUInt32LE(season, 670); b.writeUInt32LE(weekend, 674); b.writeUInt32LE(link, 678);
  b.writeUInt8(mode, 694); b.writeUInt8(structure.length, 732);
  structure.forEach((t, i) => b.writeUInt8(t, 733 + i));
  return b;
}
// grid: [{ name, teamId, driverId, number }]
function participantsAll(opt, grid) {
  const stride = 57, b = header(PACKET.PARTICIPANTS, opt, HEADER + 1 + 22 * stride);
  b.writeUInt8(grid.length, HEADER);
  grid.forEach((g, i) => {
    const o = HEADER + 1 + i * stride;
    b.writeUInt8(g.ai === false ? 0 : 1, o); b.writeUInt8(g.driverId, o + 1); b.writeUInt8(g.teamId, o + 3); b.writeUInt8(g.number || i + 1, o + 5);
    b.write(g.name, o + 7, 31, "utf8");
  });
  return b;
}
// rows: [{ position, grid, points, status, best, laps }] in car order
function finalAll(opt, rows) {
  const stride = 46, b = header(PACKET.FINAL_CLASSIFICATION, opt, HEADER + 1 + 22 * stride);
  b.writeUInt8(rows.length, HEADER);
  rows.forEach((r, i) => {
    const o = HEADER + 1 + i * stride;
    b.writeUInt8(r.position, o); b.writeUInt8(r.laps || 10, o + 1); b.writeUInt8(r.grid || r.position, o + 2); b.writeUInt8(r.points || 0, o + 3);
    b.writeUInt8(r.pits || 1, o + 4); b.writeUInt8(r.status || 4, o + 5); b.writeUInt8(0, o + 6); b.writeUInt32LE(r.best || 80000 + i * 100, o + 7); b.writeDoubleLE(r.time || 3600 + i, o + 11);
  });
  return b;
}
Object.assign(module.exports, { careerSession, participantsAll, finalAll });
