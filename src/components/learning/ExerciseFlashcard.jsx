// src/components/learning/ExerciseFlashcard.jsx
// 3D flip flashcard — fully React, no DOM mutation.

import { useState, useEffect, useCallback } from 'react';

export default function ExerciseFlashcard({ item, onRate, onReport }) {
  const [flipped, setFlipped] = useState(false);
  const d = item?.exerciseData || {};

  // Reset flip state when new card appears
  useEffect(() => {
    setFlipped(false);
  }, [item]);

  // Keyboard: Space/Enter = flip; 1/2/3 = rate (only when flipped)
  useEffect(() => {
    function handleKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setFlipped(f => !f);
      }
      if (flipped) {
        if (e.key === '1') { e.preventDefault(); onRate('hard'); }
        if (e.key === '2') { e.preventDefault(); onRate('good'); }
        if (e.key === '3') { e.preventDefault(); onRate('easy'); }
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [flipped, onRate]);

  const flip = useCallback(() => {
    setFlipped(f => !f);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-3 px-1 sm:px-3">
      {/* Header */}
      <div className="w-full max-w-xl flex items-center justify-between px-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          Bài tập: Thẻ ghi nhớ
        </div>
        <button
          type="button"
          onClick={onReport}
          className="p-1 rounded-lg text-outline hover:text-red-500 hover:bg-red-50/50 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
          title="Báo lỗi bài tập này"
        >
          <span className="material-symbols-outlined text-[15px]">flag</span>
          <span className="hidden sm:inline">Báo lỗi</span>
        </button>
      </div>

      {/* 3D Scene */}
      <div className="flashcard-scene w-full max-w-xl mx-auto">
        <div
          id="flashcard-card"
          className={`flashcard-3d-card${flipped ? ' is-flipped' : ''}`}
          onClick={flip}
          tabIndex={0}
          role="button"
          aria-label="Thẻ ghi nhớ - Nhấn hoặc bấm Space để lật thẻ"
          onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } }}
        >
          <div className="flashcard-sheen" />

          {/* Front face */}
          <div id="card-front" className="flashcard-face flashcard-front">
            <div className="flex items-center justify-between w-full">
              <span className="text-on-surface-variant text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
                {d.frontLabel}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-on-surface-variant bg-surface-container-high/80 px-2.5 py-0.5 rounded-full">
                <span className="material-symbols-outlined text-[14px]">touch_app</span>
                Chạm để lật
              </span>
            </div>

            <div className="my-auto text-center py-2 flex flex-col items-center justify-center px-2 w-full">
              {d.imageUrl && (
                <div className="mb-3 flex justify-center w-full">
                  <img
                    src={d.imageUrl}
                    alt={d.frontWord}
                    className="max-h-36 sm:max-h-48 max-w-full rounded-2xl object-contain shadow-sm border border-outline-variant/20 hover:scale-[1.02] transition-transform"
                    loading="lazy"
                    onError={e => e.currentTarget.parentElement.style.display = 'none'}
                  />
                </div>
              )}
              <h2 className="font-bold text-on-surface text-2xl sm:text-3xl md:text-4xl text-center leading-snug break-words max-w-full">
                {d.frontWord}
              </h2>
            </div>

            <div className="flex justify-center w-full">
              <button className="flashcard-flip-pill bg-primary text-on-primary px-5 py-2.5 sm:px-7 sm:py-3 rounded-full text-xs sm:text-sm font-bold tracking-wide flex items-center gap-2 shadow-sm pointer-events-none">
                <span className="material-symbols-outlined text-[18px]">visibility</span>
                <span>Nhấn xem đáp án</span>
                <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] bg-white/20 rounded font-mono">Space</kbd>
              </button>
            </div>
          </div>

          {/* Back face */}
          <div id="card-back" className="flashcard-face flashcard-back">
            <div className="flex items-center justify-between w-full">
              <span className="text-primary font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                {d.backLabel}
              </span>
              <button
                onClick={e => { e.stopPropagation(); flip(); }}
                title="Lật lại mặt trước"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-on-surface-variant hover:text-primary transition-colors bg-surface-container-high/70 hover:bg-surface-container-high px-2.5 py-1 rounded-full active:scale-95 touch-manipulation"
              >
                <span className="material-symbols-outlined text-[14px]">undo</span>
                <span>Lật lại</span>
              </button>
            </div>

            <div className="my-auto text-center py-2 flex flex-col items-center justify-center px-2 w-full">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-1 max-w-full">
                <h2 className="font-bold text-primary text-2xl sm:text-3xl md:text-4xl text-center break-words leading-tight">
                  {d.backWord}
                </h2>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    if (window.HiAudio?.playWord) window.HiAudio.playWord(d.backWord, 0.9);
                  }}
                  title="Nghe phát âm"
                  className="p-2 sm:p-2.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 active:scale-90 transition-all shrink-0 touch-manipulation"
                >
                  <span className="material-symbols-outlined text-[22px] sm:text-[24px]">volume_up</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 flex-wrap mt-0.5 mb-2">
                {d.pos && (
                  <span className="text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {d.pos}
                  </span>
                )}
                {d.phonetic && (
                  <span className="text-on-surface-variant font-mono text-xs sm:text-sm">
                    {d.phonetic}
                  </span>
                )}
              </div>

              {d.exampleSentence && (
                <div className="w-full max-w-md mx-auto px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-surface-container-lowest/70 border border-outline-variant/30 text-center mb-1">
                  <p className="text-[11px] sm:text-xs md:text-sm text-on-surface/85 italic line-clamp-3 leading-relaxed">
                    "{d.exampleSentence}"
                  </p>
                </div>
              )}

              {d.imageUrl && (
                <div className="my-1 sm:my-1.5 flex justify-center w-full">
                  <img
                    src={d.imageUrl}
                    alt={d.backWord}
                    className="max-h-24 sm:max-h-32 max-w-full rounded-xl object-contain shadow-sm border border-outline-variant/20 hover:scale-[1.02] transition-transform"
                    loading="lazy"
                    onError={e => e.currentTarget.parentElement.style.display = 'none'}
                  />
                </div>
              )}
            </div>

            {/* Rating buttons */}
            <div className="flex w-full flex-row justify-center gap-2 sm:gap-3">
              <button
                onClick={e => { e.stopPropagation(); onRate('hard'); }}
                className="flex-1 min-h-[44px] py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold bg-tertiary-fixed text-on-tertiary-fixed hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1 shadow-sm touch-manipulation"
              >
                <span>Khó</span>
                <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] bg-black/10 rounded font-mono font-normal">1</kbd>
              </button>
              <button
                onClick={e => { e.stopPropagation(); onRate('good'); }}
                className="flex-1 min-h-[44px] py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold bg-secondary-container text-on-secondary-container hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1 shadow-sm touch-manipulation"
              >
                <span>Tốt</span>
                <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] bg-black/10 rounded font-mono font-normal">2</kbd>
              </button>
              <button
                onClick={e => { e.stopPropagation(); onRate('easy'); }}
                className="flex-1 min-h-[44px] py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold bg-primary text-on-primary hover:bg-surface-tint active:scale-95 transition-all flex items-center justify-center gap-1 shadow-sm touch-manipulation"
              >
                <span>Dễ</span>
                <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] bg-white/20 rounded font-mono font-normal">3</kbd>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
