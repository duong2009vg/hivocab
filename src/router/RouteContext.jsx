// src/router/RouteContext.jsx
// Centralized React Route Manager with SPA History, Deep Links & Legacy Compatibility
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const RouteContext = createContext({
  currentRoute: 'landing',
  navigateTo: () => {},
  isMainTab: false,
  isTopicDetail: false,
  isExerciseDetail: false,
});

export const MAIN_TABS = ['dashboard', 'topics', 'library', 'vocabulary', 'exercises', 'dictionary', 'settings', 'profile'];

function normalizeRoute(raw) {
  if (!raw) return 'landing';
  let clean = raw.split('?')[0].replace(/^#/, '').replace(/^page-/, '').trim();
  if (clean.startsWith('d=') || clean.startsWith('deck=') || clean.startsWith('topic=')) {
    return 'library';
  }
  if (clean === 'thpt') return 'exercises';
  if (clean === 'game') return 'dashboard';
  if (clean === 'settings') return 'profile';
  return clean || 'landing';
}

export const PUBLIC_ROUTES = ['landing', 'features', 'reviews', 'faq', 'support', 'login'];

export function isPublicRoute(route) {
  if (!route) return true;
  return PUBLIC_ROUTES.includes(route) || route.startsWith('d=') || route.startsWith('deck=');
}

export function checkHasValidAuthToken() {
  if (typeof window === 'undefined') return false;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && (parsed.access_token || parsed.refresh_token || parsed.user)) {
            return true;
          }
        }
      }
    }
  } catch (_) {}
  return false;
}

export function checkGuestEntered() {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') return false;
  try {
    return sessionStorage.getItem('hivocab_guest_entered') === '1';
  } catch (_) {
    return false;
  }
}

