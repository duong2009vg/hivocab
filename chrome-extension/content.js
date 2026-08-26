(() => {
  const DICT_URL      = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
  const TRANSLATE_URL = 'https://hivocab.vercel.app/api/translate';
  const APP_URL       = 'https://hivocab.vercel.app';

  let fab     = null;
  let panel   = null;
  let current = null;
  let requestId = 0;

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
      // Lưu full session để có refresh_token
      const session = parsed?.access_token ? {
        access_token:  parsed.access_token,
        refresh_token: parsed.refresh_token || null,
        expires_at:    parsed.expires_at    || null,
      } : null;
      chrome.runtime.sendMessage({ type: 'store-auth-token', session });
    } catch (_) {}
  }

  // Sync ngay khi load và khi có thay đổi storage (login/logout)
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

  // ── Tra từ ────────────────────────────────────────────────────────────────
  async function lookup(term) {
    const result = { word: term, phonetic: '', meaning: '', example: '', english: '' };
    const isPhrase = term.trim().includes(' ');

    if (isPhrase) {
      // Cụm từ: DeepL dịch trực tiếp
      try {
        const response = await fetch(TRANSLATE_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: term.trim(), from: 'en', to: 'vi' })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.ok && data.text) result.meaning = data.text;
        }
      } catch (_) {}
      result.example = `She used the phrase "${term.trim()}" in a sentence today.`;

    } else {
      // Từ đơn: Free Dictionary → DeepL dịch định nghĩa EN
      let firstDefinition = '';
      let foundExample = '';
      try {
        const response = await fetch(DICT_URL + encodeURIComponent(term));
        if (response.ok) {
          const data = await response.json();
          const entry = data[0] || {};
          result.word     = entry.word || term;
          result.phonetic = entry.phonetic || entry.phonetics?.find(p => p.text)?.text || '';

          for (const e of data) {
            for (const m of (e.meanings || [])) {
              if (!firstDefinition && m.definitions?.[0]?.definition) {
                firstDefinition = m.definitions[0].definition;
              }
              for (const d of (m.definitions || [])) {
                if (!foundExample && d.example && isEnglishExample(d.example)) {
                  foundExample = d.example;
                }
              }
            }
            if (firstDefinition && foundExample) break;
          }
        }
      } catch (_) {}

      result.example = foundExample || `She learned how to use "${term}" in a sentence today.`;

      // DeepL dịch định nghĩa EN → VI (fallback: dịch từ trực tiếp)
      const textToTranslate = firstDefinition || term;
      try {
        const response = await fetch(TRANSLATE_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: textToTranslate, from: 'en', to: 'vi' })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.ok && data.text) result.meaning = data.text;
        }
      } catch (_) {}
    }

    return result;
  }
  // ── Panel ───────────────────────────────────────────────────────────────────
  function showPanel(x, y, result) {
    closePanel();
    panel = document.createElement('div');
    panel.className = 'hi-vocab-panel';
    panel.style.left = `${Math.min(x, innerWidth - 326)}px`;
    panel.style.top  = `${Math.min(y, innerHeight - 320)}px`;
    panel.innerHTML = `
      <div class="hi-vocab-panel-header">
        <div>
          <h3>${esc(result.word)}</h3>
          <div class="hi-vocab-muted">${esc(result.phonetic || '')}</div>
        </div>
        <button class="hi-vocab-audio-btn" title="Nghe phát âm">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
        </button>
      </div>
      <div class="hi-vocab-meaning">${esc(result.meaning || 'Không lấy được nghĩa')}</div>
      <div class="hi-vocab-example">${esc(result.example || '')}</div>
      <select aria-label="Chọn topic"><option>Đang tải topic...</option></select>
      <div class="hi-vocab-actions"><button class="hi-vocab-add">⬇ Lưu vào app</button></div>
      <div class="hi-vocab-status"></div>`;
    root.appendChild(panel);

    const audioButton = panel.querySelector('.hi-vocab-audio-btn');
    const select = panel.querySelector('select');
    const status = panel.querySelector('.hi-vocab-status');
    const addBtn = panel.querySelector('.hi-vocab-add');

    audioButton.onclick = () => speakWord(result.word, result.audioUrl);

    loadTopics(select).catch(err => {
      status.textContent = err.message;
      select.disabled = true;
      addBtn.disabled = true;
      if (err.message.includes('đăng nhập')) {
        status.innerHTML = `<a href="${APP_URL}" target="_blank" style="color:#1a7a4a;text-decoration:underline">Mở app để đăng nhập</a>`;
      }
    });

    addBtn.onclick = async () => {
      addBtn.disabled = true;
      status.textContent = 'Đang thêm...';
      const response = await send('add-to-app', {
        topicId: select.value,
        word: result.word, phonetic: result.phonetic,
        meaning: result.meaning, exampleSentence: result.example
      });
      if (response?.ok) {
        status.style.color = '#19734b';
        status.textContent = 'Đã lưu vào app ✓';
        setTimeout(closePanel, 900);
      } else {
        addBtn.disabled = false;
        status.textContent = response?.error || 'Không thêm được từ.';
      }
    };
  }rr.message.includes('đăng nhập')) {
        status.innerHTML = `<a href="${APP_URL}" target="_blank" style="color:#1a7a4a;text-decoration:underline">Mở app để đăng nhập</a>`;
      }
    });

    addBtn.onclick = async () => {
      addBtn.disabled = true;
      status.textContent = 'Đang thêm...';
      const response = await send('add-to-app', {
        topicId: select.value,
        word: result.word, phonetic: result.phonetic,
        meaning: result.meaning, exampleSentence: result.example
      });
      if (response?.ok) {
        status.style.color = '#19734b';
        status.textContent = 'Đã thêm vào app.';
        setTimeout(closePanel, 900);
      } else {
        addBtn.disabled = false;
        status.textContent = response?.error || 'Không thêm được từ.';
      }
    };
  }

  // ── Selection FAB ─────────────────────────────────────────────────────────
  document.addEventListener('mouseup', event => {
    if (root.contains(event.target)) return;
    const term = String(getSelection()?.toString() || '').trim().replace(/\s+/g, ' ');
    if (!term || term.length > 80) { removeFab(); return; }
    const rect = getSelection().getRangeAt(0).getBoundingClientRect();
    removeFab();
    fab = document.createElement('button');
    fab.className = 'hi-vocab-fab';
    fab.title = 'Tra và lưu từ';
    fab.innerHTML = `<img src="${chrome.runtime.getURL('logo-mark.svg')}" alt="Hi" />`;
    fab.style.left = `${Math.min(Math.max(8, rect.right - 18), innerWidth - 48)}px`;
    fab.style.top  = `${Math.min(Math.max(8, rect.bottom + 8), innerHeight - 48)}px`;
    root.appendChild(fab);
    fab.onclick = async () => {
      fab.disabled = true;
      fab.innerHTML = '<span class="hi-vocab-spinner">...</span>';
      current = await lookup(term);
      showPanel(rect.right - 18, rect.bottom + 52, current);
      removeFab();
    };
  });

  document.addEventListener('mousedown', event => {
    if (!panel || root.contains(event.target)) return;
    closePanel();
  });
  document.addEventListener('scroll', () => { removeFab(); closePanel(); }, true);

  // ── Listener cho web app (giữ lại cho tương thích) ───────────────────────
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
