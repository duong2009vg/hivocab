// src/hooks/useThptExams.js
// Fetch, cache, search và load điểm cao nhất cho danh sách đề thi THPT

import { useState, useEffect, useCallback, useMemo } from 'react';

const EXAMS_CACHE_KEY = 'thpt_exams_cache_v20260929';
const BEST_SCORES_KEY = 'thpt_best_scores';

function removeAccents(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

export function useThptExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [bestScores, setBestScores] = useState({});

  // Load best scores from localStorage
  useEffect(() => {
    try {
      const str = localStorage.getItem(BEST_SCORES_KEY);
      setBestScores(str ? JSON.parse(str) : {});
    } catch (_) {
      setBestScores({});
    }
  }, []);

  // Fetch exams list, with memory+localStorage cache
  useEffect(() => {
    let cancelled = false;

    async function fetchExams() {
      // 1. Try localStorage cache first (instant)
      try {
        const cached = sessionStorage.getItem(EXAMS_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (!cancelled) {
            setExams(parsed);
            setLoading(false);
            return;
          }
        }
      } catch (_) {}

      // 2. Fetch from network
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('data/thpt_exams.json?v=20260929');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setExams(data);
          setLoading(false);
          // Cache in sessionStorage so revisiting the page is instant
          try {
            sessionStorage.setItem(EXAMS_CACHE_KEY, JSON.stringify(data));
          } catch (_) {} // quota exceeded is fine
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Không tải được danh sách đề thi');
          setLoading(false);
        }
      }
    }

    fetchExams();
    return () => { cancelled = true; };
  }, []);

  // Filtered list based on search query
  const filteredExams = useMemo(() => {
    if (!searchQuery.trim()) return exams;
    const q = removeAccents(searchQuery.trim());
    return exams.filter(exam =>
      removeAccents(exam.title || '').includes(q) ||
      removeAccents(String(exam.id || '')).includes(q)
    );
  }, [exams, searchQuery]);

  // Refresh best scores (called after submitting an exam)
  const refreshBestScores = useCallback(() => {
    try {
      const str = localStorage.getItem(BEST_SCORES_KEY);
      setBestScores(str ? JSON.parse(str) : {});
    } catch (_) {}
  }, []);

  return {
    exams: filteredExams,
    allExams: exams,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    bestScores,
    refreshBestScores,
  };
}
