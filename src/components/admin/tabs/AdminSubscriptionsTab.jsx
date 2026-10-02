// src/components/admin/tabs/AdminSubscriptionsTab.jsx
// Comprehensive PRO Membership Management, Expiry Tracking & Single/Bulk Grant/Revoke
import React, { useState, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient.js';
import { useToast } from '../../../context/ToastContext.jsx';
import GrantProModal from '../modals/GrantProModal.jsx';

export function AdminSubscriptionsTab({
  profiles = [],
  onRefresh,
}) {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL'); // 'ALL' | 'PRO' | 'EXPIRING' | 'LIFETIME' | 'FREE'
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [modalTargetUser, setModalTargetUser] = useState(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isRevokingId, setIsRevokingId] = useState(null);

  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Helper to compute user PRO status
  const evaluateProStatus = (p) => {
    const plan = String(p.subscription_plan || '').toLowerCase();
    const isProTier = (
      p.tier === 'pro' ||
      p.tier === 'lifetime' ||
      plan === 'lifetime' ||
      plan.startsWith('pro') ||
      Boolean(p.is_pro)
    );

    const expiresAt = p.subscription_expires_at ? new Date(p.subscription_expires_at) : null;
    const isExpired = expiresAt && expiresAt < now;
    const isLifetime = p.tier === 'lifetime' || plan === 'lifetime' || plan === 'pro_lifetime' || (!expiresAt && isProTier);
    const isActivePro = isProTier && !isExpired;
    const isExpiringSoon = isActivePro && expiresAt && expiresAt <= sevenDaysLater && !isLifetime;

    return {
      isActivePro,
      isLifetime,
      isExpired,
      isExpiringSoon,
      expiresAt,
    };
  };

  // KPIs
  const stats = useMemo(() => {
    let activePro = 0;
    let lifetime = 0;
    let expiring = 0;
    let free = 0;

    profiles.forEach((p) => {
      const { isActivePro, isLifetime, isExpiringSoon } = evaluateProStatus(p);
      if (isActivePro) {
        activePro++;
        if (isLifetime) lifetime++;
        else if (isExpiringSoon) expiring++;
      } else {
        free++;
      }
    });

    return { activePro, lifetime, expiring, free };
  }, [profiles]);

  // Filtered list
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        String(p.email || '').toLowerCase().includes(q) ||
        String(p.full_name || '').toLowerCase().includes(q) ||
        String(p.id || '').toLowerCase().includes(q);

      const { isActivePro, isLifetime, isExpiringSoon } = evaluateProStatus(p);

      let matchTier = true;
      if (tierFilter === 'PRO') matchTier = isActivePro;
      else if (tierFilter === 'EXPIRING') matchTier = isExpiringSoon;
      else if (tierFilter === 'LIFETIME') matchTier = isLifetime;
      else if (tierFilter === 'FREE') matchTier = !isActivePro;

      return matchSearch && matchTier;
    });
  }, [profiles, searchTerm, tierFilter]);

  // Checkbox handlers
  const handleToggleSelectUser = (id) => {
    const next = new Set(selectedUserIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedUserIds(next);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const next = new Set(filteredProfiles.map((p) => p.id));
      setSelectedUserIds(next);
    } else {
      setSelectedUserIds(new Set());
    }
  };

  // Revoke PRO
  const handleRevokePro = async (p) => {
    if (!window.confirm(`Xác nhận THU HỒI quyền PRO của học viên ${p.email}? Tài khoản sẽ chuyển về gói Miễn phí.`)) {
      return;
    }

    setIsRevokingId(p.id);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          tier: 'free',
          subscription_plan: 'free',
          subscription_status: 'expired',
          subscription_expires_at: now.toISOString(),
        })
        .eq('id', p.id);

      if (error) throw error;
      showToast(`Đã thu hồi gói PRO của học viên ${p.email}.`, 'success');
      onRefresh?.();
    } catch (err) {
      console.error('handleRevokePro error:', err);
      showToast(`Lỗi khi thu hồi: ${err.message}`, 'error');
    } finally {
      setIsRevokingId(null);
    }
  };

  // Selected users array for bulk modal
  const selectedUsersArray = useMemo(() => {
    return profiles
      .filter((p) => selectedUserIds.has(p.id))
      .map((p) => ({
        id: p.id,
        email: p.email || 'Ẩn danh',
        expiresAt: p.subscription_expires_at,
      }));
  }, [profiles, selectedUserIds]);

  const formatDate = (dateObj) => {
    if (!dateObj) return 'Vĩnh viễn';
    return dateObj.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setTierFilter('PRO')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            tierFilter === 'PRO' ? 'bg-primary/10 border-primary ring-1 ring-primary/30' : 'bg-surface border-outline-variant/15 hover:border-outline-variant/40'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Hội viên PRO</span>
            <span className={`material-symbols-outlined text-[18px] ${tierFilter === 'PRO' ? 'text-primary' : 'text-on-surface-variant/70'}`}>verified</span>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-on-surface tabular-nums">{stats.activePro}</p>
        </div>

        <div
          onClick={() => setTierFilter('LIFETIME')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            tierFilter === 'LIFETIME' ? 'bg-primary/10 border-primary ring-1 ring-primary/30' : 'bg-surface border-outline-variant/15 hover:border-outline-variant/40'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Trọn đời</span>
            <span className={`material-symbols-outlined text-[18px] ${tierFilter === 'LIFETIME' ? 'text-primary' : 'text-on-surface-variant/70'}`}>all_inclusive</span>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-on-surface tabular-nums">{stats.lifetime}</p>
        </div>

        <div
          onClick={() => setTierFilter('EXPIRING')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            tierFilter === 'EXPIRING' ? 'bg-primary/10 border-primary ring-1 ring-primary/30' : 'bg-surface border-outline-variant/15 hover:border-outline-variant/40'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Sắp hết hạn (&le;7d)</span>
            <span className={`material-symbols-outlined text-[18px] ${tierFilter === 'EXPIRING' ? 'text-primary' : 'text-on-surface-variant/70'}`}>alarm</span>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-on-surface tabular-nums">{stats.expiring}</p>
        </div>

        <div
          onClick={() => setTierFilter('FREE')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            tierFilter === 'FREE' ? 'bg-primary/10 border-primary ring-1 ring-primary/30' : 'bg-surface border-outline-variant/15 hover:border-outline-variant/40'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Miễn phí</span>
            <span className={`material-symbols-outlined text-[18px] ${tierFilter === 'FREE' ? 'text-primary' : 'text-on-surface-variant/70'}`}>person</span>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-on-surface tabular-nums">{stats.free}</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-surface border border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-1 w-full sm:w-auto items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-on-surface-variant">search</span>
            <input
              type="text"
              placeholder="Tìm theo email, tên, id học viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container/60 border border-outline-variant/20 text-xs text-on-surface focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Tier Dropdown */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-surface border border-outline-variant/20 text-xs font-semibold text-on-surface focus:outline-hidden focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">Tất cả hội viên</option>
            <option value="PRO">Đang dùng PRO</option>
            <option value="LIFETIME">Gói Trọn đời</option>
            <option value="EXPIRING">Sắp hết hạn (&le;7 ngày)</option>
            <option value="FREE">Tài khoản Miễn phí</option>
          </select>
        </div>

        {/* Refresh & Bulk Bar Trigger */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {selectedUserIds.size > 0 && (
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">card_giftcard</span>
              <span>Tặng PRO {selectedUserIds.size} người</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedUserIds.size > 0 && (
        <div className="sticky top-20 z-20 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700/60 shadow-lg flex items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
            <span className="material-symbols-outlined text-amber-600 text-[18px]">check_box</span>
            <span>Đã chọn {selectedUserIds.size} học viên</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedUserIds(new Set())}
              className="px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
            >
              Bỏ chọn
            </button>
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">card_giftcard</span>
              <span>Cấp PRO Hàng Loạt</span>
            </button>
          </div>
        </div>
      )}

      {/* Subscribers Table */}
      <div className="bg-surface rounded-2xl border border-outline-variant/20 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container/40 border-b border-outline-variant/15 text-on-surface-variant font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredProfiles.length > 0 && selectedUserIds.size === filteredProfiles.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary"
                  />
                </th>
                <th className="py-3 px-4">HỌC VIÊN</th>
                <th className="py-3 px-4">GÓI HIỆN TẠI</th>
                <th className="py-3 px-4">TRẠNG THÁI</th>
                <th className="py-3 px-4">HẠN DÙNG</th>
                <th className="py-3 px-4 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-on-surface-variant">
                    Không tìm thấy học viên nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((p) => {
                  const isSelected = selectedUserIds.has(p.id);
                  const { isActivePro, isLifetime, isExpiringSoon, expiresAt } = evaluateProStatus(p);
                  const initial = p.full_name?.charAt(0) || p.email?.charAt(0).toUpperCase() || 'U';

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-surface-container/30 transition-colors ${
                        isSelected ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectUser(p.id)}
                          className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                        />
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                              isActivePro
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'bg-surface-container text-on-surface-variant'
                            }`}
                          >
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-on-surface truncate max-w-[200px]" title={p.email}>
                              {p.email || 'Chưa có email'}
                            </p>
                            {p.full_name && (
                              <p className="text-[10px] text-on-surface-variant truncate max-w-[200px]">
                                {p.full_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                            isLifetime
                              ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                              : isActivePro
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                              : 'bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          {isLifetime ? 'PRO Trọn đời' : isActivePro ? p.subscription_plan || 'PRO' : 'Miễn phí'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {isActivePro ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isExpiringSoon
                                ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                                : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isExpiringSoon ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                            <span>{isExpiringSoon ? 'SẮP HẾT HẠN' : 'ĐANG ACTIVE'}</span>
                          </span>
                        ) : (
                          <span className="text-on-surface-variant text-[11px]">Free</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-on-surface">
                        {isLifetime ? 'Vĩnh viễn' : formatDate(expiresAt)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() =>
                              setModalTargetUser({
                                id: p.id,
                                email: p.email,
                                expiresAt: p.subscription_expires_at,
                              })
                            }
                            className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 font-bold text-[11px] flex items-center gap-1 transition-colors"
                            title="Tặng hoặc gia hạn PRO"
                          >
                            <span className="material-symbols-outlined text-[15px]">card_giftcard</span>
                            <span>Tặng PRO</span>
                          </button>

                          {isActivePro && (
                            <button
                              onClick={() => handleRevokePro(p)}
                              disabled={isRevokingId === p.id}
                              className="p-1 rounded-lg text-on-surface-variant hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors disabled:opacity-50"
                              title="Thu hồi gói PRO"
                            >
                              <span className="material-symbols-outlined text-[17px]">cancel</span>
                            </button>
                          )}
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

      {/* Single Grant Pro Modal */}
      {modalTargetUser && (
        <GrantProModal
          isOpen={Boolean(modalTargetUser)}
          targetUser={modalTargetUser}
          onClose={() => setModalTargetUser(null)}
          onSuccess={onRefresh}
        />
      )}

      {/* Bulk Grant Pro Modal */}
      {isBulkModalOpen && (
        <GrantProModal
          isOpen={isBulkModalOpen}
          selectedUsers={selectedUsersArray}
          onClose={() => setIsBulkModalOpen(false)}
          onSuccess={() => {
            setSelectedUserIds(new Set());
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
}

export default AdminSubscriptionsTab;
