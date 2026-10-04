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
    .maybeSingle();
  if (!data) return false;
  const plan = String(data.subscription_plan || '').toLowerCase();
  const isProTier = (
    data.tier === 'pro' ||
    data.tier === 'lifetime' ||
    plan === 'lifetime' ||
    plan.startsWith('pro')
  );
  if (!isProTier) return false;
  if (data.tier === 'lifetime' || plan === 'lifetime' || plan === 'pro_lifetime') {
    return true;
  }
  if (!data.subscription_expires_at) {
    return true;
  }
  return new Date(data.subscription_expires_at) > new Date();
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

export async function deleteTopicCascade(topicId) {
  if (!topicId) return false;
  try {
    await supabase.from('words').delete().eq('topic_id', topicId);
  } catch (e) {
    console.warn('[deleteTopicCascade] words cleanup:', e);
  }
  try {
    await supabase.from('passages').delete().eq('topic_id', topicId);
  } catch (e) {
    console.warn('[deleteTopicCascade] passages cleanup:', e);
  }
  try {
    await supabase.from('tests').delete().eq('topic_id', topicId);
  } catch (e) {
    console.warn('[deleteTopicCascade] tests cleanup:', e);
  }
  try {
    await supabase.from('topic_likes').delete().eq('topic_id', topicId);
  } catch (e) {
    console.warn('[deleteTopicCascade] topic_likes cleanup:', e);
  }
  try {
    await supabase.from('topic_comments').delete().eq('topic_id', topicId);
  } catch (e) {
    console.warn('[deleteTopicCascade] topic_comments cleanup:', e);
  }
  const { error } = await supabase
    .from('topics')
    .delete()
    .eq('id', topicId);

  if (error) throw error;
  MEM.topics = null; // Invalidate cache
  try {
    localStorage.removeItem(LS_KEY);
  } catch (_) {}
  return true;
}

export async function deleteTopic(topicId) {
  return deleteTopicCascade(topicId);
}

