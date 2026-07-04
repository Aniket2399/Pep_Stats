import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "ingestion"))
import football_data as fd

import json
import pytest
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

def test_get_raises_on_403(monkeypatch):
    client = fd.FootballDataClient(api_key="bad")
    monkeypatch.setattr(fd.requests, "get",
                        lambda *a, **k: FakeResp(403, {"message": "forbidden"}))
    with pytest.raises(fd.FootballDataError):
        client.get_matches()

def test_get_raises_on_429(monkeypatch):
    client = fd.FootballDataClient(api_key="t")
    monkeypatch.setattr(fd.requests, "get",
                        lambda *a, **k: FakeResp(429, {"message": "too many"}))
    with pytest.raises(fd.FootballDataError):
        client.get_standings()

def test_get_raises_on_network_error(monkeypatch):
    client = fd.FootballDataClient(api_key="t")
    def boom(*a, **k):
        raise fd.requests.RequestException("dns fail")
    monkeypatch.setattr(fd.requests, "get", boom)
    with pytest.raises(fd.FootballDataError):
        client.get_topscorers()

def test_request_uses_wc_path_and_auth_header(monkeypatch):
    captured = {}
    def rec(url, headers=None, params=None, timeout=None):
        captured["url"] = url
        captured["headers"] = headers
        return FakeResp(200, _load("wc_matches.json"))
    client = fd.FootballDataClient(api_key="secret-key")
    monkeypatch.setattr(fd.requests, "get", rec)
    client.get_matches()
    assert captured["url"].endswith("/competitions/WC/matches")
    assert captured["headers"]["X-Auth-Token"] == "secret-key"

def test_get_matches_sorts_upcoming_asc_and_recent_desc(monkeypatch):
    payload = {
        "matches": [
            {
                "id": 1, "utcDate": "2026-07-10T18:00:00Z", "status": "SCHEDULED",
                "stage": "GROUP_STAGE", "minute": None, "venue": "Stadium A",
                "homeTeam": {"id": 1, "name": "Team A"},
                "awayTeam": {"id": 2, "name": "Team B"},
                "score": {"fullTime": {"home": None, "away": None}},
            },
            {
                "id": 2, "utcDate": "2026-07-05T18:00:00Z", "status": "SCHEDULED",
                "stage": "GROUP_STAGE", "minute": None, "venue": "Stadium B",
                "homeTeam": {"id": 3, "name": "Team C"},
                "awayTeam": {"id": 4, "name": "Team D"},
                "score": {"fullTime": {"home": None, "away": None}},
            },
            {
                "id": 3, "utcDate": "2026-07-08T18:00:00Z", "status": "TIMED",
                "stage": "GROUP_STAGE", "minute": None, "venue": "Stadium C",
                "homeTeam": {"id": 5, "name": "Team E"},
                "awayTeam": {"id": 6, "name": "Team F"},
                "score": {"fullTime": {"home": None, "away": None}},
            },
            {
                "id": 4, "utcDate": "2026-06-20T18:00:00Z", "status": "FINISHED",
                "stage": "GROUP_STAGE", "minute": None, "venue": "Stadium D",
                "homeTeam": {"id": 7, "name": "Team G"},
                "awayTeam": {"id": 8, "name": "Team H"},
                "score": {"fullTime": {"home": 1, "away": 0}},
            },
            {
                "id": 5, "utcDate": "2026-06-25T18:00:00Z", "status": "AWARDED",
                "stage": "GROUP_STAGE", "minute": None, "venue": "Stadium E",
                "homeTeam": {"id": 9, "name": "Team I"},
                "awayTeam": {"id": 10, "name": "Team J"},
                "score": {"fullTime": {"home": 2, "away": 0}},
            },
        ]
    }
    client = _client_returning(monkeypatch, payload)
    bundle = client.get_matches()
    assert [m["team1"]["name"] for m in bundle["upcoming"]] == ["Team C", "Team E", "Team A"]
    assert [m["team1"]["name"] for m in bundle["recent"]] == ["Team I", "Team G"]
