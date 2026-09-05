// ============================================================
// HI - MASTER VOCABULARY | Data Layer + SM-2 Algorithm
// ============================================================
// Cách dùng: nhúng vào HTML trước thẻ <script> chính
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//   <script src="dataLayer.js"></script>
//
// Sau đó gọi:
//   await HiDB.init('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');
// ============================================================

window.HiDB = (() => {

    // ----------------------------------------------------------
    // PRIVATE: Supabase client (khởi tạo qua init())
    // ----------------------------------------------------------
    let _supabase = null;
    let _currentUser;
    const CACHE_TTL_MS = 5 * 60 * 1000;
    const _cache = new Map();

    function _getClient() {
        if (!_supabase) throw new Error('[HiDB] Chưa khởi tạo. Gọi HiDB.init() trước.');
        return _supabase;
    }

    function _cacheGet(key) {
        const cached = _cache.get(key);
        if (!cached) return null;
        if (Date.now() - cached.savedAt > CACHE_TTL_MS) {
            _cache.delete(key);
            return null;
        }
        return cached.value;
    }

    function _cacheSet(key, value) {
        _cache.set(key, { value, savedAt: Date.now() });
        return value;
    }

    function clearCache(prefix = '') {
        if (!prefix) {
            _cache.clear();
            return;
        }
        for (const key of _cache.keys()) {
            if (key.startsWith(prefix)) _cache.delete(key);
        }
    }

    function _invalidateVocabularyCache() {
        clearCache('topics:');
        clearCache('vocabulary:');
        clearCache('lessons:');
        clearCache('topic-words:');
        clearCache('lesson-words:');
    }


    // ============================================================
    // PHẦN 1: SM-2 ALGORITHM (tùy chỉnh)
    // ============================================================

    /**
     * Tính khoảng cách ôn tập (ms) dựa trên level hiện tại.
     * Level 1 → 1 giờ
     * Level 2 → 8 giờ
     * Level 3 → 24 giờ
     * Level 4 → 5–7 ngày (random)
     * Level 5 → 15–30 ngày (random)
     */
    function _getIntervalMs(level) {
        const HOUR = 60 * 60 * 1000;
        const DAY  = 24 * HOUR;

        switch (level) {
            case 0: return HOUR;          // từ mới chưa học
            case 1: return HOUR;
            case 2: return 8  * HOUR;
            case 3: return DAY;
            case 4: return (5  + Math.random() * 2)  * DAY;  // 5–7 ngày
            case 5: return (15 + Math.random() * 15) * DAY;  // 15–30 ngày
            default: return HOUR;
        }
    }

    /**
     * Tính level mới và thời điểm ôn tiếp theo sau khi user đánh giá.
     *
     * @param {number} currentLevel  - Level hiện tại của từ (1–5)
     * @param {'easy'|'good'|'hard'} rating - Đánh giá của user
     * @returns {{ newLevel: number, nextReviewAt: Date }}
     *
     * Logic chuyển level:
     *   easy → tăng 1 level (tối đa 5)
     *   good → giữ nguyên level
     *   hard → giảm 1 level (tối thiểu 1)
     */
    function calculateNextReview(currentLevel, rating) {
        let newLevel = currentLevel;

        // Từ mới (level 0): luôn lên level 1, bất kể đúng hay sai
        if (currentLevel === 0) {
            newLevel = 1;
        } else if (rating === 'easy') {
            newLevel = Math.min(currentLevel + 1, 5);
        } else if (rating === 'hard') {
            newLevel = Math.max(currentLevel - 1, 1); // tối thiểu level 1
        }
        // 'good' → newLevel giữ nguyên

        const intervalMs   = _getIntervalMs(newLevel);
        const nextReviewAt = new Date(Date.now() + intervalMs);

        return { newLevel, nextReviewAt };
    }

    /**
     * Trả về nhãn mô tả khoảng cách ôn (dùng cho UI).
     * Ví dụ: "1 giờ", "8 giờ", "24 giờ", "~6 ngày", "~22 ngày"
     */
    function getIntervalLabel(level) {
        switch (level) {
            case 1: return '1 giờ';
            case 2: return '8 giờ';
            case 3: return '24 giờ';
            case 4: return '5–7 ngày';
            case 5: return '15–30 ngày';
            default: return 'N/A';
        }
    }

    // ============================================================
    // PHẦN 2: AUTH HELPERS
    // ============================================================

    /**
     * Lấy user đang đăng nhập. Trả về null nếu chưa đăng nhập.
     */
    function normalizeTopicCategory(category) {
        return String(category || 'general').trim() || 'general';
    }

    async function getCurrentUser() {
        if (_currentUser !== undefined) return _currentUser;
        const { data: { session } } = await _getClient().auth.getSession();
        _currentUser = session?.user || null;
        return _currentUser;
    }

    /**
     * Đăng nhập qua Google OAuth.
     */
    async function signInWithGoogle() {
        const { error } = await _getClient().auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
        if (error) throw error;
    }

    /**
     * Đăng xuất.
     */
    async function signOut() {
        const { error } = await _getClient().auth.signOut();
        if (error) throw error;
        _currentUser = null;
        clearCache();
    }


    // ============================================================
    // PHẦN 3: TOPICS
    // ============================================================

    /**
     * Lấy toàn bộ chủ đề của user hiện tại.
     * Kèm theo số lượng từ và tiến độ trung bình (%).
     *
     * @returns {Promise<Array>}
     */
    async function getTopics() {
        const user = await getCurrentUser().catch(() => null);
        const cacheKey = `topics:${user?.id || 'anon'}`;
        const cached = _cacheGet(cacheKey);
        if (cached) return cached;

        const { data: summaries, error: rpcError } = await _getClient()
            .rpc('get_topic_summaries');

        if (!rpcError) {
            return _cacheSet(cacheKey, (summaries || []).map(topic => ({
                id: topic.id,
                name: topic.name,
                icon: topic.icon,
                category: normalizeTopicCategory(topic.category),
                totalWords: Number(topic.total_words || 0),
                progress: Number(topic.progress || 0),
                createdAt: topic.created_at,
            })));
        }

        let query = _getClient()
            .from('topics')
            .select(`
                id,
                name,
                icon,
                category,
                created_at,
                words (
                    id,
                    word_progress ( level, user_id )
                )
            `)
            .order('created_at', { ascending: true });

        if (user) {
            query = query.or(`user_id.eq.${user.id},user_id.is.null`);
        } else {
            query = query.is('user_id', null);
        }

        const { data, error } = await query;
        if (error) throw error;

        const topics = (data || []).map(topic => {
            const words = topic.words || [];
            const totalWords = words.length;

            const progresses = user
                ? words.flatMap(w => w.word_progress).filter(p => p.user_id === user.id)
                : [];

            const totalLevel = progresses.reduce((sum, p) => sum + p.level, 0);
            const progress   = totalWords > 0
                ? Math.round((totalLevel / (totalWords * 5)) * 100)
                : 0;

            return {
                id:         topic.id,       // ← QUAN TRỌNG: cần cho _openTopic
                name:       topic.name,
                icon:       topic.icon,
                category:   normalizeTopicCategory(topic.category),
                totalWords,
                progress,
                createdAt:  topic.created_at,
            };
        });
        return _cacheSet(cacheKey, topics);
    }

    /**
     * Tạo chủ đề mới.
     *
     * @param {string} name  - Tên chủ đề
     * @param {string} icon  - Tên icon Material Symbols (mặc định: 'folder')
     * @returns {Promise<Object>} - Topic vừa tạo
     */
    async function createTopic(name, icon = 'folder', category = 'general') {
        const user = await getCurrentUser();
        if (!user) throw new Error('Chưa đăng nhập');

        const normalizedCategory = normalizeTopicCategory(category);

        const { data, error } = await _getClient()
            .from('topics')
            .insert({ user_id: user.id, name, icon, category: normalizedCategory })
            .select()
            .single();

        if (error) throw error;
        _invalidateVocabularyCache();
        return data;
    }

    /**
     * Xóa chủ đề (cascade xóa cả words và word_progress).
     */
    async function deleteTopic(topicId) {
        const { error } = await _getClient()
            .from('topics')
            .delete()
            .eq('id', topicId);

        if (error) throw error;
        _invalidateVocabularyCache();
    }


    // ============================================================
    // PHẦN 4: WORDS
    // ============================================================

    /**
     * Lấy danh sách từ trong một chủ đề, kèm progress của user.
     *
     * @param {string} topicId
     * @returns {Promise<Array>}
     */
    async function getWordsInTopic(topicId) {
        const user = await getCurrentUser().catch(() => null);
        const cacheKey = `topic-words:${user?.id || 'anon'}:${topicId}`;
        const cached = _cacheGet(cacheKey);
        if (cached) return cached;

        const { data, error } = await _getClient()
            .from('words')
            .select(`
                id,
                word,
                phonetic,
                meaning,
                example_sentence,
                word_progress ( level, next_review_at, last_reviewed_at, review_count )
            `)
            .eq('topic_id', topicId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return _cacheSet(cacheKey, data.map(w => {
            // Lấy progress của user hiện tại (nếu có)
            const progress = (w.word_progress || [])[0] || null;
            return {
                id:              w.id,
                word:            w.word,
                phonetic:        w.phonetic,
                meaning:         w.meaning,
                exampleSentence: w.example_sentence,
                level:           progress?.level          ?? 0,   // 0 = chưa học lần nào
                nextReviewAt:    progress?.next_review_at  ?? null,
                lastReviewedAt:  progress?.last_reviewed_at ?? null,
                reviewCount:     progress?.review_count     ?? 0,
                isDue:           !progress || new Date(progress.next_review_at) <= new Date(),
            };
        }));
    }

    function _isEnglishExample(value) {
        const text = String(value || '').trim();
        if (!text || !/[a-z]/i.test(text)) return false;
        if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text)) return false;
        if (/\b(và|là|của|cho|trong|một|những|các|được|không|với|khi|từ|người|này|đó)\b/i.test(text)) return false;
        return true;
    }

    /**
     * Thêm từ vựng mới vào chủ đề.
     *
     * @param {string} topicId
     * @param {Object} wordData - { word, phonetic?, meaning, exampleSentence? }
     * @returns {Promise<Object>}
     */
    async function addWord(topicId, { word, phonetic = '', meaning, exampleSentence = '' }) {
        const { data, error } = await _getClient()
            .from('words')
            .insert({
                topic_id:        topicId,
                word,
                phonetic,
                meaning,
                example_sentence: _isEnglishExample(exampleSentence) ? exampleSentence : '',
            })
            .select()
            .single();

        if (error) throw error;
        _invalidateVocabularyCache();
        return data;
    }

    /**
     * Xóa một từ vựng.
     */
    async function deleteWord(wordId) {
        const { error } = await _getClient()
            .from('words')
            .delete()
            .eq('id', wordId);

        if (error) throw error;
        _invalidateVocabularyCache();
    }

    async function getVocabularyPage(page = 1, pageSize = 50, search = '') {
        const user = await getCurrentUser().catch(() => null);
        const safePage = Math.max(1, Number(page) || 1);
        const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 50));
        const safeSearch = String(search || '').trim();
        const cacheKey = `vocabulary:${user?.id || 'anon'}:${safePage}:${safePageSize}:${safeSearch.toLowerCase()}`;
        const cached = _cacheGet(cacheKey);
        if (cached) return cached;

        const { data: rpcRows, error: rpcError } = await _getClient().rpc('get_vocabulary_page', {
            p_page: safePage,
            p_page_size: safePageSize,
            p_search: safeSearch,
        });

        if (!rpcError) {
            const rows = rpcRows || [];
            return _cacheSet(cacheKey, {
                words: rows.map(row => ({
                    id: row.id,
                    topicId: row.topic_id,
                    word: row.word,
                    phonetic: row.phonetic,
                    meaning: row.meaning,
                    exampleSentence: row.example_sentence,
                    topicName: row.topic_name,
                    level: row.level ?? 0,
                    nextReviewAt: row.next_review_at,
                    lastReviewedAt: row.last_reviewed_at,
                    reviewCount: row.review_count ?? 0,
                })),
                total: Number(rows[0]?.total_count || 0),
                page: safePage,
                pageSize: safePageSize,
            });
        }

        const start = (safePage - 1) * safePageSize;
        let query = _getClient()
            .from('words')
            .select(`
                id, topic_id, word, phonetic, meaning, example_sentence,
                topics!inner ( name ),
                word_progress ( level, next_review_at, last_reviewed_at, review_count )
            `, { count: 'exact' })
            .order('created_at', { ascending: true })
            .range(start, start + safePageSize - 1);

        if (safeSearch) {
            const escaped = safeSearch.replace(/[,%_()]/g, ' ').trim();
            query = query.or(`word.ilike.%${escaped}%,meaning.ilike.%${escaped}%`);
        }

        const { data, error, count } = await query;
        if (error) throw error;
        return _cacheSet(cacheKey, {
            words: (data || []).map(row => {
                const progress = (row.word_progress || [])[0] || null;
                return {
                    id: row.id,
                    topicId: row.topic_id,
                    word: row.word,
                    phonetic: row.phonetic,
                    meaning: row.meaning,
                    exampleSentence: row.example_sentence,
                    topicName: row.topics?.name || '',
                    level: progress?.level ?? 0,
                    nextReviewAt: progress?.next_review_at ?? null,
                    lastReviewedAt: progress?.last_reviewed_at ?? null,
                    reviewCount: progress?.review_count ?? 0,
                };
            }),
            total: Number(count || 0),
            page: safePage,
            pageSize: safePageSize,
        });
    }

    /**
     * Lấy danh sách lesson trong một chủ đề (mỗi lesson tối đa 50 từ).
     * @param {string} topicId
     * @returns {Promise<Array>} - [{ id, topicId, index, name, totalWords, progress, wordIds }]
     */
    async function getWordsForLessonQuery(topicId) {
        const client = _getClient();
        const queryWithLessonMeta = client
            .from('words')
            .select(`id, lesson_name, lesson_order, word_order, word_progress ( level, user_id )`)
            .eq('topic_id', topicId)
            .order('lesson_order', { ascending: true, nullsFirst: false })
            .order('word_order', { ascending: true, nullsFirst: false })
            .order('created_at', { ascending: true });

        const result = await queryWithLessonMeta;
        if (!result.error) return { words: result.data || [], hasLessonMeta: true };

        const fallback = await client
            .from('words')
            .select(`id, word_progress ( level, user_id )`)
            .eq('topic_id', topicId)
            .order('created_at', { ascending: true });

        if (fallback.error) throw fallback.error;
        return { words: fallback.data || [], hasLessonMeta: false };
    }

    async function getLessonWordsQuery(topicId, lessonIndex) {
        const client = _getClient();
        const queryWithLessonMeta = client
            .from('words')
            .select(`id, word, phonetic, meaning, example_sentence, lesson_name, lesson_order, word_order,
                word_progress ( level, next_review_at, last_reviewed_at, review_count )`)
            .eq('topic_id', topicId)
            .eq('lesson_order', lessonIndex)
            .order('word_order', { ascending: true, nullsFirst: false })
            .order('created_at', { ascending: true });

        const result = await queryWithLessonMeta;
        if (!result.error && (result.data || []).length > 0) {
            return { words: result.data, hasLessonMeta: true };
        }

        const LESSON_SIZE = 50;
        const fallback = await client
            .from('words')
            .select(`id, word, phonetic, meaning, example_sentence,
                word_progress ( level, next_review_at, last_reviewed_at, review_count )`)
            .eq('topic_id', topicId)
            .order('created_at', { ascending: true })
            .range(lessonIndex * LESSON_SIZE, (lessonIndex + 1) * LESSON_SIZE - 1);

        if (fallback.error) throw fallback.error;
        return { words: fallback.data || [], hasLessonMeta: false };
    }

    async function getLessonsInTopic(topicId) {
        const LESSON_SIZE = 50;
        const user = await getCurrentUser().catch(() => null);
        const cacheKey = `lessons:${user?.id || 'anon'}:${topicId}`;
        const cached = _cacheGet(cacheKey);
        if (cached) return cached;

        const { words, hasLessonMeta } = await getWordsForLessonQuery(topicId);

        const wordsWithNamedLessons = hasLessonMeta
            ? (words || []).filter(w => w.lesson_name && w.lesson_order !== null && w.lesson_order !== undefined)
            : [];

        if (wordsWithNamedLessons.length > 0) {
            const grouped = new Map();
            for (const word of wordsWithNamedLessons) {
                const key = Number(word.lesson_order);
                if (!grouped.has(key)) {
                    grouped.set(key, {
                        name: word.lesson_name,
                        words: [],
                    });
                }
                grouped.get(key).words.push(word);
            }

            const namedLessons = Array.from(grouped.entries())
                .sort(([a], [b]) => a - b)
                .map(([lessonIndex, group]) => {
                    const chunk = group.words;
                    const totalLevel = user ? chunk.reduce((sum, w) => {
                        const p = (w.word_progress || []).find(p => p.user_id === user.id);
                        return sum + (p?.level ?? 0);
                    }, 0) : 0;
                    return {
                        id:         `lesson-${topicId}-${lessonIndex}`,
                        topicId,
                        index:      lessonIndex,
                        name:       group.name,
                        totalWords: chunk.length,
                        progress:   chunk.length > 0 ? Math.round((totalLevel / (chunk.length * 5)) * 100) : 0,
                        wordIds:    chunk.map(w => w.id),
                    };
                });
            return _cacheSet(cacheKey, namedLessons);
        }

        const lessons = [];
        const allWords = words || [];
        for (let i = 0; i < allWords.length || lessons.length === 0; i += LESSON_SIZE) {
            const chunk = allWords.slice(i, i + LESSON_SIZE);
            const lessonIndex = Math.floor(i / LESSON_SIZE);
            const totalLevel = user ? chunk.reduce((sum, w) => {
                const p = (w.word_progress || []).find(p => p.user_id === user.id);
                return sum + (p?.level ?? 0);
            }, 0) : 0;
            lessons.push({
                id:         `lesson-${topicId}-${lessonIndex}`,
                topicId,
                index:      lessonIndex,
                name:       `Lesson ${lessonIndex + 1}`,
                totalWords: chunk.length,
                progress:   chunk.length > 0 ? Math.round((totalLevel / (chunk.length * 5)) * 100) : 0,
                wordIds:    chunk.map(w => w.id),
            });
            if (i + LESSON_SIZE >= allWords.length) break;
        }
        return _cacheSet(cacheKey, lessons);
    }

    /**
     * Lấy danh sách từ trong một lesson cụ thể.
     * @param {string} topicId
     * @param {number} lessonIndex  - 0-based
     * @returns {Promise<Array>}
     */
    async function getWordsInLesson(topicId, lessonIndex) {
        const user = await getCurrentUser().catch(() => null);
        const cacheKey = `lesson-words:${user?.id || 'anon'}:${topicId}:${lessonIndex}`;
        const cached = _cacheGet(cacheKey);
        if (cached) return cached;

        const { words: data } = await getLessonWordsQuery(topicId, lessonIndex);

        return _cacheSet(cacheKey, (data || []).map(w => {
            const progress = (w.word_progress || [])[0] || null;
            return {
                id:              w.id,
                word:            w.word,
                phonetic:        w.phonetic,
                meaning:         w.meaning,
                exampleSentence: w.example_sentence,
                level:           progress?.level          ?? 0,
                nextReviewAt:    progress?.next_review_at  ?? null,
                lastReviewedAt:  progress?.last_reviewed_at ?? null,
                reviewCount:     progress?.review_count     ?? 0,
                isDue:           !progress || new Date(progress.next_review_at) <= new Date(),
            };
        }));
    }


    // ============================================================
    // PHẦN 5: WORD PROGRESS & SM-2 CORE
    // ============================================================

    /**
     * Lấy danh sách từ đến hạn ôn tập của user (next_review_at <= NOW).
     * Dùng để build session học.
     *
     * @param {number} limit - Giới hạn số từ tối đa (mặc định 20)
     * @returns {Promise<Array>}
     */
    async function getWordsDueForReview(limit = 20) {
        const user = await getCurrentUser();
        if (!user) throw new Error('Chưa đăng nhập');

        const now = new Date().toISOString();

        // Query từ đã có progress và đến hạn
        const { data: dueWords, error: e1 } = await _getClient()
            .from('word_progress')
            .select(`
                level,
                next_review_at,
                words (
                    id,
                    word,
                    phonetic,
                    meaning,
                    example_sentence,
                    topics ( id, name, icon )
                )
            `)
            .eq('user_id', user.id)
            .lte('next_review_at', now)
            .order('next_review_at', { ascending: true })
            .limit(limit);

        if (e1) throw e1;

        // Query từ chưa có progress nào (chưa học lần nào)
        const learnedWordIds = dueWords.map(p => p.words.id);
        const remainingLimit = limit - dueWords.length;

        let newWords = [];
        if (remainingLimit > 0) {
            const { data: allWords, error: e2 } = await _getClient()
                .from('words')
                .select(`
                    id,
                    word,
                    phonetic,
                    meaning,
                    example_sentence,
                    word_progress ( user_id ),
                    topics ( id, name, icon )
                `)
                .limit(remainingLimit + learnedWordIds.length + 10); // buffer

            if (e2) throw e2;

            // Lọc từ user chưa từng học
            newWords = (allWords || [])
                .filter(w => !(w.word_progress || []).some(p => p.user_id === user.id))
                .slice(0, remainingLimit)
                .map(w => ({
                    wordId:          w.id,
                    word:            w.word,
                    phonetic:        w.phonetic,
                    meaning:         w.meaning,
                    exampleSentence: w.example_sentence,
                    level:           0,   // chưa học
                    isNew:           true,
                    topic:           w.topics,
                }));
        }

        const formattedDue = dueWords.map(p => ({
            wordId:          p.words.id,
            word:            p.words.word,
            phonetic:        p.words.phonetic,
            meaning:         p.words.meaning,
            exampleSentence: p.words.example_sentence,
            level:           p.level,
            nextReviewAt:    p.next_review_at,
            isNew:           false,
            topic:           p.words.topics,
        }));

        return [...formattedDue, ...newWords];
    }

    /**
     * Ghi nhận kết quả đánh giá của user cho một từ,
     * tính toán SM-2 và lưu về Supabase.
     *
     * @param {string} wordId
     * @param {'easy'|'good'|'hard'} rating
     * @returns {Promise<{ newLevel: number, nextReviewAt: Date, intervalLabel: string }>}
     */
    async function reviewWord(wordId, rating) {
        const user = await getCurrentUser();
        if (!user) throw new Error('Chưa đăng nhập');

        // Lấy progress hiện tại (nếu có)
        const { data: existing } = await _getClient()
            .from('word_progress')
            .select('level, review_count')
            .eq('user_id', user.id)
            .eq('word_id', wordId)
            .maybeSingle();

        const currentLevel   = existing?.level        ?? 0;
        const currentCount   = existing?.review_count ?? 0;

        // Tính level mới và thời điểm ôn tiếp
        const { newLevel, nextReviewAt } = calculateNextReview(currentLevel, rating);

        const payload = {
            user_id:          user.id,
            word_id:          wordId,
            level:            newLevel,
            next_review_at:   nextReviewAt.toISOString(),
            last_reviewed_at: new Date().toISOString(),
            review_count:     currentCount + 1,
        };

        // Upsert: tạo mới nếu chưa có, cập nhật nếu đã có
        const { error } = await _getClient()
            .from('word_progress')
            .upsert(payload, { onConflict: 'user_id,word_id' });

        if (error) throw error;

        // Cập nhật/tạo bản ghi phiên học hôm nay
        await _logStudySession();
        _invalidateVocabularyCache();

        return {
            newLevel,
            nextReviewAt,
            intervalLabel: getIntervalLabel(newLevel),
        };
    }

    /**
     * Ép một từ về một level cụ thể (bất kể level hiện tại).
     * Dùng khi user sai quá 3 lần trong phiên → reset về lv1.
     *
     * @param {string} wordId
     * @param {number} targetLevel  - level muốn ép về (thường là 1)
     * @returns {Promise<{ newLevel: number, nextReviewAt: Date, intervalLabel: string }>}
     */
    async function reviewWordToLevel(wordId, targetLevel) {
        const user = await getCurrentUser();
        if (!user) throw new Error('Chưa đăng nhập');

        const { data: existing } = await _getClient()
            .from('word_progress')
            .select('review_count')
            .eq('user_id', user.id)
            .eq('word_id', wordId)
            .maybeSingle();

        const currentCount = existing?.review_count ?? 0;
        const newLevel     = Math.max(1, Math.min(5, targetLevel)); // clamp 1–5
        const intervalMs   = _getIntervalMs(newLevel);
        const nextReviewAt = new Date(Date.now() + intervalMs);

        const payload = {
            user_id:          user.id,
            word_id:          wordId,
            level:            newLevel,
            next_review_at:   nextReviewAt.toISOString(),
            last_reviewed_at: new Date().toISOString(),
            review_count:     currentCount + 1,
        };

        const { error } = await _getClient()
            .from('word_progress')
            .upsert(payload, { onConflict: 'user_id,word_id' });

        if (error) throw error;
        await _logStudySession();
        _invalidateVocabularyCache();

        return {
            newLevel,
            nextReviewAt,
            intervalLabel: getIntervalLabel(newLevel),
        };
    }

    /**
     * Log phiên học: tăng words_reviewed thêm 1 cho ngày hôm nay.
     *
     * Dùng RPC `increment_session` (INSERT … ON CONFLICT DO UPDATE)
     * thay cho SELECT → UPDATE/INSERT cũ — tiết kiệm 1 round-trip,
     * đảm bảo atomic khi nhiều tab cùng mở.
     *
     * Fallback về 2-query nếu RPC chưa deploy (tương thích ngược).
     * (private helper)
     */
    async function _logStudySession() {
        const user  = await getCurrentUser();
        if (!user) return;
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        try {
            // ── Cách tối ưu: 1 query atomic ────────────────────────
            const { error } = await _getClient().rpc('increment_session', {
                p_user_id: user.id,
                p_date:    today,
            });

            if (error) {
                // RPC chưa deploy → fallback
                if (error.code === 'PGRST202' || error.message?.includes('increment_session')) {
                    await _logStudySessionFallback(user.id, today);
                } else {
                    console.error('[HiDB] _logStudySession RPC error:', error);
                }
            }
        } catch (err) {
            // Lỗi mạng hoặc bất ngờ → fallback
            await _logStudySessionFallback(user.id, today);
        }
    }

    /**
     * Fallback 2-query (SELECT → UPDATE/INSERT) cho môi trường
     * chưa chạy migration thêm function increment_session.
     * (private helper)
     */
    async function _logStudySessionFallback(userId, today) {
        const { data: existing } = await _getClient()
            .from('study_sessions')
            .select('id, words_reviewed')
            .eq('user_id', userId)
            .eq('session_date', today)
            .maybeSingle();

        if (existing) {
            await _getClient()
                .from('study_sessions')
                .update({ words_reviewed: existing.words_reviewed + 1 })
                .eq('id', existing.id);
        } else {
            await _getClient()
                .from('study_sessions')
                .insert({ user_id: userId, session_date: today, words_reviewed: 1 });
        }
    }


    // ============================================================
    // PHẦN 6: DASHBOARD STATS
    // ============================================================

    /**
     * Lấy toàn bộ số liệu cho Dashboard:
     *   - wordsDueCount : số từ cần ôn hôm nay
     *   - streak        : số ngày học liên tiếp
     *   - memoryLevels  : { lv1, lv2, lv3, lv4, lv5 } - số từ ở mỗi level
     *
     * @returns {Promise<Object>}
     */
    async function getDashboardStats() {
        const user = await getCurrentUser();
        if (!user) throw new Error('Chưa đăng nhập');

        const now = new Date().toISOString();

        // Số từ cần ôn
        const { count: wordsDueCount } = await _getClient()
            .from('word_progress')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .lte('next_review_at', now);

        // Phân bố level
        const { data: progressData } = await _getClient()
            .from('word_progress')
            .select('level')
            .eq('user_id', user.id);

        const memoryLevels = { lv1: 0, lv2: 0, lv3: 0, lv4: 0, lv5: 0 };
        (progressData || []).forEach(p => {
            memoryLevels[`lv${p.level}`] = (memoryLevels[`lv${p.level}`] || 0) + 1;
        });

        // Tính streak: đếm ngày liên tiếp từ hôm nay trở về trước
        const { data: sessions } = await _getClient()
            .from('study_sessions')
            .select('session_date')
            .eq('user_id', user.id)
            .order('session_date', { ascending: false })
            .limit(365);

        const streak = _calculateStreak(sessions || []);

        return {
            wordsDueCount: wordsDueCount ?? 0,
            streak,
            memoryLevels,
        };
    }

    /**
     * Tính streak từ mảng { session_date } (đã sắp xếp DESC).
     * So sánh chuỗi YYYY-MM-DD để tránh sai lệch UTC/local timezone.
     * (private helper)
     */
    function _calculateStreak(sessions) {
        if (!sessions.length) return 0;

        // Lấy ngày hôm nay và hôm qua dưới dạng YYYY-MM-DD (local)
        const _localDateStr = (d) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${dd}`;
        };

        const today     = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const todayStr     = _localDateStr(today);
        const yesterdayStr = _localDateStr(yesterday);

        // Ngày gần nhất phải là hôm nay hoặc hôm qua mới giữ chuỗi
        const firstStr = sessions[0].session_date;
        if (firstStr < yesterdayStr) return 0;   // so sánh chuỗi an toàn

        let streak   = 1;
        // ngày dự kiến tiếp theo (cần khớp) = first - 1 ngày
        const prev   = new Date(firstStr + 'T00:00:00'); // parse local
        prev.setDate(prev.getDate() - 1);

        for (let i = 1; i < sessions.length; i++) {
            const sd = sessions[i].session_date;
            if (sd === _localDateStr(prev)) {
                streak++;
                prev.setDate(prev.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    }

    /**
     * Lấy thời điểm ôn tập kế tiếp gần nhất của user (từ hiện tại trở đi).
     * Dùng để hiển thị countdown trên dashboard khi đã ôn xong hôm nay.
     *
     * @returns {Promise<Date|null>}  - null nếu không có từ nào
     */
    async function getNextReviewTime() {
        const user = await getCurrentUser();
        if (!user) return null;

        const now = new Date().toISOString();

        const { data, error } = await _getClient()
            .from('word_progress')
            .select('next_review_at')
            .eq('user_id', user.id)
            .gt('next_review_at', now)       // chỉ lấy các từ trong tương lai
            .order('next_review_at', { ascending: true })
            .limit(1);

        if (error || !data || data.length === 0) return null;
        return new Date(data[0].next_review_at);
    }


    /**
     * Lấy danh sách các phiên học trong một tháng cụ thể (kèm số từ đã ôn).
     * Phục vụ hiển thị Lịch giữ lửa (Heatmap Calendar).
     *
     * @param {number} year  - Ví dụ: 2026
     * @param {number} month - 1..12
     * @returns {Promise<Object>} - Object dạng { 'YYYY-MM-DD': words_reviewed }
     */
    async function getMonthlyStudySessions(year, month) {
        const user = await getCurrentUser().catch(() => null);
        const result = {};

        // 1. Đọc từ local cache / offline trước
        try {
            const localData = JSON.parse(localStorage.getItem('hi_study_sessions') || '{}');
            Object.assign(result, localData);
        } catch (_) {}

        if (!user) return result;

        // 2. Query từ Supabase study_sessions
        const startMonthStr = String(month).padStart(2, '0');
        const startDateStr = `${year}-${startMonthStr}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDateStr = `${year}-${startMonthStr}-${String(lastDay).padStart(2, '0')}`;

        try {
            const { data, error } = await _getClient()
                .from('study_sessions')
                .select('session_date, words_reviewed')
                .eq('user_id', user.id)
                .gte('session_date', startDateStr)
                .lte('session_date', endDateStr);

            if (!error && data) {
                data.forEach(row => {
                    const dateKey = typeof row.session_date === 'string' 
                        ? row.session_date.split('T')[0] 
                        : row.session_date;
                    result[dateKey] = Number(row.words_reviewed || 0);
                });
            }
        } catch (err) {
            console.warn('[HiDB] getMonthlyStudySessions error:', err);
        }

        return result;
    }

    /**
     * Lấy thông tin Mục tiêu IELTS & Ngày thi của user.
     * @returns {Promise<Object|null>}
     */
    async function getIELTSGoal() {
        let goal = null;
        try {
            const raw = localStorage.getItem('hi_ielts_goal');
            if (raw) goal = JSON.parse(raw);
        } catch (_) {}

        const user = await getCurrentUser().catch(() => null);
        if (user && user.user_metadata?.ielts_goal) {
            goal = user.user_metadata.ielts_goal;
            try { localStorage.setItem('hi_ielts_goal', JSON.stringify(goal)); } catch(_) {}
        }
        return goal;
    }

    /**
     * Lưu Mục tiêu IELTS & Ngày thi của user.
     * @param {Object} goalData - { examDate, overall, listening, reading, writing, speaking, motto }
     */
    async function saveIELTSGoal(goalData) {
        if (!goalData) return;
        try {
            localStorage.setItem('hi_ielts_goal', JSON.stringify(goalData));
        } catch (_) {}

        const user = await getCurrentUser().catch(() => null);
        if (user && _getClient()?.auth) {
            try {
                await _getClient().auth.updateUser({
                    data: { ielts_goal: goalData }
                });
            } catch (err) {
                console.warn('[HiDB] saveIELTSGoal sync error:', err);
            }
        }
        return goalData;
    }

    // ============================================================
    // PHẦN 7: PUBLIC API
    // ============================================================

    /**
     * Khởi tạo Supabase client. GỌI HÀM NÀY ĐẦU TIÊN.
     *
     * @param {string} supabaseUrl  - URL dự án Supabase
     * @param {string} supabaseKey  - Anon/Public key
     */
    function init(supabaseUrl, supabaseKey) {
        if (typeof window.supabase === 'undefined') {
            throw new Error('[HiDB] Chưa load thư viện Supabase JS. Thêm <script> trước dataLayer.js');
        }
        _supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        console.log('[HiDB] ✅ Khởi tạo thành công');
        return _supabase;
    }

    // ============================================================
    // CUSTOM EXERCISES
    // ============================================================

    /**
     * Lấy tất cả bài tập tùy chỉnh của user (kèm câu hỏi).
     * @returns {Promise<Array>} mảng exercise objects
     */
    async function getCustomExercises() {
        const user = await getCurrentUser();
        if (!user) return [];

        const { data, error } = await _getClient()
            .from('exercises')
            .select(`
                *,
                exercise_questions ( * )
            `)
            .or(`user_id.eq.${user.id},user_id.is.null`)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(ex => ({
            id:          ex.id,
            title:       ex.title,
            description: ex.description || '',
            category:    ex.category,
            icon:        ex.icon,
            topic_group: ex.topic_group || null,
            isCustom:    true,
            questions:   (ex.exercise_questions || [])
                .sort((a, b) => a.order_index - b.order_index)
                .map(q => ({
                    id:           q.id,
                    type:         q.question_type,
                    prompt:       q.prompt,
                    options:      q.options || null,
                    answer:       q.answer,
                    hint:         q.hint || '',
                    order_index:  q.order_index,
                })),
            createdAt: ex.created_at,
        }));
    }

    /**
     * Tạo bài tập tùy chỉnh mới.
     * @param {{ title, description, category, icon }} info
     * @returns {Promise<Object>} exercise vừa tạo
     */
    async function createCustomExercise({ title, description = '', category = 'custom', icon = 'edit_note', topic_group = null }) {
        const user = await getCurrentUser();
        if (!user) throw new Error('Chưa đăng nhập');

        const { data, error } = await _getClient()
            .from('exercises')
            .insert({ user_id: user.id, title, description, category, icon, topic_group })
            .select()
            .single();

        if (error) throw error;
        return { ...data, isCustom: true, questions: [] };
    }

    /**
     * Thêm câu hỏi vào bài tập.
     * @param {string} exerciseId
     * @param {{ type, prompt, options, answer, hint, order_index }} q
     */
    async function addExerciseQuestion(exerciseId, q) {
        const { data, error } = await _getClient()
            .from('exercise_questions')
            .insert({
                exercise_id:   exerciseId,
                question_type: q.type,
                prompt:        q.prompt,
                options:       q.options || null,
                answer:        q.answer,
                hint:          q.hint   || null,
                order_index:   q.order_index ?? 0,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Xóa một câu hỏi.
     * @param {string} questionId
     */
    async function deleteExerciseQuestion(questionId) {
        const { error } = await _getClient()
            .from('exercise_questions')
            .delete()
            .eq('id', questionId);
        if (error) throw error;
    }

    /**
     * Xóa toàn bộ bài tập tùy chỉnh (câu hỏi xóa cascade).
     * @param {string} exerciseId
     */
    async function deleteCustomExercise(exerciseId) {
        const { error } = await _getClient()
            .from('exercises')
            .delete()
            .eq('id', exerciseId);
        if (error) throw error;
    }

    // Export public API
    // Export public API
    return {
        onAuthStateChange: (callback) => {
            if (!_supabase) throw new Error('[HiDB] Chưa khởi tạo');
            return _supabase.auth.onAuthStateChange((event, session) => {
                _currentUser = session?.user || null;
                clearCache();
                callback(event, session);
            });
        },
        // Setup
        init,

        // Auth
        getCurrentUser,
        signInWithGoogle,
        signOut,

        // Topics
        getTopics,
        createTopic,
        deleteTopic,

        // Words
        getWordsInTopic,
        getVocabularyPage,
        addWord,
        deleteWord,
        getLessonsInTopic,
        getWordsInLesson,

        // SM-2 Core
        getWordsDueForReview,
        reviewWord,
        reviewWordToLevel,      // ép từ về level cụ thể (dùng khi skip)
        calculateNextReview,    // export để test / debug
        getIntervalLabel,
        clearCache,

        // Dashboard & Calendar & Goals
        getDashboardStats,
        getNextReviewTime,
        getMonthlyStudySessions,
        getIELTSGoal,
        saveIELTSGoal,

        // Custom Exercises
        getCustomExercises,
        createCustomExercise,
        addExerciseQuestion,
        deleteExerciseQuestion,
        deleteCustomExercise,
    };

})();

// ============================================================
// HƯỚNG DẪN TÍCH HỢP VÀO A7.html
// ============================================================
//
// 1. Thêm vào <head> (sau Tailwind):
//    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//    <script src="dataLayer.js"></script>
//
// 2. Khởi tạo ở đầu <script> chính (hoặc DOMContentLoaded):
//    await HiDB.init(
//        'https://xxxx.supabase.co',
//        'your-anon-key'
//    );
//
// 3. Thay thế window.rateCard:
//    window.rateCard = async function(rating) {
//        const result = await HiDB.reviewWord(currentWordId, rating);
//        console.log(`Level mới: ${result.newLevel}, ôn lại sau: ${result.intervalLabel}`);
//    };
//
// 4. Load session học:
//    const words = await HiDB.getWordsDueForReview(20);
//    // words = [{ wordId, word, phonetic, meaning, level, isNew, ... }]
//
// 5. Load dashboard:
//    const stats = await HiDB.getDashboardStats();
//    // stats = { wordsDueCount: 24, streak: 7, memoryLevels: { lv1: 15, ... } }
// ============================================================
