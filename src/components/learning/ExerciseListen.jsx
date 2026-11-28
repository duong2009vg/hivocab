// src/components/learning/ExerciseListen.jsx
// Listen & type exercise — Compact Crayon card + separated multi-word trays

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AlertTriangle, Lightbulb, Eye, RotateCcw, Volume2 } from 'lucide-react';
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

export default function ExerciseListen({ item, onSubmit, onNext, speakWord, onReport, sessionInfo }) {
  const d = item?.exerciseData || {};
  const answer = (d.answer || '').trim();
  const answerParts = useMemo(
    () => (d.answerParts?.length ? d.answerParts : answer.split(/\s+/).filter(Boolean)),
    [d.answerParts, answer]
  );
  const answerChars = useMemo(() => answerParts.join('').split(''), [answerParts]);
  const totalLetters = d.letters || answerChars.length;

  const boxes = useMemo(
    () => answerParts.flatMap((part, pi) => [...part].map((_, li) => ({ partIdx: pi, letterIdx: li }))),
    [answerParts]
  );

  const [values, setValues] = useState(() => boxes.map(() => ''));
  const [hintLevel, setHintLevel] = useState(0);
  const [submitted, setSubmitted] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(1.0);
  const [focusedIdx, setFocusedIdx] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [hintPulseIdx, setHintPulseIdx] = useState(null);
  const inputRefs = useRef([]);
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const currentNum = sessionInfo?.currentNum ?? 1;

  // Auto-play audio on new item
  useEffect(() => {
    const empty = boxes.map(() => '');
    setValues(empty);
    valuesRef.current = empty;
    setHintLevel(0);
    setSubmitted(null);
    setShowResultModal(false);
    setShowMeaning(false);
    setFocusedIdx(0);
    setAutoplayBlocked(false);
    setHintPulseIdx(null);
    const t = setTimeout(() => handlePlay(1.0, true), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.word?.id || item?.word?.wordId, currentNum]);

  function handlePlay(rate = 1.0, isAuto = false) {
    setCurrentSpeed(rate);
    setIsPlayingAudio(true);
    setAutoplayBlocked(false);
    const word = d.wordToSpeak || d.answer || '';
    try {
      if (speakWord) {
        speakWord(word, rate);
      } else if (window.HiAudio?.playWord) {
        const played = window.HiAudio.playWord(word, rate);
        if (played === false && isAuto) {
          setAutoplayBlocked(true);
        }
      } else if ('speechSynthesis' in window) {
        if (window.speechSynthesis.paused) window.speechSynthesis.resume();
        if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(word);
        u.lang = 'en-US';
        u.rate = rate;
        window._activeUtterance = u;
        u.onend = () => {
          setIsPlayingAudio(false);
          if (window._activeUtterance === u) window._activeUtterance = null;
        };
        u.onerror = () => {
          setIsPlayingAudio(false);
          if (window._activeUtterance === u) window._activeUtterance = null;
          if (isAuto) setAutoplayBlocked(true);
        };
        window.speechSynthesis.speak(u);
      }
    } catch (_) {
      if (isAuto) setAutoplayBlocked(true);
    }
    setTimeout(() => setIsPlayingAudio(false), 900);

    // Focus typing canvas input gently without stealing scroll
    setTimeout(() => {
      const activeEl = typeof document !== 'undefined' ? document.activeElement : null;
      if (activeEl && activeEl.dataset?.listenIndex !== undefined) return;
      inputRefs.current[0]?.focus({ preventScroll: true });
    }, 360);
  }

  // Smart hint: fills the first empty or mismatched slot instead of overwriting already-correct letters
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

  // PC keyboard shortcuts (works inside or outside input cleanly without double firing)
  useEffect(() => {
    function onKey(e) {
      if (showResultModal) return;

      // Global inside & outside input: Tab = 0.8x slow listen, Ctrl+Space = replay current speed
      if (e.key === 'Tab') {
        e.preventDefault();
        handlePlay(0.8, false);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === ' ' || e.code === 'Space')) {
        e.preventDefault();
        handlePlay(currentSpeed, false);
        return;
      }
      if (e.altKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        handleRevealHint();
        return;
      }
      if (e.altKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        setShowMeaning((m) => !m);
        return;
      }

      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handlePlay(currentSpeed, false);
      } else if (e.key === '1') {
        e.preventDefault();
        handleRevealHint();
      } else if (e.key === '2') {
        e.preventDefault();
        setShowMeaning((m) => !m);
      } else if (e.key === 'Enter' && !submitted && values.some(Boolean)) {
        e.preventDefault();
        handleCheck();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, currentSpeed, values, showResultModal, handleRevealHint, handleCheck]);

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

  const userTypedDisplay = formatTypedDisplayForParts(answerParts, values);
  const hasAnyInput = values.some(Boolean);
  const canHint =
    !submitted &&
    hintLevel < Math.max(1, totalLetters - 1) &&
    answerChars.some((ch, idx) => cleanCharForSlot(values[idx]).toLowerCase() !== cleanCharForSlot(ch).toLowerCase());

  return (
    <div className="w-full flex flex-col items-center justify-center select-none font-comfortaa py-2 px-2 sm:px-4">
      {/* ── Expanded Spacious Crayon Exercise Card ── */}
      <div className="w-full max-w-3xl bg-[#FFFDF9] border-[3px] border-[#2B2523] rounded-[26px] sm:rounded-[32px] shadow-[5px_7px_0px_#2B2523] px-5 sm:px-10 py-5 sm:py-7 flex flex-col items-center relative">
        {/* Top Mascot Guidance & Report Header */}
        <div className="w-full flex items-center justify-between gap-2 pb-3 mb-5 border-b-2 border-[#EFE8DC]">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-400/50 text-blue-700 text-xs font-bold min-w-0">
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
                ? `Churbito: Nghe & gõ ${answerParts.length} từ (${answerParts.map((p) => p.length).join(' + ')} chữ)`
                : `Churbito: Nghe & gõ lại từ tiếng Anh (${totalLetters} ký tự)`}
            </span>
          </div>

          {onReport && (
            <button
              type="button"
              onClick={onReport}
              className="text-stone-400 hover:text-stone-700 text-xs transition cursor-pointer px-1.5 py-0.5 rounded-lg hover:bg-stone-50 shrink-0"
              title="Báo cáo câu hỏi"
            >
              <span className="inline-flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Báo lỗi
              </span>
            </button>
          )}
        </div>

        {/* Visual Fallback Button when browser autoplay is blocked */}
        {autoplayBlocked && (
          <div className="mb-3 animate-bounce">
            <button
              type="button"
              onClick={() => handlePlay(currentSpeed, false)}
              className="px-4 py-1.5 bg-amber-100 hover:bg-amber-200 border-2 border-[#2B2523] rounded-full text-amber-900 font-bold text-xs flex items-center gap-1.5 shadow-[2px_2px_0px_#2B2523] cursor-pointer"
            >
              <Volume2 className="w-4 h-4 shrink-0" />
              <span>Chạm để nghe phát âm</span>
            </button>
          </div>
        )}

        {/* ── Audio Studio Pod (Speaker + IPA + Speed Controls) ── */}
        <div className="w-full max-w-lg bg-[#FAF5EB] border-2 border-[#2B2523] rounded-2xl px-4 sm:px-5 py-3 mb-2 shadow-[2px_3px_0px_#2B2523] flex items-center justify-between gap-3">
          {/* Left: Play Speaker Button */}
          <button
            type="button"
            onClick={() => handlePlay(currentSpeed, false)}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-b from-sky-400 via-[#3A82EE] to-blue-600 border-2 border-[#2B2523] shadow-[1.5px_2px_0px_#2B2523] flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 group ${
              isPlayingAudio ? 'scale-105 ring-4 ring-sky-200' : ''
            }`}
            title="Bấm để nghe phát âm"
            aria-label="Phát âm từ vựng"
          >
            <svg
              className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-sm group-hover:scale-110 transition-transform"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4a2 2 0 00-2 2v5a2 2 0 002 2h2.44l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06zM18.5 12A6.49 6.49 0 0017 7.75a1 1 0 10-1.414 1.414A4.49 4.49 0 0116.5 12c0 1.2-.47 2.29-1.236 3.107a1 1 0 101.442 1.386A6.49 6.49 0 0018.5 12zm3 0c0-3.32-1.72-6.24-4.32-7.9a1 1 0 10-1.08 1.68 7.48 7.48 0 013.4 6.22c0 2.54-1.26 4.79-3.18 6.13a1 1 0 101.16 1.63A9.48 9.48 0 0021.5 12z" />
            </svg>
          </button>

          {/* Center: Phonetic + POS */}
          <div className="flex-1 min-w-0 text-center">
            {d.phonetic ? (
              <div className="text-base sm:text-xl font-bold tracking-wider text-stone-800 font-mono truncate select-text">
                /{d.phonetic}/
              </div>
            ) : (
              <div className="text-sm sm:text-base font-bold text-stone-700 truncate">
                Nghe &amp; gõ chính xác
              </div>
            )}
            <div className="flex items-center justify-center gap-1.5 mt-1 text-xs font-semibold text-stone-500">
              {(item?.word?.pos || d.pos) && (
                <span className="px-2 py-0.5 bg-white border border-stone-300 rounded-md text-stone-700 font-bold">
                  {item?.word?.pos || d.pos}
                </span>
              )}
              <span>{answerParts.length > 1 ? `Cụm ${answerParts.length} từ` : 'Bấm loa để nghe lại'}</span>
            </div>
          </div>

          {/* Right: 1.0x / 0.8x Segmented Speed Controls */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border-2 border-[#2B2523] shrink-0">
            <button
              type="button"
              onClick={() => handlePlay(1.0, false)}
              className={`px-2.5 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                currentSpeed === 1.0
                  ? 'bg-[#3A82EE] text-white shadow-2xs'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
              title="Tốc độ chuẩn 1.0x"
            >
              1.0x
            </button>
            <button
              type="button"
              onClick={() => handlePlay(0.8, false)}
              className={`px-2.5 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                currentSpeed === 0.8
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
              title="Đọc chậm 0.8x (Phím Tab)"
            >
              0.8x
            </button>
          </div>
        </div>

        {/* Meaning prompt if user toggles "Xem nghĩa" */}
        {showMeaning && (
          <div className="mt-2 px-4 py-2 bg-amber-50/90 border-2 border-dashed border-amber-400 rounded-2xl text-lg sm:text-xl text-[#2B2523] text-center font-extrabold animate-fade-in max-w-2xl w-full">
            {d.meaning || d.meaningHint || '...'}
          </div>
        )}

        {/* ── Clean Underline Word-by-Word Typing Canvas ── */}
        <WordSlotsGrid
          answerParts={answerParts}
          totalBoxes={boxes.length}
          values={values}
          submitted={submitted}
          focusedIdx={focusedIdx}
          hintPulseIdx={hintPulseIdx}
          inputRefs={inputRefs}
          dataAttrName="data-listen-index"
          onFocusSlot={setFocusedIdx}
          onSetValues={setValues}
          onCheckSubmit={handleCheck}
        />

        {/* ── Unified Action Toolbar (Hint + Meaning + Clear) ── */}
        <div className="flex items-center justify-center gap-2.5 flex-wrap mb-3.5">
          <button
            type="button"
            onClick={handleRevealHint}
            disabled={!canHint}
            title="Điền chữ cái kế tiếp còn thiếu/sai (Alt+H)"
            className="px-3.5 py-1.5 bg-amber-50 border-2 border-stone-800 rounded-full flex items-center gap-1.5 font-bold text-xs text-amber-900 shadow-[1.5px_1.5px_0px_#2B2523] hover:bg-amber-100 cursor-pointer active:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Lightbulb className="w-3.5 h-3.5 inline shrink-0" />
            <span>Gợi ý ({hintLevel}/{totalLetters})</span>
          </button>

          <button
            type="button"
            onClick={() => setShowMeaning((m) => !m)}
            title="Ẩn/hiện nghĩa tiếng Việt (Alt+M)"
            className={`px-3.5 py-1.5 border-2 border-stone-800 rounded-full flex items-center gap-1.5 font-bold text-xs shadow-[1.5px_1.5px_0px_#2B2523] cursor-pointer active:translate-y-0.5 transition-colors ${
              showMeaning
                ? 'bg-sky-100 text-sky-900'
                : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Eye className="w-3.5 h-3.5 inline shrink-0" />
            <span>{showMeaning ? 'Ẩn nghĩa' : 'Xem nghĩa'}</span>
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

        {/* Compact 1-Line Keyboard Shortcuts - Desktop Only */}
        <p className="hidden sm:flex text-[11px] font-semibold text-stone-500 text-center mb-3 items-center flex-wrap justify-center gap-1.5 font-quicksand">
          <span>
            <kbd className="px-1.5 py-0.2 bg-stone-100 border border-stone-400 rounded text-[10px] font-mono text-stone-700">
              Tab
            </kbd>{' '}
            nghe chậm 0.8x
          </span>
          <span className="text-stone-300">•</span>
          <span>
            <kbd className="px-1.5 py-0.2 bg-stone-100 border border-stone-400 rounded text-[10px] font-mono text-stone-700">
              Ctrl+Space
            </kbd>{' '}
            nghe lại
          </span>
          <span className="text-stone-300">•</span>
          <span>
            <kbd className="px-1.5 py-0.2 bg-stone-100 border border-stone-400 rounded text-[10px] font-mono text-stone-700">
              Alt+H
            </kbd>{' '}
            gợi ý
          </span>
          <span className="text-stone-300">•</span>
          <span>
            <kbd className="px-1.5 py-0.2 bg-stone-100 border border-stone-400 rounded text-[10px] font-mono text-stone-700">
              Enter
            </kbd>{' '}
            kiểm tra
          </span>
        </p>

        {/* Primary Action: Check Answer Button */}
        <div className="w-full max-w-sm">
          <button
            type="button"
            onClick={handleCheck}
            disabled={!!submitted || !hasAnyInput}
            className="w-full min-h-[44px] py-2 sm:py-2.5 px-6 bg-[#243A5E] hover:bg-[#1C2F4D] text-white font-crayon font-bold text-sm sm:text-base rounded-xl sm:rounded-2xl border-2 border-[#2B2523] shadow-[2px_3px_0px_#2B2523] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[1px_2px_0px_#2B2523] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
        pos={item?.word?.pos || d.pos}
        meaning={d.meaning || d.meaningHint}
        exampleSentence={item?.word?.example_sentence || item?.word?.exampleSentence || d.sentence}
        notes={item?.word?.notes || d.notes}
        userAnswer={userTypedDisplay}
        onContinue={handleModalContinue}
        onReport={onReport}
      />
    </div>
  );
}
