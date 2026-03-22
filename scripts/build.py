#!/usr/bin/env python3
"""
Viking FK Scouting Platform v2 — Build Pipeline
================================================
Leser rådata fra raw/ og produserer data/players.json

Kjøring:
    python scripts/build.py

Krav:
    pip install pandas openpyxl

Struktur:
    raw/wyscout/<player_id>/          — xlsx-filer (4 stk per spiller)
    raw/transfermarkt/<player_id>.json — markedsdata
    data/players.json                  — output (single source of truth)
    data/methodology.json              — vekter og terskler (kopiert hit)
"""

import os
import json
import glob
import hashlib
import pandas as pd
from datetime import datetime, date
from pathlib import Path

# ── Konfigurasjon ──────────────────────────────────────────────────────────────

PIPELINE_VERSION = "1.0.0"
MIN_MINUTES_PER_MATCH = 20
RAW_DIR  = Path("raw")
DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)

LEAGUE_COEFFICIENTS = {
    "Norway. Eliteserien": 1.00,
    "Norway. 1. divisjon": 0.82,
    "Sweden. Allsvenskan": 0.95,
    "Sweden. Superettan": 0.80,
    "Denmark. Superliga": 0.90,
    "Denmark. 1st Division": 0.80,
    "England. League One": 0.85,
    "Scotland. Premiership": 0.88,
    "Finland. Veikkausliiga": 0.78,
    "Netherlands. Eredivisie": 1.05,
    "Netherlands. Eerste Divisie": 0.82,
    "Bulgaria. First League": 0.72,
    "Hungary. NB I": 0.70,
    "Lithuania. A Lyga": 0.68,
    "Slovenia. Prva Liga": 0.75,
    "Croatia. SuperSport HNL": 0.77,
    "United States. MLS": 0.65,
    "Australia. A-League": 0.65,
}

COMPETITION_TYPES = {
    "cup": ["cup", "pokal", "nm-cup", "coupe", "copa", "fa cup", "league cup"],
    "european": ["champions league", "europa league", "conference league", "ucl", "uel", "uecl"],
    "friendly": ["friendly", "treningskamp"],
}


# ── Hjelpefunksjoner ──────────────────────────────────────────────────────────

def competition_type(name: str) -> str:
    n = name.lower()
    for ctype, keywords in COMPETITION_TYPES.items():
        if any(k in n for k in keywords):
            return ctype
    return "league"

def safe_pct(numerator: float, denominator: float) -> float | None:
    if denominator and denominator > 0:
        return round((numerator / denominator) * 100, 1)
    return None

def p90(value: float, total_minutes: float) -> float | None:
    if total_minutes and total_minutes > 0:
        return round((value / total_minutes) * 90, 3)
    return None

def flag_from_nationality(nat: str) -> str:
    flags = {
        "Norway": "🇳🇴", "Sweden": "🇸🇪", "Denmark": "🇩🇰", "Finland": "🇫🇮",
        "Germany": "🇩🇪", "France": "🇫🇷", "Spain": "🇪🇸", "Italy": "🇮🇹",
        "Netherlands": "🇳🇱", "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
        "Ireland": "🇮🇪", "USA": "🇺🇸", "Australia": "🇦🇺",
        "Mali": "🇲🇱", "Senegal": "🇸🇳", "Ghana": "🇬🇭",
        "Nigeria": "🇳🇬", "Ivory Coast": "🇨🇮",
        "Bulgaria": "🇧🇬", "Lithuania": "🇱🇹",
        "Slovenia": "🇸🇮", "Croatia": "🇭🇷",
        "Bosnia": "🇧🇦", "New Zealand": "🇳🇿",
    }
    return flags.get(nat, "🏳️")


# ── Wyscout Ingest ────────────────────────────────────────────────────────────

