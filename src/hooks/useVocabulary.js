// src/hooks/useVocabulary.js
// Custom React hook to manage personal vocabulary notebook state, filters, SRS stats, and pagination
import { useState, useEffect, useCallback, useRef } from 'react';

const DEFAULT_LEVELS = { lv0: 0, lv1: 0, lv2: 0, lv3: 0, lv4: 0, lv5: 0 };

export function useVocabulary() {
  const [words, setWords] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState(null); // null = all, -1 = due, 0..5 = level
  const [topicId, setTopicId] = useState('');
  const [topics, setTopics] = useState([]);
  const [srsStats, setSrsStats] = useState({
    total: 0,
    due: 0,
    learning: 0,
    mastered: 0,
    memoryLevels: DEFAULT_LEVELS,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const debounceTimerRef = useRef(null);

  // Debounce search input
  const handleSearchChange = useCallback((val) => {
    setSearch(val);
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(val.trim());
      setPage(1);
    }, 300);
  }, []);

  const clearSearch = useCallback(() => {
    setSearch('');
    setDebouncedSearch('');
    setPage(1);
  }, []);

  // Fetch topics list
  const fetchTopics = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && window.HiDB && typeof window.HiDB.getTopics === 'function') {
        const data = await window.HiDB.getTopics();
        if (Array.isArray(data)) {
          setTopics(data);
        }
      }
    } catch (err) {
      console.warn('[useVocabulary] fetchTopics error:', err);
    }
  }, []);

  // Fetch SRS stats
  const fetchSrsStats = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && window.HiDB && typeof window.HiDB.getLearnedVocabStats === 'function') {
        const stats = await window.HiDB.getLearnedVocabStats();
        if (stats) {
          setSrsStats({
            total: stats.total || 0,
            due: stats.due || 0,
            learning: stats.learning || 0,
            mastered: stats.mastered || 0,
            memoryLevels: stats.memoryLevels || DEFAULT_LEVELS,
          });
        }
      }
    } catch (err) {
      console.warn('[useVocabulary] fetchSrsStats error:', err);
    }
  }, []);

  // Fetch vocabulary page
  const fetchWords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (typeof window !== 'undefined' && window.HiDB && typeof window.HiDB.getVocabularyPage === 'function') {
        const result = await window.HiDB.getVocabularyPage(page, pageSize, debouncedSearch, levelFilter, topicId || null);
        if (result) {
          setWords(result.words || []);
          setTotal(result.total || 0);
        }
      } else {
        setWords([]);
        setTotal(0);
      }
    } catch (err) {
      console.error('[useVocabulary] fetchWords error:', err);
      setError(err.message || 'Không thể tải danh sách từ vựng');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, levelFilter, topicId]);

  // Load initial topics and stats
  useEffect(() => {
    fetchTopics();
    fetchSrsStats();
  }, [fetchTopics, fetchSrsStats]);

  // Fetch words whenever filters change
  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  // Handle Level Filter Change
  const handleLevelFilterChange = useCallback((lvl) => {
    setLevelFilter(lvl);
    setPage(1);
  }, []);

  // Handle Topic Filter Change
  const handleTopicFilterChange = useCallback((tId) => {
    setTopicId(tId);
    setPage(1);
  }, []);

  // Delete word action
  const deleteWord = useCallback(
    async (wordId, wordText) => {
      if (!window.confirm(`Bạn có chắc chắn muốn xóa từ "${wordText}" khỏi Sổ từ cá nhân không?`)) {
        return;
      }
      try {
        if (typeof window !== 'undefined' && window.HiDB && typeof window.HiDB.deleteWord === 'function') {
          await window.HiDB.deleteWord(wordId);
          if (typeof window.showToast === 'function') {
            window.showToast(`Đã xóa từ "${wordText}"`, 'info');
          }
          await fetchWords();
          await fetchSrsStats();
        }
      } catch (err) {
        alert('Không thể xóa từ: ' + (err.message || 'Lỗi không xác định'));
      }
    },
    [fetchWords, fetchSrsStats]
  );

  // Audio play action
  const playWord = useCallback((wordText) => {
    if (!wordText) return;
    if (typeof window !== 'undefined' && window.HiAudio && typeof window.HiAudio.playWord === 'function') {
      window.HiAudio.playWord(wordText);
    } else if (typeof window !== 'undefined' && window.HiDict && typeof window.HiDict.playWordAudio === 'function') {
      window.HiDict.playWordAudio(wordText);
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(wordText);
      u.lang = 'en-US';
      window.speechSynthesis.speak(u);
    }
  }, []);

  return {
    words,
    total,
    page,
    setPage,
    pageSize,
    search,
    handleSearchChange,
    clearSearch,
    levelFilter,
    handleLevelFilterChange,
    topicId,
    handleTopicFilterChange,
    topics,
    srsStats,
    loading,
    error,
    deleteWord,
    playWord,
    refresh: () => {
      fetchWords();
      fetchSrsStats();
    },
  };
}

export default useVocabulary;
