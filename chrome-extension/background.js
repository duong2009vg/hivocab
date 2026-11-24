const APP_URL           = 'https://hivocab.site';
const API_BASE_URL      = 'https://hivocab.site/api';
const SUPABASE_URL      = 'https://swehdtrqjyklmsefkjdf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3ZWhkdHJxanlrbG1zZWZramRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTc4MDcsImV4cCI6MjA5Mzk3MzgwN30.dXRhEmvS8J21aJ3dwZ4jHaWuKbhNw2yys90YTIop2EU';

// ── Session storage helpers ───────────────────────────────────────────────

function saveSession(session) {
    return chrome.storage.session.set({ hivocab_session: session });
}

function clearSession() {
    return chrome.storage.session.remove('hivocab_session');
}

async function getSession() {
    const data = await chrome.storage.session.get('hivocab_session');
    return data.hivocab_session || null;
}

// ── Login window ID (dùng session storage để sống qua service worker restart) ──

async function getLoginWindowId() {
    const data = await chrome.storage.session.get('loginWindowId').catch(() => ({}));
    return data.loginWindowId ?? null;
}

async function setLoginWindowId(id) {
    if (id === null) {
        await chrome.storage.session.remove('loginWindowId').catch(() => {});
    } else {
        await chrome.storage.session.set({ loginWindowId: id }).catch(() => {});
    }
}

// Theo dõi khi cửa sổ đăng nhập bị đóng thủ công
chrome.windows.onRemoved.addListener(async (removedWinId) => {
    const currentId = await getLoginWindowId();
    if (currentId === removedWinId) {
        await setLoginWindowId(null);
    }
});

// ── Token management (auto-refresh, tab sync & Supabase fallback) ─────────────

async function refreshSessionToken(session) {
    if (!session?.refresh_token) return null;

    // 1. Thử qua backend API
    try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: session.refresh_token }),
        });
        if (res.ok) {
            const data = await res.json().catch(() => null);
            if (data?.ok && data?.access_token) {
                await saveSession({
                    access_token:  data.access_token,
                    refresh_token: data.refresh_token || session.refresh_token,
                    expires_at:    data.expires_at,
                });
                return data.access_token;
            }
        }
    } catch (_) {}

    // 2. Fallback trực tiếp qua Supabase Auth REST
    try {
        const sbRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ refresh_token: session.refresh_token }),
        });
        if (sbRes.ok) {
            const data = await sbRes.json().catch(() => null);
            if (data?.access_token) {
                await saveSession({
                    access_token:  data.access_token,
                    refresh_token: data.refresh_token || session.refresh_token,
                    expires_at:    data.expires_at,
                });
                return data.access_token;
            }
        } else if (sbRes.status === 400 || sbRes.status === 401) {
            await clearSession();
            return null;
        }
    } catch (_) {}

    return null;
}

async function getValidToken({ forceRefresh = false, syncTabs = true } = {}) {
    let session = await getSession();
    if (!session?.access_token && syncTabs) {
        await trySyncFromOpenTabs();
        session = await getSession();
    }
    if (!session?.access_token) return null;

    const nowSec = Math.floor(Date.now() / 1000);
    const isExpiringSoon = session.expires_at && (session.expires_at - nowSec) < 300;

    if (!forceRefresh && !isExpiringSoon) return session.access_token;

    if (session.refresh_token) {
        const refreshed = await refreshSessionToken(session);
        if (refreshed) return refreshed;
    }

    if (!forceRefresh && session.expires_at && (session.expires_at - nowSec) > 0) {
        return session.access_token;
    }

    if (syncTabs) {
        const synced = await trySyncFromOpenTabs();
        if (synced && synced !== session.access_token) return synced;
    }

    await clearSession();
    return null;
}

// ── Tự động đồng bộ token từ các tab HiVocab đang mở ────────────────────────

