/* Lapbook desktop: live tracking (F1 25, Assetto Corsa), automatic backups,
   drag-and-drop updates and a wide-screen layout.
   Uses the Lapbook page's own functions and styles (D, save, render, toast, .panel, .b ...),
   so the design stays the same. */
(function () {
  const B = window.lapbridge;
  if (!B) return;
  const F1 = "F1 25", AC = "Assetto Corsa";
  let st = { listening: false, port: 20777, error: "", movedFrom: 0, lastPacket: 0, info: {}, lastLap: null, settings: { port: 20777, saveInvalid: false, network: false, acOn: true, carNames: {} }, ac: { connected: false, on: true, folder: "" } };
  let info = { version: "", overlay: false, canRollback: false, previous: "" };
  const added = { [F1]: 0, [AC]: 0 }, lastLap = {};
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
    const on = [f1Live() && "F1 25", acLive() && "AC"].filter(Boolean);
    b.textContent = st.error ? "Live: problem" : on.length ? "● Live · " + on.join(" + ") : "○ Live";
    b.style.color = st.error ? "var(--dn)" : on.length ? "var(--gr)" : "var(--mu)";
    b.title = st.error || (on.length ? "Receiving telemetry" : "Waiting for F1 25 or Assetto Corsa");
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
  function liveCard() {
    if (st.error) {
      return `<section class="panel live err" id="livecard"><div class="lh"><span class="lt"><span class="dot"></span>Live tracking needs attention</span><button class="b" data-live="set">Settings</button></div><p class="ls" style="margin:0;color:var(--dn)">${esc(st.error)}</p></section>`;
    }
    const a = f1Live(), c = acLive();
    if (a || c) return `<section class="panel live on" id="livecard">${a ? f1Live_() : ""}${c ? acLive_() : ""}</section>`;
    if (ok && !showHow) {
      return `<section class="panel live" id="livecard"><div class="lh"><span class="lt"><span class="dot"></span>Live tracking ready</span><span class="acts"><button class="b ghost" data-live="how">How to</button><button class="b" data-live="set">Settings</button></span></div><p class="ls" style="margin:0">Start F1 25 or Assetto Corsa and drive. Every finished lap is saved automatically.</p>${moved()}</section>`;
    }
    const chips = `<div class="chips" style="margin:0">${[F1, AC].map(g => `<button class="chip ${tab === g ? "on" : ""}" data-live="tab" data-g="${g}">${g}</button>`).join("")}</div>`;
    const body = tab === AC
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
    if (old && old.contains(document.activeElement) && document.activeElement.id === "cname") return; // typing a car name
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
  // laps saved before a team was known get their real name
  async function fixNames() {
    try {
      const k = await B.knownCars();
      let n = 0;
      for (const [id, name] of Object.entries(k.names)) n += renameCar(F1, k.placeholder[id], name);
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
    if (k === "open") {
      Object.assign(S, { v: "track", g: t.dataset.g, t: t.dataset.t, tab: "tracks", F: {}, open: "", add: false, edit: "", hc: "", hn: 30, co: false });
      render(); scrollTo(0, 0);
    }
  });

  // keep our additions when Lapbook re-renders
  const baseRender = render;
  render = function () { baseRender(); try { header(); wide(); placeCard.last = ""; placeCard(); } catch (e) { console.error(e); } };

  // ---------- settings ----------
  async function openPanel() {
    const s = st.settings, k = await B.knownCars().catch(() => ({ names: {} }));
    const own = Object.entries(s.carNames || {});
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
      <h4>In-game overlay</h4>
      <div class="two"><label>Overlay<select id="ovon"><option value="1" ${ovOn() ? "selected" : ""}>On</option><option value="0" ${ovOn() ? "" : "selected"}>Off</option></select></label>
      <label>Position<select id="ovlk"><option value="1" ${(s.overlay || {}).locked !== false ? "selected" : ""}>Locked (clicks go to the game)</option><option value="0" ${(s.overlay || {}).locked === false ? "selected" : ""}>Unlocked (drag to move)</option></select></label></div>
      <div class="two"><label>Size<select id="ovsz">${[[0.8, "Small"], [1, "Medium"], [1.3, "Large"], [1.7, "Extra large"]].map(([v, n]) => `<option value="${v}" ${Number((s.overlay || {}).scale || 1) === v ? "selected" : ""}>${n}</option>`).join("")}</select></label>
      <label>Background<select id="ovop">${[[0.6, "See-through"], [0.82, "Normal"], [0.95, "Solid"]].map(([v, n]) => `<option value="${v}" ${Number((s.overlay || {}).opacity || 0.82) === v ? "selected" : ""}>${n}</option>`).join("")}</select></label></div>
      <p class="ls" style="margin:0;color:var(--mu)">Shortcuts: <b>Ctrl+Shift+O</b> overlay on/off, <b>Ctrl+Shift+L</b> lock/unlock to move it. The game must run in <b>borderless</b> or <b>windowed fullscreen</b> mode. <button class="b ghost" id="ovrs" type="button">Reset position</button></p>
      <p class="ls" style="color:var(--mu)">This session: ${added[F1]} F1 25 and ${added[AC]} Assetto Corsa lap${added[AC] === 1 ? "" : "s"} saved. Lapbook ${esc(info.version)}.</p>
      <div class="acts"><button class="b pri" id="tsave" type="button">Save</button><button class="b" id="tfold" type="button">Open backup folder</button><button class="b ghost" data-act="closem">Close</button></div></div></div>`;
    $("#ovrs").onclick = async () => { st.settings.overlay = await B.setOverlay({ on: true, reset: true }); toast("Overlay moved to the top right"); };
    $("#acpick").onclick = async () => { const d = await B.pickACFolder(); if (d) { await B.setACFolder(d); openPanel(); } };
    $("#tsave").onclick = async () => {
      st.settings = await B.setSettings({ port: Number($("#tport").value), saveInvalid: $("#tinv").value === "1", network: $("#tnet").value === "1", acOn: $("#acon").value === "1" });
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

  // ---------- overlay data: what the in-game overlay shows ----------
  let lastGame = "";
  function overlayFeed() {
    const g = f1Live() ? F1 : acLive() ? AC : lastGame;
    if (!g) return B.overlayData({});
    const track = g === F1 ? (st.info || {}).track : st.ac.track, car = g === F1 ? (st.info || {}).car : st.ac.car;
    if (!track) return B.overlayData({ game: g, live: f1Live() || acLive() });
    const all = D.lapTimes.filter(l => l.game === g && l.track === track), mine = all.filter(l => l.car === car);
    const rec = best(all), b = best(mine), lastL = mine[mine.length - 1], prev = best(mine.slice(0, -1));
    B.overlayData({
      game: g, live: g === F1 ? f1Live() : acLive(), track, car,
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
    st = { ...st, ...s, ac: { ...st.ac, ...(s.ac || {}) } };
    if (f1Live() && !wasLive) { wasLive = true; toast("F1 25 connected. Laps are saved automatically."); }
    if (acLive() && !acWas) { acWas = true; toast("Assetto Corsa connected. Laps are saved automatically."); }
    header(); placeCard(); overlayFeed();
  });
  B.onSkipped(() => { skipped++; placeCard.last = ""; placeCard(); toast("F1 25: invalid lap not saved"); });
  B.onLap(l => {
    const G = l.game === AC ? AC : F1;
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
    } else Object.assign(lap, { weather: "", condition: "", tire: "", notes: "auto" });
    D.lapTimes.push(lap);
    if (!D.tracks[G].includes(l.track)) D.tracks[G].push(l.track);
    if (!D.cars[G].includes(l.car)) D.cars[G].push(l.car);
    LAST = { g: G, t: l.track };
    try { localStorage.setItem("lapbook.last", JSON.stringify(LAST)); } catch (e) {}
    added[G]++; lastLap[G] = ms; lastGame = G;
    if (!ok) { ok = true; try { localStorage.setItem("lapbook.liveok", "1"); } catch (e) {} }
    save();
    refresh();
    overlayFeed();
    const rec = !prev || ms < prev.timeInMs;
    toast(`${G === AC ? "AC" : "F1 25"} · ${l.track}: ${fmt(ms)}` + (rec ? (prev ? `, new record by ${gp(prev.timeInMs - ms)}` : ", first lap here") : `, +${gp(ms - prev.timeInMs)} to record`) + (l.valid ? "" : " (invalid)"));
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
