// src/components/landing/LandingBentoEcosystem.jsx
// Asymmetric Bento Grid showcasing FSRS-6 (with interactive Little Tiger mood), 5 Study Modes,
// Community Chat & Library, Contextual AI Dictionary, and Personal Excel Notebook.
import { useState } from 'react';
import {
  RotateCcw,
  Gamepad2,
  MessageSquareHeart,
  Search,
  FileSpreadsheet,
  ArrowRight,
  Flame,
  Sparkles,
} from 'lucide-react';

export function LandingBentoEcosystem({ isEn, navigateTo }) {
  const [fsrsRating, setFsrsRating] = useState('good');

  const fsrsOptions = [
    {
      id: 'again',
      label: isEn ? 'Again' : 'Quên rồi',
      interval: isEn ? '10 min' : '10 phút',
      stability: '15%',
      mascot: '/mascot/mascot_grumpy.png',
      fallbackMascot: '/mascot/mascot_cozy.png',
      bubble: isEn
        ? 'No worries! Let’s review this again in 10 mins!'
        : 'Đừng lo! 10 phút nữa tớ nhắc ôn lại cho nhớ kỹ nhé!',
      btnClass: 'bg-[#FEEFEA] text-[#B53D2A] border-[#DE5D53]',
    },
    {
      id: 'hard',
      label: isEn ? 'Hard' : 'Hơi khó',
      interval: isEn ? '12 hrs' : '12 giờ',
      stability: '48%',
      mascot: '/mascot/mascot_cozy.png',
      fallbackMascot: '/mascot/mascot_cozy.png',
      bubble: isEn
        ? 'FSRS-6 tightens your review window to lock it in!'
        : 'FSRS-6 rút ngắn nhịp ôn giúp bạn không bị rớt chữ!',
      btnClass: 'bg-[#FEF3C7] text-[#92400E] border-[#D97706]',
    },
    {
      id: 'good',
      label: isEn ? 'Good' : 'Nhớ tốt',
      interval: isEn ? '4 days' : '4 ngày',
      stability: '78%',
      mascot: '/mascot/mascot_cozy.png',
      fallbackMascot: '/mascot/mascot_cozy.png',
      bubble: isEn
        ? 'Awesome! Next review scheduled right before forgetting.'
        : 'Tuyệt vời! Hẹn ôn lại đúng điểm rơi trí nhớ vàng sau 4 ngày!',
      btnClass: 'bg-[#EAF3E7] text-[#355A3B] border-[#557A46]',
    },
    {
      id: 'easy',
      label: isEn ? 'Easy' : 'Quá dễ',
      interval: isEn ? '12 days' : '12 ngày',
      stability: '96%',
      mascot: '/mascot/mascot_celebrating.png',
      fallbackMascot: '/mascot/mascot_cozy.png',
      bubble: isEn
        ? 'Mastered! Long-term memory locked — save 80% time!'
        : 'Đỉnh quá! Đã khóa trí nhớ dài hạn — tiết kiệm tối đa thời gian!',
      btnClass: 'bg-[#E6F3FB] text-[#2A7BA0] border-[#2A7BA0]',
    },
  ];

  const activeFsrs = fsrsOptions.find((o) => o.id === fsrsRating) || fsrsOptions[2];

  const studyModes = isEn
    ? ['3D Flashcards', '4-Type Quiz Rotation', 'Spelling Type-in', 'Audio Dictation', 'Tiger Hangman']
    : ['Flashcard 3D', 'Quiz 4 Dạng Xoay Vòng', 'Điền Từ Ngữ Cảnh', 'Nghe Chép Chính Tả', 'Hangman Bé Hổ'];

  return (
    <section className="mt-16 sm:mt-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10">
        <div className="space-y-2 text-left">
          <span className="inline-flex items-center gap-1.5 text-xs font-black text-[#557A46] uppercase tracking-wider bg-[#EAF3E7] px-3.5 py-1 rounded-full border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isEn ? 'Smart Learning Engine' : 'Hệ Sinh Thái Học Tập Thông Minh'}</span>
          </span>
          <h2 className="font-quicksand font-black text-2xl sm:text-4xl text-[#3D352E]">
            {isEn
              ? 'Built for Deep Memory & Daily Joy'
              : 'Ghi Nhớ Sâu Bền & Học Vui Mỗi Ngày Cùng Cộng Đồng'}
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-[#6E5D53] max-w-md font-medium">
          {isEn
            ? 'Powered by modern FSRS-6 memory science, 5 interactive practice games, real-time learner chat, and instant AI dictionary tools.'
            : 'Kết hợp thuật toán FSRS-6 thế hệ mới, 5 chế độ luyện tập đa giác quan, chat cộng đồng realtime và từ điển AI tức thời.'}
        </p>
      </div>

      {/* 12-Column Asymmetric Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* BENTO 1 (7 cols): FSRS-6 Interactive + Little Tiger Mood */}
        <div className="lg:col-span-7 bg-white border-[2.5px] border-[#3D352E] rounded-[28px] p-5 sm:p-7 shadow-[4px_5px_0px_#3D352E] flex flex-col justify-between gap-5">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="inline-flex items-center gap-2">
                <span className="w-10 h-10 rounded-2xl bg-[#EAF3E7] border-2 border-[#3D352E] flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-[#557A46]" />
                </span>
                <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FEF3C7] border border-[#3D352E] text-[#3D352E]">
                  {isEn ? 'FSRS-6 (21-Parameter DSR)' : 'FSRS-6 (21 Tham Số DSR)'}
                </span>
              </div>
              <h3 className="font-quicksand font-black text-xl sm:text-2xl text-[#3D352E]">
                {isEn
                  ? 'Spaced Repetition That Adapts to Your Brain'
                  : 'Thuật Toán Lặp Lại Ngắt Quãng FSRS-6 Chuẩn Anki'}
              </h3>
              <p className="text-xs sm:text-sm text-[#6E5D53] leading-relaxed">
                {isEn
                  ? 'Unlike rigid old SRS timers, FSRS-6 models Difficulty, Stability, and Retrievability for every single word. Tap a button below to see how Churbito schedules your next review:'
                  : 'Tính toán riêng Độ khó, Độ bền và Xác suất nhớ cho từng từ vựng. Hãy bấm thử 1 trong 4 nút bên dưới để xem Bé Hổ lên lịch ôn thế nào nhé:'}
              </p>
            </div>

            {/* Interactive Little Tiger Mood Box */}
            <div className="w-full sm:w-44 shrink-0 bg-[#FFF9EE] border-2 border-[#3D352E] rounded-2xl p-3 shadow-[2px_3px_0px_#3D352E] flex sm:flex-col items-center gap-3 sm:gap-2 text-left sm:text-center">
              <img
                src={activeFsrs.mascot}
                alt="Bé Hổ FSRS-6"
                onError={(e) => {
                  if (e.currentTarget.src !== activeFsrs.fallbackMascot) {
                    e.currentTarget.src = activeFsrs.fallbackMascot;
                  }
                }}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0 mix-blend-multiply transition-transform duration-300"
              />
              <p className="text-[11px] font-bold text-[#3D352E] leading-snug">
                “{activeFsrs.bubble}”
              </p>
            </div>
          </div>

          {/* 4 Interactive FSRS-6 Rating Buttons + Stability Bar */}
          <div className="bg-[#FAF5EB] border-2 border-[#3D352E] rounded-2xl p-3.5 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {fsrsOptions.map((opt) => {
                const selected = opt.id === fsrsRating;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFsrsRating(opt.id)}
                    className={`px-3 py-2 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      selected
                        ? `${opt.btnClass} shadow-[2px_2px_0px_#3D352E] -translate-y-0.5`
                        : 'bg-white border-[#3D352E]/30 hover:border-[#3D352E] text-[#554D42]'
                    }`}
                  >
                    <span className="block text-xs font-black">{opt.label}</span>
                    <span className="block text-[10px] font-bold opacity-80">{opt.interval}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-black text-[#3D352E]">
                <span>{isEn ? 'Memory Stability Forecast' : 'Độ bền trí nhớ dự kiến'}</span>
                <span className="text-[#557A46]">{activeFsrs.stability}</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-white border border-[#3D352E] overflow-hidden">
                <div
                  className="h-full bg-[#557A46] transition-all duration-300"
                  style={{ width: activeFsrs.stability }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* BENTO 2 (5 cols): 5 Practice Modes + Streak */}
        <div className="lg:col-span-5 bg-[#FFFDF9] border-[2.5px] border-[#3D352E] rounded-[28px] p-5 sm:p-7 shadow-[4px_5px_0px_#3D352E] flex flex-col justify-between gap-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-2xl bg-[#F3E8FF] border-2 border-[#3D352E] flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-[#7C3AED]" />
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FDEAE2] border border-[#DE5D53] text-[11px] font-black text-[#DE5D53]">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>{isEn ? 'Daily Streak & Quests' : 'Nhiệm vụ & Giữ lửa Streak'}</span>
              </span>
            </div>

            <h3 className="font-quicksand font-black text-xl sm:text-2xl text-[#3D352E]">
              {isEn ? '5 Multi-Sensory Practice Modes' : '5 Chế Độ Luyện Tập Đa Giác Quan'}
            </h3>
            <p className="text-xs sm:text-sm text-[#6E5D53] leading-relaxed">
              {isEn
                ? 'Switch seamlessly between 3D Flip Flashcards, 4 rotating MCQ formats, contextual spelling, audio dictation, and Tiger Hangman.'
                : 'Không bao giờ nhàm chán nhờ kết hợp Flashcard 3D, Trắc nghiệm 4 kiểu xoay vòng, Điền từ, Nghe chép chính tả và Hangman Bé Hổ.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {studyModes.map((mode) => (
              <span
                key={mode}
                className="px-3 py-1.5 rounded-xl bg-[#FAF5EB] border-2 border-[#3D352E] text-xs font-black text-[#3D352E] shadow-[1.5px_2px_0px_#3D352E]"
              >
                {mode}
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={() => navigateTo('dashboard')}
            className="w-full py-3 px-4 rounded-2xl bg-[#3D352E] hover:bg-[#2A241F] text-white text-xs sm:text-sm font-black border-2 border-[#3D352E] flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <span>{isEn ? 'Try Quick Practice Now' : 'Thử chế độ Luyện Tập Nhanh'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* BENTO 3 (4 cols): Community Library & Realtime Chat */}
        <div className="lg:col-span-4 bg-white border-[2.5px] border-[#3D352E] rounded-[28px] p-5 sm:p-6 shadow-[4px_5px_0px_#3D352E] flex flex-col justify-between gap-4">
          <div className="space-y-2.5">
            <span className="w-10 h-10 rounded-2xl bg-[#FEEFEA] border-2 border-[#3D352E] flex items-center justify-center">
              <MessageSquareHeart className="w-5 h-5 text-[#DE5D53]" />
            </span>
            <h3 className="font-quicksand font-black text-lg sm:text-xl text-[#3D352E]">
              {isEn ? 'Community Library & Live Chat' : 'Thư Viện Cộng Đồng & Chat Realtime'}
            </h3>
            <p className="text-xs sm:text-sm text-[#6E5D53] leading-relaxed">
              {isEn
                ? 'Save, remix, and share curated vocabulary decks from top teachers and learners, plus chat live right inside the community hub.'
                : 'Khám phá, lưu trữ và đóng góp bộ thẻ từ từ cộng đồng học viên & giáo viên, kèm khung Chat Realtime trao đổi bài học.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('library')}
            className="text-xs font-black text-[#DE5D53] hover:underline inline-flex items-center gap-1 cursor-pointer self-start"
          >
            <span>{isEn ? 'Visit Community Hub' : 'Ghé Thư viện cộng đồng'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* BENTO 4 (4 cols): Contextual AI Dictionary & Chrome Extension */}
        <div className="lg:col-span-4 bg-white border-[2.5px] border-[#3D352E] rounded-[28px] p-5 sm:p-6 shadow-[4px_5px_0px_#3D352E] flex flex-col justify-between gap-4">
          <div className="space-y-2.5">
            <span className="w-10 h-10 rounded-2xl bg-[#E6F3FB] border-2 border-[#3D352E] flex items-center justify-center">
              <Search className="w-5 h-5 text-[#2A7BA0]" />
            </span>
            <h3 className="font-quicksand font-black text-lg sm:text-xl text-[#3D352E]">
              {isEn ? 'Contextual AI Dictionary & Extension' : 'Từ Điển AI Ngữ Cảnh & Extension'}
            </h3>
            <p className="text-xs sm:text-sm text-[#6E5D53] leading-relaxed">
              {isEn
                ? 'Look up academic meanings, collocations, synonyms, and mnemonics instantly, or highlight words on any website with the HiVocab Chrome Extension.'
                : 'Tra nhanh nghĩa học thuật, collocations, từ đồng nghĩa & mẹo nhớ AI. Hỗ trợ tiện ích Chrome Extension lưu từ khi lướt web.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('dictionary')}
            className="text-xs font-black text-[#2A7BA0] hover:underline inline-flex items-center gap-1 cursor-pointer self-start"
          >
            <span>{isEn ? 'Open AI Dictionary' : 'Mở Từ điển AI ngay'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* BENTO 5 (4 cols): Personal Notebook & Bulk Excel Import */}
        <div className="lg:col-span-4 bg-white border-[2.5px] border-[#3D352E] rounded-[28px] p-5 sm:p-6 shadow-[4px_5px_0px_#3D352E] flex flex-col justify-between gap-4">
          <div className="space-y-2.5">
            <span className="w-10 h-10 rounded-2xl bg-[#FEF3C7] border-2 border-[#3D352E] flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-[#B45309]" />
            </span>
            <h3 className="font-quicksand font-black text-lg sm:text-xl text-[#3D352E]">
              {isEn ? 'Personal Wordbook & Excel Import' : 'Sổ Từ Cá Nhân & Nhập Excel Siêu Tốc'}
            </h3>
            <p className="text-xs sm:text-sm text-[#6E5D53] leading-relaxed">
              {isEn
                ? 'Build your own topic folders, batch-import hundreds of words from Excel/CSV or text, and sync progress securely across devices.'
                : 'Tự tạo bộ từ theo môn học riêng, nhập hàng loạt từ file Excel/CSV hoặc văn bản và đồng bộ tiến độ trên mọi thiết bị.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('vocabulary')}
            className="text-xs font-black text-[#B45309] hover:underline inline-flex items-center gap-1 cursor-pointer self-start"
          >
            <span>{isEn ? 'Open Wordbook' : 'Xem Sổ từ cá nhân'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}

export default LandingBentoEcosystem;
