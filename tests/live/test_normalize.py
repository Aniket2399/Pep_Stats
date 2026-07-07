from apex.live import normalize as nz
from tests.live.synthetic import match_dict

def test_map_status():
    assert nz.map_status("inprogress") == "LIVE"
    assert nz.map_status("notstarted") == "SCHEDULED"
    assert nz.map_status("finished") == "FINISHED"
    assert nz.map_status("weird") == "SCHEDULED"

def test_country_flag():
    assert nz.country_flag("NOR") == "🇳🇴"
    assert nz.country_flag("ZZZ") == "🏳️"

def test_normalize_finished_group_match():
    md = match_dict(mid=7, home="Norway", home_code="NOR", away="Egypt", away_code="EGY",
                    home_score=2, away_score=1, status="finished",
                    start_ts=1782500400, group_name="Group I")
    out = nz.normalize_match(md, now_ts=1782600000)
    assert out["id"] == 7
    assert out["home_team"] == "Norway" and out["home_flag"] == "🇳🇴"
    assert out["home_score"] == 2 and out["away_score"] == 1
    assert out["status"] == "FINISHED" and out["minute"] is None
    assert out["stage"] == "Group I" and out["group"] == "Group I"
    assert out["kickoff"].startswith("2026-")

def test_normalize_live_uses_elapsed_minute():
    md = match_dict(status="inprogress", start_ts=1000, group_name="Group A")
    out = nz.normalize_match(md, now_ts=1000 + 42*60)   # 42 minutes later
    assert out["status"] == "LIVE" and out["minute"] == 42

def test_normalize_knockout_stage_and_notstarted_scores():
    md = match_dict(status="notstarted", round_name="Round of 16", round_num=5)
    out = nz.normalize_match(md, now_ts=0)
    assert out["status"] == "SCHEDULED"
    assert out["stage"] == "Round of 16" and out["group"] is None
    assert out["home_score"] is None and out["away_score"] is None
