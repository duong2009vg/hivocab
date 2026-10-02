// src/components/common/AdminProtectedRoute.jsx
// Guards administrative routes (#admin) with role verification and graceful 403 fallback
import React from 'react';
import { useAuth } from '../../providers/AuthProvider.jsx';
import { useRoute } from '../../router/RouteContext.jsx';
import RouteLoadingFallback from './RouteLoadingFallback.jsx';

export function AdminProtectedRoute({ children }) {
  const { user, profile, isAdmin, loading } = useAuth();
  const { navigateTo } = useRoute();

  if (loading) {
    return <RouteLoadingFallback />;
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-6 ring-1 ring-amber-500/20">
          <span className="material-symbols-outlined text-[36px]">security</span>
        </div>

        <h1 className="text-2xl font-bold text-on-surface tracking-tight mb-2">
          Khu vực Dành riêng cho Quản trị viên
        </h1>

        <p className="text-sm text-on-surface-variant max-w-md mb-6 leading-relaxed">
          {user ? (
            <>Tài khoản <span className="font-semibold text-on-surface font-mono">{user.email}</span> (vai trò: <span className="font-mono text-amber-600 dark:text-amber-400">{profile?.role || 'user'}</span>) không có quyền truy cập trang quản trị Studio.</>
          ) : (
            <>Bạn cần đăng nhập bằng tài khoản Quản trị viên (Admin) để truy cập không gian này.</>
          )}
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo(user ? 'dashboard' : 'login')}
            className="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-xs"
          >
            {user ? 'Về Bảng điều khiển Học tập' : 'Đăng nhập Quản trị viên'}
          </button>
          {user && (
            <button
              onClick={() => navigateTo('landing')}
              className="px-5 py-2.5 rounded-xl border border-outline-variant/30 text-on-surface font-semibold text-sm hover:bg-surface-container transition-all"
            >
              Về Trang chủ
            </button>
          )}
        </div>
      </div>
    );
  }

  return children;
}

export default AdminProtectedRoute;
