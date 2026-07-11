import { render, screen } from '@testing-library/react'
import Squad from './Squad'
import type { SquadPlayer } from '../data/types'

const squad: SquadPlayer[] = [
  { number: 10, player_id: 2, player: 'Lionel Messi', position: 'Right Wing', apps: 33, goals: 26, assists: 15, minutes: 2801, pass_pct: null, percentiles: { passes_per90: 70 } },
]

test('renders the selected club squad table with sortable columns', () => {
  render(<Squad squad={squad} club="Barcelona" />)
  expect(screen.getByText('Barcelona — Squad')).toBeInTheDocument()
  expect(screen.getByText('Lionel Messi')).toBeInTheDocument()
  expect(screen.getByText('Goals')).toBeInTheDocument()
})
