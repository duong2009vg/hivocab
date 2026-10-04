// src/components/learning/ExerciseFlashcard.jsx
// 100% Pixel-Perfect match to Google Stitch design (both Desktop & Mobile)
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
    <div className="w-full flex flex-col items-center select-none font-comfortaa">
      {/* ── Main Workspace (Balanced 3-column row layout on Desktop) ── */}
      <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 xl:gap-10 py-2 sm:py-4">
        {/* ── Left Companion Mascot Sidebar (Desktop lg:flex) ── */}
        <aside className="hidden lg:flex flex-col items-center w-64 xl:w-72 shrink-0 pt-2">
          {/* Speech dialogue bubble */}
          <div className="relative bg-white border-2 border-[#2D2825] rounded-2xl p-4 shadow-[4px_4px_0px_#2D2825] text-xs font-semibold text-stone-700 leading-relaxed mb-4 w-full">
            <p className="font-bold text-[#264653] text-sm mb-1 flex items-center gap-1.5">
              <span>🐾</span> Bé Hổ Churbito
            </p>
            "Cố lên bạn nhé! Đã hoàn thành{' '}
            <strong className="text-[#D36135]">
              {currentNum}/{totalNum} từ
            </strong>{' '}
            rồi, lật thẻ và đọc to từ vựng là nhớ siêu lâu đó!"
            {/* Triangle pointer */}
            <div className="absolute -bottom-2.5 left-10 w-4 h-4 bg-white border-b-2 border-r-2 border-[#2D2825] transform rotate-45"></div>
          </div>

          {/* Cozy Mascot Illustration */}
          <div className="relative w-48 h-48 xl:w-56 xl:h-56 flex items-center justify-center">
            <img
              alt="Bé hổ Churbito đồng hành cùng bạn"
              className="w-full h-full object-contain mix-blend-multiply drop-shadow-sm select-none pointer-events-none transform hover:scale-105 transition-transform"
              src="/mascot/mascot_cozy.png"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          <div className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-100 rounded-full border border-[#2D2825]/30 text-xs font-bold text-stone-600 shadow-2xs">
            🌱 Người bạn học tập chăm chỉ
          </div>
        </aside>

        {/* ── Center Flashcard Card (Well Proportioned) ── */}
        <section className="flex flex-col items-center w-full max-w-xl xl:max-w-2xl shrink-0">
          {/* 3D Perspective Flip Container */}
          <div
            onClick={flip}
            tabIndex={0}
            role="button"
            aria-label={`Thẻ ghi nhớ - ${flipped ? 'Mặt sau (Đáp án)' : 'Mặt trước (Câu hỏi)'} - Chạm hoặc bấm Space để lật`}
            className="w-full card-flip-container cursor-pointer focus:outline-none select-none transition-transform hover:-translate-y-1 duration-200"
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
                transition: 'transform 0.55s cubic-bezier(0.4, 0.2, 0.2, 1)',
              }}
            >
              {/* ── FRONT FACE ── */}
              <div
                className={`w-full min-h-[380px] sm:min-h-[480px] bg-white rounded-[28px] sm:rounded-[36px] border-[3.5px] border-[#2D2825] shadow-[5px_7px_0px_#2D2825] sm:shadow-[8px_10px_0px_rgba(45,40,37,0.95)] p-4 sm:p-7 md:p-9 flex flex-col justify-between items-center text-center backface-hidden ${
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
                <div className="w-full flex items-center justify-between pb-3 border-b-2 border-stone-200/70">
                  <div className="flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 bg-[#EDF6F9] border-2 border-[#2D2825] rounded-full shadow-[2px_2px_0px_#2D2825]">
                    <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#264653]"></span>
                    <span className="text-[11px] sm:text-sm font-extrabold uppercase tracking-wide text-[#264653]">
                      {d.frontLabel || 'DỊCH SANG TIẾNG ANH'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2">
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
                    <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 bg-stone-100 hover:bg-stone-200 border-2 border-[#2D2825] rounded-full shadow-[1.5px_1.5px_0px_#2D2825] sm:shadow-[2px_2px_0px_#2D2825] text-[11px] sm:text-xs font-bold text-stone-700 transition-colors">
                      <span className="text-sm sm:text-base text-[#D36135]">↺</span>
                      <span>Chạm để lật</span>
                    </div>
                  </div>
                </div>

                {/* Center Mascot / Word Art Illustration */}
                <div className="my-2 sm:my-5 relative flex items-center justify-center w-28 h-28 sm:w-44 sm:h-44">
                  <div className="absolute inset-0 bg-[#FFF5EB] rounded-full border-2 border-dashed border-[#E76F51]/30"></div>
                  {d.imageUrl ? (
                    <img
                      alt={d.frontWord}
                      className="relative z-10 w-24 h-24 sm:w-36 sm:h-36 object-contain rounded-2xl select-none"
                      src={d.imageUrl}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <img
                      alt="Bé hổ học tập"
                      className="relative z-10 w-24 h-24 sm:w-36 sm:h-36 object-contain mix-blend-multiply select-none"
                      src="/mascot/mascot_cozy.png"
                    />
                  )}
                  <span className="absolute -top-1 -right-2 text-[#feab79] text-base sm:text-xl animate-bounce">✨</span>
                </div>

                {/* Word Prompt Content */}
                <div className="space-y-2 max-w-lg my-auto">
                  <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-[#2D2825] tracking-normal leading-snug">
                    {d.frontWord}
                  </h2>
                  {(d.exampleSentence || d.hint) && (
                    <p className="font-serif italic text-sm sm:text-lg text-stone-600 px-2 sm:px-4">
                      "{d.exampleSentence || d.hint}"
                    </p>
                  )}
                </div>

                {/* Primary Action Button: Reveal Answer */}
                <div className="w-full pt-3 sm:pt-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      flip();
                    }}
                    className="w-full sm:w-3/4 mx-auto py-3 sm:py-4 px-6 sm:px-8 bg-[#264653] hover:bg-[#1B353F] text-white font-bold text-sm sm:text-lg rounded-full border-2 border-[#2D2825] shadow-[0px_3px_0px_#1B353F] sm:shadow-[0px_4px_0px_#1B353F] flex items-center justify-center gap-2 sm:gap-2.5 transition-transform active:translate-y-1 cursor-pointer"
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
                className={`absolute inset-0 w-full h-full min-h-[380px] sm:min-h-[480px] bg-white rounded-[28px] sm:rounded-[36px] border-[3.5px] border-[#2D2825] shadow-[-5px_7px_0px_#2D2825] sm:shadow-[-8px_10px_0px_rgba(45,40,37,0.95)] p-4 sm:p-7 md:p-9 flex flex-col justify-between items-center text-center backface-hidden rotate-y-180 ${
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
                <div className="w-full flex items-center justify-between pb-3 border-b-2 border-stone-200/70">
                  <div className="flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 bg-[#EDF6F9] border-2 border-[#2D2825] rounded-full shadow-[2px_2px_0px_#2D2825]">
                    <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#609966]"></span>
                    <span className="text-[11px] sm:text-sm font-extrabold uppercase tracking-wide text-[#609966]">
                      {d.backLabel || 'ĐÁP ÁN TIẾNG ANH'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2">
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
                      className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 bg-stone-100 hover:bg-stone-200 border-2 border-[#2D2825] rounded-full shadow-[1.5px_1.5px_0px_#2D2825] sm:shadow-[2px_2px_0px_#2D2825] text-[11px] sm:text-xs font-bold text-stone-700 transition-colors cursor-pointer"
                    >
                      <span className="text-sm sm:text-base text-[#D36135]">↺</span>
                      <span>Lật lại mặt trước</span>
                    </button>
                  </div>
                </div>

                {/* Back content */}
                <div className="space-y-2.5 sm:space-y-3 max-w-lg my-auto pt-1 sm:pt-2">
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#2D2825] tracking-tight">
                      {d.backWord || d.frontWord}
                    </h2>
                    <button
                      type="button"
                      onClick={playAudio}
                      className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#EBF2F7] hover:bg-[#D8E6F0] active:scale-95 border-2 border-[#2D2825] shadow-[2px_2px_0px_#2D2825] flex items-center justify-center transition-all cursor-pointer"
                      title="Nghe phát âm chuẩn"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#264653]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                        <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>

                  {d.phonetic && (
                    <p className="text-sm sm:text-lg font-mono text-stone-600 font-semibold tracking-wider">
                      /{d.phonetic}/
                    </p>
                  )}

                  {d.meaning && (
                    <div className="bg-[#FAF5EB] border-2 border-[#2D2825] rounded-xl sm:rounded-2xl p-2.5 sm:p-4 text-xs sm:text-base font-bold text-stone-800 shadow-2xs">
                      {d.meaning}
                    </div>
                  )}

                  {d.exampleSentence && (
                    <p className="font-serif italic text-xs sm:text-base text-stone-600 px-2 sm:px-4 leading-relaxed">
                      "{d.exampleSentence}"
                    </p>
                  )}
                </div>

                {/* Rating Action Buttons */}
                <div className="w-full pt-3 sm:pt-4 grid grid-cols-2 gap-2.5 sm:gap-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRate('hard');
                    }}
                    className="py-2.5 sm:py-3.5 px-3 sm:px-4 bg-[#FAF5EB] hover:bg-[#F2ECE0] text-[#D36135] font-bold text-xs sm:text-base rounded-2xl border-2 border-[#2D2825] shadow-[2px_2px_0px_#2D2825] sm:shadow-[2px_3px_0px_#2D2825] active:translate-y-1 transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer"
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
                    className="py-2.5 sm:py-3.5 px-3 sm:px-4 bg-[#609966] hover:bg-[#528357] text-white font-bold text-xs sm:text-base rounded-2xl border-2 border-[#2D2825] shadow-[2px_2px_0px_#2D2825] sm:shadow-[2px_3px_0px_#2D2825] active:translate-y-1 transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer"
                  >
                    <span>🌟</span>
                    <span>Đã nhớ kỹ (2)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts Hint - Desktop Only */}
          <div className="mt-3 sm:mt-5 hidden sm:flex flex-wrap items-center justify-center gap-2.5 text-xs font-semibold text-stone-600">
            <span className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-[#2D2825]/30 shadow-2xs">
              <kbd className="px-1.5 py-0.5 bg-stone-100 border border-stone-400 rounded font-mono font-bold text-stone-800">[Space]</kbd>
              Lật thẻ
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-[#2D2825]/30 shadow-2xs">
              <kbd className="px-1.5 py-0.5 bg-stone-100 border border-stone-400 rounded font-mono font-bold text-stone-800">[1]</kbd>
              Cần ôn lại
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-[#2D2825]/30 shadow-2xs">
              <kbd className="px-1.5 py-0.5 bg-stone-100 border border-stone-400 rounded font-mono font-bold text-stone-800">[2]</kbd>
              Đã nhớ kỹ
            </span>
          </div>
        </section>

        {/* ── Right Study Tips Widget (Desktop lg:flex) ── */}
        <aside className="hidden lg:flex flex-col gap-4 w-64 xl:w-72 shrink-0 pt-2">
          {/* Crayon Picture Book Tip Box */}
          <div className="bg-white border-2 border-[#2D2825] rounded-3xl p-5 shadow-[4px_4px_0px_#2D2825]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">💡</span>
              <h3 className="font-extrabold text-sm text-[#2D2825]">Mẹo Ghi Nhớ Sáp Màu</h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed font-quicksand font-semibold">
              Hãy nhẩm to nghĩa tiếng Anh trước khi bấm lật thẻ. Việc kích hoạt phản xạ tự nhớ giúp não bộ lưu trữ từ mới sâu hơn 300% so với việc chỉ đọc lướt!
            </p>
          </div>

          {/* SRS Schedule Pill */}
          <div className="bg-[#FFF5EB] border-2 border-[#2D2825] rounded-3xl p-4 shadow-[2px_3px_0px_#2D2825] flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-[#E76F51] uppercase">Chu kỳ lặp lại SRS</p>
              <p className="text-xs font-extrabold text-stone-700">Giai đoạn củng cố</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-white border border-[#2D2825] flex items-center justify-center font-bold text-xs shadow-xs">
              ⏳
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
