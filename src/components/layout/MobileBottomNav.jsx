// src/components/layout/MobileBottomNav.jsx
// Preserves the signature floating frosted-glass capsule & deep-olive active pill aesthetic,
// upgraded to 5 spacious touch-friendly slots + a matching frosted More menu for all features.
import React, { useState, useEffect, useRef } from 'react';
import { Crown } from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider.jsx';
import { useRoute } from '../../router/RouteContext.jsx';

const MORE_FEATURES = [
  {
    id: 'exercises',
    label: 'Lộ trình THPT',
    sub: '48 đề & 29 chuyên đề',
    icon: 'school',
    badge: '3 quyển',
  },
  {
    id: 'bilingual-reading',
    label: 'Đọc song ngữ',
    sub: 'Báo & bài đọc IELTS',
    icon: 'auto_stories',
    badge: 'IELTS',
    onTouchPrefetch: () => {
      import('../pages/PageBilingualReading.jsx').catch(() => {});
    },
  },
  {
    id: 'studio',
    label: 'Shadowing AI',
    sub: 'Video & 44 âm IPA',
    icon: 'mic',
    badge: 'Mới',
  },
  {
    id: 'arena',
    label: 'Đấu trường 1v1',
    sub: 'PvP & Game phản xạ',
    icon: 'sports_esports',
    badge: 'PvP',
  },
  {
    id: 'library',
    label: 'Thư viện chung',
    sub: 'Bộ từ cộng đồng',
    icon: 'public',
    onTouchPrefetch: () => {
      import('../pages/PageLibrary.jsx').catch(() => {});
    },
  },
  {
    id: 'dictionary',
    label: 'Tra từ điển',
    sub: 'Anh–Việt & IPA',
    icon: 'search',
  },
];

const MORE_ROUTE_IDS = new Set([
  'exercises',
  'thpt-room',
  'bilingual-reading',
  'studio',
  'arena',
  'library',
  'dictionary',
]);

