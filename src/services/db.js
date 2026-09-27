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

// ─── Core parallel query ─────────────────────────────────────────────────────
/**
 * Fetches topics + word-counts in two PARALLEL queries (~150ms total).
 * For authenticated users also fetches word_progress in a third parallel query.
 * Returns an array of enriched topic objects.
 */
async function fetchTopicsFromSupabase() {
  // Get current auth user (non-blocking, fast because session is in localStorage)
  const { data: { user } } = await supabase.auth.getUser();
  const uid = user?.id ?? null;

  // ── Query 1: All topics ──────────────────────────────────────────────────
  const topicsPromise = supabase
    .from('topics')
    .select('id, name, icon, category, is_pro, description, user_id, created_at')
    .order('category')
    .order('name');

  // ── Query 2: Word counts per topic (single aggregation query) ────────────
  // Using Supabase's group-by via PostgREST "group by" trick:
  // SELECT topic_id, count(*) FROM words GROUP BY topic_id
  const wordCountPromise = supabase
    .from('words')
    .select('topic_id')
    .then(({ data, error }) => {
      if (error || !data) return new Map();
      // Group client-side (data is all word rows — Supabase returns up to 1000 by default)
      // Use range to get all rows efficiently
      return data; // we'll handle below after fetching all pages
    });

  // ── Query 3: User progress (only for logged-in users) ───────────────────
  const progressPromise = uid
    ? supabase.rpc('get_topic_summaries').then(({ data, error }) => {
        // RPC returns per-topic progress — use if fast, skip on error
        if (error || !data) return null;
        return data; // [{ topic_id, total_words, reviewed_words, ... }]
      })
    : Promise.resolve(null);

  // ── Parallel fetch all word counts with pagination ───────────────────────
  const allWordCountsPromise = (async () => {
    const PAGE = 1000;
    let allWords = [];
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from('words')
        .select('topic_id')
        .range(from, from + PAGE - 1);
      if (error) break;
      if (!data || data.length === 0) break;
      allWords = allWords.concat(data);
      if (data.length < PAGE) break;
      from += PAGE;
    }
    const map = new Map();
    for (const row of allWords) {
      map.set(row.topic_id, (map.get(row.topic_id) || 0) + 1);
    }
    return map;
  })();

  // ── Wait for topics + word counts in parallel ────────────────────────────
  const [
    { data: topicsRaw, error: topicsError },
    wordCountMap,
    rpcProgress,
  ] = await Promise.all([
    topicsPromise,
    allWordCountsPromise,
    progressPromise,
  ]);

  if (topicsError || !topicsRaw) {
    throw new Error(topicsError?.message || 'Failed to fetch topics');
  }

  // Build progress map from RPC if available
  let progressMap = null;
  if (rpcProgress && Array.isArray(rpcProgress)) {
    progressMap = new Map();
    for (const row of rpcProgress) {
      // row shape depends on SQL function — guard gracefully
      const total = row.total_words ?? row.totalWords ?? 0;
      const reviewed = row.reviewed_words ?? row.reviewedWords ?? 0;
      progressMap.set(row.topic_id ?? row.id, {
        totalWords: total,
        progress: total > 0 ? Math.round((reviewed / total) * 100) : 0,
      });
    }
  }

  // ── Merge into enriched topic objects ────────────────────────────────────
  const topics = topicsRaw.map((t) => {
    const wordCount = wordCountMap.get(t.id) || 0;
    const prog = progressMap?.get(t.id);
    return {
      ...t,
      totalWords: prog?.totalWords ?? wordCount,
      progress: prog?.progress ?? 0,
    };
  });

  // Cache to memory + localStorage
  MEM.topics = topics;
  MEM.topicsAt = Date.now();
  MEM.wordCounts = wordCountMap;
  if (uid !== MEM.progressUid) {
    MEM.progress = null; // invalidate progress on user change
    MEM.progressUid = uid;
  }
  lsSet(topics);

  // Sync to window._allTopics so legacy scripts stay in sync
  if (typeof window !== 'undefined') window._allTopics = topics;

  // Notify React hooks that fresh data is available (enables SWR re-render)
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
  return [];
}

export async function getPassage(passageId) {
  const client = getHiDB();
  if (client?.getPassage) return client.getPassage(passageId);
  return null;
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
