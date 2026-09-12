/**
 * bilingualReading.js - Module Đọc Chủ Động & Che Bản Dịch (Curtain Mode) + Đục Lỗ Song Ngữ
 * Thiết kế chuẩn SPA, độc lập và đồng bộ với hệ thống HiVocab.
 * 
 * Tính năng chính:
 * 1. Chế độ Đọc Chủ Động (Active Reading):
 *    - Tách đoạn song ngữ Anh - Việt đối chiếu song song.
 *    - Cột tiếng Việt mặc định bị che mờ (Curtain / Blur Mode); chạm để lật mở từng đoạn.
 *    - Công cụ "Hiện tất cả" / "Che tất cả", cỡ chữ A-/A+, chế độ xem Song ngữ / Chỉ Anh / Chỉ Việt.
 *    - Highlight từ vựng mục tiêu trong bài, click xem nghĩa nhanh & nghe phát âm.
 * 2. Chế độ Bài tập Đục Lỗ Song Ngữ (Bilingual Context Gap-fill):
 *    - Tự động đục lỗ từ vựng trong câu văn ngữ cảnh IELTS trích từ bài đọc.
 *    - Hiển thị gợi ý nghĩa và ngữ cảnh tiếng Việt đối ứng.
 *    - Chấm điểm tương tác tức thì, hỗ trợ phím Enter, gợi ý ký tự đầu, xem đáp án.
 *    - Bảng tổng kết tiến độ và khen thưởng hoàn thành.
 * 3. Bộ điều phối ẩn/hiện nút tính năng trên Taskbar / Sidebar theo chủ đề có bài dịch.
 */

