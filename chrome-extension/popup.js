const DICT_URL      = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
const TRANSLATE_URL = 'https://hivocab.vercel.app/api/translate';

let requestId   = 0;
let currentResult = null;
let topicsReady   = false;
let currentAudioUrl = null;

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
function speakWord(word, audioUrl) {
  if (!word) return;

  audioBtn.classList.add('playing');
  setTimeout(() => audioBtn.classList.remove('playing'), 1200);

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

// ── Lookup ────────────────────────────────────────────────────────────────
async function lookup(term) {
  const result = { word: term, phonetic: '', meaning: '', example: '', audioUrl: null };
  const isPhrase = term.trim().includes(' ');

  // Chạy DeepL và Free Dictionary song song
  const translatePromise = fetch(TRANSLATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: term.trim(), from: 'en', to: 'vi' })
  }).then(r => r.ok ? r.json() : null).catch(() => null);

  const dictPromise = isPhrase
    ? Promise.resolve(null)
    : fetch(DICT_URL + encodeURIComponent(term))
        .then(r => r.ok ? r.json() : null)
        .catch(() => null);

  const [translateData, dictData] = await Promise.all([translatePromise, dictPromise]);

  // Nghĩa tiếng Việt từ DeepL
  if (translateData?.ok && translateData?.text) result.meaning = translateData.text;

  // IPA + audio + ví dụ từ Free Dictionary
  if (Array.isArray(dictData) && dictData.length > 0) {
    const entry = dictData[0];
    result.word     = entry.word || term;
    result.phonetic = entry.phonetic || entry.phonetics?.find(p => p.text)?.text || '';

    // Audio URL (ưu tiên US)
    if (entry.phonetics) {
      const withAudio = entry.phonetics.filter(p => p.audio);
      const us = withAudio.find(p => p.audio.includes('-us.'));
      result.audioUrl = (us || withAudio[0])?.audio || null;
    }

    // Tìm câu ví dụ hợp lệ đầu tiên qua toàn bộ entries + meanings
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

  // Fallback ví dụ
  if (!result.example) {
    result.example = isPhrase
      ? `She used the phrase "${term.trim()}" in a sentence today.`
      : `She learned how to use "${term}" in a sentence today.`;
  }

  return result;
}

// ── Render ────────────────────────────────────────────────────────────────
function renderResult(result) {
  currentResult   = result;
  currentAudioUrl = result.audioUrl || null;

  resultCard.classList.remove('is-empty');
  wordText.textContent     = result.word;
  phoneticText.textContent = result.phonetic || '';
  meaningText.textContent  = result.meaning  || 'Không lấy được nghĩa';
  exampleText.textContent  = result.example  || '';

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
    renderResult(await lookup(cleanTerm));
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

audioBtn.addEventListener('click', () => {
  if (currentResult?.word) speakWord(currentResult.word, currentAudioUrl);
});

googleLoginBtn.addEventListener('click', async () => {
  loginStatus.textContent = 'Đang mở cửa sổ đăng nhập...';
  const res = await send('open-app');
  if (!res?.ok) loginStatus.textContent = res?.error || 'Không thể mở cửa sổ đăng nhập.';
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
