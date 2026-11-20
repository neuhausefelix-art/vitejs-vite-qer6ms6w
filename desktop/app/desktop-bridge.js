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
  /* overlay settings */
  #ovp{max-width:1320px;width:min(1320px,96vw);padding:0;max-height:92vh;overflow:auto;border-radius:16px;background:var(--sf)}
  .oph{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 24px;border-bottom:1px solid var(--ln);background:var(--sf)}
  .oph h3{margin:0;font-size:20px}.oph p{margin:2px 0 0;font-size:13px;color:var(--mu)}.oph p b{color:var(--tx);font-weight:600}
  .oph-r{display:flex;align-items:center;gap:14px}.oph-r .swb b{font-size:14px;min-width:24px;text-align:right}
  .ox{width:34px;height:34px;border-radius:50%;border:1px solid var(--ln);background:var(--sf2);color:var(--tx);cursor:pointer;font-size:15px}.ox:hover{border-color:var(--mu)}
  .kbd{display:inline-block;font:600 11.5px/1 ui-monospace,monospace;padding:4px 7px;border-radius:6px;background:var(--sf2);border:1px solid var(--ln);border-bottom-width:2px;color:var(--tx);white-space:nowrap}
  .opg{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:24px;padding:22px 24px 26px;align-items:start}
  @media(max-width:1000px){.opg{grid-template-columns:1fr}}
  .opl{position:sticky;top:86px;display:flex;flex-direction:column;gap:14px}
  .ovstage{position:relative;height:300px;border-radius:14px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:
    linear-gradient(176deg,transparent 64%,#e8e8e8 64.4%,#e8e8e8 65.2%,transparent 65.6%),
    linear-gradient(184deg,transparent 70%,#c22 70.3%,#c22 71%,#fff 71%,#fff 71.7%,transparent 72%),
    linear-gradient(180deg,#3a5f8f 0%,#86a7c8 46%,#cfd9e2 52%,#4b5a3c 52.4%,#2f3a29 66%,#3a3a3e 66.2%,#2a2a2e 100%)}
  .ovstage:after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 50% 120%,rgba(0,0,0,.55),transparent 60%);pointer-events:none}
  .ovwrap{position:relative;z-index:1}.ovwrap iframe{border:0;background:transparent;display:block;transform-origin:0 0;pointer-events:none}
  .ovtag{position:absolute;left:12px;bottom:10px;z-index:1;font-size:11.5px;color:#fff;background:#0008;border-radius:999px;padding:3px 10px}
  .opc{background:var(--sf2);border-radius:12px;padding:14px 16px}
  .opc h5,.ops h5{margin:0 0 10px;font-size:11.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--mu)}
  .posrow{display:flex;gap:18px;align-items:center;flex-wrap:wrap}.posside{display:flex;flex-direction:column;gap:8px}.posside small{color:var(--mu);font-size:12.5px;max-width:230px}
  .ovmon{position:relative;width:216px;aspect-ratio:16/9;border:2px solid var(--ln);border-radius:8px;background:linear-gradient(180deg,#1d2430,#111418);display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);padding:4px;gap:2px;margin-bottom:10px}
  .ovmon button{border:0;background:none;border-radius:4px;cursor:pointer;display:flex;padding:5px}.ovmon button:hover{background:#ffffff14}
  .ovmon button i{width:26px;height:9px;border-radius:2px;background:#ffffff26}.ovmon button.on i{background:var(--rd);box-shadow:0 0 8px var(--rd)}
  .ovmon .c-tl,.ovmon .c-ml,.ovmon .c-bl{justify-content:flex-start}.ovmon .c-tc,.ovmon .c-mc,.ovmon .c-bc{justify-content:center}.ovmon .c-tr,.ovmon .c-mr,.ovmon .c-br{justify-content:flex-end}
  .ovmon .c-tl,.ovmon .c-tc,.ovmon .c-tr{align-items:flex-start}.ovmon .c-ml,.ovmon .c-mc,.ovmon .c-mr{align-items:center}.ovmon .c-bl,.ovmon .c-bc,.ovmon .c-br{align-items:flex-end}
  .ovstand{position:absolute;left:50%;bottom:-12px;width:46px;height:8px;margin-left:-23px;border-radius:0 0 6px 6px;background:var(--ln)}
  .ovnudge{display:grid;grid-template-columns:repeat(3,38px);gap:4px}.ovnudge button{height:34px;border:1px solid var(--ln);border-radius:8px;background:var(--sf);color:var(--tx);cursor:pointer;font-size:15px}.ovnudge button:hover{border-color:var(--mu)}
  .osel{margin-top:10px}
  .okeys{margin:0 0 12px;padding:0;list-style:none;display:flex;flex-direction:column;gap:7px;font-size:13.5px;color:var(--mu)}.okeys .kbd{margin-right:4px}
  .opr{display:flex;flex-direction:column;gap:22px}
  .ops.two{display:grid;grid-template-columns:1fr 1fr;gap:18px}
  .ostg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}@media(max-width:1300px){.ostg{grid-template-columns:repeat(2,minmax(0,1fr))}}
  .stc{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:8px;border:1.5px solid var(--ln);border-radius:12px;background:var(--sf2);color:var(--tx);font:inherit;text-align:left;cursor:pointer;transition:border-color .12s,transform .12s}
  .stc:hover{border-color:var(--mu);transform:translateY(-1px)}.stc.on{border-color:var(--rd);box-shadow:0 0 0 1px var(--rd)}
  .stc b{font-size:14px;margin:6px 2px 0}.stc small{font-size:12px;color:var(--mu);margin:0 2px 2px}
  .stt{display:flex;align-items:center;justify-content:center;width:100%;height:92px;border-radius:8px;overflow:hidden;background:linear-gradient(180deg,#2c4466 0%,#5d7c9c 50%,#2d3727 51%,#1b2018 100%)}
  .stw{display:block;position:relative;overflow:hidden}.stw iframe{border:0;background:transparent;display:block;transform-origin:0 0;pointer-events:none}
  .otl{display:flex;flex-direction:column;background:var(--sf2);border-radius:12px;padding:2px 14px}
  .otr{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-top:1px solid var(--ln)}.otr:first-child{border-top:0}
  .otr b{display:block;font-size:14.5px;font-weight:600}.otr small{display:block;font-size:12px;color:var(--mu)}
  .otr.off{opacity:.35;pointer-events:none}
  .oseg{display:flex;background:var(--sf2);border-radius:10px;padding:3px;gap:3px}
  .oseg button{flex:1;border:0;background:none;color:var(--mu);font:inherit;font-size:13.5px;font-weight:600;padding:8px 10px;border-radius:8px;cursor:pointer;white-space:nowrap}
  .oseg button:hover{color:var(--tx)}.oseg button.on{background:var(--sf);color:var(--tx);box-shadow:0 1px 3px #0006,inset 0 0 0 1px var(--ln)}
  .osw{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:6px}
  .osw button{display:flex;flex-direction:column;align-items:center;gap:5px;min-width:0;padding:8px 4px;border:1.5px solid transparent;border-radius:12px;background:var(--sf2);color:var(--mu);cursor:pointer;font:inherit}
  .osw button:hover{color:var(--tx)}.osw button.on{border-color:var(--rd);color:var(--tx)}
  .osw i{width:26px;height:26px;border-radius:50%;box-shadow:inset 0 0 0 1px #fff3}.osw small{font-size:10.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
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
  .sblang{display:flex;gap:2px;margin:8px 10px 0;background:var(--sf2);border-radius:8px;padding:2px}.sblang button{flex:1;border:0;background:none;color:var(--mu);font:inherit;font-size:12px;padding:4px;border-radius:6px;cursor:pointer}.sblang button.on{background:var(--sf);color:var(--tx)}
  @media (max-width:1000px){.sblang{display:none}}
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
  /* setups page */
  .spw{display:grid;grid-template-columns:minmax(300px,400px) minmax(0,1fr);gap:20px;align-items:start}@media(max-width:1100px){.spw{grid-template-columns:1fr}}
  .spl{position:sticky;top:20px;max-height:calc(100vh - 40px);overflow:auto}
  .spg{margin-top:10px}.spgh{display:flex;justify-content:space-between;align-items:baseline;padding:6px 4px;border-bottom:1px solid var(--ln)}.spgh small{color:var(--mu);font-size:12px}
  .sprow{display:flex;justify-content:space-between;align-items:center;gap:10px;width:100%;padding:9px 10px;border:0;border-radius:8px;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer;margin-top:2px}
  .sprow:hover{background:var(--sf2)}.sprow.on{background:var(--sf2);box-shadow:inset 3px 0 0 var(--rd)}.sprow b{display:block;font-weight:600;font-size:14.5px}.sprow small{display:block;color:var(--mu);font-size:12px}.sprow .tm{font-size:15px;min-width:0;text-align:right}
  .spact{font-style:normal;font-size:10.5px;font-weight:700;color:var(--gr);border:1px solid var(--gr);border-radius:999px;padding:0 6px;margin-left:8px;vertical-align:2px}
  .sph{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap}
  .spname{font-size:24px;font-weight:700;background:transparent;border:1px solid transparent;border-radius:8px;padding:4px 8px;margin-left:-8px;min-width:0;flex:1;color:var(--tx)}.spname:hover,.spname:focus{border-color:var(--ln);background:var(--sf2)}
  .spbtn{display:flex;gap:8px;flex-wrap:wrap}
  .spmeta{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0 4px;font-size:13px;color:var(--mu)}.spmeta>span{background:var(--sf2);border-radius:999px;padding:3px 10px}.spmeta label{display:flex;align-items:center;gap:6px;margin:0}.spmeta select{padding:3px 8px;font-size:13px;width:auto}
  .spres{grid-template-columns:repeat(auto-fit,minmax(120px,1fr))}.spres .up{color:var(--gr)}.spres .dn{color:var(--dn)}
  .sptabs{display:flex;gap:4px;flex-wrap:wrap;border-bottom:1px solid var(--ln);margin:6px 0 0}
  .sptabs button{border:0;background:none;color:var(--mu);font:inherit;font-weight:600;font-size:14px;padding:10px 14px;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;display:flex;align-items:center;gap:6px}
  .sptabs button:hover{color:var(--tx)}.sptabs button.on{color:var(--tx);border-bottom-color:var(--rd)}.sptabs small{font-size:11px;background:var(--sf2);border-radius:999px;padding:0 6px;color:var(--mu)}
  .spopts{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:0 28px;padding:6px 0}
  .spo{display:grid;grid-template-columns:minmax(130px,1fr) auto;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--ln)}
  .spl2{font-size:14px;font-weight:600}.spl2 small{display:block;font-weight:400;color:var(--mu);font-size:11.5px}
  .spcells{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.spcells label,.spcar label{display:flex;align-items:center;gap:6px;margin:0}.spcells small,.spcar small{color:var(--mu);font-size:11px;min-width:18px}
  .spf{display:inline-flex;align-items:center;border:1px solid var(--ln);border-radius:8px;background:var(--sf2);overflow:hidden}
  .spf button{width:28px;height:32px;border:0;background:none;color:var(--mu);font-size:16px;cursor:pointer}.spf button:hover{color:var(--tx);background:var(--sf)}
  .spf input{width:64px;border:0;background:none;text-align:center;padding:6px 2px;font-variant-numeric:tabular-nums;color:var(--tx)}.spf input:focus{outline:none}.spf:focus-within{border-color:var(--rd)}
  .spcar{display:grid;grid-template-columns:auto 34px auto;grid-template-rows:auto auto;gap:6px 8px;align-items:center}
  .spcar .spbody{width:34px;height:64px;border-radius:12px 12px 8px 8px;border:2px solid var(--ln);background:linear-gradient(180deg,var(--sf2),var(--sf))}
  .spcar>:nth-child(1){grid-area:1/1;justify-content:flex-end}.spcar>:nth-child(2){grid-area:1/3}.spcar>:nth-child(3){grid-area:1/2/3/3}.spcar>:nth-child(4){grid-area:2/1;justify-content:flex-end}.spcar>:nth-child(5){grid-area:2/3}
  .spfoot{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-top:12px}.spall{display:flex;align-items:center;gap:10px;margin:0;font-size:13.5px;color:var(--mu);cursor:pointer}
  .spcmp{margin-top:20px;padding-top:16px;border-top:1px solid var(--ln)}.spcmp select{width:auto;max-width:320px}.spcmp .up{color:var(--gr)}.spcmp .dn{color:var(--dn)}
  /* car setups */
  .suline{border-top:1px dashed var(--ln);padding-top:8px}.suline .ls span{color:var(--mu)}
  #suf,#sup,#sua{max-width:860px}
  .sua{border:1px solid var(--ln);border-radius:10px;margin:8px 0;padding:0 12px;background:var(--sf2)}
  .sua summary{cursor:pointer;padding:10px 0;font-weight:600;display:flex;justify-content:space-between}.sua summary small{color:var(--mu);font-weight:400}
  .sug{display:grid;grid-template-columns:minmax(150px,220px) 1fr;gap:6px 14px;align-items:center;padding:0 0 12px}.sug>span{font-size:13.5px}.sug>span small{color:var(--mu)}
  .suc{display:grid;gap:6px}.suc.n1{grid-template-columns:minmax(0,140px)}.suc.n2{grid-template-columns:repeat(2,minmax(0,110px))}.suc.n3,.suc.n4{grid-template-columns:repeat(4,minmax(0,1fr))}
  .suc label{display:flex;align-items:center;gap:4px;margin:0}.suc label small{color:var(--mu);font-size:11px;width:20px}.suc input{padding:6px 8px;min-width:0}
  .sut{display:grid;grid-template-columns:minmax(140px,1.4fr) 44px 92px 92px 70px minmax(160px,1.6fr) auto;gap:8px 12px;align-items:center;font-size:14px;font-variant-numeric:tabular-nums}
  .sut>span:nth-child(-n+7){font-size:11.5px;color:var(--mu)}.sut>b{font-weight:600;overflow:hidden;text-overflow:ellipsis}.sut>b small{display:block;font-weight:400;color:var(--mu);font-size:12px}.sut .pu{color:var(--pu)}
  .sl1{display:flex;align-items:center;gap:8px}.sl1 .bar{flex:1;height:10px;border-radius:5px;background:var(--sf2);overflow:hidden}.sl1 .bar i{display:block;height:100%;border-radius:5px;background:var(--dn)}.sl1 .bar i.z{background:var(--pu)}.sl1 em{font-style:normal;font-size:12.5px;min-width:56px;text-align:right}
  .suact{display:flex;gap:4px}
  .sucmp{margin-top:16px;border-top:1px solid var(--ln);padding-top:14px}.sucmp .up{color:var(--gr)}.sucmp .dn{color:var(--dn)}
  .suarea{margin:8px 0}.suarea h6{margin:10px 0 4px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--mu)}
  .surow{display:grid;grid-template-columns:minmax(150px,240px) 1fr;gap:10px;padding:5px 0;border-top:1px solid var(--ln);font-size:13.5px;align-items:baseline}
  .suv{display:flex;gap:6px 16px;flex-wrap:wrap;font-variant-numeric:tabular-nums}.suv span{color:var(--mu)}.suv span small{margin-right:4px;font-size:11px}.suv span.ch{color:var(--tx)}.suv span.ch b{color:#ffd23f}.suv i{font-style:normal;color:var(--mu)}
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
    wrench: '<path d="M14.5 6.5a4 4 0 0 0-5.3 5.3L4 17l3 3 5.2-5.2a4 4 0 0 0 5.3-5.3l-2.4 2.4-2.3-.7-.7-2.3z"/>',
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
        ${item('data-desk="setups"', "wrench", "Setups", v === "setups", allSetups().length ? `<small>${allSetups().length}</small>` : "")}
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
        <div class="sblang" title="Sprache / Language">${[["de", "Deutsch"], ["en", "English"]].map(([k, n]) => `<button data-desk="lang" data-v="${k}" class="${(window.LAPBOOK_LANG || "de") === k ? "on" : ""}">${n}</button>`).join("")}</div>
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
    if (k === "setups") { S.v = "setups"; render(); scrollTo(0, 0); }
    if (k === "lang") { try { localStorage.setItem("lapbook.lang", t.dataset.v); } catch (x) {} location.reload(); }
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
      <div class="lh"><span><b>${esc(i.track || "Waiting for track")}</b><br><span class="ls">${esc([i.car, i.session].filter(Boolean).join(" · ") || "Drive a lap, it is saved by itself")}</span></span>${lapBox(F1)}</div>${liveSetup(F1, i.track, i.car)}
      ${ask ? `<div class="nm2"><span class="warn2">Which car is this (team ${esc(i.teamId)})?</span><input id="cname" placeholder="for example McLaren 2026" maxlength="60"><button class="b pri" data-live="name" data-id="${esc(i.teamId)}">Save name</button></div>` : ""}</div>`;
  }
  function acLive_() {
    const a = st.ac;
    return `<div class="game"><div class="lh"><span class="lt"><span class="dot"></span>Live · Assetto Corsa</span>${openBtn(AC, a.track)}</div>
      <div class="lh"><span><b>${esc(a.track || "Waiting for track")}</b><br><span class="ls">${esc(a.car || "")}</span></span>${lapBox(AC)}</div>${liveSetup(AC, a.track, a.car)}${st.ac.folder ? "" : folderNote()}</div>`;
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
      <div class="lh"><span><b>${esc(where)}</b><br><span class="ls">${esc([f.car, f.carClass].filter(Boolean).join(" · "))}</span></span>${lapBox(f.game)}</div>${f.run || f.lastSegment ? liveSetup(f.game, f.run ? f.run.name : f.lastSegment.name, f.car) : ""}
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
      <div class="lh"><span><b>${esc(s.track || "Waiting for track")}</b><br><span class="ls">${esc(s.car || "")}</span></span>${lapBox(g)}</div>${liveSetup(g, s.track, s.car)}</div>`;
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
    ["Car setup", "every option, to compare", { F1: "y", AC: "y", ACC: "y", LMU: "p", PC2: "p", FZ: "p" }],
  ];
  const READ_TIPS = { "AC|Sectors": "Assetto Corsa sends no sectors, Lapbook uses thirds of the lap", "FZ|Lap times": "time trials and drag runs that you mark once", "FZ|Car and circuit": "you name a car once, the game sends only a number", "LMU|Invalid laps": "only if the game's interface reports it", "F1|Car setup": "sent by the game", "AC|Car setup": "from the setup files you saved", "ACC|Car setup": "from the setup files you saved", "LMU|Car setup": "typed in by you", "PC2|Car setup": "typed in by you", "FZ|Car setup": "typed in by you", "F1|Championship": "F1 25 career (Driver Career and My Team): practice, qualifying, sprint and race of every driver, points as in the game", "FZ|Live delta": "in time trials and drag runs" };
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
    else if (S.v === "setups") { AS = asum(); $("#app").innerHTML = setupsPage(); }
    else baseRender();
    try { tidy(); sectorPanel(); setupPanel(); careerExtras(); sidebar(); wide(); document.getElementById("app").dataset.v = S.v; placeCard.last = ""; placeCard(); } catch (e) { console.error(e); }
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
    s.laps.push({ t: lap.timeInMs, sectors: lap.sectors || null, valid, splits: !!lap.splits, setup: lap.setup || "" });
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
    // the setup of the session against the best other setup on this circuit
    const used = s.laps.map(l => l.setup).filter(Boolean);
    if (used.length) {
      const id = used.sort((x, y) => used.filter(v => v === y).length - used.filter(v => v === x).length)[0], su = setupById(id);
      if (su) {
        r.setup = su.name;
        const other = D.lapTimes.filter(l => l.game === s.game && l.track === s.track && l.car === s.car && l.setup && l.setup !== id && setupById(l.setup));
        if (other.length) { const ob = other.reduce((m, l) => (l.timeInMs < m.timeInMs ? l : m)); r.vsSetup = { name: setupById(ob.setup).name, best: ob.timeInMs }; }
      }
    }
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
      ${tile(r.valid + (r.laps > r.valid ? " / " + r.laps : ""), r.laps > r.valid ? "valid / all laps" : "laps")}
      ${r.setup ? tile(esc(r.setup), r.vsSetup && r.best ? `setup · ${gpS(r.best - r.vsSetup.best)} vs. ${esc(r.vsSetup.name)}` : "setup") : ""}</div>
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

  // ---------- car setups: pick one before you drive, compare them afterwards ----------
  // A setup is every option of the game's setup menu. AC and ACC: read from the
  // files the game saved, F1 25: sent by the game, other games: typed in. Every
  // new lap gets the setup that is active for its car and circuit.
  const SC = window.SetupCatalog;
  const vkey = v => JSON.stringify(Object.keys(v || {}).filter(k => k !== "fuel").sort().map(k => [k, v[k]]));
  const allSetups = () => (D.setups = Array.isArray(D.setups) ? D.setups : []);
  const setupById = id => allSetups().find(x => x.id === id);
  const setupsFor = (g, car) => allSetups().filter(x => x.game === g && x.car === car);
  const FILE_GAMES = [AC, ACC];
  let ACTIVE = {}, fileCache = {};
  try { ACTIVE = JSON.parse(localStorage.getItem("lapbook.activeSetup") || "{}") || {}; } catch (e) {}
  const akey = (g, car, track) => [g, car, track].join("|");
  const activeId = (g, car, track) => { const id = ACTIVE[akey(g, car, track)]; return id && setupById(id) ? id : ""; };
  function setActive(g, car, track, id) {
    if (id) ACTIVE[akey(g, car, track)] = id; else delete ACTIVE[akey(g, car, track)];
    try { localStorage.setItem("lapbook.activeSetup", JSON.stringify(ACTIVE)); } catch (e) {}
    placeCard.last = ""; placeCard(); overlayFeed();
  }
  // one Lapbook setup per file and content: a re-saved file with new values is a new version
  function setupFromFile(g, car, track, f) {
    const k = vkey(f.values), same = setupsFor(g, car).find(x => x.file === f.file && (x.fileKey || x.vkey) === k);
    if (same) return same;
    const versions = setupsFor(g, car).filter(x => x.file === f.file).length;
    const o = { id: uid(), game: g, car, track: f.generic ? "" : track, name: f.name + (versions ? ` v${versions + 1}` : ""), values: { ...f.values }, vkey: k, fileKey: k, notes: "", source: "file", file: f.file, created: today() };
    allSetups().push(o); save();
    return o;
  }
  // the live cards: which setup the laps count for right now
  function liveSetup(g, track, car) {
    if (!track || !car) return "";
    const id = activeId(g, car, track), s = id && setupById(id), fc = fileCache[akey(g, car, track)];
    const hint = !s ? (FILE_GAMES.includes(g) ? (fc && fc.list && !fc.list.length ? "no saved setup found" : "") : g === F1 ? "comes from the game" : "") : s.source === "file" ? "saved file" : s.source === "telemetry" ? "from the game" : "typed in";
    return `<div class="lh suline"><span class="ls">Setup · <b style="color:var(--tx)">${s ? esc(s.name) : "none"}</b>${hint ? ` <span>(${hint})</span>` : ""}</span><span class="swb">${s ? `<button class="b ghost sm" data-su="open" data-id="${esc(s.id)}">Show</button>` : ""}<button class="b ghost sm" data-su="pick" data-g="${esc(g)}" data-c="${esc(car)}" data-t="${esc(track)}">${s ? "Change" : "Choose setup"}</button></span></div>`;
  }
  // AC / ACC: look at the saved files now and then; the newest one is used until you pick another
  async function refreshFiles(g, car, track) {
    if (!B.setupsList || !FILE_GAMES.includes(g) || !car || !track) return;
    const k = akey(g, car, track), c = fileCache[k];
    if (c && Date.now() - c.at < 15000) return;
    fileCache[k] = { at: Date.now(), list: c ? c.list : null };
    const r = await B.setupsList({ game: g, car, track });
    fileCache[k] = { at: Date.now(), list: r.list || [], unknown: r.unknown };
    const cur = setupById(activeId(g, car, track));
    if (!cur && r.list && r.list.length) { const s = setupFromFile(g, car, track, r.list[0]); setActive(g, car, track, s.id); toast(`Setup: ${s.name} (newest saved). Change it in the live card.`); }
    else if (cur && cur.source === "file") {
      // you saved the file again with other values: laps from now on count for the new version
      const f = (r.list || []).find(x => x.file === cur.file);
      if (f && vkey(f.values) !== (cur.fileKey || cur.vkey)) { const s = setupFromFile(g, car, track, f); setActive(g, car, track, s.id); toast(`Setup changed in the game: laps now count for ${s.name}`); }
    }
    placeCard.last = ""; placeCard();
  }
  function liveFiles() {
    if (acLive() && st.ac.car && st.ac.track) refreshFiles(AC, st.ac.car, st.ac.track);
    if (simLive(ACC) && sim(ACC).car && sim(ACC).track) refreshFiles(ACC, sim(ACC).car, sim(ACC).track);
  }
  // F1 25 sends its setup: the same values are the same setup
  if (B.onSetup) B.onSetup(x => {
    if (!x || !x.car || !x.track || !x.values) return;
    const k = vkey(x.values), list = setupsFor(F1, x.car);
    let s = list.find(y => y.track === x.track && y.vkey === k);
    if (!s) {
      const n = list.filter(y => y.track === x.track).length + 1;
      s = { id: uid(), game: F1, car: x.car, track: x.track, name: `${x.track} setup ${n}`, values: { ...x.values }, vkey: k, notes: "", source: "telemetry", created: today() };
      allSetups().push(s); save();
      toast(`F1 25 setup saved as "${s.name}". Rename it on the circuit page.`);
    }
    if (activeId(F1, x.car, x.track) !== s.id) setActive(F1, x.car, x.track, s.id);
  });

  // ---- choose a setup ----
  async function openPicker(g, car, track) {
    let files = [];
    if (FILE_GAMES.includes(g) && B.setupsList) { const r = await B.setupsList({ game: g, car, track }); files = r.list || []; fileCache[akey(g, car, track)] = { at: Date.now(), list: files, unknown: r.unknown }; }
    const cur = activeId(g, car, track), mine = setupsFor(g, car).filter(x => x.source !== "file" || !files.some(f => f.file === x.file));
    const lapsWith = id => D.lapTimes.filter(l => l.setup === id).length;
    PICK = { g, car, track, files };
    const fc = fileCache[akey(g, car, track)];
    $("#modal").innerHTML = `<div class="ov"><div class="md" id="sup"><h3>Setup for ${esc(car)}</h3><p class="ls" style="color:var(--mu);margin:0 0 12px">${esc(track)} · laps you drive from now on count for the setup you pick.</p>
      ${FILE_GAMES.includes(g) ? `<h4>Saved in ${g === AC ? "Assetto Corsa" : "ACC"}</h4>${files.length ? files.map((f, i) => { const s = setupsFor(g, car).find(x => x.file === f.file && (x.fileKey || x.vkey) === vkey(f.values)); return `<button class="rrow ${s && s.id === cur ? "cont" : ""}" data-su="usefile" data-i="${i}"><span><b>${esc(f.name)}</b><small>${f.generic ? "generic · " : ""}saved ${esc(new Date(f.mtime).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }))} · ${Object.keys(f.values).length} options</small></span><span class="mu">${s && s.id === cur ? "active" : "Use"}</span></button>`; }).join("") : `<p class="mu" style="margin:0 0 8px">${fc && fc.unknown ? "Drive one session first, then Lapbook knows the game folder of this car." : "No setup saved for this car on this circuit. Save one in the game's setup menu."}</p>`}` : ""}
      <h4>In Lapbook</h4>${mine.map(s => `<button class="rrow ${s.id === cur ? "cont" : ""}" data-su="use" data-id="${esc(s.id)}"><span><b>${esc(s.name)}</b><small>${esc(s.track || "every circuit")} · ${{ file: "file", telemetry: "from the game", manual: "typed in" }[s.source] || ""} · ${lapsWith(s.id)} laps</small></span><span class="mu">${s.id === cur ? "active" : "Use"}</span></button>`).join("") || `<p class="mu" style="margin:0 0 8px">No setups yet.</p>`}
      <div class="acts" style="margin-top:14px"><button class="b pri" data-su="new">+ New setup</button>${cur ? `<button class="b" data-su="open" data-id="${esc(cur)}">Show all its options</button><button class="b" data-su="none">No setup</button>` : ""}<button class="b ghost" data-act="closem">Close</button></div></div></div>`;
  }
  let PICK = null, FORM = null;

  // ---- type in a setup: every option of the game, area by area ----
  function openForm(g, car, track, edit, copy) {
    const base = edit || copy || null, values = base ? { ...base.values } : {};
    const keys = [...new Set([...SC.template(g), ...Object.keys(values)])];
    FORM = { g, car, track, edit: edit ? edit.id : "", keys };
    const sources = [...((PICK && PICK.files) || []).map((f, i) => [`f${i}`, `${f.name} (saved file)`]), ...setupsFor(g, car).filter(x => !edit || x.id !== edit.id).map(x => [`s${x.id}`, x.name])];
    const L = SC.layout(g, keys);
    $("#modal").innerHTML = `<div class="ov"><div class="md" id="suf"><h3>${edit ? "Edit setup" : "New setup"}</h3>
      <div class="two"><label>Name<input id="suname" value="${esc(base ? (edit ? base.name : base.name + " copy") : "")}" placeholder="for example Monza low downforce" maxlength="60"></label>
      ${sources.length ? `<label>Copy from<select id="sucopy"><option value="">–</option>${sources.map(([v, n]) => `<option value="${esc(v)}">${esc(n)}</option>`).join("")}</select></label>` : "<span></span>"}</div>
      <label>Notes<input id="sunotes" value="${esc((edit && edit.notes) || "")}" placeholder="for example more rear wing for the second sector" maxlength="200"></label>
      <p class="ls" style="color:var(--mu);margin:8px 0">Every option of the ${esc(g)} setup menu. Leave out what you did not change.${SC.kind(g) === "ac" ? " Values as in the game (clicks)." : ""}</p>
      ${L.map(a => `<details class="sua" ${a.rows.some(r => r.cells.some(c => values[c.key] !== undefined && values[c.key] !== "")) || L.length < 3 ? "open" : ""}><summary>${esc(a.area)}<small>${a.rows.length} option${a.rows.length === 1 ? "" : "s"}</small></summary>
        <div class="sug">${a.rows.map(r => `<span>${esc(r.label)}${r.unit && r.unit !== "clicks" ? ` <small>${esc(r.unit)}</small>` : ""}</span><div class="suc n${Math.min(r.cells.length, 4)}">${r.cells.map(c => `<label>${c.wheel ? `<small>${esc(c.wheel)}</small>` : ""}<input data-suk="${esc(c.key)}" value="${esc(values[c.key] ?? "")}" inputmode="decimal"></label>`).join("")}</div>`).join("")}</div></details>`).join("")}
      ${SC.kind(g) === "ac" || SC.kind(g) === "generic" ? `<div class="add" style="margin-top:10px"><input id="suxk" placeholder="Extra option, e.g. a mod car setting"><input id="suxv" placeholder="Value" style="max-width:120px"><button class="b" data-su="addopt">Add</button></div>` : ""}
      <div class="acts" style="margin-top:14px"><button class="b pri" data-su="save">Save setup</button><button class="b ghost" data-act="closem">Cancel</button></div></div></div>`;
    const cp = $("#sucopy");
    if (cp) cp.onchange = () => {
      const v = cp.value; if (!v) return;
      const src = v[0] === "f" ? PICK.files[Number(v.slice(1))] : setupById(v.slice(1));
      if (src) openForm(g, car, track, edit, { name: src.name, values: src.values });
    };
  }
  function saveForm() {
    const F = FORM, name = ($("#suname").value || "").trim();
    if (!name) return toast("Give the setup a name first");
    const values = {};
    document.querySelectorAll("#suf [data-suk]").forEach(i => { const v = i.value.trim(); if (v !== "") values[i.dataset.suk] = isFinite(Number(v)) ? Number(v) : v; });
    const notes = ($("#sunotes").value || "").trim();
    let s = F.edit && setupById(F.edit);
    if (s) Object.assign(s, { name, values, vkey: vkey(values), notes });
    else { s = { id: uid(), game: F.g, car: F.car, track: F.track, name, values, vkey: vkey(values), notes, source: "manual", created: today() }; allSetups().push(s); }
    save();
    if (!F.edit) setActive(F.g, F.car, F.track, s.id);
    $("#modal").innerHTML = "";
    refresh();
    toast(F.edit ? "Setup saved" : `Setup "${name}" saved. New laps count for it.`);
  }
  document.addEventListener("click", async e => {
    const t = e.target.closest("[data-su]");
    if (!t) return;
    const k = t.dataset.su;
    if (k === "pick") return openPicker(t.dataset.g, t.dataset.c, t.dataset.t);
    if (k === "use" && PICK) { setActive(PICK.g, PICK.car, PICK.track, t.dataset.id); $("#modal").innerHTML = ""; toast("Setup chosen: " + setupById(t.dataset.id).name); refresh(); }
    if (k === "usefile" && PICK) { const s = setupFromFile(PICK.g, PICK.car, PICK.track, PICK.files[Number(t.dataset.i)]); setActive(PICK.g, PICK.car, PICK.track, s.id); $("#modal").innerHTML = ""; toast("Setup chosen: " + s.name); refresh(); }
    if (k === "none" && PICK) { setActive(PICK.g, PICK.car, PICK.track, ""); $("#modal").innerHTML = ""; refresh(); }
    if (k === "new" && PICK) return openNewSetup({ game: PICK.g, car: PICK.car, track: PICK.track });
    if (k === "open") { $("#modal").innerHTML = ""; Object.assign(SP, { sel: t.dataset.id, game: "", cmp: "" }); keepSP(); S.v = "setups"; render(); scrollTo(0, 0); return; }
    if (k === "newhere") return openNewSetup({ game: t.dataset.g, car: t.dataset.c, track: t.dataset.t });
    if (k === "edit") { Object.assign(SP, { sel: t.dataset.id, game: "", cmp: "" }); keepSP(); S.v = "setups"; render(); scrollTo(0, 0); return; }
    if (k === "save") saveForm();
    if (k === "addopt") {
      const key = ($("#suxk").value || "").trim(), v = ($("#suxv").value || "").trim();
      if (!key) return;
      const values = {}; document.querySelectorAll("#suf [data-suk]").forEach(i => { if (i.value.trim() !== "") values[i.dataset.suk] = i.value.trim(); });
      const kk = SC.kind(FORM.g) === "ac" ? key.toUpperCase().replace(/\s+/g, "_") : "x:" + key;
      values[kk] = v;
      const ed = FORM.edit && setupById(FORM.edit);
      openForm(FORM.g, FORM.car, FORM.track, ed ? { ...ed, values } : null, ed ? null : { name: ($("#suname").value || "").trim().replace(/ copy$/, ""), values });
    }
    if (k === "del") { const s = setupById(t.dataset.id); if (!s) return; if (!t.dataset.armed) { t.dataset.armed = "1"; t.textContent = "Really delete?"; return; } D.setups = allSetups().filter(x => x.id !== s.id); tomb("su:" + s.id); D.lapTimes.forEach(l => { if (l.setup === s.id) delete l.setup; }); save(); render(); toast("Setup deleted, its laps keep their times"); }
    if (k === "cmp") { SU[t.dataset.w] = t.dataset.id; render(); }
    if (k === "only") { SU.only = !SU.only; render(); }
    if (k === "assign") openAssign(S.g, S.t);
    if (k === "assignsave") {
      document.querySelectorAll("#sua [data-sess]").forEach(sel => { const ids = sel.dataset.sess.split(","); D.lapTimes.forEach(l => { if (ids.includes(l.id)) { if (sel.value) l.setup = sel.value; else delete l.setup; } }); });
      save(); $("#modal").innerHTML = ""; render(); toast("Setups assigned");
    }
  });

  // ---- give older laps their setup, one session (day and car) at a time ----
  function openAssign(g, track) {
    const L = D.lapTimes.filter(l => l.game === g && l.track === track), by = {};
    L.forEach(l => (by[(l.date || "") + "|" + l.car] = by[(l.date || "") + "|" + l.car] || []).push(l));
    const rows = Object.entries(by).sort((a, b) => b[0].localeCompare(a[0]));
    $("#modal").innerHTML = `<div class="ov"><div class="md" id="sua"><h3>Setups of your laps at ${esc(track)}</h3><p class="ls" style="color:var(--mu);margin:0 0 12px">Pick the setup you drove each session with. Laps from live tracking already have one.</p>
      ${rows.map(([k, ls]) => { const [d, car] = k.split("|"), list = setupsFor(g, car), cur = ls[0].setup || "", mixed = ls.some(l => (l.setup || "") !== cur); return `<div class="sr" style="grid-template-columns:1fr minmax(0,220px)"><span>${esc(shortDate(d))} · ${esc(car)}<small>${ls.length} lap${ls.length === 1 ? "" : "s"} · best ${fmt(Math.min(...ls.map(l => l.timeInMs)))}</small></span><select data-sess="${ls.map(l => l.id).join(",")}"><option value="">${mixed ? "(several, keep)" : "no setup"}</option>${list.map(s => `<option value="${esc(s.id)}" ${!mixed && s.id === cur ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select></div>`; }).join("")}
      <div class="acts" style="margin-top:14px"><button class="b pri" data-su="assignsave">Save</button><button class="b ghost" data-act="closem">Cancel</button></div></div></div>`;
    // "(several, keep)" must not wipe mixed sessions
    document.querySelectorAll("#sua select").forEach(sel => { if (sel.options[0].textContent.startsWith("(several")) sel.dataset.keep = "1"; sel.onchange = () => delete sel.dataset.keep; });
    const btn = document.querySelector('#sua [data-su="assignsave"]');
    btn.addEventListener("click", () => document.querySelectorAll("#sua select[data-keep]").forEach(s => s.removeAttribute("data-sess")), true);
  }

  // ---- circuit page: how fast was each setup ----
  const SU = { a: "", b: "", only: true };
  const statsOf = laps => {
    const t = laps.map(l => l.timeInMs), best = Math.min(...t), clean = t.filter(x => x <= best * 1.07), avg = clean.reduce((a, b) => a + b, 0) / clean.length;
    const sd = clean.length > 1 ? Math.sqrt(clean.reduce((a, x) => a + (x - avg) ** 2, 0) / (clean.length - 1)) : 0;
    const ws = laps.filter(l => Array.isArray(l.sectors) && l.sectors.length === 3), secs = ws.length ? [0, 1, 2].map(i => Math.min(...ws.map(l => l.sectors[i]))) : null;
    return { n: laps.length, best, avg: Math.round(avg), sd: Math.round(sd), secs };
  };
  const sg3 = ms => (ms > 0 ? "+" : ms < 0 ? "−" : "±") + (Math.abs(ms) / 1000).toFixed(3);
  function setupPanel() {
    if (S.v !== "track" || document.getElementById("supanel")) return;
    const g = S.g, track = S.t, L = D.lapTimes.filter(l => l.game === g && l.track === track);
    if (!L.length) return;
    const cars = [...new Set(L.filter(l => l.setup && setupById(l.setup)).map(l => l.car))];
    const withSetup = L.filter(l => l.setup && setupById(l.setup)).length;
    let html = `<div id="supanel"><div class="bh"><span>Setups</span><small>${withSetup} of ${L.length} laps have a setup</small></div>`;
    if (!cars.length) {
      html += `<div class="panel" style="margin-top:0"><p class="ls" style="margin:0;color:var(--mu)">Pick a setup in the live card before you drive (AC and ACC take the newest saved file by themselves, F1 25 sends it), or give your laps a setup here. Then Lapbook shows which setup was faster.</p>
        <div class="acts" style="margin-top:10px"><button class="b" data-su="assign">Give laps a setup</button><button class="b ghost" data-su="newhere" data-g="${esc(g)}" data-c="${esc(L[L.length - 1].car)}" data-t="${esc(track)}">+ New setup</button></div></div></div>`;
    } else {
      for (const car of cars) {
        const ids = [...new Set(L.filter(l => l.car === car && l.setup && setupById(l.setup)).map(l => l.setup))];
        const rows = ids.map(id => ({ s: setupById(id), st: statsOf(L.filter(l => l.car === car && l.setup === id)) })).sort((a, b) => a.st.best - b.st.best);
        const top = rows[0].st.best, mx = Math.max(1, ...rows.map(r => r.st.best - top));
        if (!rows.some(r => r.s.id === SU.a)) SU.a = rows[0].s.id;
        if (!rows.some(r => r.s.id === SU.b) || SU.b === SU.a) SU.b = (rows.find(r => r.s.id !== SU.a) || {}).s ? rows.find(r => r.s.id !== SU.a).s.id : "";
        html += `<div class="panel" style="margin-top:0"><div class="ch" style="margin-bottom:8px"><b>${esc(car)}</b><span class="mu" style="font-size:13px">${rows.length} setup${rows.length === 1 ? "" : "s"}</span></div>
          <div class="sut"><span></span><span>laps</span><span>best</span><span>average</span><span>spread</span><span>gap to the fastest</span><span></span>
          ${rows.map((r, i) => `<b>${esc(r.s.name)}${r.s.notes ? `<small>${esc(r.s.notes)}</small>` : ""}</b><span>${r.st.n}</span><span class="${i ? "" : "pu"}">${fmt(r.st.best)}</span><span>${fmt(r.st.avg)}</span><span>±${(r.st.sd / 1000).toFixed(3)}</span><span class="sl1"><span class="bar"><i class="${i ? "" : "z"}" style="width:${i ? Math.max(4, ((r.st.best - top) / mx) * 100).toFixed(0) : 4}%"></i></span><em>${i ? sg3(r.st.best - top) : "fastest"}</em></span><span class="suact"><button class="b ghost sm" data-su="cmp" data-w="a" data-id="${esc(r.s.id)}" ${SU.a === r.s.id ? 'style="border-color:var(--pu)"' : ""}>A</button><button class="b ghost sm" data-su="cmp" data-w="b" data-id="${esc(r.s.id)}" ${SU.b === r.s.id ? 'style="border-color:var(--rd)"' : ""}>B</button><button class="b ghost sm" data-su="edit" data-id="${esc(r.s.id)}">Edit</button></span>`).join("")}</div>
          ${compareBlock(rows, L.filter(l => l.car === car))}
          <div class="acts" style="margin-top:12px"><button class="b" data-su="assign">Give laps a setup</button><button class="b ghost" data-su="newhere" data-g="${esc(g)}" data-c="${esc(car)}" data-t="${esc(track)}">+ New setup</button></div></div>`;
      }
      html += `</div>`;
    }
    const anchor = document.getElementById("secpanel") || [...document.querySelectorAll("#app .bh")].find(n => /^Scoreboard/.test(n.textContent.trim()));
    if (anchor) anchor.insertAdjacentHTML(anchor.id === "secpanel" ? "afterend" : "beforebegin", html);
  }
  // two setups side by side: times, sectors and every option that changed
  function compareBlock(rows, laps) {
    const A = rows.find(r => r.s.id === SU.a), Bx = rows.find(r => r.s.id === SU.b);
    if (!A || !Bx) return "";
    const a = A.st, b = Bx.st, dBest = b.best - a.best, dAvg = b.avg - a.avg, few = a.n < 3 || b.n < 3;
    const word = d => (d < 0 ? "faster" : d > 0 ? "slower" : "as fast");
    // name the faster setup first: "low_df was 0.650 s faster ... than high_df"
    const [F, Sl, fb, sb, fa] = dBest <= 0 ? [Bx, A, b, a, dAvg] : [A, Bx, a, b, -dAvg];
    const db = Math.abs(dBest), avgWord = fa < 0 ? "faster" : fa > 0 ? "slower" : "as fast";
    const sum = dBest === 0 ? `<b>${esc(A.s.name)}</b> and <b>${esc(Bx.s.name)}</b> have the same best lap.` : `<b>${esc(F.s.name)}</b> was <b class="up">${(db / 1000).toFixed(3)} s faster</b> on the best lap and <b class="${fa <= 0 ? "up" : "dn"}">${(Math.abs(fa) / 1000).toFixed(3)} s ${avgWord}</b> on average than <b>${esc(Sl.s.name)}</b> (${fb.n} vs. ${sb.n} laps).`;
    const secs = a.secs && b.secs ? `<div class="secg" style="margin-top:10px"><span></span><span>S1</span><span>S2</span><span>S3</span><span>lap</span>
      <span>A</span>${a.secs.map(x => `<b>${(x / 1000).toFixed(3)}</b>`).join("")}<b>${fmt(a.best)}</b>
      <span>B</span>${b.secs.map(x => `<b>${(x / 1000).toFixed(3)}</b>`).join("")}<b>${fmt(b.best)}</b>
      <span>B − A</span>${b.secs.map((x, i) => `<b class="${x - a.secs[i] < 0 ? "up" : x - a.secs[i] > 0 ? "dn" : ""}">${sg3(x - a.secs[i])}</b>`).join("")}<b class="${dBest < 0 ? "up" : "dn"}">${sg3(dBest)}</b></div>` : "";
    const va = A.s.values || {}, vb = Bx.s.values || {}, keys = [...new Set([...Object.keys(va), ...Object.keys(vb)])], g = A.s.game;
    const same = k => String(va[k] ?? "") === String(vb[k] ?? "");
    const changed = SC.layout(g, keys).reduce((n, ar) => n + ar.rows.filter(r => r.cells.some(c => !same(c.key))).length, 0);
    const L = SC.layout(g, keys).map(ar => ({ ...ar, rows: ar.rows.filter(r => !SU.only || r.cells.some(c => !same(c.key))) })).filter(ar => ar.rows.length);
    const cell = c => { const x = va[c.key], y = vb[c.key], ch = !same(c.key); return `<span class="${ch ? "ch" : ""}">${c.wheel ? `<small>${esc(c.wheel)}</small>` : ""}${ch ? `${esc(x ?? "–")} <i>→</i> <b>${esc(y ?? "–")}</b>` : esc(x ?? "–")}</span>`; };
    return `<div class="sucmp"><p class="ls" style="margin:0 0 4px">${sum}</p>${few ? `<p class="ls" style="margin:0;color:var(--mu)">Still few laps, drive a few more for a safe answer.</p>` : ""}${secs}
      <div class="ch" style="margin:14px 0 6px"><b style="font-size:14px">Options · ${changed} changed</b><button class="b ghost sm" data-su="only">${SU.only ? "Show all options" : "Only changes"}</button></div>
      ${L.length ? L.map(ar => `<div class="suarea"><h6>${esc(ar.area)}</h6>${ar.rows.map(r => `<div class="surow"><span>${esc(r.label)}</span><div class="suv">${r.cells.map(cell).join("")}</div></div>`).join("")}</div>`).join("") : `<p class="mu" style="margin:0">Both setups have the same options.</p>`}</div>`;
  }

  // ---------- Setups page: every setup in one place, laid out like the game's menu ----------
  // Left: your setups by car. Right: the chosen setup with its areas as tabs,
  // every option with − / + steppers, wheel values drawn on a car, its times
  // and a comparison with another setup. Changes are saved as you type.
  const SP = { game: "", sel: "", area: "", all: false, cmp: "" };
  try { Object.assign(SP, JSON.parse(localStorage.getItem("lapbook.setupsPage") || "{}")); } catch (e) {}
  const keepSP = () => { try { localStorage.setItem("lapbook.setupsPage", JSON.stringify({ game: SP.game, sel: SP.sel })); } catch (e) {} };
  const lapsOf = id => D.lapTimes.filter(l => l.setup === id);
  const SRC = { file: "saved file", telemetry: "from the game", manual: "typed in" };
  function setupsPage() {
    const list = allSetups(), games = [...new Set(list.map(s => s.game))];
    if (SP.game && !games.includes(SP.game)) SP.game = "";
    const shown = list.filter(s => !SP.game || s.game === SP.game);
    let cur = setupById(SP.sel);
    if (!cur || (SP.game && cur.game !== SP.game)) cur = shown[0] || null;
    if (cur) SP.sel = cur.id;
    const cars = [...new Set(shown.map(s => s.game + "|" + s.car))];
    const isActive = s => Object.entries(ACTIVE).some(([k, v]) => v === s.id && k.startsWith(s.game + "|" + s.car + "|"));
    const left = `<section class="card spl"><div class="ch"><h2>Your setups</h2><button class="b pri sm" data-sp="new">+ New setup</button></div>
      ${games.length > 1 ? `<div class="oseg" style="margin-bottom:12px"><button data-sp="game" data-v="" class="${SP.game ? "" : "on"}">All</button>${games.map(g => `<button data-sp="game" data-v="${esc(g)}" class="${SP.game === g ? "on" : ""}">${esc(g === F1 ? "F1 25" : abbr(g))}</button>`).join("")}</div>` : ""}
      ${cars.map(k => { const [g, car] = k.split("|"); const ss = shown.filter(s => s.game === g && s.car === car); return `<div class="spg"><div class="spgh"><b>${esc(car)}</b><small>${esc(g)}</small></div>${ss.map(s => { const L = lapsOf(s.id), b = L.length ? Math.min(...L.map(l => l.timeInMs)) : 0; return `<button class="sprow ${cur && cur.id === s.id ? "on" : ""}" data-sp="sel" data-id="${esc(s.id)}"><span><b>${esc(s.name)}${isActive(s) ? '<i class="spact">active</i>' : ""}</b><small>${esc(s.track || "every circuit")} · ${SRC[s.source] || ""}</small></span><span class="tm ${b ? "pb" : ""}">${b ? fmt(b) : "–"}<small>${L.length} lap${L.length === 1 ? "" : "s"}</small></span></button>`; }).join("")}</div>`; }).join("") || `<p class="mu" style="margin:0">No setups yet. Create one with “+ New setup”, or drive: Assetto Corsa and ACC take your saved setup files, F1 25 sends its setup by itself.</p>`}
    </section>`;
    return `<div class="ph"><h1>Setups</h1><span class="mu">Every setup with all its options. Pick one before you drive, compare them afterwards.</span></div>
      <div class="spw">${left}<div class="spr">${cur ? setupDetail(cur) : `<section class="card"><h2 style="margin-top:0">How it works</h2><ol class="steps"><li><i>1</i><span><b>Before you drive:</b> pick the setup for your car and circuit (here, or in the live card under “Setup”).</span></li><li><i>2</i><span><b>While you drive:</b> every lap remembers the setup.</span></li><li><i>3</i><span><b>Afterwards:</b> see which setup was faster, in which sector and what you changed.</span></li></ol></section>`}</div></div>`;
  }
  // one value field with − and + (the step follows the value: 26.5 steps 0.1, 7 steps 1)
  const stepOf = v => { const t = String(v ?? ""); const d = t.includes(".") ? t.split(".")[1].length : 0; return d ? 10 ** -Math.min(d, 2) : 1; };
  const field = (key, v, label) => `<span class="spf"><button data-sp="dec" data-k="${esc(key)}" tabindex="-1" aria-label="less">−</button><input data-spk="${esc(key)}" value="${esc(v ?? "")}" inputmode="decimal" placeholder="–" aria-label="${esc(label)}"><button data-sp="inc" data-k="${esc(key)}" tabindex="-1" aria-label="more">+</button></span>`;
  function setupDetail(s) {
    const keys = [...new Set([...(SP.all || !Object.keys(s.values || {}).length ? SC.template(s.game) : []), ...Object.keys(s.values || {})])];
    const L = SC.layout(s.game, keys), filled = a => a.rows.reduce((n, r) => n + r.cells.filter(c => s.values[c.key] !== undefined && s.values[c.key] !== "").length, 0);
    if (!L.some(a => a.area === SP.area)) SP.area = L[0] ? L[0].area : "";
    const area = L.find(a => a.area === SP.area), laps = lapsOf(s.id), st = laps.length ? statsOf(laps) : null;
    const others = setupsFor(s.game, s.car).filter(x => x.id !== s.id), oL = D.lapTimes.filter(l => l.game === s.game && l.car === s.car && l.setup && l.setup !== s.id && setupById(l.setup) && (!s.track || l.track === s.track));
    const ob = oL.length ? oL.reduce((m, l) => (l.timeInMs < m.timeInMs ? l : m)) : null;
    const tracks = [...new Set([...(D.tracks[s.game] || []), ...(s.track ? [s.track] : [])])];
    const wheelCard = r => { const by = Object.fromEntries(r.cells.map(c => [c.wheel, c])); return `<div class="spcar">${["FL", "FR"].map(w => by[w] ? `<label><small>${w}</small>${field(by[w].key, s.values[by[w].key], r.label + " " + w)}</label>` : "<span></span>").join("")}<span class="spbody"></span>${["RL", "RR"].map(w => by[w] ? `<label><small>${w}</small>${field(by[w].key, s.values[by[w].key], r.label + " " + w)}</label>` : "<span></span>").join("")}</div>`; };
    const rowHtml = r => {
      const wheels = r.cells.length === 4 && r.cells.every(c => SC.WHEELS.includes(c.wheel));
      return `<div class="spo ${wheels ? "w4" : ""}"><span class="spl2">${esc(r.label)}${r.unit ? `<small>${esc(r.unit)}</small>` : ""}</span>${wheels ? wheelCard(r) : `<div class="spcells">${r.cells.map(c => `<label>${c.wheel ? `<small>${esc(c.wheel)}</small>` : ""}${field(c.key, s.values[c.key], r.label + " " + c.wheel)}</label>`).join("")}</div>`}</div>`;
    };
    const cmp = setupById(SP.cmp);
    return `<section class="card spd" data-setup="${esc(s.id)}">
      <div class="sph"><input class="spname" data-spn="name" value="${esc(s.name)}" aria-label="Setup name" maxlength="60">
        <div class="spbtn"><button class="b pri" data-sp="use" data-id="${esc(s.id)}">Use for the next session</button><button class="b" data-sp="dup" data-id="${esc(s.id)}">Duplicate</button><button class="b ghost" data-sp="del" data-id="${esc(s.id)}">Delete</button></div></div>
      <div class="spmeta"><span>${esc(s.game)}</span><span>${esc(s.car)}</span><label>Circuit <select data-spn="track"><option value="">every circuit</option>${tracks.map(t => `<option ${t === s.track ? "selected" : ""}>${esc(t)}</option>`).join("")}</select></label><span>${esc(SRC[s.source] || "")}${s.file ? ` · ${esc(String(s.file).split(/[\\\\/]/).pop())}` : ""}</span></div>
      <div class="rcp spres">${st ? `<div><b class="pb">${fmt(st.best)}</b><span>best lap</span></div><div><b>${fmt(st.avg)}</b><span>average</span></div><div><b>±${(st.sd / 1000).toFixed(3)}</b><span>spread</span></div><div><b>${st.n}</b><span>laps</span></div>${ob ? `<div><b class="${st.best - ob.timeInMs < 0 ? "up" : "dn"}">${sg3(st.best - ob.timeInMs)}</b><span>vs. ${esc(setupById(ob.setup).name)}</span></div>` : ""}` : `<div><b>–</b><span>no laps with this setup yet</span></div>`}</div>
      <div class="sptabs">${L.map(a => { const n = filled(a); return `<button data-sp="area" data-v="${esc(a.area)}" class="${a.area === SP.area ? "on" : ""}">${esc(a.area)}${n ? `<small>${n}</small>` : ""}</button>`; }).join("")}</div>
      <div class="spopts">${area ? area.rows.map(rowHtml).join("") : ""}</div>
      <div class="spfoot"><label class="spall"><span class="sw ${SP.all ? "on" : ""}" data-sp="all" role="switch"></span> Show every option of ${esc(s.game)}${SP.all ? "" : " (now: only the ones this setup has)"}</label>
        ${SC.kind(s.game) === "ac" || SC.kind(s.game) === "generic" ? `<span class="add" style="margin:0"><input id="spxk" placeholder="Extra option (mod cars)"><input id="spxv" placeholder="Value" style="max-width:100px"><button class="b sm" data-sp="addopt">Add</button></span>` : ""}</div>
      <label style="margin-top:12px">Notes<textarea data-spn="notes" rows="2" style="min-height:0;height:64px;font-family:inherit" placeholder="What you changed and why, for example: more rear wing for sector 2">${esc(s.notes || "")}</textarea></label>
      <div class="spcmp"><div class="ch"><h3 style="margin:0">Compare</h3><select data-spn="cmp"><option value="">with another setup…</option>${others.map(o => `<option value="${esc(o.id)}" ${cmp && cmp.id === o.id ? "selected" : ""}>${esc(o.name)}${o.track ? " · " + esc(o.track) : ""}</option>`).join("")}</select></div>
        ${cmp ? pageCompare(cmp, s) : `<p class="mu" style="margin:0;font-size:14px">${others.length ? "Pick a setup to see the times and every option that differs." : "Create a second setup for this car to compare."}</p>`}</div>
    </section>`;
  }
  // times (if both have laps) and every option that differs
  function pageCompare(A, Bx) {
    const la = lapsOf(A.id), lb = lapsOf(Bx.id), va = A.values || {}, vb = Bx.values || {};
    const keys = [...new Set([...Object.keys(va), ...Object.keys(vb)])], same = k => String(va[k] ?? "") === String(vb[k] ?? "");
    const L = SC.layout(Bx.game, keys).map(ar => ({ ...ar, rows: ar.rows.filter(r => r.cells.some(c => !same(c.key))) })).filter(ar => ar.rows.length);
    let times = "";
    if (la.length && lb.length) {
      const a = statsOf(la), b = statsOf(lb), d = b.best - a.best, da = b.avg - a.avg;
      times = `<p class="ls" style="margin:6px 0 10px"><b>${esc(Bx.name)}</b> vs. <b>${esc(A.name)}</b>: best lap <b class="${d < 0 ? "up" : "dn"}">${sg3(d)}</b>, average <b class="${da < 0 ? "up" : "dn"}">${sg3(da)}</b> (${b.n} vs. ${a.n} laps)${a.secs && b.secs ? `, sectors ${b.secs.map((x, i) => `<b class="${x - a.secs[i] < 0 ? "up" : "dn"}">${sg3(x - a.secs[i])}</b>`).join(" / ")}` : ""}.</p>`;
    } else times = `<p class="ls" style="margin:6px 0 10px;color:var(--mu)">Times show up once both setups have laps.</p>`;
    return times + (L.length ? L.map(ar => `<div class="suarea"><h6>${esc(ar.area)}</h6>${ar.rows.map(r => `<div class="surow"><span>${esc(r.label)}</span><div class="suv">${r.cells.filter(c => !same(c.key)).map(c => `<span class="ch">${c.wheel ? `<small>${esc(c.wheel)}</small>` : ""}${esc(va[c.key] ?? "–")} <i>→</i> <b>${esc(vb[c.key] ?? "–")}</b></span>`).join("")}</div></div>`).join("")}</div>`).join("") : `<p class="mu" style="margin:0">Both setups have the same options.</p>`);
  }
  // typing: saved right away, the page is not redrawn while you type
  let spTimer = 0;
  document.addEventListener("input", e => {
    const el = e.target, card = el.closest && el.closest("[data-setup]");
    if (!card) return;
    const s = setupById(card.dataset.setup);
    if (!s) return;
    if (el.dataset.spk) { const v = el.value.trim(); if (v === "") delete s.values[el.dataset.spk]; else s.values[el.dataset.spk] = isFinite(Number(v)) ? Number(v) : v; s.vkey = vkey(s.values); }
    else if (el.dataset.spn === "name") { if (el.value.trim()) s.name = el.value.trim(); }
    else if (el.dataset.spn === "notes") s.notes = el.value;
    else return;
    clearTimeout(spTimer);
    spTimer = setTimeout(() => { save(); sidebar(); }, 400);
  });
  document.addEventListener("change", e => {
    const el = e.target, card = el.closest && el.closest("[data-setup]");
    if (!card) return;
    const s = setupById(card.dataset.setup);
    if (!s) return;
    if (el.dataset.spn === "track") { s.track = el.value; save(); }
    if (el.dataset.spn === "cmp") SP.cmp = el.value;
    // values are saved while typing; redrawing here would swallow the next click
    if (el.dataset.spn === "track" || el.dataset.spn === "cmp") { save(); render(); }
  });
  document.addEventListener("click", async e => {
    const t = e.target.closest("[data-sp]");
    if (!t) return;
    const k = t.dataset.sp, card = t.closest("[data-setup]"), s = card && setupById(card.dataset.setup);
    if (k === "game") { SP.game = t.dataset.v; SP.sel = ""; keepSP(); render(); }
    if (k === "sel") { SP.sel = t.dataset.id; SP.cmp = ""; keepSP(); render(); }
    if (k === "area") { SP.area = t.dataset.v; render(); }
    if (k === "all") { SP.all = !SP.all; render(); }
    if ((k === "inc" || k === "dec") && s) {
      const key = t.dataset.k, cur = s.values[key], n = Number(cur), step = stepOf(cur);
      const v = cur === undefined || cur === "" || !isFinite(n) ? (k === "inc" ? 1 : 0) : Math.round((n + (k === "inc" ? step : -step)) * 1000) / 1000;
      s.values[key] = v; s.vkey = vkey(s.values); save();
      const inp = card.querySelector(`[data-spk="${CSS.escape(key)}"]`);
      if (inp) inp.value = v;
      const tab = card.querySelector(".sptabs .on small"); if (tab) tab.textContent = String(card.querySelectorAll(".spopts input").length && [...card.querySelectorAll(".spopts input")].filter(i => i.value !== "").length);
    }
    if (k === "use" && s) {
      const track = s.track || (S.t && D.tracks[s.game] && D.tracks[s.game].includes(S.t) ? S.t : "") || ((LAST && LAST.g === s.game) ? LAST.t : "");
      if (!track) return toast("Pick the circuit of this setup first");
      setActive(s.game, s.car, track, s.id); render(); toast(`${s.name} is used for ${s.car} at ${track}. New laps count for it.`);
    }
    if (k === "dup" && s) { const c = { ...s, id: uid(), name: s.name + " copy", values: { ...s.values }, source: "manual", file: "", created: today() }; delete c.fileKey; allSetups().push(c); save(); SP.sel = c.id; keepSP(); render(); toast("Copy created: change what you like"); }
    if (k === "del" && s) { if (!t.dataset.armed) { t.dataset.armed = "1"; t.textContent = "Really delete?"; return; } D.setups = allSetups().filter(x => x.id !== s.id); tomb("su:" + s.id); D.lapTimes.forEach(l => { if (l.setup === s.id) delete l.setup; }); save(); SP.sel = ""; render(); toast("Setup deleted, its laps keep their times"); }
    if (k === "addopt" && s) { const key = ($("#spxk").value || "").trim(), v = ($("#spxv").value || "").trim(); if (!key) return; const kk = SC.kind(s.game) === "ac" ? key.toUpperCase().replace(/\s+/g, "_") : "x:" + key; s.values[kk] = isFinite(Number(v)) && v !== "" ? Number(v) : v; s.vkey = vkey(s.values); save(); SP.area = SC.describe(s.game, kk).area; render(); }
    if (k === "new") openNewSetup();
    if (k === "create") createSetup();
  });
  // new setup: game, car, circuit, and what to start from
  async function openNewSetup(pre) {
    const p = pre || {}, gs = GM.filter(g => g !== "Forza Horizon 5" || true), g = p.game || SP.game || (LAST && LAST.g) || F1;
    const cars = D.cars[g] || [], tracks = D.tracks[g] || [];
    $("#modal").innerHTML = `<div class="ov"><div class="md" id="spn"><h3>New setup</h3>
      <label>Game<select id="spng">${gs.map(x => `<option ${x === g ? "selected" : ""}>${esc(x)}</option>`).join("")}</select></label>
      <div class="two"><label>Car<input id="spnc" list="spncl" value="${esc(p.car || cars[cars.length - 1] || "")}" placeholder="for example Porsche 911 GT3 R"><datalist id="spncl">${cars.map(c => `<option value="${esc(c)}">`).join("")}</datalist></label>
      <label>Circuit<select id="spnt"><option value="">every circuit</option>${tracks.map(t => `<option ${t === p.track ? "selected" : ""}>${esc(t)}</option>`).join("")}</select></label></div>
      <label>Name<input id="spnn" placeholder="for example Monza low downforce" maxlength="60"></label>
      <label>Start from<select id="spnf"><option value="">empty: every option of the game</option></select></label>
      <p class="ls" id="spnh" style="color:var(--mu);margin:6px 0 0"></p>
      <div class="acts" style="margin-top:14px"><button class="b pri" data-sp="create">Create setup</button><button class="b ghost" data-act="closem">Cancel</button></div></div></div>`;
    $("#spng").onchange = () => openNewSetup({ game: $("#spng").value });
    const fill = async () => {
      const game = $("#spng").value, car = $("#spnc").value.trim(), track = $("#spnt").value, sel = $("#spnf");
      const own = setupsFor(game, car);
      let files = [];
      if (FILE_GAMES.includes(game) && B.setupsList && car && track) files = (await B.setupsList({ game, car, track })).list || [];
      NEWF = files;
      sel.innerHTML = `<option value="">empty: every option of the game</option>${files.map((f, i) => `<option value="f${i}">saved file: ${esc(f.name)}</option>`).join("")}${own.map(o => `<option value="s${o.id}">copy of: ${esc(o.name)}</option>`).join("")}`;
      $("#spnh").textContent = FILE_GAMES.includes(game) ? (files.length ? `${files.length} saved setup file${files.length === 1 ? "" : "s"} found for this car and circuit.` : "Saved setup files show up here once you drove this car on this circuit with live tracking.") : "";
    };
    $("#spnc").onchange = fill; $("#spnt").onchange = fill;
    fill();
  }
  let NEWF = [];
  function createSetup() {
    const game = $("#spng").value, car = $("#spnc").value.trim(), track = $("#spnt").value, name = $("#spnn").value.trim(), from = $("#spnf").value;
    if (!car) return toast("Enter the car first");
    const src = from[0] === "f" ? NEWF[Number(from.slice(1))] : from[0] === "s" ? setupById(from.slice(1)) : null;
    let s;
    if (src && from[0] === "f") { s = setupFromFile(game, car, track, src); if (name) s.name = name; }
    else { s = { id: uid(), game, car, track, name: name || (src ? src.name + " copy" : `${track || car} setup`), values: src ? { ...src.values } : {}, notes: "", source: "manual", created: today() }; s.vkey = vkey(s.values); allSetups().push(s); }
    if (!D.cars[game]) D.cars[game] = [];
    if (!D.cars[game].includes(car)) D.cars[game].push(car);
    save();
    $("#modal").innerHTML = "";
    Object.assign(SP, { game: "", sel: s.id, all: !Object.keys(s.values).length, cmp: "" }); keepSP();
    S.v = "setups"; render(); scrollTo(0, 0);
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
      setup: (setupById(activeId(g, car, track)) || {}).name || "",
      best: b ? b.timeInMs : 0, record: rec ? rec.timeInMs : 0, recordCar: rec && rec.car !== car ? rec.car : "", laps: added[g],
    });
  }

  // ---------- overlay panel: style, what it shows, look, position ----------
  // Built once; every change only updates the controls and the previews, so
  // nothing flickers while you click through the options.
  const OV_STYLES = [
    ["clean", "Clean", "Calm panel, time and delta first"],
    ["broadcast", "Broadcast", "TV graphics with a team band"],
    ["glass", "Glass", "Light, airy and rounded"],
    ["minimal", "Minimal", "No panel, floating numbers"],
    ["strip", "Strip", "One thin row for a screen edge"],
    ["compact", "Compact", "Only lap time and delta"],
  ];
  const OV_SHOW = [["head", "Circuit and car", "name of the circuit and your car"], ["position", "Race position", "P4/20 in races"], ["delta", "Delta", "live gap to your best lap"], ["sectors", "Sectors", "purple, green, yellow like on TV"], ["foot", "Best and last lap", "with the gap of the last lap"], ["setup", "Setup name", "the setup you drive with, next to the car"]];
  const OV_ACCENTS = [["team", "Team", "conic-gradient(#ff8000 0 25%,#3671c6 0 50%,#e8002d 0 75%,#27f4d2 0)"], ["red", "Red", "#ff3030"], ["white", "White", "#f5f5f7"], ["blue", "Blue", "#3d8bff"], ["green", "Green", "#2fe07f"], ["yellow", "Yellow", "#ffd12a"], ["purple", "Purple", "#b45bff"], ["none", "None", "repeating-linear-gradient(135deg,#555 0 2px,transparent 2px 6px)"]];
  const OV_SAMPLE = {
    d: { game: "F1 25", live: true, track: "Monza", car: "McLaren MCL40", best: 80123, last: 80456, prevBest: 80250 },
    live: { game: "F1 25", t: 41234, delta: -123, sectors: [{ t: 26123, c: "purple" }, { t: 15111, c: "green" }, { t: 0 }], position: 3, cars: 20 },
  };
  const seg = (k, list, cur) => `<div class="oseg">${list.map(([v, n]) => `<button data-ov="${k}" data-v="${v}" class="${String(cur) === String(v) ? "on" : ""}">${n}</button>`).join("")}</div>`;
  const ovShow = o => ({ head: true, delta: true, sectors: true, foot: true, position: true, deltaBar: false, setup: false, ...(o.show || {}) });
  function ovIsOn(k, v, o) {
    const sh = ovShow(o);
    if (k === "layout") return (o.layout || "clean") === v;
    if (k === "show") return !!sh[v];
    if (k === "dstyle") return (v === "bar") === !!sh.deltaBar;
    if (k === "accent") return (o.accent || "team") === v;
    if (k === "scale") return Math.abs((o.scale || 1) - Number(v)) < 0.01;
    if (k === "opacity") return Math.abs((o.opacity || 0.86) - Number(v)) < 0.01;
    if (k === "corners") return (o.corners || "round") === v;
    if (k === "font") return (o.font || "saira") === v;
    if (k === "anchor") return !o.bounds && o.anchor === v;
    if (k === "on") return !!o.on;
    return false;
  }
  async function openOverlayPanel() {
    const o = await B.getOverlay();
    st.settings.overlay = o;
    header();
    const sh = ovShow(o), grid = ["tl", "tc", "tr", "ml", "mc", "mr", "bl", "bc", "br"];
    $("#modal").innerHTML = `<div class="ov"><div class="md" id="ovp">
      <header class="oph">
        <div><h3>In-game overlay</h3><p>Shows over the game in <b>borderless</b> or <b>windowed fullscreen</b></p></div>
        <div class="oph-r"><span class="kbd">Ctrl+Shift+O</span><span class="swb"><b id="ovstate">${o.on ? "On" : "Off"}</b><span class="sw ${o.on ? "on" : ""}" data-ov="on" role="switch"></span></span><button class="ox" data-act="closem" title="Close">✕</button></div>
      </header>
      <div class="opg">
        <aside class="opl">
          <div class="ovstage" id="ovstage"><div class="ovwrap" id="ovwrap"><iframe id="ovpf" src="overlay.html" tabindex="-1"></iframe></div><span class="ovtag">Preview · example data</span></div>
          <div class="opc"><h5>Position on screen</h5>
            <div class="posrow"><div class="ovmon">${grid.map(g => `<button data-ov="anchor" data-v="${g}" class="c-${g} ${ovIsOn("anchor", g, o) ? "on" : ""}" title="${g}"><i></i></button>`).join("")}<span class="ovstand"></span></div>
              <div class="posside"><div class="ovnudge"><span></span><button data-ov="nudge" data-v="0,-20" title="Up">↑</button><span></span><button data-ov="nudge" data-v="-20,0" title="Left">←</button><button data-ov="nudge" data-v="0,20" title="Down">↓</button><button data-ov="nudge" data-v="20,0" title="Right">→</button></div>
              <small>Pick a spot on the screen, then fine-tune with the arrows.</small></div></div>
            ${o.displays && o.displays.length > 1 ? `<label class="osel">Screen<select id="ovdisp">${o.displays.map(x => `<option value="${x.id}" ${x.id === o.display ? "selected" : ""}>${esc(x.label)}</option>`).join("")}</select></label>` : ""}</div>
          <div class="opc"><h5>Move it while you drive</h5>
            <ol class="okeys"><li><span class="kbd">Ctrl+Shift+L</span> unlocks it, it gets a red frame</li><li>drag it with the mouse or use <span class="kbd">Ctrl+Shift+arrows</span></li><li><span class="kbd">Ctrl+Shift+L</span> again locks it, clicks go to the game</li></ol>
            <button class="b" data-ov="locked" id="ovlock">${o.locked ? "Unlock to drag with the mouse" : "Lock it"}</button></div>
        </aside>
        <div class="opr">
          <section class="ops"><h5>Style</h5><div class="ostg">${OV_STYLES.map(([v, n, dsc]) => `<button class="stc ${ovIsOn("layout", v, o) ? "on" : ""}" data-ov="layout" data-v="${v}"><span class="stt"><span class="stw" data-thumb="${v}"><iframe src="overlay.html" tabindex="-1" data-thumbf="${v}"></iframe></span></span><b>${n}</b><small>${dsc}</small></button>`).join("")}</div></section>
          <section class="ops"><h5>What it shows</h5><div class="otl">${OV_SHOW.map(([k2, n, dsc]) => `<div class="otr" data-row="${k2}"><span><b>${n}</b><small>${dsc}</small></span><span class="sw ${sh[k2] ? "on" : ""}" data-ov="show" data-v="${k2}" role="switch"></span></div>`).join("")}</div></section>
          <section class="ops two"><div><h5>Delta</h5>${seg("dstyle", [["num", "Number"], ["bar", "Number + bar"]], sh.deltaBar ? "bar" : "num")}</div><div><h5>Corners</h5>${seg("corners", [["round", "Rounded"], ["sharp", "Sharp"]], o.corners || "round")}</div></section>
          <section class="ops"><h5>Accent colour</h5><div class="osw">${OV_ACCENTS.map(([v, n, c]) => `<button data-ov="accent" data-v="${v}" class="${ovIsOn("accent", v, o) ? "on" : ""}" title="${n}"><i style="background:${c}"></i><small>${n}</small></button>`).join("")}</div></section>
          <section class="ops two"><div><h5>Size</h5>${seg("scale", [[0.9, "S"], [1.15, "M"], [1.4, "L"], [1.75, "XL"]], [0.9, 1.15, 1.4, 1.75].find(x => Math.abs((o.scale || 1) - x) < 0.01) || "")}</div><div><h5>Font</h5>${seg("font", [["saira", "Sport"], ["sans", "Clean"], ["mono", "Mono"]], o.font || "saira")}</div></section>
          <section class="ops"><h5>Background</h5>${seg("opacity", [[0.6, "See-through"], [0.86, "Normal"], [0.97, "Solid"]], [0.6, 0.86, 0.97].find(x => Math.abs((o.opacity || 0.86) - x) < 0.01) || "")}</section>
        </div>
      </div></div></div>`;
    document.querySelectorAll("#ovp iframe").forEach(f => (f.onload = () => feedPreviews(st.settings.overlay)));
    const dsel = $("#ovdisp");
    if (dsel) dsel.onchange = async () => { st.settings.overlay = await B.setOverlay({ on: true, display: Number(dsel.value) }); syncPanel(st.settings.overlay); };
    feedPreviews(o);
  }
  // size and data of the big preview and of the style thumbnails
  function feedPreviews(o) {
    const pf = $("#ovpf"), stage = $("#ovstage"), wrap = $("#ovwrap");
    if (pf && stage && wrap) {
      const sz = o.size || { width: 440, height: 190 }, f = Math.min(1, (stage.clientWidth - 32) / sz.width, (stage.clientHeight - 48) / sz.height);
      Object.assign(pf.style, { width: sz.width + "px", height: sz.height + "px", transform: `scale(${f})` });
      Object.assign(wrap.style, { width: sz.width * f + "px", height: sz.height * f + "px" });
      if (pf.contentWindow) pf.contentWindow.postMessage({ cfg: { ...o, locked: true }, ...OV_SAMPLE }, "*");
    }
    document.querySelectorAll("#ovp [data-thumbf]").forEach(fr => {
      const l = fr.dataset.thumbf, sz = (o.sizes && o.sizes[l]) || { width: 380, height: 190 }, box = fr.parentNode.parentNode;
      const f = Math.min((box.clientWidth - 16) / sz.width, (box.clientHeight - 14) / sz.height);
      Object.assign(fr.style, { width: sz.width + "px", height: sz.height + "px", transform: `scale(${f})` });
      Object.assign(fr.parentNode.style, { width: sz.width * f + "px", height: sz.height * f + "px" });
      if (fr.contentWindow) fr.contentWindow.postMessage({ cfg: { ...o, layout: l, scale: 1, locked: true }, ...OV_SAMPLE }, "*");
    });
  }
  // after a change: mark the chosen options, keep everything else in place
  function syncPanel(o) {
    if (!$("#ovp")) return;
    document.querySelectorAll("#ovp [data-ov]").forEach(el => {
      const k = el.dataset.ov;
      if (["nudge", "locked"].includes(k)) return;
      el.classList.toggle("on", ovIsOn(k, el.dataset.v, o));
    });
    const sh = ovShow(o), compact = o.layout === "compact";
    // compact shows only the delta
    document.querySelectorAll("#ovp .otr").forEach(r => r.classList.toggle("off", compact && r.dataset.row !== "delta"));
    $("#ovstate").textContent = o.on ? "On" : "Off";
    $("#ovlock").textContent = o.locked ? "Unlock to drag with the mouse" : "Lock it";
    feedPreviews(o);
    header();
  }
  document.addEventListener("click", async e => {
    const t = e.target.closest("[data-ov]");
    if (!t) return;
    e.stopPropagation();
    const k = t.dataset.ov, v = t.dataset.v, next = {}, cur = st.settings.overlay || {};
    if (k === "on") next.on = !cur.on;
    else if (k === "locked") next.locked = !cur.locked;
    else if (k === "layout" || k === "accent" || k === "corners" || k === "font") next[k] = v;
    else if (k === "scale" || k === "opacity") next[k] = Number(v);
    else if (k === "anchor") next.anchor = v;
    else if (k === "show") next.show = { [v]: !ovShow(cur)[v] };
    else if (k === "dstyle") next.show = { deltaBar: v === "bar" };
    else if (k === "nudge") next.nudge = v.split(",").map(Number);
    if (k !== "on") next.on = true; // changing it shows it
    st.settings.overlay = await B.setOverlay(next);
    syncPanel(st.settings.overlay);
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
    header(); placeCard(); overlayFeed(); liveFiles();
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
    const su = activeId(G, l.car, l.track);
    if (su) lap.setup = su;
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
