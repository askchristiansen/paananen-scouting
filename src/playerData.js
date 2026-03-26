// playerData.js — Viking FK Scouting Platform
// Architecture: 5 position groups, each with own metrics + benchmark
// V2: Laster data dynamisk fra /data/players.json (bygget av build.py)

// ─── BENCHMARKS ──────────────────────────────────────────────────────────────
export const benchmarks = {
  CF: {
    name: "P. Christiansen", fullName: "Peter Christiansen",
    club: "Viking FK", position: "CF",
    stats: {
      goals: 0.54, assists: 0.11, xG: 0.45, shots: 3.2, shotsOT: 1.4,
      passAcc: 76.2, longPassAcc: 42.0, dribbleSucc: 52.0, dribbles: 1.8,
      duelWin: 52.3, aerialWin: 55.0, interceptions: 1.2, recoveriesOpp: 3.1,
      touchesPenArea: 4.8, progRuns: 2.9, shotAssists: 0.8,
    },
  },
  WING: {
    name: "E. Austbø", fullName: "Edvin Austbø",
    club: "Viking FK", position: "LW",
    stats: {
      goals: 0.48, assists: 0.36, xG: 0.36, shots: 2.8, shotsOT: 1.1,
      passAcc: 79.5, longPassAcc: 44.0, dribbleSucc: 58.0, dribbles: 3.2,
      duelWin: 50.0, aerialWin: 38.0, interceptions: 1.8, recoveriesOpp: 3.8,
      touchesPenArea: 3.6, progRuns: 4.1, shotAssists: 1.4,
    },
  },
  CM: {
    name: "K. Askildsen", fullName: "Kristoffer Askildsen",
    club: "Viking FK", position: "CM / AMF",
    stats: {
      goals: 0.13, assists: 0.13, xG: 0.10, shots: 1.19, shotsOT: 0.31,
      passAcc: 80.0, longPassAcc: 56.0, dribbleSucc: 61.5, dribbles: 0.57,
      duelWin: 48.5, aerialWin: 42.2, interceptions: 3.18, recoveriesOpp: 3.27,
      touchesPenArea: 1.42, progRuns: 1.02, shotAssists: 0.66,
    },
  },
  CB: {
    name: "H. Falchener", fullName: "Henrik Falchener",
    club: "Viking FK", position: "CB",
    stats: {
      goals: 0.18, assists: 0.04, xG: 0.14, shots: 0.7, shotsOT: 0.2,
      passAcc: 85.5, longPassAcc: 52.0, dribbleSucc: 68.0, dribbles: 0.5,
      duelWin: 63.3, aerialWin: 63.6, interceptions: 4.8, recoveriesOpp: 2.2,
      touchesPenArea: 0.6, progRuns: 0.9, shotAssists: 0.15,
    },
  },
  BACK: {
    name: "K. Haugen", fullName: "Kristoffer Haugen",
    club: "Viking FK", position: "LB",
    stats: {
      goals: 0.03, assists: 0.16, xG: 0.08, shots: 0.45, shotsOT: 0.12,
      passAcc: 78.0, longPassAcc: 49.0, dribbleSucc: 62.5, dribbles: 1.29,
      duelWin: 54.0, aerialWin: 46.2, interceptions: 4.77, recoveriesOpp: 2.42,
      touchesPenArea: 2.03, progRuns: 1.48, shotAssists: 1.06,
    },
  },
};

// ─── POSITION → BENCHMARK KEY ────────────────────────────────────────────────
export function getBenchmarkKey(posGroup) {
  return posGroup ?? null;
}

// ─── POSITION GROUP (canonical) ──────────────────────────────────────────────
export const posGroupLabels = {
  CF:   "CF / Spiss",
  WING: "Wing / Kant",
  CM:   "CM / AMF",
  CB:   "CB",
  BACK: "Back / WB",
};

