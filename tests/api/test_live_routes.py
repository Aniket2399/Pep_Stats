from fastapi.testclient import TestClient
from apex.api.app import app

client = TestClient(app, raise_server_exceptions=False)

def test_live_matches(apex_db):
    r = client.get("/api/live/matches")
    assert r.status_code == 200 and {m["home_team"] for m in r.json()} == {"Spain", "USA"}

def test_live_fixtures(apex_db):
    assert [f["home_team"] for f in client.get("/api/live/fixtures").json()] == ["Brazil"]

def test_live_standings_grouped(apex_db):
    st = client.get("/api/live/standings").json()
    assert [r["team"] for r in st] == ["Mexico", "South Africa"]
    assert st[0]["group"] == "Group A"

def test_refresh_route_is_gone(apex_db):
    """Request-time refresh cannot work in the deployed image (no pandas, ephemeral
    disk, and auto-deploy re-bakes the DB). Scores ship as a committed artifact."""
    assert client.post("/api/live/refresh").status_code in (404, 405)
