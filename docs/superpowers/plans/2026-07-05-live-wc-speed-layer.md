# APEX XI — Live WC Speed Layer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scrape WC 2026 data via ScraperFC/Sofascore and serve three real-time views (`live_matches`, `fixtures`, `standings`) into the shared `apex.duckdb`, with TTL caching + last-good fallback.

**Architecture:** One scrape (`get_match_dicts`) → normalize → derive the three views → `CREATE OR REPLACE TABLE` into `apex.duckdb` (alongside the batch tables). Scraping is isolated in one injectable client; a cache bounds scrape frequency by TTL and falls back to the last-good snapshot on failure. CLI `apex-live refresh|watch`.

**Tech Stack:** Python 3.13, `ScraperFC` (Sofascore), pandas 3.0.3, duckdb 1.1.3, pytest.

## Global Constraints

- Source: ScraperFC → Sofascore, `LEAGUE = "FIFA World Cup"`, `SEASON = "2026"`. Only `apex/live/client.py` imports `ScraperFC`.
- **One scrape** (`get_match_dicts(SEASON, LEAGUE)`) feeds all three views; standings computed from finished results.
- Serving store: the **same** `apex.duckdb` (reuse `apex.config.DUCKDB_PATH`); write `live_matches`, `fixtures`, `standings`.
- Never crash on scrape failure: serve last-good snapshot; if none, `([], "unavailable")` and leave existing tables intact.
- Status map: `inprogress→LIVE`, `notstarted→SCHEDULED`, `finished→FINISHED`, else `SCHEDULED`.
- **Verified Sofascore `match_dict` shape:** `id:int`; `homeTeam/awayTeam:{name, nameCode(FIFA 3-letter), ...}`; `homeScore/awayScore:{current, ...}` (absent/`{}` when not started); `status:{type, description}`; `roundInfo:{round}` for group stage OR `{round, name}` for knockout; `tournament:{isGroup:bool, groupName:"Group X"}`; `startTimestamp:int(unix)`.
- `stage` = `roundInfo.name` if present, else `tournament.groupName`.
- `data/live/` is gitignored; batch code and `data/` ignore rule already exist.
- Tests use synthetic Sofascore dicts (no network); one manual smoke task hits the real site.

---

## File Structure

```
apex/live/__init__.py
apex/live/config.py       # LEAGUE, SEASON, LIVE_TTL, LIVE_DIR, RAW_SNAPSHOT, LASTGOOD_SNAPSHOT
apex/live/normalize.py    # map_status, country_flag, normalize_match
apex/live/derive.py       # derive_live, derive_fixtures, derive_standings
apex/live/client.py       # SofascoreClient, LiveDataError  (sole scraper)
apex/live/cache.py        # get_matches_cached
apex/live/serve.py        # serve
apex/live/cli.py          # apex-live refresh | watch
tests/live/__init__.py
tests/live/synthetic.py   # synthetic Sofascore match_dict builder
tests/live/test_normalize.py test_derive.py test_client.py test_cache.py test_serve.py test_cli.py
data/live/                # gitignored
requirements.txt          # add ScraperFC
```

---

## Task 1: Scaffold — package, config, deps, synthetic builder

**Files:** Create `apex/live/__init__.py`, `apex/live/config.py`, `tests/live/__init__.py`, `tests/live/synthetic.py`; Modify `requirements.txt`.

**Interfaces:**
- Produces `apex/live/config.py`: `LEAGUE="FIFA World Cup"`, `SEASON="2026"`, `LIVE_TTL=45`, `LIVE_DIR=Path("data/live")`, `RAW_SNAPSHOT`, `LASTGOOD_SNAPSHOT`.
- Produces `tests/live/synthetic.py`: `match_dict(**overrides) -> dict` building a Sofascore-shaped match dict.

- [ ] **Step 1: Add ScraperFC to `requirements.txt`** (append):
```
ScraperFC==3.4.1
```
(If a different version installs in Step 2, pin that exact one via `./venv/bin/pip show ScraperFC | grep Version`.)

- [ ] **Step 2: Install it**

Run: `cd /Users/annie/Documents/All_Projects/FIFA_Data_Project && ./venv/bin/pip install ScraperFC`
Expected: installs; `./venv/bin/python -c "import ScraperFC; print('ok')"` prints `ok`.

- [ ] **Step 3: Create `apex/live/__init__.py` and `tests/live/__init__.py`** (empty files).