// ─── POSITION-SPECIFIC METRICS ───────────────────────────────────────────────
export const posMetrics = {
  CF: {
    table:   ["goals", "xG", "shotsOT", "touchesPenArea", "duelWin", "aerialWin"],
    radar:   ["goals", "xG", "shots", "touchesPenArea", "duelWin", "aerialWin"],
    risiko:  ["goals", "xG", "duelWin", "aerialWin"],
    labels:  { goals:"G/90", xG:"xG/90", shotsOT:"SoT/90", touchesPenArea:"Touch felt/90", duelWin:"Duell%", aerialWin:"Luft%", shots:"Skudd/90" },
  },
  WING: {
    table:   ["goals", "assists", "dribbleSucc", "progRuns", "shotAssists", "touchesPenArea"],
    radar:   ["goals", "assists", "dribbleSucc", "progRuns", "shotAssists", "touchesPenArea"],
    risiko:  ["goals", "assists", "dribbleSucc", "progRuns"],
    labels:  { goals:"G/90", assists:"A/90", dribbleSucc:"Dribble%", progRuns:"ProgRuns/90", shotAssists:"ShotAss/90", touchesPenArea:"Touch felt/90" },
  },
  CM: {
    table:   ["passAcc", "interceptions", "duelWin", "progRuns", "shotAssists", "recoveriesOpp"],
    radar:   ["passAcc", "interceptions", "duelWin", "progRuns", "shotAssists", "recoveriesOpp"],
    risiko:  ["passAcc", "interceptions", "duelWin", "progRuns"],
    labels:  { passAcc:"Pass%", interceptions:"Int/90", duelWin:"Duell%", progRuns:"ProgRuns/90", shotAssists:"ShotAss/90", recoveriesOpp:"Rec.opp/90" },
  },
  CB: {
    table:   ["duelWin", "aerialWin", "interceptions", "passAcc", "longPassAcc", "progRuns"],
    radar:   ["duelWin", "aerialWin", "interceptions", "passAcc", "longPassAcc", "progRuns"],
    risiko:  ["duelWin", "aerialWin", "interceptions", "passAcc"],
    labels:  { duelWin:"Duell%", aerialWin:"Luft%", interceptions:"Int/90", passAcc:"Pass%", longPassAcc:"LongPass%", progRuns:"ProgRuns/90" },
  },
  BACK: {
    table:   ["duelWin", "passAcc", "progRuns", "shotAssists", "interceptions", "aerialWin"],
    radar:   ["duelWin", "passAcc", "progRuns", "shotAssists", "interceptions", "aerialWin"],
    risiko:  ["duelWin", "passAcc", "progRuns", "interceptions"],
    labels:  { duelWin:"Duell%", passAcc:"Pass%", progRuns:"ProgRuns/90", shotAssists:"Crosses/ShotAss/90", interceptions:"Int/90", aerialWin:"Luft%" },
  },
};

// ─── COMPARE VS BENCHMARK ────────────────────────────────────────────────────
export function compareVsBenchmark(playerVal, benchVal) {
  const threshold = 0.15;
  if (benchVal === 0) return playerVal > 0 ? "better" : "similar";
  const ratio = (playerVal - benchVal) / benchVal;
  if (ratio > threshold) return "better";
  if (ratio < -threshold) return "weaker";
  return "similar";
}

export function getOverallRating(player) {
  const key = player.posGroup;
  if (!key || !benchmarks[key]) return null;
  const bench = benchmarks[key];
  const keys = posMetrics[key]?.risiko ?? [];
  let better = 0, weaker = 0;
  keys.forEach(s => {
    const r = compareVsBenchmark(player.stats[s] ?? 0, bench.stats[s] ?? 0);
    if (r === "better") better++;
    if (r === "weaker") weaker++;
  });
  if (better >= 3) return "better";
  if (weaker >= 3) return "weaker";
  return "similar";
}