export function MobileBottomNav() {
  const { user, isPaidPro: isPro } = useAuth();
  const { currentRoute, navigateTo } = useRoute();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const containerRef = useRef(null);

  const activeTab =
    currentRoute === 'topic-detail' || currentRoute === 'lesson-detail'
      ? 'topics'
      : currentRoute === 'thpt-room'
      ? 'exercises'
      : currentRoute === 'settings' || currentRoute === 'profile'
      ? 'profile'
      : currentRoute;

  const isMoreRouteActive = MORE_ROUTE_IDS.has(activeTab);
  const activeMoreItem = MORE_FEATURES.find((item) => item.id === activeTab);

  // Close More popover on route change, outside tap, or Escape
  useEffect(() => {
    setIsMoreOpen(false);
  }, [currentRoute]);

  useEffect(() => {
    if (!isMoreOpen) return undefined;
    const handlePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsMoreOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsMoreOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMoreOpen]);

  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    '/mascot/mascot_cozy.png';

  const primaryTabs = [
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
      id: 'vocabulary',
      label: 'Sổ từ',
      icon: 'menu_book',
    },
  ];

  const handleSelectMoreFeature = (item) => {
    setIsMoreOpen(false);
    if (item.id === 'bilingual-reading' && typeof window !== 'undefined') {
      window._bilingualEntryOrigin = 'hub';
      window._currentPassageId = null;
      window.dispatchEvent(new CustomEvent('hi:bilingual-open-hub'));
    }
    navigateTo(item.id);
  };

  const isProfileActive = activeTab === 'profile';

  return (
    <div ref={containerRef} className="lg:hidden">
      {/* Subtle Backdrop Scrim when More popover is open */}
      {isMoreOpen && (
        <div
          aria-hidden="true"
          onClick={() => setIsMoreOpen(false)}
          className="fixed inset-0 z-40 bg-[#382E2B]/18 backdrop-blur-[2px]"
        />
      )}

      {/* Frosted-glass More Feature Popover matching the floating dock */}
      {isMoreOpen && (
        <div
          role="dialog"
          aria-label="Khám phá thêm tính năng"
          className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] left-3 right-3 max-w-[420px] mx-auto z-50 p-3 rounded-[28px] bg-white/95 backdrop-blur-xl border border-white/90 shadow-[0_16px_42px_rgba(61,53,46,0.22)] select-none"
        >
          <div className="flex items-center justify-between px-1.5 pb-2 mb-2 border-b border-[#382E2B]/10">
            <span className="text-xs font-extrabold text-[#382E2B] tracking-tight">
              Tính năng học tập
            </span>
            <button
              type="button"
              onClick={() => setIsMoreOpen(false)}
              aria-label="Đóng menu"
              className="w-7 h-7 rounded-full flex items-center justify-center text-[#554d42] hover:bg-black/5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {MORE_FEATURES.map((item) => {
              const isItemActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectMoreFeature(item)}
                  onTouchStart={item.onTouchPrefetch}
                  className={`flex items-center gap-2.5 p-2.5 rounded-2xl text-left transition-all duration-150 active:scale-[0.97] cursor-pointer ${
                    isItemActive
                      ? 'bg-[#5a7d4d] text-white shadow-[0_4px_12px_rgba(90,125,77,0.35)]'
                      : 'bg-[#FAF5EB]/90 hover:bg-[#F3EBD9] text-[#382E2B]'
                  }`}
                >
                  <span
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isItemActive
                        ? 'bg-white/20 text-white'
                        : 'bg-white text-[#5a7d4d] shadow-xs'
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-[20px]"
                      style={isItemActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      {item.icon}
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-extrabold leading-tight truncate">
                      {item.label}
                    </div>
                    <div
                      className={`text-[10.5px] font-semibold truncate mt-0.5 ${
                        isItemActive ? 'text-white/85' : 'text-[#6E6259]'
                      }`}
                    >
                      {item.sub}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Floating Frosted Capsule Dock (preserved aesthetic, 5 spacious slots) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] left-3 right-3 max-w-[420px] mx-auto z-50 flex items-center justify-between px-2.5 sm:px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-xl border border-white/80 shadow-[0_10px_30px_rgba(61,53,46,0.12)] select-none"
      >
        {primaryTabs.map((tab) => {
          const isActive = activeTab === tab.id && !isMoreOpen;
          if (isActive) {
            return (
              <button
                key={tab.id}
                type="button"
                aria-label={tab.label}
                aria-current="page"
                onClick={() => navigateTo(tab.id)}
                onTouchStart={tab.onTouchPrefetch}
                className="min-h-[44px] flex flex-col items-center justify-center py-1 px-3 sm:px-4 rounded-full bg-[#5a7d4d] text-white ring-1 ring-white/30 shadow-[0_4px_14px_rgba(90,125,77,0.45)] active:scale-95 transition-all duration-150 cursor-pointer"
              >
                <span
                  className="material-symbols-outlined text-[19px] leading-none mb-0.5"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {tab.icon}
                </span>
                <span className="text-[10px] font-bold leading-none tracking-tight whitespace-nowrap">
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              type="button"
              aria-label={tab.label}
              onClick={() => navigateTo(tab.id)}
              onTouchStart={tab.onTouchPrefetch}
              className="min-w-[44px] h-11 flex items-center justify-center rounded-full text-[#554d42] hover:text-[#1e1b17] active:scale-90 transition-all duration-150 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[22px]">{tab.icon}</span>
            </button>
          );
        })}

        {/* 4: More / Explore Features (THPT, Bilingual, Studio, Arena, Library, Dictionary) */}
        {isMoreOpen || isMoreRouteActive ? (
          <button
            type="button"
            aria-label="Khám phá thêm tính năng"
            aria-expanded={isMoreOpen}
            onClick={() => setIsMoreOpen((prev) => !prev)}
            className="min-h-[44px] flex flex-col items-center justify-center py-1 px-3 sm:px-3.5 rounded-full bg-[#5a7d4d] text-white ring-1 ring-white/30 shadow-[0_4px_14px_rgba(90,125,77,0.45)] active:scale-95 transition-all duration-150 cursor-pointer"
          >
            <span
              className="material-symbols-outlined text-[19px] leading-none mb-0.5"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {isMoreOpen ? 'close' : activeMoreItem?.icon || 'apps'}
            </span>
            <span className="text-[10px] font-bold leading-none tracking-tight whitespace-nowrap max-w-[68px] truncate">
              {isMoreOpen ? 'Đóng' : activeMoreItem?.label?.split(' ')[0] || 'Khám phá'}
            </span>
          </button>
        ) : (
          <button
            type="button"
            aria-label="Khám phá thêm tính năng"
            aria-expanded={false}
            onClick={() => setIsMoreOpen(true)}
            className="min-w-[44px] h-11 flex items-center justify-center rounded-full text-[#554d42] hover:text-[#1e1b17] active:scale-90 transition-all duration-150 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">grid_view</span>
          </button>
        )}

        {/* 5: Profile Mascot Bé Hổ Churbito */}
        {isProfileActive && !isMoreOpen ? (
          <button
            type="button"
            aria-label="Hồ sơ cá nhân"
            aria-current="page"
            onClick={() => navigateTo('profile')}
            className="relative min-h-[44px] flex flex-col items-center justify-center py-1 px-3 rounded-full bg-[#5a7d4d] text-white ring-1 ring-white/30 shadow-[0_4px_14px_rgba(90,125,77,0.45)] active:scale-95 transition-all duration-150 cursor-pointer"
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
            <span className="text-[10px] font-bold leading-none tracking-tight">Hồ sơ</span>
            {isPro && (
              <span
                className="profile-pro-badge absolute -top-1 -right-1 leading-none select-none"
                title="HiVocab PRO"
              >
                <Crown className="w-3 h-3 text-amber-300 fill-amber-300" />
              </span>
            )}
          </button>
        ) : (
          <button
            type="button"
            aria-label="Tài khoản Bé Hổ Churbito"
            onClick={() => navigateTo('profile')}
            className="relative min-w-[44px] h-11 flex items-center justify-center rounded-full active:scale-90 transition-all duration-150 cursor-pointer"
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
            {isPro ? (
              <span
                className="profile-pro-badge absolute top-0.5 right-0.5 leading-none select-none filter drop-shadow-xs"
                title="HiVocab PRO"
              >
                <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />
              </span>
            ) : (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#5a7d4d] ring-2 ring-white" />
            )}
          </button>
        )}
      </nav>
    </div>
  );
}

export default MobileBottomNav;
