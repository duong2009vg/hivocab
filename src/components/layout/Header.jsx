// src/components/layout/Header.jsx
// Header thanh điều hướng trên cùng cho cả Desktop và Mobile

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Moon, Sun, Flame, Sparkles, User, LogIn } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore.js';
import { useThemeStore } from '../../stores/themeStore.js';

export function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, profile } = useAuthStore();
    const { theme, toggleTheme } = useThemeStore();

    // Lấy tiêu đề trang dựa trên path
    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/') return 'Tổng quan học tập';
        if (path.startsWith('/dictionary')) return 'Từ điển thông minh';
        if (path.startsWith('/vocabulary')) return 'Sổ từ vựng';
        if (path.startsWith('/study')) return 'Luyện tập Flashcard';
        if (path.startsWith('/reading')) return 'Đọc hiểu Song ngữ';
        if (path.startsWith('/exam')) return 'Thi thử THPT Quốc Gia';
        if (path.startsWith('/pricing')) return 'Gói VIP Premium';
        return 'HiVocab';
    };

    return (
        <header className="sticky top-0 z-30 w-full bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 px-4 sm:px-6 py-3 transition-colors">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                {/* Tiêu đề & Breadcrumb */}
                <div className="flex items-center gap-3">
                    <div className="lg:hidden flex items-center gap-2 font-black text-lg text-primary">
                        <div className="w-8 h-8 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold text-sm shadow-sm">
                            HI
                        </div>
                    </div>
                    <div>
                        <h1 className="text-base sm:text-lg font-bold text-on-surface tracking-tight leading-none">
                            {getPageTitle()}
                        </h1>
                        <p className="text-xs text-on-surface-variant hidden sm:block mt-0.5">
                            Nền tảng làm chủ từ vựng tiếng Anh ứng dụng AI
                        </p>
                    </div>
                </div>

                {/* Các công cụ & Trạng thái người dùng */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Quick Search trigger */}
                    {location.pathname !== '/dictionary' && (
                        <button
                            onClick={() => navigate('/dictionary')}
                            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant text-xs font-medium border border-outline-variant/30 transition-all cursor-pointer"
                        >
                            <Search className="w-3.5 h-3.5" />
                            <span>Tra từ nhanh...</span>
                            <kbd className="px-1.5 py-0.5 text-[10px] bg-surface-container-highest rounded border border-outline-variant/50 font-mono">
                                ⌘K
                            </kbd>
                        </button>
                    )}

                    {/* Streak badge */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold">
                        <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                        <span>3 ngày</span>
                    </div>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        title={theme === 'dark' ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer border border-outline-variant/30"
                    >
                        {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
                    </button>

                    {/* VIP badge or Upgrade */}
                    <button
                        onClick={() => navigate('/pricing')}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-bold transition-all cursor-pointer"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Nâng cấp VIP</span>
                    </button>

                    {/* User profile avatar / Login */}
                    {user ? (
                        <div className="flex items-center gap-2 pl-1">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs uppercase">
                                {profile?.display_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => navigate('/pricing')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                        >
                            <LogIn className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Đăng nhập</span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;