export async function deleteFolderCascade(categoryName) {
  const cat = String(categoryName || '').trim();
  if (!cat) return false;

  // 1. Find all topics in this category
  const { data: topics, error: fetchErr } = await supabase
    .from('topics')
    .select('id, category')
    .ilike('category', cat);

  if (fetchErr) throw fetchErr;

  const topicIds = (topics || []).map(t => t.id);
  for (const tId of topicIds) {
    await deleteTopicCascade(tId);
  }

  // 2. Clear client caches
  try {
    if (typeof window !== 'undefined') {
      const key = cat.toLowerCase();
      let userFolders = JSON.parse(localStorage.getItem('hivocab_user_folders') || '[]');
      if (Array.isArray(userFolders)) {
        userFolders = userFolders.filter(f => (f?.name || '').trim().toLowerCase() !== key);
        localStorage.setItem('hivocab_user_folders', JSON.stringify(userFolders));
      }

      let deletedFolders = JSON.parse(localStorage.getItem('hivocab_deleted_folders') || '[]');
      if (!Array.isArray(deletedFolders)) deletedFolders = [];
      if (!deletedFolders.includes(key)) {
        deletedFolders.push(key);
        localStorage.setItem('hivocab_deleted_folders', JSON.stringify(deletedFolders));
      }

      window.dispatchEvent(new CustomEvent('hi:topics-updated'));
    }
  } catch (err) {
    console.warn('[deleteFolderCascade] LocalStorage cleanup:', err);
  }

  MEM.topics = null;
  try {
    localStorage.removeItem(LS_KEY);
  } catch (_) {}
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

    // Fetch exact word counts for all passages in parallel (bypasses 1000-row PostgREST limit)
    const [countResults, topicCountRes, user] = await Promise.all([
      Promise.all(
        passagesData.map(async (p) => {
          const { count } = await supabase
            .from('words')
            .select('*', { count: 'exact', head: true })
            .eq('passage_id', p.id);
          return [p.id, count || 0];
        })
      ),
      supabase
        .from('words')
        .select('*', { count: 'exact', head: true })
        .eq('topic_id', topicId),
      getCurrentUser().catch(() => null),
    ]);

    const wordCountByPassage = new Map(countResults);

    // Fetch user progress if logged in
    let learnedByPassage = new Map();
    let totalLearnedWords = 0;
    if (user) {
      try {
        const { data: progData } = await supabase
          .from('word_progress')
          .select('word_id, level')
          .eq('user_id', user.id)
          .gt('level', 0)
          .limit(2000);

        if (progData && progData.length > 0) {
          const learnedWordIds = progData.map((p) => p.word_id);
          const { data: learnedWordsData } = await supabase
            .from('words')
            .select('id, passage_id')
            .eq('topic_id', topicId)
            .in('id', learnedWordIds);

          if (learnedWordsData) {
            totalLearnedWords = learnedWordsData.length;
            learnedWordsData.forEach((w) => {
              if (w.passage_id) {
                learnedByPassage.set(w.passage_id, (learnedByPassage.get(w.passage_id) || 0) + 1);
              }
            });
          }
        }
      } catch (e) {
        console.warn('[db.getCamHierarchy] progress error:', e);
      }
    }

    const passagesByTest = new Map();
    let grandTotalWords = 0;
    passagesData.forEach((p) => {
      if (!passagesByTest.has(p.test_id)) passagesByTest.set(p.test_id, []);
      const pWords = wordCountByPassage.get(p.id) || 0;
      const pLearned = learnedByPassage.get(p.id) || 0;
      const pProg = pWords > 0 ? Math.round((pLearned / pWords) * 100) : 0;
      grandTotalWords += pWords;
      passagesByTest.get(p.test_id).push({
        id: p.id,
        testId: p.test_id,
        passageNumber: p.passage_number,
        title: p.title || `Passage ${p.passage_number}`,
        topicLabel: p.topic_label,
        contentEn: p.content_en,
        contentVi: p.content_vi,
        isPro: Boolean(p.is_pro),
        totalWords: pWords,
        learnedWords: pLearned,
        progress: pProg,
      });
    });

    const tests = testsData.map((t) => ({
      id: t.id,
      name: t.name,
      testOrder: t.test_order,
      isPro: Boolean(t.is_pro),
      passages: passagesByTest.get(t.id) || [],
    }));

    const totalWords = topicCountRes?.count || grandTotalWords;
    const progress = totalWords > 0 ? Math.round((totalLearnedWords / totalWords) * 100) : 0;

    return {
      tests,
      unlinkedWords: [],
      totalWords,
      learnedWords: totalLearnedWords,
      progress,
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
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from('words')
      .select('id, word, pos, phonetic, meaning, example_sentence, image_url, lesson_order, word_order')
      .eq('topic_id', topicId)
      .eq('lesson_order', lessonIndex)
      .order('word_order', { ascending: true, nullsFirst: false });

    let wordsList = (!error && data && data.length > 0) ? data : [];
    if (wordsList.length === 0) {
      const LESSON_SIZE = 50;
      const { data: fbData } = await supabase
        .from('words')
        .select('id, word, pos, phonetic, meaning, example_sentence, image_url')
        .eq('topic_id', topicId)
        .range(lessonIndex * LESSON_SIZE, (lessonIndex + 1) * LESSON_SIZE - 1);
      wordsList = fbData || [];
    }

    let progressMap = {};
    if (user && wordsList.length > 0) {
      const wordIds = wordsList.map((w) => w.id);
      const { data: progData } = await supabase
        .from('word_progress')
        .select('word_id, level, next_review_at, last_reviewed_at, review_count')
        .eq('user_id', user.id)
        .in('word_id', wordIds);
      if (progData) {
        progData.forEach((p) => { progressMap[p.word_id] = p; });
      }
    }

    return wordsList.map((w) => {
      const prog = progressMap[w.id];
      return {
        ...w,
        exampleSentence: w.example_sentence || '',
        imageUrl: w.image_url || '',
        level: prog?.level ?? 0,
        nextReviewAt: prog?.next_review_at ?? null,
        lastReviewedAt: prog?.last_reviewed_at ?? null,
        reviewCount: prog?.review_count ?? 0,
        isDue: !prog || (prog.next_review_at && new Date(prog.next_review_at) <= new Date()),
      };
    });
  } catch (err) {
    console.warn('[db.getWordsInLesson]', err);
    return [];
  }
}