- [ ] **Step 4: Create `apex/live/config.py`**
```python
"""Live speed-layer config."""
from pathlib import Path
from apex import config as batch_config

LEAGUE = "FIFA World Cup"
SEASON = "2026"
LIVE_TTL = 45  # seconds

LIVE_DIR = Path("data/live")
RAW_SNAPSHOT = LIVE_DIR / "matches_raw.json"
LASTGOOD_SNAPSHOT = LIVE_DIR / "matches_lastgood.json"

DUCKDB_PATH = batch_config.DUCKDB_PATH  # shared serving store
```

- [ ] **Step 5: Create `tests/live/synthetic.py`**
```python
"""Synthetic Sofascore match_dict builder (mirrors the verified real shape)."""

def match_dict(mid=1, home="Norway", home_code="NOR", away="Egypt", away_code="EGY",
               home_score=None, away_score=None, status="finished",
               start_ts=1782500400, group_name=None, round_name=None, round_num=1):
    """Build a Sofascore-shaped match dict. Group match if group_name set; knockout if round_name set."""
    md = {
        "id": mid,
        "homeTeam": {"name": home, "nameCode": home_code},
        "awayTeam": {"name": away, "nameCode": away_code},
        "status": {"type": status, "description": status.title()},
        "startTimestamp": start_ts,
        "roundInfo": {"round": round_num} if not round_name else {"round": round_num, "name": round_name},
        "tournament": {"isGroup": group_name is not None,
                       "groupName": group_name} if group_name else {"isGroup": False},
    }
    if home_score is not None:
        md["homeScore"] = {"current": home_score}
    if away_score is not None:
        md["awayScore"] = {"current": away_score}
    return md
```

- [ ] **Step 6: Verify imports**

Run: `./venv/bin/python -c "from apex.live import config; from tests.live.synthetic import match_dict; print(config.LEAGUE, config.SEASON, match_dict()['tournament'])"`
Expected: `FIFA World Cup 2026 {'isGroup': False}`

- [ ] **Step 7: Commit**
```bash
git add requirements.txt apex/live/__init__.py apex/live/config.py tests/live/__init__.py tests/live/synthetic.py
git commit -m "chore: scaffold live speed layer (config, ScraperFC dep, synthetic builder)"
```

---

## Task 2: `normalize.py`

**Files:** Create `apex/live/normalize.py`; Test `tests/live/test_normalize.py`.

**Interfaces:**
- Produces: `map_status(t)->str`, `country_flag(code)->str`, `normalize_match(md, now_ts)->dict` with keys `id, home_team, away_team, home_flag, away_flag, home_score, away_score, status, minute, stage, kickoff, group`.

- [ ] **Step 1: Write the failing test** (`tests/live/test_normalize.py`)
```python
from apex.live import normalize as nz
from tests.live.synthetic import match_dict

def test_map_status():
    assert nz.map_status("inprogress") == "LIVE"
    assert nz.map_status("notstarted") == "SCHEDULED"
    assert nz.map_status("finished") == "FINISHED"
    assert nz.map_status("weird") == "SCHEDULED"

def test_country_flag():
    assert nz.country_flag("NOR") == "🇳🇴"
    assert nz.country_flag("ZZZ") == "🏳️"

def test_normalize_finished_group_match():
    md = match_dict(mid=7, home="Norway", home_code="NOR", away="Egypt", away_code="EGY",
                    home_score=2, away_score=1, status="finished",
                    start_ts=1782500400, group_name="Group I")
    out = nz.normalize_match(md, now_ts=1782600000)
    assert out["id"] == 7
    assert out["home_team"] == "Norway" and out["home_flag"] == "🇳🇴"
    assert out["home_score"] == 2 and out["away_score"] == 1
    assert out["status"] == "FINISHED" and out["minute"] is None
    assert out["stage"] == "Group I" and out["group"] == "Group I"
    assert out["kickoff"].startswith("2026-")

def test_normalize_live_uses_elapsed_minute():
    md = match_dict(status="inprogress", start_ts=1000, group_name="Group A")
    out = nz.normalize_match(md, now_ts=1000 + 42*60)   # 42 minutes later
    assert out["status"] == "LIVE" and out["minute"] == 42

def test_normalize_knockout_stage_and_notstarted_scores():
    md = match_dict(status="notstarted", round_name="Round of 16", round_num=5)
    out = nz.normalize_match(md, now_ts=0)
    assert out["status"] == "SCHEDULED"
    assert out["stage"] == "Round of 16" and out["group"] is None
    assert out["home_score"] is None and out["away_score"] is None
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./venv/bin/python -m pytest tests/live/test_normalize.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'apex.live.normalize'`.

