import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient.js';

const THEMES = {
  ocean:     { '--hi-p': '#2563EB', '--hi-p-cont': '#93C5FD', '--hi-on-p': '#FFFFFF', '--hi-s': '#0891B2', '--hi-t': '#0E7490' },
  morning:   { '--hi-p': '#7C3AED', '--hi-p-cont': '#DDD6FE', '--hi-on-p': '#FFFFFF', '--hi-s': '#9333EA', '--hi-t': '#7E22CE' },
  afternoon: { '--hi-p': '#BE185D', '--hi-p-cont': '#FBCFE8', '--hi-on-p': '#FFFFFF', '--hi-s': '#DB2777', '--hi-t': '#9D174D' },
  night:     { '--hi-p': '#D97706', '--hi-p-cont': '#FDE68A', '--hi-on-p': '#1C1917', '--hi-s': '#B45309', '--hi-t': '#92400E' },
  auto:      null,
};

function applyThemeVars(theme) {
  const vars = THEMES[theme];
  if (!vars) return;
  const root = document.documentElement;
  Object.entries(vars).forEach(([key, val]) => root.style.setProperty(key, val));
}

export function PageSettings() {
  const [userEmail, setUserEmail] = useState('Đang tải...');
  const [currentTheme, setCurrentTheme] = useState('auto');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMsg, setPwMsg] = useState({ text: '', isError: false });
  const [isSubmittingPw, setIsSubmittingPw] = useState(false);

  // Load user email on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email || 'Chưa đăng nhập');
    });
  }, []);

  // Load saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('colour-theme');
    const dark = document.documentElement.classList.contains('dark');
    if (saved) setCurrentTheme(saved);
    setIsDarkMode(dark);
  }, []);

  const handleToggleDarkMode = useCallback(() => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('dark-mode', isDark ? '1' : '0');
    setIsDarkMode(isDark);
  }, []);

  const handleApplyTheme = useCallback((theme) => {
    setCurrentTheme(theme);
    localStorage.setItem('colour-theme', theme);

    if (theme === 'auto') {
      const h = new Date().getHours();
      const autoTheme = h < 4 ? 'ocean' : h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'night';
      applyThemeVars(autoTheme);
      return;
    }
    applyThemeVars(theme);
  }, []);

  const handleChangePassword = useCallback(async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPwMsg({ text: 'Mật khẩu phải có ít nhất 6 ký tự!', isError: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ text: 'Mật khẩu xác nhận không khớp!', isError: true });
      return;
    }
    setIsSubmittingPw(true);
    setPwMsg({ text: '', isError: false });
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPwMsg({ text: 'Đổi mật khẩu thành công! ✅', isError: false });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwMsg({ text: err.message || 'Có lỗi xảy ra, vui lòng thử lại.', isError: true });
    } finally {
      setIsSubmittingPw(false);
    }
  }, [newPassword, confirmPassword]);

  const themeButtonClass = (theme) =>
    `theme-btn flex flex-col items-center gap-2.5 p-3.5 rounded-2xl border-2 hover:border-outline-variant/40 transition-all group bg-surface-container-low cursor-pointer ${
      currentTheme === theme
        ? 'border-primary bg-primary/5'
        : 'border-transparent'
    }`;

  return (
    <>
<div id="page-settings" className="page active">
<main className="lg:ml-64 min-h-screen mobile-page-top lg:pt-8 pb-28 lg:pb-12 px-4 sm:px-6 lg:px-12 flex flex-col">
    <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col gap-6 lg:gap-8 fade-in">
        <header className="flex flex-col gap-1">
            <h1 className="text-2xl lg:text-headline-lg font-bold text-on-surface">Cài đặt</h1>
            <p className="text-xs sm:text-sm text-on-surface-variant">Quản lý tài khoản và tuỳ chỉnh trải nghiệm học tập.</p>
        </header>
        <div className="flex flex-col gap-6 flex-1">

            {/* Giao diện */}
            <section className="glass-card soft-shadow rounded-xl p-6 md:p-8">
                <h2 className="font-headline-md text-xl font-bold text-on-surface mb-6 border-b border-outline-variant/20 pb-4">Giao diện</h2>

                {/* Dark mode toggle */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="font-bold text-on-surface text-base md:text-lg">Chế độ tối (Dark Mode)</h3>
                        <p className="text-on-surface-variant text-sm mt-1">Giảm chói và bảo vệ mắt khi học trong môi trường thiếu sáng.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                        <input type="checkbox" id="darkModeToggle" className="sr-only peer" checked={isDarkMode} onChange={handleToggleDarkMode} />
                        <div className="w-14 h-7 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>

                {/* Theme colour picker */}
                <div>
                    <h3 className="font-bold text-on-surface text-base md:text-lg mb-1">Màu giao diện &amp; Nhịp thời gian</h3>
                    <p className="text-on-surface-variant text-sm mb-5">Hệ màu nghệ thuật Nhật Bản đồng bộ theo nhịp thời gian trong ngày.</p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5" id="theme-picker">

                        {/* Auto by time */}
                        <button onClick={() => handleApplyTheme('auto')}
                                data-theme-btn="auto"
                                className={themeButtonClass('auto')}>
                            <div className="w-12 h-12 rounded-xl shadow-md overflow-hidden flex items-center justify-center bg-primary text-on-primary">
                                <span className="material-symbols-outlined text-2xl">schedule</span>
                            </div>
                            <div className="text-center">
                                <span className="text-xs font-bold text-on-surface block">Tự động</span>
                                <span className="text-[10px] text-on-surface-variant" id="theme-auto-sublabel">Theo giờ máy</span>
                            </div>
                        </button>

                        {/* Ocean (00:00 - 03:59) */}
                        <button onClick={() => handleApplyTheme('ocean')}
                                data-theme-btn="ocean"
                                className={themeButtonClass('ocean')}>
                            <div className="w-12 h-12 rounded-xl shadow-md overflow-hidden grid grid-cols-2 grid-rows-2">
                                <div style={{"background":"#EAF2F9"}}></div>
                                <div style={{"background":"#D3E3F0"}}></div>
                                <div style={{"background":"#54779F"}}></div>
                                <div style={{"background":"#324E78"}}></div>
                            </div>
                            <div className="text-center">
                                <span className="text-xs font-bold text-on-surface block">Biển Đêm</span>
                                <span className="text-[10px] text-on-surface-variant">00:00 – 03:59</span>
                            </div>
                        </button>

                        {/* Morning (Asagiri) */}
                        <button onClick={() => handleApplyTheme('morning')}
                                data-theme-btn="morning"
                                className={themeButtonClass('morning')}>
                            <div className="w-12 h-12 rounded-xl shadow-md overflow-hidden grid grid-cols-2 grid-rows-2">
                                <div style={{"background":"#FBF2E2"}}></div>
                                <div style={{"background":"#F3DDC2"}}></div>
                                <div style={{"background":"#7A6483"}}></div>
                                <div style={{"background":"#463A5E"}}></div>
                            </div>
                            <div className="text-center">
                                <span className="text-xs font-bold text-on-surface block">Sương Mai</span>
                                <span className="text-[10px] text-on-surface-variant">04:00 – 11:59</span>
                            </div>
                        </button>

                        {/* Afternoon (Yuugiri) */}
                        <button onClick={() => handleApplyTheme('afternoon')}
                                data-theme-btn="afternoon"
                                className={themeButtonClass('afternoon')}>
                            <div className="w-12 h-12 rounded-xl shadow-md overflow-hidden grid grid-cols-2 grid-rows-2">
                                <div style={{"background":"#FBE7CD"}}></div>
                                <div style={{"background":"#F5C8A1"}}></div>
                                <div style={{"background":"#B06E80"}}></div>
                                <div style={{"background":"#452F56"}}></div>
                            </div>
                            <div className="text-center">
                                <span className="text-xs font-bold text-on-surface block">Hoàng Hôn</span>
                                <span className="text-[10px] text-on-surface-variant">12:00 – 17:59</span>
                            </div>
                        </button>

                        {/* Night (Sumiyama) */}
                        <button onClick={() => handleApplyTheme('night')}
                                data-theme-btn="night"
                                className={themeButtonClass('night')}>
                            <div className="w-12 h-12 rounded-xl shadow-md overflow-hidden grid grid-cols-2 grid-rows-2">
                                <div style={{"background":"#F8F6F0"}}></div>
                                <div style={{"background":"#EAE5D9"}}></div>
                                <div style={{"background":"#6B6558"}}></div>
                                <div style={{"background":"#3B362E"}}></div>
                            </div>
                            <div className="text-center">
                                <span className="text-xs font-bold text-on-surface block">Sơn Dạ</span>
                                <span className="text-[10px] text-on-surface-variant">18:00 – 23:59</span>
                            </div>
                        </button>

                    </div>
                </div>
            </section>

            {/* Tài khoản & Bảo mật */}
            <section className="glass-card soft-shadow rounded-xl p-6 md:p-8">
                <h2 className="font-headline-md text-xl font-bold text-on-surface mb-6 border-b border-outline-variant/20 pb-4">Tài khoản &amp; Bảo mật</h2>
                
                <div className="space-y-6">
                    <div>
                        <span className="text-xs font-bold text-outline uppercase tracking-wider block mb-1">Email đăng nhập</span>
                        <div className="flex items-center gap-2 font-medium text-sm text-on-surface bg-surface-container-low px-4 py-2.5 rounded-xl border border-outline-variant/20 w-full max-w-md">
                            <span className="material-symbols-outlined text-outline text-lg">mail</span>
                            <span id="settings-user-email">{userEmail}</span>
                        </div>
                    </div>

                    <div className="border-t border-outline-variant/10 pt-4">
                        <h3 className="font-bold text-on-surface text-base mb-1">Thiết lập / Đổi mật khẩu</h3>
                        <p className="text-on-surface-variant text-xs mb-4">
                            Bạn có thể tạo hoặc đổi mật khẩu mới để đăng nhập bằng Email và Mật khẩu (kể cả khi bạn thường đăng nhập bằng Google).
                        </p>

                        <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
                            <div>
                                <label className="block text-xs font-semibold text-on-surface mb-1">Mật khẩu mới (tối thiểu 6 ký tự)</label>
                                <input type="password" id="settings-new-password" required minLength="6" placeholder="••••••••" className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant text-xs bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-on-surface mb-1">Xác nhận mật khẩu mới</label>
                                <input type="password" id="settings-confirm-password" required minLength="6" placeholder="••••••••" className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant text-xs bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                            </div>
                            {pwMsg.text && (
                                <div id="settings-pw-msg" className={`text-xs p-2.5 rounded-xl font-medium ${pwMsg.isError ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
                                    {pwMsg.text}
                                </div>
                            )}
                            <button type="submit" id="btn-settings-pw-submit" disabled={isSubmittingPw} className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed">
                                <span className="material-symbols-outlined text-base">lock</span>
                                {isSubmittingPw ? 'Đang lưu...' : 'Lưu mật khẩu'}
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {/* Pháp lý & Quyền riêng tư (In-Product Privacy Notification) */}
            <section className="glass-card soft-shadow rounded-xl p-6 md:p-8">
                <h2 className="font-headline-md text-xl font-bold text-on-surface mb-3 border-b border-outline-variant/20 pb-3">Pháp lý &amp; Quyền riêng tư (Legal &amp; Privacy)</h2>
                <p className="text-xs sm:text-sm text-on-surface-variant mb-4 leading-relaxed">
                    HiVocab tuân thủ nghiêm ngặt Chính sách Dữ liệu Người dùng của Google. Dữ liệu tài khoản của bạn được bảo mật tuyệt đối, không chia sẻ cho bên thứ ba và không dùng để huấn luyện AI.
                </p>
                <div className="flex flex-wrap gap-3">
                    <a href="/privacy.html" target="_blank" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-xs font-semibold text-primary transition-colors border border-outline-variant/30">
                        <span className="material-symbols-outlined text-[17px]">verified_user</span>
                        Chính sách quyền riêng tư (Privacy Policy) ↗
                    </a>
                    <a href="/terms.html" target="_blank" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-xs font-semibold text-on-surface transition-colors border border-outline-variant/30">
                        <span className="material-symbols-outlined text-[17px]">gavel</span>
                        Điều khoản dịch vụ (Terms of Service) ↗
                    </a>
                </div>
            </section>

        </div>
    </div>
</main>
</div>
    </>
  );
}

export default PageSettings;
