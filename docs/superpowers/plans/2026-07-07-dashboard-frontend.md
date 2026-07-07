# APEX XI — Dashboard Frontend (Core Slice) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Vite + React + TypeScript dashboard consuming the serving API — app shell + Historic **Players** (club dropdown → list → radar + shot map) + **Live** (matches/fixtures + WC group standings) — with charts as React SVG using d3-scale/d3-shape.

**Architecture:** `pages → hooks → typed fetch client → serving API JSON`; chart components are pure (data props → React-rendered SVG, geometry via d3-scale/d3-shape). Vitest + React Testing Library.

**Tech Stack:** Vite 5, React 18, TypeScript 5, Tailwind 3, react-router-dom 6, d3-scale, d3-shape, Vitest, @testing-library/react.

## Global Constraints

- Everything lives in a fresh `frontend/` npm project (its own `package.json`/`node_modules`, gitignored). The Python venv/pytest are unrelated; this sub-project's suite is `npm test` (Vitest).
- `src/api/client.ts` is the ONLY module doing HTTP. Base URL: `import.meta.env.VITE_API_URL ?? "http://localhost:8000"`.
- Charts: React renders the SVG; `d3-scale`/`d3-shape` are used for MATH only (no D3 DOM manipulation).
- Chart tasks (Task 5) MUST load the **dataviz skill** before writing chart code (palette/scales/legend).
- Routes: `/` → Historic Players, `/live` → Live. Live hooks poll ~45s.
- The serving API must be running for the manual smoke (Task 8): `./venv/bin/python -m uvicorn apex.api.app:app --port 8000` (CORS already open).
- Node 20 / npm 10. Commit from the repo root; `git add frontend/...` paths.
- API JSON field names are `snake_case` (match the tables); TypeScript interfaces mirror them verbatim.

---

## File Structure

```
frontend/
  index.html  package.json  vite.config.ts  tailwind.config.js  postcss.config.js
  tsconfig.json  tsconfig.node.json  .env.example  .gitignore  vitest.setup.ts
  src/
    main.tsx  App.tsx  config.ts  styles/globals.css
    api/types.ts  api/client.ts  api/client.test.ts
    hooks/useAsync.ts  hooks/index.ts  hooks/useAsync.test.tsx
    components/Layout.tsx  Nav.tsx  Loading.tsx  ErrorState.tsx  Empty.tsx  SourceBadge.tsx
      Nav.test.tsx
      PlayerList.tsx  PlayerDetail.tsx  MatchCard.tsx  StandingsTable.tsx
      MatchCard.test.tsx  StandingsTable.test.tsx  PlayerList.test.tsx
      charts/geometry.ts  charts/geometry.test.ts
      charts/RadarChart.tsx  charts/ShotMap.tsx  charts/charts.test.tsx
    pages/PlayersPage.tsx  pages/LivePage.tsx
```

---

## Task 1: Scaffold — Vite + React + TS + Tailwind + Vitest

**Files:** Create the `frontend/` project files listed below.

**Interfaces:**
- Produces: a runnable Vite app; `npm test`, `npm run build` work; `src/config.ts` exports `API_BASE`.

- [ ] **Step 1: Create `frontend/package.json`**
```json
{
  "name": "apex-xi-frontend",
  "private": true,
  "version": "0.4.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0",
    "d3-scale": "^4.0.2",
    "d3-shape": "^3.2.0"
  },
  "devDependencies": {
    "@types/d3-scale": "^4.0.8",
    "@types/d3-shape": "^3.1.6",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.6.3",
    "vite": "^5.4.11",
    "tailwindcss": "^3.4.15",
    "postcss": "^8.4.49",
    "autoprefixer": "^10.4.20",
    "vitest": "^2.1.6",
    "jsdom": "^25.0.1",
    "@testing-library/react": "^16.0.1",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/user-event": "^14.5.2"
  }
}
```

- [ ] **Step 2: Create the config files**

`frontend/index.html`:
```html
<!doctype html>
<html lang="en">
  <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>APEX XI</title></head>
  <body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>
</html>
```
`frontend/vite.config.ts`:
```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  test: { environment: 'jsdom', globals: true, setupFiles: ['./vitest.setup.ts'] },
})
```
`frontend/vitest.setup.ts`:
```ts
import '@testing-library/jest-dom'
```
`frontend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020", "useDefineForClassFields": true, "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext", "skipLibCheck": true, "moduleResolution": "bundler",
    "resolveJsonModule": true, "isolatedModules": true, "noEmit": true, "jsx": "react-jsx",
    "strict": true, "noUnusedLocals": true, "noUnusedParameters": true, "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "vitest.setup.ts"], "references": [{ "path": "./tsconfig.node.json" }]
}
```
`frontend/tsconfig.node.json`:
```json
{ "compilerOptions": { "composite": true, "skipLibCheck": true, "module": "ESNext", "moduleResolution": "bundler", "allowSyntheticDefaultImports": true }, "include": ["vite.config.ts"] }
```
`frontend/tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: { colors: { navy: '#0b1f3a', pitch: '#1f7a4d', gold: '#c9a227' } } },
  plugins: [],
}
```
`frontend/postcss.config.js`:
```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } }
```
`frontend/.gitignore`:
```
node_modules
dist
.env
```
`frontend/.env.example`:
```
VITE_API_URL=http://localhost:8000
```

- [ ] **Step 3: Create `src/styles/globals.css`, `src/config.ts`, `src/main.tsx`, `src/App.tsx`**

`src/styles/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
body { @apply bg-slate-50 text-slate-900; }
```
`src/config.ts`:
```ts
export const API_BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000'
```
`src/main.tsx`:
```tsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
)
```
`src/App.tsx` (placeholder — fleshed out in Task 4):
```tsx
export default function App() {
  return <div className="p-8 text-2xl font-bold text-navy">APEX XI</div>
}
```

