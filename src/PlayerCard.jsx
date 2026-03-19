import { useState } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  Tooltip as RechartsTooltip
} from "recharts";
import {
  benchmarks, getBenchmarkKey, compareVsBenchmark, statConfig, radarStats
} from "./playerData";

// ── Colour helpers ────────────────────────────────────────────────────────────
const ratingColor = {
  better:  { bg: "#166534", text: "#bbf7d0", dot: "#22c55e" },
  similar: { bg: "#713f12", text: "#fef08a", dot: "#eab308" },
  weaker:  { bg: "#7f1d1d", text: "#fecaca", dot: "#ef4444" },
};
const ratingLabel = { better: "Bedre", similar: "På nivå", weaker: "Svakere" };

function RatingBadge({ rating }) {
  if (!rating) return null;
  const c = ratingColor[rating];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: c.bg, color: c.text,
      padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 700,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.dot }} />
      {ratingLabel[rating]}
    </span>
  );
}

// ── Stat row ──────────────────────────────────────────────────────────────────
function StatRow({ label, unit, playerVal, benchVal, statKey }) {
  const rating = compareVsBenchmark(playerVal ?? 0, benchVal ?? 0, statKey);
  const c = ratingColor[rating];
  const maxVal = Math.max(playerVal ?? 0, benchVal ?? 0, 0.01);

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#9ca3af", marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ color: c.text, fontWeight: 600 }}>
          {(playerVal ?? 0).toFixed(unit === "%" ? 1 : 2)}{unit}
          <span style={{ color: "#6b7280", fontWeight: 400 }}>
            {" "}/ {(benchVal ?? 0).toFixed(unit === "%" ? 1 : 2)}{unit}
          </span>
        </span>
      </div>
      <div style={{ display: "flex", gap: 4, height: 5 }}>
        {/* Player bar */}
        <div style={{ flex: 1, background: "#1f2937", borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 3,
            background: c.dot,
            width: `${Math.min(100, ((playerVal ?? 0) / maxVal) * 100)}%`,
            transition: "width 0.4s ease",
          }} />
        </div>
        {/* Benchmark bar */}
        <div style={{ flex: 1, background: "#1f2937", borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 3,
            background: "#6b7280",
            width: `${Math.min(100, ((benchVal ?? 0) / maxVal) * 100)}%`,
          }} />
        </div>
      </div>
    </div>
  );
}

