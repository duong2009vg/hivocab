// Generated 1:1 Pixel-Perfect Component: PageThptRoom
import React from 'react';

export function PageThptRoom() {
  return (
    <>
<div id="page-thpt-room" className="page fixed inset-0 z-[100] bg-[#f4f6f9] flex flex-col h-screen w-screen overflow-hidden">
    {/* Top Header: Siêu gọn gàng 1 hàng duy nhất (~38px), tối ưu không gian hiển thị bài thi */}
    <header className="h-[38px] min-h-[38px] max-h-[38px] bg-[#1a365d] text-white px-3 md:px-4 flex items-center justify-between border-b border-[#2b4c7e] shrink-0 shadow-sm z-30 select-none">
        {/* Left: Kỳ thi & Thí sinh */}
        <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-blue-600/40 border border-blue-400/30 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-white text-[16px]">school</span>
            </div>
            <div className="min-w-0 flex items-center gap-1.5">
                <span className="text-xs font-black tracking-wide uppercase text-blue-200 truncate">THPT TIẾNG ANH</span>
                <span id="exam-candidate-sbd" className="text-amber-300 font-mono font-bold text-[10px] bg-[#0f2342] px-1.5 py-0.5 rounded border border-blue-400/20 shrink-0">SBD: 10082401</span>
                <span id="exam-candidate-name" className="hidden xl:inline-block text-[11px] text-slate-300 font-medium truncate max-w-[120px]">Thí sinh</span>
                <span id="exam-date" className="hidden"></span>
            </div>
        </div>

        {/* Center: Điều hướng câu hỏi + Đồng hồ bấm giờ + Tiến độ */}
        <div className="flex items-center gap-1.5 md:gap-2.5">
            {/* Quick Question Switcher */}
            <div className="flex items-center bg-[#0f2342] border border-blue-400/30 rounded-lg p-0.5">
                <button type="button" onClick={(event) => { try { (function(event){ window.ThptExam.prevQuestion() }).call(this, event); } catch(e){ console.error(e); } }} className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer" title="Câu trước (←)">
                    <span className="material-symbols-outlined text-[15px]">chevron_left</span>
                </button>
                <div className="px-1.5 text-[11px] font-mono font-bold text-blue-100 whitespace-nowrap">
                    Câu <span id="exam-current-q-num">1</span>/40
                </div>
                <button type="button" onClick={(event) => { try { (function(event){ window.ThptExam.nextQuestion() }).call(this, event); } catch(e){ console.error(e); } }} className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer" title="Câu kế tiếp (→ hoặc Enter)">
                    <span className="material-symbols-outlined text-[15px]">chevron_right</span>
                </button>
            </div>

            {/* Timer Display */}
            <div id="exam-timer-wrapper" className="flex items-center gap-1 bg-[#0f2342] border border-blue-400/30 px-2 py-0.5 rounded-lg shadow-inner text-white">
                <span className="material-symbols-outlined text-[15px] text-amber-400">timer</span>
                <span id="exam-timer-display" className="font-mono text-xs md:text-sm font-black tracking-wider text-amber-300">50:00</span>
            </div>

            {/* Progress Badge */}
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-blue-200 bg-blue-900/50 border border-blue-400/20 px-2 py-0.5 rounded-lg">
                <span className="material-symbols-outlined text-[13px] text-emerald-400">task_alt</span>
                <span id="exam-answered-count">0 / 40</span>
            </div>
        </div>

        {/* Right: Tiện ích & Nộp bài */}
        <div className="flex items-center gap-1 md:gap-1.5 shrink-0">
            {/* Mobile View Switcher (Visible only on small screens) */}
            <div className="flex md:hidden items-center bg-[#0f2342] border border-blue-400/30 p-0.5 rounded-lg text-[10px] font-bold">
                <button type="button" id="btn-view-passage" onClick={(event) => { try { (function(event){ window.ThptExam.setMobileView('passage') }).call(this, event); } catch(e){ console.error(e); } }} className="px-1.5 py-0.5 rounded text-slate-300 hover:text-white">Đọc</button>
                <button type="button" id="btn-view-both" onClick={(event) => { try { (function(event){ window.ThptExam.setMobileView('both') }).call(this, event); } catch(e){ console.error(e); } }} className="px-1.5 py-0.5 rounded bg-blue-600 text-white">2 bên</button>
                <button type="button" id="btn-view-questions" onClick={(event) => { try { (function(event){ window.ThptExam.setMobileView('questions') }).call(this, event); } catch(e){ console.error(e); } }} className="px-1.5 py-0.5 rounded text-slate-300 hover:text-white">Câu</button>
            </div>

            {/* Font size */}
            <div className="hidden lg:flex items-center gap-0.5 bg-[#0f2342] border border-blue-400/30 p-0.5 rounded-lg">
                <button onClick={(event) => { try { (function(event){ window.ThptExam.changeFontSize(-1) }).call(this, event); } catch(e){ console.error(e); } }} className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer" title="Giảm cỡ chữ">A-</button>
                <button onClick={(event) => { try { (function(event){ window.ThptExam.changeFontSize(1) }).call(this, event); } catch(e){ console.error(e); } }} className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer" title="Tăng cỡ chữ">A+</button>
            </div>

            {/* Report Exam / Question */}
            <button type="button" onClick={(event) => { try { (function(event){ window.ThptExam && window.ThptExam.openCurrentQuestionReport ? window.ThptExam.openCurrentQuestionReport() : window.openBugReportModal({ feature: 'thpt_exam' }) }).call(this, event); } catch(e){ console.error(e); } }} className="p-1 rounded-lg text-slate-300 hover:text-amber-300 hover:bg-white/10 transition-colors cursor-pointer" title="Báo cáo lỗi câu hỏi/đề thi">
                <span className="material-symbols-outlined text-[18px]">flag</span>
            </button>

            {/* Fullscreen */}
            <button onClick={(event) => { try { (function(event){ window.ThptExam.toggleFullscreen() }).call(this, event); } catch(e){ console.error(e); } }} className="hidden sm:flex w-6 h-6 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 items-center justify-center transition-colors cursor-pointer" title="Toàn màn hình">
                <span className="material-symbols-outlined text-[16px]">fullscreen</span>
            </button>

            {/* Submit Button (Test Mode) */}
            <button id="btn-submit-exam" onClick={(event) => { try { (function(event){ window.ThptExam.confirmSubmit() }).call(this, event); } catch(e){ console.error(e); } }} className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs uppercase tracking-wider shadow hover:shadow-md transition-all flex items-center gap-1 cursor-pointer">
                <span className="material-symbols-outlined text-[14px]">send</span>
                <span>NỘP BÀI</span>
            </button>

            {/* Review Mode Score / Retake Button */}
            <button id="btn-exam-review-score" onClick={(event) => { try { (function(event){ window.ThptExam.showResultsModal(window.ThptExam.results) }).call(this, event); } catch(e){ console.error(e); } }} className="hidden px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider shadow hover:shadow-md transition-all flex items-center gap-1 cursor-pointer" title="Xem lại bảng điểm &amp; thống kê">
                <span className="material-symbols-outlined text-[14px]">military_tech</span>
                <span>KẾT QUẢ</span>
            </button>

            {/* Exit Button */}
            <button onClick={(event) => { try { (function(event){ window.ThptExam.exitRoom() }).call(this, event); } catch(e){ console.error(e); } }} className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer" title="Thoát phòng thi">
                <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
        </div>
    </header>

    {/* Main Body: Split View 2 Cột Độc Lập với Thanh Ngăn Cách Kéo Thả */}
    <div id="exam-split-container" className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 relative">
        {/* Cột Trái: Ngữ liệu / Toàn bộ bài đọc có thể cuộn tự do */}
        <div id="exam-left-col" className="w-full md:w-1/2 flex flex-col bg-white overflow-hidden min-h-0 h-1/2 md:h-full">
            <div className="h-[28px] min-h-[28px] max-h-[28px] px-3 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between shrink-0 gap-2 select-none">
                <div className="flex items-center gap-1.5 shrink-0">
                    <span className="material-symbols-outlined text-blue-600 text-[16px]">menu_book</span>
                    <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700">Ngữ Liệu Đề Bài</span>
                </div>
                <div id="exam-passage-nav-pills" className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-0.5 max-w-full">
                    {/* Quick section jump buttons rendered by JS */}
                </div>
            </div>
            <div id="exam-passage-content" className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6 select-text space-y-4 font-sans leading-relaxed text-slate-800">
                {/* Continuous passage sections and sentence arrangement cards rendered by JS */}
            </div>
        </div>

        {/* Draggable Split Divider (Thanh kéo ngăn cách trái/phải tùy chỉnh) */}
        <div id="exam-drag-divider" 
             className="hidden md:flex w-2 hover:w-2.5 bg-slate-200 hover:bg-blue-500 active:bg-blue-600 cursor-col-resize items-center justify-center transition-all group shrink-0 select-none z-20" 
             title="Kéo sang trái hoặc phải để điều chỉnh tỷ lệ hiển thị 2 cột">
            <div className="w-0.5 h-6 rounded-full bg-slate-400 group-hover:bg-white group-active:bg-white transition-colors pointer-events-none"></div>
        </div>

        {/* Cột Phải: Câu hỏi & Phương án trắc nghiệm */}
        <div id="exam-right-col" className="w-full md:w-1/2 flex flex-col bg-slate-50/70 overflow-hidden min-h-0 h-1/2 md:h-full border-l border-slate-200 md:border-l-0">
            <div className="h-[28px] min-h-[28px] max-h-[28px] px-3 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between shrink-0 select-none">
                <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[16px]">checklist</span>
                    <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700">Câu Hỏi &amp; Phương Án</span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">Phím tắt: 1, 2, 3, 4 (hoặc A, B, C, D)</span>
            </div>
            <div id="exam-questions-list" className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6 space-y-4 font-sans">
                {/* Rendered by JS with ID q-options-X */}
            </div>
        </div>
    </div>

    {/* Bottom Bar: Dãy 40 số câu hỏi siêu gọn (Single-Row Compact, 34px) */}
    <div id="exam-bottom-bar" className="h-[34px] min-h-[34px] max-h-[34px] bg-[#0f172a] text-white border-t border-slate-700 px-2 flex items-center justify-between gap-1.5 shrink-0 z-30 select-none">
        <div className="hidden xl:flex items-center gap-1 text-[10px] font-bold text-slate-400 shrink-0 uppercase tracking-wider">
            <span className="material-symbols-outlined text-[13px] text-blue-400">grid_view</span>
            <span>40 CÂU:</span>
        </div>
        <div id="exam-palette-container" className="flex-1 flex items-center justify-between gap-1 overflow-x-auto scrollbar-hide py-0.5">
            {/* 40 Question Bubbles rendered by JS */}
        </div>
    </div>
</div>
    </>
  );
}

export default PageThptRoom;
