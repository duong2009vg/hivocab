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
      subtitle: 'Tổng tài khoản trong hệ thống',
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
      value: `${stats.thptExamsCount == null ? '—' : stats.thptExamsCount} Đề / ${stats.readingsCount == null ? '—' : stats.readingsCount} Bài`,
      subtitle: `${stats.totalWords == null ? '—' : stats.totalWords.toLocaleString()} từ vựng trong hệ thống`,
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
      {/* 4-Metric Unified KPI Cards (No Rainbow - Studio Standard) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          return (
            <div
              key={kpi.title}
              onClick={() => onSwitchTab?.(kpi.tab)}
              className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-[#3D352E] shadow-[2.5px_3px_0px_#3D352E] hover:-translate-y-0.5 active:translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-extrabold text-[#86756C] uppercase tracking-wider">
                    {kpi.title}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-[#FAF5EB] border border-[#3D352E]/30 flex items-center justify-center text-sm shadow-2xs group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[17px] text-[#3D352E]">{kpi.icon}</span>
                  </div>
                </div>
                <div className="font-quicksand font-black text-2xl lg:text-3xl text-[#3D352E] tracking-tight mb-1 tabular-nums">
                  {kpi.value}
                </div>
              </div>
              <p className="text-[11.5px] font-semibold text-[#6E5D53] border-t border-[#3D352E]/10 pt-2 mt-2">
                {kpi.subtitle}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick Action Toolbar */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FFFDF9] border-2 border-[#3D352E] shadow-[2.5px_3px_0px_#3D352E] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-base">⚡</span>
          <span className="font-quicksand font-black text-xs sm:text-sm text-[#3D352E]">Lối tắt nghiệp vụ:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onSwitchTab?.('subscriptions')}
            className="h-[36px] px-3.5 rounded-xl bg-[#DE5D53] hover:bg-[#C84F45] text-white font-extrabold text-xs flex items-center gap-1.5 border-2 border-[#3D352E] shadow-[1.5px_2px_0px_#3D352E] active:translate-y-0.5 transition-all cursor-pointer"
          >
            <span>🎁</span>
            <span>Tặng PRO học viên</span>
          </button>
          <button
            type="button"
            onClick={() => onSwitchTab?.('gating')}
            className="h-[36px] px-3.5 rounded-xl bg-white hover:bg-[#FAF5EB] text-[#3D352E] font-extrabold text-xs flex items-center gap-1.5 border-2 border-[#3D352E] shadow-[1.5px_2px_0px_#3D352E] active:translate-y-0.5 transition-all cursor-pointer"
          >
            <span>🔒</span>
            <span>Khóa học liệu PRO</span>
          </button>
          <button
            type="button"
            onClick={() => onSwitchTab?.('thpt')}
            className="h-[36px] px-3.5 rounded-xl bg-[#557A46] hover:bg-[#476739] text-white font-extrabold text-xs flex items-center gap-1.5 border-2 border-[#3D352E] shadow-[1.5px_2px_0px_#3D352E] active:translate-y-0.5 transition-all cursor-pointer"
          >
            <span>✏️</span>
            <span>Soạn đề thi THPT</span>
          </button>
          <button
            type="button"
            onClick={() => onSwitchTab?.('reports')}
            className="h-[36px] px-3.5 rounded-xl bg-white hover:bg-[#FAF5EB] text-[#3D352E] font-extrabold text-xs flex items-center gap-1.5 border-2 border-[#3D352E] shadow-[1.5px_2px_0px_#3D352E] active:translate-y-0.5 transition-all cursor-pointer"
          >
            <span>🐞</span>
            <span>Báo lỗi ({stats.pendingReportsCount || 0})</span>
          </button>
        </div>
      </div>

      {/* Grid: Plan Breakdown & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 1 Col: Subscription Plan Breakdown */}
        <div className="p-5 rounded-2xl bg-white border-2 border-[#3D352E] shadow-[2.5px_3px_0px_#3D352E] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-[#DECDBB]">
            <div>
              <h3 className="font-quicksand font-black text-sm sm:text-base text-[#3D352E]">Phân bố Gói Hội viên</h3>
              <p className="text-[11px] font-semibold text-[#86756C]">Hội viên đang có hiệu lực</p>
            </div>
            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-[#EAF3E7] text-[#557A46] border border-[#8FB383] tabular-nums">
              Tổng {stats.activePro || 0} PRO
            </span>
          </div>

          <div className="space-y-2.5">
            {planBreakdown.map((p) => {
              const percentage = stats.activePro > 0 ? Math.round((p.count / stats.activePro) * 100) : 0;

              return (
                <div key={p.label} className="p-2.5 rounded-xl bg-[#FFFDF9] border border-[#3D352E]/15 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-white border border-[#3D352E] text-[#3D352E] flex items-center justify-center font-bold shadow-2xs">
                        <span className="material-symbols-outlined text-[15px]">{p.icon}</span>
                      </div>
                      <div>
                        <p className="text-xs font-black text-[#3D352E]">{p.label}</p>
                        <p className="text-[10px] font-bold text-[#86756C]">{p.price}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-[#DE5D53] tabular-nums">{p.count}</span>
                      <p className="text-[10px] font-bold text-[#86756C]">{percentage}%</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 rounded-full bg-[#F1EBD9] border border-[#3D352E]/20 overflow-hidden">
                    <div
                      className="h-full bg-[#DE5D53] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Recent Transactions */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border-2 border-[#3D352E] shadow-[2.5px_3px_0px_#3D352E] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-[#DECDBB]">
            <div>
              <h3 className="font-quicksand font-black text-sm sm:text-base text-[#3D352E]">Giao dịch Gần đây</h3>
              <p className="text-[11px] font-semibold text-[#86756C]">Đơn hàng PayOS & kích hoạt thủ công</p>
            </div>
            <button
              type="button"
              onClick={() => onSwitchTab?.('orders')}
              className="text-xs font-black text-[#DE5D53] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Xem tất cả</span>
              <span>➔</span>
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="py-12 text-center text-[#86756C] text-xs font-bold">
              Chưa có giao dịch phát sinh gần đây.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border-2 border-[#3D352E]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FAF5EB] border-b-2 border-[#3D352E] text-[#6E5D53] font-black text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">MÃ ĐƠN</th>
                    <th className="py-2.5 px-3">HỌC VIÊN</th>
                    <th className="py-2.5 px-3">GÓI</th>
                    <th className="py-2.5 px-3">SỐ TIỀN</th>
                    <th className="py-2.5 px-3">TRẠNG THÁI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DECDBB]">
                  {orders.slice(0, 6).map((order) => (
                    <tr key={order.id} className="hover:bg-[#FAF5EB]/50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-black text-[#3D352E]">
                        #{order.order_code}
                      </td>
                      <td className="py-2.5 px-3 max-w-[160px] truncate text-[#3D352E] font-bold" title={order.user_email}>
                        {order.user_email || 'Ẩn danh'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-[#6E5D53]">
                        <span className="px-2 py-0.5 rounded-lg bg-[#FAF5EB] border border-[#3D352E]/20 text-[11px]">
                          {order.plan_id}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-black text-[#3D352E] tabular-nums">
                        {order.amount ? formatCurrency(order.amount) : '0đ (Tặng)'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                            order.status === 'PAID'
                              ? 'bg-[#EAF3E7] text-[#557A46] border-[#8FB383]'
                              : 'bg-[#FEF3D6] text-[#B45309] border-[#ECA43B]'
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
