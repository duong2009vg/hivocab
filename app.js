// ============================================================
// HI-VOCAB APPLICATION CORE (app.js)
// Giai đoạn 3: Bóc tách JavaScript inline từ index.html
// ============================================================

// ============================================================
// KHỐI 1: NAVIGATION & THEME LOGIC
// ============================================================
// Khai báo các biến và hàm trên Global Scope (window) để đảm bảo inline onclick luôn chạy tốt
window.currentMode = 'sequence'; 
window.currentExerciseIndex = 0;
window.totalExercises = 4; // Khai báo đúng 4 bài học

window.toggleTheme = function() {
    const html = document.documentElement;
    html.classList.toggle('dark');
    const isDark = html.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    const toggleBtn = document.getElementById('darkModeToggle');
    if (toggleBtn) toggleBtn.checked = isDark;
};

// ── Time-based & Nature Themes (Morning, Afternoon, Night) ───────────
const _THEMES = ['auto', 'ocean', 'morning', 'afternoon', 'night'];

window.detectTimeTheme = function() {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 4) return 'ocean';
    if (hour >= 4 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    return 'night';
};

window.applyTheme = function(name) {
    if (!_THEMES.includes(name)) name = 'auto';
    const html = document.documentElement;
    const actualTheme = (name === 'auto') ? window.detectTimeTheme() : name;

    _THEMES.forEach(t => { if (t !== 'auto') html.removeAttribute('data-theme'); });
    html.setAttribute('data-theme', actualTheme);
    localStorage.setItem('colour-theme', name);

    // Cập nhật backdrop gradient và artwork SVG trên Landing Page
    const backdrop = document.getElementById('landing-hero-backdrop');
    if (backdrop) {
        const gradClass = actualTheme === 'ocean' ? 'gradient-ocean' :
                          actualTheme === 'morning' ? 'gradient-asagiri' :
                          actualTheme === 'afternoon' ? 'gradient-yuugiri' : 'gradient-sumiyama';
        backdrop.className = 'absolute inset-0 z-0 transition-all duration-700 pointer-events-none select-none ' + gradClass;
    }

    const bgSvg = document.getElementById('landing-bg-svg');
    if (bgSvg) {
        const svgSrc = '/bg-' + actualTheme + '.svg';
        if (bgSvg.getAttribute('src') !== svgSrc) {
            bgSvg.src = svgSrc;
        }
    }

    // Cập nhật nhãn thời gian trên hero
    const timeLabel = document.getElementById('hero-time-label');
    if (timeLabel) {
        if (actualTheme === 'ocean') timeLabel.textContent = 'Biển Đêm · 00:00–03:59 · Ocean Blue';
        else if (actualTheme === 'morning') timeLabel.textContent = 'Sương Mai · 04:00–11:59 · Morning Mist';
        else if (actualTheme === 'afternoon') timeLabel.textContent = 'Hoàng Hôn · 12:00–17:59 · Dusk Ember';
        else timeLabel.textContent = 'Sơn Dạ · 18:00–23:59 · Ink Wash';
    }

    _updateThemeBtns(name);
};

function _updateThemeBtns(active) {
    document.querySelectorAll('[data-theme-btn]').forEach(btn => {
        const isActive = btn.dataset.themeBtn === active;
        btn.classList.toggle('border-primary', isActive);
        btn.classList.toggle('bg-primary/10', isActive);
        btn.classList.toggle('border-transparent', !isActive);
        btn.style.transform = isActive ? 'scale(1.04)' : '';
    });
    const autoSub = document.getElementById('theme-auto-sublabel');
    if (autoSub) {
        const cur = window.detectTimeTheme();
        const curText = cur === 'ocean' ? 'Hiện tại: Biển đêm' : cur === 'morning' ? 'Hiện tại: Sáng' : cur === 'afternoon' ? 'Hiện tại: Chiều' : 'Hiện tại: Tối';
        autoSub.textContent = curText;
    }
}


window.handleProfileClick = function() {
    if (window.innerWidth < 1024 && typeof window.toggleMobileProfileDropdown === 'function') {
        window.toggleMobileProfileDropdown();
        return;
    }
    if (typeof HiDB !== 'undefined' && HiDB.currentUser) {
        window.navigateTo('settings');
    } else {
        window.navigateTo('login');
    }
};

window.lockBodyScroll = function(lock) {
    try {
        if (lock) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    } catch(e) {}
};

var navigateTo;
window.navigateTo = navigateTo = function(page, preserveHash = false){
    window.lockBodyScroll(false);
    const rawPage = (page || '').split('?')[0].replace(/^#/, '').replace(/^page-/, '');
    const pageName = (rawPage === 'thpt') ? 'exercises' : rawPage;

    // Chuyển game vào trực tiếp dashboard học tập
    if (pageName === 'game') {
        window.navigateTo('dashboard', preserveHash);
        return;
    }

    // Nếu người dùng đã đăng nhập mà yêu cầu vào landing, chuyển thẳng vào dashboard học tập
    if (pageName === 'landing' && window._hasLocalAuthToken && window._hasLocalAuthToken() && !window._isPasswordRecoveryMode && !window._pendingAuthError) {
        window.navigateTo('dashboard', preserveHash);
        return;
    }

    // Gỡ bỏ sự kiện bàn phím phiên học khi rời trang learning
    if (pageName !== 'learning' && typeof HiSessionUI !== 'undefined' && typeof HiSessionUI.destroy === 'function') {
        HiSessionUI.destroy();
    }

    // Đóng tất cả trang
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    const el = document.getElementById('page-'+pageName);
    if(el) { el.classList.add('active'); window.scrollTo(0,0); }
    if (!preserveHash) window.location.hash = page;
 
    // Điều khiển Component dùng chung (Navbar / Sidebar)
    const mainTabs = ['dashboard', 'topics', 'library', 'vocabulary', 'exercises', 'dictionary', 'settings'];
    const isMainTab = mainTabs.includes(pageName);
    const isTopicDetail = (pageName === 'topic-detail' || pageName === 'lesson-detail');
    const isExerciseDetail = (pageName === 'thpt-room');
    
    // Sidebar Desktop
    const sidebar = document.getElementById('main-sidebar');
    if(sidebar) sidebar.style.display = isMainTab ? '' : 'none';
    
    // Mobile Bottom Navigation
    const bottomNav = document.getElementById('mobile-bottom-nav');
    if (bottomNav) {
        const shouldShowBottomNav = (isMainTab || isTopicDetail) && pageName !== 'landing';
        if (shouldShowBottomNav) {
            bottomNav.classList.remove('hidden');
            bottomNav.style.display = '';
        } else {
            bottomNav.classList.add('hidden');
            bottomNav.style.display = 'none';
        }
    }
    // Khi vào trang Topics: render tabs + grid
    if (pageName === 'topics') {
        setTimeout(() => {
            window._renderCategoryTabs && window._renderCategoryTabs();
            window._renderTopicsGrid  && window._renderTopicsGrid();
        }, 0);
    }
    // Khi vào trang Library: load Thư viện Cộng đồng
    if (pageName === 'library') {
        setTimeout(() => {
            window.loadCommunityLibrary && window.loadCommunityLibrary();
        }, 0);
    }
    // Khi vào trang Vocabulary: load từ vựng thật
    if (pageName === 'vocabulary') {
        setTimeout(() => window._loadVocabularyPage && window._loadVocabularyPage(), 0);
    }
    // Khi vào trang Exercises: render danh sách đề thi THPT Quốc Gia
    if (pageName === 'exercises') {
        setTimeout(() => {
            window.ThptExam && window.ThptExam.init();
        }, 0);
    }
    // Khi vào topic-detail: load danh sách lesson
    if (pageName === 'topic-detail') {
        window._loadLessons && window._loadLessons();
    }
    // Khi vào lesson-detail: load từ vựng
    if (pageName === 'lesson-detail') {
        window._loadLessonWords && window._loadLessonWords();
    }

    // Cập nhật trạng thái Active trên Menu
    if(isMainTab || isTopicDetail || isExerciseDetail) {
        const activeTarget = isTopicDetail ? 'topics' : isExerciseDetail ? 'exercises' : pageName; 
        
        document.querySelectorAll('.nav-item').forEach(a => {
            a.classList.remove('text-primary', 'active');
            a.classList.add('text-on-surface-variant');
            const icon = a.querySelector('.material-symbols-outlined');
            if(icon) icon.classList.remove('icon-fill');
        });
        const activeNav = Array.from(document.querySelectorAll('.nav-item')).find(a => (a.getAttribute('onclick') || '').includes(activeTarget));
        if (activeNav) {
            activeNav.classList.remove('text-on-surface-variant');
            activeNav.classList.add('text-primary', 'active');
            const icon = activeNav.querySelector('.material-symbols-outlined');
            if(icon) icon.classList.add('icon-fill');
        }

        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('text-primary', 'font-bold', 'bg-primary-container/10');
            item.classList.add('text-on-surface-variant', 'hover:bg-primary-container/10');
            const icon = item.querySelector('.material-symbols-outlined');
            if(icon) icon.classList.remove('icon-fill');
        });
        const activeDesktop = document.getElementById('nav-desktop-' + activeTarget);
        if(activeDesktop) {
            activeDesktop.classList.remove('text-on-surface-variant', 'hover:bg-primary-container/10');
            activeDesktop.classList.add('text-primary', 'font-bold', 'bg-primary-container/10');
            const icon = activeDesktop.querySelector('.material-symbols-outlined');
            if(icon) icon.classList.add('icon-fill');
        }
    }
    // Dừng countdown khi rời dashboard
    if (pageName !== 'dashboard' && typeof HiDashboard !== 'undefined') {
        HiDashboard.stopCountdown();
    }
    // Refresh Dashboard stats khi vào trang dashboard
    if (pageName === 'dashboard' && typeof HiDashboard !== 'undefined') {
        HiDashboard.refresh();
    }
    // Khi vào Settings, load giá trị API key hiện tại
    if (pageName === 'settings') {
        window._loadSettingsPage();
    }
};

window.handleExerciseComplete = function() {
    if (window.currentMode === 'single') {
        document.querySelectorAll('.exercise-step').forEach(el => el.classList.add('hidden'));
        const comp = document.getElementById('exercise-completed');
        comp.classList.remove('hidden');
        document.getElementById('complete-title').innerText = 'Luyện tập hoàn tất!';
        document.getElementById('complete-message').innerText = 'Bạn đã hoàn thành bài tập kỹ năng này.';
        document.getElementById('complete-btn').setAttribute('onclick', "navigateTo('topic-detail')");
        document.getElementById('complete-btn').innerText = 'Quay lại Chủ đề';
    } else {
        window.nextExercise();
    }
};

window.nextExercise = function() {
    const currentEl = document.getElementById(`exercise-${window.currentExerciseIndex}`);
    if(currentEl) currentEl.classList.add('hidden');
    
    window.currentExerciseIndex++;
    
    if (window.currentExerciseIndex < window.totalExercises) {
        document.getElementById(`exercise-${window.currentExerciseIndex}`).classList.remove('hidden');
    } else {
        const comp = document.getElementById('exercise-completed');
        comp.classList.remove('hidden');
        document.getElementById('complete-title').innerText = 'Hoàn thành xuất sắc!';
        document.getElementById('complete-message').innerText = 'Bạn đã hoàn thành phiên ôn tập hôm nay. 4 từ vựng đã được củng cố vào bộ nhớ của bạn.';
        document.getElementById('complete-btn').setAttribute('onclick', "window.navigateTo('dashboard')");
        document.getElementById('complete-btn').innerText = 'Quay lại Trang chủ';
    }
    window.updateProgress();
};

window.updateProgress = function() {
    const p = document.getElementById('learn-progress');
    if(p) {
        const percent = (window.currentExerciseIndex / window.totalExercises) * 100;
        p.style.width = percent + '%';
    }
};

window.flipCard = function(){
    const card = document.getElementById('flashcard-card') || document.getElementById('flashcard');
    if (card) {
        card.classList.toggle('is-flipped');
    } else {
        const f = document.getElementById('card-front'), b = document.getElementById('card-back');
        if (f && b) { f.classList.toggle('hidden'); b.classList.toggle('hidden'); }
    }
};

window.rateCard = function(level){};

window.selectMCQ = function(el){
 document.querySelectorAll('.mcq-opt').forEach(o=>{
  o.className='mcq-opt w-full text-left p-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest flex items-center justify-between';
  o.querySelector('.material-symbols-outlined').textContent='radio_button_unchecked';
  o.querySelector('.material-symbols-outlined').classList.remove('text-primary');
 });
 el.className='mcq-opt w-full text-left p-4 rounded-xl border-2 border-primary bg-primary-container/10 flex items-center justify-between';
 el.querySelector('.material-symbols-outlined').textContent='radio_button_checked';
 el.querySelector('.material-symbols-outlined').classList.add('text-primary');
 
 const btn=document.getElementById('mcq-check');
 if(btn){
     btn.disabled=false;
     btn.className='w-full bg-primary text-on-primary px-6 py-3.5 rounded-xl md:rounded-full font-bold text-sm hover:bg-surface-tint transition-colors';
     btn.innerText = 'Kiểm tra & Tiếp tục';
 }
};

window.checkFillInBlank = function() {
    window.handleExerciseComplete();
};

// getAIHint cũ (cho static HTML exercises) - giờ delegate sang HiAIHint
window.getAIHint = async function() {
    if (typeof HiAIHint !== 'undefined') {
        await HiAIHint.renderHint();
    }
};

// ── Settings: Gemini API Key helpers ──────────────────────────
window._loadSettingsPage = function() {
    const input = document.getElementById('gemini-api-key-input');
    const status = document.getElementById('gemini-key-status');
    if (!input || !status) return;
    const key = typeof HiAIHint !== 'undefined' ? HiAIHint.getApiKey() : '';
    if (key) {
        input.value = key;
        status.textContent = '✓ Đã cài đặt';
        status.className = 'text-xs font-medium text-green-600';
    } else {
        input.value = '';
        status.textContent = 'Chưa cài đặt';
        status.className = 'text-xs font-medium text-outline';
    }
};

window._onApiKeyInput = function() {
    const status = document.getElementById('gemini-key-status');
    if (status) { status.textContent = ''; }
};

window._toggleApiKeyVisibility = function() {
    const input = document.getElementById('gemini-api-key-input');
    const icon  = document.querySelector('#gemini-key-toggle .material-symbols-outlined');
    if (!input) return;
    if (input.type === 'password') {
        input.type = 'text';
        if (icon) icon.textContent = 'visibility_off';
    } else {
        input.type = 'password';
        if (icon) icon.textContent = 'visibility';
    }
};

window._saveGeminiKey = function() {
    const input  = document.getElementById('gemini-api-key-input');
    const status = document.getElementById('gemini-key-status');
    if (!input) return;
    const key = input.value.trim();
    if (!key) {
        if (status) { status.textContent = 'Nhập key trước!'; status.className = 'text-xs font-medium text-error'; }
        return;
    }
    if (typeof HiAIHint !== 'undefined') HiAIHint.saveApiKey(key);
    else localStorage.setItem('hi_gemini_api_key', key);
    if (status) { status.textContent = '✓ Đã lưu!'; status.className = 'text-xs font-medium text-green-600'; }
    input.type = 'password';
};

window._clearGeminiKey = function() {
    const input  = document.getElementById('gemini-api-key-input');
    const status = document.getElementById('gemini-key-status');
    if (typeof HiAIHint !== 'undefined') HiAIHint.clearApiKey();
    else localStorage.removeItem('hi_gemini_api_key');
    if (input)  input.value = '';
    if (status) { status.textContent = 'Đã xóa'; status.className = 'text-xs font-medium text-outline'; }
};

window._testGeminiKey = async function() {
    const resultEl = document.getElementById('gemini-test-result');
    if (!resultEl) return;
    resultEl.classList.remove('hidden');
    resultEl.innerHTML = '<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px] animate-spin">refresh</span> Đang kiểm tra...</span>';
    try {
        if (typeof HiAIHint === 'undefined') throw new Error('Module AI chưa được tải.');
        const hint = await HiAIHint.getHint({
            word: 'serendipity', meaning: 'Sự tình cờ may mắn',
            sentence: 'Finding that rare book was an act of pure serendipity.'
        });
        resultEl.innerHTML = `<span class="text-green-600 font-medium">✓ Kết nối thành công!</span><br/><span class="italic mt-1 block">${hint.substring(0,120)}...</span>`;
    } catch (err) {
        resultEl.innerHTML = `<span class="text-error font-medium">✗ ${err.message}</span>`;
    }
};

window.addEventListener('DOMContentLoaded', () => {
    // Kích hoạt dark/light mode
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.classList.add('dark');
        const toggleBtn = document.getElementById('darkModeToggle');
        if (toggleBtn) toggleBtn.checked = true;
    }

    // Khôi phục colour theme
    const savedColour = localStorage.getItem('colour-theme') || 'auto';
    window.applyTheme(savedColour);

    // Tự động kiểm tra và cập nhật nhịp thời gian mỗi phút nếu chọn 'auto'
    setInterval(() => {
        const userChoice = localStorage.getItem('colour-theme') || 'auto';
        if (userChoice === 'auto') {
            window.applyTheme('auto');
        }
    }, 60000);

    // Logic Inputs Điền từ (static HTML fallback)
    const inputs = document.querySelectorAll('.fill-input');
    inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value && index < inputs.length - 1) inputs[index + 1].focus();
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) inputs[index - 1].focus();
        });
    });

    // Helper phân tích URL redirect từ Supabase (hỗ trợ cả query param ?code=.../?error=... và hash #access_token=.../#error=...)
    window._parseAuthRedirectInfo = function() {
        const searchParams = new URLSearchParams(window.location.search);
        const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
        const hashParams = new URLSearchParams(hash);

        const errorDesc = searchParams.get('error_description') || hashParams.get('error_description');
        const errorCode = searchParams.get('error_code') || hashParams.get('error_code');
        const error = searchParams.get('error') || hashParams.get('error');

        const type = searchParams.get('type') || hashParams.get('type');
        const isRecovery = (type === 'recovery') || hash.includes('type=recovery');
        const isPkceCode = searchParams.has('code');
        const hasAccessToken = !!(hashParams.get('access_token') || hash.includes('access_token='));

        return {
            hasError: !!(error || errorDesc || errorCode),
            error: error || '',
            errorCode: errorCode || '',
            errorDesc: errorDesc ? decodeURIComponent(errorDesc.replace(/\+/g, ' ')) : '',
            isRecovery,
            isPkceCode,
            hasAccessToken
        };
    };

    // Helper kiểm tra nhanh trạng thái đăng nhập từ localStorage
    window._hasLocalAuthToken = function() {
        if (window._isPreAuthenticated) return true;
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.indexOf('sb-') === 0 && k.indexOf('-auth-token') !== -1) {
                    const item = JSON.parse(localStorage.getItem(k) || '{}');
                    if (item && item.access_token) {
                        if (!item.expires_at || item.expires_at * 1000 > Date.now()) {
                            return true;
                        }
                    }
                }
            }
        } catch (_) {}
        return false;
    };

    const isLoggedIn = window._hasLocalAuthToken();

    // Khởi tạo trang ban đầu
    const authInfo = window._parseAuthRedirectInfo();
    const h = window.location.hash.slice(1);

    if (authInfo.hasError) {
        // Lưu thông tin lỗi để hiển thị modal cảnh báo rõ ràng khi DOMContentLoaded sẵn sàng
        window._pendingAuthError = authInfo;
        window.navigateTo('landing', true);
    } else if (authInfo.isRecovery) {
        // Vào link đặt lại mật khẩu từ email
        window._isPasswordRecoveryMode = true;
        window.navigateTo('landing', true);
    } else if (h && (h.includes('access_token=') || authInfo.isPkceCode)) {
        window.navigateTo(isLoggedIn ? 'dashboard' : 'landing', true);
    } else if (h && h !== 'landing' && h !== 'login') {
        window.navigateTo(h);
    } else {
        if (isLoggedIn) {
            window.navigateTo('dashboard');
        } else {
            window.navigateTo('landing', true);
        }
    }

    // Hiển thị fallback cho Dashboard ngay lập tức
    if (typeof HiDashboard !== 'undefined') HiDashboard.renderFallback();

    // Setup FAQ
    const faqs = [
        {
            q: 'Chương trình quà tặng 2 tháng Full tính năng áp dụng như thế nào?',
            a: 'Nhân dịp HiVocab chính thức ra mắt, tất cả người dùng đăng ký tài khoản mới đều được <strong>tặng ngay 2 tháng trải nghiệm trọn vẹn 100% tính năng Premium</strong> (mở khóa toàn bộ 66.000+ từ vựng Cam 10–21, IELTS Vol 1–9, Chế độ Đọc Chủ Động Curtain Mode và Trợ lý AI). Quà tặng được kích hoạt tự động ngay sau khi tạo tài khoản, hoàn toàn miễn phí và không cần nhập thẻ ngân hàng!'
        },
        {
            q: 'Kho 66.000+ từ vựng của HiVocab có nguồn gốc từ đâu và bao gồm những gì?',
            a: 'Toàn bộ từ vựng được trích xuất và chuẩn hóa trực tiếp từ trọn bộ 12 cuốn Cambridge IELTS (CAM 10 đến CAM 21) và 9 tập IELTS Actual Tests (VOL 1 đến VOL 9), bổ trợ thêm Destination B1-C2 và Oxford 3000. Mỗi từ đều có phiên âm quốc tế (IPA), phân loại từ loại (POS), nghĩa tiếng Việt chuẩn xác và đặc biệt là <strong>câu ví dụ trích trực tiếp từ chính bài đọc IELTS thực tế</strong>.'
        },
        {
            q: 'Chế độ Đọc Chủ Động & Che Bản Dịch (Curtain Mode) hoạt động thế nào?',
            a: 'Đây là phương pháp luyện đọc độc quyền trên HiVocab: Bài đọc IELTS được trình bày song ngữ Anh - Việt đối xứng. Bạn có thể kéo thanh "Rèm che" để che bản dịch tiếng Việt, buộc não bộ phải chủ động đọc hiểu tiếng Anh và tự suy đoán nghĩa trong ngữ cảnh, chỉ mở hé rèm khi cần kiểm tra lại. Đi kèm là tính năng <strong>bài tập đục lỗ từ vựng</strong> giúp bạn ghi nhớ từ ngay trong bài đọc.'
        },
        {
            q: 'Thuật toán Lặp lại Ngắt quãng (Spaced Repetition - SRS SM-2) giúp tôi nhớ từ ra sao?',
            a: 'HiVocab ứng dụng thuật toán SuperMemo-2 (SM-2) theo quy luật khoa học về trí nhớ. Hệ thống chia việc học thành 5 cấp độ (1 ngày, 3 ngày, 7 ngày, 14 ngày, 30 ngày) và tự động tính toán chính xác thời điểm bạn chuẩn bị quên từ để nhắc nhở ôn tập, biến từ vựng thành trí nhớ dài hạn vĩnh viễn và tiết kiệm 80% thời gian.'
        },
        {
            q: 'HiVocab có những chế độ luyện tập nào?',
            a: 'Bạn có thể linh hoạt chuyển đổi giữa 5 chế độ: <strong>Flashcard lật thẻ 3D</strong> thông minh, <strong>Trắc nghiệm 4 đáp án (Quiz)</strong> rèn phản xạ, <strong>Điền từ vào ngữ cảnh (Type-in)</strong> chuẩn chính tả, <strong>Nghe chép chính tả (Dictation)</strong> luyện tai nghe với giọng chuẩn bản ngữ, và <strong>Trò chơi phiêu lưu từ vựng</strong> vượt ải thú vị.'
        },
        {
            q: 'Nếu gặp lỗi hoặc cần hỗ trợ trong quá trình học, tôi liên hệ ai?',
            a: 'Vì website mới ra mắt nên đội ngũ luôn túc trực hỗ trợ bạn 24/7! Nếu gặp bất kỳ lỗi hiển thị, sự cố đồng bộ hoặc cần góp ý phát triển tính năng, bạn hãy liên hệ trực tiếp Admin qua Zalo số: <strong class="text-primary font-mono text-base">0846 407 898</strong> (hoặc nhấn nút Chat Zalo ở mục Hỗ trợ). Chúng tôi rất trân trọng mọi đóng góp của bạn!'
        }
    ];
    const fl = document.getElementById('faq-list');
    if(fl) {
        fl.innerHTML = '';
        faqs.forEach(f => {
            const d = document.createElement('div');
            d.className = 'glass-card soft-shadow rounded-xl overflow-hidden bg-surface-container-lowest border border-outline-variant/20';
            d.innerHTML = `<button onclick="this.nextElementSibling.classList.toggle('hidden');this.querySelector('.faq-icon').classList.toggle('rotate-180')" class="w-full flex justify-between items-center p-4 md:p-6 text-left hover:bg-surface-container-low transition-colors cursor-pointer"><span class="font-headline-md text-base md:text-lg font-bold text-on-surface pr-4">${f.q}</span><span class="material-symbols-outlined faq-icon transition-transform text-outline">expand_more</span></button><div class="hidden px-4 pb-4 md:px-6 md:pb-6 text-on-surface-variant text-sm md:text-base leading-relaxed border-t border-outline-variant/10 pt-3">${f.a}</div>`;
            fl.appendChild(d);
        });
    }

    // Support Page Helper Functions
    window.copyZaloSupport = function() {
        const phone = '0846407898';
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(phone).then(() => {
                const text = document.getElementById('text-copy-zalo');
                const icon = document.getElementById('icon-copy-zalo');
                if (text && icon) {
                    text.innerText = 'Đã chép số!';
                    icon.innerText = 'check';
                    setTimeout(() => {
                        text.innerText = 'Sao chép';
                        icon.innerText = 'content_copy';
                    }, 2500);
                }
            }).catch(() => {
                prompt('Số điện thoại Zalo Admin:', phone);
            });
        } else {
            prompt('Số điện thoại Zalo Admin:', phone);
        }
    };

    window.handleSupportSubmit = function(e) {
        if (e && e.preventDefault) e.preventDefault();
        const name = document.getElementById('support-name')?.value || 'Bạn';
        alert(`Cảm ơn ${name}! HiVocab đã tiếp nhận thông tin của bạn. Nếu cần xử lý gấp, bạn có thể nhắn tin trực tiếp qua Zalo Admin: 0846 407 898 nhé!`);
        if (e && e.target && e.target.reset) e.target.reset();
    };
});

window.addEventListener('hashchange', () => {
    const h = window.location.hash.slice(1);
    // Bỏ qua hash OAuth từ Supabase (access_token, error_description)
    if(h && !h.includes('access_token=') && !h.includes('error_description=')) {
        const activePageEl = document.querySelector('.page.active');
        if (activePageEl && activePageEl.id === 'page-' + h.split('?')[0]) {
            return;
        }
        window.navigateTo(h, true);
    }
});

// ============================================================
// KHỐI 2: BUG REPORT & MONITORING LOGIC
// ============================================================
// ============================================================
// BUG REPORT & CLIENT MONITORING LOGIC
// ============================================================
window.showHiToast = function(msg, type = 'info') {
    let toast = document.getElementById('hi-global-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'hi-global-toast';
        toast.className = 'fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-[99999] text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-full shadow-2xl transition-all duration-300 opacity-0 pointer-events-none flex items-center gap-2 max-w-[90vw] text-center';
        document.body.appendChild(toast);
    }
    const bgClass = type === 'success' ? 'bg-emerald-600' : (type === 'error' ? 'bg-rose-600' : 'bg-slate-900');
    toast.className = `fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-[99999] ${bgClass} text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-full shadow-2xl transition-all duration-300 opacity-0 pointer-events-none flex items-center gap-2 max-w-[90vw] text-center`;
    toast.textContent = msg;
    toast.style.opacity = '1';
    toast.style.transform = 'translate(-50%, -8px)';
    clearTimeout(window._hiToastTimer);
    window._hiToastTimer = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, 0)';
    }, 3200);
};

