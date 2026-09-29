// src/components/thpt/ExamQuestionsPanel.jsx
import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { escHtml } from '../../utils/thptPassageUtils';

// ---------------------------------------------------------------------------
// Helper – safe HTML escape for rendering text nodes
// ---------------------------------------------------------------------------

/** Render a question prompt string as plain text (no dangerouslySetInnerHTML). */
function QuestionText({ text, className }) {
  // escHtml is only needed for raw HTML contexts; here we render as text nodes.
  return <span className={className}>{text}</span>;
}

// ---------------------------------------------------------------------------
// Option letter label
// ---------------------------------------------------------------------------
const LETTERS = ['A', 'B', 'C', 'D'];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Animated radio circle shown in the option button. */
function OptCircle({ filled, isCorrect, isWrong }) {
  let inner = null;
  if (isCorrect) {
    // Check icon
    inner = (
      <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="1.5,6 4.5,9 10.5,3" />
      </svg>
    );
  } else if (isWrong) {
    // Close icon
    inner = (
      <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="2" y1="2" x2="10" y2="10" />
        <line x1="10" y1="2" x2="2" y2="10" />
      </svg>
    );
  } else if (filled) {
    inner = <span className="opt-circle-dot" />;
  }

  return <span className="opt-circle">{inner}</span>;
}

/** Single option button (A / B / C / D). */
function OptionButton({ letter, text, userAnswer, correctAnswer, isReviewMode, qNum, onSelectAnswer }) {
  const isSelected = userAnswer === letter;
  const isCorrect = correctAnswer === letter;
  const isWrong = isReviewMode && isSelected && !isCorrect;

  // Build class name
  let cls = 'opt-btn';
  if (isReviewMode) {
    if (isCorrect) cls += ' opt-correct';
    else if (isWrong) cls += ' opt-wrong';
    else cls += ' opacity-50';
  } else {
    if (isSelected) cls += ' opt-selected';
  }

  const handleClick = () => {
    if (!isReviewMode) onSelectAnswer(qNum, letter);
  };

  // Badge shown in review mode
  let badge = null;
  if (isReviewMode) {
    if (isCorrect && isSelected) {
      badge = (
        <span className="ml-auto shrink-0 text-[11px] font-semibold text-emerald-700 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded-full whitespace-nowrap">
          Bạn chọn (Đúng)
        </span>
      );
    } else if (isCorrect && !isSelected) {
      badge = (
        <span className="ml-auto shrink-0 text-[11px] font-semibold text-emerald-700 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded-full whitespace-nowrap">
          Đáp án chuẩn
        </span>
      );
    } else if (isWrong) {
      badge = (
        <span className="ml-auto shrink-0 text-[11px] font-semibold text-red-700 bg-red-100 border border-red-300 px-1.5 py-0.5 rounded-full whitespace-nowrap">
          Bạn đã chọn
        </span>
      );
    }
  }

  return (
    <button
      type="button"
      className={cls}
      disabled={isReviewMode}
      onClick={handleClick}
      aria-pressed={isSelected}
      aria-label={`Đáp án ${letter}`}
    >
      <OptCircle
        filled={isSelected}
        isCorrect={isReviewMode && isCorrect}
        isWrong={isReviewMode && isWrong}
      />
      <span className="opt-letter font-bold mr-1">{letter}.</span>
      <span className="opt-text flex-1 text-left">{text}</span>
      {badge}
    </button>
  );
}

