// src/components/thpt/ExamCard.jsx
// Card hiển thị một đề thi trong danh sách

import React from 'react';

const LEVEL_COLORS = {
  easy:   { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Cơ bản' },
  medium: { bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-200',   label: 'Trung bình' },
  hard:   { bg: 'bg-rose-100',    text: 'text-rose-700',    border: 'border-rose-200',    label: 'Nâng cao' },
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (_) { return dateStr; }
}

export function ExamCard({ exam, bestScore, onStart, onCustomTime }) {
  const level = LEVEL_COLORS[exam.difficulty] || LEVEL_COLORS.medium;
  const hasScore = bestScore && typeof bestScore.score === 'number';
  const scoreColor = hasScore
    ? (bestScore.score >= 8 ? 'text-emerald-600' : bestScore.score >= 5 ? 'text-blue-600' : 'text-rose-600')
    : '';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all p-5 space-y-4 flex flex-col font-sans">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-sm text-slate-800 leading-snug line-clamp-2">
            {exam.title}
          </h3>
          {exam.year && (
            <p className="text-xs text-slate-500 mt-1">Năm {exam.year}</p>
          )}
        </div>
        {hasScore && (
          <div className={`shrink-0 text-right ${scoreColor}`}>
            <div className="text-xl font-black tabular-nums">{bestScore.score.toFixed(2)}</div>
            <div className="text-[10px] font-semibold opacity-70">cao nhất</div>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${level.bg} ${level.text} ${level.border}`}>
          {level.label}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 font-medium">
          <span className="material-symbols-outlined text-[13px] text-blue-500">quiz</span>
          {exam.total_questions || 40} câu
        </span>
        {exam.time_limit && (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 font-medium">
            <span className="material-symbols-outlined text-[13px] text-amber-500">timer</span>
            {exam.time_limit} phút
          </span>
        )}
        {hasScore && (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
            <span className="material-symbols-outlined text-[13px] text-slate-400">check_circle</span>
            {bestScore.correct}/{exam.total_questions || 40} đúng
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-auto pt-1">
        <button
          type="button"
          onClick={() => onStart(exam.id, exam.time_limit || 50)}
          className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-sm"
        >
          <span className="material-symbols-outlined text-[15px]">play_arrow</span>
          Vào thi
        </button>
        <button
          type="button"
          onClick={() => onCustomTime(exam.id, exam.title)}
          className="py-2 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-blue-300 text-xs font-semibold transition-colors flex items-center gap-1"
          title="Chọn thời gian tùy chỉnh"
        >
          <span className="material-symbols-outlined text-[15px]">timer</span>
        </button>
      </div>
    </div>
  );
}

export default ExamCard;
