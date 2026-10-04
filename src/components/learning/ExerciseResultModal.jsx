// src/components/learning/ExerciseResultModal.jsx
// Cozy Crayon Pop-up Modal for Learning Exercise Results - Centered, Compact & Perfectly Proportioned
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
      <div className="w-full max-w-sm sm:max-w-md bg-white border-[3px] border-[#2B2523] rounded-[24px] sm:rounded-[28px] p-4 sm:p-5 shadow-[4px_6px_0px_#2B2523] sm:shadow-[5px_7px_0px_#2B2523] text-center relative animate-bounce-in flex flex-col items-center my-auto">
        {/* Top Status Badge */}
        {isCorrect ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border-2 border-emerald-600 text-emerald-800 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-2 shadow-2xs">
            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>CHÍNH XÁC XUẤT SẮC!</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border-2 border-[#D36135] text-[#D36135] text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-2 shadow-2xs">
            <svg className="w-3.5 h-3.5 text-[#D36135]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>CÙNG GHI NHỚ LẠI NHÉ!</span>
          </div>
        )}

        {/* Mascot + Title Row */}
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 relative flex items-center justify-center shrink-0">
            <img
              src="/mascot/mascot_cozy.png"
              alt="Bé Hổ Churbito"
              className="w-full h-full object-contain mix-blend-multiply drop-shadow-2xs select-none"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <h3 className="text-base sm:text-lg font-black text-stone-900 tracking-tight text-left">
            {isCorrect ? 'Giỏi quá bạn ơi! 🌟' : 'Chưa đúng rồi bạn ơi! 🐾'}
          </h3>
        </div>

        <p className="text-[11px] sm:text-xs font-quicksand font-semibold text-stone-500 mb-2.5">
          {isCorrect
            ? 'Bạn đã nhớ từ rất chuẩn, tiếp tục phát huy nhé!'
            : 'Đừng lo, não bộ sẽ nhớ sâu hơn sau mỗi lần sửa sai!'}
        </p>

        {/* Word Info Box - Compact & Clear */}
        <div className="w-full bg-[#FAF5ED] border-2 border-[#2B2523] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 mb-3 text-center shadow-2xs">
          <div className="text-[10px] sm:text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-0.5">
            {isCorrect ? 'Từ vựng' : 'Đáp án chính xác:'}
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-wide font-rounded">
            "{word}"
          </div>

          {phonetic && (
            <div className="text-xs font-mono text-stone-600 tracking-widest mt-0.5">
              /{phonetic}/
            </div>
          )}

          {meaning && (
            <div className="text-xs sm:text-sm font-bold text-[#2B4566] mt-1.5 pt-1.5 border-t border-dashed border-stone-300 font-quicksand">
              Nghĩa: <span className="font-semibold text-stone-800">{meaning}</span>
            </div>
          )}

          {!isCorrect && userAnswer && (
            <div className="text-[11px] text-stone-500 mt-1 font-quicksand">
              Bạn đã chọn / điền: <span className="text-red-600 line-through font-bold">"{userAnswer}"</span>
            </div>
          )}
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={onContinue}
          className={`w-full py-2.5 sm:py-3 px-5 font-bold text-sm sm:text-base text-white rounded-xl sm:rounded-2xl border-2 border-[#2B2523] shadow-[0px_3px_0px_#15263D] active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-2 transition-all cursor-pointer ${
            isCorrect ? 'bg-[#2B4566] hover:bg-[#1E334D]' : 'bg-[#D36135] hover:bg-[#B85128]'
          }`}
        >
          <span>{isCorrect ? 'Tiếp tục bài học' : 'Đã nhớ, tiếp tục'}</span>
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <span className="hidden sm:inline-block text-[10px] text-stone-400 font-quicksand font-semibold mt-1.5">
          Nhấn <kbd className="px-1 py-0.2 bg-stone-100 border border-stone-300 rounded font-mono text-[9px]">Enter</kbd> hoặc <kbd className="px-1 py-0.2 bg-stone-100 border border-stone-300 rounded font-mono text-[9px]">Space</kbd> để tiếp tục
        </span>
      </div>
    </div>
  );
}
