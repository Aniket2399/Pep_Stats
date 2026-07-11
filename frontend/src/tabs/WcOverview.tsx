import Flag from '../components/Flag'
import Scatter from '../components/charts/Scatter'
import Bars from '../components/charts/Bars'
import type { WcMatch, WcTeamMetric, WcGroup } from '../data/types'

function Kpi({ val, label }: { val: string | number; label: string }) {
  return <div className="kpi"><div className="kpi-val" style={{ fontSize: 20 }}>{val}</div><div className="kpi-label">{label}</div></div>
}

function MatchCard({ m }: { m: WcMatch }) {
  return (
    <div className="mcard">
      <div className="mc-top"><div className="mc-comp">{m.stage ?? 'World Cup 2026'}</div>
        <div className="mc-meta"><span>{m.status}</span></div></div>
      <div className="mc-body">
        <div className="mc-team"><Flag code={m.home_flag} /><span className="mc-tn">{m.home_team}</span><span className="mc-sc">{m.home_score ?? '-'}</span></div>
        <div className="mc-team"><Flag code={m.away_flag} /><span className="mc-tn">{m.away_team}</span><span className="mc-sc">{m.away_score ?? '-'}</span></div>
      </div>
    </div>
  )
}

export default function WcOverview(
  { matches, fixtures, teams, groups }:
  { matches: WcMatch[]; fixtures: WcMatch[]; teams: WcTeamMetric[]; groups: WcGroup[] },
) {
  const rows = groups.flatMap((g) => g.table)
  const totalGoals = rows.reduce((s, r) => s + r.gf, 0)
  const groupMatches = Math.round(rows.reduce((s, r) => s + r.played, 0) / 2)
  const byRating = [...teams].sort((a, b) => b.team_rating - a.team_rating)
  const byXg = [...teams].sort((a, b) => b.xg_for - a.xg_for)
  const topScorer = [...rows].sort((a, b) => b.gf - a.gf)[0]

  // xG created vs conceded scatter — label the top-6 rated sides only.
  const topCodes = new Set(byRating.slice(0, 6).map((t) => t.code))
  const points = teams.map((t) => ({ x: t.xg_for, y: t.xg_against, label: topCodes.has(t.code) ? t.code : '' }))
  // goals scored per group
  const groupGoals = groups.map((g) => ({ label: g.group.replace('Group ', ''), value: g.table.reduce((s, r) => s + r.gf, 0) }))
  const maxGG = Math.max(...groupGoals.map((x) => x.value)) || 1

  return (
    <div>
      <div className="wc-hero">
        <div>
          <div className="wc-eyebrow">FIFA WORLD CUP 2026 · UNITED 26</div>
          <div className="wc-h1">Tournament Analytics</div>
          <div className="wc-h2">48 teams · live results, group form &amp; attack/defense profiles</div>
        </div>
        <div className="wc26-lockup" style={{ marginBottom: 0 }}>
          <img className="wc-trophy-img" src="/wc-trophy.jpg" alt="FIFA World Cup trophy" style={{ borderRadius: 12 }} />
          <div className="wc26-wm wm-c">FIFA WORLD CUP<span className="wc26-yr">2026</span></div>
        </div>
      </div>

      <div className="kpi-strip">
        <Kpi val="48" label="Teams" />
        <Kpi val={groups.length} label="Groups" />
        <Kpi val={groupMatches} label="Group Matches" />
        <Kpi val={totalGoals} label="Group Goals" />
        <Kpi val={byXg[0]?.code ?? '—'} label="Top xG Side" />
        <Kpi val={byRating[0]?.team ?? '—'} label="Top Rated" />
      </div>

      <div className="two-col" style={{ marginTop: 16 }}>
        <div className="panel">
          <div className="sec-title">Attack vs Defense</div>
          <div className="sec-sub">xG created / match → · xG conceded / match ↑ (top sides labelled)</div>
          <Scatter points={points} xLabel="xG created / match →" yLabel="xG conceded / match →" />
        </div>
        <div className="panel">
          <div className="sec-title">Goals by group</div>
          <div className="sec-sub">Top scorers: {topScorer?.team} ({topScorer?.gf})</div>
          <div style={{ marginTop: 10 }}>
            <Bars items={groupGoals.map((g) => ({ label: `Group ${g.label}`, value: Math.round((g.value / maxGG) * 100) }))} />
          </div>
        </div>
      </div>

      <div className="sec-title" style={{ margin: '18px 0 10px' }}>Latest results</div>
      {matches.length
        ? <div className="match-grid">{matches.map((m) => <MatchCard key={m.id} m={m} />)}</div>
        : <div className="panel">No matches right now.</div>}

      {fixtures.length > 0 && (
        <div className="panel" style={{ marginTop: 16 }}>
          <div className="sec-title">Upcoming</div>
          {fixtures.map((f) => (
            <div className="fxrow" key={f.id}>
              <div className="fx-teams"><Flag code={f.home_flag} size={18} /><span className="fx-n">{f.home_team}</span>
                <span className="fx-v">v</span><span className="fx-n">{f.away_team}</span><Flag code={f.away_flag} size={18} /></div>
              <div className="fx-meta"><div className="fx-round">{f.stage ?? ''}</div><div className="fx-date">{f.kickoff}</div></div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