/** Review banner shown at the top of each question card in review mode. */
function ReviewBanner({ qNum, userAnswer, correctAnswer }) {
  if (!userAnswer) {
    return (
      <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 text-sm font-medium">
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
        Câu {qNum}: Chưa trả lời — Đáp án: <strong>{correctAnswer}</strong>
      </div>
    );
  }

  const isCorrect = userAnswer === correctAnswer;
  if (isCorrect) {
    return (
      <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-medium">
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
        </svg>
        Câu {qNum}: Trả lời đúng!
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-300 text-red-800 text-sm font-medium">
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
      </svg>
      Câu {qNum}: Sai — Đáp án đúng là <strong>{correctAnswer}</strong>
    </div>
  );
}

/**
 * Format explanation text into React elements.
 *
 * The explanation JSON uses \n both for:
 *   - Real paragraph/item breaks (before A. B. C. D. •  Giải thích: blank line)
 *   - Soft word-wrap (line continues same sentence, ends mid-word or mid-sentence)
 *
 * Strategy:
 *   1. Split by \n
 *   2. Detect "paragraph starters": blank line, •, A./B./C./D. at start, "Giải thích", quotes "
 *   3. All other continuation lines are appended with a space to the previous paragraph
 *   4. Render each paragraph with ĐÚNG/SAI highlights
 */
function formatExplanation(text) {
  if (!text) return null;

  const rawLines = text.split('\n');

  // ── Step 1: group into logical paragraphs ──────────────────────────────
  const paragraphs = []; // { type: 'blank'|'bullet'|'option'|'text', content: string }
  let current = null;

  const isOptionStart = (s) => /^[A-D]\.\s/.test(s);
  const isBulletStart = (s) => s.startsWith('•');
  const isGiaiThich  = (s) => /^Gi[aả]i th[íi]ch/i.test(s) || /^Tạm dịch/i.test(s);
  const isQuoteStart = (s) => s.startsWith('"') || s.startsWith('"') || s.startsWith('"');

  const pushCurrent = () => {
    if (current) { paragraphs.push(current); current = null; }
  };

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();

    // Blank line → hard break
    if (trimmed === '') {
      pushCurrent();
      paragraphs.push({ type: 'blank', content: '' });
      continue;
    }

    // Bullet item
    if (isBulletStart(trimmed)) {
      pushCurrent();
      current = { type: 'bullet', content: trimmed.slice(1).trim() };
      continue;
    }

    // Option A/B/C/D line
    if (isOptionStart(trimmed)) {
      pushCurrent();
      current = { type: 'option', content: trimmed };
      continue;
    }

    // "Giải thích:" / "Tạm dịch:" section header
    if (isGiaiThich(trimmed)) {
      pushCurrent();
      current = { type: 'header', content: trimmed };
      continue;
    }

    // Quote line (passage sentence)
    if (isQuoteStart(trimmed)) {
      pushCurrent();
      current = { type: 'quote', content: trimmed };
      continue;
    }

    // Continuation line — append to current paragraph with a space
    if (current) {
      current.content = current.content + ' ' + trimmed;
    } else {
      current = { type: 'text', content: trimmed };
    }
  }
  pushCurrent();

  // ── Step 2: render ──────────────────────────────────────────────────────
  const elements = [];
  let key = 0;

  for (const para of paragraphs) {
    if (para.type === 'blank') {
      elements.push(<div key={key++} className="h-1" />);
      continue;
    }

    if (para.type === 'bullet') {
      elements.push(
        <div key={key++} className="flex items-start gap-2 pl-1 py-0.5">
          <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
          <span className="flex-1 leading-relaxed">{highlightKeywords(para.content)}</span>
        </div>
      );
      continue;
    }

    if (para.type === 'option') {
      elements.push(
        <p key={key++} className="leading-relaxed pl-2 border-l-2 border-blue-200 ml-1">
          {highlightKeywords(para.content)}
        </p>
      );
      continue;
    }

    if (para.type === 'header') {
      elements.push(
        <p key={key++} className="font-semibold text-blue-700 mt-2 leading-relaxed">
          {highlightKeywords(para.content)}
        </p>
      );
      continue;
    }

    if (para.type === 'quote') {
      elements.push(
        <p key={key++} className="leading-relaxed italic text-slate-600 bg-slate-50 border-l-4 border-blue-300 pl-3 py-1 rounded-r">
          {para.content}
        </p>
      );
      continue;
    }

    // Default text
    elements.push(
      <p key={key++} className="leading-relaxed">
        {highlightKeywords(para.content)}
      </p>
    );
  }

  return elements;
}

