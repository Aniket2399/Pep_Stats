interface Series { name: string; color: string; values: number[] }

/** Line/area chart with Y value axis + X labels, reproducing the wireframe drawLine. */
export default function Line(
  { series, labels, width = 1000, height = 340 }:
  { series: Series[]; labels?: string[]; width?: number; height?: number },
) {
  const all = series.flatMap((s) => s.values)
  const mn = Math.min(...all), mx = Math.max(...all)
  const sp = (mx - mn) || 1
  const lo = mn - sp * 0.25, hi = mx + sp * 0.25
  const padL = 46, padR = 22, padT = 24, padB = 42
  const cw = width - padL - padR, ch = height - padT - padB
  const n = Math.max(...series.map((s) => s.values.length), 1)
  const X = (i: number) => padL + (n <= 1 ? cw / 2 : (cw * i) / (n - 1))
  const Y = (v: number) => padT + ch - ((v - lo) / (hi - lo)) * ch
  const step = Math.max(1, Math.ceil(n / 9))

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="chart-canvas" role="img" aria-label="trend line chart">
      <defs>
        {series.map((s) => (
          <linearGradient key={s.name} id={`ln-${s.name}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={s.color} stopOpacity="0.28" />
            <stop offset="1" stopColor={s.color} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>

      {/* Y axis: 5 gridlines + value labels */}
      {[0, 1, 2, 3, 4].map((g) => {
        const gy = padT + ch - (ch * g) / 4
        return (
          <g key={g}>
            <line x1={padL} y1={gy} x2={width - padR} y2={gy} stroke="rgba(233,236,240,0.10)" strokeWidth="1" />
            <text x={padL - 8} y={gy} fontSize="12" fill="var(--muted)" textAnchor="end" dominantBaseline="middle">{(lo + (hi - lo) * g / 4).toFixed(1)}</text>
          </g>
        )
      })}

      {/* series area + line + dots */}
      {series.map((s) => {
        const line = s.values.map((v, i) => `${X(i)},${Y(v)}`).join(' ')
        const area = `${line} ${X(s.values.length - 1)},${padT + ch} ${X(0)},${padT + ch}`
        return (
          <g key={s.name}>
            <polygon points={area} fill={`url(#ln-${s.name})`} />
            <polyline points={line} fill="none" stroke={s.color} strokeWidth="2.6" strokeLinejoin="round" />
            {s.values.map((v, i) => (
              <g key={i}>
                <circle cx={X(i)} cy={Y(v)} r="4.5" fill="#fff" />
                <circle cx={X(i)} cy={Y(v)} r="3.2" fill={s.color} />
              </g>
            ))}
          </g>
        )
      })}

      {/* X axis labels */}
      {(labels ?? []).map((l, i) => (i % step === 0 || i === n - 1)
        ? <text key={i} x={X(i)} y={padT + ch + 8} fontSize="11" fill="var(--muted)" textAnchor="middle" dominantBaseline="hanging">{l}</text>
        : null)}
    </svg>
  )
}
