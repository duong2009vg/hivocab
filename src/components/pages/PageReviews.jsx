// Generated 1:1 Pixel-Perfect Component: PageReviews
import React from 'react';

export function PageReviews() {
  return (
    <>
<div id="page-reviews" className="page">
<header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/20 shadow-sm">
    <div className="flex items-center justify-between mx-auto w-full max-w-7xl px-6 md:px-8 h-16 md:h-20">
        <a className="cursor-pointer" onClick={(event) => { try { (function(event){ window.navigateTo('landing') }).call(this, event); } catch(e){ console.error(e); } }} aria-label="Hi - Trang chu"><img className="brand-logo-sm" src="logo-mark.svg" alt="Hi"/></a>
        <button onClick={(event) => { try { (function(event){ window.navigateTo('landing') }).call(this, event); } catch(e){ console.error(e); } }} className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 md:gap-2 font-medium text-sm md:text-base"><span className="material-symbols-outlined text-[20px] md:text-[24px]">arrow_back</span> Quay lại</button>
    </div>
</header>
<main className="pt-24 md:pt-32 pb-24 px-6 md:px-8 max-w-5xl mx-auto min-h-screen">
    <div className="text-center mb-10 md:mb-14 fade-in">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-bold uppercase tracking-wider mb-4 border border-amber-500/20">
            <span className="material-symbols-outlined text-sm">chat_bubble</span> Phản hồi trải nghiệm sớm
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-on-surface mb-3">Cảm nhận từ những người dùng đầu tiên</h1>
        <p className="text-base text-on-surface-variant max-w-xl mx-auto">HiVocab mới ra mắt và đang tiếp tục được hoàn thiện mỗi ngày. Dưới đây là những chia sẻ thực tế từ các bạn học viên trải nghiệm sớm.</p>
        
        <div className="flex items-center justify-center gap-3 mt-6 bg-surface-container-low w-max mx-auto px-5 py-2 rounded-xl border border-outline-variant/30">
            <div className="flex text-[#FFB400] text-base">
                <span className="material-symbols-outlined icon-fill">star</span>
                <span className="material-symbols-outlined icon-fill">star</span>
                <span className="material-symbols-outlined icon-fill">star</span>
                <span className="material-symbols-outlined icon-fill">star</span>
                <span className="material-symbols-outlined icon-fill">star_half</span>
            </div>
            <span className="text-xs md:text-sm text-on-surface-variant font-medium">Góp ý & đánh giá từ học viên trải nghiệm thử nghiệm</span>
        </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 fade-in" style={{"animationDelay": "0.15s"}}>
        {/* Review 1 */}
        <div className="glass-card soft-shadow p-6 rounded-2xl flex flex-col gap-4 border border-outline-variant/20 bg-surface-container-lowest">
            <div className="flex text-[#FFB400] text-sm">
                <span className="material-symbols-outlined icon-fill">star</span><span className="material-symbols-outlined icon-fill">star</span><span className="material-symbols-outlined icon-fill">star</span><span className="material-symbols-outlined icon-fill">star</span><span className="material-symbols-outlined icon-fill">star</span>
            </div>
            <p className="text-on-surface text-sm leading-relaxed italic flex-1">"Website mới ra mắt nên đôi lúc còn vài chỗ cần tải dữ liệu, nhưng kho từ vựng Cam 10-21 làm rất chỉn chu. Có sẵn câu ví dụ trích từ bài đọc nên khi luyện đề đỡ mất công tự tra thủ công rất nhiều."</p>
            <div className="flex items-center gap-3 pt-3 border-t border-outline-variant/20">
                <div className="w-10 h-10 bg-primary/20 text-primary rounded-full flex items-center justify-center font-bold text-sm">Đ</div>
                <div>
                    <p className="font-bold text-on-surface text-sm">Minh Đức</p>
                    <p className="text-xs text-on-surface-variant">Đang tự cày đề Cambridge</p>
                </div>
            </div>
        </div>
        {/* Review 2 */}
        <div className="glass-card soft-shadow p-6 rounded-2xl flex flex-col gap-4 border border-outline-variant/20 bg-surface-container-lowest">
            <div className="flex text-[#FFB400] text-sm">
                <span className="material-symbols-outlined icon-fill">star</span><span className="material-symbols-outlined icon-fill">star</span><span className="material-symbols-outlined icon-fill">star</span><span className="material-symbols-outlined icon-fill">star</span><span className="material-symbols-outlined icon-fill">star</span>
            </div>
            <p className="text-on-surface text-sm leading-relaxed italic flex-1">"Mình thích nhất tính năng kéo rèm che bản dịch tiếng Việt để tự đoán nghĩa theo ngữ cảnh trước khi xem lời dịch. Rất mong admin tiếp tục bổ sung thêm nhiều bài đọc mới trong thời gian tới!"</p>
            <div className="flex items-center gap-3 pt-3 border-t border-outline-variant/20">
                <div className="w-10 h-10 bg-emerald-500/20 text-emerald-600 rounded-full flex items-center justify-center font-bold text-sm">H</div>
                <div>
                    <p className="font-bold text-on-surface text-sm">Thu Hà</p>
                    <p className="text-xs text-on-surface-variant">Đang ôn thi IELTS Reading</p>
                </div>
            </div>
        </div>
        {/* Review 3 */}
        <div className="glass-card soft-shadow p-6 rounded-2xl flex flex-col gap-4 border border-outline-variant/20 bg-surface-container-lowest">
            <div className="flex text-[#FFB400] text-sm">
                <span className="material-symbols-outlined icon-fill">star</span><span className="material-symbols-outlined icon-fill">star</span><span className="material-symbols-outlined icon-fill">star</span><span className="material-symbols-outlined icon-fill">star</span><span className="material-symbols-outlined icon-fill">star</span>
            </div>
            <p className="text-on-surface text-sm leading-relaxed italic flex-1">"Giao diện sạch sẽ, học Flashcard và làm trắc nghiệm khá mượt. Thích nhất là có số Zalo của admin, hôm trước gặp lỗi đăng nhập nhắn cái là admin hỗ trợ xử lý ngay lập tức."</p>
            <div className="flex items-center gap-3 pt-3 border-t border-outline-variant/20">
                <div className="w-10 h-10 bg-purple-500/20 text-purple-600 rounded-full flex items-center justify-center font-bold text-sm">A</div>
                <div>
                    <p className="font-bold text-on-surface text-sm">Tuấn Anh</p>
                    <p className="text-xs text-on-surface-variant">Sinh viên đại học</p>
                </div>
            </div>
        </div>
    </div>
    
    {/* Reviews Bottom CTA */}
    <div className="mt-12 p-6 md:p-8 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-left">
            <h2 className="text-base md:text-lg font-bold text-on-surface">Bạn cũng đang trải nghiệm HiVocab?</h2>
            <p className="text-xs md:text-sm text-on-surface-variant mt-1">Mọi góp ý của bạn đều giúp website hoàn thiện hơn mỗi ngày.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
            <a href="https://zalo.me/0846407898" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#0068FF] text-white text-sm font-bold rounded-xl hover:bg-[#0054cc] transition-colors shadow-xs">
                <span className="material-symbols-outlined text-base">chat</span> Gửi góp ý qua Zalo
            </a>
            <button onClick={(event) => { try { (function(event){ window.handleStartNow() }).call(this, event); } catch(e){ console.error(e); } }} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-xs cursor-pointer">
                <span className="material-symbols-outlined text-base">school</span> Học ngay
            </button>
        </div>
    </div>
</main>
</div>
    </>
  );
}

export default PageReviews;
