// src/hooks/useTopicDetail.js
// Reactive Hook for Topic Detail & Lessons/Passages Management in pure React
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getCamHierarchy, getLessonsInTopic, isUserPro as checkPro, checkProAccess, getCachedTopics } from '../services/db.js';
import { supabase } from '../lib/supabaseClient.js';
import { useRoute } from '../router/RouteContext.jsx';

export function useTopicDetail() {
  const [topicId, setTopicId] = useState(() => (typeof window !== 'undefined' ? window._currentTopicId : null));
  const [topicName, setTopicName] = useState(() => (typeof window !== 'undefined' ? window._currentTopicName || '—' : '—'));
  const [category, setCategory] = useState(() => (typeof window !== 'undefined' ? window._currentCategory || 'general' : 'general'));

  const [camHierarchy, setCamHierarchy] = useState(() => {
    if (typeof window !== 'undefined' && window._camHierarchy && window._currentTopicId === window._camHierarchy.topicId) {
      return window._camHierarchy;
    }
    return null;
  });
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [lessons, setLessons] = useState(() => {
    if (typeof window !== 'undefined' && window._lessonsCache && window._currentTopicId && window._lessonsCache[window._currentTopicId]) {
      return window._lessonsCache[window._currentTopicId];
    }
    return [];
  });
  const [loading, setLoading] = useState(() => {
    const hasCam = typeof window !== 'undefined' && window._camHierarchy && window._currentTopicId === window._camHierarchy.topicId;
    const hasLessons = typeof window !== 'undefined' && window._lessonsCache && window._currentTopicId && window._lessonsCache[window._currentTopicId]?.length > 0;
    return !hasCam && !hasLessons;
  });
  const [error, setError] = useState(null);
  const [isUserPro, setIsUserPro] = useState(() => (typeof window !== 'undefined' ? Boolean(window._isUserPro) : false));

  const { navigateTo } = useRoute();

  // Restore topicId and category from sessionStorage if refreshed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = JSON.parse(sessionStorage.getItem('hi_current_lesson_state') || '{}');
        if (!topicId && saved.topicId) {
          setTopicId(saved.topicId);
          setTopicName(saved.topicName || '—');
          if (saved.category) setCategory(saved.category);
          window._currentTopicId = saved.topicId;
          window._currentTopicName = saved.topicName;
          if (saved.category) window._currentCategory = saved.category;
        } else if (topicId && saved.topicId === topicId && saved.category) {
          setCategory(saved.category);
          window._currentCategory = saved.category;
        }
      } catch (_) {}
    }
  }, [topicId]);

  const loadTopicData = useCallback(async () => {
    if (!topicId) {
      setLoading(false);
      return;
    }
    if (!camHierarchy && lessons.length === 0) {
      setLoading(true);
    }
    setError(null);

    // Sync topic category & name from cache or DB if available
    try {
      let resolvedCat = typeof window !== 'undefined' ? window._currentCategory : null;
      let resolvedName = typeof window !== 'undefined' ? window._currentTopicName : null;
      const cachedTopic = getCachedTopics()?.find((t) => t.id === topicId);
      if (cachedTopic) {
        if (cachedTopic.category) resolvedCat = cachedTopic.category;
        if (cachedTopic.name) resolvedName = cachedTopic.name;
      } else {
        const { data: tRow } = await supabase.from('topics').select('name, category').eq('id', topicId).maybeSingle();
        if (tRow) {
          if (tRow.category) resolvedCat = tRow.category;
          if (tRow.name) resolvedName = tRow.name;
        }
      }
      if (resolvedCat) {
        setCategory(resolvedCat);
        if (typeof window !== 'undefined') window._currentCategory = resolvedCat;
      }
      if (resolvedName && resolvedName !== '—') {
        setTopicName(resolvedName);
        if (typeof window !== 'undefined') window._currentTopicName = resolvedName;
      }
    } catch (_) {}

    try {
      const [proStatus, hier] = await Promise.all([
        checkPro().catch(() => false),
        getCamHierarchy(topicId).catch(() => null),
      ]);
      setIsUserPro(proStatus);
      if (typeof window !== 'undefined') {
        window._isUserPro = proStatus;
      }

      // TRƯỜNG HỢP 1: Chế độ Cambridge IELTS (Có phân cấp Test -> Passage)
      if (hier && hier.tests && hier.tests.length > 0) {
        setCamHierarchy(hier);
        setLessons([]);
        if (typeof window !== 'undefined') {
          window._camHierarchy = hier;
        }
      } else {
        // TRƯỜNG HỢP 2: Chủ đề Non-CAM (Oxford, Destination, IELTS...)
        setCamHierarchy(null);
        const nonCamLessons = await getLessonsInTopic(topicId);
        setLessons(nonCamLessons || []);
        if (typeof window !== 'undefined') {
          window._lessonsCache = window._lessonsCache || {};
          window._lessonsCache[topicId] = nonCamLessons;
        }
      }
    } catch (err) {
      console.error('[useTopicDetail] Error loading topic details:', err);
      setError(err?.message || 'Không thể tải nội dung bài học.');
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    loadTopicData();

    const handleRefresh = (e) => {
      if (e?.detail?.topicId && String(e.detail.topicId) !== String(topicId)) return;
      if (typeof window !== 'undefined' && window._lessonsCache && topicId) {
        delete window._lessonsCache[topicId];
      }
      loadTopicData();
    };

    window.addEventListener('hi:topics-updated', handleRefresh);
    window.addEventListener('hivocab:words-bulk-added', handleRefresh);
    return () => {
      window.removeEventListener('hi:topics-updated', handleRefresh);
      window.removeEventListener('hivocab:words-bulk-added', handleRefresh);
    };
  }, [loadTopicData, topicId]);

  const isCambridge = Boolean(camHierarchy && camHierarchy.tests && camHierarchy.tests.length > 0);

  // Cambridge Stats
  const camStats = useMemo(() => {
    if (!camHierarchy || !camHierarchy.tests) {
      return { totalTests: 0, totalPassages: 0, totalWords: 0 };
    }
    const totalTests = camHierarchy.tests.length;
    const totalPassages = camHierarchy.tests.reduce((sum, t) => sum + (t.passages?.length || 0), 0);
    const totalWords = camHierarchy.totalWords || 0;
    return { totalTests, totalPassages, totalWords };
  }, [camHierarchy]);

  // Passages in active test
  const currentPassages = useMemo(() => {
    if (!isCambridge) return [];
    const test = camHierarchy.tests[currentTestIndex] || camHierarchy.tests[0];
    return test?.passages || [];
  }, [isCambridge, camHierarchy, currentTestIndex]);

  // Non-CAM Stats
  const nonCamTotalWords = useMemo(() => {
    return lessons.reduce((sum, l) => sum + (l.totalWords || 0), 0);
  }, [lessons]);

  // Actions
  const openPassage = useCallback(async (passage, testName) => {
    const hasAccess = await checkProAccess({ topicId, passageId: passage.id });
    if (!hasAccess) return;

    if (typeof window !== 'undefined') {
      const activeTest = camHierarchy?.tests[currentTestIndex];
      window._currentTopicId = topicId;
      window._currentPassageId = passage.id;
      window._currentTestId = activeTest?.id || null;
      window._currentTestName = testName || activeTest?.name || 'Test';
      window._currentPassageNumber = passage.passageNumber;
      window._currentPassageTitle = passage.title;
      window._currentTopicLabel = passage.topicLabel;
      window._currentLessonIndex = null;
      window._currentLessonName = `Passage ${passage.passageNumber}: ${passage.title}`;
      window._currentLessonWords = [];
      window._currentLessonWordsKey = null;

      try {
        sessionStorage.setItem('hi_current_lesson_state', JSON.stringify({
          topicId,
          passageId: passage.id,
          testId: activeTest?.id,
          passageNumber: passage.passageNumber,
          passageTitle: passage.title,
          topicLabel: passage.topicLabel,
          testName: testName || activeTest?.name,
          topicName,
          lessonName: window._currentLessonName,
        }));
      } catch (_) {}
    }

    navigateTo('lesson-detail');
  }, [camHierarchy, currentTestIndex, topicId, topicName, navigateTo]);

  const openUnlinkedWords = useCallback(async () => {
    const hasAccess = await checkProAccess({ topicId });
    if (!hasAccess) return;

    if (typeof window !== 'undefined') {
      window._currentTopicId = topicId;
      window._currentPassageId = '__unlinked__';
      window._currentTestId = null;
      window._currentTestName = null;
      window._currentPassageNumber = null;
      window._currentPassageTitle = 'Từ vựng tự thêm / Bổ sung';
      window._currentTopicLabel = 'Từ người dùng tự lưu';
      window._currentLessonIndex = null;
      window._currentLessonName = 'Từ vựng tự thêm / Bổ sung';
      window._currentLessonWords = [];
      window._currentLessonWordsKey = null;

      try {
        sessionStorage.setItem('hi_current_lesson_state', JSON.stringify({
          topicId,
          passageId: '__unlinked__',
          testId: null,
          passageNumber: null,
          passageTitle: 'Từ vựng tự thêm / Bổ sung',
          topicLabel: 'Từ người dùng tự lưu',
          testName: null,
          topicName,
          lessonName: window._currentLessonName,
        }));
      } catch (_) {}
    }

    navigateTo('lesson-detail');
  }, [topicId, topicName, navigateTo]);

  const openLesson = useCallback(async (lessonOrId) => {
    const hasAccess = await checkProAccess({ topicId });
    if (!hasAccess) return;

    let lesson = null;
    if (typeof lessonOrId === 'object' && lessonOrId !== null) {
      lesson = lessonOrId;
    } else if (typeof lessonOrId === 'string') {
      lesson = lessons.find((l) => l.id === lessonOrId);
      if (!lesson) {
        const parts = lessonOrId.split('-');
        const lastPart = parts[parts.length - 1];
        const parsedIdx = parseInt(lastPart, 10);
        if (!isNaN(parsedIdx)) {
          lesson = { index: parsedIdx, name: `Lesson ${parsedIdx + 1}`, progress: 0 };
        }
      }
    }

    if (!lesson) {
      lesson = { index: 0, name: 'Lesson 1', progress: 0 };
    }

    const idx = typeof lesson.index === 'number' ? lesson.index : 0;
    const name = lesson.name || `Lesson ${idx + 1}`;
    const prog = Math.round(lesson.progress || 0);

    if (typeof window !== 'undefined') {
      window._currentTopicId = topicId;
      window._currentPassageId = null;
      window._currentTestId = null;
      window._currentTestName = null;
      window._currentPassageNumber = null;
      window._currentPassageTitle = null;
      window._currentTopicLabel = null;
      window._currentLessonIndex = idx;
      window._currentLessonName = name;
      window._currentLessonProgress = prog;
      window._currentLessonWords = [];
      window._currentLessonWordsKey = null;

      try {
        sessionStorage.setItem('hi_current_lesson_state', JSON.stringify({
          topicId,
          passageId: null,
          testId: null,
          passageNumber: null,
          passageTitle: null,
          topicLabel: null,
          testName: null,
          topicName,
          lessonName: name,
          lessonIndex: idx,
          lessonProgress: prog,
        }));
      } catch (_) {}
    }

    navigateTo('lesson-detail');
  }, [topicId, topicName, lessons, navigateTo]);

  const startPractice = useCallback((modeIndex) => {
    if (typeof window !== 'undefined' && typeof window.startSinglePractice === 'function') {
      window.startSinglePractice(modeIndex);
    }
  }, []);

  const startReading = useCallback((passageId) => {
    // Set passageId context for React's useBilingualReading hook to pick up
    if (passageId && typeof window !== 'undefined') {
      window._currentPassageId = passageId;
    }
    // Navigate via React router (safe for React DOM) instead of legacy window fn
    navigateTo('bilingual-reading');
  }, [navigateTo]);


  return {
    topicId,
    topicName,
    category,
    loading,
    error,
    isUserPro,
    isCambridge,
    camHierarchy,
    camStats,
    currentTestIndex,
    setCurrentTestIndex,
    currentPassages,
    lessons,
    nonCamTotalWords,
    openPassage,
    openUnlinkedWords,
    openLesson,
    startPractice,
    startReading,
    refresh: loadTopicData,
  };
}

export default useTopicDetail;
