// src/components/common/ProtectedRoute.jsx
// Guards authenticated routes; redirects unauthenticated visitors to /login
import React, { useEffect } from 'react';
import { useAuth } from '../../providers/AuthProvider.jsx';
import { useRoute } from '../../router/RouteContext.jsx';
import RouteLoadingFallback from './RouteLoadingFallback.jsx';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const { navigateTo } = useRoute();

  useEffect(() => {
    if (!loading && !user) {
      navigateTo('login');
    }
  }, [user, loading, navigateTo]);

  if (loading) {
    return <RouteLoadingFallback />;
  }

  if (!user) {
    return <RouteLoadingFallback />;
  }

  return children;
}

export default ProtectedRoute;