(function(window) {
    'use strict';

    // ── STATE QUẢN LÝ TẬP TRUNG ──────────────────────────────────────
    const state = {
        currentPassage: null,       // { id, title, passageNumber, testName, topicName, contentEn, contentVi, ... }
        currentWords: [],           // Danh sách từ vựng của bài đọc
        activeTab: 'reading',       // 'reading' | 'gap-fill'
        viewMode: 'bilingual',      // 'bilingual' | 'en' | 'vi'
        fontSize: 'base',           // 'sm' | 'base' | 'lg' | 'xl'
        revealedParas: new Set(),   // Set lưu index các đoạn tiếng Việt đã được mở
        highlightVocab: true,       // Bật/tắt highlight từ vựng
        gapItems: [],               // Danh sách câu đục lỗ
        currentGapIndex: 0,         // Index câu hỏi đục lỗ hiện tại đang làm
        gapStats: { total: 0, correct: 0, hinted: 0 }
    };

    // ── TIỆN ÍCH ESCAPE HTML ─────────────────────────────────────────
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // ── KHỞI ĐỘNG CHẾ ĐỘ ĐỌC TỪ TASKBAR / NÚT HỌC ───────────────────
    window.startBilingualReading = async function(passageId) {
        // Xác định passageId mục tiêu
        let targetId = passageId;

        // Nếu không truyền passageId trực tiếp:
        if (!targetId) {
            if (window._currentPassageId && window._currentPassageId !== '__unlinked__') {
                targetId = window._currentPassageId;
            } else if (window._camHierarchy?.tests) {
                // Ưu tiên bài đọc trong test hiện tại
                const currentTest = window._camHierarchy.tests[window._currentTestIndex || 0] || window._camHierarchy.tests[0];
                const p = (currentTest?.passages || []).find(item => item.contentEn || item.id);
                if (p) targetId = p.id;
            }
        }

        if (!targetId) {
            console.warn('[startBilingualReading] Không tìm thấy passageId hợp lệ.');
            return;
        }

        // Mở trang
        await openReadingPage(targetId);
    };

    // ── MỞ TRANG ĐỌC & DỊCH ĐỘC LẬP ────────────────────────────────
    async function openReadingPage(passageId) {
        // Cập nhật navigation
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('bilingual-reading');
        } else {
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById('page-bilingual-reading')?.classList.add('active');
        }

        // Reset state
        state.revealedParas.clear();
        state.activeTab = 'reading';
        updateTabButtonsUI();

        // Hiển thị skeleton loading
        const container = document.getElementById('bilingual-reading-body');
        if (container) {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center py-24 gap-4">
                    <span class="material-symbols-outlined text-primary text-[48px] animate-spin">refresh</span>
                    <p class="text-on-surface-variant text-sm font-medium animate-pulse">Đang chuẩn bị nội dung bài đọc song ngữ...</p>
                </div>`;
        }

        try {
            // 1. Tải thông tin chi tiết bài đọc
            let passage = null;
            if (window._camHierarchy?.tests) {
                for (const t of window._camHierarchy.tests) {
                    const found = (t.passages || []).find(p => p.id === passageId);
                    if (found) {
                        passage = {
                            ...found,
                            testName: t.name,
                            topicName: window._currentTopicName || 'IELTS Actual Tests'
                        };
                        break;
                    }
                }
            }

            // Nếu cache chưa có contentEn hoặc contentVi -> fetch từ Supabase
            if (!passage || (!passage.contentEn && !passage.contentVi)) {
                if (typeof HiDB !== 'undefined' && typeof HiDB.getPassage === 'function') {
                    const fetched = await HiDB.getPassage(passageId);
                    if (fetched) {
                        passage = {
                            id: fetched.id,
                            title: fetched.title,
                            passageNumber: fetched.passage_number,
                            topicLabel: fetched.topic_label,
                            contentEn: fetched.content_en || '',
                            contentVi: fetched.content_vi || '',
                            testName: passage?.testName || window._currentTestName || 'Test',
                            topicName: passage?.topicName || window._currentTopicName || 'IELTS'
                        };
                    }
                }
            }

            // 2. Tải danh sách từ vựng của bài đọc
            let words = [];
            if (typeof HiDB !== 'undefined' && typeof HiDB.getWordsInPassage === 'function') {
                words = await HiDB.getWordsInPassage(passageId);
            }

            state.currentPassage = passage;
            state.currentWords = words || [];

            // Cập nhật Header
            renderReadingHeader();

            // Chuẩn bị bài tập đục lỗ
            prepareGapExercises();

            // Render tab hiện tại
            if (state.activeTab === 'reading') {
                renderActiveReadingView();
            } else {
                renderGapFillView();
            }

        } catch (err) {
            console.error('[openReadingPage] Lỗi tải bài đọc:', err);
            if (container) {
                container.innerHTML = `
                    <div class="max-w-md mx-auto text-center py-20 px-4">
                        <span class="material-symbols-outlined text-error text-[48px] mb-3">error_outline</span>
                        <h3 class="font-bold text-lg text-on-surface mb-2">Không thể tải bài đọc</h3>
                        <p class="text-sm text-on-surface-variant mb-6">${escapeHtml(err.message)}</p>
                        <button onclick="window.closeBilingualReading()" class="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm">Quay lại</button>
                    </div>`;
            }
        }
    }

    // ── RENDER HEADER TRANG ĐỌC & DỊCH ──────────────────────────────
    function renderReadingHeader() {
        const p = state.currentPassage;
        if (!p) return;

        // Title & breadcrumb
        const titleEl = document.getElementById('br-header-title');
        const metaEl  = document.getElementById('br-header-meta');
        if (titleEl) titleEl.textContent = p.title || `Passage ${p.passageNumber || ''}`;
        if (metaEl) {
            const topicTxt = p.topicName || 'IELTS';
            const testTxt = p.testName || 'Test';
            const passTxt = `Passage ${p.passageNumber || ''}`;
            metaEl.textContent = `${topicTxt} · ${testTxt} · ${passTxt}`;
        }

        // Render Dropdown chuyển nhanh Passage
        renderPassageSwitcher();

        // Cập nhật nút quay lại
        const backBtn = document.getElementById('br-back-btn');
        if (backBtn) {
            backBtn.onclick = window.closeBilingualReading;
        }
    }

    // ── DROPDOWN CHUYỂN NHANH BÀI ĐỌC TRONG BỘ ĐỀ ───────────────────
    function renderPassageSwitcher() {
        const container = document.getElementById('br-passage-switcher-menu');
        if (!container || !window._camHierarchy?.tests) return;

        const currentPassageId = state.currentPassage?.id;
        let html = '';

        window._camHierarchy.tests.forEach(test => {
            if (!test.passages || test.passages.length === 0) return;
            html += `<div class="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-outline bg-surface-container-high/60 rounded-md my-1">${escapeHtml(test.name)}</div>`;
            
            test.passages.forEach(p => {
                const isActive = p.id === currentPassageId;
                const hasReading = !!(p.contentEn && p.contentVi);
                html += `
                <button onclick="window.switchReadingPassage('${p.id}')"
                    class="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between gap-2 transition-colors ${
                        isActive
                            ? 'bg-primary text-on-primary font-bold'
                            : 'text-on-surface hover:bg-surface-container-high'
                    }">
                    <div class="truncate">
                        <span class="opacity-80">P${p.passageNumber}:</span>
                        <span>${escapeHtml(p.title || `Passage ${p.passageNumber}`)}</span>
                    </div>
                    ${hasReading ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary uppercase font-bold shrink-0">Song ngữ</span>' : ''}
                </button>`;
            });
        });

        container.innerHTML = html || '<p class="text-xs text-on-surface-variant p-3 text-center">Không có bài đọc khác</p>';
    }

    // Toggle menu chuyển bài đọc
    window.togglePassageSwitcher = function() {
        const menu = document.getElementById('br-passage-switcher-dropdown');
        if (!menu) return;
        const isHidden = menu.classList.contains('hidden');
        if (isHidden) {
            menu.classList.remove('hidden');
            setTimeout(() => {
                document.addEventListener('click', closeSwitcherOutside, { once: true });
            }, 0);
        } else {
            menu.classList.add('hidden');
        }
    };

    function closeSwitcherOutside(e) {
        const dropdown = document.getElementById('br-passage-switcher-dropdown');
        const toggleBtn = document.getElementById('br-passage-switcher-btn');
        if (dropdown && !dropdown.contains(e.target) && !toggleBtn?.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    }

    // Chuyển bài đọc
    window.switchReadingPassage = async function(newPassageId) {
        const dropdown = document.getElementById('br-passage-switcher-dropdown');
        if (dropdown) dropdown.classList.add('hidden');
        if (newPassageId && newPassageId !== state.currentPassage?.id) {
            window._currentPassageId = newPassageId;
            await openReadingPage(newPassageId);
        }
    };

    // ── CHUYỂN ĐỔI TAB: ĐỌC CHỦ ĐỘNG VS ĐỤC LỖ SONG NGỮ ─────────────
    window.switchBilingualTab = function(tabName) {
        state.activeTab = tabName;
        updateTabButtonsUI();
        if (tabName === 'reading') {
            renderActiveReadingView();
        } else {
            renderGapFillView();
        }
    };

    function updateTabButtonsUI() {
        const isReading = state.activeTab === 'reading';
        const btnReading = document.getElementById('br-tab-reading');
        const btnGap = document.getElementById('br-tab-gap');
        const toolsReading = document.getElementById('br-reading-tools');

        if (btnReading) {
            btnReading.className = isReading
                ? 'flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs sm:text-sm shadow-sm transition-all'
                : 'flex items-center gap-1.5 px-4 py-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-semibold text-xs sm:text-sm transition-all';
        }
        if (btnGap) {
            btnGap.className = !isReading
                ? 'flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs sm:text-sm shadow-sm transition-all'
                : 'flex items-center gap-1.5 px-4 py-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-semibold text-xs sm:text-sm transition-all';
        }
        // Thanh công cụ che/hiện bản dịch chỉ hiển thị khi ở tab Đọc
        if (toolsReading) {
            if (isReading) {
                toolsReading.classList.remove('hidden');
                toolsReading.classList.add('flex');
            } else {
                toolsReading.classList.add('hidden');
                toolsReading.classList.remove('flex');
            }
        }
    }

    // ── TAB 1: RENDER CHẾ ĐỘ ĐỌC CHỦ ĐỘNG & CHE BẢN DỊCH ────────────
    function renderActiveReadingView() {
        const container = document.getElementById('bilingual-reading-body');
        if (!container) return;

        const p = state.currentPassage;
        if (!p || (!p.contentEn && !p.contentVi)) {
            container.innerHTML = `
                <div class="text-center py-20 text-on-surface-variant max-w-md mx-auto">
                    <span class="material-symbols-outlined text-[52px] opacity-30 mb-3 block">menu_book</span>
                    <h3 class="font-bold text-lg text-on-surface mb-1">Chưa có nội dung bài đọc</h3>
                    <p class="text-sm">Phần bài đọc này hiện chưa có dữ liệu song ngữ.</p>
                </div>`;
            return;
        }

        const enText = (p.contentEn || '').trim();
        const viText = (p.contentVi || '').trim();

        // Tách các đoạn văn (hỗ trợ cả \r\n\r\n và \n\n)
        const enParas = enText ? enText.split(/\n\s*\n|\r\n\r\n/).map(s => s.trim()).filter(Boolean) : [];
        const viParas = viText ? viText.split(/\n\s*\n|\r\n\r\n/).map(s => s.trim()).filter(Boolean) : [];
        const totalParas = Math.max(enParas.length, viParas.length);

        // Font size class mapping
        const fontClassMap = {
            'sm': 'text-sm leading-relaxed',
            'base': 'text-base leading-relaxed',
            'lg': 'text-lg leading-loose',
            'xl': 'text-xl leading-loose'
        };
        const fontClass = fontClassMap[state.fontSize] || 'text-base leading-relaxed';

        const mode = state.viewMode; // 'bilingual' | 'en' | 'vi'

        // Render Toolbar phụ trợ (Hiện/Che tất cả, Lọc xem)
        let html = `
        <div class="max-w-6xl mx-auto w-full pb-20">
            <!-- Thông tin tiêu đề bài đọc -->
            <div class="bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant/20 rounded-2xl p-5 md:p-6 mb-6 soft-shadow">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div class="flex items-center gap-2 mb-2">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-primary/10 text-primary">
                                IELTS Reading Passage ${p.passageNumber || ''}
                            </span>
                            ${p.topicLabel ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-surface-container text-on-surface-variant">${escapeHtml(p.topicLabel)}</span>` : ''}
                        </div>
                        <h2 class="text-xl md:text-2xl font-bold text-on-surface leading-tight">${escapeHtml(p.title || `Passage ${p.passageNumber}`)}</h2>
                        <p class="text-xs text-on-surface-variant mt-1">
                            ${totalParas} đoạn văn · ${state.currentWords.length} từ vựng trọng tâm trong bài
                        </p>
                    </div>

                    <!-- Nút thao tác nhanh toàn bài -->
                    <div class="flex items-center gap-2 flex-wrap">
                        <button onclick="window.toggleAllParas(true)"
                            class="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-primary/10 text-on-surface-variant hover:text-primary text-xs font-semibold flex items-center gap-1 transition-colors" title="Mở toàn bộ bản dịch tiếng Việt">
                            <span class="material-symbols-outlined text-[16px]">visibility</span>
                            <span>Hiện tất cả</span>
                        </button>
                        <button onclick="window.toggleAllParas(false)"
                            class="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-secondary/10 text-on-surface-variant hover:text-secondary text-xs font-semibold flex items-center gap-1 transition-colors" title="Che toàn bộ bản dịch tiếng Việt">
                            <span class="material-symbols-outlined text-[16px]">visibility_off</span>
                            <span>Che tất cả</span>
                        </button>
                    </div>
                </div>

                <!-- Hướng dẫn chế độ Curtain Mode -->
                <div class="mt-4 pt-3 border-t border-outline-variant/20 flex items-center gap-2 text-xs text-on-surface-variant">
                    <span class="material-symbols-outlined text-[18px] text-primary shrink-0">info</span>
                    <span><strong>Mẹo học chủ động:</strong> Cột tiếng Việt mặc định được che mờ. Hãy đọc đoạn văn tiếng Anh trước và tự dịch trong đầu, sau đó chạm vào bản dịch để đối chiếu.</span>
                </div>
            </div>

            <!-- Danh sách các đoạn văn -->
            <div class="flex flex-col gap-5">`;

        for (let i = 0; i < totalParas; i++) {
            const enP = enParas[i] || '';
            const viP = viParas[i] || '';
            const isRevealed = state.revealedParas.has(i);

            // Xử lý highlight từ vựng trong tiếng Anh
            const enHtml = formatEnglishParagraph(enP);
            const viHtml = escapeHtml(viP);

            // Xác định nhãn đoạn văn (Paragraph A, B, C... nếu có)
            const paraLabel = getParagraphLabel(enP, i);

            if (mode === 'en') {
                // Chỉ tiếng Anh
                html += `
                <div class="bg-surface-container-lowest/90 backdrop-blur-sm border border-outline-variant/20 rounded-2xl p-5 md:p-6 soft-shadow">
                    <div class="flex items-center justify-between mb-2.5">
                        <span class="text-xs font-bold text-primary uppercase tracking-wider">${paraLabel}</span>
                    </div>
                    <div class="text-on-surface font-normal text-justify ${fontClass}">${enHtml}</div>
                </div>`;
            } else if (mode === 'vi') {
                // Chỉ tiếng Việt
                html += `
                <div class="bg-surface-container-lowest/90 backdrop-blur-sm border border-outline-variant/20 rounded-2xl p-5 md:p-6 soft-shadow">
                    <div class="flex items-center justify-between mb-2.5">
                        <span class="text-xs font-bold text-secondary uppercase tracking-wider">${paraLabel} · Bản dịch</span>
                    </div>
                    <div class="text-on-surface font-normal text-justify ${fontClass}">${viHtml}</div>
                </div>`;
            } else {
                // Chế độ Song Ngữ: Parallel Columns (Desktop) & Stacked Cards (Mobile) với Curtain Mode
                html += `
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-surface-container-lowest/90 backdrop-blur-sm border border-outline-variant/20 rounded-2xl p-4 md:p-6 soft-shadow hover:border-primary/30 transition-all">
                    <!-- Cột tiếng Anh -->
                    <div class="flex flex-col justify-between">
                        <div>
                            <div class="flex items-center justify-between mb-2 pb-1 border-b border-outline-variant/15">
                                <span class="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                                    <span class="w-2 h-2 rounded-full bg-primary"></span>
                                    ${paraLabel} · English
                                </span>
                            </div>
                            <div class="text-on-surface font-normal text-justify ${fontClass}">${enHtml}</div>
                        </div>
                    </div>

                    <!-- Cột tiếng Việt: CURTAIN / BLUR MODE -->
                    <div class="relative overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-low/40 p-4 transition-all flex flex-col justify-between group/card">
                        <div>
                            <div class="flex items-center justify-between mb-2 pb-1 border-b border-outline-variant/15">
                                <span class="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                                    <span class="material-symbols-outlined text-[15px]">translate</span>
                                    Bản dịch đối ứng
                                </span>
                                <button onclick="window.toggleParaCurtain(${i})"
                                    class="text-xs font-bold px-2 py-0.5 rounded-lg text-primary hover:bg-primary/10 transition-colors flex items-center gap-1">
                                    <span class="material-symbols-outlined text-[15px]">${isRevealed ? 'visibility_off' : 'visibility'}</span>
                                    <span>${isRevealed ? 'Che lại' : 'Hiện dịch'}</span>
                                </button>
                            </div>

                            <!-- Khối chữ: áp dụng filter blur khi chưa mở -->
                            <div class="transition-all duration-300 ${isRevealed ? 'filter-none select-text' : 'select-none blur-md opacity-40 pointer-events-none'}">
                                <div class="text-on-surface font-normal text-justify ${fontClass}">${viHtml || '<span class="italic text-outline">Đang cập nhật bản dịch...</span>'}</div>
                            </div>
                        </div>

                        <!-- Overlay rèm che khi chưa mở: Click vào bất kỳ đâu trên rèm để mở -->
                        ${!isRevealed ? `
                        <div onclick="window.toggleParaCurtain(${i})"
                            class="absolute inset-0 z-10 bg-surface/40 backdrop-blur-[2px] flex items-center justify-center cursor-pointer hover:bg-surface/20 transition-all">
                            <div class="bg-surface-container-highest/90 text-on-surface px-4 py-2 rounded-full shadow-lg border border-outline-variant/30 flex items-center gap-2 text-xs font-bold group-hover/card:scale-105 transition-transform">
                                <span class="material-symbols-outlined text-[18px] text-primary">visibility</span>
                                <span>Chạm để lật mở bản dịch</span>
                            </div>
                        </div>` : ''}
                    </div>
                </div>`;
            }
        }

        html += `</div></div>`;
        container.innerHTML = html;
    }

    // Helper: Trích xuất nhãn Paragraph A, B, C nếu đầu câu có
    function getParagraphLabel(paraText, index) {
        const match = paraText.match(/^(Paragraph\s+[A-Z0-9]+|Section\s+[A-Z0-9]+|[A-Z]\.\s+)/i);
        if (match) return match[1].replace(/\.$/, '').trim();
        return `Đoạn ${String.fromCharCode(65 + index) || (index + 1)}`;
    }

    // Helper: Highlight các từ vựng mục tiêu trong bài đọc tiếng Anh
    function formatEnglishParagraph(paraText) {
        if (!paraText) return '';
        if (!state.highlightVocab || !state.currentWords || state.currentWords.length === 0) {
            return escapeHtml(paraText);
        }

        // Tạo map từ vựng dạng lowercase -> word object
        const wordMap = new Map();
        state.currentWords.forEach(w => {
            if (w.word && w.word.trim().length >= 3) {
                wordMap.set(w.word.trim().toLowerCase(), w);
            }
        });

        // Sắp xếp các từ theo độ dài giảm dần để ưu tiên match cụm từ trước
        const sortedWords = Array.from(wordMap.keys()).sort((a, b) => b.length - a.length);
        if (sortedWords.length === 0) return escapeHtml(paraText);

        // Escape các ký tự đặc biệt cho Regex
        const escapedTokens = sortedWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        const regex = new RegExp(`\\b(${escapedTokens.join('|')})(?:s|es|ed|ing)?\\b`, 'gi');

        // Phân tách text an toàn tránh XSS
        let lastIdx = 0;
        let result = '';
        let match;

        while ((match = regex.exec(paraText)) !== null) {
            // Phần text thường phía trước
            result += escapeHtml(paraText.substring(lastIdx, match.index));

            const matchedWord = match[0];
            const baseKey = match[1].toLowerCase();
            const wordObj = wordMap.get(baseKey) || {};

            const wordEsc = escapeHtml(wordObj.word || matchedWord);
            const posEsc = escapeHtml(wordObj.pos || '');
            const ipaEsc = escapeHtml(wordObj.phonetic || '');
            const meaningEsc = escapeHtml(wordObj.meaning || '');

            result += `<span class="inline-flex items-baseline px-1.5 py-0.5 mx-0.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary font-bold border-b-2 border-primary/40 cursor-pointer transition-all active:scale-95"
                onclick="event.stopPropagation(); window.showReadingVocabTooltip('${wordEsc}', '${posEsc}', '${ipaEsc}', '${meaningEsc}', event)"
                title="Nhấp để xem nghĩa & phát âm">${escapeHtml(matchedWord)}</span>`;

            lastIdx = regex.lastIndex;
        }

        result += escapeHtml(paraText.substring(lastIdx));
        return result;
    }

    // ── TƯƠNG TÁC CHE / MỞ BẢN DỊCH ──────────────────────────────────
    window.toggleParaCurtain = function(idx) {
        if (state.revealedParas.has(idx)) {
            state.revealedParas.delete(idx);
        } else {
            state.revealedParas.add(idx);
        }
        renderActiveReadingView();
    };

    window.toggleAllParas = function(revealAll) {
        const p = state.currentPassage;
        if (!p) return;
        const totalParas = Math.max(
            (p.contentEn || '').split(/\n\s*\n|\r\n\r\n/).filter(Boolean).length,
            (p.contentVi || '').split(/\n\s*\n|\r\n\r\n/).filter(Boolean).length
        );

        if (revealAll) {
            for (let i = 0; i < totalParas; i++) state.revealedParas.add(i);
        } else {
            state.revealedParas.clear();
        }
        renderActiveReadingView();
    };

    // ── BỘ LỌC CHẾ ĐỘ XEM: SONG NGỮ / CHỈ ANH / CHỈ VIỆT ────────────
    window.setBilingualViewMode = function(mode) {
        state.viewMode = mode;
        ['bilingual', 'en', 'vi'].forEach(m => {
            const btn = document.getElementById(`br-view-${m}`);
            if (btn) {
                btn.className = m === mode
                    ? 'px-3 py-1.5 rounded-lg bg-primary text-on-primary font-bold text-xs shadow-sm transition-all'
                    : 'px-3 py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface text-xs font-semibold transition-all';
            }
        });
        renderActiveReadingView();
    };

    // ── THAY ĐỔI CỠ CHỮ ──────────────────────────────────────────────
    window.changeBilingualFontSize = function(delta) {
        const sizes = ['sm', 'base', 'lg', 'xl'];
        let currIdx = sizes.indexOf(state.fontSize);
        if (currIdx === -1) currIdx = 1;
        const newIdx = Math.max(0, Math.min(sizes.length - 1, currIdx + delta));
        state.fontSize = sizes[newIdx];
        renderActiveReadingView();
    };

    // ── TOOLTIP TRA TỪ NHANH KHI ĐỌC ─────────────────────────────────
    window.showReadingVocabTooltip = function(word, pos, phonetic, meaning, event) {
        let tooltip = document.getElementById('reading-vocab-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'reading-vocab-tooltip';
            tooltip.className = 'fixed z-[9999] bg-surface/95 backdrop-blur-xl border border-outline-variant/30 rounded-2xl p-4 shadow-2xl max-w-xs sm:max-w-sm fade-in';
            document.body.appendChild(tooltip);
        }

        tooltip.innerHTML = `
            <div class="flex items-start justify-between gap-3 mb-2">
                <div class="flex items-center gap-2 flex-wrap">
                    <h4 class="font-bold text-primary text-lg">${escapeHtml(word)}</h4>
                    ${pos ? `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">${escapeHtml(pos)}</span>` : ''}
                </div>
                <button onclick="window.closeReadingVocabTooltip()" class="text-outline hover:text-on-surface p-1 rounded-full">
                    <span class="material-symbols-outlined text-[18px]">close</span>
                </button>
            </div>
            ${phonetic ? `<p class="font-mono text-xs text-outline mb-2">${escapeHtml(phonetic)}</p>` : ''}
            <div class="bg-surface-container-low/70 rounded-xl p-3 mb-3">
                <p class="text-xs font-bold text-outline uppercase tracking-wider mb-1">Nghĩa tiếng Việt</p>
                <p class="text-sm font-semibold text-on-surface">${escapeHtml(meaning)}</p>
            </div>
            <div class="flex items-center gap-2">
                <button onclick="window.HiSpeak && window.HiSpeak('${escapeHtml(word)}')"
                    class="flex-1 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-colors">
                    <span class="material-symbols-outlined text-[18px]">volume_up</span>
                    <span>Phát âm</span>
                </button>
                <button onclick="window.closeReadingVocabTooltip()"
                    class="px-4 py-2 rounded-xl bg-surface-container text-on-surface-variant hover:text-on-surface font-semibold text-xs transition-colors">
                    Đóng
                </button>
            </div>`;

        // Tọa độ hiển thị thông minh tránh tràn màn hình
        const x = Math.min(Math.max(16, event.clientX - 100), window.innerWidth - 320);
        const y = Math.min(event.clientY + 20, window.innerHeight - 200);

        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
        tooltip.style.display = 'block';

        // Tự động đóng khi bấm ra ngoài
        setTimeout(() => {
            document.addEventListener('click', closeTooltipOutside, { once: true });
        }, 0);
    };

    function closeTooltipOutside(e) {
        const tooltip = document.getElementById('reading-vocab-tooltip');
        if (tooltip && !tooltip.contains(e.target)) {
            tooltip.style.display = 'none';
        }
    }

    window.closeReadingVocabTooltip = function() {
        const tooltip = document.getElementById('reading-vocab-tooltip');
        if (tooltip) tooltip.style.display = 'none';
    };

    // ── TAB 2: BÀI TẬP ĐỤC LỖ SONG NGỮ (GAP-FILL IN CONTEXT) ──────────
    function prepareGapExercises() {
        const words = state.currentWords || [];
        const enContent = state.currentPassage?.contentEn || '';

        const items = [];
        words.forEach((w, idx) => {
            if (!w.word) return;

            // Câu ngữ cảnh: ưu tiên exampleSentence đã trích sẵn, nếu không tìm từ bài đọc
            let sentence = w.exampleSentence;
            if (!sentence && enContent) {
                const regex = new RegExp(`([^.!?]*\\b${escapeRegex(w.word)}\\b[^.!?]*[.!?])`, 'i');
                const m = enContent.match(regex);
                if (m) sentence = m[1].trim();
            }

            if (!sentence) {
                sentence = `In this passage, the term "${w.word}" plays a significant role in understanding the topic.`;
            }

            // Tìm vị trí của từ trong câu
            const wordRegex = new RegExp(`\\b(${escapeRegex(w.word)})(s|es|ed|ing)?\\b`, 'i');
            const match = sentence.match(wordRegex);

            let before = sentence;
            let targetBlank = w.word;
            let after = '';

            if (match && match.index !== undefined) {
                before = sentence.substring(0, match.index);
                targetBlank = match[0];
                after = sentence.substring(match.index + match[0].length);
            }

            items.push({
                index: idx,
                wordId: w.id || idx,
                targetWord: w.word,
                blankWord: targetBlank,
                pos: w.pos || '',
                phonetic: w.phonetic || '',
                meaning: w.meaning || '',
                sentenceBefore: before,
                sentenceAfter: after,
                userAnswer: '',
                isCorrect: false,
                isRevealed: false,
                hintLevel: 0
            });
        });

        state.gapItems = items;
        state.currentGapIndex = 0;
        state.gapStats = {
            total: items.length,
            correct: 0,
            hinted: 0
        };
    }

    function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function renderGapFillView() {
        const container = document.getElementById('bilingual-reading-body');
        if (!container) return;

        const items = state.gapItems || [];
        if (items.length === 0) {
            container.innerHTML = `
                <div class="text-center py-20 text-on-surface-variant max-w-md mx-auto">
                    <span class="material-symbols-outlined text-[52px] opacity-30 mb-3 block">edit_note</span>
                    <h3 class="font-bold text-lg text-on-surface mb-1">Chưa có bài tập đục lỗ</h3>
                    <p class="text-sm">Bài đọc này hiện chưa có danh sách từ vựng trọng tâm để tạo bài tập.</p>
                </div>`;
            return;
        }

        const total = items.length;
        const correctCount = items.filter(it => it.isCorrect).length;
        const progressPct = Math.round((correctCount / total) * 100);

        // Đảm bảo currentGapIndex nằm trong giới hạn hợp lệ
        if (typeof state.currentGapIndex !== 'number' || state.currentGapIndex < 0 || state.currentGapIndex >= total) {
            const firstUnfinished = items.findIndex(it => !it.isCorrect);
            state.currentGapIndex = firstUnfinished !== -1 ? firstUnfinished : 0;
        }

        // Màn hình hoàn thành nếu tất cả các câu đã trả lời đúng
        if (correctCount === total && total > 0) {
            if (!state._completeSoundPlayed) {
                state._completeSoundPlayed = true;
                window.HiSound && window.HiSound.playComplete();
            }
            container.innerHTML = `
            <div class="max-w-2xl mx-auto w-full pb-20 fade-in">
                <div class="bg-gradient-to-br from-green-500/20 via-surface to-primary/20 border-2 border-green-500/40 rounded-3xl p-8 md:p-10 text-center soft-shadow mt-6">
                    <span class="text-6xl mb-4 block animate-bounce">🎉</span>
                    <h3 class="text-2xl md:text-3xl font-bold text-on-surface mb-2">Xuất sắc! Bạn đã hoàn thành</h3>
                    <p class="text-sm md:text-base text-on-surface-variant mb-6 max-w-md mx-auto">
                        Bạn đã trả lời chính xác toàn bộ <strong>${total} / ${total} câu</strong> đục lỗ trong ngữ cảnh bài đọc IELTS này.
                    </p>
                    <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button onclick="window.switchBilingualTab('reading')" class="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-md hover:bg-surface-tint active:scale-95 transition-all flex items-center justify-center gap-2">
                            <span class="material-symbols-outlined text-[18px]">menu_book</span>
                            <span>Đọc lại bài đọc</span>
                        </button>
                        <button onclick="window.resetGapExercises()" class="w-full sm:w-auto px-6 py-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-2">
                            <span class="material-symbols-outlined text-[18px]">refresh</span>
                            <span>Làm lại bài tập</span>
                        </button>
                    </div>
                </div>
            </div>`;
            return;
        }

        const idx = state.currentGapIndex;
        const item = items[idx];
        const isDone = item.isCorrect;
        const isRevealed = item.isRevealed;

        // Gợi ý chữ cái đầu
        let hintDisplay = '';
        if (item.hintLevel > 0) {
            const letters = item.blankWord.slice(0, item.hintLevel);
            const underscores = '_ '.repeat(Math.max(0, item.blankWord.length - item.hintLevel));
            hintDisplay = `${letters} ${underscores}`.trim();
        }

        let html = `
        <div class="max-w-3xl mx-auto w-full pb-20">
            <!-- Header thống kê bài tập & Dải chọn câu hỏi (Stepper) -->
            <div class="bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant/20 rounded-2xl p-5 md:p-6 mb-6 soft-shadow">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-tertiary-container/30 text-tertiary mb-2">
                            Luyện từ trong ngữ cảnh bài đọc
                        </span>
                        <h2 class="text-xl md:text-2xl font-bold text-on-surface leading-tight">Bài tập Đục Lỗ Song Ngữ</h2>
                        <p class="text-xs text-on-surface-variant mt-1">
                            Điền từ còn thiếu vào câu văn IELTS gốc dựa vào gợi ý nghĩa tiếng Việt.
                        </p>
                    </div>

                    <div class="flex items-center gap-3">
                        <div class="text-right">
                            <span class="text-xs text-on-surface-variant block">Đã hoàn thành</span>
                            <span class="text-lg font-bold text-primary">${correctCount} / ${total} câu</span>
                        </div>
                        <button onclick="window.resetGapExercises()" class="p-2 rounded-xl bg-surface-container hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-colors" title="Làm lại tất cả">
                            <span class="material-symbols-outlined text-[20px]">refresh</span>
                        </button>
                    </div>
                </div>

                <!-- Progress Bar -->
                <div class="mt-4">
                    <div class="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                        <div class="bg-primary h-2 rounded-full transition-all duration-500" style="width: ${progressPct}%"></div>
                    </div>
                </div>

                <!-- Dải nút chọn câu hỏi nhanh (Stepper) -->
                <div class="mt-4 pt-3 border-t border-outline-variant/15 flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
                    <span class="text-[11px] font-bold text-outline uppercase tracking-wider mr-1 shrink-0">Câu:</span>
                    ${items.map((it, i) => {
                        const isCurr = i === idx;
                        const itDone = it.isCorrect;
                        const itRev  = it.isRevealed;
                        let btnClass = '';
                        if (isCurr) {
                            btnClass = 'bg-primary text-on-primary font-bold shadow-sm ring-2 ring-primary/40 ring-offset-1';
                        } else if (itDone) {
                            btnClass = 'bg-green-600 text-white font-bold';
                        } else if (itRev) {
                            btnClass = 'bg-yellow-500/20 text-yellow-800 font-semibold border border-yellow-500/40';
                        } else {
                            btnClass = 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-medium';
                        }
                        return `
                            <button onclick="window.goToGapItem(${i})"
                                class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs flex items-center justify-center shrink-0 transition-all active:scale-95 ${btnClass}"
                                title="Chuyển đến câu ${i + 1}">
                                ${itDone && !isCurr ? '<span class="material-symbols-outlined text-[15px]">check</span>' : (i + 1)}
                            </button>`;
                    }).join('')}
                </div>
            </div>

            <!-- Card Pop-up hiển thị câu hiện tại -->
            <div id="gap-card-${idx}" class="bg-surface-container-lowest/90 backdrop-blur-xl border ${
                isDone
                    ? 'border-green-500/40 bg-green-500/5'
                    : isRevealed
                    ? 'border-yellow-500/40 bg-yellow-500/5'
                    : 'border-outline-variant/20'
            } rounded-2xl p-6 sm:p-8 soft-shadow transition-all fade-in">

                <!-- Tiêu đề câu & STT -->
                <div class="flex items-center justify-between mb-4 pb-3 border-b border-outline-variant/15">
                    <div class="flex items-center gap-2.5">
                        <span class="w-8 h-8 rounded-xl ${isDone ? 'bg-green-600 text-white' : 'bg-primary/10 text-primary'} text-sm font-bold flex items-center justify-center shrink-0 shadow-sm">
                            ${isDone ? '<span class="material-symbols-outlined text-[18px]">check</span>' : (idx + 1)}
                        </span>
                        <div>
                            <span class="text-xs font-bold text-outline uppercase tracking-wider block">Câu hỏi ${idx + 1} / ${total}</span>
                            <span class="text-[11px] text-on-surface-variant font-medium">Luyện từ trong ngữ cảnh</span>
                        </div>
                    </div>

                    <div class="flex items-center gap-2">
                        ${item.pos ? `<span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant">${escapeHtml(item.pos)}</span>` : ''}
                        ${item.phonetic ? `<span class="font-mono text-xs text-outline">${escapeHtml(item.phonetic)}</span>` : ''}
                        <button onclick="window.HiSpeak && window.HiSpeak('${escapeHtml(item.targetWord)}')" class="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all active:scale-95" title="Nghe phát âm">
                            <span class="material-symbols-outlined text-[20px]">volume_up</span>
                        </button>
                    </div>
                </div>

                <!-- Câu văn tiếng Anh có ô trống điền từ -->
                <div class="text-on-surface text-lg sm:text-xl leading-relaxed my-6 font-normal">
                    <span>${escapeHtml(item.sentenceBefore)}</span>

                    <span class="inline-block align-baseline mx-1.5">
                        <input id="gap-input-${idx}"
                            type="text"
                            value="${escapeHtml(item.userAnswer || (isDone || isRevealed ? item.blankWord : ''))}"
                            ${isDone ? 'disabled' : ''}
                            autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false"
                            onkeydown="if(event.key==='Enter') window.checkGapItem(${idx})"
                            class="px-3.5 py-1.5 rounded-xl text-center font-bold text-base sm:text-xl border-2 transition-all outline-none ${
                                isDone
                                    ? 'border-green-600 bg-green-100 text-green-800'
                                    : isRevealed
                                    ? 'border-yellow-500 bg-yellow-100 text-yellow-800'
                                    : 'border-primary/40 bg-surface-container-low focus:border-primary focus:bg-surface text-on-surface focus:shadow-md'
                            }"
                            style="min-width: ${Math.max(110, item.blankWord.length * 15)}px; max-width: 260px;"
                            placeholder="${hintDisplay || '...'}" />
                    </span>

                    <span>${escapeHtml(item.sentenceAfter)}</span>
                </div>

                <!-- Gợi ý nghĩa tiếng Việt đối chiếu -->
                <div class="bg-surface-container-low/70 rounded-xl p-4 mb-6 flex items-start gap-2.5 text-xs sm:text-sm border border-outline-variant/20">
                    <span class="material-symbols-outlined text-[20px] text-tertiary shrink-0 mt-0.5">lightbulb</span>
                    <div>
                        <span class="text-outline font-semibold">Gợi ý nghĩa:</span>
                        <span class="font-bold text-on-surface ml-1">${escapeHtml(item.meaning)}</span>
                        ${hintDisplay ? `<span class="block mt-1.5 text-xs text-primary font-mono font-bold">Ký tự gợi ý: ${hintDisplay}</span>` : ''}
                    </div>
                </div>

                <!-- Feedback khi làm đúng -->
                ${isDone ? `
                <div class="mb-5 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-700 flex items-center justify-between text-xs sm:text-sm font-bold fade-in">
                    <span class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-[20px]">check_circle</span>
                        <span>Chính xác! Từ cần điền là: <strong>${escapeHtml(item.blankWord)}</strong></span>
                    </span>
                    <button onclick="window.nextGapItem(${idx})" class="px-3 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-1">
                        <span>Câu tiếp</span>
                        <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                </div>` : ''}

                <!-- Các nút hành động cho từng câu -->
                <div class="flex items-center justify-between gap-3 pt-3 border-t border-outline-variant/15 flex-wrap">
                    <!-- Trái: Gợi ý và Đáp án -->
                    <div class="flex items-center gap-2">
                        ${!isDone ? `
                        <button onclick="window.hintGapItem(${idx})" class="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-primary/10 text-on-surface-variant hover:text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors border border-outline-variant/20">
                            <span class="material-symbols-outlined text-[16px]">tips_and_updates</span>
                            <span>Gợi ý (${item.hintLevel}/${item.blankWord.length})</span>
                        </button>
                        <button onclick="window.revealGapItem(${idx})" class="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant text-xs font-semibold flex items-center gap-1.5 transition-colors border border-outline-variant/20">
                            <span class="material-symbols-outlined text-[16px]">visibility</span>
                            <span>Xem đáp án</span>
                        </button>` : ''}
                    </div>

                    <!-- Phải: Điều hướng trước/sau và Kiểm tra -->
                    <div class="flex items-center gap-2">
                        <button onclick="window.prevGapItem(${idx})" ${idx === 0 ? 'disabled' : ''}
                            class="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                                idx === 0 ? 'opacity-40 cursor-not-allowed text-outline' : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant active:scale-95'
                            }">
                            <span class="material-symbols-outlined text-[16px]">arrow_back</span>
                            <span>Câu trước</span>
                        </button>

                        ${!isDone ? `
                        <button onclick="window.checkGapItem(${idx})"
                            class="px-6 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs sm:text-sm hover:bg-surface-tint active:scale-95 transition-all shadow-sm flex items-center gap-1.5">
                            <span>Kiểm tra</span>
                            <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </button>` : `
                        <button onclick="window.nextGapItem(${idx})"
                            class="px-6 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs sm:text-sm hover:bg-surface-tint active:scale-95 transition-all shadow-sm flex items-center gap-1.5">
                            <span>Tiếp tục</span>
                            <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </button>`}
                    </div>
                </div>

            </div>
        </div>`;

        container.innerHTML = html;

        // Auto focus vào ô input câu hiện tại
        setTimeout(() => {
            const inp = document.getElementById(`gap-input-${idx}`);
            if (inp && !inp.disabled) {
                inp.focus();
                inp.select();
            }
        }, 100);
    }

    // Điều hướng câu
    window.goToGapItem = function(targetIdx) {
        const total = (state.gapItems || []).length;
        if (targetIdx >= 0 && targetIdx < total) {
            state.currentGapIndex = targetIdx;
            renderGapFillView();
        }
    };

    window.nextGapItem = function(currentIdx) {
        const total = (state.gapItems || []).length;
        // Ưu tiên chuyển sang câu chưa làm tiếp theo
        let nextIdx = state.gapItems.findIndex((it, i) => i > currentIdx && !it.isCorrect);
        if (nextIdx === -1) {
            nextIdx = state.gapItems.findIndex(it => !it.isCorrect);
        }

        if (nextIdx !== -1) {
            window.goToGapItem(nextIdx);
        } else if (currentIdx < total - 1) {
            window.goToGapItem(currentIdx + 1);
        } else {
            renderGapFillView();
        }
    };

    window.prevGapItem = function(currentIdx) {
        if (currentIdx > 0) {
            window.goToGapItem(currentIdx - 1);
        }
    };

    // Kiểm tra câu trả lời
    window.checkGapItem = function(idx) {
        const item = state.gapItems[idx];
        if (!item || item.isCorrect) return;

        const input = document.getElementById(`gap-input-${idx}`);
        const userVal = (input?.value || '').trim();
        item.userAnswer = userVal;

        const targetClean = item.blankWord.trim().toLowerCase();
        const baseClean = item.targetWord.trim().toLowerCase();
        const userClean = userVal.toLowerCase();

        // Chấp nhận cả dạng chia từ lẫn dạng nguyên mẫu
        const isMatch = (userClean === targetClean || userClean === baseClean);

        if (isMatch) {
            item.isCorrect = true;
            window.HiSound && window.HiSound.playCorrect();
            if (window.HiSpeak) window.HiSpeak(item.targetWord);

            // Phản hồi trực quan màu xanh ngay lập tức
            if (input) {
                input.className = 'px-3.5 py-1.5 rounded-xl text-center font-bold text-base sm:text-xl border-2 border-green-600 bg-green-100 text-green-800';
            }

            // Tự động nhảy sang câu tiếp theo sau 750ms
            setTimeout(() => {
                const total = state.gapItems.length;
                let nextIdx = state.gapItems.findIndex((it, i) => i > idx && !it.isCorrect);
                if (nextIdx === -1) {
                    nextIdx = state.gapItems.findIndex(it => !it.isCorrect);
                }

                if (nextIdx !== -1) {
                    state.currentGapIndex = nextIdx;
                }
                renderGapFillView();
            }, 750);

        } else {
            window.HiSound && window.HiSound.playIncorrect();
            // Lỗi: hiệu ứng rung nhẹ viền đỏ
            if (input) {
                input.classList.add('border-error', 'animate-pulse');
                setTimeout(() => input.classList.remove('border-error', 'animate-pulse'), 800);
                input.select();
            }
        }
    };

    // Gợi ý từng ký tự
    window.hintGapItem = function(idx) {
        const item = state.gapItems[idx];
        if (!item || item.isCorrect) return;

        item.hintLevel = Math.min(item.blankWord.length - 1, item.hintLevel + 1);
        renderGapFillView();
        setTimeout(() => {
            const input = document.getElementById(`gap-input-${idx}`);
            if (input) {
                input.focus();
                // Tự điền phần ký tự đã gợi ý vào ô input để người dùng gõ tiếp
                input.value = item.blankWord.slice(0, item.hintLevel);
            }
        }, 50);
    };

    // Xem đáp án
    window.revealGapItem = function(idx) {
        const item = state.gapItems[idx];
        if (!item) return;

        item.isRevealed = true;
        item.userAnswer = item.blankWord;
        renderGapFillView();
    };

    // Làm lại bài tập
    window.resetGapExercises = function() {
        state._completeSoundPlayed = false;
        state.gapItems.forEach(it => {
            it.isCorrect = false;
            it.isRevealed = false;
            it.userAnswer = '';
            it.hintLevel = 0;
        });
        state.currentGapIndex = 0;
        renderGapFillView();
    };

    // ── ĐÓNG TRANG ĐỌC & DỊCH (QUAY LẠI) ────────────────────────────
    window.closeBilingualReading = function() {
        // Trở về bài học hoặc trang chi tiết chủ đề
        if (window._currentPassageId) {
            window.navigateTo('lesson-detail');
        } else if (window._currentTopicId) {
            window.navigateTo('topic-detail');
        } else {
            window.navigateTo('topics');
        }
    };

    // ── QUẢN LÝ ẨN / HIỆN NÚT TRÊN TASKBAR THEO ĐIỀU KIỆN ───────────
    /**
     * Kiểm tra xem topic hoặc passage hiện tại có bài đọc/bản dịch hay không.
     * Chỉ hiển thị nút Đọc & Dịch khi có content_en và content_vi (hoặc thuộc IELTS Actual Tests).
     */
    window.updateBilingualNavVisibility = function(topic, passage) {
        const subSidebarBtn = document.getElementById('sub-sidebar-reading-btn');
        const ldSidebarBtn  = document.getElementById('ld-sidebar-reading-btn');
        const ldStudyModeCard = document.getElementById('ld-study-mode-reading');
        const btnDesk       = document.getElementById('btn-read-passage');
        const btnMob        = document.getElementById('btn-read-passage-mobile');

        let hasReadingContent = false;

        // 1. Kiểm tra passage cụ thể nếu có
        if (passage && passage.contentEn && passage.contentVi) {
            hasReadingContent = true;
        } else if (passage && (passage.content_en && passage.content_vi)) {
            hasReadingContent = true;
        }

        // 2. Kiểm tra topic nếu thuộc danh mục IELTS Actual Tests hoặc có tests/passages
        if (!hasReadingContent) {
            const cat = topic?.category || window._currentCategoryName || '';
            const isVolCategory = (cat === 'IELTS Actual Tests' || cat === 'IELTS Vol' || String(topic?.name || '').includes('Vol'));
            
            if (isVolCategory) {
                hasReadingContent = true;
            } else if (window._camHierarchy?.tests) {
                // Duyệt xem có bất kỳ bài đọc nào có contentEn và contentVi
                hasReadingContent = window._camHierarchy.tests.some(t => 
                    (t.passages || []).some(p => (p.contentEn && p.contentVi) || (p.content_en && p.content_vi))
                );
            }
        }

        // Cập nhật DOM các nút
        const toggleEl = (el, show, displayCls = 'flex') => {
            if (!el) return;
            if (show) {
                el.classList.remove('hidden');
                el.classList.add(displayCls);
            } else {
                el.classList.add('hidden');
                el.classList.remove(displayCls);
            }
        };

        toggleEl(subSidebarBtn, hasReadingContent, 'flex');
        toggleEl(ldSidebarBtn,  hasReadingContent, 'flex');
        toggleEl(ldStudyModeCard, hasReadingContent, 'flex');
        toggleEl(btnDesk, hasReadingContent, 'flex');
        toggleEl(btnMob,  hasReadingContent, 'flex');
    };

})(window);