// ── Radar ─────────────────────────────────────────────────────────────────────
function BenchmarkRadar({ player, bench, posKey }) {
  const axes = radarStats[posKey] ?? radarStats.CB;
  const cfg = Object.fromEntries(statConfig.map((s) => [s.key, s]));

  // Normalise to 0–100 relative to the max of the two values per axis
  const data = axes.map((key) => {
    const pv = player.stats[key] ?? 0;
    const bv = bench.stats[key] ?? 0;
    const mx = Math.max(pv, bv, 0.01);
    return {
      axis: cfg[key]?.label ?? key,
      player: Math.round((pv / mx) * 100),
      bench: Math.round((bv / mx) * 100),
      rawP: pv,
      rawB: bv,
      unit: cfg[key]?.unit ?? "",
    };
  });

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = data.find((x) => x.axis === payload[0]?.payload?.axis);
    if (!d) return null;
    return (
      <div style={{ background: "#111827", border: "1px solid #374151", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
        <div style={{ color: "#f3f4f6", fontWeight: 700, marginBottom: 4 }}>{d.axis}</div>
        <div style={{ color: "#22c55e" }}>{player.name}: {d.rawP.toFixed(2)}{d.unit}</div>
        <div style={{ color: "#9ca3af" }}>{bench.name}: {d.rawB.toFixed(2)}{d.unit}</div>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid stroke="#1f2937" />
        <PolarAngleAxis dataKey="axis" tick={{ fill: "#9ca3af", fontSize: 11 }} />
        <Radar name={player.name} dataKey="player" stroke="#22c55e" fill="#22c55e" fillOpacity={0.25} strokeWidth={2} />
        <Radar name={bench.name} dataKey="bench" stroke="#6b7280" fill="#6b7280" fillOpacity={0.15} strokeWidth={1.5} strokeDasharray="4 2" />
        <RechartsTooltip content={<CustomTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ── Main PlayerCard ───────────────────────────────────────────────────────────
export default function PlayerCard({ player, onClose }) {
  const [tab, setTab] = useState("overview"); // "overview" | "stats" | "radar"

  const benchKey = getBenchmarkKey(player.position);
  const bench = benchKey ? benchmarks[benchKey] : null;

  // Determine which stat groups to show
  const posStats = {
    CB:   ["passAcc", "longPassAcc", "duelWin", "aerialWin", "interceptions", "recoveriesOpp", "progRuns"],
    CF:   ["goals", "assists", "xG", "shots", "touchesPenArea", "duelWin", "aerialWin", "progRuns"],
    WING: ["goals", "assists", "xG", "dribbleSucc", "dribbles", "progRuns", "shotAssists", "passAcc"],
    CM:   ["goals", "assists", "passAcc", "longPassAcc", "interceptions", "duelWin", "recoveriesOpp", "progRuns", "shotAssists"],
  };
  const relevantStats = posStats[benchKey] ?? statConfig.map((s) => s.key);
  const cfgMap = Object.fromEntries(statConfig.map((s) => [s.key, s]));

  const tabs = [
    { id: "overview", label: "Oversikt" },
    { id: "stats",    label: "Statistikk" },
    ...(bench ? [{ id: "radar", label: "Radar" }] : []),
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: "#111827", border: "1px solid #1f2937",
        borderRadius: 16, width: "100%", maxWidth: 680,
        maxHeight: "90vh", overflow: "auto",
        boxShadow: "0 25px 50px rgba(0,0,0,0.6)",
      }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          padding: "24px 24px 0", display: "flex",
          justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 28 }}>{player.flag ?? "🏳️"}</span>
              <h2 style={{ margin: 0, fontSize: 22, color: "#f9fafb", fontWeight: 800 }}>
                {player.fullName ?? player.name}
              </h2>
              {player.isBenchmark && (
                <span style={{ background: "#1d4ed8", color: "#bfdbfe", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99 }}>
                  VIKING FK
                </span>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <span style={{ color: "#6b7280", fontSize: 13 }}>
                {player.position} · {player.club} · {player.league}
              </span>
              {bench && <RatingBadge rating={(() => {
                const keyStats = ["goals","assists","passAcc","duelWin","interceptions","progRuns"];
                let b=0,w=0;
                keyStats.forEach(s=>{const r=compareVsBenchmark(player.stats[s]??0,bench.stats[s]??0,s);if(r==="better")b++;if(r==="weaker")w++;});
                return b>=4?"better":w>=4?"weaker":"similar";
              })()} />}
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 16, fontSize: 12, color: "#9ca3af" }}>
              <span>⏱ {player.stats.minutes?.toLocaleString() ?? "—"} min</span>
              <span>📋 {player.stats.matches ?? "—"} kamper</span>
              {player.age && <span>🎂 {player.age} år</span>}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "#6b7280",
            fontSize: 22, cursor: "pointer", padding: 4,
          }}>✕</button>
        </div>

        {/* Benchmark context bar */}
        {bench && (
          <div style={{
            margin: "16px 24px 0",
            background: "#1f2937", borderRadius: 8, padding: "10px 14px",
            display: "flex", alignItems: "center", gap: 10, fontSize: 12,
          }}>
            <span style={{ color: "#6b7280" }}>Benchmark:</span>
            <span style={{ color: "#e5e7eb", fontWeight: 700 }}>{bench.fullName}</span>
            <span style={{ color: "#6b7280" }}>·</span>
            <span style={{ color: "#6b7280" }}>{bench.club} · {bench.position}</span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 12, fontSize: 11 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                {player.name}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#6b7280", display: "inline-block" }} />
                {bench.name}
              </span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, margin: "16px 24px 0", borderBottom: "1px solid #1f2937" }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "8px 16px", fontSize: 13, fontWeight: 600,
              color: tab === t.id ? "#22c55e" : "#6b7280",
              borderBottom: tab === t.id ? "2px solid #22c55e" : "2px solid transparent",
              marginBottom: -1,
            }}>{t.label}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: "20px 24px 24px" }}>

          {/* OVERVIEW TAB */}
          {tab === "overview" && (
            <div>
              {/* Key stat boxes */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
                {(benchKey === "CB"
                  ? [["passAcc","%"],["duelWin","%"],["aerialWin","%"],["interceptions","/90"],["progRuns","/90"],["recoveriesOpp","/90"]]
                  : benchKey === "CF"
                  ? [["goals","/90"],["assists","/90"],["xG","/90"],["shots","/90"],["touchesPenArea","/90"],["duelWin","%"]]
                  : benchKey === "WING"
                  ? [["goals","/90"],["assists","/90"],["dribbleSucc","%"],["progRuns","/90"],["shotAssists","/90"],["passAcc","%"]]
                  : [["passAcc","%"],["interceptions","/90"],["duelWin","%"],["progRuns","/90"],["shotAssists","/90"],["recoveriesOpp","/90"]]
                ).map(([key, unit]) => {
                  const pv = player.stats[key] ?? 0;
                  const bv = bench?.stats[key] ?? 0;
                  const rating = bench ? compareVsBenchmark(pv, bv, key) : "similar";
                  const c = ratingColor[rating];
                  const label = cfgMap[key]?.label ?? key;
                  return (
                    <div key={key} style={{
                      background: "#1f2937", borderRadius: 10, padding: "12px 14px",
                      borderLeft: `3px solid ${c.dot}`,
                    }}>
                      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#f9fafb" }}>
                        {pv.toFixed(unit === "%" ? 1 : 2)}
                        <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 400 }}>{unit}</span>
                      </div>
                      {bench && (
                        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                          Benchmark: {bv.toFixed(unit === "%" ? 1 : 2)}{unit}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Mini stat summary table */}
              {bench && (
                <div style={{ background: "#1a2332", borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
                    Vs. benchmark — {bench.name}
                  </div>
                  {relevantStats.map((key) => {
                    const cfg = cfgMap[key];
                    if (!cfg) return null;
                    return (
                      <StatRow
                        key={key}
                        label={cfg.label}
                        unit={cfg.unit}
                        playerVal={player.stats[key]}
                        benchVal={bench.stats[key]}
                        statKey={key}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STATS TAB */}
          {tab === "stats" && (
            <div>
              {bench && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div style={{ background: "#1f2937", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, color: "#22c55e", fontWeight: 700, marginBottom: 8 }}>{player.name}</div>
                    {statConfig.map(({ key, label, unit }) => (
                      <div key={key} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid #111827" }}>
                        <span style={{ color: "#9ca3af" }}>{label}</span>
                        <span style={{ color: "#f3f4f6", fontWeight: 600 }}>
                          {(player.stats[key] ?? 0).toFixed(unit === "%" ? 1 : 2)}{unit}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: "#1f2937", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 700, marginBottom: 8 }}>{bench.name} (benchmark)</div>
                    {statConfig.map(({ key, label, unit }) => (
                      <div key={key} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid #111827" }}>
                        <span style={{ color: "#9ca3af" }}>{label}</span>
                        <span style={{ color: "#9ca3af", fontWeight: 600 }}>
                          {(bench.stats[key] ?? 0).toFixed(unit === "%" ? 1 : 2)}{unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!bench && (
                <div style={{ background: "#1f2937", borderRadius: 10, padding: "14px 16px" }}>
                  {statConfig.map(({ key, label, unit }) => (
                    <div key={key} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid #111827" }}>
                      <span style={{ color: "#9ca3af" }}>{label}</span>
                      <span style={{ color: "#f3f4f6", fontWeight: 600 }}>
                        {(player.stats[key] ?? 0).toFixed(unit === "%" ? 1 : 2)}{unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* RADAR TAB */}
          {tab === "radar" && bench && (
            <div>
              <BenchmarkRadar player={player} bench={bench} posKey={benchKey} />
              <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 8, fontSize: 12 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#22c55e" }}>
                  <span style={{ width: 12, height: 2, background: "#22c55e", display: "inline-block" }} />
                  {player.name}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#6b7280" }}>
                  <span style={{ width: 12, height: 2, background: "#6b7280", display: "inline-block", opacity: 0.8 }} />
                  {bench.name} (benchmark)
                </span>
              </div>
              <p style={{ textAlign: "center", fontSize: 11, color: "#4b5563", marginTop: 8 }}>
                Verdiene er normalisert per akse — 100 = høyeste av de to
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
