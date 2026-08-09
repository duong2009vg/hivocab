const APP_TITLE = 'Hi - Master Vocabulary';
const APP_URL = 'https://hivocab.vercel.app';
const APP_READY_TIMEOUT_MS = 15000;

async function findAppTab() {
  const tabs = await chrome.tabs.query({});
  return tabs.find(tab => (tab.title || '').includes(APP_TITLE) || (tab.url || '').startsWith(APP_URL));
}

function waitForTabComplete(tabId) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error('App mở quá lâu, hãy thử lại sau vài giây.'));
    }, APP_READY_TIMEOUT_MS);

    const listener = (updatedTabId, changeInfo) => {
      if (updatedTabId !== tabId || changeInfo.status !== 'complete') return;
      clearTimeout(timeout);
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    };

    chrome.tabs.onUpdated.addListener(listener);
  });
}

async function getOrOpenAppTab() {
  const existingTab = await findAppTab();
  if (existingTab?.id) {
    if (existingTab.status === 'loading') await waitForTabComplete(existingTab.id);
    return existingTab;
  }

  const createdTab = await chrome.tabs.create({ url: APP_URL, active: false });
  if (!createdTab?.id) throw new Error('Không mở được app Hi Vocabulary.');
  if (createdTab.status !== 'complete') await waitForTabComplete(createdTab.id);
  return createdTab;
}

async function sendToAppTab(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (error) {
    const receiverMissing = String(error?.message || '').includes('Receiving end does not exist');
    if (!receiverMissing) throw error;

    // App tab may have been opened before the extension was installed/reloaded.
    await chrome.scripting.insertCSS({ target: { tabId }, files: ['content.css'] });
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
    return await chrome.tabs.sendMessage(tabId, message);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!['get-app-topics', 'add-to-app'].includes(message?.type)) return;

  (async () => {
    const appTab = await getOrOpenAppTab();
    if (!appTab?.id) throw new Error('Không tìm thấy tab "Hi - Master Vocabulary".');

    const response = await sendToAppTab(appTab.id, {
      type: 'HI_EXTENSION_PAGE_REQUEST',
      requestId: message.requestId,
      action: message.type === 'get-app-topics' ? 'get-topics' : 'add-word',
      payload: message.payload || {}
    });
    if (!response?.ok) throw new Error(response?.error || 'App không phản hồi.');
    sendResponse({ ok: true, data: response.data });
  })().catch(error => sendResponse({ ok: false, error: error.message }));

  return true;
});