// ─── MAPPING: players.json → app format ──────────────────────────────────────
function mapPlayer(p) {
  const agg = p.aggregates?.all ?? {};
  const mv = p.market?.market_value_eur;
  const mvDisplay = p.market?.market_value_display ??
    (mv >= 1_000_000 ? `€${(mv/1e6).toFixed(1)}M` : mv ? `€${Math.round(mv/1000)}k` : null);

  return {
    id:                   p.id,
    name:                 p.identity?.short_name ?? p.identity?.full_name ?? p.id,
    fullName:             p.identity?.full_name ?? p.id,
    age:                  p.identity?.age,
    nationality:          p.identity?.nationality,
    flag:                 p.identity?.flag,
    posGroup:             p.scouting?.pos_group,
    position:             p.scouting?.position_detail,
    club:                 p.current_club?.name,
    league:               p.current_club?.league,
    marketValue:          mvDisplay,
    contract:             p.market?.contract_year,
    hasDetailedDashboard: p.scouting?.has_detailed_dashboard ?? false,
    dashboardComponent:   p.scouting?.has_detailed_dashboard
                            ? p.id.charAt(0).toUpperCase() + p.id.slice(1) + "Dashboard"
                            : null,
    bio:                  p.scouting?.bio,
    verdict:              p.verdict?.recommendation,
    confidence:           p.confidence?.score ?? null,
    confidenceTier:       p.confidence?.tier ?? null,
    risk:                 p.risk?.overall_score ?? null,
    riskTier:             p.risk?.overall_tier ?? null,
    riskFactors:          p.risk?.components ?? null,
    _source:              "pipeline",
    stats: {
      goals:          agg.goals_p90          ?? 0,
      assists:        agg.assists_p90        ?? 0,
      xG:             agg.xg_p90             ?? 0,
      shots:          agg.shots_p90          ?? 0,
      shotsOT:        agg.shots_on_target_p90 ?? 0,
      passAcc:        agg.pass_accuracy_pct  ?? 0,
      longPassAcc:    agg.long_pass_accuracy_pct ?? 0,
      dribbleSucc:    agg.dribble_success_pct ?? 0,
      dribbles:       agg.dribbles_p90       ?? 0,
      duelWin:        agg.duel_win_pct       ?? 0,
      aerialWin:      agg.aerial_win_pct     ?? 0,
      interceptions:  agg.interceptions_p90  ?? 0,
      recoveriesOpp:  agg.recoveries_opp_half_p90 ?? 0,
      touchesPenArea: agg.touches_pen_area_p90 ?? 0,
      progRuns:       agg.progressive_runs_p90 ?? 0,
      shotAssists:    agg.shot_assists_p90   ?? 0,
      minutes:        agg.minutes            ?? 0,
      matches:        agg.matches            ?? 0,
    },
  };
}

// ─── HARDKODEDE FALLBACK-SPILLERE (paananen + diarra — mangler Wyscout-filer) ─
const fallbackPlayers = [
  {
    id:"paananen", name:"K. Paananen", fullName:"Kasper Paananen",
    age:23, nationality:"Finland", flag:"🇫🇮",
    posGroup:"CF", position:"CF",
    club:"SJK Seinäjoki", league:"Finland. Veikkausliiga",
    marketValue:"€600k", contract:"2027", hasDetailedDashboard:true, dashboardComponent:"PaananenDashboard",
    bio:"Eksplosiv finsk angripende midtbanespiller med naturlig posisjonsforståelse i halvrom. Scoret 18 mål i Veikkausliiga 2025 med 0.55/90 — imponerende for en 22-åring. G–xG +5.19 er en betydelig risikovariabel, men skyldes delvis høy skuddholdbarhet og god bevegelse uten ball. Sterk på kort avstand, svak i luftdueller. Bologna-akademi-bakgrunn gir teknisk ballbehandling. Passer Vikings halvromsstil.",
    verdict: null,
    confidence: null,
    confidenceTier: null,
    risk: null,
    riskTier: null,
    riskFactors: null,
    _source: "fallback",
    stats:{ goals:0.55, assists:0.14, xG:0.44, shots:3.1, shotsOT:1.3,
      passAcc:78.4, longPassAcc:41.0, dribbleSucc:54.0, dribbles:2.1,
      duelWin:50.2, aerialWin:42.0, interceptions:1.4, recoveriesOpp:3.5,
      touchesPenArea:5.2, progRuns:3.1, shotAssists:0.9, minutes:2088, matches:24 },
  },
  {
    id:"diarra", name:"S. Diarra", fullName:"Sory Diarra",
    age:26, nationality:"Mali", flag:"🇲🇱",
    posGroup:"CF", position:"CF",
    club:"FK Haugesund", league:"Norway. 1. divisjon",
    marketValue:"€450k", contract:"2026", hasDetailedDashboard:true, dashboardComponent:"DiarraDashboard",
    bio:"Malisk spiss med fysisk dominans og sterk heading-profil. 25 år med bred europeisk erfaring via România og Norge. Scorer konsekvent på xG-nivå over tre sesonger — solid konverteringsrate uten vesentlig overperformance. Sterk i bakrom og holdUp-spill. Svak i dribbling og direkte 1v1. Haugesund er nedrykkstruet — lav lagkvalitet påvirker kontekst. Passer Vikings direkte spill mot høy forsvarslinje.",
    verdict: null,
    confidence: null,
    confidenceTier: null,
    risk: null,
    riskTier: null,
    riskFactors: null,
    _source: "fallback",
    stats:{ goals:0.45, assists:0.12, xG:0.38, shots:2.8, shotsOT:1.1,
      passAcc:74.5, longPassAcc:38.0, dribbleSucc:58.0, dribbles:2.3,
      duelWin:48.5, aerialWin:55.0, interceptions:1.2, recoveriesOpp:3.0,
      touchesPenArea:4.1, progRuns:2.7, shotAssists:0.7, minutes:1890, matches:21 },
  },
];

