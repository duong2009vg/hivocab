(() => {
  const DICT_URL      = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
  const TRANSLATE_URL = 'https://hivocab.vercel.app/api/translate';
  const EXAMPLE_URL   = 'https://hivocab.vercel.app/api/example';
  const APP_URL       = 'https://hivocab.vercel.app';

  let fab       = null;
  let panel     = null;
  let current   = null;
  let requestId = 0;

  const lookupCache = new Map();

  const root = document.createElement('div');
  root.id = 'hi-vocab-clipper-root';
  (document.body || document.documentElement).appendChild(root);

  // ── Auth sync ─────────────────────────────────────────────────────────────
  function syncAuthToken() {
    try {
      const sbKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
      const raw   = sbKey ? localStorage.getItem(sbKey) : null;
      const parsed = raw ? JSON.parse(raw) : null;
      const session = parsed?.access_token ? {
        access_token:  parsed.access_token,
        refresh_token: parsed.refresh_token || null,
        expires_at:    parsed.expires_at    || null,
      } : null;
      chrome.runtime.sendMessage({ type: 'store-auth-token', session });
    } catch (_) {}
  }

  if (window.location.origin === new URL(APP_URL).origin) {
    syncAuthToken();
    window.addEventListener('storage', e => {
      if (e.key?.startsWith('sb-') && e.key?.endsWith('-auth-token')) syncAuthToken();
    });
  }

  // ── Utility ───────────────────────────────────────────────────────────────
  function send(type, payload = {}) {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({ type, requestId: `clip-${Date.now()}-${++requestId}`, payload }, resolve);
    });
  }

  function removeFab()  { fab?.remove();   fab   = null; }
  function closePanel() { panel?.remove(); panel = null; }
  function esc(v) {
    return String(v || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function isEnglishExample(value) {
    const t = String(value || '').trim();
    if (!t || !/[a-z]/i.test(t)) return false;
    if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(t)) return false;
    if (/\b(và|là|của|cho|trong|một|những|các|được|không|với|khi|từ|người|này|đó)\b/i.test(t)) return false;
    return true;
  }

  async function fetchWithTimeout(url, options = {}, ms = 3000) {
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    try {
      const res = await fetch(url, { ...options, signal: ctrl.signal });
      clearTimeout(timer);
      return res;
    } catch (_) {
      clearTimeout(timer);
      return null;
    }
  }

  // ── Audio ─────────────────────────────────────────────────────────────────
  // audioEl: Audio element pre-loaded from FreeDict URL (instant playback)
  // audioUrl: fallback URL nếu audioEl chưa sẵn sàng
  function speakWord(word, audioEl, audioUrl) {
    if (audioEl) {
      audioEl.currentTime = 0;
      audioEl.play().catch(() => speakTTS(word));
      return;
    }
    if (audioUrl) {
      new Audio(audioUrl).play().catch(() => speakTTS(word));
      return;
    }
    speakTTS(word);
  }

  function speakTTS(word) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(word);
    utter.lang  = 'en-US';
    utter.rate  = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const voice  = voices.find(v => v.lang === 'en-US' && !v.localService)
                || voices.find(v => v.lang === 'en-US')
                || voices.find(v => v.lang.startsWith('en'));
    if (voice) utter.voice = voice;
    window.speechSynthesis.speak(utter);
  }

  // ── Load topics & folders map ─────────────────────────────────────────────
  let cachedTopics     = null;
  let cachedFoldersMap = null;

  async function getTopicsData() {
    if (cachedTopics && cachedFoldersMap) {
      return { topics: cachedTopics, foldersMap: cachedFoldersMap };
    }
    const response = await send('get-app-topics');
    if (!response?.ok) {
      throw new Error(response?.error || 'Chưa đăng nhập. Vui lòng đăng nhập để lưu từ.');
    }
    const topics = response.data || [];
    const foldersMap = {};
    topics.forEach(t => {
      const folder = (t.category || 'General English').trim();
      if (!foldersMap[folder]) foldersMap[folder] = [];
      foldersMap[folder].push(t);
    });
    cachedTopics     = topics;
    cachedFoldersMap = foldersMap;
    return { topics, foldersMap };
  }

  // ── Tạo câu ví dụ bằng Groq (chỉ khi FreeDict không có) ─────────────────
  async function generateExample(term, isPhrase) {
    try {
      const res = await fetchWithTimeout(EXAMPLE_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ term, isPhrase: !!isPhrase }),
      }, 6000);
      if (!res || !res.ok) return null;
      const data = await res.json();
      return (data?.ok && data?.sentence) ? data.sentence : null;
    } catch (_) {
      return null;
    }
  }

  // ── Lookup: DeepL + FreeDict song song ───────────────────────────────────
  async function lookup(term) {
    const key      = term.trim().toLowerCase();
    if (lookupCache.has(key)) return lookupCache.get(key);

    const isPhrase = key.includes(' ');
    const result   = {
      word:           term.trim(),
      phonetic:       '',
      meaning:        '',
      example:        '',
      audioUrl:       null,
      audioEl:        null,   // Audio element pre-loaded, cho phát tức thì
      hasRealExample: false,  // true nếu FreeDict cung cấp ví dụ thực
      isPhrase,
    };

    // Chạy song song: DeepL (4s timeout) và FreeDict (2.5s timeout)
    const translatePromise = fetchWithTimeout(TRANSLATE_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ text: term.trim(), from: 'en', to: 'vi' }),
    }, 4000)
      .then(async r => (r && r.ok) ? (await r.json()) : null)
      .catch(() => null);

    const dictPromise = isPhrase
      ? Promise.resolve(null)
      : fetchWithTimeout(DICT_URL + encodeURIComponent(key), {}, 2500)
          .then(async r => (r && r.ok) ? (await r.json()) : null)
          .catch(() => null);

    const [translateData, dictData] = await Promise.all([translatePromise, dictPromise]);

    // Nghĩa tiếng Việt từ DeepL
    if (translateData?.ok && translateData?.text) result.meaning = translateData.text;

    // IPA + Audio + Example từ FreeDict (chỉ từ đơn)
    if (Array.isArray(dictData) && dictData.length > 0) {
      const entry = dictData[0];
      result.word     = entry.word || result.word;
      result.phonetic = entry.phonetic || entry.phonetics?.find(p => p.text)?.text || '';

      // Pre-load audio ngầm để phát gần như tức thì khi user click
      if (entry.phonetics) {
        const withAudio = entry.phonetics.filter(p => p.audio);
        const us        = withAudio.find(p => p.audio.includes('-us.'));
        const audioUrl  = (us || withAudio[0])?.audio || null;
        if (audioUrl) {
          result.audioUrl = audioUrl;
          const audio     = new Audio(audioUrl);
          audio.preload   = 'auto';
          audio.load();         // bắt đầu buffer ngầm ngay lập tức
          result.audioEl  = audio;
        }
      }

      // Tìm ví dụ tiếng Anh đầu tiên
      let foundExample = '';
      outer: for (const e of dictData) {
        for (const m of (e.meanings || [])) {
          for (const d of (m.definitions || [])) {
            if (d.example && isEnglishExample(d.example)) {
              foundExample = d.example;
              break outer;
            }
          }
        }
      }
      if (foundExample) {
        result.example        = foundExample;
        result.hasRealExample = true;
      }
    }

    // Lưu cache kết quả (ví dụ có thể được cập nhật sau bởi Groq)
    lookupCache.set(key, result);
    return result;
  }

  // ── Hiện panel ─────────────────────────────────────────────────────────────
  function showPanel(x, y, data) {
    closePanel();
    current = data;

    panel = document.createElement('div');
    panel.className  = 'hi-vocab-panel';
    panel.style.left = `${Math.min(Math.max(10, x), innerWidth  - 340)}px`;
    panel.style.top  = `${Math.min(Math.max(10, y), innerHeight - 340)}px`;

    panel.innerHTML = `
      <div class="hi-vocab-panel-header">
        <div class="hi-vocab-header-left">
          <h3 id="hiv-word">${esc(data.word)}</h3>
          <div id="hiv-phonetic" class="hi-vocab-muted">${esc(data.phonetic || '')}</div>
        </div>
        <div class="hi-vocab-header-right">
          <button id="hiv-audio" class="hi-vocab-audio-btn" title="Nghe phát âm">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
          </button>
          <button id="hiv-close" class="hi-vocab-panel-close" title="Đóng">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
      <div id="hiv-meaning" class="hi-vocab-meaning">${esc(data.meaning || 'Đang tra nghĩa...')}</div>
      <div id="hiv-example" class="hi-vocab-example">${esc(data.example || '')}</div>
      <div class="hi-vocab-actions">
        <button id="hiv-open-save" class="hi-vocab-add" ${data.meaning ? '' : 'disabled'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          Lưu từ này vào app
        </button>
      </div>
      <div id="hiv-status" class="hi-vocab-status"></div>

      <!-- Pop-up Modal bên trong panel: Step 1 Chọn Folder -> Step 2 Chọn Topic -->
      <div id="hiv-modal" class="hi-vocab-modal" style="display:none">
        <div class="hi-vocab-modal-header">
          <button id="hiv-modal-back" class="hi-vocab-modal-back" type="button" style="display:none" title="Quay lại danh sách thư mục">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            <span>Thư mục</span>
          </button>
          <div class="hi-vocab-modal-title-wrap">
            <div id="hiv-modal-title" class="hi-vocab-modal-title">Chọn thư mục</div>
            <div id="hiv-modal-subtitle" class="hi-vocab-modal-subtitle">Lưu vào bộ từ vựng</div>
          </div>
          <button id="hiv-modal-close" class="hi-vocab-modal-close" type="button" title="Đóng">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="hi-vocab-modal-body">
          <!-- Step 1: Thư mục -->
          <div id="hiv-step-folders">
            <div class="hi-vocab-step-hint">Chọn thư mục để xem các chủ đề:</div>
            <div id="hiv-folder-list" class="hi-vocab-picker-list"></div>
          </div>
          <!-- Step 2: Chủ đề -->
          <div id="hiv-step-topics" style="display:none">
            <div class="hi-vocab-step-hint" id="hiv-topic-step-hint">Chọn chủ đề để lưu từ ngay:</div>
            <div id="hiv-topic-list" class="hi-vocab-picker-list"></div>
          </div>
        </div>
        <div id="hiv-modal-status" class="hi-vocab-modal-status" style="display:none"></div>
      </div>`;

    root.appendChild(panel);

    const audioBtn      = panel.querySelector('#hiv-audio');
    const closeBtn      = panel.querySelector('#hiv-close');
    const openSaveBtn   = panel.querySelector('#hiv-open-save');
    const statusEl      = panel.querySelector('#hiv-status');
    const modalEl       = panel.querySelector('#hiv-modal');
    const modalBackBtn  = panel.querySelector('#hiv-modal-back');
    const modalCloseBtn = panel.querySelector('#hiv-modal-close');
    const modalTitle    = panel.querySelector('#hiv-modal-title');
    const modalSubtitle = panel.querySelector('#hiv-modal-subtitle');
    const stepFolders   = panel.querySelector('#hiv-step-folders');
    const stepTopics    = panel.querySelector('#hiv-step-topics');
    const folderListEl  = panel.querySelector('#hiv-folder-list');
    const topicListEl   = panel.querySelector('#hiv-topic-list');
    const modalStatus   = panel.querySelector('#hiv-modal-status');

    audioBtn.onclick = () => speakWord(current.word, current.audioEl, current.audioUrl);
    closeBtn.onclick = () => closePanel();

    // Eagerly prefetch topics ngầm
    getTopicsData().catch(() => {});

    // Modal navigation
    modalCloseBtn.onclick = () => {
      modalEl.style.display = 'none';
      modalStatus.style.display = 'none';
    };

    modalBackBtn.onclick = () => {
      renderFolderStep();
    };

    function renderFolderStep() {
      modalBackBtn.style.display = 'none';
      modalTitle.textContent     = 'Chọn thư mục';
      modalSubtitle.textContent  = current?.word ? `Từ: "${current.word}"` : 'Lưu vào bộ từ vựng';
      stepFolders.style.display  = 'block';
      stepTopics.style.display   = 'none';
      modalStatus.style.display  = 'none';

      if (!cachedFoldersMap) {
        folderListEl.innerHTML = '<div class="hi-vocab-loading">Đang tải danh sách thư mục...</div>';
        getTopicsData().then(() => renderFolderStep()).catch(err => {
          folderListEl.innerHTML = `<div class="hi-vocab-error">${esc(err.message)}</div>`;
          if (err.message.includes('đăng nhập') || err.message.includes('Chưa đăng nhập')) {
            folderListEl.innerHTML += `<div style="margin-top:8px;text-align:center"><a href="${APP_URL}" target="_blank" style="color:#0b6b91;font-weight:700;text-decoration:underline">Mở app để đăng nhập</a></div>`;
          }
        });
        return;
      }

      const folderNames = Object.keys(cachedFoldersMap).sort((a, b) => {
        if (a.toLowerCase() === 'cam') return -1;
        if (b.toLowerCase() === 'cam') return 1;
        if (a.toLowerCase() === 'ielts') return -1;
        if (b.toLowerCase() === 'ielts') return 1;
        return a.localeCompare(b, 'vi');
      });

      if (!folderNames.length) {
        folderListEl.innerHTML = '<div class="hi-vocab-loading">Chưa có thư mục nào</div>';
        return;
      }

      folderListEl.innerHTML = folderNames.map(f => `
        <button type="button" class="hi-vocab-picker-item" data-folder="${esc(f)}">
          <div class="hi-vocab-picker-left">
            <span class="hi-vocab-picker-icon">📁</span>
            <span class="hi-vocab-picker-name">${esc(f)}</span>
          </div>
          <span class="hi-vocab-picker-badge">${cachedFoldersMap[f].length} chủ đề ›</span>
        </button>
      `).join('');

      folderListEl.querySelectorAll('.hi-vocab-picker-item').forEach(btn => {
        btn.onclick = () => selectFolder(btn.dataset.folder);
      });
    }

    function selectFolder(folderName) {
      modalBackBtn.style.display = 'inline-flex';
      modalTitle.textContent     = folderName;
      modalSubtitle.textContent  = 'Chọn chủ đề để lưu từ';
      stepFolders.style.display  = 'none';
      stepTopics.style.display   = 'block';
      modalStatus.style.display  = 'none';

      const topicsInFolder = cachedFoldersMap?.[folderName] || [];
      if (!topicsInFolder.length) {
        topicListEl.innerHTML = '<div class="hi-vocab-loading">Thư mục này chưa có chủ đề</div>';
        return;
      }

      topicListEl.innerHTML = topicsInFolder.map(t => `
        <button type="button" class="hi-vocab-picker-item" data-topic-id="${esc(t.id)}" data-topic-name="${esc(t.name)}">
          <div class="hi-vocab-picker-left">
            <span class="hi-vocab-picker-icon">📖</span>
            <span class="hi-vocab-picker-name">${esc(t.name)}</span>
          </div>
          <span class="hi-vocab-save-badge">+ Lưu</span>
        </button>
      `).join('');

      topicListEl.querySelectorAll('.hi-vocab-picker-item').forEach(btn => {
        btn.onclick = () => saveWordToTopic(btn.dataset.topicId, btn.dataset.topicName);
      });
    }

    async function saveWordToTopic(topicId, topicName) {
      if (!current || !topicId) return;

      modalStatus.style.display = 'block';
      modalStatus.style.color   = '#0b6b91';
      modalStatus.textContent   = `Đang lưu vào "${topicName}"...`;

      const response = await send('add-to-app', {
        topicId,
        word:            current.word,
        phonetic:        current.phonetic,
        meaning:         current.meaning,
        exampleSentence: current.example,
      });

      if (response?.ok) {
        modalStatus.style.color = '#19734b';
        modalStatus.textContent = `Đã lưu thành công vào "${topicName}" ✓`;
        statusEl.style.color    = '#19734b';
        statusEl.textContent    = `Đã lưu vào "${topicName}" ✓`;
        openSaveBtn.textContent = `✓ Đã lưu (${topicName})`;
        openSaveBtn.disabled    = true;
        setTimeout(() => {
          modalEl.style.display = 'none';
          closePanel();
        }, 900);
      } else {
        modalStatus.style.color = '#ba4b29';
        modalStatus.textContent = response?.error || 'Không lưu được từ.';
      }
    }

    openSaveBtn.onclick = () => {
      if (!current?.meaning) return;
      modalEl.style.display = 'flex';
      renderFolderStep();
    };
  }

  // ── Cập nhật panel sau khi lookup xong ────────────────────────────────────
  function updatePanel(result) {
    if (!panel) return;
    const wordEl      = panel.querySelector('#hiv-word');
    const phoneticEl  = panel.querySelector('#hiv-phonetic');
    const meaningEl   = panel.querySelector('#hiv-meaning');
    const exampleEl   = panel.querySelector('#hiv-example');
    const openSaveBtn = panel.querySelector('#hiv-open-save');

    if (wordEl)     wordEl.textContent    = result.word;
    if (phoneticEl) phoneticEl.textContent = result.phonetic || '';
    if (meaningEl)  meaningEl.textContent  = result.meaning  || 'Không tìm thấy nghĩa';

    if (exampleEl) {
      if (result.hasRealExample) {
        exampleEl.textContent = result.example;
      } else {
        // Chưa có ví dụ thực → báo đang tạo (Groq sẽ điền sau)
        exampleEl.textContent = 'Đang tạo câu ví dụ...';
      }
    }

    if (openSaveBtn && result.meaning) {
      openSaveBtn.disabled = false;
    }
  }

  // ── Cập nhật câu ví dụ từ Groq (non-blocking) ─────────────────────────────
  function applyGeneratedExample(key, sentence) {
    if (!sentence) return;
    // Cập nhật cache
    const cached = lookupCache.get(key);
    if (cached) { cached.example = sentence; cached.hasRealExample = true; }
    if (current) current.example = sentence;
    // Cập nhật UI nếu panel vẫn mở
    if (panel) {
      const exEl = panel.querySelector('#hiv-example');
      if (exEl) exEl.textContent = sentence;
    }
  }

  // ── FAB click ─────────────────────────────────────────────────────────────
  document.addEventListener('mouseup', event => {
    if (root.contains(event.target)) return;
    const term = String(getSelection()?.toString() || '').trim().replace(/\s+/g, ' ');
    if (!term || term.length > 80) { removeFab(); return; }

    const selection = getSelection();
    if (!selection.rangeCount) return;
    const rect = selection.getRangeAt(0).getBoundingClientRect();
    if (!rect.width && !rect.height) return;

    removeFab();
    fab = document.createElement('button');
    fab.className = 'hi-vocab-fab';
    fab.title     = 'Tra và lưu từ';
    fab.innerHTML = `<img src="${chrome.runtime.getURL('logo-mark.svg')}" alt="Hi" />`;
    fab.style.left = `${Math.min(Math.max(8, rect.right - 18), innerWidth  - 48)}px`;
    fab.style.top  = `${Math.min(Math.max(8, rect.bottom + 8), innerHeight - 48)}px`;
    root.appendChild(fab);

    fab.onclick = async () => {
      const panelX = rect.right - 18;
      const panelY = rect.bottom + 52;
      const cacheKey = term.trim().toLowerCase();

      // Cache hit → hiện ngay, 0ms delay
      if (lookupCache.has(cacheKey)) {
        showPanel(panelX, panelY, lookupCache.get(cacheKey));
        removeFab();
        return;
      }

      // Hiện panel NGAY với placeholder, không block UI
      showPanel(panelX, panelY, { word: term, phonetic: '', meaning: '', example: '', audioUrl: null, audioEl: null, hasRealExample: false, isPhrase: term.includes(' ') });
      removeFab();

      // Lookup song song (DeepL + FreeDict)
      const result = await lookup(term);
      current = result;
      updatePanel(result);

      // Nếu FreeDict không có ví dụ → dùng Groq tạo (non-blocking, ~500ms)
      if (!result.hasRealExample) {
        generateExample(term, result.isPhrase).then(sentence => {
          const fallback = result.isPhrase
            ? `She said "${result.word}" to encourage her friend.`
            : `She learned how to use "${result.word}" in a sentence today.`;
          applyGeneratedExample(cacheKey, sentence || fallback);
        });
      }
    };
  });

  document.addEventListener('mousedown', event => {
    if (!panel || root.contains(event.target)) return;
    closePanel();
  });
  document.addEventListener('scroll', () => { removeFab(); closePanel(); }, true);

  // ── Listener cho web app ─────────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type !== 'HI_EXTENSION_PAGE_REQUEST') return;
    window.postMessage({ source: 'hi-vocab-extension', requestId: message.requestId, action: message.action, payload: message.payload }, '*');
    const handler = event => {
      if (event.source !== window || event.data?.source !== 'hi-vocab-app' || event.data.requestId !== message.requestId) return;
      clearTimeout(timeout);
      window.removeEventListener('message', handler);
      sendResponse({ ok: event.data.ok, data: event.data.data, error: event.data.error });
    };
    const timeout = setTimeout(() => {
      window.removeEventListener('message', handler);
      sendResponse({ ok: false, error: 'App chưa sẵn sàng. Hãy thử lại sau vài giây.' });
    }, 12000);
    window.addEventListener('message', handler);
    return true;
  });
})();
