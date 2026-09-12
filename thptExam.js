/**
 * HiVocab - THPT Quốc Gia Computer-Based Testing Module
 * Chuẩn giao diện thi tốt nghiệp THPT trên máy tính
 * Tối ưu hóa diện tích hiển thị, thanh kéo 2 cột tùy chỉnh, giao diện câu sắp xếp và phông chữ hiện đại
 */
(function(window) {
    'use strict';

    const ThptExam = {
        exams: [],
        currentExam: null,
        currentQIndex: 0,
        userAnswers: {},       // { [qNumber]: 'A' | 'B' | 'C' | 'D' }
        flaggedQuestions: {},  // { [qNumber]: true }
        timerSeconds: 50 * 60,
        initialSeconds: 50 * 60,
        timerInterval: null,
        isReviewMode: false,
        fontSizeLevel: 0,      // -1 (nhỏ), 0 (chuẩn), 1 (lớn), 2 (rất lớn)
        selectedCustomMinutes: 50,
        results: null,
        mobileViewMode: 'both', // 'both' | 'passage' | 'questions'
        examSections: [],      // Cached passage sections for current exam
        keyboardBound: false,
        dividerBound: false,
        searchQuery: '',

        // ==========================================
        // 1. KHỞI TẠO & NẠP DỮ LIỆU
        // ==========================================
        async init() {
            try {
                if (this.exams.length === 0) {
                    const res = await fetch('/data/thpt_exams.json?v=' + Date.now());
                    if (res.ok) {
                        this.exams = await res.json();
                    }
                }
            } catch (err) {
                console.warn('Lỗi nạp thpt_exams.json:', err);
            }
            const searchInput = document.getElementById('thpt-search-input');
            const clearBtn = document.getElementById('thpt-search-clear');
            if (searchInput) {
                searchInput.value = this.searchQuery || '';
                if (clearBtn) {
                    if (this.searchQuery) clearBtn.classList.remove('hidden');
                    else clearBtn.classList.add('hidden');
                }
            }
            this.setupKeyboardNavigation();
            this.initDraggableDivider();
            this.renderExamsList();
        },

        setupKeyboardNavigation() {
            if (this.keyboardBound) return;
            this.keyboardBound = true;

            window.addEventListener('keydown', (e) => {
                const roomEl = document.getElementById('page-thpt-room');
                if (!roomEl || !roomEl.classList.contains('active')) return;

                const tag = (e.target.tagName || '').toLowerCase();
                if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

                const key = e.key;

                // Chọn đáp án bằng phím A, B, C, D hoặc 1, 2, 3, 4
                if (!this.isReviewMode) {
                    const keyUpper = key.toUpperCase();
                    if (['A', 'B', 'C', 'D'].includes(keyUpper)) {
                        e.preventDefault();
                        this.selectAnswer(this.currentQIndex + 1, keyUpper);
                        return;
                    }
                    if (['1', '2', '3', '4'].includes(key)) {
                        e.preventDefault();
                        const mapKey = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };
                        this.selectAnswer(this.currentQIndex + 1, mapKey[key]);
                        return;
                    }
                    if (key === 'f' || key === 'F') {
                        e.preventDefault();
                        this.toggleFlag(this.currentQIndex + 1);
                        return;
                    }
                }

                // Điều hướng câu hỏi
                if (key === 'ArrowRight' || key === 'Enter') {
                    e.preventDefault();
                    this.nextQuestion();
                } else if (key === 'ArrowLeft') {
                    e.preventDefault();
                    this.prevQuestion();
                }
            });
        },

        // ==========================================
        // 2. THANH NGĂN CÁCH KÉO THẢ TÙY CHỈNH (SPLIT RESIZER)
        // ==========================================
        initDraggableDivider() {
            if (this.dividerBound) return;
            const divider = document.getElementById('exam-drag-divider');
            const leftCol = document.getElementById('exam-left-col');
            const rightCol = document.getElementById('exam-right-col');
            const container = document.getElementById('exam-split-container');
            if (!divider || !leftCol || !rightCol || !container) return;

            this.dividerBound = true;

            // Load saved width ratio
            const applySavedRatio = () => {
                if (window.innerWidth >= 768) {
                    const savedPct = parseFloat(localStorage.getItem('thpt_split_left_pct') || '50');
                    if (!isNaN(savedPct) && savedPct >= 20 && savedPct <= 80) {
                        leftCol.style.width = savedPct + '%';
                        rightCol.style.width = (100 - savedPct) + '%';
                    }
                } else {
                    leftCol.style.width = '';
                    rightCol.style.width = '';
                }
            };
            applySavedRatio();
            window.addEventListener('resize', applySavedRatio);

            let isDragging = false;

            const onStart = (e) => {
                if (window.innerWidth < 768) return;
                isDragging = true;
                document.body.style.userSelect = 'none';
                document.body.style.cursor = 'col-resize';
                divider.classList.add('bg-blue-600', 'w-3');
            };

            const onMove = (e) => {
                if (!isDragging || window.innerWidth < 768) return;
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const rect = container.getBoundingClientRect();
                const newLeftWidth = clientX - rect.left;
                let pct = (newLeftWidth / rect.width) * 100;
                pct = Math.max(20, Math.min(80, pct));

                leftCol.style.width = pct + '%';
                rightCol.style.width = (100 - pct) + '%';
            };

            const onEnd = () => {
                if (!isDragging) return;
                isDragging = false;
                document.body.style.userSelect = '';
                document.body.style.cursor = '';
                divider.classList.remove('bg-blue-600', 'w-3');

                const rect = container.getBoundingClientRect();
                const leftWidth = leftCol.getBoundingClientRect().width;
                const pct = (leftWidth / rect.width) * 100;
                localStorage.setItem('thpt_split_left_pct', pct.toFixed(1));
            };

            divider.addEventListener('mousedown', onStart);
            divider.addEventListener('touchstart', onStart, { passive: true });
            window.addEventListener('mousemove', onMove);
            window.addEventListener('touchmove', onMove, { passive: true });
            window.addEventListener('mouseup', onEnd);
            window.addEventListener('touchend', onEnd);
        },

        // ==========================================
        // 3. THU GỌN / MỞ RỘNG BẢNG 40 CÂU HỎI
        // ==========================================
        togglePalette(forceState) {
            const wrapper = document.getElementById('exam-palette-wrapper');
            const toggleText = document.getElementById('exam-palette-toggle-text');
            const toggleIcon = document.getElementById('exam-palette-toggle-icon');
            if (!wrapper) return;

            const isCurrentlyCollapsed = wrapper.classList.contains('hidden');
            const shouldCollapse = (forceState !== undefined) ? !forceState : !isCurrentlyCollapsed;

            if (shouldCollapse) {
                wrapper.classList.add('hidden');
                if (toggleText) toggleText.textContent = 'Mở rộng';
                if (toggleIcon) toggleIcon.textContent = 'expand_less';
                localStorage.setItem('thpt_palette_collapsed', 'true');
            } else {
                wrapper.classList.remove('hidden');
                if (toggleText) toggleText.textContent = 'Thu gọn';
                if (toggleIcon) toggleIcon.textContent = 'expand_more';
                localStorage.setItem('thpt_palette_collapsed', 'false');
            }
        },

        restorePaletteState() {
            const isCollapsed = localStorage.getItem('thpt_palette_collapsed') === 'true';
            this.togglePalette(!isCollapsed);
        },

        // ==========================================
        // 4. RENDER THƯ VIỆN ĐỀ THI (#page-exercises) & TÌM KIẾM
        // ==========================================
        removeAccents(str) {
            return (str || '')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/đ/g, 'd')
                .replace(/Đ/g, 'D')
                .toLowerCase();
        },

        onSearchInput(value) {
            this.searchQuery = (value || '').trim();
            const clearBtn = document.getElementById('thpt-search-clear');
            if (clearBtn) {
                if (this.searchQuery) {
                    clearBtn.classList.remove('hidden');
                } else {
                    clearBtn.classList.add('hidden');
                }
            }
            this.renderExamsList();
        },

        clearSearch() {
            this.searchQuery = '';
            const input = document.getElementById('thpt-search-input');
            if (input) {
                input.value = '';
                input.focus();
            }
            const clearBtn = document.getElementById('thpt-search-clear');
            if (clearBtn) clearBtn.classList.add('hidden');
            this.renderExamsList();
        },

        renderExamsList() {
            const container = document.getElementById('thpt-exams-grid');
            if (!container) return;

            const countEl = document.getElementById('thpt-search-count');

            if (!this.exams || this.exams.length === 0) {
                if (countEl) {
                    countEl.innerHTML = `
                        <span class="material-symbols-outlined text-[16px] text-primary animate-spin">progress_activity</span>
                        <span>Đang nạp bộ đề...</span>`;
                }
                container.innerHTML = `
                    <div class="col-span-full py-16 text-center text-on-surface-variant font-sans">
                        <span class="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span>
                        <p class="mt-2 text-sm">Đang nạp bộ đề thi THPT Quốc Gia...</p>
                    </div>`;
                return;
            }

            const bestScores = this.loadAllBestScores();

            // Lọc danh sách đề thi theo từ khóa tìm kiếm (hỗ trợ tiếng Việt không dấu & có dấu)
            const q = this.removeAccents(this.searchQuery);
            const filteredExams = this.exams
                .map((exam, origIdx) => ({ exam, origIdx }))
                .filter(({ exam, origIdx }) => {
                    if (!q) return true;
                    const titleNorm = this.removeAccents(exam.title);
                    const numStr = String(origIdx + 1);
                    const deStr = `de ${numStr}`;
                    const deThiStr = `de thi so ${numStr}`;
                    const idNorm = this.removeAccents(exam.id);
                    return titleNorm.includes(q) || 
                           numStr === q || 
                           deStr.includes(q) || 
                           deThiStr.includes(q) || 
                           idNorm.includes(q);
                });

            // Cập nhật số lượng đề tìm thấy
            if (countEl) {
                if (q) {
                    countEl.innerHTML = `
                        <span class="material-symbols-outlined text-[16px] text-primary">filter_list</span>
                        <span>Tìm thấy <strong class="text-primary font-bold">${filteredExams.length}</strong> / ${this.exams.length} đề</span>`;
                } else {
                    countEl.innerHTML = `
                        <span class="material-symbols-outlined text-[16px] text-primary">description</span>
                        <span><strong>${this.exams.length}</strong> đề thi chính thức</span>`;
                }
            }

            // Giao diện khi không tìm thấy kết quả phù hợp
            if (filteredExams.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full py-14 px-6 text-center text-on-surface-variant font-sans bg-surface-container-lowest rounded-2xl border border-outline-variant/30 soft-shadow flex flex-col items-center justify-center gap-3 fade-in">
                        <div class="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-1">
                            <span class="material-symbols-outlined text-[32px]">search_off</span>
                        </div>
                        <h3 class="text-base font-bold text-on-surface">Không tìm thấy đề thi phù hợp</h3>
                        <p class="text-xs text-on-surface-variant max-w-md leading-relaxed">
                            Không có đề thi nào khớp với từ khóa "<span class="font-semibold text-on-surface">${this.escHtml(this.searchQuery)}</span>". Thử tìm kiếm theo tên trường, tỉnh/thành phố hoặc số thứ tự đề thi.
                        </p>
                        <div class="pt-2">
                            <button onclick="window.ThptExam.clearSearch()" class="px-5 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-surface-tint text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95">
                                <span class="material-symbols-outlined text-[16px]">clear_all</span>
                                <span>Xem tất cả đề thi</span>
                            </button>
                        </div>
                    </div>`;
                return;
            }

            let html = '';
            filteredExams.forEach(({ exam, origIdx }) => {
                const best = bestScores[exam.id];
                const bestBadge = best 
                    ? `<span class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                         <span class="material-symbols-outlined text-[14px]">verified</span>
                         <span>Điểm cao nhất: ${best.score}/10 (${best.correct}/40 câu)</span>
                       </span>`
                    : `<span class="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                         <span>Chưa thi</span>
                       </span>`;

                html += `
                <div class="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 soft-shadow flex flex-col justify-between gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg font-sans fade-in">
                    <div class="space-y-3">
                        <div class="flex items-start justify-between gap-2">
                            <span class="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-black tracking-wider uppercase">
                                ĐỀ THI SỐ ${origIdx + 1}
                            </span>
                            <span class="text-xs text-on-surface-variant font-semibold flex items-center gap-1">
                                <span class="material-symbols-outlined text-[16px] text-amber-500">schedule</span>
                                50 phút
                            </span>
                        </div>

                        <div>
                            <h3 class="font-bold text-base text-on-surface line-clamp-2 leading-snug">
                                ${this.escHtml(exam.title)}
                            </h3>
                            <p class="text-xs text-on-surface-variant mt-1">
                                Chuẩn cấu trúc ma trận 40 câu hỏi trắc nghiệm kèm giải thích chi tiết.
                            </p>
                        </div>

                        <div>${bestBadge}</div>
                    </div>

                    <div class="pt-2 border-t border-outline-variant/20 flex items-center gap-2">
                        <button onclick="window.ThptExam.startExam('${exam.id}', 50)" 
                                class="flex-1 py-2.5 px-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95">
                            <span class="material-symbols-outlined text-[16px]">play_arrow</span>
                            <span>Vào thi (50p)</span>
                        </button>
                        <button onclick="window.ThptExam.openCustomTimeModal('${exam.id}')" 
                                class="p-2.5 rounded-xl border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer active:scale-95"
                                title="Tùy chỉnh thời gian thi">
                            <span class="material-symbols-outlined text-[18px]">more_time</span>
                        </button>
                    </div>
                </div>`;
            });

            container.innerHTML = html;
        },

        // ==========================================
        // 5. BẮT ĐẦU THI & VÀO PHÒNG THI
        // ==========================================
        startExam(examId, minutes = 50) {
            const exam = this.exams.find(e => e.id === examId);
            if (!exam) {
                alert('Không tìm thấy thông tin đề thi này.');
                return;
            }

            if (window.innerWidth < 768) {
                const proceed = confirm('Giao diện thi thử trắc nghiệm máy tính (CBT) được thiết kế tối ưu cho máy tính / laptop hoặc màn hình lớn.\n\nBạn có muốn tiếp tục làm bài trên điện thoại không?');
                if (!proceed) return;
            }

            this.currentExam = exam;
            this.currentQIndex = 0;
            this.isReviewMode = false;
            this.results = null;

            // Load saved progress or initialize
            const saved = this.loadSavedProgress(examId);
            if (saved && !saved.submitted) {
                this.userAnswers = saved.answers || {};
                this.flaggedQuestions = saved.flags || {};
                this.timerSeconds = saved.timeRemaining != null ? saved.timeRemaining : minutes * 60;
                this.initialSeconds = saved.initialSeconds || (minutes * 60);
            } else {
                this.userAnswers = {};
                this.flaggedQuestions = {};
                this.initialSeconds = minutes > 0 ? minutes * 60 : 0;
                this.timerSeconds = this.initialSeconds;
            }

            // 1. Start Timer
            try {
                this.startTimer();
            } catch (err) {
                console.error('[ThptExam] startTimer error:', err);
            }

            // 2. Setup Candidate details
            try {
                this.setupCandidateInfo();
            } catch (err) {
                console.error('[ThptExam] setupCandidateInfo error:', err);
            }

            // 3. Switch to Room View
            try {
                this.showRoomView();
            } catch (err) {
                console.error('[ThptExam] showRoomView error:', err);
                const roomEl = document.getElementById('page-thpt-room');
                if (roomEl) roomEl.classList.add('active');
            }

            // 4. Render Passages (All sections continuous scroll)
            try {
                this.renderAllPassages();
            } catch (err) {
                console.error('[ThptExam] renderAllPassages error:', err);
            }

            // 5. Render Questions & Palette
            try {
                this.renderQuestionsAndPalette();
            } catch (err) {
                console.error('[ThptExam] renderQuestionsAndPalette error:', err);
            }

            // 6. Init Draggable Split Resizer & Restore Palette state
            try {
                this.initDraggableDivider();
            } catch (err) {
                console.error('[ThptExam] initDraggableDivider error:', err);
            }
            try {
                this.restorePaletteState();
            } catch (err) {}

            // 7. Reset mobile view
            try {
                this.setMobileView('both');
            } catch (err) {}

            // 8. Jump to first question
            try {
                this.jumpToQuestion(1);
            } catch (err) {
                console.error('[ThptExam] jumpToQuestion error:', err);
            }
        },

        setupCandidateInfo() {
            const nameEl = document.getElementById('exam-candidate-name');
            const sbdEl = document.getElementById('exam-candidate-sbd');
            const dateEl = document.getElementById('exam-date');

            if (nameEl) {
                const user = window.currentUser || {};
                nameEl.textContent = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Thí sinh HiVocab';
            }
            if (sbdEl) {
                const randSbd = 'SBD: ' + String(Math.floor(10000000 + Math.random() * 90000000));
                sbdEl.textContent = randSbd;
            }
            if (dateEl) {
                const now = new Date();
                dateEl.textContent = `Ngày thi: ${now.toLocaleDateString('vi-VN')}`;
            }
        },

        showRoomView() {
            try {
                if (window.navigateTo) {
                    window.navigateTo('thpt-room', true);
                } else {
                    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
                    const roomEl = document.getElementById('page-thpt-room');
                    if (roomEl) roomEl.classList.add('active');
                }
            } catch (err) {
                console.warn('[ThptExam] showRoomView navigateTo error, fallback to direct class manipulation:', err);
                document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
                const roomEl = document.getElementById('page-thpt-room');
                if (roomEl) roomEl.classList.add('active');
            }

            // Hide main sidebar and mobile header
            const sidebar = document.getElementById('main-sidebar');
            if (sidebar) sidebar.style.display = 'none';
            const mobileHeader = document.getElementById('main-mobile-header');
            if (mobileHeader) mobileHeader.style.display = 'none';
            const mobileNav = document.getElementById('mobile-bottom-nav');
            if (mobileNav) mobileNav.style.display = 'none';

            window.scrollTo(0, 0);

            // Re-apply split ratio on show
            setTimeout(() => {
                const savedPct = parseFloat(localStorage.getItem('thpt_split_left_pct') || '50');
                const leftCol = document.getElementById('exam-left-col');
                const rightCol = document.getElementById('exam-right-col');
                if (leftCol && rightCol && window.innerWidth >= 768 && !isNaN(savedPct)) {
                    leftCol.style.width = savedPct + '%';
                    rightCol.style.width = (100 - savedPct) + '%';
                }
            }, 50);
        },

        exitRoom() {
            if (!this.isReviewMode) {
                if (!confirm('Bạn có chắc chắn muốn rời phòng thi? Bài làm của bạn đã được tự động lưu tạm.')) {
                    return;
                }
            }
            this.stopTimer();
            if (window.navigateTo) {
                window.navigateTo('exercises');
            } else {
                window.location.hash = 'exercises';
                window.location.reload();
            }
        },

        // ==========================================
        // 6. TIMER LOGIC
        // ==========================================
        startTimer() {
            this.stopTimer();
            this.updateTimerDisplay();

            if (this.initialSeconds === 0) {
                return;
            }

            this.timerInterval = setInterval(() => {
                if (this.timerSeconds > 0) {
                    this.timerSeconds--;
                    this.updateTimerDisplay();
                    if (this.timerSeconds % 15 === 0) {
                        this.saveProgress(false);
                    }
                } else {
                    this.stopTimer();
                    alert('Hết giờ làm bài! Hệ thống đang tự động nộp bài thi của bạn.');
                    this.submitExam(true);
                }
            }, 1000);
        },

        stopTimer() {
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
            }
        },

        updateTimerDisplay() {
            const display = document.getElementById('exam-timer-display');
            if (!display) return;

            if (this.initialSeconds === 0) {
                display.textContent = 'Không giới hạn';
                return;
            }

            const m = Math.floor(this.timerSeconds / 60);
            const s = this.timerSeconds % 60;
            const str = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            display.textContent = str;

            if (this.timerSeconds <= 300) {
                display.parentElement.classList.add('text-rose-400', 'animate-pulse');
            } else {
                display.parentElement.classList.remove('text-rose-400', 'animate-pulse');
            }
        },

        // ==========================================
        // 7. TOÀN BỘ BÀI ĐỌC (CỘT TRÁI - CUỘN TỰ DO & CÂU SẮP XẾP)
        // ==========================================
        buildExamSections() {
            if (!this.currentExam) return [];
            if (this.currentExam.sections && this.currentExam.sections.length > 0) {
                this.examSections = this.currentExam.sections.map((s, idx) => ({
                    index: s.part || (idx + 1),
                    part: s.part || (idx + 1),
                    type: s.type || 'reading',
                    group: s.name || `Phần ${idx + 1}`,
                    name: s.name || `Phần ${idx + 1}`,
                    startQ: s.start_q,
                    endQ: s.end_q,
                    instruction: s.instruction || '',
                    title: s.title || '',
                    paragraphs: s.paragraphs || [],
                    rawText: s.raw_text || ''
                }));
                return this.examSections;
            }

            const sections = [];
            let currentSec = null;
            this.currentExam.questions.forEach((q) => {
                const grpName = q.group || 'Ngữ Liệu Đề Thi';
                if (!currentSec || currentSec.group !== grpName) {
                    currentSec = {
                        index: sections.length + 1,
                        group: grpName,
                        name: grpName,
                        startQ: q.number,
                        endQ: q.number,
                        questions: [q.number]
                    };
                    sections.push(currentSec);
                } else {
                    currentSec.endQ = q.number;
                    currentSec.questions.push(q.number);
                }
            });
            this.examSections = sections;
            return sections;
        },

        parseArrangementSentences(raw) {
            if (!raw) return [];
            const regex = /(?:^|\n)\s*([a-f])\.\s*([\s\S]*?)(?=(?:\n\s*[a-f]\.|\s*$))/gi;
            const items = [];
            let match;
            while ((match = regex.exec(raw)) !== null) {
                items.push({
                    letter: match[1].toLowerCase(),
                    text: match[2].trim()
                });
            }
            return items;
        },

        formatBlanksInHtml(text, startQ, endQ) {
            if (!text) return '';
            let escaped = this.escHtml(text);

            // 1. Format Markdown bold (**word**) -> authentic bold target word with amber accent
            escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<strong class="thpt-bold-word font-bold text-slate-900 bg-amber-100/70 border-b-2 border-amber-500 px-1 py-0.5 rounded-xs shadow-2xs">$1</strong>');

            // 2. Format authentic underlined target sentence ({{U}}sentence{{/U}}) with blue accent
            escaped = escaped.replace(/\{\{U\}\}(.+?)\{\{\/U\}\}/g, '<u class="thpt-underlined-sentence underline decoration-blue-600 decoration-2 underline-offset-4 font-semibold text-slate-900 bg-blue-50/70 px-1 py-0.5 rounded-xs">$1</u>');

            // 3. Format [I], [II], [III], [IV], [V] insertion markers
            escaped = escaped.replace(/\[(I{1,3}|IV|V)\]/g, '<span class="inline-flex items-center justify-center min-w-[22px] h-5 px-1 rounded bg-slate-200 text-slate-800 font-black text-[11px] mx-1 select-none border border-slate-300 shadow-2xs">[$1]</span>');

            // 4. Replace blanks: (18), (18) _____, _____ (18) _____, (18) ...
            escaped = escaped.replace(/(?:\b|\()([1-9]|[1-3][0-9]|40)\)?(?:\s*_{2,}|\s*\.{3,})|(?:\b|\()([1-9]|[1-3][0-9]|40)\)/g, (match, p1, p2) => {
                const num = parseInt(p1 || p2, 10);
                if (num >= (startQ || 1) && num <= (endQ || 40)) {
                    return `<button type="button" onclick="window.ThptExam.jumpToQuestion(${num})" class="inline-flex items-center justify-center px-2 py-0.5 mx-1 rounded-md bg-blue-100 hover:bg-blue-200 border border-blue-300 text-blue-800 font-mono font-bold text-xs shadow-2xs cursor-pointer transition-all">(${num}) _______</button>`;
                }
                return match;
            });
            return escaped;
        },

        renderAllPassages() {
            const contentPane = document.getElementById('exam-passage-content');
            const navPillsPane = document.getElementById('exam-passage-nav-pills');
            if (!contentPane || !this.currentExam) return;

            const sections = this.buildExamSections();

            // 1. Render Nav Pills
            if (navPillsPane) {
                let pillsHtml = '';
                sections.forEach((sec) => {
                    const shortName = `P.${sec.index} (${sec.startQ}-${sec.endQ})`;
                    pillsHtml += `
                    <button type="button" onclick="window.ThptExam.jumpToPassageSection(${sec.index})" 
                            id="passage-pill-${sec.index}"
                            class="passage-pill-btn px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-all border border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-700 cursor-pointer shrink-0 font-sans"
                            title="${this.escAttr(sec.name || sec.group)}">
                        ${shortName}
                    </button>`;
                });
                navPillsPane.innerHTML = pillsHtml;
            }

            // 2. Render Full Continuous Passages
            let contentHtml = '';
            sections.forEach((sec) => {
                const secQuestions = this.currentExam.questions.filter(q => q.number >= sec.startQ && q.number <= sec.endQ);
                const isArrangementSec = (sec.type === 'arrangement') || secQuestions.some(q => q.is_arrangement);

                if (isArrangementSec) {
                    // Dedicated Sentence Arrangement Section
                    let arrCardsHtml = '';
                    secQuestions.forEach(q => {
                        const sentences = (q.arrangement_sentences && q.arrangement_sentences.length > 0)
                            ? q.arrangement_sentences 
                            : this.parseArrangementSentences(q.prompt);

                        let sHtml = '';
                        (sentences || []).forEach(item => {
                            let letter = '';
                            let text = '';
                            if (item && typeof item === 'object') {
                                letter = item.letter || '';
                                text = item.text || '';
                            } else if (typeof item === 'string') {
                                text = item;
                            }
                            letter = String(letter || '').trim();
                            text = String(text || '').trim();
                            if (!text) return;

                            sHtml += `
                            <div class="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/90 hover:bg-blue-50/50 hover:border-blue-300 transition-colors">
                                <span class="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                                    ${this.escHtml(letter)}
                                </span>
                                <div class="text-slate-800 text-sm leading-relaxed q-text-size select-text font-sans flex-1">
                                    ${this.escHtml(text)}
                                </div>
                            </div>`;
                        });

                        arrCardsHtml += `
                        <div id="passage-q-${q.number}" 
                             class="passage-q-arr-card p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3 transition-all duration-300">
                            <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                                <div class="flex items-center gap-2">
                                    <span class="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 font-black text-xs flex items-center justify-center shrink-0">
                                        ${q.number}
                                    </span>
                                    <span class="font-bold text-xs uppercase tracking-wide text-slate-700 font-sans">
                                        Câu ${q.number}: Ngữ liệu sắp xếp
                                    </span>
                                </div>
                                <span class="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 font-sans">
                                    Sắp xếp logic
                                </span>
                            </div>

                            ${q.arrangement_context ? `<div class="font-bold text-slate-800 italic text-sm pb-1">${this.escHtml(q.arrangement_context)}</div>` : ''}

                            <div class="space-y-2">
                                ${sHtml}
                            </div>
                        </div>`;
                    });

                    contentHtml += `
                    <div id="passage-sec-${sec.index}" class="passage-sec-card p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4 transition-all duration-300 font-sans">
                        <div class="flex items-center justify-between pb-2.5 border-b border-slate-100 gap-2">
                            <div class="flex items-center gap-2 min-w-0">
                                <span class="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 font-black text-xs flex items-center justify-center shrink-0">
                                    ${sec.index}
                                </span>
                                <h3 class="font-bold text-xs uppercase tracking-wide text-slate-800 truncate">
                                    ${this.escHtml(sec.name || sec.group)}
                                </h3>
                            </div>
                            <span class="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 shrink-0">
                                Câu ${sec.startQ} - ${sec.endQ}
                            </span>
                        </div>

                        ${sec.instruction ? `
                        <div class="text-xs text-slate-500 font-medium italic pb-1 font-serif leading-relaxed">
                            ${this.escHtml(sec.instruction)}
                        </div>` : ''}

                        <div class="space-y-3">
                            ${arrCardsHtml}
                        </div>
                    </div>`;
                } else {
                    // Authentic Reading / Leaflet / Cloze Passage
                    let parasHtml = '';
                    const isReadingComprehension = (sec.type === 'reading') && Array.isArray(sec.paragraphs) && sec.paragraphs.length > 1;

                    if (sec.paragraphs && Array.isArray(sec.paragraphs) && sec.paragraphs.length > 0) {
                        sec.paragraphs.forEach((rawP, pIdx) => {
                            const p = (typeof rawP === 'string' ? rawP : String(rawP || '')).trim();
                            if (!p) return;
                            const isBullet = p.startsWith('•') || p.startsWith('- ') || /^[1-6]\.\s+/.test(p);
                            const isHeader = !isBullet && p.length < 50 && (p.endsWith(':') || p === p.toUpperCase());

                            if (isBullet) {
                                parasHtml += `
                                <div class="flex items-start gap-2.5 text-sm text-slate-800 my-2 pl-2 leading-relaxed font-sans">
                                    <span class="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-2"></span>
                                    <div class="flex-1">${this.formatBlanksInHtml(p.replace(/^[•\-\*]\s*|^[1-6]\.\s*/, ''), sec.startQ, sec.endQ)}</div>
                                </div>`;
                            } else if (isReadingComprehension && !isHeader) {
                                parasHtml += `
                                <div class="reading-para-block my-3 p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-blue-50/30 transition-colors">
                                    <div class="flex items-center gap-1.5 mb-1.5 select-none">
                                        <span class="inline-flex items-center text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100/80 border border-blue-200 px-2 py-0.5 rounded-md">
                                            Đoạn ${pIdx + 1}
                                        </span>
                                    </div>
                                    <p class="text-justify text-sm text-slate-800 leading-relaxed select-text font-sans">
                                        ${this.formatBlanksInHtml(p, sec.startQ, sec.endQ)}
                                    </p>
                                </div>`;
                            } else {
                                parasHtml += `
                                <p class="text-justify text-sm text-slate-800 leading-relaxed indent-6 my-2.5 font-sans">
                                    ${this.formatBlanksInHtml(p, sec.startQ, sec.endQ)}
                                </p>`;
                            }
                        });
                    } else if (sec.rawText) {
                        parasHtml = `
                        <div class="text-slate-800 leading-relaxed font-sans text-sm q-text-size select-text whitespace-pre-line space-y-2">
                            ${this.formatBlanksInHtml(sec.rawText, sec.startQ, sec.endQ)}
                        </div>`;
                    } else if (secQuestions.length > 0 && secQuestions[0].passage) {
                        parasHtml = `
                        <div class="text-slate-800 leading-relaxed font-sans text-sm q-text-size select-text whitespace-pre-line space-y-2">
                            ${this.formatBlanksInHtml(secQuestions[0].passage, sec.startQ, sec.endQ)}
                        </div>`;
                    } else {
                        parasHtml = '<p class="text-xs text-slate-500 italic">Phần này bao gồm các câu hỏi độc lập (xem chi tiết ở cột bên phải).</p>';
                    }

                    contentHtml += `
                    <div id="passage-sec-${sec.index}" 
                         class="passage-sec-card p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 transition-all duration-300 font-sans">
                        <div class="flex items-center justify-between pb-2.5 border-b border-slate-100 gap-2">
                            <div class="flex items-center gap-2 min-w-0">
                                <span class="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 font-black text-xs flex items-center justify-center shrink-0">
                                    ${sec.index}
                                </span>
                                <h3 class="font-bold text-xs uppercase tracking-wide text-slate-800 truncate">
                                    ${this.escHtml(sec.name || sec.group)}
                                </h3>
                            </div>
                            <span class="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 shrink-0">
                                Câu ${sec.startQ} - ${sec.endQ}
                            </span>
                        </div>

                        ${sec.instruction ? `
                        <div class="italic text-slate-600 text-xs mb-2 font-serif leading-relaxed border-l-2 border-blue-400 pl-2.5 py-0.5 bg-blue-50/40 rounded-r">
                            ${this.escHtml(sec.instruction)}
                        </div>` : ''}

                        ${sec.title ? `
                        <h4 class="text-center font-black text-sm uppercase tracking-wider text-slate-900 my-3 pb-1 border-b border-slate-100">
                            ${this.escHtml(sec.title)}
                        </h4>` : ''}

                        <!-- Real Exam Paper Typography -->
                        <div class="text-slate-800 leading-relaxed font-sans text-sm q-text-size select-text space-y-1">
                            ${parasHtml}
                        </div>
                    </div>`;
                }
            });

            contentPane.innerHTML = contentHtml;
        },

        highlightPassagePill(secIndex) {
            document.querySelectorAll('.passage-pill-btn').forEach(btn => {
                btn.className = 'passage-pill-btn px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-all border border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-700 cursor-pointer shrink-0 font-sans';
            });
            const activePill = document.getElementById(`passage-pill-${secIndex}`);
            if (activePill) {
                activePill.className = 'passage-pill-btn px-2.5 py-1 rounded-md text-[11px] font-black whitespace-nowrap transition-all border border-blue-600 bg-blue-600 text-white shadow-xs cursor-pointer shrink-0 font-sans';
            }
        },

        jumpToPassageSection(secIndex) {
            const card = document.getElementById(`passage-sec-${secIndex}`);
            if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            this.highlightPassagePill(secIndex);

            document.querySelectorAll('.passage-sec-card, .passage-q-arr-card').forEach(c => {
                c.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50/15', 'shadow-md');
            });
            if (card) {
                card.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50/15', 'shadow-md');
            }
        },

        syncPassageAndScroll(qNum) {
            if (!this.currentExam) return;
            const q = this.currentExam.questions[qNum - 1];

            document.querySelectorAll('.passage-sec-card, .passage-q-arr-card').forEach(c => {
                c.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50/15', 'shadow-md');
            });

            if (q && q.is_arrangement) {
                const arrCard = document.getElementById(`passage-q-${qNum}`);
                if (arrCard) {
                    arrCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    arrCard.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50/15', 'shadow-md');
                }
                if (this.examSections) {
                    const targetSec = this.examSections.find(s => qNum >= s.startQ && qNum <= s.endQ);
                    if (targetSec) {
                        this.highlightPassagePill(targetSec.index);
                    }
                }
            } else {
                if (!this.examSections || this.examSections.length === 0) return;
                const targetSec = this.examSections.find(s => qNum >= s.startQ && qNum <= s.endQ);
                if (targetSec) {
                    this.jumpToPassageSection(targetSec.index);
                }
            }
        },

        // ==========================================
        // 8. HIGHLIGHT TỪ/CỤM TỪ TRONG PASSAGE
        // ==========================================

        /**
         * Parse a question prompt to extract word/phrase to highlight in passage.
         * Handles patterns like:
         *   "The word "blocked" in paragraph 2..."
         *   "The phrase 'at risk' in paragraph 1..."
         *   "The underlined word "schedule"..."
         *   "The italicized word/phrase..."
         * Returns: { word: string, paraIndex: number|null } or null
         */
        extractHighlightTarget(prompt) {
            if (!prompt) return null;

            // Try to get paragraph number
            const paraPat = /in\s+paragraph\s+(\d+)/i;
            const mPara = paraPat.exec(prompt);
            const paraIndex = mPara ? (parseInt(mPara[1], 10) - 1) : null; // 0-based

            // 1. Check for word/phrase pattern
            const wordPat = /(?:the|what\s+does\s+the)\s+(?:underlined\s+|italicized\s+|bold(?:ed)?\s+)?(?:word|phrase|expression|term)\s+[\u201c\u201d\u2018\u2019"']([^\u201c\u201d\u2018\u2019"'\n]{1,80})[\u201c\u201d\u2018\u2019"']/i;
            const mWord = wordPat.exec(prompt);
            if (mWord) {
                return { type: 'word', word: mWord[1].trim(), paraIndex };
            }

            // 2. Check for underlined sentence pattern
            const sentPat = /(?:underlined\s+sentence|câu\s+(?:được\s+)?gạch\s+chân)/i;
            if (sentPat.test(prompt)) {
                return { type: 'sentence', paraIndex };
            }

            return null;
        },

        /**
         * Clear any existing word/sentence highlights in the passage pane.
         */
        clearWordHighlights() {
            document.querySelectorAll('.thpt-word-highlight').forEach(el => {
                if (el.tagName === 'MARK') {
                    const parent = el.parentNode;
                    if (parent) {
                        parent.replaceChild(document.createTextNode(el.textContent), el);
                        parent.normalize();
                    }
                } else {
                    el.classList.remove('thpt-word-highlight');
                }
            });
        },

        /**
         * Highlight a word/phrase within passage paragraphs.
         * If paraIndex is given, only highlight in that paragraph block.
         * Returns true if at least one match was found.
         */
        applyWordHighlight(word, paraIndex) {
            this.clearWordHighlights();
            if (!word) return false;

            const pane = document.getElementById('exam-passage-content');
            if (!pane) return false;

            let targetContainers = [];
            if (paraIndex !== null && paraIndex >= 0) {
                const paraBlocks = pane.querySelectorAll('.reading-para-block');
                if (paraBlocks.length > paraIndex) {
                    targetContainers = [paraBlocks[paraIndex]];
                }
            }

            if (targetContainers.length === 0) {
                targetContainers = Array.from(pane.querySelectorAll('.reading-para-block p, .reading-para-block, p.text-justify, .passage-sec-card p'));
            }

            if (targetContainers.length === 0) {
                targetContainers = [pane];
            }

            const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const wordRegex = new RegExp(`\\b(${escapedWord})\\b`, 'gi');

            let found = false;
            let firstMatch = null;

            targetContainers.forEach(container => {
                const walker = document.createTreeWalker(
                    container,
                    NodeFilter.SHOW_TEXT,
                    {
                        acceptNode(node) {
                            if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
                            let parent = node.parentNode;
                            while (parent && parent !== container) {
                                if (parent.tagName === 'BUTTON' || parent.classList.contains('thpt-word-highlight')) {
                                    return NodeFilter.FILTER_REJECT;
                                }
                                parent = parent.parentNode;
                            }
                            return NodeFilter.FILTER_ACCEPT;
                        }
                    }
                );

                const textNodes = [];
                let currentNode;
                while ((currentNode = walker.nextNode())) {
                    textNodes.push(currentNode);
                }

                textNodes.forEach(textNode => {
                    const text = textNode.nodeValue;
                    if (!wordRegex.test(text)) return;

                    const frag = document.createDocumentFragment();
                    let lastIdx = 0;
                    let match;
                    wordRegex.lastIndex = 0;
                    while ((match = wordRegex.exec(text)) !== null) {
                        if (match.index > lastIdx) {
                            frag.appendChild(document.createTextNode(text.slice(lastIdx, match.index)));
                        }
                        const mark = document.createElement('mark');
                        mark.className = 'thpt-word-highlight';
                        mark.textContent = match[1];
                        frag.appendChild(mark);
                        if (!firstMatch) firstMatch = mark;
                        found = true;
                        lastIdx = wordRegex.lastIndex;
                    }
                    if (lastIdx < text.length) {
                        frag.appendChild(document.createTextNode(text.slice(lastIdx)));
                    }
                    textNode.parentNode.replaceChild(frag, textNode);
                });
            });

            if (firstMatch) {
                firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            return found;
        },

        /**
         * Apply highlight for current question if it has a word-reference or sentence-reference prompt.
         */
        applyCurrentQuestionHighlight(qNum) {
            if (!this.currentExam) return;
            const q = this.currentExam.questions[qNum - 1];
            if (!q || q.is_arrangement) {
                this.clearWordHighlights();
                return;
            }

            const target = this.extractHighlightTarget(q.prompt || '');
            if (!target) {
                this.clearWordHighlights();
                return;
            }

            if (target.type === 'word') {
                this.applyWordHighlight(target.word, target.paraIndex);
            } else if (target.type === 'sentence') {
                this.clearWordHighlights();
                const pane = document.getElementById('exam-passage-content');
                if (!pane) return;

                let el = null;
                if (target.paraIndex !== null && target.paraIndex >= 0) {
                    const paraBlocks = pane.querySelectorAll('.reading-para-block');
                    if (paraBlocks.length > target.paraIndex) {
                        el = paraBlocks[target.paraIndex].querySelector('.thpt-underlined-sentence') ||
                             paraBlocks[target.paraIndex].querySelector('u');
                    }
                }
                if (!el) {
                    el = pane.querySelector('.thpt-underlined-sentence') || pane.querySelector('u');
                }

                if (el) {
                    el.classList.add('thpt-word-highlight');
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        },

        // ==========================================
        // 8b. RENDER CÂU HỎI & CHỌN ĐÁP ÁN
        // ==========================================
        renderQuestionsAndPalette() {
            if (!this.currentExam) return;
            this.renderPalette();
            this.renderQuestionsList();
            this.updateProgressCounter();
        },

        renderPalette() {
            const palette = document.getElementById('exam-palette-container');
            if (!palette || !this.currentExam) return;

            let html = '';
            for (let i = 1; i <= this.currentExam.total_questions; i++) {
                const isAnswered = !!this.userAnswers[i];
                const isFlagged = !!this.flaggedQuestions[i];
                const isCurrent = (i === this.currentQIndex + 1);

                let cls = 'thpt-pal-btn';

                if (this.isReviewMode && this.results) {
                    const isCorrect = this.results.details[i]?.isCorrect;
                    cls += isCorrect ? ' correct' : ' wrong';
                } else {
                    if (isAnswered) {
                        cls += ' answered';
                    }
                }

                if (isCurrent) {
                    cls += ' current';
                }

                const flagDot = isFlagged && !this.isReviewMode 
                    ? '<span class="thpt-flag-dot"></span>' 
                    : '';

                html += `<button type="button" id="palette-btn-${i}" onclick="window.ThptExam.jumpToQuestion(${i})" class="${cls}" title="Câu ${i}">${i}${flagDot}</button>`;
            }

            palette.innerHTML = html;
        },

        renderQuestionsList() {
            const container = document.getElementById('exam-questions-list');
            if (!container || !this.currentExam) return;

            // Attach event delegation listener once for rock-solid answer selection
            if (!this.listListenerAttached) {
                this.listListenerAttached = true;
                container.addEventListener('click', (e) => {
                    if (this.isReviewMode) return;
                    const btn = e.target.closest('.opt-btn');
                    if (btn) {
                        const qNum = parseInt(btn.getAttribute('data-q'), 10);
                        const optLetter = btn.getAttribute('data-opt');
                        if (qNum && optLetter) {
                            this.selectAnswer(qNum, optLetter);
                        }
                    }
                });
            }

            let html = '';
            this.currentExam.questions.forEach((q, idx) => {
                const qNum = q.number;
                const isFlagged = !!this.flaggedQuestions[qNum];
                const selectedOpt = this.userAnswers[qNum] || '';
                const isCurrent = (idx === this.currentQIndex);

                let promptHtml = '';
                if (q.is_arrangement) {
                    const lettersStr = (q.arrangement_sentences && q.arrangement_sentences.length > 0)
                        ? q.arrangement_sentences.map(s => s.letter).join(', ')
                        : 'a, b, c, d, e';
                    promptHtml = `
                    <div class="space-y-1.5 font-sans">
                        <div class="font-bold text-sm text-slate-900 leading-relaxed q-text-size">
                            <strong>Question ${qNum}.</strong> Chọn phương án sắp xếp các câu ở cột bên trái theo đúng trật tự logic để tạo thành văn bản hoàn chỉnh:
                        </div>
                        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
                            <span class="material-symbols-outlined text-[14px]">west</span>
                            <span>Xem các câu <strong>(${lettersStr})</strong> ở cột bên trái</span>
                        </div>
                    </div>`;
                } else {
                    promptHtml = `
                    <div class="font-bold text-sm text-slate-900 leading-relaxed font-sans q-text-size">
                        <strong>Question ${qNum}.</strong> ${this.escHtml(q.prompt)}
                    </div>`;
                }

                html += `
                <div id="q-card-${qNum}" class="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4 transition-all font-sans ${isCurrent ? 'ring-2 ring-blue-500/40' : ''}">
                    <div class="flex items-start justify-between gap-3">
                        <div class="flex items-center gap-2 min-w-0">
                            <span class="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">
                                ${qNum}
                            </span>
                            <span class="font-bold text-xs uppercase tracking-wider text-slate-500 truncate">
                                ${this.escHtml(q.group)}
                            </span>
                        </div>
                        <div class="flex items-center gap-1 shrink-0">
                        <button type="button" onclick="window.ThptExam.reportAnswer(${qNum})" 
                                class="p-1.5 rounded-lg transition-colors cursor-pointer text-slate-300 hover:text-rose-500 hover:bg-rose-50" 
                                title="Báo lỗi đáp án">
                            <span class="material-symbols-outlined text-[16px]">report</span>
                        </button>
                        <button type="button" onclick="window.ThptExam.toggleFlag(${qNum})" 
                                class="p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${isFlagged ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:text-slate-600'}" 
                                title="Đánh dấu câu hỏi cần xem lại">
                            <span class="material-symbols-outlined text-[18px]">${isFlagged ? 'flag' : 'outlined_flag'}</span>
                        </button>
                        </div>
                    </div>

                    <!-- Prompt -->
                    ${promptHtml}

                    <!-- Options Container with explicit ID -->
                    <div id="q-options-${qNum}" class="space-y-2.5 pt-1">
                        ${this.renderOptionsHtml(q, selectedOpt)}
                    </div>

                    <!-- Review Mode: Solution box -->
                    ${this.isReviewMode ? this.renderSolutionBox(q) : ''}
                </div>`;
            });

            container.innerHTML = html;
        },

        renderOptionsHtml(q, selectedOpt) {
            const letters = ['A', 'B', 'C', 'D'];
            let html = '';

            letters.forEach(letter => {
                const optText = q.options[letter] || '';
                const isSelected = (selectedOpt === letter);
                const isCorrect = (q.correct_answer === letter);

                let optClass = 'opt-btn';
                let radioCircle = '';

                if (this.isReviewMode) {
                    if (isCorrect) {
                        optClass += ' opt-correct';
                        radioCircle = `<span class="opt-circle"><span class="material-symbols-outlined text-white text-[13px] font-black">check</span></span>`;
                    } else if (isSelected && !isCorrect) {
                        optClass += ' opt-wrong';
                        radioCircle = `<span class="opt-circle"><span class="material-symbols-outlined text-white text-[13px] font-black">close</span></span>`;
                    } else {
                        optClass += ' opacity-50';
                        radioCircle = `<span class="opt-circle"></span>`;
                    }
                } else {
                    if (isSelected) {
                        optClass += ' opt-selected';
                        radioCircle = `<span class="opt-circle"><span class="opt-circle-dot"></span></span>`;
                    } else {
                        radioCircle = `<span class="opt-circle"></span>`;
                    }
                }

                const clickAction = !this.isReviewMode 
                    ? `onclick="window.ThptExam.selectAnswer(${q.number}, '${letter}')"` 
                    : '';

                html += `
                <button type="button" 
                        id="opt-${q.number}-${letter}"
                        ${clickAction}
                        data-q="${q.number}" 
                        data-opt="${letter}"
                        class="${optClass}">
                    <input type="radio" class="sr-only pointer-events-none" name="radio_q_${q.number}" value="${letter}" ${isSelected ? 'checked' : ''} />
                    ${radioCircle}
                    <div class="flex-1 q-text-size pointer-events-none">
                        <span class="font-bold mr-1 text-slate-900">${letter}.</span>
                        <span>${this.escHtml(optText)}</span>
                    </div>
                </button>`;
            });

            return html;
        },

        renderSolutionBox(q) {
            const sol = q.explanation || 'Không có giải thích bổ sung.';
            return `
            <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 mt-3 text-xs fade-in font-sans">
                <div class="flex items-center justify-between font-bold text-slate-800 border-b border-slate-200/80 pb-2">
                    <span class="flex items-center gap-1.5 text-emerald-700">
                        <span class="material-symbols-outlined text-[18px]">verified</span>
                        <span>Đáp án chuẩn: ${q.correct_answer}</span>
                    </span>
                    <span class="text-[11px] text-slate-500">Hướng dẫn giải chi tiết</span>
                </div>
                <div class="text-slate-700 leading-relaxed whitespace-pre-line font-normal q-text-size">
                    ${this.escHtml(sol)}
                </div>
            </div>`;
        },

        // ==========================================
        // 9. TƯƠNG TÁC THÍ SINH
        // ==========================================
        selectAnswer(qNum, optLetter) {
            if (this.isReviewMode || !this.currentExam) return;

            this.userAnswers[qNum] = optLetter;
            this.currentQIndex = qNum - 1;

            // 1. Direct DOM update for option buttons of this question
            ['A', 'B', 'C', 'D'].forEach(letter => {
                const btn = document.getElementById(`opt-${qNum}-${letter}`);
                if (!btn) return;
                const isSel = (letter === optLetter);
                const radio = btn.querySelector('input[type="radio"]');
                if (radio) radio.checked = isSel;

                const circle = btn.querySelector('.opt-circle');
                if (isSel) {
                    btn.classList.add('opt-selected');
                    if (circle) circle.innerHTML = '<span class="opt-circle-dot"></span>';
                } else {
                    btn.classList.remove('opt-selected');
                    if (circle) circle.innerHTML = '';
                }
            });

            // 2. Direct DOM update for bottom palette button
            const palBtn = document.getElementById(`palette-btn-${qNum}`);
            if (palBtn) {
                palBtn.classList.add('answered');
                palBtn.classList.add('current');
            }
            // Remove 'current' from other palette buttons
            for (let i = 1; i <= this.currentExam.total_questions; i++) {
                if (i !== qNum) {
                    const otherBtn = document.getElementById(`palette-btn-${i}`);
                    if (otherBtn) otherBtn.classList.remove('current');
                }
            }

            // 3. Highlight active card
            document.querySelectorAll('[id^="q-card-"]').forEach(c => c.classList.remove('ring-2', 'ring-blue-500/40'));
            const currentCard = document.getElementById(`q-card-${qNum}`);
            if (currentCard) currentCard.classList.add('ring-2', 'ring-blue-500/40');

            // 4. Update Header indicators
            const numEl = document.getElementById('exam-current-q-num');
            if (numEl) numEl.textContent = qNum;
            this.updateProgressCounter();

            // 5. Safe Storage Save
            try {
                this.saveProgress(false);
            } catch(e) {
                console.warn('Storage save failed:', e);
            }
        },

        renderSingleQuestion(qNum) {
            const card = document.getElementById(`q-card-${qNum}`);
            if (!card || !this.currentExam) return;

            const q = this.currentExam.questions[qNum - 1];
            if (!q) return;

            const selectedOpt = this.userAnswers[qNum] || '';
            const isCurrent = (qNum - 1 === this.currentQIndex);

            card.className = `p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4 transition-all font-sans ${isCurrent ? 'ring-2 ring-blue-500/40' : ''}`;

            const optContainer = document.getElementById(`q-options-${qNum}`);
            if (optContainer) {
                optContainer.innerHTML = this.renderOptionsHtml(q, selectedOpt);
            }
        },

        toggleFlag(qNum) {
            if (this.isReviewMode) return;
            this.flaggedQuestions[qNum] = !this.flaggedQuestions[qNum];
            this.renderPalette();
            this.renderSingleQuestion(qNum);
            try {
                this.saveProgress(false);
            } catch(e) {}
        },

        async reportAnswer(qNum) {
            if (!this.currentExam) return;
            const q = this.currentExam.questions[qNum - 1];
            if (!q) return;

            // Remove any existing report modal
            const existing = document.getElementById('thpt-report-modal');
            if (existing) existing.remove();

            const curAns = q.correct_answer || '?';
            const modal = document.createElement('div');
            modal.id = 'thpt-report-modal';
            modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4';
            modal.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 font-sans">
                <div class="flex items-center gap-2 text-rose-600">
                    <span class="material-symbols-outlined text-[22px]">report</span>
                    <h3 class="font-black text-base">Báo lỗi câu ${qNum}</h3>
                </div>
                <p class="text-sm text-slate-600 leading-relaxed">
                    Đáp án hệ thống: <strong class="text-blue-700">${curAns}</strong><br>
                    Bạn cho rằng đáp án đúng là?
                </p>
                <div class="grid grid-cols-4 gap-2" id="report-ans-btns">
                    ${['A','B','C','D'].map(l => `
                    <button type="button" onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('bg-rose-600','text-white','border-rose-600'));this.classList.add('bg-rose-600','text-white','border-rose-600');document.getElementById('report-sel-ans').value='${l}'"
                        class="py-2 rounded-xl border-2 border-slate-200 text-slate-700 font-black text-sm transition-all hover:border-rose-400">${l}</button>`).join('')}
                </div>
                <input type="hidden" id="report-sel-ans" value="">
                <textarea id="report-note" rows="2"
                    placeholder="Giải thích thêm (không bắt buộc)"
                    class="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-rose-400"></textarea>
                <div class="flex gap-3 justify-end">
                    <button type="button" onclick="document.getElementById('thpt-report-modal').remove()"
                        class="px-4 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-100 transition-colors">Huỷ</button>
                    <button type="button" id="report-submit-btn"
                        onclick="window.ThptExam._submitReport(${qNum}, '${q.correct_answer || ''}')"
                        class="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 transition-colors">Gửi báo cáo</button>
                </div>
            </div>`;
            document.body.appendChild(modal);
            // Close on backdrop click
            modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        },

        async _submitReport(qNum, systemAnswer) {
            const selAns = (document.getElementById('report-sel-ans')?.value || '').trim();
            const note = (document.getElementById('report-note')?.value || '').trim();
            const btn = document.getElementById('report-submit-btn');

            if (!selAns) {
                alert('Vui lòng chọn đáp án bạn cho là đúng.');
                return;
            }
            if (btn) { btn.disabled = true; btn.textContent = 'Đang gửi...'; }

            try {
                const supabase = window._supabaseClient || window.supabase;
                if (supabase) {
                    await supabase.from('answer_reports').insert([{
                        exam_id: this.currentExam.id,
                        question_number: qNum,
                        system_answer: systemAnswer,
                        reported_answer: selAns,
                        note: note || null,
                        created_at: new Date().toISOString()
                    }]);
                }
            } catch(e) {
                console.warn('Report save failed (table may not exist yet):', e);
            }

            const modal = document.getElementById('thpt-report-modal');
            if (modal) {
                modal.innerHTML = `
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center font-sans space-y-3">
                    <span class="material-symbols-outlined text-emerald-500 text-[48px]">check_circle</span>
                    <p class="font-bold text-slate-800">Cảm ơn bạn đã báo cáo!</p>
                    <p class="text-sm text-slate-500">Chúng tôi sẽ kiểm tra và cập nhật đáp án sớm nhất.</p>
                    <button type="button" onclick="this.closest('.fixed').remove()"
                        class="mt-2 px-6 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold">Đóng</button>
                </div>`;
            }
        },

        jumpToQuestion(qNum) {
            if (!this.currentExam) return;
            const prevIndex = this.currentQIndex;
            this.currentQIndex = qNum - 1;

            // Update top header indicator
            const numEl = document.getElementById('exam-current-q-num');
            if (numEl) numEl.textContent = qNum;

            // Re-render prev and new active cards
            if (prevIndex !== this.currentQIndex) {
                this.renderSingleQuestion(prevIndex + 1);
            }
            this.renderSingleQuestion(qNum);
            this.renderPalette();

            const card = document.getElementById(`q-card-${qNum}`);
            if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            this.syncPassageAndScroll(qNum);

            // Apply word highlight if question references "The word X in paragraph N"
            // Small delay to let passage scroll settle first
            setTimeout(() => this.applyCurrentQuestionHighlight(qNum), 300);
        },

        prevQuestion() {
            if (this.currentQIndex > 0) {
                this.jumpToQuestion(this.currentQIndex);
            }
        },

        nextQuestion() {
            if (this.currentExam && this.currentQIndex < this.currentExam.total_questions - 1) {
                this.jumpToQuestion(this.currentQIndex + 2);
            }
        },

        updateProgressCounter() {
            const el = document.getElementById('exam-answered-count');
            if (el && this.currentExam) {
                const count = Object.keys(this.userAnswers).length;
                el.textContent = `${count} / ${this.currentExam.total_questions}`;
            }
        },

        changeFontSize(delta) {
            this.fontSizeLevel = Math.max(-1, Math.min(2, this.fontSizeLevel + delta));
            const sizes = ['text-[12px]', 'text-[14px]', 'text-[16px]', 'text-[18px]'];
            const targetCls = sizes[this.fontSizeLevel + 1];

            document.querySelectorAll('.q-text-size').forEach(el => {
                el.classList.remove('text-[12px]', 'text-[14px]', 'text-[16px]', 'text-[18px]');
                el.classList.add(targetCls);
            });
        },

        toggleFullscreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            } else {
                if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
            }
        },

        setMobileView(mode) {
            this.mobileViewMode = mode;
            const leftCol = document.getElementById('exam-left-col');
            const rightCol = document.getElementById('exam-right-col');
            const btnPassage = document.getElementById('btn-view-passage');
            const btnBoth = document.getElementById('btn-view-both');
            const btnQuestions = document.getElementById('btn-view-questions');

            if (!leftCol || !rightCol) return;

            // Reset buttons styling
            [btnPassage, btnBoth, btnQuestions].forEach(b => {
                if (b) b.className = 'px-1.5 py-0.5 rounded text-slate-300 hover:text-white transition-colors';
            });

            if (mode === 'passage') {
                leftCol.className = 'w-full md:w-1/2 flex flex-col bg-white overflow-hidden min-h-0 h-full transition-all';
                rightCol.className = 'hidden md:flex w-full md:w-1/2 flex-col bg-slate-50/70 overflow-hidden min-h-0 md:h-full transition-all border-l border-slate-200 md:border-l-0';
                if (btnPassage) btnPassage.className = 'px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold';
            } else if (mode === 'questions') {
                leftCol.className = 'hidden md:flex w-full md:w-1/2 flex-col bg-white overflow-hidden min-h-0 md:h-full transition-all';
                rightCol.className = 'w-full md:w-1/2 flex flex-col bg-slate-50/70 overflow-hidden min-h-0 h-full transition-all border-l border-slate-200 md:border-l-0';
                if (btnQuestions) btnQuestions.className = 'px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold';
            } else {
                // Both 50/50
                leftCol.className = 'w-full md:w-1/2 flex flex-col bg-white overflow-hidden min-h-0 h-1/2 md:h-full transition-all';
                rightCol.className = 'w-full md:w-1/2 flex flex-col bg-slate-50/70 overflow-hidden min-h-0 h-1/2 md:h-full transition-all border-l border-slate-200 md:border-l-0';
                if (btnBoth) btnBoth.className = 'px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold';
            }
        },

        // ==========================================
        // 10. LƯU TIẾN ĐỘ & NỘP BÀI
        // ==========================================
        saveProgress(notify = true) {
            if (!this.currentExam) return;
            const data = {
                examId: this.currentExam.id,
                answers: this.userAnswers,
                flags: this.flaggedQuestions,
                timeRemaining: this.timerSeconds,
                initialSeconds: this.initialSeconds,
                savedAt: Date.now(),
                submitted: false
            };
            localStorage.setItem('thpt_progress_' + this.currentExam.id, JSON.stringify(data));
            if (notify && window.showToast) {
                window.showToast('Đã lưu tiến độ bài làm!', 'success');
            }
        },

        loadSavedProgress(examId) {
            try {
                const str = localStorage.getItem('thpt_progress_' + examId);
                return str ? JSON.parse(str) : null;
            } catch (e) {
                return null;
            }
        },

        confirmSubmit() {
            if (!this.currentExam) return;
            const total = this.currentExam.total_questions;
            const answered = Object.keys(this.userAnswers).length;
            const unans = total - answered;

            let msg = `Bạn đã hoàn thành <strong>${answered} / ${total}</strong> câu hỏi.`;
            if (unans > 0) {
                msg += `<br><span class="text-rose-600 font-bold">Còn ${unans} câu chưa trả lời.</span> Bạn có chắc chắn muốn nộp bài?`;
            } else {
                msg += `<br>Bạn đã trả lời đầy đủ tất cả câu hỏi! Bạn có chắc chắn muốn nộp bài?`;
            }

            const modalMsg = document.getElementById('exam-confirm-submit-msg');
            if (modalMsg) modalMsg.innerHTML = msg;

            const modal = document.getElementById('modal-exam-confirm-submit');
            if (modal) modal.classList.remove('hidden');
        },

        closeSubmitConfirmModal() {
            const modal = document.getElementById('modal-exam-confirm-submit');
            if (modal) modal.classList.add('hidden');
        },

        submitExam(isAuto = false) {
            this.closeSubmitConfirmModal();
            this.stopTimer();

            if (!this.currentExam) return;

            let correctCount = 0;
            const details = {};

            this.currentExam.questions.forEach(q => {
                const userAns = this.userAnswers[q.number] || '';
                const isCorrect = (userAns.toUpperCase() === q.correct_answer.toUpperCase());
                if (isCorrect) correctCount++;
                details[q.number] = {
                    userAns,
                    correctAns: q.correct_answer,
                    isCorrect
                };
            });

            const totalQ = this.currentExam.total_questions;
            const rawScore = (correctCount / totalQ) * 10;
            const score = Math.round(rawScore * 100) / 100;
            const timeSpentSeconds = this.initialSeconds - this.timerSeconds;
            const pct = Math.round((correctCount / totalQ) * 100);

            this.results = {
                examId: this.currentExam.id,
                title: this.currentExam.title,
                score,
                correct: correctCount,
                wrong: totalQ - correctCount,
                unanswered: totalQ - Object.keys(this.userAnswers).length,
                total: totalQ,
                percentage: pct,
                timeSpentSeconds,
                submittedAt: Date.now(),
                details
            };

            this.saveBestScore(this.currentExam.id, this.results);

            localStorage.setItem('thpt_progress_' + this.currentExam.id, JSON.stringify({
                examId: this.currentExam.id,
                submitted: true,
                results: this.results
            }));

            this.showResultsModal(this.results);
        },

        showResultsModal(r) {
            const modal = document.getElementById('modal-exam-result');
            if (!modal) return;

            document.getElementById('res-exam-title').textContent = r.title;
            document.getElementById('res-score').textContent = r.score.toFixed(2);
            document.getElementById('res-correct-count').textContent = `${r.correct} / ${r.total}`;
            document.getElementById('res-wrong-count').textContent = r.wrong;
            document.getElementById('res-pct').textContent = `${r.percentage}%`;

            const m = Math.floor(r.timeSpentSeconds / 60);
            const s = r.timeSpentSeconds % 60;
            document.getElementById('res-time-spent').textContent = `${m}p ${s}s`;

            modal.classList.remove('hidden');
        },

        closeResultsModal() {
            const modal = document.getElementById('modal-exam-result');
            if (modal) modal.classList.add('hidden');
        },

        enterReviewMode() {
            this.closeResultsModal();
            this.isReviewMode = true;

            const nameEl = document.getElementById('exam-candidate-name');
            if (nameEl) nameEl.textContent = 'XEM LỜI GIẢI CHI TIẾT';

            this.renderQuestionsAndPalette();
            this.jumpToQuestion(1);

            if (window.showToast) {
                window.showToast('Đang hiển thị đáp án và lời giải chi tiết!', 'info');
            }
        },

        retakeExam() {
            this.closeResultsModal();
            if (this.currentExam) {
                localStorage.removeItem('thpt_progress_' + this.currentExam.id);
                this.startExam(this.currentExam.id, this.initialSeconds / 60);
            }
        },

        // ==========================================
        // 11. TÙY CHỈNH THỜI GIAN THI
        // ==========================================
        openCustomTimeModal(examId) {
            this.selectedExamIdForTime = examId;
            const modal = document.getElementById('modal-custom-exam-time');
            if (modal) modal.classList.remove('hidden');
        },

        closeCustomTimeModal() {
            const modal = document.getElementById('modal-custom-exam-time');
            if (modal) modal.classList.add('hidden');
        },

        submitCustomTime() {
            const sel = document.querySelector('input[name="custom-exam-time"]:checked');
            const mins = sel ? parseInt(sel.value, 10) : 50;
            this.closeCustomTimeModal();
            if (this.selectedExamIdForTime) {
                this.startExam(this.selectedExamIdForTime, mins);
            }
        },

        // ==========================================
        // 12. STORAGE & TIỆN ÍCH
        // ==========================================
        saveBestScore(examId, res) {
            try {
                const all = this.loadAllBestScores();
                const existing = all[examId];
                if (!existing || res.score > existing.score) {
                    all[examId] = {
                        score: res.score,
                        correct: res.correct,
                        date: Date.now()
                    };
                    localStorage.setItem('thpt_best_scores', JSON.stringify(all));
                }
            } catch (e) {}
        },

        loadAllBestScores() {
            try {
                const str = localStorage.getItem('thpt_best_scores');
                return str ? JSON.parse(str) : {};
            } catch (e) {
                return {};
            }
        },

        escHtml(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        },

        escAttr(str) {
            if (!str) return '';
            return String(str).replace(/"/g, '&quot;');
        }
    };

    window.ThptExam = ThptExam;
})(window);