def ingest_wyscout(player_dir: Path) -> dict | None:
    """
    Les de 4 Wyscout-xlsx-filene for én spiller.
    Støtter Wyscout-eksportnavnene direkte:
      Player_stats_<n>.xlsx      → general
      Player_stats_<n>__1_.xlsx  → defensive
      Player_stats_<n>__2_.xlsx  → offensive
      Player_stats_<n>__3_.xlsx  → passing
    (Alfabetisk sortering gir riktig rekkefølge.)
    """
    # Sorter slik at basisfilen (uten tallsuffix) kommer foerst,
    # deretter (1), (2), (3) i rekkefølge.
    import re as _re
    def _sort_key(f):
        name = os.path.basename(f)
        if "(" not in name:
            return (0, name)
        m = _re.search(r"\((\d+)\)", name)
        return (int(m.group(1)) if m else 99, name)
    files = sorted(glob.glob(str(player_dir / "*.xlsx")), key=_sort_key)
    if len(files) < 4:
        print(f"  ADVARSEL: Forventet 4 xlsx-filer, fant {len(files)} i {player_dir}")
        return None

    try:
        df_gen  = pd.read_excel(files[0])  # general
        df_def  = pd.read_excel(files[1])  # defensive
        df_off  = pd.read_excel(files[2])  # offensive
        df_pass = pd.read_excel(files[3])  # passing
    except Exception as e:
        print(f"  FEIL ved lesing av {player_dir}: {e}")
        return None

    def get_pair_success(df: pd.DataFrame, col_name: str) -> pd.Series:
        """Henter Unnamed-kolonnen rett etter col_name (= antall vunnet/vellykkede)."""
        if col_name not in df.columns:
            return pd.Series([0] * len(df))
        idx = df.columns.get_loc(col_name)
        if idx + 1 < len(df.columns):
            return df.iloc[:, idx + 1].fillna(0)
        return pd.Series([0] * len(df))

    def col(df, name, default=0):
        return df[name].fillna(0) if name in df.columns else pd.Series([default] * len(df))

    for df in [df_gen, df_def, df_off, df_pass]:
        df.drop(df[df["Minutes played"] < MIN_MINUTES_PER_MATCH].index, inplace=True)
        df.reset_index(drop=True, inplace=True)

    if len(df_gen) == 0:
        print(f"  ADVARSEL: Ingen kamper med >= {MIN_MINUTES_PER_MATCH} min i {player_dir}")
        return None

    # ── Per-konkurranse aggregering ──────────────────────────────────────────
    by_competition = []
    for comp in df_gen["Competition"].unique():
        mask_gen  = df_gen["Competition"] == comp
        mask_off  = df_off["Competition"] == comp  if "Competition" in df_off.columns  else pd.Series([True] * len(df_off))
        mask_pass = df_pass["Competition"] == comp if "Competition" in df_pass.columns else pd.Series([True] * len(df_pass))

        sub      = df_gen[mask_gen]
        sub_off  = df_off[mask_off]
        sub_pass = df_pass[mask_pass]

        comp_min     = sub["Minutes played"].sum()
        comp_matches = len(sub)
        if comp_min == 0:
            continue

        p_total   = col(sub_pass, "Passes / accurate").sum()
        p_acc     = get_pair_success(sub_pass, "Passes / accurate").sum()
        d_total   = col(sub, "Duels / won").sum()
        d_won     = get_pair_success(sub, "Duels / won").sum()
        prog_runs = col(sub_off, "Progressive runs").sum()

        by_competition.append({
            "competition":           comp,
            "competition_type":      competition_type(comp),
            "matches":               int(comp_matches),
            "minutes":               int(comp_min),
            "goals_p90":             p90(col(sub, "Goals").sum(), comp_min),
            "assists_p90":           p90(col(sub, "Assists").sum(), comp_min),
            "xg_p90":                p90(col(sub, "xG").sum(), comp_min),
            "pass_accuracy_pct":     safe_pct(p_acc, p_total),
            "duel_win_pct":          safe_pct(d_won, d_total),
            "interceptions_p90":     p90(col(sub, "Interceptions").sum(), comp_min),
            "progressive_runs_p90":  p90(prog_runs, comp_min),
        })

    # ── Totalaggregering ─────────────────────────────────────────────────────
    total_min     = int(df_gen["Minutes played"].sum())
    total_matches = len(df_gen)

    goals    = col(df_gen, "Goals").sum()
    assists  = col(df_gen, "Assists").sum()
    xg       = col(df_gen, "xG").sum()
    shots    = col(df_gen, "Shots / on target").sum()
    shots_ot = get_pair_success(df_gen, "Shots / on target").sum()

    passes_total = col(df_pass, "Passes / accurate").sum()
    passes_acc   = get_pair_success(df_pass, "Passes / accurate").sum()
    long_total   = col(df_pass, "Long passes / accurate").sum()
    long_acc     = get_pair_success(df_pass, "Long passes / accurate").sum()

    duels_total  = col(df_gen, "Duels / won").sum()
    duels_won    = get_pair_success(df_gen, "Duels / won").sum()
    aerial_total = col(df_gen, "Aerial duels / won").sum()
    aerial_won   = get_pair_success(df_gen, "Aerial duels / won").sum()
    drib_total   = col(df_gen, "Dribbles / successful").sum()
    drib_succ    = get_pair_success(df_gen, "Dribbles / successful").sum()

    interceptions = col(df_gen, "Interceptions").sum()
    rec_opp       = get_pair_success(df_gen, "Recoveries / opp. half").sum()

    shot_assists = col(df_off, "Shot assists").sum()
    touches_pen  = col(df_off, "Touches in penalty area").sum()
    prog_runs    = col(df_off, "Progressive runs").sum()

    aggregates_all = {
        "minutes":                  total_min,
        "matches":                  total_matches,
        "goals_p90":                p90(goals, total_min),
        "assists_p90":              p90(assists, total_min),
        "xg_p90":                   p90(xg, total_min),
        "shots_p90":                p90(shots, total_min),
        "shots_on_target_p90":      p90(shots_ot, total_min),
        "pass_accuracy_pct":        safe_pct(passes_acc, passes_total),
        "long_pass_accuracy_pct":   safe_pct(long_acc, long_total),
        "dribble_success_pct":      safe_pct(drib_succ, drib_total),
        "dribbles_p90":             p90(drib_total, total_min),
        "duel_win_pct":             safe_pct(duels_won, duels_total),
        "aerial_win_pct":           safe_pct(aerial_won, aerial_total),
        "interceptions_p90":        p90(interceptions, total_min),
        "recoveries_opp_half_p90":  p90(rec_opp, total_min),
        "shot_assists_p90":         p90(shot_assists, total_min),
        "touches_pen_area_p90":     p90(touches_pen, total_min),
        "progressive_runs_p90":     p90(prog_runs, total_min),
    }

    dates     = pd.to_datetime(df_gen["Date"], errors="coerce").dropna()
    date_from = str(dates.min().date()) if len(dates) else None
    date_to   = str(dates.max().date()) if len(dates) else None

    return {
        "aggregates": {
            "all":            aggregates_all,
            "by_competition": by_competition,
        },
        "sample": {
            "total_minutes":                   total_min,
            "total_matches":                   total_matches,
            "date_range_from":                 date_from,
            "date_range_to":                   date_to,
            "competitions_included":           [c["competition"] for c in by_competition],
            "min_minutes_per_match_threshold": MIN_MINUTES_PER_MATCH,
        },
        "source_files": [os.path.basename(f) for f in files],
    }


