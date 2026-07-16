import { mapBracket } from './adapter'
import type { WcMatch } from './types'

/** The real 2026 knockout rows, in the order the live API returns them. */
let nextId = 1
const m = (stage: string, home: string, hs: number | null, as: number | null, away: string): WcMatch => ({
  id: nextId++, home_team: home, away_team: away, home_flag: '', away_flag: '',
  home_score: hs, away_score: as, status: hs == null ? 'UP' : 'FINISHED', minute: null,
  stage, kickoff: '',
})

const KNOCKOUT: WcMatch[] = [
  m('Round of 16', 'Canada', 0, 3, 'Morocco'),
  m('Round of 16', 'Paraguay', 0, 1, 'France'),
  m('Round of 16', 'Brazil', 1, 2, 'Norway'),
  m('Round of 16', 'Mexico', 2, 3, 'England'),
  m('Round of 16', 'Portugal', 0, 1, 'Spain'),
  m('Round of 16', 'USA', 1, 4, 'Belgium'),
  m('Round of 16', 'Argentina', 3, 2, 'Egypt'),
  m('Round of 16', 'Switzerland', 4, 3, 'Colombia'),
  m('Quarterfinals', 'France', 2, 0, 'Morocco'),
  m('Quarterfinals', 'Spain', 2, 1, 'Belgium'),
  m('Quarterfinals', 'Norway', 1, 2, 'England'),
  m('Quarterfinals', 'Argentina', 3, 1, 'Switzerland'),
  m('Semifinals', 'France', 0, 2, 'Spain'),
  m('Semifinals', 'England', 1, 2, 'Argentina'),
]

const pair = (t: { home_team: string | null; away_team: string | null }) =>
  [t.home_team, t.away_team].sort().join(' v ')

test('semi-final ties are the real matches, not pairings invented from slot order', () => {
  const sf = mapBracket(KNOCKOUT).find((r) => /semi/i.test(r.stage))!.ties
  // Real semis: France v Spain and England v Argentina. Pairing adjacent
  // quarter-final winners instead yields France v England / Spain v Argentina.
  expect(sf.map(pair).sort()).toEqual(['Argentina v England', 'France v Spain'])
})

test('a played semi-final carries its real score', () => {
  const sf = mapBracket(KNOCKOUT).find((r) => /semi/i.test(r.stage))!.ties
  const fs = sf.find((t) => pair(t) === 'France v Spain')!
  expect(fs.home_score).not.toBeNull()
  expect(fs.away_score).not.toBeNull()
  // Spain won 2-0 whichever side it is rendered on.
  const spain = fs.home_team === 'Spain' ? fs.home_score : fs.away_score
  const france = fs.home_team === 'France' ? fs.home_score : fs.away_score
  expect([spain, france]).toEqual([2, 0])
})

test('both semi-finals decided sends their winners to the final', () => {
  const fin = mapBracket(KNOCKOUT).find((r) => /^final$/i.test(r.stage))!.ties[0]
  expect([fin.home_team, fin.away_team].sort()).toEqual(['Argentina', 'Spain'])
})
