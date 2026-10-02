// src/components/admin/AdminHeader.jsx
// Studio Header with Breadcrumbs, Live Sync Indicator, PRO Metric, Refresh & Theme Toggle
import React from 'react';

export function AdminHeader({
  activeTabTitle,
  onOpenMobile,
  onRefresh,
  isRefreshing,
  activeProCount = 0,
}) {
  const toggleDarkMode = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-surface/85 backdrop-blur-md border-b border-outline-variant/15 px-4 lg:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors"
          title="Mở menu điều hướng"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant min-w-0">
          <span className="hover:text-on-surface transition-colors hidden sm:inline">Admin Studio</span>
          <span className="material-symbols-outlined text-[14px] text-outline-variant hidden sm:inline">
            chevron_right
          </span>
          <h1 className="text-sm font-bold text-on-surface truncate">
            {activeTabTitle}
          </h1>
        </div>
      </div>

      {/* Right: Sync Status, Badges & Quick Controls */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Realtime Sync Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container/60 border border-outline-variant/15 text-xs font-medium text-on-surface-variant">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Đồng bộ Supabase</span>
        </div>

        {/* Active PRO Metric Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-xs font-bold">
          <span className="material-symbols-outlined text-[15px]">verified</span>
          <span>{activeProCount} Hội viên PRO</span>
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container border border-outline-variant/20 transition-all active:scale-95 disabled:opacity-50"
          title="Tải lại dữ liệu hệ thống"
        >
          <span className={`material-symbols-outlined text-[19px] ${isRefreshing ? 'animate-spin text-primary' : ''}`}>
            refresh
          </span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container border border-outline-variant/20 transition-all active:scale-95"
          title="Đổi giao diện Sáng / Tối"
        >
          <span className="material-symbols-outlined text-[19px]">dark_mode</span>
        </button>
      </div>
    </header>
  );
}

export default AdminHeader;
