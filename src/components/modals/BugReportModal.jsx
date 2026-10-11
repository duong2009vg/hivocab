// src/components/modals/BugReportModal.jsx
// Cozy Crayon Handcrafted Bug Report & Feedback Modal with Hidden Diagnostic Browser Logs
import React, { useState, useEffect } from 'react';
import { useModal } from '../../context/ModalContext.jsx';
import { useAuth } from '../../providers/AuthProvider.jsx';
import { supabase } from '../../lib/supabaseClient.js';
import { getBrowserDiagnosticLogs } from '../../utils/browserLogger.js';

const FEEDBACK_SUBTYPES = [
  { id: 'feature_request', label: '💡 Gợi ý tính năng mới', desc: 'Ý tưởng bạn muốn HiVocab phát triển' },
  { id: 'ui_ux_improve', label: '🎨 Cải tiến giao diện & trải nghiệm', desc: 'Góp ý màu sắc, nút bấm, bố cục dễ dùng hơn' },
  { id: 'content_request', label: '📚 Đề xuất thêm chủ đề / bài học', desc: 'Bộ từ vựng, tài liệu bạn mong muốn có trên app' },
  { id: 'other_feedback', label: '💬 Phản hồi khác', desc: 'Bất kỳ chia sẻ hay cảm nghĩ nào của bạn' },
];

const BUG_SUBTYPES = [
  { id: 'wrong_answer', label: '❌ Sai đáp án / Dịch thuật', desc: 'Nghĩa từ, phiên âm, ví dụ hoặc đáp án chưa đúng' },
  { id: 'audio_error', label: '🔊 Lỗi âm thanh / Phát âm', desc: 'Không nghe được âm thanh hoặc giọng đọc sai' },
  { id: 'ui_bug', label: '📱 Lỗi giao diện / Không bấm được', desc: 'Nút bị đơ, tràn viền, trắng trang hoặc che khuất' },
  { id: 'exam_error', label: '📝 Lỗi phòng luyện đề thi', desc: 'Lỗi câu hỏi, đồng hồ đếm giờ hoặc bảng nộp bài' },
  { id: 'other_bug', label: '⚠️ Lỗi kỹ thuật khác', desc: 'Các vấn đề phát sinh khác trong quá trình học' },
];

