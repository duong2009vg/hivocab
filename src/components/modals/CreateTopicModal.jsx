// src/components/modals/CreateTopicModal.jsx
// 100% Pure React Modal for Creating Topics and Folders
// Cozy Crayon Handcrafted Design System (Sáp màu & Sổ tay thủ công)
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
    setStep(modals?.createTopic?.initialStep || 'select');
    setTopicName('');
    setSelectedIcon('folder');
    setFolderName('');
    setErrorMessage('');
    setIsSubmitting(false);

    try {
      const savedFolders = JSON.parse(localStorage.getItem('hivocab_user_folders') || '[]');
      const cached = getCachedTopics();
      const catSet = new Set(['Từ vựng của tôi', 'Cá nhân', 'IELTS', 'THPT-QG', 'Giao tiếp', 'general']);
      
      savedFolders.forEach((f) => f?.name && catSet.add(f.name));
      cached.forEach((t) => t?.category && catSet.add(t.category));

      const list = Array.from(catSet);
      setUserFolders(list);
      setSelectedCategory(list[0] || 'Từ vựng của tôi');
    } catch (_) {
      setUserFolders(['Từ vựng của tôi', 'Cá nhân']);
    }
  }, [isOpen, modals?.createTopic?.initialStep]);

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
      const newTopic = await createTopic(topicName.trim(), selectedIcon, selectedCategory);
      success('Tạo chủ đề mới thành công! 🎉');
      handleClose();

      // Trigger refresh with created topic in detail
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hi:topics-updated', { detail: { topic: newTopic } }));
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
      success(`Đã tạo thư mục "${folderName.trim()}"! 🎉`);

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
      className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-[#382E2B]/60 backdrop-blur-xs animate-in fade-in duration-200 select-none font-nunito"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="w-full max-w-md bg-[#FFFDF9] rounded-[32px] shadow-[5px_6px_0px_#382E2B] overflow-hidden border-[3px] border-[#382E2B] flex flex-col max-h-[92vh] text-[#382E2B]">
        {/* ── BƯỚC 1: Chọn tạo Chủ đề hay Thư mục ── */}
        {step === 'select' && (
          <div className="p-6 sm:p-7 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black font-quicksand text-[#382E2B] leading-tight">
                  Bạn muốn tạo gì?
                </h2>
                <p className="text-xs font-bold text-[#6E5D53] mt-1">
                  Tổ chức và lưu trữ kho từ vựng tiếng Anh
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-9 h-9 rounded-2xl bg-white hover:bg-[#FAF5EB] border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] flex items-center justify-center text-[#382E2B] active:translate-y-0.5 transition-all cursor-pointer"
                title="Đóng"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* 2 Option Cards */}
            <div className="grid grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={() => setStep('topic')}
                className="group flex flex-col items-center gap-3.5 p-5 rounded-[24px] bg-white hover:bg-[#FFFDF9] border-[2.5px] border-[#382E2B] shadow-[3px_3.5px_0px_#382E2B] hover:shadow-[4px_4.5px_0px_#382E2B] hover:-translate-y-0.5 active:translate-y-0.5 transition-all text-center cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#EAF3E7] border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] flex items-center justify-center text-[#557A46] group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[28px]">menu_book</span>
                </div>
                <div>
                  <p className="font-black font-quicksand text-base text-[#382E2B]">Tạo Chủ đề</p>
                  <p className="text-[11px] font-bold text-[#6E5D53] mt-0.5 leading-snug">Chứa danh sách từ vựng</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStep('folder')}
                className="group flex flex-col items-center gap-3.5 p-5 rounded-[24px] bg-white hover:bg-[#FFFDF9] border-[2.5px] border-[#382E2B] shadow-[3px_3.5px_0px_#382E2B] hover:shadow-[4px_4.5px_0px_#382E2B] hover:-translate-y-0.5 active:translate-y-0.5 transition-all text-center cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#FFF9EE] border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] flex items-center justify-center text-[#D9822B] group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[28px]">folder_open</span>
                </div>
                <div>
                  <p className="font-black font-quicksand text-base text-[#382E2B]">Tạo Thư mục</p>
                  <p className="text-[11px] font-bold text-[#6E5D53] mt-0.5 leading-snug">Gom nhóm nhiều chủ đề</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ── BƯỚC 2A: Form Tạo Chủ đề ── */}
        {step === 'topic' && (
          <form onSubmit={handleCreateTopicSubmit} className="p-6 sm:p-7 flex flex-col flex-1 overflow-y-auto space-y-4">
            {/* Header with Back and Close */}
            <div className="flex items-center gap-2.5 pb-2 border-b-2 border-[#382E2B]/10">
              <button
                type="button"
                onClick={() => setStep('select')}
                className="w-9 h-9 rounded-2xl bg-white hover:bg-[#FAF5EB] border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] flex items-center justify-center text-[#382E2B] active:translate-y-0.5 transition-all cursor-pointer"
                title="Quay lại"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <h2 className="text-lg sm:text-xl font-black font-quicksand text-[#382E2B]">Tạo Chủ đề mới</h2>
              <button
                type="button"
                onClick={handleClose}
                className="ml-auto w-9 h-9 rounded-2xl bg-white hover:bg-[#FAF5EB] border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] flex items-center justify-center text-[#382E2B] active:translate-y-0.5 transition-all cursor-pointer"
                title="Đóng"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Topic Name */}
            <div>
              <label className="block text-xs font-black font-quicksand uppercase tracking-wider text-[#6E5D53] mb-1.5">
                TÊN CHỦ ĐỀ <span className="text-[#DE5D53]">*</span>
              </label>
              <input
                type="text"
                maxLength={60}
                required
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                placeholder="Ví dụ: IELTS Reading Vocab Unit 1..."
                className="w-full bg-white border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] px-4 py-2.5 rounded-2xl text-xs font-bold text-[#382E2B] focus:ring-2 focus:ring-[#557A46] focus:outline-none placeholder:text-[#8C7A6B]/50 transition-all"
              />
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-xs font-black font-quicksand uppercase tracking-wider text-[#6E5D53] mb-2">
                BIỂU TƯỢNG
              </label>
              <div className="grid grid-cols-6 gap-2">
                {AVAILABLE_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setSelectedIcon(icon)}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl transition-all cursor-pointer ${
                      selectedIcon === icon
                        ? 'bg-[#382E2B] text-white border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] scale-105'
                        : 'bg-white hover:bg-[#FAF5EB] text-[#382E2B] border-2 border-[#382E2B]/20 hover:border-[#382E2B] shadow-[1px_1px_0px_rgba(56,46,43,0.1)]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{icon}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Folder Dropdown */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black font-quicksand uppercase tracking-wider text-[#6E5D53]">
                  THƯ MỤC LƯU TRỮ
                </label>
                <button
                  type="button"
                  onClick={() => setStep('folder')}
                  className="text-xs font-extrabold text-[#D9822B] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">create_new_folder</span>
                  <span>+ Tạo thư mục mới</span>
                </button>
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-white border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] px-4 py-2.5 rounded-2xl text-xs font-bold text-[#382E2B] focus:ring-2 focus:ring-[#557A46] focus:outline-none cursor-pointer transition-all"
              >
                {userFolders.map((cat) => (
                  <option key={cat} value={cat}>
                    📁 {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-[#FFF0E6] border-2 border-[#DE5D53] text-[#DE5D53] text-xs font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Buttons */}
            <div className="pt-2 flex gap-3 mt-auto">
              <button
                type="button"
                onClick={() => setStep('select')}
                className="flex-1 py-3 rounded-2xl bg-white hover:bg-[#F2ECE0] border-2 border-[#382E2B] shadow-[2px_2.5px_0px_#382E2B] text-xs font-black font-quicksand text-[#382E2B] active:translate-y-0.5 transition-all cursor-pointer text-center"
              >
                Quay lại
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-2xl bg-[#382E2B] hover:bg-[#2A231E] text-white border-2 border-[#382E2B] shadow-[2.5px_3px_0px_#382E2B] text-xs font-black font-quicksand active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                    <span>Đang tạo...</span>
                  </>
                ) : (
                  <span>Tạo chủ đề ✨</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ── BƯỚC 2B: Form Tạo Thư mục ── */}
        {step === 'folder' && (
          <form onSubmit={handleCreateFolderSubmit} className="p-6 sm:p-7 flex flex-col flex-1 overflow-y-auto space-y-4">
            {/* Header with Back and Close */}
            <div className="flex items-center gap-2.5 pb-2 border-b-2 border-[#382E2B]/10">
              <button
                type="button"
                onClick={() => setStep('select')}
                className="w-9 h-9 rounded-2xl bg-white hover:bg-[#FAF5EB] border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] flex items-center justify-center text-[#382E2B] active:translate-y-0.5 transition-all cursor-pointer"
                title="Quay lại"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <h2 className="text-lg sm:text-xl font-black font-quicksand text-[#382E2B]">Tạo Thư mục mới</h2>
              <button
                type="button"
                onClick={handleClose}
                className="ml-auto w-9 h-9 rounded-2xl bg-white hover:bg-[#FAF5EB] border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] flex items-center justify-center text-[#382E2B] active:translate-y-0.5 transition-all cursor-pointer"
                title="Đóng"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Folder Name */}
            <div>
              <label className="block text-xs font-black font-quicksand uppercase tracking-wider text-[#6E5D53] mb-1.5">
                TÊN THƯ MỤC <span className="text-[#DE5D53]">*</span>
              </label>
              <input
                type="text"
                maxLength={60}
                required
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Ví dụ: Destination B1-B2, Cambridge 20..."
                className="w-full bg-white border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] px-4 py-2.5 rounded-2xl text-xs font-bold text-[#382E2B] focus:ring-2 focus:ring-[#557A46] focus:outline-none placeholder:text-[#8C7A6B]/50 transition-all"
              />
            </div>

            {/* Folder Type Radio */}
            <div>
              <label className="block text-xs font-black font-quicksand uppercase tracking-wider text-[#6E5D53] mb-2">
                LOẠI THƯ MỤC
              </label>
              <div className="flex flex-col gap-2.5">
                <label
                  onClick={() => setFolderType('normal')}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                    folderType === 'normal'
                      ? 'border-[#382E2B] bg-[#EAF3E7] shadow-[2.5px_3px_0px_#382E2B]'
                      : 'border-[#382E2B]/20 bg-white hover:bg-[#FAF5EB]'
                  }`}
                >
                  <input
                    type="radio"
                    name="folderType"
                    checked={folderType === 'normal'}
                    onChange={() => setFolderType('normal')}
                    className="mt-0.5 accent-[#557A46] shrink-0"
                  />
                  <div>
                    <p className="font-black font-quicksand text-xs text-[#382E2B]">Thư mục thông thường 📁</p>
                    <p className="text-[11px] font-bold text-[#6E5D53] leading-snug">Danh sách phẳng phù hợp Oxford, IELTS, Từ cá nhân...</p>
                  </div>
                </label>

                <label
                  onClick={() => setFolderType('exam')}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                    folderType === 'exam'
                      ? 'border-[#382E2B] bg-[#FFF0E6] shadow-[2.5px_3px_0px_#382E2B]'
                      : 'border-[#382E2B]/20 bg-white hover:bg-[#FAF5EB]'
                  }`}
                >
                  <input
                    type="radio"
                    name="folderType"
                    checked={folderType === 'exam'}
                    onChange={() => setFolderType('exam')}
                    className="mt-0.5 accent-[#DE5D53] shrink-0"
                  />
                  <div>
                    <p className="font-black font-quicksand text-xs text-[#382E2B] flex items-center gap-1.5">
                      <span>Thư mục đề thi 🎓</span>
                      <span className="text-[10px] font-black text-[#DE5D53] bg-[#FFF0E6] border border-[#DE5D53] px-2 py-0.5 rounded-full">
                        Test → Passage
                      </span>
                    </p>
                    <p className="text-[11px] font-bold text-[#6E5D53] leading-snug">Phân cấp Test và Passage (Cambridge, IELTS Actual Tests...)</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-[#FFF0E6] border-2 border-[#DE5D53] text-[#DE5D53] text-xs font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Buttons */}
            <div className="pt-2 flex gap-3 mt-auto">
              <button
                type="button"
                onClick={() => setStep('select')}
                className="flex-1 py-3 rounded-2xl bg-white hover:bg-[#F2ECE0] border-2 border-[#382E2B] shadow-[2px_2.5px_0px_#382E2B] text-xs font-black font-quicksand text-[#382E2B] active:translate-y-0.5 transition-all cursor-pointer text-center"
              >
                Quay lại
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-2xl bg-[#382E2B] hover:bg-[#2A231E] text-white border-2 border-[#382E2B] shadow-[2.5px_3px_0px_#382E2B] text-xs font-black font-quicksand active:translate-y-0.5 transition-all cursor-pointer"
              >
                Tạo thư mục 🚀
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default CreateTopicModal;
