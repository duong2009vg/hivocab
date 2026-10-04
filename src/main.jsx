import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// LOẠI BỎ HOÀN TOÀN DARK MODE TRÊN TOÀN BỘ ỨNG DỤNG
if (typeof document !== 'undefined') {
  document.documentElement.classList.remove('dark');
  document.documentElement.style.colorScheme = 'light';
  try {
    localStorage.removeItem('theme');
    localStorage.removeItem('dark-mode');
  } catch (_) {}

  // Chặn mọi tác động add lại class 'dark' (kể cả từ extension hay script ngoài)
  const darkObserver = new MutationObserver(() => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
    }
  });
  darkObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
}

// Tự động tải lại trang khi có bản build mới làm lỗi dynamic import chunk (Vite standard)
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    const retryKey = 'hi_vite_preload_reload';
    const lastRetry = sessionStorage.getItem(retryKey);
    const now = Date.now();
    if (!lastRetry || (now - parseInt(lastRetry, 10)) > 20000) {
      sessionStorage.setItem(retryKey, String(now));
      if ('caches' in window) {
        caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).finally(() => {
          window.location.reload();
        });
      } else {
        window.location.reload();
      }
    }
  });
}

const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<App />);
}
