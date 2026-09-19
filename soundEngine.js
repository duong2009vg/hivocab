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
 * HiAudio - Multi-layer English Pronunciation Audio Engine
 * Cung cấp phát âm thanh từ vựng tiếng Anh đa tầng, chống lỗi câm tiếng / silent bug trên mọi trình duyệt:
 * - Tầng 1: Google TTS CDN audio stream (nhanh, tự nhiên, hỗ trợ tốc độ 1.0x và 0.6x mượt mà)
 * - Tầng 2: Web Speech API (SpeechSynthesis) với đầy đủ bug-fixes cho Chrome/Safari (resume, cancel timing, GC retention)
 * - Tầng 3: Free Dictionary API audio MP3 fallback
 */
const HiAudio = (() => {
    let _activeAudio = null;
    let _activeUtterance = null;
    const _dictAudioCache = new Map();

    // Khởi động voices cho SpeechSynthesis ngay khi có tương tác
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        try {
            window.speechSynthesis.getVoices();
            window.speechSynthesis.addEventListener('voiceschanged', () => {
                window.speechSynthesis.getVoices();
            });
            window.addEventListener('pointerdown', () => {
                if (window.speechSynthesis) window.speechSynthesis.getVoices();
            }, { once: true });
        } catch (_) {}
    }

    function stop() {
        if (_activeAudio) {
            try {
                _activeAudio.pause();
                _activeAudio.currentTime = 0;
            } catch (_) {}
            _activeAudio = null;
        }
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            try {
                window.speechSynthesis.cancel();
            } catch (_) {}
            _activeUtterance = null;
        }
    }

    function _playAudioElement(url, rate = 1.0) {
        return new Promise((resolve, reject) => {
            try {
                const audio = new Audio();
                _activeAudio = audio;
                audio.src = url;
                audio.playbackRate = Math.max(0.4, Math.min(2.0, rate));
                audio.onended = () => {
                    _activeAudio = null;
                    resolve(true);
                };
                audio.onerror = (err) => {
                    _activeAudio = null;
                    reject(err);
                };
                const playPromise = audio.play();
                if (playPromise && typeof playPromise.catch === 'function') {
                    playPromise.catch(reject);
                }
            } catch (err) {
                reject(err);
            }
        });
    }

    function _playSpeechSynthesis(text, rate = 0.9) {
        return new Promise((resolve) => {
            if (typeof window === 'undefined' || !window.speechSynthesis) {
                resolve(false);
                return;
            }
            try {
                // Chromium bug fix: resume nếu bị paused
                if (window.speechSynthesis.paused) {
                    window.speechSynthesis.resume();
                }
                if (window.speechSynthesis.speaking) {
                    window.speechSynthesis.cancel();
                }

                setTimeout(() => {
                    try {
                        const utter = new SpeechSynthesisUtterance(text);
                        _activeUtterance = utter; // Ngăn V8 garbage collection huỷ âm thanh
                        utter.lang = 'en-US';
                        utter.rate = Math.max(0.4, Math.min(1.5, rate));
                        utter.pitch = 1;

                        const voices = window.speechSynthesis.getVoices() || [];
                        const preferred = voices.find(v => (v.lang === 'en-US' || v.lang.startsWith('en')) && (v.name.includes('Google') || v.name.includes('Natural') || !v.localService))
                                       || voices.find(v => v.lang === 'en-US')
                                       || voices.find(v => v.lang.startsWith('en'));
                        if (preferred) utter.voice = preferred;

                        utter.onend = () => {
                            _activeUtterance = null;
                            resolve(true);
                        };
                        utter.onerror = () => {
                            _activeUtterance = null;
                            resolve(false);
                        };

                        window.speechSynthesis.speak(utter);
                    } catch (_) {
                        _activeUtterance = null;
                        resolve(false);
                    }
                }, 30);
            } catch (_) {
                resolve(false);
            }
        });
    }

    async function playWord(word, rate = 0.9) {
        if (!word || typeof word !== 'string') return false;
        const cleanWord = word.trim();
        if (!cleanWord) return false;

        stop();

        const key = cleanWord.toLowerCase();

        // 1. Thử cached URL nếu đã có
        const cachedUrl = _dictAudioCache.get(key);
        if (cachedUrl) {
            try {
                await _playAudioElement(cachedUrl, rate);
                return true;
            } catch (_) {}
        }

        // 2. Thử Google Translate TTS CDN (chuẩn giọng bản ngữ, độ trễ cực thấp)
        const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(cleanWord)}`;
        try {
            await _playAudioElement(googleUrl, rate);
            return true;
        } catch (_) {}

        // 3. Fallback Web Speech API (đã fix pause bug và GC retention)
        const ttsOk = await _playSpeechSynthesis(cleanWord, rate);
        if (ttsOk) return true;

        // 4. Fallback Free Dictionary API audio
        try {
            const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`);
            if (res.ok) {
                const json = await res.json();
                const phonetics = Array.isArray(json) ? json[0]?.phonetics : [];
                const audioUrl = phonetics?.find(p => p.audio && p.audio.trim())?.audio;
                if (audioUrl) {
                    _dictAudioCache.set(key, audioUrl);
                    await _playAudioElement(audioUrl, rate);
                    return true;
                }
            }
        } catch (_) {}

        return false;
    }

    return {
        playWord,
        stop
    };
})();

if (typeof window !== 'undefined') {
    window.HiSound = HiSound;
    window.HiAudio = HiAudio;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HiSound, HiAudio };
}