export async function getWordsInPassage(passageId) {
  try {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from('words')
      .select('id, word, pos, phonetic, meaning, example_sentence, image_url, passage_id, word_order, created_at')
      .eq('passage_id', passageId)
      .order('word_order', { ascending: true, nullsFirst: false });
    if (error) throw error;
    const wordsList = data || [];

    let progressMap = {};
    if (user && wordsList.length > 0) {
      const wordIds = wordsList.map((w) => w.id);
      const { data: progData } = await supabase
        .from('word_progress')
        .select('word_id, level, next_review_at, last_reviewed_at, review_count')
        .eq('user_id', user.id)
        .in('word_id', wordIds);
      if (progData) {
        progData.forEach((p) => { progressMap[p.word_id] = p; });
      }
    }

    return wordsList.map((w) => {
      const prog = progressMap[w.id];
      return {
        ...w,
        exampleSentence: w.example_sentence || '',
        imageUrl: w.image_url || '',
        level: prog?.level ?? 0,
        nextReviewAt: prog?.next_review_at ?? null,
        lastReviewedAt: prog?.last_reviewed_at ?? null,
        reviewCount: prog?.review_count ?? 0,
        isDue: !prog || (prog.next_review_at && new Date(prog.next_review_at) <= new Date()),
      };
    });
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

// ─── Vocabulary Notebook & SM-2 Spaced Repetition Engine ─────────────────────

export function getIntervalMs(level) {
  const HOUR = 60 * 60 * 1000;
  const DAY  = 24 * HOUR;

  switch (level) {
    case 0: return HOUR;
    case 1: return HOUR;
    case 2: return 8 * HOUR;
    case 3: return DAY;
    case 4: return (5 + Math.random() * 2) * DAY;
    case 5: return (15 + Math.random() * 15) * DAY;
    default: return HOUR;
  }
}

export function calculateNextReview(currentLevel, rating) {
  let newLevel = currentLevel;
  if (currentLevel === 0) {
    newLevel = 1;
  } else if (rating === 'easy') {
    newLevel = Math.min(currentLevel + 1, 5);
  } else if (rating === 'hard') {
    newLevel = Math.max(currentLevel - 1, 1);
  }
  const intervalMs = getIntervalMs(newLevel);
  const nextReviewAt = new Date(Date.now() + intervalMs);
  return { newLevel, nextReviewAt };
}

export function getIntervalLabel(level) {
  switch (level) {
    case 1: return '1 giờ';
    case 2: return '8 giờ';
    case 3: return '24 giờ';
    case 4: return '5–7 ngày';
    case 5: return '15–30 ngày';
    default: return 'N/A';
  }
}

function getLocalDateString(d = new Date()) {
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export async function logStudySession() {
  const user = await getCurrentUser();
  if (!user) return;
  const today = getLocalDateString();
  try {
    const { error } = await supabase.rpc('increment_session', {
      p_user_id: user.id,
      p_date: today,
    });
    if (error) {
      const { data: existing } = await supabase
        .from('study_sessions')
        .select('id, words_reviewed')
        .eq('user_id', user.id)
        .eq('session_date', today)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('study_sessions')
          .update({ words_reviewed: (existing.words_reviewed || 0) + 1 })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('study_sessions')
          .insert({ user_id: user.id, session_date: today, words_reviewed: 1 });
      }
    }
  } catch (err) {
    console.warn('[db.logStudySession]', err);
  }
}

export async function reviewWord(wordId, rating) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Chưa đăng nhập');

  const { data: existing } = await supabase
    .from('word_progress')
    .select('level, review_count')
    .eq('user_id', user.id)
    .eq('word_id', wordId)
    .maybeSingle();

  const currentLevel = existing?.level ?? 0;
  const currentCount = existing?.review_count ?? 0;

  const { newLevel, nextReviewAt } = calculateNextReview(currentLevel, rating);

  const payload = {
    user_id: user.id,
    word_id: wordId,
    level: newLevel,
    next_review_at: nextReviewAt.toISOString(),
    last_reviewed_at: new Date().toISOString(),
    review_count: currentCount + 1,
  };

  const { error } = await supabase
    .from('word_progress')
    .upsert(payload, { onConflict: 'user_id,word_id' });

  if (error) throw error;
  await logStudySession();

  return {
    newLevel,
    nextReviewAt,
    intervalLabel: getIntervalLabel(newLevel),
  };
}

export async function reviewWordToLevel(wordId, targetLevel) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Chưa đăng nhập');

  const { data: existing } = await supabase
    .from('word_progress')
    .select('review_count')
    .eq('user_id', user.id)
    .eq('word_id', wordId)
    .maybeSingle();

  const currentCount = existing?.review_count ?? 0;
  const newLevel = Math.max(1, Math.min(5, targetLevel));
  const intervalMs = getIntervalMs(newLevel);
  const nextReviewAt = new Date(Date.now() + intervalMs);

  const payload = {
    user_id: user.id,
    word_id: wordId,
    level: newLevel,
    next_review_at: nextReviewAt.toISOString(),
    last_reviewed_at: new Date().toISOString(),
    review_count: currentCount + 1,
  };

  const { error } = await supabase
    .from('word_progress')
    .upsert(payload, { onConflict: 'user_id,word_id' });

  if (error) throw error;
  await logStudySession();

  return {
    newLevel,
    nextReviewAt,
    intervalLabel: getIntervalLabel(newLevel),
  };
}

