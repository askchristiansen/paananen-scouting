import { useState } from 'react'
import {
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { benchmarks, posMetrics, posGroupLabels, compareVsBenchmark, statConfig } from './playerData'

const CBLUE  = '#185FA5'
const CGREEN = '#3B6D11'
const CRED   = '#C0392B'
const CAMBER = '#B07517'
const CGRAY  = '#888'

const leagueXG = {
  'Norway. Eliteserien': 1.35, 'Sweden. Allsvenskan': 1.32,
  'Denmark. Superliga': 1.28, 'England. League One': 1.20,
  'Finland. Veikkausliiga': 1.18, 'Netherlands. Eerste Divisie': 1.22,
  'Scotland. Premiership': 1.25, 'Bulgaria. First League': 1.10,
  'Hungary. NB I': 1.08, 'Lithuania. A Lyga': 1.05,
  'Denmark. 1st Division': 1.12, 'Norway. 1. divisjon': 1.10,
}

const leagueScale = {
  'Norway. Eliteserien': 1.0, 'Sweden. Allsvenskan': 0.95,
  'Denmark. Superliga': 0.90, 'England. League One': 0.85,
  'Scotland. Premiership': 0.88, 'Netherlands. Eerste Divisie': 0.82,
  'Finland. Veikkausliiga': 0.78, 'Bulgaria. First League': 0.72,
  'Hungary. NB I': 0.70, 'Lithuania. A Lyga': 0.68,
  'Denmark. 1st Division': 0.80, 'Norway. 1. divisjon': 0.82,
}

function KPI({ label, value, sub, color }) {
  return (
    <div style={{ background: '#f0f0ee', borderRadius: 8, padding: '12px 16px' }}>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600, color: color || '#1a1a1a', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>{sub}</div>}
    </div>
  )
}
function Leg({ items }) {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8, fontSize: 12, color: '#666' }}>
      {items.map(({ color, label }) => (
        <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 7, borderRadius: 2, background: color, display: 'inline-block' }} />
          {label}
        </span>
      ))}
    </div>
  )
}
function STitle({ children }) {
  return <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', margin: '0 0 6px' }}>{children}</div>
}
function Div() {
  return <div style={{ borderTop: '0.5px solid #e0e0e0', margin: '20px 0' }} />
}
function Box({ color, text }) {
  return (
    <div style={{ borderLeft: `3px solid ${color}`, borderRadius: '0 8px 8px 0', background: '#f5f5f3', padding: '10px 14px', fontSize: 12, color: '#1a1a1a', lineHeight: 1.6, marginBottom: 8 }}>
      {text}
    </div>
  )
}

