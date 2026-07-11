import { render, screen } from '@testing-library/react'
import WcOverview from './WcOverview'
import type { WcMatch } from '../data/types'

const matches: WcMatch[] = [
  { id: 1, home_team: 'Portugal', away_team: 'Spain', home_flag: '🇵🇹', away_flag: '🇪🇸', home_score: 0, away_score: 1, status: 'FINISHED', minute: null, stage: 'Round of 16', kickoff: '2026-07-01T18:00:00Z' },
]

test('renders the WC hero and a match card with both teams', () => {
  render(<WcOverview matches={matches} fixtures={[]} teams={[]} groups={[]} />)
  expect(screen.getByText(/world cup 2026/i)).toBeInTheDocument()
  expect(screen.getByText('Portugal')).toBeInTheDocument()
  expect(screen.getByText('Spain')).toBeInTheDocument()
})

test('shows an empty state when there are no matches', () => {
  render(<WcOverview matches={[]} fixtures={[]} teams={[]} groups={[]} />)
  expect(screen.getByText(/no matches/i)).toBeInTheDocument()
})
