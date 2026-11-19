/* Lapbook desktop: live tracking (F1 25, Assetto Corsa), automatic backups,
   drag-and-drop updates and a wide-screen layout.
   Uses the Lapbook page's own functions and styles (D, save, render, toast, .panel, .b ...),
   so the design stays the same. */
(function () {
  const B = window.lapbridge;
  if (!B) return;
  const F1 = "F1 25", AC = "Assetto Corsa", FZ = "Forza";
  const isFz = g => /^Forza/.test(g || "");
  let st = { listening: false, port: 20777, error: "", movedFrom: 0, lastPacket: 0, info: {}, lastLap: null, settings: { port: 20777, saveInvalid: false, network: false, acOn: true, carNames: {} }, ac: { connected: false, on: true, folder: "" }, fz: { live: false, on: true, port: 5300, game: "Forza Horizon 6" } };
  let info = { version: "", overlay: false, canRollback: false, previous: "" };
  const added = { [F1]: 0, [AC]: 0 }, lastLap = {};
  const addedFz = () => Object.entries(added).filter(([g]) => isFz(g)).reduce((n, [, v]) => n + v, 0);
  let fzWas = false;
  let skipped = 0, wasLive = false, acWas = false, showHow = false, tab = F1;
  let ok = false;
  try { ok = localStorage.getItem("lapbook.liveok") === "1"; tab = localStorage.getItem("lapbook.livetab") || F1; } catch (e) {}

  const css = document.createElement("style");
  css.textContent = `
  .live{display:flex;flex-direction:column;gap:10px;margin:0 0 14px}
  .live .lh{display:flex;align-items:center;gap:10px;justify-content:space-between;flex-wrap:wrap}
  .live .lt{font-weight:700;font-size:18px;display:flex;align-items:center;gap:8px}
  .live .dot{width:10px;height:10px;border-radius:50%;background:var(--mu);flex:none}
  .live.on .dot{background:var(--gr);box-shadow:0 0 0 4px color-mix(in srgb,var(--gr) 25%,transparent)}
  .live.err .dot{background:var(--dn)}
  .live .ls{color:var(--mu);font-size:14px}
  .live .big{font-size:30px;font-weight:700;font-variant-numeric:tabular-nums;color:var(--pu);line-height:1}
  .live .game{border-top:1px solid var(--ln);padding-top:10px}.live .game:first-of-type{border-top:0;padding-top:0}
  .live .nm2{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.live .nm2 input{flex:1;min-width:180px;width:auto}
  .steps{display:flex;flex-direction:column;gap:6px;margin:0;padding:0;list-style:none}
  .steps li{display:flex;gap:10px;align-items:flex-start;font-size:15px}
  .steps i{font-style:normal;width:22px;height:22px;border-radius:50%;border:1.5px solid var(--ln);display:inline-flex;align-items:center;justify-content:center;font-size:12px;flex:none;color:var(--mu)}
  .steps .done i{background:var(--gr);border-color:var(--gr);color:#0b0b0d;font-weight:700}
  .steps .done span{color:var(--mu)}
  .gset{display:grid;grid-template-columns:auto 1fr;gap:4px 16px;font-size:14px;background:var(--sf2);border-radius:var(--r);padding:10px 12px}
  .gset b{font-variant-numeric:tabular-nums}
  .warn2{color:var(--pu);font-size:14px}
  .drop{border:2px dashed var(--ln);border-radius:var(--r);padding:26px 16px;text-align:center;color:var(--mu);margin:10px 0}
  .drop.over{border-color:var(--rd);color:var(--tx);background:var(--sf2)}
  .drop b{display:block;color:var(--tx);font-size:17px;margin-bottom:4px}
  #dropall{position:fixed;inset:0;z-index:20;display:none;align-items:center;justify-content:center;background:#000c;pointer-events:none}
  #dropall.on{display:flex}#dropall div{border:2px dashed var(--rd);border-radius:var(--r);padding:40px 48px;background:var(--sf);font-size:20px;font-weight:700;text-align:center}
  #dropall small{display:block;font-weight:400;font-size:14px;margin-top:6px}
  /* backups are written automatically on the PC, so the browser reminder is not needed */
  #app .note:has([data-act=dl]){display:none}
  .rcp{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:12px 0}
  .rcp div{background:var(--sf2);border-radius:var(--r);padding:10px 12px}.rcp b{display:block;font-size:22px;font-variant-numeric:tabular-nums;line-height:1.15}.rcp span{font-size:12px;color:var(--mu)}
  .rcp .new{color:var(--pu)}
  .secg{display:grid;grid-template-columns:auto repeat(3,1fr) auto;gap:4px 14px;font-variant-numeric:tabular-nums;font-size:15px;align-items:baseline}
  .secg span{color:var(--mu);font-size:12px}.secg b{font-weight:600}.secg .pu{color:var(--pu)}
  .unotes{margin:6px 0 0;padding-left:18px;color:var(--mu);font-size:14px}
  .md h4{margin:16px 0 6px;font-size:14px}
  .cn{display:grid;grid-template-columns:70px 1fr;gap:6px 10px;align-items:center;font-size:14px}
  /* ---- wide screens: more room, several columns ---- */
  @media (min-width:1200px){
   .wrap{max-width:min(2600px,96vw)}
   .fab{right:calc((100vw - min(2600px,96vw)) / 2 + 16px)}
   .wd{display:grid;grid-template-columns:minmax(0,1fr) minmax(360px,30%);gap:0 28px;align-items:start}
   .wd>.c2{position:sticky;top:76px;max-height:calc(100vh - 90px);overflow:auto}
   .wd.hm>.c2{order:2}
   .wd.tr{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
   .wd.tr>.c2{position:static;max-height:none;overflow:visible}
   #app .list:has(>.gcov){grid-template-columns:repeat(auto-fill,minmax(480px,1fr));gap:14px}
   #app .list>.gcov{height:150px;padding:0 30px;font-size:30px}
   #app .list>.gcov small{font-size:15px}
   #app[data-v=game] .list:has(>.row),#app[data-v=prog] .list,#app[data-v=game] .list:has(>details){display:grid;grid-template-columns:repeat(auto-fill,minmax(460px,1fr));gap:10px}
   #app[data-v=game] .list>.row,#app[data-v=prog] .list>.row{margin-bottom:0}
   #app[data-v=ach] .ac{display:inline-block;vertical-align:top;width:calc(50% - 6px);margin-right:6px}
   .strip{grid-template-columns:repeat(3,minmax(0,1fr))}
   .md{max-width:760px}
  }
  @media (min-width:2200px){.wd{grid-template-columns:minmax(0,1fr) minmax(420px,26%)}#app .list:has(>.gcov){grid-template-columns:repeat(auto-fill,minmax(560px,1fr))}#app .list>.gcov{height:180px;font-size:34px}}`;
  document.head.appendChild(css);

  const f1Live = () => st.listening && Date.now() - st.lastPacket < 5000;
  const acLive = () => st.ac && st.ac.on && st.ac.connected;
  const fzLive = () => st.fz && st.fz.on && st.fz.live;
  const port = () => st.port || st.settings.port;
  const ovOn = () => !!(st.settings.overlay && st.settings.overlay.on);

  // ---------- header buttons ----------
  function header() {
    const a = document.querySelector(".top .acts");
    if (!a) return;
    let b = document.getElementById("tele");
    if (!b) {
      b = document.createElement("button");
      b.id = "tele"; b.className = "b"; b.type = "button";
      b.addEventListener("click", e => { e.stopPropagation(); openPanel(); });
      a.insertBefore(b, a.firstChild);
      const u = document.createElement("button");
      u.id = "upd"; u.className = "b"; u.type = "button"; u.textContent = "Update";
      u.title = "Install a Lapbook update file";
      u.addEventListener("click", e => { e.stopPropagation(); openUpdate(""); });
      a.insertBefore(u, b.nextSibling);
      const o = document.createElement("button");
      o.id = "ovb"; o.className = "b"; o.type = "button";
      o.title = "In-game overlay (Ctrl+Shift+O)";
      o.addEventListener("click", async e => { e.stopPropagation(); const r = await B.setOverlay({ on: !ovOn() }); st.settings.overlay = r; header(); toast(r.on ? "Overlay on. Ctrl+Shift+L to move it, Ctrl+Shift+O to hide it." : "Overlay off"); });
      a.insertBefore(o, u);
    }
    const ob = document.getElementById("ovb");
    if (ob) { ob.textContent = ovOn() ? "Overlay ✓" : "Overlay"; ob.style.color = ovOn() ? "var(--gr)" : ""; }
    const on = [f1Live() && "F1 25", acLive() && "AC", fzLive() && "Forza"].filter(Boolean);
    b.textContent = st.error ? "Live: problem" : on.length ? "● Live · " + on.join(" + ") : "○ Live";
    b.style.color = st.error ? "var(--dn)" : on.length ? "var(--gr)" : "var(--mu)";
    b.title = st.error || (on.length ? "Receiving telemetry" : "Waiting for F1 25, Assetto Corsa or Forza");
  }

  // ---------- live card on the home page ----------
  function f1Rows() {
    return `<div class="gset"><span>UDP Telemetry</span><b>On</b><span>UDP Broadcast Mode</span><b>Off</b><span>UDP IP Address</span><b>127.0.0.1</b><span>UDP Port</span><b>${port()}</b><span>UDP Send Rate</span><b>20Hz</b><span>UDP Format</span><b>2025</b></div>
    <p class="ls" style="margin:0">In F1 25: Settings → Telemetry Settings. Start Lapbook first, then the game.</p>`;
  }
  const moved = () => st.movedFrom ? `<p class="warn2" style="margin:0">Port ${st.movedFrom} is used by another program (for example SimHub), so Lapbook switched to <b>${port()}</b>. Set UDP Port <b>${port()}</b> in F1 25.</p>` : "";
  const folderNote = () => st.ac.folder
    ? `<span class="ls">Car and track names come from your Assetto Corsa folder.</span>`
    : `<span class="warn2">Assetto Corsa folder not found, so names are shown as folder names. <button class="b ghost" data-live="acdir">Choose folder</button></span>`;
  const openBtn = (g, t) => t && D.tracks[g] && D.tracks[g].includes(t) ? `<button class="b" data-live="open" data-g="${esc(g)}" data-t="${esc(t)}">Open ${esc(t)}</button>` : "";
  const lapBox = g => lastLap[g] ? `<span style="text-align:right"><span class="big">${fmt(lastLap[g])}</span><br><span class="ls">last lap · ${added[g]} saved${g === F1 && skipped ? `, ${skipped} invalid skipped` : ""}</span></span>` : `<span class="ls">Finish a lap and it appears here.</span>`;

  function f1Live_() {
    const i = st.info || {};
    const ask = i.teamId !== null && i.teamId !== undefined && i.known === false;
    return `<div class="game"><div class="lh"><span class="lt"><span class="dot"></span>Live · F1 25</span>${openBtn(F1, i.track)}</div>
      <div class="lh"><span><b>${esc(i.track || "Waiting for track")}</b><br><span class="ls">${esc([i.car, i.session].filter(Boolean).join(" · ") || "Drive a lap, it is saved by itself")}</span></span>${lapBox(F1)}</div>
      ${ask ? `<div class="nm2"><span class="warn2">Which car is this (team ${esc(i.teamId)})?</span><input id="cname" placeholder="for example McLaren 2026" maxlength="60"><button class="b pri" data-live="name" data-id="${esc(i.teamId)}">Save name</button></div>` : ""}</div>`;
  }
  function acLive_() {
    const a = st.ac;
    return `<div class="game"><div class="lh"><span class="lt"><span class="dot"></span>Live · Assetto Corsa</span>${openBtn(AC, a.track)}</div>
      <div class="lh"><span><b>${esc(a.track || "Waiting for track")}</b><br><span class="ls">${esc(a.car || "")}</span></span>${lapBox(AC)}</div>${st.ac.folder ? "" : folderNote()}</div>`;
  }
  function fzRows() {
    return `<div class="gset"><span>Data Out</span><b>On</b><span>Data Out IP Address</span><b>127.0.0.1</b><span>Data Out IP Port</span><b>${esc(st.fz.port || 5300)}</b><span>Data Out Packet Format</span><b>Car Dash (if offered)</b></div>
    <p class="ls" style="margin:0">In Forza: Settings → HUD and Gameplay → scroll down to Data Out.</p>
    <p class="ls" style="margin:0">Microsoft Store / Game Pass version? Windows blocks the data until you allow it once: <button class="b ghost" data-live="loop">Allow Forza</button> (Steam: not needed)</p>`;
  }
  function fzLive_() {
    const f = st.fz, r = f.lastRoute, seg = f.lastSegment, here = f.near;
    const askCar = f.ordinal !== null && f.ordinal !== undefined && !f.carKnown;
    const askRoute = f.raceLaps && r && /^Unnamed route/.test(r.name);
    const askSeg = seg && /^Unnamed (time trial|drag)/.test(seg.name);
    const where = f.recording ? (f.recording.standing && !f.recording.launched ? "Recording a drag run: launch when you are ready" : "Recording a time trial…") : f.run ? f.run.name : f.inRace && f.raceLaps ? (here ? here.name : r ? r.name : "Race") : "Driving";
    const trialHelp = f.recording
      ? `<p class="warn2" style="margin:0">Drive to your finish point and press <b>Ctrl+Shift+T</b> there. <button class="b ghost" data-live="fzcancel">Cancel</button></p>`
      : `<div class="lh"><span class="ls">${f.segments ? `${f.segments} time trial${f.segments === 1 ? "" : "s"} recorded, they are timed by themselves.` : "No time trials recorded yet."} New one: press <b>Ctrl+Shift+T</b> at the start, drive, press it again at the finish. Standing still at the start = drag run.</span><button class="b ghost" data-live="fzmark">Start here</button></div>`;
    return `<div class="game"><div class="lh"><span class="lt"><span class="dot"></span>Live · ${esc(f.game)}</span>${openBtn(f.game, seg ? seg.name : here ? here.name : r ? r.name : "")}</div>
      <div class="lh"><span><b>${esc(where)}</b><br><span class="ls">${esc([f.car, f.carClass].filter(Boolean).join(" · "))}</span></span>${lapBox(f.game)}</div>
      ${trialHelp}
      ${askCar ? `<div class="nm2"><span class="warn2">Which car is this (Forza car #${esc(f.ordinal)})?</span><input id="fzcar" placeholder="for example Porsche 911 GT3 RS" maxlength="80"><button class="b pri" data-live="fzcar" data-id="${esc(f.ordinal)}">Save name</button></div>` : ""}
      ${askSeg ? `<div class="nm2"><span class="warn2">Name this ${seg.kind === "drag" ? "drag run" : "time trial"} (${esc(seg.name)}):</span><input id="fzseg" placeholder="${seg.kind === "drag" ? "for example Festival Drag Strip" : "for example Mount Fuji Trailblazer"}" maxlength="80"><button class="b pri" data-live="fzseg" data-id="${esc(seg.id)}">Save name</button></div>` : ""}
      ${askRoute ? `<div class="nm2"><span class="warn2">Name this race (${esc(r.name)}):</span><input id="fzroute" placeholder="for example Goliath" maxlength="80"><button class="b pri" data-live="fzroute" data-id="${esc(r.id)}">Save name</button></div>` : ""}
      ${f.unsupported ? `<p class="warn2" style="margin:0">Forza sends packets of ${esc(f.unsupported)} bytes, which Lapbook does not know yet. Tell Claude this number.</p>` : ""}</div>`;
  }
  function liveCard() {
    if (st.error) {
      return `<section class="panel live err" id="livecard"><div class="lh"><span class="lt"><span class="dot"></span>Live tracking needs attention</span><button class="b" data-live="set">Settings</button></div><p class="ls" style="margin:0;color:var(--dn)">${esc(st.error)}</p></section>`;
    }
    const a = f1Live(), c = acLive(), z = fzLive();
    if (a || c || z) return `<section class="panel live on" id="livecard">${a ? f1Live_() : ""}${c ? acLive_() : ""}${z ? fzLive_() : ""}</section>`;
    if (ok && !showHow) {
      return `<section class="panel live" id="livecard"><div class="lh"><span class="lt"><span class="dot"></span>Live tracking ready</span><span class="acts"><button class="b ghost" data-live="how">How to</button><button class="b" data-live="set">Settings</button></span></div><p class="ls" style="margin:0">Start F1 25, Assetto Corsa or Forza and drive. Every finished lap is saved automatically.</p>${moved()}${lastRecapRow()}</section>`;
    }
    const chips = `<div class="chips" style="margin:0">${[F1, AC, FZ].map(g => `<button class="chip ${tab === g ? "on" : ""}" data-live="tab" data-g="${g}">${g}</button>`).join("")}</div>`;
    const body = tab === FZ
      ? `<ol class="steps"><li class="${st.fz.listening ? "done" : ""}"><i>${st.fz.listening ? "✓" : "1"}</i><span>Lapbook is ready for Forza on port ${esc(st.fz.port || 5300)}</span></li>
         <li class="${fzWas ? "done" : ""}"><i>${fzWas ? "✓" : "2"}</i><span>Turn on Data Out in Forza with these settings:</span></li></ol>
         ${fzRows()}
         <ol class="steps"><li class="${addedFz() ? "done" : ""}"><i>${addedFz() ? "✓" : "3"}</i><span>Record your first time trial: at the start press <b>Ctrl+Shift+T</b>, drive the run, press <b>Ctrl+Shift+T</b> at the finish. Standing still at the start makes it a drag run, timed from the launch. After that every run through the same start is timed by itself.</span></li></ol>
         ${st.fz.movedFrom ? `<p class="warn2" style="margin:0">Port ${st.fz.movedFrom} is used by another program, so Lapbook uses <b>${esc(st.fz.port)}</b>. Set that port in Forza.</p>` : ""}`
      : tab === AC
      ? `<ol class="steps"><li class="done"><i>✓</i><span>Lapbook is ready for Assetto Corsa</span></li>
         <li class="${acWas ? "done" : ""}"><i>${acWas ? "✓" : "2"}</i><span>Start a session in Assetto Corsa (for example through Content Manager). There is nothing to set in the game: Lapbook connects by itself once you are on track.</span></li>
         <li class="${added[AC] ? "done" : ""}"><i>${added[AC] ? "✓" : "3"}</i><span>Drive one full lap. It is saved here by itself.</span></li></ol>${folderNote()}`
      : `<ol class="steps"><li class="${st.listening ? "done" : ""}"><i>${st.listening ? "✓" : "1"}</i><span>Lapbook is ready on port ${port()}</span></li>
         <li class="${wasLive ? "done" : ""}"><i>${wasLive ? "✓" : "2"}</i><span>Turn on UDP telemetry in F1 25 with these settings, then start a session:</span></li></ol>
         ${f1Rows()}
         <ol class="steps"><li class="${added[F1] ? "done" : ""}"><i>${added[F1] ? "✓" : "3"}</i><span>Drive one full lap. It is saved here by itself.</span></li></ol>${moved()}`;
    return `<section class="panel live" id="livecard"><div class="lh"><span class="lt"><span class="dot"></span>Set up live tracking</span>${ok ? `<button class="b ghost" data-live="hide">Hide</button>` : ""}</div>${chips}${body}</section>`;
  }

  // ---------- wide layout: put the page into two columns ----------
  function wide() {
    const app = document.getElementById("app");
    if (!app) return;
    app.dataset.v = S.v;
    if (app.querySelector(":scope > .wd")) return;
    const kids = [...app.children].filter(n => !n.classList.contains("top") && !n.classList.contains("fab"));
    let side = [], main = [], cls = "";
    if (S.v === "home") {
      const g = kids.findIndex(n => n.tagName === "H2");
      if (g < 0) return;
      side = kids.slice(0, g); main = kids.slice(g);
    } else if (S.v === "track") {
      const k = kids.findIndex(n => n.classList.contains("bh") && /^(Compare|Progress|History)/.test(n.textContent.trim()));
      if (k < 0) return;
      main = kids.slice(0, k); side = kids.slice(k); cls = " tr";
    } else if (S.v === "strat") {
      const k = kids.findIndex(n => n.classList.contains("bh"));
      if (k < 0) return;
      main = kids.slice(0, k); side = kids.slice(k); cls = " tr";
    } else return;
    const wd = document.createElement("div"), c1 = document.createElement("div"), c2 = document.createElement("div");
    wd.className = "wd" + cls; c1.className = "c1"; c2.className = "c2";
    // home: live card and driver info on the right, games on the left
    if (S.v === "home") { main.forEach(n => c1.appendChild(n)); side.forEach(n => c2.appendChild(n)); wd.append(c2, c1); wd.className += " hm"; }
    else { main.forEach(n => c1.appendChild(n)); side.forEach(n => c2.appendChild(n)); wd.append(c1, c2); }
    const top = app.querySelector(":scope > .top");
    if (top) top.after(wd); else app.prepend(wd);
  }

  function placeCard() {
    const old = document.getElementById("livecard");
    if (S.v !== "home") { if (old) old.remove(); return; }
    const html = liveCard();
    if (old && placeCard.last === html) return;
    if (old && old.contains(document.activeElement) && /^(cname|fzcar|fzroute|fzseg)$/.test(document.activeElement.id)) return; // typing a name
    placeCard.last = html;
    if (old) { old.outerHTML = html; return; }
    const host = document.querySelector("#app .wd > .c2") || document.querySelector("#app .top");
    if (!host) return;
    if (host.classList.contains("c2")) host.insertAdjacentHTML("afterbegin", html);
    else host.insertAdjacentHTML("afterend", html);
  }

  // rename a car in all laps and races of a game
  function renameCar(game, from, to) {
    if (!from || !to || from === to) return 0;
    let n = 0;
    D.lapTimes.forEach(l => { if (l.game === game && l.car === from) { l.car = to; n++; } });
    D.races.forEach(r => { if (r.game === game && r.car === from) { r.car = to; n++; } });
    const cs = D.cars[game] || [];
    if (cs.includes(from)) D.cars[game] = [...new Set(cs.map(c => (c === from ? to : c)))];
    return n;
  }
  function renameTrack(game, from, to) {
    if (!from || !to || from === to) return 0;
    let n = 0;
    D.lapTimes.forEach(l => { if (l.game === game && l.track === from) { l.track = to; n++; } });
    D.races.forEach(r => { if (r.game === game && r.track === from) { r.track = to; n++; } });
    const ts = D.tracks[game] || [];
    if (ts.includes(from)) D.tracks[game] = [...new Set(ts.map(t => (t === from ? to : t)))];
    if (D.trackTypes[game] && D.trackTypes[game][from] && !D.trackTypes[game][to]) { D.trackTypes[game][to] = D.trackTypes[game][from]; delete D.trackTypes[game][from]; }
    if (LAST && LAST.g === game && LAST.t === from) { LAST = { g: game, t: to }; try { localStorage.setItem("lapbook.last", JSON.stringify(LAST)); } catch (e) {} }
    return n;
  }
  // laps saved before a team was known get their real name
  async function fixNames() {
    try {
      const k = await B.knownCars();
      let n = 0;
      for (const [id, name] of Object.entries(k.names)) for (const o of (k.old && k.old[id]) || [k.placeholder[id]]) n += renameCar(F1, o, name);
      if (n) { save(); refresh(); toast(`${n} F1 25 lap${n === 1 ? "" : "s"} got their car name`); }
    } catch (e) {}
  }

  document.addEventListener("click", async e => {
    const t = e.target.closest("[data-live]");
    if (!t) return;
    const k = t.dataset.live;
    if (k === "set") openPanel();
    if (k === "how") { showHow = true; placeCard(); }
    if (k === "hide") { showHow = false; placeCard(); }
    if (k === "tab") { tab = t.dataset.g; try { localStorage.setItem("lapbook.livetab", tab); } catch (x) {} placeCard(); }
    if (k === "acdir") { const d = await B.pickACFolder(); if (d) { const f = await B.setACFolder(d); toast(f ? "Assetto Corsa folder found" : "No Assetto Corsa found in that folder (it needs content\\cars inside)"); } }
    if (k === "name") {
      const v = ($("#cname") || {}).value || "";
      if (!v.trim()) return toast("Type the car's name first");
      await B.nameCar(t.dataset.id, v.trim());
      await fixNames();
      placeCard.last = "";
      toast("Car name saved");
    }
    if (k === "recap") { showRecap(recaps[Number(t.dataset.i) || 0]); return; }
    if (k === "recaps") { showRecapList(); return; }
    if (k === "loop") {
      const r = await B.forzaLoopback();
      toast(r.ok ? "Windows asks for permission. Click Yes, then restart Forza." : r.error || "That did not work");
    }
    if (k === "fzcar") {
      const v = ($("#fzcar") || {}).value || "";
      if (!v.trim()) return toast("Type the car's name first");
      const r = await B.forzaNameCar(t.dataset.id, v.trim());
      if (r.ok) { for (const g of Object.keys(D.tracks).filter(isFz)) renameCar(g, r.old, r.name); save(); }
      placeCard.last = ""; refresh(); toast("Car name saved");
    }
    if (k === "fzmark") { const r = await B.forzaMark(); markToast(r); return; }
    if (k === "fzcancel") { await B.forzaCancel(); toast("Recording cancelled"); return; }
    if (k === "fzseg") {
      const v = ($("#fzseg") || {}).value || "";
      if (!v.trim()) return toast("Type a name first");
      const r = await B.forzaNameSegment(st.fz.game, t.dataset.id, v.trim());
      if (!r.ok) return toast(r.error || "That did not work");
      renameTrack(st.fz.game, r.old, r.name); save();
      placeCard.last = ""; refresh(); toast("Name saved");
      return;
    }
    if (k === "fzroute") {
      const v = ($("#fzroute") || {}).value || "";
      if (!v.trim()) return toast("Type the race's name first");
      const r = await B.forzaNameRoute(st.fz.game, t.dataset.id, v.trim());
      if (r.ok) { renameTrack(st.fz.game, r.old, r.name); save(); }
      placeCard.last = ""; refresh(); toast("Race name saved");
    }
    if (k === "open") {
      $("#modal").innerHTML = "";
      Object.assign(S, { v: "track", g: t.dataset.g, t: t.dataset.t, tab: "tracks", F: {}, open: "", add: false, edit: "", hc: "", hn: 30, co: false });
      render(); scrollTo(0, 0);
    }
  });

  // keep our additions when Lapbook re-renders
  const baseRender = render;
  render = function () { baseRender(); try { sectorPanel(); header(); wide(); placeCard.last = ""; placeCard(); } catch (e) { console.error(e); } };

  // ---------- settings ----------
  async function openPanel() {
    const s = st.settings, k = await B.knownCars().catch(() => ({ names: {} }));
    const own = Object.entries(s.carNames || {});
    const fl = await B.forzaList().catch(() => ({ cars: {}, routes: {} }));
    const fzl = Object.entries(fl.cars || {}).map(([id, n]) => `<span>Car ${esc(id)}</span><input data-fzcar="${esc(id)}" value="${esc(n)}">`).join("")
      + Object.entries(fl.segments || {}).flatMap(([g, rs]) => rs.map(r => `<span>${r.kind === "drag" ? "Drag" : "Trial"}</span><input data-fzseg="${esc(r.id)}" data-g="${esc(g)}" value="${esc(r.name)}" title="Empty = delete">`)).join("")
      + Object.entries(fl.routes || {}).flatMap(([g, rs]) => rs.map(r => `<span>${esc(g.replace("Forza Horizon", "FH"))}</span><input data-fzroute="${esc(r.id)}" data-g="${esc(g)}" value="${esc(r.name)}">`)).join("");
    $("#modal").innerHTML = `<div class="ov"><div class="md"><h3>Live tracking settings</h3>
      <h4>F1 25</h4>
      <div class="two"><label>UDP port<input id="tport" inputmode="numeric" value="${esc(s.port)}"></label><label>Invalid laps<select id="tinv"><option value="0" ${s.saveInvalid ? "" : "selected"}>Skip them</option><option value="1" ${s.saveInvalid ? "selected" : ""}>Save them too</option></select></label></div>
      <label>F1 25 runs on<select id="tnet"><option value="0" ${s.network ? "" : "selected"}>This PC</option><option value="1" ${s.network ? "selected" : ""}>Another device (console or second PC)</option></select></label>
      ${f1Rows()}
      <h4>F1 25 car names</h4><p class="ls" style="margin:0 0 6px;color:var(--mu)">Give a team number its own name. Laps you already drove with it are renamed too.</p>
      <div class="cn" id="cnl">${own.map(([id, n]) => `<span>Team ${esc(id)}</span><input data-team="${esc(id)}" value="${esc(n)}">`).join("")}<input id="cnid" inputmode="numeric" placeholder="Team no."><input id="cnn" placeholder="Name, for example Konnersport"></div>
      <h4>Assetto Corsa</h4>
      <label>Live tracking<select id="acon"><option value="1" ${s.acOn !== false ? "selected" : ""}>On</option><option value="0" ${s.acOn === false ? "selected" : ""}>Off</option></select></label>
      <p class="ls" style="margin:0;color:var(--mu)">Folder: ${st.ac.folder ? esc(st.ac.folder) : "not found"} <button class="b ghost" id="acpick" type="button">Choose folder</button></p>
      <h4>Forza Horizon</h4>
      <div class="two"><label>Live tracking<select id="fzon"><option value="1" ${s.forzaOn !== false ? "selected" : ""}>On</option><option value="0" ${s.forzaOn === false ? "selected" : ""}>Off</option></select></label><label>Data Out port<input id="fzport" inputmode="numeric" value="${esc(s.forzaPort || 5300)}"></label></div>
      <label>Normal races<select id="fzrl"><option value="0" ${s.forzaRaceLaps ? "" : "selected"}>Do not save their laps</option><option value="1" ${s.forzaRaceLaps ? "selected" : ""}>Save every lap of every race</option></select></label>
      <label>Game<select id="fzgame">${[["auto", "Find out by itself"], ["Forza Horizon 6", "Forza Horizon 6"], ["Forza Horizon 5", "Forza Horizon 5"]].map(([v, n]) => `<option value="${v}" ${(s.forzaGame || "auto") === v ? "selected" : ""}>${n}</option>`).join("")}</select></label>
      <div class="cn" id="fzl">${fzl}</div>
      <h4>In-game overlay</h4>
      <div class="two"><label>Overlay<select id="ovon"><option value="1" ${ovOn() ? "selected" : ""}>On</option><option value="0" ${ovOn() ? "" : "selected"}>Off</option></select></label>
      <label>Position<select id="ovlk"><option value="1" ${(s.overlay || {}).locked !== false ? "selected" : ""}>Locked (clicks go to the game)</option><option value="0" ${(s.overlay || {}).locked === false ? "selected" : ""}>Unlocked (drag to move)</option></select></label></div>
      <div class="two"><label>Size<select id="ovsz">${[[0.8, "Small"], [1, "Medium"], [1.3, "Large"], [1.7, "Extra large"]].map(([v, n]) => `<option value="${v}" ${Number((s.overlay || {}).scale || 1) === v ? "selected" : ""}>${n}</option>`).join("")}</select></label>
      <label>Background<select id="ovop">${[[0.6, "See-through"], [0.88, "Normal"], [0.97, "Solid"]].map(([v, n]) => `<option value="${v}" ${Number((s.overlay || {}).opacity || 0.88) === v ? "selected" : ""}>${n}</option>`).join("")}</select></label></div>
      <p class="ls" style="margin:0;color:var(--mu)">Shortcuts: <b>Ctrl+Shift+O</b> overlay on/off, <b>Ctrl+Shift+L</b> lock/unlock to move it. The game must run in <b>borderless</b> or <b>windowed fullscreen</b> mode. <button class="b ghost" id="ovrs" type="button">Reset position</button></p>
      <p class="ls" style="color:var(--mu)">This session: ${added[F1]} F1 25 and ${added[AC]} Assetto Corsa lap${added[AC] === 1 ? "" : "s"} saved. Lapbook ${esc(info.version)}.</p>
      <div class="acts"><button class="b pri" id="tsave" type="button">Save</button><button class="b" id="tfold" type="button">Open backup folder</button><button class="b ghost" data-act="closem">Close</button></div></div></div>`;
    $("#ovrs").onclick = async () => { st.settings.overlay = await B.setOverlay({ on: true, reset: true }); toast("Overlay moved to the top right"); };
    $("#acpick").onclick = async () => { const d = await B.pickACFolder(); if (d) { await B.setACFolder(d); openPanel(); } };
    $("#tsave").onclick = async () => {
      let n0 = 0;
      st.settings = await B.setSettings({ port: Number($("#tport").value), saveInvalid: $("#tinv").value === "1", network: $("#tnet").value === "1", acOn: $("#acon").value === "1" });
      await B.setSettings({ port: Number($("#tport").value), saveInvalid: $("#tinv").value === "1", network: $("#tnet").value === "1", acOn: $("#acon").value === "1", forzaOn: $("#fzon").value === "1", forzaPort: Number($("#fzport").value), forzaGame: $("#fzgame").value, forzaRaceLaps: $("#fzrl").value === "1" });
      for (const i of document.querySelectorAll("#fzl [data-fzseg]")) { const r = await B.forzaNameSegment(i.dataset.g, i.dataset.fzseg, i.value); if (r.ok && !r.deleted) n0 += renameTrack(i.dataset.g, r.old, r.name); }
      for (const i of document.querySelectorAll("#fzl [data-fzcar]")) { const r = await B.forzaNameCar(i.dataset.fzcar, i.value); if (r.ok) for (const g of Object.keys(D.tracks).filter(isFz)) n0 += renameCar(g, r.old, r.name); }
      for (const i of document.querySelectorAll("#fzl [data-fzroute]")) { const r = await B.forzaNameRoute(i.dataset.g, i.dataset.fzroute, i.value); if (r.ok) n0 += renameTrack(i.dataset.g, r.old, r.name); }
      if (n0) save();
      st.settings.overlay = await B.setOverlay({ on: $("#ovon").value === "1", locked: $("#ovlk").value === "1", scale: Number($("#ovsz").value), opacity: Number($("#ovop").value) });
      for (const i of document.querySelectorAll("#cnl [data-team]")) await B.nameCar(i.dataset.team, i.value);
      const nid = $("#cnid").value.trim(), nn = $("#cnn").value.trim();
      if (/^\d+$/.test(nid) && nn) await B.nameCar(nid, nn);
      // renamed teams: move laps from the old name to the new one
      const before = k.names || {}, after = (await B.knownCars()).names;
      let n = 0;
      for (const [id, name] of Object.entries(after)) if (before[id] && before[id] !== name) n += renameCar(F1, before[id], name);
      if (n) save();
      st.settings = await B.getSettings();
      await fixNames();
      $("#modal").innerHTML = "";
      refresh();
      toast("Live tracking settings saved");
    };
    $("#tfold").onclick = () => B.openBackups();
  }

  function markToast(r) {
    if (!r) return;
    if (r.state === "recording") toast(r.standing ? "Drag run: launch when ready, press Ctrl+Shift+T at the finish" : "Recording: press Ctrl+Shift+T at the finish");
    else if (r.state === "saved") toast(`${r.segment.kind === "drag" ? "Drag run" : "Time trial"} saved. Give it a name in Lapbook.`);
    else if (r.state === "tooShort") toast("Too short, nothing saved (at least 2 s and 50 m)");
    else if (r.state === "nodata") toast("No data from Forza yet");
  }
  B.onForzaMark(r => markToast(r));

  // ---------- session recap ----------
  const sessions = {}; // game -> { key, track, car, laps: [], valid: [], pbBefore, start, last }
  let recaps = [];
  try { recaps = JSON.parse(localStorage.getItem("lapbook.recaps") || "[]"); } catch (e) {}
  function sessionLap(G, lap, valid) {
    const key = G + "|" + lap.track + "|" + lap.car;
    let s = sessions[G];
    if (s && s.key !== key) { endSession(G); s = null; }
    if (!s) {
      const before = best(D.lapTimes.filter(x => x.game === G && x.track === lap.track && x.car === lap.car && x.id !== lap.id));
      s = sessions[G] = { key, game: G, track: lap.track, car: lap.car, laps: [], pbBefore: before ? before.timeInMs : 0, start: Date.now() };
    }
    s.laps.push({ t: lap.timeInMs, sectors: lap.sectors || null, valid, splits: !!lap.splits });
    s.last = Date.now();
  }
  function endSession(G) {
    const s = sessions[G];
    delete sessions[G];
    if (!s || !s.laps.length) return;
    const ok = s.laps.filter(l => l.valid), ts = ok.map(l => l.t), bestT = ts.length ? Math.min(...ts) : 0;
    // consistency: spread of the laps within 107 % of the best (out-laps and spins left out)
    const clean = ts.filter(t => t <= bestT * 1.07), avg = clean.length ? clean.reduce((a, b) => a + b, 0) / clean.length : 0;
    const sd = clean.length > 1 ? Math.sqrt(clean.reduce((a, t) => a + (t - avg) ** 2, 0) / (clean.length - 1)) : 0;
    const secs = [0, 1, 2].map(i => Math.min(...ok.map(l => (l.sectors ? l.sectors[i] : Infinity))));
    const theo = secs.every(isFinite) ? secs.reduce((a, b) => a + b, 0) : 0;
    const r = { game: s.game, track: s.track, car: s.car, date: today(), at: Date.now(), laps: s.laps.length, valid: ok.length, best: bestT, avg: Math.round(avg), sd: Math.round(sd), pbBefore: s.pbBefore,
      times: s.laps.map(l => (l.valid ? l.t : -l.t)), secs: theo ? secs : null, theo, splits: s.laps.some(l => l.splits) };
    recaps = [r, ...recaps].slice(0, 20);
    try { localStorage.setItem("lapbook.recaps", JSON.stringify(recaps)); } catch (e) {}
    placeCard.last = "";
    placeCard();
    if (!$("#modal").innerHTML) showRecap(r);
    else toast("Session recap ready: " + r.track);
  }
  // a session ends when its game has sent nothing for 45 s
  setInterval(() => {
    for (const G of Object.keys(sessions)) {
      const on = G === F1 ? f1Live() : G === AC ? acLive() : fzLive();
      if (!on && Date.now() - sessions[G].last > 45000) endSession(G);
    }
  }, 5000);
  function chartSvg(times, bestT) {
    const v = times.map(Math.abs);
    if (v.length < 2) return "";
    const W = 600, H = 110, mn = Math.min(...v), mx = Math.max(...v), cap = Math.min(mx, mn * 1.07), bw = Math.min(W / v.length, 40), x0 = (W - bw * v.length) / 2;
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;background:none" role="img" aria-label="Lap times of the session">${v.map((t, i) => {
      const h = 14 + (1 - (Math.min(t, cap) - mn) / Math.max(cap - mn, 1)) * (H - 30);
      const c = times[i] < 0 ? "var(--dn)" : t === bestT ? "var(--pu)" : "var(--mu)";
      return `<rect x="${(x0 + i * bw + bw * 0.15).toFixed(1)}" y="${(H - h).toFixed(1)}" width="${(bw * 0.7).toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="${c}" opacity="${t === bestT ? 1 : 0.6}"><title>Lap ${i + 1}: ${fmt(t)}${times[i] < 0 ? " (invalid)" : ""}</title></rect>`;
    }).join("")}</svg>`;
  }
  function showRecap(r) {
    if (!r) return;
    const isPb = r.best && (!r.pbBefore || r.best < r.pbBefore);
    const tile = (v, l, cls = "") => `<div><b class="${cls}">${v}</b><span>${l}</span></div>`;
    $("#modal").innerHTML = `<div class="ov"><div class="md"><h3>Session recap</h3>
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:baseline;flex-wrap:wrap"><b style="font-size:22px">${esc(r.track)}</b><span class="ls" style="color:var(--mu)">${esc(r.game)} · ${esc(r.car)} · ${esc(r.date)}</span></div>
      <div class="rcp">${tile(r.best ? fmt(r.best) : "–", isPb ? "new personal best" : "best lap", isPb ? "new" : "")}
      ${tile(r.pbBefore ? (r.best ? gpS(r.best - r.pbBefore) : "–") : "first time", r.pbBefore ? "vs. best before (" + fmt(r.pbBefore) + ")" : "on this circuit with this car")}
      ${tile(r.avg ? fmt(r.avg) : "–", "average lap")}
      ${tile(r.sd ? "±" + (r.sd / 1000).toFixed(3) : "–", "consistency (spread)")}
      ${tile(r.valid + (r.laps > r.valid ? " / " + r.laps : ""), r.laps > r.valid ? "valid / all laps" : "laps")}</div>
      ${chartSvg(r.times, r.best)}
      ${r.secs ? `<div class="panel" style="margin:12px 0 0"><div class="secg"><span></span><span>${r.splits ? "1st third" : "S1"}</span><span>${r.splits ? "2nd third" : "S2"}</span><span>${r.splits ? "3rd third" : "S3"}</span><span>sum</span>
        <span>best</span>${r.secs.map(x => `<b class="pu">${(x / 1000).toFixed(3)}</b>`).join("")}<b>${fmt(r.theo)}</b></div>
        <p class="ls" style="margin:8px 0 0;color:var(--mu)">Put your best ${r.splits ? "thirds" : "sectors"} together and you would do <b style="color:var(--tx)">${fmt(r.theo)}</b>${r.best > r.theo ? `, ${((r.best - r.theo) / 1000).toFixed(3)} s faster than your best lap` : ""}.</p></div>` : ""}
      <div class="acts" style="margin-top:12px">${D.tracks[r.game] && D.tracks[r.game].includes(r.track) ? `<button class="b pri" data-live="open" data-g="${esc(r.game)}" data-t="${esc(r.track)}">Open ${esc(r.track)}</button>` : ""}${recaps.length > 1 ? `<button class="b" data-live="recaps">Earlier sessions</button>` : ""}<button class="b ghost" data-act="closem">Close</button></div></div></div>`;
  }
  window.lapbookDesktop = { endSession, showRecap: () => showRecap(recaps[0]) };
  const gpS = ms => (ms > 0 ? "+" : ms < 0 ? "−" : "±") + (Math.abs(ms) / 1000).toFixed(3);
  function showRecapList() {
    $("#modal").innerHTML = `<div class="ov"><div class="md"><h3>Earlier sessions</h3>${recaps.map((r, i) => `<button class="row" data-live="recap" data-i="${i}" style="margin-bottom:8px"><span class="nm">${esc(r.track)}<small>${esc(r.game)} · ${esc(r.car)} · ${esc(r.date)} · ${r.laps} laps</small></span><span class="tm pb">${r.best ? fmt(r.best) : "–"}</span></button>`).join("")}<div class="acts"><button class="b ghost" data-act="closem">Close</button></div></div></div>`;
  }
  const lastRecapRow = () => recaps[0] ? `<div class="lh" style="border-top:1px solid var(--ln);padding-top:10px"><span class="ls">Last session: <b style="color:var(--tx)">${esc(recaps[0].track)}</b> · ${recaps[0].laps} laps · best ${recaps[0].best ? fmt(recaps[0].best) : "–"}</span><button class="b ghost" data-live="recap" data-i="0">View recap</button></div>` : "";

  // ---------- races from F1 25 go into Lapbook's race log (and the driver rating) ----------
  B.onRace(r => {
    if (!r || !r.track || !r.car || !(r.field >= 0)) return;
    const G = r.game || F1, day = today();
    if (D.races.some(x => x.game === G && x.track === r.track && x.date === day && x.start === r.start && x.finish === (r.dnf ? r.field + 2 : r.finish) && x.laps === r.laps)) return;
    const h0 = ratingHist().R;
    const field = Math.max(1, r.field), start = Math.min(Math.max(1, r.start || 1), field + 1), finish = r.dnf ? field + 1 : Math.min(Math.max(1, r.finish), field + 1);
    D.races.push({ id: uid(), game: G, track: r.track, date: day, car: r.car, laps: r.laps || 1, start, finish, field, strength: 0, weather: r.weather || "sun", condition: { rain: "wet", storm: "wet", light_rain: "damp" }[r.weather] || "green", tire: "", dnf: !!r.dnf, notes: [r.session, r.pits ? r.pits + " stop" + (r.pits > 1 ? "s" : "") : "", "auto"].filter(Boolean).join(" · ") });
    if (!D.tracks[G].includes(r.track)) D.tracks[G].push(r.track);
    if (!D.cars[G].includes(r.car)) D.cars[G].push(r.car);
    save();
    refresh();
    const d = ratingHist().R - h0;
    toast(`Race saved: ${r.dnf ? "DNF" : "P" + finish} from P${start} at ${r.track}, rating ${d >= 0 ? "+" : ""}${d.toFixed(1)}`);
  });

  // ---------- best sectors on the circuit page ----------
  function sectorPanel() {
    if (S.v !== "track" || document.getElementById("secpanel")) return;
    const L = D.lapTimes.filter(l => l.game === S.g && l.track === S.t && Array.isArray(l.sectors) && l.sectors.length === 3);
    if (!L.length) return;
    const bestOf = i => L.reduce((m, l) => (!m || l.sectors[i] < m.sectors[i] ? l : m), null);
    const bs = [0, 1, 2].map(bestOf), theo = bs.reduce((a, l, i) => a + l.sectors[i], 0), bl = best(L), split = L.some(l => l.splits);
    const html = `<div id="secpanel"><div class="bh"><span>${split ? "Splits" : "Sectors"}</span><small>${split ? "thirds of the lap" : "best of every lap with sector times"}</small></div>
      <div class="panel" style="margin-top:0"><div class="secg"><span></span><span>${split ? "1st" : "S1"}</span><span>${split ? "2nd" : "S2"}</span><span>${split ? "3rd" : "S3"}</span><span>lap</span>
      <span>best lap</span>${bl.sectors.map(x => `<b>${(x / 1000).toFixed(3)}</b>`).join("")}<b>${fmt(bl.timeInMs)}</b>
      <span>best</span>${bs.map((l, i) => `<b class="pu" title="${esc(l.car)}, ${esc(l.date)}">${(l.sectors[i] / 1000).toFixed(3)}</b>`).join("")}<b class="pu">${fmt(theo)}</b></div>
      <p class="ls" style="margin:8px 0 0;color:var(--mu)">Theoretical best: <b style="color:var(--tx)">${fmt(theo)}</b>${bl.timeInMs > theo ? `, ${((bl.timeInMs - theo) / 1000).toFixed(3)} s quicker than your best lap with sector times` : ""}.</p></div></div>`;
    const sb = [...document.querySelectorAll("#app .bh")].find(n => /^Scoreboard/.test(n.textContent.trim()));
    if (sb) sb.insertAdjacentHTML("beforebegin", html);
  }

  // ---------- overlay data: what the in-game overlay shows ----------
  let lastGame = "";
  function overlayFeed() {
    const g = f1Live() ? F1 : acLive() ? AC : fzLive() ? st.fz.game : lastGame;
    if (!g) return B.overlayData({});
    const fzTrack = st.fz.run ? st.fz.run.name : st.fz.recording ? "Recording time trial" : st.fz.lastSegment ? st.fz.lastSegment.name : st.fz.near ? st.fz.near.name : st.fz.lastRoute ? st.fz.lastRoute.name : "";
    const track = g === F1 ? (st.info || {}).track : isFz(g) ? fzTrack : st.ac.track, car = g === F1 ? (st.info || {}).car : isFz(g) ? st.fz.car : st.ac.car;
    if (!track) return B.overlayData({ game: g, live: f1Live() || acLive() });
    const all = D.lapTimes.filter(l => l.game === g && l.track === track), mine = all.filter(l => l.car === car);
    const rec = best(all), b = best(mine), lastL = mine[mine.length - 1], prev = best(mine.slice(0, -1));
    B.overlayData({
      game: g, live: g === F1 ? f1Live() : isFz(g) ? fzLive() : acLive(), track, car,
      last: lastGame === g && lastL ? lastL.timeInMs : 0, prevBest: prev ? prev.timeInMs : 0,
      best: b ? b.timeInMs : 0, record: rec ? rec.timeInMs : 0, recordCar: rec && rec.car !== car ? rec.car : "", laps: added[g],
    });
  }

  // ---------- updates ----------
  let ufile = "";
  async function openUpdate(file) {
    info = await B.appInfo();
    ufile = file || "";
    $("#modal").innerHTML = `<div class="ov"><div class="md" id="umd"><h3>App update</h3>
      <p class="ls" style="margin:0;color:var(--mu)">You have Lapbook <b style="color:var(--tx)">${esc(info.version)}</b>. Your laps stay where they are.</p>
      <div class="drop" id="udrop"><b>Drag the update file here</b>It ends in .lapbook-update<div style="margin-top:12px"><button class="b" id="upick" type="button">Choose file</button></div></div>
      <div id="ures"></div>
      <div class="acts" style="margin-top:8px">${info.canRollback ? `<button class="b ghost" id="uback" type="button">Back to version ${esc(info.previous)}</button>` : ""}<button class="b ghost" data-act="closem">Close</button></div></div></div>`;
    const z = $("#udrop");
    z.addEventListener("dragover", e => { e.preventDefault(); z.classList.add("over"); });
    z.addEventListener("dragleave", () => z.classList.remove("over"));
    $("#upick").onclick = async () => { const f = await B.pickUpdate(); if (f) check(f); };
    const bk = $("#uback");
    if (bk) bk.onclick = () => {
      if (bk.dataset.armed) { $("#ures").innerHTML = `<p class="ls">Going back, Lapbook restarts…</p>`; B.rollback(); return; }
      bk.dataset.armed = "1"; bk.textContent = `Really go back to ${info.previous}?`;
    };
    if (ufile) check(ufile);
  }
  async function check(file) {
    ufile = file;
    const r = $("#ures");
    if (!r) return openUpdate(file);
    r.innerHTML = `<p class="ls">Checking the file…</p>`;
    const c = await B.checkUpdate(file);
    if (!c.ok) { r.innerHTML = `<p class="ls" style="color:var(--dn)">${esc(c.error)}</p>`; return; }
    const m = c.manifest;
    r.innerHTML = `<div class="panel" style="margin:6px 0"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px"><b style="font-size:18px">Lapbook ${esc(m.version)}</b><span class="ls">${esc(m.date)}</span></div>
      ${m.notes.length ? `<ul class="unotes">${m.notes.map(n => `<li>${esc(n)}</li>`).join("")}</ul>` : ""}
      ${c.isNewer ? "" : `<p class="warn2" style="margin:8px 0 0">${c.same ? "This is the version you already have." : `This is older than your version ${esc(c.current)}.`} You can still install it.</p>`}
      <button class="b pri wide" id="ugo" type="button">${c.isNewer ? "Install and restart" : "Install anyway and restart"}</button></div>`;
    $("#ugo").onclick = async () => {
      $("#ugo").disabled = true;
      $("#ugo").textContent = "Installing…";
      const x = await B.installUpdate(ufile);
      if (!x.ok) { r.innerHTML = `<p class="ls" style="color:var(--dn)">${esc(x.error)}</p>`; return; }
      r.innerHTML = `<p class="ls" style="color:var(--gr)">Installed. Lapbook restarts in a moment…</p>`;
    };
  }

  // drop a .lapbook-update anywhere in the window
  const ov = document.createElement("div");
  ov.id = "dropall";
  ov.innerHTML = `<div>Drop to install the update<small>Lapbook update files end in .lapbook-update</small></div>`;
  document.body.appendChild(ov);
  let depth = 0;
  const hasFiles = e => e.dataTransfer && [...e.dataTransfer.types].includes("Files");
  window.addEventListener("dragenter", e => { if (hasFiles(e)) { depth++; if (!document.getElementById("udrop")) ov.classList.add("on"); } });
  window.addEventListener("dragleave", () => { depth = Math.max(0, depth - 1); if (!depth) ov.classList.remove("on"); });
  window.addEventListener("dragover", e => { if (hasFiles(e)) e.preventDefault(); });
  window.addEventListener("drop", e => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    depth = 0; ov.classList.remove("on");
    const z = document.getElementById("udrop"); if (z) z.classList.remove("over");
    const f = e.dataTransfer.files[0];
    if (!f) return;
    if (!/\.lapbook-update$/i.test(f.name)) { toast(/\.json$/i.test(f.name) ? "To load a backup, use Data → Upload" : "That is not a Lapbook update file"); return; }
    const p = B.pathOf(f);
    if (!p) { toast("Could not read that file. Use Choose file instead."); return; }
    if (document.getElementById("ures")) check(p); else openUpdate(p);
  });
  B.onOpenUpdate(f => openUpdate(f));

  // ---------- telemetry ----------
  const busy = () => document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  function refresh() {
    if (busy() || $("#modal").innerHTML) { header(); placeCard(); return; }
    const y = scrollY; render(); scrollTo(0, y);
  }
  B.onStatus(s => {
    st = { ...st, ...s, ac: { ...st.ac, ...(s.ac || {}) }, fz: { ...st.fz, ...(s.fz || {}) } };
    if (fzLive() && !fzWas) { fzWas = true; toast(st.fz.game + " connected. Race laps are saved automatically."); }
    if (f1Live() && !wasLive) { wasLive = true; toast("F1 25 connected. Laps are saved automatically."); }
    if (acLive() && !acWas) { acWas = true; toast("Assetto Corsa connected. Laps are saved automatically."); }
    header(); placeCard(); overlayFeed();
  });
  B.onSkipped(() => { skipped++; placeCard.last = ""; placeCard(); toast("F1 25: invalid lap not saved"); });
  B.onLap(l => {
    const G = l.game === AC ? AC : isFz(l.game) ? l.game : F1;
    const ms = Math.round(Number(l.timeInMs));
    if (!(ms > 0) || !l.track || !l.car) return;
    if (!Array.isArray(D.tracks[G])) D.tracks[G] = [];
    if (!Array.isArray(D.cars[G])) D.cars[G] = [];
    const day = today();
    if (D.lapTimes.some(x => x.game === G && x.track === l.track && x.car === l.car && x.timeInMs === ms && x.date === day)) return;
    const prev = best(laps(G).filter(x => x.track === l.track));
    const lap = { id: uid(), game: G, track: l.track, car: l.car, timeInMs: ms, formattedTime: fmt(ms), date: day, tuning: "", airTemp: "", asphaltTemp: "", windSpeed: "" };
    if (G === F1) {
      Object.assign(lap, {
        weather: l.weather || "sun", condition: { rain: "wet", storm: "wet", light_rain: "damp" }[l.weather] || "green", tire: l.tire || "",
        notes: [l.session, l.valid ? "" : "invalid", "auto"].filter(Boolean).join(" · "),
        airTemp: l.airTemp === undefined ? "" : String(l.airTemp), asphaltTemp: l.trackTemp === undefined ? "" : String(l.trackTemp),
      });
    } else if (isFz(G)) Object.assign(lap, { weather: "", condition: "", tire: "", season: "", notes: [l.carClass, "auto"].filter(Boolean).join(" · ") });
    else Object.assign(lap, { weather: "", condition: "", tire: "", notes: "auto" });
    if (Array.isArray(l.sectors) && l.sectors.length === 3) { lap.sectors = l.sectors.map(x => Math.round(x)); if (l.splits) lap.splits = true; }
    D.lapTimes.push(lap);
    sessionLap(G, lap, l.valid !== false);
    if (!D.tracks[G].includes(l.track)) D.tracks[G].push(l.track);
    if (!D.cars[G].includes(l.car)) D.cars[G].push(l.car);
    if (l.trial) { D.trackTypes[G] = D.trackTypes[G] || {}; if (!D.trackTypes[G][l.track]) D.trackTypes[G][l.track] = l.trial === "drag" ? "drag" : "stage"; }
    LAST = { g: G, t: l.track };
    try { localStorage.setItem("lapbook.last", JSON.stringify(LAST)); } catch (e) {}
    added[G] = (added[G] || 0) + 1; lastLap[G] = ms; lastGame = G;
    if (!ok) { ok = true; try { localStorage.setItem("lapbook.liveok", "1"); } catch (e) {} }
    save();
    refresh();
    overlayFeed();
    const rec = !prev || ms < prev.timeInMs;
    if (isFz(G)) added[G] = added[G] || 0;
    toast(`${G === AC ? "AC" : isFz(G) ? G.replace("Forza Horizon", "FH") : "F1 25"} · ${l.track}: ${fmt(ms)}` + (rec ? (prev ? `, new record by ${gp(prev.timeInMs - ms)}` : ", first lap here") : `, +${gp(ms - prev.timeInMs)} to record`) + (l.valid ? "" : " (invalid)"));
  });
  B.getSettings().then(s => { st.settings = s; st.port = s.port; header(); placeCard(); });
  B.appInfo().then(i => { info = i; if (i.bootError) toast(i.bootError); });
  fixNames();

  // ---------- automatic backup to Documents\Lapbook ----------
  let last = "";
  const backup = () => { try { const j = JSON.stringify(D); if (j !== last) { last = j; B.backup(j); } } catch (e) {} };
  setInterval(backup, 30000);
  setTimeout(backup, 3000);
  window.addEventListener("beforeunload", backup);
  setTimeout(() => { try { cst("Saved on this PC"); } catch (e) {} }, 800);
  // the first render happened before this script loaded
  render();
})();
