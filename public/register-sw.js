if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js?v=20261128-v1', { updateViaCache: 'none' }).then((registration) => {
      registration.update().catch(() => {});
    }).catch(() => {});
  });
}