/** Split a line and wrap ĐÚNG/SAI tokens with color badges. */
function highlightKeywords(text) {
  // Split on ĐÚNG or SAI surrounded by word boundaries (dash, colon, space)
  const parts = text.split(/(ĐÚNG|SAI)/g);
  return parts.map((part, i) => {
    if (part === 'ĐÚNG') {
      return (
        <strong key={i} className="text-emerald-700 font-black">ĐÚNG</strong>
      );
    }
    if (part === 'SAI') {
      return (
        <strong key={i} className="text-rose-600 font-black">SAI</strong>
      );
    }
    return part;
  });
}

/** Explanation/solution box shown below the options in review mode. */
function SolutionBox({ explanation }) {
  if (!explanation) return null;
  return (
    <div className="mt-3 p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-sm space-y-1">
      <p className="font-semibold text-blue-700 mb-2 flex items-center gap-1.5">
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
        </svg>
        Giải thích
      </p>
      <div className="space-y-1">
        {formatExplanation(explanation)}
      </div>
    </div>
  );
}

/** Prompt shown for arrangement question type. */
function ArrangementPrompt({ qNum, q }) {
  // Detect sub-labels (a, b, c, ...) from the question text if present
  const raw = q.arrangement_sentences || q.raw_sentences || '';
  const letters = [];
  const regex = /(?:^|\n)\s*([a-f])\./gi;
  let m;
  while ((m = regex.exec(raw)) !== null) letters.push(m[1].toLowerCase());
  const labelStr = letters.length > 0 ? `(${letters.join(', ')})` : '';

  return (
    <p className="text-sm italic text-slate-500 mt-1 mb-2">
      Xem câu {labelStr} ở cột bên trái.
    </p>
  );
}

// ---------------------------------------------------------------------------
// Question Card
// ---------------------------------------------------------------------------

