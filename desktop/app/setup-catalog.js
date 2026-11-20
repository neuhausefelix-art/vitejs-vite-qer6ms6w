/* Lapbook setup catalog: every setup option of a game gets an area (like the
   tabs in the game's setup menu), a readable name and, where known, a unit.
   Values are stored with the game's own keys, so nothing is lost: options the
   catalog does not know go to "Other" with their raw name. */
(function () {
  "use strict";
  const AREAS = ["Tyres", "Alignment", "Aero", "Suspension", "Dampers", "Drivetrain", "Brakes", "Electronics", "Hybrid", "Fuel & strategy", "Other"];
  const WHEEL = { LF: "FL", RF: "FR", LR: "RL", RR: "RR", FL: "FL", FR: "FR", RL: "RL" };
  const WHEELS = ["FL", "FR", "RL", "RR"];
  const nice = s => String(s).replace(/_/g, " ").toLowerCase().replace(/^\w/, c => c.toUpperCase());

  // ---- Assetto Corsa: section names of the setup .ini ----
  // [area, label, unit, base pattern]; order matters (fast dampers before slow)
  const AC_RULES = [
    [/^TYRES$/, "Tyres", "Compound", "index"],
    [/^PRESSURE_/, "Tyres", "Pressure", "psi"],
    [/^CAMBER_/, "Alignment", "Camber", "clicks"],
    [/^TOE_OUT_/, "Alignment", "Toe", "clicks"],
    [/^CASTER/, "Alignment", "Caster", "clicks"],
    [/^STEER_RATIO|^STEER_ASSIST/, "Alignment", "Steering ratio", "clicks"],
    [/^WING_(\d+)$/, "Aero", m => `Wing ${m[1]}`, "clicks"],
    [/^SPLITTER/, "Aero", "Splitter", "clicks"],
    [/^SPRING_RATE_/, "Suspension", "Spring rate", "clicks"],
    [/^ROD_LENGTH_/, "Suspension", "Ride height (rod length)", "clicks"],
    [/^PACKER_RANGE_/, "Suspension", "Packers", "clicks"],
    [/^BUMP_STOP_RATE_/, "Suspension", "Bump stop rate", "clicks"],
    [/^BUMP_STOP_/, "Suspension", "Bump stop", "clicks"],
    [/^ARB_FRONT$/, "Suspension", "Anti-roll bar front", "clicks"],
    [/^ARB_REAR$/, "Suspension", "Anti-roll bar rear", "clicks"],
    [/^(HEAVE|THIRD)_.*FRONT|^(HEAVE|THIRD)_F/, "Suspension", "Heave spring front", "clicks"],
    [/^(HEAVE|THIRD)_.*REAR|^(HEAVE|THIRD)_R/, "Suspension", "Heave spring rear", "clicks"],
    [/^(HEAVE|THIRD)/, "Suspension", "Heave spring", "clicks"],
    [/^DAMP_FAST_BUMP_/, "Dampers", "Fast bump", "clicks"],
    [/^DAMP_FAST_REBOUND_/, "Dampers", "Fast rebound", "clicks"],
    [/^DAMP_BUMP_/, "Dampers", "Slow bump", "clicks"],
    [/^DAMP_REBOUND_/, "Dampers", "Slow rebound", "clicks"],
    [/^DIFF_POWER$/, "Drivetrain", "Diff power", "%"],
    [/^DIFF_COAST$/, "Drivetrain", "Diff coast", "%"],
    [/^DIFF_PRELOAD$/, "Drivetrain", "Diff preload", "Nm"],
    [/^FRONT_DIFF_(\w+)$/, "Drivetrain", m => `Front diff ${nice(m[1]).toLowerCase()}`, ""],
    [/^CENTER_DIFF_(\w+)$/, "Drivetrain", m => `Center diff ${nice(m[1]).toLowerCase()}`, ""],
    [/^(FINAL_RATIO|FINAL_GEAR_RATIO|FINAL_DRIVE)$/, "Drivetrain", "Final drive", "index"],
    [/^INTERNAL_GEAR_(\d+)$/, "Drivetrain", m => `Gear ${m[1]}`, "index"],
    [/^GEARSET|^GEAR_SET/, "Drivetrain", "Gear set", "index"],
    [/^FRONT_BIAS$/, "Brakes", "Brake bias (front)", "%"],
    [/^BRAKE_POWER_MULT$/, "Brakes", "Brake power", "%"],
    [/^BRAKE_DUCT|^BRAKE_COOLING/, "Brakes", "Brake ducts", "clicks"],
    [/^ABS$/, "Electronics", "ABS", "level"],
    [/^TRACTION_CONTROL$/, "Electronics", "Traction control", "level"],
    [/^TURBO_(\d+)$/, "Electronics", m => `Turbo ${Number(m[1]) + 1}`, "%"],
    [/^ENGINE_BRAKE/, "Electronics", "Engine brake", "level"],
    [/^ENGINE_MAP|^ENGINE_LIMITER/, "Electronics", "Engine map", "level"],
    [/^(ERS|KERS|MGUK|MGUH)_?(\w*)$/, "Hybrid", m => `${m[1]} ${nice(m[2] || "").toLowerCase()}`.trim(), ""],
    [/^FUEL$/, "Fuel & strategy", "Fuel", "L"],
    [/^BALLAST/, "Fuel & strategy", "Ballast", "kg"],
    [/^RESTRICTOR/, "Fuel & strategy", "Restrictor", "%"],
    [/^(RADIATOR|ENGINE_COOLING|COOLING)/, "Fuel & strategy", "Radiator / cooling", "clicks"],
  ];
  function acDescribe(key) {
    const wm = key.match(/_(LF|RF|LR|RR)$/), wheel = wm ? WHEEL[wm[1]] : "", base = wm ? key.slice(0, -3) + "_" : key;
    for (const [re, area, label, unit] of AC_RULES) {
      const m = (wm ? base : key).match(re) || key.match(re);
      if (m) return { area, label: typeof label === "function" ? label(m) : label, unit, wheel, group: area + "|" + (typeof label === "function" ? label(m) : label) };
    }
    return { area: "Other", label: nice(wm ? key.slice(0, -3) : key), unit: "", wheel, group: "Other|" + (wm ? key.slice(0, -3) : key) };
  }

  // ---- Assetto Corsa Competizione: keys of the flattened setup JSON ----
  const ACC_AREA = { tyres: "Tyres", alignment: "Alignment", electronics: "Electronics", strategy: "Fuel & strategy", mechanicalBalance: "Suspension", dampers: "Dampers", aeroBalance: "Aero", drivetrain: "Drivetrain" };
  const ACC_LABEL = {
    tyreCompound: ["Compound", ""], tyrePressure: ["Pressure", "clicks"], camber: ["Camber", "clicks"], toe: ["Toe", "clicks"], staticCamber: ["Static camber", ""], toeOutLinear: ["Toe (linear)", ""],
    casterLF: ["Caster left", "clicks"], casterRF: ["Caster right", "clicks"], steerRatio: ["Steering ratio", "clicks"],
    tC1: ["Traction control (TC1)", "level"], tC2: ["TC cut (TC2)", "level"], abs: ["ABS", "level"], eCUMap: ["ECU map", "map"], fuelMix: ["Fuel mix", ""], telemetryLaps: ["Telemetry laps", ""],
    fuel: ["Fuel", "L"], nPitStops: ["Pit stops", ""], tyreSet: ["Tyre set", ""], frontBrakePadCompound: ["Brake pads front", ""], rearBrakePadCompound: ["Brake pads rear", ""], fuelPerLap: ["Fuel per lap", "L"],
    aRBFront: ["Anti-roll bar front", "clicks"], aRBRear: ["Anti-roll bar rear", "clicks"], wheelRate: ["Wheel rate", "clicks"], bumpStopRateUp: ["Bump stop rate up", "clicks"], bumpStopRateDn: ["Bump stop rate down", "clicks"], bumpStopWindow: ["Bump stop range", "clicks"],
    brakeTorque: ["Brake power", "clicks"], brakeBias: ["Brake bias", "clicks"],
    bumpSlow: ["Slow bump", "clicks"], bumpFast: ["Fast bump", "clicks"], reboundSlow: ["Slow rebound", "clicks"], reboundFast: ["Fast rebound", "clicks"],
    rideHeight: ["Ride height", "clicks"], rodLength: ["Rod length", "clicks"], splitter: ["Splitter", "clicks"], rearWing: ["Rear wing", "clicks"], brakeDuct: ["Brake ducts", "clicks"],
    preload: ["Diff preload", "clicks"],
  };
  function accDescribe(key) {
    const parts = key.split("."), idx = /^\d+$/.test(parts[parts.length - 1]) ? Number(parts.pop()) : null;
    const name = parts[parts.length - 1], parent = parts[parts.length - 2] || "";
    let area = ACC_AREA[parent] || (parts.includes("pitStrategy") ? "Fuel & strategy" : "Other");
    if (name === "brakeTorque" || name === "brakeBias" || name === "brakeDuct" || /BrakePad/.test(name)) area = "Brakes";
    const [label, unit] = ACC_LABEL[name] || [nice(name.replace(/([a-z])([A-Z])/g, "$1 $2")), ""];
    // arrays: 4 = one per wheel, 2 = front and rear
    let wheel = "";
    if (idx !== null) wheel = name === "brakeDuct" ? ["Front", "Rear"][idx] || String(idx + 1) : WHEELS[idx] || String(idx + 1);
    const pit = parts.indexOf("pitStrategy");
    const lab = pit >= 0 && /^\d+$/.test(parts[pit + 1] || "") ? `Pit stop ${Number(parts[pit + 1]) + 1}: ${label.toLowerCase()}` : label;
    return { area, label: lab, unit, wheel, group: area + "|" + lab };
  }

  // ---- F1 25: the setup packet ----
  const F1 = [
    ["frontWing", "Aero", "Front wing", ""], ["rearWing", "Aero", "Rear wing", ""],
    ["onThrottle", "Drivetrain", "Differential on throttle", "%"], ["offThrottle", "Drivetrain", "Differential off throttle", "%"], ["engineBraking", "Drivetrain", "Engine braking", "%"],
    ["frontCamber", "Alignment", "Front camber", "°"], ["rearCamber", "Alignment", "Rear camber", "°"], ["frontToe", "Alignment", "Front toe", "°"], ["rearToe", "Alignment", "Rear toe", "°"],
    ["frontSuspension", "Suspension", "Front suspension", ""], ["rearSuspension", "Suspension", "Rear suspension", ""], ["frontAntiRollBar", "Suspension", "Front anti-roll bar", ""], ["rearAntiRollBar", "Suspension", "Rear anti-roll bar", ""],
    ["frontRideHeight", "Suspension", "Front ride height", ""], ["rearRideHeight", "Suspension", "Rear ride height", ""],
    ["brakePressure", "Brakes", "Brake pressure", "%"], ["brakeBias", "Brakes", "Front brake bias", "%"],
    ["pressureFL", "Tyres", "Pressure", "psi", "FL"], ["pressureFR", "Tyres", "Pressure", "psi", "FR"], ["pressureRL", "Tyres", "Pressure", "psi", "RL"], ["pressureRR", "Tyres", "Pressure", "psi", "RR"],
    ["ballast", "Fuel & strategy", "Ballast", ""], ["fuel", "Fuel & strategy", "Fuel", "kg"],
  ];
  const F1MAP = Object.fromEntries(F1.map(([k, area, label, unit, wheel]) => [k, { area, label, unit, wheel: wheel || "", group: area + "|" + label }]));

  // ---- other games: the usual setup menu, typed in by hand ----
  const GENERIC = [
    ["Tyres", "Compound", "compound", ""], ["Tyres", "Pressure", "pressure", "psi", 1],
    ["Alignment", "Camber", "camber", "°", 1], ["Alignment", "Toe", "toe", "°", 1], ["Alignment", "Caster", "caster", "°"], ["Alignment", "Steering lock", "steerLock", "°"],
    ["Aero", "Front wing / splitter", "frontWing", ""], ["Aero", "Rear wing", "rearWing", ""],
    ["Suspension", "Spring rate", "spring", "", 1], ["Suspension", "Ride height", "rideHeight", "mm", 1], ["Suspension", "Anti-roll bar front", "arbFront", ""], ["Suspension", "Anti-roll bar rear", "arbRear", ""], ["Suspension", "Bump stops / packers", "packers", "", 1], ["Suspension", "Heave spring front", "heaveFront", ""], ["Suspension", "Heave spring rear", "heaveRear", ""],
    ["Dampers", "Slow bump", "bumpSlow", "", 1], ["Dampers", "Fast bump", "bumpFast", "", 1], ["Dampers", "Slow rebound", "reboundSlow", "", 1], ["Dampers", "Fast rebound", "reboundFast", "", 1],
    ["Drivetrain", "Diff power", "diffPower", "%"], ["Drivetrain", "Diff coast", "diffCoast", "%"], ["Drivetrain", "Diff preload", "diffPreload", "Nm"], ["Drivetrain", "Final drive", "finalDrive", ""], ["Drivetrain", "Gearing", "gears", ""],
    ["Brakes", "Brake bias (front)", "brakeBias", "%"], ["Brakes", "Brake pressure", "brakePressure", "%"], ["Brakes", "Brake ducts", "brakeDucts", ""], ["Brakes", "Brake pads", "brakePads", ""],
    ["Electronics", "Traction control", "tc", ""], ["Electronics", "TC slip", "tcSlip", ""], ["Electronics", "TC cut", "tcCut", ""], ["Electronics", "ABS", "abs", ""], ["Electronics", "Engine map", "engineMap", ""], ["Electronics", "Engine braking", "engineBrake", ""],
    ["Hybrid", "Virtual energy", "virtualEnergy", "%"], ["Hybrid", "Regen level", "regen", ""], ["Hybrid", "Electric motor map", "motorMap", ""],
    ["Fuel & strategy", "Fuel", "fuel", "L"], ["Fuel & strategy", "Ballast", "ballast", "kg"], ["Fuel & strategy", "Radiator", "radiator", ""],
  ];
  const GENMAP = {};
  GENERIC.forEach(([area, label, k, unit, w]) => { if (w) WHEELS.forEach(x => (GENMAP[k + "_" + x] = { area, label, unit, wheel: x, group: area + "|" + label })); else GENMAP[k] = { area, label, unit, wheel: "", group: area + "|" + label }; });

  // the full list for a new setup typed in by hand
  const AC_TEMPLATE = [
    "TYRES", ...WHEELS.map(w => "PRESSURE_" + { FL: "LF", FR: "RF", RL: "LR", RR: "RR" }[w]),
    ...["CAMBER_", "TOE_OUT_"].flatMap(b => ["LF", "RF", "LR", "RR"].map(w => b + w)),
    "WING_1", "WING_2",
    ...["SPRING_RATE_", "ROD_LENGTH_", "PACKER_RANGE_", "BUMP_STOP_RATE_"].flatMap(b => ["LF", "RF", "LR", "RR"].map(w => b + w)), "ARB_FRONT", "ARB_REAR",
    ...["DAMP_BUMP_", "DAMP_FAST_BUMP_", "DAMP_REBOUND_", "DAMP_FAST_REBOUND_"].flatMap(b => ["LF", "RF", "LR", "RR"].map(w => b + w)),
    "DIFF_POWER", "DIFF_COAST", "DIFF_PRELOAD", "FINAL_RATIO", "INTERNAL_GEAR_2", "INTERNAL_GEAR_3", "INTERNAL_GEAR_4", "INTERNAL_GEAR_5", "INTERNAL_GEAR_6", "INTERNAL_GEAR_7",
    "FRONT_BIAS", "BRAKE_POWER_MULT", "BRAKE_DUCT", "ABS", "TRACTION_CONTROL", "TURBO_0", "ENGINE_BRAKE_SETTING", "FUEL", "BALLAST", "RESTRICTOR",
  ];
  const ACC_TEMPLATE = [
    "basicSetup.tyres.tyreCompound", ...[0, 1, 2, 3].map(i => "basicSetup.tyres.tyrePressure." + i),
    ...[0, 1, 2, 3].map(i => "basicSetup.alignment.camber." + i), ...[0, 1, 2, 3].map(i => "basicSetup.alignment.toe." + i), "basicSetup.alignment.casterLF", "basicSetup.alignment.casterRF", "basicSetup.alignment.steerRatio",
    "basicSetup.electronics.tC1", "basicSetup.electronics.tC2", "basicSetup.electronics.abs", "basicSetup.electronics.eCUMap",
    "basicSetup.strategy.fuel", "basicSetup.strategy.frontBrakePadCompound", "basicSetup.strategy.rearBrakePadCompound",
    "advancedSetup.mechanicalBalance.aRBFront", "advancedSetup.mechanicalBalance.aRBRear", ...[0, 1, 2, 3].map(i => "advancedSetup.mechanicalBalance.wheelRate." + i),
    ...[0, 1, 2, 3].map(i => "advancedSetup.mechanicalBalance.bumpStopRateUp." + i), ...[0, 1, 2, 3].map(i => "advancedSetup.mechanicalBalance.bumpStopWindow." + i),
    "advancedSetup.mechanicalBalance.brakeTorque", "advancedSetup.mechanicalBalance.brakeBias",
    ...["bumpSlow", "bumpFast", "reboundSlow", "reboundFast"].flatMap(k => [0, 1, 2, 3].map(i => `advancedSetup.dampers.${k}.${i}`)),
    ...[0, 1, 2, 3].map(i => "advancedSetup.aeroBalance.rideHeight." + i), "advancedSetup.aeroBalance.splitter", "advancedSetup.aeroBalance.rearWing", "advancedSetup.aeroBalance.brakeDuct.0", "advancedSetup.aeroBalance.brakeDuct.1",
    "advancedSetup.drivetrain.preload",
  ];
  const KIND = g => (g === "Assetto Corsa" ? "ac" : g === "Assetto Corsa Competizione" ? "acc" : g === "F1 25" ? "f1" : "generic");
  function describe(game, key) {
    const k = KIND(game);
    if (k === "ac" && !GENMAP[key]) return acDescribe(key);
    if (k === "acc" && key.includes(".")) return accDescribe(key);
    if (k === "f1" && F1MAP[key]) return F1MAP[key];
    if (GENMAP[key]) return GENMAP[key];
    if (key.startsWith("x:")) return { area: "Other", label: key.slice(2), unit: "", wheel: "", group: "Other|" + key.slice(2) };
    return { area: "Other", label: nice(key), unit: "", wheel: "", group: "Other|" + key };
  }
  function template(game) {
    const k = KIND(game);
    return k === "ac" ? AC_TEMPLATE : k === "acc" ? ACC_TEMPLATE : k === "f1" ? F1.map(x => x[0]) : Object.keys(GENMAP);
  }
  // keys -> [{ area, rows: [{ label, unit, cells: [{ wheel, key }] }] }] in menu order
  function layout(game, keys) {
    const areas = {}, order = [];
    for (const key of keys) {
      const d = describe(game, key);
      const a = areas[d.area] || (areas[d.area] = { area: d.area, rows: {}, order: [] });
      let r = a.rows[d.group];
      if (!r) { r = a.rows[d.group] = { label: d.label, unit: d.unit, cells: [] }; a.order.push(d.group); }
      r.cells.push({ wheel: d.wheel, key });
      if (!order.includes(d.area)) order.push(d.area);
    }
    const wi = w => { const i = WHEELS.indexOf(w); return i < 0 ? (w === "Front" ? 0 : w === "Rear" ? 1 : 9) : i; };
    return AREAS.filter(a => areas[a]).map(a => ({ area: a, rows: areas[a].order.map(g => { const r = areas[a].rows[g]; r.cells.sort((x, y) => wi(x.wheel) - wi(y.wheel)); return r; }) }));
  }
  window.SetupCatalog = { AREAS, WHEELS, describe, template, layout, kind: KIND };
})();