window.openBugReportModal = function(params = {}) {
    window._modalBugReportOpenedAt = Date.now();
    const modal = document.getElementById('modal-bug-report');
    if (!modal) return;

    let feature = params.feature || '';
    let reportType = params.reportType || '';
    let title = params.title || '';
    let contextData = params.contextData || {};
    let content = params.content || '';

    // Auto-detect context from active page if not explicitly provided
    if (!feature) {
        const activePage = document.querySelector('.page.active')?.id || '';
        if (activePage === 'page-learning') {
            feature = 'learning_session';
            reportType = reportType || 'wrong_answer';
            const item = (typeof HiSession !== 'undefined' && typeof HiSession.getCurrentItem === 'function') ? HiSession.getCurrentItem() : null;
            const w = item?.word?.word || item?.exerciseData?.word || item?.exerciseData?.answer || item?.exerciseData?.frontWord || '';
            const m = item?.word?.meaning || item?.exerciseData?.meaning || item?.exerciseData?.frontWord || '';
            title = w ? `Từ vựng: ${w}` : 'Phiên học từ vựng';
            contextData = { word: w, meaning: m, exercise_type: item?.exerciseType || '' };
        } else if (activePage === 'page-thpt-room') {
            feature = 'thpt_exam';
            reportType = reportType || 'exam_question';
            if (window.ThptExam && window.ThptExam.currentExam) {
                const qNum = (window.ThptExam.currentQIndex || 0) + 1;
                const q = window.ThptExam.currentExam.questions?.[qNum - 1];
                title = `Đề ${window.ThptExam.currentExam.title} - Câu ${qNum}`;
                contextData = {
                    exam_id: window.ThptExam.currentExam.id,
                    exam_title: window.ThptExam.currentExam.title,
                    question_number: qNum,
                    system_answer: q?.correct_answer || '?',
                    user_answer: window.ThptExam.userAnswers?.[qNum] || ''
                };
            } else {
                title = 'Phòng thi THPT';
            }
        } else if (activePage === 'page-bilingual-reading') {
            feature = 'bilingual_reading';
            reportType = reportType || 'typo';
            const passage = typeof window.getCurrentBilingualPassage === 'function' ? window.getCurrentBilingualPassage() : null;
            title = passage ? `Bài đọc: ${passage.title || passage.id}` : 'Bài đọc Song ngữ';
            contextData = { passage_id: passage?.id, passage_title: passage?.title };
        } else if (activePage === 'page-dictionary') {
            feature = 'dictionary';
            reportType = reportType || 'typo';
            const w = document.getElementById('dict-word')?.textContent?.trim() || '';
            title = w ? `Tra từ: ${w}` : 'Tra từ điển';
            contextData = { word: w };
        } else {
            feature = 'general';
            reportType = reportType || 'other';
            title = 'Phản hồi & Góp ý hệ thống';
        }
    }

    const featureInput = document.getElementById('bug-report-feature');
    if (featureInput) featureInput.value = feature;

    const typeSelect = document.getElementById('bug-report-type');
    if (typeSelect) {
        if (reportType && [...typeSelect.options].some(o => o.value === reportType)) {
            typeSelect.value = reportType;
        } else {
            typeSelect.value = 'other';
        }
    }

    const contentArea = document.getElementById('bug-report-content');
    if (contentArea) contentArea.value = content;

    const chipLabel = document.getElementById('bug-report-context-label');
    if (chipLabel) chipLabel.textContent = title || 'Phản hồi & Báo lỗi HiVocab';

    const mergedContext = {
        ...contextData,
        title: title,
        url: window.location.href,
        userAgent: navigator.userAgent,
        screen: `${window.innerWidth}x${window.innerHeight}`,
        timestamp: new Date().toISOString()
    };
    const contextInput = document.getElementById('bug-report-context-json');
    if (contextInput) contextInput.value = JSON.stringify(mergedContext);

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => { contentArea?.focus(); }, 50);
};

window.closeBugReportModal = function() {
    const modal = document.getElementById('modal-bug-report');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};

window.submitBugReportForm = async function(event) {
    if (event) event.preventDefault();
    const btn = document.getElementById('btn-submit-bug-report');
    const content = (document.getElementById('bug-report-content')?.value || '').trim();
    if (!content) {
        window.showHiToast('Vui lòng nhập nội dung mô tả lỗi!', 'error');
        return;
    }

    const feature = document.getElementById('bug-report-feature')?.value || 'general';
    const reportType = document.getElementById('bug-report-type')?.value || 'other';
    let contextData = {};
    try {
        contextData = JSON.parse(document.getElementById('bug-report-context-json')?.value || '{}');
    } catch (e) {}

    const originalBtnHtml = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="material-symbols-outlined text-[16px] animate-spin">refresh</span> Đang gửi...`;
    }

    try {
        if (window.HiDB && typeof window.HiDB.submitBugReport === 'function') {
            await window.HiDB.submitBugReport({
                description: content,
                content: content,
                reportType: reportType,
                report_type: reportType,
                featureContext: feature,
                feature: feature,
                contextData: contextData,
                context_data: contextData
            });
        }
        window.closeBugReportModal();
        window.showHiToast('Cảm ơn bạn! Báo cáo đã được gửi tới đội ngũ kỹ thuật 🎉', 'success');
    } catch (err) {
        console.error('[BugReport] Submit error:', err);
        const errMsg = err?.message || 'Gửi báo cáo thất bại, vui lòng thử lại sau.';
        window.showHiToast(errMsg, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalBtnHtml;
        }
    }
};

// Close modal on backdrop click
document.getElementById('modal-bug-report')?.addEventListener('click', function(e) {
    if (Date.now() - (window._modalBugReportOpenedAt || 0) < 350) return;
    if (e.target === this) window.closeBugReportModal();
});

// Global Error and Unhandled Rejection Logger
window.addEventListener('error', (event) => {
    try {
        if (window.HiDB && typeof window.HiDB.logSystemError === 'function') {
            window.HiDB.logSystemError({
                error_message: event.message || 'Unknown JavaScript runtime error',
                stack_trace: event.error?.stack || `${event.filename || ''}:${event.lineno || ''}:${event.colno || ''}`,
                component: 'window.onerror',
                severity: 'error',
                context: {
                    url: window.location.href,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    userAgent: navigator.userAgent
                }
            });
        }
    } catch (e) {}
});

window.addEventListener('unhandledrejection', (event) => {
    try {
        if (window.HiDB && typeof window.HiDB.logSystemError === 'function') {
            const reason = event.reason;
            const message = reason?.message || (typeof reason === 'string' ? reason : 'Unhandled Promise Rejection');
            const stack = reason?.stack || '';
            window.HiDB.logSystemError({
                error_message: message,
                stack_trace: stack,
                component: 'unhandledrejection',
                severity: 'error',
                context: {
                    url: window.location.href,
                    userAgent: navigator.userAgent
                }
            });
        }
    } catch (e) {}
});

// ============================================================
// KHỐI 3: CORE BUSINESS LOGIC
// ============================================================
// ==========================================
// WELCOME GIFT & ANNOUNCEMENT MODAL LOGIC
// ==========================================
window.openWelcomeModal = function() {
    const modal = document.getElementById('modal-welcome-announcement');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

window.closeWelcomeModal = function(markAsSeen = true) {
    const modal = document.getElementById('modal-welcome-announcement');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    if (markAsSeen) {
        try {
            localStorage.setItem('hivocab_welcome_gift_seen_v1', 'true');
        } catch (e) {}
    }
};

window.copyAdminZalo = function() {
    const phone = '0846407898';
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(phone).then(() => {
            const btnText = document.getElementById('btn-copy-zalo-text');
            if (btnText) {
                btnText.textContent = 'Đã chép!';
                setTimeout(() => { btnText.textContent = 'Sao chép'; }, 2000);
            }
        }).catch(() => {
            prompt('Số Zalo Admin HiVocab:', phone);
        });
    } else {
        prompt('Số Zalo Admin HiVocab:', phone);
    }
};

window.checkAndShowWelcomeModal = function() {
    // Tắt tự động nổ popup toàn màn hình để tuân thủ 100% chính sách kiểm duyệt Google OAuth
    // Người dùng vẫn có thể bấm nút '🎁 Quà tặng 2T & Zalo Admin' trên sidebar/menu để xem
    return;
};

// ── Auth Mode State (login / signup) ───────────────────────────
window._authMode = 'login';
window.switchAuthMode = function(mode) {
    window._authMode = mode;
    const tabLogin = document.getElementById('tab-auth-login');
    const tabSignup = document.getElementById('tab-auth-signup');
    const confirmField = document.getElementById('field-confirm-password');
    const btnSubmit = document.getElementById('btn-auth-submit');
    const authTitle = document.getElementById('auth-title');
    const authSubtitle = document.getElementById('auth-subtitle');
    const errBox = document.getElementById('auth-error');
    const successBox = document.getElementById('auth-success');
    if (errBox) errBox.classList.add('hidden');
    if (successBox) successBox.classList.add('hidden');

    if (mode === 'login') {
        tabLogin.className = 'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all bg-white text-primary shadow-xs';
        tabSignup.className = 'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-on-surface-variant hover:text-on-surface';
        confirmField.classList.add('hidden');
        document.getElementById('auth-confirm-password').removeAttribute('required');
        btnSubmit.textContent = 'Đăng nhập';
        authTitle.textContent = 'Chào mừng trở lại!';
        authSubtitle.textContent = 'Đăng nhập để tiếp tục hành trình học từ vựng';
        document.getElementById('link-forgot-pw').classList.remove('hidden');
    } else {
        tabSignup.className = 'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all bg-white text-primary shadow-xs';
        tabLogin.className = 'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-on-surface-variant hover:text-on-surface';
        confirmField.classList.remove('hidden');
        document.getElementById('auth-confirm-password').setAttribute('required', 'true');
        btnSubmit.textContent = 'Tạo tài khoản';
        authTitle.textContent = 'Tạo tài khoản mới';
        authSubtitle.textContent = 'Bắt đầu học từ vựng hiệu quả với HiVocab';
        document.getElementById('link-forgot-pw').classList.add('hidden');
    }
};

// ── Email / Password Auth Submit ──────────────────────────────
window.handleEmailAuth = async function(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const confirmPw = document.getElementById('auth-confirm-password').value;
    const errBox = document.getElementById('auth-error');
    const successBox = document.getElementById('auth-success');
    const btn = document.getElementById('btn-auth-submit');

    errBox.classList.add('hidden');
    successBox.classList.add('hidden');

    if (window._authMode === 'signup') {
        if (password.length < 6) {
            errBox.textContent = 'Mật khẩu phải có ít nhất 6 ký tự.';
            errBox.classList.remove('hidden');
            return;
        }
        if (password !== confirmPw) {
            errBox.textContent = 'Mật khẩu xác nhận không khớp.';
            errBox.classList.remove('hidden');
            return;
        }
    }

    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = 'Đang xử lý...';

    try {
        if (typeof HiDB === 'undefined') throw new Error('Hệ thống cơ sở dữ liệu chưa sẵn sàng.');

        if (window._authMode === 'login') {
            await HiDB.signInWithPassword(email, password);
            window.navigateTo('dashboard');
        } else {
            const res = await HiDB.signUpWithPassword(email, password);
            // Kiểm tra nếu tài khoản này đã tồn tại trên hệ thống (Supabase trả về identities: [] để tránh dò quét email)
            if (res?.user && (!res.user.identities || res.user.identities.length === 0)) {
                errBox.innerHTML = `
                    <div class="space-y-2 text-left">
                        <div class="font-bold text-rose-700 flex items-center gap-1 text-xs">
                            <span class="material-symbols-outlined text-base">info</span>
                            Email này đã có tài khoản trên hệ thống!
                        </div>
                        <p class="text-on-surface-variant text-[11px] leading-relaxed">
                            Nếu bạn từng đăng nhập bằng <b>Google</b> hoặc đã đăng ký trước đó:
                        </p>
                        <div class="flex flex-col gap-1.5 text-xs pt-1">
                            <button type="button" onclick="window.handleGoogleLogin()" class="w-full py-2 px-3 bg-surface-container-high rounded-xl text-primary font-bold text-center hover:bg-surface-container-highest transition-colors">
                                Đăng nhập bằng Google
                            </button>
                            <button type="button" onclick="window.openForgotPasswordModal()" class="w-full py-2 px-3 bg-primary/10 text-primary rounded-xl font-bold text-center hover:bg-primary/20 transition-colors">
                                Đặt lại mật khẩu (Quên mật khẩu)
                            </button>
                        </div>
                    </div>
                `;
                errBox.classList.remove('hidden');
                return;
            }

            if (res?.session) {
                window.navigateTo('dashboard');
            } else {
                successBox.innerHTML = `
                    <div class="space-y-1 text-left">
                        <p class="font-bold text-emerald-800 text-xs">Đăng ký thành công!</p>
                        <p class="text-[11px] text-emerald-700 leading-relaxed">
                            Vui lòng kiểm tra hộp thư <b>${email}</b> và bấm vào liên kết xác thực để kích hoạt tài khoản của bạn.
                        </p>
                    </div>
                `;
                successBox.classList.remove('hidden');
            }
        }
    } catch(err) {
        errBox.textContent = err.message || 'Thao tác không thành công. Vui lòng thử lại.';
        errBox.classList.remove('hidden');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
};

// ── Auth Error Modal Handlers ─────────────────────────────────
window.openAuthErrorModal = function(desc) {
    const modal = document.getElementById('modal-auth-error');
    if (!modal) return;
    const descEl = document.getElementById('auth-error-modal-desc');
    if (descEl && desc) {
        let vietnameseMsg = 'Liên kết xác thực hoặc đặt lại mật khẩu trong email đã hết hạn hoặc đã được sử dụng trước đó (do các hệ thống quét bảo mật của hòm thư tự động kiểm tra trước).';
        const d = desc.toLowerCase();
        if (d.includes('expired') || d.includes('otp_expired')) {
            vietnameseMsg = 'Liên kết xác thực hoặc đổi mật khẩu đã hết hạn hoặc đã được sử dụng trước đó. Vui lòng yêu cầu gửi lại liên kết mới hoặc đăng nhập bằng Google.';
        } else if (d.includes('invalid')) {
            vietnameseMsg = 'Liên kết xác thực không hợp lệ. Vui lòng kiểm tra lại email mới nhất hoặc yêu cầu một liên kết mới.';
        }
        descEl.textContent = vietnameseMsg;
    }
    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

window.closeAuthErrorModal = function() {
    const modal = document.getElementById('modal-auth-error');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
};

// ── Forgot Password Modal Handlers ────────────────────────────
window.openForgotPasswordModal = function() {
    const email = document.getElementById('auth-email')?.value?.trim() || '';
    if (email) {
        const forgotEl = document.getElementById('forgot-email');
        const otpEmailEl = document.getElementById('otp-email');
        if (forgotEl) forgotEl.value = email;
        if (otpEmailEl) otpEmailEl.value = email;
    }
    const msg = document.getElementById('forgot-msg');
    if (msg) msg.classList.add('hidden');
    const otpMsg = document.getElementById('otp-msg');
    if (otpMsg) otpMsg.classList.add('hidden');

    window.switchForgotTab('link');
    const modal = document.getElementById('modal-forgot-password');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

window.closeForgotPasswordModal = function() {
    const modal = document.getElementById('modal-forgot-password');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
};

window.switchForgotTab = function(tab) {
    const tabLink = document.getElementById('tab-forgot-link');
    const tabOtp = document.getElementById('tab-forgot-otp');
    const formLink = document.getElementById('form-forgot-link');
    const formOtp = document.getElementById('form-forgot-otp');

    if (tab === 'link') {
        tabLink.className = 'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all bg-white text-primary shadow-xs';
        tabOtp.className = 'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-on-surface-variant hover:text-on-surface';
        formLink.classList.remove('hidden');
        formOtp.classList.add('hidden');
    } else {
        tabOtp.className = 'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all bg-white text-primary shadow-xs';
        tabLink.className = 'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-on-surface-variant hover:text-on-surface';
        formOtp.classList.remove('hidden');
        formLink.classList.add('hidden');
        const linkEmail = document.getElementById('forgot-email')?.value?.trim();
        if (linkEmail && document.getElementById('otp-email')) {
            document.getElementById('otp-email').value = linkEmail;
        }
    }
};

window.handleForgotPassword = async function(e) {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value.trim();
    const msg = document.getElementById('forgot-msg');
    const btn = document.getElementById('btn-forgot-submit');
    btn.disabled = true;
    btn.textContent = 'Đang gửi...';

    try {
        await HiDB.resetPasswordForEmail(email);
        msg.textContent = 'Đã gửi email khôi phục! Vui lòng kiểm tra hòm thư của bạn (hộp thư đến hoặc spam) để đặt lại mật khẩu.';
        msg.className = 'text-xs p-2.5 rounded-xl font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 block';
    } catch(err) {
        msg.textContent = err.message || 'Không thể gửi email khôi phục.';
        msg.className = 'text-xs p-2.5 rounded-xl font-medium bg-rose-50 text-rose-600 border border-rose-200 block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Gửi email';
    }
};

window.handleVerifyOtpReset = async function(e) {
    e.preventDefault();
    const email = document.getElementById('otp-email').value.trim();
    const token = document.getElementById('otp-code').value.trim();
    const newPw = document.getElementById('otp-new-password').value;
    const msg = document.getElementById('otp-msg');
    const btn = document.getElementById('btn-otp-submit');

    if (token.length < 6) {
        msg.textContent = 'Mã OTP bao gồm 6 chữ số.';
        msg.className = 'text-xs p-2.5 rounded-xl font-medium bg-rose-50 text-rose-600 border border-rose-200 block';
        return;
    }
    if (newPw.length < 6) {
        msg.textContent = 'Mật khẩu mới phải có tối thiểu 6 ký tự.';
        msg.className = 'text-xs p-2.5 rounded-xl font-medium bg-rose-50 text-rose-600 border border-rose-200 block';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Đang xác thực...';

    try {
        await HiDB.verifyOtp({ email, token, type: 'recovery' });
        btn.textContent = 'Đang lưu mật khẩu...';
        await HiDB.updateUserPassword(newPw);
        msg.textContent = 'Đổi mật khẩu thành công! Đang chuyển hướng...';
        msg.className = 'text-xs p-2.5 rounded-xl font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 block';
        setTimeout(() => {
            window.closeForgotPasswordModal();
            window.navigateTo('dashboard');
        }, 1200);
    } catch(err) {
        msg.textContent = err.message || 'Mã OTP không đúng hoặc đã hết hạn.';
        msg.className = 'text-xs p-2.5 rounded-xl font-medium bg-rose-50 text-rose-600 border border-rose-200 block';
        btn.disabled = false;
        btn.textContent = 'Xác nhận & Đổi MK';
    }
};

// ── Reset Password Modal Handlers ─────────────────────────────
window.openResetPasswordModal = function() {
    const modal = document.getElementById('modal-reset-password');
    if (!modal) return;
    const msg = document.getElementById('reset-msg');
    if (msg) msg.classList.add('hidden');
    document.getElementById('reset-new-password').value = '';
    document.getElementById('reset-confirm-password').value = '';
    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

window.closeResetPasswordModal = function() {
    window._isPasswordRecoveryMode = false;
    const modal = document.getElementById('modal-reset-password');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
};

window.handleResetPassword = async function(e) {
    e.preventDefault();
    const newPw = document.getElementById('reset-new-password').value;
    const confirmPw = document.getElementById('reset-confirm-password').value;
    const msg = document.getElementById('reset-msg');
    const btn = document.getElementById('btn-reset-submit');

    if (newPw.length < 6) {
        msg.textContent = 'Mật khẩu phải có tối thiểu 6 ký tự.';
        msg.className = 'text-xs p-2.5 rounded-xl font-medium bg-rose-50 text-rose-600 border border-rose-200 block';
        return;
    }
    if (newPw !== confirmPw) {
        msg.textContent = 'Mật khẩu xác nhận không trùng khớp.';
        msg.className = 'text-xs p-2.5 rounded-xl font-medium bg-rose-50 text-rose-600 border border-rose-200 block';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Đang lưu mật khẩu...';

    try {
        await HiDB.updateUserPassword(newPw);
        window._isPasswordRecoveryMode = false;
        msg.textContent = 'Đổi mật khẩu thành công! Đang chuyển đến ứng dụng...';
        msg.className = 'text-xs p-2.5 rounded-xl font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 block';
        history.replaceState(null, '', window.location.pathname);
        setTimeout(() => {
            window.closeResetPasswordModal();
            window.navigateTo('dashboard');
        }, 1200);
    } catch(err) {
        msg.textContent = err.message || 'Không thể đổi mật khẩu. Phiên đặt lại mật khẩu có thể đã hết hạn.';
        msg.className = 'text-xs p-2.5 rounded-xl font-medium bg-rose-50 text-rose-600 border border-rose-200 block';
        btn.disabled = false;
        btn.textContent = 'Lưu Mật khẩu Mới';
    }
};

// ── Settings Change Password Handler ──────────────────────────
window.handleSettingsChangePassword = async function(e) {
    e.preventDefault();
    const newPw = document.getElementById('settings-new-password').value;
    const confirmPw = document.getElementById('settings-confirm-password').value;
    const msg = document.getElementById('settings-pw-msg');
    const btn = document.getElementById('btn-settings-pw-submit');

    if (newPw.length < 6) {
        msg.textContent = 'Mật khẩu phải có tối thiểu 6 ký tự.';
        msg.className = 'text-xs p-2.5 rounded-xl font-medium bg-rose-50 text-rose-600 border border-rose-200 block';
        return;
    }
    if (newPw !== confirmPw) {
        msg.textContent = 'Mật khẩu xác nhận không trùng khớp.';
        msg.className = 'text-xs p-2.5 rounded-xl font-medium bg-rose-50 text-rose-600 border border-rose-200 block';
        return;
    }

    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="material-symbols-outlined text-base animate-spin">progress_activity</span> Đang lưu...';

    try {
        await HiDB.updateUserPassword(newPw);
        msg.textContent = 'Cập nhật mật khẩu thành công! Bạn có thể dùng mật khẩu này để đăng nhập.';
        msg.className = 'text-xs p-2.5 rounded-xl font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 block';
        document.getElementById('settings-new-password').value = '';
        document.getElementById('settings-confirm-password').value = '';
    } catch(err) {
        msg.textContent = err.message || 'Không thể cập nhật mật khẩu. Vui lòng thử lại.';
        msg.className = 'text-xs p-2.5 rounded-xl font-medium bg-rose-50 text-rose-600 border border-rose-200 block';
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
};

// ── Google Login ────────────────────────────────────────────────
window.handleGoogleLogin = async function() {
    const statusEl = document.getElementById('auth-error');
    if (statusEl) { statusEl.classList.add('hidden'); }
    try {
        if (typeof HiDB === 'undefined') throw new Error('Backend chưa sẵn sàng.');
        await HiDB.signInWithGoogle();
        if (window._mockActive) {
            window.navigateTo('dashboard');
        }
    } catch(err) {
        if (statusEl) { 
            statusEl.textContent = '⚠ ' + err.message; 
            statusEl.classList.remove('hidden'); 
        }
    }
};

// ── Bắt đầu ngay (Khám phá trải nghiệm học tập) ─────────────────
window.handleStartNow = async function() {
    window.navigateTo('dashboard');
};

// ── Dev / Demo Mode Toggle ──────────────────────────────────────
window.toggleDevMode = function() {
    const isActive = localStorage.getItem('hi_use_mock') === 'true';
    if (isActive) {
        localStorage.setItem('hi_use_mock', 'false');
        document.getElementById('dev-mode-label').textContent = 'Chế độ Demo (offline)';
        alert('Đã tắt chế độ Demo. Tải lại trang để áp dụng.');
    } else {
        localStorage.setItem('hi_use_mock', 'true');
        if (typeof HiMock !== 'undefined') HiMock.activate();
        document.getElementById('dev-mode-label').textContent = '✓ Demo đang bật — Tắt';
        window.navigateTo('dashboard');
    }
};

// Cập nhật label khi load
document.addEventListener('DOMContentLoaded', () => {
    const lbl = document.getElementById('dev-mode-label');
    if (lbl && localStorage.getItem('hi_use_mock') === 'true') {
        lbl.textContent = '✓ Demo đang bật — Tắt';
    }
});

// ── Topic Categories: sinh động từ cột topics.category trên Supabase ──
window._activeCategory = 'all';
window._allTopics      = [];
window._topicCategories = [{ id: 'all', label: 'Tất cả', icon: 'apps' }];
const DEFAULT_TOPIC_CATEGORIES = [
    'IELTS Actual Tests',
    'CAM',
    'Destination C1-C2',
    'SAT',
    'General English',
    'IELTS/TOEIC',
    'Oxford 3000',
    'CEFR',
    'THPT & ĐGNL',
    'Grammar',
    'Custom',
];

function _topicCategoryValue(category) {
    return String(category || 'general').trim() || 'general';
}

function _topicCategoryIcon(category) {
    const compact = _topicCategoryValue(category).toLowerCase().replace(/[\s/_-]+/g, '');
    if (compact.includes('actual') || compact.includes('vol')) return 'library_books';
    if (compact.includes('dest')) return 'school';
    if (compact === 'cam' || compact.includes('cambridge')) return 'menu_book';
    if (compact.includes('sat')) return 'school';
    if (compact.includes('ielts') || compact.includes('toeic')) return 'military_tech';
    if (compact.includes('cefr')) return 'workspace_premium';
    if (compact.includes('thpt')) return 'school';
    if (compact.includes('idiom') || compact.includes('collocation')) return 'format_quote';
    if (compact.includes('general')) return 'public';
    return 'folder';
}

function _getSavedFolders() {
    try {
        return JSON.parse(localStorage.getItem('hivocab_user_folders') || '[]');
    } catch {
        return [];
    }
}

function _buildTopicCategories(topics = []) {
    const seen = new Set();
    const categories = [{ id: 'all', label: 'Tất cả', icon: 'apps' }];
    topics.forEach(topic => {
        const value = _topicCategoryValue(topic.category);
        const key = value.toLocaleLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        categories.push({ id: value, label: value, icon: _topicCategoryIcon(value) });
    });
    // Bổ sung các thư mục do người dùng tạo (kể cả khi chưa có chủ đề)
    _getSavedFolders().forEach(f => {
        if (!f?.name) return;
        const key = f.name.trim().toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            categories.push({
                id: f.name,
                label: f.name,
                icon: f.isExam ? 'menu_book' : 'folder'
            });
        }
    });
    window._topicCategories = categories;
    return categories;
}

function _renderTopicCategoryDatalist() {
    const list = document.getElementById('topic-category-options');
    if (!list) return;
    const existing = _buildTopicCategories(window._allTopics || [])
        .filter(cat => cat.id !== 'all')
        .map(cat => cat.label);
    const categories = [...new Set([...DEFAULT_TOPIC_CATEGORIES, ...existing])];
    list.innerHTML = categories.map(category => `<option value="${_esc(category)}"></option>`).join('');
}

// Render category tab bar
window._renderCategoryTabs = function() {
    const bar = document.getElementById('category-tabs');
    if (!bar) return;
    const categories = _buildTopicCategories(window._allTopics || []);
    bar.innerHTML = categories.map((cat, index) => {
        const active = cat.id === window._activeCategory;
        return `
        <button onclick="window._switchCategoryByIndex(${index})"
            class="category-tab flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap transition-all duration-200 shrink-0
                   ${active ? 'bg-primary text-on-primary shadow-md' : 'bg-surface-container text-on-surface-variant hover:bg-primary/10 hover:text-primary border border-outline-variant/30'}"
            data-cat="${_esc(cat.id)}">
            <span class="material-symbols-outlined text-[15px]">${cat.icon}</span>
            ${_esc(cat.label)}
        </button>`;
    }).join('');
    _renderTopicCategoryDatalist();
};

// Switch active category tab
window._switchCategory = function(catId) {
    window._activeCategory = catId;
    window._renderCategoryTabs();
    window._renderTopicsGrid();
    setTimeout(() => {
        const tabs = document.querySelectorAll('#category-tabs .category-tab');
        const activeTab = Array.from(tabs).find(btn => btn.getAttribute('data-cat') === String(catId));
        if (activeTab) {
            activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }, 60);
};

window._switchCategoryByIndex = function(index) {
    const cat = window._topicCategories?.[index];
    window._switchCategory(cat?.id || 'all');
};

// Render topics grid filtered by active category (hoặc danh sách thư mục khi ở tab "Tất cả")
window._renderTopicsGrid = async function() {
    const grid = document.getElementById('topics-grid');
    if (!grid) return;

    const subtitleEl = document.getElementById('topics-page-subtitle');

    // show spinner
    grid.innerHTML = `<div class="flex items-center justify-center py-16 col-span-2 sm:col-span-3 lg:col-span-4">
        <span class="material-symbols-outlined text-primary text-[40px] animate-spin">refresh</span>
    </div>`;

    try {
        let topics = window._allTopics;
        if (!topics || topics.length === 0) {
            if (typeof HiDB !== 'undefined') {
                topics = await HiDB.getTopics();
                window._allTopics = topics || [];
            }
        }

        const tableCategories = (topics || []).map(t => ({
            ...t,
            category: _topicCategoryValue(t.category),
        }));

        // Sắp xếp tự nhiên theo tên (Unit 02..26, IELTS Vol 1..9, CAM 10..21)
        tableCategories.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' }));

        window._allTopics = tableCategories;
        window._renderCategoryTabs();

        // ══════════════════════════════════════════════════════════════
        // CHẾ ĐỘ 1: TAB "TẤT CẢ" -> HIỂN THỊ DANH SÁCH THƯ MỤC (FOLDER CARDS)
        // ══════════════════════════════════════════════════════════════
        if (window._activeCategory === 'all') {
            if (subtitleEl) {
                subtitleEl.textContent = 'Khám phá và lựa chọn thư mục học tập của bạn.';
            }

            const categories = _buildTopicCategories(tableCategories);
            const folderList = categories.filter(c => c.id !== 'all');

            // Sắp xếp thư mục theo thứ tự danh mục chuẩn (DEFAULT_TOPIC_CATEGORIES)
            const defaultOrder = (typeof DEFAULT_TOPIC_CATEGORIES !== 'undefined' ? DEFAULT_TOPIC_CATEGORIES : []).map(c => c.toLowerCase());
            folderList.sort((a, b) => {
                const idxA = defaultOrder.indexOf(a.id.toLowerCase());
                const idxB = defaultOrder.indexOf(b.id.toLowerCase());
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;
                return a.label.localeCompare(b.label);
            });

            if (folderList.length === 0) {
                grid.innerHTML = `
                    <div class="col-span-2 sm:col-span-3 lg:col-span-4 flex flex-col items-center justify-center py-16 text-on-surface-variant gap-3">
                        <span class="material-symbols-outlined text-[48px] opacity-40">folder_open</span>
                        <p class="font-semibold">Chưa có thư mục nào</p>
                    </div>`;
                return;
            }

            grid.innerHTML = folderList.map(cat => {
                const catTopics = tableCategories.filter(t => t.category.toLowerCase() === cat.id.toLowerCase());
                const count = catTopics.length;
                const totalProgress = catTopics.reduce((sum, t) => sum + (t.progress || 0), 0);
                const avgProgress = count > 0 ? Math.round(totalProgress / count) : 0;

                return `
                <div onclick="window._switchCategory('${_esc(cat.id)}');"
                    class="folder-card-surface topic-card-surface cursor-pointer group relative bg-surface-container-lowest/80 backdrop-blur-[24px] rounded-2xl p-4 md:p-6 min-h-[160px] md:min-h-[240px] border border-outline-variant/20 soft-shadow flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/40 fade-in">
                    
                    <div class="flex flex-col h-full">
                        <!-- Top: Folder Icon & Topics Count Badge -->
                        <div class="flex items-start justify-between gap-2 mb-2 md:mb-4">
                            <div class="w-8 h-8 md:w-12 md:h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface shadow-sm shrink-0 group-hover:text-primary transition-colors">
                                <span class="material-symbols-outlined text-[18px] md:text-2xl">${cat.icon || 'folder'}</span>
                            </div>
                            <span class="inline-flex items-center px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold bg-surface-container-high text-on-surface-variant border border-outline-variant/30 group-hover:border-primary/40 group-hover:text-primary transition-colors shrink-0">
                                ${count} chủ đề
                            </span>
                        </div>

                        <!-- Middle: Folder Title -->
                        <h3 class="text-sm md:text-lg font-bold text-on-surface group-hover:text-primary transition-colors leading-snug mb-1 line-clamp-2">
                            ${_esc(cat.label)}
                        </h3>

                        <!-- Bottom: Progress Bar -->
                        <div class="mt-auto pt-3 md:pt-4 flex flex-col gap-1 md:gap-2">
                            <div class="flex justify-between items-center font-label-sm text-[9px] md:text-xs text-on-surface-variant">
                                <span>Tiến độ</span>
                                <span class="text-primary font-bold">${avgProgress}%</span>
                            </div>
                            <div class="w-full h-1 md:h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                                <div class="h-full bg-primary rounded-full transition-all duration-500" style="width: ${avgProgress}%"></div>
                            </div>
                        </div>
                    </div>
                </div>`;
            }).join('');
            return;
        }

        // ══════════════════════════════════════════════════════════════
        // CHẾ ĐỘ 2: THƯ MỤC CỤ THỂ -> HIỂN THỊ DANH SÁCH CHỦ ĐỀ CON (TOPIC CARDS)
        // ══════════════════════════════════════════════════════════════
        const activeCatObj = window._topicCategories.find(c => c.id === window._activeCategory);
        const catLabel = activeCatObj?.label || window._activeCategory || 'danh mục này';

        const filtered = tableCategories.filter(t => t.category.toLowerCase() === window._activeCategory.toLowerCase());

        if (subtitleEl) {
            subtitleEl.innerHTML = `Thư mục: <strong class="text-on-surface">${_esc(catLabel)}</strong> &bull; ${filtered.length} chủ đề`;
        }

        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' }));

        if (!filtered || filtered.length === 0) {
            grid.innerHTML = `
                <div class="col-span-2 sm:col-span-3 lg:col-span-4 flex flex-col items-center justify-center py-16 text-on-surface-variant gap-3">
                    <span class="material-symbols-outlined text-[48px] opacity-40">folder_open</span>
                    <p class="font-semibold">Chưa có chủ đề nào trong ${_esc(catLabel)}</p>
                    <button onclick="window.openCreateTopicModal()" class="mt-2 bg-primary/10 text-primary hover:bg-primary/20 font-bold text-sm px-5 py-2 rounded-lg transition-colors flex items-center gap-1">
                        <span class="material-symbols-outlined text-[16px]">add</span>Tạo chủ đề
                    </button>
                </div>`;
            return;
        }

        if (typeof window._isUserPro === 'undefined' && typeof HiDB !== 'undefined' && typeof HiDB.isUserPro === 'function') {
            try { window._isUserPro = await HiDB.isUserPro(); } catch (_) {}
        }

        grid.innerHTML = filtered.map(topic => {
            const pct = topic.progress ?? 0;
            const isPro = Boolean(topic.is_pro);
            const showProBadge = isPro && !window._isUserPro;
            return `
            <div id="topic-card-${topic.id}" onclick="window._openTopic('${topic.id}');"
                class="topic-card-surface cursor-pointer group relative bg-surface-container-lowest/80 backdrop-blur-[24px] rounded-2xl p-4 md:p-6 min-h-[160px] md:min-h-[240px] border border-outline-variant/20 soft-shadow flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg fade-in">
                <button onclick="event.stopPropagation(); window.deleteTopicCard('${topic.id}');" 
                    class="absolute top-2 left-2 md:top-3 md:left-3 w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full text-outline hover:bg-error-container hover:text-error transition-colors z-10">
                    <span class="material-symbols-outlined text-[16px] md:text-[20px]">close</span>
                </button>
                ${showProBadge ? `
                <div class="absolute top-2 right-2 md:top-3 md:right-3 z-10">
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs">
                        <span class="material-symbols-outlined text-[12px]">workspace_premium</span>
                        PRO
                    </span>
                </div>` : ''}
                <div class="flex flex-col h-full mt-4 md:mt-8">
                    <div class="w-8 h-8 md:w-12 md:h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface mb-2 md:mb-4 shadow-sm shrink-0">
                        <span class="material-symbols-outlined text-[18px] md:text-2xl">${topic.icon || 'folder'}</span>
                    </div>
                    <h3 class="text-sm md:text-lg font-bold text-on-surface group-hover:text-primary transition-colors leading-snug mb-1 line-clamp-2">${topic.name}</h3>
                    <div class="mt-auto pt-3 md:pt-4 flex flex-col gap-1 md:gap-2">
                        <div class="flex justify-between items-center font-label-sm text-[9px] md:text-xs text-on-surface-variant"><span>Tiến độ</span><span class="text-primary font-bold">${pct}%</span></div>
                        <div class="w-full h-1 md:h-1.5 rounded-full bg-surface-container-highest overflow-hidden"><div class="h-full bg-primary rounded-full" style="width:${pct}%"></div></div>
                    </div>
                </div>
            </div>`;
        }).join('');

    } catch(err) {
        grid.innerHTML = `<div class="col-span-2 sm:col-span-3 lg:col-span-4 text-center py-12 text-error">${err.message}</div>`;
    }
};

// Open a topic (store in state, navigate)
window._openTopic = function(topicId, topicName, category) {
    // Tra cứu tên từ cache nếu không truyền trực tiếp
    if (!topicName) {
        const cached = (window._allTopics || []).find(t => t.id === topicId);
        topicName = cached?.name || '—';
        category  = cached?.category || 'general';
    }
    window._currentTopicId        = topicId;
    window._currentTopicName      = topicName;
    window._currentCategory       = category;
    window._currentCategoryName   = category;
    window._currentPassageId      = null;
    window._currentPassageNumber  = null;
    window._currentPassageTitle   = null;
    window._currentTopicLabel     = null;
    window._currentTestId         = null;
    window._currentTestIndex      = 0;
    window._currentLessonIndex    = null;
    window._currentLessonWords    = [];
    window._currentLessonWordsKey = null;
    navigateTo('topic-detail');
};

// ── Helper escape HTML ────────────────────────────────────────────
function _esc(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ── LOAD LESSONS vào trang topic-detail ─────────────────────────
window._loadLessons = async function() {
    const topicId   = window._currentTopicId;
    const topicName = window._currentTopicName || '—';

    // Cập nhật tất cả title elements
    ['td-title','td-title-mobile','td-mobile-header-title'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = topicName;
    });
    const sidebarName = document.getElementById('sub-sidebar-topic-name');
    if (sidebarName) sidebarName.textContent = topicName;

    const testTabsContainer = document.getElementById('cam-test-tabs-container');
    const testTabsEl        = document.getElementById('cam-test-tabs');
    const listEl            = document.getElementById('lessons-list');
    if (!listEl) return;

    // Skeleton
    listEl.innerHTML = `<div class="flex items-center justify-center py-12 col-span-3">
        <span class="material-symbols-outlined text-primary text-[40px] animate-spin">refresh</span>
    </div>`;

    if (!topicId) {
        if (testTabsContainer) testTabsContainer.classList.add('hidden');
        listEl.innerHTML = `<div class="col-span-3 text-center py-12 text-on-surface-variant">Không tìm thấy chủ đề.</div>`;
        return;
    }

    try {
        // Kiểm tra xem chủ đề có phân cấp Cambridge (Tests -> Passages) hay không
        let camHierarchy = null;
        if (typeof HiDB !== 'undefined' && typeof HiDB.getCamHierarchy === 'function') {
            camHierarchy = await HiDB.getCamHierarchy(topicId);
        }

        // ============================================================
        // TRƯỜNG HỢP 1: Chế độ Cambridge IELTS (Có phân cấp Test -> Passage)
        // ============================================================
        if (camHierarchy && camHierarchy.tests && camHierarchy.tests.length > 0) {
            window._camHierarchy = camHierarchy;
            if (testTabsContainer) {
                testTabsContainer.classList.remove('hidden');
                testTabsContainer.classList.add('flex');
            }

            const totalTests = camHierarchy.tests.length;
            const totalPassages = camHierarchy.tests.reduce((sum, t) => sum + (t.passages?.length || 0), 0);
            const totalWords = camHierarchy.totalWords || 0;

            const testInfoEl = document.getElementById('cam-test-info');
            if (testInfoEl) {
                testInfoEl.textContent = `${totalTests} bài Test · ${totalPassages} bài đọc`;
            }

            ['td-subtitle','td-subtitle-mobile'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = `${totalTests} bài Test · ${totalPassages} bài đọc · ${totalWords} từ vựng`;
            });

            // Đảm bảo testIndex hợp lệ
            if (window._currentTestIndex === null || window._currentTestIndex === undefined || window._currentTestIndex >= totalTests) {
                window._currentTestIndex = 0;
            }

            // Render Test Tabs
            if (testTabsEl) {
                testTabsEl.innerHTML = camHierarchy.tests.map((t, idx) => {
                    const active = idx === window._currentTestIndex;
                    return `
                    <button onclick="window._selectCamTest(${idx})"
                        class="flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap transition-all duration-200 shrink-0
                               ${active ? 'bg-primary text-on-primary shadow-md' : 'bg-surface-container text-on-surface-variant hover:bg-primary/10 hover:text-primary border border-outline-variant/30'}">
                        <span>${_esc(t.name)}</span>
                        <span class="text-[11px] px-2 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-surface-container-high text-on-surface-variant'}">${t.totalWords} từ</span>
                    </button>`;
                }).join('');
            }

            // Render Passages cho Test đang chọn
            window._renderCamPassages(window._currentTestIndex);

            // Cập nhật hiển thị nút Đọc & Dịch trên Sub-sidebar nếu có bài đọc
            if (typeof window.updateBilingualNavVisibility === 'function') {
                window.updateBilingualNavVisibility(
                    { category: window._currentCategory || window._currentCategoryName, name: topicName },
                    null
                );
            }
            return;
        }

        // ============================================================
        // TRƯỜNG HỢP 2: Chủ đề Non-CAM (Oxford 3000, IELTS, Idioms, v.v.)
        // ============================================================
        if (testTabsContainer) {
            testTabsContainer.classList.add('hidden');
            testTabsContainer.classList.remove('flex');
        }
        window._camHierarchy = null;

        // Ẩn nút Đọc & Dịch với chủ đề Non-CAM
        if (typeof window.updateBilingualNavVisibility === 'function') {
            window.updateBilingualNavVisibility(
                { category: window._currentCategory || window._currentCategoryName, name: topicName },
                null
            );
        }

        const lessons = typeof HiDB !== 'undefined'
            ? await HiDB.getLessonsInTopic(topicId)
            : [];

        if (!lessons || lessons.length === 0) {
            listEl.innerHTML = `<div class="col-span-3 flex flex-col items-center justify-center py-20 text-on-surface-variant gap-3">
                <span class="material-symbols-outlined text-[48px] opacity-30">menu_book</span>
                <p class="font-semibold">Chủ đề này chưa có từ vựng nào.</p>
            </div>`;
            return;
        }

        // Cập nhật subtitle
        const totalWords = lessons.reduce((s, l) => s + l.totalWords, 0);
        ['td-subtitle','td-subtitle-mobile'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = `${lessons.length} lesson · ${totalWords} từ`;
        });

        // Lưu lessons vào cache để _openLesson tra cứu
        window._lessonsCache = window._lessonsCache || {};
        window._lessonsCache[topicId] = lessons;

        if (typeof window._isUserPro === 'undefined' && typeof HiDB !== 'undefined' && typeof HiDB.isUserPro === 'function') {
            try { window._isUserPro = await HiDB.isUserPro(); } catch (_) {}
        }

        const currentTopicObj = (window._allTopics || []).find(t => t.id === topicId);
        const isTopicPro = Boolean(currentTopicObj?.is_pro);
        const showTopicProBadge = isTopicPro && !window._isUserPro;

        listEl.innerHTML = lessons.map(lesson => {
            const prog = lesson.progress || 0;
            const barColor = prog >= 80 ? 'bg-green-500' : prog >= 40 ? 'bg-primary' : 'bg-yellow-400';
            return `
            <div onclick="window._openLesson('${topicId}', ${lesson.index})"
                 class="cursor-pointer group bg-surface-container-lowest/80 backdrop-blur-[24px] rounded-2xl p-5 border border-outline-variant/20 soft-shadow flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg fade-in">
                <div class="flex items-start justify-between gap-2">
                    <div class="w-10 h-10 rounded-xl ${showTopicProBadge ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-primary/10 text-primary'} flex items-center justify-center shrink-0">
                        <span class="material-symbols-outlined text-[22px]">${showTopicProBadge ? 'workspace_premium' : 'menu_book'}</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        ${showTopicProBadge ? `
                        <span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs">
                            <span class="material-symbols-outlined text-[12px]">lock</span>
                            PRO
                        </span>` : ''}
                        <span class="text-xs font-bold px-2 py-1 rounded-full bg-primary/10 text-primary">${prog}%</span>
                    </div>
                </div>
                <div class="flex-1">
                    <h3 class="font-bold text-on-surface group-hover:text-primary transition-colors">${_esc(lesson.name)}</h3>
                    <p class="text-sm text-on-surface-variant mt-0.5">${lesson.totalWords} từ vựng</p>
                </div>
                <div class="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                    <div class="h-full ${barColor} rounded-full transition-all duration-700" style="width:${prog}%"></div>
                </div>
            </div>`;
        }).join('');

    } catch (err) {
        console.error('[_loadLessons]', err);
        listEl.innerHTML = `<div class="col-span-3 text-center py-12 text-error">
            <span class="material-symbols-outlined text-[40px] mb-2 block">error</span>
            Lỗi tải bài học: ${_esc(err.message)}
        </div>`;
    }
};

// ── CHỌN TEST TRONG CAMBRIDGE TOPIC ──────────────────────────────
window._selectCamTest = function(testIndex) {
    window._currentTestIndex = testIndex;
    const camHierarchy = window._camHierarchy;
    if (!camHierarchy || !camHierarchy.tests) return;

    // Cập nhật giao diện tabs
    const tabsEl = document.getElementById('cam-test-tabs');
    if (tabsEl) {
        tabsEl.querySelectorAll('button').forEach((btn, idx) => {
            const active = idx === testIndex;
            btn.className = `flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap transition-all duration-200 shrink-0 ${active ? 'bg-primary text-on-primary shadow-md' : 'bg-surface-container text-on-surface-variant hover:bg-primary/10 hover:text-primary border border-outline-variant/30'}`;
            const badge = btn.querySelector('span:last-child');
            if (badge) {
                badge.className = `text-[11px] px-2 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-surface-container-high text-on-surface-variant'}`;
            }
        });
    }

    window._renderCamPassages(testIndex);
};

