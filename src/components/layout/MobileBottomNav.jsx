// src/components/layout/MobileBottomNav.jsx
// Compact icon-only floating capsule dock with a smooth curved center cradle & raised circular
// "+" Features button in the middle (2 left icons · raised center "+" button · 2 right icons).
import React, { useState, useEffect, useRef } from 'react';
import { Crown, Plus } from 'lucide-react';
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

// Compact sculpted capsule with curved center cradle (400 x 56 coordinate space)
const DOCK_PATH_400 =
  'M 28 1 L 144 1 C 163 1 167 38 200 38 C 233 38 237 1 256 1 L 372 1 C 387 1 399 13 399 28 C 399 43 387 55 372 55 L 28 55 C 13 55 1 43 1 28 C 1 13 13 1 28 1 Z';

export function MobileBottomNav() {
  const { user, isPaidPro: isPro, isPremium } = useAuth();
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

  const leftTabs = [
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
  ];

  const vocabTab = {
    id: 'vocabulary',
    label: 'Sổ từ',
    icon: 'menu_book',
  };

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

  const renderStandardTab = (tab) => {
    const isActive = activeTab === tab.id && !isMoreOpen;
    return (
      <button
        key={tab.id}
        type="button"
        title={tab.label}
        aria-label={tab.label}
        aria-current={isActive ? 'page' : undefined}
        onClick={() => navigateTo(tab.id)}
        onTouchStart={tab.onTouchPrefetch}
        className={`relative z-10 w-[44px] h-[44px] flex items-center justify-center rounded-full transition-all duration-150 active:scale-90 cursor-pointer ${
          isActive
            ? 'bg-[#5a7d4d] text-white ring-1 ring-white/40 shadow-[0_4px_14px_rgba(90,125,77,0.42)]'
            : 'text-[#554d42] hover:text-[#2a241f] hover:bg-black/[0.04]'
        }`}
      >
        <span
          className="material-symbols-outlined text-[22px] leading-none"
          style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          {tab.icon}
        </span>
      </button>
    );
  };

  return (
    <div ref={containerRef} id="mobile-bottom-nav" className="lg:hidden">
      {/* Subtle Backdrop Scrim when More popover is open */}
      {isMoreOpen && (
        <div
          aria-hidden="true"
          onClick={() => setIsMoreOpen(false)}
          className="fixed inset-0 z-40 bg-[#382E2B]/18 backdrop-blur-[2px]"
        />
      )}

      {/* Frosted-glass More Feature Popover floating neatly above the raised center "+" button */}
      {isMoreOpen && (
        <div
          role="dialog"
          aria-label="Khám phá thêm tính năng"
          className="fixed bottom-[calc(5.6rem+env(safe-area-inset-bottom,0px))] left-3 right-3 max-w-[420px] mx-auto z-50 p-3.5 rounded-[28px] bg-[#FFFDF9] border border-[#E5DAC7] shadow-[0_18px_46px_rgba(56,46,43,0.22)] select-none"
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

      {/* Compact Icon-Only Floating Capsule Dock with Curved Center Cradle */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-[calc(0.85rem+env(safe-area-inset-bottom,0px))] left-4 right-4 max-w-[360px] mx-auto z-50 h-[56px] select-none"
      >
        {/* Crisp sculpted cream capsule with smooth curved center cradle */}
        <svg
          aria-hidden="true"
          viewBox="0 0 400 56"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
          style={{ filter: 'drop-shadow(0 10px 24px rgba(56, 46, 43, 0.16))' }}
        >
          <path
            d={DOCK_PATH_400}
            fill="rgba(255, 253, 249, 0.96)"
            stroke="rgba(227, 215, 197, 0.95)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* 5-Column Symmetric Icon-Only Layout (2 Left · Raised Center "+" · 2 Right) */}
        <div className="relative z-10 h-full w-full grid grid-cols-5 items-center px-2">
          {/* Slots 1 & 2: Home, Topics */}
          {leftTabs.map((tab) => (
            <div key={tab.id} className="flex items-center justify-center">
              {renderStandardTab(tab)}
            </div>
          ))}

          {/* Slot 3 (CENTER): Raised Circular "+" Features Trigger nestled in the curved cradle */}
          <div className="relative h-full flex items-center justify-center">
            <button
              type="button"
              title={isMoreOpen ? 'Đóng menu tính năng' : 'Mở tất cả tính năng học tập'}
              aria-label={isMoreOpen ? 'Đóng menu tính năng' : 'Mở tất cả tính năng học tập'}
              aria-expanded={isMoreOpen}
              onClick={() => setIsMoreOpen((prev) => !prev)}
              className={`absolute -top-[18px] left-1/2 -translate-x-1/2 w-[52px] h-[52px] rounded-full flex items-center justify-center text-white border-[2.5px] border-white/95 transition-all duration-200 active:scale-90 cursor-pointer ${
                isMoreOpen
                  ? 'bg-[#DE5D53] shadow-[0_8px_22px_rgba(222,93,83,0.48)]'
                  : isMoreRouteActive
                  ? 'bg-gradient-to-b from-[#698F5B] to-[#46633D] shadow-[0_8px_22px_rgba(70,99,61,0.5)] ring-2 ring-[#F4D06F]/85'
                  : 'bg-gradient-to-b from-[#698F5B] to-[#4D6B43] hover:from-[#729A63] hover:to-[#537449] shadow-[0_8px_20px_rgba(77,107,67,0.42)]'
              }`}
            >
              <Plus
                className={`w-6 h-6 stroke-[2.75] transition-transform duration-200 ${
                  isMoreOpen ? 'rotate-45' : 'rotate-0'
                }`}
              />
            </button>
          </div>

          {/* Slot 4: Vocabulary Notebook */}
          <div className="flex items-center justify-center">
            {renderStandardTab(vocabTab)}
          </div>

          {/* Slot 5: Profile Avatar (icon-only) */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              title="Hồ sơ cá nhân"
              aria-label="Hồ sơ cá nhân"
              aria-current={isProfileActive && !isMoreOpen ? 'page' : undefined}
              onClick={() => navigateTo('profile')}
              className={`relative z-10 w-[44px] h-[44px] flex items-center justify-center rounded-full transition-all duration-150 active:scale-90 cursor-pointer ${
                isProfileActive && !isMoreOpen
                  ? 'bg-[#5a7d4d] text-white ring-1 ring-white/40 shadow-[0_4px_14px_rgba(90,125,77,0.42)]'
                  : 'hover:bg-black/[0.04]'
              }`}
            >
              <div
                className={`relative w-8 h-8 rounded-full overflow-hidden flex items-center justify-center ${
                  isProfileActive && !isMoreOpen
                    ? 'border-2 border-white shadow-xs'
                    : 'bg-[#faf2ec] border-[1.5px] border-[#382E2B]/25 shadow-xs'
                }`}
              >
                <img
                  alt="Avatar"
                  className="w-full h-full object-cover object-top scale-110"
                  src={avatarUrl}
                  onError={(e) => {
                    e.currentTarget.src = '/mascot/mascot_cozy.png';
                  }}
                />
              </div>
              {isPro && (
                <span
                  className="profile-pro-badge absolute -top-0.5 right-0 leading-none select-none"
                  title={isPremium ? 'HiVocab PREMIUM' : 'HiVocab PRO'}
                >
                  <Crown
                    className={`w-3.5 h-3.5 drop-shadow-xs ${
                      isPremium
                        ? 'text-[#6B21A8] fill-[#C084FC]'
                        : 'text-amber-500 fill-amber-400'
                    }`}
                  />
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default MobileBottomNav;
