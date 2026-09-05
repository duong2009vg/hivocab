// ============================================================
// HI - DASHBOARD STATS, FLAME CALENDAR & IELTS GOAL | dashboardStats.js
// ============================================================
// Kết nối HiDB vào UI Dashboard:
// 1. Cập nhật streak, số từ cần ôn, phân bố memory level, countdown ôn tập.
// 2. Lịch giữ lửa (Flame Activity Heatmap Calendar) theo từng tháng.
// 3. Quản lý mục tiêu IELTS 4 kỹ năng + Overall & Đếm ngược ngày thi.
//
// Phụ thuộc: dataLayer.js (HiDB) phải load trước.
// ============================================================

const HiDashboard = (() => {

    // ----------------------------------------------------------
    // ELEMENT IDs (khớp với index.html)
    // ----------------------------------------------------------
    const EL = {
        // Header streak badge (trong page-dashboard)
        streakBadge:       'dashboard-streak-badge',
        // Số từ cần ôn (trong hero card)
        wordsDueCount:     'dashboard-words-due',
        wordsDueText:      'dashboard-words-due-text',
        // Memory level bars (trong stats card)
        memLv5Bar:         'mem-lv5-bar',
        memLv5Count:       'mem-lv5-count',
        memLv4Bar:         'mem-lv4-bar',
        memLv4Count:       'mem-lv4-count',
        memLv3Bar:         'mem-lv3-bar',
        memLv3Count:       'mem-lv3-count',
        memLv2Bar:         'mem-lv2-bar',
        memLv2Count:       'mem-lv2-count',
        memLv1Bar:         'mem-lv1-bar',
        memLv1Count:       'mem-lv1-count',
        // Tổng từ vựng đã học
        totalWordsLearned: 'dashboard-total-words',
    };

    // ----------------------------------------------------------
    // COUNTDOWN STATE
    // ----------------------------------------------------------
    let _countdownInterval = null;  // setInterval ID
    let _nextReviewTime    = null;  // Date đến lần ôn tiếp theo

    // ----------------------------------------------------------
    // FLAME CALENDAR STATE
    // ----------------------------------------------------------
    let _calCurrentDate = new Date(); // Tháng đang xem

    /**
     * Render số liệu thật từ stats object vào Dashboard UI.
     *
     * @param {{ wordsDueCount, streak, memoryLevels }} stats
     */
    async function _renderStats(stats) {
        const { wordsDueCount, streak, memoryLevels } = stats;
        const { lv1 = 0, lv2 = 0, lv3 = 0, lv4 = 0, lv5 = 0 } = memoryLevels;
        const total = lv1 + lv2 + lv3 + lv4 + lv5;

        // ── 1. Streak badge ──────────────────────────────────
        const streakEl = document.getElementById(EL.streakBadge);
        if (streakEl) {
            streakEl.textContent = streak > 0 ? `${streak} Ngày` : '0 Ngày';
        }

        const streakSubEl = document.getElementById('flame-streak-count');
        if (streakSubEl) {
            streakSubEl.textContent = streak;
        }

        // ── 2. Số từ cần ôn trong hero card ──────────────────
        const dueCountEl = document.getElementById(EL.wordsDueCount);
        if (dueCountEl) {
            _animateNumber(dueCountEl, 0, wordsDueCount, 600);
        }

        const dueTextEl = document.getElementById(EL.wordsDueText);
        if (dueTextEl) {
            if (wordsDueCount === 0) {
                dueTextEl.textContent = 'Tuyệt vời! Bạn đã ôn xong mọi từ hôm nay.';
            } else {
                dueTextEl.textContent = `Bạn có ${wordsDueCount} từ vựng cần được củng cố theo phương pháp lặp lại ngắt quãng hôm nay.`;
            }
        }

        // ── 3. Total words learned ───────────────────────────
        const totalEl = document.getElementById(EL.totalWordsLearned);
        if (totalEl) _animateNumber(totalEl, 0, total, 800);

        // ── 4. Memory level bars ─────────────────────────────
        const maxCount = Math.max(lv1, lv2, lv3, lv4, lv5, 1); // tránh chia cho 0

        _renderLevelBar('lv5', lv5, maxCount, 'bg-green-500');
        _renderLevelBar('lv4', lv4, maxCount, 'bg-slate-700');
        _renderLevelBar('lv3', lv3, maxCount, 'bg-blue-500');
        _renderLevelBar('lv2', lv2, maxCount, 'bg-yellow-400');
        _renderLevelBar('lv1', lv1, maxCount, 'bg-red-500');

        // ── 5. Hero card: ready vs countdown ─────────────────────────────────
        if (wordsDueCount > 0) {
            _showReadyState();
        } else {
            // Tính thời gian ôn tập kế tiếp
            let nextTime;
            if (typeof HiDB !== 'undefined' && typeof HiDB.getNextReviewTime === 'function') {
                try { nextTime = await HiDB.getNextReviewTime(); } catch(_) {}
            }
            if (!nextTime || nextTime <= new Date()) {
                // Fallback: +12 giờ từ hiện tại
                nextTime = new Date(Date.now() + 12 * 60 * 60 * 1000);
            }
            _startCountdown(nextTime);
        }
    }

    /**
     * Cập nhật một progress bar level nhớ.
     */
    function _renderLevelBar(lv, count, maxCount, colorCls) {
        const barEl   = document.getElementById(`mem-${lv}-bar`);
        const countEl = document.getElementById(`mem-${lv}-count`);

        if (!barEl && !countEl) return;

        const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;

        if (barEl) {
            barEl.style.width = pct + '%';
            barEl.className = `h-full ${colorCls} rounded-full transition-all duration-700`;
        }

        if (countEl) {
            countEl.textContent = count;
        }
    }

    /**
     * Animate một số đếm lên.
     */
    function _animateNumber(el, from, to, durationMs) {
        if (from === to) { el.textContent = to; return; }
        const step     = Math.ceil((to - from) / (durationMs / 16));
        let   current  = from;
        const interval = setInterval(() => {
            current = Math.min(current + step, to);
            el.textContent = current;
            if (current >= to) clearInterval(interval);
        }, 16);
    }

    // ----------------------------------------------------------
    // HERO CARD: ĐIỀU KHIỂN TRẠNG THÁI
    // ----------------------------------------------------------

    function _showReadyState() {
        stopCountdown();
        const ready     = document.getElementById('dash-ready-state');
        const countdown = document.getElementById('dash-countdown-state');
        if (ready)     { ready.classList.remove('hidden');    ready.classList.add('flex'); }
        if (countdown) { countdown.classList.add('hidden');   countdown.classList.remove('flex'); }
    }

    function _showCountdownState(nextTime) {
        const ready     = document.getElementById('dash-ready-state');
        const countdown = document.getElementById('dash-countdown-state');
        if (ready)     { ready.classList.add('hidden');        ready.classList.remove('flex'); }
        if (countdown) { countdown.classList.remove('hidden'); countdown.classList.add('flex'); }

        const labelEl = document.getElementById('cd-next-label');
        if (labelEl && nextTime) {
            labelEl.textContent = 'Dự kiến: ' + nextTime.toLocaleTimeString('vi-VN', {
                hour: '2-digit', minute: '2-digit', hour12: false
            }) + (nextTime.toDateString() !== new Date().toDateString()
                ? ' ngày ' + nextTime.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
                : ' hôm nay'
            );
        }
    }

    function _startCountdown(nextTime) {
        _nextReviewTime = nextTime;
        stopCountdown();
        _showCountdownState(nextTime);

        function _tick() {
            const now  = new Date();
            const diff = Math.max(0, nextTime - now);

            const totalSecs = Math.floor(diff / 1000);
            const h = Math.floor(totalSecs / 3600);
            const m = Math.floor((totalSecs % 3600) / 60);
            const s = totalSecs % 60;

            const pad = n => String(n).padStart(2, '0');
            const hoursEl   = document.getElementById('cd-hours');
            const minutesEl = document.getElementById('cd-minutes');
            const secondsEl = document.getElementById('cd-seconds');

            if (hoursEl)   hoursEl.textContent   = pad(h);
            if (minutesEl) minutesEl.textContent = pad(m);
            if (secondsEl) secondsEl.textContent = pad(s);

            if (diff <= 0) {
                stopCountdown();
                _showReadyState();
                const dueTextEl = document.getElementById('dashboard-words-due-text');
                if (dueTextEl) dueTextEl.textContent = 'Đến giờ rồi! Hãy bắt đầu ôn tập ngay.';
            }
        }

        _tick();
        _countdownInterval = setInterval(_tick, 1000);
    }

    function stopCountdown() {
        if (_countdownInterval) {
            clearInterval(_countdownInterval);
            _countdownInterval = null;
        }
    }

    // ==========================================================
    // PHẦN 2: LỊCH GIỮ LỬA (FLAME HEATMAP CALENDAR)
    // ==========================================================

    /**
     * Render Lịch giữ lửa cho tháng/năm hiện tại của _calCurrentDate.
     */
    async function renderFlameCalendar(targetDate = null) {
        if (targetDate) _calCurrentDate = new Date(targetDate);

        const year  = _calCurrentDate.getFullYear();
        const month = _calCurrentDate.getMonth() + 1; // 1-12

        // Cập nhật Tiêu đề Tháng
        const titleEl = document.getElementById('flame-calendar-title');
        if (titleEl) {
            titleEl.textContent = `Tháng ${month}, ${year}`;
        }

        // Lấy dữ liệu phiên học trong tháng
        let sessionsMap = {};
        if (typeof HiDB !== 'undefined' && typeof HiDB.getMonthlyStudySessions === 'function') {
            try {
                sessionsMap = await HiDB.getMonthlyStudySessions(year, month);
            } catch (err) {
                console.warn('[FlameCalendar] Lỗi load phiên học:', err);
            }
        }

        const gridEl = document.getElementById('flame-calendar-grid');
        if (!gridEl) return;

        // Tính ngày đầu tiên và tổng số ngày trong tháng
        const firstDayOfMonth = new Date(year, month - 1, 1);
        const lastDateOfMonth = new Date(year, month, 0).getDate();

        // Thứ trong tuần của ngày 1 (0: CN, 1: T2, ..., 6: T7). Chuyển về 0: T2 ... 6: CN
        let startDayIndex = firstDayOfMonth.getDay() - 1;
        if (startDayIndex === -1) startDayIndex = 6; // Chủ nhật đưa về cuối tuần

        const today = new Date();
        const isCurrentMonth = (today.getFullYear() === year && today.getMonth() + 1 === month);
        const todayDate = today.getDate();

        let html = '';
        let activeDaysCount = 0;
        let totalWordsThisMonth = 0;

        // 1. Ô trống đầu tháng (padding)
        for (let i = 0; i < startDayIndex; i++) {
            html += `<div class="aspect-square rounded-lg bg-transparent opacity-0 pointer-events-none"></div>`;
        }

        // 2. Các ngày trong tháng
        for (let day = 1; day <= lastDateOfMonth; day++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const wordsCount = Number(sessionsMap[dateStr] || 0);

            if (wordsCount > 0) {
                activeDaysCount++;
                totalWordsThisMonth += wordsCount;
            }

            const isToday = isCurrentMonth && (day === todayDate);

            // Phân loại cấp độ ngọn lửa
            let levelClass = '';
            let flameIcon = '';

            if (wordsCount === 0) {
                levelClass = 'bg-surface-container-low/60 text-on-surface-variant/70 border border-outline-variant/15 hover:bg-surface-container transition-colors';
            } else if (wordsCount < 10) {
                // Cấp 1 (1 - 9 từ): Cam nhạt
                levelClass = 'bg-orange-500/20 text-orange-600 dark:text-orange-300 font-semibold border border-orange-500/40 shadow-sm';
            } else if (wordsCount < 25) {
                // Cấp 2 (10 - 24 từ): Cam lửa vừa
                levelClass = 'bg-orange-500 text-white font-bold shadow-[0_2px_8px_rgba(249,115,22,0.35)]';
            } else {
                // Cấp 3 (25+ từ): Lửa rực cháy gradient
                levelClass = 'bg-gradient-to-br from-amber-500 via-orange-500 to-[#FF5722] text-white font-bold shadow-[0_3px_12px_rgba(255,87,34,0.45)]';
                flameIcon = '<span class="absolute -top-1 -right-1 text-[10px]">🔥</span>';
            }

            const todayRing = isToday ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface z-10 font-black' : '';

            const tooltipText = `Ngày ${day}/${month}: ${wordsCount > 0 ? `Đã ôn ${wordsCount} từ 🔥` : 'Chưa có phiên học'}`;

            html += `
                <div class="relative group/day aspect-square flex flex-col items-center justify-center rounded-lg text-xs md:text-sm cursor-pointer transition-all duration-200 hover:scale-105 ${levelClass} ${todayRing}"
                     title="${tooltipText}"
                     onclick="HiDashboard.showDayDetail('${dateStr}', ${wordsCount})">
                    <span>${day}</span>
                    ${flameIcon}
                </div>
            `;
        }

        gridEl.innerHTML = html;

        // Cập nhật thống kê tháng
        const activeDaysEl = document.getElementById('flame-active-days');
        if (activeDaysEl) activeDaysEl.textContent = `${activeDaysCount} ngày`;

        const monthWordsEl = document.getElementById('flame-month-words');
        if (monthWordsEl) monthWordsEl.textContent = `${totalWordsThisMonth} từ`;
    }

    /** Chuyển sang tháng trước */
    function prevMonth() {
        _calCurrentDate.setMonth(_calCurrentDate.getMonth() - 1);
        renderFlameCalendar();
    }

    /** Chuyển sang tháng sau */
    function nextMonth() {
        _calCurrentDate.setMonth(_calCurrentDate.getMonth() + 1);
        renderFlameCalendar();
    }

    /** Về tháng hiện tại */
    function resetToCurrentMonth() {
        _calCurrentDate = new Date();
        renderFlameCalendar();
    }

    /** Hiển thị chi tiết ngày khi click */
    function showDayDetail(dateStr, count) {
        const [y, m, d] = dateStr.split('-');
        const formatted = `${d}/${m}/${y}`;
        const msg = count > 0 
            ? `🔥 Ngày ${formatted}: Bạn đã ôn luyện chăm chỉ và hoàn thành ${count} từ vựng!` 
            : `⚪ Ngày ${formatted}: Chưa có phiên học nào trong ngày này.`;
        
        const hintEl = document.getElementById('flame-calendar-hint');
        if (hintEl) {
            hintEl.textContent = msg;
            hintEl.classList.remove('hidden');
            setTimeout(() => { if (hintEl) hintEl.classList.add('hidden'); }, 4000);
        }
    }


    // ==========================================================
    // PHẦN 3: MỤC TIÊU IELTS & ĐẾM NGƯỢC NGÀY THI
    // ==========================================================

    let _userGoal = null;

    /**
     * Render Thẻ Mục tiêu IELTS trên Dashboard.
     */
    async function renderIELTSGoalCard() {
        if (typeof HiDB !== 'undefined' && typeof HiDB.getIELTSGoal === 'function') {
            _userGoal = await HiDB.getIELTSGoal();
        } else {
            try {
                const raw = localStorage.getItem('hi_ielts_goal');
                if (raw) _userGoal = JSON.parse(raw);
            } catch (_) {}
        }

        const unsetCard = document.getElementById('ielts-goal-unset-card');
        const setCard   = document.getElementById('ielts-goal-set-card');

        if (!_userGoal || !_userGoal.examDate) {
            if (unsetCard) unsetCard.classList.remove('hidden');
            if (setCard)   setCard.classList.add('hidden');
            return;
        }

        if (unsetCard) unsetCard.classList.add('hidden');
        if (setCard)   setCard.classList.remove('hidden');

        // 1. Overall Band Badge
        const overallEl = document.getElementById('ielts-goal-overall-badge');
        if (overallEl) overallEl.textContent = `Band ${_userGoal.overall || '7.5'}`;

        // 2. Tính số ngày còn lại đến ngày thi
        const now = new Date();
        now.setHours(0,0,0,0);
        const examDate = new Date(_userGoal.examDate);
        examDate.setHours(0,0,0,0);

        const diffTime = examDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const countdownDaysEl = document.getElementById('ielts-countdown-days');
        const countdownLabelEl = document.getElementById('ielts-countdown-label');
        const examDateEl = document.getElementById('ielts-exam-date-text');

        if (countdownDaysEl) {
            if (diffDays > 0) {
                countdownDaysEl.textContent = diffDays;
                if (countdownLabelEl) countdownLabelEl.textContent = 'Ngày nữa';
            } else if (diffDays === 0) {
                countdownDaysEl.textContent = 'Hôm nay';
                if (countdownLabelEl) countdownLabelEl.textContent = 'Chúc bạn thi tốt! 🎉';
            } else {
                countdownDaysEl.textContent = 'Đã thi';
                if (countdownLabelEl) countdownLabelEl.textContent = `${Math.abs(diffDays)} ngày trước`;
            }
        }

        if (examDateEl) {
            examDateEl.textContent = examDate.toLocaleDateString('vi-VN', {
                day: '2-digit', month: '2-digit', year: 'numeric'
            });
        }

        // 3. Điểm 4 kỹ năng
        const lisEl = document.getElementById('ielts-skill-listening');
        const reaEl = document.getElementById('ielts-skill-reading');
        const wriEl = document.getElementById('ielts-skill-writing');
        const speEl = document.getElementById('ielts-skill-speaking');

        if (lisEl) lisEl.textContent = _userGoal.listening || '—';
        if (reaEl) reaEl.textContent = _userGoal.reading || '—';
        if (wriEl) wriEl.textContent = _userGoal.writing || '—';
        if (speEl) speEl.textContent = _userGoal.speaking || '—';

        // 4. Lời châm ngôn / Slogan
        const mottoEl = document.getElementById('ielts-goal-motto-text');
        if (mottoEl) {
            mottoEl.textContent = _userGoal.motto ? `"${_userGoal.motto}"` : '“Học tập kiên trì, tự tin chinh phục mục tiêu IELTS!”';
        }
    }

    /**
     * Mở Pop-up Modal đặt mục tiêu IELTS.
     */
    function openIELTSGoalModal() {
        const modal = document.getElementById('modal-ielts-goal');
        if (!modal) return;

        // Điền dữ liệu cũ nếu có
        const currentGoal = _userGoal || {};
        const dateInput = document.getElementById('ielts-input-exam-date');
        const lisSelect = document.getElementById('ielts-input-listening');
        const reaSelect = document.getElementById('ielts-input-reading');
        const wriSelect = document.getElementById('ielts-input-writing');
        const speSelect = document.getElementById('ielts-input-speaking');
        const overallInput = document.getElementById('ielts-input-overall');
        const mottoInput = document.getElementById('ielts-input-motto');

        if (dateInput) {
            // Đặt min date là ngày hôm nay
            const todayStr = new Date().toISOString().split('T')[0];
            dateInput.min = todayStr;
            dateInput.value = currentGoal.examDate || '';
        }

        if (lisSelect) lisSelect.value = currentGoal.listening || '7.5';
        if (reaSelect) reaSelect.value = currentGoal.reading || '7.5';
        if (wriSelect) wriSelect.value = currentGoal.writing || '6.5';
        if (speSelect) speSelect.value = currentGoal.speaking || '6.5';
        if (overallInput) overallInput.value = currentGoal.overall || '7.0';
        if (mottoInput) mottoInput.value = currentGoal.motto || '';

        _autoCalculateOverall();
        _updateModalCountdownPreview();

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    /**
     * Đóng Pop-up Modal.
     */
    function closeIELTSGoalModal() {
        const modal = document.getElementById('modal-ielts-goal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }

    /**
     * Tính toán tự động Overall Band theo quy tắc chuẩn IELTS.
     */
    function _autoCalculateOverall() {
        const lis = parseFloat(document.getElementById('ielts-input-listening')?.value || '7.5');
        const rea = parseFloat(document.getElementById('ielts-input-reading')?.value || '7.5');
        const wri = parseFloat(document.getElementById('ielts-input-writing')?.value || '6.5');
        const spe = parseFloat(document.getElementById('ielts-input-speaking')?.value || '6.5');

        const avg = (lis + rea + wri + spe) / 4;
        const intPart = Math.floor(avg);
        const decimal = avg - intPart;

        let rounded = intPart;
        if (decimal < 0.25) {
            rounded = intPart;
        } else if (decimal < 0.75) {
            rounded = intPart + 0.5;
        } else {
            rounded = intPart + 1.0;
        }

        const overallEl = document.getElementById('ielts-input-overall');
        const previewEl = document.getElementById('ielts-calc-preview');

        if (overallEl) overallEl.value = rounded.toFixed(1);
        if (previewEl) previewEl.textContent = `Band ${rounded.toFixed(1)}`;
    }

    /**
     * Cập nhật đếm ngược thử trên Modal khi chọn ngày thi.
     */
    function _updateModalCountdownPreview() {
        const dateInput = document.getElementById('ielts-input-exam-date');
        const previewEl = document.getElementById('ielts-modal-countdown-preview');
        if (!dateInput || !previewEl) return;

        if (!dateInput.value) {
            previewEl.textContent = 'Vui lòng chọn ngày thi để đếm ngược';
            return;
        }

        const now = new Date();
        now.setHours(0,0,0,0);
        const examDate = new Date(dateInput.value);
        examDate.setHours(0,0,0,0);

        const diffDays = Math.ceil((examDate - now) / (1000 * 60 * 60 * 24));
        if (diffDays > 0) {
            previewEl.textContent = `⏳ Sẽ còn ${diffDays} ngày kể từ hôm nay!`;
        } else if (diffDays === 0) {
            previewEl.textContent = `🔥 Ngày thi là hôm nay!`;
        } else {
            previewEl.textContent = `⚠️ Ngày thi đã qua trong quá khứ`;
        }
    }

    /**
     * Lưu mục tiêu IELTS từ Modal.
     */
    async function submitIELTSGoal() {
        const dateInput    = document.getElementById('ielts-input-exam-date');
        const lisSelect    = document.getElementById('ielts-input-listening');
        const reaSelect    = document.getElementById('ielts-input-reading');
        const wriSelect    = document.getElementById('ielts-input-writing');
        const speSelect    = document.getElementById('ielts-input-speaking');
        const overallInput = document.getElementById('ielts-input-overall');
        const mottoInput   = document.getElementById('ielts-input-motto');
        const errEl        = document.getElementById('ielts-goal-error');

        if (!dateInput || !dateInput.value) {
            if (errEl) {
                errEl.textContent = 'Vui lòng chọn ngày thi dự kiến!';
                errEl.classList.remove('hidden');
            }
            return;
        }

        if (errEl) errEl.classList.add('hidden');

        const goalData = {
            examDate:  dateInput.value,
            listening: parseFloat(lisSelect?.value || '7.5'),
            reading:   parseFloat(reaSelect?.value || '7.5'),
            writing:   parseFloat(wriSelect?.value || '6.5'),
            speaking:  parseFloat(speSelect?.value || '6.5'),
            overall:   parseFloat(overallInput?.value || '7.0'),
            motto:     (mottoInput?.value || '').trim(),
            updatedAt: new Date().toISOString()
        };

        if (typeof HiDB !== 'undefined' && typeof HiDB.saveIELTSGoal === 'function') {
            await HiDB.saveIELTSGoal(goalData);
        } else {
            localStorage.setItem('hi_ielts_goal', JSON.stringify(goalData));
        }

        _userGoal = goalData;
        closeIELTSGoalModal();
        await renderIELTSGoalCard();
    }


    // ----------------------------------------------------------
    // RENDER FALLBACK (chưa login / chưa có data)
    // ----------------------------------------------------------

    function renderFallback() {
        const streakEl = document.getElementById(EL.streakBadge);
        if (streakEl) streakEl.textContent = '0 Ngày';

        _showReadyState();

        const dueTextEl = document.getElementById(EL.wordsDueText);
        if (dueTextEl) dueTextEl.textContent = 'Thêm từ vựng mới để bắt đầu hành trình học tập!';

        ['lv1', 'lv2', 'lv3', 'lv4', 'lv5'].forEach(lv => {
            const barEl = document.getElementById(`mem-${lv}-bar`);
            if (barEl) barEl.style.width = '0%';
            const cntEl = document.getElementById(`mem-${lv}-count`);
            if (cntEl) cntEl.textContent = '0';
        });

        const totalEl = document.getElementById(EL.totalWordsLearned);
        if (totalEl) totalEl.textContent = '0';

        renderFlameCalendar();
        renderIELTSGoalCard();
    }

    function _showSkeleton() {
        const streakEl = document.getElementById(EL.streakBadge);
        if (streakEl) streakEl.textContent = '...';

        const dueEl = document.getElementById(EL.wordsDueCount);
        if (dueEl) dueEl.textContent = '—';
    }

    // ----------------------------------------------------------
    // PUBLIC: REFRESH (load stats từ Supabase & render)
    // ----------------------------------------------------------

    async function refresh() {
        try {
            if (typeof HiDB === 'undefined') {
                renderFallback();
                return;
            }

            _showSkeleton();

            const user = await HiDB.getCurrentUser().catch(() => null);
            if (!user) {
                renderFallback();
                return;
            }

            const stats = await HiDB.getDashboardStats();
            _renderStats(stats);

            // Render Lịch giữ lửa & Thẻ mục tiêu IELTS
            await renderFlameCalendar();
            await renderIELTSGoalCard();

        } catch (err) {
            console.error('[HiDashboard] Lỗi khi load stats:', err);
            renderFallback();
        }
    }

    function updateLearningStreak(streakValue) {
        const streakEl = document.querySelector('#learning-streak-container span.font-bold');
        if (streakEl) {
            streakEl.textContent = streakValue;
        }
    }

    // ----------------------------------------------------------
    // PUBLIC API
    // ----------------------------------------------------------
    return {
        refresh,
        renderFallback,
        updateLearningStreak,
        stopCountdown,

        // Flame Calendar
        renderFlameCalendar,
        prevMonth,
        nextMonth,
        resetToCurrentMonth,
        showDayDetail,

        // IELTS Goal
        renderIELTSGoalCard,
        openIELTSGoalModal,
        closeIELTSGoalModal,
        submitIELTSGoal,
        autoCalculateOverall: _autoCalculateOverall,
        updateModalCountdownPreview: _updateModalCountdownPreview,
    };

})();

// Export global helper aliases for inline onclicks
window.openIELTSGoalModal   = () => HiDashboard.openIELTSGoalModal();
window.closeIELTSGoalModal  = () => HiDashboard.closeIELTSGoalModal();
window.submitIELTSGoal      = () => HiDashboard.submitIELTSGoal();
window.ieltsCalcOverall     = () => HiDashboard.autoCalculateOverall();
window.ieltsUpdateCountdown = () => HiDashboard.updateModalCountdownPreview();
window.calPrevMonth         = () => HiDashboard.prevMonth();
window.calNextMonth         = () => HiDashboard.nextMonth();