- [ ] **Step 4: Install and verify**

Run:
```bash
cd /Users/annie/Documents/All_Projects/FIFA_Data_Project/frontend
npm install
npm run build
```
Expected: install succeeds; `npm run build` completes (tsc + vite build) with no errors and emits `dist/`.

- [ ] **Step 5: Add a scaffold smoke test** `src/App.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import App from './App'

test('renders brand', () => {
  render(<App />)
  expect(screen.getByText('APEX XI')).toBeInTheDocument()
})
```
Run: `npm test`
Expected: 1 passed.

- [ ] **Step 6: Commit**
```bash
cd /Users/annie/Documents/All_Projects/FIFA_Data_Project
git add frontend/package.json frontend/package-lock.json frontend/index.html frontend/*.ts frontend/*.js frontend/*.json frontend/.gitignore frontend/.env.example frontend/vitest.setup.ts frontend/src
git commit -m "chore: scaffold APEX XI frontend (Vite+React+TS+Tailwind+Vitest)"
```

---

## Task 2: API types + client

**Files:** Create `src/api/types.ts`, `src/api/client.ts`, `src/api/client.test.ts`.

**Interfaces:**
- Produces `types.ts`: `Club, PlayerSeason, Shot, LiveMatch, Fixture, StandingRow, Meta`.
- Produces `client.ts`: `class ApiError`; `getClubs()`, `getPlayers(p?)`, `getPlayer(id)`, `getShots(p?)`, `getLiveMatches()`, `getLiveFixtures()`, `getLiveStandings()`, `getMeta()`.

- [ ] **Step 1: Write the failing test** `src/api/client.test.ts`
```ts
import { afterEach, expect, test, vi } from 'vitest'
import * as client from './client'

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, json: async () => body })
}
afterEach(() => vi.restoreAllMocks())

test('getClubs parses JSON', async () => {
  vi.stubGlobal('fetch', mockFetch(200, [{ team_id: 1, team: 'Barcelona' }]))
  const clubs = await client.getClubs()
  expect(clubs[0].team).toBe('Barcelona')
})

test('getPlayers builds query params', async () => {
  const f = mockFetch(200, [])
  vi.stubGlobal('fetch', f)
  await client.getPlayers({ club: 1, position: 'FWD', limit: 5 })
  expect(String(f.mock.calls[0][0])).toContain('/api/players?club=1&position=FWD&limit=5')
})

test('throws ApiError on non-2xx', async () => {
  vi.stubGlobal('fetch', mockFetch(500, { detail: 'boom' }))
  await expect(client.getClubs()).rejects.toBeInstanceOf(client.ApiError)
})
```

- [ ] **Step 2: Run to verify fail**

Run: `cd frontend && npm test -- src/api/client.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `src/api/types.ts`**
```ts
export interface Club { team_id: number; team: string }

export interface PlayerSeason {
  player_id: number; team_id: number; player: string; team: string
  primary_position: string; position_group: string; minutes: number; appearances: number
  goals: number; assists: number; xg: number; xa: number; shots: number
  percentile_goals_per90: number; percentile_assists_per90: number
  percentile_xg_per90: number; percentile_xa_per90: number; percentile_shots_per90: number
  percentile_passes_per90: number; percentile_prog_passes_per90: number
  percentile_pressures_per90: number; percentile_tackles_per90: number
  percentile_interceptions_per90: number
  [key: string]: string | number
}

export interface Shot {
  shot_id: string; team_id: number; player_id: number; minute: number
  location_x: number; location_y: number; shot_statsbomb_xg: number
  outcome: string; body_part: string; shot_type: string
}

export interface LiveMatch {
  id: number; home_team: string; away_team: string; home_flag: string; away_flag: string
  home_score: number | null; away_score: number | null
  status: string; minute: number | null; stage: string | null; kickoff: string
}
export interface Fixture {
  id: number; home_team: string; away_team: string; home_flag: string; away_flag: string
  stage: string | null; kickoff: string
}
export interface StandingRow {
  group: string; rank: number; team: string; flag: string
  played: number; w: number; d: number; l: number; gf: number; ga: number; gd: number; points: number
}
export interface Meta { historic_updated: string | null; live_updated: string | null; source: string }
```

- [ ] **Step 4: Write `src/api/client.ts`**
```ts
import { API_BASE } from '../config'
import type { Club, PlayerSeason, Shot, LiveMatch, Fixture, StandingRow, Meta } from './types'

export class ApiError extends Error {
  constructor(message: string, readonly status?: number) { super(message) }
}

async function request<T>(path: string): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`)
  } catch (e) {
    throw new ApiError(`network error: ${(e as Error).message}`)
  }
  if (!res.ok) throw new ApiError(`HTTP ${res.status} for ${path}`, res.status)
  return (await res.json()) as T
}

function qs(params: Record<string, string | number | undefined>): string {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
  return parts.length ? `?${parts.join('&')}` : ''
}

export const getClubs = () => request<Club[]>('/api/clubs')
export const getPlayers = (p: { club?: number; position?: string; limit?: number } = {}) =>
  request<PlayerSeason[]>(`/api/players${qs(p)}`)
export const getPlayer = (id: number) => request<PlayerSeason>(`/api/players/${id}`)
export const getShots = (p: { club?: number; player?: number } = {}) =>
  request<Shot[]>(`/api/shots${qs(p)}`)
export const getLiveMatches = () => request<LiveMatch[]>('/api/live/matches')
export const getLiveFixtures = () => request<Fixture[]>('/api/live/fixtures')
export const getLiveStandings = () => request<StandingRow[]>('/api/live/standings')
export const getMeta = () => request<Meta>('/api/meta')
```

