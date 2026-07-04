import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft, ChevronRight, Trophy, Car, MapPin, Plus, X, Clock,
  Zap, User, Flag, Timer, Trash2, Medal, Award, Crown, Check, Lock,
  CalendarDays, Users, Star, Sparkles, StickyNote, ChevronDown, ChevronUp, Heart,
  ListOrdered, Thermometer, Shield,
  Download, Upload, TrendingUp, DollarSign, Shuffle, RefreshCw,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const GAMES = ["F1 25","Assetto Corsa","Assetto Corsa Competizione","Forza Horizon 6","Forza Horizon 5","Project Cars 2"];
const FORZA_GAMES = new Set(["Forza Horizon 6","Forza Horizon 5"]);

const GAME_COLORS = {
  "F1 25":                       { from:"#E8001D", to:"#8B0010",  accent:"#E8001D" },
  "Assetto Corsa":               { from:"#1A1A2E", to:"#16213E",  accent:"#00E5A0" },
  "Assetto Corsa Competizione":  { from:"#0F3460", to:"#0A1628",  accent:"#4FC3F7" },
  "Forza Horizon 6":             { from:"#6A0572", to:"#2D0134",  accent:"#E040FB" },
  "Forza Horizon 5":             { from:"#E65100", to:"#8C3200",  accent:"#FFB300" },
  "Project Cars 2":              { from:"#1B5E20", to:"#0A2810",  accent:"#69F0AE" },
};
const GAME_ABBR = {
  "F1 25":"F1","Assetto Corsa":"AC","Assetto Corsa Competizione":"ACC",
  "Forza Horizon 6":"FH6","Forza Horizon 5":"FH5","Project Cars 2":"PC2",
};
const FIA_POINTS = [25,18,15,12,10,8,6,4,2,1];

// ─── Weather / Tire config ────────────────────────────────────────────────────

const WEATHER_OPTIONS = [
  { value:"sun",  label:"Sonne",   icon:"☀️" },
  { value:"cloud",label:"Bewölkt", icon:"⛅" },
  { value:"rain", label:"Regen",   icon:"🌧️" },
];
const CONDITION_OPTIONS = [
  { value:"green", label:"Green", color:"#00E5A0" },
  { value:"opti",  label:"Opti",  color:"#FFD700" },
  { value:"damp",  label:"Damp",  color:"#4FC3F7" },
  { value:"wet",   label:"Wet",   color:"#60A5FA"  },
];
const TIRE_OPTIONS = [
  { value:"soft",  label:"Soft",         short:"S",  color:"#E8001D" },
  { value:"medium",label:"Medium",       short:"M",  color:"#FFD700" },
  { value:"hard",  label:"Hard",         short:"H",  color:"#E8E8E8" },
  { value:"inter", label:"Intermediate", short:"I",  color:"#00E5A0" },
  { value:"wet",   label:"Wet",          short:"W",  color:"#4FC3F7" },
  { value:"street",label:"Street",       short:"ST", color:"#E040FB" },
];

function TireChip({ tireVal, small=false }) {
  const t = TIRE_OPTIONS.find(x=>x.value===tireVal);
  if (!t) return null;
  const sz = small ? "text-[9px] px-1.5 py-0.5" : "text-[10px] px-2 py-0.5";
  return (
    <span className={`font-mono font-black rounded ${sz}`} style={{background:t.color+"22",color:t.color,border:`1px solid ${t.color}40`}}>
      {t.short}
    </span>
  );
}
function WeatherChip({ weatherVal, condVal, small=false }) {
  const w = WEATHER_OPTIONS.find(x=>x.value===weatherVal);
  const c = CONDITION_OPTIONS.find(x=>x.value===condVal);
  const sz = small ? "text-[9px] gap-0.5" : "text-[10px] gap-1";
  return (
    <span className={`inline-flex items-center font-mono ${sz}`}>
      {w && <span>{w.icon}</span>}
      {c && <span className="font-semibold" style={{color:c.color}}>{c.label}</span>}
    </span>
  );
}

// ─── Tire recommendation logic ────────────────────────────────────────────────

function recommendTire(weather, condition, asphaltTemp, game) {
  const isForza = FORZA_GAMES.has(game);
  if (weather==="rain" || condition==="wet")  return { tire:"wet",   reason:"Nasse Strecke → Wet-Reifen zwingend" };
  if (condition==="damp")                     return { tire:"inter", reason:"Feuchte Strecke → Intermediate empfohlen" };
  const t = parseFloat(asphaltTemp);
  if (!isNaN(t)) {
    if (t < 15)       return { tire:"soft",   reason:`Asphalt ${t}°C (kalt) → Soft wärmt schneller auf` };
    if (t <= 35)      return { tire:"medium", reason:`Asphalt ${t}°C → Medium ist optimal` };
    if (t > 35)       return { tire:"hard",   reason:`Asphalt ${t}°C (heiß) → Hard hält der Hitze stand` };
  }
  if (isForza)        return { tire:"street", reason:"Forza Horizon: Street-Reifen oft optimal" };
  return { tire:"medium", reason:"Standardbedingungen → Medium" };
}

// ─── Fan helpers ──────────────────────────────────────────────────────────────

function fanDelta(pos) {
  if (pos===1) return 5000; if (pos===2) return 3000; if (pos===3) return 1000;
  if (pos<=10) return 500;  return 100;
}
function champBonus(wmPos) {
  if (wmPos===1) return 50000; if (wmPos===2) return 25000; if (wmPos===3) return 10000; return 0;
}
function fmtFans(n) {
  if (n>=1e6) return `${(n/1e6).toFixed(1)}M`; if (n>=1000) return `${(n/1000).toFixed(1)}K`; return String(n);
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function parseTimeToMs(fmt) {
  const m = fmt.match(/^(\d{1,2}):(\d{2})\.(\d{1,3})$/);
  if (!m) return null;
  return parseInt(m[1],10)*60000 + parseInt(m[2],10)*1000 + parseInt(m[3].padEnd(3,"0"),10);
}
function msToFormatted(ms) {
  const mi=Math.floor(ms/60000), s=Math.floor((ms%60000)/1000), ml=ms%1000;
  return `${String(mi).padStart(2,"0")}:${String(s).padStart(2,"0")}.${String(ml).padStart(3,"0")}`;
}
function generateId() { return `${Date.now()}-${Math.random().toString(36).slice(2,7)}`; }
function fmtDate(d) { return new Date(d).toLocaleDateString("de-DE",{day:"2-digit",month:"short",year:"numeric"}); }

// ─── Championship helpers ─────────────────────────────────────────────────────

function computeStandings(champ) {
  const pts = {};
  for (const d of champ.drivers) pts[d] = 0;
  for (const race of champ.races)
    for (const [driver, pos] of Object.entries(race.results))
      pts[driver] = (pts[driver]||0) + (FIA_POINTS[pos-1]||0);
  return Object.entries(pts).sort((a,b) => b[1]-a[1]);
}
function computeTeamStandings(champ) {
  if (!champ.teams) return [];
  const pts = {};
  for (const team of champ.teams) pts[team.name] = 0;
  const standings = computeStandings(champ);
  for (const [driver, p] of standings) {
    for (const team of champ.teams) {
      if (team.drivers.includes(driver)) { pts[team.name] = (pts[team.name]||0) + p; break; }
    }
  }
  return Object.entries(pts).sort((a,b) => b[1]-a[1]);
}
function seasonDone(champ) {
  return champ.calendar.length > 0 && champ.races.length >= champ.calendar.length;
}
function driverTeam(champ, driver) {
  if (!champ.teams) return null;
  return champ.teams.find(t => t.drivers.includes(driver)) || null;
}

// ─── Rating & Market Value helpers ───────────────────────────────────────────

const RATING_MIN = 60;
const RATING_MAX = 99;

// Base market value (€) from rating
function ratingToValue(rating) {
  // 60→300k, 75→2M, 90→7M, 99→15M — exponential-ish
  return Math.round((Math.pow((rating - RATING_MIN) / (RATING_MAX - RATING_MIN), 2.2) * 14_700_000 + 300_000) / 50_000) * 50_000;
}

function fmtEuro(n) {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M €`;
  if (n >= 1_000)     return `${Math.round(n/1_000)}K €`;
  return `${n} €`;
}

function ratingColor(r) {
  if (r >= 90) return "text-yellow-400";
  if (r >= 80) return "text-emerald-400";
  if (r >= 70) return "text-blue-400";
  return "text-white/50";
}

// Rating delta after a race result (pos = finish position)
function ratingDelta(pos) {
  if (pos === 1)  return 2;
  if (pos <= 3)   return 1;
  if (pos <= 10)  return 0.5;
  if (pos <= 15)  return 0;
  return -0.5;
}

// Prize money per constructor standing position
const CONSTRUCTOR_PRIZE = [20_000_000, 14_000_000, 10_000_000, 7_000_000, 5_000_000, 3_500_000, 2_500_000, 1_500_000, 1_000_000, 500_000];

function constructorPrize(pos) {
  return CONSTRUCTOR_PRIZE[pos - 1] || 0;
}

// Initialise ratings object for a new championship's drivers
// Returns { [driverName]: { rating: number, value: number } }
function initDriverRatings(drivers, ebbysRating = 75) {
  const ratings = {};
  for (const d of drivers) {
    const r = d === "Ebby G"
      ? Math.min(RATING_MAX, Math.max(RATING_MIN, ebbysRating))
      : Math.round(65 + Math.random() * 20); // 65–85 for AI
    ratings[d] = { rating: r, value: ratingToValue(r) };
  }
  return ratings;
}

// Apply one race's results to ratings; returns updated ratings object
function applyRaceToRatings(ratings, results) {
  const next = { ...ratings };
  for (const [driver, pos] of Object.entries(results)) {
    if (!next[driver]) continue;
    const delta = ratingDelta(pos);
    const newRating = Math.min(RATING_MAX, Math.max(RATING_MIN, +(next[driver].rating + delta).toFixed(1)));
    const valueDelta = pos <= 3 ? 250_000 : pos <= 10 ? 100_000 : 0;
    const newValue = Math.max(300_000, next[driver].value + valueDelta);
    next[driver] = { rating: newRating, value: newValue };
  }
  return next;
}

// Do 1-2 random AI driver swaps between teams (not Ebby G)
function aiRandomTransfers(teams, ratings) {
  const newTeams = teams.map(t => ({ ...t, drivers: [...t.drivers] }));
  const aiDrivers = [];
  for (const t of newTeams) {
    for (const d of t.drivers) {
      if (d !== "Ebby G") aiDrivers.push({ driver: d, team: t.name });
    }
  }
  if (aiDrivers.length < 2) return newTeams;
  // pick 1-2 pairs to swap
  const swapCount = Math.random() > 0.5 ? 2 : 1;
  const log = [];
  for (let i = 0; i < swapCount; i++) {
    const idx1 = Math.floor(Math.random() * aiDrivers.length);
    let idx2 = Math.floor(Math.random() * aiDrivers.length);
    while (idx2 === idx1 || aiDrivers[idx1].team === aiDrivers[idx2].team) {
      idx2 = (idx2 + 1) % aiDrivers.length;
    }
    const d1 = aiDrivers[idx1], d2 = aiDrivers[idx2];
    // swap in teams array
    for (const t of newTeams) {
      if (t.name === d1.team) { t.drivers = t.drivers.map(d => d === d1.driver ? d2.driver : d); }
      if (t.name === d2.team) { t.drivers = t.drivers.map(d => d === d2.driver ? d1.driver : d); }
    }
    // update references for further swaps
    const tmp = aiDrivers[idx1].team;
    aiDrivers[idx1].team = aiDrivers[idx2].team;
    aiDrivers[idx2].team = tmp;
    log.push(`${d1.driver} ⇄ ${d2.driver}`);
  }
  return { newTeams, log };
}

// ─── localStorage persistence ─────────────────────────────────────────────────
//
// This is the single source of truth for saving/loading app data. Everything
// (tracks, cars, lap times, races, championships, fan count, setup notes) is
// serialized as JSON into the browser's localStorage under the keys below.
// It's read once on startup (loadState) and re-written on every state change
// (saveState, wired up via a useEffect in the root App component further down).

const INITIAL_TRACKS   = { "Assetto Corsa":["Spa-Francorchamps","Nürburgring Nordschleife"] };
const INITIAL_CARS     = { "Assetto Corsa":["BMW M4 GT3","Porsche Cayman GT4","Ferrari 499P"] };
const INITIAL_LAP_TIMES = [
  {id:"i1",game:"Assetto Corsa",track:"Spa-Francorchamps",car:"BMW M4 GT3",       timeInMs:110000,formattedTime:"01:50.000",date:"2025-06-01"},
  {id:"i2",game:"Assetto Corsa",track:"Spa-Francorchamps",car:"Porsche Cayman GT4",timeInMs:115000,formattedTime:"01:55.000",date:"2025-06-02"},
  {id:"i3",game:"Assetto Corsa",track:"Spa-Francorchamps",car:"Ferrari 499P",      timeInMs: 96000,formattedTime:"01:36.000",date:"2025-06-03"},
];

const LS = {
  tracks:"srt_tracks",cars:"srt_cars",lapTimes:"srt_lapTimes",
  races:"srt_races",championships:"srt_championships",
  fans:"srt_fans",setupNotes:"srt_setupNotes",initialized:"srt_initialized",
};
const EMPTY_STATE = {tracks:INITIAL_TRACKS,cars:INITIAL_CARS,lapTimes:INITIAL_LAP_TIMES,races:[],championships:[],fans:1200,setupNotes:{}};

function lsGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota exceeded or storage disabled – silently ignore */ }
}

function loadState() {
  try {
    if (!localStorage.getItem(LS.initialized)) {
      for (const [k,v] of Object.entries(LS).filter(([k])=>k!=="initialized")) lsSet(v, EMPTY_STATE[k]??{});
      lsSet(LS.initialized, "1");
      return { ...EMPTY_STATE };
    }
    return {
      tracks:        lsGet(LS.tracks,        INITIAL_TRACKS),
      cars:          lsGet(LS.cars,          INITIAL_CARS),
      lapTimes:      lsGet(LS.lapTimes,      INITIAL_LAP_TIMES),
      races:         lsGet(LS.races,         []),
      championships: lsGet(LS.championships, []),
      fans:          lsGet(LS.fans,          1200),
      setupNotes:    lsGet(LS.setupNotes,    {}),
    };
  } catch {
    return { ...EMPTY_STATE };
  }
}
function saveState(s) {
  try {
    lsSet(LS.tracks,        s.tracks);
    lsSet(LS.cars,          s.cars);
    lsSet(LS.lapTimes,      s.lapTimes);
    lsSet(LS.races,         s.races);
    lsSet(LS.championships, s.championships);
    lsSet(LS.fans,          s.fans);
    lsSet(LS.setupNotes,    s.setupNotes);
  } catch { /* storage unavailable */ }
}

// ─── Shared atoms ─────────────────────────────────────────────────────────────

function FL({children}) { return <label className="text-[10px] text-white/40 font-mono uppercase tracking-wider block mb-1.5">{children}</label>; }
function SL({children}) { return <p className="text-[10px] font-mono text-white/35 uppercase tracking-widest flex items-center gap-1">{children}</p>; }
const INPUT_BASE = [
  "w-full rounded-lg px-3 py-2.5 text-sm font-medium",
  "bg-[#1e1e28] border border-[#3a3a50]",
  "text-white placeholder-white/30",
  "focus:outline-none focus:border-[#5a5a80] focus:bg-[#22223a]",
  "transition-colors",
  // override browser autofill yellow background
  "[&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#1e1e28]",
  "[&:-webkit-autofill]:[-webkit-text-fill-color:white]",
].join(" ");

function Inp({className="",...p}) {
  return <input {...p} className={`${INPUT_BASE} ${className}`}/>;
}
function Txta({className="",...p}) {
  return <textarea {...p} className={`${INPUT_BASE} resize-none ${className}`}/>;
}
function Sel({children,className="",...p}) {
  return (
    <select {...p} className={`${INPUT_BASE} bg-[#1e1e28] cursor-pointer ${className}`}>
      {children}
    </select>
  );
}
function Btn({onClick,children,v="primary",className="",disabled=false}) {
  const base="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const vs={
    primary:"bg-emerald-600 hover:bg-emerald-500 text-white",
    ghost:"bg-white/[0.05] hover:bg-white/10 text-white/70",
    dashed:"border border-dashed border-white/15 hover:border-white/30 hover:bg-white/[0.03] text-white/40 hover:text-white/70 w-full justify-center",
    gold:"bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30",
    blue:"bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30",
  };
  return <button onClick={onClick} disabled={disabled} className={`${base} ${vs[v]||vs.primary} ${className}`}>{children}</button>;
}
function DelBtn({onClick}) {
  return <button onClick={onClick} className="p-1.5 rounded-md bg-red-500/10 hover:bg-red-500/25 text-red-400/50 hover:text-red-400 transition-colors shrink-0"><Trash2 size={13}/></button>;
}

