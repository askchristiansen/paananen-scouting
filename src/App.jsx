import { useState, useMemo } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { players, benchmarks, posMetrics, posGroupLabels, getOverallRating, compareVsBenchmark } from "./playerData";
import PlayerDashboard from "./PlayerDashboard";
import PaananenDashboard from "./PaananenDashboard";
import DiarraDashboard from "./DiarraDashboard";
import KilenDashboard from "./KilenDashboard";

const RC = { better:"#22c55e", similar:"#eab308", weaker:"#ef4444" };
const RL = { better:"↑ Bedre", similar:"~ På nivå", weaker:"↓ Svakere" };
const VERDICT_ORDER = { "STRONG BUY":0, "BUY":1, "MONITOR":2, "PASS":3 };
const VERDICT_STYLE = {
  "STRONG BUY": { bg:"#166534", text:"#dcfce7", dot:"#22c55e" },
  "BUY":        { bg:"#15803d", text:"#f0fdf4", dot:"#4ade80" },
  "MONITOR":    { bg:"#92400e", text:"#fffbeb", dot:"#fbbf24" },
  "PASS":       { bg:"#7f1d1d", text:"#fef2f2", dot:"#f87171" },
};

// ── Position-specific table columns ──────────────────────────────────────────
const tableCols = {
  CF:   [
    {l:"G/90",       k:"goals",          isPct:false},
    {l:"xG/90",      k:"xG",             isPct:false},
    {l:"SoT/90",     k:"shotsOT",        isPct:false},
    {l:"Touch felt", k:"touchesPenArea", isPct:false},
    {l:"Duell%",     k:"duelWin",        isPct:true },
    {l:"Luft%",      k:"aerialWin",      isPct:true },
  ],
  WING: [
    {l:"G/90",       k:"goals",          isPct:false},
    {l:"A/90",       k:"assists",        isPct:false},
    {l:"Dribble%",   k:"dribbleSucc",    isPct:true },
    {l:"ProgRuns",   k:"progRuns",       isPct:false},
    {l:"ShotAss/90", k:"shotAssists",    isPct:false},
    {l:"Touch felt", k:"touchesPenArea", isPct:false},
  ],
  CM:   [
    {l:"Pass%",      k:"passAcc",        isPct:true },
    {l:"Int/90",     k:"interceptions",  isPct:false},
    {l:"Duell%",     k:"duelWin",        isPct:true },
    {l:"ProgRuns",   k:"progRuns",       isPct:false},
    {l:"ShotAss/90", k:"shotAssists",    isPct:false},
    {l:"Rec.opp/90", k:"recoveriesOpp",  isPct:false},
  ],
  CB:   [
    {l:"Duell%",     k:"duelWin",        isPct:true },
    {l:"Luft%",      k:"aerialWin",      isPct:true },
    {l:"Int/90",     k:"interceptions",  isPct:false},
    {l:"Pass%",      k:"passAcc",        isPct:true },
    {l:"LongPass%",  k:"longPassAcc",    isPct:true },
    {l:"ProgRuns",   k:"progRuns",       isPct:false},
  ],
  BACK: [
    {l:"Duell%",     k:"duelWin",        isPct:true },
    {l:"Pass%",      k:"passAcc",        isPct:true },
    {l:"ProgRuns",   k:"progRuns",       isPct:false},
    {l:"ShotAss/90", k:"shotAssists",    isPct:false},
    {l:"Int/90",     k:"interceptions",  isPct:false},
    {l:"Luft%",      k:"aerialWin",      isPct:true },
  ],
};

const scatterAxes = {
  CF:   {xKey:"goals",    yKey:"xG",           xLabel:"Goals/90",    yLabel:"xG/90"},
  WING: {xKey:"progRuns", yKey:"dribbleSucc",  xLabel:"ProgRuns/90", yLabel:"Dribble%"},
  CM:   {xKey:"passAcc",  yKey:"interceptions",xLabel:"Pass%",       yLabel:"Int/90"},
  CB:   {xKey:"passAcc",  yKey:"duelWin",      xLabel:"Pass%",       yLabel:"Duell%"},
  BACK: {xKey:"progRuns", yKey:"duelWin",      xLabel:"ProgRuns/90", yLabel:"Duell%"},
};