- [ ] **Step 5: Run to verify pass**

Run: `cd frontend && npm test -- src/api/client.test.ts`
Expected: PASS (3 passed).

- [ ] **Step 6: Commit**
```bash
git add frontend/src/api
git commit -m "feat(frontend): typed API client + types"
```

---

## Task 3: Hooks (`useAsync` + concrete + polling)

**Files:** Create `src/hooks/useAsync.ts`, `src/hooks/index.ts`, `src/hooks/useAsync.test.tsx`.

**Interfaces:**
- Produces `useAsync<T>(fn: () => Promise<T>, deps: unknown[], opts?: { pollMs?: number }) -> { data, loading, error, reload }`.
- Produces concrete hooks in `index.ts`: `useClubs`, `usePlayers(club?, position?)`, `usePlayer(id?)`, `useShots(player?)`, `useLiveMatches`, `useLiveFixtures`, `useLiveStandings`.

- [ ] **Step 1: Write the failing test** `src/hooks/useAsync.test.tsx`
```tsx
import { renderHook, waitFor, act } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { useAsync } from './useAsync'

test('resolves to data', async () => {
  const { result } = renderHook(() => useAsync(() => Promise.resolve(42), []))
  expect(result.current.loading).toBe(true)
  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(result.current.data).toBe(42)
  expect(result.current.error).toBeNull()
})

test('captures error', async () => {
  const { result } = renderHook(() => useAsync(() => Promise.reject(new Error('x')), []))
  await waitFor(() => expect(result.current.error).not.toBeNull())
})

test('polls on interval', async () => {
  vi.useFakeTimers()
  const fn = vi.fn().mockResolvedValue(1)
  renderHook(() => useAsync(fn, [], { pollMs: 1000 }))
  await vi.advanceTimersByTimeAsync(0)   // initial
  await vi.advanceTimersByTimeAsync(1000) // one poll
  expect(fn.mock.calls.length).toBeGreaterThanOrEqual(2)
  vi.useRealTimers()
})
```

- [ ] **Step 2: Run to verify fail**

Run: `cd frontend && npm test -- src/hooks/useAsync.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `src/hooks/useAsync.ts`**
```ts
import { useCallback, useEffect, useState } from 'react'

export interface AsyncState<T> { data: T | null; loading: boolean; error: Error | null; reload: () => void }

export function useAsync<T>(
  fn: () => Promise<T>,
  deps: unknown[],
  opts: { pollMs?: number } = {},
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps)

  const load = useCallback(() => {
    let cancelled = false
    setLoading(true)
    run()
      .then((d) => { if (!cancelled) { setData(d); setError(null) } })
      .catch((e) => { if (!cancelled) setError(e as Error) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [run])

  useEffect(() => {
    const cancel = load()
    let timer: ReturnType<typeof setInterval> | undefined
    if (opts.pollMs) timer = setInterval(() => load(), opts.pollMs)
    return () => { cancel(); if (timer) clearInterval(timer) }
  }, [load, opts.pollMs])

  return { data, loading, error, reload: load }
}
```

- [ ] **Step 4: Write `src/hooks/index.ts`**
```ts
import { useAsync } from './useAsync'
import * as client from '../api/client'

const POLL = 45000

export const useClubs = () => useAsync(() => client.getClubs(), [])
export const usePlayers = (club?: number, position?: string) =>
  useAsync(() => client.getPlayers({ club, position }), [club, position])
export const usePlayer = (id?: number) =>
  useAsync(() => (id ? client.getPlayer(id) : Promise.resolve(null)), [id])
export const useShots = (player?: number) =>
  useAsync(() => (player ? client.getShots({ player }) : Promise.resolve([])), [player])
export const useLiveMatches = () => useAsync(() => client.getLiveMatches(), [], { pollMs: POLL })
export const useLiveFixtures = () => useAsync(() => client.getLiveFixtures(), [], { pollMs: POLL })
export const useLiveStandings = () => useAsync(() => client.getLiveStandings(), [], { pollMs: POLL })
```

- [ ] **Step 5: Run to verify pass**

Run: `cd frontend && npm test -- src/hooks/useAsync.test.tsx`
Expected: PASS (3 passed).

- [ ] **Step 6: Commit**
```bash
git add frontend/src/hooks
git commit -m "feat(frontend): useAsync + data hooks (with live polling)"
```

---

## Task 4: App shell (Layout, Nav, states, routing)

**Files:** Create `src/components/{Layout,Nav,Loading,ErrorState,Empty,SourceBadge}.tsx`, `src/components/Nav.test.tsx`; replace `src/App.tsx` and `src/App.test.tsx`.

**Interfaces:**
- Produces: `Layout` (wraps children with Nav), `Nav`, `Loading`, `ErrorState({error, onRetry})`, `Empty({message})`, `SourceBadge`. `App` routes `/`→`PlayersPage`, `/live`→`LivePage`.

- [ ] **Step 1: Write the failing test** `src/components/Nav.test.tsx`
```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Nav from './Nav'

test('shows brand and links', () => {
  render(<MemoryRouter><Nav /></MemoryRouter>)
  expect(screen.getByText('APEX XI')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /historic/i })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /live/i })).toBeInTheDocument()
})
```

- [ ] **Step 2: Run to verify fail**

Run: `cd frontend && npm test -- src/components/Nav.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Write the shell components**