- [ ] **Step 3: Write `apex/live/normalize.py`**
```python
"""Normalize Sofascore match dicts into tidy Match rows."""
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

_STATUS = {"inprogress": "LIVE", "notstarted": "SCHEDULED", "finished": "FINISHED"}

def map_status(t: str) -> str:
    s = _STATUS.get(t)
    if s is None:
        logger.warning("Unknown status type %r -> SCHEDULED", t)
        return "SCHEDULED"
    return s

# FIFA 3-letter code -> flag emoji (WC 2026 nations; extend as needed)
_FLAGS = {
    "NOR": "🇳🇴", "EGY": "🇪🇬", "URU": "🇺🇾", "CRO": "🇭🇷", "NZL": "🇳🇿", "CPV": "🇨🇻",
    "USA": "🇺🇸", "MEX": "🇲🇽", "CAN": "🇨🇦", "BRA": "🇧🇷", "ARG": "🇦🇷", "FRA": "🇫🇷",
    "ESP": "🇪🇸", "ENG": "🏴", "GER": "🇩🇪", "POR": "🇵🇹", "NED": "🇳🇱", "BEL": "🇧🇪",
    "ITA": "🇮🇹", "COL": "🇨🇴", "GHA": "🇬🇭", "MAR": "🇲🇦", "JPN": "🇯🇵", "KOR": "🇰🇷",
    "SEN": "🇸🇳", "NGA": "🇳🇬", "AUS": "🇦🇺", "SUI": "🇨🇭", "DEN": "🇩🇰", "POL": "🇵🇱",
    "SRB": "🇷🇸", "CMR": "🇨🇲", "CIV": "🇨🇮", "KSA": "🇸🇦", "QAT": "🇶🇦", "IRN": "🇮🇷",
    "CRC": "🇨🇷", "TUN": "🇹🇳", "ALG": "🇩🇿", "ECU": "🇪🇨", "PAR": "🇵🇾", "AUT": "🇦🇹",
    "UZB": "🇺🇿", "JOR": "🇯🇴", "RSA": "🇿🇦", "PAN": "🇵🇦", "SCO": "🏴", "WAL": "🏴",
}

def country_flag(code: str) -> str:
    f = _FLAGS.get(code)
    if f is None:
        logger.warning("No flag for country code %r", code)
        return "🏳️"
    return f

def _elapsed(start_ts, now_ts) -> int:
    mins = int((now_ts - start_ts) // 60)
    return max(0, min(mins, 130))

def normalize_match(md: dict, now_ts: int) -> dict:
    status = map_status(md["status"]["type"])
    tour = md.get("tournament", {}) or {}
    group = tour.get("groupName") if tour.get("isGroup") else None
    ri = md.get("roundInfo", {}) or {}
    stage = ri.get("name") or group
    minute = _elapsed(md["startTimestamp"], now_ts) if status == "LIVE" else None
    kickoff = datetime.fromtimestamp(md["startTimestamp"], tz=timezone.utc).isoformat()
    return {
        "id": md["id"],
        "home_team": md["homeTeam"]["name"],
        "away_team": md["awayTeam"]["name"],
        "home_flag": country_flag(md["homeTeam"].get("nameCode", "")),
        "away_flag": country_flag(md["awayTeam"].get("nameCode", "")),
        "home_score": (md.get("homeScore") or {}).get("current"),
        "away_score": (md.get("awayScore") or {}).get("current"),
        "status": status,
        "minute": minute,
        "stage": stage,
        "kickoff": kickoff,
        "group": group,
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./venv/bin/python -m pytest tests/live/test_normalize.py -q`
Expected: PASS (5 passed).

- [ ] **Step 5: Commit**
```bash
git add apex/live/normalize.py tests/live/test_normalize.py
git commit -m "feat: live normalize (status, flags, match normalization)"
```

---

## Task 3: `derive.py` (live / fixtures / standings)

**Files:** Create `apex/live/derive.py`; Test `tests/live/test_derive.py`.

**Interfaces:**
- Consumes: normalized Match dicts (Task 2 output).
- Produces: `derive_live(matches, now_ts)->list`, `derive_fixtures(matches)->list`, `derive_standings(matches)->list` (rows `{group,rank,team,flag,played,w,d,l,gf,ga,gd,points}`).

