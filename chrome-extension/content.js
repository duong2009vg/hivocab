(() => {
  const DICT_URL      = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
  const TRANSLATE_URL = 'https://hivocab.vercel.app/api/translate';
  const APP_URL       = 'https://hivocab.vercel.app';

  let fab       = null;
  let panel     = null;
  let current   = null;
  let requestId = 0;

  // Cache tra từ trong trang để siêu nhanh khi tra lại
  const lookupCache = new Map();

  const root = document.createElement('div');
  root.id = 'hi-vocab-clipper-root';
  (document.body || document.documentElement).appendChild(root);

  // ── Sync auth token lên background khi chạy trên web app ─────────────────
  function syncAuthToken() {
    try {
      const sbKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
      if (!sbKey) {
        chrome.runtime.sendMessage({ type: 'store-auth-token', session: null });
        return;
      }
      const raw = localStorage.getItem(sbKey);
      if (!raw) {
        chrome.runtime.sendMessage({ type: 'store-auth-token', session: null });
        return;
      }
      const parsed = JSON.parse(raw);
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
      if (e.key?.startsWith('sb-') && e.key?.endsWith('-auth-token')) {
        syncAuthToken();
      }
    });
  }

  // ── Utility ───────────────────────────────────────────────────────────────
  function send(type, payload = {}) {
    return new Promise(resolve => {
      const id = `clip-${Date.now()}-${++requestId}`;
      chrome.runtime.sendMessage({ type, requestId: id, payload }, resolve);
    });
  }

  function removeFab()  { fab?.remove();   fab   = null; }
  function closePanel() { panel?.remove(); panel = null; }
  function esc(value)   { return String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  function isEnglishExample(value) {
    const text = String(value || '').trim();
    if (!text || !/[a-z]/i.test(text)) return false;
    if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text)) return false;
    if (/\b(và|là|của|cho|trong|một|những|các|được|không|với|khi|từ|người|này|đó)\b/i.test(text)) return false;
    return true;
  }

  async function fetchWithTimeout(url, options = {}, timeoutMs = 3000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      return response;
    } catch (e) {
      clearTimeout(timer);
      return null;
    }
  }

  // ── Audio ─────────────────────────────────────────────────────────────────
  function speakWord(word, audioUrl) {
    if (!word) return;
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(() => speakTTS(word));
    } else {
      speakTTS(word);
    }
  }

  function speakTTS(word) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(word);
    utter.lang = 'en-US';
    utter.rate = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang === 'en-US' && !v.localService)
               || voices.find(v => v.lang === 'en-US')
               || voices.find(v => v.lang.startsWith('en'));
    if (voice) utter.voice = voice;
    window.speechSynthesis.speak(utter);
  }

  // ── Load topics ───────────────────────────────────────────────────────────
  async function loadTopics(selectEl) {
    const response = await send('get-app-topics');
    if (!response?.ok) {
      throw new Error(response?.error || 'Chưa đăng nhập. Vui lòng đăng nhập để lưu từ.');
    }
    const topics = response.data || [];
    if (!topics.length) {
      selectEl.innerHTML = '<option value="">Chưa có chủ đề nào</option>';
      selectEl.disabled = true;
      return [];
    }
    selectEl.innerHTML = topics.map(t => `<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('');
    selectEl.disabled = false;
    return topics;
  }

  // ── Tra từ (chạy song song DeepL + FreeDict siêu tốc) ────────────────────
  async function lookup(term) {
    const key = term.trim().toLowerCase();
    if (lookupCache.has(key)) return lookupCache.get(key);

    const result = {
      word: term.trim(),
      phonetic: '',
      meaning: '',
      example: '',
      audioUrl: null
    };

    const isPhrase = key.includes(' ');

    // 1. DeepL dịch thẳng từ/cụm từ (cực nhanh ~200ms)
    const translatePromise = fetchWithTimeout(TRANSLATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: term.trim(), from: 'en', to: 'vi' })
    }, 4000).then(async res => {
      if (res && res.ok) {
        const data = await res.json();
        return data?.ok && data?.text ? data.text : null;
      }
      return null;
    }).catch(() => null);

    // 2. Free Dictionary lấy IPA + Audio + Example (chỉ từ đơn, timeout 2.5s tránh treo)
    const dictPromise = isPhrase
      ? Promise.resolve(null)
      : fetchWithTimeout(DICT_URL + encodeURIComponent(key), {}, 2500)
          .then(async res => {
            if (res && res.ok) {
              const data = await res.json();
              return Array.isArray(data) ? data : null;
            }
            return null;
          }).catch(() => null);

    const [translatedText, dictData] = await Promise.all([translatePromise, dictPromise]);

    // Gán nghĩa tiếng Việt
    if (translatedText) {
      result.meaning = translatedText;
    }

    // Gán thông tin từ Free Dictionary nếu có
    if (dictData && dictData.length > 0) {
      const entry = dictData[0];
      result.word = entry.word || result.word;
      result.phonetic = entry.phonetic || entry.phonetics?.find(p => p.text)?.text || '';

      if (entry.phonetics) {
        const withAudio = entry.phonetics.filter(p => p.audio);
        const us = withAudio.find(p => p.audio.includes('-us.'));
        result.audioUrl = (us || withAudio[0])?.audio || null;
      }

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
      result.example = foundExample;
    }

    // Fallback câu ví dụ nếu Free Dictionary không có
    if (!result.example) {
      result.example = isPhrase
        ? `She used the phrase "${term.trim()}" in a sentence today.`
        : `She learned how to use "${term.trim()}" in a sentence today.`;
    }

    lookupCache.set(key, result);
    return result;
  }

  // ── Panel hiển thị ──────────────────────────────────────────────────────────
  function showPanel(x, y, initialData) {
    closePanel();
    current = initialData;

    panel = document.createElement('div');
    panel.className = 'hi-vocab-panel';
    panel.style.left = `${Math.min(Math.max(10, x), innerWidth - 330)}px`;
    panel.style.top  = `${Math.min(Math.max(10, y), innerHeight - 320)}px`;

    panel.innerHTML = `
      <div class="hi-vocab-panel-header">
        <div>
          <h3 id="hiv-word">${esc(initialData.word)}</h3>
          <div id="hiv-phonetic" class="hi-vocab-muted">${esc(initialData.phonetic || '')}</div>
        </div>
        <button id="hiv-audio" class="hi-vocab-audio-btn" title="Nghe phát âm" style="${initialData.word ? 'display:flex' : 'display:none'}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
        </button>
      </div>
      <div id="hiv-meaning" class="hi-vocab-meaning">${esc(initialData.meaning || 'Đang tra nghĩa...')}</div>
      <div id="hiv-example" class="hi-vocab-example">${esc(initialData.example || '')}</div>
      <select id="hiv-topics" aria-label="Chọn topic" disabled><option>Đang tải topic...</option></select>
      <div class="hi-vocab-actions">
        <button id="hiv-add" class="hi-vocab-add" ${initialData.meaning ? '' : 'disabled'}>⬇ Lưu vào app</button>
      </div>
      <div id="hiv-status" class="hi-vocab-status"></div>`;
    root.appendChild(panel);

    const audioButton = panel.querySelector('#hiv-audio');
    const select      = panel.querySelector('#hiv-topics');
    const status      = panel.querySelector('#hiv-status');
    const addBtn      = panel.querySelector('#hiv-add');

    audioButton.onclick = () => speakWord(current.word, current.audioUrl);

    loadTopics(select).then(topics => {
      if (topics && topics.length > 0 && current?.meaning) {
        addBtn.disabled = false;
      }
    }).catch(err => {
      status.textContent = err.message;
      select.disabled = true;
      addBtn.disabled = true;
      if (err.message.includes('đăng nhập') || err.message.includes('Chưa đăng nhập')) {
        status.innerHTML = `<a href="${APP_URL}" target="_blank" style="color:#0b6b91;font-weight:600;text-decoration:underline">Mở app để đăng nhập</a>`;
      }
    });

    addBtn.onclick = async () => {
      if (!current?.meaning || !select.value) return;
      addBtn.disabled = true;
      status.style.color = '#0b6b91';
      status.textContent = 'Đang lưu vào app...';
      const response = await send('add-to-app', {
        topicId: select.value,
        word: current.word,
        phonetic: current.phonetic,
        meaning: current.meaning,
        exampleSentence: current.example
      });
      if (response?.ok) {
        status.style.color = '#19734b';
        status.textContent = 'Đã lưu vào app ✓';
        setTimeout(closePanel, 1100);
      } else {
        addBtn.disabled = false;
        status.style.color = '#ba4b29';
        status.textContent = response?.error || 'Không thêm được từ.';
      }
    };
  }

  // ── Selection FAB ─────────────────────────────────────────────────────────
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
    fab.title = 'Tra và lưu từ';
    fab.innerHTML = `<img src="${chrome.runtime.getURL('logo-mark.svg')}" alt="Hi" />`;
    fab.style.left = `${Math.min(Math.max(8, rect.right - 18), innerWidth - 48)}px`;
    fab.style.top  = `${Math.min(Math.max(8, rect.bottom + 8), innerHeight - 48)}px`;
    root.appendChild(fab);

    fab.onclick = async () => {
      const panelX = rect.right - 18;
      const panelY = rect.bottom + 52;

      // Kiểm tra cache trước - nếu có thì hiện luôn ngay lập tức (0ms)
      const cached = lookupCache.get(term.toLowerCase());
      if (cached) {
        showPanel(panelX, panelY, cached);
        removeFab();
        return;
      }

      // Hiện panel ngay lập tức với placeholder để người dùng không phải chờ đợi
      showPanel(panelX, panelY, {
        word: term,
        phonetic: '',
        meaning: 'Đang tra nghĩa...',
        example: '',
        audioUrl: null
      });
      removeFab();

      // Fetch song song
      const result = await lookup(term);
      current = result;

      // Cập nhật lại giao diện panel ngay khi có dữ liệu
      if (panel) {
        const wordEl     = panel.querySelector('#hiv-word');
        const phoneticEl = panel.querySelector('#hiv-phonetic');
        const meaningEl  = panel.querySelector('#hiv-meaning');
        const exampleEl  = panel.querySelector('#hiv-example');
        const addBtn     = panel.querySelector('#hiv-add');
        const select     = panel.querySelector('#hiv-topics');

        if (wordEl)     wordEl.textContent = result.word;
        if (phoneticEl) phoneticEl.textContent = result.phonetic || '';
        if (meaningEl)  meaningEl.textContent = result.meaning || 'Không tìm thấy nghĩa';
        if (exampleEl)  exampleEl.textContent = result.example || '';
        if (addBtn && select && select.value && result.meaning) {
          addBtn.disabled = false;
        }
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
