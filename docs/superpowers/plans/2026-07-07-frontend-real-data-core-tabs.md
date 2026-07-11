# APEX XI Frontend — Real Data, Core 6 Tabs — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the `frontend/` React app to match the APEX XI wireframe and drive its 6 real-data tabs (Historic Overview/Standings/Squad, WC Groups/Teams/Live) from the live serving API, falling back to the bundled sample JSON where real data is missing.

**Architecture:** A single `loadAppData()` adapter fetches from the existing `src/api/client.ts`, maps responses into the wireframe's `AppData` shape, derives WC team metrics from real standings, and merges the bundled `sample.json` for any missing field (whole-app fallback on total API failure). `App.tsx` is a single-page tab shell (FIFA top-bar + dark nav tabs + Historic↔WC source toggle + club selector) that passes `AppData` slices to presentational tab components styled with ported wireframe CSS classes.

**Tech Stack:** React 18 + TypeScript + Vite, Vitest + Testing Library, d3-scale/d3-shape (already installed). CSS is hand-written wireframe classes in `src/theme.css` (not Tailwind) for the new views.

## Global Constraints

- **NO GIT COMMITS this session.** The user explicitly deferred commits. Every task ends with a **Checkpoint** step (run tests, confirm clean) — do **not** run `git commit` or `git add`. A restore point will be created only when the user later asks.
- **World Cup tabs are DYNAMIC-ONLY (user instruction).** WC data comes only from the serving API or values derived from it — **never** from `sample.json`. No sample overlay on WC Teams; on total API failure WC slices are empty (each WC tab shows its own empty state). The Bracket tab is built dynamically from real knockout matches/fixtures. **Historic tabs MAY use sample** for per-field gaps (form, shirt number) and whole-tab fallback.
- Working directory for all commands: `frontend/`. All source paths below are relative to `frontend/`.
- Serving API base comes from `src/config.ts` (`VITE_API_URL`, default `http://localhost:8000`). Do not hardcode URLs elsewhere.
- Reuse existing modules unchanged where possible: `src/api/client.ts`, `src/api/types.ts`, `src/hooks/useAsync.ts`, `src/components/{Loading,ErrorState,Empty}.tsx`, `src/components/charts/geometry.ts`.
- Exact design tokens live in `docs/reference/wireframe.css` (repo-relative `../docs/reference/wireframe.css` from `frontend/`). The exact tab layouts/markup live in `docs/reference/wireframe_component_source.jsx`. These are the fidelity source of truth.
- Tests must pass with `npx vitest run`; build must pass with `npm run build`.
- Real data is La Liga **2015/2016** (not the sample's 2014/15) — show real values; only per-field gaps (form, shirt number) borrow from sample by team/player name.

---

## File Structure

**Create:**
- `src/theme.css` — ported wireframe tokens + component classes.
- `src/data/sample.json` — copy of `docs/data/football_analytics_data.json`.
- `src/data/types.ts` — `AppData` and member types.
- `src/data/codes.ts` — team name→3-letter code helper (from sample).
- `src/data/deriveWc.ts` — derive WC team metrics from real standings.
- `src/data/adapter.ts` — `loadAppData()` + mappers + sample fallback.
- `src/tabs/Overview.tsx`, `src/tabs/Standings.tsx`, `src/tabs/Squad.tsx`, `src/tabs/WcGroups.tsx`, `src/tabs/WcTeams.tsx`, `src/tabs/WcBracket.tsx`, `src/tabs/WcOverview.tsx`.
- `src/components/charts/Donut.tsx`, `src/components/charts/Bars.tsx`.
- Test files alongside each (`*.test.ts(x)`).

**Modify:**
- `index.html` — add Archivo/Inter Google Fonts links.
- `src/main.tsx` — import `./theme.css`.
- `src/App.tsx` — replace router with the wireframe tab shell.

**Leave / supersede:** `src/pages/*`, `src/components/{Nav,Layout,MatchCard,PlayerList,PlayerDetail,StandingsTable,SourceBadge}.tsx` and their tests are superseded by the new shell/tabs. Do **not** delete them in this plan (avoids breaking their tests); the new `App.tsx` simply stops importing them. `react-router-dom` stays installed but unused.

---

## Task 1: Theme CSS + fonts + shell scaffold

**Files:**
- Create: `src/theme.css`
- Modify: `index.html`, `src/main.tsx`, `src/App.tsx`
- Test: `src/App.test.tsx` (replace existing contents)

**Interfaces:**
- Produces: `App` default export rendering a shell with `data-testid="apex-shell"`, brand text `APEX XI`, a source toggle (buttons `Historic` / `World Cup 2026`), and a tab bar. Tab bodies are placeholders in this task.

- [ ] **Step 1: Copy the wireframe CSS into the app as the theme**

Run (from `frontend/`):
```bash
cp ../docs/reference/wireframe.css src/theme.css
```
This gives `src/theme.css` the exact `:root` tokens, `.wc` override, and all component classes (`.fifa-top`, `.fifa-nav`, `.tab`, `.wrap-main`, `.panel`, `.kpi-strip`, `.ltable`, `.squad`, `.pl-item`, `.grp-grid`, `.grp-card`, `.team-grid`, `.tcard`, `.wcbar`, `.livecard`, `.mcard`, `.radar-wrap`, etc.).

- [ ] **Step 2: Add fonts to `index.html`**

In `index.html`, inside `<head>`, add before the closing `</head>`:
```html
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

- [ ] **Step 3: Import theme in `src/main.tsx`**

Ensure `src/main.tsx` imports the theme (add this line near the existing style import; keep `globals.css` import if present, theme wins by order):
```tsx
import './theme.css'
```

- [ ] **Step 4: Write the failing shell test**

Replace `src/App.test.tsx` with:
```tsx
import { render, screen } from '@testing-library/react'
import App from './App'

test('renders the APEX XI shell with source toggle and tabs', () => {
  render(<App />)
  expect(screen.getByTestId('apex-shell')).toBeInTheDocument()
  expect(screen.getByText('APEX XI')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Historic' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'World Cup 2026' })).toBeInTheDocument()
  // default source = historic → historic tabs present
  expect(screen.getByRole('button', { name: /standings/i })).toBeInTheDocument()
})
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL (old App renders router pages / no `apex-shell`).

- [ ] **Step 6: Rewrite `src/App.tsx` as the shell**

Replace `src/App.tsx` with:
```tsx
import { useState } from 'react'

export type Source = 'historic' | 'wc'
// [key, label] — labels EXACTLY match the wireframe nav (docs/reference/wireframe_component_source.jsx:354-355).
export const HISTORIC_TABS: [string, string][] = [['overview', 'Overview'], ['standings', 'Standings'], ['squad', 'Squad']]
export const WC_TABS: [string, string][] = [['wc_overview', 'Overview'], ['wc_teams', 'Team Metrics'], ['wc_bracket', 'Bracket'], ['wc_groups', 'Groups']]
export const DEFAULT_TAB: Record<Source, string> = { historic: 'overview', wc: 'wc_overview' }

export default function App() {
  const [source, setSource] = useState<Source>('historic')
  const [tab, setTab] = useState<string>('overview')
  const tabs = source === 'historic' ? HISTORIC_TABS : WC_TABS
  const pick = (s: Source) => { setSource(s); setTab(DEFAULT_TAB[s]) }

  // source-aware nav badge (wireframe: club code + club name for historic, WC26 mark for World Cup).
  // Scaffold uses a club placeholder; Task 13 replaces it with the real selected club.
  const badge = source === 'wc'
    ? { code: 'WC26', title: 'FIFA World Cup 2026', sub: 'USA · CANADA · MEXICO' }
    : { code: 'BAR', title: 'Barcelona', sub: 'LA LIGA · 2015/16' }

  return (
    <div className={`app${source === 'wc' ? ' wc' : ''}`} data-testid="apex-shell">
      <header className="fifa-top">
        <span className="ft-brand">APEX XI</span>
        <div className="ft-links">
          <div className="srcseg">
            <button className={`srcbtn${source === 'historic' ? ' on' : ''}`} onClick={() => pick('historic')}>Historic</button>
            <button className={`srcbtn${source === 'wc' ? ' on' : ''}`} onClick={() => pick('wc')}>
              <span className="srcdot" />World Cup 2026
            </button>
          </div>
        </div>
      </header>

      <nav className="fifa-nav">
        <div className="wc-badge">
          <div className="wc-mark">{badge.code}</div>
          <div><div className="wc-title">{badge.title}</div><div className="wc-sub">{badge.sub}</div></div>
        </div>
        <div className="navtabs">
          {tabs.map(([key, label]) => (
            <button key={key} className={`tab${tab === key ? ' on' : ''}`} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>
        <div className="season-tag">{source === 'historic' ? 'LA LIGA · 2015/16' : 'WORLD CUP · 2026'}</div>
      </nav>

      <main className="wrap-main">
        <div className="panel">Tab: {tab} (wiring added in later tasks)</div>
      </main>
    </div>
  )
}
```

- [ ] **Step 7: Run tests**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS.

- [ ] **Step 8: Checkpoint (NO COMMIT)** — Run `npx vitest run` and confirm the whole suite still passes (old page/component tests remain green because their files are untouched). Do not commit.

---

## Task 2: Data types + bundled sample fixture

**Files:**
- Create: `src/data/types.ts`, `src/data/sample.json`
- Test: `src/data/sample.test.ts`

**Interfaces:**
- Produces: `AppData`, `HistoricStanding`, `SquadPlayer`, `WcTeamMetric`, `WcGroup`, `WcGroupRow`, `WcMatch` from `src/data/types.ts`. `sample.json` importable as typed JSON.

- [ ] **Step 1: Copy the sample data into the app**

Run (from `frontend/`):
```bash
cp ../docs/data/football_analytics_data.json src/data/sample.json
```

- [ ] **Step 2: Create `src/data/types.ts`**

```ts
export interface HistoricStanding {
  pos: number; code: string; team: string; team_id: number | null
  played: number; won: number; drawn: number; lost: number
  gf: number; ga: number; gd: number; points: number; form: string
  xg_for: number | null; xg_against: number | null
  possession_pct: number | null; ppda: number | null
}

export interface SquadPlayer {
  number: number; player_id: number | null; player: string; position: string
  apps: number; goals: number; assists: number; minutes: number
  pass_pct: number | null
  /** percentile_* fields (0..100) used for the radar; keyed without the prefix, e.g. goals_per90 */
  percentiles: Record<string, number>
}

export interface WcTeamMetric {
  rank: number; code: string; team: string
  possession_pct: number; xg_for: number; xg_against: number
  shots: number; shots_on_target: number; pass_pct: number
  ppda: number; team_rating: number
  /** true when rank/rating/goal figures were derived from real standings */
  derived: boolean
}

export interface WcGroupRow {
  pos: number; code: string; team: string; flag: string
  played: number; won: number; drawn: number; lost: number
  gf: number; ga: number; gd: number; points: number
}
export interface WcGroup { group: string; table: WcGroupRow[] }

export interface WcMatch {
  id: number; home_team: string; away_team: string
  home_flag: string; away_flag: string
  home_score: number | null; away_score: number | null
  status: string; minute: number | null; stage: string | null; kickoff: string
}

export interface BracketTie {
  stage: string
  home_team: string | null; away_team: string | null
  home_flag: string; away_flag: string
  home_score: number | null; away_score: number | null
  status: string
}
export interface BracketRound { stage: string; ties: BracketTie[] }

export interface AppData {
  source: 'live' | 'sample'
  historic: {
    competition: string
    standings: HistoricStanding[]
    /** squads keyed by team name */
    squads: Record<string, SquadPlayer[]>
  }
  world_cup_2026: {
    team_metrics: WcTeamMetric[]
    group_standings: WcGroup[]
    bracket: BracketRound[]
    matches: WcMatch[]     // finished/live knockout matches (WC Overview live cards)
    fixtures: WcMatch[]    // upcoming fixtures (WC Overview "Upcoming"); scores null
  }
}
```

- [ ] **Step 3: Write the failing fixture test**

Create `src/data/sample.test.ts`:
```ts
import sample from './sample.json'

test('sample.json has the expected top-level shape', () => {
  expect(sample.historic.standings.length).toBe(20)
  expect(sample.historic.fc_barcelona_squad.length).toBeGreaterThan(10)
  expect(sample.world_cup_2026.team_metrics.length).toBe(48)
  expect(sample.world_cup_2026.group_standings.length).toBe(12)
  expect(sample.world_cup_2026.group_standings[0].table.length).toBe(4)
})
```

- [ ] **Step 4: Run test**

Run: `npx vitest run src/data/sample.test.ts`
Expected: PASS (validates the copy landed and JSON import works).

- [ ] **Step 5: Checkpoint (NO COMMIT)** — `npx vitest run` clean.

---

## Task 3: Team-code helper

**Files:**
- Create: `src/data/codes.ts`
- Test: `src/data/codes.test.ts`

**Interfaces:**
- Produces: `codeForTeam(name: string): string` — returns the sample's 3-letter code for a known team name, else a derived uppercase code (letters only, up to 3 chars). Also exports `nameToCode: Record<string,string>` built from `sample.json` (historic standings + WC team_metrics + WC group tables).

- [ ] **Step 1: Write the failing test**

Create `src/data/codes.test.ts`:
```ts
import { codeForTeam } from './codes'

test('maps known sample teams to their codes', () => {
  expect(codeForTeam('Barcelona')).toBe('BAR')
  expect(codeForTeam('Real Madrid')).toBe('RMA')
})
test('derives a code for unknown teams', () => {
  expect(codeForTeam('Nowhere United')).toBe('NOW')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/codes.test.ts`
Expected: FAIL ("codeForTeam is not a function").

- [ ] **Step 3: Implement `src/data/codes.ts`**

```ts
import sample from './sample.json'

function build(): Record<string, string> {
  const m: Record<string, string> = {}
  for (const r of sample.historic.standings as Array<{ team: string; code: string }>) m[r.team] = r.code
  for (const t of sample.world_cup_2026.team_metrics as Array<{ team: string; code: string }>) m[t.team] = t.code
  for (const g of sample.world_cup_2026.group_standings as Array<{ table: Array<{ team: string; code: string }> }>)
    for (const row of g.table) m[row.team] = row.code
  return m
}

export const nameToCode: Record<string, string> = build()

export function codeForTeam(name: string): string {
  if (nameToCode[name]) return nameToCode[name]
  const letters = (name.match(/[A-Za-z]/g) ?? []).join('')
  return letters.slice(0, 3).toUpperCase() || '???'
}
```

- [ ] **Step 4: Run test**

Run: `npx vitest run src/data/codes.test.ts`
Expected: PASS.

- [ ] **Step 5: Checkpoint (NO COMMIT)** — `npx vitest run` clean.

---

## Task 4: Derive WC team metrics from real standings

**Files:**
- Create: `src/data/deriveWc.ts`
- Test: `src/data/deriveWc.test.ts`

**Interfaces:**
- Consumes: `StandingRow` from `src/api/types.ts` (`{ group, rank, team, flag, played, w, d, l, gf, ga, gd, points }`).
- Produces: `deriveTeamMetrics(rows: StandingRow[]): WcTeamMetric[]` — one metric per team, `derived: true`, ranked by a computed `team_rating` (desc). `team_rating` in ~[0,10]; `xg_for`/`xg_against` proxied from goals-per-game; `possession_pct`/`shots`/`shots_on_target`/`pass_pct`/`ppda` set to neutral defaults (real WC advanced metrics don't exist; the adapter overlays sample values by code where present).

- [ ] **Step 1: Write the failing test**

Create `src/data/deriveWc.test.ts`:
```ts
import { deriveTeamMetrics } from './deriveWc'
import type { StandingRow } from '../api/types'

const rows: StandingRow[] = [
  { group: 'Group A', rank: 1, team: 'Mexico', flag: '🇲🇽', played: 3, w: 3, d: 0, l: 0, gf: 6, ga: 0, gd: 6, points: 9 },
  { group: 'Group A', rank: 4, team: 'Czechia', flag: '🇨🇿', played: 3, w: 0, d: 1, l: 2, gf: 2, ga: 6, gd: -4, points: 1 },
]

test('derives ranked metrics with derived flag', () => {
  const out = deriveTeamMetrics(rows)
  expect(out).toHaveLength(2)
  expect(out.every((t) => t.derived)).toBe(true)
  // strong team ranks first with higher rating
  expect(out[0].team).toBe('Mexico')
  expect(out[0].rank).toBe(1)
  expect(out[0].team_rating).toBeGreaterThan(out[1].team_rating)
  expect(out[0].xg_for).toBeGreaterThan(out[1].xg_for)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/deriveWc.test.ts`
Expected: FAIL ("deriveTeamMetrics is not a function").

- [ ] **Step 3: Implement `src/data/deriveWc.ts`**

```ts
import type { StandingRow } from '../api/types'
import type { WcTeamMetric } from './types'
import { codeForTeam } from './codes'

/** Derive proxy team metrics from real WC group standings. */
export function deriveTeamMetrics(rows: StandingRow[]): WcTeamMetric[] {
  const metrics = rows.map((r) => {
    const gp = Math.max(1, r.played)
    const gfpg = r.gf / gp
    const gapg = r.ga / gp
    const ppg = r.points / gp // 0..3
    // rating: points weight + goal difference per game, scaled into ~[3,9]
    const rating = Math.round((3 + ppg * 1.6 + (gfpg - gapg) * 0.6) * 100) / 100
    return {
      code: codeForTeam(r.team),
      team: r.team,
      possession_pct: 50, // neutral default; sample overlay may replace
      xg_for: Math.round(gfpg * 100) / 100,
      xg_against: Math.round(gapg * 100) / 100,
      shots: 0,
      shots_on_target: 0,
      pass_pct: 0,
      ppda: 0,
      team_rating: rating,
      derived: true as const,
      rank: 0,
    }
  })
  metrics.sort((a, b) => b.team_rating - a.team_rating)
  metrics.forEach((m, i) => { m.rank = i + 1 })
  return metrics
}
```

- [ ] **Step 4: Run test**

Run: `npx vitest run src/data/deriveWc.test.ts`
Expected: PASS.

- [ ] **Step 5: Checkpoint (NO COMMIT)** — `npx vitest run` clean.

---

## Task 5: Adapter — `loadAppData()` with sample fallback

**Files:**
- Create: `src/data/adapter.ts`
- Test: `src/data/adapter.test.ts`

**Interfaces:**
- Consumes: `src/api/client.ts` (`getStandings`, `getPlayers`, `getLiveStandings`, `getLiveMatches`, `getLiveFixtures`), `deriveTeamMetrics`, `codeForTeam`, `sample.json`.
- Produces: `loadAppData(): Promise<AppData>` (source `'live'` on success, `'sample'` on total failure — WC slices empty on failure); plus pure mappers `mapStandings`, `mapSquads`, `mapGroups`, `mapWcTeams`, `mapBracket` exported for unit tests. **WC mappers never read `sample.json`.**

- [ ] **Step 1: Write the failing test**

Create `src/data/adapter.test.ts`:
```ts
import { mapStandings, mapSquads, mapGroups, mapBracket } from './adapter'
import type { WcMatch } from './types'

test('mapStandings maps team_season rows to AppData standings, ordered', () => {
  const rows = [
    { team_id: 217, team: 'Barcelona', matches: 38, wins: 29, draws: 4, losses: 5, gf: 112, ga: 29, gd: 83, points: 91, xg_for: 80, xg_against: 30, possession_pct: 64, ppda: 8 },
    { team_id: 220, team: 'Real Madrid', matches: 38, wins: 28, draws: 6, losses: 4, gf: 110, ga: 34, gd: 76, points: 90, xg_for: 78, xg_against: 33, possession_pct: 60, ppda: 9 },
  ]
  const out = mapStandings(rows as never)
  expect(out[0].pos).toBe(1)
  expect(out[0].team).toBe('Barcelona')
  expect(out[0].code).toBe('BAR')
  expect(out[0].won).toBe(29)
  expect(out[0].played).toBe(38)
  // form comes from sample by name when available
  expect(typeof out[0].form).toBe('string')
})

test('mapSquads groups players by team with numbers and percentiles', () => {
  const players = [
    { player_id: 1, team_id: 217, player: 'Lionel Messi', team: 'Barcelona', primary_position: 'Right Wing', appearances: 33, goals: 26, assists: 15, minutes: 2801, passes: 100, percentile_goals_per90: 99, percentile_assists_per90: 95, percentile_xg_per90: 98, percentile_xa_per90: 90, percentile_shots_per90: 88, percentile_passes_per90: 70 },
  ]
  const squads = mapSquads(players as never)
  expect(squads['Barcelona']).toHaveLength(1)
  expect(squads['Barcelona'][0].player).toBe('Lionel Messi')
  expect(squads['Barcelona'][0].goals).toBe(26)
  expect(squads['Barcelona'][0].percentiles.goals_per90).toBe(99)
})

test('mapGroups nests live standings into groups of rows', () => {
  const rows = [
    { group: 'Group A', rank: 1, team: 'Mexico', flag: '🇲🇽', played: 3, w: 3, d: 0, l: 0, gf: 6, ga: 0, gd: 6, points: 9 },
    { group: 'Group A', rank: 2, team: 'South Africa', flag: '🇿🇦', played: 3, w: 1, d: 1, l: 1, gf: 2, ga: 3, gd: -1, points: 4 },
  ]
  const groups = mapGroups(rows as never)
  expect(groups).toHaveLength(1)
  expect(groups[0].group).toBe('Group A')
  expect(groups[0].table[0].team).toBe('Mexico')
  expect(groups[0].table[0].pos).toBe(1)
})

test('mapBracket groups knockout ties by stage in round order', () => {
  const matches: WcMatch[] = [
    { id: 1, home_team: 'Portugal', away_team: 'Spain', home_flag: '🇵🇹', away_flag: '🇪🇸', home_score: 0, away_score: 1, status: 'FINISHED', minute: null, stage: 'Final', kickoff: '' },
    { id: 2, home_team: 'USA', away_team: 'Belgium', home_flag: '🇺🇸', away_flag: '🇧🇪', home_score: 1, away_score: 4, status: 'FINISHED', minute: null, stage: 'Round of 16', kickoff: '' },
  ]
  const rounds = mapBracket(matches, [])
  expect(rounds.map((r) => r.stage)).toEqual(['Round of 16', 'Final']) // ordered, not insertion order
  expect(rounds[0].ties[0].home_team).toBe('USA')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/adapter.test.ts`
Expected: FAIL ("mapStandings is not a function").

- [ ] **Step 3: Implement `src/data/adapter.ts`**

```ts
import * as client from '../api/client'
import type { Fixture, PlayerSeason, StandingRow } from '../api/types'
import sample from './sample.json'
import { codeForTeam } from './codes'
import { deriveTeamMetrics } from './deriveWc'
import type { AppData, BracketRound, BracketTie, HistoricStanding, SquadPlayer, WcGroup, WcMatch, WcTeamMetric } from './types'

// team_season row shape (from /api/standings)
interface TeamSeasonRow {
  team_id: number; team: string; matches: number; wins: number; draws: number; losses: number
  gf: number; ga: number; gd: number; points: number
  xg_for: number | null; xg_against: number | null; possession_pct: number | null; ppda: number | null
}

const sampleFormByTeam: Record<string, string> = Object.fromEntries(
  (sample.historic.standings as Array<{ team: string; form: string }>).map((r) => [r.team, r.form]),
)
const sampleNumberByPlayer: Record<string, number> = Object.fromEntries(
  (sample.historic.fc_barcelona_squad as Array<{ player: string; number: number }>).map((p) => [p.player, p.number]),
)
// NOTE: no WC sample maps — World Cup is dynamic-only (user instruction).

export function mapStandings(rows: TeamSeasonRow[]): HistoricStanding[] {
  return [...rows]
    .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf)
    .map((r, i) => ({
      pos: i + 1, code: codeForTeam(r.team), team: r.team, team_id: r.team_id,
      played: r.matches, won: r.wins, drawn: r.draws, lost: r.losses,
      gf: r.gf, ga: r.ga, gd: r.gd, points: r.points, form: sampleFormByTeam[r.team] ?? '',
      xg_for: r.xg_for, xg_against: r.xg_against, possession_pct: r.possession_pct, ppda: r.ppda,
    }))
}

const PCT_KEYS = ['goals_per90', 'assists_per90', 'xg_per90', 'xa_per90', 'shots_per90', 'passes_per90'] as const

export function mapSquads(players: PlayerSeason[]): Record<string, SquadPlayer[]> {
  const byTeam: Record<string, SquadPlayer[]> = {}
  for (const p of players) {
    const percentiles: Record<string, number> = {}
    for (const k of PCT_KEYS) {
      const v = (p as unknown as Record<string, number>)[`percentile_${k}`]
      if (typeof v === 'number') percentiles[k] = v
    }
    const sp: SquadPlayer = {
      number: sampleNumberByPlayer[p.player] ?? 0,
      player_id: p.player_id, player: p.player, position: p.primary_position,
      apps: p.appearances, goals: p.goals, assists: p.assists, minutes: p.minutes,
      pass_pct: null, percentiles,
    }
    ;(byTeam[p.team] ??= []).push(sp)
  }
  for (const team of Object.keys(byTeam)) {
    byTeam[team].sort((a, b) => b.minutes - a.minutes)
    byTeam[team].forEach((p, i) => { if (!p.number) p.number = i + 1 })
  }
  return byTeam
}

export function mapGroups(rows: StandingRow[]): WcGroup[] {
  const order: string[] = []
  const byGroup: Record<string, WcGroup> = {}
  for (const r of rows) {
    if (!byGroup[r.group]) { byGroup[r.group] = { group: r.group, table: [] }; order.push(r.group) }
    byGroup[r.group].table.push({
      pos: r.rank, code: codeForTeam(r.team), team: r.team, flag: r.flag,
      played: r.played, won: r.w, drawn: r.d, lost: r.l, gf: r.gf, ga: r.ga, gd: r.gd, points: r.points,
    })
  }
  order.forEach((g) => byGroup[g].table.sort((a, b) => a.pos - b.pos))
  return order.map((g) => byGroup[g])
}

export function mapWcTeams(rows: StandingRow[]): WcTeamMetric[] {
  // Dynamic-only: purely derived from real standings, no sample overlay.
  return deriveTeamMetrics(rows)
}

const STAGE_RANK: Record<string, number> = {
  'Round of 16': 1, 'Quarter-final': 2, 'Quarter-finals': 2, 'Quarterfinal': 2,
  'Semi-final': 3, 'Semi-finals': 3, 'Semifinal': 3, 'Third place': 4,
  'Third-place': 4, 'Final': 5,
}

/** Build knockout bracket rounds dynamically from real matches + fixtures. */
export function mapBracket(matches: WcMatch[], fixtures: Fixture[]): BracketRound[] {
  const ties: BracketTie[] = [
    ...matches.map((m) => ({
      stage: m.stage ?? 'Knockout', home_team: m.home_team, away_team: m.away_team,
      home_flag: m.home_flag, away_flag: m.away_flag,
      home_score: m.home_score, away_score: m.away_score, status: m.status,
    })),
    ...fixtures.map((f) => ({
      stage: f.stage ?? 'Knockout', home_team: f.home_team, away_team: f.away_team,
      home_flag: f.home_flag, away_flag: f.away_flag,
      home_score: null, away_score: null, status: 'SCHEDULED',
    })),
  ]
  const byStage: Record<string, BracketTie[]> = {}
  const order: string[] = []
  for (const t of ties) { if (!byStage[t.stage]) { byStage[t.stage] = []; order.push(t.stage) } byStage[t.stage].push(t) }
  order.sort((a, b) => (STAGE_RANK[a] ?? 99) - (STAGE_RANK[b] ?? 99))
  return order.map((s) => ({ stage: s, ties: byStage[s] }))
}

function mapMatches(rows: client.LiveMatchResult[]): WcMatch[] {
  return rows.map((m) => ({
    id: m.id, home_team: m.home_team, away_team: m.away_team, home_flag: m.home_flag, away_flag: m.away_flag,
    home_score: m.home_score, away_score: m.away_score, status: m.status, minute: m.minute, stage: m.stage, kickoff: m.kickoff,
  }))
}

function mapFixtures(rows: Fixture[]): WcMatch[] {
  return rows.map((f) => ({
    id: f.id, home_team: f.home_team, away_team: f.away_team, home_flag: f.home_flag, away_flag: f.away_flag,
    home_score: null, away_score: null, status: 'SCHEDULED', minute: null, stage: f.stage, kickoff: f.kickoff,
  }))
}

// Fallback used only on total API failure: historic from sample, WC EMPTY
// (World Cup is dynamic-only — never show static WC data).
function sampleAppData(): AppData {
  const s = sample as unknown as {
    historic: { competition: string; standings: HistoricStanding[]; fc_barcelona_squad: SquadPlayer[] }
  }
  return {
    source: 'sample',
    historic: {
      competition: s.historic.competition,
      standings: s.historic.standings,
      squads: { Barcelona: s.historic.fc_barcelona_squad },
    },
    world_cup_2026: { team_metrics: [], group_standings: [], bracket: [], matches: [], fixtures: [] },
  }
}

export async function loadAppData(): Promise<AppData> {
  try {
    const [standings, players, live, matches, fixtures] = await Promise.all([
      client.getStandings() as Promise<TeamSeasonRow[]>,
      client.getPlayers({}),
      client.getLiveStandings(),
      client.getLiveMatches(),
      client.getLiveFixtures(),
    ])
    const wcMatches = mapMatches(matches as client.LiveMatchResult[])
    const wcFixtures = mapFixtures(fixtures)
    return {
      source: 'live',
      historic: {
        competition: 'La Liga 2015/16',
        standings: mapStandings(standings),
        squads: mapSquads(players),
      },
      world_cup_2026: {
        team_metrics: mapWcTeams(live),
        group_standings: mapGroups(live),
        bracket: mapBracket(wcMatches, fixtures),
        matches: wcMatches,
        fixtures: wcFixtures,
      },
    }
  } catch {
    return sampleAppData()
  }
}
```

- [ ] **Step 4: Add the `LiveMatchResult` export to the client**

`src/api/client.ts` already returns `LiveMatch[]` from `getLiveMatches`. Add a re-export alias so the adapter's type import resolves. At the bottom of `src/api/client.ts` add:
```ts
export type { LiveMatch as LiveMatchResult } from './types'
```

- [ ] **Step 5: Run test**

Run: `npx vitest run src/data/adapter.test.ts`
Expected: PASS.

- [ ] **Step 6: Checkpoint (NO COMMIT)** — `npx vitest run` clean; `npm run build` clean (fixes any type errors now).

---

## Task 6: Charts — Donut and Bars

**Files:**
- Create: `src/components/charts/Donut.tsx`, `src/components/charts/Bars.tsx`
- Test: `src/components/charts/newcharts.test.tsx`

**Interfaces:**
- Produces:
  - `Donut({ segments, size? }: { segments: { label: string; value: number; color: string }[]; size?: number })` — SVG donut with legend.
  - `Bars({ items, max? }: { items: { label: string; value: number }[]; max?: number })` — horizontal `.bar`/`.bar-fill` rows.

- [ ] **Step 1: Write the failing test**

Create `src/components/charts/newcharts.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import Donut from './Donut'
import Bars from './Bars'

test('Donut renders a legend value per segment', () => {
  render(<Donut segments={[{ label: 'Goals', value: 3, color: '#28c76f' }, { label: 'Saved', value: 5, color: '#2f7fe0' }]} />)
  expect(screen.getByText('Goals')).toBeInTheDocument()
  expect(screen.getByText('Saved')).toBeInTheDocument()
})

test('Bars renders one labelled row per item', () => {
  render(<Bars items={[{ label: 'xG/90', value: 80 }, { label: 'Passes', value: 60 }]} />)
  expect(screen.getByText('xG/90')).toBeInTheDocument()
  expect(screen.getByText('Passes')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/charts/newcharts.test.tsx`
Expected: FAIL (modules not found).

- [ ] **Step 3: Implement `src/components/charts/Donut.tsx`**

```tsx
interface Seg { label: string; value: number; color: string }

export default function Donut({ segments, size = 190 }: { segments: Seg[]; size?: number }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const r = size / 2 - 14, cx = size / 2, cy = size / 2, C = 2 * Math.PI * r
  let acc = 0
  return (
    <div className="donut-cell">
      <svg viewBox={`0 0 ${size} ${size}`} className="dchart" role="img" aria-label="distribution">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--panel-2)" strokeWidth="16" />
        {segments.map((s) => {
          const frac = s.value / total
          const dash = `${frac * C} ${C - frac * C}`
          const el = (
            <circle key={s.label} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth="16"
              strokeDasharray={dash} strokeDashoffset={-acc * C}
              transform={`rotate(-90 ${cx} ${cy})`} />
          )
          acc += frac
          return el
        })}
      </svg>
      <div className="dlegend">
        {segments.map((s) => (
          <div key={s.label} className="dl-item">
            <span className="dl-sw" style={{ background: s.color }} />{s.label}
            <span className="dl-val">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Implement `src/components/charts/Bars.tsx`**

```tsx
export default function Bars({ items, max = 100 }: { items: { label: string; value: number }[]; max?: number }) {
  return (
    <div>
      {items.map((it) => (
        <div key={it.label} className="zone-row">
          <div className="zone-head"><span>{it.label}</span><span className="mono">{it.value}</span></div>
          <div className="bar"><div className="bar-fill" style={{ width: `${Math.min(100, (it.value / max) * 100)}%` }} /></div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Run test**

Run: `npx vitest run src/components/charts/newcharts.test.tsx`
Expected: PASS.

- [ ] **Step 6: Checkpoint (NO COMMIT)** — `npx vitest run` clean.

---

## Task 7: Standings tab

**Files:**
- Create: `src/tabs/Standings.tsx`
- Test: `src/tabs/Standings.test.tsx`

**Interfaces:**
- Consumes: `AppData['historic']['standings']` (`HistoricStanding[]`).
- Produces: `Standings({ rows }: { rows: HistoricStanding[] })` default export rendering an `.ltable`.

- [ ] **Step 1: Write the failing test**

Create `src/tabs/Standings.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import Standings from './Standings'
import type { HistoricStanding } from '../data/types'

const rows: HistoricStanding[] = [
  { pos: 1, code: 'BAR', team: 'Barcelona', team_id: 217, played: 38, won: 29, drawn: 4, lost: 5, gf: 112, ga: 29, gd: 83, points: 91, form: 'WWWDL', xg_for: 80, xg_against: 30, possession_pct: 64, ppda: 8 },
]

test('renders a standings row with team and points', () => {
  render(<Standings rows={rows} />)
  expect(screen.getByText('Barcelona')).toBeInTheDocument()
  expect(screen.getByText('91')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tabs/Standings.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/tabs/Standings.tsx`**

```tsx
import type { HistoricStanding } from '../data/types'

function zone(pos: number, total: number): string {
  if (pos <= 4) return 'z-ucl'
  if (pos <= 6) return 'z-eur'
  if (pos > total - 3) return 'z-rel'
  return ''
}

export default function Standings({ rows }: { rows: HistoricStanding[] }) {
  return (
    <div className="panel">
      <div className="sec-title">La Liga 2015/16 — Table</div>
      <div className="sec-sub">Real StatsBomb season · sorted by points</div>
      <table className="ltable" style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th className="lft">#</th><th className="lft">Team</th>
            <th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.code + r.team}>
              <td className="pos"><span className={`zbar ${zone(r.pos, rows.length)}`} />{r.pos}</td>
              <td className="lft"><div className="team-cell"><span className="badge">{r.code}</span><span className="tc-name">{r.team}</span></div></td>
              <td>{r.played}</td><td>{r.won}</td><td>{r.drawn}</td><td>{r.lost}</td>
              <td>{r.gf}</td><td>{r.ga}</td><td>{r.gd}</td><td className="pts">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: Run test**

Run: `npx vitest run src/tabs/Standings.test.tsx`
Expected: PASS.

- [ ] **Step 5: Checkpoint (NO COMMIT)** — `npx vitest run` clean.

---

## Task 8: Overview tab

**Files:**
- Create: `src/tabs/Overview.tsx`
- Test: `src/tabs/Overview.test.tsx`

**Interfaces:**
- Consumes: a selected `HistoricStanding` (`team`) and that club's `SquadPlayer[]` (`squad`).
- Produces: `Overview({ team, squad }: { team: HistoricStanding; squad: SquadPlayer[] })` — hero + `.kpi-strip` (6 KPIs) + top-scorers list + shot/goal `Donut`.

- [ ] **Step 1: Write the failing test**

Create `src/tabs/Overview.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import Overview from './Overview'
import type { HistoricStanding, SquadPlayer } from '../data/types'

const team: HistoricStanding = { pos: 1, code: 'BAR', team: 'Barcelona', team_id: 217, played: 38, won: 29, drawn: 4, lost: 5, gf: 112, ga: 29, gd: 83, points: 91, form: 'WWWDL', xg_for: 80, xg_against: 30, possession_pct: 64, ppda: 8 }
const squad: SquadPlayer[] = [
  { number: 9, player_id: 1, player: 'Luis Suárez', position: 'Center Forward', apps: 35, goals: 40, assists: 15, minutes: 3233, pass_pct: null, percentiles: {} },
  { number: 10, player_id: 2, player: 'Lionel Messi', position: 'Right Wing', apps: 33, goals: 26, assists: 15, minutes: 2801, pass_pct: null, percentiles: {} },
]

test('shows the club name, a KPI value and top scorer', () => {
  render(<Overview team={team} squad={squad} />)
  expect(screen.getByText('Barcelona')).toBeInTheDocument()
  expect(screen.getByText('91')).toBeInTheDocument() // points KPI
  expect(screen.getByText('Luis Suárez')).toBeInTheDocument() // top scorer first
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tabs/Overview.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/tabs/Overview.tsx`**

```tsx
import Donut from '../components/charts/Donut'
import type { HistoricStanding, SquadPlayer } from '../data/types'

function Kpi({ val, unit, label }: { val: string | number; unit?: string; label: string }) {
  return (
    <div className="kpi">
      <div className="kpi-val">{val}{unit && <span className="kpi-unit"> {unit}</span>}</div>
      <div className="kpi-label">{label}</div>
    </div>
  )
}

export default function Overview({ team, squad }: { team: HistoricStanding; squad: SquadPlayer[] }) {
  const scorers = [...squad].sort((a, b) => b.goals - a.goals).slice(0, 5)
  return (
    <div>
      <div className="panel hero">
        <div className="crest">{team.code}</div>
        <div>
          <div className="hero-name">{team.team}</div>
          <div className="hero-sub">La Liga 2015/16 · Position {team.pos}</div>
        </div>
      </div>

      <div className="kpi-strip">
        <Kpi val={team.points} label="Points" />
        <Kpi val={team.gf} label="Goals For" />
        <Kpi val={team.ga} label="Goals Against" />
        <Kpi val={team.gd} label="Goal Diff" />
        <Kpi val={team.xg_for ?? '—'} label="xG For" />
        <Kpi val={team.possession_pct ?? '—'} unit="%" label="Possession" />
      </div>

      <div className="ov-grid">
        <div className="panel">
          <div className="sec-title">Top Scorers</div>
          {scorers.map((p, i) => (
            <div className="scorer" key={p.player}>
              <span className="sc-rank">{i + 1}</span>
              <div><div className="sc-name">{p.player}</div><div className="sc-pos">{p.position}</div></div>
              <span className="sc-goals">{p.goals}</span>
              <span className="sc-assist">{p.assists} A</span>
            </div>
          ))}
        </div>
        <div className="panel">
          <div className="sec-title">Goals vs Conceded</div>
          <Donut segments={[
            { label: 'Scored', value: team.gf, color: 'var(--win)' },
            { label: 'Conceded', value: team.ga, color: 'var(--accent2)' },
          ]} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test**

Run: `npx vitest run src/tabs/Overview.test.tsx`
Expected: PASS.

- [ ] **Step 5: Checkpoint (NO COMMIT)** — `npx vitest run` clean.

---

## Task 9: Squad tab

**Files:**
- Create: `src/tabs/Squad.tsx`
- Test: `src/tabs/Squad.test.tsx`

**Interfaces:**
- Consumes: `SquadPlayer[]`, `Bars` (Task 6), `RadarChart` (existing, `metrics: { label, value }[]`).
- Produces: `Squad({ squad }: { squad: SquadPlayer[] })` — selectable player list (`.squad`/`.pl-item`) + detail panel with per-90 percentile `Bars`/radar.

- [ ] **Step 1: Write the failing test**

Create `src/tabs/Squad.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import Squad from './Squad'
import type { SquadPlayer } from '../data/types'

const squad: SquadPlayer[] = [
  { number: 10, player_id: 2, player: 'Lionel Messi', position: 'Right Wing', apps: 33, goals: 26, assists: 15, minutes: 2801, pass_pct: null, percentiles: { goals_per90: 99, assists_per90: 95, xg_per90: 98, xa_per90: 90, shots_per90: 88, passes_per90: 70 } },
]

test('lists players and shows the first selected by default', () => {
  render(<Squad squad={squad} />)
  const matches = screen.getAllByText('Lionel Messi')
  expect(matches.length).toBeGreaterThanOrEqual(1)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tabs/Squad.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/tabs/Squad.tsx`**

```tsx
import { useState } from 'react'
import Bars from '../components/charts/Bars'
import type { SquadPlayer } from '../data/types'

const PCT_LABELS: [string, string][] = [
  ['goals_per90', 'Goals/90'], ['assists_per90', 'Assists/90'], ['xg_per90', 'xG/90'],
  ['xa_per90', 'xA/90'], ['shots_per90', 'Shots/90'], ['passes_per90', 'Passes/90'],
]

export default function Squad({ squad }: { squad: SquadPlayer[] }) {
  const [sel, setSel] = useState(0)
  const p = squad[sel] ?? squad[0]
  if (!p) return <div className="panel">No squad data.</div>
  const bars = PCT_LABELS
    .filter(([k]) => typeof p.percentiles[k] === 'number')
    .map(([k, label]) => ({ label, value: p.percentiles[k] }))
  return (
    <div className="hgrid">
      <div className="panel">
        <div className="field-label">Squad</div>
        <div className="squad">
          {squad.map((pl, i) => (
            <button key={pl.player_id ?? pl.player} className={`pl-item${i === sel ? ' on' : ''}`} onClick={() => setSel(i)}>
              <span className="pl-num">{pl.number}</span>
              <span><span className="pl-name">{pl.player}</span> <span className="pl-pos">{pl.position}</span></span>
            </button>
          ))}
        </div>
      </div>
      <div className="panel">
        <div className="phead"><div className="pavatar">{p.number}</div>
          <div><div className="hero-name" style={{ fontSize: 22 }}>{p.player}</div>
          <div className="hero-sub">{p.position} · {p.apps} apps · {p.minutes}′</div></div></div>
        <div className="kpi-grid">
          <div className="kpi"><div className="kpi-val">{p.goals}</div><div className="kpi-label">Goals</div></div>
          <div className="kpi"><div className="kpi-val">{p.assists}</div><div className="kpi-label">Assists</div></div>
        </div>
        <div style={{ marginTop: 16 }}>
          <div className="field-label">Percentile vs position</div>
          {bars.length ? <Bars items={bars} /> : <div className="muted">No percentile data.</div>}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test**

Run: `npx vitest run src/tabs/Squad.test.tsx`
Expected: PASS.

- [ ] **Step 5: Checkpoint (NO COMMIT)** — `npx vitest run` clean.

---

## Task 10: WC Groups tab

**Files:**
- Create: `src/tabs/WcGroups.tsx`
- Test: `src/tabs/WcGroups.test.tsx`

**Interfaces:**
- Consumes: `WcGroup[]`.
- Produces: `WcGroups({ groups }: { groups: WcGroup[] })` — `.grp-grid` of `.grp-card` mini-tables; top 2 rows get class `qual`.

- [ ] **Step 1: Write the failing test**

Create `src/tabs/WcGroups.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import WcGroups from './WcGroups'
import type { WcGroup } from '../data/types'

const groups: WcGroup[] = [{
  group: 'Group A',
  table: [
    { pos: 1, code: 'MEX', team: 'Mexico', flag: '🇲🇽', played: 3, won: 3, drawn: 0, lost: 0, gf: 6, ga: 0, gd: 6, points: 9 },
    { pos: 2, code: 'RSA', team: 'South Africa', flag: '🇿🇦', played: 3, won: 1, drawn: 1, lost: 1, gf: 2, ga: 3, gd: -1, points: 4 },
  ],
}]

test('renders a group card with its teams', () => {
  render(<WcGroups groups={groups} />)
  expect(screen.getByText('Group A')).toBeInTheDocument()
  expect(screen.getByText('Mexico')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tabs/WcGroups.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/tabs/WcGroups.tsx`**

```tsx
import type { WcGroup } from '../data/types'

export default function WcGroups({ groups }: { groups: WcGroup[] }) {
  return (
    <div className="grp-grid">
      {groups.map((g) => (
        <div key={g.group} className="panel grp-card">
          <div className="grp-h">{g.group}</div>
          <table className="ltable grp-t">
            <thead><tr><th className="lft">Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr></thead>
            <tbody>
              {g.table.map((r) => (
                <tr key={r.team} className={r.pos <= 2 ? 'qual' : ''}>
                  <td className="lft"><div className="team-cell"><span>{r.flag}</span><span className="tc-name">{r.team}</span></div></td>
                  <td>{r.played}</td><td>{r.won}</td><td>{r.drawn}</td><td>{r.lost}</td><td>{r.gd}</td><td className="pts">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run test**

Run: `npx vitest run src/tabs/WcGroups.test.tsx`
Expected: PASS.

- [ ] **Step 5: Checkpoint (NO COMMIT)** — `npx vitest run` clean.

---

## Task 11: WC Teams tab (derived metrics)

**Files:**
- Create: `src/tabs/WcTeams.tsx`
- Test: `src/tabs/WcTeams.test.tsx`

**Interfaces:**
- Consumes: `WcTeamMetric[]`.
- Produces: `WcTeams({ teams }: { teams: WcTeamMetric[] })` — `.team-grid` of `.tcard`; when any team `derived`, show a "derived from standings" note.

- [ ] **Step 1: Write the failing test**

Create `src/tabs/WcTeams.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import WcTeams from './WcTeams'
import type { WcTeamMetric } from '../data/types'

const teams: WcTeamMetric[] = [
  { rank: 1, code: 'MEX', team: 'Mexico', possession_pct: 55, xg_for: 2, xg_against: 0, shots: 14, shots_on_target: 6, pass_pct: 85, ppda: 7, team_rating: 8.2, derived: true },
]

test('renders a team card with rating and a derived note', () => {
  render(<WcTeams teams={teams} />)
  expect(screen.getByText('Mexico')).toBeInTheDocument()
  expect(screen.getByText('8.2')).toBeInTheDocument()
  expect(screen.getByText(/derived/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tabs/WcTeams.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/tabs/WcTeams.tsx`**

```tsx
import type { WcTeamMetric } from '../data/types'

export default function WcTeams({ teams }: { teams: WcTeamMetric[] }) {
  const anyDerived = teams.some((t) => t.derived)
  return (
    <div>
      {anyDerived && <div className="sec-sub" style={{ marginBottom: 12 }}>Ratings derived from real group standings (advanced metrics unavailable for WC 2026).</div>}
      <div className="team-grid">
        {teams.map((t) => (
          <div key={t.code} className="panel tcard">
            <div className="tc-top"><span className="tc-grp">#{t.rank}</span></div>
            <div className="tc-nm">{t.team}</div>
            <div className="tc-meta">
              <span className="tc-rank">{t.team_rating.toFixed(1)}</span>
              <span className="tc-str">xGF {t.xg_for} · xGA {t.xg_against}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test**

Run: `npx vitest run src/tabs/WcTeams.test.tsx`
Expected: PASS.

- [ ] **Step 5: Checkpoint (NO COMMIT)** — `npx vitest run` clean.

---

## Task 11B: WC Bracket tab (dynamic)

**Files:**
- Create: `src/tabs/WcBracket.tsx`
- Test: `src/tabs/WcBracket.test.tsx`

**Interfaces:**
- Consumes: `BracketRound[]` (from `mapBracket`, Task 5).
- Produces: `WcBracket({ rounds }: { rounds: BracketRound[] })` — a `.bracket` grid, one `.br-col` per round, each tie a `.ktie`; empty state when there are no rounds. **Uses only the passed real data — no sample import.**

- [ ] **Step 1: Write the failing test**

Create `src/tabs/WcBracket.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import WcBracket from './WcBracket'
import type { BracketRound } from '../data/types'

const rounds: BracketRound[] = [{
  stage: 'Round of 16',
  ties: [{ stage: 'Round of 16', home_team: 'USA', away_team: 'Belgium', home_flag: '🇺🇸', away_flag: '🇧🇪', home_score: 1, away_score: 4, status: 'FINISHED' }],
}]

test('renders bracket rounds and ties from real data', () => {
  render(<WcBracket rounds={rounds} />)
  expect(screen.getByText('Round of 16')).toBeInTheDocument()
  expect(screen.getByText('USA')).toBeInTheDocument()
  expect(screen.getByText('Belgium')).toBeInTheDocument()
})

test('shows an empty state when the bracket has no ties yet', () => {
  render(<WcBracket rounds={[]} />)
  expect(screen.getByText(/no knockout/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tabs/WcBracket.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/tabs/WcBracket.tsx`**

```tsx
import type { BracketRound, BracketTie } from '../data/types'

function Tie({ t }: { t: BracketTie }) {
  const homeWin = t.home_score != null && t.away_score != null && t.home_score > t.away_score
  const awayWin = t.home_score != null && t.away_score != null && t.away_score > t.home_score
  return (
    <div className={`ktie${t.status === 'SCHEDULED' ? ' up' : ''}`}>
      <div className="kt-row"><span>{t.home_flag}</span>
        <span className={`kt-name ${homeWin ? 'kw' : 'kl'}`}>{t.home_team ?? 'TBD'}</span>
        <span className="kt-sc">{t.home_score ?? '-'}</span></div>
      <div className="kt-row"><span>{t.away_flag}</span>
        <span className={`kt-name ${awayWin ? 'kw' : 'kl'}`}>{t.away_team ?? 'TBD'}</span>
        <span className="kt-sc">{t.away_score ?? '-'}</span></div>
      <div className="kt-foot">{t.status}</div>
    </div>
  )
}

export default function WcBracket({ rounds }: { rounds: BracketRound[] }) {
  if (!rounds.length) return <div className="panel">No knockout matches yet.</div>
  return (
    <div className="bracket">
      {rounds.map((r) => (
        <div key={r.stage} className="br-col">
          <div className="br-h">{r.stage}</div>
          {r.ties.map((t, i) => <Tie key={`${r.stage}-${i}`} t={t} />)}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run test**

Run: `npx vitest run src/tabs/WcBracket.test.tsx`
Expected: PASS.

- [ ] **Step 5: Checkpoint (NO COMMIT)** — `npx vitest run` clean.

---

## Task 12: WC Overview tab (hero + live cards + fixtures)

The wireframe has **no standalone "Live" tab** — live match cards and upcoming fixtures live inside the World Cup **Overview** tab. This tab is that Overview (Phase-1 subset: hero + live cards + fixtures; charts come in a later phase). Dynamic-only: consumes only real API-derived data.

**Files:**
- Create: `src/tabs/WcOverview.tsx`
- Test: `src/tabs/WcOverview.test.tsx`

**Interfaces:**
- Consumes: `matches: WcMatch[]` (finished/live) and `fixtures: WcMatch[]` (upcoming).
- Produces: `WcOverview({ matches, fixtures }: { matches: WcMatch[]; fixtures: WcMatch[] })` — a `.wc-hero`, a `.match-grid` of `.mcard` for matches (empty state when none), and an "Upcoming" `.fxrow` list for fixtures (only when present).

- [ ] **Step 1: Write the failing test**

Create `src/tabs/WcOverview.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import WcOverview from './WcOverview'
import type { WcMatch } from '../data/types'

const matches: WcMatch[] = [
  { id: 1, home_team: 'Portugal', away_team: 'Spain', home_flag: '🇵🇹', away_flag: '🇪🇸', home_score: 0, away_score: 1, status: 'FINISHED', minute: null, stage: 'Round of 16', kickoff: '2026-07-01T18:00:00Z' },
]

test('renders the WC hero and a match card with both teams', () => {
  render(<WcOverview matches={matches} fixtures={[]} />)
  expect(screen.getByText(/world cup 2026/i)).toBeInTheDocument()
  expect(screen.getByText('Portugal')).toBeInTheDocument()
  expect(screen.getByText('Spain')).toBeInTheDocument()
})

test('shows an empty state when there are no matches', () => {
  render(<WcOverview matches={[]} fixtures={[]} />)
  expect(screen.getByText(/no matches/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tabs/WcOverview.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/tabs/WcOverview.tsx`**

```tsx
import type { WcMatch } from '../data/types'

function MatchCard({ m }: { m: WcMatch }) {
  return (
    <div className="mcard">
      <div className="mc-top"><div className="mc-comp">{m.stage ?? 'World Cup 2026'}</div>
        <div className="mc-meta"><span>{m.status}</span></div></div>
      <div className="mc-body">
        <div className="mc-team"><span>{m.home_flag}</span><span className="mc-tn">{m.home_team}</span><span className="mc-sc">{m.home_score ?? '-'}</span></div>
        <div className="mc-team"><span>{m.away_flag}</span><span className="mc-tn">{m.away_team}</span><span className="mc-sc">{m.away_score ?? '-'}</span></div>
      </div>
    </div>
  )
}

export default function WcOverview({ matches, fixtures }: { matches: WcMatch[]; fixtures: WcMatch[] }) {
  return (
    <div>
      <div className="wc-hero">
        <div>
          <div className="wc-eyebrow">FIFA WORLD CUP</div>
          <div className="wc-h1">World Cup 2026</div>
          <div className="wc-h2">USA · Canada · Mexico · live results & fixtures</div>
        </div>
        <div className="wc-trophy">🏆</div>
      </div>

      <div className="sec-title" style={{ margin: '4px 0 10px' }}>Latest matches</div>
      {matches.length
        ? <div className="match-grid">{matches.map((m) => <MatchCard key={m.id} m={m} />)}</div>
        : <div className="panel">No matches right now.</div>}

      {fixtures.length > 0 && (
        <div className="panel" style={{ marginTop: 16 }}>
          <div className="sec-title">Upcoming</div>
          {fixtures.map((f) => (
            <div className="fxrow" key={f.id}>
              <div className="fx-teams"><span>{f.home_flag}</span><span className="fx-n">{f.home_team}</span>
                <span className="fx-v">v</span><span className="fx-n">{f.away_team}</span><span>{f.away_flag}</span></div>
              <div className="fx-meta"><div className="fx-round">{f.stage ?? ''}</div><div className="fx-date">{f.kickoff}</div></div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run test**

Run: `npx vitest run src/tabs/WcOverview.test.tsx`
Expected: PASS.

- [ ] **Step 5: Checkpoint (NO COMMIT)** — `npx vitest run` clean.

---

## Task 13: Wire tabs into the shell + club selector + fallback notice

**Files:**
- Modify: `src/App.tsx`
- Test: `src/App.test.tsx` (extend)

**Interfaces:**
- Consumes: `loadAppData` (Task 5), `useAsync` (existing), all 6 tab components, `Loading`/`ErrorState` (existing).
- Produces: final `App` — loads `AppData` once, renders the active tab from it, includes a club `<select>` (historic) driving Overview/Squad, and a "sample data" notice when `data.source === 'sample'`.

- [ ] **Step 1: Extend the shell test**

Add to `src/App.test.tsx` (mock the adapter so no network is needed):
```tsx
import { vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import type { AppData } from './data/types'

vi.mock('./data/adapter', () => ({
  loadAppData: (): Promise<AppData> => Promise.resolve({
    source: 'live',
    historic: {
      competition: 'La Liga 2015/16',
      standings: [{ pos: 1, code: 'BAR', team: 'Barcelona', team_id: 217, played: 38, won: 29, drawn: 4, lost: 5, gf: 112, ga: 29, gd: 83, points: 91, form: 'WWWDL', xg_for: 80, xg_against: 30, possession_pct: 64, ppda: 8 }],
      squads: { Barcelona: [{ number: 10, player_id: 2, player: 'Lionel Messi', position: 'RW', apps: 33, goals: 26, assists: 15, minutes: 2801, pass_pct: null, percentiles: {} }] },
    },
    world_cup_2026: { team_metrics: [], group_standings: [], bracket: [], matches: [], fixtures: [] },
  }),
}))

test('loads data and shows the historic overview club', async () => {
  const { getAllByText } = render(<App />)
  await waitFor(() => expect(getAllByText('Barcelona').length).toBeGreaterThan(0))
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL (App still renders the placeholder panel, no "Barcelona").

- [ ] **Step 3: Rewrite `src/App.tsx` to wire data + tabs**

```tsx
import { useMemo, useState } from 'react'
import { useAsync } from './hooks/useAsync'
import { loadAppData } from './data/adapter'
import Loading from './components/Loading'
import ErrorState from './components/ErrorState'
import Overview from './tabs/Overview'
import Standings from './tabs/Standings'
import Squad from './tabs/Squad'
import WcOverview from './tabs/WcOverview'
import WcTeams from './tabs/WcTeams'
import WcBracket from './tabs/WcBracket'
import WcGroups from './tabs/WcGroups'

type Source = 'historic' | 'wc'
// [key, label] — labels EXACTLY match the wireframe nav.
const HISTORIC_TABS: [string, string][] = [['overview', 'Overview'], ['standings', 'Standings'], ['squad', 'Squad']]
const WC_TABS: [string, string][] = [['wc_overview', 'Overview'], ['wc_teams', 'Team Metrics'], ['wc_bracket', 'Bracket'], ['wc_groups', 'Groups']]
const DEFAULT_TAB: Record<Source, string> = { historic: 'overview', wc: 'wc_overview' }

export default function App() {
  const [source, setSource] = useState<Source>('historic')
  const [tab, setTab] = useState<string>('overview')
  const [club, setClub] = useState<string>('Barcelona')
  const { data, loading, error, reload } = useAsync(() => loadAppData(), [])

  const tabs = source === 'historic' ? HISTORIC_TABS : WC_TABS
  const pick = (s: Source) => { setSource(s); setTab(DEFAULT_TAB[s]) }

  const clubs = useMemo(() => (data ? data.historic.standings.map((r) => r.team) : []), [data])
  const teamRow = data?.historic.standings.find((r) => r.team === club) ?? data?.historic.standings[0]
  const squad = (data && teamRow) ? (data.historic.squads[teamRow.team] ?? []) : []

  const badge = source === 'wc'
    ? { code: 'WC26', title: 'FIFA World Cup 2026', sub: 'USA · CANADA · MEXICO' }
    : { code: teamRow?.code ?? 'A11', title: teamRow?.team ?? 'APEX XI', sub: 'LA LIGA · 2015/16' }

  return (
    <div className={`app${source === 'wc' ? ' wc' : ''}`} data-testid="apex-shell">
      <header className="fifa-top">
        <span className="ft-brand">APEX XI</span>
        <div className="ft-links">
          <div className="srcseg">
            <button className={`srcbtn${source === 'historic' ? ' on' : ''}`} onClick={() => pick('historic')}>Historic</button>
            <button className={`srcbtn${source === 'wc' ? ' on' : ''}`} onClick={() => pick('wc')}>
              <span className="srcdot" />World Cup 2026
            </button>
          </div>
        </div>
      </header>

      <nav className="fifa-nav">
        <div className="wc-badge">
          <div className="wc-mark">{badge.code}</div>
          <div><div className="wc-title">{badge.title}</div><div className="wc-sub">{badge.sub}</div></div>
        </div>
        <div className="navtabs">
          {tabs.map(([key, label]) => (
            <button key={key} className={`tab${tab === key ? ' on' : ''}`} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>
        {source === 'historic' && clubs.length > 0 && (
          <select className="clubsel" value={club} onChange={(e) => setClub(e.target.value)}>
            {clubs.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <div className="season-tag">{source === 'historic' ? 'LA LIGA · 2015/16' : 'WORLD CUP · 2026'}</div>
      </nav>

      <main className="wrap-main">
        {loading && <Loading />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {data && data.source === 'sample' && <div className="sec-sub" style={{ marginBottom: 12 }}>⚠ Serving API unavailable — showing bundled sample data (Historic only; World Cup needs the live API).</div>}
        {data && (
          <>
            {tab === 'overview' && teamRow && <Overview team={teamRow} squad={squad} />}
            {tab === 'standings' && <Standings rows={data.historic.standings} />}
            {tab === 'squad' && <Squad squad={squad} />}
            {tab === 'wc_overview' && <WcOverview matches={data.world_cup_2026.matches} fixtures={data.world_cup_2026.fixtures} />}
            {tab === 'wc_teams' && <WcTeams teams={data.world_cup_2026.team_metrics} />}
            {tab === 'wc_bracket' && <WcBracket rounds={data.world_cup_2026.bracket} />}
            {tab === 'wc_groups' && <WcGroups groups={data.world_cup_2026.group_standings} />}
          </>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Run test**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS.

- [ ] **Step 5: Checkpoint (NO COMMIT)** — `npx vitest run` full suite clean; `npm run build` clean.

---

## Task 14: End-to-end verification against the live API

**Files:** none (verification only).

- [ ] **Step 1: Start the serving API**

From repo root, in a separate terminal:
```bash
./venv/bin/uvicorn apex.api.app:app --port 8000
```
Confirm `curl -s http://localhost:8000/health` returns `{"status":"ok",...}` with non-zero table counts.

- [ ] **Step 2: Start the frontend dev server**

From `frontend/`:
```bash
npm run dev
```

- [ ] **Step 3: Manual visual pass** (acceptance gate)

Open the dev URL. Verify:
- Historic ▸ **Standings**: 20 real 2015/16 teams, Barcelona top with 91 pts.
- Historic ▸ **Overview**: club selector switches clubs; KPIs + top scorers update from real data.
- Historic ▸ **Squad**: real players, per-90 percentile bars.
- World Cup nav shows exactly: **Overview · Team Metrics · Bracket · Groups** (purple `.wc` theme active, source toggle pill, WC26 nav badge). No standalone "Live" tab.
- World Cup ▸ **Overview**: WC hero + the 2 real matches (Portugal–Spain, USA–Belgium) as live cards; Upcoming fixtures section (empty if `fixtures` empty).
- World Cup ▸ **Team Metrics**: derived ratings + "derived" note (no static possession/xG numbers).
- World Cup ▸ **Bracket**: real knockout ties from `live_matches` (e.g. Round of 16), grouped by stage — dynamic, no static ties.
- World Cup ▸ **Groups**: 12 real group cards (Mexico top of Group A).
- Stop the API and reload: Historic shows the sample-data notice and still renders; **World Cup tabs render their empty states** (no static WC data).

- [ ] **Step 4: Final checkpoint (NO COMMIT)** — `npx vitest run` and `npm run build` both clean. Report results to the user. Do **not** commit.

---

## Self-Review

**Spec coverage:** theme/tokens (T1) ✓ · sample bundling for historic fallback (T2) ✓ · adapter real→derived; WC dynamic-only, historic sample fallback (T4,T5) ✓ · all 7 tabs (T7–T12, incl. T11B Bracket) ✓ · shell/toggle/club selector (T1,T13) ✓ · loading/error/historic-fallback notice + empty WC on failure (T5,T13) ✓ · WC dynamic Bracket (T5 `mapBracket`, T11B) ✓ · tests + build gate (every task + T14) ✓ · visual acceptance (T14) ✓. Per-tab loaders in the spec were consolidated into one `loadAppData()` assembler (noted in T5) — simpler, same behavior.

**Data-policy check (user instruction):** WC mappers (`mapGroups`, `mapWcTeams`, `mapBracket`, `mapMatches`) read only API data — no `sample.json`. `sampleAppData()` returns empty WC slices. `mapWcTeams` has no sample overlay. Historic (`mapStandings` form, `mapSquads` number) may use sample — allowed. ✓

**Placeholder scan:** no TBD/TODO; every code step shows complete code. CSS "port" is a concrete `cp` of the extracted file, not a placeholder.

**Type consistency:** `AppData` (with `world_cup_2026.bracket: BracketRound[]`) and member types defined in T2 are used verbatim in T5, T7–T13 and the T13 mock. `deriveTeamMetrics` (T4) → `mapWcTeams` (T5) → `WcTeams` (T11) use `WcTeamMetric`. `mapBracket` (T5) → `WcBracket` (T11B) use `BracketRound`/`BracketTie`. `loadAppData` (T5) signature matches its `useAsync` use in T13. `LiveMatchResult` alias added in T5 Step 4; `Fixture` imported from `api/types` for `mapBracket`.

**Commit policy:** every task ends in a Checkpoint (no commit), honoring the user's instruction.
