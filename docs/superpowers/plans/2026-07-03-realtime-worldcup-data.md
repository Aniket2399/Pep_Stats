# Real-Time World Cup 2026 Data — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dashboard's hardcoded France-vs-Argentina data with real, live FIFA World Cup 2026 data (live match, schedule, standings, top scorers) from football-data.org.

**Architecture:** A thin provider client (`ingestion/football_data.py`) is the only caller of football-data.org. `api/main.py` exposes REST endpoints that read through a Redis cache (per-key TTL + a long-lived "last-good" copy for fallback) and never crash. The React frontend polls those endpoints. Design "Approach A" from the spec.

**Tech Stack:** Python 3.11, FastAPI, `requests`, Redis (via existing `api/cache.py` `CacheManager`), pytest + fakeredis + httpx for tests; React 18 + TypeScript + Vite + Tailwind frontend.

## Global Constraints

- Provider: **football-data.org v4** only; base URL `https://api.football-data.org/v4`; auth header `X-Auth-Token`; key from env var `FOOTBALL_API_KEY` (already in `.env`).
- Competition: **FIFA World Cup**, code `WC`, current season (2026).
- Status mapping: `IN_PLAY,PAUSED`→`LIVE`; `SCHEDULED,TIMED`→`SCHEDULED`; `FINISHED,AWARDED`→`FINISHED`; anything else→`SCHEDULED` (logged).
- Normalized `Match` has **no** possession/shots fields (not on free tier).
- Every endpoint returns the envelope `{ "source": "live"|"cache"|"mock", "fetched_at": <iso>, "data": <payload> }` and must never raise to the client (three-tier fallback: live → last-good cache → labeled mock).
- Rate budget: free tier = 10 req/min; the `/matches` endpoint makes **one** upstream call per 45s.
- Do not modify existing sentiment/prediction/cache/WebSocket code or the databases.
- NumPy stays at 1.26.4 (already pinned in the environment); do not change it.

---

## File Structure

**New files:**
- `ingestion/football_data.py` — provider client + `Match` normalization + mapping helpers + `FootballDataError`.
- `Testing/test_football_data.py` — client unit tests (mocked HTTP).
- `Testing/test_match_endpoints.py` — backend endpoint tests (TestClient + fakeredis + mocked client).
- `Testing/fixtures/wc_matches.json`, `Testing/fixtures/wc_standings.json`, `Testing/fixtures/wc_scorers.json`, `Testing/fixtures/wc_match_detail.json` — recorded sample provider payloads for tests.
- `frontend/src/hooks/useMatches.ts` — fetches `/matches`, polls.

**Modified files:**
- `api/main.py` — add module-level client, `cached()`/`envelope()` helpers, and the 5 new endpoints.
- `frontend/src/hooks/useMatchData.ts` — new `Match` interface (no stats), envelope unwrap, LIVE polling, drop `/stats`.
- `frontend/src/pages/TournamentPage.tsx` — remove hardcoded arrays; render live/upcoming/recent/standings/scorers.
- `frontend/src/pages/LiveMatchPage.tsx` — drive off `useMatchData`; live score + events; no stats.
- `frontend/src/components/MatchCard.tsx` — render normalized `Match`; remove possession/shots UI.
- `frontend/src/config/api.ts` — drop `matchStats`.
- `env.example` — comment `FOOTBALL_API_KEY` is a football-data.org key.
- `gitignore` → rename to `.gitignore`.
- `requirements.txt` — add `fakeredis`, `httpx` (test deps).

---

## Task 1: Setup — secrets hygiene, test deps, fixtures

**Files:**
- Rename: `gitignore` → `.gitignore`
- Modify: `requirements.txt`, `env.example`
- Create: `Testing/fixtures/wc_matches.json`, `Testing/fixtures/wc_standings.json`, `Testing/fixtures/wc_scorers.json`, `Testing/fixtures/wc_match_detail.json`

- [ ] **Step 1: Protect `.env` — rename the ignore file and confirm it lists `.env`**

Run:
```bash
cd /Users/annie/Documents/All_Projects/FIFA_Data_Project
mv gitignore .gitignore
grep -n '^\.env' .gitignore
```
Expected: prints `.env` (line ~35). `.env` is now ignored once git is initialized.

- [ ] **Step 2: Install test dependencies**

Run:
```bash
./venv/bin/pip install fakeredis httpx
```
Expected: `Successfully installed fakeredis-... httpx-...`

- [ ] **Step 3: Add the test deps to `requirements.txt`**

Append under the `# Development` section of `requirements.txt`:
```
fakeredis==2.23.3
httpx==0.27.0
```
(If pip installed different versions in Step 2, use those exact versions — run `./venv/bin/pip show fakeredis httpx | grep Version`.)

- [ ] **Step 4: Clarify the env var in `env.example`**

Change the top of `env.example` from:
```
# Football Data API
FOOTBALL_API_KEY=your_api_key_here
```
to:
```
# Football Data API — get a free key at https://www.football-data.org/client/register
FOOTBALL_API_KEY=your_api_key_here
```

- [ ] **Step 5: Create the recorded fixtures directory and files**

