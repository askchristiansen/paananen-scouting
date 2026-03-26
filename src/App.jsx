import { useState, useMemo } from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { usePlayersData, posGroupLabels, benchmarks, posMetrics, compareVsBenchmark } from './playerData'
import PlayerDashboard from './PlayerDashboard'

const CBLUE  = '#185FA5'
const CGREEN = '#3B6D11'
const CRED   = '#C0392B'
const CAMBER = '#B07517'
const CGRAY  = '#888'

const VERDICT_ORDER = { 'STRONG BUY': 0, 'BUY': 1, 'MONITOR': 2, 'PASS': 3 }

const VERDICT_STYLE = {
  'STRONG BUY': { color: CGREEN,  bg: '#edf5e9' },
  'BUY':        { color: CGREEN,  bg: '#edf5e9' },
  'MONITOR':    { color: CAMBER,  bg: '#fdf6e3' },
  'PASS':       { color: CRED,    bg: '#fdecea' },
}

function getVerdictStyle(v) {
  return VERDICT_STYLE[v] ?? { color: CGRAY, bg: '#f0f0ee' }
}

function computeVerdict(player) {
  if (player.verdict) return player.verdict
  const key = player.posGroup
  if (!key || !benchmarks[key]) return null
  const bench = benchmarks[key]
  const metrics = posMetrics[key]?.risiko ?? []
  let better = 0, weaker = 0
  metrics.forEach(k => {
    const r = compareVsBenchmark(player.stats[k] ?? 0, bench.stats[k] ?? 0)
    if (r === 'better') better++
    if (r === 'weaker') weaker++
  })
  const ageBonus = player.age && player.age <= 22 ? 1 : 0
  const effectiveBetter = better + ageBonus
  if (effectiveBetter >= 3) return 'BUY'
  if (weaker >= 3) return 'PASS'
  return 'MONITOR'
}

