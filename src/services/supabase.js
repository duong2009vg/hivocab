// src/services/supabase.js
// Supabase Client & Database Service for HiVocab

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://swehdtrqjyklmsefkjdf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3ZWhkdHJxanlrbG1zZWZramRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTc4MDcsImV4cCI6MjA5Mzk3MzgwN30.dXRhEmvS8J21aJ3dwZ4jHaWuKbhNw2yys90YTIop2EU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    }
});

// Cache cục bộ nhẹ
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
    return data;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    clearCache();
}

export async function resetPasswordForEmail(email, captchaToken) {
    const options = { redirectTo: window.location.origin };
    if (captchaToken) options.captchaToken = captchaToken;
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, options);
    if (error) throw error;
    return data;
}

// ─────────────────────────────────────────────────────────────
// 2. CHỦ ĐỀ & THƯ MỤC (TOPICS & FOLDERS)
// ─────────────────────────────────────────────────────────────

export async function getTopics() {
    const user = await getCurrentUser();
    const cacheKey = `topics:${user?.id || 'anon'}`;
    const cached = _cacheGet(cacheKey);
    if (cached) return cached;

    try {
        let query = supabase
            .from('topics')
            .select('id, name, icon, category, is_pro, created_at')
            .order('created_at', { ascending: true });

        if (user) {
            query = query.or(`user_id.eq.${user.id},user_id.is.null`);
        } else {
            query = query.is('user_id', null);
        }

        const { data: topicsData, error } = await query;
        if (error) throw error;
        if (!topicsData || topicsData.length === 0) return _cacheSet(cacheKey, []);

        // Đếm số lượng từ cho mỗi topic
        const topicIds = topicsData.map(t => t.id);
        const { data: wordsData } = await supabase
            .from('words')
            .select('id, topic_id')
            .in('topic_id', topicIds);

        const wordCountMap = new Map();
        (wordsData || []).forEach(w => {
            wordCountMap.set(w.topic_id, (wordCountMap.get(w.topic_id) || 0) + 1);
        });

        const topics = topicsData.map(t => ({
            id: t.id,
            name: t.name,
            icon: t.icon || 'folder',
            category: String(t.category || 'general').trim(),
            is_pro: Boolean(t.is_pro),
            totalWords: wordCountMap.get(t.id) || 0,
            progress: 0,
            createdAt: t.created_at
        }));

        // Sắp xếp tự nhiên (Unit 1..25, Cam 10..21)
        topics.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' }));

        return _cacheSet(cacheKey, topics);
    } catch (e) {
        console.warn('[supabase] getTopics error:', e);
        return [];
    }
}

export async function createTopic(name, icon = 'folder', category = 'general') {
    const user = await getCurrentUser();
    if (!user) throw new Error('Vui lòng đăng nhập để tạo chủ đề.');

    const { data, error } = await supabase
        .from('topics')
        .insert({ user_id: user.id, name, icon, category: String(category).trim() })
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
}

// ─────────────────────────────────────────────────────────────
// 3. TỪ VỰNG (WORDS CRUD)
// ─────────────────────────────────────────────────────────────

export async function getWordsByTopic(topicId, page = 1, pageSize = 30) {
    if (!topicId) return { words: [], total: 0 };
    const cacheKey = `words:${topicId}:${page}:${pageSize}`;
    const cached = _cacheGet(cacheKey);
    if (cached) return cached;

    try {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, count, error } = await supabase
            .from('words')
            .select('*', { count: 'exact' })
            .eq('topic_id', topicId)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;

        const result = {
            words: data || [],
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
}

// ─────────────────────────────────────────────────────────────
// 4. TÌM KIẾM NHANH TRONG KHO 70.000 TỪ (0 AI COST)
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
        createTopic,
        deleteTopic,
        getWordsByTopic,
        addWord,
        deleteWord,
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
    createTopic,
    deleteTopic,
    getWordsByTopic,
    addWord,
    deleteWord,
    searchAppDatabase,
    clearCache
};
