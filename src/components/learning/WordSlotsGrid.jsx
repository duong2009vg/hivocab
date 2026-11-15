// src/components/learning/WordSlotsGrid.jsx
// Shared multi-word letter slot grid for Fill & Listen exercises with clear spacing per word

export default function WordSlotsGrid({
  answerParts,
  totalBoxes,
  values,
  dims,
  submitted,
  focusedIdx,
  hintPulseIdx,
  pulseSlotClass,
  inputRefs,
  dataAttrName = 'data-slot-index',
  onFocusSlot,
  onInput,
  onKeyDown,
  onBackspaceEmpty,
}) {
  let partOffset = 0;
  const isMultiWord = answerParts.length > 1;

  return (
    <div
      className="w-full max-w-full overflow-x-auto py-1 mb-2.5 no-scrollbar"
      style={{ WebkitOverflowScrolling: 'touch' }}
      onClick={(e) => {
        if (e.target.tagName !== 'INPUT') {
          const firstEmptyIdx = values.findIndex((v, i) => i < totalBoxes && !v);
          const targetIdx = firstEmptyIdx >= 0 ? firstEmptyIdx : Math.max(0, totalBoxes - 1);
          const target = inputRefs.current[targetIdx];
          target?.focus();
          target?.select?.();
        }
      }}
    >
      <div className={`flex flex-wrap items-start justify-center ${dims.gapBetweenWords} mx-auto px-1`}>
        {answerParts.map((part, pi) => {
          const startOffset = partOffset;
          partOffset += part.length;

          return (
            <div key={`${pi}-${part}`} className="inline-flex flex-col items-center gap-1 shrink-0 max-w-full">
              <div
                className={
                  isMultiWord
                    ? `inline-flex items-center ${dims.gap} flex-nowrap px-2 sm:px-2.5 py-1.5 rounded-2xl bg-[#FAF5EB]/85 border-2 border-[#2B2523]/15 shadow-2xs`
                    : `inline-flex items-center ${dims.gap} flex-nowrap shrink-0`
                }
              >
                {[...part].map((_, li) => {
                  const flatIdx = startOffset + li;
                  const val = values[flatIdx] || '';
                  const isFilled = !!val;
                  const isActive = focusedIdx === flatIdx && !submitted;
                  const isPulsed = hintPulseIdx === flatIdx;

                  let slotClass = `${dims.slot} flex items-center justify-center font-mono font-black transition-all duration-150 shrink-0 select-none `;

                  if (!submitted) {
                    if (isPulsed) {
                      slotClass += pulseSlotClass;
                    } else if (isActive) {
                      slotClass +=
                        'border-[3px] border-[#2B4566] bg-[#F1F7FF] text-[#2B4566] shadow-[2px_3px_0px_#2B2523] ring-3 ring-sky-300/60 scale-105 z-10';
                    } else if (isFilled) {
                      slotClass +=
                        'border-2 border-[#2B2523] bg-white text-stone-900 shadow-[1.5px_2px_0px_#2B2523] hover:border-stone-800';
                    } else {
                      slotClass +=
                        'border-2 border-stone-300 border-dashed text-stone-400 bg-white/80 shadow-2xs hover:bg-stone-50';
                    }
                  } else if (submitted.correct) {
                    slotClass +=
                      'border-[2.5px] border-[#3D7A46] bg-[#EEF8EC] text-[#2B6135] shadow-[2px_2.5px_0px_#2B6135]';
                  } else {
                    slotClass +=
                      'border-[2.5px] border-[#D34E36] bg-[#FDF0ED] text-[#B83822] shadow-[2px_2.5px_0px_#B83822]';
                  }

                  const dataProps = { [dataAttrName]: flatIdx };

                  return (
                    <div key={flatIdx} className={slotClass}>
                      <input
                        ref={(el) => (inputRefs.current[flatIdx] = el)}
                        type="text"
                        maxLength={2}
                        value={val}
                        disabled={!!submitted}
                        {...dataProps}
                        className="w-full h-full text-center bg-transparent focus:outline-none uppercase caret-transparent p-0 font-bold"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="characters"
                        spellCheck={false}
                        onFocus={(e) => {
                          onFocusSlot(flatIdx);
                          e.target.select?.();
                          e.target.scrollLeft = 0;
                          e.target.scrollIntoView?.({
                            behavior: 'smooth',
                            block: 'nearest',
                            inline: 'center',
                          });
                        }}
                        onBlur={(e) => {
                          e.target.scrollLeft = 0;
                        }}
                        onClick={(e) => {
                          onFocusSlot(flatIdx);
                          e.target.select?.();
                          e.target.scrollLeft = 0;
                        }}
                        onBeforeInput={(e) => {
                          if (e.inputType === 'deleteContentBackward' && !val && flatIdx > 0) {
                            e.preventDefault();
                            onBackspaceEmpty(flatIdx);
                          }
                        }}
                        onChange={(e) => onInput(e, flatIdx)}
                        onKeyDown={(e) => onKeyDown(e, flatIdx)}
                      />
                    </div>
                  );
                })}
              </div>

              {isMultiWord && (
                <span className="text-[10px] font-bold text-stone-500 font-quicksand leading-none">
                  Từ {pi + 1} ({part.length} chữ)
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