- [ ] **Step 1: Write the failing test** (`tests/live/test_derive.py`)
```python
from apex.live import derive as dv

def _m(**k):
    base = {"id": 1, "home_team": "A", "away_team": "B", "home_flag": "🇦", "away_flag": "🇧",
            "home_score": None, "away_score": None, "status": "SCHEDULED", "minute": None,
            "stage": None, "kickoff": "2026-07-05T12:00:00+00:00", "group": None}
    base.update(k); return base

DAY = 86400

def test_derive_fixtures_sorted_scheduled_only():
    ms = [_m(id=1, status="SCHEDULED", kickoff="2026-07-06T00:00:00+00:00"),
          _m(id=2, status="FINISHED"),
          _m(id=3, status="SCHEDULED", kickoff="2026-07-05T00:00:00+00:00")]
    out = dv.derive_fixtures(ms)
    assert [m["id"] for m in out] == [3, 1]   # scheduled only, sorted by kickoff

def test_derive_live_includes_live_and_within_24h():
    now = 1_000_000
    def ts(off): 
        from datetime import datetime, timezone
        return datetime.fromtimestamp(now + off, tz=timezone.utc).isoformat()
    ms = [_m(id=1, status="LIVE", kickoff=ts(0)),
          _m(id=2, status="FINISHED", kickoff=ts(-3600)),      # 1h ago -> in window
          _m(id=3, status="SCHEDULED", kickoff=ts(3600)),      # in 1h -> in window
          _m(id=4, status="FINISHED", kickoff=ts(-2*DAY))]     # 2 days ago -> excluded
    out = dv.derive_live(ms, now_ts=now)
    ids = {m["id"] for m in out}
    assert ids == {1, 2, 3} and 4 not in ids

def test_derive_standings_group_table():
    # Group A: A beat B 2-0, A drew C 1-1, B beat C 3-1  -> A:4pts, B:3, C:1
    ms = [
        _m(id=1, status="FINISHED", group="Group A", home_team="A", away_team="B", home_score=2, away_score=0),
        _m(id=2, status="FINISHED", group="Group A", home_team="A", away_team="C", home_score=1, away_score=1),
        _m(id=3, status="FINISHED", group="Group A", home_team="B", away_team="C", home_score=3, away_score=1),
        _m(id=4, status="SCHEDULED", group="Group A", home_team="A", away_team="C"),   # ignored (not finished)
    ]
    rows = dv.derive_standings(ms)
    by_team = {r["team"]: r for r in rows}
    assert by_team["A"]["points"] == 4 and by_team["A"]["rank"] == 1
    # B: beat C 3-1 (gf3,ga1) + lost to A 0-2 (gf0,ga2) -> gf3 ga3 gd0, 3 pts
    assert by_team["B"]["points"] == 3 and by_team["B"]["gd"] == 0
    assert by_team["C"]["points"] == 1 and by_team["C"]["rank"] == 3
    assert all(r["group"] == "Group A" for r in rows)

def test_derive_standings_excludes_knockout():
    ms = [_m(id=9, status="FINISHED", group=None, stage="Round of 16",
             home_team="A", away_team="B", home_score=1, away_score=0)]
    assert dv.derive_standings(ms) == []
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./venv/bin/python -m pytest tests/live/test_derive.py -q`
Expected: FAIL — `ModuleNotFoundError`.