Create `Testing/fixtures/wc_matches.json` (trimmed real football-data.org shape — one of each status):
```json
{
  "matches": [
    {
      "id": 537301, "utcDate": "2026-07-03T20:00:00Z", "status": "IN_PLAY",
      "stage": "LAST_16", "minute": 63, "venue": "MetLife Stadium",
      "homeTeam": {"id": 818, "name": "Colombia"},
      "awayTeam": {"id": 1063, "name": "Ghana"},
      "score": {"fullTime": {"home": 1, "away": 0}}
    },
    {
      "id": 537121, "utcDate": "2026-07-04T17:00:00Z", "status": "TIMED",
      "stage": "LAST_16", "minute": null, "venue": "BC Place",
      "homeTeam": {"id": 8608, "name": "Canada"},
      "awayTeam": {"id": 815, "name": "Morocco"},
      "score": {"fullTime": {"home": null, "away": null}}
    },
    {
      "id": 537000, "utcDate": "2026-06-30T21:00:00Z", "status": "FINISHED",
      "stage": "GROUP_STAGE", "minute": null, "venue": "SoFi Stadium",
      "homeTeam": {"id": 773, "name": "France"},
      "awayTeam": {"id": 762, "name": "Argentina"},
      "score": {"fullTime": {"home": 2, "away": 1}}
    }
  ]
}
```

Create `Testing/fixtures/wc_standings.json`:
```json
{
  "standings": [
    {
      "stage": "GROUP_STAGE", "type": "TOTAL", "group": "GROUP_A",
      "table": [
        {"position": 1, "team": {"name": "France"}, "won": 3, "draw": 0, "lost": 0, "goalsFor": 8, "goalsAgainst": 1, "points": 9},
        {"position": 2, "team": {"name": "Argentina"}, "won": 2, "draw": 0, "lost": 1, "goalsFor": 5, "goalsAgainst": 3, "points": 6}
      ]
    }
  ]
}
```

Create `Testing/fixtures/wc_scorers.json`:
```json
{
  "scorers": [
    {"player": {"name": "Kylian Mbappe", "nationality": "France"}, "team": {"name": "France"}, "goals": 5, "assists": 2},
    {"player": {"name": "Lionel Messi", "nationality": "Argentina"}, "team": {"name": "Argentina"}, "goals": 4, "assists": 1}
  ]
}
```

Create `Testing/fixtures/wc_match_detail.json`:
```json
{
  "id": 537301, "utcDate": "2026-07-03T20:00:00Z", "status": "IN_PLAY",
  "stage": "LAST_16", "minute": 63, "venue": "MetLife Stadium",
  "homeTeam": {"id": 818, "name": "Colombia"},
  "awayTeam": {"id": 1063, "name": "Ghana"},
  "score": {"fullTime": {"home": 1, "away": 0}},
  "goals": [
    {"minute": 34, "scorer": {"name": "Luis Diaz"}, "team": {"name": "Colombia"}}
  ]
}
```

- [ ] **Step 6: Commit**

```bash
git add .gitignore requirements.txt env.example Testing/fixtures/
git commit -m "chore: secrets hygiene, test deps, WC data fixtures"
```
(If git is not yet initialized, run `git init && git add -A && git commit -m "chore: initial commit"` first, then this commit. `.gitignore` now keeps `.env` out.)

---

## Task 2: Client — mapping helpers (`map_status`, `country_to_flag`)

**Files:**
- Create: `ingestion/football_data.py`
- Test: `Testing/test_football_data.py`

**Interfaces:**
- Produces: `map_status(s: str) -> str` (`"LIVE"|"SCHEDULED"|"FINISHED"`); `country_to_flag(name: str) -> str`; `class FootballDataError(Exception)`.

- [ ] **Step 1: Write the failing test**

Create `Testing/test_football_data.py`:
```python
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "ingestion"))
import football_data as fd


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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./venv/bin/python -m pytest Testing/test_football_data.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'football_data'`.

- [ ] **Step 3: Write minimal implementation**

Create `ingestion/football_data.py`:
```python
"""
football-data.org v4 client for FIFA World Cup 2026.
The ONLY module that talks to the provider. Returns normalized data only.
"""
import os
import logging
from datetime import datetime, timezone
from typing import Optional

import requests

logger = logging.getLogger(__name__)

BASE_URL = "https://api.football-data.org/v4"
COMPETITION = "WC"


class FootballDataError(Exception):
    """Raised on any provider failure (bad key, quota, network, non-200)."""


_STATUS = {
    "IN_PLAY": "LIVE", "PAUSED": "LIVE",
    "SCHEDULED": "SCHEDULED", "TIMED": "SCHEDULED",
    "FINISHED": "FINISHED", "AWARDED": "FINISHED",
}


def map_status(s: str) -> str:
    mapped = _STATUS.get(s)
    if mapped is None:
        logger.warning("Unknown match status %r -> SCHEDULED", s)
        return "SCHEDULED"
    return mapped


_FLAGS = {
    "France": "🇫🇷", "Argentina": "🇦🇷", "Spain": "🇪🇸", "England": "🏴",
    "Brazil": "🇧🇷", "Germany": "🇩🇪", "Portugal": "🇵🇹", "Netherlands": "🇳🇱",
    "Belgium": "🇧🇪", "Croatia": "🇭🇷", "Italy": "🇮🇹", "Uruguay": "🇺🇾",
    "Colombia": "🇨🇴", "Ghana": "🇬🇭", "Morocco": "🇲🇦", "Canada": "🇨🇦",
    "United States": "🇺🇸", "Mexico": "🇲🇽", "Japan": "🇯🇵", "South Korea": "🇰🇷",
    "Senegal": "🇸🇳", "Nigeria": "🇳🇬", "Australia": "🇦🇺", "Switzerland": "🇨🇭",
    "Denmark": "🇩🇰", "Poland": "🇵🇱", "Norway": "🇳🇴", "Paraguay": "🇵🇾",
    "Ecuador": "🇪🇨", "Serbia": "🇷🇸", "Cameroon": "🇨🇲", "Ivory Coast": "🇨🇮",
    "Saudi Arabia": "🇸🇦", "Qatar": "🇶🇦", "Iran": "🇮🇷", "Wales": "🏴",
    "Costa Rica": "🇨🇷", "Tunisia": "🇹🇳", "Algeria": "🇩🇿", "Egypt": "🇪🇬",
}


def country_to_flag(name: str) -> str:
    flag = _FLAGS.get(name)
    if flag is None:
        logger.warning("No flag emoji for %r", name)
        return "🏳️"
    return flag
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./venv/bin/python -m pytest Testing/test_football_data.py -q`
Expected: PASS (6 passed).

