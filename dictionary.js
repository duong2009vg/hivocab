// ============================================================
// HI - DICTIONARY  |  dictionary.js
// ============================================================
// Wrapper cho Free Dictionary API + Groq AI dá»‹ch sang tiáº¿ng Viá»‡t.
//
// API public:
//   await HiDict.lookupWord('serendipity')
//   â†’ { word, phonetic, audioUrl, meanings, synonyms,
//       viSummary,      // nghÄ©a tiáº¿ng Viá»‡t ngáº¯n gá»n
//       viMeanings }    // [{ partOfSpeech, viDefinitions: ['...'] }]
//   â†’ null náº¿u khÃ´ng tÃ¬m tháº¥y
//
//   await HiDict.playWordAudio('serendipity')
//   â†’ phÃ¡t Ã¢m chuáº©n náº¿u cÃ³ audio URL, fallback sang Web Speech API
// ============================================================

const HiDict = (() => {

    const DICT_URL  = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
    const TRANSLATE_URL = '/api/translate';
    // âš ï¸ Thay URL dÆ°á»›i Ä‘Ã¢y báº±ng domain proxy tháº­t cá»§a báº¡n trÃªn Vercel
    
    // Cache káº¿t quáº£ tra (bao gá»“m báº£n dá»‹ch) Ä‘á»ƒ khÃ´ng gá»i API láº·p láº¡i
    const _cache = new Map();

    // Audio element dÃ¹ng chung
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
    // GROQ TRANSLATION
    // --------------------------------------------------------

    /**
     * Dá»‹ch toÃ n bá»™ nghÄ©a cá»§a má»™t tá»« sang tiáº¿ng Viá»‡t qua Groq AI.
     * Gá»i 1 láº§n duy nháº¥t, nháº­n JSON cÃ³ cáº¥u trÃºc.
     *
     * @param {string} word       - tá»« tiáº¿ng Anh
     * @param {Array}  meanings   - máº£ng meaning object tá»« Free Dictionary
     * @returns {Promise<{ viSummary: string, viMeanings: Array }|null>}
     */
    async function _translateWithGoogle(word, meanings) {
        try {
            const definitionRefs = [];
            const texts = [word];
            meanings.forEach((m, mi) => {
                m.definitions.forEach((d, di) => {
                    definitionRefs.push({ mi, di });
                    texts.push(d.definition);
                });
            });

            const res = await fetch(TRANSLATE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ texts, from: 'en', to: 'vi' }),
            });

            if (!res.ok) {
                console.warn('[HiDict] Translate API error:', res.status);
                return null;
            }

            const json = await res.json();
            const translations = json.translations || [];
            if (!json.ok || !translations.length) return null;

            const viMeanings = meanings.map(m => ({
                partOfSpeech:  m.partOfSpeech,
                viDefinitions: m.definitions.map(() => ''),
            }));

            definitionRefs.forEach((ref, index) => {
                if (viMeanings[ref.mi]) {
                    viMeanings[ref.mi].viDefinitions[ref.di] = translations[index + 1] || '';
                }
            });

            return {
                viSummary: translations[0] || translations[1] || '',
                viMeanings,
            };

        } catch (err) {
            console.warn('[HiDict] Google translate error:', err);
            return null;
        }
    }

    /**
     * Tra tá»« Ä‘iá»ƒn tiáº¿ng Anh vÃ  dá»‹ch nghÄ©a sang tiáº¿ng Viá»‡t.
     *
     * @param {string} word
     * @returns {Promise<Object|null>}
     *   {
     *     word,           // tá»« gá»‘c
     *     phonetic,       // /foÊŠËˆnÉ›tÉªk/
     *     audioUrl,       // URL file .mp3 phÃ¡t Ã¢m (cÃ³ thá»ƒ null)
     *     meanings: [     // nghÄ©a tiáº¿ng Anh
     *       { partOfSpeech, definitions: [{ definition, example, synonyms }] }
     *     ],
     *     synonyms,       // máº£ng string (top 6)
     *     viSummary,      // nghÄ©a tiáº¿ng Viá»‡t ngáº¯n gá»n (tá»« Groq)
     *     viMeanings: [   // báº£n dá»‹ch tá»«ng nghÄ©a
     *       { partOfSpeech, viDefinitions: ['...', ...] }
     *     ],
     *   }
     */
    async function lookupWord(word) {
        if (!word || !word.trim()) return null;
        const key = word.trim().toLowerCase();

        // Free Dictionary API chá»‰ há»— trá»£ tá»« Ä‘Æ¡n â€” bá» qua cá»¥m tá»« nhiá»u chá»¯
        if (key.includes(' ')) return null;

        if (_cache.has(key)) return _cache.get(key);

        try {
            const res = await fetch(DICT_URL + encodeURIComponent(key));
            if (!res.ok) { _cache.set(key, null); return null; }

            const data = await res.json();
            if (!Array.isArray(data) || data.length === 0) {
                _cache.set(key, null);
                return null;
            }

            const entry = data[0];

            // Phonetic text
            let phonetic = entry.phonetic || '';
            if (!phonetic && entry.phonetics) {
                const ph = entry.phonetics.find(p => p.text);
                phonetic = ph?.text || '';
            }

            // Audio URL (Æ°u tiÃªn US accent)
            let audioUrl = null;
            if (entry.phonetics) {
                const withAudio = entry.phonetics.filter(p => p.audio);
                const us = withAudio.find(p => p.audio.includes('-us.'));
                audioUrl = (us || withAudio[0])?.audio || null;
            }

            // Parse meanings (tiáº¿ng Anh)
            const meanings = (entry.meanings || []).map(m => ({
                partOfSpeech: m.partOfSpeech,
                definitions:  (m.definitions || []).slice(0, 3).map(d => ({
                    definition: d.definition || '',
                    example:    d.example    || '',
                    synonyms:   (d.synonyms  || []).slice(0, 4),
                })),
            }));

            // Synonyms tá»•ng há»£p (top 6)
            const allSynonyms = new Set();
            meanings.forEach(m => m.definitions.forEach(d => d.synonyms.forEach(s => allSynonyms.add(s))));
            (entry.meanings || []).forEach(m => (m.synonyms || []).forEach(s => allSynonyms.add(s)));

            const result = {
                word:     entry.word,
                phonetic,
                audioUrl,
                meanings,
                synonyms: [...allSynonyms].slice(0, 6),
                viSummary:  null,
                viMeanings: null,
            };

            // LÆ°u táº¡m vÃ o cache (chÆ°a cÃ³ báº£n dá»‹ch) Ä‘á»ƒ playAudio khÃ´ng bá»‹ block
            _cache.set(key, result);

            // Gá»i Groq dá»‹ch tiáº¿ng Viá»‡t (khÃ´ng block render)
            _translateWithGoogle(entry.word, meanings).then(vi => {
                if (vi) {
                    result.viSummary  = vi.viSummary;
                    result.viMeanings = vi.viMeanings;
                    // Cáº­p nháº­t cache
                    _cache.set(key, result);
                }
            });

            return result;

        } catch (err) {
            console.warn('[HiDict] Lá»—i fetch:', err);
            return null;
        }
    }

    // --------------------------------------------------------
    // AUDIO
    // --------------------------------------------------------

    /**
     * PhÃ¡t Ã¢m tá»« â€” Æ°u tiÃªn audio URL tháº­t, fallback Web Speech API.
     *
     * @param {string} word
     * @param {number} rate  - tá»‘c Ä‘á»™ fallback TTS (0.5â€“1.0)
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

        if (isSingleWord && !_cache.has(key)) {
            lookupWord(word).then(result => {
                if (!result?.audioUrl) return;
                try {
                    if (!_audioEl) _audioEl = new Audio();
                    _audioEl.preload = 'auto';
                    _audioEl.src = result.audioUrl;
                    _audioEl.load();
                } catch (_) { /* ignore preload errors */ }
            });
        }
    }

    // --------------------------------------------------------

    /** XoÃ¡ cache (dÃ¹ng khi test). */
    function clearCache() { _cache.clear(); }

    return { lookupWord, playWordAudio, clearCache };

})();
