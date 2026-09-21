/**
 * HiVocab Client Router
 * Handles hash-based SPA page switching, scroll state resetting, and route lifecycle hooks.
 */

const VALID_ROUTES = [
  'landing',
  'features',
  'reviews',
  'faq',
  'support',
  'login',
  'dashboard',
  'topics',
  'topic-detail',
  'lesson-detail',
  'vocabulary',
  'learning',
  'exercises',
  'thpt',
  'thpt-room',
  'bilingual-reading',
  'library',
  'dictionary',
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
  let pageId = (targetPageId || 'dashboard').replace(/^#/, '').replace(/^page-/, '');
  if (pageId === 'thpt') {
    pageId = 'exercises';
  }
  _currentRoute = pageId;

  // Delegate to window.navigateTo if available (so all subpage loaders & UI triggers run)
  if (typeof window !== 'undefined' && typeof window.navigateTo === 'function' && window.navigateTo !== navigateTo) {
    window.navigateTo(pageId, !!options.silent);
    _routeHooks.forEach(cb => {
      try {
        cb(pageId, options);
      } catch (e) {
        console.error('[Router] Hook error:', e);
      }
    });
    return;
  }

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
        el.style.removeProperty('display');
        if (el.id === 'page-thpt-room') {
          el.style.setProperty('display', 'flex', 'important');
        }
      } else {
        el.classList.remove('active');
        el.style.setProperty('display', 'none', 'important');
      }
    });

    // Control shared layout components
    const mainTabs = ['dashboard', 'topics', 'library', 'vocabulary', 'exercises', 'dictionary', 'settings'];
    const isMainTab = mainTabs.includes(pageId);
    const isTopicDetail = (pageId === 'topic-detail' || pageId === 'lesson-detail');

    const sidebar = document.getElementById('main-sidebar');
    if (sidebar) sidebar.style.display = isMainTab ? '' : 'none';

    const bottomNav = document.getElementById('mobile-bottom-nav');
    if (bottomNav) {
      const shouldShowBottomNav = (isMainTab || isTopicDetail) && pageId !== 'landing';
      if (shouldShowBottomNav) {
        bottomNav.classList.remove('hidden');
        bottomNav.style.display = '';
      } else {
        bottomNav.classList.add('hidden');
        bottomNav.style.display = 'none';
      }
    }

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

  const normalizeRoute = (raw) => {
    const r = (raw || '').replace(/^#/, '').replace(/^page-/, '');
    const clean = r.split('?')[0];
    return clean === 'thpt' ? 'exercises' : clean;
  };

  const handleHashChange = () => {
    const hash = normalizeRoute(window.location.hash);
    if (hash && VALID_ROUTES.includes(hash)) {
      const activeEl = document.querySelector('.page.active');
      if (activeEl && activeEl.id === `page-${hash}`) {
        return; // Already on this page, do not reload
      }
      navigateTo(hash, { silent: true });
    }
  };

  window.addEventListener('hashchange', handleHashChange);
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
