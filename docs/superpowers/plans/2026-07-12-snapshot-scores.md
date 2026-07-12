# Snapshot Scores Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the deployed World Cup scores current and honest — ship the data as a committed build artifact, and replace the broken "Update scores" button with a "SCORES AS OF <date>" label.

**Architecture:** The DB stops being a cache the server refreshes at request time and becomes a build artifact delivered through git. `serve()` stamps a `live_meta` table into `apex.duckdb` so freshness survives the Docker `COPY` (the only thing the image gets). The `POST /api/live/refresh` route and its frontend button are deleted as code that cannot succeed in the deployed image.

**Tech Stack:** Python 3.13, FastAPI, DuckDB 1.1.3, pandas 3.0.3, pytest; React 18 + TypeScript + Vite, vitest + Testing Library.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-12-snapshot-scores-design.md`.
- Branch: `feat/snapshot-scores` (already created, off `main` @ `481cd44`).
- Python: run tests with `./venv/bin/python -m pytest`. Frontend: `cd frontend && npx vitest run`.
- Baselines that must stay green: **64 Python tests, 49 frontend tests**. Tasks 3 and 4 intentionally *remove* tests; the count drops as noted per task.
- Pandas 3.0.3 defaults to `StringDtype`, which DuckDB 1.1.3 does not accept. Any new DataFrame written to DuckDB must go through the existing `dtype.name == "str"` → `astype(object)` conversion in `apex/live/serve.py`.
- `"group"` is a DuckDB reserved word and must stay quoted in SQL.
- `data/serving/apex.duckdb` is tracked in git on purpose (`.gitignore` un-ignores it). Committing it is correct, not an accident.

---

### Task 1: Stamp the snapshot time into the DB

`/api/meta` reports `live_updated: null` in production because it reads the mtime of `data/live/matches_raw.json`, which is in `.dockerignore` and does not exist in the image. The timestamp must live *inside* `apex.duckdb`, the only artifact the Dockerfile copies.

**Files:**
- Modify: `apex/live/serve.py`
- Test: `tests/live/test_serve.py`

**Interfaces:**
- Consumes: nothing.
- Produces: table `live_meta(updated_at VARCHAR, source VARCHAR)`, exactly one row. `updated_at` is UTC ISO-8601 derived from `serve()`'s `now_ts`. `source` is one of `live` | `cache` | `unavailable` — the same value `serve()` already returns in its result dict. Task 2 reads this table.

- [ ] **Step 1: Write the failing test**

Append to `tests/live/test_serve.py`:

```python
def test_serve_stamps_live_meta(tmp_path, monkeypatch):
    _paths(tmp_path, monkeypatch)
    matches = [match_dict(mid=1, status="finished", start_ts=1000, group_name="Group A",
                          home="A", away="B", home_score=2, away_score=1)]
    sv.serve(StubClient(matches), now_ts=1_700_000_000)

    con = duckdb.connect(str(config.DUCKDB_PATH))
    rows = con.execute("select updated_at, source from live_meta").fetchall()
    assert len(rows) == 1
    assert rows[0][0].startswith("2023-11-14")   # 1_700_000_000 UTC
    assert rows[0][1] == "live"

def test_serve_does_not_stamp_live_meta_when_scrape_fails(tmp_path, monkeypatch):
    """A failed scrape must leave the committed snapshot — and its timestamp — intact,
    rather than advancing the clock on data that did not change."""
    _paths(tmp_path, monkeypatch)
    class Empty:
        def get_wc_matches(self):
            from apex.live.client import LiveDataError
            raise LiveDataError("x")

    sv.serve(Empty(), now_ts=1_700_000_000)

    con = duckdb.connect(str(config.DUCKDB_PATH))
    assert con.execute(
        "select count(*) from information_schema.tables where table_name = 'live_meta'"
    ).fetchone()[0] == 0
