# APEX XI — Dashboard Frontend (Core Slice) — Design Spec

**Date:** 2026-07-07
**Status:** Approved (pending spec review)
**Scope:** Sub-project 4 of the APEX XI platform — the **presentation layer**. This spec covers the **core slice**: app shell + Historic **Players** view + **Live** view. (Sub-projects 1–3 — batch, speed, serving API — are done.)

## Problem

The serving API exposes historic (StatsBomb La Liga 2015/16) and live (Sofascore WC 2026) data as JSON. This builds the React dashboard that consumes it, implementing the `docs/APEX XI - Football Analytics v2.html` wireframe (React + D3, radars + pitch shot-maps). The core slice proves the whole stack end-to-end with the two flagship views; Teams/Compare/Overview follow in later specs.

## Key decisions (locked)

| Decision | Choice |
|----------|--------|
| Scope (this spec) | App shell + **Historic Players** (club dropdown → list → radar + shot map) + **Live** (matches/fixtures + WC group standings) |
| Stack | **Vite + React 18 + TypeScript + Tailwind** |
| Charts | **React-rendered SVG** using `d3-scale` + `d3-shape` for MATH only (no D3 DOM manipulation) |
| Routing | `react-router-dom`: `/` (Historic Players), `/live` (Live) |
| Data fetching | typed `fetch` client + `useAsync` hooks; live hooks poll ~45s |
| Backend | the serving API (`uvicorn apex.api.app:app`, CORS open); `VITE_API_URL` |