async function trySyncFromOpenTabs() {
    try {
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
            if (!tab.id || !tab.url) continue;
            let isHiVocab = false;
            try {
                const parsedUrl = new URL(tab.url);
                const protocol = parsedUrl.protocol;
                const hostname = parsedUrl.hostname.toLowerCase();

                const isHttps = protocol === 'https:';
                const isHttpLocal = (protocol === 'http:' || protocol === 'https:') &&
                    (hostname === 'localhost' || hostname === '127.0.0.1');

                if (isHttps && (hostname === 'hivocab.site' || hostname.endsWith('.hivocab.site') || hostname === 'hivocab.vercel.app')) {
                    isHiVocab = true;
                } else if (isHttpLocal) {
                    isHiVocab = true;
                }
            } catch (_) {
                continue;
            }
            if (!isHiVocab) continue;

            try {
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => {
                        try {
                            const sbKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
                            const raw = sbKey ? localStorage.getItem(sbKey) : null;
                            if (!raw) return null;
                            const parsed = JSON.parse(raw);
                            return parsed?.access_token ? {
                                access_token:  parsed.access_token,
                                refresh_token: parsed.refresh_token || null,
                                expires_at:    parsed.expires_at    || null,
                            } : null;
                        } catch (_) {
                            return null;
                        }
                    }
                });
                const session = results?.[0]?.result;
                if (session?.access_token) {
                    await saveSession(session);
                    return session.access_token;
                }
            } catch (_) {}
        }
    } catch (_) {}
    return null;
}

// ── API & Dictionary lookup helpers ───────────────────────────────────────────

const VALID_DICT_WORD_RE = /^[A-Za-z0-9][A-Za-z0-9\s\-'.]{0,79}$/;

async function fetchWithTimeout(url, options = {}, timeoutMs = 4500) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: ctrl.signal });
    } catch (_) {
        return null;
    } finally {
        clearTimeout(timer);
    }
}

async function apiGet(path, token) {
    const res = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
    }, 6000);
    if (!res) return null;
    return res.json().catch(() => null);
}

async function apiPost(path, token, body, timeoutMs = 8000) {
    const res = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    }, timeoutMs);
    if (!res) return null;
    return res.json().catch(() => null);
}

async function apiPostWithAuthRetry(path, body, timeoutMs = 8000) {
    let token = await getValidToken({ syncTabs: true });
    if (!token) return { status: 401, ok: false, data: null };

    const sendReq = async (bearer) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${bearer}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        }, timeoutMs);
        if (!res) return { status: 0, ok: false, data: null };
        const data = await res.json().catch(() => null);
        return { status: res.status, ok: res.ok, data };
    };

    let result = await sendReq(token);
    if (result.status === 401) {
        const freshToken = await getValidToken({ forceRefresh: true, syncTabs: true });
        if (freshToken && freshToken !== token) {
            result = await sendReq(freshToken);
        }
        if (result.status === 401) {
            await clearSession();
        }
    }
    return result;
}

function sanitizeLookupTerm(raw) {
    const collapsed = String(raw || '').trim().replace(/\s+/g, ' ').slice(0, 120);
    const trimmedPunct = collapsed.replace(/^[^A-Za-z0-9']+|[^A-Za-z0-9']+$/g, '').trim();
    return (trimmedPunct || collapsed).slice(0, 80);
}

function isEnglishExample(value) {
    const text = String(value || '').trim();
    if (!text || !/[a-z]/i.test(text)) return false;
    if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text)) return false;
    if (/\b(và|là|của|cho|trong|một|những|các|được|không|với|khi|từ|người|này|đó)\b/i.test(text)) return false;
    return true;
}

function cleanMeaningText(raw) {
    const s = String(raw || '').trim();
    if (!s) return '';
    return s.replace(/^(\([a-zA-Z\s.]+\)|\[[a-zA-Z\s.]+\])\s*/, '').trim() || s;
}

function pickValidIpa(rows) {
    for (const row of rows || []) {
        const p = String(row?.phonetic || '').trim();
        if (p && (p.includes('/') || p.includes('[')) && !/^\([a-z]+\)$/i.test(p)) {
            return p;
        }
    }
    return '';
}

