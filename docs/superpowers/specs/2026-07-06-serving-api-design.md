# APEX XI — Serving API (Design Spec)

**Date:** 2026-07-06
**Status:** Draft — pending user review (several decisions made by judgment while user was away; flagged below to override)
**Scope:** Sub-project 3 of the APEX XI platform — the **serving layer** of the Lambda architecture: a read-only REST API over the unified `apex.duckdb` (batch + speed tables). (Sub-projects 1 & 2 — batch and speed layers — are done. Remaining: dashboard frontend.)

## Problem

The batch and speed layers write six tables into `apex.duckdb`. The dashboard (sub-project 4) needs an HTTP API to read them. This spec builds that API: a thin, read-only FastAPI service exposing the historic (StatsBomb La Liga 2015/16) and live (Sofascore WC 2026) data the wireframe's views consume.

## Judgment calls made while user was away (override any)

| Decision | Chosen | Alternative |
|----------|--------|-------------|
| Endpoint scope | **Full read API, both modes** (~11 endpoints) — *user-confirmed* | historic-only / thin slice |
| Framework | **FastAPI + uvicorn** | Flask |
| Live freshness | **Pure read-only** — API reads whatever the pipelines wrote; freshness is `apex-live watch`'s job | API triggers TTL scrape on-demand |

Rationale: each endpoint is a thin DuckDB query, so one cohesive API serves the whole frontend; FastAPI fits the stack and gives free OpenAPI docs + CORS + pydantic; a pure read-only API is the correct Lambda **serving layer** — it *merges/serves* precomputed batch + speed views, it does not compute or scrape.

## Serving tables (verified schemas)

- `player_season` (546): `player_id, team_id, player, team, primary_position, position_group, minutes, appearances`, raw totals (goals, xg, assists, xa, shots, passes, prog_passes, pressures, tackles, interceptions), `*_per90`, `percentile_*_per90`, `season`.
- `team_season` (20): `team_id, team, matches, wins, draws, losses, gf, ga, points, gd, xg_for, xg_against, xg_diff, shots_for, shots_against, possession_pct, ppda, percentile_*`, `season`.
- `shots` (9168): `shot_id, match_id, team_id, team, player_id, player, minute, location_x, location_y, shot_end_x, shot_end_y, shot_statsbomb_xg, outcome, body_part, shot_type, play_pattern, under_pressure`.
- `live_matches` / `fixtures` / `standings` (live): as built by the speed layer.

## Architecture

```
apex.duckdb  (batch + live tables; written by the pipelines)
        │  read-only connections
        ▼
apex/api/db.py        connection helper (read_only=True; 503 on writer-lock)
        ▼
apex/api/queries.py   parameterized SQL → list[dict] (data-access layer; the ONLY SQL)
        ▼
apex/api/routers/{historic,live}.py   FastAPI routers, validated via models.py
        ▼
apex/api/app.py       FastAPI app: CORS, include routers, /health, /api/meta
        ▼
uvicorn apex.api.app:app   →  frontend (sub-project 4) fetches JSON
```

**Invariants:** the API never writes and never scrapes. `queries.py` is the only module issuing SQL; routers call query functions and shape responses. Read-only DuckDB connections coexist with each other; while a pipeline holds the write lock, reads return `503` (brief, infrequent).

## Project structure (extends the `apex` package)

```
apex/api/
  __init__.py
  db.py          # get_connection() read-only; DbUnavailable -> 503
  queries.py     # clubs(), players(club,position,limit), player(id), teams(), team(id),
                 #   standings(), shots(club,player,match), live_matches(), fixtures(), live_standings(), meta()
  models.py      # pydantic response models
  routers/__init__.py
  routers/historic.py   # /api/clubs /players /players/{id} /teams /teams/{id} /standings /shots
  routers/live.py       # /api/live/matches /live/fixtures /live/standings
  app.py         # FastAPI app + CORS + /health + /api/meta
tests/api/
  __init__.py  conftest.py (builds a small synthetic apex.duckdb fixture)
  test_queries.py  test_historic_routes.py  test_live_routes.py  test_ops.py
requirements.txt  # add fastapi, uvicorn[standard], httpx (TestClient)
```

## Endpoints

**Historic (batch):**
| Method / path | Returns |
|---------------|---------|
| `GET /api/clubs` | `[{team_id, team}]` — the 20 clubs (dropdown), sorted by name |
| `GET /api/players?club={team_id}&position={GK\|DEF\|MID\|FWD}&limit={n}` | `player_season` rows, filtered; default all, sorted by minutes desc |
| `GET /api/players/{player_id}` | one player's full row incl. `percentile_*` (radar); **404** if absent |
| `GET /api/teams` | all 20 `team_season` rows |
| `GET /api/teams/{team_id}` | one team's row incl. `percentile_*`; **404** if absent |
| `GET /api/standings` | `team_season` ordered by points desc, gd desc, gf desc (league table) |
| `GET /api/shots?club={team_id}&player={player_id}&match={match_id}` | `shots` rows, filtered (all filters optional) for shot maps |