`src/components/Nav.tsx`:
```tsx
import { NavLink } from 'react-router-dom'
export default function Nav() {
  const cls = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded font-medium ${isActive ? 'bg-white text-navy' : 'text-white/80 hover:text-white'}`
  return (
    <nav className="bg-navy text-white">
      <div className="max-w-6xl mx-auto flex items-center gap-4 px-4 py-3">
        <span className="text-xl font-bold text-gold">⚡ APEX XI</span>
        <div className="flex gap-1">
          <NavLink to="/" end className={cls}>Historic</NavLink>
          <NavLink to="/live" className={cls}>Live</NavLink>
        </div>
      </div>
    </nav>
  )
}
```
`src/components/Layout.tsx`:
```tsx
import type { ReactNode } from 'react'
import Nav from './Nav'
export default function Layout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen"><Nav /><main className="max-w-6xl mx-auto px-4 py-6">{children}</main></div>
}
```
`src/components/Loading.tsx`:
```tsx
export default function Loading({ label = 'Loading…' }: { label?: string }) {
  return <div className="py-10 text-center text-slate-500">{label}</div>
}
```
`src/components/ErrorState.tsx`:
```tsx
export default function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className="py-10 text-center">
      <p className="text-red-600 font-medium">Could not load data</p>
      <p className="text-sm text-slate-500 mt-1">{error.message}</p>
      <p className="text-xs text-slate-400 mt-2">Is the API running? (uvicorn apex.api.app:app)</p>
      {onRetry && <button onClick={onRetry} className="mt-3 px-3 py-1 rounded bg-navy text-white text-sm">Retry</button>}
    </div>
  )
}
```
`src/components/Empty.tsx`:
```tsx
export default function Empty({ message }: { message: string }) {
  return <div className="py-8 text-center text-slate-400">{message}</div>
}
```
`src/components/SourceBadge.tsx`:
```tsx
import { useAsync } from '../hooks/useAsync'
import { getMeta } from '../api/client'
export default function SourceBadge() {
  const { data } = useAsync(() => getMeta(), [])
  if (!data) return null
  const t = data.live_updated ? new Date(data.live_updated).toLocaleTimeString() : '—'
  return <span className="text-xs text-slate-400">live updated: {t}</span>
}
```

- [ ] **Step 4: Replace `src/App.tsx`**
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import PlayersPage from './pages/PlayersPage'
import LivePage from './pages/LivePage'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<PlayersPage />} />
          <Route path="/live" element={<LivePage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
```

- [ ] **Step 5: Create placeholder pages so App compiles** (fleshed out in Tasks 6-7)

`src/pages/PlayersPage.tsx`:
```tsx
export default function PlayersPage() { return <div>Players</div> }
```
`src/pages/LivePage.tsx`:
```tsx
export default function LivePage() { return <div>Live</div> }
```

- [ ] **Step 6: Replace `src/App.test.tsx`**
```tsx
import { render, screen } from '@testing-library/react'
import App from './App'
test('renders shell with nav', () => {
  render(<App />)
  expect(screen.getByText('⚡ APEX XI')).toBeInTheDocument()
})
```

- [ ] **Step 7: Run tests**

Run: `cd frontend && npm test`
Expected: all pass (Nav + App + api + hooks). `npm run build` also clean.

- [ ] **Step 8: Commit**
```bash
git add frontend/src
git commit -m "feat(frontend): app shell (Layout, Nav, states, routing)"
```

---

## Task 5: Charts — geometry helpers + RadarChart + ShotMap

**Files:** Create `src/components/charts/geometry.ts`, `geometry.test.ts`, `RadarChart.tsx`, `ShotMap.tsx`, `charts.test.tsx`.

**REQUIRED:** load the **dataviz skill** before writing chart code (palette, scales, legend, light/dark). Apply its outcome-color guidance to `OUTCOME_COLORS`.

**Interfaces:**
- Produces `geometry.ts`: `radarPoints(values: number[], radius: number): [number, number][]`; `pitchScale(width: number, height: number): { x(v:number):number; y(v:number):number }`; `xgRadius(xg: number): number`; `OUTCOME_COLORS: Record<string,string>`.
- Produces `RadarChart({ metrics }: { metrics: {label:string; value:number}[] })` and `ShotMap({ shots }: { shots: {location_x:number; location_y:number; xg:number; outcome:string}[] })`.

- [ ] **Step 1: Write the failing test** `src/components/charts/geometry.test.ts`
```ts
import { expect, test } from 'vitest'
import { radarPoints, pitchScale, xgRadius } from './geometry'

test('radarPoints places 4 axes at top/right/bottom/left', () => {
  const p = radarPoints([100, 100, 100, 100], 10).map(([x, y]) => [Math.round(x), Math.round(y)])
  expect(p).toEqual([[0, -10], [10, 0], [0, 10], [-10, 0]])
})

test('radarPoints scales by value', () => {
  const [[, y]] = radarPoints([50], 10)   // single axis at top, half radius
  expect(Math.round(y)).toBe(-5)
})

test('pitchScale maps statsbomb coords into the box', () => {
  const s = pitchScale(120, 80)
  expect(s.x(0)).toBe(0); expect(s.x(120)).toBe(120)
  expect(s.y(0)).toBe(0); expect(s.y(80)).toBe(80)
})

test('xgRadius grows with xg', () => {
  expect(xgRadius(0.8)).toBeGreaterThan(xgRadius(0.1))
})
```

- [ ] **Step 2: Run to verify fail**

Run: `cd frontend && npm test -- src/components/charts/geometry.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `src/components/charts/geometry.ts`**
```ts
import { scaleLinear, scaleSqrt } from 'd3-scale'