async function lookupFromSupabaseRpc(term, token) {
    try {
        const res = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/rpc/lookup_dictionary_word`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ p_word: term }),
        }, 3500);
        if (!res || !res.ok) return null;
        const rows = await res.json().catch(() => null);
        if (!Array.isArray(rows) || rows.length === 0) return null;

        const main = rows.find((r) => r.phonetic && String(r.phonetic).includes('/') && r.example_sentence)
            || rows.find((r) => r.meaning)
            || rows[0];

        const meanings = [];
        const seen = new Set();
        for (const r of rows) {
            const m = cleanMeaningText(r.meaning);
            if (m && !seen.has(m.toLowerCase())) {
                seen.add(m.toLowerCase());
                meanings.push(m);
            }
            if (meanings.length >= 2) break;
        }

        const exampleRow = rows.find((r) => isEnglishExample(r.example_sentence));
        return {
            word: main?.word || term,
            phonetic: pickValidIpa(rows),
            meaning: meanings.join('; '),
            example: exampleRow ? String(exampleRow.example_sentence).trim() : '',
        };
    } catch (_) {
        return null;
    }
}

async function lookupFromFreeDict(word) {
    try {
        const res = await fetchWithTimeout(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`,
            {},
            3000
        );
        if (!res || !res.ok) return null;
        const dictData = await res.json().catch(() => null);
        if (!Array.isArray(dictData) || dictData.length === 0) return null;

        const entry = dictData[0];
        const phonetic = entry.phonetic || entry.phonetics?.find((p) => p.text)?.text || '';
        let audioUrl = null;
        if (Array.isArray(entry.phonetics)) {
            const withAudio = entry.phonetics.filter((p) => p.audio);
            const us = withAudio.find((p) => p.audio.includes('-us.'));
            audioUrl = (us || withAudio[0])?.audio || null;
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

        return {
            word: entry.word || word,
            phonetic,
            audioUrl,
            example: foundExample,
        };
    } catch (_) {
        return null;
    }
}

async function translateFallbackFree(text, from = 'en', to = 'vi') {
    // 1. Google Translate (kiểm tra JSON an toàn, tránh HTML 429)
    try {
        const sl = encodeURIComponent(from || 'en');
        const tl = encodeURIComponent(to || 'vi');
        const gUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
        const gRes = await fetchWithTimeout(gUrl, {}, 3500);
        if (gRes && gRes.ok) {
            const gData = await gRes.json().catch(() => null);
            const trans = Array.isArray(gData?.[0]) ? gData[0].map((seg) => seg[0]).join('').trim() : '';
            if (trans) return { text: trans, source: 'google' };
        }
    } catch (_) {}

    // 2. MyMemory fallback khi Google Translate trả 429 hoặc timeout
    try {
        const langPair = `${encodeURIComponent(from || 'en')}|${encodeURIComponent(to || 'vi')}`;
        const mUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
        const mRes = await fetchWithTimeout(mUrl, {}, 4000);
        if (mRes && mRes.ok) {
            const mData = await mRes.json().catch(() => null);
            const trans = String(mData?.responseData?.translatedText || '').trim();
            if (
                trans &&
                mData?.responseStatus === 200 &&
                !/MYMEMORY WARNING/i.test(trans)
            ) {
                return { text: trans, source: 'mymemory' };
            }
        }
    } catch (_) {}

    return null;
}

