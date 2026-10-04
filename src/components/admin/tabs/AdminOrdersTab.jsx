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
        <div className="p-5 rounded-3xl bg-white border-2 border-[#3D352E] shadow-[3.5px_4px_0px_#3D352E]">
          <p className="text-[11px] font-black text-[#86756C] uppercase tracking-wider">Doanh thu Thực nhận 💰</p>
          <p className="font-quicksand font-black text-2xl lg:text-3xl text-[#557A46] mt-1 tabular-nums">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs font-bold text-[#6E5D53] mt-1">{paidCount} đơn thanh toán thành công</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border-2 border-[#3D352E] shadow-[3.5px_4px_0px_#3D352E]">
          <p className="text-[11px] font-black text-[#86756C] uppercase tracking-wider">Đơn Chờ Xử lý ⏳</p>
          <p className="font-quicksand font-black text-2xl lg:text-3xl text-[#DE5D53] mt-1 tabular-nums">{pendingCount}</p>
          <p className="text-xs font-bold text-[#6E5D53] mt-1">Khách đã mở mã QR PayOS</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border-2 border-[#3D352E] shadow-[3.5px_4px_0px_#3D352E]">
          <p className="text-[11px] font-black text-[#86756C] uppercase tracking-wider">Tổng Đơn Hệ thống 📦</p>
          <p className="font-quicksand font-black text-2xl lg:text-3xl text-[#3D352E] mt-1 tabular-nums">{orders.length}</p>
          <p className="text-xs font-bold text-[#6E5D53] mt-1">Bao gồm PayOS và Tặng quà</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-[#FFFDF9] border-2 border-[#3D352E] shadow-[3px_3.5px_0px_#3D352E] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-1 w-full sm:w-auto items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-[#86756C]">search</span>
            <input
              type="text"
              placeholder="Tìm mã đơn, email học viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-2xl bg-white border-2 border-[#3D352E] text-xs font-bold text-[#3D352E] placeholder:text-[#86756C]/70 focus:outline-none focus:ring-2 focus:ring-[#557A46]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-[#86756C] hover:text-[#3D352E]"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 rounded-2xl bg-white border-2 border-[#3D352E] text-xs font-black text-[#3D352E] focus:outline-none focus:ring-2 focus:ring-[#557A46]"
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
          className="w-full sm:w-auto px-4 py-2 rounded-2xl bg-white hover:bg-[#FAF5EB] border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-xs font-black text-[#3D352E] flex items-center justify-center gap-1.5 transition-all active:translate-y-0.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px] text-[#557A46]">download</span>
          <span>Xuất CSV 📑</span>
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border-2 border-[#3D352E] shadow-[3.5px_4px_0px_#3D352E] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF5EB] border-b-2 border-[#3D352E] text-[#6E5D53] font-black uppercase tracking-wider text-[11px]">
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
            <tbody className="divide-y divide-[#DECDBB]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-[#86756C] font-bold">
                    Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isPaid = order.status === 'PAID';
                  const isGift = order.payment_method === 'MANUAL_GIFT';

                  return (
                    <tr key={order.id} className="hover:bg-[#FAF5EB]/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-black text-[#3D352E]">
                        #{order.order_code}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-[#3D352E] max-w-[200px] truncate" title={order.user_email}>
                          {order.user_email || '—'}
                        </p>
                        {order.user_id && (
                          <p className="text-[10px] font-mono text-[#86756C] truncate max-w-[200px]">
                            {order.user_id}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-lg font-black text-[11px] bg-[#FAF5EB] border border-[#3D352E]/20 text-[#3D352E]">
                          {order.plan_id || 'pro'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-black text-[#3D352E] tabular-nums">
                        {isGift ? (
                          <span className="text-[#DE5D53]">0đ (Quà tặng)</span>
                        ) : (
                          formatCurrency(order.amount)
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#EAF3E7] text-[#557A46] border border-[#8FB383]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#557A46]"></span>
                            <span>{isGift ? 'TẶNG PRO' : 'ĐÃ THANH TOÁN'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FEF3D6] text-[#B45309] border border-[#ECA43B]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#B45309] animate-pulse"></span>
                            <span>CHỜ THANH TOÁN</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[#86756C] font-bold text-[11px]">
                        {formatDate(order.created_at)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {!isPaid && (
                          <button
                            onClick={() => handleApprovePending(order)}
                            disabled={processingOrderId === order.id}
                            className="px-3 py-1.5 rounded-xl bg-[#557A46] hover:bg-[#476739] text-white font-black text-xs border-2 border-[#3D352E] shadow-[1.5px_2px_0px_#3D352E] active:translate-y-0.5 transition-all disabled:opacity-50 inline-flex items-center gap-1 cursor-pointer"
                            title="Xác nhận khách đã chuyển khoản thành công"
                          >
                            {processingOrderId === order.id ? (
                              <span className="material-symbols-outlined text-[14px] animate-spin">refresh</span>
                            ) : (
                              <span>✓</span>
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