**Out of scope (no data / later specs):** heatmaps, momentum, pass-networks, per-match detail (the API doesn't serve these); Teams, Compare, Overview, Squad views (later frontend specs).

## Architecture & data flow

```
serving API (localhost:8000, JSON)
        │  fetch
        ▼
src/api/client.ts   (the ONLY module doing HTTP; typed fns per endpoint)  ← src/api/types.ts
        ▼
src/hooks/*         (useAsync + concrete hooks; live hooks poll 45s; own {data,loading,error})
        ▼
src/pages/*         (compose hooks + components)
        ▼
src/components/charts/*   (PURE: data props → React SVG, geometry via d3-scale/d3-shape)
```

**Boundaries:** `client.ts` is the only HTTP boundary; hooks own fetch state; pages compose; chart components are pure and their geometry helpers are unit-tested.

## Project structure (fresh Vite app in `frontend/`)

```
frontend/
  index.html  package.json  vite.config.ts  tailwind.config.js  postcss.config.js  tsconfig.json
  .env.example                         # VITE_API_URL=http://localhost:8000
  src/
    main.tsx  App.tsx  config.ts
    api/types.ts                       # Club, PlayerSeason, Shot, LiveMatch, Fixture, StandingRow
    api/client.ts                      # request<T> + getClubs/getPlayers/getPlayer/getShots/getLive*
    hooks/useAsync.ts  hooks/index.ts  # useClubs, usePlayers, usePlayer, useShots, useLiveMatches, useLiveFixtures, useLiveStandings
    components/Layout.tsx  Nav.tsx  Loading.tsx  ErrorState.tsx  Empty.tsx  SourceBadge.tsx
    components/PlayerList.tsx  PlayerDetail.tsx  MatchCard.tsx  StandingsTable.tsx
    components/charts/RadarChart.tsx  components/charts/ShotMap.tsx
    pages/PlayersPage.tsx  pages/LivePage.tsx
    styles/globals.css
    **/*.test.tsx                      # Vitest + RTL
```

## Components

### API layer
- **`config.ts`** — `export const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000"`.
- **`api/types.ts`** — interfaces mirroring the API JSON:
  - `Club { team_id: number; team: string }`
  - `PlayerSeason` — identity (`player_id, team_id, player, team, primary_position, position_group, minutes, appearances`), raw (`goals, assists, xg, xa, shots, ...`), and the ten `percentile_*_per90` numbers used by the radar.
  - `Shot { shot_id, team_id, player_id, minute, location_x, location_y, shot_statsbomb_xg, outcome, body_part, shot_type }`
  - `LiveMatch { id, home_team, away_team, home_flag, away_flag, home_score, away_score, status, minute, stage, kickoff }`
  - `Fixture { id, home_team, away_team, home_flag, away_flag, stage, kickoff }`
  - `StandingRow { group, rank, team, flag, played, w, d, l, gf, ga, gd, points }`
- **`api/client.ts`** — `class ApiError extends Error`; `request<T>(path): Promise<T>` (GET, throws `ApiError` on non-2xx/network); typed fns: `getClubs()`, `getPlayers({club?, position?, limit?})`, `getPlayer(id)`, `getShots({club?, player?})`, `getLiveMatches()`, `getLiveFixtures()`, `getLiveStandings()`, `getMeta()`.

### Hooks
- **`useAsync<T>(fn, deps) -> {data, loading, error, reload}`** — runs `fn`, tracks state, cancels stale results on dep change/unmount.
- Concrete hooks wrap `useAsync`: `useClubs`, `usePlayers(club, position)`, `usePlayer(id)`, `useShots(player)`, `useLiveMatches`, `useLiveFixtures`, `useLiveStandings`. **Live hooks** add a `setInterval` (~45s) calling `reload`, cleared on unmount.

### Shell
- **`Layout` + `Nav`** — APEX XI brand; nav links **Historic** (`/`) and **Live** (`/live`); `SourceBadge` (freshness from `getMeta`). `Loading`, `ErrorState` (with a retry button calling `reload`), `Empty` are shared primitives.
- **`App`** — `BrowserRouter`; routes `/`→`PlayersPage`, `/live`→`LivePage` inside `Layout`.

### Historic Players view
- **`PlayersPage`** — club `<select>` (from `useClubs`) → `club`; position filter (All/GK/DEF/MID/FWD) → `position`; `usePlayers(club, position)` → `PlayerList`; a selected `playerId` → `usePlayer` + `useShots` → `PlayerDetail`.
- **`PlayerList`** — table of players (name, position, minutes, goals, xg), row click selects.
- **`PlayerDetail`** — header + stat tiles (goals, xg, assists, xa) + `RadarChart` + `ShotMap`.
- **`charts/RadarChart`** (pure) — props `metrics: {label: string; value: number}[]` (from the ten `percentile_*_per90` fields → readable labels). Pure helper `radarPoints(values: number[], radius: number): [number,number][]` (d3-scale linear 0–100→radius, `n` equal angles). Renders `<svg>`: grid rings (25/50/75/100), axes, filled `<polygon>`, axis labels. **`radarPoints` is unit-tested** (known values → known coordinates).
- **`charts/ShotMap`** (pure) — props `shots: {location_x, location_y, xg, outcome}[]`. A pure `pitchScale(width, height)` maps StatsBomb 120×80 → SVG px. Renders an SVG pitch (attacking half + box + goal) and one `<circle>` per shot: `r ∝ xg`, `fill` by `outcome` (Goal/Saved/Off-Target/Blocked) + a legend. **`pitchScale` unit-tested.**
- **Chart design:** the chart tasks load the **dataviz skill** before writing chart code (accessible outcome palette, scales, legend, light/dark) so charts read as one system and match the wireframe.

### Live view
- **`LivePage`** — `useLiveMatches` (around-now grid), `useLiveFixtures` (upcoming), `useLiveStandings` (WC groups), all polling ~45s; `SourceBadge`. Empty rules: no live → still show recent/upcoming; empty fixtures → hide section; standings render grouped A–L.
- **`MatchCard`** — flags + names, score or kickoff, status badge (LIVE red pulse + minute / FINISHED / SCHEDULED), stage.
- **`StandingsTable`** — grouped tables (rank · flag · team · P · W · D · L · GD · **Pts**); one per `group`.

## Error / loading / empty

| Situation | Behavior |
|-----------|----------|
| Fetch in flight | `Loading` |
| API down / non-2xx | `ErrorState` with retry (calls hook `reload`) |
| Empty collection | `Empty` message (e.g. "no live matches right now") |
| Stale live data | `SourceBadge` shows last-updated from `/api/meta` |

## Testing (TDD where it fits)

- **Chart geometry (unit):** `radarPoints` and `pitchScale` with known inputs → exact coordinates (deterministic, no DOM).
- **`api/client`:** mocked `fetch` → typed parse of a sample payload; `ApiError` thrown on 500 and network error.
- **Hooks:** mocked client → `loading→data` transition; error path sets `error`; a live hook triggers a second fetch after its interval (fake timers).
- **Components:** `PlayerList` renders N rows; `MatchCard` shows the LIVE badge only when `status==="LIVE"`; `StandingsTable` groups; `RadarChart` renders one `<polygon>` with N points; `ShotMap` renders one `<circle>` per shot.
- **Manual smoke:** run `uvicorn apex.api.app:app` + `npm run dev`; open browser; verify Players (Barcelona → Suárez → radar + shot map) and Live (WC standings) render real data; `npm run build` + `tsc` clean.
- **Tooling:** Vitest + `@testing-library/react` + `jsdom`.

## Risks / open items

- **API must be running:** the dashboard is useless without `uvicorn apex.api.app:app`. `ErrorState` makes this obvious; README/`.env.example` document it.
- **`/players/{id}` composite key:** the API returns the highest-minutes row for a `player_id`; a transferred player shows one club. Acceptable for the core slice.
- **Live emptiness:** WC may be between matches (empty live/fixtures) — the empty states cover this; standings still populate.
- **Chart fidelity:** we match the wireframe's *look* (radar, pitch) via React SVG, not its exact D3 internals; close enough and more testable.
- **d3-scale/d3-shape as the only D3:** kept to math; if a future chart needs D3 DOM behavior, revisit.
