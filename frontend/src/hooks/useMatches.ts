import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { ENDPOINTS } from '@config/api';
import type { Match } from './useMatchData';

interface MatchesBundle {
  live: Match[];
  upcoming: Match[];
  recent: Match[];
}

export function useMatches() {
  const [bundle, setBundle] = useState<MatchesBundle>({ live: [], upcoming: [], recent: [] });
  const [source, setSource] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    try {
      setError(null);
      const res = await axios.get(ENDPOINTS.matches, { timeout: 10000 });
      setBundle(res.data.data);
      setSource(res.data.source);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch matches');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
    const t = setInterval(fetchMatches, 45000);
    return () => clearInterval(t);
  }, [fetchMatches]);

  return { ...bundle, source, loading, error };
}

export default useMatches;
