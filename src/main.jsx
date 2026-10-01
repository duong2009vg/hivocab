import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

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
