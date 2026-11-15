// src/components/learning/letterSlotUtils.js
// Shared answer-formatting helpers for multi-word slotted exercises (Fill & Listen)

/**
 * Assemble submitted answer string aligned word-for-word with answerParts,
 * filling empty slots with '_' so grading compares exact word boundaries.
 */
export function buildTypedAnswerForParts(answerParts, values) {
  let cursor = 0;
  return answerParts
    .map((part) => {
      const slice = values
        .slice(cursor, cursor + part.length)
        .map((v) => v || '_')
        .join('');
      cursor += part.length;
      return slice;
    })
    .join(' ');
}

/**
 * Format user-entered letters cleanly with spaces between words for UI & modal display.
 */
export function formatTypedDisplayForParts(answerParts, values) {
  let cursor = 0;
  return answerParts
    .map((part) => {
      const slice = values.slice(cursor, cursor + part.length).join('');
      cursor += part.length;
      return slice;
    })
    .filter(Boolean)
    .join(' ');
}
