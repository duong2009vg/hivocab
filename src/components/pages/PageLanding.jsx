// Generated 1:1 Pixel-Perfect Component: PageLanding
import React from 'react';

export function PageLanding() {
  return (
    <>
<div id="page-landing" className="page font-inter">
<div id="landing-main-wrapper" className="relative overflow-hidden w-full">
    <div id="landing-hero-backdrop" className="absolute inset-0 z-0 gradient-asagiri transition-all duration-700 pointer-events-none select-none">
        <img id="landing-bg-svg" src="/bg-morning.svg" alt="" className="w-full h-full object-cover object-top pointer-events-none select-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/45 to-black/85 w-full h-full pointer-events-none select-none" style={{"background": "linear-gradient(180deg, rgba(15,23,42,0.65) 0%, rgba(15,23,42,0.45) 50%, rgba(15,23,42,0.88) 100%)"}}></div>
    </div>
    <section className="relative z-10 min-h-screen flex flex-col pt-6 pb-20 px-6 sm:px-8">
        <header className="relative z-20 flex items-center justify-between mx-auto w-full max-w-7xl">
            <div className="flex-shrink-0 flex items-center"><a className="cursor-pointer" onClick={(event) => { try { (function(event){ window.navigateTo('landing') }).call(this, event); } catch(e){ console.error(e); } }} aria-label="Hi - Trang chu"><img className="brand-logo-hero" src="logo-mark-white.svg" alt="Hi"/></a></div>
            <nav className="hidden lg:flex items-center space-x-1 glass-nav rounded-full px-2 py-1.5">
                <a className="text-white hover:bg-white/20 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer" onClick={(event) => { try { (function(event){ navigateTo('features') }).call(this, event); } catch(e){ console.error(e); } }}>Tính năng</a><div className="w-px h-4 bg-white/30 mx-1"></div>
                <a className="text-white hover:bg-white/20 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer" onClick={(event) => { try { (function(event){ navigateTo('reviews') }).call(this, event); } catch(e){ console.error(e); } }}>Đánh giá</a><div className="w-px h-4 bg-white/30 mx-1"></div>
                <a className="text-white hover:bg-white/20 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer" onClick={(event) => { try { (function(event){ navigateTo('support') }).call(this, event); } catch(e){ console.error(e); } }}>Hỗ trợ</a><div className="w-px h-4 bg-white/30 mx-1"></div>
                <a className="text-white hover:bg-white/20 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer" onClick={(event) => { try { (function(event){ navigateTo('faq') }).call(this, event); } catch(e){ console.error(e); } }}>FAQ</a>
            </nav>
            <div className="flex items-center space-x-3">
                <a className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-white bg-white/20 hover:bg-white/30 border border-white/30 text-xs sm:text-sm font-semibold backdrop-blur-sm transition-colors cursor-pointer" onClick={(event) => { try { (function(event){ window.navigateTo('dashboard') }).call(this, event); } catch(e){ console.error(e); } }}>Bắt đầu ngay</a>
                <a className="inline-flex items-center justify-center px-5 py-2 rounded-lg text-gray-900 bg-white hover:bg-gray-100 text-xs sm:text-sm font-semibold shadow-sm transition-colors cursor-pointer" onClick={(event) => { try { (function(event){ window.navigateTo('login') }).call(this, event); } catch(e){ console.error(e); } }}>Đăng nhập</a>
            </div>
        </header>
        <main className="relative z-10 flex-grow flex items-center max-w-7xl mx-auto w-full mt-16 sm:mt-20 lg:mt-28">
            <div className="grid lg:grid-cols-12 gap-8 items-center w-full">
                <div className="lg:col-span-7 max-w-xl text-left pr-0 lg:pr-4 fade-in">
                    <div id="hero-time-badge" className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold mb-3 border border-white/30">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        <span id="hero-time-label">Nền tảng học từ vựng & Luyện thi tiếng Anh</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-snug mb-3">
                        Làm chủ từ vựng tiếng Anh & Đọc hiểu IELTS
                    </h1>
                    <p className="text-xs sm:text-sm lg:text-base text-white/85 mb-6 max-w-md leading-relaxed">
                        Ghi nhớ bền vững hơn 66.000 từ vựng học thuật chuẩn Cambridge với phương pháp Lặp lại ngắt quãng (Spaced Repetition) và Đọc hiểu chủ động.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-start">
                        <a className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-sm font-bold rounded-xl text-gray-900 bg-white hover:bg-gray-100 shadow-md hover:shadow-lg transition-all cursor-pointer" onClick={(event) => { try { (function(event){ window.navigateTo('dashboard') }).call(this, event); } catch(e){ console.error(e); } }}>
                            <span>Bắt đầu ngay</span>
                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </a>
                    </div>
                </div>
                <div className="lg:col-span-5 hidden lg:flex flex-col gap-3.5 relative ml-auto w-full max-w-[360px] fade-in" style={{"animationDelay": "0.2s"}}>
                    <div onClick={(event) => { try { (function(event){ window.navigateTo('dashboard') }).call(this, event); } catch(e){ console.error(e); } }} className="glass-card-hero rounded-2xl p-4 flex items-center gap-3 backdrop-blur-md border border-white/25 hover:scale-105 transition-all cursor-pointer shadow-lg">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                        <span className="text-white/70 text-xs font-medium uppercase tracking-wider">Trải nghiệm</span>
                        <span className="text-white text-sm font-semibold truncate">CAM 19 • Test 2 • Passage 1 →</span>
                    </div>
                    <div onClick={(event) => { try { (function(event){ window.navigateTo('features') }).call(this, event); } catch(e){ console.error(e); } }} className="glass-card-hero rounded-2xl p-4 flex items-center gap-3 backdrop-blur-md border border-white/25 hover:scale-105 transition-all cursor-pointer shadow-lg">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-400"></div>
                        <span className="text-white/70 text-xs font-medium uppercase tracking-wider">Độc quyền</span>
                        <span className="text-white text-sm font-semibold">Đọc Chủ Động & Che Dịch →</span>
                    </div>
                    <div onClick={(event) => { try { (function(event){ window.navigateTo('dashboard') }).call(this, event); } catch(e){ console.error(e); } }} className="glass-card-hero rounded-2xl p-4 flex items-center gap-3 backdrop-blur-md border border-white/25 hover:scale-105 transition-all cursor-pointer shadow-lg">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                        <span className="text-white/70 text-xs font-medium uppercase tracking-wider">Kho từ</span>
                        <span className="text-white text-sm font-semibold">66.000+ từ Cambridge & Vol →</span>
                    </div>
                </div>
            </div>
        </main>
    </section>
    <section className="relative z-10 py-20 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 fade-in">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white drop-shadow-md">Tại sao nên chọn HiVocab?</h2>
                <p className="mt-4 text-sm sm:text-base lg:text-lg text-white/85 max-w-2xl mx-auto drop-shadow-sm">Hệ sinh thái học từ vựng học thuật toàn diện, biến việc luyện đề IELTS thành trải nghiệm ghi nhớ sâu sắc và bền vững.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 md:gap-8 fade-in" style={{"animationDelay": "0.15s"}}>
                <div className="text-left p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-black/60 backdrop-blur-xl border border-white/30 dark:border-white/10 shadow-2xl hover:translate-y-[-4px] transition-all">
                    <div className="w-14 h-14 bg-blue-500/15 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-500/20">
                        <span className="material-symbols-outlined text-3xl">menu_book</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2.5">Kho 66.000+ từ vựng Cam & Vol</h3>
                    <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm md:text-base leading-relaxed">Trọn bộ Cambridge 10–21 và IELTS Actual Tests Vol 1–9 được chuẩn hóa từ loại (POS), phiên âm (IPA) và câu ví dụ thật trích từ chính bài đọc.</p>
                </div>
                <div className="text-left p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-black/60 backdrop-blur-xl border border-white/30 dark:border-white/10 shadow-2xl hover:translate-y-[-4px] transition-all">
                    <div className="w-14 h-14 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-emerald-500/20">
                        <span className="material-symbols-outlined text-3xl">vertical_split</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2.5">Chế độ Đọc Chủ Động (Curtain Mode)</h3>
                    <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm md:text-base leading-relaxed">Đọc song ngữ Anh - Việt đối sánh với tính năng rèm che tương tác, kết hợp bài tập đục lỗ kích thích tư duy tự suy luận nghĩa trong ngữ cảnh.</p>
                </div>
                <div className="text-left p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-black/60 backdrop-blur-xl border border-white/30 dark:border-white/10 shadow-2xl hover:translate-y-[-4px] transition-all">
                    <div className="w-14 h-14 bg-purple-500/15 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-purple-500/20">
                        <span className="material-symbols-outlined text-3xl">bolt</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2.5">Lặp lại ngắt quãng (SRS SM-2)</h3>
                    <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm md:text-base leading-relaxed">Thuật toán khoa học phân tầng 5 cấp độ trí nhớ, tự động nhắc nhở ôn tập vào đúng thời điểm bạn sắp quên để khắc sâu vĩnh viễn.</p>
                </div>
            </div>
        </div>
    </section>
</div>


{/* Footer ONLY for Landing Page */}
<footer className="border-t border-gray-200/80 dark:border-white/10 bg-white dark:bg-surface-container-low text-[#6E6E73] text-sm py-12 px-8">
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        {/* Col 1: Brand info */}
        <div className="md:col-span-2 space-y-4 pr-0 md:pr-8">
            <div className="flex items-center gap-2.5">
                <img src="/logo-mark.svg" alt="HiVocab Logo" className="h-8 w-auto"/>
                <span className="font-bold text-xl text-gray-900 dark:text-white tracking-tight">HiVocab</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-md">
                Hệ sinh thái học từ vựng học thuật thông minh, phương pháp Đọc Chủ Động (Curtain Mode) và Lặp lại ngắt quãng (Spaced Repetition SM-2) chuẩn hóa Cambridge IELTS & THPT Quốc Gia.
            </p>
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>📍 <strong>Đơn vị phát triển:</strong> HiVocab Education</p>
                <p>✉️ <strong>Hỗ trợ:</strong> <a href="mailto:support@hivocab.site" className="text-blue-600 hover:underline">support@hivocab.site</a> · <a href="mailto:mitthoi60@gmail.com" className="text-blue-600 hover:underline">mitthoi60@gmail.com</a></p>
                <p>📞 <strong>Hotline/Zalo:</strong> 0846 407 898</p>
            </div>
        </div>

        {/* Col 2: Navigation */}
        <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">Điều hướng</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
                <li><a onClick={(event) => { try { (function(event){ navigateTo('features') }).call(this, event); } catch(e){ console.error(e); } }} className="cursor-pointer hover:text-blue-600 transition-colors">Tính năng</a></li>
                <li><a onClick={(event) => { try { (function(event){ navigateTo('reviews') }).call(this, event); } catch(e){ console.error(e); } }} className="cursor-pointer hover:text-blue-600 transition-colors">Đánh giá</a></li>
                <li><a onClick={(event) => { try { (function(event){ navigateTo('support') }).call(this, event); } catch(e){ console.error(e); } }} className="cursor-pointer hover:text-blue-600 transition-colors">Hỗ trợ</a></li>
                <li><a onClick={(event) => { try { (function(event){ navigateTo('faq') }).call(this, event); } catch(e){ console.error(e); } }} className="cursor-pointer hover:text-blue-600 transition-colors">Câu hỏi thường gặp (FAQ)</a></li>
                <li><a onClick={(event) => { try { (function(event){ navigateTo('login') }).call(this, event); } catch(e){ console.error(e); } }} className="cursor-pointer hover:text-blue-600 transition-colors">Đăng nhập / Đăng ký</a></li>
            </ul>
        </div>

        {/* Col 3: Legal & Policy */}
        <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">Pháp lý & Chính sách</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
                <li>
                    <a href="/privacy" className="text-blue-600 font-semibold hover:underline flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">verified_user</span>
                        Chính sách quyền riêng tư
                    </a>
                </li>
                <li>
                    <a href="/terms" className="hover:text-blue-600 transition-colors flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">gavel</span>
                        Điều khoản dịch vụ
                    </a>
                </li>
            </ul>
        </div>
    </div>

    {/* Bottom copyright */}
    <div className="max-w-7xl mx-auto pt-6 border-t border-gray-200/60 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-400">
        <p>© 2026 HiVocab (hivocab.site). Bản quyền được bảo lưu.</p>
        <div className="flex items-center gap-4">
            <a href="/privacy" className="hover:underline text-gray-700 dark:text-gray-300">Privacy Policy</a>
            <span>•</span>
            <a href="/terms" className="hover:underline text-gray-700 dark:text-gray-300">Terms of Service</a>
            <span>•</span>
            <a href="/" className="hover:underline text-blue-600">hivocab.site</a>
        </div>
    </div>
</footer>
</div>
    </>
  );
}

export default PageLanding;
