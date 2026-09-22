/**
 * library.js - Community Vocabulary Library (Thư viện học tập cộng đồng)
 * Threads.com minimalist aesthetic with Feed, Thread Chain View, Likes, Comments, and 1-Click Clone.
 */
(function() {
    'use strict';

    // State
    const state = {
        currentTab: 'feed', // 'feed' | 'my' | 'liked'
        currentTag: 'all',
        searchQuery: '',
        sortBy: 'popular',
        isLoading: false,
        topics: [],
        myTopics: [],
        likedTopics: [],
        activeTopicDetail: null,
        activeCommentsTopicId: null,
        activeCommentsTopicTitle: ''
    };

    // Tags list for top pills
    const AVAILABLE_TAGS = [
        { label: 'Tất cả', value: 'all' },
        { label: '🔥 IELTS', value: 'IELTS' },
        { label: '🎓 THPT-QG', value: 'THPT-QG' },
        { label: '🚀 C1-C2', value: 'C1-C2' },
        { label: '💬 Giao tiếp', value: 'GiaoTiếp' },
        { label: '✨ Collocations', value: 'Collocations' },
        { label: '📖 Destination', value: 'Destination' },
        { label: '🎯 Cam 18-19', value: 'Cam19' }
    ];

    /**
     * Escape HTML utility
     */
    function esc(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Format relative time
     */
    function formatTimeAgo(isoString) {
        if (!isoString) return 'Mới đây';
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMinutes < 1) return 'Vừa xong';
        if (diffMinutes < 60) return `${diffMinutes} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    /**
     * Web Speech API Pronunciation
     */
    function playWordAudio(word, event) {
        if (event) event.stopPropagation();
        if (!word) return;
        if (typeof window !== 'undefined' && window.HiAudio && typeof window.HiAudio.playWord === 'function') {
            window.HiAudio.playWord(word, 0.9);
            return;
        }
        if (typeof window === 'undefined' || !window.speechSynthesis) return;
        try {
            if (window.speechSynthesis.paused) window.speechSynthesis.resume();
            const utter = new SpeechSynthesisUtterance(word);
            utter.lang = 'en-US';
            utter.rate = 0.88;
            window.speechSynthesis.speak(utter);
        } catch (err) {
            console.warn('[playWordAudio] Audio error:', err);
        }
    }


    /**
     * Render the tag pills bar
     */
    function renderTagsBar() {
        const bar = document.getElementById('lib-tags-bar');
        if (!bar) return;

        bar.innerHTML = AVAILABLE_TAGS.map(t => {
            const isActive = state.currentTag === t.value || (t.value === 'all' && (!state.currentTag || state.currentTag === 'all'));
            const activeClass = isActive
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold shadow-xs'
                : 'bg-surface-container-high/60 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-medium';
            return `
                <button type="button" onclick="window.filterLibraryTag('${esc(t.value)}')"
                    class="shrink-0 px-3.5 py-1.5 rounded-full text-xs transition-all active:scale-95 cursor-pointer ${activeClass}">
                    ${esc(t.label)}
                </button>
            `;
        }).join('');
    }

    /**
     * Supabase Realtime channel lắng nghe sự kiện thay đổi trên bảng topics
     */
    let realtimeChannel = null;
    function initRealtimeSubscription() {
        if (realtimeChannel) return;
        try {
            if (typeof HiDB === 'undefined' || !HiDB.getClient) return;
            const client = HiDB.getClient();
            if (!client || typeof client.channel !== 'function') return;

            realtimeChannel = client
                .channel('realtime:community-topics')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'topics' }, (payload) => {
                    console.log('[Community Library] Realtime update on topics:', payload.eventType);
                    if (state.currentTab === 'feed') {
                        fetchPublicFeed();
                    } else if (state.currentTab === 'my') {
                        fetchMyTopics();
                    } else if (state.currentTab === 'liked') {
                        fetchLikedTopics();
                    }
                })
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        console.log('[Community Library] Realtime subscription active');
                    }
                });
        } catch (err) {
            console.warn('[Community Library] Realtime setup warning:', err);
        }
    }

    /**
     * URL Shortening Utilities for Community Decks (Base64url 22-char UUID compression)
     */
    function encodeTopicShortCode(uuid) {
        if (!uuid || typeof uuid !== 'string') return uuid;
        const clean = uuid.toLowerCase().replace(/[^0-9a-f]/g, '');
        if (clean.length !== 32) return uuid;
        try {
            const bytes = new Uint8Array(16);
            for (let i = 0; i < 16; i++) {
                bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
            }
            let bin = '';
            for (let i = 0; i < 16; i++) bin += String.fromCharCode(bytes[i]);
            return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        } catch (e) {
            console.warn('[encodeTopicShortCode] Fallback to raw uuid:', e);
            return uuid;
        }
    }

    function decodeTopicShortCode(code) {
        if (!code || typeof code !== 'string') return code;
        const trimmed = code.trim();
        // Standard 36-char UUID format with hyphens
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
            return trimmed.toLowerCase();
        }
        // 32-char hex without hyphens
        if (/^[0-9a-f]{32}$/i.test(trimmed)) {
            return [
                trimmed.slice(0, 8),
                trimmed.slice(8, 12),
                trimmed.slice(12, 16),
                trimmed.slice(16, 20),
                trimmed.slice(20, 32)
            ].join('-').toLowerCase();
        }
        // 22-char base64url format
        if (/^[A-Za-z0-9_-]{22}$/.test(trimmed)) {
            try {
                let base64 = trimmed.replace(/-/g, '+').replace(/_/g, '/');
                while (base64.length % 4) base64 += '=';
                const bin = atob(base64);
                if (bin.length === 16) {
                    let hex = '';
                    for (let i = 0; i < bin.length; i++) {
                        hex += bin.charCodeAt(i).toString(16).padStart(2, '0');
                    }
                    return [
                        hex.slice(0, 8),
                        hex.slice(8, 12),
                        hex.slice(12, 16),
                        hex.slice(16, 20),
                        hex.slice(20, 32)
                    ].join('-').toLowerCase();
                }
            } catch (e) {
                console.warn('[decodeTopicShortCode] Error decoding base64:', e);
            }
        }
        return trimmed;
    }

    function extractDeepTopicId() {
        const hash = window.location.hash || '';
        const search = window.location.search || '';

        let rawCode = null;
        const dHashMatch = hash.match(/[#?&]d=([^&]+)/);
        const topicHashMatch = hash.match(/[#?&](?:topic|deck)=([^&]+)/);
        const dSearchMatch = search.match(/[?&]d=([^&]+)/);
        const topicSearchMatch = search.match(/[?&](?:topic|deck)=([^&]+)/);

        if (dHashMatch && dHashMatch[1]) {
            rawCode = decodeURIComponent(dHashMatch[1]);
        } else if (dSearchMatch && dSearchMatch[1]) {
            rawCode = decodeURIComponent(dSearchMatch[1]);
        } else if (topicHashMatch && topicHashMatch[1]) {
            rawCode = decodeURIComponent(topicHashMatch[1]);
        } else if (topicSearchMatch && topicSearchMatch[1]) {
            rawCode = decodeURIComponent(topicSearchMatch[1]);
        }

        if (!rawCode) return null;
        return decodeTopicShortCode(rawCode);
    }

    /**
     * Initialize / Load Community Library
     */
    let _isLibraryLoading = false;
    let _lastOpenedDeepTopicId = null;

    async function loadCommunityLibrary(tab) {
        if (tab) state.currentTab = tab;
        renderTagsBar();
        updateTabButtonsUI();

        // Kiểm tra xem có deep link chia sẻ bộ từ không (mở ngay, không chờ feed)
        const deepTopicId = extractDeepTopicId();
        if (deepTopicId && deepTopicId !== _lastOpenedDeepTopicId) {
            _lastOpenedDeepTopicId = deepTopicId;
            setTimeout(() => {
                openThreadDetail(deepTopicId);
            }, 60);
        }

        if (_isLibraryLoading) return;
        _isLibraryLoading = true;

        try {
            // Đảm bảo HiDB đã hoàn tất khởi tạo trước khi gọi Supabase
            if (typeof HiDB !== 'undefined' && HiDB.ensureReady) {
                try { await HiDB.ensureReady(4000); } catch (e) {}
            }

            // Khởi tạo Supabase Realtime channel lắng nghe bài đăng mới
            initRealtimeSubscription();

            if (state.currentTab === 'feed') {
                await fetchPublicFeed();
            } else if (state.currentTab === 'my') {
                await fetchMyTopics();
            } else if (state.currentTab === 'liked') {
                await fetchLikedTopics();
            }
        } finally {
            _isLibraryLoading = false;
        }
    }

    /**
     * Switch Sub-tab
     */
    function switchLibraryTab(tab) {
        state.currentTab = tab;
        updateTabButtonsUI();

        const searchContainer = document.getElementById('lib-search-container');
        const tagsBar = document.getElementById('lib-tags-bar');

        if (tab === 'feed') {
            if (searchContainer) searchContainer.classList.remove('hidden');
            if (tagsBar) tagsBar.classList.remove('hidden');
            fetchPublicFeed();
        } else if (tab === 'my') {
            if (searchContainer) searchContainer.classList.add('hidden');
            if (tagsBar) tagsBar.classList.add('hidden');
            fetchMyTopics();
        } else if (tab === 'liked') {
            if (searchContainer) searchContainer.classList.add('hidden');
            if (tagsBar) tagsBar.classList.add('hidden');
            fetchLikedTopics();
        }
    }

    function updateTabButtonsUI() {
        const feedBtn = document.getElementById('lib-tab-feed');
        const myBtn = document.getElementById('lib-tab-my');
        const likedBtn = document.getElementById('lib-tab-liked');

        const activeClass = 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold shadow-xs';
        const inactiveClass = 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-semibold';

        [
            { el: feedBtn, active: state.currentTab === 'feed' },
            { el: myBtn, active: state.currentTab === 'my' },
            { el: likedBtn, active: state.currentTab === 'liked' }
        ].forEach(({ el, active }) => {
            if (!el) return;
            el.className = `px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1 ${active ? activeClass : inactiveClass}`;
        });
    }

    /**
     * Fetch Public Feed
     */
    async function fetchPublicFeed() {
        if (state.currentTab === 'feed') setLoading(true);
        try {
            if (typeof HiDB !== 'undefined' && HiDB.ensureReady) {
                await HiDB.ensureReady(4000).catch(() => {});
            }
            if (typeof HiDB !== 'undefined' && HiDB.getPublicLibraryTopics) {
                const res = await HiDB.getPublicLibraryTopics({
                    tag: state.currentTag,
                    search: state.searchQuery,
                    sort: state.sortBy
                });
                state.topics = res.topics || [];
            } else {
                state.topics = [];
            }
            if (state.currentTab === 'feed') {
                renderFeedList(state.topics);
            }
        } catch (err) {
            console.error('[Library] fetchPublicFeed error:', err);
            if (state.currentTab === 'feed') {
                if (!state._feedRetried) {
                    state._feedRetried = true;
                    setTimeout(() => fetchPublicFeed(), 1200);
                    return;
                }
                renderFeedError(err.message || 'Không thể tải thư viện. Vui lòng thử lại.');
            }
        } finally {
            if (state.currentTab === 'feed') {
                setLoading(false);
            }
        }
    }

    /**
     * Fetch My Shared Topics
     */
    async function fetchMyTopics() {
        if (state.currentTab === 'my') setLoading(true);
        try {
            let myCreatedTopics = [];
            if (typeof HiDB !== 'undefined' && HiDB.getUserCreatedTopics) {
                myCreatedTopics = await HiDB.getUserCreatedTopics();
            }
            state.myTopics = myCreatedTopics || [];
            if (state.currentTab === 'my') {
                renderMyTopicsList(state.myTopics);
            }
        } catch (err) {
            console.error('[Library] fetchMyTopics error:', err);
            if (state.currentTab === 'my') {
                renderFeedError(err.message || 'Không thể tải danh sách bộ từ của bạn.');
            }
        } finally {
            if (state.currentTab === 'my') {
                setLoading(false);
            }
        }
    }

    /**
     * Fetch Liked Topics
     */
    async function fetchLikedTopics() {
        if (state.currentTab === 'liked') setLoading(true);
        try {
            if (typeof HiDB !== 'undefined' && HiDB.getUserLikedTopics) {
                state.likedTopics = await HiDB.getUserLikedTopics();
            } else {
                state.likedTopics = [];
            }
            if (state.currentTab === 'liked') {
                renderFeedList(state.likedTopics, true);
            }
        } catch (err) {
            console.error('[Library] fetchLikedTopics error:', err);
            if (state.currentTab === 'liked') {
                renderFeedError(err.message || 'Không thể tải danh sách đã thích.');
            }
        } finally {
            if (state.currentTab === 'liked') {
                setLoading(false);
            }
        }
    }

    /**
     * Loading & Empty states
     */
    function setLoading(isLoading) {
        state.isLoading = isLoading;
        const spinner = document.getElementById('lib-loading-state');
        const list = document.getElementById('lib-feed-list');
        const empty = document.getElementById('lib-empty-state');

        if (spinner) spinner.style.display = isLoading ? 'flex' : 'none';
        if (isLoading) {
            if (empty) empty.classList.add('hidden');
            if (list) list.style.opacity = '0.4';
        } else {
            if (list) list.style.opacity = '1';
        }
    }

    function renderFeedError(msg) {
        const list = document.getElementById('lib-feed-list');
        if (!list) return;
        list.innerHTML = `
            <div class="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-6 text-center text-rose-700 dark:text-rose-300">
                <span class="material-symbols-outlined text-3xl mb-1">error</span>
                <p class="text-sm font-semibold">${esc(msg)}</p>
                <button onclick="window.loadCommunityLibrary()" class="mt-3 px-4 py-1.5 rounded-full bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors">Thử lại</button>
            </div>
        `;
    }

    /**
     * Render the list of Public Topic Cards (simplified - no word preview, no comments)
     */
    function renderFeedList(topics, isLikedView = false) {
        const list = document.getElementById('lib-feed-list');
        const empty = document.getElementById('lib-empty-state');
        if (!list) return;

        if (!topics || topics.length === 0) {
            list.innerHTML = '';
            if (empty) {
                empty.classList.remove('hidden');
                const emptyTitle = empty.querySelector('p:nth-of-type(1)');
                const emptySub = empty.querySelector('p:nth-of-type(2)');
                if (isLikedView) {
                    if (emptyTitle) emptyTitle.textContent = 'Bạn chưa thích bộ từ vựng nào';
                    if (emptySub) emptySub.textContent = 'Hãy dạo quanh Thư viện và bấm ❤️ để lưu lại những bộ từ tâm đắc!';
                } else {
                    if (emptyTitle) emptyTitle.textContent = 'Chưa có bộ từ nào được chia sẻ';
                    if (emptySub) emptySub.textContent = 'Hãy tạo bộ từ và bật công khai để chia sẻ với cộng đồng!';
                }
            }
            return;
        }

        if (empty) empty.classList.add('hidden');

        list.innerHTML = topics.map(topic => {
            const author = topic.author_name || 'Học viên HiVocab';
            const avatar = topic.author_avatar;
            const timeAgo = formatTimeAgo(topic.created_at);
            const totalWords = topic.totalWords || topic.word_count || 0;
            const tags = Array.isArray(topic.tags) ? topic.tags : [];
            const hasLiked = !!topic.hasLiked;
            const likeCount = Number(topic.like_count || 0);
            const cloneCount = Number(topic.clone_count || 0);
            const initials = author.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'HI';

            return `
                <article class="thread-item px-4 py-3.5 transition-colors hover:bg-surface-container-lowest/40 dark:hover:bg-neutral-900/40 flex gap-3 relative border-b border-outline-variant/10 last:border-0" id="thread-card-${esc(topic.id)}">
                    <!-- Left: Avatar -->
                    <div class="flex flex-col items-center shrink-0 w-9 sm:w-10">
                        <div class="relative cursor-pointer" onclick="window.openThreadDetail('${esc(topic.id)}')">
                            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center font-black text-xs shrink-0 overflow-hidden bg-cover bg-center border border-outline-variant/20 shadow-2xs"
                                 ${avatar ? `style="background-image: url('${esc(avatar)}')"` : ''}>
                                ${!avatar ? `<span>${esc(initials)}</span>` : ''}
                            </div>
                            <!-- + badge -->
                            <button type="button" onclick="window.handleThreadClone('${esc(topic.id)}', this, event)"
                                    title="Lưu bộ từ về kho"
                                    class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 flex items-center justify-center shadow-xs border-2 border-surface dark:border-black active:scale-90 transition-transform cursor-pointer">
                                <span class="material-symbols-outlined text-[13px] font-bold leading-none">add</span>
                            </button>
                        </div>
                        <!-- Thread spine -->
                        <div class="w-[2px] bg-neutral-200 dark:bg-neutral-800 rounded-full flex-1 my-2 min-h-[24px]"></div>
                        <div class="w-3 h-3 rounded-full bg-surface-container-high/60 dark:bg-neutral-800/80 border border-outline-variant/20 shrink-0"></div>
                    </div>

                    <!-- Right: Content -->
                    <div class="flex-1 min-w-0 flex flex-col gap-1.5">
                        <!-- Header row -->
                        <div class="flex items-center justify-between gap-2">
                            <div class="flex items-center gap-1.5 flex-wrap min-w-0">
                                <span class="font-bold text-sm text-on-surface hover:underline cursor-pointer truncate" onclick="window.openThreadDetail('${esc(topic.id)}')">
                                    ${esc(author)}
                                </span>
                                ${tags.length > 0 ? `
                                    <span class="text-xs text-outline shrink-0">&gt;</span>
                                    <span class="text-xs font-semibold text-primary hover:underline cursor-pointer truncate" onclick="window.filterLibraryTag('${esc(tags[0])}')">
                                        #${esc(tags[0])}
                                    </span>
                                ` : ''}
                                <span class="text-xs text-outline shrink-0">•</span>
                                <span class="text-xs text-outline shrink-0">${esc(timeAgo)}</span>
                            </div>
                            <!-- Share icon -->
                            <button type="button" onclick="window.handleThreadShare('${esc(topic.id)}', '${esc(topic.name)}', event)" class="text-outline hover:text-on-surface p-1 rounded-full cursor-pointer transition-colors shrink-0" title="Sao chép liên kết">
                                <span class="material-symbols-outlined text-[18px]">ios_share</span>
                            </button>
                        </div>

                        <!-- Deck title (clickable to open detail) -->
                        <div class="cursor-pointer" onclick="window.openThreadDetail('${esc(topic.id)}')">
                            <h3 class="text-sm sm:text-[15px] font-bold text-on-surface hover:text-primary transition-colors leading-snug">
                                ${esc(topic.name)}
                            </h3>
                            <div class="flex items-center gap-3 mt-1 text-xs text-outline">
                                <span class="flex items-center gap-1">
                                    <span class="material-symbols-outlined text-[14px] text-primary">auto_stories</span>
                                    <span>${totalWords} từ vựng</span>
                                </span>
                                ${tags.slice(1, 3).map(t => `<span class="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">#${esc(t)}</span>`).join('')}
                            </div>
                        </div>

                        <!-- Action bar: Like + Save -->
                        <div class="flex items-center justify-between pt-1.5 text-on-surface-variant select-none">
                            <div class="flex items-center gap-5">
                                <!-- Like -->
                                <button type="button" onclick="window.handleThreadLike('${esc(topic.id)}', this)"
                                        class="flex items-center gap-1 text-xs hover:text-rose-500 transition-colors cursor-pointer active:scale-90 ${hasLiked ? 'text-rose-500 font-bold' : 'text-on-surface-variant'}"
                                        data-topic-id="${esc(topic.id)}" data-liked="${hasLiked}">
                                    <span class="material-symbols-outlined text-[20px] ${hasLiked ? 'fill-1 text-rose-500' : ''}">favorite</span>
                                    <span class="like-count text-xs">${likeCount || ''}</span>
                                </button>
                                <!-- Save / Clone -->
                                <button type="button" onclick="window.handleThreadClone('${esc(topic.id)}', this, event)"
                                        class="flex items-center gap-1 text-xs hover:text-emerald-500 transition-colors cursor-pointer active:scale-90" title="Lưu về kho từ của tôi">
                                    <span class="material-symbols-outlined text-[20px]">bookmark_add</span>
                                    <span class="clone-count text-xs">${cloneCount || ''}</span>
                                </button>
                            </div>
                            <!-- Desktop quick save -->
                            <button type="button" onclick="window.handleThreadClone('${esc(topic.id)}', this, event)"
                                    class="hidden sm:flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 hover:bg-primary text-primary hover:text-on-primary font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-2xs">
                                <span class="material-symbols-outlined text-[14px]">bookmark_add</span>
                                <span>Lưu về kho</span>
                            </button>
                        </div>
                    </div>
                </article>
            `;
        }).join('');
    }

    /**
     * Render "Bộ từ của tôi" view
     */
    function renderMyTopicsList(topics) {
        const list = document.getElementById('lib-feed-list');
        const empty = document.getElementById('lib-empty-state');
        if (!list) return;

        if (!topics || topics.length === 0) {
            list.innerHTML = '';
            if (empty) {
                empty.classList.remove('hidden');
                const emptyTitle = empty.querySelector('p:nth-of-type(1)');
                const emptySub = empty.querySelector('p:nth-of-type(2)');
                if (emptyTitle) emptyTitle.textContent = 'Bạn chưa tạo bộ từ vựng nào';
                if (emptySub) emptySub.textContent = 'Hãy tạo bộ từ mới hoặc khám phá thư viện để bắt đầu học nhé!';
            }
            return;
        }

        if (empty) empty.classList.add('hidden');

        list.innerHTML = `
            <div class="bg-surface-container-low dark:bg-neutral-900/60 border border-outline-variant/20 rounded-2xl p-4 flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-2xl">public</span>
                </div>
                <div class="min-w-0 flex-1">
                    <p class="text-xs sm:text-sm font-bold text-on-surface">Bộ từ vựng cá nhân của bạn</p>
                    <p class="text-[11px] text-on-surface-variant">Gạt công tắc công khai để chia sẻ bộ từ với cộng đồng người học trên Thư viện mở.</p>
                </div>
            </div>
            ${topics.map(topic => {
                const isPublic = !!topic.is_public;
                const likes = Number(topic.like_count || 0);
                const clones = Number(topic.clone_count || 0);
                const tags = Array.isArray(topic.tags) ? topic.tags : [];

                return `
                    <div class="bg-surface rounded-2xl p-4 border border-outline-variant/20 hover:border-outline-variant/40 transition-all flex flex-col gap-3" id="my-topic-card-${esc(topic.id)}">
                        <div class="flex items-start justify-between gap-3">
                            <div class="flex items-center gap-3 min-w-0 flex-1">
                                <div class="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg shrink-0">
                                    <span class="material-symbols-outlined">${esc(topic.icon || 'auto_stories')}</span>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <h4 class="font-bold text-sm sm:text-base text-on-surface truncate">${esc(topic.name)}</h4>
                                    <div class="flex items-center gap-2 mt-0.5 text-xs text-outline">
                                        <span>${topic.word_count || 0} từ</span>
                                        <span>•</span>
                                        <span class="font-semibold topic-status-label ${isPublic ? 'text-primary' : 'text-slate-500'}">
                                            ${isPublic ? '🌐 Công khai' : '🔒 Riêng tư'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Actions: Settings-style Toggle Switch + Vào học -->
                            <div class="flex items-center gap-3 shrink-0">
                                <div class="flex items-center gap-2" title="${isPublic ? 'Đang công khai - Gạt để chuyển sang riêng tư' : 'Đang riêng tư - Gạt để công khai lên thư viện'}">
                                    <span class="text-xs font-semibold text-on-surface-variant hidden sm:inline">
                                        ${isPublic ? 'Công khai' : 'Riêng tư'}
                                    </span>
                                    <label class="relative inline-flex items-center cursor-pointer select-none">
                                        <input type="checkbox" class="sr-only peer my-topic-toggle" ${isPublic ? 'checked' : ''} onchange="window.handleTopicPublicToggle('${esc(topic.id)}', this.checked, this)">
                                        <div class="w-11 h-6 bg-outline-variant/60 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>

                                <button type="button" onclick="window._openTopic ? window._openTopic('${esc(topic.id)}') : (window.location.hash = 'topic-detail')"
                                    class="px-3 py-1.5 rounded-xl text-xs font-bold bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-colors cursor-pointer">
                                    Vào học
                                </button>
                            </div>
                        </div>

                        ${isPublic ? `
                            <div class="flex items-center justify-between gap-3 text-xs text-on-surface-variant pt-2.5 border-t border-outline-variant/10">
                                <div class="flex items-center gap-3 min-w-0">
                                    <span class="flex items-center gap-1 shrink-0"><span class="material-symbols-outlined text-[16px] text-rose-500">favorite</span> ${likes} thích</span>
                                    <span class="flex items-center gap-1 shrink-0"><span class="material-symbols-outlined text-[16px] text-primary">bookmark_add</span> ${clones} lượt lưu</span>
                                    ${tags.length > 0 ? `
                                        <div class="hidden sm:flex items-center gap-1 truncate">
                                            ${tags.slice(0, 3).map(t => `<span class="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">#${esc(t)}</span>`).join('')}
                                        </div>
                                    ` : ''}
                                </div>

                                <button type="button" onclick="window.handleThreadShare('${esc(topic.id)}', '${esc(topic.name)}', event)"
                                    class="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer shrink-0" title="Sao chép liên kết chia sẻ">
                                    <span class="material-symbols-outlined text-[16px]">share</span>
                                    <span>Chia sẻ link</span>
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('')}
        `;
    }

    /**
     * Filter Tag
     */
    function filterLibraryTag(tag) {
        state.currentTag = tag;
        renderTagsBar();
        fetchPublicFeed();
    }

    /**
     * Search Handlers
     */
    let searchDebounce = null;
    function handleLibrarySearch(val) {
        state.searchQuery = val;
        const clearBtn = document.getElementById('lib-search-clear');
        if (clearBtn) {
            clearBtn.classList.toggle('hidden', !val || !val.trim());
        }
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => {
            fetchPublicFeed();
        }, 300);
    }

    function clearLibrarySearch() {
        const input = document.getElementById('lib-search-input');
        if (input) input.value = '';
        const modalInput = document.getElementById('lib-modal-search-input');
        if (modalInput) modalInput.value = '';
        state.searchQuery = '';
        const clearBtn = document.getElementById('lib-search-clear');
        if (clearBtn) clearBtn.classList.add('hidden');
        fetchPublicFeed();
    }

    function handleLibrarySortChange(sort) {
        state.sortBy = sort;
        fetchPublicFeed();
    }

    /**
     * Search Modal (Mobile & Spotlight)
     */
    function openLibrarySearchModal() {
        const modal = document.getElementById('modal-library-search');
        const input = document.getElementById('lib-modal-search-input');
        if (!modal) return;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';

        if (input) {
            input.value = state.searchQuery || '';
            setTimeout(() => {
                input.focus();
                input.select();
            }, 100);
        }
    }

    function closeLibrarySearchModal() {
        const modal = document.getElementById('modal-library-search');
        if (!modal) return;
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = '';
    }

    function handleModalLibrarySearch(val) {
        state.searchQuery = val;
        // Đồng bộ với input tìm kiếm dạng thường trên PC nếu có
        const feedInput = document.getElementById('lib-search-input');
        if (feedInput) feedInput.value = val;
        const clearBtn = document.getElementById('lib-search-clear');
        if (clearBtn) clearBtn.classList.toggle('hidden', !val || !val.trim());

        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => {
            fetchPublicFeed();
        }, 300);
    }

    function clearModalLibrarySearch() {
        const modalInput = document.getElementById('lib-modal-search-input');
        if (modalInput) modalInput.value = '';
        clearLibrarySearch();
    }

    function handleModalQuickTag(tag) {
        closeLibrarySearchModal();
        filterLibraryTag(tag);
    }

    /**
     * Like / Unlike
     */
    async function handleThreadLike(topicId, btn) {
        if (!topicId) return;
        try {
            if (typeof HiDB === 'undefined' || !HiDB.toggleTopicLike) {
                window.showHiToast('Tính năng thả tim cần kết nối cơ sở dữ liệu.', 'error');
                return;
            }
            const res = await HiDB.toggleTopicLike(topicId);
            const isLiked = !!res.liked;

            // Update UI on all matching buttons
            const buttons = document.querySelectorAll(`button[data-topic-id="${topicId}"]`);
            buttons.forEach(b => {
                const icon = b.querySelector('.material-symbols-outlined');
                const countSpan = b.querySelector('.like-count');
                b.setAttribute('data-liked', String(isLiked));

                if (isLiked) {
                    b.classList.add('text-rose-600', 'font-bold');
                    if (icon) {
                        icon.classList.add('fill-1', 'text-rose-500');
                    }
                    if (countSpan) {
                        countSpan.textContent = res.like_count !== undefined ? res.like_count : (Number(countSpan.textContent) + 1);
                    }
                } else {
                    b.classList.remove('text-rose-600', 'font-bold');
                    if (icon) {
                        icon.classList.remove('fill-1', 'text-rose-500');
                    }
                    if (countSpan) {
                        countSpan.textContent = res.like_count !== undefined ? res.like_count : Math.max(0, Number(countSpan.textContent) - 1);
                    }
                }
            });

            if (isLiked) {
                window.showHiToast('Đã thêm vào bộ sưu tập Yêu thích ❤️', 'success');
            }
        } catch (err) {
            console.error('[Library] handleThreadLike error:', err);
            window.showHiToast(err.message || 'Vui lòng đăng nhập để thả tim!', 'error');
        }
    }

    /**
     * 1-Click Clone / Fork to Personal Vocabulary
     */
    async function handleThreadClone(topicId, btn, event) {
        if (event) event.stopPropagation();
        if (!topicId) return;

        try {
            if (typeof HiDB === 'undefined' || !HiDB.clonePublicTopic) {
                window.showHiToast('Không thể lưu lúc này.', 'error');
                return;
            }

            // Animate button
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span class="material-symbols-outlined text-[16px] animate-spin">refresh</span><span>Đang lưu...</span>';
            }

            const newTopicId = await HiDB.clonePublicTopic(topicId);

            // Update clone count on card
            const card = document.getElementById(`thread-card-${topicId}`);
            if (card) {
                const countSpan = card.querySelector('.clone-count');
                if (countSpan) {
                    const currentCount = parseInt(countSpan.textContent.replace(/\D/g, '') || '0', 10);
                    countSpan.textContent = currentCount + 1;
                }
            }

            if (btn) {
                btn.classList.remove('bg-primary/10', 'text-primary');
                btn.classList.add('bg-emerald-600', 'text-white');
                btn.innerHTML = '<span class="material-symbols-outlined text-[16px]">check</span><span>Đã lưu</span>';
            }

            window.showHiToast('Đã lưu trọn bộ từ vựng vào kho cá nhân thành công! 🎉', 'success');

            // Quick prompt to start learning immediately
            setTimeout(() => {
                if (confirm('Bộ từ đã được lưu vào kho của bạn. Bạn có muốn bắt đầu ôn tập bộ từ này ngay không?')) {
                    closeThreadDetail(false);
                    if (window._openTopic) {
                        window._openTopic(newTopicId);
                    }
                }
            }, 600);

        } catch (err) {
            console.error('[Library] handleThreadClone error:', err);
            window.showHiToast(err.message || 'Lỗi khi lưu bộ từ vựng.', 'error');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<span class="material-symbols-outlined text-[16px]">bookmark_add</span><span>Lưu về kho</span>';
            }
        }
    }

    /**
     * Share topic link with short code
     */
    function _fallbackCopyText(text) {
        try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            ta.style.top = '-9999px';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            window.showHiToast('Đã sao chép link rút gọn bộ từ vựng! 📋', 'success');
        } catch (_) {
            prompt('Sao chép liên kết bên dưới:', text);
        }
    }

    function handleThreadShare(topicId, title, event) {
        if (event) event.stopPropagation();
        const origin = window.location.origin;
        const shortCode = encodeTopicShortCode(topicId);
        const url = `${origin}/#d=${encodeURIComponent(shortCode)}`;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(() => {
                window.showHiToast('Đã sao chép link rút gọn bộ từ vựng! 📋', 'success');
            }).catch(() => {
                _fallbackCopyText(url);
            });
        } else {
            _fallbackCopyText(url);
        }
    }

    /**
     * Open Thread Chain View Modal
     */
    async function openThreadDetail(topicId) {
        const modal = document.getElementById('modal-thread-detail');
        const content = document.getElementById('thread-detail-content');
        if (!modal || !content) return;

        // Hiển thị modal ngay lập tức, nhưng CHƯA khóa cuộn trang
        // (chỉ khóa sau khi dữ liệu đã tải xong)
        content.scrollTop = 0;
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        // Hiển thị spinner trong modal - chưa khóa body scroll
        content.innerHTML = `
            <div class="flex flex-col items-center justify-center py-20 gap-3">
                <span class="material-symbols-outlined text-primary text-4xl animate-spin">refresh</span>
                <span class="text-xs text-on-surface-variant font-medium">Đang tải bộ từ vựng...</span>
            </div>
        `;

        try {
            let topicDetail = null;
            if (typeof HiDB !== 'undefined' && HiDB.getPublicTopicDetail) {
                topicDetail = await HiDB.getPublicTopicDetail(topicId);
            }
            state.activeTopicDetail = topicDetail;

            if (!topicDetail) {
                content.innerHTML = `
                    <div class="text-center py-12 flex flex-col items-center gap-3">
                        <span class="material-symbols-outlined text-4xl text-outline">menu_book</span>
                        <p class="text-on-surface font-bold text-sm">Không tìm thấy thông tin bộ từ vựng.</p>
                        <p class="text-xs text-outline">Bộ từ có thể đã bị xóa hoặc đặt ở chế độ riêng tư.</p>
                        <button type="button" onclick="window.closeThreadDetail()" class="mt-2 px-5 py-2 rounded-full bg-primary text-on-primary text-xs font-bold shadow hover:opacity-95 cursor-pointer">
                            Quay lại Thư viện
                        </button>
                    </div>
                `;
                return;
            }

            // Dữ liệu đã có → khóa cuộn trang và render
            if (typeof window.lockBodyScroll === 'function') {
                window.lockBodyScroll(true);
            } else {
                document.body.style.overflow = 'hidden';
            }
            content.scrollTop = 0;
            renderThreadChainView(topicDetail);
        } catch (err) {
            console.error('[Library] openThreadDetail error:', err);
            content.innerHTML = `
                <div class="text-center py-12 flex flex-col items-center gap-3 text-rose-600">
                    <span class="material-symbols-outlined text-4xl">error_outline</span>
                    <p class="font-bold text-sm">${esc(err.message || 'Lỗi khi tải chi tiết bộ từ.')}</p>
                    <button type="button" onclick="window.closeThreadDetail()" class="mt-2 px-5 py-2 rounded-full bg-surface-container-high text-on-surface text-xs font-bold shadow hover:bg-surface-container-highest cursor-pointer">
                        Đóng lại
                    </button>
                </div>
            `;
        }
    }

    /**
     * Render Thread Chain View with spine line
     */
    function renderThreadChainView(topic) {
        const content = document.getElementById('thread-detail-content');
        if (!content) return;

        const author = topic.author_name || 'Học viên HiVocab';
        const avatar = topic.author_avatar;
        const totalWords = topic.totalWords || topic.words?.length || 0;
        const words = topic.words || [];
        const tags = Array.isArray(topic.tags) ? topic.tags : [];
        const initials = author.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'HI';

        content.innerHTML = `
            <!-- Header info -->
            <div class="flex flex-col gap-3 pb-4 border-b border-outline-variant/15">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2.5">
                        <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0 overflow-hidden bg-cover bg-center border border-outline-variant/20"
                             ${avatar ? `style="background-image: url('${esc(avatar)}')"` : ''}>
                            ${!avatar ? `<span>${esc(initials)}</span>` : ''}
                        </div>
                        <div>
                            <div class="flex items-center gap-1.5">
                                <span class="font-bold text-sm text-on-surface">${esc(author)}</span>
                                <span class="material-symbols-outlined text-[15px] text-blue-500 fill-1">verified</span>
                            </div>
                            <span class="text-[11px] text-outline">${formatTimeAgo(topic.created_at)}</span>
                        </div>
                    </div>
                    
                    <button type="button" onclick="window.handleThreadClone('${esc(topic.id)}', this)"
                        class="px-4 py-2 rounded-full bg-primary text-on-primary font-bold text-xs shadow-md hover:bg-primary-container active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer">
                        <span class="material-symbols-outlined text-[16px]">bookmark_add</span>
                        <span>Lưu về kho (${totalWords} từ)</span>
                    </button>
                </div>

                <div>
                    <h2 class="text-xl sm:text-2xl font-black text-on-surface font-hanken tracking-tight leading-tight">
                        ${esc(topic.name)}
                    </h2>
                    ${topic.description ? `
                        <p class="text-xs sm:text-sm text-on-surface-variant mt-2 leading-relaxed whitespace-pre-line">
                            ${esc(topic.description)}
                        </p>
                    ` : ''}
                </div>

                ${tags.length > 0 ? `
                    <div class="flex flex-wrap gap-1.5 pt-1">
                        ${tags.map(t => `
                            <span class="text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">#${esc(t)}</span>
                        `).join('')}
                    </div>
                ` : ''}
            </div>

            <!-- Words List with Vertical Spine Line (Threads chain) -->
            <div class="pt-6">
                <div class="flex items-center justify-between mb-4">
                    <span class="text-xs font-bold text-outline uppercase tracking-wider">Danh sách từ vựng (${totalWords} từ)</span>
                    <span class="text-[11px] text-on-surface-variant">Bấm 🔊 để nghe phát âm</span>
                </div>

                ${words.length === 0 ? `
                    <p class="text-center text-outline py-8 text-xs">Chủ đề này chưa có từ vựng nào.</p>
                ` : `
                    <div class="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-[11px] sm:before:left-[15px] before:top-3 before:bottom-3 before:w-[2px] before:bg-outline-variant/30">
                        ${words.map((w, idx) => `
                            <div class="relative group">
                                <!-- Node dot on the spine line -->
                                <div class="absolute -left-6 sm:-left-8 top-1.5 w-[24px] sm:w-[32px] flex items-center justify-center">
                                    <div class="w-2.5 h-2.5 rounded-full bg-primary border-2 border-surface shadow-2xs group-hover:scale-125 transition-transform"></div>
                                </div>

                                <!-- Node Card -->
                                <div class="bg-surface-container-lowest hover:bg-surface-container-low/70 rounded-xl p-3.5 sm:p-4 border border-outline-variant/15 transition-all">
                                    <div class="flex items-start justify-between gap-2">
                                        <div class="flex items-center gap-2 flex-wrap">
                                            <span class="text-base sm:text-lg font-black text-on-surface font-hanken tracking-tight">${esc(w.word)}</span>
                                            ${w.phonetic ? `<span class="text-xs text-outline font-medium">/${esc(w.phonetic)}/</span>` : ''}
                                            ${(w.part_of_speech || w.pos) ? `<span class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-secondary/10 text-secondary">${esc(w.part_of_speech || w.pos)}</span>` : ''}
                                        </div>

                                        <button type="button" onclick="window.playWordAudio('${esc(w.word)}', event)"
                                            class="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors shrink-0 cursor-pointer active:scale-90" title="Nghe phát âm chuẩn">
                                            <span class="material-symbols-outlined text-[18px]">volume_up</span>
                                        </button>
                                    </div>

                                    <!-- Definition -->
                                    <p class="text-xs sm:text-sm font-semibold text-primary mt-1">
                                        ${esc(w.meaning || '—')}
                                    </p>

                                    <!-- Example sentence -->
                                    ${(w.example || w.example_sentence) ? `
                                        <div class="mt-2.5 pt-2 border-t border-outline-variant/10 text-xs">
                                            <p class="text-on-surface italic">"${esc(w.example || w.example_sentence)}"</p>
                                            ${w.example_vi ? `<p class="text-outline mt-0.5">"${esc(w.example_vi)}"</p>` : ''}
                                        </div>
                                    ` : ''}

                                    <!-- Memory Tip (if any) -->
                                    ${w.notes || w.tip ? `
                                        <div class="mt-2 bg-amber-500/10 border border-amber-500/20 text-amber-950 dark:text-amber-200 rounded-lg p-2.5 text-xs flex items-start gap-2">
                                            <span class="text-sm shrink-0">💡</span>
                                            <span class="font-medium">${esc(w.notes || w.tip)}</span>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>

            <!-- Sticky Bottom CTA -->
            <div class="sticky bottom-0 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 p-4 bg-surface/95 backdrop-blur-md border-t border-outline-variant/20 flex items-center justify-between gap-3 mt-8">
                <div class="flex items-center gap-3">
                    <button type="button" onclick="window.handleThreadLike('${esc(topic.id)}', this)"
                        class="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-rose-600 transition-colors cursor-pointer ${topic.hasLiked ? 'text-rose-600 font-bold' : ''}"
                        data-topic-id="${esc(topic.id)}" data-liked="${topic.hasLiked}">
                        <span class="material-symbols-outlined text-[20px] ${topic.hasLiked ? 'fill-1 text-rose-500' : ''}">favorite</span>
                        <span class="like-count">${topic.like_count || 0}</span>
                    </button>
                    <button type="button" onclick="window.handleThreadShare('${esc(topic.id)}', '${esc(topic.name)}', event)"
                        class="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
                        <span class="material-symbols-outlined text-[20px]">ios_share</span>
                    </button>
                </div>

                <button type="button" onclick="window.handleThreadClone('${esc(topic.id)}', this)"
                    class="px-5 py-2.5 rounded-full bg-primary text-on-primary font-bold text-xs sm:text-sm shadow-md hover:bg-surface-tint active:scale-95 transition-all flex items-center gap-2 cursor-pointer">
                    <span class="material-symbols-outlined text-[18px]">bookmark_add</span>
                    <span>Lưu trọn bộ ${totalWords} từ về kho</span>
                </button>
            </div>
        `;
    }

    function closeThreadDetail(updateHistory = true) {
        const modal = document.getElementById('modal-thread-detail');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        if (typeof window.lockBodyScroll === 'function') {
            window.lockBodyScroll(false);
        } else {
            document.body.style.overflow = '';
        }
        state.activeTopicDetail = null;
        _lastOpenedDeepTopicId = null;

        // Reset hash / search if it had d=, topic=, or deck=
        if (updateHistory) {
            const h = window.location.hash || '';
            if (h.includes('d=') || h.includes('topic=') || h.includes('deck=')) {
                try {
                    history.replaceState(null, '', window.location.pathname + '#library');
                } catch (_) {
                    window.location.hash = 'library';
                }
            }
        }
    }

    let _pendingPublishTopicId = null;
    let _pendingPublishToggleEl = null;

    const SUGGESTED_HASHTAGS = [
        'IELTS', 'TOEIC', 'Giao tiếp', 'Cam19', 'SAT', 'Collocations', 
        'Idioms', 'Từ vựng C1-C2', 'THPT Quốc Gia', 'Oxford 3000', 'B1-B2'
    ];

    /**
     * Handle switch toggle in "Bộ từ của tôi" (Direct instant toggle)
     */
    async function handleTopicPublicToggle(topicId, isChecked, toggleEl) {
        if (!topicId) return;

        if (toggleEl) toggleEl.disabled = true;

        const card = document.getElementById(`my-topic-card-${topicId}`);
        const statusLabel = card ? card.querySelector('.topic-status-label') : null;
        const toggleText = toggleEl ? toggleEl.closest('div')?.querySelector('span') : null;

        // Optimistic UI update
        if (statusLabel) {
            statusLabel.textContent = isChecked ? '🌐 Công khai' : '🔒 Riêng tư';
            statusLabel.className = `font-semibold topic-status-label ${isChecked ? 'text-primary' : 'text-slate-500'}`;
        }
        if (toggleText) {
            toggleText.textContent = isChecked ? 'Công khai' : 'Riêng tư';
        }

        try {
            if (isChecked) {
                if (typeof HiDB !== 'undefined' && HiDB.publishTopic) {
                    await HiDB.publishTopic({ topicId });
                }
                window.showHiToast('Đã công khai bộ từ vựng lên Thư viện! 🎉', 'success');
            } else {
                if (typeof HiDB !== 'undefined' && HiDB.unpublishTopic) {
                    await HiDB.unpublishTopic(topicId);
                }
                window.showHiToast('Đã chuyển bộ từ về trạng thái Riêng tư.', 'success');
            }

            // Cập nhật trạng thái trong state.myTopics
            const topic = (state.myTopics || []).find(t => String(t.id) === String(topicId));
            if (topic) {
                topic.is_public = isChecked;
            }

            // Xóa cache feed công cộng để khi user chuyển tab "Khám phá" sẽ tải lại dữ liệu mới nhất
            state.topics = [];

            // Re-render danh sách "Bộ từ của tôi" để hiển thị/ẩn thanh action công khai (chia sẻ link)
            if (state.currentTab === 'my') {
                renderMyTopicsList(state.myTopics);
            }

        } catch (err) {
            console.error('[handleTopicPublicToggle] error:', err);
            // Revert lại trạng thái cũ nếu lỗi
            if (toggleEl) toggleEl.checked = !isChecked;
            if (statusLabel) {
                statusLabel.textContent = !isChecked ? '🌐 Công khai' : '🔒 Riêng tư';
                statusLabel.className = `font-semibold topic-status-label ${!isChecked ? 'text-primary' : 'text-slate-500'}`;
            }
            if (toggleText) {
                toggleText.textContent = !isChecked ? 'Công khai' : 'Riêng tư';
            }
            window.showHiToast(err.message || 'Không thể thay đổi trạng thái bộ từ lúc này.', 'error');
        } finally {
            if (toggleEl) toggleEl.disabled = false;
        }
    }

    /**
     * Open Hashtag Picker Modal for publishing
     */
    function openHashtagModal(topicId) {
        const modal = document.getElementById('modal-hashtag-publish');
        if (!modal) return;

        _pendingPublishTopicId = topicId;
        const topic = (state.myTopics || []).find(t => String(t.id) === String(topicId));
        const namePreview = document.getElementById('pub-topic-name-preview');
        const pillsContainer = document.getElementById('pub-hashtag-pills');
        const tagsInput = document.getElementById('pub-tags-input');
        const descInput = document.getElementById('pub-desc-input');

        if (namePreview) {
            namePreview.textContent = topic ? topic.name : 'Bộ từ vựng';
        }

        const existingTags = Array.isArray(topic?.tags) ? topic.tags : [];
        if (tagsInput) {
            tagsInput.value = existingTags.join(', ');
        }
        if (descInput) {
            descInput.value = topic?.description || '';
        }

        if (pillsContainer) {
            const currentTagsSet = new Set(existingTags.map(t => t.toLowerCase()));
            pillsContainer.innerHTML = SUGGESTED_HASHTAGS.map(tag => {
                const isSelected = currentTagsSet.has(tag.toLowerCase());
                return `
                    <button type="button" onclick="window.toggleHashtagPill('${esc(tag)}', this)"
                        class="hashtag-pill px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                            isSelected 
                            ? 'bg-primary text-on-primary border-primary' 
                            : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant border-outline-variant/30'
                        }">
                        #${esc(tag)}
                    </button>
                `;
            }).join('');
        }

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Toggle Pill click in Hashtag Modal
     */
    function toggleHashtagPill(tag, btn) {
        const input = document.getElementById('pub-tags-input');
        if (!input) return;

        let currentTags = input.value.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);
        const lowerTag = tag.toLowerCase();
        const index = currentTags.findIndex(t => t.toLowerCase() === lowerTag);

        if (index >= 0) {
            currentTags.splice(index, 1);
            if (btn) {
                btn.className = 'hashtag-pill px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer bg-surface-container hover:bg-surface-container-high text-on-surface-variant border-outline-variant/30';
            }
        } else {
            currentTags.push(tag);
            if (btn) {
                btn.className = 'hashtag-pill px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer bg-primary text-on-primary border-primary';
            }
        }
        input.value = currentTags.join(', ');
    }

    /**
     * Cancel Hashtag Modal
     */
    function cancelHashtagModal() {
        const modal = document.getElementById('modal-hashtag-publish');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        document.body.style.overflow = '';
        if (_pendingPublishToggleEl) {
            _pendingPublishToggleEl.checked = false;
        }
        _pendingPublishTopicId = null;
        _pendingPublishToggleEl = null;
    }

    /**
     * Confirm Hashtag Publish
     */
    async function confirmHashtagPublish() {
        if (!_pendingPublishTopicId) {
            cancelHashtagModal();
            return;
        }

        const tagsInput = document.getElementById('pub-tags-input');
        const descInput = document.getElementById('pub-desc-input');
        const confirmBtn = document.getElementById('pub-confirm-btn');

        const tagsStr = tagsInput?.value || '';
        const description = descInput?.value || '';
        const tags = tagsStr.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);

        try {
            if (confirmBtn) {
                confirmBtn.disabled = true;
                confirmBtn.innerHTML = '<span class="material-symbols-outlined text-base animate-spin">refresh</span><span>Đang xử lý...</span>';
            }

            if (typeof HiDB !== 'undefined' && HiDB.publishTopic) {
                await HiDB.publishTopic({
                    topicId: _pendingPublishTopicId,
                    description,
                    tags
                });
            }

            window.showHiToast('Đã công khai bộ từ vựng lên Thư viện thành công! 🎉', 'success');

            if (_pendingPublishToggleEl) {
                _pendingPublishToggleEl.checked = true;
            }

            const modal = document.getElementById('modal-hashtag-publish');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
            document.body.style.overflow = '';
            _pendingPublishTopicId = null;
            _pendingPublishToggleEl = null;

            // Refresh list
            await fetchMyTopics();

        } catch (err) {
            console.error('[confirmHashtagPublish] error:', err);
            window.showHiToast(err.message || 'Lỗi khi công khai bộ từ.', 'error');
        } finally {
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = '<span>Xác nhận công khai</span><span class="material-symbols-outlined text-base">check</span>';
            }
        }
    }

    /**
     * Unpublish Topic
     */
    async function handleUnpublishTopic(topicId, toggleEl) {
        try {
            if (typeof HiDB !== 'undefined' && HiDB.unpublishTopic) {
                await HiDB.unpublishTopic(topicId);
            }
            window.showHiToast('Đã chuyển bộ từ về trạng thái Riêng tư.', 'success');
            if (toggleEl) {
                toggleEl.checked = false;
            }
            await fetchMyTopics();
        } catch (err) {
            console.error('[handleUnpublishTopic] error:', err);
            window.showHiToast(err.message || 'Lỗi khi chuyển trạng thái riêng tư.', 'error');
            if (toggleEl) {
                toggleEl.checked = true;
            }
        }
    }

    // Compatibility aliases
    function openComposeThreadModal(preselectedTopicId = null) {
        if (preselectedTopicId) openHashtagModal(preselectedTopicId);
        else {
            switchLibraryTab('my');
            window.showHiToast('Gạt công tắc Công khai tại bộ từ bạn muốn chia sẻ nhé!', 'info');
        }
    }
    function closeComposeThreadModal() { cancelHashtagModal(); }
    function submitComposeThread() { confirmHashtagPublish(); }
    function handlePublishUserTopic(topicId) { openHashtagModal(topicId); }

    /**
     * Comments Drawer & Logic
     */
    async function openThreadComments(topicId, topicTitle, event) {
        if (event) event.stopPropagation();
        const modal = document.getElementById('modal-thread-comments');
        const titleEl = document.getElementById('thread-comments-title');
        const listEl = document.getElementById('thread-comments-list');
        if (!modal || !listEl) return;

        state.activeCommentsTopicId = topicId;
        state.activeCommentsTopicTitle = topicTitle || '';

        if (titleEl) titleEl.textContent = topicTitle ? `Bình luận: ${topicTitle}` : 'Bình luận & Mẹo học';

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';

        listEl.innerHTML = `
            <div class="flex items-center justify-center py-12">
                <span class="material-symbols-outlined text-primary text-3xl animate-spin">refresh</span>
            </div>
        `;

        try {
            let comments = [];
            if (typeof HiDB !== 'undefined' && HiDB.getTopicComments) {
                comments = await HiDB.getTopicComments(topicId);
            }
            renderCommentsList(comments);
        } catch (err) {
            console.error('[openThreadComments] error:', err);
            listEl.innerHTML = `<p class="text-center text-rose-500 py-8 text-xs font-semibold">${esc(err.message || 'Lỗi tải bình luận')}</p>`;
        }
    }

    function renderCommentsList(comments) {
        const listEl = document.getElementById('thread-comments-list');
        if (!listEl) return;

        if (!comments || comments.length === 0) {
            listEl.innerHTML = `
                <div class="text-center py-12 text-outline">
                    <span class="material-symbols-outlined text-3xl mb-1 opacity-50">forum</span>
                    <p class="text-xs font-semibold">Chưa có bình luận nào</p>
                    <p class="text-[11px] text-outline mt-0.5">Hãy là người đầu tiên để lại mẹo nhớ hoặc cảm nghĩ!</p>
                </div>
            `;
            return;
        }

        listEl.innerHTML = comments.map(c => {
            const author = c.user_name || 'Học viên';
            const avatar = c.user_avatar;
            const initials = author.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'HV';
            const timeAgo = formatTimeAgo(c.created_at);

            return `
                <div class="flex items-start gap-3 py-3 border-b border-outline-variant/10 last:border-0">
                    <div class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden bg-cover bg-center"
                         ${avatar ? `style="background-image: url('${esc(avatar)}')"` : ''}>
                        ${!avatar ? `<span>${esc(initials)}</span>` : ''}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-baseline justify-between gap-2">
                            <span class="font-bold text-xs text-on-surface">${esc(author)}</span>
                            <span class="text-[10px] text-outline">${esc(timeAgo)}</span>
                        </div>
                        <p class="text-xs text-on-surface-variant mt-1 whitespace-pre-line leading-relaxed">${esc(c.content)}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    function closeThreadComments() {
        const modal = document.getElementById('modal-thread-comments');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        document.body.style.overflow = '';
        state.activeCommentsTopicId = null;
    }

    async function submitThreadComment() {
        const input = document.getElementById('thread-comment-input');
        const submitBtn = document.getElementById('thread-comment-submit');
        const content = input?.value?.trim();
        const topicId = state.activeCommentsTopicId;

        if (!topicId || !content) return;

        try {
            if (submitBtn) submitBtn.disabled = true;
            if (typeof HiDB !== 'undefined' && HiDB.addTopicComment) {
                await HiDB.addTopicComment({
                    topicId,
                    content
                });
            }

            if (input) input.value = '';
            window.showHiToast('Đã đăng bình luận!', 'success');

            // Refresh comments list
            const comments = await HiDB.getTopicComments(topicId);
            renderCommentsList(comments);

            // Update comment count on card in feed if present
            const card = document.getElementById(`thread-card-${topicId}`);
            if (card) {
                const commentBtn = card.querySelector('button[onclick*="openThreadComments"] span:nth-of-type(2)');
                if (commentBtn) {
                    commentBtn.textContent = comments.length;
                }
            }

        } catch (err) {
            console.error('[submitThreadComment] error:', err);
            window.showHiToast(err.message || 'Lỗi khi gửi bình luận.', 'error');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    }

    /**
     * Toggle Mobile Search Container
     */
    function toggleLibrarySearchMobile() {
        const searchContainer = document.getElementById('lib-search-container');
        if (!searchContainer) return;
        const isHidden = searchContainer.classList.contains('hidden');
        if (isHidden) {
            searchContainer.classList.remove('hidden');
            const input = document.getElementById('lib-search-input');
            if (input) input.focus();
        } else {
            searchContainer.classList.add('hidden');
        }
    }

    // Expose functions globally to window
    window.loadCommunityLibrary        = loadCommunityLibrary;
    window.switchLibraryTab           = switchLibraryTab;
    window.filterLibraryTag           = filterLibraryTag;
    window.handleLibrarySearch        = handleLibrarySearch;
    window.clearLibrarySearch         = clearLibrarySearch;
    window.handleLibrarySortChange    = handleLibrarySortChange;
    window.handleThreadLike           = handleThreadLike;
    window.handleThreadClone          = handleThreadClone;
    window.handleThreadShare          = handleThreadShare;
    window.openThreadDetail           = openThreadDetail;
    window.closeThreadDetail          = closeThreadDetail;
    window.encodeTopicShortCode       = encodeTopicShortCode;
    window.decodeTopicShortCode       = decodeTopicShortCode;
    window.extractDeepTopicId         = extractDeepTopicId;
    window.handleTopicPublicToggle    = handleTopicPublicToggle;
    window.openHashtagModal           = openHashtagModal;
    window.toggleHashtagPill          = toggleHashtagPill;
    window.cancelHashtagModal         = cancelHashtagModal;
    window.confirmHashtagPublish      = confirmHashtagPublish;
    window.openComposeThreadModal     = openComposeThreadModal;
    window.closeComposeThreadModal    = closeComposeThreadModal;
    window.submitComposeThread        = submitComposeThread;
    window.handlePublishUserTopic     = handlePublishUserTopic;
    window.handleUnpublishTopic       = handleUnpublishTopic;
    window.openThreadComments         = openThreadComments;
    window.closeThreadComments        = closeThreadComments;
    window.submitThreadComment        = submitThreadComment;
    window.playWordAudio              = playWordAudio;
    window.toggleLibrarySearchMobile  = openLibrarySearchModal;
    window.openLibrarySearchModal     = openLibrarySearchModal;
    window.closeLibrarySearchModal    = closeLibrarySearchModal;
    window.handleModalLibrarySearch   = handleModalLibrarySearch;
    window.clearModalLibrarySearch    = clearModalLibrarySearch;
    window.handleModalQuickTag        = handleModalQuickTag;

    // Lắng nghe phím Escape để đóng modal chi tiết bộ từ
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const detailModal = document.getElementById('modal-thread-detail');
            if (detailModal && !detailModal.classList.contains('hidden')) {
                closeThreadDetail();
            }
        }
    });

    // Tự động kiểm tra và khởi tạo khi người dùng đang ở trang hoặc hash library hoặc có link chia sẻ
    function checkAutoInit() {
        const hash = window.location.hash || '';
        const search = window.location.search || '';
        const pageEl = document.getElementById('page-library');
        const isLibraryActive = (pageEl && pageEl.classList.contains('active')) || 
                                hash.includes('library') || 
                                hash.includes('d=') || 
                                search.includes('topic=') || 
                                search.includes('deck=') || 
                                search.includes('d=');
        if (isLibraryActive) {
            setTimeout(() => {
                loadCommunityLibrary();
            }, 60);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAutoInit);
    } else {
        checkAutoInit();
    }

    window.addEventListener('hashchange', () => {
        const hash = window.location.hash || '';
        if (hash.includes('library') || hash.includes('d=')) {
            loadCommunityLibrary();
        }
    });

})();