```

- [ ] **Step 2: Run the test and watch it fail**

Run: `./venv/bin/python -m pytest tests/live/test_serve.py -q`
Expected: FAIL — `duckdb.CatalogException: Table with name live_meta does not exist`.

- [ ] **Step 3: Write the minimal implementation**

In `apex/live/serve.py`, add `import datetime` at the top, then add the column list beside the existing ones:

```python
_META_COLS = ["updated_at", "source"]
```

Inside `serve()`, after the `knockout` DataFrame is built (just before the StringDtype conversion loop), add:

```python
    meta = pd.DataFrame([{
        "updated_at": datetime.datetime.fromtimestamp(
            now_ts, tz=datetime.timezone.utc).isoformat(),
        "source": source,
    }], columns=_META_COLS)
```

Add `meta` to the StringDtype conversion loop:

```python
    for df in [live, fixtures, standings, knockout, meta]:
```

Add `live_meta` to the write loop:

```python
        for name, df in [("live_matches", live), ("fixtures", fixtures),
                         ("standings", standings), ("knockout", knockout),
                         ("live_meta", meta)]:
```

Both early-returns in `serve()` (empty `raw`, and nothing normalized) stay as they are — that is what makes the second test pass: a failed scrape must not advance the timestamp.

- [ ] **Step 4: Run the tests and watch them pass**

Run: `./venv/bin/python -m pytest tests/live/ -q`
Expected: PASS, no regressions in the existing `test_serve_*` tests.

- [ ] **Step 5: Commit**

```bash
git add apex/live/serve.py tests/live/test_serve.py
git commit -m "feat: stamp live_meta (updated_at, source) into apex.duckdb

The timestamp has to live in the DB — /api/meta currently reads the mtime of a
file that .dockerignore keeps out of the image, so production reports null."
```

---

### Task 2: Serve the stamped time from /api/meta

**Files:**
- Modify: `apex/api/queries.py` (the `meta` function, ~line 109)
- Modify: `apex/api/app.py:23-25` (the `/api/meta` route)
- Test: `tests/api/test_ops.py`

**Interfaces:**
- Consumes: table `live_meta(updated_at, source)` from Task 1.
- Produces: `queries.meta(con=None)` — signature gains an optional connection. Returns `{"historic_updated": str|None, "live_updated": str|None, "source": "apex.duckdb"}`. Task 4's frontend reads `live_updated`.

- [ ] **Step 1: Write the failing test**

Append to `tests/api/test_ops.py`:

```python
def test_meta_reports_live_updated_from_live_meta_table(apex_db):
    import duckdb
    con = duckdb.connect(str(apex_db))
    con.execute("create table live_meta as select "
                "'2026-07-12T10:00:00+00:00' as updated_at, 'live' as source")
    con.close()

    body = client.get("/api/meta").json()
    assert body["live_updated"] == "2026-07-12T10:00:00+00:00"

def test_meta_live_updated_is_null_without_the_table(apex_db, tmp_path, monkeypatch):
    """Older DBs built before live_meta existed must not 500.

    RAW_SNAPSHOT must be pointed at a path that does not exist: the mtime fallback
    would otherwise read the real data/live/matches_raw.json, which Task 5's scrape
    creates on a developer machine — passing in CI and failing locally.
    """
    from apex.live import config as live_config
    monkeypatch.setattr(live_config, "RAW_SNAPSHOT", tmp_path / "absent.json")

    body = client.get("/api/meta").json()
    assert body["live_updated"] is None
    assert body["source"] == "apex.duckdb"
```

- [ ] **Step 2: Run the test and watch it fail**

Run: `./venv/bin/python -m pytest tests/api/test_ops.py -q`
Expected: FAIL on the first test — `assert None == '2026-07-12T10:00:00+00:00'` (meta ignores the DB entirely today).

- [ ] **Step 3: Write the minimal implementation**

In `apex/api/queries.py`, replace `meta()`:

```python
def meta(con=None):
    """live_updated comes from the live_meta table, not a file mtime: the DB is the
    only artifact the Docker image copies, so a mtime-based answer is null in prod."""
    from apex.live import config as live_config
    live_updated = None
    if con is not None and table_exists(con, "live_meta"):
        row = con.execute("SELECT updated_at FROM live_meta LIMIT 1").fetchone()
        live_updated = row[0] if row else None
    if live_updated is None:                       # local dev / pre-live_meta DBs
        live_updated = _mtime_iso(live_config.RAW_SNAPSHOT)
    return {
        "historic_updated": _mtime_iso(config.PLAYER_SEASON_PARQUET),
        "live_updated": live_updated,
        "source": "apex.duckdb",
    }
