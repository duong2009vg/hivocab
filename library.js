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
        if (!word || !window.speechSynthesis) return;
        try {
            window.speechSynthesis.cancel();
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
     * Initialize / Load Community Library
     */
    async function loadCommunityLibrary(tab) {
        if (tab) state.currentTab = tab;
        renderTagsBar();
        updateTabButtonsUI();

        // Update profile avatar on quick compose
        try {
            if (typeof HiDB !== 'undefined' && HiDB.getCurrentUser) {
                const user = await HiDB.getCurrentUser();
                const avatarEl = document.getElementById('lib-quick-avatar');
                if (avatarEl && user?.user_metadata?.avatar_url) {
                    avatarEl.style.backgroundImage = `url('${user.user_metadata.avatar_url}')`;
                    avatarEl.innerHTML = '';
                }
            }
        } catch (e) {}

        if (state.currentTab === 'feed') {
            await fetchPublicFeed();
        } else if (state.currentTab === 'my') {
            await fetchMyTopics();
        } else if (state.currentTab === 'liked') {
            await fetchLikedTopics();
        }

        // Kiểm tra deep link chia sẻ #library?topic=UUID
        const hash = window.location.hash || '';
        if (hash.includes('topic=')) {
            const match = hash.match(/topic=([^&]+)/);
            if (match && match[1]) {
                setTimeout(() => openThreadDetail(match[1]), 300);
            }
        }
    }

    /**
     * Switch Sub-tab
     */
    function switchLibraryTab(tab) {
        if (state.currentTab === tab) return;
        state.currentTab = tab;
        updateTabButtonsUI();

        const searchContainer = document.getElementById('lib-search-container');
        const tagsBar = document.getElementById('lib-tags-bar');
        const quickCompose = document.getElementById('lib-quick-compose');

        if (tab === 'feed') {
            if (searchContainer) searchContainer.classList.remove('hidden');
            if (tagsBar) tagsBar.classList.remove('hidden');
            if (quickCompose) quickCompose.classList.remove('hidden');
            fetchPublicFeed();
        } else if (tab === 'my') {
            if (searchContainer) searchContainer.classList.add('hidden');
            if (tagsBar) tagsBar.classList.add('hidden');
            if (quickCompose) quickCompose.classList.remove('hidden');
            fetchMyTopics();
        } else if (tab === 'liked') {
            if (searchContainer) searchContainer.classList.add('hidden');
            if (tagsBar) tagsBar.classList.add('hidden');
            if (quickCompose) quickCompose.classList.add('hidden');
            fetchLikedTopics();
        }
    }

    function updateTabButtonsUI() {
        const feedBtn = document.getElementById('lib-tab-feed');
        const myBtn = document.getElementById('lib-tab-my');
        const likedBtn = document.getElementById('lib-tab-liked');

        const activeClass = 'bg-primary text-on-primary font-bold shadow-xs';
        const inactiveClass = 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-semibold';

        [
            { el: feedBtn, active: state.currentTab === 'feed' },
            { el: myBtn, active: state.currentTab === 'my' },
            { el: likedBtn, active: state.currentTab === 'liked' }
        ].forEach(({ el, active }) => {
            if (!el) return;
            el.className = `px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1 ${active ? activeClass : inactiveClass}`;
        });
    }

    /**
     * Fetch Public Feed
     */
    async function fetchPublicFeed() {
        setLoading(true);
        try {
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
            renderFeedList(state.topics);
        } catch (err) {
            console.error('[Library] fetchPublicFeed error:', err);
            renderFeedError(err.message || 'Không thể tải thư viện. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }

    /**
     * Fetch My Shared Topics
     */
    async function fetchMyTopics() {
        setLoading(true);
        try {
            let allTopics = [];
            if (typeof HiDB !== 'undefined' && HiDB.getTopics) {
                allTopics = await HiDB.getTopics();
            }
            state.myTopics = allTopics || [];
            renderMyTopicsList(state.myTopics);
        } catch (err) {
            console.error('[Library] fetchMyTopics error:', err);
            renderFeedError(err.message || 'Không thể tải danh sách bộ từ.');
        } finally {
            setLoading(false);
        }
    }

    /**
     * Fetch Liked Topics
     */
    async function fetchLikedTopics() {
        setLoading(true);
        try {
            if (typeof HiDB !== 'undefined' && HiDB.getUserLikedTopics) {
                state.likedTopics = await HiDB.getUserLikedTopics();
            } else {
                state.likedTopics = [];
            }
            renderFeedList(state.likedTopics, true);
        } catch (err) {
            console.error('[Library] fetchLikedTopics error:', err);
            renderFeedError(err.message || 'Không thể tải danh sách đã thích.');
        } finally {
            setLoading(false);
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
     * Render the list of Public Topic Cards (Threads style)
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
                    if (emptyTitle) emptyTitle.textContent = 'Không tìm thấy bộ từ nào';
                    if (emptySub) emptySub.textContent = 'Thử đổi từ khóa tìm kiếm hoặc chọn tag khác xem nhé!';
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
            const sneakPeeks = topic.sneakPeekWords || [];
            const tags = Array.isArray(topic.tags) ? topic.tags : [];
            const hasLiked = !!topic.hasLiked;
            const likeCount = Number(topic.like_count || 0);
            const cloneCount = Number(topic.clone_count || 0);
            const commentCount = Number(topic.comment_count || 0);

            // Initials fallback
            const initials = author.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'HI';

            return `
                <article class="bg-surface rounded-2xl p-4 sm:p-5 border border-outline-variant/20 hover:border-outline-variant/40 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col gap-3 group" id="thread-card-${esc(topic.id)}">
                    <!-- Author header -->
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2.5">
                            <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0 overflow-hidden bg-cover bg-center border border-outline-variant/20"
                                 ${avatar ? `style="background-image: url('${esc(avatar)}')"` : ''}>
                                ${!avatar ? `<span>${esc(initials)}</span>` : ''}
                            </div>
                            <div class="flex flex-col">
                                <div class="flex items-center gap-1.5">
                                    <span class="font-bold text-sm text-on-surface">${esc(author)}</span>
                                    <span class="material-symbols-outlined text-[15px] text-blue-500 fill-1" title="Tác giả uy tín">verified</span>
                                </div>
                                <span class="text-[11px] text-outline">${esc(timeAgo)} • Thư viện mở</span>
                            </div>
                        </div>
                        
                        <!-- Word count badge -->
                        <div class="px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-[11px] font-bold flex items-center gap-1 shrink-0">
                            <span class="material-symbols-outlined text-[14px] text-primary">auto_stories</span>
                            <span>${totalWords} từ</span>
                        </div>
                    </div>

                    <!-- Topic Title & Description -->
                    <div class="cursor-pointer" onclick="window.openThreadDetail('${esc(topic.id)}')">
                        <h3 class="text-base sm:text-lg font-bold text-on-surface group-hover:text-primary transition-colors leading-snug">
                            ${esc(topic.name)}
                        </h3>
                        ${topic.description ? `
                            <p class="text-xs sm:text-sm text-on-surface-variant mt-1.5 line-clamp-3 leading-relaxed whitespace-pre-line">
                                ${esc(topic.description)}
                            </p>
                        ` : ''}
                    </div>

                    <!-- Tags -->
                    ${tags.length > 0 ? `
                        <div class="flex flex-wrap gap-1.5 pt-0.5">
                            ${tags.map(t => `
                                <button type="button" onclick="window.filterLibraryTag('${esc(t)}')"
                                    class="text-[11px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-0.5 rounded-full transition-colors">
                                    #${esc(t)}
                                </button>
                            `).join('')}
                        </div>
                    ` : ''}

                    <!-- Sneak Peek Words Box (Threads Chain preview) -->
                    ${sneakPeeks.length > 0 ? `
                        <div onclick="window.openThreadDetail('${esc(topic.id)}')"
                            class="bg-surface-container-lowest hover:bg-surface-container-low/80 rounded-xl p-3 sm:p-3.5 border border-outline-variant/15 transition-colors cursor-pointer flex flex-col gap-2">
                            <div class="flex items-center justify-between text-[11px] font-bold text-outline uppercase tracking-wider">
                                <span>Xem trước từ vựng</span>
                                <span class="text-primary hover:underline flex items-center gap-0.5">Xem toàn bộ ${totalWords} từ →</span>
                            </div>
                            <div class="flex flex-col gap-1.5 divide-y divide-outline-variant/10">
                                ${sneakPeeks.map(w => `
                                    <div class="pt-1.5 first:pt-0 flex items-center justify-between gap-2 text-xs">
                                        <div class="flex items-center gap-2 min-w-0">
                                            <button type="button" onclick="window.playWordAudio('${esc(w.word)}', event)"
                                                class="w-6 h-6 rounded-full bg-surface-container-high hover:bg-primary/20 hover:text-primary flex items-center justify-center text-outline transition-colors shrink-0" title="Phát âm">
                                                <span class="material-symbols-outlined text-[13px]">volume_up</span>
                                            </button>
                                            <span class="font-bold text-on-surface truncate">${esc(w.word)}</span>
                                            ${w.phonetic ? `<span class="text-[11px] text-outline font-normal hidden sm:inline">${esc(w.phonetic)}</span>` : ''}
                                        </div>
                                        <span class="text-[11px] text-on-surface-variant font-medium truncate text-right max-w-[200px]">${esc(w.meaning || '—')}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- Action Bar (Threads style) -->
                    <div class="flex items-center justify-between pt-1 border-t border-outline-variant/15 text-on-surface-variant">
                        <div class="flex items-center gap-4 sm:gap-6">
                            <!-- Like button -->
                            <button type="button" onclick="window.handleThreadLike('${esc(topic.id)}', this)"
                                class="flex items-center gap-1.5 text-xs font-semibold hover:text-rose-600 transition-colors cursor-pointer active:scale-95 ${hasLiked ? 'text-rose-600 font-bold' : ''}"
                                data-topic-id="${esc(topic.id)}" data-liked="${hasLiked}">
                                <span class="material-symbols-outlined text-[19px] ${hasLiked ? 'fill-1 text-rose-500' : ''}">favorite</span>
                                <span class="like-count">${likeCount}</span>
                            </button>

                            <!-- Comment button -->
                            <button type="button" onclick="window.openThreadComments('${esc(topic.id)}', '${esc(topic.name)}', event)"
                                class="flex items-center gap-1.5 text-xs font-semibold hover:text-primary transition-colors cursor-pointer active:scale-95">
                                <span class="material-symbols-outlined text-[19px]">chat_bubble</span>
                                <span>${commentCount}</span>
                            </button>

                            <!-- Share button -->
                            <button type="button" onclick="window.handleThreadShare('${esc(topic.id)}', '${esc(topic.name)}', event)"
                                class="flex items-center gap-1.5 text-xs font-semibold hover:text-primary transition-colors cursor-pointer active:scale-95" title="Chia sẻ liên kết">
                                <span class="material-symbols-outlined text-[19px]">share</span>
                            </button>
                        </div>

                        <!-- Clone / Lưu về kho Button -->
                        <button type="button" onclick="window.handleThreadClone('${esc(topic.id)}', this, event)"
                            class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary text-primary hover:text-on-primary font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-2xs">
                            <span class="material-symbols-outlined text-[16px]">bookmark_add</span>
                            <span>Lưu về kho</span>
                            <span class="clone-count opacity-75 font-normal">(${cloneCount})</span>
                        </button>
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
            <div class="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                    <span class="material-symbols-outlined text-primary text-2xl">public</span>
                    <div class="min-w-0">
                        <p class="text-xs sm:text-sm font-bold text-on-surface">Chia sẻ kiến thức cùng cộng đồng</p>
                        <p class="text-[11px] text-on-surface-variant truncate">Đưa các bộ từ vựng tâm đắc của bạn lên thư viện mở của HiVocab.</p>
                    </div>
                </div>
                <button onclick="window.openComposeThreadModal()" class="px-3.5 py-1.5 rounded-full bg-primary text-on-primary font-bold text-xs shrink-0 active:scale-95 shadow-xs">
                    + Chia sẻ ngay
                </button>
            </div>
            ${topics.map(topic => {
                const isPublic = !!topic.is_public;
                const likes = Number(topic.like_count || 0);
                const clones = Number(topic.clone_count || 0);

                return `
                    <div class="bg-surface rounded-2xl p-4 border border-outline-variant/20 hover:border-outline-variant/40 transition-all flex flex-col gap-3">
                        <div class="flex items-start justify-between gap-2">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-base shrink-0">
                                    <span class="material-symbols-outlined">${esc(topic.icon || 'auto_stories')}</span>
                                </div>
                                <div>
                                    <h4 class="font-bold text-sm sm:text-base text-on-surface">${esc(topic.name)}</h4>
                                    <div class="flex items-center gap-2 mt-0.5 text-xs text-outline">
                                        <span>${topic.word_count || 0} từ</span>
                                        <span>•</span>
                                        <span class="font-semibold ${isPublic ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}">
                                            ${isPublic ? '🌐 Công khai trên Thư viện' : '🔒 Riêng tư'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="flex items-center gap-1.5 shrink-0">
                                ${isPublic ? `
                                    <button type="button" onclick="window.handleUnpublishTopic('${esc(topic.id)}')"
                                        class="px-2.5 py-1 rounded-full text-xs font-bold text-outline hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors border border-outline-variant/30">
                                        Thu hồi
                                    </button>
                                ` : `
                                    <button type="button" onclick="window.handlePublishUserTopic('${esc(topic.id)}')"
                                        class="px-3 py-1 rounded-full text-xs font-bold text-primary hover:bg-primary/10 transition-colors border border-primary/30">
                                        Chia sẻ
                                    </button>
                                `}
                                <button type="button" onclick="window._openTopic('${esc(topic.id)}')"
                                    class="px-3 py-1 rounded-full text-xs font-bold bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-colors">
                                    Vào học
                                </button>
                            </div>
                        </div>

                        ${isPublic ? `
                            <div class="flex items-center gap-4 text-xs text-on-surface-variant pt-2 border-t border-outline-variant/10">
                                <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px] text-rose-500">favorite</span> ${likes} lượt thích</span>
                                <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px] text-primary">bookmark_add</span> ${clones} lượt lưu về</span>
                                ${topic.description ? `<p class="text-[11px] text-outline truncate flex-1 ml-2">"${esc(topic.description)}"</p>` : ''}
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
                    countSpan.textContent = `(${currentCount + 1})`;
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
     * Share topic link
     */
    function handleThreadShare(topicId, title, event) {
        if (event) event.stopPropagation();
        const url = `${window.location.origin}${window.location.pathname}#library?topic=${topicId}`;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(() => {
                window.showHiToast('Đã sao chép liên kết bộ từ vựng! 📋', 'success');
            }).catch(() => {
                window.showHiToast(`Liên kết: ${url}`, 'info');
            });
        } else {
            window.showHiToast(`Liên kết: ${url}`, 'info');
        }
    }

    /**
     * Open Thread Chain View Modal
     */
    async function openThreadDetail(topicId) {
        const modal = document.getElementById('modal-thread-detail');
        const content = document.getElementById('thread-detail-content');
        if (!modal || !content) return;

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';

        content.innerHTML = `
            <div class="flex items-center justify-center py-20">
                <span class="material-symbols-outlined text-primary text-4xl animate-spin">refresh</span>
            </div>
        `;

        try {
            let topicDetail = null;
            if (typeof HiDB !== 'undefined' && HiDB.getPublicTopicDetail) {
                topicDetail = await HiDB.getPublicTopicDetail(topicId);
            }
            state.activeTopicDetail = topicDetail;

            if (!topicDetail) {
                content.innerHTML = `<p class="text-center text-outline py-12">Không tìm thấy thông tin bộ từ vựng.</p>`;
                return;
            }

            renderThreadChainView(topicDetail);
        } catch (err) {
            console.error('[Library] openThreadDetail error:', err);
            content.innerHTML = `
                <div class="text-center py-12 text-rose-600">
                    <p class="font-bold text-sm">${esc(err.message || 'Lỗi khi tải chi tiết bộ từ.')}</p>
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
                                            ${w.part_of_speech ? `<span class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-secondary/10 text-secondary">${esc(w.part_of_speech)}</span>` : ''}
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
                                    ${w.example ? `
                                        <div class="mt-2.5 pt-2 border-t border-outline-variant/10 text-xs">
                                            <p class="text-on-surface italic">"${esc(w.example)}"</p>
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
                    <button type="button" onclick="window.openThreadComments('${esc(topic.id)}', '${esc(topic.name)}', event)"
                        class="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
                        <span class="material-symbols-outlined text-[20px]">chat_bubble</span>
                        <span>${topic.comment_count || 0}</span>
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

    function closeThreadDetail() {
        const modal = document.getElementById('modal-thread-detail');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        document.body.style.overflow = '';
        state.activeTopicDetail = null;
    }

    /**
     * Compose / Share Topic Modal
     */
    async function openComposeThreadModal(preselectedTopicId = null) {
        const modal = document.getElementById('modal-compose-thread');
        const select = document.getElementById('compose-topic-select');
        if (!modal || !select) return;

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';

        // Populate user topics
        select.innerHTML = '<option value="">Đang tải danh sách chủ đề của bạn...</option>';
        try {
            let topics = [];
            if (typeof HiDB !== 'undefined' && HiDB.getTopics) {
                topics = await HiDB.getTopics();
            }
            if (!topics || topics.length === 0) {
                select.innerHTML = '<option value="">(Bạn chưa có bộ từ vựng nào - hãy tạo ở tab Chủ đề)</option>';
            } else {
                select.innerHTML = topics.map(t => `
                    <option value="${esc(t.id)}" ${t.id === preselectedTopicId ? 'selected' : ''}>
                        ${esc(t.name)} (${t.word_count || 0} từ) ${t.is_public ? '— [Đã chia sẻ]' : ''}
                    </option>
                `).join('');
            }
        } catch (err) {
            console.error('[openComposeThreadModal] error:', err);
            select.innerHTML = '<option value="">Lỗi tải danh sách chủ đề</option>';
        }
    }

    function closeComposeThreadModal() {
        const modal = document.getElementById('modal-compose-thread');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        document.body.style.overflow = '';
    }

    async function submitComposeThread() {
        const select = document.getElementById('compose-topic-select');
        const descInput = document.getElementById('compose-desc-input');
        const tagsInput = document.getElementById('compose-tags-input');
        const submitBtn = document.getElementById('compose-submit-btn');

        const topicId = select?.value;
        const description = descInput?.value || '';
        const tagsStr = tagsInput?.value || '';

        if (!topicId) {
            window.showHiToast('Vui lòng chọn một bộ từ vựng để chia sẻ!', 'error');
            return;
        }

        const tags = tagsStr.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);

        try {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="material-symbols-outlined text-[16px] animate-spin">refresh</span><span>Đang đăng...</span>';
            }

            if (typeof HiDB !== 'undefined' && HiDB.publishTopic) {
                await HiDB.publishTopic({
                    topicId,
                    description,
                    tags
                });
            }

            window.showHiToast('Đã đăng bộ từ vựng lên Thư viện thành công! 🚀', 'success');
            closeComposeThreadModal();

            // Reset form
            if (descInput) descInput.value = '';
            if (tagsInput) tagsInput.value = '';

            // Refresh library feed
            state.currentTab = 'feed';
            loadCommunityLibrary('feed');

        } catch (err) {
            console.error('[submitComposeThread] error:', err);
            window.showHiToast(err.message || 'Lỗi khi chia sẻ bộ từ.', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>Đăng lên Thư viện</span>';
            }
        }
    }

    function handlePublishUserTopic(topicId) {
        openComposeThreadModal(topicId);
    }

    async function handleUnpublishTopic(topicId) {
        if (!confirm('Bạn có chắc chắn muốn ngừng chia sẻ bộ từ này lên Thư viện? (Dữ liệu của bạn trong Kho từ vẫn được giữ nguyên)')) {
            return;
        }
        try {
            if (typeof HiDB !== 'undefined' && HiDB.unpublishTopic) {
                await HiDB.unpublishTopic(topicId);
            }
            window.showHiToast('Đã gỡ bộ từ khỏi Thư viện.', 'success');
            fetchMyTopics();
        } catch (err) {
            console.error('[handleUnpublishTopic] error:', err);
            window.showHiToast(err.message || 'Lỗi khi thu hồi.', 'error');
        }
    }

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

    // Expose functions globally to window
    window.loadCommunityLibrary     = loadCommunityLibrary;
    window.switchLibraryTab        = switchLibraryTab;
    window.filterLibraryTag        = filterLibraryTag;
    window.handleLibrarySearch     = handleLibrarySearch;
    window.clearLibrarySearch      = clearLibrarySearch;
    window.handleLibrarySortChange = handleLibrarySortChange;
    window.handleThreadLike        = handleThreadLike;
    window.handleThreadClone       = handleThreadClone;
    window.handleThreadShare       = handleThreadShare;
    window.openThreadDetail        = openThreadDetail;
    window.closeThreadDetail       = closeThreadDetail;
    window.openComposeThreadModal  = openComposeThreadModal;
    window.closeComposeThreadModal = closeComposeThreadModal;
    window.submitComposeThread     = submitComposeThread;
    window.handlePublishUserTopic  = handlePublishUserTopic;
    window.handleUnpublishTopic    = handleUnpublishTopic;
    window.openThreadComments      = openThreadComments;
    window.closeThreadComments     = closeThreadComments;
    window.submitThreadComment     = submitThreadComment;
    window.playWordAudio           = playWordAudio;

})();
