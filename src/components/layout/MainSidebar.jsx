// src/components/layout/MainSidebar.jsx
// Cozy Study Room Crayon Redesign - Desktop Left Sidebar (100% Stitch Pixel-Perfect Fidelity)
import React from 'react';
import { useAuth } from '../../providers/AuthProvider.jsx';
import { useRoute } from '../../router/RouteContext.jsx';

export function MainSidebar({ wordCount, streak }) {
  const { user } = useAuth();
  const { currentRoute, navigateTo } = useRoute();

  const activeTab =
    currentRoute === 'topic-detail' || currentRoute === 'lesson-detail'
      ? 'topics'
      : currentRoute;

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.email ? user.email.split('@')[0] : 'Bạn học');

  const userEmail = user?.email || 'Huy hiệu: Bé Siêng Năng';

  const navItems = [
    {
      id: 'dashboard',
      label: 'Trang chủ',
      faIcon: 'fa-solid fa-house',
      iconColor: null, // white when active, per Stitch active=text-white
    },
    {
      id: 'topics',
      label: 'Chủ đề & Khóa học',
      faIcon: 'fa-solid fa-shapes',
      iconColor: 'text-warmAmber',
      onMouseEnter: () => {
        import('../../services/db.js')
          .then(({ getTopics }) => getTopics().catch(() => {}))
          .catch(() => {});
      },
    },
    {
      id: 'vocabulary',
      label: 'Sổ từ cá nhân',
      faIcon: 'fa-solid fa-book-sparkles',
      iconColor: 'text-softBlue',
      badge: wordCount != null ? wordCount : null,
    },
    {
      id: 'library',
      label: 'Thư viện cộng đồng',
      faIcon: 'fa-solid fa-compass',
      iconColor: 'text-softPurple',
    },
    {
      id: 'dictionary',
      label: 'Tra cứu từ điển',
      faIcon: 'fa-solid fa-magnifying-glass',
      iconColor: 'text-terracotta',
    },
  ];

  return (
    <aside className="hidden lg:flex w-64 xl:w-72 bg-[#fdfbf7]/90 border-r-2 border-[#e6dcce] flex-col justify-between p-5 fixed left-0 top-0 h-screen z-20 backdrop-blur-sm select-none">
      <div className="space-y-6">
        {/* Logo and App Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 crayon-border flex items-center justify-center text-amber-800 shadow-crayonSm text-xl">
              <i className="fa-solid fa-book-bookmark"></i>
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-crayonText font-quicksand block leading-none">
                HiVocab!
              </span>
              <span className="inline-block text-[11px] font-extrabold uppercase px-2 py-0.5 mt-1 rounded-full bg-sage-light text-sage border border-sage/40 tracking-wider">
                Bản Học Tập
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Main Navigation" className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <a
                key={item.id}
                onClick={() => navigateTo(item.id)}
                onMouseEnter={item.onMouseEnter}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold cursor-pointer transition-all ${
                  isActive
                    ? 'bg-sage text-white shadow-crayon active:translate-y-0.5'
                    : 'text-crayonText/80 hover:bg-cream hover:text-crayonText'
                }`}
              >
                <i
                  className={`${item.faIcon} text-lg w-5 text-center ${
                    isActive ? '' : item.iconColor ?? ''
                  }`}
                ></i>
                <span className="font-quicksand text-base">{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse"></span>
                )}
                {!isActive && item.badge != null && (
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold border border-amber-300">
                    {item.badge}
                  </span>
                )}
              </a>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Bottom: Mascot Buddy Card + User Profile Card */}
      <div className="space-y-4 pt-4">
        {/* Mascot Helper Pill */}
        <div
          onClick={() => navigateTo('dashboard')}
          className="bg-[#faf3e7] rounded-2xl p-3.5 crayon-border relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex-shrink-0 overflow-hidden crayon-border">
              <img
                alt="Bé hổ Churbito"
                className="w-full h-full object-cover mix-blend-multiply"
                src="/mascot/mascot_cozy.png"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-terracotta uppercase tracking-wide">
                Trợ thủ học tập
              </p>
              <h4 className="text-sm font-black text-crayonText font-quicksand">
                Học cùng bé Hổ 🐾
              </h4>
              <p className="text-[11px] text-softMuted">"Chỉ 15 phút mỗi ngày nhé!"</p>
            </div>
          </div>
        </div>

        {/* User Profile Card */}
        <div
          onClick={() => navigateTo('settings')}
          className="bg-white/80 rounded-2xl p-3 crayon-border flex items-center gap-3 cursor-pointer"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-amber-200 border-2 border-crayonText overflow-hidden flex items-center justify-center font-black text-crayonText">
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                '🐯'
              )}
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold truncate text-crayonText">{userName}</h4>
              {streak != null && (
                <span className="text-xs font-black text-terracotta flex items-center gap-0.5">
                  🔥 {streak}
                </span>
              )}
            </div>
            <p className="text-xs text-softMuted truncate">{userEmail}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default MainSidebar;
