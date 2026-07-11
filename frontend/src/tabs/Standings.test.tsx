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
