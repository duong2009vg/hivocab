// ============================================================
// HI - EXERCISE ENGINE  |  exercises.js
// ============================================================
// Tạo và quản lý bài tập từ vựng với 3 dạng câu hỏi:
//   1. MCQ        — Trắc nghiệm 4 lựa chọn
//   2. FILL_WORD  — Điền từ (nhập từ tiếng Anh từ nghĩa TV)
//   3. FILL_BLANK — Điền từ vào chỗ trống trong câu ví dụ
// ============================================================

const HiExercise = (() => {

    // ── Cấu hình bài tập ──────────────────────────────────────
    const QUESTION_TYPES = ['mcq', 'fill_word', 'fill_blank'];
    const MCQ_OPTIONS     = 4;
    const MAX_WORDS_PER_EX = 10;

    // Danh mục bài tập mẫu (mỗi danh mục có icon + màu)
    const EX_CATEGORIES = [
        { id: 'all',    label: 'Tất cả',      icon: 'apps',          color: 'bg-primary/10 text-primary' },
        { id: 'vocab',  label: 'Từ vựng',     icon: 'spellcheck',    color: 'bg-blue-500/10 text-blue-600' },
        { id: 'listen', label: 'Nghe - Viết', icon: 'hearing',       color: 'bg-purple-500/10 text-purple-600' },
        { id: 'review', label: 'Ôn tập',      icon: 'history_edu',   color: 'bg-green-500/10 text-green-600' },
        { id: 'custom', label: 'Tùy chỉnh',   icon: 'edit',          color: 'bg-orange-500/10 text-orange-600' },
    ];

    // ── State bài tập đang làm ────────────────────────────────
    let _currentExercise = null;  // { title, category, questions: [...] }
    let _qIndex   = 0;
    let _score    = 0;
    let _answered = false;

    // ── Shuffle array ─────────────────────────────────────────
    function _shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // ── Tạo câu hỏi từ mảng words ─────────────────────────────
    /**
     * @param {Array}  words
     * @param {Array|null} onlyTypes - nếu set, chỉ tạo bài thuộc các type này
     *   vd: ['fill_word', 'fill_blank'] → không tạo MCQ
     */
    function _buildQuestions(words, onlyTypes = null) {
        const pool   = _shuffle(words).slice(0, MAX_WORDS_PER_EX);
        const questions = [];

        pool.forEach(w => {
            // Chỉ thêm dạng có đủ dữ liệu
            let availableTypes = [];
            if (words.length >= 4) availableTypes.push('mcq');
            if (w.word)            availableTypes.push('fill_word');
            if (w.example_sentence || w.exampleSentence) availableTypes.push('fill_blank');

            // Lọc theo onlyTypes nếu có
            if (onlyTypes && onlyTypes.length > 0) {
                availableTypes = availableTypes.filter(t => onlyTypes.includes(t));
            }

            if (availableTypes.length === 0) return;

            // Chọn ngẫu nhiên 1 dạng trong các dạng available
            const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];

            if (type === 'mcq') {
                // 4 lựa chọn — 1 đúng, 3 nhiễu
                const distractors = _shuffle(words.filter(x => x.id !== w.id)).slice(0, 3);
                const options = _shuffle([w, ...distractors]);
                questions.push({
                    type:    'mcq',
                    prompt:  `Nghĩa của từ "<strong>${w.word}</strong>" ${w.phonetic ? `<span class="text-xs text-on-surface-variant">${w.phonetic}</span>` : ''} là gì?`,
                    options: options.map(o => ({ label: o.meaning || o.definition || '—', value: o.id })),
                    answer:  w.id,
                    word:    w,
                });
            } else if (type === 'fill_word') {
                questions.push({
                    type:   'fill_word',
                    prompt: `Nhập từ tiếng Anh có nghĩa: "<em>${w.meaning || '—'}</em>"`,
                    answer: w.word.toLowerCase().trim(),
                    word:   w,
                    hint:   w.phonetic || '',
                });
            } else if (type === 'fill_blank') {
                const sentence = w.example_sentence || w.exampleSentence || '';
                if (!sentence) return;
                const wordRegex = new RegExp(`\\b${w.word}\\b`, 'i');
                if (!wordRegex.test(sentence)) return;
                const blanked = sentence.replace(wordRegex, '___');
                questions.push({
                    type:   'fill_blank',
                    prompt: `Điền từ thích hợp vào chỗ trống:<br><em class="text-on-surface">"${blanked}"</em>`,
                    hint:   w.meaning || '',
                    answer: w.word.toLowerCase().trim(),
                    word:   w,
                });
            }
        });

        return questions;
    }

    // ── Sinh danh sách bài tập từ topics ──────────────────────
    async function _generateExerciseList() {
        if (typeof HiDB === 'undefined') return [];

        try {
            const topics = await HiDB.getTopics();
            if (!topics || topics.length === 0) return [];

            const exercises = [];

            for (const topic of topics) {
                const words = await HiDB.getWordsInTopic(topic.id);
                if (!words || words.length < 2) continue;

                // 1 bài tập tổng hợp cho mỗi topic
                exercises.push({
                    id:          `ex-${topic.id}-vocab`,
                    title:       `${topic.name}`,
                    subtitle:    `${Math.min(words.length, MAX_WORDS_PER_EX)} câu hỏi • Trắc nghiệm & Điền từ`,
                    category:    'vocab',
                    icon:        topic.icon || 'menu_book',
                    color:       'from-blue-500/20 to-primary/10',
                    iconColor:   'text-blue-500',
                    topic_group: topic.name,
                    words,
                    topicName:   topic.name,
                });

                // Bài ôn tập (chỉ fill types) nếu đủ từ
                if (words.length >= 4) {
                    exercises.push({
                        id:          `ex-${topic.id}-review`,
                        title:       `Ôn tập: ${topic.name}`,
                        subtitle:    `${Math.min(words.length, MAX_WORDS_PER_EX)} câu • Điền từ & Chỗ trống`,
                        category:    'review',
                        icon:        'history_edu',
                        color:       'from-green-500/20 to-emerald-500/10',
                        iconColor:   'text-green-600',
                        topic_group: topic.name,
                        words,
                        topicName:   topic.name,
                        forceFill:   true,
                    });
                }
            }

            // Load custom exercises
            if (typeof HiDB.getCustomExercises === 'function') {
                const customEx = await HiDB.getCustomExercises();
                customEx.forEach(ex => {
                    exercises.push({
                        id:          ex.id,
                        title:       ex.title,
                        subtitle:    ex.description || `${ex.questions.length} câu hỏi`,
                        category:    'custom',
                        icon:        ex.icon || 'edit_note',
                        color:       'from-orange-500/20 to-amber-500/10',
                        iconColor:   'text-orange-500',
                        topic_group: ex.topic_group || null,
                        isCustom:    true,
                        questions:   ex.questions,
                    });
                });
            }

            return exercises;
        } catch (e) {
            console.warn('[HiExercise] _generateExerciseList error:', e);
            return [];
        }
    }

    // ── Render bài tập theo nhóm topic_group ─────────────────
    function _renderGrouped(container, exercises) {
        if (exercises.length === 0) {
            container.innerHTML = `<div class="col-span-3 flex flex-col items-center justify-center py-16 text-on-surface-variant gap-3">
                <span class="material-symbols-outlined text-[48px] opacity-40">edit_off</span>
                <p class="font-semibold">Chưa có bài tập nào</p>
                <p class="text-sm opacity-60">Hãy thêm từ vựng vào các chủ đề để tạo bài tập</p>
            </div>`;
            return;
        }

        // Gom nhóm — giữ thứ tự xuất hiện đầu tiên
        const groups   = [];
        const groupMap = new Map();
        for (const ex of exercises) {
            const key = ex.topic_group ?? '__ungrouped__';
            if (!groupMap.has(key)) {
                const g = { label: ex.topic_group ?? null, items: [] };
                groupMap.set(key, g);
                groups.push(g);
            }
            groupMap.get(key).items.push(ex);
        }

        // Nhóm có tên trước, ungrouped cuối
        const named     = groups.filter(g => g.label !== null);
        const ungrouped = groups.find(g => g.label === null);
        const ordered   = [...named, ...(ungrouped ? [ungrouped] : [])];

        container.innerHTML = ordered.map(group => `
            <div class="col-span-3">
                ${group.label ? `
                <div class="flex items-center gap-2 mb-3 mt-1">
                    <span class="material-symbols-outlined text-[16px] text-on-surface-variant">folder_open</span>
                    <h2 class="text-xs font-bold text-on-surface-variant tracking-widest uppercase truncate">${_escHtml(group.label)}</h2>
                    <div class="flex-1 h-px bg-outline-variant/30"></div>
                </div>` : ''}
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${group.items.map(ex => _renderExCard(ex)).join('')}
                </div>
            </div>
        `).join('');
    }

    function _renderExCard(ex) {
        return `
        <div onclick="window._openExercise('${ex.id}')"
            class="cursor-pointer group relative bg-surface-container-lowest/80 backdrop-blur-xl rounded-2xl p-5 border border-outline-variant/20 soft-shadow transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col gap-4 overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br ${ex.color} opacity-40 pointer-events-none rounded-2xl"></div>
            <div class="relative flex items-start gap-4">
                <div class="w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0 shadow-sm">
                    <span class="material-symbols-outlined text-[22px] ${ex.iconColor}">${ex.icon}</span>
                </div>
                <div class="flex-1 min-w-0">
                    <h3 class="font-bold text-on-surface group-hover:text-primary transition-colors text-sm md:text-base leading-snug line-clamp-2">${ex.title}</h3>
                    <p class="text-xs text-on-surface-variant mt-0.5">${ex.subtitle}</p>
                </div>
            </div>
            <div class="relative flex items-center gap-2">
                <span class="material-symbols-outlined text-[14px] text-primary">play_circle</span>
                <span class="text-xs font-bold text-primary">Bắt đầu</span>
            </div>
        </div>`;
    }

    function _escHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ── Render trang danh sách bài tập ────────────────────────
    let _activeExFilter = 'all';
    let _cachedExList   = null;

    window._renderExercisesPage = async function() {
        // Filter tabs
        const tabBar = document.getElementById('ex-filter-tabs');
        if (tabBar) {
            tabBar.innerHTML = EX_CATEGORIES.map(cat => {
                const active = cat.id === _activeExFilter;
                return `<button onclick="window._switchExFilter('${cat.id}')"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap transition-all duration-200 shrink-0
                           ${active ? 'bg-primary text-on-primary shadow-md' : 'bg-surface-container text-on-surface-variant hover:bg-primary/10 hover:text-primary border border-outline-variant/30'}">
                    <span class="material-symbols-outlined text-[15px]">${cat.icon}</span>
                    ${cat.label}
                </button>`;
            }).join('');
        }

        // Exercise grid
        const grid = document.getElementById('exercises-list');
        if (!grid) return;
        grid.innerHTML = `<div class="flex items-center justify-center py-16 col-span-3">
            <span class="material-symbols-outlined text-primary text-[40px] animate-spin">refresh</span>
        </div>`;

        if (!_cachedExList) {
            _cachedExList = await _generateExerciseList();
        }

        const filtered = _activeExFilter === 'all'
            ? _cachedExList
            : _cachedExList.filter(e => e.category === _activeExFilter);

        if (filtered.length === 0) {
            grid.innerHTML = `<div class="col-span-3 flex flex-col items-center justify-center py-16 text-on-surface-variant gap-3">
                <span class="material-symbols-outlined text-[48px] opacity-40">edit_off</span>
                <p class="font-semibold">Chưa có bài tập nào</p>
                <p class="text-sm opacity-60">Hãy thêm từ vựng vào các chủ đề để tạo bài tập</p>
            </div>`;
            return;
        }

        _renderGrouped(grid, filtered);
    };

    window._switchExFilter = function(catId) {
        _activeExFilter = catId;
        window._renderExercisesPage();
    };

    // ── Mở bài tập theo ID ────────────────────────────────────
    window._openExercise = function(exId) {
        const ex = _cachedExList?.find(e => e.id === exId);
        if (!ex) return;

        // Lấy questions
        let qs = [];
        if (ex.isCustom) {
            // Đối với custom exercise, questions đã có sẵn và tuân thủ format.
            qs = ex.questions || [];
        } else {
            // Tự động sinh questions từ words
            const words = ex.words;
            if (ex.forceFill) {
                // Chỉ dùng fill types — truyền thẳng vào _buildQuestions để tránh fallback rỗng
                qs = _buildQuestions(words, ['fill_word', 'fill_blank']);
                if (qs.length === 0) {
                    // Không đủ dữ liệu fill (không có exampleSentence) → fallback toàn type
                    qs = _buildQuestions(words);
                }
            } else {
                qs = _buildQuestions(words);
            }
        }

        if (qs.length === 0) {
            alert('Bài tập này hiện không có câu hỏi nào.');
            return;
        }

        _currentExercise = { ...ex, questions: qs };
        _qIndex   = 0;
        _score    = 0;
        _answered = false;

        // Mở modal
        const modal = document.getElementById('modal-exercise');
        if (!modal) return;
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        document.getElementById('ex-modal-title').textContent    = ex.title;
        document.getElementById('ex-modal-category').textContent = EX_CATEGORIES.find(c => c.id === ex.category)?.label || '';
        document.getElementById('ex-result-screen').classList.add('hidden');
        document.getElementById('ex-question-area').classList.remove('hidden');
        document.getElementById('ex-footer').classList.remove('hidden');

        _renderQuestion();
    };

    // ── Render câu hỏi hiện tại ───────────────────────────────
    function _renderQuestion() {
        const qs  = _currentExercise.questions;
        const q   = qs[_qIndex];
        const area = document.getElementById('ex-question-area');
        if (!area || !q) return;

        _answered = false;

        // Progress
        const pct = Math.round((_qIndex / qs.length) * 100);
        document.getElementById('ex-progress-bar').style.width = pct + '%';
        document.getElementById('ex-q-counter').textContent = `Câu ${_qIndex + 1} / ${qs.length}`;
        document.getElementById('ex-score-label').textContent = `✓ ${_score} điểm`;

        // Reset buttons
        const checkBtn = document.getElementById('ex-check-btn');
        const nextBtn  = document.getElementById('ex-next-btn');
        checkBtn.classList.remove('hidden');
        checkBtn.disabled = false;
        checkBtn.textContent = 'Kiểm tra';
        checkBtn.className = checkBtn.className.replace('bg-surface-container text-on-surface', 'bg-primary text-on-primary');
        nextBtn.classList.add('hidden');

        // Render nội dung theo type
        if (q.type === 'mcq') {
            area.innerHTML = `
            <p class="text-base font-semibold text-on-surface leading-relaxed">${q.prompt}</p>
            <div class="grid grid-cols-1 gap-2" id="mcq-options">
                ${q.options.map((opt, i) => `
                <button id="mcq-opt-${i}" data-val="${opt.value}"
                    onclick="window._selectMCQ(${i}, '${opt.value}')"
                    class="mcq-btn text-left px-4 py-3 rounded-xl border-2 border-outline-variant/30 text-sm text-on-surface font-medium hover:border-primary hover:bg-primary/5 transition-all duration-150">
                    <span class="inline-block w-6 h-6 rounded-full border border-outline-variant/40 text-center text-xs leading-6 mr-2 font-bold">${'ABCD'[i]}</span>
                    ${opt.label}
                </button>`).join('')}
            </div>`;
        } else if (q.type === 'fill_word') {
            area.innerHTML = `
            <p class="text-base font-semibold text-on-surface leading-relaxed">${q.prompt}</p>
            ${q.hint ? `<p class="text-xs text-on-surface-variant">Phiên âm: <em>${q.hint}</em></p>` : ''}
            <input id="ex-fill-input" type="text" placeholder="Nhập từ tiếng Anh..."
                class="w-full bg-surface-container-low border-b-2 border-transparent focus:border-primary px-4 py-3 rounded-t-lg outline-none text-on-surface text-base transition-colors"
                onkeydown="if(event.key==='Enter')window._checkExAnswer()"
                autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"/>
            <div id="ex-fill-feedback" class="hidden text-sm font-semibold"></div>`;
            setTimeout(() => document.getElementById('ex-fill-input')?.focus(), 100);
        } else if (q.type === 'fill_blank') {
            area.innerHTML = `
            <p class="text-base font-semibold text-on-surface leading-relaxed mb-1">${q.prompt}</p>
            ${q.hint ? `<p class="text-xs text-on-surface-variant mb-2">Gợi ý nghĩa: <em>${q.hint}</em></p>` : ''}
            <input id="ex-fill-input" type="text" placeholder="Điền từ vào chỗ ___..."
                class="w-full bg-surface-container-low border-b-2 border-transparent focus:border-primary px-4 py-3 rounded-t-lg outline-none text-on-surface text-base transition-colors"
                onkeydown="if(event.key==='Enter')window._checkExAnswer()"
                autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"/>
            <div id="ex-fill-feedback" class="hidden text-sm font-semibold"></div>`;
            setTimeout(() => document.getElementById('ex-fill-input')?.focus(), 100);
        }
    }

    // MCQ: chọn đáp án
    let _selectedMCQ = null;
    window._selectMCQ = function(idx, val) {
        if (_answered) return;
        _selectedMCQ = val;
        document.querySelectorAll('.mcq-btn').forEach((btn, i) => {
            btn.className = btn.className
                .replace('border-primary bg-primary/5', '')
                .replace('border-outline-variant/30', 'border-outline-variant/30');
            if (i === idx) {
                btn.classList.add('border-primary', 'bg-primary/5');
            }
        });
    };

    // Kiểm tra đáp án
    window._checkExAnswer = function() {
        if (_answered) return;
        const q = _currentExercise.questions[_qIndex];

        let isCorrect = false;

        if (q.type === 'mcq') {
            if (!_selectedMCQ) return; // chưa chọn
            isCorrect = _selectedMCQ === q.answer;
            // Highlight đúng/sai
            document.querySelectorAll('.mcq-btn').forEach(btn => {
                const val = btn.dataset.val;
                if (val === q.answer) {
                    btn.classList.add('border-green-500', 'bg-green-500/10', 'text-green-700');
                    btn.classList.remove('border-outline-variant/30', 'border-primary');
                } else if (val === _selectedMCQ && !isCorrect) {
                    btn.classList.add('border-red-500', 'bg-red-500/10', 'text-red-700');
                    btn.classList.remove('border-outline-variant/30', 'border-primary', 'bg-primary/5');
                }
                btn.onclick = null;
            });
        } else {
            const input = document.getElementById('ex-fill-input');
            const val   = input?.value.trim().toLowerCase() || '';
            if (!val) return;
            isCorrect = val === q.answer;

            const feedback = document.getElementById('ex-fill-feedback');
            if (feedback) {
                feedback.classList.remove('hidden');
                if (isCorrect) {
                    feedback.innerHTML = `<span class="text-green-600">✓ Chính xác!</span>`;
                } else {
                    feedback.innerHTML = `<span class="text-red-500">✗ Sai. Đáp án: <strong class="text-on-surface">${q.word.word}</strong></span>`;
                }
            }
            if (input) {
                input.disabled = true;
                input.classList.add(isCorrect ? 'border-green-500' : 'border-red-500');
            }
        }

        _answered = true;
        if (isCorrect) _score++;

        // Update score label
        document.getElementById('ex-score-label').textContent = `✓ ${_score} điểm`;

        // Swap buttons
        const checkBtn = document.getElementById('ex-check-btn');
        const nextBtn  = document.getElementById('ex-next-btn');
        checkBtn.classList.add('hidden');
        nextBtn.classList.remove('hidden');

        const isLast = _qIndex >= _currentExercise.questions.length - 1;
        nextBtn.textContent = isLast ? 'Xem kết quả' : 'Tiếp theo →';
    };

    // Câu tiếp theo hoặc kết quả
    window._nextExQuestion = function() {
        const total = _currentExercise.questions.length;
        _selectedMCQ = null;
        _qIndex++;

        if (_qIndex >= total) {
            _showExResult();
        } else {
            _renderQuestion();
        }
    };

    // Hiện kết quả
    function _showExResult() {
        const total = _currentExercise.questions.length;
        const pct   = Math.round((_score / total) * 100);

        document.getElementById('ex-progress-bar').style.width = '100%';
        document.getElementById('ex-question-area').classList.add('hidden');
        document.getElementById('ex-footer').classList.add('hidden');

        const resultScreen = document.getElementById('ex-result-screen');
        resultScreen.classList.remove('hidden');
        resultScreen.classList.add('flex');

        const emoji = pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '💪';
        document.getElementById('ex-result-emoji').textContent   = emoji;
        document.getElementById('ex-result-summary').innerHTML   =
            `Bạn trả lời đúng <strong class="text-primary">${_score}/${total}</strong> câu (${pct}%)<br>
             ${pct >= 80 ? 'Xuất sắc! Bạn nắm vững chủ đề này.' : pct >= 60 ? 'Tốt lắm! Hãy luyện tập thêm một chút.' : 'Hãy ôn lại và thử lại nhé!'}`;
    }

    // Làm lại bài tập
    window._retryExercise = function() {
        if (!_currentExercise) return;
        const exId = _currentExercise.id;
        window._closeExerciseModal();
        setTimeout(() => window._openExercise(exId), 150);
    };

    // Đóng modal
    window._closeExerciseModal = function() {
        const modal = document.getElementById('modal-exercise');
        if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
        _currentExercise = null;
        _selectedMCQ = null;
    };

    // ── CREATE / BUILD CUSTOM EXERCISE ───────────────────────
    let _builderExerciseId = null;

    // Mở modal tạo exercise (bước 1: Info)
    window.openCreateExerciseModal = function() {
        document.getElementById('new-ex-title').value = '';
        document.getElementById('new-ex-desc').value = '';
        const groupEl = document.getElementById('new-ex-group');
        if (groupEl) groupEl.value = '';
        document.getElementById('create-ex-error').classList.add('hidden');
        const modal = document.getElementById('modal-create-exercise');
        if (modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
    };

    window._closeCreateExerciseModal = function() {
        const modal = document.getElementById('modal-create-exercise');
        if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
    };

    // Nhấn Tiếp tục -> Tạo exercise -> Mở Builder
    window._submitCreateExercise = async function() {
        const title      = document.getElementById('new-ex-title').value.trim();
        const desc       = document.getElementById('new-ex-desc').value.trim();
        const topicGroup = document.getElementById('new-ex-group')?.value.trim() || null;
        const errEl      = document.getElementById('create-ex-error');
        
        if (!title) {
            errEl.textContent = 'Vui lòng nhập tên bài tập';
            errEl.classList.remove('hidden');
            return;
        }
        errEl.classList.add('hidden');

        try {
            const ex = await HiDB.createCustomExercise({
                title,
                description: desc,
                category:    'custom',
                topic_group: topicGroup,
            });
            _builderExerciseId = ex.id;
            
            // Xoá cache để update list ngoài
            _cachedExList = null;
            window._allExercises = null;

            window._closeCreateExerciseModal();
            window._openExerciseBuilder(ex.title);
        } catch (e) {
            errEl.textContent = 'Lỗi tạo bài tập: ' + e.message;
            errEl.classList.remove('hidden');
        }
    };

    // Mở Modal Builder (bước 2: Thêm câu hỏi)
    window._openExerciseBuilder = function(title) {
        document.getElementById('builder-ex-title').textContent = title || 'Đang soạn...';
        const modal = document.getElementById('modal-exercise-builder');
        if (modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
        
        window._onBuilderTypeChange(); // render form
        _renderBuilderQuestionList();
    };

    window._closeExerciseBuilder = function() {
        const modal = document.getElementById('modal-exercise-builder');
        if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
        _builderExerciseId = null;
        // Refresh page to show new exercise
        window._allExercises = null;
        window._renderExercisesPage();
    };

    // Form builder theo loại câu hỏi
    window._onBuilderTypeChange = function() {
        const type = document.getElementById('builder-q-type').value;
        const area = document.getElementById('builder-form-area');
        
        if (type === 'mcq') {
            area.innerHTML = `
                <input id="bq-prompt" type="text" placeholder="Câu hỏi (vd: Nghĩa của Apple là gì?)" class="w-full bg-surface-container border-b-2 border-transparent focus:border-primary px-3 py-2 rounded-t outline-none text-sm"/>
                <input id="bq-opt-1" type="text" placeholder="Lựa chọn A (Đáp án đúng)" class="w-full bg-surface-container border-b-2 border-green-500 focus:border-primary px-3 py-2 rounded-t outline-none text-sm"/>
                <input id="bq-opt-2" type="text" placeholder="Lựa chọn B" class="w-full bg-surface-container border-b-2 border-transparent focus:border-primary px-3 py-2 rounded-t outline-none text-sm"/>
                <input id="bq-opt-3" type="text" placeholder="Lựa chọn C" class="w-full bg-surface-container border-b-2 border-transparent focus:border-primary px-3 py-2 rounded-t outline-none text-sm"/>
                <input id="bq-opt-4" type="text" placeholder="Lựa chọn D" class="w-full bg-surface-container border-b-2 border-transparent focus:border-primary px-3 py-2 rounded-t outline-none text-sm"/>
            `;
        } else if (type === 'fill_word') {
            area.innerHTML = `
                <input id="bq-prompt" type="text" placeholder="Câu hỏi (vd: Nghĩa: Quả táo)" class="w-full bg-surface-container border-b-2 border-transparent focus:border-primary px-3 py-2 rounded-t outline-none text-sm"/>
                <input id="bq-answer" type="text" placeholder="Đáp án đúng (vd: apple)" class="w-full bg-surface-container border-b-2 border-green-500 focus:border-primary px-3 py-2 rounded-t outline-none text-sm"/>
                <input id="bq-hint" type="text" placeholder="Gợi ý (vd: Phiên âm) - Không bắt buộc" class="w-full bg-surface-container border-b-2 border-transparent focus:border-primary px-3 py-2 rounded-t outline-none text-sm"/>
            `;
        } else if (type === 'fill_blank') {
            area.innerHTML = `
                <input id="bq-prompt" type="text" placeholder="Câu chứa chỗ trống (vd: I eat an ___ everyday)" class="w-full bg-surface-container border-b-2 border-transparent focus:border-primary px-3 py-2 rounded-t outline-none text-sm"/>
                <input id="bq-answer" type="text" placeholder="Từ cần điền (vd: apple)" class="w-full bg-surface-container border-b-2 border-green-500 focus:border-primary px-3 py-2 rounded-t outline-none text-sm"/>
                <input id="bq-hint" type="text" placeholder="Gợi ý nghĩa - Không bắt buộc" class="w-full bg-surface-container border-b-2 border-transparent focus:border-primary px-3 py-2 rounded-t outline-none text-sm"/>
            `;
        }
    };

    window._submitAddQuestion = async function() {
        if (!_builderExerciseId) return;
        const type = document.getElementById('builder-q-type').value;
        const promptEl = document.getElementById('bq-prompt');
        if (!promptEl || !promptEl.value.trim()) return alert('Vui lòng nhập câu hỏi');

        const q = { type, prompt: promptEl.value.trim(), options: null, answer: '', hint: '' };

        if (type === 'mcq') {
            const o1 = document.getElementById('bq-opt-1').value.trim();
            const o2 = document.getElementById('bq-opt-2').value.trim();
            const o3 = document.getElementById('bq-opt-3').value.trim();
            const o4 = document.getElementById('bq-opt-4').value.trim();
            if (!o1 || !o2) return alert('Vui lòng nhập ít nhất 2 lựa chọn (A và B)');
            
            // Lựa chọn A luôn là đáp án đúng (lúc tạo)
            // Lên UI chơi sẽ shuffle lại sau, hoặc ta shuffle lúc lưu
            q.answer = 'opt_a';
            q.options = [
                { label: o1, value: 'opt_a' },
                { label: o2, value: 'opt_b' },
                { label: o3, value: 'opt_c' },
                { label: o4, value: 'opt_d' }
            ].filter(x => x.label);
        } else {
            const ansEl = document.getElementById('bq-answer');
            const hintEl = document.getElementById('bq-hint');
            if (!ansEl || !ansEl.value.trim()) return alert('Vui lòng nhập đáp án đúng');
            q.answer = ansEl.value.trim().toLowerCase();
            q.hint = hintEl ? hintEl.value.trim() : '';
        }

        try {
            await HiDB.addExerciseQuestion(_builderExerciseId, q);
            // Xoá nội dung form
            promptEl.value = '';
            document.querySelectorAll('input[id^="bq-opt"]').forEach(el => el.value = '');
            if(document.getElementById('bq-answer')) document.getElementById('bq-answer').value = '';
            if(document.getElementById('bq-hint')) document.getElementById('bq-hint').value = '';
            
            // Xoá cache customEx
            _cachedExList = null;
            window._allExercises = null;
            _renderBuilderQuestionList();
        } catch (e) {
            alert('Lỗi: ' + e.message);
        }
    };

    async function _renderBuilderQuestionList() {
        if (!_builderExerciseId) return;
        const listEl = document.getElementById('builder-q-list');
        const countEl = document.getElementById('builder-q-count');
        listEl.innerHTML = '<span class="text-xs">Đang tải...</span>';
        
        try {
            const exList = await HiDB.getCustomExercises();
            const ex = exList.find(e => e.id === _builderExerciseId);
            if (!ex) return;
            
            const qs = ex.questions || [];
            countEl.textContent = qs.length;

            if (qs.length === 0) {
                listEl.innerHTML = '<span class="text-xs text-on-surface-variant italic">Chưa có câu hỏi nào.</span>';
                return;
            }

            listEl.innerHTML = qs.map((q, i) => `
                <div class="p-3 bg-surface rounded-xl border border-outline-variant/30 relative group flex gap-3">
                    <div class="flex-1 min-w-0">
                        <div class="text-xs font-bold text-primary mb-1 uppercase">${q.type === 'mcq' ? 'Trắc nghiệm' : q.type === 'fill_word' ? 'Điền từ' : 'Điền chỗ trống'}</div>
                        <div class="text-sm text-on-surface font-semibold truncate">${q.prompt}</div>
                        <div class="text-xs text-on-surface-variant mt-1 truncate">Đ.án: ${q.type==='mcq' ? (q.options.find(o=>o.value===q.answer)?.label) : q.answer}</div>
                    </div>
                    <button onclick="window._deleteBuilderQuestion('${q.id}')" class="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded hover:bg-red-50">
                        <span class="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                </div>
            `).join('');
            
        } catch (e) {
            listEl.innerHTML = '<span class="text-xs text-red-500">Lỗi tải danh sách</span>';
        }
    }

    window._deleteBuilderQuestion = async function(qId) {
        if(!confirm('Xóa câu hỏi này?')) return;
        try {
            await HiDB.deleteExerciseQuestion(qId);
            _cachedExList = null;
            window._allExercises = null;
            _renderBuilderQuestionList();
        } catch (e) {
            alert('Lỗi: ' + e.message);
        }
    };

    // ── Public API ────────────────────────────────────────────
    return {
        resetCache: () => { _cachedExList = null; },
    };

})();
