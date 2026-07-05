# APEX XI — Live World Cup Speed Layer (Design Spec)

**Date:** 2026-07-05
**Status:** Approved (pending spec review)
**Scope:** Sub-project 2 of the APEX XI platform — the **speed layer** of the Lambda architecture. (Sub-project 1, the StatsBomb batch layer, is complete. Remaining: serving API, dashboard frontend.)
**Approach:** A — on-demand refresh + TTL cache + last-good fallback, unified DuckDB serving.

## Problem

The APEX XI dashboard's **Live / World Cup** side needs real-time WC 2026 data: current/live matches, the upcoming fixture schedule, and group standings. This spec builds the speed-layer pipeline that scrapes that data and writes it into the shared serving store the future API will query.

## Provider decision & verification

- Source: **ScraperFC** (`https://github.com/oseymour/ScraperFC`) → its **Sofascore** module.
- **Verified live (2026-07-05):** `Sofascore().get_valid_seasons("FIFA World Cup")` includes **`"2026"`**; `get_match_dicts("2026","FIFA World Cup")` returned **90 matches** with score/status/stage/kickoff and `hasXg: true`. (At check time 0 were `inprogress` — between matches — but the live mechanism, `status.type == "inprogress"`, is present.)
- **Caveat:** this is **web scraping** — fragile, rate-limited, ToS-gray. Resilience (throttle, retry, TTL cache, last-good fallback) is central, mirroring the batch layer's fail-safe discipline.

## Key decisions (locked)

| Decision | Choice |
|----------|--------|
| Source | ScraperFC → Sofascore, `LEAGUE="FIFA World Cup"`, `SEASON="2026"` |
| Outputs | `live_matches`, `fixtures`, `standings` (3 serving views) |
| Scrape surface | **ONE** call — `get_match_dicts(SEASON, LEAGUE)` — feeds all three views (standings computed from finished results) |
| Refresh model | On-demand with TTL cache (~45s) + last-good fallback; no daemon required |
| Serving store | The **same `apex.duckdb`** as the batch layer (`live_*` tables alongside historic tables) |
| Run model | CLI `apex-live refresh` (one pass) and `apex-live watch --interval 45` (loop) |
| Scraping isolation | `apex/live/client.py` is the ONLY module importing `ScraperFC` |

## Architecture & Data Flow

```
ScraperFC Sofascore  (league "FIFA World Cup", season "2026")
        │  apex-live refresh   (SINGLE scrape: get_match_dicts → ~90+ raw match dicts)
        ▼
data/live/matches_raw.json (+ matches_lastgood.json)   ← snapshot cache / fallback
        │  normalize + derive
        ├── live_matches  (LIVE now, plus kickoff within ±24h — recent + today)
        ├── fixtures      (SCHEDULED, sorted by kickoff)
        └── standings     (computed from FINISHED group-stage results, grouped + ranked)
        │  serve
        ▼
apex.duckdb   ← live_matches / fixtures / standings tables (ALONGSIDE batch tables)
```

**Invariants:** `client.py` is the only scraper; everything downstream sees normalized dicts, never raw Sofascore payloads. Live tables share `apex.duckdb` with the batch tables so the future API queries historic + live uniformly. On any scrape failure, serve the last-good snapshot — never crash.

## Project Structure (extends the existing `apex` package; batch code untouched)

```
apex/live/
  __init__.py
  config.py      # LEAGUE, SEASON, LIVE_TTL, LIVE_DIR, RAW_SNAPSHOT, LASTGOOD_SNAPSHOT; reuses apex.config.DUCKDB_PATH
  client.py      # SofascoreClient — sole scraper; throttle + retry; raises LiveDataError
  normalize.py   # normalize_match + derive_live/derive_fixtures/derive_standings + country_flag/map_status
  cache.py       # get_matches_cached(client, ttl, now_ts) -> (raw_matches, source)
  serve.py       # serve(now_ts) -> {source, counts}; writes 3 tables into apex.duckdb
  cli.py         # apex-live refresh | watch --interval 45
tests/live/
  __init__.py
  synthetic.py   # builders for synthetic Sofascore match_dicts (no network)
  test_normalize.py  test_derive.py  test_cache.py  test_serve.py  test_cli.py
data/live/       # gitignored raw snapshot + last-good
requirements.txt # add ScraperFC
```

## Component 1 — `client.py` (sole scraper)

- `class LiveDataError(Exception)`.
- `SofascoreClient(_scraper=None)` — uses `ScraperFC.Sofascore()` unless a fake is injected (tests).
- `get_wc_matches() -> list[dict]` — calls `scraper.get_match_dicts(SEASON, LEAGUE)`; wrapped in retry-with-backoff (a few attempts) + a politeness throttle (min seconds between real scrapes). On network error, empty result, or parse/block error → raise `LiveDataError`. Returns the full raw match-dict list or raises — never partial. Nothing else imports `ScraperFC`.

## Component 2 — `normalize.py`

- `map_status(t: str) -> str`: `inprogress→LIVE`, `notstarted→SCHEDULED`, `finished→FINISHED`, else `SCHEDULED` (logged).
- `country_flag(name: str) -> str`: WC-nation emoji map; unknown → 🏳️ (logged).
- `normalize_match(md: dict, now_ts: int) -> dict` → tidy `Match`:
  ```jsonc
  { "id": md["id"],
    "home_team": md["homeTeam"]["name"], "away_team": md["awayTeam"]["name"],
    "home_flag": country_flag(home), "away_flag": country_flag(away),
    "home_score": md.get("homeScore",{}).get("current"),   // None if not started
    "away_score": md.get("awayScore",{}).get("current"),
    "status": map_status(md["status"]["type"]),
    "minute": <int if LIVE (dict time field, else derived from startTimestamp) else None>,
    "stage": md.get("roundInfo",{}).get("name"),           // "Group A" / "Round of 16" / …
    "kickoff": <ISO from md["startTimestamp"]> }
  ```
