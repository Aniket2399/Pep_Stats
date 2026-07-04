import { MapPin, Clock } from 'lucide-react';
import type { Match } from '@hooks/useMatchData';

export default function MatchCard({ match }: { match: Match }) {
  const isLive = match.status === 'LIVE';
  return (
    <div className="bg-white rounded-lg border-2 border-fifa-light p-6">
      {isLive && (
        <span className="inline-flex items-center gap-1 text-red-600 font-bold text-sm mb-3">
          <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" /> LIVE {match.time}
        </span>
      )}
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <div className="text-4xl">{match.team1.flag}</div>
          <div className="font-bold text-fifa-navy">{match.team1.name}</div>
        </div>
        <div className="text-center px-4">
          {match.status === 'SCHEDULED'
            ? <div className="flex items-center gap-1 text-gray-500 text-sm"><Clock size={14} />{new Date(match.time).toLocaleString()}</div>
            : <div className="text-3xl font-bold text-fifa-navy">{match.team1.score} - {match.team2.score}</div>}
        </div>
        <div className="text-center flex-1">
          <div className="text-4xl">{match.team2.flag}</div>
          <div className="font-bold text-fifa-navy">{match.team2.name}</div>
        </div>
      </div>
      {match.stadium && (
        <div className="flex items-center justify-center gap-1 text-gray-500 text-sm mt-4">
          <MapPin size={14} /> {match.stadium}
        </div>
      )}
    </div>
  );
}
