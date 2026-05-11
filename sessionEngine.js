// ============================================================
// HI - SESSION ENGINE  |  sessionEngine.js
// ============================================================
// Thuật toán quản lý phiên ôn tập:
//   - Mỗi phiên user phải trả lời ĐÚNG toàn bộ từ
//   - Trả lời SAI → chuyển sang dạng bài khác cho từ đó
//   - Trả lời ĐÚNG → từ được đánh dấu hoàn thành
//   - Kết thúc khi tất cả từ được trả lời đúng
//
// Phụ thuộc: dataLayer.js (HiDB phải load trước)
// ============================================================

const HiSession = (() => {

    // ----------------------------------------------------------
    // CONSTANTS
    // ----------------------------------------------------------

    const EXERCISE_TYPES = ['flashcard', 'mcq', 'fill', 'listen'];

    // Pool fallback cho MCQ khi session có ít hơn 4 từ
    const FALLBACK_DISTRACTORS = [
        'Sự kiên nhẫn',   'Trí tuệ nhân tạo', 'Cảm xúc sâu sắc',
        'Sức mạnh nội tâm','Niềm tin tuyệt đối','Hy vọng le lói',
        'Sự thật phũ phàng','Lòng dũng cảm',    'Sự thay đổi lớn',
        'Tự do tuyệt đối', 'Bình yên nội tâm',  'Hạnh phúc giản đơn',
        'Nỗi cô đơn',      'Sự ngạc nhiên',     'Trí tưởng tượng',
    ];

    // ----------------------------------------------------------
    // SESSION STATE (reset mỗi lần startSession)
    // ----------------------------------------------------------
    let _state = {
        allWords:    [],   // toàn bộ từ của phiên
        queue:       [],   // hàng chờ các exercise item
        queueIndex:  0,    // con trỏ vào queue
        completed:   [],   // [{ word, rating, attempts }]
        isActive:    false,
        allowedType: null, // nếu set, mọi item chỉ dùng dạng này (single-practice mode)
    };

    // ----------------------------------------------------------
    // UTILS
    // ----------------------------------------------------------

    function _shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function _randomFrom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    // ----------------------------------------------------------
    // EXERCISE TYPE SELECTION
    // ----------------------------------------------------------

    /**
     * Chọn ngẫu nhiên dạng bài KHÁC với những dạng đã dùng cho từ này.
     */
    function _pickNextType(usedTypes) {
        const available = EXERCISE_TYPES.filter(t => !usedTypes.includes(t));
        // Nếu đã dùng hết 4 dạng thì reset (cycle lại từ đầu)
        if (available.length === 0) {
            return _randomFrom(EXERCISE_TYPES);
        }
        return _randomFrom(available);
    }

    // ----------------------------------------------------------
    // EXERCISE DATA GENERATION
    // ----------------------------------------------------------

    /**
     * Tạo dữ liệu bài tập cho từng dạng.
     * @param {Object} word        - từ cần tạo bài
     * @param {string} type        - 'flashcard' | 'mcq' | 'fill' | 'listen'
     * @param {Array}  allWords    - toàn bộ từ trong phiên (để tạo MCQ distractor)
     * @returns {Object}           - exerciseData tương ứng
     */
    function _generateExerciseData(word, type, allWords) {
        switch (type) {

            // ── FLASHCARD ────────────────────────────────────────
            // Front: nghĩa tiếng Việt → User nhớ lại từ tiếng Anh
            // Back: từ tiếng Anh + phiên âm + nút Hard/Good/Easy
            case 'flashcard':
                return {
                    frontLabel:  'Dịch sang tiếng Anh',
                    frontWord:   word.meaning,
                    backLabel:   'Đáp án',
                    backWord:    word.word,
                    phonetic:    word.phonetic || '',
                };

            // ── MCQ ──────────────────────────────────────────────
            // Hiển thị từ tiếng Anh → chọn nghĩa tiếng Việt đúng
            case 'mcq': {
                const correctOption = { text: word.meaning, isCorrect: true };

                // Lấy distractors từ các từ khác trong session
                const others = allWords
                    .filter(w => w.wordId !== word.wordId)
                    .map(w => w.meaning);

                // Pad bằng fallback pool nếu không đủ 3 distractors
                const fallbackPool = FALLBACK_DISTRACTORS.filter(d => !others.includes(d));
                while (others.length < 3) {
                    others.push(fallbackPool.shift() || 'Không xác định');
                }

                const distractors = _shuffle(others)
                    .slice(0, 3)
                    .map(text => ({ text, isCorrect: false }));

                return {
                    question: `Chọn nghĩa đúng của`,
                    word:     word.word,
                    options:  _shuffle([correctOption, ...distractors]),
                };
            }

            // ── FILL IN BLANK ────────────────────────────────────
            // Hiển thị câu ví dụ có chỗ trống → điền từng chữ cái
            case 'fill': {
                let sentence = null;
                if (word.exampleSentence) {
                    // Thay từ trong câu bằng dấu gạch ngang (case-insensitive)
                    sentence = word.exampleSentence.replace(
                        new RegExp(`\\b${_escapeRegex(word.word)}\\b`, 'gi'),
                        '___'
                    );
                }
                return {
                    sentence,
                    // Hiển thị khi không có câu ví dụ
                    meaningHint: `Điền từ tiếng Anh có nghĩa: "${word.meaning}"`,
                    answer:      word.word,
                    letters:     word.word.replace(/\s/g, '').length, // bỏ khoảng trắng khi đếm
                    hasSpaces:   word.word.includes(' '),
                    // Dùng cho AI hint
                    aiContext: {
                        sentence:   word.exampleSentence || '',
                        answer:     word.word,
                        meaning:    word.meaning,
                    },
                };
            }

            // ── LISTEN ───────────────────────────────────────────
            // Phát âm thanh → user nhập lại từ nghe được
            case 'listen':
                return {
                    wordToSpeak: word.word,
                    answer:      word.word,
                    hint:        `Nghĩa: ${word.meaning}`,  // hiển thị sau lần nghe đầu
                    phonetic:    word.phonetic || '',
                };

            default:
                throw new Error(`[HiSession] Unknown exercise type: ${type}`);
        }
    }

    function _escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // ----------------------------------------------------------
    // QUEUE MANAGEMENT
    // ----------------------------------------------------------

    /** Tạo queue item ban đầu cho một từ */
    function _createQueueItem(word, forcedType = null) {
        const exerciseType = forcedType || _randomFrom(EXERCISE_TYPES);
        return {
            word,
            exerciseType,
            exerciseData: null,   // lazy-generated
            usedTypes:    [],
            attempts:     0,
        };
    }

    /** Generate exerciseData nếu chưa có (lazy) */
    function _ensureExerciseData(item) {
        if (!item.exerciseData) {
            item.exerciseData = _generateExerciseData(
                item.word,
                item.exerciseType,
                _state.allWords
            );
        }
    }

    // ----------------------------------------------------------
    // PUBLIC: KHỞI TẠO PHIÊN
    // ----------------------------------------------------------

    /**
     * Bắt đầu phiên ôn tập với danh sách từ.
     * @param {Array} words - từ HiDB.getWordsDueForReview()
     *   Mỗi phần tử: { wordId, word, phonetic, meaning, exampleSentence, level, ... }
     */
    function startSession(words, allowedType = null) {
        if (!words || words.length === 0) {
            throw new Error('[HiSession] Không có từ nào để ôn tập.');
        }

        _state = {
            allWords:    words,
            queue:       _shuffle(words).map(w => _createQueueItem(w, allowedType)),
            queueIndex:  0,
            completed:   [],
            isActive:    true,
            allowedType, // giữ lại để dùng khi trả lời sai
        };

        // Lazy-generate exercise data cho item đầu tiên ngay lập tức
        _ensureExerciseData(_state.queue[0]);

        console.log(`[HiSession] ✅ Phiên bắt đầu với ${words.length} từ.`);
    }

    // ----------------------------------------------------------
    // PUBLIC: ĐỌC STATE
    // ----------------------------------------------------------

    /**
     * Lấy exercise item hiện tại.
     * @returns {{ word, exerciseType, exerciseData, attempts } | null}
     */
    function getCurrentItem() {
        if (!_state.isActive) return null;
        if (_state.queueIndex >= _state.queue.length) return null;
        const item = _state.queue[_state.queueIndex];
        _ensureExerciseData(item);
        return item;
    }

    /**
     * Lấy tiến độ phiên học.
     * @returns {{ completed, total, percent, queueRemaining }}
     */
    function getProgress() {
        const total = _state.allWords.length;
        const completed = _state.completed.length;
        return {
            completed,
            total,
            percent:        total > 0 ? Math.round((completed / total) * 100) : 0,
            queueRemaining: _state.queue.length - _state.queueIndex,
        };
    }

    /** Kiểm tra phiên đã hoàn thành chưa. */
    function isComplete() {
        return _state.isActive &&
               _state.completed.length >= _state.allWords.length;
    }

    /** Lấy danh sách từ đã hoàn thành (để hiển thị kết quả). */
    function getCompletedWords() {
        return [..._state.completed];
    }

    // ----------------------------------------------------------
    // PUBLIC: SUBMIT ĐÁP ÁN
    // ----------------------------------------------------------

    /**
     * Kiểm tra đáp án cho MCQ, Fill-in-blank, Listen.
     * @param {string|number} userAnswer - đáp án của user
     *   - MCQ: index của option được chọn (0–3)
     *   - Fill/Listen: chuỗi ký tự nhập
     * @returns {{ correct: boolean, correctAnswer: string, feedback: string }}
     */
    function submitAnswer(userAnswer) {
        const item = getCurrentItem();
        if (!item) throw new Error('[HiSession] Không có bài tập hiện tại.');

        item.attempts++;

        let correct = false;
        let correctAnswer = item.exerciseData.answer || '';

        switch (item.exerciseType) {

            case 'mcq': {
                const selectedOption = item.exerciseData.options[userAnswer];
                correct = selectedOption?.isCorrect === true;
                correctAnswer = item.exerciseData.options
                    .find(o => o.isCorrect)?.text || '';
                break;
            }

            case 'fill': {
                // So sánh case-insensitive, bỏ qua khoảng trắng thừa
                const normalized = str => str.trim().toLowerCase().replace(/\s+/g, ' ');
                correct = normalized(String(userAnswer)) === normalized(item.exerciseData.answer);
                correctAnswer = item.exerciseData.answer;
                break;
            }

            case 'listen': {
                const normalized = str => str.trim().toLowerCase().replace(/\s+/g, ' ');
                correct = normalized(String(userAnswer)) === normalized(item.exerciseData.answer);
                correctAnswer = item.exerciseData.answer;
                break;
            }

            default:
                throw new Error(`[HiSession] submitAnswer không hỗ trợ type: ${item.exerciseType}`);
        }

        return _processResult(item, correct, correctAnswer);
    }

    /**
     * Đánh giá Flashcard.
     * @param {'easy'|'good'|'hard'} rating
     * @returns {{ correct: boolean, correctAnswer: string, feedback: string, rating: string }}
     */
    function rateFlashcard(rating) {
        const item = getCurrentItem();
        if (!item) throw new Error('[HiSession] Không có bài tập hiện tại.');
        if (item.exerciseType !== 'flashcard') {
            throw new Error('[HiSession] Item hiện tại không phải flashcard.');
        }

        item.attempts++;
        const correct = rating !== 'hard';
        const result = _processResult(item, correct, item.exerciseData.backWord, rating);
        return { ...result, rating };
    }

    // ----------------------------------------------------------
    // PRIVATE: XỬ LÝ KẾT QUẢ
    // ----------------------------------------------------------

    /**
     * Xử lý kết quả đúng/sai:
     *   ĐÚNG → đưa vào completed, gọi HiDB.reviewWord async
     *   SAI  → đổi dạng bài, đẩy xuống cuối queue
     */
    function _processResult(item, correct, correctAnswer, explicitRating = null) {
        if (correct) {
            // Tính rating SM-2 dựa trên số lần thử
            const rating = explicitRating || (
                item.attempts === 1 ? 'easy' :
                item.attempts === 2 ? 'good' : 'hard'
            );

            _state.completed.push({
                word:     item.word,
                rating,
                attempts: item.attempts,
            });

            // Ghi vào Supabase bất đồng bộ
            if (typeof HiDB !== 'undefined') {
                HiDB.reviewWord(item.word.wordId, rating)
                    .catch(err => console.error('[HiSession] reviewWord error:', err));
            }

            _state.queueIndex++;

            return {
                correct:       true,
                correctAnswer,
                feedback:      '✓ Chính xác!',
                rating,
                wordCompleted: true,
            };

        } else {
            // Đổi sang dạng bài khác cho từ này
            // Nếu phiên có allowedType (single-practice mode), giữ nguyên dạng
            item.usedTypes.push(item.exerciseType);
            const nextType = _state.allowedType || _pickNextType(item.usedTypes);
            item.exerciseType = nextType;
            item.exerciseData = _generateExerciseData(item.word, nextType, _state.allWords);

            // Đẩy item xuống cuối queue
            _state.queue.push(item);
            _state.queueIndex++;

            return {
                correct:       false,
                correctAnswer,
                feedback:      `✗ Đáp án: ${correctAnswer}`,
                wordCompleted: false,
                nextExerciseType: nextType,
            };
        }
    }

    // ----------------------------------------------------------
    // PUBLIC: TTS (Text-to-Speech cho Listen exercise)
    // ----------------------------------------------------------

    /**
     * Phát âm một từ tiếng Anh qua Web Speech API.
     * @param {string} word
     * @param {number} rate - tốc độ (0.5–1.5, mặc định 0.85)
     */
    function speakWord(word, rate = 0.85) {
        if (!window.speechSynthesis) {
            console.warn('[HiSession] Trình duyệt không hỗ trợ SpeechSynthesis.');
            return;
        }
        window.speechSynthesis.cancel(); // Dừng bất kỳ âm thanh đang phát
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang  = 'en-US';
        utterance.rate  = rate;
        utterance.pitch = 1;

        // Ưu tiên giọng native nếu có
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v =>
            v.lang.startsWith('en') && (v.name.includes('Google') || v.localService)
        );
        if (preferred) utterance.voice = preferred;

        window.speechSynthesis.speak(utterance);
    }

    // ----------------------------------------------------------
    // PUBLIC: KẾT THÚC PHIÊN
    // ----------------------------------------------------------

    /**
     * Đánh dấu phiên kết thúc và trả về tổng kết.
     * @returns {{ wordsReviewed: number, completedWords: Array }}
     */
    function endSession() {
        _state.isActive = false;
        return {
            wordsReviewed:  _state.completed.length,
            completedWords: getCompletedWords(),
        };
    }

    // ----------------------------------------------------------
    // PUBLIC API
    // ----------------------------------------------------------
    return {
        startSession,
        getCurrentItem,
        getProgress,
        isComplete,
        getCompletedWords,
        submitAnswer,
        rateFlashcard,
        speakWord,
        endSession,

        // Expose EXERCISE_TYPES để sessionUI dùng
        EXERCISE_TYPES,
    };

})();
