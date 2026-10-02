// src/components/admin/tabs/AdminReportsTab.jsx
// Bug Reports & Student Question Inquiries Resolution Manager
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient.js';
import { useToast } from '../../../context/ToastContext.jsx';

export function AdminReportsTab() {
  const { showToast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'pending' | 'resolved'
  const [updatingId, setUpdatingId] = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bug_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        // If bug_reports table doesn't have status or errors, gracefully fallback
        console.warn('fetchReports error:', error.message);
        setReports([]);
      } else {
        setReports(data || []);
      }
    } catch (err) {
      console.warn('fetchReports caught:', err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleResolve = async (report) => {
    const nextStatus = report.status === 'resolved' ? 'pending' : 'resolved';
    setUpdatingId(report.id);
    try {
      const { error } = await supabase
        .from('bug_reports')
        .update({ status: nextStatus })
        .eq('id', report.id);

      if (error) throw error;
      showToast(`Đã chuyển trạng thái thành ${nextStatus.toUpperCase()}!`, 'success');
      setReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, status: nextStatus } : r))
      );
    } catch (err) {
      console.error('handleResolve error:', err);
      showToast(`Lỗi cập nhật: ${err.message}`, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (statusFilter === 'ALL') return true;
    return (r.status || 'pending') === statusFilter;
  });

  const formatDate = (isoStr) => {
    if (!isoStr) return '—';
    try {
      return new Date(isoStr).toLocaleDateString('vi-VN', {
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filter Header */}
      <div className="p-4 rounded-2xl bg-surface border border-outline-variant/20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-surface-container/60 border border-outline-variant/20 text-xs font-semibold text-on-surface focus:outline-hidden focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">Tất cả báo cáo</option>
            <option value="pending">Chờ xử lý</option>
            <option value="resolved">Đã giải quyết</option>
          </select>
        </div>

        <div className="text-xs font-semibold text-on-surface-variant">
          Tổng số: <span className="font-bold text-on-surface">{filteredReports.length}</span> phản hồi
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-surface rounded-2xl border border-outline-variant/20 overflow-hidden shadow-2xs">
        {loading ? (
          <div className="py-16 text-center text-on-surface-variant flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px] animate-spin">refresh</span>
            <span className="text-xs">Đang tải danh sách báo cáo...</span>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="py-16 text-center text-on-surface-variant text-xs">
            Không có báo cáo lỗi nào cần giải quyết. Hệ thống hoạt động trơn tru! ✨
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container/40 border-b border-outline-variant/15 text-on-surface-variant font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">TIÊU ĐỀ / NỘI DUNG</th>
                  <th className="py-3 px-4">NGƯỜI GỬI</th>
                  <th className="py-3 px-4">LOẠI</th>
                  <th className="py-3 px-4">THỜI GIAN</th>
                  <th className="py-3 px-4">TRẠNG THÁI</th>
                  <th className="py-3 px-4 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filteredReports.map((report) => {
                  const isResolved = report.status === 'resolved';

                  return (
                    <tr key={report.id} className="hover:bg-surface-container/30 transition-colors">
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-bold text-on-surface truncate" title={report.title || report.description}>
                          {report.title || 'Báo cáo từ học viên'}
                        </p>
                        {report.description && (
                          <p className="text-[11px] text-on-surface-variant line-clamp-2 mt-0.5">
                            {report.description}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-on-surface">
                        {report.user_email || report.email || 'Ẩn danh'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] bg-surface-container text-on-surface-variant uppercase">
                          {report.type || 'Bug'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-on-surface-variant">
                        {formatDate(report.created_at)}
                      </td>

                      <td className="py-3.5 px-4">
                        {isResolved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>ĐÃ XỬ LÝ</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            <span>CHỜ XỬ LÝ</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleResolve(report)}
                          disabled={updatingId === report.id}
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            isResolved
                              ? 'border border-outline-variant/20 hover:bg-surface-container text-on-surface'
                              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                          }`}
                        >
                          {isResolved ? 'Mở lại' : 'Hoàn thành'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminReportsTab;
