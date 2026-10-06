// src/components/learning/ExerciseFlashcard.jsx
// 100% Cozy Crayon Handcrafted Flashcard - Centered & Responsive
import React, { useState, useEffect, useCallback } from 'react';

export default function ExerciseFlashcard({ item, onRate, onReport, sessionInfo }) {
  const [flipped, setFlipped] = useState(false);
  const d = item?.exerciseData || {};

  const currentNum = sessionInfo?.currentNum ?? 1;
  const totalNum = sessionInfo?.totalNum ?? 10;

  // Reset flip state when new card appears
  useEffect(() => {
    setFlipped(false);
  }, [item]);

  // Keyboard: Space/Enter = flip; 1 = Hard/Cần ôn lại; 2 = Easy/Đã nhớ kỹ
  useEffect(() => {
    function handleKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setFlipped((f) => !f);
      }
      if (flipped) {
        if (e.key === '1') {
          e.preventDefault();
          onRate('hard');
        }
        if (e.key === '2') {
          e.preventDefault();
          onRate('easy');
        }
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [flipped, onRate]);

  const flip = useCallback(() => {
    setFlipped((f) => !f);
  }, []);

  const playAudio = useCallback(
    (e) => {
      if (e) e.stopPropagation();
      const word = d.backWord || d.frontWord;
      if (window.HiAudio?.playWord) {
        window.HiAudio.playWord(word, 0.9);
      } else if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(word);
        u.lang = 'en-US';
        window.speechSynthesis.speak(u);
      }
    },
    [d.backWord, d.frontWord]
  );

  return (
    <div className="w-full flex flex-col items-center justify-center select-none font-comfortaa my-auto px-2">
      {/* ── Single Center Flashcard (Fit Screen & Perfectly Balanced) ── */}
      <section className="flex flex-col items-center w-full max-w-lg sm:max-w-xl shrink-0">
        {/* 3D Perspective Flip Container */}
        <div
          onClick={flip}
          tabIndex={0}
          role="button"
          aria-label={`Thẻ ghi nhớ - ${flipped ? 'Mặt sau (Đáp án)' : 'Mặt trước (Câu hỏi)'} - Chạm hoặc bấm Space để lật`}
          className="w-full card-flip-container cursor-pointer focus:outline-none select-none transition-transform hover:-translate-y-0.5 duration-200"
          style={{
            perspective: '1200px',
            WebkitPerspective: '1200px',
          }}
        >
          {/* Flipping 3D Inner Wrapper */}
          <div
            className={`w-full relative preserve-3d ${
              flipped ? 'flipped-3d' : ''
            }`}
            style={{
              transformStyle: 'preserve-3d',
              WebkitTransformStyle: 'preserve-3d',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              transition: 'transform 0.5s cubic-bezier(0.4, 0.2, 0.2, 1)',
            }}
          >
            {/* ── FRONT FACE ── */}
            <div
              className={`w-full min-h-[350px] sm:min-h-[420px] max-h-[72vh] bg-white rounded-[26px] sm:rounded-[32px] border-[3px] border-[#2D2825] shadow-[4px_6px_0px_#2D2825] sm:shadow-[6px_8px_0px_rgba(45,40,37,0.95)] p-4 sm:p-6 md:p-7 flex flex-col justify-between items-center text-center backface-hidden ${
                flipped ? 'pointer-events-none select-none' : 'pointer-events-auto'
              }`}
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(0deg) translateZ(1px)',
                WebkitTransform: 'rotateY(0deg) translateZ(1px)',
              }}
            >
              {/* Header ribbon inside card */}
              <div className="w-full flex items-center justify-between pb-2.5 border-b-2 border-stone-200/70">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#EDF6F9] border-2 border-[#2D2825] rounded-full shadow-[1.5px_1.5px_0px_#2D2825]">
                  <span className="w-2 h-2 rounded-full bg-[#264653]"></span>
                  <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wide text-[#264653]">
                    {d.frontLabel || 'DỊCH SANG TIẾNG ANH'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {onReport && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReport();
                      }}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-stone-100 hover:bg-stone-200 border-2 border-[#2D2825] shadow-[1.5px_1.5px_0px_#2D2825] flex items-center justify-center text-stone-600 transition-colors cursor-pointer"
                      title="Báo lỗi từ này"
                    >
                      <span className="text-xs">⚠️</span>
                    </button>
                  )}
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-100 hover:bg-stone-200 border-2 border-[#2D2825] rounded-full shadow-[1.5px_1.5px_0px_#2D2825] text-[11px] sm:text-xs font-bold text-stone-700 transition-colors">
                    <span className="text-sm text-[#D36135]">↺</span>
                    <span>Chạm để lật</span>
                  </div>
                </div>
              </div>

              {/* Center Mascot / Word Art Illustration (Prominent & Aesthetic) */}
              {d.imageUrl ? (
                <div className="my-2 sm:my-3 relative flex items-center justify-center w-40 h-40 sm:w-52 sm:h-52 md:w-60 md:h-60 max-w-full">
                  <div className="absolute inset-0 bg-[#FFF5EB] rounded-3xl border-2 border-dashed border-[#E76F51]/40 shadow-xs"></div>
                  <img
                    alt={d.frontWord}
                    className="relative z-10 w-36 h-36 sm:w-48 sm:h-48 md:w-56 md:h-56 object-contain rounded-2xl select-none transition-transform hover:scale-105 duration-200"
                    src={d.imageUrl}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <span className="absolute -top-1.5 -right-1.5 text-[#feab79] text-lg sm:text-xl animate-bounce">✨</span>
                </div>
              ) : (
                <div className="my-2 sm:my-3 relative flex items-center justify-center w-28 h-28 sm:w-36 sm:h-36">
                  <div className="absolute inset-0 bg-[#FFF5EB] rounded-full border-2 border-dashed border-[#E76F51]/30"></div>
                  <img
                    alt="Bé hổ học tập"
                    className="relative z-10 w-24 h-24 sm:w-32 sm:h-32 object-contain mix-blend-multiply select-none"
                    src="/mascot/mascot_cozy.png"
                  />
                  <span className="absolute -top-1 -right-1 text-[#feab79] text-base sm:text-lg animate-bounce">✨</span>
                </div>
              )}

              {/* Word Prompt Content */}
              <div className="space-y-1.5 max-w-lg my-auto px-2">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#2D2825] tracking-normal leading-snug">
                  {d.frontWord}
                </h2>
                {(d.exampleSentence || d.hint) && (
                  <p className="font-serif italic text-xs sm:text-sm text-stone-600 px-2 leading-relaxed">
                    "{d.exampleSentence || d.hint}"
                  </p>
                )}
              </div>

              {/* Primary Action Button: Reveal Answer */}
              <div className="w-full pt-2.5 sm:pt-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    flip();
                  }}
                  className="w-full sm:w-4/5 mx-auto py-2.5 sm:py-3 px-6 bg-[#264653] hover:bg-[#1B353F] text-white font-bold text-sm sm:text-base rounded-full border-2 border-[#2D2825] shadow-[0px_3px_0px_#1B353F] flex items-center justify-center gap-2 transition-transform active:translate-y-0.5 cursor-pointer"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Nhấn xem đáp án</span>
                </button>
              </div>
            </div>

            {/* ── BACK FACE ── */}
            <div
              className={`absolute inset-0 w-full h-full min-h-[350px] sm:min-h-[420px] max-h-[72vh] bg-white rounded-[26px] sm:rounded-[32px] border-[3px] border-[#2D2825] shadow-[-4px_6px_0px_#2D2825] sm:shadow-[-6px_8px_0px_rgba(45,40,37,0.95)] p-4 sm:p-6 md:p-7 flex flex-col justify-between items-center text-center backface-hidden rotate-y-180 ${
                !flipped ? 'pointer-events-none select-none' : 'pointer-events-auto'
              }`}
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg) translateZ(1px)',
                WebkitTransform: 'rotateY(180deg) translateZ(1px)',
              }}
            >
              {/* Header ribbon inside card */}
              <div className="w-full flex items-center justify-between pb-2.5 border-b-2 border-stone-200/70">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#EDF6F9] border-2 border-[#2D2825] rounded-full shadow-[1.5px_1.5px_0px_#2D2825]">
                  <span className="w-2 h-2 rounded-full bg-[#609966]"></span>
                  <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wide text-[#609966]">
                    {d.backLabel || 'ĐÁP ÁN TIẾNG ANH'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {onReport && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReport();
                      }}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-stone-100 hover:bg-stone-200 border-2 border-[#2D2825] shadow-[1.5px_1.5px_0px_#2D2825] flex items-center justify-center text-stone-600 transition-colors cursor-pointer"
                      title="Báo lỗi từ này"
                    >
                      <span className="text-xs">⚠️</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      flip();
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-100 hover:bg-stone-200 border-2 border-[#2D2825] rounded-full shadow-[1.5px_1.5px_0px_#2D2825] text-[11px] sm:text-xs font-bold text-stone-700 transition-colors cursor-pointer"
                  >
                    <span className="text-sm text-[#D36135]">↺</span>
                    <span>Lật lại mặt trước</span>
                  </button>
                </div>
              </div>

              {/* Back content */}
              <div className="space-y-2 max-w-lg my-auto pt-1 px-2">
                <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                  <h2 className="text-2xl sm:text-3xl font-black text-[#2D2825] tracking-tight">
                    {d.backWord || d.frontWord}
                  </h2>
                  <button
                    type="button"
                    onClick={playAudio}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#EBF2F7] hover:bg-[#D8E6F0] active:scale-95 border-2 border-[#2D2825] shadow-[1.5px_1.5px_0px_#2D2825] flex items-center justify-center transition-all cursor-pointer"
                    title="Nghe phát âm chuẩn"
                  >
                    <svg className="w-4 h-4 text-[#264653]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                {d.phonetic && (
                  <p className="text-xs sm:text-sm font-mono text-stone-600 font-semibold tracking-wider">
                    /{d.phonetic}/
                  </p>
                )}

                {d.meaning && (
                  <div className="bg-[#FAF5EB] border-2 border-[#2D2825] rounded-xl sm:rounded-2xl p-2 sm:p-3 text-xs sm:text-sm font-bold text-stone-800 shadow-2xs">
                    {d.meaning}
                  </div>
                )}

                {d.exampleSentence && (
                  <p className="font-serif italic text-xs sm:text-sm text-stone-600 px-2 leading-relaxed">
                    "{d.exampleSentence}"
                  </p>
                )}
              </div>

              {/* Rating Action Buttons */}
              <div className="w-full pt-2.5 sm:pt-3 grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRate('hard');
                  }}
                  className="py-2.5 sm:py-3 px-3 bg-[#FAF5EB] hover:bg-[#F2ECE0] text-[#D36135] font-bold text-xs sm:text-sm rounded-2xl border-2 border-[#2D2825] shadow-[2px_2px_0px_#2D2825] active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>✏️</span>
                  <span>Cần ôn lại (1)</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRate('easy');
                  }}
                  className="py-2.5 sm:py-3 px-3 bg-[#609966] hover:bg-[#528357] text-white font-bold text-xs sm:text-sm rounded-2xl border-2 border-[#2D2825] shadow-[2px_2px_0px_#2D2825] active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>🌟</span>
                  <span>Đã nhớ kỹ (2)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts Hint - Desktop Only */}
        <div className="mt-3 hidden sm:flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-stone-600">
          <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-[#2D2825]/30 shadow-2xs">
            <kbd className="px-1 py-0.2 bg-stone-100 border border-stone-400 rounded font-mono font-bold text-stone-800">[Space]</kbd>
            Lật thẻ
          </span>
          <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-[#2D2825]/30 shadow-2xs">
            <kbd className="px-1 py-0.2 bg-stone-100 border border-stone-400 rounded font-mono font-bold text-stone-800">[1]</kbd>
            Cần ôn lại
          </span>
          <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-[#2D2825]/30 shadow-2xs">
            <kbd className="px-1 py-0.2 bg-stone-100 border border-stone-400 rounded font-mono font-bold text-stone-800">[2]</kbd>
            Đã nhớ kỹ
          </span>
        </div>
      </section>
    </div>
  );
}
