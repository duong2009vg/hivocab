// src/services/sound.js
// Audio Pronunciation & Sound FX Service for HiVocab

export function playWordAudio(word) {
  if (!word) return;

  // 1. Prioritize Cloudflare / TTS backend if available
  if (typeof window !== 'undefined' && window.HiAudio && typeof window.HiAudio.playWord === 'function') {
    try {
      window.HiAudio.playWord(word);
      return;
    } catch (_) {}
  }

  // 2. Dictionary fallback
  if (typeof window !== 'undefined' && window.HiDict && typeof window.HiDict.playWordAudio === 'function') {
    try {
      window.HiDict.playWordAudio(word);
      return;
    } catch (_) {}
  }

  // 3. Native Browser Web Speech API fallback
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch (_) {}
  }
}

export function playSound(type) {
  if (typeof window !== 'undefined' && window.soundEngine && typeof window.soundEngine.play === 'function') {
    try {
      window.soundEngine.play(type);
    } catch (_) {}
  }
}

export const sound = {
  playWordAudio,
  playSound,
};

export default sound;
