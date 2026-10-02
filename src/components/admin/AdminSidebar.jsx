// src/components/admin/AdminSidebar.jsx
// Modern Studio Sidebar for HiVocab Admin with 4 Logical Groups & Responsive Mobile Drawer
import React from 'react';
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
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-surface border-r border-outline-variant/20 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-outline-variant/15 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-black text-sm shadow-xs">
              Hi
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[15px] text-on-surface tracking-tight">HiVocab</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary">
                  STUDIO
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant font-medium">Bảng Quản trị v2.4</p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Navigation Items (Scrollable) */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-5 select-none">
          {ADMIN_GROUPS.map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-wider">
                {group.title}
              </div>

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
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-semibold transition-all ${
                      isActive
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className={`material-symbols-outlined text-[19px] shrink-0 ${
                          isActive ? 'text-white' : 'text-on-surface-variant'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </div>

                    {badge !== undefined && badge !== null && (
                      <span
                        className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer: User profile & Return to App */}
        <div className="p-3 border-t border-outline-variant/15 shrink-0 space-y-2 bg-surface-container-lowest">
          <button
            onClick={() => navigateTo('dashboard')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold text-on-surface hover:bg-surface-container border border-outline-variant/20 transition-all shadow-2xs"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">arrow_back</span>
            <span>Về App Học viên</span>
          </button>

          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-surface-container/50">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
              {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'A')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold text-on-surface truncate" title={user?.email}>
                {profile?.full_name || user?.email?.split('@')[0]}
              </p>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] text-on-surface-variant font-mono uppercase">Admin</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;
