// Generated 1:1 Pixel-Perfect Component: PageVocabulary
import React from 'react';

export function PageVocabulary() {
  return (
    <>
<div id="page-vocabulary" className="page">
<main className="lg:ml-64 min-h-screen mobile-page-top lg:pt-8 pb-32 lg:pb-14 px-4 sm:px-6 lg:px-12 flex flex-col">
    <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col gap-5 lg:gap-6 fade-in">
        
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 lg:gap-4">
            <div>
                <div className="flex items-center gap-2.5">
                    <h1 className="font-headline-lg text-xl sm:text-2xl lg:text-3xl font-extrabold text-on-surface tracking-tight">
                        <span className="hidden lg:inline">Kho từ vựng</span>
                        <span className="lg:hidden">Sổ từ cá nhân</span>
                    </h1>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        Đã học
                    </span>
                </div>
                <p id="vocab-subtitle" className="text-xs sm:text-sm text-on-surface-variant mt-1">
                    Sổ tay ghi nhớ cá nhân · Chỉ hiển thị các từ vựng bạn đã học hoặc tự thêm.
                </p>
            </div>

            {/* Action Buttons (Desktop & Tablet) */}
            <div className="flex items-center gap-2 flex-wrap">
                <button onClick={(event) => { try { (function(event){ window.openVocabAddModal() }).call(this, event); } catch(e){ console.error(e); } }}
                        className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-primary text-on-primary text-xs sm:text-sm font-semibold flex items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer shadow-xs">
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    <span>Thêm từ vựng</span>
                </button>
                <button onClick={(event) => { try { (function(event){ window.openVocabBulkAddModal() }).call(this, event); } catch(e){ console.error(e); } }}
                        className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/30 text-xs sm:text-sm font-semibold flex items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer">
                    <span className="material-symbols-outlined text-[18px] text-primary">playlist_add</span>
                    <span>Thêm hàng loạt</span>
                </button>
                <button onClick={(event) => { try { (function(event){ window.toggleMobileProfileDropdown() }).call(this, event); } catch(e){ console.error(e); } }} className="mobile-user-avatar lg:hidden w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden bg-cover bg-center active:scale-90 transition-transform cursor-pointer border border-outline-variant/30 shrink-0" aria-label="Hồ sơ">
                    <span className="material-symbols-outlined text-outline text-sm">person</span>
                </button>
            </div>
        </header>

        {/* THẺ TỔNG QUAN SRS & PHÂN BỐ TỪ VỰNG THEO CẤP ĐỘ (Khớp ảnh mẫu) */}
        <section className="bg-surface-container-lowest dark:bg-surface-container-low/60 rounded-3xl p-4 sm:p-6 border border-outline-variant/20 shadow-xs flex flex-col gap-3 sm:gap-4">
            {/* Header của thẻ */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[22px] icon-fill">published_with_changes</span>
                    <h2 className="font-bold text-sm sm:text-base text-on-surface">Tổng quan SRS</h2>
                    <button type="button" onClick={(event) => { try { (function(event){ window.openSRSExplainerModal() }).call(this, event); } catch(e){ console.error(e); } }} className="text-outline hover:text-primary transition-colors p-1 rounded-full cursor-pointer flex items-center justify-center" title="Tìm hiểu về thuật toán ghi nhớ SRS & 6 cấp độ">
                        <span className="material-symbols-outlined text-[18px]">help_outline</span>
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={(event) => { try { (function(event){ window._loadVocabularyPage(1) }).call(this, event); } catch(e){ console.error(e); } }} className="text-outline hover:text-primary transition-colors p-1.5 rounded-full hover:bg-surface-container cursor-pointer flex items-center justify-center" title="Làm mới dữ liệu">
                        <span className="material-symbols-outlined text-[18px]">refresh</span>
                    </button>
                </div>
            </div>

            {/* Card phân bố dạng viên thuốc (Match ảnh mẫu) */}
            <div className="bg-surface-container-low/50 dark:bg-surface-container/30 rounded-2xl p-3 sm:p-5 border border-outline-variant/15">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] sm:text-xs md:text-sm font-extrabold text-on-surface-variant tracking-wider uppercase">
                        Phân bố từ vựng theo cấp độ
                    </span>
                    <span id="vocab-total-summary-badge" className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                        0 từ
                    </span>
                </div>

                {/* 6 Cột viên thuốc Lvl 0 -> Lvl 5 */}
                <div className="grid grid-cols-6 gap-1 sm:gap-2 md:gap-3 items-end pt-2 pb-1 select-none">
                    {/* Lvl 0 */}
                    <div id="vocab-col-lv0" className="vocab-chart-col flex flex-col items-center group cursor-pointer p-1 sm:p-1.5 rounded-xl transition-all hover:bg-surface-container-high/60" onClick={(event) => { try { (function(event){ window.filterVocabLevel(0) }).call(this, event); } catch(e){ console.error(e); } }} title="Cấp 0: Chưa học / Mới tạo - Bấm để lọc">
                        <span id="vocab-mem-lv0-count" className="text-xs sm:text-sm font-bold text-on-surface mb-1.5 transition-transform group-hover:scale-110">0</span>
                        <div className="w-full flex items-end justify-center h-[95px] sm:h-[120px] md:h-[135px]">
                            <div id="vocab-mem-lv0-bar" className="w-5 sm:w-6 md:w-7 rounded-full transition-all duration-700 ease-out shadow-xs group-hover:brightness-95" style={{"backgroundColor":"#94a3b8","height":"10px"}}></div>
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-on-surface-variant mt-2 group-hover:text-primary transition-colors">Lvl 0</span>
                    </div>

                    {/* Lvl 1 */}
                    <div id="vocab-col-lv1" className="vocab-chart-col flex flex-col items-center group cursor-pointer p-1 sm:p-1.5 rounded-xl transition-all hover:bg-surface-container-high/60" onClick={(event) => { try { (function(event){ window.filterVocabLevel(1) }).call(this, event); } catch(e){ console.error(e); } }} title="Cấp 1: Mới bắt đầu ôn - Bấm để lọc">
                        <span id="vocab-mem-lv1-count" className="text-xs sm:text-sm font-bold text-on-surface mb-1.5 transition-transform group-hover:scale-110">0</span>
                        <div className="w-full flex items-end justify-center h-[95px] sm:h-[120px] md:h-[135px]">
                            <div id="vocab-mem-lv1-bar" className="w-5 sm:w-6 md:w-7 rounded-full transition-all duration-700 ease-out shadow-xs group-hover:brightness-95" style={{"backgroundColor":"#f97316","height":"10px"}}></div>
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-on-surface-variant mt-2 group-hover:text-primary transition-colors">Lvl 1</span>
                    </div>

                    {/* Lvl 2 */}
                    <div id="vocab-col-lv2" className="vocab-chart-col flex flex-col items-center group cursor-pointer p-1 sm:p-1.5 rounded-xl transition-all hover:bg-surface-container-high/60" onClick={(event) => { try { (function(event){ window.filterVocabLevel(2) }).call(this, event); } catch(e){ console.error(e); } }} title="Cấp 2: Đang làm quen - Bấm để lọc">
                        <span id="vocab-mem-lv2-count" className="text-xs sm:text-sm font-bold text-on-surface mb-1.5 transition-transform group-hover:scale-110">0</span>
                        <div className="w-full flex items-end justify-center h-[95px] sm:h-[120px] md:h-[135px]">
                            <div id="vocab-mem-lv2-bar" className="w-5 sm:w-6 md:w-7 rounded-full transition-all duration-700 ease-out shadow-xs group-hover:brightness-95" style={{"backgroundColor":"#f59e0b","height":"10px"}}></div>
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-on-surface-variant mt-2 group-hover:text-primary transition-colors">Lvl 2</span>
                    </div>

                    {/* Lvl 3 */}
                    <div id="vocab-col-lv3" className="vocab-chart-col flex flex-col items-center group cursor-pointer p-1 sm:p-1.5 rounded-xl transition-all hover:bg-surface-container-high/60" onClick={(event) => { try { (function(event){ window.filterVocabLevel(3) }).call(this, event); } catch(e){ console.error(e); } }} title="Cấp 3: Nhớ tương đối - Bấm để lọc">
                        <span id="vocab-mem-lv3-count" className="text-xs sm:text-sm font-bold text-on-surface mb-1.5 transition-transform group-hover:scale-110">0</span>
                        <div className="w-full flex items-end justify-center h-[95px] sm:h-[120px] md:h-[135px]">
                            <div id="vocab-mem-lv3-bar" className="w-5 sm:w-6 md:w-7 rounded-full transition-all duration-700 ease-out shadow-xs group-hover:brightness-95" style={{"backgroundColor":"#0ea5e9","height":"10px"}}></div>
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-on-surface-variant mt-2 group-hover:text-primary transition-colors">Lvl 3</span>
                    </div>

                    {/* Lvl 4 */}
                    <div id="vocab-col-lv4" className="vocab-chart-col flex flex-col items-center group cursor-pointer p-1 sm:p-1.5 rounded-xl transition-all hover:bg-surface-container-high/60" onClick={(event) => { try { (function(event){ window.filterVocabLevel(4) }).call(this, event); } catch(e){ console.error(e); } }} title="Cấp 4: Ghi nhớ vững - Bấm để lọc">
                        <span id="vocab-mem-lv4-count" className="text-xs sm:text-sm font-bold text-on-surface mb-1.5 transition-transform group-hover:scale-110">0</span>
                        <div className="w-full flex items-end justify-center h-[95px] sm:h-[120px] md:h-[135px]">
                            <div id="vocab-mem-lv4-bar" className="w-5 sm:w-6 md:w-7 rounded-full transition-all duration-700 ease-out shadow-xs group-hover:brightness-95" style={{"backgroundColor":"#a855f7","height":"10px"}}></div>
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-on-surface-variant mt-2 group-hover:text-primary transition-colors">Lvl 4</span>
                    </div>

                    {/* Lvl 5 */}
                    <div id="vocab-col-lv5" className="vocab-chart-col flex flex-col items-center group cursor-pointer p-1 sm:p-1.5 rounded-xl transition-all hover:bg-surface-container-high/60" onClick={(event) => { try { (function(event){ window.filterVocabLevel(5) }).call(this, event); } catch(e){ console.error(e); } }} title="Cấp 5: Đã thành thạo - Bấm để lọc">
                        <span id="vocab-mem-lv5-count" className="text-xs sm:text-sm font-bold text-on-surface mb-1.5 transition-transform group-hover:scale-110">0</span>
                        <div className="w-full flex items-end justify-center h-[95px] sm:h-[120px] md:h-[135px]">
                            <div id="vocab-mem-lv5-bar" className="w-5 sm:w-6 md:w-7 rounded-full transition-all duration-700 ease-out shadow-xs group-hover:brightness-95" style={{"backgroundColor":"#10b981","height":"10px"}}></div>
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-on-surface-variant mt-2 group-hover:text-primary transition-colors">Lvl 5</span>
                    </div>
                </div>
            </div>
        </section>

        {/* Section Heading: Danh sách từ đang học (Match ảnh mẫu) */}
        <div className="flex items-center justify-between pt-1">
            <h2 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-1.5">
                <span>Danh sách từ đang học</span>
                <span id="vocab-list-heading-count" className="text-xs sm:text-sm font-bold text-outline">(0)</span>
            </h2>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
                <input id="vocab-search" aria-label="Tìm kiếm từ vựng hoặc nghĩa tiếng Việt" onInput={(event) => { try { (function(event){ window._filterVocabList() }).call(this, event); } catch(e){ console.error(e); } }}
                       className="w-full pl-10 pr-9 py-2.5 bg-surface-container-low border border-outline-variant/25 focus:border-primary focus:bg-surface transition-all outline-none rounded-2xl text-xs sm:text-sm text-on-surface placeholder:text-outline/70 shadow-2xs"
                       placeholder="Tìm kiếm từ vựng, nghĩa tiếng Việt..."/>
                <button id="vocab-search-clear" onClick={(event) => { try { (function(event){ window.clearVocabSearch() }).call(this, event); } catch(e){ console.error(e); } }} className="hidden absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
            </div>

            {/* Topic Filter Dropdown */}
            <div className="flex items-center gap-2">
                <select id="vocab-topic-filter" onChange={(event) => { try { (function(event){ window.onVocabTopicFilterChange(this.value) }).call(this, event); } catch(e){ console.error(e); } }}
                        className="bg-surface-container-low border border-outline-variant/25 rounded-2xl px-3 py-2 text-xs font-semibold text-on-surface focus:outline-none focus:border-primary cursor-pointer transition-colors shadow-2xs max-w-[200px] truncate">
                    <option value="">📁 Tất cả chủ đề</option>
                    {/* Populated dynamically */}
                </select>
            </div>
        </div>

        {/* Pill Filter Badges (Levels) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs font-semibold no-scrollbar" id="vocab-level-pills">
            <button onClick={(event) => { try { (function(event){ window.filterVocabLevel(null) }).call(this, event); } catch(e){ console.error(e); } }} data-level="all"
                    className="vocab-pill px-3 py-1.5 rounded-full bg-primary text-on-primary shadow-xs shrink-0 cursor-pointer transition-all">
                Tất cả
            </button>
            <button onClick={(event) => { try { (function(event){ window.filterVocabLevel(-1) }).call(this, event); } catch(e){ console.error(e); } }} data-level="-1"
                    className="vocab-pill px-3 py-1.5 rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-high shrink-0 cursor-pointer transition-all flex items-center gap-1">
                <span>⏰ Cần ôn</span>
            </button>
            <button onClick={(event) => { try { (function(event){ window.filterVocabLevel(0) }).call(this, event); } catch(e){ console.error(e); } }} data-level="0"
                    className="vocab-pill px-3 py-1.5 rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-high shrink-0 cursor-pointer transition-all">
                Lvl 0
            </button>
            <button onClick={(event) => { try { (function(event){ window.filterVocabLevel(1) }).call(this, event); } catch(e){ console.error(e); } }} data-level="1"
                    className="vocab-pill px-3 py-1.5 rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-high shrink-0 cursor-pointer transition-all">
                Lvl 1
            </button>
            <button onClick={(event) => { try { (function(event){ window.filterVocabLevel(2) }).call(this, event); } catch(e){ console.error(e); } }} data-level="2"
                    className="vocab-pill px-3 py-1.5 rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-high shrink-0 cursor-pointer transition-all">
                Lvl 2
            </button>
            <button onClick={(event) => { try { (function(event){ window.filterVocabLevel(3) }).call(this, event); } catch(e){ console.error(e); } }} data-level="3"
                    className="vocab-pill px-3 py-1.5 rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-high shrink-0 cursor-pointer transition-all">
                Lvl 3
            </button>
            <button onClick={(event) => { try { (function(event){ window.filterVocabLevel(4) }).call(this, event); } catch(e){ console.error(e); } }} data-level="4"
                    className="vocab-pill px-3 py-1.5 rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-high shrink-0 cursor-pointer transition-all">
                Lvl 4
            </button>
            <button onClick={(event) => { try { (function(event){ window.filterVocabLevel(5) }).call(this, event); } catch(e){ console.error(e); } }} data-level="5"
                    className="vocab-pill px-3 py-1.5 rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-high shrink-0 cursor-pointer transition-all">
                Lvl 5
            </button>
        </div>

        {/* Vocabulary List Container */}
        <div id="vocab-list" className="flex flex-col gap-3 flex-1 min-h-[300px]">
            <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant gap-3">
                <span className="material-symbols-outlined text-primary text-[40px] animate-spin">refresh</span>
                <p className="text-xs sm:text-sm font-medium">Đang tải sổ từ của bạn...</p>
            </div>
        </div>

        {/* Pagination */}
        <div id="vocab-pagination" className="hidden flex items-center justify-center gap-2 py-4 flex-wrap"></div>
    </div>
</main>

{/* Mobile Floating Action Button (FAB) for adding words quickly */}
<button onClick={(event) => { try { (function(event){ window.openVocabAddModal() }).call(this, event); } catch(e){ console.error(e); } }}
        className="lg:hidden fixed bottom-20 right-5 z-40 w-13 h-13 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.35)] active:scale-90 transition-transform cursor-pointer border border-white/20"
        title="Thêm từ mới vào Sổ từ" aria-label="Thêm từ vựng">
    <span className="material-symbols-outlined text-[28px]">add</span>
</button>
</div>
    </>
  );
}

export default PageVocabulary;