- [ ] **Step 3: Write `apex/live/derive.py`**
```python
"""Derive live/fixtures/standings views from normalized matches."""
from datetime import datetime

_DAY = 86400

def _kick_ts(iso: str) -> float:
    return datetime.fromisoformat(iso).timestamp()

def derive_fixtures(matches: list) -> list:
    sched = [m for m in matches if m["status"] == "SCHEDULED"]
    return sorted(sched, key=lambda m: m["kickoff"])

def derive_live(matches: list, now_ts: int) -> list:
    out = []
    for m in matches:
        if m["status"] == "LIVE" or abs(_kick_ts(m["kickoff"]) - now_ts) <= _DAY:
            out.append(m)
    return sorted(out, key=lambda m: m["kickoff"])

def derive_standings(matches: list) -> list:
    table = {}   # (group, team) -> stats
    def row(group, team, flag):
        return table.setdefault((group, team),
            {"group": group, "team": team, "flag": flag, "played": 0,
             "w": 0, "d": 0, "l": 0, "gf": 0, "ga": 0, "points": 0})
    for m in matches:
        if m["status"] != "FINISHED" or not m.get("group"):
            continue
        if m["home_score"] is None or m["away_score"] is None:
            continue
        g = m["group"]
        h = row(g, m["home_team"], m["home_flag"])
        a = row(g, m["away_team"], m["away_flag"])
        hs, as_ = m["home_score"], m["away_score"]
        for t, gf, ga in [(h, hs, as_), (a, as_, hs)]:
            t["played"] += 1; t["gf"] += gf; t["ga"] += ga
        if hs > as_:   h["w"] += 1; h["points"] += 3; a["l"] += 1
        elif hs < as_: a["w"] += 1; a["points"] += 3; h["l"] += 1
        else:          h["d"] += 1; a["d"] += 1; h["points"] += 1; a["points"] += 1
    rows = list(table.values())
    for r in rows:
        r["gd"] = r["gf"] - r["ga"]
    # rank within each group
    out = []
    for g in sorted({r["group"] for r in rows}):
        grp = [r for r in rows if r["group"] == g]
        grp.sort(key=lambda r: (-r["points"], -r["gd"], -r["gf"]))
        for i, r in enumerate(grp, 1):
            r["rank"] = i
        out.extend(grp)
    return out
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./venv/bin/python -m pytest tests/live/test_derive.py -q`
Expected: PASS (4 passed).

- [ ] **Step 5: Commit**
```bash
git add apex/live/derive.py tests/live/test_derive.py
git commit -m "feat: live derive (live window, fixtures, group standings)"
```

---

## Task 4: `client.py` (sole scraper)

**Files:** Create `apex/live/client.py`; Test `tests/live/test_client.py`.

**Interfaces:**
- Produces: `class LiveDataError(Exception)`; `SofascoreClient(_scraper=None)` with `get_wc_matches()->list[dict]`.

- [ ] **Step 1: Write the failing test** (`tests/live/test_client.py`)
```python
import pytest
from apex.live import client as cl

class FakeScraper:
    def __init__(self, result=None, exc=None):
        self.result, self.exc, self.calls = result, exc, 0
    def get_match_dicts(self, season, league):
        self.calls += 1
        if self.exc: raise self.exc
        return self.result

def test_get_wc_matches_returns_list():
    fake = FakeScraper(result=[{"id": 1}, {"id": 2}])
    c = cl.SofascoreClient(_scraper=fake)
    assert c.get_wc_matches() == [{"id": 1}, {"id": 2}]
    assert fake.calls == 1

def test_get_wc_matches_raises_on_scraper_error():
    c = cl.SofascoreClient(_scraper=FakeScraper(exc=RuntimeError("blocked")))
    with pytest.raises(cl.LiveDataError):
        c.get_wc_matches()

def test_get_wc_matches_raises_on_empty():
    c = cl.SofascoreClient(_scraper=FakeScraper(result=[]))
    with pytest.raises(cl.LiveDataError):
        c.get_wc_matches()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./venv/bin/python -m pytest tests/live/test_client.py -q`
Expected: FAIL — `ModuleNotFoundError`.

- [ ] **Step 3: Write `apex/live/client.py`**
```python
"""Sofascore scraper wrapper — the ONLY module importing ScraperFC."""
import logging
import time
from . import config

logger = logging.getLogger(__name__)

class LiveDataError(Exception):
    """Any failure fetching live data from Sofascore."""

def _default_scraper():
    import ScraperFC
    return ScraperFC.Sofascore()

class SofascoreClient:
    def __init__(self, _scraper=None, retries: int = 3, backoff: float = 1.0):
        self._scraper = _scraper or _default_scraper()
        self.retries = retries
        self.backoff = backoff

    def get_wc_matches(self) -> list:
        last = None
        for attempt in range(self.retries):
            try:
                result = self._scraper.get_match_dicts(config.SEASON, config.LEAGUE)
            except Exception as e:
                last = e
                logger.warning("scrape attempt %d failed: %s", attempt + 1, e)
                time.sleep(self.backoff * (attempt + 1))
                continue
            if not result:
                last = ValueError("empty match list")
                time.sleep(self.backoff * (attempt + 1))
                continue
            return list(result)
        raise LiveDataError(f"get_wc_matches failed after {self.retries} attempts: {last}")
```
*(The `time.sleep` in tests runs with `backoff` default; tests use small counts so total sleep is a few seconds. Acceptable. To keep tests fast, construct clients with `backoff=0` in tests — update the two raising tests to `SofascoreClient(_scraper=..., backoff=0)`.)*