/** Points (relative to centre 0,0) for a radar polygon. values are 0..100. Axis 0 points up. */
export function radarPoints(values: number[], radius: number): [number, number][] {
  const n = values.length
  const r = scaleLinear([0, 100], [0, radius])
  return values.map((v, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n
    const rr = r(v)
    return [rr * Math.cos(angle), rr * Math.sin(angle)]
  })
}

/** Map StatsBomb pitch coords (x 0..120, y 0..80) into an SVG box of width×height. */
export function pitchScale(width: number, height: number) {
  const x = scaleLinear([0, 120], [0, width])
  const y = scaleLinear([0, 80], [0, height])
  return { x: (v: number) => x(v), y: (v: number) => y(v) }
}

/** Circle radius from xG (sqrt so area ∝ xG). */
const _r = scaleSqrt([0, 1], [3, 14]).clamp(true)
export function xgRadius(xg: number): number { return _r(xg) }

export const OUTCOME_COLORS: Record<string, string> = {
  Goal: '#1a9850',        // green
  Saved: '#4575b4',       // blue
  'Off T': '#bdbdbd',     // grey
  Blocked: '#fdae61',     // orange
  Wayward: '#bdbdbd',
  Post: '#fdae61',
}
export const outcomeColor = (o: string): string => OUTCOME_COLORS[o] ?? '#9e9e9e'
```

- [ ] **Step 4: Write `src/components/charts/RadarChart.tsx`**
```tsx
import { radarPoints } from './geometry'

export default function RadarChart({ metrics }: { metrics: { label: string; value: number }[] }) {
  const size = 280, cx = size / 2, cy = size / 2, radius = 100
  const values = metrics.map((m) => m.value)
  const pts = radarPoints(values, radius)
  const rings = [25, 50, 75, 100]
  const polygon = pts.map(([x, y]) => `${cx + x},${cy + y}`).join(' ')
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[300px]" role="img" aria-label="player radar">
      {rings.map((pct) => (
        <circle key={pct} cx={cx} cy={cy} r={(pct / 100) * radius} fill="none" stroke="#e5e7eb" />
      ))}
      {metrics.map((m, i) => {
        const [ax, ay] = radarPoints(metrics.map(() => 100), radius)[i]
        return (
          <g key={m.label}>
            <line x1={cx} y1={cy} x2={cx + ax} y2={cy + ay} stroke="#e5e7eb" />
            <text x={cx + ax * 1.14} y={cy + ay * 1.14} fontSize="9" textAnchor="middle"
                  dominantBaseline="middle" className="fill-slate-500">{m.label}</text>
          </g>
        )
      })}
      <polygon points={polygon} fill="rgba(11,31,58,0.25)" stroke="#0b1f3a" strokeWidth="2" />
    </svg>
  )
}
```

- [ ] **Step 5: Write `src/components/charts/ShotMap.tsx`**
```tsx
import { pitchScale, xgRadius, outcomeColor, OUTCOME_COLORS } from './geometry'

interface S { location_x: number; location_y: number; xg: number; outcome: string }

