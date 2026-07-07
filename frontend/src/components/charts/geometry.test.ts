import { expect, test } from 'vitest'
import { radarPoints, pitchScale, xgRadius } from './geometry'

test('radarPoints places 4 axes at top/right/bottom/left', () => {
  const p = radarPoints([100, 100, 100, 100], 10).map(([x, y]) => [Math.round(x), Math.round(y)])
  expect(p).toEqual([[0, -10], [10, 0], [0, 10], [-10, 0]])
})

test('radarPoints scales by value', () => {
  const [[, y]] = radarPoints([50], 10)   // single axis at top, half radius
  expect(Math.round(y)).toBe(-5)
})

test('pitchScale maps statsbomb coords into the box', () => {
  const s = pitchScale(120, 80)
  expect(s.x(0)).toBe(0); expect(s.x(120)).toBe(120)
  expect(s.y(0)).toBe(0); expect(s.y(80)).toBe(80)
})

test('xgRadius grows with xg', () => {
  expect(xgRadius(0.8)).toBeGreaterThan(xgRadius(0.1))
})
