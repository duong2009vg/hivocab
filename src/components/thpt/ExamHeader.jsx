// src/components/thpt/ExamHeader.jsx
// Header bar (52px): điều hướng câu hỏi, đồng hồ đếm ngược, kiểm soát font chữ, nộp bài
// Chuẩn phong cách HiVocab Exam Focus Mode: tối giản, tương phản cao, công thái học

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Send,
  Award,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

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
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <header className="h-[52px] min-h-[52px] max-h-[52px] bg-[#FFFDF9] text-[#2D2422] px-3 sm:px-5 flex items-center justify-between border-b border-[#EFE8D6] shrink-0 shadow-xs z-30 select-none">
      {/* ── Left: Thoát & Tên Đề Thi ─────────────────────────────────── */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onExit}
          className="p-1.5 -ml-1 text-[#6B5A4E] hover:text-[#2D2422] hover:bg-[#FAF5EB] rounded-xl transition-colors cursor-pointer flex items-center gap-1"
          title="Thoát phòng thi"
        >
          <ArrowLeft className="w-5 h-5 shrink-0" />
          <span className="hidden xl:inline text-xs font-bold text-[#6B5A4E]">Thoát</span>
        </button>

        <div className="h-5 w-px bg-[#EFE8D6] hidden sm:block shrink-0" />

        <div className="min-w-0 flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#5a7d4d]/10 text-[#486b3c] border border-[#5a7d4d]/25 shrink-0">
            <GraduationCap className="w-3 h-3" />
            <span>THPT QG</span>
          </span>

          <h2
            className="font-heading font-black text-xs sm:text-sm text-[#2D2422] truncate max-w-[120px] sm:max-w-[200px] md:max-w-[280px] xl:max-w-md"
            title={exam?.title || 'Phòng luyện thi THPT'}
          >
            {exam?.title || 'Phòng luyện thi THPT'}
          </h2>

          {isReviewMode && (
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Xem giải chi tiết</span>
            </span>
          )}
        </div>
      </div>

      {/* ── Center: Điều hướng câu + Đồng hồ đếm ngược ───────────────── */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Bộ điều hướng câu trước/sau */}
        <div className="flex items-center bg-[#FAF5EB] border border-[#EFE8D6] rounded-xl p-0.5">
          <button
            type="button"
            onClick={onPrev}
            className="w-7 h-7 flex items-center justify-center text-[#6B5A4E] hover:text-[#2D2422] hover:bg-white rounded-lg transition-colors cursor-pointer active:scale-95"
            title="Câu trước (←)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-2 text-xs font-bold text-[#2D2422] whitespace-nowrap">
            Câu <span className="font-black text-[#5a7d4d]">{currentQNum}</span>
            <span className="text-[#8C827A] font-normal">/{totalQ}</span>
          </div>
          <button
            type="button"
            onClick={onNext}
            className="w-7 h-7 flex items-center justify-center text-[#6B5A4E] hover:text-[#2D2422] hover:bg-white rounded-lg transition-colors cursor-pointer active:scale-95"
            title="Câu kế tiếp (→ hoặc Enter)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Đồng hồ đếm ngược */}
        {!isReviewMode && (
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs sm:text-sm font-black transition-colors ${
              isTimerWarning
                ? 'bg-rose-50 text-rose-600 border-rose-300 animate-pulse'
                : 'bg-[#FFFDF9] text-[#8C5311] border-[#EFE8D6]'
            }`}
            title="Thời gian còn lại"
          >
            <Clock className={`w-3.5 h-3.5 ${isTimerWarning ? 'text-rose-500' : 'text-amber-500'}`} />
            <span className="tabular-nums tracking-wider">{timerDisplay}</span>
          </div>
        )}

        {/* Tiến độ hoàn thành bài thi */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs font-bold text-[#6B5A4E] bg-[#FAF5EB] border border-[#EFE8D6] px-2.5 py-1 rounded-xl">
          {isReviewMode && results ? (
            <span className="text-emerald-800 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>Đúng: <strong>{results.correct}</strong>/{results.total} ({results.score.toFixed(2)}đ)</span>
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#5a7d4d]" />
              <span><strong>{answeredCount}</strong>/{totalQ} đã làm</span>
            </span>
          )}
        </div>
      </div>

      {/* ── Right: Bộ điều khiển & Nộp bài ──────────────────────────── */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Bộ chuyển đổi view trên điện thoại */}
        <div className="flex md:hidden items-center bg-[#FAF5EB] border border-[#EFE8D6] p-0.5 rounded-xl text-[11px] font-bold">
          {['passage', 'both', 'questions'].map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onSetMobileView(mode)}
              className={`px-2 py-1 rounded-lg transition-colors ${
                mobileView === mode
                  ? 'bg-[#5a7d4d] text-white shadow-2xs'
                  : 'text-[#6B5A4E] hover:text-[#2D2422]'
              }`}
            >
              {mode === 'passage' ? 'Đọc' : mode === 'both' ? '2 bên' : 'Câu'}
            </button>
          ))}
        </div>

        {/* Cỡ chữ */}
        <div className="hidden lg:flex items-center bg-[#FAF5EB] border border-[#EFE8D6] p-0.5 rounded-xl">
          <button
            type="button"
            onClick={() => onChangeFontSize(-1)}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold text-[#6B5A4E] hover:text-[#2D2422] hover:bg-white transition-colors cursor-pointer"
            title="Giảm cỡ chữ (A-)"
          >
            A-
          </button>
          <div className="w-px h-3.5 bg-[#EFE8D6]" />
          <button
            type="button"
            onClick={() => onChangeFontSize(1)}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold text-[#6B5A4E] hover:text-[#2D2422] hover:bg-white transition-colors cursor-pointer"
            title="Tăng cỡ chữ (A+)"
          >
            A+
          </button>
        </div>

        {/* Toàn màn hình */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="hidden sm:flex w-8 h-8 rounded-xl text-[#6B5A4E] hover:text-[#2D2422] hover:bg-[#FAF5EB] border border-transparent hover:border-[#EFE8D6] items-center justify-center transition-colors cursor-pointer"
          title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Toàn màn hình'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>

        {/* Nút Nộp Bài / Xem Kết Quả */}
        {isReviewMode ? (
          <button
            type="button"
            onClick={onShowResults}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-xs hover:shadow-sm active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Award className="w-4 h-4 shrink-0" />
            <span className="hidden xs:inline">KẾT QUẢ</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onConfirmSubmit}
            className="px-3.5 py-1.5 rounded-xl bg-[#5a7d4d] hover:bg-[#4d6d41] text-white font-black text-xs uppercase tracking-wider shadow-xs hover:shadow-sm active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 shrink-0" />
            <span>NỘP BÀI</span>
          </button>
        )}
      </div>
    </header>
  );
}

export default ExamHeader;