- [ ] **Step 4: Run test to verify it passes** (set `backoff=0` in the raising tests per the note)

Run: `./venv/bin/python -m pytest tests/live/test_client.py -q`
Expected: PASS (3 passed).

- [ ] **Step 5: Commit**
```bash
git add apex/live/client.py tests/live/test_client.py
git commit -m "feat: Sofascore client wrapper (retry, raises LiveDataError)"
```

---

## Task 5: `cache.py` (TTL + last-good)

**Files:** Create `apex/live/cache.py`; Test `tests/live/test_cache.py`.

**Interfaces:**
- Consumes: `SofascoreClient`, `LiveDataError`, `config` snapshot paths.
- Produces: `get_matches_cached(client, ttl, now_ts) -> tuple[list, str]` (source ∈ `"live"|"cache"|"unavailable"`). Never raises.

- [ ] **Step 1: Write the failing test** (`tests/live/test_cache.py`)
```python
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./venv/bin/python -m pytest tests/live/test_cache.py -q`
Expected: FAIL — `ModuleNotFoundError`.

- [ ] **Step 3: Write `apex/live/cache.py`**
```python
"""TTL snapshot cache with last-good fallback."""
import json
import logging
import os
from . import config
from .client import LiveDataError

logger = logging.getLogger(__name__)

def _write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data))

def get_matches_cached(client, ttl, now_ts) -> tuple:
    raw = config.RAW_SNAPSHOT
    if raw.exists() and (now_ts - os.path.getmtime(raw)) < ttl:
        return json.loads(raw.read_text()), "cache"
    try:
        data = client.get_wc_matches()
    except LiveDataError as e:
        logger.warning("live scrape failed: %s", e)
        lg = config.LASTGOOD_SNAPSHOT
        if lg.exists():
            return json.loads(lg.read_text()), "cache"
        return [], "unavailable"
    _write(config.RAW_SNAPSHOT, data)
    _write(config.LASTGOOD_SNAPSHOT, data)
    return data, "live"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./venv/bin/python -m pytest tests/live/test_cache.py -q`
Expected: PASS (4 passed).

- [ ] **Step 5: Commit**
```bash
git add apex/live/cache.py tests/live/test_cache.py
git commit -m "feat: live TTL cache + last-good fallback"
```

---

## Task 6: `serve.py` (write DuckDB tables)

**Files:** Create `apex/live/serve.py`; Test `tests/live/test_serve.py`.

**Interfaces:**
- Consumes: `get_matches_cached`, `normalize_match`, `derive_*`, `config.DUCKDB_PATH`.
- Produces: `serve(client, now_ts) -> dict` (`{"source","live","fixtures","standings"}`); writes tables `live_matches`, `fixtures`, `standings` to `apex.duckdb`.

- [ ] **Step 1: Write the failing test** (`tests/live/test_serve.py`)
```python
import duckdb
from apex.live import serve as sv, config, cache
from tests.live.synthetic import match_dict

class StubClient:
    def __init__(self, matches): self.matches = matches
    def get_wc_matches(self): return self.matches

def _paths(tmp, monkeypatch):
    monkeypatch.setattr(config, "LIVE_DIR", tmp)
    monkeypatch.setattr(config, "RAW_SNAPSHOT", tmp / "raw.json")
    monkeypatch.setattr(config, "LASTGOOD_SNAPSHOT", tmp / "lastgood.json")
    monkeypatch.setattr(config, "DUCKDB_PATH", tmp / "apex.duckdb")

def test_serve_creates_three_tables(tmp_path, monkeypatch):
    _paths(tmp_path, monkeypatch)
    matches = [
        match_dict(mid=1, status="inprogress", start_ts=1000, group_name="Group A",
                   home="A", away="B", home_score=1, away_score=0),
        match_dict(mid=2, status="notstarted", start_ts=9_000_000_000,
                   round_name="Round of 16", round_num=5, home="C", away="D"),
        match_dict(mid=3, status="finished", start_ts=1000, group_name="Group A",
                   home="A", away="B", home_score=2, away_score=1),
    ]
    res = sv.serve(StubClient(matches), now_ts=1000 + 60)
    assert res["source"] == "live"
    con = duckdb.connect(str(config.DUCKDB_PATH))
    assert con.execute("select count(*) from fixtures").fetchone()[0] == 1        # match 2
    assert con.execute("select count(*) from standings").fetchone()[0] == 2       # A,B in Group A
    assert con.execute("select count(*) from live_matches").fetchone()[0] >= 1    # match 1 live

def test_serve_empty_leaves_existing_tables(tmp_path, monkeypatch):
    _paths(tmp_path, monkeypatch)
    # prime a table
    duckdb.connect(str(config.DUCKDB_PATH)).execute("create table live_matches as select 1 as id")
    class Empty:
        def get_wc_matches(self): from apex.live.client import LiveDataError; raise LiveDataError("x")
    res = sv.serve(Empty(), now_ts=0)
    assert res["source"] == "unavailable"
    con = duckdb.connect(str(config.DUCKDB_PATH))
    assert con.execute("select count(*) from live_matches").fetchone()[0] == 1    # untouched
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./venv/bin/python -m pytest tests/live/test_serve.py -q`
Expected: FAIL — `ModuleNotFoundError`.

