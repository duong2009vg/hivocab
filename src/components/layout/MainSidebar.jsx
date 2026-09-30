// src/components/layout/MainSidebar.jsx
// Pixel-Perfect React Sidebar with Centralized Navigation & Auth Integration
import React from 'react';
import { useAuth } from '../../providers/AuthProvider.jsx';
import { useRoute } from '../../router/RouteContext.jsx';
import { useModal } from '../../context/ModalContext.jsx';

export function MainSidebar() {
  const { user, signOut } = useAuth();
  const { currentRoute, navigateTo } = useRoute();
  const { openModal } = useModal();

  const activeTab = (currentRoute === 'topic-detail' || currentRoute === 'lesson-detail')
    ? 'topics'
    : (currentRoute === 'thpt-room' ? 'exercises' : currentRoute);

  const handleProfileClick = () => {
    if (user) {
      navigateTo('settings');
    } else {
      navigateTo('login');
    }
  };

  const handleStartSession = () => {
    if (typeof window !== 'undefined' && typeof window.startSession === 'function') {
      window.startSession();
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigateTo('landing');
  };

  return (
    <nav
      id="main-sidebar"
      className="hidden lg:flex flex-col h-screen fixed left-0 top-0 w-64 p-5 bg-surface/85 backdrop-blur-2xl border-r border-outline-variant/30 z-50 transition-colors"
    >
      <div className="mb-5 shrink-0">
        <a
          onClick={() => navigateTo('dashboard')}
          className="inline-flex cursor-pointer"
          aria-label="Hi - Trang chu"
        >
          <img className="brand-logo" src="logo-mark.svg" alt="Hi" />
        </a>
        <div
          onClick={handleProfileClick}
          title="Đăng nhập / Hồ sơ cá nhân"
          className="mt-3.5 flex items-center gap-3 p-2 rounded-2xl hover:bg-surface-container dark:hover:bg-[#25292F] transition-all duration-200 cursor-pointer border border-transparent hover:border-outline-variant/20"
        >
          <div
            id="profile-avatar-container"
            className="w-10 h-10 rounded-full bg-surface-container-high dark:bg-[#25292F] flex items-center justify-center overflow-hidden bg-cover bg-center ring-1 ring-outline-variant/30 shrink-0"
          >
            <span className="material-symbols-outlined text-outline text-[20px]">person</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <div id="profile-name" className="font-bold text-[13px] text-on-surface truncate">
                {user?.user_metadata?.full_name || user?.user_metadata?.name || 'Hi Learner'}
              </div>
              <span
                id="profile-pro-badge"
                className="profile-pro-badge hidden shrink-0 items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-md shadow-xs"
              >
                <span className="material-symbols-outlined text-[10px] icon-fill">workspace_premium</span>PRO
              </span>
            </div>
            <div id="profile-email" className="text-on-surface-variant text-[11px] truncate font-medium">
              {user?.email || 'Nhấn để đăng nhập'}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleStartSession}
        className="mb-4 shrink-0 w-full py-2.5 px-4 bg-primary text-on-primary rounded-xl font-semibold text-[13px] tracking-tight transition-all duration-200 active:scale-[0.98] shadow-sm hover:opacity-95 flex items-center justify-center gap-2 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[18px]">play_circle</span>
        <span>Bắt đầu ôn tập</span>
      </button>

      <div className="flex flex-col gap-1 flex-1 overflow-y-auto pr-1 select-none">
        <a
          onClick={() => navigateTo('dashboard')}
          id="nav-desktop-dashboard"
          className={`sidebar-item flex items-center gap-3 px-3.5 h-10 rounded-xl transition-all duration-150 ${activeTab === 'dashboard' ? 'bg-primary/10 text-primary font-bold shadow-xs' : 'text-on-surface-variant hover:bg-surface-container/70 dark:hover:bg-[#25292F] hover:text-on-surface font-medium'} text-[13.5px] cursor-pointer`}
        >
          <span className="material-symbols-outlined text-[20px]">home</span>
          <span>Trang chủ</span>
        </a>
        <a
          onClick={() => navigateTo('topics')}
          onMouseEnter={() => {
            import('../../services/db.js').then(({ getTopics }) => getTopics().catch(() => {})).catch(() => {});
          }}
          id="nav-desktop-topics"
          className={`sidebar-item flex items-center gap-3 px-3.5 h-10 rounded-xl transition-all duration-150 ${activeTab === 'topics' ? 'bg-primary/10 text-primary font-bold shadow-xs' : 'text-on-surface-variant hover:bg-surface-container/70 dark:hover:bg-[#25292F] hover:text-on-surface font-medium'} text-[13.5px] cursor-pointer`}
        >
          <span className="material-symbols-outlined text-[20px]">grid_view</span>
          <span>Chủ đề</span>
        </a>
        <a
          onClick={() => navigateTo('library')}
          id="nav-desktop-library"
          className={`sidebar-item flex items-center gap-3 px-3.5 h-10 rounded-xl transition-all duration-150 ${activeTab === 'library' ? 'bg-primary/10 text-primary font-bold shadow-xs' : 'text-on-surface-variant hover:bg-surface-container/70 dark:hover:bg-[#25292F] hover:text-on-surface font-medium'} text-[13.5px] cursor-pointer`}
        >
          <span className="material-symbols-outlined text-[20px]">explore</span>
          <span>Thư viện</span>
        </a>
        <a
          onClick={() => navigateTo('vocabulary')}
          id="nav-desktop-vocabulary"
          className={`sidebar-item flex items-center gap-3 px-3.5 h-10 rounded-xl transition-all duration-150 ${activeTab === 'vocabulary' ? 'bg-primary/10 text-primary font-bold shadow-xs' : 'text-on-surface-variant hover:bg-surface-container/70 dark:hover:bg-[#25292F] hover:text-on-surface font-medium'} text-[13.5px] cursor-pointer`}
        >
          <span className="material-symbols-outlined text-[20px]">auto_stories</span>
          <span>Kho từ vựng</span>
        </a>
        <a
          onClick={() => navigateTo('exercises')}
          id="nav-desktop-exercises"
          className={`sidebar-item flex items-center gap-3 px-3.5 h-10 rounded-xl transition-all duration-150 ${activeTab === 'exercises' ? 'bg-primary/10 text-primary font-bold shadow-xs' : 'text-on-surface-variant hover:bg-surface-container/70 dark:hover:bg-[#25292F] hover:text-on-surface font-medium'} text-[13.5px] cursor-pointer`}
        >
          <span className="material-symbols-outlined text-[20px]">school</span>
          <span>Luyện Đề THPT</span>
        </a>
        <a
          onClick={() => navigateTo('dictionary')}
          id="nav-desktop-dictionary"
          className={`sidebar-item flex items-center gap-3 px-3.5 h-10 rounded-xl transition-all duration-150 ${activeTab === 'dictionary' ? 'bg-primary/10 text-primary font-bold shadow-xs' : 'text-on-surface-variant hover:bg-surface-container/70 dark:hover:bg-[#25292F] hover:text-on-surface font-medium'} text-[13.5px] cursor-pointer`}
        >
          <span className="material-symbols-outlined text-[20px]">search</span>
          <span>Tra từ</span>
        </a>
      </div>

      <div className="mt-auto shrink-0 flex flex-col gap-1 pt-3 border-t border-outline-variant/20 dark:border-[#31353A]">
        <button
          id="sidebar-upgrade-pro-btn"
          onClick={() => openModal('pricingModal')}
          className="btn-upgrade-pro w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 bg-amber-500/10 hover:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 cursor-pointer text-xs font-bold mb-1.5 group"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="material-symbols-outlined text-[16px] text-amber-500 icon-fill group-hover:scale-110 transition-transform">
              diamond
            </span>
            <span className="truncate">Nâng cấp PRO</span>
          </div>
          <span className="material-symbols-outlined text-[14px] text-amber-500/70 group-hover:translate-x-0.5 transition-transform">
            arrow_forward
          </span>
        </button>
        <a
          onClick={() => navigateTo('settings')}
          id="nav-desktop-settings"
          className="sidebar-item flex items-center gap-3 px-3.5 h-9 rounded-xl transition-all duration-150 text-on-surface-variant hover:bg-surface-container/70 dark:hover:bg-[#25292F] hover:text-on-surface text-[13.5px] font-medium cursor-pointer"
        >
          <span className="material-symbols-outlined text-[19px]">settings</span>
          <span>Cài đặt</span>
        </a>
        <a
          onClick={handleLogout}
          className="flex items-center gap-3 px-3.5 h-9 rounded-xl transition-all duration-150 text-on-surface-variant hover:bg-surface-container/70 dark:hover:bg-[#25292F] hover:text-error text-[13.5px] font-medium cursor-pointer"
        >
          <span className="material-symbols-outlined text-[19px]">logout</span>
          <span>Đăng xuất</span>
        </a>
      </div>
    </nav>
  );
}

export default MainSidebar;
