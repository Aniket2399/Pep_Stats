# APEX XI — React Frontend on Real Data (Core 6 Tabs) — Design Spec

**Date:** 2026-07-07
**Status:** Approved (design approved by user; "don't commit anything right now")
**Scope decision:** Phase 1 — wireframe shell + the 6 real-data-backed tabs. Remaining tabs follow in later specs.

## Problem

The React app in `frontend/` is a working but simplified 2-page Tailwind app (Historic Players + Live WC), already wired to the serving API. The user wants it to (a) look like the wireframe (`docs/APEX XI - Football Analytics v2.html` — dark 14/17-tab dashboard) and (b) run on **real data** from the serving API, mapped into the same shape as the sample data.

**Data policy (differs by source — per user instruction):**
- **World Cup tabs: DYNAMIC ONLY.** Use real serving-API data (or values *derived* from real data). **No static sample data for WC.** If real data is absent, show an empty/"live data unavailable" state — never a static WC value. On total API failure, WC tabs render empty (not sample).
- **Historic tabs: static allowed.** Use real data first, but the bundled sample `docs/data/football_analytics_data.json` may fill per-field gaps (form, shirt number) and serve as a whole-tab fallback on API failure.

## Chosen scope (Phase 1)

Shell + theme + 7 tabs:
- **Historic** (La Liga 2015/16, StatsBomb): Overview, Standings, Squad
- **World Cup 2026** (dynamic): Groups, Teams (derived), **Bracket** (dynamic from knockout matches), Live

Remaining wireframe tabs (Matches, Trends, Set Pieces, Compare, Players shot-map, WC Overview/Bracket/Compare/Players/Insights/Lambda, Stadiums) are **out of scope for this spec** and sequenced into follow-ups.

## Real data available (verified in `data/serving/apex.duckdb`)

- `team_season` (20) — La Liga 2015/16: team_id, team, matches, wins, draws, losses, gf, ga, points, gd, xg_for, xg_against, possession_pct, ppda, percentiles.
- `player_season` (546) — player, team, primary_position, position_group, goals, assists, xg, xa, shots, minutes, appearances, per-90s, percentiles.
- `shots` (9168) — shot events with locations + StatsBomb xG. (Not used in Phase 1.)
- `standings` (48) — WC 2026 group tables: group, rank, team, flag, played, w, d, l, gf, ga, gd, points.
- `live_matches` (2) — WC 2026 matches (home/away/scores/status/stage/kickoff). `fixtures` is empty (0).

Serving API (FastAPI, `http://localhost:8000`) already exposes: `/api/standings`, `/api/clubs`, `/api/teams`, `/api/players`, `/api/players/{id}`, `/api/shots`, `/api/live/standings`, `/api/live/matches`, `/api/live/fixtures`, `/api/meta`. No new backend endpoints are required for Phase 1.

## Design tokens (exact, from extracted `wireframe.css`)

Default (historic) palette:
`--bg:#0e1116 --panel:#161b22 --panel-2:#1d242e --ink:#eef2f6 --muted:#8a93a0 --line:#28313d --accent:#2f7fe0 --accent2:#e8792b --navy:#004d98 --nav2:#0a0a0a --win:#28c76f --gold:#f2a900`.
WC override (`.wc` class):
`--bg:#0b0722 --panel:#181038 --panel-2:#221650 --ink:#f4effe --muted:#a99fce --line:#342a60 --accent:#e21d43 --accent2:#ffc93c --navy:#2a1668 --nav2:#150b34 --win:#2ee6b6 --gold:#ffcf40` + radial-gradient background.
Fonts: **Archivo** (display) + **Inter** (body). Club crest gradient e.g. Barcelona `#004d98 / #a50044`.

## Architecture

```
serving API (localhost:8000)  ──┐  via src/api/client.ts (existing)
                                 ├─→ src/data/adapter.ts  ─→ AppData  ─→ src/tabs/*
docs/data sample.json (fallback) ┘   (real → derived → sample)
```

New/changed files under `frontend/src/`:

- `theme.css` — exact `:root` tokens + component classes ported from `wireframe.css` (`.fifa-top`, `.fifa-nav`/`.tab`, `.wrap-main`, `.panel`, `.kpi-strip`, `.ltable`, `.squad`/`.pl-item`, `.grp-grid`/`.grp-card`, `.team-grid`/`.tcard`, `.wcbar`/`.livecard`, `.wc` override). New tabs use these classes; Tailwind remains installed but is not used for the new views.
- `data/sample.json` — copy of `docs/data/football_analytics_data.json` (bundled fallback).
- `data/types.ts` — `AppData` (`historic.standings[]`, `historic.squad[]` per club, `world_cup_2026.team_metrics[]`, `world_cup_2026.group_standings[]`, `live.matches[]`) matching the sample shape.
- `data/deriveWc.ts` — `deriveTeamMetrics(standings): WcTeamMetric[]` computing rating / goal-rate / attack-defense strength from real `/api/live/standings`.
- `data/adapter.ts` — per-tab async loaders (`loadStandings`, `loadOverview`, `loadSquad`, `loadGroups`, `loadWcTeams`, `loadLive`) that call `api/client.ts`, merge sample fallback for missing fields, and return `AppData` slices. Whole-app fallback to sample on total API failure, surfaced via a notice.
- `App.tsx` — the shell: FIFA top-bar, dark nav tab-bar, Historic↔WC **source toggle**, **club selector**, active-tab state. Replaces the current react-router 2-route setup (wireframe is a single-page tab UI; routing dropped).
- `tabs/Overview.tsx`, `tabs/Standings.tsx`, `tabs/Squad.tsx`, `tabs/WcGroups.tsx`, `tabs/WcTeams.tsx`, `tabs/WcBracket.tsx`, `tabs/WcLive.tsx`.
- `charts/` — reuse existing `RadarChart`, `ShotMap`, `geometry`; add `Donut.tsx` and `Bars.tsx`.
- Reuse existing `hooks/useAsync`, `components/{Loading,ErrorState,Empty,SourceBadge}`; adapt `MatchCard`/`PlayerList`/`StandingsTable` markup to the wireframe classes.

