// src/services/db.js
// Centralized ES Module Data Service — uses native Supabase JS client directly.
// React-owned pages bypass window.HiDB entirely for maximum performance.
// Legacy pages (sessionUI, bilingualReading, thptExam) still use window.HiDB.

import { supabase } from '../lib/supabaseClient.js';

// ─── In-memory cache ────────────────────────────────────────────────────────
const MEM = {
  topics: null,       // Array | null
  topicsAt: 0,        // timestamp ms of last successful fetch
  wordCounts: null,   // Map<topicId, count>
  progress: null,     // Map<topicId, pct>
  progressUid: null,  // uid that progress belongs to
};
const TOPICS_TTL_MS = 5 * 60 * 1000; // 5 min memory cache
const LS_KEY = 'hi_topics_v2';

// ─── localStorage helpers ───────────────────────────────────────────────────
function lsGet() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    return { data, ts };
  } catch { return null; }
}

function lsSet(topics) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ data: topics, ts: Date.now() }));
  } catch { /* quota full — ignore */ }
}

// ─── Core fast query ─────────────────────────────────────────────────────────
/**
 * Fetches topics with word counts & user progress.
 * Uses get_topic_summaries RPC with 2.0s timeout (< 150ms execution).
 * Falls back immediately to direct topics query without looping 66,000 words.
 */
async function fetchTopicsFromSupabase() {
  const { data: { user } } = await supabase.auth.getUser();
  const uid = user?.id ?? null;

  // 1. Try RPC get_topic_summaries with 2.0s timeout (server-side aggregation)
  let rpcData = null;
  let rpcError = null;
  try {
    const rpcPromise = supabase.rpc('get_topic_summaries');
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('RPC_TIMEOUT')), 2000)
    );
    const rpcRes = await Promise.race([rpcPromise, timeoutPromise]);
    rpcData = rpcRes.data;
    rpcError = rpcRes.error;
  } catch (err) {
    rpcError = err;
  }

  if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
    const topics = rpcData.map((t) => {
      const total = Number(t.total_words ?? t.totalWords ?? 0);
      const reviewed = Number(t.reviewed_words ?? t.reviewedWords ?? 0);
      const progress = total > 0 ? Math.round((reviewed / total) * 100) : Number(t.progress ?? 0);
      return {
        id: t.id,
        name: t.name,
        icon: t.icon || 'folder',
        category: t.category || 'general',
        is_pro: Boolean(t.is_pro),
        description: t.description || null,
        user_id: t.user_id || null,
        totalWords: total,
        progress: Math.min(100, Math.max(0, progress)),
        created_at: t.created_at || null,
      };
    });

    topics.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' }));

    // Cache to memory + localStorage
    MEM.topics = topics;
    MEM.topicsAt = Date.now();
    if (uid !== MEM.progressUid) {
      MEM.progress = null;
      MEM.progressUid = uid;
    }
    lsSet(topics);

    if (typeof window !== 'undefined') window._allTopics = topics;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hi:topics-updated', { detail: topics }));
    }
    return topics;
  }

  // 2. Fast Fallback: Direct query on topics table (< 150ms, no 66,000 words loop)
  let query = supabase
    .from('topics')
    .select('id, name, icon, category, is_pro, description, user_id, created_at')
    .order('category')
    .order('name');

  if (uid) {
    query = query.or(`user_id.eq.${uid},user_id.is.null`);
  }

  const { data: topicsRaw, error: topicsError } = await query;
  if (topicsError || !topicsRaw) {
    throw new Error(topicsError?.message || 'Failed to fetch topics');
  }

  // Preserve any known word counts from existing cache
  const existingMap = new Map((MEM.topics || []).map(t => [t.id, t.totalWords]));

  const topics = topicsRaw.map((t) => ({
    ...t,
    icon: t.icon || 'folder',
    category: t.category || 'general',
    is_pro: Boolean(t.is_pro),
    totalWords: existingMap.get(t.id) || 0,
    progress: 0,
  }));

  topics.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' }));

  // Cache to memory + localStorage
  MEM.topics = topics;
  MEM.topicsAt = Date.now();
  if (uid !== MEM.progressUid) {
    MEM.progress = null;
    MEM.progressUid = uid;
  }
  lsSet(topics);

  if (typeof window !== 'undefined') window._allTopics = topics;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hi:topics-updated', { detail: topics }));
  }

  return topics;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/** Synchronously return whatever is cached — never blocks. */
