/**
 * soundEngine.js - HiVocab Sound Effects Engine
 * Quản lý phát âm thanh phản hồi cho các tính năng học tập:
 * - Âm thanh khi trả lời đúng (correct sound)
 * - Âm thanh khi trả lời sai (incorrect sound)
 * - Âm thanh khi hoàn thành phiên học (complete session study)
 * Hỗ trợ preload zero-latency, click nhanh liên tục, và bật/tắt âm thanh (Mute/Unmute).
 */

const HiSound = (() => {
    const SOUNDS = {
        correct: [
            'data/sound/correct.mp3',
            'data/sound/correct%20sound.mp3',
            'data/sound/correct sound.mp3'
        ],
        incorrect: [
            'data/sound/incorrect.mp3',
            'data/sound/incorrect%20sound.mp3',
            'data/sound/incorrect sound.mp3'
        ],
        complete: [
            'data/sound/complete.mp3',
            'data/sound/complete%20session%20study.mp3',
            'data/sound/complete session study.mp3'
        ]
    };

    let _isMuted = false;
    try {
        _isMuted = localStorage.getItem('hivocab_sound_muted') === 'true';
    } catch (e) {}

    // Preloaded Audio objects cache
    const _audioPool = {
        correct: [],
        incorrect: [],
        complete: null
    };

    function _createAudio(srcList, volume = 0.85) {
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

    function _initPool() {
        if (typeof window === 'undefined' || typeof Audio === 'undefined') return;
        try {
            // Preload 3 instances for correct & incorrect to support rapid sequential clicks
            if (_audioPool.correct.length === 0) {
                for (let i = 0; i < 3; i++) {
                    const c = _createAudio(SOUNDS.correct, 0.9);
                    const ic = _createAudio(SOUNDS.incorrect, 0.85);
                    if (c) _audioPool.correct.push(c);
                    if (ic) _audioPool.incorrect.push(ic);
                }
            }
            if (!_audioPool.complete) {
                _audioPool.complete = _createAudio(SOUNDS.complete, 1.0);
            }
        } catch (e) {
            console.warn('[HiSound] Audio preload error:', e);
        }
    }

    let _correctIdx = 0;
    let _incorrectIdx = 0;

    function playSound(type) {
        if (_isMuted) return;
        try {
            if (type === 'correct') {
                if (_audioPool.correct.length === 0) _initPool();
                const audio = _audioPool.correct.length > 0 ? _audioPool.correct[_correctIdx % _audioPool.correct.length] : null;
                _correctIdx++;
                if (audio) {
                    audio.currentTime = 0;
                    audio.play().catch(() => {});
                }
            } else if (type === 'incorrect') {
                if (_audioPool.incorrect.length === 0) _initPool();
                const audio = _audioPool.incorrect.length > 0 ? _audioPool.incorrect[_incorrectIdx % _audioPool.incorrect.length] : null;
                _incorrectIdx++;
                if (audio) {
                    audio.currentTime = 0;
                    audio.play().catch(() => {});
                }
            } else if (type === 'complete') {
                if (!_audioPool.complete) _initPool();
                const audio = _audioPool.complete;
                if (audio) {
                    audio.currentTime = 0;
                    audio.play().catch(() => {});
                }
            }
        } catch (err) {
            // Silently ignore browser audio constraints
        }
    }

    function isMuted() {
        return _isMuted;
    }

    function setMuted(muted) {
        _isMuted = !!muted;
        try {
            localStorage.setItem('hivocab_sound_muted', String(_isMuted));
        } catch (e) {}
        updateMuteUI();
    }

    function toggleMute() {
        setMuted(!_isMuted);
        return _isMuted;
    }

    function updateMuteUI() {
        if (typeof document === 'undefined') return;
        document.querySelectorAll('.hi-sound-toggle-btn').forEach(btn => {
            const icon = btn.querySelector('.material-symbols-outlined') || btn;
            if (_isMuted) {
                if (icon.tagName === 'SPAN') icon.textContent = 'volume_off';
                btn.setAttribute('title', 'Bật âm thanh học tập');
                btn.classList.add('opacity-50', 'text-outline');
                btn.classList.remove('text-primary');
            } else {
                if (icon.tagName === 'SPAN') icon.textContent = 'volume_up';
                btn.setAttribute('title', 'Tắt âm thanh học tập');
                btn.classList.remove('opacity-50', 'text-outline');
                btn.classList.add('text-primary');
            }
        });
    }

    // Auto init on page load
    if (typeof window !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                _initPool();
                updateMuteUI();
            });
        } else {
            _initPool();
            updateMuteUI();
        }
    }

    return {
        playCorrect: () => playSound('correct'),
        playIncorrect: () => playSound('incorrect'),
        playComplete: () => playSound('complete'),
        isMuted,
        setMuted,
        toggleMute,
        updateMuteUI
    };
})();

/**
 * HiAudio - Multi-layer English Pronunciation Audio Engine for Web & Mobile iOS/Android
 * Khắc phục triệt để lỗi câm tiếng trên iPhone / iOS (Silent Switch, WebKit SpeechSynthesis bug):
 * - Tầng 1: HTML5 Audio Stream (Youdao CDN: US accent, định dạng MP3 trực tiếp).
 *   -> ĐẶC BIỆT: Chạy qua Media Channel trên iOS Safari, phát ra tiếng ngay cả khi iPhone bật Cần gạt rung / Chế độ im lặng (Silent Mode)!
 * - Tầng 2: Free Dictionary API MP3 Audio (Oxford / Cambridge native recording).
 * - Tầng 3: Web Speech API (SpeechSynthesis) với đầy đủ bug-fixes cho iOS/Safari:
 *   -> Không gọi cancel() ngay trước speak() (tránh WebKit abort bug).
 *   -> Tự động resume() nếu paused.
 *   -> Giữ reference _activeUtterance tránh Garbage Collection.
 */
