// src/components/common/ProtectedRoute.jsx
// Guards authenticated routes; redirects unauthenticated visitors to /login
import React, { useEffect } from 'react';
import { useAuth } from '../../providers/AuthProvider.jsx';
import { useRoute } from '../../router/RouteContext.jsx';
import RouteLoadingFallback from './RouteLoadingFallback.jsx';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const { navigateTo } = useRoute();

  const hasLocalToken = (typeof window !== 'undefined' && typeof window._hasLocalAuthToken === 'function')
    ? window._hasLocalAuthToken()
    : (typeof document !== 'undefined' && (document.documentElement.classList.contains('user-logged-in') || !!window._isPreAuthenticated));

  useEffect(() => {
    if (!loading && !user && !hasLocalToken) {
      navigateTo('login');
    }
  }, [user, loading, hasLocalToken, navigateTo]);

  if (loading || (hasLocalToken && !user)) {
    return <RouteLoadingFallback />;
  }

  if (!user && !hasLocalToken) {
    return <RouteLoadingFallback />;
  }

  return children;
}

export default ProtectedRoute;
