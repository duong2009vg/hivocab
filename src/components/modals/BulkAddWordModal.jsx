// src/components/modals/BulkAddWordModal.jsx
// Modal thêm từ vựng hàng loạt - Phong cách Cozy Crayon ấm áp (Sáp màu & Sổ tay học tập)

import React, { useState, useEffect } from 'react';
import { useModal } from '../../context/ModalContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { supabase } from '../../lib/supabaseClient.js';
import { getCachedTopics } from '../../services/db.js';

export function BulkAddWordModal() {
  const { modals, closeModal } = useModal();
  const { success, error: toastError } = useToast();

  const isOpen = Boolean(modals?.bulkAdd?.open);

  const [rawText, setRawText] = useState('');
  const [topicId, setTopicId] = useState('');
  const [topicsList, setTopicsList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const cached = getCachedTopics();
    setTopicsList(cached || []);
    setTopicId((typeof window !== 'undefined' ? window._currentTopicId : null) || (cached[0]?.id || ''));
    setRawText('');
    setErrorMessage('');
    setIsSubmitting(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setErrorMessage('');
    closeModal('bulkAdd');
  };

  const handleBulkSubmit = async (e) => {
    e?.preventDefault();
    if (!rawText.trim()) {
      setErrorMessage('Vui lòng dán danh sách từ vựng!');
      return;
    }
    if (!topicId) {
      setErrorMessage('Vui lòng chọn chủ đề để lưu từ!');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
      const wordsToInsert = [];

      for (const line of lines) {
        // Tách theo tab (\t), dấu gạch ngang ( - ), hoặc dấu hai chấm ( : )
        let parts = line.split('\t');
        if (parts.length < 2) parts = line.split(' - ');
        if (parts.length < 2) parts = line.split(' : ');
        if (parts.length < 2) parts = line.split(':');

        const word = parts[0]?.trim();
        const meaning = parts.slice(1).join(' - ').trim();

        if (word && meaning) {
          wordsToInsert.push({
            topic_id: topicId,
            word,
            meaning,
            phonetic: '',
            example_sentence: '',
            notes: '',
          });
        }
      }

      if (wordsToInsert.length === 0) {
        throw new Error('Không phân tích được dòng nào hợp lệ. Định dạng mẫu: "resilient - kiên cường"');
      }

      const { data: inserted, error: insertErr } = await supabase
        .from('words')
        .insert(wordsToInsert)
        .select('id');

      if (insertErr) throw insertErr;

      // Khởi tạo word_progress cho user
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id && inserted?.length > 0) {
        const now = new Date().toISOString();
        const progRows = inserted.map((w) => ({
          user_id: user.id,
          word_id: w.id,
          level: 1,
          next_review_at: now,
          review_count: 0,
          created_at: now,
        }));
        await supabase.from('word_progress').insert(progRows).catch(() => {});
      }

      success(`Đã thêm thành công ${wordsToInsert.length} từ vào chủ đề! 🎉`);
      handleClose();

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hivocab:words-bulk-added', { detail: { count: wordsToInsert.length } }));
      }
    } catch (err) {
      setErrorMessage(err?.message || 'Có lỗi xảy ra khi nhập từ.');
      toastError(err?.message || 'Lỗi thêm từ hàng loạt.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 select-none"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="w-full max-w-xl bg-[#FFFDF9] rounded-3xl shadow-[6px_8px_0px_#382E2B] overflow-hidden border-[3px] border-[#382E2B] flex flex-col max-h-[90vh] font-sans">
        {/* Header */}
        <div className="px-6 py-4.5 border-b-2 border-[#382E2B] flex items-center justify-between shrink-0 bg-[#FFF8EE]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#E1EDDB] border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] flex items-center justify-center text-xl shrink-0">
              📋
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-heading font-black text-[#382E2B]">Thêm từ vựng hàng loạt</h2>
              <p className="text-xs font-semibold text-[#766C5F]">Dán từ bảng tính Excel hoặc văn bản 🐾</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center rounded-2xl bg-white border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] text-[#382E2B] hover:bg-[#FAF5EB] active:translate-y-0.5 transition-all cursor-pointer font-black text-sm"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleBulkSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          <div>
            <label className="block text-xs font-black text-[#766C5F] uppercase tracking-wider mb-1.5">
              Chủ đề lưu trữ <span className="text-[#D36135]">*</span>
            </label>
            <select
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              className="w-full bg-white border-2 border-[#382E2B] focus:border-[#D36135] px-4 py-2.5 rounded-2xl outline-none text-[#382E2B] text-sm font-bold shadow-[1px_2px_0px_rgba(56,46,43,0.15)] transition-colors cursor-pointer"
            >
              {topicsList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.category || 'general'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-[#766C5F] uppercase tracking-wider mb-1.5">
              Dán danh sách từ (Mỗi từ 1 dòng) <span className="text-[#D36135]">*</span>
            </label>
            <textarea
              required
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`resilient - kiên cường, bền bỉ\nbreakthrough - bước đột phá\npersist - kiên trì, dai dẳng`}
              className="w-full bg-white border-2 border-[#382E2B] focus:border-[#D36135] px-4 py-3 rounded-2xl outline-none text-[#382E2B] text-xs sm:text-sm font-mono shadow-[1px_2px_0px_rgba(56,46,43,0.15)] transition-colors resize-none leading-relaxed"
            />
            <div className="mt-2.5 p-3.5 bg-[#FFF8EE] rounded-2xl border-2 border-dashed border-[#E5A13C] text-[11px] font-bold text-[#766C5F] flex items-start gap-2">
              <span className="text-base shrink-0 select-none">💡</span>
              <span>
                Hỗ trợ copy 2 cột từ Excel, hoặc phân cách bằng dấu gạch ngang ( - ), hai chấm ( : ) hoặc Tab.
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-[#FFECE4] border-2 border-[#EA7349] text-[#CF4F23] text-xs font-bold flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3 border-t-2 border-dashed border-[#EFE8D6]">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold text-[#766C5F] hover:text-[#382E2B] hover:bg-[#FAF5EB] transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-2xl bg-[#5a7d4d] hover:bg-[#4d6d41] text-white font-black text-xs sm:text-sm border-2 border-[#382E2B] shadow-[2px_3px_0px_#382E2B] active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">🔄</span>
                  <span>Đang nhập...</span>
                </>
              ) : (
                <>
                  <span>📥</span>
                  <span>Nhập từ vựng ➔</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BulkAddWordModal;
