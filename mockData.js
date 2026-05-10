// ============================================================
// HI - MOCK DATA LAYER  |  mockData.js
// ============================================================
// Dùng cho development/testing khi chưa có Supabase.
// Cung cấp dữ liệu mẫu thông qua localStorage,
// và mock lại toàn bộ HiDB API.
//
// KÍCH HOẠT: Đặt trong localStorage: hi_use_mock = "true"
// TẮT:       Xóa key đó hoặc đặt = "false"
// ============================================================

const HiMock = (() => {

    const STORAGE_KEYS = {
        topics:    'hi_mock_topics',
        words:     'hi_mock_words',
        progress:  'hi_mock_progress',
        sessions:  'hi_mock_sessions',
        user:      'hi_mock_user',
        exercises: 'hi_mock_exercises',
    };

    // ----------------------------------------------------------
    // SAMPLE DATA
    // ----------------------------------------------------------

    const SAMPLE_USER = {
        id:    'mock-user-001',
        email: 'learner@hi.app',
        user_metadata: { full_name: 'Hi Learner' },
    };

    const SAMPLE_TOPICS = [
        { id: 'topic-001', user_id: 'mock-user-001', name: 'Business Negotiation',  icon: 'work',          category: 'general', created_at: '2026-01-01' },
        { id: 'topic-002', user_id: 'mock-user-001', name: 'Travel Essentials',     icon: 'flight_takeoff', category: 'general', created_at: '2026-01-02' },
        { id: 'topic-003', user_id: 'mock-user-001', name: 'Scientific Literature', icon: 'science',        category: 'ielts',   created_at: '2026-01-03' },
        { id: 'topic-004', user_id: 'mock-user-001', name: 'Modern Art Movements',  icon: 'palette',        category: 'cefr',    created_at: '2026-01-04' },
    ];

    const SAMPLE_WORDS = [
        // Business Negotiation
        { id: 'w-001', topic_id: 'topic-001', word: 'Compromise',    phonetic: '/ˈkɒm.prə.maɪz/', meaning: 'Sự thỏa hiệp, dàn xếp',          example_sentence: 'We reached a compromise after hours of negotiation.' },
        { id: 'w-002', topic_id: 'topic-001', word: 'Consensus',     phonetic: '/kənˈsen.səs/',   meaning: 'Sự đồng thuận, nhất trí',          example_sentence: 'The team reached a consensus on the new strategy.' },
        { id: 'w-003', topic_id: 'topic-001', word: 'Leverage',      phonetic: '/ˈlev.ər.ɪdʒ/',  meaning: 'Đòn bẩy, lợi thế đàm phán',        example_sentence: 'They used their market position as leverage in talks.' },
        { id: 'w-004', topic_id: 'topic-001', word: 'Arbitration',   phonetic: '/ˌɑː.bɪˈtreɪ.ʃən/', meaning: 'Trọng tài, phân xử',           example_sentence: 'Both parties agreed to resolve the dispute through arbitration.' },
        { id: 'w-005', topic_id: 'topic-001', word: 'Stakeholder',   phonetic: '/ˈsteɪk.həʊl.dər/', meaning: 'Bên liên quan, cổ đông',        example_sentence: 'All stakeholders must agree before the project proceeds.' },

        // Travel Essentials
        { id: 'w-006', topic_id: 'topic-002', word: 'Itinerary',     phonetic: '/aɪˈtɪn.ər.ər.i/', meaning: 'Lịch trình du lịch',             example_sentence: 'Our itinerary includes visits to three countries.' },
        { id: 'w-007', topic_id: 'topic-002', word: 'Layover',       phonetic: '/ˈleɪ.əʊ.vər/',   meaning: 'Thời gian chờ nối chuyến',         example_sentence: 'We have a three-hour layover in Singapore.' },
        { id: 'w-008', topic_id: 'topic-002', word: 'Embarkation',   phonetic: '/ˌem.bɑːˈkeɪ.ʃən/', meaning: 'Sự lên tàu / máy bay',         example_sentence: 'Embarkation begins two hours before departure.' },
        { id: 'w-009', topic_id: 'topic-002', word: 'Customs',       phonetic: '/ˈkʌs.təmz/',     meaning: 'Hải quan',                         example_sentence: 'You must declare all items at customs.' },
        { id: 'w-010', topic_id: 'topic-002', word: 'Amenity',       phonetic: '/əˈmiː.nɪ.ti/',   meaning: 'Tiện nghi, dịch vụ tiện ích',       example_sentence: 'The hotel offers many amenities including a pool.' },

        // Scientific Literature
        { id: 'w-011', topic_id: 'topic-003', word: 'Hypothesis',    phonetic: '/haɪˈpɒθ.ɪ.sɪs/', meaning: 'Giả thuyết',                      example_sentence: 'The hypothesis was confirmed by the experiment.' },
        { id: 'w-012', topic_id: 'topic-003', word: 'Empirical',     phonetic: '/ɪmˈpɪr.ɪ.kəl/',  meaning: 'Dựa trên bằng chứng thực nghiệm', example_sentence: 'We need empirical evidence to support this claim.' },
        { id: 'w-013', topic_id: 'topic-003', word: 'Paradigm',      phonetic: '/ˈpær.ə.daɪm/',   meaning: 'Mô hình tư duy, khuôn mẫu',        example_sentence: 'This discovery represents a paradigm shift in physics.' },

        // Modern Art Movements
        { id: 'w-014', topic_id: 'topic-004', word: 'Serendipity',   phonetic: '/ˌser.ənˈdɪp.ɪ.ti/', meaning: 'Sự tình cờ may mắn',           example_sentence: 'Finding that rare book was an act of pure serendipity.' },
        { id: 'w-015', topic_id: 'topic-004', word: 'Ephemeral',     phonetic: '/ɪˈfem.ər.əl/',   meaning: 'Phù du, tồn tại trong thời gian ngắn', example_sentence: 'The ephemeral beauty of cherry blossoms inspires many artists.' },
        { id: 'w-016', topic_id: 'topic-004', word: 'Avant-garde',   phonetic: '/ˌæv.ɒ̃ˈɡɑːd/',  meaning: 'Tiên phong, đi trước thời đại',      example_sentence: 'His avant-garde style challenged traditional painting norms.' },
        { id: 'w-017', topic_id: 'topic-004', word: 'Ubiquitous',    phonetic: '/juːˈbɪk.wɪ.təs/', meaning: 'Có mặt ở khắp mọi nơi',           example_sentence: 'Smartphones have become ubiquitous in modern society.' },
    ];

    // progress mẫu — các từ có level khác nhau, một số đến hạn ôn
    const now = new Date();
    const pastHour  = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
    const future7d  = new Date(now.getTime() + 7  * 24 * 60 * 60 * 1000).toISOString();
    const future30d = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const SAMPLE_PROGRESS = [
        { user_id: 'mock-user-001', word_id: 'w-001', level: 3, next_review_at: pastHour,  review_count: 5 },
        { user_id: 'mock-user-001', word_id: 'w-002', level: 1, next_review_at: pastHour,  review_count: 1 },
        { user_id: 'mock-user-001', word_id: 'w-003', level: 5, next_review_at: future30d, review_count: 12 },
        { user_id: 'mock-user-001', word_id: 'w-006', level: 2, next_review_at: pastHour,  review_count: 3 },
        { user_id: 'mock-user-001', word_id: 'w-007', level: 4, next_review_at: future7d,  review_count: 8 },
        { user_id: 'mock-user-001', word_id: 'w-011', level: 1, next_review_at: pastHour,  review_count: 1 },
        { user_id: 'mock-user-001', word_id: 'w-014', level: 2, next_review_at: pastHour,  review_count: 2 },
        { user_id: 'mock-user-001', word_id: 'w-015', level: 5, next_review_at: future30d, review_count: 15 },
    ];

    const SAMPLE_SESSIONS = [
        { user_id: 'mock-user-001', session_date: _dateStr(0), words_reviewed: 8 },
        { user_id: 'mock-user-001', session_date: _dateStr(-1), words_reviewed: 12 },
        { user_id: 'mock-user-001', session_date: _dateStr(-2), words_reviewed: 6 },
        { user_id: 'mock-user-001', session_date: _dateStr(-3), words_reviewed: 10 },
        { user_id: 'mock-user-001', session_date: _dateStr(-4), words_reviewed: 5 },
    ];

    function _dateStr(offsetDays) {
        const d = new Date();
        d.setDate(d.getDate() + offsetDays);
        return d.toISOString().split('T')[0];
    }

    // ----------------------------------------------------------
    // STORAGE HELPERS
    // ----------------------------------------------------------

    function _load(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
        catch { return fallback; }
    }

    function _save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    // ----------------------------------------------------------
    // SEED: ghi data mẫu vào localStorage nếu chưa có
    // ----------------------------------------------------------

    function seed() {
        const existingTopics = _load(STORAGE_KEYS.topics, null);
        // Re-seed nếu chưa có data hoặc data cũ thiếu trường category
        const needReseed = !existingTopics || (existingTopics[0] && !existingTopics[0].category);
        if (needReseed) {
            _save(STORAGE_KEYS.topics,   SAMPLE_TOPICS);
            _save(STORAGE_KEYS.words,    SAMPLE_WORDS);
            _save(STORAGE_KEYS.progress, SAMPLE_PROGRESS);
            _save(STORAGE_KEYS.sessions, SAMPLE_SESSIONS);
            _save(STORAGE_KEYS.user,     SAMPLE_USER);
            console.log('[HiMock] ✅ Đã seed dữ liệu mẫu vào localStorage');
        }
    }

    function reset() {
        Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
        console.log('[HiMock] 🔄 Đã reset toàn bộ mock data');
        seed();
    }

    // ----------------------------------------------------------
    // MOCK HiDB API
    // ----------------------------------------------------------

    const mockDB = {

        getCurrentUser: async () => _load(STORAGE_KEYS.user, null),

        signInWithGoogle: async () => {
            _save(STORAGE_KEYS.user, SAMPLE_USER);
            console.log('[HiMock] Mock login thành công');
        },

        signOut: async () => {
            localStorage.removeItem(STORAGE_KEYS.user);
        },

        // ── TOPICS ───────────────────────────────────────────

        getTopics: async () => {
            const topics   = _load(STORAGE_KEYS.topics, []);
            const words    = _load(STORAGE_KEYS.words, []);
            const progress = _load(STORAGE_KEYS.progress, []);
            const userId   = _load(STORAGE_KEYS.user, {})?.id;

            return topics
                .filter(t => t.user_id === userId)
                .map(t => {
                    const topicWords = words.filter(w => w.topic_id === t.id);
                    const total = topicWords.length;
                    const totalLevel = topicWords.reduce((sum, w) => {
                        const p = progress.find(p => p.word_id === w.id && p.user_id === userId);
                        return sum + (p?.level ?? 0);
                    }, 0);
                    return {
                        id: t.id, name: t.name, icon: t.icon,
                        category:   t.category || 'general',
                        totalWords: total,
                        progress: total > 0 ? Math.round((totalLevel / (total * 5)) * 100) : 0,
                        createdAt: t.created_at,
                    };
                });
        },

        createTopic: async (name, icon = 'folder', category = 'general') => {
            const user   = _load(STORAGE_KEYS.user, {});
            const topics = _load(STORAGE_KEYS.topics, []);
            const newTopic = {
                id:         'topic-' + Date.now(),
                user_id:    user.id,
                name, icon, category,
                created_at: new Date().toISOString(),
            };
            _save(STORAGE_KEYS.topics, [...topics, newTopic]);
            return { ...newTopic, totalWords: 0, progress: 0 };
        },

        deleteTopic: async (topicId) => {
            const topics = _load(STORAGE_KEYS.topics, []).filter(t => t.id !== topicId);
            const words  = _load(STORAGE_KEYS.words, []).filter(w => w.topic_id !== topicId);
            _save(STORAGE_KEYS.topics, topics);
            _save(STORAGE_KEYS.words, words);
        },

        // ── WORDS ─────────────────────────────────────────────

        getWordsInTopic: async (topicId) => {
            const userId   = _load(STORAGE_KEYS.user, {})?.id;
            const words    = _load(STORAGE_KEYS.words, []).filter(w => w.topic_id === topicId);
            const progress = _load(STORAGE_KEYS.progress, []);
            return words.map(w => {
                const p = progress.find(p => p.word_id === w.id && p.user_id === userId) || null;
                return {
                    id: w.id, word: w.word, phonetic: w.phonetic, meaning: w.meaning,
                    exampleSentence: w.example_sentence,
                    level:          p?.level ?? 0,
                    nextReviewAt:   p?.next_review_at ?? null,
                    lastReviewedAt: p?.last_reviewed_at ?? null,
                    reviewCount:    p?.review_count ?? 0,
                    isDue:          !p || new Date(p.next_review_at) <= new Date(),
                };
            });
        },

        addWord: async (topicId, { word, phonetic = '', meaning, exampleSentence = '' }) => {
            const words = _load(STORAGE_KEYS.words, []);
            const newWord = {
                id:              'w-' + Date.now(),
                topic_id:        topicId,
                word, phonetic, meaning,
                example_sentence: exampleSentence,
            };
            _save(STORAGE_KEYS.words, [...words, newWord]);
            return newWord;
        },

        deleteWord: async (wordId) => {
            _save(STORAGE_KEYS.words, _load(STORAGE_KEYS.words, []).filter(w => w.id !== wordId));
            _save(STORAGE_KEYS.progress, _load(STORAGE_KEYS.progress, []).filter(p => p.word_id !== wordId));
        },

        // ── LESSONS ───────────────────────────────────────────

        getLessonsInTopic: async (topicId) => {
            const LESSON_SIZE = 50;
            const userId   = _load(STORAGE_KEYS.user, {})?.id;
            const words    = _load(STORAGE_KEYS.words, []).filter(w => w.topic_id === topicId);
            const progress = _load(STORAGE_KEYS.progress, []);
            const lessons  = [];
            for (let i = 0; i < words.length || lessons.length === 0; i += LESSON_SIZE) {
                const chunk = words.slice(i, i + LESSON_SIZE);
                const lessonIndex = Math.floor(i / LESSON_SIZE);
                const totalLevel = chunk.reduce((sum, w) => {
                    const p = progress.find(p => p.word_id === w.id && p.user_id === userId);
                    return sum + (p?.level ?? 0);
                }, 0);
                lessons.push({
                    id:         `lesson-${topicId}-${lessonIndex}`,
                    topicId,
                    index:      lessonIndex,
                    name:       `Lesson ${lessonIndex + 1}`,
                    totalWords: chunk.length,
                    progress:   chunk.length > 0 ? Math.round((totalLevel / (chunk.length * 5)) * 100) : 0,
                    wordIds:    chunk.map(w => w.id),
                });
                if (i + LESSON_SIZE >= words.length) break;
            }
            return lessons;
        },

        getWordsInLesson: async (topicId, lessonIndex) => {
            const LESSON_SIZE = 50;
            const userId   = _load(STORAGE_KEYS.user, {})?.id;
            const words    = _load(STORAGE_KEYS.words, []).filter(w => w.topic_id === topicId);
            const chunk    = words.slice(lessonIndex * LESSON_SIZE, (lessonIndex + 1) * LESSON_SIZE);
            const progress = _load(STORAGE_KEYS.progress, []);
            return chunk.map(w => {
                const p = progress.find(p => p.word_id === w.id && p.user_id === userId) || null;
                return {
                    id: w.id, word: w.word, phonetic: w.phonetic, meaning: w.meaning,
                    exampleSentence: w.example_sentence,
                    level:          p?.level ?? 0,
                    nextReviewAt:   p?.next_review_at ?? null,
                    lastReviewedAt: p?.last_reviewed_at ?? null,
                    reviewCount:    p?.review_count ?? 0,
                    isDue:          !p || new Date(p.next_review_at) <= new Date(),
                };
            });
        },

        // ── REVIEW ────────────────────────────────────────────

        getWordsDueForReview: async (limit = 20) => {
            const userId   = _load(STORAGE_KEYS.user, {})?.id;
            const words    = _load(STORAGE_KEYS.words, []);
            const progress = _load(STORAGE_KEYS.progress, []);
            const topics   = _load(STORAGE_KEYS.topics, []);
            const nowTs    = Date.now();

            // Từ đã có progress và đến hạn
            const dueProgress = progress
                .filter(p => p.user_id === userId && new Date(p.next_review_at).getTime() <= nowTs)
                .sort((a, b) => new Date(a.next_review_at) - new Date(b.next_review_at))
                .slice(0, limit);

            const dueWords = dueProgress.map(p => {
                const w = words.find(w => w.id === p.word_id);
                if (!w) return null;
                const t = topics.find(t => t.id === w.topic_id);
                return {
                    wordId: w.id, word: w.word, phonetic: w.phonetic,
                    meaning: w.meaning, exampleSentence: w.example_sentence,
                    level: p.level, nextReviewAt: p.next_review_at,
                    isNew: false, topic: t ? { id: t.id, name: t.name, icon: t.icon } : null,
                };
            }).filter(Boolean);

            // Thêm từ mới nếu chưa đủ
            const learnedIds = new Set(progress.filter(p => p.user_id === userId).map(p => p.word_id));
            const remaining  = limit - dueWords.length;
            const newWords   = words
                .filter(w => !learnedIds.has(w.id))
                .slice(0, remaining)
                .map(w => {
                    const t = topics.find(t => t.id === w.topic_id);
                    return {
                        wordId: w.id, word: w.word, phonetic: w.phonetic,
                        meaning: w.meaning, exampleSentence: w.example_sentence,
                        level: 0, isNew: true,
                        topic: t ? { id: t.id, name: t.name, icon: t.icon } : null,
                    };
                });

            return [...dueWords, ...newWords];
        },

        reviewWord: async (wordId, rating) => {
            const userId   = _load(STORAGE_KEYS.user, {})?.id;
            const progress = _load(STORAGE_KEYS.progress, []);
            const existing = progress.find(p => p.word_id === wordId && p.user_id === userId);
            const currentLevel = existing?.level ?? 1;
            const currentCount = existing?.review_count ?? 0;

            // SM-2 simplified
            let newLevel = currentLevel;
            if (rating === 'easy') newLevel = Math.min(currentLevel + 1, 5);
            else if (rating === 'hard') newLevel = Math.max(currentLevel - 1, 1);

            const HOUR = 60 * 60 * 1000;
            const DAY  = 24 * HOUR;
            const intervals = { 1: HOUR, 2: 8 * HOUR, 3: DAY, 4: 6 * DAY, 5: 21 * DAY };
            const nextReviewAt = new Date(Date.now() + (intervals[newLevel] || HOUR)).toISOString();
            const labels = { 1: '1 giờ', 2: '8 giờ', 3: '24 giờ', 4: '5–7 ngày', 5: '15–30 ngày' };

            const newEntry = {
                user_id: userId, word_id: wordId, level: newLevel,
                next_review_at: nextReviewAt,
                last_reviewed_at: new Date().toISOString(),
                review_count: currentCount + 1,
            };

            const updated = existing
                ? progress.map(p => (p.word_id === wordId && p.user_id === userId) ? newEntry : p)
                : [...progress, newEntry];

            _save(STORAGE_KEYS.progress, updated);

            // Log session — mock tương đương RPC increment_session (atomic upsert)
            const today    = new Date().toISOString().split('T')[0];
            const sessions = _load(STORAGE_KEYS.sessions, []);
            const idx      = sessions.findIndex(s => s.session_date === today && s.user_id === userId);
            if (idx !== -1) {
                sessions[idx].words_reviewed++;   // in-place, tương đương DO UPDATE
            } else {
                sessions.push({ user_id: userId, session_date: today, words_reviewed: 1 });
            }
            _save(STORAGE_KEYS.sessions, sessions);

            return { newLevel, nextReviewAt: new Date(nextReviewAt), intervalLabel: labels[newLevel] };
        },

        getDashboardStats: async () => {
            const userId   = _load(STORAGE_KEYS.user, {})?.id;
            const progress = _load(STORAGE_KEYS.progress, []).filter(p => p.user_id === userId);
            const sessions = _load(STORAGE_KEYS.sessions, [])
                .filter(s => s.user_id === userId)
                .sort((a, b) => b.session_date.localeCompare(a.session_date));

            const nowTs = Date.now();
            const wordsDueCount = progress.filter(p => new Date(p.next_review_at).getTime() <= nowTs).length;

            const memoryLevels = { lv1: 0, lv2: 0, lv3: 0, lv4: 0, lv5: 0 };
            progress.forEach(p => { memoryLevels[`lv${p.level}`] = (memoryLevels[`lv${p.level}`] || 0) + 1; });

            // Tính streak
            let streak = 0;
            if (sessions.length > 0) {
                const today = new Date(); today.setHours(0,0,0,0);
                const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
                const first = new Date(sessions[0].session_date);
                if (first >= yesterday) {
                    streak = 1;
                    let expected = new Date(first); expected.setDate(expected.getDate() - 1);
                    for (let i = 1; i < sessions.length; i++) {
                        const sd = new Date(sessions[i].session_date);
                        if (sd.toDateString() === expected.toDateString()) {
                            streak++;
                            expected.setDate(expected.getDate() - 1);
                        } else break;
                    }
                }
            }

            return { wordsDueCount, streak, memoryLevels };
        },

        getNextReviewTime: async () => {
            const userId   = _load(STORAGE_KEYS.user, {})?.id;
            const progress = _load(STORAGE_KEYS.progress, []).filter(p => p.user_id === userId);
            const nowTs    = Date.now();
            // Lọc những từ có next_review_at trong tương lai, lấy cái gần nhất
            const future = progress
                .filter(p => new Date(p.next_review_at).getTime() > nowTs)
                .sort((a, b) => new Date(a.next_review_at) - new Date(b.next_review_at));
            return future.length > 0 ? new Date(future[0].next_review_at) : null;
        },

        calculateNextReview: (level, rating) => {
            let newLevel = level;
            if (rating === 'easy') newLevel = Math.min(level + 1, 5);
            else if (rating === 'hard') newLevel = Math.max(level - 1, 1);
            return { newLevel, nextReviewAt: new Date() };
        },

        getIntervalLabel: (level) => {
            const labels = { 1: '1 giờ', 2: '8 giờ', 3: '24 giờ', 4: '5–7 ngày', 5: '15–30 ngày' };
            return labels[level] || 'N/A';
        },

        // ── CUSTOM EXERCISES (MOCK) ───────────────────────────

        getCustomExercises: async () => {
            const exList = _load(STORAGE_KEYS.exercises, []);
            const userId = _load(STORAGE_KEYS.user, {})?.id;
            return exList.filter(e => e.user_id === userId).map(ex => ({
                id:          ex.id,
                title:       ex.title,
                description: ex.description || '',
                category:    ex.category,
                icon:        ex.icon,
                isCustom:    true,
                questions:   (ex.questions || []).sort((a, b) => a.order_index - b.order_index),
                createdAt:   ex.created_at,
            }));
        },

        createCustomExercise: async ({ title, description = '', category = 'custom', icon = 'edit_note' }) => {
            const user   = _load(STORAGE_KEYS.user, {});
            const exList = _load(STORAGE_KEYS.exercises, []);
            const newEx = {
                id:          'ex-cust-' + Date.now(),
                user_id:     user.id,
                title, description, category, icon,
                questions:   [],
                created_at:  new Date().toISOString()
            };
            _save(STORAGE_KEYS.exercises, [newEx, ...exList]);
            return { ...newEx, isCustom: true };
        },

        addExerciseQuestion: async (exerciseId, q) => {
            const exList = _load(STORAGE_KEYS.exercises, []);
            const ex = exList.find(e => e.id === exerciseId);
            if (!ex) throw new Error('Không tìm thấy bài tập');
            
            const newQ = {
                id:          'q-' + Date.now(),
                type:        q.type,
                prompt:      q.prompt,
                options:     q.options || null,
                answer:      q.answer,
                hint:        q.hint || '',
                order_index: q.order_index ?? ex.questions.length,
            };
            ex.questions.push(newQ);
            _save(STORAGE_KEYS.exercises, exList);
            return newQ;
        },

        deleteExerciseQuestion: async (questionId) => {
            const exList = _load(STORAGE_KEYS.exercises, []);
            exList.forEach(ex => {
                ex.questions = ex.questions.filter(q => q.id !== questionId);
            });
            _save(STORAGE_KEYS.exercises, exList);
        },

        deleteCustomExercise: async (exerciseId) => {
            let exList = _load(STORAGE_KEYS.exercises, []);
            exList = exList.filter(e => e.id !== exerciseId);
            _save(STORAGE_KEYS.exercises, exList);
        },

        init: () => { console.log('[HiMock] Mock DB initialized'); },
    };

    // ----------------------------------------------------------
    // ACTIVATE: override HiDB với mockDB
    // ----------------------------------------------------------

    function activate() {
        seed();
        // Override HiDB nếu đã định nghĩa, hoặc tạo HiDB mới
        if (typeof window.HiDB !== 'undefined') {
            Object.assign(window.HiDB, mockDB);
        } else {
            window.HiDB = mockDB;
        }
        window._mockActive = true;
        console.log('[HiMock] ✅ Mock DB đang hoạt động — mọi thao tác dùng localStorage');
    }

    return { activate, seed, reset, mockDB, SAMPLE_WORDS, SAMPLE_TOPICS };

})();

// Tự kích hoạt nếu localStorage có hi_use_mock = "true"
if (localStorage.getItem('hi_use_mock') === 'true') {
    HiMock.activate();
    console.log('[HiMock] Auto-activated từ localStorage flag');
}