// ── RENDER CÁC PASSAGE CỦA TEST HIỆN TẠI ────────────────────────
window._renderCamPassages = function(testIndex = 0) {
    const topicId = window._currentTopicId;
    const camHierarchy = window._camHierarchy;
    if (!camHierarchy || !camHierarchy.tests) return;

    const currentTest = camHierarchy.tests[testIndex] || camHierarchy.tests[0];
    if (!currentTest) return;

    window._currentTestId   = currentTest.id;
    window._currentTestName = currentTest.name;

    const listEl = document.getElementById('lessons-list');
    if (!listEl) return;

    const passages = currentTest.passages || [];

    let html = passages.map(p => {
        const prog = p.progress || 0;
        const barColor = prog >= 80 ? 'bg-green-500' : prog >= 40 ? 'bg-primary' : 'bg-yellow-400';
        const isPro = Boolean(p.isPro);
        const showPassageProBadge = isPro && !window._isUserPro;
        return `
        <div onclick="window._openPassage('${topicId}', '${p.id}', '${currentTest.id}', ${p.passageNumber}, '${_esc(p.title)}', '${_esc(p.topicLabel)}', '${_esc(currentTest.name)}', ${isPro})"
             class="cursor-pointer group bg-surface-container-lowest/80 backdrop-blur-[24px] rounded-2xl p-5 border border-outline-variant/20 soft-shadow flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg fade-in">
            <div>
                <!-- Top row: Badge Passage X + Rename + Progress % -->
                <div class="flex items-center justify-between gap-2 mb-3">
                    <div class="flex items-center gap-1.5">
                        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                            <span class="material-symbols-outlined text-[15px]">article</span>
                            Passage ${p.passageNumber}
                        </span>
                        ${showPassageProBadge ? `
                        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs">
                            <span class="material-symbols-outlined text-[12px]">workspace_premium</span>
                            PRO
                        </span>` : ''}
                    </div>
                    <div class="flex items-center gap-1.5">
                        ${p.contentEn || p.contentVi ? `
                        <button onclick="event.stopPropagation(); window._openPassageReader('${p.id}', this, ${isPro})"
                                class="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                                title="Đọc bài song ngữ">
                            <span class="material-symbols-outlined text-[15px]">menu_book</span>
                            <span>Đọc bài</span>
                        </button>` : ''}
                        <button onclick="event.stopPropagation(); window._openRenamePassage('${p.id}', '${_esc(p.title)}')"
                                class="w-8 h-8 flex items-center justify-center rounded-lg text-outline hover:text-primary hover:bg-primary/10 transition-all cursor-pointer active:scale-95"
                                title="Đổi tên passage">
                            <span class="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">${prog}%</span>
                    </div>
                </div>
                <!-- Title & Topic Label -->
                <h3 class="text-base md:text-lg font-bold text-on-surface group-hover:text-primary transition-colors leading-snug line-clamp-2">
                    ${_esc(p.title)}
                </h3>
                ${p.topicLabel ? `
                <p class="text-xs text-outline mt-2 line-clamp-2 flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[14px]">label</span>
                    ${_esc(p.topicLabel)}
                </p>` : ''}
            </div>
            
            <!-- Bottom: Word count & action buttons -->
            <div class="mt-4 pt-3 border-t border-outline-variant/10 flex flex-col gap-2.5">
                <div class="flex justify-between items-center text-xs text-on-surface-variant">
                    <span class="flex items-center gap-1 font-medium">
                        <span class="material-symbols-outlined text-[15px]">school</span>
                        ${p.totalWords} từ vựng
                    </span>
                    <div class="flex items-center gap-2">
                        ${p.contentEn || p.contentVi ? `
                        <button onclick="event.stopPropagation(); window._openPassageReader('${p.id}', this, ${isPro})"
                                class="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 transition-all flex items-center gap-1 active:scale-95 cursor-pointer">
                            <span class="material-symbols-outlined text-[14px]">menu_book</span>
                            <span>Đọc</span>
                        </button>` : ''}
                        <span class="font-bold text-primary flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                            ${showPassageProBadge ? '<span class="material-symbols-outlined text-[15px] text-amber-500 mr-0.5">lock</span>' : ''}
                            Học ngay <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </span>
                    </div>
                </div>
                <div class="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                    <div class="h-full ${barColor} rounded-full transition-all duration-700" style="width:${prog}%"></div>
                </div>
            </div>
        </div>`;
    }).join('');

    // Nếu có từ vựng bổ sung/unlinked (ví dụ từ người dùng tự lưu vào CAM folder)
    if (camHierarchy.unlinkedWords && camHierarchy.unlinkedWords.length > 0) {
        const unlinkedCount = camHierarchy.unlinkedWords.length;
        html += `
        <div onclick="window._openUnlinkedWords('${topicId}')"
             class="col-span-1 sm:col-span-2 lg:col-span-3 cursor-pointer group bg-surface-container-lowest/80 backdrop-blur-[24px] rounded-2xl p-5 border border-dashed border-outline-variant/50 soft-shadow flex items-center justify-between transition-all duration-300 hover:border-primary hover:shadow-md fade-in">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined">library_add_check</span>
                </div>
                <div>
                    <h4 class="font-bold text-on-surface group-hover:text-primary transition-colors text-sm md:text-base">Từ vựng tự thêm / Bổ sung</h4>
                    <p class="text-xs text-on-surface-variant mt-0.5">${unlinkedCount} từ do bạn tự lưu vào chủ đề này</p>
                </div>
            </div>
            <div class="flex items-center gap-1 text-primary text-xs font-bold">
                <span>Xem từ</span>
                <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
            </div>
        </div>`;
    }

    listEl.innerHTML = html;
};

// ── KIỂM TRA QUYỀN TRUY CẬP PRO TẬP TRUNG (Khóa chặt không kẽ hở) ──
window.checkProAccess = async function({ topicId, passageId, showModal = true } = {}) {
    try {
        if (typeof HiDB === 'undefined') return true;
        const isPro = await HiDB.isUserPro();
        if (isPro) return true; // User đã là PRO: được phép truy cập 100%

        // 1. Kiểm tra passage cụ thể (đối với Cambridge IELTS)
        if (passageId && passageId !== '__unlinked__') {
            if (window._camHierarchy?.tests) {
                for (const t of window._camHierarchy.tests) {
                    const p = (t.passages || []).find(item => item.id === passageId);
                    if (p && p.isPro) {
                        if (showModal && typeof window.openPricingModal === 'function') {
                            window.openPricingModal();
                        }
                        return false;
                    }
                }
            }
        }

        // 2. Kiểm tra topic (ví dụ: Cambridge, Destination C1-C2, SAT 3500...)
        const tid = topicId || window._currentTopicId;
        if (tid) {
            let topic = (window._allTopics || []).find(t => t.id === tid);
            if (!topic && typeof HiDB.getTopics === 'function') {
                const topics = await HiDB.getTopics().catch(() => []);
                topic = (topics || []).find(t => t.id === tid);
            }
            if (topic && topic.is_pro) {
                if (showModal && typeof window.openPricingModal === 'function') {
                    window.openPricingModal();
                }
                return false;
            }
        }

        return true;
    } catch (err) {
        console.warn('[checkProAccess]', err);
        return true;
    }
};

// ── MỞ PASSAGE (Cambridge) ───────────────────────────────────────
window._openPassage = async function(topicId, passageId, testId, passageNumber, passageTitle, topicLabel, testName, isPro) {
    const hasAccess = await window.checkProAccess({ topicId, passageId });
    if (!hasAccess) return;

    const topicName = window._currentTopicName || '—';
    window._currentTopicId        = topicId;
    window._currentPassageId      = passageId;
    window._currentTestId         = testId;
    window._currentTestName       = testName;
    window._currentPassageNumber  = passageNumber;
    window._currentPassageTitle   = passageTitle;
    window._currentTopicLabel     = topicLabel;
    window._currentLessonIndex    = null; // Clear non-CAM lesson index
    window._currentLessonName     = `Passage ${passageNumber}: ${passageTitle}`;
    window._currentLessonWords    = [];
    window._currentLessonWordsKey = null;

    try {
        sessionStorage.setItem('hi_current_lesson_state', JSON.stringify({
            topicId, passageId, testId, passageNumber, passageTitle, topicLabel, testName,
            topicName: window._currentTopicName, lessonName: window._currentLessonName
        }));
    } catch(e) {}

    navigateTo('lesson-detail');
};

