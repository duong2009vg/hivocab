// src/components/pages/PageReviews.jsx
// Trang đánh giá trải nghiệm HiVocab hỗ trợ song ngữ Tiếng Anh (Mặc định) và Tiếng Việt theo phong cách Cozy Crayon Handcrafted
import React from 'react';
import { useRoute } from '../../router/RouteContext.jsx';
import { useLandingLang } from '../../context/LandingLangContext.jsx';
import LanguageSwitcher from '../common/LanguageSwitcher.jsx';

export function PageReviews() {
  const { navigateTo } = useRoute();
  const { isEn } = useLandingLang();

  const reviews = isEn
    ? [
        {
          rating: 5,
          text: '"HiVocab is a breath of fresh air! The Cambridge 10–21 word database is wonderfully curated. Real context sentences directly from test passages save me hours of manual dictionary lookup during my IELTS prep."',
          author: 'Minh Duc',
          tag: 'Target 7.5 IELTS Self-Study',
          avatarColor: 'bg-[#FEEFEA] text-[#DE5D53]',
          avatarChar: 'D',
        },
        {
          rating: 5,
          text: '"My favorite feature is the Curtain Mode to hide Vietnamese translations! It trains my brain to actively infer vocabulary from context before revealing the translation. So helpful for boosting reading comprehension speed."',
          author: 'Thu Ha',
          tag: 'IELTS Reading Intensive',
          avatarColor: 'bg-[#EAF3E7] text-[#557A46]',
          avatarChar: 'H',
        },
        {
          rating: 5,
          text: '"The crayon visual aesthetic is so calming and friendly. Flashcards and quizzes run buttery smooth. When I had a quick question, the admin answered on Zalo in less than 5 minutes. Amazing support!"',
          author: 'Quoc Anh',
          tag: 'High School Senior & CBT Prep',
          avatarColor: 'bg-[#FEF9EE] text-[#D97706]',
          avatarChar: 'A',
        },
        {
          rating: 5,
          text: '"The SRS Spaced Repetition really works like magic. It prompts me to review right when I am about to forget. After 3 weeks, my word retention has skyrocketed without cramming."',
          author: 'Linh Dan',
          tag: 'Band 8.0 Candidate',
          avatarColor: 'bg-[#F3E8FF] text-[#8B5CF6]',
          avatarChar: 'L',
        },
        {
          rating: 5,
          text: '"I recommend HiVocab to my IELTS students for reading passages and academic collocations. The handcrafted picture book theme turns intimidating vocabulary lists into a fun, low-stress experience."',
          author: 'Hoang Nam',
          tag: 'English IELTS Instructor',
          avatarColor: 'bg-[#E6F3FB] text-[#2A7BA0]',
          avatarChar: 'N',
        },
        {
          rating: 5,
          text: '"Dictation and type-in modes are game changers for listening accuracy and spelling. The native audio pronunciations load instantly. Highly recommend to anyone preparing for IELTS or national exams!"',
          author: 'Phuong Mai',
          tag: 'University Student',
          avatarColor: 'bg-[#FEEFEA] text-[#DE5D53]',
          avatarChar: 'M',
        },
      ]
    : [
        {
          rating: 5,
          text: '"Website làm rất chỉn chu, kho từ vựng Cam 10-21 làm cực kỳ chất lượng. Có sẵn câu ví dụ trích từ bài đọc nên khi luyện đề đỡ mất công tự tra từ thủ công rất nhiều."',
          author: 'Minh Đức',
          tag: 'Đang tự ôn luyện đề Cambridge',
          avatarColor: 'bg-[#FEEFEA] text-[#DE5D53]',
          avatarChar: 'Đ',
        },
        {
          rating: 5,
          text: '"Mình thích nhất tính năng kéo rèm che bản dịch tiếng Việt để tự đoán nghĩa theo ngữ cảnh trước khi xem lời dịch. Rất mong admin tiếp tục bổ sung thêm nhiều bài đọc mới trong thời gian tới!"',
          author: 'Thu Hà',
          tag: 'Đang ôn thi IELTS Reading',
          avatarColor: 'bg-[#EAF3E7] text-[#557A46]',
          avatarChar: 'H',
        },
        {
          rating: 5,
          text: '"Giao diện sạch sẽ, học Flashcard và làm trắc nghiệm khá mượt. Thích nhất là có số Zalo của admin, hôm trước gặp thắc mắc nhắn cái là admin hỗ trợ xử lý ngay lập tức."',
          author: 'Quốc Anh',
          tag: 'Học sinh lớp 12 luyện thi THPT',
          avatarColor: 'bg-[#FEF9EE] text-[#D97706]',
          avatarChar: 'A',
        },
        {
          rating: 5,
          text: '"Thuật toán SRS hoạt động rất hiệu quả. Nó nhắc lại từ đúng vào thời điểm mình chuẩn bị quên. Khả năng ghi nhớ từ của mình tiến bộ rõ rệt chỉ sau 3 tuần học đều đặn."',
          author: 'Linh Đan',
          tag: 'Học viên mục tiêu Band 8.0',
          avatarColor: 'bg-[#F3E8FF] text-[#8B5CF6]',
          avatarChar: 'L',
        },
        {
          rating: 5,
          text: '"Tôi thường giới thiệu HiVocab cho các bạn học viên IELTS để học passage và collocations. Phong cách vẽ sáp màu giúp việc ôn thi bớt căng thẳng và hứng khởi hơn."',
          author: 'Hoàng Nam',
          tag: 'Giáo viên luyện thi IELTS',
          avatarColor: 'bg-[#E6F3FB] text-[#2A7BA0]',
          avatarChar: 'N',
        },
        {
          rating: 5,
          text: '"Chế độ nghe chép chính tả giúp cải thiện cả phát âm lẫn chính tả rất nhiều. Audio phát âm mượt và nhanh. Rất khuyên dùng cho các bạn đang tự học!"',
          author: 'Phương Mai',
          tag: 'Sinh viên Đại học Ngoại Thương',
          avatarColor: 'bg-[#FEEFEA] text-[#DE5D53]',
          avatarChar: 'M',
        },
      ];

  return (
    <div
      id="page-reviews"
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
              className="px-4 py-1.5 text-xs sm:text-sm font-black text-[#DE5D53] bg-[#FDEAE2] rounded-full transition-all cursor-pointer"
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
      <main className="flex-1 w-full max-w-[1320px] 2xl:max-w-[1480px] mx-auto px-4 sm:px-8 lg:px-12 py-10 sm:py-14">
        
        {/* Header Intro */}
        <div className="text-center mb-10 sm:mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FEF9EE] text-[#D97706] text-xs font-black uppercase tracking-wider border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E]">
            <span>💬</span>
            <span>{isEn ? 'Early Adopter Feedback' : 'Phản hồi trải nghiệm sớm'}</span>
          </div>

          <h1 className="font-quicksand font-black text-3xl sm:text-5xl text-[#3D352E] tracking-tight">
            {isEn ? 'Voices from Our Early Learners 🌿' : 'Cảm nhận từ những người dùng đầu tiên 🌿'}
          </h1>

          <p className="text-sm sm:text-base text-[#6E5D53] font-medium max-w-xl mx-auto leading-relaxed">
            {isEn
              ? 'HiVocab is freshly launched and continuously improved each week. Here are authentic reviews and heartfelt thoughts from our learning community.'
              : 'HiVocab mới ra mắt và đang tiếp tục được hoàn thiện mỗi ngày. Dưới đây là những chia sẻ thực tế từ các bạn học viên trải nghiệm sớm.'}
          </p>

          {/* Rating Summary Pill */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] rounded-full mt-2">
            <div className="flex text-[#F4B41A] text-sm">
              <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
            </div>
            <span className="text-xs font-black text-[#3D352E]">
              {isEn ? '4.9 / 5.0 • Verified Community Rating' : '4.9 / 5.0 • Đánh giá từ cộng đồng học viên'}
            </span>
          </div>
        </div>

        {/* 6 Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((r, idx) => (
            <div
              key={idx}
              className="bg-white border-[2.5px] border-[#3D352E] rounded-3xl p-6 shadow-[3.5px_4.5px_0px_#3D352E] flex flex-col justify-between hover:-translate-y-1 transition-all"
            >
              <div>
                <div className="flex text-[#F4B41A] text-base mb-3.5">
                  {[...Array(r.rating)].map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>

                <p className="text-xs sm:text-sm text-[#4D423A] leading-relaxed italic mb-5">
                  {r.text}
                </p>
              </div>

              <div className="pt-3.5 border-t-2 border-dashed border-[#DECDBB] flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl border-2 border-[#3D352E] flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${r.avatarColor}`}>
                  {r.avatarChar}
                </div>
                <div className="min-w-0">
                  <h4 className="font-quicksand font-black text-sm text-[#3D352E] truncate">
                    {r.author}
                  </h4>
                  <p className="text-[11px] font-bold text-[#86756C] truncate">
                    {r.tag}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Box */}
        <div className="mt-14 sm:mt-20 w-full bg-[#FFFDF9] border-[3px] border-[#3D352E] rounded-[32px] p-6 sm:p-10 shadow-[5px_7px_0px_#3D352E] flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-1.5">
            <h3 className="font-quicksand font-black text-xl sm:text-2xl text-[#3D352E]">
              {isEn ? 'Experience HiVocab for yourself today!' : 'Tự mình trải nghiệm HiVocab ngay hôm nay!'}
            </h3>
            <p className="text-xs sm:text-sm text-[#78685E]">
              {isEn
                ? 'Join our friendly learning club and start your joyful 15-minute daily vocabulary habit.'
                : 'Tham gia cùng hội bạn học chăm chỉ và xây dựng thói quen 15 phút ôn từ mỗi ngày.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigateTo('dashboard')}
            className="w-full md:w-auto px-7 py-3.5 rounded-2xl bg-[#557A46] hover:bg-[#476739] text-white font-black text-sm sm:text-base border-2 border-[#3D352E] shadow-[3px_4px_0px_#3D352E] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
          >
            <span>{isEn ? 'Start Studying Now' : 'Bắt đầu học ngay'}</span>
            <span>🚀</span>
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

export default PageReviews;
