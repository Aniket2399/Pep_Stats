"""Derive live/fixtures/standings views from normalized matches."""
from datetime import datetime

_DAY = 86400

def _kick_ts(iso: str) -> float:
    return datetime.fromisoformat(iso).timestamp()

def derive_fixtures(matches: list) -> list:
    sched = [m for m in matches if m["status"] == "SCHEDULED"]
    return sorted(sched, key=lambda m: m["kickoff"])

def derive_live(matches: list, now_ts: int) -> list:
    out = []
    for m in matches:
        if m["status"] == "LIVE" or abs(_kick_ts(m["kickoff"]) - now_ts) <= _DAY:
            out.append(m)
    return sorted(out, key=lambda m: m["kickoff"])

def derive_standings(matches: list) -> list:
    table = {}   # (group, team) -> stats
    def row(group, team, flag):
        return table.setdefault((group, team),
            {"group": group, "team": team, "flag": flag, "played": 0,
             "w": 0, "d": 0, "l": 0, "gf": 0, "ga": 0, "points": 0})
    for m in matches:
        if m["status"] != "FINISHED" or not m.get("group"):
            continue
        if m["home_score"] is None or m["away_score"] is None:
            continue
        g = m["group"]
        h = row(g, m["home_team"], m["home_flag"])
        a = row(g, m["away_team"], m["away_flag"])
        hs, as_ = m["home_score"], m["away_score"]
        for t, gf, ga in [(h, hs, as_), (a, as_, hs)]:
            t["played"] += 1; t["gf"] += gf; t["ga"] += ga
        if hs > as_:   h["w"] += 1; h["points"] += 3; a["l"] += 1
        elif hs < as_: a["w"] += 1; a["points"] += 3; h["l"] += 1
        else:          h["d"] += 1; a["d"] += 1; h["points"] += 1; a["points"] += 1
    rows = list(table.values())
    for r in rows:
        r["gd"] = r["gf"] - r["ga"]
    # rank within each group
    out = []
    for g in sorted({r["group"] for r in rows}):
        grp = [r for r in rows if r["group"] == g]
        grp.sort(key=lambda r: (-r["points"], -r["gd"], -r["gf"]))
        for i, r in enumerate(grp, 1):
            r["rank"] = i
        out.extend(grp)
    return out
