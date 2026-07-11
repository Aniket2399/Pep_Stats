import { mapStandings, mapSquads, mapGroups, mapBracket } from './adapter'
import type { WcMatch } from './types'

test('mapStandings maps team_season rows to AppData standings, ordered', () => {
  const rows = [
    { team_id: 217, team: 'Barcelona', matches: 38, wins: 29, draws: 4, losses: 5, gf: 112, ga: 29, gd: 83, points: 91, xg_for: 80, xg_against: 30, possession_pct: 64, ppda: 8 },
    { team_id: 220, team: 'Real Madrid', matches: 38, wins: 28, draws: 6, losses: 4, gf: 110, ga: 34, gd: 76, points: 90, xg_for: 78, xg_against: 33, possession_pct: 60, ppda: 9 },
  ]
  const out = mapStandings(rows as never)
  expect(out[0].pos).toBe(1)
  expect(out[0].team).toBe('Barcelona')
  expect(out[0].code).toBe('BAR')
  expect(out[0].won).toBe(29)
  expect(out[0].played).toBe(38)
  expect(typeof out[0].form).toBe('string')
})

test('mapSquads groups players by team with numbers and percentiles', () => {
  const players = [
    { player_id: 1, team_id: 217, player: 'Lionel Messi', team: 'Barcelona', primary_position: 'Right Wing', appearances: 33, goals: 26, assists: 15, minutes: 2801, passes: 100, percentile_goals_per90: 99, percentile_assists_per90: 95, percentile_xg_per90: 98, percentile_xa_per90: 90, percentile_shots_per90: 88, percentile_passes_per90: 70 },
  ]
  const squads = mapSquads(players as never)
  expect(squads['Barcelona']).toHaveLength(1)
  expect(squads['Barcelona'][0].player).toBe('Lionel Messi')
  expect(squads['Barcelona'][0].goals).toBe(26)
  expect(squads['Barcelona'][0].percentiles.goals_per90).toBe(99)
})

test('mapGroups nests live standings into groups of rows', () => {
  const rows = [
    { group: 'Group A', rank: 1, team: 'Mexico', flag: '🇲🇽', played: 3, w: 3, d: 0, l: 0, gf: 6, ga: 0, gd: 6, points: 9 },
    { group: 'Group A', rank: 2, team: 'South Africa', flag: '🇿🇦', played: 3, w: 1, d: 1, l: 1, gf: 2, ga: 3, gd: -1, points: 4 },
  ]
  const groups = mapGroups(rows as never)
  expect(groups).toHaveLength(1)
  expect(groups[0].group).toBe('Group A')
  expect(groups[0].table[0].team).toBe('Mexico')
  expect(groups[0].table[0].pos).toBe(1)
})

const mkMatch = (id: number, h: string, a: string, hs: number | null, as: number | null, stage: string): WcMatch =>
  ({ id, home_team: h, away_team: a, home_flag: '🏳️', away_flag: '🏳️', home_score: hs, away_score: as, status: 'FINISHED', minute: null, stage, kickoff: '' })

test('mapBracket builds all rounds and positions R32 feeders under their R16 tie', () => {
  const ko: WcMatch[] = [
    mkMatch(1, 'Spain', 'Austria', 3, 0, 'Round of 32'),
    mkMatch(2, 'Portugal', 'Croatia', 2, 1, 'Round of 32'),
    mkMatch(3, 'Portugal', 'Spain', 0, 1, 'Round of 16'),
  ]
  const rounds = mapBracket(ko)
  expect(rounds.map((r) => r.stage)).toEqual(['Round of 32', 'Round of 16', 'Quarter-finals', 'Semi-finals', 'Final'])
  const r16 = rounds.find((r) => r.stage === 'Round of 16')!
  expect(r16.ties[0].home_team).toBe('Portugal')
  expect(r16.ties[0].away_score).toBe(1) // Spain won, real score kept
  // the two R32 feeders for that R16 tie are Portugal's and Spain's R32 wins
  const r32 = rounds.find((r) => r.stage === 'Round of 32')!
  const feeders = [r32.ties[0], r32.ties[1]].flatMap((t) => [t.home_team, t.away_team])
  expect(feeders).toContain('Spain')
  expect(feeders).toContain('Portugal')
  // Spain won its R16 tie → it advances into the Quarter-finals (replacing a TBD),
  // opponent still TBD (that feeder isn't played yet), and QF scores are null.
  const qf = rounds.find((r) => r.stage === 'Quarter-finals')!
  expect(qf.ties[0].home_team).toBe('Spain')
  expect(qf.ties[0].away_team).toBeNull()
  expect(qf.ties[0].home_score).toBeNull()
})

test('mapBracket pads rounds and never invents pairings', () => {
  const rounds = mapBracket([mkMatch(3, 'USA', 'Belgium', 1, 4, 'Round of 16')])
  const r16 = rounds.find((r) => r.stage === 'Round of 16')!
  expect(r16.ties).toHaveLength(8)
  expect(r16.ties[0].home_team).toBe('USA')
  expect(r16.ties.slice(1).every((t) => t.home_team === null && t.away_team === null)).toBe(true)
  expect(rounds.find((r) => r.stage === 'Round of 32')).toBeUndefined() // no R32 round without R32 matches
})