// ── PLAYER CARD ───────────────────────────────────────────────────────────────
function PlayerCard({ player, onClick }) {
  const verdict = computeVerdict(player)
  const vs = getVerdictStyle(verdict)
  const bench = benchmarks[player.posGroup]
  const metrics = posMetrics[player.posGroup]

  const topStats = metrics?.table?.slice(0,3) ?? []
  const isPct = k => ['passAcc','duelWin','aerialWin','longPassAcc','dribbleSucc'].includes(k)

  return (
    <div onClick={onClick} style={{
      background: '#fff', border: '1px solid #e8e8e6', borderRadius: 10,
      padding: '16px', cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.15s',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>
            {player.flag ?? ''} {player.name}
          </div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
            {player.club} · {posGroupLabels[player.posGroup] ?? player.posGroup}
          </div>
        </div>
        {verdict && (
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
            padding: '3px 8px', borderRadius: 3,
            color: vs.color, background: vs.bg,
            border: `1px solid ${vs.color}22`,
            whiteSpace: 'nowrap',
          }}>{verdict}</span>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        {topStats.map(k => {
          const pv = player.stats?.[k] ?? 0
          const bv = bench?.stats?.[k] ?? 0
          const r = compareVsBenchmark(pv, bv)
          const color = r === 'better' ? CGREEN : r === 'weaker' ? CRED : CGRAY
          const label = metrics?.labels?.[k] ?? k
          return (
            <div key={k} style={{ background: '#f8f8f6', borderRadius: 6, padding: '7px 8px' }}>
              <div style={{ fontSize: 10, color: '#aaa', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color }}>{isPct(k) ? pv.toFixed(0)+'%' : pv.toFixed(2)}</div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTop: '1px solid #f0f0ee' }}>
        <span style={{ fontSize: 11, color: '#aaa' }}>
          {player.league} · {player.age ? player.age + ' år' : ''}
        </span>
        <span style={{ fontSize: 11, color: CBLUE, fontWeight: 500 }}>
          {player.marketValue ?? ''}
        </span>
      </div>
    </div>
  )
}

// ── SCATTER TOOLTIP ───────────────────────────────────────────────────────────
function ScatterTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const vs = getVerdictStyle(computeVerdict(d))
  return (
    <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: '10px 14px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.flag} {d.name}</div>
      <div style={{ color: '#888', marginBottom: 6 }}>{d.club}</div>
      <div>Mål/90: <b>{d.x?.toFixed(2)}</b> · xG/90: <b>{d.y?.toFixed(2)}</b></div>
      {computeVerdict(d) && <div style={{ marginTop: 6, fontWeight: 700, color: vs.color }}>{computeVerdict(d)}</div>}
    </div>
  )
}

// ── BENCHMARK MODAL ───────────────────────────────────────────────────────────
function BenchmarkModal({ onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, maxWidth: 560, width: '100%', maxHeight: '80vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Benchmarks — Viking FK-kadere</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#888' }}>×</button>
        </div>
        {Object.entries(benchmarks).map(([key, bench]) => {
          const metrics = posMetrics[key]
          return (
            <div key={key} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #f0f0ee' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 10 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{bench.fullName}</span>
                <span style={{ fontSize: 12, color: '#888' }}>{posGroupLabels[key]} · {bench.position}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {metrics?.table?.map(k => {
                  const isPct = ['passAcc','duelWin','aerialWin','longPassAcc','dribbleSucc'].includes(k)
                  return (
                    <div key={k} style={{ background: '#f8f8f6', borderRadius: 6, padding: '7px 10px' }}>
                      <div style={{ fontSize: 10, color: '#aaa', marginBottom: 2 }}>{metrics.labels?.[k] ?? k}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
                        {isPct ? bench.stats[k].toFixed(1)+'%' : bench.stats[k].toFixed(2)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const { players, loading } = usePlayersData()
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [filterPos, setFilterPos]   = useState('ALL')
  const [filterVerdict, setFilterVerdict] = useState('ALL')
  const [viewMode, setViewMode]     = useState('cards')  // 'cards' | 'table' | 'scatter'
  const [showBenchmark, setShowBenchmark] = useState(false)
  const [search, setSearch] = useState('')

  const playersWithVerdict = useMemo(() =>
    players.map(p => ({ ...p, _verdict: computeVerdict(p) })), [players])

  const filtered = useMemo(() => {
    let list = playersWithVerdict
    if (filterPos !== 'ALL') list = list.filter(p => p.posGroup === filterPos)
    if (filterVerdict !== 'ALL') list = list.filter(p => p._verdict === filterVerdict)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.fullName?.toLowerCase().includes(q) ||
        p.club?.toLowerCase().includes(q) ||
        p.nationality?.toLowerCase().includes(q)
      )
    }
    return [...list].sort((a, b) =>
      (VERDICT_ORDER[a._verdict] ?? 4) - (VERDICT_ORDER[b._verdict] ?? 4)
    )
  }, [playersWithVerdict, filterPos, filterVerdict, search])

  if (selectedPlayer) {
    return (
      <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: 860, margin: '0 auto', padding: '20px 16px' }}>
        <button onClick={() => setSelectedPlayer(null)} style={{
          background: 'none', border: '1px solid #ddd', borderRadius: 8, padding: '8px 16px',
          fontSize: 13, cursor: 'pointer', color: '#555', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>← Tilbake til oversikt</button>
        <PlayerDashboard player={selectedPlayer} />
      </div>
    )
  }

  // Scatter data
  const scatterData = filtered.map(p => ({
    ...p,
    x: p.stats?.goals ?? 0,
    y: p.stats?.xG ?? 0,
  }))

  const verdictCounts = useMemo(() => {
    const counts = {}
    playersWithVerdict.forEach(p => {
      const v = p._verdict ?? 'UNKNOWN'
      counts[v] = (counts[v] ?? 0) + 1
    })
    return counts
  }, [playersWithVerdict])

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: '#fafaf8', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8e8e6', padding: '0 16px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.01em' }}>
              Viking FK — Scouting Platform
            </div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
              {loading ? 'Laster...' : `${players.length} spillere · ${Object.keys(posGroupLabels).length} posisjonsgrupper`}
            </div>
          </div>
          <button onClick={() => setShowBenchmark(true)} style={{
            background: 'none', border: '1px solid #ddd', borderRadius: 8, padding: '8px 14px',
            fontSize: 12, cursor: 'pointer', color: '#555',
          }}>Benchmarks ↗</button>
        </div>

        {/* Verdict summary bar */}
        {!loading && (
          <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['STRONG BUY','BUY','MONITOR','PASS'].map(v => {
              const vs = getVerdictStyle(v)
              const c = verdictCounts[v] ?? 0
              return (
                <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: vs.bg, border: `1px solid ${vs.color}22` }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: vs.color, letterSpacing: '0.06em' }}>{v}</span>
                  <span style={{ fontSize: 11, color: vs.color, fontWeight: 600 }}>{c}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 16px' }}>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
          {/* Search */}
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Søk spiller, klubb, nasjonalitet…"
            style={{ flex: '1 1 200px', padding: '8px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, background: '#fff', outline: 'none' }} />

          {/* Pos filter */}
          <select value={filterPos} onChange={e => setFilterPos(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, background: '#fff', cursor: 'pointer' }}>
            <option value="ALL">Alle posisjoner</option>
            {Object.entries(posGroupLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>

          {/* Verdict filter */}
          <select value={filterVerdict} onChange={e => setFilterVerdict(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, background: '#fff', cursor: 'pointer' }}>
            <option value="ALL">Alle verdikter</option>
            {['STRONG BUY','BUY','MONITOR','PASS'].map(v => <option key={v} value={v}>{v}</option>)}
          </select>

          {/* View mode */}
          <div style={{ display: 'flex', border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
            {[['cards','▦ Kort'],['table','≡ Tabell'],['scatter','◎ Scatter']].map(([mode, label]) => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{
                padding: '8px 14px', border: 'none', fontSize: 12, cursor: 'pointer',
                background: viewMode === mode ? '#1a1a1a' : '#fff',
                color: viewMode === mode ? '#fff' : '#555',
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div style={{ fontSize: 12, color: '#aaa', marginBottom: 14 }}>
          {filtered.length} spiller{filtered.length !== 1 ? 'e' : ''} vist
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: '#888', fontSize: 14 }}>
            Laster spillerdata…
          </div>
        )}

        {/* CARD VIEW */}
        {!loading && viewMode === 'cards' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {filtered.map(p => (
              <PlayerCard key={p.id} player={p} onClick={() => setSelectedPlayer(p)} />
            ))}
          </div>
        )}

        {/* TABLE VIEW */}
        {!loading && viewMode === 'table' && (
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8e8e6', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8f8f6', borderBottom: '1px solid #e8e8e6' }}>
                    {['Spiller','Posisjon','Liga','Alder','Verdict','G/90','xG/90','Pass%','Duell%','Min'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#888', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => {
                    const vs = getVerdictStyle(p._verdict)
                    return (
                      <tr key={p.id} onClick={() => setSelectedPlayer(p)} style={{
                        borderBottom: '1px solid #f0f0ee', cursor: 'pointer',
                        background: i % 2 === 0 ? '#fff' : '#fafaf8',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0f4fb'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafaf8'}>
                        <td style={{ padding: '10px 14px', fontWeight: 500 }}>{p.flag} {p.name}</td>
                        <td style={{ padding: '10px 14px', color: '#888' }}>{posGroupLabels[p.posGroup] ?? p.posGroup}</td>
                        <td style={{ padding: '10px 14px', color: '#888', fontSize: 12 }}>{p.league}</td>
                        <td style={{ padding: '10px 14px', color: '#888' }}>{p.age ?? '—'}</td>
                        <td style={{ padding: '10px 14px' }}>
                          {p._verdict && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 3, color: vs.color, background: vs.bg }}>{p._verdict}</span>}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 500 }}>{p.stats?.goals?.toFixed(2) ?? '—'}</td>
                        <td style={{ padding: '10px 14px', color: '#888' }}>{p.stats?.xG?.toFixed(2) ?? '—'}</td>
                        <td style={{ padding: '10px 14px', color: '#888' }}>{p.stats?.passAcc?.toFixed(0) ?? '—'}%</td>
                        <td style={{ padding: '10px 14px', color: '#888' }}>{p.stats?.duelWin?.toFixed(0) ?? '—'}%</td>
                        <td style={{ padding: '10px 14px', color: '#888' }}>{p.stats?.minutes?.toLocaleString() ?? '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SCATTER VIEW */}
        {!loading && viewMode === 'scatter' && (
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8e8e6', padding: '20px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16, color: '#1a1a1a' }}>Mål/90 vs xG/90 — alle spillere</div>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" dataKey="x" name="Mål/90"   domain={[0,'auto']} tick={{ fontSize: 11 }} label={{ value:'Mål/90', position:'insideBottom', offset:-5, fontSize:11, fill:'#888' }} />
                <YAxis type="number" dataKey="y" name="xG/90"    domain={[0,'auto']} tick={{ fontSize: 11 }} label={{ value:'xG/90', angle:-90, position:'insideLeft', fontSize:11, fill:'#888' }} />
                <Tooltip content={<ScatterTooltip />} />
                <Scatter data={scatterData} onClick={p => setSelectedPlayer(p)}>
                  {scatterData.map((p, i) => {
                    const vs = getVerdictStyle(p._verdict)
                    return <Cell key={i} fill={vs.color} fillOpacity={0.75} cursor="pointer" />
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
              {['STRONG BUY','BUY','MONITOR','PASS'].map(v => {
                const vs = getVerdictStyle(v)
                return (
                  <span key={v} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#666' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: vs.color, display: 'inline-block' }} />
                    {v}
                  </span>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {showBenchmark && <BenchmarkModal onClose={() => setShowBenchmark(false)} />}
    </div>
  )
}