# ── Transfermarkt Ingest ──────────────────────────────────────────────────────

def ingest_transfermarkt(player_id: str) -> dict | None:
    path = RAW_DIR / "transfermarkt" / f"{player_id}.json"
    if not path.exists():
        print(f"  ADVARSEL: Ingen Transfermarkt-data for {player_id}")
        return None
    try:
        with open(path) as f:
            return json.load(f)
    except Exception as e:
        print(f"  FEIL: Kunne ikke lese {path}: {e}")
        return None


# ── Confidence Score ──────────────────────────────────────────────────────────

def compute_confidence(aggregates_all: dict, league: str, date_to: str | None) -> dict:
    flags = []
    minutes = aggregates_all.get("minutes", 0)

    if minutes >= 2500:      min_score = 25
    elif minutes >= 2000:    min_score = 23
    elif minutes >= 1500:    min_score = 20
    elif minutes >= 1000:    min_score = 15
    elif minutes >= 500:     min_score = 8
    else:                    min_score = 0
    if minutes < 500:        flags.append("LOW_MINUTES")

    key_fields = [
        "goals_p90", "assists_p90", "xg_p90",
        "pass_accuracy_pct", "duel_win_pct", "aerial_win_pct",
        "interceptions_p90", "progressive_runs_p90",
    ]
    present = sum(1 for f in key_fields if aggregates_all.get(f) is not None)
    comp_score = round((present / len(key_fields)) * 25)
    if present < len(key_fields): flags.append("INCOMPLETE_DATA")

    coeff = LEAGUE_COEFFICIENTS.get(league, 0.70)
    league_score = round(coeff * 25)
    if coeff < 0.75: flags.append("WEAK_LEAGUE")

    recency_score = 25
    if date_to:
        try:
            last_match = datetime.strptime(date_to, "%Y-%m-%d").date()
            months_ago = (date.today() - last_match).days / 30
            if months_ago > 24:   recency_score = 5;  flags.append("OLD_DATA")
            elif months_ago > 18: recency_score = 10
            elif months_ago > 12: recency_score = 18
        except Exception:
            recency_score = 15

    total = min_score + comp_score + league_score + recency_score

    if total >= 70:   tier = "high"
    elif total >= 45: tier = "medium"
    else:             tier = "low"

    return {
        "score": total,
        "tier":  tier,
        "components": {
            "minutes_score":        min_score,
            "completeness_score":   comp_score,
            "league_quality_score": league_score,
            "recency_score":        recency_score,
        },
        "flags": flags,
    }


