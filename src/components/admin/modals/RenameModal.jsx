// src/components/admin/modals/RenameModal.jsx
// Shared tactile modal for renaming a Folder (category) or Topic in HiVocab Admin Studio.
import React, { useEffect, useRef, useState } from 'react';

export function RenameModal({
  isOpen,
  mode = 'topic', // 'folder' | 'topic'
  currentName = '',
  subtitle = '',
  existingNames = [],
  onClose,
  onSubmit,
}) {
  const [value, setValue] = useState(currentName);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setValue(currentName || '');
      setIsSaving(false);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [isOpen, currentName]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !isSaving) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  const trimmed = value.trim();
  const isUnchanged = trimmed === String(currentName || '').trim();
  const isDuplicateTarget =
    !isUnchanged &&
    trimmed.length > 0 &&
    existingNames.some((n) => String(n || '').trim().toLowerCase() === trimmed.toLowerCase());

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!trimmed || isUnchanged || isSaving) return;
    setIsSaving(true);
    try {
      await onSubmit(trimmed);
    } finally {
      setIsSaving(false);
    }
  };

  const isFolder = mode === 'folder';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      onClick={() => {
        if (!isSaving) onClose?.();
      }}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl border-2 border-[#3D352E] shadow-[4px_6px_0px_#3D352E] p-5 sm:p-6 space-y-4 font-nunito text-[#3D352E]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#FAF5EB]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0">{isFolder ? '📁' : '📖'}</span>
            <h3 className="font-quicksand font-black text-lg text-[#3D352E] truncate">
              {isFolder ? 'Đổi tên Thư mục' : 'Đổi tên Chủ đề (Topic)'}
            </h3>
          </div>
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            aria-label="Đóng modal"
            className="w-10 h-10 rounded-2xl bg-[#FAF5EB] hover:bg-[#F2ECE0] text-[#3D352E] border-2 border-[#3D352E] font-black text-sm flex items-center justify-center cursor-pointer disabled:opacity-50 shrink-0"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-3.5">
          {subtitle && (
            <div className="px-3 py-2 rounded-xl bg-[#FAF5EB] border border-[#DECDBB] text-[11.5px] font-bold text-[#6E5D53]">
              {subtitle}
            </div>
          )}

          <div>
            <label className="block text-xs font-black text-[#6E5D53] uppercase mb-1">
              {isFolder ? 'Tên Thư mục mới *' : 'Tên Chủ đề mới *'}
            </label>
            <input
              ref={inputRef}
              type="text"
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={isFolder ? 'Nhập tên thư mục mới...' : 'Nhập tên chủ đề mới...'}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF5EB] border-2 border-[#3D352E] text-xs font-bold text-[#3D352E] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#557A46]"
            />
          </div>

          {isDuplicateTarget && (
            <div className="px-3 py-2 rounded-xl bg-[#FEF3D6] border border-[#D96B43] text-[11px] font-bold text-[#9C4221]">
              {isFolder
                ? `Thư mục "${trimmed}" đã tồn tại. Nếu lưu, các chủ đề sẽ được gộp vào thư mục "${trimmed}".`
                : `Tên "${trimmed}" đã có trong danh sách. Hãy kiểm tra lại để tránh trùng tên.`}
            </div>
          )}

          <div className="pt-3 flex items-center justify-end gap-2 border-t-2 border-[#FAF5EB]">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="min-h-[42px] px-4 py-2 rounded-2xl bg-[#FAF5EB] hover:bg-[#F2ECE0] text-[#3D352E] border-2 border-[#3D352E] text-xs font-black transition cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!trimmed || isUnchanged || isSaving}
              className="min-h-[42px] px-5 py-2 rounded-2xl bg-[#557A46] hover:bg-[#476739] text-white text-xs font-black border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] active:translate-y-0.5 transition disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu tên mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RenameModal;