export function getCachedTopics() {
  if (MEM.topics && MEM.topics.length > 0) return MEM.topics;
  // Try window cache (set by dataLayer.js)
  if (typeof window !== 'undefined' && Array.isArray(window._allTopics) && window._allTopics.length > 0) {
    MEM.topics = window._allTopics;
    return MEM.topics;
  }
  // Try localStorage
  const cached = lsGet();
  if (cached?.data?.length > 0) {
    MEM.topics = cached.data;
    if (typeof window !== 'undefined') window._allTopics = cached.data;
    return MEM.topics;
  }
  return [];
}

/** SWR-style: return cache immediately, revalidate in background. */
export async function getTopics(force = false) {
  const now = Date.now();
  const memFresh = MEM.topics && MEM.topics.length > 0 && (now - MEM.topicsAt) < TOPICS_TTL_MS;

  if (!force && memFresh) {
    // Still fresh in memory — return immediately, revalidate silently
    queueMicrotask(() => fetchTopicsFromSupabase().catch(() => {}));
    return MEM.topics;
  }

  // Try localStorage as instant response while fetching fresh data
  const lsCached = lsGet();
  const lsFresh = lsCached?.data?.length > 0;

  if (!force && lsFresh) {
    // Return stale-while-revalidate from localStorage
    MEM.topics = lsCached.data;
    if (typeof window !== 'undefined') window._allTopics = lsCached.data;
    // Fetch fresh in background
    fetchTopicsFromSupabase().catch(() => {});
    return MEM.topics;
  }

  // No cache at all — must wait for fresh data (first ever load)
  return fetchTopicsFromSupabase();
}

// ─── Auth helpers (thin wrappers for React components) ───────────────────────

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user ?? null;
}

export async function isUserPro() {
  const user = await getCurrentUser();
  if (!user) return false;
  const { data } = await supabase
    .from('profiles')
    .select('tier, subscription_plan, subscription_expires_at')
    .eq('id', user.id)
    .single();
  if (!data) return false;
  const tier = data.tier || data.subscription_plan;
  if (tier === 'pro' || tier === 'lifetime') {
    // Check expiry
    if (data.subscription_expires_at) {
      return new Date(data.subscription_expires_at) > new Date();
    }
    return true;
  }
  return false;
}

// ─── Native Supabase Mutations & Domain Queries ──────────────────────────────

export async function createTopic(name, icon = 'folder', category = 'general') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Vui lòng đăng nhập để tạo chủ đề.');
  
  const { data, error } = await supabase
    .from('topics')
    .insert({
      user_id: user.id,
      name: String(name || '').trim(),
      icon: icon || 'folder',
      category: category || 'general',
      is_public: false,
    })
    .select()
    .single();

  if (error) throw error;
  MEM.topics = null; // Invalidate cache
  return data;
}

export async function deleteTopic(topicId) {
  const { error } = await supabase
    .from('topics')
    .delete()
    .eq('id', topicId);

  if (error) throw error;
  MEM.topics = null; // Invalidate cache
  return true;
}

export async function getCamHierarchy(topicId) {
  try {
    const { data: testsData, error: testsErr } = await supabase
      .from('tests')
      .select('id, name, test_order, is_pro')
      .eq('topic_id', topicId)
      .order('test_order', { ascending: true });

    if (testsErr || !testsData || testsData.length === 0) return null;

    const { data: passagesData, error: passagesErr } = await supabase
      .from('passages')
      .select('id, test_id, passage_number, title, topic_label, content_en, content_vi, is_pro')
      .eq('topic_id', topicId)
      .order('passage_number', { ascending: true });

    if (passagesErr || !passagesData) return null;

    const passagesByTest = new Map();
    passagesData.forEach((p) => {
      if (!passagesByTest.has(p.test_id)) passagesByTest.set(p.test_id, []);
      passagesByTest.get(p.test_id).push({
        id: p.id,
        testId: p.test_id,
        passageNumber: p.passage_number,
        title: p.title || `Passage ${p.passage_number}`,
        topicLabel: p.topic_label,
        contentEn: p.content_en,
        contentVi: p.content_vi,
        isPro: Boolean(p.is_pro),
        totalWords: 0,
        progress: 0,
      });
    });

    const tests = testsData.map((t) => ({
      id: t.id,
      name: t.name,
      testOrder: t.test_order,
      isPro: Boolean(t.is_pro),
      passages: passagesByTest.get(t.id) || [],
    }));

    return {
      tests,
      unlinkedWords: [],
      totalWords: 0,
      progress: 0,
    };
  } catch (err) {
    console.warn('[db.getCamHierarchy] error:', err);
    return null;
  }
}