# ── Risk Score ────────────────────────────────────────────────────────────────

def compute_risk(aggregates_all: dict, market: dict | None,
                 pos_group: str, league: str, age: int) -> dict:
    sporting_score = 0
    sporting_factors = []

    xg   = aggregates_all.get("xg_p90") or 0
    goals = aggregates_all.get("goals_p90") or 0
    if xg > 0 and (goals - xg) > 0.15:
        sporting_score += 20
        sporting_factors.append(f"xG overperformance: +{goals-xg:.2f}/90")

    duel_win = aggregates_all.get("duel_win_pct") or 0
    if duel_win < 45:
        sporting_score += 20
        sporting_factors.append(f"Lav duellvinnprosent: {duel_win:.1f}%")
    elif duel_win < 50:
        sporting_score += 10

    pass_acc = aggregates_all.get("pass_accuracy_pct") or 0
    if pass_acc < 72:
        sporting_score += 15
        sporting_factors.append(f"Lav pasningsnøyaktighet: {pass_acc:.1f}%")

    aerial = aggregates_all.get("aerial_win_pct") or 0
    if pos_group in ("CF", "CB") and aerial < 40:
        sporting_score += 10
        sporting_factors.append(f"Svak i luftdueller: {aerial:.1f}%")

    economic_score = 0
    economic_factors = []

    mv = (market or {}).get("market_value_eur") or 0
    if mv > 3_000_000:
        economic_score += 20
        economic_factors.append(f"Høy markedsverdi: €{mv/1e6:.1f}M")

    contract = (market or {}).get("contract_expires")
    if contract:
        try:
            exp = datetime.strptime(contract, "%Y-%m-%d").date()
            months_left = (exp - date.today()).days / 30
            if months_left < 6:
                economic_score += 30
                economic_factors.append("Kontrakt utløper < 6 mnd")
            elif months_left < 12:
                economic_score += 15
                economic_factors.append("Kontrakt utløper < 12 mnd")
        except Exception:
            economic_score += 10
            economic_factors.append("Kontraktsdato uklar")
    else:
        economic_score += 10
        economic_factors.append("Manglende kontraktsdata")

    adaptation_score = 0
    adaptation_factors = []

    coeff = LEAGUE_COEFFICIENTS.get(league, 0.70)
    if coeff < 0.70:
        adaptation_score += 35
        adaptation_factors.append(f"Svært svak liga (koeff {coeff:.2f})")
    elif coeff < 0.80:
        adaptation_score += 20
        adaptation_factors.append(f"Svak liga (koeff {coeff:.2f})")
    elif coeff < 0.90:
        adaptation_score += 10

    if age < 20:
        adaptation_score += 20
        adaptation_factors.append(f"Svært ung ({age} år)")
    elif age < 22:
        adaptation_score += 10
        adaptation_factors.append(f"Ung ({age} år)")

    avail_score = 0
    avail_factors = []

    minutes = aggregates_all.get("minutes") or 0
    if minutes < 1000:
        avail_score += 25
        avail_factors.append(f"Lav spilletid ({minutes} min)")
    elif minutes < 1500:
        avail_score += 10

    overall = round(
        sporting_score   * 0.35 +
        economic_score   * 0.25 +
        adaptation_score * 0.25 +
        avail_score      * 0.15
    )
    overall = min(overall, 100)

    if overall < 35:   tier = "low"
    elif overall < 60: tier = "medium"
    else:              tier = "high"

    return {
        "overall_score": overall,
        "overall_tier":  tier,
        "components": {
            "sporting":     {"score": min(sporting_score, 100),    "factors": sporting_factors},
            "economic":     {"score": min(economic_score, 100),    "factors": economic_factors},
            "adaptation":   {"score": min(adaptation_score, 100),  "factors": adaptation_factors},
            "availability": {"score": min(avail_score, 100),       "factors": avail_factors},
        },
    }


