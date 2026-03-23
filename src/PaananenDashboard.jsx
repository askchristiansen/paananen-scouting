import { useState } from 'react'
import {
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const CBLUE  = '#185FA5'
const CRED   = '#C0392B'
const CGREEN = '#3B6D11'
const CAMBER = '#B07517'
const CGRAY  = '#888'

const per90Data = [
  { cat: 'Mål/90',        val: 0.55 },
  { cat: 'Skudd/90',      val: 2.32 },
  { cat: 'Skuddass./90',  val: 0.92 },
  { cat: 'Touch felt/90', val: 3.24 },
  { cat: 'Prog.runs/90',  val: 1.22 },
  { cat: 'Intercept./90', val: 1.86 },
]

const effData = [
  { cat: 'Dribleseier',         val: 55.6 },
  { cat: 'Pasningsnøyaktighet', val: 75.0 },
  { cat: 'Skudd på mål',        val: 43.4 },
  { cat: 'Duellseier',          val: 40.6 },
  { cat: 'Hodekampseier',       val: 37.3 },
]

const radarData = [
  { stat: 'Mål/90',        v: 8.5 },
  { stat: 'Skuddvolum',    v: 7.2 },
  { stat: 'Feltaktivitet', v: 7.8 },
  { stat: 'Pressing',      v: 6.5 },
  { stat: 'Dribleevne',    v: 6.8 },
  { stat: 'Pasning',       v: 5.5 },
]

const ligaCtx = [
  { lag: 'SJK 2025',          val: 1.54, fill: CBLUE },
  { lag: 'Veikkausliiga snitt', val: 1.28, fill: CGRAY },
  { lag: 'Eliteserien snitt',  val: 1.35, fill: CGRAY },
  { lag: 'Allsvenskan snitt',  val: 1.38, fill: CGRAY },
]

const risikoData = [
  { label: 'xG-overperformance (regresjon)', score: 80, color: CRED   },
  { label: 'Kontekstavhengighet',            score: 70, color: CAMBER },
  { label: 'Balltap i egen halvdel',         score: 60, color: CAMBER },
  { label: 'Duellsvakhet',                   score: 55, color: CAMBER },
  { label: 'Europeisk erfaring (begrenset)', score: 30, color: CGREEN },
]

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

function Oversikt() {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        <KPI label="Mål (2025)"         value="18"   sub="34 kamper · 2 945 min"          color={CBLUE}  />
        <KPI label="xG"                 value="12.81" sub="G–xG: +5.19 over"                              />
        <KPI label="Mål per 90"         value="0.55" sub="Blant topp i Veikkausliiga"     color={CGREEN} />
        <KPI label="Skuddassister/90"   value="0.92" sub="Sjansskapning for andre"                        />
      </div>

      <STitle>Nøkkeltall per 90 min</STitle>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={per90Data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
          <XAxis dataKey="cat" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="val" fill={CBLUE} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <Div />

      <STitle>Ligakontekst — lagets xG per kamp</STitle>
      <Leg items={[{ color: CBLUE, label: 'SJK 2025' }, { color: CGRAY, label: 'Sammenligning' }]} />
      <ResponsiveContainer width="100%" height={170}>
        <BarChart data={ligaCtx} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
          <XAxis dataKey="lag" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 11 }} domain={[0, 2.0]} />
          <Tooltip formatter={v => [v.toFixed(2), 'xG/kamp']} />
          <Bar dataKey="val" radius={[3, 3, 0, 0]}>
            {ligaCtx.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function Effektivitet() {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        <KPI label="Dribleseier"         value="55.6%" sub="35 av 63 forsøk"      color={CGREEN} />
        <KPI label="Pasningsnøyaktighet" value="75.0%" sub="618 av 824 pasninger"               />
        <KPI label="Duellseier"          value="40.6%" sub="214 av 527 dueller"   color={CAMBER} />
        <KPI label="Hodekampseier"       value="37.3%" sub="19 av 51 dueller"     color={CRED}   />
      </div>

      <STitle>Effektivitetsprofil</STitle>
      <div style={{ marginBottom: 20 }}>
        {effData.map(({ cat, val }) => (
          <div key={cat} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', marginBottom: 3 }}>
              <span>{cat}</span>
              <span style={{ fontWeight: 600, color: val >= 55 ? CGREEN : val >= 42 ? CBLUE : val >= 38 ? CAMBER : CRED }}>
                {val.toFixed(1)}%
              </span>
            </div>
            <div style={{ height: 7, background: '#eee', borderRadius: 3, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
              <div style={{ width: val + '%', height: '100%', background: val >= 55 ? CGREEN : val >= 42 ? CBLUE : val >= 38 ? CAMBER : CRED, borderRadius: 3 }} />
            </div>
          </div>
        ))}
      </div>

      <Div />

      <STitle>Spillerprofil — radar</STitle>
      <Leg items={[{ color: CBLUE, label: 'Paananen 2025' }]} />
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={radarData}>
          <PolarGrid stroke="#e0e0e0" />
          <PolarAngleAxis dataKey="stat" tick={{ fontSize: 12 }} />
          <Radar name="Paananen" dataKey="v" stroke={CBLUE} fill={CBLUE} fillOpacity={0.25} strokeWidth={2} />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>

      <Div />
      <Box color={CGREEN} text="Dribleseier på 55.6% er solid for en angripende profil — viser at han skaper separasjon gjennom bevegelse. Pressing-bidraget (1.86 interceptions per 90) er uventet sterkt." />
      <Box color={CRED}   text="Duellseier 40.6% og hodekamp 37.3% er lavt. I en liga med mer fysisk forsvar vil disse tallene utfordres." />
    </div>
  )
}

function Risiko() {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        <KPI label="G–xG overperformance" value="+5.19"        sub="Størst risikofaktor"         color={CRED}   />
        <KPI label="Balltap i egen halvdel" value="10.6/90"    sub="Høyt — ofte urapportert"     color={CAMBER} />
        <KPI label="Risikonivå"             value="Middels–høy" sub="System og regresjon"         color={CRED}   />
        <KPI label="Verdict"                value="Cond. Fit"  sub="Kontekstuell anbefaling"      color={CBLUE}  />
      </div>

      <STitle>xG-overperformance</STitle>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={[{ n: 'Scoret', v: 18, f: CBLUE }, { n: 'xG', v: 12.81, f: CGRAY }, { n: 'Differanse', v: 5.19, f: CRED }]} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
          <XAxis dataKey="n" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="v" radius={[4, 4, 0, 0]}>
            {[CBLUE, CGRAY, CRED].map((c, i) => <Cell key={i} fill={c} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <Div />

      <STitle>Risikomåler</STitle>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '12px 0 20px' }}>
        <span style={{ fontSize: 11, color: '#888' }}>LAV</span>
        <div style={{ flex: 1, height: 8, background: 'linear-gradient(to right, #2a7a3e, #b8920f, #c0392b)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '50%', left: '63%', transform: 'translate(-50%,-50%)', width: 16, height: 16, background: '#1a1a1a', border: '2.5px solid white', borderRadius: '50%' }} />
        </div>
        <span style={{ fontSize: 11, color: '#888' }}>HØY</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: CRED, whiteSpace: 'nowrap' }}>MIDDELS–HØY</span>
      </div>

      <STitle>Risikofordeling</STitle>
      <div style={{ marginTop: 8 }}>
        {risikoData.map(({ label, score, color }) => (
          <div key={label} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', marginBottom: 3 }}>
              <span>{label}</span>
              <span style={{ color, fontWeight: 600 }}>{score}/100</span>
            </div>
            <div style={{ height: 6, background: '#eee', borderRadius: 3, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
              <div style={{ width: score + '%', height: '100%', background: color, borderRadius: 3 }} />
            </div>
          </div>
        ))}
      </div>

      <Div />
      <Box color={CRED}   text="G–xG +5.19 over én sesong er den viktigste faktoren. Forventet G/90 i ny liga: 0.35–0.42." />
      <Box color={CGREEN} text="Risikonivået reduseres vesentlig i riktig system: åpent, transisjonsorientert, frihet i høyre halvrom." />
    </div>
  )
}

function Projeksjon() {
  const [kamper,   setKamper]   = useState(26)
  const [konv,     setKonv]     = useState(40)
  const [xgAndel,  setXgAndel]  = useState(18)
  const [lagsXG,   setLagsXG]   = useState(155)

  const totalXG = +((lagsXG / 100) * (xgAndel / 100) * kamper).toFixed(1)
  const goals   = Math.round(totalXG * (konv / 100))
  const lo      = Math.round(goals * 0.8)
  const hi      = Math.round(goals * 1.2)

  const cmpData = [
    { n: 'SJK 2025 (faktisk)', v: 18,                    f: CBLUE  },
    { n: 'Konservativt',       v: Math.round(goals * 0.85), f: CGRAY  },
    { n: 'Sentralt estimat',   v: goals,                  f: CGREEN },
    { n: 'Optimistisk',        v: Math.round(goals * 1.2),  f: CAMBER },
  ]

  const sliders = [
    { label: 'Kamper fra start',          min: 15, max: 34,  val: kamper,  set: setKamper,  fmt: v => v + ' kamper' },
    { label: 'Konverteringsrate',         min: 18, max: 55,  val: konv,    set: setKonv,    fmt: v => v + '%'       },
    { label: 'Spillerens xG-andel av lag', min: 10, max: 30, val: xgAndel, set: setXgAndel, fmt: v => v + '%'       },
    { label: 'Lagets xG per 100 min',     min: 100, max: 220, val: lagsXG, set: setLagsXG,  fmt: v => (v/100).toFixed(2) },
  ]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        <KPI label="2025 (Veikkausliiga)"       value="18 mål"    sub="0.55/90 · 2 945 min"         color={CBLUE}  />
        <KPI label="Forventet G/90 (ny liga)"   value="0.35–0.42" sub="Regresjonskorrigert"          color={CAMBER} />
        <KPI label="Sentralt estimat"           value={`${lo}–${hi}`} sub="Mål per sesong"           color={CGREEN} />
        <KPI label="Overgangspris"              value="Ukjent"    sub="Kontrakt til des. 2026"                       />
      </div>

      <STitle>Juster projeksjon</STitle>
      <div style={{ background: '#f5f5f3', borderRadius: 8, padding: 16, marginBottom: 20 }}>
        {sliders.map(({ label, min, max, val, set, fmt }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, fontSize: 13, color: '#555' }}>
            <span style={{ minWidth: 220 }}>{label}</span>
            <input type="range" min={min} max={max} value={val} step={1} onChange={e => set(+e.target.value)} style={{ flex: 1 }} />
            <span style={{ fontWeight: 500, color: '#1a1a1a', minWidth: 70, textAlign: 'right' }}>{fmt(val)}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Projiserte mål',  value: goals,   sub: `Intervall: ${lo}–${hi}` },
          { label: 'Projisert xG',    value: totalXG, sub: 'Basert på parametere'    },
          { label: 'Projisert G/90',  value: kamper > 0 ? (goals / kamper).toFixed(2) : '—', sub: 'vs 0.55 i Veikkausliiga' },
        ].map(({ label, value, sub }) => (
          <div key={label} style={{ background: '#eef3fa', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 34, fontWeight: 700, color: CBLUE, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{sub}</div>
          </div>
        ))}
      </div>

      <STitle>Estimat vs faktisk 2025</STitle>
      <ResponsiveContainer width="100%" height={190}>
        <BarChart data={cmpData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
          <XAxis dataKey="n" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 11 }} domain={[0, 25]} />
          <Tooltip />
          <Bar dataKey="v" radius={[4, 4, 0, 0]}>
            {cmpData.map((d, i) => <Cell key={i} fill={d.f} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <Div />
      <Box color={CBLUE}  text="Standardforutsetning: 26 kamper, 40% konverteringsrate (ned fra 55% i 2025), 18% xG-andel av lagets totale xG." />
      <Box color={CAMBER} text="Regresjonskorrigering er innbakt — konverteringsraten er satt lavere enn 2025-nivå for å reflektere at +5.19 G–xG neppe vedvarer fullt ut." />
      <Box color={CGREEN} text="I et transisjonsorientert lag med høy offensiv xG-produksjon er 12–16 mål i et første år et realistisk spenn." />
    </div>
  )
}

const TABS = [
  { id: 'oversikt',     label: 'Oversikt',       comp: Oversikt     },
  { id: 'effektivitet', label: 'Effektivitet',    comp: Effektivitet },
  { id: 'risiko',       label: 'Risikovurdering', comp: Risiko       },
  { id: 'projeksjon',   label: 'Projeksjon',      comp: Projeksjon   },
]

export default function Dashboard() {
  const [active, setActive] = useState('oversikt')
  const Comp = TABS.find(t => t.id === active).comp

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: 48 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>Kasper Paananen</span>
        <span style={{ fontSize: 13, color: '#888' }}>SJK · Veikkausliiga 2025 · AMF / Invertert kant</span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 24 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', padding: '4px 10px', border: '1.5px solid #185FA5', color: '#185FA5', borderRadius: 2 }}>
          {player.verdict ?? 'MONITOR'}
        </span>
        <span style={{ fontSize: 12, color: '#888' }}>FIN · 23 år · Venstrefot</span>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            style={{
              cursor: 'pointer', fontSize: 13, padding: '7px 16px', borderRadius: 8,
              border: active === t.id ? '1.5px solid #333' : '0.5px solid #ccc',
              background: active === t.id ? '#f0f0ee' : 'transparent',
              color: active === t.id ? '#1a1a1a' : '#666',
              fontWeight: active === t.id ? 500 : 400,
              transition: 'all .15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Comp />
    </div>
  )
}
