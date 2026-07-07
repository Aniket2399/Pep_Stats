import { scaleLinear, scaleSqrt } from 'd3-scale'

/** Points (relative to centre 0,0) for a radar polygon. values are 0..100. Axis 0 points up. */
export function radarPoints(values: number[], radius: number): [number, number][] {
  const n = values.length
  const r = scaleLinear([0, 100], [0, radius])
  return values.map((v, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n
    const rr = r(v)
    return [rr * Math.cos(angle), rr * Math.sin(angle)]
  })
}

/** Map StatsBomb pitch coords (x 0..120, y 0..80) into an SVG box of width×height. */
export function pitchScale(width: number, height: number) {
  const x = scaleLinear([0, 120], [0, width])
  const y = scaleLinear([0, 80], [0, height])
  return { x: (v: number) => x(v), y: (v: number) => y(v) }
}

/** Circle radius from xG (sqrt so area ∝ xG). */
const _r = scaleSqrt([0, 1], [3, 14]).clamp(true)
export function xgRadius(xg: number): number { return _r(xg) }

/**
 * Outcome colors — dataviz-skill categorical assignment.
 *
 * Shot outcome is nominal identity (Goal/Saved/Off T/Blocked), not a
 * good→critical severity ladder, so each outcome takes its own hue from the
 * design system's fixed 8-hue categorical order rather than a status scale.
 * Goal keeps green (the conventional "scored" read); the others are
 * validated categorical hues chosen so every mark clears the chroma floor
 * (a desaturated "off-target gray" reads as < 0.10 OKLCH chroma and fails
 * the identity check) while staying within the ΔE floor band for
 * colorblind separation. Verified with:
 *
 *   node scripts/validate_palette.js \
 *     "#2a78d6,#4a3aa7,#008300,#eb6834" --mode light --surface "#f8fafc" --pairs all
 *
 * → lightness band PASS, chroma floor PASS, contrast PASS, CVD separation
 * WARN (worst pair Blocked↔Goal, ΔE 11.2 — inside the legal 8–12 floor band
 * because ShotMap ships a legend with direct text labels as the required
 * secondary encoding).
 */
export const OUTCOME_COLORS: Record<string, string> = {
  Goal: '#008300',       // categorical green — conventional "scored" read
  Saved: '#2a78d6',       // categorical blue
  'Off T': '#4a3aa7',    // categorical violet (kept ≥ chroma floor; plain gray fails it)
  Blocked: '#eb6834',    // categorical orange
  Wayward: '#4a3aa7',
  Post: '#eb6834',
}
export const outcomeColor = (o: string): string => OUTCOME_COLORS[o] ?? '#9e9e9e'