# ── Verdict ────────────────────────────────────────────────────────────────────

VERDICT_THRESHOLDS = {
    "CF":   {"goals_p90": 0.40, "xg_p90": 0.30, "duel_win_pct": 48},
    "WING": {"goals_p90": 0.30, "dribble_success_pct": 55, "progressive_runs_p90": 3.5},
    "CM":   {"pass_accuracy_pct": 78, "interceptions_p90": 3.0, "duel_win_pct": 46},
    "CB":   {"duel_win_pct": 60, "aerial_win_pct": 58, "interceptions_p90": 4.0},
    "BACK": {"duel_win_pct": 50, "pass_accuracy_pct": 76, "progressive_runs_p90": 1.0},
}

LEAGUE_SCALE_FOR_VERDICT = LEAGUE_COEFFICIENTS


def compute_verdict(aggregates_all: dict, pos_group: str,
                    risk: dict, confidence: dict, league: str) -> dict:
    thresholds = VERDICT_THRESHOLDS.get(pos_group, {})
    total = len(thresholds)
    meets = sum(
        1 for metric, threshold in thresholds.items()
        if (aggregates_all.get(metric) or 0) >= threshold
    )

    risk_score = risk["overall_score"]
    conf_score = confidence["score"]
    scale = LEAGUE_SCALE_FOR_VERDICT.get(league, 0.75)

    if conf_score < 30:
        rec = "PASS"
        reason = f"Utilstrekkelig datagrunnlag (confidence: {conf_score})"
    elif total == 0:
        rec = "MONITOR"
        reason = "Ingen posisjonsspesifikke terskler definert"
    elif meets == total and risk_score < 35 and scale >= 0.85:
        rec = "STRONG BUY"
        reason = f"Møter alle {total} terskler, lav risiko ({risk_score}), sterk ligakontekst"
    elif meets >= round(total * 0.67) and risk_score < 50:
        rec = "BUY"
        reason = f"Møter {meets}/{total} terskler med moderat risiko ({risk_score})"
    elif meets >= round(total * 0.33) and risk_score < 65:
        rec = "MONITOR"
        reason = f"Møter {meets}/{total} terskler — trenger mer data eller utvikling"
    else:
        rec = "PASS"
        reason = f"Møter kun {meets}/{total} terskler eller for høy risiko ({risk_score})"

    if conf_score >= 70 and risk_score < 40:   verdict_conf = "high"
    elif conf_score >= 45:                      verdict_conf = "medium"
    else:                                       verdict_conf = "low"

    return {
        "recommendation":        rec,
        "confidence_in_verdict": verdict_conf,
        "key_reason":            reason,
        "computed_at":           datetime.utcnow().isoformat() + "Z",
        "threshold_version":     "2.0.0",
    }


# ── Merge & Build ─────────────────────────────────────────────────────────────