function getInitialRoute() {
  if (typeof window === 'undefined') return 'landing';
  const path = (window.location.pathname || '').replace(/^\/+/, '').replace(/\/+$/, '');
  const hash = (window.location.hash || '').replace(/^#/, '').replace(/^page-/, '').trim();

  // If redirecting from OAuth callback with access_token or code
  const rawHash = window.location.hash || '';
  const rawSearch = window.location.search || '';
  if (rawHash.includes('access_token=') || rawSearch.includes('code=')) {
    return 'dashboard';
  }

  const isLoggedIn = checkHasValidAuthToken() ||
    ((typeof window !== 'undefined' && typeof window._hasLocalAuthToken === 'function') ? window._hasLocalAuthToken() : false) ||
    ((typeof document !== 'undefined' && document.documentElement.classList.contains('user-logged-in')));

  const guestEntered = checkGuestEntered();

  // If user is a guest (not authenticated) and has NOT clicked "Bắt đầu ngay" in this session:
  // MUST start on a public landing page!
  if (!isLoggedIn && !guestEntered) {
    if (path === 'login' || hash === 'login') return 'login';
    if (hash) {
      const clean = normalizeRoute(hash);
      if (isPublicRoute(clean)) return clean;
    }
    if (path && isPublicRoute(path)) return path;
    return 'landing';
  }

  // If logged in OR guest has already entered the app in this session:
  if (hash) {
    const clean = normalizeRoute(hash);
    if (clean && clean !== 'landing') return clean;
  }

  if (path === 'login') return isLoggedIn ? 'dashboard' : 'login';
  if (path === 'app') return 'dashboard';
  if (path === 'admin') return 'admin';

  return isLoggedIn ? 'dashboard' : 'landing';
}

export function RouteProvider({ children }) {
  const [currentRoute, setCurrentRoute] = useState(getInitialRoute);
  const activeRouteRef = useRef(currentRoute);
  const isNavigatingRef = useRef(false);
  const lifecycleTimerRef = useRef(null);

  const triggerLegacyPageLifecycle = useCallback((pageName) => {
    if (typeof window === 'undefined') return;

    try { document.documentElement.classList.add('router-ready'); } catch (_) {}
    if (typeof window.lockBodyScroll === 'function') {
      window.lockBodyScroll(false);
    }


    // Clean up learning keyboard events
    if (pageName !== 'learning' && typeof window.HiSessionUI !== 'undefined' && typeof window.HiSessionUI.destroy === 'function') {
      window.HiSessionUI.destroy();
    }

    // Trigger page-specific data fetching & active class
    setTimeout(() => {
      const pageEl = document.getElementById('page-' + pageName);
      if (pageEl) {
        pageEl.classList.add('active');
        pageEl.style.removeProperty('display');
        if (pageName === 'thpt-room') {
          pageEl.style.setProperty('display', 'flex', 'important');
        }
      }

      switch (pageName) {
        case 'topics':
        case 'topic-detail':
        case 'lesson-detail':
        case 'vocabulary':
        case 'dictionary':
        case 'bilingual-reading':
          // Owned 100% by pure React components and reactive hooks
          break;
        case 'library':
          // PageLibrary is now pure React with useLibrary hook
          break;
        case 'exercises':
          // PageExercises is now full React — useThptExams hook fetches data internally
          break;
        case 'dashboard':
          if (typeof window.HiDashboard !== 'undefined' && typeof window.HiDashboard.refresh === 'function') {
            window.HiDashboard.refresh();
          }
          break;
        case 'settings':
          // PageSettings is now pure React with internal state
          break;
        case 'login':
          // PageLogin owns the auth mode in React. Calling the legacy DOM
          // switcher here can race with React.lazy() and run before the form
          // elements exist, causing null.className runtime errors.
          break;
      }
    }, 10);
  }, []);

  const navigateTo = useCallback((rawTarget, preserveHash = false) => {
    const target = normalizeRoute(rawTarget);

    if (activeRouteRef.current === target) {
      return;
    }

    // When navigating to an in-app page, mark that guest has entered the app
    if (!isPublicRoute(target)) {
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('hivocab_guest_entered', '1');
        }
      } catch (_) {}
    } else if (target === 'landing') {
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('hivocab_guest_entered');
        }
      } catch (_) {}
    }

    activeRouteRef.current = target;
    setCurrentRoute(target);
    triggerLegacyPageLifecycle(target);

    // Update browser URL / history
    if (!preserveHash && typeof window !== 'undefined') {
      isNavigatingRef.current = true;
      if (target === 'landing') {
        if (window.location.pathname !== '/' || window.location.hash) {
          window.history.pushState({ page: 'landing' }, '', '/');
        }
      } else if (target === 'login') {
        if (window.location.pathname !== '/login') {
          window.history.pushState({ page: 'login' }, '', '/login');
        }
      } else if (target === 'dashboard') {
        if (window.location.pathname !== '/app' && window.location.hash !== '#dashboard') {
          window.history.pushState({ page: 'dashboard' }, '', '/app');
        }
      } else {
        window.location.hash = target;
      }
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 60);
    }

    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, [triggerLegacyPageLifecycle]);

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const newRoute = getInitialRoute();
      if (newRoute !== activeRouteRef.current) {
        activeRouteRef.current = newRoute;
        setCurrentRoute(newRoute);
        triggerLegacyPageLifecycle(newRoute);
      }
    };

    const handleHashChange = () => {
      if (isNavigatingRef.current) {
        return;
      }
      const hash = (window.location.hash || '').replace(/^#/, '').replace(/^page-/, '').trim();
      if (hash) {
        const clean = normalizeRoute(hash);
        if (clean !== activeRouteRef.current) {
          if (!isPublicRoute(clean)) {
            try {
              if (typeof sessionStorage !== 'undefined') {
                sessionStorage.setItem('hivocab_guest_entered', '1');
              }
            } catch (_) {}
          }
          activeRouteRef.current = clean;
          setCurrentRoute(clean);
          triggerLegacyPageLifecycle(clean);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handleHashChange);

    // Expose global window.__reactNavigateTo and window.navigateTo for backward compatibility
    window.__reactNavigateTo = (page, preserveHash) => {
      navigateTo(page, preserveHash);
    };
    window.navigateTo = window.__reactNavigateTo;

    // Initial trigger
    triggerLegacyPageLifecycle(activeRouteRef.current);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [navigateTo, triggerLegacyPageLifecycle]);

  const isMainTab = MAIN_TABS.includes(currentRoute);
  const isTopicDetail = currentRoute === 'topic-detail' || currentRoute === 'lesson-detail';
  const isExerciseDetail = currentRoute === 'thpt-room';

  const value = {
    currentRoute,
    navigateTo,
    isMainTab,
    isTopicDetail,
    isExerciseDetail,
  };

  return <RouteContext.Provider value={value}>{children}</RouteContext.Provider>;
}

export function useRoute() {
  const context = useContext(RouteContext);
  if (!context) {
    throw new Error('useRoute must be used within a RouteProvider');
  }
  return context;
}

export default RouteProvider;
