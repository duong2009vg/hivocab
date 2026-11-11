// src/components/pages/PageExercises.jsx
// Lộ trình ôn thi THPT Quốc Gia - 3 Quyển sách lộ trình toàn diện
// Quyển 1: 38 đề THPT trường, sở
// Quyển 2: Chinh phục 9+ THPT Quốc Gia (29 chuyên đề: lý thuyết + bài tập)
// Quyển 3: Bộ 10 đề dự đoán THPT

import React, { useState, useMemo, useCallback } from 'react';
import { useThptExams } from '../../hooks/useThptExams';
import { ExamCard } from '../thpt/ExamCard';
import { ExamCustomTimeModal } from '../thpt/ExamModals';
import { useRoute } from '../../router/RouteContext.jsx';
import {
  BookOpen,
  School,
  Landmark,
  Compass,
  Search,
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Gift,
  Crown
} from 'lucide-react';
import RoadmapChuyenDeView from '../exercises/RoadmapChuyenDeView.jsx';

const BOOKS = [
  {
    id: 'book1',
    number: 'Quyển 1',
    title: '38 đề THPT trường, sở',
    subtitle: 'Đề thi thử các trường chuyên & Sở GD&ĐT cả nước',
    badge: '38 đề thi',
    icon: School,
    color: '#557A46',
    activeBg: 'bg-[#557A46] text-white',
    inactiveBg: 'bg-white text-[#302A24] hover:bg-[#FAF5EB]',
  },
  {
    id: 'book2',
    number: 'Quyển 2',
    title: 'Chinh phục 9+ THPT Quốc Gia',
    subtitle: '29 chuyên đề học tập · Lý thuyết trọng tâm & 1.004 câu hỏi',
    badge: '29 chuyên đề',
    icon: BookOpen,
    color: '#D97706',
    activeBg: 'bg-[#D97706] text-white',
    inactiveBg: 'bg-white text-[#302A24] hover:bg-[#FAF5EB]',
  },
  {
    id: 'book3',
    number: 'Quyển 3',
    title: 'Bộ 10 đề dự đoán THPT',
    subtitle: '10 đề phát triển minh họa ma trận Bộ GD&ĐT 2026',
    badge: '10 đề mới',
    icon: Landmark,
    color: '#2563EB',
    activeBg: 'bg-[#2563EB] text-white',
    inactiveBg: 'bg-white text-[#302A24] hover:bg-[#FAF5EB]',
  },
];

