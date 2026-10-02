// src/components/admin/tabs/AdminSystemTab.jsx
// System Health, Supabase Ping, Cache Invalidation & Environment Audit
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient.js';
import { useToast } from '../../../context/ToastContext.jsx';

export function AdminSystemTab() {
  const { showToast } = useToast();
  const [latency, setLatency] = useState(null);
  const [dbStatus, setDbStatus] = useState('checking'); // 'connected' | 'error' | 'checking'
  const [isPinging, setIsPinging] = useState(false);
  const [storageUsage, setStorageUsage] = useState({ itemsCount: 0, approxSizeKb: 0 });

  const checkPing = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      const end = performance.now();
      if (error) throw error;
      setLatency(Math.round(end - start));
      setDbStatus('connected');
    } catch (err) {
      console.warn('Ping error:', err);
      setDbStatus('error');
      setLatency(null);
    } finally {
      setIsPinging(false);
    }
  };

  useEffect(() => {
    checkPing();

    // Check localStorage usage
    let totalBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const val = localStorage.getItem(key);
      totalBytes += (key?.length || 0) + (val?.length || 0);
    }
    setStorageUsage({
      itemsCount: localStorage.length,
      approxSizeKb: (totalBytes / 1024).toFixed(1),
    });
  }, []);

  const handleClearClientCache = () => {
    if (!window.confirm('Xóa bộ nhớ đệm trình duyệt (cache nội bộ)? Phiên đăng nhập sẽ được giữ nguyên.')) {
      return;
    }
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && !k.startsWith('sb-') && k !== 'theme') {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    showToast('Đã xóa bộ nhớ đệm cache ứng dụng thành công!', 'success');
    setStorageUsage({
      itemsCount: localStorage.length,
      approxSizeKb: '0.0',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Infrastructure Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Supabase Status */}
        <div className="p-5 rounded-2xl bg-surface border border-outline-variant/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">Cơ sở Dữ liệu</span>
              <span className="material-symbols-outlined text-primary text-[20px]">database</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  dbStatus === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              ></span>
              <span className="text-sm font-bold text-on-surface">
                {dbStatus === 'connected' ? 'Supabase Trực tuyến' : 'Mất kết nối'}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1 font-mono">
              {latency ? `Độ trễ API: ${latency}ms` : 'Đang kiểm tra...'}
            </p>
          </div>

          <button
            onClick={checkPing}
            disabled={isPinging}
            className="mt-4 px-3 py-1.5 rounded-xl border border-outline-variant/20 hover:bg-surface-container text-xs font-semibold text-on-surface flex items-center justify-center gap-1 transition-all"
          >
            <span className={`material-symbols-outlined text-[15px] ${isPinging ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>Đo lại Ping</span>
          </button>
        </div>

        {/* Local Storage Cache */}
        <div className="p-5 rounded-2xl bg-surface border border-outline-variant/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">Bộ nhớ Trình duyệt</span>
              <span className="material-symbols-outlined text-amber-500 text-[20px]">memory</span>
            </div>
            <p className="text-sm font-bold text-on-surface">
              {storageUsage.itemsCount} Mục lưu trữ
            </p>
            <p className="text-xs text-on-surface-variant mt-1 font-mono">
              ~{storageUsage.approxSizeKb} KB đã dùng
            </p>
          </div>

          <button
            onClick={handleClearClientCache}
            className="mt-4 px-3 py-1.5 rounded-xl border border-outline-variant/20 hover:bg-surface-container text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1 transition-all"
          >
            <span className="material-symbols-outlined text-[15px]">delete_sweep</span>
            <span>Dọn dẹp Cache</span>
          </button>
        </div>

        {/* Environment */}
        <div className="p-5 rounded-2xl bg-surface border border-outline-variant/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">Môi trường</span>
              <span className="material-symbols-outlined text-purple-500 text-[20px]">cloud</span>
            </div>
            <p className="text-sm font-bold text-on-surface">Cloudflare Pages</p>
            <p className="text-xs text-on-surface-variant mt-1">
              Vite 4.3 + React 19.3 SPA
            </p>
          </div>

          <div className="mt-4 px-3 py-1.5 rounded-xl bg-surface-container/60 text-center text-[11px] font-mono font-semibold text-on-surface">
            v2.4-production
          </div>
        </div>
      </div>

      {/* Architecture System Information Card */}
      <div className="p-5 rounded-2xl bg-surface border border-outline-variant/20 space-y-3">
        <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">Thông số Kỹ thuật Hệ thống</h4>
        <div className="divide-y divide-outline-variant/10 text-xs">
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-on-surface-variant">Kiến trúc Ứng dụng</span>
            <span className="font-semibold text-on-surface">React 19 Pure SPA (Zero DOM mutation)</span>
          </div>
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-on-surface-variant">Cổng Thanh toán</span>
            <span className="font-semibold text-on-surface">PayOS VietQR HMAC-SHA256</span>
          </div>
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-on-surface-variant">Cơ chế Bảo mật Tuyến đường</span>
            <span className="font-semibold text-on-surface">AdminProtectedRoute (Role: admin)</span>
          </div>
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-on-surface-variant">Đồng bộ Gói PRO</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
              profiles.tier + profiles.subscription_expires_at + profiles.is_pro
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminSystemTab;
