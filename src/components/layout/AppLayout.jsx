// src/components/layout/AppLayout.jsx
// Main application layout with Sidebar and Mobile Dock

import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import BottomNav from './BottomNav.jsx';
import { useAuthStore } from '../../stores/authStore.js';
import { useThemeStore } from '../../stores/themeStore.js';

export function AppLayout() {
    const { initialize } = useAuthStore();
    const { initTheme } = useThemeStore();

    useEffect(() => {
        initTheme();
        initialize();
    }, [initTheme, initialize]);

    return (
        <div className="min-h-screen bg-background text-on-background font-sans antialiased transition-colors duration-300">
            {/* Desktop Left Sidebar */}
            <Sidebar />

            {/* Mobile Bottom Dock */}
            <BottomNav />

            {/* Main Content Area */}
            <div className="lg:ml-64 min-h-screen flex flex-col pb-24 lg:pb-8">
                <Outlet />
            </div>
        </div>
    );
}

export default AppLayout;
