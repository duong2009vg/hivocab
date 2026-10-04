// src/components/learning/ExerciseFill.jsx
// 100% Pixel-Perfect match to Google Stitch design (both Desktop & Mobile)
// Fill-in-the-blank letter boxes — Pure React with Pop-up Result Notification.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ExerciseResultModal from './ExerciseResultModal.jsx';

function renderSentence(sentence, targetWord) {
  if (!sentence) return null;
  if (sentence.includes('___') || sentence.includes('---')) {
    const parts = sentence.split(/_{2,}|-{2,}/);
    return (
      <>
        {parts[0]}
        <span className="inline-block px-3 sm:px-4 py-0.5 sm:py-1 mx-1.5 sm:mx-2 bg-sky-50 text-[#3b6e8c] font-bold rounded-xl border-2 border-[#3b6e8c] crayon-blank-highlight shadow-xs align-baseline">
          {targetWord || '____'}
        </span>
        {parts[1] || ''}
      </>
    );
  }
  return sentence;
}

function getSlotDimensions(maxPartLen) {
  if (maxPartLen <= 4) {
    return {
      slot: 'w-10 sm:w-13 h-13 sm:h-16 text-xl sm:text-3xl rounded-xl sm:rounded-2xl',
      gap: 'gap-1.5 sm:gap-3',
      gapBetweenWords: 'gap-x-3 sm:gap-x-4 gap-y-2.5 sm:gap-y-3',
    };
  }
  if (maxPartLen <= 6) {
    return {
      slot: 'w-8.5 sm:w-12 h-11 sm:h-15 text-lg sm:text-2xl rounded-lg sm:rounded-2xl',
      gap: 'gap-1 sm:gap-2.5',
      gapBetweenWords: 'gap-x-2.5 sm:gap-x-3.5 gap-y-2 sm:gap-y-2.5',
    };
  }
  if (maxPartLen <= 8) {
    return {
      slot: 'w-7 sm:w-11 h-9.5 sm:h-14 text-base sm:text-xl rounded-lg sm:rounded-xl',
      gap: 'gap-1 sm:gap-2',
      gapBetweenWords: 'gap-x-2 sm:gap-x-3 gap-y-2',
    };
  }
  if (maxPartLen <= 10) {
    return {
      slot: 'w-6 sm:w-10 h-8.5 sm:h-13 text-sm sm:text-lg rounded-md sm:rounded-xl',
      gap: 'gap-0.5 sm:gap-1.5',
      gapBetweenWords: 'gap-x-2 gap-y-1.5',
    };
  }
  if (maxPartLen <= 12) {
    return {
      slot: 'w-[22px] sm:w-9 h-8 sm:h-12 text-xs sm:text-base rounded-md sm:rounded-lg',
      gap: 'gap-0.5 sm:gap-1',
      gapBetweenWords: 'gap-x-1.5 gap-y-1.5',
    };
  }
  return {
    slot: 'w-5 sm:w-8 h-7.5 sm:h-11 text-xs sm:text-sm rounded-md sm:rounded-lg',
    gap: 'gap-0.5 sm:gap-1',
    gapBetweenWords: 'gap-x-1 gap-y-1',
  };
}

