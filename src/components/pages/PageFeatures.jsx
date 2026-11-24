// src/components/pages/PageFeatures.jsx
// Trang tính năng HiVocab hỗ trợ song ngữ Tiếng Anh (Mặc định) và Tiếng Việt theo phong cách Cozy Crayon Handcrafted
import { useRoute } from '../../router/RouteContext.jsx';
import {
  BookOpen,
  BookOpenText,
  RotateCcw,
  Gamepad2,
  Bot,
  BarChart2,
  Video,
  GraduationCap,
  MessageSquareHeart,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useLandingLang } from '../../context/LandingLangContext.jsx';
import LanguageSwitcher from '../common/LanguageSwitcher.jsx';

export function PageFeatures() {
  const { navigateTo } = useRoute();
  const { isEn } = useLandingLang();

  const features = isEn
    ? [
        {
          tag: 'Studio New',
          tagColor: 'bg-[#FEEFEA] text-[#DE5D53] border-[#DE5D53]/40',
          icon: Video,
          iconColor: 'text-[#DE5D53]',
          title: 'YouTube Shadowing, 139 Dictation & 44 IPA AI',
          desc: 'Browse channel-grouped video rows, paste any YouTube link to auto-extract synced EN-VI captions, practice 139 Kokoro TTS dialogues, and get phoneme-level AI coaching across all 44 IPA sounds.',
          highlight: '139 Dictations • 44 IPA Sounds • Personal YouTube',
          route: 'studio',
        },
        {
          tag: 'Roadmap 2026',
          tagColor: 'bg-[#FEF9EE] text-[#B45309] border-[#B45309]/40',
          icon: GraduationCap,
          iconColor: 'text-[#B45309]',
          title: '3-Book THPT Roadmap & CBT Exam Room',
          desc: 'Includes 38 School/Provincial exams, 29 mastery chapters (1,004 explained questions), and 10 2026 Prediction Tests. Practice in a real CBT room where clicking blanks (7) _______ jumps straight to the question.',
          highlight: '48+ Mock Exams • 29 Mastery Topics',
          route: 'exercises',
        },
        {
          tag: 'Breakthrough',
          tagColor: 'bg-[#E6F3FB] text-[#2A7BA0] border-[#2A7BA0]/40',
          icon: BookOpenText,
          iconColor: 'text-[#2A7BA0]',
          title: '10 IELTS Vols & 112 Bilingual News (Curtain Mode)',
          desc: 'Read 10 IELTS Reading volumes (Vol 1–10) and 112 categorized bilingual news articles with our smart Curtain Mode that hides Vietnamese translations until you tap to verify.',
          highlight: '10 IELTS Vols • 112 Bilingual Articles',
          route: 'bilingual-reading',
        },
        {
          tag: '3D Bookshelf',
          tagColor: 'bg-[#FEEFEA] text-[#DE5D53] border-[#DE5D53]/40',
          icon: BookOpen,
          iconColor: 'text-[#DE5D53]',
          title: '77,786+ Words on 115+ Books (3D Shelf & Folder)',
          desc: 'Complete Cambridge IELTS 10–21, IELTS Actual Tests, Destination C1-C2, SAT, TOEIC, CEFR, and Oxford 3000 with IPA, real contexts, and bulk Excel/CSV import.',
          highlight: '115+ Curated Books • 3D Shelf & Folder View',
          route: 'topics',
        },
        {
          tag: 'Scientific',
          tagColor: 'bg-[#EAF3E7] text-[#557A46] border-[#557A46]/40',
          icon: RotateCcw,
          iconColor: 'text-[#557A46]',
          title: 'Spaced Repetition FSRS-6 (21 Parameters)',
          desc: 'Powered by the modern FSRS-6 DSR model (Difficulty, Stability, Retrievability). Schedules reviews right before forgetting across Again / Hard / Good / Easy intervals.',
          highlight: 'Saves up to 80% review time',
          route: 'dashboard',
        },
        {
          tag: 'Multi-Sensory',
          tagColor: 'bg-[#F3E8FF] text-[#7C3AED] border-[#7C3AED]/40',
          icon: Gamepad2,
          iconColor: 'text-[#7C3AED]',
          title: '5 Dynamic Study & Game Modes',
          desc: 'Rotate between 3D Flip Flashcards, 4-subtype Multiple Choice, Contextual Spelling Type-in, Audio Dictation, and Little Tiger Hangman challenges.',
          highlight: 'Zero boredom, faster active recall',
          route: 'dashboard',
        },
        {
          tag: 'Community',
          tagColor: 'bg-[#FEEFEA] text-[#DE5D53] border-[#DE5D53]/40',
          icon: MessageSquareHeart,
          iconColor: 'text-[#DE5D53]',
          title: 'Community Deck Library & Realtime Chat',
          desc: 'Save, like, and contribute custom vocabulary decks shared by learners and teachers, plus connect in the real-time community chat room.',
          highlight: 'Shared Decks • Live Learner Chat',
          route: 'library',
        },
        {
          tag: 'AI & Extension',
          tagColor: 'bg-[#E6F3FB] text-[#2A7BA0] border-[#2A7BA0]/40',
          icon: Bot,
          iconColor: 'text-[#2A7BA0]',
          title: 'AI Contextual Dictionary & Chrome Extension',
          desc: 'Instant academic lookups with collocations, synonyms, and mnemonics inside the app or directly on any webpage via the HiVocab Chrome Extension.',
          highlight: '1-Click Save While Browsing',
          route: 'dictionary',
        },
        {
          tag: 'Habit',
          tagColor: 'bg-[#EAF3E7] text-[#557A46] border-[#557A46]/40',
          icon: BarChart2,
          iconColor: 'text-[#557A46]',
          title: 'Analytics, Daily Quests & Tiger Streak',
          desc: 'Track mastered words, exam history, and daily quests with Little Tiger cheering you on to build a lasting 15-minute study habit.',
          highlight: 'Cross-device Cloud Sync',
          route: 'dashboard',
        },
      ]
    : [
        {
          tag: 'Studio Mới',
          tagColor: 'bg-[#FEEFEA] text-[#DE5D53] border-[#DE5D53]/40',
          icon: Video,
          iconColor: 'text-[#DE5D53]',
          title: 'Shadowing YouTube, 139 Dictation & 44 Âm IPA AI',
          desc: 'Video phân loại gọn theo từng kênh lướt ngang, hỗ trợ dán link YouTube cá nhân tự tách phụ đề Anh-Việt, kèm 139 bài hội thoại Dictation Kokoro TTS và phòng Lab chấm phát âm 44 âm IPA.',
          highlight: '139 Hội thoại • 44 Âm IPA AI • YouTube Cá nhân',
          route: 'studio',
        },
        {
          tag: 'Lộ trình 2026',
          tagColor: 'bg-[#FEF9EE] text-[#B45309] border-[#B45309]/40',
          icon: GraduationCap,
          iconColor: 'text-[#B45309]',
          title: 'Kệ 3 Quyển Sách THPT QG & Phòng Thi CBT',
          desc: 'Gồm 38 đề Trường/Sở, 29 chuyên đề (1.004 câu hỏi có giải thích chi tiết) và 10 đề dự đoán chuẩn ma trận 2026. Bấm vào ô trống (7) _______ nhảy thẳng tới câu hỏi tương ứng.',
          highlight: '48+ Đề thi • 29 Chuyên đề 9+',
          route: 'exercises',
        },
        {
          tag: 'Đột phá',
          tagColor: 'bg-[#E6F3FB] text-[#2A7BA0] border-[#2A7BA0]/40',
          icon: BookOpenText,
          iconColor: 'text-[#2A7BA0]',
          title: '10 Tập IELTS & 112 Báo Song Ngữ Rèm Che',
          desc: 'Đọc hiểu trọn bộ 10 tập IELTS Reading (Vol 1–10) và 112 bài Báo Song ngữ theo chủ đề với rèm che Curtain Mode kích thích tự suy luận nghĩa trước khi đối chiếu đáp án.',
          highlight: '10 Tập IELTS Vol • 112 Bài Báo Song Ngữ',
          route: 'bilingual-reading',
        },
        {
          tag: 'Kệ Sách 3D',
          tagColor: 'bg-[#FEEFEA] text-[#DE5D53] border-[#DE5D53]/40',
          icon: BookOpen,
          iconColor: 'text-[#DE5D53]',
          title: '77.786+ Từ Vựng trên 115+ Đầu Sách Chuẩn Hóa',
          desc: 'Đủ bộ Cambridge IELTS 10–21, IELTS Actual Tests, Destination C1-C2, SAT, TOEIC, CEFR và Oxford 3000. Hỗ trợ giao diện Kệ gỗ 3D / Tủ Folder và nhập hàng loạt từ Excel.',
          highlight: '115+ Sách • Kệ Gỗ 3D & Tủ Folder',
          route: 'topics',
        },
        {
          tag: 'Khoa học',
          tagColor: 'bg-[#EAF3E7] text-[#557A46] border-[#557A46]/40',
          icon: RotateCcw,
          iconColor: 'text-[#557A46]',
          title: 'Lặp Lại Ngắt Quãng FSRS-6 (21 Tham Số DSR)',
          desc: 'Ứng dụng thuật toán FSRS-6 thế hệ mới tính toán Độ khó, Độ bền và Xác suất nhớ cho từng từ vựng, lên lịch ôn lại đúng điểm rơi trí nhớ trước khi quên.',
          highlight: 'Tiết kiệm tới 80% thời gian ôn tập',
          route: 'dashboard',
        },
        {
          tag: 'Đa giác quan',
          tagColor: 'bg-[#F3E8FF] text-[#7C3AED] border-[#7C3AED]/40',
          icon: Gamepad2,
          iconColor: 'text-[#7C3AED]',
          title: '5 Chế Độ Luyện Tập & Trò Chơi Đa Dạng',
          desc: 'Xoay vòng mượt mà giữa Flashcard 3D, Trắc nghiệm 4 dạng câu hỏi, Điền từ theo nghĩa, Nghe chép chính tả và Trò chơi Hangman Bé Hổ.',
          highlight: 'Học không chán, phản xạ nhớ sâu',
          route: 'dashboard',
        },
        {
          tag: 'Cộng đồng',
          tagColor: 'bg-[#FEEFEA] text-[#DE5D53] border-[#DE5D53]/40',
          icon: MessageSquareHeart,
          iconColor: 'text-[#DE5D53]',
          title: 'Thư Viện Bộ Từ Cộng Đồng & Chat Realtime',
          desc: 'Lưu trữ, yêu thích và đóng góp bộ từ vựng phong phú từ giáo viên và cộng đồng học viên, kết nối trao đổi bài học qua khung Chat Realtime.',
          highlight: 'Chia sẻ Bộ từ • Chat Cộng đồng trực tiếp',
          route: 'library',
        },
        {
          tag: 'AI & Tiện ích',
          tagColor: 'bg-[#E6F3FB] text-[#2A7BA0] border-[#2A7BA0]/40',
          icon: Bot,
          iconColor: 'text-[#2A7BA0]',
          title: 'Từ Điển AI Ngữ Cảnh & Chrome Extension',
          desc: 'Giải thích ngữ cảnh học thuật, collocations, từ đồng nghĩa và mẹo nhớ AI ngay trong bài học hoặc trên mọi website nhờ tiện ích Chrome Extension.',
          highlight: 'Tra cứu & Lưu từ 1 chạm khi lướt web',
          route: 'dictionary',
        },
        {
          tag: 'Kỷ luật',
          tagColor: 'bg-[#EAF3E7] text-[#557A46] border-[#557A46]/40',
          icon: BarChart2,
          iconColor: 'text-[#557A46]',
          title: 'Thống Kê Tiến Độ, Nhiệm Vụ & Chuỗi Streak',
          desc: 'Theo dõi biểu đồ từ thành thạo, lịch sử làm đề thi THPT và giữ chuỗi Streak hàng ngày cùng Bé Hổ Churbito đồng bộ trên mọi thiết bị.',
          highlight: 'Đồng bộ Đám mây đa thiết bị',
          route: 'dashboard',
        },
      ];

  return (
    <div
      id="page-features"
      className="page active min-h-screen overflow-x-clip font-nunito text-[#3D352E] bg-[#FAF5EB] relative flex flex-col justify-between selection:bg-[#EBDDC8] selection:text-[#3D352E]"
      style={{
        backgroundImage: 'radial-gradient(#E2D6C3 1.2px, transparent 1.2px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* ── TOP CRAYON HEADER & NAVIGATION BAR ── */}
      <header className="sticky top-0 z-40 w-full px-3 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-2.5 sm:py-3.5 bg-[#FAF5EB]/95 backdrop-blur-md border-b-2 border-[#3D352E]/10 transition-all">
        <div className="w-full flex items-center justify-between gap-2 sm:gap-6">
          {/* Logo app */}
          <div
            onClick={() => navigateTo('landing')}
            className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer select-none group shrink-0"
            title={isEn ? 'Back to Home' : 'Về trang chủ'}
          >
            <div className="relative w-10 h-10 sm:w-13 sm:h-13 flex items-center justify-center transition-transform group-hover:scale-105">
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
              {isEn ? 'Home' : 'Trang chủ'}
            </button>
            <span className="text-[#DECDBB] select-none">•</span>
            <button
              type="button"
              className="px-4 py-1.5 text-xs sm:text-sm font-black text-[#DE5D53] bg-[#FDEAE2] rounded-full transition-all cursor-pointer"
            >
              {isEn ? 'Features' : 'Tính năng'}
            </button>
            <span className="text-[#DECDBB] select-none">•</span>
            <button
              type="button"
              onClick={() => navigateTo('reviews')}
              className="px-4 py-1.5 text-xs sm:text-sm font-black text-[#5E5147] hover:text-[#3D352E] hover:bg-[#FAF5EB] rounded-full transition-all cursor-pointer"
            >
              {isEn ? 'Reviews' : 'Đánh giá'}
            </button>
            <span className="text-[#DECDBB] select-none">•</span>
            <button
              type="button"
              onClick={() => navigateTo('faq')}
              className="px-4 py-1.5 text-xs sm:text-sm font-black text-[#5E5147] hover:text-[#3D352E] hover:bg-[#FAF5EB] rounded-full transition-all cursor-pointer"
            >
              FAQ
            </button>
            <span className="text-[#DECDBB] select-none">•</span>
            <button
              type="button"
              onClick={() => navigateTo('support')}
              className="px-4 py-1.5 text-xs sm:text-sm font-black text-[#5E5147] hover:text-[#3D352E] hover:bg-[#FAF5EB] rounded-full transition-all cursor-pointer"
            >
              {isEn ? 'Support' : 'Hỗ trợ'}
            </button>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <LanguageSwitcher compact className="sm:hidden" />
            <LanguageSwitcher className="hidden sm:inline-flex" />

            <button
              type="button"
              onClick={() => navigateTo('dashboard')}
              className="px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-black rounded-xl sm:rounded-2xl bg-[#DE5D53] hover:bg-[#C84F45] text-white border-2 border-[#3D352E] shadow-[2px_2.5px_0px_#3D352E] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>{isEn ? 'Learn Now' : 'Vào học ngay'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 w-full max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-10 sm:py-14">
        {/* Header Intro */}
        <div className="text-center mb-12 sm:mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF3E7] text-[#557A46] text-xs font-black uppercase tracking-wider border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isEn ? 'Comprehensive Learning Ecosystem' : 'Hệ thống học tập toàn diện'}</span>
          </div>

          <h1 className="font-quicksand font-black text-3xl sm:text-5xl text-[#3D352E] tracking-tight">
            {isEn ? 'All Features Built Into HiVocab' : 'Toàn Bộ Tính Năng Đột Phá Trên HiVocab'}
          </h1>

          <p className="text-sm sm:text-base text-[#6E5D53] font-medium max-w-2xl mx-auto leading-relaxed">
            {isEn
              ? 'From YouTube Shadowing, 44 IPA AI coaching, and 112 Bilingual News with Curtain Mode to FSRS-6 flashcards and 2026 THPT CBT exams — explore every module directly.'
              : 'Từ phòng Studio Shadowing YouTube, chấm 44 âm IPA AI, 112 Báo Song Ngữ Rèm Che đến Kệ sách 3D FSRS-6 và Phòng thi CBT THPT Quốc Gia — bấm thử bất kỳ tính năng nào ngay bên dưới.'}
          </p>
        </div>

        {/* 9 Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white border-[2.5px] border-[#3D352E] rounded-3xl p-6 sm:p-7 shadow-[4px_5px_0px_#3D352E] hover:-translate-y-1 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#FFFDF9] border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center justify-center">
                      <Icon className={`w-6 h-6 ${item.iconColor}`} />
                    </div>
                    <span
                      className={`text-[11px] font-black px-3 py-1 rounded-full border-2 border-[#3D352E] uppercase tracking-wider ${item.tagColor}`}
                    >
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="font-quicksand font-black text-lg sm:text-xl text-[#3D352E] mb-2 leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#6E5D53] leading-relaxed">{item.desc}</p>
                </div>

                <div className="mt-5 pt-3.5 border-t-2 border-dashed border-[#DECDBB] flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-[#557A46] truncate">{item.highlight}</span>
                  <button
                    type="button"
                    onClick={() => navigateTo(item.route)}
                    className="shrink-0 inline-flex items-center gap-1 text-xs font-black text-[#DE5D53] hover:underline cursor-pointer"
                  >
                    <span>{isEn ? 'Open' : 'Mở ngay'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Box */}
        <div className="mt-14 sm:mt-20 w-full bg-[#FFFDF9] border-[3px] border-[#3D352E] rounded-[32px] p-6 sm:p-10 shadow-[5px_7px_0px_#3D352E] flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <img
              src="/mascot/mascot_celebrating.png"
              alt="Bé Hổ Churbito"
              onError={(e) => {
                e.currentTarget.src = '/mascot/mascot_cozy.png';
              }}
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain mix-blend-multiply shrink-0"
            />
            <div className="space-y-2">
              <span className="text-xs font-black text-[#DE5D53] uppercase tracking-wider">
                {isEn ? 'Join Thousands of Learners' : 'Cùng hàng ngàn bạn học'}
              </span>
              <h2 className="font-quicksand font-black text-2xl sm:text-3xl text-[#3D352E]">
                {isEn
                  ? 'Ready to boost your English with Churbito?'
                  : 'Sẵn sàng bứt phá tiếng Anh cùng Bé Hổ Churbito?'}
              </h2>
              <p className="text-xs sm:text-sm text-[#78685E] max-w-xl">
                {isEn
                  ? 'Start exploring books, videos, and CBT mock tests right now — free to try with no credit card required!'
                  : 'Vào phòng học trải nghiệm ngay kho 115+ đầu sách, Studio YouTube AI và lộ trình 3 cuốn THPT hoàn toàn miễn phí!'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigateTo('dashboard')}
            className="w-full md:w-auto px-8 py-4 rounded-2xl bg-[#557A46] hover:bg-[#476739] text-white font-black text-base border-[2.5px] border-[#3D352E] shadow-[4px_5px_0px_#3D352E] active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
          >
            <span>{isEn ? 'Start Learning for Free' : 'Bắt đầu học miễn phí'}</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="mt-16 border-t-2 border-dashed border-[#DECDBB] bg-[#FFFDF9]/80 text-[#6E5D53] text-xs py-8 px-4 sm:px-8 text-center">
        <p>
          © 2026 HiVocab (hivocab.site).{' '}
          {isEn ? 'All rights reserved.' : 'Bản quyền tập vẽ sáp màu được bảo lưu.'}
        </p>
      </footer>
    </div>
  );
}

export default PageFeatures;
