import os, sys
sys.path.insert(0, "/Users/annie/Documents/All_Projects/FIFA_Data_Project")
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "ingestion"))

import fakeredis
import pytest
from api.cache import CacheManager
import ingestion.football_data as fd  # noqa
from ingestion.football_data import FootballDataError


def make_cache():
    c = CacheManager.__new__(CacheManager)      # bypass real-redis __init__
    c.redis_client = fakeredis.FakeStrictRedis(decode_responses=True)
    return c


def test_cached_miss_then_hit():
    from api import main
    cache = make_cache()
    calls = {"n": 0}
    def fetch():
        calls["n"] += 1
        return {"v": 1}
    d1, s1 = main.cached(cache, "k", 60, fetch)
    d2, s2 = main.cached(cache, "k", 60, fetch)
    assert (d1, s1) == ({"v": 1}, "live")
    assert (d2, s2) == ({"v": 1}, "cache")
    assert calls["n"] == 1  # second call served from cache

def test_cached_falls_back_to_lastgood():
    from api import main
    cache = make_cache()
    main.cached(cache, "k", 1, lambda: {"v": "good"})   # seeds k + k:lastgood
    cache.redis_client.delete("k")                      # expire live key
    def boom():
        raise FootballDataError("down")
    d, s = main.cached(cache, "k", 1, boom)
    assert d == {"v": "good"} and s == "cache"

def test_envelope_mock_when_no_lastgood():
    from api import main
    cache = make_cache()
    def boom():
        raise FootballDataError("down")
    env = main.envelope(cache, "k", 60, boom, mock={"m": True})
    assert env["source"] == "mock" and env["data"] == {"m": True}
    assert "fetched_at" in env

def test_envelope_mock_on_non_footballdata_error():
    from api import main
    cache = make_cache()
    def boom():
        raise KeyError("homeTeam")   # malformed-JSON style error
    env = main.envelope(cache, "kx", 60, boom, mock={"ok": False})
    assert env["source"] == "mock" and env["data"] == {"ok": False}

def test_envelope_live():
    from api import main
    cache = make_cache()
    env = main.envelope(cache, "k2", 60, lambda: [1, 2], mock=[])
    assert env["source"] == "live" and env["data"] == [1, 2]


from fastapi.testclient import TestClient

def _client_with(monkeypatch, fake_football):
    from api import main
    monkeypatch.setattr(main, "cache", make_cache())
    monkeypatch.setattr(main, "football", fake_football)
    return TestClient(main.app)

class FakeFootball:
    def get_matches(self):
        return {"live": [{"id": 1, "status": "LIVE"}], "upcoming": [], "recent": []}
    def get_standings(self):
        return [{"group": "GROUP_A", "rank": 1, "team": "France", "flag": "🇫🇷",
                 "w": 3, "d": 0, "l": 0, "gf": 8, "ga": 1, "pts": 9}]
    def get_topscorers(self):
        return [{"rank": 1, "player": "Mbappe", "team": "France", "flag": "🇫🇷",
                 "goals": 5, "assists": 2}]
    def get_match(self, mid):
        return {"id": mid, "status": "LIVE"}
    def get_events(self, mid):
        return [{"minute": 34, "type": "goal", "team": "Colombia", "player": "Diaz"}]

def test_matches_endpoint(monkeypatch):
    c = _client_with(monkeypatch, FakeFootball())
    r = c.get("/matches")
    assert r.status_code == 200
    body = r.json()
    assert body["source"] == "live"
    assert body["data"]["live"][0]["id"] == 1

def test_standings_endpoint(monkeypatch):
    c = _client_with(monkeypatch, FakeFootball())
    body = c.get("/standings").json()
    assert body["data"][0]["team"] == "France"

def test_leaderboards_endpoint(monkeypatch):
    c = _client_with(monkeypatch, FakeFootball())
    body = c.get("/leaderboards").json()
    assert body["data"][0]["player"] == "Mbappe"

def test_match_and_events_endpoints(monkeypatch):
    c = _client_with(monkeypatch, FakeFootball())
    assert c.get("/match/537").json()["data"]["id"] == 537
    assert c.get("/match/537/events").json()["data"][0]["type"] == "goal"

def test_matches_endpoint_mock_on_failure(monkeypatch):
    class Broken(FakeFootball):
        def get_matches(self):
            raise FootballDataError("down")
    c = _client_with(monkeypatch, Broken())
    body = c.get("/matches").json()
    assert body["source"] == "mock"
    assert body["data"] == {"live": [], "upcoming": [], "recent": []}
