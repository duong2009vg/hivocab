// src/components/modals/AddWordModal.jsx
// Modal thêm từ vựng mới - Phong cách Cozy Crayon ấm áp (Sáp màu & Sổ tay học tập)

import React, { useState, useEffect, useCallback } from 'react';
import { useModal } from '../../context/ModalContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useSound } from '../../hooks/useSound.js';
import { supabase } from '../../lib/supabaseClient.js';
import { addWord } from '../../services/db.js';
import { autofillWordWithAI } from '../../services/dictionaryService.js';

export function AddWordModal() {
  const { modals, openModal, closeModal } = useModal();
  const { success, error: toastError } = useToast();
  const { playWord } = useSound();

  const isOpen = Boolean(modals?.addWord?.open);
  const initialTopicId = modals?.addWord?.topicId || null;
  const initialPassageId = modals?.addWord?.passageId || null;
  const initialWord = modals?.addWord?.initialWord || modals?.addWord?.word || '';
  const initialMeaning = modals?.addWord?.initialMeaning || modals?.addWord?.meaning || '';

  const [word, setWord] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [pos, setPos] = useState('');
  const [meaning, setMeaning] = useState('');
  const [exampleSentence, setExampleSentence] = useState('');
  const [topicId, setTopicId] = useState('');
  const [passageId, setPassageId] = useState(null);
  const [topicsList, setTopicsList] = useState([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Tải danh sách các chủ đề cá nhân
  const loadUserTopics = useCallback(async (targetSelectId = null) => {
    setIsLoadingTopics(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTopicsList([]);
        setTopicId('');
        return;
      }

      const { data, error } = await supabase
        .from('topics')
        .select('id, name, category, user_id')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error || !data || data.length === 0) {
        setTopicsList([]);
        setTopicId('');
      } else {
        setTopicsList(data);
        const currentActiveTopic = typeof window !== 'undefined' ? window._currentTopicId : null;
        if (targetSelectId && data.some((t) => t.id === targetSelectId)) {
          setTopicId(targetSelectId);
          setErrorMessage('');
        } else if (initialTopicId && data.some((t) => t.id === initialTopicId)) {
          setTopicId(initialTopicId);
        } else if (currentActiveTopic && data.some((t) => t.id === currentActiveTopic)) {
          setTopicId(currentActiveTopic);
        } else {
          setTopicId((prev) => (data.some((t) => t.id === prev) ? prev : data[0].id));
        }
      }
    } catch (err) {
      console.warn('[AddWordModal] loadUserTopics error:', err);
    } finally {
      setIsLoadingTopics(false);
    }
  }, [initialTopicId]);

  // Khởi tạo khi mở modal
  useEffect(() => {
    if (!isOpen) return;

    setWord(initialWord || '');
    setPhonetic('');
    setPos('');
    setMeaning(initialMeaning || '');
    setExampleSentence('');
    setErrorMessage('');
    setIsSubmitting(false);
    setPassageId(initialPassageId || (typeof window !== 'undefined' ? window._currentPassageId : null));

    loadUserTopics();
  }, [isOpen, initialTopicId, initialPassageId, initialWord, initialMeaning, loadUserTopics]);

  // Lắng nghe sự kiện khi có chủ đề mới được tạo từ CreateTopicModal
  useEffect(() => {
    const handleTopicsUpdated = (e) => {
      const newTopicId = e?.detail?.topic?.id;
      loadUserTopics(newTopicId);
    };
    window.addEventListener('hi:topics-updated', handleTopicsUpdated);
    return () => window.removeEventListener('hi:topics-updated', handleTopicsUpdated);
  }, [loadUserTopics]);

  if (!isOpen) return null;

  const handleClose = () => {
    setErrorMessage('');
    closeModal('addWord');
  };

  const handleOpenCreateTopic = () => {
    openModal('createTopic', { initialStep: 'topic' });
  };

  const handleAiLookup = async () => {
    const clean = word.trim();
    if (!clean) {
      setErrorMessage('Vui lòng nhập từ tiếng Anh trước khi bấm AI Điền tự động!');
      return;
    }

    setIsAiLoading(true);
    setErrorMessage('');

    try {
      const data = await autofillWordWithAI(clean);
      if (data && (data.meaning || data.phonetic || data.example)) {
        if (data.phonetic) setPhonetic(data.phonetic);
        if (data.pos) setPos(data.pos);
        if (data.meaning) setMeaning(data.meaning);
        if (data.example && !exampleSentence) {
          setExampleSentence(data.example);
        }
        success('✨ DeepSeek AI đã tự động điền gợi ý!');
      } else {
        setErrorMessage(`Không tìm thấy gợi ý cho "${clean}". Bạn có thể tự điền thủ công nhé!`);
      }
    } catch (err) {
      console.warn('[AddWordModal] AI Lookup error:', err);
      setErrorMessage('Không thể tra tự động từ DeepSeek AI lúc này. Bạn có thể tự điền thủ công nhé!');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const cleanWord = word.trim();
    const cleanMeaning = meaning.trim();

    if (!cleanWord) {
      setErrorMessage('Vui lòng nhập từ vựng tiếng Anh!');
      return;
    }
    if (!cleanMeaning) {
      setErrorMessage('Vui lòng nhập nghĩa tiếng Việt!');
      return;
    }
    if (!topicId) {
      setErrorMessage('Bạn chưa có chủ đề cá nhân để lưu từ! Vui lòng bấm "+ Tạo chủ đề mới" bên trên.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const newWord = await addWord(topicId, {
        word: cleanWord,
        phonetic: phonetic.trim(),
        pos: pos.trim(),
        meaning: cleanMeaning,
        exampleSentence: exampleSentence.trim(),
        passageId: passageId,
      });

      success(`Đã thêm từ "${cleanWord}" vào sổ từ! 🎉`);
      handleClose();

      // Trigger custom event so page lists can reload
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hivocab:word-added', { detail: { word: newWord } }));
      }
    } catch (err) {
      setErrorMessage(err?.message || 'Không thể lưu từ vựng.');
      toastError(err?.message || 'Lỗi thêm từ vựng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 select-none"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="w-full max-w-lg bg-[#FFFDF9] rounded-3xl shadow-[6px_8px_0px_#382E2B] overflow-hidden border-[3px] border-[#382E2B] flex flex-col max-h-[90vh] font-sans">
        {/* Header */}
        <div className="px-6 py-4.5 border-b-2 border-[#382E2B] flex items-center justify-between shrink-0 bg-[#FFF8EE]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#FFE8C2] border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] flex items-center justify-center text-xl shrink-0">
              📝
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-heading font-black text-[#382E2B]">Thêm từ vựng mới</h2>
              <p className="text-xs font-semibold text-[#766C5F]">Lưu vào kho từ cá nhân với Spaced Repetition 🐾</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center rounded-2xl bg-white border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] text-[#382E2B] hover:bg-[#FAF5EB] active:translate-y-0.5 transition-all cursor-pointer font-black text-sm"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Target Topic Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-black text-[#766C5F] uppercase tracking-wider">
                Chủ đề cá nhân <span className="text-[#D36135]">*</span>
              </label>
              <button
                type="button"
                onClick={handleOpenCreateTopic}
                className="text-xs font-extrabold text-[#D36135] hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>+ Tạo chủ đề mới</span>
              </button>
            </div>

            {/* Thông báo nếu chưa có chủ đề cá nhân */}
            {topicsList.length === 0 && !isLoadingTopics ? (
              <div className="p-3.5 rounded-2xl bg-[#FFF3D6] border-2 border-[#D97706]/40 text-[#92400E] text-xs font-semibold flex items-center justify-between gap-2.5">
                <div className="flex items-start gap-2">
                  <span className="text-base shrink-0">⚠️</span>
                  <div>
                    <p className="font-bold text-[#B45309]">Bạn chưa có chủ đề cá nhân nào!</p>
                    <p className="text-[11px] mt-0.5">Bấm nút bên cạnh để mở pop-up tạo chủ đề & chọn thư mục nhé.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleOpenCreateTopic}
                  className="px-3 py-1.5 bg-[#5a7d4d] hover:bg-[#4d6d41] text-white font-black text-xs rounded-xl border-2 border-[#382E2B] shadow-sm cursor-pointer active:translate-y-0.5 transition-all shrink-0 flex items-center gap-1"
                >
                  <span>+ Tạo chủ đề</span>
                </button>
              </div>
            ) : (
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="w-full bg-white border-2 border-[#382E2B] focus:border-[#D36135] px-4 py-2.5 rounded-2xl outline-none text-[#382E2B] text-sm font-bold shadow-[1px_2px_0px_rgba(56,46,43,0.15)] transition-colors cursor-pointer"
              >
                {topicsList.map((t) => (
                  <option key={t.id} value={t.id}>
                    📂 {t.name} {t.category ? `(${t.category})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Word English Input with AI Button */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-black text-[#766C5F] uppercase tracking-wider">
                Từ tiếng Anh / Cụm từ <span className="text-[#D36135]">*</span>
              </label>
              <button
                type="button"
                onClick={handleAiLookup}
                disabled={isAiLoading}
                className="px-3 py-1.5 rounded-xl text-xs font-black bg-[#FFF3D6] hover:bg-[#FFE5B4] text-[#B87C24] border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] flex items-center gap-1.5 transition-all cursor-pointer active:translate-y-0.5 disabled:opacity-50"
              >
                <span>{isAiLoading ? '🔄' : '✨'}</span>
                <span>{isAiLoading ? 'Đang điền...' : 'AI Điền tự động'}</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="Ví dụ: resilient, breakthrough..."
              className="w-full bg-white border-2 border-[#382E2B] focus:border-[#D36135] px-4 py-2.5 rounded-2xl outline-none text-[#382E2B] text-sm font-black shadow-[1px_2px_0px_rgba(56,46,43,0.15)] transition-colors"
            />
          </div>

          {/* Phonetic IPA & Part of Speech (POS) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-[#766C5F] uppercase tracking-wider mb-1.5">
                Phiên âm IPA
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={phonetic}
                  onChange={(e) => setPhonetic(e.target.value)}
                  placeholder="/rɪˈzɪl.jənt/"
                  className="w-full bg-white border-2 border-[#382E2B] focus:border-[#D36135] px-3.5 pr-10 py-2 rounded-2xl outline-none text-[#382E2B] text-xs sm:text-sm font-mono font-bold shadow-[1px_2px_0px_rgba(56,46,43,0.15)] transition-colors"
                />
                {word && (
                  <button
                    type="button"
                    onClick={() => playWord(word)}
                    className="absolute right-2 p-1 rounded-xl text-[#382E2B] hover:bg-[#FAF5EB] transition-colors cursor-pointer text-xs"
                    title="Nghe phát âm"
                  >
                    🔊
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-[#766C5F] uppercase tracking-wider mb-1.5">
                Từ loại (POS)
              </label>
              <input
                type="text"
                value={pos}
                onChange={(e) => setPos(e.target.value)}
                placeholder="noun, verb, adj..."
                className="w-full bg-white border-2 border-[#382E2B] focus:border-[#D36135] px-3.5 py-2 rounded-2xl outline-none text-[#382E2B] text-xs sm:text-sm font-bold shadow-[1px_2px_0px_rgba(56,46,43,0.15)] transition-colors"
              />
            </div>
          </div>

          {/* Meaning Vietnamese */}
          <div>
            <label className="block text-xs font-black text-[#766C5F] uppercase tracking-wider mb-1.5">
              Nghĩa tiếng Việt <span className="text-[#D36135]">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              placeholder="Ví dụ: kiên cường, phục hồi nhanh sau khó khăn..."
              className="w-full bg-white border-2 border-[#382E2B] focus:border-[#D36135] px-4 py-2 rounded-2xl outline-none text-[#382E2B] text-sm font-bold shadow-[1px_2px_0px_rgba(56,46,43,0.15)] transition-colors resize-none"
            />
          </div>

          {/* Example Sentence */}
          <div>
            <label className="block text-xs font-black text-[#766C5F] uppercase tracking-wider mb-1.5">
              Câu ví dụ (tiếng Anh)
            </label>
            <textarea
              rows={2}
              value={exampleSentence}
              onChange={(e) => setExampleSentence(e.target.value)}
              placeholder="Ví dụ: She showed a resilient attitude in the face of difficulties."
              className="w-full bg-white border-2 border-[#382E2B] focus:border-[#D36135] px-4 py-2 rounded-2xl outline-none text-[#382E2B] text-sm font-medium shadow-[1px_2px_0px_rgba(56,46,43,0.15)] transition-colors resize-none"
            />
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-[#FFECE4] border-2 border-[#EA7349] text-[#CF4F23] text-xs font-bold flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Footer Action Buttons */}
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
              disabled={isSubmitting || !topicId}
              className="px-6 py-2.5 rounded-2xl bg-[#5a7d4d] hover:bg-[#4d6d41] text-white font-black text-xs sm:text-sm border-2 border-[#382E2B] shadow-[2px_3px_0px_#382E2B] active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">🔄</span>
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>Lưu từ vựng ➔</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddWordModal;
