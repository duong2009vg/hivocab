// src/components/admin/tabs/AdminOverviewTab.jsx
// Studio Overview Dashboard with Realtime Metrics, Plan Breakdown & Quick Navigation
import React from 'react';

export function AdminOverviewTab({
  stats,
  orders = [],
  onSwitchTab,
}) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  // 4 Unified KPI cards following Evondev single-color hierarchy (no rainbow cards)
  const kpis = [
    {
      title: 'TỔNG HỌC VIÊN',
      value: (stats.totalUsers || 0).toLocaleString(),
      subtitle: `${stats.activeUsers24h || 0} hoạt động trong 24h`,
      icon: 'group',
      tab: 'users',
    },
    {
      title: 'HỘI VIÊN PRO ACTIVE',
      value: (stats.activePro || 0).toLocaleString(),
      subtitle: `${stats.lifetimePro || 0} học viên trọn đời`,
      icon: 'card_giftcard',
      tab: 'subscriptions',
    },
    {
      title: 'TỔNG DOANH THU',
      value: formatCurrency(stats.totalRevenue),
      subtitle: `${stats.paidOrdersCount || 0} đơn hàng PayOS thành công`,
      icon: 'payments',
      tab: 'orders',
    },
    {
      title: 'HỌC LIỆU TRỌNG TÂM',
      value: `${stats.thptExamsCount || 0} Đề / ${stats.readingsCount || 0} Bài`,
      subtitle: `${(stats.totalWords || 0).toLocaleString()} từ vựng trong hệ thống`,
      icon: 'school',
      tab: 'thpt',
    },
  ];

  const planBreakdown = [
    { label: 'Gói 1 Tháng (pro_1m)', count: stats.plan1m || 0, price: '69.000đ', icon: 'looks_one' },
    { label: 'Gói 6 Tháng (pro_6m)', count: stats.plan6m || 0, price: '299.000đ', icon: 'looks_6' },
    { label: 'Gói 1 Năm (pro_1y)', count: stats.plan1y || 0, price: '499.000đ', icon: 'event' },
    { label: 'Gói Trọn Đời (lifetime)', count: stats.lifetimePro || 0, price: '899.000đ', icon: 'all_inclusive' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 4-Metric Unified KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.title}
            onClick={() => onSwitchTab?.(kpi.tab)}
            className="p-5 rounded-2xl bg-surface border border-outline-variant/15 hover:border-outline-variant/40 hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                {kpi.title}
              </span>
              <div className="w-9 h-9 rounded-xl bg-surface-container/80 text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-[20px]">{kpi.icon}</span>
              </div>
            </div>
            <div className="text-2xl lg:text-3xl font-extrabold text-on-surface tracking-tight mb-1 tabular-nums font-sans">
              {kpi.value}
            </div>
            <p className="text-[12px] text-on-surface-variant/80 font-medium">
              {kpi.subtitle}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Action Toolbar */}
      <div className="p-4 rounded-2xl bg-surface border border-outline-variant/15 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">bolt</span>
          <span className="text-xs font-bold text-on-surface">Thao tác nhanh:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onSwitchTab?.('subscriptions')}
            className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs"
          >
            <span className="material-symbols-outlined text-[15px]">card_giftcard</span>
            <span>Tặng PRO học viên</span>
          </button>
          <button
            onClick={() => onSwitchTab?.('gating')}
            className="px-3.5 py-1.5 rounded-xl bg-surface-container/60 hover:bg-surface-container text-on-surface font-semibold text-xs flex items-center gap-1.5 border border-outline-variant/15 transition-all"
          >
            <span className="material-symbols-outlined text-[15px]">lock_open</span>
            <span>Khóa học liệu PRO</span>
          </button>
          <button
            onClick={() => onSwitchTab?.('thpt')}
            className="px-3.5 py-1.5 rounded-xl bg-surface-container/60 hover:bg-surface-container text-on-surface font-semibold text-xs flex items-center gap-1.5 border border-outline-variant/15 transition-all"
          >
            <span className="material-symbols-outlined text-[15px]">add_circle</span>
            <span>Soạn đề thi THPT</span>
          </button>
          <button
            onClick={() => onSwitchTab?.('reports')}
            className="px-3.5 py-1.5 rounded-xl bg-surface-container/60 hover:bg-surface-container text-on-surface font-semibold text-xs flex items-center gap-1.5 border border-outline-variant/15 transition-all"
          >
            <span className="material-symbols-outlined text-[15px]">bug_report</span>
            <span>Xử lý báo lỗi ({stats.pendingReportsCount || 0})</span>
          </button>
        </div>
      </div>

      {/* Grid: Plan Breakdown & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Subscription Plan Breakdown */}
        <div className="p-5 rounded-2xl bg-surface border border-outline-variant/15 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/15">
            <div>
              <h3 className="font-bold text-sm text-on-surface">Phân bố Gói Hội viên</h3>
              <p className="text-xs text-on-surface-variant font-medium">Thống kê hội viên có hiệu lực</p>
            </div>
            <span className="text-xs font-bold text-primary tabular-nums">Tổng {stats.activePro || 0}</span>
          </div>

          <div className="space-y-3">
            {planBreakdown.map((p) => {
              const percentage = stats.activePro > 0 ? Math.round((p.count / stats.activePro) * 100) : 0;

              return (
                <div key={p.label} className="p-3 rounded-xl bg-surface-container/30 border border-outline-variant/15 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-surface border border-outline-variant/15 text-on-surface-variant flex items-center justify-center">
                        <span className="material-symbols-outlined text-[16px]">{p.icon}</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-on-surface">{p.label}</p>
                        <p className="text-[11px] text-on-surface-variant">{p.price}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-on-surface tabular-nums">{p.count}</span>
                      <p className="text-[10px] text-on-surface-variant">{percentage}%</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 rounded-full bg-surface-container overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Recent Transactions */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-surface border border-outline-variant/15 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/15">
            <div>
              <h3 className="font-bold text-sm text-on-surface">Giao dịch Gần đây</h3>
              <p className="text-xs text-on-surface-variant">Đơn hàng thanh toán PayOS & cấp tặng thủ công</p>
            </div>
            <button
              onClick={() => onSwitchTab?.('orders')}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant text-xs">
              Chưa có giao dịch phát sinh gần đây.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-outline-variant/15 text-on-surface-variant font-bold">
                    <th className="pb-2.5">MÃ ĐƠN</th>
                    <th className="pb-2.5">HỌC VIÊN</th>
                    <th className="pb-2.5">GÓI</th>
                    <th className="pb-2.5">SỐ TIỀN</th>
                    <th className="pb-2.5">TRẠNG THÁI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {orders.slice(0, 6).map((order) => (
                    <tr key={order.id} className="hover:bg-surface-container/30 transition-colors">
                      <td className="py-3 font-mono font-bold text-on-surface">
                        #{order.order_code}
                      </td>
                      <td className="py-3 max-w-[160px] truncate text-on-surface font-medium" title={order.user_email}>
                        {order.user_email || 'Ẩn danh'}
                      </td>
                      <td className="py-3 font-semibold text-on-surface-variant">
                        {order.plan_id}
                      </td>
                      <td className="py-3 font-bold text-on-surface tabular-nums">
                        {order.amount ? formatCurrency(order.amount) : '0đ (Tặng)'}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            order.status === 'PAID'
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {order.status === 'PAID' ? 'ĐÃ THANH TOÁN' : 'CHỜ THANH TOÁN'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminOverviewTab;
