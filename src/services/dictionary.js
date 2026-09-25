// src/services/dictionary.js
// HiVocab Dictionary Engine: IndexedDB + 70K Database + Cloudflare KV + DeepSeek AI

import { searchAppDatabase } from './supabase.js';

const DICT_API_URL = '/api/dictionary';
const RECENT_KEY = 'hi_dict_recent_searches';
const DB_NAME = 'HiVocab_Dictionary_DB';
const DB_STORE = 'word_entries';
const DB_VERSION = 1;

const _memoryCache = new Map();
let _idb = null;

// ─────────────────────────────────────────────────────────────
// 1. INDEXEDDB LOCAL STORAGE
// ─────────────────────────────────────────────────────────────
async function _getDB() {
    if (_idb) return _idb;
    if (typeof window === 'undefined' || !window.indexedDB) return null;

    return new Promise((resolve) => {
        try {
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(DB_STORE)) {
                    db.createObjectStore(DB_STORE, { keyPath: 'key' });
                }
            };
            req.onsuccess = (e) => {
                _idb = e.target.result;
                resolve(_idb);
            };
            req.onerror = () => resolve(null);
        } catch (_) {
            resolve(null);
        }
    });
}

async function _loadFromIndexedDB(key) {
    try {
        const db = await _getDB();
        if (!db) return null;
        return new Promise((resolve) => {
            const tx = db.transaction([DB_STORE], 'readonly');
            const store = tx.objectStore(DB_STORE);
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result ? req.result.data : null);
            req.onerror = () => resolve(null);
        });
    } catch (_) {
        return null;
    }
}

async function _saveToIndexedDB(key, data) {
    try {
        const db = await _getDB();
        if (!db) return;
        const tx = db.transaction([DB_STORE], 'readwrite');
        const store = tx.objectStore(DB_STORE);
        store.put({ key, data, saved_at: Date.now() });
    } catch (_) {}
}

async function _fetchWithTimeout(url, options = {}, timeoutMs = 25000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timer);
        return res;
    } catch (e) {
        clearTimeout(timer);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────
// 2. CHUẨN HÓA DỮ LIỆU TỪ VỰNG
// ─────────────────────────────────────────────────────────────
function _cleanMeaning(rawMeaning) {
    if (!rawMeaning || typeof rawMeaning !== 'string') return '';
    return rawMeaning.replace(/^(\([a-zA-Z\s]+\)|\[[a-zA-Z\s]+\])\s*/, '').trim();
}

function _extractPos(rawPos, rawMeaning) {
    if (rawPos && typeof rawPos === 'string' && rawPos.trim()) return rawPos.trim().toLowerCase();
    if (!rawMeaning || typeof rawMeaning !== 'string') return 'từ vựng';
    const m = rawMeaning.match(/^\(([a-zA-Z\s]+)\)/);
    if (m && m[1]) return m[1].toLowerCase().trim();
    return 'từ vựng';
}

function _normalizeEntry(data, source = 'api') {
    if (!data) return null;
    const word = data.word || '';
    const meaning = _cleanMeaning(data.meaning || data.viSummary || '');
    const phonetic = data.phonetic || data.phonetics?.us || data.phonetics?.uk || '';
    const pos = data.pos || 'từ vựng';
    const example = data.example || '';
    const exampleVi = data.example_vi || '';

    return {
        word,
        phonetic,
        pos,
        meaning,
        example,
        example_vi: exampleVi,
        source,
        entries: [{
            meaning,
            pos,
            example,
            example_vi: exampleVi
        }]
    };
}

// ─────────────────────────────────────────────────────────────
// 3. TRA TỪ CHÍNH (LOOKUP)
// ─────────────────────────────────────────────────────────────
export async function lookupWord(word) {
    if (!word?.trim()) return null;
    const cleanWord = word.trim();
    const key = cleanWord.toLowerCase();

    // Tầng 1A: In-memory Cache (0ms)
    if (_memoryCache.has(key)) {
        const cached = _memoryCache.get(key);
        addRecentSearch(cached.word || cleanWord);
        return cached;
    }

    // Tầng 1B: IndexedDB Cache (5ms - 15ms)
    const idbData = await _loadFromIndexedDB(key);
    if (idbData && idbData.word) {
        _memoryCache.set(key, idbData);
        addRecentSearch(idbData.word || cleanWord);
        return idbData;
    }

    // Tầng 2: Ưu tiên tối đa Database 70.000 từ của App (0 AI cost, 0 token, cực nhanh ~50ms)
    let result = null;
    try {
        const dbMatches = await searchAppDatabase(cleanWord, 5);
        const exact = dbMatches.find(w => w.word.toLowerCase() === key);
        if (exact) {
            result = {
                word: exact.word,
                phonetic: exact.phonetic || '',
                pos: _extractPos(exact.pos, exact.meaning),
                meaning: _cleanMeaning(exact.meaning),
                example: exact.example_sentence || '',
                example_vi: '',
                source: 'database',
                entries: [{
                    meaning: _cleanMeaning(exact.meaning),
                    pos: _extractPos(exact.pos, exact.meaning),
                    example: exact.example_sentence || '',
                    example_vi: ''
                }]
            };
        }
    } catch (_) {}

    // Tầng 3: Nếu KHÔNG có trong Database -> Fallback sang Cloudflare KV & DeepSeek AI
    if (!result) {
        try {
            const res = await _fetchWithTimeout(DICT_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ word: cleanWord })
            }, 25000);

            if (res && res.ok) {
                const json = await res.json();
                if (json.ok && json.data) {
                    result = _normalizeEntry(json.data, json.source || 'cloudflare_api');
                }
            }
        } catch (err) {
            console.warn('[Dictionary] Fallback API error:', err);
        }
    }

    if (result) {
        _memoryCache.set(key, result);
        _saveToIndexedDB(key, result);
        addRecentSearch(result.word || cleanWord);
        return result;
    }

    return null;
}

// ─────────────────────────────────────────────────────────────
// 4. QUẢN LÝ TỪ VỪA TRA GẦN ĐÂY
// ─────────────────────────────────────────────────────────────
export function getRecentSearches() {
    if (typeof localStorage === 'undefined') return [];
    try {
        return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    } catch (_) {
        return [];
    }
}

export function addRecentSearch(word) {
    if (!word || typeof localStorage === 'undefined') return;
    try {
        let list = getRecentSearches();
        list = [word, ...list.filter(w => w.toLowerCase() !== word.toLowerCase())].slice(0, 10);
        localStorage.setItem(RECENT_KEY, JSON.stringify(list));
    } catch (_) {}
}

export function removeRecentSearch(word) {
    if (!word || typeof localStorage === 'undefined') return;
    try {
        let list = getRecentSearches();
        list = list.filter(w => w.toLowerCase() !== word.toLowerCase());
        localStorage.setItem(RECENT_KEY, JSON.stringify(list));
    } catch (_) {}
}

export function clearRecentSearches() {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.removeItem(RECENT_KEY);
    } catch (_) {}
}

// Tương thích ngược
if (typeof window !== 'undefined') {
    window.HiDict = {
        lookupWord,
        getRecentSearches,
        removeRecentSearch,
        clearRecentSearches
    };
}

export default {
    lookupWord,
    getRecentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches
};
