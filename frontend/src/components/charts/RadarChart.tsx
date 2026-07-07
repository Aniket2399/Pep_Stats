import { radarPoints } from './geometry'

export default function RadarChart({ metrics }: { metrics: { label: string; value: number }[] }) {
  const size = 280, cx = size / 2, cy = size / 2, radius = 100
  const values = metrics.map((m) => m.value)
  const pts = radarPoints(values, radius)
  const rings = [25, 50, 75, 100]
  const polygon = pts.map(([x, y]) => `${cx + x},${cy + y}`).join(' ')
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[300px]" role="img" aria-label="player radar">
      {rings.map((pct) => (
        <circle key={pct} cx={cx} cy={cy} r={(pct / 100) * radius} fill="none" stroke="#e5e7eb" />
      ))}
      {metrics.map((m, i) => {
        const [ax, ay] = radarPoints(metrics.map(() => 100), radius)[i]
        return (
          <g key={m.label}>
            <line x1={cx} y1={cy} x2={cx + ax} y2={cy + ay} stroke="#e5e7eb" />
            <text x={cx + ax * 1.14} y={cy + ay * 1.14} fontSize="9" textAnchor="middle"
                  dominantBaseline="middle" className="fill-slate-500">{m.label}</text>
          </g>
        )
      })}
      <polygon points={polygon} fill="rgba(11,31,58,0.25)" stroke="#0b1f3a" strokeWidth="2" />
    </svg>
  )
}
