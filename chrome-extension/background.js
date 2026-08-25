const APP_URL      = 'https://hivocab.vercel.app';
const API_BASE_URL = 'https://hivocab.vercel.app/api';

// ── Lưu / lấy auth token ─────────────────────────────────────────────────────

function storeToken(token) {
    return chrome.storage.local.set({ hivocab_auth_token: token });
}

function clearToken() {
    return chrome.storage.local.remove('hivocab_auth_token');
}

async function getToken() {
    const data = await chrome.storage.local.get('hivocab_auth_token');
    return data.hivocab_auth_token || null;
}

// ── Gọi API Vercel trực tiếp ─────────────────────────────────────────────────

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

// ── Message handler ───────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    // Content script của web app gửi token lên để lưu
    if (message?.type === 'store-auth-token') {
        const token = message.token;
        if (token) {
            storeToken(token).then(() => sendResponse({ ok: true }));
        } else {
            clearToken().then(() => sendResponse({ ok: true }));
        }
        return true;
    }

    // Mở web app (dùng khi chưa có token)
    if (message?.type === 'open-app') {
        chrome.tabs.create({ url: APP_URL, active: true })
            .then(tab => sendResponse({ ok: true, data: { tabId: tab.id } }))
            .catch(err => sendResponse({ ok: false, error: err.message }));
        return true;
    }

    // Lấy danh sách topics
    if (message?.type === 'get-app-topics') {
        (async () => {
            const token = await getToken();
            if (!token) {
                return sendResponse({ ok: false, error: 'Chưa đăng nhập. Hãy mở app và đăng nhập.' });
            }
            const data = await apiGet('/topics', token);
            if (!data.ok) {
                // Token hết hạn hoặc lỗi
                if (data.error?.includes('Invalid') || data.error?.includes('expired')) {
                    await clearToken();
                    return sendResponse({ ok: false, error: 'Phiên đăng nhập hết hạn. Hãy mở app để đăng nhập lại.' });
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
            const token = await getToken();
            if (!token) {
                return sendResponse({ ok: false, error: 'Chưa đăng nhập. Hãy mở app và đăng nhập.' });
            }
            const data = await apiPost('/add-word', token, message.payload || {});
            if (!data.ok) {
                if (data.error?.includes('Invalid') || data.error?.includes('expired')) {
                    await clearToken();
                    return sendResponse({ ok: false, error: 'Phiên đăng nhập hết hạn. Hãy mở app để đăng nhập lại.' });
                }
                return sendResponse({ ok: false, error: data.error || 'Không lưu được từ.' });
            }
            sendResponse({ ok: true });
        })().catch(err => sendResponse({ ok: false, error: err.message }));
        return true;
    }
});
