// ============================================================
// HI - DICTIONARY  |  dictionary.js
// ============================================================
// Wrapper cho DeepL (dịch chính) + Free Dictionary API (IPA/audio phụ).
//
// API public:
//   await HiDict.lookupWord('serendipity')
//   → { word, phonetic, audioUrl, meanings, synonyms,
//       viSummary,      // nghĩa tiếng Việt từ DeepL
//       viMeanings }    // null (không còn dùng)
//   → null nếu DeepL thực sự lỗi
//
//   await HiDict.playWordAudio('serendipity')
//   → phát âm chuẩn nếu có audio URL, fallback sang Web Speech API
// ============================================================

const HiDict = (() => {

    const DICT_URL      = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
    const TRANSLATE_URL = '/api/translate';

    // Cache kết quả tra (bao gồm bản dịch) để không gọi API lặp lại
    const _cache = new Map();

    // Audio element dùng chung
    let _audioEl = null;

    function _warmSpeechVoices() {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.getVoices();
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
        _warmSpeechVoices();
        window.speechSynthesis.addEventListener('voiceschanged', _warmSpeechVoices);
        window.addEventListener('pointerdown', _warmSpeechVoices, { once: true });
    }

    // --------------------------------------------------------
    // DEEPL TRANSLATION (nguồn chính)
    // --------------------------------------------------------

    /**
     * Dịch từ/cụm từ tiếng Anh sang tiếng Việt qua DeepL.
     *
     * @param {string} text  - từ hoặc cụm từ cần dịch
     * @returns {Promise<string|null>}  bản dịch hoặc null nếu lỗi
     */
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
            console.warn('[HiDict] DeepL translate error:', err);
            return null;
        }
    }

    // --------------------------------------------------------
    // FREE DICTIONARY (nguồn phụ — IPA, audio, ví dụ)
    // --------------------------------------------------------

    /**
     * Lấy dữ liệu từ Free Dictionary API.
     * Chỉ dùng để lấy IPA, audio URL, meanings (tiếng Anh), synonyms.
     * Không fail cả lookupWord nếu hàm này lỗi.
     *
     * @param {string} word  - từ đơn tiếng Anh
     * @returns {Promise<Object|null>}
     */
    async function _fetchDictionary(word) {
        try {
            const res = await fetch(DICT_URL + encodeURIComponent(word));
            if (!res.ok) return null;

            const data = await res.json();
            if (!Array.isArray(data) || data.length === 0) return null;

            const entry = data[0];

            // Phonetic text
            let phonetic = entry.phonetic || '';
            if (!phonetic && entry.phonetics) {
                const ph = entry.phonetics.find(p => p.text);
                phonetic = ph?.text || '';
            }

            // Audio URL (ưu tiên US accent)
            let audioUrl = null;
            if (entry.phonetics) {
                const withAudio = entry.phonetics.filter(p => p.audio);
                const us = withAudio.find(p => p.audio.includes('-us.'));
                audioUrl = (us || withAudio[0])?.audio || null;
            }

            // Meanings (tiếng Anh, giữ để hiển thị định nghĩa gốc)
            const meanings = (entry.meanings || []).map(m => ({
                partOfSpeech: m.partOfSpeech,
                definitions:  (m.definitions || []).slice(0, 3).map(d => ({
                    definition: d.definition || '',
                    example:    d.example    || '',
                    synonyms:   (d.synonyms  || []).slice(0, 4),
                })),
            }));

            // Synonyms tổng hợp (top 6)
            const allSynonyms = new Set();
            meanings.forEach(m => m.definitions.forEach(d => d.synonyms.forEach(s => allSynonyms.add(s))));
            (entry.meanings || []).forEach(m => (m.synonyms || []).forEach(s => allSynonyms.add(s)));

            return {
                word:     entry.word || word,
                phonetic,
                audioUrl,
                meanings,
                synonyms: [...allSynonyms].slice(0, 6),
            };
        } catch (err) {
            console.warn('[HiDict] Free Dictionary error:', err);
            return null;
        }
    }

    // --------------------------------------------------------
    // LOOKUP WORD (API chính)
    // --------------------------------------------------------

    /**
     * Tra từ — DeepL làm nguồn chính, Free Dictionary làm phụ.
     * Hỗ trợ từ đơn, cụm từ, slang, viết tắt.
     *
     * @param {string} word
     * @returns {Promise<Object|null>}
     *   {
     *     word,           // từ gốc
     *     phonetic,       // /foʊˈnɛtɪk/  (nếu có trong Dictionary)
     *     audioUrl,       // URL file .mp3 (có thể null)
     *     meanings: [     // nghĩa tiếng Anh từ Dictionary (có thể rỗng)
     *       { partOfSpeech, definitions: [{ definition, example, synonyms }] }
     *     ],
     *     synonyms,       // mảng string (top 6, có thể rỗng)
     *     viSummary,      // nghĩa tiếng Việt từ DeepL (luôn có nếu không lỗi)
     *     viMeanings,     // null (không còn dùng)
     *   }
     */
    async function lookupWord(word) {
        if (!word || !word.trim()) return null;
        const key = word.trim().toLowerCase();

        if (_cache.has(key)) return _cache.get(key);

        // 1. Dịch sang tiếng Việt qua DeepL (bắt buộc)
        const viSummary = await _translateWithDeepL(word.trim());
        if (!viSummary) {
            _cache.set(key, null);
            return null;
        }

        const result = {
            word:       word.trim(),
            phonetic:   '',
            audioUrl:   null,
            meanings:   [],
            synonyms:   [],
            viSummary,
            viMeanings: null,
        };

        // 2. Lấy thêm IPA/audio/meanings từ Free Dictionary (optional, chỉ từ đơn)
        if (!key.includes(' ')) {
            const dictData = await _fetchDictionary(key);
            if (dictData) {
                result.word     = dictData.word;
                result.phonetic = dictData.phonetic;
                result.audioUrl = dictData.audioUrl;
                result.meanings = dictData.meanings;
                result.synonyms = dictData.synonyms;
            }
        }

        _cache.set(key, result);
        return result;
    }

    // --------------------------------------------------------
    // AUDIO
    // --------------------------------------------------------

    /**
     * Phát âm từ — ưu tiên audio URL thật, fallback Web Speech API.
     *
     * @param {string} word
     * @param {number} rate  - tốc độ fallback TTS (0.5–1.0)
     */
    async function playWordAudio(word, rate = 0.9) {
        if (!word || !word.trim()) return;
        const key = word.trim().toLowerCase();
        const isSingleWord = !key.includes(' ');

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
        if (isSingleWord && cached?.audioUrl) {
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

    // --------------------------------------------------------

    /** Xoá cache (dùng khi test). */
    function clearCache() { _cache.clear(); }

    return { lookupWord, playWordAudio, clearCache };

})();
