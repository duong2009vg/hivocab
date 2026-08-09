const DICT_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
const GROQ_URL = 'https://groq-proxy-sandy.vercel.app/api/groq';

let requestId = 0;
let currentResult = null;
let topicsReady = false;

const termInput = document.getElementById('termInput');
const searchForm = document.getElementById('searchForm');
const lookupButton = document.getElementById('lookupButton');
const loginButton = document.getElementById('loginButton');
const resultCard = document.getElementById('resultCard');
const wordText = document.getElementById('wordText');
const phoneticText = document.getElementById('phoneticText');
const meaningText = document.getElementById('meaningText');
const exampleText = document.getElementById('exampleText');
const topicSelect = document.getElementById('topicSelect');
const saveButton = document.getElementById('saveButton');
const statusText = document.getElementById('statusText');
const authStatus = document.getElementById('authStatus');

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

function parseJsonBlock(raw) {
  const clean = String(raw || '').replace(/```json|```/g, '').trim();
  return JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0] || '{}');
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
    // AI fallback below.
  }

  try {
    const prompt = `Translate this English vocabulary item into concise Vietnamese flashcard data. Return only JSON: {"meaning":"1-3 short Vietnamese meanings","example":"one natural English example sentence in English only, no Vietnamese words"}. The example field must be 100% English. Word: ${term}. English definition: ${result.english || '(not available)'}`;
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 180
      })
    });
    if (response.ok) {
      const data = await response.json();
      const parsed = parseJsonBlock(data.choices?.[0]?.message?.content || '');
      result.meaning = parsed.meaning || '';
      if (!result.example && isEnglishExample(parsed.example)) result.example = parsed.example;
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

async function loadTopics() {
  authStatus.textContent = 'Đang kiểm tra đăng nhập...';
  topicSelect.disabled = true;
  saveButton.disabled = true;

  const response = await send('get-app-topics');
  if (!response?.ok) {
    topicsReady = false;
    topicSelect.innerHTML = '<option>Chưa kết nối app</option>';
    authStatus.textContent = 'Cần đăng nhập app';
    setStatus(response?.error || 'Không tải được topic.', 'error');
    return;
  }

  const topics = response.data || [];
  if (!topics.length) {
    topicsReady = false;
    topicSelect.innerHTML = '<option>Chưa có topic</option>';
    authStatus.textContent = 'Đã kết nối';
    setStatus('App chưa có topic để thêm từ.', 'error');
    return;
  }

  topicsReady = true;
  authStatus.textContent = 'Đã kết nối';
  topicSelect.disabled = false;
  topicSelect.innerHTML = topics.map(topic => `<option value="${esc(topic.id)}">${esc(topic.name)}</option>`).join('');
  setStatus('', '');
  updateSaveState();
}

async function loadSelectedText() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
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

loginButton.addEventListener('click', () => {
  send('open-app');
});

document.addEventListener('DOMContentLoaded', () => {
  loadTopics();
  loadSelectedText();
  termInput.focus();
});
