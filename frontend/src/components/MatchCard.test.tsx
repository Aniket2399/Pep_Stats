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
