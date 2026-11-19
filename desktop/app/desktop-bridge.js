/* Lapbook desktop: live tracking (F1 25, Assetto Corsa), automatic backups,
   drag-and-drop updates and a wide-screen layout.
   Uses the Lapbook page's own functions and styles (D, save, render, toast, .panel, .b ...),
   so the design stays the same. */
(function () {
  const B = window.lapbridge;
  if (!B) return;
  const F1 = "F1 25", AC = "Assetto Corsa", FZ = "Forza";
  const ACC = "Assetto Corsa Competizione", LMU = "Le Mans Ultimate", PC2 = "Project CARS 2";
  const SIMG = [ACC, LMU, PC2]; // games with their own reader in the desktop app
  const LIVE_GAMES = [F1, AC, ACC, LMU, PC2, FZ];
  const isFz = g => /^Forza/.test(g || "");
  const abbr = g => ({ "F1 25": "F1", "Assetto Corsa": "AC", "Assetto Corsa Competizione": "ACC", "Le Mans Ultimate": "LMU", "Forza Horizon 5": "FH5", "Forza Horizon 6": "FH6", "Project CARS 2": "PC2", Forza: "FH" }[g] || String(g).slice(0, 3).toUpperCase());
  let st = { listening: false, port: 20777, error: "", movedFrom: 0, lastPacket: 0, info: {}, lastLap: null, settings: { port: 20777, saveInvalid: false, network: false, acOn: true, carNames: {} }, ac: { connected: false, on: true, folder: "" }, fz: { live: false, on: true, port: 5300, game: "Forza Horizon 6" } };
  let info = { version: "", overlay: false, canRollback: false, previous: "" };
  const added = { [F1]: 0, [AC]: 0, [ACC]: 0, [LMU]: 0, [PC2]: 0 }, lastLap = {}, simWas = {};
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
  #ovp{max-width:1080px}.ovcols{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:0 36px}@media(max-width:900px){.ovcols{grid-template-columns:1fr}}
  .ovgrid{display:grid;grid-template-columns:repeat(3,52px);grid-template-rows:repeat(3,34px);gap:4px;padding:6px;border:1px solid var(--ln);border-radius:var(--r);background:var(--sf2)}
  .ovgrid button{border:1px solid var(--ln);border-radius:6px;background:var(--sf);cursor:pointer;display:flex;align-items:center;justify-content:center}
  .ovgrid button i{width:18px;height:8px;border-radius:2px;background:var(--mu);opacity:.5}
  .ovgrid button.on{border-color:var(--rd)}.ovgrid button.on i{background:var(--rd);opacity:1}
  .ovnudge{display:grid;grid-template-columns:repeat(3,40px);gap:4px}.ovnudge button{height:36px;border:1px solid var(--ln);border-radius:8px;background:var(--sf2);color:var(--tx);cursor:pointer;font-size:16px}
  .unotes{margin:6px 0 0;padding-left:18px;color:var(--mu);font-size:14px}
  .md h4{margin:16px 0 6px;font-size:14px}
  .cn{display:grid;grid-template-columns:70px 1fr;gap:6px 10px;align-items:center;font-size:14px}
  /* ---- desktop shell: sidebar + content ---- */
  body.desk .top{display:none}
  body.desk #app.wrap{margin:0 0 0 236px;max-width:none;padding:28px clamp(20px,3vw,48px) 90px}
  #sb{position:fixed;left:0;top:0;bottom:0;width:236px;background:var(--sf);border-right:1px solid var(--ln);display:flex;flex-direction:column;padding:20px 12px 14px;z-index:7;overflow-y:auto;scrollbar-width:thin}
  .sbl{display:flex;align-items:center;gap:10px;padding:0 10px 18px}.sbl b{font-size:20px;letter-spacing:.06em;font-weight:700}.sbl i{width:16px;height:8px;background:var(--rd);transform:skewX(-20deg)}
  #sb nav{display:flex;flex-direction:column;gap:2px}
  #sb h6{font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--mu);margin:18px 10px 6px}
  .ni{display:flex;align-items:center;gap:11px;width:100%;min-height:38px;padding:7px 10px;border:0;background:none;border-radius:8px;color:var(--mu);font-weight:600;font-size:14.5px;cursor:pointer;text-align:left;white-space:nowrap}
  .ni:hover{background:var(--sf2);color:var(--tx)}.ni.on{background:var(--sf2);color:var(--tx);box-shadow:inset 3px 0 0 var(--rd)}
  .ni svg{width:18px;height:18px;flex:none}.ni span{overflow:hidden;text-overflow:ellipsis}
  .ni small{margin-left:auto;font-size:12px;color:var(--mu);font-weight:500}
  .ni em.sdot{margin-left:auto;width:8px;height:8px;border-radius:50%;background:var(--ln);flex:none}.ni em.sdot.on{background:var(--gr);box-shadow:0 0 0 3px color-mix(in srgb,var(--gr) 25%,transparent)}.ni em.sdot.err{background:var(--dn)}
  .ni i.ab{flex:none;width:28px;height:18px;margin:0 -5px;border-radius:4px;background:var(--sf2);font-style:normal;font-size:10px;font-weight:700;letter-spacing:.02em;display:flex;align-items:center;justify-content:center;color:var(--tx)}
  .ni.on i.ab{background:var(--rd);color:#fff}
  .ni.more{min-height:30px;font-size:13px;font-weight:500;padding-left:39px}
  .sbf{margin-top:auto;padding-top:12px;border-top:1px solid var(--ln);display:flex;flex-direction:column;gap:2px}.sbf p{font-size:11.5px;color:var(--mu);margin:8px 10px 0}
  @media (max-width:1000px){#sb{width:64px;padding:16px 8px}.ni span,.ni small,#sb h6,.sbf p,.sbl b,.ni.more{display:none}.ni{justify-content:center}.sbl{justify-content:center}body.desk #app.wrap{margin-left:64px;padding:20px 18px 90px}}
  .ph{display:flex;align-items:baseline;gap:14px;margin:0 0 22px;flex-wrap:wrap}.ph h1{font-size:28px;margin:0}.ph .sp{flex:1}.ph .mu{font-size:14px}
  .card{background:var(--sf);border:1px solid var(--ln);border-radius:12px;padding:18px 20px;margin:0 0 20px}
  .ch{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 14px}.ch h2{margin:0}
  .b.sm{padding:4px 10px;font-size:13px}
  .hg{display:grid;grid-template-columns:minmax(0,1fr) minmax(340px,420px);gap:0 22px;align-items:start}
  @media (max-width:1150px){.hg{grid-template-columns:1fr}}
  .gg{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px}
  #app .gg>.gcov{height:128px;margin:0;font-size:24px;padding:0 24px}#app .gg>.gcov small{font-size:13px}
  .kpi{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
  .kpi>*{background:var(--sf2);border:0;border-radius:8px;padding:10px 12px;text-align:left;color:inherit;font:inherit;cursor:default}
  .kpi>button{cursor:pointer}.kpi>button:hover{outline:1px solid var(--ln)}
  .kpi b{display:block;font-size:22px;font-variant-numeric:tabular-nums;line-height:1.15}.kpi span{font-size:12px;color:var(--mu)}
  .rank{display:block;width:100%;margin-top:12px;background:none;border:0;padding:0;color:inherit;font:inherit;text-align:left;cursor:pointer}.rank>span{font-size:14px;color:var(--mu)}.rank b{color:var(--tx)}.rank .pr{margin:6px 0 0}
  .rrow{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;padding:9px 4px;border:0;border-top:1px solid var(--ln);background:none;color:inherit;font:inherit;text-align:left;cursor:pointer}
  .rrow:first-of-type{border-top:0}.rrow:hover{background:var(--sf2)}
  .rrow b{display:block;font-weight:600;font-size:15px}.rrow small{display:block;color:var(--mu);font-size:12.5px}
  .rrow .tm{font-size:17px;min-width:0}.rrow .tm small{text-align:right}
  .rrow.cont{background:var(--sf2);border-radius:8px;padding:10px 12px;margin-bottom:6px}
  .gsl{display:flex;gap:8px;flex-wrap:wrap}
  .gs{display:inline-flex;align-items:center;gap:7px;font-size:13px;color:var(--mu);background:var(--sf2);border-radius:999px;padding:4px 11px}
  .gs i{width:7px;height:7px;border-radius:50%;background:var(--ln)}.gs.ready i{background:var(--pu)}.gs.live i{background:var(--gr)}.gs.live{color:var(--tx)}
  .lgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));gap:20px;align-items:start}.lgrid .card{margin:0}
  .dgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px}.dgrid .b{text-align:left;padding:12px 14px}.dgrid b{display:block}.dgrid small{display:block;color:var(--mu);font-size:12px;font-weight:400}
  body.desk #app .ban{height:84px}body.desk #app .ban h1{font-size:28px}
  body.desk #app .back{margin-bottom:12px}
  .cgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}
  .cc{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:12px 14px;background:var(--sf2);border:1px solid transparent;border-radius:10px;color:inherit;font:inherit;text-align:left;cursor:pointer;min-width:0}
  .cc:hover{border-color:var(--ln)}.cc b{font-size:16px;font-weight:600;overflow:hidden;text-overflow:ellipsis;max-width:100%;white-space:nowrap}.cc small{color:var(--mu);font-size:12px;overflow:hidden;text-overflow:ellipsis;max-width:100%;white-space:nowrap}.cc .tm{font-size:20px;text-align:left;min-width:0;margin:2px 0}
  .kpi span{white-space:nowrap}
  .mgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px}
  .mst{background:var(--sf2);border-radius:10px;padding:12px 14px;opacity:.8}.mst.got{opacity:1}
  .mh{display:flex;justify-content:space-between;align-items:center;gap:8px}.mh b{font-size:16px}
  .mt{font-size:11px;font-weight:700;border:1px solid var(--c);color:var(--c);border-radius:999px;padding:0 8px}
  .mst p{margin:4px 0 10px;font-size:13px;color:var(--mu);min-height:34px}
  .mbar{display:block;height:6px;border-radius:3px;background:var(--ln);overflow:hidden}.mbar i{display:block;height:100%;border-radius:3px}
  .mf{display:flex;justify-content:space-between;align-items:center;margin-top:8px;font-size:12px;color:var(--mu)}
  .pips2{display:flex;gap:4px}.pips2 i{width:16px;height:5px;border-radius:3px}
  .rlad{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:14px}.rlad span{background:var(--sf2);border-radius:8px;padding:6px 8px;opacity:.5}.rlad span.on{opacity:1;box-shadow:inset 0 0 0 1px var(--rd)}.rlad b{display:block;font-size:13px}.rlad small{font-size:11px;color:var(--mu)}
  .nx{display:grid;grid-template-columns:1fr auto;gap:4px 10px;padding:10px 0;border-top:1px solid var(--ln)}.nx:first-of-type{border-top:0;padding-top:0}.nx b{display:block;font-size:15px}.nx small{display:block;font-size:12px;color:var(--mu)}.nx>span{font-size:12px;color:var(--mu);white-space:nowrap}.nx .mbar{grid-column:1/-1}
  #app .add.addnew{max-width:720px;opacity:.85}#app .add.addnew input{min-width:220px}
  body.desk #app[data-v=track] .b.wide[data-act=addtoggle]{width:auto;display:inline-block;padding:9px 22px;margin:0 0 6px !important}
  body.desk #app[data-v=game] .list>.row{min-height:64px}
  /* ---- wide screens: more room, several columns ---- */
  @media (min-width:1200px){
   .fab{right:32px}
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
  /* F1 25 career: sessions of a round */
  .csess{max-width:720px;display:flex;flex-direction:column;gap:4px;margin-top:10px;border-top:1px solid var(--ln);padding-top:8px}
  .csess summary{display:flex;justify-content:space-between;gap:10px;cursor:pointer;font-size:14px;padding:4px 0}.csess summary span{color:var(--mu)}
  .cst{max-width:720px;display:grid;grid-template-columns:28px minmax(0,1fr) 84px 70px 34px;gap:4px 10px;font-size:13px;font-variant-numeric:tabular-nums;padding:6px 0 10px;align-items:baseline}
  .cst small{display:block;color:var(--mu);font-size:11.5px}.cst .me{color:var(--pu);font-weight:600}.cst>b{text-align:right}.cst>span:nth-child(5n+3),.cst>span:nth-child(5n+4){color:var(--mu);text-align:right}
  /* overlay on/off switch */
  .sw{position:relative;flex:none;width:34px;height:20px;border-radius:999px;background:var(--ln);cursor:pointer;transition:background .15s;display:inline-block;vertical-align:middle}
  .sw:after{content:"";position:absolute;top:3px;left:3px;width:14px;height:14px;border-radius:50%;background:#fff;transition:transform .15s}
  .sw.on{background:var(--gr)}.sw.on:after{transform:translateX(14px)}
  .ni .sw{margin-left:auto}
  .swb{display:inline-flex;align-items:center;gap:10px}
  /* game strip on the live tracking page */
  .gstrip{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:0 0 20px}
  .gs.live{display:inline-flex;flex-direction:row;gap:7px;margin:0}
  .gtile{position:relative;display:flex;flex-direction:column;justify-content:flex-end;align-items:flex-start;gap:2px;height:118px;padding:14px 16px;border:1px solid var(--ln);border-radius:12px;color:#fff;font:inherit;text-align:left;cursor:pointer;background-size:cover;overflow:hidden}
  .gtile:hover{border-color:#fff6}.gtile.sel{border-color:var(--rd);box-shadow:0 0 0 1px var(--rd)}
  .gtile b{font-size:26px;font-weight:800;line-height:1;letter-spacing:.02em;text-shadow:0 1px 8px #0008}.gtile span{font-size:12.5px;opacity:.85;text-shadow:0 1px 6px #000a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
  .gtile em{position:absolute;top:10px;right:10px;display:inline-flex;align-items:center;gap:6px;font-style:normal;font-size:11.5px;font-weight:600;background:#000a;border-radius:999px;padding:3px 9px}
  .gtile em i{width:7px;height:7px;border-radius:50%;background:#888}.gtile.ready em i{background:var(--pu)}.gtile.seen em i{background:#ffd23f}.gtile.live em i{background:var(--gr);box-shadow:0 0 0 3px color-mix(in srgb,var(--gr) 35%,transparent)}.gtile.setup em i{background:var(--dn)}
  .gtile.off{filter:grayscale(.85) brightness(.7)}
  /* what each game delivers */
  .rmx{width:100%;border-collapse:collapse;font-size:14px}.rmx th,.rmx td{padding:7px 8px;text-align:center;border-top:1px solid var(--ln)}.rmx th{font-size:12px;color:var(--mu);font-weight:600;border-top:0}
  .rmx td:first-child,.rmx th:first-child{text-align:left;color:var(--tx)}.rmx td:first-child small{display:block;color:var(--mu);font-size:12px}
  .rmx .y,.rmx .p,.rmx .n,.rmk i{display:inline-block;width:12px;height:12px;border-radius:50%}.rmx .y,.rmk .y{background:var(--gr)}.rmx .p,.rmk .p{background:conic-gradient(#ffd23f 0 50%,var(--ln) 0)}.rmx .n,.rmk .n{background:none;border:1.5px solid var(--ln)}
  .rmk{display:flex;gap:16px;flex-wrap:wrap;font-size:12.5px;color:var(--mu);margin-top:10px}.rmk span{display:inline-flex;align-items:center;gap:6px}
  /* where the best lap loses time */
  .sl{display:grid;grid-template-columns:34px 1fr 74px;gap:6px 10px;align-items:center;margin-top:12px;font-size:13px;font-variant-numeric:tabular-nums}
  .sl>span{color:var(--mu)}.sl>b{text-align:right;font-weight:600}.sl .bar{height:10px;border-radius:5px;background:var(--sf2);overflow:hidden}.sl .bar i{display:block;height:100%;border-radius:5px;background:var(--dn)}
  .sl .bar i.z{background:var(--pu)}
  /* overlay preview */
  .ovprev{display:flex;align-items:center;justify-content:center;min-height:170px;margin:4px 0 14px;border-radius:12px;padding:16px;background:linear-gradient(180deg,#5b7da8 0%,#9db6cf 42%,#3d4a33 43%,#2b3326 70%,#1b1f19 100%);overflow:hidden}
  .ovprev iframe{border:0;background:transparent;display:block;max-width:100%}
  @media (min-width:2200px){.wd{grid-template-columns:minmax(0,1fr) minmax(420px,26%)}#app .list:has(>.gcov){grid-template-columns:repeat(auto-fill,minmax(560px,1fr))}#app .list>.gcov{height:180px;font-size:34px}}`;
  document.head.appendChild(css);

  const f1Live = () => st.listening && Date.now() - st.lastPacket < 5000;
  const acLive = () => st.ac && st.ac.on && st.ac.connected;
  const fzLive = () => st.fz && st.fz.on && st.fz.live;
  const sim = g => (st.sims && st.sims[g]) || {};
  const simLive = g => !!(sim(g).on && sim(g).live);
  const port = () => st.port || st.settings.port;
  const ovOn = () => !!(st.settings.overlay && st.settings.overlay.on);

  // ---------- desktop shell: sidebar navigation ----------
  const NI = {
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/>',
    live: '<circle cx="12" cy="12" r="2.2"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14"/>',
    overlay: '<rect x="3" y="5" width="18" height="14" rx="2"/><rect x="12.5" y="8" width="6" height="4" rx="1"/>',
    flag: '<path d="M5 21V4"/><path d="M5 4h12l-2 4 2 4H5"/>',
    prog: '<path d="M3 17l5-5 4 3 8-9"/><path d="M15 6h5v5"/>',
    duel: '<path d="M5 4l9 9M14 13l-2 2 3 3 2-2-3-3M19 4l-9 9M10 13l2 2-3 3-2-2 3-3"/>',
    strat: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
    driver: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-4 3-6.5 7-6.5s7 2.5 7 6.5"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3M12 13v4M8.5 20h7"/>',
    data: '<ellipse cx="12" cy="6" rx="7" ry="2.5"/><path d="M5 6v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6M5 12v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-6"/>',
    update: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5"/><path d="M5 19h14"/>',
  };
  const nic = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${NI[k]}</svg>`;
  const MAIN_GAMES = [F1, AC, ACC, LMU, "Forza Horizon 5", "Forza Horizon 6", PC2];
  let moreGames = false;
  function sidebar() {
    let sb = document.getElementById("sb");
    if (!sb) {
      sb = document.createElement("aside");
      sb.id = "sb";
      document.body.prepend(sb);
      document.body.classList.add("desk");
    }
    const v = S.v, inGame = ["game", "track", "champ"].includes(v);
    const item = (attrs, icon, label, on, extra = "") => `<button class="ni ${on ? "on" : ""}" ${attrs} title="${label}">${nic(icon)}<span>${label}</span>${extra}</button>`;
    const liveOn = f1Live() || acLive() || fzLive() || SIMG.some(simLive);
    const gs = gl(), main = gs.filter(g => MAIN_GAMES.includes(g) || laps(g).length), rest = gs.filter(g => !main.includes(g));
    const ab = abbr;
    const gameItem = g => `<button class="ni ${inGame && S.g === g ? "on" : ""}" data-act="game" data-v="${esc(g)}" title="${esc(g)}"><i class="ab">${esc(ab(g))}</i><span>${esc(g)}</span>${laps(g).length ? `<small>${laps(g).length}</small>` : ""}</button>`;
    const html = `<div class="sbl"><b>LAPBOOK</b><i></i></div>
      <nav>
        ${item('data-act="home"', "home", "Overview", v === "home")}
        ${item('data-desk="live"', "live", "Live tracking", v === "live", `<em class="sdot ${st.error ? "err" : liveOn ? "on" : ""}"></em>`)}
        ${item('data-desk="overlay"', "overlay", "Overlay", false, ovSwitch())}
        <h6>Games</h6>
        ${main.map(gameItem).join("")}
        ${rest.length ? (moreGames ? rest.map(gameItem).join("") + `<button class="ni more" data-desk="less"><span>Fewer games</span></button>` : `<button class="ni more" data-desk="more"><span>${rest.length} more games</span></button>`) : ""}
        <h6>Analyse</h6>
        ${item('data-act="tool" data-v="prog"', "prog", "Progress", v === "prog")}
        ${item('data-act="tool" data-v="duel"', "duel", "Duel", v === "duel")}
        ${item('data-act="tool" data-v="strat"', "strat", "Strategy", v === "strat")}
        <h6>Career</h6>
        ${item('data-act="driver"', "driver", "Driver & races", v === "driver")}
        ${item('data-act="ach"', "trophy", "Achievements", v === "ach")}
      </nav>
      <div class="sbf">
        ${item('data-desk="data"', "data", "Data & backup", false)}
        ${item('data-desk="update"', "update", "Update", false)}
        <p>Lapbook ${esc(info.version || "")} · ${esc(typeof CST === "string" ? CST : "")}</p>
      </div>`;
    if (sidebar.last !== html) { sb.innerHTML = html; sidebar.last = html; }
  }
  const header = sidebar; // status updates redraw the sidebar
  // one click turns the overlay on or off (also Ctrl+Shift+O, in the game too)
  const ovSwitch = () => `<span class="sw ${ovOn() ? "on" : ""}" data-desk="ovtoggle" role="switch" aria-checked="${ovOn()}" title="Overlay ${ovOn() ? "on" : "off"} (Ctrl+Shift+O)"></span>`;
  async function toggleOverlay() {
    st.settings.overlay = await B.setOverlay({ on: !ovOn() });
    sidebar(); placeCard.last = ""; placeCard();
    toast(ovOn() ? "Overlay on. Ctrl+Shift+O switches it in the game too." : "Overlay off");
  }

  document.addEventListener("click", async e => {
    const t = e.target.closest("[data-desk]");
    if (!t) return;
    const k = t.dataset.desk;
    if (k === "live") { S.v = "live"; render(); scrollTo(0, 0); }
    if (k === "overlay") openOverlayPanel();
    if (k === "ovtoggle") { e.stopPropagation(); toggleOverlay(); }
    if (k === "update") openUpdate("");
    if (k === "data") openDataPanel();
    if (k === "more" || k === "less") { moreGames = k === "more"; sidebar(); }
  });
  function openDataPanel() {
    $("#modal").innerHTML = `<div class="ov"><div class="md"><h3>Data &amp; backup</h3>
      <p class="ls" style="color:var(--mu);margin:0 0 12px">Your laps are saved on this PC. A backup is written to Documents\\Lapbook every 30 seconds (one copy per day, last 14 days).</p>
      <div class="dgrid">
        <button class="b" data-act="dl"><b>Download backup</b><small>Save all your data as a file</small></button>
        <button class="b" data-act="up"><b>Load a backup</b><small>Replaces the data in the app</small></button>
        <button class="b" id="dfold"><b>Open backup folder</b><small>Documents\\Lapbook</small></button>
        <button class="b" data-act="txt"><b>Copy as text</b><small>JSON or CSV</small></button>
        ${UNDO.length ? `<button class="b" data-act="undo"><b>Undo</b><small>${UNDO.length} step${UNDO.length === 1 ? "" : "s"}</small></button>` : ""}
      </div>
      <div class="acts" style="margin-top:14px"><button class="b ghost" data-act="closem">Close</button></div></div></div>`;
    $("#dfold").onclick = () => B.openBackups();
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
  // ACC, LMU, PC2: same card for all three
  function simLive_(g) {
    const s = sim(g);
    return `<div class="game"><div class="lh"><span class="lt"><span class="dot"></span>Live · ${esc(g)}</span>${openBtn(g, s.track)}</div>
      <div class="lh"><span><b>${esc(s.track || "Waiting for track")}</b><br><span class="ls">${esc(s.car || "")}</span></span>${lapBox(g)}</div></div>`;
  }
  const stepI = (done, n) => `<i>${done ? "✓" : n}</i>`;
  function simSetup(g) {
    const s = sim(g), seen = !!s.connected || !!simWas[g], lap = !!added[g];
    if (!s.on) return `<p class="ls" style="margin:0">Live tracking for ${esc(g)} is off. Switch it on in <button class="b ghost" data-live="set">Settings</button>.</p>`;
    if (g === ACC) return `<ol class="steps">
        <li class="${s.needsSetup ? "" : "done"}">${stepI(!s.needsSetup, 1)}<span>${s.needsSetup
          ? `ACC's broadcasting interface is off${s.configFound ? "" : " (start ACC once so it creates its settings)"}. Lapbook can switch it on for you: <button class="b pri" data-live="accon">Switch on</button><br><small style="color:var(--mu)">This writes port 9000 into Documents\\Assetto Corsa Competizione\\Config\\broadcasting.json (a copy of the old file is kept). Restart ACC afterwards.</small>`
          : `ACC broadcasting is on (port ${esc(s.port)}). This is ACC's official interface for TV overlays.`}</span></li>
        <li class="${seen ? "done" : ""}">${stepI(seen, 2)}<span>Start ACC and drive out of the pits. Lapbook connects by itself.</span></li>
        <li class="${lap ? "done" : ""}">${stepI(lap, 3)}<span>Drive one full lap. It is saved with car, circuit and sectors.</span></li></ol>
        ${s.error ? `<p class="warn2" style="margin:0;color:var(--dn)">${esc(s.error)}</p>` : ""}`;
    if (g === LMU) return `<ol class="steps">
        <li class="done">${stepI(true, 1)}<span>Nothing to set up: Lapbook reads LMU's own local interface (the one its menus use, port ${esc(s.port || 6397)}).</span></li>
        <li class="${seen ? "done" : ""}">${stepI(seen, 2)}<span>Start Le Mans Ultimate and drive onto the track.</span></li>
        <li class="${lap ? "done" : ""}">${stepI(lap, 3)}<span>Drive one full lap. It is saved with car, circuit and sectors.</span></li></ol>`;
    return `<ol class="steps">
        <li class="${s.listening ? "done" : ""}">${stepI(s.listening, 1)}<span>Lapbook is ready for Project CARS 2 on port ${esc(s.port || 5606)}. If Windows asks about the firewall, allow it for private networks.</span></li>
        <li class="${seen ? "done" : ""}">${stepI(seen, 2)}<span>In Project CARS 2: Options → System:</span></li></ol>
        <div class="gset"><span>UDP Frequency</span><b>1 (fastest) to 4</b><span>UDP Protocol Version</span><b>Project CARS 2</b></div>
        <ol class="steps"><li class="${lap ? "done" : ""}">${stepI(lap, 3)}<span>Drive one full lap. It is saved with car, circuit and sectors.</span></li></ol>
        ${s.error ? `<p class="warn2" style="margin:0;color:var(--dn)">${esc(s.error)}</p>` : ""}`;
  }
  function setupBody(g) {
    if (SIMG.includes(g)) return simSetup(g);
    return g === FZ
      ? `<ol class="steps"><li class="${st.fz.listening ? "done" : ""}"><i>${st.fz.listening ? "✓" : "1"}</i><span>Lapbook is ready for Forza on port ${esc(st.fz.port || 5300)}</span></li>
         <li class="${fzWas ? "done" : ""}"><i>${fzWas ? "✓" : "2"}</i><span>Turn on Data Out in Forza with these settings:</span></li></ol>
         ${fzRows()}
         <ol class="steps"><li class="${addedFz() ? "done" : ""}"><i>${addedFz() ? "✓" : "3"}</i><span>Record a time trial: press <b>Ctrl+Shift+T</b> at the start, drive, press it again at the finish. Standing still at the start makes it a drag run. After that every run through the same start is timed by itself.</span></li></ol>
         ${st.fz.movedFrom ? `<p class="warn2" style="margin:0">Port ${st.fz.movedFrom} is used by another program, so Lapbook uses <b>${esc(st.fz.port)}</b>. Set that port in Forza.</p>` : ""}`
      : g === AC
      ? `<ol class="steps"><li class="done"><i>✓</i><span>Lapbook is ready for Assetto Corsa</span></li>
         <li class="${acWas ? "done" : ""}"><i>${acWas ? "✓" : "2"}</i><span>Start a session (for example through Content Manager). Nothing to set in the game: Lapbook connects once you are on track.</span></li>
         <li class="${added[AC] ? "done" : ""}"><i>${added[AC] ? "✓" : "3"}</i><span>Drive one full lap. It is saved by itself.</span></li></ol>${folderNote()}`
      : `<ol class="steps"><li class="${st.listening ? "done" : ""}"><i>${st.listening ? "✓" : "1"}</i><span>Lapbook is ready on port ${port()}</span></li>
         <li class="${wasLive ? "done" : ""}"><i>${wasLive ? "✓" : "2"}</i><span>Turn on UDP telemetry in F1 25 with these settings, then start a session:</span></li></ol>
         ${f1Rows()}
         <ol class="steps"><li class="${added[F1] ? "done" : ""}"><i>${added[F1] ? "✓" : "3"}</i><span>Drive one full lap. It is saved by itself.</span></li></ol>${moved()}`;
  }
  const gameLive = g => (g === F1 ? f1Live() : g === AC ? acLive() : SIMG.includes(g) ? simLive(g) : fzLive());
  // live: laps are coming in · seen: the game is running · ready: waiting for it · setup: needs one step · off
  function gameState(g) {
    if (gameLive(g)) return "live";
    if (SIMG.includes(g)) { const s = sim(g); return !s.on ? "off" : g === ACC && s.needsSetup ? "setup" : s.connected ? "seen" : g === PC2 && !s.listening ? "off" : "ready"; }
    if (g === F1) return st.listening ? "ready" : "off";
    if (g === AC) return st.ac.on ? (st.ac.connected ? "seen" : "ready") : "off";
    return st.fz.on && st.fz.listening ? "ready" : "off";
  }
  const STATE_TXT = { live: "live", seen: "game found", ready: "waiting for the game", setup: "1 step to do", off: "off" };
  const liveBody = g => (g === F1 ? f1Live_() : g === AC ? acLive_() : SIMG.includes(g) ? simLive_(g) : fzLive_());
  // the live card on the overview: what is going on right now, nothing more
  function liveCard() {
    if (st.error) {
      return `<section class="card live err" id="livecard"><div class="lh"><span class="lt"><span class="dot"></span>Live tracking needs attention</span><button class="b" data-live="set">Settings</button></div><p class="ls" style="margin:0;color:var(--dn)">${esc(st.error)}</p></section>`;
    }
    const ovRow = `<div class="lh" style="border-top:1px solid var(--ln);padding-top:10px"><span class="ls">In-game overlay · <b style="color:var(--tx)">${ovOn() ? "on" : "off"}</b> · Ctrl+Shift+O</span><span class="swb"><button class="b ghost sm" data-desk="overlay">Customise</button>${ovSwitch()}</span></div>`;
    const on = LIVE_GAMES.filter(gameLive);
    if (on.length) return `<section class="card live on" id="livecard">${on.map(liveBody).join("")}${ovRow}</section>`;
    const chips = LIVE_GAMES.map(g => { const x = gameState(g); return `<span class="gs ${x === "seen" ? "live" : x === "setup" ? "" : x}"><i></i>${g === FZ ? "Forza Horizon" : g === F1 ? g : abbr(g)}</span>`; }).join("");
    return `<section class="card live" id="livecard"><div class="lh"><span class="lt"><span class="dot"></span>${ok ? "Live tracking is ready" : "Live tracking"}</span><button class="b ${ok ? "ghost" : "pri"}" data-desk="live">${ok ? "Details" : "Set up (2 min)"}</button></div>
      <p class="ls" style="margin:0">${ok ? "Start a game and drive. Every finished lap is saved by itself." : "Lapbook can save your laps by itself while you drive. Set it up once per game."}</p>
      <div class="gsl">${chips}</div>${moved()}${lastRecapRow()}${ovRow}</section>`;
  }
  // the live tracking page: a strip with every game and its status, then the
  // card of the game you picked (and every game that is live right now)
  const fzName = () => st.fz.game || "Forza Horizon 6";
  function liveCol(g) {
    const name = g === FZ ? "Forza Horizon 5 / 6" : g, live = gameLive(g), stt = gameState(g);
    if (live) return `<section class="card live on">${liveBody(g)}</section>`;
    return `<section class="card live"><div class="lh"><span class="lt"><span class="dot"></span>${esc(name)}</span><span class="gs ${stt === "seen" ? "live" : stt}"><i></i>${STATE_TXT[stt]}</span></div>${live ? liveBody(g) : setupBody(g)}</section>`;
  }
  // what every game sends: y = yes, p = partly, n = no
  const READS = [
    ["Lap times", "saved by themselves", { F1: "y", AC: "y", ACC: "y", LMU: "y", PC2: "y", FZ: "p" }],
    ["Car and circuit", "named automatically", { F1: "y", AC: "y", ACC: "y", LMU: "y", PC2: "y", FZ: "p" }],
    ["Sectors", "S1, S2, S3", { F1: "y", AC: "p", ACC: "y", LMU: "y", PC2: "y", FZ: "n" }],
    ["Invalid laps", "track limits", { F1: "y", AC: "n", ACC: "y", LMU: "p", PC2: "y", FZ: "n" }],
    ["Live delta", "in the overlay", { F1: "y", AC: "y", ACC: "y", LMU: "y", PC2: "y", FZ: "y" }],
    ["Race position", "in the overlay", { F1: "y", AC: "n", ACC: "y", LMU: "y", PC2: "y", FZ: "n" }],
    ["Race results", "for your rating", { F1: "y", AC: "n", ACC: "n", LMU: "n", PC2: "n", FZ: "n" }],
    ["Championship", "career: all sessions, points", { F1: "y", AC: "n", ACC: "n", LMU: "n", PC2: "n", FZ: "n" }],
  ];
  const READ_TIPS = { "AC|Sectors": "Assetto Corsa sends no sectors, Lapbook uses thirds of the lap", "FZ|Lap times": "time trials and drag runs that you mark once", "FZ|Car and circuit": "you name a car once, the game sends only a number", "LMU|Invalid laps": "only if the game's interface reports it", "F1|Championship": "F1 25 career (Driver Career and My Team): practice, qualifying, sprint and race of every driver, points as in the game", "FZ|Live delta": "in time trials and drag runs" };
  function readsCard() {
    const cols = [["F1", "F1 25"], ["AC", "AC"], ["ACC", "ACC"], ["LMU", "LMU"], ["PC2", "PC2"], ["FZ", "FH5/6"]];
    const cell = (k, f, v) => `<td title="${esc(READ_TIPS[k + "|" + f] || (v === "y" ? "yes" : v === "p" ? "partly" : "no"))}"><span class="${v}"></span></td>`;
    return `<section class="card"><div class="ch"><h2>What Lapbook reads</h2><span class="mu" style="font-size:13px">hover a dot for details</span></div>
      <table class="rmx"><tr><th></th>${cols.map(c => `<th>${c[1]}</th>`).join("")}</tr>
      ${READS.map(([f, sub, m]) => `<tr><td>${f}<small>${sub}</small></td>${cols.map(c => cell(c[0], f, m[c[0]])).join("")}</tr>`).join("")}</table>
      <div class="rmk"><span><i class="y"></i>yes</span><span><i class="p"></i>partly</span><span><i class="n"></i>no</span></div></section>`;
  }
  function livePage() {
    const strip = LIVE_GAMES.map(g => {
      const stt = gameState(g), art = g === FZ ? fzName() : g;
      return `<button class="gtile ${stt} ${tab === g ? "sel" : ""}" data-live="tab" data-g="${esc(g)}" style="background:${esc(cov(art))}"><em><i></i>${STATE_TXT[stt]}</em><b>${esc(g === FZ ? "FH5 / FH6" : g === F1 ? g : abbr(g))}</b><span>${esc(g === FZ ? "Forza Horizon" : g)}</span></button>`;
    }).join("");
    const pick = LIVE_GAMES.includes(tab) ? tab : F1, cards = [pick, ...LIVE_GAMES.filter(g => g !== pick && gameLive(g))];
    return `<div class="ph"><h1>Live tracking</h1><span class="mu">Laps are saved by themselves while you drive. Pick a game to set it up.</span><span class="sp"></span><span class="swb"><span class="mu" style="font-size:14px">Overlay</span>${ovSwitch()}</span><button class="b" data-desk="overlay">Customise overlay</button><button class="b" data-live="set">Settings</button></div>
      <div class="gstrip">${strip}</div>
      <div class="lgrid" id="livePage">${cards.map(liveCol).join("")}${readsCard()}</div>
      ${st.error ? `<p class="warn2" style="color:var(--dn)">${esc(st.error)}</p>` : ""}
      <div class="ph" style="margin-top:28px"><h2 style="margin:0">Session recaps</h2><span class="mu">a summary after every session</span></div>
      <div class="card">${recaps.length ? recaps.map((r, i) => `<button class="rrow" data-live="recap" data-i="${i}"><span><b>${esc(r.track)}</b><small>${esc(r.game)} · ${esc(r.car)} · ${esc(r.date)} · ${r.laps} lap${r.laps === 1 ? "" : "s"}</small></span><span class="tm pb">${r.best ? fmt(r.best) : "–"}</span></button>`).join("") : `<p class="mu" style="margin:0">After your first session with live tracking, its recap shows up here.</p>`}</div>`;
  }

  // ---------- overview (home) ----------
  function deskHome() {
    const gs = gl(), nTr = gs.reduce((n, g) => n + D.tracks[g].length, 0), nCar = gs.reduce((n, g) => n + D.cars[g].length, 0), h = ratingHist(), a = AS;
    const shown = gs.filter(g => MAIN_GAMES.includes(g) || laps(g).length), other = gs.filter(g => !shown.includes(g));
    const tile = g => { const n = laps(g).length, t = D.tracks[g].length; return `<button class="gcov" style="background:${esc(cov(g))}" data-act="game" data-v="${esc(g)}">${esc(g)}<small>${n ? n + " lap" + (n === 1 ? "" : "s") + " · " + t + " circuit" + (t === 1 ? "" : "s") : "No laps yet"}</small></button>`; };
    // recent laps, newest first; a lap that is the circuit record gets a badge
    const recBest = {};
    D.lapTimes.forEach(l => { const k = l.game + "|" + l.track; if (!recBest[k] || l.timeInMs < recBest[k]) recBest[k] = l.timeInMs; });
    const recent = D.lapTimes.map((l, i) => [l, i]).sort((x, y) => (y[0].date || "").localeCompare(x[0].date || "") || y[1] - x[1]).slice(0, 9).map(x => x[0]);
    const L = LAST && D.tracks[LAST.g] && D.tracks[LAST.g].includes(LAST.t) ? LAST : null;
    return `<div class="ph"><h1>Overview</h1><span class="mu">${new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</span></div>
      <div class="hg">
        <div class="hcol">
          <div id="homeLive"></div>
          ${circuitsCard()}
          <section class="card"><div class="ch"><h2>Games</h2>${other.length ? `<button class="b ghost sm" data-desk="${moreGames ? "less" : "more"}" id="hmore">${moreGames ? "Show fewer" : other.length + " more"}</button>` : ""}</div>
            <div class="gg">${(moreGames ? gs : shown).map(tile).join("")}</div></section>
        </div>
        <div class="hcol">
          ${careerCard()}
          <section class="card"><div class="kpi">
            <div><b>${D.lapTimes.length}</b><span>laps</span></div><div><b>${nTr}</b><span>circuits</span></div><div><b>${nCar}</b><span>cars</span></div>
            <button data-act="driver"><b>${Math.round(h.R)}</b><span>rating ›</span></button></div>
            ${(() => { const M = milestones(); return `<button class="rank" data-act="ach"><span><b>${M.rank}</b> · ${M.tiers} of ${M.total} achievement tiers ›</span>${tierBar(M.next ? (M.tiers - M.base) / (M.next[1] - M.base) : 1, "var(--rd)")}</button>`; })()}</section>
          <section class="card"><div class="ch"><h2>Recent laps</h2><button class="b ghost sm" data-act="tool" data-v="prog">Progress ›</button></div>
            ${L ? `<button class="rrow cont" data-act="resume"><span><b>Continue: ${esc(L.t)}</b><small>${esc(L.g)} · log your next lap</small></span><span class="mu">+ Lap</span></button>` : ""}
            ${recent.map(l => { const rec = recBest[l.game + "|" + l.track] === l.timeInMs; return `<button class="rrow" data-act="gotrack" data-g="${esc(l.game)}" data-v="${esc(l.track)}"><span><b>${esc(l.track)}</b><small>${esc(l.car)}</small></span><span class="tm ${rec ? "pb" : ""}">${fmt(l.timeInMs)}<small>${rec ? "record · " : ""}${esc(shortDate(l.date))}</small></span></button>`; }).join("") || `<p class="mu" style="margin:0">No laps yet. Start a game with live tracking, or open a game and add a lap.</p>`}
          </section>
        </div>
      </div>
      ${L ? `<button class="fab" data-act="fab" title="Log a lap on ${esc(L.t)}"><b>+</b> Lap</button>` : ""}`;
  }
  home = deskHome;
  const shortDate = d => { if (!d) return ""; if (d === today()) return "today"; const t = Date.parse(d); return isFinite(t) ? new Date(t).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : d; };
  // ---------- milestones: achievements that are about driving ----------
  const TIER = [["Bronze", "#cd7f32"], ["Silver", "#c3cad5"], ["Gold", "#ffd23f"], ["Platinum", "#7fe3ff"]];
  const RANKS2 = [["Rookie", 0], ["Club racer", 4], ["Semi-pro", 10], ["Pro", 18], ["Elite", 28], ["Legend", 40]];
  function milestoneStats() {
    const L = D.lapTimes, by = {};
    L.map((l, i) => [l, i]).sort((a, b) => (a[0].date || "").localeCompare(b[0].date || "") || a[1] - b[1]).forEach(([l]) => (by[l.game + "|" + l.track] = by[l.game + "|" + l.track] || []).push(l));
    let pbs = 0, gained = 0, nearTheo = 0;
    for (const a of Object.values(by)) {
      let b = Infinity;
      a.forEach((l, i) => { if (l.timeInMs < b) { if (i) pbs++; b = l.timeInMs; } });
      if (a.length > 1 && (a[0].timeInMs - b) / a[0].timeInMs >= 0.01) gained++;
      const ws = a.filter(l => Array.isArray(l.sectors) && l.sectors.length === 3);
      if (ws.length >= 3) {
        const theo = [0, 1, 2].reduce((t, i) => t + Math.min(...ws.map(l => l.sectors[i])), 0), bl = Math.min(...ws.map(l => l.timeInMs));
        if (bl - theo <= 100) nearTheo++;
      }
    }
    // consistent sessions: one day, one circuit, one car, 5+ laps, spread under 0.4 % of the best
    const ses = {};
    L.forEach(l => (ses[l.date + "|" + l.game + "|" + l.track + "|" + l.car] = ses[l.date + "|" + l.game + "|" + l.track + "|" + l.car] || []).push(l.timeInMs));
    let steady = 0;
    for (const t of Object.values(ses)) {
      if (t.length < 5) continue;
      const b = Math.min(...t), c = t.filter(x => x <= b * 1.07);
      if (c.length < 5) continue;
      const m = c.reduce((a, x) => a + x, 0) / c.length, sd = Math.sqrt(c.reduce((a, x) => a + (x - m) ** 2, 0) / (c.length - 1));
      if (sd <= b * 0.004) steady++;
    }
    const days = [...new Set(L.map(l => l.date).filter(Boolean))].sort();
    let streak = 0, run = 0, prev = null;
    days.forEach(d => { const t = Date.parse(d); run = prev !== null && Math.round((t - prev) / 864e5) === 1 ? run + 1 : 1; prev = t; streak = Math.max(streak, run); });
    const R = D.races.filter(r => !r.dnf);
    return {
      pbs, gained, nearTheo, steady,
      wins: R.filter(r => r.finish == 1).length, podiums: R.filter(r => r.finish <= 3).length,
      places: R.reduce((a, r) => a + Math.max(0, (r.start || 0) - (r.finish || 0)), 0),
      laps: L.length, days: days.length, streak,
      circuits: Object.keys(by).length, cars: new Set(L.map(l => l.game + "|" + l.car)).size, games: new Set(L.map(l => l.game)).size,
    };
  }
  const MILESTONES = [
    ["Pace", "Personal bests", "Times you beat your own best lap on a circuit", [5, 25, 100, 250], s => s.pbs],
    ["Pace", "Found time", "Circuits where you got at least 1 % faster than your first lap", [1, 5, 15, 30], s => s.gained],
    ["Pace", "Perfect lap", "Circuits where your best lap is within 0.1 s of your theoretical best", [1, 3, 8, 15], s => s.nearTheo],
    ["Consistency", "Metronome", "Sessions of 5+ laps where your laps spread less than 0.4 %", [1, 5, 15, 40], s => s.steady],
    ["Racing", "Wins", "Races you won", [1, 5, 20, 50], s => s.wins],
    ["Racing", "Podiums", "Races you finished in the top 3", [1, 10, 30, 100], s => s.podiums],
    ["Racing", "Overtaker", "Places gained from the start, all races together", [10, 50, 150, 400], s => s.places],
    ["Dedication", "Laps", "Laps driven", [50, 250, 1000, 5000], s => s.laps],
    ["Dedication", "Driving days", "Days with at least one lap", [5, 20, 60, 150], s => s.days],
    ["Dedication", "On a roll", "Longest run of days in a row with a lap", [3, 7, 14, 30], s => s.streak],
    ["Explorer", "Circuits", "Different circuits driven", [3, 10, 25, 50], s => s.circuits],
    ["Explorer", "Garage", "Different cars driven", [3, 10, 25, 60], s => s.cars],
    ["Explorer", "Multi-sim", "Different games with laps", [1, 2, 3, 4], s => s.games],
  ];
  function milestones() {
    const s = milestoneStats();
    const list = MILESTONES.map(([cat, name, desc, t, f]) => { const v = f(s); let tier = 0; t.forEach((x, i) => { if (v >= x) tier = i + 1; }); return { cat, name, desc, t, v, tier }; });
    const tiers = list.reduce((a, m) => a + m.tier, 0);
    let ri = 0;
    RANKS2.forEach((r, i) => { if (tiers >= r[1]) ri = i; });
    const next = list.filter(m => m.tier < 4).map(m => { const lo = m.tier ? m.t[m.tier - 1] : 0, hi = m.t[m.tier]; return { ...m, frac: (m.v - lo) / (hi - lo), need: hi - m.v }; }).sort((a, b) => b.frac - a.frac).slice(0, 3);
    return { list, tiers, total: list.length * 4, rank: RANKS2[ri][0], next: RANKS2[ri + 1] || null, base: RANKS2[ri][1], up: next };
  }
  const tierBar = (frac, col) => `<span class="mbar"><i style="width:${Math.max(0, Math.min(100, frac * 100)).toFixed(0)}%;background:${col || "var(--pu)"}"></i></span>`;
  function deskAch() {
    const M = milestones();
    const toNext = M.next ? M.next[1] - M.tiers : 0;
    const card = m => {
      const lo = m.tier ? m.t[m.tier - 1] : 0, hi = m.t[Math.min(m.tier, 3)], frac = m.tier >= 4 ? 1 : (m.v - lo) / (hi - lo);
      return `<div class="mst ${m.tier ? "got" : ""}"><div class="mh"><b>${esc(m.name)}</b>${m.tier ? `<span class="mt" style="--c:${TIER[m.tier - 1][1]}">${TIER[m.tier - 1][0]}</span>` : ""}</div>
        <p>${esc(m.desc)}</p>${tierBar(frac, m.tier ? TIER[Math.min(m.tier, 3)][1] : "var(--mu)")}
        <div class="mf"><span>${m.tier >= 4 ? `${m.v} · all tiers done` : `${m.v} / ${hi} for ${TIER[m.tier][0]}`}</span><span class="pips2">${m.t.map((x, i) => `<i title="${TIER[i][0]}: ${x}" style="background:${m.tier > i ? TIER[i][1] : "var(--ln)"}"></i>`).join("")}</span></div></div>`;
    };
    const cats = [...new Set(MILESTONES.map(m => m[0]))];
    return `<div class="ph"><h1>Achievements</h1><span class="mu">Milestones for how you drive: pace, consistency, racing, dedication and variety.</span></div>
      <div class="hg">
        <div class="hcol">${cats.map(c => `<section class="card"><div class="ch"><h2>${c}</h2></div><div class="mgrid">${M.list.filter(m => m.cat === c).map(card).join("")}</div></section>`).join("")}</div>
        <div class="hcol">
          <section class="card"><span class="mu" style="font-size:13px">Your rank</span><div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px"><b style="font-size:30px">${M.rank}</b><span class="mu">${M.tiers} of ${M.total} tiers</span></div>
            ${tierBar(M.next ? (M.tiers - M.base) / (M.next[1] - M.base) : 1, "var(--rd)")}
            <p class="mu" style="margin:8px 0 0;font-size:14px">${M.next ? `${toNext} more tier${toNext === 1 ? "" : "s"} to <b style="color:var(--tx)">${M.next[0]}</b>.` : "Top rank reached."} Every tier of every milestone counts.</p>
            <div class="rlad">${RANKS2.map(r => `<span class="${M.tiers >= r[1] ? "on" : ""}"><b>${r[0]}</b><small>${r[1]} tiers</small></span>`).join("")}</div></section>
          <section class="card"><div class="ch"><h2>Up next</h2></div>${M.up.map(m => `<div class="nx"><div><b>${esc(m.name)}</b><small>${esc(m.desc)}</small></div><span>${m.need} to go for ${TIER[m.tier][0]}</span>${tierBar(m.frac, TIER[m.tier][1])}</div>`).join("") || `<p class="mu" style="margin:0">Everything done. Impressive.</p>`}</section>
        </div>
      </div>`;
  }
  achPage = deskAch;
  // the old achievement messages ("… Bronze unlocked") belong to the old system
  const baseToast = toast;
  toast = function (m, u) { return baseToast(typeof m === "string" ? m.replace(/ \| [^|]+: (Bronze|Silver|Gold|Platinum) unlocked$/, "") : m, u); };

  // small layout fixes on Lapbook's own pages
  function tidy() {
    const app = document.getElementById("app");
    if (!app) return;
    // the sidebar replaces "← Games"
    app.querySelectorAll(':scope > .back[data-act="home"]').forEach(b => b.remove());
    if (S.v === "game") {
      // search first, adding a circuit or car second
      const adds = [...app.querySelectorAll(":scope > .add")];
      if (adds.length >= 2 && adds[0].querySelector("#nt, #nc")) { adds[0].classList.add("addnew"); adds[1].after(adds[0]); }
    }
  }
  // the circuits you drove most recently, one click away
  function circuitsCard() {
    const by = {};
    D.lapTimes.forEach(l => {
      const k = l.game + "|" + l.track, b = by[k] || (by[k] = { g: l.game, t: l.track, n: 0, best: Infinity, last: "", car: "" });
      b.n++;
      if (l.timeInMs < b.best) { b.best = l.timeInMs; b.car = l.car; }
      if ((l.date || "") > b.last) b.last = l.date || "";
    });
    const list = Object.values(by).sort((a, b) => b.last.localeCompare(a.last) || b.n - a.n).slice(0, 8);
    if (!list.length) return "";
    return `<section class="card"><div class="ch"><h2>Your circuits</h2><span class="mu" style="font-size:13px">most recently driven</span></div>
      <div class="cgrid">${list.map(c => `<button class="cc" data-act="gotrack" data-g="${esc(c.g)}" data-v="${esc(c.t)}"><small>${esc(c.g)}</small><b>${esc(c.t)}</b><span class="tm pb">${fmt(c.best)}</span><small>${esc(c.car)} · ${c.n} lap${c.n === 1 ? "" : "s"} · ${esc(shortDate(c.last))}</small></button>`).join("")}</div></section>`;
  }

  // ---------- wide layout: put the page into two columns ----------
  function wide() {
    const app = document.getElementById("app");
    if (!app) return;
    app.dataset.v = S.v;
    if (app.querySelector(":scope > .wd")) return;
    const kids = [...app.children].filter(n => !n.classList.contains("top") && !n.classList.contains("fab"));
    let side = [], main = [], cls = "";
    if (S.v === "track") {
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
    main.forEach(n => c1.appendChild(n)); side.forEach(n => c2.appendChild(n)); wd.append(c1, c2);
    const top = app.querySelector(":scope > .top");
    if (top) top.after(wd); else app.prepend(wd);
  }

  function placeCard() {
    const typing = document.activeElement && /^(cname|fzcar|fzroute|fzseg)$/.test(document.activeElement.id);
    if (typing) return; // do not redraw while a name is being typed
    let html, host;
    if (S.v === "home") { host = document.getElementById("homeLive"); html = liveCard(); }
    else if (S.v === "live") { host = document.getElementById("livePage"); html = livePage(); }
    else return;
    if (!host || placeCard.last === html) return;
    placeCard.last = html;
    if (S.v === "home") host.innerHTML = html;
    else { const y = scrollY; $("#app").innerHTML = html; scrollTo(0, y); }
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
    if (k === "accon") {
      const r = await B.accEnable();
      toast(r.ok ? `ACC broadcasting switched on (port ${r.port}). Restart ACC once.` : r.error || "That did not work");
      placeCard.last = ""; placeCard();
    }
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
  render = function () {
    if (S.v === "live") { AS = asum(); $("#app").innerHTML = livePage(); }
    else baseRender();
    try { tidy(); sectorPanel(); careerExtras(); sidebar(); wide(); document.getElementById("app").dataset.v = S.v; placeCard.last = ""; placeCard(); } catch (e) { console.error(e); }
  };

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
      <div class="two"><label>UDP port<input id="tport" inputmode="numeric" value="${esc(s.port)}"></label><label>Invalid laps (F1, ACC, LMU, PC2)<select id="tinv"><option value="0" ${s.saveInvalid ? "" : "selected"}>Skip them</option><option value="1" ${s.saveInvalid ? "selected" : ""}>Save them too</option></select></label></div>
      <label>F1 25 runs on<select id="tnet"><option value="0" ${s.network ? "" : "selected"}>This PC</option><option value="1" ${s.network ? "selected" : ""}>Another device (console or second PC)</option></select></label>
      ${f1Rows()}
      <h4>F1 25 car names</h4><p class="ls" style="margin:0 0 6px;color:var(--mu)">Give a team number its own name. Laps you already drove with it are renamed too.</p>
      <div class="cn" id="cnl">${own.map(([id, n]) => `<span>Team ${esc(id)}</span><input data-team="${esc(id)}" value="${esc(n)}">`).join("")}<input id="cnid" inputmode="numeric" placeholder="Team no."><input id="cnn" placeholder="Name, for example Konnersport"></div>
      <h4>Assetto Corsa</h4>
      <label>Live tracking<select id="acon"><option value="1" ${s.acOn !== false ? "selected" : ""}>On</option><option value="0" ${s.acOn === false ? "selected" : ""}>Off</option></select></label>
      <p class="ls" style="margin:0;color:var(--mu)">Folder: ${st.ac.folder ? esc(st.ac.folder) : "not found"} <button class="b ghost" id="acpick" type="button">Choose folder</button></p>
      <h4>Assetto Corsa Competizione, Le Mans Ultimate, Project CARS 2</h4>
      <div class="two"><label>ACC<select id="accon"><option value="1" ${s.accOn !== false ? "selected" : ""}>On</option><option value="0" ${s.accOn === false ? "selected" : ""}>Off</option></select></label><label>Le Mans Ultimate<select id="lmuon"><option value="1" ${s.lmuOn !== false ? "selected" : ""}>On</option><option value="0" ${s.lmuOn === false ? "selected" : ""}>Off</option></select></label></div>
      <div class="two"><label>Project CARS 2<select id="pc2on"><option value="1" ${s.pc2On !== false ? "selected" : ""}>On</option><option value="0" ${s.pc2On === false ? "selected" : ""}>Off</option></select></label><label>Project CARS 2 port<input id="pc2port" inputmode="numeric" value="${esc(s.pc2Port || 5606)}"></label></div>
      <p class="ls" style="margin:0;color:var(--mu)">Invalid laps follow the setting above. ACC reads its port from broadcasting.json${sim(ACC).file ? ` (${esc(sim(ACC).file)})` : ""}.</p>
      <h4>Forza Horizon</h4>
      <div class="two"><label>Live tracking<select id="fzon"><option value="1" ${s.forzaOn !== false ? "selected" : ""}>On</option><option value="0" ${s.forzaOn === false ? "selected" : ""}>Off</option></select></label><label>Data Out port<input id="fzport" inputmode="numeric" value="${esc(s.forzaPort || 5300)}"></label></div>
      <label>Normal races<select id="fzrl"><option value="0" ${s.forzaRaceLaps ? "" : "selected"}>Do not save their laps</option><option value="1" ${s.forzaRaceLaps ? "selected" : ""}>Save every lap of every race</option></select></label>
      <label>Game<select id="fzgame">${[["auto", "Find out by itself"], ["Forza Horizon 6", "Forza Horizon 6"], ["Forza Horizon 5", "Forza Horizon 5"]].map(([v, n]) => `<option value="${v}" ${(s.forzaGame || "auto") === v ? "selected" : ""}>${n}</option>`).join("")}</select></label>
      <div class="cn" id="fzl">${fzl}</div>
      <h4>In-game overlay</h4><p class="ls" style="margin:0;color:var(--mu)">Position, size and style: <button class="b ghost" id="ovset" type="button">Overlay settings</button></p>
      <p class="ls" style="color:var(--mu)">This session: ${added[F1]} F1 25 and ${added[AC]} Assetto Corsa lap${added[AC] === 1 ? "" : "s"} saved. Lapbook ${esc(info.version)}.</p>
      <div class="acts"><button class="b pri" id="tsave" type="button">Save</button><button class="b" id="tfold" type="button">Open backup folder</button><button class="b ghost" data-act="closem">Close</button></div></div></div>`;
    $("#ovset").onclick = () => openOverlayPanel();
    $("#acpick").onclick = async () => { const d = await B.pickACFolder(); if (d) { await B.setACFolder(d); openPanel(); } };
    $("#tsave").onclick = async () => {
      let n0 = 0;
      st.settings = await B.setSettings({ port: Number($("#tport").value), saveInvalid: $("#tinv").value === "1", network: $("#tnet").value === "1", acOn: $("#acon").value === "1" });
      await B.setSettings({ port: Number($("#tport").value), saveInvalid: $("#tinv").value === "1", network: $("#tnet").value === "1", acOn: $("#acon").value === "1", forzaOn: $("#fzon").value === "1", forzaPort: Number($("#fzport").value), forzaGame: $("#fzgame").value, forzaRaceLaps: $("#fzrl").value === "1", accOn: $("#accon").value === "1", lmuOn: $("#lmuon").value === "1", pc2On: $("#pc2on").value === "1", pc2Port: Number($("#pc2port").value) });
      for (const i of document.querySelectorAll("#fzl [data-fzseg]")) { const r = await B.forzaNameSegment(i.dataset.g, i.dataset.fzseg, i.value); if (r.ok && !r.deleted) n0 += renameTrack(i.dataset.g, r.old, r.name); }
      for (const i of document.querySelectorAll("#fzl [data-fzcar]")) { const r = await B.forzaNameCar(i.dataset.fzcar, i.value); if (r.ok) for (const g of Object.keys(D.tracks).filter(isFz)) n0 += renameCar(g, r.old, r.name); }
      for (const i of document.querySelectorAll("#fzl [data-fzroute]")) { const r = await B.forzaNameRoute(i.dataset.g, i.dataset.fzroute, i.value); if (r.ok) n0 += renameTrack(i.dataset.g, r.old, r.name); }
      if (n0) save();
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
      const on = isFz(G) ? fzLive() : gameLive(G);
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
    const rec = { id: uid(), game: G, track: r.track, date: day, car: r.car, laps: r.laps || 1, start, finish, field, strength: 0, weather: r.weather || "sun", condition: { rain: "wet", storm: "wet", light_rain: "damp" }[r.weather] || "green", tire: "", dnf: !!r.dnf, notes: [r.career && KIND[r.career.kind] && /^Race/.test(r.session) ? KIND[r.career.kind] : r.session, r.pits ? r.pits + " stop" + (r.pits > 1 ? "s" : "") : "", "auto"].filter(Boolean).join(" · ") };
    // a career race belongs to its round, so the rating uses the real opponents
    const cr = r.career && (r.career.kind === "race" || r.career.kind === "sprint") ? careerOf(r.career.season) : null;
    const crd = cr && cr.calendar.find(x => x.auto === roundKey(r.career));
    if (crd) { rec.champ = cr.id; rec.round = crd.id; crd.raceId = rec.id; }
    D.races.push(rec);
    if (!D.tracks[G].includes(r.track)) D.tracks[G].push(r.track);
    if (!D.cars[G].includes(r.car)) D.cars[G].push(r.car);
    save();
    refresh();
    const d = ratingHist().R - h0;
    if (crd) {
      const st2 = standings(cr), me = st2.ds.findIndex(x => x.d.me);
      toast(`${r.career.kind === "sprint" ? "Sprint" : "Race"} saved: ${r.dnf ? "DNF" : "P" + finish} at ${r.track} · P${me + 1} in the championship with ${me >= 0 ? st2.ds[me].pts : 0} pts · rating ${d >= 0 ? "+" : ""}${d.toFixed(1)}`);
    } else toast(`Race saved: ${r.dnf ? "DNF" : "P" + finish} from P${start} at ${r.track}, rating ${d >= 0 ? "+" : ""}${d.toFixed(1)}`);
  });

  // ---------- F1 25 career: the season builds itself from the game's results ----------
  // F1 25 sends the full result of every session (all cars, with the points of that
  // session). One championship per career season, one round per race weekend, the
  // sprint as its own round. The standings add up the game's own points.
  const KIND = { practice: "Practice", qualifying: "Qualifying", sprintShootout: "Sprint Shootout", sprint: "Sprint", race: "Race" };
  const KIND_ORDER = ["practice", "sprintShootout", "sprint", "qualifying", "race"];
  const careerOf = season => D.championships.find(c => c.auto && c.auto.season === season);
  const careers = () => D.championships.filter(c => c.auto && c.auto.season);
  const roundKey = m => String(m.weekend) + (m.kind === "sprint" || m.kind === "sprintShootout" ? ":S" : "");
  const idOf = (c, key) => { const x = alld(c).find(y => y.d.auto === key); return x ? x.d.id : ""; };
  function careerChamp(m) {
    let c = careerOf(m.season), fresh = false;
    if (!c) {
      c = { id: uid(), name: `F1 25 ${m.mode} · ${new Date().toLocaleDateString(undefined, { month: "short", year: "numeric" })}`, type: "team", game: F1, pts: "f1", calendar: [], results: {}, points: {}, teams: [], auto: { season: m.season, mode: m.mode, started: today() } };
      D.championships.push(c);
      fresh = true;
    }
    c.points = c.points || {};
    for (const r of m.cars) {
      let t = c.teams.find(x => x.auto === r.teamId);
      if (!t) { t = { id: uid(), name: r.team || "Team", cars: [], drivers: [], auto: r.teamId }; c.teams.push(t); }
      if (r.car && !t.cars.includes(r.car)) t.cars.push(r.car);
      if (r.car && !D.cars[F1].includes(r.car)) D.cars[F1].push(r.car);
      let x = alld(c).find(y => y.d.auto === r.key);
      // you keep one entry even if your name in the game changes
      if (!x && r.me) { x = alld(c).find(y => y.d.me); if (x) x.d.auto = r.key; }
      if (!x) t.drivers.push({ id: uid(), name: r.name || (r.me ? "You" : "Driver"), car: r.car, rating: RSTART, auto: r.key, me: !!r.me });
      else { if (r.car) x.d.car = r.car; if (!r.me && r.name) x.d.name = r.name; }
      if (r.me) t.mine = true;
    }
    return { c, fresh };
  }
  function careerRound(c, m) {
    const key = roundKey(m), sprint = key.endsWith(":S");
    let rd = c.calendar.find(x => x.auto === key);
    if (!rd) {
      rd = { id: uid(), track: m.track, date: today(), laps: "", auto: key, sessions: {} };
      if (sprint) rd.sprint = true;
      // the sprint goes in front of its Grand Prix
      const gp = sprint ? c.calendar.findIndex(x => x.auto === String(m.weekend)) : -1;
      if (gp >= 0) c.calendar.splice(gp, 0, rd); else c.calendar.push(rd);
    }
    return rd;
  }
  function onCareer(m) {
    if (!m || !Array.isArray(m.cars) || !m.cars.length || !m.season || !KIND[m.kind]) return;
    const { c, fresh } = careerChamp(m), rd = careerRound(c, m);
    rd.sessions = rd.sessions || {};
    rd.sessions[m.kind === "race" || m.kind === "sprint" ? KIND[m.kind] : m.session || KIND[m.kind]] = { kind: m.kind, at: Date.now(), source: m.source, rows: m.cars.map(r => ({ id: idOf(c, r.key), pos: r.position, grid: r.grid, pts: r.points, best: r.best, status: r.status })) };
    if (m.kind === "race" || m.kind === "sprint") {
      const res = (c.results[rd.id] = {}), pts = (c.points[rd.id] = {});
      m.cars.forEach(r => { const id = idOf(c, r.key); if (id) { res[id] = r.position; pts[id] = r.points; } });
      const me = m.cars.find(r => r.me);
      if (me) rd.laps = me.laps || rd.laps;
    }
    if (!D.tracks[F1].includes(m.track)) D.tracks[F1].push(m.track);
    save();
    refresh();
    if (fresh) askStart(c);
    else if (m.kind !== "race" && m.kind !== "sprint") { const me = m.cars.find(r => r.me); if (me) toast(`${m.session || KIND[m.kind]} saved: P${me.position} at ${m.track}`); }
  }
  if (B.onClassification) B.onClassification(onCareer);

  // a season that was already running: copy the points from the game once
  function askStart(c) {
    if (c.base || $("#modal").innerHTML) { toast("New F1 25 career season found: " + c.name); return; }
    $("#modal").innerHTML = `<div class="ov"><div class="md"><h3>New F1 25 career season</h3>
      <p class="ls" style="color:var(--mu);margin:0 0 12px">Lapbook builds the championship from every session you drive: practice, qualifying, sprint and race, with the points from the game. Is this the first race weekend of the season?</p>
      <div class="dgrid"><button class="b" data-desk="cstart" data-id="${esc(c.id)}"><b>Yes, start at zero</b><small>The table starts empty</small></button>
      <button class="b" data-desk="cbase" data-id="${esc(c.id)}"><b>No, the season is running</b><small>Copy the current points from the game once</small></button></div>
      <div class="acts" style="margin-top:14px"><button class="b ghost" data-act="closem">Later</button></div></div></div>`;
  }
  function openBase(c) {
    const b = c.base || {}, rows = c.teams.flatMap(t => t.drivers.map(d => ({ d, t })));
    $("#modal").innerHTML = `<div class="ov"><div class="md"><h3>Standings before Lapbook</h3>
      <p class="ls" style="color:var(--mu);margin:0 0 12px">Type in the points every driver had in the game before Lapbook started counting (Career → Standings in F1 25). Leave a field empty for 0. Lapbook adds every new session on top.</p>
      <div class="cn" style="grid-template-columns:1fr 1fr 80px">${rows.map(({ d, t }) => `<span${d.me ? ' style="color:var(--pu);font-weight:600"' : ""}>${esc(d.name)}</span><span class="mu" style="font-size:13px">${esc(t.name)}</span><input data-base="${esc(d.id)}" inputmode="numeric" value="${b[d.id] ? esc(b[d.id]) : ""}" placeholder="0">`).join("")}</div>
      <label style="margin-top:10px">Rounds already driven before Lapbook<input id="cdone" inputmode="numeric" value="${esc((c.auto && c.auto.before) || "")}" placeholder="0"></label>
      <div class="acts" style="margin-top:14px"><button class="b pri" data-desk="cbasesave" data-id="${esc(c.id)}">Save standings</button><button class="b ghost" data-act="closem">Cancel</button></div></div></div>`;
  }
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-desk]");
    if (!t) return;
    const k = t.dataset.desk, c = t.dataset.id && cc2(t.dataset.id);
    if (k === "cstart" && c) { c.base = {}; save(); $("#modal").innerHTML = ""; toast("Championship started. Every session is added by itself."); refresh(); }
    if (k === "cbase" && c) openBase(c);
    if (k === "cbasesave" && c) {
      const b = {};
      document.querySelectorAll("[data-base]").forEach(i => { const v = Math.round(Number(i.value)); if (v > 0) b[i.dataset.base] = v; });
      c.base = b;
      c.auto.before = Math.max(0, Math.round(Number(($("#cdone") || {}).value) || 0));
      save(); $("#modal").innerHTML = ""; refresh();
      const st2 = standings(c), me = st2.ds.findIndex(x => x.d.me);
      toast(`Standings saved${me >= 0 ? `: you are P${me + 1} with ${st2.ds[me].pts} pts` : ""}`);
    }
  });

  // overview: where you stand in the season
  function careerCard() {
    const c = careers().sort((a, b) => (b.auto.started || "").localeCompare(a.auto.started || ""))[0];
    if (!c) return "";
    const st2 = standings(c), i = st2.ds.findIndex(x => x.d.me), me = st2.ds[i], lead = st2.ds[0];
    const done = c.calendar.filter(rd => c.results[rd.id] && !rd.sprint).length + ((c.auto && c.auto.before) || 0), last = [...c.calendar].reverse().find(rd => rd.sessions && Object.keys(rd.sessions).length);
    const gap = me && lead && lead !== me ? lead.pts - me.pts : 0;
    return `<section class="card"><div class="ch"><h2>F1 25 Career</h2><button class="b ghost sm" data-act="champ" data-v="${esc(c.id)}">Standings ›</button></div>
      <div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px"><b style="font-size:34px;line-height:1">${me ? "P" + (i + 1) : "–"}</b><span style="text-align:right"><b style="font-size:22px">${me ? me.pts : 0}</b> <span class="mu">pts</span><br><span class="mu" style="font-size:13px">${me && lead && lead !== me ? `${gap} behind ${esc(lead.d.name)}` : me ? "leading the championship" : ""}</span></span></div>
      <div class="mu" style="font-size:13px;margin-top:8px">${esc(c.auto.mode || "")} · ${done} race${done === 1 ? "" : "s"}${last ? ` · last: ${esc(last.track)}${last.sprint ? " sprint" : ""}` : ""}</div>
      ${c.base ? "" : `<button class="b sm" data-desk="cbase" data-id="${esc(c.id)}" style="margin-top:10px">Enter the current standings</button>`}</section>`;
  }
  // championship page: a note and the sessions of every round
  const NICE_KIND = { practice: "FP", qualifying: "Q", sprintShootout: "SQ", sprint: "Sprint", race: "Race" };
  function careerExtras() {
    if (S.v !== "champ") return;
    const c = cc2(S.cid), app = document.getElementById("app");
    if (!c || !c.auto || !app || app.querySelector("#cauto")) return;
    const tabs = app.querySelector(".tabs");
    if (tabs) tabs.insertAdjacentHTML("afterend", `<div id="cauto" class="panel" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><span class="mu" style="font-size:14px"><b style="color:var(--tx)">Filled in by F1 25.</b> Practice, qualifying, sprint and race results come in by themselves, points as in the game.${c.auto.before ? ` Includes your standings from ${c.auto.before} earlier round${c.auto.before === 1 ? "" : "s"}.` : ""}</span><button class="b ghost sm" data-desk="cbase" data-id="${esc(c.id)}">${c.base && Object.keys(c.base).length ? "Edit starting standings" : "Enter starting standings"}</button></div>`);
    if (S.ctab !== "calendar") return;
    const names = {};
    alld(c).forEach(x => (names[x.d.id] = x));
    [...app.querySelectorAll(".ac")].forEach((el, i) => {
      const rd = c.calendar[i];
      if (!rd || !rd.sessions || !Object.keys(rd.sessions).length) return;
      const list = Object.entries(rd.sessions).sort((a, b) => KIND_ORDER.indexOf(a[1].kind) - KIND_ORDER.indexOf(b[1].kind) || a[1].at - b[1].at);
      const ah = el.querySelector(".ah span");
      if (ah && rd.sprint) ah.textContent += " · Sprint";
      el.insertAdjacentHTML("beforeend", `<div class="csess">${list.map(([n, x]) => {
        const mine = x.rows.find(r => names[r.id] && names[r.id].d.me);
        return `<details><summary><b>${esc(n)}</b>${mine ? `<span>P${mine.pos}${x.kind === "race" || x.kind === "sprint" ? ` · ${mine.pts} pts` : ""}</span>` : ""}</summary>
          <div class="cst">${x.rows.map(r => { const w = names[r.id]; return `<span class="${w && w.d.me ? "me" : ""}">${r.pos}</span><span class="${w && w.d.me ? "me" : ""}">${esc(w ? w.d.name : "?")}<small>${esc(w ? w.t.name : "")}</small></span><span>${r.best ? fmt(r.best) : "–"}</span><span>${x.kind === "race" || x.kind === "sprint" ? (r.status || (r.grid ? "from P" + r.grid : "")) : ""}</span><b>${x.kind === "race" || x.kind === "sprint" ? r.pts : ""}</b>`; }).join("")}</div></details>`;
      }).join("")}</div>`);
    });
  }

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
      <p class="ls" style="margin:8px 0 0;color:var(--mu)">Theoretical best: <b style="color:var(--tx)">${fmt(theo)}</b>${bl.timeInMs > theo ? `, ${((bl.timeInMs - theo) / 1000).toFixed(3)} s quicker than your best lap with sector times` : ""}.</p>
      ${lossBars(bl, bs, split)}</div></div>`;
    const sb = [...document.querySelectorAll("#app .bh")].find(n => /^Scoreboard/.test(n.textContent.trim()));
    if (sb) sb.insertAdjacentHTML("beforebegin", html);
  }

  // where the best lap loses time against your best sectors, as bars
  function lossBars(bl, bs, split) {
    const loss = [0, 1, 2].map(i => bl.sectors[i] - bs[i].sectors[i]), mx = Math.max(...loss, 1);
    if (loss.every(x => x <= 0)) return `<p class="ls" style="margin:10px 0 0;color:var(--pu)">Your best lap already has all your best ${split ? "thirds" : "sectors"}.</p>`;
    return `<p class="ls" style="margin:12px 0 0;color:var(--tx)"><b>Where your best lap loses time</b></p><div class="sl" style="margin-top:6px">${loss.map((x, i) => `<span>${split ? ["1st", "2nd", "3rd"][i] : "S" + (i + 1)}</span><span class="bar"><i class="${x <= 0 ? "z" : ""}" style="width:${x <= 0 ? 4 : Math.max(4, (x / mx) * 100).toFixed(0)}%"></i></span><b style="color:${x <= 0 ? "var(--pu)" : "var(--tx)"}">${x <= 0 ? "best" : "+" + (x / 1000).toFixed(3)}</b>`).join("")}</div>`;
  }

  // ---------- overlay data: what the in-game overlay shows ----------
  let lastGame = "";
  function overlayFeed() {
    const g = f1Live() ? F1 : acLive() ? AC : SIMG.find(simLive) || (fzLive() ? st.fz.game : lastGame);
    if (!g) return B.overlayData({});
    const fzTrack = st.fz.run ? st.fz.run.name : st.fz.recording ? "Recording time trial" : st.fz.lastSegment ? st.fz.lastSegment.name : st.fz.near ? st.fz.near.name : st.fz.lastRoute ? st.fz.lastRoute.name : "";
    const track = g === F1 ? (st.info || {}).track : isFz(g) ? fzTrack : SIMG.includes(g) ? sim(g).track : st.ac.track, car = g === F1 ? (st.info || {}).car : isFz(g) ? st.fz.car : SIMG.includes(g) ? sim(g).car : st.ac.car;
    if (!track) return B.overlayData({ game: g, live: isFz(g) ? fzLive() : gameLive(g) });
    const all = D.lapTimes.filter(l => l.game === g && l.track === track), mine = all.filter(l => l.car === car);
    const rec = best(all), b = best(mine), lastL = mine[mine.length - 1], prev = best(mine.slice(0, -1));
    B.overlayData({
      game: g, live: isFz(g) ? fzLive() : gameLive(g), track, car,
      last: lastGame === g && lastL ? lastL.timeInMs : 0, prevBest: prev ? prev.timeInMs : 0,
      best: b ? b.timeInMs : 0, record: rec ? rec.timeInMs : 0, recordCar: rec && rec.car !== car ? rec.car : "", laps: added[g],
    });
  }

  // ---------- overlay panel: on/off, style, size, position ----------
  async function openOverlayPanel() {
    const o = await B.getOverlay();
    st.settings.overlay = o;
    header();
    const chip = (attr, v, label, on) => `<button class="chip ${on ? "on" : ""}" data-ov="${attr}" data-v="${v}">${label}</button>`;
    const grid = ["tl", "tc", "tr", "ml", "mc", "mr", "bl", "bc", "br"];
    const sh = { head: true, delta: true, sectors: true, foot: true, position: true, deltaBar: false, ...(o.show || {}) };
    const at = o.bounds ? "" : o.anchor;
    $("#modal").innerHTML = `<div class="ov"><div class="md" id="ovp"><h3>In-game overlay</h3>
      <div class="lh" style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin:4px 0 12px"><span class="ls" style="color:var(--mu)">Shows over the game in <b style="color:var(--tx)">borderless / windowed fullscreen</b>. Shortcut: Ctrl+Shift+O.</span>
        <span class="swb"><b style="font-size:14px">${o.on ? "On" : "Off"}</b><span class="sw ${o.on ? "on" : ""}" data-ov="on" data-v="${o.on ? 0 : 1}" role="switch" aria-checked="${!!o.on}"></span></span></div>
      <div class="ovprev" title="Preview with example data"><iframe id="ovpf" src="overlay.html" width="${(o.size || {}).width || 440}" height="${(o.size || {}).height || 190}" tabindex="-1"></iframe></div>
      <div class="ovcols"><div>
      <h4>Style</h4><div class="chips wrapc">${chip("layout", "clean", "Clean: time, delta, sectors, best and last", o.layout !== "compact")}${chip("layout", "compact", "Compact: time and delta only", o.layout === "compact")}</div>
      ${o.layout !== "compact" ? `<h4>Show</h4><div class="chips wrapc">${[["head", "Circuit and car"], ["position", "Race position"], ["delta", "Delta"], ["sectors", "Sectors"], ["foot", "Best and last lap"]].map(([k2, n]) => chip("show", k2, (sh[k2] ? "✓ " : "") + n, sh[k2])).join("")}</div>` : `<h4>Show</h4><div class="chips wrapc">${chip("show", "delta", (sh.delta ? "✓ " : "") + "Delta", sh.delta)}</div>`}
      <h4>Delta</h4><div class="chips wrapc">${chip("dstyle", "num", "Number", !sh.deltaBar)}${chip("dstyle", "bar", "Number and bar", sh.deltaBar)}</div>
      <h4>Accent</h4><div class="chips wrapc">${[["team", "Team colour"], ["red", "Lapbook red"], ["white", "White"], ["none", "None"]].map(([v, n]) => chip("accent", v, n, (o.accent || "team") === v)).join("")}</div>
      <h4>Size</h4><div class="chips wrapc">${[[0.9, "S"], [1.15, "M"], [1.4, "L"], [1.75, "XL"]].map(([v, n]) => chip("scale", v, n, Math.abs((o.scale || 1) - v) < 0.01)).join("")}</div>
      <h4>Background</h4><div class="chips wrapc">${[[0.6, "See-through"], [0.86, "Normal"], [0.97, "Solid"]].map(([v, n]) => chip("opacity", v, n, Math.abs((o.opacity || 0.86) - v) < 0.01)).join("")}</div>
      </div><div>
      <h4>Position</h4>
      <div style="display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start">
        <div class="ovgrid">${grid.map(g => `<button class="${at === g ? "on" : ""}" data-ov="anchor" data-v="${g}" title="${g}"><i></i></button>`).join("")}</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <div class="ovnudge"><span></span><button data-ov="nudge" data-v="0,-20" title="Up">↑</button><span></span><button data-ov="nudge" data-v="-20,0" title="Left">←</button><button data-ov="nudge" data-v="0,20" title="Down">↓</button><button data-ov="nudge" data-v="20,0" title="Right">→</button></div>
          <span class="ls" style="color:var(--mu);max-width:280px">Pick a corner, then fine-tune with the arrows.</span>
        </div>
      </div>
      ${o.displays && o.displays.length > 1 ? `<label style="margin-top:10px">Screen<select id="ovdisp">${o.displays.map(x => `<option value="${x.id}" ${x.id === o.display ? "selected" : ""}>${esc(x.label)}</option>`).join("")}</select></label>` : ""}
      <div class="panel" style="margin:12px 0 0"><b>Move it while you drive</b><p class="ls" style="margin:6px 0 0;color:var(--mu)">Press <b style="color:var(--tx)">Ctrl+Shift+L</b> in the game. The overlay gets a red frame. Drag it with the mouse or press <b style="color:var(--tx)">Ctrl+Shift+arrow keys</b>. Press <b style="color:var(--tx)">Ctrl+Shift+L</b> again to lock it, then clicks go to the game again.</p>
        <button class="b" data-ov="locked" data-v="${o.locked ? 0 : 1}" style="margin-top:8px">${o.locked ? "Unlock to drag with the mouse" : "Lock it"}</button></div>
      </div></div>
      <div class="acts" style="margin-top:12px"><button class="b ghost" data-act="closem">Close</button></div></div></div>`;
    // the preview is the real overlay page, fed with example data
    const pf = $("#ovpf");
    if (pf) pf.onload = () => pf.contentWindow.postMessage({
      cfg: { ...o, locked: true },
      d: { game: "F1 25", live: true, track: "Monza", car: "McLaren MCL40", best: 80123, last: 80456, prevBest: 80250 },
      live: { game: "F1 25", t: 41234, delta: -123, sectors: [{ t: 26123, c: "purple" }, { t: 15111, c: "green" }, { t: 0 }], position: 3, cars: 20 },
    }, "*");
    const dsel = $("#ovdisp");
    if (dsel) dsel.onchange = async () => { await B.setOverlay({ on: true, display: Number(dsel.value) }); openOverlayPanel(); };
  }
  document.addEventListener("click", async e => {
    const t = e.target.closest("[data-ov]");
    if (!t) return;
    e.stopPropagation();
    const k = t.dataset.ov, v = t.dataset.v, next = {};
    if (k === "on") next.on = v === "1";
    else if (k === "locked") next.locked = v === "1";
    else if (k === "layout") next.layout = v;
    else if (k === "scale" || k === "opacity") next[k] = Number(v);
    else if (k === "anchor") next.anchor = v;
    else if (k === "show") { const cur = (st.settings.overlay && st.settings.overlay.show) || {}; next.show = { [v]: cur[v] === false }; }
    else if (k === "dstyle") next.show = { deltaBar: v === "bar" };
    else if (k === "accent") next.accent = v;
    else if (k === "nudge") next.nudge = v.split(",").map(Number);
    if (k !== "on") next.on = true; // changing it shows it
    st.settings.overlay = await B.setOverlay(next);
    openOverlayPanel();
  }, true);

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
    st = { ...st, ...s, ac: { ...st.ac, ...(s.ac || {}) }, fz: { ...st.fz, ...(s.fz || {}) }, sims: s.sims || st.sims || {} };
    if (fzLive() && !fzWas) { fzWas = true; toast(st.fz.game + " connected. Race laps are saved automatically."); }
    if (f1Live() && !wasLive) { wasLive = true; toast("F1 25 connected. Laps are saved automatically."); }
    if (acLive() && !acWas) { acWas = true; toast("Assetto Corsa connected. Laps are saved automatically."); }
    for (const g of SIMG) if (sim(g).connected && !simWas[g]) { simWas[g] = true; toast(g + " connected. Laps are saved automatically."); }
    header(); placeCard(); overlayFeed();
  });
  B.onSkipped(l => { skipped++; placeCard.last = ""; placeCard(); toast(`${l && l.game && l.game !== F1 ? abbr(l.game) : "F1 25"}: invalid lap not saved`); });
  B.onLap(l => {
    const G = l.game === AC || SIMG.includes(l.game) ? l.game : isFz(l.game) ? l.game : F1;
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
    else if (SIMG.includes(G)) Object.assign(lap, { weather: "", condition: "", tire: "", notes: [l.session, l.carClass, l.valid ? "" : "invalid", "auto"].filter(Boolean).join(" · ") });
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
    toast(`${G === F1 ? "F1 25" : abbr(G)} · ${l.track}: ${fmt(ms)}` + (rec ? (prev ? `, new record by ${gp(prev.timeInMs - ms)}` : ", first lap here") : `, +${gp(ms - prev.timeInMs)} to record`) + (l.valid ? "" : " (invalid)"));
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
