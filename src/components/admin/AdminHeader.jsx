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
  return (
    <header className="sticky top-0 z-30 h-16 bg-[#FAF5EB]/90 backdrop-blur-md border-b-2 border-[#3D352E]/15 px-4 lg:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-1.5 rounded-xl text-[#3D352E] bg-white hover:bg-[#FAF5EB] border-2 border-[#3D352E] shadow-2xs transition-colors cursor-pointer"
          title="Mở menu điều hướng"
        >
          <span className="material-symbols-outlined text-[20px]">menu</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-bold text-[#6E5D53] min-w-0">
          <span className="hover:text-[#3D352E] transition-colors hidden sm:inline">HiVocab Studio 🛠️</span>
          <span className="material-symbols-outlined text-[14px] text-[#86756C] hidden sm:inline">
            chevron_right
          </span>
          <h1 className="font-quicksand font-black text-sm sm:text-base text-[#3D352E] truncate">
            {activeTabTitle}
          </h1>
        </div>
      </div>

      {/* Right: Sync Status, Badges & Quick Controls */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Realtime Sync Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF3E7] border-2 border-[#8FB383] text-xs font-black text-[#557A46] shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#557A46] animate-pulse"></span>
          <span>Đồng bộ Supabase</span>
        </div>

        {/* Active PRO Metric Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEEFEA] border-2 border-[#DE5D53] text-xs font-black text-[#DE5D53] shadow-2xs">
          <span>👑</span>
          <span>{activeProCount} Hội viên PRO</span>
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-xl text-[#3D352E] bg-white hover:bg-[#FAF5EB] border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] transition-all active:translate-y-0.5 disabled:opacity-50 cursor-pointer"
          title="Tải lại dữ liệu hệ thống"
        >
          <span className={`material-symbols-outlined text-[19px] ${isRefreshing ? 'animate-spin text-[#DE5D53]' : ''}`}>
            refresh
          </span>
        </button>
      </div>
    </header>
  );
}

export default AdminHeader;
