import { render } from '@testing-library/react'
import { expect, test } from 'vitest'
import RadarChart from './RadarChart'
import ShotMap from './ShotMap'

test('RadarChart renders one polygon with N points', () => {
  const metrics = [{ label: 'xG', value: 90 }, { label: 'Assists', value: 40 }, { label: 'Tackles', value: 70 }]
  const { container } = render(<RadarChart metrics={metrics} />)
  const poly = container.querySelector('polygon')!
  expect(poly.getAttribute('points')!.trim().split(' ')).toHaveLength(3)
})

test('ShotMap renders one circle per shot', () => {
  const shots = [
    { location_x: 110, location_y: 40, xg: 0.5, outcome: 'Goal' },
    { location_x: 100, location_y: 30, xg: 0.1, outcome: 'Saved' },
  ]
  const { container } = render(<ShotMap shots={shots} />)
  // 2 shot circles (rects for pitch/box are separate)
  expect(container.querySelectorAll('circle')).toHaveLength(2)
})
