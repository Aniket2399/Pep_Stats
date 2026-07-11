import type { WcTeamMetric } from '../data/types'

export default function WcTeams({ teams }: { teams: WcTeamMetric[] }) {
  const anyDerived = teams.some((t) => t.derived)
  return (
    <div>
      <div className="sec-title">Team Metrics</div>
      {anyDerived && <div className="sec-sub" style={{ marginBottom: 12 }}>Ratings derived from real group standings (advanced metrics unavailable for WC 2026).</div>}
      <div className="team-grid">
        {teams.map((t) => (
          <div key={t.code} className="panel tcard">
            <div className="tc-top"><span className="tc-grp">#{t.rank}</span></div>
            <div className="tc-nm">{t.team}</div>
            <div className="tc-meta">
              <span className="tc-rank">{t.team_rating.toFixed(1)}</span>
              <span className="tc-str">xGF {t.xg_for} · xGA {t.xg_against}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
