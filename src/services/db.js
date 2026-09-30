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

// ─── Delegate remaining ops to window.HiDB (mutation ops, legacy queries) ───
// These are not performance-critical (user-triggered, infrequent)

function getHiDB() {
  if (typeof window !== 'undefined' && window.HiDB) return window.HiDB;
  return null;
}

export async function createTopic(name, icon = 'folder', category = 'general') {
  const client = getHiDB();
  if (client?.createTopic) return client.createTopic(name, icon, category);
  throw new Error('Database service is not ready.');
}

export async function deleteTopic(topicId) {
  const client = getHiDB();
  if (client?.deleteTopic) return client.deleteTopic(topicId);
  throw new Error('Database service is not ready.');
}

export async function getCamHierarchy(topicId) {
  const client = getHiDB();
  if (client?.getCamHierarchy) return client.getCamHierarchy(topicId);
  return null;
}

export async function getLessonsInTopic(topicId) {
  const client = getHiDB();
  if (client?.getLessonsInTopic) return client.getLessonsInTopic(topicId);
  return [];
}

export async function getWordsInLesson(topicId, lessonIndex) {
  const client = getHiDB();
  if (client?.getWordsInLesson) return client.getWordsInLesson(topicId, lessonIndex);
  return [];
}

export async function getWordsInPassage(passageId) {
  const client = getHiDB();
  if (client?.getWordsInPassage) return client.getWordsInPassage(passageId);
  try {
    const { data, error } = await supabase
      .from('words')
      .select('id, word, pos, phonetic, meaning, example_sentence, image_url, passage_id, word_order, created_at')
      .eq('passage_id', passageId)
      .order('word_order', { ascending: true, nullsFirst: false });
    if (error) throw error;
    return (data || []).map(w => ({
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
  const client = getHiDB();
  if (client?.getPassage) return client.getPassage(passageId);
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

export async function addWord(topicId, wordData) {
  const client = getHiDB();
  if (client?.addWord) return client.addWord(topicId, wordData);
  throw new Error('Database service is not ready.');
}

export async function deleteWord(wordId) {
  const client = getHiDB();
  if (client?.deleteWord) return client.deleteWord(wordId);
  throw new Error('Database service is not ready.');
}

export async function updatePassageTitle(passageId, title) {
  const client = getHiDB();
  if (client?.updatePassageTitle) return client.updatePassageTitle(passageId, title);
}

export async function checkProAccess({ topicId, passageId, showModal = true } = {}) {
  if (typeof window !== 'undefined' && typeof window.checkProAccess === 'function') {
    return window.checkProAccess({ topicId, passageId, showModal });
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
  checkProAccess,
};

export default db;
