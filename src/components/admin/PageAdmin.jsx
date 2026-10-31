// src/components/admin/PageAdmin.jsx
// HiVocab Studio Master Admin Dashboard Shell (Option A: Modern Studio Sidebar Layout)
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { checkIsPro } from '../../providers/AuthProvider.jsx';
import { lazyWithRetry as lazy } from '../../utils/lazyWithRetry.js';
import AdminProtectedRoute from '../common/AdminProtectedRoute.jsx';
import AdminSidebar from './AdminSidebar.jsx';
import AdminHeader from './AdminHeader.jsx';

// Keep the admin shell light. Each tab is loaded only when selected.
const AdminOverviewTab = lazy(() => import('./tabs/AdminOverviewTab.jsx'));
const AdminOrdersTab = lazy(() => import('./tabs/AdminOrdersTab.jsx'));
const AdminSubscriptionsTab = lazy(() => import('./tabs/AdminSubscriptionsTab.jsx'));
const AdminContentGatingTab = lazy(() => import('./tabs/AdminContentGatingTab.jsx'));
const AdminUsersTab = lazy(() => import('./tabs/AdminUsersTab.jsx'));
const AdminThptTab = lazy(() => import('./tabs/AdminThptTab.jsx'));
const AdminReadingTab = lazy(() => import('./tabs/AdminReadingTab.jsx'));
const AdminWordsTab = lazy(() => import('./tabs/AdminWordsTab.jsx'));
const AdminFoldersTab = lazy(() => import('./tabs/AdminFoldersTab.jsx'));
const AdminBulkImportTab = lazy(() => import('./tabs/AdminBulkImportTab.jsx'));
const AdminReportsTab = lazy(() => import('./tabs/AdminReportsTab.jsx'));
const AdminSystemTab = lazy(() => import('./tabs/AdminSystemTab.jsx'));

const TAB_TITLES = {
  overview: 'Tổng quan Studio',
  orders: 'Doanh thu & Đơn hàng PayOS',
  subscriptions: 'Hội viên & Cấp tặng Gói PRO',
  gating: 'Khóa Học liệu PRO / Miễn phí',
  folders: 'Quản lý Thư mục & Khóa học Public',
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
    thptExams: null,
    readings: null,
    words: null,
    pendingReports: null,
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
          .select('id, email, full_name, role, tier, subscription_plan, subscription_status, subscription_started_at, subscription_expires_at, created_at')
          .order('created_at', { ascending: false })
          .limit(250),
        supabase
          .from('orders')
          .select('id, order_code, user_id, user_email, plan_id, amount, status, created_at, paid_at')
          .order('created_at', { ascending: false })
          .limit(250),
        supabase.from('thpt_exams').select('id', { count: 'exact', head: true }),
        supabase.from('passages').select('id', { count: 'exact', head: true }),
        supabase.from('words').select('id', { count: 'exact', head: true }),
        supabase.from('system_error_logs').select('id', { count: 'exact', head: true }),
      ]);

      if (profRes.status === 'fulfilled' && !profRes.value.error && profRes.value.data) {
        setProfiles(profRes.value.data);
      }
      if (orderRes.status === 'fulfilled' && !orderRes.value.error && orderRes.value.data) {
        setOrders(orderRes.value.data);
      }
      const readCount = (result) => (
        result.status === 'fulfilled' && !result.value.error
          ? (result.value.count ?? 0)
          : null
      );
      setCounts({
        thptExams: readCount(thptCountRes),
        readings: readCount(passageCountRes),
        words: readCount(wordCountRes),
        pendingReports: readCount(reportCountRes),
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
      case 'folders':
        return <AdminFoldersTab />;
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
      <div
        className="min-h-screen bg-[#FAF5EB] text-[#3D352E] flex font-nunito relative selection:bg-[#EBDDC8] selection:text-[#3D352E]"
        style={{
          backgroundImage: 'radial-gradient(#E2D6C3 1.2px, transparent 1.2px)',
          backgroundSize: '24px 24px',
        }}
      >
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
            onSelectTab={setActiveTab}
          />

          <main className="flex-1 p-4 lg:p-7 max-w-[1560px] w-full mx-auto animate-fade-in">
            {renderActiveTabContent()}
          </main>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}

export default PageAdmin;
