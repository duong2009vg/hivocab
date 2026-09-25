/**
 * HiVocab Learning & Spaced Repetition Service (HiSession)
 * Manages SM-2 study queues, exercise rendering, and review progression
 */
export const getHiSession = () => {
  if (typeof window !== 'undefined' && window.HiSession) {
    return window.HiSession;
  }
  return null;
};

export const HiSession = (typeof window !== 'undefined' && window.HiSession) ? window.HiSession : null;
export default HiSession;
