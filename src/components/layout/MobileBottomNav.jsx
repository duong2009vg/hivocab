// src/components/layout/MobileBottomNav.jsx
// Floating frosted-glass capsule dock with a smooth curved center cradle & raised circular
// Features button in the middle (2 left tabs · raised center Features button · 2 right tabs),
// preserving HiVocab's signature warm frosted glass & deep-olive (#5a7d4d) aesthetic.
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

// Smooth floating capsule with curved center cradle (400 x 68 coordinate space)
const DOCK_PATH_400 =
  'M 34 1 L 138 1 C 160 1 164 41 200 41 C 236 41 240 1 262 1 L 366 1 C 384.5 1 399 15.8 399 34 C 399 52.2 384.5 67 366 67 L 34 67 C 15.5 67 1 52.2 1 34 C 1 15.8 15.5 1 34 1 Z';

// Same path normalized to [0..1] for objectBoundingBox CSS backdrop-blur clipping
const DOCK_CLIP_NORM =
  'M 0.085 0 L 0.345 0 C 0.400 0 0.410 0.603 0.500 0.603 C 0.590 0.603 0.600 0 0.655 0 L 0.915 0 C 0.962 0 1 0.224 1 0.500 C 1 0.776 0.962 1 0.915 1 L 0.085 1 C 0.038 1 0 0.776 0 0.500 C 0 0.224 0.038 0 0.085 0 Z';

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
        aria-label={tab.label}
        aria-current={isActive ? 'page' : undefined}
        onClick={() => navigateTo(tab.id)}
        onTouchStart={tab.onTouchPrefetch}
        className={`relative z-10 h-[52px] w-full max-w-[74px] px-1.5 flex flex-col items-center justify-center rounded-full transition-all duration-150 active:scale-95 cursor-pointer ${
          isActive
            ? 'bg-[#5a7d4d] text-white ring-1 ring-white/40 shadow-[0_4px_14px_rgba(90,125,77,0.42)]'
            : 'text-[#554d42] hover:text-[#2a241f]'
        }`}
      >
        <span
          className="material-symbols-outlined text-[20px] leading-none mb-1"
          style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          {tab.icon}
        </span>
        <span className="text-[10px] font-extrabold leading-none tracking-tight whitespace-nowrap">
          {tab.label}
        </span>
      </button>
    );
  };

  return (
    <div ref={containerRef} id="mobile-bottom-nav" className="lg:hidden">
      {/* Hidden SVG clipPath definition for curved-cradle frosted backdrop blur */}
      <svg aria-hidden="true" className="absolute w-0 h-0 overflow-hidden pointer-events-none">
        <defs>
          <clipPath id="hivocab-dock-cradle-clip" clipPathUnits="objectBoundingBox">
            <path d={DOCK_CLIP_NORM} />
          </clipPath>
        </defs>
      </svg>

      {/* Subtle Backdrop Scrim when More popover is open */}
      {isMoreOpen && (
        <div
          aria-hidden="true"
          onClick={() => setIsMoreOpen(false)}
          className="fixed inset-0 z-40 bg-[#382E2B]/18 backdrop-blur-[2px]"
        />
      )}

      {/* Frosted-glass More Feature Popover floating neatly above the raised center button */}
      {isMoreOpen && (
        <div
          role="dialog"
          aria-label="Khám phá thêm tính năng"
          className="fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom,0px))] left-3 right-3 max-w-[420px] mx-auto z-50 p-3.5 rounded-[28px] bg-[#FFFDF9] border border-[#E5DAC7] shadow-[0_18px_46px_rgba(56,46,43,0.22)] select-none"
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

      {/* Main Floating Frosted Capsule Dock with Curved Center Cradle */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-[calc(0.95rem+env(safe-area-inset-bottom,0px))] left-3 right-3 max-w-[420px] mx-auto z-50 h-[70px] select-none"
      >
        {/* Crisp sculpted frosted-cream capsule with smooth curved center cradle */}
        <svg
          aria-hidden="true"
          viewBox="0 0 400 68"
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

        {/* 5-Column Symmetric Button Layout (2 Left · Raised Center Features · 2 Right) */}
        <div className="relative z-10 h-full w-full grid grid-cols-5 items-center px-1.5">
          {/* Slots 1 & 2: Trang chủ, Chủ đề */}
          {leftTabs.map((tab) => (
            <div key={tab.id} className="flex items-center justify-center px-0.5">
              {renderStandardTab(tab)}
            </div>
          ))}

          {/* Slot 3 (CENTER): Raised Circular Features Drawer Trigger nestled in the curved cradle */}
          <div className="relative h-full flex flex-col items-center justify-end pb-2.5">
            <button
              type="button"
              aria-label="Mở tất cả tính năng học tập"
              aria-expanded={isMoreOpen}
              onClick={() => setIsMoreOpen((prev) => !prev)}
              className={`absolute -top-[21px] left-1/2 -translate-x-1/2 w-[54px] h-[54px] rounded-full flex items-center justify-center text-white border-[2.5px] border-white/95 transition-all duration-200 active:scale-90 cursor-pointer ${
                isMoreOpen
                  ? 'bg-[#DE5D53] shadow-[0_8px_22px_rgba(222,93,83,0.48)] rotate-90'
                  : isMoreRouteActive
                  ? 'bg-gradient-to-b from-[#698F5B] to-[#46633D] shadow-[0_8px_22px_rgba(70,99,61,0.5)] ring-2 ring-[#F4D06F]/80'
                  : 'bg-gradient-to-b from-[#698F5B] to-[#4D6B43] hover:from-[#729A63] hover:to-[#537449] shadow-[0_8px_20px_rgba(77,107,67,0.42)]'
              }`}
            >
              <span
                className="material-symbols-outlined text-[24px] leading-none"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {isMoreOpen ? 'close' : activeMoreItem?.icon || 'grid_view'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsMoreOpen((prev) => !prev)}
              className={`text-[10px] font-extrabold leading-none tracking-tight whitespace-nowrap max-w-[74px] truncate cursor-pointer ${
                isMoreOpen
                  ? 'text-[#DE5D53]'
                  : isMoreRouteActive
                  ? 'text-[#4D6B43]'
                  : 'text-[#554d42]'
              }`}
            >
              {isMoreOpen
                ? 'Đóng'
                : activeMoreItem?.label?.split(' ')[0] || 'Tính năng'}
            </button>
          </div>

          {/* Slot 4: Sổ từ */}
          <div className="flex items-center justify-center px-0.5">
            {renderStandardTab(vocabTab)}
          </div>

          {/* Slot 5: Hồ sơ Bé Hổ Churbito */}
          <div className="flex items-center justify-center px-0.5">
            <button
              type="button"
              aria-label="Hồ sơ cá nhân"
              aria-current={isProfileActive && !isMoreOpen ? 'page' : undefined}
              onClick={() => navigateTo('profile')}
              className={`relative z-10 h-[52px] w-full flex flex-col items-center justify-center rounded-full transition-all duration-150 active:scale-95 cursor-pointer ${
                isProfileActive && !isMoreOpen
                  ? 'bg-[#5a7d4d] text-white ring-1 ring-white/40 shadow-[0_4px_14px_rgba(90,125,77,0.42)]'
                  : 'text-[#554d42] hover:text-[#2a241f]'
              }`}
            >
              <div
                className={`relative w-6 h-6 rounded-full overflow-hidden flex items-center justify-center mb-0.5 ${
                  isProfileActive && !isMoreOpen
                    ? 'border-[1.5px] border-white shadow-xs'
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
              <span className="text-[10px] font-bold leading-none tracking-tight whitespace-nowrap">
                Hồ sơ
              </span>
              {isPro && (
                <span
                  className="profile-pro-badge absolute top-0.5 right-1.5 leading-none select-none"
                  title="HiVocab PRO"
                >
                  <Crown className="w-3 h-3 text-amber-500 fill-amber-400" />
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
