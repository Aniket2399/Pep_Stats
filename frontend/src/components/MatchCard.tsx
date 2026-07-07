import type { LiveMatch, Fixture } from '../api/types'

export default function MatchCard({ match }: { match: LiveMatch | Fixture }) {
  const m = match as LiveMatch
  const live = m.status === 'LIVE'
  const scheduled = m.status === 'SCHEDULED' || !('status' in match)
  return (
    <div className="rounded border p-3 bg-white">
      {live && <div className="text-xs font-bold text-red-600 mb-1">🔴 LIVE {m.minute ? `${m.minute}'` : ''}</div>}
      <div className="flex items-center justify-between">
        <span className="font-medium">{match.home_flag} {match.home_team}</span>
        {scheduled
          ? <span className="text-xs text-slate-500">{new Date(match.kickoff).toLocaleString()}</span>
          : <span className="font-bold">{m.home_score} - {m.away_score}</span>}
        <span className="font-medium">{match.away_team} {match.away_flag}</span>
      </div>
      {match.stage && <div className="text-xs text-slate-400 mt-1 text-center">{match.stage}</div>}
    </div>
  )
}
