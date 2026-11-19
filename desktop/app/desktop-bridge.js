/* Lapbook desktop: live tracking for F1 25, automatic backups and drag-and-drop updates.
   Uses the Lapbook page's own functions and styles (D, save, render, toast, .panel, .b ...),
   so the design stays the same. */
(function () {
  const B = window.lapbridge;
  if (!B) return;
  const G = "F1 25";
  let st = { listening: false, port: 20777, error: "", movedFrom: 0, lastPacket: 0, info: {}, lastLap: null, lapsSaved: 0, settings: { port: 20777, saveInvalid: false, network: false } };
  let info = { version: "", overlay: false, canRollback: false, previous: "" };
  let added = 0, skipped = 0, wasLive = false, showHow = false;
  let ok = false;
  try { ok = localStorage.getItem("lapbook.liveok") === "1"; } catch (e) {}

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
  .unotes{margin:6px 0 0;padding-left:18px;color:var(--mu);font-size:14px}`;
  document.head.appendChild(css);

  const live = () => st.listening && Date.now() - st.lastPacket < 5000;
  const port = () => st.port || st.settings.port;

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
    }
    b.textContent = st.error ? "Live: problem" : live() ? "● Live" : "○ Live";
    b.style.color = st.error ? "var(--dn)" : live() ? "var(--gr)" : "var(--mu)";
    b.title = st.error || (live() ? "Receiving F1 25 telemetry" : "Waiting for F1 25 on port " + port());
  }

  // ---------- live card on the home page ----------
  function gameRows() {
    return `<div class="gset"><span>UDP Telemetry</span><b>On</b><span>UDP Broadcast Mode</span><b>Off</b><span>UDP IP Address</span><b>127.0.0.1</b><span>UDP Port</span><b>${port()}</b><span>UDP Send Rate</span><b>20Hz</b><span>UDP Format</span><b>2025</b></div>
    <p class="ls" style="margin:0">In F1 25: Settings → Telemetry Settings. Start Lapbook first, then the game.</p>`;
  }
  function liveCard() {
    const i = st.info || {}, L = st.lastLap, on = live();
    if (st.error) {
      return `<section class="panel live err" id="livecard"><div class="lh"><span class="lt"><span class="dot"></span>Live tracking needs attention</span><button class="b" data-live="set">Settings</button></div><p class="ls" style="margin:0;color:var(--dn)">${esc(st.error)}</p></section>`;
    }
    if (on) {
      const has = i.track && D.tracks[G] && D.tracks[G].includes(i.track);
      return `<section class="panel live on" id="livecard"><div class="lh"><span class="lt"><span class="dot"></span>Live · F1 25</span>${has ? `<button class="b" data-live="open">Open ${esc(i.track)}</button>` : ""}</div>
      <div class="lh"><span><b>${esc(i.track || "Waiting for track")}</b><br><span class="ls">${esc([i.car, i.session].filter(Boolean).join(" · ") || "Drive a lap, it is saved by itself")}</span></span>
      ${L ? `<span style="text-align:right"><span class="big">${fmt(L.timeInMs)}</span><br><span class="ls">last lap · ${added} saved${skipped ? `, ${skipped} invalid skipped` : ""}</span></span>` : `<span class="ls">Finish a lap and it appears here.</span>`}</div></section>`;
    }
    if (ok && !showHow) {
      return `<section class="panel live" id="livecard"><div class="lh"><span class="lt"><span class="dot"></span>Live tracking ready</span><span class="acts"><button class="b ghost" data-live="how">Game settings</button><button class="b" data-live="set">Settings</button></span></div><p class="ls" style="margin:0">Start F1 25 and drive. Every finished lap is saved automatically (port ${port()}).</p>${moved()}</section>`;
    }
    return `<section class="panel live" id="livecard"><div class="lh"><span class="lt"><span class="dot"></span>Set up live tracking for F1 25</span>${ok ? `<button class="b ghost" data-live="hide">Hide</button>` : ""}</div>
      <ol class="steps"><li class="${st.listening ? "done" : ""}"><i>${st.listening ? "✓" : "1"}</i><span>Lapbook is ready on port ${port()}</span></li>
      <li class="${wasLive ? "done" : ""}"><i>${wasLive ? "✓" : "2"}</i><span>Turn on UDP telemetry in F1 25 with these settings, then start a session:</span></li></ol>
      ${gameRows()}
      <ol class="steps" start="3"><li class="${added ? "done" : ""}"><i>${added ? "✓" : "3"}</i><span>Drive one full lap. It is saved here by itself.</span></li></ol>${moved()}</section>`;
  }
  const moved = () => st.movedFrom ? `<p class="warn2" style="margin:0">Port ${st.movedFrom} is used by another program (for example SimHub), so Lapbook switched to <b>${port()}</b>. Set UDP Port <b>${port()}</b> in F1 25.</p>` : "";
  function placeCard() {
    const old = document.getElementById("livecard");
    if (S.v !== "home") { if (old) old.remove(); return; }
    const html = liveCard();
    if (old && placeCard.last === html) return;
    placeCard.last = html;
    if (old) { old.outerHTML = html; return; }
    const top = document.querySelector("#app .top");
    if (top) top.insertAdjacentHTML("afterend", html);
  }
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-live]");
    if (!t) return;
    const k = t.dataset.live;
    if (k === "set") openPanel();
    if (k === "how") { showHow = true; placeCard(); }
    if (k === "hide") { showHow = false; placeCard(); }
    if (k === "open" && st.info && st.info.track) {
      Object.assign(S, { v: "track", g: G, t: st.info.track, tab: "tracks", F: {}, open: "", add: false, edit: "", hc: "", hn: 30, co: false });
      render(); scrollTo(0, 0);
    }
  });

  // keep our additions when Lapbook re-renders
  const baseRender = render;
  render = function () { baseRender(); try { header(); placeCard(); } catch (e) {} };

  // ---------- settings ----------
  function openPanel() {
    const s = st.settings;
    $("#modal").innerHTML = `<div class="ov"><div class="md"><h3>Live tracking settings</h3>
      <div class="two"><label>UDP port<input id="tport" inputmode="numeric" value="${esc(s.port)}"></label><label>Invalid laps<select id="tinv"><option value="0" ${s.saveInvalid ? "" : "selected"}>Skip them</option><option value="1" ${s.saveInvalid ? "selected" : ""}>Save them too</option></select></label></div>
      <label>F1 25 runs on<select id="tnet"><option value="0" ${s.network ? "" : "selected"}>This PC</option><option value="1" ${s.network ? "selected" : ""}>Another device (console or second PC)</option></select></label>
      ${gameRows()}
      <p class="ls" style="color:var(--mu)">This session: ${added} lap${added === 1 ? "" : "s"} saved${skipped ? `, ${skipped} invalid skipped` : ""}. Lapbook ${esc(info.version)}.</p>
      <div class="acts"><button class="b pri" id="tsave" type="button">Save</button><button class="b" id="tfold" type="button">Open backup folder</button><button class="b ghost" data-act="closem">Close</button></div></div></div>`;
    $("#tsave").onclick = async () => {
      st.settings = await B.setSettings({ port: Number($("#tport").value), saveInvalid: $("#tinv").value === "1", network: $("#tnet").value === "1" });
      $("#modal").innerHTML = "";
      toast("Live tracking settings saved");
    };
    $("#tfold").onclick = () => B.openBackups();
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
    r.innerHTML = `<div class="panel" style="margin:6px 0"><div class="lh" style="display:flex;justify-content:space-between;align-items:baseline;gap:10px"><b style="font-size:18px">Lapbook ${esc(m.version)}</b><span class="ls">${esc(m.date)}</span></div>
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
    st = { ...st, ...s };
    if (live() && !wasLive) {
      wasLive = true;
      toast("F1 25 connected. Laps are saved automatically.");
    }
    header(); placeCard();
  });
  B.onSkipped(() => { skipped++; placeCard(); toast("F1 25: invalid lap not saved"); });
  B.onLap(l => {
    const ms = Math.round(Number(l.timeInMs));
    if (!(ms > 0) || !l.track || !l.car) return;
    if (!Array.isArray(D.tracks[G])) D.tracks[G] = [];
    if (!Array.isArray(D.cars[G])) D.cars[G] = [];
    const day = today();
    if (D.lapTimes.some(x => x.game === G && x.track === l.track && x.car === l.car && x.timeInMs === ms && x.date === day)) return;
    const prev = best(laps(G).filter(x => x.track === l.track));
    const wet = { rain: "wet", storm: "wet", light_rain: "damp" }[l.weather] || "green";
    D.lapTimes.push({
      id: uid(), game: G, track: l.track, car: l.car, timeInMs: ms, formattedTime: fmt(ms), date: day,
      weather: l.weather || "sun", condition: wet, tire: l.tire || "", tuning: "",
      notes: [l.session, l.valid ? "" : "invalid", "auto"].filter(Boolean).join(" · "),
      airTemp: l.airTemp === undefined ? "" : String(l.airTemp), asphaltTemp: l.trackTemp === undefined ? "" : String(l.trackTemp), windSpeed: "",
    });
    if (!D.tracks[G].includes(l.track)) D.tracks[G].push(l.track);
    if (!D.cars[G].includes(l.car)) D.cars[G].push(l.car);
    LAST = { g: G, t: l.track };
    try { localStorage.setItem("lapbook.last", JSON.stringify(LAST)); } catch (e) {}
    added++;
    if (!ok) { ok = true; try { localStorage.setItem("lapbook.liveok", "1"); } catch (e) {} }
    save();
    refresh();
    const rec = !prev || ms < prev.timeInMs;
    toast(`F1 25 · ${l.track}: ${fmt(ms)}` + (rec ? (prev ? `, new record by ${gp(prev.timeInMs - ms)}` : ", first lap here") : `, +${gp(ms - prev.timeInMs)} to record`) + (l.valid ? "" : " (invalid)"));
  });
  B.getSettings().then(s => { st.settings = s; st.port = s.port; header(); placeCard(); });
  B.appInfo().then(i => { info = i; if (i.bootError) toast(i.bootError); });

  // ---------- automatic backup to Documents\Lapbook ----------
  let last = "";
  const backup = () => { try { const j = JSON.stringify(D); if (j !== last) { last = j; B.backup(j); } } catch (e) {} };
  setInterval(backup, 30000);
  setTimeout(backup, 3000);
  window.addEventListener("beforeunload", backup);
  setTimeout(() => { try { cst("Saved on this PC"); } catch (e) {} }, 800);
  header(); placeCard();
})();
