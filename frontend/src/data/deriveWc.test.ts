import { deriveTeamMetrics } from './deriveWc'
import type { StandingRow } from '../api/types'

const rows: StandingRow[] = [
  { group: 'Group A', rank: 1, team: 'Mexico', flag: '🇲🇽', played: 3, w: 3, d: 0, l: 0, gf: 6, ga: 0, gd: 6, points: 9 },
  { group: 'Group A', rank: 4, team: 'Czechia', flag: '🇨🇿', played: 3, w: 0, d: 1, l: 2, gf: 2, ga: 6, gd: -4, points: 1 },
]

test('derives ranked metrics with derived flag', () => {
  const out = deriveTeamMetrics(rows)
  expect(out).toHaveLength(2)
  expect(out.every((t) => t.derived)).toBe(true)
  // strong team ranks first with higher rating
  expect(out[0].team).toBe('Mexico')
  expect(out[0].rank).toBe(1)
  expect(out[0].team_rating).toBeGreaterThan(out[1].team_rating)
  expect(out[0].xg_for).toBeGreaterThan(out[1].xg_for)
})
