// src/components/layout/MobileBottomNav.jsx
// 100% Pixel-Perfect match to fix taskbar 2 design (Deep Olive Frosted Pill capsule)
import React from 'react';
import { useAuth } from '../../providers/AuthProvider.jsx';
import { useRoute } from '../../router/RouteContext.jsx';

export function MobileBottomNav() {
  const { user } = useAuth ? useAuth() : { user: null };
  const { currentRoute, navigateTo } = useRoute();

  // topic-detail / lesson-detail → highlight 'topics'; settings / profile → highlight 'profile'
  const activeTab =
    currentRoute === 'topic-detail' || currentRoute === 'lesson-detail'
      ? 'topics'
      : currentRoute === 'exercises' || currentRoute === 'thpt-room'
      ? 'exercises'
      : currentRoute === 'settings' || currentRoute === 'profile'
      ? 'profile'
      : currentRoute;

  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    '/mascot/mascot_cozy.png';

  const regularTabs = [
    {
      id: 'dashboard',
      label: 'Trang chủ',
      icon: 'home',
    },
    {
      id: 'topics',
      label: 'Chủ đề',
      icon: 'category',
      onTouchPrefetch: () => {
        import('../../services/db.js')
          .then(({ getTopics }) => getTopics().catch(() => {}))
          .catch(() => {});
      },
    },
    {
      id: 'exercises',
      label: 'Luyện đề',
      icon: 'school',
    },
    {
      id: 'vocabulary',
      label: 'Sổ từ',
      icon: 'menu_book',
    },
    {
      id: 'dictionary',
      label: 'Tra từ',
      icon: 'search',
    },
  ];

  const isProfileActive = activeTab === 'profile';

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-5 left-4 right-4 max-w-[390px] mx-auto z-50 flex items-center justify-between px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-xl border border-white/80 shadow-[0_10px_30px_rgba(61,53,46,0.12)] lg:hidden select-none"
    >
      {regularTabs.map((tab) => {
        const isActive = activeTab === tab.id;
        if (isActive) {
          return (
            <a
              key={tab.id}
              aria-label={tab.label}
              onClick={() => navigateTo(tab.id)}
              onTouchStart={tab.onTouchPrefetch}
              className="flex flex-col items-center justify-center py-1 px-3.5 rounded-full bg-[#5a7d4d] text-white ring-1 ring-white/30 shadow-[0_4px_14px_rgba(90,125,77,0.45)] active:scale-95 transition-all duration-150 cursor-pointer"
            >
              <span
                className="material-symbols-outlined text-[19px] leading-none mb-0.5"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {tab.icon}
              </span>
              <span className="text-[10px] font-bold leading-none tracking-tight">
                {tab.label}
              </span>
            </a>
          );
        }

        return (
          <a
            key={tab.id}
            aria-label={tab.label}
            onClick={() => navigateTo(tab.id)}
            onTouchStart={tab.onTouchPrefetch}
            className="w-11 h-11 flex items-center justify-center text-[#554d42] hover:text-[#1e1b17] active:scale-90 transition-all duration-150 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[23px]">
              {tab.icon}
            </span>
          </a>
        );
      })}

      {/* 5: Profile Mascot Bé Hổ Churbito */}
      {isProfileActive ? (
        <a
          aria-label="Hồ sơ cá nhân"
          onClick={() => navigateTo('profile')}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-full bg-[#5a7d4d] text-white ring-1 ring-white/30 shadow-[0_4px_14px_rgba(90,125,77,0.45)] active:scale-95 transition-all duration-150 cursor-pointer"
        >
          <div className="w-5 h-5 rounded-full overflow-hidden border border-white shadow-xs flex items-center justify-center mb-0.5">
            <img
              alt="Avatar"
              className="w-full h-full object-cover object-top scale-110"
              src={avatarUrl}
              onError={(e) => {
                e.currentTarget.src = '/mascot/mascot_cozy.png';
              }}
            />
          </div>
          <span className="text-[10px] font-bold leading-none tracking-tight">
            Hồ sơ
          </span>
        </a>
      ) : (
        <a
          aria-label="Tài khoản Bé Hổ Churbito"
          onClick={() => navigateTo('profile')}
          className="relative w-11 h-11 flex items-center justify-center active:scale-90 transition-all duration-150 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden bg-[#faf2ec] border-2 border-white/80 shadow-sm flex items-center justify-center">
            <img
              alt="Churbito Avatar"
              className="w-full h-full object-cover object-top scale-110"
              src={avatarUrl}
              onError={(e) => {
                e.currentTarget.src = '/mascot/mascot_cozy.png';
              }}
            />
          </div>
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#5a7d4d] ring-2 ring-white"></span>
        </a>
      )}
    </nav>
  );
}

export default MobileBottomNav;
