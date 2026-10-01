import { lazy } from 'react';

/**
 * Bọc React.lazy() với cơ chế tự động phục hồi khi chunk bị 404 do deploy mới.
 * Nếu dynamic import thất bại (do chunk hash thay đổi giữa các phiên bản deploy),
 * hàm sẽ xóa cache Service Worker và tự động reload trang để nạp bản build mới nhất.
 */
export function lazyWithRetry(factory) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      const msg = String(err?.message || '');
      const isDynamicImportError = (
        msg.includes('dynamically imported module') ||
        msg.includes('Loading chunk') ||
        msg.includes('ChunkLoadError') ||
        msg.includes('MIME type') ||
        msg.includes('Failed to fetch')
      );

      if (isDynamicImportError) {
        const retryKey = 'hi_lazy_retried';
        const lastRetry = sessionStorage.getItem(retryKey);
        const now = Date.now();
        // Giới hạn chỉ tự động reload 1 lần trong vòng 20 giây để tránh reload loop
        if (!lastRetry || (now - parseInt(lastRetry, 10)) > 20000) {
          sessionStorage.setItem(retryKey, String(now));
          if ('caches' in window) {
            try {
              const keys = await caches.keys();
              await Promise.all(keys.map((k) => caches.delete(k)));
            } catch (_) {}
          }
          if ('serviceWorker' in navigator) {
            try {
              const regs = await navigator.serviceWorker.getRegistrations();
              for (const r of regs) await r.update().catch(() => {});
            } catch (_) {}
          }
          window.location.reload();
          return new Promise(() => {}); // Giữ pending cho đến khi reload
        }
      }
      throw err;
    }
  });
}

export default lazyWithRetry;
