// src/components/learning/WordSlotsGrid.jsx
// Clean underline-style word typing canvas (inspired by minimal dictation underline UX)
// Single native hidden input for zero-lag typing on Desktop + Mobile + per-keystroke SFX.
import React, { useState, useMemo } from 'react';
import { HiSound } from '../../services/audioService.js';

function cleanTypedChars(raw) {
  if (!raw) return '';
  return String(raw)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^A-Za-z0-9\-']/g, '');
}

function getTypographyScale(maxPartLen, totalChars) {
  if (maxPartLen <= 8 && totalChars <= 16) {
    return {
      text: 'text-[30px] sm:text-[42px]',
      caret: 'h-[32px] sm:h-[44px]',
      minCharEm: 0.72,
      minHeight: 'min-h-[46px] sm:min-h-[60px]',
      wordGap: 'gap-x-6 sm:gap-x-9 gap-y-5 sm:gap-y-6',
    };
  }
  if (maxPartLen <= 12 && totalChars <= 26) {
    return {
      text: 'text-[26px] sm:text-[36px]',
      caret: 'h-[28px] sm:h-[38px]',
      minCharEm: 0.68,
      minHeight: 'min-h-[42px] sm:min-h-[54px]',
      wordGap: 'gap-x-5 sm:gap-x-8 gap-y-4 sm:gap-y-5',
    };
  }
  return {
    text: 'text-[22px] sm:text-[30px]',
    caret: 'h-[24px] sm:h-[32px]',
    minCharEm: 0.64,
    minHeight: 'min-h-[38px] sm:min-h-[46px]',
    wordGap: 'gap-x-4 sm:gap-x-6 gap-y-4',
  };
}

