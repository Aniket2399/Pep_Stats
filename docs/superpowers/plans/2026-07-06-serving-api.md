# APEX XI — Serving API — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A read-only FastAPI service over the unified `apex.duckdb` exposing the historic (StatsBomb) and live (Sofascore WC 2026) data as ~11 JSON endpoints for the dashboard.

**Architecture:** `db.py` opens read-only DuckDB connections (503 on writer-lock) → `queries.py` holds all parameterized SQL returning `list[dict]` → thin FastAPI routers (`historic`, `live`) + ops endpoints in `app.py` with CORS. The API never writes and never scrapes.

**Tech Stack:** Python 3.13, FastAPI, uvicorn, DuckDB 1.1.3, pytest + httpx (TestClient).

## Global Constraints

- Read-only over `apex.config.DUCKDB_PATH`; the API never writes or scrapes.
- `queries.py` is the ONLY module issuing SQL; all user input is passed as bound parameters (never string-interpolated). The DuckDB reserved word `group` is always quoted `"group"`.
- Endpoints return plain JSON — arrays for collections, object for a single item — with `snake_case` keys matching the table columns. (No pydantic response models: they would duplicate 40-column table schemas with no benefit for a read API; OpenAPI still documents the routes. This is a deliberate simplification of the spec's optional `models.py`.)
- Errors: DB missing/write-locked → `503`; table not yet produced → `[]` (collections); single-item id not found → `404`; bad param type → FastAPI `422`.
- `NaN` floats from the tables (e.g. `ppda`) are converted to JSON `null`.
- Run with `uvicorn apex.api.app:app --port 8000`. CORS `allow_origins=["*"]`.
- Verified table schemas (columns) are listed in each task; do not invent columns.

---

## File Structure

```
apex/api/__init__.py
apex/api/db.py          # get_connection (read-only), DbUnavailable, table_exists
apex/api/queries.py     # _rows helper + all query functions (the only SQL)
apex/api/routers/__init__.py
apex/api/routers/historic.py   # /api/clubs /players /players/{id} /teams /teams/{id} /standings /shots
apex/api/routers/live.py       # /api/live/matches /live/fixtures /live/standings
apex/api/app.py         # FastAPI app, CORS, DbUnavailable->503, /health, /api/meta
tests/api/__init__.py
tests/api/conftest.py   # builds a synthetic apex.duckdb + monkeypatches DUCKDB_PATH
tests/api/test_db.py test_queries.py test_historic_routes.py test_live_routes.py test_ops.py
requirements.txt        # add fastapi, uvicorn[standard], httpx
```

---

## Task 1: Scaffold — deps, `db.py`, synthetic-DB fixture

**Files:** Create `apex/api/__init__.py`, `apex/api/db.py`, `apex/api/routers/__init__.py`, `tests/api/__init__.py`, `tests/api/conftest.py`, `tests/api/test_db.py`; Modify `requirements.txt`.

**Interfaces:**
- Produces `apex/api/db.py`: `class DbUnavailable(Exception)`; `get_connection() -> duckdb.DuckDBPyConnection` (read-only; raises `DbUnavailable` if file missing or locked); `table_exists(con, name: str) -> bool`; `get_db()` (FastAPI dependency generator that yields a read-only connection and closes it). Keeping `get_db` in `db.py` (not `app.py`) avoids a router↔app circular import.
- Produces `tests/api/conftest.py`: a `apex_db` autouse fixture that writes a synthetic `apex.duckdb` and monkeypatches `apex.config.DUCKDB_PATH` to it.

- [ ] **Step 1: Add deps to `requirements.txt`** (append):
```
fastapi==0.115.6
uvicorn[standard]==0.34.0
httpx==0.27.2
```

- [ ] **Step 2: Install**

Run: `cd /Users/annie/Documents/All_Projects/FIFA_Data_Project && ./venv/bin/pip install "fastapi==0.115.6" "uvicorn[standard]==0.34.0" "httpx==0.27.2"`
Expected: installs; `./venv/bin/python -c "import fastapi, uvicorn, httpx; print('ok')"` prints `ok`. (If a version is unavailable, install the nearest and pin the actual version via `pip show`.)

- [ ] **Step 3: Create `apex/api/__init__.py` and `apex/api/routers/__init__.py` and `tests/api/__init__.py`** (empty files).

- [ ] **Step 4: Create `tests/api/conftest.py`** (synthetic DB fixture used by all API tests)
```python
import duckdb
import pandas as pd
import pytest
from apex import config

def _build(db_path):
    con = duckdb.connect(str(db_path))
    team_season = pd.DataFrame([
        {"team_id": 1, "team": "Alpha", "matches": 2, "wins": 2, "draws": 0, "losses": 0,
         "gf": 5, "ga": 1, "points": 6, "gd": 4, "xg_for": 3.1, "xg_against": 0.9,
         "shots_for": 20, "shots_against": 8, "possession_pct": 60.0, "ppda": 8.5,
         "xg_diff": 2.2, "percentile_xg_for": 99.0, "percentile_xg_against": 90.0,
         "percentile_possession_pct": 95.0, "percentile_ppda": 80.0, "percentile_points": 100.0,
         "season": "2015/2016"},
        {"team_id": 2, "team": "Beta", "matches": 2, "wins": 1, "draws": 0, "losses": 1,
         "gf": 2, "ga": 3, "points": 3, "gd": -1, "xg_for": 1.5, "xg_against": 2.0,
         "shots_for": 10, "shots_against": 15, "possession_pct": 45.0, "ppda": 12.0,
         "xg_diff": -0.5, "percentile_xg_for": 40.0, "percentile_xg_against": 30.0,
         "percentile_possession_pct": 35.0, "percentile_ppda": 40.0, "percentile_points": 50.0,
         "season": "2015/2016"},
    ])
    player_season = pd.DataFrame([
        {"player_id": 10, "team_id": 1, "player": "Striker A", "team": "Alpha",
         "primary_position": "Center Forward", "position_group": "FWD", "goals": 5, "xg": 4.0,
         "shots": 12, "assists": 1, "xa": 0.8, "passes": 100, "prog_passes": 20, "pressures": 30,
         "tackles": 5, "interceptions": 3, "minutes": 540, "appearances": 6,
         "goals_per90": 0.83, "assists_per90": 0.17, "xg_per90": 0.67, "xa_per90": 0.13,
         "shots_per90": 2.0, "passes_per90": 16.7, "prog_passes_per90": 3.3,
         "pressures_per90": 5.0, "tackles_per90": 0.8, "interceptions_per90": 0.5,
         "percentile_goals_per90": 99.0, "percentile_assists_per90": 60.0, "percentile_xg_per90": 95.0,
         "percentile_xa_per90": 55.0, "percentile_shots_per90": 90.0, "percentile_passes_per90": 40.0,
         "percentile_prog_passes_per90": 70.0, "percentile_pressures_per90": 50.0,
         "percentile_tackles_per90": 30.0, "percentile_interceptions_per90": 45.0, "season": "2015/2016"},
        {"player_id": 11, "team_id": 1, "player": "Mid A", "team": "Alpha",
         "primary_position": "Center Midfield", "position_group": "MID", "goals": 1, "xg": 1.2,
         "shots": 4, "assists": 3, "xa": 2.5, "passes": 300, "prog_passes": 40, "pressures": 60,
         "tackles": 15, "interceptions": 10, "minutes": 500, "appearances": 6,
         "goals_per90": 0.18, "assists_per90": 0.54, "xg_per90": 0.22, "xa_per90": 0.45,
         "shots_per90": 0.72, "passes_per90": 54.0, "prog_passes_per90": 7.2,
         "pressures_per90": 10.8, "tackles_per90": 2.7, "interceptions_per90": 1.8,
         "percentile_goals_per90": 50.0, "percentile_assists_per90": 95.0, "percentile_xg_per90": 55.0,
         "percentile_xa_per90": 98.0, "percentile_shots_per90": 40.0, "percentile_passes_per90": 90.0,
         "percentile_prog_passes_per90": 85.0, "percentile_pressures_per90": 80.0,
         "percentile_tackles_per90": 88.0, "percentile_interceptions_per90": 82.0, "season": "2015/2016"},
        {"player_id": 20, "team_id": 2, "player": "Sub B", "team": "Beta",
         "primary_position": "Left Back", "position_group": "DEF", "goals": 0, "xg": 0.1,
         "shots": 1, "assists": 0, "xa": 0.2, "passes": 80, "prog_passes": 5, "pressures": 20,
         "tackles": 8, "interceptions": 6, "minutes": 300, "appearances": 4,
         "goals_per90": 0.0, "assists_per90": 0.0, "xg_per90": 0.03, "xa_per90": 0.06,
         "shots_per90": 0.3, "passes_per90": 24.0, "prog_passes_per90": 1.5,
         "pressures_per90": 6.0, "tackles_per90": 2.4, "interceptions_per90": 1.8,
         "percentile_goals_per90": 10.0, "percentile_assists_per90": 20.0, "percentile_xg_per90": 15.0,
         "percentile_xa_per90": 25.0, "percentile_shots_per90": 20.0, "percentile_passes_per90": 30.0,
         "percentile_prog_passes_per90": 20.0, "percentile_pressures_per90": 40.0,
         "percentile_tackles_per90": 60.0, "percentile_interceptions_per90": 55.0, "season": "2015/2016"},
    ])
    shots = pd.DataFrame([
        {"shot_id": "s1", "match_id": 100, "team_id": 1, "team": "Alpha", "player_id": 10,
         "player": "Striker A", "minute": 23, "location_x": 110.0, "location_y": 40.0,
         "shot_end_x": 120.0, "shot_end_y": 40.0, "shot_statsbomb_xg": 0.5, "outcome": "Goal",
         "body_part": "Right Foot", "shot_type": "Open Play", "play_pattern": "Regular Play",
         "under_pressure": False},
        {"shot_id": "s2", "match_id": 100, "team_id": 2, "team": "Beta", "player_id": 20,
         "player": "Sub B", "minute": 55, "location_x": 100.0, "location_y": 30.0,
         "shot_end_x": 118.0, "shot_end_y": 35.0, "shot_statsbomb_xg": 0.1, "outcome": "Saved",
         "body_part": "Left Foot", "shot_type": "Open Play", "play_pattern": "From Counter",
         "under_pressure": True},
    ])
    live_matches = pd.DataFrame([
        {"id": 900, "home_team": "Spain", "away_team": "Portugal", "home_flag": "🇪🇸", "away_flag": "🇵🇹",
         "home_score": 1, "away_score": 0, "status": "LIVE", "minute": 67, "stage": "Round of 16",
         "kickoff": "2026-07-06T18:00:00+00:00"},
        {"id": 901, "home_team": "USA", "away_team": "Belgium", "home_flag": "🇺🇸", "away_flag": "🇧🇪",
         "home_score": 1, "away_score": 4, "status": "FINISHED", "minute": None, "stage": "Round of 16",
         "kickoff": "2026-07-05T18:00:00+00:00"},
    ])
    fixtures = pd.DataFrame([
        {"id": 902, "home_team": "Brazil", "away_team": "Norway", "home_flag": "🇧🇷", "away_flag": "🇳🇴",
         "stage": "Quarter-final", "kickoff": "2026-07-08T18:00:00+00:00"},
    ])
    standings = pd.DataFrame([
        {"group": "Group A", "rank": 1, "team": "Mexico", "flag": "🇲🇽", "played": 3, "w": 3, "d": 0,
         "l": 0, "gf": 6, "ga": 0, "gd": 6, "points": 9},
        {"group": "Group A", "rank": 2, "team": "South Africa", "flag": "🇿🇦", "played": 3, "w": 1, "d": 1,
         "l": 1, "gf": 3, "ga": 3, "gd": 0, "points": 4},
    ])
    for name, df in [("team_season", team_season), ("player_season", player_season),
                     ("shots", shots), ("live_matches", live_matches),
                     ("fixtures", fixtures), ("standings", standings)]:
        con.register("t", df); con.execute(f"CREATE TABLE {name} AS SELECT * FROM t"); con.unregister("t")
    con.close()

@pytest.fixture(autouse=True)
def apex_db(tmp_path, monkeypatch):
    db = tmp_path / "apex.duckdb"
    _build(db)
    monkeypatch.setattr(config, "DUCKDB_PATH", db)
    return db
```

- [ ] **Step 5: Write the failing test** (`tests/api/test_db.py`)
```python
import pytest
from apex.api import db
from apex import config

def test_get_connection_reads(apex_db):
    con = db.get_connection()
    assert con.execute("select count(*) from team_season").fetchone()[0] == 2
    con.close()

def test_table_exists(apex_db):
    con = db.get_connection()
    assert db.table_exists(con, "player_season") is True
    assert db.table_exists(con, "nope") is False
    con.close()

def test_missing_db_raises_unavailable(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "DUCKDB_PATH", tmp_path / "absent.duckdb")
    with pytest.raises(db.DbUnavailable):
        db.get_connection()
```

- [ ] **Step 6: Run test to verify it fails**

Run: `./venv/bin/python -m pytest tests/api/test_db.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'apex.api.db'`.

- [ ] **Step 7: Write `apex/api/db.py`**
```python
"""Read-only DuckDB access for the serving API."""
import duckdb
from apex import config

class DbUnavailable(Exception):
    """Raised when the serving DB is missing or write-locked."""

def get_connection():
    path = config.DUCKDB_PATH
    if not path.exists():
        raise DbUnavailable(f"serving db not found at {path}")
    try:
        return duckdb.connect(str(path), read_only=True)
    except duckdb.Error as e:      # e.g. another process holds the write lock
        raise DbUnavailable(str(e))

def table_exists(con, name: str) -> bool:
    row = con.execute(
        "SELECT 1 FROM information_schema.tables WHERE table_name = ?", [name]
    ).fetchone()
    return row is not None

def get_db():
    """FastAPI dependency: yield a read-only connection, always close it.

    Lives here (not in app.py) so routers import it without a circular dependency.
    A raised DbUnavailable is turned into a 503 by app.py's exception handler.
    """
    con = get_connection()
    try:
        yield con
    finally:
        con.close()
```

- [ ] **Step 8: Run test to verify it passes**

Run: `./venv/bin/python -m pytest tests/api/test_db.py -q`
Expected: PASS (3 passed).

- [ ] **Step 9: Commit**
```bash
git add requirements.txt apex/api/__init__.py apex/api/db.py apex/api/routers/__init__.py tests/api/__init__.py tests/api/conftest.py tests/api/test_db.py
git commit -m "chore: scaffold serving API (deps, read-only db access, test fixture)"
```

---

## Task 2: `queries.py` — the data-access layer

**Files:** Create `apex/api/queries.py`; Test `tests/api/test_queries.py`.

**Interfaces:**
- Consumes: `db.table_exists`.
- Produces (each takes a live connection first arg):
  - `clubs(con) -> list[dict]` (`team_id, team`, sorted by team)
  - `players(con, club=None, position=None, limit=None) -> list[dict]` (player_season; filters; ORDER BY minutes DESC)
  - `player(con, player_id) -> dict | None` (highest-minutes row for that id)
  - `teams(con) -> list[dict]` (team_season, ORDER BY team)
  - `team(con, team_id) -> dict | None`
  - `standings(con) -> list[dict]` (team_season, ORDER BY points DESC, gd DESC, gf DESC)
  - `shots(con, club=None, player=None, match=None) -> list[dict]`
  - `live_matches(con) -> list[dict]`, `fixtures(con) -> list[dict]`, `live_standings(con) -> list[dict]` (ORDER BY "group", rank)
  - `table_counts(con) -> dict[str,int]`, `meta() -> dict`

- [ ] **Step 1: Write the failing test** (`tests/api/test_queries.py`)
```python
from apex.api import db, queries as q

def _con():
    return db.get_connection()

def test_clubs_sorted():
    con = _con()
    assert [c["team"] for c in q.clubs(con)] == ["Alpha", "Beta"]

def test_players_filter_by_club_and_position():
    con = _con()
    alpha = q.players(con, club=1)
    assert {p["player"] for p in alpha} == {"Striker A", "Mid A"}
    fwd = q.players(con, club=1, position="FWD")
    assert [p["player"] for p in fwd] == ["Striker A"]

def test_players_sorted_by_minutes_desc_and_limit():
    con = _con()
    top = q.players(con, limit=1)
    assert top[0]["player"] == "Striker A"   # 540 minutes, highest

def test_player_single_and_missing():
    con = _con()
    assert q.player(con, 10)["player"] == "Striker A"
    assert q.player(con, 99999) is None

def test_standings_ordered_by_points():
    con = _con()
    assert [t["team"] for t in q.standings(con)] == ["Alpha", "Beta"]

def test_teams_and_team():
    con = _con()
    assert len(q.teams(con)) == 2
    assert q.team(con, 2)["team"] == "Beta"
    assert q.team(con, 404) is None

def test_shots_filters():
    con = _con()
    assert len(q.shots(con)) == 2
    assert [s["shot_id"] for s in q.shots(con, club=1)] == ["s1"]
    assert [s["shot_id"] for s in q.shots(con, player=20)] == ["s2"]

def test_live_queries():
    con = _con()
    assert {m["home_team"] for m in q.live_matches(con)} == {"Spain", "USA"}
    assert [f["home_team"] for f in q.fixtures(con)] == ["Brazil"]
    st = q.live_standings(con)
    assert [r["team"] for r in st] == ["Mexico", "South Africa"]
    assert st[0]["group"] == "Group A"     # reserved word handled

def test_table_counts():
    con = _con()
    counts = q.table_counts(con)
    assert counts["player_season"] == 3 and counts["team_season"] == 2
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./venv/bin/python -m pytest tests/api/test_queries.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'apex.api.queries'`.

- [ ] **Step 3: Write `apex/api/queries.py`**
```python
"""All SQL for the serving API. Parameterized; reserved word 'group' quoted."""
import math
import os
from apex import config
from .db import table_exists

_TABLES = ["player_season", "team_season", "shots", "live_matches", "fixtures", "standings"]

def _clean(v):
    if isinstance(v, float) and math.isnan(v):
        return None
    return v

def _rows(con, sql, params=()):
    cur = con.execute(sql, list(params))
    cols = [d[0] for d in cur.description]
    return [{c: _clean(v) for c, v in zip(cols, row)} for row in cur.fetchall()]

def _one(con, sql, params=()):
    rows = _rows(con, sql, params)
    return rows[0] if rows else None

def clubs(con):
    if not table_exists(con, "team_season"):
        return []
    return _rows(con, "SELECT team_id, team FROM team_season ORDER BY team")

def players(con, club=None, position=None, limit=None):
    if not table_exists(con, "player_season"):
        return []
    sql = "SELECT * FROM player_season WHERE 1=1"
    params = []
    if club is not None:
        sql += " AND team_id = ?"; params.append(club)
    if position is not None:
        sql += " AND position_group = ?"; params.append(position)
    sql += " ORDER BY minutes DESC"
    if limit is not None:
        sql += " LIMIT ?"; params.append(limit)
    return _rows(con, sql, params)

def player(con, player_id):
    if not table_exists(con, "player_season"):
        return None
    return _one(con, "SELECT * FROM player_season WHERE player_id = ? "
                     "ORDER BY minutes DESC LIMIT 1", [player_id])

def teams(con):
    if not table_exists(con, "team_season"):
        return []
    return _rows(con, "SELECT * FROM team_season ORDER BY team")

def team(con, team_id):
    if not table_exists(con, "team_season"):
        return None
    return _one(con, "SELECT * FROM team_season WHERE team_id = ?", [team_id])

def standings(con):
    if not table_exists(con, "team_season"):
        return []
    return _rows(con, "SELECT * FROM team_season ORDER BY points DESC, gd DESC, gf DESC")

def shots(con, club=None, player=None, match=None):
    if not table_exists(con, "shots"):
        return []
    sql = "SELECT * FROM shots WHERE 1=1"
    params = []
    if club is not None:
        sql += " AND team_id = ?"; params.append(club)
    if player is not None:
        sql += " AND player_id = ?"; params.append(player)
    if match is not None:
        sql += " AND match_id = ?"; params.append(match)
    return _rows(con, sql, params)

def live_matches(con):
    if not table_exists(con, "live_matches"):
        return []
    return _rows(con, "SELECT * FROM live_matches ORDER BY kickoff")

def fixtures(con):
    if not table_exists(con, "fixtures"):
        return []
    return _rows(con, "SELECT * FROM fixtures ORDER BY kickoff")

def live_standings(con):
    if not table_exists(con, "standings"):
        return []
    return _rows(con, 'SELECT * FROM standings ORDER BY "group", rank')

def table_counts(con):
    out = {}
    for t in _TABLES:
        out[t] = con.execute(f"SELECT count(*) FROM {t}").fetchone()[0] if table_exists(con, t) else 0
    return out

def _mtime_iso(path):
    import datetime
    if path.exists():
        return datetime.datetime.fromtimestamp(os.path.getmtime(path),
                                                tz=datetime.timezone.utc).isoformat()
    return None

def meta():
    from apex.live import config as live_config
    return {
        "historic_updated": _mtime_iso(config.PLAYER_SEASON_PARQUET),
        "live_updated": _mtime_iso(live_config.RAW_SNAPSHOT),
        "source": "apex.duckdb",
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./venv/bin/python -m pytest tests/api/test_queries.py -q`
Expected: PASS (9 passed).

- [ ] **Step 5: Commit**
```bash
git add apex/api/queries.py tests/api/test_queries.py
git commit -m "feat: serving API query layer (parameterized SQL over apex.duckdb)"
```

---

## Task 3: `app.py` — FastAPI app, CORS, 503 handler, ops endpoints

**Files:** Create `apex/api/app.py`; Test `tests/api/test_ops.py`.

**Interfaces:**
- Consumes: `db.get_connection`, `db.DbUnavailable`, `queries.table_counts`, `queries.meta`.
- Produces: `app` (FastAPI instance); `get_db()` dependency yielding a read-only connection; a `DbUnavailable` exception handler → `503`. Routes `/health`, `/api/meta`. Routers are wired here in Task 4/5 (import guarded so this task stands alone).

- [ ] **Step 1: Write the failing test** (`tests/api/test_ops.py`)
```python
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./venv/bin/python -m pytest tests/api/test_ops.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'apex.api.app'`.

- [ ] **Step 3: Write `apex/api/app.py`**
```python
"""APEX XI serving API."""
import logging
from fastapi import FastAPI, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from .db import DbUnavailable, get_db
from . import queries

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

app = FastAPI(title="APEX XI API", version="0.3.0",
              description="Read-only serving API over apex.duckdb (historic + live).")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.exception_handler(DbUnavailable)
async def _db_unavailable(request: Request, exc: DbUnavailable):
    return JSONResponse(status_code=503, content={"detail": "data store unavailable"})

@app.get("/health")
def health(con=Depends(get_db)):
    return {"status": "ok", "tables": queries.table_counts(con)}

@app.get("/api/meta")
def meta():
    return queries.meta()

# Routers (created as stubs in Step 4, fleshed out in Tasks 4 & 5):
from .routers import historic, live   # noqa: E402
app.include_router(historic.router)
app.include_router(live.router)
```
Note: `app.py` imports the `historic`/`live` routers at its bottom, so those modules must exist for `app` to import. Step 4 creates minimal router stubs now; Tasks 4-5 flesh them out. Because `get_db` lives in `db.py`, the routers import it from `..db` (not `..app`) — there is no circular import.

- [ ] **Step 4: Temporarily stub routers so the app imports**

Since `app.py` imports `historic`/`live` routers, create minimal placeholders NOW so the module imports (they'll be fleshed out in Tasks 4-5):
`apex/api/routers/historic.py`:
```python
from fastapi import APIRouter
router = APIRouter(prefix="/api", tags=["historic"])
```
`apex/api/routers/live.py`:
```python
from fastapi import APIRouter
router = APIRouter(prefix="/api/live", tags=["live"])
```

- [ ] **Step 5: Run test to verify it passes**

Run: `./venv/bin/python -m pytest tests/api/test_ops.py -q`
Expected: PASS (3 passed).

- [ ] **Step 6: Commit**
```bash
git add apex/api/app.py apex/api/routers/historic.py apex/api/routers/live.py tests/api/test_ops.py
git commit -m "feat: serving API app (CORS, 503 handler, /health, /api/meta) + router stubs"
```

---

## Task 4: Historic router

**Files:** Modify `apex/api/routers/historic.py`; Test `tests/api/test_historic_routes.py`.

**Interfaces:**
- Consumes: `queries.*`, `app.get_db` dependency.
- Produces routes under `/api`: `GET /clubs`, `GET /players`, `GET /players/{player_id}`, `GET /teams`, `GET /teams/{team_id}`, `GET /standings`, `GET /shots`.

- [ ] **Step 1: Write the failing test** (`tests/api/test_historic_routes.py`)
```python
from fastapi.testclient import TestClient
from apex.api.app import app

client = TestClient(app, raise_server_exceptions=False)

def test_clubs(apex_db):
    r = client.get("/api/clubs")
    assert r.status_code == 200
    assert [c["team"] for c in r.json()] == ["Alpha", "Beta"]

def test_players_filter(apex_db):
    r = client.get("/api/players", params={"club": 1, "position": "FWD"})
    assert r.status_code == 200 and [p["player"] for p in r.json()] == ["Striker A"]

def test_player_detail_and_404(apex_db):
    assert client.get("/api/players/10").json()["player"] == "Striker A"
    assert client.get("/api/players/99999").status_code == 404

def test_players_bad_param_422(apex_db):
    assert client.get("/api/players", params={"club": "abc"}).status_code == 422

def test_teams_and_team_404(apex_db):
    assert len(client.get("/api/teams").json()) == 2
    assert client.get("/api/teams/2").json()["team"] == "Beta"
    assert client.get("/api/teams/404").status_code == 404

def test_standings_and_shots(apex_db):
    assert [t["team"] for t in client.get("/api/standings").json()] == ["Alpha", "Beta"]
    assert [s["shot_id"] for s in client.get("/api/shots", params={"club": 1}).json()] == ["s1"]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./venv/bin/python -m pytest tests/api/test_historic_routes.py -q`
Expected: FAIL — 404s (routes not defined yet).

- [ ] **Step 3: Replace `apex/api/routers/historic.py`**
```python
"""Historic (StatsBomb) read routes."""
from fastapi import APIRouter, Depends, HTTPException, Query
from ..db import get_db
from .. import queries

router = APIRouter(prefix="/api", tags=["historic"])

@router.get("/clubs")
def get_clubs(con=Depends(get_db)):
    return queries.clubs(con)

@router.get("/players")
def get_players(club: int | None = None, position: str | None = None,
                limit: int | None = Query(None, ge=1), con=Depends(get_db)):
    return queries.players(con, club=club, position=position, limit=limit)

@router.get("/players/{player_id}")
def get_player(player_id: int, con=Depends(get_db)):
    row = queries.player(con, player_id)
    if row is None:
        raise HTTPException(status_code=404, detail="player not found")
    return row

@router.get("/teams")
def get_teams(con=Depends(get_db)):
    return queries.teams(con)

@router.get("/teams/{team_id}")
def get_team(team_id: int, con=Depends(get_db)):
    row = queries.team(con, team_id)
    if row is None:
        raise HTTPException(status_code=404, detail="team not found")
    return row

@router.get("/standings")
def get_standings(con=Depends(get_db)):
    return queries.standings(con)

@router.get("/shots")
def get_shots(club: int | None = None, player: int | None = None,
              match: int | None = None, con=Depends(get_db)):
    return queries.shots(con, club=club, player=player, match=match)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./venv/bin/python -m pytest tests/api/test_historic_routes.py -q`
Expected: PASS (6 passed).

- [ ] **Step 5: Commit**
```bash
git add apex/api/routers/historic.py tests/api/test_historic_routes.py
git commit -m "feat: historic API routes (clubs, players, teams, standings, shots)"
```

---

## Task 5: Live router

**Files:** Modify `apex/api/routers/live.py`; Test `tests/api/test_live_routes.py`.

**Interfaces:**
- Consumes: `queries.live_matches/fixtures/live_standings`, `app.get_db`.
- Produces routes under `/api/live`: `GET /matches`, `GET /fixtures`, `GET /standings`.

- [ ] **Step 1: Write the failing test** (`tests/api/test_live_routes.py`)
```python
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./venv/bin/python -m pytest tests/api/test_live_routes.py -q`
Expected: FAIL — 404s (routes not defined yet).

- [ ] **Step 3: Replace `apex/api/routers/live.py`**
```python
"""Live (Sofascore WC 2026) read routes."""
from fastapi import APIRouter, Depends
from ..db import get_db
from .. import queries

router = APIRouter(prefix="/api/live", tags=["live"])

@router.get("/matches")
def get_live_matches(con=Depends(get_db)):
    return queries.live_matches(con)

@router.get("/fixtures")
def get_fixtures(con=Depends(get_db)):
    return queries.fixtures(con)

@router.get("/standings")
def get_live_standings(con=Depends(get_db)):
    return queries.live_standings(con)
```

- [ ] **Step 4: Run test + full suite**

Run: `./venv/bin/python -m pytest tests/api/test_live_routes.py -q && ./venv/bin/python -m pytest tests -q`
Expected: live routes PASS (3 passed); full suite (batch + live + api) all green.

- [ ] **Step 5: Commit**
```bash
git add apex/api/routers/live.py tests/api/test_live_routes.py
git commit -m "feat: live API routes (matches, fixtures, standings)"
```

---

## Task 6: Real-data smoke run (manual)

**Files:** none (verification only). Requires the real `apex.duckdb` (run `apex build` / `apex-live refresh` first if absent).

- [ ] **Step 1: Ensure the serving DB has data**

Run:
```bash
cd /Users/annie/Documents/All_Projects/FIFA_Data_Project
ls -la data/serving/apex.duckdb || ./venv/bin/python -m apex.cli build --skip-ingest
```
Expected: `apex.duckdb` exists (rebuild if missing).

- [ ] **Step 2: Start the API**

Run (background): `./venv/bin/python -m uvicorn apex.api.app:app --port 8000 > /tmp/apex_api.log 2>&1 &`
Wait ~3s, then `grep "Uvicorn running" /tmp/apex_api.log`.
Expected: `Uvicorn running on http://127.0.0.1:8000`.

- [ ] **Step 3: Hit the endpoints against real data**

Run:
```bash
curl -s localhost:8000/health | python3 -m json.tool
curl -s "localhost:8000/api/clubs" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d), 'clubs:', [c['team'] for c in d][:5])"
curl -s "localhost:8000/api/players?club=$(curl -s localhost:8000/api/clubs | python3 -c 'import sys,json;print(json.load(sys.stdin)[0]["team_id"])')&position=FWD&limit=3" | python3 -c "import sys,json; [print(p['player'], p['goals'], round(p['percentile_xg_per90'],0)) for p in json.load(sys.stdin)]"
curl -s "localhost:8000/api/standings" | python3 -c "import sys,json; [print(t['team'], t['points']) for t in json.load(sys.stdin)[:3]]"
curl -s "localhost:8000/api/live/standings" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d), 'rows;', d[0] if d else 'empty')"
```
Expected: health shows 6 tables with counts (player_season 546, team_season 20, shots 9168, live_* as refreshed); 20 clubs; FWDs with goals + percentiles; Barcelona/Real Madrid top standings; live standings grouped.

- [ ] **Step 4: Confirm interactive docs**

Run: `curl -s -o /dev/null -w "%{http_code}" localhost:8000/docs`
Expected: `200` (Swagger UI available at http://localhost:8000/docs).

- [ ] **Step 5: Stop the server**

Run: `pkill -f "uvicorn apex.api.app"`

- [ ] **Step 6: Commit any fixups** (only if code changed)
```bash
git add -A && git commit -m "chore: real-data smoke verification of serving API" || echo "nothing to commit"
```

---

## Self-Review Notes (author)

- **Spec coverage:** db read-only+503 (T1), all query functions (T2), app/CORS/health/meta (T3), historic routes (T4), live routes (T5), real smoke (T6). All 11 endpoints + ops covered.
- **Deliberate simplification:** no pydantic `models.py` — routes return `list[dict]`/`dict` (documented in Global Constraints); avoids duplicating 40-column schemas. Flag to user at handoff.
- **Circular-import avoided:** `get_db` lives in `db.py`; routers import it from `..db`, and `app.py` imports the routers. No cycle. Task 3 stubs the routers so `app` imports cleanly; Tasks 4-5 flesh them out.
- **Reserved word:** `live_standings` quotes `"group"`; the `standings` response key is `group`.
- **`/players/{id}` ambiguity:** player_season PK is (player_id, team_id); the route returns the highest-minutes row for that id (documented in queries interface).
- **Type consistency:** query function names/params match router calls and the ops handlers; `get_db` dependency shared across routers.
