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
  laps.forEach(([ms, valid], i) => {
    const o = HEADER + 7 + i * LAP_SIZE;
    b.writeUInt32LE(ms, o);
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

// Lap Data: 22 cars of 57 bytes (F1 25) + 2 time-trial bytes
function lapData(opt, { last = 0, current = 0, lapNum = 1, invalid = 0 } = {}) {
  const stride = 57;
  const b = header(PACKET.LAP_DATA, opt, HEADER + 22 * stride + 2);
  const o = HEADER + (opt.player || 0) * stride;
  b.writeUInt32LE(last, o);
  b.writeUInt32LE(current, o + 4);
  b.writeUInt8(lapNum, o + 33);
  b.writeUInt8(invalid, o + 37);
  return b;
}
module.exports.lapData = lapData;