// Compute verdict for any player
function computeVerdict(player) {
  const posGrp = player.posGroup;
  const bench = benchmarks[posGrp];
  const metrics = posMetrics?.[posGrp];
  if (!bench || !metrics) return "MONITOR";

  const leagueScale = {
    'Norway. Eliteserien':1.00,'Norway. 1. divisjon':0.82,
    'Sweden. Allsvenskan':0.95,'Sweden. Superettan':0.80,
    'Denmark. Superliga':0.90,'Denmark. 1st Division':0.80,
    'England. League One':0.85,'Scotland. Premiership':0.88,
    'Finland. Veikkausliiga':0.78,'Netherlands. Eerste Divisie':0.82,
    'Bulgaria. First League':0.72,'Hungary. NB I':0.70,
    'Lithuania. A Lyga':0.68,'Slovenia. Prva Liga':0.75,
    'Croatia. SuperSport HNL':0.77,
  }[player.league] ?? 0.75;

  // Age bonus: tekniske posisjoner får full bonus, fysiske (CB/BACK) får halv
  // ≤21: CF/WING/CM → 15%, CB/BACK → 8% | 22: alle → 8% | eldre: ingen
  const age = player.age ?? 25;
  const isPhysical = posGrp === 'CB' || posGrp === 'BACK';
  const ageFactor = age <= 21 ? (isPhysical ? 0.92 : 0.85) : age <= 22 ? 0.92 : 1.0;

  // Raw stats — ingen ligaskalering på terskler
  // Unntak: CF duelWin skaleres med ligakoeff (duell% er kulturavhengig)
  const raw = k => player.stats[k] ?? 0;
  const rawScaled = k => (k === 'duelWin' && posGrp === 'CF')
    ? (player.stats[k] ?? 0) / leagueScale
    : (player.stats[k] ?? 0);

  const thresholds = {
    CF:   { keys:['goals','xG','duelWin'],            mins:[0.40,0.30,48] },
    WING: { keys:['goals','dribbleSucc','progRuns'],   mins:[0.30,55,3.5] },
    CM:   { keys:['passAcc','interceptions','duelWin'],mins:[78,3.0,46] },
    CB:   { keys:['duelWin','aerialWin','interceptions'],mins:[60,58,4.0] },
    BACK: { keys:['duelWin','passAcc','progRuns'],     mins:[50,76,1.0] },
  }[posGrp] ?? { keys:[], mins:[] };

  // Aldersbonus + CF duelWin-skalering
  // WING: creative profile — goals OR shotAssists>=1.0 teller som angrepsoutput
  const meetsMin = thresholds.keys.filter((k,i) => {
    const thresh = thresholds.mins[i] * ageFactor;
    if (posGrp === 'WING' && k === 'goals') {
      return raw('goals') >= thresh || raw('shotAssists') >= 1.0 * ageFactor;
    }
    return rawScaled(k) >= thresh;
  }).length;
  const total = thresholds.keys.length;

  // Risikovurdering: sammenlign mot benchmark, juster for ligakvalitet
  const riskScores = metrics.risiko.map(k => {
    const pv = raw(k) / leagueScale, bv = bench.stats[k] ?? 0;
    const diff = bv > 0 ? ((pv - bv) / bv) * 100 : 0;
    return Math.min(90, Math.round(Math.abs(diff)));
  });
  const avgRisk = riskScores.length ? riskScores.reduce((s,v)=>s+v,0)/riskScores.length : 50;

  // Aldersbonus gir romsligere risikotak
  const riskCeiling = age <= 21 ? [38, 58, 72] : [30, 50, 65];

  if (meetsMin===total && avgRisk<riskCeiling[0] && leagueScale>=0.85) return "STRONG BUY";
  if (meetsMin>=Math.ceil(total*0.67) && avgRisk<riskCeiling[1]) return "BUY";
  if (meetsMin>=Math.ceil(total*0.50) && avgRisk<riskCeiling[2]) return "MONITOR";
  return "PASS";
}