- [ ] **Step 5: Commit**

```bash
git add ingestion/football_data.py Testing/test_football_data.py
git commit -m "feat: football_data mapping helpers (status, flags)"
```

---

## Task 3: Client — match normalization + `get_matches`/`get_match`

**Files:**
- Modify: `ingestion/football_data.py`
- Test: `Testing/test_football_data.py`

**Interfaces:**
- Consumes: `map_status`, `country_to_flag`, `FootballDataError`.
- Produces:
  - `elapsed_minutes(utc_date: str, now: datetime) -> int`
  - `class FootballDataClient(api_key=None, base_url=BASE_URL)` with `_get(path, params=None) -> dict`, `_normalize_match(m: dict, now=None) -> dict`, `get_matches() -> dict` (`{"live":[Match],"upcoming":[Match],"recent":[Match]}`), `get_match(mid: int) -> Optional[Match]`.
  - `Match` = `{"id":int,"team1":{"name","flag","score"},"team2":{...},"time":str,"stadium":Optional[str],"status":str}`.

- [ ] **Step 1: Write the failing test**

Append to `Testing/test_football_data.py`:
```python
import json
from datetime import datetime, timezone

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./venv/bin/python -m pytest Testing/test_football_data.py -q`
Expected: FAIL — `AttributeError: module 'football_data' has no attribute 'elapsed_minutes'`.

- [ ] **Step 3: Write minimal implementation**

Append to `ingestion/football_data.py`:
```python
def elapsed_minutes(utc_date: str, now: datetime) -> int:
    start = datetime.fromisoformat(utc_date.replace("Z", "+00:00"))
    mins = int((now - start).total_seconds() // 60)
    return max(0, min(mins, 130))


class FootballDataClient:
    def __init__(self, api_key: Optional[str] = None, base_url: str = BASE_URL):
        self.api_key = api_key or os.getenv("FOOTBALL_API_KEY")
        self.base_url = base_url

    def _get(self, path: str, params: Optional[dict] = None) -> dict:
        try:
            resp = requests.get(
                f"{self.base_url}/{path}",
                headers={"X-Auth-Token": self.api_key or ""},
                params=params or {},
                timeout=15,
            )
        except requests.RequestException as e:
            raise FootballDataError(f"request failed: {e}")
        if resp.status_code != 200:
            raise FootballDataError(f"HTTP {resp.status_code}: {resp.text[:200]}")
        return resp.json()

    def _normalize_match(self, m: dict, now: Optional[datetime] = None) -> dict:
        status = map_status(m["status"])
        home = m["homeTeam"]["name"]
        away = m["awayTeam"]["name"]
        ft = m.get("score", {}).get("fullTime", {})
        if status == "LIVE":
            minute = m.get("minute")
            if minute:
                time = f"{minute}'"
            else:
                time = f"{elapsed_minutes(m['utcDate'], now or datetime.now(timezone.utc))}'"
        else:
            time = m["utcDate"]
        return {
            "id": m["id"],
            "team1": {"name": home, "flag": country_to_flag(home), "score": ft.get("home") or 0},
            "team2": {"name": away, "flag": country_to_flag(away), "score": ft.get("away") or 0},
            "time": time,
            "stadium": m.get("venue"),
            "status": status,
        }

    def get_matches(self) -> dict:
        matches = self._get(f"competitions/{COMPETITION}/matches").get("matches", [])
        live, upcoming, recent = [], [], []
        for m in matches:
            s = map_status(m["status"])
            if s == "LIVE":
                live.append(self._normalize_match(m))
            elif s == "SCHEDULED":
                upcoming.append(m)
            else:
                recent.append(m)
        upcoming.sort(key=lambda x: x["utcDate"])
        recent.sort(key=lambda x: x["utcDate"], reverse=True)
        return {
            "live": live,
            "upcoming": [self._normalize_match(m) for m in upcoming[:10]],
            "recent": [self._normalize_match(m) for m in recent[:5]],
        }

    def get_match(self, mid: int) -> Optional[dict]:
        m = self._get(f"matches/{mid}")
        if not m or "id" not in m:
            return None
        return self._normalize_match(m)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./venv/bin/python -m pytest Testing/test_football_data.py -q`
Expected: PASS (11 passed).

- [ ] **Step 5: Commit**

```bash
git add ingestion/football_data.py Testing/test_football_data.py
git commit -m "feat: football_data match normalization + get_matches/get_match"
```

---

## Task 4: Client — `get_standings`, `get_topscorers`, `get_events`

**Files:**
- Modify: `ingestion/football_data.py`
- Test: `Testing/test_football_data.py`