// ── MỞ TỪ VỰNG TỰ THÊM (Unlinked words) ──────────────────────────
window._openUnlinkedWords = async function(topicId) {
    const hasAccess = await window.checkProAccess({ topicId });
    if (!hasAccess) return;

    const topicName = window._currentTopicName || '—';
    window._currentTopicId        = topicId;
    window._currentPassageId      = '__unlinked__';
    window._currentTestId         = null;
    window._currentTestName       = null;
    window._currentPassageNumber  = null;
    window._currentPassageTitle   = 'Từ vựng tự thêm / Bổ sung';
    window._currentTopicLabel     = 'Từ người dùng tự lưu';
    window._currentLessonIndex    = null;
    window._currentLessonName     = 'Từ vựng tự thêm / Bổ sung';
    window._currentLessonWords    = [];
    window._currentLessonWordsKey = null;

    try {
        sessionStorage.setItem('hi_current_lesson_state', JSON.stringify({
            topicId, passageId: '__unlinked__', testId: null, passageNumber: null,
            passageTitle: 'Từ vựng tự thêm / Bổ sung', topicLabel: 'Từ người dùng tự lưu',
            testName: null, topicName: window._currentTopicName, lessonName: window._currentLessonName
        }));
    } catch(e) {}

    navigateTo('lesson-detail');
};

// ── MỞ LESSON (Non-CAM) ──────────────────────────────────────────
window._openLesson = async function(topicId, lessonIndex) {
    const hasAccess = await window.checkProAccess({ topicId });
    if (!hasAccess) return;

    // Tra cứu tên từ cache
    const cachedLessons = window._lessonsCache?.[topicId] || [];
    const lesson = cachedLessons.find(l => l.index === lessonIndex);
    const lessonName = lesson?.name || `Lesson ${lessonIndex + 1}`;

    const topicName = window._currentTopicName || '—';

    window._currentTopicId        = topicId;
    window._currentPassageId      = null;
    window._currentTestId         = null;
    window._currentTestName       = null;
    window._currentPassageNumber  = null;
    window._currentPassageTitle   = null;
    window._currentTopicLabel     = null;
    window._currentLessonIndex    = lessonIndex;
    window._currentLessonName     = lessonName;
    window._currentLessonProgress = Math.round(lesson?.progress || 0);
    window._currentLessonWords    = [];
    window._currentLessonWordsKey = null;

    try {
        sessionStorage.setItem('hi_current_lesson_state', JSON.stringify({
            topicId, passageId: null, testId: null, passageNumber: null,
            passageTitle: null, topicLabel: null, testName: null, lessonIndex,
            topicName: window._currentTopicName, lessonName, lessonProgress: window._currentLessonProgress
        }));
    } catch(e) {}

    navigateTo('lesson-detail');
};

// ── LOAD WORDS vào trang lesson-detail ──────────────────────────
window._loadLessonWords = async function() {
    if (!window._currentTopicId) {
        try {
            const saved = JSON.parse(sessionStorage.getItem('hi_current_lesson_state') || '{}');
            if (saved.topicId) {
                window._currentTopicId        = saved.topicId;
                window._currentPassageId      = saved.passageId;
                window._currentTestId         = saved.testId;
                window._currentTestName       = saved.testName;
                window._currentPassageNumber  = saved.passageNumber;
                window._currentPassageTitle   = saved.passageTitle;
                window._currentTopicLabel     = saved.topicLabel;
                window._currentLessonIndex    = saved.lessonIndex;
                window._currentLessonName     = saved.lessonName;
                window._currentTopicName      = saved.topicName || window._currentTopicName;
                window._currentLessonProgress = saved.lessonProgress || 0;
            }
        } catch(e) {}
    }

    const topicId     = window._currentTopicId;
    const topicName   = window._currentTopicName   || '—';
    const passageId   = window._currentPassageId;
    const lessonIndex = window._currentLessonIndex;
    const lessonName  = window._currentLessonName   || (passageId ? 'Passage' : `Lesson ${(lessonIndex ?? 0) + 1}`);

    // Cập nhật tiêu đề trang
    ['ld-title','ld-title-mobile','ld-mobile-header-title'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = lessonName;
    });

    // Cập nhật sidebar
    const sidebarTopic = document.getElementById('ld-sidebar-topic');
    if (sidebarTopic) {
        if (passageId && window._currentTestName) {
            sidebarTopic.textContent = `${topicName} · ${window._currentTestName}`;
        } else {
            sidebarTopic.textContent = topicName;
        }
    }
    const sidebarLesson = document.getElementById('ld-sidebar-lesson');
    if (sidebarLesson) sidebarLesson.textContent = lessonName;

    // Cập nhật badge trên mobile header card
    const badgeMobile = document.getElementById('ld-badge-mobile');
    if (badgeMobile) {
        if (passageId === '__unlinked__') {
            badgeMobile.textContent = 'Bổ sung';
        } else if (passageId) {
            badgeMobile.textContent = `Passage ${window._currentPassageNumber || ''}`.trim();
        } else {
            badgeMobile.textContent = 'Lesson';
        }
    }

    const listEl = document.getElementById('lesson-words-list');
    if (!listEl) return;

    listEl.innerHTML = `<div class="flex items-center justify-center py-12">
        <span class="material-symbols-outlined text-primary text-[40px] animate-spin">refresh</span>
    </div>`;

    if (!topicId && topicId !== 0) {
        listEl.innerHTML = `<p class="text-center py-12 text-on-surface-variant">Không tìm thấy bài học.</p>`;
        return;
    }

    // KIỂM TRA QUYỀN PRO: Không cho phép xem trước danh sách từ của chủ đề/passage PRO
    const hasAccess = await window.checkProAccess({ topicId, passageId, showModal: false });
    if (!hasAccess) {
        listEl.innerHTML = `
            <div class="col-span-full py-16 text-center space-y-4 max-w-md mx-auto">
                <div class="w-16 h-16 rounded-3xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
                    <span class="material-symbols-outlined text-3xl">lock</span>
                </div>
                <div class="space-y-1">
                    <h3 class="text-xl font-black text-on-surface">Nội dung dành riêng cho gói PRO</h3>
                    <p class="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                        Chủ đề này thuộc gói tài liệu cao cấp. Nâng cấp HiVocab PRO để mở khóa toàn bộ từ vựng và luyện tập không giới hạn.
                    </p>
                </div>
                <div class="pt-2">
                    <button onclick="window.openPricingModal()" class="py-2.5 px-6 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs shadow-md shadow-amber-500/25 transition-all cursor-pointer inline-flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-base">diamond</span>
                        <span>Mở khóa PRO ngay</span>
                    </button>
                </div>
            </div>`;
        return;
    }

    try {
        let words = [];
        if (passageId === '__unlinked__') {
            const hier = window._camHierarchy || (typeof HiDB !== 'undefined' && typeof HiDB.getCamHierarchy === 'function' ? await HiDB.getCamHierarchy(topicId) : null);
            words = hier?.unlinkedWords || [];
        } else if (passageId) {
            words = typeof HiDB !== 'undefined' && typeof HiDB.getWordsInPassage === 'function'
                ? await HiDB.getWordsInPassage(passageId)
                : [];
        } else {
            words = typeof HiDB !== 'undefined' && typeof HiDB.getWordsInLesson === 'function'
                ? await HiDB.getWordsInLesson(topicId, lessonIndex ?? 0)
                : [];
        }

        window._currentLessonWords = words;
        window._currentLessonWordsKey = passageId ? `passage:${passageId}` : `${topicId}::${lessonIndex ?? 0}`;

        // Cập nhật subtitle
        let subtitle = `${words.length} từ vựng`;
        if (passageId && window._currentTopicLabel) {
            subtitle = `${window._currentTopicLabel} · ${words.length} từ vựng`;
        }
        ['ld-subtitle','ld-subtitle-mobile'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = subtitle;
        });

        // Cập nhật hiển thị tính năng Đọc & Dịch trên Desktop & Mobile (chỉ hiện khi có bài dịch)
        let currPassageObj = null;
        if (window._camHierarchy?.tests) {
            for (const t of window._camHierarchy.tests) {
                const found = (t.passages || []).find(p => p.id === passageId);
                if (found) { currPassageObj = found; break; }
            }
        }
        if (typeof window.updateBilingualNavVisibility === 'function') {
            window.updateBilingualNavVisibility(
                { category: window._currentCategory || window._currentCategoryName, name: topicName },
                currPassageObj || (passageId && passageId !== '__unlinked__' ? { id: passageId } : null)
            );
        }

        // Cập nhật progress trên mobile card
        if (words.length > 0) {
            const totalLevel = words.reduce((sum, w) => sum + (w.level || 0), 0);
            const prog = Math.round((totalLevel / (words.length * 5)) * 100);
            const pctEl = document.getElementById('ld-progress-pct-mobile');
            const barEl = document.getElementById('ld-progress-bar-mobile');
            if (pctEl) pctEl.textContent = prog + '%';
            if (barEl) barEl.style.width = prog + '%';
        }

        if (!words || words.length === 0) {
            listEl.innerHTML = `<div class="flex flex-col items-center justify-center py-20 text-on-surface-variant gap-3">
                <span class="material-symbols-outlined text-[48px] opacity-30">inbox</span>
                <p class="font-semibold">Phần này chưa có từ vựng.</p>
            </div>`;
            return;
        }

        const lvLabel = ['Mới','1h','8h','1 ngày','1 tuần','1 tháng'];
        const lvColor = ['bg-surface-container text-outline','bg-red-100 text-red-700','bg-yellow-100 text-yellow-700','bg-blue-100 text-blue-700','bg-green-100 text-green-700','bg-green-200 text-green-800'];

        listEl.innerHTML = words.map((w, i) => {
            const lv = Math.min(w.level || 0, 5);
            const animDelay = i < 12 ? `style="animation-delay:${i*0.025}s"` : '';
            return `
            <div class="group bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 flex items-start gap-4 soft-shadow hover:shadow-md transition-all fade-in" ${animDelay}>
                <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span class="text-sm font-bold text-primary">${i+1}</span>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-bold text-on-surface text-base group-hover:text-primary transition-colors">${_esc(w.word)}</span>
                        ${w.pos ? `<span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">${_esc(w.pos)}</span>` : ''}
                        ${w.phonetic ? `<span class="text-sm text-outline">${_esc(w.phonetic)}</span>` : ''}
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${lvColor[lv]}">${lvLabel[lv]}</span>
                        <button data-audio-word="${_esc(w.word)}"
                            onclick="if(typeof HiDict!=='undefined'&&HiDict.playWordAudio){HiDict.playWordAudio(this.dataset.audioWord)}else if('speechSynthesis' in window){const u=new SpeechSynthesisUtterance(this.dataset.audioWord);u.lang='en-US';window.speechSynthesis.speak(u);}"
                            class="ml-auto p-1 rounded-full hover:bg-primary/10 transition-colors text-outline hover:text-primary cursor-pointer" title="Phát âm">
                            <span class="material-symbols-outlined text-[18px]">volume_up</span>
                        </button>
                    </div>
                    <p class="text-sm text-on-surface-variant mt-1">${_esc(w.meaning)}</p>
                    ${w.exampleSentence ? `<p class="text-sm text-outline italic mt-1 line-clamp-2">${_esc(w.exampleSentence)}</p>` : ''}
                </div>
                ${(w.imageUrl || w.image_url) ? `
                <div class="hidden sm:flex shrink-0 self-center">
                    <img src="${_esc(w.imageUrl || w.image_url)}" alt="${_esc(w.word)}"
                         class="w-14 h-14 object-contain rounded-lg border border-outline-variant/20 bg-surface-container-low"
                         loading="lazy"
                         onerror="this.parentElement.style.display='none'" />
                </div>` : ''}
            </div>`;
        }).join('');

    } catch (err) {
        console.error('[_loadLessonWords]', err);
        listEl.innerHTML = `<div class="text-center py-12 text-error">
            <span class="material-symbols-outlined text-[40px] mb-2 block">error</span>
            Lỗi tải từ vựng: ${_esc(err.message)}
        </div>`;
    }
};

// ── TÌM KIẾM TỪ TRONG LESSON ────────────────────────────────────
window.filterLessonWords = function() {
    const q = (document.getElementById('ld-search')?.value || document.getElementById('ld-search-mobile')?.value || '').toLowerCase();
    document.querySelectorAll('#lesson-words-list > div[class]').forEach(card => {
        card.style.display = (!q || card.textContent.toLowerCase().includes(q)) ? '' : 'none';
    });
};

// ── BỘ CHỌN ĐÍCH LƯU PHÂN CẤP (HIERARCHICAL DESTINATION PICKER) ──
window._topicPickerState = {
    isOpen: false,
    callback: null,
    step: 'folder', // 'folder' | 'topic' | 'test' | 'passage'
    options: {},
    allTopics: [],
    foldersMap: {},
    currentFolder: null,
    currentTopic: null,
    currentTest: null,
    topicTestsCache: new Map()
};

window.openTopicPicker = async function(callback, options = {}) {
    window._topicPickerState.callback = callback;
    window._topicPickerState.options = options || {};
    window._topicPickerState.currentFolder = null;
    window._topicPickerState.currentTopic = null;
    window._topicPickerState.currentTest = null;

    const modal = document.getElementById('modal-topic-picker');
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    window._topicPickerState.isOpen = true;
    window._modalTopicPickerOpenedAt = Date.now();

    const folderList = document.getElementById('topic-picker-folder-list');
    if (folderList) {
        folderList.innerHTML = `
            <div class="flex flex-col items-center justify-center py-10 text-outline gap-2">
                <span class="material-symbols-outlined text-primary text-[28px] animate-spin">refresh</span>
                <span class="text-xs font-medium">Đang tải danh sách thư mục...</span>
            </div>
        `;
    }

    try {
        let topics = [];
        if (typeof HiDB !== 'undefined' && typeof HiDB.getTopics === 'function') {
            topics = await HiDB.getTopics().catch(() => []);
        }
        window._topicPickerState.allTopics = topics || [];

        const foldersMap = {};
        (topics || []).forEach(t => {
            let f = (t.category || 'General English').trim();
            if (f.toLowerCase() === 'general') f = 'General English';
            if (!foldersMap[f]) foldersMap[f] = [];
            foldersMap[f].push(t);
        });
        window._topicPickerState.foldersMap = foldersMap;

        window.renderTopicPickerFolderStep();
    } catch (err) {
        console.error('[openTopicPicker]', err);
        const statusEl = document.getElementById('topic-picker-status');
        if (statusEl) {
            statusEl.textContent = 'Lỗi tải chủ đề: ' + (err.message || 'Thất bại');
            statusEl.classList.remove('hidden');
        }
    }
};

window.closeTopicPicker = function() {
    const modal = document.getElementById('modal-topic-picker');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    window._topicPickerState.isOpen = false;
};

document.getElementById('modal-topic-picker')?.addEventListener('click', function(e) {
    if (Date.now() - (window._modalTopicPickerOpenedAt || 0) < 350) return;
    if (e.target === this) window.closeTopicPicker();
});

window.renderTopicPickerFolderStep = function() {
    window._topicPickerState.step = 'folder';
    window._topicPickerState.currentFolder = null;
    window._topicPickerState.currentTopic = null;
    window._topicPickerState.currentTest = null;

    const backBtn = document.getElementById('topic-picker-back-btn');
    const titleEl = document.getElementById('topic-picker-title');
    const subtitleEl = document.getElementById('topic-picker-subtitle');
    const statusEl = document.getElementById('topic-picker-status');

    if (backBtn) {
        backBtn.classList.add('hidden');
        backBtn.classList.remove('flex');
    }
    if (titleEl) titleEl.textContent = window._topicPickerState.options.title || 'Chọn thư mục';
    if (subtitleEl) subtitleEl.textContent = window._topicPickerState.options.subtitle || 'Bước 1/4: Chọn danh mục từ vựng';
    if (statusEl) statusEl.classList.add('hidden');

    document.getElementById('topic-picker-step-folder')?.classList.remove('hidden');
    document.getElementById('topic-picker-step-topic')?.classList.add('hidden');
    document.getElementById('topic-picker-step-test')?.classList.add('hidden');
    document.getElementById('topic-picker-step-passage')?.classList.add('hidden');

    const folderNames = Object.keys(window._topicPickerState.foldersMap).sort((a, b) => {
        if (a.toLowerCase() === 'cam') return -1;
        if (b.toLowerCase() === 'cam') return 1;
        if (a.toLowerCase().includes('ielts actual')) return -1;
        if (b.toLowerCase().includes('ielts actual')) return 1;
        return a.localeCompare(b, 'vi');
    });

    const folderList = document.getElementById('topic-picker-folder-list');
    if (!folderList) return;

    if (folderNames.length === 0) {
        folderList.innerHTML = '<p class="text-center text-xs text-outline py-8">Chưa có thư mục nào</p>';
        return;
    }

    const folderMeta = {
        'CAM': { label: 'Cambridge IELTS', icon: '📘', desc: 'Trọn bộ đề CAM 10 – 21' },
        'IELTS Actual Tests': { label: 'IELTS Actual Tests', icon: '📗', desc: 'Trọn bộ Actual Tests Vol 1 – 9' },
        'oxford3000': { label: 'Oxford 3000', icon: '📕', desc: '3000 từ vựng cốt lõi' },
        'Destination C1-C2': { label: 'Destination C1-C2', icon: '📙', desc: 'Từ vựng học thuật nâng cao' },
        'THPT/ĐGNL': { label: 'Luyện thi THPT / ĐGNL', icon: '🎓', desc: 'Bộ từ vựng trọng tâm thi cử' },
        'SAT': { label: 'SAT Vocabulary', icon: '🎯', desc: 'Từ vựng luyện thi SAT chuẩn Barron' },
        'General English': { label: 'General English', icon: '📁', desc: 'Sổ tay từ vựng & chủ đề cá nhân' },
    };

    folderList.innerHTML = folderNames.map(f => {
        const meta = folderMeta[f] || { label: f, icon: '📁', desc: `${window._topicPickerState.foldersMap[f].length} chủ đề` };
        const count = window._topicPickerState.foldersMap[f].length;
        return `
            <button type="button" onclick="window.topicPickerSelectFolder('${_esc(f)}')"
                    class="w-full p-3.5 rounded-2xl bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/20 hover:border-primary/40 flex items-center justify-between text-left transition-all active:scale-[0.99] cursor-pointer group">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 text-base font-bold">
                        ${meta.icon}
                    </div>
                    <div class="min-w-0">
                        <span class="text-sm font-bold text-on-surface truncate block">${_esc(meta.label)}</span>
                        <span class="text-[11px] text-on-surface-variant truncate block">${_esc(meta.desc)}</span>
                    </div>
                </div>
                <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-container text-outline group-hover:text-primary group-hover:bg-primary/10 transition-colors shrink-0 ml-2">
                    ${count} chủ đề ›
                </span>
            </button>
        `;
    }).join('');
};

window.topicPickerSelectFolder = function(folderName) {
    window._topicPickerState.step = 'topic';
    window._topicPickerState.currentFolder = folderName;
    window._topicPickerState.currentTopic = null;
    window._topicPickerState.currentTest = null;

    const backBtn = document.getElementById('topic-picker-back-btn');
    const backLabel = document.getElementById('topic-picker-back-label');
    const titleEl = document.getElementById('topic-picker-title');
    const subtitleEl = document.getElementById('topic-picker-subtitle');
    const statusEl = document.getElementById('topic-picker-status');

    if (backBtn) {
        backBtn.classList.remove('hidden');
        backBtn.classList.add('flex');
    }
    if (backLabel) backLabel.textContent = 'Thư mục';
    if (titleEl) titleEl.textContent = folderName;
    if (subtitleEl) subtitleEl.textContent = 'Bước 2/4: Chọn cuốn sách / chủ đề';
    if (statusEl) statusEl.classList.add('hidden');

    document.getElementById('topic-picker-step-folder')?.classList.add('hidden');
    document.getElementById('topic-picker-step-topic')?.classList.remove('hidden');
    document.getElementById('topic-picker-step-test')?.classList.add('hidden');
    document.getElementById('topic-picker-step-passage')?.classList.add('hidden');

    const topics = window._topicPickerState.foldersMap[folderName] || [];
    const topicList = document.getElementById('topic-picker-topic-list');
    if (!topicList) return;

    if (topics.length === 0) {
        topicList.innerHTML = '<p class="text-center text-xs text-outline py-8">Thư mục này chưa có chủ đề</p>';
        return;
    }

    topicList.innerHTML = topics.map(t => `
        <button type="button" onclick="window.topicPickerSelectTopic('${t.id}')"
                class="w-full p-3.5 rounded-2xl bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/20 hover:border-primary/40 flex items-center justify-between text-left transition-all active:scale-[0.99] cursor-pointer group">
            <div class="flex items-center gap-3 min-w-0">
                <div class="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 text-base font-bold">
                    ${t.icon && t.icon.length <= 2 ? t.icon : '📖'}
                </div>
                <div class="min-w-0">
                    <span class="text-sm font-semibold text-on-surface truncate block">${_esc(t.name)}</span>
                    <span class="text-[11px] text-on-surface-variant">${t.totalWords || 0} từ vựng</span>
                </div>
            </div>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-container text-outline group-hover:text-primary group-hover:bg-primary/10 transition-colors shrink-0 ml-2">
                Chọn ›
            </span>
        </button>
    `).join('');
};

window._fetchTopicTestsDirectly = async function(topicId) {
    if (!topicId) return { hasTests: false, tests: [] };

    // 1. Kiểm tra bộ nhớ cache
    if (window._topicPickerState?.topicTestsCache?.has(topicId)) {
        const c = window._topicPickerState.topicTestsCache.get(topicId);
        if (Array.isArray(c) && c.length > 0) return { hasTests: true, tests: c };
    }
    if (window._cachedTopicTests?.has(topicId)) {
        const c = window._cachedTopicTests.get(topicId);
        if (c?.hasTests && Array.isArray(c.tests) && c.tests.length > 0) return c;
    }

    // 2. Thử qua HiDB.getTopicTests
    try {
        if (typeof HiDB !== 'undefined' && typeof HiDB.getTopicTests === 'function') {
            const res = await HiDB.getTopicTests(topicId);
            if (res?.hasTests && Array.isArray(res.tests) && res.tests.length > 0) {
                window._topicPickerState?.topicTestsCache?.set(topicId, res.tests);
                window._cachedTopicTests?.set(topicId, res);
                return res;
            }
        }
    } catch (e) {
        console.warn('[_fetchTopicTestsDirectly:HiDB.getTopicTests]', e);
    }

    // 3. Fallback qua HiDB.getCamHierarchy
    try {
        if (typeof HiDB !== 'undefined' && typeof HiDB.getCamHierarchy === 'function') {
            const hier = await HiDB.getCamHierarchy(topicId);
            if (hier?.tests && Array.isArray(hier.tests) && hier.tests.length > 0) {
                const tests = hier.tests.map(t => ({
                    id: t.id,
                    name: t.name,
                    testOrder: t.testOrder || t.test_order || 1,
                    passages: (t.passages || []).map(p => ({
                        id: p.id,
                        passageNumber: p.passageNumber || p.passage_number || 1,
                        title: p.title || `Passage ${p.passageNumber || p.passage_number || 1}`
                    }))
                }));
                const res = { hasTests: true, tests };
                window._topicPickerState?.topicTestsCache?.set(topicId, tests);
                window._cachedTopicTests?.set(topicId, res);
                return res;
            }
        }
    } catch (e) {
        console.warn('[_fetchTopicTestsDirectly:getCamHierarchy]', e);
    }

    // 4. Fallback trực tiếp qua Supabase REST API (đảm bảo tải được ngay cả khi cache JS bị cũ)
    try {
        const supabaseUrl = 'https://swehdtrqjyklmsefkjdf.supabase.co';
        const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3ZWhkdHJxanlrbG1zZWZramRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTc4MDcsImV4cCI6MjA5Mzk3MzgwN30.dXRhEmvS8J21aJ3dwZ4jHaWuKbhNw2yys90YTIop2EU';
        const headers = { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` };

        let token = null;
        try {
            if (typeof HiDB !== 'undefined' && typeof HiDB.getCurrentUser === 'function') {
                const u = await HiDB.getCurrentUser();
                if (u?.access_token) token = u.access_token;
            }
        } catch (_) {}
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const testsRes = await fetch(`${supabaseUrl}/rest/v1/tests?topic_id=eq.${topicId}&select=id,name,test_order&order=test_order.asc`, { headers });
        if (testsRes.ok) {
            const testsData = await testsRes.json();
            if (Array.isArray(testsData) && testsData.length > 0) {
                const passagesRes = await fetch(`${supabaseUrl}/rest/v1/passages?topic_id=eq.${topicId}&select=id,test_id,passage_number,title&order=passage_number.asc`, { headers });
                const passagesData = passagesRes.ok ? await passagesRes.json() : [];
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
                const res = { hasTests: true, tests };
                window._topicPickerState?.topicTestsCache?.set(topicId, tests);
                window._cachedTopicTests?.set(topicId, res);
                return res;
            }
        }
    } catch (e) {
        console.warn('[_fetchTopicTestsDirectly:REST]', e);
    }

    return { hasTests: false, tests: [] };
};

window.topicPickerSelectTopic = async function(topicId) {
    const topic = (window._topicPickerState.allTopics || []).find(t => t.id === topicId);
    if (!topic) return;
    window._topicPickerState.currentTopic = topic;

    const statusEl = document.getElementById('topic-picker-status');
    if (statusEl) {
        statusEl.innerHTML = `
            <div class="flex items-center justify-center gap-2 text-primary font-medium py-1">
                <span class="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                <span>Đang tải danh sách bài test...</span>
            </div>
        `;
        statusEl.classList.remove('hidden');
    }

    const isExamTopic = (topic.category === 'CAM' || topic.category === 'IELTS Actual Tests' || /CAM|VOL/i.test(topic.name));

    const res = await window._fetchTopicTestsDirectly(topic.id);
    const tests = (res && res.hasTests && Array.isArray(res.tests)) ? res.tests : [];

    if (statusEl) statusEl.classList.add('hidden');

    if (tests && tests.length > 0) {
        window.renderTopicPickerTestStep(topic, tests);
    } else if (isExamTopic) {
        if (statusEl) {
            statusEl.innerHTML = `
                <div class="flex items-center justify-between gap-3 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 p-2.5 rounded-xl">
                    <span>Không thể tải danh sách bài test cho "${_esc(topic.name)}".</span>
                    <button type="button" onclick="window.topicPickerSelectTopic('${topic.id}')" class="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg font-bold transition-colors cursor-pointer shrink-0">
                        Thử lại
                    </button>
                </div>
            `;
            statusEl.classList.remove('hidden');
        }
    } else {
        // Chủ đề thông thường không có đề thi -> hoàn thành chọn ngay
        window.finishTopicPickerSelection({
            topicId: topic.id,
            topicName: topic.name,
            passageId: null,
            passageTitle: null,
            testName: null,
            folderName: window._topicPickerState.currentFolder,
            fullLabel: `${window._topicPickerState.currentFolder} / ${topic.name}`
        });
    }
};

