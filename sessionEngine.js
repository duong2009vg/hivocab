// ============================================================
// HI - SESSION ENGINE  |  sessionEngine.js
// ============================================================
// Thu?t to�n qu?n l� phi�n �n t?p:
//   - M?i phi�n user ph?i tr? l?i ��NG to�n b? t?
//   - Tr? l?i SAI ? chuy?n sang d?ng b�i kh�c cho t? d�
//   - Tr? l?i ��NG ? t? du?c d�nh d?u ho�n th�nh
//   - K?t th�c khi t?t c? t? du?c tr? l?i d�ng
//
// Ph? thu?c: dataLayer.js (HiDB ph?i load tru?c)
// ============================================================

const HiSession = (() => {

    // ----------------------------------------------------------
    // CONSTANTS
    // ----------------------------------------------------------

    const EXERCISE_TYPES = ['flashcard', 'mcq', 'fill', 'listen'];

    // Pool fallback cho MCQ khi session c� �t hon 4 t?
    const FALLBACK_DISTRACTORS = [
        'Sự kiên nhẫn',   'Trí tuệ nhân tạo', 'Cảm xúc sâu sắc',
        'Sức mạnh nội tâm','Niềm tin tuyệt đối','Hy vọng le lói',
        'Sự thật phũ phàng','Lòng dũng cảm',    'Sự thay đổi lớn',
        'Tự do tuyệt đối', 'Bình yên nội tâm',  'Hạnh phúc giản đơn',
        'Nỗi cô đơn',      'Sự ngạc nhiên',     'Trí tưởng tượng',
    ];

    // ----------------------------------------------------------
    // SESSION STATE (reset m?i l?n startSession)
    // ----------------------------------------------------------
    let _state = {
        allWords:    [],   // to�n b? t? c?a phi�n
        queue:       [],   // h�ng ch? c�c exercise item
        queueIndex:  0,    // con tr? v�o queue
        completed:   [],   // [{ word, rating, attempts }]
        isActive:    false,
        allowedType: null, // n?u set, m?i item ch? d�ng d?ng n�y (single-practice mode)
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
     * Ch?n ng?u nhi�n d?ng b�i KH�C v?i nh?ng d?ng d� d�ng cho t? n�y.
     */
    function _pickNextType(usedTypes) {
        const available = EXERCISE_TYPES.filter(t => !usedTypes.includes(t));
        // N?u d� d�ng h?t 4 d?ng th� reset (cycle l?i t? d?u)
        if (available.length === 0) {
            return _randomFrom(EXERCISE_TYPES);
        }
        return _randomFrom(available);
    }

    // ----------------------------------------------------------
    // EXERCISE DATA GENERATION
    // ----------------------------------------------------------

    /**
     * T?o d? li?u b�i t?p cho t?ng d?ng.
     * @param {Object} word        - t? c?n t?o b�i
     * @param {string} type        - 'flashcard' | 'mcq' | 'fill' | 'listen'
     * @param {Array}  allWords    - to�n b? t? trong phi�n (d? t?o MCQ distractor)
     * @returns {Object}           - exerciseData tuong ?ng
     */
    function _generateExerciseData(word, type, allWords) {
        switch (type) {

            // -- FLASHCARD ----------------------------------------
            // Front: nghia ti?ng Vi?t ? User nh? l?i t? ti?ng Anh
            // Back: t? ti?ng Anh + phi�n �m + n�t Hard/Good/Easy
            case 'flashcard':
                return {
                    frontLabel:  'Dịch sang tiếng Anh',
                    frontWord:   word.meaning,
                    backLabel:   'Đáp án',
                    backWord:    word.word,
                    phonetic:    word.phonetic || '',
                };

            // -- MCQ ----------------------------------------------
            // Hi?n th? t? ti?ng Anh ? ch?n nghia ti?ng Vi?t d�ng
            case 'mcq': {
                const correctOption = { text: word.meaning, isCorrect: true };

                // L?y distractors t? c�c t? kh�c trong session
                const others = allWords
                    .filter(w => w.wordId !== word.wordId)
                    .map(w => w.meaning);

                // Pad b?ng fallback pool n?u kh�ng d? 3 distractors
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

            // -- FILL IN BLANK ------------------------------------
            // Hi?n th? c�u v� d? c� ch? tr?ng ? di?n t?ng ch? c�i
            case 'fill': {
                let sentence = null;
                if (word.exampleSentence) {
                    // Thay t? trong c�u b?ng d?u g?ch ngang (case-insensitive)
                    sentence = word.exampleSentence.replace(
                        new RegExp(`\\b${_escapeRegex(word.word)}\\b`, 'gi'),
                        '___'
                    );
                }
                return {
                    sentence,
                    // Hi?n th? khi kh�ng c� c�u v� d?
                    meaningHint: `Điền từ tiếng Anh có nghĩa: "${word.meaning}"`,
                    answer:      word.word,
                    letters:     word.word.replace(/\s/g, '').length, // b? kho?ng tr?ng khi d?m
                    hasSpaces:   word.word.includes(' '),
                    // D�ng cho AI hint
                    aiContext: {
                        sentence:   word.exampleSentence || '',
                        answer:     word.word,
                        meaning:    word.meaning,
                    },
                };
            }

            // -- LISTEN -------------------------------------------
            // Ph�t �m thanh ? user nh?p l?i t? nghe du?c
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

    /** T?o queue item ban d?u cho m?t t? */
    function _createQueueItem(word, forcedType = null) {
        const exerciseType = forcedType || _randomFrom(EXERCISE_TYPES);
        return {
            word,
            exerciseType,
            exerciseData: null,   // lazy-generated
            usedTypes:    [],
            attempts:     0,
            failCount:    0,      // s? l?n sai trong phi�n n�y (d? skip khi >= 3)
        };
    }

    /** Generate exerciseData n?u chua c� (lazy) */
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
    // PUBLIC: KH?I T?O PHI�N
    // ----------------------------------------------------------

    /**
     * B?t d?u phi�n �n t?p v?i danh s�ch t?.
     * @param {Array} words - t? HiDB.getWordsDueForReview()
     *   M?i ph?n t?: { wordId, word, phonetic, meaning, exampleSentence, level, ... }
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
            allowedType, // gi? l?i d? d�ng khi tr? l?i sai
        };

        // Lazy-generate exercise data cho item d?u ti�n ngay l?p t?c
        _ensureExerciseData(_state.queue[0]);

        console.log(`[HiSession] Phiên bắt đầu với ${words.length} từ.`);
    }

    // ----------------------------------------------------------
    // PUBLIC: �?C STATE
    // ----------------------------------------------------------

    /**
     * L?y exercise item hi?n t?i.
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
     * L?y ti?n d? phi�n h?c.
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

    /** Ki?m tra phi�n d� ho�n th�nh chua. */
    function isComplete() {
        return _state.isActive &&
               _state.completed.length >= _state.allWords.length;
    }

    /** L?y danh s�ch t? d� ho�n th�nh (d? hi?n th? k?t qu?). */
    function getCompletedWords() {
        return [..._state.completed];
    }

    // ----------------------------------------------------------
    // PUBLIC: SUBMIT ��P �N
    // ----------------------------------------------------------

    /**
     * Ki?m tra d�p �n cho MCQ, Fill-in-blank, Listen.
     * @param {string|number} userAnswer - d�p �n c?a user
     *   - MCQ: index c?a option du?c ch?n (0�3)
     *   - Fill/Listen: chu?i k� t? nh?p
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
                // So s�nh case-insensitive, b? qua kho?ng tr?ng th?a
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
     * ��nh gi� Flashcard.
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
    // PRIVATE: X? L� K?T QU?
    // ----------------------------------------------------------

    /**
     * X? l� k?t qu? d�ng/sai v?i 2 logic d?c bi?t:
     *
     *   [A] T? M?I (word.level === 0 ho?c word.isNew === true):
     *       B?t k? d�ng hay sai, b?t k? d?ng b�i n�o ? t? d?ng ho�n th�nh,
     *       g?i reviewWord v?i rating 'good' ? l�n lv1.
     *
     *   [B] SAI QU� 3 L?N (failCount >= 3):
     *       Cho ph�p skip d? ho�n th�nh phi�n,
     *       g?i reviewWord v?i rating 'hard' v� currentLevel b? �p v? 1 ? gi? lv1.
     *
     *   ��NG (t? thu?ng) ? dua v�o completed, g?i HiDB.reviewWord async.
     *   SAI  (t? thu?ng, chua d?n 3 l?n) ? d?i d?ng b�i, d?y xu?ng cu?i queue.
     */
    function _processResult(item, correct, correctAnswer, explicitRating = null) {

        // -- [A] T? M?I (lv0): auto-advance b?t k? d�ng/sai --------------
        // T? m?i kh�ng b? d?y l?i queue, nhung tr? v? `correct` th?t
        // d? UI v?n hi?n th? d�ng/sai cho ngu?i d�ng th?y.
        const isNewWord = (item.word.level === 0) || (item.word.isNew === true);
        if (isNewWord) {
            _state.completed.push({
                word:     item.word,
                rating:   'good',   // lv0 ? lv1
                attempts: item.attempts,
                isNew:    true,
            });

            if (typeof HiDB !== 'undefined') {
                HiDB.reviewWord(item.word.wordId, 'good')
                    .catch(err => console.error('[HiSession] reviewWord (new word) error:', err));
            }

            _state.queueIndex++;

            return {
                correct:       correct,          // ? tr? v? k?t qu? TH?T
                correctAnswer,
                feedback:      correct ? '✓ Chính xác!' : `✗ Đáp án: ${correctAnswer}`,
                rating:        'good',
                wordCompleted: true,
                isNewWord:     true,
            };
        }

        // -- [B] SAI QU� 3 L?N: cho ph�p skip, reset v? lv1 ---------------
        if (!correct) {
            item.failCount = (item.failCount || 0) + 1;

            if (item.failCount >= 3) {
                // Skip t? n�y � d?y v�o completed nhung d�nh d?u skipped
                _state.completed.push({
                    word:     item.word,
                    rating:   'hard',
                    attempts: item.attempts,
                    skipped:  true,
                });

                // reviewWord v?i 'hard': calculateNextReview s? dua v? max(level-1, 1)
                // �? �p th?ng v? lv1 b?t k? level hi?n t?i, ta override b?ng c�ch
                // tr?c ti?p upsert level=1 qua m?t wrapper � nhung v� HiDB.reviewWord
                // d�ng calculateNextReview n�n ta g?i v?i rating 'hard' nhi?u l?n s?
                // d?n v? lv1. Thay v�o d� ta t?o helper n?i b? g?i reviewWord v?i
                // forceLevel=1 b?ng c�ch truy?n rating d?c bi?t 'reset'.
                // ? Gi?i ph�p don gi?n nh?t: g?i HiDB.reviewWordToLevel n?u c�,
                //   fallback v? hard (s? gi?m 1 level, d? d? tr?ng ph?t).
                if (typeof HiDB !== 'undefined') {
                    // Th? g?i reviewWordToLevel (n?u d� implement), fallback v? hard
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
                    wordCompleted: true,   // t�nh l� "xong" d? phi�n c� th? k?t th�c
                    skipped:       true,
                    failCount:     item.failCount,
                };
            }
        }

        // -- ��NG (t? thu?ng) -----------------------------------------------
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

        // -- SAI (t? thu?ng, failCount < 3): d?i d?ng b�i, d?y xu?ng cu?i --
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
     * Ph�t �m m?t t? ti?ng Anh qua Web Speech API.
     * @param {string} word
     * @param {number} rate - t?c d? (0.5�1.5, m?c d?nh 0.85)
     */
    function speakWord(word, rate = 0.85) {
        if (!window.speechSynthesis) {
            console.warn('[HiSession] Trình duyệt không hỗ trợ SpeechSynthesis.');
            return;
        }
        window.speechSynthesis.cancel(); // D?ng b?t k? �m thanh dang ph�t
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang  = 'en-US';
        utterance.rate  = rate;
        utterance.pitch = 1;

        // Uu ti�n gi?ng native n?u c�
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v =>
            v.lang.startsWith('en') && (v.name.includes('Google') || v.localService)
        );
        if (preferred) utterance.voice = preferred;

        window.speechSynthesis.speak(utterance);
    }

    // ----------------------------------------------------------
    // PUBLIC: K?T TH�C PHI�N
    // ----------------------------------------------------------

    /**
     * ��nh d?u phi�n k?t th�c v� tr? v? t?ng k?t.
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

        // Expose EXERCISE_TYPES d? sessionUI d�ng
        EXERCISE_TYPES,
    };

})();
