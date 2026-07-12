"""Derive live/fixtures/standings views from normalized matches."""
from datetime import datetime

def _kick_ts(iso: str) -> float:
    return datetime.fromisoformat(iso).timestamp()

def derive_fixtures(matches: list) -> list:
    sched = [m for m in matches if m["status"] == "SCHEDULED"]
    return sorted(sched, key=lambda m: m["kickoff"])

def derive_live(matches: list, now_ts: int) -> list:
    # Rank-based, not clock-based: this table is a committed snapshot refreshed
    # by hand every few days, not a 45-second cache, so "within N hours of now"
    # is meaningless -- a scrape run on a day with no kickoffs would otherwise
    # publish an empty table. Instead we always keep in-progress matches, plus
    # every FINISHED match belonging to the most recently kicked-off completed
    # round (stage) -- i.e. "the latest completed round" -- which is bounded
    # and non-empty for as long as the tournament has been running.
    # now_ts is accepted (and unused here) only to keep the call signature
    # stable for other callers/tests; per-match `minute` is computed upstream
    # in normalize.py.
    live = [m for m in matches if m["status"] == "LIVE"]
    finished = [m for m in matches if m["status"] == "FINISHED"]
    latest_round = []
    if finished:
        latest_stage = max(finished, key=lambda m: _kick_ts(m["kickoff"]))["stage"]
        latest_round = [m for m in finished if m["stage"] == latest_stage]
    return sorted(live + latest_round, key=lambda m: m["kickoff"])

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
