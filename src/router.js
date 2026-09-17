/**
 * HiVocab Client Router
 * Handles hash-based SPA page switching, scroll state resetting, and route lifecycle hooks.
 */

const VALID_ROUTES = [
  'landing',
  'dashboard',
  'topics',
  'topic-detail',
  'lesson-detail',
  'vocabulary',
  'learning',
  'thpt',
  'thpt-room',
  'bilingual-reading',
  'library',
  'settings'
];

let _currentRoute = 'dashboard';
const _routeHooks = new Set();

export function getCurrentRoute() {
  return _currentRoute;
}

export function onNavigate(callback) {
  _routeHooks.add(callback);
  return () => _routeHooks.delete(callback);
}

export function navigateTo(targetPageId, options = {}) {
  const pageId = (targetPageId || 'dashboard').replace(/^#/, '').replace(/^page-/, '');
  _currentRoute = pageId;

  // Release any locked body scroll from lingering modals
  if (typeof window !== 'undefined' && typeof window.lockBodyScroll === 'function') {
    window.lockBodyScroll(false);
  }

  // Update hash if requested
  if (!options.silent && typeof window !== 'undefined') {
    if (window.location.hash !== `#${pageId}`) {
      window.location.hash = `#${pageId}`;
    }
  }

  // DOM Page switching fallback
  if (typeof document !== 'undefined') {
    const pages = document.querySelectorAll('.page');
    pages.forEach(el => {
      if (el.id === `page-${pageId}`) {
        el.classList.add('active');
        el.style.display = (el.id === 'page-thpt-room') ? 'flex' : '';
      } else {
        el.classList.remove('active');
        el.style.display = '';
      }
    });

    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // Trigger hooks
  _routeHooks.forEach(cb => {
    try {
      cb(pageId, options);
    } catch (e) {
      console.error('[Router] Hook error:', e);
    }
  });
}

export function initRouter() {
  if (typeof window === 'undefined') return;

  const handleHashChange = () => {
    const hash = window.location.hash.replace(/^#/, '');
    if (hash && VALID_ROUTES.includes(hash)) {
      navigateTo(hash, { silent: true });
    }
  };

  window.addEventListener('hashchange', handleHashChange);
  
  // Initial route
  const initialHash = window.location.hash.replace(/^#/, '');
  if (initialHash && VALID_ROUTES.includes(initialHash)) {
    navigateTo(initialHash, { silent: true });
  }
}

// Global bridge
if (typeof window !== 'undefined') {
  window.HiRouter = {
    navigateTo,
    getCurrentRoute,
    onNavigate,
    initRouter,
  };
}

export default {
  navigateTo,
  getCurrentRoute,
  onNavigate,
  initRouter,
};
