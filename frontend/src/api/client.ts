import { API_BASE } from '../config'
import type { Club, PlayerSeason, Shot, LiveMatch, Fixture, StandingRow, Meta } from './types'

export class ApiError extends Error {
  constructor(message: string, readonly status?: number) { super(message) }
}

async function request<T>(path: string): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`)
  } catch (e) {
    throw new ApiError(`network error: ${(e as Error).message}`)
  }
  if (!res.ok) throw new ApiError(`HTTP ${res.status} for ${path}`, res.status)
  return (await res.json()) as T
}

function qs(params: Record<string, string | number | undefined>): string {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
  return parts.length ? `?${parts.join('&')}` : ''
}

export const getClubs = () => request<Club[]>('/api/clubs')
export const getPlayers = (p: { club?: number; position?: string; limit?: number } = {}) =>
  request<PlayerSeason[]>(`/api/players${qs(p)}`)
export const getPlayer = (id: number) => request<PlayerSeason>(`/api/players/${id}`)
export const getShots = (p: { club?: number; player?: number } = {}) =>
  request<Shot[]>(`/api/shots${qs(p)}`)
export const getLiveMatches = () => request<LiveMatch[]>('/api/live/matches')
export const getLiveFixtures = () => request<Fixture[]>('/api/live/fixtures')
export const getLiveStandings = () => request<StandingRow[]>('/api/live/standings')
export const getMeta = () => request<Meta>('/api/meta')
