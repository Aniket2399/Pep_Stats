import { render, within } from '@testing-library/react'
import WcBracket from './WcBracket'
import { mapBracket } from '../data/adapter'
import type { WcMatch } from '../data/types'

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

const rowsOf = (box: HTMLElement) =>
  Array.from(box.querySelectorAll('.kt-row')).map((r) =>
    [r.querySelector('.kt-name')?.textContent, r.querySelector('.kt-sc')?.textContent].join(' ').trim(),
  )

/** Every rendered tie box, as its "Team score" rows. */
const allTies = () => Array.from(document.querySelectorAll('.btie')).map((b) => rowsOf(b as HTMLElement))

test('the rendered semi-final boxes are the real ties, with scores', () => {
  render(<WcBracket rounds={mapBracket(KNOCKOUT)} />)
  const ties = allTies()
  // The real semis are rendered with their scores...
  expect(ties).toContainEqual(['France 0', 'Spain 2'])
  expect(ties).toContainEqual(['England 1', 'Argentina 2'])
  // ...and the pairings invented from slot order are nowhere on the page.
  expect(ties).not.toContainEqual(['France ', 'England '])
  expect(ties).not.toContainEqual(['Spain ', 'Argentina '])
})

test('the final shows the two semi-final winners rather than TBD', () => {
  render(<WcBracket rounds={mapBracket(KNOCKOUT)} />)
  const final = document.querySelector('.btie.final') as HTMLElement
  expect(within(final).queryByText('TBD')).toBeNull()
  const names = Array.from(final.querySelectorAll('.kt-name')).map((n) => n.textContent)
  expect(names.sort()).toEqual(['Argentina', 'Spain'])
})
