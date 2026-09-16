/**
 * HiVocab Audio & Sound Effects Service
 */
export const playSuccessSound = () => {
  if (typeof window !== 'undefined' && window.soundEngine && typeof window.soundEngine.playCorrect === 'function') {
    window.soundEngine.playCorrect();
  }
};

export const playWrongSound = () => {
  if (typeof window !== 'undefined' && window.soundEngine && typeof window.soundEngine.playWrong === 'function') {
    window.soundEngine.playWrong();
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
