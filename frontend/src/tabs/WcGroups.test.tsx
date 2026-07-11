import { render, screen } from '@testing-library/react'
import WcGroups from './WcGroups'
import type { WcGroup } from '../data/types'

const groups: WcGroup[] = [{
  group: 'Group A',
  table: [
    { pos: 1, code: 'MEX', team: 'Mexico', flag: '🇲🇽', played: 3, won: 3, drawn: 0, lost: 0, gf: 6, ga: 0, gd: 6, points: 9 },
    { pos: 2, code: 'RSA', team: 'South Africa', flag: '🇿🇦', played: 3, won: 1, drawn: 1, lost: 1, gf: 2, ga: 3, gd: -1, points: 4 },
  ],
}]

test('renders a group card with its teams', () => {
  render(<WcGroups groups={groups} />)
  expect(screen.getByText('Group A')).toBeInTheDocument()
  expect(screen.getByText('Mexico')).toBeInTheDocument()
})
