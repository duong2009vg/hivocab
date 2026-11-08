// src/components/bilingual/BilingualVocabTooltip.jsx
// Floating popover tooltip cho từ vựng bài đọc - Phong cách Cozy Crayon ấm áp

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Volume2, X } from 'lucide-react';
import { speakWord } from '../../utils/bilingualSoundUtils.js';

export function BilingualVocabTooltip({ tooltip, onClose }) {
  const ref = useRef(null);

  // Dynamic coordinates with viewport clamping and vertical clearance
  const [coords, setCoords] = useState(() => {
    if (typeof window === 'undefined' || !tooltip) return { left: 16, top: 16 };
    const estWidth = Math.min(320, window.innerWidth - 32);
    const maxLeft = Math.max(16, window.innerWidth - estWidth - 16);
    const targetLeft = tooltip.x != null ? tooltip.x - 100 : 16;
    const clampedLeft = Math.min(maxLeft, Math.max(16, targetLeft));
    let targetTop = (tooltip.y || 0) + 12;
    if (targetTop + 240 + 16 > window.innerHeight) {
      const topAbove = (tooltip.y || 0) - 240 - 12;
      targetTop = topAbove >= 16 ? topAbove : Math.max(16, window.innerHeight - 240 - 16);
    }
    return { left: clampedLeft, top: targetTop };
  });

  useLayoutEffect(() => {
    if (!tooltip) return;

    const updateCoords = () => {
      const el = ref.current;
      const margin = 16;
      const tooltipWidth = el ? el.offsetWidth : Math.min(320, window.innerWidth - 32);
      const tooltipHeight = el ? el.offsetHeight : 230;

      // 1. Horizontal Clamping: strictly within [16px, innerWidth - tooltipWidth - 16px]
      const maxLeft = Math.max(margin, window.innerWidth - tooltipWidth - margin);
      const targetLeft = tooltip.x != null ? tooltip.x - 100 : margin;
      const clampedLeft = Math.min(maxLeft, Math.max(margin, targetLeft));

      // 2. Vertical Clearance: ensure bottom action buttons are never cut off
      let targetTop = (tooltip.y || 0) + 12;
      const viewportHeight = window.innerHeight;

      // If tooltip bleeds off the bottom of the viewport
      if (targetTop + tooltipHeight + margin > viewportHeight) {
        const topAbove = (tooltip.y || 0) - tooltipHeight - 12;
        if (topAbove >= margin) {
          targetTop = topAbove;
        } else {
          targetTop = Math.max(margin, viewportHeight - tooltipHeight - margin);
        }
      }

      setCoords({ left: clampedLeft, top: targetTop });
    };

    updateCoords();
    window.addEventListener('resize', updateCoords);
    return () => window.removeEventListener('resize', updateCoords);
  }, [tooltip]);

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

  const { word, pos, phonetic, meaning } = tooltip;

  return (
    <div
      ref={ref}
      style={{ left: `${coords.left}px`, top: `${coords.top}px` }}
      className="fixed z-[9999] bg-[#FFFDF9] border-2 border-[#382E2B] rounded-3xl p-4 sm:p-5 shadow-[5px_6px_0px_#382E2B] w-[calc(100vw-32px)] sm:w-80 max-w-sm max-h-[calc(100dvh-32px)] overflow-y-auto fade-in select-none text-left"
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
          className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-[#766C5F] hover:text-[#382E2B] hover:bg-[#FAF5EB] cursor-pointer text-xs font-black transition-colors"
          title="Đóng"
          aria-label="Đóng bảng giải nghĩa từ vựng"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {phonetic && (
        <p className="font-mono text-xs text-[#766C5F] font-semibold mb-2.5">{phonetic}</p>
      )}

      <div className="bg-[#FFF8EE] rounded-2xl p-3.5 mb-3.5 border-2 border-dashed border-[#E5A13C]">
        <p className="text-[10px] font-black text-[#D36135] uppercase tracking-wider mb-1">
          Nghĩa tiếng Việt
        </p>
        <p className="text-xs sm:text-sm font-black text-[#382E2B] leading-snug">{meaning}</p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => speakWord(word)}
          className="flex-1 min-h-[44px] py-2.5 px-3 rounded-2xl bg-[#5a7d4d] hover:bg-[#4d6d41] text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:translate-y-0.5 border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B]"
        >
          <Volume2 className="w-4 h-4 shrink-0" />
          <span>Phát âm</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-white hover:bg-[#FAF5EB] text-[#382E2B] font-bold text-xs transition-all cursor-pointer border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] active:translate-y-0.5"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}

export default BilingualVocabTooltip;
