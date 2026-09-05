const DICT_URL      = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
const TRANSLATE_URL = 'https://hivocab.vercel.app/api/translate';
const EXAMPLE_URL   = 'https://hivocab.vercel.app/api/example';

let requestId       = 0;
let currentResult   = null;
let topicsReady     = false;
let currentAudioEl  = null;   // Audio element pre-loaded (phát tức thì)
let currentAudioUrl = null;   // fallback URL
let _loginPollTimer = null;


const loginCard      = document.getElementById('loginCard');
const mainContent    = document.getElementById('mainContent');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const loginStatus    = document.getElementById('loginStatus');
const logoutButton   = document.getElementById('logoutButton');

const termInput    = document.getElementById('termInput');
const searchForm   = document.getElementById('searchForm');
const lookupButton = document.getElementById('lookupButton');
const resultCard   = document.getElementById('resultCard');
const wordText     = document.getElementById('wordText');
const phoneticText = document.getElementById('phoneticText');
const meaningText  = document.getElementById('meaningText');
const exampleText  = document.getElementById('exampleText');
const audioBtn         = document.getElementById('audioBtn');
const openSaveModalBtn = document.getElementById('openSaveModalBtn');
const statusText       = document.getElementById('statusText');
const authStatus       = document.getElementById('authStatus');

const saveModal        = document.getElementById('saveModal');
const modalBackBtn     = document.getElementById('modalBackBtn');
const modalCloseBtn    = document.getElementById('modalCloseBtn');
const modalTitle       = document.getElementById('modalTitle');
const modalSubtitle    = document.getElementById('modalSubtitle');
const folderStepView   = document.getElementById('folderStepView');
const topicStepView    = document.getElementById('topicStepView');
const modalFolderList  = document.getElementById('modalFolderList');
const modalTopicList   = document.getElementById('modalTopicList');
const modalStatus      = document.getElementById('modalStatus');

let _allTopics       = [];
let _foldersMap      = {};
let _currentFolder   = null;

// ── Message helper ────────────────────────────────────────────────────────
function send(type, payload = {}) {
  return new Promise(resolve => {
    const id = `popup-${Date.now()}-${++requestId}`;
    chrome.runtime.sendMessage({ type, requestId: id, payload }, resolve);
  });
}

function setStatus(message = '', tone = '') {
  statusText.textContent = message;
  statusText.className = `status-text${tone ? ` is-${tone}` : ''}`;
}

function setBusy(isBusy) {
  lookupButton.disabled  = isBusy;
  lookupButton.textContent = isBusy ? 'Đang tra...' : 'Tra';
}

function esc(value) {
  return String(value || '').replace(/[&<>"']/g, c => (
    { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'": '&#39;' }[c]
  ));
}

function isEnglishExample(value) {
  const text = String(value || '').trim();
  if (!text || !/[a-z]/i.test(text)) return false;
  if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text)) return false;
  if (/\b(và|là|của|cho|trong|một|những|các|được|không|với|khi|từ|người|này|đó)\b/i.test(text)) return false;
  return true;
}

// ── Audio ─────────────────────────────────────────────────────────────────
function speakWord(word, audioEl, audioUrl) {
  if (!word) return;
  audioBtn.classList.add('playing');
  setTimeout(() => audioBtn.classList.remove('playing'), 1200);

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
  const utter  = new SpeechSynthesisUtterance(word);
  utter.lang   = 'en-US';
  utter.rate   = 0.9;
  const voices = window.speechSynthesis.getVoices();
  const voice  = voices.find(v => v.lang === 'en-US' && !v.localService)
              || voices.find(v => v.lang === 'en-US')
              || voices.find(v => v.lang.startsWith('en'));
  if (voice) utter.voice = voice;
  window.speechSynthesis.speak(utter);
}

// ── Tạo câu ví dụ bằng Groq ──────────────────────────────────────────────
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

const lookupCache = new Map();

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