def build_player(player_id: str, meta: dict) -> dict | None:
    print(f"\nBehandler: {player_id}")

    wyscout_dir = Path(meta.get("wyscout_dir", f"raw/wyscout/{player_id}"))
    wyscout = ingest_wyscout(wyscout_dir)
    if not wyscout:
        print(f"  HOPPER OVER {player_id} — ingen gyldig Wyscout-data")
        return None

    tm = ingest_transfermarkt(player_id)

    league = (tm or {}).get("league") or meta.get("league", "Unknown")
    age    = meta.get("age") or (tm or {}).get("age")
    nat    = (tm or {}).get("nationality") or meta.get("nationality", "Unknown")
    dob    = (tm or {}).get("date_of_birth")

    if not age and dob:
        try:
            born = datetime.strptime(dob, "%Y-%m-%d").date()
            age  = (date.today() - born).days // 365
        except Exception:
            pass

    agg_all    = wyscout["aggregates"]["all"]
    confidence = compute_confidence(agg_all, league, wyscout["sample"].get("date_range_to"))
    risk       = compute_risk(agg_all, tm, meta.get("pos_group", "CM"), league, age or 25)
    verdict    = compute_verdict(agg_all, meta.get("pos_group", "CM"), risk, confidence, league)

    mv_eur     = (tm or {}).get("market_value_eur")
    contract   = (tm or {}).get("contract_expires")
    mv_display = f"€{mv_eur/1e6:.1f}M" if mv_eur and mv_eur >= 1_000_000 else \
                 f"€{mv_eur//1000}k"   if mv_eur else None

    if league in ("Norway. Eliteserien", "Sweden. Allsvenskan",
                  "Denmark. Superliga", "Finland. Veikkausliiga",
                  "Norway. 1. divisjon", "Sweden. Superettan",
                  "Denmark. 1st Division"):
        season = "2025"
    else:
        season = "2025/26"

    return {
        "id":             player_id,
        "schema_version": "2.0.0",

        "identity": {
            "full_name":      meta.get("full_name", player_id),
            "short_name":     meta.get("short_name", meta.get("full_name", player_id)),
            "date_of_birth":  dob,
            "age":            age,
            "nationality":    nat,
            "flag":           flag_from_nationality(nat),
            "height_cm":      (tm or {}).get("height_cm"),
            "preferred_foot": (tm or {}).get("preferred_foot"),
        },

        "current_club": {
            "name":    (tm or {}).get("current_club") or meta.get("club"),
            "league":  league,
            "country": league.split(". ")[0] if ". " in league else league,
        },

        "market": {
            "market_value_eur":     mv_eur,
            "market_value_display": mv_display,
            "contract_expires":     contract,
            "contract_year":        contract[:4] if contract else None,
            "source":               "transfermarkt",
            "last_updated":         (tm or {}).get("last_updated"),
        },

        "scouting": {
            "pos_group":              meta.get("pos_group"),
            "position_detail":        meta.get("position_detail"),
            "has_detailed_dashboard": meta.get("has_detailed_dashboard", False),
            "bio":                    meta.get("bio"),
        },

        "aggregates": wyscout["aggregates"],

        "sample": {
            **wyscout["sample"],
            "season": season,
        },

        "provenance": {
            "performance_source": "wyscout",
            "performance_files":  wyscout["source_files"],
            "market_source":      "transfermarkt" if tm else None,
            "market_file":        f"{player_id}.json" if tm else None,
            "processed_at":       datetime.utcnow().isoformat() + "Z",
            "pipeline_version":   PIPELINE_VERSION,
            "manual_overrides":   meta.get("manual_overrides", []),
        },

        "confidence": confidence,
        "risk":       risk,
        "verdict":    verdict,
    }


# ── Hovedscript ───────────────────────────────────────────────────────────────

def main():
    meta_path = RAW_DIR / "players_meta.json"
    if not meta_path.exists():
        print(f"FEIL: Finner ikke {meta_path}")
        print("Lag raw/players_meta.json med spillerinfo.")
        return

    with open(meta_path) as f:
        players_meta = json.load(f)

    players = []
    skipped = []

    for player_id, meta in players_meta.items():
        if player_id.startswith("$") or not isinstance(meta, dict):
            continue
        result = build_player(player_id, meta)
        if result:
            players.append(result)
        else:
            skipped.append(player_id)

    order = {"STRONG BUY": 0, "BUY": 1, "MONITOR": 2, "PASS": 3}
    players.sort(key=lambda p: order.get(p["verdict"]["recommendation"], 4))

    out = {
        "generated_at":    datetime.utcnow().isoformat() + "Z",
        "pipeline_version": PIPELINE_VERSION,
        "schema_version":  "2.0.0",
        "player_count":    len(players),
        "skipped":         skipped,
        "players":         players,
    }

    out_path = DATA_DIR / "players.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*50}")
    print(f"✅ Bygget {len(players)} spillerprofiler")
    print(f"⚠️  Hoppet over: {skipped}")
    print(f"📁 Output: {out_path} ({out_path.stat().st_size // 1024} KB)")
    if skipped:
        print(f"\nManglende filer for: {', '.join(skipped)}")


if __name__ == "__main__":
    main()
