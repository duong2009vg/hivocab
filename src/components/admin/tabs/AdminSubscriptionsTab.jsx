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
          className={`p-4 rounded-3xl border-2 border-[#3D352E] transition-all cursor-pointer shadow-[3px_3.5px_0px_#3D352E] ${
            tierFilter === 'PRO' ? 'bg-[#EAF3E7] ring-2 ring-[#557A46]' : 'bg-white hover:bg-[#FAF5EB]'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black text-[#86756C] uppercase tracking-wider">Hội viên PRO 👑</span>
            <span className="material-symbols-outlined text-[18px] text-[#557A46]">verified</span>
          </div>
          <p className="font-quicksand font-black text-xl sm:text-2xl text-[#3D352E] tabular-nums">{stats.activePro}</p>
        </div>

        <div
          onClick={() => setTierFilter('LIFETIME')}
          className={`p-4 rounded-3xl border-2 border-[#3D352E] transition-all cursor-pointer shadow-[3px_3.5px_0px_#3D352E] ${
            tierFilter === 'LIFETIME' ? 'bg-[#F3E8FF] ring-2 ring-[#7E22CE]' : 'bg-white hover:bg-[#FAF5EB]'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black text-[#86756C] uppercase tracking-wider">Trọn đời ✨</span>
            <span className="material-symbols-outlined text-[18px] text-[#7E22CE]">all_inclusive</span>
          </div>
          <p className="font-quicksand font-black text-xl sm:text-2xl text-[#3D352E] tabular-nums">{stats.lifetime}</p>
        </div>

        <div
          onClick={() => setTierFilter('EXPIRING')}
          className={`p-4 rounded-3xl border-2 border-[#3D352E] transition-all cursor-pointer shadow-[3px_3.5px_0px_#3D352E] ${
            tierFilter === 'EXPIRING' ? 'bg-[#FEEFEA] ring-2 ring-[#DE5D53]' : 'bg-white hover:bg-[#FAF5EB]'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black text-[#86756C] uppercase tracking-wider">Sắp hết hạn (&le;7d) ⏳</span>
            <span className="material-symbols-outlined text-[18px] text-[#DE5D53]">alarm</span>
          </div>
          <p className="font-quicksand font-black text-xl sm:text-2xl text-[#DE5D53] tabular-nums">{stats.expiring}</p>
        </div>

        <div
          onClick={() => setTierFilter('FREE')}
          className={`p-4 rounded-3xl border-2 border-[#3D352E] transition-all cursor-pointer shadow-[3px_3.5px_0px_#3D352E] ${
            tierFilter === 'FREE' ? 'bg-[#FAF5EB] ring-2 ring-[#3D352E]' : 'bg-white hover:bg-[#FAF5EB]'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black text-[#86756C] uppercase tracking-wider">Miễn phí 🌱</span>
            <span className="material-symbols-outlined text-[18px] text-[#86756C]">person</span>
          </div>
          <p className="font-quicksand font-black text-xl sm:text-2xl text-[#3D352E] tabular-nums">{stats.free}</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-3xl bg-[#FFFDF9] border-2 border-[#3D352E] shadow-[3px_3.5px_0px_#3D352E] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-1 w-full sm:w-auto items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-[#86756C]">search</span>
            <input
              type="text"
              placeholder="Tìm theo email, tên, id học viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-2xl bg-white border-2 border-[#3D352E] text-xs font-bold text-[#3D352E] placeholder:text-[#86756C]/70 focus:outline-none focus:ring-2 focus:ring-[#557A46]"
            />
          </div>

          {/* Tier Dropdown */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-3.5 py-2 rounded-2xl bg-white border-2 border-[#3D352E] text-xs font-black text-[#3D352E] focus:outline-none focus:ring-2 focus:ring-[#557A46]"
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
              className="px-4 py-2 rounded-2xl bg-[#DE5D53] hover:bg-[#C84F45] text-white font-black text-xs flex items-center gap-1.5 border-2 border-[#3D352E] shadow-[2px_2.5px_0px_#3D352E] active:translate-y-0.5 transition-all cursor-pointer"
            >
              <span>🎁</span>
              <span>Tặng PRO {selectedUserIds.size} người</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedUserIds.size > 0 && (
        <div className="sticky top-20 z-20 p-3 rounded-2xl bg-[#FFF9EE] border-2 border-[#3D352E] shadow-[4px_5px_0px_#3D352E] flex items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-2 text-xs font-black text-[#3D352E]">
            <span className="material-symbols-outlined text-[#DE5D53] text-[18px]">check_box</span>
            <span>Đã chọn {selectedUserIds.size} học viên</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedUserIds(new Set())}
              className="px-3 py-1.5 rounded-xl border-2 border-[#3D352E] bg-white text-xs font-bold text-[#3D352E] hover:bg-[#FAF5EB] transition-colors cursor-pointer"
            >
              Bỏ chọn
            </button>
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="px-4 py-1.5 rounded-xl bg-[#DE5D53] hover:bg-[#C84F45] text-white text-xs font-black border-2 border-[#3D352E] shadow-[1.5px_2px_0px_#3D352E] active:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>🎁</span>
              <span>Cấp PRO Hàng Loạt</span>
            </button>
          </div>
        </div>
      )}

      {/* Subscribers Table */}
      <div className="bg-white rounded-3xl border-2 border-[#3D352E] shadow-[3.5px_4px_0px_#3D352E] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF5EB] border-b-2 border-[#3D352E] text-[#6E5D53] font-black uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredProfiles.length > 0 && selectedUserIds.size === filteredProfiles.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded text-[#557A46] focus:ring-[#557A46]"
                  />
                </th>
                <th className="py-3 px-4">HỌC VIÊN</th>
                <th className="py-3 px-4">GÓI HIỆN TẠI</th>
                <th className="py-3 px-4">TRẠNG THÁI</th>
                <th className="py-3 px-4">HẠN DÙNG</th>
                <th className="py-3 px-4 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DECDBB]">
              {filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-[#86756C] font-bold">
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
                      className={`hover:bg-[#FAF5EB]/50 transition-colors ${
                        isSelected ? 'bg-[#FEF3D6]/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectUser(p.id)}
                          className="w-4 h-4 rounded text-[#557A46] focus:ring-[#557A46]"
                        />
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 border border-[#3D352E]/30 ${
                              isActivePro
                                ? 'bg-[#FFE8C2] text-[#B45309]'
                                : 'bg-[#FAF5EB] text-[#86756C]'
                            }`}
                          >
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-[#3D352E] truncate max-w-[200px]" title={p.email}>
                              {p.email || 'Chưa có email'}
                            </p>
                            {p.full_name && (
                              <p className="text-[10px] text-[#86756C] truncate max-w-[200px]">
                                {p.full_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-black text-[10px] border ${
                            isLifetime
                              ? 'bg-[#F3E8FF] text-[#7E22CE] border-[#C084FC]'
                              : isActivePro
                              ? 'bg-[#EAF3E7] text-[#557A46] border-[#8FB383]'
                              : 'bg-[#FAF5EB] text-[#86756C] border-[#3D352E]/20'
                          }`}
                        >
                          {isLifetime ? 'PRO Trọn đời ✨' : isActivePro ? p.subscription_plan || 'PRO 👑' : 'Miễn phí 🌱'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {isActivePro ? (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                              isExpiringSoon
                                ? 'bg-[#FEEFEA] text-[#DE5D53] border-[#DE5D53]'
                                : 'bg-[#EAF3E7] text-[#557A46] border-[#8FB383]'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isExpiringSoon ? 'bg-[#DE5D53] animate-pulse' : 'bg-[#557A46]'}`}></span>
                            <span>{isExpiringSoon ? 'SẮP HẾT HẠN' : 'ĐANG ACTIVE'}</span>
                          </span>
                        ) : (
                          <span className="text-[#86756C] font-bold text-[11px]">Free</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-[11px] text-[#3D352E]">
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
                            className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#FAF5EB] text-[#DE5D53] border-2 border-[#3D352E] shadow-[1.5px_1.5px_0px_#3D352E] active:translate-y-0.5 font-black text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                            title="Tặng hoặc gia hạn PRO"
                          >
                            <span>🎁</span>
                            <span>Tặng PRO</span>
                          </button>

                          {isActivePro && (
                            <button
                              onClick={() => handleRevokePro(p)}
                              disabled={isRevokingId === p.id}
                              className="p-1 rounded-xl border border-transparent hover:border-[#DE5D53] text-[#DE5D53] hover:bg-[#FEEFEA] transition-colors disabled:opacity-50 cursor-pointer"
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
