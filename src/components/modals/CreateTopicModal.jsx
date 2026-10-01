// src/components/modals/CreateTopicModal.jsx
// 100% Pure React Modal for Creating Topics and Folders
import React, { useState, useEffect } from 'react';
import { useModal } from '../../context/ModalContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { createTopic, getCachedTopics } from '../../services/db.js';

const AVAILABLE_ICONS = [
  'folder',
  'menu_book',
  'school',
  'library_books',
  'workspace_premium',
  'military_tech',
  'public',
  'format_quote',
  'folder_special',
  'lightbulb',
  'auto_stories',
  'star',
];

export function CreateTopicModal() {
  const { modals, closeModal } = useModal();
  const { success, error: toastError } = useToast();

  const isOpen = Boolean(modals?.createTopic?.open);

  const [step, setStep] = useState('select'); // 'select' | 'topic' | 'folder'
  const [topicName, setTopicName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('folder');
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [userFolders, setUserFolders] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Folder creation state
  const [folderName, setFolderName] = useState('');
  const [folderType, setFolderType] = useState('normal'); // 'normal' | 'exam'

  // Load user folders from localStorage & cached topics
  useEffect(() => {
    if (!isOpen) return;
    setStep('select');
    setTopicName('');
    setSelectedIcon('folder');
    setFolderName('');
    setErrorMessage('');
    setIsSubmitting(false);

    try {
      const savedFolders = JSON.parse(localStorage.getItem('hivocab_user_folders') || '[]');
      const cached = getCachedTopics();
      const catSet = new Set(['general', 'personal', 'IELTS Actual Tests', 'Destination C1-C2', 'Oxford 3000', 'TOEIC', 'CAM']);
      
      savedFolders.forEach((f) => f?.name && catSet.add(f.name));
      cached.forEach((t) => t?.category && catSet.add(t.category));

      const list = Array.from(catSet);
      setUserFolders(list);
      setSelectedCategory(list[0] || 'general');
    } catch (_) {
      setUserFolders(['general', 'personal']);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setErrorMessage('');
    closeModal('createTopic');
  };

  const handleCreateTopicSubmit = async (e) => {
    e?.preventDefault();
    if (!topicName.trim()) {
      setErrorMessage('Vui lòng nhập tên chủ đề!');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await createTopic(topicName.trim(), selectedIcon, selectedCategory);
      success('Tạo chủ đề mới thành công! 🎉');
      handleClose();

      // Trigger refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hi:topics-updated'));
      }
    } catch (err) {
      setErrorMessage(err?.message || 'Có lỗi xảy ra khi tạo chủ đề.');
      toastError(err?.message || 'Lỗi tạo chủ đề.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateFolderSubmit = (e) => {
    e?.preventDefault();
    if (!folderName.trim()) {
      setErrorMessage('Vui lòng nhập tên thư mục!');
      return;
    }

    try {
      const saved = JSON.parse(localStorage.getItem('hivocab_user_folders') || '[]');
      const exists = saved.some((f) => (f.name || '').toLowerCase() === folderName.trim().toLowerCase());
      if (exists) {
        setErrorMessage('Thư mục này đã tồn tại!');
        return;
      }

      saved.push({ name: folderName.trim(), isExam: folderType === 'exam' });
      localStorage.setItem('hivocab_user_folders', JSON.stringify(saved));
      success(`Đã tạo thư mục "${folderName.trim()}"!`);

      // Cập nhật lại dropdown và chuyển về tạo chủ đề với thư mục vừa tạo
      setUserFolders((prev) => [...prev, folderName.trim()]);
      setSelectedCategory(folderName.trim());
      setStep('topic');
      setErrorMessage('');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hi:topics-updated'));
      }
    } catch (err) {
      setErrorMessage('Không thể lưu thư mục mới.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="w-full max-w-md bg-surface rounded-3xl shadow-2xl overflow-hidden border border-outline-variant/30 flex flex-col max-h-[92vh]">
        {/* ── BƯỚC 1: Chọn tạo Chủ đề hay Thư mục ── */}
        {step === 'select' && (
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-on-surface">Bạn muốn tạo gì?</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">Tổ chức và lưu trữ kho từ vựng tiếng Anh</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-9 h-9 rounded-full flex items-center justify-center text-outline hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={() => setStep('topic')}
                className="group flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-outline-variant/30 hover:border-primary hover:bg-primary/5 transition-all text-center active:scale-95 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all shadow-xs">
                  <span className="material-symbols-outlined text-[26px]">menu_book</span>
                </div>
                <div>
                  <p className="font-bold text-sm text-on-surface">Tạo Chủ đề</p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">Chứa danh sách từ vựng</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStep('folder')}
                className="group flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-outline-variant/30 hover:border-secondary hover:bg-secondary/5 transition-all text-center active:scale-95 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-on-secondary transition-all shadow-xs">
                  <span className="material-symbols-outlined text-[26px]">folder_open</span>
                </div>
                <div>
                  <p className="font-bold text-sm text-on-surface">Tạo Thư mục</p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">Gom nhóm nhiều chủ đề</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ── BƯỚC 2A: Form Tạo Chủ đề ── */}
        {step === 'topic' && (
          <form onSubmit={handleCreateTopicSubmit} className="p-6 md:p-8 flex flex-col flex-1 overflow-y-auto space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => setStep('select')}
                className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <h2 className="text-lg font-bold text-on-surface">Tạo Chủ đề mới</h2>
              <button
                type="button"
                onClick={handleClose}
                className="ml-auto w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1.5">
                Tên chủ đề <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                maxLength={60}
                required
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                placeholder="Ví dụ: IELTS Reading Vocab Unit 1..."
                className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary px-4 py-2.5 rounded-xl outline-none text-on-surface text-sm transition-colors font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">
                Biểu tượng
              </label>
              <div className="grid grid-cols-6 gap-2">
                {AVAILABLE_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setSelectedIcon(icon)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all cursor-pointer ${
                      selectedIcon === icon
                        ? 'bg-primary text-on-primary shadow-sm scale-105'
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{icon}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1.5">
                Thư mục lưu trữ
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary px-4 py-2.5 rounded-xl outline-none text-on-surface text-sm transition-colors cursor-pointer font-medium"
              >
                {userFolders.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-error-container text-error text-xs font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="pt-2 flex gap-3 mt-auto">
              <button
                type="button"
                onClick={() => setStep('select')}
                className="flex-1 py-2.5 rounded-xl border border-outline-variant/30 text-on-surface-variant font-bold text-xs hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                Quay lại
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs hover:opacity-95 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                    <span>Đang tạo...</span>
                  </>
                ) : (
                  <span>Tạo chủ đề</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ── BƯỚC 2B: Form Tạo Thư mục ── */}
        {step === 'folder' && (
          <form onSubmit={handleCreateFolderSubmit} className="p-6 md:p-8 flex flex-col flex-1 overflow-y-auto space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => setStep('select')}
                className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <h2 className="text-lg font-bold text-on-surface">Tạo Thư mục mới</h2>
              <button
                type="button"
                onClick={handleClose}
                className="ml-auto w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1.5">
                Tên thư mục <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                maxLength={60}
                required
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Ví dụ: Destination B1-B2, Cambridge 20..."
                className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-secondary px-4 py-2.5 rounded-xl outline-none text-on-surface text-sm transition-colors font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">
                Loại thư mục
              </label>
              <div className="flex flex-col gap-2">
                <label
                  onClick={() => setFolderType('normal')}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                    folderType === 'normal'
                      ? 'border-primary bg-primary/5'
                      : 'border-outline-variant/30 hover:border-outline-variant/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="folderType"
                    checked={folderType === 'normal'}
                    onChange={() => setFolderType('normal')}
                    className="mt-0.5 accent-primary shrink-0"
                  />
                  <div>
                    <p className="font-bold text-xs text-on-surface">Thư mục thông thường</p>
                    <p className="text-[11px] text-on-surface-variant leading-snug">Danh sách phẳng phù hợp Oxford, IELTS, Từ cá nhân...</p>
                  </div>
                </label>

                <label
                  onClick={() => setFolderType('exam')}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                    folderType === 'exam'
                      ? 'border-secondary bg-secondary/5'
                      : 'border-outline-variant/30 hover:border-outline-variant/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="folderType"
                    checked={folderType === 'exam'}
                    onChange={() => setFolderType('exam')}
                    className="mt-0.5 accent-secondary shrink-0"
                  />
                  <div>
                    <p className="font-bold text-xs text-on-surface">
                      Thư mục đề thi <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-1.5 py-0.5 rounded-full ml-1">Test → Passage</span>
                    </p>
                    <p className="text-[11px] text-on-surface-variant leading-snug">Phân cấp Test và Passage (Cambridge, IELTS Actual Tests...)</p>
                  </div>
                </label>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-error-container text-error text-xs font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="pt-2 flex gap-3 mt-auto">
              <button
                type="button"
                onClick={() => setStep('select')}
                className="flex-1 py-2.5 rounded-xl border border-outline-variant/30 text-on-surface-variant font-bold text-xs hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                Quay lại
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-secondary text-on-secondary font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer"
              >
                Tạo thư mục
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default CreateTopicModal;
