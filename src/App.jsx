import { useState, useMemo } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { players, benchmarks, getBenchmarkKey, getOverallRating } from "./playerData";
import PlayerCard from "./PlayerCard";
import PaananenDashboard from "./PaananenDashboard";
import DiarraDashboard from "./DiarraDashboard";
import KilenDashboard from "./KilenDashboard";

// ── Helpers ────────────────────────────────────────────────────────────────
const ratingColors = {
  better:  "#22c55e",
  similar: "#eab308",
  weaker:  "#ef4444",
};
const ratingLabels = {
  better:  "↑ Bedre",
  similar: "~ På nivå",
  weaker:  "↓ Svakere",
};

const posGroups = {
  Alle: null,
  "CF / Spiss": ["CF"],
  "Wing / AMF": ["LW","RW","LWF","RWF","LAMF","RAMF","AMF"],
  "CM / DMF": ["CM","CMF","LCMF","RCMF","DMF","LDMF","RDMF"],
  "CB / Forsvar": ["CB","LCB","RCB","LB","RB"],
};

function matchesGroup(player, groupKey) {
  if (groupKey === "Alle") return true;
  const keywords = posGroups[groupKey];
  if (!keywords) return true;
  const pos = (player.position ?? "").toUpperCase();
  return keywords.some((k) => pos.includes(k));
}

const benchmarkLine = {
  CF:   { x: "goals",        y: "xG"           },
  WING: { x: "progRuns",     y: "goals"         },
  CM:   { x: "passAcc",      y: "interceptions" },
  CB:   { x: "passAcc",      y: "duelWin"       },
};

// ── Scatter axes per group ─────────────────────────────────────────────────
const scatterAxes = {
  "CF / Spiss":   { x: "goals",        y: "xG",            xLabel: "Goals /90",     yLabel: "xG /90"            },
  "Wing / AMF":   { x: "progRuns",     y: "goals",         xLabel: "Prog. runs /90", yLabel: "Goals /90"         },
  "CM / DMF":     { x: "passAcc",      y: "interceptions", xLabel: "Pass acc. %",   yLabel: "Interceptions /90" },
  "CB / Forsvar": { x: "passAcc",      y: "duelWin",       xLabel: "Pass acc. %",   yLabel: "Duel win %"        },
  "Alle":         { x: "passAcc",      y: "duelWin",       xLabel: "Pass acc. %",   yLabel: "Duel win %"        },
};

// ── Custom scatter dot ──────────────────────────────────────────────────────
function CustomDot(props) {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;
  const rating = getOverallRating(payload);
  const color = rating ? ratingColors[rating] : "#6b7280";
  return (
    <g>
      <circle cx={cx} cy={cy} r={payload.isBenchmark ? 9 : 7}
        fill={color} fillOpacity={0.85} stroke="#111827" strokeWidth={2} />
      {payload.isBenchmark && (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
          fontSize={8} fill="#111827" fontWeight="bold">V</text>
      )}
    </g>
  );
}

