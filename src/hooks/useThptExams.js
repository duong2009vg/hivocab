// src/hooks/useThptExams.js
// Fetch, cache, search và load điểm cao nhất cho danh sách đề thi THPT
// Tích hợp RPC get_thpt_exam_summaries đảm bảo Content Gating & hiển thị đầy đủ 38 đề cho Free users

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import {
  getLocalBestScoresMap,
  getLocalExamHistoryMap,
  fetchUserExamAttempts,
} from '../services/examHistoryService.js';

const EXAMS_CACHE_KEY = 'thpt_exams_summaries_v20261112_v3';

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
  const [bestScores, setBestScores] = useState(() => getLocalBestScoresMap());
  const [attemptHistoryMap, setAttemptHistoryMap] = useState(() => getLocalExamHistoryMap());

  // Load best scores & attempt history from localStorage + Supabase cloud
  const refreshBestScores = useCallback(async () => {
    setBestScores(getLocalBestScoresMap());
    setAttemptHistoryMap(getLocalExamHistoryMap());
    const synced = await fetchUserExamAttempts();
    if (synced) {
      setBestScores(synced.bestScores || {});
      setAttemptHistoryMap(synced.historyMap || {});
    }
  }, []);

  useEffect(() => {
    let active = true;
    const sync = async () => {
      const synced = await fetchUserExamAttempts();
      if (!active || !synced) return;
      setBestScores(synced.bestScores || {});
      setAttemptHistoryMap(synced.historyMap || {});
    };
    sync();
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      sync();
    });
    return () => {
      active = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Fetch exams list via RPC get_thpt_exam_summaries
  useEffect(() => {
    let cancelled = false;

    async function fetchExams() {
      // 1. Kiểm tra cache trong sessionStorage trước
      try {
        const cached = sessionStorage.getItem(EXAMS_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            if (!cancelled) {
              setExams(parsed);
              setLoading(false);
              return;
            }
          }
        }
      } catch (_) {}

      // 2. Gọi hàm RPC get_thpt_exam_summaries từ Supabase
      try {
        setLoading(true);
        setError(null);

        const { data: supaData, error: supaErr } = await supabase
          .rpc('get_thpt_exam_summaries');

        if (!supaErr && supaData && Array.isArray(supaData) && supaData.length > 0) {
          if (!cancelled) {
            const normalizedData = supaData.map((e) => ({
              ...e,
              duration_minutes: e.duration_minutes || e.time_limit || 50,
              time_limit: e.duration_minutes || e.time_limit || 50,
              is_pro: Boolean(e.is_pro),
            }));

            setExams(normalizedData);
            setLoading(false);
            try {
              sessionStorage.setItem(EXAMS_CACHE_KEY, JSON.stringify(normalizedData));
            } catch (_) {}
            return;
          }
        }

        if (supaErr) {
          throw new Error(supaErr.message || 'Không tải được danh sách đề thi từ máy chủ');
        }
        if (!cancelled) {
          setExams([]);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Không tải được danh sách đề thi');
          setLoading(false);
        }
      }
    }

    fetchExams();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filtered list based on search query
  const filteredExams = useMemo(() => {
    if (!searchQuery.trim()) return exams;
    const q = removeAccents(searchQuery.trim());
    return exams.filter((exam) =>
      removeAccents(exam.title || '').includes(q) ||
      removeAccents(String(exam.id || '')).includes(q)
    );
  }, [exams, searchQuery]);

  return {
    exams: filteredExams,
    allExams: exams,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    bestScores,
    attemptHistoryMap,
    refreshBestScores,
  };
}

export default useThptExams;
