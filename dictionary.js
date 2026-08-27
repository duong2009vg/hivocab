// ============================================================
// HI - DICTIONARY  |  dictionary.js
// ============================================================
// Flow:
//   DeepL     → dịch từ/cụm từ thẳng sang VI (luôn dùng, song song)
//   Free Dict → lấy IPA + audio + câu ví dụ EN (chỉ từ đơn, song song)
// ============================================================

const HiDict = (() => {

    const DICT_URL      = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
    const TRANSLATE_URL = '/api/translate';

    const _cache = new Map();
    let _audioEl = null;

    // Warm up voices
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.addEventListener('voiceschanged', () => window.speechSynthesis.getVoices());
        window.addEventListener('pointerdown', () => window.speechSynthesis.getVoices(), { once: true });
    }

    async function _fetchWithTimeout(url, options = {}, timeoutMs = 3500) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const res = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timer);
            return res;
        } catch (_) {
            clearTimeout(timer);
            return null;
        }
    }

    // --------------------------------------------------------
    // DeepL — dịch thẳng từ/cụm từ → VI
    // --------------------------------------------------------
    async function _translateWithDeepL(text) {
        try {
            const res = await _fetchWithTimeout(TRANSLATE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, from: 'en', to: 'vi' }),
            }, 4500);
            if (!res || !res.ok) return null;
            const json = await res.json();
            return (json.ok && json.text) ? json.text : null;
        } catch (err) {
            console.warn('[HiDict] DeepL error:', err);
            return null;
        }
    }

    // --------------------------------------------------------
    // Free Dictionary — IPA, audio, câu ví dụ (từ đơn)
    // --------------------------------------------------------
    async function _fetchDictionary(word) {
        try {
            const res = await _fetchWithTimeout(DICT_URL + encodeURIComponent(word), {}, 2500);
            if (!res || !res.ok) return null;
            const data = await res.json();
            if (!Array.isArray(data) || !data.length) return null;

            const entry = data[0];

            // IPA
            let phonetic = entry.phonetic || '';
            if (!phonetic && entry.phonetics) {
                phonetic = entry.phonetics.find(p => p.text)?.text || '';
            }

            // Audio URL (ưu tiên US)
            let audioUrl = null;
            if (entry.phonetics) {
                const withAudio = entry.phonetics.filter(p => p.audio);
                const us = withAudio.find(p => p.audio.includes('-us.'));
                audioUrl = (us || withAudio[0])?.audio || null;
            }

            // Meanings (top 3 per part-of-speech)
            const meanings = (entry.meanings || []).map(m => ({
                partOfSpeech: m.partOfSpeech,
                definitions: (m.definitions || []).slice(0, 3).map(d => ({
                    definition: d.definition || '',
                    example:    d.example    || '',
                    synonyms:   (d.synonyms  || []).slice(0, 4),
                })),
            }));

            // Tìm câu ví dụ tiếng Anh đầu tiên qua toàn bộ entries + meanings
            let example = '';
            outer: for (const e of data) {
                for (const m of (e.meanings || [])) {
                    for (const d of (m.definitions || [])) {
                        if (d.example && /[a-zA-Z]/.test(d.example)) {
                            example = d.example;
                            break outer;
                        }
                    }
                }
            }

            // Synonyms top 6
            const allSynonyms = new Set();
            meanings.forEach(m => m.definitions.forEach(d => (d.synonyms || []).forEach(s => allSynonyms.add(s))));
            (entry.meanings || []).forEach(m => (m.synonyms || []).forEach(s => allSynonyms.add(s)));

            return { word: entry.word || word, phonetic, audioUrl, meanings, synonyms: [...allSynonyms].slice(0, 6), example };
        } catch (err) {
            console.warn('[HiDict] Free Dictionary error:', err);
            return null;
        }
    }

    // --------------------------------------------------------
    // LOOKUP — song song DeepL + Free Dict
    // --------------------------------------------------------
    async function lookupWord(word) {
        if (!word?.trim()) return null;
        const key = word.trim().toLowerCase();
        if (_cache.has(key)) return _cache.get(key);

        const isPhrase = key.includes(' ');

        // Chạy song song: DeepL luôn chạy, Free Dict chỉ cho từ đơn
        const [viSummary, dictData] = await Promise.all([
            _translateWithDeepL(word.trim()),
            isPhrase ? Promise.resolve(null) : _fetchDictionary(key),
        ]);

        if (!viSummary && !dictData) { _cache.set(key, null); return null; }

        const fallbackExample = isPhrase
            ? `She used the phrase "${word.trim()}" in a sentence today.`
            : `She learned how to use "${word.trim()}" in a sentence today.`;

        const result = {
            word:       dictData?.word     || word.trim(),
            phonetic:   dictData?.phonetic || '',
            audioUrl:   dictData?.audioUrl || null,
            meanings:   dictData?.meanings || [],
            synonyms:   dictData?.synonyms || [],
            example:    dictData?.example  || fallbackExample,
            viSummary:  viSummary || null,
            viMeanings: null,
        };

        _cache.set(key, result);
        return result;
    }

    // --------------------------------------------------------
    // AUDIO — ưu tiên URL thật, fallback Web Speech API
    // --------------------------------------------------------
    async function playWordAudio(word, rate = 0.9) {
        if (!word?.trim()) return;
        const key = word.trim().toLowerCase();
        const cached = _cache.get(key);

        const speakTTS = () => {
            if (!window.speechSynthesis) return;
            window.speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance(word);
            utter.lang = 'en-US';
            utter.rate = rate;
            const voices = window.speechSynthesis.getVoices();
            const v = voices.find(v => v.lang === 'en-US' && !v.localService)
                   || voices.find(v => v.lang === 'en-US')
                   || voices.find(v => v.lang.startsWith('en'));
            if (v) utter.voice = v;
            window.speechSynthesis.speak(utter);
        };

        if (cached?.audioUrl) {
            try {
                if (!_audioEl) _audioEl = new Audio();
                _audioEl.pause();
                _audioEl.src = cached.audioUrl;
                await _audioEl.play();
                return;
            } catch (_) { /* fallback */ }
        }
        speakTTS();
    }

    function clearCache() { _cache.clear(); }

    return { lookupWord, playWordAudio, clearCache };
})();
