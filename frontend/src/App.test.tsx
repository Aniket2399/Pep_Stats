import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, vi } from 'vitest'
import App from './App'
import type { AppData } from './data/types'

// `liveUpdated` is read fresh by the mock factory on every `getMeta()` call,
// so individual tests can override it (e.g. to exercise the null fallback)
// by reassigning this variable before rendering.
const DEFAULT_LIVE_UPDATED = '2026-07-12T10:00:00+00:00'
let liveUpdated: string | null = DEFAULT_LIVE_UPDATED

afterEach(() => { liveUpdated = DEFAULT_LIVE_UPDATED })

vi.mock('./api/client', () => ({
  getMeta: () => Promise.resolve({
    historic_updated: null,
    live_updated: liveUpdated,
    source: 'apex.duckdb',
  }),
}))

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

test('renders the PepStats shell with source toggle and tabs', () => {
  render(<App />)
  expect(screen.getByTestId('apex-shell')).toBeInTheDocument()
  expect(screen.getByText('PepStats')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Historic' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'World Cup 2026' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /standings/i })).toBeInTheDocument()
})

test('loads data and shows the historic overview club', async () => {
  const { getAllByText } = render(<App />)
  await waitFor(() => expect(getAllByText('Barcelona').length).toBeGreaterThan(0))
})

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

test('the World Cup view falls back to an em dash when there is no snapshot timestamp', async () => {
  liveUpdated = null
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole('button', { name: /World Cup 2026/ }))

  const asOf = await screen.findByTestId('scores-as-of')
  expect(asOf).toHaveTextContent('Scores as of —')
  expect(asOf).not.toHaveTextContent(/invalid date/i)
})
