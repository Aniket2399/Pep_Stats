import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "ingestion"))
import football_data as fd

import json
from datetime import datetime, timezone


def test_map_status_live():
    assert fd.map_status("IN_PLAY") == "LIVE"
    assert fd.map_status("PAUSED") == "LIVE"

def test_map_status_scheduled():
    assert fd.map_status("TIMED") == "SCHEDULED"
    assert fd.map_status("SCHEDULED") == "SCHEDULED"

def test_map_status_finished():
    assert fd.map_status("FINISHED") == "FINISHED"
    assert fd.map_status("AWARDED") == "FINISHED"

def test_map_status_unknown_defaults_scheduled():
    assert fd.map_status("POSTPONED") == "SCHEDULED"

def test_country_to_flag_known():
    assert fd.country_to_flag("France") == "🇫🇷"
    assert fd.country_to_flag("Argentina") == "🇦🇷"

def test_country_to_flag_unknown():
    assert fd.country_to_flag("Wakanda") == "🏳️"


FIX = os.path.join(os.path.dirname(__file__), "fixtures")

def _load(name):
    with open(os.path.join(FIX, name)) as f:
        return json.load(f)

class FakeResp:
    def __init__(self, status_code, payload):
        self.status_code = status_code
        self._payload = payload
        self.text = json.dumps(payload)
    def json(self):
        return self._payload

def _client_returning(monkeypatch, payload, status=200):
    client = fd.FootballDataClient(api_key="test")
    monkeypatch.setattr(fd.requests, "get",
                        lambda *a, **k: FakeResp(status, payload))
    return client

def test_elapsed_minutes():
    start = "2026-07-03T20:00:00Z"
    now = datetime(2026, 7, 3, 20, 42, tzinfo=timezone.utc)
    assert fd.elapsed_minutes(start, now) == 42

def test_normalize_live_match_uses_minute():
    m = _load("wc_matches.json")["matches"][0]  # Colombia 1-0 Ghana, min 63
    out = fd.FootballDataClient(api_key="t")._normalize_match(m)
    assert out["id"] == 537301
    assert out["status"] == "LIVE"
    assert out["team1"] == {"name": "Colombia", "flag": "🇨🇴", "score": 1}
    assert out["team2"] == {"name": "Ghana", "flag": "🇬🇭", "score": 0}
    assert out["time"] == "63'"
    assert out["stadium"] == "MetLife Stadium"

def test_normalize_scheduled_match_uses_kickoff():
    m = _load("wc_matches.json")["matches"][1]  # Canada vs Morocco TIMED
    out = fd.FootballDataClient(api_key="t")._normalize_match(m)
    assert out["status"] == "SCHEDULED"
    assert out["time"] == "2026-07-04T17:00:00Z"
    assert out["team1"]["score"] == 0  # None -> 0

def test_get_matches_partitions(monkeypatch):
    client = _client_returning(monkeypatch, _load("wc_matches.json"))
    bundle = client.get_matches()
    assert [m["team1"]["name"] for m in bundle["live"]] == ["Colombia"]
    assert [m["team1"]["name"] for m in bundle["upcoming"]] == ["Canada"]
    assert [m["team1"]["name"] for m in bundle["recent"]] == ["France"]

def test_get_match_single(monkeypatch):
    client = _client_returning(monkeypatch, _load("wc_match_detail.json"))
    out = client.get_match(537301)
    assert out["id"] == 537301 and out["status"] == "LIVE"

def test_get_standings(monkeypatch):
    client = _client_returning(monkeypatch, _load("wc_standings.json"))
    rows = client.get_standings()
    assert rows[0] == {"group": "GROUP_A", "rank": 1, "team": "France", "flag": "🇫🇷",
                       "w": 3, "d": 0, "l": 0, "gf": 8, "ga": 1, "pts": 9}
    assert rows[1]["team"] == "Argentina"

def test_get_topscorers(monkeypatch):
    client = _client_returning(monkeypatch, _load("wc_scorers.json"))
    rows = client.get_topscorers()
    assert rows[0] == {"rank": 1, "player": "Kylian Mbappe", "team": "France",
                       "flag": "🇫🇷", "goals": 5, "assists": 2}

def test_get_events_goals(monkeypatch):
    client = _client_returning(monkeypatch, _load("wc_match_detail.json"))
    ev = client.get_events(537301)
    assert ev == [{"minute": 34, "type": "goal", "team": "Colombia", "player": "Luis Diaz"}]

def test_get_events_empty_when_no_goals(monkeypatch):
    client = _client_returning(monkeypatch, {"id": 1, "goals": []})
    assert client.get_events(1) == []
