// src/components/learning/ExerciseFill.jsx
// Fill-in-the-blank letter boxes — Compact Crayon card synced with ExerciseListen

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AlertTriangle, Lightbulb, RotateCcw } from 'lucide-react';
import ExerciseResultModal from './ExerciseResultModal.jsx';

function renderSentence(sentence, targetWord) {
  if (!sentence) return null;
  if (sentence.includes('___') || sentence.includes('---')) {
    const parts = sentence.split(/_{2,}|-{2,}/);
    return (
      <>
        {parts[0]}
        <span className="inline-block px-2.5 sm:px-3.5 py-0.5 mx-1 sm:mx-1.5 bg-sky-50 text-[#3b6e8c] font-bold rounded-xl border-2 border-[#3b6e8c] crayon-blank-highlight shadow-xs align-baseline">
          {targetWord || '____'}
        </span>
        {parts[1] || ''}
      </>
    );
  }
  return sentence;
}

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
  return {
    slot: 'w-[22px] sm:w-7 h-7 sm:h-9 text-xs rounded-lg',
    gap: 'gap-0.5 sm:gap-1',
    gapBetweenWords: 'gap-x-1 gap-y-1',
  };
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
      // Paste handling
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

  // Smart hint: fills the first empty or mismatched slot instead of overwriting correct letters
  const handleRevealHint = useCallback(() => {
    if (submitted || answerChars.length === 0) return;
    const maxHint = Math.max(1, answerChars.length - 1);
    if (hintLevel >= maxHint) return;

    const latestVals = valuesRef.current;
    const targetIdx = answerChars.findIndex(
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
      } else if ((e.key === ' ' || e.code === 'Space') && flatIdx < boxes.length - 1) {
        e.preventDefault();
        inputRefs.current[flatIdx + 1]?.focus();
        inputRefs.current[flatIdx + 1]?.select?.();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (!values.every((v) => !v)) {
          handleCheck();
        }
      }
    },
    [values, boxes.length, showResultModal, handleCheck]
  );

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
      if (e.key === 'Enter' && !submitted && !values.every((v) => !v)) {
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

  let partOffset = 0;
  const firstLetter = (d.answer || '').trim()[0]?.toUpperCase() || 'A';
  const userTyped = values.join('');
  const maxPartLetters = Math.max(...answerParts.map((p) => p.length), 1);
  const dims = getSlotDimensions(maxPartLetters);
  const canHint =
    !submitted &&
    hintLevel < Math.max(1, totalLetters - 1) &&
    answerChars.some((ch, idx) => cleanCharForSlot(values[idx]) !== cleanCharForSlot(ch));

  return (
    <div className="w-full flex flex-col items-center justify-center select-none font-comfortaa py-1 px-2">
      {/* ── Main Compact Crayon Card ── */}
      <div className="w-full max-w-xl bg-white rounded-[24px] sm:rounded-[28px] border-[3px] border-[#342e2b] px-3.5 sm:px-6 py-3.5 sm:py-4 shadow-[4px_6px_0px_#2c2523] relative transition-all">
        {/* Top Mascot Hint & Report Header */}
        <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b-2 border-stone-100">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFF5EB] border border-[#E76F51]/40 text-[#D36135] text-[11px] sm:text-xs font-bold min-w-0">
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
              Churbito gợi ý: Từ gồm {totalLetters} ký tự, bắt đầu &apos;{firstLetter}&apos;
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

        {/* Sub-header with Audio Trigger */}
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <span className="text-stone-700 font-semibold text-xs sm:text-sm">
            Điền từ tiếng Anh thích hợp:
          </span>
          <button
            type="button"
            onClick={playAudio}
            aria-label="Phát âm từ vựng"
            className="w-9 h-9 rounded-full bg-sky-100 hover:bg-sky-200 border-2 border-stone-800 text-sky-800 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-2xs cursor-pointer shrink-0"
            title="Nghe phát âm từ cần điền"
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

        {/* Passage Sentence with Highlighted Blank Word */}
        <div className="text-center font-crayon leading-relaxed text-sm sm:text-lg text-stone-800 max-w-xl mx-auto tracking-wide mb-2.5 px-1">
          {d.sentence ? (
            renderSentence(d.sentence, submitted ? d.answer : values.join('') || '_____')
          ) : (
            <p className="text-sm sm:text-base font-bold text-stone-800">
              &quot;{d.meaningHint || d.meaning || '...'}&quot;
            </p>
          )}
        </div>

        {/* Compact Action Toolbar: Hint + Clear */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-2.5">
          <button
            type="button"
            onClick={handleRevealHint}
            disabled={!canHint}
            title="Điền chữ cái kế tiếp còn thiếu/sai (Alt+H)"
            className="px-3 py-1 bg-amber-50 border-2 border-stone-800 rounded-full text-amber-900 hover:bg-amber-100 font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-[1.5px_1.5px_0px_#2B2523] active:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-600 inline shrink-0" />
            <span>Gợi ý ({hintLevel}/{totalLetters})</span>
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
                          'border-[3px] border-[#3b6e8c] bg-sky-100 text-[#1D5CA8] shadow-[2px_3px_0px_#2B2523] scale-110 z-10';
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
                          data-fill-index={flatIdx}
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
            disabled={!!submitted || values.every((v) => !v)}
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
