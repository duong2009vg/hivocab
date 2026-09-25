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
    // 3. TẦNG 2: ƯU TIÊN TRA CỨU TRỰC TIẾP TỪ DATABASE 70.000 TỪ
    //    (0 AI Tokens - Hoàn toàn miễn phí & phản hồi tức thì)
    // ─────────────────────────────────────────────────────────────
    const SB_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3ZWhkdHJxanlrbG1zZWZramRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTc4MDcsImV4cCI6MjA5Mzk3MzgwN30.dXRhEmvS8J21aJ3dwZ4jHaWuKbhNw2yys90YTIop2EU';
    const SB_URL = 'https://swehdtrqjyklmsefkjdf.supabase.co/rest/v1/words';

    function _extractPos(rawPos, rawMeaning) {
        if (rawPos && typeof rawPos === 'string' && rawPos.trim()) return rawPos.trim().toLowerCase();
        if (!rawMeaning || typeof rawMeaning !== 'string') return 'từ vựng';
        const m = rawMeaning.match(/^\(([a-zA-Z\s]+)\)/);
        if (m && m[1]) {
            const tag = m[1].toLowerCase().trim();
            if (tag === 'v') return 'verb';
            if (tag === 'n') return 'noun';
            if (tag === 'adj') return 'adjective';
            if (tag === 'adv') return 'adverb';
            if (tag === 'prep') return 'preposition';
            if (tag === 'conj') return 'conjunction';
            return tag;
        }
        return 'từ vựng';
    }

    function _cleanMeaning(rawMeaning) {
        if (!rawMeaning || typeof rawMeaning !== 'string') return '';
        return rawMeaning.replace(/^(\([a-zA-Z\s]+\)|\[[a-zA-Z\s]+\])\s*/, '').trim();
    }

    function _formatDatabaseEntries(cleanWord, list) {
        if (!list || list.length === 0) return null;

        const main = list.find(w => w.phonetic && w.example_sentence) || list[0];
        const phonetic = list.find(w => w.phonetic)?.phonetic || main.phonetic || '';
        const pos = _extractPos(main.pos, main.meaning);
        const meaning = _cleanMeaning(main.meaning);
        const example = main.example_sentence || list.find(w => w.example_sentence)?.example_sentence || '';

        // Thu thập các nét nghĩa khác nhau nếu có nhiều dòng trong database
        const distinctEntries = [];
        const seenMeanings = new Set();
        for (const item of list) {
            const mClean = _cleanMeaning(item.meaning);
            if (mClean && !seenMeanings.has(mClean.toLowerCase())) {
                seenMeanings.add(mClean.toLowerCase());
                distinctEntries.push({
                    meaning: mClean,
                    pos: _extractPos(item.pos, item.meaning),
                    example: item.example_sentence || '',
                    example_vi: ''
                });
            }
        }

        const entries = distinctEntries.length > 0 ? distinctEntries : [{ meaning, pos, example, example_vi: '' }];

        return {
            word: main.word || cleanWord,
            phonetic: phonetic,
            pos: pos,
            meaning: meaning,
            example: example,
            example_vi: '',
            entries: entries,
            source: 'database',
            viSummary: meaning,
            senses: entries.map((e, idx) => ({
                id: idx + 1,
                grammar: e.pos ? `[ ${e.pos} ]` : '',
                definition_vi: e.meaning,
                examples: e.example ? [{ en: e.example, vi: '' }] : []
            }))
        };
    }

    async function _lookupAppDatabase(cleanWord) {
        if (!cleanWord) return null;
        try {
            // 1. Thử dùng client HiDB nếu có
            if (typeof window !== 'undefined' && window.HiDB && typeof window.HiDB.getClient === 'function') {
                const client = window.HiDB.getClient();
                if (client) {
                    const { data, error } = await client
                        .from('words')
                        .select('id, word, meaning, pos, phonetic, example_sentence')
                        .ilike('word', cleanWord)
                        .limit(5);
                    if (!error && Array.isArray(data) && data.length > 0) {
                        return _formatDatabaseEntries(cleanWord, data);
                    }
                }
            }

            // 2. Direct REST API (nhanh 30ms - 60ms)
            const endpoint = `${SB_URL}?word=ilike.${encodeURIComponent(cleanWord)}&select=id,word,meaning,pos,phonetic,example_sentence&limit=5`;
            const res = await _fetchWithTimeout(endpoint, {
                headers: {
                    'apikey': SB_ANON_KEY,
                    'Authorization': `Bearer ${SB_ANON_KEY}`
                }
            }, 3500);

            if (res && res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    return _formatDatabaseEntries(cleanWord, data);
                }
            }
        } catch (err) {
            console.warn('[HiDict] Database lookup error:', err);
        }
        return null;
    }

    // ─────────────────────────────────────────────────────────────
    // 4. CHUẨN HÓA DỮ LIỆU ĐẦU RA (TỐI GIẢN: NGHĨA VIỆT, IPA, VÍ DỤ)
    // ─────────────────────────────────────────────────────────────
    function _normalizeEntry(raw, source = 'api') {
        if (!raw) return null;

        const meaning = raw.meaning || raw.viSummary || raw.senses?.[0]?.definition_vi || '';
        const phonetic = raw.phonetic || raw.phonetics?.us || raw.phonetics?.uk || '';
        const example = raw.example || raw.senses?.[0]?.examples?.[0]?.en || '';
        const exampleVi = raw.example_vi || raw.senses?.[0]?.examples?.[0]?.vi || '';
        const pos = raw.pos || 'từ vựng';

        const entries = (Array.isArray(raw.entries) && raw.entries.length > 0)
            ? raw.entries
            : (Array.isArray(raw.senses) && raw.senses.length > 0)
                ? raw.senses.map(s => ({
                    meaning: s.definition_vi || s.definition_en || '',
                    pos: s.grammar ? s.grammar.replace(/[\[\]]/g, '').trim() : pos,
                    example: s.examples?.[0]?.en || '',
                    example_vi: s.examples?.[0]?.vi || ''
                }))
                : [{ meaning, pos, example, example_vi: exampleVi }];

        return {
            word: raw.word || '',
            phonetic: phonetic,
            pos: pos,
            meaning: meaning,
            example: example,
            example_vi: exampleVi,
            entries: entries,
            source: source,
            viSummary: meaning,
            senses: entries.map((e, idx) => ({
                id: idx + 1,
                grammar: e.pos ? `[ ${e.pos} ]` : '',
                definition_vi: e.meaning,
                examples: e.example ? [{ en: e.example, vi: e.example_vi || '' }] : []
            }))
        };
    }

    // ─────────────────────────────────────────────────────────────
    // 5. TRA TỪ (LOOKUP ENTRY - DATABASE -> KV -> AI FALLBACK)
    // ─────────────────────────────────────────────────────────────
    async function lookupWord(word) {
        if (!word?.trim()) return null;
        const cleanWord = word.trim();
        const key = cleanWord.toLowerCase();

        // Tầng 1A: In-memory Cache (0ms)
        if (_memoryCache.has(key)) {
            const cached = _memoryCache.get(key);
            _addRecent(cached.word || cleanWord);
            return cached;
        }

        // Tầng 1B: IndexedDB Cache (5ms - 15ms)
        const idbData = await _loadFromIndexedDB(key);
        if (idbData && idbData.word) {
            _memoryCache.set(key, idbData);
            _addRecent(idbData.word || cleanWord);
            return idbData;
        }

        // Tầng 2: Ưu tiên tối đa Database 70.000 từ của App (0 AI cost, 0 token, cực nhanh ~50ms)
        let result = await _lookupAppDatabase(cleanWord);

        // Tầng 3: Nếu KHÔNG có trong Database -> Fallback sang Cloudflare KV & Lightweight AI
        if (!result) {
            try {
                const res = await _fetchWithTimeout(DICT_API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ word: cleanWord })
                }, 6000);

                if (res && res.ok) {
                    const json = await res.json();
                    if (json.ok && json.data) {
                        result = _normalizeEntry(json.data, json.source || 'cloudflare_api');
                    }
                }
            } catch (err) {
                console.warn('[HiDict] Fallback API error:', err);
            }
        }

        if (result) {
            _memoryCache.set(key, result);
            _saveToIndexedDB(key, result);
            _addRecent(result.word || cleanWord);
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