export async function getVocabularyPage(page = 1, pageSize = 20, search = '', levelFilter = null, topicIdFilter = null) {
  const user = await getCurrentUser();
  if (!user) return { words: [], total: 0, page: 1, pageSize };

  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 20));
  const safeSearch = String(search || '').trim();
  const safeLevel = (levelFilter !== undefined && levelFilter !== null && levelFilter !== '') ? Number(levelFilter) : null;
  const safeTopicId = topicIdFilter ? String(topicIdFilter).trim() : null;

  const start = (safePage - 1) * safePageSize;

  let query = supabase
    .from('word_progress')
    .select(`
      level, next_review_at, last_reviewed_at, review_count, user_id,
      words!inner (
        id, topic_id, word, pos, phonetic, meaning, example_sentence, image_url, created_at,
        topics ( id, name )
      )
    `, { count: 'exact' })
    .eq('user_id', user.id);

  if (safeTopicId) {
    query = query.eq('words.topic_id', safeTopicId);
  }

  if (safeLevel !== null && !isNaN(safeLevel)) {
    if (safeLevel === -1) {
      query = query.lte('next_review_at', new Date().toISOString());
    } else {
      query = query.eq('level', safeLevel);
    }
  }

  if (safeSearch) {
    const escaped = safeSearch.replace(/[,%_()]/g, ' ').trim();
    query = query.or(`word.ilike.%${escaped}%,meaning.ilike.%${escaped}%`, { foreignTable: 'words' });
  }

  query = query
    .order('last_reviewed_at', { ascending: false, nullsFirst: false })
    .range(start, start + safePageSize - 1);

  const { data, error, count } = await query;
  if (error) {
    console.error('[db.getVocabularyPage error]:', error);
    throw error;
  }

  const words = (data || []).map((row) => {
    const w = row.words || {};
    return {
      id: w.id,
      wordId: w.id,
      topicId: w.topic_id,
      word: w.word,
      pos: w.pos || '',
      phonetic: w.phonetic,
      meaning: w.meaning,
      exampleSentence: w.example_sentence || '',
      imageUrl: w.image_url || null,
      topicName: w.topics?.name || '',
      level: Number(row.level) || 0,
      nextReviewAt: row.next_review_at,
      lastReviewedAt: row.last_reviewed_at,
      reviewCount: row.review_count || 0,
      isDue: !row.next_review_at || new Date(row.next_review_at) <= new Date(),
    };
  });

  return {
    words,
    total: count || 0,
    page: safePage,
    pageSize: safePageSize,
  };
}

