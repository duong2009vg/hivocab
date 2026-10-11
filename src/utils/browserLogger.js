// src/utils/browserLogger.js
// Utility to silently capture browser diagnostics & recent errors for bug reports

const MAX_SAVED_ERRORS = 15;

if (typeof window !== 'undefined' && !window.__hivocab_logger_initialized) {
  window.__hivocab_logger_initialized = true;
  window.__hivocab_recent_errors = [];

  // Capture uncaught JavaScript errors
  window.addEventListener('error', (event) => {
    try {
      const errItem = {
        type: 'uncaught_error',
        message: event.message || String(event),
        source: event.filename || 'unknown',
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack ? event.error.stack.slice(0, 500) : null,
        time: new Date().toLocaleTimeString('vi-VN'),
      };
      window.__hivocab_recent_errors.unshift(errItem);
      if (window.__hivocab_recent_errors.length > MAX_SAVED_ERRORS) {
        window.__hivocab_recent_errors.pop();
      }
    } catch (_) {}
  });

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    try {
      const reason = event.reason;
      const errItem = {
        type: 'unhandled_rejection',
        message: reason?.message || String(reason),
        stack: reason?.stack ? reason.stack.slice(0, 500) : null,
        time: new Date().toLocaleTimeString('vi-VN'),
      };
      window.__hivocab_recent_errors.unshift(errItem);
      if (window.__hivocab_recent_errors.length > MAX_SAVED_ERRORS) {
        window.__hivocab_recent_errors.pop();
      }
    } catch (_) {}
  });
}

function detectOS() {
  if (typeof navigator === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  if (/windows/i.test(ua)) return 'Windows';
  if (/macintosh|mac os x/i.test(ua)) return 'macOS';
  if (/android/i.test(ua)) return 'Android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
  if (/linux/i.test(ua)) return 'Linux';
  return 'Khác';
}

function detectBrowser() {
  if (typeof navigator === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  if (/edg\//i.test(ua)) return 'Microsoft Edge';
  if (/chrome|crios/i.test(ua) && !/opr|opera/i.test(ua)) return 'Google Chrome';
  if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) return 'Apple Safari';
  if (/firefox|fxios/i.test(ua)) return 'Mozilla Firefox';
  if (/opr|opera/i.test(ua)) return 'Opera';
  return 'Trình duyệt khác';
}

export function getBrowserDiagnosticLogs() {
  if (typeof window === 'undefined') return {};

  const nav = typeof navigator !== 'undefined' ? navigator : {};
  const scr = typeof window.screen !== 'undefined' ? window.screen : {};

  return {
    url: window.location.href,
    pathname: window.location.pathname,
    hash: window.location.hash || '',
    os: detectOS(),
    browser: detectBrowser(),
    userAgent: nav.userAgent || 'Unknown',
    screenResolution: scr.width && scr.height ? `${scr.width}x${scr.height}` : 'N/A',
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    devicePixelRatio: window.devicePixelRatio || 1,
    isTouchDevice: 'ontouchstart' in window || (nav.maxTouchPoints || 0) > 0,
    language: nav.language || 'vi',
    timeZone: Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone || 'Asia/Ho_Chi_Minh',
    network: {
      online: nav.onLine ?? true,
      effectiveType: nav.connection?.effectiveType || 'N/A',
      downlink: nav.connection?.downlink ? `${nav.connection.downlink} Mbps` : undefined,
    },
    memory: window.performance?.memory ? {
      usedJSHeap: `${Math.round(window.performance.memory.usedJSHeapSize / 1048576)} MB`,
      totalJSHeap: `${Math.round(window.performance.memory.totalJSHeapSize / 1048576)} MB`,
    } : null,
    recentErrors: window.__hivocab_recent_errors || [],
    capturedAt: new Date().toISOString(),
  };
}