export async function getLessonsInTopic(topicId) {
  try {
    const { data, error } = await supabase
      .from('words')
      .select('id, word, lesson_name, lesson_order, word_order')
      .eq('topic_id', topicId)
      .order('lesson_order', { ascending: true, nullsFirst: false })
      .order('word_order', { ascending: true, nullsFirst: false });

    if (error || !data || data.length === 0) return [];

    const LESSON_SIZE = 50;
    const namedLessons = data.filter((w) => w.lesson_name && w.lesson_order !== null);

    if (namedLessons.length > 0) {
      const groups = new Map();
      for (const w of namedLessons) {
        const order = Number(w.lesson_order);
        if (!groups.has(order)) groups.set(order, { name: w.lesson_name, words: [] });
        groups.get(order).words.push(w);
      }
      return Array.from(groups.entries())
        .sort(([a], [b]) => a - b)
        .map(([order, g]) => ({
          id: `lesson-${topicId}-${order}`,
          topicId,
          index: order,
          name: g.name,
          totalWords: g.words.length,
          progress: 0,
          wordIds: g.words.map((w) => w.id),
        }));
    }

    const lessons = [];
    for (let i = 0; i < data.length; i += LESSON_SIZE) {
      const chunk = data.slice(i, i + LESSON_SIZE);
      const idx = Math.floor(i / LESSON_SIZE);
      lessons.push({
        id: `lesson-${topicId}-${idx}`,
        topicId,
        index: idx,
        name: `Lesson ${idx + 1}`,
        totalWords: chunk.length,
        progress: 0,
        wordIds: chunk.map((w) => w.id),
      });
    }
    return lessons;
  } catch (err) {
    console.warn('[db.getLessonsInTopic]', err);
    return [];
  }
}

export async function getWordsInLesson(topicId, lessonIndex) {
  try {
    const { data, error } = await supabase
      .from('words')
      .select('id, word, pos, phonetic, meaning, example_sentence, image_url, lesson_order, word_order')
      .eq('topic_id', topicId)
      .eq('lesson_order', lessonIndex)
      .order('word_order', { ascending: true, nullsFirst: false });

    if (!error && data && data.length > 0) {
      return data.map((w) => ({
        ...w,
        exampleSentence: w.example_sentence || '',
        imageUrl: w.image_url || '',
      }));
    }

    const LESSON_SIZE = 50;
    const { data: fbData } = await supabase
      .from('words')
      .select('id, word, pos, phonetic, meaning, example_sentence, image_url')
      .eq('topic_id', topicId)
      .range(lessonIndex * LESSON_SIZE, (lessonIndex + 1) * LESSON_SIZE - 1);

    return (fbData || []).map((w) => ({
      ...w,
      exampleSentence: w.example_sentence || '',
      imageUrl: w.image_url || '',
    }));
  } catch (err) {
    console.warn('[db.getWordsInLesson]', err);
    return [];
  }
}

export async function getWordsInPassage(passageId) {
  try {
    const { data, error } = await supabase
      .from('words')
      .select('id, word, pos, phonetic, meaning, example_sentence, image_url, passage_id, word_order, created_at')
      .eq('passage_id', passageId)
      .order('word_order', { ascending: true, nullsFirst: false });
    if (error) throw error;
    return (data || []).map((w) => ({
      ...w,
      exampleSentence: w.example_sentence || '',
      imageUrl: w.image_url || '',
    }));
  } catch (err) {
    console.warn('[db.getWordsInPassage]', err);
    return [];
  }
}

