// src/components/thpt/ExamPalette.jsx
// Bottom bar — 40 ô số câu hỏi với màu sắc theo trạng thái

import React from 'react';

export function ExamPalette({ exam, answers, flags, currentQIndex, isReviewMode, results, onJumpToQuestion }) {
  if (!exam) return null;

  const total = exam.total_questions;
  const buttons = [];

  for (let i = 1; i <= total; i++) {
    const isAnswered = !!answers[i];
    const isFlagged = !!flags[i];
    const isCurrent = (i === currentQIndex + 1);

    let cls = 'thpt-pal-btn';
    let title = `Câu ${i}`;

    if (isReviewMode && results) {
      const detail = results.details[i];
      const isCorrect = !!detail?.isCorrect;
      const userAns = detail?.userAns || '';
      const correctAns = detail?.correctAns || exam.questions[i - 1]?.correct_answer || '?';

      if (isCorrect) {
        cls += ' correct';
        title = `Câu ${i}: Đúng (+0.25đ) - Chọn ${userAns}`;
      } else if (userAns) {
        cls += ' wrong';
        title = `Câu ${i}: Sai (Bạn chọn ${userAns} · Đ/a ${correctAns})`;
      } else {
        cls += ' unanswered';
        title = `Câu ${i}: Chưa làm (Đáp án đúng: ${correctAns})`;
      }
    } else {
      if (isAnswered) {
        cls += ' answered';
        title = `Câu ${i}: Đã làm (${answers[i]})`;
      } else {
        title = `Câu ${i}: Chưa làm`;
      }
    }

    if (isCurrent) cls += ' current';

    buttons.push(
      <button
        key={i}
        type="button"
        className={cls}
        title={title}
        onClick={() => onJumpToQuestion(i)}
      >
        {i}
        {isFlagged && !isReviewMode && (
          <span className="thpt-flag-dot" />
        )}
      </button>
    );
  }

  return (
    <div id="exam-palette-container" className="flex-1 flex items-center justify-between gap-1 overflow-x-auto scrollbar-hide py-0.5">
      {buttons}
    </div>
  );
}

export default ExamPalette;
