import { useParams, Link } from 'react-router-dom';
import { useMatchData } from '@hooks/useMatchData';
import MatchCard from '@components/MatchCard';

export default function LiveMatchPage() {
  const { id } = useParams();
  const matchId = id ? parseInt(id, 10) : undefined;
  const { match, events, loading, error } = useMatchData(matchId);

  return (
    <div className="min-h-screen bg-fifa-light">
      <div className="container py-8">
        <Link to="/" className="text-fifa-navy hover:underline">← Back to tournament</Link>

        {loading && <p className="text-gray-500 mt-6">Loading match…</p>}
        {error && <p className="text-red-600 mt-6">Could not load match: {error}</p>}
        {!loading && !error && !match && <p className="text-gray-500 mt-6">Match not found.</p>}

        {match && (
          <div className="mt-6 space-y-8">
            <MatchCard match={match} />

            <section>
              <h2 className="text-xl font-bold text-fifa-navy mb-3">Goals</h2>
              {events.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No goal-event detail available (not provided on the free data tier).
                </p>
              ) : (
                <ul className="space-y-2">
                  {events.map((e, i) => (
                    <li key={i} className="bg-white rounded border p-3 flex items-center gap-3">
                      <span className="font-bold text-fifa-navy w-12">{e.minute ? `${e.minute}'` : '—'}</span>
                      <span>⚽</span>
                      <span className="font-semibold">{e.player}</span>
                      <span className="text-gray-500 text-sm">({e.team})</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
