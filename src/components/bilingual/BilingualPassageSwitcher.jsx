// src/components/bilingual/BilingualPassageSwitcher.jsx
// Dropdown menu for quickly switching passages within the current Cambridge test set

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
      className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-surface/95 dark:bg-neutral-900/95 backdrop-blur-2xl border border-outline-variant/30 rounded-2xl shadow-2xl p-2 z-50 max-h-80 overflow-y-auto fade-in"
    >
      {tests.length === 0 ? (
        <p className="text-xs text-on-surface-variant p-3 text-center">
          Không có bài đọc khác
        </p>
      ) : (
        tests.map((test, tIdx) => {
          if (!test.passages || test.passages.length === 0) return null;

          return (
            <div key={test.id || tIdx} className="mb-2">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-outline bg-surface-container-high/60 rounded-md my-1">
                {test.name}
              </div>

              <div className="space-y-1">
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
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-primary text-on-primary font-bold'
                          : 'text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      <div className="truncate">
                        <span className="opacity-80 mr-1">P{p.passageNumber || p.passage_number}:</span>
                        <span>{p.title || `Passage ${p.passageNumber || p.passage_number}`}</span>
                      </div>
                      {hasReading && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold shrink-0 ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-primary/20 text-primary'
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
