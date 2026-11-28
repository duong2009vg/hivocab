// src/components/learning/ExerciseFill.jsx
// Fill-in-the-blank letter boxes — Vietnamese-meaning prompt only + separated multi-word trays

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AlertTriangle, Lightbulb, RotateCcw } from 'lucide-react';
import ExerciseResultModal from './ExerciseResultModal.jsx';
import WordSlotsGrid from './WordSlotsGrid.jsx';
import { buildTypedAnswerForParts, formatTypedDisplayForParts } from './letterSlotUtils.js';
import { HiSound } from '../../services/audioService.js';

function cleanCharForSlot(raw) {
  if (!raw) return '';
  return String(raw)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .replace(/[^A-Za-z0-9\-']/g, '');
}

export default function ExerciseFill({ item, onSubmit, onNext, speakWord, onReport, sessionInfo }) {
  const d = item?.exerciseData || {};
  const answer = (d.answer || '').trim();
  const answerParts = useMemo(
    () => (d.answerParts?.length ? d.answerParts : answer.split(/\s+/).filter(Boolean)),
    [d.answerParts, answer]
  );
  const answerChars = useMemo(() => answerParts.join('').split(''), [answerParts]);
  const totalLetters = d.letters || answerChars.length;

  // Build flat array of { partIdx, letterIdx } for each input box
  const boxes = useMemo(
    () => answerParts.flatMap((part, pi) => [...part].map((_, li) => ({ partIdx: pi, letterIdx: li }))),
    [answerParts]
  );

  const [values, setValues] = useState(() => boxes.map(() => ''));
  const [hintLevel, setHintLevel] = useState(0);
  const [submitted, setSubmitted] = useState(null); // { correct, correctAnswer }
  const [showResultModal, setShowResultModal] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(0);
  const [hintPulseIdx, setHintPulseIdx] = useState(null);
  const inputRefs = useRef([]);
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const currentNum = sessionInfo?.currentNum ?? 1;

  // Reset on new item
  useEffect(() => {
    const empty = boxes.map(() => '');
    setValues(empty);
    valuesRef.current = empty;
    setHintLevel(0);
    setSubmitted(null);
    setShowResultModal(false);
    setFocusedIdx(0);
    setHintPulseIdx(null);
    const t = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 120);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.word?.id || item?.word?.wordId, currentNum]);

  // Smart hint: fills the first empty or mismatched slot instead of overwriting correct letters
  const handleRevealHint = useCallback(() => {
    if (submitted || answerChars.length === 0) return;
    const maxHint = Math.max(1, answerChars.length - 1);
    if (hintLevel >= maxHint) return;

    const latestVals = valuesRef.current;
    const targetIdx = answerChars.findIndex(
      (ch, idx) => cleanCharForSlot(latestVals[idx]).toLowerCase() !== cleanCharForSlot(ch).toLowerCase()
    );
    if (targetIdx === -1) return;

    const revealedChar = cleanCharForSlot(answerChars[targetIdx]) || answerChars[targetIdx] || '';
    const nextValues = [...latestVals];
    nextValues[targetIdx] = revealedChar;
    setValues(nextValues);
    setHintLevel((h) => h + 1);
    setHintPulseIdx(targetIdx);
    HiSound.playKeyType('hint');
    setTimeout(() => setHintPulseIdx((curr) => (curr === targetIdx ? null : curr)), 450);

    const nextEmpty = answerChars.findIndex(
      (ch, idx) => idx > targetIdx && cleanCharForSlot(nextValues[idx]).toLowerCase() !== cleanCharForSlot(ch).toLowerCase()
    );
    const focusTargetIdx =
      nextEmpty >= 0 ? nextEmpty : Math.min(targetIdx + 1, boxes.length);
    setFocusedIdx(focusTargetIdx);
    setTimeout(() => {
      inputRefs.current[0]?.focus({ preventScroll: true });
    }, 30);
  }, [submitted, answerChars, hintLevel, boxes.length]);

  const handleCheck = useCallback(() => {
    if (submitted) return;
    const typed = buildTypedAnswerForParts(answerParts, values);
    const r = onSubmit(typed);
    setSubmitted(r);
    setShowResultModal(true);
  }, [submitted, answerParts, values, onSubmit]);

  // Keyboard shortcuts: Alt+H for hint, Enter to check outside input
  useEffect(() => {
    function onKey(e) {
      if (showResultModal) return;
      if (e.altKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        handleRevealHint();
        return;
      }
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Enter' && !submitted && values.some(Boolean)) {
        e.preventDefault();
        handleCheck();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showResultModal, submitted, values, handleRevealHint, handleCheck]);

  const handleModalContinue = useCallback(() => {
    setShowResultModal(false);
    setValues(boxes.map(() => ''));
    setSubmitted(null);
    setHintLevel(0);
    setFocusedIdx(0);
    onNext?.();
  }, [boxes, onNext]);

  const handleClearAll = useCallback(() => {
    if (submitted) return;
    HiSound.playKeyType('backspace');
    setValues(boxes.map(() => ''));
    setFocusedIdx(0);
    setTimeout(() => {
      inputRefs.current[0]?.focus({ preventScroll: true });
    }, 30);
  }, [submitted, boxes]);

  const playAudio = useCallback(() => {
    const word = d.answer || '';
    if (!word) return;
    if (speakWord) {
      speakWord(word, 0.9);
    } else if (window.HiAudio?.playWord) {
      window.HiAudio.playWord(word, 0.9);
    } else if ('speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.paused) window.speechSynthesis.resume();
        if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(word);
        u.lang = 'en-US';
        u.rate = 0.9;
        window._activeUtterance = u;
        u.onend = () => {
          if (window._activeUtterance === u) window._activeUtterance = null;
        };
        u.onerror = () => {
          if (window._activeUtterance === u) window._activeUtterance = null;
        };
        window.speechSynthesis.speak(u);
      } catch (_) {}
    }
  }, [d.answer, speakWord]);

  const firstLetter = (d.answer || '').trim()[0]?.toUpperCase() || 'A';
  const userTypedDisplay = formatTypedDisplayForParts(answerParts, values);
  const hasAnyInput = values.some(Boolean);
  const wordPos = item?.word?.pos || d.pos;
  const vietnameseMeaning =
    d.meaning ||
    item?.word?.meaning ||
    (d.meaningHint ? d.meaningHint.replace(/^Điền từ tiếng Anh có nghĩa:\s*"|"$/g, '') : '');
  const canHint =
    !submitted &&
    hintLevel < Math.max(1, totalLetters - 1) &&
    answerChars.some((ch, idx) => cleanCharForSlot(values[idx]).toLowerCase() !== cleanCharForSlot(ch).toLowerCase());

  return (
    <div className="w-full flex flex-col items-center justify-center select-none font-comfortaa py-2 px-2 sm:px-4">
      {/* ── Expanded Spacious Crayon Card ── */}
      <div className="w-full max-w-3xl bg-[#FFFDF9] rounded-[26px] sm:rounded-[32px] border-[3px] border-[#342e2b] px-5 sm:px-10 py-5 sm:py-7 shadow-[5px_7px_0px_#2c2523] relative transition-all">
        {/* Top Mascot Hint & Report Header */}
        <div className="flex items-center justify-between gap-2 pb-3 mb-5 border-b-2 border-[#EFE8DC]">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF5EB] border border-[#E76F51]/40 text-[#D36135] text-xs font-bold min-w-0">
            <span className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center shrink-0">
              <img
                src="/mascot/mascot_cozy.png"
                alt="Bé hổ"
                className="w-full h-full object-contain mix-blend-multiply"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </span>
            <span className="truncate">
              {answerParts.length > 1
                ? `Churbito gợi ý: Cụm ${answerParts.length} từ (${answerParts.map((p) => p.length).join(' + ')} chữ), bắt đầu '${firstLetter}'`
                : `Churbito gợi ý: Từ gồm ${totalLetters} ký tự, bắt đầu '${firstLetter}'`}
            </span>
          </div>

          {onReport && (
            <button
              type="button"
              onClick={onReport}
              className="px-2 py-1 flex items-center justify-center text-stone-400 hover:text-stone-700 text-xs transition cursor-pointer rounded-lg hover:bg-stone-50 shrink-0"
              title="Báo cáo lỗi câu này"
              aria-label="Báo cáo lỗi câu này"
            >
              <span className="inline-flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Báo lỗi
              </span>
            </button>
          )}
        </div>

        {/* ── Large Centered Vietnamese Meaning Prompt ── */}
        <div className="w-full max-w-2xl mx-auto text-center space-y-2.5 mb-2">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              Nghĩa tiếng Việt
            </span>
            {wordPos && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white text-stone-700 border border-stone-300">
                {wordPos}
              </span>
            )}
            <button
              type="button"
              onClick={playAudio}
              aria-label="Phát âm từ vựng"
              className="w-8 h-8 rounded-full bg-sky-100 hover:bg-sky-200 border-2 border-[#2B2523] text-sky-800 inline-flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-[1.5px_2px_0px_#2B2523] cursor-pointer shrink-0"
              title="Nghe phát âm gợi ý"
            >
              <svg className="w-4 h-4 text-sky-800" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#2B2523] leading-snug tracking-tight select-text px-2">
            {vietnameseMeaning || 'Điền từ tiếng Anh thích hợp'}
          </p>
        </div>

        {/* ── Clean Underline Word-by-Word Typing Canvas ── */}
        <WordSlotsGrid
          answerParts={answerParts}
          totalBoxes={boxes.length}
          values={values}
          submitted={submitted}
          focusedIdx={focusedIdx}
          hintPulseIdx={hintPulseIdx}
          inputRefs={inputRefs}
          dataAttrName="data-fill-index"
          onFocusSlot={setFocusedIdx}
          onSetValues={setValues}
          onCheckSubmit={handleCheck}
        />

        {/* Action Toolbar: Hint + Clear */}
        <div className="flex items-center justify-center gap-2.5 flex-wrap mb-3.5">
          <button
            type="button"
            onClick={handleRevealHint}
            disabled={!canHint}
            title="Điền chữ cái kế tiếp còn thiếu/sai (Alt+H)"
            className="px-3.5 py-1.5 bg-amber-50 border-2 border-stone-800 rounded-full text-amber-900 hover:bg-amber-100 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-[1.5px_1.5px_0px_#2B2523] active:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-600 inline shrink-0" />
            <span>Gợi ý ({hintLevel}/{totalLetters})</span>
          </button>

          {hasAnyInput && !submitted && (
            <button
              type="button"
              onClick={handleClearAll}
              title="Xóa toàn bộ chữ đã nhập"
              className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 border-2 border-stone-800 rounded-full flex items-center gap-1.5 font-bold text-xs text-stone-700 shadow-[1.5px_1.5px_0px_#2B2523] cursor-pointer active:translate-y-0.5"
            >
              <RotateCcw className="w-3.5 h-3.5 inline shrink-0" />
              <span>Làm lại</span>
            </button>
          )}
        </div>

        {/* Keyboard Navigation Instructions - Compact Desktop Line */}
        <div className="hidden sm:flex text-center font-quicksand text-[11px] text-stone-500 font-medium mb-3 items-center justify-center gap-1.5 flex-wrap">
          <span>Gõ chữ cái</span>
          <span className="inline-block w-1 h-1 rounded-full bg-stone-300"></span>
          <span>
            <kbd className="px-1.5 py-0.2 bg-stone-100 border border-stone-400/70 rounded font-mono text-[10px] text-stone-700 font-semibold">
              Backspace
            </kbd>{' '}
            để lùi
          </span>
          <span className="inline-block w-1 h-1 rounded-full bg-stone-300"></span>
          <span>
            <kbd className="px-1.5 py-0.2 bg-stone-100 border border-stone-400/70 rounded font-mono text-[10px] text-stone-700 font-semibold">
              Alt+H
            </kbd>{' '}
            gợi ý
          </span>
          <span className="inline-block w-1 h-1 rounded-full bg-stone-300"></span>
          <span>
            <kbd className="px-1.5 py-0.2 bg-stone-100 border border-stone-400/70 rounded font-mono text-[10px] text-stone-700 font-semibold">
              Enter
            </kbd>{' '}
            kiểm tra
          </span>
        </div>

        {/* Primary Action Button: Kiểm tra đáp án */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleCheck}
            disabled={!!submitted || !hasAnyInput}
            className="w-full max-w-sm min-h-[44px] py-2 sm:py-2.5 px-6 bg-[#3b6e8c] hover:bg-[#34617c] active:bg-[#2b5168] text-white font-crayon text-sm sm:text-base font-bold rounded-xl sm:rounded-2xl border-2 border-stone-800 shadow-[2px_3px_0px_#2c2523] hover:-translate-y-0.5 active:translate-y-1 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Kiểm tra đáp án</span>
          </button>
        </div>
      </div>

      {/* ── Modern Bottom Sheet Result Notification Modal ── */}
      <ExerciseResultModal
        isOpen={showResultModal}
        isCorrect={!!submitted?.correct}
        word={d.answer}
        phonetic={d.phonetic}
        pos={wordPos}
        meaning={d.meaning || item?.word?.meaning || d.meaningHint}
        exampleSentence={item?.word?.example_sentence || item?.word?.exampleSentence || ''}
        notes={item?.word?.notes || d.notes}
        userAnswer={userTypedDisplay}
        onContinue={handleModalContinue}
        onReport={onReport}
      />
    </div>
  );
}