- [ ] **Step 3: Write `apex/live/serve.py`**
```python
"""Serve stage: normalize + derive + write live tables into apex.duckdb."""
import logging
import duckdb
import pandas as pd
from . import config
from .cache import get_matches_cached
from .normalize import normalize_match
from .derive import derive_live, derive_fixtures, derive_standings

logger = logging.getLogger(__name__)

_LIVE_COLS = ["id", "home_team", "away_team", "home_flag", "away_flag",
              "home_score", "away_score", "status", "minute", "stage", "kickoff"]
_FIX_COLS = ["id", "home_team", "away_team", "home_flag", "away_flag", "stage", "kickoff"]
_STAND_COLS = ["group", "rank", "team", "flag", "played", "w", "d", "l", "gf", "ga", "gd", "points"]

def serve(client, now_ts) -> dict:
    raw, source = get_matches_cached(client, config.LIVE_TTL, now_ts)
    if not raw:
        return {"source": source, "live": 0, "fixtures": 0, "standings": 0}

    matches = []
    for md in raw:
        try:
            matches.append(normalize_match(md, now_ts))
        except Exception as e:  # skip a malformed dict, keep going
            logger.warning("skipping malformed match dict %s: %s", md.get("id"), e)

    live = pd.DataFrame(derive_live(matches, now_ts), columns=_LIVE_COLS)
    fixtures = pd.DataFrame(derive_fixtures(matches), columns=_FIX_COLS)
    standings = pd.DataFrame(derive_standings(matches), columns=_STAND_COLS)

    config.DUCKDB_PATH.parent.mkdir(parents=True, exist_ok=True)
    con = duckdb.connect(str(config.DUCKDB_PATH))
    try:
        for name, df in [("live_matches", live), ("fixtures", fixtures), ("standings", standings)]:
            con.register("df_tmp", df)
            con.execute(f"CREATE OR REPLACE TABLE {name} AS SELECT * FROM df_tmp")
            con.unregister("df_tmp")
    finally:
        con.close()
    return {"source": source, "live": len(live), "fixtures": len(fixtures), "standings": len(standings)}
```
*(`pd.DataFrame(rows, columns=COLS)` with an empty `rows` list yields a correctly-typed empty frame with the right columns — DuckDB creates an empty table, which is fine. The "empty leaves existing tables" path is handled earlier by the `if not raw` guard returning before any write.)*

- [ ] **Step 4: Run test to verify it passes**

Run: `./venv/bin/python -m pytest tests/live/test_serve.py -q`
Expected: PASS (2 passed).

- [ ] **Step 5: Commit**
```bash
git add apex/live/serve.py tests/live/test_serve.py
git commit -m "feat: live serve (normalize+derive -> duckdb live tables)"
```

---

## Task 7: `cli.py` (refresh / watch)

**Files:** Create `apex/live/cli.py`; Test `tests/live/test_cli.py`.

**Interfaces:**
- Consumes: `serve`, `SofascoreClient`.
- Produces: `main(argv=None)->int` with subcommands `refresh`, `watch --interval N`. Runnable via `python -m apex.live.cli refresh`.

- [ ] **Step 1: Write the failing test** (`tests/live/test_cli.py`)
```python
from apex.live import cli

def test_refresh_calls_serve_once(monkeypatch):
    calls = {"n": 0}
    monkeypatch.setattr(cli, "serve", lambda client, now_ts: calls.__setitem__("n", calls["n"] + 1) or {"source": "live", "live": 1, "fixtures": 0, "standings": 0})
    monkeypatch.setattr(cli, "SofascoreClient", lambda: object())
    rc = cli.main(["refresh"])
    assert rc == 0 and calls["n"] == 1
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./venv/bin/python -m pytest tests/live/test_cli.py -q`
Expected: FAIL — `ModuleNotFoundError`.

