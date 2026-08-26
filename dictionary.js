// ============================================================
// HI - DICTIONARY  |  dictionary.js
// ============================================================
// Flow tra từ:
//   - Từ đơn: Free Dictionary API (IPA, định nghĩa EN, ví dụ)
//             → DeepL dịch định nghĩa EN sang tiếng Việt
//   - Từ ghép / cụm từ: DeepL dịch trực tiếp
//
// API public:
//   await HiDict.lookupWord('serendipity')
//   await HiDict.playWordAudio('serendipity')
// ============================================================

const HiDict = (() => {

    const DICT_URL      = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
    const TRANSLATE_URL = '/api/translate';

    const _cache = new Map();
    let _audioEl = null;

    // Warm up speech voices
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.addEventListener('voiceschanged', () => window.speechSynthesis.getVoices());
        window.addEventListener('pointerdown', () => window.speechSynthesis.getVoices(), { once: true });
    }

    // --------------------------------------------------------
    // DEEPL (dịch văn bản EN → VI)
    // --------------------------------------------------------

    async function _translateWithDeepL(text) {
        try {
            const res = await fetch(TRANSLATE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, from: 'en', to: 'vi' }),
            });
            if (!res.ok) return null;
            const json = await res.json();
            return (json.ok && json.text) ? json.text : null;
        } catch (err) {
            console.warn('[HiDict] DeepL error:', err);
            return null;
        }
    }

    // --------------------------------------------------------
    // FREE DICTIONARY API (từ đơn — IPA, định nghĩa, ví dụ)
    // --------------------------------------------------------

    async function _fetchDictionary(word) {
        try {
            const res = await fetch(DICT_URL + encodeURIComponent(word));
            if (!res.ok) return null;

            const data = await res.json();
            if (!Array.isArray(data) || data.length === 0) return null;

            const entry = data[0];

            // Phonetic
            let phonetic = entry.phonetic || '';
            if (!phonetic && entry.phonetics) {
                phonetic = entry.phonetics.find(p => p.text)?.text || '';
            }

            // Audio (ưu tiên US accent)
            let audioUrl = null;
            if (entry.phonetics) {
                const withAudio = entry.phonetics.filter(p => p.audio);
                const us = withAudio.find(p => p.audio.includes('-us.'));
                audioUrl = (us || withAudio[0])?.audio || null;
            }

            // Meanings + tìm câu ví dụ đầu tiên hợp lệ
            const meanings = (entry.meanings || []).map(m => ({
                partOfSpeech: m.partOfSpeech,
                definitions:  (m.definitions || []).slice(0, 3).map(d => ({
                    definition: d.definition || '',
                    example:    d.example    || '',
                    synonyms:   (d.synonyms  || []).slice(0, 4),
                })),
            }));

            // Câu ví dụ đầu tiên có nội dung (quét toàn bộ meanings)
            let example = '';
            for (const m of meanings) {
                for (const d of m.definitions) {
                    if (d.example) { example = d.example; break; }
                }
                if (example) break;
            }
            if (!example) {
                example = `She learned how to use "${word}" in a sentence today.`;
            }

            // Synonyms (top 6)
            const allSynonyms = new Set();
            meanings.forEach(m => m.definitions.forEach(d => d.synonyms.forEach(s => allSynonyms.add(s))));
            (entry.meanings || []).forEach(m => (m.synonyms || []).forEach(s => allSynonyms.add(s)));

            // Định nghĩa đầu tiên (tiếng Anh) để dịch sang tiếng Việt
            const firstDefinition = meanings[0]?.definitions?.[0]?.definition || '';

            return {
                word:            entry.word || word,
                phonetic,
                audioUrl,
                meanings,
                synonyms:        [...allSynonyms].slice(0, 6),
                example,
                firstDefinition, // sẽ dùng để dịch DeepL
            };
        } catch (err) {
            console.warn('[HiDict] Free Dictionary error:', err);
            return null;
        }
    }

    // --------------------------------------------------------
    // LOOKUP WORD — API chính
    // --------------------------------------------------------

    /**
     * Tra từ với flow tách biệt giữa từ đơn và từ ghép.
     *
     * Từ đơn:
     *   1. Gọi Free Dictionary → IPA, definitions (EN), example
     *   2. Dịch định nghĩa EN đầu tiên sang VI bằng DeepL → viSummary
     *   3. Nếu Free Dictionary thất bại → DeepL dịch thẳng từ
     *
     * Từ ghép / cụm từ:
     *   1. DeepL dịch trực tiếp cụm từ → viSummary
     *
     * @returns {Promise<Object|null>}
     */
    async function lookupWord(word) {
        if (!word || !word.trim()) return null;
        const key = word.trim().toLowerCase();

        if (_cache.has(key)) return _cache.get(key);

        const isPhrase = key.includes(' ');

        if (isPhrase) {
            // ── Từ ghép / cụm từ: DeepL dịch trực tiếp ──────────────
            const viSummary = await _translateWithDeepL(word.trim());
            if (!viSummary) { _cache.set(key, null); return null; }

            const result = {
                word:       word.trim(),
                phonetic:   '',
                audioUrl:   null,
                meanings:   [],
                synonyms:   [],
                example:    `She used the phrase "${word.trim()}" in a sentence today.`,
                viSummary,
                viMeanings: null,
            };
            _cache.set(key, result);
            return result;

        } else {
            // ── Từ đơn: Free Dictionary + DeepL dịch định nghĩa ─────
            const dictData = await _fetchDictionary(key);

            // Xác định văn bản sẽ dịch sang VI:
            //   ưu tiên định nghĩa EN đầu tiên, fallback là từ gốc
            const textToTranslate = dictData?.firstDefinition || word.trim();
            const viSummary = await _translateWithDeepL(textToTranslate);

            // Nếu cả hai đều thất bại → null
            if (!viSummary && !dictData) { _cache.set(key, null); return null; }

            const result = {
                word:       dictData?.word     || word.trim(),
                phonetic:   dictData?.phonetic || '',
                audioUrl:   dictData?.audioUrl || null,
                meanings:   dictData?.meanings || [],
                synonyms:   dictData?.synonyms || [],
                example:    dictData?.example  || `She learned how to use "${word.trim()}" in a sentence today.`,
                viSummary:  viSummary || null,
                viMeanings: null,
            };
            _cache.set(key, result);
            return result;
        }
    }

    // --------------------------------------------------------
    // AUDIO
    // --------------------------------------------------------

    async function playWordAudio(word, rate = 0.9) {
        if (!word || !word.trim()) return;
        const key = word.trim().toLowerCase();

        const speakNow = () => {
            if (!window.speechSynthesis) return;
            window.speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance(word);
            utter.lang  = 'en-US';
            utter.rate  = rate;
            const voices = window.speechSynthesis.getVoices();
            const v = voices.find(v => v.lang === 'en-US' && !v.localService)
                   || voices.find(v => v.lang === 'en-US')
                   || voices.find(v => v.lang.startsWith('en'));
            if (v) utter.voice = v;
            window.speechSynthesis.speak(utter);
        };

        const cached = _cache.get(key);
        if (cached?.audioUrl && !key.includes(' ')) {
            try {
                if (!_audioEl) _audioEl = new Audio();
                _audioEl.pause();
                _audioEl.src = cached.audioUrl;
                await _audioEl.play();
                return;
            } catch (_) { /* fallback */ }
        }

        speakNow();
    }

    function clearCache() { _cache.clear(); }

    return { lookupWord, playWordAudio, clearCache };

})();