```

In `apex/api/app.py`, give the route a connection:

```python
@app.get("/api/meta")
def meta(con=Depends(get_db)):
    return queries.meta(con)
```

- [ ] **Step 4: Run the tests and watch them pass**

Run: `./venv/bin/python -m pytest tests/api/ -q`
Expected: PASS. The pre-existing `test_meta_has_source` still passes — it uses the `apex_db` fixture, so the new `Depends(get_db)` resolves.

- [ ] **Step 5: Commit**

```bash
git add apex/api/queries.py apex/api/app.py tests/api/test_ops.py
git commit -m "feat: /api/meta reports live_updated from the live_meta table"
```

---

### Task 3: Delete the refresh route

The route shells out to `python -m apex.live.cli refresh`, which imports pandas — absent from the API image. It has never returned `ok: true` in production and cannot. Deleting it also removes the subprocess-spawning surface from the web tier.

**Files:**
- Modify: `apex/api/routers/live.py` (drop `refresh_live`, `subprocess`, `sys`, `Path`, `logging`, `_ROOT`)
- Test: `tests/api/test_live_routes.py`

**Interfaces:**
- Consumes: nothing.
- Produces: `POST /api/live/refresh` no longer exists → 404/405. Task 4 removes the frontend caller.

- [ ] **Step 1: Write the failing test**

In `tests/api/test_live_routes.py`, **delete** the two refresh tests added in PR #1 (`test_refresh_logs_the_subprocess_failure`, `test_refresh_does_not_log_an_error_on_success`) and the `_fake_run` helper, plus the now-unused `import logging`, `import subprocess`, and `from apex.api.routers import live as live_router`. Replace them with:

```python
def test_refresh_route_is_gone(apex_db):
    """Request-time refresh cannot work in the deployed image (no pandas, ephemeral
    disk, and auto-deploy re-bakes the DB). Scores ship as a committed artifact."""
    assert client.post("/api/live/refresh").status_code in (404, 405)
```

- [ ] **Step 2: Run the test and watch it fail**

Run: `./venv/bin/python -m pytest tests/api/test_live_routes.py -q`
Expected: FAIL — `assert 200 in (404, 405)`. The route still answers 200 (with `ok: false` in the body — the exact trap that hid this bug).

- [ ] **Step 3: Write the minimal implementation**

Replace the top of `apex/api/routers/live.py` — delete the `refresh_live` function entirely and the imports it alone used, leaving:

```python
"""Live (Sofascore WC 2026) read routes."""
from fastapi import APIRouter, Depends
from ..db import get_db
from .. import queries

router = APIRouter(prefix="/api/live", tags=["live"])

@router.get("/matches")
def get_live_matches(con=Depends(get_db)):
    return queries.live_matches(con)
```

Leave `/fixtures`, `/standings`, and `/knockout` exactly as they are.

- [ ] **Step 4: Run the tests and watch them pass**

Run: `./venv/bin/python -m pytest -q`
Expected: PASS, **67 total** (64 baseline, +2 Task 1, +2 Task 2, −2 +1 here).

- [ ] **Step 5: Commit**

```bash
git add apex/api/routers/live.py tests/api/test_live_routes.py
git commit -m "refactor: delete POST /api/live/refresh

It cannot succeed in the deployed image and returned 200 with ok:false on
failure, so nothing monitoring HTTP status would ever have caught it."
```

---

### Task 4: Replace the button with "SCORES AS OF"

**Files:**
- Modify: `frontend/src/api/client.ts` (drop `refreshLive`, `RefreshResult`, `lastLine`)
- Modify: `frontend/src/api/client.test.ts` (drop the four `refreshLive` tests)
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/App.test.tsx`
- Modify: `frontend/src/theme.css` (drop `.wc-update*` and `.update-error`, add `.wc-asof`)

**Interfaces:**
- Consumes: `getMeta()` → `Meta { historic_updated: string|null; live_updated: string|null; source: string }` (already exists in `client.ts` and `types.ts`).
- Produces: nothing downstream.

