// Generated 1:1 Pixel-Perfect Component: PageTopicDetail
import React from 'react';

export function PageTopicDetail() {
  return (
    <>
<div id="page-topic-detail" className="page">
{/* Sub Sidebar dùng riêng cho Chi tiết chủ đề */}
<nav id="sub-sidebar" className="hidden lg:flex flex-col h-screen fixed left-0 top-0 w-64 p-6 bg-surface/80 backdrop-blur-xl border-r border-outline-variant/20 shadow-sm z-50">
    <div className="mb-lg shrink-0">
        <img className="brand-logo" src="logo-mark.svg" alt="Hi"/>
        <p className="text-on-surface-variant mt-sm">Chủ đề hiện tại</p>
        <p id="sub-sidebar-topic-name" className="font-body-lg font-bold text-on-surface mt-xs line-clamp-2">—</p>
    </div>
    <div className="flex flex-col gap-base flex-1 overflow-y-auto pr-2">
        <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-xs ml-sm shrink-0">Chế độ học</p>
        <a onClick={(event) => { try { (function(event){ startSinglePractice(0) }).call(this, event); } catch(e){ console.error(e); } }} className="flex items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-primary-container/10 cursor-pointer hover:opacity-80 transition-opacity"><span className="material-symbols-outlined">flash_on</span><span>Flashcard</span></a>
        <a onClick={(event) => { try { (function(event){ startSinglePractice(1) }).call(this, event); } catch(e){ console.error(e); } }} className="flex items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-primary-container/10 cursor-pointer hover:opacity-80 transition-opacity"><span className="material-symbols-outlined">quiz</span><span>Trắc Nghiệm</span></a>
        <a onClick={(event) => { try { (function(event){ startSinglePractice(2) }).call(this, event); } catch(e){ console.error(e); } }} className="flex items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-primary-container/10 cursor-pointer hover:opacity-80 transition-opacity"><span className="material-symbols-outlined">text_fields</span><span>Điền từ</span></a>
        <a onClick={(event) => { try { (function(event){ startSinglePractice(3) }).call(this, event); } catch(e){ console.error(e); } }} className="flex items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-primary-container/10 cursor-pointer hover:opacity-80 transition-opacity"><span className="material-symbols-outlined">record_voice_over</span><span>Nghe và viết</span></a>
        <a id="sub-sidebar-reading-btn" onClick={(event) => { try { (function(event){ window.startBilingualReading() }).call(this, event); } catch(e){ console.error(e); } }} className="hidden items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-primary-container/10 cursor-pointer hover:opacity-80 transition-opacity"><span className="material-symbols-outlined">menu_book</span><span>Đọc &amp; Dịch</span></a>
    </div>
    <div className="mt-auto shrink-0 pt-md border-t border-outline-variant/20">
        <a onClick={(event) => { try { (function(event){ navigateTo('topics') }).call(this, event); } catch(e){ console.error(e); } }} className="flex items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-surface-container cursor-pointer"><span className="material-symbols-outlined">arrow_back</span><span>Quay lại</span></a>
    </div>
</nav>

{/* Sub Header Mobile dùng riêng cho Chi tiết chủ đề */}
<header id="sub-mobile-header" className="lg:hidden flex fixed top-0 w-full z-40 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/20 px-3 pb-2.5 items-center gap-2 mobile-sticky-top">
    <button onClick={(event) => { try { (function(event){ navigateTo('topics') }).call(this, event); } catch(e){ console.error(e); } }} className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl transition-all active:scale-90 shrink-0 cursor-pointer" aria-label="Quay lại danh sách chủ đề">
        <span className="material-symbols-outlined text-[24px]">arrow_back</span>
    </button>
    <div id="td-mobile-header-title" className="font-bold text-on-surface truncate text-base sm:text-lg">Chi tiết chủ đề</div>
</header>

<main className="lg:ml-64 min-h-screen pt-28 lg:pt-8 pb-28 lg:pb-12 px-4 sm:px-6 lg:px-12 flex flex-col">
    <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col gap-6 lg:gap-8 fade-in">
        {/* Desktop header */}
        <div className="hidden lg:flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
                <h2 id="td-title" className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">—</h2>
                <p id="td-subtitle" className="text-on-surface-variant mt-sm">Chọn một lesson để bắt đầu học</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
                <button onClick={(event) => { try { (function(event){ window.openAddWordModal() }).call(this, event); } catch(e){ console.error(e); } }} className="bg-primary text-on-primary hover:bg-surface-tint font-bold text-sm px-4 py-2.5 rounded-xl transition-all active:scale-95 shadow-sm shadow-primary/20 flex items-center gap-1.5 shrink-0 cursor-pointer">
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    <span>Thêm từ vựng</span>
                </button>
            </div>
        </div>

        {/* Mobile header card */}
        <div className="flex flex-col lg:hidden gap-3 mt-2">
            <div className="bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant/20 rounded-2xl p-5 soft-shadow">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <h2 id="td-title-mobile" className="text-2xl font-bold text-on-surface leading-tight truncate">—</h2>
                        <p id="td-subtitle-mobile" className="text-sm text-on-surface-variant mt-1">Chọn một lesson để bắt đầu học</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <button type="button" onClick={(event) => { try { (function(event){ event.stopPropagation(); window.openAddWordModal(); }).call(this, event); } catch(e){ console.error(e); } }} className="bg-primary text-on-primary font-bold text-xs px-3 py-2.5 rounded-xl transition-all active:opacity-85 shadow-sm shadow-primary/20 flex items-center gap-1 shrink-0 cursor-pointer" style={{"touchAction":"manipulation","WebkitTapHighlightColor":"transparent"}}>
                            <span className="material-symbols-outlined text-[16px] pointer-events-none">add</span>
                            <span className="pointer-events-none">Thêm từ</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* Test Tabs Selector (dành riêng cho danh mục Cambridge IELTS) */}
        <div id="cam-test-tabs-container" className="hidden flex-col gap-2.5">
            <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-outline flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px]">quiz</span>
                    Chọn bài Test
                </span>
                <span id="cam-test-info" className="text-xs font-medium text-on-surface-variant">4 bài Test · 12 bài đọc</span>
            </div>
            <div id="cam-test-tabs" className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide"></div>
        </div>

        {/* Danh sách Lessons hoặc Passages */}
        <div id="lessons-list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center justify-center py-12 col-span-3">
                <span className="material-symbols-outlined text-primary text-[40px] animate-spin">refresh</span>
            </div>
        </div>
    </div>
</main>
</div>
    </>
  );
}

export default PageTopicDetail;