// ── Lookup ────────────────────────────────────────────────────────────────
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
    audioEl:        null,
    hasRealExample: false,
    isPhrase,
  };

  const translatePromise = fetchWithTimeout(TRANSLATE_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ text: term.trim(), from: 'en', to: 'vi' }),
  }, 4000).then(r => r && r.ok ? r.json() : null).catch(() => null);

  const dictPromise = isPhrase
    ? Promise.resolve(null)
    : fetchWithTimeout(DICT_URL + encodeURIComponent(key), {}, 2500)
        .then(r => r && r.ok ? r.json() : null)
        .catch(() => null);

  const [translateData, dictData] = await Promise.all([translatePromise, dictPromise]);

  if (translateData?.ok && translateData?.text) result.meaning = translateData.text;

  if (Array.isArray(dictData) && dictData.length > 0) {
    const entry = dictData[0];
    result.word     = entry.word || term.trim();
    result.phonetic = entry.phonetic || entry.phonetics?.find(p => p.text)?.text || '';

    if (entry.phonetics) {
      const withAudio = entry.phonetics.filter(p => p.audio);
      const us        = withAudio.find(p => p.audio.includes('-us.'));
      const audioUrl  = (us || withAudio[0])?.audio || null;
      if (audioUrl) {
        result.audioUrl = audioUrl;
        const audio     = new Audio(audioUrl);
        audio.preload   = 'auto';
        audio.load();
        result.audioEl  = audio;
      }
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
    if (foundExample) {
      result.example        = foundExample;
      result.hasRealExample = true;
    }
  }

  lookupCache.set(key, result);
  return result;
}

// ── Render ────────────────────────────────────────────────────────────────
function renderResult(result) {
  currentResult   = result;
  currentAudioEl  = result.audioEl  || null;
  currentAudioUrl = result.audioUrl || null;

  resultCard.classList.remove('is-empty');
  wordText.textContent     = result.word;
  phoneticText.textContent = result.phonetic || '';
  meaningText.textContent  = result.meaning  || 'Không lấy được nghĩa';

  exampleText.textContent = result.hasRealExample
    ? result.example
    : (result.example ? result.example : 'Đang tạo câu ví dụ...');

  audioBtn.style.display = result.word ? 'flex' : 'none';

  updateSaveState();
}

function updateSaveState() {
  if (openSaveModalBtn) {
    openSaveModalBtn.disabled = !currentResult?.meaning;
  }
}

// ── Auth & Topics ─────────────────────────────────────────────────────────
async function checkAndShowUI() {
  const authRes = await send('check-auth');
  if (authRes?.ok && authRes?.loggedIn) {
    loginCard.style.display  = 'none';
    mainContent.style.display = 'block';
    logoutButton.style.display = 'flex';
    loadTopics();
    loadSelectedText();
    termInput.focus();
  } else {
    loginCard.style.display  = 'flex';
    mainContent.style.display = 'none';
    logoutButton.style.display = 'none';
  }
}

async function loadTopics() {
  if (authStatus) authStatus.textContent = 'Đang tải...';
  topicsReady = false;

  const response = await send('get-app-topics');
  if (!response?.ok) {
    topicsReady = false;
    const isAuthError = (response?.error || '').includes('đăng nhập');
    if (isAuthError) { checkAndShowUI(); return; }
    if (authStatus) authStatus.textContent = 'Lỗi kết nối';
    setStatus(response?.error || 'Không tải được topic.', 'error');
    return;
  }

  _allTopics = response.data || [];
  if (!_allTopics.length) {
    topicsReady = false;
    if (authStatus) authStatus.textContent = 'Đã đăng nhập';
    setStatus('App chưa có topic để thêm từ.', 'error');
    return;
  }

  // Nhóm topics theo category / thư mục
  _foldersMap = {};
  _allTopics.forEach(t => {
    const folder = (t.category || 'General English').trim();
    if (!_foldersMap[folder]) _foldersMap[folder] = [];
    _foldersMap[folder].push(t);
  });

  topicsReady = true;
  if (authStatus) authStatus.textContent = 'Đã đăng nhập';
  setStatus('', '');
  updateSaveState();
}

// ── Pop-up Modal: Chọn Folder -> Chọn Topic ────────────────────────────────
async function openSaveModal() {
  if (!currentResult?.meaning) return;
  if (!topicsReady) {
    setStatus('Đang tải danh sách thư mục...', '');
    await loadTopics();
    if (!topicsReady) {
      setStatus('Chưa tải được chủ đề. Vui lòng thử lại.', 'error');
      return;
    }
  }
  saveModal.style.display = 'flex';
  renderFolderStep();
}

function closeSaveModal() {
  saveModal.style.display = 'none';
  modalStatus.style.display = 'none';
}