- [ ] **Step 3: Write `apex/live/cli.py`**
```python
"""APEX live speed-layer CLI."""
import argparse
import logging
import time
from .serve import serve
from .client import SofascoreClient

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

def _now() -> int:
    return int(time.time())

def main(argv=None) -> int:
    p = argparse.ArgumentParser(prog="apex-live", description="APEX WC live speed layer")
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("refresh")
    pw = sub.add_parser("watch"); pw.add_argument("--interval", type=int, default=45)
    args = p.parse_args(argv)

    client = SofascoreClient()
    if args.cmd == "refresh":
        res = serve(client, _now())
        logger.info("refresh: %s", res)
        return 0
    if args.cmd == "watch":
        logger.info("watching every %ds (Ctrl-C to stop)", args.interval)
        try:
            while True:
                try:
                    logger.info("refresh: %s", serve(client, _now()))
                except Exception as e:       # keep the loop alive on any error
                    logger.error("watch iteration failed: %s", e)
                time.sleep(args.interval)
        except KeyboardInterrupt:
            logger.info("stopped")
        return 0
    return 1

if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 4: Run test + CLI smoke**

Run: `./venv/bin/python -m pytest tests/live/test_cli.py -q && ./venv/bin/python -m apex.live.cli --help`
Expected: test PASS; `--help` shows `refresh` and `watch`.

- [ ] **Step 5: Full suite**

Run: `./venv/bin/python -m pytest tests -q`
Expected: all pass (batch + live, ~30 tests).

- [ ] **Step 6: Commit**
```bash
git add apex/live/cli.py tests/live/test_cli.py
git commit -m "feat: apex-live CLI (refresh, watch)"
```

---

## Task 8: Real-data smoke run (manual, network)

**Files:** none (verification only).

- [ ] **Step 1: Refresh against real Sofascore**

Run: `./venv/bin/python -m apex.live.cli refresh`
Expected: logs `refresh: {'source': 'live', 'live': N, 'fixtures': M, 'standings': K}` with no crash (may print a Sofascore/NoAuth-style warning — not an error).

- [ ] **Step 2: Inspect the live serving tables**

Run:
```bash
./venv/bin/python -c "
import duckdb; from apex.live import config
con = duckdb.connect(str(config.DUCKDB_PATH))
print('tables:', [r[0] for r in con.execute('SHOW TABLES').fetchall()])
print('standings sample:', con.execute(\"select \\\"group\\\", rank, team, points from standings order by \\\"group\\\", rank limit 8\").fetchall())
print('fixtures:', con.execute('select count(*) from fixtures').fetchone()[0])
print('live/around-now:', con.execute('select home_team, away_team, status, stage from live_matches limit 5').fetchall())
"
```
Expected: `live_matches`, `fixtures`, `standings` present **alongside** the batch tables (`player_season`, `team_season`, `shots`); standings show groups A–L with sensible points; fixtures/live counts reflect the tournament state.

- [ ] **Step 3: Confirm last-good fallback works**

Run: `./venv/bin/python -m apex.live.cli refresh` again immediately.
Expected: `source` is `cache` (served from the fresh snapshot within TTL), no scrape.

- [ ] **Step 4: Commit any fixups** (only if code changed)
```bash
git add -A && git commit -m "chore: real-data smoke verification of live speed layer" || echo "nothing to commit"
```

---

## Self-Review Notes (author)

- **Spec coverage:** scaffold/config/deps (T1), normalize (T2), derive live/fixtures/standings (T3), client sole-scraper (T4), TTL+last-good cache (T5), serve→shared duckdb (T6), CLI refresh/watch (T7), real smoke (T8). All spec components covered.
- **Schema verified** against live Sofascore WC 2026: `homeScore.current`, `status.type`, `roundInfo.name` (knockout) vs `tournament.groupName`+`isGroup` (group stage), `nameCode` for flags, `startTimestamp` unix. Standings grouping uses `tournament.groupName` (spec's "roundInfo names groups" corrected to the real field).
- **Determinism:** unit tests use synthetic dicts + explicit `now_ts`; only T8 hits the network.
- **Type consistency:** `normalize_match` keys match `_LIVE_COLS`/`_FIX_COLS`; `derive_standings` row keys match `_STAND_COLS`; `get_matches_cached`/`serve`/`SofascoreClient` signatures consistent across tasks.
