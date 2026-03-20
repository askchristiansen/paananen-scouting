import { useState, useMemo } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { players, benchmarks, posMetrics, posGroupLabels, getOverallRating, compareVsBenchmark } from "./playerData";
import PlayerDashboard from "./PlayerDashboard";
import PaananenDashboard from "./PaananenDashboard";
import DiarraDashboard from "./DiarraDashboard";
import KilenDashboard from "./KilenDashboard";

const RC = { better:"#22c55e", similar:"#eab308", weaker:"#ef4444" };
const RL = { better:"↑ Bedre", similar:"~ På nivå", weaker:"↓ Svakere" };

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

// ALL view: no stat columns — only name/club/pos/min/rating
// (stats are meaningless across positions)

const scatterAxes = {
  ALL:  {xKey:"passAcc",  yKey:"duelWin",      xLabel:"Pass%",       yLabel:"Duell%"},
  CF:   {xKey:"goals",    yKey:"xG",           xLabel:"Goals/90",    yLabel:"xG/90"},
  WING: {xKey:"progRuns", yKey:"dribbleSucc",  xLabel:"ProgRuns/90", yLabel:"Dribble%"},
  CM:   {xKey:"passAcc",  yKey:"interceptions",xLabel:"Pass%",       yLabel:"Int/90"},
  CB:   {xKey:"passAcc",  yKey:"duelWin",      xLabel:"Pass%",       yLabel:"Duell%"},
  BACK: {xKey:"progRuns", yKey:"duelWin",      xLabel:"ProgRuns/90", yLabel:"Duell%"},
};

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

