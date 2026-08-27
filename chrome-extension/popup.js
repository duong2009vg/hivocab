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
const audioBtn     = document.getElementById('audioBtn');
const topicSelect  = document.getElementById('topicSelect');
const saveButton   = document.getElementById('saveButton');
const statusText   = document.getElementById('statusText');
const authStatus   = document.getElementById('authStatus');

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

  // Ưu tiên audioEl (đã pre-load, phát gần như tức thì)
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
    audioEl:        null,    // Audio element pre-loaded
    hasRealExample: false,
    isPhrase,
  };

  // DeepL (4s) + FreeDict (2.5s) song song
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

    // Pre-load audio element ngay khi có URL (buffer ngầm, phát tức thì)
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

  // Nếu có ví dụ thực → hiện ngay; nếu không → báo đang tạo (Groq sẽ điền sau)
  exampleText.textContent = result.hasRealExample
    ? result.example
    : (result.example ? result.example : 'Đang tạo câu ví dụ...');

  // Hiện nút audio nếu có word
  audioBtn.style.display = result.word ? 'flex' : 'none';


  updateSaveState();
}

function updateSaveState() {
  saveButton.disabled = !currentResult?.meaning || !topicsReady || !topicSelect.value;
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
  authStatus.textContent = 'Đang tải...';
  topicSelect.disabled   = true;
  saveButton.disabled    = true;

  const response = await send('get-app-topics');
  if (!response?.ok) {
    topicsReady = false;
    topicSelect.innerHTML = '<option>Chưa kết nối</option>';
    const isAuthError = (response?.error || '').includes('đăng nhập');
    if (isAuthError) { checkAndShowUI(); return; }
    authStatus.textContent = 'Lỗi kết nối';
    setStatus(response?.error || 'Không tải được topic.', 'error');
    return;
  }

  const topics = response.data || [];
  if (!topics.length) {
    topicsReady = false;
    topicSelect.innerHTML  = '<option>Chưa có topic</option>';
    authStatus.textContent = 'Đã đăng nhập';
    setStatus('App chưa có topic để thêm từ.', 'error');
    return;
  }

  topicsReady            = true;
  authStatus.textContent = 'Đã đăng nhập';
  topicSelect.disabled   = false;
  topicSelect.innerHTML  = topics.map(t => `<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('');
  setStatus('', '');
  updateSaveState();
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

    // Nếu FreeDict không có ví dụ → gọi Groq tạo ví dụ (non-blocking, ~500ms)
    if (!result.hasRealExample) {
      generateExample(cleanTerm, result.isPhrase).then(sentence => {
        if (!sentence) return;
        // Cập nhật cache
        const cached = lookupCache.get(cleanTerm.toLowerCase());
        if (cached) { cached.example = sentence; cached.hasRealExample = true; }
        // Cập nhật currentResult nếu vẫn là từ này
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

topicSelect.addEventListener('change', updateSaveState);

saveButton.addEventListener('click', async () => {
  if (!currentResult || !topicSelect.value) return;
  saveButton.disabled = true;
  setStatus('Đang lưu...', '');
  const response = await send('add-to-app', {
    topicId:         topicSelect.value,
    word:            currentResult.word,
    phonetic:        currentResult.phonetic,
    meaning:         currentResult.meaning,
    exampleSentence: currentResult.example,
  });
  if (response?.ok) {
    setStatus('Đã lưu vào app ✓', 'success');
  } else {
    setStatus(response?.error || 'Không lưu được từ.', 'error');
  }
  updateSaveState();
});

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
