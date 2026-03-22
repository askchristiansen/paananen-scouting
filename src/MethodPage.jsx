import { useState, useEffect } from 'react'

const SECTION_STYLE = {
  background: '#111827',
  border: '1px solid #1f2937',
  borderRadius: 12,
  padding: '20px 24px',
  marginBottom: 16,
}

const H2 = ({ children }) => (
  <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#f9fafb', letterSpacing: '-0.01em' }}>
    {children}
  </h2>
)

const Label = ({ children }) => (
  <span style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
    {children}
  </span>
)

const Value = ({ children, color }) => (
  <span style={{ fontSize: 13, color: color || '#9ca3af', fontWeight: 500 }}>
    {children}
  </span>
)

const Row = ({ label, value, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #1a2332' }}>
    <Label>{label}</Label>
    <Value color={color}>{value}</Value>
  </div>
)

const VerdictBadge = ({ v }) => {
  const styles = {
    'STRONG BUY': { bg: '#166534', text: '#dcfce7' },
    'BUY':        { bg: '#15803d', text: '#f0fdf4' },
    'MONITOR':    { bg: '#92400e', text: '#fffbeb' },
    'PASS':       { bg: '#7f1d1d', text: '#fef2f2' },
  }[v] ?? { bg: '#374151', text: '#f9fafb' }
  return (
    <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 4,
      background: styles.bg, color: styles.text, letterSpacing: '0.06em' }}>
      {v}
    </span>
  )
}

