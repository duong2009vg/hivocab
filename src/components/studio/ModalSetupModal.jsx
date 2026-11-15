// src/components/studio/ModalSetupModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Server, CheckCircle2, AlertTriangle, Loader2, Copy, Check } from 'lucide-react';
import {
  getStudioApiUrl,
  setStudioApiUrl,
  checkStudioBackendStatus,
} from '../../services/studioService.js';

export function ModalSetupModal({ open, onClose, onStatusUpdated }) {
  const [urlInput, setUrlInput] = useState('');
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState(null);
  const [copiedCmd, setCopiedCmd] = useState(false);

  useEffect(() => {
    if (open) {
      setUrlInput(getStudioApiUrl());
      setStatus(null);
    }
  }, [open]);

  if (!open) return null;

  const deploySnippet = `cd PeakFour_FullSource/PeakFour
pip install modal
modal setup
modal deploy modal_app.py`;

  const handleSaveAndTest = async (e) => {
    e.preventDefault();
    const cleaned = setStudioApiUrl(urlInput);
    setUrlInput(cleaned);
    setTesting(true);
    const res = await checkStudioBackendStatus(cleaned);
    setStatus(res);
    setTesting(false);
    if (typeof onStatusUpdated === 'function') {
      onStatusUpdated(res);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(deploySnippet);
      setCopiedCmd(true);
      setTimeout(() => setCopiedCmd(false), 2000);
    } catch (_) {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl bg-[#fffcf7] border-2 border-[#3D352E] rounded-3xl shadow-[5px_5px_0px_#3D352E] p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#EEF5EC] border-2 border-[#3D352E] flex items-center justify-center">
              <Server className="w-5 h-5 text-[#4D6B53]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#2E2823]">Kết nối Modal.com AI Server</h3>
              <p className="text-xs font-semibold text-[#786F66]">
                Chạy OpenPronounce (IPA), Kokoro TTS & tách phụ đề YouTube ($30/tháng free)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl border-2 border-[#3D352E] bg-white hover:bg-[#FAF5EB] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSaveAndTest} className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-xs font-extrabold text-[#2E2823]">
              URL Endpoint từ lệnh <code className="bg-[#F4E3B4] px-1.5 py-0.5 rounded">modal deploy modal_app.py</code>
            </span>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://your-name--hivocab-peakfour-studio-fastapi-app.modal.run"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#3D352E] text-sm font-bold text-[#2E2823] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#4D6B53]/40"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={testing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4D6B53] hover:bg-[#3f5844] text-white text-xs sm:text-sm font-black border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] cursor-pointer disabled:opacity-60"
            >
              {testing && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Lưu & Kiểm tra kết nối</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setUrlInput('');
                setStudioApiUrl('');
                const emptyRes = { configured: false, online: false, kokoroReady: false, voices: [] };
                setStatus(emptyRes);
                onStatusUpdated?.(emptyRes);
              }}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF5EB] text-[#786F66] text-xs font-bold border-2 border-[#3D352E] cursor-pointer"
            >
              Xóa cấu hình
            </button>
          </div>
        </form>

        {status && (
          <div
            className={`rounded-2xl p-3 border-2 text-xs font-bold flex items-start gap-2.5 ${
              status.online
                ? 'bg-[#EEF5EC] border-[#4D6B53] text-[#355A3B]'
                : 'bg-[#FFF3D1] border-[#D9822B] text-[#8C5311]'
            }`}
          >
            {status.online ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              {status.online ? (
                <>
                  <div>
                    Đã kết nối AI Server thành công! ({status.voices.length} giọng Kokoro{' '}
                    {status.kokoroReady ? 'đã sẵn sàng' : 'đang khởi động'})
                  </div>
                  <div className="opacity-85">
                    OpenPronounce IPA & YouTube Caption Preview đã sẵn sàng hoạt động.
                  </div>
                </>
              ) : (
                <div>{status.error || 'Chưa kết nối được tới Modal.com endpoint.'}</div>
              )}
            </div>
          </div>
        )}

        {/* Quick Setup Guide */}
        <div className="bg-[#FAF5EB] border-2 border-[#3D352E] rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-black uppercase tracking-wide text-[#3D352E]">
              Hướng dẫn Deploy lên Modal.com (4 lệnh)
            </h4>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#3D352E] text-[11px] font-bold hover:bg-[#F4E3B4] cursor-pointer"
            >
              {copiedCmd ? <Check className="w-3 h-3 text-[#4D6B53]" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCmd ? 'Đã chép' : 'Chép lệnh'}</span>
            </button>
          </div>
          <pre className="bg-[#2E2823] text-[#FFF9F0] text-xs rounded-xl p-3 overflow-x-auto font-mono leading-relaxed">
            {deploySnippet}
          </pre>
          <ul className="text-xs font-semibold text-[#554D42] space-y-1 list-disc pl-4">
            <li>
              Lệnh <code className="font-mono bg-white px-1 rounded">modal setup</code> mở trình duyệt để đăng nhập tài khoản Modal ($30/tháng miễn phí).
            </li>
            <li>
              Lần deploy đầu mất ~3–5 phút để Modal tải sẵn 2 model Wav2Vec2 + Kokoro-82M vào image.
            </li>
            <li>
              Xong lệnh cuối, copy URL dạng <code className="font-mono bg-white px-1 rounded">https://...modal.run</code> dán vào ô trên (hoặc gán vào <code className="font-mono bg-white px-1 rounded">VITE_STUDIO_API_URL</code> khi build Cloudflare Pages).
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ModalSetupModal;
