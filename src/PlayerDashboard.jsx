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
  'Norway. Eliteserien':       1.35,
  'Norway. 1. divisjon':       1.10,
  'Sweden. Allsvenskan':       1.32,
  'Sweden. Superettan':        1.12,
  'Denmark. Superliga':        1.28,
  'Denmark. 1st Division':     1.12,
  'England. League One':       1.20,
  'Scotland. Premiership':     1.25,
  'Finland. Veikkausliiga':    1.18,
  'Netherlands. Eerste Divisie':1.22,
  'Bulgaria. First League':    1.10,
  'Hungary. NB I':             1.08,
  'Lithuania. A Lyga':         1.05,
  'Slovenia. Prva Liga':       1.15,
  'Croatia. SuperSport HNL':   1.18,
}
const leagueScale = {
  'Norway. Eliteserien':       1.00,
  'Norway. 1. divisjon':       0.82,
  'Sweden. Allsvenskan':       0.95,
  'Sweden. Superettan':        0.80,
  'Denmark. Superliga':        0.90,
  'Denmark. 1st Division':     0.80,
  'England. League One':       0.85,
  'Scotland. Premiership':     0.88,
  'Finland. Veikkausliiga':    0.78,
  'Netherlands. Eerste Divisie':0.82,
  'Bulgaria. First League':    0.72,
  'Hungary. NB I':             0.70,
  'Lithuania. A Lyga':         0.68,
  'Slovenia. Prva Liga':       0.75,
  'Croatia. SuperSport HNL':   0.77,
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
function Div() { return <div style={{ borderTop: '0.5px solid #e0e0e0', margin: '20px 0' }} /> }
function Box({ color, text }) {
  return (
    <div style={{ borderLeft: `3px solid ${color}`, borderRadius: '0 8px 8px 0', background: '#f5f5f3', padding: '10px 14px', fontSize: 12, color: '#1a1a1a', lineHeight: 1.6, marginBottom: 8 }}>
      {text}
    </div>
  )
}

// ── OVERSIKT ──────────────────────────────────────────────────────────────────
function Oversikt({ player, bench, metrics }) {
  const s = player.stats
  const cfgMap = Object.fromEntries(statConfig.map(x => [x.key, x]))
  const keys = metrics.radar
  const isPct = k => ['passAcc','duelWin','aerialWin','longPassAcc','dribbleSucc'].includes(k)

  const barData = keys.map(k => ({
    cat: metrics.labels?.[k] ?? cfgMap[k]?.label ?? k,
    spiller: +(s[k] ?? 0).toFixed(2),
    benchmark: +(bench.stats[k] ?? 0).toFixed(2),
  }))

  const lv = leagueXG[player.league] ?? 1.15
  const ligaCtx = [
    { lag: player.club, val: lv, fill: CBLUE },
    { lag: 'Viking FK', val: 1.92, fill: CGRAY },
    { lag: 'Eliteserien', val: 1.35, fill: CGRAY },
    { lag: 'Allsvenskan', val: 1.32, fill: CGRAY },
  ]

  return (
    <div>
      {/* Scout bio */}
      {player.bio && (
        <div style={{
          background:'#f5f5f3', borderLeft:'3px solid #185FA5',
          borderRadius:'0 8px 8px 0', padding:'12px 16px', marginBottom:20,
          fontSize:13, color:'#1a1a1a', lineHeight:1.65,
        }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#185FA5', marginBottom:4, textTransform:'uppercase', letterSpacing:1 }}>
            Scout-analyse
          </div>
          {player.bio}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        <KPI label="Minutter" value={s.minutes?.toLocaleString() ?? '—'} sub={`${s.matches ?? '—'} kamper`} />
        {keys.slice(0,3).map(k => {
          const pv = s[k] ?? 0; const bv = bench.stats[k] ?? 0
          const r = compareVsBenchmark(pv, bv)
          return <KPI key={k} label={metrics.labels?.[k] ?? k}
            value={isPct(k) ? pv.toFixed(1)+'%' : pv.toFixed(2)}
            sub={`Benchmark: ${isPct(k) ? bv.toFixed(1)+'%' : bv.toFixed(2)}`}
            color={r==='better'?CGREEN:r==='weaker'?CRED:CAMBER} />
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
          <Bar dataKey="spiller" name={player.name} fill={CBLUE} radius={[3,3,0,0]} />
          <Bar dataKey="benchmark" name={bench.name} fill={CGRAY} radius={[3,3,0,0]} />
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
            {ligaCtx.map((d,i) => <Cell key={i} fill={d.fill} />)}
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
    const pv = s[k] ?? 0; const bv = bench.stats[k] ?? 0
    const mx = Math.max(pv, bv, 0.01)
    return { stat: metrics.labels?.[k] ?? cfgMap[k]?.label ?? k, spiller: Math.round((pv/mx)*100), benchmark: Math.round((bv/mx)*100) }
  })

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
        {keys.slice(0,3).map(k => {
          const pv = s[k] ?? 0; const bv = bench.stats[k] ?? 0
          const r = compareVsBenchmark(pv, bv)
          return <KPI key={k} label={metrics.labels?.[k] ?? k}
            value={isPct(k)?pv.toFixed(1)+'%':pv.toFixed(2)}
            sub={`Benchmark: ${isPct(k)?bv.toFixed(1)+'%':bv.toFixed(2)}`}
            color={r==='better'?CGREEN:r==='weaker'?CRED:CAMBER} />
        })}
      </div>

      <STitle>Effektivitetsprofil — {posGroupLabels[player.posGroup]}</STitle>
      <div style={{ marginBottom: 20 }}>
        {keys.map(k => {
          const pv = s[k] ?? 0; const bv = bench.stats[k] ?? 0
          const r = compareVsBenchmark(pv, bv)
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
      <Leg items={[{ color: CBLUE, label: player.name }, { color: CGRAY, label: bench.name+' (benchmark)' }]} />
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={radarData}>
          <PolarGrid stroke="#e0e0e0" />
          <PolarAngleAxis dataKey="stat" tick={{ fontSize: 11 }} />
          <Radar name={player.name} dataKey="spiller" stroke={CBLUE} fill={CBLUE} fillOpacity={0.25} strokeWidth={2} />
          <Radar name={bench.name} dataKey="benchmark" stroke={CGRAY} fill={CGRAY} fillOpacity={0.15} strokeWidth={1.5} strokeDasharray="4 2" />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── RISIKO HELPERS ────────────────────────────────────────────────────────────
function getRiskCategories(player, bench, posGrp) {
  const s = player.stats
  const scale = leagueScale[player.league] ?? 0.75
  const mins = s.minutes ?? 0

  // 1. Liga-oversettbarhet
  const ligaRisk = scale >= 0.90 ? { score:15, label:'Lav', color:CGREEN,
    text:`${player.league} (koeff. ${scale.toFixed(2)}) er nær Eliteserien-nivå. Begrenset skaleringsrisiko.` }
    : scale >= 0.80 ? { score:40, label:'Middels', color:CAMBER,
    text:`${player.league} (koeff. ${scale.toFixed(2)}) er et hakk under Eliteserien. Forventet 5–15% prestasjonsdipp i innkjøring.` }
    : { score:70, label:'Høy', color:CRED,
    text:`${player.league} (koeff. ${scale.toFixed(2)}) er markant svakere enn Eliteserien. Signifikant skaleringsrisiko — særlig tempo og press.` }

  // 2. Sample size
  const sampleRisk = mins >= 2500 ? { score:10, label:'Solid', color:CGREEN,
    text:`${mins.toLocaleString()} minutter gir statistisk robuste tall. Lav varians i estimatene.` }
    : mins >= 1500 ? { score:35, label:'OK', color:CAMBER,
    text:`${mins.toLocaleString()} minutter er tilstrekkelig men ikke optimalt. Noen tall kan svinge ved mer spilletid.` }
    : { score:65, label:'Svak', color:CRED,
    text:`${mins.toLocaleString()} minutter er for lite for stabile estimater. Høy usikkerhet i alle nøkkeltall.` }

  // 3. xG-overperformance (mest relevant for CF/WING)
  const xgDiff = (s.goals ?? 0) - (s.xG ?? 0)
  const xgRisk = ['CF','WING'].includes(posGrp)
    ? (xgDiff > 0.15 ? { score:70, label:'Høy', color:CRED,
        text:`G–xG +${xgDiff.toFixed(2)}/90 — overperformer forventet. Regresjon mot xG er sannsynlig i ny kontekst.` }
      : xgDiff < -0.10 ? { score:30, label:'Lav', color:CGREEN,
        text:`G–xG ${xgDiff.toFixed(2)}/90 — underperformer xG. Oppsidepotensial hvis finishing normaliseres.` }
      : { score:20, label:'Nøytral', color:CAMBER,
        text:`G–xG ${xgDiff.toFixed(2)}/90 — scorer på linje med xG. Stabilt output.` })
    : { score:10, label:'N/A', color:CGRAY,
        text:`xG-overperformance er lite relevant for ${posGroupLabels[posGrp]}.` }

  // 4. Taktisk fit
  const tacticalRisks = {
    CF:   s.duelWin < 48 ? { score:55, label:'Middels', color:CAMBER,
            text:`Duell% ${(s.duelWin??0).toFixed(1)}% er under 48% — Viking presser høyt og trenger spiss som kan holde ball under press.` }
          : { score:20, label:'Lav', color:CGREEN, text:`Duell% på ${(s.duelWin??0).toFixed(1)}% er tilfredsstillende for Vikings pressende spillestil.` },
    WING: s.progRuns < 3.0 ? { score:50, label:'Middels', color:CAMBER,
            text:`ProgRuns ${(s.progRuns??0).toFixed(2)}/90 er lavt for Vikings offensive bredde-spill. Forventes å gå opp med bedre støttestruktur.` }
          : { score:15, label:'Lav', color:CGREEN, text:`ProgRuns ${(s.progRuns??0).toFixed(2)}/90 — passer Vikings brede, progressive spillestil.` },
    CM:   s.interceptions < 2.5 ? { score:55, label:'Middels', color:CAMBER,
            text:`Int/90 ${(s.interceptions??0).toFixed(2)} er under 2.5 — Vikings PPDA ~8.1 krever aktiv pressing fra midtbane.` }
          : { score:15, label:'Lav', color:CGREEN, text:`Int/90 ${(s.interceptions??0).toFixed(2)} viser pressing-kapasitet som matcher Vikings høye intensitet.` },
    CB:   s.passAcc < 82 ? { score:50, label:'Middels', color:CAMBER,
            text:`Pass% ${(s.passAcc??0).toFixed(1)}% er under 82% — Viking bygger fra bak og krever trygg pasningsspiller i forsvarslinjen.` }
          : { score:15, label:'Lav', color:CGREEN, text:`Pass% ${(s.passAcc??0).toFixed(1)}% matcher Vikings ball-baserte forsvarsspill.` },
    BACK: s.progRuns < 1.2 ? { score:55, label:'Middels', color:CAMBER,
            text:`ProgRuns ${(s.progRuns??0).toFixed(2)}/90 er lavt for en Viking-back som forventes å overlappe aktivt.` }
          : { score:20, label:'Lav', color:CGREEN, text:`ProgRuns ${(s.progRuns??0).toFixed(2)}/90 — kan bidra i Vikings overlappende back-spill.` },
  }
  const tactRisk = tacticalRisks[posGrp] ?? { score:25, label:'Lav', color:CGREEN, text:'Taktisk profil passer.' }

  // 5. Alder / adaptasjon
  const ageRisk = (player.age ?? 25) < 20 ? { score:45, label:'Middels', color:CAMBER,
      text:`${player.age} år — ung spiller med høyt potensial, men adaptasjonsperiode kan ta lengre tid. Marg for utvikling.` }
    : (player.age ?? 25) > 27 ? { score:30, label:'Lav-middels', color:CAMBER,
      text:`${player.age} år — erfaren profil. Raskere innkjøring, men begrenset salgspotensial.` }
    : { score:15, label:'Lav', color:CGREEN,
      text:`${player.age} år — optimal alder for adaptasjon og utvikling i ny liga.` }

  return [
    { kategori:'Liga-oversettbarhet', ...ligaRisk },
    { kategori:'Sample size',         ...sampleRisk },
    { kategori:'xG-stabilitet',       ...xgRisk },
    { kategori:'Taktisk fit',         ...tactRisk },
    { kategori:'Alder / adaptasjon',  ...ageRisk },
  ]
}

function getVerdict(player, bench, posGrp) {
  const s = player.stats
  const scale = leagueScale[player.league] ?? 0.75
  const riskCats = getRiskCategories(player, bench, posGrp)
  const avgRisk = riskCats.reduce((sum, r) => sum + r.score, 0) / riskCats.length

  // Aldersbonus: tekniske posisjoner (CF/WING/CM) 15%, fysiske (CB/BACK) 8% for ≤21 år
  const age = player.age ?? 25
  const isPhysical = posGrp === 'CB' || posGrp === 'BACK'
  const ageFactor = age <= 21 ? (isPhysical ? 0.92 : 0.85) : age <= 22 ? 0.92 : 1.0

  // CF duelWin skaleres med ligakoeff (duell% er kulturavhengig)
  const rawScaled = k => (k === 'duelWin' && posGrp === 'CF')
    ? (s[k] ?? 0) / scale
    : (s[k] ?? 0)

  const thresholds = {
    CF:   { buyKeys:['goals','xG','duelWin'],            buyMin:[0.40, 0.30, 48] },
    WING: { buyKeys:['goals','dribbleSucc','progRuns'],   buyMin:[0.30, 55, 3.5] },
    CM:   { buyKeys:['passAcc','interceptions','duelWin'],buyMin:[78, 3.0, 46] },
    CB:   { buyKeys:['duelWin','aerialWin','interceptions'],buyMin:[60, 58, 4.0] },
    BACK: { buyKeys:['duelWin','passAcc','progRuns'],     buyMin:[50, 76, 1.0] },
  }[posGrp] ?? { buyKeys:[], buyMin:[] }

  const meetsMin = thresholds.buyKeys.filter((k,i) => {
    const thresh = thresholds.buyMin[i] * ageFactor
    // WING: goals OR shotAssists>=1.0 teller som angrepsoutput
    if (posGrp === 'WING' && k === 'goals') {
      return (s['goals']??0) >= thresh || (s['shotAssists']??0) >= 1.0 * ageFactor
    }
    return rawScaled(k) >= thresh
  }).length
  const totalMin = thresholds.buyKeys.length

  // Risikotak justeres for alder
  const riskCeiling = age <= 21 ? [38, 58, 72] : [30, 50, 65]

  if (meetsMin === totalMin && avgRisk < riskCeiling[0] && scale >= 0.85) {
    return {
      verdict: 'STRONG BUY',
      color: '#166534',
      bg: '#dcfce7',
      icon: '🟢',
      reasoning: `Møter alle posisjonsspesifikke terskler, lav samlet risiko (${Math.round(avgRisk)}/100) og sterk liga-overførbarhet (${scale.toFixed(2)}). Anbefales prioritert.`
    }
  }
  if (meetsMin >= Math.ceil(totalMin * 0.67) && avgRisk < riskCeiling[1]) {
    return {
      verdict: 'BUY',
      color: '#14532d',
      bg: '#f0fdf4',
      icon: '🟡',
      reasoning: `Møter ${meetsMin}/${totalMin} nøkkelterskler. Moderat risiko (${Math.round(avgRisk)}/100). Anbefales med forbehold om tilpasningsperiode.`
    }
  }
  if (meetsMin >= Math.ceil(totalMin * 0.50) && avgRisk < riskCeiling[2]) {
    return {
      verdict: 'MONITOR',
      color: '#92400e',
      bg: '#fffbeb',
      icon: '🟠',
      reasoning: `Møter ${meetsMin}/${totalMin} terskler. Risikoprofil (${Math.round(avgRisk)}/100) krever tettere oppfølging. Vurder på nytt ved mer data.`
    }
  }
  return {
    verdict: 'PASS',
    color: '#7f1d1d',
    bg: '#fef2f2',
    icon: '🔴',
    reasoning: `Møter kun ${meetsMin}/${totalMin} terskler med høy risikoprofil (${Math.round(avgRisk)}/100). Passer ikke Viking FKs krav for denne posisjonen i dag.`
  }
}

// ── RISIKOVURDERING ───────────────────────────────────────────────────────────
function Risikovurdering({ player, bench, metrics }) {
  const s = player.stats
  const posGrp = player.posGroup
  const riskCats = getRiskCategories(player, bench, posGrp)
  const verdict  = getVerdict(player, bench, posGrp)
  const avgRisk  = riskCats.reduce((sum,r) => sum+r.score, 0) / riskCats.length
  const riskLevel = avgRisk > 55 ? { label:'HØY',    color:CRED,   pos:'75%' }
                  : avgRisk > 30 ? { label:'MIDDELS', color:CAMBER, pos:'50%' }
                  :                { label:'LAV',     color:CGREEN, pos:'25%' }

  const keyBar = metrics.risiko.slice(0,3).map(k => ({
    n: metrics.labels?.[k] ?? k,
    spiller: +(s[k] ?? 0).toFixed(2),
    benchmark: +(bench.stats[k] ?? 0).toFixed(2),
  }))

  return (
    <div>
      {/* VERDICT BOX */}
      <div style={{
        background: verdict.bg,
        border: `2px solid ${verdict.color}`,
        borderRadius: 10, padding: '16px 20px', marginBottom: 24,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
          <span style={{ fontSize:22 }}>{verdict.icon}</span>
          <span style={{ fontSize:20, fontWeight:900, color:verdict.color, letterSpacing:1 }}>
            {verdict.verdict}
          </span>
          <span style={{ fontSize:12, color:'#666', fontStyle:'italic' }}>
            — Anbefaling for Viking FK
          </span>
        </div>
        <p style={{ margin:0, fontSize:13, color:'#333', lineHeight:1.6 }}>
          {verdict.reasoning}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        <KPI label="Samlet risiko" value={riskLevel.label} sub={`Snitt ${Math.round(avgRisk)}/100`} color={riskLevel.color} />
        <KPI label="Alder" value={player.age ?? '—'} sub="år" color={(player.age??25) < 22 ? CGREEN : CGRAY} />
        <KPI label="Liga-koeff." value={(leagueScale[player.league]??0.75).toFixed(2)} sub={player.league} color={(leagueScale[player.league]??0.75) >= 0.88 ? CGREEN : CAMBER} />
        <KPI label="Minutter" value={(s.minutes??0).toLocaleString()} sub={`${s.matches??'—'} kamper`} color={(s.minutes??0) >= 2000 ? CGREEN : CAMBER} />
      </div>

      <STitle>Nøkkeltall vs benchmark — {posGroupLabels[posGrp]}</STitle>
      <Leg items={[{ color: CBLUE, label: player.name }, { color: CGRAY, label: bench.name }]} />
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={keyBar} margin={{ top:4, right:4, bottom:0, left:-20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
          <XAxis dataKey="n" tick={{ fontSize:11 }} />
          <YAxis tick={{ fontSize:11 }} />
          <Tooltip />
          <Bar dataKey="spiller" name={player.name} fill={CBLUE} radius={[4,4,0,0]} />
          <Bar dataKey="benchmark" name={bench.name} fill={CGRAY} radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>

      <Div />
      <STitle>Risikomåler</STitle>
      <div style={{ display:'flex', alignItems:'center', gap:16, margin:'12px 0 20px' }}>
        <span style={{ fontSize:11, color:'#888' }}>LAV</span>
        <div style={{ flex:1, height:8, background:'linear-gradient(to right, #2a7a3e, #b8920f, #c0392b)', position:'relative', borderRadius:4 }}>
          <div style={{ position:'absolute', top:'50%', left:riskLevel.pos, transform:'translate(-50%,-50%)', width:16, height:16, background:'#1a1a1a', border:'2.5px solid white', borderRadius:'50%' }} />
        </div>
        <span style={{ fontSize:11, color:'#888' }}>HØY</span>
        <span style={{ fontSize:12, fontWeight:700, color:riskLevel.color, whiteSpace:'nowrap' }}>{riskLevel.label}</span>
      </div>

      <STitle>Risikotypologi — hva kan gå galt?</STitle>
      <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:8 }}>
        {riskCats.map(({ kategori, score, label, color, text }) => (
          <div key={kategori} style={{
            background:'#f9f9f7', borderRadius:8, padding:'12px 14px',
            borderLeft:`4px solid ${color}`,
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
              <span style={{ fontSize:12, fontWeight:700, color:'#1a1a1a' }}>{kategori}</span>
              <span style={{ fontSize:11, fontWeight:700, color, background: color+'22', padding:'2px 8px', borderRadius:99 }}>
                {label} · {score}/100
              </span>
            </div>
            <p style={{ margin:0, fontSize:12, color:'#555', lineHeight:1.55 }}>{text}</p>
            <div style={{ marginTop:6, height:4, background:'#eee', borderRadius:2, overflow:'hidden' }}>
              <div style={{ width:`${Math.min(score,100)}%`, height:'100%', background:color, borderRadius:2 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── VIKING-FIT: CF ────────────────────────────────────────────────────────────
function VikingFitCF({ player, bench }) {
  const s = player.stats
  const scale = leagueScale[player.league] ?? 0.75
  const [kamper, setKamper]   = useState(22)
  const [konv,   setKonv]     = useState(38)
  const [xgAndel,setXgAndel]  = useState(18)
  const vikXG = 1.92

  const totalXG = +((vikXG * (xgAndel/100)) * kamper).toFixed(1)
  const goals   = Math.max(0, Math.round(totalXG * (konv/100)))
  const lo = Math.round(goals*0.8), hi = Math.round(goals*1.2)

  const projData = [
    { n:'Faktisk', v:+(s.goals*(s.matches??20)).toFixed(0), f:CBLUE },
    { n:'Konservativt', v:lo, f:CGRAY },
    { n:'Sentralt', v:goals, f:CGREEN },
    { n:'Optimistisk', v:hi, f:CAMBER },
  ]
  const rateComp = [
    { cat:'G/90',     spiller:s.goals??0,         vik:bench.stats.goals??0 },
    { cat:'xG/90',    spiller:s.xG??0,            vik:bench.stats.xG??0 },
    { cat:'SoT/90',   spiller:s.shotsOT??0,       vik:bench.stats.shotsOT??0 },
    { cat:'Touch felt',spiller:s.touchesPenArea??0,vik:bench.stats.touchesPenArea??0 },
  ]

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:24 }}>
        <KPI label="Proj. mål/sesong" value={`${lo}–${hi}`} sub={`Sentralt: ${goals}`} color={CBLUE} />
        <KPI label="Proj. xG" value={totalXG} sub="Basert på Vikings xG/kamp" color={CGREEN} />
        <KPI label="Ligaskala" value={scale.toFixed(2)} sub={player.league} color={scale>=0.88?CGREEN:scale>=0.75?CAMBER:CRED} />
      </div>
      <STitle>Juster mål-projeksjon</STitle>
      <div style={{ background:'#f5f5f3', borderRadius:8, padding:16, marginBottom:20 }}>
        {[
          { label:'Kamper fra start', min:8, max:30, val:kamper, set:setKamper, fmt:v=>v+' kamper' },
          { label:'Konverteringsrate', min:15, max:60, val:konv, set:setKonv, fmt:v=>v+'%' },
          { label:'xG-andel av Viking', min:5, max:30, val:xgAndel, set:setXgAndel, fmt:v=>v+'%' },
        ].map(({label,min,max,val,set,fmt}) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10, fontSize:13, color:'#555' }}>
            <span style={{ minWidth:200 }}>{label}</span>
            <input type="range" min={min} max={max} value={val} step={1} onChange={e=>set(+e.target.value)} style={{ flex:1 }} />
            <span style={{ fontWeight:500, color:'#1a1a1a', minWidth:70, textAlign:'right' }}>{fmt(val)}</span>
          </div>
        ))}
      </div>
      <STitle>Projeksjon vs faktisk</STitle>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={projData} margin={{ top:4, right:4, bottom:0, left:-20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
          <XAxis dataKey="n" tick={{ fontSize:10 }} />
          <YAxis tick={{ fontSize:11 }} />
          <Tooltip />
          <Bar dataKey="v" radius={[4,4,0,0]}>{projData.map((d,i)=><Cell key={i} fill={d.f}/>)}</Bar>
        </BarChart>
      </ResponsiveContainer>
      <Div />
      <STitle>Offensiv profil — spiller vs {bench.name}</STitle>
      <Leg items={[{ color:CBLUE, label:player.name }, { color:CGREEN, label:bench.name+' (Viking)' }]} />
      <ResponsiveContainer width="100%" height={170}>
        <BarChart data={rateComp} margin={{ top:4, right:4, bottom:0, left:-20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
          <XAxis dataKey="cat" tick={{ fontSize:11 }} />
          <YAxis tick={{ fontSize:11 }} />
          <Tooltip />
          <Bar dataKey="spiller" name={player.name} fill={CBLUE} radius={[3,3,0,0]} />
          <Bar dataKey="vik" name={bench.name} fill={CGREEN} radius={[3,3,0,0]} />
        </BarChart>
      </ResponsiveContainer>
      <Div />
      <Box color={CBLUE} text={`Viking FK produserer 1.92 xG/kamp. Med ${xgAndel}% xG-andel og ${konv}% konvertering gir det ${goals} mål over ${kamper} kamper.`} />
      <Box color={CAMBER} text="Projeksjon forutsetter jevn spilletid. Regresjon mot xG er ikke fullt innbakt — juster konverteringsrate deretter." />
    </div>
  )
}

// ── VIKING-FIT: WING ─────────────────────────────────────────────────────────
function VikingFitWING({ player, bench }) {
  const s = player.stats
  const scale = leagueScale[player.league] ?? 0.75
  const [kamper,  setKamper]  = useState(22)
  const [gaAndel, setGaAndel] = useState(12)
  const [dribForbedring, setDribForbedring] = useState(5)

  const vikXG = 1.92
  const projGA = +((vikXG * (gaAndel/100)) * kamper * 0.85).toFixed(1)
  const projDrib = +((s.dribbleSucc ?? 50) * (1 + dribForbedring/100)).toFixed(1)
  const projRuns = +((s.progRuns ?? 2) * (scale + 0.05)).toFixed(2)

  const rateComp = [
    { cat:'G+A/90',    spiller:(s.goals??0)+(s.assists??0), vik:(bench.stats.goals??0)+(bench.stats.assists??0) },
    { cat:'Dribble%',  spiller:s.dribbleSucc??0,            vik:bench.stats.dribbleSucc??0 },
    { cat:'ProgRuns',  spiller:s.progRuns??0,               vik:bench.stats.progRuns??0 },
    { cat:'ShotAss/90',spiller:s.shotAssists??0,            vik:bench.stats.shotAssists??0 },
  ]

  const projData = [
    { n:'G+A faktisk', v:+((s.goals??0)+(s.assists??0)).toFixed(2), f:CBLUE },
    { n:'Proj. G+A/90',v:+(projGA/kamper).toFixed(2), f:CGREEN },
    { n:'Dribble% nå', v:s.dribbleSucc??0, f:CGRAY },
    { n:'Proj. dribble%', v:Math.min(projDrib,95), f:CAMBER },
  ]

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:24 }}>
        <KPI label="Proj. G+A/sesong" value={projGA.toFixed(0)} sub={`${kamper} kamper`} color={CBLUE} />
        <KPI label="Proj. dribble%" value={Math.min(projDrib,95).toFixed(1)+'%'} sub={`Nå: ${(s.dribbleSucc??0).toFixed(1)}%`} color={CGREEN} />
        <KPI label="Ligaskala" value={scale.toFixed(2)} sub={player.league} color={scale>=0.88?CGREEN:scale>=0.75?CAMBER:CRED} />
      </div>
      <STitle>Juster projeksjonsparametere</STitle>
      <div style={{ background:'#f5f5f3', borderRadius:8, padding:16, marginBottom:20 }}>
        {[
          { label:'Kamper fra start', min:8, max:30, val:kamper, set:setKamper, fmt:v=>v+' kamper' },
          { label:'G+A andel av lagets xG', min:5, max:25, val:gaAndel, set:setGaAndel, fmt:v=>v+'%' },
          { label:'Dribble-forbedring (Viking)', min:0, max:20, val:dribForbedring, set:setDribForbedring, fmt:v=>'+'+v+'%' },
        ].map(({label,min,max,val,set,fmt}) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10, fontSize:13, color:'#555' }}>
            <span style={{ minWidth:220 }}>{label}</span>
            <input type="range" min={min} max={max} value={val} step={1} onChange={e=>set(+e.target.value)} style={{ flex:1 }} />
            <span style={{ fontWeight:500, color:'#1a1a1a', minWidth:70, textAlign:'right' }}>{fmt(val)}</span>
          </div>
        ))}
      </div>
      <STitle>Profil-sammenligning — spiller vs {bench.name}</STitle>
      <Leg items={[{ color:CBLUE, label:player.name }, { color:CGREEN, label:bench.name+' (Viking)' }]} />
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={rateComp} margin={{ top:4, right:4, bottom:0, left:-20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
          <XAxis dataKey="cat" tick={{ fontSize:11 }} />
          <YAxis tick={{ fontSize:11 }} />
          <Tooltip />
          <Bar dataKey="spiller" name={player.name} fill={CBLUE} radius={[3,3,0,0]} />
          <Bar dataKey="vik" name={bench.name} fill={CGREEN} radius={[3,3,0,0]} />
        </BarChart>
      </ResponsiveContainer>
      <Div />
      <Box color={CBLUE} text={`Viking FK gir strukturelt bedre støtte for vinger — mer ball (52% possession), 59 prog. pasninger per kamp. Dribble-suksess forventes å gå opp med bedre støtte.`} />
      <Box color={CGREEN} text={`Proj. G+A: ${projGA} over ${kamper} kamper tilsvarer ${(projGA/kamper).toFixed(2)} per kamp — vs ${((s.goals??0)+(s.assists??0)).toFixed(2)} nå.`} />
      <Box color={CAMBER} text="Ligakvalitet skalert. Dribble-forbedring er en forutsetning basert på Viking-systemet, ikke en garanti." />
    </div>
  )
}

// ── VIKING-FIT: CM ───────────────────────────────────────────────────────────
function VikingFitCM({ player, bench }) {
  const s = player.stats
  const scale = leagueScale[player.league] ?? 0.75
  const [kamper, setKamper]           = useState(22)
  const [passForbedring, setPassForbedring] = useState(3)
  const [pressForbedring, setPressForbedring] = useState(10)

  const projPass  = Math.min(98, +((s.passAcc ?? 75) * (1 + passForbedring/100)).toFixed(1))
  const projInt   = +((s.interceptions ?? 2) * (1 + pressForbedring/100)).toFixed(2)
  const projSA    = +((s.shotAssists ?? 0.5) * (scale + 0.08)).toFixed(2)

  const rateComp = [
    { cat:'Pass%',    spiller:s.passAcc??0,       vik:bench.stats.passAcc??0 },
    { cat:'Int/90',   spiller:s.interceptions??0, vik:bench.stats.interceptions??0 },
    { cat:'Duell%',   spiller:s.duelWin??0,       vik:bench.stats.duelWin??0 },
    { cat:'ShotAss',  spiller:s.shotAssists??0,   vik:bench.stats.shotAssists??0 },
    { cat:'Prog/90',  spiller:s.progRuns??0,      vik:bench.stats.progRuns??0 },
  ]

  const projBar = [
    { n:'Pass% nå',      v:s.passAcc??0,        f:CGRAY },
    { n:'Pass% proj.',   v:projPass,             f:CBLUE },
    { n:'Int/90 nå',     v:(s.interceptions??0)*10, f:CGRAY },
    { n:'Int/90 proj.',  v:projInt*10,           f:CGREEN },
  ]

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:24 }}>
        <KPI label="Proj. pass%" value={projPass.toFixed(1)+'%'} sub={`Nå: ${(s.passAcc??0).toFixed(1)}%`} color={CGREEN} />
        <KPI label="Proj. int/90" value={projInt} sub={`Nå: ${(s.interceptions??0).toFixed(2)}`} color={CBLUE} />
        <KPI label="Proj. shot ass/90" value={projSA} sub={`Nå: ${(s.shotAssists??0).toFixed(2)}`} color={CAMBER} />
      </div>
      <STitle>Juster projeksjonsparametere</STitle>
      <div style={{ background:'#f5f5f3', borderRadius:8, padding:16, marginBottom:20 }}>
        {[
          { label:'Kamper fra start', min:8, max:30, val:kamper, set:setKamper, fmt:v=>v+' kamper' },
          { label:'Pasnings-forbedring (system)', min:0, max:10, val:passForbedring, set:setPassForbedring, fmt:v=>'+'+v+'%' },
          { label:'Press-forbedring (PPDA)', min:0, max:25, val:pressForbedring, set:setPressForbedring, fmt:v=>'+'+v+'%' },
        ].map(({label,min,max,val,set,fmt}) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10, fontSize:13, color:'#555' }}>
            <span style={{ minWidth:220 }}>{label}</span>
            <input type="range" min={min} max={max} value={val} step={1} onChange={e=>set(+e.target.value)} style={{ flex:1 }} />
            <span style={{ fontWeight:500, color:'#1a1a1a', minWidth:70, textAlign:'right' }}>{fmt(val)}</span>
          </div>
        ))}
      </div>
      <STitle>Midtbane-profil — spiller vs {bench.name}</STitle>
      <Leg items={[{ color:CBLUE, label:player.name }, { color:CGREEN, label:bench.name+' (Viking)' }]} />
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={rateComp} margin={{ top:4, right:4, bottom:0, left:-20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
          <XAxis dataKey="cat" tick={{ fontSize:11 }} />
          <YAxis tick={{ fontSize:11 }} />
          <Tooltip />
          <Bar dataKey="spiller" name={player.name} fill={CBLUE} radius={[3,3,0,0]} />
          <Bar dataKey="vik" name={bench.name} fill={CGREEN} radius={[3,3,0,0]} />
        </BarChart>
      </ResponsiveContainer>
      <Div />
      <Box color={CBLUE} text={`Viking FK spiller med høy press-intensitet (PPDA ~8.1) og 59 progressive pasninger per kamp. Dette gir midtbanespillere mer ballkontakt og pressingoppdrag.`} />
      <Box color={CGREEN} text={`Proj. pass% ${projPass.toFixed(1)}% og int/90 ${projInt} er basert på system-løft fra Vikings struktur.`} />
      <Box color={CAMBER} text="Tilpasningsperiode er ikke kvantifisert. Pasningsforbedring forutsetter at spilleren håndterer høyere press-intensitet." />
    </div>
  )
}

// ── VIKING-FIT: CB ───────────────────────────────────────────────────────────
function VikingFitCB({ player, bench }) {
  const s = player.stats
  const scale = leagueScale[player.league] ?? 0.75
  const [kamper, setKamper]               = useState(22)
  const [duellForbedring, setDuellForbedring] = useState(5)
  const [pressForbedring, setPressForbedring] = useState(8)

  const projDuell = Math.min(90, +((s.duelWin ?? 55) * (1 + duellForbedring/100)).toFixed(1))
  const projAerial = Math.min(90, +((s.aerialWin ?? 55) * (1 + duellForbedring/100)).toFixed(1))
  const projInt   = +((s.interceptions ?? 3) * (1 + pressForbedring/100)).toFixed(2)
  const projPass  = Math.min(95, +((s.passAcc ?? 80) * 1.02).toFixed(1))

  const rateComp = [
    { cat:'Duell%',   spiller:s.duelWin??0,       vik:bench.stats.duelWin??0 },
    { cat:'Luft%',    spiller:s.aerialWin??0,      vik:bench.stats.aerialWin??0 },
    { cat:'Int/90',   spiller:s.interceptions??0,  vik:bench.stats.interceptions??0 },
    { cat:'Pass%',    spiller:s.passAcc??0,        vik:bench.stats.passAcc??0 },
    { cat:'LongPass%',spiller:s.longPassAcc??0,    vik:bench.stats.longPassAcc??0 },
  ]

  const projBar = [
    { n:'Duell% nå',   v:s.duelWin??0,    f:CGRAY },
    { n:'Duell% proj.',v:projDuell,        f:CBLUE },
    { n:'Luft% nå',    v:s.aerialWin??0,  f:CGRAY },
    { n:'Luft% proj.', v:projAerial,       f:CGREEN },
  ]

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:24 }}>
        <KPI label="Proj. duell%" value={projDuell.toFixed(1)+'%'} sub={`Nå: ${(s.duelWin??0).toFixed(1)}%`} color={CGREEN} />
        <KPI label="Proj. luft%" value={projAerial.toFixed(1)+'%'} sub={`Nå: ${(s.aerialWin??0).toFixed(1)}%`} color={CBLUE} />
        <KPI label="Proj. int/90" value={projInt} sub={`Nå: ${(s.interceptions??0).toFixed(2)}`} color={CBLUE} />
        <KPI label="Proj. pass%" value={projPass.toFixed(1)+'%'} sub={`Nå: ${(s.passAcc??0).toFixed(1)}%`} color={CAMBER} />
      </div>
      <STitle>Juster projeksjonsparametere</STitle>
      <div style={{ background:'#f5f5f3', borderRadius:8, padding:16, marginBottom:20 }}>
        {[
          { label:'Kamper fra start', min:8, max:30, val:kamper, set:setKamper, fmt:v=>v+' kamper' },
          { label:'Duell-forbedring (system/coaching)', min:0, max:15, val:duellForbedring, set:setDuellForbedring, fmt:v=>'+'+v+'%' },
          { label:'Press-forbedring (int/90)', min:0, max:25, val:pressForbedring, set:setPressForbedring, fmt:v=>'+'+v+'%' },
        ].map(({label,min,max,val,set,fmt}) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10, fontSize:13, color:'#555' }}>
            <span style={{ minWidth:240 }}>{label}</span>
            <input type="range" min={min} max={max} value={val} step={1} onChange={e=>set(+e.target.value)} style={{ flex:1 }} />
            <span style={{ fontWeight:500, color:'#1a1a1a', minWidth:70, textAlign:'right' }}>{fmt(val)}</span>
          </div>
        ))}
      </div>
      <STitle>Defensiv profil — spiller vs {bench.name}</STitle>
      <Leg items={[{ color:CBLUE, label:player.name }, { color:CGREEN, label:bench.name+' (Viking)' }]} />
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={rateComp} margin={{ top:4, right:4, bottom:0, left:-20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
          <XAxis dataKey="cat" tick={{ fontSize:11 }} />
          <YAxis tick={{ fontSize:11 }} />
          <Tooltip />
          <Bar dataKey="spiller" name={player.name} fill={CBLUE} radius={[3,3,0,0]} />
          <Bar dataKey="vik" name={bench.name} fill={CGREEN} radius={[3,3,0,0]} />
        </BarChart>
      </ResponsiveContainer>
      <Div />
      <Box color={CBLUE} text={`Viking FK gir midtstoppere ca. 0.81 xG mot per kamp og høyt press. Dette gir flere defensive oppdrag og mulighet for forbedring i duell- og luftkampstatistikk.`} />
      <Box color={CGREEN} text={`Proj. duell% ${projDuell.toFixed(1)}% og luft% ${projAerial.toFixed(1)}% — basert på ${duellForbedring}% system-løft og ${pressForbedring}% press-forbedring.`} />
      <Box color={CAMBER} text="Pasningsnøyaktighet forventes å gå marginalt opp i et mer ballbasert system." />
    </div>
  )
}

// ── VIKING-FIT: BACK ─────────────────────────────────────────────────────────
function VikingFitBACK({ player, bench }) {
  const s = player.stats
  const scale = leagueScale[player.league] ?? 0.75
  const [kamper, setKamper]               = useState(22)
  const [overlapForbedring, setOverlapForbedring] = useState(15)
  const [duellForbedring, setDuellForbedring]     = useState(5)

  const projProgRuns  = +((s.progRuns ?? 1) * (1 + overlapForbedring/100)).toFixed(2)
  const projShotAss   = +((s.shotAssists ?? 0.5) * (1 + overlapForbedring/100)).toFixed(2)
  const projDuell     = Math.min(85, +((s.duelWin ?? 50) * (1 + duellForbedring/100)).toFixed(1))
  const projPass      = Math.min(90, +((s.passAcc ?? 75) * 1.02).toFixed(1))

  const rateComp = [
    { cat:'Duell%',    spiller:s.duelWin??0,      vik:bench.stats.duelWin??0 },
    { cat:'Pass%',     spiller:s.passAcc??0,       vik:bench.stats.passAcc??0 },
    { cat:'ProgRuns',  spiller:s.progRuns??0,      vik:bench.stats.progRuns??0 },
    { cat:'ShotAss',   spiller:s.shotAssists??0,   vik:bench.stats.shotAssists??0 },
    { cat:'Int/90',    spiller:s.interceptions??0, vik:bench.stats.interceptions??0 },
  ]

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:24 }}>
        <KPI label="Proj. prog. runs" value={projProgRuns} sub={`Nå: ${(s.progRuns??0).toFixed(2)}`} color={CBLUE} />
        <KPI label="Proj. shot ass" value={projShotAss} sub={`Nå: ${(s.shotAssists??0).toFixed(2)}`} color={CGREEN} />
        <KPI label="Proj. duell%" value={projDuell.toFixed(1)+'%'} sub={`Nå: ${(s.duelWin??0).toFixed(1)}%`} color={CAMBER} />
        <KPI label="Proj. pass%" value={projPass.toFixed(1)+'%'} sub={`Nå: ${(s.passAcc??0).toFixed(1)}%`} color={CBLUE} />
      </div>
      <STitle>Juster projeksjonsparametere</STitle>
      <div style={{ background:'#f5f5f3', borderRadius:8, padding:16, marginBottom:20 }}>
        {[
          { label:'Kamper fra start', min:8, max:30, val:kamper, set:setKamper, fmt:v=>v+' kamper' },
          { label:'Overlap-forbedring (prog. runs/crosses)', min:0, max:30, val:overlapForbedring, set:setOverlapForbedring, fmt:v=>'+'+v+'%' },
          { label:'Duell-forbedring (back-linje)', min:0, max:15, val:duellForbedring, set:setDuellForbedring, fmt:v=>'+'+v+'%' },
        ].map(({label,min,max,val,set,fmt}) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10, fontSize:13, color:'#555' }}>
            <span style={{ minWidth:250 }}>{label}</span>
            <input type="range" min={min} max={max} value={val} step={1} onChange={e=>set(+e.target.value)} style={{ flex:1 }} />
            <span style={{ fontWeight:500, color:'#1a1a1a', minWidth:70, textAlign:'right' }}>{fmt(val)}</span>
          </div>
        ))}
      </div>
      <STitle>Back-profil — spiller vs {bench.name}</STitle>
      <Leg items={[{ color:CBLUE, label:player.name }, { color:CGREEN, label:bench.name+' (Viking)' }]} />
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={rateComp} margin={{ top:4, right:4, bottom:0, left:-20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
          <XAxis dataKey="cat" tick={{ fontSize:11 }} />
          <YAxis tick={{ fontSize:11 }} />
          <Tooltip />
          <Bar dataKey="spiller" name={player.name} fill={CBLUE} radius={[3,3,0,0]} />
          <Bar dataKey="vik" name={bench.name} fill={CGREEN} radius={[3,3,0,0]} />
        </BarChart>
      </ResponsiveContainer>
      <Div />
      <Box color={CBLUE} text={`Viking FK gir backer systematisk overlapp-støtte fra midtbane. Dette øker antall progressive carries og crosses per kamp betydelig.`} />
      <Box color={CGREEN} text={`Proj. prog. runs: ${projProgRuns}/90 og shot assists: ${projShotAss}/90 — basert på ${overlapForbedring}% overlap-forbedring.`} />
      <Box color={CAMBER} text="Defensiv 1v1 langs kanten er kritisk i Eliteserien. Duell% mot hurtige vinger er en risikofaktor." />
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function PlayerDashboard({ player }) {
  const [active, setActive] = useState('oversikt')

  const posGrp  = player.posGroup
  const bench   = benchmarks[posGrp]
  const metrics = posMetrics[posGrp]

  if (!bench || !metrics) {
    return <div style={{ padding:32, fontFamily:'system-ui' }}>Ingen benchmark for posisjon: {posGrp}</div>
  }

  const verdict = getVerdict(player, bench, posGrp)

  const verdictBadge = {
    'STRONG BUY': { bg:'#166534', text:'#dcfce7' },
    'BUY':        { bg:'#15803d', text:'#f0fdf4' },
    'MONITOR':    { bg:'#b45309', text:'#fffbeb' },
    'PASS':       { bg:'#b91c1c', text:'#fef2f2' },
  }[verdict.verdict] ?? { bg:'#374151', text:'#f9fafb' }

  // Select correct VikingFit component per position
  const VikingFitComp = {
    CF:   VikingFitCF,
    WING: VikingFitWING,
    CM:   VikingFitCM,
    CB:   VikingFitCB,
    BACK: VikingFitBACK,
  }[posGrp]

  const tabs = [
    { id:'oversikt',    label:'Oversikt',       Comp: Oversikt       },
    { id:'effektivitet',label:'Effektivitet',    Comp: Effektivitet   },
    { id:'risiko',      label:'Risikovurdering', Comp: Risikovurdering},
    { id:'viking',      label:'Viking-fit',      Comp: VikingFitComp  },
  ]
  const { Comp } = tabs.find(t => t.id === active)

  return (
    <div style={{ fontFamily:'system-ui, -apple-system, sans-serif', paddingBottom:48 }}>
      <div style={{ display:'flex', alignItems:'baseline', gap:12, marginBottom:6 }}>
        <span style={{ fontSize:20, fontWeight:700, color:'#1a1a1a' }}>
          {player.flag ?? ''} {player.fullName}
        </span>
        <span style={{ fontSize:13, color:'#888' }}>
          {player.club} · {player.league} · {posGroupLabels[posGrp]}
        </span>
      </div>
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:24, flexWrap:'wrap' }}>
        <span style={{
          fontSize:12, fontWeight:800, letterSpacing:'0.1em',
          padding:'5px 14px', borderRadius:4,
          background: verdictBadge.bg, color: verdictBadge.text,
        }}>
          {verdict.icon} {verdict.verdict}
        </span>
        <span style={{ fontSize:12, color:'#888' }}>
          {player.nationality} · {player.age ?? '—'} år · Benchmark: {bench.fullName}
        </span>
        {player.marketValue && (
          <span style={{ fontSize:12, background:'#f0f0ee', padding:'3px 10px', borderRadius:4, color:'#1a1a1a', fontWeight:600 }}>
            {player.marketValue}
          </span>
        )}
        {player.contract && (
          <span style={{ fontSize:12, color:'#888' }}>
            Kontrakt til {player.contract}
          </span>
        )}
        <span style={{ fontSize:12, color:'#999', fontStyle:'italic', marginLeft:'auto' }}>
          Klikk Risikovurdering for full begrunnelse
        </span>
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:24, flexWrap:'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)} style={{
            cursor:'pointer', fontSize:13, padding:'7px 16px', borderRadius:8,
            border: active===t.id ? '1.5px solid #333' : '0.5px solid #ccc',
            background: active===t.id ? '#f0f0ee' : 'transparent',
            color: active===t.id ? '#1a1a1a' : '#666',
            fontWeight: active===t.id ? 500 : 400,
          }}>{t.label}</button>
        ))}
      </div>

      <Comp player={player} bench={bench} metrics={metrics} />
    </div>
  )
}
