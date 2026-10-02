// src/components/admin/modals/GrantProModal.jsx
// Modal for Granting / Extending PRO Subscriptions manually (single or bulk)
import React, { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient.js';
import { useToast } from '../../../context/ToastContext.jsx';

export function GrantProModal({
  isOpen,
  onClose,
  targetUser,       // { id, email, expiresAt } or null if bulk
  selectedUsers,    // Array of { id, email, expiresAt } for bulk
  onSuccess,
}) {
  const { showToast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState('1m'); // '1m' | '6m' | '1y' | 'lifetime' | 'custom'
  const [customDays, setCustomDays] = useState(30);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isBulk = Boolean(selectedUsers && selectedUsers.length > 0 && !targetUser);
  const userCount = isBulk ? selectedUsers.length : 1;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const now = new Date();
    const isLifetime = selectedPlan === 'lifetime';
    let daysToAdd = 30;

    if (selectedPlan === '1m') daysToAdd = 30;
    else if (selectedPlan === '6m') daysToAdd = 180;
    else if (selectedPlan === '1y') daysToAdd = 365;
    else if (selectedPlan === 'custom') daysToAdd = Math.max(1, parseInt(customDays, 10) || 30);

    const targets = isBulk ? selectedUsers : [targetUser];

    try {
      for (const target of targets) {
        if (!target?.id) continue;

        // Calculate expires_at (extend if existing active subscription)
        let newExpiresAt = null;
        if (!isLifetime) {
          const currentExp = target.expiresAt ? new Date(target.expiresAt) : null;
          const baseTime = (currentExp && currentExp > now) ? currentExp.getTime() : now.getTime();
          newExpiresAt = new Date(baseTime + daysToAdd * 24 * 60 * 60 * 1000).toISOString();
        }

        const planCode = isLifetime ? 'pro_lifetime' : `pro_${selectedPlan === 'custom' ? `${daysToAdd}d` : selectedPlan}`;

        // 1. Update profiles table
        const { error: profErr } = await supabase
          .from('profiles')
          .update({
            tier: isLifetime ? 'lifetime' : 'pro',
            subscription_plan: planCode,
            subscription_status: 'active',
            subscription_started_at: now.toISOString(),
            subscription_expires_at: newExpiresAt,
            is_pro: true,
          })
          .eq('id', target.id);

        if (profErr) {
          console.error(`Failed to update profile for ${target.email}:`, profErr);
          throw profErr;
        }

        // 2. Insert gift order record for accounting & auditing
        await supabase
          .from('orders')
          .insert({
            order_code: Math.floor(100000000 + Math.random() * 900000000),
            user_id: target.id,
            user_email: target.email || '',
            amount: 0,
            plan_id: planCode,
            status: 'PAID',
            payment_method: 'MANUAL_GIFT',
            payment_time: now.toISOString(),
          })
          .catch((err) => console.warn('Record gift order failed (non-critical):', err));
      }

      showToast(`Đã tặng gói PRO thành công cho ${userCount} học viên! 🎉`, 'success');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('handleGrantProSubmit error:', err);
      showToast(`Lỗi khi cấp PRO: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-surface w-full max-w-lg rounded-2xl border border-outline-variant/20 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-outline-variant/15 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">card_giftcard</span>
            </div>
            <div>
              <h2 className="font-bold text-base text-on-surface">
                {isBulk ? `Tặng Gói PRO Hàng Loạt (${userCount} học viên)` : 'Tặng Quyền HiVocab PRO'}
              </h2>
              <p className="text-xs text-on-surface-variant">Cấp đặc quyền học không giới hạn</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/* Target Info */}
          {isBulk ? (
            <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20">
              <p className="text-xs font-semibold text-on-surface mb-1.5">Danh sách {userCount} học viên được chọn:</p>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {selectedUsers.map((u) => (
                  <span
                    key={u.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface text-[11px] font-mono border border-outline-variant/20 text-on-surface"
                  >
                    {u.email}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Email học viên</label>
              <input
                type="text"
                disabled
                value={targetUser?.email || ''}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/20 text-xs font-mono text-on-surface opacity-80"
              />
            </div>
          )}

          {/* Plan Selector */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-2">Chọn thời hạn tặng</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: '1m', title: '1 Tháng', subtitle: '+30 ngày', badge: 'Tiêu chuẩn' },
                { id: '6m', title: '6 Tháng', subtitle: '+180 ngày', badge: 'Phổ biến' },
                { id: '1y', title: '1 Năm', subtitle: '+365 ngày', badge: 'Ưu đãi' },
                { id: 'lifetime', title: 'Trọn Đời', subtitle: 'Không hết hạn', badge: 'Vĩnh viễn' },
              ].map((plan) => (
                <button
                  type="button"
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`p-3 rounded-xl border text-left transition-all relative ${
                    selectedPlan === plan.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-outline-variant/20 bg-surface hover:bg-surface-container'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-on-surface">{plan.title}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-surface-container text-on-surface-variant">
                      {plan.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">{plan.subtitle}</p>
                </button>
              ))}
            </div>

            {/* Custom Days Radio */}
            <div className="mt-2 flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-on-surface">
                <input
                  type="radio"
                  name="plan_radio"
                  checked={selectedPlan === 'custom'}
                  onChange={() => setSelectedPlan('custom')}
                  className="text-primary focus:ring-primary"
                />
                <span>Tùy chỉnh số ngày:</span>
              </label>

              {selectedPlan === 'custom' && (
                <input
                  type="number"
                  min="1"
                  max="3650"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  className="w-24 px-2.5 py-1 rounded-lg border border-outline-variant/30 bg-surface text-xs font-mono text-on-surface"
                />
              )}
            </div>
          </div>

          {/* Reason Note */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">Ghi chú / Lý do (tùy chọn)</label>
            <input
              type="text"
              placeholder="VD: Quà tặng sự kiện, Học viên xuất sắc..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-outline-variant/20 bg-surface text-xs text-on-surface focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-outline-variant/20 text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">card_giftcard</span>
                  <span>Xác nhận Tặng PRO</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GrantProModal;
