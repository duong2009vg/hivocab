// src/components/learning/ExerciseMCQ.jsx
// Multiple choice question exercise — pure React.

import { useState, useEffect, useCallback } from 'react';

export default function ExerciseMCQ({ item, onSubmit, onReport }) {
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [result, setResult] = useState(null); // { correct, correctIndex }
  const d = item?.exerciseData || {};

  // Reset when new item
  useEffect(() => {
    setSelectedIdx(null);
    setResult(null);
  }, [item]);

  // Keyboard: 1-4 select, Enter = check
  useEffect(() => {
    function handleKey(e) {
      if (result) return; // already submitted
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= (d.options?.length || 4)) {
        e.preventDefault();
        setSelectedIdx(num - 1);
      }
      if ((e.key === 'Enter') && selectedIdx !== null) {
        e.preventDefault();
        handleCheck();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedIdx, result, d.options]);

  const handleSelect = useCallback((idx) => {
    if (result) return;
    setSelectedIdx(idx);
  }, [result]);

  const handleCheck = useCallback(() => {
    if (result || selectedIdx === null) return;
    const correctIndex = d.options?.findIndex(o => o.isCorrect) ?? -1;
    const r = onSubmit(selectedIdx);
    setResult({ ...r, correctIndex });
    // Auto-advance after delay
    if (!r.skipped) {
      setTimeout(() => {
        setSelectedIdx(null);
        setResult(null);
      }, 1600);
    }
  }, [result, selectedIdx, d.options, onSubmit]);

  function optionClass(idx) {
    const base = 'mcq-opt w-full text-left p-3.5 sm:p-4 rounded-xl border-2 transition-all flex items-center justify-between gap-3 touch-manipulation';
    if (!result) {
      if (selectedIdx === idx) {
        return `${base} border-primary bg-primary/5 text-on-surface shadow-sm`;
      }
      return `${base} border-outline-variant/40 bg-surface-container-lowest hover:border-primary/40 hover:bg-surface-container-low`;
    }
    // Show result
    if (idx === result.correctIndex) {
      return `${base} border-green-500 bg-green-50 dark:bg-green-900/20`;
    }
    if (idx === selectedIdx && !result.correct) {
      return `${base} border-error bg-error-container/20`;
    }
    return `${base} border-outline-variant/40 bg-surface-container-lowest opacity-60`;
  }

  function optionIcon(idx) {
    if (!result) {
      return selectedIdx === idx
        ? { name: 'radio_button_checked', color: 'text-primary' }
        : { name: 'radio_button_unchecked', color: 'text-outline-variant' };
    }
    if (idx === result.correctIndex) return { name: 'check_circle', color: 'text-green-600' };
    if (idx === selectedIdx && !result.correct) return { name: 'cancel', color: 'text-error' };
    return { name: 'radio_button_unchecked', color: 'text-outline-variant/40' };
  }

  // Toast after check
  const toastColor = result?.correct ? 'bg-green-500' : 'bg-error';
  const toastText  = result?.correct ? '✓ Chính xác!' : '✗ Sai rồi, thử dạng bài khác nhé!';

  return (
    <div className="w-full flex flex-col items-center gap-3">
      {/* Header */}
      <div className="w-full max-w-xl flex items-center justify-between px-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          Bài tập: Trắc nghiệm
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

      {/* Card */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm w-full max-w-xl p-6 md:p-8 flex flex-col">
        {/* Question */}
        <div className="text-center mb-5 md:mb-7">
          <span className="text-on-surface-variant text-xs md:text-sm block mb-2">{d.question}</span>
          <div className="flex items-center justify-center gap-2">
            <h2 className="font-bold text-on-surface text-2xl md:text-3xl">"{d.word}"</h2>
            <button
              onClick={() => window.HiAudio?.playWord?.(d.word, 0.9)}
              title="Nghe phát âm"
              className="p-2 rounded-full bg-surface-container-low text-primary hover:bg-primary/10 transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">volume_up</span>
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(d.options || []).map((opt, idx) => {
            const icon = optionIcon(idx);
            return (
              <button
                key={idx}
                data-idx={idx}
                onClick={() => handleSelect(idx)}
                disabled={!!result}
                className={optionClass(idx)}
              >
                <span className="text-sm md:text-base font-medium text-on-surface leading-snug">{opt.text}</span>
                <span className={`material-symbols-outlined shrink-0 md:hidden ${icon.color}`}>
                  {icon.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Check button */}
        <div className="mt-5 md:mt-7">
          <button
            onClick={handleCheck}
            disabled={selectedIdx === null || !!result}
            className={`w-full py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all ${
              selectedIdx !== null && !result
                ? 'bg-primary text-on-primary hover:bg-primary/90 active:scale-[0.98] shadow-sm cursor-pointer'
                : 'bg-surface-container text-on-surface-variant cursor-not-allowed opacity-60'
            }`}
          >
            Kiểm tra &amp; Tiếp tục
          </button>
        </div>
      </div>

      {/* Toast overlay */}
      {result && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full text-white text-sm font-bold shadow-lg ${toastColor} animate-bounce-in`}>
          {toastText}
        </div>
      )}
    </div>
  );
}
