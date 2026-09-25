// Generated 1:1 Pixel-Perfect Component: PageSupport
import React from 'react';

export function PageSupport() {
  return (
    <>
<div id="page-support" className="page">
<header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/20 shadow-sm">
    <div className="flex items-center justify-between mx-auto w-full max-w-7xl px-6 md:px-8 h-16 md:h-20">
        <a className="cursor-pointer" onClick={(event) => { try { (function(event){ window.navigateTo('landing') }).call(this, event); } catch(e){ console.error(e); } }} aria-label="Hi - Trang chu"><img className="brand-logo-sm" src="logo-mark.svg" alt="Hi"/></a>
        <button onClick={(event) => { try { (function(event){ window.navigateTo('landing') }).call(this, event); } catch(e){ console.error(e); } }} className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 md:gap-2 font-medium text-sm md:text-base"><span className="material-symbols-outlined text-[20px] md:text-[24px]">arrow_back</span> Quay lại</button>
    </div>
</header>
<main className="pt-24 md:pt-32 pb-24 px-6 md:px-8 max-w-2xl mx-auto min-h-screen">
    <div className="text-center mb-10 fade-in">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4 border border-primary/20">
            <span className="material-symbols-outlined text-sm">headset_mic</span> Trung tâm hỗ trợ & CSKH
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-on-surface mb-3">Chúng tôi có thể giúp gì cho bạn?</h1>
        <p className="text-on-surface-variant text-base">Website HiVocab mới ra mắt, Admin sẵn sàng hỗ trợ kỹ thuật và lắng nghe góp ý 24/7.</p>
    </div>

    {/* ZALO ADMIN VIP CARD */}
    <div className="glass-card soft-shadow rounded-2xl p-6 md:p-8 mb-8 border-2 border-primary/30 relative overflow-hidden fade-in">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-[#0068FF] text-white flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
                    Z
                </div>
                <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Trực tuyến 24/7 • Phản hồi trong 5 phút
                    </div>
                    <h2 className="text-lg md:text-xl font-bold text-on-surface mt-1">Kênh Zalo Hỗ Trệu Chính Thức</h2>
                </div>
            </div>
        </div>
        <div className="bg-surface-container-low rounded-xl p-4 mb-5 border border-outline-variant/30 flex items-center justify-between">
            <div>
                <span className="text-xs text-on-surface-variant block font-medium">Số điện thoại / Zalo Admin:</span>
                <span className="text-2xl md:text-3xl font-extrabold text-primary tracking-wider font-mono">0846 407 898</span>
            </div>
            <button type="button" id="btn-copy-zalo" onClick={(event) => { try { (function(event){ window.copyZaloSupport() }).call(this, event); } catch(e){ console.error(e); } }} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold border border-outline-variant/40 transition-all shadow-xs cursor-pointer">
                <span className="material-symbols-outlined text-base" id="icon-copy-zalo">content_copy</span>
                <span id="text-copy-zalo">Sao chép</span>
            </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
            <a href="https://zalo.me/0846407898" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-[#0068FF] hover:bg-[#0054cc] text-white font-bold rounded-xl transition-all shadow-sm">
                <span className="material-symbols-outlined text-xl">chat</span> Nhắn tin Zalo ngay
            </a>
            <a href="tel:0846407898" className="flex items-center justify-center gap-2 py-3 px-5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold rounded-xl border border-outline-variant/30 transition-all">
                <span className="material-symbols-outlined text-xl">call</span> Gọi trực tiếp
            </a>
        </div>
    </div>

    {/* WELCOME & 2-MONTH GIFT NOTICE */}
    <div className="rounded-2xl p-5 md:p-6 mb-8 bg-gradient-to-r from-amber-500/10 via-surface-container-low to-primary/10 border border-amber-500/30 flex items-start gap-4 fade-in" style={{"animationDelay": "0.1s"}}>
        <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">card_giftcard</span>
        </div>
        <div className="text-sm md:text-base leading-relaxed">
            <h3 className="font-bold text-on-surface text-base mb-1">Website mới ra mắt & Tặng 2 tháng Full tính năng</h3>
            <p className="text-on-surface-variant">HiVocab vừa chính thức ra mắt với hơn 66.000 từ vựng và Chế độ Đọc Chủ Động. Trong quá trình học, nếu bạn gặp bất kỳ lỗi hiển thị hay đồng bộ nào, xin vui lòng chụp ảnh màn hình gửi qua Zalo <strong>0846 407 898</strong> để Admin khắc phục ngay lập tức nhé!</p>
        </div>
    </div>

    {/* QUICK CATEGORIES */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 fade-in" style={{"animationDelay": "0.15s"}}>
        <a href="https://zalo.me/0846407898" target="_blank" rel="noopener noreferrer" className="bg-surface-container-lowest/80 border border-outline-variant/30 rounded-xl p-4 flex items-center gap-3.5 hover:border-primary/50 hover:shadow-md transition-all group">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined">bug_report</span>
            </div>
            <div>
                <h4 className="font-bold text-on-surface text-sm">Báo lỗi kỹ thuật</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">Sự cố hiển thị, âm thanh, đồng bộ</p>
            </div>
            <span className="material-symbols-outlined ml-auto text-outline-variant text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </a>
        <a href="https://zalo.me/0846407898" target="_blank" rel="noopener noreferrer" className="bg-surface-container-lowest/80 border border-outline-variant/30 rounded-xl p-4 flex items-center gap-3.5 hover:border-emerald-500/50 hover:shadow-md transition-all group">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined">school</span>
            </div>
            <div>
                <h4 className="font-bold text-on-surface text-sm">Tư vấn lộ trình học</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">Hướng dẫn cày Cam 10–21 & Vol 1–9</p>
            </div>
            <span className="material-symbols-outlined ml-auto text-outline-variant text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </a>
    </div>

    {/* CONTACT FORM */}
    <form onSubmit={(event) => { try { (function(event){ window.handleSupportSubmit(event) }).call(this, event); } catch(e){ console.error(e); } }} className="bg-surface-container-lowest/80 border border-outline-variant/30 rounded-2xl p-6 md:p-8 flex flex-col gap-4 fade-in shadow-sm" style={{"animationDelay": "0.2s"}}>
        <div>
            <h2 className="font-bold text-lg text-on-surface">Gửi tin nhắn hoặc góp ý</h2>
            <p className="text-xs text-on-surface-variant mt-1">Chúng tôi trân trọng từng ý kiến đóng góp của bạn để hoàn thiện HiVocab mỗi ngày.</p>
        </div>
        <div>
            <label htmlFor="support-name" className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Họ và tên</label>
            <input type="text" id="support-name" required placeholder="Nguyễn Văn A" className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary px-4 py-3 rounded-xl outline-none text-on-surface text-sm transition-colors"/>
        </div>
        <div>
            <label htmlFor="support-contact" className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Email hoặc Số điện thoại (Zalo)</label>
            <input type="text" id="support-contact" required placeholder="Ví dụ: nam@gmail.com hoặc 0912..." className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary px-4 py-3 rounded-xl outline-none text-on-surface text-sm transition-colors"/>
        </div>
        <div>
            <label htmlFor="support-message" className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Nội dung câu hỏi / Báo lỗi</label>
            <textarea id="support-message" required placeholder="Mô tả chi tiết câu hỏi hoặc lỗi bạn gặp phải..." rows="4" className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary px-4 py-3 rounded-xl outline-none resize-none text-on-surface text-sm transition-colors"></textarea>
        </div>
        <button type="submit" className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center gap-2 mt-2 cursor-pointer">
            <span className="material-symbols-outlined text-lg">send</span> Gửi thông tin cho Admin
        </button>
    </form>
</main>
</div>
    </>
  );
}

export default PageSupport;
