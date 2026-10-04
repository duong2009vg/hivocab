// src/components/pages/PageLanding.jsx
// Trang giới thiệu HiVocab mô phỏng một bức tranh sáp màu của trẻ con (Cozy Crayon Handcrafted Picture Book)
import React, { useState, useEffect } from 'react';
import { useRoute } from '../../router/RouteContext.jsx';

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

  // Hiệu ứng hiện số lần lượt: Số từ vựng đếm trước (delay 150ms), số đề thi THPT đếm sau (delay 800ms)
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
      <header className="sticky top-0 z-40 px-3.5 sm:px-8 py-2.5 sm:py-3 bg-[#FAF5EB]/90 backdrop-blur-md border-b-2 border-[#3D352E]/10 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
          
          {/* Logo app bản sáp màu đã tách nền ở góc trên cùng bên trái */}
          <div
            onClick={() => navigateTo('landing')}
            className="flex items-center gap-2 cursor-pointer select-none group shrink-0"
            title="HiVocab – Trang chủ tranh sáp màu"
          >
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center transition-transform group-hover:scale-105">
              <img
                src="/logo-hi-transparent.png"
                alt="HiVocab Logo Sáp Màu"
                className="w-full h-full object-contain filter drop-shadow-xs"
                onError={(e) => {
                  e.currentTarget.src = '/mascot/mascot_cozy.png';
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="font-quicksand font-black text-lg sm:text-xl tracking-tight text-[#3D352E] leading-none">
                HiVocab
              </span>
              <span className="text-[9px] font-bold text-[#86756C] tracking-wider uppercase mt-0.5 hidden sm:block">
                Vườn tranh từ vựng 🌿
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links (Pill viên con nhộng sáp màu) */}
          <nav
            aria-label="Điều hướng trang giới thiệu"
            className="hidden md:flex items-center gap-1.5 bg-white border-2 border-[#3D352E] shadow-[2.5px_3px_0px_#3D352E] rounded-full px-3 py-1.5"
          >
            <button
              type="button"
              onClick={() => navigateTo('features')}
              className="px-3.5 py-1.5 text-xs font-black text-[#5E5147] hover:text-[#3D352E] hover:bg-[#FAF5EB] rounded-full transition-all cursor-pointer"
            >
              🎨 Tính năng
            </button>
            <span className="text-[#DECDBB] select-none">•</span>
            <button
              type="button"
              onClick={() => navigateTo('reviews')}
              className="px-3.5 py-1.5 text-xs font-black text-[#5E5147] hover:text-[#3D352E] hover:bg-[#FAF5EB] rounded-full transition-all cursor-pointer"
            >
              💬 Đánh giá
            </button>
            <span className="text-[#DECDBB] select-none">•</span>
            <button
              type="button"
              onClick={() => navigateTo('faq')}
              className="px-3.5 py-1.5 text-xs font-black text-[#5E5147] hover:text-[#3D352E] hover:bg-[#FAF5EB] rounded-full transition-all cursor-pointer"
            >
              💡 FAQ
            </button>
            <span className="text-[#DECDBB] select-none">•</span>
            <button
              type="button"
              onClick={() => navigateTo('support')}
              className="px-3.5 py-1.5 text-xs font-black text-[#5E5147] hover:text-[#3D352E] hover:bg-[#FAF5EB] rounded-full transition-all cursor-pointer"
            >
              💌 Hỗ trợ
            </button>
          </nav>

          {/* Action Buttons: Bắt đầu ngay & Đăng nhập (thu gọn vừa vặn) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => navigateTo('login')}
              className="px-2.5 sm:px-3.5 py-1.5 text-xs font-black rounded-xl sm:rounded-2xl bg-white hover:bg-[#FAF5EB] text-[#3D352E] border-2 border-[#3D352E] shadow-[1.5px_2px_0px_#3D352E] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => navigateTo('dashboard')}
              className="px-3 sm:px-4 py-1.5 text-xs font-black rounded-xl sm:rounded-2xl bg-[#DE5D53] hover:bg-[#C84F45] text-white border-2 border-[#3D352E] shadow-[2px_2.5px_0px_#3D352E] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center gap-1"
            >
              <span>Bắt đầu ngay</span>
              <span className="text-xs">✏️</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION: BỨC TRANH SÁP MÀU VỚI BÉ MASCOT VẪY TAY CHÀO ── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-7 sm:py-12 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* CỘT TRÁI: LỜI GIỚI THIỆU ẤM ÁP & HÀNH ĐỘNG HỌC TẬP */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-4 sm:space-y-5 text-left">

            {/* Tiêu đề chính nét bút sáp đậm */}
            <h1 className="font-quicksand font-black text-3xl sm:text-5xl lg:text-[54px] text-[#3D352E] tracking-tight leading-[1.15]">
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
            </h1>

            {/* Cụm điểm nhấn số liệu: Số từ vựng & Số đề thi THPT QG có hiệu ứng đếm số lần lượt */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Thẻ 1: Số từ vựng học thuật (chạy trước: delay 150ms) */}
              <div className="bg-white border-2 border-[#3D352E] rounded-2xl p-3 sm:p-3.5 shadow-[2.5px_3.5px_0px_#3D352E] flex items-center gap-3 relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
                <div className="w-11 h-11 rounded-xl bg-[#FEEFEA] border-2 border-[#DE5D53] flex items-center justify-center text-xl shrink-0 shadow-2xs">
                  📚
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-quicksand font-black text-2xl sm:text-3xl text-[#DE5D53] tracking-tight">
                      {formatNumber(vocabCount)}+
                    </span>
                    <span className="text-xs font-black text-[#DE5D53] uppercase tracking-wider">Từ vựng</span>
                  </div>
                  <p className="text-xs font-bold text-[#6E5D53] truncate">
                    Cambridge 10–21 & IELTS Academic
                  </p>
                </div>
              </div>

              {/* Thẻ 2: Số đề thi THPT Quốc Gia (chạy tiếp sau: delay 800ms) */}
              <div className="bg-white border-2 border-[#3D352E] rounded-2xl p-3 sm:p-3.5 shadow-[2.5px_3.5px_0px_#3D352E] flex items-center gap-3 relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
                <div className="w-11 h-11 rounded-xl bg-[#EAF3E7] border-2 border-[#557A46] flex items-center justify-center text-xl shrink-0 shadow-2xs">
                  🎓
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-quicksand font-black text-2xl sm:text-3xl text-[#557A46] tracking-tight">
                      {examCount}+
                    </span>
                    <span className="text-xs font-black text-[#557A46] uppercase tracking-wider">Đề thi THPT</span>
                  </div>
                  <p className="text-xs font-bold text-[#6E5D53] truncate">
                    Chuẩn ma trận BGD & CBT
                  </p>
                </div>
              </div>
            </div>

            {/* Lời dẫn truyện ấm áp */}
            <p className="text-sm sm:text-base lg:text-lg text-[#6E5D53] font-medium leading-relaxed max-w-xl">
              Học tiếng Anh như lật từng trang tập vẽ màu sáp. Ghi nhớ sâu bền qua phương pháp lặp lại ngắt quãng (SRS) và hệ thống phòng luyện thi chuẩn cấu trúc đề thực tế.
            </p>

            {/* Các nút gọi hành động chính */}
            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <button
                type="button"
                onClick={() => navigateTo('dashboard')}
                className="px-7 py-3.5 rounded-2xl bg-[#557A46] hover:bg-[#476739] text-white font-black text-base sm:text-lg border-[2.5px] border-[#3D352E] shadow-[4px_5px_0px_#3D352E] active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2.5"
              >
                <span>Vào phòng học ngay</span>
                <span className="text-xl">🚀</span>
              </button>

              <button
                type="button"
                onClick={() => navigateTo('features')}
                className="px-6 py-3.5 rounded-2xl bg-white hover:bg-[#FAF5EB] text-[#3D352E] font-black text-sm sm:text-base border-2 border-[#3D352E] shadow-[3px_3.5px_0px_#3D352E] active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Khám phá tính năng</span>
                <span>🎨</span>
              </button>
            </div>

            {/* Sticker ghi chú nét sáp nhỏ phía dưới */}
            <div className="pt-3 flex flex-wrap items-center gap-3 sm:gap-6 text-xs font-bold text-[#8A796F]">
              <div className="flex items-center gap-1.5">
                <span className="text-[#F4B41A] text-sm">★</span>
                <span>Thuật toán ngắt quãng SRS SM-2</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#DE5D53] text-sm">❤</span>
                <span>Song ngữ Anh - Việt che dịch</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#557A46] text-sm">✓</span>
                <span>38+ Đề thi THPT Quốc Gia CBT</span>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: BỨC TRANH BÉ MASCOT ĐANG VẪY TAY CHÀO KÈM LỜI MỜI */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
            
            {/* Khung tranh sáp màu lớn */}
            <div className="w-full max-w-md bg-white border-[3.5px] border-[#3D352E] rounded-[36px] p-6 sm:p-8 shadow-[6px_8px_0px_#3D352E] relative flex flex-col items-center text-center rotate-1 hover:rotate-0 transition-transform duration-300">
              
              {/* Cúc ghim giấy sáp trang trí trên đầu khung */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#DE5D53] border-2 border-[#3D352E] flex items-center justify-center shadow-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-white border border-[#3D352E]"></div>
              </div>

              {/* Đám mây thoại hình bong bóng sáp màu */}
              <div className="relative bg-[#FFF9EE] border-2 border-[#3D352E] px-4 py-2.5 rounded-2xl shadow-[3px_4px_0px_#3D352E] text-[#3D352E] font-quicksand font-bold text-sm sm:text-base flex items-center gap-2 mb-3 mt-1 transform -rotate-2">
                <span>"Chào bạn học ơi! Cùng tớ vào học nhé! 🐾"</span>
                {/* Mũi tên bong bóng chỉ xuống mascot */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-[#FFF9EE] border-r-2 border-b-2 border-[#3D352E] transform rotate-45"></div>
              </div>

              {/* Ảnh chú hổ Bé Mascot Churbito vẫy tay chào */}
              <div className="relative w-52 h-52 sm:w-64 sm:h-64 my-1 flex items-center justify-center">
                {/* Vùng tỏa màu sáp dịu nhẹ đằng sau */}
                <div className="absolute inset-2 bg-[#FEEFEA] rounded-full filter blur-md -z-0"></div>
                <img
                  src="/mascot/mascot_cozy.png"
                  alt="Bé Hổ Churbito vẫy tay chào bạn học"
                  className="w-full h-full object-contain relative z-10 mix-blend-multiply drop-shadow-sm transition-transform duration-300 hover:scale-105 select-none"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              {/* Thẻ tên bé Hổ bằng phong cách nét vẽ sáp */}
              <div className="mt-1 space-y-1">
                <h2 className="font-quicksand font-black text-xl text-[#3D352E]">
                  Bé Hổ Churbito 🐯
                </h2>
                <p className="text-xs font-semibold text-[#86756C]">
                  Người bạn nhỏ đồng hành cùng bạn ghi nhớ 15 phút mỗi ngày!
                </p>
              </div>

              {/* Nút nhỏ mời học tương tác */}
              <button
                type="button"
                onClick={() => navigateTo('dashboard')}
                className="mt-4 w-full py-2.5 px-4 bg-[#FAF5EB] hover:bg-[#F2ECE0] text-[#3D352E] text-xs sm:text-sm font-black rounded-xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Mở app học ngay</span>
                <span>📖</span>
              </button>
            </div>

            {/* Nhãn dán sticker bé bên cạnh trang trí */}
            <div className="hidden sm:flex absolute -bottom-5 -left-4 bg-[#FAF5EB] border-2 border-[#3D352E] shadow-[2px_3px_0px_#3D352E] rounded-2xl px-3 py-1.5 text-xs font-bold text-[#DE5D53] rotate-[-6deg]">
              ★ Giữ lửa mỗi ngày!
            </div>
            <div className="hidden sm:flex absolute -top-4 -right-3 bg-[#EAF3E7] border-2 border-[#557A46] shadow-[2px_3px_0px_#557A46] rounded-2xl px-3 py-1.5 text-xs font-bold text-[#557A46] rotate-[8deg]">
              🌱 100% Không áp lực!
            </div>
          </div>
        </div>

        {/* ── SECTION 2: 3 BỨC TRANH BƯU THIẾP TÍNH NĂNG CỐT LÕI ── */}
        <section className="mt-16 sm:mt-24">
          <div className="text-center space-y-2 mb-10">
            <span className="text-xs font-black text-[#DE5D53] uppercase tracking-wider bg-[#FDEAE2] px-3 py-1 rounded-full border border-[#F8C8B8]">
              Tranh ghép tính năng
            </span>
            <h2 className="font-quicksand font-black text-2xl sm:text-4xl text-[#3D352E]">
              Vì sao bạn sẽ yêu thích HiVocab? 🎨
            </h2>
            <p className="text-xs sm:text-sm text-[#78685E] max-w-lg mx-auto">
              Không còn học vẹt nhàm chán. Mỗi bài học là một trải nghiệm ghi nhớ ngập tràn sắc màu và khoa học.
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
                  Kho 66.000+ Từ Học Thuật
                </h3>
                <p className="text-xs sm:text-sm text-[#6E5D53] leading-relaxed">
                  Trọn bộ Cambridge 10–21, IELTS Actual Tests, Oxford 3000 và Destination C1-C2 chuẩn hóa phiên âm IPA, nghĩa tiếng Việt và câu ví dụ ngữ cảnh thật.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t-2 border-dashed border-[#DECDBB]">
                <button
                  type="button"
                  onClick={() => navigateTo('features')}
                  className="text-xs font-black text-[#DE5D53] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Xem chi tiết danh mục</span>
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
                  Lặp Lại Ngắt Quãng SRS v4
                </h3>
                <p className="text-xs sm:text-sm text-[#6E5D53] leading-relaxed">
                  Thuật toán thông minh tính toán chu kỳ quên tự nhiên của não bộ, tự động nhắc nhở ôn tập đúng thời điểm vàng để biến từ mới thành phản xạ dài hạn.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t-2 border-dashed border-[#DECDBB]">
                <button
                  type="button"
                  onClick={() => navigateTo('dashboard')}
                  className="text-xs font-black text-[#557A46] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Khám phá thuật toán SRS</span>
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
                  Đọc Song Ngữ & Che Dịch
                </h3>
                <p className="text-xs sm:text-sm text-[#6E5D53] leading-relaxed">
                  Chế độ rèm che Curtain Mode cho phép bạn đọc báo, đọc đề IELTS đối sánh câu thông minh, kích thích trí não tự đoán nghĩa trước khi bấm xem giải thích.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t-2 border-dashed border-[#DECDBB]">
                <button
                  type="button"
                  onClick={() => navigateTo('features')}
                  className="text-xs font-black text-[#2A7BA0] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Trải nghiệm phòng đọc</span>
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
                Bé Hổ đang đợi bạn 🐾
              </span>
              <h3 className="font-quicksand font-black text-2xl sm:text-3xl text-[#3D352E]">
                Sẵn sàng nâng cao vốn từ vựng hôm nay?
              </h3>
              <p className="text-xs sm:text-sm text-[#78685E] max-w-lg">
                Chỉ 15 phút ôn luyện cùng HiVocab mỗi ngày, bạn sẽ thấy sự khác biệt rõ rệt trong kỹ năng Đọc và Nghe IELTS!
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigateTo('dashboard')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#DE5D53] hover:bg-[#C84F45] text-white font-black text-sm sm:text-base border-2 border-[#3D352E] shadow-[3px_4px_0px_#3D352E] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Vào học cùng Bé Hổ</span>
                <span>🚀</span>
              </button>
              <button
                type="button"
                onClick={() => navigateTo('login')}
                className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-white hover:bg-[#FAF5EB] text-[#3D352E] font-black text-sm sm:text-base border-2 border-[#3D352E] shadow-[2.5px_3px_0px_#3D352E] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
              >
                Đăng nhập tài khoản
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER: BỨC TRANH BÌA SAU TRANG NHÃ THEO PHONG CÁCH COZY CRAYON ── */}
      <footer className="mt-16 border-t-2 border-dashed border-[#DECDBB] bg-[#FFFDF9]/80 text-[#6E5D53] text-xs sm:text-sm py-10 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Logo & Thông tin giới thiệu */}
          <div className="md:col-span-2 space-y-3 pr-0 md:pr-8">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo-hi-transparent.png"
                alt="HiVocab Logo"
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/mascot/mascot_cozy.png';
                }}
              />
              <span className="font-quicksand font-black text-xl text-[#3D352E] tracking-tight">
                HiVocab!
              </span>
            </div>
            <p className="text-xs text-[#7A6A60] leading-relaxed max-w-md">
              Hệ sinh thái học từ vựng tiếng Anh thông minh với phong cách tranh vẽ sáp màu ấm áp. Kết hợp Spaced Repetition (SRS) và phương pháp Đọc chủ động chuẩn hóa Cambridge IELTS & THPT Quốc Gia.
            </p>
            <div className="text-[11px] text-[#86756C] space-y-1 pt-1">
              <p>📍 <strong>Đơn vị phát triển:</strong> HiVocab Education</p>
              <p>✉️ <strong>Hỗ trợ:</strong> <a href="mailto:support@hivocab.site" className="text-[#DE5D53] hover:underline font-bold">support@hivocab.site</a></p>
              <p>📞 <strong>Hotline/Zalo:</strong> 0846 407 898</p>
            </div>
          </div>

          {/* Cột điều hướng chức năng */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#3D352E]">
              Khám phá
            </h4>
            <ul className="space-y-2 text-xs font-bold text-[#6E5D53]">
              <li>
                <a onClick={() => navigateTo('features')} className="cursor-pointer hover:text-[#DE5D53] transition-colors">
                  🎨 Tính năng học tập
                </a>
              </li>
              <li>
                <a onClick={() => navigateTo('reviews')} className="cursor-pointer hover:text-[#DE5D53] transition-colors">
                  💬 Đánh giá từ bạn học
                </a>
              </li>
              <li>
                <a onClick={() => navigateTo('support')} className="cursor-pointer hover:text-[#DE5D53] transition-colors">
                  💌 Hỗ trợ & Liên hệ
                </a>
              </li>
              <li>
                <a onClick={() => navigateTo('faq')} className="cursor-pointer hover:text-[#DE5D53] transition-colors">
                  💡 Câu hỏi thường gặp (FAQ)
                </a>
              </li>
              <li>
                <a onClick={() => navigateTo('login')} className="cursor-pointer hover:text-[#DE5D53] transition-colors">
                  🔑 Đăng nhập / Đăng ký
                </a>
              </li>
            </ul>
          </div>

          {/* Cột pháp lý & chính sách */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#3D352E]">
              Pháp lý & Điều khoản
            </h4>
            <ul className="space-y-2 text-xs font-bold text-[#6E5D53]">
              <li>
                <a href="/privacy" className="hover:text-[#DE5D53] transition-colors flex items-center gap-1.5">
                  <span>🛡️</span>
                  <span>Chính sách quyền riêng tư</span>
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-[#DE5D53] transition-colors flex items-center gap-1.5">
                  <span>📜</span>
                  <span>Điều khoản dịch vụ</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Dòng bản quyền cuối trang */}
        <div className="max-w-7xl mx-auto pt-6 border-t border-[#DECDBB]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#86756C] font-semibold">
          <p>© 2026 HiVocab (hivocab.site). Bản quyền tập vẽ sáp màu được bảo lưu.</p>
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
