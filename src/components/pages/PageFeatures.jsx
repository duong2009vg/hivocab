// src/components/pages/PageFeatures.jsx
// Trang tính năng HiVocab hỗ trợ song ngữ Tiếng Anh (Mặc định) và Tiếng Việt theo phong cách Cozy Crayon Handcrafted
import React from 'react';
import { useRoute } from '../../router/RouteContext.jsx';
import { useLandingLang } from '../../context/LandingLangContext.jsx';
import LanguageSwitcher from '../common/LanguageSwitcher.jsx';

export function PageFeatures() {
  const { navigateTo } = useRoute();
  const { isEn } = useLandingLang();

  const features = isEn
    ? [
        {
          tag: 'Exclusive',
          tagColor: 'bg-[#FEEFEA] text-[#DE5D53] border-[#DE5D53]/40',
          icon: '📚',
          title: '66,000+ Cambridge & Vol Word Vault',
          desc: 'All 12 Cambridge IELTS books (CAM 10–21) and 9 IELTS Actual Test volumes (VOL 1–9). 100% standardized with parts of speech (POS), international IPA phonetics, accurate meanings, and real example sentences extracted directly from test passages.',
          highlight: '100 Tests • 300 Complete Passages',
        },
        {
          tag: 'Breakthrough',
          tagColor: 'bg-[#EAF3E7] text-[#557A46] border-[#557A46]/40',
          icon: '🔍',
          title: 'Active Reading & Curtain Mode',
          desc: 'Our proprietary Curtain Mode lets you read aligned bilingual English-Vietnamese passages with a smart collapsible curtain. Trains your brain to actively deduce meanings in context before revealing translations, with integrated cloze tests.',
          highlight: 'Double your reading speed & retention',
        },
        {
          tag: 'Scientific',
          tagColor: 'bg-[#FEF9EE] text-[#D97706] border-[#D97706]/40',
          icon: '🔄',
          title: 'Spaced Repetition (SRS SM-2)',
          desc: 'Powered by the SuperMemo-2 (SM-2) algorithm across 5 memory tiers from Fresh (1 day) to Mastered (30 days). Automatically calculates the exact moment you are about to forget a word to prompt review, locking words into long-term memory.',
          highlight: 'Saves up to 80% study time',
        },
        {
          tag: 'Multi-Sensory',
          tagColor: 'bg-[#F3E8FF] text-[#8B5CF6] border-[#8B5CF6]/40',
          icon: '🎮',
          title: '5 Dynamic Practice Modes',
          desc: 'Flexibly switch between 3D Flip Flashcards for rapid reflex, 4-Option Multiple Choice (Quiz), Contextual Type-in for spelling precision, Native Audio Dictation for listening acuity, and fun Adventure Challenges.',
          highlight: 'Fun, engaging, zero study fatigue',
        },
        {
          tag: 'AI Assisted',
          tagColor: 'bg-[#FEEFEA] text-[#DE5D53] border-[#DE5D53]/40',
          icon: '🤖',
          title: 'AI Companion & Contextual Dictionary',
          desc: 'Smart AI deeply analyzes academic sentence context, clarifying collocations, synonyms, and offering unique mnemonic memory hooks. Instant word lookup without ever leaving your study screen.',
          highlight: 'Contextual explanations tailored to real exams',
        },
        {
          tag: 'Discipline',
          tagColor: 'bg-[#E6F3FB] text-[#2A7BA0] border-[#2A7BA0]/40',
          icon: '📊',
          title: 'Progress Analytics & Daily Streak',
          desc: 'Track mastered words and cumulative learning time with intuitive charts. The daily flame Streak keeps you motivated to sustain everyday study habits for the highest scores.',
          highlight: 'Build lifelong study discipline',
        },
      ]
    : [
        {
          tag: 'Độc quyền',
          tagColor: 'bg-[#FEEFEA] text-[#DE5D53] border-[#DE5D53]/40',
          icon: '📚',
          title: 'Kho 66.000+ từ vựng Cam & Vol',
          desc: 'Trọn bộ 12 cuốn Cambridge IELTS (CAM 10–21) và 9 tập IELTS Actual Tests (VOL 1–9). Chuẩn hóa 100% từ loại (POS), phiên âm quốc tế (IPA), bản dịch chuẩn xác và câu ví dụ thật từ bài đọc.',
          highlight: '100 Tests • 300 Passages đầy đủ',
        },
        {
          tag: 'Đột phá',
          tagColor: 'bg-[#EAF3E7] text-[#557A46] border-[#557A46]/40',
          icon: '🔍',
          title: 'Đọc Chủ Động & Che Bản Dịch',
          desc: 'Phương pháp Curtain Mode độc quyền: Đọc song ngữ Anh - Việt đối chiếu với rèm che thông minh giúp kích thích tư duy tự suy luận nghĩa từ ngữ cảnh. Tích hợp bài tập đục lỗ ngay trong bài đọc.',
          highlight: 'Tăng tốc độ đọc hiểu x2',
        },
        {
          tag: 'Khoa học',
          tagColor: 'bg-[#FEF9EE] text-[#D97706] border-[#D97706]/40',
          icon: '🔄',
          title: 'Lặp lại ngắt quãng (SRS SM-2)',
          desc: 'Thuật toán SuperMemo-2 phân tầng 5 cấp độ trí nhớ từ Khởi động (1 ngày) đến Thành thạo (30 ngày). Nhắc nhở ôn tập chính xác thời điểm chuẩn bị quên, chuyển hóa từ vựng thành trí nhớ dài hạn vĩnh viễn.',
          highlight: 'Tiết kiệm 80% thời gian học',
        },
        {
          tag: 'Đa giác quan',
          tagColor: 'bg-[#F3E8FF] text-[#8B5CF6] border-[#8B5CF6]/40',
          icon: '🎮',
          title: '5 Chế độ Luyện tập Đa dạng',
          desc: 'Tự do đổi gió với Flashcard lật mặt 3D, Trắc nghiệm 4 đáp án (Quiz) phản xạ, Điền từ ngữ cảnh (Type-in), Nghe chép chính tả (Dictation) chuẩn giọng bản ngữ và Trò chơi phiêu lưu vượt ải sinh động.',
          highlight: 'Học không chán, nhớ bền lâu',
        },
        {
          tag: 'Trí tuệ AI',
          tagColor: 'bg-[#FEEFEA] text-[#DE5D53] border-[#DE5D53]/40',
          icon: '🤖',
          title: 'Trợ lý AI & Từ điển Ngữ cảnh',
          desc: 'Trí tuệ nhân tạo phân tích ngữ cảnh học thuật chuyên sâu, giải nghĩa Collocations, Synonyms và cung cấp mẹo ghi nhớ (Mnemonics) độc đáo. Tra cứu tức thời không rời màn hình học.',
          highlight: 'Giải nghĩa sát đề thi thật',
        },
        {
          tag: 'Động lực',
          tagColor: 'bg-[#E6F3FB] text-[#2A7BA0] border-[#2A7BA0]/40',
          icon: '📊',
          title: 'Thống kê Tiến độ & Chuỗi Streak',
          desc: 'Theo dõi chi tiết số từ đã thành thạo, thời gian học tập tích lũy qua biểu đồ trực quan. Ngọn lửa Streak hàng ngày nhắc nhở bạn duy trì thói quen học tập để gặt hái kết quả cao nhất.',
          highlight: 'Xây dựng kỷ luật học mỗi ngày',
        },
      ];

  return (
    <div
      id="page-features"
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
              className="px-4 py-1.5 text-xs sm:text-sm font-black text-[#DE5D53] bg-[#FDEAE2] rounded-full transition-all cursor-pointer"
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
      <main className="flex-1 w-full max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-10 sm:py-14">
        
        {/* Header Intro */}
        <div className="text-center mb-12 sm:mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF3E7] text-[#557A46] text-xs font-black uppercase tracking-wider border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E]">
            <span>✨</span>
            <span>{isEn ? 'Comprehensive Learning Ecosystem' : 'Hệ thống học tập toàn diện'}</span>
          </div>

          <h1 className="font-quicksand font-black text-3xl sm:text-5xl text-[#3D352E] tracking-tight">
            {isEn ? 'Breakthrough Features of HiVocab 🎨' : 'Tính năng đột phá của HiVocab 🎨'}
          </h1>

          <p className="text-sm sm:text-base text-[#6E5D53] font-medium max-w-2xl mx-auto leading-relaxed">
            {isEn
              ? 'Explore smart, scientifically designed tools engineered to help you conquer academic vocabulary and elevate your IELTS band score with ease.'
              : 'Khám phá các công cụ thông minh được thiết kế chuyên biệt để giúp bạn làm chủ từ vựng học thuật và bứt phá band điểm IELTS Reading nhanh nhất.'}
          </p>
        </div>

        {/* 6 Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {features.map((item, idx) => (
            <div
              key={idx}
              className="bg-white border-[2.5px] border-[#3D352E] rounded-3xl p-6 sm:p-7 shadow-[4px_5px_0px_#3D352E] hover:-translate-y-1 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-13 h-13 rounded-2xl bg-[#FFFDF9] border-2 border-[#3D352E] shadow-2xs flex items-center justify-center text-2xl">
                    {item.icon}
                  </div>
                  <span className={`text-[11px] font-black px-3 py-1 rounded-full border-2 border-[#3D352E] uppercase tracking-wider ${item.tagColor}`}>
                    {item.tag}
                  </span>
                </div>

                <h3 className="font-quicksand font-black text-lg sm:text-xl text-[#3D352E] mb-2 leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-sm text-[#6E5D53] leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t-2 border-dashed border-[#DECDBB] flex items-center gap-2 text-xs font-black text-[#557A46]">
                <span>✓</span>
                <span>{item.highlight}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Box */}
        <div className="mt-14 sm:mt-20 w-full bg-[#FFFDF9] border-[3px] border-[#3D352E] rounded-[32px] p-6 sm:p-10 shadow-[5px_7px_0px_#3D352E] flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-2">
            <span className="text-xs font-black text-[#DE5D53] uppercase tracking-wider">
              {isEn ? 'Join Thousands of Learners 🐾' : 'Cùng hàng ngàn bạn học 🐾'}
            </span>
            <h2 className="font-quicksand font-black text-2xl sm:text-3xl text-[#3D352E]">
              {isEn
                ? 'Ready to boost your IELTS score with HiVocab?'
                : 'Sẵn sàng bứt phá band điểm IELTS cùng HiVocab?'}
            </h2>
            <p className="text-xs sm:text-sm text-[#78685E] max-w-xl">
              {isEn
                ? 'Create your free account today and unlock full access to our comprehensive word collections and practice modules!'
                : 'Đăng ký tài khoản ngay hôm nay để nhận trọn vẹn 2 tháng trải nghiệm Full tính năng hoàn toàn miễn phí!'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigateTo('dashboard')}
            className="w-full md:w-auto px-8 py-4 rounded-2xl bg-[#557A46] hover:bg-[#476739] text-white font-black text-base border-[2.5px] border-[#3D352E] shadow-[4px_5px_0px_#3D352E] active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
          >
            <span>{isEn ? 'Start Learning for Free' : 'Bắt đầu học miễn phí'}</span>
            <span className="text-lg">🚀</span>
          </button>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="mt-16 border-t-2 border-dashed border-[#DECDBB] bg-[#FFFDF9]/80 text-[#6E5D53] text-xs py-8 px-4 sm:px-8 text-center">
        <p>© 2026 HiVocab (hivocab.site). {isEn ? 'All rights reserved.' : 'Bản quyền tập vẽ sáp màu được bảo lưu.'}</p>
      </footer>
    </div>
  );
}

export default PageFeatures;
