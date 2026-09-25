// src/components/layout/BottomNav.jsx
// Mobile Liquid Glass Floating Dock for HiVocab

import React from 'react';
import { NavLink } from 'react-router-dom';

export function BottomNav() {
    const dockItems = [
        { to: '/', label: 'Trang chủ', icon: 'home' },
        { to: '/dictionary', label: 'Tra từ', icon: 'search' },
        { to: '/vocabulary', label: 'Sổ từ', icon: 'auto_stories' },
        { to: '/study', label: 'Luyện tập', icon: 'school' },
        { to: '/pricing', label: 'PRO', icon: 'diamond' },
    ];

    return (
        <nav
            id="mobile-bottom-nav"
            className="lg:hidden mobile-floating-dock fixed bottom-[max(8px,calc(env(safe-area-inset-bottom,0px)-16px))] left-1/2 -translate-x-1/2 z-50 w-[calc(100%-24px)] max-w-[420px] h-[54px] rounded-full flex items-center justify-around px-1.5 shadow-xl select-none"
        >
            {dockItems.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                        `dock-nav-item flex-1 flex flex-col items-center justify-center h-full py-1 px-1 rounded-full cursor-pointer transition-all ${
                            isActive
                                ? 'text-primary font-bold scale-105'
                                : 'text-on-surface-variant/75 hover:text-on-surface'
                        }`
                    }
                >
                    <span className="material-symbols-outlined dock-icon text-[21px] leading-none">
                        {item.icon}
                    </span>
                    <span className="dock-label text-[10px] font-semibold leading-tight mt-1 whitespace-nowrap">
                        {item.label}
                    </span>
                </NavLink>
            ))}
        </nav>
    );
}

export default BottomNav;
