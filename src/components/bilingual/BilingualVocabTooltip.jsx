// src/components/bilingual/BilingualVocabTooltip.jsx
// Floating popover tooltip for highlighted vocabulary words

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
      style={{ left: `${x}px`, top: `${y}px` }}
      className="fixed z-[9999] bg-surface/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-outline-variant/30 rounded-2xl p-4 shadow-2xl max-w-xs sm:max-w-sm fade-in select-none text-left"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-bold text-primary text-lg">{word}</h4>
          {pos && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {pos}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-outline hover:text-on-surface p-1 rounded-full cursor-pointer transition-colors"
          title="Đóng"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {phonetic && (
        <p className="font-mono text-xs text-outline mb-2">{phonetic}</p>
      )}

      <div className="bg-surface-container-low/70 rounded-xl p-3 mb-3 border border-outline-variant/15">
        <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1">
          Nghĩa tiếng Việt
        </p>
        <p className="text-sm font-semibold text-on-surface leading-snug">{meaning}</p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => speakWord(word)}
          className="flex-1 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">volume_up</span>
          <span>Phát âm</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-surface-container text-on-surface-variant hover:text-on-surface font-semibold text-xs transition-colors cursor-pointer"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}

export default BilingualVocabTooltip;
