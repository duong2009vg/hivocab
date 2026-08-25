const APP_URL      = 'https://hivocab.vercel.app';
const API_BASE_URL = 'https://hivocab.vercel.app/api';

// ── Storage helpers ───────────────────────────────────────────────────────────

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

// ── Token management (auto-refresh) ──────────────────────────────────────────

/**
 * Lấy access_token hợp lệ.
 * Tự động refresh nếu sắp hết hạn (< 5 phút còn lại).
 * Trả về null nếu không có session hoặc không refresh được.
 */
async function getValidToken() {
    const session = await getSession();
    if (!session?.access_token) return null;

    // Kiểm tra hết hạn (expires_at tính bằng giây)
    const nowSec = Math.floor(Date.now() / 1000);
    const isExpiringSoon = session.expires_at && (session.expires_at - nowSec) < 300; // < 5 phút

    if (!isExpiringSoon) return session.access_token;

    // Cố refresh
    if (!session.refresh_token) {
        await clearSession();
        return null;
    }

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

    // Refresh thất bại → xóa session cũ
    await clearSession();
    return null;
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

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

let _loginWindowId = null;

async function openLoginWindow() {
    // Đóng cửa sổ cũ nếu còn mở
    if (_loginWindowId !== null) {
        try { await chrome.windows.remove(_loginWindowId); } catch (_) {}
        _loginWindowId = null;
    }

    const win = await chrome.windows.create({
        url:    APP_URL,
        type:   'popup',
        width:  480,
        height: 680,
        focused: true,
    });
    _loginWindowId = win.id;
}

// Đóng login window khi token đã được lưu
async function closeLoginWindowIfOpen() {
    if (_loginWindowId === null) return;
    try { await chrome.windows.remove(_loginWindowId); } catch (_) {}
    _loginWindowId = null;
    // Thông báo cho popup để refresh
    chrome.runtime.sendMessage({ type: 'login-success' }).catch(() => {});
}

// ── Message handler ───────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    // Content script của web app gửi session đầy đủ lên
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
            if (!token) return sendResponse({ ok: false, error: 'Chưa đăng nhập. Nhấn nút đăng nhập bên dưới.' });
            const data = await apiGet('/topics', token);
            if (!data.ok) {
                if (data.error?.includes('Invalid') || data.error?.includes('expired')) {
                    await clearSession();
                    return sendResponse({ ok: false, error: 'Phiên hết hạn. Vui lòng đăng nhập lại.' });
                }
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
            if (!token) return sendResponse({ ok: false, error: 'Chưa đăng nhập. Nhấn nút đăng nhập bên dưới.' });
            const data = await apiPost('/add-word', token, message.payload || {});
            if (!data.ok) {
                if (data.error?.includes('Invalid') || data.error?.includes('expired')) {
                    await clearSession();
                    return sendResponse({ ok: false, error: 'Phiên hết hạn. Vui lòng đăng nhập lại.' });
                }
                return sendResponse({ ok: false, error: data.error || 'Không lưu được từ.' });
            }
            sendResponse({ ok: true });
        })().catch(err => sendResponse({ ok: false, error: err.message }));
        return true;
    }
});
