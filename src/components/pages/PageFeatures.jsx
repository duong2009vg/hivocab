// Generated 1:1 Pixel-Perfect Component: PageFeatures
import React from 'react';

export function PageFeatures() {
  return (
    <>
<div id="page-features" className="page">
<header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/20 shadow-sm">
    <div className="flex items-center justify-between mx-auto w-full max-w-7xl px-6 md:px-8 h-16 md:h-20">
        <a className="cursor-pointer" onClick={(event) => { try { (function(event){ window.navigateTo('landing') }).call(this, event); } catch(e){ console.error(e); } }} aria-label="Hi - Trang chu"><img className="brand-logo-sm" src="logo-mark.svg" alt="Hi"/></a>
        <button onClick={(event) => { try { (function(event){ window.navigateTo('landing') }).call(this, event); } catch(e){ console.error(e); } }} className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 md:gap-2 font-medium text-sm md:text-base"><span className="material-symbols-outlined text-[20px] md:text-[24px]">arrow_back</span> Quay lại</button>
    </div>
</header>
<main className="pt-24 md:pt-32 pb-24 px-6 md:px-8 max-w-7xl mx-auto min-h-screen">
    <div className="text-center mb-12 md:mb-16 fade-in">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4 border border-primary/20">
            <span className="material-symbols-outlined text-sm">stars</span> Hệ thống học tập toàn diện
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-on-surface mb-4 md:mb-6">Tính năng đột phá của HiVocab</h1>
        <p className="text-base md:text-xl text-on-surface-variant max-w-3xl mx-auto leading-relaxed">Khám phá các công cụ thông minh được thiết kế chuyên biệt để giúp bạn làm chủ từ vựng học thuật và bứt phá band điểm IELTS Reading nhanh nhất.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 fade-in" style={{"animationDelay": "0.15s"}}>
        {/* Feature 1 */}
        <div className="glass-card soft-shadow p-6 md:p-8 rounded-2xl flex flex-col hover:-translate-y-1.5 transition-all duration-300 border border-outline-variant/30 hover:border-primary/50 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                    <span className="material-symbols-outlined text-3xl">menu_book</span>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 uppercase tracking-wider">Độc quyền</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-3">Kho 66.000+ từ vựng Cam & Vol</h3>
            <p className="text-on-surface-variant text-sm md:text-base leading-relaxed flex-1">Trọn bộ 12 cuốn Cambridge IELTS (CAM 10–21) và 9 tập IELTS Actual Tests (VOL 1–9). Chuẩn hóa 100% từ loại (POS), phiên âm quốc tế (IPA), bản dịch chuẩn xác và câu ví dụ thật từ bài đọc.</p>
            <div className="mt-5 pt-4 border-t border-outline-variant/20 flex items-center gap-2 text-xs font-semibold text-primary">
                <span className="material-symbols-outlined text-base">check_circle</span> 100 Tests • 300 Passages đầy đủ
            </div>
        </div>
        {/* Feature 2 */}
        <div className="glass-card soft-shadow p-6 md:p-8 rounded-2xl flex flex-col hover:-translate-y-1.5 transition-all duration-300 border border-outline-variant/30 hover:border-emerald-500/50 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                    <span className="material-symbols-outlined text-3xl">vertical_split</span>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 uppercase tracking-wider">Đột phá</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-3">Đọc Chủ Động & Che Bản Dịch</h3>
            <p className="text-on-surface-variant text-sm md:text-base leading-relaxed flex-1">Phương pháp Curtain Mode độc quyền: Đọc song ngữ Anh - Việt đối chiếu với rèm che thông minh giúp kích thích tư duy tự suy luận nghĩa từ ngữ cảnh. Tích hợp bài tập đục lỗ ngay trong bài đọc.</p>
            <div className="mt-5 pt-4 border-t border-outline-variant/20 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="material-symbols-outlined text-base">check_circle</span> Tăng tốc độ đọc hiểu x2
            </div>
        </div>
        {/* Feature 3 */}
        <div className="glass-card soft-shadow p-6 md:p-8 rounded-2xl flex flex-col hover:-translate-y-1.5 transition-all duration-300 border border-outline-variant/30 hover:border-amber-500/50 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                    <span className="material-symbols-outlined text-3xl">bolt</span>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 uppercase tracking-wider">Khoa học</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-3">Lặp lại ngắt quãng (SRS SM-2)</h3>
            <p className="text-on-surface-variant text-sm md:text-base leading-relaxed flex-1">Thuật toán SuperMemo-2 phân tầng 5 cấp độ trí nhớ từ Khởi động (1 ngày) đến Thành thạo (30 ngày). Nhắc nhở ôn tập chính xác thời điểm chuẩn bị quên, chuyển hóa từ vựng thành trí nhớ dài hạn vĩnh viễn.</p>
            <div className="mt-5 pt-4 border-t border-outline-variant/20 flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <span className="material-symbols-outlined text-base">check_circle</span> Tiết kiệm 80% thời gian học
            </div>
        </div>
        {/* Feature 4 */}
        <div className="glass-card soft-shadow p-6 md:p-8 rounded-2xl flex flex-col hover:-translate-y-1.5 transition-all duration-300 border border-outline-variant/30 hover:border-purple-500/50 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                    <span className="material-symbols-outlined text-3xl">sports_esports</span>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 uppercase tracking-wider">Đa giác quan</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-3">5 Chế độ Luyện tập Đa dạng</h3>
            <p className="text-on-surface-variant text-sm md:text-base leading-relaxed flex-1">Tự do đổi gió với Flashcard lật mặt 3D, Trắc nghiệm 4 đáp án (Quiz) phản xạ, Điền từ ngữ cảnh (Type-in), Nghe chép chính tả (Dictation) chuẩn giọng bản ngữ và Trò chơi phiêu lưu vượt ải sinh động.</p>
            <div className="mt-5 pt-4 border-t border-outline-variant/20 flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400">
                <span className="material-symbols-outlined text-base">check_circle</span> Học không chán, nhớ bền lâu
            </div>
        </div>
        {/* Feature 5 */}
        <div className="glass-card soft-shadow p-6 md:p-8 rounded-2xl flex flex-col hover:-translate-y-1.5 transition-all duration-300 border border-outline-variant/30 hover:border-rose-500/50 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                    <span className="material-symbols-outlined text-3xl">smart_toy</span>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 uppercase tracking-wider">AI Gemini</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-3">Trợ lý AI & Từ điển Ngữ cảnh</h3>
            <p className="text-on-surface-variant text-sm md:text-base leading-relaxed flex-1">Trí tuệ nhân tạo Gemini phân tích ngữ cảnh học thuật chuyên sâu, giải nghĩa Collocations, Synonyms và cung cấp mẹo ghi nhớ (Mnemonics) độc đáo. Tra cứu tức thời không rời màn hình học.</p>
            <div className="mt-5 pt-4 border-t border-outline-variant/20 flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
                <span className="material-symbols-outlined text-base">check_circle</span> Giải nghĩa sát đề thi thật
            </div>
        </div>
        {/* Feature 6 */}
        <div className="glass-card soft-shadow p-6 md:p-8 rounded-2xl flex flex-col hover:-translate-y-1.5 transition-all duration-300 border border-outline-variant/30 hover:border-sky-500/50 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                    <span className="material-symbols-outlined text-3xl">monitoring</span>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 uppercase tracking-wider">Động lực</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-3">Thống kê Tiến độ & Chuỗi Streak</h3>
            <p className="text-on-surface-variant text-sm md:text-base leading-relaxed flex-1">Theo dõi chi tiết số từ đã thành thạo, thời gian học tập tích lũy qua biểu đồ trực quan. Ngọn lửa Streak hàng ngày nhắc nhở bạn duy trì thói quen học tập để gặt hái kết quả cao nhất.</p>
            <div className="mt-5 pt-4 border-t border-outline-variant/20 flex items-center gap-2 text-xs font-semibold text-sky-600 dark:text-sky-400">
                <span className="material-symbols-outlined text-base">check_circle</span> Xây dựng kỷ luật học mỗi ngày
            </div>
        </div>
    </div>
    {/* Features Bottom CTA */}
    <div className="mt-14 p-8 md:p-12 rounded-3xl bg-gradient-to-r from-primary/10 via-surface-container to-secondary/10 border border-primary/20 text-center flex flex-col items-center">
        <h2 className="text-2xl md:text-3xl font-bold text-on-surface mb-3">Sẵn sàng bứt phá band điểm IELTS cùng HiVocab?</h2>
        <p className="text-on-surface-variant text-base md:text-lg max-w-xl mb-6">Đăng ký tài khoản ngay hôm nay để nhận trọn vẹn 2 tháng trải nghiệm Full tính năng hoàn toàn miễn phí!</p>
        <button onClick={(event) => { try { (function(event){ window.handleStartNow() }).call(this, event); } catch(e){ console.error(e); } }} className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md hover:shadow-lg cursor-pointer">
            <span className="material-symbols-outlined">rocket_launch</span> Bắt đầu học miễn phí
        </button>
    </div>
</main>
</div>
    </>
  );
}

export default PageFeatures;
