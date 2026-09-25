// Generated 1:1 Pixel-Perfect Component: MobileProfileDropdown
import React from 'react';

export function MobileProfileDropdown() {
  return (
    <>
{/* Standalone Mobile Profile Dropdown */}
<div id="mobile-profile-dropdown" className="hidden fixed right-4 w-56 bg-surface rounded-2xl shadow-2xl border border-outline-variant/20 z-[9999] overflow-hidden fade-in" style={{"top":"max(calc(env(safe-area-inset-top, 0px) + 20px), 72px)"}}>
    <div onClick={(event) => { try { (function(event){ if(!window.HiDB?.currentUser){window.navigateTo('login');document.getElementById('mobile-profile-dropdown')?.classList.add('hidden')} }).call(this, event); } catch(e){ console.error(e); } }} className="px-4 py-3 border-b border-outline-variant/15 cursor-pointer hover:bg-surface-container/50 transition-colors">
        <div className="flex items-center gap-1.5 min-w-0">
            <div id="mobile-dropdown-name" className="font-bold text-sm text-on-surface truncate">Hi Learner</div>
            <span id="mobile-profile-pro-badge" className="profile-pro-badge hidden shrink-0 items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-md shadow-xs">
                <span className="material-symbols-outlined text-[10px] icon-fill">workspace_premium</span>PRO
            </span>
        </div>
        <div id="mobile-dropdown-email" className="text-xs text-on-surface-variant truncate mt-0.5">Vui lòng đăng nhập</div>
    </div>
    <button id="mobile-upgrade-pro-btn" onClick={(event) => { try { (function(event){ window.openPricingModal(); document.getElementById('mobile-profile-dropdown')?.classList.add('hidden') }).call(this, event); } catch(e){ console.error(e); } }} className="btn-upgrade-pro w-full flex items-center justify-between px-4 py-2.5 text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/15 transition-colors font-bold border-b border-outline-variant/15 cursor-pointer">
        <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-amber-500">diamond</span><span>Nâng cấp PRO</span>
        </div>
        <span className="material-symbols-outlined text-[14px] text-amber-500/70">arrow_forward</span>
    </button>
    <button onClick={(event) => { try { (function(event){ navigateTo('settings'); document.getElementById('mobile-profile-dropdown')?.classList.add('hidden') }).call(this, event); } catch(e){ console.error(e); } }} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-on-surface hover:bg-surface-container dark:hover:bg-[#25292F] transition-colors cursor-pointer">
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">settings</span>Cài đặt
    </button>
    <button id="mobile-dropdown-auth-btn" onClick={(event) => { try { (function(event){ window.handleMobileDropdownAuth() }).call(this, event); } catch(e){ console.error(e); } }} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-primary hover:bg-primary/10 transition-colors border-t border-outline-variant/15 cursor-pointer font-semibold">
        <span className="material-symbols-outlined text-[18px]">login</span><span>Đăng xuất</span>
    </button>
</div>
    </>
  );
}

export default MobileProfileDropdown;
