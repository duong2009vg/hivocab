// src/components/layout/MobileProfileDropdown.jsx
// Pixel-Perfect React Mobile Profile Dropdown with useAuth & legacyBridge
import React from 'react';
import { useAuth } from '../../providers/AuthProvider.jsx';
import {
  navigate,
  openPricingModal,
  handleMobileDropdownAuth,
} from '../../legacy/legacyBridge.js';

export function MobileProfileDropdown() {
  const { user } = useAuth();

  const closeDropdown = () => {
    const el = document.getElementById('mobile-profile-dropdown');
    if (el) el.classList.add('hidden');
  };

  const handleProfileClick = () => {
    closeDropdown();
    if (!user) {
      navigate('login');
    }
  };

  const handleUpgrade = () => {
    closeDropdown();
    openPricingModal();
  };

  const handleSettings = () => {
    closeDropdown();
    navigate('settings');
  };

  const handleAuth = () => {
    closeDropdown();
    handleMobileDropdownAuth();
  };

  return (
    <div
      id="mobile-profile-dropdown"
      className="hidden fixed right-4 w-56 bg-surface rounded-2xl shadow-2xl border border-outline-variant/20 z-[9999] overflow-hidden fade-in"
      style={{ top: 'max(calc(env(safe-area-inset-top, 0px) + 20px), 72px)' }}
    >
      <div
        onClick={handleProfileClick}
        className="px-4 py-3 border-b border-outline-variant/15 cursor-pointer hover:bg-surface-container/50 transition-colors"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <div id="mobile-dropdown-name" className="font-bold text-sm text-on-surface truncate">
            {user?.user_metadata?.full_name || user?.user_metadata?.name || 'Hi Learner'}
          </div>
          <span
            id="mobile-profile-pro-badge"
            className="profile-pro-badge hidden shrink-0 items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-md shadow-xs"
          >
            <span className="material-symbols-outlined text-[10px] icon-fill">workspace_premium</span>PRO
          </span>
        </div>
        <div id="mobile-dropdown-email" className="text-xs text-on-surface-variant truncate mt-0.5">
          {user?.email || 'Vui lòng đăng nhập'}
        </div>
      </div>

      <button
        id="mobile-upgrade-pro-btn"
        onClick={handleUpgrade}
        className="btn-upgrade-pro w-full flex items-center justify-between px-4 py-2.5 text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/15 transition-colors font-bold border-b border-outline-variant/15 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-amber-500">diamond</span>
          <span>Nâng cấp PRO</span>
        </div>
        <span className="material-symbols-outlined text-[14px] text-amber-500/70">arrow_forward</span>
      </button>

      <button
        onClick={handleSettings}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-on-surface hover:bg-surface-container dark:hover:bg-[#25292F] transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">settings</span>
        <span>Cài đặt</span>
      </button>

      <button
        id="mobile-dropdown-auth-btn"
        onClick={handleAuth}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-primary hover:bg-primary/10 transition-colors border-t border-outline-variant/15 cursor-pointer font-semibold"
      >
        <span className="material-symbols-outlined text-[18px]">login</span>
        <span>{user ? 'Đăng xuất' : 'Đăng nhập'}</span>
      </button>
    </div>
  );
}

export default MobileProfileDropdown;
