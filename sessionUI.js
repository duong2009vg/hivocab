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
        fillInput:     'fill-input w-[clamp(1.75rem,calc((100vw-4.5rem)/var(--fill-max-word-len,10)),2.75rem)] h-11 sm:h-14 rounded-xl bg-surface-container-lowest border-2 border-outline-variant/40 focus:border-primary focus:bg-primary/5 focus:shadow-sm text-center font-bold text-base sm:text-2xl text-on-surface uppercase outline-none px-0 transition-all select-all',
    };

    // Container element (set trong init)
    let _container = null;

    // State UI local
    // State UI local
    let _selectedMCQIndex = null;
    let _isShowingFeedback = false;
    let _keyListenerAttached = false;

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

        if (!_keyListenerAttached) {
            window.addEventListener('keydown', _handleFlashcardKeydown);
            _keyListenerAttached = true;
        }
    }

    /**
     * Bắt phím tắt cho Flashcard:
     * - Phím Space hoặc Enter: Lật thẻ qua lại
     * - Phím 1, 2, 3: Đánh giá Khó (1), Tốt (2), Dễ (3) khi thẻ đang ở mặt sau
     */
    function _handleFlashcardKeydown(e) {
        const tag = e.target?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;

        const card = document.getElementById('flashcard-card');
        if (!card) {
            // Hỗ trợ phím Space để nghe lại phát âm trong bài Luyện nghe
            const listenBtn = document.getElementById('listen-play-btn');
            if (listenBtn && (e.code === 'Space' || e.key === ' ')) {
                e.preventDefault();
                _onListenPlay();
            }
            return;
        }

        if (e.target?.tagName === 'BUTTON' && e.target.id !== 'flashcard-card') {
            return;
        }

        const isFlipped = card.classList.contains('is-flipped');

        if (e.code === 'Space' || e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            _flipCard();
            return;
        }

        if (isFlipped && !_isShowingFeedback) {
            if (e.key === '1') {
                e.preventDefault();
                _onFlashcardRate('hard');
            } else if (e.key === '2') {
                e.preventDefault();
                _onFlashcardRate('good');
            } else if (e.key === '3') {
                e.preventDefault();
                _onFlashcardRate('easy');
            }
        }
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
        <div class="w-full max-w-2xl mx-auto flex flex-col items-center gap-3 fade-in px-1 sm:px-3">
            <div class="${CSS.label}">Bài tập: Thẻ ghi nhớ</div>

            <div class="flashcard-scene w-full max-w-xl mx-auto">
                <div id="flashcard-card"
                     class="flashcard-3d-card"
                     onclick="HiSessionUI._flipCard()"
                     tabindex="0"
                     role="button"
                     aria-label="Thẻ ghi nhớ - Nhấn hoặc bấm Space để lật thẻ">

                    <div class="flashcard-sheen"></div>

                    <!-- MẶT TRƯỚC: hiển thị nghĩa tiếng Việt -->
                    <div id="card-front" class="flashcard-face flashcard-front">
                        <div class="flex items-center justify-between w-full">
                            <span class="text-on-surface-variant text-[11px] sm:text-xs font-semibold uppercase tracking-wider">${d.frontLabel}</span>
                            <span class="inline-flex items-center gap-1 text-[11px] font-medium text-on-surface-variant bg-surface-container-high/80 px-2.5 py-0.5 rounded-full">
                                <span class="material-symbols-outlined text-[14px]">touch_app</span>
                                Chạm để lật
                            </span>
                        </div>

                        <div class="my-auto text-center py-3 flex flex-col items-center justify-center px-2 w-full">
                            <h2 class="font-bold text-on-surface text-2xl sm:text-3xl md:text-4xl text-center leading-snug break-words max-w-full">
                                ${_esc(d.frontWord)}
                            </h2>
                        </div>

                        <div class="flex justify-center w-full">
                            <button class="flashcard-flip-pill bg-primary text-on-primary px-5 py-2.5 sm:px-7 sm:py-3 rounded-full text-xs sm:text-sm font-bold tracking-wide flex items-center gap-2 shadow-sm pointer-events-none">
                                <span class="material-symbols-outlined text-[18px]">visibility</span>
                                <span>Nhấn xem đáp án</span>
                                <kbd class="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] bg-white/20 rounded font-mono">Space</kbd>
                            </button>
                        </div>
                    </div>

                    <!-- MẶT SAU: hiển thị từ tiếng Anh + audio + phonetic + example + rate buttons -->
                    <div id="card-back" class="flashcard-face flashcard-back">
                        <div class="flex items-center justify-between w-full">
                            <span class="text-primary font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                                <span class="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                                ${d.backLabel}
                            </span>
                            <button onclick="event.stopPropagation(); HiSessionUI._flipCard()"
                                    title="Lật lại mặt trước"
                                    class="inline-flex items-center gap-1 text-[11px] font-medium text-on-surface-variant hover:text-primary transition-colors bg-surface-container-high/70 hover:bg-surface-container-high px-2.5 py-1 rounded-full active:scale-95 touch-manipulation">
                                <span class="material-symbols-outlined text-[14px]">undo</span>
                                <span>Lật lại</span>
                            </button>
                        </div>

                        <div class="my-auto text-center py-2 flex flex-col items-center justify-center px-2 w-full">
                            <div class="flex items-center justify-center gap-2 sm:gap-3 mb-1 max-w-full">
                                <h2 class="font-bold text-primary text-2xl sm:text-3xl md:text-4xl text-center break-words leading-tight">
                                    ${_esc(d.backWord)}
                                </h2>
                                <button onclick="event.stopPropagation(); HiSessionUI._speak('${_esc(d.backWord)}')"
                                        title="Nghe phát âm"
                                        class="p-2 sm:p-2.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 active:scale-90 transition-all shrink-0 touch-manipulation">
                                    <span class="material-symbols-outlined text-[22px] sm:text-[24px]">volume_up</span>
                                </button>
                            </div>

                            <div class="flex items-center justify-center gap-2 flex-wrap mt-0.5 mb-2">
                                ${d.pos ? `<span class="text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">${_esc(d.pos)}</span>` : ''}
                                ${d.phonetic ? `<span class="text-on-surface-variant font-mono text-xs sm:text-sm">${_esc(d.phonetic)}</span>` : ''}
                            </div>

                            ${d.exampleSentence
                                ? `<div class="w-full max-w-md mx-auto px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-surface-container-lowest/70 border border-outline-variant/30 text-center mb-1">
                                    <p class="text-[11px] sm:text-xs md:text-sm text-on-surface/85 italic line-clamp-3 leading-relaxed">"${_esc(d.exampleSentence)}"</p>
                                   </div>`
                                : ''
                            }
                        </div>

                        <div class="flex w-full flex-row justify-center gap-2 sm:gap-3">
                            <button onclick="event.stopPropagation(); HiSessionUI._onFlashcardRate('hard')"
                                class="flex-1 min-h-[44px] py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold bg-tertiary-fixed text-on-tertiary-fixed hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1 shadow-sm touch-manipulation">
                                <span>Khó</span>
                                <kbd class="hidden md:inline-block px-1.5 py-0.5 text-[10px] bg-black/10 rounded font-mono font-normal">1</kbd>
                            </button>
                            <button onclick="event.stopPropagation(); HiSessionUI._onFlashcardRate('good')"
                                class="flex-1 min-h-[44px] py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold bg-secondary-container text-on-secondary-container hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1 shadow-sm touch-manipulation">
                                <span>Tốt</span>
                                <kbd class="hidden md:inline-block px-1.5 py-0.5 text-[10px] bg-black/10 rounded font-mono font-normal">2</kbd>
                            </button>
                            <button onclick="event.stopPropagation(); HiSessionUI._onFlashcardRate('easy')"
                                class="flex-1 min-h-[44px] py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold bg-primary text-on-primary hover:bg-surface-tint active:scale-95 transition-all flex items-center justify-center gap-1 shadow-sm touch-manipulation">
                                <span>Dễ</span>
                                <kbd class="hidden md:inline-block px-1.5 py-0.5 text-[10px] bg-white/20 rounded font-mono font-normal">3</kbd>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    }

    /** Lật card sống động 3D */
    function _flipCard() {
        const card = document.getElementById('flashcard-card');
        if (!card) return;
        const isFlipped = card.classList.toggle('is-flipped');
        // Phát âm khi lật sang mặt sau
        if (isFlipped) {
            const item = HiSession.getCurrentItem();
            if (item?.exerciseData?.backWord) {
                _speak(item.exerciseData.backWord);
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

        // Tạo input boxes cho từng chữ cái, thêm khoảng cách phân tách giữa các từ
        let fillIndex = 0;
        const answerParts = Array.isArray(d.answerParts) && d.answerParts.length
            ? d.answerParts
            : String(d.answer || '').trim().split(/\s+/).filter(Boolean);
        const maxPartLen = Math.max(1, ...answerParts.map(part => String(part || '').length));
        const inputsHTML = answerParts.map((part) => `
            <span class="inline-flex gap-1 sm:gap-1.5 md:gap-2 flex-nowrap justify-center max-w-full" data-fill-word>
                ${part.split('').map(() => {
                    const idx = fillIndex++;
                    return `<input type="text" maxlength="2"
                           data-fill-index="${idx}"
                           class="${CSS.fillInput}"
                           autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false"/>`;
                }).join('')}
            </span>
        `).join('<span class="w-2.5 sm:w-4 md:w-5 shrink-0" aria-hidden="true"></span>');

        const totalLetters = d.letters || answerParts.join('').length;
        const fillMaxWordLen = Math.min(Math.max(maxPartLen, 6), 18);

        _container.innerHTML = `
        <div class="w-full max-w-2xl mx-auto flex flex-col items-center gap-3 fade-in px-1 sm:px-3">
            <div class="${CSS.label}">Bài tập: Điền vào chỗ trống</div>

            <div class="${CSS.card} p-5 sm:p-7 md:p-8 flex flex-col items-center min-h-[300px] justify-between max-w-xl mx-auto w-full">

                <!-- Gợi ý nghĩa + nút phát âm -->
                <div class="text-center mb-6 w-full">
                    <div class="flex items-center justify-center gap-2 mb-3">
                        <p class="text-xs sm:text-sm text-on-surface-variant font-medium">Điền từ tiếng Anh có nghĩa:</p>
                        <button onclick="HiSessionUI._speak('${_esc(d.answer)}')"
                                title="Nghe phát âm từ cần điền"
                                class="p-1.5 rounded-full bg-surface-container-low text-primary hover:bg-primary/10 transition-colors active:scale-95 touch-manipulation">
                            <span class="material-symbols-outlined text-[18px]">volume_up</span>
                        </button>
                    </div>
                    ${d.sentence
                        ? `<p class="text-base sm:text-lg md:text-xl text-on-surface leading-relaxed mx-auto max-w-lg">
                               ${_buildSentenceHTML(d.sentence)}
                           </p>`
                        : `<p class="text-base sm:text-lg md:text-xl text-on-surface-variant leading-relaxed mx-auto max-w-lg">
                               ${_esc(d.meaningHint)}
                           </p>`
                    }

                    <!-- AI Hint button -->
                    <button onclick="HiSessionUI._getAIHint()"
                            class="mt-3 text-primary font-bold text-xs sm:text-sm flex items-center justify-center gap-1 hover:bg-primary-container/10 px-3 py-1.5 rounded-xl mx-auto w-max transition-colors active:scale-95 touch-manipulation">
                        <span class="material-symbols-outlined text-[16px]">lightbulb</span>
                        Xin gợi ý AI
                    </button>
                    <div id="ai-hint-container"
                         class="mt-3 text-xs sm:text-sm text-on-surface-variant hidden bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 w-full text-left">
                    </div>
                </div>

                <!-- Input boxes từng chữ cái (ngăn gãy dòng giữa từ) -->
                <div class="flex gap-y-3 gap-x-1.5 sm:gap-x-2 justify-center flex-wrap max-w-full items-center my-2 p-1 overflow-x-auto select-none" id="fill-boxes" style="--fill-max-word-len:${fillMaxWordLen}">
                    ${inputsHTML}
                </div>

                <!-- Ghi chú điều hướng -->
                <p class="text-[11px] text-outline text-center mt-2 mb-4">
                    Gõ ký tự sẽ tự chuyển ô • Nhấn <kbd class="px-1.5 py-0.5 rounded bg-surface-container-low font-mono text-[10px]">Backspace</kbd> để lùi
                </p>

                <!-- Nút kiểm tra -->
                <div class="w-full max-w-md">
                    <button onclick="HiSessionUI._onFillCheck()" class="${CSS.btnPrimary} flex items-center justify-center gap-2 shadow-sm">
                        <span class="material-symbols-outlined text-[18px]">check_circle</span>
                        <span>Kiểm tra</span>
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
            /_{2,}(?:\s+_{2,})*/g,
            (placeholder) => placeholder.split(/\s+/).map(part => {
                const width = Math.max(2.5, Math.min(part.length * 0.75, 7));
                return `<span class="inline-block border-b-2 border-primary mx-1 align-bottom text-transparent font-bold" style="width:${width}em">${part}</span>`;
            }).join(' ')
        );
    }

    /** Keyboard navigation mượt mà giữa các ô fill */
    function _bindFillInputs() {
        const inputs = Array.from(document.querySelectorAll('[data-fill-index]'));
        if (!inputs.length) return;

        inputs.forEach((input, idx) => {
            // Khi focus: tự bôi đen để gõ đè được ngay
            input.addEventListener('focus', () => {
                input.select();
            });

            // Khi click: cũng select
            input.addEventListener('click', () => {
                input.select();
            });

            // Auto-advance khi nhập ký tự
            input.addEventListener('input', (e) => {
                const val = input.value;
                if (!val) return;

                // Nếu paste cả chuỗi dài
                if (val.length > 1) {
                    const chars = val.toUpperCase().replace(/[^A-Z0-9]/g, '').split('');
                    if (chars.length > 1) {
                        chars.forEach((c, i) => {
                            if (inputs[idx + i]) {
                                inputs[idx + i].value = c;
                            }
                        });
                        const nextIdx = Math.min(idx + chars.length, inputs.length - 1);
                        inputs[nextIdx]?.focus();
                        inputs[nextIdx]?.select();
                        return;
                    }
                }

                // Gõ 1 ký tự: lấy ký tự vừa gõ, viết hoa
                const char = val.slice(-1).toUpperCase();
                input.value = char;

                // Tự động nhảy sang ô tiếp theo
                if (idx < inputs.length - 1) {
                    inputs[idx + 1].focus();
                    inputs[idx + 1].select();
                }
            });

            // Phím điều hướng & Backspace
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace') {
                    if (!input.value && idx > 0) {
                        // Ô hiện tại đã rỗng -> lùi về ô trước và xóa ô trước
                        e.preventDefault();
                        inputs[idx - 1].focus();
                        inputs[idx - 1].value = '';
                    } else if (input.value) {
                        // Xóa ô hiện tại
                        input.value = '';
                        e.preventDefault();
                    }
                } else if (e.key === 'ArrowLeft' && idx > 0) {
                    e.preventDefault();
                    inputs[idx - 1].focus();
                    inputs[idx - 1].select();
                } else if (e.key === 'ArrowRight' && idx < inputs.length - 1) {
                    e.preventDefault();
                    inputs[idx + 1].focus();
                    inputs[idx + 1].select();
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    _onFillCheck();
                }
            });
        });

        // Click vào vùng chứa -> auto focus ô trống đầu tiên
        const fillBoxesContainer = document.getElementById('fill-boxes');
        if (fillBoxesContainer) {
            fillBoxesContainer.addEventListener('click', (e) => {
                if (e.target.tagName !== 'INPUT') {
                    const firstEmpty = inputs.find(inp => !inp.value.trim()) || inputs[inputs.length - 1];
                    firstEmpty?.focus();
                    firstEmpty?.select();
                }
            });
        }

        // Auto-focus ô đầu tiên sau render
        setTimeout(() => {
            inputs[0]?.focus();
            inputs[0]?.select();
        }, 120);
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

    /** Xin gợi ý AI cho fill exercise — dùng Groq (groq/compound-mini) */
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
            const firstLetter  = word.trim()[0]?.toUpperCase() || '';
            const blanked      = ctx.blankedSentence || '';

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

            const res = await fetch('/api/groq', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model:       'groq/compound-mini',
                    messages:    [{ role: 'user', content: prompt }],
                    temperature: 0.3,
                    max_tokens:  250,
                }),
            });

            if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
            const json = await res.json();
            const msg  = json.choices?.[0]?.message;
            const hint = (msg?.content || msg?.reasoning || '').trim();
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
        <div class="w-full max-w-2xl mx-auto flex flex-col items-center gap-3 fade-in px-1 sm:px-3">
            <div class="${CSS.label}">Bài tập: Luyện nghe & Điền từ</div>

            <div class="${CSS.card} p-5 sm:p-7 md:p-8 flex flex-col items-center min-h-[380px] md:min-h-[420px] justify-between max-w-xl mx-auto w-full">

                <!-- Header bài nghe -->
                <div class="text-center w-full">
                    <span class="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full mb-2">
                        <span class="material-symbols-outlined text-[15px]">hearing</span>
                        Luyện phản xạ nghe
                    </span>
                    <h3 class="text-base sm:text-lg md:text-xl font-bold text-on-surface">Nghe và nhập từ bạn nghe được</h3>
                    <p class="text-xs text-on-surface-variant mt-0.5">Lắng nghe phát âm chuẩn và gõ lại chính xác từ vựng</p>
                </div>

                <!-- Trung tâm âm thanh sống động (Audio Station) -->
                <div class="my-4 flex flex-col items-center justify-center relative w-full">
                    <!-- Ripple effect rings -->
                    <div class="relative flex items-center justify-center mb-4">
                        <div id="listen-ripple" class="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-primary/15 transition-all scale-100 opacity-0 pointer-events-none"></div>

                        <!-- Main Speaker Button -->
                        <button id="listen-play-btn"
                                onclick="HiSessionUI._onListenPlay()"
                                title="Bấm để nghe phát âm chuẩn (Phím Space)"
                                class="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-primary to-primary-tint text-on-primary flex items-center justify-center shadow-[0_8px_25px_rgba(0,97,146,0.35)] hover:scale-105 active:scale-95 transition-all z-10 touch-manipulation group">
                            <span class="material-symbols-outlined text-[36px] sm:text-[44px] group-hover:scale-110 transition-transform">volume_up</span>
                        </button>
                    </div>

                    <!-- Thanh sóng âm động -->
                    <div id="listen-soundwave" class="flex items-center gap-1 h-5 mb-3 opacity-0 transition-opacity">
                        <span class="w-1 bg-primary rounded-full animate-pulse h-2.5"></span>
                        <span class="w-1 bg-primary rounded-full animate-pulse h-4.5"></span>
                        <span class="w-1 bg-primary rounded-full animate-pulse h-5"></span>
                        <span class="w-1 bg-primary rounded-full animate-pulse h-3.5"></span>
                        <span class="w-1 bg-primary rounded-full animate-pulse h-2"></span>
                    </div>

                    <!-- Cặp nút tốc độ: Chuẩn (1.0x) & Chậm (0.6x) -->
                    <div class="flex items-center justify-center gap-2 sm:gap-3 w-full max-w-xs">
                        <button onclick="HiSessionUI._onListenPlay()"
                                class="flex-1 py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation">
                            <span class="material-symbols-outlined text-[18px]">play_arrow</span>
                            <span>Chuẩn (1.0x)</span>
                        </button>
                        <button onclick="HiSessionUI._onListenSlow()"
                                class="flex-1 py-2 px-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface text-xs sm:text-sm font-bold border border-outline-variant/30 flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation">
                            <span>🐢</span>
                            <span>Chậm (0.6x)</span>
                        </button>
                    </div>

                    <!-- Phiên âm IPA & Gợi ý nghĩa -->
                    <div class="mt-2.5 flex flex-col items-center gap-1">
                        <p id="listen-phonetic" class="text-on-surface-variant font-mono text-xs sm:text-sm transition-opacity opacity-0">
                            ${d.phonetic ? `/${_esc(d.phonetic)}/` : ''}
                        </p>
                        <button id="listen-hint-toggle"
                                onclick="HiSessionUI._toggleListenHint()"
                                class="text-[11px] font-semibold text-outline hover:text-primary transition-colors flex items-center gap-1 py-0.5">
                            <span class="material-symbols-outlined text-[14px]">lightbulb</span>
                            <span>Xem gợi ý nghĩa</span>
                        </button>
                        <div id="listen-meaning-box" class="hidden text-xs text-primary font-medium bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/20 mt-1 fade-in">
                            Nghĩa: <strong>${_esc(d.meaning || '')}</strong>
                        </div>
                    </div>
                </div>

                <!-- Input nhập từ hiện đại -->
                <div class="w-full max-w-md relative mb-3">
                    <div class="relative flex items-center w-full rounded-2xl bg-surface-container-lowest border-2 border-outline-variant/30 focus-within:border-primary focus-within:shadow-md transition-all">
                        <span class="material-symbols-outlined text-outline ml-3.5 text-[20px] select-none">headphones</span>
                        <input id="listen-input"
                               type="text"
                               placeholder="Gõ từ tiếng Anh nghe được..."
                               autocomplete="off" autocorrect="off" spellcheck="false"
                               oninput="HiSessionUI._onListenInputChange(this)"
                               onkeydown="if(event.key==='Enter') HiSessionUI._onListenCheck(); if((event.ctrlKey || event.altKey) && event.code==='Space') { event.preventDefault(); HiSessionUI._onListenPlay(); }"
                               class="w-full bg-transparent px-3 py-3 sm:py-3.5 font-body-lg text-base sm:text-lg font-bold text-center text-on-surface placeholder:text-outline-variant/70 placeholder:font-normal outline-none"/>
                        <button id="listen-clear-btn"
                                onclick="HiSessionUI._clearListenInput()"
                                class="hidden p-1 mr-3 text-outline hover:text-on-surface transition-colors rounded-full">
                            <span class="material-symbols-outlined text-[18px]">cancel</span>
                        </button>
                    </div>
                    <div class="flex items-center justify-between text-[11px] text-outline px-2 mt-1.5">
                        <span>Nhấn <kbd class="px-1.5 py-0.5 rounded bg-surface-container-low font-mono text-[10px]">Enter</kbd> để nộp</span>
                        <span class="hidden sm:inline">Phím <kbd class="px-1.5 py-0.5 rounded bg-surface-container-low font-mono text-[10px]">Space</kbd> để nghe lại</span>
                    </div>
                </div>

                <!-- Nút kiểm tra -->
                <div class="w-full max-w-md">
                    <button onclick="HiSessionUI._onListenCheck()" class="${CSS.btnPrimary} flex items-center justify-center gap-2 shadow-sm">
                        <span class="material-symbols-outlined text-[18px]">check_circle</span>
                        <span>Kiểm tra đáp án</span>
                    </button>
                </div>
            </div>
        </div>`;

        // Auto-phát âm khi bài hiển thị
        setTimeout(() => _onListenPlay(), 400);
    }

    let _listenPlayCount = 0;

    function _animateSoundWave(durationMs = 1200) {
        const ripple = document.getElementById('listen-ripple');
        const wave = document.getElementById('listen-soundwave');
        if (ripple) {
            ripple.classList.remove('opacity-0', 'scale-100');
            ripple.classList.add('opacity-100', 'scale-125');
        }
        if (wave) wave.classList.remove('opacity-0');

        setTimeout(() => {
            if (ripple) {
                ripple.classList.remove('opacity-100', 'scale-125');
                ripple.classList.add('opacity-0', 'scale-100');
            }
            if (wave) wave.classList.add('opacity-0');
        }, durationMs);
    }

    function _onListenPlay() {
        const item = HiSession.getCurrentItem();
        if (!item || item.exerciseType !== 'listen') return;

        HiSession.speakWord(item.exerciseData.wordToSpeak, 0.9);
        _listenPlayCount++;
        _animateSoundWave(1200);

        // Hiện phonetic sau lần nghe đầu tiên
        if (_listenPlayCount >= 1) {
            const phoneticEl = document.getElementById('listen-phonetic');
            if (phoneticEl) phoneticEl.style.opacity = '1';
        }

        // Focus vào input sau khi phát
        setTimeout(() => document.getElementById('listen-input')?.focus(), 500);
    }

    function _onListenSlow() {
        const item = HiSession.getCurrentItem();
        if (!item) return;
        HiSession.speakWord(item.exerciseData.wordToSpeak, 0.55);
        _animateSoundWave(1800);
        setTimeout(() => document.getElementById('listen-input')?.focus(), 500);
    }

    function _toggleListenHint() {
        const box = document.getElementById('listen-meaning-box');
        if (box) box.classList.toggle('hidden');
    }

    function _onListenInputChange(input) {
        const clearBtn = document.getElementById('listen-clear-btn');
        if (clearBtn) {
            if (input.value.trim()) {
                clearBtn.classList.remove('hidden');
            } else {
                clearBtn.classList.add('hidden');
            }
        }
    }

    function _clearListenInput() {
        const input = document.getElementById('listen-input');
        if (input) {
            input.value = '';
            input.focus();
        }
        const clearBtn = document.getElementById('listen-clear-btn');
        if (clearBtn) clearBtn.classList.add('hidden');
    }

    function _onListenCheck() {
        if (_isShowingFeedback) return;
        const inputEl = document.getElementById('listen-input');
        if (!inputEl) return;

        const typed = inputEl.value.trim();
        if (!typed) {
            inputEl.classList.add('border-error');
            inputEl.placeholder = 'Hãy gõ từ bạn nghe được...';
            return;
        }

        _isShowingFeedback = true;
        _listenPlayCount   = 0;

        const result = HiSession.submitAnswer(typed);

        inputEl.disabled = true;
        if (result.correct) {
            inputEl.parentElement?.classList.add('border-green-500', 'bg-green-50/50');
            inputEl.classList.add('text-green-700');
        } else {
            inputEl.parentElement?.classList.add('border-error', 'bg-error-container/20');
            inputEl.classList.add('text-error');
            inputEl.value = result.correctAnswer;
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
        _toggleListenHint,
        _onListenInputChange,
        _clearListenInput,
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
