// src/components/pages/PageExercises.jsx
// Lộ trình ôn thi THPT Quốc Gia - 3 Quyển sách trên Kệ sách
// Quyển 1: 38 đề THPT trường, sở
// Quyển 2: Chinh phục 9+ THPT Quốc Gia (29 chuyên đề: lý thuyết + bài tập)
// Quyển 3: Bộ 10 đề dự đoán THPT
// Thiết kế: 3 cuốn sách thật trên kệ sách gỗ, nhấp vào sách mới mở nội dung chi tiết bên trong.

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useThptExams } from '../../hooks/useThptExams';
import { ExamCard } from '../thpt/ExamCard';
import { ExamCustomTimeModal } from '../thpt/ExamModals';
import { useRoute } from '../../router/RouteContext.jsx';
import {
  BookOpen,
  School,
  Landmark,
  Search,
  X,
  AlertTriangle,
  ArrowLeft,
  BookMarked,
  Sparkles,
  ChevronRight,
  Layers,
} from 'lucide-react';
import RoadmapChuyenDeView from '../exercises/RoadmapChuyenDeView.jsx';

const RESUME_KEY = 'hv_roadmap_open_book';

const BOOKS = [
  {
    id: 'book1',
    number: 'QUYỂN 1',
    title: '38 đề THPT trường, sở',
    subtitle: 'Đề thi thử chính thức & khảo sát từ các trường chuyên và Sở GD&ĐT cả nước',
    stat: '38 ĐỀ THI',
    statDetail: 'Trường Chuyên & Sở GD&ĐT',
    icon: School,
    cover: '#2D5A3D',
    coverDark: '#1E3E2A',
    ribbonColor: '#F59E0B',
    accentColor: '#86EFAC',
  },
  {
    id: 'book2',
    number: 'QUYỂN 2',
    title: 'Chinh phục 9+ THPT Quốc Gia',
    subtitle: '29 chuyên đề học tập · Học lý thuyết & chiến thuật trước, sau đó luyện tập thực chiến',
    stat: '29 CHUYÊN ĐỀ',
    statDetail: '1.004 Câu hỏi có giải thích',
    icon: BookOpen,
    cover: '#B45309',
    coverDark: '#78350F',
    ribbonColor: '#EAB308',
    accentColor: '#FDE047',
  },
  {
    id: 'book3',
    number: 'QUYỂN 3',
    title: 'Bộ 10 đề dự đoán THPT',
    subtitle: '10 đề phát triển minh họa theo chuẩn ma trận đề thi mới nhất của Bộ GD&ĐT 2026',
    stat: '10 ĐỀ DỰ ĐOÁN',
    statDetail: '40 câu / 50 phút chuẩn ma trận',
    icon: Landmark,
    cover: '#1E3A8A',
    coverDark: '#172554',
    ribbonColor: '#38BDF8',
    accentColor: '#93C5FD',
  },
];