function renderFolderStep() {
  _currentFolder = null;
  modalBackBtn.style.display = 'none';
  modalTitle.textContent = 'Chọn thư mục';
  modalSubtitle.textContent = currentResult?.word ? `Từ: "${currentResult.word}"` : 'Lưu vào bộ từ vựng';
  folderStepView.style.display = 'block';
  topicStepView.style.display = 'none';
  modalStatus.style.display = 'none';

  const folderNames = Object.keys(_foldersMap).sort((a, b) => {
    if (a.toLowerCase() === 'cam') return -1;
    if (b.toLowerCase() === 'cam') return 1;
    if (a.toLowerCase() === 'ielts') return -1;
    if (b.toLowerCase() === 'ielts') return 1;
    return a.localeCompare(b, 'vi');
  });

  if (!folderNames.length) {
    modalFolderList.innerHTML = '<p class="status-text">Không có thư mục nào</p>';
    return;
  }

  modalFolderList.innerHTML = folderNames.map(f => `
    <button type="button" class="picker-item" data-folder="${esc(f)}">
      <div class="picker-item-left">
        <span class="picker-icon">📁</span>
        <span class="picker-name">${esc(f)}</span>
      </div>
      <span class="picker-badge">${_foldersMap[f].length} chủ đề ›</span>
    </button>
  `).join('');

  modalFolderList.querySelectorAll('.picker-item').forEach(btn => {
    btn.onclick = () => selectFolder(btn.dataset.folder);
  });
}

function selectFolder(folderName) {
  _currentFolder = folderName;
  modalBackBtn.style.display = 'inline-flex';
  modalTitle.textContent = folderName;
  modalSubtitle.textContent = 'Chọn chủ đề để lưu từ';
  folderStepView.style.display = 'none';
  topicStepView.style.display = 'block';
  modalStatus.style.display = 'none';

  const topicsInFolder = _foldersMap[folderName] || [];
  if (!topicsInFolder.length) {
    modalTopicList.innerHTML = '<p class="status-text">Thư mục này chưa có chủ đề</p>';
    return;
  }

  modalTopicList.innerHTML = topicsInFolder.map(t => `
    <button type="button" class="picker-item" data-topic-id="${esc(t.id)}" data-topic-name="${esc(t.name)}">
      <div class="picker-item-left">
        <span class="picker-icon">📖</span>
        <span class="picker-name">${esc(t.name)}</span>
      </div>
      <span class="picker-save-badge">+ Lưu</span>
    </button>
  `).join('');

  modalTopicList.querySelectorAll('.picker-item').forEach(btn => {
    btn.onclick = () => saveWordToTopic(btn.dataset.topicId, btn.dataset.topicName);
  });
}

async function saveWordToTopic(topicId, topicName) {
  if (!currentResult || !topicId) return;

  modalStatus.style.display = 'block';
  modalStatus.style.color = 'var(--primary)';
  modalStatus.textContent = `Đang lưu vào "${topicName}"...`;

  const topicBtns = modalTopicList.querySelectorAll('.picker-item');
  topicBtns.forEach(b => { b.style.pointerEvents = 'none'; b.style.opacity = '0.6'; });

  const response = await send('add-to-app', {
    topicId,
    word:            currentResult.word,
    phonetic:        currentResult.phonetic,
    meaning:         currentResult.meaning,
    exampleSentence: currentResult.example,
  });

  if (response?.ok) {
    showPopupSuccessAnimation(currentResult.word, topicName, () => {
      window.close();
    });
  } else {
    topicBtns.forEach(b => { b.style.pointerEvents = ''; b.style.opacity = ''; });
    modalStatus.style.color = 'var(--danger)';
    modalStatus.textContent = response?.error || 'Không lưu được từ.';
  }
}

