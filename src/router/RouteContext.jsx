// src/router/RouteContext.jsx
// Centralized React Route Manager with SPA History, Deep Links & Legacy Compatibility
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const RouteContext = createContext({
  currentRoute: 'landing',
  navigateTo: () => {},
  isMainTab: false,
  isTopicDetail: false,
  isExerciseDetail: false,
});

export const MAIN_TABS = ['dashboard', 'topics', 'library', 'vocabulary', 'exercises', 'dictionary', 'settings'];

function normalizeRoute(raw) {
  if (!raw) return 'landing';
  let clean = raw.split('?')[0].replace(/^#/, '').replace(/^page-/, '').trim();
  if (clean.startsWith('d=') || clean.startsWith('deck=') || clean.startsWith('topic=')) {
    return 'library';
  }
  if (clean === 'thpt') return 'exercises';
  if (clean === 'game') return 'dashboard';
  return clean || 'landing';
}

function getInitialRoute() {
  if (typeof window === 'undefined') return 'landing';
  const path = (window.location.pathname || '').replace(/^\/+/, '').replace(/\/+$/, '');
  const hash = (window.location.hash || '').replace(/^#/, '').replace(/^page-/, '');

  if (path === 'login' || hash === 'login') return 'login';
  if (path === 'app' || hash === 'app' || hash === 'dashboard') return 'dashboard';
  if (hash) return normalizeRoute(hash);

  const isLoggedIn = window._hasLocalAuthToken ? window._hasLocalAuthToken() : false;
  return isLoggedIn ? 'dashboard' : 'landing';
}

export function RouteProvider({ children }) {
  const [currentRoute, setCurrentRoute] = useState(getInitialRoute);

  const triggerLegacyPageLifecycle = useCallback((pageName) => {
    if (typeof window === 'undefined') return;

    try { document.documentElement.classList.add('router-ready'); } catch (_) {}
    if (typeof window.lockBodyScroll === 'function') {
      window.lockBodyScroll(false);
    }

    // Close thread modal if open
    if (typeof window.closeThreadDetail === 'function') {
      const modal = document.getElementById('modal-thread-detail');
      if (modal && !modal.classList.contains('hidden')) {
        window.closeThreadDetail(false);
      }
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
          window._renderCategoryTabs?.();
          window._renderTopicsGrid?.();
          break;
        case 'library':
          window.loadCommunityLibrary?.();
          break;
        case 'vocabulary':
          window._loadVocabularyPage?.();
          break;
        case 'exercises':
          window.ThptExam?.init?.();
          break;
        case 'dictionary':
          window.dictRenderRecent?.();
          break;
        case 'topic-detail':
          window._loadLessons?.();
          break;
        case 'lesson-detail':
          window._loadLessonWords?.();
          break;
        case 'dashboard':
          if (typeof window.HiDashboard !== 'undefined' && typeof window.HiDashboard.refresh === 'function') {
            window.HiDashboard.refresh();
          }
          break;
        case 'settings':
          window._loadSettingsPage?.();
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

    setCurrentRoute(prev => {
      if (prev === target) return prev;
      return target;
    });

    triggerLegacyPageLifecycle(target);

    // Update browser URL / history
    if (!preserveHash && typeof window !== 'undefined') {
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
    }

    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, [triggerLegacyPageLifecycle]);

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const newRoute = getInitialRoute();
      setCurrentRoute(newRoute);
      triggerLegacyPageLifecycle(newRoute);
    };

    const handleHashChange = () => {
      const hash = (window.location.hash || '').replace(/^#/, '').replace(/^page-/, '');
      if (hash) {
        const clean = normalizeRoute(hash);
        setCurrentRoute(clean);
        triggerLegacyPageLifecycle(clean);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handleHashChange);

    // Expose global window.navigateTo for backward compatibility
    window.navigateTo = (page, preserveHash) => {
      navigateTo(page, preserveHash);
    };

    // Initial trigger
    triggerLegacyPageLifecycle(currentRoute);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [navigateTo, triggerLegacyPageLifecycle, currentRoute]);

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
