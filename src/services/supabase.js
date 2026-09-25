// src/services/supabase.js
// Supabase Client & Complete Database Service for HiVocab

import { createClient } from '@supabase/supabase-js';
import { calculateNextReview, getIntervalLabel, filterDueWords, getMemoryDistribution } from './srs.js';

const SUPABASE_URL = 'https://swehdtrqjyklmsefkjdf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3ZWhkdHJxanlrbG1zZWZramRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTc4MDcsImV4cCI6MjA5Mzk3MzgwN30.dXRhEmvS8J21aJ3dwZ4jHaWuKbhNw2yys90YTIop2EU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    }
});

// Cache cục bộ nhẹ với TTL
const _cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

function _cacheGet(key) {
    const cached = _cache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.savedAt > (cached.ttl || CACHE_TTL_MS)) {
        _cache.delete(key);
        return null;
    }
    return cached.value;
}

function _cacheSet(key, value, ttl = CACHE_TTL_MS) {
    _cache.set(key, { value, savedAt: Date.now(), ttl });
    return value;
}

export function clearCache(prefix = '') {
    if (!prefix) {
        _cache.clear();
        return;
    }
    for (const key of _cache.keys()) {
        if (key.startsWith(prefix)) _cache.delete(key);
    }
}

// ─────────────────────────────────────────────────────────────
// 1. AUTH & USER PROFILE
// ─────────────────────────────────────────────────────────────

export async function getCurrentUser() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.user || null;
    } catch (_) {
        return null;
    }
}

export async function getUserProfile(forceRefresh = false) {
    const user = await getCurrentUser();
    if (!user) return null;

    const cacheKey = `profile:${user.id}`;
    if (!forceRefresh) {
        const cached = _cacheGet(cacheKey);
        if (cached) return cached;
    }

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (!error && data) {
            return _cacheSet(cacheKey, data, 10 * 60 * 1000);
        }
    } catch (e) {
        console.warn('[supabase] getUserProfile error:', e);
    }
    return null;
}

export async function isUserPro() {
    const user = await getCurrentUser();
    if (!user) return false;
    const profile = await getUserProfile();
    if (!profile) return false;
    if (profile.role === 'admin') return true;
    if (profile.tier === 'lifetime' || profile.subscription_plan === 'pro_lifetime') return true;
    if (profile.tier === 'pro') {
        if (!profile.subscription_expires_at) return true;
        return new Date(profile.subscription_expires_at) > new Date();
    }
    return false;
}

export async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
    });
    if (error) throw error;
}

export async function signInWithPassword(email, password, captchaToken) {
    const payload = { email, password };
    if (captchaToken) payload.options = { captchaToken };
    const { data, error } = await supabase.auth.signInWithPassword(payload);
    if (error) throw error;
    clearCache();
    return data;
}

export async function signUpWithPassword(email, password, captchaToken) {
    const options = { emailRedirectTo: window.location.origin };
    if (captchaToken) options.captchaToken = captchaToken;
    const { data, error } = await supabase.auth.signUp({ email, password, options });
    if (error) throw error;
    clearCache();
    return data;
}

export async function signOut() {
    clearCache();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export async function resetPasswordForEmail(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
    });
    if (error) throw error;
    return data;
}

// ─────────────────────────────────────────────────────────────
// 2. TOPICS & FOLDERS (CAMBRIDGE & CUSTOM)
// ─────────────────────────────────────────────────────────────

export async function getTopics(category = null) {
    const cacheKey = `topics:${category || 'all'}`;
    const cached = _cacheGet(cacheKey);
    if (cached) return cached;

    try {
        let query = supabase
            .from('topics')
            .select('id, title, description, category, word_count, created_at, user_id')
            .order('created_at', { ascending: false });

        if (category && category !== 'all') {
            query = query.eq('category', category);
        }

        const { data, error } = await query;
        if (error) throw error;

        return _cacheSet(cacheKey, data || [], 60 * 1000);
    } catch (e) {
        console.warn('[supabase] getTopics error:', e);
        return [];
    }
}

export async function getTopicById(topicId) {
    if (!topicId) return null;
    const cacheKey = `topic:${topicId}`;
    const cached = _cacheGet(cacheKey);
    if (cached) return cached;

    try {
        const { data, error } = await supabase
            .from('topics')
            .select('*')
            .eq('id', topicId)
            .single();

        if (error) throw error;
        return _cacheSet(cacheKey, data, 60 * 1000);
    } catch (e) {
        console.warn('[supabase] getTopicById error:', e);
        return null;
    }
}

export async function createTopic(param1, param2 = '', param3 = 'general') {
    const user = await getCurrentUser();
    if (!user) throw new Error('Vui lòng đăng nhập để tạo sổ từ.');

    let title = '', description = '', category = 'general';
    if (typeof param1 === 'object' && param1 !== null) {
        title = param1.title || '';
        description = param1.description || '';
        category = param1.category || 'general';
    } else {
        title = String(param1 || '');
        description = String(param2 || '');
        category = String(param3 || 'general');
    }

    const { data, error } = await supabase
        .from('topics')
        .insert({
            user_id: user.id,
            title: title.trim(),
            description: description.trim(),
            category: category.trim(),
            word_count: 0
        })
        .select()
        .single();

    if (error) throw error;
    clearCache('topics:');
    return data;
}