// ── OVERSIKT ─────────────────────────────────────────────────────────────────
function Oversikt({ player, bench, metrics }) {
  const s = player.stats
  const cfgMap = Object.fromEntries(statConfig.map(x => [x.key, x]))
  const keys = metrics.radar

  const barData = keys.map(k => ({
    cat: metrics.labels?.[k] ?? cfgMap[k]?.label ?? k,
    spiller: +(s[k] ?? 0).toFixed(2),
    benchmark: +(bench.stats[k] ?? 0).toFixed(2),
  }))

  const lv = leagueXG[player.league] ?? 1.15
  const ligaCtx = [
    { lag: player.club,   val: lv,   fill: CBLUE },
    { lag: 'Viking FK',   val: 1.92, fill: CGRAY },
    { lag: 'Eliteserien', val: 1.35, fill: CGRAY },
    { lag: 'Allsvenskan', val: 1.32, fill: CGRAY },
  ]

  // Top 4 KPI boxes — position-specific
  const kpiKeys = metrics.radar.slice(0, 4)
  const isPct = k => ['passAcc','duelWin','aerialWin','longPassAcc','dribbleSucc'].includes(k)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        <KPI label="Minutter"  value={s.minutes?.toLocaleString() ?? '—'} sub={`${s.matches ?? '—'} kamper`} />
        {kpiKeys.slice(0,3).map(k => {
          const pv = s[k] ?? 0
          const bv = bench.stats[k] ?? 0
          const r  = compareVsBenchmark(pv, bv)
          return (
            <KPI key={k}
              label={metrics.labels?.[k] ?? k}
              value={isPct(k) ? pv.toFixed(1)+'%' : pv.toFixed(2)}
              sub={`Benchmark: ${isPct(k) ? bv.toFixed(1)+'%' : bv.toFixed(2)}`}
              color={r==='better'?CGREEN:r==='weaker'?CRED:CAMBER} />
          )
        })}
      </div>

      <STitle>Nøkkeltall — {posGroupLabels[player.posGroup]} — spiller vs benchmark</STitle>
      <Leg items={[{ color: CBLUE, label: player.name }, { color: CGRAY, label: bench.name }]} />
      <ResponsiveContainer width="100%" height={210}>
        <BarChart data={barData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
          <XAxis dataKey="cat" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="spiller"   name={player.name} fill={CBLUE} radius={[3,3,0,0]} />
          <Bar dataKey="benchmark" name={bench.name}  fill={CGRAY} radius={[3,3,0,0]} />
        </BarChart>
      </ResponsiveContainer>

      <Div />
      <STitle>Ligakontekst — lagets xG per kamp</STitle>
      <Leg items={[{ color: CBLUE, label: player.club }, { color: CGRAY, label: 'Sammenligning' }]} />
      <ResponsiveContainer width="100%" height={155}>
        <BarChart data={ligaCtx} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
          <XAxis dataKey="lag" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 11 }} domain={[0, 2.5]} />
          <Tooltip formatter={v => [v.toFixed(2), 'xG/kamp']} />
          <Bar dataKey="val" radius={[3,3,0,0]}>
            {ligaCtx.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── EFFEKTIVITET ──────────────────────────────────────────────────────────────
function Effektivitet({ player, bench, metrics }) {
  const s = player.stats
  const cfgMap = Object.fromEntries(statConfig.map(x => [x.key, x]))
  const keys = metrics.radar
  const isPct = k => ['passAcc','duelWin','aerialWin','longPassAcc','dribbleSucc'].includes(k)

  const radarData = keys.map(k => {
    const pv = s[k] ?? 0
    const bv = bench.stats[k] ?? 0
    const mx = Math.max(pv, bv, 0.01)
    return {
      stat: metrics.labels?.[k] ?? cfgMap[k]?.label ?? k,
      spiller: Math.round((pv / mx) * 100),
      benchmark: Math.round((bv / mx) * 100),
    }
  })

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
        {keys.slice(0,3).map(k => {
          const pv = s[k] ?? 0
          const bv = bench.stats[k] ?? 0
          const r  = compareVsBenchmark(pv, bv)
          return (
            <KPI key={k}
              label={metrics.labels?.[k] ?? k}
              value={isPct(k) ? pv.toFixed(1)+'%' : pv.toFixed(2)}
              sub={`Benchmark: ${isPct(k) ? bv.toFixed(1)+'%' : bv.toFixed(2)}`}
              color={r==='better'?CGREEN:r==='weaker'?CRED:CAMBER} />
          )
        })}
      </div>

      <STitle>Effektivitetsprofil — posisjonsspesifikk</STitle>
      <div style={{ marginBottom: 20 }}>
        {keys.map(k => {
          const pv = s[k] ?? 0
          const bv = bench.stats[k] ?? 0
          const r  = compareVsBenchmark(pv, bv)
          const color = r==='better'?CGREEN:r==='weaker'?CRED:CAMBER
          const max = isPct(k) ? 100 : Math.max(pv, bv, 0.01) * 1.4
          return (
            <div key={k} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', marginBottom: 3 }}>
                <span>{metrics.labels?.[k] ?? k}</span>
                <span style={{ fontWeight: 600, color }}>
                  {isPct(k)?pv.toFixed(1)+'%':pv.toFixed(2)}
                  <span style={{ color: '#aaa', fontWeight: 400 }}> / {isPct(k)?bv.toFixed(1)+'%':bv.toFixed(2)}</span>
                </span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <div style={{ flex:1, height:6, background:'#eee', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ width:`${Math.min(100,(pv/max)*100)}%`, height:'100%', background:CBLUE, borderRadius:3 }} />
                </div>
                <div style={{ flex:1, height:6, background:'#eee', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ width:`${Math.min(100,(bv/max)*100)}%`, height:'100%', background:CGRAY, borderRadius:3 }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Div />
      <STitle>Spillerprofil — radar vs {bench.name}</STitle>
      <Leg items={[{ color: CBLUE, label: player.name }, { color: CGRAY, label: bench.name + ' (benchmark)' }]} />
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={radarData}>
          <PolarGrid stroke="#e0e0e0" />
          <PolarAngleAxis dataKey="stat" tick={{ fontSize: 11 }} />
          <Radar name={player.name} dataKey="spiller"   stroke={CBLUE} fill={CBLUE} fillOpacity={0.25} strokeWidth={2} />
          <Radar name={bench.name}  dataKey="benchmark" stroke={CGRAY} fill={CGRAY} fillOpacity={0.15} strokeWidth={1.5} strokeDasharray="4 2" />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── RISIKOVURDERING ───────────────────────────────────────────────────────────
function Risikovurdering({ player, bench, metrics }) {
  const s = player.stats
  const isPct = k => ['passAcc','duelWin','aerialWin','longPassAcc','dribbleSucc'].includes(k)

  const factors = metrics.risiko.map(k => {
    const pv = s[k] ?? 0
    const bv = bench.stats[k] ?? 0
    const diff = bv > 0 ? ((pv - bv) / bv) * 100 : 0
    const score = Math.min(90, Math.abs(diff))
    return {
      label: (metrics.labels?.[k] ?? k) + ' vs benchmark',
      score: Math.round(score),
      color: diff > 15 ? CGREEN : diff < -15 ? CRED : CAMBER,
    }
  })

  const avgScore = factors.reduce((s,f) => s+f.score, 0) / factors.length
  const risk = avgScore > 55
    ? { label: 'HØY',    color: CRED,   pos: '75%' }
    : avgScore > 30
    ? { label: 'MIDDELS', color: CAMBER, pos: '50%' }
    : { label: 'LAV',    color: CGREEN, pos: '25%' }

  const xgDiff = (s.goals ?? 0) - (s.xG ?? 0)
  const xgBar = [
    { n: 'Mål/90',  v: +(s.goals ?? 0).toFixed(2), f: CBLUE },
    { n: 'xG/90',   v: +(s.xG ?? 0).toFixed(2),    f: CGRAY },
    { n: 'Diff',    v: +Math.abs(xgDiff).toFixed(2), f: xgDiff > 0 ? CRED : CGREEN },
  ]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        <KPI label="Risikonivå" value={risk.label} sub="Samlet vurdering" color={risk.color} />
        <KPI label="G–xG /90"  value={xgDiff.toFixed(2)} sub="Overperformance" color={xgDiff > 0.1 ? CRED : CGREEN} />
        <KPI label="Alder"     value={player.age ?? '—'} sub="år" color={player.age < 22 ? CGREEN : CGRAY} />
        <KPI label="Liga"      value={(leagueScale[player.league] ?? 0.75).toFixed(2)} sub="Skaleringskoeff." color={CGRAY} />
      </div>

      <STitle>G/90 vs xG/90</STitle>
      <ResponsiveContainer width="100%" height={130}>
        <BarChart data={xgBar} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
          <XAxis dataKey="n" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="v" radius={[4,4,0,0]}>
            {xgBar.map((d, i) => <Cell key={i} fill={d.f} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <Div />
      <STitle>Risikomåler</STitle>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '12px 0 20px' }}>
        <span style={{ fontSize: 11, color: '#888' }}>LAV</span>
        <div style={{ flex: 1, height: 8, background: 'linear-gradient(to right, #2a7a3e, #b8920f, #c0392b)', position: 'relative', borderRadius: 4 }}>
          <div style={{ position: 'absolute', top: '50%', left: risk.pos, transform: 'translate(-50%,-50%)', width: 16, height: 16, background: '#1a1a1a', border: '2.5px solid white', borderRadius: '50%' }} />
        </div>
        <span style={{ fontSize: 11, color: '#888' }}>HØY</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: risk.color, whiteSpace: 'nowrap' }}>{risk.label}</span>
      </div>

      <STitle>Avvik fra benchmark ({bench.name}) — {posGroupLabels[player.posGroup]}</STitle>
      <div style={{ marginTop: 8 }}>
        {factors.map(({ label, score, color }) => (
          <div key={label} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', marginBottom: 3 }}>
              <span>{label}</span>
              <span style={{ color, fontWeight: 600 }}>{score}/100</span>
            </div>
            <div style={{ height: 6, background: '#eee', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: score + '%', height: '100%', background: color, borderRadius: 3 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── VIKING-FIT ────────────────────────────────────────────────────────────────
function VikingFit({ player, bench, metrics }) {
  const s = player.stats
  const scale = leagueScale[player.league] ?? 0.75
  const vikXG = 1.92

  // Projeksjon — sensible defaults per position
  const defaultKonv = { CF: 38, WING: 22, CM: 20, CB: 15, BACK: 18 }[player.posGroup] ?? 25
  const defaultXgAndel = { CF: 18, WING: 12, CM: 8, CB: 4, BACK: 5 }[player.posGroup] ?? 10

  const [kamper,  setKamper]  = useState(22)
  const [konv,    setKonv]    = useState(defaultKonv)
  const [xgAndel, setXgAndel] = useState(defaultXgAndel)

  const totalXG = +((vikXG * (xgAndel / 100)) * kamper).toFixed(1)
  const goals   = Math.max(0, Math.round(totalXG * (konv / 100)))
  const lo      = Math.round(goals * 0.8)
  const hi      = Math.round(goals * 1.2)

  const rateComp = metrics.radar.slice(0,4).map(k => {
    const isPct = ['passAcc','duelWin','aerialWin','longPassAcc','dribbleSucc'].includes(k)
    return {
      cat: metrics.labels?.[k] ?? k,
      spiller: isPct ? (s[k]??0) : (s[k]??0)*10,
      vik:     isPct ? (bench.stats[k]??0) : (bench.stats[k]??0)*10,
    }
  })

  const projData = [
    { n: 'Faktisk',       v: +(s.goals * (s.matches ?? 20)).toFixed(0), f: CBLUE },
    { n: 'Konservativt',  v: lo,    f: CGRAY  },
    { n: 'Sentralt',      v: goals, f: CGREEN },
    { n: 'Optimistisk',   v: hi,    f: CAMBER },
  ]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
        <KPI label="Proj. G/sesong" value={`${lo}–${hi}`}    sub={`Sentralt: ${goals}`}       color={CBLUE}  />
        <KPI label="Proj. xG"       value={totalXG}           sub="Basert på Vikings xG/kamp" color={CGREEN} />
        <KPI label="Skaleringskoeff" value={scale.toFixed(2)} sub={player.league}              color={scale >= 0.88 ? CGREEN : scale >= 0.75 ? CAMBER : CRED} />
      </div>

      <STitle>Juster projeksjon</STitle>
      <div style={{ background: '#f5f5f3', borderRadius: 8, padding: 16, marginBottom: 20 }}>
        {[
          { label:'Kamper fra start',   min:8,  max:30, val:kamper,  set:setKamper,  fmt:v=>v+' kamper' },
          { label:'Konverteringsrate',  min:10, max:60, val:konv,    set:setKonv,    fmt:v=>v+'%'       },
          { label:'xG-andel av Viking', min:2,  max:30, val:xgAndel, set:setXgAndel, fmt:v=>v+'%'       },
        ].map(({ label, min, max, val, set, fmt }) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10, fontSize:13, color:'#555' }}>
            <span style={{ minWidth: 200 }}>{label}</span>
            <input type="range" min={min} max={max} value={val} step={1}
              onChange={e => set(+e.target.value)} style={{ flex: 1 }} />
            <span style={{ fontWeight:500, color:'#1a1a1a', minWidth:70, textAlign:'right' }}>{fmt(val)}</span>
          </div>
        ))}
      </div>

      <STitle>Projeksjon vs faktisk sesong</STitle>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={projData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
          <XAxis dataKey="n" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="v" radius={[4,4,0,0]}>
            {projData.map((d, i) => <Cell key={i} fill={d.f} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <Div />
      <STitle>Posisjonsspesifikke rater — spiller vs Viking benchmark</STitle>
      <Leg items={[{ color: CBLUE, label: player.name }, { color: CGREEN, label: bench.name + ' (Viking)' }]} />
      <ResponsiveContainer width="100%" height={170}>
        <BarChart data={rateComp} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
          <XAxis dataKey="cat" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="spiller" name={player.name} fill={CBLUE}  radius={[3,3,0,0]} />
          <Bar dataKey="vik"     name={bench.name}  fill={CGREEN} radius={[3,3,0,0]} />
        </BarChart>
      </ResponsiveContainer>

      <Div />
      <Box color={CBLUE}  text={`Viking FK produserer 1.92 xG/kamp — skaleringskoeffisient for ${player.league}: ${scale.toFixed(2)}.`} />
      <Box color={CGREEN} text={`Benchmark for ${posGroupLabels[player.posGroup]}: ${bench.fullName} (${bench.position}, Viking FK).`} />
      <Box color={CAMBER} text="Projeksjon er modellbasert. Tilpasningsperiode, spilletid og skader er ikke kvantifisert." />
    </div>
  )
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function PlayerDashboard({ player }) {
  const [active, setActive] = useState('oversikt')

  const posGrp = player.posGroup
  const bench  = benchmarks[posGrp]
  const metrics = posMetrics[posGrp]

  if (!bench || !metrics) {
    return <div style={{ padding: 32, fontFamily: 'system-ui' }}>Ingen benchmark for posisjon: {posGrp}</div>
  }

  const fitLabel = (() => {
    let b = 0, w = 0
    metrics.risiko.forEach(k => {
      const r = compareVsBenchmark(player.stats[k] ?? 0, bench.stats[k] ?? 0)
      if (r === 'better') b++
      if (r === 'weaker') w++
    })
    if (b >= 3) return { label: 'STRONG FIT',      color: CGREEN }
    if (w >= 3) return { label: 'DEVELOPMENT FIT', color: CRED   }
    return            { label: 'CONDITIONAL FIT',  color: CBLUE  }
  })()

  const tabs = [
    { id:'oversikt',    label:'Oversikt',       comp: Oversikt       },
    { id:'effektivitet',label:'Effektivitet',    comp: Effektivitet   },
    { id:'risiko',      label:'Risikovurdering', comp: Risikovurdering},
    { id:'viking',      label:'Viking-fit',      comp: VikingFit      },
  ]
  const Comp = tabs.find(t => t.id === active).comp

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: 48 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>
          {player.flag ?? ''} {player.fullName}
        </span>
        <span style={{ fontSize: 13, color: '#888' }}>
          {player.club} · {player.league} · {posGroupLabels[posGrp]}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 24 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', padding: '4px 10px',
          border: `1.5px solid ${fitLabel.color}`, color: fitLabel.color, borderRadius: 2 }}>
          {fitLabel.label}
        </span>
        <span style={{ fontSize: 12, color: '#888' }}>
          {player.nationality} · {player.age ?? '—'} år · Benchmark: {bench.fullName}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)} style={{
            cursor: 'pointer', fontSize: 13, padding: '7px 16px', borderRadius: 8,
            border: active === t.id ? '1.5px solid #333' : '0.5px solid #ccc',
            background: active === t.id ? '#f0f0ee' : 'transparent',
            color: active === t.id ? '#1a1a1a' : '#666',
            fontWeight: active === t.id ? 500 : 400,
          }}>{t.label}</button>
        ))}
      </div>

      <Comp player={player} bench={bench} metrics={metrics} />
    </div>
  )
}
