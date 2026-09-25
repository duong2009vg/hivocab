// src/stores/themeStore.js
// Zustand Store quản lý Dark / Light Theme

import { create } from 'zustand';

function getInitialTheme() {
    if (typeof window === 'undefined') return false;
    try {
        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'dark';
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (_) {
        return false;
    }
}

export const useThemeStore = create((set) => ({
    isDark: getInitialTheme(),

    initTheme: () => {
        const isDark = getInitialTheme();
        if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', isDark);
        }
        set({ isDark });
    },

    toggleTheme: () => {
        set((state) => {
            const next = !state.isDark;
            if (typeof document !== 'undefined') {
                document.documentElement.classList.toggle('dark', next);
            }
            try {
                localStorage.setItem('theme', next ? 'dark' : 'light');
            } catch (_) {}
            return { isDark: next };
        });
    }
}));