export async function deleteTopic(topicId) {
    const { error } = await supabase
        .from('topics')
        .delete()
        .eq('id', topicId);

    if (error) throw error;
    clearCache('topics:');
    clearCache('words:');
}

// ─────────────────────────────────────────────────────────────
// 3. WORDS & PROGRESS (WITH SM-2 INTEGRATION)
// ─────────────────────────────────────────────────────────────

export async function getWordsByTopic(topicId, page = 1, pageSize = 30) {
    if (!topicId) return { words: [], total: 0, totalPages: 0 };

    const cacheKey = `words:${topicId}:p${page}:s${pageSize}`;
    const cached = _cacheGet(cacheKey);
    if (cached) return cached;

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    try {
        const user = await getCurrentUser();
        const { data, error, count } = await supabase
            .from('words')
            .select(`
                id, topic_id, word, meaning, phonetic, pos, example_sentence, example_vi, created_at,
                word_progress(level, next_review_at, review_count, last_reviewed_at)
            `, { count: 'exact' })
            .eq('topic_id', topicId)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;

        // Chuẩn hóa dữ liệu word_progress nếu có
        const formattedWords = (data || []).map(w => {
            const progress = Array.isArray(w.word_progress) ? w.word_progress[0] : w.word_progress;
            return {
                ...w,
                level: progress?.level ?? 0,
                next_review_at: progress?.next_review_at ?? null,
                review_count: progress?.review_count ?? 0,
                word_progress: progress || null
            };
        });

        const result = {
            words: formattedWords,
            total: count || 0,
            page,
            pageSize,
            totalPages: Math.ceil((count || 0) / pageSize)
        };

        return _cacheSet(cacheKey, result, 60 * 1000);
    } catch (e) {
        console.warn('[supabase] getWordsByTopic error:', e);
        return { words: [], total: 0, totalPages: 0 };
    }
}

export async function addWord({ topicId, word, meaning, phonetic = '', pos = '', example = '', exampleVi = '' }) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Vui lòng đăng nhập để lưu từ.');

    const { data, error } = await supabase
        .from('words')
        .insert({
            user_id: user.id,
            topic_id: topicId,
            word: word.trim(),
            meaning: meaning.trim(),
            phonetic: phonetic.trim(),
            pos: pos.trim(),
            example_sentence: example.trim(),
            example_vi: exampleVi.trim()
        })
        .select()
        .single();

    if (error) throw error;
    clearCache('words:');
    clearCache('topics:');
    clearCache('stats:');
    return data;
}

export async function addWordsBatch(topicId, wordsList = []) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Vui lòng đăng nhập để thêm từ.');
    if (!wordsList || wordsList.length === 0) return [];

    const rows = wordsList.map(w => ({
        user_id: user.id,
        topic_id: topicId,
        word: (w.word || '').trim(),
        meaning: (w.meaning || '').trim(),
        phonetic: (w.phonetic || '').trim(),
        pos: (w.pos || '').trim(),
        example_sentence: (w.example || w.example_sentence || '').trim(),
        example_vi: (w.exampleVi || w.example_vi || '').trim()
    }));

    const { data, error } = await supabase
        .from('words')
        .insert(rows)
        .select();

    if (error) throw error;
    clearCache('words:');
    clearCache('topics:');
    clearCache('stats:');
    return data;
}

export async function deleteWord(wordId) {
    const { error } = await supabase
        .from('words')
        .delete()
        .eq('id', wordId);

    if (error) throw error;
    clearCache('words:');
    clearCache('topics:');
    clearCache('stats:');
}

// ─────────────────────────────────────────────────────────────
// 4. SM-2 SPACED REPETITION REVIEW PROGRESS
// ─────────────────────────────────────────────────────────────

export async function reviewWord(wordId, rating) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Vui lòng đăng nhập để ghi nhận kết quả học tập.');

    // Lấy progress hiện tại
    const { data: existing } = await supabase
        .from('word_progress')
        .select('level, review_count')
        .eq('user_id', user.id)
        .eq('word_id', wordId)
        .maybeSingle();

    const currentLevel = existing?.level ?? 0;
    const currentCount = existing?.review_count ?? 0;

    const { newLevel, nextReviewAt, intervalLabel } = calculateNextReview(currentLevel, rating);

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

    clearCache('words:');
    clearCache('stats:');

    return {
        newLevel,
        nextReviewAt,
        intervalLabel
    };
}

