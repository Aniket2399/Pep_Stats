# APEX XI — Exact Wireframe Reproduction — Design Spec

**Date:** 2026-07-07
**Status:** Approved (design fully fixed by the user's wireframe; user chose "all 14 tabs, one build")
**Supersedes:** the simplified `frontend/` from the prior core-slice spec (rejected — did not match the wireframe). This rebuild replaces `frontend/`.

## Problem

The user's wireframe `docs/APEX XI - Football Analytics v2.html` is the exact target UI. It is an Anthropic **design-tool export** (`class Component extends DCLogic` on a proprietary bundler runtime, data hardcoded in the constructor) — so it cannot be run verbatim in a normal app. Requirement: **reproduce the exact UI + charts in clean React**, driven by the user's data files, with an adapter mapping our serving API into the same shape. "Don't change the UI at all."

## Reference material (source of truth for fidelity)

Extracted from the wireframe (in the session scratchpad, read by implementers):
- `component_source.jsx` (75 KB) — the exact component logic: all 14 tabs, layout, hardcoded sample data (real La Liga 2014/15 values), and hand-rolled SVG chart builders (radar, pitch shot-map, bars). **The authoritative reference for every tab.**
- `wireframe.css` (30 KB) — the exact CSS: `:root` tokens, panel/nav/table styles, fonts (Archivo/Inter).
- `docs/data/football_analytics_data.json` — the clean data contract (`historic.standings[20]`, `historic.fc_barcelona_squad[22]`, `world_cup_2026.team_metrics[48]`, `world_cup_2026.group_standings[12×4]`).

## Design tokens (exact)

`--bg:#0e1116 --panel:#161b22 --panel-2:#1d242e --ink:#eef2f6 --muted:#8a93a0 --line:#28313d --accent:#2f7fe0 --accent2:#e8792b --navy:#004d98 --win:#28c76f --gold:#f2a900`; fonts **Archivo** (display) + **Inter** (body) from Google Fonts. Club colors per-team from the reference (e.g. Barcelona `#a50044`, Real Madrid `#00529f`).

## The 14 tabs (from the wireframe)

Historic (StatsBomb-style): **Overview, Matches, Standings, Squad, Trends, Set Pieces, Compare, Players**.
World Cup 2026 (ScraperFC-style): **Live, Groups, Bracket, Teams, Stadiums, Lambda**.
Each tab's exact layout, copy, and charts come from `component_source.jsx`.

## Architecture

```
docs/data/football_analytics_data.json  ──┐  (default: sample data)
serving API (apex.duckdb)  → adapter ──────┤→  AppData (the wireframe's expected shape)
                                           ▼
frontend/ (Vite+React+TS)  → exact reproduction of the wireframe component (14 tabs, CSS tokens, SVG charts)
```

- `src/data/sample.ts` — imports `football_analytics_data.json` (copied into `src/data/`).
- `src/data/adapter.ts` — `fromApi(): Promise<AppData>` maps serving-API responses (`/api/standings`, `/api/players?club=…`, `/api/live/standings`, etc.) into the SAME `AppData` shape as the sample. A source toggle (Sample ↔ Live) in the UI; sample is the default so the exact UI shows immediately.
- `src/types.ts` — `AppData` matching `football_analytics_data.json`.
- `src/theme.css` — the exact tokens + base styles from `wireframe.css`.
- `src/App.tsx` — the shell: header, the tab bar (Historic / World Cup groups), `accent` + active-tab state.
- `src/tabs/<Tab>.tsx` — one component per tab, reproduced from the reference.
- `src/charts/` — reusable SVG chart builders reproduced from the reference (`Radar`, `ShotMap`/pitch, `Bars`, `MiniTable`, sparkline, etc.).

## Data mapping (adapter → AppData)

| AppData field | Serving-API source |
|---------------|--------------------|
| `historic.standings` | `/api/standings` (team_season) → pos/team/W/D/L/GF/GA/Pts |
| `historic.fc_barcelona_squad` | `/api/players?club=<Barcelona team_id>` (player_season) → number/player/position/season stats |
| `world_cup_2026.team_metrics` | `/api/live/... ` team metrics (possession/xg/xga/ppda/rating) where available; else sample |
| `world_cup_2026.group_standings` | `/api/live/standings` grouped |

Where the API lacks a field the wireframe shows (e.g. per-match schedules, set-piece detail, bracket), the tab uses the **sample data** (documented) — the UI still renders exactly.

## Error / loading / empty

Sample data is bundled (no network) so the exact UI always renders. The Live toggle fetches the API; on failure it falls back to sample and shows a small notice. Per-tab empty states where a dataset is absent.

## Testing

- **Adapter unit tests** (Vitest): `fromApi` maps sample-shaped API fixtures → correct `AppData` (standings order, squad fields, grouped WC standings).
- **Chart builders unit tests**: geometry helpers (radar points, pitch coords, bar scales) with known inputs.
- **Tab render tests**: each tab renders from sample `AppData` without crashing and shows key labels.
- **Visual fidelity**: manual — run `npm run dev`, compare each tab side-by-side with the wireframe; this is the acceptance gate (the user confirms it looks identical).
- Build/typecheck clean (`npm run build`).

## Scope & sequencing

All 14 tabs (user's choice). Built in dependency order: **theme + shell + data/adapter first**, then tabs grouped: Standings/Squad/Players/Overview (historic, data-backed), WC Groups/Teams/Live (WC, data-backed), then Matches/Trends/Set Pieces/Compare/Bracket/Stadiums/Lambda (sample-backed). The user will visually verify the shell + first data-backed tabs early to confirm fidelity before the remaining tabs.

## Risks

- **Fidelity drift:** reproducing from reference risks small visual differences. Mitigation: implementers read `component_source.jsx`/`wireframe.css` directly and copy exact tokens/markup; user visually verifies early.
- **Scale:** 14 tabs is large; sequenced so a faithful, data-backed subset is viewable quickly.
- **Data gaps:** some wireframe tabs show data our API doesn't have → those use the sample data (documented), UI unchanged.
- **This reproduces the user's own design artifact** at their request; charts/layout are rebuilt as clean React, not copied from the proprietary bundler runtime.
