// src/components/bilingual/BilingualPassageSwitcher.jsx
// Dropdown menu đổi bài đọc - Phong cách Cozy Crayon ấm áp

import React, { useEffect, useRef } from 'react';

export function BilingualPassageSwitcher({
  isOpen,
  onClose,
  currentPassageId,
  onSelectPassage,
}) {
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const tests = typeof window !== 'undefined' ? window._camHierarchy?.tests || [] : [];

  return (
    <div
      ref={dropdownRef}
      className="absolute left-0 top-full mt-2 w-72 sm:w-84 bg-[#FFFDF9] border-2 border-[#382E2B] rounded-3xl shadow-[5px_6px_0px_#382E2B] p-3 z-50 max-h-80 overflow-y-auto fade-in select-none"
    >
      {tests.length === 0 ? (
        <p className="text-xs font-bold text-[#766C5F] p-4 text-center">
          Không có bài đọc khác trong bộ này
        </p>
      ) : (
        tests.map((test, tIdx) => {
          if (!test.passages || test.passages.length === 0) return null;

          return (
            <div key={test.id || tIdx} className="mb-3">
              <div className="px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#4A3E39] bg-[#EFE8D6] rounded-xl border border-[#382E2B]/30 my-1">
                {test.name}
              </div>

              <div className="space-y-1.5 mt-1.5">
                {test.passages.map((p) => {
                  const isActive = p.id === currentPassageId;
                  const hasReading = Boolean(p.contentEn || p.content_en);

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        onSelectPassage(p.id);
                        onClose();
                      }}
                      className={`w-full text-left px-3 py-2 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#5a7d4d] text-white border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B]'
                          : 'text-[#382E2B] hover:bg-[#FAF5EB] border-2 border-transparent'
                      }`}
                    >
                      <div className="truncate">
                        <span className="opacity-80 mr-1">P{p.passageNumber || p.passage_number}:</span>
                        <span>{p.title || `Passage ${p.passageNumber || p.passage_number}`}</span>
                      </div>
                      {hasReading && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-black shrink-0 ${
                            isActive
                              ? 'bg-white/25 text-white'
                              : 'bg-[#E5EFE2] text-[#557A46] border border-[#8FB383]'
                          }`}
                        >
                          Song ngữ
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default BilingualPassageSwitcher;