export default function ShotMap({ shots }: { shots: S[] }) {
  const W = 360, H = 240
  const s = pitchScale(W, H)   // x along length (0..120), y across (0..80)
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[420px] bg-pitch/10 rounded" role="img" aria-label="shot map">
        <rect x="1" y="1" width={W - 2} height={H - 2} fill="none" stroke="#94a3b8" />
        {/* right-side penalty box (attacking toward x=120) */}
        <rect x={s.x(102)} y={s.y(18)} width={W - s.x(102)} height={s.y(62) - s.y(18)} fill="none" stroke="#94a3b8" />
        {shots.map((sh, i) => (
          <circle key={i} cx={s.x(sh.location_x)} cy={s.y(sh.location_y)} r={xgRadius(sh.xg)}
                  fill={outcomeColor(sh.outcome)} fillOpacity={0.75} stroke="#334155" strokeWidth="0.5" />
        ))}
      </svg>
      <div className="flex flex-wrap gap-3 mt-2 text-xs">
        {Object.entries(OUTCOME_COLORS).slice(0, 4).map(([k, c]) => (
          <span key={k} className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: c }} />{k}
          </span>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Write `src/components/charts/charts.test.tsx`**
```tsx
import { render } from '@testing-library/react'
import { expect, test } from 'vitest'
import RadarChart from './RadarChart'
import ShotMap from './ShotMap'

test('RadarChart renders one polygon with N points', () => {
  const metrics = [{ label: 'xG', value: 90 }, { label: 'Assists', value: 40 }, { label: 'Tackles', value: 70 }]
  const { container } = render(<RadarChart metrics={metrics} />)
  const poly = container.querySelector('polygon')!
  expect(poly.getAttribute('points')!.trim().split(' ')).toHaveLength(3)
})

test('ShotMap renders one circle per shot', () => {
  const shots = [
    { location_x: 110, location_y: 40, xg: 0.5, outcome: 'Goal' },
    { location_x: 100, location_y: 30, xg: 0.1, outcome: 'Saved' },
  ]
  const { container } = render(<ShotMap shots={shots} />)
  // 2 shot circles (rects for pitch/box are separate)
  expect(container.querySelectorAll('circle')).toHaveLength(2)
})
```

- [ ] **Step 7: Run tests**

Run: `cd frontend && npm test -- src/components/charts`
Expected: geometry (4) + charts (2) pass.

- [ ] **Step 8: Commit**
```bash
git add frontend/src/components/charts
git commit -m "feat(frontend): RadarChart + ShotMap (React SVG via d3-scale/d3-shape)"
```

---

## Task 6: Historic Players view

**Files:** Create `src/components/PlayerList.tsx`, `PlayerDetail.tsx`, `PlayerList.test.tsx`; replace `src/pages/PlayersPage.tsx`.

**Interfaces:**
- Consumes: `useClubs`, `usePlayers`, `usePlayer`, `useShots`, `PlayerSeason`, `Shot`, `RadarChart`, `ShotMap`, states.
- Produces: `PlayerList({players, selectedId, onSelect})`, `PlayerDetail({player, shots})`, and the wired `PlayersPage`.

- [ ] **Step 1: Write the failing test** `src/components/PlayerList.test.tsx`
```tsx
import { render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import PlayerList from './PlayerList'
import type { PlayerSeason } from '../api/types'

const players = [
  { player_id: 10, player: 'Suárez', primary_position: 'CF', minutes: 540, goals: 40, xg: 30 },
  { player_id: 11, player: 'Messi', primary_position: 'RW', minutes: 500, goals: 26, xg: 24 },
] as unknown as PlayerSeason[]

test('renders a row per player and fires onSelect', async () => {
  const onSelect = vi.fn()
  render(<PlayerList players={players} selectedId={undefined} onSelect={onSelect} />)
  expect(screen.getByText('Suárez')).toBeInTheDocument()
  expect(screen.getByText('Messi')).toBeInTheDocument()
  screen.getByText('Suárez').click()
  expect(onSelect).toHaveBeenCalledWith(10)
})
```

- [ ] **Step 2: Run to verify fail**

Run: `cd frontend && npm test -- src/components/PlayerList.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `src/components/PlayerList.tsx`**
```tsx
import type { PlayerSeason } from '../api/types'

export default function PlayerList({ players, selectedId, onSelect }:
  { players: PlayerSeason[]; selectedId?: number; onSelect: (id: number) => void }) {
  return (
    <div className="overflow-x-auto rounded border">
      <table className="w-full text-sm">
        <thead className="bg-slate-100 text-slate-600">
          <tr><th className="text-left p-2">Player</th><th className="p-2">Pos</th>
          <th className="p-2">Min</th><th className="p-2">Goals</th><th className="p-2">xG</th></tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.player_id} onClick={() => onSelect(p.player_id)}
                className={`cursor-pointer border-t hover:bg-slate-50 ${selectedId === p.player_id ? 'bg-slate-100' : ''}`}>
              <td className="p-2 font-medium">{p.player}</td>
              <td className="p-2 text-center">{p.position_group ?? p.primary_position}</td>
              <td className="p-2 text-center">{p.minutes}</td>
              <td className="p-2 text-center">{p.goals}</td>
              <td className="p-2 text-center">{Number(p.xg).toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: Write `src/components/PlayerDetail.tsx`**
```tsx
import type { PlayerSeason, Shot } from '../api/types'
import RadarChart from './charts/RadarChart'
import ShotMap from './charts/ShotMap'

const RADAR: { key: keyof PlayerSeason; label: string }[] = [
  { key: 'percentile_goals_per90', label: 'Goals' }, { key: 'percentile_xg_per90', label: 'xG' },
  { key: 'percentile_assists_per90', label: 'Assists' }, { key: 'percentile_xa_per90', label: 'xA' },
  { key: 'percentile_shots_per90', label: 'Shots' }, { key: 'percentile_passes_per90', label: 'Passes' },
  { key: 'percentile_prog_passes_per90', label: 'Prog' }, { key: 'percentile_pressures_per90', label: 'Press' },
  { key: 'percentile_tackles_per90', label: 'Tackles' }, { key: 'percentile_interceptions_per90', label: 'Int' },
]

export default function PlayerDetail({ player, shots }: { player: PlayerSeason; shots: Shot[] }) {
  const metrics = RADAR.map((r) => ({ label: r.label, value: Number(player[r.key]) || 0 }))
  const tiles = [['Goals', player.goals], ['xG', Number(player.xg).toFixed(1)],
                 ['Assists', player.assists], ['xA', Number(player.xa).toFixed(1)]]
  const shotData = shots.map((s) => ({ location_x: s.location_x, location_y: s.location_y,
                                       xg: s.shot_statsbomb_xg, outcome: s.outcome }))
  return (
    <div className="mt-4">
      <h2 className="text-xl font-bold text-navy">{player.player}</h2>
      <p className="text-sm text-slate-500">{player.team} · {player.primary_position} · {player.minutes} min</p>
      <div className="grid grid-cols-4 gap-2 my-4 max-w-md">
        {tiles.map(([k, v]) => (
          <div key={k as string} className="rounded border p-2 text-center">
            <div className="text-lg font-bold text-navy">{v as string}</div>
            <div className="text-xs text-slate-500">{k as string}</div>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6 items-start">
        <div><h3 className="font-semibold mb-2">Percentile radar</h3><RadarChart metrics={metrics} /></div>
        <div><h3 className="font-semibold mb-2">Shot map</h3>
          {shotData.length ? <ShotMap shots={shotData} /> : <p className="text-sm text-slate-400">No shots.</p>}</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Replace `src/pages/PlayersPage.tsx`**
```tsx
import { useState } from 'react'
import { useClubs, usePlayers, usePlayer, useShots } from '../hooks'
import PlayerList from '../components/PlayerList'
import PlayerDetail from '../components/PlayerDetail'
import Loading from '../components/Loading'
import ErrorState from '../components/ErrorState'
import Empty from '../components/Empty'

const POSITIONS = ['All', 'GK', 'DEF', 'MID', 'FWD']

export default function PlayersPage() {
  const clubs = useClubs()
  const [club, setClub] = useState<number | undefined>(undefined)
  const [pos, setPos] = useState('All')
  const [playerId, setPlayerId] = useState<number | undefined>(undefined)
  const players = usePlayers(club, pos === 'All' ? undefined : pos)
  const detail = usePlayer(playerId)
  const shots = useShots(playerId)

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-4">Historic — Players (La Liga 2015/16)</h1>
      <div className="flex flex-wrap gap-3 mb-4">
        <select className="border rounded px-2 py-1" value={club ?? ''}
                onChange={(e) => { setClub(e.target.value ? Number(e.target.value) : undefined); setPlayerId(undefined) }}>
          <option value="">All clubs</option>
          {(clubs.data ?? []).map((c) => <option key={c.team_id} value={c.team_id}>{c.team}</option>)}
        </select>
        <select className="border rounded px-2 py-1" value={pos} onChange={(e) => setPos(e.target.value)}>
          {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {players.loading && <Loading />}
      {players.error && <ErrorState error={players.error} onRetry={players.reload} />}
      {players.data && (players.data.length
        ? <PlayerList players={players.data} selectedId={playerId} onSelect={setPlayerId} />
        : <Empty message="No players for this filter." />)}

      {playerId && detail.loading && <Loading />}
      {detail.data && <PlayerDetail player={detail.data} shots={shots.data ?? []} />}
    </div>
  )
}
```

- [ ] **Step 6: Run tests + build**

Run: `cd frontend && npm test && npm run build`
Expected: all pass; build clean.

- [ ] **Step 7: Commit**
```bash
git add frontend/src
git commit -m "feat(frontend): Historic Players view (dropdown, list, radar + shot map)"
```

---

## Task 7: Live view

**Files:** Create `src/components/MatchCard.tsx`, `StandingsTable.tsx`, `MatchCard.test.tsx`, `StandingsTable.test.tsx`; replace `src/pages/LivePage.tsx`.

**Interfaces:**
- Consumes: `useLiveMatches`, `useLiveFixtures`, `useLiveStandings`, `LiveMatch`, `Fixture`, `StandingRow`, states, `SourceBadge`.
- Produces: `MatchCard({match})`, `StandingsTable({rows})` (grouped), wired `LivePage`.

- [ ] **Step 1: Write the failing tests**

`src/components/MatchCard.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import MatchCard from './MatchCard'
import type { LiveMatch } from '../api/types'

const base: LiveMatch = { id: 1, home_team: 'Spain', away_team: 'Portugal', home_flag: '🇪🇸', away_flag: '🇵🇹',
  home_score: 1, away_score: 0, status: 'LIVE', minute: 67, stage: 'Round of 16', kickoff: '2026-07-06T18:00:00+00:00' }

test('shows LIVE badge + score when live', () => {
  render(<MatchCard match={base} />)
  expect(screen.getByText(/LIVE/)).toBeInTheDocument()
  expect(screen.getByText('1 - 0')).toBeInTheDocument()
})
test('shows kickoff time when scheduled', () => {
  render(<MatchCard match={{ ...base, status: 'SCHEDULED', home_score: null, away_score: null, minute: null }} />)
  expect(screen.queryByText(/LIVE/)).toBeNull()
})
```
`src/components/StandingsTable.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import StandingsTable from './StandingsTable'
import type { StandingRow } from '../api/types'

const rows: StandingRow[] = [
  { group: 'Group A', rank: 1, team: 'Mexico', flag: '🇲🇽', played: 3, w: 3, d: 0, l: 0, gf: 6, ga: 0, gd: 6, points: 9 },
  { group: 'Group A', rank: 2, team: 'Korea', flag: '🇰🇷', played: 3, w: 1, d: 0, l: 2, gf: 2, ga: 4, gd: -2, points: 3 },
]
test('renders group header and rows', () => {
  render(<StandingsTable rows={rows} />)
  expect(screen.getByText('Group A')).toBeInTheDocument()
  expect(screen.getByText('Mexico')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run to verify fail**

Run: `cd frontend && npm test -- src/components/MatchCard.test.tsx src/components/StandingsTable.test.tsx`
Expected: FAIL (modules not found).

- [ ] **Step 3: Write `src/components/MatchCard.tsx`**
```tsx
import type { LiveMatch, Fixture } from '../api/types'

export default function MatchCard({ match }: { match: LiveMatch | Fixture }) {
  const m = match as LiveMatch
  const live = m.status === 'LIVE'
  const scheduled = m.status === 'SCHEDULED' || !('status' in match)
  return (
    <div className="rounded border p-3 bg-white">
      {live && <div className="text-xs font-bold text-red-600 mb-1">🔴 LIVE {m.minute ? `${m.minute}'` : ''}</div>}
      <div className="flex items-center justify-between">
        <span className="font-medium">{match.home_flag} {match.home_team}</span>
        {scheduled
          ? <span className="text-xs text-slate-500">{new Date(match.kickoff).toLocaleString()}</span>
          : <span className="font-bold">{m.home_score} - {m.away_score}</span>}
        <span className="font-medium">{match.away_team} {match.away_flag}</span>
      </div>
      {match.stage && <div className="text-xs text-slate-400 mt-1 text-center">{match.stage}</div>}
    </div>
  )
}
```

- [ ] **Step 4: Write `src/components/StandingsTable.tsx`**
```tsx
import type { StandingRow } from '../api/types'

export default function StandingsTable({ rows }: { rows: StandingRow[] }) {
  const groups = [...new Set(rows.map((r) => r.group))].sort()
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {groups.map((g) => (
        <div key={g} className="rounded border overflow-hidden">
          <div className="bg-navy text-white px-3 py-1 text-sm font-semibold">{g}</div>
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr><th className="text-left p-1 pl-2">Team</th><th className="p-1">P</th><th className="p-1">W</th>
              <th className="p-1">D</th><th className="p-1">L</th><th className="p-1">GD</th><th className="p-1">Pts</th></tr>
            </thead>
            <tbody>
              {rows.filter((r) => r.group === g).sort((a, b) => a.rank - b.rank).map((r) => (
                <tr key={r.team} className="border-t">
                  <td className="p-1 pl-2">{r.flag} {r.team}</td>
                  <td className="p-1 text-center">{r.played}</td><td className="p-1 text-center">{r.w}</td>
                  <td className="p-1 text-center">{r.d}</td><td className="p-1 text-center">{r.l}</td>
                  <td className="p-1 text-center">{r.gd}</td><td className="p-1 text-center font-bold">{r.points}</td>
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

- [ ] **Step 5: Replace `src/pages/LivePage.tsx`**
```tsx
import { useLiveMatches, useLiveFixtures, useLiveStandings } from '../hooks'
import MatchCard from '../components/MatchCard'
import StandingsTable from '../components/StandingsTable'
import Loading from '../components/Loading'
import ErrorState from '../components/ErrorState'
import Empty from '../components/Empty'
import SourceBadge from '../components/SourceBadge'

export default function LivePage() {
  const matches = useLiveMatches()
  const fixtures = useLiveFixtures()
  const standings = useLiveStandings()
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Live — World Cup 2026</h1><SourceBadge />
      </div>

      <section>
        <h2 className="font-semibold mb-2">Matches</h2>
        {matches.loading && <Loading />}
        {matches.error && <ErrorState error={matches.error} onRetry={matches.reload} />}
        {matches.data && (matches.data.length
          ? <div className="grid md:grid-cols-2 gap-3">{matches.data.map((m) => <MatchCard key={m.id} match={m} />)}</div>
          : <Empty message="No matches around now." />)}
      </section>

      {fixtures.data && fixtures.data.length > 0 && (
        <section><h2 className="font-semibold mb-2">Upcoming</h2>
          <div className="grid md:grid-cols-2 gap-3">{fixtures.data.map((f) => <MatchCard key={f.id} match={f} />)}</div>
        </section>
      )}

      <section>
        <h2 className="font-semibold mb-2">Group standings</h2>
        {standings.loading && <Loading />}
        {standings.error && <ErrorState error={standings.error} onRetry={standings.reload} />}
        {standings.data && (standings.data.length
          ? <StandingsTable rows={standings.data} />
          : <Empty message="No group standings yet." />)}
      </section>
    </div>
  )
}
```

- [ ] **Step 6: Run full suite + build**

Run: `cd frontend && npm test && npm run build`
Expected: all pass; build clean.

- [ ] **Step 7: Commit**
```bash
git add frontend/src
git commit -m "feat(frontend): Live view (matches, fixtures, group standings)"
```

---

## Task 8: Real-data smoke (manual)

**Files:** none (verification). Requires the serving API + a populated `apex.duckdb`.

- [ ] **Step 1: Start the API** (from repo root)

Run: `./venv/bin/python -m uvicorn apex.api.app:app --port 8000 > /tmp/apex_api.log 2>&1 &` ; wait 3s ; `grep "Uvicorn running" /tmp/apex_api.log`
Expected: server running. (If `apex.duckdb` is empty, first run `./venv/bin/python -m apex.cli build --skip-ingest` and `./venv/bin/python -m apex.live.cli refresh`.)

- [ ] **Step 2: Start the frontend dev server**

Run: `cd frontend && npm run dev -- --host > /tmp/apex_fe.log 2>&1 &` ; wait 4s ; `grep -i "Local:" /tmp/apex_fe.log`
Expected: Vite dev server on http://localhost:5173.

- [ ] **Step 3: Verify pages serve + fetch real data**

Run:
```bash
curl -s -o /dev/null -w "index %{http_code}\n" localhost:5173/
curl -s localhost:8000/api/clubs | python3 -c "import sys,json; print('clubs', len(json.load(sys.stdin)))"
curl -s "localhost:8000/api/players?position=FWD&limit=3" | python3 -c "import sys,json; print([p['player'] for p in json.load(sys.stdin)])"
```
Expected: index 200; clubs 20; FWDs include Suárez/Ronaldo. Then open http://localhost:5173 in a browser: pick **Barcelona** → select **Suárez** → radar + shot map render; switch to **Live** → WC group standings render.

- [ ] **Step 4: Typecheck/build clean**

Run: `cd frontend && npm run build`
Expected: `tsc -b` + `vite build` succeed, no type errors.

- [ ] **Step 5: Stop servers**

Run: `pkill -f "uvicorn apex.api.app"; pkill -f vite`

- [ ] **Step 6: Commit any fixups** (only if code changed)
```bash
git add -A && git commit -m "chore: real-data smoke verification of dashboard" || echo "nothing to commit"
```

---

## Self-Review Notes (author)

- **Spec coverage:** scaffold (T1), api client+types (T2), hooks+polling (T3), shell/routing/states (T4), charts+geometry (T5, loads dataviz skill), Players view (T6), Live view (T7), real smoke (T8). All spec components covered; Teams/Compare/Overview correctly out of scope.
- **Placeholder scan:** none — every step has complete code.
- **Type consistency:** `PlayerSeason`/`Shot`/`LiveMatch`/`Fixture`/`StandingRow` used identically across client, hooks, components; `useAsync` signature + `{data,loading,error,reload}` consistent; chart props (`metrics`, `shots`) match producers/consumers; `radarPoints`/`pitchScale`/`xgRadius` signatures match tests and callers.
- **Testability:** chart math (geometry.ts) is pure and unit-tested; components tested via RTL with sample data; hooks tested with fake timers for polling; only T8 needs the live API.
- **Note:** `PlayerSeason` has an index signature so `player[r.key]` (dynamic percentile access in PlayerDetail) typechecks.