Note: `frontend/src/components/SourceBadge.tsx` already renders a freshness string, but it is orphaned — only `pages/LivePage.tsx` imports it, and `main.tsx` renders `App` directly with no router, so it has never appeared. Do **not** wire it up or delete it; that is out of scope. Build the label into `App`.

- [ ] **Step 1: Write the failing test**

In `frontend/src/App.test.tsx`, **delete** both update tests from PR #1 (`shows the reason when "Update scores" fails...`, `shows no error banner when "Update scores" succeeds`). Replace the client mock at the top of the file:

```tsx
vi.mock('./api/client', () => ({
  getMeta: () => Promise.resolve({
    historic_updated: null,
    live_updated: '2026-07-12T10:00:00+00:00',
    source: 'apex.duckdb',
  }),
}))
```

Remove the `refreshLive` mock fn (the `const refreshLive = vi.fn()` line). Keep the `userEvent` import — the new tests below use it. Then add:

```tsx
test('the World Cup view shows when the scores were last snapshotted', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole('button', { name: /World Cup 2026/ }))

  const asOf = await screen.findByTestId('scores-as-of')
  expect(asOf).toHaveTextContent(/scores as of/i)
  expect(asOf).toHaveTextContent(/12 Jul|Jul 12/i)
})

test('the dead "Update scores" button is gone', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole('button', { name: /World Cup 2026/ }))

  expect(screen.queryByRole('button', { name: /Update scores/i })).not.toBeInTheDocument()
})
```

Keep `import userEvent from '@testing-library/user-event'` — the new tests use it.

- [ ] **Step 2: Run the test and watch it fail**

Run: `cd frontend && npx vitest run src/App.test.tsx`
Expected: FAIL — `Unable to find an element by: [data-testid="scores-as-of"]`, and the second test fails because the button is still rendered.

- [ ] **Step 3: Write the minimal implementation**

In `frontend/src/api/client.ts`, delete `refreshLive`, the `RefreshResult` interface, and the `lastLine` helper. In `frontend/src/api/client.test.ts`, delete the four `refreshLive` tests.

In `frontend/src/App.tsx`:

Replace the `refreshLive` import with `getMeta`:

```tsx
import { getMeta } from './api/client'
```

Delete the `updating` and `updateError` state and the whole `onUpdate` function. Add the meta fetch beside the existing one:

```tsx
  const { data: meta } = useAsync(() => getMeta(), [])
```

Replace the button block:

```tsx
        {source === 'wc' && (
          <button className="wc-update" onClick={onUpdate} disabled={updating}
            title="Fetch the latest scores from the live source">
            <span className="wc-update-dot" />{updating ? 'Updating…' : 'Update scores'}
          </button>
        )}
```

with the label:

```tsx
        {source === 'wc' && (
          <span className="wc-asof" data-testid="scores-as-of"
            title="Scores ship with the build; they are refreshed by re-running the scrape and committing apex.duckdb">
            Scores as of {meta?.live_updated
              ? new Date(meta.live_updated).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
              : '—'}
          </span>
        )}
```

Delete the error banner block added in PR #1:

```tsx
        {source === 'wc' && updateError && (
          <div className="update-error" data-testid="update-error" role="alert">
            <strong>⚠ Couldn't update scores.</strong> The scores below are unchanged. {updateError}
          </div>
        )}
```

In `frontend/src/theme.css`, delete the four `.wc-update*` rules and the two `.update-error` rules, and add:

```css
.wc-asof{margin-right:22px;flex:none;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);white-space:nowrap}
```

- [ ] **Step 4: Run the tests and watch them pass**

Run: `cd frontend && npx vitest run && npm run build`
Expected: tests PASS (**49 − 6 removed + 2 added = 45**), and `tsc -b` clean — confirming no dangling references to `refreshLive`.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/App.tsx frontend/src/App.test.tsx frontend/src/api/client.ts \
        frontend/src/api/client.test.ts frontend/src/theme.css
git commit -m "feat: replace the Update scores button with a Scores as of label