export async function getLearnedVocabStats() {
  const user = await getCurrentUser();
  if (!user) {
    return { total: 0, due: 0, learning: 0, mastered: 0, memoryLevels: { lv0: 0, lv1: 0, lv2: 0, lv3: 0, lv4: 0, lv5: 0 } };
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('word_progress')
    .select('level, next_review_at')
    .eq('user_id', user.id);

  if (error || !data) {
    return { total: 0, due: 0, learning: 0, mastered: 0, memoryLevels: { lv0: 0, lv1: 0, lv2: 0, lv3: 0, lv4: 0, lv5: 0 } };
  }

  let due = 0;
  let learning = 0;
  let mastered = 0;
  const memoryLevels = { lv0: 0, lv1: 0, lv2: 0, lv3: 0, lv4: 0, lv5: 0 };

  data.forEach((item) => {
    const lv = Number(item.level) || 0;
    if (lv >= 0 && lv <= 5) {
      memoryLevels[`lv${lv}`] = (memoryLevels[`lv${lv}`] || 0) + 1;
    } else {
      memoryLevels.lv0++;
    }
    if (item.next_review_at && item.next_review_at <= now) {
      due++;
    }
    if (lv >= 4) {
      mastered++;
    } else {
      learning++;
    }
  });

  return {
    total: data.length,
    due,
    learning,
    mastered,
    memoryLevels,
  };
}

export async function getWordsDueForReview(limit = 20) {
  const user = await getCurrentUser();
  if (!user) return [];

  const now = new Date().toISOString();

  const { data: dueWords, error } = await supabase
    .from('word_progress')
    .select(`
      level,
      next_review_at,
      words!inner (
        id,
        topic_id,
        word,
        pos,
        phonetic,
        meaning,
        example_sentence,
        image_url,
        topics ( id, name, icon )
      )
    `)
    .eq('user_id', user.id)
    .lte('next_review_at', now)
    .order('next_review_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.warn('[db.getWordsDueForReview] query error:', error);
    return [];
  }

  return (dueWords || [])
    .filter(p => p && p.words)
    .map(p => ({
      wordId:          p.words.id,
      id:              p.words.id,
      topicId:         p.words.topic_id,
      word:            p.words.word,
      pos:             p.words.pos || '',
      phonetic:        p.words.phonetic || '',
      meaning:         p.words.meaning || '',
      exampleSentence: p.words.example_sentence || '',
      imageUrl:        p.words.image_url || null,
      level:           p.level,
      nextReviewAt:    p.next_review_at,
      topic:           p.words.topics,
    }));
}

function calculateStreakFromSessions(sessions) {
  if (!sessions || !sessions.length) return 0;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const todayStr = getLocalDateString(today);
  const yesterdayStr = getLocalDateString(yesterday);

  const firstStr = typeof sessions[0].session_date === 'string'
    ? sessions[0].session_date.split('T')[0]
    : getLocalDateString(new Date(sessions[0].session_date));

  if (firstStr < yesterdayStr) return 0;

  let streak = 1;
  const prev = new Date(firstStr + 'T00:00:00');
  prev.setDate(prev.getDate() - 1);

  for (let i = 1; i < sessions.length; i++) {
    const sd = typeof sessions[i].session_date === 'string'
      ? sessions[i].session_date.split('T')[0]
      : getLocalDateString(new Date(sessions[i].session_date));
    if (sd === getLocalDateString(prev)) {
      streak++;
      prev.setDate(prev.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export async function getDashboardStats() {
  const user = await getCurrentUser();
  if (!user) {
    return {
      wordsDueCount: 0,
      streak: 0,
      memoryLevels: { lv0: 0, lv1: 0, lv2: 0, lv3: 0, lv4: 0, lv5: 0 },
    };
  }

  const now = new Date().toISOString();

  let wordsDueCount = 0;
  try {
    const { count, error } = await supabase
      .from('word_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .lte('next_review_at', now);
    if (!error && count !== null) wordsDueCount = count;
  } catch (e) {
    console.warn('[db.getDashboardStats wordsDueCount error]:', e);
  }

  const memoryLevels = { lv0: 0, lv1: 0, lv2: 0, lv3: 0, lv4: 0, lv5: 0 };
  try {
    const { data: progressData } = await supabase
      .from('word_progress')
      .select('level')
      .eq('user_id', user.id);

    if (progressData) {
      progressData.forEach(p => {
        const lv = Number(p.level) ?? 0;
        if (lv >= 0 && lv <= 5) {
          memoryLevels[`lv${lv}`] = (memoryLevels[`lv${lv}`] || 0) + 1;
        } else {
          memoryLevels.lv0 = (memoryLevels.lv0 || 0) + 1;
        }
      });
    }
  } catch (e) {
    console.warn('[db.getDashboardStats memoryLevels error]:', e);
  }

  let streak = 0;
  try {
    const { data: sessions } = await supabase
      .from('study_sessions')
      .select('session_date')
      .eq('user_id', user.id)
      .order('session_date', { ascending: false })
      .limit(365);

    if (sessions && sessions.length > 0) {
      streak = calculateStreakFromSessions(sessions);
    }
  } catch (e) {
    console.warn('[db.getDashboardStats streak error]:', e);
  }

  return {
    wordsDueCount,
    streak,
    memoryLevels,
  };
}

export async function getNextReviewTime() {
  const user = await getCurrentUser();
  if (!user) return null;
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('word_progress')
    .select('next_review_at')
    .eq('user_id', user.id)
    .gt('next_review_at', now)
    .order('next_review_at', { ascending: true })
    .limit(1);

  if (error || !data || data.length === 0) return null;
  return new Date(data[0].next_review_at);
}

export async function getMonthlyStudySessions(year, month) {
  const user = await getCurrentUser();
  const result = {};

  try {
    const localData = JSON.parse(localStorage.getItem('hi_study_sessions') || '{}');
    Object.assign(result, localData);
  } catch (_) {}

  if (!user) return result;

  const startMonthStr = String(month).padStart(2, '0');
  const startDateStr = `${year}-${startMonthStr}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDateStr = `${year}-${startMonthStr}-${String(lastDay).padStart(2, '0')}`;

  try {
    const { data, error } = await supabase
      .from('study_sessions')
      .select('session_date, words_reviewed')
      .eq('user_id', user.id)
      .gte('session_date', startDateStr)
      .lte('session_date', endDateStr);

    if (!error && data) {
      data.forEach((row) => {
        const dateKey = typeof row.session_date === 'string'
          ? row.session_date.split('T')[0]
          : row.session_date;
        result[dateKey] = Number(row.words_reviewed || 0);
      });
    }
  } catch (err) {
    console.warn('[db.getMonthlyStudySessions error]:', err);
  }

  return result;
}

export async function getIELTSGoal() {
  const user = await getCurrentUser();
  let goal = null;

  try {
    const raw = localStorage.getItem('hi_ielts_goal');
    if (raw) goal = JSON.parse(raw);
  } catch (_) {}

  if (user) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('ielts_goal, ielts_exam_date, motto')
        .eq('id', user.id)
        .single();
      if (data && (data.ielts_goal || data.ielts_exam_date)) {
        goal = {
          overall: data.ielts_goal?.overall || goal?.overall || '7.0',
          listening: data.ielts_goal?.listening || goal?.listening || '7.0',
          reading: data.ielts_goal?.reading || goal?.reading || '7.0',
          writing: data.ielts_goal?.writing || goal?.writing || '6.5',
          speaking: data.ielts_goal?.speaking || goal?.speaking || '6.5',
          examDate: data.ielts_exam_date || goal?.examDate || '',
          motto: data.motto || goal?.motto || '',
        };
      }
    } catch (_) {}
  }
  return goal;
}

export async function saveIELTSGoal(goalData) {
  const user = await getCurrentUser();
  try {
    localStorage.setItem('hi_ielts_goal', JSON.stringify(goalData));
  } catch (_) {}

  if (user) {
    try {
      await supabase
        .from('profiles')
        .update({
          ielts_goal: {
            overall: goalData.overall,
            listening: goalData.listening,
            reading: goalData.reading,
            writing: goalData.writing,
            speaking: goalData.speaking,
          },
          ielts_exam_date: goalData.examDate,
          motto: goalData.motto,
        })
        .eq('id', user.id);
    } catch (_) {}
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
  deleteTopicCascade,
  deleteFolderCascade,
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
  // Vocabulary & SM-2
  getVocabularyPage,
  getLearnedVocabStats,
  getWordsDueForReview,
  getDashboardStats,
  getNextReviewTime,
  getMonthlyStudySessions,
  getIELTSGoal,
  saveIELTSGoal,
  getIntervalMs,
  calculateNextReview,
  getIntervalLabel,
  reviewWord,
  reviewWordToLevel,
  logStudySession,
};

// Expose HiDB globally for any remaining non-React call
if (typeof window !== 'undefined') {
  window.HiDB = db;
  window.checkProAccess = checkProAccess;
}

export default db;