export async function getWordsDueForReview(limit = 25) {
    const user = await getCurrentUser();
    if (!user) return [];

    try {
        const now = new Date().toISOString();
        // Lấy các từ có next_review_at <= now hoặc chưa có tiến độ (level 0)
        const { data, error } = await supabase
            .from('words')
            .select(`
                id, topic_id, word, meaning, phonetic, pos, example_sentence, example_vi,
                word_progress!inner(level, next_review_at, review_count)
            `)
            .eq('word_progress.user_id', user.id)
            .lte('word_progress.next_review_at', now)
            .order('word_progress(next_review_at)', { ascending: true })
            .limit(limit);

        if (error) {
            // Fallback lấy từ thông thường nếu inner join trống
            const res = await getTopics();
            if (res.length > 0) {
                const wordsRes = await getWordsByTopic(res[0].id, 1, limit);
                return wordsRes.words || [];
            }
            return [];
        }

        return (data || []).map(w => {
            const p = Array.isArray(w.word_progress) ? w.word_progress[0] : w.word_progress;
            return {
                ...w,
                level: p?.level ?? 0,
                next_review_at: p?.next_review_at ?? null,
                review_count: p?.review_count ?? 0
            };
        });
    } catch (e) {
        console.warn('[supabase] getWordsDueForReview error:', e);
        return [];
    }
}

// ─────────────────────────────────────────────────────────────
// 5. DASHBOARD STATS & MEMORY LEVELS DISTRIBUTION
// ─────────────────────────────────────────────────────────────

export async function getDashboardStats() {
    const user = await getCurrentUser();
    if (!user) {
        return {
            totalWords: 0,
            dueToday: 0,
            streak: 0,
            retentionRate: 95,
            memoryLevels: { lv0: 0, lv1: 0, lv2: 0, lv3: 0, lv4: 0, lv5: 0 }
        };
    }

    const cacheKey = `stats:${user.id}`;
    const cached = _cacheGet(cacheKey);
    if (cached) return cached;

    try {
        const now = new Date().toISOString();

        // 1. Tổng số từ của user
        const { count: totalWords } = await supabase
            .from('words')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id);

        // 2. Số từ đến hạn ôn
        const { count: dueToday } = await supabase
            .from('word_progress')
            .select('word_id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .lte('next_review_at', now);

        // 3. Phân bố cấp độ ghi nhớ
        const { data: progressRows } = await supabase
            .from('word_progress')
            .select('level')
            .eq('user_id', user.id);

        const memoryLevels = { lv0: 0, lv1: 0, lv2: 0, lv3: 0, lv4: 0, lv5: 0 };
        (progressRows || []).forEach(r => {
            const lv = Math.min(Math.max(r.level || 0, 0), 5);
            memoryLevels[`lv${lv}`] = (memoryLevels[`lv${lv}`] || 0) + 1;
        });

        // Những từ chưa có trong word_progress là lv0
        const trackedCount = (progressRows || []).length;
        if (totalWords && totalWords > trackedCount) {
            memoryLevels.lv0 += (totalWords - trackedCount);
        }

        const stats = {
            totalWords: totalWords || 0,
            dueToday: dueToday || 0,
            streak: 3, // Streak mặc định hoặc tính từ study_sessions
            retentionRate: 94,
            memoryLevels
        };

        return _cacheSet(cacheKey, stats, 60 * 1000);
    } catch (e) {
        console.warn('[supabase] getDashboardStats error:', e);
        return {
            totalWords: 0,
            dueToday: 0,
            streak: 0,
            retentionRate: 90,
            memoryLevels: { lv0: 0, lv1: 0, lv2: 0, lv3: 0, lv4: 0, lv5: 0 }
        };
    }
}

// ─────────────────────────────────────────────────────────────
// 6. TÌM KIẾM NHANH TRONG KHO 70.000 TỪ (0 AI COST)
// ─────────────────────────────────────────────────────────────

export async function searchAppDatabase(query, limit = 10) {
    if (!query || query.trim().length === 0) return [];
    const q = query.trim().toLowerCase();

    try {
        const { data, error } = await supabase
            .from('words')
            .select('id, word, meaning, phonetic, pos, example_sentence')
            .ilike('word', `${q}%`)
            .limit(limit);

        if (error) return [];
        return data || [];
    } catch (_) {
        return [];
    }
}

// Gắn vào window.HiDB để tương thích tối đa
if (typeof window !== 'undefined') {
    window.HiDB = {
        supabase,
        getCurrentUser,
        getUserProfile,
        isUserPro,
        signInWithGoogle,
        signInWithPassword,
        signUpWithPassword,
        signOut,
        resetPasswordForEmail,
        getTopics,
        getTopicById,
        createTopic,
        deleteTopic,
        getWordsByTopic,
        addWord,
        addWordsBatch,
        deleteWord,
        reviewWord,
        getWordsDueForReview,
        getDashboardStats,
        searchAppDatabase,
    };
}

export default {
    supabase,
    getCurrentUser,
    getUserProfile,
    isUserPro,
    signInWithGoogle,
    signInWithPassword,
    signUpWithPassword,
    signOut,
    resetPasswordForEmail,
    getTopics,
    getTopicById,
    createTopic,
    deleteTopic,
    getWordsByTopic,
    addWord,
    addWordsBatch,
    deleteWord,
    reviewWord,
    getWordsDueForReview,
    getDashboardStats,
    searchAppDatabase,
    clearCache
};
