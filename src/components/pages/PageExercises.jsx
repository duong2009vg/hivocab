// src/components/pages/PageExercises.jsx
// Trang chọn đề thi THPT - Phong cách Cozy Crayon ấm áp (Sáp màu & Bàn học tập)

import React, { useState, useMemo, useCallback } from 'react';
import { useThptExams } from '../../hooks/useThptExams';
import { ExamCard } from '../thpt/ExamCard';
import { ExamCustomTimeModal } from '../thpt/ExamModals';
import { useRoute } from '../../router/RouteContext.jsx';

export function PageExercises() {
  const { navigateTo } = useRoute();
  const { exams, allExams, loading, error, searchQuery, setSearchQuery, bestScores } = useThptExams();

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'qg' | 'provinces' | 'completed'
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

  // Lọc theo tabs
  const filteredExams = useMemo(() => {
    let list = exams || [];
    if (activeFilter === 'qg') {
      list = list.filter(
        (e) =>
          (e.title || '').toLowerCase().includes('quốc gia') ||
          (e.title || '').toLowerCase().includes('bộ gd') ||
          (e.title || '').toLowerCase().includes('chính thức')
      );
    } else if (activeFilter === 'provinces') {
      list = list.filter(
        (e) =>
          (e.title || '').toLowerCase().includes('sở') ||
          (e.title || '').toLowerCase().includes('chuyên') ||
          (e.title || '').toLowerCase().includes('thử')
      );
    } else if (activeFilter === 'completed') {
      list = list.filter((e) => Boolean(bestScores[e.id]));
    }
    return list;
  }, [exams, activeFilter, bestScores]);

  const completedCount = useMemo(() => {
    return Object.keys(bestScores || {}).length;
  }, [bestScores]);

  return (
    <div id="page-exercises" className="page active min-h-screen bg-[#FAF5EB] font-sans antialiased text-[#382E2B]">
      
      {/* ========================================================================= */}
      {/* MOBILE LAYOUT (block lg:hidden) - Cozy Crayon Mobile                     */}
      {/* ========================================================================= */}
      <div className="block lg:hidden w-full max-w-[430px] mx-auto min-h-screen pb-28 px-4 pt-3 pwa-safe-top">
        {/* Mobile Header */}
        <section className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-heading font-black tracking-tight text-[#382E2B]">
                Luyện đề THPT 🎓
              </h1>
              <span className="inline-block px-2.5 py-0.5 text-xs font-black text-[#557A46] bg-[#E5EFE2] border border-[#8FB383] rounded-full rotate-[-2deg]">
                38+ Đề
              </span>
            </div>
            <span className="text-2xl select-none">✏️</span>
          </div>

          <p className="text-xs text-[#7D716A] font-semibold leading-relaxed -mt-1">
            Kho đề thi chuẩn ma trận Bộ GD&ĐT · Bấm giờ 50 phút tự động.
          </p>

          {/* Search bar */}
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm đề thi theo tỉnh, năm..."
              className="w-full pl-9 pr-9 py-2.5 text-xs sm:text-sm bg-white rounded-full border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] focus:ring-0 focus:outline-none placeholder:text-[#9C8F85] font-semibold"
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm select-none">🔍</span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-[#7D716A] hover:text-[#382E2B]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 pb-1">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-black border-2 border-[#382E2B] whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-[#382E2B] text-white shadow-[2px_2px_0px_#382E2B]'
                  : 'bg-white text-[#382E2B]'
              }`}
            >
              Tất cả ({allExams.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('qg')}
              className={`px-3 py-1.5 rounded-full text-xs font-black border-2 border-[#382E2B] whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === 'qg'
                  ? 'bg-[#382E2B] text-white shadow-[2px_2px_0px_#382E2B]'
                  : 'bg-white text-[#382E2B]'
              }`}
            >
              Bộ GD&ĐT
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('provinces')}
              className={`px-3 py-1.5 rounded-full text-xs font-black border-2 border-[#382E2B] whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === 'provinces'
                  ? 'bg-[#382E2B] text-white shadow-[2px_2px_0px_#382E2B]'
                  : 'bg-white text-[#382E2B]'
              }`}
            >
              Sở & Chuyên
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('completed')}
              className={`px-3 py-1.5 rounded-full text-xs font-black border-2 border-[#382E2B] whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === 'completed'
                  ? 'bg-[#5a7d4d] text-white shadow-[2px_2px_0px_#382E2B]'
                  : 'bg-white text-[#382E2B]'
              }`}
            >
              Đã làm ({completedCount})
            </button>
          </div>
        </section>

        {/* Mobile Exam List */}
        <section className="mt-4 space-y-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-10 h-10 border-3 border-[#5a7d4d]/30 border-t-[#5a7d4d] rounded-full animate-spin" />
              <p className="text-xs font-bold text-[#7D716A]">Đang nạp danh sách đề thi...</p>
            </div>
          )}

          {error && !loading && (
            <div className="bg-white rounded-3xl border-2 border-[#382E2B] p-6 text-center shadow-[3px_3px_0px_#382E2B]">
              <span className="text-3xl mb-2 block">⚠️</span>
              <p className="text-xs font-bold text-[#C85A3F]">{error}</p>
            </div>
          )}

          {!loading && !error && filteredExams.length === 0 && (
            <div className="bg-white rounded-3xl border-2 border-[#382E2B] p-6 text-center shadow-[3px_3px_0px_#382E2B]">
              <span className="text-3xl mb-2 block">🔍</span>
              <h4 className="text-sm font-black text-[#382E2B]">Không tìm thấy đề thi</h4>
              <p className="text-xs text-[#7D716A] mt-1 font-semibold">
                Thử đổi từ khóa hoặc chọn tab Tất cả nhé!
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            filteredExams.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                bestScore={bestScores[exam.id]}
                onStart={handleStart}
                onCustomTime={handleOpenCustomTime}
              />
            ))}
        </section>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP LAYOUT (hidden lg:flex) - Cozy Crayon Desktop                     */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex flex-col min-w-0 flex-1 lg:pl-64 xl:pl-72">
        {/* Top Header Bar */}
        <header className="px-8 pt-6 pb-4 bg-[#FFFDF9] border-b-2 border-[#382E2B] flex items-center justify-between sticky top-0 z-10 select-none">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl xl:text-3xl font-heading font-black text-[#382E2B] tracking-tight">
                Phòng Luyện Đề THPT Quốc Gia & CBT 🎓
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-[#EAF4E8] text-[#4F7D4B] border-2 border-[#6E9B6A] flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#6E9B6A]"></span>
                {allExams.length} đề thi sẵn sàng
              </span>
            </div>
            <p className="text-xs xl:text-sm font-semibold text-[#766C5F] mt-1">
              Kho đề thi chuẩn ma trận Bộ Giáo dục, tích hợp bộ đếm giờ tự động 50 phút và giải thích từ vựng chi tiết.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-72 xl:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm nhanh trường, tỉnh, năm thi..."
              className="w-full pl-10 pr-9 py-2.5 text-xs xl:text-sm bg-white rounded-full border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] focus:outline-none focus:ring-0 placeholder:text-[#9C8F85] font-semibold transition-all"
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm select-none">🔍</span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-[#766C5F] hover:text-[#382E2B] p-1 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </header>

        {/* Content Container */}
        <div className="p-8 space-y-6 max-w-[1440px] w-full mx-auto">
          {/* Hero Study Banner */}
          <section className="bg-gradient-to-r from-[#EEF4EE] via-[#FFFDF9] to-[#F7EEE4] rounded-3xl border-2 border-[#382E2B] p-6 xl:p-7 shadow-[3px_4px_0px_#382E2B] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 select-none">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5EFE2] text-[#557A46] border border-[#8FB383] text-xs font-bold">
                <span>🌟</span>
                <span>Cấu trúc chuẩn kỳ thi tốt nghiệp THPT Quốc Gia</span>
              </div>
              <h2 className="text-xl xl:text-2xl font-heading font-black text-[#382E2B] leading-tight">
                Rèn luyện áp lực phòng thi thực tế cùng <span className="text-[#D36135]">HiVocab CBT</span>
              </h2>
              {/* Tiger speech bubble */}
              <div className="bg-[#FFFDF9] border-2 border-[#382E2B] rounded-2xl p-3.5 relative inline-block text-xs xl:text-sm font-bold text-[#382E2B] shadow-2xs">
                <span className="text-[#D36135]">Bé Hổ nhắc:</span> "Làm bài thi đều đặn mỗi tuần để quen áp lực 50 phút và cọ xát với ma trận từ vựng thực tế nhé! 🐾"
                <div className="absolute -left-2 top-4 w-3 h-3 bg-[#FFFDF9] border-l-2 border-b-2 border-[#382E2B] rotate-45"></div>
              </div>
              <div className="flex items-center gap-4 pt-1 text-xs font-bold text-[#6B5A4E]">
                <span className="flex items-center gap-1.5">⏱️ 50 phút/đề</span>
                <span className="flex items-center gap-1.5">📝 40-50 câu trắc nghiệm</span>
                <span className="flex items-center gap-1.5">💡 Chấm điểm & giải thích tức thì</span>
              </div>
            </div>

            {/* Mascot Image */}
            <div className="shrink-0 w-44 h-44 xl:w-52 xl:h-52 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-amber-100/50 rounded-full filter blur-xl transform -rotate-6"></div>
              <img
                src="/mascot/mascot_cozy.png"
                alt="Bé Hổ Churbito"
                className="w-full h-full object-contain relative z-10 mix-blend-multiply drop-shadow-sm transition-transform hover:scale-105 duration-300 select-none"
              />
            </div>
          </section>

          {/* Filter Pills Bar & Counter */}
          <div className="flex items-center justify-between gap-4 flex-wrap select-none pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 rounded-2xl text-xs xl:text-sm font-black border-2 border-[#382E2B] transition-all cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-[#382E2B] text-white shadow-[2px_3px_0px_#382E2B]'
                    : 'bg-white text-[#382E2B] hover:bg-[#FAF5EB]'
                }`}
              >
                Tất cả đề ({allExams.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('qg')}
                className={`px-4 py-2 rounded-2xl text-xs xl:text-sm font-black border-2 border-[#382E2B] transition-all cursor-pointer ${
                  activeFilter === 'qg'
                    ? 'bg-[#382E2B] text-white shadow-[2px_3px_0px_#382E2B]'
                    : 'bg-white text-[#382E2B] hover:bg-[#FAF5EB]'
                }`}
              >
                🏛️ Đề thi Bộ GD&ĐT
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('provinces')}
                className={`px-4 py-2 rounded-2xl text-xs xl:text-sm font-black border-2 border-[#382E2B] transition-all cursor-pointer ${
                  activeFilter === 'provinces'
                    ? 'bg-[#382E2B] text-white shadow-[2px_3px_0px_#382E2B]'
                    : 'bg-white text-[#382E2B] hover:bg-[#FAF5EB]'
                }`}
              >
                🏫 Đề thi thử Sở & Chuyên
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('completed')}
                className={`px-4 py-2 rounded-2xl text-xs xl:text-sm font-black border-2 border-[#382E2B] transition-all cursor-pointer ${
                  activeFilter === 'completed'
                    ? 'bg-[#5a7d4d] text-white shadow-[2px_3px_0px_#382E2B]'
                    : 'bg-white text-[#382E2B] hover:bg-[#FAF5EB]'
                }`}
              >
                ✅ Đã hoàn thành ({completedCount})
              </button>
            </div>

            <div className="text-xs font-black text-[#766C5F]">
              Hiển thị <span className="text-[#D36135]">{filteredExams.length}</span> đề thi phù hợp
            </div>
          </div>

          {/* Exam Grid */}
          <section className="pb-16">
            {loading && (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-12 h-12 border-4 border-[#5a7d4d]/30 border-t-[#5a7d4d] rounded-full animate-spin" />
                <p className="text-sm font-bold text-[#766C5F]">Đang nạp ngân hàng đề thi THPT...</p>
              </div>
            )}

            {error && !loading && (
              <div className="bg-white rounded-3xl border-2 border-[#382E2B] p-12 text-center shadow-[3px_4px_0px_#382E2B] max-w-lg mx-auto">
                <span className="text-5xl mb-3 block">⚠️</span>
                <h3 className="text-base font-black text-[#382E2B]">Không thể tải danh sách đề thi</h3>
                <p className="text-xs text-[#766C5F] mt-1 font-semibold">{error}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-4 px-5 py-2.5 rounded-2xl bg-[#5a7d4d] text-white text-xs font-black border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] cursor-pointer"
                >
                  Tải lại trang
                </button>
              </div>
            )}

            {!loading && !error && filteredExams.length === 0 && (
              <div className="bg-white rounded-3xl border-2 border-[#382E2B] p-12 text-center shadow-[3px_4px_0px_#382E2B] max-w-lg mx-auto">
                <span className="text-5xl mb-3 block">🔍</span>
                <h3 className="text-base font-black text-[#382E2B]">Không tìm thấy đề thi phù hợp</h3>
                <p className="text-xs text-[#766C5F] mt-1 font-semibold">
                  Không có đề thi nào khớp với từ khóa "{searchQuery}".
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveFilter('all');
                  }}
                  className="mt-4 px-5 py-2 rounded-2xl bg-[#FAF5EB] text-[#382E2B] text-xs font-black border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] cursor-pointer"
                >
                  Xoá bộ lọc tìm kiếm
                </button>
              </div>
            )}

            {!loading && !error && filteredExams.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredExams.map((exam) => (
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
          </section>
        </div>
      </div>

      {/* Custom Time Modal */}
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
