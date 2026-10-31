// src/components/admin/AdminHeader.jsx
// Studio Header with Breadcrumbs, Live Sync Indicator, PRO Metric, Refresh & Quick Jump
import React from 'react';

export function AdminHeader({
  activeTabTitle,
  onOpenMobile,
  onRefresh,
  isRefreshing,
  activeProCount = 0,
  onSelectTab,
}) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-[#FAF5EB]/95 backdrop-blur-md border-b-2 border-[#DECDBB] px-4 lg:px-8 flex items-center justify-between gap-4 transition-colors">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-xl text-[#3D352E] bg-white hover:bg-[#FAF5EB] border-2 border-[#3D352E] shadow-[1.5px_2px_0px_#3D352E] transition-all cursor-pointer active:translate-y-0.5"
          title="Mở menu điều hướng"
        >
          <span className="material-symbols-outlined text-[20px] block">menu</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-bold text-[#6E5D53] min-w-0">
          <div className="flex items-center gap-1.5 hidden sm:flex">
            <span className="w-2 h-2 rounded-full bg-[#557A46]"></span>
            <span className="hover:text-[#3D352E] transition-colors font-extrabold uppercase tracking-wider text-[11px] text-[#86756C]">
              HiVocab Studio
            </span>
          </div>
          <span className="material-symbols-outlined text-[14px] text-[#86756C] hidden sm:inline">
            chevron_right
          </span>
          <h1 className="font-quicksand font-black text-sm sm:text-base text-[#3D352E] truncate flex items-center gap-1.5">
            <span>{activeTabTitle}</span>
          </h1>
        </div>
      </div>

      {/* Right: Sync Status, Badges & Quick Controls */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Realtime Sync Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EAF3E7] border border-[#8FB383] text-[11px] font-black text-[#557A46] shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#557A46] animate-pulse"></span>
          <span>Supabase Trực tuyến</span>
        </div>

        {/* Active PRO Metric Badge - Bấm để nhảy tới tab Hội viên */}
        <button
          type="button"
          onClick={() => onSelectTab?.('subscriptions')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FEEFEA] hover:bg-[#FDDED4] border border-[#DE5D53] text-[11px] font-black text-[#DE5D53] shadow-2xs transition-all cursor-pointer active:translate-y-0.5"
          title="Bấm để xem danh sách Hội viên PRO"
        >
          <span>👑</span>
          <span className="tabular-nums font-black">{activeProCount} PRO</span>
        </button>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-xl text-[#3D352E] bg-white hover:bg-[#FAF5EB] border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] transition-all active:translate-y-0.5 disabled:opacity-50 cursor-pointer flex items-center justify-center"
          title="Tải lại toàn bộ dữ liệu quản trị"
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
