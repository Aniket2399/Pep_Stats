import { crestStyle } from '../data/kits'
import type { HistoricStanding } from '../data/types'

function zone(pos: number, total: number): string {
  if (pos <= 4) return 'z-ucl'
  if (pos <= 6) return 'z-eur'
  if (pos > total - 3) return 'z-rel'
  return ''
}

export default function Standings({ rows }: { rows: HistoricStanding[] }) {
  return (
    <div className="panel">
      <div className="sec-title">La Liga 2015/16 — Table</div>
      <div className="sec-sub">Real StatsBomb season · sorted by points</div>
      <table className="ltable" style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th className="lft">#</th><th className="lft">Team</th>
            <th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.code + r.team}>
              <td className="pos"><span className={`zbar ${zone(r.pos, rows.length)}`} />{r.pos}</td>
              <td className="lft"><div className="team-cell"><span className="badge" style={crestStyle(r.code)}>{r.code}</span><span className="tc-name">{r.team}</span></div></td>
              <td>{r.played}</td><td>{r.won}</td><td>{r.drawn}</td><td>{r.lost}</td>
              <td>{r.gf}</td><td>{r.ga}</td><td>{r.gd}</td><td className="pts">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
