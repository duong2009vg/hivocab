// src/components/modals/BugReportModal.jsx
// Pure React Bug Report & Feedback Modal
import React, { useState } from 'react';
import { useModal } from '../../context/ModalContext.jsx';
import { supabase } from '../../lib/supabaseClient.js';

export function BugReportModal() {
  const { modals, closeModal } = useModal();
  const modalState = modals.bugReport;

  const [reportType, setReportType] = useState('wrong_answer');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!modalState?.open) return null;

  const data = modalState.data || {};
  const feature = data.feature || 'general';
  const contextData = data.contextData || {};
  const title = data.title || 'Đang ghi nhận từ phiên học';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = content.trim();
    if (!text) {
      if (typeof window !== 'undefined' && window.showHiToast) {
        window.showHiToast('Vui lòng nhập nội dung mô tả lỗi!', 'error');
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('bug_reports').insert({
        user_id: user?.id ?? null,
        user_email: user?.email ?? null,
        report_type: reportType,
        description: text,
        feature_context: feature,
        context_data: {
          ...contextData,
          url: window.location.href,
          user_agent: navigator.userAgent,
          screen_size: `${window.innerWidth}x${window.innerHeight}`,
        },
      });

      if (typeof window !== 'undefined' && window.showHiToast) {
        window.showHiToast('Cảm ơn bạn! Báo cáo đã được gửi tới đội ngũ kỹ thuật 🎉', 'success');
      } else {
        alert('Cảm ơn bạn! Báo cáo đã được gửi thành công.');
      }
      setContent('');
      closeModal('bugReport');
    } catch (err) {
      console.error('[BugReportModal] Submit error:', err);
      // Fallback: if table doesn't exist, try legacy HiDB
      if (typeof window !== 'undefined' && window.HiDB?.submitBugReport) {
        try {
          await window.HiDB.submitBugReport({
            description: text,
            reportType,
            featureContext: feature,
            contextData,
          });
          if (window.showHiToast) {
            window.showHiToast('Cảm ơn bạn! Báo cáo đã được gửi tới đội ngũ kỹ thuật 🎉', 'success');
          }
          setContent('');
          closeModal('bugReport');
          return;
        } catch (_) {}
      }
      const errMsg = err?.message || 'Gửi báo cáo thất bại, vui lòng thử lại sau.';
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
      onClick={(e) => { if (e.target === e.currentTarget) closeModal('bugReport'); }}
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
    >
      <div className="w-full max-w-md bg-surface rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 fade-in border border-outline-variant/30 text-on-surface">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div className="flex items-center gap-2.5 text-red-600">
            <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
              <span className="material-symbols-outlined text-[20px]">flag</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface leading-tight">Báo cáo Lỗi &amp; Góp ý</h3>
              <p className="text-[11px] text-on-surface-variant font-medium">HiVocab Support Team</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => closeModal('bugReport')}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-surface-container cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Context Preview Chip */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container-high/60 border border-outline-variant/20 text-xs">
          <span className="material-symbols-outlined text-primary text-[16px]">info</span>
          <span className="font-semibold text-on-surface truncate">{title}</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
              Loại vấn đề
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/40 bg-surface text-xs font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="wrong_answer">Sai đáp án / Kết quả không chính xác</option>
              <option value="exam_question">Lỗi câu hỏi trong Đề thi THPT</option>
              <option value="typo">Lỗi chính tả / Ngữ pháp / Dịch thuật</option>
              <option value="audio">Lỗi phát âm / Âm thanh</option>
              <option value="ui_bug">Lỗi hiển thị / Giao diện / Nút bấm</option>
              <option value="other">Góp ý cải tiến / Phản hồi khác</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
              Mô tả chi tiết
            </label>
            <textarea
              rows="3"
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Vui lòng mô tả chi tiết lỗi bạn gặp phải hoặc đáp án bạn cho là chính xác..."
              className="w-full p-3 rounded-xl border border-outline-variant/40 bg-surface text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none placeholder:text-outline font-medium"
            ></textarea>
          </div>

          {/* Auto capture note */}
          <div className="flex items-center gap-2 text-[11px] text-outline">
            <span className="material-symbols-outlined text-[14px]">devices</span>
            <span>Hệ thống tự động đính kèm thiết bị, trình duyệt và URL.</span>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => closeModal('bugReport')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>Gửi Báo Cáo</span>
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
