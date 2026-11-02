// src/components/thpt/ExamModals.jsx
// 3 modals: Confirm Submit, Results, Custom Time — Chuẩn theme HiVocab Pure React

import React, { useState } from 'react';
import {
  Send,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

// ============================================
// Modal xác nhận nộp bài
// ============================================
export function ExamConfirmModal({ exam, answers = {}, onConfirm, onCancel }) {
  if (!exam) return null;
  const total = exam.total_questions || 40;
  const answered = Object.keys(answers).length;
  const unans = total - answered;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-[#FFFDF9] rounded-3xl border-2 border-[#382E2B] shadow-[5px_6px_0px_#382E2B] w-full max-w-sm p-6 sm:p-7 space-y-4 font-sans select-none">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#5a7d4d]/10 text-[#5a7d4d] border-2 border-[#5a7d4d]/30 flex items-center justify-center shrink-0">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-black text-[#382E2B] text-base sm:text-lg">Xác nhận nộp bài?</h3>
            <p className="text-xs font-semibold text-[#766C5F]">Bạn không thể chỉnh sửa bài thi sau khi nộp</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAF5EB] border border-[#EFE8D6] space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-[#6B5A4E]">Đã hoàn thành:</span>
            <span className="font-black text-[#5a7d4d]">{answered} / {total} câu</span>
          </div>
          {unans > 0 && (
            <div className="flex justify-between items-center">
              <span className="font-semibold text-rose-600">Chưa trả lời:</span>
              <span className="font-black text-rose-600">{unans} câu</span>
            </div>
          )}
        </div>

        {unans > 0 && (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3.5 py-2.5 rounded-xl font-medium leading-relaxed">
            ⚠️ Còn <strong>{unans} câu</strong> bạn chưa chọn đáp án. Bạn có chắc chắn muốn nộp bài ngay bây giờ?
          </p>
        )}

        <div className="flex gap-2.5 justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm text-[#766C5F] hover:text-[#382E2B] hover:bg-[#FAF5EB] border border-[#EFE8D6] transition-all font-bold cursor-pointer"
          >
            Tiếp tục làm
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl bg-[#5a7d4d] hover:bg-[#4d6d41] text-white text-xs sm:text-sm font-black transition-all border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] active:translate-y-0.5 cursor-pointer"
          >
            Nộp bài ngay
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Modal kết quả
// ============================================
export function ExamResultsModal({ results, onReview, onRetake, onExit }) {
  if (!results) return null;

  const m = Math.floor(results.timeSpentSeconds / 60);
  const s = results.timeSpentSeconds % 60;
  const scoreColor =
    results.score >= 8
      ? 'text-[#5a7d4d]'
      : results.score >= 5
      ? 'text-[#D36135]'
      : 'text-rose-600';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-[#FFFDF9] rounded-3xl border-2 border-[#382E2B] shadow-[6px_8px_0px_#382E2B] w-full max-w-md p-6 sm:p-7 space-y-5 font-sans select-none">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#5a7d4d]/10 border-2 border-[#5a7d4d]/30 text-[#5a7d4d] flex items-center justify-center mb-2 shadow-2xs">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="font-heading font-black text-[#382E2B] text-lg sm:text-xl">Kết quả bài thi THPT</h3>
          <p className="text-xs font-semibold text-[#766C5F] truncate max-w-xs mx-auto">{results.title}</p>
        </div>

        {/* Score */}
        <div className="text-center bg-[#FAF5EB] p-4 rounded-2xl border border-[#EFE8D6]">
          <div className={`text-5xl sm:text-6xl font-black tabular-nums tracking-tight font-heading ${scoreColor}`}>
            {results.score.toFixed(2)}
          </div>
          <div className="text-xs font-black uppercase tracking-wider text-[#766C5F] mt-1">/ 10.00 điểm</div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
            <div className="text-2xl font-black text-emerald-800 tabular-nums">{results.correct}</div>
            <div className="text-xs text-emerald-700 font-bold mt-0.5 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Câu đúng</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-center">
            <div className="text-2xl font-black text-rose-800 tabular-nums">{results.wrong}</div>
            <div className="text-xs text-rose-700 font-bold mt-0.5 flex items-center justify-center gap-1">
              <XCircle className="w-3.5 h-3.5" />
              <span>Câu sai</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-center">
            <div className="text-2xl font-black text-amber-800 tabular-nums">{results.unanswered}</div>
            <div className="text-xs text-amber-700 font-bold mt-0.5 flex items-center justify-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Chưa làm</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-[#5a7d4d]/10 border border-[#5a7d4d]/20 text-center">
            <div className="text-2xl font-black text-[#486b3c] tabular-nums">{m}p {s}s</div>
            <div className="text-xs text-[#486b3c] font-bold mt-0.5 flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Thời gian làm</span>
            </div>
          </div>
        </div>

        {/* Percentage bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-[#6B5A4E]">
            <span>Tỷ lệ chính xác</span>
            <span className="font-black text-[#2D2422]">{results.percentage}%</span>
          </div>
          <div className="h-3 bg-[#FAF5EB] rounded-full overflow-hidden p-0.5 border border-[#EFE8D6]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                results.score >= 8
                  ? 'bg-[#5a7d4d]'
                  : results.score >= 5
                  ? 'bg-[#D36135]'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${results.percentage}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onExit}
            className="flex-1 py-2.5 rounded-xl border border-[#EFE8D6] text-[#766C5F] hover:text-[#382E2B] text-xs sm:text-sm font-bold hover:bg-[#FAF5EB] transition-colors cursor-pointer"
          >
            Thoát
          </button>
          <button
            type="button"
            onClick={onRetake}
            className="flex-1 py-2.5 rounded-xl border border-[#5a7d4d]/30 text-[#486b3c] hover:bg-[#5a7d4d]/10 text-xs sm:text-sm font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Làm lại</span>
          </button>
          <button
            type="button"
            onClick={onReview}
            className="flex-1 py-2.5 rounded-xl bg-[#5a7d4d] hover:bg-[#4d6d41] text-white text-xs sm:text-sm font-black transition-all border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Xem đáp án</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Modal tùy chỉnh thời gian thi - Cozy Crayon
// ============================================
export function ExamCustomTimeModal({ examId, examTitle, onStart, onCancel }) {
  const [selectedMinutes, setSelectedMinutes] = useState(50);
  const timeOptions = [20, 30, 40, 50, 60, 90, 0]; // 0 = không giới hạn

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-[#FFFDF9] rounded-3xl border-[3px] border-[#382E2B] shadow-[6px_8px_0px_#382E2B] w-full max-w-sm p-6 sm:p-7 space-y-5 font-sans select-none">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF3D6] text-[#D36135] border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] flex items-center justify-center text-xl shrink-0">
            <Clock className="w-6 h-6 text-[#D36135]" />
          </div>
          <div className="min-w-0">
            <h3 className="font-heading font-black text-[#382E2B] text-lg">Chọn thời gian làm bài</h3>
            <p className="text-xs font-semibold text-[#786F66] truncate">{examTitle}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {timeOptions.map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => setSelectedMinutes(mins)}
              className={`py-3 px-3.5 rounded-2xl border-2 text-xs sm:text-sm font-black transition-all cursor-pointer ${
                selectedMinutes === mins
                  ? 'border-[#382E2B] bg-[#5a7d4d] text-white shadow-[2px_3px_0px_#382E2B]'
                  : 'border-[#382E2B]/30 bg-white text-[#382E2B] hover:border-[#382E2B] hover:bg-[#FAF5EB]'
              }`}
            >
              {mins === 0 ? 'Không giới hạn' : `${mins} phút`}
              {mins === 50 && (
                <span
                  className={`block text-[10px] font-bold mt-0.5 ${
                    selectedMinutes === mins ? 'text-amber-200' : 'text-[#D36135]'
                  }`}
                >
                  (chuẩn Bộ GD)
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-2.5 justify-end pt-2 border-t-2 border-dashed border-[#EFE8D6]">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-2xl text-xs sm:text-sm text-[#786F66] hover:text-[#382E2B] hover:bg-[#FAF5EB] border-2 border-transparent transition-colors font-bold cursor-pointer"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={() => onStart(examId, selectedMinutes)}
            className="px-5 py-2.5 rounded-2xl bg-[#D36135] text-white text-xs sm:text-sm font-black hover:bg-[#c2542a] transition-all border-2 border-[#382E2B] shadow-[2px_3px_0px_#382E2B] active:translate-y-0.5 cursor-pointer"
          >
            Bắt đầu thi
          </button>
        </div>
      </div>
    </div>
  );
}

export default {
  ExamConfirmModal,
  ExamResultsModal,
  ExamCustomTimeModal,
};
