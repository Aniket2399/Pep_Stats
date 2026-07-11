import Scatter from '../components/charts/Scatter'
import Donut from '../components/charts/Donut'
import Bars from '../components/charts/Bars'
import type { WcGroup } from '../data/types'

function Kpi({ val, label }: { val: string | number; label: string }) {
  return <div className="kpi"><div className="kpi-val" style={{ fontSize: 18 }}>{val}</div><div className="kpi-label">{label}</div></div>
}

export default function WcInsights({ groups }: { groups: WcGroup[] }) {
  if (!groups.length) return <div className="panel">Live World Cup data unavailable.</div>
  const rows = groups.flatMap((g) => g.table)
  const totalGoals = rows.reduce((s, r) => s + r.gf, 0)
  const bestAttack = [...rows].sort((a, b) => b.gf - a.gf)
  const bestDefense = [...rows].sort((a, b) => a.ga - b.ga)
  const byGd = [...rows].sort((a, b) => b.gd - a.gd)
  const byPoints = [...rows].sort((a, b) => b.points - a.points || b.gd - a.gd)
  const maxGd = Math.max(1, byGd[0]?.gd ?? 1)

  // Scatter: points vs goal difference — label the top-6 sides by points.
  const topCodes = new Set(byPoints.slice(0, 6).map((r) => r.code))
  const points = rows.map((r) => ({ x: r.points, y: r.gd, label: topCodes.has(r.code) ? r.code : '' }))

  // Donut: how competitive was the group stage — decisive results vs draws.
  const decisive = rows.reduce((s, r) => s + r.won, 0)
  const draws = Math.round(rows.reduce((s, r) => s + r.drawn, 0) / 2)

  return (
    <div>
      <div className="sec-title">Tournament Insights</div>
      <div className="sec-sub">Standings strength, competitiveness &amp; goal difference · real data</div>

      <div className="kpi-strip" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <Kpi val={totalGoals} label="Group Goals" />
        <Kpi val={bestAttack[0]?.team ?? '—'} label="Best Attack" />
        <Kpi val={bestDefense[0]?.team ?? '—'} label="Best Defense" />
        <Kpi val={byGd[0]?.team ?? '—'} label="Top Goal Diff" />
      </div>

      <div className="two-col" style={{ marginTop: 16 }}>
        <div className="panel">
          <div className="sec-title">Points vs Goal Difference</div>
          <div className="sec-sub">Each side's group return (top sides labelled)</div>
          <Scatter points={points} xLabel="Points →" yLabel="Goal difference →" />
        </div>
        <div className="panel">
          <div className="sec-title">Group-stage results</div>
          <div className="sec-sub">How competitive the groups were</div>
          <Donut centerValue={decisive + draws} centerLabel="MATCHES" segments={[
            { label: 'Decisive', value: decisive, color: '#2f7fe0' },
            { label: 'Draws', value: draws, color: '#9aa1ab' },
          ]} />
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="sec-title">Goal difference leaders</div>
        <div className="sec-sub">Best net goal difference across the group stage</div>
        <div style={{ marginTop: 10 }}>
          <Bars items={byGd.slice(0, 10).map((r) => ({ label: `${r.flag} ${r.team} (${r.gd > 0 ? '+' : ''}${r.gd})`, value: Math.round((Math.max(0, r.gd) / maxGd) * 100) }))} />
        </div>
      </div>
    </div>
  )
}