export function BugReportModal() {
  const { modals, closeModal } = useModal();
  const { user } = useAuth();
  const modalState = modals?.bugReport;
  const isOpen = Boolean(modalState?.open);

  const [activeTab, setActiveTab] = useState('feedback'); // 'feedback' | 'bug'
  const [subType, setSubType] = useState('feature_request');
  const [description, setDescription] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnostics, setDiagnostics] = useState(null);

  // Sync state ONLY ONCE when modal is opened
  useEffect(() => {
    if (!isOpen) return;

    const data = modalState?.data || {};
    const mode = data.initialType === 'feedback' || data.isFeedback ? 'feedback' : 'bug';
    setActiveTab(mode);
    setSubType(mode === 'feedback' ? 'feature_request' : 'wrong_answer');
    setDescription('');
    setUserEmail(user?.email || '');
    setShowDiagnostics(false);
    setIsSubmitting(false);

    try {
      setDiagnostics(getBrowserDiagnosticLogs());
    } catch (_) {
      setDiagnostics(null);
    }
  }, [isOpen]); // CRITICAL: only depends on isOpen, never on data object or form state!

  if (!isOpen) return null;

  const data = modalState?.data || {};
  const feature = data.feature || data.featureContext || 'Chung';
  const contextData = data.contextData || {};
  const title = data.title || (activeTab === 'feedback' ? 'Góp ý phát triển HiVocab' : 'Báo cáo sự cố & Lỗi ứng dụng');

  // When switching between Feedback and Bug tab
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSubType(tab === 'feedback' ? 'feature_request' : 'wrong_answer');
  };

  const currentSubtypes = activeTab === 'feedback' ? FEEDBACK_SUBTYPES : BUG_SUBTYPES;
  const selectedSubtypeObj = currentSubtypes.find((s) => s.id === subType) || currentSubtypes[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = description.trim();
    if (!text) {
      if (typeof window !== 'undefined' && window.showHiToast) {
        window.showHiToast('Vui lòng nhập nội dung mô tả chi tiết!', 'error');
      } else {
        alert('Vui lòng nhập nội dung mô tả chi tiết!');
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const freshLogs = getBrowserDiagnosticLogs();
      const reportTypeLabel = activeTab === 'feedback' ? 'Góp ý' : 'Báo lỗi';

      const payload = {
        user_id: user?.id ?? null,
        user_email: userEmail.trim() || user?.email || null,
        report_type: reportTypeLabel,
        feature_context: feature || (activeTab === 'feedback' ? 'Hồ sơ cá nhân / Góp ý' : 'Báo lỗi hệ thống'),
        description: `[${selectedSubtypeObj?.label || subType}] ${text}`,
        context_data: {
          ...contextData,
          subType,
          subTypeLabel: selectedSubtypeObj?.label,
          modalTitle: title,
          targetWord: contextData?.word || null,
          targetUrl: window.location.href,
        },
        device_info: freshLogs,
        status: 'pending',
      };

      const { error } = await supabase.from('user_bug_reports').insert(payload);
      if (error) throw error;

      const successMsg = activeTab === 'feedback'
        ? 'Cảm ơn bạn! Ý kiến đóng góp quý báu đã được gửi tới đội ngũ HiVocab 🌟'
        : 'Cảm ơn bạn! Báo cáo lỗi kèm log hệ thống đã được gửi tới quản trị viên 🛠️';

      if (typeof window !== 'undefined' && window.showHiToast) {
        window.showHiToast(successMsg, 'success');
      } else {
        alert(successMsg);
      }

      setDescription('');
      closeModal('bugReport');
    } catch (err) {
      console.error('[BugReportModal] Submit error:', err);
      const errMsg = err?.message || 'Có lỗi khi gửi báo cáo, vui lòng thử lại sau.';
      if (typeof window !== 'undefined' && window.showHiToast) {
        window.showHiToast(errMsg, 'error');
      } else {
        alert(errMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="modal-bug-report"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) closeModal('bugReport');
      }}
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#FAF5EB] rounded-[28px] border-3 border-[#3D352E] shadow-[6px_8px_0px_#3D352E] p-5 sm:p-7 text-[#302A24] space-y-4 max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-dashed border-[#D9CEBA] pb-3.5">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl border-2 border-[#3D352E] flex items-center justify-center text-xl shadow-[2px_2px_0px_#3D352E] ${
              activeTab === 'feedback' ? 'bg-[#FFF2B2] text-[#B87A00]' : 'bg-[#FEEFEA] text-[#DE5D53]'
            }`}>
              {activeTab === 'feedback' ? '⭐' : '🐞'}
            </div>
            <div>
              <h3 className="text-lg font-black text-[#302A24] font-quicksand leading-tight">
                {activeTab === 'feedback' ? 'Góp ý phát triển HiVocab' : 'Báo cáo lỗi & Phản hồi'}
              </h3>
              <p className="text-xs text-[#786F66] font-semibold mt-0.5">
                Đội ngũ kỹ thuật luôn lắng nghe để cải thiện ứng dụng mỗi ngày
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => closeModal('bugReport')}
            disabled={isSubmitting}
            className="w-9 h-9 rounded-xl bg-white border-2 border-[#3D352E] hover:bg-[#EFE7DA] flex items-center justify-center text-[#3D352E] transition-all cursor-pointer shadow-[1.5px_1.5px_0px_#3D352E]"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Tab switch between Feedback & Bug Report */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#EFE7DA] rounded-2xl border-2 border-[#3D352E]">
          <button
            type="button"
            onClick={() => handleTabChange('feedback')}
            className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'feedback'
                ? 'bg-white text-[#302A24] border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E]'
                : 'text-[#6E5D53] hover:text-[#302A24]'
            }`}
          >
            <span>💡</span>
            <span>Góp ý &amp; Đề xuất</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('bug')}
            className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'bug'
                ? 'bg-[#DE5D53] text-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E]'
                : 'text-[#6E5D53] hover:text-[#302A24]'
            }`}
          >
            <span>🚨</span>
            <span>Báo cáo sự cố</span>
          </button>
        </div>

        {/* Context Chip */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white border border-[#3D352E] text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[#DE5D53] font-bold">📍 Vị trí:</span>
            <span className="font-bold text-[#302A24] truncate">{feature}</span>
          </div>
          {contextData?.word && (
            <span className="px-2 py-0.5 rounded-lg bg-[#FAF5EB] border border-[#3D352E] text-[11px] font-bold text-[#C85A3F] shrink-0">
              Từ: {contextData.word}
            </span>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Subtype selector */}
          <div>
            <label className="block text-xs font-black text-[#302A24] uppercase tracking-wider mb-1.5">
              Phân loại vấn đề:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentSubtypes.map((st) => {
                const isSelected = subType === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSubType(st.id)}
                    className={`p-2.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-center ${
                      isSelected
                        ? 'bg-white border-[#3D352E] shadow-[2px_2.5px_0px_#3D352E] ring-1 ring-[#3D352E]'
                        : 'bg-[#F5EFE3] border-[#D9CEBA] hover:bg-white text-[#6E5D53]'
                    }`}
                  >
                    <span className={`text-xs font-black ${isSelected ? 'text-[#302A24]' : 'text-[#6E5D53]'}`}>
                      {st.label}
                    </span>
                    <span className="text-[10px] text-[#786F66] line-clamp-1 mt-0.5">
                      {st.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Email field */}
          <div>
            <label className="block text-xs font-black text-[#302A24] uppercase tracking-wider mb-1">
              Email nhận phản hồi {user ? '(tự động liên kết tài khoản)' : '(tùy chọn)'}:
            </label>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="nhap.email@example.com để admin liên hệ giải đáp..."
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#3D352E] bg-white text-xs font-bold text-[#302A24] focus:outline-none focus:ring-2 focus:ring-[#C85A3F] placeholder:text-[#9E8E84]"
            />
          </div>

          {/* Description textarea */}
          <div>
            <label className="block text-xs font-black text-[#302A24] uppercase tracking-wider mb-1">
              Mô tả chi tiết <span className="text-[#DE5D53]">*</span>:
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                activeTab === 'feedback'
                  ? 'Hãy chia sẻ mong muốn, gợi ý giao diện hoặc tính năng bạn muốn có trên HiVocab...'
                  : 'Hãy mô tả cụ thể lỗi bạn vừa gặp phải, các bước dẫn đến lỗi hoặc đáp án bạn cho là chính xác...'
              }
              className="w-full p-3 rounded-2xl border-2 border-[#3D352E] bg-white text-xs font-medium text-[#302A24] focus:outline-none focus:ring-2 focus:ring-[#C85A3F] resize-none placeholder:text-[#9E8E84] leading-relaxed"
            ></textarea>
          </div>

          {/* Diagnostic Logs Preview Accordion */}
          <div className="rounded-2xl border-2 border-[#3D352E] bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setShowDiagnostics((prev) => !prev)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-[#6E5D53] hover:text-[#302A24] hover:bg-[#FAF5EB] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#557A46]">terminal</span>
                <span>Tự động đính kèm log trình duyệt &amp; thiết bị ẩn</span>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-[#EAF3E7] text-[#557A46] border border-[#8DAA68]">
                  {diagnostics?.browser || 'Browser'} • {diagnostics?.os || 'OS'}
                </span>
              </div>
              <span className="material-symbols-outlined text-[18px]">
                {showDiagnostics ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {showDiagnostics && (
              <div className="p-3 bg-[#2D2620] text-[#FAF5EB] text-[11px] font-mono border-t-2 border-[#3D352E] space-y-1.5 max-h-36 overflow-y-auto">
                <div className="text-[#8FB383] font-bold pb-1 border-b border-white/10">
                  Hệ thống: {diagnostics?.os} • {diagnostics?.browser} • Màn hình: {diagnostics?.screenResolution} (Viewport: {diagnostics?.viewport})
                </div>
                <div>URL: {diagnostics?.url}</div>
                <div>Mạng: {diagnostics?.network?.online ? 'Online' : 'Offline'} ({diagnostics?.network?.effectiveType})</div>
                <div>Lỗi JS gần nhất: {diagnostics?.recentErrors?.length || 0} lỗi</div>
                {diagnostics?.recentErrors?.length > 0 && (
                  <pre className="text-[10px] text-[#F4B41A] whitespace-pre-wrap mt-1">
                    {JSON.stringify(diagnostics.recentErrors, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t-2 border-dashed border-[#D9CEBA]">
            <button
              type="button"
              onClick={() => closeModal('bugReport')}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border-2 border-[#3D352E] bg-white hover:bg-[#EFE7DA] text-xs font-black text-[#302A24] transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2.5 rounded-xl border-2 border-[#3D352E] text-white text-xs font-black shadow-[2px_3px_0px_#3D352E] active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                activeTab === 'feedback'
                  ? 'bg-[#557A46] hover:bg-[#466638]'
                  : 'bg-[#DE5D53] hover:bg-[#C84F45]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">
                    {activeTab === 'feedback' ? 'send' : 'report'}
                  </span>
                  <span>{activeTab === 'feedback' ? 'Gửi góp ý' : 'Gửi báo lỗi'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BugReportModal;
