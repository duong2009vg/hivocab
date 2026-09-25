// src/pages/DashboardPage.jsx
// Trang chủ Tổng quan (Dashboard) cho HiVocab với thống kê SRS thời gian thực

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore.js';
import { getDashboardStats } from '../services/supabase.js';
import { Flame, Play, BookOpen, Brain, Sparkles, Award, ArrowRight, Layers } from 'lucide-react';

export function DashboardPage() {
    const navigate = useNavigate();
    const { user, profile } = useAuthStore();
    const [stats, setStats] = useState({
        totalWords: 0,
        dueToday: 0,
        streak: 3,
        retentionRate: 94,
        memoryLevels: { lv0: 0, lv1: 0, lv2: 0, lv3: 0, lv4: 0, lv5: 0 }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, [user]);

    async function loadStats() {
        setLoading(true);
        try {
            const data = await getDashboardStats();
            setStats(data);
        } catch (_) {}
        finally {
            setLoading(false);
        }
    }

    const greetingName = profile?.display_name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'bạn');

    return (
        <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6 lg:gap-8">
            {/* Header: Greeting & Streak */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
                        Chào {greetingName}! 👋
                    </h1>
                    <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                        Hôm nay là thời điểm lý tưởng để củng cố trí nhớ dài hạn.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-2 shadow-xs">
                        <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
                        <span className="font-extrabold text-sm text-on-surface">
                            {stats.streak} Ngày liên tiếp
                        </span>
                    </div>
                </div>
            </header>

            {/* Hero Study Banner */}
            <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-surface-container-lowest border border-primary/20 rounded-3xl p-6 sm:p-8 flex flex-col justify-center items-center text-center relative overflow-hidden shadow-xs">
                <div className="w-16 h-16 rounded-3xl bg-primary text-on-primary flex items-center justify-center mb-3 shadow-md">
                    <Brain className="w-8 h-8" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-on-surface tracking-tight">
                    {stats.dueToday > 0 ? `Có ${stats.dueToday} từ vựng cần ôn tập hôm nay!` : 'Tuyệt vời! Bạn đã hoàn thành các từ cần ôn'}
                </h2>
                <p className="text-xs sm:text-sm text-on-surface-variant max-w-md mt-1 mb-6 leading-relaxed">
                    Hệ thống đã tính toán chính xác chu kỳ quên lãng (SM-2) để giúp bạn ôn lại đúng thời điểm vàng.
                </p>
                <button
                    onClick={() => navigate('/study')}
                    className="bg-primary text-on-primary px-8 py-3.5 rounded-2xl font-bold text-sm shadow-md hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
                >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Bắt đầu phiên học Flashcard ngay</span>
                </button>
            </section>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-3xl border border-outline-variant/30 flex flex-col justify-between shadow-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Tổng từ trong sổ</span>
                    <span className="text-3xl sm:text-4xl font-black text-on-surface mt-2">{stats.totalWords}</span>
                    <span className="text-[11px] text-on-surface-variant mt-1">Từ vựng đã lưu trữ</span>
                </div>

                <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-3xl border border-outline-variant/30 flex flex-col justify-between shadow-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Đến hạn ôn hôm nay</span>
                    <span className="text-3xl sm:text-4xl font-black text-amber-500 mt-2">{stats.dueToday}</span>
                    <span className="text-[11px] text-on-surface-variant mt-1">Thuật toán SM-2</span>
                </div>

                <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-3xl border border-outline-variant/30 flex flex-col justify-between shadow-xs col-span-2 lg:col-span-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Khắc sâu (Cấp 5)</span>
                    <span className="text-3xl sm:text-4xl font-black text-cyan-500 mt-2">{stats.memoryLevels?.lv5 || 0}</span>
                    <span className="text-[11px] text-on-surface-variant mt-1">Trí nhớ dài hạn</span>
                </div>
            </div>

            {/* Memory Levels Distribution Bar */}
            <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-3xl border border-outline-variant/30 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-primary" />
                        <h3 className="font-bold text-sm text-on-surface">Phân bố 5 cấp độ ghi nhớ</h3>
                    </div>
                    <span className="text-xs text-on-surface-variant font-medium">
                        Tỷ lệ giữ chữ: <strong className="text-emerald-500 font-bold">{stats.retentionRate}%</strong>
                    </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1">
                    <div className="p-3 rounded-2xl bg-slate-500/10 border border-slate-500/20 text-center">
                        <span className="text-[10px] font-bold text-slate-500 block">Chưa học</span>
                        <span className="text-lg font-black text-on-surface">{stats.memoryLevels?.lv0 || 0}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
                        <span className="text-[10px] font-bold text-rose-500 block">Cấp 1</span>
                        <span className="text-lg font-black text-on-surface">{stats.memoryLevels?.lv1 || 0}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                        <span className="text-[10px] font-bold text-amber-500 block">Cấp 2</span>
                        <span className="text-lg font-black text-on-surface">{stats.memoryLevels?.lv2 || 0}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-center">
                        <span className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400 block">Cấp 3</span>
                        <span className="text-lg font-black text-on-surface">{stats.memoryLevels?.lv3 || 0}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                        <span className="text-[10px] font-bold text-emerald-500 block">Cấp 4</span>
                        <span className="text-lg font-black text-on-surface">{stats.memoryLevels?.lv4 || 0}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-center">
                        <span className="text-[10px] font-bold text-cyan-500 block">Cấp 5</span>
                        <span className="text-lg font-black text-on-surface">{stats.memoryLevels?.lv5 || 0}</span>
                    </div>
                </div>
            </div>

            {/* Quick Access Navigation Modes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                    onClick={() => navigate('/vocabulary')}
                    className="p-5 rounded-3xl bg-surface-container-high/40 hover:bg-surface-container-high border border-outline-variant/20 hover:border-primary/30 transition-all cursor-pointer space-y-2 group shadow-xs"
                >
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-base text-on-surface group-hover:text-primary transition-colors">Sổ từ vựng</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">Quản lý và phân loại theo chủ đề Cambridge & Oxford</p>
                </div>

                <div
                    onClick={() => navigate('/reading')}
                    className="p-5 rounded-3xl bg-surface-container-high/40 hover:bg-surface-container-high border border-outline-variant/20 hover:border-primary/30 transition-all cursor-pointer space-y-2 group shadow-xs"
                >
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-base text-on-surface group-hover:text-emerald-500 transition-colors">Đọc song ngữ</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">Chế độ Active Reading tra từ trực tiếp trên bài đọc</p>
                </div>

                <div
                    onClick={() => navigate('/exam')}
                    className="p-5 rounded-3xl bg-surface-container-high/40 hover:bg-surface-container-high border border-outline-variant/20 hover:border-primary/30 transition-all cursor-pointer space-y-2 group shadow-xs"
                >
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Award className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-base text-on-surface group-hover:text-purple-500 transition-colors">Thi THPT QG</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">Phòng thi đếm ngược 50 phút & tự động chấm điểm</p>
                </div>
            </div>
        </main>
    );
}

export default DashboardPage;