async function lookupWordComplete(rawTerm) {
    const cleanTerm = sanitizeLookupTerm(rawTerm);
    if (!cleanTerm) return { ok: false, error: 'Từ cần tra không hợp lệ.' };

    const isPhrase = cleanTerm.includes(' ');
    const result = {
        word: cleanTerm,
        phonetic: '',
        meaning: '',
        example: '',
        audioUrl: null,
        hasRealExample: false,
        isPhrase,
        source: '',
    };

    const token = await getValidToken({ syncTabs: true });

    // Layer 1 (song song): Supabase 70k DB + Free Dictionary API (chạy từ background để không bị CSP trang chặn)
    const [dbHit, freeHit] = await Promise.all([
        lookupFromSupabaseRpc(cleanTerm, token),
        isPhrase ? Promise.resolve(null) : lookupFromFreeDict(cleanTerm),
    ]);

    if (dbHit) {
        result.word = dbHit.word || result.word;
        if (dbHit.phonetic) result.phonetic = dbHit.phonetic;
        if (dbHit.meaning) {
            result.meaning = dbHit.meaning;
            result.source = 'database';
        }
        if (dbHit.example) {
            result.example = dbHit.example;
            result.hasRealExample = true;
        }
    }

    if (freeHit) {
        if (!dbHit?.word && freeHit.word) result.word = freeHit.word;
        if (!result.phonetic && freeHit.phonetic) result.phonetic = freeHit.phonetic;
        if (freeHit.audioUrl) result.audioUrl = freeHit.audioUrl;
        if (!result.example && freeHit.example) {
            result.example = freeHit.example;
            result.hasRealExample = true;
        }
    }

    // Layer 2: Nếu DB chưa có nghĩa -> dùng HiVocab /api/dictionary (KV + DeepSeek/Groq) hoặc /api/translate (nếu đã đăng nhập)
    if (!result.meaning && token) {
        if (VALID_DICT_WORD_RE.test(cleanTerm)) {
            const dictRes = await apiPostWithAuthRetry('/dictionary', { word: cleanTerm }, 9000);
            const d = dictRes?.data?.data;
            if (dictRes?.ok && dictRes?.data?.ok && d) {
                if (d.word) result.word = d.word;
                if (!result.phonetic && d.phonetic) result.phonetic = d.phonetic;
                if (d.meaning || d.viSummary) {
                    result.meaning = d.meaning || d.viSummary;
                    result.source = dictRes.data.source || 'deepseek_ai';
                }
                if (!result.example && d.example && isEnglishExample(d.example)) {
                    result.example = d.example;
                    result.hasRealExample = true;
                }
            }
        }

        if (!result.meaning) {
            const trRes = await apiPostWithAuthRetry('/translate', { text: cleanTerm, from: 'en', to: 'vi' }, 5000);
            if (trRes?.ok && trRes?.data?.ok && trRes?.data?.text) {
                result.meaning = trRes.data.text;
                result.source = trRes.data.source || 'deepl';
            }
        }
    }

    // Layer 3: Fallback miễn phí khi chưa đăng nhập hoặc backend API bận
    if (!result.meaning) {
        const freeTrans = await translateFallbackFree(cleanTerm, 'en', 'vi');
        if (freeTrans?.text) {
            result.meaning = freeTrans.text;
            result.source = freeTrans.source;
        }
    }

    return {
        ok: Boolean(result.meaning || result.phonetic || result.example),
        data: result,
    };
}

// ── Login popup window ────────────────────────────────────────────────────────

async function openLoginWindow() {
    const existingId = await getLoginWindowId();
    if (existingId !== null) {
        try {
            const existingWin = await chrome.windows.get(existingId).catch(() => null);
            if (existingWin) {
                await chrome.windows.update(existingId, { focused: true });
                return;
            }
        } catch (_) {}
        await setLoginWindowId(null);
    }

    const loginUrl = `${APP_URL}/#login`;
    const win = await chrome.windows.create({
        url:     loginUrl,
        type:    'popup',
        width:   520,
        height:  720,
        focused: true,
    });
    await setLoginWindowId(win.id);
}

async function closeLoginWindowIfOpen() {
    const id = await getLoginWindowId();
    if (id === null) return;
    try { await chrome.windows.remove(id); } catch (_) {}
    await setLoginWindowId(null);
    // Thông báo popup
    chrome.runtime.sendMessage({ type: 'login-success' }).catch(() => {});
}

// ── Sender Validation Helpers ─────────────────────────────────────────────────
const VALID_TOPIC_ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;

