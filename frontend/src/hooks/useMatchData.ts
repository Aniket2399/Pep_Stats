import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { ENDPOINTS } from '@config/api';

export interface Match {
  id: number;
  team1: {
    name: string;
    flag: string;
    score: number;
    possession: number;
    shots: number;
    shotsOnTarget: number;
  };
  team2: {
    name: string;
    flag: string;
    score: number;
    possession: number;
    shots: number;
    shotsOnTarget: number;
  };
  time: string;
  stadium: string;
  status: 'LIVE' | 'SCHEDULED' | 'FINISHED';
}

export function useMatchData(matchId?: number) {
  const [match, setMatch] = useState<Match | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatch = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch match details
      const matchRes = await axios.get(ENDPOINTS.match(id), {
        timeout: 10000,
      });

      setMatch(matchRes.data);

      // Fetch stats
      const statsRes = await axios.get(ENDPOINTS.matchStats(id), {
        timeout: 10000,
      });

      setStats(statsRes.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch match data';
      setError(message);
      console.error('Error fetching match:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (matchId) {
      fetchMatch(matchId);
    }
  }, [matchId, fetchMatch]);

  return {
    match,
    stats,
    loading,
    error,
    refetch: () => matchId && fetchMatch(matchId),
  };
}

export default useMatchData;