window.renderTopicPickerTestStep = function(topic, tests) {
    window._topicPickerState.step = 'test';
    window._topicPickerState.currentTest = null;

    const backBtn = document.getElementById('topic-picker-back-btn');
    const backLabel = document.getElementById('topic-picker-back-label');
    const titleEl = document.getElementById('topic-picker-title');
    const subtitleEl = document.getElementById('topic-picker-subtitle');
    const statusEl = document.getElementById('topic-picker-status');

    if (backBtn) {
        backBtn.classList.remove('hidden');
        backBtn.classList.add('flex');
    }
    if (backLabel) backLabel.textContent = 'Chủ đề';
    if (titleEl) titleEl.textContent = topic.name;
    if (subtitleEl) subtitleEl.textContent = 'Bước 3/4: Chọn bài Test';
    if (statusEl) statusEl.classList.add('hidden');

    document.getElementById('topic-picker-step-folder')?.classList.add('hidden');
    document.getElementById('topic-picker-step-topic')?.classList.add('hidden');
    document.getElementById('topic-picker-step-test')?.classList.remove('hidden');
    document.getElementById('topic-picker-step-passage')?.classList.add('hidden');

    const testList = document.getElementById('topic-picker-test-list');
    if (!testList) return;

    if (!tests || tests.length === 0) {
        testList.innerHTML = '<p class="text-center text-xs text-outline py-8">Chưa có bài test nào trong chủ đề này</p>';
        return;
    }

    testList.innerHTML = tests.map(t => `
        <button type="button" onclick="window.topicPickerSelectTest('${t.id}')"
                class="w-full p-3.5 rounded-2xl bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/20 hover:border-primary/40 flex items-center justify-between text-left transition-all active:scale-[0.99] cursor-pointer group">
            <div class="flex items-center gap-3 min-w-0">
                <div class="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 text-base font-bold">
                    📝
                </div>
                <div>
                    <span class="text-sm font-bold text-on-surface truncate block">${_esc(t.name)}</span>
                    <span class="text-[11px] text-on-surface-variant">${(t.passages || []).length} bài đọc (passages)</span>
                </div>
            </div>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-container text-outline group-hover:text-primary group-hover:bg-primary/10 transition-colors shrink-0 ml-2">
                Chọn Test ›
            </span>
        </button>
    `).join('');
};

window.topicPickerSelectTest = function(testId) {
    const tests = window._topicPickerState.topicTestsCache.get(window._topicPickerState.currentTopic?.id) || [];
    const test = tests.find(t => t.id === testId);
    if (!test) return;
    window._topicPickerState.currentTest = test;

    window._topicPickerState.step = 'passage';

    const backBtn = document.getElementById('topic-picker-back-btn');
    const backLabel = document.getElementById('topic-picker-back-label');
    const titleEl = document.getElementById('topic-picker-title');
    const subtitleEl = document.getElementById('topic-picker-subtitle');
    const statusEl = document.getElementById('topic-picker-status');

    if (backBtn) {
        backBtn.classList.remove('hidden');
        backBtn.classList.add('flex');
    }
    if (backLabel) backLabel.textContent = 'Bài Test';
    if (titleEl) titleEl.textContent = `${window._topicPickerState.currentTopic.name} · ${test.name}`;
    if (subtitleEl) subtitleEl.textContent = 'Bước 4/4: Chọn đoạn văn (Passage) để lưu từ';
    if (statusEl) statusEl.classList.add('hidden');

    document.getElementById('topic-picker-step-folder')?.classList.add('hidden');
    document.getElementById('topic-picker-step-topic')?.classList.add('hidden');
    document.getElementById('topic-picker-step-test')?.classList.add('hidden');
    document.getElementById('topic-picker-step-passage')?.classList.remove('hidden');

    const passageList = document.getElementById('topic-picker-passage-list');
    if (!passageList) return;

    const passages = test.passages || [];
    if (passages.length === 0) {
        passageList.innerHTML = '<p class="text-center text-xs text-outline py-8">Bài test này chưa có passage nào</p>';
        return;
    }

    passageList.innerHTML = passages.map(p => `
        <button type="button" onclick="window.topicPickerSelectPassage('${p.id}')"
                class="w-full p-3.5 rounded-2xl bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/20 hover:border-primary/40 flex items-center justify-between text-left transition-all active:scale-[0.99] cursor-pointer group">
            <div class="flex items-center gap-3 min-w-0">
                <div class="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 text-base font-bold">
                    📄
                </div>
                <div class="min-w-0">
                    <span class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Passage ${p.passageNumber}</span>
                    <span class="text-sm font-semibold text-on-surface truncate block">${_esc(p.title || ('Passage ' + p.passageNumber))}</span>
                </div>
            </div>
            <span class="text-xs font-bold px-3 py-1.5 rounded-full bg-primary text-on-primary shadow-2xs group-hover:bg-surface-tint transition-colors shrink-0 ml-2">
                ✓ Chọn
            </span>
        </button>
    `).join('');
};

window.topicPickerSelectPassage = function(passageId) {
    const test = window._topicPickerState.currentTest;
    const passage = (test?.passages || []).find(p => p.id === passageId);
    if (!passage) return;

    const topic = window._topicPickerState.currentTopic;
    const passageTitle = passage.title || `Passage ${passage.passageNumber}`;
    window.finishTopicPickerSelection({
        topicId: topic.id,
        topicName: topic.name,
        passageId: passage.id,
        passageTitle: passageTitle,
        testName: test.name,
        folderName: window._topicPickerState.currentFolder,
        fullLabel: `${window._topicPickerState.currentFolder} / ${topic.name} / ${test.name} / ${passageTitle}`
    });
};

window.topicPickerGoBack = function() {
    if (window._topicPickerState.step === 'passage') {
        const tests = window._topicPickerState.topicTestsCache.get(window._topicPickerState.currentTopic?.id) || [];
        window.renderTopicPickerTestStep(window._topicPickerState.currentTopic, tests);
    } else if (window._topicPickerState.step === 'test') {
        window.topicPickerSelectFolder(window._topicPickerState.currentFolder);
    } else if (window._topicPickerState.step === 'topic') {
        window.renderTopicPickerFolderStep();
    }
};

window.finishTopicPickerSelection = function(destination) {
    window.closeTopicPicker();
    if (typeof window._topicPickerState.callback === 'function') {
        window._topicPickerState.callback(destination);
    }
};

// ── QUẢN LÝ CẤU TRÚC TEST & PASSAGE CHO BỘ ĐỀ THI (CAM / VOL) ──────
window._cachedTopicTests = window._cachedTopicTests || new Map();

window._ensureTopicTests = async function(topicId) {
    if (!topicId) return { hasTests: false, tests: [] };
    if (typeof window._fetchTopicTestsDirectly === 'function') {
        return await window._fetchTopicTestsDirectly(topicId);
    }
    if (window._cachedTopicTests.has(topicId)) {
        return window._cachedTopicTests.get(topicId);
    }
    return { hasTests: false, tests: [] };
};

window._populateExamSelects = function(type, topicId, tests, targetPassageId = null) {
    const isSingle = type === 'single';
    const examSection = document.getElementById(isSingle ? 'add-word-exam-section' : 'bulk-add-exam-section');
    const testSelect = document.getElementById(isSingle ? 'add-word-test-select' : 'bulk-add-test-select');
    const passageSelect = document.getElementById(isSingle ? 'add-word-passage-select' : 'bulk-add-passage-select');
    const badgeText = document.getElementById(isSingle ? 'add-word-exam-badge-text' : 'bulk-add-exam-badge-text');
    const passageInput = document.getElementById(isSingle ? 'add-word-passage-id' : 'bulk-add-passage-id');

    if (!tests || tests.length === 0) {
        if (examSection) examSection.classList.add('hidden');
        if (passageInput) passageInput.value = '';
        return;
    }

    if (examSection) examSection.classList.remove('hidden');

    // Xác định test và passage phù hợp nếu có targetPassageId
    let matchedTest = null;
    let selectedPassage = null;
    if (targetPassageId) {
        matchedTest = tests.find(t => (t.passages || []).some(p => p.id === targetPassageId));
        if (matchedTest) {
            selectedPassage = (matchedTest.passages || []).find(p => p.id === targetPassageId);
        }
    }

    // Đổ danh sách Tests:
    // Nếu có targetPassageId -> chọn matchedTest
    // Nếu KHÔNG có targetPassageId (mở từ Topic level) -> hiển thị placeholder, KHÔNG tự chọn ngầm!
    if (testSelect) {
        const placeholder = `<option value="" disabled ${!matchedTest ? 'selected' : ''}>-- Chọn bài Test --</option>`;
        const testOptions = tests.map(t => `
            <option value="${t.id}" ${matchedTest && t.id === matchedTest.id ? 'selected' : ''}>
                ${_esc(t.name)} (${(t.passages || []).length} bài đọc)
            </option>
        `).join('');
        testSelect.innerHTML = placeholder + testOptions;
    }

    // Đổ danh sách Passages:
    if (passageSelect) {
        if (matchedTest) {
            const passages = matchedTest.passages || [];
            if (passages.length === 0) {
                passageSelect.innerHTML = '<option value="" disabled selected>(Chưa có bài đọc)</option>';
            } else {
                const pPlaceholder = `<option value="" disabled ${!selectedPassage ? 'selected' : ''}>-- Chọn Passage --</option>`;
                const pOpts = passages.map(p => `
                    <option value="${p.id}" ${selectedPassage && p.id === selectedPassage.id ? 'selected' : ''}>
                        Passage ${p.passageNumber}: ${_esc(p.title || '')}
                    </option>
                `).join('');
                passageSelect.innerHTML = pPlaceholder + pOpts;
            }
        } else {
            passageSelect.innerHTML = '<option value="" disabled selected>-- Vui lòng chọn bài Test trước --</option>';
        }
    }

    const passageVal = selectedPassage ? selectedPassage.id : '';
    if (passageInput) passageInput.value = passageVal;

    if (isSingle) {
        const badgeNameEl = document.getElementById('add-word-topic-name');
        const topicName = window._currentTopicName || 'Chủ đề';
        if (matchedTest && selectedPassage) {
            const passLabel = `Passage ${selectedPassage.passageNumber}: ${selectedPassage.title || ''}`.trim();
            if (badgeText) badgeText.textContent = `${matchedTest.name} · ${passLabel}`;
            if (badgeNameEl) badgeNameEl.textContent = `${topicName} · ${matchedTest.name} · ${passLabel}`;
        } else {
            if (badgeText) badgeText.textContent = 'Vui lòng chọn bài Test & Passage';
            if (badgeNameEl) badgeNameEl.textContent = topicName;
        }
    } else {
        window._bulkWordsState.passageId = passageVal;
        if (matchedTest && selectedPassage) {
            const passLabel = `Passage ${selectedPassage.passageNumber}: ${selectedPassage.title || ''}`.trim();
            if (badgeText) badgeText.textContent = `${matchedTest.name} · ${passLabel}`;
            const titleEl = document.getElementById('bulk-add-destination-title');
            if (titleEl && window._bulkWordsState.destination) {
                titleEl.textContent = `${window._bulkWordsState.destination.topicName || ''} · ${matchedTest.name} · ${passLabel}`;
            }
        } else {
            if (badgeText) badgeText.textContent = 'Vui lòng chọn bài Test & Passage';
        }
    }
};

window.onAddWordTestChange = function(testId) {
    const topicInput = document.getElementById('add-word-topic-id');
    const topicId = topicInput?.value || window._currentTopicId;
    const testsInfo = window._cachedTopicTests.get(topicId);
    if (!testsInfo || !testsInfo.tests) return;

    const test = testsInfo.tests.find(t => t.id === testId);
    if (!test) return;

    const passageSelect = document.getElementById('add-word-passage-select');
    const badgeText = document.getElementById('add-word-exam-badge-text');
    const passageInput = document.getElementById('add-word-passage-id');

    const passages = test.passages || [];
    if (passageSelect) {
        if (passages.length === 0) {
            passageSelect.innerHTML = '<option value="" disabled selected>(Chưa có bài đọc)</option>';
        } else {
            const placeholder = '<option value="" disabled selected>-- Chọn Passage --</option>';
            const opts = passages.map(p => `
                <option value="${p.id}">
                    Passage ${p.passageNumber}: ${_esc(p.title || '')}
                </option>
            `).join('');
            passageSelect.innerHTML = placeholder + opts;
        }
    }

    if (passageInput) passageInput.value = '';
    if (badgeText) badgeText.textContent = `${test.name} · (Vui lòng chọn passage)`;
};

window.onAddWordPassageChange = function(passageId) {
    const topicInput = document.getElementById('add-word-topic-id');
    const passageInput = document.getElementById('add-word-passage-id');
    const testSelect = document.getElementById('add-word-test-select');
    const badgeText = document.getElementById('add-word-exam-badge-text');
    const badgeNameEl = document.getElementById('add-word-topic-name');

    if (passageInput) passageInput.value = passageId || '';

    const topicId = topicInput?.value || window._currentTopicId;
    const testsInfo = window._cachedTopicTests.get(topicId);
    const test = testsInfo?.tests?.find(t => t.id === testSelect?.value);
    const passage = test?.passages?.find(p => p.id === passageId);

    const topicName = window._currentTopicName || 'Chủ đề';
    if (test && passage) {
        const passLabel = `Passage ${passage.passageNumber}: ${passage.title || ''}`.trim();
        if (badgeText) badgeText.textContent = `${test.name} · ${passLabel}`;
        if (badgeNameEl) badgeNameEl.textContent = `${topicName} · ${test.name} · ${passLabel}`;
    }
};

window.onBulkAddTestChange = function(testId) {
    const topicInput = document.getElementById('bulk-add-topic-id');
    const topicId = window._bulkWordsState.topicId || topicInput?.value;
    const testsInfo = window._cachedTopicTests.get(topicId);
    if (!testsInfo || !testsInfo.tests) return;

    const test = testsInfo.tests.find(t => t.id === testId);
    if (!test) return;

    const passageSelect = document.getElementById('bulk-add-passage-select');
    const badgeText = document.getElementById('bulk-add-exam-badge-text');
    const passageInput = document.getElementById('bulk-add-passage-id');
    const titleEl = document.getElementById('bulk-add-destination-title');

    const passages = test.passages || [];
    if (passageSelect) {
        if (passages.length === 0) {
            passageSelect.innerHTML = '<option value="" disabled selected>(Chưa có bài đọc)</option>';
        } else {
            const placeholder = '<option value="" disabled selected>-- Chọn Passage --</option>';
            const opts = passages.map(p => `
                <option value="${p.id}">
                    Passage ${p.passageNumber}: ${_esc(p.title || '')}
                </option>
            `).join('');
            passageSelect.innerHTML = placeholder + opts;
        }
    }

    window._bulkWordsState.passageId = null;
    if (passageInput) passageInput.value = '';

    const topicName = window._bulkWordsState.destination?.topicName || 'Chủ đề';
    if (badgeText) badgeText.textContent = `${test.name} · (Vui lòng chọn passage)`;
    if (titleEl) titleEl.textContent = `${topicName} · ${test.name}`;
};

window.onBulkAddPassageChange = function(passageId) {
    const topicInput = document.getElementById('bulk-add-topic-id');
    const passageInput = document.getElementById('bulk-add-passage-id');
    const testSelect = document.getElementById('bulk-add-test-select');
    const badgeText = document.getElementById('bulk-add-exam-badge-text');
    const titleEl = document.getElementById('bulk-add-destination-title');

    window._bulkWordsState.passageId = passageId || null;
    if (passageInput) passageInput.value = passageId || '';

    const topicId = window._bulkWordsState.topicId || topicInput?.value;
    const testsInfo = window._cachedTopicTests.get(topicId);
    const test = testsInfo?.tests?.find(t => t.id === testSelect?.value);
    const passage = test?.passages?.find(p => p.id === passageId);

    const topicName = window._bulkWordsState.destination?.topicName || 'Chủ đề';
    if (test && passage) {
        const passLabel = `Passage ${passage.passageNumber}: ${passage.title || ''}`.trim();
        if (badgeText) badgeText.textContent = `${test.name} · ${passLabel}`;
        if (titleEl) titleEl.textContent = `${topicName} · ${test.name} · ${passLabel}`;
    }
};

// ── THÊM TỪ VỰNG TRỰC TIẾP & AI AUTO-FILL ───────────────────────
window._singleAddState = window._singleAddState || {
    selectedDestination: null
};

window.openTopicPickerForSingleAdd = function() {
    window.openTopicPicker(async (destination) => {
        window._singleAddState.selectedDestination = destination;
        const topicInput = document.getElementById('add-word-topic-id');
        const passageInput = document.getElementById('add-word-passage-id');
        const pathEl = document.getElementById('add-word-destination-path');
        const titleEl = document.getElementById('add-word-destination-title');
        const badgeNameEl = document.getElementById('add-word-topic-name');

        if (topicInput) topicInput.value = destination.topicId;
        if (passageInput) passageInput.value = destination.passageId || '';
        if (pathEl) pathEl.textContent = destination.folderName || 'Thư mục';
        if (titleEl) titleEl.textContent = destination.fullLabel || destination.topicName;
        if (badgeNameEl) badgeNameEl.textContent = destination.fullLabel || destination.topicName;

        // Cập nhật bộ chọn đề thi nếu topic có tests
        const testsInfo = await window._ensureTopicTests(destination.topicId);
        if (testsInfo.hasTests && testsInfo.tests && testsInfo.tests.length > 0) {
            window._populateExamSelects('single', destination.topicId, testsInfo.tests, destination.passageId);
        } else {
            document.getElementById('add-word-exam-section')?.classList.add('hidden');
        }
    }, {
        title: 'Chọn nơi lưu từ vựng',
        subtitle: 'Thư mục → Chủ đề → Test → Passage'
    });
};

window.openAddWordModal = function(topicId = null, passageId = null) {
    // 1. MỞ MODAL NGAY LẬP TỨC (0ms) để phản hồi tức thì
    const modal = document.getElementById('modal-add-word');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        window.lockBodyScroll && window.lockBodyScroll(true);
        window._modalAddWordOpenedAt = Date.now();
    }

    // Reset Form nhanh
    const engInput = document.getElementById('add-word-english');
    const phoInput = document.getElementById('add-word-phonetic');
    const meaInput = document.getElementById('add-word-meaning');
    const exaInput = document.getElementById('add-word-example');
    const errEl    = document.getElementById('add-word-error');
    if (engInput) engInput.value = '';
    if (phoInput) phoInput.value = '';
    if (meaInput) meaInput.value = '';
    if (exaInput) exaInput.value = '';
    if (errEl) errEl.classList.add('hidden');

    // Reset AI Button state
    const aiBtn  = document.getElementById('btn-ai-autofill');
    const aiIcon = document.getElementById('ai-fill-icon');
    const aiText = document.getElementById('ai-fill-text');
    if (aiBtn) {
        aiBtn.disabled = false;
        aiBtn.classList.remove('is-generating');
    }
    if (aiIcon) {
        aiIcon.textContent = 'auto_awesome';
        aiIcon.classList.remove('animate-spin');
    }
    if (aiText) aiText.textContent = '✨ AI Điền tự động';

    setTimeout(() => {
        if (engInput) engInput.focus();
    }, 50);

    // 2. Xử lý đồng bộ dữ liệu thư mục & đề thi ở chế độ nền (background async)
    (async () => {
        try {
            const isVocabContext = !topicId && !window._currentTopicId;
            let targetTopicId = topicId || (!isVocabContext ? window._currentTopicId : null);
            let targetPassageId = (passageId !== null && passageId !== undefined)
                ? passageId
                : (window._currentPassageId && window._currentPassageId !== '__unlinked__' ? window._currentPassageId : null);

            const topicInput = document.getElementById('add-word-topic-id');
            const passageInput = document.getElementById('add-word-passage-id');
            const badgeContainer = document.getElementById('add-word-topic-badge');
            const destSection = document.getElementById('add-word-destination-section');
            const examSection = document.getElementById('add-word-exam-section');

            if (topicInput) topicInput.value = targetTopicId || '';
            if (passageInput) passageInput.value = targetPassageId || '';

            if (isVocabContext || !targetTopicId) {
                if (badgeContainer) badgeContainer.classList.add('hidden');
                if (destSection) destSection.classList.remove('hidden');

                const pathEl = document.getElementById('add-word-destination-path');
                const titleEl = document.getElementById('add-word-destination-title');

                if (window._singleAddState && window._singleAddState.selectedDestination) {
                    const dest = window._singleAddState.selectedDestination;
                    targetTopicId = dest.topicId;
                    targetPassageId = dest.passageId || null;
                    if (topicInput) topicInput.value = dest.topicId;
                    if (passageInput) passageInput.value = dest.passageId || '';
                    if (pathEl) pathEl.textContent = dest.folderName || 'Thư mục';
                    if (titleEl) titleEl.textContent = dest.fullLabel || dest.topicName;
                } else {
                    let personalTopic = null;
                    if (typeof HiDB !== 'undefined' && typeof HiDB.ensureUserPersonalTopic === 'function') {
                        personalTopic = await HiDB.ensureUserPersonalTopic().catch(() => null);
                    }
                    if (personalTopic) {
                        if (window._singleAddState) {
                            window._singleAddState.selectedDestination = {
                                topicId: personalTopic.id,
                                topicName: personalTopic.name,
                                passageId: null,
                                folderName: 'General English',
                                fullLabel: personalTopic.name
                            };
                        }
                        targetTopicId = personalTopic.id;
                        if (topicInput) topicInput.value = personalTopic.id;
                        if (pathEl) pathEl.textContent = 'General English';
                        if (titleEl) titleEl.textContent = personalTopic.name;
                    } else {
                        if (pathEl) pathEl.textContent = 'Thư mục / Chủ đề';
                        if (titleEl) titleEl.textContent = 'Bấm để chọn nơi lưu từ...';
                    }
                }
            } else {
                if (destSection) destSection.classList.add('hidden');
                if (badgeContainer) badgeContainer.classList.remove('hidden');
                const badgeNameEl = document.getElementById('add-word-topic-name');
                if (badgeNameEl) {
                    let label = window._currentTopicName || 'Chủ đề hiện tại';
                    if (targetPassageId && window._currentPassageTitle) {
                        label += ` · Passage ${window._currentPassageNumber || ''}: ${window._currentPassageTitle}`.trim();
                    } else if (window._currentLessonName) {
                        label += ` · ${window._currentLessonName}`;
                    }
                    badgeNameEl.textContent = label;
                    badgeNameEl.title = label;
                }
            }

            if (targetTopicId && typeof window._ensureTopicTests === 'function') {
                const testsInfo = await window._ensureTopicTests(targetTopicId).catch(() => ({ hasTests: false, tests: [] }));
                if (testsInfo.hasTests && testsInfo.tests && testsInfo.tests.length > 0) {
                    window._populateExamSelects && window._populateExamSelects('single', targetTopicId, testsInfo.tests, targetPassageId);
                } else {
                    if (examSection) examSection.classList.add('hidden');
                    if (passageInput) passageInput.value = '';
                }
            } else {
                if (examSection) examSection.classList.add('hidden');
                if (passageInput) passageInput.value = '';
            }
        } catch(err) {
            console.warn('[openAddWordModal:asyncInit]', err);
        }
    })();
};

window.openVocabAddModal = function() {
    window.openAddWordModal(null, null);
};

window.closeAddWordModal = function() {
    const modal = document.getElementById('modal-add-word');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    window.lockBodyScroll && window.lockBodyScroll(false);
};

window.previewAddWordAudio = function() {
    const word = (document.getElementById('add-word-english')?.value || '').trim();
    if (!word) return;
    if (typeof HiDict !== 'undefined' && typeof HiDict.playWordAudio === 'function') {
        HiDict.playWordAudio(word);
    } else if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(word);
        u.lang = 'en-US';
        window.speechSynthesis.speak(u);
    }
};

window.triggerAiLookup = async function() {
    const engInput = document.getElementById('add-word-english');
    const phoInput = document.getElementById('add-word-phonetic');
    const meaInput = document.getElementById('add-word-meaning');
    const exaInput = document.getElementById('add-word-example');
    const errEl    = document.getElementById('add-word-error');
    const errText  = document.getElementById('add-word-error-text');

    const word = (engInput?.value || '').trim();
    if (!word) {
        if (errEl && errText) {
            errText.textContent = 'Vui lòng gõ từ tiếng Anh trước khi bấm AI Điền tự động.';
            errEl.classList.remove('hidden');
        }
        if (engInput) engInput.focus();
        return;
    }

    if (errEl) errEl.classList.add('hidden');

    const aiBtn  = document.getElementById('btn-ai-autofill');
    const aiIcon = document.getElementById('ai-fill-icon');
    const aiText = document.getElementById('ai-fill-text');

    if (aiBtn) {
        aiBtn.disabled = true;
        aiBtn.classList.add('is-generating');
    }
    if (aiIcon) {
        aiIcon.textContent = 'sync';
        aiIcon.classList.add('animate-spin');
    }
    if (aiText) aiText.textContent = 'AI đang tra cứu...';

    try {
        const res = await fetch('/api/ai-lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ word })
        });

        const data = await res.json();
        if (!res.ok || !data.ok) {
            throw new Error(data.error || 'Không thể tra cứu thông tin từ AI.');
        }

        const phonetic = data.phonetic || data.data?.phonetic || '';
        const meaning  = data.meaning  || data.data?.meaning  || '';
        const example  = data.example  || data.data?.example  || '';

        if (phoInput && phonetic) phoInput.value = phonetic;
        if (meaInput && meaning) meaInput.value = meaning;
        if (exaInput && example) exaInput.value = example;

        if (aiIcon) {
            aiIcon.textContent = 'check';
            aiIcon.classList.remove('animate-spin');
        }
        if (aiText) aiText.textContent = 'Đã điền xong!';

        setTimeout(() => {
            if (aiIcon) aiIcon.textContent = 'auto_awesome';
            if (aiText) aiText.textContent = '✨ AI Điền tự động';
            if (aiBtn) {
                aiBtn.disabled = false;
                aiBtn.classList.remove('is-generating');
            }
        }, 1200);

    } catch (err) {
        console.error('[triggerAiLookup] Error:', err);
        if (errEl && errText) {
            errText.textContent = 'Lỗi tra cứu AI: ' + (err.message || 'Thất bại.');
            errEl.classList.remove('hidden');
        }
        if (aiIcon) {
            aiIcon.textContent = 'auto_awesome';
            aiIcon.classList.remove('animate-spin');
        }
        if (aiText) aiText.textContent = '✨ AI Điền tự động';
        if (aiBtn) {
            aiBtn.disabled = false;
            aiBtn.classList.remove('is-generating');
        }
    }
};

