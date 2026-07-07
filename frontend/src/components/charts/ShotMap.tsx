import { pitchScale, xgRadius, outcomeColor, OUTCOME_COLORS } from './geometry'

interface S { location_x: number; location_y: number; xg: number; outcome: string }

export default function ShotMap({ shots }: { shots: S[] }) {
  const W = 360, H = 240
  const s = pitchScale(W, H)   // x along length (0..120), y across (0..80)
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[420px] bg-pitch/10 rounded" role="img" aria-label="shot map">
        <rect x="1" y="1" width={W - 2} height={H - 2} fill="none" stroke="#94a3b8" />
        {/* right-side penalty box (attacking toward x=120) */}
        <rect x={s.x(102)} y={s.y(18)} width={W - s.x(102)} height={s.y(62) - s.y(18)} fill="none" stroke="#94a3b8" />
        {shots.map((sh, i) => (
          <circle key={i} cx={s.x(sh.location_x)} cy={s.y(sh.location_y)} r={xgRadius(sh.xg)}
                  fill={outcomeColor(sh.outcome)} fillOpacity={0.75} stroke="#334155" strokeWidth="0.5" />
        ))}
      </svg>
      <div className="flex flex-wrap gap-3 mt-2 text-xs">
        {Object.entries(OUTCOME_COLORS).slice(0, 4).map(([k, c]) => (
          <span key={k} className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: c }} />{k}
          </span>
        ))}
      </div>
    </div>
  )
}
