// ============================================================
// HI - VOCABULARY DICTIONARY ENGINE  |  dictionary.js
// ============================================================
// Tầng 1: IndexedDB & In-memory Cache trên thiết bị (0ms - 10ms)
// Tầng 2: Cloudflare KV & Edge Cache qua /api/dictionary (20ms - 50ms)
// Tầng 3: High-Speed AI Engine (Groq Llama 3.3 / DeepSeek CKEY) (< 350ms)
// Tầng 4: Supabase 70.000 từ vựng Offline Fallback
// ============================================================

const HiDict = (() => {

    const DICT_API_URL = '/api/dictionary';
    const RECENT_KEY = 'hi_dict_recent_searches';
    const DB_NAME = 'HiVocab_Dictionary_DB';
    const DB_STORE = 'word_entries';
    const DB_VERSION = 1;

    const _memoryCache = new Map();
    let _idb = null;
    let _voices = [];

    // Khởi tạo và nạp trước danh sách giọng phát âm
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        const loadVoices = () => {
            _voices = window.speechSynthesis.getVoices();
        };
        loadVoices();
        window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
        window.addEventListener('pointerdown', loadVoices, { once: true });
    }

    // ─────────────────────────────────────────────────────────────
    // 1. INDEXEDDB LOCAL STORAGE (LƯU TẠI THIẾT BỊ NGƯỜI DÙNG)
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

    // ─────────────────────────────────────────────────────────────
    // 2. HELPER FETCH CÓ TIMEOUT
    // ─────────────────────────────────────────────────────────────
    async function _fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
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
    // 3. FALLBACK: TẬN DỤNG 70.000 TỪ SUPABASE NẾU API NGOÀI LỖI
    // ─────────────────────────────────────────────────────────────
    async function _lookupSupabaseFallback(term) {
        try {
            if (typeof window !== 'undefined' && window.HiDB && typeof window.HiDB.searchWords === 'function') {
                const res = await window.HiDB.searchWords(term);
                if (res && res.length > 0) {
                    const match = res.find(w => w.word?.toLowerCase() === term.toLowerCase()) || res[0];
                    return _normalizeEntry({
                        word: match.word || term,
                        cefr: 'B1',
                        pos: match.pos || 'vocabulary',
                        phonetics: { uk: match.phonetic || '', us: match.phonetic || '' },
                        senses: [{
                            id: 1,
                            grammar: match.pos ? `[ ${match.pos} ]` : '',
                            definition_en: match.meaning || '',
                            definition_vi: match.meaning || '',
                            examples: match.example_sentence ? [{ en: match.example_sentence, vi: '' }] : []
                        }],
                        collocations: [],
                        word_family: {},
                        synonyms: []
                    }, 'supabase_offline');
                }
            }
        } catch (_) {}
        return null;
    }

    // ─────────────────────────────────────────────────────────────
    // 4. CHUẨN HÓA DỮ LIỆU ĐẦU RA (TƯƠNG THÍCH MỚI + CŨ)
    // ─────────────────────────────────────────────────────────────
    function _normalizeEntry(raw, source = 'api') {
        if (!raw) return null;

        const senses = Array.isArray(raw.senses) ? raw.senses : [];
        const firstSense = senses[0] || {};
        const firstExample = firstSense.examples?.[0] || {};

        // Chuẩn hóa phát âm
        const phoneticUk = raw.phonetics?.uk || raw.phonetic || '';
        const phoneticUs = raw.phonetics?.us || raw.phonetics?.uk || raw.phonetic || '';

        // Tương thích ngược với các module cũ
        const viSummary = firstSense.definition_vi || raw.meaning || '';
        const exampleEn = firstExample.en || raw.example || '';

        // Tạo cấu trúc meanings tương thích cũ
        const legacyMeanings = [{
            partOfSpeech: raw.pos || 'vocabulary',
            definitions: senses.map(s => ({
                definition: s.definition_en || s.definition_vi || '',
                example: s.examples?.[0]?.en || '',
                synonyms: (raw.synonyms || []).slice(0, 4)
            }))
        }];

        return {
            // Trường mới chuẩn cấu trúc từ điển hiện đại
            word: raw.word || '',
            cefr: raw.cefr ? String(raw.cefr).toUpperCase() : null,
            pos: raw.pos || 'vocabulary',
            phonetics: {
                uk: phoneticUk,
                us: phoneticUs
            },
            senses: senses.map((s, idx) => ({
                id: s.id || (idx + 1),
                grammar: s.grammar || '',
                definition_en: s.definition_en || '',
                definition_vi: s.definition_vi || '',
                examples: Array.isArray(s.examples) ? s.examples : []
            })),
            collocations: Array.isArray(raw.collocations) ? raw.collocations : [],
            word_family: raw.word_family || {},
            synonyms: Array.isArray(raw.synonyms) ? raw.synonyms : [],
            antonyms: Array.isArray(raw.antonyms) ? raw.antonyms : [],
            source: source,

            // Trường tương thích ngược (Legacy fields)
            phonetic: phoneticUs || phoneticUk,
            viSummary: viSummary,
            meanings: legacyMeanings,
            example: exampleEn,
            hasRealExample: !!exampleEn,
            viMeanings: null
        };
    }

    // ─────────────────────────────────────────────────────────────
    // 5. TRA TỪ (LOOKUP ENTRY)
    // ─────────────────────────────────────────────────────────────
    async function lookupWord(word) {
        if (!word?.trim()) return null;
        const key = word.trim().toLowerCase();

        // Tầng 1A: In-memory Cache (0ms)
        if (_memoryCache.has(key)) {
            const cached = _memoryCache.get(key);
            _addRecent(cached.word || word.trim());
            return cached;
        }

        // Tầng 1B: IndexedDB Cache (5ms - 15ms)
        const idbData = await _loadFromIndexedDB(key);
        if (idbData && idbData.word) {
            _memoryCache.set(key, idbData);
            _addRecent(idbData.word || word.trim());
            return idbData;
        }

        // Tầng 2 & 3: Cloudflare KV / Edge Cache & High-Speed AI
        let result = null;
        try {
            const res = await _fetchWithTimeout(DICT_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ word: word.trim() })
            }, 8500);

            if (res && res.ok) {
                const json = await res.json();
                if (json.ok && json.data) {
                    result = _normalizeEntry(json.data, json.source || 'cloudflare_api');
                }
            }
        } catch (err) {
            console.warn('[HiDict] Dictionary API fetch error:', err);
        }

        // Tầng 4: Supabase Fallback nếu mạng yếu hoặc lỗi API
        if (!result) {
            result = await _lookupSupabaseFallback(key);
        }

        if (result) {
            _memoryCache.set(key, result);
            _saveToIndexedDB(key, result);
            _addRecent(result.word || word.trim());
            return result;
        }

        return null;
    }

    // ─────────────────────────────────────────────────────────────
    // 6. PHÁT ÂM KÉP: ANH - ANH (UK 🇬🇧) & ANH - MỸ (US 🇺🇸)
    // ─────────────────────────────────────────────────────────────
    function _speakTTS(text, lang = 'en-US', rate = 0.9) {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();

        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = lang;
        utter.rate = rate;

        const isUK = lang.toLowerCase().includes('gb') || lang.toLowerCase().includes('uk');
        let voice = null;

        if (isUK) {
            voice = _voices.find(v => v.lang.replace('_', '-').toLowerCase().startsWith('en-gb'))
                 || _voices.find(v => v.name.includes('UK') || v.name.includes('British') || v.name.includes('English (United Kingdom)'));
        } else {
            voice = _voices.find(v => v.lang.replace('_', '-').toLowerCase().startsWith('en-us') && !v.localService)
                 || _voices.find(v => v.lang.replace('_', '-').toLowerCase().startsWith('en-us'))
                 || _voices.find(v => v.name.includes('US') || v.name.includes('United States'));
        }

        if (!voice) {
            voice = _voices.find(v => v.lang.startsWith('en'));
        }

        if (voice) utter.voice = voice;
        window.speechSynthesis.speak(utter);
    }

    function playWordAudio(word, rate = 0.9) {
        if (!word?.trim()) return;
        const cleanWord = word.trim();

        // 1. Ưu tiên HiAudio engine đã tối ưu zero-latency và iOS Safari
        if (typeof window !== 'undefined' && window.HiAudio && typeof window.HiAudio.playWord === 'function') {
            window.HiAudio.playWord(cleanWord, rate);
            return;
        }

        // 2. HTML5 Audio Stream tốc độ cao (<50ms CDN)
        try {
            const audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(cleanWord)}&type=2`;
            const a = new Audio(audioUrl);
            a.playbackRate = rate;
            a.onerror = () => _speakTTS(cleanWord, 'en-US', rate);
            const p = a.play();
            if (p && typeof p.catch === 'function') {
                p.catch(() => _speakTTS(cleanWord, 'en-US', rate));
            }
            return;
        } catch (_) {}

        // 3. Fallback tức thì: Web Speech API (0ms latency)
        _speakTTS(cleanWord, 'en-US', rate);
    }

    async function playUK(word, customUrl = null) {
        if (!word?.trim()) return;
        const cleanWord = word.trim();

        if (customUrl) {
            try {
                const a = new Audio(customUrl);
                await a.play();
                return;
            } catch (_) {}
        }

        try {
            const a = new Audio(`https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(cleanWord)}&type=1`);
            a.onerror = () => _speakTTS(cleanWord, 'en-GB', 0.9);
            const p = a.play();
            if (p && typeof p.catch === 'function') {
                p.catch(() => _speakTTS(cleanWord, 'en-GB', 0.9));
            }
            return;
        } catch (_) {}

        _speakTTS(cleanWord, 'en-GB', 0.9);
    }

    async function playUS(word, customUrl = null) {
        if (!word?.trim()) return;
        const cleanWord = word.trim();

        if (customUrl) {
            try {
                const a = new Audio(customUrl);
                await a.play();
                return;
            } catch (_) {}
        }

        playWordAudio(cleanWord, 0.9);
    }

    // ─────────────────────────────────────────────────────────────
    // 7. QUẢN LÝ TỪ VỪA TRA GẦN ĐÂY (RECENT SEARCHES)
    // ─────────────────────────────────────────────────────────────
    function getRecentSearches() {
        if (typeof localStorage === 'undefined') return [];
        try {
            return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
        } catch (_) {
            return [];
        }
    }

    function _addRecent(word) {
        if (!word || typeof localStorage === 'undefined') return;
        try {
            let list = getRecentSearches();
            list = [word, ...list.filter(w => w.toLowerCase() !== word.toLowerCase())].slice(0, 10);
            localStorage.setItem(RECENT_KEY, JSON.stringify(list));
            if (typeof window !== 'undefined' && typeof window.dictRenderRecent === 'function') {
                window.dictRenderRecent();
            }
        } catch (_) {}
    }

    function removeRecentSearch(word) {
        if (!word || typeof localStorage === 'undefined') return;
        try {
            let list = getRecentSearches();
            list = list.filter(w => w.toLowerCase() !== word.toLowerCase());
            localStorage.setItem(RECENT_KEY, JSON.stringify(list));
            if (typeof window !== 'undefined' && typeof window.dictRenderRecent === 'function') {
                window.dictRenderRecent();
            }
        } catch (_) {}
    }

    function clearRecentSearches() {
        if (typeof localStorage === 'undefined') return;
        try {
            localStorage.removeItem(RECENT_KEY);
            if (typeof window !== 'undefined' && typeof window.dictRenderRecent === 'function') {
                window.dictRenderRecent();
            }
        } catch (_) {}
    }

    function clearCache() {
        _memoryCache.clear();
    }

    return {
        lookupWord,
        playUK,
        playUS,
        playWordAudio,
        getRecentSearches,
        removeRecentSearch,
        clearRecentSearches,
        clearCache
    };
})();
