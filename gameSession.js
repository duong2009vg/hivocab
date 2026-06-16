// ============================================================
// HI - UNITY GAME SESSION | Adventure Rabbit WebGL integration
// ============================================================

window.HiGameSession = (() => {
    const WORD_LIMIT = 20;
    const UNITY_ROOT = 'adventure-rabbit';
    const UNITY_BUILD_VERSION = '20260610-device-quiz-feedback-v2';
    const UNITY_LOADER = `${UNITY_ROOT}/Build/adventure-rabbit.loader.js?v=${UNITY_BUILD_VERSION}`;

    const userAgent = navigator.userAgent || '';
    const isMobileDevice = navigator.userAgentData?.mobile === true
        || /Android|iPhone|iPad|iPod|IEMobile|Opera Mini|Mobile/i.test(userAgent)
        || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    document.documentElement.dataset.mobileDevice = isMobileDevice ? 'true' : 'false';

    let _unityInstance = null;
    let _unityLoading = null;
    let _pendingPayload = null;
    let _mode = null;
    let _title = '';
    let _wordPool = [];
    let _failCounts = new Map();
    let _reviewed = new Set();
    let _stats = { correct: 0, wrong: 0 };

    function _esc(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function _normalizeWord(raw) {
        const word = _cleanText(raw.word || '');
        const meaning = _cleanMeaning(raw.meaning || raw.definition || '', word);
        return {
            wordId: raw.wordId || raw.id,
            word,
            meaning,
            phonetic: _cleanText(raw.phonetic || ''),
            exampleSentence: _cleanText(raw.exampleSentence || raw.example_sentence || ''),
            level: raw.level ?? 0,
        };
    }

    function _cleanText(value) {
        return String(value ?? '')
            .replace(/\s+/g, ' ')
            .replace(/\s+([,.;:!?])/g, '$1')
            .trim();
    }

    function _cleanMeaning(value, word = '') {
        let text = _cleanText(value);
        const key = _cleanText(word).toLowerCase();

        const certainFixes = new Map([
            ['arbitration|trng tài, phân x', 'Trọng tài, phân xử'],
            ['arbitration|trng tài, phân xử', 'Trọng tài, phân xử'],
            ['embarkation|s lên tàu / máy bay', 'Sự lên tàu / máy bay'],
            ['embarkation|sự lên tàu / máy bay', 'Sự lên tàu / máy bay'],
            ['carriage|toatàu', 'Toa tàu'],
            ['jetlag|say máy bay', 'Say máy bay'],
            ['wreck|làm hỏng, phá hủy, xáctàuxe', 'Làm hỏng, phá hủy, xác tàu xe'],
            ['travel sickness|việcsaytàuxe', 'Việc say tàu xe'],
        ]);

        const fixed = certainFixes.get(`${key}|${text.toLowerCase()}`);
        if (fixed) return fixed;

        return text
            .replace(/\bTrng tài\b/gi, 'Trọng tài')
            .replace(/\bphân x\b/gi, 'phân xử')
            .replace(/\bToatàu\b/g, 'Toa tàu')
            .replace(/\bxáctàuxe\b/g, 'xác tàu xe')
            .replace(/\bViệcsaytàuxe\b/g, 'Việc say tàu xe');
    }

    function _hasMojibake(value) {
        return /[�]|(?:Ã|Ä|Â|â|¤|»|¼|½|¿|™|œ|€)/.test(value);
    }

    function _isBadMeaning(item) {
        const meaning = _cleanText(item?.meaning || '');
        if (meaning.length < 2) return true;
        if (_hasMojibake(meaning)) return true;
        if (/\b(?:Trng|Lch|dch|tin ích|phân x|Toatàu|xáctàuxe|Việcsaytàuxe)\b/i.test(meaning)) return true;
        if (/(?:cól\s*ẽ|kx|cânnh|mơvề|kĩcái|nghnghĩ|tàuxe)/i.test(meaning)) return true;
        return false;
    }

    function _prepareWordPool(words) {
        return (words || [])
            .map(_normalizeWord)
            .filter(item => item.wordId && item.word && !_isBadMeaning(item));
    }

    function _setStatus(message, tone = 'default') {
        const el = document.getElementById('game-status');
        if (!el) return;
        el.className = `text-sm ${tone === 'error' ? 'text-error' : 'text-on-surface-variant'}`;
        el.textContent = message || '';
    }

    function _show(id, visible) {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.toggle('hidden', !visible);
    }

    function _setMobileGamePlaying(active) {
        document.documentElement.classList.toggle('mobile-game-playing', !!active);
        if (active) window.scrollTo(0, 0);
        _resizeUnityCanvasForMobile();
        requestAnimationFrame(() => {
            _resizeUnityCanvasForMobile();
            window.dispatchEvent(new Event('resize'));
        });
    }

    function _resizeUnityCanvasForMobile() {
        if (document.documentElement.dataset.mobileDevice !== 'true') return;
        if (!document.documentElement.classList.contains('mobile-game-playing')) return;

        const canvas = document.getElementById('unity-canvas');
        const viewport = document.getElementById('unity-viewport');
        const wrap = document.getElementById('unity-wrap');
        const width = Math.round(window.visualViewport?.width || window.innerWidth);
        const height = Math.round(window.visualViewport?.height || window.innerHeight);

        [wrap, viewport, canvas].forEach(el => {
            if (!el) return;
            el.style.width = `${width}px`;
            el.style.height = `${height}px`;
        });
    }

    function _setStageTitle(title) {
        const el = document.getElementById('game-unity-title');
        if (el) el.textContent = title || 'Adventure Rabbit';
    }

    async function startReviewMode() {
        if (typeof HiDB === 'undefined') {
            _setStatus('Chưa kết nối dữ liệu.', 'error');
            return;
        }
        _setStatus('Đang tải từ cần ôn...');
        try {
            const words = _prepareWordPool(await HiDB.getWordsDueForReview(WORD_LIMIT * 2)).slice(0, WORD_LIMIT);
            if (!words.length) {
                _setStatus('Hôm nay bạn chưa có từ nào cần ôn. Hãy thử chơi theo bài học.');
                return;
            }
            await _startUnityGame(words, 'Ôn tập hôm nay', 'review');
        } catch (err) {
            console.error('[HiGameSession] startReviewMode:', err);
            _setStatus(err.message || 'Không tải được phiên ôn tập.', 'error');
        }
    }

    async function loadLessonPicker() {
        const panel = document.getElementById('game-lesson-picker');
        const topicSelect = document.getElementById('game-topic-select');
        const lessonSelect = document.getElementById('game-lesson-select');
        if (!panel || !topicSelect || !lessonSelect) return;

        _show('game-lesson-picker', true);
        topicSelect.innerHTML = '<option>Đang tải chủ đề...</option>';
        lessonSelect.innerHTML = '<option>Chọn chủ đề trước</option>';
        _setStatus('');

        try {
            const topics = await HiDB.getTopics();
            window._gameTopics = topics || [];
            topicSelect.innerHTML = '<option value="">Chọn chủ đề</option>' + (topics || [])
                .filter(topic => topic.totalWords > 0)
                .map(topic => `<option value="${_esc(topic.id)}">${_esc(topic.name)} (${topic.totalWords} từ)</option>`)
                .join('');
        } catch (err) {
            console.error('[HiGameSession] loadLessonPicker:', err);
            topicSelect.innerHTML = '<option value="">Không tải được chủ đề</option>';
            _setStatus(err.message || 'Không tải được danh sách chủ đề.', 'error');
        }
    }

    async function loadLessonsForTopic(topicId) {
        const lessonSelect = document.getElementById('game-lesson-select');
        if (!lessonSelect) return;
        if (!topicId) {
            lessonSelect.innerHTML = '<option value="">Chọn chủ đề trước</option>';
            return;
        }

        lessonSelect.innerHTML = '<option>Đang tải bài học...</option>';
        try {
            const lessons = await HiDB.getLessonsInTopic(topicId);
            window._gameLessons = lessons || [];
            lessonSelect.innerHTML = '<option value="">Chọn bài học</option>' + (lessons || [])
                .filter(lesson => lesson.totalWords > 0)
                .map(lesson => `<option value="${lesson.index}">${_esc(lesson.name)} (${lesson.totalWords} từ)</option>`)
                .join('');
        } catch (err) {
            console.error('[HiGameSession] loadLessonsForTopic:', err);
            lessonSelect.innerHTML = '<option value="">Không tải được bài học</option>';
            _setStatus(err.message || 'Không tải được bài học.', 'error');
        }
    }

    async function startSelectedLesson() {
        const topicId = document.getElementById('game-topic-select')?.value;
        const lessonValue = document.getElementById('game-lesson-select')?.value;
        const lessonIndex = Number(lessonValue);
        if (!topicId || lessonValue === '' || Number.isNaN(lessonIndex)) {
            _setStatus('Hãy chọn chủ đề và bài học trước khi chơi.', 'error');
            return;
        }

        _setStatus('Đang tải từ trong bài học...');
        try {
            const topic = (window._gameTopics || []).find(t => t.id === topicId);
            const lesson = (window._gameLessons || []).find(l => l.index === lessonIndex);
            const words = _prepareWordPool(await HiDB.getWordsInLesson(topicId, lessonIndex)).slice(0, WORD_LIMIT);
            if (!words.length) {
                _setStatus('Bài học này chưa có từ để chơi.');
                return;
            }
            await _startUnityGame(words, `${topic?.name || 'Chủ đề'} · ${lesson?.name || `Lesson ${lessonIndex + 1}`}`, 'lesson');
        } catch (err) {
            console.error('[HiGameSession] startSelectedLesson:', err);
            _setStatus(err.message || 'Không bắt đầu được game.', 'error');
        }
    }

    async function _startUnityGame(words, title, mode) {
        _mode = mode;
        _title = title;
        _wordPool = words;
        _failCounts = new Map();
        _reviewed = new Set();
        _stats = { correct: 0, wrong: 0 };
        _pendingPayload = { mode, title, words };

        _show('game-home', false);
        _show('game-lesson-picker', false);
        _show('game-stage', true);
        _setMobileGamePlaying(true);
        _setStageTitle(title);
        const progress = document.getElementById('unity-progress-bar');
        if (progress) progress.style.width = '0%';
        _setStatus('Đang tải Adventure Rabbit...');

        await _loadUnity();
        _sendPayloadToUnity();
    }

    function _loadScript(src) {
        return new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[data-unity-loader="${src}"]`);
            if (existing) {
                if (window.createUnityInstance) resolve();
                else existing.addEventListener('load', resolve, { once: true });
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.dataset.unityLoader = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Không tải được Unity loader: ${src}`));
            document.head.appendChild(script);
        });
    }

    async function _loadUnity() {
        if (_unityInstance) return _unityInstance;
        if (_unityLoading) return _unityLoading;

        const canvas = document.getElementById('unity-canvas');
        const progress = document.getElementById('unity-progress-bar');
        const wrapper = document.getElementById('unity-loading');
        if (!canvas) throw new Error('Thiếu #unity-canvas.');

        _unityLoading = (async () => {
            await _loadScript(UNITY_LOADER);
            if (typeof createUnityInstance !== 'function') {
                throw new Error('Unity loader chưa sẵn sàng. Hãy kiểm tra WebGL build.');
            }
            wrapper?.classList.remove('hidden');
            const config = {
                dataUrl: `${UNITY_ROOT}/Build/adventure-rabbit.data?v=${UNITY_BUILD_VERSION}`,
                frameworkUrl: `${UNITY_ROOT}/Build/adventure-rabbit.framework.js?v=${UNITY_BUILD_VERSION}`,
                codeUrl: `${UNITY_ROOT}/Build/adventure-rabbit.wasm?v=${UNITY_BUILD_VERSION}`,
                streamingAssetsUrl: `${UNITY_ROOT}/StreamingAssets`,
                companyName: 'Hi',
                productName: 'Adventure Rabbit Vocabulary',
                productVersion: '1.0',
            };
            _unityInstance = await createUnityInstance(canvas, config, value => {
                if (progress) progress.style.width = `${Math.round(value * 100)}%`;
            });
            wrapper?.classList.add('hidden');
            _setStatus('');
            return _unityInstance;
        })().catch(err => {
            _unityLoading = null;
            _setStatus(`${err.message}. Bạn cần build Unity WebGL vào thư mục adventure-rabbit/ trước.`, 'error');
            throw err;
        });

        return _unityLoading;
    }

    function _sendPayloadToUnity() {
        if (!_unityInstance || !_pendingPayload) return;
        const payload = {
            mode: _pendingPayload.mode,
            title: _pendingPayload.title,
            words: _pendingPayload.words,
        };
        _unityInstance.SendMessage('HiWebGameBridge', 'SetGameMode', payload.mode);
        _unityInstance.SendMessage('HiWebGameBridge', 'SetWordPool', JSON.stringify(payload));
        _pendingPayload = null;
    }

    async function handleQuizResult(result) {
        const wordId = result?.wordId;
        const correct = !!result?.correct;
        if (!wordId || typeof HiDB === 'undefined') return;

        const word = _wordPool.find(item => item.wordId === wordId);
        try {
            if (correct) {
                _stats.correct += 1;
                if (!_reviewed.has(wordId)) {
                    _reviewed.add(wordId);
                    await HiDB.reviewWord(wordId, 'good');
                }
            } else {
                _stats.wrong += 1;
                const count = (_failCounts.get(wordId) || 0) + 1;
                _failCounts.set(wordId, count);
                if (count >= 3 && !_reviewed.has(wordId)) {
                    _reviewed.add(wordId);
                    if (typeof HiDB.reviewWordToLevel === 'function') {
                        await HiDB.reviewWordToLevel(wordId, 1);
                    } else {
                        await HiDB.reviewWord(wordId, 'hard');
                    }
                }
            }
            window.HiUnityGame?.sendReviewAck?.({ wordId, correct, word: word?.word || '', stats: _stats });
        } catch (err) {
            console.error('[HiGameSession] handleQuizResult:', err);
            window.HiUnityGame?.sendReviewAck?.({ wordId, correct, error: err.message || 'review failed', stats: _stats });
        }
    }

    async function restartUnityLevel() {
        if (!_unityInstance) return;
        _unityInstance.SendMessage('HiWebGameBridge', 'RestartCurrentLevelFromWeb', '');
    }

    async function fullscreenUnity() {
        const unityWrap = document.getElementById('unity-wrap');

        try {
            if (unityWrap?.requestFullscreen && !document.fullscreenElement) {
                await unityWrap.requestFullscreen();
            } else if (_unityInstance?.SetFullscreen) {
                _unityInstance.SetFullscreen(1);
            }

            if (screen.orientation?.lock) {
                await screen.orientation.lock('landscape');
            }
        } catch (err) {
            console.warn('[HiGameSession] Fullscreen or landscape lock is unavailable:', err);
            if (_unityInstance?.SetFullscreen && !document.fullscreenElement) {
                _unityInstance.SetFullscreen(1);
            }
        }
    }

    function syncUnityFullscreenLayout() {
        const unityWrap = document.getElementById('unity-wrap');
        if (!unityWrap) return;

        const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
        unityWrap.classList.toggle('is-unity-fullscreen', fullscreenElement === unityWrap);

        requestAnimationFrame(() => {
            window.dispatchEvent(new Event('resize'));
        });
    }

    document.addEventListener('fullscreenchange', syncUnityFullscreenLayout);
    document.addEventListener('webkitfullscreenchange', syncUnityFullscreenLayout);
    window.addEventListener('resize', _resizeUnityCanvasForMobile);
    window.visualViewport?.addEventListener('resize', _resizeUnityCanvasForMobile);

    async function backHome() {
        if (_unityInstance) {
            try {
                await _unityInstance.Quit();
            } catch (err) {
                console.warn('[HiGameSession] Unity quit failed:', err);
            }
            _unityInstance = null;
            _unityLoading = null;
        }
        document.getElementById('unity-canvas')?.replaceWith(document.getElementById('unity-canvas')?.cloneNode(false));
        _setMobileGamePlaying(false);
        _show('game-stage', false);
        _show('game-lesson-picker', false);
        _show('game-home', true);
        _setStatus('');
    }

    function renderGamePage() {
        _setMobileGamePlaying(false);
        _show('game-stage', false);
        _show('game-lesson-picker', false);
        _show('game-home', true);
        _setStatus('');
    }

    return {
        renderGamePage,
        startReviewMode,
        loadLessonPicker,
        loadLessonsForTopic,
        startSelectedLesson,
        handleQuizResult,
        restartUnityLevel,
        fullscreenUnity,
        backHome,
        get unityInstance() { return _unityInstance; },
        get wordPool() { return _wordPool; },
    };
})();

window.HiUnityGame = {
    onUnityReady() {
        console.log('[HiUnityGame] Unity ready');
    },
    onQuizResult(resultJson) {
        let result = resultJson;
        if (typeof resultJson === 'string') {
            try {
                result = JSON.parse(resultJson);
            } catch (err) {
                console.error('[HiUnityGame] Invalid quiz result JSON:', err, resultJson);
                return;
            }
        }
        window.HiGameSession?.handleQuizResult(result);
    },
    onLevelFinished(levelId) {
        console.log('[HiUnityGame] Level finished:', levelId);
    },
    onQuitRequested() {
        window.HiGameSession?.backHome();
    },
    onGameOver() {
        console.log('[HiUnityGame] Game over');
    },
    sendReviewAck(payload) {
        const unity = window.HiGameSession?.unityInstance;
        if (!unity) return;
        unity.SendMessage('HiWebGameBridge', 'OnReviewAckFromWeb', JSON.stringify(payload));
    },
};
