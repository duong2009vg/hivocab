// Generated 1:1 Pixel-Perfect Component: PageLibrary
import React from 'react';

export function PageLibrary() {
  return (
    <>
<div id="page-library" className="page bg-surface">
<main className="lg:ml-64 min-h-screen lg:pt-6 pb-28 lg:pb-12 px-0 sm:px-4 flex flex-col items-center">
    <div className="max-w-[620px] w-full flex flex-col gap-0 sm:gap-4 fade-in">

        {/* Threads-style Header & Tabs */}
        <div className="w-full bg-surface/95 dark:bg-black/95 backdrop-blur-md sticky top-0 z-30 mobile-sticky-top lg:pt-2 pb-2.5 border-b border-outline-variant/15 dark:border-neutral-800/80 flex items-center justify-between gap-2 px-3 sm:px-0">
            <div className="flex items-center gap-1 sm:gap-2">
                <button id="lib-tab-feed" onClick={(event) => { try { (function(event){ window.switchLibraryTab('feed') }).call(this, event); } catch(e){ console.error(e); } }} className="px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs">
                    Khám phá
                </button>
                <button id="lib-tab-my" onClick={(event) => { try { (function(event){ window.switchLibraryTab('my') }).call(this, event); } catch(e){ console.error(e); } }} className="px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface">
                    Bộ từ của tôi
                </button>
                <button id="lib-tab-liked" onClick={(event) => { try { (function(event){ window.switchLibraryTab('liked') }).call(this, event); } catch(e){ console.error(e); } }} className="px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface flex items-center gap-1">
                    <span>Đã thích</span>
                    <span className="material-symbols-outlined text-rose-500 text-[15px]">favorite</span>
                </button>
            </div>
        </div>

        {/* Search bar + Sort filter */}
        <div id="lib-search-container" className="flex items-center gap-2 px-3 sm:px-0 pt-2 sm:pt-0">
            <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                <input id="lib-search-input" type="text" aria-label="Tìm kiếm bộ từ, tác giả hoặc hashtag" placeholder="Tìm bộ từ, tác giả, #hashtag..." onInput={(event) => { try { (function(event){ window.handleLibrarySearch(this.value) }).call(this, event); } catch(e){ console.error(e); } }}
                       className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-2xl bg-surface-container-low dark:bg-neutral-900 border border-outline-variant/30 dark:border-neutral-800 focus:border-primary focus:outline-hidden transition-all text-on-surface placeholder:text-outline"/>
                <button id="lib-search-clear" onClick={(event) => { try { (function(event){ window.clearLibrarySearch() }).call(this, event); } catch(e){ console.error(e); } }} className="hidden absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface cursor-pointer">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
            </div>
            <select id="lib-sort-select" onChange={(event) => { try { (function(event){ window.handleLibrarySortChange(this.value) }).call(this, event); } catch(e){ console.error(e); } }} className="text-xs font-semibold py-2 px-3 rounded-2xl bg-surface-container-low dark:bg-neutral-900 border border-outline-variant/30 dark:border-neutral-800 text-on-surface-variant cursor-pointer focus:outline-hidden">
                <option value="popular">🔥 Phổ biến nhất</option>
                <option value="clones">📥 Tải nhiều nhất</option>
                <option value="newest">⚡ Mới nhất</option>
            </select>
        </div>

        {/* Horizontal Trending Tag Pills */}
        <div className="flex items-center gap-2 overflow-x-auto px-3 sm:px-0 py-1 scrollbar-hide select-none" id="lib-tags-bar">
            {/* Rendered by library.js */}
        </div>

        {/* Loading spinner */}
        <div id="lib-loading-state" className="flex items-center justify-center py-16">
            <span className="material-symbols-outlined text-primary text-[36px] animate-spin">refresh</span>
        </div>

        {/* Feed list container */}
        <div id="lib-feed-list" className="flex flex-col divide-y divide-outline-variant/10 dark:divide-neutral-800/80">
            {/* Thread cards rendered by library.js */}
        </div>

        {/* Empty state */}
        <div id="lib-empty-state" className="hidden flex flex-col items-center justify-center py-16 text-center text-outline">
            <span className="material-symbols-outlined text-[48px] text-outline/50 mb-2">style</span>
            <p className="text-sm font-bold text-on-surface">Chưa có bộ từ vựng nào</p>
            <p className="text-xs text-on-surface-variant mt-1">Hãy là người đầu tiên chia sẻ kiến thức hữu ích đến mọi người!</p>
        </div>

    </div>
</main>
</div>
    </>
  );
}

export default PageLibrary;