**Live (speed):**
| `GET /api/live/matches` | `live_matches` rows |
| `GET /api/live/fixtures` | `fixtures` rows |
| `GET /api/live/standings` | `standings` rows (grouped, ranked) |

**Ops:**
| `GET /health` | `{status:"ok", tables:{<table>: <row_count>}}` |
| `GET /api/meta` | `{historic_updated, live_updated, source}` — freshness from file mtimes (`data/serving/*.parquet`, `data/live/matches_raw.json`) |

Responses are plain JSON (arrays for collections, object for single item); `snake_case` keys matching the table columns, so the frontend maps them directly.

## Component details

- **`db.py`** — `get_connection() -> duckdb connection` opened `read_only=True` on `apex.config.DUCKDB_PATH`; raises `DbUnavailable` if the file is missing or write-locked. A FastAPI dependency yields a connection per request and closes it. A helper `table_exists(con, name)` guards endpoints when a pipeline hasn't produced a table yet (return `[]` / empty rather than 500).
- **`queries.py`** — pure functions `fn(con, **params) -> list[dict]` (or `dict|None` for single-item). All SQL is parameterized (no string interpolation of user input; identifiers are fixed). Column `group` is quoted (`"group"`) — DuckDB reserved word. This layer is unit-tested directly against a fixture DB.
- **`models.py`** — pydantic models per response (`Club`, `PlayerSeason`, `TeamSeason`, `Shot`, `LiveMatch`, `Fixture`, `StandingRow`, `Meta`) with `from_attributes`; used as `response_model` for docs + validation.
- **`routers/*`** — thin: call a query function, 404 on `None` for single-item routes, return the list/dict.
- **`app.py`** — `FastAPI(title="APEX XI API")`; `CORSMiddleware(allow_origins=["*"])` (frontend dev); include both routers under `/api`; `/health` + `/api/meta`. Run: `uvicorn apex.api.app:app --port 8000`.

## Error handling

| Situation | Behavior |
|-----------|----------|
| DB file missing / write-locked | `503` `{detail:"data store unavailable"}` (via `DbUnavailable`) |
| Table not yet produced by a pipeline | endpoint returns `[]` (collections) — not a 500 |
| Single-item id not found | `404` |
| Bad query param (e.g. non-int `club`) | FastAPI `422` (automatic) |
| Unexpected SQL error | `500` with a generic message; details logged |

## Testing (TDD)

- `tests/api/conftest.py` — build a **small synthetic `apex.duckdb`** in a tmp dir (a few players across 2 clubs, 2 teams, a handful of shots, 2 live matches, a group's standings) and monkeypatch `apex.config.DUCKDB_PATH` to it; fixtures give deterministic expected values.
- `test_queries.py` — each query function against the fixture DB: filters (club/position/player/match), ordering (standings by points, players by minutes), single-item present/absent, `"group"` quoting, empty-table → `[]`.
- `test_historic_routes.py` / `test_live_routes.py` — FastAPI `TestClient`: status codes, JSON shape vs `response_model`, 404 for missing id, 422 for bad param, filter query params.
- `test_ops.py` — `/health` table counts; `/api/meta` freshness keys; `503` when the DB path is missing.
- Deps: add `fastapi`, `uvicorn[standard]`, `httpx` to `requirements.txt`.
- **Manual smoke** (separate task): run `uvicorn apex.api.app:app`, hit `/health`, `/api/clubs`, `/api/players?club=...`, `/api/live/standings`, open `/docs`.

## Out of scope (later / other sub-projects)

- The dashboard frontend (sub-project 4).
- Auth, rate-limiting, pagination beyond `limit` (YAGNI for a local dashboard).
- Writes / triggering refreshes from the API (the pipelines and `apex-live watch` own that).
- Per-match live detail (shot maps/momentum) — deferred with the speed layer's phase 2.
- WebSockets/streaming (frontend can poll `/api/live/*`).

## Risks / open items

- **DuckDB reader/writer contention:** while `apex build`/`apex-live refresh` holds the write lock, read-only opens fail. Mitigation: `DbUnavailable → 503`; writes are brief and manual. If it proves painful, a later option is to serve from a read replica / snapshot copy.
- **Empty live tables:** between/after matches `fixtures` may be empty and `live_matches` small — endpoints return `[]` cleanly; the frontend handles empty states.
- **Freshness visibility:** `/api/meta` exposes last-updated so the frontend can show staleness; keeping live data current requires running `apex-live watch` (documented) — the API itself does not scrape.
