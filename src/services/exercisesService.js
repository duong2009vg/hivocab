// src/services/exercisesService.js
// Service quản lý dữ liệu 29 Chuyên đề Học tập THPT (Lý thuyết & 1.004 Câu hỏi)
import { supabase } from '../lib/supabaseClient.js';

const SCORES_KEY = 'hivocab_exercise_scores_v1';
const EXERCISES_LIST_CACHE_KEY = 'hivocab_chuyen_de_exercises_v1';
const EXERCISES_LIST_TTL_MS = 5 * 60 * 1000;
const EXERCISES_MEM = {
  list: null,
  questions: new Map(),
  theoryMeta: null,
  theoriesById: new Map(),
};

async function getCorpusHeaders() {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

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

  if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
    try {
      const raw = sessionStorage.getItem(EXERCISES_LIST_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          Array.isArray(parsed.data) &&
          parsed.data.length > 0 &&
          Date.now() - Number(parsed.ts || 0) < EXERCISES_LIST_TTL_MS
        ) {
          EXERCISES_MEM.list = parsed.data;
          return parsed.data;
        }
      }
    } catch (_) {}
  }

  const persistListCache = (list) => {
    EXERCISES_MEM.list = list;
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem(EXERCISES_LIST_CACHE_KEY, JSON.stringify({ data: list, ts: Date.now() }));
      } catch (_) {}
    }
  };

  // 1. Truy vấn danh sách 29 chuyên đề THPT từ Supabase (dùng idx_exercises_category_id)
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('id, title, description, category, topic_group, icon, created_at')
      .eq('category', 'thpt')
      .order('id');

    if (!error && Array.isArray(data) && data.length > 0) {
      persistListCache(data);
      return data;
    }
  } catch (_) {}

  // 2. Fallback sang API /api/corpus (rate-limited, không phơi file tĩnh trên CDN)
  try {
    const headers = await getCorpusHeaders();
    const res = await fetch('/api/corpus?name=chuyen-de-exercises', { headers });
    if (res.ok) {
      const fallbackData = await res.json();
      if (Array.isArray(fallbackData) && fallbackData.length > 0) {
        persistListCache(fallbackData);
        return fallbackData;
      }
    }
  } catch (_) {}

  return [];
}

export async function getExerciseTheoryMetaMap() {
  if (!EXERCISES_MEM.theoryMeta) {
    const map = {};
    try {
      const headers = await getCorpusHeaders();
      const res = await fetch('/api/corpus?name=chuyen-de-theory&mode=meta', { headers });
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json?.meta) ? json.meta : [];
        for (const item of list) {
          if (!item?.exercise_id) continue;
          map[item.exercise_id] = {
            questions_count: item.questions_count || 0,
            examples_count: item.examples_count || 0,
          };
        }
      }
    } catch (_) {}
    EXERCISES_MEM.theoryMeta = map;
  }
  return EXERCISES_MEM.theoryMeta;
}

export async function getExerciseTheoryData(exerciseId) {
  if (EXERCISES_MEM.theoriesById.has(exerciseId)) {
    return EXERCISES_MEM.theoriesById.get(exerciseId);
  }
  try {
    const headers = await getCorpusHeaders();
    const res = await fetch(
      `/api/corpus?name=chuyen-de-theory&exercise_id=${encodeURIComponent(exerciseId)}`,
      { headers }
    );
    if (res.ok) {
      const json = await res.json();
      const match = json?.theory;
      if (match) {
        const data = {
          theory_and_strategy: match.theory_and_strategy || '',
          examples: Array.isArray(match.examples) ? match.examples : [],
        };
        EXERCISES_MEM.theoriesById.set(exerciseId, data);
        return data;
      }
    }
  } catch (_) {}

  const all = await getExercises();
  const ex = all.find(e => e.id === exerciseId);
  return {
    theory_and_strategy: ex?.description || '',
    examples: [],
  };
}

export async function getExerciseTheory(exerciseId) {
  const data = await getExerciseTheoryData(exerciseId);
  return data.theory_and_strategy;
}

export async function getExerciseQuestions(exerciseId) {
  if (EXERCISES_MEM.questions.has(exerciseId)) {
    return EXERCISES_MEM.questions.get(exerciseId);
  }

  // 1. Thử nạp từ Supabase với projection cụ thể (idx_exercise_questions_exercise_order)
  try {
    const { data, error } = await supabase
      .from('exercise_questions')
      .select('id, exercise_id, question_type, prompt, options, options_map, answer, hint, order_index, passage, is_arrangement, arrangement_sentences')
      .eq('exercise_id', exerciseId)
      .order('order_index');

    if (!error && Array.isArray(data) && data.length > 0) {
      EXERCISES_MEM.questions.set(exerciseId, data);
      return data;
    }
  } catch (_) {}

  // 2. Fallback sang API /api/corpus theo từng chuyên đề (chống cào hàng loạt)
  try {
    const headers = await getCorpusHeaders();
    const res = await fetch(
      `/api/corpus?name=chuyen-de-questions&exercise_id=${encodeURIComponent(exerciseId)}`,
      { headers }
    );
    if (res.ok) {
      const json = await res.json();
      const filtered = Array.isArray(json?.questions) ? json.questions : [];
      filtered.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      EXERCISES_MEM.questions.set(exerciseId, filtered);
      return filtered;
    }
  } catch (_) {}

  return [];
}
