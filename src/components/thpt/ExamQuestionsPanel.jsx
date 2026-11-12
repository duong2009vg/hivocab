// src/components/thpt/ExamQuestionsPanel.jsx
// Cột bên phải phòng thi THPT: danh sách 40 câu hỏi, lựa chọn A/B/C/D, gắn cờ và giải thích chi tiết.
// Chuẩn phong cách HiVocab Exam Focus Mode: tối giản, công thái học, không gây mỏi mắt.

import React, { useEffect, useMemo } from 'react';
import {
  Flag,
  AlertCircle,
  Check,
  X,
  Lightbulb,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { formatPromptHtml } from '../../utils/thptPassageUtils';

const LETTERS = ['A', 'B', 'C', 'D'];

// ---------------------------------------------------------------------------
// Option Button
// ---------------------------------------------------------------------------

function OptionButton({
  letter,
  text,
  userAnswer,
  correctAnswer,
  isReviewMode,
  qNum,
  fontSizeClass,
  onSelectAnswer,
}) {
  const isSelected = userAnswer === letter;
  const isCorrect = correctAnswer === letter;
  const isWrong = isReviewMode && isSelected && !isCorrect;

  // Build styling
  let containerCls =
    'w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex items-start gap-3 select-none cursor-pointer';
  let circleCls =
    'w-6 h-6 rounded-full font-bold flex items-center justify-center shrink-0 text-xs transition-colors mt-0.5';

  if (isReviewMode) {
    if (isCorrect && isSelected) {
      containerCls += ' bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold shadow-2xs';
      circleCls += ' bg-emerald-600 text-white';
    } else if (isCorrect && !isSelected) {
      containerCls += ' bg-emerald-50/70 border-emerald-400 text-emerald-900 border-dashed';
      circleCls += ' bg-emerald-600 text-white';
    } else if (isWrong) {
      containerCls += ' bg-rose-50 border-rose-500 text-rose-950 font-semibold shadow-2xs';
      circleCls += ' bg-rose-600 text-white';
    } else {
      containerCls += ' opacity-50 border-[#EFE8D6] bg-white text-[#786F66]';
      circleCls += ' border border-[#382E2B]/20 bg-white text-[#786F66]';
    }
  } else {
    if (isSelected) {
      containerCls +=
        ' bg-[#FAF5EB] border-[#5a7d4d] text-[#1E3B14] font-semibold shadow-2xs ring-1 ring-[#5a7d4d]';
      circleCls += ' bg-[#5a7d4d] text-white';
    } else {
      containerCls +=
        ' bg-[#FAF9F6] border-[#EFE8D6] hover:bg-[#F3EFE6] hover:border-[#382E2B]/30 text-[#2D2422]';
      circleCls += ' border border-[#382E2B]/25 bg-white text-[#6B5A4E]';
    }
  }

  const handleClick = () => {
    if (!isReviewMode) onSelectAnswer(qNum, letter);
  };

  return (
    <button
      type="button"
      className={containerCls}
      disabled={isReviewMode}
      onClick={handleClick}
      aria-pressed={isSelected}
      aria-label={`Đáp án ${letter}`}
    >
      <span className={circleCls}>
        {isReviewMode && isCorrect ? (
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        ) : isReviewMode && isWrong ? (
          <X className="w-3.5 h-3.5 stroke-[3]" />
        ) : (
          letter
        )}
      </span>

      <span
        className={`flex-1 leading-relaxed text-left font-sans pt-0.5 ${fontSizeClass ?? 'text-sm sm:text-base'}`}
      >
        {text}
      </span>

      {/* Badges in Review Mode */}
      {isReviewMode && (
        <span className="ml-auto shrink-0 mt-0.5">
          {isCorrect && isSelected && (
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full whitespace-nowrap">
              Bạn chọn (Đúng)
            </span>
          )}
          {isCorrect && !isSelected && (
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full whitespace-nowrap">
              Đáp án chuẩn
            </span>
          )}
          {isWrong && (
            <span className="text-[11px] font-bold text-rose-700 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full whitespace-nowrap">
              Bạn đã chọn
            </span>
          )}
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Review Banner
// ---------------------------------------------------------------------------

function ReviewBanner({ qNum, userAnswer, correctAnswer, fontSizeClass }) {
  if (!userAnswer) {
    return (
      <div
        className={`flex items-center gap-2 mb-3 px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 font-medium ${fontSizeClass ?? 'text-xs sm:text-sm'}`}
      >
        <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          Câu {qNum}: Chưa trả lời — Đáp án đúng là <strong>{correctAnswer}</strong>
        </span>
      </div>
    );
  }

  const isCorrect = userAnswer === correctAnswer;
  if (isCorrect) {
    return (
      <div
        className={`flex items-center gap-2 mb-3 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 font-medium ${fontSizeClass ?? 'text-xs sm:text-sm'}`}
      >
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Câu {qNum}: Trả lời chính xác! (+0.25 điểm)</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 mb-3 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 font-medium ${fontSizeClass ?? 'text-xs sm:text-sm'}`}
    >
      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
      <span>
        Câu {qNum}: Sai — Bạn chọn <strong>{userAnswer}</strong>, đáp án đúng là <strong>{correctAnswer}</strong>
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Solution Box
// ---------------------------------------------------------------------------

function formatExplanation(text) {
  if (!text) return null;

  const rawLines = text.split('\n');
  const paragraphs = [];
  let current = null;

  const isOptionStart = (s) => /^[A-D]\.\s/.test(s);
  const isBulletStart = (s) => s.startsWith('•');
  const isGiaiThich = (s) => /^Gi[aả]i th[íi]ch/i.test(s) || /^Tạm dịch/i.test(s);
  const isQuoteStart = (s) => s.startsWith('"') || s.startsWith('“') || s.startsWith('”');

  const pushCurrent = () => {
    if (current) {
      paragraphs.push(current);
      current = null;
    }
  };

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    if (trimmed === '') {
      pushCurrent();
      paragraphs.push({ type: 'blank', content: '' });
      continue;
    }
    if (isBulletStart(trimmed)) {
      pushCurrent();
      current = { type: 'bullet', content: trimmed.slice(1).trim() };
      continue;
    }
    if (isOptionStart(trimmed)) {
      pushCurrent();
      current = { type: 'option', content: trimmed };
      continue;
    }
    if (isGiaiThich(trimmed)) {
      pushCurrent();
      current = { type: 'header', content: trimmed };
      continue;
    }
    if (isQuoteStart(trimmed)) {
      pushCurrent();
      current = { type: 'quote', content: trimmed };
      continue;
    }
    if (current) {
      current.content = current.content + ' ' + trimmed;
    } else {
      current = { type: 'text', content: trimmed };
    }
  }
  pushCurrent();

  const elements = [];
  let key = 0;

  for (const para of paragraphs) {
    if (para.type === 'blank') {
      elements.push(<div key={key++} className="h-1.5" />);
      continue;
    }
    if (para.type === 'bullet') {
      elements.push(
        <div key={key++} className="flex items-start gap-2 pl-1 py-0.5">
          <span className="mt-[8px] w-1.5 h-1.5 rounded-full bg-[#5a7d4d] shrink-0" />
          <span className="flex-1 leading-relaxed">{highlightKeywords(para.content)}</span>
        </div>
      );
      continue;
    }
    if (para.type === 'option') {
      elements.push(
        <p key={key++} className="leading-relaxed pl-3 border-l-2 border-[#5a7d4d]/40 ml-1 py-0.5">
          {highlightKeywords(para.content)}
        </p>
      );
      continue;
    }
    if (para.type === 'header') {
      elements.push(
        <p key={key++} className="font-bold text-[#382E2B] mt-2.5 leading-relaxed">
          {highlightKeywords(para.content)}
        </p>
      );
      continue;
    }
    if (para.type === 'quote') {
      elements.push(
        <p key={key++} className="leading-relaxed italic text-[#6B5A4E] bg-[#FAF5EB] border-l-3 border-[#5a7d4d] pl-3 py-1.5 rounded-r-lg my-1">
          {para.content}
        </p>
      );
      continue;
    }
    elements.push(
      <p key={key++} className="leading-relaxed">
        {highlightKeywords(para.content)}
      </p>
    );
  }

  return elements;
}

function highlightKeywords(text) {
  const parts = text.split(/(ĐÚNG|SAI)/g);
  return parts.map((part, i) => {
    if (part === 'ĐÚNG') {
      return (
        <strong key={i} className="text-emerald-700 font-black">
          ĐÚNG
        </strong>
      );
    }
    if (part === 'SAI') {
      return (
        <strong key={i} className="text-rose-600 font-black">
          SAI
        </strong>
      );
    }
    return part;
  });
}

function SolutionBox({ explanation, fontSizeClass }) {
  if (!explanation) return null;
  return (
    <div
      className={`mt-4 p-4 sm:p-5 rounded-2xl bg-[#FAF9F6] border border-[#EFE8D6] text-[#2D2422] space-y-2 ${fontSizeClass ?? 'text-xs sm:text-sm'}`}
    >
      <div className="font-bold text-[#557A46] flex items-center gap-2 pb-2 border-b border-[#EFE8D6]">
        <Lightbulb className="w-4 h-4 text-[#557A46] shrink-0" />
        <span className="uppercase tracking-wider text-xs">Giải thích chi tiết</span>
      </div>
      <div className="space-y-1.5 pt-1 leading-relaxed">
        {formatExplanation(explanation)}
      </div>
    </div>
  );
}

function ArrangementPrompt({ qNum, q, fontSizeClass }) {
  const raw = q.arrangement_sentences || q.raw_sentences || '';
  const letters = [];
  const regex = /(?:^|\n)\s*([a-f])\./gi;
  let m;
  while ((m = regex.exec(raw)) !== null) letters.push(m[1].toLowerCase());
  const labelStr = letters.length > 0 ? `(${letters.join(', ')})` : '';

  return (
    <p
      className={`italic text-[#6B5A4E] mt-1 mb-3 ${fontSizeClass ?? 'text-xs sm:text-sm'}`}
    >
      Xem câu {labelStr} ở ngữ liệu cột bên trái.
    </p>
  );
}

// ---------------------------------------------------------------------------
// Question Card
// ---------------------------------------------------------------------------

function QuestionCard({
  q,
  exam,
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
  const isFlagged = Boolean(flags?.[qNum]);
  const isExercise = Boolean(exam?.is_exercise);

  // Ở chế độ luyện tập 29 chuyên đề: hiển thị giải thích và kết quả ngay khi chọn đáp án
  const showReview = isReviewMode || (isExercise && Boolean(userAnswer));

  const correctAnswer = useMemo(() => {
    if (results?.answers) return results.answers[qNum] ?? q.correct_answer ?? null;
    return q.correct_answer ?? null;
  }, [results, qNum, q.correct_answer]);

  const isArrangement = q.type === 'arrangement' || Boolean(q.is_arrangement);

  let cardCls =
    'question-card scroll-mt-4 mb-4 p-4 sm:p-6 rounded-2xl bg-white border transition-all duration-200 shadow-xs';
  if (isCurrent) {
    cardCls += ' ring-2 ring-[#5a7d4d]/30 border-[#5a7d4d] shadow-sm';
  } else {
    cardCls += ' border-[#EFE8D6] hover:border-[#382E2B]/20';
  }

  return (
    <div id={`q-card-${qNum}`} className={cardCls}>
      {/* ── Header row: Câu hỏi + Cờ + Báo lỗi ───────────────────────── */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <button
            type="button"
            className="text-xs font-black text-[#486b3c] bg-[#5a7d4d]/10 hover:bg-[#5a7d4d]/20 border border-[#5a7d4d]/20 rounded-full px-3 py-1 mr-2.5 transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1"
            onClick={() => onJumpToQuestion(qNum)}
            title="Nhảy đến câu này"
          >
            <span>Câu {qNum}</span>
          </button>
          <span
            className={`font-bold text-[#2D2422] leading-snug font-sans whitespace-pre-line ${fontSizeClass ?? 'text-sm sm:text-base'}`}
            dangerouslySetInnerHTML={{ __html: formatPromptHtml(q.prompt || q.question || '') }}
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          {/* Flag button */}
          <button
            type="button"
            onClick={() => onToggleFlag(qNum)}
            title={isFlagged ? 'Bỏ đánh dấu cờ' : 'Đánh dấu cờ câu này để xem lại sau'}
            className={`min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 p-2 sm:px-2.5 sm:py-1 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              isFlagged
                ? 'bg-amber-100/90 text-amber-800 border-amber-300 shadow-2xs'
                : 'text-[#8C827A] bg-[#FAF9F6] border-[#EFE8D6] hover:text-amber-600 hover:bg-amber-50 hover:border-amber-200'
            }`}
          >
            <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-current text-amber-600' : ''}`} />
            <span className="hidden sm:inline">{isFlagged ? 'Đã cờ' : 'Gắn cờ'}</span>
          </button>

          {/* Report button */}
          <button
            type="button"
            onClick={() => onReportAnswer(qNum, q)}
            title="Báo lỗi nội dung hoặc đáp án câu hỏi này"
            className="w-10 h-10 min-w-[40px] min-h-[40px] p-2 rounded-xl border text-[#8C827A] bg-[#FAF9F6] border-[#EFE8D6] hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer flex items-center justify-center"
          >
            <AlertCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Arrangement note ────────────────────────────────────────── */}
      {isArrangement && <ArrangementPrompt qNum={qNum} q={q} fontSizeClass={fontSizeClass} />}

      {/* ── Review banner ───────────────────────────────────────────── */}
      {showReview && (
        <ReviewBanner
          qNum={qNum}
          userAnswer={userAnswer}
          correctAnswer={correctAnswer}
          fontSizeClass={fontSizeClass}
        />
      )}

      {/* ── Options A / B / C / D ───────────────────────────────────── */}
      <div className={`flex flex-col gap-2 ${fontSizeClass ?? ''}`}>
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
              correctAnswer={showReview ? correctAnswer : null}
              isReviewMode={showReview}
              qNum={qNum}
              fontSizeClass={fontSizeClass}
              onSelectAnswer={onSelectAnswer}
            />
          );
        })}
      </div>

      {/* ── Solution box ────────────────────────────────────────────── */}
      {showReview && <SolutionBox explanation={q.explanation} fontSizeClass={fontSizeClass} />}
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
  isFullWidth = false,
  questionsPaneRef,
  onSelectAnswer,
  onToggleFlag,
  onJumpToQuestion,
  onReportAnswer,
}) {
  if (!exam) return null;

  const questions = exam.questions ?? [];

  useEffect(() => {
    if (currentQIndex == null || currentQIndex < 0 || currentQIndex >= questions.length) return;
    if (currentQIndex === 0 && questionsPaneRef?.current) {
      questionsPaneRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const q = questions[currentQIndex];
    if (!q) return;
    const qNum = q.number ?? q.question_number ?? (currentQIndex + 1);
    const el = document.getElementById(`q-card-${qNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentQIndex, questions, questionsPaneRef]);

  return (
    <div
      ref={questionsPaneRef}
      className="questions-panel h-full overflow-y-auto px-3 sm:px-5 py-4"
    >
      <div className={isFullWidth ? 'max-w-4xl mx-auto w-full space-y-4' : 'space-y-4'}>
        {questions.map((q, idx) => (
          <QuestionCard
            key={q.number ?? idx}
            q={q}
            exam={exam}
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
    </div>
  );
}

export default ExamQuestionsPanel;