// ── Custom tooltip ──────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, axisX, axisY }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const rating = getOverallRating(d);
  return (
    <div style={{
      background: "#111827", border: "1px solid #374151",
      borderRadius: 10, padding: "10px 14px", fontSize: 12, minWidth: 180,
    }}>
      <div style={{ fontWeight: 800, color: "#f9fafb", marginBottom: 4 }}>{d.fullName ?? d.name}</div>
      <div style={{ color: "#9ca3af", marginBottom: 6 }}>{d.club} · {d.position}</div>
      <div style={{ color: "#e5e7eb" }}>{axisX}: <b>{(d.stats[axisX === "Pass acc. %" ? "passAcc" : axisX] ?? 0).toFixed(2)}</b></div>
      <div style={{ color: "#e5e7eb" }}>{axisY}: <b>{(d.stats[axisY === "Duel win %" ? "duelWin" : axisY] ?? 0).toFixed(2)}</b></div>
      {rating && (
        <div style={{ marginTop: 6, color: ratingColors[rating], fontWeight: 700 }}>
          {ratingLabels[rating]}
        </div>
      )}
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [activeGroup, setActiveGroup] = useState("Alle");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState(1);
  const [showDashboard, setShowDashboard] = useState(null);

  // Open dashboard or generic card
  function openPlayer(player) {
    if (player.hasDetailedDashboard) {
      setShowDashboard(player.id);
    } else {
      setSelectedPlayer(player);
    }
  }

  const axes = scatterAxes[activeGroup] ?? scatterAxes["Alle"];

  const filtered = useMemo(() => {
    return players.filter((p) => {
      const matchGroup = matchesGroup(p, activeGroup);
      const matchSearch = !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.club?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchGroup && matchSearch;
    });
  }, [activeGroup, searchQuery]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av = sortKey === "name" ? a.name : (a.stats[sortKey] ?? 0);
      let bv = sortKey === "name" ? b.name : (b.stats[sortKey] ?? 0);
      if (typeof av === "string") return sortDir * av.localeCompare(bv);
      return sortDir * (av - bv);
    });
  }, [filtered, sortKey, sortDir]);

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => -d);
    else { setSortKey(key); setSortDir(-1); }
  }

  const scatterData = filtered.map((p) => ({
    ...p,
    x: p.stats[Object.keys(benchmarkLine)[0]] ?? 0, // overridden below
  }));

  // Scatter uses named keys from axes
  const axisKeyX = {
    "Goals /90": "goals", "Prog. runs /90": "progRuns",
    "Pass acc. %": "passAcc",
  }[axes.xLabel] ?? "passAcc";
  const axisKeyY = {
    "xG /90": "xG", "Goals /90": "goals",
    "Interceptions /90": "interceptions", "Duel win %": "duelWin",
  }[axes.yLabel] ?? "duelWin";

  // Benchmark reference lines for scatter
  const benchKey = getBenchmarkKey(
    activeGroup === "CF / Spiss" ? "CF" :
    activeGroup === "Wing / AMF" ? "LW" :
    activeGroup === "CM / DMF"   ? "CM" :
    activeGroup === "CB / Forsvar"? "CB" : null
  );
  const activeBench = benchKey ? benchmarks[benchKey] : null;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1a", color: "#f9fafb", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #1f2937", padding: "20px 32px", display: "flex", alignItems: "center", gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>
            ⚡ Viking FK — Scouting Platform
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
            {players.length} spillere · Benchmark vs. Viking FK-kader
          </p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {Object.keys(ratingColors).map((r) => (
            <span key={r} style={{
              display: "flex", alignItems: "center", gap: 5, fontSize: 12,
              color: ratingColors[r],
            }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: ratingColors[r] }} />
              {ratingLabels[r]}
            </span>
          ))}
        </div>
      </div>

      <div style={{ padding: "24px 32px" }}>
        {/* Filters */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20, alignItems: "center" }}>
          {Object.keys(posGroups).map((g) => (
            <button key={g} onClick={() => setActiveGroup(g)} style={{
              background: activeGroup === g ? "#1d4ed8" : "#1f2937",
              color: activeGroup === g ? "#fff" : "#9ca3af",
              border: "none", borderRadius: 8, padding: "6px 14px",
              fontSize: 13, cursor: "pointer", fontWeight: activeGroup === g ? 700 : 400,
            }}>{g}</button>
          ))}
          <input
            placeholder="🔍 Søk spiller / klubb..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              marginLeft: "auto", background: "#1f2937", border: "1px solid #374151",
              borderRadius: 8, padding: "6px 14px", color: "#f9fafb", fontSize: 13,
              outline: "none", minWidth: 200,
            }}
          />
        </div>

        {/* Scatter plot */}
        <div style={{ background: "#111827", borderRadius: 14, padding: "20px 20px 10px", marginBottom: 24, border: "1px solid #1f2937" }}>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12, fontWeight: 600 }}>
            {axes.xLabel} vs {axes.yLabel}
            {activeBench && <span style={{ color: "#4b5563", fontWeight: 400 }}> · Stiplede linjer = benchmark ({activeBench.name})</span>}
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                type="number" dataKey={(d) => d.stats[axisKeyX] ?? 0}
                name={axes.xLabel} tick={{ fill: "#6b7280", fontSize: 11 }}
                label={{ value: axes.xLabel, position: "insideBottom", offset: -10, fill: "#4b5563", fontSize: 11 }}
              />
              <YAxis
                type="number" dataKey={(d) => d.stats[axisKeyY] ?? 0}
                name={axes.yLabel} tick={{ fill: "#6b7280", fontSize: 11 }}
                label={{ value: axes.yLabel, angle: -90, position: "insideLeft", fill: "#4b5563", fontSize: 11 }}
              />
              {activeBench && (
                <>
                  <ReferenceLine x={activeBench.stats[axisKeyX]} stroke="#374151" strokeDasharray="4 3" strokeWidth={1.5} />
                  <ReferenceLine y={activeBench.stats[axisKeyY]} stroke="#374151" strokeDasharray="4 3" strokeWidth={1.5} />
                </>
              )}
              <Tooltip content={<CustomTooltip axisX={axes.xLabel} axisY={axes.yLabel} />} />
              <Scatter
                data={filtered}
                shape={<CustomDot />}
                onClick={(d) => openPlayer(d)}
                style={{ cursor: "pointer" }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Player table */}
        <div style={{ background: "#111827", borderRadius: 14, border: "1px solid #1f2937", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #1f2937", fontSize: 13, color: "#6b7280" }}>
            {sorted.length} spillere vist
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1f2937" }}>
                  {[
                    { label: "Spiller",       key: "name"          },
                    { label: "Klubb",          key: null            },
                    { label: "Pos",            key: null            },
                    { label: "Min",            key: "minutes"       },
                    { label: "G/90",           key: "goals"         },
                    { label: "A/90",           key: "assists"       },
                    { label: "xG/90",          key: "xG"           },
                    { label: "Pass%",          key: "passAcc"       },
                    { label: "Duell%",         key: "duelWin"       },
                    { label: "Luft%",          key: "aerialWin"     },
                    { label: "Int/90",         key: "interceptions" },
                    { label: "Prog/90",        key: "progRuns"      },
                    { label: "Vs. Viking",     key: null            },
                  ].map(({ label, key }) => (
                    <th key={label} onClick={() => key && toggleSort(key)} style={{
                      padding: "10px 14px", textAlign: "left", color: "#6b7280",
                      fontWeight: 600, cursor: key ? "pointer" : "default",
                      userSelect: "none", whiteSpace: "nowrap",
                      background: sortKey === key ? "#1a2332" : "transparent",
                    }}>
                      {label}{sortKey === key ? (sortDir === 1 ? " ↑" : " ↓") : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((player) => {
                  const rating = getOverallRating(player);
                  return (
                    <tr key={player.id}
                      onClick={() => openPlayer(player)}
                      style={{
                        borderBottom: "1px solid #1a2332",
                        cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#1a2332"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "11px 14px", whiteSpace: "nowrap" }}>
                        <span style={{ marginRight: 6 }}>{player.flag ?? ""}</span>
                        <span style={{ fontWeight: 700, color: "#f9fafb" }}>{player.fullName ?? player.name}</span>
                        {player.hasDetailedDashboard && (
                          <span style={{ marginLeft: 6, fontSize: 10, background: "#1d4ed8", color: "#bfdbfe", padding: "1px 6px", borderRadius: 99 }}>DASH</span>
                        )}
                        {player.isBenchmark && (
                          <span style={{ marginLeft: 6, fontSize: 10, background: "#7c3aed", color: "#ddd6fe", padding: "1px 6px", borderRadius: 99 }}>VFK</span>
                        )}
                      </td>
                      <td style={{ padding: "11px 14px", color: "#9ca3af" }}>{player.club}</td>
                      <td style={{ padding: "11px 14px", color: "#9ca3af" }}>{player.position}</td>
                      <td style={{ padding: "11px 14px", color: "#9ca3af" }}>{player.stats.minutes?.toLocaleString() ?? "—"}</td>
                      {["goals","assists","xG","passAcc","duelWin","aerialWin","interceptions","progRuns"].map((key) => {
                        const benchKeyP = getBenchmarkKey(player.position);
                        const bench = benchKeyP ? benchmarks[benchKeyP] : null;
                        const pv = player.stats[key] ?? 0;
                        const bv = bench?.stats[key] ?? null;
                        const isPercent = ["passAcc","duelWin","aerialWin"].includes(key);
                        let cellColor = "#e5e7eb";
                        if (bv !== null) {
                          const r = benchmarks[benchKeyP] ? (() => {
                            const threshold = 0.12;
                            if (bv === 0) return pv > 0 ? "better" : "similar";
                            const ratio = (pv - bv) / bv;
                            if (ratio > threshold) return "better";
                            if (ratio < -threshold) return "weaker";
                            return "similar";
                          })() : "similar";
                          cellColor = ratingColors[r];
                        }
                        return (
                          <td key={key} style={{ padding: "11px 14px", color: cellColor, fontWeight: 600 }}>
                            {pv.toFixed(isPercent ? 1 : 2)}{isPercent ? "%" : ""}
                          </td>
                        );
                      })}
                      <td style={{ padding: "11px 14px" }}>
                        {rating ? (
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            color: ratingColors[rating], fontSize: 12, fontWeight: 700,
                          }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: ratingColors[rating] }} />
                            {ratingLabels[rating]}
                          </span>
                        ) : <span style={{ color: "#4b5563" }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Benchmark cards */}
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 12, color: "#4b5563", marginBottom: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
            Viking FK — Benchmarks
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {Object.entries(benchmarks).map(([key, b]) => (
              <div key={key} style={{
                background: "#111827", border: "1px solid #1f2937", borderRadius: 10,
                padding: "12px 16px", minWidth: 180,
              }}>
                <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>{key}</div>
                <div style={{ fontWeight: 800, color: "#f9fafb", marginBottom: 2 }}>{b.fullName}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{b.position}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Generic player card modal */}
      {selectedPlayer && (
        <PlayerCard player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      )}

      {/* Detailed dashboards */}
      {showDashboard === "paananen" && <div style={{ position: "fixed", inset: 0, background: "#0a0f1a", overflowY: "auto", zIndex: 1000 }}>
        <button onClick={() => setShowDashboard(null)} style={{ position: "fixed", top: 16, left: 16, background: "#1f2937", border: "none", color: "#f9fafb", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, zIndex: 1001 }}>← Tilbake</button>
        <PaananenDashboard />
      </div>}
      {showDashboard === "diarra" && <div style={{ position: "fixed", inset: 0, background: "#0a0f1a", overflowY: "auto", zIndex: 1000 }}>
        <button onClick={() => setShowDashboard(null)} style={{ position: "fixed", top: 16, left: 16, background: "#1f2937", border: "none", color: "#f9fafb", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, zIndex: 1001 }}>← Tilbake</button>
        <DiarraDashboard />
      </div>}
      {showDashboard === "kilen" && <div style={{ position: "fixed", inset: 0, background: "#0a0f1a", overflowY: "auto", zIndex: 1000 }}>
        <button onClick={() => setShowDashboard(null)} style={{ position: "fixed", top: 16, left: 16, background: "#1f2937", border: "none", color: "#f9fafb", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, zIndex: 1001 }}>← Tilbake</button>
        <KilenDashboard />
      </div>}
    </div>
  );
}