// ─── Fan Toast ────────────────────────────────────────────────────────────────

function FanToast({delta,label,onDone}) {
  useEffect(()=>{const t=setTimeout(onDone,3200);return()=>clearTimeout(t);},[onDone]);
  const big = delta>=10000;
  return (
    <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 ${big?"animate-bounce":""}`}>
      <div className={`flex flex-col items-center gap-1 px-5 py-3 rounded-2xl border shadow-2xl backdrop-blur-sm ${big?"bg-yellow-600/90 border-yellow-400/50":"bg-pink-600/90 border-pink-400/40"}`}>
        <div className="flex items-center gap-2">
          {big?<Crown size={16} className="text-yellow-200"/>:<Heart size={14} className="text-pink-200 fill-pink-200"/>}
          <span className="text-sm font-black text-white">+{fmtFans(delta)} Fans!</span>
        </div>
        {label && <span className="text-[10px] text-white/70 font-mono text-center">{label}</span>}
      </div>
    </div>
  );
}

// ─── Setup Notes ──────────────────────────────────────────────────────────────

function SetupNotes({noteKey,setupNotes,onSave}) {
  const [open,setOpen]=useState(false);
  const [val,setVal]=useState(setupNotes[noteKey]||"");
  const saved=setupNotes[noteKey]||"";
  const dirty=val!==saved;
  useEffect(()=>{setVal(setupNotes[noteKey]||"");},[noteKey,setupNotes]);
  return (
    <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 overflow-hidden">
      <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors">
        <StickyNote size={13} className="text-amber-400/70 shrink-0"/>
        <span className="flex-1 text-xs font-semibold text-white/50">Setup-Notizen</span>
        {saved&&!dirty&&<span className="text-[10px] text-amber-400/60 font-mono">gespeichert ✓</span>}
        {dirty&&<span className="text-[10px] text-amber-300/80 font-mono">ungespeichert</span>}
        {open?<ChevronUp size={14} className="text-white/25"/>:<ChevronDown size={14} className="text-white/25"/>}
      </button>
      {open&&(
        <div className="px-4 pb-4 space-y-2 border-t border-amber-500/10">
          <p className="text-[10px] text-white/25 pt-3 font-mono">Reifendruck · Flügelstellung · Bremsbalance…</p>
          <Txta rows={4} value={val} onChange={e=>setVal(e.target.value)} placeholder={"VA: 27.5 psi · HA: 28.0 psi\nFrontflügel: 8 · Heckflügel: 5\nBremse: 57% vorne"}/>
          <Btn onClick={()=>onSave(noteKey,val)} className="w-full justify-center"><StickyNote size={13}/>Notiz speichern</Btn>
        </div>
      )}
    </div>
  );
}

// ─── Weather Form Section (collapsible) ──────────────────────────────────────

function WeatherForm({weather,setWeather,condition,setCondition,airTemp,setAirTemp,asphaltTemp,setAsphaltTemp,windSpeed,setWindSpeed,tire,setTire,game}) {
  const [open,setOpen]=useState(false);
  const rec = weather||condition||asphaltTemp ? recommendTire(weather,condition,asphaltTemp,game) : null;
  return (
    <div className="rounded-xl border border-sky-500/15 bg-sky-500/5 overflow-hidden">
      <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center gap-2 px-4 py-3 hover:bg-white/[0.03] transition-colors">
        <Thermometer size={13} className="text-sky-400/70"/>
        <span className="flex-1 text-xs font-semibold text-white/50 text-left">Wetter & Reifen <span className="text-white/25">(optional)</span></span>
        {tire&&<TireChip tireVal={tire} small/>}
        {weather&&<span className="text-sm">{WEATHER_OPTIONS.find(x=>x.value===weather)?.icon}</span>}
        {open?<ChevronUp size={14} className="text-white/25"/>:<ChevronDown size={14} className="text-white/25"/>}
      </button>
      {open&&(
        <div className="px-4 pb-4 space-y-3 border-t border-sky-500/10">
          {/* Tire recommendation */}
          {rec&&(
            <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Zap size={12} className="text-blue-400 shrink-0"/>
              <span className="text-xs text-blue-300 flex-1">{rec.reason}</span>
              <button onClick={()=>setTire(rec.tire)} className="text-[10px] font-mono font-bold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded hover:bg-blue-500/30 transition-colors shrink-0">
                Anwenden
              </button>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {/* Weather */}
            <div>
              <FL>Wetter</FL>
              <div className="flex gap-1">
                {WEATHER_OPTIONS.map(w=>(
                  <button key={w.value} onClick={()=>setWeather(weather===w.value?"":w.value)}
                    className={`flex-1 py-2 rounded-lg border text-base transition-all ${weather===w.value?"border-sky-400/50 bg-sky-400/15":"border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"}`}>
                    {w.icon}
                  </button>
                ))}
              </div>
            </div>
            {/* Condition */}
            <div>
              <FL>Zustand</FL>
              <Sel value={condition} onChange={e=>setCondition(e.target.value)}>
                <option value="">–</option>
                {CONDITION_OPTIONS.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
              </Sel>
            </div>
            {/* Tire */}
            <div>
              <FL>Reifen</FL>
              <Sel value={tire} onChange={e=>setTire(e.target.value)}>
                <option value="">–</option>
                {TIRE_OPTIONS.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
              </Sel>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><FL>Luft (°C)</FL><Inp type="number" value={airTemp} onChange={e=>setAirTemp(e.target.value)} placeholder="22"/></div>
            <div><FL>Asphalt (°C)</FL><Inp type="number" value={asphaltTemp} onChange={e=>setAsphaltTemp(e.target.value)} placeholder="35"/></div>
            <div><FL>Wind (km/h)</FL><Inp type="number" value={windSpeed} onChange={e=>setWindSpeed(e.target.value)} placeholder="12"/></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Track Detail ─────────────────────────────────────────────────────────────

function TrackDetail({game,track,cars,lapTimes,setupNotes,onAddLap,onDeleteLap,onSaveNote,onBack}) {
  const [carInput,setCarInput]=useState(""); const [timeInput,setTimeInput]=useState("");
  const [timeError,setTimeError]=useState(""); const [showSug,setShowSug]=useState(false);
  const [weather,setWeather]=useState(""); const [condition,setCondition]=useState("");
  const [airTemp,setAirTemp]=useState(""); const [asphaltTemp,setAsphaltTemp]=useState("");
  const [windSpeed,setWindSpeed]=useState(""); const [tire,setTire]=useState("");

  const trackLaps=[...lapTimes.filter(l=>l.game===game&&l.track===track)].sort((a,b)=>a.timeInMs-b.timeInMs);
  const gameCars=cars[game]||[];
  const filtered=gameCars.filter(c=>c.toLowerCase().includes(carInput.toLowerCase())&&c!==carInput);
  const bestLap=trackLaps[0]||null;

  function handleSubmit() {
    setTimeError("");
    if (!carInput.trim()) { setTimeError("Auto eingeben."); return; }
    const ms=parseTimeToMs(timeInput);
    if (ms===null) { setTimeError("Format: MM:SS.mmm"); return; }
    onAddLap(game,track,carInput.trim(),ms,msToFormatted(ms),{weather,condition,airTemp,asphaltTemp,windSpeed,tire});
    setCarInput(""); setTimeInput(""); setWeather(""); setCondition(""); setAirTemp(""); setAsphaltTemp(""); setWindSpeed(""); setTire("");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/10"><ChevronLeft size={18}/></button>
        <div>
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">{game}</p>
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><MapPin size={15} className="text-white/50"/>{track}</h2>
        </div>
      </div>

      {bestLap&&(
        <div className="relative overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/60 to-emerald-900/20 p-5">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2"/>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1"><Zap size={12} className="text-emerald-400"/><span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-semibold">Top Empfehlung</span></div>
              <p className="text-white/45 text-xs mb-1">Schnellstes Auto auf dieser Strecke</p>
              <p className="text-xl font-bold text-white">{bestLap.car}</p>
              <div className="flex items-center gap-2 mt-1">
                {bestLap.tire&&<TireChip tireVal={bestLap.tire} small/>}
                {(bestLap.weather||bestLap.condition)&&<WeatherChip weatherVal={bestLap.weather} condVal={bestLap.condition} small/>}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-white/40 font-mono mb-1">BESTZEIT</p>
              <p className="font-mono text-2xl font-black text-emerald-400 tracking-wider">{bestLap.formattedTime}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add form */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
        <p className="text-xs font-semibold text-white/55 flex items-center gap-2"><Timer size={13}/>Neue Rundenzeit</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <FL>Auto</FL>
            <Inp value={carInput} onChange={e=>{setCarInput(e.target.value);setShowSug(true);}} onBlur={()=>setTimeout(()=>setShowSug(false),150)} onFocus={()=>setShowSug(true)} placeholder="z.B. Ferrari 499P"/>
            {showSug&&filtered.length>0&&(
              <div className="absolute z-20 mt-1 w-full rounded-lg border border-white/10 bg-[#1a1a24] shadow-xl overflow-hidden">
                {filtered.map(c=><button key={c} onMouseDown={()=>{setCarInput(c);setShowSug(false);}} className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 flex items-center gap-2"><Car size={11} className="text-white/30"/>{c}</button>)}
              </div>
            )}
          </div>
          <div>
            <FL>Zeit (MM:SS.mmm)</FL>
            <Inp value={timeInput} onChange={e=>setTimeInput(e.target.value)} placeholder="01:50.000" className="font-mono"/>
          </div>
        </div>
        {timeError&&<p className="text-xs text-red-400 flex items-center gap-1"><X size={11}/>{timeError}</p>}
        <Btn onClick={handleSubmit}><Plus size={14}/>Zeit speichern</Btn>
      </div>

      <WeatherForm weather={weather} setWeather={setWeather} condition={condition} setCondition={setCondition}
        airTemp={airTemp} setAirTemp={setAirTemp} asphaltTemp={asphaltTemp} setAsphaltTemp={setAsphaltTemp}
        windSpeed={windSpeed} setWindSpeed={setWindSpeed} tire={tire} setTire={setTire} game={game}/>

      <SetupNotes noteKey={`${game}__${track}`} setupNotes={setupNotes} onSave={onSaveNote}/>

      <div className="space-y-2">
        <SL><Clock size={11}/>Alle Zeiten — {trackLaps.length} Einträge</SL>
        {trackLaps.length===0
          ?<div className="text-center py-8 text-white/20 text-sm"><Flag size={26} className="mx-auto mb-2 opacity-30"/>Noch keine Zeiten</div>
          :trackLaps.map((entry,i)=>(
            <div key={entry.id} className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${i===0?"bg-emerald-500/10 border-emerald-500/40":"bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05]"}`}>
              <span className={`w-5 text-center font-mono text-xs font-bold shrink-0 ${i===0?"text-emerald-400":"text-white/30"}`}>{i===0?<Trophy size={13} className="mx-auto"/>:i+1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-medium text-white/90 truncate">{entry.car}</span>
                  {entry.tire&&<TireChip tireVal={entry.tire} small/>}
                  {(entry.weather||entry.condition)&&<WeatherChip weatherVal={entry.weather} condVal={entry.condition} small/>}
                </div>
                <div className="flex items-center gap-2 text-xs text-white/30 ml-0 mt-0.5">
                  {entry.asphaltTemp&&<span>🌡️{entry.asphaltTemp}°C</span>}
                  {entry.windSpeed&&<span>💨{entry.windSpeed}km/h</span>}
                  <span>{fmtDate(entry.date)}</span>
                </div>
              </div>
              <span className={`font-mono text-base font-bold tracking-wider shrink-0 ${i===0?"text-emerald-400":"text-white/60"}`}>{entry.formattedTime}</span>
              <DelBtn onClick={()=>onDeleteLap(entry.id)}/>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ─── Tracks Tab ───────────────────────────────────────────────────────────────

function TracksTab({game,tracks,cars,lapTimes,setupNotes,onAddLap,onDeleteLap,onAddTrack,onSaveNote}) {
  const [sel,setSel]=useState(null);
  const [newName,setNewName]=useState(""); const [showNew,setShowNew]=useState(false);
  const gameTracks=tracks[game]||[];
  function getBest(t) { const l=lapTimes.filter(l=>l.game===game&&l.track===t); return l.length?l.reduce((b,x)=>x.timeInMs<b.timeInMs?x:b):null; }
  if (sel) return <TrackDetail game={game} track={sel} cars={cars} lapTimes={lapTimes} setupNotes={setupNotes} onAddLap={onAddLap} onDeleteLap={onDeleteLap} onSaveNote={onSaveNote} onBack={()=>setSel(null)}/>;
  return (
    <div className="space-y-3">
      {gameTracks.length===0?<div className="text-center py-10 text-white/20 text-sm"><MapPin size={28} className="mx-auto mb-2 opacity-30"/>Keine Strecken</div>
        :gameTracks.map(t=>{
          const best=getBest(t), cnt=lapTimes.filter(l=>l.game===game&&l.track===t).length;
          const hasNote=setupNotes[`${game}__${t}`];
          return (
            <button key={t} onClick={()=>setSel(t)} className="w-full flex items-center gap-4 px-4 py-4 rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15 transition-all group text-left">
              <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0"><Flag size={15} className="text-white/50"/></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5"><p className="font-semibold text-white text-sm truncate">{t}</p>{hasNote&&<StickyNote size={10} className="text-amber-400/60"/>}</div>
                <p className="text-xs text-white/35">{cnt} {cnt===1?"Zeit":"Zeiten"}</p>
              </div>
              {best&&<div className="text-right shrink-0">
                <div className="flex items-center justify-end gap-1">{best.tire&&<TireChip tireVal={best.tire} small/>}<p className="font-mono text-sm font-bold text-emerald-400">{best.formattedTime}</p></div>
                <p className="text-xs text-white/35 max-w-[100px] truncate">{best.car}</p>
              </div>}
              <ChevronRight size={15} className="text-white/20 group-hover:text-white/50 shrink-0"/>
            </button>
          );
        })
      }
      {showNew
        ?<div className="flex gap-2"><Inp autoFocus value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){const n=newName.trim();if(n){onAddTrack(game,n);setNewName("");}setShowNew(false);}if(e.key==="Escape")setShowNew(false);}} placeholder="Streckenname…"/><Btn onClick={()=>{const n=newName.trim();if(n){onAddTrack(game,n);setNewName("");}setShowNew(false);}}><Plus size={15}/></Btn><Btn v="ghost" onClick={()=>setShowNew(false)}><X size={15}/></Btn></div>
        :<Btn v="dashed" onClick={()=>setShowNew(true)}><Plus size={13}/>Neue Strecke hinzufügen</Btn>
      }
    </div>
  );
}

