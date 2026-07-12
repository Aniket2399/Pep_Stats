from datetime import datetime, timezone
from apex.live import derive as dv

def _m(**k):
    base = {"id": 1, "home_team": "A", "away_team": "B", "home_flag": "🇦", "away_flag": "🇧",
            "home_score": None, "away_score": None, "status": "SCHEDULED", "minute": None,
            "stage": None, "kickoff": "2026-07-05T12:00:00+00:00", "group": None}
    base.update(k); return base

def test_derive_fixtures_sorted_scheduled_only():
    ms = [_m(id=1, status="SCHEDULED", kickoff="2026-07-06T00:00:00+00:00"),
          _m(id=2, status="FINISHED"),
          _m(id=3, status="SCHEDULED", kickoff="2026-07-05T00:00:00+00:00")]
    out = dv.derive_fixtures(ms)
    assert [m["id"] for m in out] == [3, 1]   # scheduled only, sorted by kickoff

def test_derive_live_always_includes_live_regardless_of_stage_or_time():
    # LIVE matches must appear even if their kickoff is far from "now" and even
    # if their stage doesn't match the most-recent-finished-round's stage.
    now = 1_000_000
    ms = [_m(id=1, status="LIVE", stage="Quarterfinals", kickoff="2026-07-05T12:00:00+00:00"),
          _m(id=2, status="FINISHED", stage="Round of 16", kickoff="2026-06-30T12:00:00+00:00")]
    out = dv.derive_live(ms, now_ts=now)
    ids = {m["id"] for m in out}
    assert 1 in ids

def test_derive_live_returns_most_recent_finished_stage_only():
    # Three FINISHED "Round of 16" matches (older) and two FINISHED
    # "Quarterfinals" matches (the latest-kicked-off stage) -> only the QFs come back.
    ms = [
        _m(id=1, status="FINISHED", stage="Round of 16", kickoff="2026-06-28T12:00:00+00:00"),
        _m(id=2, status="FINISHED", stage="Round of 16", kickoff="2026-06-29T12:00:00+00:00"),
        _m(id=3, status="FINISHED", stage="Quarterfinals", kickoff="2026-07-04T12:00:00+00:00"),
        _m(id=4, status="FINISHED", stage="Quarterfinals", kickoff="2026-07-05T12:00:00+00:00"),
    ]
    out = dv.derive_live(ms, now_ts=1_000_000)
    ids = [m["id"] for m in out]
    assert ids == [3, 4]

def test_derive_live_survives_a_scrape_run_days_after_the_last_match():
    # Regression: the old ±1-day-from-now window would empty the table entirely
    # once "now" drifted more than a day past the last kickoff. A snapshot
    # scraped a week later must still surface the most recent completed round.
    ms = [
        _m(id=1, status="FINISHED", stage="Quarterfinals", kickoff="2026-07-04T12:00:00+00:00"),
        _m(id=2, status="FINISHED", stage="Quarterfinals", kickoff="2026-07-05T12:00:00+00:00"),
    ]
    far_future_now = int(datetime(2026, 7, 17, 12, tzinfo=timezone.utc).timestamp())
    out = dv.derive_live(ms, now_ts=far_future_now)
    assert [m["id"] for m in out] == [1, 2]

def test_derive_live_no_finished_matches_returns_only_live():
    ms = [_m(id=1, status="SCHEDULED", kickoff="2026-07-06T00:00:00+00:00"),
          _m(id=2, status="LIVE", kickoff="2026-07-05T00:00:00+00:00")]
    out = dv.derive_live(ms, now_ts=1_000_000)
    assert [m["id"] for m in out] == [2]

def test_derive_live_no_matches_at_all_returns_empty():
    ms = [_m(id=1, status="SCHEDULED", kickoff="2026-07-06T00:00:00+00:00")]
    out = dv.derive_live(ms, now_ts=1_000_000)
    assert out == []

def test_derive_standings_group_table():
    # Group A: A beat B 2-0, A drew C 1-1, B beat C 3-1  -> A:4pts, B:3, C:1
    ms = [
        _m(id=1, status="FINISHED", group="Group A", home_team="A", away_team="B", home_score=2, away_score=0),
        _m(id=2, status="FINISHED", group="Group A", home_team="A", away_team="C", home_score=1, away_score=1),
        _m(id=3, status="FINISHED", group="Group A", home_team="B", away_team="C", home_score=3, away_score=1),
        _m(id=4, status="SCHEDULED", group="Group A", home_team="A", away_team="C"),   # ignored (not finished)
    ]
    rows = dv.derive_standings(ms)
    by_team = {r["team"]: r for r in rows}
    assert by_team["A"]["points"] == 4 and by_team["A"]["rank"] == 1
    # B: beat C 3-1 (gf3,ga1) + lost to A 0-2 (gf0,ga2) -> gf3 ga3 gd0, 3 pts
    assert by_team["B"]["points"] == 3 and by_team["B"]["gd"] == 0
    assert by_team["C"]["points"] == 1 and by_team["C"]["rank"] == 3
    assert all(r["group"] == "Group A" for r in rows)

def test_derive_standings_excludes_knockout():
    ms = [_m(id=9, status="FINISHED", group=None, stage="Round of 16",
             home_team="A", away_team="B", home_score=1, away_score=0)]
    assert dv.derive_standings(ms) == []
