// src/services/audioService.js
// 100% Pure ES Module Audio Engine for Sound Effects & Multi-Layer English Pronunciation
// Replaces soundEngine.js completely with full iOS/Safari silent mode unlock and multi-layer fallback.

const SOUND_PATHS = {
  correct: [
    '/data/sound/correct.mp3',
    '/data/sound/correct%20sound.mp3',
    '/data/sound/correct sound.mp3',
  ],
  incorrect: [
    '/data/sound/incorrect.mp3',
    '/data/sound/incorrect%20sound.mp3',
    '/data/sound/incorrect sound.mp3',
  ],
  complete: [
    '/data/sound/complete.mp3',
    '/data/sound/complete%20session%20study.mp3',
    '/data/sound/complete session study.mp3',
  ],
};

// ─── HiSound (Hiệu ứng trả lời đúng / sai / hoàn thành) ────────────────────────
class SoundEngine {
  constructor() {
    this._isMuted = false;
    this._audioPool = {
      correct: [],
      incorrect: [],
      complete: null,
    };
    this._correctIdx = 0;
    this._incorrectIdx = 0;

    if (typeof window !== 'undefined') {
      try {
        this._isMuted = localStorage.getItem('hivocab_sound_muted') === 'true';
      } catch (_) {}
      this._initPool();
    }
  }

  _createAudio(srcList, volume = 0.85) {
    if (typeof Audio === 'undefined') return null;
    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = volume;
    audio.src = srcList[0];
    let attempt = 0;
    audio.onerror = () => {
      attempt++;
      if (attempt < srcList.length) {
        audio.src = srcList[attempt];
        audio.load();
      }
    };
    return audio;
  }

  _initPool() {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return;
    try {
      if (this._audioPool.correct.length === 0) {
        for (let i = 0; i < 3; i++) {
          const c = this._createAudio(SOUND_PATHS.correct, 0.9);
          const ic = this._createAudio(SOUND_PATHS.incorrect, 0.85);
          if (c) this._audioPool.correct.push(c);
          if (ic) this._audioPool.incorrect.push(ic);
        }
      }
      if (!this._audioPool.complete) {
        this._audioPool.complete = this._createAudio(SOUND_PATHS.complete, 1.0);
      }
    } catch (e) {
      console.warn('[SoundEngine] Init pool error:', e);
    }
  }

  playSound(type) {
    if (this._isMuted) return;
    try {
      if (type === 'correct') {
        if (this._audioPool.correct.length === 0) this._initPool();
        const audio = this._audioPool.correct[this._correctIdx % (this._audioPool.correct.length || 1)];
        this._correctIdx++;
        if (audio) {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        }
      } else if (type === 'incorrect') {
        if (this._audioPool.incorrect.length === 0) this._initPool();
        const audio = this._audioPool.incorrect[this._incorrectIdx % (this._audioPool.incorrect.length || 1)];
        this._incorrectIdx++;
        if (audio) {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        }
      } else if (type === 'complete') {
        if (!this._audioPool.complete) this._initPool();
        const audio = this._audioPool.complete;
        if (audio) {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        }
      }
    } catch (_) {}
  }

  playCorrect() {
    this.playSound('correct');
  }

  playIncorrect() {
    this.playSound('incorrect');
  }

  playComplete() {
    this.playSound('complete');
  }

  isMuted() {
    return this._isMuted;
  }

  setMuted(muted) {
    this._isMuted = Boolean(muted);
    try {
      localStorage.setItem('hivocab_sound_muted', String(this._isMuted));
    } catch (_) {}
  }

  toggleMute() {
    this.setMuted(!this._isMuted);
    return this._isMuted;
  }
}

export const HiSound = new SoundEngine();

// ─── HiAudio (Phát âm từ vựng đa tầng cho Web & iOS) ──────────────────────────
const SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

class AudioEngine {
  constructor() {
    this._activeAudio = null;
    this._activeUtterance = null;
    this._dictAudioCache = new Map();
    this._unlocked = false;

    if (typeof window !== 'undefined') {
      ['touchstart', 'touchend', 'pointerdown', 'mousedown', 'keydown'].forEach((evt) => {
        window.addEventListener(evt, () => this.unlock(), { once: true, passive: true });
      });

      if (window.speechSynthesis) {
        try {
          window.speechSynthesis.addEventListener('voiceschanged', () => {
            window.speechSynthesis.getVoices();
          });
        } catch (_) {}
      }
    }
  }

