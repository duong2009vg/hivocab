// src/components/pages/PageExercises.jsx
// Trang chọn đề thi THPT - Phong cách Cozy Crayon ấm áp (Sáp màu & Bàn học tập)
// Hỗ trợ tab lọc "Miễn phí" và "Gói PRO" đồng bộ cùng cờ is_pro

import React, { useState, useMemo, useCallback } from 'react';
import { useThptExams } from '../../hooks/useThptExams';
import { ExamCard } from '../thpt/ExamCard';
import { ExamCustomTimeModal } from '../thpt/ExamModals';
import { useRoute } from '../../router/RouteContext.jsx';
import { GraduationCap, PenTool, Search, X, Crown, Gift, Landmark, School, CheckCircle2, AlertTriangle } from 'lucide-react';

export function PageExercises() {
  const { navigateTo } = useRoute();
  const { exams, allExams, loading, error, searchQuery, setSearchQuery, bestScores } = useThptExams();

  // Tab lọc: 'all' | 'free' | 'pro' | 'qg' | 'provinces' | 'completed'
  const [activeFilter, setActiveFilter] = useState('all');
  const [customTimeModal, setCustomTimeModal] = useState(null);

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

  // Đếm số lượng đề thi theo từng loại
  const freeCount = useMemo(() => {
    return (allExams || []).filter((e) => !e.is_pro).length;
  }, [allExams]);

  const proCount = useMemo(() => {
    return (allExams || []).filter((e) => Boolean(e.is_pro)).length;
  }, [allExams]);

  const completedCount = useMemo(() => {
    return Object.keys(bestScores || {}).length;
  }, [bestScores]);

  // Lọc danh sách đề thi theo tab được chọn
  const filteredExams = useMemo(() => {
    let list = exams || [];
    if (activeFilter === 'free') {
      list = list.filter((e) => !e.is_pro);
    } else if (activeFilter === 'pro') {
      list = list.filter((e) => Boolean(e.is_pro));
    } else if (activeFilter === 'qg') {
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

  return (
    <div id="page-exercises" className="page active min-h-screen bg-[#FAF5EB] font-sans antialiased text-[#382E2B]">
      
      {/* MOBILE LAYOUT (block lg:hidden) */}
      <div className="block lg:hidden w-full max-w-[430px] mx-auto min-h-screen pb-28 px-4 pt-3 pwa-safe-top">
        <section className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-heading font-black tracking-tight text-[#382E2B] flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-[#557A46] shrink-0" />
                Luyện đề THPT
              </h1>
              <span className="inline-block px-2.5 py-0.5 text-xs font-black text-[#557A46] bg-[#E5EFE2] border border-[#8FB383] rounded-full rotate-[-2deg]">
                {allExams.length}+ Đề
              </span>
            </div>
            <PenTool className="w-6 h-6 text-[#7D716A] shrink-0" />
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
            <Search className="w-4 h-4 text-[#9C8F85] absolute left-3.5 top-1/2 -translate-y-1/2 shrink-0 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-[#7D716A] hover:text-[#382E2B]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mobile Filter Pills */}
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
              onClick={() => setActiveFilter('free')}
              className={`px-3 py-1.5 rounded-full text-xs font-black border-2 border-[#382E2B] whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === 'free'
                  ? 'bg-[#557A46] text-white shadow-[2px_2px_0px_#382E2B]'
                  : 'bg-[#E5EFE2] text-[#4F7D4B]'
              }`}
            >
              Miễn phí ({freeCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('pro')}
              className={`px-3 py-1.5 rounded-full text-xs font-black border-2 border-[#382E2B] whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === 'pro'
                  ? 'bg-[#B87C24] text-white shadow-[2px_2px_0px_#382E2B]'
                  : 'bg-[#FFE8C2] text-[#8C5311]'
              }`}
            >
              <span className="inline-flex items-center gap-1"><Crown className="w-3.5 h-3.5 text-[#8C5311] shrink-0" /> Gói PRO ({proCount})</span>
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
              <AlertTriangle className="w-8 h-8 text-[#C85A3F] mx-auto mb-2 shrink-0" />
              <p className="text-xs font-bold text-[#C85A3F]">{error}</p>
            </div>
          )}

          {!loading && !error && filteredExams.length === 0 && (
            <div className="bg-white rounded-3xl border-2 border-[#382E2B] p-6 text-center shadow-[3px_3px_0px_#382E2B]">
              <Search className="w-8 h-8 text-[#9C8F85] mx-auto mb-2 shrink-0" />
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
                is_pro={exam.is_pro}
                bestScore={bestScores[exam.id]}
                onStart={handleStart}
                onCustomTime={handleOpenCustomTime}
              />
            ))}
        </section>
      </div>

      {/* DESKTOP LAYOUT (hidden lg:flex) */}
      <div className="hidden lg:flex flex-col min-w-0 flex-1 lg:pl-[var(--sidebar-w,244px)]">
        <div className="p-6 xl:p-8 space-y-5 max-w-[1440px] w-full mx-auto">
          {/* Desktop Filter Pills & Search Bar */}
          <div className="flex items-center justify-between gap-4 flex-wrap select-none">
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
                onClick={() => setActiveFilter('free')}
                className={`px-4 py-2 rounded-2xl text-xs xl:text-sm font-black border-2 border-[#382E2B] transition-all cursor-pointer ${
                  activeFilter === 'free'
                    ? 'bg-[#557A46] text-white shadow-[2px_3px_0px_#382E2B]'
                    : 'bg-[#E5EFE2] text-[#4F7D4B] hover:bg-[#d8e8d4]'
                }`}
              >
                <span className="inline-flex items-center gap-1.5"><Gift className="w-4 h-4 shrink-0" /> Đề Miễn Phí ({freeCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('pro')}
                className={`px-4 py-2 rounded-2xl text-xs xl:text-sm font-black border-2 border-[#382E2B] transition-all cursor-pointer ${
                  activeFilter === 'pro'
                    ? 'bg-[#B87C24] text-white shadow-[2px_3px_0px_#382E2B]'
                    : 'bg-[#FFE8C2] text-[#8C5311] hover:bg-[#fde0b2]'
                }`}
              >
                <span className="inline-flex items-center gap-1.5"><Crown className="w-4 h-4 shrink-0" /> Gói PRO ({proCount})</span>
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
                <span className="inline-flex items-center gap-1.5"><Landmark className="w-4 h-4 shrink-0" /> Đề thi Bộ GD&ĐT</span>
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
                <span className="inline-flex items-center gap-1.5"><School className="w-4 h-4 shrink-0" /> Đề thi thử Sở & Chuyên</span>
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
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 shrink-0" /> Đã hoàn thành ({completedCount})</span>
              </button>
            </div>

            {/* Thanh tìm kiếm */}
            <div className="relative w-72 xl:w-80 shrink-0">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm nhanh trường, tỉnh, năm thi..."
                className="w-full pl-10 pr-9 py-2.5 text-xs xl:text-sm bg-white rounded-full border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] focus:outline-none focus:ring-0 placeholder:text-[#9C8F85] font-semibold transition-all"
              />
              <Search className="w-4 h-4 text-[#9C8F85] absolute left-3.5 top-1/2 -translate-y-1/2 shrink-0 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-[#766C5F] hover:text-[#382E2B] p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="text-xs font-black text-[#766C5F]">
            Hiển thị <span className="text-[#D36135]">{filteredExams.length}</span> đề thi phù hợp
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
                <AlertTriangle className="w-12 h-12 text-[#C85A3F] mx-auto mb-3 shrink-0" />
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
                <Search className="w-12 h-12 text-[#9C8F85] mx-auto mb-3 shrink-0" />
                <h3 className="text-base font-black text-[#382E2B]">Không tìm thấy đề thi phù hợp</h3>
                <p className="text-xs text-[#766C5F] mt-1 font-semibold">
                  Không có đề thi nào khớp với bộ lọc đang chọn.
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
                    is_pro={exam.is_pro}
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
