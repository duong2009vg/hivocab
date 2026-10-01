// src/components/thpt/ExamCard.jsx
// Card hiển thị một đề thi trong danh sách - Chuẩn theme HiVocab Material 3 / Liquid Glass

import React from 'react';

const LEVEL_COLORS = {
  easy:   { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-500/25', label: 'Cơ bản' },
  medium: { bg: 'bg-amber-500/10',   text: 'text-amber-700 dark:text-amber-400',   border: 'border-amber-500/25',   label: 'Trung bình' },
  hard:   { bg: 'bg-rose-500/10',    text: 'text-rose-700 dark:text-rose-400',    border: 'border-rose-500/25',    label: 'Nâng cao' },
};

export function ExamCard({ exam, bestScore, onStart, onCustomTime }) {
  const level = LEVEL_COLORS[exam.difficulty] || LEVEL_COLORS.medium;
  const hasScore = bestScore && typeof bestScore.score === 'number';
  const scoreColor = hasScore
    ? (bestScore.score >= 8 ? 'text-emerald-600 dark:text-emerald-400' : bestScore.score >= 5 ? 'text-primary' : 'text-rose-600 dark:text-rose-400')
    : '';

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-2xs hover:shadow-md hover:border-primary/40 transition-all p-5 sm:p-6 space-y-4 flex flex-col justify-between group">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-base text-on-surface leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {exam.title}
            </h3>
            {exam.year && (
              <p className="text-xs font-medium text-on-surface-variant mt-1">Đề thi năm {exam.year}</p>
            )}
          </div>
          {hasScore && (
            <div className={`shrink-0 text-right ${scoreColor} bg-surface-container px-2.5 py-1 rounded-xl border border-outline-variant/15`}>
              <div className="text-lg font-black tabular-nums leading-tight">{bestScore.score.toFixed(2)}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">Điểm cao nhất</div>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-2 flex-wrap mt-3.5">
          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border ${level.bg} ${level.text} ${level.border}`}>
            {level.label}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant font-medium">
            <span className="material-symbols-outlined text-[15px] text-primary">quiz</span>
            {exam.total_questions || 40} câu
          </span>
          {exam.time_limit && (
            <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant font-medium">
              <span className="material-symbols-outlined text-[15px] text-amber-500">timer</span>
              {exam.time_limit} phút
            </span>
          )}
          {hasScore && (
            <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant font-medium">
              <span className="material-symbols-outlined text-[15px] text-emerald-500">check_circle</span>
              {bestScore.correct}/{exam.total_questions || 40} đúng
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/10">
        <button
          type="button"
          onClick={() => onStart(exam.id, exam.time_limit || 50)}
          className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[16px]">play_arrow</span>
          <span>Vào thi</span>
        </button>
        <button
          type="button"
          onClick={() => onCustomTime(exam.id, exam.title)}
          className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface-variant hover:text-primary hover:border-primary/40 hover:bg-surface-container transition-all"
          title="Chọn thời gian làm bài tùy chỉnh"
        >
          <span className="material-symbols-outlined text-[18px]">timer</span>
        </button>
      </div>
    </div>
  );
}

export default ExamCard;
