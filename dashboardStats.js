// ============================================================
// HI - DASHBOARD STATS  |  dashboardStats.js
// ============================================================
// Kết nối HiDB.getDashboardStats() vào UI Dashboard thật.
// Cập nhật streak, số từ cần ôn, phân bố memory level.
// Bổ sung countdown đếm ngược đến lần ôn tập kế tiếp.
//
// Phụ thuộc: dataLayer.js (HiDB) phải load trước.
//
// Cách dùng:
//   await HiDashboard.refresh();   // load và render toàn bộ
//   HiDashboard.renderFallback();  // hiển thị state trống khi chưa login
//   HiDashboard.stopCountdown();   // dừng countdown (gọi khi rời dashboard)
// ============================================================

const HiDashboard = (() => {

    // ----------------------------------------------------------
    // ELEMENT IDs (khớp với index.html hiện tại)
    // ----------------------------------------------------------
    const EL = {
        // Header streak badge (trong page-dashboard)
        streakBadge:      'dashboard-streak-badge',
        // Số từ cần ôn (trong hero card)
        wordsDueCount:    'dashboard-words-due',
        wordsDueText:     'dashboard-words-due-text',
        // Memory level bars (trong stats card)
        memLv5Bar:        'mem-lv5-bar',
        memLv5Count:      'mem-lv5-count',
        memLv4Bar:        'mem-lv4-bar',
        memLv4Count:      'mem-lv4-count',
        memLv3Bar:        'mem-lv3-bar',
        memLv3Count:      'mem-lv3-count',
        memLv2Bar:        'mem-lv2-bar',
        memLv2Count:      'mem-lv2-count',
        memLv1Bar:        'mem-lv1-bar',
        memLv1Count:      'mem-lv1-count',
        // Tổng từ vựng đã học
        totalWordsLearned: 'dashboard-total-words',
    };

    // ----------------------------------------------------------
    // COUNTDOWN STATE
    // ----------------------------------------------------------
    let _countdownInterval = null;  // setInterval ID
    let _nextReviewTime    = null;  // Date đến lần ôn tiếp theo

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
     *
     * @param {string} lv       - 'lv1'…'lv5'
     * @param {number} count    - số từ ở level này
     * @param {number} maxCount - số từ tối đa trong tất cả levels
     * @param {string} colorCls - Tailwind color class
     */
    function _renderLevelBar(lv, count, maxCount, colorCls) {
        const barEl   = document.getElementById(`mem-${lv}-bar`);
        const countEl = document.getElementById(`mem-${lv}-count`);

        if (!barEl && !countEl) return; // element chưa có trong DOM

        const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;

        if (barEl) {
            // Xóa màu cũ, thêm màu mới + width
            barEl.style.width = pct + '%';
            // Đảm bảo class màu đúng
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

    /** Hiện ready state (có từ cần ôn ngay) */
    function _showReadyState() {
        stopCountdown();
        const ready     = document.getElementById('dash-ready-state');
        const countdown = document.getElementById('dash-countdown-state');
        if (ready)     { ready.classList.remove('hidden');    ready.classList.add('flex'); }
        if (countdown) { countdown.classList.add('hidden');   countdown.classList.remove('flex'); }
    }

    /** Hiện countdown state và bắt đầu đếm ngược đến nextTime */
    function _showCountdownState(nextTime) {
        const ready     = document.getElementById('dash-ready-state');
        const countdown = document.getElementById('dash-countdown-state');
        if (ready)     { ready.classList.add('hidden');        ready.classList.remove('flex'); }
        if (countdown) { countdown.classList.remove('hidden'); countdown.classList.add('flex'); }

        // Hiện nhãn ngày giờ
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

    /**
     * Bắt đầu đếm ngược đến nextTime (Date object).
     * Khi countdown về 0, tự chuyển sang ready state.
     */
    function _startCountdown(nextTime) {
        _nextReviewTime = nextTime;
        stopCountdown(); // Dừng interval cũ nếu có
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
                // Đến giờ ôn tập! Chuyển sang ready state
                _showReadyState();
                const dueTextEl = document.getElementById('dashboard-words-due-text');
                if (dueTextEl) dueTextEl.textContent = 'Đến giờ rồi! Hãy bắt đầu ôn tập ngay.';
            }
        }

        _tick(); // chạy ngay lập tức
        _countdownInterval = setInterval(_tick, 1000);
    }

    /** Dừng countdown (gọi khi rời dashboard) */
    function stopCountdown() {
        if (_countdownInterval) {
            clearInterval(_countdownInterval);
            _countdownInterval = null;
        }
    }

    // ----------------------------------------------------------
    // RENDER FALLBACK (chưa login / chưa có data)
    // ----------------------------------------------------------

    function renderFallback() {
        // Streak = 0
        const streakEl = document.getElementById(EL.streakBadge);
        if (streakEl) streakEl.textContent = '0 Ngày';

        // Hiện ready state (cho phép bấm ôn ngay dù chưa có data)
        _showReadyState();

        const dueTextEl = document.getElementById(EL.wordsDueText);
        if (dueTextEl) dueTextEl.textContent = 'Thêm từ vựng mới để bắt đầu hành trình học tập!';

        // Bars = 0
        ['lv1', 'lv2', 'lv3', 'lv4', 'lv5'].forEach(lv => {
            const barEl = document.getElementById(`mem-${lv}-bar`);
            if (barEl) barEl.style.width = '0%';
            const cntEl = document.getElementById(`mem-${lv}-count`);
            if (cntEl) cntEl.textContent = '0';
        });

        const totalEl = document.getElementById(EL.totalWordsLearned);
        if (totalEl) totalEl.textContent = '0';
    }


    // ----------------------------------------------------------
    // SKELETON LOADING STATE
    // ----------------------------------------------------------

    function _showSkeleton() {
        const streakEl = document.getElementById(EL.streakBadge);
        if (streakEl) streakEl.textContent = '...';

        const dueEl = document.getElementById(EL.wordsDueCount);
        if (dueEl) dueEl.textContent = '—';
    }

    // ----------------------------------------------------------
    // PUBLIC: REFRESH (load stats từ Supabase & render)
    // ----------------------------------------------------------

    /**
     * Load stats từ HiDB và render vào Dashboard.
     * Tự động fallback nếu user chưa đăng nhập hoặc lỗi mạng.
     */
    async function refresh() {
        try {
            if (typeof HiDB === 'undefined') {
                renderFallback();
                return;
            }

            _showSkeleton();

            // Kiểm tra user đã đăng nhập chưa
            const user = await HiDB.getCurrentUser().catch(() => null);
            if (!user) {
                renderFallback();
                return;
            }

            const stats = await HiDB.getDashboardStats();
            _renderStats(stats);

        } catch (err) {
            console.error('[HiDashboard] Lỗi khi load stats:', err);
            renderFallback();
        }
    }

    // ----------------------------------------------------------
    // PUBLIC: CẬP NHẬT STREAK TRÊN LEARNING HEADER
    // ----------------------------------------------------------

    /**
     * Cập nhật số streak trên header của trang learning.
     * Gọi sau khi startSession() để hiện số liệu thật.
     *
     * @param {number} streakValue
     */
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
    };

})();
