from fastapi.testclient import TestClient
from apex.api.app import app
from apex import config

client = TestClient(app, raise_server_exceptions=False)

def test_health_reports_table_counts(apex_db):
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["tables"]["player_season"] == 3 and body["tables"]["team_season"] == 2

def test_meta_has_source(apex_db):
    r = client.get("/api/meta")
    assert r.status_code == 200 and r.json()["source"] == "apex.duckdb"

def test_503_when_db_missing(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "DUCKDB_PATH", tmp_path / "gone.duckdb")
    r = client.get("/health")
    assert r.status_code == 503
