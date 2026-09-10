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
        // 4. RENDER THƯ VIỆN ĐỀ THI (#page-exercises)
        // ==========================================
        renderExamsList() {
            const container = document.getElementById('thpt-exams-grid');
            if (!container) return;

            if (!this.exams || this.exams.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full py-16 text-center text-on-surface-variant font-sans">
                        <span class="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span>
                        <p class="mt-2 text-sm">Đang nạp bộ đề thi THPT Quốc Gia...</p>
                    </div>`;
                return;
            }

            const bestScores = this.loadAllBestScores();

            let html = '';
            this.exams.forEach((exam, idx) => {
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
                <div class="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 soft-shadow flex flex-col justify-between gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg font-sans">
                    <div class="space-y-3">
                        <div class="flex items-start justify-between gap-2">
                            <span class="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-black tracking-wider uppercase">
                                ĐỀ THI SỐ ${idx + 1}
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
                                class="flex-1 py-2.5 px-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer">
                            <span class="material-symbols-outlined text-[16px]">play_arrow</span>
                            <span>Vào thi (50p)</span>
                        </button>
                        <button onclick="window.ThptExam.openCustomTimeModal('${exam.id}')" 
                                class="p-2.5 rounded-xl border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
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

            // Start Timer
            this.startTimer();

            // Setup Candidate details
            this.setupCandidateInfo();

            // Switch to Room View
            this.showRoomView();

            // Render Passages (All sections continuous scroll)
            this.renderAllPassages();

            // Render Questions & Palette
            this.renderQuestionsAndPalette();

            // Init Draggable Split Resizer & Restore Palette state
            this.initDraggableDivider();
            this.restorePaletteState();

            // Reset mobile view
            this.setMobileView('both');

            // Jump to first question
            this.jumpToQuestion(1);
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
            if (window.navigateTo) {
                window.navigateTo('thpt-room', true);
            } else {
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
            const sections = [];
            let currentSec = null;

            this.currentExam.questions.forEach((q, idx) => {
                const grpName = q.group || 'Ngữ Liệu Đề Thi';
                if (!currentSec || currentSec.group !== grpName) {
                    currentSec = {
                        index: sections.length + 1,
                        group: grpName,
                        startQ: q.number,
                        endQ: q.number,
                        passage: q.passage || '',
                        questions: [q.number]
                    };
                    sections.push(currentSec);
                } else {
                    currentSec.endQ = q.number;
                    currentSec.questions.push(q.number);
                    if (!currentSec.passage && q.passage) {
                        currentSec.passage = q.passage;
                    }
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

        renderAllPassages() {
            const contentPane = document.getElementById('exam-passage-content');
            const navPillsPane = document.getElementById('exam-passage-nav-pills');
            if (!contentPane || !this.currentExam) return;

            const sections = this.buildExamSections();

            // 1. Render Nav Pills
            if (navPillsPane) {
                let pillsHtml = '';
                sections.forEach((sec, idx) => {
                    const shortName = `P.${sec.index} (${sec.startQ}-${sec.endQ})`;
                    pillsHtml += `
                    <button type="button" onclick="window.ThptExam.jumpToPassageSection(${sec.index})" 
                            id="passage-pill-${sec.index}"
                            class="passage-pill-btn px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-all border border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-700 cursor-pointer shrink-0 font-sans"
                            title="${this.escAttr(sec.group)}">
                        ${shortName}
                    </button>`;
                });
                navPillsPane.innerHTML = pillsHtml;
            }

            // 2. Render Full Continuous Passages
            let contentHtml = '';
            sections.forEach((sec, idx) => {
                const secQuestions = this.currentExam.questions.filter(q => q.number >= sec.startQ && q.number <= sec.endQ);
                const arrQuestions = secQuestions.filter(q => q.is_arrangement && q.arrangement_sentences);

                if (arrQuestions.length > 0) {
                    // Dedicated Sentence Arrangement Section
                    let arrCardsHtml = '';
                    arrQuestions.forEach(q => {
                        const parsedSentences = this.parseArrangementSentences(q.arrangement_sentences);
                        let sHtml = '';
                        parsedSentences.forEach(item => {
                            sHtml += `
                            <div class="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/90 hover:bg-blue-50/50 hover:border-blue-300 transition-colors">
                                <span class="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                                    ${item.letter}
                                </span>
                                <div class="text-slate-800 text-sm leading-relaxed q-text-size select-text font-sans flex-1">
                                    ${this.escHtml(item.text)}
                                </div>
                            </div>`;
                        });

                        let salutation = '';
                        if (q.prompt && !q.prompt.startsWith('Chọn đáp án') && !q.prompt.startsWith('Sắp xếp') && q.prompt.length < 120) {
                            salutation = `<div class="font-bold text-slate-800 italic text-sm pb-1">${this.escHtml(q.prompt)}</div>`;
                        }

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
                                    Sentence Arrangement
                                </span>
                            </div>

                            ${salutation}

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
                                    ${this.escHtml(sec.group)}
                                </h3>
                            </div>
                            <span class="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 shrink-0">
                                Câu ${sec.startQ} - ${sec.endQ}
                            </span>
                        </div>

                        ${sec.passage && sec.passage.trim().length > 10 ? `
                        <div class="text-xs text-slate-500 font-medium italic pb-1">
                            ${this.escHtml(sec.passage)}
                        </div>` : ''}

                        <div class="space-y-3">
                            ${arrCardsHtml}
                        </div>
                    </div>`;
                } else {
                    // Regular Reading Passage
                    const passageText = sec.passage && sec.passage.trim().length > 10 
                        ? sec.passage 
                        : 'Phần này bao gồm các câu hỏi độc lập (xem chi tiết ở cột bên phải).';

                    contentHtml += `
                    <div id="passage-sec-${sec.index}" 
                         class="passage-sec-card p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 transition-all duration-300 font-sans">
                        <div class="flex items-center justify-between pb-2.5 border-b border-slate-100 gap-2">
                            <div class="flex items-center gap-2 min-w-0">
                                <span class="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 font-black text-xs flex items-center justify-center shrink-0">
                                    ${sec.index}
                                </span>
                                <h3 class="font-bold text-xs uppercase tracking-wide text-slate-800 truncate">
                                    ${this.escHtml(sec.group)}
                                </h3>
                            </div>
                            <span class="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 shrink-0">
                                Câu ${sec.startQ} - ${sec.endQ}
                            </span>
                        </div>

                        <!-- Nội dung bài đọc đầy đủ: Hiện đại, font-sans, leading-relaxed -->
                        <div class="text-slate-800 leading-relaxed font-sans whitespace-pre-line text-sm q-text-size select-text">
                            ${this.escHtml(passageText)}
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
        // 8. RENDER CÂU HỎI & CHỌN ĐÁP ÁN
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

                let cls = 'w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all relative cursor-pointer select-none shrink-0 font-sans ';

                if (this.isReviewMode && this.results) {
                    const isCorrect = this.results.details[i]?.isCorrect;
                    if (isCorrect) {
                        cls += 'bg-emerald-600 text-white shadow-xs font-black';
                    } else {
                        cls += 'bg-rose-600 text-white shadow-xs font-black';
                    }
                } else {
                    if (isAnswered) {
                        cls += 'bg-emerald-600 text-white shadow-2xs font-extrabold';
                    } else {
                        cls += 'bg-white text-slate-700 border border-slate-300 hover:border-slate-400';
                    }
                }

                if (isCurrent) {
                    cls += ' ring-2 ring-blue-600 ring-offset-2';
                }

                const flagDot = isFlagged && !this.isReviewMode 
                    ? '<span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white"></span>' 
                    : '';

                html += `<button type="button" onclick="window.ThptExam.jumpToQuestion(${i})" class="${cls}">${i}${flagDot}</button>`;
            }

            palette.innerHTML = html;
        },

        renderQuestionsList() {
            const container = document.getElementById('exam-questions-list');
            if (!container || !this.currentExam) return;

            let html = '';
            this.currentExam.questions.forEach((q, idx) => {
                const qNum = q.number;
                const isFlagged = !!this.flaggedQuestions[qNum];
                const selectedOpt = this.userAnswers[qNum] || '';
                const isCurrent = (idx === this.currentQIndex);

                let promptHtml = '';
                if (q.is_arrangement) {
                    promptHtml = `
                    <div class="space-y-1.5 font-sans">
                        <div class="font-bold text-sm text-slate-900 leading-relaxed q-text-size">
                            <strong>Question ${qNum}.</strong> Chọn phương án sắp xếp các câu ở cột bên trái theo thứ tự đúng:
                        </div>
                        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
                            <span class="material-symbols-outlined text-[14px]">west</span>
                            <span>Xem các câu <strong>a, b, c, d, e</strong> ở cột bên trái</span>
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
                        <button type="button" onclick="window.ThptExam.toggleFlag(${qNum})" 
                                class="p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${isFlagged ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:text-slate-600'}" 
                                title="Đánh dấu câu hỏi cần xem lại">
                            <span class="material-symbols-outlined text-[18px]">${isFlagged ? 'flag' : 'outlined_flag'}</span>
                        </button>
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

                let optClass = 'flex items-start gap-3 p-3.5 rounded-xl border text-xs font-medium transition-all cursor-pointer select-none font-sans ';
                let radioCircle = '';

                if (this.isReviewMode) {
                    if (isCorrect) {
                        optClass += 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold';
                        radioCircle = `<span class="w-5 h-5 rounded-full border-2 border-emerald-600 bg-emerald-600 flex items-center justify-center shrink-0 mt-0.5"><span class="material-symbols-outlined text-white text-[13px] font-black">check</span></span>`;
                    } else if (isSelected && !isCorrect) {
                        optClass += 'bg-rose-50 border-rose-400 text-rose-950';
                        radioCircle = `<span class="w-5 h-5 rounded-full border-2 border-rose-600 bg-rose-600 flex items-center justify-center shrink-0 mt-0.5"><span class="material-symbols-outlined text-white text-[13px] font-black">close</span></span>`;
                    } else {
                        optClass += 'bg-white border-slate-200 text-slate-600 opacity-60';
                        radioCircle = `<span class="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0 mt-0.5"></span>`;
                    }
                } else {
                    if (isSelected) {
                        optClass += 'bg-blue-50/90 border-blue-600 text-blue-950 font-bold shadow-xs ring-1 ring-blue-500/30';
                        radioCircle = `<span class="w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center shrink-0 mt-0.5 bg-white"><span class="w-2.5 h-2.5 rounded-full bg-blue-600"></span></span>`;
                    } else {
                        optClass += 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800';
                        radioCircle = `<span class="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0 mt-0.5"></span>`;
                    }
                }

                const clickAction = !this.isReviewMode 
                    ? `onclick="window.ThptExam.selectAnswer(${q.number}, '${letter}')"` 
                    : '';

                html += `
                <div ${clickAction} class="${optClass}">
                    <input type="radio" class="sr-only" name="radio_q_${q.number}" value="${letter}" ${isSelected ? 'checked' : ''} />
                    ${radioCircle}
                    <div class="flex-1 q-text-size">
                        <span class="font-bold mr-1.5 text-slate-900">${letter}.</span>
                        <span>${this.escHtml(optText)}</span>
                    </div>
                </div>`;
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
            if (this.isReviewMode) return;

            this.userAnswers[qNum] = optLetter;
            this.currentQIndex = qNum - 1;

            this.renderSingleQuestion(qNum);
            this.renderPalette();
            this.updateProgressCounter();
            this.saveProgress(false);
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
            this.saveProgress(false);
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
