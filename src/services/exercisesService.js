// src/services/exercisesService.js
// Service quản lý dữ liệu 29 Chuyên đề Học tập THPT (Lý thuyết & 1.004 Câu hỏi)
import { supabase } from '../lib/supabaseClient.js';

const SCORES_KEY = 'hivocab_exercise_scores_v1';
const EXERCISES_MEM = {
  list: null,
  questions: new Map(),
  theories: null,
};

export function getExerciseScores() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(SCORES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveExerciseScore(exerciseId, score, total) {
  if (typeof window === 'undefined') return;
  try {
    const current = getExerciseScores();
    const prev = current[exerciseId];
    if (!prev || score > prev.score) {
      current[exerciseId] = {
        score,
        total,
        percentage: Math.round((score / total) * 100),
        completedAt: new Date().toISOString(),
      };
      localStorage.setItem(SCORES_KEY, JSON.stringify(current));
    }
  } catch (_) {}
}

export async function getExercises() {
  if (EXERCISES_MEM.list && EXERCISES_MEM.list.length > 0) {
    return EXERCISES_MEM.list;
  }

  // 1. Thử truy vấn từ Supabase
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('id, title, description, category, topic_group, icon, created_at')
      .ilike('id', 'c0000000-%')
      .order('id');

    if (!error && Array.isArray(data) && data.length > 0) {
      EXERCISES_MEM.list = data;
      return data;
    }
  } catch (_) {}

  // 2. Fallback sang file JSON tĩnh
  try {
    const res = await fetch('/data/hivocab_29_chuyen_de_exercises.json');
    if (res.ok) {
      const fallbackData = await res.json();
      if (Array.isArray(fallbackData) && fallbackData.length > 0) {
        EXERCISES_MEM.list = fallbackData;
        return fallbackData;
      }
    }
  } catch (_) {}

  return [];
}

export async function getExerciseTheory(exerciseId) {
  // 1. Kiểm tra cache
  if (!EXERCISES_MEM.theories) {
    try {
      const res = await fetch('/data/hivocab_29_chuyen_de_ly_thuyet.json?v=20261112_v3');
      if (res.ok) {
        const json = await res.json();
        EXERCISES_MEM.theories = json.theories || [];
      }
    } catch (_) {}
  }

  if (EXERCISES_MEM.theories) {
    const match = EXERCISES_MEM.theories.find(t => t.exercise_id === exerciseId);
    if (match) return match.theory_and_strategy;
  }

  // 2. Fallback từ exercises description
  const all = await getExercises();
  const ex = all.find(e => e.id === exerciseId);
  return ex?.description || '';
}

export async function getExerciseQuestions(exerciseId) {
  if (EXERCISES_MEM.questions.has(exerciseId)) {
    return EXERCISES_MEM.questions.get(exerciseId);
  }

  // 1. Thử nạp từ Supabase
  try {
    const { data, error } = await supabase
      .from('exercise_questions')
      .select('*')
      .eq('exercise_id', exerciseId)
      .order('order_index');

    if (!error && Array.isArray(data) && data.length > 0) {
      EXERCISES_MEM.questions.set(exerciseId, data);
      return data;
    }
  } catch (_) {}

  // 2. Fallback sang file JSON tĩnh
  try {
    const res = await fetch('/data/hivocab_29_chuyen_de_questions.json');
    if (res.ok) {
      const allQ = await res.json();
      const filtered = (allQ || []).filter(q => q.exercise_id === exerciseId);
      filtered.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      EXERCISES_MEM.questions.set(exerciseId, filtered);
      return filtered;
    }
  } catch (_) {}

  return [];
}
