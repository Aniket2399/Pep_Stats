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
  expect(screen.getByText(/Mexico/)).toBeInTheDocument()
})
