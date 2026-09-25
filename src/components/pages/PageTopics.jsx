// Generated 1:1 Pixel-Perfect Component: PageTopics
import React from 'react';

export function PageTopics() {
  return (
    <>
<div id="page-topics" className="page">
<main className="lg:ml-64 min-h-screen mobile-page-top lg:pt-8 pb-28 lg:pb-12 px-4 sm:px-6 lg:px-12 flex flex-col">
    <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col gap-5 md:gap-6 fade-in">

        {/* Header & Toolbar: Tạo chủ đề */}
        <section className="flex items-center justify-between gap-3 pt-1">
            <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-headline-lg font-bold text-on-surface tracking-tight">Chủ đề</h1>
                <p id="topics-page-subtitle" className="text-xs sm:text-sm text-on-surface-variant mt-0.5 truncate sm:whitespace-normal">Quản lý và sắp xếp các lĩnh vực học tập của bạn.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <button onClick={(event) => { try { (function(event){ window.openCreateTopicModal() }).call(this, event); } catch(e){ console.error(e); } }} className="bg-primary text-on-primary hover:opacity-95 font-semibold text-xs sm:text-sm px-4 py-2 sm:px-5 sm:py-2.5 rounded-full transition-all active:scale-[0.98] shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0">
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    <span>Tạo chủ đề</span>
                </button>
                <button onClick={(event) => { try { (function(event){ window.toggleMobileProfileDropdown() }).call(this, event); } catch(e){ console.error(e); } }} className="mobile-user-avatar lg:hidden w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden bg-cover bg-center active:scale-90 transition-transform cursor-pointer border border-outline-variant/30 shrink-0" aria-label="Hồ sơ">
                    <span className="material-symbols-outlined text-outline text-sm">person</span>
                </button>
            </div>
        </section>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" id="category-tabs">
            {/* rendered by JS */}
        </div>

        {/* Topics grid */}
        <section id="topics-grid" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {/* cards rendered by JS */}
            <div className="flex items-center justify-center py-16 col-span-4">
                <span className="material-symbols-outlined text-primary text-[40px] animate-spin">refresh</span>
            </div>
        </section>

    </div>
</main>
</div>
    </>
  );
}

export default PageTopics;
