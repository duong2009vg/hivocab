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
            failCount:    0,      // số lần sai trong phiên này (để skip khi >= 3)
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
     * Xử lý kết quả đúng/sai với 2 logic đặc biệt:
     *
     *   [A] TỪ MỚI (word.level === 0 hoặc word.isNew === true):
     *       Bất kể đúng hay sai, bất kể dạng bài nào → tự động hoàn thành,
     *       gọi reviewWord với rating 'good' → lên lv1.
     *
     *   [B] SAI QUÁ 3 LẦN (failCount >= 3):
     *       Cho phép skip để hoàn thành phiên,
     *       gọi reviewWord với rating 'hard' và currentLevel bị ép về 1 → giữ lv1.
     *
     *   ĐÚNG (từ thường) → đưa vào completed, gọi HiDB.reviewWord async.
     *   SAI  (từ thường, chưa đến 3 lần) → đổi dạng bài, đẩy xuống cuối queue.
     */
    function _processResult(item, correct, correctAnswer, explicitRating = null) {

        // ── [A] TỪ MỚI (lv0): auto-complete bất kể đúng/sai ──────────────
        const isNewWord = (item.word.level === 0) || (item.word.isNew === true);
        if (isNewWord) {
            _state.completed.push({
                word:     item.word,
                rating:   'good',   // lv0 → lv1
                attempts: item.attempts,
                isNew:    true,
            });

            // Luôn gọi reviewWord với 'good' để lên lv1
            if (typeof HiDB !== 'undefined') {
                HiDB.reviewWord(item.word.wordId, 'good')
                    .catch(err => console.error('[HiSession] reviewWord (new word) error:', err));
            }

            _state.queueIndex++;

            return {
                correct:       true,
                correctAnswer,
                feedback:      correct ? '✓ Chính xác!' : `✓ Đã ghi nhớ! Đáp án: ${correctAnswer}`,
                rating:        'good',
                wordCompleted: true,
                isNewWord:     true,
            };
        }

        // ── [B] SAI QUÁ 3 LẦN: cho phép skip, reset về lv1 ───────────────
        if (!correct) {
            item.failCount = (item.failCount || 0) + 1;

            if (item.failCount >= 3) {
                // Skip từ này — đẩy vào completed nhưng đánh dấu skipped
                _state.completed.push({
                    word:     item.word,
                    rating:   'hard',
                    attempts: item.attempts,
                    skipped:  true,
                });

                // reviewWord với 'hard': calculateNextReview sẽ đưa về max(level-1, 1)
                // Để ép thẳng về lv1 bất kể level hiện tại, ta override bằng cách
                // trực tiếp upsert level=1 qua một wrapper — nhưng vì HiDB.reviewWord
                // dùng calculateNextReview nên ta gọi với rating 'hard' nhiều lần sẽ
                // dần về lv1. Thay vào đó ta tạo helper nội bộ gọi reviewWord với
                // forceLevel=1 bằng cách truyền rating đặc biệt 'reset'.
                // → Giải pháp đơn giản nhất: gọi HiDB.reviewWordToLevel nếu có,
                //   fallback về hard (sẽ giảm 1 level, đủ để trừng phạt).
                if (typeof HiDB !== 'undefined') {
                    // Thử gọi reviewWordToLevel (nếu đã implement), fallback về hard
                    if (typeof HiDB.reviewWordToLevel === 'function') {
                        HiDB.reviewWordToLevel(item.word.wordId, 1)
                            .catch(err => console.error('[HiSession] reviewWordToLevel error:', err));
                    } else {
                        HiDB.reviewWord(item.word.wordId, 'hard')
                            .catch(err => console.error('[HiSession] reviewWord (skip) error:', err));
                    }
                }

                _state.queueIndex++;

                return {
                    correct:       false,
                    correctAnswer,
                    feedback:      `⏭ Bỏ qua. Đáp án: ${correctAnswer}`,
                    rating:        'hard',
                    wordCompleted: true,   // tính là "xong" để phiên có thể kết thúc
                    skipped:       true,
                    failCount:     item.failCount,
                };
            }
        }

        // ── ĐÚNG (từ thường) ───────────────────────────────────────────────
        if (correct) {
            const rating = explicitRating || (
                item.attempts === 1 ? 'easy' :
                item.attempts === 2 ? 'good' : 'hard'
            );

            _state.completed.push({
                word:     item.word,
                rating,
                attempts: item.attempts,
            });

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
        }

        // ── SAI (từ thường, failCount < 3): đổi dạng bài, đẩy xuống cuối ──
        let nextType;
        if (_state.allowedType) {
            nextType = _state.allowedType;
        } else {
            item.usedTypes.push(item.exerciseType);
            nextType = _pickNextType(item.usedTypes);
        }
        item.exerciseType = nextType;
        item.exerciseData = _generateExerciseData(item.word, nextType, _state.allWords);

        _state.queue.push(item);
        _state.queueIndex++;

        return {
            correct:          false,
            correctAnswer,
            feedback:         `✗ Đáp án: ${correctAnswer}`,
            wordCompleted:    false,
            nextExerciseType: nextType,
            failCount:        item.failCount,
        };
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
