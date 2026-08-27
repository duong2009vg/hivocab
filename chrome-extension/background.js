const APP_URL      = 'https://hivocab.vercel.app';
const API_BASE_URL = 'https://hivocab.vercel.app/api';

// ── Session storage helpers ───────────────────────────────────────────────

function saveSession(session) {
    return chrome.storage.local.set({ hivocab_session: session });
}

function clearSession() {
    return chrome.storage.local.remove('hivocab_session');
}

async function getSession() {
    const data = await chrome.storage.local.get('hivocab_session');
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

// ── Token management (auto-refresh) ──────────────────────────────────────────

async function getValidToken() {
    const session = await getSession();
    if (!session?.access_token) return null;

    const nowSec = Math.floor(Date.now() / 1000);
    const isExpiringSoon = session.expires_at && (session.expires_at - nowSec) < 300;

    if (!isExpiringSoon) return session.access_token;

    if (!session.refresh_token) { await clearSession(); return null; }

    try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: session.refresh_token }),
        });
        const data = await res.json();
        if (data.ok) {
            await saveSession({
                access_token:  data.access_token,
                refresh_token: data.refresh_token,
                expires_at:    data.expires_at,
            });
            return data.access_token;
        }
    } catch (_) {}

    await clearSession();
    return null;
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function apiGet(path, token) {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return res.json();
}

async function apiPost(path, token, body) {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    return res.json();
}

// ── Login popup window ────────────────────────────────────────────────────────

async function openLoginWindow() {
    const existingId = await getLoginWindowId();
    if (existingId !== null) {
        try { await chrome.windows.remove(existingId); } catch (_) {}
        await setLoginWindowId(null);
    }

    const win = await chrome.windows.create({
        url:     APP_URL,
        type:    'popup',
        width:   490,
        height:  700,
        focused: true,
    });
    await setLoginWindowId(win.id);
}

async function closeLoginWindowIfOpen() {
    const id = await getLoginWindowId();
    if (id === null) return;
    try { await chrome.windows.remove(id); } catch (_) {}
    await setLoginWindowId(null);
    // Thông báo popup (best-effort, popup cũng tự poll)
    chrome.runtime.sendMessage({ type: 'login-success' }).catch(() => {});
}

// ── Message handler ───────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    // Content script gửi session đầy đủ
    if (message?.type === 'store-auth-token') {
        const session = message.session;
        if (session?.access_token) {
            saveSession(session).then(async () => {
                sendResponse({ ok: true });
                await closeLoginWindowIfOpen();
            });
        } else {
            clearSession().then(() => sendResponse({ ok: true }));
        }
        return true;
    }

    // Mở login popup
    if (message?.type === 'open-app') {
        openLoginWindow()
            .then(() => sendResponse({ ok: true }))
            .catch(err => sendResponse({ ok: false, error: err.message }));
        return true;
    }

    // Kiểm tra trạng thái đăng nhập
    if (message?.type === 'check-auth') {
        getValidToken()
            .then(token => sendResponse({ ok: true, loggedIn: !!token }))
            .catch(() => sendResponse({ ok: true, loggedIn: false }));
        return true;
    }

    // Lấy danh sách topics
    if (message?.type === 'get-app-topics') {
        (async () => {
            const token = await getValidToken();
            if (!token) return sendResponse({ ok: false, error: 'Chưa đăng nhập. Vui lòng đăng nhập lại.' });
            const data = await apiGet('/topics', token);
            if (!data.ok) {
                if (/invalid|expired/i.test(data.error || '')) await clearSession();
                return sendResponse({ ok: false, error: data.error || 'Không tải được topic.' });
            }
            sendResponse({ ok: true, data: data.topics });
        })().catch(err => sendResponse({ ok: false, error: err.message }));
        return true;
    }

    // Lưu từ vào topic
    if (message?.type === 'add-to-app') {
        (async () => {
            const token = await getValidToken();
            if (!token) return sendResponse({ ok: false, error: 'Chưa đăng nhập. Vui lòng đăng nhập lại.' });
            const data = await apiPost('/add-word', token, message.payload || {});
            if (!data.ok) {
                if (/invalid|expired/i.test(data.error || '')) await clearSession();
                return sendResponse({ ok: false, error: data.error || 'Không lưu được từ.' });
            }
            sendResponse({ ok: true });
        })().catch(err => sendResponse({ ok: false, error: err.message }));
        return true;
    }
});