const HiAudio = (() => {
    let _activeAudio = null;
    let _activeUtterance = null;
    const _dictAudioCache = new Map();

    // 1-sample silent WAV base64 để unlock audio channel trên iOS Safari
    const SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

    // Tạo sẵn Audio element để tái sử dụng và unlock ngay trên user interaction đầu tiên
    let _unlocked = false;
    function _getAudio() {
        if (!_activeAudio && typeof Audio !== 'undefined') {
            _activeAudio = new Audio();
            _activeAudio.preload = 'auto';
        }
        return _activeAudio;
    }

    function _unlockIOSAudio() {
        if (_unlocked) return;
        _unlocked = true;

        // 1. Unlock HTML5 Audio Media Channel trên iOS
        try {
            const audio = _getAudio();
            if (audio) {
                audio.src = SILENT_WAV;
                audio.play().then(() => {
                    audio.pause();
                    audio.currentTime = 0;
                }).catch(() => {});
            }
        } catch (_) {}

        // 2. Unlock Web Speech API & voices
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

    // Lắng nghe tương tác đầu tiên của người dùng trên mobile & desktop
    if (typeof window !== 'undefined') {
        ['touchstart', 'touchend', 'pointerdown', 'mousedown', 'keydown'].forEach(evt => {
            window.addEventListener(evt, _unlockIOSAudio, { once: true, passive: true });
        });

        if (window.speechSynthesis) {
            try {
                window.speechSynthesis.addEventListener('voiceschanged', () => {
                    window.speechSynthesis.getVoices();
                });
            } catch (_) {}
        }
    }

    function stop() {
        if (_activeAudio) {
            try {
                _activeAudio.pause();
                _activeAudio.currentTime = 0;
            } catch (_) {}
        }
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            try {
                if (window.speechSynthesis.speaking) {
                    window.speechSynthesis.cancel();
                }
            } catch (_) {}
            _activeUtterance = null;
        }
    }

    function _sanitizeWordForSpeech(text) {
        if (!text || typeof text !== 'string') return '';
        return text
            .replace(/\(.*?\)/g, '')       // Bỏ chú thích (phr v), (adj), v.v.
            .replace(/\[.*?\]/g, '')       // Bỏ [brackets]
            .replace(/\/.*?\//g, '')       // Bỏ /phonetics/
            .replace(/['"]/g, '')          // Bỏ dấu ngoặc kép
            .trim();
    }

    function _speakWithSpeechSynthesis(text, rate = 0.9) {
        if (typeof window === 'undefined' || !window.speechSynthesis) return false;
        try {
            if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
            }
            const utter = new SpeechSynthesisUtterance(text);
            _activeUtterance = utter;
            utter.lang = 'en-US';
            utter.rate = Math.max(0.4, Math.min(1.5, Number(rate) || 0.9));
            utter.pitch = 1.0;

            const voices = window.speechSynthesis.getVoices() || [];
            const preferred = voices.find(v => (v.lang === 'en-US' || v.lang.startsWith('en')) && (v.name.includes('Google') || v.name.includes('Natural') || !v.localService))
                           || voices.find(v => v.lang === 'en-US')
                           || voices.find(v => v.lang.startsWith('en'));
            if (preferred) utter.voice = preferred;

            utter.onend = () => { _activeUtterance = null; };
            utter.onerror = () => { _activeUtterance = null; };

            window.speechSynthesis.speak(utter);
            return true;
        } catch (err) {
            console.warn('[HiAudio] SpeechSynthesis error:', err);
            return false;
        }
    }

    function playWord(word, rate = 0.9) {
        if (!word || typeof word !== 'string') return false;
        const cleanWord = _sanitizeWordForSpeech(word);
        if (!cleanWord) return false;

        stop();

        const safeRate = Math.max(0.4, Math.min(2.0, Number(rate) || 0.9));
        const key = cleanWord.toLowerCase();

        // 1. Kiểm tra cache Free Dictionary API audio
        const cachedUrl = _dictAudioCache.get(key);
        const audioUrl = cachedUrl || `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(cleanWord)}&type=2`;

        // 2. ƯU TIÊN SỐ 1: HTML5 Audio stream (Youdao / Dict MP3)
        // -> Cực kỳ quan trọng cho iOS: HTML5 Audio dùng Media channel, phát ra tiếng ngay cả khi iPhone bật gạt rung im lặng (Silent Mode)
        try {
            const audio = _getAudio();
            if (audio) {
                audio.src = audioUrl;
                audio.playbackRate = safeRate;

                // Xử lý fallback nếu URL MP3 gặp lỗi mạng
                audio.onerror = () => {
                    console.warn('[HiAudio] Audio stream error, fallback to SpeechSynthesis');
                    _speakWithSpeechSynthesis(cleanWord, safeRate);
                };

                const p = audio.play();
                if (p && typeof p.catch === 'function') {
                    p.catch(err => {
                        if (err.name === 'AbortError') return;
                        console.warn('[HiAudio] Audio play failed, fallback to SpeechSynthesis:', err);
                        _speakWithSpeechSynthesis(cleanWord, safeRate);
                    });
                }
                return true;
            }
        } catch (audioErr) {
            console.warn('[HiAudio] HTML5 Audio init error:', audioErr);
        }

        // 3. Fallback: Web Speech API nếu không thể tạo Audio element
        return _speakWithSpeechSynthesis(cleanWord, safeRate);
    }

    return {
        playWord,
        stop,
        unlock: _unlockIOSAudio
    };
})();

if (typeof window !== 'undefined') {
    window.HiSound = HiSound;
    window.HiAudio = HiAudio;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HiSound, HiAudio };
}

