import { afterEach, expect, test, vi } from 'vitest'
import * as client from './client'

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, json: async () => body })
}
afterEach(() => vi.restoreAllMocks())

test('getClubs parses JSON', async () => {
  vi.stubGlobal('fetch', mockFetch(200, [{ team_id: 1, team: 'Barcelona' }]))
  const clubs = await client.getClubs()
  expect(clubs[0].team).toBe('Barcelona')
})

test('getPlayers builds query params', async () => {
  const f = mockFetch(200, [])
  vi.stubGlobal('fetch', f)
  await client.getPlayers({ club: 1, position: 'FWD', limit: 5 })
  expect(String(f.mock.calls[0][0])).toContain('/api/players?club=1&position=FWD&limit=5')
})

test('throws ApiError on non-2xx', async () => {
  vi.stubGlobal('fetch', mockFetch(500, { detail: 'boom' }))
  await expect(client.getClubs()).rejects.toBeInstanceOf(client.ApiError)
})
