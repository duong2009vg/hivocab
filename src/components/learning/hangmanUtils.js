// src/components/learning/hangmanUtils.js
// Pure game logic & normalization helpers for ExerciseHangman

export const MAX_HANGMAN_WRONG = 10;
export const MAX_HANGMAN_HINTS = 2;

export const QWERTY_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

/**
 * Normalize single input key/character to A-Z or '' if non-letter.
 */
export function normalizeHangmanChar(raw) {
  if (!raw) return '';
  const cleaned = String(raw)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
  return cleaned.length === 1 ? cleaned : '';
}

/**
 * Extract unique guessable A-Z letters from the answer word/phrase.
 */
export function getGuessableUniqueLetters(answer) {
  const seen = new Set();
  for (const ch of String(answer || '')) {
    const norm = normalizeHangmanChar(ch);
    if (norm) seen.add(norm);
  }
  return Array.from(seen);
}

/**
 * Split answer into spaced word groups, marking A-Z letters as guessable
 * while keeping hyphens/apostrophes/digits auto-revealed.
 */
export function buildWordBlankParts(answer) {
  return String(answer || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      [...word].map((rawChar) => {
        const norm = normalizeHangmanChar(rawChar);
        if (norm) {
          return { displayChar: norm, guessKey: norm, isGuessable: true };
        }
        return { displayChar: rawChar, guessKey: null, isGuessable: false };
      })
    );
}

/**
 * Compute current Hangman round status from target answer & guessed letters.
 */
export function evaluateHangmanState(answer, guessedLetters, maxWrong = MAX_HANGMAN_WRONG) {
  const uniqueTarget = getGuessableUniqueLetters(answer);
  const targetSet = new Set(uniqueTarget);
  const guessedSet = new Set((guessedLetters || []).map((c) => String(c).toUpperCase()));

  const wrongLetters = [];
  const rightLetters = [];
  for (const letter of guessedSet) {
    if (targetSet.has(letter)) {
      rightLetters.push(letter);
    } else {
      wrongLetters.push(letter);
    }
  }

  const wrongCount = wrongLetters.length;
  const won =
    uniqueTarget.length === 0
      ? Boolean(String(answer || '').trim())
      : uniqueTarget.every((ch) => guessedSet.has(ch));
  const lost = !won && wrongCount >= maxWrong;
  const status = won ? 'won' : lost ? 'lost' : 'playing';

  return {
    uniqueTarget,
    wrongLetters,
    rightLetters,
    wrongCount,
    remainingLives: Math.max(0, maxWrong - wrongCount),
    won,
    lost,
    status,
  };
}

/**
 * Pick one unguessed letter for the Hint bulb button.
 */
export function pickHangmanHintLetter(answer, guessedLetters) {
  const uniqueTarget = getGuessableUniqueLetters(answer);
  const guessedSet = new Set((guessedLetters || []).map((c) => String(c).toUpperCase()));
  const unguessed = uniqueTarget.filter((ch) => !guessedSet.has(ch));
  if (unguessed.length === 0) return null;
  return unguessed[0];
}
