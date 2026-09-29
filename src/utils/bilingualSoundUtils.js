// src/utils/bilingualSoundUtils.js
// Audio effects (correct/incorrect/complete) & Text-to-speech helper

export function playSound(type) {
  if (typeof window === 'undefined') return;

  if (window.HiSound) {
    if (type === 'correct' && typeof window.HiSound.playCorrect === 'function') {
      window.HiSound.playCorrect();
      return;
    }
    if (type === 'incorrect' && typeof window.HiSound.playIncorrect === 'function') {
      window.HiSound.playIncorrect();
      return;
    }
    if (type === 'complete' && typeof window.HiSound.playComplete === 'function') {
      window.HiSound.playComplete();
      return;
    }
  }

  // Fallback HTML5 Audio
  const soundMap = {
    correct: 'data/sound/correct.mp3',
    incorrect: 'data/sound/incorrect.mp3',
    complete: 'data/sound/complete.mp3',
  };

  const src = soundMap[type];
  if (src && typeof Audio !== 'undefined') {
    try {
      const audio = new Audio(src);
      audio.volume = 0.8;
      audio.play().catch(() => {});
    } catch (_) {}
  }
}

export function speakWord(text) {
  if (!text || typeof window === 'undefined') return;

  if (typeof window.HiSpeak === 'function') {
    window.HiSpeak(text);
    return;
  }

  if (typeof window.HiAudio?.playWord === 'function') {
    window.HiAudio.playWord(text);
    return;
  }

  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    } catch (_) {}
  }
}
