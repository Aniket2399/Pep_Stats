// Team compare metrics reproduced from the wireframe (docs/reference/
// wireframe_component_source.jsx: teamRadar/teamStats + the seeded PRNG), so the
// radar and comparison rows match it exactly.

export const TEAM_AXES = ['Attack', 'Defense', 'Possession', 'Form', 'Discipline', 'Finishing']
export const RADAR_A = '#2f7fe0' // team A (accent blue)
export const RADAR_B = '#e8792b' // team B (accent orange)

function seedStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
function rng(seed: number): () => number {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

/** [Attack, Defense, Possession, Form, Discipline, Finishing], each 0..100. */
export function teamRadar(code: string, gf: number, ga: number, pts: number): number[] {
  const r = rng(seedStr('tr' + code) + 2)
  const atk = clamp(Math.round((gf / 118) * 100), 20, 99)
  const def = clamp(Math.round((1 - (ga - 21) / 110) * 100), 20, 99)
  const form = clamp(Math.round((pts / 94) * 100), 20, 99)
  const poss = clamp(Math.round(40 + (pts / 94) * 45 + (r() * 10 - 5)), 30, 99)
  const disc = clamp(Math.round(55 + r() * 40), 30, 99)
  const fin = clamp(Math.round((gf / (gf + 30)) * 100 + (r() * 8 - 4)), 20, 99)
  return [atk, def, poss, form, disc, fin]
}

export interface TeamStats { Pts: number; GF: number; GA: number; GD: number; winpct: number; poss: number; xg: number }

export function teamStats(code: string, gf: number, ga: number, pts: number, w: number, p: number): TeamStats {
  const r = rng(seedStr('ts' + code) + 6)
  return {
    Pts: pts, GF: gf, GA: ga, GD: gf - ga,
    winpct: Math.round((w / p) * 100),
    poss: Math.round(48 + (pts / 94) * 20 + (r() * 6 - 3)),
    xg: +(gf * (0.85 + r() * 0.2)).toFixed(1),
  }
}
