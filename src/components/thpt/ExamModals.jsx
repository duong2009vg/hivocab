// src/components/thpt/ExamModals.jsx
// 3 modals: Confirm Submit, Results, Custom Time — Chuẩn theme HiVocab Pure React

import React, { useState } from 'react';

// ============================================
// Modal xác nhận nộp bài
// ============================================
export function ExamConfirmModal({ exam, answers, onConfirm, onCancel }) {
  if (!exam) return null;
  const total = exam.total_questions;
  const answered = Object.keys(answers).length;
  const unans = total - answered;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-3xl border border-outline-variant/20 shadow-2xl w-full max-w-sm p-6 space-y-4 font-sans animate-scale-up">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">send</span>
          </div>
          <div>
            <h3 className="font-bold text-on-surface text-base">Xác nhận nộp bài?</h3>
            <p className="text-xs text-on-surface-variant">Bạn không thể chỉnh sửa sau khi nộp</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Đã hoàn thành:</span>
            <span className="font-bold text-on-surface">{answered} / {total} câu</span>
          </div>
          {unans > 0 && (
            <div className="flex justify-between">
              <span className="text-rose-600 font-semibold">Chưa trả lời:</span>
              <span className="font-bold text-rose-600">{unans} câu</span>
            </div>
          )}
        </div>

        {unans > 0 && (
          <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5 rounded-xl">
            ⚠️ Còn {unans} câu chưa trả lời. Bạn có chắc chắn muốn nộp bài không?
          </p>
        )}

        <div className="flex gap-2.5 justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container border border-outline-variant/30 transition-all font-semibold"
          >
            Tiếp tục làm
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs sm:text-sm font-bold hover:bg-rose-700 transition-all shadow-xs active:scale-95"
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
  const scoreColor = results.score >= 8 ? 'text-emerald-600 dark:text-emerald-400' : results.score >= 5 ? 'text-primary' : 'text-rose-600 dark:text-rose-400';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-3xl border border-outline-variant/20 shadow-2xl w-full max-w-md p-6 sm:p-7 space-y-5 font-sans animate-scale-up">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-2 shadow-2xs">
            <span className="material-symbols-outlined text-primary text-[32px]">military_tech</span>
          </div>
          <h3 className="font-bold text-on-surface text-lg sm:text-xl">Kết quả bài thi THPT</h3>
          <p className="text-xs text-on-surface-variant truncate max-w-xs mx-auto">{results.title}</p>
        </div>

        {/* Score */}
        <div className="text-center bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/15">
          <div className={`text-5xl sm:text-6xl font-black tabular-nums tracking-tight ${scoreColor}`}>
            {results.score.toFixed(2)}
          </div>
          <div className="text-xs font-bold uppercase tracking-wider text-outline mt-1">/ 10.00 điểm</div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{results.correct}</div>
            <div className="text-xs text-emerald-600 dark:text-emerald-300 font-semibold mt-0.5">Câu đúng</div>
          </div>
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
            <div className="text-2xl font-black text-rose-700 dark:text-rose-400">{results.wrong}</div>
            <div className="text-xs text-rose-600 dark:text-rose-300 font-semibold mt-0.5">Câu sai</div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
            <div className="text-2xl font-black text-amber-700 dark:text-amber-400">{results.unanswered}</div>
            <div className="text-xs text-amber-600 dark:text-amber-300 font-semibold mt-0.5">Chưa làm</div>
          </div>
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-center">
            <div className="text-2xl font-black text-primary">{m}p {s}s</div>
            <div className="text-xs text-primary font-semibold mt-0.5">Thời gian làm</div>
          </div>
        </div>

        {/* Percentage bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-on-surface-variant">
            <span>Tỷ lệ chính xác</span>
            <span className="font-bold text-on-surface">{results.percentage}%</span>
          </div>
          <div className="h-2.5 bg-surface-container rounded-full overflow-hidden p-0.5 border border-outline-variant/10">
            <div
              className={`h-full rounded-full transition-all duration-500 ${results.score >= 8 ? 'bg-emerald-500' : results.score >= 5 ? 'bg-primary' : 'bg-rose-500'}`}
              style={{ width: `${results.percentage}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onExit}
            className="flex-1 py-2.5 rounded-xl border border-outline-variant/30 text-on-surface-variant hover:text-on-surface text-xs sm:text-sm font-semibold hover:bg-surface-container transition-colors"
          >
            Thoát
          </button>
          <button
            type="button"
            onClick={onRetake}
            className="flex-1 py-2.5 rounded-xl border border-primary/30 text-primary text-xs sm:text-sm font-bold hover:bg-primary/5 transition-colors"
          >
            Làm lại
          </button>
          <button
            type="button"
            onClick={onReview}
            className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary text-xs sm:text-sm font-bold hover:bg-primary/90 transition-all shadow-xs active:scale-95"
          >
            Xem đáp án
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Modal tùy chỉnh thời gian thi
// ============================================
export function ExamCustomTimeModal({ examId, examTitle, onStart, onCancel }) {
  const [selectedMinutes, setSelectedMinutes] = useState(50);
  const timeOptions = [20, 30, 40, 50, 60, 90, 0]; // 0 = không giới hạn

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-3xl border border-outline-variant/20 shadow-2xl w-full max-w-sm p-6 space-y-5 font-sans animate-scale-up">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">timer</span>
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-on-surface text-base sm:text-lg">Chọn thời gian thi</h3>
            <p className="text-xs text-on-surface-variant truncate">{examTitle}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {timeOptions.map(mins => (
            <button
              key={mins}
              type="button"
              onClick={() => setSelectedMinutes(mins)}
              className={`py-3 px-3.5 rounded-2xl border-2 text-xs sm:text-sm font-bold transition-all ${
                selectedMinutes === mins
                  ? 'border-primary bg-primary text-on-primary shadow-xs'
                  : 'border-outline-variant/20 bg-surface-container-lowest text-on-surface hover:border-primary/40'
              }`}
            >
              {mins === 0 ? 'Không giới hạn' : `${mins} phút`}
              {mins === 50 && selectedMinutes !== mins && (
                <span className="block text-[10px] text-primary font-normal mt-0.5">(chuẩn Bộ GD)</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-2.5 justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container border border-outline-variant/30 transition-colors font-semibold"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={() => onStart(examId, selectedMinutes)}
            className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs sm:text-sm font-bold hover:bg-primary/90 transition-all shadow-xs active:scale-95"
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
