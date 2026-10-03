// src/components/layout/MainSidebar.jsx
// Cozy Study Room Crayon Redesign - Desktop Left Sidebar (100% Stitch Fidelity)
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

  const handleLogout = async () => {
    await signOut();
    navigateTo('landing');
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Trang chủ',
      faIcon: 'fa-solid fa-house',
      color: 'text-sage',
    },
    {
      id: 'topics',
      label: 'Chủ đề & Khóa học',
      faIcon: 'fa-solid fa-shapes',
      color: 'text-warmAmber',
      onHoverPrefetch: () => {
        import('../../services/db.js').then(({ getTopics }) => getTopics().catch(() => {})).catch(() => {});
      },
    },
    {
      id: 'vocabulary',
      label: 'Sổ từ cá nhân',
      faIcon: 'fa-solid fa-book-sparkles',
      color: 'text-softBlue',
    },
    {
      id: 'library',
      label: 'Thư viện cộng đồng',
      faIcon: 'fa-solid fa-compass',
      color: 'text-softPurple',
    },
    {
      id: 'exercises',
      label: 'Luyện Đề THPT & CBT',
      faIcon: 'fa-solid fa-graduation-cap',
      color: 'text-orange-500',
    },
    {
      id: 'dictionary',
      label: 'Tra cứu từ điển',
      faIcon: 'fa-solid fa-magnifying-glass',
      color: 'text-terracotta',
    },
  ];

  return (
    <aside
      id="main-sidebar"
      className="hidden lg:flex w-64 xl:w-72 bg-[#fdfbf7]/95 border-r-2 border-[#e6dcce] flex-col justify-between p-5 fixed left-0 top-0 h-screen z-40 backdrop-blur-sm select-none font-nunito shrink-0"
      data-purpose="left-navigation-sidebar"
    >
      <div className="space-y-6 flex-1 flex flex-col min-h-0">
        {/* Logo and App Badge */}
        <div
          onClick={() => navigateTo('dashboard')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-11 h-11 rounded-2xl bg-amber-100 crayon-border flex items-center justify-center text-amber-800 shadow-crayonSm text-xl group-hover:scale-105 transition-transform">
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

        {/* Navigation Links */}
        <nav aria-label="Main Navigation" className="space-y-1.5 flex-1 overflow-y-auto pr-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <a
                key={item.id}
                id={`nav-desktop-${item.id}`}
                onClick={() => navigateTo(item.id)}
                onMouseEnter={item.onHoverPrefetch}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold cursor-pointer transition-all ${
                  isActive
                    ? 'bg-sage text-white shadow-crayon translate-y-[-1px]'
                    : 'text-crayonText/80 hover:bg-cream hover:text-crayonText'
                }`}
              >
                <i className={`${item.faIcon} text-lg w-5 text-center ${isActive ? 'text-white' : item.color}`}></i>
                <span className="font-quicksand text-base">{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse"></span>
                )}
              </a>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Bottom Area: Mascot Buddy Card + Upgrade PRO + User Profile */}
      <div className="space-y-3 pt-3 shrink-0">
        {/* Mascot Helper Pill */}
        <div
          onClick={() => navigateTo('dashboard')}
          className="bg-[#faf3e7] rounded-2xl p-3 crayon-border relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-xl bg-orange-100 flex-shrink-0 overflow-hidden crayon-border flex items-center justify-center">
              <img
                alt="Bé hổ Mascot"
                className="w-full h-full object-cover mix-blend-multiply"
                src="/mascot/mascot_cozy.png"
                onError={(e) => {
                  e.currentTarget.src = '/mascot/mascot_waving.png';
                }}
              />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-terracotta uppercase tracking-wide">Trợ thủ học tập</p>
              <h4 className="text-xs font-black text-crayonText font-quicksand truncate">Học cùng bé Hổ 🐾</h4>
              <p className="text-[10px] text-softMuted truncate">"Chỉ 15 phút mỗi ngày nhé!"</p>
            </div>
          </div>
        </div>

        {/* Upgrade PRO Button */}
        <button
          id="sidebar-upgrade-pro-btn"
          onClick={() => openModal('pricingModal')}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100/80 text-amber-900 border-2 border-amber-300 shadow-crayonSm cursor-pointer text-xs font-black transition-all group active:scale-98"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="text-sm">💎</span>
            <span className="truncate">Nâng cấp PRO Vĩnh viễn</span>
          </div>
          <span className="text-amber-800 text-xs group-hover:translate-x-0.5 transition-transform">➔</span>
        </button>

        {/* User Profile Card */}
        <div
          onClick={handleProfileClick}
          className="bg-white/90 rounded-2xl p-2.5 crayon-border flex items-center gap-2.5 cursor-pointer hover:bg-white transition-all shadow-xs"
          title="Tài khoản cá nhân / Cài đặt"
        >
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-amber-200 border-2 border-crayonText overflow-hidden flex items-center justify-center font-black text-sm">
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>🐯</span>
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold truncate text-crayonText">
                {user?.user_metadata?.full_name || user?.user_metadata?.name || (user?.email ? user.email.split('@')[0] : 'Bạn học')}
              </h4>
            </div>
            <p className="text-[10px] text-softMuted truncate">
              {user?.email || 'Nhấn để đăng nhập'}
            </p>
          </div>
          {user && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLogout();
              }}
              title="Đăng xuất"
              className="w-7 h-7 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

export default MainSidebar;