window.submitAddWord = async function(e) {
    if (e) e.preventDefault();

    const engInput = document.getElementById('add-word-english');
    const phoInput = document.getElementById('add-word-phonetic');
    const meaInput = document.getElementById('add-word-meaning');
    const exaInput = document.getElementById('add-word-example');
    const topicInput = document.getElementById('add-word-topic-id');
    const passageInput = document.getElementById('add-word-passage-id');
    const errEl    = document.getElementById('add-word-error');
    const errText  = document.getElementById('add-word-error-text');
    const submitBtn = document.getElementById('btn-submit-add-word');

    const word = (engInput?.value || '').trim();
    const phonetic = (phoInput?.value || '').trim();
    const meaning = (meaInput?.value || '').trim();
    const exampleSentence = (exaInput?.value || '').trim();
    const topicId = topicInput?.value || window._currentTopicId;
    const passageId = passageInput?.value || (window._currentPassageId && window._currentPassageId !== '__unlinked__' ? window._currentPassageId : null);

    if (!topicId) {
        if (errEl && errText) {
            errText.textContent = 'Vui lòng chọn nơi lưu từ (bấm vào thẻ chọn nơi lưu phía trên).';
            errEl.classList.remove('hidden');
        }
        return;
    }

    // Kiểm tra nếu là đề thi có tests mà chưa chọn passage
    const topicTests = window._cachedTopicTests.get(topicId);
    if (topicTests && topicTests.hasTests && topicTests.tests && topicTests.tests.length > 0 && !passageId) {
        if (errEl && errText) {
            errText.textContent = 'Vui lòng chọn bài Test và Passage để lưu từ vựng vào đúng đề thi.';
            errEl.classList.remove('hidden');
        }
        return;
    }

    if (!word) {
        if (errEl && errText) {
            errText.textContent = 'Vui lòng nhập từ tiếng Anh.';
            errEl.classList.remove('hidden');
        }
        if (engInput) engInput.focus();
        return;
    }

    if (!meaning) {
        if (errEl && errText) {
            errText.textContent = 'Vui lòng nhập nghĩa tiếng Việt.';
            errEl.classList.remove('hidden');
        }
        if (meaInput) meaInput.focus();
        return;
    }

    if (errEl) errEl.classList.add('hidden');

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">refresh</span><span>Đang lưu...</span>';
    }

    try {
        if (typeof HiDB === 'undefined' || typeof HiDB.addWord !== 'function') {
            throw new Error('Hệ thống dữ liệu HiDB chưa sẵn sàng.');
        }

        await HiDB.addWord(topicId, {
            word,
            phonetic,
            meaning,
            exampleSentence,
            passageId: passageId || null,
            autoProgress: true
        });

        // Xóa cache lesson để lấy số lượng từ mới nhất
        if (window._lessonsCache && window._lessonsCache[topicId]) {
            delete window._lessonsCache[topicId];
        }
        window._camHierarchy = null;

        // Đóng modal
        window.closeAddWordModal();

        // Toast thông báo
        if (typeof _dictToast === 'function') {
            _dictToast(`✓ Đã thêm từ "${word}" thành công!`);
        } else if (typeof showToast === 'function') {
            showToast(`Đã thêm từ "${word}" thành công!`, 'success');
        }

        // Cập nhật giao diện tức thì
        const isVocabActive = document.getElementById('page-vocabulary')?.classList.contains('active');
        if (isVocabActive && typeof window._loadVocabularyPage === 'function') {
            await window._loadVocabularyPage(1);
        } else {
            const activePage = window._currentPage || (document.getElementById('page-lesson-detail')?.classList.contains('active') ? 'lesson-detail' : (document.getElementById('page-topic-detail')?.classList.contains('active') ? 'topic-detail' : ''));
            if (activePage === 'lesson-detail' && typeof window._loadLessonWords === 'function') {
                await window._loadLessonWords();
            } else if (typeof window._loadLessons === 'function') {
                await window._loadLessons();
            }
        }

    } catch (err) {
        console.error('[submitAddWord] Error:', err);
        if (errEl && errText) {
            errText.textContent = 'Lỗi lưu từ vựng: ' + (err.message || 'Thất bại.');
            errEl.classList.remove('hidden');
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">check</span><span>Lưu từ vựng</span>';
        }
    }
};

// Đóng modal add-word khi click ra ngoài nền tối (kèm guard chống synthetic touch bleed-through)
document.getElementById('modal-add-word')?.addEventListener('click', function(e) {
    if (Date.now() - (window._modalAddWordOpenedAt || 0) < 350) return;
    if (e.target === this) window.closeAddWordModal();
});

// ── MODAL: THÊM TỪ HÀNG LOẠT (BULK ADD) ─────────────────────────
window._bulkWordsState = {
    words: [],
    isGenerating: false,
    isSubmitting: false,
    topicId: null,
    passageId: null,
    destination: null
};

window.openTopicPickerForBulkAdd = function() {
    window.openTopicPicker(async (destination) => {
        window._bulkWordsState.topicId = destination.topicId;
        window._bulkWordsState.passageId = destination.passageId || null;
        window._bulkWordsState.destination = destination;

        const pathEl = document.getElementById('bulk-add-destination-path');
        const titleEl = document.getElementById('bulk-add-destination-title');
        const topicInput = document.getElementById('bulk-add-topic-id');
        const passageInput = document.getElementById('bulk-add-passage-id');

        if (topicInput) topicInput.value = destination.topicId;
        if (passageInput) passageInput.value = destination.passageId || '';
        if (pathEl) pathEl.textContent = destination.folderName || 'Thư mục';
        if (titleEl) titleEl.textContent = destination.fullLabel || destination.topicName;

        const testsInfo = await window._ensureTopicTests(destination.topicId);
        if (testsInfo.hasTests && testsInfo.tests && testsInfo.tests.length > 0) {
            window._populateExamSelects('bulk', destination.topicId, testsInfo.tests, destination.passageId);
        } else {
            document.getElementById('bulk-add-exam-section')?.classList.add('hidden');
        }
    }, {
        title: 'Chọn nơi lưu từ hàng loạt',
        subtitle: 'Thư mục → Chủ đề → Test → Passage'
    });
};

window.openVocabBulkAddModal = async function(topicId = null, passageId = null) {
    const modal = document.getElementById('modal-bulk-add-word');
    if (!modal) return;

    window._bulkWordsState.words = [];
    window._bulkWordsState.isGenerating = false;
    window._bulkWordsState.isSubmitting = false;

    const textarea = document.getElementById('bulk-add-textarea');
    if (textarea) textarea.value = '';
    window.updateBulkWordCount();

    const errEl = document.getElementById('bulk-add-error');
    if (errEl) errEl.classList.add('hidden');

    const previewSection = document.getElementById('bulk-preview-section');
    if (previewSection) previewSection.classList.add('hidden');

    const submitBtn = document.getElementById('btn-submit-bulk-add');
    if (submitBtn) submitBtn.disabled = true;

    // Cập nhật destination card
    const pathEl = document.getElementById('bulk-add-destination-path');
    const titleEl = document.getElementById('bulk-add-destination-title');
    const topicInput = document.getElementById('bulk-add-topic-id');
    const passageInput = document.getElementById('bulk-add-passage-id');
    const examSection = document.getElementById('bulk-add-exam-section');

    let targetTopicId = topicId || (window._currentTopicId || null);
    let targetPassageId = (passageId !== null && passageId !== undefined) ? passageId : (window._currentPassageId && window._currentPassageId !== '__unlinked__' ? window._currentPassageId : null);

    if (targetTopicId) {
        window._bulkWordsState.topicId = targetTopicId;
        window._bulkWordsState.passageId = targetPassageId;
        if (topicInput) topicInput.value = targetTopicId;
        if (passageInput) passageInput.value = targetPassageId || '';

        const topicName = window._currentTopicName || 'Chủ đề hiện tại';
        const folderName = window._currentCategory || 'Thư mục';
        window._bulkWordsState.destination = {
            topicId: targetTopicId,
            topicName: topicName,
            passageId: targetPassageId,
            folderName: folderName,
            fullLabel: targetPassageId ? `${topicName} · Passage` : topicName
        };

        if (pathEl) pathEl.textContent = folderName;
        if (titleEl) titleEl.textContent = topicName;

        const testsInfo = await window._ensureTopicTests(targetTopicId);
        if (testsInfo.hasTests && testsInfo.tests && testsInfo.tests.length > 0) {
            window._populateExamSelects('bulk', targetTopicId, testsInfo.tests, targetPassageId);
        } else {
            if (examSection) examSection.classList.add('hidden');
        }
    } else if (window._bulkWordsState.destination) {
        const dest = window._bulkWordsState.destination;
        if (topicInput) topicInput.value = dest.topicId;
        if (passageInput) passageInput.value = dest.passageId || '';
        if (pathEl) pathEl.textContent = dest.folderName || 'Thư mục';
        if (titleEl) titleEl.textContent = dest.fullLabel || dest.topicName;

        const testsInfo = await window._ensureTopicTests(dest.topicId);
        if (testsInfo.hasTests && testsInfo.tests && testsInfo.tests.length > 0) {
            window._populateExamSelects('bulk', dest.topicId, testsInfo.tests, dest.passageId);
        } else {
            if (examSection) examSection.classList.add('hidden');
        }
    } else {
        try {
            let personalTopic = null;
            if (typeof HiDB !== 'undefined' && typeof HiDB.ensureUserPersonalTopic === 'function') {
                personalTopic = await HiDB.ensureUserPersonalTopic().catch(() => null);
            }
            if (personalTopic) {
                window._bulkWordsState.topicId = personalTopic.id;
                window._bulkWordsState.passageId = null;
                window._bulkWordsState.destination = {
                    topicId: personalTopic.id,
                    topicName: personalTopic.name,
                    passageId: null,
                    folderName: 'General English',
                    fullLabel: personalTopic.name
                };
                if (topicInput) topicInput.value = personalTopic.id;
                if (passageInput) passageInput.value = '';
                if (pathEl) pathEl.textContent = 'General English';
                if (titleEl) titleEl.textContent = personalTopic.name;
                if (examSection) examSection.classList.add('hidden');
            } else {
                if (pathEl) pathEl.textContent = 'Thư mục / Chủ đề';
                if (titleEl) titleEl.textContent = 'Bấm để chọn nơi lưu từ...';
                if (examSection) examSection.classList.add('hidden');
            }
        } catch (e) {
            if (pathEl) pathEl.textContent = 'Thư mục / Chủ đề';
            if (titleEl) titleEl.textContent = 'Bấm để chọn nơi lưu từ...';
            if (examSection) examSection.classList.add('hidden');
        }
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    window._modalBulkAddWordOpenedAt = Date.now();
    setTimeout(() => { if (textarea) textarea.focus(); }, 120);
};

window.closeBulkAddModal = function() {
    const modal = document.getElementById('modal-bulk-add-word');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};

document.getElementById('modal-bulk-add-word')?.addEventListener('click', function(e) {
    if (Date.now() - (window._modalBulkAddWordOpenedAt || 0) < 350) return;
    if (e.target === this) window.closeBulkAddModal();
});

window.updateBulkWordCount = function() {
    const text = (document.getElementById('bulk-add-textarea')?.value || '').trim();
    const lines = text ? text.split(/\r?\n/).map(l => l.trim()).filter(Boolean) : [];
    const badge = document.getElementById('bulk-word-count-badge');
    if (badge) {
        badge.textContent = `${lines.length} từ`;
        if (lines.length > 20) {
            badge.className = 'text-[11px] font-bold text-rose-500';
            badge.textContent = `${lines.length}/20 từ (vượt mức cho phép)`;
        } else {
            badge.className = 'text-[11px] font-semibold text-outline';
        }
    }
};

window.clearBulkWords = function() {
    const textarea = document.getElementById('bulk-add-textarea');
    if (textarea) textarea.value = '';
    window._bulkWordsState.words = [];
    window.renderBulkPreview();
    window.updateBulkWordCount();
};

window.parseBulkWordsRaw = function() {
    const text = (document.getElementById('bulk-add-textarea')?.value || '').trim();
    const errEl = document.getElementById('bulk-add-error');
    const errText = document.getElementById('bulk-add-error-text');
    if (errEl) errEl.classList.add('hidden');

    if (!text) {
        if (errEl && errText) {
            errText.textContent = 'Vui lòng dán danh sách từ vựng vào ô nhập trước.';
            errEl.classList.remove('hidden');
        }
        return;
    }

    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean).slice(0, 20);
    const parsed = [];

    lines.forEach(line => {
        let word = '', meaning = '';
        if (line.includes(' - ')) {
            const parts = line.split(' - ');
            word = parts[0].trim();
            meaning = parts.slice(1).join(' - ').trim();
        } else if (line.includes(' : ')) {
            const parts = line.split(' : ');
            word = parts[0].trim();
            meaning = parts.slice(1).join(' : ').trim();
        } else if (line.includes('\t')) {
            const parts = line.split('\t');
            word = parts[0].trim();
            meaning = parts.slice(1).join(' ').trim();
        } else {
            word = line;
            meaning = '';
        }

        if (word) {
            parsed.push({
                word,
                phonetic: '',
                meaning,
                example: ''
            });
        }
    });

    window._bulkWordsState.words = parsed;
    window.renderBulkPreview();
};

window.generateBulkWordsAi = async function() {
    const text = (document.getElementById('bulk-add-textarea')?.value || '').trim();
    const errEl = document.getElementById('bulk-add-error');
    const errText = document.getElementById('bulk-add-error-text');
    const aiBtn = document.getElementById('btn-bulk-ai-generate');
    const aiIcon = document.getElementById('bulk-ai-icon');
    const aiText = document.getElementById('bulk-ai-text');

    if (errEl) errEl.classList.add('hidden');

    if (!text) {
        if (errEl && errText) {
            errText.textContent = 'Vui lòng nhập hoặc dán ít nhất 1 từ tiếng Anh trước khi bấm AI Điền tự động.';
            errEl.classList.remove('hidden');
        }
        return;
    }

    const rawLines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const wordList = rawLines.map(l => {
        if (l.includes(' - ')) return l.split(' - ')[0].trim();
        if (l.includes(' : ')) return l.split(' : ')[0].trim();
        if (l.includes('\t')) return l.split('\t')[0].trim();
        return l;
    }).filter(Boolean).slice(0, 20);

    if (wordList.length === 0) return;

    if (aiBtn) {
        aiBtn.disabled = true;
        aiBtn.classList.add('is-generating');
    }
    if (aiIcon) {
        aiIcon.textContent = 'sync';
        aiIcon.classList.add('animate-spin');
    }
    if (aiText) aiText.textContent = `AI đang phân tích ${wordList.length} từ...`;

    try {
        const res = await fetch('/api/ai-lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ words: wordList })
        });

        const data = await res.json();
        if (!res.ok || !data.ok) {
            throw new Error(data.error || 'Lỗi tra cứu hàng loạt từ AI.');
        }

        const results = data.results || [];
        window._bulkWordsState.words = wordList.map(w => {
            const match = results.find(r => r.word.toLowerCase() === w.toLowerCase()) || results.find(r => r.word.toLowerCase().includes(w.toLowerCase()));
            return {
                word: w,
                phonetic: match?.phonetic || '',
                meaning: match?.meaning || '',
                example: match?.example || ''
            };
        });

        window.renderBulkPreview();

    } catch (err) {
        console.error('[generateBulkWordsAi]', err);
        if (errEl && errText) {
            errText.textContent = 'Lỗi AI: ' + (err.message || 'Không thể tạo từ.');
            errEl.classList.remove('hidden');
        }
    } finally {
        if (aiBtn) {
            aiBtn.disabled = false;
            aiBtn.classList.remove('is-generating');
        }
        if (aiIcon) {
            aiIcon.textContent = 'auto_awesome';
            aiIcon.classList.remove('animate-spin');
        }
        if (aiText) aiText.textContent = '✨ AI Điền tự động hàng loạt';
    }
};

window.renderBulkPreview = function() {
    const previewSection = document.getElementById('bulk-preview-section');
    const tbody = document.getElementById('bulk-preview-tbody');
    const countEl = document.getElementById('bulk-preview-count');
    const summaryEl = document.getElementById('bulk-footer-summary');
    const submitBtn = document.getElementById('btn-submit-bulk-add');
    const words = window._bulkWordsState.words || [];

    if (words.length === 0) {
        if (previewSection) previewSection.classList.add('hidden');
        if (submitBtn) submitBtn.disabled = true;
        if (summaryEl) summaryEl.textContent = 'Chưa có từ nào sẵn sàng lưu';
        return;
    }

    if (previewSection) previewSection.classList.remove('hidden');
    if (countEl) countEl.textContent = words.length;

    const validCount = words.filter(w => w.word && w.meaning).length;
    if (summaryEl) {
        summaryEl.textContent = `${validCount}/${words.length} từ đã có đầy đủ nghĩa và sẵn sàng lưu`;
    }
    if (submitBtn) {
        submitBtn.disabled = validCount === 0;
    }

    if (!tbody) return;
    tbody.innerHTML = words.map((item, idx) => `
        <tr class="hover:bg-primary/5 transition-colors">
            <td class="p-2.5 text-center text-outline font-semibold">${idx + 1}</td>
            <td class="p-2.5">
                <input type="text" value="${_esc(item.word)}" oninput="window.updateBulkItem(${idx}, 'word', this.value)"
                       class="w-full bg-transparent font-bold text-on-surface border-b border-transparent focus:border-primary outline-none text-xs"/>
            </td>
            <td class="p-2.5">
                <input type="text" value="${_esc(item.phonetic || '')}" placeholder="/.../" oninput="window.updateBulkItem(${idx}, 'phonetic', this.value)"
                       class="w-full bg-transparent font-mono text-outline border-b border-transparent focus:border-primary outline-none text-[11px]"/>
            </td>
            <td class="p-2.5">
                <input type="text" value="${_esc(item.meaning || '')}" placeholder="Nhập nghĩa tiếng Việt" oninput="window.updateBulkItem(${idx}, 'meaning', this.value)"
                       class="w-full bg-transparent font-medium text-on-surface border-b ${!item.meaning ? 'border-amber-400' : 'border-transparent'} focus:border-primary outline-none text-xs"/>
            </td>
            <td class="p-2.5">
                <input type="text" value="${_esc(item.example || '')}" placeholder="Ví dụ tiếng Anh" oninput="window.updateBulkItem(${idx}, 'example', this.value)"
                       class="w-full bg-transparent italic text-outline border-b border-transparent focus:border-primary outline-none text-[11px]"/>
            </td>
            <td class="p-2.5 text-center">
                <button type="button" onclick="window.removeBulkItem(${idx})" class="p-1 text-outline hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors" title="Xóa từ này">
                    <span class="material-symbols-outlined text-[16px]">delete</span>
                </button>
            </td>
        </tr>
    `).join('');
};

window.updateBulkItem = function(idx, key, value) {
    if (window._bulkWordsState.words[idx]) {
        window._bulkWordsState.words[idx][key] = value;
        const validCount = window._bulkWordsState.words.filter(w => w.word && w.meaning).length;
        const summaryEl = document.getElementById('bulk-footer-summary');
        const submitBtn = document.getElementById('btn-submit-bulk-add');
        if (summaryEl) summaryEl.textContent = `${validCount}/${window._bulkWordsState.words.length} từ đã có đầy đủ nghĩa và sẵn sàng lưu`;
        if (submitBtn) submitBtn.disabled = validCount === 0;
    }
};

window.removeBulkItem = function(idx) {
    window._bulkWordsState.words.splice(idx, 1);
    window.renderBulkPreview();
};

window.submitBulkAddWords = async function() {
    const topicInput = document.getElementById('bulk-add-topic-id');
    const passageInput = document.getElementById('bulk-add-passage-id');
    const topicId = window._bulkWordsState.topicId || topicInput?.value;
    const passageId = window._bulkWordsState.passageId || passageInput?.value || null;
    const submitBtn = document.getElementById('btn-submit-bulk-add');
    const submitText = document.getElementById('bulk-submit-text');
    const errEl = document.getElementById('bulk-add-error');
    const errText = document.getElementById('bulk-add-error-text');

    if (errEl) errEl.classList.add('hidden');

    if (!topicId) {
        if (errEl && errText) {
            errText.textContent = 'Vui lòng chọn nơi lưu từ (bấm vào thẻ chọn nơi lưu phía trên).';
            errEl.classList.remove('hidden');
        }
        return;
    }

    // Kiểm tra nếu là đề thi có tests mà chưa chọn passage
    const topicTests = window._cachedTopicTests.get(topicId);
    if (topicTests && topicTests.hasTests && topicTests.tests && topicTests.tests.length > 0 && !passageId) {
        if (errEl && errText) {
            errText.textContent = 'Vui lòng chọn bài Test và Passage để lưu danh sách từ vào đúng đề thi.';
            errEl.classList.remove('hidden');
        }
        return;
    }

    const wordsToSave = (window._bulkWordsState.words || []).filter(w => w.word && w.meaning);
    if (wordsToSave.length === 0) {
        if (errEl && errText) {
            errText.textContent = 'Không có từ nào hợp lệ (cần có cả từ tiếng Anh và nghĩa tiếng Việt).';
            errEl.classList.remove('hidden');
        }
        return;
    }

    if (submitBtn) submitBtn.disabled = true;
    if (submitText) submitText.textContent = `Đang lưu ${wordsToSave.length} từ...`;

    try {
        if (typeof HiDB === 'undefined' || typeof HiDB.addWordsBatch !== 'function') {
            throw new Error('Hệ thống HiDB chưa hỗ trợ thêm hàng loạt.');
        }

        const saved = await HiDB.addWordsBatch(topicId, wordsToSave, passageId);

        window.closeBulkAddModal();
        if (typeof showToast === 'function') {
            showToast(`✓ Đã thêm thành công ${saved.length || wordsToSave.length} từ vào Sổ từ!`, 'success');
        }

        if (typeof window._loadVocabularyPage === 'function') {
            await window._loadVocabularyPage(1);
        }

    } catch (err) {
        console.error('[submitBulkAddWords]', err);
        if (errEl && errText) {
            errText.textContent = 'Lỗi lưu từ hàng loạt: ' + (err.message || 'Thất bại.');
            errEl.classList.remove('hidden');
        }
    } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (submitText) submitText.textContent = 'Lưu vào Sổ từ';
    }
};

// ── SỔ TỪ VỰNG CÁ NHÂN (PERSONAL VOCABULARY NOTEBOOK) ───────────
window._vocabPageState = {
    page: 1,
    pageSize: 25,
    search: '',
    levelFilter: null,
    topicId: null,
    debounceTimer: null,
    total: 0,
    totalPages: 1,
    isLoading: false,
    topicsLoaded: false
};

window.openSRSExplainerModal = function() {
    const m = document.getElementById('modal-srs-explainer');
    if (m) {
        m.classList.remove('hidden');
        m.classList.add('flex');
    }
};

window.closeSRSExplainerModal = function() {
    const m = document.getElementById('modal-srs-explainer');
    if (m) {
        m.classList.add('hidden');
        m.classList.remove('flex');
    }
};

window.filterVocabLevel = function(level) {
    // Nếu ấn lại chính level đang chọn thì quay về Tất cả (toggle)
    if (window._vocabPageState.levelFilter === level && level !== null) {
        level = null;
    }
    window._vocabPageState.levelFilter = level;

    // Cập nhật trạng thái pills
    document.querySelectorAll('#vocab-level-pills .vocab-pill').forEach(btn => {
        const pillLevel = btn.dataset.level;
        const isMatch = (level === null && pillLevel === 'all') || (String(level) === String(pillLevel));
        if (isMatch) {
            btn.className = 'vocab-pill px-3 py-1.5 rounded-full bg-primary text-on-primary shadow-xs shrink-0 cursor-pointer transition-all';
        } else {
            btn.className = 'vocab-pill px-3 py-1.5 rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-high shrink-0 cursor-pointer transition-all';
        }
    });

    // Cập nhật viền active sáng cho các cột trong biểu đồ Sổ từ
    for (let i = 0; i <= 5; i++) {
        const col = document.getElementById(`vocab-col-lv${i}`);
        if (col) {
            if (level === i) {
                col.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-surface', 'bg-primary/10', 'scale-105', 'shadow-xs');
            } else {
                col.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-surface', 'bg-primary/10', 'scale-105', 'shadow-xs');
            }
        }
    }

    window._loadVocabularyPage(1);
};

window.onVocabTopicFilterChange = function(val) {
    window._vocabPageState.topicId = val || null;
    window._loadVocabularyPage(1);
};

window.clearVocabSearch = function() {
    const input = document.getElementById('vocab-search');
    if (input) input.value = '';
    const clearBtn = document.getElementById('vocab-search-clear');
    if (clearBtn) clearBtn.classList.add('hidden');
    window._loadVocabularyPage(1, '');
};

window.startVocabQuickReview = function() {
    if (typeof window.navigateTo === 'function') {
        window.navigateTo('dashboard');
    }
};

window.deleteVocabWord = async function(wordId, wordText) {
    if (!confirm(`Bạn có chắc chắn muốn xóa từ "${wordText}" khỏi Sổ từ cá nhân không?`)) return;
    try {
        if (typeof HiDB !== 'undefined' && typeof HiDB.deleteWord === 'function') {
            await HiDB.deleteWord(wordId);
            if (typeof showToast === 'function') {
                showToast(`Đã xóa từ "${wordText}"`, 'info');
            }
            window._loadVocabularyPage(window._vocabPageState.page);
        }
    } catch (e) {
        alert('Không thể xóa từ: ' + e.message);
    }
};

