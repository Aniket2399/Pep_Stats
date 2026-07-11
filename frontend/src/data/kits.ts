import type { CSSProperties } from 'react'

// La Liga club kit colors, ported verbatim from the wireframe's kitMap
// (docs/reference/wireframe_component_source.jsx). code -> [pattern, c1, c2].
const KIT: Record<string, [string, string, string]> = {
  BAR: ['v', '#a50044', '#004d98'], RMA: ['s', '#f2f2f2', '#f2f2f2'], ATM: ['v', '#d3122a', '#ffffff'],
  VAL: ['s', '#f0f0f0', '#f0f0f0'], SEV: ['s', '#ffffff', '#c8102e'], VIL: ['s', '#ffd400', '#ffd400'],
  ATH: ['v', '#ee2523', '#ffffff'], CEL: ['s', '#8ac3ee', '#8ac3ee'], MAL: ['v', '#5aa9dc', '#ffffff'],
  ESP: ['v', '#007fc8', '#ffffff'], RAY: ['sash', '#ffffff', '#e2372b'], RSO: ['v', '#0067b1', '#ffffff'],
  ELC: ['v', '#009a44', '#ffffff'], LEV: ['v', '#9b2743', '#2a4b9b'], GET: ['s', '#005999', '#005999'],
  DEP: ['v', '#2a7de1', '#ffffff'], GRA: ['h', '#c8102e', '#ffffff'], EIB: ['v', '#a3195b', '#004a99'],
  ALM: ['v', '#c8102e', '#ffffff'], COR: ['v', '#007a3d', '#ffffff'],
}

function lum(hex: string): number {
  const h = hex.replace('#', '')
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const r = parseInt(n.slice(0, 2), 16) / 255, g = parseInt(n.slice(2, 4), 16) / 255, b = parseInt(n.slice(4, 6), 16) / 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Per-club crest/badge inline style, reproduced from the wireframe's badgeStyle().
 * Unknown codes (2015/16 clubs not in the wireframe's 2014/15 kit map) fall back
 * to a neutral accent split so the crest still recolors per club.
 */
export function crestStyle(code: string): CSSProperties {
  const k = KIT[code] ?? ['v', '#2f7fe0', '#1d242e']
  const [pat, c1, c2] = k
  let bg: string
  if (pat === 'v') bg = `repeating-linear-gradient(90deg,${c1} 0 5px,${c2} 5px 10px)`
  else if (pat === 'h') bg = `repeating-linear-gradient(0deg,${c1} 0 5px,${c2} 5px 10px)`
  else if (pat === 'sash') bg = `linear-gradient(135deg,${c1} 0 34%,${c2} 34% 60%,${c1} 60% 100%)`
  else bg = c2 !== c1 ? `linear-gradient(160deg,${c1} 0 55%,${c2} 55% 100%)` : c1
  const light = (lum(c1) + lum(c2)) / 2 > 0.55
  return {
    background: bg,
    color: light ? '#14181d' : '#fff',
    textShadow: light ? 'none' : '0 1px 2px rgba(0,0,0,.55)',
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.3), 0 2px 6px rgba(0,0,0,.35)',
  }
}
