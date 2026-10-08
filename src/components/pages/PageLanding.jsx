// src/components/pages/PageLanding.jsx
// Trang giới thiệu HiVocab mô phỏng một bức tranh sáp màu của trẻ con (Cozy Crayon Handcrafted Picture Book)
// Hỗ trợ song ngữ Tiếng Anh (Mặc định) và Tiếng Việt với LanguageSwitcher
import React, { useState, useEffect } from 'react';
import { useRoute } from '../../router/RouteContext.jsx';
import { useLandingLang } from '../../context/LandingLangContext.jsx';
import LanguageSwitcher from '../common/LanguageSwitcher.jsx';

function useCountUp(end, duration = 1600, delay = 0) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let animationFrameId = null;
    let startTime = null;

    const timer = setTimeout(() => {
      const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4);
        setCount(Math.floor(ease * end));

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(step);
        } else {
          setCount(end);
        }
      };
      animationFrameId = requestAnimationFrame(step);
    }, delay);

    return () => {
      clearTimeout(timer);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [end, duration, delay]);

  return count;
}

const formatNumber = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export function PageLanding() {
  const { navigateTo } = useRoute();
  const { isEn } = useLandingLang();

  // Hiệu ứng hiện số lần lượt: Số từ vựng đếm trước (delay 150ms), số đề thi đếm sau (delay 800ms)
  const vocabCount = useCountUp(66000, 1600, 150);
  const examCount = useCountUp(38, 1200, 800);

  return (
    <div
      id="page-landing"
      className="page active min-h-screen font-nunito text-[#3D352E] bg-[#FAF5EB] relative flex flex-col justify-between selection:bg-[#EBDDC8] selection:text-[#3D352E]"
      style={{
        backgroundImage: 'radial-gradient(#E2D6C3 1.2px, transparent 1.2px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* ── TOP DECORATIVE CRAYON HEADER & NAVIGATION BAR ── */}
      <header className="sticky top-0 z-40 w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-3 sm:py-3.5 bg-[#FAF5EB]/95 backdrop-blur-md border-b-2 border-[#3D352E]/10 transition-all">
        <div className="w-full flex items-center justify-between gap-3 sm:gap-6">
          
          {/* Logo app bản sáp màu đã tách nền ở góc trên cùng bên trái */}
          <div
            onClick={() => navigateTo('landing')}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none group shrink-0"
            title={isEn ? "HiVocab – Crayon Picture Book Home" : "HiVocab – Trang chủ tranh sáp màu"}
          >
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center transition-transform group-hover:scale-105">
              <img
                src="/logo-hi-transparent.png"
                alt="HiVocab Logo"
                className="w-full h-full object-contain filter drop-shadow-xs"
                onError={(e) => {
                  e.currentTarget.src = '/mascot/mascot_cozy.png';
                }}
              />
            </div>
            <span className="font-quicksand font-bold text-sm sm:text-base md:text-lg tracking-tight text-[#3D352E] leading-none">
              HiVocab
            </span>
          </div>

          {/* Desktop Navigation Links (Pill viên con nhộng sáp màu) */}
          <nav
            aria-label="Điều hướng trang giới thiệu"
            className="hidden md:flex items-center gap-2 bg-white border-2 border-[#3D352E] shadow-[2.5px_3px_0px_#3D352E] rounded-full px-4 py-1.5"
          >
            <button
              type="button"
              onClick={() => navigateTo('features')}
              className="px-4 py-1.5 text-xs sm:text-sm font-black text-[#5E5147] hover:text-[#3D352E] hover:bg-[#FAF5EB] rounded-full transition-all cursor-pointer"
            >
              {isEn ? '🎨 Features' : '🎨 Tính năng'}
            </button>
            <span className="text-[#DECDBB] select-none">•</span>
            <button
              type="button"
              onClick={() => navigateTo('reviews')}
              className="px-4 py-1.5 text-xs sm:text-sm font-black text-[#5E5147] hover:text-[#3D352E] hover:bg-[#FAF5EB] rounded-full transition-all cursor-pointer"
            >
              {isEn ? '💬 Reviews' : '💬 Đánh giá'}
            </button>
            <span className="text-[#DECDBB] select-none">•</span>
            <button
              type="button"
              onClick={() => navigateTo('faq')}
              className="px-4 py-1.5 text-xs sm:text-sm font-black text-[#5E5147] hover:text-[#3D352E] hover:bg-[#FAF5EB] rounded-full transition-all cursor-pointer"
            >
              {isEn ? '💡 FAQ' : '💡 FAQ'}
            </button>
            <span className="text-[#DECDBB] select-none">•</span>
            <button
              type="button"
              onClick={() => navigateTo('support')}
              className="px-4 py-1.5 text-xs sm:text-sm font-black text-[#5E5147] hover:text-[#3D352E] hover:bg-[#FAF5EB] rounded-full transition-all cursor-pointer"
            >
              {isEn ? '💌 Support' : '💌 Hỗ trợ'}
            </button>
          </nav>

          {/* Right Area: Language Switcher + Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Language Switcher */}
            <LanguageSwitcher />

            <button
              type="button"
              onClick={() => navigateTo('login')}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-black rounded-xl sm:rounded-2xl bg-white hover:bg-[#FAF5EB] text-[#3D352E] border-2 border-[#3D352E] shadow-[1.5px_2px_0px_#3D352E] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
            >
              {isEn ? 'Log in' : 'Đăng nhập'}
            </button>
            <button
              type="button"
              onClick={() => navigateTo('dashboard')}
              className="px-3.5 sm:px-5 py-2 text-xs sm:text-sm font-black rounded-xl sm:rounded-2xl bg-[#DE5D53] hover:bg-[#C84F45] text-white border-2 border-[#3D352E] shadow-[2px_2.5px_0px_#3D352E] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>{isEn ? 'Get Started' : 'Bắt đầu ngay'}</span>
              <span className="text-xs sm:text-sm">✏️</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION: BỨC TRANH SÁP MÀU VỚI BÉ MASCOT VẪY TAY CHÀO ── */}
      <main className="flex-1 w-full max-w-[1560px] 2xl:max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8 sm:py-14 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 2xl:gap-20 items-center w-full">
          
          {/* CỘT TRÁI: LỜI GIỚI THIỆU ẤM ÁP & HÀNH ĐỘNG HỌC TẬP */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-5 lg:space-y-6 text-left">

            {/* Tiêu đề chính nét bút sáp đậm */}
            <h1 className="font-quicksand font-black text-3xl sm:text-5xl lg:text-[52px] xl:text-[58px] 2xl:text-[64px] text-[#3D352E] tracking-tight leading-[1.15]">
              {isEn ? (
                <>
                  Sketch your ultimate{' '}
                  <span className="text-[#DE5D53] relative inline-block">
                    vocabulary
                    <svg
                      className="absolute -bottom-1 left-0 w-full h-3 text-[#F4B41A]/70 -z-10"
                      viewBox="0 0 100 20"
                      preserveAspectRatio="none"
                      fill="currentColor"
                    >
                      <path d="M0,15 Q50,0 100,15 L100,20 Q50,5 0,20 Z" />
                    </svg>
                  </span>{' '}
                  mastery with Little Tiger! 🌿
                </>
              ) : (
                <>
                  Cùng Bé Hổ vẽ nên{' '}
                  <span className="text-[#DE5D53] relative inline-block">
                    vốn từ vựng
                    <svg
                      className="absolute -bottom-1 left-0 w-full h-3 text-[#F4B41A]/70 -z-10"
                      viewBox="0 0 100 20"
                      preserveAspectRatio="none"
                      fill="currentColor"
                    >
                      <path d="M0,15 Q50,0 100,15 L100,20 Q50,5 0,20 Z" />
                    </svg>
                  </span>{' '}
                  vững chắc nhất! 🌿
                </>
              )}
            </h1>

            {/* Cụm điểm nhấn số liệu: Số từ vựng & Số đề thi THPT QG có hiệu ứng đếm số lần lượt */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-1">
              {/* Thẻ 1: Số từ vựng học thuật (chạy trước: delay 150ms) */}
              <div className="bg-white border-2 border-[#3D352E] rounded-2xl p-4 sm:p-4.5 shadow-[2.5px_3.5px_0px_#3D352E] flex items-center gap-3.5 relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
                <div className="w-12 h-12 rounded-xl bg-[#FEEFEA] border-2 border-[#DE5D53] flex items-center justify-center text-2xl shrink-0 shadow-2xs">
                  📚
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-quicksand font-black text-2xl sm:text-3xl lg:text-4xl text-[#DE5D53] tracking-tight">
                      {formatNumber(vocabCount)}+
                    </span>
                    <span className="text-xs font-black text-[#DE5D53] uppercase tracking-wider">
                      {isEn ? 'Words' : 'Từ vựng'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-[#6E5D53] truncate">
                    {isEn ? 'Cambridge 10–21 & IELTS Academic' : 'Cambridge 10–21 & IELTS Academic'}
                  </p>
                </div>
              </div>

              {/* Thẻ 2: Số đề thi (chạy tiếp sau: delay 800ms) */}
              <div className="bg-white border-2 border-[#3D352E] rounded-2xl p-4 sm:p-4.5 shadow-[2.5px_3.5px_0px_#3D352E] flex items-center gap-3.5 relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
                <div className="w-12 h-12 rounded-xl bg-[#EAF3E7] border-2 border-[#557A46] flex items-center justify-center text-2xl shrink-0 shadow-2xs">
                  🎓
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-quicksand font-black text-2xl sm:text-3xl lg:text-4xl text-[#557A46] tracking-tight">
                      {examCount}+
                    </span>
                    <span className="text-xs font-black text-[#557A46] uppercase tracking-wider">
                      {isEn ? 'Mock Exams' : 'Đề thi THPT'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-[#6E5D53] truncate">
                    {isEn ? 'Standard Matrix & CBT Format' : 'Chuẩn ma trận BGD & CBT'}
                  </p>
                </div>
              </div>
            </div>

            {/* Lời dẫn truyện ấm áp */}
            <p className="text-base sm:text-lg lg:text-xl text-[#6E5D53] font-medium leading-relaxed max-w-2xl">
              {isEn
                ? 'Learning English is as delightful as flipping through pages of a colorful crayon sketchbook. Lock words into long-term memory with Spaced Repetition (SRS) and authentic exam room simulations.'
                : 'Học tiếng Anh như lật từng trang tập vẽ màu sáp. Ghi nhớ sâu bền qua phương pháp lặp lại ngắt quãng (SRS) và hệ thống phòng luyện thi chuẩn cấu trúc đề thực tế.'}
            </p>

            {/* Các nút gọi hành động chính */}
            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => navigateTo('dashboard')}
                className="px-8 py-4 rounded-2xl bg-[#557A46] hover:bg-[#476739] text-white font-black text-base sm:text-lg border-[2.5px] border-[#3D352E] shadow-[4px_5px_0px_#3D352E] active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2.5"
              >
                <span>{isEn ? 'Enter Study Room' : 'Vào phòng học ngay'}</span>
                <span className="text-xl">🚀</span>
              </button>

              <button
                type="button"
                onClick={() => navigateTo('features')}
                className="px-7 py-4 rounded-2xl bg-white hover:bg-[#FAF5EB] text-[#3D352E] font-black text-base sm:text-lg border-2 border-[#3D352E] shadow-[3px_3.5px_0px_#3D352E] active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{isEn ? 'Explore Features' : 'Khám phá tính năng'}</span>
                <span>🎨</span>
              </button>
            </div>

            {/* Sticker ghi chú nét sáp nhỏ phía dưới */}
            <div className="pt-2 flex flex-wrap items-center gap-4 sm:gap-7 text-xs sm:text-sm font-bold text-[#8A796F]">
              <div className="flex items-center gap-1.5">
                <span className="text-[#F4B41A] text-base">★</span>
                <span>{isEn ? 'Spaced Repetition (SRS SM-2)' : 'Thuật toán ngắt quãng SRS SM-2'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#DE5D53] text-base">❤</span>
                <span>{isEn ? 'Bilingual Curtain Reading Mode' : 'Song ngữ Anh - Việt che dịch'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#557A46] text-base">✓</span>
                <span>{isEn ? '38+ Real CBT Practice Tests' : '38+ Đề thi THPT Quốc Gia CBT'}</span>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: BỨC TRANH BÉ MASCOT ĐANG VẪY TAY CHÀO KÈM LỜI MỜI */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative w-full">
            
            {/* Khung tranh sáp màu lớn */}
            <div className="w-full max-w-[480px] xl:max-w-[530px] bg-white border-[3.5px] border-[#3D352E] rounded-[38px] p-6 sm:p-9 shadow-[7px_9px_0px_#3D352E] relative flex flex-col items-center text-center rotate-1 hover:rotate-0 transition-transform duration-300">
              
              {/* Cúc ghim giấy sáp trang trí trên đầu khung */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#DE5D53] border-2 border-[#3D352E] flex items-center justify-center shadow-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-white border border-[#3D352E]"></div>
              </div>

              {/* Đám mây thoại hình bong bóng sáp màu */}
              <div className="relative bg-[#FFF9EE] border-2 border-[#3D352E] px-5 py-3 rounded-2xl shadow-[3px_4px_0px_#3D352E] text-[#3D352E] font-quicksand font-bold text-sm sm:text-base md:text-lg flex items-center gap-2 mb-3 mt-1 transform -rotate-2">
                <span>{isEn ? '"Hello learner! Let\'s study together! 🐾"' : '"Chào bạn học ơi! Cùng tớ vào học nhé! 🐾"'}</span>
                {/* Mũi tên bong bóng chỉ xuống mascot */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-[#FFF9EE] border-r-2 border-b-2 border-[#3D352E] transform rotate-45"></div>
              </div>

              {/* Ảnh chú hổ Bé Mascot Churbito vẫy tay chào */}
              <div className="relative w-60 h-60 sm:w-72 sm:h-72 xl:w-80 xl:h-80 my-2 flex items-center justify-center">
                {/* Vùng tỏa màu sáp dịu nhẹ đằng sau */}
                <div className="absolute inset-2 bg-[#FEEFEA] rounded-full filter blur-md -z-0"></div>
                <img
                  src="/mascot/mascot_cozy.png"
                  alt="Bé Hổ Churbito"
                  className="w-full h-full object-contain relative z-10 mix-blend-multiply drop-shadow-sm transition-transform duration-300 hover:scale-105 select-none"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              {/* Thẻ tên bé Hổ bằng phong cách nét vẽ sáp */}
              <div className="mt-1 space-y-1">
                <h2 className="font-quicksand font-black text-xl sm:text-2xl text-[#3D352E]">
                  {isEn ? 'Churbito the Tiger 🐯' : 'Bé Hổ Churbito 🐯'}
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-[#86756C]">
                  {isEn
                    ? 'Your cheerful buddy for 15 minutes of joyful daily practice!'
                    : 'Người bạn nhỏ đồng hành cùng bạn ghi nhớ 15 phút mỗi ngày!'}
                </p>
              </div>

              {/* Nút nhỏ mời học tương tác */}
              <button
                type="button"
                onClick={() => navigateTo('dashboard')}
                className="mt-4 w-full py-3 px-5 bg-[#FAF5EB] hover:bg-[#F2ECE0] text-[#3D352E] text-xs sm:text-sm md:text-base font-black rounded-2xl border-2 border-[#3D352E] shadow-[2px_2.5px_0px_#3D352E] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{isEn ? 'Open App & Learn Now' : 'Mở app học ngay'}</span>
                <span>📖</span>
              </button>
            </div>

            {/* Nhãn dán sticker bé bên cạnh trang trí */}
            <div className="hidden sm:flex absolute -bottom-5 -left-4 bg-[#FAF5EB] border-2 border-[#3D352E] shadow-[2px_3px_0px_#3D352E] rounded-2xl px-3.5 py-1.5 text-xs sm:text-sm font-bold text-[#DE5D53] rotate-[-6deg]">
              {isEn ? '★ Keep your daily streak!' : '★ Giữ lửa mỗi ngày!'}
            </div>
            <div className="hidden sm:flex absolute -top-4 -right-3 bg-[#EAF3E7] border-2 border-[#557A46] shadow-[2px_3px_0px_#557A46] rounded-2xl px-3.5 py-1.5 text-xs sm:text-sm font-bold text-[#557A46] rotate-[8deg]">
              {isEn ? '🌱 100% Stress-free!' : '🌱 100% Không áp lực!'}
            </div>
          </div>
        </div>

        {/* ── SECTION 2: 3 BỨC TRANH BƯU THIẾP TÍNH NĂNG CỐT LÕI ── */}
        <section className="mt-16 sm:mt-24">
          <div className="text-center space-y-2 mb-10">
            <span className="text-xs font-black text-[#DE5D53] uppercase tracking-wider bg-[#FDEAE2] px-3 py-1 rounded-full border border-[#F8C8B8]">
              {isEn ? 'Feature Postcards' : 'Tranh ghép tính năng'}
            </span>
            <h2 className="font-quicksand font-black text-2xl sm:text-4xl text-[#3D352E]">
              {isEn ? 'Why You\'ll Love HiVocab? 🎨' : 'Vì sao bạn sẽ yêu thích HiVocab? 🎨'}
            </h2>
            <p className="text-xs sm:text-sm text-[#78685E] max-w-lg mx-auto">
              {isEn
                ? 'No more tedious rote learning. Every lesson is an engaging, colorful, and scientifically backed memory adventure.'
                : 'Không còn học vẹt nhàm chán. Mỗi bài học là một trải nghiệm ghi nhớ ngập tràn sắc màu và khoa học.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Kho 66.000+ từ vựng */}
            <div className="bg-white border-[2.5px] border-[#3D352E] rounded-3xl p-6 shadow-[4px_5px_0px_#3D352E] hover:-translate-y-1 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#FEEFEA] border-2 border-[#3D352E] flex items-center justify-center text-2xl mb-4 shadow-2xs">
                  📚
                </div>
                <h3 className="font-quicksand font-black text-lg text-[#3D352E] mb-2">
                  {isEn ? '66,000+ Academic Words Vault' : 'Kho 66.000+ Từ Học Thuật'}
                </h3>
                <p className="text-xs sm:text-sm text-[#6E5D53] leading-relaxed">
                  {isEn
                    ? 'Complete collections from Cambridge IELTS 10–21, IELTS Actual Tests, Oxford 3000, and Destination C1-C2 with standardized IPA phonetics, clear meanings, and authentic passage contexts.'
                    : 'Trọn bộ Cambridge 10–21, IELTS Actual Tests, Oxford 3000 và Destination C1-C2 chuẩn hóa phiên âm IPA, nghĩa tiếng Việt và câu ví dụ ngữ cảnh thật.'}
                </p>
              </div>
              <div className="mt-5 pt-3 border-t-2 border-dashed border-[#DECDBB]">
                <button
                  type="button"
                  onClick={() => navigateTo('features')}
                  className="text-xs font-black text-[#DE5D53] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{isEn ? 'Explore word vault' : 'Xem chi tiết danh mục'}</span>
                  <span>➔</span>
                </button>
              </div>
            </div>

            {/* Card 2: Lặp lại ngắt quãng SRS */}
            <div className="bg-white border-[2.5px] border-[#3D352E] rounded-3xl p-6 shadow-[4px_5px_0px_#3D352E] hover:-translate-y-1 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#EAF3E7] border-2 border-[#3D352E] flex items-center justify-center text-2xl mb-4 shadow-2xs">
                  🔄
                </div>
                <h3 className="font-quicksand font-black text-lg text-[#3D352E] mb-2">
                  {isEn ? 'Spaced Repetition SRS v4' : 'Lặp Lại Ngắt Quãng SRS v4'}
                </h3>
                <p className="text-xs sm:text-sm text-[#6E5D53] leading-relaxed">
                  {isEn
                    ? 'An intelligent algorithm that computes your natural forgetting curve, reminding you to review right at the golden moment to turn new words into permanent memory.'
                    : 'Thuật toán thông minh tính toán chu kỳ quên tự nhiên của não bộ, tự động nhắc nhở ôn tập đúng thời điểm vàng để biến từ mới thành phản xạ dài hạn.'}
                </p>
              </div>
              <div className="mt-5 pt-3 border-t-2 border-dashed border-[#DECDBB]">
                <button
                  type="button"
                  onClick={() => navigateTo('dashboard')}
                  className="text-xs font-black text-[#557A46] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{isEn ? 'Discover SRS algorithm' : 'Khám phá thuật toán SRS'}</span>
                  <span>➔</span>
                </button>
              </div>
            </div>

            {/* Card 3: Đọc hiểu song ngữ che dịch */}
            <div className="bg-white border-[2.5px] border-[#3D352E] rounded-3xl p-6 shadow-[4px_5px_0px_#3D352E] hover:-translate-y-1 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#E6F3FB] border-2 border-[#3D352E] flex items-center justify-center text-2xl mb-4 shadow-2xs">
                  🔍
                </div>
                <h3 className="font-quicksand font-black text-lg text-[#3D352E] mb-2">
                  {isEn ? 'Bilingual Reading & Curtain Mode' : 'Đọc Song Ngữ & Che Dịch'}
                </h3>
                <p className="text-xs sm:text-sm text-[#6E5D53] leading-relaxed">
                  {isEn
                    ? 'Our proprietary Curtain Mode lets you read aligned bilingual passages, stimulating your brain to deduce meanings in context before pulling the curtain for answers.'
                    : 'Chế độ rèm che Curtain Mode cho phép bạn đọc báo, đọc đề IELTS đối sánh câu thông minh, kích thích trí não tự đoán nghĩa trước khi bấm xem giải thích.'}
                </p>
              </div>
              <div className="mt-5 pt-3 border-t-2 border-dashed border-[#DECDBB]">
                <button
                  type="button"
                  onClick={() => navigateTo('features')}
                  className="text-xs font-black text-[#2A7BA0] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{isEn ? 'Experience reading room' : 'Trải nghiệm phòng đọc'}</span>
                  <span>➔</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 3: BỨC TRANH LỜI MỜI VÀO PHÒNG HỌC ── */}
        <section className="mt-14 sm:mt-20">
          <div className="w-full bg-[#FFFDF9] border-[3px] border-[#3D352E] rounded-[32px] p-6 sm:p-10 shadow-[5px_7px_0px_#3D352E] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-xs font-black text-[#DE5D53] uppercase tracking-wide">
                {isEn ? 'Little Tiger is waiting 🐾' : 'Bé Hổ đang đợi bạn 🐾'}
              </span>
              <h3 className="font-quicksand font-black text-2xl sm:text-3xl text-[#3D352E]">
                {isEn ? 'Ready to expand your vocabulary today?' : 'Sẵn sàng nâng cao vốn từ vựng hôm nay?'}
              </h3>
              <p className="text-xs sm:text-sm text-[#78685E] max-w-lg">
                {isEn
                  ? 'With just 15 minutes of daily practice on HiVocab, you will experience remarkable breakthroughs in your IELTS Reading and Listening skills!'
                  : 'Chỉ 15 phút ôn luyện cùng HiVocab mỗi ngày, bạn sẽ thấy sự khác biệt rõ rệt trong kỹ năng Đọc và Nghe IELTS!'}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigateTo('dashboard')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#DE5D53] hover:bg-[#C84F45] text-white font-black text-sm sm:text-base border-2 border-[#3D352E] shadow-[3px_4px_0px_#3D352E] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{isEn ? 'Start Learning with Tiger' : 'Vào học cùng Bé Hổ'}</span>
                <span>🚀</span>
              </button>
              <button
                type="button"
                onClick={() => navigateTo('login')}
                className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-white hover:bg-[#FAF5EB] text-[#3D352E] font-black text-sm sm:text-base border-2 border-[#3D352E] shadow-[2.5px_3px_0px_#3D352E] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
              >
                {isEn ? 'Log in to account' : 'Đăng nhập tài khoản'}
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER: BỨC TRANH BÌA SAU TRANG NHÃ THEO PHONG CÁCH COZY CRAYON ── */}
      <footer className="mt-16 border-t-2 border-dashed border-[#DECDBB] bg-[#FFFDF9]/80 text-[#6E5D53] text-xs sm:text-sm py-10 px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="max-w-[1560px] 2xl:max-w-[1720px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Logo & Thông tin giới thiệu */}
          <div className="md:col-span-2 space-y-3 pr-0 md:pr-8">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo-hi-transparent.png"
                alt="HiVocab Logo"
                className="h-12 sm:h-14 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/mascot/mascot_cozy.png';
                }}
              />
              <span className="font-quicksand font-bold text-base sm:text-lg text-[#3D352E] tracking-tight">
                HiVocab
              </span>
            </div>
            <p className="text-xs text-[#7A6A60] leading-relaxed max-w-md">
              {isEn
                ? 'A delightful, crayon-crafted English vocabulary ecosystem. Blending Spaced Repetition (SRS) with Active Bilingual Reading tailored for Cambridge IELTS and CBT exams.'
                : 'Hệ sinh thái học từ vựng tiếng Anh thông minh với phong cách tranh vẽ sáp màu ấm áp. Kết hợp Spaced Repetition (SRS) và phương pháp Đọc chủ động chuẩn hóa Cambridge IELTS & THPT Quốc Gia.'}
            </p>
            <div className="text-[11px] text-[#86756C] space-y-1 pt-1">
              <p>📍 <strong>{isEn ? 'Developer:' : 'Đơn vị phát triển:'}</strong> HiVocab Education</p>
              <p>✉️ <strong>{isEn ? 'Support:' : 'Hỗ trợ:'}</strong> <a href="mailto:support@hivocab.site" className="text-[#DE5D53] hover:underline font-bold">support@hivocab.site</a></p>
              <p>📞 <strong>Hotline/Zalo:</strong> 0846 407 898</p>
            </div>
          </div>

          {/* Cột điều hướng chức năng */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#3D352E]">
              {isEn ? 'Explore' : 'Khám phá'}
            </h4>
            <ul className="space-y-2 text-xs font-bold text-[#6E5D53]">
              <li>
                <a onClick={() => navigateTo('features')} className="cursor-pointer hover:text-[#DE5D53] transition-colors">
                  {isEn ? '🎨 Learning Features' : '🎨 Tính năng học tập'}
                </a>
              </li>
              <li>
                <a onClick={() => navigateTo('reviews')} className="cursor-pointer hover:text-[#DE5D53] transition-colors">
                  {isEn ? '💬 Learner Reviews' : '💬 Đánh giá từ bạn học'}
                </a>
              </li>
              <li>
                <a onClick={() => navigateTo('support')} className="cursor-pointer hover:text-[#DE5D53] transition-colors">
                  {isEn ? '💌 Support & Contact' : '💌 Hỗ trợ & Liên hệ'}
                </a>
              </li>
              <li>
                <a onClick={() => navigateTo('faq')} className="cursor-pointer hover:text-[#DE5D53] transition-colors">
                  {isEn ? '💡 Frequently Asked Questions (FAQ)' : '💡 Câu hỏi thường gặp (FAQ)'}
                </a>
              </li>
              <li>
                <a onClick={() => navigateTo('login')} className="cursor-pointer hover:text-[#DE5D53] transition-colors">
                  {isEn ? '🔑 Log in / Sign up' : '🔑 Đăng nhập / Đăng ký'}
                </a>
              </li>
            </ul>
          </div>

          {/* Cột pháp lý & chính sách */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#3D352E]">
              {isEn ? 'Legal & Policies' : 'Pháp lý & Điều khoản'}
            </h4>
            <ul className="space-y-2 text-xs font-bold text-[#6E5D53]">
              <li>
                <a href="/privacy" className="hover:text-[#DE5D53] transition-colors flex items-center gap-1.5">
                  <span>🛡️</span>
                  <span>{isEn ? 'Privacy Policy' : 'Chính sách quyền riêng tư'}</span>
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-[#DE5D53] transition-colors flex items-center gap-1.5">
                  <span>📜</span>
                  <span>{isEn ? 'Terms of Service' : 'Điều khoản dịch vụ'}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Dòng bản quyền cuối trang */}
        <div className="max-w-[1560px] 2xl:max-w-[1720px] mx-auto pt-6 border-t border-[#DECDBB]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#86756C] font-semibold">
          <p>
            {isEn
              ? '© 2026 HiVocab (hivocab.site). All rights reserved.'
              : '© 2026 HiVocab (hivocab.site). Bản quyền tập vẽ sáp màu được bảo lưu.'}
          </p>
          <div className="flex items-center gap-3">
            <a href="/privacy" className="hover:underline">Privacy Policy</a>
            <span>•</span>
            <a href="/terms" className="hover:underline">Terms of Service</a>
            <span>•</span>
            <a href="/" className="hover:underline text-[#DE5D53] font-bold">hivocab.site</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default PageLanding;
