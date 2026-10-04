// src/components/admin/tabs/AdminSystemTab.jsx
// System Health, Supabase Ping, Cache Invalidation & Environment Audit
// Cozy Crayon Handcrafted Design System
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
      const key = localStorage.key(i);
      if (k && !k.startsWith('sb-') && k !== 'theme') {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    showToast('Đã dọn dẹp bộ nhớ đệm cache ứng dụng! 🧹', 'success');
    setStorageUsage({
      itemsCount: localStorage.length,
      approxSizeKb: '0.0',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl font-nunito text-[#3D352E]">
      {/* Infrastructure Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Supabase Status */}
        <div className="p-6 rounded-3xl bg-white border-2 border-[#3D352E] shadow-[3.5px_4px_0px_#3D352E] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black font-quicksand uppercase tracking-wider text-[#6E5D53]">
                Cơ sở Dữ liệu
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#EAF3E7] border-2 border-[#3D352E] flex items-center justify-center text-[#557A46]">
                <span className="material-symbols-outlined text-[18px]">database</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full border-2 border-[#3D352E] ${
                  dbStatus === 'connected' ? 'bg-[#557A46] animate-pulse' : 'bg-[#DE5D53]'
                }`}
              ></span>
              <span className="text-base font-black font-quicksand text-[#3D352E]">
                {dbStatus === 'connected' ? 'Supabase Trực tuyến ⚡' : 'Mất kết nối ⚠️'}
              </span>
            </div>
            <p className="text-xs text-[#6E5D53] mt-1.5 font-mono font-bold">
              {latency ? `Độ trễ API: ${latency}ms` : 'Đang kiểm tra kết nối...'}
            </p>
          </div>

          <button
            onClick={checkPing}
            disabled={isPinging}
            className="mt-5 w-full py-2.5 px-3 rounded-2xl bg-[#FAF5EB] hover:bg-[#F2ECE0] border-2 border-[#3D352E] shadow-[2px_2.5px_0px_#3D352E] text-xs font-bold text-[#3D352E] flex items-center justify-center gap-1.5 active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[16px] ${isPinging ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>{isPinging ? 'Đang đo...' : 'Đo lại Ping 🔄'}</span>
          </button>
        </div>

        {/* Local Storage Cache */}
        <div className="p-6 rounded-3xl bg-white border-2 border-[#3D352E] shadow-[3.5px_4px_0px_#3D352E] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black font-quicksand uppercase tracking-wider text-[#6E5D53]">
                Bộ nhớ Trình duyệt
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#FFF9EE] border-2 border-[#3D352E] flex items-center justify-center text-[#F4B41A]">
                <span className="material-symbols-outlined text-[18px]">memory</span>
              </div>
            </div>
            <p className="text-base font-black font-quicksand text-[#3D352E]">
              {storageUsage.itemsCount} Mục lưu trữ
            </p>
            <p className="text-xs text-[#6E5D53] mt-1.5 font-mono font-bold">
              ~{storageUsage.approxSizeKb} KB đã ghi bộ nhớ
            </p>
          </div>

          <button
            onClick={handleClearClientCache}
            className="mt-5 w-full py-2.5 px-3 rounded-2xl bg-[#FFF0E6] hover:bg-[#FFE3D4] border-2 border-[#3D352E] shadow-[2px_2.5px_0px_#3D352E] text-xs font-bold text-[#DE5D53] flex items-center justify-center gap-1.5 active:translate-y-0.5 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
            <span>Dọn dẹp Cache 🧹</span>
          </button>
        </div>

        {/* Environment */}
        <div className="p-6 rounded-3xl bg-white border-2 border-[#3D352E] shadow-[3.5px_4px_0px_#3D352E] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black font-quicksand uppercase tracking-wider text-[#6E5D53]">
                Môi trường Máy chủ
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#F0F5FF] border-2 border-[#3D352E] flex items-center justify-center text-[#4A72B2]">
                <span className="material-symbols-outlined text-[18px]">cloud</span>
              </div>
            </div>
            <p className="text-base font-black font-quicksand text-[#3D352E]">Cloudflare Pages</p>
            <p className="text-xs text-[#6E5D53] mt-1.5 font-bold">
              Vite 4.3 + React 19.3 SPA
            </p>
          </div>

          <div className="mt-5 py-2.5 px-3 rounded-2xl bg-[#FAF5EB] border-2 border-[#3D352E] text-center text-xs font-mono font-black text-[#557A46]">
            🌱 v2.4-production
          </div>
        </div>
      </div>

      {/* Architecture System Information Card */}
      <div className="p-6 rounded-3xl bg-white border-2 border-[#3D352E] shadow-[3.5px_4px_0px_#3D352E] space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b-2 border-[#EADDC7]">
          <span className="text-xl">🛠️</span>
          <h4 className="text-sm font-black font-quicksand uppercase tracking-wider text-[#3D352E]">
            Thông số Kỹ thuật & Cấu hình Cốt lõi
          </h4>
        </div>
        <div className="divide-y-2 divide-[#FAF5EB] text-xs font-bold">
          <div className="py-3 flex items-center justify-between">
            <span className="text-[#6E5D53]">Kiến trúc Ứng dụng</span>
            <span className="font-black text-[#3D352E]">React 19 Pure SPA (Zero DOM mutation) ⚡</span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <span className="text-[#6E5D53]">Cổng Thanh toán Tự động</span>
            <span className="font-black text-[#3D352E]">PayOS VietQR HMAC-SHA256 💳</span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <span className="text-[#6E5D53]">Cơ chế Bảo mật Tuyến đường</span>
            <span className="font-black text-[#DE5D53] bg-[#FFF0E6] px-2.5 py-0.5 rounded-full border-2 border-[#DE5D53]">
              AdminProtectedRoute (Role: admin) 🛡️
            </span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <span className="text-[#6E5D53]">Đồng bộ Trạng thái PRO</span>
            <span className="font-mono text-[#557A46] bg-[#EAF3E7] px-2.5 py-0.5 rounded-full border-2 border-[#557A46]">
              profiles.tier + subscription_expires_at + is_pro
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminSystemTab;
