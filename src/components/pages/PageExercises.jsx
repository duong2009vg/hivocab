// src/components/pages/PageExercises.jsx
// Trang danh sách đề thi THPT - React thuần, không còn window.ThptExam

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
    <div id="page-exercises" className="page active flex flex-col h-full bg-[#f4f6f9]">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 md:px-6 md:py-4 shrink-0 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-black text-lg md:text-xl text-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-[22px]">school</span>
              Luyện Thi THPT Tiếng Anh
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {loading ? 'Đang tải...' : `${allExams.length} đề thi · Luyện tập không giới hạn`}
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm đề thi..."
              className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Search results count */}
        {searchQuery && (
          <p className="text-xs text-slate-500 mt-2">
            Tìm thấy <strong>{exams.length}</strong> đề thi phù hợp
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm text-slate-500">Đang nạp danh sách đề thi...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <span className="material-symbols-outlined text-rose-400 text-[48px]">error_outline</span>
            <p className="text-slate-600 font-semibold">Không tải được danh sách đề thi</p>
            <p className="text-xs text-slate-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors"
            >
              Tải lại trang
            </button>
          </div>
        )}

        {/* Empty search result */}
        {!loading && !error && exams.length === 0 && searchQuery && (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <span className="material-symbols-outlined text-slate-300 text-[48px]">search_off</span>
            <p className="text-slate-500">Không tìm thấy đề thi nào cho <strong>"{searchQuery}"</strong></p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-sm text-blue-600 hover:underline"
            >
              Xoá tìm kiếm
            </button>
          </div>
        )}

        {/* Exam grid */}
        {!loading && !error && exams.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
