// src/components/thpt/ExamHeader.jsx
// Header bar (38px): timer, câu hỏi navigation, controls, nộp bài

import React from 'react';

export function ExamHeader({
  exam,
  currentQIndex,
  answeredCount,
  isReviewMode,
  results,
  timerDisplay,
  isTimerWarning,
  mobileView,
  onPrev,
  onNext,
  onChangeFontSize,
  onToggleFullscreen,
  onConfirmSubmit,
  onShowResults,
  onExit,
  onSetMobileView,
}) {
  const totalQ = exam?.total_questions || 40;
  const currentQNum = currentQIndex + 1;

  return (
    <header className="h-[38px] min-h-[38px] max-h-[38px] bg-[#1a365d] text-white px-3 md:px-4 flex items-center justify-between border-b border-[#2b4c7e] shrink-0 shadow-sm z-30 select-none">
      {/* Left: Kỳ thi */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-6 h-6 rounded-lg bg-blue-600/40 border border-blue-400/30 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-white text-[16px]">school</span>
        </div>
        <div className="min-w-0 flex items-center gap-1.5">
          <span className="text-xs font-black tracking-wide uppercase text-blue-200 truncate">THPT TIẾNG ANH</span>
          <span className="text-amber-300 font-mono font-bold text-[10px] bg-[#0f2342] px-1.5 py-0.5 rounded border border-blue-400/20 shrink-0">
            SBD: 10082401
          </span>
          {isReviewMode ? (
            <span className="hidden xl:inline-block text-[11px] text-emerald-300 font-bold truncate max-w-[160px]">
              XEM LỜI GIẢI CHI TIẾT
            </span>
          ) : (
            <span className="hidden xl:inline-block text-[11px] text-slate-300 font-medium truncate max-w-[120px]">
              {exam?.title || 'Thí sinh'}
            </span>
          )}
        </div>
      </div>

      {/* Center: Navigation + Timer + Progress */}
      <div className="flex items-center gap-1.5 md:gap-2.5">
        {/* Question nav */}
        <div className="flex items-center bg-[#0f2342] border border-blue-400/30 rounded-lg p-0.5">
          <button
            type="button"
            onClick={onPrev}
            className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
            title="Câu trước (←)"
          >
            <span className="material-symbols-outlined text-[15px]">chevron_left</span>
          </button>
          <div className="px-1.5 text-[11px] font-mono font-bold text-blue-100 whitespace-nowrap">
            Câu <span>{currentQNum}</span>/{totalQ}
          </div>
          <button
            type="button"
            onClick={onNext}
            className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
            title="Câu kế tiếp (→ hoặc Enter)"
          >
            <span className="material-symbols-outlined text-[15px]">chevron_right</span>
          </button>
        </div>

        {/* Timer */}
        {!isReviewMode && (
          <div className={`flex items-center gap-1 bg-[#0f2342] border border-blue-400/30 px-2 py-0.5 rounded-lg shadow-inner text-white ${isTimerWarning ? 'text-rose-400 animate-pulse' : ''}`}>
            <span className="material-symbols-outlined text-[15px] text-amber-400">timer</span>
            <span className="font-mono text-xs md:text-sm font-black tracking-wider text-amber-300">
              {timerDisplay}
            </span>
          </div>
        )}

        {/* Progress */}
        <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-blue-200 bg-blue-900/50 border border-blue-400/20 px-2 py-0.5 rounded-lg">
          <span className="material-symbols-outlined text-[13px] text-emerald-400">task_alt</span>
          {isReviewMode && results ? (
            <span>
              Đúng: <strong>{results.correct}</strong>/{results.total} ({results.score.toFixed(2)}đ)
            </span>
          ) : (
            <span>{answeredCount} / {totalQ}</span>
          )}
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-1 md:gap-1.5 shrink-0">
        {/* Mobile view switcher */}
        <div className="flex md:hidden items-center bg-[#0f2342] border border-blue-400/30 p-0.5 rounded-lg text-[10px] font-bold">
          {['passage', 'both', 'questions'].map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onSetMobileView(mode)}
              className={`px-1.5 py-0.5 rounded transition-colors ${mobileView === mode ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}`}
            >
              {mode === 'passage' ? 'Đọc' : mode === 'both' ? '2 bên' : 'Câu'}
            </button>
          ))}
        </div>

        {/* Font size */}
        <div className="hidden lg:flex items-center gap-0.5 bg-[#0f2342] border border-blue-400/30 p-0.5 rounded-lg">
          <button onClick={() => onChangeFontSize(-1)} className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer" title="Giảm cỡ chữ">A-</button>
          <button onClick={() => onChangeFontSize(1)} className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer" title="Tăng cỡ chữ">A+</button>
        </div>

        {/* Fullscreen */}
        <button
          onClick={onToggleFullscreen}
          className="hidden sm:flex w-6 h-6 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 items-center justify-center transition-colors cursor-pointer"
          title="Toàn màn hình"
        >
          <span className="material-symbols-outlined text-[16px]">fullscreen</span>
        </button>

        {/* Submit / Results */}
        {isReviewMode ? (
          <button
            onClick={onShowResults}
            className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider shadow hover:shadow-md transition-all flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">military_tech</span>
            <span>KẾT QUẢ</span>
          </button>
        ) : (
          <button
            onClick={onConfirmSubmit}
            className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs uppercase tracking-wider shadow hover:shadow-md transition-all flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">send</span>
            <span>NỘP BÀI</span>
          </button>
        )}

        {/* Exit */}
        <button
          onClick={onExit}
          className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Thoát phòng thi"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
    </header>
  );
}

export default ExamHeader;