## Per-tab data mapping

| Tab | Real source | Fallback for gaps |
|---|---|---|
| **Overview** (historic) | `/api/standings` (selected club row) + `/api/players?club=` → hero, 6-KPI strip (Pts, GF, GA, GD, xG, possession%), top scorers list, shot-outcome/possession donut | `form` string → sample `historic.standings[].form` by team name; else blank |
| **Standings** (historic) | `/api/standings` → pos/team/P/W/D/L/GF/GA/GD/Pts, positional zone bars (top-N = UCL/EUR, bottom-N = REL — pure UI) | miniform → sample by team name; else omit |
| **Squad** (historic) | `/api/players?club=` → list + detail (position, apps, goals, assists, minutes, per-90 radar from percentiles) | shirt number → sample `fc_barcelona_squad` by name; else list index |
| **WC Groups** | `/api/live/standings` grouped into 12 cards (4 rows each), qualification highlight (top 2) — **fully real** | none (empty state if API down) |
| **WC Teams** | **derived** from real `/api/live/standings` via `deriveWc.ts` (rating, xG proxies, goal-rate). Shows only derived/real fields. | none — no sample overlay (dynamic-only) |
| **WC Bracket** | **dynamic** from `/api/live/matches` + `/api/live/fixtures`, grouped by `stage` (Round of 16 → Final) into bracket columns | none — TBD slots where real ties are absent (never static sample) |
| **WC Live** | `/api/live/matches` (2 real) + `/api/live/fixtures` | empty state (no sample) |

## Error / loading / empty

- Per-tab loading spinner, error state with retry, empty state (existing components).
- On a total serving-API failure, the adapter returns **historic** slices from the bundled sample (with a "sample data" notice) but leaves **World Cup** slices empty — WC never shows static sample data. Each WC tab then renders its own empty/"live data unavailable" state.

## Testing

- **Adapter unit tests** (Vitest): each loader maps sample-shaped API fixtures → correct `AppData`; sample-fallback merge fills missing fields; total-failure path returns sample.
- **`deriveWc.ts` unit tests**: known standings input → expected derived metrics (ordering, bounds).
- **Chart geometry tests**: existing `geometry.test.ts` retained; add cases for `Donut`/`Bars` scales.
- **Tab render tests**: each of the 6 tabs renders from a fixture `AppData` without crashing and shows key labels (team name, KPI labels, group letters, match scores).
- **Build/typecheck**: `npm run build` (`tsc -b && vite build`) and `npx vitest run` clean.
- **Visual fidelity**: manual — `npm run dev` against a running serving API; compare the 6 tabs to the wireframe. This is the acceptance gate.

## Sequencing

1. Introduce `theme.css` + fonts; build the shell (`App.tsx`: top-bar, nav, source toggle, club selector).
2. `data/types.ts` + `data/sample.json` + `data/adapter.ts` + `data/deriveWc.ts` with tests.
3. Historic tabs (Standings → Overview → Squad), then WC tabs (Groups → Teams → Bracket → Live).
4. Wire tabs to adapter; loading/error/empty; whole-app sample fallback.
5. Verify: tests green, build clean, manual visual pass with the serving API running.

## Risks

- **Fidelity drift** vs the wireframe — mitigated by porting exact tokens/classes from the extracted `wireframe.css` and verifying visually against a small tab set early.
- **Season mismatch** — sample historic is La Liga 2014/15; real data is 2015/16. Standings/Overview/Squad show **real 2015/16**; only per-field fallbacks (form, shirt number) borrow from the 2014/15 sample, matched by name (best-effort; blank if unmatched).
- **WC advanced metrics don't exist as real data** — the Teams tab shows only values **derived from real standings**, clearly labeled "derived". No sample overlay (WC is dynamic-only), so possession/xG-style fields the derivation can't produce are simply not displayed.
- **Bracket data is sparse** — real `live_matches` currently holds only 2 finished Round-of-16 ties. The Bracket tab renders whatever real knockout ties exist and shows TBD slots elsewhere; it never fills gaps with static sample ties.
- **No commits yet** — `frontend/` is untracked; per user instruction nothing is committed in this session. A restore point will be created only when the user asks.
