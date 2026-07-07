import json, time
from apex.live import cache as ca, config, client as cl

class StubClient:
    def __init__(self, result=None, exc=None):
        self.result, self.exc, self.calls = result, exc, 0
    def get_wc_matches(self):
        self.calls += 1
        if self.exc: raise self.exc
        return self.result

def _paths(tmp, monkeypatch):
    monkeypatch.setattr(config, "LIVE_DIR", tmp)
    monkeypatch.setattr(config, "RAW_SNAPSHOT", tmp / "raw.json")
    monkeypatch.setattr(config, "LASTGOOD_SNAPSHOT", tmp / "lastgood.json")

def test_scrapes_on_cold_cache_and_writes_snapshots(tmp_path, monkeypatch):
    _paths(tmp_path, monkeypatch)
    stub = StubClient(result=[{"id": 1}])
    data, source = ca.get_matches_cached(stub, ttl=45, now_ts=1000)
    assert source == "live" and data == [{"id": 1}] and stub.calls == 1
    assert config.RAW_SNAPSHOT.exists() and config.LASTGOOD_SNAPSHOT.exists()

def test_serves_fresh_cache_without_scraping(tmp_path, monkeypatch):
    _paths(tmp_path, monkeypatch)
    config.RAW_SNAPSHOT.write_text(json.dumps([{"id": 9}]))
    stub = StubClient(result=[{"id": 1}])
    data, source = ca.get_matches_cached(stub, ttl=9999, now_ts=time.time())
    assert source == "cache" and data == [{"id": 9}] and stub.calls == 0

def test_last_good_fallback_on_error(tmp_path, monkeypatch):
    _paths(tmp_path, monkeypatch)
    config.LASTGOOD_SNAPSHOT.write_text(json.dumps([{"id": 7}]))
    stub = StubClient(exc=cl.LiveDataError("down"))
    data, source = ca.get_matches_cached(stub, ttl=0, now_ts=time.time())
    assert source == "cache" and data == [{"id": 7}]

def test_unavailable_when_no_lastgood(tmp_path, monkeypatch):
    _paths(tmp_path, monkeypatch)
    stub = StubClient(exc=cl.LiveDataError("down"))
    data, source = ca.get_matches_cached(stub, ttl=0, now_ts=time.time())
    assert source == "unavailable" and data == []
