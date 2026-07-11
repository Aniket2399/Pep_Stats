import { codeForTeam } from './codes'

test('maps known sample teams to their codes', () => {
  expect(codeForTeam('Barcelona')).toBe('BAR')
  expect(codeForTeam('Real Madrid')).toBe('RMA')
})
test('derives a code for unknown teams', () => {
  expect(codeForTeam('Nowhere United')).toBe('NOW')
})
