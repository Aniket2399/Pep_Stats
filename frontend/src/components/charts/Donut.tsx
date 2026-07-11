interface Seg { label: string; value: number; color: string }

export default function Donut(
  { segments, size = 190, centerValue, centerLabel }:
  { segments: Seg[]; size?: number; centerValue?: string | number; centerLabel?: string },
) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const r = size / 2 - 14, cx = size / 2, cy = size / 2, C = 2 * Math.PI * r
  let acc = 0
  const center = centerValue ?? total
  return (
    <div className="donut-cell">
      <svg viewBox={`0 0 ${size} ${size}`} className="dchart" role="img" aria-label="distribution"
        style={{ width: '100%', maxWidth: 210, height: 'auto', margin: '0 auto', display: 'block' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--panel-2)" strokeWidth="16" />
        {segments.map((s) => {
          const frac = s.value / total
          const dash = `${frac * C} ${C - frac * C}`
          const el = (
            <circle key={s.label} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth="16"
              strokeDasharray={dash} strokeDashoffset={-acc * C}
              transform={`rotate(-90 ${cx} ${cy})`} />
          )
          acc += frac
          return el
        })}
        <text x={cx} y={centerLabel ? cy - 4 : cy} textAnchor="middle" dominantBaseline="middle"
          fontFamily="Archivo, sans-serif" fontWeight={900} fontSize={size * 0.24} fill="var(--ink)">{center}</text>
        {centerLabel && (
          <text x={cx} y={cy + size * 0.13} textAnchor="middle" dominantBaseline="middle"
            fontWeight={700} fontSize={size * 0.075} letterSpacing="1.2" fill="var(--muted)">{centerLabel}</text>
        )}
      </svg>
      <div className="dlegend">
        {segments.map((s) => (
          <div key={s.label} className="dl-item">
            <span className="dl-sw" style={{ background: s.color }} />{s.label}
            <span className="dl-val">{s.value} · {Math.round((s.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