export function PageExercises() {
  const { navigateTo } = useRoute();
  const { allExams, loading, error, bestScores } = useThptExams();

  // Tab chọn Quyển sách: 'book1' | 'book2' | 'book3'
  const [activeBook, setActiveBook] = useState('book1');

  // Bộ lọc cho danh sách đề thi (Quyển 1 & Quyển 3)
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [customTimeModal, setCustomTimeModal] = useState(null);

  // Bắt đầu thi với số phút
  const handleStart = useCallback((examId, minutes) => {
    window._thptStartConfig = { examId, minutes };
    navigateTo('thpt-room', true);
  }, [navigateTo]);

  // Mở modal thời gian tùy chỉnh
  const handleOpenCustomTime = useCallback((examId, examTitle) => {
    setCustomTimeModal({ examId, examTitle });
  }, []);

  const handleCustomTimeStart = useCallback((examId, minutes) => {
    setCustomTimeModal(null);
    handleStart(examId, minutes);
  }, [handleStart]);

  // Phân chia đề thi theo 2 nhóm đề (Quyển 1 & Quyển 3)
  const schoolExams = useMemo(() => {
    return (allExams || []).filter(e => !e.id.startsWith('thpt-exam-dev-'));
  }, [allExams]);

  const predictedExams = useMemo(() => {
    return (allExams || []).filter(e => e.id.startsWith('thpt-exam-dev-'));
  }, [allExams]);

  // Lọc theo quyển hiện tại
  const currentBookExams = useMemo(() => {
    return activeBook === 'book3' ? predictedExams : schoolExams;
  }, [activeBook, predictedExams, schoolExams]);

  // Áp dụng bộ lọc tìm kiếm và filter pills cho đề thi
  const filteredExams = useMemo(() => {
    let list = currentBookExams;
    if (activeFilter === 'free') {
      list = list.filter((e) => !e.is_pro);
    } else if (activeFilter === 'pro') {
      list = list.filter((e) => Boolean(e.is_pro));
    } else if (activeFilter === 'completed') {
      list = list.filter((e) => Boolean(bestScores[e.id]));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((e) =>
        (e.title || '').toLowerCase().includes(q) ||
        (e.id || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [currentBookExams, activeFilter, searchQuery, bestScores]);

  const freeCount = useMemo(() => currentBookExams.filter((e) => !e.is_pro).length, [currentBookExams]);
  const proCount = useMemo(() => currentBookExams.filter((e) => Boolean(e.is_pro)).length, [currentBookExams]);
  const completedCount = useMemo(() => currentBookExams.filter((e) => Boolean(bestScores[e.id])).length, [currentBookExams, bestScores]);

  return (
    <div id="page-exercises" className="page active min-h-screen bg-[#FAF5EB] font-sans antialiased text-[#382E2B]">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6">
        
        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b-2 border-[#3D352E]">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#EAF5E4] text-[#557A46] text-xs font-black border border-[#3D352E]">
              <Compass className="w-3.5 h-3.5 text-[#557A46]" />
              <span>CHƯƠNG TRÌNH TOÀN DIỆN THPT 2026 - 2027</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-[#302A24] tracking-tight">
              Lộ trình ôn thi THPT Quốc Gia
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-[#786F66]">
              Bộ 3 quyển sách lộ trình: Ôn luyện từ chuyên đề nền tảng, thực chiến 38 đề trường sở đến 10 đề dự đoán mới nhất.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 p-1.5 rounded-2xl bg-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E]">
            <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-[#FEF3C7] text-[#302A24]">
              48 Đề thi
            </span>
            <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-[#EAF5E4] text-[#557A46]">
              29 Chuyên đề
            </span>
          </div>
        </div>

        {/* 3 Books Interactive Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
          {BOOKS.map((book) => {
            const isActive = activeBook === book.id;
            const IconComponent = book.icon;
            return (
              <div
                key={book.id}
                onClick={() => {
                  setActiveBook(book.id);
                  setSearchQuery('');
                  setActiveFilter('all');
                }}
                className={`rounded-3xl p-4 sm:p-5 border-[3px] border-[#3D352E] cursor-pointer transition-all flex flex-col justify-between ${
                  isActive
                    ? 'bg-[#FFFDF9] shadow-[5px_6px_0px_#3D352E] -translate-y-1 ring-2 ring-[#3D352E]'
                    : 'bg-[#FFFDF9]/80 hover:bg-[#FFFDF9] shadow-[2px_3px_0px_#3D352E] hover:-translate-y-0.5'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className="px-2.5 py-0.5 rounded-xl text-xs font-black border border-[#3D352E]"
                      style={{
                        backgroundColor: isActive ? book.color : '#FAF5EB',
                        color: isActive ? '#FFFFFF' : '#302A24',
                      }}
                    >
                      {book.number}
                    </span>
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-[#FAF5EB] text-[#786F66] border border-[#3D352E]/30">
                      {book.badge}
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5 mt-2">
                    <div
                      className="w-9 h-9 rounded-2xl border-2 border-[#3D352E] flex items-center justify-center shrink-0 mt-0.5 shadow-[1px_1px_0px_#3D352E]"
                      style={{ backgroundColor: isActive ? book.color : '#FEF3C7', color: isActive ? '#FFFFFF' : '#302A24' }}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-heading font-black text-base sm:text-lg text-[#302A24] leading-snug">
                        {book.title}
                      </h3>
                      <p className="text-xs font-semibold text-[#786F66] mt-1 line-clamp-2 leading-relaxed">
                        {book.subtitle}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-dashed border-[#DECDBB] flex items-center justify-between text-xs font-black">
                  <span style={{ color: isActive ? book.color : '#786F66' }}>
                    {isActive ? '• Đang mở quyển này' : 'Bấm để mở quyển'}
                  </span>
                  <span className={`w-6 h-6 rounded-full border border-[#3D352E] flex items-center justify-center text-xs ${
                    isActive ? 'bg-[#3D352E] text-white' : 'bg-white text-[#302A24]'
                  }`}>
                    →
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ======================== CONTENT AREA ======================== */}

        {activeBook === 'book2' ? (
          /* QUYỂN 2: CHINH PHỤC 9+ THPT QUỐC GIA (29 CHUYÊN ĐỀ) */
          <RoadmapChuyenDeView />
        ) : (
          /* QUYỂN 1 (38 ĐỀ TRƯỜNG, SỞ) HOẶC QUYỂN 3 (BỘ 10 ĐỀ DỰ ĐOÁN) */
          <div className="space-y-5">
            {/* Book Intro & Search Toolbar */}
            <div className="rounded-3xl bg-[#FFFDF9] border-[3px] border-[#3D352E] shadow-[4px_5px_0px_#3D352E] p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-heading font-black text-[#302A24]">
                    {activeBook === 'book1' ? 'Quyển 1: 38 đề THPT trường, sở' : 'Quyển 3: Bộ 10 đề dự đoán THPT 2026'}
                  </h2>
                  <p className="text-xs sm:text-sm font-semibold text-[#786F66]">
                    {activeBook === 'book1'
                      ? 'Tổng hợp 38 đề thi chính thức & khảo sát chất lượng từ các trường THPT Chuyên và Sở GD&ĐT.'
                      : 'Bộ 10 đề thi phát triển theo đúng ma trận cấu trúc minh họa mới nhất của Bộ Giáo dục và Đào tạo (40 câu / 50 phút).'}
                  </p>
                </div>
                <div className="px-3 py-1 rounded-2xl bg-[#EAF5E4] text-[#557A46] font-black text-xs border border-[#3D352E] shrink-0">
                  {currentBookExams.length} Đề thi
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={activeBook === 'book1' ? 'Tìm đề thi theo tỉnh, trường (Hà Nội, Sư Phạm, Chuyên Lam Sơn...)' : 'Tìm theo số đề (Đề 01, Đề 02...)'}
                  className="w-full pl-9 pr-9 py-2.5 text-xs sm:text-sm bg-white rounded-2xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] focus:ring-0 focus:outline-none placeholder:text-[#9C8F85] font-semibold text-[#302A24]"
                />
                <Search className="w-4 h-4 text-[#9C8F85] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-[#786F66] hover:text-[#302A24]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-black border-2 border-[#3D352E] whitespace-nowrap transition-all cursor-pointer ${
                    activeFilter === 'all'
                      ? 'bg-[#3D352E] text-white shadow-[2px_2px_0px_#3D352E]'
                      : 'bg-white text-[#302A24] hover:bg-[#FAF5EB]'
                  }`}
                >
                  Tất cả ({currentBookExams.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('free')}
                  className={`px-3 py-1.5 rounded-full text-xs font-black border-2 border-[#3D352E] whitespace-nowrap transition-all cursor-pointer ${
                    activeFilter === 'free'
                      ? 'bg-[#557A46] text-white shadow-[2px_2px_0px_#3D352E]'
                      : 'bg-[#EAF5E4] text-[#4F7D4B] hover:bg-[#dcead4]'
                  }`}
                >
                  Miễn phí ({freeCount})
                </button>
                {proCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter('pro')}
                    className={`px-3 py-1.5 rounded-full text-xs font-black border-2 border-[#3D352E] whitespace-nowrap transition-all cursor-pointer ${
                      activeFilter === 'pro'
                        ? 'bg-[#B87C24] text-white shadow-[2px_2px_0px_#3D352E]'
                        : 'bg-[#FFF6E6] text-[#B87C24] hover:bg-[#fceece]'
                    }`}
                  >
                    Gói PRO ({proCount})
                  </button>
                )}
                {completedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter('completed')}
                    className={`px-3 py-1.5 rounded-full text-xs font-black border-2 border-[#3D352E] whitespace-nowrap transition-all cursor-pointer ${
                      activeFilter === 'completed'
                        ? 'bg-[#557A46] text-white shadow-[2px_2px_0px_#3D352E]'
                        : 'bg-white text-[#302A24]'
                    }`}
                  >
                    Đã hoàn thành ({completedCount})
                  </button>
                )}
              </div>
            </div>

            {/* Exam Cards Grid */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-10 h-10 border-4 border-[#557A46] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold text-[#7D716A]">Đang tải danh sách đề thi...</p>
              </div>
            )}

            {error && !loading && (
              <div className="bg-white rounded-3xl border-2 border-[#382E2B] p-6 text-center shadow-[3px_3px_0px_#382E2B]">
                <AlertTriangle className="w-8 h-8 text-[#C85A3F] mx-auto mb-2 shrink-0" />
                <p className="text-xs font-bold text-[#C85A3F]">{error}</p>
              </div>
            )}

            {!loading && !error && filteredExams.length === 0 && (
              <div className="bg-white rounded-3xl border-2 border-[#382E2B] p-8 text-center shadow-[3px_3px_0px_#382E2B]">
                <Search className="w-8 h-8 text-[#9C8F85] mx-auto mb-2 shrink-0" />
                <h4 className="text-sm font-black text-[#382E2B]">Không tìm thấy đề thi</h4>
                <p className="text-xs text-[#7D716A] mt-1 font-semibold">
                  Thử đổi từ khóa hoặc chọn tab Tất cả nhé!
                </p>
              </div>
            )}

            {!loading && !error && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
          </div>
        )}

      </div>

      {/* Modal chỉnh thời gian làm bài */}
      {customTimeModal && (
        <ExamCustomTimeModal
          examTitle={customTimeModal.examTitle}
          onConfirm={(minutes) => handleCustomTimeStart(customTimeModal.examId, minutes)}
          onClose={() => setCustomTimeModal(null)}
        />
      )}
    </div>
  );
}

export default PageExercises;