**Interfaces:**
- Produces on `FootballDataClient`:
  - `get_standings() -> list[dict]` — rows `{group,rank,team,flag,w,d,l,gf,ga,pts}`.
  - `get_topscorers() -> list[dict]` — rows `{rank,player,team,flag,goals,assists}`.
  - `get_events(mid: int) -> list[dict]` — `{minute,type,team,player}` (goals only; `[]` if none).

- [ ] **Step 1: Write the failing test**

Append to `Testing/test_football_data.py`:
```python
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./venv/bin/python -m pytest Testing/test_football_data.py -q`
Expected: FAIL — `AttributeError: 'FootballDataClient' object has no attribute 'get_standings'`.

- [ ] **Step 3: Write minimal implementation**

Append these methods inside `class FootballDataClient` in `ingestion/football_data.py`:
```python
    def get_standings(self) -> list:
        data = self._get(f"competitions/{COMPETITION}/standings")
        rows = []
        for block in data.get("standings", []):
            if block.get("type") != "TOTAL":
                continue
            group = block.get("group")
            for r in block.get("table", []):
                rows.append({
                    "group": group,
                    "rank": r["position"],
                    "team": r["team"]["name"],
                    "flag": country_to_flag(r["team"]["name"]),
                    "w": r["won"], "d": r["draw"], "l": r["lost"],
                    "gf": r["goalsFor"], "ga": r["goalsAgainst"], "pts": r["points"],
                })
        return rows

    def get_topscorers(self) -> list:
        data = self._get(f"competitions/{COMPETITION}/scorers")
        rows = []
        for i, s in enumerate(data.get("scorers", []), start=1):
            nat = s["player"].get("nationality") or s.get("team", {}).get("name", "")
            rows.append({
                "rank": i,
                "player": s["player"]["name"],
                "team": s.get("team", {}).get("name", ""),
                "flag": country_to_flag(nat),
                "goals": s.get("goals") or 0,
                "assists": s.get("assists") or 0,
            })
        return rows

    def get_events(self, mid: int) -> list:
        m = self._get(f"matches/{mid}")
        out = []
        for g in m.get("goals", []) or []:
            out.append({
                "minute": g.get("minute"),
                "type": "goal",
                "team": g.get("team", {}).get("name", ""),
                "player": g.get("scorer", {}).get("name", ""),
            })
        return out
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./venv/bin/python -m pytest Testing/test_football_data.py -q`
Expected: PASS (15 passed).

- [ ] **Step 5: Commit**

```bash
git add ingestion/football_data.py Testing/test_football_data.py
git commit -m "feat: football_data standings, scorers, events"
```

---

## Task 5: Client — error handling raises `FootballDataError`

**Files:**
- Modify: `ingestion/football_data.py` (already handled in `_get`; this task locks it with tests)
- Test: `Testing/test_football_data.py`

**Interfaces:**
- Consumes: `FootballDataClient._get`, `FootballDataError`.

- [ ] **Step 1: Write the failing test**

Append to `Testing/test_football_data.py`:
```python
import pytest

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
```

- [ ] **Step 2: Run test to verify it passes (already implemented in `_get`)**

Run: `./venv/bin/python -m pytest Testing/test_football_data.py -q`
Expected: PASS (18 passed). If any FAIL, ensure `_get` raises `FootballDataError` on non-200 and on `requests.RequestException` (see Task 3 Step 3).

- [ ] **Step 3: Commit**

```bash
git add Testing/test_football_data.py
git commit -m "test: football_data raises FootballDataError on 403/429/network"
```

---

## Task 6: Backend — `cached()` + `envelope()` helpers

**Files:**
- Modify: `api/main.py`
- Test: `Testing/test_match_endpoints.py`

**Interfaces:**
- Consumes: `CacheManager` (`.get(key)`, `.set(key, value, ttl)`), `FootballDataError`.
- Produces (module-level in `api/main.py`):
  - `cached(cache, key, ttl, fetch_fn) -> tuple[Any, str]` — returns `(data, source)`, `source ∈ {"live","cache"}`; raises `FootballDataError` only when miss + no last-good.
  - `envelope(cache, key, ttl, fetch_fn, mock) -> dict` — `{"source","fetched_at","data"}`, never raises.

- [ ] **Step 1: Write the failing test**

Create `Testing/test_match_endpoints.py`:
```python
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

def test_envelope_live():
    from api import main
    cache = make_cache()
    env = main.envelope(cache, "k2", 60, lambda: [1, 2], mock=[])
    assert env["source"] == "live" and env["data"] == [1, 2]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./venv/bin/python -m pytest Testing/test_match_endpoints.py -q`
Expected: FAIL — `AttributeError: module 'api.main' has no attribute 'cached'`.

- [ ] **Step 3: Write minimal implementation**

