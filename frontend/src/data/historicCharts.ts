// Historic chart series/breakdowns reproduced from the wireframe
// (seriesTeam, goalTypes, goalIntervals, shot funnel) + its seeded PRNG.
import { teamStats } from './historicRadar'

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

export interface SeriesPt { v: number; label: string }

/** Per-matchweek series for a metric (goals/xg/poss/points/shots). */
export function seriesTeam(metric: string, code: string, gf: number, ga: number, pts: number, w: number, d: number, p: number): SeriesPt[] {
  const ts = teamStats(code, gf, ga, pts, w, p)
  const r = rng(seedStr('trend' + metric + code) + 3)
  const gpg = gf / 38
  const cfg: Record<string, [number, number]> = { goals: [gpg, 1.3], xg: [gpg * 0.92, 1.0], poss: [ts.poss, 6], shots: [gpg * 4.6, 3.2] }
  const pw = w / 38, pd = (w + d) / 38
  const out: SeriesPt[] = []
  let cum = 0
  for (let i = 0; i < 20; i++) {
    let v: number
    if (metric === 'points') { const res = r(); cum += res < pw ? 3 : res < pd ? 1 : 0; v = cum }
    else { const c = cfg[metric] ?? cfg.goals; v = Math.max(0, +(c[0] + gauss(r) * c[1]).toFixed(metric === 'poss' ? 0 : 1)) }
    out.push({ v, label: 'MW' + (i + 1) })
  }
  return out
}

export function goalTypes(gf: number): { label: string; value: number }[] {
  const ratio: [string, number][] = [['Open play', 0.71], ['Penalty', 0.11], ['Free kick', 0.08], ['Header (set-piece)', 0.055], ['Counter attack', 0.045]]
  return ratio.map(([label, r]) => ({ label, value: Math.round(gf * r) }))
}

export function goalIntervals(code: string, gf: number): { label: string; value: number }[] {
  const r = rng(seedStr('gi' + code) + 8)
  const w = [0, 0, 0, 0, 0, 0].map(() => 0.6 + r())
  const sw = w.reduce((a, b) => a + b, 0)
  const labels = ['0-15', '16-30', '31-45', '46-60', '61-75', '76-90']
  return labels.map((l, i) => ({ label: l, value: Math.round(gf * w[i] / sw) }))
}

export function shotFunnel(code: string, gf: number): { totShots: number; onT: number; goals: number } {
  const r = rng(seedStr('fun' + code) + 11)
  const convRate = 0.098 + r() * 0.03
  const totShots = Math.round(gf / convRate)
  const onT = Math.round(totShots * (0.37 + r() * 0.06))
  return { totShots, onT, goals: gf }
}
