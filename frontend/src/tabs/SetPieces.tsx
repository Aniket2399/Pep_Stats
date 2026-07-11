import sample from '../data/sample.json'
import Donut from '../components/charts/Donut'
import Bars from '../components/charts/Bars'
import { goalTypes, goalIntervals, shotFunnel } from '../data/historicCharts'

interface Row { code: string; gf: number }
const BAR = (sample.historic.standings as Row[]).find((r) => r.code === 'BAR') as Row
const PAL = ['#2f7fe0', '#e8792b', '#f2a900', '#1a9e4b', '#5a6472']

export default function SetPieces() {
  const gf = BAR.gf
  const types = goalTypes(gf)
  const intervals = goalIntervals(BAR.code, gf)
  const maxI = Math.max(...intervals.map((i) => i.value)) || 1
  const fn = shotFunnel(BAR.code, gf)

  return (
    <div>
      <div className="funnel">
        <div className="fcard"><div className="fv">{fn.totShots}</div><div className="fl">Total shots</div></div>
        <div className="fcard"><div className="fv">{fn.onT}</div><div className="fl">On target</div><div className="fp">{Math.round(fn.onT / fn.totShots * 100)}% of shots</div></div>
        <div className="fcard"><div className="fv">{fn.goals}</div><div className="fl">Goals</div><div className="fp">{Math.round(fn.goals / fn.totShots * 100)}% conversion</div></div>
      </div>
      <div className="two-col">
        <div className="panel">
          <div className="sec-title">Goal types</div>
          <div style={{ maxWidth: 160, margin: '4px auto 0' }}>
            <Donut size={160} centerValue={gf} centerLabel="GOALS" segments={types.map((t, i) => ({ label: t.label, value: t.value, color: PAL[i % PAL.length] }))} />
          </div>
        </div>
        <div className="panel">
          <div className="sec-title">Goals by interval</div>
          <div style={{ marginTop: 10 }}>
            <Bars items={intervals.map((i) => ({ label: `${i.label}'`, value: Math.round(i.value / maxI * 100) }))} />
          </div>
        </div>
      </div>
    </div>
  )
}
