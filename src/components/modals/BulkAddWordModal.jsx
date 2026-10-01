// src/components/modals/BulkAddWordModal.jsx
// 100% Pure React Modal for Bulk Importing Vocabulary Words
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
        await supabase.from('word_progress').upsert(progRows, { onConflict: 'user_id,word_id' }).catch(() => {});
      }

      success(`Đã thêm thành công ${wordsToInsert.length} từ vựng! 🎉`);
      handleClose();

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hi:word-added', { detail: { topicId } }));
      }
    } catch (err) {
      setErrorMessage(err?.message || 'Có lỗi xảy ra khi nhập từ hàng loạt.');
      toastError(err?.message || 'Lỗi nhập hàng loạt.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="w-full max-w-xl bg-surface rounded-3xl shadow-2xl overflow-hidden border border-outline-variant/30 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant/15 flex items-center justify-between shrink-0 bg-surface-container-lowest/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[22px]">playlist_add</span>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-on-surface">Thêm từ vựng hàng loạt</h2>
              <p className="text-xs text-on-surface-variant">Dán từ bảng tính Excel hoặc văn bản</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-outline hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleBulkSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          <div>
            <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1.5">
              Chủ đề lưu trữ <span className="text-rose-500">*</span>
            </label>
            <select
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-secondary px-4 py-2.5 rounded-xl outline-none text-on-surface text-sm transition-colors cursor-pointer font-medium"
            >
              {topicsList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.category || 'general'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1.5">
              Dán danh sách từ (Mỗi từ 1 dòng) <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`resilient - kiên cường, bền bỉ\nbreakthrough - bước đột phá\npersist - kiên trì, dai dẳng`}
              className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-secondary px-4 py-3 rounded-2xl outline-none text-on-surface text-xs sm:text-sm font-mono transition-colors resize-none leading-relaxed"
            />
            <p className="text-[11px] text-on-surface-variant mt-1.5 leading-snug">
              💡 Hỗ trợ copy 2 cột từ Excel, hoặc phân cách bằng dấu gạch ngang ( - ), hai chấm ( : ) hoặc Tab.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-error-container text-error text-xs font-semibold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-secondary text-on-secondary font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                  <span>Đang nhập...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">upload_file</span>
                  <span>Nhập từ vựng</span>
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