  _getAudio() {
    if (!this._activeAudio && typeof Audio !== 'undefined') {
      this._activeAudio = new Audio();
      this._activeAudio.preload = 'auto';
    }
    return this._activeAudio;
  }

  unlock() {
    if (this._unlocked) return;
    this._unlocked = true;

    // 1. Unlock HTML5 Audio Channel trên iOS
    try {
      const audio = this._getAudio();
      if (audio) {
        audio.src = SILENT_WAV;
        audio.play().then(() => {
          audio.pause();
          audio.currentTime = 0;
        }).catch(() => {});
      }
    } catch (_) {}

    // 2. Unlock Web Speech API
    try {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.getVoices();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        const silentUtter = new SpeechSynthesisUtterance('');
        window.speechSynthesis.speak(silentUtter);
      }
    } catch (_) {}
  }

  stop() {
    if (this._activeAudio) {
      try {
        this._activeAudio.pause();
        this._activeAudio.currentTime = 0;
      } catch (_) {}
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }
      } catch (_) {}
      this._activeUtterance = null;
    }
  }

  _sanitizeWordForSpeech(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/\/.*?\//g, '')
      .replace(/['"`]/g, '')
      .replace(/\.{2,}/g, ' ')
      .replace(/[/_]/g, ' ')
      .replace(/[-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  _speakWithSpeechSynthesis(text, rate = 0.9, lang = 'en-US') {
    if (typeof window === 'undefined' || !window.speechSynthesis) return false;
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      const utter = new SpeechSynthesisUtterance(text);
      this._activeUtterance = utter;
      const targetLang = lang === 'en-GB' || lang === 'uk' ? 'en-GB' : 'en-US';
      utter.lang = targetLang;
      utter.rate = Math.max(0.4, Math.min(1.5, Number(rate) || 0.9));
      utter.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices() || [];
      const preferred =
        voices.find(
          (v) =>
            (v.lang === targetLang || v.lang.startsWith(targetLang.slice(0, 2))) &&
            (v.name.includes('Google') || v.name.includes('Natural') || !v.localService)
        ) ||
        voices.find((v) => v.lang === targetLang) ||
        voices.find((v) => v.lang.startsWith('en'));

      if (preferred) utter.voice = preferred;

      utter.onend = () => {
        this._activeUtterance = null;
      };
      utter.onerror = () => {
        this._activeUtterance = null;
      };

      window.speechSynthesis.speak(utter);
      return true;
    } catch (err) {
      console.warn('[AudioEngine] SpeechSynthesis error:', err);
      return false;
    }
  }

  playWord(word, rate = 0.9, lang = 'en') {
    if (!word || typeof word !== 'string') return false;
    const cleanWord = this._sanitizeWordForSpeech(word);
    if (!cleanWord) return false;

    this.stop();

    const safeRate = Math.max(0.4, Math.min(2.0, Number(rate) || 0.9));
    const key = cleanWord.toLowerCase();

    // 1. Tầng 1: HTML5 Audio stream (Google TTS MP3 proxy)
    const cachedUrl = this._dictAudioCache.get(key);
    const audioUrl =
      cachedUrl ||
      `/api/tts?text=${encodeURIComponent(cleanWord)}&tl=${encodeURIComponent(lang || 'en')}`;

    try {
      const audio = this._getAudio();
      if (audio) {
        audio.src = audioUrl;
        audio.playbackRate = safeRate;

        audio.onerror = () => {
          this._speakWithSpeechSynthesis(cleanWord, safeRate, lang);
        };

        const p = audio.play();
        if (p && typeof p.catch === 'function') {
          p.catch((err) => {
            if (err.name === 'AbortError') return;
            this._speakWithSpeechSynthesis(cleanWord, safeRate, lang);
          });
        }
        return true;
      }
    } catch (_) {}

    // 2. Tầng 2: Web Speech API Fallback
    return this._speakWithSpeechSynthesis(cleanWord, safeRate, lang);
  }
}

export const HiAudio = new AudioEngine();

export function playWordAudio(word, rate = 0.9, lang = 'en') {
  return HiAudio.playWord(word, rate, lang);
}

// Expose globals for backward-compatibility
if (typeof window !== 'undefined') {
  window.HiSound = HiSound;
  window.HiAudio = HiAudio;
  window.playWordAudio = playWordAudio;
}

export default { HiSound, HiAudio, playWordAudio };
