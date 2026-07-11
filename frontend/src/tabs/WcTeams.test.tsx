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
