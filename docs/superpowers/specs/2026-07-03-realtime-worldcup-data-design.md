# Real-Time World Cup 2026 Data — Design Spec

**Date:** 2026-07-03
**Status:** Approved — provider verified live (Colombia 1–0 Ghana IN_PLAY, WC 2026 season confirmed on the free key, 2026-07-03)
**Approach:** A — On-demand fetch + Redis cache, frontend polls REST

## Problem

The dashboard currently shows **static, hardcoded** data (France vs Argentina, fixed
standings/top-scorers). The frontend pages don't call the backend at all, and the backend
has no match-data endpoints. The user wants:

1. **Real-time** analytics for a currently in-play match.
2. A real **upcoming-match schedule** per the actual FIFA World Cup 2026 calendar.

## Provider decision & history

- **api-football (API-Sports)** was the first choice — but its **free tier blocks the
  current season (2026) and all live data** (verified live: `"Free plans do not have
  access to this season, try from 2022 to 2024"`). Rejected for the free requirement.
- **football-data.org** free tier **includes the World Cup and current-season data**
  (creator commits to keeping the 12 free competitions free, current data included).
  **Selected**, pending a live check with a real key.

### What the football-data.org free tier gives us

| Data | Free tier? |
|------|-----------|
| WC 2026 fixtures / schedule | ✅ |
| Live score + match status + minute | ✅ |
| Group standings | ✅ |
| Top scorers | ✅ |
| **Possession %, shots, shots-on-target, xG, lineups, detailed events** | ❌ (paid "Deep Data" €29/mo) |

**User decision:** possession/shots are **hidden** from the UI (shown as "—" / removed).
We only display data we actually have. No payment.

## Scope & Decisions

| Decision | Choice |
|----------|--------|
| Data provider | **football-data.org** (`https://api.football-data.org/v4`) |
| Auth | `X-Auth-Token` header; key in `.env` as `FOOTBALL_API_KEY` (user registers — free) |
| Competition | **FIFA World Cup 2026** (competition code `WC`, current edition) |
| No live match right now | Live view falls back to **next upcoming fixture + last result** |
| Delivery | Backend caches in Redis; frontend polls backend REST |
| Rate limit | Free tier = **10 requests/minute** (no hard daily cap) |
| In-match stats | Possession/shots **hidden** (not on free tier) |

Out of scope (may layer on later): WebSocket push (Approach B), Kafka/Spark pipeline
(Approach C), paid Deep Data stats, sentiment/prediction changes (those endpoints already
exist and are untouched).

## Architecture & Data Flow

```
football-data.org v4  (competition WC, current season)
        │  (called ONLY on Redis cache miss)
        ▼
ingestion/football_data.py   ── sole caller of the provider
        │                       get_live(), get_upcoming(), get_recent(),
        │                       get_match(id), get_events(id),
        │                       get_standings(), get_topscorers()
        ▼
Redis (already running)      ── per-endpoint cache key + TTL
        │                       + long-lived "last-good" copy for fallback
        ▼
api/main.py  (new REST endpoints)  read Redis → (miss) client → cache → return
        │
        ▼
frontend pages   fetch via api.ts; live views re-poll on interval
```

**Key invariant:** `football_data.py` is the *only* module that talks to the provider.
The backend endpoints and the frontend only ever see our normalized JSON, never the raw
provider payload. The Redis TTL — not the number of browser tabs — bounds upstream requests.

### Rate strategy (10 req/min, no daily cap)

Generous per-minute limit makes this easy. TTLs:

| Data | Redis key | TTL |
|------|-----------|-----|
| Live matches | `wc:live` | 45s |
| Upcoming fixtures | `wc:upcoming` | 6h |
| Recent results | `wc:recent` | 1h |
| Standings | `wc:standings` | 1h |
| Top scorers | `wc:scorers` | 6h |
| Single match | `wc:match:{id}` | 45s if live, else 1h |
| Match events (goals) | `wc:events:{id}` | 45s if live, else 1h |

Even with several concurrent viewers, cache TTL caps upstream calls well under 10/min.
On `429` (per-minute burst) or error, serve last-good and back off.

## Component 1 — `ingestion/football_data.py` (API client)

Thin, stateless client. Only module importing `requests` for the provider.
Base URL `https://api.football-data.org/v4`, header `X-Auth-Token: <FOOTBALL_API_KEY>`.