function QuestionCard({
  q,
  qIndex,
  currentQIndex,
  answers,
  flags,
  isReviewMode,
  results,
  fontSizeClass,
  onSelectAnswer,
  onToggleFlag,
  onJumpToQuestion,
  onReportAnswer,
}) {
  const qNum = q.number;
  const isCurrent = qIndex === currentQIndex;
  const userAnswer = answers?.[qNum] ?? null;
  const isFlagged = !!(flags?.[qNum]);

  // Correct answer from results (post-submit) or from question itself
  const correctAnswer = useMemo(() => {
    if (results?.answers) return results.answers[qNum] ?? q.correct_answer ?? null;
    return q.correct_answer ?? null;
  }, [results, qNum, q.correct_answer]);

  const isArrangement = q.type === 'arrangement';

  // Card ring highlight for current question
  const cardCls = [
    'question-card mb-4 p-4 rounded-xl border bg-white shadow-sm transition-all duration-200',
    isCurrent ? 'ring-2 ring-blue-500 border-blue-300 shadow-md' : 'border-slate-200',
  ].join(' ');

  return (
    <div id={`q-card-${qNum}`} className={cardCls}>
      {/* ── Header row ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-2 mb-2">
        {/* Question number + prompt */}
        <div className="flex-1 min-w-0">
          <button
            type="button"
            className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-full px-2.5 py-0.5 mr-2 transition-colors cursor-pointer"
            onClick={() => onJumpToQuestion(qNum)}
            title="Nhảy đến câu này"
          >
            Câu {qNum}
          </button>
          <span className={`font-medium text-slate-800 leading-snug ${fontSizeClass ?? ''}`}>
            {q.prompt || q.question || ''}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0 mt-0.5">
          {/* Flag button */}
          <button
            type="button"
            onClick={() => onToggleFlag(qNum)}
            title={isFlagged ? 'Bỏ đánh dấu' : 'Đánh dấu câu này'}
            className={[
              'p-1.5 rounded-lg border transition-colors',
              isFlagged
                ? 'text-amber-600 bg-amber-50 border-amber-300 hover:bg-amber-100'
                : 'text-slate-400 bg-slate-50 border-slate-200 hover:text-amber-500 hover:bg-amber-50 hover:border-amber-300',
            ].join(' ')}
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d={
                  isFlagged
                    ? 'M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm3.293 1.293A1 1 0 017 4h9a1 1 0 01.707 1.707L13.414 9l3.293 3.293A1 1 0 0116 14H7a1 1 0 01-1-1V5a1 1 0 01.293-.707z'
                    : 'M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm3.293 1.293A1 1 0 017 4h9a1 1 0 01.707 1.707L13.414 9l3.293 3.293A1 1 0 0116 14H7a1 1 0 01-1-1V5a1 1 0 01.293-.707z'
                }
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Report button */}
          <button
            type="button"
            onClick={() => onReportAnswer(qNum, q)}
            title="Báo lỗi câu hỏi"
            className="p-1.5 rounded-lg border text-slate-400 bg-slate-50 border-slate-200 hover:text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Arrangement note ────────────────────────────────────────────── */}
      {isArrangement && <ArrangementPrompt qNum={qNum} q={q} />}

      {/* ── Review banner ───────────────────────────────────────────────── */}
      {isReviewMode && (
        <ReviewBanner
          qNum={qNum}
          userAnswer={userAnswer}
          correctAnswer={correctAnswer}
        />
      )}

      {/* ── Options A / B / C / D ───────────────────────────────────────── */}
      <div className={`flex flex-col gap-1.5 ${fontSizeClass ?? ''}`}>
        {LETTERS.map((letter) => {
          const optKey = `option_${letter.toLowerCase()}`;
          const optText =
            q[optKey] ??
            q.options?.[letter] ??
            q.choices?.[letter] ??
            '';
          return (
            <OptionButton
              key={letter}
              letter={letter}
              text={optText}
              userAnswer={userAnswer}
              correctAnswer={isReviewMode ? correctAnswer : null}
              isReviewMode={isReviewMode}
              qNum={qNum}
              onSelectAnswer={onSelectAnswer}
            />
          );
        })}
      </div>

      {/* ── Solution box ────────────────────────────────────────────────── */}
      {isReviewMode && <SolutionBox explanation={q.explanation} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function ExamQuestionsPanel({
  exam,
  answers,
  flags,
  currentQIndex,
  isReviewMode,
  results,
  fontSizeClass,
  questionsPaneRef,
  onSelectAnswer,
  onToggleFlag,
  onJumpToQuestion,
  onReportAnswer,
}) {
  // Guard
  if (!exam) return null;

  const questions = exam.questions ?? [];

  // ── Scroll current question into view whenever currentQIndex changes ──
  useEffect(() => {
    if (currentQIndex == null || currentQIndex < 0 || currentQIndex >= questions.length) return;
    const q = questions[currentQIndex];
    if (!q) return;
    const qNum = q.number;
    const el = document.getElementById(`q-card-${qNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentQIndex, questions]);

  return (
    <div
      ref={questionsPaneRef}
      className="questions-panel h-full overflow-y-auto px-3 py-4"
    >
      {questions.map((q, idx) => (
        <QuestionCard
          key={q.number ?? idx}
          q={q}
          qIndex={idx}
          currentQIndex={currentQIndex}
          answers={answers}
          flags={flags}
          isReviewMode={isReviewMode}
          results={results}
          fontSizeClass={fontSizeClass}
          onSelectAnswer={onSelectAnswer}
          onToggleFlag={onToggleFlag}
          onJumpToQuestion={onJumpToQuestion}
          onReportAnswer={onReportAnswer}
        />
      ))}
    </div>
  );
}

export default ExamQuestionsPanel;
