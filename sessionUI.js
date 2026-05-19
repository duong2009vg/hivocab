// ============================================================
// HI - SESSION UI  |  sessionUI.js
// ============================================================
// Render toàn bộ giao diện phiên học, khớp 100% design system
// của A7.html (color tokens, glass-card, Material Symbols...).
//
// Phụ thuộc: sessionEngine.js (HiSession), dataLayer.js (HiDB)
//
// TÍCH HỢP VÀO A7.html:
//   1. Thêm id="exercise-container" vào thẻ <main> trong page-learning:
//      <main ... >
//        <div id="exercise-container"></div>
//      </main>
//
//   2. Xóa toàn bộ 4 section#exercise-0 → exercise-3 cũ
//      (và section#exercise-completed cũ) khỏi HTML.
//
//   3. Khởi tạo trong window.startSession():
//      HiSessionUI.init();
//      const words = await HiDB.getWordsDueForReview(20);
//      HiSession.startSession(words);
//      HiSessionUI.render();
// ============================================================

const HiSessionUI = (() => {

    // ----------------------------------------------------------
    // CONSTANTS - CSS classes từ design system của Hi
    // ----------------------------------------------------------
    const CSS = {
        card:          'w-full bg-surface-container-lowest/80 backdrop-blur-[24px] border border-outline-variant/30 rounded-2xl soft-shadow',
        label:         'text-on-surface-variant font-label-sm text-[10px] md:text-xs uppercase tracking-widest opacity-60',
        btnPrimary:    'w-full bg-primary text-on-primary px-6 py-3.5 rounded-xl md:rounded-full font-bold text-sm hover:bg-surface-tint transition-colors',
        btnDisabled:   'w-full bg-surface-variant text-on-surface-variant px-6 py-3.5 rounded-xl md:rounded-full font-bold text-sm cursor-not-allowed opacity-50',
        // MCQ option — mobile: flex row (text + icon); desktop: flex column (centered)
        mcqOptDefault: 'mcq-opt w-full text-left p-4 md:p-5 md:min-h-[90px] rounded-xl border border-outline-variant/40 bg-surface-container-lowest flex flex-row md:flex-col items-center justify-between md:justify-center md:text-center gap-2 transition-all hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98]',
        mcqOptSelected:'mcq-opt w-full text-left p-4 md:p-5 md:min-h-[90px] rounded-xl border-2 border-primary bg-primary/8 flex flex-row md:flex-col items-center justify-between md:justify-center md:text-center gap-2 transition-all',
        mcqOptCorrect: 'mcq-opt w-full text-left p-4 md:p-5 md:min-h-[90px] rounded-xl border-2 border-green-500 bg-green-50 flex flex-row md:flex-col items-center justify-between md:justify-center md:text-center gap-2 transition-all',
        mcqOptWrong:   'mcq-opt w-full text-left p-4 md:p-5 md:min-h-[90px] rounded-xl border-2 border-error bg-error-container/30 flex flex-row md:flex-col items-center justify-between md:justify-center md:text-center gap-2 transition-all',
        fillInput:     'fill-input w-8 h-10 sm:w-12 sm:h-14 bg-[#F5F5F5] rounded-t border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 text-center font-bold text-lg sm:text-2xl text-on-surface uppercase outline-none px-0 transition-colors',
    };

    // Container element (set trong init)
    let _container = null;

    // State UI local
    let _selectedMCQIndex = null;
    let _isShowingFeedback = false;

    // ----------------------------------------------------------
    // INIT
    // ----------------------------------------------------------

    /**
     * Khởi tạo UI, bind container.
     * Gọi trước HiSession.startSession().
     */
    function init() {
        _container = document.getElementById('exercise-container');
        if (!_container) {
            console.error('[HiSessionUI] Không tìm thấy #exercise-container trong DOM.');
            return;
        }
        _selectedMCQIndex = null;
        _isShowingFeedback = false;
        _updateProgress();
    }

    // ----------------------------------------------------------
    // RENDER ĐIỀU PHỐI CHÍNH
    // ----------------------------------------------------------

    /**
     * Render exercise hiện tại từ HiSession.getCurrentItem().
     * Gọi sau mỗi lần advance (đúng hoặc sai).
     */
    function render() {
        if (!_container) {
            console.error('[HiSessionUI] Chưa gọi init().');
            return;
        }

        if (HiSession.isComplete()) {
            _renderCompletion();
            return;
        }

        const item = HiSession.getCurrentItem();
        if (!item) {
            _renderCompletion();
            return;
        }

        _isShowingFeedback = false;
        _selectedMCQIndex  = null;
        _updateProgress();

        switch (item.exerciseType) {
            case 'flashcard': _renderFlashcard(item);  break;
            case 'mcq':       _renderMCQ(item);        break;
            case 'fill':      _renderFill(item);       break;
            case 'listen':    _renderListen(item);     break;
            default:
                console.error('[HiSessionUI] Unknown exercise type:', item.exerciseType);
        }
    }

    // ----------------------------------------------------------
    // RENDER: FLASHCARD
    // ----------------------------------------------------------

    function _renderFlashcard(item) {
        const d = item.exerciseData;
        _container.innerHTML = `
        <div class="w-full flex flex-col items-center gap-3 fade-in">
            <div class="${CSS.label}">Bài tập: Thẻ ghi nhớ</div>

            <div id="flashcard-card"
                 class="${CSS.card} flex flex-col min-h-[360px] md:min-h-[400px] relative overflow-hidden cursor-pointer transition-all"
                 onclick="HiSessionUI._flipCard()">

                <!-- MẶT TRƯỚC: hiển thị nghĩa tiếng Việt -->
                <div id="card-front"
                     class="flex-1 flex flex-col items-center justify-center p-6 md:p-8 z-10 bg-surface-container-lowest rounded-2xl">
                    <span class="text-on-surface-variant text-sm mb-4">${d.frontLabel}</span>
                    <h2 class="font-bold text-on-surface text-3xl sm:text-5xl mb-8 text-center leading-tight">
                        ${_esc(d.frontWord)}
                    </h2>
                    <button class="bg-primary text-on-primary px-6 py-2.5 md:px-8 md:py-3 rounded-full text-xs md:text-sm font-bold tracking-wide flex items-center gap-2 shadow-sm pointer-events-none">
                        <span class="material-symbols-outlined text-[18px]">visibility</span>
                        Nhấn xem đáp án
                    </button>
                </div>

                <!-- MẶT SAU: hiển thị từ tiếng Anh + rate buttons -->
                <div id="card-back"
                     class="hidden flex-1 flex flex-col items-center justify-center p-6 md:p-8 z-10 bg-primary-fixed/20 rounded-2xl">
                    <span class="text-on-surface-variant text-sm mb-4">${d.backLabel}</span>
                    <div class="flex items-center justify-center gap-3 mb-2">
                        <h2 class="font-bold text-primary text-3xl sm:text-5xl text-center">
                            ${_esc(d.backWord)}
                        </h2>
                        <button onclick="event.stopPropagation(); HiSessionUI._speak('${_esc(d.backWord)}')"
                                title="Nghe phát âm"
                                class="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0">
                            <span class="material-symbols-outlined text-[22px]">volume_up</span>
                        </button>
                    </div>
                    ${d.phonetic
                        ? `<p class="text-on-surface-variant mb-6 font-mono text-sm md:text-base">${_esc(d.phonetic)}</p>`
                        : '<div class="mb-6"></div>'
                    }
                    <div class="flex w-full md:w-auto flex-row justify-center gap-2 md:gap-4">
                        <button onclick="event.stopPropagation(); HiSessionUI._onFlashcardRate('hard')"
                            class="flex-1 md:flex-none px-4 py-3 md:px-8 md:py-3 rounded-xl md:rounded-full text-xs md:text-sm font-bold bg-tertiary-fixed text-on-tertiary-fixed hover:opacity-90 transition-opacity">
                            Khó
                        </button>
                        <button onclick="event.stopPropagation(); HiSessionUI._onFlashcardRate('good')"
                            class="flex-1 md:flex-none px-4 py-3 md:px-8 md:py-3 rounded-xl md:rounded-full text-xs md:text-sm font-bold bg-secondary-container text-on-secondary-container hover:opacity-90 transition-opacity">
                            Tốt
                        </button>
                        <button onclick="event.stopPropagation(); HiSessionUI._onFlashcardRate('easy')"
                            class="flex-1 md:flex-none px-4 py-3 md:px-8 md:py-3 rounded-xl md:rounded-full text-xs md:text-sm font-bold bg-primary text-on-primary hover:bg-surface-tint transition-colors">
                            Dễ
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
        // Phát âm tự động khi lật thẻ (sau render)
        // Sẽ được gọi từ _flipCard
    }

    /** Lật card */
    function _flipCard() {
        const front = document.getElementById('card-front');
        const back  = document.getElementById('card-back');
        if (front && back) {
            front.classList.toggle('hidden');
            back.classList.toggle('hidden');
            // Phát âm khi lật sang mặt sau
            if (!back.classList.contains('hidden')) {
                const item = HiSession.getCurrentItem();
                if (item?.exerciseData?.backWord) {
                    _speak(item.exerciseData.backWord);
                }
            }
        }
    }

    /** Xử lý rating flashcard */
    function _onFlashcardRate(rating) {
        if (_isShowingFeedback) return;
        const result = HiSession.rateFlashcard(rating);

        if (result.isNewWord) {
            // Từ mới lv0: auto pass bất kể bấm gì
            _showFeedbackOverlay(true, `✓ Từ mới — đã ghi nhận!`, () => render());
        } else if (result.correct) {
            _showFeedbackOverlay(true, `+1 từ hoàn thành`, () => render());
        } else {
            _showFeedbackOverlay(false, `Hãy thử lại với dạng bài khác nhé!`, () => render());
        }
    }

    // ----------------------------------------------------------
    // RENDER: MCQ (Multiple Choice Question)
    // ----------------------------------------------------------

    function _renderMCQ(item) {
        const d = item.exerciseData;
        const optionsHTML = d.options.map((opt, idx) => `
            <button onclick="HiSessionUI._onMCQSelect(${idx})"
                    data-idx="${idx}"
                    class="${CSS.mcqOptDefault}">
                <span class="text-sm md:text-base font-medium text-on-surface leading-snug">${_esc(opt.text)}</span>
                <span class="material-symbols-outlined text-outline-variant shrink-0 md:hidden">radio_button_unchecked</span>
            </button>
        `).join('');

        _container.innerHTML = `
        <div class="w-full flex flex-col items-center gap-3 fade-in">
            <div class="${CSS.label}">Bài tập: Trắc nghiệm</div>

            <div class="${CSS.card} p-6 md:p-8 flex flex-col">
                <div class="text-center mb-5 md:mb-7">
                    <span class="text-on-surface-variant text-xs md:text-sm block mb-2">${d.question}</span>
                    <div class="flex items-center justify-center gap-2">
                        <h2 class="font-bold text-on-surface text-2xl md:text-3xl">"${_esc(d.word)}"</h2>
                        <button onclick="HiSessionUI._speak('${_esc(d.word)}')"
                                title="Nghe phát âm"
                                class="p-2 rounded-full bg-surface-container-low text-primary hover:bg-primary/10 transition-colors shrink-0">
                            <span class="material-symbols-outlined text-[20px]">volume_up</span>
                        </button>
                    </div>
                </div>

                <!-- Mobile: 1 cột | Desktop: grid 2×2 -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3" id="mcq-options">
                    ${optionsHTML}
                </div>

                <div class="mt-5 md:mt-7">
                    <button id="mcq-check"
                            onclick="HiSessionUI._onMCQCheck()"
                            class="${CSS.btnDisabled}"
                            disabled>
                        Kiểm tra & Tiếp tục
                    </button>
                </div>
            </div>
        </div>`;
    }

    /** Chọn một option MCQ */
    function _onMCQSelect(idx) {
        if (_isShowingFeedback) return;
        _selectedMCQIndex = idx;

        // Reset tất cả options về default
        document.querySelectorAll('.mcq-opt').forEach((btn, i) => {
            btn.className = CSS.mcqOptDefault;
            const icon = btn.querySelector('.material-symbols-outlined');
            if (icon) {
                icon.textContent = 'radio_button_unchecked';
                icon.className = 'material-symbols-outlined text-outline-variant';
            }
        });

        // Highlight option được chọn
        const selectedBtn = document.querySelector(`[data-idx="${idx}"]`);
        if (selectedBtn) {
            selectedBtn.className = CSS.mcqOptSelected;
            const icon = selectedBtn.querySelector('.material-symbols-outlined');
            if (icon) {
                icon.textContent = 'radio_button_checked';
                icon.className = 'material-symbols-outlined text-primary';
            }
        }

        // Enable nút kiểm tra
        const checkBtn = document.getElementById('mcq-check');
        if (checkBtn) {
            checkBtn.disabled = false;
            checkBtn.className = CSS.btnPrimary;
        }
    }

    /** Kiểm tra đáp án MCQ */
    function _onMCQCheck() {
        if (_isShowingFeedback || _selectedMCQIndex === null) return;
        _isShowingFeedback = true;

        // Lưu index đáp án đúng TRƯỚC khi submitAnswer advance queue
        const currentItem = HiSession.getCurrentItem();
        const correctIndex = currentItem?.exerciseData?.options
            ?.findIndex(o => o.isCorrect) ?? -1;

        const result = HiSession.submitAnswer(_selectedMCQIndex);

        // Disable tất cả options
        document.querySelectorAll('.mcq-opt').forEach(btn => {
            btn.disabled = true;
            btn.onclick  = null;
        });
        document.getElementById('mcq-check')?.setAttribute('disabled', '');

        if (result.skipped) {
            _highlightMCQResult(result.correct, correctIndex);
            setTimeout(() => _showSkipFeedback(result.correctAnswer, () => render()), 200);
        } else {
            _highlightMCQResult(result.correct, correctIndex);
            setTimeout(() => render(), 1600);
        }
    }

    /** Hiển thị màu sắc đúng/sai trên MCQ options */
    function _highlightMCQResult(correct, correctIndex) {
        const options = document.querySelectorAll('.mcq-opt');
        options.forEach((btn, idx) => {
            const isSelected = btn.dataset.idx == _selectedMCQIndex;
            const isCorrect  = idx === correctIndex;
            const icon = btn.querySelector('.material-symbols-outlined');

            if (isCorrect) {
                // Luôn highlight đáp án đúng màu xanh
                btn.className = CSS.mcqOptCorrect;
                if (icon) { icon.textContent = 'check_circle'; icon.className = 'material-symbols-outlined text-green-600'; }
            } else if (isSelected && !correct) {
                // Đáp án user chọn mà sai → đỏ
                btn.className = CSS.mcqOptWrong;
                if (icon) { icon.textContent = 'cancel'; icon.className = 'material-symbols-outlined text-error'; }
            }
        });

        // Hiện toast feedback
        _showToast(correct, correct ? '✓ Chính xác!' : '✗ Sai rồi, thử dạng bài khác nhé!');
    }

    // ----------------------------------------------------------
    // RENDER: FILL IN BLANK (điền chữ cái)
    // ----------------------------------------------------------

    function _renderFill(item) {
        const d = item.exerciseData;

        // Tạo input boxes cho từng chữ cái, thêm dấu cách phân tách giữa các từ
        let fillIndex = 0;
        const inputsHTML = d.answer.split('').map((char) => {
            if (char === ' ') {
                // Hiển thị khoảng cách nhìn thấy được giữa các từ
                return `<span class="w-3 md:w-4 shrink-0" aria-hidden="true"></span>`;
            }
            const idx = fillIndex++;
            return `<input type="text" maxlength="1"
                   data-fill-index="${idx}"
                   class="${CSS.fillInput}"
                   autocomplete="off" autocorrect="off" spellcheck="false"/>`;
        }).join('');

        const totalLetters = d.answer.replace(/\s/g, '').length;
        // Nếu từ có nhiều chữ (> 8), chia thành 2 dòng bằng flex-wrap
        const boxesClass = totalLetters > 8
            ? 'flex gap-1 md:gap-2 justify-center flex-wrap max-w-full items-end'
            : 'flex gap-1 md:gap-2 justify-center items-end';

        _container.innerHTML = `
        <div class="w-full flex flex-col items-center gap-3 fade-in">
            <div class="${CSS.label}">Bài tập: Điền vào chỗ trống</div>

            <div class="${CSS.card} p-5 md:p-8 flex flex-col items-center min-h-[300px] justify-center">

                <!-- Gợi ý nghĩa + nút phát âm -->
                <div class="text-center mb-6 w-full">
                    <div class="flex items-center justify-center gap-2 mb-3">
                        <p class="text-sm text-on-surface-variant font-medium">Điền từ tiếng Anh có nghĩa:</p>
                        <button onclick="HiSessionUI._speak('${_esc(d.answer)}')"
                                title="Nghe phát âm từ cần điền"
                                class="p-1.5 rounded-full bg-surface-container-low text-primary hover:bg-primary/10 transition-colors">
                            <span class="material-symbols-outlined text-[18px]">volume_up</span>
                        </button>
                    </div>
                    ${d.sentence
                        ? `<p class="text-base md:text-xl text-on-surface leading-relaxed mx-auto">
                               ${_buildSentenceHTML(d.sentence)}
                           </p>`
                        : `<p class="text-base md:text-xl text-on-surface-variant leading-relaxed mx-auto">
                               ${_esc(d.meaningHint)}
                           </p>`
                    }

                    <!-- AI Hint button -->
                    <button onclick="HiSessionUI._getAIHint()"
                            class="mt-4 text-primary font-bold text-xs md:text-sm flex items-center justify-center gap-1 hover:bg-primary-container/10 px-3 py-2 rounded-lg mx-auto w-max transition-colors">
                        <span class="material-symbols-outlined text-[16px]">lightbulb</span>
                        Xin gợi ý AI
                    </button>
                    <div id="ai-hint-container"
                         class="mt-3 text-xs md:text-sm text-on-surface-variant hidden bg-surface-container-low p-3 rounded-lg border border-outline-variant/30 w-full text-left">
                    </div>
                </div>

                <!-- Input boxes từng chữ cái -->
                <div class="${boxesClass}" id="fill-boxes">
                    ${inputsHTML}
                </div>

                <!-- Nút kiểm tra -->
                <div class="mt-8 w-full">
                    <button onclick="HiSessionUI._onFillCheck()" class="${CSS.btnPrimary}">
                        Kiểm tra
                    </button>
                </div>
            </div>
        </div>`;

        // Bind keyboard navigation cho fill boxes
        _bindFillInputs();
    }

    /** Tạo HTML câu ví dụ với ___ được highlight */
    function _buildSentenceHTML(sentence) {
        return _esc(sentence).replace(
            /___/g,
            '<span class="inline-block border-b-2 border-outline-variant w-16 mx-1 align-bottom text-transparent">___</span>'
        );
    }

    /** Keyboard navigation giữa các ô fill */
    function _bindFillInputs() {
        const inputs = document.querySelectorAll('[data-fill-index]');
        inputs.forEach((input, idx) => {
            // Auto-advance khi nhập ký tự
            input.addEventListener('input', (e) => {
                const val = e.target.value;
                // Chỉ giữ ký tự cuối nếu user paste nhiều chữ
                if (val.length > 1) {
                    // Điền cascade từ vị trí hiện tại
                    const chars = val.toUpperCase().split('');
                    inputs.forEach((inp, i) => {
                        if (i >= idx && chars[i - idx] !== undefined) {
                            inp.value = chars[i - idx];
                        }
                    });
                    // Focus vào ô tiếp theo sau paste
                    const nextIdx = Math.min(idx + chars.length, inputs.length - 1);
                    inputs[nextIdx]?.focus();
                } else if (val.length === 1 && idx < inputs.length - 1) {
                    inputs[idx + 1].focus();
                }
            });

            // Backspace → về ô trước
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && idx > 0) {
                    inputs[idx - 1].focus();
                }
                // Enter → kiểm tra
                if (e.key === 'Enter') {
                    _onFillCheck();
                }
            });
        });

        // Auto-focus ô đầu tiên
        inputs[0]?.focus();
    }

    /** Kiểm tra đáp án fill-in-blank */
    function _onFillCheck() {
        if (_isShowingFeedback) return;
        _isShowingFeedback = true;

        // Thu thập các chữ cái đã nhập
        const inputs  = document.querySelectorAll('[data-fill-index]');
        const typedLetters = Array.from(inputs).map(i => i.value || '_');

        // Ghép lại đáp án, chèn dấu cách đúng vị trí theo answer gốc
        const item = HiSession.getCurrentItem();
        const answer = item?.exerciseData?.answer || '';
        let letterIdx = 0;
        const typed = answer.split('').map(char => {
            if (char === ' ') return ' ';
            return typedLetters[letterIdx++] || '_';
        }).join('');

        const result  = HiSession.submitAnswer(typed);

        // Visual feedback trên các ô
        inputs.forEach((inp, i) => {
            if (result.correct) {
                inp.className = CSS.fillInput + ' border-green-500 bg-green-50';
            } else {
                inp.className = CSS.fillInput + ' border-error bg-error-container/20';
                // Điền đáp án đúng để user thấy
                const correct = result.correctAnswer.replace(/\s/g, '');
                if (correct[i]) inp.value = correct[i].toUpperCase();
            }
            inp.disabled = true;
        });

        if (result.skipped) {
            inputs.forEach(inp => { inp.disabled = true; });
            _showSkipFeedback(result.correctAnswer, () => render());
        } else {
            _showToast(result.correct, result.correct ? '✓ Chính xác!' : `✗ Đáp án: ${result.correctAnswer}`);
            setTimeout(() => render(), 1800);
        }
    }

    /** Xin gợi ý AI cho fill exercise — dùng Groq (llama-3.1-8b-instant) */
    async function _getAIHint() {
        const hintEl = document.getElementById('ai-hint-container');
        if (!hintEl) return;

        const item = HiSession.getCurrentItem();
        if (!item || item.exerciseType !== 'fill') return;

        const d   = item.exerciseData;
        const ctx = d.aiContext || d;
        const word     = ctx.answer     || '';
        const meaning  = ctx.meaning    || '';
        const sentence = ctx.sentence   || '';

        // Hiện loading
        hintEl.classList.remove('hidden');
        hintEl.innerHTML = `
            <div class="flex items-center gap-2 text-primary text-xs">
                <span class="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                <span>Groq AI đang tạo gợi ý...</span>
            </div>`;

        try {
            const letters      = word.replace(/\s/g, '').length;
            const firstLetter  = word[0]?.toUpperCase() || '';
            const blanked      = sentence
                ? sentence.replace(new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`, 'gi'), '_'.repeat(letters))
                : '';

            const prompt = `You are a Vietnamese vocabulary learning assistant. Give a CONCISE hint in Vietnamese for the English word the student needs to fill in.

Word to guess: "${word}"
Vietnamese meaning: "${meaning}"
${blanked ? `Sentence: "${blanked}"` : ''}

Rules (STRICT):
- Write EXACTLY 1-2 short sentences in Vietnamese
- Reveal: first letter "${firstLetter}", total ${letters} letters, word type if obvious
- Give a quick memory tip or context clue
- Do NOT reveal the full English word
- Be precise and helpful, not vague

Example format: "Bắt đầu bằng "${firstLetter}", gồm ${letters} chữ cái. [1 câu gợi ý ngắn về nghĩa/ngữ cảnh]"`;

            const res = await fetch('https://groq-proxy-sandy.vercel.app/api/groq', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model:       'llama-3.1-8b-instant',
                    messages:    [{ role: 'user', content: prompt }],
                    temperature: 0.2,
                    max_tokens:  120,
                }),
            });

            if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
            const json = await res.json();
            const hint = json.choices?.[0]?.message?.content?.trim();
            if (!hint) throw new Error('Groq trả về rỗng.');

            hintEl.innerHTML = `
                <div class="flex items-start gap-2">
                    <span class="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">lightbulb</span>
                    <p class="text-xs md:text-sm text-on-surface leading-relaxed">${_esc(hint)}</p>
                </div>`;

        } catch (err) {
            hintEl.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[14px] text-error">error</span>
                    <span class="text-error text-xs">Không thể lấy gợi ý: ${_esc(err.message)}</span>
                </div>`;
        }
    }


    // ----------------------------------------------------------
    // RENDER: LISTEN (nghe và điền từ)
    // ----------------------------------------------------------

    function _renderListen(item) {
        const d = item.exerciseData;

        _container.innerHTML = `
        <div class="w-full flex flex-col items-center gap-3 fade-in">
            <div class="${CSS.label}">Bài tập: Luyện nghe</div>

            <div class="${CSS.card} p-6 md:p-8 flex flex-col items-center min-h-[360px] md:min-h-[400px] justify-center">

                <span class="text-on-surface-variant text-sm md:text-base mb-6 md:mb-10 block text-center">
                    Nghe và nhập từ bạn nghe được
                </span>

                <!-- Nút phát âm thanh -->
                <button id="listen-play-btn"
                        onclick="HiSessionUI._onListenPlay()"
                        class="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-[0_8px_24px_rgba(0,129,192,0.3)] hover:scale-105 active:scale-95 transition-all mb-6 md:mb-10 group">
                    <span class="material-symbols-outlined icon-fill text-[40px] md:text-[48px] ml-1 md:ml-2">play_arrow</span>
                </button>

                <!-- Phiên âm hint (ẩn ban đầu, hiện sau lần nghe đầu) -->
                <p id="listen-phonetic" class="text-on-surface-variant font-mono text-sm mb-4 opacity-0 transition-opacity duration-500">
                    ${d.phonetic ? _esc(d.phonetic) : ''}
                </p>

                <!-- Input nhập từ -->
                <div class="w-full max-w-md relative mb-6 md:mb-10">
                    <input id="listen-input"
                           type="text"
                           placeholder="Nhập từ bằng tiếng Anh..."
                           autocomplete="off" autocorrect="off" spellcheck="false"
                           onkeydown="if(event.key==='Enter') HiSessionUI._onListenCheck()"
                           class="w-full bg-[#F5F5F5] border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 rounded-t-lg px-4 md:px-6 py-3 md:py-4 font-body-lg text-center text-on-surface placeholder:text-outline-variant/70 transition-colors outline-none"/>
                    <!-- Nút phát chậm -->
                    <div class="absolute right-2 md:right-3 top-1/2 -translate-y-1/2">
                        <button onclick="HiSessionUI._onListenSlow()"
                                title="Phát chậm"
                                class="text-outline-variant hover:text-primary p-2 transition-colors rounded-full">
                            <span class="material-symbols-outlined text-[18px] md:text-[20px]">speed</span>
                        </button>
                    </div>
                </div>

                <!-- Nút kiểm tra -->
                <div class="w-full max-w-md">
                    <button onclick="HiSessionUI._onListenCheck()" class="${CSS.btnPrimary}">
                        Kiểm tra
                    </button>
                </div>
            </div>
        </div>`;

        // Auto-phát âm khi bài hiển thị
        setTimeout(() => _onListenPlay(), 400);
    }

    let _listenPlayCount = 0;

    function _onListenPlay() {
        const item = HiSession.getCurrentItem();
        if (!item || item.exerciseType !== 'listen') return;

        HiSession.speakWord(item.exerciseData.wordToSpeak, 0.85);
        _listenPlayCount++;

        // Hiện phonetic sau lần nghe đầu tiên
        if (_listenPlayCount >= 1) {
            const phoneticEl = document.getElementById('listen-phonetic');
            if (phoneticEl) phoneticEl.style.opacity = '1';
        }

        // Animate nút play
        const btn = document.getElementById('listen-play-btn');
        if (btn) {
            btn.classList.add('scale-95', 'bg-primary/80');
            setTimeout(() => btn.classList.remove('scale-95', 'bg-primary/80'), 300);
        }

        // Focus vào input sau khi phát
        setTimeout(() => document.getElementById('listen-input')?.focus(), 500);
    }

    function _onListenSlow() {
        const item = HiSession.getCurrentItem();
        if (!item) return;
        HiSession.speakWord(item.exerciseData.wordToSpeak, 0.5);
    }

    function _onListenCheck() {
        if (_isShowingFeedback) return;
        const inputEl = document.getElementById('listen-input');
        if (!inputEl) return;

        const typed = inputEl.value.trim();
        if (!typed) {
            inputEl.classList.add('border-error');
            inputEl.placeholder = 'Hãy nhập từ bạn nghe được...';
            return;
        }

        _isShowingFeedback = true;
        _listenPlayCount   = 0;

        const result = HiSession.submitAnswer(typed);

        inputEl.disabled = true;
        if (result.correct) {
            inputEl.className = inputEl.className + ' border-green-500 bg-green-50 text-green-700';
        } else {
            inputEl.className = inputEl.className + ' border-error bg-error-container/20 text-error';
            inputEl.value = result.correctAnswer; // Hiện đáp án đúng
        }

        if (result.skipped) {
            inputEl.disabled = true;
            _showSkipFeedback(result.correctAnswer, () => render());
        } else {
            _showToast(result.correct, result.correct ? '✓ Chính xác!' : `✗ Đáp án: ${result.correctAnswer}`);
            setTimeout(() => render(), 1800);
        }
    }

    // ----------------------------------------------------------
    // RENDER: COMPLETION (Hoàn thành phiên)
    // ----------------------------------------------------------

    function _renderCompletion() {
        const summary = HiSession.endSession();
        const progress = HiSession.getProgress();

        // Update progress bar lên 100%
        const bar = document.getElementById('learn-progress');
        if (bar) bar.style.width = '100%';

        // Ẩn streak container
        document.getElementById('learning-streak-container')?.classList.add('hidden');

        _container.innerHTML = `
        <div class="w-full flex flex-col items-center gap-4 mt-8 fade-in text-center px-4">
            <div class="w-20 h-20 md:w-24 md:h-24 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mb-2 shadow-lg">
                <span class="material-symbols-outlined text-[48px] md:text-[56px] icon-fill">check_circle</span>
            </div>
            <h2 class="text-2xl md:text-4xl font-bold text-on-surface tracking-tight">Hoàn thành xuất sắc!</h2>
            <p class="text-on-surface-variant text-sm md:text-lg mb-2">
                Bạn đã củng cố thành công
                <span class="font-bold text-primary">${summary.wordsReviewed} từ vựng</span>
                vào bộ nhớ.
            </p>

            <!-- Tóm tắt kết quả -->
            <div class="w-full max-w-sm glass-card soft-shadow rounded-xl p-5 mt-2">
                <h3 class="font-bold text-on-surface mb-4 text-left text-sm uppercase tracking-wider text-outline">Kết quả phiên học</h3>
                <div class="flex flex-col gap-2">
                    ${summary.completedWords.map(w => `
                        <div class="flex items-center justify-between py-1 border-b border-outline-variant/10 last:border-0">
                            <span class="font-medium text-on-surface text-sm">${_esc(w.word.word)}</span>
                            <span class="text-xs px-2 py-1 rounded-full font-bold ${
                                w.skipped                ? 'bg-amber-100 text-amber-800' :
                                w.isNew                  ? 'bg-primary/10 text-primary' :
                                w.rating === 'easy'      ? 'bg-primary text-on-primary' :
                                w.rating === 'good'      ? 'bg-secondary-container text-on-secondary-container' :
                                'bg-tertiary-fixed text-on-tertiary-fixed'
                            }">
                                ${w.skipped ? 'Bỏ qua' : w.isNew ? 'Từ mới' : w.rating === 'easy' ? 'Dễ' : w.rating === 'good' ? 'Tốt' : 'Khó'}
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <button onclick="navigateTo('dashboard')"
                    class="w-full md:w-auto bg-primary text-on-primary px-8 py-3.5 rounded-xl md:rounded-full font-bold shadow-md hover:-translate-y-1 transition-transform mt-4">
                Về Trang chủ
            </button>
        </div>`;
    }

    // ----------------------------------------------------------
    // UI HELPERS
    // ----------------------------------------------------------

    /** Cập nhật progress bar */
    function _updateProgress() {
        if (!HiSession.getCurrentItem && !HiSession.getProgress) return;
        const progress = HiSession.getProgress();
        const bar = document.getElementById('learn-progress');
        if (bar) bar.style.width = progress.percent + '%';
    }

    /**
     * Toast nhỏ hiện dưới exercise card (tự biến mất).
     * @param {boolean} correct
     * @param {string}  message
     */
    /**
     * Toast nhỏ hiện dưới exercise card (tự biến mất).
     * @param {boolean} correct
     * @param {string}  message
     * @param {'correct'|'wrong'|'skip'|'new'} [type] - override màu sắc
     */
    function _showToast(correct, message, type = null) {
        document.getElementById('hi-toast')?.remove();

        const colorClass = type === 'skip' ? 'bg-amber-500 text-white'
                         : type === 'new'  ? 'bg-primary text-on-primary'
                         : correct         ? 'bg-green-500 text-white'
                         :                   'bg-error text-on-error';

        const toast = document.createElement('div');
        toast.id = 'hi-toast';
        toast.className = `
            fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999]
            px-5 py-3 rounded-xl font-bold text-sm shadow-lg
            transition-all duration-300 opacity-0
            ${colorClass}
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(-8px)';
        });

        const displayMs = type === 'skip' ? 2000 : correct ? 1200 : 1600;
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(0px)';
            setTimeout(() => toast.remove(), 300);
        }, displayMs);
    }

    /**
     * Overlay skip đặc biệt (màu amber), hiện lên giữa màn hình.
     * Gọi khi result.skipped === true.
     * @param {string}   correctAnswer
     * @param {Function} onDone
     */
    function _showSkipFeedback(correctAnswer, onDone) {
        document.getElementById('hi-toast')?.remove();
        document.getElementById('hi-skip-overlay')?.remove();

        const overlay = document.createElement('div');
        overlay.id = 'hi-skip-overlay';
        overlay.className = 'fixed inset-0 z-[9998] flex items-center justify-center bg-black/10 backdrop-blur-[2px] transition-opacity duration-300 opacity-0';
        overlay.innerHTML = `
            <div style="background:#fffbeb;border:2px solid #f59e0b;border-radius:1rem;padding:1.5rem 2rem;max-width:320px;width:calc(100% - 2rem);text-align:center;display:flex;flex-direction:column;align-items:center;gap:0.75rem;box-shadow:0 20px 60px rgba(0,0,0,0.15);">
                <span class="material-symbols-outlined" style="color:#f59e0b;font-size:40px;">skip_next</span>
                <p style="font-weight:700;color:#92400e;font-size:1rem;margin:0;">Đã bỏ qua từ này</p>
                <p style="color:#b45309;font-size:0.875rem;margin:0;line-height:1.5;">
                    Đáp án đúng: <strong style="color:#78350f;">${correctAnswer.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</strong>
                </p>
                <p style="color:#d97706;font-size:0.75rem;margin:0;">Từ sẽ được đưa về Lv.1 để ôn lại sớm hơn.</p>
            </div>`;
        document.body.appendChild(overlay);

        requestAnimationFrame(() => { overlay.style.opacity = '1'; });

        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => { overlay.remove(); onDone(); }, 300);
        }, 2200);
    }

    /**
     * Overlay feedback toàn màn hình (dùng cho flashcard).
     * @param {boolean}  correct
     * @param {string}   message
     * @param {Function} onDone   - callback sau khi ẩn
     */
    function _showFeedbackOverlay(correct, message, onDone) {
        _showToast(correct, message);
        setTimeout(onDone, 1200);
    }

    /** Escape HTML để tránh XSS */
    function _esc(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /**
     * Phát âm một từ/cụm từ tiếng Anh bằng Web Speech API.
     * @param {string} word  - Từ cần phát âm
     * @param {number} rate  - Tốc độ (0.5–1.0), mặc định 0.9
     */
    function _speak(word, rate = 0.9) {
        if (!word || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(word);
        utter.lang = 'en-US';
        utter.rate = rate;
        utter.pitch = 1;
        // Chọn giọng en-US nếu có
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => v.lang === 'en-US' && !v.localService)
                       || voices.find(v => v.lang === 'en-US')
                       || voices.find(v => v.lang.startsWith('en'));
        if (preferred) utter.voice = preferred;
        window.speechSynthesis.speak(utter);
    }

    // ----------------------------------------------------------
    // PUBLIC API
    // ----------------------------------------------------------
    return {
        init,
        render,

        // Expose handlers cho inline onclick trong rendered HTML
        _flipCard,
        _onFlashcardRate,
        _onMCQSelect,
        _onMCQCheck,
        _onFillCheck,
        _getAIHint,
        _onListenPlay,
        _onListenSlow,
        _onListenCheck,
        _speak,
        _showSkipFeedback,
    };

})();

/**
 * HiSpeak - Hàm phát âm toàn cục (dùng cho topic-detail, vocabulary, v.v.)
 * @param {string} word  - Từ cần phát âm
 * @param {number} rate  - Tốc độ (0.5-1.0), mặc định 0.9
 */
window.HiSpeak = function(word, rate = 0.9) {
    if (!word || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(word);
    utter.lang = 'en-US';
    utter.rate = rate;
    utter.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang === 'en-US' && !v.localService)
                   || voices.find(v => v.lang === 'en-US')
                   || voices.find(v => v.lang.startsWith('en'));
    if (preferred) utter.voice = preferred;
    window.speechSynthesis.speak(utter);
};

if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.addEventListener('pointerdown', () => window.speechSynthesis.getVoices(), { once: true });
}


// ============================================================
// TÍCH HỢP VÀO A7.html - THAY THẾ CÁC HÀM CŨ
// ============================================================
// Dán đoạn này vào <script> cuối A7.html, thay thế toàn bộ
// các hàm startSession, startSinglePractice, handleExerciseComplete,
// nextExercise, flipCard, rateCard, selectMCQ, checkFillInBlank,
// updateProgress, getAIHint cũ.
// ============================================================

// ── 1. Thêm id vào <main> trong page-learning ──────────────
// Tìm dòng:
//   <main class="pt-24 md:pt-[100px] ...">
// Đổi thành:
//   <main class="pt-24 md:pt-[100px] ..." id="learning-main">
//     <div id="exercise-container"></div>
//   </main>
// Và XÓA 4 section cũ (exercise-0 → exercise-3) + section exercise-completed.

// ── 2. Thay thế startSession ────────────────────────────────
window.startSession = async function() {
    document.getElementById('learning-progress-container').style.display = 'flex';
    document.getElementById('learning-streak-container').style.display  = 'flex';
    document.getElementById('learning-close-btn').setAttribute('onclick', "navigateTo('dashboard')");

    navigateTo('learning');

    try {
        HiSessionUI.init();

        // Load từ từ Supabase
        const words = await HiDB.getWordsDueForReview(20);

        if (!words || words.length === 0) {
            document.getElementById('exercise-container').innerHTML = `
                <div class="text-center mt-20 fade-in">
                    <span class="material-symbols-outlined text-[64px] text-outline mb-4 block">check_circle</span>
                    <h2 class="text-2xl font-bold text-on-surface mb-2">Tất cả đã ôn xong!</h2>
                    <p class="text-on-surface-variant mb-8">Không có từ nào cần ôn lúc này. Hãy quay lại sau.</p>
                    <button onclick="navigateTo('dashboard')" class="bg-primary text-on-primary px-8 py-3 rounded-full font-bold">
                        Về Trang chủ
                    </button>
                </div>`;
            return;
        }

        HiSession.startSession(words);
        HiSessionUI.render();

        // Cập nhật streak trên header
        const stats = await HiDB.getDashboardStats();
        const streakEl = document.querySelector('#learning-streak-container span.font-bold');
        if (streakEl) streakEl.textContent = stats.streak;

    } catch (err) {
        console.error('[startSession] Lỗi:', err);
        document.getElementById('exercise-container').innerHTML = `
            <div class="text-center mt-20 text-error">
                <p class="font-bold">Lỗi khi tải phiên học.</p>
                <p class="text-sm mt-1">${err.message}</p>
            </div>`;
    }
};
