(() => {
  const DICT_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
  const TRANSLATE_URL = 'https://hivocab.vercel.app/api/translate';
  let fab = null;
  let panel = null;
  let current = null;
  let requestId = 0;

  const root = document.createElement('div');
  root.id = 'hi-vocab-clipper-root';
  (document.body || document.documentElement).appendChild(root);

  function send(type, payload = {}) {
    return new Promise(resolve => {
      const id = `clip-${Date.now()}-${++requestId}`;
      chrome.runtime.sendMessage({ type, requestId: id, payload }, resolve);
    });
  }

  function removeFab() { fab?.remove(); fab = null; }
  function closePanel() { panel?.remove(); panel = null; }
  function esc(value) { return String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function isEnglishExample(value) {
    const text = String(value || '').trim();
    if (!text || !/[a-z]/i.test(text)) return false;
    if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text)) return false;
    if (/\b(và|là|của|cho|trong|một|những|các|được|không|với|khi|từ|người|này|đó)\b/i.test(text)) return false;
    return true;
  }

  async function lookup(term) {
    let result = { word: term, phonetic: '', meaning: '', example: '' };
    try {
      const response = await fetch(DICT_URL + encodeURIComponent(term));
      if (response.ok) {
        const data = await response.json();
        const entry = data[0] || {};
        const firstMeaning = entry.meanings?.[0]?.definitions?.[0] || {};
        result.word = entry.word || term;
        result.phonetic = entry.phonetic || entry.phonetics?.find(p => p.text)?.text || '';
        result.english = firstMeaning.definition || '';
        result.example = isEnglishExample(firstMeaning.example) ? firstMeaning.example : '';
      }
    } catch (_) { /* translate fallback below */ }

    try {
      const textToTranslate = result.english || term;
      const response = await fetch(TRANSLATE_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToTranslate, from: 'en', to: 'vi' })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.text) result.meaning = data.text;
      }
    } catch (_) { /* keep dictionary result */ }

    if (!isEnglishExample(result.example)) result.example = '';
    return result;
  }

  async function loadTopics(select) {
    const response = await send('get-app-topics');
    if (!response?.ok) throw new Error(response?.error || 'Không tải được topic.');
    const topics = response.data || [];
    if (!topics.length) throw new Error('App chưa có topic để thêm từ.');
    select.innerHTML = topics.map(topic => `<option value="${esc(topic.id)}">${esc(topic.name)}</option>`).join('');
  }

  function showPanel(x, y, result) {
    closePanel();
    panel = document.createElement('div');
    panel.className = 'hi-vocab-panel';
    panel.style.left = `${Math.min(x, innerWidth - 326)}px`;
    panel.style.top = `${Math.min(y, innerHeight - 300)}px`;
    panel.innerHTML = `<h3>${esc(result.word)}</h3><div class="hi-vocab-muted">${esc(result.phonetic || 'Chưa có IPA')}</div><div class="hi-vocab-meaning">${esc(result.meaning || 'Chưa lấy được nghĩa Việt')}</div><div class="hi-vocab-example">${esc(result.example || 'Chưa có câu ví dụ')}</div><select aria-label="Chọn topic"><option>Đang tải topic...</option></select><div class="hi-vocab-actions"><button class="hi-vocab-add">Thêm vào app</button></div><div class="hi-vocab-status"></div>`;
    root.appendChild(panel);
    const select = panel.querySelector('select');
    const status = panel.querySelector('.hi-vocab-status');
    loadTopics(select).catch(error => { status.textContent = error.message; select.disabled = true; panel.querySelector('.hi-vocab-add').disabled = true; });
    panel.querySelector('.hi-vocab-add').onclick = async () => {
      const button = panel.querySelector('.hi-vocab-add');
      button.disabled = true; status.textContent = 'Đang thêm...';
      const response = await send('add-to-app', { topicId: select.value, word: result.word, phonetic: result.phonetic, meaning: result.meaning, exampleSentence: result.example });
      if (response?.ok) { status.style.color = '#19734b'; status.textContent = 'Đã thêm vào app.'; setTimeout(closePanel, 900); }
      else { button.disabled = false; status.textContent = response?.error || 'Không thêm được từ.'; }
    };
  }

  document.addEventListener('mouseup', event => {
    if (root.contains(event.target)) return;
    const term = String(getSelection()?.toString() || '').trim().replace(/\s+/g, ' ');
    if (!term || term.length > 80) { removeFab(); return; }
    const rect = getSelection().getRangeAt(0).getBoundingClientRect();
    removeFab();
    fab = document.createElement('button'); fab.className = 'hi-vocab-fab'; fab.title = 'Tra và lưu từ';
    fab.innerHTML = `<img src="${chrome.runtime.getURL('logo-mark.svg')}" alt="Hi" />`;
    fab.style.left = `${Math.min(Math.max(8, rect.right - 18), innerWidth - 48)}px`;
    fab.style.top = `${Math.min(Math.max(8, rect.bottom + 8), innerHeight - 48)}px`;
    root.appendChild(fab);
    fab.onclick = async () => { const button = fab; button.disabled = true; button.innerHTML = '<span class="hi-vocab-spinner">...</span>'; current = await lookup(term); showPanel(rect.right - 18, rect.bottom + 52, current); removeFab(); };
  });
  document.addEventListener('mousedown', event => {
    if (!panel || root.contains(event.target)) return;
    closePanel();
  });
  document.addEventListener('scroll', () => { removeFab(); closePanel(); }, true);

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
      sendResponse({ ok: false, error: 'App chưa sẵn sàng. Hãy thử lại sau vài giây hoặc đăng nhập lại.' });
    }, 12000);
    window.addEventListener('message', handler);
    return true;
  });
})();
