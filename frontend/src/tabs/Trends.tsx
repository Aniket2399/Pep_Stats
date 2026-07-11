import { useState } from 'react'
import sample from '../data/sample.json'
import Line from '../components/charts/Line'
import { seriesTeam } from '../data/historicCharts'

interface Row { code: string; team: string; gf: number; ga: number; points: number; won: number; drawn: number; played: number }
const BAR = (sample.historic.standings as Row[]).find((r) => r.code === 'BAR') as Row

const METRICS: [string, string][] = [['goals', 'Goals'], ['xg', 'xG'], ['poss', 'Possession'], ['points', 'Points'], ['shots', 'Shots']]
const TITLE: Record<string, string> = {
  goals: 'Goals scored per matchweek', xg: 'Expected goals (xG) per matchweek',
  poss: 'Possession % per matchweek', points: 'Cumulative points', shots: 'Shots per matchweek',
}
const UNIT: Record<string, string> = { goals: '', xg: '', poss: '%', points: 'pts', shots: '' }

export default function Trends() {
  const [metric, setMetric] = useState('goals')
  const ser = seriesTeam(metric, BAR.code, BAR.gf, BAR.ga, BAR.points, BAR.won, BAR.drawn, BAR.played)
  const vals = ser.map((s) => s.v)
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length
  const u = UNIT[metric] ? ` ${UNIT[metric]}` : ''
  const cards: [string, string][] = metric === 'points'
    ? [['Final total', `${vals[vals.length - 1]} pts`], ['Per game', (vals[vals.length - 1] / vals.length).toFixed(2)], ['Matchweeks', `${vals.length}`]]
    : [['Average', `${avg.toFixed(1)}${u}`], ['Best', `${Math.max(...vals)}${u}`], ['Matchweeks', `${vals.length}`]]

  return (
    <div>
      <div className="sqhead">
        <div>
          <div className="sec-title">{TITLE[metric]}</div>
          <div className="sec-sub">FC Barcelona · La Liga 2014/15 · by matchweek</div>
        </div>
        <div className="chips">{METRICS.map(([k, l]) => <button key={k} className={`chip${metric === k ? ' on' : ''}`} onClick={() => setMetric(k)}>{l}</button>)}</div>
      </div>
      <div className="panel chart-panel" style={{ marginTop: 16 }}>
        <Line series={[{ name: metric, color: 'var(--accent)', values: vals }]} labels={ser.map((s) => s.label)} />
      </div>
      <div className="tcards">
        {cards.map(([l, v]) => <div key={l} className="fcard"><div className="fv">{v}</div><div className="fl">{l}</div></div>)}
      </div>
    </div>
  )
}
