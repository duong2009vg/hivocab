/**
 * HiVocab Audio & Sound Effects Service
 */
export const playSuccessSound = () => {
  if (typeof window !== 'undefined' && window.HiSound && typeof window.HiSound.playCorrect === 'function') {
    window.HiSound.playCorrect();
  }
};

export const playWrongSound = () => {
  if (typeof window !== 'undefined' && window.HiSound && typeof window.HiSound.playIncorrect === 'function') {
    window.HiSound.playIncorrect();
  }
};

export const speakWord = (word, lang = 'en-US') => {
  if (typeof window !== 'undefined' && window.soundEngine && typeof window.soundEngine.speak === 'function') {
    window.soundEngine.speak(word, lang);
  } else if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
  }
};

export default {
  playSuccessSound,
  playWrongSound,
  speakWord,
};
