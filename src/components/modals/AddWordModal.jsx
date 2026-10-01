// src/components/modals/AddWordModal.jsx
// 100% Pure React Modal for Adding Vocabulary Words with Audio Preview & Auto AI Fill
import React, { useState, useEffect } from 'react';
import { useModal } from '../../context/ModalContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useSound } from '../../hooks/useSound.js';
import { addWord, getCachedTopics } from '../../services/db.js';

export function AddWordModal() {
  const { modals, closeModal } = useModal();
  const { success, error: toastError } = useToast();
  const { playWord } = useSound();

  const isOpen = Boolean(modals?.addWord?.open);
  const initialTopicId = modals?.addWord?.topicId || null;
  const initialPassageId = modals?.addWord?.passageId || null;

  const [word, setWord] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [pos, setPos] = useState('');
  const [meaning, setMeaning] = useState('');
  const [exampleSentence, setExampleSentence] = useState('');
  const [notes, setNotes] = useState('');
  const [topicId, setTopicId] = useState('');
  const [passageId, setPassageId] = useState(null);
  const [topicsList, setTopicsList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const cached = getCachedTopics();
    setTopicsList(cached || []);

    const targetTopicId =
      initialTopicId ||
      (typeof window !== 'undefined' ? window._currentTopicId : null) ||
      (cached[0]?.id || '');

    setTopicId(targetTopicId);
    setPassageId(initialPassageId || (typeof window !== 'undefined' ? window._currentPassageId : null));
    setWord('');
    setPhonetic('');
    setPos('');
    setMeaning('');
    setExampleSentence('');
    setNotes('');
    setErrorMessage('');
    setIsSubmitting(false);
  }, [isOpen, initialTopicId, initialPassageId]);

  if (!isOpen) return null;

  const handleClose = () => {
    setErrorMessage('');
    closeModal('addWord');
  };

  const handleAiLookup = async () => {
    const clean = word.trim();
    if (!clean) {
      setErrorMessage('Vui lòng nhập từ tiếng Anh trước khi tra AI!');
      return;
    }

    setIsAiLoading(true);
    setErrorMessage('');

    try {
      // 1. Thử gọi Free Dictionary API trước để lấy phonetic và meaning cơ bản
      const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(clean)}`);
      if (dictRes.ok) {
        const dictData = await dictRes.json();
        const entry = dictData[0];
        if (entry) {
          if (entry.phonetic) setPhonetic(entry.phonetic);
          const firstMeaning = entry.meanings?.[0];
          if (firstMeaning) {
            setPos(firstMeaning.partOfSpeech || '');
            const def = firstMeaning.definitions?.[0];
            if (def?.example && !exampleSentence) {
              setExampleSentence(def.example);
            }
          }
        }
      }

      // 2. Thử gọi AI hint hoặc Google Translate để lấy nghĩa tiếng Việt chính xác
      const transRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(clean)}`);
      if (transRes.ok) {
        const transData = await transRes.json();
        const viText = transData?.[0]?.[0]?.[0];
        if (viText && !meaning) {
          setMeaning(viText);
        }
      }

      success('✨ AI đã tự động điền gợi ý!');
    } catch (err) {
      console.warn('[AddWordModal] AI Lookup error:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!word.trim()) {
      setErrorMessage('Vui lòng nhập từ vựng!');
      return;
    }
    if (!meaning.trim()) {
      setErrorMessage('Vui lòng nhập nghĩa tiếng Việt!');
      return;
    }
    if (!topicId) {
      setErrorMessage('Vui lòng chọn chủ đề để lưu từ!');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await addWord(topicId, {
        word: word.trim(),
        phonetic: phonetic.trim(),
        meaning: meaning.trim(),
        exampleSentence: exampleSentence.trim(),
        notes: notes.trim(),
        passageId: passageId || null,
      });

      success(`Đã thêm từ "${word.trim()}" thành công! 🎉`);
      handleClose();

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hi:word-added', { detail: { topicId, word: word.trim() } }));
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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="w-full max-w-lg bg-surface rounded-3xl shadow-2xl overflow-hidden border border-outline-variant/30 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant/15 flex items-center justify-between shrink-0 bg-surface-container-lowest/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[22px]">post_add</span>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-on-surface">Thêm từ vựng mới</h2>
              <p className="text-xs text-on-surface-variant">Lưu vào kho từ cá nhân với SM-2</p>
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Target Topic Selection */}
          <div>
            <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1.5">
              Chủ đề lưu trữ <span className="text-rose-500">*</span>
            </label>
            <select
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary px-4 py-2.5 rounded-xl outline-none text-on-surface text-sm transition-colors cursor-pointer font-medium"
            >
              {topicsList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.category || 'general'})
                </option>
              ))}
            </select>
          </div>

          {/* Word English Input with AI Button */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-outline uppercase tracking-wider">
                Từ tiếng Anh / Cụm từ <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAiLookup}
                disabled={isAiLoading}
                className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[15px]">
                  {isAiLoading ? 'sync' : 'auto_awesome'}
                </span>
                <span>{isAiLoading ? 'Đang điền...' : 'AI Điền tự động'}</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="Ví dụ: resilient, breakthrough..."
              className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary px-4 py-2.5 rounded-xl outline-none text-on-surface text-sm font-bold transition-colors"
            />
          </div>

          {/* Phonetic IPA + Audio Preview */}
          <div>
            <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1.5">
              Phiên âm IPA
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={phonetic}
                onChange={(e) => setPhonetic(e.target.value)}
                placeholder="/rɪˈzɪl.jənt/"
                className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary px-4 pr-11 py-2 rounded-xl outline-none text-on-surface text-sm transition-colors font-mono"
              />
              {word && (
                <button
                  type="button"
                  onClick={() => playWord(word)}
                  className="absolute right-2 p-1.5 rounded-lg text-outline hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                  title="Nghe phát âm"
                >
                  <span className="material-symbols-outlined text-[18px]">volume_up</span>
                </button>
              )}
            </div>
          </div>

          {/* Meaning Vietnamese */}
          <div>
            <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1.5">
              Nghĩa tiếng Việt <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              placeholder="Ví dụ: kiên cường, phục hồi nhanh sau khó khăn..."
              className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary px-4 py-2 rounded-xl outline-none text-on-surface text-sm transition-colors resize-none font-medium"
            />
          </div>

          {/* Example Sentence */}
          <div>
            <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1.5">
              Câu ví dụ (tiếng Anh)
            </label>
            <textarea
              rows={2}
              value={exampleSentence}
              onChange={(e) => setExampleSentence(e.target.value)}
              placeholder="Ví dụ: She showed a resilient attitude in the face of difficulties."
              className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary px-4 py-2 rounded-xl outline-none text-on-surface text-sm transition-colors resize-none"
            />
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-error-container text-error text-xs font-semibold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Footer Action Buttons */}
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
              className="px-5 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs hover:opacity-95 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>Lưu từ vựng</span>
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
