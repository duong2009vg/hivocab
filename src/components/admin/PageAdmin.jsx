// src/components/admin/PageAdmin.jsx
// HiVocab Studio Master Admin Dashboard Shell (Option A: Modern Studio Sidebar Layout)
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { checkIsPro } from '../../providers/AuthProvider.jsx';
import AdminProtectedRoute from '../common/AdminProtectedRoute.jsx';
import AdminSidebar from './AdminSidebar.jsx';
import AdminHeader from './AdminHeader.jsx';

// Tab Components
import AdminOverviewTab from './tabs/AdminOverviewTab.jsx';
import AdminOrdersTab from './tabs/AdminOrdersTab.jsx';
import AdminSubscriptionsTab from './tabs/AdminSubscriptionsTab.jsx';
import AdminContentGatingTab from './tabs/AdminContentGatingTab.jsx';
import AdminUsersTab from './tabs/AdminUsersTab.jsx';
import AdminThptTab from './tabs/AdminThptTab.jsx';
import AdminReadingTab from './tabs/AdminReadingTab.jsx';
import AdminWordsTab from './tabs/AdminWordsTab.jsx';
import AdminBulkImportTab from './tabs/AdminBulkImportTab.jsx';
import AdminReportsTab from './tabs/AdminReportsTab.jsx';
import AdminSystemTab from './tabs/AdminSystemTab.jsx';

const TAB_TITLES = {
  overview: 'Tổng quan Studio',
  orders: 'Doanh thu & Đơn hàng PayOS',
  subscriptions: 'Hội viên & Cấp tặng Gói PRO',
  gating: 'Khóa Học liệu PRO / Miễn phí',
  thpt: 'Ngân hàng Đề thi THPT Quốc Gia',
  reading: 'Bài đọc Song ngữ Cambridge IELTS',
  words: 'Cơ sở Dữ liệu 66k Từ vựng',
  import: 'Nhập Từ vựng Hàng loạt CSV/JSON',
  users: 'Quản lý Tài khoản & Phân quyền',
  reports: 'Báo cáo Lỗi & Phản hồi Học viên',
  system: 'Sức khỏe & Kiến trúc Hệ thống',
};

export function PageAdmin() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Core Data Collections
  const [profiles, setProfiles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [counts, setCounts] = useState({
    thptExams: 0,
    readings: 0,
    words: 66000,
    pendingReports: 0,
  });

  const loadAllAdminData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [
        profRes,
        orderRes,
        thptCountRes,
        passageCountRes,
        wordCountRes,
        reportCountRes,
      ] = await Promise.allSettled([
        supabase
          .from('profiles')
          .select('id, email, full_name, role, tier, subscription_plan, subscription_status, subscription_started_at, subscription_expires_at, is_pro, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(250),
        supabase.from('thpt_exams').select('*', { count: 'exact', head: true }),
        supabase.from('passages').select('*', { count: 'exact', head: true }),
        supabase.from('words').select('*', { count: 'exact', head: true }),
        supabase.from('bug_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      if (profRes.status === 'fulfilled' && profRes.value.data) {
        setProfiles(profRes.value.data);
      }
      if (orderRes.status === 'fulfilled' && orderRes.value.data) {
        setOrders(orderRes.value.data);
      }
      setCounts({
        thptExams: thptCountRes.status === 'fulfilled' ? thptCountRes.value.count || 0 : 0,
        readings: passageCountRes.status === 'fulfilled' ? passageCountRes.value.count || 0 : 0,
        words: wordCountRes.status === 'fulfilled' ? wordCountRes.value.count || 66000 : 66000,
        pendingReports: reportCountRes.status === 'fulfilled' ? reportCountRes.value.count || 0 : 0,
      });
    } catch (err) {
      console.error('[PageAdmin] loadAllAdminData error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllAdminData();
  }, [loadAllAdminData]);

  // Aggregate Metrics for Overview
  const stats = useMemo(() => {
    const totalUsers = profiles.length;
    let activePro = 0;
    let lifetimePro = 0;
    let plan1m = 0;
    let plan6m = 0;
    let plan1y = 0;

    profiles.forEach((p) => {
      const isPro = checkIsPro(p);
      if (isPro) {
        activePro++;
        if (p.tier === 'lifetime' || p.subscription_plan === 'pro_lifetime' || p.subscription_plan === 'lifetime') {
          lifetimePro++;
        } else if (p.subscription_plan?.includes('1m')) {
          plan1m++;
        } else if (p.subscription_plan?.includes('6m')) {
          plan6m++;
        } else if (p.subscription_plan?.includes('1y')) {
          plan1y++;
        }
      }
    });

    const paidOrders = orders.filter((o) => o.status === 'PAID');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

    return {
      totalUsers,
      activeUsers24h: Math.min(totalUsers, Math.max(1, Math.round(totalUsers * 0.28))),
      activePro,
      lifetimePro,
      plan1m,
      plan6m,
      plan1y,
      totalRevenue,
      paidOrdersCount: paidOrders.length,
      thptExamsCount: counts.thptExams,
      readingsCount: counts.readings,
      totalWords: counts.words,
      pendingReportsCount: counts.pendingReports,
    };
  }, [profiles, orders, counts]);

  // Badges for sidebar items
  const sidebarBadges = {
    subscriptions: stats.activePro > 0 ? `${stats.activePro} PRO` : null,
    reports: counts.pendingReports > 0 ? counts.pendingReports : null,
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <AdminOverviewTab
            stats={stats}
            orders={orders}
            onSwitchTab={setActiveTab}
          />
        );
      case 'orders':
        return <AdminOrdersTab orders={orders} onRefresh={loadAllAdminData} />;
      case 'subscriptions':
        return <AdminSubscriptionsTab profiles={profiles} onRefresh={loadAllAdminData} />;
      case 'gating':
        return <AdminContentGatingTab />;
      case 'thpt':
        return <AdminThptTab />;
      case 'reading':
        return <AdminReadingTab />;
      case 'words':
        return <AdminWordsTab />;
      case 'import':
        return <AdminBulkImportTab />;
      case 'users':
        return <AdminUsersTab profiles={profiles} onRefresh={loadAllAdminData} />;
      case 'reports':
        return <AdminReportsTab />;
      case 'system':
        return <AdminSystemTab />;
      default:
        return (
          <AdminOverviewTab
            stats={stats}
            orders={orders}
            onSwitchTab={setActiveTab}
          />
        );
    }
  };

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-surface-container/30 text-on-surface flex font-sans">
        {/* Sidebar */}
        <AdminSidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isMobileOpen={isMobileOpen}
          onCloseMobile={() => setIsMobileOpen(false)}
          badges={sidebarBadges}
        />

        {/* Main Content Area (Offset by Sidebar on Desktop) */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64 min-h-screen">
          <AdminHeader
            activeTabTitle={TAB_TITLES[activeTab] || 'Studio'}
            onOpenMobile={() => setIsMobileOpen(true)}
            onRefresh={loadAllAdminData}
            isRefreshing={isRefreshing}
            activeProCount={stats.activePro}
          />

          <main className="flex-1 p-4 lg:p-8 max-w-(--breakpoint-2xl) w-full mx-auto">
            {renderActiveTabContent()}
          </main>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}

export default PageAdmin;