window._loadVocabularyPage = async function(page = 1, search = null) {
    const listEl = document.getElementById('vocab-list');
    const pagEl = document.getElementById('vocab-pagination');
    const subtitleEl = document.getElementById('vocab-subtitle');
    const clearSearchBtn = document.getElementById('vocab-search-clear');
    if (!listEl) return;

    if (search !== null) {
        window._vocabPageState.search = (search || '').trim();
    }
    const currentSearch = window._vocabPageState.search;
    if (clearSearchBtn) {
        clearSearchBtn.classList.toggle('hidden', !currentSearch);
    }

    window._vocabPageState.page = page;
    window._vocabPageState.isLoading = true;

    // Tải danh sách topic cho filter dropdown nếu chưa có (gom nhóm theo thư mục)
    if (!window._vocabPageState.topicsLoaded && typeof HiDB !== 'undefined' && typeof HiDB.getTopics === 'function') {
        HiDB.getTopics().then(topics => {
            const filterSel = document.getElementById('vocab-topic-filter');
            if (filterSel && topics && topics.length > 0) {
                let opts = '<option value="">📁 Tất cả chủ đề</option>';
                const groups = {};
                topics.forEach(t => {
                    const cat = (t.category || 'Khác').trim();
                    if (!groups[cat]) groups[cat] = [];
                    groups[cat].push(t);
                });
                const sortedCategories = Object.keys(groups).sort((a, b) => {
                    if (a.toLowerCase() === 'cam') return -1;
                    if (b.toLowerCase() === 'cam') return 1;
                    if (a.toLowerCase() === 'ielts') return -1;
                    if (b.toLowerCase() === 'ielts') return 1;
                    return a.localeCompare(b, 'vi');
                });
                sortedCategories.forEach(cat => {
                    opts += `<optgroup label="📁 ${_esc(cat)}">`;
                    groups[cat].forEach(t => {
                        opts += `<option value="${t.id}">${_esc(t.name)}</option>`;
                    });
                    opts += `</optgroup>`;
                });
                filterSel.innerHTML = opts;
                window._vocabPageState.topicsLoaded = true;
            }
        }).catch(e => console.warn('[vocabTopicsFilter]', e));
    }

    listEl.innerHTML = `
        <div class="flex flex-col items-center justify-center py-20 text-on-surface-variant gap-3">
            <span class="material-symbols-outlined text-primary text-[40px] animate-spin">refresh</span>
            <p class="text-xs sm:text-sm font-medium">Đang tải danh sách từ đã học...</p>
        </div>
    `;
    if (pagEl) pagEl.classList.add('hidden');

    try {
        if (typeof HiDB === 'undefined' || typeof HiDB.getVocabularyPage !== 'function') {
            throw new Error('Hệ thống dữ liệu HiDB chưa sẵn sàng.');
        }

        const res = await HiDB.getVocabularyPage(
            page,
            window._vocabPageState.pageSize,
            currentSearch,
            window._vocabPageState.levelFilter,
            window._vocabPageState.topicId
        );
        const words = res?.words || [];
        const total = res?.total || 0;
        const totalPages = Math.max(1, Math.ceil(total / window._vocabPageState.pageSize));

        window._vocabPageState.total = total;
        window._vocabPageState.totalPages = totalPages;
        window._vocabPageState.isLoading = false;

        // Cập nhật số lượng từ đang học vào heading
        const headingCountEl = document.getElementById('vocab-list-heading-count');
        if (headingCountEl) {
            headingCountEl.textContent = `(${total.toLocaleString('vi-VN')})`;
        }

        // Đồng bộ số liệu biểu đồ SRS trên Sổ từ
        try {
            if (typeof HiDB !== 'undefined' && typeof HiDB.getDashboardStats === 'function') {
                HiDB.getDashboardStats().then(stats => {
                    if (stats && stats.memoryLevels) {
                        const m = stats.memoryLevels;
                        const totalSRS = (m.lv0||0) + (m.lv1||0) + (m.lv2||0) + (m.lv3||0) + (m.lv4||0) + (m.lv5||0);
                        const summaryBadge = document.getElementById('vocab-total-summary-badge');
                        if (summaryBadge) summaryBadge.textContent = `${totalSRS.toLocaleString('vi-VN')} từ`;
                        if (typeof window.renderSRSLevels === 'function') {
                            window.renderSRSLevels(m, 'vocab-');
                        }
                    }
                }).catch(() => {});
            }
        } catch (_) {}

        if (subtitleEl) {
            if (currentSearch) {
                subtitleEl.textContent = `Tìm thấy ${total.toLocaleString('vi-VN')} từ vựng trong sổ tay phù hợp với "${currentSearch}".`;
            } else if (window._vocabPageState.levelFilter !== null) {
                subtitleEl.textContent = `Lọc được ${total.toLocaleString('vi-VN')} từ vựng theo cấp độ ghi nhớ.`;
            } else {
                subtitleEl.textContent = `Sổ tay cá nhân · Tổng cộng ${total.toLocaleString('vi-VN')} từ vựng bạn đã học và lưu trữ.`;
            }
        }

        if (words.length === 0) {
            const isFilterActive = currentSearch || window._vocabPageState.levelFilter !== null || window._vocabPageState.topicId;
            listEl.innerHTML = `
                <div class="flex flex-col items-center justify-center py-16 sm:py-20 text-on-surface-variant gap-4 bg-surface-container-lowest/60 rounded-3xl border border-outline-variant/20 p-6 sm:p-8 text-center max-w-lg mx-auto w-full my-4">
                    <div class="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                        <span class="material-symbols-outlined text-[36px]">${isFilterActive ? 'search_off' : 'collections_bookmark'}</span>
                    </div>
                    <div>
                        <h3 class="font-bold text-base sm:text-lg text-on-surface">
                            ${isFilterActive ? 'Không tìm thấy từ vựng phù hợp' : 'Sổ từ của bạn đang trống'}
                        </h3>
                        <p class="text-xs sm:text-sm text-on-surface-variant mt-1 leading-relaxed">
                            ${isFilterActive 
                                ? 'Thử xóa từ khóa tìm kiếm hoặc đổi bộ lọc cấp độ để xem lại các từ khác trong sổ tay.' 
                                : 'Những từ bạn học trong mục Chủ đề sẽ tự động lưu vào đây. Bạn cũng có thể tự thêm từ vựng mới vào sổ tay ngay bây giờ!'}
                        </p>
                    </div>
                    <div class="flex items-center gap-2.5 pt-2 flex-wrap justify-center">
                        ${isFilterActive ? `
                            <button onclick="window.clearVocabSearch(); window.filterVocabLevel(null);"
                                    class="px-4 py-2 bg-surface-container text-on-surface font-semibold text-xs rounded-xl hover:bg-surface-container-high transition-colors cursor-pointer">
                                Xóa tất cả bộ lọc
                            </button>
                        ` : `
                            <button onclick="window.navigateTo('topics')"
                                    class="px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5">
                                <span class="material-symbols-outlined text-[16px] text-primary">explore</span>
                                <span>Khám phá Chủ đề để học</span>
                            </button>
                            <button onclick="window.openVocabAddModal()"
                                    class="px-4 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl shadow-xs hover:bg-surface-tint transition-all cursor-pointer flex items-center gap-1.5">
                                <span class="material-symbols-outlined text-[16px]">add</span>
                                <span>Thêm từ đầu tiên</span>
                            </button>
                        `}
                    </div>
                </div>
            `;
            if (pagEl) pagEl.classList.add('hidden');
            return;
        }

        const lvLabel = ['Mới', '1h', '8h', '1 ngày', '1 tuần', '1 tháng'];
        const lvColor = [
            'bg-surface-container text-outline',
            'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
            'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300',
            'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
            'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300',
            'bg-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
        ];

        const startIndex = (page - 1) * window._vocabPageState.pageSize;

        listEl.innerHTML = words.map((w, i) => {
            const lv = Math.min(Math.max(w.level || 0, 0), 5);
            const globalIndex = startIndex + i + 1;
            const safeWord = (typeof _esc === 'function' ? _esc(w.word) : w.word) || '';
            const safeMeaning = (typeof _esc === 'function' ? _esc(w.meaning) : w.meaning) || '';
            const safeExample = (typeof _esc === 'function' ? _esc(w.exampleSentence || w.example_sentence || '') : (w.exampleSentence || w.example_sentence || ''));
            const safeTopic = (typeof _esc === 'function' ? _esc(w.topicName || '') : (w.topicName || ''));
            const safePos = (typeof _esc === 'function' ? _esc(w.pos || '') : (w.pos || ''));
            const safePhonetic = (typeof _esc === 'function' ? _esc(w.phonetic || '') : (w.phonetic || ''));

            return `
            <div class="group bg-surface-container-lowest/90 backdrop-blur-sm border border-outline-variant/20 hover:border-primary/40 rounded-2xl p-4 sm:p-5 flex items-start gap-3 sm:gap-4 soft-shadow hover:shadow-md transition-all">
                <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 text-primary font-black text-xs sm:text-sm flex items-center justify-center shrink-0 mt-0.5">
                    ${globalIndex}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-bold text-on-surface text-base sm:text-lg group-hover:text-primary transition-colors tracking-tight">${safeWord}</span>
                        ${safePos ? `<span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">${safePos}</span>` : ''}
                        ${safePhonetic ? `<span class="text-xs sm:text-sm text-outline font-mono">${safePhonetic}</span>` : ''}
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${lvColor[lv]}">${lvLabel[lv]}</span>
                        ${safeTopic ? `<span class="hidden sm:inline-flex text-[10px] font-medium px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant truncate max-w-[180px]" title="${safeTopic}">${safeTopic}</span>` : ''}
                        
                        <div class="ml-auto flex items-center gap-1">
                            <button data-audio-word="${safeWord}"
                                onclick="if(typeof HiDict!=='undefined'&&HiDict.playWordAudio){HiDict.playWordAudio(this.dataset.audioWord)}else if('speechSynthesis' in window){const u=new SpeechSynthesisUtterance(this.dataset.audioWord);u.lang='en-US';window.speechSynthesis.speak(u);}"
                                class="p-1.5 rounded-full hover:bg-primary/10 transition-colors text-outline hover:text-primary cursor-pointer" title="Phát âm">
                                <span class="material-symbols-outlined text-[19px]">volume_up</span>
                            </button>
                            <button onclick="window.deleteVocabWord('${w.id}', '${safeWord}')"
                                class="p-1.5 rounded-full hover:bg-rose-500/10 transition-colors text-outline hover:text-rose-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" title="Xóa khỏi sổ từ">
                                <span class="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                        </div>
                    </div>
                    <p class="text-xs sm:text-sm text-on-surface-variant mt-1.5 font-medium leading-relaxed">${safeMeaning}</p>
                    ${safeExample ? `<p class="text-xs sm:text-sm text-outline italic mt-1.5 leading-relaxed bg-surface-container-lowest/60 p-2 rounded-xl border border-outline-variant/15">${safeExample}</p>` : ''}
                </div>
            </div>`;
        }).join('');

        // Render Pagination Controls
        if (pagEl && totalPages > 1) {
            pagEl.classList.remove('hidden');
            let pagHtml = '';

            pagHtml += `
                <button onclick="window._loadVocabularyPage(${page - 1})"
                        class="px-3 py-1.5 rounded-xl border border-outline-variant/40 text-xs font-bold transition-all ${page <= 1 ? 'opacity-40 cursor-not-allowed pointer-events-none text-outline' : 'hover:bg-primary/10 text-on-surface cursor-pointer'}">
                    &larr; Trước
                </button>
            `;

            const pagesToShow = [];
            for (let p = 1; p <= totalPages; p++) {
                if (p === 1 || p === totalPages || (p >= page - 2 && p <= page + 2)) {
                    pagesToShow.push(p);
                } else if (pagesToShow[pagesToShow.length - 1] !== '...') {
                    pagesToShow.push('...');
                }
            }

            pagesToShow.forEach(p => {
                if (p === '...') {
                    pagHtml += `<span class="px-2 py-1 text-xs text-outline font-bold select-none">...</span>`;
                } else if (p === page) {
                    pagHtml += `
                        <button class="w-8 h-8 rounded-xl bg-primary text-white font-bold text-xs shadow-xs pointer-events-none">
                            ${p}
                        </button>
                    `;
                } else {
                    pagHtml += `
                        <button onclick="window._loadVocabularyPage(${p})"
                                class="w-8 h-8 rounded-xl border border-outline-variant/40 hover:bg-primary/10 text-on-surface font-semibold text-xs transition-colors cursor-pointer">
                            ${p}
                        </button>
                    `;
                }
            });

            pagHtml += `
                <button onclick="window._loadVocabularyPage(${page + 1})"
                        class="px-3 py-1.5 rounded-xl border border-outline-variant/40 text-xs font-bold transition-all ${page >= totalPages ? 'opacity-40 cursor-not-allowed pointer-events-none text-outline' : 'hover:bg-primary/10 text-on-surface cursor-pointer'}">
                    Sau &rarr;
                </button>
            `;

            pagEl.innerHTML = pagHtml;
        } else if (pagEl) {
            pagEl.classList.add('hidden');
        }

    } catch (err) {
        console.error('[_loadVocabularyPage]', err);
        window._vocabPageState.isLoading = false;
        listEl.innerHTML = `
            <div class="flex flex-col items-center justify-center py-16 text-error gap-3 bg-red-50/50 dark:bg-red-950/20 rounded-3xl border border-red-200 dark:border-red-900/40 p-6 text-center">
                <span class="material-symbols-outlined text-[44px]">error</span>
                <h3 class="font-bold text-sm">Không thể tải sổ từ vựng</h3>
                <p class="text-xs text-on-surface-variant">${typeof _esc === 'function' ? _esc(err.message) : err.message}</p>
                <button onclick="window._loadVocabularyPage(${page})" class="mt-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer hover:bg-primary-dark transition-all">
                    Thử lại
                </button>
            </div>
        `;
        if (pagEl) pagEl.classList.add('hidden');
    }
};

window._filterVocabList = function() {
    clearTimeout(window._vocabPageState.debounceTimer);
    const searchVal = document.getElementById('vocab-search')?.value || '';
    window._vocabPageState.debounceTimer = setTimeout(() => {
        window._loadVocabularyPage(1, searchVal);
    }, 300);
};

// ── Topic / Folder Creation Wizard ──────────────────────────────
const TOPIC_ICONS = [
    'work','flight_takeoff','science','palette','menu_book','sports_soccer',
    'music_note','computer','fitness_center','restaurant','favorite','star',
    'school','language','psychology','eco','local_fire_department','rocket_launch'
];

// Wizard state
let _modalCurrentStep = 'step-0';

// Registry of exam-style folder names (persisted in session; 'CAM' is always exam-style)
window._examFolders = window._examFolders || new Set(['cam']);

function _saveFolder(name, isExam) {
    if (!name) return;
    const folders = _getSavedFolders().filter(f => f.name.toLowerCase() !== name.toLowerCase());
    folders.push({ name, isExam: !!isExam });
    try {
        localStorage.setItem('hivocab_user_folders', JSON.stringify(folders));
    } catch(e) {}
}

// Helper: register a folder as exam-style (called when user creates one)
function _registerExamFolder(folderName) {
    if (!folderName) return;
    window._examFolders.add(folderName.trim().toLowerCase());
}

// Helper: check if a category name is exam-style
function _isExamFolder(catName) {
    if (!catName) return false;
    const lower = catName.trim().toLowerCase();
    if (lower === 'cam' || lower.includes('cambridge')) return true;

    // Check localStorage saved folders
    const saved = _getSavedFolders();
    const match = saved.find(f => f.name.toLowerCase() === lower);
    if (match) return match.isExam;

    if (window._examFolders?.has(lower)) return true;

    // Also auto-detect: if any topic in this category has tests
    return (window._allTopics || []).some(t =>
        (t.category || '').toLowerCase() === lower && t._hasTests
    );
}

// Helper: render icon picker (reusable)
function _renderIconPicker(selectedIcon = 'folder') {
    const picker = document.getElementById('icon-picker');
    if (!picker) return;
    picker.innerHTML = TOPIC_ICONS.map(ic => `
        <button type="button" data-icon="${ic}" onclick="window.selectTopicIcon('${ic}')"
            class="icon-pick-btn w-10 h-10 rounded-xl flex items-center justify-center transition-all
                   ${ic === selectedIcon ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-primary/10 hover:text-primary'}">
            <span class="material-symbols-outlined text-[20px]">${ic}</span>
        </button>
    `).join('');
    document.getElementById('new-topic-icon').value = selectedIcon;
}

// Helper: render folder dropdown for "Tạo Chủ đề" step
function _renderCategoryDropdown(preselectCat) {
    const catSel = document.getElementById('new-topic-category-select');
    if (!catSel) return;
    const catMap = new Map();
    const defaultCats = [
        'CAM','Destination C1-C2','SAT','IELTS','Oxford 3000',
        'THPT/ĐGNL','General English','CEFR','Grammar'
    ];
    defaultCats.forEach(c => catMap.set(c.toLowerCase(), c));

    (window._allTopics || []).forEach(t => {
        const c = (t.category || '').trim();
        if (c) catMap.set(c.toLowerCase(), c);
    });

    _getSavedFolders().forEach(f => {
        if (f?.name) catMap.set(f.name.trim().toLowerCase(), f.name.trim());
    });

    const sortedCats = Array.from(catMap.values()).sort((a, b) => {
        if (a.toLowerCase() === 'cam') return -1;
        if (b.toLowerCase() === 'cam') return 1;
        if (a.toLowerCase() === 'ielts') return -1;
        if (b.toLowerCase() === 'ielts') return 1;
        return a.localeCompare(b, 'vi');
    });

    catSel.innerHTML = sortedCats.map(c => {
        const isExam = _isExamFolder(c);
        return `<option value="${_esc(c)}">${isExam ? '🗂️' : '📁'} ${c}${isExam ? ' (đề thi)' : ''}</option>`;
    }).join('');

    let defaultCat = preselectCat
        || (window._activeCategory && window._activeCategory !== 'all' ? window._activeCategory : null)
        || sortedCats[0]
        || 'General English';
    const match = sortedCats.find(c => c.toLowerCase() === defaultCat.toLowerCase());
    catSel.value = match || sortedCats[0];
}

// Called when the folder dropdown changes in Step 1a
window._onTopicCategoryChange = function() {
    const catSel = document.getElementById('new-topic-category-select');
    const checkbox = document.getElementById('topic-exam-checkbox');
    const fields = document.getElementById('topic-exam-fields');
    if (!catSel || !checkbox) return;
    const isExam = _isExamFolder(catSel.value);
    checkbox.checked = isExam;
    if (fields) {
        if (isExam) fields.classList.remove('hidden');
        else fields.classList.add('hidden');
    }
};

// Checkbox toggle for exam structure in Step 1a
window._onTopicExamCheckboxChange = function() {
    const checkbox = document.getElementById('topic-exam-checkbox');
    const fields = document.getElementById('topic-exam-fields');
    if (checkbox && fields) {
        if (checkbox.checked) fields.classList.remove('hidden');
        else fields.classList.add('hidden');
    }
};

// Navigate between wizard steps
window._goToModalStep = function(step, preselectCat) {
    ['ct-step-0', 'ct-step-topic', 'ct-step-folder'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    if (step === 'back') step = 'step-0';

    if (step === 'topic') {
        _modalCurrentStep = 'step-topic';
        document.getElementById('ct-step-topic')?.classList.remove('hidden');
        _renderIconPicker('menu_book');
        _renderCategoryDropdown(preselectCat);
        document.getElementById('new-topic-name').value = '';
        const err = document.getElementById('create-topic-error');
        if (err) err.classList.add('hidden');
        // Check if pre-selected category is exam-style
        window._onTopicCategoryChange();
        setTimeout(() => document.getElementById('new-topic-name')?.focus(), 100);

    } else if (step === 'folder') {
        _modalCurrentStep = 'step-folder';
        document.getElementById('ct-step-folder')?.classList.remove('hidden');
        document.getElementById('new-folder-name').value = '';
        const err = document.getElementById('create-folder-error');
        if (err) err.classList.add('hidden');
        window._selectFolderType('normal', true);
        setTimeout(() => document.getElementById('new-folder-name')?.focus(), 100);

    } else {
        _modalCurrentStep = 'step-0';
        document.getElementById('ct-step-0')?.classList.remove('hidden');
    }
};

// Toggle folder type radio highlight (Step 1b — no config panel needed)
window._selectFolderType = function(type, silent = false) {
    const normalLabel = document.getElementById('folder-type-normal-label');
    const examLabel   = document.getElementById('folder-type-exam-label');
    const normalRadio = document.querySelector('input[name="folder-type"][value="normal"]');
    const examRadio   = document.querySelector('input[name="folder-type"][value="exam"]');

    if (type === 'exam') {
        if (examRadio) examRadio.checked = true;
        normalLabel?.classList.remove('border-primary', 'bg-primary/5');
        normalLabel?.classList.add('border-outline-variant/30');
        examLabel?.classList.remove('border-outline-variant/30');
        examLabel?.classList.add('border-secondary', 'bg-secondary/5');
    } else {
        if (normalRadio) normalRadio.checked = true;
        examLabel?.classList.remove('border-secondary', 'bg-secondary/5');
        examLabel?.classList.add('border-outline-variant/30');
        normalLabel?.classList.remove('border-outline-variant/30');
        normalLabel?.classList.add('border-primary', 'bg-primary/5');
    }
};

// Open modal — always start at Step 0
window.openCreateTopicModal = function() {
    const modal = document.getElementById('modal-create-topic');
    if (!modal) return;
    modal.style.display = 'flex';
    window._goToModalStep('step-0');
};

window.closeCreateTopicModal = function() {
    const modal = document.getElementById('modal-create-topic');
    if (modal) modal.style.display = 'none';
};

window.selectTopicIcon = function(icon) {
    document.getElementById('new-topic-icon').value = icon;
    document.querySelectorAll('.icon-pick-btn').forEach(btn => {
        const isSelected = btn.dataset.icon === icon;
        btn.className = btn.className
            .replace(/bg-primary\s+text-on-primary/g, '')
            .replace(/bg-surface-container-low\s+text-on-surface-variant/g, '')
            .trim();
        btn.className += isSelected
            ? ' bg-primary text-on-primary'
            : ' bg-surface-container-low text-on-surface-variant';
    });
};

// Submit: Tạo Chủ đề (Step 1a)
window.submitCreateTopic = async function() {
    const nameEl    = document.getElementById('new-topic-name');
    const iconEl    = document.getElementById('new-topic-icon');
    const catSel    = document.getElementById('new-topic-category-select');
    const errEl     = document.getElementById('create-topic-error');
    const btn       = document.getElementById('create-topic-submit');
    const checkbox  = document.getElementById('topic-exam-checkbox');

    const name     = nameEl?.value.trim();
    const icon     = iconEl?.value || 'menu_book';
    const category = catSel?.value || 'General English';
    const isExam   = checkbox ? checkbox.checked : false;

    if (!name) {
        if (errEl) { errEl.textContent = 'Vui lòng nhập tên chủ đề.'; errEl.classList.remove('hidden'); }
        nameEl?.focus();
        return;
    }

    let numTests = 4, numPassages = 3;
    if (isExam) {
        numTests    = Math.max(1, Math.min(20, parseInt(document.getElementById('topic-num-tests')?.value) || 4));
        numPassages = Math.max(1, Math.min(10, parseInt(document.getElementById('topic-num-passages')?.value) || 3));
    }

    try {
        if (btn) { btn.disabled = true; btn.textContent = 'Đang tạo...'; }
        if (typeof HiDB === 'undefined') throw new Error('Backend chưa sẵn sàng.');

        const newTopic = await HiDB.createTopic(name, icon, category);

        if (isExam) {
            await HiDB.createCamFolder(newTopic.id, numTests, numPassages);
        }

        window._activeCategory = category;
        window._allTopics = [];
        await window._renderTopicsGrid();
        window.closeCreateTopicModal();

        if (typeof _dictToast === 'function') {
            _dictToast(`Đã tạo chủ đề "${name}"`);
        }

    } catch(err) {
        if (errEl) { errEl.textContent = err.message; errEl.classList.remove('hidden'); }
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Tạo chủ đề'; }
    }
};

// Submit: Tạo Thư mục (Step 1b) — tạo folder, chuyển sang tạo chủ đề
window.submitCreateFolder = async function() {
    const nameEl    = document.getElementById('new-folder-name');
    const errEl     = document.getElementById('create-folder-error');
    const btn       = document.getElementById('create-folder-submit');
    const examRadio = document.querySelector('input[name="folder-type"][value="exam"]');

    const folderName = nameEl?.value.trim();
    const isExam     = examRadio?.checked || false;

    if (!folderName) {
        if (errEl) { errEl.textContent = 'Vui lòng nhập tên thư mục.'; errEl.classList.remove('hidden'); }
        nameEl?.focus();
        return;
    }

    try {
        if (btn) { btn.disabled = true; btn.textContent = 'Đang tạo...'; }

        // Ghi nhớ loại folder trong persistent storage và runtime
        _saveFolder(folderName, isExam);
        if (isExam) _registerExamFolder(folderName);

        // Cập nhật tab danh mục trên giao diện
        window._activeCategory = folderName;
        window._allTopics = window._allTopics || [];
        window._renderCategoryTabs();
        await window._renderTopicsGrid();

        // Chuyển thẳng sang bước "Tạo Chủ đề" với thư mục này được chọn sẵn
        window._goToModalStep('topic', folderName);

        if (typeof _dictToast === 'function') {
            _dictToast(`Đã tạo thư mục "${folderName}". Hãy tạo chủ đề đầu tiên!`);
        }

    } catch(err) {
        if (errEl) { errEl.textContent = err.message; errEl.classList.remove('hidden'); }
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Tạo thư mục'; }
    }
};

// ── Đổi tên Passage ────────────────────────────────────────────
window._openRenamePassage = function(passageId, currentTitle) {
    const modal = document.getElementById('modal-rename-passage');
    const input = document.getElementById('rename-passage-input');
    const idEl  = document.getElementById('rename-passage-id');
    const err   = document.getElementById('rename-passage-error');
    if (!modal) return;
    if (idEl)  idEl.value  = passageId;
    if (input) { input.value = currentTitle || ''; }
    if (err)   err.classList.add('hidden');
    modal.style.display = 'flex';
    setTimeout(() => input?.select(), 100);
};

window._closeRenamePassage = function() {
    const modal = document.getElementById('modal-rename-passage');
    if (modal) modal.style.display = 'none';
};

window._submitRenamePassage = async function() {
    const passageId = document.getElementById('rename-passage-id')?.value;
    const input     = document.getElementById('rename-passage-input');
    const errEl     = document.getElementById('rename-passage-error');
    const btn       = document.getElementById('rename-passage-submit');
    const newTitle  = input?.value.trim();

    if (!newTitle) {
        if (errEl) { errEl.textContent = 'Vui lòng nhập tên cho passage.'; errEl.classList.remove('hidden'); }
        input?.focus();
        return;
    }

    try {
        if (btn) { btn.disabled = true; btn.innerHTML = '<span class="material-symbols-outlined text-[16px] animate-spin">sync</span> Đang lưu...'; }
        if (typeof HiDB === 'undefined') throw new Error('Backend chưa sẵn sàng.');

        await HiDB.updatePassageTitle(passageId, newTitle);

        // Update trong _camHierarchy cache để re-render ngay lập tức
        if (window._camHierarchy?.tests) {
            for (const test of window._camHierarchy.tests) {
                const p = (test.passages || []).find(p => p.id === passageId);
                if (p) { p.title = newTitle; break; }
            }
        }
        // Cập nhật tiêu đề nếu đang mở đúng passage này
        if (window._currentPassageId === passageId) {
            window._currentPassageTitle = newTitle;
            window._currentLessonName = `Passage ${window._currentPassageNumber || ''}: ${newTitle}`;
            ['ld-title','ld-title-mobile','ld-mobile-header-title'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = window._currentLessonName;
            });
            const sidebarLesson = document.getElementById('ld-sidebar-lesson');
            if (sidebarLesson) sidebarLesson.textContent = window._currentLessonName;
        }

        window._closeRenamePassage();
        window._renderCamPassages(window._currentTestIndex || 0);

        if (typeof _dictToast === 'function') {
            _dictToast(`Đã đổi tên thành "${newTitle}"`);
        }

    } catch(err) {
        if (errEl) { errEl.textContent = err.message; errEl.classList.remove('hidden'); }
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<span class="material-symbols-outlined text-[16px]">check</span>Lưu tên'; }
    }
};

// ── Đọc bài đọc song ngữ ───────────────────────────────────────
window._readerViewMode = 'bilingual';
window._currentReaderPassage = null;

// ── Đọc bài đọc song ngữ (Chuyển tiếp sang chế độ Đọc Chủ Động độc lập) ──
window._openPassageReader = async function(passageId, btnEl, isPro) {
    const hasAccess = await window.checkProAccess({ topicId: window._currentTopicId, passageId });
    if (!hasAccess) return;

    if (btnEl) {
        btnEl.classList.add('opacity-75', 'scale-95');
        const icon = btnEl.querySelector('.material-symbols-outlined');
        if (icon) {
            icon.textContent = 'refresh';
            icon.classList.add('animate-spin');
        }
    }
    if (typeof window.startBilingualReading === 'function') {
        window.startBilingualReading(passageId);
    }
};

window._openCurrentPassageReader = function() {
    if (typeof window.startBilingualReading === 'function') {
        window.startBilingualReading(window._currentPassageId);
    }
};

window._closePassageReader = function() {
    if (typeof window.closeBilingualReading === 'function') {
        window.closeBilingualReading();
    }
};

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('modal-passage-reader');
        if (modal && modal.style.display === 'flex') {
            window._closePassageReader();
        }
    }
});

window._setReaderViewMode = function(mode) {
    window._readerViewMode = mode;
    ['bilingual', 'en', 'vi'].forEach(m => {
        const btn = document.getElementById(`reader-btn-${m}`);
        const btnM = document.getElementById(`reader-btn-${m}-m`);
        const active = m === mode;
        if (btn) {
            btn.className = active
                ? 'px-3 py-1 rounded-lg bg-primary text-on-primary shadow-sm transition-all'
                : 'px-3 py-1 rounded-lg text-on-surface-variant hover:text-primary transition-all';
        }
        if (btnM) {
            btnM.className = active
                ? 'flex-1 py-1.5 rounded-lg bg-primary text-on-primary transition-all'
                : 'flex-1 py-1.5 rounded-lg bg-surface-container text-on-surface-variant transition-all';
        }
    });
    window._renderReaderContent();
};

window._renderReaderContent = function() {
    const contentEl = document.getElementById('reader-content');
    if (!contentEl) return;
    const p = window._currentReaderPassage;
    if (!p || (!p.contentEn && !p.contentVi)) {
        contentEl.innerHTML = `<div class="text-center py-16 text-on-surface-variant"><span class="material-symbols-outlined text-[48px] opacity-30 mb-2 block">article</span>Chưa có nội dung bài đọc cho phần này.</div>`;
        return;
    }

    const enText = (p.contentEn || '').trim();
    const viText = (p.contentVi || '').trim();

    const enParas = enText ? enText.split(/\n\s*\n|\r\n\r\n/).map(s => s.trim()).filter(Boolean) : [];
    const viParas = viText ? viText.split(/\n\s*\n|\r\n\r\n/).map(s => s.trim()).filter(Boolean) : [];

    const mode = window._readerViewMode || 'bilingual';

    if (mode === 'en') {
        contentEl.innerHTML = `
            <div class="max-w-3xl mx-auto flex flex-col gap-4 font-normal text-on-surface leading-relaxed text-base">
                ${enParas.map(para => `<p class="text-justify">${_esc(para)}</p>`).join('')}
            </div>`;
        return;
    }

    if (mode === 'vi') {
        contentEl.innerHTML = `
            <div class="max-w-3xl mx-auto flex flex-col gap-4 font-normal text-on-surface leading-relaxed text-base">
                ${viParas.map(para => `<p class="text-justify">${_esc(para)}</p>`).join('')}
            </div>`;
        return;
    }

    // Bilingual mode: Parallel paragraphs
    const maxParas = Math.max(enParas.length, viParas.length);
    let html = `<div class="flex flex-col gap-6">`;
    for (let i = 0; i < maxParas; i++) {
        const enP = enParas[i] || '';
        const viP = viParas[i] || '';
        if (!enP && !viP) continue;
        const enHtml = enP ? `<p class="text-justify font-normal text-sm md:text-base">${_esc(enP)}</p>` : `<p class="text-xs text-outline italic py-2">—</p>`;
        const viHtml = viP ? `<p class="text-justify font-normal text-sm md:text-base">${_esc(viP)}</p>` : `<p class="text-xs text-outline italic py-2">—</p>`;
        html += `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-outline-variant/15 last:border-b-0">
            <div class="p-3.5 bg-surface-container-low/50 rounded-xl leading-relaxed text-on-surface">
                <span class="text-[10px] font-bold text-primary uppercase tracking-wider block mb-1.5">English</span>
                ${enHtml}
            </div>
            <div class="p-3.5 bg-surface-container-lowest/60 border border-outline-variant/20 rounded-xl leading-relaxed text-on-surface">
                <span class="text-[10px] font-bold text-secondary uppercase tracking-wider block mb-1.5">Bản dịch tiếng Việt</span>
                ${viHtml}
            </div>
        </div>`;
    }
    html += `</div>`;
    contentEl.innerHTML = html;
};

window.addTopicCard = function(topic) {
    const grid = document.getElementById('topics-grid');
    if (!grid) return;
    const card = document.createElement('div');
    card.id = `topic-card-${topic.id}`;
    card.className = 'topic-card-surface cursor-pointer group relative bg-surface-container-lowest/80 backdrop-blur-[24px] rounded-2xl p-4 md:p-6 min-h-[160px] md:min-h-[240px] border border-outline-variant/20 soft-shadow flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg fade-in';
    card.setAttribute('onclick', `window._openTopic('${topic.id}')`);
    card.innerHTML = `
        <button onclick="event.stopPropagation(); window.deleteTopicCard('${topic.id}');"
                class="absolute top-2 left-2 md:top-3 md:left-3 w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full text-outline hover:bg-error-container hover:text-error transition-colors z-10">
            <span class="material-symbols-outlined text-[16px] md:text-[20px]">close</span>
        </button>
        <div class="flex flex-col h-full mt-4 md:mt-8">
            <div class="w-8 h-8 md:w-12 md:h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface mb-2 md:mb-4 shadow-sm shrink-0">
                <span class="material-symbols-outlined text-[18px] md:text-2xl">${topic.icon}</span>
            </div>
            <h3 class="text-sm md:text-lg font-bold text-on-surface group-hover:text-primary transition-colors leading-snug mb-1 line-clamp-2">${topic.name}</h3>
            <div class="mt-auto pt-3 md:pt-4 flex flex-col gap-1 md:gap-2">
                <div class="flex justify-between items-center font-label-sm text-[9px] md:text-xs text-on-surface-variant"><span>Tiến độ</span><span class="text-primary font-bold">0%</span></div>
                <div class="w-full h-1 md:h-1.5 rounded-full bg-surface-container-highest overflow-hidden"><div class="h-full bg-primary rounded-full w-0"></div></div>
            </div>
        </div>`;
    grid.prepend(card);
};

window.deleteTopicCard = async function(topicId) {
    if (!confirm('Xóa chủ đề này và toàn bộ từ vựng?')) return;
    try {
        if (typeof HiDB !== 'undefined') await HiDB.deleteTopic(topicId);
        document.getElementById(`topic-card-${topicId}`)?.remove();
        window._allTopics = (window._allTopics || []).filter(t => t.id !== topicId);
    } catch(err) { alert('Lỗi xóa: ' + err.message); }
};

// ============================================================
// ============================================================
// THPT EXAM MODULE  —  Moved to thptExam.js
// ============================================================
// DICTIONARY PAGE  —  Tra từ điển
// ============================================================

/** State tra từ hiện tại */
window._dictCurrentResult = null;

/** Hiện/ẩn các panel trong trang dictionary */
function _dictShow(state) {
    // state: 'empty' | 'loading' | 'error' | 'result'
    ['empty', 'loading', 'error', 'result'].forEach(s => {
        const el = document.getElementById('dict-' + s);
        if (!el) return;
        if (s === state) {
            el.classList.remove('hidden');
            el.classList.add('flex');
        } else {
            el.classList.add('hidden');
            el.classList.remove('flex');
        }
    });
}

/** Tra từ — gọi HiDict (DeepL) và render kết quả ngay lập tức */
window.dictSearch = async function() {
    const input = document.getElementById('dict-input');
    const word  = input?.value?.trim();
    if (!word) return;

    if (typeof HiDict === 'undefined') {
        alert('Lỗi: dictionary.js chưa được load.');
        return;
    }

    _dictShow('loading');
    window._dictCurrentResult = null;

    const result = await HiDict.lookupWord(word);

    if (!result) {
        _dictShow('error');
        return;
    }

    window._dictCurrentResult = result;
    _dictRenderResult(result);
    _dictShow('result');
};

/** Render kết quả tra từ vào DOM */
function _dictRenderResult(r) {
    // Word & phonetic
    document.getElementById('dict-word').textContent     = r.word;
    document.getElementById('dict-phonetic').textContent = r.phonetic || '';

    // Nghĩa tiếng Việt từ DeepL — hiện ngay, không cần chờ
    const viSumEl = document.getElementById('dict-vi-summary');
    if (viSumEl) {
        if (r.viSummary) {
            viSumEl.textContent = r.viSummary;
            viSumEl.classList.remove('hidden');
        } else {
            viSumEl.classList.add('hidden');
        }
    }

    // Synonyms
    const synWrap = document.getElementById('dict-synonyms-wrap');
    const synEl   = document.getElementById('dict-synonyms');
    if (r.synonyms?.length > 0) {
        synEl.innerHTML = r.synonyms.map(s => {
            const safeAttr = typeof _esc === 'function' ? _esc(s) : s;
            return `<span class="px-3 py-1 rounded-full bg-secondary-container/60 text-on-secondary-container text-xs font-medium cursor-pointer hover:bg-secondary-container transition-colors"
                          data-search-word="${safeAttr}"
                          onclick="document.getElementById('dict-input').value=this.dataset.searchWord; window.dictSearch()">${safeAttr}</span>`;
        }).join('');
        synWrap.classList.remove('hidden');
    } else {
        synWrap.classList.add('hidden');
    }

    // Meanings (tiếng Anh từ Free Dictionary — nếu có)
    const meaningsEl = document.getElementById('dict-meanings');
    meaningsEl.innerHTML = '';

    const posColors = {
        noun:        'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        verb:        'bg-green-500/10 text-green-600 dark:text-green-400',
        adjective:   'bg-orange-500/10 text-orange-600 dark:text-orange-400',
        adverb:      'bg-purple-500/10 text-purple-600 dark:text-purple-400',
        preposition: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
    };

    (r.meanings || []).forEach((meaning, mi) => {
        const colorClass = posColors[meaning.partOfSpeech] || 'bg-surface-container text-on-surface-variant';

        const defs = (meaning.definitions || []).map((d, i) => `
            <div class="flex gap-3 ${i > 0 ? 'mt-4 pt-4 border-t border-outline-variant/15' : ''}">
                <span class="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">${i + 1}</span>
                <div class="flex-1">
                    <p class="text-sm md:text-base text-on-surface leading-relaxed">${_escHtml(d.definition)}</p>
                    ${d.example ? `<p class="mt-2 text-xs md:text-sm text-on-surface-variant italic border-l-2 border-secondary-fixed-dim pl-3">"${_escHtml(d.example)}"</p>` : ''}
                </div>
            </div>
        `).join('');

        const card = document.createElement('div');
        card.className = 'glass-card soft-shadow rounded-2xl p-5 md:p-6';
        card.innerHTML = `
            <div class="flex items-center gap-2 mb-4">
                <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${colorClass}">${meaning.partOfSpeech}</span>
            </div>
            <div class="flex flex-col">
                ${defs}
            </div>
        `;
        meaningsEl.appendChild(card);
    });
}



/** Phát âm từ đang hiển thị */
window.dictPlayAudio = async function() {
    const r = window._dictCurrentResult;
    if (!r) return;
    await HiDict.playWordAudio(r.word);
};

/** Escape HTML */
function _escHtml(str) {
    return (str || '')
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#39;');
}

// ── MODAL: Lưu từ vào chủ đề ────────────────────────────────

/** Mở modal chọn chủ đề để lưu từ */
window.dictOpenSaveModal = async function() {
    const r = window._dictCurrentResult;
    if (!r) return;

    if (typeof window.openTopicPicker === 'function') {
        window.openTopicPicker(async (dest) => {
            await window.dictSaveWord(dest.topicId, dest.topicName, dest.passageId, dest.passageTitle, dest.fullLabel);
        }, {
            title: 'Lưu từ vào bộ từ vựng',
            subtitle: `Từ: "${r.word}"`
        });
    }
};

/** Lưu từ vào chủ đề đã chọn */
window.dictSaveWord = async function(topicId, topicName, passageId = null, passageTitle = null, fullLabel = null) {
    const r = window._dictCurrentResult;
    if (!r || !topicId) return;

    if (!topicName) {
        const found = (window._dictTopicsCache || window._allTopics || []).find(t => t.id === topicId);
        topicName = found ? found.name : 'chủ đề';
    }

    const errEl = document.getElementById('save-word-error');

    // ── Xác định meaning (ưu tiên tiếng Việt) ────────────────────
    let meaning = '';

    if (r.viSummary) {
        // Lấy viSummary làm nghĩa chính (ngắn gọn, tiếng Việt)
        meaning = r.viSummary;
    } else if (r.viMeanings?.[0]?.viDefinitions?.[0]) {
        // Fallback: nghĩa tiếng Việt từ viMeanings đầu tiên
        meaning = r.viMeanings[0].viDefinitions[0];
    } else {
        // Cuối cùng: dùng nghĩa tiếng Anh (có ghi chú)
        meaning = r.meanings?.[0]?.definitions?.[0]?.definition || '';
        if (meaning) meaning = `[EN] ${meaning}`;
    }

    // ── Câu ví dụ (từ Free Dictionary / fallback tổng hợp) ──────
    let example = r.example || '';
    if (!example && Array.isArray(r.meanings)) {
        for (const m of r.meanings) {
            for (const d of (m.definitions || [])) {
                if (d.example) { example = d.example; break; }
            }
            if (example) break;
        }
    }
    if (!example && r.word) {
        example = `She learned how to use "${r.word}" in a sentence today.`;
    }

    // ── Phonetic ──────────────────────────────────────────────────
    const phonetic = r.phonetic || '';

    try {
        if (typeof HiDB === 'undefined') throw new Error('HiDB chưa sẵn sàng.');
        await HiDB.addWord(topicId, {
            word:            r.word,
            phonetic,
            meaning,
            exampleSentence: example,
            passageId:       passageId || null,
        });

        // Thành công
        window.dictCloseSaveModal();
        const displayDest = fullLabel || (passageTitle ? `${topicName} · ${passageTitle}` : topicName);
        _dictToast(`✓ Đã lưu "${r.word}" vào "${displayDest}"`);
        if (typeof showToast === 'function') {
            showToast(`✓ Đã lưu "${r.word}" vào "${displayDest}"`, 'success');
        }

    } catch(err) {
        if (errEl) {
            errEl.textContent = 'Lỗi: ' + err.message;
            errEl.classList.remove('hidden');
        }
        if (typeof showToast === 'function') {
            showToast('Lỗi lưu từ: ' + err.message, 'error');
        }
    }
};


/** Đóng modal lưu từ */
window.dictCloseSaveModal = function() {
    if (typeof window.closeTopicPicker === 'function') {
        window.closeTopicPicker();
    }
};

/** Toast thông báo nhỏ */
function _dictToast(msg) {
    let toast = document.getElementById('dict-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'dict-toast';
        toast.className = 'fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-[99999] bg-on-surface text-surface text-sm font-medium px-5 py-3 rounded-full shadow-xl transition-all duration-300 opacity-0 pointer-events-none';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 2800);
}



// ============================================================
// KHỐI 4: EXTENSION BRIDGE & APP INITIALIZATION
// ============================================================
// Cầu nối cho Chrome extension. Extension không giữ Supabase token;
// mọi thao tác thêm từ vẫn dùng session đăng nhập của app.
window.addEventListener('message', async (event) => {
    const message = event.data;
    if (event.source !== window || message?.source !== 'hi-vocab-extension') return;

    const reply = (ok, data = null, error = '') => window.postMessage({
        source: 'hi-vocab-app', requestId: message.requestId, ok, data, error
    }, '*');

    try {
        if (message.action === 'get-topics') {
            const user = await HiDB.getCurrentUser();
            if (!user) throw new Error('Bạn chưa đăng nhập trong app.');
            reply(true, await HiDB.getTopics());
            return;
        }
        if (message.action === 'add-word') {
            const user = await HiDB.getCurrentUser();
            if (!user) throw new Error('Bạn chưa đăng nhập trong app.');
            const payload = message.payload || {};
            if (!payload.topicId || !payload.word || !payload.meaning) {
                throw new Error('Thiếu topic, từ hoặc nghĩa Việt.');
            }
            reply(true, await HiDB.addWord(payload.topicId, {
                word: payload.word,
                phonetic: payload.phonetic || '',
                meaning: payload.meaning,
                exampleSentence: payload.exampleSentence || '',
                passageId: payload.passageId || payload.passage_id || null
            }));
        }
    } catch (error) {
        reply(false, null, error?.message || 'Không thể xử lý yêu cầu.');
    }
});

// KẾT NỐI SUPABASE THẬT
async function bootstrapHiDB() {
    try {
        if (!HiDB.isReady()) {
            await HiDB.init(
                'https://swehdtrqjyklmsefkjdf.supabase.co', 
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3ZWhkdHJxanlrbG1zZWZramRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTc4MDcsImV4cCI6MjA5Mzk3MzgwN30.dXRhEmvS8J21aJ3dwZ4jHaWuKbhNw2yys90YTIop2EU'
            );
        }
        console.log("Đã kết nối Supabase thành công!");
        
        // Tắt chế độ mock data
        localStorage.removeItem('hi_use_mock');
        
        // Kiểm tra xem có lỗi xác thực từ URL không (ví dụ link email hết hạn hoặc không hợp lệ)
        const authInfo = window._parseAuthRedirectInfo ? window._parseAuthRedirectInfo() : null;
        if (window._pendingAuthError || authInfo?.hasError) {
            const errDesc = window._pendingAuthError?.errorDesc || authInfo?.errorDesc || 'Liên kết không hợp lệ hoặc đã hết hạn.';
            window.openAuthErrorModal(errDesc);
            history.replaceState(null, '', window.location.pathname);
        }

        // Kiểm tra nếu vào link đặt lại mật khẩu từ email
        if (window._isPasswordRecoveryMode || authInfo?.isRecovery) {
            window._isPasswordRecoveryMode = true;
            window.openResetPasswordModal();
        }

        // Thiết lập lắng nghe trạng thái đăng nhập để xử lý luồng OAuth hoặc khi đăng nhập thay đổi
        HiDB.onAuthStateChange((event, session) => {
            // Phát tín hiệu xác thực cho Chrome Extension (nếu có)
            try {
                window.postMessage({
                    source: 'hi-vocab-app',
                    action: 'auth-state-change',
                    event: event,
                    session: session ? {
                        access_token: session.access_token,
                        refresh_token: session.refresh_token || null,
                        expires_at: session.expires_at || null
                    } : null
                }, '*');
            } catch (_) {}

            if (event === 'PASSWORD_RECOVERY' || window._isPasswordRecoveryMode) {
                console.log('AuthStateChange: Yêu cầu đặt lại mật khẩu');
                window._isPasswordRecoveryMode = true;
                window.openResetPasswordModal();
                return;
            }

            if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                const user = session?.user;
                if (user) {
                    if (window._isPasswordRecoveryMode) {
                        window.openResetPasswordModal();
                        return;
                    }

                    console.log('AuthStateChange: Đã đăng nhập:', user.email);
                    _updateProfileUI(user);

                    // Xóa cache topics/exercises để load lại với progress của user
                    window._allTopics = [];
                    window._allExercises = null;

                    const isAuthHash = window.location.hash.includes('access_token=') || window.location.hash.includes('error_description=');
                    if (isAuthHash) {
                        try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch(_) {}
                    }

                    const curPage = document.querySelector('.page.active')?.id;
                    const rawHash = (window.location.hash || '').replace(/^#/, '').replace(/^page-/, '');
                    const isLandingOrLogin = !curPage || curPage === 'page-landing' || curPage === 'page-login';
                    const hasTargetRoute = rawHash && rawHash !== 'landing' && rawHash !== 'login' && !rawHash.includes('access_token=');

                    if (isLandingOrLogin || isAuthHash) {
                        if (!hasTargetRoute) {
                            window.navigateTo('dashboard');
                        }
                    }
                }
            } else if (event === 'SIGNED_OUT') {
                // Xóa cache khi đăng xuất
                window._allTopics = [];
                window._allExercises = null;
                window.navigateTo('landing');
            }
        });

        // Kiểm tra đăng nhập ban đầu
        const user = await HiDB.getCurrentUser();
        if (user) {
            console.log("Đã đăng nhập:", user.email);
            
            // Đồng bộ phiên đăng nhập ban đầu cho Chrome Extension
            try {
                const sbKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
                const raw = sbKey ? localStorage.getItem(sbKey) : null;
                const parsed = raw ? JSON.parse(raw) : null;
                if (parsed?.access_token) {
                    window.postMessage({
                        source: 'hi-vocab-app',
                        action: 'auth-state-change',
                        event: 'INITIAL_SESSION',
                        session: {
                            access_token: parsed.access_token,
                            refresh_token: parsed.refresh_token || null,
                            expires_at: parsed.expires_at || null
                        }
                    }, '*');
                }
            } catch (_) {}

            // CẬP NHẬT GIAO DIỆN PROFILE
            _updateProfileUI(user);
            HiDB.getTopics().then(topics => {
                window._allTopics = topics || [];
            }).catch(err => console.warn('[prefetch topics]', err));

            const isAuthHash = window.location.hash.includes('access_token=') || window.location.hash.includes('error_description=');
            if (isAuthHash) { 
                try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch(_) {}
            }

            // Nếu đang trong chế độ đặt lại mật khẩu, không điều hướng về dashboard
            if (!window._isPasswordRecoveryMode) {
                const curPage = document.querySelector('.page.active')?.id;
                const rawHash = (window.location.hash || '').replace(/^#/, '').replace(/^page-/, '');
                const isLandingOrLogin = !curPage || curPage === 'page-landing' || curPage === 'page-login';
                const hasTargetRoute = rawHash && rawHash !== 'landing' && rawHash !== 'login' && !rawHash.includes('access_token=');

                if (isLandingOrLogin || isAuthHash) {
                    if (!hasTargetRoute) {
                        window.navigateTo('dashboard');
                    }
                }
            }
        }

        // Tự động load thư viện nếu đang ở trang library hoặc hash #library
        const activePageId = document.querySelector('.page.active')?.id;
        if (window.location.hash.includes('library') || activePageId === 'page-library') {
            if (window.loadCommunityLibrary) {
                window.loadCommunityLibrary();
            }
        }
    } catch(e) {
        console.error("Lỗi kết nối database:", e);
    }

    // Hiển thị thông báo chào mừng ra mắt website & tặng quà 2 tháng cho người dùng
    if (typeof window.checkAndShowWelcomeModal === 'function') {
        window.checkAndShowWelcomeModal();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", bootstrapHiDB);
} else {
    bootstrapHiDB();
}

// CẬP NHẬT UI PROFILE (dùng chung cho desktop + mobile)
window._updateProfileUI = async function(user) {
    if (!user) {
        document.querySelectorAll('.profile-pro-badge').forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('inline-flex');
        });
        document.querySelectorAll('.btn-upgrade-pro').forEach(el => el.classList.remove('hidden'));
        return;
    }
    const name = user.user_metadata?.full_name || user.email.split('@')[0];
    const avatar = user.user_metadata?.avatar_url;

    const nameEl    = document.getElementById('profile-name');
    const emailEl   = document.getElementById('profile-email');
    const avatarDesk = document.getElementById('profile-avatar-container');
    const avatarMob  = document.getElementById('mobile-profile-avatar');
    const libUserEl   = document.getElementById('lib-quick-username');
    const libAvatarEl = document.getElementById('lib-quick-avatar');
    const libDockAvatar = document.getElementById('lib-dock-avatar');

    if (nameEl)    nameEl.textContent    = name;
    if (emailEl)   emailEl.textContent   = user.email;
    if (libUserEl) libUserEl.textContent = name;

    // Cập nhật email trong tab Cài đặt
    const settingsEmail = document.getElementById('settings-user-email');
    if (settingsEmail && user.email) settingsEmail.textContent = user.email;

    if (avatar) {
        if (avatarDesk) { avatarDesk.style.backgroundImage = `url('${avatar}')`; avatarDesk.innerHTML = ''; }
        if (avatarMob)  { avatarMob.style.backgroundImage  = `url('${avatar}')`; avatarMob.innerHTML = ''; }
        document.querySelectorAll('.mobile-user-avatar').forEach(el => {
            el.style.backgroundImage = `url('${avatar}')`;
            el.innerHTML = '';
        });
        if (libAvatarEl) { libAvatarEl.style.backgroundImage = `url('${avatar}')`; libAvatarEl.innerHTML = ''; }
        if (libDockAvatar) { libDockAvatar.style.backgroundImage = `url('${avatar}')`; libDockAvatar.innerHTML = ''; }
    }

    // Cập nhật info trong mobile dropdown
    const dropName  = document.getElementById('mobile-dropdown-name');
    const dropEmail = document.getElementById('mobile-dropdown-email');
    if (dropName)  dropName.textContent  = name;
    if (dropEmail) dropEmail.textContent = user.email;
    const authBtn = document.getElementById('mobile-dropdown-auth-btn');
    if (authBtn) {
        authBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">logout</span><span>Đăng xuất</span>';
        authBtn.className = 'w-full flex items-center gap-2 px-4 py-3 text-sm text-error hover:bg-error/5 transition-colors border-t border-outline-variant/15 cursor-pointer';
    }

    // KIỂM TRA TRẠNG THÁI PRO VÀ CẬP NHẬT UI
    try {
        const isPro = typeof HiDB !== 'undefined' ? await HiDB.isUserPro() : false;
        window._isUserPro = isPro;

        // Cập nhật huy hiệu PRO cạnh Profile
        document.querySelectorAll('.profile-pro-badge').forEach(el => {
            if (isPro) {
                el.classList.remove('hidden');
                el.classList.add('inline-flex');
            } else {
                el.classList.add('hidden');
                el.classList.remove('inline-flex');
            }
        });

        // Tự động ẩn / hiện nút Nâng cấp PRO
        document.querySelectorAll('.btn-upgrade-pro').forEach(el => {
            if (isPro) {
                el.classList.add('hidden');
            } else {
                el.classList.remove('hidden');
            }
        });

        // Viền Avatar ánh vàng nổi bật nếu là thành viên PRO
        if (isPro) {
            avatarDesk?.classList.add('ring-2', 'ring-amber-500/70');
            avatarMob?.classList.add('ring-2', 'ring-amber-500/70');
        } else {
            avatarDesk?.classList.remove('ring-2', 'ring-amber-500/70');
            avatarMob?.classList.remove('ring-2', 'ring-amber-500/70');
        }

        // Tự động làm mới danh sách bài học / chủ đề đang mở để loại bỏ icon ổ khóa và huy hiệu PRO
        const curPage = document.querySelector('.page.active')?.id;
        if (curPage === 'page-topics' && typeof window._renderTopicsGrid === 'function') {
            window._renderTopicsGrid();
        } else if (curPage === 'page-topic-detail' && window._currentTopicId) {
            if (window._camHierarchy && typeof window._renderCamPassages === 'function') {
                window._renderCamPassages(window._currentTestIndex || 0);
            } else if (typeof window._loadLessons === 'function') {
                window._loadLessons(window._currentTopicId);
            }
        }
    } catch (e) {
        console.warn('[_updateProfileUI check PRO error]', e);
    }
};

// XỬ LÝ ĐĂNG XUẤT
window.handleLogout = async function() {
    try {
        if (typeof HiDB !== 'undefined') {
            await HiDB.signOut();
        }
        localStorage.removeItem('hi_use_mock');
        history.replaceState(null, '', window.location.pathname); // Xóa hash sạch
        window.location.reload(); // Reload để reset UI về landing
    } catch(err) {
        console.error("Lỗi đăng xuất:", err);
    }
};

window.handleMobileDropdownAuth = function() {
    const dropdown = document.getElementById('mobile-profile-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
    if (typeof HiDB !== 'undefined' && HiDB.currentUser) {
        window.handleLogout();
    } else {
        window.navigateTo('login');
    }
};

// MOBILE PROFILE DROPDOWN
window.toggleMobileProfileDropdown = function() {
    const dropdown = document.getElementById('mobile-profile-dropdown');
    if (!dropdown) return;
    const isHidden = dropdown.classList.contains('hidden');
    if (isHidden) {
        dropdown.classList.remove('hidden');
        setTimeout(() => {
            document.removeEventListener('click', _closeMobileDropdownOutside);
            document.addEventListener('click', _closeMobileDropdownOutside);
        }, 10);
    } else {
        dropdown.classList.add('hidden');
        document.removeEventListener('click', _closeMobileDropdownOutside);
    }
};

function _closeMobileDropdownOutside(e) {
    const dropdown = document.getElementById('mobile-profile-dropdown');
    const isAvatar = e.target.closest('#mobile-profile-avatar, .mobile-user-avatar');
    if (dropdown && !dropdown.contains(e.target) && !isAvatar) {
        dropdown.classList.add('hidden');
        document.removeEventListener('click', _closeMobileDropdownOutside);
    }
}

