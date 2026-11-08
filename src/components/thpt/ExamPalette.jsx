// src/components/thpt/ExamPalette.jsx
// Bottom bar: Thanh điều hướng 40 câu hỏi, hỗ trợ lọc nhanh câu chưa làm / gắn cờ và mở lưới tổng quan.
// Chuẩn phong cách HiVocab Exam Focus Mode: công thái học cao, tương phản rõ nét.

import React, { useState, useMemo } from 'react';
import {
  LayoutGrid,
  Flag,
  CheckCircle2,
  HelpCircle,
  X,
  Filter,
} from 'lucide-react';

export function ExamPalette({
  exam,
  answers = {},
  flags = {},
  currentQIndex = 0,
  isReviewMode = false,
  results,
  onJumpToQuestion,
}) {
  const [showGridModal, setShowGridModal] = useState(false);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'unanswered' | 'flagged'

  if (!exam) return null;

  const total = exam.total_questions || 40;
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = total - answeredCount;
  const flaggedCount = Object.keys(flags).filter((k) => flags[k]).length;

  // Filtered list of question numbers
  const questionNumbers = useMemo(() => {
    const list = [];
    for (let i = 1; i <= total; i++) {
      if (filterMode === 'unanswered' && answers[i]) continue;
      if (filterMode === 'flagged' && !flags[i]) continue;
      list.push(i);
    }
    return list;
  }, [total, filterMode, answers, flags]);

  const renderQuestionBtn = (i, isLarge = false) => {
    const isAnswered = Boolean(answers[i]);
    const isFlagged = Boolean(flags[i]);
    const isCurrent = i === currentQIndex + 1;

    let cls = isLarge
      ? 'h-11 w-full rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center relative transition-all cursor-pointer select-none '
      : 'h-9 min-w-[38px] sm:min-w-[40px] px-1 rounded-lg text-xs font-bold flex items-center justify-center relative transition-all cursor-pointer select-none shrink-0 ';
    let title = `Câu ${i}`;

    if (isReviewMode && results) {
      const detail = results.details?.[i];
      const isCorrect = Boolean(detail?.isCorrect);
      const userAns = detail?.userAns || '';
      const correctAns = detail?.correctAns || exam.questions?.[i - 1]?.correct_answer || '?';

      if (isCorrect) {
        cls += 'bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700 ';
        title = `Câu ${i}: Đúng (+0.25đ) - Bạn chọn ${userAns}`;
      } else if (userAns) {
        cls += 'bg-rose-600 text-white shadow-2xs hover:bg-rose-700 ';
        title = `Câu ${i}: Sai - Bạn chọn ${userAns} · Đúng là ${correctAns}`;
      } else {
        cls += 'bg-[#FAF9F6] text-[#8C827A] border-2 border-dashed border-[#EFE8D6] hover:bg-slate-100 ';
        title = `Câu ${i}: Chưa làm · Đáp án đúng là ${correctAns}`;
      }
    } else {
      if (isAnswered) {
        cls += 'bg-[#5a7d4d] text-white shadow-2xs hover:bg-[#4d6d41] ';
        title = `Câu ${i}: Đã trả lời (${answers[i]})`;
      } else {
        cls += 'bg-[#FAF9F6] text-[#6B5A4E] border border-[#EFE8D6] hover:border-[#382E2B]/40 hover:bg-white ';
        title = `Câu ${i}: Chưa trả lời`;
      }
    }

    if (isCurrent) {
      cls += 'ring-2 ring-[#382E2B] ring-offset-1 font-black shadow-xs ';
    }

    return (
      <button
        key={i}
        type="button"
        className={cls}
        title={title}
        onClick={() => {
          onJumpToQuestion(i);
          if (showGridModal) setShowGridModal(false);
        }}
      >
        <span>{i}</span>
        {isFlagged && !isReviewMode && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 border border-white" />
        )}
      </button>
    );
  };

  return (
    <>
      <div
        id="exam-bottom-bar"
        className="min-h-[52px] bg-[#FFFDF9] text-[#2D2422] border-t border-[#EFE8D6] px-2 sm:px-4 pb-[env(safe-area-inset-bottom,0px)] flex items-center justify-between gap-1.5 sm:gap-2 shrink-0 z-30 select-none shadow-xs w-full max-w-full overflow-hidden"
      >
        {/* ── Left: Lọc nhanh câu hỏi (Tất cả / Chưa làm / Cờ) ───────── */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-2 py-1.5 min-h-[36px] sm:min-h-0 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
              filterMode === 'all'
                ? 'bg-[#5a7d4d] text-white shadow-2xs'
                : 'text-[#6B5A4E] hover:bg-[#FAF5EB]'
            }`}
            title={`Hiện tất cả ${total} câu hỏi`}
          >
            <span>Tất cả</span>
          </button>

          {!isReviewMode && unansweredCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterMode(filterMode === 'unanswered' ? 'all' : 'unanswered')}
              className={`px-2 py-1.5 min-h-[36px] sm:min-h-0 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                filterMode === 'unanswered'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-amber-800 bg-amber-50 border border-amber-200/80 hover:bg-amber-100'
              }`}
              title={`Thu gọn chỉ hiện ${unansweredCount} câu chưa làm`}
            >
              <span>Chưa làm ({unansweredCount})</span>
            </button>
          )}

          {!isReviewMode && flaggedCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterMode(filterMode === 'flagged' ? 'all' : 'flagged')}
              className={`px-2 py-1.5 min-h-[36px] sm:min-h-0 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                filterMode === 'flagged'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-amber-800 bg-amber-50 border border-amber-200/80 hover:bg-amber-100'
              }`}
              title={`Lọc ${flaggedCount} câu đã gắn cờ`}
            >
              <Flag className="w-3 h-3 fill-current text-amber-600" />
              <span>Cờ ({flaggedCount})</span>
            </button>
          )}
        </div>

        {/* ── Center: Dãy nút 40 câu hỏi co giãn tối ưu ──────────────── */}
        <div
          id="exam-palette-container"
          className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-hide py-1 px-0.5"
        >
          {questionNumbers.map((i) => renderQuestionBtn(i, false))}
        </div>

        {/* ── Right: Mở lưới 40 câu tổng quan ────────────────────────── */}
        <div className="shrink-0 flex items-center">
          <button
            type="button"
            onClick={() => setShowGridModal(true)}
            className="p-2 sm:px-2.5 sm:py-1 min-w-[36px] min-h-[36px] rounded-lg border border-[#EFE8D6] bg-[#FAF5EB] hover:bg-white text-xs font-bold text-[#6B5A4E] hover:text-[#2D2422] flex items-center justify-center gap-1 transition-colors cursor-pointer"
            title="Mở bảng tổng quan 40 câu hỏi"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-[#5a7d4d]" />
            <span className="hidden sm:inline text-xs">Lưới</span>
          </button>
        </div>
      </div>

      {/* ── Modal Lưới 40 Câu Hỏi (Full Grid Drawer/Modal) ─────────────── */}
      {showGridModal && (
        <div className="fixed inset-0 z-[160] bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#FFFDF9] rounded-3xl border-2 border-[#382E2B] shadow-[5px_6px_0px_#382E2B] p-6 max-w-lg w-full select-none max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-[#EFE8D6] mb-4">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-[#5a7d4d]" />
                <h3 className="font-heading font-black text-base text-[#382E2B]">
                  Bảng tổng quan {total} câu hỏi
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGridModal(false)}
                className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-xs font-bold text-[#382E2B] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chú giải trạng thái */}
            <div className="flex items-center gap-4 text-xs font-bold text-[#6B5A4E] mb-4 flex-wrap bg-[#FAF5EB] p-3 rounded-2xl border border-[#EFE8D6]">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-[#5a7d4d]" />
                <span>Đã làm ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-[#FAF9F6] border border-[#EFE8D6]" />
                <span>Chưa làm ({unansweredCount})</span>
              </div>
              {flaggedCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-amber-100 border border-amber-300 flex items-center justify-center text-[10px] text-amber-700">
                    🚩
                  </span>
                  <span>Gắn cờ ({flaggedCount})</span>
                </div>
              )}
            </div>

            {/* Lưới câu hỏi: 8 cột x 5 hàng (40 câu) */}
            <div className="flex-1 overflow-y-auto grid grid-cols-5 sm:grid-cols-8 gap-2 py-2">
              {Array.from({ length: total }, (_, idx) => idx + 1).map((i) =>
                renderQuestionBtn(i, true)
              )}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t-2 border-dashed border-[#EFE8D6] flex justify-end">
              <button
                type="button"
                onClick={() => setShowGridModal(false)}
                className="px-5 py-2.5 min-h-[44px] rounded-2xl bg-[#5a7d4d] text-white text-xs font-black border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] cursor-pointer hover:bg-[#4d6d41] flex items-center justify-center"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ExamPalette;
