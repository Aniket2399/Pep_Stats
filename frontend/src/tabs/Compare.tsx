import { useState } from 'react'
import sample from '../data/sample.json'
import RadarCompare from '../components/charts/RadarCompare'
import { TEAM_AXES, RADAR_A, RADAR_B, teamRadar, teamStats } from '../data/historicRadar'

interface Row { code: string; team: string; won: number; gf: number; ga: number; gd: number; points: number; played: number }
const S = sample.historic.standings as Row[]

export default function Compare() {
  const [a, setA] = useState(S[0].code)
  const [b, setB] = useState(S[1].code)
  const ra = S.find((r) => r.code === a) ?? S[0]
  const rb = S.find((r) => r.code === b) ?? S[1]

  const radA = teamRadar(ra.code, ra.gf, ra.ga, ra.points)
  const radB = teamRadar(rb.code, rb.gf, rb.ga, rb.points)
  const sa = teamStats(ra.code, ra.gf, ra.ga, ra.points, ra.won, ra.played)
  const sb = teamStats(rb.code, rb.gf, rb.ga, rb.points, rb.won, rb.played)

  const rows = [
    { label: 'Points', a: sa.Pts, b: sb.Pts, fa: `${sa.Pts}`, fb: `${sb.Pts}`, lower: false },
    { label: 'Goals for', a: sa.GF, b: sb.GF, fa: `${sa.GF}`, fb: `${sb.GF}`, lower: false },
    { label: 'Goals against', a: sa.GA, b: sb.GA, fa: `${sa.GA}`, fb: `${sb.GA}`, lower: true },
    { label: 'Goal diff', a: sa.GD, b: sb.GD, fa: `${sa.GD > 0 ? '+' : ''}${sa.GD}`, fb: `${sb.GD > 0 ? '+' : ''}${sb.GD}`, lower: false },
    { label: 'Win %', a: sa.winpct, b: sb.winpct, fa: `${sa.winpct}%`, fb: `${sb.winpct}%`, lower: false },
    { label: 'Possession', a: sa.poss, b: sb.poss, fa: `${sa.poss}%`, fb: `${sb.poss}%`, lower: false },
    { label: 'xG', a: sa.xg, b: sb.xg, fa: `${sa.xg}`, fb: `${sb.xg}`, lower: false },
  ]

  return (
    <div>
      <div className="cmpctl">
        <select className="sel" value={a} onChange={(e) => setA(e.target.value)}>
          {S.map((r) => <option key={r.code} value={r.code}>{r.team}</option>)}
        </select>
        <div className="cmp-label" style={{ alignSelf: 'center' }}>Team vs Team</div>
        <select className="sel" value={b} onChange={(e) => setB(e.target.value)}>
          {S.map((r) => <option key={r.code} value={r.code}>{r.team}</option>)}
        </select>
      </div>

      <div className="panel chart-panel">
        <div className="radar-wrap">
          <RadarCompare axes={TEAM_AXES} a={radA} b={radB} colorA={RADAR_A} colorB={RADAR_B} />
          <div>
            <div className="rlegend" style={{ justifyContent: 'flex-start', marginBottom: 14 }}>
              <span className="rl"><span className="rl-sw" style={{ background: RADAR_A }} />{ra.team}</span>
              <span className="rl"><span className="rl-sw" style={{ background: RADAR_B }} />{rb.team}</span>
            </div>
            {rows.map((r) => {
              const aWin = r.lower ? r.a < r.b : r.a > r.b
              const bWin = r.lower ? r.b < r.a : r.b > r.a
              return (
                <div className="cmp-row" key={r.label}>
                  <div className={`cmp-a cmp-val ${aWin ? 'win' : ''}`}>{r.fa}</div>
                  <div className="cmp-label">{r.label}</div>
                  <div className={`cmp-val ${bWin ? 'win' : ''}`}>{r.fb}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
