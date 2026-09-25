// src/components/layout/Sidebar.jsx
// Desktop Navigation Sidebar for HiVocab

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import { useThemeStore } from '../../stores/themeStore.js';

export function Sidebar() {
    const navigate = useNavigate();
    const { user, profile, isPro, signOut } = useAuthStore();
    const { isDark, toggleTheme } = useThemeStore();

    const navItems = [
        { to: '/', label: 'Trang chủ', icon: 'home' },
        { to: '/dictionary', label: 'Từ điển', icon: 'search' },
        { to: '/vocabulary', label: 'Sổ từ vựng', icon: 'auto_stories' },
        { to: '/study', label: 'Luyện tập', icon: 'school' },
        { to: '/reading', label: 'Đọc song ngữ', icon: 'menu_book' },
        { to: '/exam', label: 'Luyện đề THPT', icon: 'assignment' },
    ];

    const displayName = profile?.display_name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Hi Learner');
    const displayEmail = user?.email || 'Nhấn để đăng nhập';
    const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null;

    return (
        <aside className="hidden lg:flex flex-col h-screen fixed left-0 top-0 w-64 p-5 bg-surface/85 backdrop-blur-2xl border-r border-outline-variant/30 z-50 transition-colors select-none">
            {/* Header: Logo & Profile */}
            <div className="mb-5 shrink-0">
                <NavLink to="/" className="inline-flex items-center gap-2.5 cursor-pointer">
                    <img className="h-8 w-auto" src="/logo-mark.svg" alt="HiVocab" />
                    <span className="font-extrabold text-xl tracking-tight text-on-surface">HiVocab</span>
                </NavLink>

                {/* Profile Card */}
                <div
                    onClick={() => {
                        if (!user) navigate('/pricing');
                    }}
                    className="mt-3.5 flex items-center gap-3 p-2 rounded-2xl hover:bg-surface-container dark:hover:bg-[#25292F] transition-all duration-200 cursor-pointer border border-transparent hover:border-outline-variant/20"
                >
                    <div className="w-10 h-10 rounded-full bg-surface-container-high dark:bg-[#25292F] flex items-center justify-center overflow-hidden bg-cover bg-center ring-1 ring-outline-variant/30 shrink-0">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                        ) : (
                            <span className="material-symbols-outlined text-outline text-[20px]">person</span>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-bold text-[13px] text-on-surface truncate">{displayName}</span>
                            {isPro && (
                                <span className="shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-md shadow-xs">
                                    PRO
                                </span>
                            )}
                        </div>
                        <div className="text-on-surface-variant text-[11px] truncate font-medium">{displayEmail}</div>
                    </div>
                </div>
            </div>

            {/* Quick Study CTA Button */}
            <button
                onClick={() => navigate('/study')}
                className="mb-4 shrink-0 w-full py-2.5 px-4 bg-primary text-on-primary rounded-xl font-semibold text-[13px] tracking-tight transition-all duration-200 active:scale-[0.98] shadow-sm hover:opacity-95 flex items-center justify-center gap-2 cursor-pointer"
            >
                <span className="material-symbols-outlined text-[18px]">play_circle</span>
                <span>Bắt đầu ôn tập</span>
            </button>

            {/* Navigation List */}
            <nav className="flex flex-col gap-1 flex-1 overflow-y-auto pr-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3.5 h-10 rounded-xl transition-all duration-150 text-[13.5px] font-medium cursor-pointer ${
                                isActive
                                    ? 'bg-primary/10 text-primary font-bold shadow-xs'
                                    : 'text-on-surface-variant hover:bg-surface-container/70 dark:hover:bg-[#25292F] hover:text-on-surface'
                            }`
                        }
                    >
                        <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer: Theme, Upgrade PRO, Logout */}
            <div className="mt-auto shrink-0 flex flex-col gap-1 pt-3 border-t border-outline-variant/20 dark:border-[#31353A]">
                {!isPro && (
                    <NavLink
                        to="/pricing"
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 bg-amber-500/10 hover:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 cursor-pointer text-xs font-bold mb-1.5 group"
                    >
                        <div className="flex items-center gap-2 truncate">
                            <span className="material-symbols-outlined text-[16px] text-amber-500 icon-fill group-hover:scale-110 transition-transform">diamond</span>
                            <span className="truncate">Nâng cấp PRO</span>
                        </div>
                        <span className="material-symbols-outlined text-[14px] text-amber-500/70 group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                    </NavLink>
                )}

                {/* Dark/Light mode toggle */}
                <button
                    onClick={toggleTheme}
                    className="flex items-center justify-between px-3.5 h-9 rounded-xl transition-all duration-150 text-on-surface-variant hover:bg-surface-container/70 dark:hover:bg-[#25292F] hover:text-on-surface text-[13px] font-medium cursor-pointer"
                >
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[19px]">
                            {isDark ? 'light_mode' : 'dark_mode'}
                        </span>
                        <span>{isDark ? 'Giao diện sáng' : 'Giao diện tối'}</span>
                    </div>
                </button>

                {user && (
                    <button
                        onClick={signOut}
                        className="flex items-center gap-3 px-3.5 h-9 rounded-xl transition-all duration-150 text-on-surface-variant hover:bg-rose-500/10 hover:text-rose-600 text-[13px] font-medium cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[19px]">logout</span>
                        <span>Đăng xuất</span>
                    </button>
                )}
            </div>
        </aside>
    );
}

export default Sidebar;