In `api/main.py`, add the provider import near the other Phase 2 imports (after `from api.cache import CacheManager, MatchCache`):
```python
from ingestion.football_data import FootballDataClient, FootballDataError
```
Then add these helpers after the component-initialization block (after `cache`/`match_cache` are set up, before the Pydantic models):
```python
from datetime import timezone

LASTGOOD_TTL = 7 * 24 * 3600  # 1 week

# WC data provider (reads FOOTBALL_API_KEY from env; safe if key missing)
try:
    football = FootballDataClient()
    logger.info("✅ Football data client loaded")
except Exception as e:  # pragma: no cover
    logger.error(f"❌ Football data client error: {e}")
    football = None


def cached(cache, key, ttl, fetch_fn):
    """Return (data, source). Raises FootballDataError only on miss with no last-good."""
    if cache is not None:
        hit = cache.get(key)
        if hit is not None:
            return hit, "cache"
    try:
        fresh = fetch_fn()
        if cache is not None:
            cache.set(key, fresh, ttl)
            cache.set(f"{key}:lastgood", fresh, LASTGOOD_TTL)
        return fresh, "live"
    except FootballDataError:
        if cache is not None:
            lg = cache.get(f"{key}:lastgood")
            if lg is not None:
                return lg, "cache"
        raise


def envelope(cache, key, ttl, fetch_fn, mock):
    """Never raises. Wraps cached() with a labeled-mock fallback."""
    try:
        data, source = cached(cache, key, ttl, fetch_fn)
    except FootballDataError:
        data, source = mock, "mock"
    return {
        "source": source,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "data": data,
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./venv/bin/python -m pytest Testing/test_match_endpoints.py -q`
Expected: PASS (4 passed).

- [ ] **Step 5: Commit**

```bash
git add api/main.py Testing/test_match_endpoints.py
git commit -m "feat: cached() + envelope() cache/fallback helpers"
```

---

## Task 7: Backend — the five REST endpoints

**Files:**
- Modify: `api/main.py`
- Test: `Testing/test_match_endpoints.py`

**Interfaces:**
- Consumes: `envelope`, module globals `cache` and `football`.
- Produces endpoints: `GET /matches`, `GET /match/{mid}`, `GET /match/{mid}/events`, `GET /standings`, `GET /leaderboards`. Each returns the envelope dict.

- [ ] **Step 1: Write the failing test**

Append to `Testing/test_match_endpoints.py`:
```python
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./venv/bin/python -m pytest Testing/test_match_endpoints.py -q`
Expected: FAIL — `assert 404 == 200` (routes not defined yet).

- [ ] **Step 3: Write minimal implementation**

In `api/main.py`, add these routes in the "SENTIMENT ANALYSIS ENDPOINTS" area or a new "WORLD CUP DATA ENDPOINTS" section (anywhere after `envelope` is defined and `app` exists):
```python
# ============================================================================
# WORLD CUP DATA ENDPOINTS (real-time via football-data.org)
# ============================================================================

@app.get("/matches")
def get_matches():
    return envelope(cache, "wc:matches", 45,
                    football.get_matches,
                    {"live": [], "upcoming": [], "recent": []})

@app.get("/match/{mid}")
def get_match(mid: int):
    def fetch():
        m = football.get_match(mid)
        if m is None:
            raise FootballDataError(f"match {mid} not found")
        return m
    return envelope(cache, f"wc:match:{mid}", 45, fetch, {})

@app.get("/match/{mid}/events")
def get_match_events_wc(mid: int):
    return envelope(cache, f"wc:events:{mid}", 45,
                    lambda: football.get_events(mid), [])

@app.get("/standings")
def get_standings():
    return envelope(cache, "wc:standings", 3600, football.get_standings, [])

@app.get("/leaderboards")
def get_leaderboards():
    return envelope(cache, "wc:scorers", 21600, football.get_topscorers, [])
```
Note: the function name `get_match_events_wc` avoids colliding with any existing function; the route path is what matters.

- [ ] **Step 4: Run test to verify it passes**

Run: `./venv/bin/python -m pytest Testing/test_match_endpoints.py -q`
Expected: PASS (9 passed).

- [ ] **Step 5: Full backend test run**

Run: `./venv/bin/python -m pytest Testing/test_football_data.py Testing/test_match_endpoints.py -q`
Expected: PASS (all, ~27 tests).

- [ ] **Step 6: Commit**

```bash
git add api/main.py Testing/test_match_endpoints.py
git commit -m "feat: WC data REST endpoints (matches, match, events, standings, leaderboards)"
```

---

## Task 8: Frontend — `Match` type, api.ts, hooks

**Files:**
- Modify: `frontend/src/hooks/useMatchData.ts`, `frontend/src/config/api.ts`
- Create: `frontend/src/hooks/useMatches.ts`

**Interfaces:**
- Produces: `Match` interface (no possession/shots); `useMatchData(matchId?)` returns `{ match, events, loading, error, refetch }`; `useMatches()` returns `{ live, upcoming, recent, loading, error }`.
- Consumes (backend): every endpoint returns `{ source, fetched_at, data }` — unwrap `.data.data` from axios.

- [ ] **Step 1: Rewrite `useMatchData.ts`**

Replace the entire contents of `frontend/src/hooks/useMatchData.ts` with:
```ts
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { ENDPOINTS } from '@config/api';

export interface Team {
  name: string;
  flag: string;
  score: number;
}

export interface Match {
  id: number;
  team1: Team;
  team2: Team;
  time: string;
  stadium: string | null;
  status: 'LIVE' | 'SCHEDULED' | 'FINISHED';
}

export interface GoalEvent {
  minute: number | null;
  type: string;
  team: string;
  player: string;
}

export function useMatchData(matchId?: number) {
  const [match, setMatch] = useState<Match | null>(null);
  const [events, setEvents] = useState<GoalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatch = useCallback(async (id: number) => {
    try {
      setError(null);
      const [matchRes, evRes] = await Promise.all([
        axios.get(ENDPOINTS.match(id), { timeout: 10000 }),
        axios.get(ENDPOINTS.matchEvents(id), { timeout: 10000 }),
      ]);
      setMatch(matchRes.data.data);
      setEvents(evRes.data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch match data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!matchId) return;
    fetchMatch(matchId);
  }, [matchId, fetchMatch]);

  // Poll every 30s while the match is live
  useEffect(() => {
    if (!matchId || match?.status !== 'LIVE') return;
    const t = setInterval(() => fetchMatch(matchId), 30000);
    return () => clearInterval(t);
  }, [matchId, match?.status, fetchMatch]);

  return { match, events, loading, error, refetch: () => matchId && fetchMatch(matchId) };
}

export default useMatchData;
```

