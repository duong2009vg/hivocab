// Generated 1:1 Pixel-Perfect Component: PageFaq
import React from 'react';

export function PageFaq() {
  return (
    <>
<div id="page-faq" className="page">
<header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/20 shadow-sm">
    <div className="flex items-center justify-between mx-auto w-full max-w-7xl px-6 md:px-8 h-16 md:h-20">
        <a className="cursor-pointer" onClick={(event) => { try { (function(event){ window.navigateTo('landing') }).call(this, event); } catch(e){ console.error(e); } }} aria-label="Hi - Trang chu"><img className="brand-logo-sm" src="logo-mark.svg" alt="Hi"/></a>
        <button onClick={(event) => { try { (function(event){ window.navigateTo('landing') }).call(this, event); } catch(e){ console.error(e); } }} className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 md:gap-2 font-medium text-sm md:text-base"><span className="material-symbols-outlined text-[20px] md:text-[24px]">arrow_back</span> Quay lại</button>
    </div>
</header>
<main className="pt-24 md:pt-32 pb-24 px-6 md:px-8 max-w-3xl mx-auto min-h-screen">
    <div className="text-center mb-10 md:mb-14 fade-in">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4 border border-primary/20">
            <span className="material-symbols-outlined text-sm">help</span> Giải đáp thắc mắc
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-on-surface mb-4">Câu hỏi thường gặp</h1>
        <p className="text-base md:text-lg text-on-surface-variant max-w-xl mx-auto">Mọi điều bạn cần biết về HiVocab, kho 66.000+ từ vựng Cambridge / IELTS Vol và chương trình quà tặng ra mắt.</p>
    </div>
    <div className="space-y-3.5 md:space-y-4 fade-in" id="faq-list"></div>
    {/* FAQ Contact Box */}
    <div className="mt-12 p-6 md:p-8 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-6 fade-in">
        <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">support_agent</span>
            </div>
            <div>
                <h3 className="font-bold text-on-surface text-base md:text-lg">Vẫn còn thắc mắc chưa được giải đáp?</h3>
                <p className="text-sm text-on-surface-variant mt-0.5">Admin luôn túc trực Zalo để hỗ trợ bạn bất cứ lúc nào.</p>
            </div>
        </div>
        <a href="https://zalo.me/0846407898" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0068FF] hover:bg-[#0054cc] text-white font-bold rounded-xl transition-all shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-lg">chat</span> Nhắn Zalo: 0846 407 898
        </a>
    </div>
</main>
</div>
    </>
  );
}

export default PageFaq;