export async function getPassage(passageId) {
  try {
    const { data, error } = await supabase
      .from('passages')
      .select('id, test_id, topic_id, passage_number, title, topic_label, content_en, content_vi')
      .eq('id', passageId)
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('[db.getPassage]', err);
    return null;
  }
}

export async function addWord(topicId, { word, phonetic = '', meaning, exampleSentence = '', notes = '', passageId = null }) {
  const { data: { user } } = await supabase.auth.getUser();
  const payload = {
    topic_id: topicId,
    word: String(word || '').trim(),
    phonetic: String(phonetic || '').trim(),
    meaning: String(meaning || '').trim(),
    example_sentence: String(exampleSentence || '').trim(),
    notes: String(notes || '').trim(),
  };
  if (passageId) payload.passage_id = passageId;

  const { data, error } = await supabase
    .from('words')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;

  if (user?.id && data?.id) {
    await supabase.from('word_progress').upsert({
      user_id: user.id,
      word_id: data.id,
      level: 1,
      next_review_at: new Date().toISOString(),
      review_count: 0,
      created_at: new Date().toISOString(),
    }, { onConflict: 'user_id,word_id' }).catch(() => {});
  }
  return data;
}

export async function deleteWord(wordId) {
  const { error } = await supabase
    .from('words')
    .delete()
    .eq('id', wordId);
  if (error) throw error;
  return true;
}

export async function updatePassageTitle(passageId, title) {
  const { error } = await supabase
    .from('passages')
    .update({ title })
    .eq('id', passageId);
  if (error) throw error;
  return true;
}

export async function clonePublicTopic(topicId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Vui lòng đăng nhập để lưu bộ từ!');

  const { data: srcTopic, error: srcErr } = await supabase
    .from('topics')
    .select('name, icon, category, description')
    .eq('id', topicId)
    .single();
  if (srcErr || !srcTopic) throw new Error('Không tìm thấy bộ từ nguồn.');

  const { data: newTopic, error: createErr } = await supabase
    .from('topics')
    .insert({
      user_id: user.id,
      name: `${srcTopic.name} (Bản sao)`,
      icon: srcTopic.icon || 'folder',
      category: 'personal',
      description: srcTopic.description || null,
      is_public: false,
    })
    .select()
    .single();
  if (createErr || !newTopic) throw createErr;

  try {
    await supabase.rpc('increment_topic_clones', { p_topic_id: topicId });
  } catch (_) {}

  const { data: srcWords } = await supabase
    .from('words')
    .select('word, pos, phonetic, meaning, example_sentence, notes, image_url, word_order')
    .eq('topic_id', topicId);

  if (srcWords && srcWords.length > 0) {
    const wordsToInsert = srcWords.map((w) => ({
      ...w,
      topic_id: newTopic.id,
      passage_id: null,
    }));
    await supabase.from('words').insert(wordsToInsert);
  }

  MEM.topics = null;
  return newTopic.id;
}

export async function checkProAccess({ topicId, passageId, showModal = true } = {}) {
  const isPro = await isUserPro();
  if (isPro) return true;

  if (topicId) {
    const { data } = await supabase
      .from('topics')
      .select('is_pro')
      .eq('id', topicId)
      .maybeSingle();
    if (data?.is_pro) {
      if (showModal && typeof window !== 'undefined' && window.__modalContext?.openModal) {
        window.__modalContext.openModal('pricingModal');
      }
      return false;
    }
  }

  if (passageId) {
    const { data } = await supabase
      .from('passages')
      .select('is_pro')
      .eq('id', passageId)
      .maybeSingle();
    if (data?.is_pro) {
      if (showModal && typeof window !== 'undefined' && window.__modalContext?.openModal) {
        window.__modalContext.openModal('pricingModal');
      }
      return false;
    }
  }

  return true;
}

export const db = {
  getCurrentUser,
  isUserPro,
  getCachedTopics,
  getTopics,
  createTopic,
  deleteTopic,
  getCamHierarchy,
  getLessonsInTopic,
  getWordsInLesson,
  getWordsInPassage,
  getPassage,
  addWord,
  deleteWord,
  updatePassageTitle,
  clonePublicTopic,
  checkProAccess,
};

// Expose HiDB globally for any remaining non-React call
if (typeof window !== 'undefined') {
  window.HiDB = db;
  window.checkProAccess = checkProAccess;
}

export default db;
