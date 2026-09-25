// Generated 1:1 Pixel-Perfect Component: PageDashboard
import React from 'react';

export function PageDashboard() {
  return (
    <>
<div id="page-dashboard" className="page">
<main className="lg:ml-64 min-h-screen mobile-page-top lg:pt-8 pb-28 lg:pb-12 px-4 sm:px-6 lg:px-12 flex flex-col">
    <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col gap-6 lg:gap-8 fade-in">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
                <h1 className="text-2xl md:text-headline-lg font-bold text-on-surface">Trang chủ</h1>
                <p className="text-sm md:text-body-lg text-on-surface-variant mt-0.5 sm:mt-1">Hôm nay là một ngày tuyệt vời để học.</p>
            </div>
            <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-between sm:justify-end">
                <div className="glass-card px-4 py-2 rounded-full flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#FF5722] icon-fill text-lg">local_fire_department</span>
                    <span id="dashboard-streak-badge" className="font-bold text-sm text-on-surface">— Ngày</span>
                </div>
                <button onClick={(event) => { try { (function(event){ window.toggleMobileProfileDropdown() }).call(this, event); } catch(e){ console.error(e); } }} id="mobile-profile-avatar" className="mobile-user-avatar lg:hidden w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden bg-cover bg-center active:scale-90 transition-transform cursor-pointer border border-outline-variant/30 shrink-0" aria-label="Hồ sơ">
                    <span className="material-symbols-outlined text-outline text-sm">person</span>
                </button>
            </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            <section className="glass-card rounded-xl p-6 lg:p-8 lg:col-span-7 flex flex-col justify-center items-center text-center min-h-[260px] lg:min-h-[320px] relative overflow-hidden group">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-fixed rounded-full blur-3xl opacity-30"></div>

                {/* TRẠNG THÁI: SẴN SÀNG ÔN TẬP */}
                <div id="dash-ready-state" className="flex flex-col items-center gap-4 z-10">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-1">
                        <span className="material-symbols-outlined text-primary text-[36px] icon-fill">menu_book</span>
                    </div>
                    <h2 className="text-xl md:text-headline-md font-bold text-on-surface">Đến giờ ôn tập!</h2>
                    <p id="dashboard-words-due-text" className="text-sm md:text-body-md text-on-surface-variant max-w-md">Đang tải dữ liệu...</p>
                    <button id="dash-start-btn" onClick={(event) => { try { (function(event){ startSession() }).call(this, event); } catch(e){ console.error(e); } }} className="bg-primary text-on-primary px-7 py-3 rounded-full font-semibold text-sm shadow-xs hover:opacity-95 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer">
                        <span className="material-symbols-outlined text-[20px]">play_arrow</span>Ôn tập ngay
                    </button>
                </div>

                {/* TRẠNG THÁI: ĐẾM NGƯỢC */}
                <div id="dash-countdown-state" className="hidden flex-col items-center gap-3 z-10">
                    <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-1">
                        <span className="material-symbols-outlined text-outline text-[34px]">schedule</span>
                    </div>
                    <h2 className="text-xl md:text-headline-md font-bold text-on-surface">Lần ôn tập kế tiếp</h2>
                    <p className="text-sm text-on-surface-variant max-w-xs">Hoàn thành hôm nay! Quay lại sau:</p>
                    {/* Đồng hồ đếm ngược */}
                    <div className="flex items-center gap-2 my-1">
                        <div className="flex flex-col items-center bg-surface-container-high px-4 py-3 rounded-xl min-w-[64px]">
                            <span id="cd-hours" className="text-2xl md:text-3xl font-bold text-on-surface font-mono">00</span>
                            <span className="text-[10px] text-outline uppercase tracking-widest mt-0.5">Giờ</span>
                        </div>
                        <span className="text-2xl font-bold text-outline">:</span>
                        <div className="flex flex-col items-center bg-surface-container-high px-4 py-3 rounded-xl min-w-[64px]">
                            <span id="cd-minutes" className="text-2xl md:text-3xl font-bold text-on-surface font-mono">00</span>
                            <span className="text-[10px] text-outline uppercase tracking-widest mt-0.5">Phút</span>
                        </div>
                        <span className="text-2xl font-bold text-outline">:</span>
                        <div className="flex flex-col items-center bg-surface-container-high px-4 py-3 rounded-xl min-w-[64px]">
                            <span id="cd-seconds" className="text-2xl md:text-3xl font-bold text-on-surface font-mono">00</span>
                            <span className="text-[10px] text-outline uppercase tracking-widest mt-0.5">Giây</span>
                        </div>
                    </div>
                    <p id="cd-next-label" className="text-xs text-outline"></p>
                </div>

                {/* TRẠNG THÁI: CHƯA CÓ TỪ NÀO ĐỂ ÔN TẬP (EMPTY STATE CHO USER MỚI) */}
                <div id="dash-empty-state" className="hidden flex-col items-center gap-4 z-10">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-1">
                        <span className="material-symbols-outlined text-primary text-[36px] icon-fill">school</span>
                    </div>
                    <h2 className="text-xl md:text-headline-md font-bold text-on-surface">Bắt đầu hành trình học từ vựng!</h2>
                    <p className="text-sm md:text-body-md text-on-surface-variant max-w-md">Bạn chưa có từ vựng nào trong danh sách ôn tập. Hãy chọn một chủ đề để bắt đầu học những từ mới đầu tiên nhé!</p>
                    <button onClick={(event) => { try { (function(event){ navigateTo('topics') }).call(this, event); } catch(e){ console.error(e); } }} className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-semibold text-sm shadow-xs hover:opacity-95 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer">
                        <span className="material-symbols-outlined text-[18px]">explore</span>Khám phá chủ đề
                    </button>
                </div>
            </section>
            
            {/* THẺ PHÂN BỐ TỪ VỰNG THEO CẤP ĐỘ (VERTICAL PILL CHART) */}
            <section className="glass-card rounded-2xl p-5 sm:p-6 lg:p-7 lg:col-span-5 flex flex-col justify-between min-h-[260px] lg:min-h-[320px] relative overflow-hidden">
                <div className="flex items-center justify-between gap-2 mb-2 sm:mb-4">
                    <div>
                        <h3 className="text-[10px] md:text-xs font-extrabold text-outline uppercase tracking-wider mb-0.5">Trạng thái bộ nhớ</h3>
                        <div className="text-base sm:text-lg lg:text-xl font-bold text-on-surface">Phân bố từ vựng theo cấp độ</div>
                    </div>
                    <button onClick={(event) => { try { (function(event){ navigateTo('vocabulary') }).call(this, event); } catch(e){ console.error(e); } }} className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer shrink-0" title="Xem danh sách từ trong Sổ từ">
                        Chi tiết <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                </div>

                {/* 6 Cột Cấp độ (Lvl 0 -> Lvl 5) */}
                <div className="flex-1 flex items-end justify-between gap-1.5 sm:gap-2 md:gap-3 pt-3 pb-1 select-none">
                    {/* Lvl 0 */}
                    <div className="flex-1 flex flex-col items-center group cursor-pointer" onClick={(event) => { try { (function(event){ navigateTo('vocabulary'); setTimeout(() => window.filterVocabLevel(0), 150); }).call(this, event); } catch(e){ console.error(e); } }} title="Cấp 0: Chưa học / Mới tạo - Bấm để lọc">
                        <span id="mem-lv0-count" className="text-xs sm:text-sm font-bold text-on-surface mb-1.5 transition-transform group-hover:scale-110">0</span>
                        <div className="w-full flex items-end justify-center h-[120px] sm:h-[135px] lg:h-[150px]">
                            <div id="mem-lv0-bar" className="w-5 sm:w-6 lg:w-7 rounded-full transition-all duration-700 ease-out group-hover:brightness-95 shadow-sm" style={{"backgroundColor":"#94a3b8","height":"10px"}}></div>
                        </div>
                        <span className="text-[11px] sm:text-xs font-bold text-on-surface-variant mt-2 group-hover:text-primary transition-colors">Lvl 0</span>
                    </div>

                    {/* Lvl 1 */}
                    <div className="flex-1 flex flex-col items-center group cursor-pointer" onClick={(event) => { try { (function(event){ navigateTo('vocabulary'); setTimeout(() => window.filterVocabLevel(1), 150); }).call(this, event); } catch(e){ console.error(e); } }} title="Cấp 1: Mới bắt đầu ôn - Bấm để lọc">
                        <span id="mem-lv1-count" className="text-xs sm:text-sm font-bold text-on-surface mb-1.5 transition-transform group-hover:scale-110">0</span>
                        <div className="w-full flex items-end justify-center h-[120px] sm:h-[135px] lg:h-[150px]">
                            <div id="mem-lv1-bar" className="w-5 sm:w-6 lg:w-7 rounded-full transition-all duration-700 ease-out group-hover:brightness-95 shadow-sm" style={{"backgroundColor":"#f97316","height":"10px"}}></div>
                        </div>
                        <span className="text-[11px] sm:text-xs font-bold text-on-surface-variant mt-2 group-hover:text-primary transition-colors">Lvl 1</span>
                    </div>

                    {/* Lvl 2 */}
                    <div className="flex-1 flex flex-col items-center group cursor-pointer" onClick={(event) => { try { (function(event){ navigateTo('vocabulary'); setTimeout(() => window.filterVocabLevel(2), 150); }).call(this, event); } catch(e){ console.error(e); } }} title="Cấp 2: Đang làm quen - Bấm để lọc">
                        <span id="mem-lv2-count" className="text-xs sm:text-sm font-bold text-on-surface mb-1.5 transition-transform group-hover:scale-110">0</span>
                        <div className="w-full flex items-end justify-center h-[120px] sm:h-[135px] lg:h-[150px]">
                            <div id="mem-lv2-bar" className="w-5 sm:w-6 lg:w-7 rounded-full transition-all duration-700 ease-out group-hover:brightness-95 shadow-sm" style={{"backgroundColor":"#f59e0b","height":"10px"}}></div>
                        </div>
                        <span className="text-[11px] sm:text-xs font-bold text-on-surface-variant mt-2 group-hover:text-primary transition-colors">Lvl 2</span>
                    </div>

                    {/* Lvl 3 */}
                    <div className="flex-1 flex flex-col items-center group cursor-pointer" onClick={(event) => { try { (function(event){ navigateTo('vocabulary'); setTimeout(() => window.filterVocabLevel(3), 150); }).call(this, event); } catch(e){ console.error(e); } }} title="Cấp 3: Nhớ tương đối - Bấm để lọc">
                        <span id="mem-lv3-count" className="text-xs sm:text-sm font-bold text-on-surface mb-1.5 transition-transform group-hover:scale-110">0</span>
                        <div className="w-full flex items-end justify-center h-[120px] sm:h-[135px] lg:h-[150px]">
                            <div id="mem-lv3-bar" className="w-5 sm:w-6 lg:w-7 rounded-full transition-all duration-700 ease-out group-hover:brightness-95 shadow-sm" style={{"backgroundColor":"#0ea5e9","height":"10px"}}></div>
                        </div>
                        <span className="text-[11px] sm:text-xs font-bold text-on-surface-variant mt-2 group-hover:text-primary transition-colors">Lvl 3</span>
                    </div>

                    {/* Lvl 4 */}
                    <div className="flex-1 flex flex-col items-center group cursor-pointer" onClick={(event) => { try { (function(event){ navigateTo('vocabulary'); setTimeout(() => window.filterVocabLevel(4), 150); }).call(this, event); } catch(e){ console.error(e); } }} title="Cấp 4: Ghi nhớ vững - Bấm để lọc">
                        <span id="mem-lv4-count" className="text-xs sm:text-sm font-bold text-on-surface mb-1.5 transition-transform group-hover:scale-110">0</span>
                        <div className="w-full flex items-end justify-center h-[120px] sm:h-[135px] lg:h-[150px]">
                            <div id="mem-lv4-bar" className="w-5 sm:w-6 lg:w-7 rounded-full transition-all duration-700 ease-out group-hover:brightness-95 shadow-sm" style={{"backgroundColor":"#a855f7","height":"10px"}}></div>
                        </div>
                        <span className="text-[11px] sm:text-xs font-bold text-on-surface-variant mt-2 group-hover:text-primary transition-colors">Lvl 4</span>
                    </div>

                    {/* Lvl 5 */}
                    <div className="flex-1 flex flex-col items-center group cursor-pointer" onClick={(event) => { try { (function(event){ navigateTo('vocabulary'); setTimeout(() => window.filterVocabLevel(5), 150); }).call(this, event); } catch(e){ console.error(e); } }} title="Cấp 5: Đã thành thạo - Bấm để lọc">
                        <span id="mem-lv5-count" className="text-xs sm:text-sm font-bold text-on-surface mb-1.5 transition-transform group-hover:scale-110">0</span>
                        <div className="w-full flex items-end justify-center h-[120px] sm:h-[135px] lg:h-[150px]">
                            <div id="mem-lv5-bar" className="w-5 sm:w-6 lg:w-7 rounded-full transition-all duration-700 ease-out group-hover:brightness-95 shadow-sm" style={{"backgroundColor":"#10b981","height":"10px"}}></div>
                        </div>
                        <span className="text-[11px] sm:text-xs font-bold text-on-surface-variant mt-2 group-hover:text-primary transition-colors">Lvl 5</span>
                    </div>
                </div>
            </section>
        </div>

        {/* BANNER ĐẶC QUYỀN: PHÒNG LUYỆN ĐỀ THPT QUỐC GIA (Apple-inspired Design) */}
        <section className="glass-card rounded-3xl p-6 sm:p-7 lg:p-8 relative overflow-hidden group border border-outline-variant/25 transition-all hover:border-primary/40 hover:shadow-xl">
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/15 transition-colors"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-start gap-4 sm:gap-5 max-w-2xl">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-xs group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-[32px] sm:text-[36px] icon-fill">school</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/20">Phòng thi trực tuyến</span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-surface-container-high text-on-surface-variant">38+ Đề thi chuẩn CBT</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight">Phòng Luyện Đề THPT Quốc Gia</h2>
                        <p className="text-xs sm:text-sm text-on-surface-variant mt-1 leading-relaxed">
                            Luyện thi trắc nghiệm tiếng Anh chuẩn cấu trúc Đề thi Tốt nghiệp THPT mới nhất. Giao diện làm bài chuẩn CBT, bấm giờ 50 phút thực tế, thanh điều hướng câu hỏi tức thì và lời giải thích chi tiết từng câu.
                        </p>
                        <div className="flex items-center gap-3 sm:gap-4 mt-3 text-[11px] sm:text-xs text-outline flex-wrap font-medium">
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[15px] text-emerald-500">check_circle</span>Chuẩn ma trận BGD</span>
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[15px] text-emerald-500">check_circle</span>Bấm giờ tự động</span>
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[15px] text-emerald-500">check_circle</span>Giải thích chi tiết</span>
                        </div>
                    </div>
                </div>
                <div className="w-full md:w-auto flex md:flex-col sm:flex-row items-stretch md:items-end justify-end gap-3 shrink-0">
                    <button onClick={(event) => { try { (function(event){ navigateTo('exercises') }).call(this, event); } catch(e){ console.error(e); } }} className="w-full md:w-auto bg-primary text-on-primary hover:bg-surface-tint font-bold text-sm px-6 py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
                        <span>Vào phòng thi ngay</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                </div>
            </div>
        </section>

        {/* HÀNG 2: LỊCH GIỮ LỬA & MỤC TIÊU IELTS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 lg:gap-8">
            
            {/* THẺ 1: LỊCH GIỮ LỬA (FLAME ACTIVITY CALENDAR) */}
            <section className="glass-card rounded-2xl p-4 sm:p-5 md:p-6 lg:p-7 lg:col-span-7 flex flex-col justify-between relative overflow-hidden">
                <div>
                    {/* Header Lịch: Responsive Đa Tầng cho Mobile */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-[#FF5722] shrink-0">
                                <span className="material-symbols-outlined text-[24px] icon-fill">local_fire_department</span>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-base sm:text-lg font-bold text-on-surface">Lịch giữ lửa</h3>
                                    <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[#FF5722] bg-orange-500/10 px-2.5 py-0.5 rounded-full">
                                        <span id="flame-streak-count">0</span> ngày liên tiếp
                                    </span>
                                </div>
                                <p className="text-[11px] sm:text-xs text-on-surface-variant">Mức độ chuyên cần ôn luyện mỗi ngày</p>
                            </div>
                        </div>
                        
                        {/* Bộ chuyển tháng: Căn chỉnh ngay ngắn, chống tràn viền */}
                        <div className="flex items-center justify-between sm:justify-end gap-1 bg-surface-container-low px-2.5 py-1.5 rounded-xl border border-outline-variant/20 self-start sm:self-auto w-full sm:w-auto">
                            <button onClick={(event) => { try { (function(event){ calPrevMonth() }).call(this, event); } catch(e){ console.error(e); } }} className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors touch-manipulation" title="Tháng trước">
                                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                            </button>
                            <span id="flame-calendar-title" className="text-xs font-bold text-on-surface min-w-[95px] text-center select-none">Tháng ..., ....</span>
                            <button onClick={(event) => { try { (function(event){ calNextMonth() }).call(this, event); } catch(e){ console.error(e); } }} className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors touch-manipulation" title="Tháng sau">
                                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                            </button>
                        </div>
                    </div>

                    {/* Ngày trong tuần header (T2 .. CN) */}
                    <div className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-2 mb-2 text-center select-none">
                        <span className="text-[10px] sm:text-[11px] font-bold text-outline uppercase py-0.5">T2</span>
                        <span className="text-[10px] sm:text-[11px] font-bold text-outline uppercase py-0.5">T3</span>
                        <span className="text-[10px] sm:text-[11px] font-bold text-outline uppercase py-0.5">T4</span>
                        <span className="text-[10px] sm:text-[11px] font-bold text-outline uppercase py-0.5">T5</span>
                        <span className="text-[10px] sm:text-[11px] font-bold text-outline uppercase py-0.5">T6</span>
                        <span className="text-[10px] sm:text-[11px] font-bold text-outline uppercase py-0.5">T7</span>
                        <span className="text-[10px] sm:text-[11px] font-bold text-primary uppercase py-0.5">CN</span>
                    </div>

                    {/* Lưới ngày (render bởi HiDashboard.renderFlameCalendar) */}
                    <div id="flame-calendar-grid" className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-2 min-h-[190px]">
                        {/* Rendered by JS */}
                    </div>

                    {/* Thông báo khi bấm ngày */}
                    <div id="flame-calendar-hint" className="hidden mt-3 p-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface text-center border border-outline-variant/20 fade-in"></div>
                </div>

                {/* Footer Chú thích cấp độ lửa & Thống kê tháng: 2 tầng cho mobile */}
                <div className="mt-4 pt-3 border-t border-outline-variant/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-outline text-[10px] sm:text-[11px] flex-wrap">
                        <span className="font-medium">Mức độ:</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-surface-container-low border border-outline-variant/20 inline-block"></span> 0</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-orange-500/20 border border-orange-500/40 inline-block"></span> 1-9</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-orange-500 inline-block"></span> 10-24</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-br from-amber-500 to-[#FF5722] inline-block"></span> 25+🔥</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 text-on-surface-variant font-medium text-[11px] sm:text-xs">
                        <span className="bg-surface-container-low px-2 py-0.5 rounded-md">Đã học: <strong id="flame-active-days" className="text-on-surface font-bold">0 ngày</strong></span>
                        <span className="bg-primary/10 px-2 py-0.5 rounded-md text-primary">Tổng: <strong id="flame-month-words" className="font-bold">0 từ</strong></span>
                    </div>
                </div>
            </section>

            {/* THẺ 2: MỤC TIÊU IELTS & ĐẾM NGƯỢC NGÀY THI */}
            <section className="glass-card rounded-2xl p-4 sm:p-5 md:p-6 lg:p-7 lg:col-span-5 flex flex-col justify-between relative overflow-hidden">
                {/* TRẠNG THÁI: ĐÃ CÓ MỤC TIÊU */}
                <div id="ielts-goal-set-card" className="flex flex-col h-full justify-between gap-4">
                    <div>
                        <div className="flex items-center justify-between mb-3 gap-2">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                    <span className="material-symbols-outlined text-[24px] icon-fill">military_tech</span>
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-bold text-on-surface">Mục tiêu IELTS</h3>
                                    <p className="text-[11px] sm:text-xs text-on-surface-variant">Lộ trình bứt phá điểm số</p>
                                </div>
                            </div>
                            <button onClick={(event) => { try { (function(event){ openIELTSGoalModal() }).call(this, event); } catch(e){ console.error(e); } }} className="text-xs font-bold text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 shrink-0 touch-manipulation active:scale-95">
                                <span className="material-symbols-outlined text-[15px]">edit</span>
                                <span>Đổi mục tiêu</span>
                            </button>
                        </div>

                        {/* Banner Đếm ngược ngày thi */}
                        <div className="bg-gradient-to-br from-primary/10 via-surface-container-low to-primary-fixed/20 p-3.5 sm:p-4 rounded-xl border border-primary/20 flex items-center justify-between gap-3 relative overflow-hidden mb-3 sm:mb-4">
                            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>
                            <div>
                                <span className="text-[9px] sm:text-[10px] font-bold text-primary uppercase tracking-widest block mb-0.5">Thời gian đếm ngược</span>
                                <div className="flex items-baseline gap-1.5">
                                    <span id="ielts-countdown-days" className="text-2xl sm:text-3xl md:text-4xl font-black text-on-surface font-mono">0</span>
                                    <span id="ielts-countdown-label" className="text-xs sm:text-sm font-semibold text-outline">Ngày nữa</span>
                                </div>
                                <p className="text-[10px] sm:text-[11px] text-on-surface-variant mt-1 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[13px] text-primary">event</span>
                                    Ngày thi: <span id="ielts-exam-date-text" className="font-bold text-on-surface">—</span>
                                </p>
                            </div>
                            <div className="text-right shrink-0">
                                <span className="text-[9px] sm:text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">Mục tiêu</span>
                                <div id="ielts-goal-overall-badge" className="px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl bg-primary text-on-primary font-black text-sm sm:text-base md:text-lg shadow-sm">
                                    Band 7.5
                                </div>
                            </div>
                        </div>

                        {/* Lưới 4 Kỹ năng (chữ thu gọn thông minh, chống gãy dòng trên mobile) */}
                        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center">
                            <div className="bg-surface-container-low/80 p-2 sm:p-2.5 rounded-xl border border-outline-variant/15 flex flex-col items-center justify-center">
                                <span className="text-[9px] sm:text-[10px] font-bold text-outline uppercase tracking-wider block truncate max-w-full">Listening</span>
                                <span id="ielts-skill-listening" className="text-sm sm:text-base font-extrabold text-primary mt-0.5 block">7.5</span>
                            </div>
                            <div className="bg-surface-container-low/80 p-2 sm:p-2.5 rounded-xl border border-outline-variant/15 flex flex-col items-center justify-center">
                                <span className="text-[9px] sm:text-[10px] font-bold text-outline uppercase tracking-wider block truncate max-w-full">Reading</span>
                                <span id="ielts-skill-reading" className="text-sm sm:text-base font-extrabold text-primary mt-0.5 block">7.5</span>
                            </div>
                            <div className="bg-surface-container-low/80 p-2 sm:p-2.5 rounded-xl border border-outline-variant/15 flex flex-col items-center justify-center">
                                <span className="text-[9px] sm:text-[10px] font-bold text-outline uppercase tracking-wider block truncate max-w-full">Writing</span>
                                <span id="ielts-skill-writing" className="text-sm sm:text-base font-extrabold text-primary mt-0.5 block">6.5</span>
                            </div>
                            <div className="bg-surface-container-low/80 p-2 sm:p-2.5 rounded-xl border border-outline-variant/15 flex flex-col items-center justify-center">
                                <span className="text-[9px] sm:text-[10px] font-bold text-outline uppercase tracking-wider block truncate max-w-full">Speaking</span>
                                <span id="ielts-skill-speaking" className="text-sm sm:text-base font-extrabold text-primary mt-0.5 block">6.5</span>
                            </div>
                        </div>
                    </div>

                    {/* Lời nhắc động lực */}
                    <div className="pt-2 border-t border-outline-variant/15">
                        <p id="ielts-goal-motto-text" className="text-[11px] sm:text-xs italic text-on-surface-variant text-center line-clamp-2">
                            “Học tập kiên trì, tự tin chinh phục mục tiêu IELTS!”
                        </p>
                    </div>
                </div>

                {/* TRẠNG THÁI: CHƯA CÓ MỤC TIÊU */}
                <div id="ielts-goal-unset-card" className="hidden flex-col items-center justify-center text-center py-6 h-full gap-3">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-1">
                        <span className="material-symbols-outlined text-[28px] sm:text-[32px] icon-fill">flag</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-on-surface">Bạn chưa đặt mục tiêu IELTS</h3>
                    <p className="text-xs text-on-surface-variant max-w-xs leading-relaxed px-2">
                        Thiết lập band điểm 4 kỹ năng và chọn ngày thi để đồng hồ đếm ngược tạo động lực học tập mỗi ngày!
                    </p>
                    <button onClick={(event) => { try { (function(event){ openIELTSGoalModal() }).call(this, event); } catch(e){ console.error(e); } }} className="mt-2 w-full sm:w-auto bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold text-xs shadow-md hover:bg-surface-tint transition-all flex items-center justify-center gap-1.5 active:scale-95 touch-manipulation">
                        <span className="material-symbols-outlined text-[18px]">add_task</span>
                        <span>Đặt mục tiêu IELTS ngay</span>
                    </button>
                </div>
            </section>

        </div>
    </div>
</main>
</div>
    </>
  );
}

export default PageDashboard;