function showPopupSuccessAnimation(word, topicName, onDone) {
  const overlay = document.createElement('div');
  overlay.className = 'hiv-success-overlay';
  overlay.innerHTML = `
    <div class="hiv-success-card">
      <div class="hiv-checkmark-wrap">
        <svg class="hiv-checkmark-svg" viewBox="0 0 52 52">
          <circle class="hiv-checkmark-circle" cx="26" cy="26" r="23" fill="none"/>
          <path class="hiv-checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
        </svg>
      </div>
      <h3 class="hiv-success-title">Đã lưu từ thành công!</h3>
      <p class="hiv-success-detail">
        <span class="hiv-success-word">${esc(word)}</span>
        <span class="hiv-success-arrow">➔</span>
        <span class="hiv-success-topic">${esc(topicName)}</span>
      </p>
      <span class="hiv-success-hint">Đang đóng extension...</span>
    </div>
  `;
  document.body.appendChild(overlay);

  setTimeout(() => {
    overlay.style.transition = 'opacity 0.25s ease-out';
    overlay.style.opacity = '0';
    setTimeout(() => {
      if (onDone) onDone();
    }, 250);
  }, 1400);
}

async function loadSelectedText() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !/^https?:\/\//i.test(tab.url || '')) return;
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => String(window.getSelection()?.toString() || '').trim().replace(/\s+/g, ' ')
    });
    if (result && result.length <= 80) {
      termInput.value = result;
      await runLookup(result);
    }
  } catch (_) {}
}

async function runLookup(term) {
  const cleanTerm = String(term || '').trim().replace(/\s+/g, ' ');
  if (!cleanTerm) return;
  setBusy(true);
  setStatus('', '');
  try {
    const result = await lookup(cleanTerm);
    renderResult(result);

    if (!result.hasRealExample) {
      generateExample(cleanTerm, result.isPhrase).then(sentence => {
        if (!sentence) return;
        const cached = lookupCache.get(cleanTerm.toLowerCase());
        if (cached) { cached.example = sentence; cached.hasRealExample = true; }
        if (currentResult?.word === result.word) {
          currentResult.example = sentence;
          exampleText.textContent = sentence;
        }
      });
    }
  } catch (error) {
    setStatus(error?.message || 'Không tra được từ này.', 'error');
  } finally {
    setBusy(false);
  }
}

// ── Event listeners ───────────────────────────────────────────────────────
searchForm.addEventListener('submit', e => { e.preventDefault(); runLookup(termInput.value); });

if (openSaveModalBtn) {
  openSaveModalBtn.addEventListener('click', openSaveModal);
}
if (modalCloseBtn) {
  modalCloseBtn.addEventListener('click', closeSaveModal);
}
if (modalBackBtn) {
  modalBackBtn.addEventListener('click', renderFolderStep);
}
if (saveModal) {
  saveModal.addEventListener('click', e => {
    if (e.target === saveModal) closeSaveModal();
  });
}

// Dùng pre-loaded audioEl để phát gần như tức thì
audioBtn.addEventListener('click', () => {
  if (currentResult?.word) speakWord(currentResult.word, currentAudioEl, currentAudioUrl);
});


// ── Login polling (tránh treo khi service worker bị restart) ─────────────
function startLoginPolling() {
  if (_loginPollTimer) return;
  let attempts = 0;
  _loginPollTimer = setInterval(async () => {
    attempts++;
    const authRes = await send('check-auth');
    if (authRes?.loggedIn) {
      stopLoginPolling();
      checkAndShowUI();
    } else if (attempts >= 80) { // tối đa 2 phút
      stopLoginPolling();
      loginStatus.textContent = 'Hết thời gian chờ. Vui lòng thử lại.';
    }
  }, 1500);
}

function stopLoginPolling() {
  if (_loginPollTimer) { clearInterval(_loginPollTimer); _loginPollTimer = null; }
}

googleLoginBtn.addEventListener('click', async () => {
  loginStatus.textContent = 'Đang mở cửa sổ đăng nhập...';
  googleLoginBtn.disabled = true;
  const res = await send('open-app');
  googleLoginBtn.disabled = false;
  if (!res?.ok) {
    loginStatus.textContent = res?.error || 'Không thể mở cửa sổ đăng nhập.';
    return;
  }
  // Bắt đầu poll — kể cả khi login-success message bị mất
  startLoginPolling();
});

logoutButton.addEventListener('click', async () => {
  await chrome.storage.local.remove('hivocab_session');
  currentResult   = null;
  currentAudioUrl = null;
  checkAndShowUI();
});

chrome.runtime.onMessage.addListener(message => {
  if (message?.type === 'login-success') checkAndShowUI();
});

document.addEventListener('DOMContentLoaded', () => {
  window.speechSynthesis?.getVoices(); // pre-warm
  checkAndShowUI();
});
