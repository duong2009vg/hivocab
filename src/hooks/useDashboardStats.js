// src/hooks/useDashboardStats.js
// Custom hook to manage Dashboard state, stats, SRS memory distribution and refresh logic
import { useState, useEffect, useCallback } from 'react';

const DEFAULT_LEVELS = { lv0: 0, lv1: 0, lv2: 0, lv3: 0, lv4: 0, lv5: 0 };

export function useDashboardStats() {
  const [stats, setStats] = useState({
    wordsDueCount: 0,
    streak: 0,
    memoryLevels: DEFAULT_LEVELS,
    totalWordsLearned: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (typeof window !== 'undefined' && window.HiDashboard && typeof window.HiDashboard.refresh === 'function') {
        await window.HiDashboard.refresh();
      }

      if (typeof window !== 'undefined' && window.HiDB && typeof window.HiDB.getDashboardStats === 'function') {
        const rawStats = await window.HiDB.getDashboardStats();
        if (rawStats) {
          const mem = rawStats.memoryLevels || DEFAULT_LEVELS;
          const total = (mem.lv0 || 0) + (mem.lv1 || 0) + (mem.lv2 || 0) + (mem.lv3 || 0) + (mem.lv4 || 0) + (mem.lv5 || 0);
          setStats({
            wordsDueCount: rawStats.wordsDueCount || 0,
            streak: rawStats.streak || 0,
            memoryLevels: mem,
            totalWordsLearned: total,
          });
        }
      }
    } catch (err) {
      console.warn('[useDashboardStats] Failed to fetch stats:', err);
      setError(err.message || 'Không thể tải thống kê');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
  };
}

export default useDashboardStats;
