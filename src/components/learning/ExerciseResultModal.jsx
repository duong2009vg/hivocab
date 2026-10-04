// src/components/learning/ExerciseResultModal.jsx
// Cozy Crayon Pop-up Modal for Learning Exercise Results (Correct / Incorrect)
import React, { useEffect } from 'react';

export default function ExerciseResultModal({
  isOpen,
  isCorrect,
  word = '',
  phonetic = '',
  meaning = '',
  userAnswer = '',
  onContinue,
}) {
  // Handle Enter / Space to advance
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e) {
      if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        onContinue?.();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onContinue]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/40 backdrop-blur-[2px] animate-fade-in font-comfortaa">
      <div className="w-full max-w-md bg-white border-[3px] sm:border-[3.5px] border-[#2B2523] rounded-[28px] sm:rounded-[32px] p-5 sm:p-7 shadow-[5px_7px_0px_#2B2523] sm:shadow-[6px_8px_0px_#2B2523] text-center relative animate-bounce-in flex flex-col items-center">
        {/* Top Floating Badge */}
        {isCorrect ? (
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-100 border-2 border-emerald-600 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-3 shadow-xs">
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>CHÍNH XÁC XUẤT SẮC!</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-100 border-2 border-[#D36135] text-[#D36135] text-xs font-bold uppercase tracking-wider mb-3 shadow-xs">
            <svg className="w-4 h-4 text-[#D36135]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>CÙNG GHI NHỚ LẠI NHÉ!</span>
          </div>
        )}

        {/* Mascot / Icon Vignette */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-2 flex items-center justify-center">
          <img
            src="/mascot/mascot_cozy.png"
            alt="Bé Hổ Churbito"
            className="w-full h-full object-contain mix-blend-multiply drop-shadow-xs select-none"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight mb-1">
          {isCorrect ? 'Giỏi quá bạn ơi! 🌟' : 'Chưa đúng rồi bạn ơi! 🐾'}
        </h3>

        <p className="text-xs sm:text-sm font-quicksand font-semibold text-stone-500 mb-4">
          {isCorrect
            ? 'Bạn đã nhớ từ rất chuẩn, tiếp tục phát huy nhé!'
            : 'Đừng lo, não bộ sẽ nhớ sâu hơn sau mỗi lần sửa sai!'}
        </p>

        {/* Word Info Box */}
        <div className="w-full bg-[#FAF5ED] border-2 border-[#2B2523] rounded-2xl p-4 mb-5 text-center shadow-xs">
          <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-0.5">
            {isCorrect ? 'Từ vựng' : 'Đáp án chính xác:'}
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-wide font-rounded">
            "{word}"
          </div>

          {phonetic && (
            <div className="text-sm font-mono text-stone-600 tracking-widest mt-0.5">
              /{phonetic}/
            </div>
          )}

          {meaning && (
            <div className="text-sm font-bold text-[#2B4566] mt-2 pt-2 border-t border-dashed border-stone-300 font-quicksand">
              Nghĩa: <span className="font-semibold text-stone-800">{meaning}</span>
            </div>
          )}

          {!isCorrect && userAnswer && (
            <div className="text-xs text-stone-500 mt-2 font-quicksand">
              Bạn đã chọn / điền: <span className="text-red-600 line-through font-bold">"{userAnswer}"</span>
            </div>
          )}
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={onContinue}
          className={`w-full py-3.5 sm:py-4 px-6 font-bold text-base sm:text-lg text-white rounded-2xl border-2 border-[#2B2523] shadow-[0px_4px_0px_#15263D] active:translate-y-1 active:shadow-none flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
            isCorrect ? 'bg-[#2B4566] hover:bg-[#1E334D]' : 'bg-[#D36135] hover:bg-[#B85128]'
          }`}
        >
          <span>{isCorrect ? 'Tiếp tục bài học' : 'Đã nhớ, tiếp tục'}</span>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <span className="hidden sm:inline-block text-[11px] text-stone-400 font-quicksand font-semibold mt-2.5">
          Nhấn <kbd className="px-1.5 py-0.5 bg-stone-100 border border-stone-300 rounded font-mono text-[10px]">Enter</kbd> hoặc <kbd className="px-1.5 py-0.5 bg-stone-100 border border-stone-300 rounded font-mono text-[10px]">Space</kbd> để tiếp tục nhanh
        </span>
      </div>
    </div>
  );
}
