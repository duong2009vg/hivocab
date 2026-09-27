import React from 'react';
import {
  dictOnInput,
  dictOnKeyDown,
  dictSearch,
  dictClearInput,
  dictClearRecent,
  dictCopyWord,
  dictOpenSaveModal,
  dictPlayAudio,
} from '../../legacy/legacyBridge';

export function PageDictionary() {
  return (
    <>
<div id="page-dictionary" className="page">
<main className="lg:ml-64 min-h-screen mobile-page-top lg:pt-8 pb-28 lg:pb-12 px-4 sm:px-6 lg:px-12 flex flex-col">
    <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col gap-6 fade-in">

        {/* Header */}
        <header className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[28px]">menu_book</span>
                <h1 className="text-2xl lg:text-headline-lg font-bold text-on-surface">Từ điển</h1>
            </div>
        </header>

        {/* Search bar */}
        <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[22px]">search</span>
            <input id="dict-input"
                   type="text"
                   aria-label="Nhập từ hoặc cụm từ tiếng Anh để tra từ điển"
                   placeholder="Nhập từ, cụm từ hoặc thành ngữ tiếng Anh..."
                   autoComplete="off" spellCheck="false"
                   onInput={(e) => dictOnInput(e.target.value)}
                   onKeyDown={(e) => dictOnKeyDown(e)}
                   className="w-full pl-12 pr-28 py-4 bg-surface-container-lowest/80 backdrop-blur-[24px] border border-outline-variant/30 rounded-2xl text-on-surface placeholder:text-outline focus:border-primary focus:outline-none text-base md:text-lg transition-colors shadow-sm"/>
            
            <button id="dict-clear-btn"
                    onClick={() => dictClearInput()}
                    title="Xóa tìm kiếm"
                    className="hidden absolute right-20 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <button onClick={() => dictSearch()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-surface-tint active:scale-95 transition-all shadow-sm">
                Tra
            </button>

            {/* Autocomplete suggestions dropdown (tận dụng 70.000 từ) */}
            <div id="dict-suggestions-dropdown"
                 className="hidden absolute left-0 right-0 top-full mt-2 bg-surface-container-lowest/95 backdrop-blur-[24px] border border-outline-variant/30 rounded-2xl soft-shadow overflow-hidden z-50 divide-y divide-outline-variant/15 max-h-80 overflow-y-auto">
            </div>
        </div>

        {/* Recent searches chips */}
        <div id="dict-recent-wrap" className="hidden flex-col gap-2">
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-outline uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">history</span>
                    Từ vừa tra gần đây
                </span>
                <button onClick={() => dictClearRecent()} className="text-xs text-primary/80 hover:text-primary hover:underline">Xóa tất cả</button>
            </div>
            <div id="dict-recent-chips" className="flex flex-wrap gap-2"></div>
        </div>

        {/* Loading state */}
        <div id="dict-loading" className="hidden flex-col items-center justify-center py-20 gap-4">
            <div className="relative w-14 h-14">
                <div className="w-14 h-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                <span className="material-symbols-outlined text-primary text-[22px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">menu_book</span>
            </div>
            <p id="dict-loading-title" className="text-on-surface font-semibold text-base">Đang tra cứu từ điển...</p>
            <p id="dict-loading-desc" className="text-on-surface-variant text-xs">Tra cứu định nghĩa song ngữ và ví dụ thực tế</p>
        </div>

        {/* Error / Not found */}
        <div id="dict-error" className="hidden flex-col items-center justify-center py-16 gap-3 text-center">
            <span className="material-symbols-outlined text-[56px] text-outline">search_off</span>
            <h3 className="font-bold text-on-surface text-xl">Không tìm thấy từ này</h3>
            <p id="dict-error-desc" className="text-on-surface-variant text-sm max-w-sm">Kiểm tra lại chính tả hoặc thử các từ thông dụng khác.</p>
        </div>

        {/* Result container */}
        <div id="dict-result" className="hidden flex-col gap-6">

            {/* Word Header Card */}
            <div className="glass-card soft-shadow rounded-2xl p-6 md:p-8">
                {/* Row 1: Word + Badges + Actions */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 id="dict-word" className="text-3xl md:text-5xl font-black text-on-surface tracking-tight"></h2>
                            <span id="dict-cefr-badge" className="hidden px-2.5 py-1 rounded-full text-xs font-black tracking-wider uppercase"></span>
                            <span id="dict-pos-badge" className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-surface-container text-on-surface-variant"></span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button id="dict-copy-btn"
                                onClick={() => dictCopyWord()}
                                title="Sao chép từ"
                                className="w-10 h-10 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-on-surface transition-all active:scale-95">
                            <span className="material-symbols-outlined text-[20px]">content_copy</span>
                        </button>
                        <button id="dict-save-btn"
                                onClick={() => dictOpenSaveModal()}
                                title="Lưu vào Sổ từ vựng"
                                className="px-4 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm flex items-center gap-2 shadow hover:bg-surface-tint active:scale-95 transition-all">
                            <span className="material-symbols-outlined text-[18px]">bookmark_add</span>
                            <span>Lưu từ</span>
                        </button>
                    </div>
                </div>

                {/* Pronunciation Row (1 single audio button - zero delay) */}
                <div className="flex items-center gap-3.5 mt-5 pt-5 border-t border-outline-variant/20">
                    <span id="dict-phonetic" className="font-mono text-base md:text-xl text-primary font-bold tracking-wide"></span>
                    <button id="dict-audio-btn"
                            onClick={() => dictPlayAudio()}
                            title="Nghe phát âm"
                            className="w-10 h-10 rounded-full bg-primary text-on-primary hover:bg-surface-tint active:scale-95 flex items-center justify-center shadow transition-all cursor-pointer">
                        <span className="material-symbols-outlined text-[22px]">volume_up</span>
                    </button>
                </div>

                {/* Row 3: Quick Vietnamese Summary Banner */}
                <div id="dict-summary-wrap" className="hidden mt-4 p-4 rounded-xl bg-primary/10 border border-primary/20 items-start gap-3">
                    <span className="material-symbols-outlined text-primary text-[22px] shrink-0 mt-0.5">translate</span>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-0.5">Nghĩa tiếng Việt</p>
                        <p id="dict-vi-summary" className="text-base md:text-lg font-bold text-on-surface leading-snug"></p>
                    </div>
                </div>
            </div>

            {/* Senses & Definitions Section */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-bold text-outline uppercase tracking-widest flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">format_quote</span>
                        Chi tiết nghĩa &amp; Ví dụ
                    </h3>
                </div>
                <div id="dict-meanings" className="flex flex-col gap-4"></div>
            </div>

            {/* Collocations & Idioms Card */}
            <div id="dict-collocations-wrap" className="hidden glass-card soft-shadow rounded-2xl p-6">
                <h4 className="text-xs font-bold text-outline uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-primary">link</span>
                    Cụm từ & Thành ngữ thường gặp (Collocations & Idioms)
                </h4>
                <div id="dict-collocations-list" className="grid grid-cols-1 md:grid-cols-2 gap-3"></div>
            </div>

            {/* Word Family & Synonyms Card */}
            <div id="dict-extras-wrap" className="hidden glass-card soft-shadow rounded-2xl p-6 flex flex-col gap-5">
                {/* Word Family */}
                <div id="dict-family-wrap" className="hidden flex-col gap-2.5">
                    <h4 className="text-xs font-bold text-outline uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-primary">family_restroom</span>
                        Gia đình từ vựng (Word Family)
                    </h4>
                    <div id="dict-family-list" className="flex flex-wrap gap-2"></div>
                </div>

                {/* Synonyms */}
                <div id="dict-synonyms-wrap" className="hidden flex-col gap-2.5 pt-4 border-t border-outline-variant/20">
                    <h4 className="text-xs font-bold text-outline uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-primary">sync_alt</span>
                        Từ đồng nghĩa (Synonyms)
                    </h4>
                    <div id="dict-synonyms" className="flex flex-wrap gap-2"></div>
                </div>
            </div>

        </div>

        {/* Empty state (initial) */}
        <div id="dict-empty" className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                <span className="material-symbols-outlined text-[44px]">menu_book</span>
            </div>
            <h3 className="font-bold text-on-surface text-xl">Tra cứu từ điển</h3>
            <p className="text-on-surface-variant text-sm max-w-sm">Gõ bất kỳ từ vựng, cụm từ (phrasal verb) hoặc thành ngữ nào để xem đầy đủ phát âm, cấp độ CEFR, các nét nghĩa và ví dụ thực tế.</p>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
                <button onClick={() => { const input = document.getElementById('dict-input'); if (input) { input.value = 'abandon'; dictSearch(); } }} className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface border border-outline-variant/30 transition-colors cursor-pointer">abandon</button>
                <button onClick={() => { const input = document.getElementById('dict-input'); if (input) { input.value = 'resilient'; dictSearch(); } }} className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface border border-outline-variant/30 transition-colors cursor-pointer">resilient</button>
                <button onClick={() => { const input = document.getElementById('dict-input'); if (input) { input.value = 'make sense'; dictSearch(); } }} className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface border border-outline-variant/30 transition-colors cursor-pointer">make sense</button>
                <button onClick={() => { const input = document.getElementById('dict-input'); if (input) { input.value = 'meticulous'; dictSearch(); } }} className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface border border-outline-variant/30 transition-colors cursor-pointer">meticulous</button>
            </div>
        </div>

    </div>
</main>
</div>
    </>
  );
}

export default PageDictionary;
