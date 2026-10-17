import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../providers/AuthProvider.jsx';
import { getAccountProgressStats } from '../services/db.js';

const EMPTY_STATS = { streak: 0, wordCount: 0, masteredCount: 0 };

export function useProfileStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState(Boolean(user));
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    if (!user) {
      setStats(EMPTY_STATS);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const nextStats = await getAccountProgressStats();
      if (requestId !== requestIdRef.current) return;
      setStats({ ...EMPTY_STATS, ...nextStats });
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      console.warn('[useProfileStats] Failed to fetch account stats:', error);
      setStats(EMPTY_STATS);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();

    const handleStatsChanged = () => refresh();
    const events = [
      'hivocab:word-added',
      'hivocab:words-bulk-added',
      'hivocab:word-reviewed',
      'hi:topics-updated',
    ];
    events.forEach((eventName) => window.addEventListener(eventName, handleStatsChanged));

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, handleStatsChanged));
    };
  }, [refresh]);

  return { ...stats, loading, refresh };
}

export default useProfileStats;