const groups = [
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
  const [sk,   setSk]   = useState("name");
  const [sd,   setSd]   = useState(1);
  const [bm,   setBm]   = useState(null);

  const axes        = scatterAxes[grp] ?? scatterAxes.ALL;
  const activeBench = grp !== "ALL" ? benchmarks[grp] : null;
  const cols        = grp !== "ALL" ? (tableCols[grp] ?? []) : [];
  // Which cols to colour — all posGroup-specific cols are coloured
  const coloredKeys = cols.map(c => c.k);

  const filtered = useMemo(() =>
    players.filter(p => {
      const mg = grp === "ALL" || p.posGroup === grp;
      const ms = !q ||
        p.fullName.toLowerCase().includes(q.toLowerCase()) ||
        (p.club ?? "").toLowerCase().includes(q.toLowerCase());
      return mg && ms;
    }), [grp, q]);

  const sorted = useMemo(() =>
    [...filtered].sort((a,b) => {
      const av = sk === "name" ? a.fullName : (a.stats[sk] ?? 0);
      const bv = sk === "name" ? b.fullName : (b.stats[sk] ?? 0);
      if (typeof av === "string") return sd * av.localeCompare(bv);
      return sd * (av - bv);
    }), [filtered, sk, sd]);

  function ts(k){ if(sk===k) setSd(d=>-d); else { setSk(k); setSd(-1); } }

  // Fixed header cols (always shown)
  const fixedCols = [
    {l:"Spiller",    k:"name"},
    {l:"Klubb",      k:null},
    {l:"Pos",        k:null},
    {l:"Min",        k:"minutes"},
    {l:"Markedsverdi", k:null},
    {l:"Kontrakt",   k:null},
  ];

  return (
    <div style={{minHeight:"100vh",background:"#0a0f1a",color:"#f9fafb",fontFamily:"system-ui,sans-serif"}}>

      {/* Header */}
      <div style={{borderBottom:"1px solid #1f2937",padding:"20px 32px",display:"flex",alignItems:"center",gap:16}}>
        <div>
          <h1 style={{margin:0,fontSize:22,fontWeight:900}}>⚡ Viking FK — Scouting Platform</h1>
          <p style={{margin:0,fontSize:13,color:"#6b7280"}}>{players.length} spillere · Posisjonsspesifikk benchmark</p>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:16}}>
          {Object.entries(RL).map(([r,l])=>(
            <span key={r} style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:RC[r]}}>
              <span style={{width:8,height:8,borderRadius:"50%",background:RC[r]}}/> {l}
            </span>
          ))}
        </div>
      </div>

      <div style={{padding:"24px 32px"}}>

        {/* Filters */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20,alignItems:"center"}}>
          {groups.map(g=>(
            <button key={g.id} onClick={()=>{setGrp(g.id);setSk("name");}} style={{
              background:grp===g.id?"#1d4ed8":"#1f2937",
              color:grp===g.id?"#fff":"#9ca3af",
              border:"none",borderRadius:8,padding:"6px 16px",
              fontSize:13,cursor:"pointer",fontWeight:grp===g.id?700:400,
              transition:"all .15s",
            }}>{g.label}</button>
          ))}
          <input placeholder="🔍 Søk spiller / klubb..." value={q}
            onChange={e=>setQ(e.target.value)}
            style={{marginLeft:"auto",background:"#1f2937",border:"1px solid #374151",
              borderRadius:8,padding:"6px 14px",color:"#f9fafb",fontSize:13,outline:"none",minWidth:200}}/>
        </div>

        {/* Context bar — shown when a specific group is active */}
        {grp !== "ALL" && (
          <div style={{
            background:"#111827",border:"1px solid #1f2937",borderRadius:10,
            padding:"10px 16px",marginBottom:16,
            display:"flex",alignItems:"center",gap:12,fontSize:13,
          }}>
            <span style={{color:"#6b7280"}}>Viser:</span>
            <span style={{color:"#f9fafb",fontWeight:700}}>{groups.find(g=>g.id===grp)?.label}</span>
            <span style={{color:"#374151"}}>·</span>
            <span style={{color:"#6b7280"}}>Benchmark:</span>
            <span style={{color:"#22c55e",fontWeight:700}}>{activeBench?.fullName}</span>
            <span style={{color:"#374151"}}>·</span>
            <span style={{color:"#6b7280"}}>{activeBench?.position} · {activeBench?.club}</span>
            <span style={{marginLeft:"auto",color:"#4b5563",fontSize:12}}>
              Metrics: {cols.map(c=>c.l).join(" · ")}
            </span>
          </div>
        )}

        {/* Scatter */}
        <div style={{background:"#111827",borderRadius:14,padding:"20px 20px 10px",marginBottom:24,border:"1px solid #1f2937"}}>
          <div style={{fontSize:13,color:"#6b7280",marginBottom:12,fontWeight:600}}>
            {axes.xLabel} vs {axes.yLabel}
            {activeBench && <span style={{color:"#4b5563",fontWeight:400}}> · Stiplede linjer = {activeBench.name} (benchmark)</span>}
            {grp === "ALL" && <span style={{color:"#4b5563",fontWeight:400}}> · Velg en posisjon for å se benchmark-linjer</span>}
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart margin={{top:10,right:20,bottom:20,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
              <XAxis type="number" dataKey={d=>d.stats[axes.xKey]??0}
                tick={{fill:"#6b7280",fontSize:11}}
                label={{value:axes.xLabel,position:"insideBottom",offset:-10,fill:"#4b5563",fontSize:11}}/>
              <YAxis type="number" dataKey={d=>d.stats[axes.yKey]??0}
                tick={{fill:"#6b7280",fontSize:11}}
                label={{value:axes.yLabel,angle:-90,position:"insideLeft",fill:"#4b5563",fontSize:11}}/>
              {activeBench && <>
                <ReferenceLine x={activeBench.stats[axes.xKey]} stroke="#374151" strokeDasharray="4 3" strokeWidth={1.5}/>
                <ReferenceLine y={activeBench.stats[axes.yKey]} stroke="#374151" strokeDasharray="4 3" strokeWidth={1.5}/>
              </>}
              <Tooltip content={<STip xKey={axes.xKey} yKey={axes.yKey} xLabel={axes.xLabel} yLabel={axes.yLabel}/>}/>
              <Scatter data={filtered} shape={<Dot/>} onClick={d=>setSel(d)} style={{cursor:"pointer"}}/>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Table */}
        <div style={{background:"#111827",borderRadius:14,border:"1px solid #1f2937",overflow:"hidden"}}>
          <div style={{
            padding:"12px 20px",borderBottom:"1px solid #1f2937",
            display:"flex",alignItems:"center",justifyContent:"space-between",
          }}>
            <span style={{fontSize:13,color:"#6b7280"}}>
              {sorted.length} spillere
              {grp !== "ALL" && <span style={{color:"#4b5563"}}> · {groups.find(g=>g.id===grp)?.label} · Benchmark: {activeBench?.name}</span>}
            </span>
            {grp === "ALL" && (
              <span style={{fontSize:12,color:"#4b5563",fontStyle:"italic"}}>
                Velg en posisjon for posisjonsspesifikke kolonner og farger
              </span>
            )}
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead>
                <tr style={{borderBottom:"1px solid #1f2937"}}>
                  {/* Fixed cols */}
                  {fixedCols.map(({l,k})=>(
                    <th key={l} onClick={()=>k&&ts(k)} style={{
                      padding:"10px 14px",textAlign:"left",color:"#6b7280",fontWeight:600,
                      cursor:k?"pointer":"default",userSelect:"none",whiteSpace:"nowrap",
                      background:sk===k?"#1a2332":"transparent",
                    }}>{l}{sk===k?(sd===1?" ↑":" ↓"):""}</th>
                  ))}
                  {/* Position-specific stat cols */}
                  {cols.map(({l,k})=>(
                    <th key={k} onClick={()=>ts(k)} style={{
                      padding:"10px 14px",textAlign:"left",color:"#22c55e",fontWeight:700,
                      cursor:"pointer",userSelect:"none",whiteSpace:"nowrap",
                      background:sk===k?"#1a2332":"transparent",
                      borderLeft: cols.indexOf({l,k})===0 ? "1px solid #1f2937" : "none",
                    }}>{l}{sk===k?(sd===1?" ↑":" ↓"):""}</th>
                  ))}
                  {/* Vs Viking always last */}
                  <th style={{padding:"10px 14px",textAlign:"left",color:"#6b7280",fontWeight:600,whiteSpace:"nowrap"}}>
                    Vs. Viking
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(player => {
                  const bench  = benchmarks[player.posGroup];
                  const rating = getOverallRating(player);
                  // Only colour stats if viewing that player's own position group
                  const showColoured = grp === player.posGroup || grp === "ALL";

                  return (
                    <tr key={player.id} onClick={()=>setSel(player)}
                      style={{borderBottom:"1px solid #1a2332",cursor:"pointer"}}
                      onMouseEnter={e=>e.currentTarget.style.background="#1a2332"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>

                      {/* Name */}
                      <td style={{padding:"11px 14px",whiteSpace:"nowrap"}}>
                        <span style={{marginRight:6}}>{player.flag??""}</span>
                        <span style={{fontWeight:700,color:"#f9fafb"}}>{player.fullName}</span>
                        {player.hasDetailedDashboard&&(
                          <span style={{marginLeft:6,fontSize:10,background:"#1d4ed8",color:"#bfdbfe",padding:"1px 6px",borderRadius:99}}>DASH</span>
                        )}
                        {player.isBenchmark&&(
                          <span style={{marginLeft:6,fontSize:10,background:"#7c3aed",color:"#ddd6fe",padding:"1px 6px",borderRadius:99}}>VFK</span>
                        )}
                      </td>
                      {/* Club */}
                      <td style={{padding:"11px 14px",color:"#9ca3af"}}>{player.club}</td>
                      {/* Pos badge */}
                      <td style={{padding:"11px 14px"}}>
                        <span style={{
                          background: {
                            CF:"#1a3a1a", WING:"#1a2a3a", CM:"#2a1a3a",
                            CB:"#3a2a1a", BACK:"#3a1a2a"
                          }[player.posGroup] ?? "#1f2937",
                          color: {
                            CF:"#4ade80", WING:"#60a5fa", CM:"#c084fc",
                            CB:"#fbbf24", BACK:"#f87171"
                          }[player.posGroup] ?? "#9ca3af",
                          fontSize:11, fontWeight:700,
                          padding:"2px 8px", borderRadius:4,
                        }}>
                          {posGroupLabels[player.posGroup]}
                        </span>
                      </td>
                      {/* Minutes */}
                      <td style={{padding:"11px 14px",color:"#6b7280"}}>
                        {player.stats.minutes?.toLocaleString()??"—"}
                      </td>
                      {/* Market value */}
                      <td style={{padding:"11px 14px",color:"#f9fafb",fontWeight:600,whiteSpace:"nowrap"}}>
                        {player.marketValue ?? "—"}
                      </td>
                      {/* Contract */}
                      <td style={{padding:"11px 14px",color:"#6b7280",whiteSpace:"nowrap"}}>
                        {player.contract ? `t.o.m. ${player.contract}` : "—"}
                      </td>

                      {/* Position-specific stat cols */}
                      {cols.map(({k,isPct}) => {
                        const pv = player.stats[k] ?? 0;
                        const bv = bench?.stats[k] ?? null;
                        // Only colour if this player is in the filtered position group
                        let color = "#6b7280";
                        if (bench && bv !== null && player.posGroup === grp) {
                          color = RC[compareVsBenchmark(pv, bv)];
                        }
                        return (
                          <td key={k} style={{
                            padding:"11px 14px",
                            color: player.posGroup === grp ? color : "#4b5563",
                            fontWeight: player.posGroup === grp ? 600 : 400,
                            borderLeft: cols.indexOf({k,isPct})===0?"1px solid #1a2332":"none",
                          }}>
                            {isPct ? pv.toFixed(1)+"%" : pv.toFixed(2)}
                          </td>
                        );
                      })}

                      {/* Vs Viking */}
                      <td style={{padding:"11px 14px"}}>
                        {rating ? (
                          <span style={{display:"inline-flex",alignItems:"center",gap:4,color:RC[rating],fontSize:12,fontWeight:700}}>
                            <span style={{width:7,height:7,borderRadius:"50%",background:RC[rating]}}/>
                            {RL[rating]}
                          </span>
                        ) : <span style={{color:"#374151"}}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Benchmark cards */}
        <div style={{marginTop:24}}>
          <div style={{fontSize:12,color:"#4b5563",marginBottom:10,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>
            Viking FK — Benchmarks (klikk for detaljer)
          </div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {Object.entries(benchmarks).map(([key,b])=>(
              <div key={key} onClick={()=>setBm(key)}
                style={{
                  background: grp===key?"#1a2d1a":"#111827",
                  border:`1px solid ${grp===key?"#22c55e":"#1f2937"}`,
                  borderRadius:10,padding:"12px 16px",minWidth:165,cursor:"pointer",
                  transition:"all .15s",
                }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="#374151"}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=grp===key?"#22c55e":"#1f2937"}}>
                <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:3,textTransform:"uppercase"}}>
                  {posGroupLabels[key]??key}
                </div>
                <div style={{fontWeight:800,color:"#f9fafb",marginBottom:1}}>{b.fullName}</div>
                <div style={{fontSize:12,color:"#6b7280"}}>{b.position} · {b.club}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Player dashboard */}
      {sel && (
        <div style={{position:"fixed",inset:0,background:"#f8f8f6",overflowY:"auto",zIndex:1000,padding:"48px 32px"}}>
          <button onClick={()=>setSel(null)} style={{
            position:"fixed",top:16,left:16,background:"#1f2937",border:"none",
            color:"#f9fafb",borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:13,zIndex:1001,
          }}>← Tilbake</button>
          <div style={{maxWidth:900,margin:"0 auto"}}>
            {(sel.id==="paananen"||sel.id==="diarra"||sel.id==="kilen") && (() => {
              // Import verdict logic inline for DASH players
              const bench = benchmarks[sel.posGroup]
              const metrics = posMetrics[sel.posGroup]
              if (!bench || !metrics) return null
              const thresholds = {
                CF:   { keys:['goals','xG','duelWin'],      mins:[0.40, 0.30, 48] },
                WING: { keys:['goals','dribbleSucc','progRuns'], mins:[0.30, 55, 3.5] },
              }[sel.posGroup] ?? { keys:[], mins:[] }
              const meetsMin = thresholds.keys.filter((k,i)=>(sel.stats[k]??0)>=thresholds.mins[i]).length
              const scale = {
                'Norway. Eliteserien':1.0,'Finland. Veikkausliiga':0.78,
                'Norway. 1. divisjon':0.82
              }[sel.league] ?? 0.80
              const riskCats = metrics.risiko.map(k=>{
                const pv=sel.stats[k]??0,bv=bench.stats[k]??0
                const diff=bv>0?((pv-bv)/bv)*100:0
                return Math.min(90,Math.round(Math.abs(diff)))
              })
              const avgRisk = riskCats.reduce((s,v)=>s+v,0)/riskCats.length
              let verdict,vbg,vc
              if(meetsMin>=thresholds.keys.length&&avgRisk<30&&scale>=0.85){verdict='🟢 STRONG BUY';vbg='#166534';vc='#dcfce7'}
              else if(meetsMin>=Math.ceil(thresholds.keys.length*0.67)&&avgRisk<50){verdict='🟡 BUY';vbg='#15803d';vc='#f0fdf4'}
              else if(meetsMin>=Math.ceil(thresholds.keys.length*0.50)&&avgRisk<65){verdict='🟠 MONITOR';vbg='#b45309';vc='#fffbeb'}
              else{verdict='🔴 PASS';vbg='#b91c1c';vc='#fef2f2'}
              return (
                <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:16,padding:'10px 16px',background:'#1f2937',borderRadius:8}}>
                  <span style={{fontSize:13,fontWeight:800,letterSpacing:'0.08em',padding:'4px 14px',borderRadius:4,background:vbg,color:vc}}>
                    {verdict}
                  </span>
                  <span style={{fontSize:12,color:'#9ca3af'}}>
                    {sel.fullName} · {sel.marketValue??''} · Kontrakt t.o.m. {sel.contract??'—'}
                  </span>
                </div>
              )
            })()}
            {sel.id==="paananen" ? <PaananenDashboard/> :
             sel.id==="diarra"   ? <DiarraDashboard/>   :
             sel.id==="kilen"    ? <KilenDashboard/>    :
             <PlayerDashboard player={sel}/>}
          </div>
        </div>
      )}

      {/* Benchmark modal */}
      {bm && (()=>{
        const b   = benchmarks[bm];
        const mets = tableCols[bm] ?? [];
        return (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",
            display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}}
            onClick={()=>setBm(null)}>
            <div style={{background:"#111827",border:"1px solid #1f2937",borderRadius:16,
              width:"100%",maxWidth:500,padding:28}} onClick={e=>e.stopPropagation()}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
                <div>
                  <div style={{fontSize:11,color:"#6b7280",fontWeight:700,marginBottom:4,
                    textTransform:"uppercase",letterSpacing:1}}>
                    {posGroupLabels[bm]} — Viking FK Benchmark
                  </div>
                  <h2 style={{margin:0,fontSize:20,fontWeight:900,color:"#f9fafb"}}>{b.fullName}</h2>
                  <div style={{color:"#6b7280",fontSize:13,marginTop:3}}>{b.position} · {b.club}</div>
                </div>
                <button onClick={()=>setBm(null)}
                  style={{background:"none",border:"none",color:"#6b7280",fontSize:22,cursor:"pointer"}}>✕</button>
              </div>
              <div style={{
                fontSize:12,color:"#4b5563",marginBottom:12,
                padding:"8px 12px",background:"#1a2332",borderRadius:8,
              }}>
                Metrics for {posGroupLabels[bm]}: {mets.map(c=>c.l).join(" · ")}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {mets.map(({l,k,isPct}) => (
                  <div key={k} style={{background:"#1f2937",borderRadius:8,padding:"10px 12px"}}>
                    <div style={{fontSize:11,color:"#6b7280",marginBottom:2}}>{l}</div>
                    <div style={{fontSize:18,fontWeight:700,color:"#f9fafb"}}>
                      {b.stats[k] != null
                        ? isPct ? b.stats[k].toFixed(1)+"%" : b.stats[k].toFixed(2)
                        : "—"}
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