// ─── LAST INN SPILLERE FRA players.json ──────────────────────────────────────
let _players = null;

async function loadPlayers() {
  try {
    const res = await fetch("/data/players.json");
    if (!res.ok) throw new Error("Kunne ikke laste players.json");
    const json = await res.json();
    const mapped = json.players.map(mapPlayer);

    // Legg til fallback-spillere som mangler i JSON
    const ids = new Set(mapped.map(p => p.id));
    for (const fb of fallbackPlayers) {
      if (!ids.has(fb.id)) mapped.push(fb);
    }

    // Sorter etter verdict
    const order = { "STRONG BUY":0, "BUY":1, "MONITOR":2, "PASS":3 };
    mapped.sort((a, b) => (order[a.verdict] ?? 4) - (order[b.verdict] ?? 4));

    _players = mapped;
    return mapped;
  } catch (e) {
    console.warn("Fallback til hardkodede spillere:", e);
    return fallbackPlayers;
  }
}

// Synkron eksport for bakoverkompatibilitet — erstattes av usePlayersData hook
// Første render vil bruke tom array, deretter fyller React med data
export let players = [];

// ─── REACT HOOK: usePlayersData ───────────────────────────────────────────────
// Bruk denne i App.jsx i stedet for å importere players direkte:
//   const { players, loading } = usePlayersData();
import { useState as _useState, useEffect as _useEffect } from "react";

export function usePlayersData() {
  const [data, setData] = _useState(_players ?? []);
  const [loading, setLoading] = _useState(!_players);

  _useEffect(() => {
    if (_players) { setData(_players); return; }
    loadPlayers().then(p => {
      players = p; // oppdater synkron eksport også
      setData(p);
      setLoading(false);
    });
  }, []);

  return { players: data, loading, source: _players ? "cache" : "fetch" };
}

// ─── STAT CONFIG ─────────────────────────────────────────────────────────────
export const statConfig = [
  { key:"goals",          label:"Goals",            unit:"/90" },
  { key:"assists",        label:"Assists",           unit:"/90" },
  { key:"xG",             label:"xG",                unit:"/90" },
  { key:"shots",          label:"Shots",             unit:"/90" },
  { key:"shotsOT",        label:"Shots on target",   unit:"/90" },
  { key:"passAcc",        label:"Pass accuracy",     unit:"%"   },
  { key:"longPassAcc",    label:"Long pass acc.",    unit:"%"   },
  { key:"dribbleSucc",    label:"Dribble success",   unit:"%"   },
  { key:"duelWin",        label:"Duel win %",        unit:"%"   },
  { key:"aerialWin",      label:"Aerial win %",      unit:"%"   },
  { key:"interceptions",  label:"Interceptions",     unit:"/90" },
  { key:"recoveriesOpp",  label:"Recoveries (opp.)", unit:"/90" },
  { key:"progRuns",       label:"Prog. runs",        unit:"/90" },
  { key:"touchesPenArea", label:"Touches pen. area", unit:"/90" },
  { key:"shotAssists",    label:"Shot assists",      unit:"/90" },
];
