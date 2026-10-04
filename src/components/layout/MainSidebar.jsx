// src/components/layout/MainSidebar.jsx
// 100% Pixel-Perfect match to taskbar fix design (code.html & screen.png)
import React from 'react';
import { useAuth } from '../../providers/AuthProvider.jsx';
import { useRoute } from '../../router/RouteContext.jsx';
import { useModal } from '../../context/ModalContext.jsx';

export function MainSidebar({ wordCount, streak }) {
  const { user, signOut } = useAuth();
  const { currentRoute, navigateTo } = useRoute();
  const { openModal } = useModal ? useModal() : { openModal: () => {} };

  const activeTab =
    currentRoute === 'topic-detail' || currentRoute === 'lesson-detail'
      ? 'topics'
      : currentRoute === 'exercises' || currentRoute === 'thpt-room'
      ? 'exercises'
      : currentRoute === 'settings'
      ? 'profile'
      : currentRoute;

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.email ? user.email.split('@')[0] : 'Minh Trang');

  const userRank = 'Huy hiệu: Bé Siêng Năng';
  const displayStreak = streak != null ? streak : 2;
  const displayWordCount = wordCount != null ? wordCount : 81;

  const handleLogout = async (e) => {
    e.stopPropagation();
    if (window.confirm('Bạn có muốn đăng xuất khỏi HiVocab không?')) {
      await signOut();
      navigateTo('landing');
    }
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Trang chủ',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      ),
    },
    {
      id: 'topics',
      label: 'Chủ đề & Khóa học',
      emoji: '🏔️',
      onMouseEnter: () => {
        import('../../services/db.js')
          .then(({ getTopics }) => getTopics().catch(() => {}))
          .catch(() => {});
      },
    },
    {
      id: 'vocabulary',
      label: 'Sổ từ cá nhân',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      ),
      badge: displayWordCount,
    },
    {
      id: 'exercises',
      label: 'Luyện đề THPT',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M12 14l9-5-9-5-9 5 9 5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d="M12 14v7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      ),
      badge: '38+',
    },
    {
      id: 'library',
      label: 'Thư viện cộng đồng',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      ),
    },
    {
      id: 'dictionary',
      label: 'Tra cứu từ điển',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      ),
    },
  ];

  return (
    <aside
      className="hidden lg:flex w-72 shrink-0 p-6 flex-col justify-between border-r border-[#E8DEC8]/80 min-h-screen fixed left-0 top-0 h-screen z-20 bg-[#FBF8F1]/95 backdrop-blur-sm select-none"
      data-purpose="desktop-sidebar"
    >
      {/* Top Section: Brand & Nav Links */}
      <div className="space-y-6">
        {/* Brand Logo - HI Crayon Cream Paper */}
        <div
          onClick={() => navigateTo('dashboard')}
          className="px-2 cursor-pointer group select-none flex items-center"
          title="Trang chủ HiVocab"
        >
          <div className="w-16 h-16 rounded-2xl border-2 border-[#3D352E] shadow-[2.5px_2.5px_0px_#3D352E] overflow-hidden bg-[#F7F0DE] group-hover:scale-105 active:scale-95 transition-transform flex items-center justify-center">
            <img
              src="/logo-hi-cream.png"
              alt="Logo HiVocab"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-2 pt-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <a
                key={item.id}
                onClick={() => navigateTo(item.id)}
                onMouseEnter={item.onMouseEnter}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition-all ${
                  isActive
                    ? 'font-bold text-white bg-[#4D6B53] border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E]'
                    : 'font-semibold text-[#786F66] hover:bg-white/80 hover:text-[#302A24] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  {item.emoji ? (
                    <span className="text-xl">{item.emoji}</span>
                  ) : (
                    item.icon
                  )}
                  <span className={isActive ? 'font-heading text-sm' : ''}>{item.label}</span>
                </div>

                {isActive && (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-300 ring-2 ring-white"></span>
                )}
                {!isActive && item.badge != null && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-[#F4E3B4] text-[#3D352E] rounded-full border border-[#3D352E]">
                    {item.badge}
                  </span>
                )}
              </a>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: User Profile Card & Actions */}
      <div className="space-y-3 pt-4 border-t border-[#E8DEC8]/80">

        {/* User Profile Pill */}
        <div
          onClick={() => navigateTo('profile')}
          className={`p-3 rounded-2xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center justify-between cursor-pointer transition-all ${
            activeTab === 'profile' ? 'bg-[#EFF6EE] border-[#4D6B53]' : 'bg-white hover:bg-[#FFFBF3]'
          }`}
          title="Xem thông tin và quản lý hồ sơ học viên"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-[#FFE8C2] border-2 border-[#3D352E] flex items-center justify-center text-base font-bold overflow-hidden">
                {user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  '🐱'
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></span>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#302A24] truncate">{userName}</div>
              <div className="text-[10px] text-[#786F66] truncate">{userRank}</div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-[#C85A3F] bg-[#FBECE7] px-2 py-1 rounded-full border border-[#C85A3F]/40 shrink-0">
            <span>🔥</span>
            <span>{displayStreak}</span>
          </div>
        </div>

        {/* Sub-actions */}
        <div className="flex items-center justify-between text-[11px] font-semibold text-[#786F66] px-1 pt-1">
          <a
            onClick={() => navigateTo('profile')}
            className="hover:text-[#302A24] transition cursor-pointer"
          >
            Cài đặt
          </a>
          <span>•</span>
          <a
            onClick={() => {
              if (openModal) openModal('bugReport');
              else window.openBugReportModal?.();
            }}
            className="hover:text-[#302A24] transition cursor-pointer"
          >
            Góp ý
          </a>
          <span>•</span>
          <a
            onClick={handleLogout}
            className="hover:text-[#C85A3F] transition cursor-pointer"
          >
            Đăng xuất
          </a>
        </div>
      </div>
    </aside>
  );
}

export default MainSidebar;
