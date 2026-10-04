// src/components/bilingual/BilingualVocabTooltip.jsx
// Floating popover tooltip cho từ vựng bài đọc - Phong cách Cozy Crayon ấm áp

import React, { useEffect, useRef } from 'react';
import { speakWord } from '../../utils/bilingualSoundUtils.js';

export function BilingualVocabTooltip({ tooltip, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!tooltip) return;

    const handleOutsideClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [tooltip, onClose]);

  if (!tooltip) return null;

  const { word, pos, phonetic, meaning, x, y } = tooltip;

  return (
    <div
      ref={ref}
      style={{ left: `${Math.min(window.innerWidth - 300, Math.max(16, x - 100))}px`, top: `${y + 12}px` }}
      className="fixed z-[9999] bg-[#FFFDF9] border-2 border-[#382E2B] rounded-3xl p-5 shadow-[5px_6px_0px_#382E2B] max-w-xs sm:max-w-sm fade-in select-none text-left"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-heading font-black text-[#382E2B] text-lg sm:text-xl">{word}</h4>
          {pos && (
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#E5EFE2] text-[#557A46] border border-[#8FB383]">
              {pos}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-full text-[#766C5F] hover:text-[#382E2B] hover:bg-[#FAF5EB] cursor-pointer text-xs font-black transition-colors"
          title="Đóng"
        >
          ✕
        </button>
      </div>

      {phonetic && (
        <p className="font-mono text-xs text-[#766C5F] font-semibold mb-2.5">{phonetic}</p>
      )}

      <div className="bg-[#FFF8EE] rounded-2xl p-3.5 mb-3.5 border-2 border-dashed border-[#E5A13C]">
        <p className="text-[10px] font-black text-[#D36135] uppercase tracking-wider mb-1">
          Nghĩa tiếng Việt 🐾
        </p>
        <p className="text-xs sm:text-sm font-black text-[#382E2B] leading-snug">{meaning}</p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => speakWord(word)}
          className="flex-1 py-2 px-3 rounded-2xl bg-[#5a7d4d] hover:bg-[#4d6d41] text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:translate-y-0.5 border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B]"
        >
          <span>🔊</span>
          <span>Phát âm</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-2xl bg-white hover:bg-[#FAF5EB] text-[#382E2B] font-bold text-xs transition-all cursor-pointer border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] active:translate-y-0.5"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}

export default BilingualVocabTooltip;
