// src/components/admin/tabs/AdminUsersTab.jsx
// User Account Management with Role Switching (Admin/User), Password Reset & Details
import React, { useState, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { useAuth } from '../../../providers/AuthProvider.jsx';

export function AdminUsersTab({ profiles = [], onRefresh }) {
  const { showToast } = useToast();
  const { user: currentAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL'); // 'ALL' | 'admin' | 'user'
  const [processingId, setProcessingId] = useState(null);

  const filteredUsers = useMemo(() => {
    return profiles.filter((p) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        String(p.email || '').toLowerCase().includes(q) ||
        String(p.full_name || '').toLowerCase().includes(q) ||
        String(p.id || '').toLowerCase().includes(q);

      let matchRole = true;
      if (roleFilter !== 'ALL') {
        matchRole = (p.role || 'user') === roleFilter;
      }

      return matchSearch && matchRole;
    });
  }, [profiles, searchTerm, roleFilter]);

  const handleToggleAdminRole = async (p) => {
    const isCurrentlyAdmin = p.role === 'admin';
    const nextRole = isCurrentlyAdmin ? 'user' : 'admin';

    if (p.id === currentAdmin?.id && isCurrentlyAdmin) {
      showToast('Bạn không thể tự hạ quyền Admin của chính mình!', 'warning');
      return;
    }

    if (!window.confirm(`Xác nhận đổi vai trò của ${p.email} thành: ${nextRole.toUpperCase()}?`)) {
      return;
    }

    setProcessingId(p.id);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: nextRole })
        .eq('id', p.id);

      if (error) throw error;
      showToast(`Đã đổi vai trò thành ${nextRole.toUpperCase()} thành công!`, 'success');
      onRefresh?.();
    } catch (err) {
      console.error('handleToggleAdminRole error:', err);
      showToast(`Lỗi phân quyền: ${err.message}`, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSendResetPassword = async (email) => {
    if (!email) {
      showToast('Tài khoản này chưa có email hợp lệ.', 'warning');
      return;
    }
    if (!window.confirm(`Gửi email đặt lại mật khẩu đến: ${email}?`)) {
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#settings`,
      });
      if (error) throw error;
      showToast(`Đã gửi email khôi phục mật khẩu đến ${email}!`, 'success');
    } catch (err) {
      console.error('handleSendResetPassword error:', err);
      showToast(`Lỗi gửi email: ${err.message}`, 'error');
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '—';
    try {
      return new Date(isoStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-surface border border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-1 w-full sm:w-auto items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-on-surface-variant">search</span>
            <input
              type="text"
              placeholder="Tìm tài khoản theo email, tên, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container/60 border border-outline-variant/20 text-xs text-on-surface focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-surface border border-outline-variant/20 text-xs font-semibold text-on-surface focus:outline-hidden focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="admin">Quản trị viên (Admin)</option>
            <option value="user">Học viên thường (User)</option>
          </select>
        </div>

        <div className="text-xs font-semibold text-on-surface-variant">
          Tổng cộng: <span className="font-bold text-on-surface">{filteredUsers.length}</span> tài khoản
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-surface rounded-2xl border border-outline-variant/20 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container/40 border-b border-outline-variant/15 text-on-surface-variant font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">TÀI KHOẢN</th>
                <th className="py-3 px-4">VAI TRÒ</th>
                <th className="py-3 px-4">GÓI TÀI KHOẢN</th>
                <th className="py-3 px-4">NGÀY THAM GIA</th>
                <th className="py-3 px-4 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-on-surface-variant">
                    Không tìm thấy tài khoản người dùng nào.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((p) => {
                  const isAdmin = p.role === 'admin';
                  const initial = p.full_name?.charAt(0) || p.email?.charAt(0).toUpperCase() || 'U';

                  return (
                    <tr key={p.id} className="hover:bg-surface-container/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                              isAdmin
                                ? 'bg-primary/10 text-primary'
                                : 'bg-surface-container text-on-surface-variant'
                            }`}
                          >
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-on-surface max-w-[220px] truncate" title={p.email}>
                              {p.email || 'Chưa liên kết email'}
                            </p>
                            {p.full_name && (
                              <p className="text-[10px] text-on-surface-variant truncate max-w-[220px]">
                                {p.full_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                            <span className="material-symbols-outlined text-[13px]">shield</span>
                            <span>ADMIN</span>
                          </span>
                        ) : (
                          <span className="text-on-surface-variant font-mono text-[11px]">User</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-on-surface">
                        {p.tier === 'lifetime' ? (
                          <span className="text-purple-600 dark:text-purple-400 font-bold">PRO Trọn đời</span>
                        ) : p.tier === 'pro' || p.is_pro ? (
                          <span className="text-amber-600 dark:text-amber-400 font-bold">HiVocab PRO</span>
                        ) : (
                          <span className="text-on-surface-variant">Miễn phí</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-on-surface-variant">
                        {formatDate(p.created_at)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Admin */}
                          <button
                            onClick={() => handleToggleAdminRole(p)}
                            disabled={processingId === p.id}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors inline-flex items-center gap-1 ${
                              isAdmin
                                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400'
                                : 'bg-primary/10 text-primary hover:bg-primary/20'
                            }`}
                            title={isAdmin ? 'Hạ quyền xuống User thường' : 'Thăng cấp thành Admin'}
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              {isAdmin ? 'remove_moderator' : 'add_moderator'}
                            </span>
                            <span>{isAdmin ? 'Gỡ Admin' : 'Cấp Admin'}</span>
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => handleSendResetPassword(p.email)}
                            className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
                            title="Gửi email đổi mật khẩu"
                          >
                            <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                          </button>
                        </div>
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

export default AdminUsersTab;
