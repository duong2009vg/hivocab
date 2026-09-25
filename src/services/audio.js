// src/services/audio.js
// HiVocab Unified Audio Engine: Sound Effects + Zero-Latency Pronunciation + iOS Safari Unlock

const SOUND_MUTED_KEY = 'hivocab_sound_muted';

let _isMuted = false;
try {
    if (typeof localStorage !== 'undefined') {
        _isMuted = localStorage.getItem(SOUND_MUTED_KEY) === 'true';
    }
} catch (_) {}

// Web Audio API Context (Zero file dependency, instant sound synthesis)
let _audioCtx = null;
let _iosUnlocked = false;

function _getAudioContext() {
    if (_audioCtx) return _audioCtx;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
        _audioCtx = new AudioCtx();
    }
    return _audioCtx;
}

// Unlock Web Audio API & HTML5 Audio for iOS Safari on first user interaction
export function unlockAudio() {
    if (_iosUnlocked || typeof window === 'undefined') return;
    _iosUnlocked = true;

    try {
        const ctx = _getAudioContext();
        if (ctx && ctx.state === 'suspended') {
            ctx.resume();
        }
        if (ctx) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            gain.gain.value = 0.001;
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.05);
        }
    } catch (_) {}

    try {
        if (window.speechSynthesis) {
            window.speechSynthesis.getVoices();
            if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
            }
        }
    } catch (_) {}
}

if (typeof window !== 'undefined') {
    ['touchstart', 'touchend', 'pointerdown', 'mousedown', 'keydown'].forEach(evt => {
        window.addEventListener(evt, unlockAudio, { once: true, passive: true });
    });
}

// ─────────────────────────────────────────────────────────────
// 1. TẠO HIỆU ỨNG ÂM THANH BẰNG WEB AUDIO API (KHÔNG SỢ LỖI FILE 404)
// ─────────────────────────────────────────────────────────────

function _playTone(freqList, duration = 0.15, type = 'sine') {
    if (_isMuted) return;
    try {
        const ctx = _getAudioContext();
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();

        const now = ctx.currentTime;
        let timeOffset = 0;

        freqList.forEach(({ freq, dur = duration, vol = 0.25 }) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, now + timeOffset);

            gain.gain.setValueAtTime(vol, now + timeOffset);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + timeOffset + dur);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + timeOffset);
            osc.stop(now + timeOffset + dur);

            timeOffset += dur * 0.75;
        });
    } catch (_) {}
}

export function playCorrect() {
    // Hai nốt vui tươi C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz)
    _playTone([
        { freq: 523.25, dur: 0.09, vol: 0.22 },
        { freq: 659.25, dur: 0.12, vol: 0.26 },
        { freq: 783.99, dur: 0.22, vol: 0.28 }
    ], 0.12, 'sine');
}

export function playIncorrect() {
    // Hai nốt trầm cảnh báo F3 (174Hz) -> D3 (146Hz)
    _playTone([
        { freq: 196.00, dur: 0.14, vol: 0.25 },
        { freq: 146.83, dur: 0.25, vol: 0.28 }
    ], 0.15, 'sawtooth');
}

export function playComplete() {
    // Fanfare chúc mừng chiến thắng
    _playTone([
        { freq: 440.00, dur: 0.10, vol: 0.25 },
        { freq: 554.37, dur: 0.10, vol: 0.25 },
        { freq: 659.25, dur: 0.12, vol: 0.28 },
        { freq: 880.00, dur: 0.35, vol: 0.32 }
    ], 0.14, 'triangle');
}

export function isMuted() {
    return _isMuted;
}

export function toggleMute() {
    _isMuted = !_isMuted;
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(SOUND_MUTED_KEY, String(_isMuted));
        }
    } catch (_) {}
    return _isMuted;
}

// ─────────────────────────────────────────────────────────────
// 2. PHÁT ÂM TỪ VỰNG ZERO-DELAY (YOUDAO + CAMBRIDGE + WEB SPEECH)
// ─────────────────────────────────────────────────────────────

let _currentAudio = null;

export function stopAudio() {
    if (_currentAudio) {
        try {
            _currentAudio.pause();
            _currentAudio.currentTime = 0;
        } catch (_) {}
        _currentAudio = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        try {
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }
        } catch (_) {}
    }
}

function _cleanWordForSpeech(text) {
    if (!text || typeof text !== 'string') return '';
    return text
        .replace(/\(.*?\)/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/\/.*?\//g, '')
        .replace(/['"]/g, '')
        .trim();
}

function _speakTTS(text, lang = 'en-US', rate = 0.9) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = lang;
        utter.rate = rate;

        const voices = window.speechSynthesis.getVoices() || [];
        const preferred = voices.find(v => (v.lang === lang || v.lang.startsWith('en')) && (v.name.includes('Google') || v.name.includes('Natural') || !v.localService))
                       || voices.find(v => v.lang === lang)
                       || voices.find(v => v.lang.startsWith('en'));
        if (preferred) utter.voice = preferred;

        window.speechSynthesis.speak(utter);
    } catch (_) {}
}

export function playWord(word, customUrl = null, lang = 'en-US') {
    if (!word) return;
    const cleanWord = _cleanWordForSpeech(word);
    if (!cleanWord) return;

    stopAudio();

    if (customUrl) {
        try {
            const a = new Audio(customUrl);
            _currentAudio = a;
            a.onerror = () => _speakTTS(cleanWord, lang, 0.9);
            const p = a.play();
            if (p && typeof p.catch === 'function') {
                p.catch(() => _speakTTS(cleanWord, lang, 0.9));
            }
            return;
        } catch (_) {}
    }

    // Youdao CDN cực nhanh cho cả US (type=2) và UK (type=1)
    const type = (lang === 'en-GB') ? 1 : 2;
    try {
        const a = new Audio(`https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(cleanWord)}&type=${type}`);
        _currentAudio = a;
        a.onerror = () => _speakTTS(cleanWord, lang, 0.9);
        const p = a.play();
        if (p && typeof p.catch === 'function') {
            p.catch(() => _speakTTS(cleanWord, lang, 0.9));
        }
        return;
    } catch (_) {}

    _speakTTS(cleanWord, lang, 0.9);
}

export function playUK(word, customUrl = null) {
    playWord(word, customUrl, 'en-GB');
}

export function playUS(word, customUrl = null) {
    playWord(word, customUrl, 'en-US');
}

// Khả năng tương thích ngược
if (typeof window !== 'undefined') {
    window.HiAudio = {
        playWord,
        playUK,
        playUS,
        stop: stopAudio,
        unlockIOSAudio: unlockAudio,
    };
    window.HiSound = {
        playCorrect,
        playIncorrect,
        playComplete,
        isMuted,
        toggleMute,
    };
}

export default {
    playCorrect,
    playIncorrect,
    playComplete,
    playWord,
    playUK,
    playUS,
    stopAudio,
    isMuted,
    toggleMute,
    unlockAudio,
};
