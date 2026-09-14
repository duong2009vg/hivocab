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
    let _readyPromise = null;
    let _onReadyResolve = null;

    function ensureReady(timeoutMs = 6000) {
        if (_supabase) return Promise.resolve(_supabase);
        if (!_readyPromise) {
            _readyPromise = new Promise((resolve) => {
                _onReadyResolve = resolve;
            });
        }
        return Promise.race([
            _readyPromise,
            new Promise((resolve, reject) => setTimeout(() => {
                if (_supabase) resolve(_supabase);
                else reject(new Error('[HiDB] Quá thời gian chờ khởi tạo Supabase.'));
            }, timeoutMs))
        ]);
    }
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
        clearCache('cam-hierarchy:');
        clearCache('passage-words:');
        clearCache('test-words:');
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
     * Đăng nhập bằng Email & Mật khẩu.
     */
    async function signInWithPassword(email, password) {
        const { data, error } = await _getClient().auth.signInWithPassword({ email, password });
        if (error) throw error;
        _currentUser = data.user;
        return data;
    }

    /**
     * Đăng ký tài khoản mới bằng Email & Mật khẩu.
     */
    async function signUpWithPassword(email, password) {
        const { data, error } = await _getClient().auth.signUp({
            email,
            password,
            options: { emailRedirectTo: window.location.origin }
        });
        if (error) throw error;
        return data;
    }

    /**
     * Gửi email khôi phục / đặt lại mật khẩu.
     */
    async function resetPasswordForEmail(email) {
        // Luôn sử dụng origin sạch để Supabase gắn token/code mà không gây lỗi phân giải RFC 6749
        const redirectUrl = window.location.origin;
        const { data, error } = await _getClient().auth.resetPasswordForEmail(email, {
            redirectTo: redirectUrl
        });
        if (error) throw error;
        return data;
    }

    /**
     * Xác thực bằng mã OTP (One-Time Password) 6 chữ số gửi qua email.
     * Hữu ích khi link email bị bot scanner nuốt hoặc người dùng nhập mã thủ công.
     */
    async function verifyOtp({ email, token, type = 'recovery' }) {
        const { data, error } = await _getClient().auth.verifyOtp({
            email,
            token,
            type
        });
        if (error) throw error;
        if (data?.session?.user) {
            _currentUser = data.session.user;
        }
        return data;
    }

    /**
     * Cập nhật mật khẩu mới cho user đang có session (sau khi click link recovery hoặc đổi mật khẩu trong Settings).
     */
    async function updateUserPassword(newPassword) {
        const { data, error } = await _getClient().auth.updateUser({ password: newPassword });
        if (error) throw error;
        return data;
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
                ? words.flatMap(w => w.word_progress || []).filter(p => p && p.user_id === user.id)
                : [];

            const totalLevel = progresses.reduce((sum, p) => sum + (p && p.level ? p.level : 0), 0);
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

        // Sắp xếp chủ đề tự nhiên theo tên (Unit 02..26, IELTS Vol 1..9, CAM 10..21)
        topics.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' }));

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

        const client = _getClient();
        let allData = [];
        let from = 0;
        const PAGE_SIZE = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await client
                .from('words')
                .select(`
                    id,
                    word,
                    pos,
                    phonetic,
                    meaning,
                    example_sentence,
                    image_url,
                    word_progress ( level, next_review_at, last_reviewed_at, review_count )
                `)
                .eq('topic_id', topicId)
                .order('created_at', { ascending: true })
                .range(from, from + PAGE_SIZE - 1);

            if (error) throw error;
            if (data && data.length > 0) {
                allData.push(...data);
                if (data.length < PAGE_SIZE) {
                    hasMore = false;
                } else {
                    from += PAGE_SIZE;
                }
            } else {
                hasMore = false;
            }
        }

        return _cacheSet(cacheKey, allData.map(w => {
            // Lấy progress của user hiện tại (nếu có)
            const progress = (w.word_progress || [])[0] || null;
            return {
                id:              w.id,
                word:            w.word,
                pos:             w.pos || '',
                phonetic:        w.phonetic,
                meaning:         w.meaning,
                exampleSentence: w.example_sentence,
                imageUrl:        w.image_url || null,
                image_url:       w.image_url || null,
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
     * @param {Object} wordData - { word, phonetic?, meaning, exampleSentence?, passageId?, autoProgress? }
     * @returns {Promise<Object>}
     */
    async function addWord(topicId, { word, phonetic = '', meaning, exampleSentence = '', passageId = null, autoProgress = true }) {
        const payload = {
            topic_id:        topicId,
            word:            String(word || '').trim(),
            phonetic:        String(phonetic || '').trim(),
            meaning:         String(meaning || '').trim(),
            example_sentence: _isEnglishExample(exampleSentence) ? String(exampleSentence).trim() : '',
        };
        if (passageId) {
            payload.passage_id = passageId;
        }

        const { data, error } = await _getClient()
            .from('words')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;

        // Tự động khởi tạo tiến độ học cho từ vựng cá nhân
        if (autoProgress && data?.id) {
            try {
                const user = await getCurrentUser().catch(() => null);
                if (user?.id) {
                    await _getClient()
                        .from('word_progress')
                        .upsert({
                            user_id: user.id,
                            word_id: data.id,
                            level: 1,
                            next_review_at: new Date().toISOString(),
                            review_count: 0,
                            created_at: new Date().toISOString()
                        }, { onConflict: 'user_id,word_id' });
                }
            } catch (pErr) {
                console.warn('[addWord:autoProgress]', pErr);
            }
        }

        _invalidateVocabularyCache();
        return data;
    }

    /**
     * Thêm từ vựng hàng loạt (Batch import) vào topic và tự động gắn tiến độ học.
     * @param {string} topicId 
     * @param {Array<{word: string, phonetic?: string, meaning: string, exampleSentence?: string}>} wordsList 
     * @returns {Promise<Array<Object>>}
     */
    async function addWordsBatch(topicId, wordsList = [], passageId = null) {
        if (!topicId) throw new Error('Thiếu topicId khi thêm từ hàng loạt');
        if (!Array.isArray(wordsList) || wordsList.length === 0) return [];

        const sanitized = wordsList
            .filter(w => w && String(w.word || '').trim() && String(w.meaning || '').trim())
            .map(w => {
                const row = {
                    topic_id: topicId,
                    word: String(w.word).trim(),
                    phonetic: String(w.phonetic || '').trim(),
                    meaning: String(w.meaning).trim(),
                    example_sentence: _isEnglishExample(w.exampleSentence || w.example) ? String(w.exampleSentence || w.example).trim() : '',
                };
                const pid = passageId || w.passageId || w.passage_id;
                if (pid) row.passage_id = pid;
                return row;
            });

        if (sanitized.length === 0) {
            throw new Error('Danh sách từ không hợp lệ hoặc thiếu thông tin từ/nghĩa.');
        }

        // Insert vào bảng words
        const { data: insertedWords, error: insErr } = await _getClient()
            .from('words')
            .insert(sanitized)
            .select('id, word, meaning, topic_id, passage_id');

        if (insErr) throw insErr;

        // Tự động khởi tạo tiến độ học cho tất cả các từ vừa thêm
        const user = await getCurrentUser().catch(() => null);
        if (user?.id && Array.isArray(insertedWords) && insertedWords.length > 0) {
            const now = new Date().toISOString();
            const progressRows = insertedWords.map(w => ({
                user_id: user.id,
                word_id: w.id,
                level: 1,
                next_review_at: now,
                review_count: 0,
                created_at: now
            }));

            const { error: progErr } = await _getClient()
                .from('word_progress')
                .upsert(progressRows, { onConflict: 'user_id,word_id' });

            if (progErr) console.warn('[addWordsBatch:progress]', progErr);
        }

        _invalidateVocabularyCache();
        return insertedWords || [];
    }

    /**
     * Đảm bảo người dùng có một chủ đề cá nhân mặc định để lưu từ từ Sổ từ.
     * @returns {Promise<{id: string, name: string, icon: string}|null>}
     */
    async function ensureUserPersonalTopic() {
        const user = await getCurrentUser();
        if (!user) throw new Error('Chưa đăng nhập');

        // Tìm topic cá nhân có tên "Sổ tay từ vựng của tôi"
        const { data: existing } = await _getClient()
            .from('topics')
            .select('id, name, icon')
            .eq('user_id', user.id)
            .ilike('name', '%Sổ tay từ vựng%')
            .limit(1)
            .maybeSingle();

        if (existing) return existing;

        // Hoặc lấy topic đầu tiên do user này tạo
        const { data: firstTopic } = await _getClient()
            .from('topics')
            .select('id, name, icon')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

        return firstTopic || null;
    }

    /**
     * Lấy thống kê số liệu trí nhớ SM-2 cho trang Sổ từ của cá nhân.
     * @returns {Promise<{total: number, due: number, learning: number, mastered: number}>}
     */
    async function getLearnedVocabStats() {
        const user = await getCurrentUser().catch(() => null);
        if (!user) {
            return { total: 0, due: 0, learning: 0, mastered: 0 };
        }

        const now = new Date().toISOString();

        // Lấy tất cả bản ghi word_progress của user
        const { data, error } = await _getClient()
            .from('word_progress')
            .select('level, next_review_at')
            .eq('user_id', user.id);

        if (error || !data) {
            return { total: 0, due: 0, learning: 0, mastered: 0 };
        }

        let due = 0;
        let learning = 0;
        let mastered = 0;

        data.forEach(item => {
            const lv = Number(item.level) || 0;
            if (item.next_review_at && item.next_review_at <= now) {
                due++;
            }
            if (lv >= 4) {
                mastered++;
            } else {
                learning++;
            }
        });

        return {
            total: data.length,
            due,
            learning,
            mastered
        };
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

    /**
     * Lấy danh sách từ vựng ĐÃ HỌC (hoặc do user tạo) cho trang Sổ từ / Kho từ vựng.
     * @param {number} page
     * @param {number} pageSize
     * @param {string} search
     * @param {number|null} levelFilter - null: tất cả, -1: cần ôn, 0-5: level cụ thể
     * @param {string|null} topicIdFilter
     * @returns {Promise<{words: Array, total: number, page: number, pageSize: number}>}
     */
    async function getVocabularyPage(page = 1, pageSize = 50, search = '', levelFilter = null, topicIdFilter = null) {
        const user = await getCurrentUser().catch(() => null);
        const safePage = Math.max(1, Number(page) || 1);
        const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 50));
        const safeSearch = String(search || '').trim();
        const safeLevel = (levelFilter !== undefined && levelFilter !== null && levelFilter !== '') ? Number(levelFilter) : null;
        const safeTopicId = topicIdFilter ? String(topicIdFilter).trim() : null;

        const cacheKey = `vocabulary:${user?.id || 'anon'}:${safePage}:${safePageSize}:${safeSearch.toLowerCase()}:${safeLevel}:${safeTopicId}`;
        const cached = _cacheGet(cacheKey);
        if (cached) return cached;

        const rpcParams = {
            p_page: safePage,
            p_page_size: safePageSize,
            p_search: safeSearch,
        };
        if (safeLevel !== null && !isNaN(safeLevel)) {
            rpcParams.p_level_filter = safeLevel;
        }
        if (safeTopicId) {
            rpcParams.p_topic_id = safeTopicId;
        }

        const { data: rpcRows, error: rpcError } = await _getClient().rpc('get_vocabulary_page', rpcParams);

        if (!rpcError) {
            const rows = rpcRows || [];
            return _cacheSet(cacheKey, {
                words: rows.map(row => ({
                    id: row.id,
                    topicId: row.topic_id,
                    word: row.word,
                    pos: row.pos || '',
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

        // Fallback Supabase client-side query nếu RPC không khả dụng
        const start = (safePage - 1) * safePageSize;
        let query = _getClient()
            .from('words')
            .select(`
                id, topic_id, word, pos, phonetic, meaning, example_sentence, image_url, created_at,
                topics!inner ( id, name, user_id ),
                word_progress!inner ( level, next_review_at, last_reviewed_at, review_count, user_id )
            `, { count: 'exact' });

        if (user?.id) {
            query = query.eq('word_progress.user_id', user.id);
        }

        if (safeTopicId) {
            query = query.eq('topic_id', safeTopicId);
        }

        if (safeLevel !== null && !isNaN(safeLevel)) {
            if (safeLevel === -1) {
                query = query.lte('word_progress.next_review_at', new Date().toISOString());
            } else {
                query = query.eq('word_progress.level', safeLevel);
            }
        }

        if (safeSearch) {
            const escaped = safeSearch.replace(/[,%_()]/g, ' ').trim();
            query = query.or(`word.ilike.%${escaped}%,meaning.ilike.%${escaped}%`);
        }

        query = query.order('created_at', { ascending: false })
            .range(start, start + safePageSize - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        return _cacheSet(cacheKey, {
            words: (data || []).map(row => {
                const progress = (row.word_progress || [])[0] || null;
                return {
                    id: row.id,
                    topicId: row.topic_id,
                    word: row.word,
                    pos: row.pos || '',
                    phonetic: row.phonetic,
                    meaning: row.meaning,
                    exampleSentence: row.example_sentence,
                    imageUrl: row.image_url || null,
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
        let words = [];
        let from = 0;
        const PAGE_SIZE = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await client
                .from('words')
                .select(`id, lesson_name, lesson_order, word_order, word_progress ( level, user_id )`)
                .eq('topic_id', topicId)
                .order('lesson_order', { ascending: true, nullsFirst: false })
                .order('word_order', { ascending: true, nullsFirst: false })
                .order('created_at', { ascending: true })
                .range(from, from + PAGE_SIZE - 1);

            if (error) {
                // Fallback without lesson_name / lesson_order if schema is older
                const { data: fallback, error: fbErr } = await client
                    .from('words')
                    .select(`id, word_progress ( level, user_id )`)
                    .eq('topic_id', topicId)
                    .order('created_at', { ascending: true });
                if (fbErr) throw fbErr;
                return { words: fallback || [], hasLessonMeta: false };
            }

            if (data && data.length > 0) {
                words.push(...data);
                if (data.length < PAGE_SIZE) {
                    hasMore = false;
                } else {
                    from += PAGE_SIZE;
                }
            } else {
                hasMore = false;
            }
        }

        return { words, hasLessonMeta: true };
    }

    async function getLessonWordsQuery(topicId, lessonIndex) {
        const client = _getClient();
        const queryWithLessonMeta = client
            .from('words')
            .select(`id, word, pos, phonetic, meaning, example_sentence, image_url, lesson_name, lesson_order, word_order,
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
            .select(`id, word, pos, phonetic, meaning, example_sentence, image_url,
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
                pos:             w.pos || '',
                phonetic:        w.phonetic,
                meaning:         w.meaning,
                exampleSentence: w.example_sentence,
                imageUrl:        w.image_url || w.imageUrl || null,
                image_url:       w.image_url || w.imageUrl || null,
                level:           progress?.level          ?? 0,
                nextReviewAt:    progress?.next_review_at  ?? null,
                lastReviewedAt:  progress?.last_reviewed_at ?? null,
                reviewCount:     progress?.review_count     ?? 0,
                isDue:           !progress || new Date(progress.next_review_at) <= new Date(),
            };
        }));
    }

    /**
     * Lấy danh sách Tests và Passages của một topic (nếu có cấu trúc Test -> Passage).
     * @param {string} topicId
     * @returns {Promise<{ hasTests: boolean, tests: Array }>}
     */
    async function getTopicTests(topicId) {
        if (!topicId) return { hasTests: false, tests: [] };
        const cacheKey = `topic_tests:${topicId}`;
        const cached = _cacheGet(cacheKey);
        if (cached && cached.hasTests && Array.isArray(cached.tests) && cached.tests.length > 0) {
            return cached;
        }

        try {
            await ensureReady().catch(() => null);
            const client = _getClient();
            const { data: testsData, error: testsErr } = await client
                .from('tests')
                .select('id, name, test_order')
                .eq('topic_id', topicId)
                .order('test_order', { ascending: true });

            if (testsErr) {
                console.warn('[getTopicTests] client error:', testsErr);
            }

            if (testsData && testsData.length > 0) {
                const { data: passagesData } = await client
                    .from('passages')
                    .select('id, test_id, passage_number, title')
                    .eq('topic_id', topicId)
                    .order('passage_number', { ascending: true });

                const passagesByTest = {};
                (passagesData || []).forEach(p => {
                    if (!passagesByTest[p.test_id]) passagesByTest[p.test_id] = [];
                    passagesByTest[p.test_id].push({
                        id: p.id,
                        passageNumber: p.passage_number,
                        title: p.title || `Passage ${p.passage_number}`
                    });
                });

                const tests = testsData.map(t => ({
                    id: t.id,
                    name: t.name,
                    testOrder: t.test_order,
                    passages: passagesByTest[t.id] || []
                }));

                return _cacheSet(cacheKey, { hasTests: true, tests });
            }

            // Fallback 1: Thử lấy qua getCamHierarchy nếu topic có cấu trúc exam
            const camHier = await getCamHierarchy(topicId).catch(() => null);
            if (camHier && camHier.tests && camHier.tests.length > 0) {
                const tests = camHier.tests.map(t => ({
                    id: t.id,
                    name: t.name,
                    testOrder: t.testOrder || t.test_order || 1,
                    passages: (t.passages || []).map(p => ({
                        id: p.id,
                        passageNumber: p.passageNumber || p.passage_number || 1,
                        title: p.title || `Passage ${p.passageNumber || p.passage_number || 1}`
                    }))
                }));
                return _cacheSet(cacheKey, { hasTests: true, tests });
            }

            // Fallback 2: Thử fetch REST trực tiếp nếu Supabase JS client gặp vấn đề
            if (typeof fetch === 'function') {
                const supabaseUrl = 'https://swehdtrqjyklmsefkjdf.supabase.co';
                const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3ZWhkdHJxanlrbG1zZWZramRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTc4MDcsImV4cCI6MjA5Mzk3MzgwN30.dXRhEmvS8J21aJ3dwZ4jHaWuKbhNw2yys90YTIop2EU';
                const headers = {
                    'apikey': anonKey,
                    'Authorization': `Bearer ${anonKey}`
                };
                const user = await getCurrentUser().catch(() => null);
                if (user?.access_token) {
                    headers['Authorization'] = `Bearer ${user.access_token}`;
                }

                const rTests = await fetch(`${supabaseUrl}/rest/v1/tests?topic_id=eq.${topicId}&select=id,name,test_order&order=test_order.asc`, { headers });
                if (rTests.ok) {
                    const tData = await rTests.json();
                    if (Array.isArray(tData) && tData.length > 0) {
                        const rPass = await fetch(`${supabaseUrl}/rest/v1/passages?topic_id=eq.${topicId}&select=id,test_id,passage_number,title&order=passage_number.asc`, { headers });
                        const pData = rPass.ok ? await rPass.json() : [];
                        const passagesByTest = {};
                        (pData || []).forEach(p => {
                            if (!passagesByTest[p.test_id]) passagesByTest[p.test_id] = [];
                            passagesByTest[p.test_id].push({
                                id: p.id,
                                passageNumber: p.passage_number,
                                title: p.title || `Passage ${p.passage_number}`
                            });
                        });
                        const tests = tData.map(t => ({
                            id: t.id,
                            name: t.name,
                            testOrder: t.test_order,
                            passages: passagesByTest[t.id] || []
                        }));
                        return _cacheSet(cacheKey, { hasTests: true, tests });
                    }
                }
            }

            return { hasTests: false, tests: [] };
        } catch (err) {
            console.warn('[getTopicTests]', err);
            return { hasTests: false, tests: [] };
        }
    }

    /**
     * Lấy cấu trúc phân cấp Cambridge (Tests -> Passages) của một chủ đề.
     * Trả về null nếu topic không có tests/passages (ví dụ Non-CAM topic).
     *
     * @param {string} topicId
     * @returns {Promise<{ tests: Array, unlinkedWords: Array, totalWords: number, progress: number } | null>}
     */
    async function getCamHierarchy(topicId) {
        const user = await getCurrentUser().catch(() => null);
        const cacheKey = `cam-hierarchy:${user?.id || 'anon'}:${topicId}`;
        const cached = _cacheGet(cacheKey);
        if (cached) return cached;

        const client = _getClient();

        // 1. Lấy danh sách tests của topic
        const { data: testsData, error: testsError } = await client
            .from('tests')
            .select('id, name, test_order')
            .eq('topic_id', topicId)
            .order('test_order', { ascending: true });

        if (testsError || !testsData || testsData.length === 0) {
            return null; // Không có tests -> fallback về giao diện lesson thường
        }

        // 2. Lấy danh sách passages của topic
        const { data: passagesData, error: passagesError } = await client
            .from('passages')
            .select('id, test_id, passage_number, title, topic_label, content_en, content_vi')
            .eq('topic_id', topicId)
            .order('passage_number', { ascending: true });

        if (passagesError || !passagesData || passagesData.length === 0) {
            return null;
        }

        // 3. Lấy thống kê từ vựng & tiến độ theo passage
        let passageStats = null;
        try {
            const { data: rpcStats, error: rpcErr } = await client
                .rpc('get_cam_passage_stats', { p_topic_id: topicId });
            if (!rpcErr && Array.isArray(rpcStats)) {
                passageStats = new Map();
                for (const row of rpcStats) {
                    passageStats.set(row.passage_id, {
                        totalWords: Number(row.total_words || 0),
                        progress: Number(row.progress || 0)
                    });
                }
            }
        } catch (rpcEx) {
            console.warn('[getCamHierarchy] RPC get_cam_passage_stats error, falling back:', rpcEx);
        }

        const passageWordsMap = new Map();
        const unlinkedWords = [];

        if (passageStats) {
            // Lấy từ vựng unlinked (nếu có - thường chỉ trong các CAM folder người dùng tự tạo)
            const { data: unlinkedData } = await client
                .from('words')
                .select(`
                    id,
                    word,
                    phonetic,
                    meaning,
                    example_sentence,
                    image_url,
                    created_at,
                    word_progress ( level, user_id )
                `)
                .eq('topic_id', topicId)
                .is('passage_id', null)
                .order('created_at', { ascending: true });

            for (const w of (unlinkedData || [])) {
                const userProgress = user
                    ? (w.word_progress || []).find(p => p.user_id === user.id)
                    : null;
                unlinkedWords.push({
                    id:              w.id,
                    word:            w.word,
                    phonetic:        w.phonetic,
                    meaning:         w.meaning,
                    exampleSentence: w.example_sentence,
                    imageUrl:        w.image_url || null,
                    image_url:       w.image_url || null,
                    passageId:       null,
                    level:           userProgress?.level ?? 0,
                });
            }
        } else {
            // Fallback: Phân trang để vượt qua giới hạn 1,000 dòng của PostgREST
            const PAGE_SIZE = 1000;
            let from = 0;
            let hasMore = true;
            const allWords = [];

            while (hasMore) {
                const { data: chunk, error: chunkErr } = await client
                    .from('words')
                    .select(`
                        id,
                        passage_id,
                        word,
                        phonetic,
                        meaning,
                        example_sentence,
                        image_url,
                        word_order,
                        created_at,
                        word_progress ( level, user_id )
                    `)
                    .eq('topic_id', topicId)
                    .order('created_at', { ascending: true })
                    .range(from, from + PAGE_SIZE - 1);

                if (chunkErr) throw chunkErr;
                if (chunk && chunk.length > 0) {
                    allWords.push(...chunk);
                    if (chunk.length < PAGE_SIZE) {
                        hasMore = false;
                    } else {
                        from += PAGE_SIZE;
                    }
                } else {
                    hasMore = false;
                }
            }

            for (const w of allWords) {
                const userProgress = user
                    ? (w.word_progress || []).find(p => p.user_id === user.id)
                    : null;
                const wordObj = {
                    id:              w.id,
                    word:            w.word,
                    phonetic:        w.phonetic,
                    meaning:         w.meaning,
                    exampleSentence: w.example_sentence,
                    imageUrl:        w.image_url || null,
                    image_url:       w.image_url || null,
                    passageId:       w.passage_id,
                    level:           userProgress?.level ?? 0,
                };

                if (w.passage_id) {
                    if (!passageWordsMap.has(w.passage_id)) {
                        passageWordsMap.set(w.passage_id, []);
                    }
                    passageWordsMap.get(w.passage_id).push(wordObj);
                } else {
                    unlinkedWords.push(wordObj);
                }
            }
        }

        // Map passages theo test_id
        const passagesByTest = new Map();
        for (const p of passagesData) {
            let totalWords = 0;
            let progress = 0;
            let wordIds = [];

            if (passageStats && passageStats.has(p.id)) {
                const st = passageStats.get(p.id);
                totalWords = st.totalWords;
                progress   = st.progress;
            } else {
                const wordsInP = passageWordsMap.get(p.id) || [];
                totalWords = wordsInP.length;
                const totalLevel = wordsInP.reduce((sum, item) => sum + item.level, 0);
                progress = totalWords > 0 ? Math.round((totalLevel / (totalWords * 5)) * 100) : 0;
                wordIds = wordsInP.map(w => w.id);
            }

            const passageObj = {
                id:            p.id,
                testId:        p.test_id,
                passageNumber: p.passage_number,
                title:         p.title || `Passage ${p.passage_number}`,
                topicLabel:    p.topic_label || '',
                contentEn:     p.content_en || '',
                contentVi:     p.content_vi || '',
                totalWords,
                progress,
                wordIds,
            };

            if (!passagesByTest.has(p.test_id)) {
                passagesByTest.set(p.test_id, []);
            }
            passagesByTest.get(p.test_id).push(passageObj);
        }

        let grandTotalWords = 0;
        let grandTotalLevel = 0;

        const tests = testsData.map(t => {
            const passages = passagesByTest.get(t.id) || [];
            passages.sort((a, b) => a.passageNumber - b.passageNumber);

            const testWordsCount = passages.reduce((sum, p) => sum + p.totalWords, 0);
            let testProgress = 0;
            if (testWordsCount > 0) {
                const totalPoints = passages.reduce((sum, p) => sum + (p.progress * p.totalWords), 0);
                testProgress = Math.round(totalPoints / testWordsCount);
            }

            grandTotalWords += testWordsCount;
            grandTotalLevel += (testProgress * testWordsCount);

            return {
                id:         t.id,
                name:       t.name,
                testOrder:  t.test_order,
                totalWords: testWordsCount,
                progress:   testProgress,
                passages,
            };
        });

        grandTotalWords += unlinkedWords.length;
        grandTotalLevel += unlinkedWords.reduce((sum, item) => sum + ((item.level / 5) * 100), 0);
        const overallProgress = grandTotalWords > 0 ? Math.round(grandTotalLevel / grandTotalWords) : 0;

        const result = {
            tests,
            unlinkedWords,
            totalWords: grandTotalWords,
            progress:   overallProgress,
        };

        return _cacheSet(cacheKey, result);
    }

    /**
     * Lấy danh sách từ trong một passage cụ thể kèm user progress.
     *
     * @param {string} passageId
     * @returns {Promise<Array>}
     */
    async function getWordsInPassage(passageId) {
        const user = await getCurrentUser().catch(() => null);
        const cacheKey = `passage-words:${user?.id || 'anon'}:${passageId}`;
        const cached = _cacheGet(cacheKey);
        if (cached) return cached;

        const client = _getClient();
        const { data, error } = await client
            .from('words')
            .select(`
                id,
                word,
                pos,
                phonetic,
                meaning,
                example_sentence,
                image_url,
                passage_id,
                word_order,
                created_at,
                word_progress ( level, next_review_at, last_reviewed_at, review_count )
            `)
            .eq('passage_id', passageId)
            .order('word_order', { ascending: true, nullsFirst: false })
            .order('created_at', { ascending: true });

        if (error) throw error;

        return _cacheSet(cacheKey, (data || []).map(w => {
            const progress = (w.word_progress || [])[0] || null;
            return {
                id:              w.id,
                word:            w.word,
                pos:             w.pos || '',
                phonetic:        w.phonetic,
                meaning:         w.meaning,
                exampleSentence: w.example_sentence,
                imageUrl:        w.image_url || null,
                image_url:       w.image_url || null,
                passageId:       w.passage_id,
                level:           progress?.level          ?? 0,
                nextReviewAt:    progress?.next_review_at  ?? null,
                lastReviewedAt:  progress?.last_reviewed_at ?? null,
                reviewCount:     progress?.review_count     ?? 0,
                isDue:           !progress || new Date(progress.next_review_at) <= new Date(),
            };
        }));
    }

    /**
     * Lấy chi tiết passage kèm nội dung song ngữ (content_en, content_vi).
     *
     * @param {string} passageId
     * @returns {Promise<Object|null>}
     */
    async function getPassage(passageId) {
        const client = _getClient();
        const { data, error } = await client
            .from('passages')
            .select('id, test_id, topic_id, passage_number, title, topic_label, content_en, content_vi')
            .eq('id', passageId)
            .single();

        if (error) {
            console.error('[HiDB.getPassage] error:', error);
            return null;
        }
        return data;
    }

    /**
     * Lấy toàn bộ từ trong một Test (bao gồm cả 3 passages).
     *
     * @param {string} testId
     * @returns {Promise<Array>}
     */
    async function getWordsInTest(testId) {
        const user = await getCurrentUser().catch(() => null);
        const cacheKey = `test-words:${user?.id || 'anon'}:${testId}`;
        const cached = _cacheGet(cacheKey);
        if (cached) return cached;

        const client = _getClient();
        const { data: passages, error: pErr } = await client
            .from('passages')
            .select('id')
            .eq('test_id', testId);

        if (pErr) throw pErr;
        const pIds = (passages || []).map(p => p.id);
        if (pIds.length === 0) return [];

        const { data, error } = await client
            .from('words')
            .select(`
                id,
                word,
                phonetic,
                meaning,
                example_sentence,
                image_url,
                passage_id,
                word_order,
                created_at,
                word_progress ( level, next_review_at, last_reviewed_at, review_count )
            `)
            .in('passage_id', pIds)
            .order('word_order', { ascending: true, nullsFirst: false })
            .order('created_at', { ascending: true });

        if (error) throw error;

        return _cacheSet(cacheKey, (data || []).map(w => {
            const progress = (w.word_progress || [])[0] || null;
            return {
                id:              w.id,
                word:            w.word,
                phonetic:        w.phonetic,
                meaning:         w.meaning,
                exampleSentence: w.example_sentence,
                imageUrl:        w.image_url || null,
                image_url:       w.image_url || null,
                passageId:       w.passage_id,
                level:           progress?.level          ?? 0,
                nextReviewAt:    progress?.next_review_at  ?? null,
                lastReviewedAt:  progress?.last_reviewed_at ?? null,
                reviewCount:     progress?.review_count     ?? 0,
                isDue:           !progress || new Date(progress.next_review_at) <= new Date(),
            };
        }));
    }


    /**
     * Tạo cấu trúc Test → Passage cho một Cambridge-style folder.
     * Gọi sau khi đã tạo topic (dùng createTopic).
     *
     * @param {string} topicId      - ID của topic vừa tạo
     * @param {number} numTests     - Số lượng tests (1–10)
     * @param {number} numPassages  - Số passage mỗi test (1–10, mặc định 3)
     * @returns {Promise<{ tests: Array, passages: Array }>}
     */
    async function createCamFolder(topicId, numTests = 4, numPassages = 3) {
        const client = _getClient();

        // 1. Tạo tests
        const testsToInsert = Array.from({ length: numTests }, (_, i) => ({
            topic_id:   topicId,
            name:       `Test ${i + 1}`,
            test_order: i + 1,
        }));

        const { data: createdTests, error: testsError } = await client
            .from('tests')
            .insert(testsToInsert)
            .select('id, name, test_order');

        if (testsError) throw testsError;

        // 2. Tạo passages cho mỗi test
        const passagesToInsert = [];
        for (const test of createdTests) {
            for (let p = 1; p <= numPassages; p++) {
                passagesToInsert.push({
                    test_id:        test.id,
                    topic_id:       topicId,
                    passage_number: p,
                    title:          `Passage ${p}`,
                    topic_label:    '',
                });
            }
        }

        const { data: createdPassages, error: passagesError } = await client
            .from('passages')
            .insert(passagesToInsert)
            .select('id, test_id, passage_number, title');

        if (passagesError) throw passagesError;

        // Invalidate cache cho topic này
        _invalidateVocabularyCache();

        return { tests: createdTests, passages: createdPassages };
    }

    /**
     * Đổi tên một passage.
     *
     * @param {string} passageId - UUID của passage
     * @param {string} newTitle  - Tên mới
     * @returns {Promise<void>}
     */
    async function updatePassageTitle(passageId, newTitle) {
        const { error } = await _getClient()
            .from('passages')
            .update({ title: newTitle.trim() })
            .eq('id', passageId);

        if (error) throw error;
        _invalidateVocabularyCache();
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
                    pos,
                    phonetic,
                    meaning,
                    example_sentence,
                    image_url,
                    topics ( id, name, icon )
                )
            `)
            .eq('user_id', user.id)
            .lte('next_review_at', now)
            .order('next_review_at', { ascending: true })
            .limit(limit);

        if (e1) throw e1;

        // Chỉ lấy các từ đã học và đã đến hạn ôn tập (Spaced Repetition SM-2)
        const formattedDue = (dueWords || [])
            .filter(p => p && p.words)
            .map(p => ({
                wordId:          p.words.id,
                word:            p.words.word,
                pos:             p.words.pos || '',
                phonetic:        p.words.phonetic,
                meaning:         p.words.meaning,
                exampleSentence: p.words.example_sentence,
                imageUrl:        p.words.image_url || null,
                image_url:       p.words.image_url || null,
                level:           p.level,
                nextReviewAt:    p.next_review_at,
                isNew:           false,
                topic:           p.words.topics,
            }));

        return formattedDue;
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
     * Lấy ngày theo giờ địa phương (YYYY-MM-DD) tránh lệch múi giờ UTC.
     * (private helper)
     */
    function _getLocalDateString(d = new Date()) {
        const y  = d.getFullYear();
        const m  = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dd}`;
    }

    /**
     * Ghi nhận 1 từ vừa học vào study_sessions của ngày hôm nay.
     * Dùng RPC `increment_session` (atomic UPSERT).
     * Fallback về 2-query nếu RPC chưa deploy (tương thích ngược).
     * (private helper)
     */
    async function _logStudySession() {
        const user  = await getCurrentUser();
        if (!user) return;
        const today = _getLocalDateString(); // YYYY-MM-DD (local time)

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

        const today     = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const todayStr     = _getLocalDateString(today);
        const yesterdayStr = _getLocalDateString(yesterday);

        // Ngày gần nhất phải là hôm nay hoặc hôm qua mới giữ chuỗi
        const firstStr = sessions[0].session_date;
        if (firstStr < yesterdayStr) return 0;   // so sánh chuỗi an toàn

        let streak   = 1;
        // ngày dự kiến tiếp theo (cần khớp) = first - 1 ngày
        const prev   = new Date(firstStr + 'T00:00:00'); // parse local
        prev.setDate(prev.getDate() - 1);

        for (let i = 1; i < sessions.length; i++) {
            const sd = sessions[i].session_date;
            if (sd === _getLocalDateString(prev)) {
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
        if (typeof _onReadyResolve === 'function') {
            _onReadyResolve(_supabase);
        }
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

    // ==========================================================
    // BUG REPORTING & SYSTEM ERROR LOGGING
    // ==========================================================

    /**
     * Gửi báo cáo lỗi từ người dùng (icon lá cờ 🚩).
     */
    async function submitBugReport(params = {}) {
        const description = String(params.description || params.content || '').trim();
        if (!description) {
            throw new Error('Vui lòng nhập mô tả chi tiết lỗi.');
        }

        const reportType = params.reportType || params.report_type || 'other';
        const featureContext = params.featureContext || params.feature_context || params.feature || 'general';
        const contextData = params.contextData || params.context_data || {};
        const userEmail = params.userEmail || params.user_email || null;
        const deviceInfo = params.deviceInfo || params.device_info || null;

        let user = null;
        try {
            user = await getCurrentUser();
        } catch (e) {}
        const client = _getClient();

        const defaultDevice = {
            url: window.location.href,
            userAgent: navigator.userAgent,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            platform: navigator.platform || '',
            timestamp: new Date().toISOString()
        };

        const payload = {
            user_id: user?.id || null,
            user_email: userEmail || user?.email || null,
            report_type: reportType || 'other',
            feature_context: featureContext || 'general',
            context_data: contextData || {},
            description: description,
            device_info: deviceInfo || defaultDevice,
            status: 'pending'
        };

        const { data, error } = await client
            .from('user_bug_reports')
            .insert(payload)
            .select()
            .maybeSingle();

        if (error) {
            // Fallback nếu select bị từ chối bởi RLS
            const retry = await client
                .from('user_bug_reports')
                .insert(payload);
            if (retry.error) throw retry.error;
            return { success: true };
        }
        return data || { success: true };
    }

    /**
     * Admin lấy danh sách báo cáo lỗi người dùng.
     */
    async function getBugReports({ status = 'all', featureContext = 'all', limit = 50, offset = 0 } = {}) {
        let query = _getClient()
            .from('user_bug_reports')
            .select('*')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }
        if (featureContext && featureContext !== 'all') {
            query = query.eq('feature_context', featureContext);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    }

    /**
     * Admin cập nhật trạng thái báo cáo (pending / resolved / dismissed) và ghi chú.
     */
    async function updateBugReportStatus(reportId, status, adminNote = null) {
        const updatePayload = { status };
        if (adminNote !== null && adminNote !== undefined) {
            updatePayload.admin_note = adminNote;
        }

        const { data, error } = await _getClient()
            .from('user_bug_reports')
            .update(updatePayload)
            .eq('id', reportId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /** Throttle buffer cho log lỗi hệ thống để tránh spam */
    const _recentErrorHashes = new Set();

    /**
     * Tự động ghi nhận log lỗi client (Crash / Unhandled Exceptions).
     */
    async function logSystemError(params = {}) {
        try {
            const errorMessage = String(params.errorMessage || params.error_message || '').trim();
            if (!errorMessage) return;

            const errorStack = params.errorStack || params.stack_trace || params.stack || null;
            const component = params.component || 'general';
            const url = params.url || (params.context && params.context.url) || window.location.href;

            const errorKey = `${component}:${errorMessage.slice(0, 100)}`;
            if (_recentErrorHashes.has(errorKey)) return;
            _recentErrorHashes.add(errorKey);
            setTimeout(() => _recentErrorHashes.delete(errorKey), 30000); // 30s dedup

            let user = null;
            try {
                user = await getCurrentUser();
            } catch (e) {}

            await _getClient()
                .from('system_error_logs')
                .insert({
                    user_id: user?.id || null,
                    user_email: user?.email || null,
                    error_message: errorMessage.slice(0, 1000),
                    error_stack: errorStack ? String(errorStack).slice(0, 4000) : null,
                    component: component || 'general',
                    url: url || window.location.href
                });
        } catch (err) {
            console.warn('[logSystemError] Không thể ghi log:', err);
        }
    }

    /**
     * Admin lấy danh sách log lỗi hệ thống.
     */
    async function getSystemErrorLogs({ limit = 50, offset = 0 } = {}) {
        const { data, error } = await _getClient()
            .from('system_error_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        return data || [];
    }

    /**
     * Admin xóa sạch log lỗi hệ thống.
     */
    async function clearSystemErrorLogs() {
        const { error } = await _getClient()
            .from('system_error_logs')
            .delete()
            .not('id', 'is', null);

        if (error) throw error;
        return true;
    }

    // ============================================================
    // COMMUNITY VOCABULARY LIBRARY (THREADS-STYLE)
    // ============================================================

    /**
     * Lấy danh sách các bộ từ vựng công khai trên Thư viện Cộng đồng.
     */
    async function getPublicLibraryTopics({ tag = 'all', search = '', sort = 'popular', page = 1, pageSize = 20 } = {}) {
        await ensureReady(4000).catch(() => {});
        const client = _getClient();
        let user = null;
        try { user = await getCurrentUser(); } catch(e) {}

        let query = client
            .from('topics')
            .select(`
                id,
                name,
                icon,
                category,
                description,
                author_name,
                author_avatar,
                is_public,
                like_count,
                clone_count,
                comment_count,
                tags,
                created_at,
                user_id
            `, { count: 'exact' })
            .eq('is_public', true);

        // Lọc theo tag
        if (tag && tag !== 'all' && tag !== 'Tất cả') {
            const tLower = tag.toLowerCase();
            const tUpper = tag.toUpperCase();
            query = query.or(`tags.cs.{${tag}},tags.cs.{${tLower}},tags.cs.{${tUpper}}`);
        }

        // Tìm kiếm
        if (search && search.trim()) {
            const term = search.trim().replace(/[,()]/g, ' ').replace(/\s+/g, ' ').trim();
            if (term) {
                query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%,author_name.ilike.%${term}%`);
            }
        }

        // Sắp xếp
        if (sort === 'popular' || sort === 'likes') {
            query = query.order('like_count', { ascending: false }).order('created_at', { ascending: false });
        } else if (sort === 'clones') {
            query = query.order('clone_count', { ascending: false }).order('created_at', { ascending: false });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        const safePage = Math.max(1, Number(page) || 1);
        const from = (safePage - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);

        const { data, count, error } = await query;
        if (error) throw error;

        const topics = data || [];

        // Lấy danh sách topic_id mà user hiện tại đã like
        let userLikedTopicIds = new Set();
        if (user?.id && topics.length > 0) {
            const topicIds = topics.map(t => t.id);
            const { data: likes } = await client
                .from('topic_likes')
                .select('topic_id')
                .eq('user_id', user.id)
                .in('topic_id', topicIds);
            if (likes) {
                userLikedTopicIds = new Set(likes.map(l => l.topic_id));
            }
        }

        // Lấy 3-4 từ vựng xem trước (sneak peek) và đếm tổng số từ cho mỗi topic
        const topicIds = topics.map(t => t.id);
        let sampleWordsByTopic = {};
        let wordCountByTopic = {};

        if (topicIds.length > 0) {
            const { data: wordsData } = await client
                .from('words')
                .select('id, topic_id, word, phonetic, meaning')
                .in('topic_id', topicIds)
                .limit(400);

            (wordsData || []).forEach(w => {
                if (!sampleWordsByTopic[w.topic_id]) sampleWordsByTopic[w.topic_id] = [];
                if (sampleWordsByTopic[w.topic_id].length < 4) {
                    sampleWordsByTopic[w.topic_id].push({
                        word: w.word,
                        phonetic: w.phonetic,
                        meaning: w.meaning
                    });
                }
                wordCountByTopic[w.topic_id] = (wordCountByTopic[w.topic_id] || 0) + 1;
            });
        }

        const enrichedTopics = topics.map(t => ({
            ...t,
            totalWords: wordCountByTopic[t.id] || 0,
            sneakPeekWords: sampleWordsByTopic[t.id] || [],
            hasLiked: userLikedTopicIds.has(t.id)
        }));

        return {
            topics: enrichedTopics,
            total: count || enrichedTopics.length,
            page: safePage,
            pageSize
        };
    }

    /**
     * Lấy toàn bộ từ vựng và chi tiết của một topic trên thư viện (cho Thread Chain View).
     */
    async function getPublicTopicDetail(topicId) {
        await ensureReady(4000).catch(() => {});
        const client = _getClient();
        let user = null;
        try { user = await getCurrentUser(); } catch(e) {}

        const { data: topic, error: topicErr } = await client
            .from('topics')
            .select('*')
            .eq('id', topicId)
            .single();

        if (topicErr) throw topicErr;

        // Lấy tất cả từ trong topic
        const { data: words, error: wordsErr } = await client
            .from('words')
            .select('*')
            .eq('topic_id', topicId)
            .order('created_at', { ascending: true });

        if (wordsErr) throw wordsErr;

        let hasLiked = false;
        if (user?.id) {
            const { data: like } = await client
                .from('topic_likes')
                .select('topic_id')
                .eq('topic_id', topicId)
                .eq('user_id', user.id)
                .maybeSingle();
            hasLiked = !!like;
        }

        return {
            ...topic,
            hasLiked,
            totalWords: (words || []).length,
            words: words || []
        };
    }

    /**
     * Thả tim hoặc bỏ thả tim topic.
     */
    async function toggleTopicLike(topicId) {
        await ensureReady(4000).catch(() => {});
        const client = _getClient();
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('Vui lòng đăng nhập để thả tim bài đăng này!');
        }

        try {
            const { data, error } = await client.rpc('toggle_topic_like', {
                target_topic_id: topicId,
                target_user_id: user.id
            });
            if (!error && data) {
                return data;
            }
        } catch (rpcErr) {
            console.warn('[toggleTopicLike] RPC fallback:', rpcErr);
        }

        const { data: existing } = await client
            .from('topic_likes')
            .select('topic_id')
            .eq('topic_id', topicId)
            .eq('user_id', user.id)
            .maybeSingle();

        if (existing) {
            await client.from('topic_likes').delete().eq('topic_id', topicId).eq('user_id', user.id);
            return { liked: false };
        } else {
            await client.from('topic_likes').insert({ topic_id: topicId, user_id: user.id });
            return { liked: true };
        }
    }

    /**
     * Lấy danh sách bình luận của một topic.
     */
    async function getTopicComments(topicId) {
        await ensureReady(4000).catch(() => {});
        const client = _getClient();
        const { data, error } = await client
            .from('topic_comments')
            .select('*')
            .eq('topic_id', topicId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    /**
     * Thêm bình luận hoặc mẹo nhớ cho một topic hoặc một từ.
     */
    async function addTopicComment({ topicId, wordId = null, content }) {
        await ensureReady(4000).catch(() => {});
        const text = String(content || '').trim();
        if (!text) throw new Error('Nội dung bình luận không được để trống.');
        if (text.length > 500) throw new Error('Bình luận không được vượt quá 500 ký tự.');

        const client = _getClient();
        let user = null;
        try { user = await getCurrentUser(); } catch(e) {}

        const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Học viên HiVocab';
        const userAvatar = user?.user_metadata?.avatar_url || null;

        const { data, error } = await client
            .from('topic_comments')
            .insert({
                topic_id: topicId,
                word_id: wordId || null,
                user_id: user?.id || null,
                user_name: userName,
                user_avatar: userAvatar,
                content: text
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * 1-Click Clone bộ từ vựng từ Thư viện về kho cá nhân.
     */
    async function clonePublicTopic(topicId) {
        await ensureReady(4000).catch(() => {});
        const client = _getClient();
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('Vui lòng đăng nhập để lưu bộ từ này về kho cá nhân!');
        }

        const { data: newTopicId, error } = await client.rpc('clone_public_topic', {
            target_topic_id: topicId,
            target_user_id: user.id
        });

        if (error) throw error;

        _topicsCache = null;
        _invalidateVocabularyCache();
        return newTopicId;
    }

    /**
     * Đăng công khai một topic cá nhân lên Thư viện Cộng đồng.
     */
    async function publishTopic({ topicId, description = '', tags = [] }) {
        await ensureReady(4000).catch(() => {});
        const client = _getClient();
        const user = await getCurrentUser();
        if (!user) throw new Error('Vui lòng đăng nhập để đăng bộ từ!');

        const authorName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Học viên HiVocab';
        const authorAvatar = user?.user_metadata?.avatar_url || null;

        const safeTags = Array.isArray(tags) ? tags : String(tags || '').split(',').map(t => t.trim()).filter(Boolean);

        const { data, error } = await client
            .from('topics')
            .update({
                is_public: true,
                description: String(description || '').trim(),
                author_name: authorName,
                author_avatar: authorAvatar,
                tags: safeTags
            })
            .eq('id', topicId)
            .select()
            .single();

        if (error) throw error;
        _topicsCache = null;
        return data;
    }

    /**
     * Hủy công khai (chuyển về riêng tư).
     */
    async function unpublishTopic(topicId) {
        await ensureReady(4000).catch(() => {});
        const client = _getClient();
        const { data, error } = await client
            .from('topics')
            .update({ is_public: false })
            .eq('id', topicId)
            .select()
            .single();

        if (error) throw error;
        _topicsCache = null;
        return data;
    }

    /**
     * Lấy danh sách các topic người dùng đã thích (Liked Topics).
     */
    async function getUserLikedTopics() {
        await ensureReady(4000).catch(() => {});
        const client = _getClient();
        const user = await getCurrentUser();
        if (!user) return [];

        const { data: likes, error: likeErr } = await client
            .from('topic_likes')
            .select('topic_id')
            .eq('user_id', user.id);

        if (likeErr || !likes || likes.length === 0) return [];
        const ids = likes.map(l => l.topic_id);

        const { data: topics, error: topicErr } = await client
            .from('topics')
            .select('*')
            .in('id', ids);

        if (topicErr) throw topicErr;
        return topics || [];
    }

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
        ensureReady,
        isReady: () => !!_supabase,

        // Auth
        getCurrentUser,
        signInWithGoogle,
        signInWithPassword,
        signUpWithPassword,
        resetPasswordForEmail,
        verifyOtp,
        updateUserPassword,
        signOut,
        getClient: _getClient,

        // Topics
        getTopics,
        createTopic,
        createCamFolder,
        updatePassageTitle,
        deleteTopic,

        // Words
        getWordsInTopic,
        getVocabularyPage,
        addWord,
        addWordsBatch,
        ensureUserPersonalTopic,
        getLearnedVocabStats,
        deleteWord,
        getLessonsInTopic,
        getWordsInLesson,
        getCamHierarchy,
        getTopicTests,
        getWordsInPassage,
        getPassage,
        getWordsInTest,

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

        // Bug Reports & Error Logging
        submitBugReport,
        getBugReports,
        updateBugReportStatus,
        logSystemError,
        getSystemErrorLogs,
        clearSystemErrorLogs,

        // Community Library (Threads-style)
        getPublicLibraryTopics,
        getPublicTopicDetail,
        toggleTopicLike,
        getTopicComments,
        addTopicComment,
        clonePublicTopic,
        publishTopic,
        unpublishTopic,
        getUserLikedTopics,
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
