import { useLiveMatches, useLiveFixtures, useLiveStandings } from '../hooks'
import MatchCard from '../components/MatchCard'
import StandingsTable from '../components/StandingsTable'
import Loading from '../components/Loading'
import ErrorState from '../components/ErrorState'
import Empty from '../components/Empty'
import SourceBadge from '../components/SourceBadge'

export default function LivePage() {
  const matches = useLiveMatches()
  const fixtures = useLiveFixtures()
  const standings = useLiveStandings()
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Live — World Cup 2026</h1><SourceBadge />
      </div>

      <section>
        <h2 className="font-semibold mb-2">Matches</h2>
        {matches.loading && <Loading />}
        {matches.error && <ErrorState error={matches.error} onRetry={matches.reload} />}
        {matches.data && (matches.data.length
          ? <div className="grid md:grid-cols-2 gap-3">{matches.data.map((m) => <MatchCard key={m.id} match={m} />)}</div>
          : <Empty message="No matches around now." />)}
      </section>

      {fixtures.data && fixtures.data.length > 0 && (
        <section><h2 className="font-semibold mb-2">Upcoming</h2>
          <div className="grid md:grid-cols-2 gap-3">{fixtures.data.map((f) => <MatchCard key={f.id} match={f} />)}</div>
        </section>
      )}

      <section>
        <h2 className="font-semibold mb-2">Group standings</h2>
        {standings.loading && <Loading />}
        {standings.error && <ErrorState error={standings.error} onRetry={standings.reload} />}
        {standings.data && (standings.data.length
          ? <StandingsTable rows={standings.data} />
          : <Empty message="No group standings yet." />)}
      </section>
    </div>
  )
}