- [ ] **Step 2: Create `useMatches.ts`**

Create `frontend/src/hooks/useMatches.ts`:
```ts
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { ENDPOINTS } from '@config/api';
import type { Match } from './useMatchData';

interface MatchesBundle {
  live: Match[];
  upcoming: Match[];
  recent: Match[];
}

export function useMatches() {
  const [bundle, setBundle] = useState<MatchesBundle>({ live: [], upcoming: [], recent: [] });
  const [source, setSource] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    try {
      setError(null);
      const res = await axios.get(ENDPOINTS.matches, { timeout: 10000 });
      setBundle(res.data.data);
      setSource(res.data.source);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch matches');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
    const t = setInterval(fetchMatches, 45000);
    return () => clearInterval(t);
  }, [fetchMatches]);

  return { ...bundle, source, loading, error };
}

export default useMatches;
```

- [ ] **Step 3: Trim `config/api.ts`**

In `frontend/src/config/api.ts`, delete the `matchStats` and `matchPossession` lines inside `ENDPOINTS` (they are no longer available on the free tier):
```ts
  // DELETE these two lines:
  matchStats: (id: number) => `${API_BASE_URL}/match/${id}/stats`,
  matchPossession: (id: number) => `${API_BASE_URL}/match/${id}/possession`,
```
Leave `matches`, `match`, `matchEvents`, `standings`, `leaderboards` as-is.

- [ ] **Step 4: Typecheck**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors related to `useMatchData.ts`, `useMatches.ts`, `api.ts`. (Errors may remain in `TournamentPage`/`LiveMatchPage`/`MatchCard` until Tasks 9–10 — that is expected; verify none originate from the three files in this task.)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/useMatchData.ts frontend/src/hooks/useMatches.ts frontend/src/config/api.ts
git commit -m "feat(frontend): Match type + useMatches/useMatchData hooks (envelope-aware, polling)"
```

---

## Task 9: Frontend — `TournamentPage` on real data

**Files:**
- Modify: `frontend/src/pages/TournamentPage.tsx`
- Test: manual (dev server)

**Interfaces:**
- Consumes: `useMatches()`, `ENDPOINTS.standings`, `ENDPOINTS.leaderboards`, `Match`.

- [ ] **Step 1: Rewrite `TournamentPage.tsx`**

Replace the entire contents of `frontend/src/pages/TournamentPage.tsx` with:
```tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Trophy, Target, Radio } from 'lucide-react';
import { ENDPOINTS } from '@config/api';
import { useMatches } from '@hooks/useMatches';
import type { Match } from '@hooks/useMatchData';

interface StandingRow {
  group: string; rank: number; team: string; flag: string;
  w: number; d: number; l: number; gf: number; ga: number; pts: number;
}
interface Scorer {
  rank: number; player: string; team: string; flag: string; goals: number; assists: number;
}