export default function WordSlotsGrid({
  answerParts,
  totalBoxes,
  values,
  submitted,
  focusedIdx,
  hintPulseIdx,
  inputRefs,
  dataAttrName = 'data-slot-index',
  onFocusSlot,
  onSetValues,
  onCheckSubmit,
}) {
  const [isFocused, setIsFocused] = useState(false);

  const partMeta = useMemo(() => {
    let offset = 0;
    return answerParts.map((part, pi) => {
      const start = offset;
      const end = offset + part.length - 1;
      offset += part.length;
      return { part, pi, start, end, length: part.length };
    });
  }, [answerParts]);

  const maxPartLen = useMemo(
    () => Math.max(...answerParts.map((p) => p.length), 1),
    [answerParts]
  );
  const scale = getTypographyScale(maxPartLen, totalBoxes);

  const focusNativeInput = (targetIdx) => {
    if (submitted) return;
    const clamped = Math.max(0, Math.min(totalBoxes, targetIdx));
    onFocusSlot(clamped);
    const inp = inputRefs?.current?.[0];
    if (inp) {
      inp.focus({ preventScroll: true });
    }
  };

  // Place cursor at the natural next empty slot inside a clicked word
  const handleClickWord = (meta, e) => {
    e.stopPropagation();
    if (submitted) return;
    let targetIdx = meta.end + 1;
    for (let i = meta.start; i <= meta.end; i += 1) {
      if (!values[i]) {
        targetIdx = i;
        break;
      }
    }
    focusNativeInput(Math.min(targetIdx, totalBoxes));
  };

  const handleClickCanvas = () => {
    if (submitted) return;
    const firstEmpty = values.findIndex((v, i) => i < totalBoxes && !v);
    focusNativeInput(firstEmpty >= 0 ? firstEmpty : totalBoxes);
  };

  const applyTypedText = (rawText) => {
    if (submitted || !rawText) return;

    // Handle standalone space typed via mobile/desktop input event
    if (rawText === ' ') {
      handleSpaceAdvance();
      return;
    }

    const cleaned = cleanTypedChars(rawText);
    if (!cleaned) return;

    const chars = cleaned.split('');
    const startIdx = Math.min(focusedIdx, Math.max(0, totalBoxes - 1));
    const nextVals = [...values];
    let cursor = startIdx;

    for (let i = 0; i < chars.length; i += 1) {
      if (cursor >= totalBoxes) break;
      nextVals[cursor] = chars[i];
      cursor += 1;
    }

    // Check if the last typed character completed a word boundary
    const lastFilledIdx = cursor - 1;
    const completedWord = partMeta.some(
      (m) => lastFilledIdx === m.end && nextVals.slice(m.start, m.end + 1).every(Boolean)
    );
    HiSound.playKeyType(completedWord && answerParts.length > 1 ? 'wordComplete' : 'char');

    onSetValues(nextVals);
    onFocusSlot(Math.min(cursor, totalBoxes));
  };

  const handleSpaceAdvance = () => {
    if (submitted) return;
    HiSound.playKeyType('space');

    // Find current word segment
    const currentWord = partMeta.find((m) => focusedIdx >= m.start && focusedIdx <= m.end);
    if (!currentWord) return;

    // If user is already at the start of a word (empty) after auto-advance, keep cursor there
    if (currentWord.pi > 0 && focusedIdx === currentWord.start && !values[focusedIdx]) {
      return;
    }

    // Jump smoothly to the start of the next word if one exists
    const nextWord = partMeta[currentWord.pi + 1];
    if (nextWord) {
      onFocusSlot(nextWord.start);
    }
  };

  const handleBackspace = () => {
    if (submitted) return;
    const nextVals = [...values];

    // If cursor is on an occupied slot (e.g. clicked directly on a letter), clear that slot
    if (focusedIdx < totalBoxes && nextVals[focusedIdx]) {
      nextVals[focusedIdx] = '';
      HiSound.playKeyType('backspace');
      onSetValues(nextVals);
      return;
    }

    // Otherwise delete the character right before the caret
    if (focusedIdx > 0) {
      const prevIdx = focusedIdx - 1;
      nextVals[prevIdx] = '';
      HiSound.playKeyType('backspace');
      onSetValues(nextVals);
      onFocusSlot(prevIdx);
    }
  };

  const SENTINEL = '\u200B';

  const handleKeyDown = (e) => {
    if (submitted) return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      handleBackspace();
      return;
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (focusedIdx > 0) onFocusSlot(focusedIdx - 1);
      return;
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (focusedIdx < totalBoxes) onFocusSlot(focusedIdx + 1);
      return;
    }

    if ((e.key === ' ' || e.code === 'Space') && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      handleSpaceAdvance();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (values.some(Boolean)) {
        onCheckSubmit?.();
      }
    }
  };

  const handleChange = (e) => {
    const raw = e.target.value;
    e.target.value = SENTINEL;
    try {
      e.target.setSelectionRange?.(1, 1);
    } catch (_) {}

    // Android/iOS soft-keyboard Backspace removes the sentinel character
    if (raw === '') {
      handleBackspace();
      return;
    }

    const stripped = raw.replace(/\u200B/g, '');
    if (!stripped) return;
    applyTypedText(stripped);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData?.getData('text') || '';
    if (pasted) applyTypedText(pasted);
  };

  const dataProps = { [dataAttrName]: 0 };

  return (
    <div
      className="relative w-full py-5 sm:py-7 px-2 sm:px-4 mb-3 cursor-text select-none rounded-2xl transition-colors"
      onClick={handleClickCanvas}
    >
      {/* Single real native input with sentinel for bulletproof Desktop + Mobile typing & Backspace */}
      <input
        ref={(el) => {
          if (inputRefs?.current) {
            inputRefs.current[0] = el;
          }
        }}
        type="text"
        defaultValue={SENTINEL}
        disabled={!!submitted}
        {...dataProps}
        aria-label="Nhập đáp án tiếng Anh"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        inputMode="text"
        onFocus={(e) => {
          setIsFocused(true);
          e.target.value = SENTINEL;
          try {
            e.target.setSelectionRange?.(1, 1);
          } catch (_) {}
        }}
        onBlur={() => setIsFocused(false)}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        className="absolute left-1/2 top-1/2 w-px h-px opacity-0 pointer-events-none text-[16px]"
      />

      {/* Spacious Word-by-Word Underline Canvas */}
      <div className={`flex flex-wrap items-end justify-center ${scale.wordGap} mx-auto max-w-full`}>
        {partMeta.map((meta) => {
          const wordChars = values.slice(meta.start, meta.end + 1);
          const isWordFilled = wordChars.some(Boolean);
          const isCaretInsideWord =
            !submitted &&
            ((focusedIdx >= meta.start && focusedIdx <= meta.end) ||
              (focusedIdx === totalBoxes && meta.pi === partMeta.length - 1));

          // Underline color state (matches crisp reference look + semantic feedback)
          let underlineClass = 'border-b-[2.5px] sm:border-b-[3px] transition-all duration-150 ';
          if (submitted) {
            underlineClass += submitted.correct
              ? 'border-[#3D7A46]'
              : 'border-[#D34E36]';
          } else if (isCaretInsideWord && isFocused) {
            underlineClass += 'border-[#2B5D9E]';
          } else if (isCaretInsideWord) {
            underlineClass += 'border-[#2B5D9E]/80';
          } else if (isWordFilled) {
            underlineClass += 'border-[#9B9082]';
          } else {
            underlineClass += 'border-[#D6CEC1] hover:border-[#B5AA9A]';
          }

          // Compute exact caret position relative to typed characters in this word
          const caretLocalIdx = isCaretInsideWord
            ? focusedIdx === totalBoxes && meta.pi === partMeta.length - 1
              ? meta.length
              : focusedIdx - meta.start
            : -1;

          // Build display letters (preserve gaps only if user skipped ahead via hint)
          const lastTypedLocal = (() => {
            for (let i = meta.length - 1; i >= 0; i -= 1) {
              if (wordChars[i]) return i;
            }
            return -1;
          })();

          const renderedSlots = [];
          const displayLength = Math.max(
            lastTypedLocal + 1,
            caretLocalIdx >= 0 ? Math.min(caretLocalIdx, meta.length) : 0
          );

          for (let li = 0; li < displayLength; li += 1) {
            const flatIdx = meta.start + li;
            const ch = wordChars[li] || '';
            const isPulsed = hintPulseIdx === flatIdx;

            if (caretLocalIdx === li) {
              renderedSlots.push(
                <span
                  key={`caret-${flatIdx}`}
                  aria-hidden="true"
                  className={`inline-block w-[2.5px] sm:w-[3px] ${scale.caret} bg-[#2B5D9E] rounded-full align-middle mx-[1px] ${
                    isFocused ? 'hi-typing-caret' : 'opacity-45'
                  }`}
                />
              );
            }

            if (ch) {
              renderedSlots.push(
                <span
                  key={`char-${flatIdx}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    focusNativeInput(flatIdx);
                  }}
                  className={`inline-block transition-transform duration-150 ${
                    submitted
                      ? submitted.correct
                        ? 'text-[#2B6135]'
                        : 'text-[#B83822]'
                      : isPulsed
                      ? 'text-[#2B5D9E] scale-115'
                      : 'text-[#2B2523]'
                  }`}
                >
                  {ch}
                </span>
              );
            } else {
              // Empty gap before a later hinted letter
              renderedSlots.push(
                <span
                  key={`gap-${flatIdx}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    focusNativeInput(flatIdx);
                  }}
                  className="inline-block w-[0.55em] text-center text-[#CFC6B8]"
                >
                  ·
                </span>
              );
            }
          }

          // Caret at end of word (after last typed character or on completely empty active word)
          if (caretLocalIdx >= displayLength && caretLocalIdx >= 0) {
            renderedSlots.push(
              <span
                key={`caret-end-${meta.pi}`}
                aria-hidden="true"
                className={`inline-block w-[2.5px] sm:w-[3px] ${scale.caret} bg-[#2B5D9E] rounded-full align-middle mx-[1px] ${
                  isFocused ? 'hi-typing-caret' : 'opacity-45'
                }`}
              />
            );
          }

          return (
            <div
              key={`${meta.pi}-${meta.part}`}
              onClick={(e) => handleClickWord(meta, e)}
              style={{ minWidth: `${Math.max(1.4, meta.length * scale.minCharEm)}em` }}
              className={`relative inline-flex items-end justify-center px-1.5 pb-1.5 ${scale.minHeight} ${scale.text} font-sans font-bold tracking-[0.03em] leading-none cursor-text ${underlineClass}`}
            >
              {renderedSlots.length > 0 ? (
                <span className="inline-flex items-center justify-center whitespace-pre">
                  {renderedSlots}
                </span>
              ) : (
                <span className="opacity-0 select-none" aria-hidden="true">
                  a
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
