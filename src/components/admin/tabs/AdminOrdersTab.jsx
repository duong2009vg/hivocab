// src/components/admin/tabs/AdminOrdersTab.jsx
// Revenue Management & PayOS Order Inspection with Manual Sync & Approval
import React, { useState, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient.js';
import { useToast } from '../../../context/ToastContext.jsx';

export function AdminOrdersTab({ orders = [], onRefresh }) {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PAID' | 'PENDING' | 'MANUAL_GIFT'
  const [processingOrderId, setProcessingOrderId] = useState(null);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        String(o.order_code || '').includes(searchTerm.trim()) ||
        String(o.user_email || '').toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        String(o.plan_id || '').toLowerCase().includes(searchTerm.toLowerCase().trim());

      let matchStatus = true;
      if (statusFilter === 'PAID') matchStatus = o.status === 'PAID' && o.payment_method !== 'MANUAL_GIFT';
      else if (statusFilter === 'PENDING') matchStatus = o.status === 'PENDING';
      else if (statusFilter === 'MANUAL_GIFT') matchStatus = o.payment_method === 'MANUAL_GIFT';

      return matchSearch && matchStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  // Aggregate metrics
  const totalRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status === 'PAID')
      .reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
  }, [orders]);

  const paidCount = orders.filter((o) => o.status === 'PAID').length;
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;

  // Manual activate pending order
  const handleApprovePending = async (order) => {
    if (!window.confirm(`Xác nhận đánh dấu đơn hàng #${order.order_code} là ĐÃ THANH TOÁN và kích hoạt PRO cho học viên ${order.user_email}?`)) {
      return;
    }

    setProcessingOrderId(order.id);
    try {
      const now = new Date();
      // 1. Mark order as PAID
      const { error: ordErr } = await supabase
        .from('orders')
        .update({
          status: 'PAID',
          payment_time: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', order.id);

      if (ordErr) throw ordErr;

      // 2. Activate PRO on user's profile
      if (order.user_id) {
        const PLAN_DAYS = { pro_1m: 30, pro_6m: 180, pro_1y: 365, pro_lifetime: 36500 };
        const days = PLAN_DAYS[order.plan_id] || 30;
        const isLifetime = order.plan_id === 'pro_lifetime' || order.plan_id === 'lifetime';

        // Check current profile expiry to extend if active
        const { data: prof } = await supabase
          .from('profiles')
          .select('subscription_expires_at')
          .eq('id', order.user_id)
          .maybeSingle();

        const currentExp = prof?.subscription_expires_at ? new Date(prof.subscription_expires_at) : null;
        const baseTime = (currentExp && currentExp > now) ? currentExp.getTime() : now.getTime();
        const newExpiresAt = isLifetime ? null : new Date(baseTime + days * 24 * 60 * 60 * 1000).toISOString();

        await supabase
          .from('profiles')
          .update({
            tier: isLifetime ? 'lifetime' : 'pro',
            subscription_plan: order.plan_id,
            subscription_status: 'active',
            subscription_started_at: now.toISOString(),
            subscription_expires_at: newExpiresAt,
            is_pro: true,
          })
          .eq('id', order.user_id);
      }

      showToast(`Đã kích hoạt đơn hàng #${order.order_code} thành công! 🎉`, 'success');
      onRefresh?.();
    } catch (err) {
      console.error('handleApprovePending error:', err);
      showToast(`Lỗi kích hoạt đơn hàng: ${err.message}`, 'error');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      showToast('Không có dữ liệu đơn hàng để xuất!', 'warning');
      return;
    }
    const headers = ['Mã Đơn', 'Email Học Viên', 'Gói Đăng Ký', 'Số Tiền (VND)', 'Trạng Thái', 'Phương Thức', 'Thời Gian'];
    const rows = filteredOrders.map((o) => [
      o.order_code,
      `"${o.user_email || ''}"`,
      o.plan_id,
      o.amount || 0,
      o.status,
      o.payment_method || 'PAYOS',
      o.created_at,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hivocab_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất file CSV thành công!', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-surface border border-outline-variant/20">
          <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Doanh thu Thực nhận</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-on-surface-variant mt-0.5">{paidCount} đơn thanh toán thành công</p>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-outline-variant/20">
          <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Đơn Chờ Xử lý</p>
          <p className="text-2xl font-black text-amber-500 mt-1">{pendingCount}</p>
          <p className="text-xs text-on-surface-variant mt-0.5">Khách đã mở mã QR PayOS</p>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-outline-variant/20">
          <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Tổng Đơn Hệ thống</p>
          <p className="text-2xl font-black text-on-surface mt-1">{orders.length}</p>
          <p className="text-xs text-on-surface-variant mt-0.5">Bao gồm PayOS và Tặng quà</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-surface border border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-1 w-full sm:w-auto items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-on-surface-variant">search</span>
            <input
              type="text"
              placeholder="Tìm mã đơn, email học viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container/60 border border-outline-variant/20 text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-surface border border-outline-variant/20 text-xs font-semibold text-on-surface focus:outline-hidden focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PAID">Đã thanh toán (PAID)</option>
            <option value="PENDING">Chờ thanh toán (PENDING)</option>
            <option value="MANUAL_GIFT">Cấp tặng quà (GIFT)</option>
          </select>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportCSV}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-surface border border-outline-variant/20 hover:bg-surface-container text-xs font-bold text-on-surface flex items-center justify-center gap-1.5 transition-all shadow-2xs"
        >
          <span className="material-symbols-outlined text-[16px] text-primary">download</span>
          <span>Xuất CSV</span>
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-surface rounded-2xl border border-outline-variant/20 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container/40 border-b border-outline-variant/15 text-on-surface-variant font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">MÃ ĐƠN</th>
                <th className="py-3 px-4">HỌC VIÊN</th>
                <th className="py-3 px-4">GÓI PRO</th>
                <th className="py-3 px-4">SỐ TIỀN</th>
                <th className="py-3 px-4">TRẠNG THÁI</th>
                <th className="py-3 px-4">NGÀY TẠO</th>
                <th className="py-3 px-4 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-on-surface-variant">
                    Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isPaid = order.status === 'PAID';
                  const isGift = order.payment_method === 'MANUAL_GIFT';

                  return (
                    <tr key={order.id} className="hover:bg-surface-container/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-on-surface">
                        #{order.order_code}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-on-surface max-w-[200px] truncate" title={order.user_email}>
                          {order.user_email || '—'}
                        </p>
                        {order.user_id && (
                          <p className="text-[10px] font-mono text-on-surface-variant/70 truncate max-w-[200px]">
                            {order.user_id}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-primary/10 text-primary">
                          {order.plan_id || 'pro'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-on-surface">
                        {isGift ? (
                          <span className="text-amber-600 dark:text-amber-400">0đ (Quà tặng)</span>
                        ) : (
                          formatCurrency(order.amount)
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>{isGift ? 'TẶNG PRO' : 'ĐÃ THANH TOÁN'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            <span>CHỜ THANH TOÁN</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-on-surface-variant text-[11px]">
                        {formatDate(order.created_at)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {!isPaid && (
                          <button
                            onClick={() => handleApprovePending(order)}
                            disabled={processingOrderId === order.id}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] transition-all disabled:opacity-50 inline-flex items-center gap-1"
                            title="Xác nhận khách đã chuyển khoản thành công"
                          >
                            {processingOrderId === order.id ? (
                              <span className="material-symbols-outlined text-[14px] animate-spin">refresh</span>
                            ) : (
                              <span className="material-symbols-outlined text-[14px]">check_circle</span>
                            )}
                            <span>Duyệt Đơn</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminOrdersTab;