function isTrustedAppUrl(rawUrl) {
    if (!rawUrl) return false;
    try {
        const parsed = new URL(rawUrl);
        const p = parsed.protocol;
        const h = parsed.hostname.toLowerCase();
        if (p === 'https:' && (h === 'hivocab.site' || h.endsWith('.hivocab.site') || h === 'hivocab.vercel.app')) {
            return true;
        }
        if ((p === 'http:' || p === 'https:') && (h === 'localhost' || h === '127.0.0.1')) {
            return true;
        }
        return false;
    } catch {
        return false;
    }
}

function isExtensionPageSender(sender) {
    if (!sender || sender.id !== chrome.runtime.id || sender.tab) return false;
    const extOrigin = chrome.runtime.getURL('');
    return Boolean(sender.url && sender.url.startsWith(extOrigin));
}

function isTrustedAppSender(sender) {
    if (!sender || sender.id !== chrome.runtime.id) return false;
    if (isExtensionPageSender(sender)) return true;
    return isTrustedAppUrl(sender.url || sender.origin || sender.tab?.url);
}

// ── Message handler ───────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!sender || sender.id !== chrome.runtime.id) return;

    // Content script gửi session đầy đủ (chỉ chấp nhận từ tab HiVocab hợp lệ hoặc popup)
    if (message?.type === 'store-auth-token') {
        if (!isTrustedAppSender(sender)) {
            return sendResponse({ ok: false, error: 'Unauthorized sender' });
        }
        const session = message.session;
        if (session?.access_token) {
            saveSession(session).then(async () => {
                sendResponse({ ok: true });
                await closeLoginWindowIfOpen();
                chrome.runtime.sendMessage({ type: 'login-success' }).catch(() => {});
            });
        } else {
            clearSession().then(() => {
                sendResponse({ ok: true });
                chrome.runtime.sendMessage({ type: 'logout-success' }).catch(() => {});
            });
        }
        return true;
    }

    // Đăng xuất từ popup extension
    if (message?.type === 'logout') {
        if (!isExtensionPageSender(sender)) {
            return sendResponse({ ok: false, error: 'Unauthorized sender' });
        }
        clearSession().then(() => {
            sendResponse({ ok: true });
            chrome.runtime.sendMessage({ type: 'logout-success' }).catch(() => {});
        });
        return true;
    }

    // Mở login popup (chỉ cho phép từ trang/popup của extension)
    if (message?.type === 'open-app') {
        if (!isExtensionPageSender(sender)) {
            return sendResponse({ ok: false, error: 'Unauthorized sender' });
        }
        openLoginWindow()
            .then(() => sendResponse({ ok: true }))
            .catch(err => sendResponse({ ok: false, error: err.message }));
        return true;
    }

    // Nhận thông báo topics đã cập nhật từ tab web app hoặc popup
    if (message?.type === 'topics-updated') {
        if (!isTrustedAppSender(sender)) {
            return sendResponse({ ok: false, error: 'Unauthorized sender' });
        }
        // Broadcast tới tất cả tab (để content scripts xóa cache in-memory)
        chrome.tabs.query({}, (tabs) => {
            (tabs || []).forEach(tab => {
                if (tab.id) {
                    chrome.tabs.sendMessage(tab.id, { type: 'topics-updated' }).catch(() => {});
                }
            });
        });
        // Broadcast tới popup (nếu đang mở)
        chrome.runtime.sendMessage({ type: 'topics-updated' }).catch(() => {});
        sendResponse({ ok: true });
        return true;
    }

    // Tra cứu đầy đủ từ/cụm từ (Supabase 70k DB + FreeDict + /api/dictionary + /api/translate + fallback)
    if (message?.type === 'lookup-word') {
        lookupWordComplete(message.payload?.term)
            .then(res => sendResponse(res))
            .catch(err => sendResponse({ ok: false, error: err?.message || 'Lỗi tra từ.' }));
        return true;
    }

    // Dịch từ/cụm từ qua API có JWT hoặc fallback miễn phí (Google Translate / MyMemory)
    if (message?.type === 'translate-text') {
        (async () => {
            const text = String(message.payload?.text || '').trim().slice(0, 300);
            if (!text) return sendResponse({ ok: false });
            const from = message.payload?.from || 'en';
            const to = message.payload?.to || 'vi';
            const apiRes = await apiPostWithAuthRetry('/translate', { text, from, to }, 5000);
            if (apiRes?.ok && apiRes?.data?.ok && apiRes?.data?.text) {
                return sendResponse({ ok: true, text: apiRes.data.text });
            }
            const freeTrans = await translateFallbackFree(text, from, to);
            if (freeTrans?.text) return sendResponse({ ok: true, text: freeTrans.text });
            sendResponse({ ok: false });
        })().catch(() => sendResponse({ ok: false }));
        return true;
    }

    // Tạo câu ví dụ qua API có JWT user
    if (message?.type === 'generate-example') {
        (async () => {
            const term = sanitizeLookupTerm(message.payload?.term);
            if (!term) return sendResponse({ ok: false });
            const apiRes = await apiPostWithAuthRetry('/example', {
                term,
                isPhrase: Boolean(message.payload?.isPhrase),
            }, 9000);
            if (apiRes?.ok && apiRes?.data?.ok && apiRes?.data?.sentence) {
                return sendResponse({ ok: true, sentence: apiRes.data.sentence });
            }
            sendResponse({ ok: false });
        })().catch(() => sendResponse({ ok: false }));
        return true;
    }

    // Kiểm tra trạng thái đăng nhập (kết hợp tự động sync từ tab nếu chưa có)
    if (message?.type === 'check-auth') {
        (async () => {
            let token = await getValidToken();
            if (!token) {
                token = await trySyncFromOpenTabs();
            }
            sendResponse({ ok: true, loggedIn: !!token });
        })().catch(() => sendResponse({ ok: true, loggedIn: false }));
        return true;
    }

    // Lấy danh sách topics (kèm category / thư mục)
    if (message?.type === 'get-app-topics') {
        (async () => {
            const token = await getValidToken();
            if (!token) return sendResponse({ ok: false, error: 'Chưa đăng nhập. Vui lòng đăng nhập lại.' });

            let topics = [];
            const cacheBuster = `_t=${Date.now()}`;
            try {
                const data = await apiGet(`/topics?${cacheBuster}`, token);
                if (data.ok && Array.isArray(data.topics) && data.topics.length > 0) {
                    topics = data.topics;
                }
            } catch (_) {}

            // Nếu api chưa trả về category (ví dụ: cache cũ) hoặc rỗng, query trực tiếp từ Supabase REST
            const needsCategory = !topics.length || !topics.some(t => t.category);
            if (needsCategory) {
                try {
                    const sbRes = await fetch(`https://swehdtrqjyklmsefkjdf.supabase.co/rest/v1/topics?select=id,name,icon,category,created_at&order=created_at.asc&${cacheBuster}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3ZWhkdHJxanlrbG1zZWZramRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTc4MDcsImV4cCI6MjA5Mzk3MzgwN30.dXRhEmvS8J21aJ3dwZ4jHaWuKbhNw2yys90YTIop2EU'
                        },
                        cache: 'no-store',
                    });
                    if (sbRes.ok) {
                        const sbData = await sbRes.json();
                        if (Array.isArray(sbData) && sbData.length > 0) {
                            topics = sbData.map(t => ({
                                id:       t.id,
                                name:     t.name,
                                icon:     t.icon || 'folder',
                                category: t.category || 'General English',
                            }));
                        }
                    }
                } catch (_) {}
            }

            if (!topics.length) {
                return sendResponse({ ok: false, error: 'Không tải được topic.' });
            }

            sendResponse({ ok: true, data: topics });
        })().catch(err => sendResponse({ ok: false, error: err.message }));
        return true;
    }

    // Lấy cấu trúc Tests & Passages của một topic (yêu cầu đăng nhập & kiểm tra định dạng topicId)
    if (message?.type === 'get-topic-tests') {
        (async () => {
            const topicId = String(message.payload?.topicId || '').trim();
            if (!topicId || !VALID_TOPIC_ID_RE.test(topicId)) {
                return sendResponse({ ok: false, error: 'topicId không hợp lệ.' });
            }

            const token = await getValidToken();
            if (!token) {
                return sendResponse({ ok: false, error: 'Chưa đăng nhập.' });
            }
            const headers = {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${token}`,
            };

            try {
                // 1. Query danh sách tests của topic
                const encodedTopicId = encodeURIComponent(topicId);
                const testsRes = await fetch(`${SUPABASE_URL}/rest/v1/tests?topic_id=eq.${encodedTopicId}&select=id,name,test_order&order=test_order.asc`, { headers });
                if (!testsRes.ok) {
                    return sendResponse({ ok: true, data: { hasTests: false, tests: [] } });
                }
                const testsData = await testsRes.json();
                if (!Array.isArray(testsData) || testsData.length === 0) {
                    return sendResponse({ ok: true, data: { hasTests: false, tests: [] } });
                }

                // 2. Query danh sách passages của topic
                const passagesRes = await fetch(`${SUPABASE_URL}/rest/v1/passages?topic_id=eq.${encodedTopicId}&select=id,test_id,passage_number,title&order=passage_number.asc`, { headers });
                const passagesData = passagesRes.ok ? await passagesRes.json() : [];

                const passagesByTest = {};
                (passagesData || []).forEach(p => {
                    if (!passagesByTest[p.test_id]) passagesByTest[p.test_id] = [];
                    passagesByTest[p.test_id].push({
                        id:            p.id,
                        passageNumber: p.passage_number,
                        title:         p.title || `Passage ${p.passage_number}`,
                    });
                });

                const tests = testsData.map(t => ({
                    id:        t.id,
                    name:      t.name,
                    testOrder: t.test_order,
                    passages:  passagesByTest[t.id] || []
                }));

                sendResponse({ ok: true, data: { hasTests: true, tests } });
            } catch (err) {
                sendResponse({ ok: false, error: err.message });
            }
        })().catch(err => sendResponse({ ok: false, error: err.message }));
        return true;
    }

    // Lưu từ vào topic / passage
    if (message?.type === 'add-to-app') {
        (async () => {
            const token = await getValidToken();
            if (!token) return sendResponse({ ok: false, error: 'Chưa đăng nhập. Vui lòng đăng nhập lại.' });

            const payload = message.payload || {};
            let resData = null;

            // Thử qua API backend trước
            try {
                resData = await apiPost('/add-word', token, payload);
            } catch (_) {}

            // Nếu API backend thành công
            if (resData?.ok) {
                return sendResponse({ ok: true });
            }

            // Fallback: Lưu trực tiếp vào Supabase REST nếu API server lỗi hoặc chưa deploy
            try {
                const insertPayload = {
                    topic_id:         payload.topicId,
                    word:             String(payload.word || '').trim(),
                    phonetic:         String(payload.phonetic || '').trim(),
                    meaning:          String(payload.meaning || '').trim(),
                    example_sentence: String(payload.exampleSentence || '').trim(),
                };
                if (payload.passageId) {
                    insertPayload.passage_id = payload.passageId;
                }

                const sbRes = await fetch('https://swehdtrqjyklmsefkjdf.supabase.co/rest/v1/words', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3ZWhkdHJxanlrbG1zZWZramRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTc4MDcsImV4cCI6MjA5Mzk3MzgwN30.dXRhEmvS8J21aJ3dwZ4jHaWuKbhNw2yys90YTIop2EU',
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal',
                    },
                    body: JSON.stringify(insertPayload),
                });

                if (sbRes.ok) {
                    return sendResponse({ ok: true });
                } else {
                    const errText = await sbRes.text();
                    if (/jwt|expired|invalid/i.test(errText)) await clearSession();
                    return sendResponse({ ok: false, error: `Lỗi Supabase: ${errText}` });
                }
            } catch (err) {
                return sendResponse({ ok: false, error: err.message });
            }
        })().catch(err => sendResponse({ ok: false, error: err.message }));
        return true;
    }
});
