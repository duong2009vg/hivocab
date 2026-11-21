// src/services/examHistoryService.js
// Lưu trữ & đồng bộ lịch sử làm bài (38 đề trường sở, 10 đề dự đoán & 29 chuyên đề)
import { supabase } from '../lib/supabaseClient.js';

const BEST_SCORES_KEY = 'thpt_best_scores';
const ATTEMPT_HISTORY_KEY = 'thpt_attempt_history_v1';
const MAX_LOCAL_ATTEMPTS_PER_EXAM = 25;

function readJsonMap(key) {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeJsonMap(key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (_) {}
}

function normalizeAttempt(row) {
  if (!row || typeof row !== 'object') return null;
  const submittedAt = row.submitted_at || row.submittedAt || new Date().toISOString();
  const ts = typeof submittedAt === 'number' ? submittedAt : new Date(submittedAt).getTime();
  return {
    id: row.id || `local-${ts}-${Math.random().toString(36).slice(2, 7)}`,
    examId: row.exam_id || row.examId || '',
    title: row.exam_title || row.title || '',
    isExercise: Boolean(row.is_exercise ?? row.isExercise),
    score: Number(row.score || 0),
    correct: Number(row.correct_count ?? row.correct ?? 0),
    total: Number(row.total_questions ?? row.total ?? 0),
    percentage: Number(row.percentage || 0),
    timeSpentSeconds: Number(row.time_spent_seconds ?? row.timeSpentSeconds ?? 0),
    durationMinutes: Number(row.duration_minutes ?? row.durationMinutes ?? 50),
    details: row.details || null,
    submittedAt: Number.isFinite(ts) ? ts : Date.now(),
  };
}

export function getLocalExamHistoryMap() {
  const raw = readJsonMap(ATTEMPT_HISTORY_KEY);
  const out = {};
  for (const [examId, list] of Object.entries(raw)) {
    if (!Array.isArray(list)) continue;
    out[examId] = list.map(normalizeAttempt).filter(Boolean).sort((a, b) => b.submittedAt - a.submittedAt);
  }
  return out;
}

export function getLocalBestScoresMap() {
  const best = readJsonMap(BEST_SCORES_KEY);
  const historyMap = getLocalExamHistoryMap();
  const merged = { ...best };
  for (const [examId, list] of Object.entries(historyMap)) {
    for (const att of list) {
      const prev = merged[examId];
      if (!prev || att.score > prev.score) {
        merged[examId] = {
          score: att.score,
          correct: att.correct,
          total: att.total,
          percentage: att.percentage,
          date: att.submittedAt,
        };
      }
    }
  }
  return merged;
}

export async function recordExamAttempt(attemptInput) {
  const att = normalizeAttempt({
    ...attemptInput,
    submittedAt: attemptInput?.submittedAt || Date.now(),
  });
  if (!att || !att.examId) return null;

  // 1. Update local attempt history cache
  try {
    const historyMap = getLocalExamHistoryMap();
    const prevList = Array.isArray(historyMap[att.examId]) ? historyMap[att.examId] : [];
    const nextList = [att, ...prevList].slice(0, MAX_LOCAL_ATTEMPTS_PER_EXAM);
    historyMap[att.examId] = nextList;
    writeJsonMap(ATTEMPT_HISTORY_KEY, historyMap);

    const best = readJsonMap(BEST_SCORES_KEY);
    const prevBest = best[att.examId];
    if (!prevBest || att.score >= prevBest.score) {
      best[att.examId] = {
        score: att.score,
        correct: att.correct,
        total: att.total,
        percentage: att.percentage,
        date: att.submittedAt,
      };
      writeJsonMap(BEST_SCORES_KEY, best);
    }
  } catch (_) {}

  // 2. Sync to Supabase if authenticated
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id) {
      const { error } = await supabase.from('user_exam_attempts').insert({
        user_id: user.id,
        exam_id: att.examId,
        exam_title: att.title || att.examId,
        is_exercise: att.isExercise,
        score: att.score,
        correct_count: att.correct,
        total_questions: att.total,
        percentage: att.percentage,
        time_spent_seconds: att.timeSpentSeconds,
        duration_minutes: att.durationMinutes,
        details: att.details || null,
        submitted_at: new Date(att.submittedAt).toISOString(),
      });
      if (error) {
        console.warn('[examHistoryService] Supabase insert warning:', error.message);
      }
    }
  } catch (_) {}

  return att;
}

export async function fetchUserExamAttempts(examId = null) {
  const localMap = getLocalExamHistoryMap();
  const localBest = getLocalBestScoresMap();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return {
        authenticated: false,
        historyMap: examId ? { [examId]: localMap[examId] || [] } : localMap,
        bestScores: localBest,
      };
    }

    let query = supabase
      .from('user_exam_attempts')
      .select(
        'id, exam_id, exam_title, is_exercise, score, correct_count, total_questions, percentage, time_spent_seconds, duration_minutes, details, submitted_at'
      )
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })
      .limit(examId ? 50 : 300);

    if (examId) {
      query = query.eq('exam_id', examId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const cloudMap = {};
    const cloudBest = { ...localBest };

    for (const row of data || []) {
      const att = normalizeAttempt(row);
      if (!att || !att.examId) continue;
      if (!cloudMap[att.examId]) cloudMap[att.examId] = [];
      cloudMap[att.examId].push(att);

      const prevBest = cloudBest[att.examId];
      if (!prevBest || att.score > prevBest.score) {
        cloudBest[att.examId] = {
          score: att.score,
          correct: att.correct,
          total: att.total,
          percentage: att.percentage,
          date: att.submittedAt,
        };
      }
    }

    // Merge local attempts not yet duplicated in cloud (match within 3 seconds of submittedAt & same score)
    const mergedMap = { ...cloudMap };
    const sourceLocal = examId ? { [examId]: localMap[examId] || [] } : localMap;
    for (const [eid, list] of Object.entries(sourceLocal)) {
      const existing = mergedMap[eid] || [];
      for (const localAtt of list) {
        const dup = existing.some(
          (c) => Math.abs(c.submittedAt - localAtt.submittedAt) < 4000 && c.score === localAtt.score
        );
        if (!dup) existing.push(localAtt);
      }
      existing.sort((a, b) => b.submittedAt - a.submittedAt);
      if (existing.length > 0) mergedMap[eid] = existing;
    }

    return {
      authenticated: true,
      historyMap: mergedMap,
      bestScores: cloudBest,
    };
  } catch (_) {
    return {
      authenticated: false,
      historyMap: examId ? { [examId]: localMap[examId] || [] } : localMap,
      bestScores: localBest,
    };
  }
}
