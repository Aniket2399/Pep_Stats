import Flag from '../components/Flag'
import type { WcGroup } from '../data/types'

export default function WcGroups({ groups }: { groups: WcGroup[] }) {
  return (
    <div className="grp-grid">
      {groups.map((g) => (
        <div key={g.group} className="panel grp-card">
          <div className="grp-h">{g.group}</div>
          <table className="ltable grp-t">
            <thead><tr><th className="lft">Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr></thead>
            <tbody>
              {g.table.map((r) => (
                <tr key={r.team} className={r.pos <= 2 ? 'qual' : ''}>
                  <td className="lft"><div className="team-cell"><Flag code={r.flag} /><span className="tc-name">{r.team}</span></div></td>
                  <td>{r.played}</td><td>{r.won}</td><td>{r.drawn}</td><td>{r.lost}</td><td>{r.gd}</td><td className="pts">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