**Public methods** (each returns *normalized* data, never raw provider JSON):
- `get_live() -> list[Match]` — WC matches with status IN_PLAY/PAUSED.
- `get_upcoming(n=10) -> list[Match]` — next N SCHEDULED/TIMED WC matches.
- `get_recent(n=5) -> list[Match]` — last N FINISHED WC matches.
- `get_match(id) -> Match | None`
- `get_events(id) -> list[dict]` — goals only on free tier: `{minute, type:"goal", team, player}`.
- `get_standings() -> list[dict]` — `{rank, team, flag, w, d, l, gf, ga, pts}`.
- `get_topscorers() -> list[dict]` — `{rank, player, team, flag, goals, assists}`.

**Upstream endpoints used:**
- `GET /competitions/WC/matches?status=LIVE|SCHEDULED|FINISHED`
- `GET /matches/{id}`
- `GET /competitions/WC/standings`
- `GET /competitions/WC/scorers`

**Two mapping helpers:**
- `map_status(s: str) -> "LIVE"|"SCHEDULED"|"FINISHED"`
  - LIVE: `IN_PLAY, PAUSED`
  - SCHEDULED: `SCHEDULED, TIMED`
  - FINISHED: `FINISHED, AWARDED`
  - (Others — `SUSPENDED/POSTPONED/CANCELLED` — → `SCHEDULED`, logged.)
- `country_to_flag(name: str) -> str` — emoji flag lookup (UI uses emoji flags);
  unknown → 🏳️, logged.

**Error handling:** football-data.org returns proper HTTP codes. `403` (competition not on
plan / bad key), `429` (rate), `4xx/5xx`, or network error → raise `FootballDataError`.
The caller (cache layer) catches this and falls back.

### Normalized `Match` shape (revised — no possession/shots)

```jsonc
{
  "id": 537121,
  "team1": { "name": "France", "flag": "🇫🇷", "score": 2 },
  "team2": { "name": "Argentina", "flag": "🇦🇷", "score": 1 },
  "time": "67'",          // live minute, or kickoff time (ISO/local) if SCHEDULED
  "stadium": "MetLife Stadium",   // venue if provided, else null
  "status": "LIVE"        // LIVE | SCHEDULED | FINISHED
}
```

`possession`, `shots`, `shotsOnTarget` are **removed** — not available on the free tier.

## Component 2 — Cache layer + backend endpoints (`api/main.py`)

A small helper `cached(key, ttl, fetch_fn)`:
1. `GET key` from Redis → hit → return with `source: "cache"`.
2. Miss → `fetch_fn()` (client call) → store under `key` (TTL) **and** under
   `key:lastgood` (no/long TTL) → return with `source: "live"`.
3. `fetch_fn` raises → return `key:lastgood` if present (`source: "cache"`), else
   labeled mock (`source: "mock"`). Never raises to the client.

**New endpoints** (envelope adds `source` and `fetched_at` to every response):

| Endpoint | Returns | Cache key / TTL |
|----------|---------|-----------------|
| `GET /matches` | `{ live[], upcoming[], recent[] }` (composite) | `wc:live` 45s, `wc:upcoming` 6h, `wc:recent` 1h |
| `GET /match/{id}` | `Match` | `wc:match:{id}` 45s live / 1h |
| `GET /match/{id}/events` | `[{minute, type, team, player}]` (goals) | `wc:events:{id}` 45s live / 1h |
| `GET /standings` | `[{rank, team, flag, w, d, l, gf, ga, pts}]` | `wc:standings` 1h |
| `GET /leaderboards` | `[{rank, player, team, flag, goals, assists}]` | `wc:scorers` 6h |

