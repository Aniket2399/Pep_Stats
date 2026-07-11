interface Pt { x: number; y: number; label: string; color?: string }

/** Scatter plot with axis ticks, jitter to separate tied points, and readable labels. */
export default function Scatter(
  { points, xLabel, yLabel, width = 580, height = 360 }:
  { points: Pt[]; xLabel: string; yLabel: string; width?: number; height?: number },
) {
  const xs = points.map((p) => p.x), ys = points.map((p) => p.y)
  let x0 = Math.min(...xs, 0), x1 = Math.max(...xs, 1), y0 = Math.min(...ys, 0), y1 = Math.max(...ys, 1)
  const xp = ((x1 - x0) || 1) * 0.1, yp = ((y1 - y0) || 1) * 0.12
  x0 -= xp; x1 += xp; y0 -= yp; y1 += yp
  const padL = 46, padR = 22, padT = 16, padB = 44
  const cw = width - padL - padR, ch = height - padT - padB
  const sx = (v: number) => padL + ((v - x0) / (x1 - x0)) * cw
  const sy = (v: number) => padT + ch - ((v - y0) / (y1 - y0)) * ch
  const jit = (i: number) => ((i * 97) % 13) / 13 - 0.5 // deterministic -0.5..0.5
  const ticks = [0, 0.25, 0.5, 0.75, 1]

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="chart-canvas" role="img" aria-label="scatter plot">
      {/* gridlines + Y tick values */}
      {ticks.map((f) => {
        const gy = padT + ch - f * ch
        return (
          <g key={`y${f}`}>
            <line x1={padL} x2={width - padR} y1={gy} y2={gy} stroke="rgba(233,236,240,0.08)" strokeWidth="1" />
            <text x={padL - 7} y={gy} fontSize="10" fill="var(--muted)" textAnchor="end" dominantBaseline="middle">{Math.round(y0 + (y1 - y0) * f)}</text>
          </g>
        )
      })}
      {/* X tick values */}
      {ticks.map((f) => {
        const gx = padL + f * cw
        return <text key={`x${f}`} x={gx} y={padT + ch + 7} fontSize="10" fill="var(--muted)" textAnchor="middle" dominantBaseline="hanging">{Math.round(x0 + (x1 - x0) * f)}</text>
      })}

      {/* unlabeled dots (faded, jittered) */}
      {points.filter((p) => !p.label).map((p, i) => (
        <circle key={`u${i}`} cx={sx(p.x) + jit(i) * 10} cy={sy(p.y) + jit(i * 3) * 8} r="4" fill={p.color ?? 'var(--accent)'} opacity="0.5" />
      ))}
      {/* labeled dots on top, with a legibility background behind the label */}
      {points.filter((p) => p.label).map((p, i) => {
        const cx = sx(p.x) + jit(i) * 8, cy = sy(p.y)
        const lx = cx + 9, ly = cy - 8 + (i % 2 === 0 ? -4 : 8)
        return (
          <g key={`l${i}`}>
            <circle cx={cx} cy={cy} r="6" fill={p.color ?? 'var(--accent)'} />
            <rect x={lx - 3} y={ly - 8} width={p.label.length * 6.6 + 6} height={14} rx={3} fill="rgba(14,17,22,0.72)" />
            <text x={lx} y={ly} fontSize="10.5" fontWeight="700" fill="var(--ink)" dominantBaseline="middle">{p.label}</text>
          </g>
        )
      })}

      <text x={padL + cw / 2} y={height - 5} fontSize="10.5" fill="var(--muted)" textAnchor="middle">{xLabel}</text>
      <text x={12} y={padT + ch / 2} fontSize="10.5" fill="var(--muted)" textAnchor="middle" transform={`rotate(-90 12 ${padT + ch / 2})`}>{yLabel}</text>
    </svg>
  )
}
