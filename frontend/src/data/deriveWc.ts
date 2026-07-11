import type { StandingRow } from '../api/types'
import type { WcTeamMetric } from './types'
import { codeForTeam } from './codes'

/** Derive proxy team metrics from real WC group standings. */
export function deriveTeamMetrics(rows: StandingRow[]): WcTeamMetric[] {
  const metrics = rows.map((r) => {
    const gp = Math.max(1, r.played)
    const gfpg = r.gf / gp
    const gapg = r.ga / gp
    const ppg = r.points / gp // 0..3
    // rating: points weight + goal difference per game, scaled into ~[3,9]
    const rating = Math.round((3 + ppg * 1.6 + (gfpg - gapg) * 0.6) * 100) / 100
    return {
      code: codeForTeam(r.team),
      team: r.team,
      possession_pct: 50, // neutral default; sample overlay may replace
      xg_for: Math.round(gfpg * 100) / 100,
      xg_against: Math.round(gapg * 100) / 100,
      shots: 0,
      shots_on_target: 0,
      pass_pct: 0,
      ppda: 0,
      team_rating: rating,
      derived: true as const,
      rank: 0,
    }
  })
  metrics.sort((a, b) => b.team_rating - a.team_rating)
  metrics.forEach((m, i) => { m.rank = i + 1 })
  return metrics
}
