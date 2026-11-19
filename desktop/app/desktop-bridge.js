/* Lapbook desktop: adds F1 25 laps from the game telemetry and backs up the data.
   Uses the Lapbook page's own functions (D, save, render, toast ...), so the design stays the same. */
(function () {
  const B = window.lapbridge;
  if (!B) return;
  const G = "F1 25";
  let st = { listening: false, port: 20777, error: "", lastPacket: 0, settings: { port: 20777, saveInvalid: false, network: false } };
  let added = 0, skipped = 0;

  const live = () => st.listening && Date.now() - st.lastPacket < 5000;
  const pillText = () => st.error ? "F1 25: error" : !st.listening ? "F1 25: off" : live() ? "● F1 25 live" : "○ F1 25 waiting";
  function pill() {
    const a = document.querySelector(".top .acts");
    if (!a) return;
    let b = document.getElementById("tele");
    if (!b) {
      b = document.createElement("button");
      b.id = "tele";
      b.className = "b";
      b.type = "button";
      b.addEventListener("click", e => { e.stopPropagation(); openPanel(); });
      a.insertBefore(b, a.firstChild);
    }
    b.textContent = pillText();
    b.style.color = st.error ? "var(--dn)" : live() ? "var(--gr)" : "var(--mu)";
    b.title = st.error || (live() ? "Receiving F1 25 telemetry" : "Listening on port " + st.port + ". Start a session in F1 25.");
  }
  // keep the pill when Lapbook re-renders its header
  const baseRender = render;
  render = function () { baseRender(); try { pill(); } catch (e) {} };

  function openPanel() {
    const s = st.settings;
    $("#modal").innerHTML = `<div class="ov"><div class="md"><h3>F1 25 telemetry</h3>
      <p class="mu" style="margin-top:0">${st.error ? `<span style="color:var(--dn)">${esc(st.error)}</span>` : live() ? "Receiving data. Every finished lap is saved by itself." : st.listening ? "Listening, but no data yet. Start a session in F1 25 with UDP telemetry on." : "Not listening."}</p>
      <p class="mu">This session: ${added} lap${added === 1 ? "" : "s"} saved${skipped ? `, ${skipped} invalid lap${skipped === 1 ? "" : "s"} skipped` : ""}.</p>
      <div class="two"><label>UDP port<input id="tport" inputmode="numeric" value="${esc(s.port)}"></label><label>Invalid laps<select id="tinv"><option value="0" ${s.saveInvalid ? "" : "selected"}>Skip them</option><option value="1" ${s.saveInvalid ? "selected" : ""}>Save them too</option></select></label></div>
      <label>Game runs on<select id="tnet"><option value="0" ${s.network ? "" : "selected"}>This PC</option><option value="1" ${s.network ? "selected" : ""}>Another device (console or second PC)</option></select></label>
      <div class="panel" style="margin:4px 0 12px"><b>In F1 25</b><p class="mu" style="margin:6px 0 0">Settings → Telemetry Settings: UDP Telemetry <b>On</b>, UDP Broadcast Mode <b>Off</b>, UDP IP Address <b>127.0.0.1</b>, UDP Port <b>${esc(s.port)}</b>, UDP Send Rate <b>20Hz</b>, UDP Format <b>2025</b>.</p></div>
      <div class="acts"><button class="b pri" id="tsave" type="button">Save</button><button class="b" id="tfold" type="button">Open backup folder</button><button class="b ghost" data-act="closem">Close</button></div></div></div>`;
    $("#tsave").onclick = async () => {
      const next = { port: Number($("#tport").value), saveInvalid: $("#tinv").value === "1", network: $("#tnet").value === "1" };
      st.settings = await B.setSettings(next);
      $("#modal").innerHTML = "";
      toast("Telemetry settings saved");
    };
    $("#tfold").onclick = () => B.openBackups();
  }

  const busy = () => document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  function refresh() {
    if (busy() || $("#modal").innerHTML) { pill(); return; }
    const y = scrollY; render(); scrollTo(0, y);
  }

  B.onStatus(s => { st = { ...st, ...s }; pill(); });
  B.onSkipped(() => { skipped++; toast("F1 25: invalid lap not saved"); });
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
    save();
    refresh();
    const rec = !prev || ms < prev.timeInMs;
    toast(`F1 25 · ${l.track}: ${fmt(ms)}` + (rec ? (prev ? `, new record by ${gp(prev.timeInMs - ms)}` : ", first lap here") : `, +${gp(ms - prev.timeInMs)} to record`) + (l.valid ? "" : " (invalid)"));
  });
  B.getSettings().then(s => { st.settings = s; st.port = s.port; pill(); });

  // automatic backup to Documents\Lapbook every 30 seconds when something changed
  let last = "";
  const backup = () => { try { const j = JSON.stringify(D); if (j !== last) { last = j; B.backup(j); } } catch (e) {} };
  setInterval(backup, 30000);
  setTimeout(backup, 3000);
  window.addEventListener("beforeunload", backup);
  setTimeout(() => { try { cst("Saved on this PC"); } catch (e) {} }, 800);
  pill();
})();