export default function ExerciseFill({ item, onSubmit, onReport, sessionInfo }) {
  const d = item?.exerciseData || {};
  const answer = (d.answer || '').trim();
  const answerParts = d.answerParts?.length
    ? d.answerParts
    : answer.split(/\s+/).filter(Boolean);
  const totalLetters = d.letters || answerParts.join('').length;

  // Build flat array of { partIdx, letterIdx } for each input box
  const boxes = answerParts.flatMap((part, pi) =>
    [...part].map((_, li) => ({ partIdx: pi, letterIdx: li }))
  );

  const [values, setValues] = useState(() => boxes.map(() => ''));
  const [hintLevel, setHintLevel] = useState(0);
  const [submitted, setSubmitted] = useState(null); // { correct, correctAnswer }
  const [showResultModal, setShowResultModal] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(0);
  const inputRefs = useRef([]);

  const currentNum = sessionInfo?.currentNum ?? 1;
  const totalNum = sessionInfo?.totalNum ?? 10;

  // Reset on new item
  useEffect(() => {
    setValues(boxes.map(() => ''));
    setHintLevel(0);
    setSubmitted(null);
    setShowResultModal(false);
    setFocusedIdx(0);
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 120);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

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
        const chars = raw
          .toUpperCase()
          .replace(/[^A-Z0-9\-']/g, '')
          .split('');
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
          inputRefs.current[nextIdx]?.select();
        }, 10);
        return;
      }
      const char = raw.slice(-1).toUpperCase();
      setValues((prev) => {
        const n = [...prev];
        n[flatIdx] = char;
        return n;
      });
      if (e.target) e.target.scrollLeft = 0;
      if (flatIdx < boxes.length - 1) {
        setTimeout(() => {
          const next = inputRefs.current[flatIdx + 1];
          if (next) {
            next.focus();
            next.select();
            next.scrollLeft = 0;
          }
        }, 10);
      }
    },
    [submitted, boxes.length]
  );

  const handleKeyDown = useCallback(
    (e, flatIdx) => {
      if (showResultModal) return;
      if (e.key === 'Backspace') {
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
        inputRefs.current[flatIdx - 1]?.select();
      } else if (e.key === 'ArrowRight' && flatIdx < boxes.length - 1) {
        e.preventDefault();
        inputRefs.current[flatIdx + 1]?.focus();
        inputRefs.current[flatIdx + 1]?.select();
      } else if ((e.key === ' ' || e.code === 'Space') && flatIdx < boxes.length - 1) {
        e.preventDefault();
        inputRefs.current[flatIdx + 1]?.focus();
        inputRefs.current[flatIdx + 1]?.select();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleCheck();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [values, boxes.length, showResultModal]
  );

  const handleRevealHint = useCallback(() => {
    if (submitted) return;
    const answerChars = (d.answer || '').replace(/\s+/g, '').split('');
    const maxHint = Math.max(1, answerChars.length - 1);
    if (hintLevel >= maxHint) return;

    setValues((prev) => {
      const n = [...prev];
      n[hintLevel] = (answerChars[hintLevel] || '').toUpperCase();
      return n;
    });

    const el = inputRefs.current[hintLevel];
    if (el) {
      el.classList.add('border-[#3b6e8c]', 'bg-sky-100', 'scale-110');
      setTimeout(() => el.classList.remove('scale-110'), 250);
    }
    setHintLevel((h) => h + 1);

    setTimeout(() => {
      const nextInp = inputRefs.current[Math.min(hintLevel + 1, boxes.length - 1)];
      nextInp?.focus();
      nextInp?.select();
    }, 60);
  }, [submitted, d.answer, hintLevel, boxes.length]);

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

  const handleModalContinue = useCallback(() => {
    setShowResultModal(false);
    setValues(boxes.map(() => ''));
    setSubmitted(null);
    setHintLevel(0);
  }, [boxes]);

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
    if (window.HiAudio?.playWord) {
      window.HiAudio.playWord(word, 0.9);
    } else if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(word);
      u.lang = 'en-US';
      window.speechSynthesis.speak(u);
    }
  }, [d.answer]);

  let partOffset = 0;
  const firstLetter = (d.answer || '').trim()[0]?.toUpperCase() || 'A';
  const userTyped = values.join('');

  // Calculate dynamic dimensions for mobile fit
  const maxPartLetters = Math.max(...answerParts.map((p) => p.length), 1);
  const dims = getSlotDimensions(maxPartLetters);

  // Formatted preview of user typing with spaces between words
  const userTypedPreview = answerParts
    .map((part, pi) => {
      const start = answerParts.slice(0, pi).reduce((acc, p) => acc + p.length, 0);
      return [...part].map((_, li) => values[start + li] || '_').join('');
    })
    .join(' ');

  return (
    <div className="w-full flex flex-col items-center select-none font-comfortaa">
      {/* ── Main Big Crayon Card ── */}
      <div className="w-full max-w-2xl bg-white rounded-[28px] sm:rounded-[36px] border-[3px] border-[#342e2b] p-3.5 sm:p-8 md:p-10 shadow-[4px_6px_0px_#2c2523] relative transition-all">
        {/* Subtle decorative washi tape on top-right corner */}
        <div className="absolute -top-3 -right-3 w-14 h-7 bg-amber-200/80 border-2 border-[#342e2b] rotate-12 pointer-events-none rounded-sm shadow-xs hidden sm:block"></div>

        {/* Sub-header with Audio Trigger (Reliable SVG) */}
        <div className="flex items-center justify-center gap-2 mb-3 sm:mb-5">
          <span className="text-stone-700 font-semibold text-sm sm:text-lg md:text-xl">
            Điền từ tiếng Anh có nghĩa:
          </span>
          <button
            type="button"
            onClick={playAudio}
            aria-label="Phát âm từ vựng"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-sky-100 hover:bg-sky-200 border-2 border-stone-800 text-sky-800 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-xs cursor-pointer"
            title="Nghe phát âm từ cần điền"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-sky-800" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Passage Sentence with Highlighted Blank Word */}
        <div className="text-center font-crayon leading-relaxed sm:leading-[2.4rem] text-lg sm:text-2xl text-stone-800 max-w-2xl mx-auto tracking-wide mb-4 sm:mb-6 px-1">
          {d.sentence ? (
            renderSentence(d.sentence, submitted ? d.answer : values.join('') || '_____')
          ) : (
            <p className="text-base sm:text-xl font-bold text-stone-800">
              "{d.meaningHint || d.meaning || '...'}"
            </p>
          )}
        </div>

        {/* Mascot Churbito In-Context Hint Box */}
        <div className="max-w-xl mx-auto bg-[#fff7ef] rounded-2xl border-2 border-stone-800/90 py-2 px-3 sm:px-5 mb-4 flex items-center justify-center gap-2 sm:gap-3 shadow-[2px_3px_0px_#2c2523]">
          <span className="text-xl sm:text-2xl filter drop-shadow-xs">🐯</span>
          <p className="text-stone-700 text-xs sm:text-sm font-quicksand font-semibold">
            <span className="font-crayon font-bold text-amber-900">Churbito gợi ý:</span> Từ gồm{' '}
            <span className="font-bold text-stone-900 underline decoration-amber-500">
              {totalLetters} ký tự
            </span>{' '}
            bắt đầu bằng <span className="font-bold text-amber-800 font-crayon text-base sm:text-lg">'{firstLetter}'</span>
          </p>
        </div>

        {/* Hint Expand Pill Toggle */}
        <div className="flex justify-center mb-3 sm:mb-5">
          <button
            type="button"
            onClick={handleRevealHint}
            disabled={hintLevel >= Math.max(1, totalLetters - 1) || !!submitted}
            className="crayon-dashed px-4 sm:px-5 py-1 sm:py-1.5 rounded-full text-stone-700 hover:text-stone-900 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition hover:bg-stone-50 border-stone-400 cursor-pointer shadow-xs disabled:opacity-40"
          >
            <span className="text-amber-600">💡</span>
            <span>Gợi ý ({hintLevel}/{totalLetters})</span>
            <svg className="w-3.5 h-3.5 text-stone-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* ── Live Word Preview Bar (Always Fits & Crystal Clear on Mobile) ── */}
        <div className="w-full max-w-md mx-auto mb-3 px-1">
          <div className="bg-[#FAF5EB] border-2 border-[#2B2523] rounded-2xl py-2 px-3 sm:px-4 shadow-[2px_2px_0px_#2B2523] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-500 shrink-0">
              <span className="text-sm">✏️</span>
              <span className="hidden xs:inline">Từ đang gõ:</span>
            </div>
            <div className="flex-1 text-center font-mono font-black text-sm sm:text-lg text-[#2B4566] tracking-wider truncate px-1">
              {userTyped ? (
                <span className="text-stone-900 font-extrabold">{userTypedPreview}</span>
              ) : (
                <span className="text-stone-400 font-medium italic text-xs">Chạm ô để gõ từng chữ cái...</span>
              )}
            </div>
            {userTyped && !submitted && (
              <button
                type="button"
                onClick={handleClearAll}
                className="px-2 py-0.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-bold shrink-0 transition cursor-pointer"
                title="Xóa hết để nhập lại"
              >
                Xóa
              </button>
            )}
          </div>
        </div>

        {/* ── Letters Input Box Row (Responsive & Mobile-Fit with Word Wrapping) ── */}
        <div
          className="w-full max-w-full overflow-x-auto py-1.5 mb-3 sm:mb-5 no-scrollbar"
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

                    let slotClass = `${dims.slot} flex items-center justify-center font-mono font-bold transition-all shrink-0 `;

                    if (!submitted) {
                      if (isActive) {
                        slotClass +=
                          'bg-sky-50 border-[3px] border-blue-600 ring-2 ring-sky-200 shadow-[2px_3px_0px_#2c2523] text-blue-700';
                      } else if (isFilled) {
                        slotClass +=
                          'bg-white border-2 border-stone-800 shadow-[1.5px_2px_0px_#2c2523] text-stone-800';
                      } else {
                        slotClass +=
                          'bg-stone-50/50 border-2 border-stone-300 border-dashed text-stone-400';
                      }
                    } else {
                      if (submitted.correct) {
                        slotClass +=
                          'bg-green-50 border-[2.5px] border-green-600 shadow-xs text-green-700';
                      } else {
                        slotClass +=
                          'bg-red-50 border-[2.5px] border-red-500 shadow-xs text-red-600';
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

        {/* Keyboard Navigation Instructions - Desktop Only */}
        <div className="hidden sm:flex text-center font-quicksand text-xs md:text-sm text-stone-500 font-medium mb-5 sm:mb-6 items-center justify-center gap-2 flex-wrap">
          <span>Gõ ký tự trên bàn phím</span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-stone-300"></span>
          <span>
            Nhấn{' '}
            <kbd className="px-2 py-0.5 bg-stone-100 border border-stone-400/70 rounded-md font-mono text-xs text-stone-700 font-semibold shadow-2xs">
              Backspace
            </kbd>{' '}
            để lùi ô
          </span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-stone-300"></span>
          <span>
            <kbd className="px-2 py-0.5 bg-stone-100 border border-stone-400/70 rounded-md font-mono text-xs text-stone-700 font-semibold shadow-2xs">
              Enter
            </kbd>{' '}
            để kiểm tra
          </span>
        </div>

        {/* Primary Action Button: Kiểm tra đáp án (Reliable SVG) */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleCheck}
            disabled={!!submitted}
            className="w-full max-w-md py-3 sm:py-4 px-6 sm:px-8 bg-[#3b6e8c] hover:bg-[#34617c] active:bg-[#2b5168] text-white font-crayon text-base sm:text-xl font-bold rounded-2xl border-[3px] border-stone-800 shadow-[3px_5px_0px_#2c2523] hover:translate-y-0.5 active:translate-y-1 transition-all flex items-center justify-center gap-2 sm:gap-3 cursor-pointer disabled:opacity-60"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Kiểm tra đáp án</span>
          </button>
        </div>
      </div>

      {/* ── Companion Mascot Encouragement Bar ── */}
      <div className="w-full max-w-3xl mt-4 sm:mt-5 flex items-center justify-between gap-3 px-2">
        <div className="flex items-center gap-3 bg-white/90 py-2 px-4 rounded-3xl border-2 border-stone-800 shadow-[2px_3px_0px_#2c2523]">
          <div className="w-10 h-10 rounded-full border-2 border-stone-800 overflow-hidden bg-amber-100 flex items-center justify-center text-xl shrink-0">
            🐯
          </div>
          <div>
            <p className="text-xs sm:text-sm font-crayon font-bold text-stone-800">
              Churbito đang cổ vũ bạn hoàn thành bài học! 🌿
            </p>
            <p className="text-[11px] font-quicksand text-stone-500 font-semibold">
              Đang học từ {currentNum} / {totalNum} • Cố lên nào!
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onReport}
          aria-label="Báo lỗi nội dung"
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white border-2 border-stone-800 shadow-[2px_3px_0px_#2c2523] hover:translate-y-0.5 active:translate-y-1 transition-all flex items-center justify-center text-stone-600 hover:text-red-500 hover:bg-red-50 shrink-0 cursor-pointer"
          title="Báo lỗi bài tập này"
        >
          <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* ── Pop-up Result Notification Modal ── */}
      <ExerciseResultModal
        isOpen={showResultModal}
        isCorrect={!!submitted?.correct}
        word={d.answer}
        meaning={d.meaning || d.meaningHint}
        userAnswer={userTyped}
        onContinue={handleModalContinue}
      />
    </div>
  );
}
