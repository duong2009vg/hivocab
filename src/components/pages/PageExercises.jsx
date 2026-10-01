// src/components/pages/PageExercises.jsx
// Trang danh sách đề thi THPT - Pure React, chuẩn responsive desktop, theme HiVocab Liquid Glass

import React, { useState, useCallback } from 'react';
import { useThptExams } from '../../hooks/useThptExams';
import { ExamCard } from '../thpt/ExamCard';
import { ExamCustomTimeModal } from '../thpt/ExamModals';
import { useRoute } from '../../router/RouteContext.jsx';

export function PageExercises() {
  const { navigateTo } = useRoute();
  const { exams, allExams, loading, error, searchQuery, setSearchQuery, bestScores } = useThptExams();

  // Custom time modal state
  const [customTimeModal, setCustomTimeModal] = useState(null); // { examId, examTitle } | null

  // Bắt đầu thi với số phút cho trước
  const handleStart = useCallback((examId, minutes) => {
    window._thptStartConfig = { examId, minutes };
    navigateTo('thpt-room', true);
  }, [navigateTo]);

  // Mở modal chọn thời gian tùy chỉnh
  const handleOpenCustomTime = useCallback((examId, examTitle) => {
    setCustomTimeModal({ examId, examTitle });
  }, []);

  // Xác nhận từ custom time modal
  const handleCustomTimeStart = useCallback((examId, minutes) => {
    setCustomTimeModal(null);
    handleStart(examId, minutes);
  }, [handleStart]);

  return (
    <div id="page-exercises" className="page active min-h-screen bg-surface">
      <main className="lg:ml-64 min-h-screen mobile-page-top lg:pt-8 pb-28 lg:pb-12 px-4 sm:px-6 lg:px-10 flex flex-col">
        <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6 fade-in">
          
          {/* Header & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
            <div>
              <h1 className="text-2xl sm:text-headline-lg font-bold text-on-surface tracking-tight flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-[28px]">school</span>
                Luyện Thi THPT Tiếng Anh
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                {loading ? 'Đang chuẩn bị đề thi...' : `Kho ${allExams.length} đề thi thử THPT Quốc Gia & ĐGNL mới nhất · Luyện tập không giới hạn`}
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-80">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm trường, tỉnh, năm thi..."
                className="w-full pl-10 pr-9 py-2.5 text-sm bg-surface-container-lowest border border-outline-variant/30 rounded-2xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all shadow-2xs text-on-surface placeholder:text-outline"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-0.5 rounded-full hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
          </div>

          {searchQuery && (
            <div className="text-xs font-semibold text-on-surface-variant -mt-2">
              Tìm thấy <span className="text-primary font-bold">{exams.length}</span> đề thi phù hợp với từ khóa "{searchQuery}"
            </div>
          )}

          {/* Main content grid */}
          <div className="flex-1 w-full">
            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-sm font-medium text-on-surface-variant">Đang tải danh sách đề thi THPT...</p>
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-surface-container-lowest rounded-3xl border border-outline-variant/20 shadow-2xs">
                <span className="material-symbols-outlined text-[48px] text-error mb-2">error_outline</span>
                <h3 className="text-base font-bold text-on-surface mb-1">Không thể tải danh sách đề thi</h3>
                <p className="text-xs sm:text-sm text-on-surface-variant max-w-sm mb-4">{error}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs sm:text-sm font-bold shadow-xs hover:bg-primary/90 transition-all active:scale-95"
                >
                  Tải lại trang
                </button>
              </div>
            )}

            {/* Empty search result */}
            {!loading && !error && exams.length === 0 && searchQuery && (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-surface-container-lowest rounded-3xl border border-outline-variant/20 shadow-2xs">
                <span className="material-symbols-outlined text-[54px] text-outline mb-2">search_off</span>
                <h3 className="text-base font-bold text-on-surface mb-1">Không tìm thấy đề thi phù hợp</h3>
                <p className="text-xs sm:text-sm text-on-surface-variant max-w-sm mb-4">
                  Không tìm thấy đề nào cho <strong>"{searchQuery}"</strong>. Hãy thử tìm theo tên tỉnh hoặc trường học.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs sm:text-sm font-bold text-primary hover:underline"
                >
                  Xoá từ khóa tìm kiếm
                </button>
              </div>
            )}

            {/* Exam grid */}
            {!loading && !error && exams.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5 pb-8">
                {exams.map(exam => (
                  <ExamCard
                    key={exam.id}
                    exam={exam}
                    bestScore={bestScores[exam.id]}
                    onStart={handleStart}
                    onCustomTime={handleOpenCustomTime}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Custom time modal */}
      {customTimeModal && (
        <ExamCustomTimeModal
          examId={customTimeModal.examId}
          examTitle={customTimeModal.examTitle}
          onStart={handleCustomTimeStart}
          onCancel={() => setCustomTimeModal(null)}
        />
      )}
    </div>
  );
}

export default PageExercises;
