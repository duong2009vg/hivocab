// Generated 1:1 Pixel-Perfect Component: MainSidebar
import React from 'react';

export function MainSidebar() {
  return (
    <>
<nav id="main-sidebar" className="hidden lg:flex flex-col h-screen fixed left-0 top-0 w-64 p-5 bg-surface/85 backdrop-blur-2xl border-r border-outline-variant/30 z-50 transition-colors" style={{"display":"none"}}>
    <div className="mb-5 shrink-0">
        <a onClick={(event) => { try { (function(event){ window.navigateTo('dashboard') }).call(this, event); } catch(e){ console.error(e); } }} className="inline-flex cursor-pointer" aria-label="Hi - Trang chu"><img className="brand-logo" src="logo-mark.svg" alt="Hi"/></a>
        <div onClick={(event) => { try { (function(event){ window.handleProfileClick() }).call(this, event); } catch(e){ console.error(e); } }} title="Đăng nhập / Hồ sơ cá nhân" className="mt-3.5 flex items-center gap-3 p-2 rounded-2xl hover:bg-surface-container dark:hover:bg-[#25292F] transition-all duration-200 cursor-pointer border border-transparent hover:border-outline-variant/20">
            <div id="profile-avatar-container" className="w-10 h-10 rounded-full bg-surface-container-high dark:bg-[#25292F] flex items-center justify-center overflow-hidden bg-cover bg-center ring-1 ring-outline-variant/30 shrink-0"><span className="material-symbols-outlined text-outline text-[20px]">person</span></div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                    <div id="profile-name" className="font-bold text-[13px] text-on-surface truncate">Hi Learner</div>
                    <span id="profile-pro-badge" className="profile-pro-badge hidden shrink-0 items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-md shadow-xs">
                        <span className="material-symbols-outlined text-[10px] icon-fill">workspace_premium</span>PRO
                    </span>
                </div>
                <div id="profile-email" className="text-on-surface-variant text-[11px] truncate font-medium">Nhấn để đăng nhập</div>
            </div>
        </div>
    </div>
    <button onClick={(event) => { try { (function(event){ startSession() }).call(this, event); } catch(e){ console.error(e); } }} className="mb-4 shrink-0 w-full py-2.5 px-4 bg-primary text-on-primary rounded-xl font-semibold text-[13px] tracking-tight transition-all duration-200 active:scale-[0.98] shadow-sm hover:opacity-95 flex items-center justify-center gap-2 cursor-pointer">
        <span className="material-symbols-outlined text-[18px]">play_circle</span>
        <span>Bắt đầu ôn tập</span>
    </button>
    <div className="flex flex-col gap-1 flex-1 overflow-y-auto pr-1 select-none">
        <a onClick={(event) => { try { (function(event){ window.navigateTo('dashboard') }).call(this, event); } catch(e){ console.error(e); } }} id="nav-desktop-dashboard" className="sidebar-item flex items-center gap-3 px-3.5 h-10 rounded-xl transition-all duration-150 text-on-surface-variant hover:bg-surface-container/70 dark:hover:bg-[#25292F] hover:text-on-surface text-[13.5px] font-medium cursor-pointer"><span className="material-symbols-outlined text-[20px]">home</span><span>Trang chủ</span></a>
        <a onClick={(event) => { try { (function(event){ navigateTo('topics') }).call(this, event); } catch(e){ console.error(e); } }} id="nav-desktop-topics" className="sidebar-item flex items-center gap-3 px-3.5 h-10 rounded-xl transition-all duration-150 text-on-surface-variant hover:bg-surface-container/70 dark:hover:bg-[#25292F] hover:text-on-surface text-[13.5px] font-medium cursor-pointer"><span className="material-symbols-outlined text-[20px]">grid_view</span><span>Chủ đề</span></a>
        <a onClick={(event) => { try { (function(event){ navigateTo('library') }).call(this, event); } catch(e){ console.error(e); } }} id="nav-desktop-library" className="sidebar-item flex items-center gap-3 px-3.5 h-10 rounded-xl transition-all duration-150 text-on-surface-variant hover:bg-surface-container/70 dark:hover:bg-[#25292F] hover:text-on-surface text-[13.5px] font-medium cursor-pointer"><span className="material-symbols-outlined text-[20px]">explore</span><span>Thư viện</span></a>
        <a onClick={(event) => { try { (function(event){ navigateTo('vocabulary') }).call(this, event); } catch(e){ console.error(e); } }} id="nav-desktop-vocabulary" className="sidebar-item flex items-center gap-3 px-3.5 h-10 rounded-xl transition-all duration-150 text-on-surface-variant hover:bg-surface-container/70 dark:hover:bg-[#25292F] hover:text-on-surface text-[13.5px] font-medium cursor-pointer"><span className="material-symbols-outlined text-[20px]">auto_stories</span><span>Kho từ vựng</span></a>
        <a onClick={(event) => { try { (function(event){ navigateTo('exercises') }).call(this, event); } catch(e){ console.error(e); } }} id="nav-desktop-exercises" className="sidebar-item flex items-center gap-3 px-3.5 h-10 rounded-xl transition-all duration-150 text-on-surface-variant hover:bg-surface-container/70 dark:hover:bg-[#25292F] hover:text-on-surface text-[13.5px] font-medium cursor-pointer"><span className="material-symbols-outlined text-[20px]">school</span><span>Luyện Đề THPT</span></a>
        <a onClick={(event) => { try { (function(event){ navigateTo('dictionary') }).call(this, event); } catch(e){ console.error(e); } }} id="nav-desktop-dictionary" className="sidebar-item flex items-center gap-3 px-3.5 h-10 rounded-xl transition-all duration-150 text-on-surface-variant hover:bg-surface-container/70 dark:hover:bg-[#25292F] hover:text-on-surface text-[13.5px] font-medium cursor-pointer"><span className="material-symbols-outlined text-[20px]">search</span><span>Tra từ</span></a>
    </div>
    <div className="mt-auto shrink-0 flex flex-col gap-1 pt-3 border-t border-outline-variant/20 dark:border-[#31353A]">
        <button id="sidebar-upgrade-pro-btn" onClick={(event) => { try { (function(event){ window.openPricingModal() }).call(this, event); } catch(e){ console.error(e); } }} className="btn-upgrade-pro w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 bg-amber-500/10 hover:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 cursor-pointer text-xs font-bold mb-1.5 group">
            <div className="flex items-center gap-2 truncate">
                <span className="material-symbols-outlined text-[16px] text-amber-500 icon-fill group-hover:scale-110 transition-transform">diamond</span>
                <span className="truncate">Nâng cấp PRO</span>
            </div>
            <span className="material-symbols-outlined text-[14px] text-amber-500/70 group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
        </button>
        <a onClick={(event) => { try { (function(event){ navigateTo('settings') }).call(this, event); } catch(e){ console.error(e); } }} id="nav-desktop-settings" className="sidebar-item flex items-center gap-3 px-3.5 h-9 rounded-xl transition-all duration-150 text-on-surface-variant hover:bg-surface-container/70 dark:hover:bg-[#25292F] hover:text-on-surface text-[13.5px] font-medium cursor-pointer"><span className="material-symbols-outlined text-[19px]">settings</span><span>Cài đặt</span></a>
        <a onClick={(event) => { try { (function(event){ window.handleLogout() }).call(this, event); } catch(e){ console.error(e); } }} className="flex items-center gap-3 px-3.5 h-9 rounded-xl transition-all duration-150 text-on-surface-variant hover:bg-surface-container/70 dark:hover:bg-[#25292F] hover:text-error text-[13.5px] font-medium cursor-pointer"><span className="material-symbols-outlined text-[19px]">logout</span><span>Đăng xuất</span></a>
    </div>
</nav>
    </>
  );
}

export default MainSidebar;
