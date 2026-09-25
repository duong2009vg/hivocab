// Generated 1:1 Pixel-Perfect Component: PageLessonDetail
import React from 'react';

export function PageLessonDetail() {
  return (
    <>
<div id="page-lesson-detail" className="page">
{/* Sidebar bên trái (desktop) */}
<nav className="hidden lg:flex flex-col h-screen fixed left-0 top-0 w-64 p-6 bg-surface/80 backdrop-blur-xl border-r border-outline-variant/20 shadow-sm z-50">
    <div className="mb-lg shrink-0">
        <img className="brand-logo" src="logo-mark.svg" alt="Hi"/>
        <p id="ld-sidebar-topic" className="text-on-surface-variant mt-sm">—</p>
        <p id="ld-sidebar-lesson" className="font-body-lg font-bold text-on-surface mt-xs">Lesson 1</p>
    </div>
    <div className="flex flex-col gap-base flex-1 overflow-y-auto pr-2">
        <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-xs ml-sm shrink-0">Chế độ học</p>
        <a onClick={(event) => { try { (function(event){ startSinglePractice(0) }).call(this, event); } catch(e){ console.error(e); } }} className="flex items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-primary-container/10 cursor-pointer hover:opacity-80 transition-opacity"><span className="material-symbols-outlined">flash_on</span><span>Flashcard</span></a>
        <a onClick={(event) => { try { (function(event){ startSinglePractice(1) }).call(this, event); } catch(e){ console.error(e); } }} className="flex items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-primary-container/10 cursor-pointer hover:opacity-80 transition-opacity"><span className="material-symbols-outlined">quiz</span><span>Trắc Nghiệm</span></a>
        <a onClick={(event) => { try { (function(event){ startSinglePractice(2) }).call(this, event); } catch(e){ console.error(e); } }} className="flex items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-primary-container/10 cursor-pointer hover:opacity-80 transition-opacity"><span className="material-symbols-outlined">text_fields</span><span>Điền từ</span></a>
        <a onClick={(event) => { try { (function(event){ startSinglePractice(3) }).call(this, event); } catch(e){ console.error(e); } }} className="flex items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-primary-container/10 cursor-pointer hover:opacity-80 transition-opacity"><span className="material-symbols-outlined">record_voice_over</span><span>Nghe và viết</span></a>
        <a id="ld-sidebar-reading-btn" onClick={(event) => { try { (function(event){ window.startBilingualReading() }).call(this, event); } catch(e){ console.error(e); } }} className="hidden items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-primary-container/10 cursor-pointer hover:opacity-80 transition-opacity"><span className="material-symbols-outlined">menu_book</span><span>Đọc &amp; Dịch</span></a>
    </div>
    <div className="mt-auto shrink-0 pt-md border-t border-outline-variant/20">
        <a onClick={(event) => { try { (function(event){ navigateTo('topic-detail') }).call(this, event); } catch(e){ console.error(e); } }} className="flex items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-surface-container cursor-pointer"><span className="material-symbols-outlined">arrow_back</span><span>Quay lại</span></a>
    </div>
</nav>

{/* Mobile header */}
<header className="lg:hidden flex fixed top-0 w-full z-40 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/20 px-3 pb-2.5 items-center gap-2 mobile-sticky-top">
    <button onClick={(event) => { try { (function(event){ navigateTo('topic-detail') }).call(this, event); } catch(e){ console.error(e); } }} className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl transition-all active:scale-90 shrink-0 cursor-pointer" aria-label="Quay lại chủ đề">
        <span className="material-symbols-outlined text-[24px]">arrow_back</span>
    </button>
    <div id="ld-mobile-header-title" className="font-bold text-on-surface truncate text-base sm:text-lg">Lesson 1</div>
</header>

<main className="lg:ml-64 min-h-screen pt-28 lg:pt-8 pb-28 lg:pb-12 px-4 sm:px-6 lg:px-12 flex flex-col">
    <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col gap-6 lg:gap-8 fade-in">
        {/* Desktop header */}
        <div className="hidden lg:flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
                <h2 id="ld-title" className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">Lesson 1</h2>
                <p id="ld-subtitle" className="text-on-surface-variant mt-sm">0 từ vựng</p>
            </div>
            <div className="flex items-center gap-3">
                <button type="button" onClick={(event) => { try { (function(event){ event.stopPropagation(); window.openAddWordModal(window._currentTopicId, window._currentPassageId); }).call(this, event); } catch(e){ console.error(e); } }} className="bg-primary text-on-primary hover:bg-surface-tint font-bold text-sm px-4 py-2.5 rounded-xl transition-all active:scale-95 shadow-sm shadow-primary/20 flex items-center gap-1.5 shrink-0 cursor-pointer">
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    <span>Thêm từ vựng</span>
                </button>
                <button id="btn-read-passage" onClick={(event) => { try { (function(event){ window.startBilingualReading() }).call(this, event); } catch(e){ console.error(e); } }} className="hidden bg-primary/10 text-primary hover:bg-primary/20 font-bold text-sm px-4 py-3 rounded-xl transition-colors flex items-center gap-1.5 shrink-0">
                    <span className="material-symbols-outlined text-[18px]">menu_book</span>
                    <span>Đọc bài song ngữ</span>
                </button>
                <div className="relative w-full lg:w-72">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
                    <input id="ld-search" aria-label="Tìm kiếm từ vựng trong bài học" onInput={(event) => { try { (function(event){ window.filterLessonWords() }).call(this, event); } catch(e){ console.error(e); } }} className="w-full bg-surface-container-low border-b-2 border-transparent focus:border-primary border-t-0 border-l-0 border-r-0 rounded-t-DEFAULT pl-10 pr-4 py-3 text-base text-on-surface placeholder:text-outline focus:ring-0 transition-colors" placeholder="Tìm kiếm từ vựng..." type="text"/>
                </div>
            </div>
        </div>

        {/* Mobile card — design mới theo code.html */}
        <div className="flex flex-col lg:hidden gap-4 mt-2">

            {/* Topic Header Card (glassmorphism) */}
            <div className="bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant/20 rounded-2xl p-5 soft-shadow relative overflow-hidden">
                {/* Decorative blob */}
                <div className="absolute -top-8 -right-8 w-28 h-28 bg-primary-container/20 rounded-full blur-2xl pointer-events-none"></div>
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 pr-3">
                        <span id="ld-badge-mobile" className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant text-[10px] font-bold tracking-wider uppercase mb-2">Lesson</span>
                        <h2 id="ld-title-mobile" className="text-2xl font-bold text-on-surface leading-tight">Lesson 1</h2>
                        <p id="ld-subtitle-mobile" className="text-sm text-on-surface-variant mt-1">0 từ vựng</p>
                    </div>
                    <div id="ld-icon-mobile" className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined" style={{"fontVariationSettings":"'FILL' 1"}}>book</span>
                    </div>
                </div>
                {/* Progress bar */}
                <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-on-surface-variant">Mastery</span>
                        <span id="ld-progress-pct-mobile" className="font-bold text-primary">0%</span>
                    </div>
                    <div className="w-full bg-surface-variant rounded-full h-1.5 overflow-hidden">
                        <div id="ld-progress-bar-mobile" className="bg-primary h-1.5 rounded-full transition-all duration-500" style={{"width":"0%"}}></div>
                    </div>
                </div>
                {/* CTA button */}
                <button type="button" onClick={(event) => { try { (function(event){ startSinglePractice(0) }).call(this, event); } catch(e){ console.error(e); } }} className="mt-5 w-full bg-primary text-on-primary font-bold py-3 rounded-xl hover:bg-surface-tint transition-all active:opacity-85 text-sm cursor-pointer" style={{"touchAction":"manipulation","WebkitTapHighlightColor":"transparent"}}>
                    Bắt đầu học
                </button>
                <button type="button" onClick={(event) => { try { (function(event){ event.stopPropagation(); window.openAddWordModal(window._currentTopicId, window._currentPassageId); }).call(this, event); } catch(e){ console.error(e); } }} className="w-full mt-2 bg-primary/10 text-primary hover:bg-primary/20 active:bg-primary/25 font-bold py-2.5 rounded-xl transition-all active:opacity-85 text-xs flex items-center justify-center gap-1.5 cursor-pointer" style={{"touchAction":"manipulation","WebkitTapHighlightColor":"transparent"}}>
                    <span className="material-symbols-outlined text-[16px] pointer-events-none">add</span>
                    <span className="pointer-events-none">Thêm từ vựng mới</span>
                </button>
                <button type="button" id="btn-read-passage-mobile" onClick={(event) => { try { (function(event){ event.stopPropagation(); window.startBilingualReading(); }).call(this, event); } catch(e){ console.error(e); } }} className="hidden w-full mt-2 bg-primary/10 text-primary hover:bg-primary/20 active:bg-primary/25 font-bold py-2.5 rounded-xl transition-all active:opacity-85 text-xs flex items-center justify-center gap-1.5 cursor-pointer" style={{"touchAction":"manipulation","WebkitTapHighlightColor":"transparent"}}>
                    <span className="material-symbols-outlined text-[16px] pointer-events-none">menu_book</span>
                    <span className="pointer-events-none">Đọc bài đọc song ngữ</span>
                </button>
            </div>

            {/* Study Modes Grid */}
            <div>
                <h3 className="font-bold text-on-background text-base mb-3">Study Modes</h3>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={(event) => { try { (function(event){ startSinglePractice(0) }).call(this, event); } catch(e){ console.error(e); } }} className="bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant/20 rounded-xl p-4 flex flex-col items-center justify-center gap-2 aspect-square active:scale-95 transition-all soft-shadow group">
                        <div className="w-10 h-10 rounded-full bg-secondary-container/30 flex items-center justify-center text-secondary group-hover:bg-secondary-container transition-colors">
                            <span className="material-symbols-outlined">style</span>
                        </div>
                        <span className="text-xs font-bold text-on-surface">Flashcard</span>
                    </button>
                    <button onClick={(event) => { try { (function(event){ startSinglePractice(1) }).call(this, event); } catch(e){ console.error(e); } }} className="bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant/20 rounded-xl p-4 flex flex-col items-center justify-center gap-2 aspect-square active:scale-95 transition-all soft-shadow group">
                        <div className="w-10 h-10 rounded-full bg-tertiary-container/20 flex items-center justify-center text-tertiary group-hover:bg-tertiary-container/40 transition-colors">
                            <span className="material-symbols-outlined">quiz</span>
                        </div>
                        <span className="text-xs font-bold text-on-surface">Trắc Nghiệm</span>
                    </button>
                    <button onClick={(event) => { try { (function(event){ startSinglePractice(2) }).call(this, event); } catch(e){ console.error(e); } }} className="bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant/20 rounded-xl p-4 flex flex-col items-center justify-center gap-2 aspect-square active:scale-95 transition-all soft-shadow group">
                        <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center text-primary group-hover:bg-primary-container/30 transition-colors">
                            <span className="material-symbols-outlined">edit_square</span>
                        </div>
                        <span className="text-xs font-bold text-on-surface">Điền từ</span>
                    </button>
                    <button onClick={(event) => { try { (function(event){ startSinglePractice(3) }).call(this, event); } catch(e){ console.error(e); } }} className="bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant/20 rounded-xl p-4 flex flex-col items-center justify-center gap-2 aspect-square active:scale-95 transition-all soft-shadow group">
                        <div className="w-10 h-10 rounded-full bg-[#E8DEF8] flex items-center justify-center text-[#4A4458] group-hover:bg-[#E8DEF8]/80 transition-colors">
                            <span className="material-symbols-outlined">hearing</span>
                        </div>
                        <span className="text-xs font-bold text-on-surface">Nghe &amp; Viết</span>
                    </button>
                    {/* Nút Đọc & Dịch Song Ngữ (hiện có điều kiện khi có bài đọc) */}
                    <button type="button" id="ld-study-mode-reading" onClick={(event) => { try { (function(event){ event.stopPropagation(); window.startBilingualReading(); }).call(this, event); } catch(e){ console.error(e); } }} className="hidden col-span-2 bg-gradient-to-r from-primary/10 via-surface-container-lowest to-secondary/10 backdrop-blur-xl border border-primary/20 rounded-xl p-4 items-center justify-between gap-3 active:opacity-85 transition-all soft-shadow group cursor-pointer" style={{"touchAction":"manipulation","WebkitTapHighlightColor":"transparent"}}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                                <span className="material-symbols-outlined">menu_book</span>
                            </div>
                            <div className="text-left">
                                <span className="text-xs font-bold text-on-surface block">Đọc &amp; Dịch Song Ngữ</span>
                                <span className="text-[11px] text-on-surface-variant block">Đọc chủ động · Che bản dịch · Đục lỗ ngữ cảnh</span>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-primary text-sm">arrow_forward</span>
                    </button>
                </div>
            </div>

            {/* Search bar */}
            <div className="sticky top-16 z-40 bg-background/90 backdrop-blur-md py-2 -mx-4 px-4">
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
                    <input id="ld-search-mobile" onInput={(event) => { try { (function(event){ window.filterLessonWords() }).call(this, event); } catch(e){ console.error(e); } }}
                        className="w-full bg-surface-container-low border-b-2 border-transparent focus:border-secondary-fixed-dim rounded-t-lg pl-10 pr-10 py-3 text-sm text-on-surface placeholder:text-outline-variant focus:outline-none transition-colors"
                        placeholder="Search vocabulary..." type="text"/>
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary">
                        <span className="material-symbols-outlined text-[20px]">filter_list</span>
                    </button>
                </div>
            </div>
        </div>

        {/* Danh sách từ vựng trong lesson */}
        <div id="lesson-words-list" className="flex flex-col gap-3 md:gap-4 mt-2 lg:mt-0">
            <div className="flex items-center justify-center py-12">
                <span className="material-symbols-outlined text-primary text-[40px] animate-spin">refresh</span>
            </div>
        </div>
    </div>
</main>
</div>
    </>
  );
}

export default PageLessonDetail;