A button that cannot do anything is worse than no button. The app now states
what it is — a snapshot — instead of claiming to be live."
```

---

### Task 5: Refresh the committed data and document the ritual

This is the task that fixes the visible bug: production serves **1 match**, the source has **99**.

**Files:**
- Modify: `data/serving/apex.duckdb` (regenerated, 3.3 MB, already tracked)
- Modify: `README.md`

**Interfaces:**
- Consumes: `live_meta` from Task 1 (the regenerated DB must contain it — so this task MUST run after Task 1).
- Produces: the deployed dataset.

- [ ] **Step 1: Record the "before" state**

```bash
./venv/bin/python -c "
import duckdb
con = duckdb.connect('data/serving/apex.duckdb', read_only=True)
for t in ['live_matches','fixtures','standings','knockout','player_season','team_season','shots']:
    n = con.execute(f'select count(*) from \"{t}\"').fetchone()[0]
    print(f'{t:14s} {n:5d}')
"
```
Expected (before): `live_matches 1`, `fixtures 0`, `standings 48`, `knockout 26`, `player_season 546`, `team_season 20`, `shots 9168`.

- [ ] **Step 2: Run the scrape**

```bash
./venv/bin/python -m apex.live.cli refresh
```
Expected: log line `refresh: {'source': 'live', 'live': N, 'fixtures': N, ...}` with `source: 'live'`. **If it logs `source: 'cache'` or `'unavailable'`, STOP** — the scrape failed and fell back; the DB was not updated with fresh data. Do not commit; report it.

- [ ] **Step 3: Verify the historic tables survived and live_meta landed**

```bash
./venv/bin/python -c "
import duckdb
con = duckdb.connect('data/serving/apex.duckdb', read_only=True)
for t in ['live_matches','fixtures','standings','knockout','live_meta','player_season','team_season','shots']:
    n = con.execute(f'select count(*) from \"{t}\"').fetchone()[0]
    print(f'{t:14s} {n:5d}')
print(con.execute('select * from live_meta').fetchall())
"
```
Assert: `player_season` is still **546**, `team_season` **20**, `shots` **9168** — `serve()` only touches the live tables, and if those historic numbers moved, something is very wrong: **STOP and report**. Assert `live_meta` has 1 row with today's date and `source: 'live'`.

- [ ] **Step 4: Verify the API serves the new data**

```bash
./venv/bin/python -m uvicorn apex.api.app:app --port 8010 &
sleep 3
curl -s localhost:8010/api/meta
curl -s localhost:8010/api/live/matches | head -c 200
kill %1
```
Expected: `/api/meta` returns a non-null `live_updated`; `/api/live/matches` returns more than one match.

- [ ] **Step 5: Document the refresh ritual in README.md**

Add under the deployment section:

```markdown
### Refreshing the World Cup scores

Scores ship **with the build** — `data/serving/apex.duckdb` is a committed
artifact, not something the server fetches at runtime. (The API image has no
pandas/ScraperFC, Render's disk is ephemeral, and every deploy re-bakes the DB
from the Dockerfile — so a request-time refresh cannot persist.)

To publish new scores, scrape locally and commit the DB. Auto-deploy ships it:

```bash
python -m apex.live.cli refresh
git commit data/serving/apex.duckdb -m "data: refresh WC scores"
git push
```

The UI shows `SCORES AS OF <date>` from the `live_meta` table, so staleness is
visible rather than silent.
```

- [ ] **Step 6: Commit**

```bash
git add data/serving/apex.duckdb README.md
git commit -m "data: refresh WC scores from the live source

Production served 1 match; the source had 99. Scores now ship as a committed
build artifact — see README for the refresh ritual."
```

---

## Final verification

- [ ] `./venv/bin/python -m pytest -q` → **67 passed**
- [ ] `cd frontend && npx vitest run` → **45 passed**
- [ ] `cd frontend && npm run build` → clean
- [ ] `docker build -t pepstats-verify . && docker run -d -p 8899:8000 --name pepstats-verify pepstats-verify` then:
  - `curl -s localhost:8899/api/meta` → non-null `live_updated`
  - `curl -s localhost:8899/api/live/matches` → more than one match
  - `curl -s -X POST localhost:8899/api/live/refresh` → **404** (route gone)
  - `docker rm -f pepstats-verify && docker rmi -f pepstats-verify`
- [ ] Open a PR. Merging triggers the Render + Vercel auto-deploys.
