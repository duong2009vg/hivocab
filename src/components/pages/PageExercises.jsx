// Generated 1:1 Pixel-Perfect Component: PageExercises
import React from 'react';

export function PageExercises() {
  return (
    <>
<div id="page-exercises" className="page">
<main className="lg:ml-64 min-h-screen mobile-page-top lg:pt-8 pb-28 lg:pb-12 px-4 sm:px-6 lg:px-12 flex flex-col">
    <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col gap-6 fade-in">

        {/* Header */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[30px]">school</span>
                    <h1 className="text-2xl font-bold text-on-surface">Luyện Thi THPT Quốc Gia</h1>
                </div>
                <p className="text-sm text-on-surface-variant mt-1">Hệ thống phòng thi máy tính chuẩn Bộ GD&ĐT môn Tiếng Anh (40 câu / 50 phút)</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-surface-container-low px-3.5 py-2 rounded-xl border border-outline-variant/30">
                <span className="material-symbols-outlined text-[18px] text-emerald-600">verified</span>
                <span>Bộ đề thi chuẩn kèm đáp án &amp; giải thích chi tiết</span>
            </div>
        </section>

        {/* Mobile Recommendation Notice */}
        <div className="lg:hidden p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 flex items-start gap-3 text-xs leading-relaxed">
            <span className="material-symbols-outlined text-amber-600 shrink-0 text-xl">devices</span>
            <div>
                <p className="font-bold text-amber-950">Khuyến nghị thiết bị làm bài thi:</p>
                <p className="text-amber-900 mt-0.5">Giao diện thi thử THPT Quốc Gia (CBT) được thiết kế chuyên biệt cho màn hình Máy tính (Desktop/Laptop) hoặc Tablet lớn. Vui lòng truy cập trên máy tính để có trải nghiệm thi tốt nhất.</p>
            </div>
        </div>

        {/* THPT Exams Search Bar */}
        <div className="bg-surface-container-lowest/80 backdrop-blur-[24px] border border-outline-variant/30 rounded-2xl p-3 sm:p-4 soft-shadow flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none select-none">search</span>
                <input id="thpt-search-input" 
                       type="text" 
                       aria-label="Tìm kiếm đề thi THPT Quốc Gia"
                       onInput={(event) => { try { (function(event){ window.ThptExam && window.ThptExam.onSearchInput(this.value) }).call(this, event); } catch(e){ console.error(e); } }}
                       onKeydown={(event) => { try { (function(event){ if(event.key==='Escape') window.ThptExam && window.ThptExam.clearSearch() }).call(this, event); } catch(e){ console.error(e); } }}
                       placeholder="Tìm kiếm đề thi (theo tên trường, tỉnh/thành phố, số đề...)..."
                       className="w-full bg-surface-container-low/60 border border-outline-variant/30 focus:border-primary focus:bg-surface-container-lowest rounded-xl pl-10 pr-9 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                       autoComplete="off" spellcheck="false" />
                <button id="thpt-search-clear" 
                        type="button"
                        onClick={(event) => { try { (function(event){ window.ThptExam && window.ThptExam.clearSearch() }).call(this, event); } catch(e){ console.error(e); } }} 
                        className="hidden absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1 rounded-full hover:bg-surface-container-high transition-colors cursor-pointer" 
                        title="Xóa tìm kiếm">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
            </div>
            <div id="thpt-search-count" className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5 px-1 sm:px-2 shrink-0 select-none">
                <span className="material-symbols-outlined text-[16px] text-primary">description</span>
                <span>Đang tải danh sách đề...</span>
            </div>
        </div>

        {/* THPT Exams Grid */}
        <div id="thpt-exams-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="flex items-center justify-center py-16 col-span-full">
                <span className="material-symbols-outlined text-primary text-[40px] animate-spin">refresh</span>
            </div>
        </div>
    </div>
</main>
</div>
    </>
  );
}

export default PageExercises;
