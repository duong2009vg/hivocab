// src/components/admin/AdminSidebar.jsx
// Evondev Studio Sidebar for HiVocab Admin with Collapsible Groups & Responsive Mobile Drawer
import React, { useState } from 'react';
import { useAuth } from '../../providers/AuthProvider.jsx';
import { useRoute } from '../../router/RouteContext.jsx';

export const ADMIN_GROUPS = [
  {
    title: 'TỔNG QUAN',
    items: [
      { id: 'overview', label: 'Tổng quan Studio', icon: 'dashboard' },
    ],
  },
  {
    title: 'TÀI CHÍNH & PRO',
    items: [
      { id: 'orders', label: 'Doanh thu & Đơn hàng', icon: 'receipt_long' },
      { id: 'subscriptions', label: 'Hội viên & Tặng PRO', icon: 'card_giftcard' },
      { id: 'gating', label: 'Khóa Học liệu PRO', icon: 'lock_open' },
    ],
  },
  {
    title: 'HỌC LIỆU & NỘI DUNG',
    items: [
      { id: 'folders', label: 'Thư mục & Khóa học', icon: 'folder_open' },
      { id: 'thpt', label: 'Đề thi THPT Quốc Gia', icon: 'school' },
      { id: 'reading', label: 'Đọc Song ngữ IELTS', icon: 'menu_book' },
      { id: 'words', label: 'Từ điển 66k Từ', icon: 'translate' },
      { id: 'import', label: 'Nhập liệu CSV/JSON', icon: 'upload_file' },
    ],
  },
  {
    title: 'HỆ THỐNG & VẬN HÀNH',
    items: [
      { id: 'users', label: 'Tài khoản & Quyền', icon: 'group' },
      { id: 'reports', label: 'Báo cáo lỗi & Góp ý', icon: 'bug_report' },
      { id: 'system', label: 'Sức khỏe Hệ thống', icon: 'dns' },
    ],
  },
];

export function AdminSidebar({
  activeTab,
  onSelectTab,
  isMobileOpen,
  onCloseMobile,
  badges = {},
}) {
  const { user, profile } = useAuth();
  const { navigateTo } = useRoute();
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const toggleGroup = (groupTitle) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupTitle]: !prev[groupTitle],
    }));
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#FBF8F1]/98 backdrop-blur-md border-r-2 border-[#3D352E] flex flex-col transition-transform duration-300 lg:translate-x-0 select-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b-2 border-[#3D352E]/15 shrink-0 bg-[#FFFDF9]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#F7F0DE] border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center justify-center overflow-hidden shrink-0">
              <img
                src="/logo-hi-transparent.png"
                alt="HiVocab Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/mascot/mascot_cozy.png';
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-quicksand font-black text-base text-[#3D352E] leading-none">HiVocab</span>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#DE5D53] text-white border border-[#3D352E] shadow-2xs">
                  STUDIO 🛠️
                </span>
              </div>
              <p className="text-[11px] font-bold text-[#86756C] mt-0.5">Bảng Quản trị Thủ công 🌿</p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-xl border-2 border-[#3D352E] text-[#3D352E] hover:bg-[#FAF5EB] transition-colors"
            title="Đóng menu"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Navigation Items (Scrollable with subtle spacing) */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-3.5 select-none">
          {ADMIN_GROUPS.map((group) => {
            const isCollapsed = collapsedGroups[group.title];

            return (
              <div key={group.title} className="space-y-1">
                {/* Group Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.title)}
                  className="flex h-8 w-full cursor-pointer items-center justify-between rounded-xl px-2.5 text-[11px] font-black uppercase tracking-wider text-[#86756C] hover:text-[#3D352E] transition-colors"
                >
                  <span>{group.title}</span>
                  <span
                    className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${
                      isCollapsed ? '-rotate-90' : ''
                    }`}
                  >
                    expand_more
                  </span>
                </button>

                {/* Group Items */}
                {!isCollapsed && (
                  <div className="space-y-1 pt-0.5">
                    {group.items.map((item) => {
                      const isActive = activeTab === item.id;
                      const badge = badges[item.id];

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onSelectTab(item.id);
                            onCloseMobile();
                          }}
                          className={`w-full flex h-10 items-center justify-between px-3 rounded-2xl text-[13px] transition-all text-left cursor-pointer ${
                            isActive
                              ? 'bg-[#557A46] text-white font-black border-2 border-[#3D352E] shadow-[2px_2.5px_0px_#3D352E]'
                              : 'text-[#6E5D53] hover:text-[#3D352E] hover:bg-white/80 font-bold border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                            <span
                              className={`material-symbols-outlined text-[18px] shrink-0 ${
                                isActive ? 'text-white' : 'text-[#86756C]'
                              }`}
                            >
                              {item.icon}
                            </span>
                            <span className="truncate">{item.label}</span>
                          </div>

                          {badge !== undefined && badge !== null && (
                            <span
                              className={`ml-2 text-[10px] tabular-nums font-black shrink-0 px-2 py-0.5 rounded-full ${
                                isActive
                                  ? 'bg-white/20 text-white border border-white/40'
                                  : 'bg-[#FEEFEA] text-[#DE5D53] border border-[#DE5D53] shadow-2xs'
                              }`}
                            >
                              {badge}
                            </span>
                          )}

                          {isActive && (
                            <span className="ml-1.5 w-2 h-2 rounded-full bg-[#F4B41A] shrink-0"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer: Return to App & User Profile Row */}
        <div className="p-3 border-t-2 border-[#3D352E]/15 shrink-0 space-y-2 bg-[#FFFDF9]">
          <button
            onClick={() => navigateTo('dashboard')}
            className="w-full flex h-10 items-center justify-center gap-2 px-3 rounded-2xl text-xs font-black text-[#3D352E] bg-white hover:bg-[#FAF5EB] border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] active:translate-y-0.5 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-[#557A46]">arrow_back</span>
            <span>Về App Học viên 📚</span>
          </button>

          <div className="flex h-11 items-center justify-between px-2.5 rounded-2xl bg-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E]">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-[#FFE8C2] border border-[#3D352E] text-[#3D352E] font-black text-xs flex items-center justify-center shrink-0">
                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'A')}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#3D352E] truncate" title={user?.email}>
                  {profile?.full_name || user?.email?.split('@')[0]}
                </p>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#557A46]"></span>
                  <span className="text-[10px] text-[#DE5D53] font-black uppercase tracking-wider">ADMIN ⭐</span>
                </div>
              </div>
            </div>
            <span className="material-symbols-outlined text-[16px] text-[#86756C]">
              verified_user
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;
