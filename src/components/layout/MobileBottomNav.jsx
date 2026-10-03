// src/components/layout/MobileBottomNav.jsx
// Cozy Study Room Crayon Redesign - Mobile Bottom Navigation (100% Stitch Fidelity)
import React from 'react';
import { useRoute } from '../../router/RouteContext.jsx';

export function MobileBottomNav() {
  const { currentRoute, navigateTo } = useRoute();

  const activeTab = (currentRoute === 'topic-detail' || currentRoute === 'lesson-detail')
    ? 'topics'
    : (currentRoute === 'thpt-room' ? 'exercises' : currentRoute);

  const tabs = [
    {
      id: 'dashboard',
      label: 'Trang chủ',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      ),
    },
    {
      id: 'topics',
      label: 'Chủ đề',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      ),
      onTouchPrefetch: () => {
        import('../../services/db.js').then(({ getTopics }) => getTopics().catch(() => {})).catch(() => {});
      },
    },
    {
      id: 'library',
      label: 'Thư viện',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-.778.099-1.533.284-2.253" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      ),
    },
    {
      id: 'vocabulary',
      label: 'Sổ từ',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      ),
    },
    {
      id: 'dictionary',
      label: 'Tra từ',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      ),
    },
  ];

  return (
    <nav
      id="mobile-bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center bg-[#FAF5EB]/95 backdrop-blur-md border-t-[3.5px] border-[#382E2B] lg:hidden select-none"
      data-purpose="bottom-navigation"
    >
      <div className="w-full max-w-[430px] flex justify-around items-center py-2 px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <a
              key={tab.id}
              onClick={() => navigateTo(tab.id)}
              onTouchStart={tab.onTouchPrefetch}
              className="flex flex-col items-center group relative cursor-pointer px-2 py-0.5 transition-transform active:scale-95"
              data-tab={tab.id}
            >
              {isActive ? (
                <div className="w-11 h-8 rounded-full border-2 border-[#577B4A] bg-[#EAF3E7] flex items-center justify-center text-[#3D5A32] shadow-sm">
                  {tab.icon}
                </div>
              ) : (
                <div className="w-11 h-8 flex items-center justify-center text-[#736359] group-hover:text-[#382E2B]">
                  {tab.icon}
                </div>
              )}
              <span
                className={`text-[11px] font-bold mt-0.5 font-quicksand ${
                  isActive ? 'text-[#3D5A32]' : 'text-[#736359] group-hover:text-[#382E2B]'
                }`}
              >
                {tab.label}
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileBottomNav;
