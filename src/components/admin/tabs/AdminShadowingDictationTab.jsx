// src/components/admin/tabs/AdminShadowingDictationTab.jsx
// Admin configuration for Shadowing & Dictation Studio: Credit Saver mode & Modal.com AI Server
import React, { useEffect, useState } from 'react';
import {
  Zap,
  Server,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  Mic,
  Volume2,
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext.jsx';
import {
  getStudioApiUrl,
  setStudioApiUrl,
  checkStudioBackendStatus,
  getStudioCreditSaver,
  setStudioCreditSaver,
} from '../../../services/studioService.js';

const DEPLOY_SNIPPET = `cd PeakFour_FullSource/PeakFour
pip install modal
modal setup
modal deploy modal_app.py`;

export function AdminShadowingDictationTab() {
  const { showToast } = useToast();
  const [creditSaver, setCreditSaver] = useState(() => getStudioCreditSaver());
  const [urlInput, setUrlInput] = useState(() => getStudioApiUrl());
  const [testing, setTesting] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [status, setStatus] = useState(() => ({
    configured: Boolean(getStudioApiUrl()),
    online: false,
    kokoroReady: false,
    voices: [],
    error: null,
  }));

  const runHealthCheck = async (targetUrl = urlInput, silent = false) => {
    const cleaned = (targetUrl || '').trim();
    if (!cleaned) {
      setStatus({
        configured: false,
        online: false,
        kokoroReady: false,
        voices: [],
        error: 'Chưa gắn URL Modal.com AI Server.',
      });
      return;
    }
    setTesting(true);
    const res = await checkStudioBackendStatus(cleaned);
    setStatus(res);
    setTesting(false);
    if (!silent) {
      if (res.online) {
        showToast(`Đã kết nối Modal AI (${res.voices?.length || 0} giọng Kokoro)!`, 'success');
      } else {
        showToast(res.error || 'Không kết nối được tới Modal.com endpoint.', 'error');
      }
    }
  };

  useEffect(() => {
    const existing = getStudioApiUrl();
    if (existing && !getStudioCreditSaver()) {
      runHealthCheck(existing, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleCreditSaver = () => {
    const next = setStudioCreditSaver(!creditSaver);
    setCreditSaver(next);
    showToast(
      next
        ? 'Đã BẬT Tiết kiệm Credit: Studio ưu tiên trình duyệt ($0 Modal credit).'
        : 'Đã TẮT Tiết kiệm Credit: Studio dùng Kokoro TTS từ Modal AI.',
      'success',
    );
    if (!next && getStudioApiUrl() && !status.online) {
      runHealthCheck(getStudioApiUrl(), true);
    }
  };

  const handleSaveAndTest = async (e) => {
    e.preventDefault();
    const cleaned = setStudioApiUrl(urlInput);
    setUrlInput(cleaned);
    if (!cleaned) {
      showToast('Vui lòng nhập URL hợp lệ hoặc bấm Xóa cấu hình.', 'info');
      return;
    }
    await runHealthCheck(cleaned, false);
  };

  const handleClearConfig = () => {
    setUrlInput('');
    setStudioApiUrl('');
    setStatus({
      configured: false,
      online: false,
      kokoroReady: false,
      voices: [],
      error: null,
    });
    showToast('Đã xóa cấu hình URL Modal AI cục bộ.', 'info');
  };

  const handleCopySnippet = async () => {
    try {
      await navigator.clipboard.writeText(DEPLOY_SNIPPET);
      setCopiedCmd(true);
      setTimeout(() => setCopiedCmd(false), 2000);
    } catch (_) {}
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-5xl font-nunito text-[#3D352E]">
      {/* Section 1: Credit Saver Toggle */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border-2 border-[#3D352E] shadow-[2.5px_3px_0px_#3D352E] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-11 h-11 rounded-2xl border-2 border-[#3D352E] flex items-center justify-center shrink-0 ${
                creditSaver ? 'bg-[#EEF5EC] text-[#355A3B]' : 'bg-[#FFF3D1] text-[#8C5311]'
              }`}
            >
              <Zap className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-black font-quicksand text-[#3D352E]">
                  Chế độ Tiết kiệm Credit (Modal AI)
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full border border-[#3D352E] text-[11px] font-black uppercase ${
                    creditSaver
                      ? 'bg-[#EEF5EC] text-[#355A3B]'
                      : 'bg-[#FFF3D1] text-[#8C5311]'
                  }`}
                >
                  {creditSaver ? 'Đang BẬT' : 'Đang TẮT (Kokoro TTS)'}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-[#6E5D53] leading-relaxed">
                Kiểm soát cách Studio sử dụng GPU trên Modal.com cho toàn bộ tính năng Shadowing, Dictation & IPA Lab.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleCreditSaver}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-xs sm:text-sm font-black cursor-pointer active:translate-y-0.5 transition-all shrink-0 ${
              creditSaver
                ? 'bg-[#4D6B53] hover:bg-[#3f5844] text-white'
                : 'bg-[#FFF3D1] hover:bg-[#F4E3B4] text-[#8C5311]'
            }`}
          >
            <Zap className="w-4 h-4 shrink-0" />
            <span>{creditSaver ? 'Tiết kiệm Credit: BẬT' : 'Tiết kiệm Credit: TẮT (Kokoro)'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div
            className={`p-3.5 rounded-xl border-2 transition-colors ${
              creditSaver
                ? 'bg-[#EEF5EC] border-[#4D6B53]'
                : 'bg-[#FAF5EB] border-[#3D352E]/25 opacity-75'
            }`}
          >
            <p className="text-xs font-black text-[#355A3B] mb-1">Khi BẬT (Khuyên dùng - $0 GPU nền)</p>
            <ul className="text-xs font-semibold text-[#554D42] space-y-1 list-disc pl-4">
              <li>Không ping đánh thức container Modal khi mở trang Studio.</li>
              <li>Ưu tiên âm thanh có sẵn & Web Speech API chấm giọng ngay tại trình duyệt (0s · Free).</li>
              <li>Chỉ gọi Modal khi bấm &ldquo;Chấm Sâu IPA (AI Modal)&rdquo; hoặc tách phụ đề YouTube mới.</li>
            </ul>
          </div>
          <div
            className={`p-3.5 rounded-xl border-2 transition-colors ${
              !creditSaver
                ? 'bg-[#FFF3D1] border-[#D9822B]'
                : 'bg-[#FAF5EB] border-[#3D352E]/25 opacity-75'
            }`}
          >
            <p className="text-xs font-black text-[#8C5311] mb-1">Khi TẮT (Ưu tiên Kokoro AI TTS)</p>
            <ul className="text-xs font-semibold text-[#554D42] space-y-1 list-disc pl-4">
              <li>Kiểm tra kết nối Modal.com ngay khi vào Studio.</li>
              <li>Dùng 28+ giọng Kokoro-82M tự nhiên trên Modal GPU để phát mẫu IPA & Dictation.</li>
              <li>Tiêu tốn credit Modal theo lượng request TTS và OpenPronounce thực tế.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section 2: Modal.com AI Server Configuration */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border-2 border-[#3D352E] shadow-[2.5px_3px_0px_#3D352E] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#F0F5FF] border-2 border-[#3D352E] flex items-center justify-center text-[#3D5A80] shrink-0">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black font-quicksand text-[#3D352E]">
                Kết nối Modal.com AI Server
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-[#6E5D53]">
                Chạy OpenPronounce (chấm IPA Wav2Vec2), Kokoro-82M TTS &amp; tách phụ đề YouTube
              </p>
            </div>
          </div>

          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-[#3D352E] text-xs font-black shrink-0 ${
              status.online
                ? 'bg-[#EEF5EC] text-[#355A3B]'
                : status.configured
                  ? 'bg-[#FAF5EB] text-[#6E5D53]'
                  : 'bg-[#FFF3D1] text-[#8C5311]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                status.online ? 'bg-[#4D6B53] animate-pulse' : 'bg-[#D9822B]'
              }`}
            />
            <span>
              {status.online
                ? 'Modal AI: Đã kết nối'
                : status.configured
                  ? 'Modal AI: Sẵn sàng (chưa ping)'
                  : 'Modal AI: Chưa gắn URL'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveAndTest} className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-xs font-extrabold text-[#3D352E]">
              URL Endpoint từ lệnh{' '}
              <code className="bg-[#F4E3B4] px-1.5 py-0.5 rounded font-mono">modal deploy modal_app.py</code>
            </span>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://your-name--hivocab-peakfour-studio-fastapi-app.modal.run"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5EB] border-2 border-[#3D352E] text-sm font-bold text-[#2E2823] placeholder:text-stone-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#4D6B53]/40"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={testing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4D6B53] hover:bg-[#3f5844] text-white text-xs sm:text-sm font-black border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] cursor-pointer disabled:opacity-60 active:translate-y-0.5 transition-all"
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span>{testing ? 'Đang kiểm tra...' : 'Lưu & Kiểm tra kết nối'}</span>
            </button>

            <button
              type="button"
              onClick={handleClearConfig}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF5EB] text-[#6E5D53] text-xs font-bold border-2 border-[#3D352E] cursor-pointer"
            >
              Xóa cấu hình
            </button>
          </div>
        </form>

        {(status.online || status.error) && (
          <div
            className={`rounded-2xl p-3.5 border-2 text-xs font-bold flex items-start gap-2.5 ${
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
            <div className="space-y-1">
              {status.online ? (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5" />
                      {status.voices?.length || 0} giọng Kokoro{' '}
                      {status.kokoroReady ? '(đã sẵn sàng)' : '(chế độ khởi động lười)'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Mic className="w-3.5 h-3.5" />
                      OpenPronounce IPA sẵn sàng
                    </span>
                  </div>
                  <p className="opacity-85">
                    Endpoint hoạt động bình thường cho Shadowing, Dictation và IPA Lab.
                  </p>
                </>
              ) : (
                <div>{status.error}</div>
              )}
            </div>
          </div>
        )}

        {/* Deploy Quick Reference */}
        <div className="bg-[#FAF5EB] border-2 border-[#3D352E] rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-black uppercase tracking-wide text-[#3D352E]">
              Hướng dẫn Deploy Backend lên Modal.com (4 lệnh)
            </h3>
            <button
              type="button"
              onClick={handleCopySnippet}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#3D352E] text-[11px] font-bold hover:bg-[#F4E3B4] cursor-pointer"
            >
              {copiedCmd ? <Check className="w-3 h-3 text-[#4D6B53]" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCmd ? 'Đã chép' : 'Chép lệnh'}</span>
            </button>
          </div>
          <pre className="bg-[#2E2823] text-[#FFF9F0] text-xs rounded-xl p-3 overflow-x-auto font-mono leading-relaxed">
            {DEPLOY_SNIPPET}
          </pre>
          <p className="text-xs font-semibold text-[#554D42]">
            Ghi chú: Giá trị mặc định toàn hệ thống được lấy từ biến môi trường{' '}
            <code className="font-mono bg-white px-1 rounded">VITE_STUDIO_API_URL</code> trên Cloudflare Pages; ô nhập trên cho phép ghi đè URL kiểm thử ngay trên trình duyệt Admin.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminShadowingDictationTab;
