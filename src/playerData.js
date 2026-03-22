// playerData.js — Viking FK Scouting Platform
// Architecture: 5 position groups, each with own metrics + benchmark

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
// Each player has a posGroup field set explicitly — no regex guessing
export const posGroupLabels = {
  CF:   "CF / Spiss",
  WING: "Wing / Kant",
  CM:   "CM / AMF",
  CB:   "CB",
  BACK: "Back / WB",
};

// ─── POSITION-SPECIFIC METRICS ───────────────────────────────────────────────
// These define what matters for each position group

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

// ─── PLAYERS ─────────────────────────────────────────────────────────────────
export const players = [

  // ── CF / Spiss ──────────────────────────────────────────────────────────────
  {
    id:"paananen", name:"K. Paananen", fullName:"Kasper Paananen",
    age:21, nationality:"Finland", flag:"🇫🇮",
    posGroup:"CF", position:"CF / AMF",
    club:"SJK", league:"Finland. Veikkausliiga",
    hasDetailedDashboard:true, dashboardComponent:"PaananenDashboard",
    stats:{ goals:0.55, assists:0.14, xG:0.44, shots:3.1, shotsOT:1.3,
      passAcc:78.4, longPassAcc:41.0, dribbleSucc:54.0, dribbles:2.1,
      duelWin:50.2, aerialWin:42.0, interceptions:1.4, recoveriesOpp:3.5,
      touchesPenArea:5.2, progRuns:3.1, shotAssists:0.9, minutes:2088, matches:24 },
  },
  {
    id:"diarra", name:"S. Diarra", fullName:"Sory Diarra",
    age:22, nationality:"France", flag:"🇫🇷",
    posGroup:"CF", position:"CF",
    club:"FK Haugesund", league:"Norway. Eliteserien",
    hasDetailedDashboard:true, dashboardComponent:"DiarraDashboard",
    stats:{ goals:0.45, assists:0.12, xG:0.38, shots:2.8, shotsOT:1.1,
      passAcc:74.5, longPassAcc:38.0, dribbleSucc:58.0, dribbles:2.3,
      duelWin:48.5, aerialWin:55.0, interceptions:1.2, recoveriesOpp:3.0,
      touchesPenArea:4.1, progRuns:2.7, shotAssists:0.7, minutes:1890, matches:21 },
  },
  {
    id:"kucys", name:"A. Kučys", fullName:"Arvydas Kučys",
    age:22, nationality:"Lithuania", flag:"🇱🇹",
    posGroup:"CF", position:"CF",
    club:"FK Žalgiris", league:"Lithuania. A Lyga",
    hasDetailedDashboard:false,
    stats:{ goals:0.72, assists:0.10, xG:0.57, shots:3.8, shotsOT:1.7,
      passAcc:73.0, longPassAcc:37.0, dribbleSucc:56.0, dribbles:2.0,
      duelWin:50.0, aerialWin:58.0, interceptions:1.0, recoveriesOpp:2.8,
      touchesPenArea:5.5, progRuns:2.5, shotAssists:0.6, minutes:3240, matches:36 },
  },
  {
    id:"gonstad", name:"J. Gonstad", fullName:"Jonas Gonstad",
    age:22, nationality:"Norway", flag:"🇳🇴",
    posGroup:"CF", position:"CF",
    club:"Sogndal", league:"Norway. 1. divisjon",
    hasDetailedDashboard:false,
    stats:{ goals:0.27, assists:0.09, xG:0.22, shots:2.0, shotsOT:0.8,
      passAcc:74.0, longPassAcc:38.0, dribbleSucc:50.0, dribbles:1.6,
      duelWin:49.0, aerialWin:52.0, interceptions:1.0, recoveriesOpp:2.5,
      touchesPenArea:3.2, progRuns:2.0, shotAssists:0.5, minutes:1350, matches:15 },
  },
  {
    id:"fenger", name:"M. Fenger", fullName:"Marcus Fenger",
    age:23, nationality:"Denmark", flag:"🇩🇰",
    posGroup:"CF", position:"CF",
    club:"Viborg FF", league:"Denmark. Superliga",
    hasDetailedDashboard:false,
    stats:{ goals:0.40, assists:0.10, xG:0.38, shots:3.0, shotsOT:1.2,
      passAcc:75.0, longPassAcc:39.0, dribbleSucc:52.0, dribbles:1.8,
      duelWin:51.0, aerialWin:57.0, interceptions:1.1, recoveriesOpp:2.9,
      touchesPenArea:4.5, progRuns:2.4, shotAssists:0.7, minutes:3600, matches:40 },
  },
  {
    id:"ladefoged", name:"M. Ladefoged", fullName:"Mathias Ladefoged",
    age:23, nationality:"Denmark", flag:"🇩🇰",
    posGroup:"CF", position:"CF",
    club:"FC Fredericia", league:"Denmark. 1st Division",
    hasDetailedDashboard:false,
    stats:{ goals:1.05, assists:0.15, xG:0.71, shots:4.2, shotsOT:1.8,
      passAcc:72.0, longPassAcc:35.0, dribbleSucc:54.0, dribbles:2.0,
      duelWin:50.0, aerialWin:60.0, interceptions:0.9, recoveriesOpp:2.5,
      touchesPenArea:6.0, progRuns:2.2, shotAssists:0.6, minutes:864, matches:10 },
  },

  // ── Wing / Kant ─────────────────────────────────────────────────────────────
  {
    id:"kilen", name:"S. Kilen", fullName:"Sander H. Kilen",
    age:21, nationality:"Norway", flag:"🇳🇴",
    posGroup:"WING", position:"LWF",
    club:"Kristiansund BK", league:"Norway. Eliteserien",
    hasDetailedDashboard:true, dashboardComponent:"KilenDashboard",
    stats:{ goals:0.38, assists:0.24, xG:0.29, shots:2.4, shotsOT:0.9,
      passAcc:78.2, longPassAcc:40.0, dribbleSucc:61.0, dribbles:3.8,
      duelWin:49.0, aerialWin:35.0, interceptions:1.6, recoveriesOpp:4.1,
      touchesPenArea:3.2, progRuns:5.2, shotAssists:1.2, minutes:1890, matches:21 },
  },
  {
    id:"bjerkebo", name:"I. Bjerkebø", fullName:"Isak Bjerkebø",
    age:22, nationality:"Norway", flag:"🇳🇴",
    posGroup:"WING", position:"LW",
    club:"IK Start", league:"Norway. Eliteserien",
    hasDetailedDashboard:false,
    stats:{ goals:0.37, assists:0.37, xG:0.28, shots:2.5, shotsOT:1.0,
      passAcc:78.0, longPassAcc:42.0, dribbleSucc:55.0, dribbles:3.1,
      duelWin:48.0, aerialWin:36.0, interceptions:2.1, recoveriesOpp:4.0,
      touchesPenArea:3.4, progRuns:4.2, shotAssists:1.5, minutes:2196, matches:24 },
  },
  {
    id:"ejdum", name:"M. Ejdum", fullName:"Marcus Ejdum",
    age:22, nationality:"Denmark", flag:"🇩🇰",
    posGroup:"WING", position:"RW",
    club:"Viborg FF", league:"Denmark. Superliga",
    hasDetailedDashboard:false,
    stats:{ goals:0.28, assists:0.21, xG:0.22, shots:2.3, shotsOT:0.9,
      passAcc:84.8, longPassAcc:48.0, dribbleSucc:60.0, dribbles:2.8,
      duelWin:50.0, aerialWin:35.0, interceptions:2.0, recoveriesOpp:3.5,
      touchesPenArea:2.8, progRuns:3.8, shotAssists:1.1, minutes:1890, matches:21 },
  },
  {
    id:"heintz", name:"T. Heintz", fullName:"Tobias Heintz",
    age:23, nationality:"Denmark", flag:"🇩🇰",
    posGroup:"WING", position:"LWF",
    club:"FC Midtjylland", league:"Denmark. Superliga",
    hasDetailedDashboard:false,
    stats:{ goals:0.44, assists:0.29, xG:0.33, shots:2.8, shotsOT:1.1,
      passAcc:77.0, longPassAcc:41.0, dribbleSucc:48.0, dribbles:3.4,
      duelWin:48.0, aerialWin:36.0, interceptions:1.7, recoveriesOpp:3.6,
      touchesPenArea:3.5, progRuns:4.5, shotAssists:1.3, minutes:2448, matches:27 },
  },
  {
    id:"balov", name:"K. Balov", fullName:"Kaloyan Balov",
    age:22, nationality:"Bulgaria", flag:"🇧🇬",
    posGroup:"WING", position:"LW",
    club:"Slavia Sofia", league:"Bulgaria. First League",
    hasDetailedDashboard:false,
    stats:{ goals:0.19, assists:0.19, xG:0.18, shots:1.47, shotsOT:0.57,
      passAcc:64.0, longPassAcc:36.5, dribbleSucc:56.8, dribbles:3.59,
      duelWin:38.3, aerialWin:9.5, interceptions:2.86, recoveriesOpp:2.00,
      touchesPenArea:2.40, progRuns:2.74, shotAssists:0.66, minutes:1889, matches:26 },
  },

  // ── CM / AMF ────────────────────────────────────────────────────────────────
  {
    id:"askildsen", name:"K. Askildsen", fullName:"Kristoffer Askildsen",
    age:24, nationality:"Norway", flag:"🇳🇴",
    posGroup:"CM", position:"CM / AMF",
    club:"Viking FK", league:"Norway. Eliteserien",
    isBenchmark:true, hasDetailedDashboard:false,
    stats:{ goals:0.13, assists:0.13, xG:0.10, shots:1.19, shotsOT:0.31,
      passAcc:80.0, longPassAcc:56.0, dribbleSucc:61.5, dribbles:0.57,
      duelWin:48.5, aerialWin:42.2, interceptions:3.18, recoveriesOpp:3.27,
      touchesPenArea:1.42, progRuns:1.02, shotAssists:0.66, minutes:2035, matches:33 },
  },
  {
    id:"mccowatt", name:"C. McCowatt", fullName:"Callum McCowatt",
    age:25, nationality:"New Zealand", flag:"🇳🇿",
    posGroup:"CM", position:"AMF",
    club:"HamKam", league:"Norway. Eliteserien",
    hasDetailedDashboard:false,
    stats:{ goals:0.32, assists:0.24, xG:0.24, shots:2.2, shotsOT:0.9,
      passAcc:79.0, longPassAcc:45.0, dribbleSucc:58.0, dribbles:1.9,
      duelWin:46.0, aerialWin:38.0, interceptions:2.2, recoveriesOpp:3.4,
      touchesPenArea:2.8, progRuns:2.3, shotAssists:1.1, minutes:2250, matches:25 },
  },
  {
    id:"tahaui", name:"A. Tahaui", fullName:"Anouar Tahaui",
    age:21, nationality:"Netherlands", flag:"🇳🇱",
    posGroup:"CM", position:"AMF",
    club:"Vitesse", league:"Netherlands. Eerste Divisie",
    hasDetailedDashboard:false,
    stats:{ goals:0.11, assists:0.32, xG:0.16, shots:1.79, shotsOT:0.61,
      passAcc:79.6, longPassAcc:49.4, dribbleSucc:72.8, dribbles:2.56,
      duelWin:49.4, aerialWin:36.9, interceptions:2.64, recoveriesOpp:2.47,
      touchesPenArea:1.76, progRuns:1.53, shotAssists:0.80, minutes:2518, matches:32 },
  },
  {
    id:"jorgensen", name:"T. Jørgensen", fullName:"Tobias Jørgensen",
    age:22, nationality:"Denmark", flag:"🇩🇰",
    posGroup:"CM", position:"CM / AMF",
    club:"Viborg FF", league:"Denmark. Superliga",
    hasDetailedDashboard:false,
    stats:{ goals:0.14, assists:0.21, xG:0.17, shots:2.04, shotsOT:0.77,
      passAcc:79.7, longPassAcc:59.7, dribbleSucc:55.6, dribbles:2.53,
      duelWin:49.8, aerialWin:47.7, interceptions:3.19, recoveriesOpp:3.72,
      touchesPenArea:1.79, progRuns:3.65, shotAssists:1.44, minutes:2564, matches:31 },
  },
  {
    id:"popoola", name:"R. Popoola", fullName:"Richard Popoola",
    age:22, nationality:"Nigeria", flag:"🇳🇬",
    posGroup:"CM", position:"CM / DMF",
    club:"Újpest FC", league:"Hungary. NB I",
    hasDetailedDashboard:false,
    stats:{ goals:0.05, assists:0.0, xG:0.02, shots:0.91, shotsOT:0.10,
      passAcc:86.9, longPassAcc:50.6, dribbleSucc:57.9, dribbles:0.96,
      duelWin:53.3, aerialWin:55.8, interceptions:5.19, recoveriesOpp:5.24,
      touchesPenArea:0.25, progRuns:1.01, shotAssists:0.55, minutes:1787, matches:22 },
  },

  // ── CB / Midtstopper ────────────────────────────────────────────────────────
  {
    id:"diop", name:"C. Diop", fullName:"Cheikh Mbacke Diop",
    age:23, nationality:"Senegal", flag:"🇸🇳",
    posGroup:"CB", position:"CB",
    club:"Sogndal", league:"Norway. 1. divisjon",
    hasDetailedDashboard:false,
    stats:{ goals:0.05, assists:0.02, xG:0.04, shots:0.4, shotsOT:0.1,
      passAcc:84.3, longPassAcc:50.0, dribbleSucc:70.0, dribbles:0.4,
      duelWin:60.2, aerialWin:62.0, interceptions:4.2, recoveriesOpp:2.0,
      touchesPenArea:0.5, progRuns:0.7, shotAssists:0.1, minutes:1800, matches:20 },
  },
  {
    id:"amundsen", name:"E. Amundsen-Day", fullName:"Emil Amundsen-Day",
    age:21, nationality:"Norway", flag:"🇳🇴",
    posGroup:"CB", position:"CB",
    club:"Sandnes Ulf", league:"Norway. 1. divisjon",
    hasDetailedDashboard:false,
    stats:{ goals:0.03, assists:0.03, xG:0.03, shots:0.35, shotsOT:0.08,
      passAcc:82.0, longPassAcc:47.0, dribbleSucc:66.0, dribbles:0.45,
      duelWin:59.0, aerialWin:60.0, interceptions:3.8, recoveriesOpp:1.9,
      touchesPenArea:0.4, progRuns:0.7, shotAssists:0.1, minutes:1620, matches:18 },
  },
  {
    id:"askou", name:"J. Askou", fullName:"Jacob Askou",
    age:24, nationality:"Denmark", flag:"🇩🇰",
    posGroup:"CB", position:"CB",
    club:"Viborg FF", league:"Denmark. Superliga",
    hasDetailedDashboard:false,
    stats:{ goals:0.04, assists:0.04, xG:0.05, shots:0.5, shotsOT:0.1,
      passAcc:89.6, longPassAcc:56.0, dribbleSucc:75.0, dribbles:0.4,
      duelWin:63.1, aerialWin:66.0, interceptions:5.2, recoveriesOpp:2.5,
      touchesPenArea:0.5, progRuns:0.9, shotAssists:0.1, minutes:2070, matches:23 },
  },
  {
    id:"markmann", name:"N. Markmann", fullName:"Nicolai Markmann",
    age:24, nationality:"Denmark", flag:"🇩🇰",
    posGroup:"CB", position:"CB",
    club:"Viborg FF", league:"Denmark. Superliga",
    hasDetailedDashboard:false,
    stats:{ goals:0.04, assists:0.04, xG:0.04, shots:0.45, shotsOT:0.1,
      passAcc:92.7, longPassAcc:62.0, dribbleSucc:78.0, dribbles:0.35,
      duelWin:61.8, aerialWin:65.0, interceptions:5.5, recoveriesOpp:2.8,
      touchesPenArea:0.45, progRuns:1.1, shotAssists:0.1, minutes:2430, matches:27 },
  },
  {
    id:"coulibaly", name:"S. Coulibaly", fullName:"Souleymane Coulibaly",
    age:23, nationality:"Ivory Coast", flag:"🇨🇮",
    posGroup:"CB", position:"CB",
    club:"Sogndal", league:"Norway. 1. divisjon",
    hasDetailedDashboard:false,
    stats:{ goals:0.04, assists:0.04, xG:0.04, shots:0.4, shotsOT:0.1,
      passAcc:83.0, longPassAcc:48.0, dribbleSucc:72.0, dribbles:0.4,
      duelWin:63.5, aerialWin:70.5, interceptions:4.5, recoveriesOpp:2.1,
      touchesPenArea:0.5, progRuns:0.8, shotAssists:0.1, minutes:1980, matches:22 },
  },
  {
    id:"graham", name:"L. Graham", fullName:"Luke Graham",
    age:22, nationality:"Scotland", flag:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    posGroup:"CB", position:"CB",
    club:"Dundee United", league:"Scotland. Premiership",
    hasDetailedDashboard:false,
    stats:{ goals:0.08, assists:0.03, xG:0.09, shots:0.49, shotsOT:0.08,
      passAcc:82.8, longPassAcc:39.6, dribbleSucc:80.6, dribbles:0.85,
      duelWin:62.8, aerialWin:66.7, interceptions:4.45, recoveriesOpp:1.72,
      touchesPenArea:0.77, progRuns:1.42, shotAssists:0.22, minutes:3293, matches:35 },
  },
  {
    id:"mohammed", name:"R. Mohammed", fullName:"Rahim Mohammed",
    age:22, nationality:"Sweden", flag:"🇸🇪",
    posGroup:"CB", position:"CB",
    club:"IK Sirius", league:"Sweden. Allsvenskan",
    hasDetailedDashboard:false,
    stats:{ goals:0.18, assists:0.0, xG:0.13, shots:0.65, shotsOT:0.30,
      passAcc:81.5, longPassAcc:44.7, dribbleSucc:75.0, dribbles:0.24,
      duelWin:60.6, aerialWin:69.9, interceptions:8.41, recoveriesOpp:1.89,
      touchesPenArea:0.77, progRuns:0.71, shotAssists:0.30, minutes:1520, matches:18 },
  },
  {
    id:"smajlovic", name:"Z. Smajlović", fullName:"Zlatan Smajlović",
    age:22, nationality:"Bosnia", flag:"🇧🇦",
    posGroup:"CB", position:"CB",
    club:"Sandefjord Fotball", league:"Norway. Eliteserien",
    hasDetailedDashboard:false,
    stats:{ goals:0.07, assists:0.0, xG:0.09, shots:0.86, shotsOT:0.24,
      passAcc:85.6, longPassAcc:50.6, dribbleSucc:75.8, dribbles:1.14,
      duelWin:59.5, aerialWin:56.2, interceptions:5.37, recoveriesOpp:2.27,
      touchesPenArea:0.83, progRuns:0.83, shotAssists:0.17, minutes:2615, matches:27 },
  },
  {
    id:"tape", name:"C. Tape", fullName:"Christian Tape",
    age:23, nationality:"Denmark", flag:"🇩🇰",
    posGroup:"CB", position:"CB",
    club:"AC Horsens", league:"Denmark. 1st Division",
    hasDetailedDashboard:false,
    stats:{ goals:0.06, assists:0.0, xG:0.04, shots:0.37, shotsOT:0.12,
      passAcc:84.7, longPassAcc:55.6, dribbleSucc:77.8, dribbles:0.55,
      duelWin:60.3, aerialWin:72.1, interceptions:4.64, recoveriesOpp:2.50,
      touchesPenArea:0.60, progRuns:0.67, shotAssists:0.18, minutes:1473, matches:17 },
  },

  // ── Back / WB ───────────────────────────────────────────────────────────────
  {
    id:"bagan", name:"J. Bagan", fullName:"Joel Bagan",
    age:23, nationality:"Wales", flag:"🏴󠁧󠁢󠁷󠁬󠁳󠁿",
    posGroup:"BACK", position:"LB",
    club:"Cardiff City", league:"England. League One",
    hasDetailedDashboard:false,
    stats:{ goals:0.02, assists:0.10, xG:0.05, shots:0.26, shotsOT:0.07,
      passAcc:81.1, longPassAcc:46.5, dribbleSucc:63.6, dribbles:0.61,
      duelWin:51.8, aerialWin:46.7, interceptions:3.44, recoveriesOpp:2.26,
      touchesPenArea:0.77, progRuns:0.96, shotAssists:0.61, minutes:3767, matches:42 },
  },
];

// ─── STAT CONFIG (all possible stats with labels/units) ───────────────────────
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
