import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { ENDPOINTS } from '@config/api';

export interface Team {
  name: string;
  flag: string;
  score: number;
}

export interface Match {
  id: number;
  team1: Team;
  team2: Team;
  time: string;
  stadium: string | null;
  status: 'LIVE' | 'SCHEDULED' | 'FINISHED';
}

export interface GoalEvent {
  minute: number | null;
  type: string;
  team: string;
  player: string;
}

export function useMatchData(matchId?: number) {
  const [match, setMatch] = useState<Match | null>(null);
  const [events, setEvents] = useState<GoalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatch = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const [matchRes, evRes] = await Promise.all([
        axios.get(ENDPOINTS.match(id), { timeout: 10000 }),
        axios.get(ENDPOINTS.matchEvents(id), { timeout: 10000 }),
      ]);
      const m = matchRes.data.data;
      setMatch(m && m.id ? m : null);
      setEvents(evRes.data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch match data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!matchId) { setLoading(false); setMatch(null); return; }
    fetchMatch(matchId);
  }, [matchId, fetchMatch]);

  // Poll every 30s while the match is live
  useEffect(() => {
    if (!matchId || match?.status !== 'LIVE') return;
    const t = setInterval(() => fetchMatch(matchId), 30000);
    return () => clearInterval(t);
  }, [matchId, match?.status, fetchMatch]);

  return { match, events, loading, error, refetch: () => matchId && fetchMatch(matchId) };
}

export default useMatchData;
