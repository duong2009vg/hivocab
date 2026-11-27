// src/components/landing/LandingTigerJourney.jsx
// 3-panel Crayon storybook strip illustrating a 15-minute daily learning loop with Churbito the Tiger.
import CrayonPopReveal from './CrayonPopReveal.jsx';

export function LandingTigerJourney({ isEn }) {
  const panels = isEn
    ? [
        {
          step: '01',
          bg: 'bg-[#FFF9EE]',
          badgeBg: 'bg-[#DE5D53] text-white',
          img: '/mascot/mascot_waving.webp',
          fallback: '/mascot/mascot_waving.png',
          title: 'Pick a Book or Paste a Video',
          desc: 'Pull any Cambridge/IELTS book from the 3D shelf, choose a 2026 THPT mock test, or drop your favorite YouTube link.',
        },
        {
          step: '02',
          bg: 'bg-[#EAF3E7]',
          badgeBg: 'bg-[#557A46] text-white',
          img: '/mascot/mascot_cozy.png',
          fallback: '/mascot/mascot_cozy.png',
          title: 'Practice Actively Without Boredom',
          desc: 'Read with the Bilingual Curtain, shadow sentences with AI phoneme tips, or play 5 interactive memory modes.',
        },
        {
          step: '03',
          bg: 'bg-[#E6F3FB]',
          badgeBg: 'bg-[#2A7BA0] text-white',
          img: '/mascot/mascot_celebrating.png',
          fallback: '/mascot/mascot_cozy.png',
          title: 'Lock It In & Celebrate Streaks',
          desc: 'FSRS-6 schedules your next review right before forgetting, while Churbito cheers every daily streak milestone!',
        },
      ]
    : [
        {
          step: '01',
          bg: 'bg-[#FFF9EE]',
          badgeBg: 'bg-[#DE5D53] text-white',
          img: '/mascot/mascot_waving.webp',
          fallback: '/mascot/mascot_waving.png',
          title: 'Chọn Sách hoặc Dán Link Video',
          desc: 'Rút một cuốn Cambridge/IELTS trên Kệ 3D, mở lộ trình 3 cuốn THPT hay dán link YouTube bạn thích vào Studio.',
        },
        {
          step: '02',
          bg: 'bg-[#EAF3E7]',
          badgeBg: 'bg-[#557A46] text-white',
          img: '/mascot/mascot_cozy.png',
          fallback: '/mascot/mascot_cozy.png',
          title: 'Học Chủ Động Đầy Hứng Khởi',
          desc: 'Đọc báo song ngữ kéo rèm che, luyện Shadowing sửa 44 âm IPA hoặc làm đề thi thử CBT có giải thích chi tiết.',
        },
        {
          step: '03',
          bg: 'bg-[#E6F3FB]',
          badgeBg: 'bg-[#2A7BA0] text-white',
          img: '/mascot/mascot_celebrating.png',
          fallback: '/mascot/mascot_cozy.png',
          title: 'Khóa Trí Nhớ & Tung Hoa Giữ Streak',
          desc: 'Thuật toán FSRS-6 nhắc ôn đúng điểm rơi trước khi quên — Bé Hổ ăn mừng cùng bạn mỗi ngày bứt phá!',
        },
      ];

  return (
    <section className="mt-16 sm:mt-24">
      <CrayonPopReveal variant="up" className="text-center space-y-2 mb-8 sm:mb-10">
        <span className="crayon-note inline-block text-sm font-bold text-[#2A7BA0] tracking-wide bg-[#E6F3FB] px-4 py-1 rounded-full border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E]">
          {isEn ? 'Churbito Storyboard' : 'Nhật Ký 15 Phút Cùng Bé Hổ'}
        </span>
        <h2 className="crayon-heading font-extrabold text-2xl sm:text-4xl text-[#3D352E] leading-[1.25]">
          {isEn
            ? 'How 15 Minutes a Day Transforms Your English'
            : '15 Phút Mỗi Ngày Cùng Bé Hổ Churbito'}
        </h2>
      </CrayonPopReveal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {panels.map((panel, idx) => (
          <CrayonPopReveal
            key={panel.step}
            variant={idx === 0 ? 'left' : idx === 1 ? 'up' : 'right'}
            delay={idx * 130}
          >
            <div
              className={`${panel.bg} border-[2.5px] border-[#3D352E] rounded-[28px] p-6 shadow-[4px_5px_0px_#3D352E] flex flex-col items-center text-center relative h-full crayon-card-interactive ${
                idx === 1 ? 'md:-translate-y-1.5' : ''
              }`}
            >
              <span
                className={`crayon-note absolute top-4 left-4 px-3 py-0.5 rounded-full text-sm font-bold border-2 border-[#3D352E] ${panel.badgeBg}`}
              >
                {isEn ? `Step ${panel.step}` : `Bước ${panel.step}`}
              </span>

              <div className="w-36 h-36 sm:w-40 sm:h-40 my-3 flex items-center justify-center">
                <img
                  src={panel.img}
                  alt={panel.title}
                  onError={(e) => {
                    if (e.currentTarget.src !== panel.fallback) {
                      e.currentTarget.src = panel.fallback;
                    }
                  }}
                  className="w-full h-full object-contain mix-blend-multiply drop-shadow-xs select-none"
                />
              </div>

              <h3 className="crayon-heading font-extrabold text-lg sm:text-xl text-[#3D352E] mb-2">
                {panel.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#5E5147] leading-relaxed font-medium">
                {panel.desc}
              </p>
            </div>
          </CrayonPopReveal>
        ))}
      </div>
    </section>
  );
}

export default LandingTigerJourney;
