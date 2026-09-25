/**
 * HiVocab Dictionary API Service
 * Endpoint: https://api.dictionaryapi.dev/api/v2/entries/en/{word}
 */
export async function lookupWord(word) {
  if (typeof window !== 'undefined' && typeof window.lookupWord === 'function') {
    return window.lookupWord(word);
  }
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.trim())}`);
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data[0] : null;
  } catch (err) {
    console.warn('[Dictionary] Lookup failed:', err);
    return null;
  }
}

export default {
  lookupWord,
};