export function PageExercises() {
  const { navigateTo } = useRoute();
  const { allExams, loading, error, bestScores } = useThptExams();

  // Quyển đang mở: null = đang ở kệ sách, 'book1' | 'book2' | 'book3'
  const [openBook, setOpenBook] = useState(() => {
    try {
      const saved = sessionStorage.getItem(RESUME_KEY);
      return BOOKS.some((b) => b.id === saved) ? saved : null;
    } catch (_) {
      return null;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.removeItem(RESUME_KEY);
    } catch (_) {
      /* ignore */
    }
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [customTimeModal, setCustomTimeModal] = useState(null);

  const handleOpenBook = useCallback((id) => {
    setOpenBook(id);
    setSearchQuery('');
    setActiveFilter('all');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleCloseBook = useCallback(() => {
    setOpenBook(null);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleStart = useCallback(
    (examId, minutes) => {
      try {
        sessionStorage.setItem(RESUME_KEY, openBook || '');
      } catch (_) {
        /* ignore */
      }
      window._thptStartConfig = { examId, minutes };
      navigateTo('thpt-room', true);
    },
    [navigateTo, openBook]
  );

  const handleOpenCustomTime = useCallback((examId, examTitle) => {
    setCustomTimeModal({ examId, examTitle });
  }, []);

  const handleCustomTimeStart = useCallback(
    (examId, minutes) => {
      setCustomTimeModal(null);
      handleStart(examId, minutes);
    },
    [handleStart]
  );

  const schoolExams = useMemo(
    () => (allExams || []).filter((e) => !e.id.startsWith('thpt-exam-dev-')),
    [allExams]
  );
  const predictedExams = useMemo(
    () => (allExams || []).filter((e) => e.id.startsWith('thpt-exam-dev-')),
    [allExams]
  );

  const currentBookExams = useMemo(
    () => (openBook === 'book3' ? predictedExams : schoolExams),
    [openBook, predictedExams, schoolExams]
  );

  const filteredExams = useMemo(() => {
    let list = currentBookExams;
    if (activeFilter === 'free') list = list.filter((e) => !e.is_pro);
    else if (activeFilter === 'pro') list = list.filter((e) => Boolean(e.is_pro));
    else if (activeFilter === 'completed') list = list.filter((e) => Boolean(bestScores[e.id]));
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (e) => (e.title || '').toLowerCase().includes(q) || (e.id || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [currentBookExams, activeFilter, searchQuery, bestScores]);

  const freeCount = useMemo(() => currentBookExams.filter((e) => !e.is_pro).length, [currentBookExams]);
  const proCount = useMemo(() => currentBookExams.filter((e) => Boolean(e.is_pro)).length, [currentBookExams]);
  const completedCount = useMemo(
    () => currentBookExams.filter((e) => Boolean(bestScores[e.id])).length,
    [currentBookExams, bestScores]
  );

  const activeBookMeta = BOOKS.find((b) => b.id === openBook) || null;

  const pillBase =
    'px-3 py-1.5 rounded-full text-xs font-black border-2 border-[#3D352E] whitespace-nowrap transition-all cursor-pointer';

  return (
    <div
      id="page-exercises"
      className="page active min-h-screen bg-[#FAF5EB] font-sans antialiased text-[#382E2B] lg:pl-[var(--sidebar-w,244px)] pb-[calc(7rem+env(safe-area-inset-bottom,0px))] lg:pb-12"
    >
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6">
        {!activeBookMeta ? (
          /* ========================================================================= */
          /* KỆ SÁCH LỘ TRÌNH THPT (3 CUỐN SÁCH THẬT ĐỨNG TRÊN KỆ)                      */
          /* ========================================================================= */
          <div className="space-y-6 animate-fadeIn">
            {/* Top Page Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b-2 border-[#3D352E]">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#EAF5E4] text-[#557A46] text-xs font-black border border-[#3D352E]">
                  <BookMarked className="w-3.5 h-3.5 text-[#557A46]" />
                  <span>CHƯƠNG TRÌNH TOÀN DIỆN THPT QUỐC GIA 2026 - 2027</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-heading font-black text-[#302A24] tracking-tight">
                  Lộ trình ôn thi THPT Quốc Gia
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-[#786F66]">
                  Ba cuốn sách lộ trình trên kệ — Bấm vào bìa cuốn sách bất kỳ để mở ra học nhé!
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

            {/* 3 REAL HARDCOVER BOOKS ON BOOKSHELF */}
            <section aria-label="Kệ sách lộ trình" className="pt-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7">
                {BOOKS.map((book) => {
                  const Icon = book.icon;
                  return (
                    <div
                      key={book.id}
                      onClick={() => handleOpenBook(book.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleOpenBook(book.id);
                        }
                      }}
                      className="group relative flex flex-col justify-between rounded-3xl border-[3.5px] border-[#3D352E] shadow-[6px_8px_0px_#3D352E] hover:shadow-[10px_14px_0px_#3D352E] hover:-translate-y-2.5 active:translate-y-0 transition-all duration-300 cursor-pointer overflow-hidden select-none"
                      style={{
                        background: `linear-gradient(145deg, ${book.cover}, ${book.coverDark})`,
                        minHeight: '430px',
                      }}
                    >
                      {/* Left Spine Texture Strip (Gáy sách bọc da ép kim) */}
                      <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-10 bg-black/25 border-r-2 border-black/35 flex flex-col justify-between py-6 items-center pointer-events-none z-10">
                        <div className="w-4 h-1 bg-[#F4D98A]/80 rounded-full shadow-[0_3px_0_rgba(244,217,138,0.5)]" />
                        <div className="w-1.5 h-16 bg-[#F4D98A]/30 rounded-full" />
                        <div className="w-4 h-1 bg-[#F4D98A]/80 rounded-full shadow-[0_-3px_0_rgba(244,217,138,0.5)]" />
                      </div>

                      {/* Right Paper Edge (Mép trang giấy màu kem dày dặn) */}
                      <div className="absolute right-0 top-3 bottom-3 w-2.5 bg-[#FAF5EB] border-l border-y border-[#3D352E] rounded-l-sm shadow-inner pointer-events-none z-10" />

                      {/* Bookmark Ribbon Hanging from Top */}
                      <div
                        className="absolute right-5 top-0 w-5 h-12 border-x-2 border-b-2 border-[#3D352E] shadow-sm pointer-events-none z-10 group-hover:h-14 transition-all duration-300"
                        style={{
                          backgroundColor: book.ribbonColor,
                          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)',
                        }}
                      />

                      {/* Book Front Cover Details */}
                      <div className="relative pl-11 sm:pl-14 pr-6 pt-7 pb-6 flex-1 flex flex-col justify-between text-[#FFFDF9] z-0">
                        {/* Top Book Meta */}
                        <div>
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border border-[#F4D98A]/60 bg-black/20 text-[10px] sm:text-[11px] font-black tracking-widest text-[#F4D98A] uppercase">
                            <Sparkles className="w-3 h-3 text-[#F4D98A]" />
                            <span>{book.number}</span>
                          </div>

                          {/* Emblem Icon */}
                          <div className="mt-4 w-12 h-12 rounded-2xl border-2 border-[#F4D98A]/70 bg-black/20 flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,0.3)] group-hover:scale-105 transition-transform">
                            <Icon className="w-6 h-6 text-[#F4D98A]" />
                          </div>

                          {/* Book Title */}
                          <h2 className="mt-3.5 font-heading font-black text-xl sm:text-2xl text-[#FFFDF9] leading-tight tracking-tight drop-shadow-sm">
                            {book.title}
                          </h2>

                          {/* Golden separator line */}
                          <div className="mt-2.5 h-[2px] w-14 bg-[#F4D98A]/60 rounded-full" />

                          {/* Subtitle */}
                          <p className="mt-2.5 text-xs text-[#FFFDF9]/85 font-medium leading-relaxed">
                            {book.subtitle}
                          </p>
                        </div>

                        {/* Bottom Stats & Open Action */}
                        <div className="mt-6 pt-4 border-t border-white/15 space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-heading font-black tracking-wider text-sm" style={{ color: book.accentColor }}>
                              {book.stat}
                            </span>
                            <span className="text-[11px] font-semibold text-white/70">
                              {book.statDetail}
                            </span>
                          </div>

                          {/* Open Book Button */}
                          <div className="w-full py-2.5 px-3.5 rounded-2xl bg-[#FFFDF9] text-[#302A24] font-black text-xs border-2 border-[#3D352E] shadow-[2px_3px_0px_#3D352E] group-hover:bg-[#FEF3C7] transition-colors flex items-center justify-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-[#557A46]" />
                            <span>Mở sách để học ngay</span>
                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Wooden Shelf Plank Underneath */}
              <div className="mt-4 h-6 sm:h-7 rounded-xl border-[3px] border-[#3D352E] bg-gradient-to-r from-[#8A5B2E] via-[#A8743F] to-[#8A5B2E] shadow-[0_8px_0px_#3D352E] flex items-center justify-between px-4 sm:px-8">
                <div className="w-8 h-2 rounded-full bg-[#5D3D1E]" />
                <span className="text-[9px] sm:text-[10px] font-black tracking-widest text-[#FFF3D6]/80 uppercase">
                  HIVOCAB THPT ROADMAP BOOKSHELF
                </span>
                <div className="w-8 h-2 rounded-full bg-[#5D3D1E]" />
              </div>
            </section>

            {/* Helpful mascot tip */}
            <div className="rounded-3xl bg-[#FFFDF9] border-[3px] border-[#3D352E] shadow-[4px_5px_0px_#3D352E] p-4 sm:p-5 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#FEF3C7] border-2 border-[#3D352E] flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-[#D97706]" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-[#786F66] leading-relaxed">
                <strong className="text-[#302A24]">Gợi ý lộ trình hiệu quả:</strong> Hãy bắt đầu ôn từ{' '}
                <strong className="text-[#B45309]">Quyển 2 (29 Chuyên đề)</strong> để vững chắc lý thuyết và chiến thuật làm bài, sau đó bứt phá thực chiến cùng{' '}
                <strong className="text-[#2D5A3D]">Quyển 1 (38 Đề trường sở)</strong> và{' '}
                <strong className="text-[#1E3A8A]">Quyển 3 (10 Đề dự đoán 2026)</strong> nhé!
              </p>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* NỘI DUNG CHI TIẾT BÊN TRONG QUYỂN SÁCH ĐANG MỞ                              */
          /* ========================================================================= */
          <div key={activeBookMeta.id} className="space-y-5 animate-fadeIn">
            {/* Top Navigation & Back-to-Bookshelf Toolbar */}
            <div
              className="flex items-center justify-between gap-3 rounded-3xl border-[3.5px] border-[#3D352E] shadow-[4px_5px_0px_#3D352E] px-4 sm:px-6 py-3.5 text-[#FFFDF9]"
              style={{
                background: `linear-gradient(135deg, ${activeBookMeta.cover}, ${activeBookMeta.coverDark})`,
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={handleCloseBook}
                  className="min-h-[42px] px-3.5 sm:px-4 rounded-2xl bg-[#FFFDF9] hover:bg-[#FEF3C7] text-[#302A24] border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-xs font-black flex items-center gap-1.5 shrink-0 cursor-pointer active:translate-y-0.5 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>← Kệ sách</span>
                </button>

                <div className="min-w-0">
                  <div className="text-[10px] font-black tracking-widest text-[#F4D98A] uppercase">
                    {activeBookMeta.number}
                  </div>
                  <h2 className="font-heading font-black text-base sm:text-lg leading-tight truncate">
                    {activeBookMeta.title}
                  </h2>
                </div>
              </div>

              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/25 border border-white/20 text-xs font-black">
                <Layers className="w-3.5 h-3.5" style={{ color: activeBookMeta.accentColor }} />
                <span style={{ color: activeBookMeta.accentColor }}>{activeBookMeta.stat}</span>
              </div>
            </div>

            {/* Book Body Content */}
            {openBook === 'book2' ? (
              /* QUYỂN 2: 29 CHUYÊN ĐỀ HỌC TẬP (LÝ THUYẾT + LUYỆN TẬP) */
              <RoadmapChuyenDeView />
            ) : (
              /* QUYỂN 1 (38 ĐỀ TRƯỜNG SỞ) HOẶC QUYỂN 3 (10 ĐỀ DỰ ĐOÁN) */
              <div className="space-y-5">
                {/* Search & Filter Bar */}
                <div className="rounded-3xl bg-[#FFFDF9] border-[3px] border-[#3D352E] shadow-[4px_5px_0px_#3D352E] p-4 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg sm:text-xl font-heading font-black text-[#302A24]">
                        {openBook === 'book1' ? 'Quyển 1: 38 đề THPT trường, sở' : 'Quyển 3: Bộ 10 đề dự đoán THPT 2026'}
                      </h3>
                      <p className="text-xs sm:text-sm font-semibold text-[#786F66]">
                        {openBook === 'book1'
                          ? 'Tổng hợp 38 đề thi chính thức & khảo sát chất lượng từ các trường THPT Chuyên và Sở GD&ĐT cả nước.'
                          : 'Bộ 10 đề thi phát triển theo đúng ma trận cấu trúc minh họa mới nhất của Bộ GD&ĐT (40 câu / 50 phút).'}
                      </p>
                    </div>
                    <div className="px-3 py-1 rounded-2xl bg-[#EAF5E4] text-[#557A46] font-black text-xs border border-[#3D352E] shrink-0">
                      {currentBookExams.length} Đề thi
                    </div>
                  </div>

                  {/* Search Input */}
                  <div className="relative w-full">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        openBook === 'book1'
                          ? 'Tìm đề thi theo tỉnh, trường (Hà Nội, Sư Phạm, Chuyên Lam Sơn...)'
                          : 'Tìm theo số đề (Đề 01, Đề 02...)'
                      }
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
                      className={`${pillBase} ${
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
                      className={`${pillBase} ${
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
                        className={`${pillBase} ${
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
                        className={`${pillBase} ${
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

                {/* Exam List State */}
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
                    <p className="text-xs text-[#7D716A] mt-1 font-semibold">Thử đổi từ khóa hoặc chọn tab Tất cả nhé!</p>
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
        )}
      </div>

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