function MatchRow({ m }: { m: Match }) {
  const isLive = m.status === 'LIVE';
  return (
    <Link to={`/match/${m.id}`}
      className="flex items-center justify-between bg-white rounded-lg border p-4 hover:shadow-md transition">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{m.team1.flag}</span>
        <span className="font-semibold">{m.team1.name}</span>
      </div>
      <div className="text-center">
        {m.status === 'SCHEDULED'
          ? <span className="text-sm text-gray-500">{new Date(m.time).toLocaleString()}</span>
          : <span className="text-xl font-bold">{m.team1.score} - {m.team2.score}</span>}
        <div className={`text-xs ${isLive ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
          {isLive ? `🔴 LIVE ${m.time}` : m.status}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-semibold">{m.team2.name}</span>
        <span className="text-2xl">{m.team2.flag}</span>
      </div>
    </Link>
  );
}

export default function TournamentPage() {
  const { live, upcoming, recent, source, loading: matchesLoading, error: matchesError } = useMatches();
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [scorers, setScorers] = useState<Scorer[]>([]);

  useEffect(() => {
    axios.get(ENDPOINTS.standings).then(r => setStandings(r.data.data)).catch(() => {});
    axios.get(ENDPOINTS.leaderboards).then(r => setScorers(r.data.data)).catch(() => {});
  }, []);

  const heroMatches = live.length > 0
    ? live
    : [...upcoming.slice(0, 1), ...recent.slice(0, 1)];

  return (
    <div className="min-h-screen bg-fifa-light">
      <div className="bg-gradient-to-r from-fifa-navy to-fifa-green py-12">
        <div className="container text-center">
          <h1 className="text-5xl font-bold text-white mb-2">🏆 FIFA WORLD CUP 2026</h1>
          <p className="text-fifa-gold font-semibold">Real-Time Tournament Analytics</p>
          {source && (
            <span className="inline-block mt-2 text-xs px-2 py-1 rounded bg-black/20 text-white">
              {source === 'mock' ? '⚠️ sample data' : `● ${source} data`}
            </span>
          )}
        </div>
      </div>

      <div className="container py-10 space-y-14">
        {/* Live / hero */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Radio className="text-red-600" size={28} />
            <h2 className="text-2xl font-bold text-fifa-navy">
              {live.length > 0 ? 'Live Now' : 'Featured'}
            </h2>
          </div>
          {matchesLoading && <p className="text-gray-500">Loading matches…</p>}
          {matchesError && <p className="text-red-600">Could not load matches: {matchesError}</p>}
          {!matchesLoading && !matchesError && heroMatches.length === 0 && (
            <p className="text-gray-500">No matches available right now.</p>
          )}
          <div className="grid gap-3">
            {heroMatches.map(m => <MatchRow key={m.id} m={m} />)}
          </div>
        </section>

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-fifa-navy mb-4">📅 Upcoming Matches</h2>
            <div className="grid gap-3">{upcoming.map(m => <MatchRow key={m.id} m={m} />)}</div>
          </section>
        )}

        {/* Recent */}
        {recent.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-fifa-navy mb-4">✅ Recent Results</h2>
            <div className="grid gap-3">{recent.map(m => <MatchRow key={m.id} m={m} />)}</div>
          </section>
        )}

        {/* Standings */}
        {standings.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="text-fifa-gold" size={28} />
              <h2 className="text-2xl font-bold text-fifa-navy">Standings</h2>
            </div>
            <div className="overflow-x-auto bg-white rounded-lg border">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-fifa-gold bg-fifa-light text-fifa-navy">
                    <th className="text-left py-2 px-3">Grp</th>
                    <th className="text-left py-2 px-3">#</th>
                    <th className="text-left py-2 px-3">Team</th>
                    <th className="py-2 px-3">W</th><th className="py-2 px-3">D</th>
                    <th className="py-2 px-3">L</th><th className="py-2 px-3">GD</th>
                    <th className="py-2 px-3 text-fifa-gold">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((r, i) => (
                    <tr key={i} className="border-b hover:bg-fifa-light">
                      <td className="py-2 px-3 text-xs text-gray-500">{r.group?.replace('GROUP_', '')}</td>
                      <td className="py-2 px-3 font-bold">{r.rank}</td>
                      <td className="py-2 px-3"><span className="mr-2">{r.flag}</span>{r.team}</td>
                      <td className="py-2 px-3 text-center">{r.w}</td>
                      <td className="py-2 px-3 text-center">{r.d}</td>
                      <td className="py-2 px-3 text-center">{r.l}</td>
                      <td className="py-2 px-3 text-center">{r.gf - r.ga > 0 ? '+' : ''}{r.gf - r.ga}</td>
                      <td className="py-2 px-3 text-center font-bold text-fifa-gold">{r.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Top scorers */}
        {scorers.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Target className="text-fifa-gold" size={28} />
              <h2 className="text-2xl font-bold text-fifa-navy">⭐ Top Scorers</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {scorers.slice(0, 8).map((p) => (
                <div key={p.rank} className="card card-gold p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-3xl">{p.flag}</div>
                      <h3 className="font-bold text-fifa-navy">{p.player}</h3>
                      <p className="text-sm text-gray-600">{p.team}</p>
                    </div>
                    <div className="bg-fifa-gold text-fifa-navy font-bold rounded-full w-12 h-12 flex items-center justify-center text-xl">
                      {p.goals}
                    </div>
                  </div>
                  <span className="badge badge-navy mt-2 inline-block">Assists: {p.assists}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors in `TournamentPage.tsx` (LiveMatchPage/MatchCard may still error until Task 10).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/TournamentPage.tsx
git commit -m "feat(frontend): TournamentPage renders real live/upcoming/standings/scorers"
```

---

## Task 10: Frontend — `LiveMatchPage` + `MatchCard`

**Files:**
- Modify: `frontend/src/pages/LiveMatchPage.tsx`, `frontend/src/components/MatchCard.tsx`
- Test: manual (dev server)

**Interfaces:**
- Consumes: `useMatchData(id)`, `Match`, `GoalEvent`.

- [ ] **Step 1: Rewrite `MatchCard.tsx`**

Replace the entire contents of `frontend/src/components/MatchCard.tsx` with:
```tsx
import React from 'react';
import { MapPin, Clock } from 'lucide-react';
import type { Match } from '@hooks/useMatchData';

export default function MatchCard({ match }: { match: Match }) {
  const isLive = match.status === 'LIVE';
  return (
    <div className="bg-white rounded-lg border-2 border-fifa-light p-6">
      {isLive && (
        <span className="inline-flex items-center gap-1 text-red-600 font-bold text-sm mb-3">
          <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" /> LIVE {match.time}
        </span>
      )}
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <div className="text-4xl">{match.team1.flag}</div>
          <div className="font-bold text-fifa-navy">{match.team1.name}</div>
        </div>
        <div className="text-center px-4">
          {match.status === 'SCHEDULED'
            ? <div className="flex items-center gap-1 text-gray-500 text-sm"><Clock size={14} />{new Date(match.time).toLocaleString()}</div>
            : <div className="text-3xl font-bold text-fifa-navy">{match.team1.score} - {match.team2.score}</div>}
        </div>
        <div className="text-center flex-1">
          <div className="text-4xl">{match.team2.flag}</div>
          <div className="font-bold text-fifa-navy">{match.team2.name}</div>
        </div>
      </div>
      {match.stadium && (
        <div className="flex items-center justify-center gap-1 text-gray-500 text-sm mt-4">
          <MapPin size={14} /> {match.stadium}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Rewrite `LiveMatchPage.tsx`**

Replace the entire contents of `frontend/src/pages/LiveMatchPage.tsx` with:
```tsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMatchData } from '@hooks/useMatchData';
import MatchCard from '@components/MatchCard';

export default function LiveMatchPage() {
  const { id } = useParams();
  const matchId = id ? parseInt(id, 10) : undefined;
  const { match, events, loading, error } = useMatchData(matchId);

  return (
    <div className="min-h-screen bg-fifa-light">
      <div className="container py-8">
        <Link to="/" className="text-fifa-navy hover:underline">← Back to tournament</Link>

        {loading && <p className="text-gray-500 mt-6">Loading match…</p>}
        {error && <p className="text-red-600 mt-6">Could not load match: {error}</p>}
        {!loading && !error && !match && <p className="text-gray-500 mt-6">Match not found.</p>}

        {match && (
          <div className="mt-6 space-y-8">
            <MatchCard match={match} />

            <section>
              <h2 className="text-xl font-bold text-fifa-navy mb-3">Goals</h2>
              {events.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No goal-event detail available (not provided on the free data tier).
                </p>
              ) : (
                <ul className="space-y-2">
                  {events.map((e, i) => (
                    <li key={i} className="bg-white rounded border p-3 flex items-center gap-3">
                      <span className="font-bold text-fifa-navy w-12">{e.minute ? `${e.minute}'` : '—'}</span>
                      <span>⚽</span>
                      <span className="font-semibold">{e.player}</span>
                      <span className="text-gray-500 text-sm">({e.team})</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck the whole frontend**

Run: `cd frontend && npx tsc --noEmit`
Expected: **no errors** (all pages/components now consistent with the new `Match` type).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/LiveMatchPage.tsx frontend/src/components/MatchCard.tsx
git commit -m "feat(frontend): LiveMatchPage + MatchCard on real match data (no possession/shots)"
```

---

## Task 11: End-to-end verification against live WC 2026

**Files:** none (verification only)

- [ ] **Step 1: Confirm Docker services + `.env` key**

Run:
```bash
cd /Users/annie/Documents/All_Projects/FIFA_Data_Project
docker ps --filter name=live-pitch-redis --format '{{.Names}} {{.Status}}'
grep -c '^FOOTBALL_API_KEY=' .env
```
Expected: redis `Up ... (healthy)`; grep prints `1`.

- [ ] **Step 2: Start the backend**

Run (background): `./venv/bin/python api/main.py > /tmp/mainpy.log 2>&1 &`
Wait ~6s, then: `grep -E "Uvicorn running|Football data client" /tmp/mainpy.log`
Expected: `✅ Football data client loaded` and `Uvicorn running on http://0.0.0.0:8000`.

- [ ] **Step 3: Hit the real endpoints**

Run:
```bash
curl -s http://localhost:8000/matches      | ./venv/bin/python -m json.tool | head -40
curl -s http://localhost:8000/standings    | ./venv/bin/python -m json.tool | head -20
curl -s http://localhost:8000/leaderboards | ./venv/bin/python -m json.tool | head -20
```
Expected: `source` is `live` (or `cache` on repeat), `data` contains real WC 2026 teams. If a match is in play, `data.live` is non-empty.

- [ ] **Step 4: Verify the "no live match" fallback (data-shape check)**

The `/matches` response always has `live`, `upcoming`, `recent` keys. Confirm `upcoming` lists real future fixtures with real dates:
```bash
curl -s http://localhost:8000/matches | ./venv/bin/python -c "import sys,json; d=json.load(sys.stdin)['data']; print('live:',len(d['live']),'upcoming:',len(d['upcoming']),'recent:',len(d['recent'])); print(d['upcoming'][0] if d['upcoming'] else 'none')"
```
Expected: prints counts and a real upcoming fixture.

- [ ] **Step 5: Start the frontend and smoke-test in a browser**

Run: `cd frontend && npm run dev`
Open `http://localhost:5173`. Confirm:
- The tournament page shows real teams (not France/Argentina mock), a source badge, real standings and top scorers.
- If a match is live, a "Live Now" card appears; clicking it opens the live match page with the live score.
- Upcoming Matches shows the real schedule.

- [ ] **Step 6: Stop the background backend**

Run: `pkill -f "api/main.py"`

- [ ] **Step 7: Final full test suite**

Run: `./venv/bin/python -m pytest Testing/test_football_data.py Testing/test_match_endpoints.py -q`
Expected: all pass.

- [ ] **Step 8: Commit any final touch-ups**

```bash
git add -A
git commit -m "chore: verified real-time WC 2026 data end-to-end" || echo "nothing to commit"
```

---

## Self-Review Notes (author)

- **Spec coverage:** provider client (Tasks 2–5), cache+endpoints (Tasks 6–7), frontend rewiring (Tasks 8–10), config/secrets (Task 1), testing (Tasks 2–7 unit + Task 11 e2e), three-tier fallback (Task 6). `/match/{id}/stats` intentionally dropped per spec (free tier). ✅
- **Envelope refinement vs spec:** spec listed separate `wc:live/upcoming/recent` keys; the plan uses one `wc:matches` key (45s) fed by a single upstream call — fewer requests, same behavior. Documented in Global Constraints and Task 7.
- **Type consistency:** `Match` (id, team1/team2{name,flag,score}, time, stadium, status) is identical across `useMatchData.ts`, `useMatches.ts`, `TournamentPage`, `MatchCard`, `LiveMatchPage`. Backend returns the same shape from `_normalize_match`.
- **No placeholders:** every code step is complete and runnable.