function Dot({cx,cy,payload}){
  if(!cx||!cy)return null;
  const r=getOverallRating(payload);
  return <circle cx={cx} cy={cy} r={7} fill={r?RC[r]:"#6b7280"} fillOpacity={0.88} stroke="#0a0f1a" strokeWidth={2}/>;
}

function STip({active,payload,xKey,yKey,xLabel,yLabel}){
  if(!active||!payload?.length)return null;
  const d=payload[0].payload; const r=getOverallRating(d);
  return(
    <div style={{background:"#111827",border:"1px solid #374151",borderRadius:10,padding:"10px 14px",fontSize:12,minWidth:180}}>
      <div style={{fontWeight:800,color:"#f9fafb",marginBottom:3}}>{d.fullName}</div>
      <div style={{color:"#9ca3af",marginBottom:6}}>{d.club} · {posGroupLabels[d.posGroup]}</div>
      <div style={{color:"#e5e7eb"}}>{xLabel}: <b>{(d.stats[xKey]??0).toFixed(2)}</b></div>
      <div style={{color:"#e5e7eb"}}>{yLabel}: <b>{(d.stats[yKey]??0).toFixed(2)}</b></div>
      {r&&<div style={{marginTop:6,color:RC[r],fontWeight:700}}>{RL[r]}</div>}
    </div>
  );
}

const posGroups = [
  {id:"ALL",  label:"Alle"},
  {id:"CF",   label:"CF / Spiss"},
  {id:"WING", label:"Wing / Kant"},
  {id:"CM",   label:"CM / AMF"},
  {id:"CB",   label:"CB"},
  {id:"BACK", label:"Back / WB"},
];