export default function MethodPage({ onBack }) {
  const [method, setMethod] = useState(null)

  useEffect(() => {
    fetch('/data/methodology.json')
      .then(r => r.json())
      .then(setMethod)
      .catch(() => setMethod(null))
  }, [])

  const m = method

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#0a0f1a', minHeight: '100vh',
      color: '#f9fafb', padding: '24px 20px', maxWidth: 860, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: '#1f2937', border: 'none', color: '#f9fafb',
          borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13 }}>
          ← Tilbake
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Metodedokumentasjon</h1>
          <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
            Transparens i datakilder, vekter og beslutningslogikk
            {m && <span style={{ marginLeft: 8 }}>· v{m.version} · {m.last_updated}</span>}
          </p>
        </div>
      </div>

      {/* 1. Datakilder */}
      <div style={SECTION_STYLE}>
        <H2>📊 Datakilder</H2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { name: 'Wyscout', type: 'Performance-data', format: 'Excel (.xlsx)', update: 'Manuell eksport per spiller' },
            { name: 'Transfermarkt', type: 'Markedsdata', format: 'JSON (manuelt)', update: 'Manuell ved endring' },
          ].map(s => (
            <div key={s.name} style={{ background: '#1a2332', borderRadius: 8, padding: '14px 16px' }}>
              <div style={{ fontWeight: 700, color: '#f9fafb', marginBottom: 8 }}>{s.name}</div>
              <Row label="Type"     value={s.type} />
              <Row label="Format"   value={s.format} />
              <Row label="Oppdatering" value={s.update} />
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: '#4b5563', marginTop: 12, marginBottom: 0 }}>
          Alle stats beregnes per 90 minutter. Kamper med {'<'} 20 min spilletid ekskluderes.
          Performance og markedsdata holdes separert i datamodellen og merges kun ved bygging.
        </p>
      </div>

      {/* 2. Hard filters */}
      <div style={SECTION_STYLE}>
        <H2>🚧 Harde filtre (gating)</H2>
        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 0, marginBottom: 12 }}>
          Spiller MÅ møte alle disse for å kunne få en positiv anbefaling (BUY/STRONG BUY):
        </p>
        {m ? (
          <div>
            <Row label="Minimum minutter"         value={`${m.hard_filters.min_minutes} min`} />
            <Row label="Minimum confidence score" value={`${m.hard_filters.min_confidence_score}/100`} />
            <Row label="Min. kontraktlengde igjen" value={`${m.hard_filters.min_contract_months_remaining} måneder`} />
            <div style={{ marginTop: 12 }}>
              <Label>Maksimumsalder per rolle</Label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                {Object.entries(m.hard_filters.max_age_by_role).map(([role, age]) => (
                  <span key={role} style={{ background: '#1a2332', borderRadius: 6,
                    padding: '4px 10px', fontSize: 12, color: '#9ca3af' }}>
                    {role}: {age} år
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            <Row label="Minimum minutter"  value="500 min" />
            <Row label="Min. confidence"   value="30/100" />
            <Row label="Min. kontrakt"     value="6 måneder" />
            <Row label="Maksimumsalder CF" value="27 år" />
          </div>
        )}
      </div>

      {/* 3. Confidence Score */}
      <div style={SECTION_STYLE}>
        <H2>🎯 Confidence Score (0–100)</H2>
        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 0, marginBottom: 12 }}>
          Måler datakvalitet og pålitelighet. Påvirker vekten på verdict-anbefalingen.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          {[
            { comp: 'Minutter spilt', weight: 25, desc: '0: <500 min → 25: >2500 min' },
            { comp: 'Datakompletthet', weight: 25, desc: 'Andel nøkkelfelter med verdi' },
            { comp: 'Ligakvalitet', weight: 25, desc: 'Basert på liga-koeffisient' },
            { comp: 'Aktualitet', weight: 25, desc: 'Inneværende sesong = maks poeng' },
          ].map(c => (
            <div key={c.comp} style={{ background: '#1a2332', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#f9fafb' }}>{c.comp}</span>
                <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 700 }}>/{c.weight}p</span>
              </div>
              <span style={{ fontSize: 11, color: '#6b7280' }}>{c.desc}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ tier: 'Høy', range: '70–100', color: '#22c55e' },
            { tier: 'Middels', range: '45–69', color: '#eab308' },
            { tier: 'Lav', range: '0–44', color: '#ef4444' }].map(t => (
            <div key={t.tier} style={{ flex: 1, background: '#1a2332', borderRadius: 6, padding: '8px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.color }}>{t.tier}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>{t.range} poeng</div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Risk Score */}
      <div style={SECTION_STYLE}>
        <H2>⚠️ Risk Score — 4 komponenter</H2>
        {[
          { name: 'Sportslig risiko', weight: '35%', color: '#ef4444',
            factors: ['xG-overperformance > 0.15/90', 'Duelwin < 45%', 'Pass% < 72', 'Lav aerialwin (CF/CB)'] },
          { name: 'Økonomisk risiko', weight: '25%', color: '#f97316',
            factors: ['Markedsverdi > €3M', 'Kontrakt < 12 mnd', 'Ukjent kontrakt'] },
          { name: 'Adaptasjonsrisiko', weight: '25%', color: '#eab308',
            factors: ['Ligakoeffisient < 0.75', 'Alder < 20 år', 'Svært svak liga'] },
          { name: 'Tilgjengelighetsrisiko', weight: '15%', color: '#6b7280',
            factors: ['Spilletid < 1000 min', 'Kontrakt utløper < 6 mnd'] },
        ].map(r => (
          <div key={r.name} style={{ background: '#1a2332', borderRadius: 8, padding: '12px 14px', marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#f9fafb' }}>{r.name}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: r.color }}>Vekt {r.weight}</span>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {r.factors.map(f => (
                <span key={f} style={{ fontSize: 11, color: '#6b7280', background: '#111827',
                  padding: '2px 8px', borderRadius: 4 }}>{f}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 5. Verdict-terskler */}
      <div style={SECTION_STYLE}>
        <H2>📋 Verdict — terskler per posisjon</H2>
        {[
          { pos: 'CF / Spiss',   metrics: 'G/90 ≥ 0.40 · xG/90 ≥ 0.30 · Duell% ≥ 48', bench: 'P. Christiansen' },
          { pos: 'Wing / Kant',  metrics: 'G/90 ≥ 0.30 · Dribble% ≥ 55 · ProgRuns ≥ 3.5', bench: 'E. Austbø' },
          { pos: 'CM / AMF',     metrics: 'Pass% ≥ 78 · Int/90 ≥ 3.0 · Duell% ≥ 46', bench: 'K. Askildsen' },
          { pos: 'CB',           metrics: 'Duell% ≥ 60 · Luft% ≥ 58 · Int/90 ≥ 4.0', bench: 'H. Falchener' },
          { pos: 'Back / WB',    metrics: 'Duell% ≥ 50 · Pass% ≥ 76 · ProgRuns ≥ 1.0', bench: 'K. Haugen' },
        ].map(p => (
          <div key={p.pos} style={{ padding: '8px 0', borderBottom: '1px solid #1a2332' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#f9fafb' }}>{p.pos}</span>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{p.metrics}</div>
              </div>
              <span style={{ fontSize: 11, color: '#4b5563', whiteSpace: 'nowrap' }}>vs {p.bench}</span>
            </div>
          </div>
        ))}
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[
            { v: 'STRONG BUY', rule: 'Alle terskler + risiko < 35 + liga ≥ 0.85' },
            { v: 'BUY',        rule: '≥ 2/3 terskler + risiko < 50' },
            { v: 'MONITOR',    rule: '≥ 1/3 terskler + risiko < 65' },
            { v: 'PASS',       rule: '< 1/3 terskler eller risiko ≥ 65' },
          ].map(r => (
            <div key={r.v} style={{ background: '#1a2332', borderRadius: 6, padding: '8px 12px',
              display: 'flex', flexDirection: 'column', gap: 4 }}>
              <VerdictBadge v={r.v} />
              <span style={{ fontSize: 11, color: '#6b7280' }}>{r.rule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Ligakoeffisienter */}
      <div style={SECTION_STYLE}>
        <H2>🌍 Liga-koeffisienter</H2>
        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 0, marginBottom: 12 }}>
          Skaleringskoeffisient mot Eliteserien. Brukes i confidence, risk og verdict.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 4 }}>
          {Object.entries(m?.league_coefficients ?? {
            'Norway. Eliteserien': 1.00, 'Sweden. Allsvenskan': 0.95,
            'Denmark. Superliga': 0.90, 'England. League One': 0.85,
            'Netherlands. Eredivisie': 1.05, 'Scotland. Premiership': 0.88,
            'Finland. Veikkausliiga': 0.78, 'United States. MLS': 0.65,
          }).map(([league, coeff]) => {
            const color = coeff >= 0.95 ? '#22c55e' : coeff >= 0.80 ? '#eab308' : '#ef4444'
            return (
              <div key={league} style={{ display: 'flex', justifyContent: 'space-between',
                padding: '5px 10px', background: '#1a2332', borderRadius: 4, fontSize: 12 }}>
                <span style={{ color: '#9ca3af' }}>{league.split('. ')[1] ?? league}</span>
                <span style={{ fontWeight: 700, color }}>{coeff.toFixed(2)}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 7. Versjonslogg */}
      {m?.changelog && (
        <div style={SECTION_STYLE}>
          <H2>📝 Versjonslogg</H2>
          {m.changelog.map(entry => (
            <div key={entry.version} style={{ padding: '8px 0', borderBottom: '1px solid #1a2332' }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#22c55e' }}>v{entry.version}</span>
                <span style={{ fontSize: 12, color: '#6b7280' }}>{entry.date}</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {entry.changes.map(c => (
                  <li key={c} style={{ fontSize: 12, color: '#9ca3af' }}>{c}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 11, color: '#374151' }}>
        Ask Christiansen Scouting Portefølje · Metodedokumentasjon v{m?.version ?? '2.0.0'}
      </div>
    </div>
  )
}
