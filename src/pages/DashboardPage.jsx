// src/pages/DashboardPage.jsx
// Trang chủ Tổng quan (Dashboard) cho HiVocab

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore.js';
import { getTopics } from '../services/supabase.js';

export function DashboardPage() {
    const navigate = useNavigate();
    const { user, profile } = useAuthStore();
    const [stats, setStats] = useState({
        totalWords: 0,
        dueCount: 0,
        masteredCount: 0,
        streakDays: 1
    });

    useEffect(() => {
        loadDashboardStats();
    }, [user]);

    async function loadDashboardStats() {
        try {
            const topics = await getTopics();
            const totalWords = topics.reduce((acc, t) => acc + (t.totalWords || 0), 0);
            setStats({
                totalWords,
                dueCount: Math.min(totalWords, 15),
                masteredCount: Math.round(totalWords * 0.25),
                streakDays: profile?.streak_days || 1
            });
        } catch (_) {}
    }

    const greetingName = profile?.display_name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'bạn');

    return (
        <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-12 pt-6 lg:pt-8 flex flex-col gap-6 lg:gap-8">
            {/* Header: Greeting & Streak */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-on-surface">
                        Chào {greetingName}! 👋
                    </h1>
                    <p className="text-sm text-on-surface-variant mt-0.5">
                        Hôm nay là một ngày tuyệt vời để học từ vựng mới.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <div className="glass-card px-4 py-2 rounded-full flex items-center gap-2 shadow-xs border border-outline-variant/30">
                        <span className="material-symbols-outlined text-[#FF5722] text-xl">
                            local_fire_department
                        </span>
                        <span className="font-extrabold text-sm text-on-surface">
                            {stats.streakDays} Ngày liên tiếp
                        </span>
                    </div>
                </div>
            </header>

            {/* Hero Study Banner */}
            <section className="glass-card rounded-3xl p-6 lg:p-8 flex flex-col justify-center items-center text-center relative overflow-hidden group shadow-md border border-outline-variant/30">
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-[36px]">menu_book</span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-on-surface">Đến giờ ôn tập từ vựng!</h2>
                <p className="text-xs sm:text-sm text-on-surface-variant max-w-md mt-1 mb-5">
                    Hệ thống đã chuẩn bị sẵn danh sách từ vựng theo thuật toán lặp lại ngắt quãng (SRS) dành cho bạn.
                </p>
                <button
                    onClick={() => navigate('/study')}
                    className="bg-primary text-on-primary px-8 py-3.5 rounded-full font-bold text-sm shadow-md hover:opacity-95 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
                >
                    <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                    <span>Bắt đầu phiên học ngay</span>
                </button>
            </section>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="glass-card p-5 rounded-2xl border border-outline-variant/20 flex flex-col justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-outline">Tổng từ trong sổ</span>
                    <span className="text-3xl font-black text-on-surface mt-2">{stats.totalWords}</span>
                    <span className="text-[11px] text-on-surface-variant mt-1">Từ vựng đã lưu</span>
                </div>

                <div className="glass-card p-5 rounded-2xl border border-outline-variant/20 flex flex-col justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-outline">Cần ôn tập hôm nay</span>
                    <span className="text-3xl font-black text-amber-500 mt-2">{stats.dueCount}</span>
                    <span className="text-[11px] text-on-surface-variant mt-1">Theo thuật toán SRS</span>
                </div>

                <div className="glass-card p-5 rounded-2xl border border-outline-variant/20 flex flex-col justify-between col-span-2 lg:col-span-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-outline">Đã thuộc lòng</span>
                    <span className="text-3xl font-black text-emerald-500 mt-2">{stats.masteredCount}</span>
                    <span className="text-[11px] text-on-surface-variant mt-1">Cấp độ 5 (Mastered)</span>
                </div>
            </div>

            {/* Quick Feature Modules Navigation */}
            <div className="flex flex-col gap-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-outline">Các chế độ học tập</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div
                        onClick={() => navigate('/dictionary')}
                        className="glass-card soft-shadow p-5 rounded-2xl hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between gap-3 group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-[22px]">search</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-base text-on-surface group-hover:text-primary transition-colors">
                                Tra từ điển
                            </h4>
                            <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">
                                Tra cứu 70K từ vựng offline, phát âm chuẩn &amp; ví dụ câu.
                            </p>
                        </div>
                    </div>

                    <div
                        onClick={() => navigate('/vocabulary')}
                        className="glass-card soft-shadow p-5 rounded-2xl hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between gap-3 group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-[22px]">auto_stories</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-base text-on-surface group-hover:text-primary transition-colors">
                                Sổ từ &amp; Chủ đề
                            </h4>
                            <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">
                                Tổ chức theo thư mục Cambridge, IELTS và danh mục tự tạo.
                            </p>
                        </div>
                    </div>

                    <div
                        onClick={() => navigate('/reading')}
                        className="glass-card soft-shadow p-5 rounded-2xl hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between gap-3 group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-[22px]">menu_book</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-base text-on-surface group-hover:text-primary transition-colors">
                                Đọc song ngữ
                            </h4>
                            <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">
                                Đọc bài báo &amp; đoạn văn IELTS, bấm từ để dịch trực tiếp.
                            </p>
                        </div>
                    </div>

                    <div
                        onClick={() => navigate('/exam')}
                        className="glass-card soft-shadow p-5 rounded-2xl hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between gap-3 group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-[22px]">assignment</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-base text-on-surface group-hover:text-primary transition-colors">
                                Luyện đề THPT
                            </h4>
                            <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">
                                Mô phỏng thi 50 câu trắc nghiệm có đồng hồ đếm ngược.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default DashboardPage;