// ─── Cars Tab ─────────────────────────────────────────────────────────────────

function CarsTab({game,cars,lapTimes,setupNotes,onDeleteLap,onSaveNote}) {
  const [selCar,setSelCar]=useState(null);
  const gameCars=cars[game]||[];
  if (selCar) {
    const laps=lapTimes.filter(l=>l.game===game&&l.car===selCar);
    const byTrack={};
    for (const l of laps) { if(!byTrack[l.track]||l.timeInMs<byTrack[l.track].timeInMs) byTrack[l.track]=l; }
    const bests=Object.values(byTrack).sort((a,b)=>a.timeInMs-b.timeInMs);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={()=>setSelCar(null)} className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/10"><ChevronLeft size={18}/></button>
          <div><p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">{game}</p><h2 className="text-xl font-bold text-white flex items-center gap-2"><Car size={15} className="text-white/50"/>{selCar}</h2></div>
        </div>
        <SetupNotes noteKey={`${game}__car__${selCar}`} setupNotes={setupNotes} onSave={onSaveNote}/>
        <SL><Trophy size={11}/>Bestzeiten pro Strecke</SL>
        {bests.length===0?<div className="text-center py-8 text-white/20 text-sm"><Clock size={26} className="mx-auto mb-2 opacity-30"/>Keine Zeiten</div>
          :bests.map((lap,i)=>(
            <div key={lap.id} className={`flex items-center gap-2 px-4 py-3.5 rounded-xl border ${i===0?"bg-emerald-500/10 border-emerald-500/30":"bg-white/[0.03] border-white/[0.06]"}`}>
              <span className={`w-5 text-center font-mono text-xs font-bold shrink-0 ${i===0?"text-emerald-400":"text-white/30"}`}>{i===0?<Trophy size={13} className="mx-auto"/>:i+1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{lap.track}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {lap.tire&&<TireChip tireVal={lap.tire} small/>}
                  {(lap.weather||lap.condition)&&<WeatherChip weatherVal={lap.weather} condVal={lap.condition} small/>}
                  <span className="text-xs text-white/30">{fmtDate(lap.date)}</span>
                </div>
              </div>
              <span className={`font-mono text-base font-bold shrink-0 ${i===0?"text-emerald-400":"text-white/60"}`}>{lap.formattedTime}</span>
              <DelBtn onClick={()=>onDeleteLap(lap.id)}/>
            </div>
          ))
        }
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {gameCars.length===0?<div className="text-center py-10 text-white/20 text-sm"><Car size={28} className="mx-auto mb-2 opacity-30"/>Keine Autos</div>
        :gameCars.map(car=>{
          const laps=lapTimes.filter(l=>l.game===game&&l.car===car);
          const best=laps.length?laps.reduce((b,l)=>l.timeInMs<b.timeInMs?l:b):null;
          const tList=[...new Set(laps.map(l=>l.track))];
          const hasNote=setupNotes[`${game}__car__${car}`];
          return (
            <button key={car} onClick={()=>setSelCar(car)} className="w-full flex items-center gap-4 px-4 py-4 rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15 transition-all group text-left">
              <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0"><Car size={16} className="text-white/50"/></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5"><p className="font-semibold text-white text-sm truncate">{car}</p>{hasNote&&<StickyNote size={10} className="text-amber-400/60"/>}</div>
                <p className="text-xs text-white/35">{tList.length} {tList.length===1?"Strecke":"Strecken"}</p>
              </div>
              {best&&<div className="text-right shrink-0">
                <div className="flex items-center justify-end gap-1 mb-0.5">{best.tire&&<TireChip tireVal={best.tire} small/>}<p className="font-mono text-sm font-bold text-amber-400">{best.formattedTime}</p></div>
                <p className="text-xs text-white/35 truncate max-w-[100px]">{best.track}</p>
              </div>}
              <ChevronRight size={15} className="text-white/20 group-hover:text-white/50 shrink-0"/>
            </button>
          );
        })
      }
    </div>
  );
}

// ─── Races Tab ────────────────────────────────────────────────────────────────

function RacesTab({game,tracks,cars,races,onAddRace,onDeleteRace}) {
  const gameTracks=tracks[game]||[]; const gameCars=cars[game]||[];
  const gameRaces=races.filter(r=>r.game===game).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const [track,setTrack]=useState(gameTracks[0]||""); const [car,setCar]=useState(gameCars[0]||"");
  const [grid,setGrid]=useState(""); const [finish,setFinish]=useState(""); const [pts,setPts]=useState("");
  const [err,setErr]=useState("");
  const [weather,setWeather]=useState(""); const [condition,setCondition]=useState("");
  const [airTemp,setAirTemp]=useState(""); const [asphaltTemp,setAsphaltTemp]=useState("");
  const [windSpeed,setWindSpeed]=useState(""); const [tire,setTire]=useState("");
  useEffect(()=>{setTrack(gameTracks[0]||"");setCar(gameCars[0]||"");},[game]);
  const totalRaces=gameRaces.length, totalPts=gameRaces.reduce((s,r)=>s+(r.points||0),0);
  const podiums=gameRaces.filter(r=>r.finishPos<=3).length, wins=gameRaces.filter(r=>r.finishPos===1).length;
  function handleAdd() {
    setErr("");
    if(!track){setErr("Strecke wählen.");return;} if(!car){setErr("Auto wählen.");return;}
    const g=parseInt(grid,10),f=parseInt(finish,10),p=parseInt(pts,10)||0;
    if(!g||g<1||g>30){setErr("Start 1–30.");return;} if(!f||f<1||f>30){setErr("Finish 1–30.");return;}
    onAddRace({id:generateId(),game,track,car,gridPos:g,finishPos:f,points:p,date:new Date().toISOString().split("T")[0],weather,condition,asphaltTemp,tire});
    setGrid("");setFinish("");setPts("");setWeather("");setCondition("");setAirTemp("");setAsphaltTemp("");setWindSpeed("");setTire("");
  }
  const mc=pos=>pos===1?"text-yellow-400":pos===2?"text-slate-300":pos===3?"text-amber-600":"text-white/40";
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-2">
        {[{icon:<Flag size={12}/>,label:"Rennen",val:totalRaces,c:"text-white/70"},{icon:<Trophy size={12}/>,label:"Siege",val:wins,c:"text-yellow-400"},{icon:<Medal size={12}/>,label:"Podiums",val:podiums,c:"text-slate-300"},{icon:<Star size={12}/>,label:"Punkte",val:totalPts,c:"text-emerald-400"}].map(s=>(
          <div key={s.label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-2.5 text-center">
            <div className={`flex items-center justify-center gap-1 mb-1 ${s.c}`}>{s.icon}</div>
            <p className={`text-xl font-black font-mono ${s.c}`}>{s.val}</p>
            <p className={`text-[9px] font-mono uppercase tracking-wider ${s.c}/60`}>{s.label}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
        <p className="text-xs font-semibold text-white/55 flex items-center gap-2"><CalendarDays size={13}/>Rennen eintragen</p>
        <div className="grid grid-cols-2 gap-3">
          <div><FL>Strecke</FL><Sel value={track} onChange={e=>setTrack(e.target.value)}>{gameTracks.map(t=><option key={t}>{t}</option>)}</Sel></div>
          <div><FL>Auto</FL><Sel value={car} onChange={e=>setCar(e.target.value)}>{gameCars.map(c=><option key={c}>{c}</option>)}</Sel></div>
          <div><FL>Start</FL><Inp type="number" min="1" max="30" value={grid} onChange={e=>setGrid(e.target.value)} placeholder="z.B. 3"/></div>
          <div><FL>Finish</FL><Inp type="number" min="1" max="30" value={finish} onChange={e=>setFinish(e.target.value)} placeholder="z.B. 1"/></div>
          <div className="col-span-2"><FL>Punkte</FL><Inp type="number" min="0" value={pts} onChange={e=>setPts(e.target.value)} placeholder="z.B. 25"/></div>
        </div>
        {err&&<p className="text-xs text-red-400 flex items-center gap-1"><X size={11}/>{err}</p>}
        <Btn onClick={handleAdd}><Plus size={14}/>Rennen speichern</Btn>
      </div>
      <WeatherForm weather={weather} setWeather={setWeather} condition={condition} setCondition={setCondition}
        airTemp={airTemp} setAirTemp={setAirTemp} asphaltTemp={asphaltTemp} setAsphaltTemp={setAsphaltTemp}
        windSpeed={windSpeed} setWindSpeed={setWindSpeed} tire={tire} setTire={setTire} game={game}/>
      <div className="space-y-2">
        <SL><ListOrdered size={11}/>Renn-Historie — {gameRaces.length}</SL>
        {gameRaces.length===0?<div className="text-center py-8 text-white/20 text-sm"><Flag size={26} className="mx-auto mb-2 opacity-30"/>Noch keine Rennen</div>
          :gameRaces.map(r=>(
            <div key={r.id} className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${r.finishPos===1?"bg-yellow-500/8 border-yellow-500/25":r.finishPos<=3?"bg-white/[0.04] border-white/10":"bg-white/[0.025] border-white/[0.06]"}`}>
              <span className={`text-lg font-black font-mono w-8 text-center shrink-0 ${mc(r.finishPos)}`}>{r.finishPos}.</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{r.track}</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-white/35">{r.car}</span>
                  {r.tire&&<TireChip tireVal={r.tire} small/>}
                  {(r.weather||r.condition)&&<WeatherChip weatherVal={r.weather} condVal={r.condition} small/>}
                </div>
              </div>
              <p className="font-mono text-sm font-bold text-emerald-400 shrink-0">{r.points}P</p>
              <DelBtn onClick={()=>onDeleteRace(r.id)}/>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ─── Transfer Market ──────────────────────────────────────────────────────────

function TransferMarket({ champ, onTransfer, onAiSwaps, onClose }) {
  const isTeamWM = !!champ.teams;
  const ratings  = champ.driverRatings || {};
  const budgets  = champ.teamBudgets   || {};
  const [selDriver, setSelDriver] = useState(null);
  const [selTeam,   setSelTeam]   = useState("");
  const [err, setErr] = useState("");
  const [aiLog, setAiLog] = useState(champ.lastAiSwaps || []);

  // sort drivers by rating desc
  const sorted = [...champ.drivers].sort((a,b) => (ratings[b]?.rating||70) - (ratings[a]?.rating||70));

  // find Ebby's team
  const ebbysTeam = isTeamWM ? driverTeam(champ, "Ebby G") : null;
  const myBudget  = ebbysTeam ? (budgets[ebbysTeam.name] || 0) : 0;

  function handleBuy() {
    setErr("");
    if (!selDriver || !selTeam) { setErr("Fahrer und Ziel-Team wählen."); return; }
    const r = ratings[selDriver];
    if (!r) { setErr("Keine Rating-Daten."); return; }
    const cost = r.value;
    if (cost > myBudget) { setErr(`Budget reicht nicht. Benötigt: ${fmtEuro(cost)}, Verfügbar: ${fmtEuro(myBudget)}`); return; }
    onTransfer(champ.id, selDriver, selTeam, cost);
    setSelDriver(null); setSelTeam("");
  }

  function handleAiSwaps() {
    const result = onAiSwaps(champ.id);
    setAiLog(result || []);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onClose} className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/10"><ChevronLeft size={18}/></button>
        <div>
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Saison-Ende</p>
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Shuffle size={16} className="text-blue-400"/>Transfermarkt</h2>
        </div>
      </div>

      {/* Team budgets */}
      {isTeamWM && champ.teams && (
        <div className="space-y-1.5">
          <SL><DollarSign size={11}/>Team-Budgets (Saisonpreisgeld)</SL>
          {champ.teams.map((t,i) => {
            const b = budgets[t.name] || 0;
            const isMyTeam = t.drivers.includes("Ebby G");
            return (
              <div key={t.name} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${isMyTeam?"bg-emerald-500/8 border-emerald-500/25":"bg-white/[0.025] border-white/[0.06]"}`}>
                <Shield size={13} className={isMyTeam?"text-emerald-400":"text-white/30"}/>
                <span className={`flex-1 text-sm font-semibold ${isMyTeam?"text-white":"text-white/70"}`}>{t.name}{isMyTeam?" ⭐":""}</span>
                <span className={`font-mono text-sm font-bold ${b>5_000_000?"text-yellow-400":b>2_000_000?"text-emerald-400":"text-white/50"}`}>{fmtEuro(b)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Buy a driver (only in Team-WM and only for Ebby's team) */}
      {isTeamWM && ebbysTeam && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-3">
          <p className="text-xs font-semibold text-blue-300 flex items-center gap-2"><Users size={13}/>Fahrer verpflichten (Budget: {fmtEuro(myBudget)})</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <FL>Fahrer</FL>
              <Sel value={selDriver||""} onChange={e=>setSelDriver(e.target.value)}>
                <option value="">Fahrer wählen…</option>
                {sorted.filter(d=>d!=="Ebby G").map(d=>{
                  const r=ratings[d]; const inTeam=ebbysTeam.drivers.includes(d);
                  return <option key={d} value={d}>{d} (OVR {r?.rating||"?"}) — {fmtEuro(r?.value||0)}{inTeam?" ✓":""}</option>;
                })}
              </Sel>
            </div>
            <div>
              <FL>In mein Team</FL>
              <Sel value={selTeam} onChange={e=>setSelTeam(e.target.value)}>
                <option value="">Team wählen…</option>
                {champ.teams.filter(t=>t.drivers.includes("Ebby G")).map(t=><option key={t.name} value={t.name}>{t.name}</option>)}
              </Sel>
            </div>
          </div>
          {selDriver && ratings[selDriver] && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-xs">
              <span className={`font-mono font-black text-base ${ratingColor(ratings[selDriver].rating)}`}>{ratings[selDriver].rating}</span>
              <span className="flex-1 text-white/60">{selDriver}</span>
              <span className="font-mono text-amber-400 font-bold">{fmtEuro(ratings[selDriver].value)}</span>
            </div>
          )}
          {err && <p className="text-xs text-red-400 flex items-center gap-1"><X size={11}/>{err}</p>}
          <Btn onClick={handleBuy} disabled={!selDriver||!selTeam}><DollarSign size={13}/>Verpflichten</Btn>
        </div>
      )}

      {/* AI random swaps */}
      <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-3">
        <p className="text-xs font-semibold text-purple-300 flex items-center gap-2"><RefreshCw size={13}/>KI-Zufallstransfers</p>
        <p className="text-xs text-white/40">Lass 1–2 KI-Fahrer spontan die Teams wechseln, um die neue Saison aufzufrischen.</p>
        {aiLog.length > 0 && (
          <div className="space-y-1">
            {aiLog.map((s,i) => <p key={i} className="text-xs text-purple-300 font-mono">↔ {s}</p>)}
          </div>
        )}
        <Btn v="ghost" onClick={handleAiSwaps} className="border border-purple-500/25 text-purple-300 hover:bg-purple-500/10">
          <Shuffle size={13}/>KI-Transfers ausführen
        </Btn>
      </div>

      {/* Full driver market list */}
      <div className="space-y-1.5">
        <SL><TrendingUp size={11}/>Alle Fahrer — Ratings & Marktwerte</SL>
        {sorted.map((driver, i) => {
          const r = ratings[driver] || { rating: 70, value: 500_000 };
          const team = isTeamWM ? driverTeam(champ, driver) : null;
          return (
            <div key={driver} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${driver==="Ebby G"?"bg-red-500/8 border-red-500/20":"bg-white/[0.025] border-white/[0.06]"}`}>
              <span className="w-5 text-center font-mono text-xs text-white/30 shrink-0">{i+1}</span>
              <span className={`font-mono font-black text-xl w-10 text-center shrink-0 ${ratingColor(r.rating)}`}>{r.rating}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${driver==="Ebby G"?"text-white":"text-white/80"}`}>{driver}</p>
                {team && <p className="text-[10px] text-white/30 font-mono">{team.name}{team.car?" · "+team.car:""}</p>}
              </div>
              <span className="font-mono text-sm text-amber-400/80 shrink-0">{fmtEuro(r.value)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Championship Detail ──────────────────────────────────────────────────────

function ChampionshipDetail({champ,onBack,onAddRace,onDeleteChampionship,onTransfer,onAiSwaps}) {
  const [showRaceForm,setShowRaceForm]=useState(false);
  const [raceCalIdx,setRaceCalIdx]=useState(null);
  const [positions,setPositions]=useState({});
  const [formErr,setFormErr]=useState("");
  const [standingsTab,setStandingsTab]=useState("drivers"); // "drivers" | "teams" | "ratings"
  const [showTransfer,setShowTransfer]=useState(false);
  // Race weather
  const [rWeather,setRWeather]=useState(""); const [rCondition,setRCondition]=useState("");
  const [rAirTemp,setRAirTemp]=useState(""); const [rAsphaltTemp,setRAsphaltTemp]=useState("");
  const [rWindSpeed,setRWindSpeed]=useState(""); const [rTire,setRTire]=useState("");

  const done=seasonDone(champ);
  const standings=computeStandings(champ);
  const teamStandings=computeTeamStandings(champ);
  const champion=standings[0]?.[0]||null;
  const dCount=champ.drivers.length;
  const playedSet=new Set(champ.races.map(r=>r.calendarIndex));
  const nextCalIdx=champ.calendar.findIndex((_,i)=>!playedSet.has(i));
  const isTeamWM=!!champ.teams;

  useEffect(()=>{
    if(showRaceForm&&raceCalIdx===null&&nextCalIdx>=0) setRaceCalIdx(nextCalIdx);
  },[showRaceForm]);

  const tireRec = rWeather||rCondition||rAsphaltTemp ? recommendTire(rWeather,rCondition,rAsphaltTemp,champ.game||"") : null;

  function handleAddRace() {
    setFormErr("");
    if(raceCalIdx===null){setFormErr("Rennen wählen.");return;}
    if(playedSet.has(raceCalIdx)){setFormErr("Bereits eingetragen.");return;}
    const usedPos=champ.drivers.map(d=>parseInt(positions[d]||"0",10));
    if(usedPos.some(p=>!p||p<1||p>dCount)){setFormErr(`Alle Positionen 1–${dCount}.`);return;}
    if(new Set(usedPos).size!==dCount){setFormErr("Jede Position nur einmal.");return;}
    const results={};
    for(const d of champ.drivers) results[d]=parseInt(positions[d],10);
    onAddRace(champ.id,{id:generateId(),calendarIndex:raceCalIdx,track:champ.calendar[raceCalIdx],results,date:new Date().toISOString().split("T")[0],weather:rWeather,condition:rCondition,asphaltTemp:rAsphaltTemp,tire:rTire});
    setPositions({});setShowRaceForm(false);setRaceCalIdx(null);
    setRWeather("");setRCondition("");setRAirTemp("");setRAsphaltTemp("");setRWindSpeed("");setRTire("");
  }

  const posStyle=i=>i===0?"text-yellow-400 font-black":i===1?"text-slate-300 font-bold":i===2?"text-amber-600 font-bold":"text-white/70";
  const rowBg=i=>i===0?"bg-yellow-500/8 border-yellow-500/20":i===1?"bg-slate-400/5 border-slate-400/15":i===2?"bg-amber-700/8 border-amber-600/15":"bg-white/[0.025] border-white/[0.06]";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/10"><ChevronLeft size={18}/></button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">{isTeamWM?"Team-WM":"Einzel-WM"}</p>
          <h2 className="text-lg font-bold text-white truncate flex items-center gap-2">{done&&<Lock size={13} className="text-yellow-400 shrink-0"/>}{champ.name}</h2>
        </div>
        <button onClick={()=>onDeleteChampionship(champ.id)} className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400/60 hover:text-red-400"><Trash2 size={15}/></button>
      </div>

      {done&&champion&&(
        <div className="relative overflow-hidden rounded-2xl border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-950/80 to-amber-900/30 p-6">
          <div className="absolute inset-0 opacity-[0.07]" style={{backgroundImage:`repeating-linear-gradient(45deg,transparent,transparent 8px,rgba(255,200,0,0.5) 8px,rgba(255,200,0,0.5) 9px)`}}/>
          <div className="absolute top-3 right-3 text-5xl opacity-20">🏆</div>
          <div className="relative flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-yellow-500/25 border-2 border-yellow-400/60 flex items-center justify-center shrink-0"><Trophy size={32} className="text-yellow-400"/></div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-mono text-yellow-400/60 uppercase tracking-widest mb-1">🏁 Saison beendet · Endergebnis</p>
              <p className="text-2xl font-black text-yellow-300 truncate">{champion}</p>
              <p className="text-xs text-yellow-400/55 mt-0.5">Fahrer-Weltmeister — {champ.name}</p>
              {isTeamWM&&teamStandings[0]&&<p className="text-xs text-blue-300/70 mt-0.5">Team-WM: {teamStandings[0][0]} ({teamStandings[0][1]} Pkt)</p>}
            </div>
            <div className="text-right shrink-0"><p className="font-mono text-3xl font-black text-yellow-400">{standings[0][1]}</p><p className="text-[10px] text-yellow-400/45 font-mono">PTS</p></div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          {l:"Fahrer",v:dCount,i:<Users size={12}/>},
          {l:"Rennen",v:`${champ.races.length}/${champ.calendar.length}`,i:<Flag size={12}/>},
          {l:"Status",v:done?"Final":"Aktiv",i:done?<Lock size={12}/>:<Sparkles size={12}/>},
        ].map(s=>(
          <div key={s.l} className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-2 py-3">
            <div className="flex items-center justify-center gap-1 mb-1 text-white/35">{s.i}<span className="text-[9px] font-mono uppercase tracking-wider">{s.l}</span></div>
            <p className={`text-sm font-black font-mono ${done&&s.l==="Status"?"text-yellow-400":"text-white"}`}>{s.v}</p>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="space-y-1.5">
        <SL><CalendarDays size={11}/>Rennkalender</SL>
        {champ.calendar.map((trackName,idx)=>{
          const played=playedSet.has(idx);
          const isNext=!done&&idx===nextCalIdx;
          const race=champ.races.find(r=>r.calendarIndex===idx);
          const winner=race?Object.entries(race.results).find(([,p])=>p===1):null;
          return (
            <div key={idx} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${played?"bg-emerald-500/8 border-emerald-500/20":isNext?"bg-blue-500/8 border-blue-500/30 ring-1 ring-blue-500/20":"bg-white/[0.02] border-white/[0.05]"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${played?"bg-emerald-500/20 border-emerald-500/50":isNext?"bg-blue-500/20 border-blue-500/50":"bg-white/[0.04] border-white/10"}`}>
                {played?<Check size={13} className="text-emerald-400"/>:<span className="text-[10px] font-mono font-bold text-white/40">{idx+1}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold truncate ${played?"text-white/65":isNext?"text-white":"text-white/45"}`}>{trackName}</p>
                  {isNext&&<span className="text-[9px] font-mono font-black text-blue-300 bg-blue-500/20 px-1.5 py-0.5 rounded uppercase tracking-widest shrink-0">NÄCHSTES</span>}
                </div>
                {race&&<div className="flex items-center gap-2 mt-0.5">
                  {winner&&<p className="text-xs text-white/30">Sieger: {winner[0]}</p>}
                  {race.tire&&<TireChip tireVal={race.tire} small/>}
                  {(race.weather||race.condition)&&<WeatherChip weatherVal={race.weather} condVal={race.condition} small/>}
                  <span className="text-xs text-white/25">{fmtDate(race.date)}</span>
                </div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Standings tabs — always show Ratings tab */}
      <div className="flex gap-0.5 p-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
        <button onClick={()=>setStandingsTab("drivers")} className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${standingsTab==="drivers"?"bg-white/10 text-white":"text-white/35 hover:text-white/55"}`}>Fahrer</button>
        {isTeamWM&&<button onClick={()=>setStandingsTab("teams")} className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${standingsTab==="teams"?"bg-white/10 text-white":"text-white/35 hover:text-white/55"}`}>Teams</button>}
        <button onClick={()=>setStandingsTab("ratings")} className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${standingsTab==="ratings"?"bg-white/10 text-white":"text-white/35 hover:text-white/55"}`}>Ratings</button>
      </div>

      {/* Driver standings */}
      {standingsTab==="drivers"&&(
        <div className="space-y-1.5">
          <SL><Users size={11}/>Fahrerwertung</SL>
          {standings.map(([driver,pts],i)=>{
            const team=isTeamWM?driverTeam(champ,driver):null;
            const r=(champ.driverRatings||{})[driver];
            return (
              <div key={driver} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${rowBg(i)}`}>
                <span className={`w-6 text-center font-mono text-sm shrink-0 ${posStyle(i)}`}>{i+1}</span>
                {i===0&&(done?<Crown size={14} className="text-yellow-400 shrink-0"/>:<Trophy size={13} className="text-yellow-400/70 shrink-0"/>)}
                {i===1&&<Medal size={13} className="text-slate-300 shrink-0"/>}
                {i===2&&<Award size={13} className="text-amber-600 shrink-0"/>}
                {i>2&&<span className="w-[13px] shrink-0"/>}
                <div className="flex-1 min-w-0">
                  <span className={`text-sm truncate block ${i<3?"font-semibold text-white":"text-white/75"}`}>{driver}{done&&i===0?" 🏆":""}</span>
                  {team&&<p className="text-[10px] text-white/30 font-mono">{team.name}{team.car?" · "+team.car:""}</p>}
                </div>
                {r&&<span className={`font-mono text-xs font-bold shrink-0 ${ratingColor(r.rating)}`}>OVR {r.rating}</span>}
                <span className={`font-mono text-sm font-bold shrink-0 ${i===0?"text-yellow-400":i===1?"text-slate-300":i===2?"text-amber-500":"text-white/50"}`}>{pts} Pkt</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Team standings */}
      {isTeamWM&&standingsTab==="teams"&&(
        <div className="space-y-1.5">
          <SL><Shield size={11}/>Konstrukteurs-WM</SL>
          {teamStandings.map(([teamName,pts],i)=>{
            const team=champ.teams.find(t=>t.name===teamName);
            const budget=(champ.teamBudgets||{})[teamName];
            return (
              <div key={teamName} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${rowBg(i)}`}>
                <span className={`w-6 text-center font-mono text-sm shrink-0 ${posStyle(i)}`}>{i+1}</span>
                {i===0&&(done?<Crown size={14} className="text-yellow-400 shrink-0"/>:<Trophy size={13} className="text-yellow-400/70 shrink-0"/>)}
                {i===1&&<Medal size={13} className="text-slate-300 shrink-0"/>}
                {i===2&&<Award size={13} className="text-amber-600 shrink-0"/>}
                {i>2&&<span className="w-[13px] shrink-0"/>}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${i<3?"text-white":"text-white/75"}`}>{teamName}{done&&i===0?" 🏆":""}</p>
                  {team&&team.drivers.length>0&&<p className="text-[10px] text-white/30 font-mono truncate">{team.drivers.join(" · ")}</p>}
                </div>
                <div className="text-right shrink-0">
                  <span className={`font-mono text-sm font-bold block ${i===0?"text-yellow-400":i===1?"text-slate-300":i===2?"text-amber-500":"text-white/50"}`}>{pts} Pkt</span>
                  {budget!=null&&<span className="text-[10px] font-mono text-emerald-400/70">{fmtEuro(budget)}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ratings tab */}
      {standingsTab==="ratings"&&(
        <div className="space-y-1.5">
          <SL><TrendingUp size={11}/>Fahrer-Ratings & Marktwerte</SL>
          {[...champ.drivers]
            .sort((a,b)=>((champ.driverRatings||{})[b]?.rating||70)-((champ.driverRatings||{})[a]?.rating||70))
            .map((driver,i)=>{
              const r=(champ.driverRatings||{})[driver]||{rating:70,value:500_000};
              const team=isTeamWM?driverTeam(champ,driver):null;
              return (
                <div key={driver} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${driver==="Ebby G"?"bg-red-500/8 border-red-500/20":"bg-white/[0.025] border-white/[0.06]"}`}>
                  <span className="w-5 text-center font-mono text-xs text-white/30 shrink-0">{i+1}</span>
                  <span className={`font-mono font-black text-xl w-10 text-center shrink-0 ${ratingColor(r.rating)}`}>{r.rating}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${driver==="Ebby G"?"text-white":"text-white/80"}`}>{driver}</p>
                    {team&&<p className="text-[10px] text-white/30 font-mono">{team.name}{team.car?" · "+team.car:""}</p>}
                  </div>
                  <span className="font-mono text-sm text-amber-400/80 shrink-0">{fmtEuro(r.value)}</span>
                </div>
              );
            })
          }
        </div>
      )}

      {/* Add race */}
      {!done&&!showRaceForm&&nextCalIdx>=0&&(
        <Btn v="dashed" onClick={()=>setShowRaceForm(true)}><Plus size={13}/>Nächstes Rennen: {champ.calendar[nextCalIdx]}</Btn>
      )}
      {done&&(
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 py-2 text-white/30 text-xs font-mono"><Lock size={12}/>Saison abgeschlossen</div>
          {showTransfer
            ? <TransferMarket champ={champ} onTransfer={onTransfer} onAiSwaps={onAiSwaps} onClose={()=>setShowTransfer(false)}/>
            : <Btn v="gold" onClick={()=>setShowTransfer(true)} className="w-full justify-center"><Shuffle size={14}/>Transfermarkt öffnen</Btn>
          }
        </div>
      )}

      {showRaceForm&&!done&&(
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-white/55 flex items-center gap-2"><CalendarDays size={13}/>Rennen eintragen</p>
            <button onClick={()=>setShowRaceForm(false)} className="text-white/30 hover:text-white/60"><X size={15}/></button>
          </div>
          <div>
            <FL>Kalender-Rennen</FL>
            <Sel value={raceCalIdx??""} onChange={e=>setRaceCalIdx(parseInt(e.target.value,10))}>
              <option value="" disabled>Rennen wählen…</option>
              {champ.calendar.map((t,i)=>!playedSet.has(i)&&<option key={i} value={i}>Rennen {i+1}: {t}</option>)}
            </Sel>
          </div>

          {/* Tire recommendation for this race */}
          {tireRec&&(
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Zap size={12} className="text-blue-400 shrink-0"/>
              <span className="text-xs text-blue-300 flex-1">{tireRec.reason}</span>
              <button onClick={()=>setRTire(tireRec.tire)} className="text-[10px] font-mono font-bold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded hover:bg-blue-500/30 transition-colors shrink-0">Anwenden</button>
            </div>
          )}

          {/* Weather row */}
          <div className="grid grid-cols-3 gap-2">
            <div><FL>Wetter</FL>
              <div className="flex gap-1">
                {WEATHER_OPTIONS.map(w=>(
                  <button key={w.value} onClick={()=>setRWeather(rWeather===w.value?"":w.value)}
                    className={`flex-1 py-2 rounded-lg border text-base transition-all ${rWeather===w.value?"border-sky-400/50 bg-sky-400/15":"border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"}`}>
                    {w.icon}
                  </button>
                ))}
              </div>
            </div>
            <div><FL>Zustand</FL><Sel value={rCondition} onChange={e=>setRCondition(e.target.value)}><option value="">–</option>{CONDITION_OPTIONS.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}</Sel></div>
            <div><FL>Start-Reifen</FL><Sel value={rTire} onChange={e=>setRTire(e.target.value)}><option value="">–</option>{TIRE_OPTIONS.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</Sel></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><FL>Luft (°C)</FL><Inp type="number" value={rAirTemp} onChange={e=>setRAirTemp(e.target.value)} placeholder="22"/></div>
            <div><FL>Asphalt (°C)</FL><Inp type="number" value={rAsphaltTemp} onChange={e=>setRAsphaltTemp(e.target.value)} placeholder="35"/></div>
            <div><FL>Wind (km/h)</FL><Inp type="number" value={rWindSpeed} onChange={e=>setRWindSpeed(e.target.value)} placeholder="12"/></div>
          </div>

          <div>
            <FL>Endplatzierungen (1 = Sieger)</FL>
            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
              {champ.drivers.map(driver=>{
                const team=isTeamWM?driverTeam(champ,driver):null;
                return (
                  <div key={driver} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm truncate ${driver==="Ebby G"?"font-semibold text-white":"text-white/70"}`}>{driver==="Ebby G"?"★ ":""}{driver}</span>
                      {team&&<span className="text-[10px] text-white/30 font-mono ml-1">({team.name})</span>}
                    </div>
                    <Inp type="number" min="1" max={dCount} value={positions[driver]||""} onChange={e=>setPositions(p=>({...p,[driver]:e.target.value}))} placeholder="Platz" className="w-20 text-center"/>
                  </div>
                );
              })}
            </div>
          </div>
          {formErr&&<p className="text-xs text-red-400 flex items-center gap-1"><X size={11}/>{formErr}</p>}
          <Btn onClick={handleAddRace}><Plus size={14}/>Rennen speichern</Btn>
        </div>
      )}
    </div>
  );
}

// ─── Championship Tab ─────────────────────────────────────────────────────────

function ChampionshipTab({game,tracks,cars,championships,onAddChampionship,onAddChampRace,onDeleteChampionship,onTransfer,onAiSwaps}) {
  const gameChamps=championships.filter(c=>c.game===game);
  const gameCars=cars[game]||[];
  const [selId,setSelId]=useState(null);
  const [showCreate,setShowCreate]=useState(false);
  const [champName,setChampName]=useState("");
  const [wmType,setWmType]=useState("single");
  const [driverInput,setDriverInput]=useState(""); const [driverList,setDriverList]=useState(["Ebby G"]);
  const [ebbysRating,setEbbysRating]=useState(75);
  const [calList,setCalList]=useState([]); const [calInput,setCalInput]=useState(tracks[0]||"");
  const [teams,setTeams]=useState([]);
  const [teamNameInput,setTeamNameInput]=useState("");
  const [assignDriver,setAssignDriver]=useState(""); const [assignTeam,setAssignTeam]=useState("");
  const [assignCar,setAssignCar]=useState("");
  const [createErr,setCreateErr]=useState("");

  const selChamp=gameChamps.find(c=>c.id===selId);

  function handleAddCal(){if(!calInput)return;setCalList(c=>[...c,calInput]);}
  function handleAddDriver(){const n=driverInput.trim();if(!n||driverList.includes(n)){setDriverInput("");return;}if(driverList.length>=30){setCreateErr("Max. 30 Fahrer.");return;}setDriverList(d=>[...d,n]);setDriverInput("");}
  function handleAddTeam(){const n=teamNameInput.trim();if(!n||teams.find(t=>t.name===n))return;setTeams(t=>[...t,{name:n,drivers:[],car:""}]);setTeamNameInput("");}
  function handleAssignDriver(){
    if(!assignDriver||!assignTeam)return;
    setTeams(prev=>prev.map(t=>t.name===assignTeam?{...t,drivers:[...new Set([...t.drivers,assignDriver])]}:t.name!==assignTeam?{...t,drivers:t.drivers.filter(d=>d!==assignDriver)}:t));
  }
  function handleSetTeamCar(tName,car){setTeams(prev=>prev.map(t=>t.name===tName?{...t,car}:t));}
  function handleRemoveDriverFromTeam(tName,driver){setTeams(prev=>prev.map(t=>t.name===tName?{...t,drivers:t.drivers.filter(d=>d!==driver)}:t));}

  function handleCreate(){
    setCreateErr("");
    if(!champName.trim()){setCreateErr("Name eingeben.");return;}
    if(driverList.length<2){setCreateErr("Mindestens 2 Fahrer.");return;}
    if(calList.length<1){setCreateErr("Mindestens 1 Rennen im Kalender.");return;}
    if(wmType==="team"&&teams.length<2){setCreateErr("Mindestens 2 Teams für Team-WM.");return;}
    const ratings = initDriverRatings(driverList, ebbysRating);
    const obj={id:generateId(),game,name:champName.trim(),drivers:driverList,calendar:calList,races:[],driverRatings:ratings};
    if(wmType==="team") obj.teams=teams;
    onAddChampionship(obj);
    setChampName("");setDriverList(["Ebby G"]);setCalList([]);setTeams([]);setShowCreate(false);
  }

  if(selChamp) return <ChampionshipDetail champ={selChamp} onBack={()=>setSelId(null)} onAddRace={onAddChampRace} onDeleteChampionship={id=>{onDeleteChampionship(id);setSelId(null);}} onTransfer={onTransfer} onAiSwaps={onAiSwaps}/>;
  return (
    <div className="space-y-4">
      {gameChamps.length===0&&!showCreate&&<div className="text-center py-10 text-white/20 text-sm"><Trophy size={30} className="mx-auto mb-2 opacity-30"/>Noch keine Meisterschaften</div>}

      {gameChamps.map(c=>{
        const s=computeStandings(c); const d=seasonDone(c); const leader=s[0];
        const prog=c.calendar.length>0?Math.round((c.races.length/c.calendar.length)*100):0;
        const isTeam=!!c.teams;
        return (
          <button key={c.id} onClick={()=>setSelId(c.id)} className="w-full flex items-center gap-4 px-4 py-4 rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15 transition-all group text-left">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${d?"bg-yellow-500/20":"bg-white/[0.06]"}`}>
              {isTeam?<Shield size={16} className={d?"text-yellow-400":"text-blue-400/70"}/>:<Trophy size={16} className={d?"text-yellow-400":"text-white/50"}/>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm truncate flex items-center gap-1.5">
                {d&&<Lock size={10} className="text-yellow-400"/>}
                {isTeam&&<span className="text-[9px] font-mono text-blue-400/70 bg-blue-400/10 px-1.5 py-0.5 rounded">TEAM</span>}
                {c.name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{width:`${prog}%`}}/></div>
                <span className="text-[10px] font-mono text-white/30">{c.races.length}/{c.calendar.length}</span>
              </div>
            </div>
            {leader&&<div className="text-right shrink-0"><p className={`text-xs font-semibold ${d?"text-yellow-400":"text-white/60"}`}>{leader[0].split(" ").slice(-1)[0]}</p><p className="text-xs text-white/35 font-mono">{leader[1]} Pkt</p></div>}
            <ChevronRight size={15} className="text-white/20 group-hover:text-white/50 shrink-0"/>
          </button>
        );
      })}

      {showCreate&&(
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-white/55 flex items-center gap-2"><Trophy size={13}/>Neue Meisterschaft</p>
            <button onClick={()=>setShowCreate(false)} className="text-white/30 hover:text-white/60"><X size={15}/></button>
          </div>

          <div><FL>Name</FL><Inp value={champName} onChange={e=>setChampName(e.target.value)} placeholder="z.B. GT3 Winter Season 2026"/></div>

          {/* Ebby's start rating */}
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 space-y-2">
            <FL>★ Ebby G — Start-Rating ({ebbysRating})</FL>
            <div className="flex items-center gap-3">
              <input type="range" min={RATING_MIN} max={RATING_MAX} value={ebbysRating} onChange={e=>setEbbysRating(Number(e.target.value))} className="flex-1 accent-red-500"/>
              <span className={`font-mono font-black text-xl w-10 text-center ${ratingColor(ebbysRating)}`}>{ebbysRating}</span>
              <button onClick={()=>setEbbysRating(Math.round(65+Math.random()*20))} className="text-[10px] px-2 py-1 rounded bg-white/[0.07] hover:bg-white/10 text-white/50 font-mono">🎲</button>
            </div>
            <p className="text-[10px] text-white/30 font-mono">Marktwert: {fmtEuro(ratingToValue(ebbysRating))}</p>
          </div>

          {/* WM type selector */}
          <div>
            <FL>Meisterschafts-Modus</FL>
            <div className="flex gap-2">
              <button onClick={()=>setWmType("single")} className={`flex-1 py-2.5 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${wmType==="single"?"bg-emerald-500/15 border-emerald-500/40 text-emerald-300":"bg-white/[0.04] border-white/10 text-white/45 hover:text-white/70"}`}>
                <Users size={13}/>Einzel-WM
              </button>
              <button onClick={()=>setWmType("team")} className={`flex-1 py-2.5 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${wmType==="team"?"bg-blue-500/15 border-blue-500/40 text-blue-300":"bg-white/[0.04] border-white/10 text-white/45 hover:text-white/70"}`}>
                <Shield size={13}/>Team-WM
              </button>
            </div>
          </div>

          {/* Calendar */}
          <div>
            <FL>Rennkalender ({calList.length} Rennen)</FL>
            {calList.length>0&&<div className="space-y-1 mb-2">{calList.map((t,i)=>(
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07]">
                <span className="text-[10px] font-mono text-white/30 w-5 text-right shrink-0">{i+1}</span>
                <span className="flex-1 text-sm text-white/75">{t}</span>
                <button onClick={()=>setCalList(l=>l.filter((_,j)=>j!==i))} className="text-white/20 hover:text-red-400"><X size={12}/></button>
              </div>
            ))}</div>}
            <div className="flex gap-2">
              <Sel value={calInput} onChange={e=>setCalInput(e.target.value)} className="flex-1"><option value="">Strecke…</option>{tracks.map(t=><option key={t} value={t}>{t}</option>)}</Sel>
              <Btn onClick={handleAddCal} disabled={!calInput}><Plus size={14}/></Btn>
            </div>
          </div>

          {/* Drivers */}
          <div>
            <FL>Fahrer ({driverList.length}/30)</FL>
            <div className="flex gap-2 mb-2">
              <Inp value={driverInput} onChange={e=>setDriverInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handleAddDriver();}} placeholder="Fahrername…"/>
              <Btn onClick={handleAddDriver}><Plus size={14}/></Btn>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {driverList.map(d=>(
                <span key={d} className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs border ${d==="Ebby G"?"bg-red-500/15 text-red-300 border-red-500/25":"bg-white/[0.07] text-white/80 border-white/10"}`}>
                  {d==="Ebby G"?"★ ":""}{d}
                  <button onClick={()=>setDriverList(l=>l.filter(x=>x!==d))} className="text-white/30 hover:text-red-400 ml-0.5"><X size={10}/></button>
                </span>
              ))}
            </div>
          </div>

          {/* Team setup for Team-WM */}
          {wmType==="team"&&(
            <div className="space-y-3 border-t border-white/[0.08] pt-3">
              <p className="text-xs font-semibold text-blue-300/70 flex items-center gap-1.5"><Shield size={12}/>Teams erstellen</p>
              <div className="flex gap-2">
                <Inp value={teamNameInput} onChange={e=>setTeamNameInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handleAddTeam();}} placeholder="z.B. Porsche Motorsport"/>
                <Btn onClick={handleAddTeam} v="blue"><Plus size={14}/></Btn>
              </div>

              {teams.map(team=>(
                <div key={team.name} className="rounded-lg border border-blue-500/15 bg-blue-500/5 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-blue-300">{team.name}</p>
                    <button onClick={()=>setTeams(t=>t.filter(x=>x.name!==team.name))} className="text-white/20 hover:text-red-400"><X size={12}/></button>
                  </div>
                  {/* Stamm-Auto */}
                  <div>
                    <FL>Stamm-Auto</FL>
                    <Sel value={team.car} onChange={e=>handleSetTeamCar(team.name,e.target.value)}>
                      <option value="">–</option>
                      {gameCars.map(c=><option key={c} value={c}>{c}</option>)}
                    </Sel>
                  </div>
                  {/* Driver assignment */}
                  <div>
                    <FL>Fahrer zuweisen (max. 3)</FL>
                    <div className="flex gap-2">
                      <Sel value={assignTeam===team.name?assignDriver:""} onChange={e=>{setAssignTeam(team.name);setAssignDriver(e.target.value);}}>
                        <option value="">Fahrer wählen…</option>
                        {driverList.filter(d=>!teams.find(t=>t.name!==team.name&&t.drivers.includes(d))).map(d=><option key={d} value={d}>{d}</option>)}
                      </Sel>
                      <Btn onClick={()=>{if(assignTeam===team.name){if(team.drivers.length>=3){setCreateErr("Max. 3 Fahrer pro Team.");return;}handleAssignDriver();}}} disabled={!assignDriver||assignTeam!==team.name} v="blue"><Plus size={14}/></Btn>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {team.drivers.map(d=>(
                        <span key={d} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-500/10 text-blue-300 border border-blue-500/20">
                          {d}<button onClick={()=>handleRemoveDriverFromTeam(team.name,d)} className="text-blue-300/30 hover:text-red-400"><X size={9}/></button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {createErr&&<p className="text-xs text-red-400 flex items-center gap-1"><X size={11}/>{createErr}</p>}
          <Btn onClick={handleCreate}><Plus size={14}/>Meisterschaft erstellen</Btn>
        </div>
      )}

      {!showCreate&&<Btn v="dashed" onClick={()=>setShowCreate(true)}><Plus size={13}/>Neue Meisterschaft anlegen</Btn>}
    </div>
  );
}

// ─── Game Detail ──────────────────────────────────────────────────────────────

function GameDetail({game,state,onAddLap,onDeleteLap,onAddTrack,onAddRace,onDeleteRace,onSaveNote,onAddChampionship,onAddChampRace,onDeleteChampionship,onTransfer,onAiSwaps,onBack}) {
  const [tab,setTab]=useState("tracks");
  const colors=GAME_COLORS[game];
  const {tracks,cars,lapTimes,races,championships,setupNotes}=state;
  const gameTracks=tracks[game]||[];
  const TABS=[
    {key:"tracks",label:"Strecken",icon:<MapPin size={13}/>},
    {key:"cars",label:"Autos",icon:<Car size={13}/>},
    {key:"races",label:"Rennen",icon:<Flag size={13}/>},
    {key:"championship",label:"Championship",icon:<Trophy size={13}/>},
  ];
  return (
    <div className="space-y-5">
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors text-sm mb-4"><ChevronLeft size={15}/>Alle Spiele</button>
        <div className="rounded-2xl overflow-hidden border border-white/10">
          <div className="relative px-6 py-6" style={{background:`linear-gradient(135deg,${colors.from}CC,${colors.to}CC)`}}>
            <div className="absolute inset-0 opacity-10" style={{backgroundImage:`repeating-linear-gradient(0deg,transparent,transparent 28px,rgba(255,255,255,0.15) 28px,rgba(255,255,255,0.15) 29px),repeating-linear-gradient(90deg,transparent,transparent 28px,rgba(255,255,255,0.15) 28px,rgba(255,255,255,0.15) 29px)`}}/>
            <div className="relative">
              <span className="inline-block font-mono text-[10px] font-black px-2 py-0.5 rounded mb-2 tracking-widest" style={{background:colors.accent+"25",color:colors.accent,border:`1px solid ${colors.accent}40`}}>{GAME_ABBR[game]}</span>
              <h1 className="text-xl font-black text-white">{game}</h1>
              <div className="flex gap-4 mt-2">
                {[{i:<MapPin size={10}/>,v:gameTracks.length,l:"Strecken"},{i:<Car size={10}/>,v:(cars[game]||[]).length,l:"Autos"},{i:<Clock size={10}/>,v:lapTimes.filter(l=>l.game===game).length,l:"Zeiten"},{i:<Flag size={10}/>,v:races.filter(r=>r.game===game).length,l:"Rennen"}].map(s=>(
                  <div key={s.l} className="flex items-center gap-1 text-white/55 text-xs">{s.i}<span>{s.v} {s.l}</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-0.5 p-1 rounded-xl bg-white/[0.04] border border-white/[0.07]">
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold transition-all ${tab===t.key?"bg-white/10 text-white":"text-white/35 hover:text-white/55"}`}>
            {t.icon}<span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>
      {tab==="tracks"       &&<TracksTab game={game} tracks={tracks} cars={cars} lapTimes={lapTimes} setupNotes={setupNotes} onAddLap={onAddLap} onDeleteLap={onDeleteLap} onAddTrack={onAddTrack} onSaveNote={onSaveNote}/>}
      {tab==="cars"         &&<CarsTab   game={game} cars={cars} lapTimes={lapTimes} setupNotes={setupNotes} onDeleteLap={onDeleteLap} onSaveNote={onSaveNote}/>}
      {tab==="races"        &&<RacesTab  game={game} tracks={tracks} cars={cars} races={races} onAddRace={onAddRace} onDeleteRace={onDeleteRace}/>}
      {tab==="championship" &&<ChampionshipTab game={game} tracks={gameTracks} cars={cars} championships={championships} onAddChampionship={onAddChampionship} onAddChampRace={onAddChampRace} onDeleteChampionship={onDeleteChampionship} onTransfer={onTransfer} onAiSwaps={onAiSwaps}/>}
    </div>
  );
}

// ─── Game Grid ────────────────────────────────────────────────────────────────

function GameGrid({state,onSelect}) {
  const {lapTimes,cars,tracks,races}=state;
  return (
    <div className="space-y-5">
      <div><h2 className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">Spielbibliothek</h2><p className="text-white/50 text-sm">{GAMES.length} Spiele verfügbar</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {GAMES.map(game=>{
          const colors=GAME_COLORS[game];
          const st={tracks:(tracks[game]||[]).length,cars:(cars[game]||[]).length,laps:lapTimes.filter(l=>l.game===game).length,races:races.filter(r=>r.game===game).length};
          return (
            <button key={game} onClick={()=>onSelect(game)} className="relative overflow-hidden rounded-2xl border border-white/10 p-5 text-left transition-all hover:scale-[1.02] hover:border-white/20 group" style={{background:`linear-gradient(145deg,${colors.from}BB,${colors.to}BB)`}}>
              <div className="absolute inset-0 opacity-[0.07] group-hover:opacity-[0.12] transition-opacity" style={{backgroundImage:`repeating-linear-gradient(0deg,transparent,transparent 20px,rgba(255,255,255,0.3) 20px,rgba(255,255,255,0.3) 21px),repeating-linear-gradient(90deg,transparent,transparent 20px,rgba(255,255,255,0.3) 20px,rgba(255,255,255,0.3) 21px)`}}/>
              <div className="absolute top-0 right-0 w-20 h-20 opacity-20" style={{background:`radial-gradient(circle at top right,${colors.accent},transparent 70%)`}}/>
              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded tracking-widest" style={{background:colors.accent+"25",color:colors.accent,border:`1px solid ${colors.accent}40`}}>{GAME_ABBR[game]}</span>
                  <ChevronRight size={15} className="text-white/30 group-hover:text-white/60 transition-colors"/>
                </div>
                <h3 className="font-bold text-white text-sm leading-tight mb-3">{game}</h3>
                <div className="flex gap-3">
                  <span className="flex items-center gap-1 text-white/50 text-xs"><MapPin size={9}/>{st.tracks}</span>
                  <span className="flex items-center gap-1 text-white/50 text-xs"><Car size={9}/>{st.cars}</span>
                  <span className="flex items-center gap-1 text-white/50 text-xs"><Clock size={9}/>{st.laps}</span>
                  <span className="flex items-center gap-1 text-white/50 text-xs"><Flag size={9}/>{st.races}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [state,setState]=useState(()=>loadState());
  const [selectedGame,setSelectedGame]=useState(null);
  const [fanToast,setFanToast]=useState(null);

  // Persist to localStorage on every state change — this is what keeps all
  // data (tracks, cars, lap times, races, championships, fans, notes) safe
  // across page reloads in the browser.
  useEffect(()=>{saveState(state);},[state]);

  function triggerFanGain(delta,label="") { if(delta>0) setFanToast({delta,label}); }

  const handleAddLap=useCallback((game,track,car,timeInMs,formattedTime,wx={})=>{
    setState(prev=>{
      const ex=prev.cars[game]||[];
      return{...prev,
        cars:{...prev.cars,[game]:ex.includes(car)?ex:[...ex,car]},
        lapTimes:[...prev.lapTimes,{id:generateId(),game,track,car,timeInMs,formattedTime,date:new Date().toISOString().split("T")[0],...wx}],
      };
    });
  },[]);

  const handleDeleteLap=useCallback((id)=>{setState(prev=>({...prev,lapTimes:prev.lapTimes.filter(l=>l.id!==id)}));},[]);
  const handleAddTrack=useCallback((game,name)=>{setState(prev=>{const ex=prev.tracks[game]||[];if(ex.includes(name))return prev;return{...prev,tracks:{...prev.tracks,[game]:[...ex,name]}};});},[]);

  const handleAddRace=useCallback((race)=>{
    const delta=fanDelta(race.finishPos);
    setState(prev=>({...prev,races:[...prev.races,race],fans:prev.fans+delta}));
    triggerFanGain(delta,race.finishPos<=3?`Podium auf ${race.track}!`:"");
  },[]);

  const handleDeleteRace=useCallback((id)=>{setState(prev=>({...prev,races:prev.races.filter(r=>r.id!==id)}));},[]);
  const handleSaveNote=useCallback((key,val)=>{setState(prev=>({...prev,setupNotes:{...prev.setupNotes,[key]:val}}));},[]);
  const handleAddChampionship=useCallback((champ)=>{setState(prev=>({...prev,championships:[...prev.championships,champ]}));},[]);

  const handleAddChampRace=useCallback((champId,race)=>{
    setState(prev=>{
      const updated=prev.championships.map(c=>{
        if(c.id!==champId) return c;
        const newRaces=[...c.races,race];
        // update ratings after this race
        const newRatings=applyRaceToRatings(c.driverRatings||{},race.results);
        let extra={driverRatings:newRatings};
        // if season just finished, compute prize money
        const projected={...c,races:newRaces};
        if(seasonDone(projected)&&c.teams){
          const tStandings=computeTeamStandings(projected);
          const budgets={...(c.teamBudgets||{})};
          tStandings.forEach(([tName],i)=>{ budgets[tName]=(budgets[tName]||0)+constructorPrize(i+1); });
          extra.teamBudgets=budgets;
        }
        return{...c,races:newRaces,...extra};
      });
      const ch=updated.find(c=>c.id===champId);
      const ep=race.results["Ebby G"];
      const delta=ep?fanDelta(ep):0;
      let bonus=0;
      if(seasonDone(ch)){
        const pos=computeStandings(ch).findIndex(([d])=>d==="Ebby G")+1;
        bonus=champBonus(pos);
        if(bonus>0) setTimeout(()=>triggerFanGain(bonus,pos===1?"🏆 WM-TITEL!":` Top-${pos} Saison-Bonus!`),700);
      }
      if(delta>0) triggerFanGain(delta,ep<=3?`Podium Rennen ${ch.races.length}!`:"");
      return{...prev,championships:updated,fans:prev.fans+delta};
    });
  },[]);

  const handleTransfer=useCallback((champId,driver,teamName,cost)=>{
    setState(prev=>({
      ...prev,
      championships:prev.championships.map(c=>{
        if(c.id!==champId||!c.teams) return c;
        const newTeams=c.teams.map(t=>{
          // remove driver from current team
          const without={...t,drivers:t.drivers.filter(d=>d!==driver)};
          // add to target team (replace oldest non-Ebby if full)
          if(t.name===teamName){
            const newDrivers=[...without.drivers,driver].slice(-3);
            return{...without,drivers:newDrivers};
          }
          return without;
        });
        const newBudgets={...(c.teamBudgets||{})};
        newBudgets[teamName]=(newBudgets[teamName]||0)-cost;
        return{...c,teams:newTeams,teamBudgets:newBudgets};
      }),
    }));
  },[]);

  const handleAiSwaps=useCallback((champId)=>{
    let swapLog=[];
    setState(prev=>({
      ...prev,
      championships:prev.championships.map(c=>{
        if(c.id!==champId||!c.teams) return c;
        const result=aiRandomTransfers(c.teams,c.driverRatings||{});
        swapLog=result.log||[];
        return{...c,teams:result.newTeams,lastAiSwaps:swapLog};
      }),
    }));
    return swapLog;
  },[]);

  const handleDeleteChampionship=useCallback((id)=>{setState(prev=>({...prev,championships:prev.championships.filter(c=>c.id!==id)}));},[]);

  const totalLaps=state.lapTimes.length;
  const totalCars=Object.values(state.cars).flat().length;

  // ── Export / Import modals (manual text backup — optional extra safety net) ─

  const [exportModal, setExportModal] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [importText,  setImportText]  = useState("");
  const [importErr,   setImportErr]   = useState("");
  const [copyDone,    setCopyDone]    = useState(false);

  const exportJson = JSON.stringify(
    { ...state, _version: 1, _exported: new Date().toISOString() },
    null, 2
  );

  function handleCopy() {
    try {
      navigator.clipboard.writeText(exportJson).then(() => {
        setCopyDone(true);
        setTimeout(() => setCopyDone(false), 2500);
      }).catch(() => {
        // fallback: select the textarea text
        const el = document.getElementById("srt-export-textarea");
        if (el) { el.select(); document.execCommand("copy"); }
        setCopyDone(true);
        setTimeout(() => setCopyDone(false), 2500);
      });
    } catch { /* silent */ }
  }

  function handleImportConfirm() {
    setImportErr("");
    try {
      const parsed = JSON.parse(importText);
      if (!parsed.lapTimes || !parsed.tracks) throw new Error("Ungültiges Format – fehlen lapTimes oder tracks.");
      const restored = {
        tracks:        parsed.tracks        || INITIAL_TRACKS,
        cars:          parsed.cars          || INITIAL_CARS,
        lapTimes:      parsed.lapTimes      || [],
        races:         parsed.races         || [],
        championships: parsed.championships || [],
        fans:          parsed.fans          ?? 1200,
        setupNotes:    parsed.setupNotes    || {},
      };
      setState(restored);
      saveState(restored);
      lsSet(LS.initialized, "1");
      setImportModal(false);
      setImportText("");
    } catch(e) {
      setImportErr("Fehler: " + e.message);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-900/10 rounded-full blur-3xl"/>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-900/8 rounded-full blur-3xl"/>
      </div>

      {fanToast&&<FanToast delta={fanToast.delta} label={fanToast.label} onDone={()=>setFanToast(null)}/>}

      {/* ── Export Modal ── */}
      {exportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-emerald-500/30 bg-[#0f0f18] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
              <div className="flex items-center gap-2">
                <Download size={15} className="text-emerald-400"/>
                <h2 className="text-sm font-bold text-white">Daten sichern</h2>
              </div>
              <button onClick={()=>setExportModal(false)} className="text-white/30 hover:text-white/70 transition-colors"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-white/50">Deine Daten werden automatisch im Browser gespeichert. Zusätzlich kannst du hier den Text unten kopieren und als <span className="text-emerald-400 font-mono">.txt</span>-Datei sichern — z.B. um sie auf einem anderen Gerät oder Browser wiederherzustellen.</p>
              <textarea
                id="srt-export-textarea"
                readOnly
                value={exportJson}
                rows={10}
                className="w-full rounded-lg px-3 py-2.5 text-xs font-mono bg-[#1a1a28] border border-[#3a3a55] text-emerald-300 focus:outline-none resize-none"
                onClick={e => e.target.select()}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-bold transition-all ${
                    copyDone
                      ? "bg-emerald-500/25 border-emerald-400/50 text-emerald-300"
                      : "bg-emerald-600/20 hover:bg-emerald-600/35 border-emerald-500/30 text-emerald-300"
                  }`}
                >
                  {copyDone ? <><Check size={14}/>Kopiert!</> : <><Download size={14}/>Text kopieren</>}
                </button>
                <button
                  onClick={()=>setExportModal(false)}
                  className="px-4 py-2.5 rounded-lg border border-white/10 bg-white/[0.05] hover:bg-white/10 text-white/60 text-sm font-semibold transition-colors"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Import Modal ── */}
      {importModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-blue-500/30 bg-[#0f0f18] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
              <div className="flex items-center gap-2">
                <Upload size={15} className="text-blue-400"/>
                <h2 className="text-sm font-bold text-white">Daten laden</h2>
              </div>
              <button onClick={()=>{setImportModal(false);setImportText("");setImportErr("");}} className="text-white/30 hover:text-white/70 transition-colors"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-white/50">Füge deinen gespeicherten Backup-Text unten ein und klicke auf „Importieren". Alle aktuellen Daten werden ersetzt.</p>
              <textarea
                value={importText}
                onChange={e=>{setImportText(e.target.value);setImportErr("");}}
                rows={10}
                placeholder='Backup-Text hier einfügen (Strg+V) …'
                className="w-full rounded-lg px-3 py-2.5 text-xs font-mono bg-[#1a1a28] border border-[#3a3a55] text-blue-200 placeholder-white/20 focus:outline-none focus:border-blue-500/50 resize-none"
              />
              {importErr && (
                <p className="flex items-center gap-1.5 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                  <X size={11}/>{importErr}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleImportConfirm}
                  disabled={!importText.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-blue-500/40 bg-blue-600/20 hover:bg-blue-600/35 text-blue-300 text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Upload size={14}/>Importieren
                </button>
                <button
                  onClick={()=>{setImportModal(false);setImportText("");setImportErr("");}}
                  className="px-4 py-2.5 rounded-lg border border-white/10 bg-white/[0.05] hover:bg-white/10 text-white/60 text-sm font-semibold transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="relative sticky top-0 z-30 border-b border-white/[0.07] bg-[#0A0A0F]/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center"><Flag size={14} className="text-red-400"/></div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-black tracking-tight text-white leading-none">SIM RACING<span className="text-red-500"> TRACKER</span></h1>
              <p className="text-[9px] text-white/25 font-mono tracking-widest">PERFORMANCE LOGGER</p>
            </div>
          </div>

          {/* Save / Load buttons */}
          <div className="flex items-center gap-1.5 flex-1 justify-center sm:justify-start">
            <button
              onClick={()=>setExportModal(true)}
              title="Daten sichern – zeigt Backup-Code zum Kopieren"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-colors"
            >
              <Download size={12}/>
              <span className="hidden sm:inline">Sichern</span>
            </button>
            <button
              onClick={()=>setImportModal(true)}
              title="Daten laden – Backup-Code einfügen und wiederherstellen"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/35 border border-blue-500/30 text-blue-300 text-xs font-semibold transition-colors"
            >
              <Upload size={12}/>
              <span className="hidden sm:inline">Laden</span>
            </button>
          </div>

          {/* Profile + fans */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="text-right">
              <p className="text-xs font-bold text-white/80 leading-none">Ebby G</p>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <Heart size={9} className="text-pink-400 fill-pink-400"/>
                <span className="text-[11px] font-mono font-black text-pink-400">{fmtFans(state.fans)}</span>
                <span className="text-[9px] text-white/25 font-mono">Fans</span>
              </div>
              <p className="text-[9px] text-white/20 font-mono text-right">{totalLaps}L · {totalCars}C</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600 to-red-900 border-2 border-red-500/40 flex items-center justify-center shrink-0"><User size={14} className="text-white"/></div>
          </div>
        </div>
      </header>

      <main className="relative max-w-2xl mx-auto px-4 py-6">
        {selectedGame?(
          <GameDetail
            game={selectedGame} state={state}
            onAddLap={handleAddLap} onDeleteLap={handleDeleteLap}
            onAddTrack={handleAddTrack}
            onAddRace={handleAddRace} onDeleteRace={handleDeleteRace}
            onSaveNote={handleSaveNote}
            onAddChampionship={handleAddChampionship}
            onAddChampRace={handleAddChampRace}
            onDeleteChampionship={handleDeleteChampionship}
            onTransfer={handleTransfer}
            onAiSwaps={handleAiSwaps}
            onBack={()=>setSelectedGame(null)}
          />
        ):(
          <GameGrid state={state} onSelect={setSelectedGame}/>
        )}
      </main>
    </div>
  );
}