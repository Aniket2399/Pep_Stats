import { flagUrl } from './flags'

test('converts a flag emoji to a flagcdn image url', () => {
  expect(flagUrl('🇲🇽')).toBe('https://flagcdn.com/w80/mx.png')
  expect(flagUrl('🇪🇸', 40)).toBe('https://flagcdn.com/w40/es.png')
})

test('returns null for non-standard flags so callers fall back to the emoji', () => {
  expect(flagUrl('')).toBeNull()
  expect(flagUrl('🏴󠁧󠁢󠁥󠁮󠁧󠁿')).toBeNull() // England subdivision flag (not 2 regional indicators)
  expect(flagUrl('abc')).toBeNull()
})
