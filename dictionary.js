// ============================================================
// HI - DICTIONARY  |  dictionary.js
// ============================================================
// Wrapper cho Free Dictionary API + Groq AI dịch sang tiếng Việt.
//
// API public:
//   await HiDict.lookupWord('serendipity')
//   → { word, phonetic, audioUrl, meanings, synonyms,
//       viSummary,      // nghĩa tiếng Việt ngắn gọn
//       viMeanings }    // [{ partOfSpeech, viDefinitions: ['...'] }]
//   → null nếu không tìm thấy
//
//   await HiDict.playWordAudio('serendipity')
//   → phát âm chuẩn nếu có audio URL, fallback sang Web Speech API
// ============================================================

const HiDict = (() => {

    const DICT_URL  = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
    const GROQ_URL  = '/api/groq';
    const GROQ_MODEL = 'llama-3.1-8b-instant';   // nhanh, miễn phí

    // Cache kết quả tra (bao gồm bản dịch) để không gọi API lặp lại
    const _cache = new Map();

    // Audio element dùng chung
    let _audioEl = null;

    // --------------------------------------------------------
    // GROQ TRANSLATION
    // --------------------------------------------------------

    /**
     * Dịch toàn bộ nghĩa của một từ sang tiếng Việt qua Groq AI.
     * Gọi 1 lần duy nhất, nhận JSON có cấu trúc.
     *
     * @param {string} word       - từ tiếng Anh
     * @param {Array}  meanings   - mảng meaning object từ Free Dictionary
     * @returns {Promise<{ viSummary: string, viMeanings: Array }|null>}
     */
    async function _translateWithGroq(word, meanings) {
        try {
            // Nén danh sách định nghĩa thành text gọn để gửi lên
            const defLines = [];
            meanings.forEach((m, mi) => {
                m.definitions.forEach((d, di) => {
                    defLines.push(`[${mi}-${di}][${m.partOfSpeech}] ${d.definition}`);
                });
            });

            const prompt = `You are a Vietnamese dictionary assistant. Translate the following English word and its definitions into Vietnamese.

Word: "${word}"

Definitions:
${defLines.join('\n')}

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "viSummary": "nghĩa ngắn gọn nhất bằng tiếng Việt (1 dòng)",
  "viDefinitions": {
    "0-0": "dịch định nghĩa [0-0] sang tiếng Việt",
    "0-1": "dịch định nghĩa [0-1] sang tiếng Việt"
  }
}

Rules:
- viSummary: 1 short line capturing the core meaning in Vietnamese
- viDefinitions: translate each [mi-di] key's definition to natural Vietnamese
- Keep translations concise and natural, not word-by-word
- Do not include the word itself in viSummary`;

            const res = await fetch(GROQ_URL, {
                method: 'POST',
                headers: {
                    'Content-Type':  'application/json',
                },
                body: JSON.stringify({
                    model:       GROQ_MODEL,
                    messages:    [{ role: 'user', content: prompt }],
                    temperature: 0.1,
                    max_tokens:  800,
                }),
            });

            if (!res.ok) {
                console.warn('[HiDict] Groq API error:', res.status);
                return null;
            }

            const json    = await res.json();
            const content = json.choices?.[0]?.message?.content?.trim();
            if (!content) return null;

            // Parse JSON từ response (loại bỏ markdown nếu có)
            const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
            const parsed  = JSON.parse(cleaned);

            // Map viDefinitions về cùng cấu trúc meanings
            const viMeanings = meanings.map((m, mi) => ({
                partOfSpeech:  m.partOfSpeech,
                viDefinitions: m.definitions.map((_, di) =>
                    parsed.viDefinitions?.[`${mi}-${di}`] || ''
                ),
            }));

            return {
                viSummary: parsed.viSummary || '',
                viMeanings,
            };

        } catch (err) {
            console.warn('[HiDict] Lỗi Groq translate:', err);
            return null;
        }
    }

    // --------------------------------------------------------
    // LOOKUP
    // --------------------------------------------------------

    /**
     * Tra từ điển tiếng Anh và dịch nghĩa sang tiếng Việt.
     *
     * @param {string} word
     * @returns {Promise<Object|null>}
     *   {
     *     word,           // từ gốc
     *     phonetic,       // /foʊˈnɛtɪk/
     *     audioUrl,       // URL file .mp3 phát âm (có thể null)
     *     meanings: [     // nghĩa tiếng Anh
     *       { partOfSpeech, definitions: [{ definition, example, synonyms }] }
     *     ],
     *     synonyms,       // mảng string (top 6)
     *     viSummary,      // nghĩa tiếng Việt ngắn gọn (từ Groq)
     *     viMeanings: [   // bản dịch từng nghĩa
     *       { partOfSpeech, viDefinitions: ['...', ...] }
     *     ],
     *   }
     */
    async function lookupWord(word) {
        if (!word || !word.trim()) return null;
        const key = word.trim().toLowerCase();

        // Free Dictionary API chỉ hỗ trợ từ đơn — bỏ qua cụm từ nhiều chữ
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

            // Audio URL (ưu tiên US accent)
            let audioUrl = null;
            if (entry.phonetics) {
                const withAudio = entry.phonetics.filter(p => p.audio);
                const us = withAudio.find(p => p.audio.includes('-us.'));
                audioUrl = (us || withAudio[0])?.audio || null;
            }

            // Parse meanings (tiếng Anh)
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

            const result = {
                word:     entry.word,
                phonetic,
                audioUrl,
                meanings,
                synonyms: [...allSynonyms].slice(0, 6),
                viSummary:  null,
                viMeanings: null,
            };

            // Lưu tạm vào cache (chưa có bản dịch) để playAudio không bị block
            _cache.set(key, result);

            // Gọi Groq dịch tiếng Việt (không block render)
            _translateWithGroq(entry.word, meanings).then(vi => {
                if (vi) {
                    result.viSummary  = vi.viSummary;
                    result.viMeanings = vi.viMeanings;
                    // Cập nhật cache
                    _cache.set(key, result);
                }
            });

            return result;

        } catch (err) {
            console.warn('[HiDict] Lỗi fetch:', err);
            return null;
        }
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
        // Cụm từ nhiều chữ không có trong từ điển — dùng TTS trực tiếp
        const isSingleWord = word && !word.trim().includes(' ');

        if (isSingleWord) {
            const result = await lookupWord(word);
            if (result?.audioUrl) {
                try {
                    if (!_audioEl) _audioEl = new Audio();
                    _audioEl.pause();
                    _audioEl.src = result.audioUrl;
                    await _audioEl.play();
                    return;
                } catch (_) { /* fallback */ }
            }
        }

        // Fallback: Web Speech API
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance(word);
            utter.lang  = 'en-US';
            utter.rate  = rate;
            const trySpeak = () => {
                const voices = speechSynthesis.getVoices();
                const v = voices.find(v => v.lang === 'en-US' && !v.localService)
                       || voices.find(v => v.lang === 'en-US')
                       || voices.find(v => v.lang.startsWith('en'));
                if (v) utter.voice = v;
                speechSynthesis.speak(utter);
            };
            if (speechSynthesis.getVoices().length > 0) trySpeak();
            else speechSynthesis.addEventListener('voiceschanged', trySpeak, { once: true });
        }
    }

    // --------------------------------------------------------

    /** Xoá cache (dùng khi test). */
    function clearCache() { _cache.clear(); }

    return { lookupWord, playWordAudio, clearCache };

})();
