// src/components/learning/ExerciseCompleted.jsx
// Session completion screen — Pure React with Warm Crayon Study Room aesthetic.

import React, { useEffect } from 'react';

function ratingLabel(w) {
  if (w.skipped) return { text: 'Bỏ qua', cls: 'bg-stone-100 text-stone-700 border border-stone-300' };
  if (w.isNew)   return { text: 'Từ mới',  cls: 'bg-blue-100 text-blue-800 border border-blue-300' };
  if (w.rating === 'easy') return { text: 'Đã nhớ kỹ 🌟', cls: 'bg-emerald-100 text-emerald-800 border border-emerald-300' };
  if (w.rating === 'good') return { text: 'Tốt 👍', cls: 'bg-sky-100 text-sky-800 border border-sky-300' };
  return { text: 'Cần ôn thêm ✏️', cls: 'bg-amber-100 text-amber-800 border border-amber-300' };
}

export default function ExerciseCompleted({ completedWords = [], onGoHome }) {
  useEffect(() => {
    // Play completion sound
    if (typeof window !== 'undefined') window.HiSound?.playComplete?.();
  }, []);

  return (
    <div className="w-full flex flex-col items-center gap-4 my-auto text-center px-4 font-comfortaa">
      {/* ── Main Completion Card ── */}
      <div className="w-full max-w-lg bg-white border-[3.5px] border-[#2B2523] rounded-[36px] p-6 sm:p-8 shadow-[6px_8px_0px_#2B2523] flex flex-col items-center relative">
        {/* Mascot & Celebration Ribbon */}
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 mb-2 flex items-center justify-center">
          <img
            src="/mascot/mascot_cozy.png"
            alt="Bé Hổ Churbito chúc mừng"
            className="w-full h-full object-contain mix-blend-multiply drop-shadow-sm select-none"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold uppercase tracking-wider mb-2">
          <span>🎉</span> Hoàn thành xuất sắc bài học
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mb-1">
          Giỏi quá bạn ơi! 🌿
        </h2>
        <p className="text-stone-600 text-sm sm:text-base font-quicksand font-semibold mb-5 max-w-sm">
          Bạn đã ôn tập và củng cố thành công{' '}
          <strong className="text-[#D36135] font-black text-base">{completedWords.length} từ vựng</strong>{' '}
          vào trí nhớ dài hạn.
        </p>

        {/* Word summary list */}
        <div className="w-full bg-[#FAF5ED] border-2 border-[#2B2523] rounded-2xl p-4 sm:p-5 text-left mb-6 max-h-60 overflow-y-auto shadow-inner">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-300 text-xs font-bold uppercase text-stone-600">
            <span>Từ vựng</span>
            <span>Kết quả SRS</span>
          </div>

          <div className="flex flex-col gap-2">
            {completedWords.map((w, i) => {
              const { text, cls } = ratingLabel(w);
              const wordText = w.word?.word || w.word?.frontWord || w.word?.answer || '—';
              return (
                <div
                  key={i}
                  className="flex items-center justify-between py-1.5 px-2 rounded-xl bg-white border border-stone-200 shadow-2xs"
                >
                  <span className="font-bold text-stone-900 text-sm sm:text-base">{wordText}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${cls}`}>{text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button: Return Home */}
        <button
          type="button"
          onClick={onGoHome}
          className="w-full py-4 px-6 bg-[#2B4566] hover:bg-[#1E334D] active:translate-y-1 text-white font-bold rounded-2xl border-2 border-[#2B2523] shadow-[0px_4px_0px_#15263D] flex items-center justify-center gap-2 text-base sm:text-lg transition-all cursor-pointer"
        >
          <i className="fa-solid fa-house text-base"></i>
          <span>Về Trang chủ</span>
        </button>
      </div>
    </div>
  );
}