**Removed vs original spec:** `GET /match/{id}/stats` — no possession/shots on free tier,
so this endpoint is dropped (frontend won't call it).

**`/matches`** composes three independently-cached sub-fetches (`wc:live`, `wc:upcoming`,
`wc:recent`) and returns them together. If `live` is empty, the frontend uses
`upcoming[0]` + `recent[0]` for the hero area (the "no live match" fallback).

Existing endpoints (`/health`, `/status`, `/sentiment/*`, `/predictions/*`, `/cache/*`,
WebSocket routes) are unchanged.

## Component 3 — Frontend rewiring

`src/config/api.ts` already references `/matches`, `/standings`, `/leaderboards`,
`/match/{id}`, `/match/{id}/events` — no path changes (the now-unused `matchStats` entry
is removed).

- **`hooks/useMatchData.ts`** — drop the `/match/{id}/stats` fetch; add polling: when
  `match.status === 'LIVE'`, re-fetch every **30s** (`setInterval`, cleared on unmount).
- **`hooks/useMatches.ts`** (new) — fetches `/matches`; polls every **45s** so a match
  going live appears automatically; exposes `{ live, upcoming, recent, loading, error }`.
- **`pages/TournamentPage.tsx`** — remove the two hardcoded arrays. Fetch `/standings` and
  `/leaderboards`. Add three top sections from `useMatches()`:
  - **Live Now** — live card(s) linking to `/match/:id`; when `live` is empty, show
    next upcoming fixture + last result.
  - **Upcoming Matches** — real WC schedule (`upcoming[]`: date, teams, stadium, kickoff).
  - **Recent Results** — `recent[]`.
- **`pages/LiveMatchPage.tsx`** — drive off `useMatchData(id)` (drop hardcoded match);
  show live minute/score and a goals feed from `/match/{id}/events`; a "LIVE" pulse when
  live. **No possession/shots section** (removed).
- **`components/MatchCard.tsx`** — reused for live/upcoming/recent cards; **shots/possession
  UI removed**; shows score, minute/kickoff, status, stadium.
- **`hooks/useMatchData.ts` `Match` interface** — drop `possession`, `shots`,
  `shotsOnTarget` fields.
- Every page gets explicit **loading / error / empty** states. A small badge surfaces
  `source` (`live` vs `sample data`).

CORS is already open on the backend (`allow_origins=["*"]`).

## Config & Secrets

- `FOOTBALL_API_KEY` in `.env` (already effectively gitignored — see note). Client
  reads via `os.getenv`; never logged, never committed.
- Add `FOOTBALL_API_KEY=` to `env.example` (placeholder) alongside the existing
  `FOOTBALL_API_KEY` (which is now unused; keep or remove — noted for cleanup).
- Constants: `COMPETITION="WC"`, base URL in `football_data.py`.
- **Note (separate cleanup):** the repo's ignore file is named `gitignore`, not
  `.gitignore`, so it isn't active. It already lists `.env`. Must rename to `.gitignore`
  before any git commit so `.env` is actually ignored.
- **User action required:** register a free key at
  `https://www.football-data.org/client/register`, then put
  `FOOTBALL_API_KEY=<key>` in `.env`.

## Error Handling Summary

| Failure | Behavior |
|---------|----------|
| Cache hit | Serve cached, `source: "cache"` |
| Cache miss, API ok | Serve live, cache it, `source: "live"` |
| `403` (plan/key) / `429` / network error | Serve last-good, `source: "cache"`, back off |
| Cold start + no key/API down | Serve labeled mock, `source: "mock"`, HTTP 200 |
| Frontend fetch fails | Page shows error state (not blank) |

## Testing

- **Client (unit, TDD):** mock the HTTP layer; feed recorded football-data.org sample JSON;
  assert Match normalization, `map_status`, `country_to_flag`, `403`/`429`/error → raises.
- **Backend endpoints:** FastAPI `TestClient` + `fakeredis` + mocked client; assert cache
  hit/miss, TTL, `source` labeling, both fallback tiers (last-good, then mock).
- **Frontend:** no test harness exists; **manual dev-server smoke test** with a real key
  (real WC data renders, live view polls, empty/error states show). Vitest not added
  unless requested.
- **End-to-end:** with the key in `.env`, hit each endpoint and load the dashboard against
  live WC 2026 data.
- Automated tests use recorded JSON (real live matches only exist at kickoff time); the
  live path is verified against a real recent match id.

## Files Touched

**New:** `ingestion/football_data.py`, `frontend/src/hooks/useMatches.ts`,
tests under `Testing/` (client + endpoints), recorded JSON fixtures.
**Modified:** `api/main.py` (new endpoints + cache helper),
`frontend/src/pages/TournamentPage.tsx`, `frontend/src/pages/LiveMatchPage.tsx`,
`frontend/src/hooks/useMatchData.ts`, `frontend/src/components/MatchCard.tsx`,
`frontend/src/config/api.ts` (drop `matchStats`), `env.example` (add key var).
**Unchanged:** sentiment/prediction/cache/WebSocket code, databases.

## Risks / Open Items

- **MUST VERIFY before building:** that the football-data.org free key actually returns
  **WC 2026 matches** (fixtures + a live/current match) — the api-football lesson. Blocked
  on the user's key. If WC 2026 isn't loaded yet or is gated, revisit provider.
- **Minute precision:** football-data.org's live `minute` may be coarse or absent; if
  absent, derive elapsed from `utcDate`. Noted as approximate.
- **Flag emoji coverage:** `country_to_flag` needs all WC 2026 participants; unknowns fall
  back to 🏳️ and are logged.
- **Unused api-football code:** `ingestion/scraper.py` targeted api-football; it becomes
  dead/legacy. Leave in place (out of scope) or remove in a later cleanup.
