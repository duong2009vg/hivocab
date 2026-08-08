const APP_TITLE = 'Hi - Master Vocabulary';

async function findAppTab() {
  const tabs = await chrome.tabs.query({});
  return tabs.find(tab => (tab.title || '').includes(APP_TITLE));
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
    const appTab = await findAppTab();
    if (!appTab?.id) throw new Error('Hãy mở một tab "Hi - Master Vocabulary" và đăng nhập trước.');

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
