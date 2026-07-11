import { crestStyle } from './kits'

test('different clubs get different crest backgrounds', () => {
  const bar = crestStyle('BAR').background as string
  const rma = crestStyle('RMA').background as string
  expect(bar).toContain('a50044') // Barcelona blaugrana
  expect(rma).not.toBe(bar)       // Real Madrid differs
})

test('unknown club codes still get a (fallback) background', () => {
  const s = crestStyle('ZZZ')
  expect(typeof s.background).toBe('string')
  expect((s.background as string).length).toBeGreaterThan(0)
})
