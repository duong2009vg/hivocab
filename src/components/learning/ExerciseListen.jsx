// src/components/learning/ExerciseListen.jsx
// Listen & type exercise — Compact Crayon card (PC/Mobile fit, safe above-the-fold layout)

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AlertTriangle, Lightbulb, Eye, RotateCcw, Volume2 } from 'lucide-react';
import ExerciseResultModal from './ExerciseResultModal.jsx';

function cleanCharForSlot(raw) {
  if (!raw) return '';
  return String(raw)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toUpperCase()
    .replace(/[^A-Z0-9\-']/g, '');
}

function getSlotDimensions(maxPartLen) {
  if (maxPartLen <= 4) {
    return {
      slot: 'w-10 sm:w-12 h-11 sm:h-[52px] text-lg sm:text-2xl rounded-xl sm:rounded-2xl',
      gap: 'gap-1.5 sm:gap-2.5',
      gapBetweenWords: 'gap-x-3 sm:gap-x-4 gap-y-2 sm:gap-y-2.5',
    };
  }
  if (maxPartLen <= 6) {
    return {
      slot: 'w-9 sm:w-11 h-10 sm:h-12 text-base sm:text-xl rounded-xl sm:rounded-2xl',
      gap: 'gap-1.5 sm:gap-2',
      gapBetweenWords: 'gap-x-2.5 sm:gap-x-3.5 gap-y-2',
    };
  }
  if (maxPartLen <= 8) {
    return {
      slot: 'w-8 sm:w-10 h-9 sm:h-11 text-sm sm:text-lg rounded-xl',
      gap: 'gap-1 sm:gap-1.5',
      gapBetweenWords: 'gap-x-2 sm:gap-x-3 gap-y-2',
    };
  }
  if (maxPartLen <= 10) {
    return {
      slot: 'w-7 sm:w-9 h-9 sm:h-10 text-xs sm:text-base rounded-lg sm:rounded-xl',
      gap: 'gap-1 sm:gap-1.5',
      gapBetweenWords: 'gap-x-2 gap-y-1.5',
    };
  }
  if (maxPartLen <= 12) {
    return {
      slot: 'w-6 sm:w-8 h-8 sm:h-9 text-xs sm:text-sm rounded-lg sm:rounded-xl',
      gap: 'gap-0.5 sm:gap-1',
      gapBetweenWords: 'gap-x-1.5 gap-y-1.5',
    };
  }
  // 13+ letters (fits 14 letters on narrow mobile without overflowing)
  return {
    slot: 'w-[22px] sm:w-7 h-7 sm:h-9 text-xs rounded-lg',
    gap: 'gap-0.5 sm:gap-1',
    gapBetweenWords: 'gap-x-1 gap-y-1',
  };
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

    // Focus first empty input only if user is not currently typing inside one of the boxes
    setTimeout(() => {
      const activeEl = typeof document !== 'undefined' ? document.activeElement : null;
      if (activeEl && activeEl.dataset?.listenIndex !== undefined) return;
      const latestVals = valuesRef.current || [];
      const firstEmptyIdx = boxes.findIndex((_, i) => !latestVals[i]);
      const target = inputRefs.current[firstEmptyIdx >= 0 ? firstEmptyIdx : 0];
      target?.focus();
      target?.select?.();
    }, 380);
  }

  const handleInput = useCallback(
    (e, flatIdx) => {
      if (submitted) return;
      const raw = e.target.value;
      if (!raw) {
        setValues((prev) => {
          const n = [...prev];
          n[flatIdx] = '';
          return n;
        });
        return;
      }
      if (raw.length > 1) {
        const cleaned = cleanCharForSlot(raw);
        const chars = cleaned.split('');
        setValues((prev) => {
          const n = [...prev];
          chars.forEach((c, i) => {
            if (n[flatIdx + i] !== undefined) n[flatIdx + i] = c;
          });
          return n;
        });
        const nextIdx = Math.min(flatIdx + chars.length, boxes.length - 1);
        setTimeout(() => {
          inputRefs.current[nextIdx]?.focus();
          inputRefs.current[nextIdx]?.select?.();
        }, 10);
        return;
      }
      const char = cleanCharForSlot(raw.slice(-1));
      setValues((prev) => {
        const n = [...prev];
        n[flatIdx] = char;
        return n;
      });
      if (e.target) e.target.scrollLeft = 0;
      if (char && flatIdx < boxes.length - 1) {
        setTimeout(() => {
          const next = inputRefs.current[flatIdx + 1];
          if (next) {
            next.focus();
            next.select?.();
            next.scrollLeft = 0;
          }
        }, 10);
      }
    },
    [submitted, boxes.length]
  );

  // Smart hint: fills the first empty or mismatched slot instead of overwriting already-correct letters
  const handleRevealHint = useCallback(() => {
    if (submitted || answerChars.length === 0) return;
    const maxHint = Math.max(1, answerChars.length - 1);
    if (hintLevel >= maxHint) return;

    const latestVals = valuesRef.current;
    let targetIdx = answerChars.findIndex(
      (ch, idx) => cleanCharForSlot(latestVals[idx]) !== cleanCharForSlot(ch)
    );
    if (targetIdx === -1) return;

    const revealedChar = cleanCharForSlot(answerChars[targetIdx]) || (answerChars[targetIdx] || '').toUpperCase();
    const nextValues = [...latestVals];
    nextValues[targetIdx] = revealedChar;
    setValues(nextValues);
    setHintLevel((h) => h + 1);
    setHintPulseIdx(targetIdx);
    setTimeout(() => setHintPulseIdx((curr) => (curr === targetIdx ? null : curr)), 450);

    setTimeout(() => {
      const nextEmpty = answerChars.findIndex(
        (ch, idx) => idx > targetIdx && cleanCharForSlot(nextValues[idx]) !== cleanCharForSlot(ch)
      );
      const focusTargetIdx =
        nextEmpty >= 0 ? nextEmpty : Math.min(targetIdx + 1, Math.max(0, boxes.length - 1));
      const nextInp = inputRefs.current[focusTargetIdx];
      nextInp?.focus();
      nextInp?.select?.();
    }, 50);
  }, [submitted, answerChars, hintLevel, boxes.length]);

  const handleCheck = useCallback(() => {
    if (submitted) return;
    const ans = d.answer || '';
    let letterIdx = 0;
    const typed = ans
      .split('')
      .map((char) => {
        if (char === ' ') return ' ';
        return values[letterIdx++] || '_';
      })
      .join('');

    const r = onSubmit(typed);
    setSubmitted(r);
    setShowResultModal(true);
  }, [submitted, d.answer, values, onSubmit]);

  const handleKeyDown = useCallback(
    (e, flatIdx) => {
      if (showResultModal) return;
      const isBackspace = e.key === 'Backspace' || e.keyCode === 8 || e.which === 8 || e.keyCode === 229;
      if (isBackspace) {
        if (!values[flatIdx] && flatIdx > 0) {
          e.preventDefault();
          setValues((prev) => {
            const n = [...prev];
            n[flatIdx - 1] = '';
            return n;
          });
          inputRefs.current[flatIdx - 1]?.focus();
        } else if (values[flatIdx]) {
          e.preventDefault();
          setValues((prev) => {
            const n = [...prev];
            n[flatIdx] = '';
            return n;
          });
        }
      } else if (e.key === 'ArrowLeft' && flatIdx > 0) {
        e.preventDefault();
        inputRefs.current[flatIdx - 1]?.focus();
        inputRefs.current[flatIdx - 1]?.select?.();
      } else if (e.key === 'ArrowRight' && flatIdx < boxes.length - 1) {
        e.preventDefault();
        inputRefs.current[flatIdx + 1]?.focus();
        inputRefs.current[flatIdx + 1]?.select?.();
      } else if ((e.key === ' ' || e.code === 'Space') && !e.ctrlKey && !e.metaKey && e.target.tagName === 'INPUT') {
        e.preventDefault();
        inputRefs.current[Math.min(flatIdx + 1, boxes.length - 1)]?.focus();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (!values.every((v) => !v)) {
          handleCheck();
        }
      }
    },
    [values, boxes.length, showResultModal, handleCheck]
  );

  // PC keyboard shortcuts (works inside or outside input boxes cleanly without double firing)
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
      } else if (e.key === 'Enter' && !submitted && !values.every((v) => !v)) {
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
    onNext?.();
  }, [boxes, onNext]);

  const handleClearAll = useCallback(() => {
    if (submitted) return;
    setValues(boxes.map(() => ''));
    setFocusedIdx(0);
    setTimeout(() => {
      inputRefs.current[0]?.focus();
      inputRefs.current[0]?.select?.();
    }, 50);
  }, [submitted, boxes]);

  let partOffset = 0;
  const userTyped = values.join('');
  const maxPartLetters = Math.max(...answerParts.map((p) => p.length), 1);
  const dims = getSlotDimensions(maxPartLetters);
  const canHint =
    !submitted &&
    hintLevel < Math.max(1, totalLetters - 1) &&
    answerChars.some((ch, idx) => cleanCharForSlot(values[idx]) !== cleanCharForSlot(ch));

  return (
    <div className="w-full flex flex-col items-center justify-center select-none font-comfortaa py-1 px-2">
      {/* ── Main Compact Crayon Exercise Card ── */}
      <div className="w-full max-w-xl bg-white border-[3px] border-[#2B2523] rounded-[24px] sm:rounded-[28px] shadow-[4px_6px_0px_#2B2523] px-3.5 sm:px-6 py-3.5 sm:py-4 flex flex-col items-center relative">
        {/* Top Mascot Guidance & Report Header */}
        <div className="w-full flex items-center justify-between gap-2 pb-2 mb-2.5 border-b-2 border-stone-100">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-400/50 text-blue-700 text-[11px] sm:text-xs font-bold min-w-0">
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
            <span className="truncate">Churbito: Nghe &amp; gõ lại từng chữ cái ({totalLetters} ký tự)</span>
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
          <div className="mb-2 animate-bounce">
            <button
              type="button"
              onClick={() => handlePlay(currentSpeed, false)}
              className="px-3.5 py-1 bg-amber-100 hover:bg-amber-200 border-2 border-[#2B2523] rounded-full text-amber-900 font-bold text-xs flex items-center gap-1.5 shadow-[2px_2px_0px_#2B2523] cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 shrink-0" />
              <span>Chạm để nghe phát âm</span>
            </button>
          </div>
        )}

        {/* ── Compact Audio Studio Pod (Speaker + IPA + Speed Controls in one row) ── */}
        <div className="w-full max-w-md bg-[#FAF5EB] border-2 border-[#2B2523] rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 mb-2.5 shadow-[2px_3px_0px_#2B2523] flex items-center justify-between gap-2.5">
          {/* Left: Play Speaker Button */}
          <button
            type="button"
            onClick={() => handlePlay(currentSpeed, false)}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-b from-sky-400 via-[#3A82EE] to-blue-600 border-2 border-[#2B2523] shadow-[1.5px_2px_0px_#2B2523] flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 group ${
              isPlayingAudio ? 'scale-105 ring-4 ring-sky-200' : ''
            }`}
            title="Bấm để nghe phát âm"
            aria-label="Phát âm từ vựng"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-sm group-hover:scale-110 transition-transform"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4a2 2 0 00-2 2v5a2 2 0 002 2h2.44l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06zM18.5 12A6.49 6.49 0 0017 7.75a1 1 0 10-1.414 1.414A4.49 4.49 0 0116.5 12c0 1.2-.47 2.29-1.236 3.107a1 1 0 101.442 1.386A6.49 6.49 0 0018.5 12zm3 0c0-3.32-1.72-6.24-4.32-7.9a1 1 0 10-1.08 1.68 7.48 7.48 0 013.4 6.22c0 2.54-1.26 4.79-3.18 6.13a1 1 0 101.16 1.63A9.48 9.48 0 0021.5 12z" />
            </svg>
          </button>

          {/* Center: Phonetic + POS */}
          <div className="flex-1 min-w-0 text-center">
            {d.phonetic ? (
              <div className="text-sm sm:text-base font-bold tracking-wider text-stone-800 font-mono truncate select-text">
                /{d.phonetic}/
              </div>
            ) : (
              <div className="text-xs sm:text-sm font-bold text-stone-700 truncate">
                Nghe &amp; gõ chính xác
              </div>
            )}
            <div className="flex items-center justify-center gap-1.5 mt-0.5 text-[11px] font-semibold text-stone-500">
              {(item?.word?.pos || d.pos) && (
                <span className="px-1.5 py-0.2 bg-white border border-stone-300 rounded-md text-stone-700 font-bold">
                  {item?.word?.pos || d.pos}
                </span>
              )}
              <span>{answerParts.length > 1 ? `${answerParts.length} từ ghép` : 'Bấm loa để nghe'}</span>
            </div>
          </div>

          {/* Right: 1.0x / 0.8x Segmented Speed Controls */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border-2 border-[#2B2523] shrink-0">
            <button
              type="button"
              onClick={() => handlePlay(1.0, false)}
              className={`px-2 py-1 rounded-lg font-bold text-[11px] sm:text-xs transition-all cursor-pointer ${
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
              className={`px-2 py-1 rounded-lg font-bold text-[11px] sm:text-xs transition-all cursor-pointer ${
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

        {/* ── Unified Action Toolbar (Hint + Meaning + Clear) ── */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-2.5">
          <button
            type="button"
            onClick={handleRevealHint}
            disabled={!canHint}
            title="Điền chữ cái kế tiếp còn thiếu/sai (Alt+H)"
            className="px-3 py-1 bg-amber-50 border-2 border-stone-800 rounded-full flex items-center gap-1 font-bold text-xs text-amber-900 shadow-[1.5px_1.5px_0px_#2B2523] hover:bg-amber-100 cursor-pointer active:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Lightbulb className="w-3.5 h-3.5 inline shrink-0" />
            <span>Gợi ý ({hintLevel}/{totalLetters})</span>
          </button>

          <button
            type="button"
            onClick={() => setShowMeaning((m) => !m)}
            title="Ẩn/hiện nghĩa tiếng Việt (Alt+M)"
            className={`px-3 py-1 border-2 border-stone-800 rounded-full flex items-center gap-1 font-bold text-xs shadow-[1.5px_1.5px_0px_#2B2523] cursor-pointer active:translate-y-0.5 transition-colors ${
              showMeaning
                ? 'bg-sky-100 text-sky-900'
                : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Eye className="w-3.5 h-3.5 inline shrink-0" />
            <span>{showMeaning ? 'Ẩn nghĩa' : 'Xem nghĩa'}</span>
          </button>

          {userTyped && !submitted && (
            <button
              type="button"
              onClick={handleClearAll}
              title="Xóa toàn bộ chữ đã nhập"
              className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 border-2 border-stone-800 rounded-full flex items-center gap-1 font-bold text-xs text-stone-700 shadow-[1.5px_1.5px_0px_#2B2523] cursor-pointer active:translate-y-0.5"
            >
              <RotateCcw className="w-3.5 h-3.5 inline shrink-0" />
              <span>Xóa hết</span>
            </button>
          )}
        </div>

        {/* Meaning dropdown box if active */}
        {showMeaning && (
          <div className="mb-2.5 px-3.5 py-1.5 bg-amber-50/90 border-2 border-dashed border-amber-400 rounded-xl text-xs sm:text-sm text-stone-800 text-center font-quicksand font-bold animate-fade-in max-w-md w-full">
            Nghĩa: <span className="text-[#3b6e8c]">{d.meaning || d.meaningHint || '...'}</span>
          </div>
        )}

        {/* ── Letters Input Box Row (Compact & Responsive) ── */}
        <div
          className="w-full max-w-full overflow-x-auto py-1 mb-2.5 no-scrollbar"
          style={{ WebkitOverflowScrolling: 'touch' }}
          onClick={(e) => {
            if (e.target.tagName !== 'INPUT') {
              const firstEmpty = inputRefs.current.find((inp, i) => !values[i]);
              const target = firstEmpty || inputRefs.current[inputRefs.current.length - 1];
              target?.focus();
              target?.select?.();
            }
          }}
        >
          <div className={`flex flex-wrap items-center justify-center ${dims.gapBetweenWords} min-w-min mx-auto px-1`}>
            {answerParts.map((part, pi) => {
              const startOffset = partOffset;
              partOffset += part.length;

              return (
                <div key={pi} className={`inline-flex items-center ${dims.gap} flex-nowrap shrink-0`}>
                  {[...part].map((_, li) => {
                    const flatIdx = startOffset + li;
                    const isFilled = !!values[flatIdx];
                    const isActive = focusedIdx === flatIdx && !submitted;
                    const isPulsed = hintPulseIdx === flatIdx;

                    let slotClass = `${dims.slot} flex items-center justify-center font-mono font-black transition-all duration-150 shrink-0 select-none `;

                    if (!submitted) {
                      if (isPulsed) {
                        slotClass +=
                          'border-[3px] border-[#3884DD] bg-[#E8F2FF] text-[#1D5CA8] shadow-[2px_3px_0px_#2B2523] scale-110 z-10';
                      } else if (isActive) {
                        slotClass +=
                          'border-[3px] border-[#2B4566] bg-[#F1F7FF] text-[#2B4566] shadow-[2px_3px_0px_#2B2523] ring-3 ring-sky-300/60 scale-105 z-10';
                      } else if (isFilled) {
                        slotClass +=
                          'border-2 border-[#2B2523] bg-white text-stone-900 shadow-[1.5px_2px_0px_#2B2523] hover:border-stone-800';
                      } else {
                        slotClass +=
                          'border-2 border-stone-300 border-dashed text-stone-400 bg-white/70 shadow-2xs hover:bg-stone-50';
                      }
                    } else {
                      if (submitted.correct) {
                        slotClass +=
                          'border-[2.5px] border-[#3D7A46] bg-[#EEF8EC] text-[#2B6135] shadow-[2px_2.5px_0px_#2B6135]';
                      } else {
                        slotClass +=
                          'border-[2.5px] border-[#D34E36] bg-[#FDF0ED] text-[#B83822] shadow-[2px_2.5px_0px_#B83822]';
                      }
                    }

                    return (
                      <div key={flatIdx} className={slotClass}>
                        <input
                          ref={(el) => (inputRefs.current[flatIdx] = el)}
                          type="text"
                          maxLength={2}
                          value={values[flatIdx]}
                          disabled={!!submitted}
                          data-listen-index={flatIdx}
                          className="w-full h-full text-center bg-transparent focus:outline-none uppercase caret-transparent p-0 font-bold"
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="characters"
                          spellCheck={false}
                          onFocus={(e) => {
                            setFocusedIdx(flatIdx);
                            e.target.select?.();
                            e.target.scrollLeft = 0;
                            e.target.scrollIntoView?.({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                          }}
                          onBlur={(e) => {
                            e.target.scrollLeft = 0;
                          }}
                          onClick={(e) => {
                            setFocusedIdx(flatIdx);
                            e.target.select?.();
                            e.target.scrollLeft = 0;
                          }}
                          onBeforeInput={(e) => {
                            if (e.inputType === 'deleteContentBackward') {
                              if (!values[flatIdx] && flatIdx > 0) {
                                e.preventDefault();
                                setValues((prev) => {
                                  const n = [...prev];
                                  n[flatIdx - 1] = '';
                                  return n;
                                });
                                inputRefs.current[flatIdx - 1]?.focus();
                              }
                            }
                          }}
                          onChange={(e) => handleInput(e, flatIdx)}
                          onKeyDown={(e) => handleKeyDown(e, flatIdx)}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
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
            disabled={!!submitted || values.every((v) => !v)}
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
        userAnswer={userTyped}
        onContinue={handleModalContinue}
        onReport={onReport}
      />
    </div>
  );
}
