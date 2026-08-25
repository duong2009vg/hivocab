const DICT_URL      = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
const TRANSLATE_URL = 'https://hivocab.vercel.app/api/translate';

let requestId = 0;
let currentResult = null;
let topicsReady = false;

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
const topicSelect  = document.getElementById('topicSelect');
const saveButton   = document.getElementById('saveButton');
const statusText   = document.getElementById('statusText');
const authStatus   = document.getElementById('authStatus');

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
  lookupButton.disabled = isBusy;
  lookupButton.textContent = isBusy ? 'Đang tra' : 'Tra';
}

function esc(value) {
  return String(value || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function isEnglishExample(value) {
  const text = String(value || '').trim();
  if (!text || !/[a-z]/i.test(text)) return false;
  if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text)) return false;
  if (/\b(và|là|của|cho|trong|một|những|các|được|không|với|khi|từ|người|này|đó)\b/i.test(text)) return false;
  return true;
}

async function lookup(term) {
  const result = { word: term, phonetic: '', meaning: '', example: '', english: '' };

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
  } catch (_) {
    // Translate fallback below.
  }

  try {
    const textToTranslate = result.english || term;
    const response = await fetch(TRANSLATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: textToTranslate, from: 'en', to: 'vi' })
    });
    if (response.ok) {
      const data = await response.json();
      if (data.ok && data.text) result.meaning = data.text;
    }
  } catch (_) {
    // Keep dictionary result.
  }

  if (!isEnglishExample(result.example)) result.example = '';
  return result;
}

function renderResult(result) {
  currentResult = result;
  resultCard.classList.remove('is-empty');
  wordText.textContent = result.word;
  phoneticText.textContent = result.phonetic || 'Chưa có IPA';
  meaningText.textContent = result.meaning || 'Chưa lấy được nghĩa Việt';
  exampleText.textContent = result.example || 'No English example is available yet.';
  updateSaveState();
}

function updateSaveState() {
  saveButton.disabled = !currentResult?.meaning || !topicsReady || !topicSelect.value;
}

async function checkAndShowUI() {
  const authRes = await send('check-auth');
  if (authRes?.ok && authRes?.loggedIn) {
    loginCard.style.display = 'none';
    mainContent.style.display = 'block';
    logoutButton.style.display = 'flex';
    loadTopics();
    loadSelectedText();
    termInput.focus();
  } else {
    loginCard.style.display = 'flex';
    mainContent.style.display = 'none';
    logoutButton.style.display = 'none';
  }
}

async function loadTopics() {
  authStatus.textContent = 'Đang tải...';
  topicSelect.disabled = true;
  saveButton.disabled = true;

  const response = await send('get-app-topics');
  if (!response?.ok) {
    topicsReady = false;
    topicSelect.innerHTML = '<option>Chưa kết nối</option>';
    const isAuthError = (response?.error || '').includes('đăng nhập');
    if (isAuthError) {
      checkAndShowUI();
      return;
    }
    authStatus.textContent = 'Lỗi kết nối';
    setStatus(response?.error || 'Không tải được topic.', 'error');
    return;
  }

  const topics = response.data || [];
  if (!topics.length) {
    topicsReady = false;
    topicSelect.innerHTML = '<option>Chưa có topic</option>';
    authStatus.textContent = 'Đã đăng nhập';
    setStatus('App chưa có topic để thêm từ.', 'error');
    return;
  }

  topicsReady = true;
  authStatus.textContent = 'Đã đăng nhập';
  topicSelect.disabled = false;
  topicSelect.innerHTML = topics.map(topic => `<option value="${esc(topic.id)}">${esc(topic.name)}</option>`).join('');
  setStatus('', '');
  updateSaveState();
}

async function loadSelectedText() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    if (!/^https?:\/\//i.test(tab.url || '')) return;
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => String(window.getSelection()?.toString() || '').trim().replace(/\s+/g, ' ')
    });
    if (result && result.length <= 80) {
      termInput.value = result;
      await runLookup(result);
    }
  } catch (_) {
    // Pages like chrome:// do not allow script injection.
  }
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

searchForm.addEventListener('submit', event => {
  event.preventDefault();
  runLookup(termInput.value);
});

topicSelect.addEventListener('change', updateSaveState);

saveButton.addEventListener('click', async () => {
  if (!currentResult || !topicSelect.value) return;
  saveButton.disabled = true;
  setStatus('Đang lưu...', '');
  const response = await send('add-to-app', {
    topicId: topicSelect.value,
    word: currentResult.word,
    phonetic: currentResult.phonetic,
    meaning: currentResult.meaning,
    exampleSentence: currentResult.example
  });
  if (response?.ok) {
    setStatus('Đã lưu vào app.', 'success');
  } else {
    setStatus(response?.error || 'Không lưu được từ.', 'error');
  }
  updateSaveState();
});

googleLoginBtn.addEventListener('click', async () => {
  loginStatus.textContent = 'Đang mở cửa sổ đăng nhập...';
  const res = await send('open-app');
  if (!res?.ok) {
    loginStatus.textContent = res?.error || 'Không thể mở cửa sổ đăng nhập.';
  }
});

logoutButton.addEventListener('click', async () => {
  await chrome.storage.local.remove('hivocab_session');
  checkAndShowUI();
});

chrome.runtime.onMessage.addListener(message => {
  if (message?.type === 'login-success') {
    checkAndShowUI();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  checkAndShowUI();
});
