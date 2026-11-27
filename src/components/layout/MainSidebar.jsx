// src/components/layout/MainSidebar.jsx
import React, { useState, useEffect } from 'react';
import {
  User,
  LogIn,
  LogOut,
  Crown,
  Flame,
  Folder,
  BookOpenText,
  Mic,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  MessageSquare,
  Swords,
  Home,
  BookMarked,
  Map,
  Globe,
  Search,
} from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider.jsx';
import { useRoute } from '../../router/RouteContext.jsx';
import { useModal } from '../../context/ModalContext.jsx';
import { useProfileStats } from '../../hooks/useProfileStats.js';
import { getMasteryBadge } from '../../utils/masteryBadge.js';

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'hivocab_sidebar_collapsed';

export function MainSidebar() {
  const { user, signOut, isPaidPro: isPro } = useAuth();
  const { currentRoute, navigateTo } = useRoute();
  const { openModal } = useModal();
  const { streak, wordCount, masteredCount, loading: statsLoading } = useProfileStats();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const root = document.getElementById('app-root');
    if (root) {
      root.classList.toggle('sidebar-collapsed', collapsed);
    }
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, collapsed ? '1' : '0');
    } catch (_) {
      // Ignore storage access errors in private browsing modes
    }
    return () => {
      if (root) root.classList.remove('sidebar-collapsed');
    };
  }, [collapsed]);

  const openFeedbackModal = () => {
    if (openModal) {
      openModal('bugReport', {
        initialType: 'feedback',
        feature: 'Sidebar Menu',
        title: 'Góp ý phát triển HiVocab',
      });
    } else if (window.openBugReportModal) {
      window.openBugReportModal({ initialType: 'feedback', feature: 'Sidebar Menu' });
    }
  };

  const activeTab =
    currentRoute === 'topic-detail' || currentRoute === 'lesson-detail'
      ? 'topics'
      : currentRoute === 'exercises' || currentRoute === 'thpt-room'
      ? 'exercises'
      : currentRoute === 'settings'
      ? 'profile'
      : currentRoute;

  const userName = user
    ? user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      (user?.email ? user.email.split('@')[0] : 'Bạn học')
    : 'Khách trải nghiệm';

  const masteryBadge = getMasteryBadge(masteredCount);
  const userRank = user
    ? statsLoading
      ? 'Đang cập nhật huy hiệu…'
      : `Huy hiệu: ${masteryBadge.name}`
    : 'Chưa đăng nhập';
  const displayStreak = user ? (statsLoading ? '…' : streak) : 0;
  const displayWordCount = user ? (statsLoading ? '…' : wordCount) : null;

  const handleLogout = async (e) => {
    e.stopPropagation();
    if (window.confirm('Bạn có muốn đăng xuất khỏi HiVocab không?')) {
      await signOut();
      navigateTo('landing');
    }
  };

  const navGroups = [
    {
      id: 'daily',
      label: 'Không gian học',
      items: [
        {
          id: 'dashboard',
          label: 'Trang chủ',
          icon: <Home className="w-[18px] h-[18px] shrink-0" />,
        },
        {
          id: 'topics',
          label: 'Chủ đề',
          icon: <Folder className="w-[18px] h-[18px] shrink-0" />,
          onMouseEnter: () => {
            import('../../services/db.js')
              .then(({ getTopics }) => getTopics().catch(() => {}))
              .catch(() => {});
          },
        },
        {
          id: 'vocabulary',
          label: 'Sổ từ cá nhân',
          icon: <BookMarked className="w-[18px] h-[18px] shrink-0" />,
          badge: displayWordCount,
          badgeTabular: true,
        },
      ],
    },
    {
      id: 'practice',
      label: 'Phòng luyện tập',
      items: [
        {
          id: 'exercises',
          label: 'Lộ trình THPT',
          icon: <Map className="w-[18px] h-[18px] shrink-0" />,
          badge: '3 quyển',
        },
        {
          id: 'bilingual-reading',
          label: 'Đọc song ngữ',
          badge: 'IELTS',
          icon: <BookOpenText className="w-[18px] h-[18px] shrink-0" />,
          onClick: () => {
            if (typeof window !== 'undefined') {
              window._bilingualEntryOrigin = 'hub';
              window._currentPassageId = null;
              window.dispatchEvent(new CustomEvent('hi:bilingual-open-hub'));
            }
            navigateTo('bilingual-reading');
          },
          onMouseEnter: () => {
            import('../pages/PageBilingualReading.jsx').catch(() => {});
          },
        },
        {
          id: 'studio',
          label: 'Shadowing & AI',
          badge: 'Mới',
          icon: <Mic className="w-[18px] h-[18px] shrink-0" />,
        },
        {
          id: 'arena',
          label: 'Đấu trường 1v1',
          icon: <Swords className="w-[18px] h-[18px] shrink-0" />,
        },
      ],
    },
    {
      id: 'tools',
      label: 'Tra cứu & Cộng đồng',
      items: [
        {
          id: 'library',
          label: 'Thư viện cộng đồng',
          icon: <Globe className="w-[18px] h-[18px] shrink-0" />,
        },
        {
          id: 'dictionary',
          label: 'Tra cứu từ điển',
          icon: <Search className="w-[18px] h-[18px] shrink-0" />,
        },
      ],
    },
  ];

  return (
    <aside
      className="hidden lg:flex lg:w-[var(--sidebar-w,244px)] shrink-0 p-4 flex-col justify-between border-r border-[#E3D7C5] fixed left-0 top-0 h-screen h-[100dvh] z-30 bg-[#F5EFE3]/95 backdrop-blur-sm select-none overflow-hidden"
      data-purpose="desktop-sidebar"
    >
      {/* Top Section: Brand & Grouped Nav */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand Logo + Collapse Toggle */}
        <div
          className="px-1 mb-3 shrink-0 select-none flex items-center justify-between gap-2"
          data-purpose="sidebar-brand"
        >
          <button
            type="button"
            onClick={() => navigateTo('dashboard')}
            className="cursor-pointer group flex items-center gap-2.5 shrink-0 focus-visible:outline-none"
            title="Trang chủ HiVocab"
            aria-label="Trang chủ HiVocab"
          >
            <div
              className="w-12 h-12 rounded-2xl border-2 border-[#382E2B] shadow-[2px_2.5px_0px_#382E2B] overflow-hidden bg-[#FAF5EB] group-hover:scale-[1.03] active:scale-95 transition-transform flex items-center justify-center shrink-0"
              data-purpose="sidebar-logo-box"
            >
              <img
                src="/logo-hi-cream.png"
                alt="Logo HiVocab"
                className="w-full h-full object-cover"
              />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            className={`${
              collapsed ? 'w-10 h-7 rounded-lg' : 'w-8 h-8 rounded-xl'
            } bg-[#FFFDF9] hover:bg-[#F4E3B4] text-[#382E2B] border-2 border-[#382E2B] shadow-[1.5px_1.5px_0px_#382E2B] active:translate-y-0.5 transition-all flex items-center justify-center cursor-pointer shrink-0`}
            title={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn chỉ hiện icon'}
            aria-label={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn chỉ hiện icon'}
            aria-expanded={!collapsed}
            data-purpose="sidebar-collapse-toggle"
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4 shrink-0" />
            ) : (
              <PanelLeftClose className="w-4 h-4 shrink-0" />
            )}
          </button>
        </div>

        {/* Grouped Navigation Menu (vertically centered safely between logo & footer) */}
        <nav
          aria-label="Điều hướng chính"
          className="flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col pr-0.5"
        >
          <div className="my-auto flex flex-col gap-1 py-1">
            {navGroups.map((group, groupIdx) => (
            <div
              key={group.id}
              data-nav-group="true"
              data-nav-group-first={groupIdx === 0 ? 'true' : 'false'}
              className={
                groupIdx > 0
                  ? collapsed
                    ? 'pt-1.5 mt-1 border-t border-[#E3D7C5]/90 flex flex-col items-center gap-0.5'
                    : 'pt-2 mt-1 border-t border-[#E3D7C5]/80 flex flex-col gap-0.5'
                  : 'flex flex-col gap-0.5'
              }
            >
              {!collapsed && (
                <div
                  data-nav-group-label="true"
                  className="px-3 pb-0.5 text-[10px] font-extrabold uppercase tracking-[0.06em] text-[#7D7066]"
                >
                  {group.label}
                </div>
              )}
              {group.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-nav-item="true"
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => (item.onClick ? item.onClick() : navigateTo(item.id))}
                    onMouseEnter={item.onMouseEnter}
                    title={item.label}
                    aria-label={item.label}
                    className={`w-full flex items-center ${
                      collapsed ? 'justify-center px-0' : 'justify-between gap-2 px-3 py-2'
                    } rounded-2xl cursor-pointer transition-all duration-150 shrink-0 text-left ${
                      isActive
                        ? 'font-extrabold text-white bg-[#4D6B53] border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B]'
                        : 'font-bold text-[#5C524B] hover:bg-[#FFFDF9] hover:text-[#382E2B] border-2 border-transparent hover:border-[#E3D7C5]'
                    }`}
                  >
                    <div
                      className={`flex items-center ${
                        collapsed ? 'justify-center' : 'gap-2.5 min-w-0'
                      }`}
                    >
                      {item.icon}
                      {!collapsed && (
                        <span className="truncate whitespace-nowrap text-[13.5px]">
                          {item.label}
                        </span>
                      )}
                    </div>

                    {!collapsed && isActive && (
                      <span
                        aria-hidden="true"
                        className="w-2 h-2 rounded-full bg-[#F4D06F] ring-2 ring-white/80 shrink-0"
                      />
                    )}
                    {!collapsed && !isActive && item.badge != null && (
                      <span
                        className={`px-2 py-0.5 text-[10.5px] font-extrabold rounded-full border shrink-0 ${
                          item.badgeTabular
                            ? 'tabular-nums bg-[#FAF5EB] text-[#382E2B] border-[#D5C7B2]'
                            : 'bg-[#F5E6C4] text-[#382E2B] border-[#382E2B]/40'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
          </div>
        </nav>
      </div>

      {/* Bottom Section: User Profile Card & Actions */}
      <div
        className="shrink-0 flex flex-col gap-2 pt-3 mt-2 border-t border-[#E3D7C5] bg-[#F5EFE3]/95"
        data-purpose="sidebar-footer"
      >
        {!user ? (
          collapsed ? (
            <button
              type="button"
              onClick={() => navigateTo('login')}
              title="Đăng nhập / Đăng ký"
              aria-label="Đăng nhập / Đăng ký"
              className="w-11 h-11 rounded-2xl bg-[#D95D39] hover:bg-[#BF4D2C] text-white border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] active:translate-y-0.5 transition-all flex items-center justify-center cursor-pointer"
              data-purpose="sidebar-profile-card"
            >
              <LogIn className="w-4 h-4 shrink-0" />
            </button>
          ) : (
            <div
              className="bg-[#FFFDF9] rounded-2xl p-2.5 border-2 border-[#382E2B] shadow-[2px_3px_0px_#382E2B] space-y-2"
              data-purpose="sidebar-profile-card"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#FFE8C2] border-2 border-[#382E2B] flex items-center justify-center text-sm font-bold shrink-0">
                  <User className="w-4 h-4 text-[#6E6259]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-extrabold text-[#382E2B] truncate">
                    Khách trải nghiệm
                  </div>
                  <div className="text-[10.5px] font-medium text-[#6E6259] truncate">
                    Chưa đăng nhập
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigateTo('login')}
                className="w-full py-1.5 px-3 rounded-xl bg-[#D95D39] hover:bg-[#BF4D2C] text-white font-extrabold text-xs border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <span>Đăng nhập / Đăng ký</span>
                <LogIn className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          )
        ) : collapsed ? (
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => navigateTo('profile')}
              className={`relative w-9 h-9 rounded-full border-2 border-[#382E2B] shadow-[1.5px_1.5px_0px_#382E2B] flex items-center justify-center overflow-visible cursor-pointer transition-all ${
                activeTab === 'profile' ? 'ring-2 ring-[#4D6B53]' : ''
              }`}
              title={`${userName} • ${userRank} • ${displayStreak} ngày streak`}
              aria-label={`Hồ sơ ${userName}`}
            >
              <div className="w-full h-full rounded-full bg-[#FFE8C2] flex items-center justify-center overflow-hidden">
                {user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-[#382E2B]" />
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
            </button>

            <button
              type="button"
              onClick={() => navigateTo('profile')}
              title="Cài đặt"
              aria-label="Cài đặt"
              className="w-8 h-8 rounded-xl text-[#6E6259] hover:bg-[#FFFDF9] hover:text-[#382E2B] flex items-center justify-center cursor-pointer transition-colors"
            >
              <Settings className="w-4 h-4 shrink-0" />
            </button>

            <button
              type="button"
              onClick={openFeedbackModal}
              title="Góp ý"
              aria-label="Góp ý"
              className="w-8 h-8 rounded-xl text-[#6E6259] hover:bg-[#FFFDF9] hover:text-[#382E2B] flex items-center justify-center cursor-pointer transition-colors"
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
            </button>

            <button
              type="button"
              onClick={handleLogout}
              title="Đăng xuất"
              aria-label="Đăng xuất"
              className="w-8 h-8 rounded-xl text-[#6E6259] hover:bg-[#FBECE7] hover:text-[#C85A3F] flex items-center justify-center cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => navigateTo('profile')}
              className={`w-full text-left p-2.5 rounded-2xl border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] flex items-center justify-between gap-2 cursor-pointer transition-all ${
                activeTab === 'profile'
                  ? 'bg-[#E8F1E8] border-[#4D6B53]'
                  : 'bg-[#FFFDF9] hover:bg-[#FAF5EB]'
              }`}
              title="Xem thông tin và quản lý hồ sơ học viên"
              data-purpose="sidebar-profile-card"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full bg-[#FFE8C2] border-2 border-[#382E2B] flex items-center justify-center text-sm font-bold overflow-hidden">
                    {user?.user_metadata?.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-[#382E2B]" />
                    )}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="text-xs font-extrabold text-[#382E2B] truncate">{userName}</div>
                    {isPro && (
                      <span
                        className="profile-pro-badge inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-black bg-[#FFE8C2] text-[#8C5311] border border-[#382E2B] rounded-md shadow-[1px_1px_0px_#382E2B] shrink-0"
                        title="Thành viên HiVocab PRO"
                      >
                        <Crown className="w-2.5 h-2.5 text-[#8C5311] shrink-0" />
                        <span>PRO</span>
                      </span>
                    )}
                  </div>
                  <div className="text-[10.5px] font-medium text-[#6E6259] truncate">{userRank}</div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs font-extrabold tabular-nums text-[#C85A3F] bg-[#FBECE7] px-2 py-0.5 rounded-full border border-[#C85A3F]/40 shrink-0 whitespace-nowrap">
                <Flame className="w-3.5 h-3.5 text-[#C85A3F] shrink-0" />
                <span>{displayStreak}</span>
              </div>
            </button>

            <div className="flex items-center justify-between text-[11px] font-bold text-[#6E6259] px-1 pt-0.5 whitespace-nowrap">
              <button
                type="button"
                onClick={() => navigateTo('profile')}
                className="hover:text-[#382E2B] transition cursor-pointer"
              >
                Cài đặt
              </button>
              <span aria-hidden="true">•</span>
              <button
                type="button"
                onClick={openFeedbackModal}
                className="hover:text-[#382E2B] transition cursor-pointer"
              >
                Góp ý
              </button>
              <span aria-hidden="true">•</span>
              <button
                type="button"
                onClick={handleLogout}
                className="hover:text-[#C85A3F] transition cursor-pointer"
              >
                Đăng xuất
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

export default MainSidebar;