- `derive_live(matches, now_ts) -> list`: every `LIVE` match, plus any with `|kickoff - now| <= 24h` (recent finished + today's upcoming), ordered by kickoff.
- `derive_fixtures(matches) -> list`: `SCHEDULED` only, sorted by kickoff ascending.
- `derive_standings(matches) -> list`: from `FINISHED` matches whose `stage` names a group ("Group X"): per team `played, w, d, l, gf, ga, gd, points`; rank within each group by (points, gd, gf). Knockout matches excluded (no table).

### Serving schemas
| table | columns |
|-------|---------|
| `live_matches` | id, home_team, away_team, home_flag, away_flag, home_score, away_score, status, minute, stage, kickoff |
| `fixtures` | id, home_team, away_team, home_flag, away_flag, stage, kickoff |
| `standings` | group, rank, team, flag, played, w, d, l, gf, ga, gd, points |

## Component 3 — `cache.py`

- `get_matches_cached(client, ttl, now_ts) -> (list[dict], str)`:
  1. If `RAW_SNAPSHOT` exists and `(now - mtime) < ttl` → load and return (`"cache"`).
  2. Else `client.get_wc_matches()`; on success write `RAW_SNAPSHOT` + `LASTGOOD_SNAPSHOT`, return (`"live"`).
  3. On `LiveDataError`: if `LASTGOOD_SNAPSHOT` exists → load, return (`"cache"`); else return `([], "unavailable")`.
- Never raises to callers. TTL from `config.LIVE_TTL` (~45s). One cache entry (raw match list) feeds all three derived views.

## Component 4 — `serve.py`

- `serve(now_ts) -> dict`: `raw, source = get_matches_cached(client, LIVE_TTL, now_ts)`; `normalize_match` each (skip a malformed dict with a logged warning); derive the three views; `CREATE OR REPLACE TABLE live_matches/fixtures/standings` in `apex.config.DUCKDB_PATH`. Returns `{"source": source, "live": n, "fixtures": n, "standings": n}`. If `raw` is empty and tables already exist, leave them intact (don't overwrite with empties) and report `source`.

## Component 5 — `cli.py`

- `apex-live refresh` → one `serve(now())` pass, prints source + counts.
- `apex-live watch --interval 45` → loop calling `serve` every interval; each iteration wrapped so a failure logs and the loop continues; Ctrl-C stops cleanly. Run via `python -m apex.live.cli refresh`.

## Error Handling

| Situation | Behavior |
|-----------|----------|
| Cache fresh | serve from snapshot, `source="cache"` |
| Scrape ok | write snapshot + last-good, `source="live"` |
| Scrape fails, last-good exists | serve last-good, `source="cache"`, warn |
| Scrape fails, no last-good | leave prior tables intact, `source="unavailable"`, error-log, no crash |
| One malformed match dict | skip it, log, continue |
| `watch` iteration error | log, continue looping |

## Testing (TDD)

- `tests/live/synthetic.py` — builders producing synthetic Sofascore `match_dict`s with the real key shape (`id`, `homeTeam.name`, `homeScore.current`, `status.type`, `roundInfo`, `startTimestamp`). No network.
- `test_normalize` — status/score/stage/kickoff/flag mapping; minute for LIVE vs None otherwise.
- `test_derive` — live ±24h window + LIVE inclusion; fixtures sorted & scheduled-only; standings points/W-D-L/group ranking from finished group matches (and knockout excluded).
- `test_cache` — TTL fresh-vs-cached (stub client, assert scrape called once); last-good fallback when the injected client raises `LiveDataError`; no-last-good → `([], "unavailable")`.
- `test_serve` — with a fake client returning synthetic matches, the 3 DuckDB tables are created with expected row counts; empty-scrape leaves existing tables intact.
- `test_cli` — `refresh` calls `serve` once (monkeypatched).
- Deps: add `ScraperFC` to `requirements.txt`.
- **Manual live smoke** (separate task, network): `apex-live refresh` against real Sofascore → tables populate; inspect live/fixtures/standings.

## Out of Scope (later)

Per-match detail (stats, shot maps, momentum, heatmaps), the serving REST API (queries these tables + batch tables), the dashboard frontend, non-WC competitions, historical WC seasons.

## Risks / Open Items

- **Scraping fragility / blocking:** Sofascore may rate-limit or change payloads. Mitigated by throttle + retry + TTL cache + last-good; the client is the single point to adapt if the payload shifts.
- **`minute` for live matches:** may be absent in the list dicts; derived from `startTimestamp` elapsed as a fallback (approximate). Precise minute would need `get_match_dict(match_id)` (deferred).
- **Match count (90 vs 104):** WC 2026 is 48 teams / 104 matches; the season may not be fully loaded or the tournament is near completion at check time. The pipeline is count-agnostic.
- **Stage/group parsing:** `derive_standings` depends on `roundInfo.name` naming groups as "Group X". If Sofascore labels differ, standings grouping adapts in `normalize`/`derive` only.
- **`country_flag` coverage:** needs the WC 2026 nations; unknown → 🏳️, logged.
