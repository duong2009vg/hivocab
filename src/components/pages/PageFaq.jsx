// src/components/pages/PageFaq.jsx
// Trang giải đáp thắc mắc FAQ hỗ trợ song ngữ Tiếng Anh (Mặc định) và Tiếng Việt theo phong cách Cozy Crayon Handcrafted
import React, { useState } from 'react';
import { useRoute } from '../../router/RouteContext.jsx';
import { useLandingLang } from '../../context/LandingLangContext.jsx';
import LanguageSwitcher from '../common/LanguageSwitcher.jsx';

export function PageFaq() {
  const { navigateTo } = useRoute();
  const { isEn } = useLandingLang();

  // Mặc định mở câu hỏi đầu tiên
  const [openIndexes, setOpenIndexes] = useState([0]);

  const toggleAccordion = (idx) => {
    setOpenIndexes((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const faqs = isEn
    ? [
        {
          q: 'How does the 2-month Full Access Launch Gift work?',
          a: 'To celebrate HiVocab\'s official launch, every newly registered account receives an immediate complimentary 2 months of Full Premium access (unlocking all 66,000+ words across Cambridge 10–21, IELTS Vol 1–9, Active Reading Curtain Mode, and AI assistance). It activates automatically upon signup—100% free with no credit card required!',
        },
        {
          q: 'Where does the 66,000+ vocabulary database come from?',
          a: 'All vocabulary is rigorously extracted and standardized directly from all 12 Cambridge IELTS books (CAM 10 through CAM 21) and 9 volumes of IELTS Actual Tests (VOL 1 through VOL 9), complemented by Destination B1–C2 and Oxford 3000. Every single word includes international IPA phonetics, parts of speech (POS), clear contextual definitions, and authentic example sentences quoted directly from real test passages.',
        },
        {
          q: 'How does Active Reading & Curtain Mode work?',
          a: 'This is HiVocab\'s signature reading methodology: IELTS passages are presented in aligned English-Vietnamese layout. You can drag or toggle the "Curtain" to conceal the translation, training your brain to actively comprehend English and deduce meanings in context. You only reveal the curtain when you need to verify. Built-in fill-in-the-blank exercises are embedded right inside the passage.',
        },
        {
          q: 'How does the Spaced Repetition (SRS SM-2) algorithm help retention?',
          a: 'HiVocab leverages the proven SuperMemo-2 (SM-2) memory algorithm based on cognitive science. The system schedules learning into 5 memory tiers (1 day, 3 days, 7 days, 14 days, 30 days) and automatically calculates the exact moment you are about to forget a word to prompt a review session. This converts vocabulary into permanent long-term memory while saving up to 80% of study time.',
        },
        {
          q: 'What interactive practice modes are available?',
          a: 'You can flexibly switch between 5 practice modes: 3D Flip Flashcards for rapid reflex, 4-Option Multiple Choice (Quiz) for fast recall, Contextual Type-in for spelling precision, Native Audio Dictation for listening acuity, and Adventure Vocabulary Challenges for gamified learning.',
        },
        {
          q: 'Can I study on mobile devices or install it like an app?',
          a: 'Yes! HiVocab is fully responsive and optimized for both iOS and Android browsers. You can also install it directly to your home screen as a Progressive Web App (PWA) for a lightning-fast native app experience with zero download friction.',
        },
        {
          q: 'Who can I contact if I need assistance or encounter an issue?',
          a: 'Our team is on standby 24/7! You can chat directly with the Admin on Zalo at 0846 407 898 or email support@hivocab.site. We cherish every suggestion and feedback from our community!',
        },
      ]
    : [
        {
          q: 'Chương trình quà tặng 2 tháng Full tính năng áp dụng như thế nào?',
          a: 'Nhân dịp HiVocab chính thức ra mắt, tất cả người dùng đăng ký tài khoản mới đều được tặng ngay 2 tháng trải nghiệm trọn vẹn 100% tính năng Premium (mở khóa toàn bộ 66.000+ từ vựng Cam 10–21, IELTS Vol 1–9, Chế độ Đọc Chủ Động Curtain Mode và Trợ lý AI). Quà tặng được kích hoạt tự động ngay sau khi tạo tài khoản, hoàn toàn miễn phí và không cần nhập thẻ ngân hàng!',
        },
        {
          q: 'Kho 66.000+ từ vựng của HiVocab có nguồn gốc từ đâu và bao gồm những gì?',
          a: 'Toàn bộ từ vựng được trích xuất và chuẩn hóa trực tiếp từ trọn bộ 12 cuốn Cambridge IELTS (CAM 10 đến CAM 21) và 9 tập IELTS Actual Tests (VOL 1 đến VOL 9), bổ trợ thêm Destination B1-C2 và Oxford 3000. Mỗi từ đều có phiên âm quốc tế (IPA), phân loại từ loại (POS), nghĩa chuẩn xác và đặc biệt là câu ví dụ trích trực tiếp từ chính bài đọc IELTS thực tế.',
        },
        {
          q: 'Chế độ Đọc Chủ Động & Che Bản Dịch (Curtain Mode) hoạt động thế nào?',
          a: 'Đây là phương pháp luyện đọc độc quyền trên HiVocab: Bài đọc IELTS được trình bày song ngữ Anh - Việt đối xứng. Bạn có thể kéo thanh "Rèm che" để che bản dịch tiếng Việt, buộc não bộ phải chủ động đọc hiểu tiếng Anh và tự suy đoán nghĩa trong ngữ cảnh, chỉ mở hé rèm khi cần kiểm tra lại. Đi kèm là tính năng bài tập đục lỗ từ vựng giúp bạn ghi nhớ từ ngay trong bài đọc.',
        },
        {
          q: 'Thuật toán Lặp lại Ngắt quãng (Spaced Repetition - SRS SM-2) giúp tôi nhớ từ ra sao?',
          a: 'HiVocab ứng dụng thuật toán SuperMemo-2 (SM-2) theo quy luật khoa học về trí nhớ. Hệ thống chia việc học thành 5 cấp độ (1 ngày, 3 ngày, 7 ngày, 14 ngày, 30 ngày) và tự động tính toán chính xác thời điểm bạn chuẩn bị quên từ để nhắc nhở ôn tập, biến từ vựng thành trí nhớ dài hạn vĩnh viễn và tiết kiệm 80% thời gian.',
        },
        {
          q: 'HiVocab có những chế độ luyện tập nào?',
          a: 'Bạn có thể linh hoạt chuyển đổi giữa 5 chế độ: Flashcard lật thẻ 3D thông minh, Trắc nghiệm 4 đáp án (Quiz) rèn phản xạ, Điền từ vào ngữ cảnh (Type-in) chuẩn chính tả, Nghe chép chính tả (Dictation) luyện tai nghe với giọng chuẩn bản ngữ, và Trò chơi phiêu lưu từ vựng vượt ải thú vị.',
        },
        {
          q: 'Tôi có thể dùng HiVocab trên điện thoại hay cài như app không?',
          a: 'Có! HiVocab được tối ưu hóa toàn diện trên cả điện thoại iOS, Android và máy tính bảng. Bạn cũng có thể cài đặt ứng dụng trực tiếp lên màn hình chính (PWA) để học nhanh chóng như một app bản địa mà không tốn dung lượng máy.',
        },
        {
          q: 'Nếu gặp lỗi hoặc cần hỗ trợ trong quá trình học, tôi liên hệ ai?',
          a: 'Vì website mới ra mắt nên đội ngũ luôn túc trực hỗ trợ bạn 24/7! Nếu gặp bất kỳ lỗi hiển thị, sự cố đồng bộ hoặc cần góp ý phát triển tính năng, bạn hãy liên hệ trực tiếp Admin qua Zalo số: 0846 407 898 (hoặc nhấn nút Chat Zalo ở mục Hỗ trợ). Chúng tôi rất trân trọng mọi đóng góp của bạn!',
        },
      ];

  return (
    <div
      id="page-faq"
      className="page active min-h-screen font-nunito text-[#3D352E] bg-[#FAF5EB] relative flex flex-col justify-between selection:bg-[#EBDDC8] selection:text-[#3D352E]"
      style={{
        backgroundImage: 'radial-gradient(#E2D6C3 1.2px, transparent 1.2px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* ── TOP CRAYON HEADER & NAVIGATION BAR ── */}
      <header className="sticky top-0 z-40 w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-3 sm:py-3.5 bg-[#FAF5EB]/95 backdrop-blur-md border-b-2 border-[#3D352E]/10 transition-all">
        <div className="w-full flex items-center justify-between gap-3 sm:gap-6">
          
          {/* Logo app */}
          <div
            onClick={() => navigateTo('landing')}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none group shrink-0"
            title={isEn ? "Back to Home" : "Về trang chủ"}
          >
            <div className="relative w-11 h-11 sm:w-13 sm:h-13 flex items-center justify-center transition-transform group-hover:scale-105">
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

          {/* Desktop Navigation Links */}
          <nav
            aria-label="Điều hướng trang"
            className="hidden md:flex items-center gap-2 bg-white border-2 border-[#3D352E] shadow-[2.5px_3px_0px_#3D352E] rounded-full px-4 py-1.5"
          >
            <button
              type="button"
              onClick={() => navigateTo('landing')}
              className="px-4 py-1.5 text-xs sm:text-sm font-black text-[#5E5147] hover:text-[#3D352E] hover:bg-[#FAF5EB] rounded-full transition-all cursor-pointer"
            >
              {isEn ? '🏠 Home' : '🏠 Trang chủ'}
            </button>
            <span className="text-[#DECDBB] select-none">•</span>
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
              className="px-4 py-1.5 text-xs sm:text-sm font-black text-[#DE5D53] bg-[#FDEAE2] rounded-full transition-all cursor-pointer"
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

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <LanguageSwitcher />

            <button
              type="button"
              onClick={() => navigateTo('dashboard')}
              className="px-3.5 sm:px-5 py-2 text-xs sm:text-sm font-black rounded-xl sm:rounded-2xl bg-[#DE5D53] hover:bg-[#C84F45] text-white border-2 border-[#3D352E] shadow-[2px_2.5px_0px_#3D352E] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>{isEn ? 'Learn Now' : 'Vào học ngay'}</span>
              <span className="text-xs sm:text-sm">🚀</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
        
        {/* Header Intro */}
        <div className="text-center mb-10 sm:mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF3E7] text-[#557A46] text-xs font-black uppercase tracking-wider border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E]">
            <span>💡</span>
            <span>{isEn ? 'Frequently Asked Questions' : 'Giải đáp thắc mắc'}</span>
          </div>

          <h1 className="font-quicksand font-black text-3xl sm:text-5xl text-[#3D352E] tracking-tight">
            {isEn ? 'HiVocab Help & FAQ 🎨' : 'Câu hỏi thường gặp 🎨'}
          </h1>

          <p className="text-sm sm:text-base text-[#6E5D53] font-medium max-w-xl mx-auto leading-relaxed">
            {isEn
              ? 'Everything you need to know about HiVocab, our 66,000+ Cambridge & IELTS word vault, and special launch perks.'
              : 'Mọi điều bạn cần biết về HiVocab, kho 66.000+ từ vựng Cambridge / IELTS Vol và chương trình quà tặng ra mắt.'}
          </p>
        </div>

        {/* Accordion FAQ List */}
        <div className="space-y-4">
          {faqs.map((f, idx) => {
            const isOpen = openIndexes.includes(idx);
            return (
              <div
                key={idx}
                className="bg-white border-[2.5px] border-[#3D352E] rounded-2xl shadow-[3px_4px_0px_#3D352E] overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(idx)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-[#FAF5EB] transition-colors cursor-pointer gap-3"
                  aria-expanded={isOpen}
                >
                  <span className="font-quicksand font-black text-sm sm:text-base text-[#3D352E] flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-[#FAF5EB] border border-[#3D352E] flex items-center justify-center text-xs font-black text-[#DE5D53] shrink-0">
                      {idx + 1}
                    </span>
                    <span>{f.q}</span>
                  </span>
                  <span className={`w-7 h-7 rounded-full bg-[#FAF5EB] border border-[#3D352E] flex items-center justify-center text-xs font-black text-[#3D352E] shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-2 text-xs sm:text-sm text-[#5C4F46] leading-relaxed border-t-2 border-dashed border-[#DECDBB] bg-[#FFFDF9]">
                    <p>{f.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact Support Box */}
        <div className="mt-12 sm:mt-16 p-6 sm:p-8 rounded-3xl bg-[#FFFDF9] border-[3px] border-[#3D352E] shadow-[4px_5px_0px_#3D352E] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-13 h-13 rounded-2xl bg-[#EAF3E7] border-2 border-[#3D352E] flex items-center justify-center text-2xl shrink-0 shadow-2xs">
              🐯
            </div>
            <div>
              <h3 className="font-quicksand font-black text-base sm:text-lg text-[#3D352E]">
                {isEn ? 'Still have an unanswered question?' : 'Vẫn còn thắc mắc chưa được giải đáp?'}
              </h3>
              <p className="text-xs sm:text-sm text-[#78685E] mt-0.5">
                {isEn
                  ? 'Our team and admin are on standby on Zalo to assist you anytime.'
                  : 'Admin luôn túc trực Zalo để hỗ trợ bạn bất cứ lúc nào.'}
              </p>
            </div>
          </div>

          <a
            href="https://zalo.me/0846407898"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0068FF] hover:bg-[#0054cc] text-white font-black text-xs sm:text-sm rounded-2xl border-2 border-[#3D352E] shadow-[2px_2.5px_0px_#3D352E] active:translate-y-0.5 transition-all shrink-0 cursor-pointer"
          >
            <span>💬</span>
            <span>{isEn ? 'Chat via Zalo: 0846 407 898' : 'Nhắn Zalo: 0846 407 898'}</span>
          </a>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="mt-16 border-t-2 border-dashed border-[#DECDBB] bg-[#FFFDF9]/80 text-[#6E5D53] text-xs py-8 px-4 sm:px-8 text-center">
        <p>© 2026 HiVocab (hivocab.site). {isEn ? 'All rights reserved.' : 'Bản quyền tập vẽ sáp màu được bảo lưu.'}</p>
      </footer>
    </div>
  );
}

export default PageFaq;