export default function App(){
  const [sel,  setSel]  = useState(null);
  const [grp,  setGrp]  = useState("ALL");
  const [q,    setQ]    = useState("");
  const [view, setView] = useState("cards"); // "cards" | "table"
  const [bm,   setBm]   = useState(null);

  const axes        = scatterAxes[grp];
  const activeBench = grp !== "ALL" ? benchmarks[grp] : null;
  const cols        = grp !== "ALL" ? (tableCols[grp] ?? []) : [];

  const filtered = useMemo(() =>
    players.filter(p => {
      const mg = grp === "ALL" || p.posGroup === grp;
      const ms = !q ||
        p.fullName.toLowerCase().includes(q.toLowerCase()) ||
        (p.club ?? "").toLowerCase().includes(q.toLowerCase());
      return mg && ms;
    }), [grp, q]);

  // Sort by verdict for card view
  const sortedCards = useMemo(() =>
    [...filtered].sort((a,b) => {
      const va = VERDICT_ORDER[computeVerdict(a)] ?? 3;
      const vb = VERDICT_ORDER[computeVerdict(b)] ?? 3;
      return va - vb;
    }), [filtered]);

  const sortedTable = useMemo(() =>
    [...filtered].sort((a,b) => {
      const va = VERDICT_ORDER[computeVerdict(a)] ?? 3;
      const vb = VERDICT_ORDER[computeVerdict(b)] ?? 3;
      return va - vb;
    }), [filtered]);

  const POS_COLORS = {CF:"#4ade80",WING:"#60a5fa",CM:"#c084fc",CB:"#fbbf24",BACK:"#f87171"};
  const POS_BG     = {CF:"#1a3a1a",WING:"#1a2a3a",CM:"#2a1a3a",CB:"#3a2a1a",BACK:"#3a1a2a"};

  return (
    <div style={{minHeight:"100vh",background:"#0a0f1a",color:"#f9fafb",fontFamily:"system-ui,sans-serif"}}>

      {/* ── HEADER ── */}
      <div style={{borderBottom:"1px solid #1f2937",padding:"16px 20px"}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <div>
            <h1 style={{margin:0,fontSize:20,fontWeight:900,letterSpacing:"-0.02em"}}>
              Ask Christiansen
            </h1>
            <p style={{margin:0,fontSize:12,color:"#6b7280",marginTop:1}}>
              Scouting Portefølje · {players.length} spillere · Posisjonsspesifikk benchmark vs Viking FK
            </p>
          </div>
          <div style={{marginLeft:"auto",display:"flex",gap:12,flexWrap:"wrap"}}>
            {Object.entries({...VERDICT_STYLE}).map(([v,s])=>(
              <span key={v} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:s.dot}}>
                <span style={{width:7,height:7,borderRadius:"50%",background:s.dot}}/> {v}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:1100,margin:"0 auto",padding:"16px 16px"}}>

        {/* ── FILTERS + SEARCH + VIEW TOGGLE ── */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16,alignItems:"center"}}>
          {posGroups.map(g=>(
            <button key={g.id} onClick={()=>setGrp(g.id)} style={{
              background:grp===g.id?"#1d4ed8":"#1f2937",
              color:grp===g.id?"#fff":"#9ca3af",
              border:"none",borderRadius:8,padding:"8px 14px",
              fontSize:13,cursor:"pointer",fontWeight:grp===g.id?700:400,
              minHeight:40,
            }}>{g.label}</button>
          ))}
          <input placeholder="🔍 Søk..." value={q} onChange={e=>setQ(e.target.value)}
            style={{background:"#1f2937",border:"1px solid #374151",borderRadius:8,
              padding:"8px 14px",color:"#f9fafb",fontSize:13,outline:"none",
              minWidth:140,flex:1,maxWidth:220,minHeight:40}}/>
          <div style={{display:"flex",gap:4,marginLeft:"auto"}}>
            {["cards","table"].map(v=>(
              <button key={v} onClick={()=>setView(v)} style={{
                background:view===v?"#374151":"transparent",
                border:"1px solid #374151",borderRadius:6,
                padding:"6px 12px",color:view===v?"#f9fafb":"#6b7280",
                fontSize:12,cursor:"pointer",
              }}>{v==="cards"?"⊞ Kort":"≡ Tabell"}</button>
            ))}
          </div>
        </div>

        {/* ── CONTEXT BAR (position selected) ── */}
        {grp !== "ALL" && (
          <div style={{
            background:"#111827",border:"1px solid #1f2937",borderRadius:8,
            padding:"8px 14px",marginBottom:14,
            display:"flex",alignItems:"center",gap:10,fontSize:12,flexWrap:"wrap",
          }}>
            <span style={{color:"#6b7280"}}>Benchmark:</span>
            <span style={{color:"#22c55e",fontWeight:700}}>{activeBench?.fullName}</span>
            <span style={{color:"#4b5563"}}>·</span>
            <span style={{color:"#4b5563"}}>{cols.map(c=>c.l).join(" · ")}</span>
          </div>
        )}

        {/* ── SCATTER (only when position selected) ── */}
        {grp !== "ALL" && axes && (
          <div style={{background:"#111827",borderRadius:12,padding:"16px 16px 8px",marginBottom:16,border:"1px solid #1f2937"}}>
            <div style={{fontSize:12,color:"#6b7280",marginBottom:10,fontWeight:600}}>
              {axes.xLabel} vs {axes.yLabel}
              {activeBench && <span style={{color:"#4b5563",fontWeight:400}}> · Stiplede linjer = {activeBench.name}</span>}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <ScatterChart margin={{top:8,right:16,bottom:16,left:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
                <XAxis type="number" dataKey={d=>d.stats[axes.xKey]??0}
                  tick={{fill:"#6b7280",fontSize:10}}
                  label={{value:axes.xLabel,position:"insideBottom",offset:-10,fill:"#4b5563",fontSize:10}}/>
                <YAxis type="number" dataKey={d=>d.stats[axes.yKey]??0}
                  tick={{fill:"#6b7280",fontSize:10}}
                  label={{value:axes.yLabel,angle:-90,position:"insideLeft",fill:"#4b5563",fontSize:10}}/>
                <ReferenceLine x={activeBench?.stats[axes.xKey]} stroke="#374151" strokeDasharray="4 3" strokeWidth={1.5}/>
                <ReferenceLine y={activeBench?.stats[axes.yKey]} stroke="#374151" strokeDasharray="4 3" strokeWidth={1.5}/>
                <Tooltip content={<STip xKey={axes.xKey} yKey={axes.yKey} xLabel={axes.xLabel} yLabel={axes.yLabel}/>}/>
                <Scatter data={filtered} shape={<Dot/>} onClick={d=>setSel(d)} style={{cursor:"pointer"}}/>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── CARD VIEW ── */}
        {view === "cards" && (
          <div style={{
            display:"grid",
            gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))",
            gap:10,
          }}>
            {sortedCards.map(player => {
              const verdict = computeVerdict(player);
              const vs = VERDICT_STYLE[verdict];
              const bench = benchmarks[player.posGroup];
              const rating = getOverallRating(player);
              const topStats = (tableCols[player.posGroup] ?? []).slice(0,3);
              return (
                <div key={player.id} onClick={()=>setSel(player)}
                  style={{
                    background:"#111827",border:"1px solid #1f2937",
                    borderRadius:12,padding:"14px 16px",cursor:"pointer",
                    transition:"all .15s",borderTop:`3px solid ${vs.dot}`,
                  }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=vs.dot}
                  onMouseLeave={e=>{e.currentTarget.style.borderTopColor=vs.dot;e.currentTarget.style.borderRightColor="#1f2937";e.currentTarget.style.borderBottomColor="#1f2937";e.currentTarget.style.borderLeftColor="#1f2937"}}>
                  {/* Card header */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                    <div>
                      <div style={{fontWeight:800,color:"#f9fafb",fontSize:15,marginBottom:2}}>
                        {player.flag??""} {player.fullName}
                        <span style={{marginLeft:6,fontSize:9,background:"#1d4ed8",color:"#bfdbfe",padding:"1px 5px",borderRadius:99}}>DASH</span>
                      </div>
                      <div style={{fontSize:12,color:"#6b7280"}}>{player.club} · {player.league.split('. ')[1] ?? player.league}</div>
                    </div>
                    <span style={{
                      fontSize:10,fontWeight:800,letterSpacing:"0.06em",
                      padding:"3px 8px",borderRadius:4,
                      background:vs.bg,color:vs.text,whiteSpace:"nowrap",flexShrink:0,
                    }}>{verdict}</span>
                  </div>

                  {/* Pos + age + value row */}
                  <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
                    <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:3,
                      background:POS_BG[player.posGroup]??"#1f2937",
                      color:POS_COLORS[player.posGroup]??"#9ca3af"}}>
                      {posGroupLabels[player.posGroup]}
                    </span>
                    <span style={{fontSize:11,color:"#6b7280"}}>{player.age} år</span>
                    {player.marketValue&&<span style={{fontSize:11,color:"#f9fafb",fontWeight:600}}>{player.marketValue}</span>}
                    {player.contract&&<span style={{fontSize:11,color:"#4b5563"}}>t.o.m. {player.contract}</span>}
                  </div>

                  {/* Top 3 stats for position */}
                  {topStats.length > 0 && bench && (
                    <div style={{display:"flex",gap:6}}>
                      {topStats.map(({l,k,isPct})=>{
                        const pv = player.stats[k]??0;
                        const bv = bench.stats[k]??0;
                        const r  = compareVsBenchmark(pv, bv);
                        return (
                          <div key={k} style={{flex:1,background:"#1a2332",borderRadius:6,padding:"6px 8px",textAlign:"center"}}>
                            <div style={{fontSize:9,color:"#4b5563",marginBottom:2}}>{l}</div>
                            <div style={{fontSize:13,fontWeight:700,color:RC[r]??"#f9fafb"}}>
                              {isPct ? pv.toFixed(1)+"%" : pv.toFixed(2)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── TABLE VIEW ── */}
        {view === "table" && (
          <div style={{background:"#111827",borderRadius:12,border:"1px solid #1f2937",overflow:"hidden"}}>
            <div style={{padding:"10px 16px",borderBottom:"1px solid #1f2937",fontSize:12,color:"#6b7280"}}>
              {sortedTable.length} spillere · sortert etter vurdering
              {grp==="ALL"&&<span style={{marginLeft:8,color:"#4b5563",fontStyle:"italic"}}>Velg posisjon for posisjonsspesifikke kolonner</span>}
            </div>
            <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:600}}>
                <thead>
                  <tr style={{borderBottom:"1px solid #1f2937"}}>
                    <th style={{padding:"9px 14px",textAlign:"left",color:"#6b7280",fontWeight:600,whiteSpace:"nowrap"}}>Spiller</th>
                    <th style={{padding:"9px 14px",textAlign:"left",color:"#6b7280",fontWeight:600,whiteSpace:"nowrap"}}>Klubb</th>
                    <th style={{padding:"9px 14px",textAlign:"left",color:"#6b7280",fontWeight:600}}>Pos</th>
                    <th style={{padding:"9px 14px",textAlign:"left",color:"#6b7280",fontWeight:600}}>Verdi</th>
                    <th style={{padding:"9px 14px",textAlign:"left",color:"#6b7280",fontWeight:600}}>Kontrakt</th>
                    {cols.map(({l})=>(
                      <th key={l} style={{padding:"9px 14px",textAlign:"left",color:"#22c55e",fontWeight:700,whiteSpace:"nowrap"}}>{l}</th>
                    ))}
                    <th style={{padding:"9px 14px",textAlign:"left",color:"#6b7280",fontWeight:600,whiteSpace:"nowrap"}}>Vurdering</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTable.map(player => {
                    const bench  = benchmarks[player.posGroup];
                    const verdict = computeVerdict(player);
                    const vs = VERDICT_STYLE[verdict];
                    return (
                      <tr key={player.id} onClick={()=>setSel(player)}
                        style={{borderBottom:"1px solid #1a2332",cursor:"pointer"}}
                        onMouseEnter={e=>e.currentTarget.style.background="#1a2332"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <td style={{padding:"10px 14px",whiteSpace:"nowrap"}}>
                          <span style={{marginRight:5}}>{player.flag??""}</span>
                          <span style={{fontWeight:700,color:"#f9fafb"}}>{player.fullName}</span>
                          <span style={{marginLeft:5,fontSize:9,background:"#1d4ed8",color:"#bfdbfe",padding:"1px 5px",borderRadius:99}}>DASH</span>
                        </td>
                        <td style={{padding:"10px 14px",color:"#9ca3af",whiteSpace:"nowrap"}}>{player.club}</td>
                        <td style={{padding:"10px 14px"}}>
                          <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:3,
                            background:POS_BG[player.posGroup]??"#1f2937",
                            color:POS_COLORS[player.posGroup]??"#9ca3af"}}>
                            {posGroupLabels[player.posGroup]}
                          </span>
                        </td>
                        <td style={{padding:"10px 14px",color:"#f9fafb",fontWeight:600,whiteSpace:"nowrap"}}>{player.marketValue??"—"}</td>
                        <td style={{padding:"10px 14px",color:"#6b7280",whiteSpace:"nowrap"}}>{player.contract?`t.o.m. ${player.contract}`:"—"}</td>
                        {cols.map(({k,isPct}) => {
                          const pv = player.stats[k]??0;
                          const bv = bench?.stats[k]??null;
                          let color = "#6b7280";
                          if(bench && bv!==null && player.posGroup===grp) color=RC[compareVsBenchmark(pv,bv)];
                          return <td key={k} style={{padding:"10px 14px",color,fontWeight:player.posGroup===grp?600:400}}>
                            {isPct?pv.toFixed(1)+"%":pv.toFixed(2)}
                          </td>;
                        })}
                        <td style={{padding:"10px 14px"}}>
                          <span style={{fontSize:11,fontWeight:800,padding:"3px 8px",borderRadius:4,
                            background:vs.bg,color:vs.text,whiteSpace:"nowrap"}}>
                            {verdict}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── BENCHMARK CARDS ── */}
        <div style={{marginTop:20}}>
          <div style={{fontSize:11,color:"#4b5563",marginBottom:8,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>
            Viking FK — Benchmarks
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {Object.entries(benchmarks).map(([key,b])=>(
              <div key={key} onClick={()=>setBm(key)}
                style={{
                  background:grp===key?"#1a2d1a":"#111827",
                  border:`1px solid ${grp===key?"#22c55e":"#1f2937"}`,
                  borderRadius:8,padding:"10px 14px",cursor:"pointer",minWidth:140,
                }}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#374151"}
                onMouseLeave={e=>e.currentTarget.style.borderColor=grp===key?"#22c55e":"#1f2937"}>
                <div style={{fontSize:9,color:"#6b7280",fontWeight:700,marginBottom:2,textTransform:"uppercase"}}>{posGroupLabels[key]??key}</div>
                <div style={{fontWeight:800,color:"#f9fafb",fontSize:13,marginBottom:1}}>{b.fullName}</div>
                <div style={{fontSize:11,color:"#6b7280"}}>{b.position} · {b.club}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── PLAYER DASHBOARD MODAL ── */}
      {sel && (
        <div style={{position:"fixed",inset:0,background:"#f8f8f6",overflowY:"auto",zIndex:1000,
          padding:"56px 16px 48px"}}>
          <button onClick={()=>setSel(null)} style={{
            position:"fixed",top:12,left:12,background:"#1f2937",border:"none",
            color:"#f9fafb",borderRadius:8,padding:"10px 16px",cursor:"pointer",fontSize:13,zIndex:1001,
          }}>← Tilbake</button>
          <div style={{maxWidth:860,margin:"0 auto"}}>
            {/* Verdict banner for DASH players */}
            {(sel.id==="paananen"||sel.id==="diarra"||sel.id==="kilen") && (() => {
              const verdict = computeVerdict(sel);
              const vs = VERDICT_STYLE[verdict];
              return (
                <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:16,
                  padding:"10px 16px",background:"#111827",borderRadius:8,flexWrap:"wrap"}}>
                  <span style={{fontSize:13,fontWeight:800,letterSpacing:"0.08em",
                    padding:"4px 14px",borderRadius:4,background:vs.bg,color:vs.text}}>
                    {verdict}
                  </span>
                  <span style={{fontSize:12,color:"#9ca3af"}}>
                    {sel.fullName} · {sel.marketValue??""} · Kontrakt t.o.m. {sel.contract??"—"}
                  </span>
                </div>
              );
            })()}
            {sel.id==="paananen" ? <PaananenDashboard/> :
             sel.id==="diarra"   ? <DiarraDashboard/>   :
             sel.id==="kilen"    ? <KilenDashboard/>    :
             <PlayerDashboard player={sel}/>}
          </div>
        </div>
      )}

      {/* ── BENCHMARK MODAL ── */}
      {bm && (()=>{
        const b=benchmarks[bm], mets=tableCols[bm]??[];
        return(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",
            display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}}
            onClick={()=>setBm(null)}>
            <div style={{background:"#111827",border:"1px solid #1f2937",borderRadius:14,
              width:"100%",maxWidth:460,padding:24}} onClick={e=>e.stopPropagation()}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
                <div>
                  <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:3,textTransform:"uppercase",letterSpacing:1}}>
                    {posGroupLabels[bm]} — Benchmark
                  </div>
                  <h2 style={{margin:0,fontSize:18,fontWeight:900,color:"#f9fafb"}}>{b.fullName}</h2>
                  <div style={{color:"#6b7280",fontSize:12,marginTop:2}}>{b.position} · {b.club}</div>
                </div>
                <button onClick={()=>setBm(null)} style={{background:"none",border:"none",color:"#6b7280",fontSize:20,cursor:"pointer"}}>✕</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                {mets.map(({l,k,isPct})=>(
                  <div key={k} style={{background:"#1f2937",borderRadius:6,padding:"8px 10px"}}>
                    <div style={{fontSize:10,color:"#6b7280",marginBottom:1}}>{l}</div>
                    <div style={{fontSize:15,fontWeight:700,color:"#f9fafb"}}>
                      {b.stats[k]!=null?(isPct?b.stats[k].toFixed(1)+"%":b.stats[k].toFixed(2)):"—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
