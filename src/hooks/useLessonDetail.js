// src/hooks/useLessonDetail.js
// Reactive Hook for Lesson & Passage Words Management in pure React
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getWordsInLesson,
  getWordsInPassage,
  getCamHierarchy,
  deleteWord as apiDeleteWord,
  checkProAccess,
  isUserPro as checkPro,
} from '../services/db.js';
import { playWordAudio } from '../services/sound.js';
import { useRoute } from '../router/RouteContext.jsx';

export const SRS_LEVEL_CONFIG = [
  { label: 'Mới', color: 'bg-surface-container text-outline' },
  { label: '1h', color: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300' },
  { label: '8h', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300' },
  { label: '1 ngày', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' },
  { label: '1 tuần', color: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300' },
  { label: '1 tháng', color: 'bg-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' },
];

export function useLessonDetail() {
  const [topicId, setTopicId] = useState(() => (typeof window !== 'undefined' ? window._currentTopicId : null));
  const [topicName, setTopicName] = useState(() => (typeof window !== 'undefined' ? window._currentTopicName || '—' : '—'));
  const [passageId, setPassageId] = useState(() => (typeof window !== 'undefined' ? window._currentPassageId : null));
  const [lessonIndex, setLessonIndex] = useState(() => (typeof window !== 'undefined' ? window._currentLessonIndex : null));
  const [lessonName, setLessonName] = useState(() => (typeof window !== 'undefined' ? window._currentLessonName || 'Lesson' : 'Lesson'));

  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUserPro, setIsUserPro] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'new', 'learning', 'mastered'

  const { navigateTo } = useRoute();

  // Restore state from sessionStorage if refreshed
  useEffect(() => {
    if ((!topicId || (!passageId && lessonIndex === null)) && typeof window !== 'undefined') {
      try {
        const saved = JSON.parse(sessionStorage.getItem('hi_current_lesson_state') || '{}');
        if (saved.topicId) {
          setTopicId(saved.topicId);
          setTopicName(saved.topicName || '—');
          setPassageId(saved.passageId);
          setLessonIndex(saved.lessonIndex);
          setLessonName(saved.lessonName || 'Lesson');
          window._currentTopicId = saved.topicId;
          window._currentTopicName = saved.topicName;
          window._currentPassageId = saved.passageId;
          window._currentLessonIndex = saved.lessonIndex;
          window._currentLessonName = saved.lessonName;
        }
      } catch (_) {}
    }
  }, [topicId, passageId, lessonIndex]);

  const loadWords = useCallback(async () => {
    if (!topicId && topicId !== 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const [proStatus, hasAccess] = await Promise.all([
        checkPro().catch(() => false),
        checkProAccess({ topicId, passageId, showModal: false }).catch(() => true),
      ]);
      setIsUserPro(proStatus);

      if (!hasAccess) {
        setError('PRO_REQUIRED');
        setLoading(false);
        return;
      }

      let fetched = [];
      if (passageId === '__unlinked__') {
        const hier = await getCamHierarchy(topicId);
        fetched = hier?.unlinkedWords || [];
      } else if (passageId) {
        fetched = await getWordsInPassage(passageId);
      } else {
        fetched = await getWordsInLesson(topicId, lessonIndex ?? 0);
      }

      const list = Array.isArray(fetched) ? fetched : [];
      setWords(list);
      if (typeof window !== 'undefined') {
        window._currentLessonWords = list;
        window._currentLessonWordsKey = passageId ? `passage:${passageId}` : `${topicId}::${lessonIndex ?? 0}`;
      }
    } catch (err) {
      console.error('[useLessonDetail] Error loading words:', err);
      setError(err?.message || 'Không thể tải danh sách từ vựng.');
    } finally {
      setLoading(false);
    }
  }, [topicId, passageId, lessonIndex]);

  useEffect(() => {
    loadWords();
  }, [loadWords]);

  // Overall Progress
  const progressPercent = useMemo(() => {
    if (!words || words.length === 0) return 0;
    const totalLevel = words.reduce((sum, w) => sum + (w.level || 0), 0);
    return Math.round((totalLevel / (words.length * 5)) * 100);
  }, [words]);

  // Filtered words by search and status
  const filteredWords = useMemo(() => {
    let result = words;

    if (statusFilter === 'new') {
      result = result.filter((w) => (w.level || 0) === 0);
    } else if (statusFilter === 'learning') {
      result = result.filter((w) => (w.level || 0) >= 1 && (w.level || 0) <= 4);
    } else if (statusFilter === 'mastered') {
      result = result.filter((w) => (w.level || 0) >= 5);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (w) =>
          (w.word || '').toLowerCase().includes(q) ||
          (w.meaning || '').toLowerCase().includes(q) ||
          (w.phonetic || '').toLowerCase().includes(q) ||
          (w.exampleSentence || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [words, statusFilter, searchQuery]);

  const handleDeleteWord = useCallback(async (wordId, wordText) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa từ "${wordText || 'này'}" không?`)) {
      return;
    }
    try {
      await apiDeleteWord(wordId);
      setWords((prev) => prev.filter((w) => (w.id || w.wordId) !== wordId));
      if (typeof window !== 'undefined' && typeof window.showHiToast === 'function') {
        window.showHiToast('Đã xóa từ vựng thành công.', 'success');
      }
    } catch (err) {
      alert('Không thể xóa từ: ' + (err?.message || err));
    }
  }, []);

  const handlePlayWord = useCallback((wordText) => {
    playWordAudio(wordText);
  }, []);

  const startPractice = useCallback((modeIndex) => {
    if (typeof window !== 'undefined' && typeof window.startSinglePractice === 'function') {
      window.startSinglePractice(modeIndex);
    }
  }, []);

  const startReading = useCallback(() => {
    if (typeof window !== 'undefined' && typeof window.startBilingualReading === 'function') {
      window.startBilingualReading(passageId);
    }
  }, [passageId]);

  return {
    topicId,
    topicName,
    passageId,
    lessonIndex,
    lessonName,
    words,
    filteredWords,
    loading,
    error,
    isUserPro,
    progressPercent,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    handleDeleteWord,
    handlePlayWord,
    startPractice,
    startReading,
    refresh: loadWords,
    goBack: () => navigateTo('topic-detail'),
  };
}

export default useLessonDetail;
