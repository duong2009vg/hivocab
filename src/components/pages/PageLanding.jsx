// src/components/pages/PageLanding.jsx
// Trang giới thiệu HiVocab mô phỏng tập vẽ sáp màu (Cozy Crayon Handcrafted Picture Book)
// Bé Hổ Churbito là trung tâm dẫn chuyện, tích hợp Showcase tương tác toàn bộ tính năng mới.
import { useState, useEffect } from 'react';
import { useRoute } from '../../router/RouteContext.jsx';
import { useLandingLang } from '../../context/LandingLangContext.jsx';
import LanguageSwitcher from '../common/LanguageSwitcher.jsx';
import LandingShowcaseSection from '../landing/LandingShowcaseSection.jsx';
import LandingBentoEcosystem from '../landing/LandingBentoEcosystem.jsx';
import LandingTigerJourney from '../landing/LandingTigerJourney.jsx';
import CrayonPopReveal from '../landing/CrayonPopReveal.jsx';
import '../../styles/crayon-landing.css';
import {
  BookOpen,
  GraduationCap,
  Mic,
  ArrowRight,
  Star,
  Heart,
  Check,
  Shield,
  FileText,
  ChevronDown,
} from 'lucide-react';

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

  const vocabCount = useCountUp(77786, 1600, 150);
  const examCount = useCountUp(48, 1200, 500);
  const studioCount = useCountUp(139, 1300, 750);

  const [tigerMood, setTigerMood] = useState('wave');

  const moodConfigs = {
    wave: {
      label: isEn ? 'Say Hi' : 'Vẫy chào',
      img: '/mascot/mascot_waving.webp',
      fallback: '/mascot/mascot_waving.png',
      bubble: isEn
        ? 'Hello learner! Ready to sketch today’s words?'
        : 'Chào bạn học ơi! Cùng tớ vào phòng học nhé!',
      subtitle: isEn
        ? 'Your cheerful buddy for 15 minutes of joyful daily practice!'
        : 'Người bạn nhỏ đồng hành cùng bạn ghi nhớ 15 phút mỗi ngày!',
    },
    study: {
      label: isEn ? 'Study Cozy' : 'Học chăm',
      img: '/mascot/mascot_cozy.png',
      fallback: '/mascot/mascot_cozy.png',
      bubble: isEn
        ? 'Let’s pull the Curtain Mode & shadow a YouTube clip!'
        : 'Cùng mở Rèm che đọc hiểu & luyện Shadowing YouTube nào!',
      subtitle: isEn
        ? 'Focused reading, 44 IPA AI feedback & FSRS-6 scheduling.'
        : 'Đọc song ngữ chủ động, chấm phát âm 44 âm IPA & FSRS-6.',
    },
    celebrate: {
      label: isEn ? 'Streak Win' : 'Ăn mừng',
      img: '/mascot/mascot_celebrating.png',
      fallback: '/mascot/mascot_cozy.png',
      bubble: isEn
        ? 'Woohoo! Another daily streak & 40/40 CBT mock done!'
        : 'Hoan hô! Giữ lửa Streak mỗi ngày và chinh phục 9+ THPT!',
      subtitle: isEn
        ? 'Every small daily step builds unstoppable mastery.'
        : 'Mỗi ngày một bước nhỏ, tích lũy vốn từ vững chắc bền lâu!',
    },
  };

  const activeMood = moodConfigs[tigerMood] || moodConfigs.wave;

  const scrollToShowcase = () => {
    const el = document.getElementById('landing-showcase');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigateTo('features');
    }
  };

  return (
    <div
      id="page-landing"
      className="page active min-h-screen overflow-x-clip font-nunito text-[#3D352E] bg-[#FAF5EB] relative flex flex-col justify-between selection:bg-[#EBDDC8] selection:text-[#3D352E]"
      style={{
        backgroundImage: 'radial-gradient(#E2D6C3 1.2px, transparent 1.2px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Hidden SVG filter giving crayon underlines & doodles an authentic waxy hand-drawn edge */}
      <svg aria-hidden="true" className="absolute w-0 h-0 overflow-hidden pointer-events-none">
        <defs>
          <filter id="crayon-wax-stroke" x="-10%" y="-20%" width="120%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.065" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.8" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* ── TOP DECORATIVE CRAYON HEADER & NAVIGATION BAR ── */}
      <header className="sticky top-0 z-40 w-full px-3 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-2.5 sm:py-3.5 bg-[#FAF5EB]/95 backdrop-blur-md border-b-2 border-[#3D352E]/10 transition-all">
        <div className="w-full flex items-center justify-between gap-2 sm:gap-6">
          {/* Logo app bản sáp màu */}
          <div
            onClick={() => navigateTo('landing')}
            className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer select-none group shrink-0"
            title={isEn ? 'HiVocab – Crayon Picture Book Home' : 'HiVocab – Trang chủ tranh sáp màu'}
          >
            <div className="relative w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center transition-transform group-hover:scale-105">
              <img
                src="/logo-hi-transparent.png"
                alt="HiVocab Logo"
                className="w-full h-full object-contain filter drop-shadow-xs"
                onError={(e) => {
                  e.currentTarget.src = '/mascot/mascot_cozy.png';
                }}
              />
            </div>
            <span className="crayon-heading font-extrabold text-base sm:text-lg md:text-xl tracking-tight text-[#3D352E] leading-none">
              HiVocab
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav
            aria-label="Điều hướng trang giới thiệu"
            className="hidden md:flex items-center gap-2 bg-white border-2 border-[#3D352E] shadow-[2.5px_3px_0px_#3D352E] rounded-full px-4 py-1.5"
          >
            <button
              type="button"
              onClick={() => navigateTo('features')}
              className="px-4 py-1.5 text-xs sm:text-sm font-black text-[#5E5147] hover:text-[#3D352E] hover:bg-[#FAF5EB] rounded-full transition-all cursor-pointer"
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

          {/* Right Area: Language Switcher + Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <LanguageSwitcher compact className="sm:hidden" />
            <LanguageSwitcher className="hidden sm:inline-flex" />

            <button
              type="button"
              onClick={() => navigateTo('login')}
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-sm font-black rounded-xl sm:rounded-2xl bg-white hover:bg-[#FAF5EB] text-[#3D352E] border-2 border-[#3D352E] shadow-[1.5px_2px_0px_#3D352E] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer whitespace-nowrap"
            >
              {isEn ? 'Log in' : 'Đăng nhập'}
            </button>
            <button
              type="button"
              onClick={() => navigateTo('dashboard')}
              className="px-3 sm:px-5 py-1.5 sm:py-2 text-[11px] sm:text-sm font-black rounded-xl sm:rounded-2xl bg-[#DE5D53] hover:bg-[#C84F45] text-white border-2 border-[#3D352E] shadow-[2px_2.5px_0px_#3D352E] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>{isEn ? 'Get Started' : 'Bắt đầu'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN LANDING BODY ── */}
      <main className="flex-1 w-full max-w-[1560px] 2xl:max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8 sm:py-12">
        {/* ── SECTION 1: HERO BỨC TRANH SÁP MÀU & BÉ HỔ CHURBITO ── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center w-full">
          {/* CỘT TRÁI: LỜI GIỚI THIỆU ẤM ÁP + 3 SỐ LIỆU THỰC + CTA */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-5 lg:space-y-6 text-left">
            <h1
              className="crayon-hero-pop crayon-heading font-extrabold text-3xl sm:text-5xl lg:text-[50px] xl:text-[56px] 2xl:text-[62px] text-[#3D352E] leading-[1.2]"
              style={{ '--cr-delay': '40ms' }}
            >
              {isEn ? (
                <>
                  Build your ultimate{' '}
                  <span className="crayon-wax-word crayon-marker-highlight text-[#DE5D53] relative inline-block">
                    English foundation
                    <svg
                      aria-hidden="true"
                      className="absolute -bottom-2.5 left-0 w-full h-4 text-[#F4B41A] pointer-events-none overflow-visible"
                      viewBox="0 0 240 22"
                      preserveAspectRatio="none"
                      fill="none"
                      style={{ filter: 'url(#crayon-wax-stroke)' }}
                    >
                      <path
                        d="M3 15 C 58 6, 154 5, 237 13"
                        stroke="currentColor"
                        strokeWidth="6"
                        strokeLinecap="round"
                        className="crayon-draw-path"
                      />
                      <path
                        d="M14 19 C 82 13, 168 12, 224 18"
                        stroke="#DE5D53"
                        strokeOpacity="0.45"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        className="crayon-draw-path-2"
                      />
                    </svg>
                  </span>{' '}
                  with Little Tiger!
                </>
              ) : (
                <>
                  Cùng Bé Hổ xây nên{' '}
                  <span className="crayon-wax-word crayon-marker-highlight text-[#DE5D53] relative inline-block">
                    vốn tiếng Anh
                    <svg
                      aria-hidden="true"
                      className="absolute -bottom-2.5 left-0 w-full h-4 text-[#F4B41A] pointer-events-none overflow-visible"
                      viewBox="0 0 240 22"
                      preserveAspectRatio="none"
                      fill="none"
                      style={{ filter: 'url(#crayon-wax-stroke)' }}
                    >
                      <path
                        d="M3 15 C 58 6, 154 5, 237 13"
                        stroke="currentColor"
                        strokeWidth="6"
                        strokeLinecap="round"
                        className="crayon-draw-path"
                      />
                      <path
                        d="M14 19 C 82 13, 168 12, 224 18"
                        stroke="#DE5D53"
                        strokeOpacity="0.45"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        className="crayon-draw-path-2"
                      />
                    </svg>
                  </span>{' '}
                  vững chắc nhất!
                </>
              )}
            </h1>

            {/* 3 Thẻ Số Liệu Sống Động (Từ vựng, THPT, Studio) */}
            <div
              className="crayon-hero-pop w-full grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2"
              style={{ '--cr-delay': '150ms' }}
            >
              <div className="bg-white border-2 border-[#3D352E] rounded-2xl p-3 sm:p-3.5 shadow-[2.5px_3.5px_0px_#3D352E] flex items-center gap-2.5 crayon-card-interactive">
                <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-[#DE5D53] shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1">
                    <span className="crayon-heading font-extrabold text-xl sm:text-2xl text-[#DE5D53] tracking-tight">
                      {formatNumber(vocabCount)}+
                    </span>
                  </div>
                  <p className="text-[11px] font-black text-[#3D352E] leading-tight">
                    {isEn ? 'Words • 115+ Books' : 'Từ vựng • 115+ Sách'}
                  </p>
                </div>
              </div>

              <div className="bg-white border-2 border-[#3D352E] rounded-2xl p-3 sm:p-3.5 shadow-[2.5px_3.5px_0px_#3D352E] flex items-center gap-2.5 crayon-card-interactive">
                <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-[#557A46] shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1">
                    <span className="crayon-heading font-extrabold text-xl sm:text-2xl text-[#557A46] tracking-tight">
                      {examCount}+
                    </span>
                  </div>
                  <p className="text-[11px] font-black text-[#3D352E] leading-tight">
                    {isEn ? 'Exams • 29 Topics' : 'Đề • 29 Chuyên đề'}
                  </p>
                </div>
              </div>

              <div className="bg-white border-2 border-[#3D352E] rounded-2xl p-3 sm:p-3.5 shadow-[2.5px_3.5px_0px_#3D352E] flex items-center gap-2.5 crayon-card-interactive">
                <Mic className="w-7 h-7 sm:w-8 sm:h-8 text-[#2A7BA0] shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1">
                    <span className="crayon-heading font-extrabold text-xl sm:text-2xl text-[#2A7BA0] tracking-tight">
                      {studioCount}+
                    </span>
                  </div>
                  <p className="text-[11px] font-black text-[#3D352E] leading-tight">
                    {isEn ? 'Dictation • 44 IPA' : 'Hội thoại • 44 IPA'}
                  </p>
                </div>
              </div>
            </div>

            {/* Các nút gọi hành động chính */}
            <div
              className="crayon-hero-pop w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1"
              style={{ '--cr-delay': '260ms' }}
            >
              <button
                type="button"
                onClick={() => navigateTo('dashboard')}
                className="crayon-heading px-7 py-3.5 sm:py-4 rounded-2xl bg-[#557A46] hover:bg-[#476739] text-white font-extrabold text-base sm:text-lg border-[2.5px] border-[#3D352E] shadow-[4px_5px_0px_#3D352E] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2.5"
              >
                <span>{isEn ? 'Enter Study Room' : 'Vào phòng học ngay'}</span>
                <ArrowRight className="w-5 h-5 shrink-0" />
              </button>

              <button
                type="button"
                onClick={scrollToShowcase}
                className="crayon-heading px-6 py-3.5 sm:py-4 rounded-2xl bg-white hover:bg-[#FFF9EE] text-[#3D352E] font-extrabold text-base sm:text-lg border-2 border-[#3D352E] shadow-[3px_3.5px_0px_#3D352E] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{isEn ? 'Explore New Features' : 'Xem tính năng mới'}</span>
                <ChevronDown className="w-5 h-5 shrink-0 text-[#DE5D53]" />
              </button>
            </div>

            {/* Sticker ghi chú nét sáp nhỏ phía dưới */}
            <div className="pt-1 flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm font-bold text-[#8A796F]">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-[#F4B41A] text-[#F4B41A] shrink-0" />
                <span>{isEn ? 'Spaced Repetition (FSRS-6)' : 'Thuật toán ngắt quãng FSRS-6'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 fill-[#DE5D53] text-[#DE5D53] shrink-0" />
                <span>{isEn ? 'YouTube Shadowing & AI IPA' : 'Shadowing YouTube & Chấm IPA AI'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#557A46] shrink-0" />
                <span>{isEn ? '112 Bilingual News & Curtain' : '112 Báo Song Ngữ Rèm Che'}</span>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: BỨC TRANH BÉ HỔ CHURBITO TƯƠNG TÁC */}
          <div
            className="crayon-hero-pop lg:col-span-5 flex flex-col items-center justify-center relative w-full"
            style={{ '--cr-delay': '180ms' }}
          >
            <div className="w-full max-w-[480px] xl:max-w-[520px] bg-white border-[3.5px] border-[#3D352E] rounded-[38px] p-6 sm:p-8 shadow-[7px_9px_0px_#3D352E] relative flex flex-col items-center text-center rotate-1 hover:rotate-0 transition-transform duration-300">
              {/* Cúc ghim giấy sáp */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#DE5D53] border-2 border-[#3D352E] flex items-center justify-center shadow-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-white border border-[#3D352E]" />
              </div>

              {/* Bong bóng thoại động theo biểu cảm Bé Hổ */}
              <div className="relative bg-[#FFF9EE] border-2 border-[#3D352E] px-4 py-3 rounded-2xl shadow-[3px_4px_0px_#3D352E] text-[#3D352E] crayon-heading font-bold text-sm sm:text-base flex items-center gap-2 mb-3 mt-1 transform -rotate-1">
                <span>“{activeMood.bubble}”</span>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-[#FFF9EE] border-r-2 border-b-2 border-[#3D352E] transform rotate-45" />
              </div>

              {/* Ảnh Bé Hổ Churbito */}
              <div className="relative w-56 h-56 sm:w-68 sm:h-68 xl:w-72 xl:h-72 my-2 flex items-center justify-center">
                <div className="absolute inset-2 bg-[#FEEFEA] rounded-full filter blur-md -z-0" />
                <img
                  key={activeMood.img}
                  src={activeMood.img}
                  alt="Bé Hổ Churbito"
                  className="crayon-tab-pop w-full h-full object-contain relative z-10 mix-blend-multiply drop-shadow-sm transition-transform duration-300 hover:scale-105 select-none"
                  onError={(e) => {
                    if (e.currentTarget.src !== activeMood.fallback) {
                      e.currentTarget.src = activeMood.fallback;
                    }
                  }}
                />
              </div>

              {/* Nút đổi biểu cảm Bé Hổ */}
              <div className="inline-flex items-center gap-1.5 bg-[#FAF5EB] p-1 rounded-full border-2 border-[#3D352E] my-2">
                {Object.entries(moodConfigs).map(([key, cfg]) => {
                  const selected = tigerMood === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTigerMood(key)}
                      className={`px-3 py-1 rounded-full text-[11px] font-black transition-all cursor-pointer ${
                        selected
                          ? 'bg-[#DE5D53] text-white shadow-xs'
                          : 'text-[#6E5D53] hover:text-[#3D352E]'
                      }`}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>

              {/* Thẻ tên Bé Hổ */}
              <div className="mt-1 space-y-1">
                <h2 className="crayon-heading font-extrabold text-xl sm:text-2xl text-[#3D352E]">
                  {isEn ? 'Churbito the Tiger' : 'Bé Hổ Churbito'}
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-[#86756C]">
                  {activeMood.subtitle}
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigateTo('dashboard')}
                className="crayon-heading mt-4 w-full py-3 px-5 bg-[#FAF5EB] hover:bg-[#F2ECE0] text-[#3D352E] text-xs sm:text-sm md:text-base font-extrabold rounded-2xl border-2 border-[#3D352E] shadow-[2px_2.5px_0px_#3D352E] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{isEn ? 'Open App & Learn Now' : 'Mở app học ngay'}</span>
                <BookOpen className="w-4 h-4 shrink-0" />
              </button>
            </div>

            {/* Sticker trang trí */}
            <div className="crayon-float-slow crayon-note hidden sm:flex absolute -bottom-5 -left-4 bg-[#FAF5EB] border-2 border-[#3D352E] shadow-[2px_3px_0px_#3D352E] rounded-2xl px-3.5 py-1.5 text-sm sm:text-base font-bold text-[#DE5D53]">
              {isEn ? 'Keep your daily streak!' : 'Giữ lửa mỗi ngày!'}
            </div>
            <div className="crayon-float-alt crayon-note hidden sm:flex absolute -top-4 -right-3 bg-[#EAF3E7] border-2 border-[#557A46] shadow-[2px_3px_0px_#557A46] rounded-2xl px-3.5 py-1.5 text-sm sm:text-base font-bold text-[#557A46]">
              {isEn ? '100% Free to Try!' : 'Trải nghiệm miễn phí!'}
            </div>
          </div>
        </section>

        {/* ── SECTION 2: SHOWCASE TƯƠNG TÁC 5 TRỤ CỘT TÍNH NĂNG MỚI ── */}
        <LandingShowcaseSection isEn={isEn} navigateTo={navigateTo} />

        {/* ── SECTION 3: BENTO GRID HỆ SINH THÁI (FSRS-6, 5 CHẾ ĐỘ, CỘNG ĐỒNG, AI) ── */}
        <LandingBentoEcosystem isEn={isEn} navigateTo={navigateTo} />

        {/* ── SECTION 4: DẢI TRUYỆN TRANH 3 BƯỚC CÙNG BÉ HỔ ── */}
        <LandingTigerJourney isEn={isEn} />

        {/* ── SECTION 5: BANNER LỜI MỜI VÀO PHÒNG HỌC CUỐI TRANG ── */}
        <section className="mt-14 sm:mt-20">
          <CrayonPopReveal variant="up">
            <div className="w-full bg-[#FFFDF9] border-[3px] border-[#3D352E] rounded-[32px] p-6 sm:p-10 shadow-[5px_7px_0px_#3D352E] flex flex-col md:flex-row items-center justify-between gap-6 crayon-card-interactive">
              <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#FFF9EE] border-2 border-[#3D352E] shadow-[2.5px_3px_0px_#3D352E] p-2 shrink-0 flex items-center justify-center">
                  <img
                    src="/mascot/mascot_celebrating.png"
                    alt="Bé Hổ Churbito ăn mừng"
                    className="w-full h-full object-contain mix-blend-multiply"
                    onError={(e) => {
                      e.currentTarget.src = '/mascot/mascot_cozy.png';
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <span className="crayon-note text-sm font-bold text-[#DE5D53] tracking-wide">
                    {isEn ? 'Little Tiger is waiting for you' : 'Bé Hổ đang đợi bạn trong phòng học'}
                  </span>
                  <h3 className="crayon-heading font-extrabold text-2xl sm:text-3xl text-[#3D352E]">
                    {isEn ? 'Ready to level up your English today?' : 'Sẵn sàng bứt phá tiếng Anh cùng HiVocab hôm nay?'}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#78685E] max-w-xl font-medium">
                    {isEn
                      ? 'Jump straight in as a guest with zero setup, or sign in to sync your 115+ book progress, custom YouTube videos, and FSRS-6 reviews across all devices.'
                      : 'Bắt đầu trải nghiệm ngay không cần chờ đợi, hoặc đăng nhập để đồng bộ tiến độ 115+ đầu sách, video YouTube cá nhân và lịch ôn FSRS-6 trên mọi thiết bị.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => navigateTo('dashboard')}
                  className="crayon-heading w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#DE5D53] hover:bg-[#C84F45] text-white font-extrabold text-sm sm:text-base border-2 border-[#3D352E] shadow-[3px_4px_0px_#3D352E] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{isEn ? 'Start Learning with Tiger' : 'Vào học cùng Bé Hổ'}</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('login')}
                  className="crayon-heading w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-white hover:bg-[#FAF5EB] text-[#3D352E] font-extrabold text-sm sm:text-base border-2 border-[#3D352E] shadow-[2.5px_3px_0px_#3D352E] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                >
                  {isEn ? 'Log in to account' : 'Đăng nhập tài khoản'}
                </button>
              </div>
            </div>
          </CrayonPopReveal>
        </section>
      </main>

      {/* ── FOOTER: BỨC TRANH BÌA SAU TRANG NHÃ THEO PHONG CÁCH COZY CRAYON ── */}
      <footer className="mt-16 border-t-2 border-dashed border-[#DECDBB] bg-[#FFFDF9]/80 text-[#6E5D53] text-xs sm:text-sm py-10 px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="max-w-[1560px] 2xl:max-w-[1720px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
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
                ? 'A delightful, crayon-crafted English vocabulary & studio ecosystem. Combining FSRS-6 Spaced Repetition, YouTube Shadowing & 44 IPA AI, Bilingual Curtain Reading, and THPT National Exam CBT rooms.'
                : 'Hệ sinh thái học tiếng Anh thông minh phong cách tranh vẽ sáp màu ấm áp. Kết hợp FSRS-6, Studio Shadowing YouTube & 44 âm IPA AI, Đọc song ngữ rèm che và Phòng thi THPT Quốc Gia CBT.'}
            </p>
            <div className="text-[11px] text-[#86756C] space-y-1 pt-1">
              <p>
                <strong>{isEn ? 'Developer:' : 'Đơn vị phát triển:'}</strong> HiVocab Education
              </p>
              <p>
                <strong>{isEn ? 'Support:' : 'Hỗ trợ:'}</strong>{' '}
                <a href="mailto:support@hivocab.site" className="text-[#DE5D53] hover:underline font-bold">
                  support@hivocab.site
                </a>
              </p>
              <p>
                <strong>Hotline/Zalo:</strong> 0846 407 898
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#3D352E]">
              {isEn ? 'Explore' : 'Khám phá'}
            </h4>
            <ul className="space-y-2 text-xs font-bold text-[#6E5D53]">
              <li>
                <a onClick={() => navigateTo('features')} className="cursor-pointer hover:text-[#DE5D53] transition-colors">
                  {isEn ? 'Learning Features' : 'Tính năng học tập'}
                </a>
              </li>
              <li>
                <a onClick={() => navigateTo('reviews')} className="cursor-pointer hover:text-[#DE5D53] transition-colors">
                  {isEn ? 'Learner Reviews' : 'Đánh giá từ bạn học'}
                </a>
              </li>
              <li>
                <a onClick={() => navigateTo('support')} className="cursor-pointer hover:text-[#DE5D53] transition-colors">
                  {isEn ? 'Support & Contact' : 'Hỗ trợ & Liên hệ'}
                </a>
              </li>
              <li>
                <a onClick={() => navigateTo('faq')} className="cursor-pointer hover:text-[#DE5D53] transition-colors">
                  {isEn ? 'Frequently Asked Questions (FAQ)' : 'Câu hỏi thường gặp (FAQ)'}
                </a>
              </li>
              <li>
                <a onClick={() => navigateTo('login')} className="cursor-pointer hover:text-[#DE5D53] transition-colors">
                  {isEn ? 'Log in / Sign up' : 'Đăng nhập / Đăng ký'}
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#3D352E]">
              {isEn ? 'Legal & Policies' : 'Pháp lý & Điều khoản'}
            </h4>
            <ul className="space-y-2 text-xs font-bold text-[#6E5D53]">
              <li>
                <a href="/privacy" className="hover:text-[#DE5D53] transition-colors flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 shrink-0" />
                  <span>{isEn ? 'Privacy Policy' : 'Chính sách quyền riêng tư'}</span>
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-[#DE5D53] transition-colors flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span>{isEn ? 'Terms of Service' : 'Điều khoản dịch vụ'}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-[1560px] 2xl:max-w-[1720px] mx-auto pt-6 border-t border-[#DECDBB]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#86756C] font-semibold">
          <p>
            {isEn
              ? '© 2026 HiVocab (hivocab.site). All rights reserved.'
              : '© 2026 HiVocab (hivocab.site). Bản quyền tập vẽ sáp màu được bảo lưu.'}
          </p>
          <div className="flex items-center gap-3">
            <a href="/privacy" className="hover:underline">
              {isEn ? 'Privacy Policy' : 'Chính sách quyền riêng tư'}
            </a>
            <span>•</span>
            <a href="/terms" className="hover:underline">
              {isEn ? 'Terms of Service' : 'Điều khoản dịch vụ'}
            </a>
            <span>•</span>
            <a href="/" className="hover:underline text-[#DE5D53] font-bold">
              hivocab.site
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default PageLanding;
