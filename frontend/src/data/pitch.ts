// Pitch heatmap/movement data reproduced from the wireframe
// (docs/reference/wireframe_component_source.jsx: zoneMap, genPoints, genPath,
// playerMatchKpis + the seeded PRNG). Coordinates are 0..100 on the pitch.

export interface Pt { x: number; y: number }

export const ZONE_MAP: Record<string, [number, number, number, number]> = {
  GK: [8, 50, 7, 11], RB: [34, 84, 22, 11], LB: [34, 16, 22, 11],
  CBr: [22, 60, 13, 15], CBl: [22, 40, 13, 15], CDM: [44, 50, 16, 17],
  CMr: [52, 58, 18, 19], CMl: [52, 42, 18, 19], CAM: [62, 50, 17, 18],
  RW: [72, 83, 20, 13], LW: [72, 17, 20, 13], ST: [82, 50, 15, 20],
}

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
const gauss = (r: () => number) => (r() + r() + r() + r() - 2) / 1.4
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

/** Map a sample-squad position to a pitch zone key; idx spreads CB/CM variants. */
export function zoneForPosition(pos: string, idx: number): string {
  switch (pos) {
    case 'GK': return 'GK'
    case 'RB': case 'RWB': return 'RB'
    case 'LB': case 'LWB': return 'LB'
    case 'CB': return idx % 2 === 0 ? 'CBr' : 'CBl'
    case 'DM': case 'CDM': return 'CDM'
    case 'CM': return ['CMr', 'CMl', 'CAM'][idx % 3]
    case 'CAM': return 'CAM'
    case 'RW': case 'RM': return 'RW'
    case 'LW': case 'LM': return 'LW'
    case 'ST': case 'CF': return 'ST'
    default: return 'CAM'
  }
}

export function posGroup(pos: string): 'GK' | 'DEF' | 'MID' | 'FWD' {
  if (pos === 'GK') return 'GK'
  if (['RB', 'LB', 'CB', 'RWB', 'LWB'].includes(pos)) return 'DEF'
  if (['DM', 'CDM', 'CM', 'CAM', 'RM', 'LM'].includes(pos)) return 'MID'
  return 'FWD'
}

/** Position group from a full StatsBomb position name (e.g. "Center Forward"). */
export function posGroupFull(pos: string): 'GK' | 'DEF' | 'MID' | 'FWD' {
  const p = pos.toLowerCase()
  if (p.includes('keeper')) return 'GK'
  if (p.includes('back')) return 'DEF'
  if (p.includes('midfield')) return 'MID'
  if (p.includes('wing') || p.includes('forward') || p.includes('strik')) return 'FWD'
  return 'MID'
}

/** Pitch zone key from a full StatsBomb position name; idx spreads CB/CM variants. */
export function zoneForPositionFull(pos: string, idx: number): string {
  const p = pos.toLowerCase()
  if (p.includes('keeper')) return 'GK'
  if (p.includes('right') && p.includes('back')) return 'RB'
  if (p.includes('left') && p.includes('back')) return 'LB'
  if (p.includes('back')) return idx % 2 === 0 ? 'CBr' : 'CBl'
  if (p.includes('defensive midfield')) return 'CDM'
  if (p.includes('attacking midfield')) return 'CAM'
  if (p.includes('midfield')) return ['CMr', 'CMl', 'CAM'][idx % 3]
  if (p.includes('right')) return 'RW'
  if (p.includes('left')) return 'LW'
  return 'ST'
}

/** 640 gaussian touch points around the player's zone (heat / points views). */
export function genPoints(key: string, z: number[], phase: string): Pt[] {
  const r = rng(seedStr(key) + 3)
  let cx = z[0], cy = z[1]
  const sx = z[2], sy = z[3]
  if (phase === '1st') cx -= 3.5; else if (phase === '2nd') cx += 4.5
  cx += (r() * 6 - 3); cy += (r() * 4 - 2)
  const out: Pt[] = []
  for (let i = 0; i < 640; i++) {
    const f = r() < 0.32 ? 0.45 : 1
    out.push({ x: clamp(cx + gauss(r) * sx * f, 3, 97), y: clamp(cy + gauss(r) * sy * f, 4, 96) })
  }
  return out
}

/** 170-point smoothed movement path (Path view). */
export function genPath(key: string, z: number[], phase: string): Pt[] {
  const r = rng(seedStr(key) + 11)
  let cx = z[0], cy = z[1]
  const sx = z[2], sy = z[3]
  if (phase === '1st') cx -= 3.5; else if (phase === '2nd') cx += 4.5
  let x = cx, y = cy, vx = 0, vy = 0
  const out: Pt[] = []
  for (let i = 0; i < 170; i++) {
    const ax = (cx - x) * 0.05 + (r() * 2 - 1) * sx * 0.55
    const ay = (cy - y) * 0.05 + (r() * 2 - 1) * sy * 0.55
    vx = vx * 0.82 + ax * 0.5; vy = vy * 0.82 + ay * 0.5
    x = clamp(x + vx, 3, 97); y = clamp(y + vy, 4, 96)
    out.push({ x, y })
  }
  return out
}

/** Share of points in the defensive / middle / attacking third (percent). */
export function zonesFor(pts: Pt[]): [number, number, number] {
  let d = 0, m = 0, a = 0
  for (const p of pts) { if (p.x < 33.34) d++; else if (p.x < 66.67) m++; else a++ }
  const n = pts.length || 1
  return [Math.round(d / n * 100), Math.round(m / n * 100), Math.round(a / n * 100)]
}

const KPI_BASE: Record<string, number[]> = { GK: [5.4, 24, 2, 29], DEF: [10.2, 32, 18, 62], MID: [11.4, 31, 20, 86], FWD: [10.6, 33, 30, 58] }

export function playerKpis(key: string, grp: string) {
  const r = rng(seedStr(key) + 7)
  const base = KPI_BASE[grp] ?? KPI_BASE.MID
  return {
    distance: +(base[0] + (r() * 1.2 - 0.6)).toFixed(1),
    topspeed: +(base[1] + (r() * 2 - 1)).toFixed(1),
    sprints: Math.round(base[2] + (r() * 8 - 4)),
    touches: Math.round(base[3] + (r() * 20 - 10)),
  }
}
