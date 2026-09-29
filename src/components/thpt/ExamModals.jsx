// src/components/thpt/ExamModals.jsx
// 3 modals: Confirm Submit, Results, Custom Time

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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 font-sans">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-rose-600 text-[22px]">send</span>
          </div>
          <div>
            <h3 className="font-black text-slate-800 text-base">Xác nhận nộp bài?</h3>
            <p className="text-xs text-slate-500">Bạn không thể chỉnh sửa sau khi nộp</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Đã hoàn thành:</span>
            <span className="font-bold text-slate-800">{answered} / {total} câu</span>
          </div>
          {unans > 0 && (
            <div className="flex justify-between">
              <span className="text-rose-600 font-semibold">Chưa trả lời:</span>
              <span className="font-bold text-rose-600">{unans} câu</span>
            </div>
          )}
        </div>

        {unans > 0 && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
            ⚠️ Còn {unans} câu chưa trả lời. Bạn có chắc chắn muốn nộp bài không?
          </p>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors font-semibold"
          >
            Tiếp tục làm
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-black hover:bg-rose-700 transition-colors"
          >
            Nộp bài
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
  const scoreColor = results.score >= 8 ? 'text-emerald-600' : results.score >= 5 ? 'text-blue-600' : 'text-rose-600';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 font-sans">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-blue-600 text-[32px]">military_tech</span>
          </div>
          <h3 className="font-black text-slate-800 text-lg">Kết quả bài thi</h3>
          <p className="text-xs text-slate-500 truncate">{results.title}</p>
        </div>

        {/* Score */}
        <div className="text-center">
          <div className={`text-6xl font-black tabular-nums ${scoreColor}`}>
            {results.score.toFixed(2)}
          </div>
          <div className="text-sm text-slate-500 mt-1">/ 10 điểm</div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
            <div className="text-2xl font-black text-emerald-700">{results.correct}</div>
            <div className="text-xs text-emerald-600 font-semibold mt-0.5">Câu đúng</div>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
            <div className="text-2xl font-black text-rose-700">{results.wrong}</div>
            <div className="text-xs text-rose-600 font-semibold mt-0.5">Câu sai</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
            <div className="text-2xl font-black text-amber-700">{results.unanswered}</div>
            <div className="text-xs text-amber-600 font-semibold mt-0.5">Chưa làm</div>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center">
            <div className="text-2xl font-black text-blue-700">{m}p {s}s</div>
            <div className="text-xs text-blue-600 font-semibold mt-0.5">Thời gian</div>
          </div>
        </div>

        {/* Percentage bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Tỷ lệ đúng</span>
            <span className="font-bold">{results.percentage}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${results.score >= 8 ? 'bg-emerald-500' : results.score >= 5 ? 'bg-blue-500' : 'bg-rose-500'}`}
              style={{ width: `${results.percentage}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onExit}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Thoát
          </button>
          <button
            onClick={onRetake}
            className="flex-1 py-2.5 rounded-xl border border-blue-200 text-blue-600 text-sm font-semibold hover:bg-blue-50 transition-colors"
          >
            Làm lại
          </button>
          <button
            onClick={onReview}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-black hover:bg-blue-700 transition-colors"
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 font-sans">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-blue-600 text-[22px]">timer</span>
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-slate-800 text-base">Chọn thời gian thi</h3>
            <p className="text-xs text-slate-500 truncate">{examTitle}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {timeOptions.map(mins => (
            <button
              key={mins}
              type="button"
              onClick={() => setSelectedMinutes(mins)}
              className={`py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all ${
                selectedMinutes === mins
                  ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                  : 'border-slate-200 text-slate-700 hover:border-blue-300'
              }`}
            >
              {mins === 0 ? 'Không giới hạn' : `${mins} phút`}
              {mins === 50 && selectedMinutes !== mins && (
                <span className="ml-1 text-[10px] text-slate-400">(chuẩn)</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors font-semibold"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={() => onStart(examId, selectedMinutes)}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-black hover:bg-blue-700 transition-colors"
          >
            Bắt đầu thi
          </button>
        </div>
      </div>
    </div>
  );
}
