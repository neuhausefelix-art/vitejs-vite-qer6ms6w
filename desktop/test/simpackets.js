// Builds fake packets for ACC (broadcasting), Project CARS 2 (UDP) and a fake LMU web API.
"use strict";
const http = require("http");
const NO = 2147483647;
const s16 = s => { const b = Buffer.from(s, "utf8"), h = Buffer.alloc(2); h.writeUInt16LE(b.length); return Buffer.concat([h, b]); };
const u8 = v => Buffer.from([v]);
const u16 = v => { const b = Buffer.alloc(2); b.writeUInt16LE(v); return b; };
const i32 = v => { const b = Buffer.alloc(4); b.writeInt32LE(v); return b; };
const f32 = v => { const b = Buffer.alloc(4); b.writeFloatLE(v); return b; };
const lap = (ms, splits = [], invalid = false, car = 0) => Buffer.concat([i32(ms || NO), u16(car), u16(0), u8(splits.length), ...splits.map(i32), u8(invalid ? 1 : 0), u8(invalid ? 0 : 1), u8(0), u8(0)]);
const acc = {
  registration: (id = 7, ok = true, err = "") => Buffer.concat([u8(1), i32(id), u8(ok ? 1 : 0), u8(1), s16(err)]),
  track: (name = "monza", meters = 5793) => Buffer.concat([u8(5), i32(7), s16(name), i32(1), i32(meters), u8(0), u8(0)]),
  entryCar: (car = 3, model = 30) => Buffer.concat([u8(6), u16(car), u8(model), s16("Team"), i32(46), u8(0), u8(0), u16(0), u8(1), s16("Max"), s16("Racer"), s16("RAC"), u8(0), u16(0)]),
  realtime: (focused = 3, sessionType = 0, session = 0) => Buffer.concat([u8(2), u16(0), u16(session), u8(sessionType), u8(5), f32(1000), f32(9000), i32(focused), s16("drivable"), s16("chase"), s16("Basic"), u8(0), f32(50000), u8(22), u8(30), u8(1), u8(0), u8(0), lap(0)]),
  car: ({ car = 3, laps = 0, spline = 0.5, last = 0, lastSplits = [], lastInvalid = false, cur = 0, curSplits = [], curInvalid = false, position = 4 } = {}) =>
    Buffer.concat([u8(3), u16(car), u16(0), u8(1), u8(5), f32(0), f32(0), f32(0), u8(1), u16(200), u16(position), u16(position), u16(position), f32(spline), u16(laps), i32(0), lap(0), lap(last, lastSplits, lastInvalid, car), lap(cur, curSplits, curInvalid, car)]),
};
// ---- Project CARS 2 ----
function base(type, size) { const b = Buffer.alloc(size); b.writeUInt8(type, 10); b.writeUInt8(1, 11); return b; }
const pc2 = {
  race: (loc = "Brands Hatch", variation = "Indy", length = 1929) => { const b = base(1, 308); b.writeFloatLE(length, 44); b.write(loc, 48, "latin1"); b.write(variation, 112, "latin1"); return b; },
  timings: ({ lap = 0, current = 10, sector = 1, distance = 500, invalid = false, position = 3, carIndex = 5, local = 0 } = {}) => {
    const b = base(3, 1059);
    b.writeInt8(2, 12);
    for (let i = 0; i < 2; i++) {
      const o = 33 + i * 32, me = i === local;
      b.writeUInt16LE(me ? distance : 100, o + 12);
      b.writeUInt8((me ? position : 1) | 0x80, o + 14);
      b.writeUInt8(me ? sector : 1, o + 15);
      b.writeUInt16LE((me ? carIndex : 9) | (me ? 0x8000 : 0), o + 18);
      b.writeUInt8(2 | (me && invalid ? 0x80 : 0), o + 20);
      b.writeUInt8(me ? lap : 0, o + 21);
      b.writeFloatLE(me ? current : 5, o + 22);
    }
    b.writeUInt16LE(local, 1057);
    return b;
  },
  stats: (last = 0, index = 0) => { const b = base(7, 1040); b.writeFloatLE(last, 16 + index * 32 + 4); return b; },
  vehicles: (list = [[5, "McLaren 720S GT3"]], packed = false) => { const b = base(8, 1164); list.forEach(([idx, n], i) => { const o = 12 + i * 72; b.writeUInt16LE(idx, o); b.write(n, o + (packed ? 6 : 8), "latin1"); }); return b; },
  gameState: (session = 5) => { const b = base(4, 24); b.writeUInt8(2 | (session << 4), 14); return b; },
};
// ---- Le Mans Ultimate: a small HTTP server that answers like the game ----
function lmuServer(state) {
  const srv = http.createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");
    if (req.url === "/rest/watch/standings") return res.end(JSON.stringify(state.standings));
    if (req.url === "/rest/watch/sessionInfo") return res.end(JSON.stringify(state.session));
    res.statusCode = 404; res.end("{}");
  });
  return new Promise(r => srv.listen(0, "127.0.0.1", () => r(srv)));
}
module.exports = { acc, pc2, lmuServer, NO };
