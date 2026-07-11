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
  expect(screen.getAllByText('Barcelona').length).toBeGreaterThan(0)
  expect(screen.getByText('91')).toBeInTheDocument() // points KPI
  expect(screen.getByText('Luis Suárez')).toBeInTheDocument() // top scorer
})
