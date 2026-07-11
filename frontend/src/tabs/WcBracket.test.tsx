import { render, screen } from '@testing-library/react'
import WcBracket from './WcBracket'
import type { BracketRound } from '../data/types'

const rounds: BracketRound[] = [{
  stage: 'Round of 16',
  ties: [{ stage: 'Round of 16', home_team: 'USA', away_team: 'Belgium', home_flag: '🇺🇸', away_flag: '🇧🇪', home_score: 1, away_score: 4, status: 'FINISHED' }],
}]

test('renders the symmetric bracket with the real R16 tie and TBD later rounds', () => {
  render(<WcBracket rounds={rounds} />)
  expect(screen.getByText('Knockout Bracket')).toBeInTheDocument()
  expect(screen.getByText('USA')).toBeInTheDocument()
  expect(screen.getByText('Belgium')).toBeInTheDocument()
  // later rounds show TBD placeholders (bracket structure preserved)
  expect(screen.getAllByText('TBD').length).toBeGreaterThan(0)
})

test('shows an empty state when the bracket has no ties yet', () => {
  render(<WcBracket rounds={[]} />)
  expect(screen.getByText(/no knockout/i)).toBeInTheDocument()
})
