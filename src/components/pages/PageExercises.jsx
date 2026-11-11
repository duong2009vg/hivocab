// src/components/pages/PageExercises.jsx
// Lộ trình ôn thi THPT Quốc Gia - 3 Quyển sách trên kệ sách
// Quyển 1: 38 đề THPT trường, sở
// Quyển 2: Chinh phục 9+ THPT Quốc Gia (29 chuyên đề: lý thuyết + bài tập)
// Quyển 3: Bộ 10 đề dự đoán THPT
// Giao diện: kệ sách với 3 cuốn sách thật (bìa, gáy, mép giấy). Bấm vào cuốn nào mới mở nội dung bên trong.

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
} from 'lucide-react';
import RoadmapChuyenDeView from '../exercises/RoadmapChuyenDeView.jsx';

const RESUME_KEY = 'hv_roadmap_open_book';

const BOOKS = [
  {
    id: 'book1',
    number: 'QUYỂN 1',
    title: '38 đề THPT trường, sở',
    subtitle: 'Đề thi thử các trường chuyên & Sở GD&ĐT cả nước',
    stat: '38',
    statLabel: 'đề thi',
    icon: School,
    cover: '#4D6B53',
    coverDark: '#3A5240',
  },
  {
    id: 'book2',
    number: 'QUYỂN 2',
    title: 'Chinh phục 9+ THPT Quốc Gia',
    subtitle: '29 chuyên đề · Lý thuyết trọng tâm & 1.004 câu hỏi',
    stat: '29',
    statLabel: 'chuyên đề',
    icon: BookOpen,
    cover: '#B8601F',
    coverDark: '#8F4814',
  },
  {
    id: 'book3',
    number: 'QUYỂN 3',
    title: 'Bộ 10 đề dự đoán THPT',
    subtitle: '10 đề phát triển theo ma trận Bộ GD&ĐT 2026',
    stat: '10',
    statLabel: 'đề dự đoán',
    icon: Landmark,
    cover: '#2F4A6B',
    coverDark: '#223750',
  },
];

const BOOK_STYLES = `
  @keyframes rb-open-in {
    0%   { opacity: 0; transform: translateY(14px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .rb-open-in { animation: rb-open-in .45s cubic-bezier(.2,.8,.2,1) both; }

  .rb-book { }
  .rb-book-body { position: relative; transition: transform .45s cubic-bezier(.2,.8,.2,1); }
  .rb-book:hover .rb-book-body,
  .rb-book:focus-visible .rb-book-body { transform: translateY(-10px); }

  .rb-pages {
    position: absolute; inset: 6px -9px -7px 6px; border-radius: 4px 14px 14px 4px;
    border: 3px solid #3D352E;
    background: repeating-linear-gradient(90deg, #FFFDF9 0 3px, #E9DFC9 3px 4px);
  }
  .rb-cover {
    position: absolute; top: 0; right: 0; bottom: 0; left: 0; display: flex; flex-direction: column;
    transform-origin: left bottom; z-index: 2;
    transition: transform .55s cubic-bezier(.2,.8,.2,1);
    border-radius: 4px 14px 14px 4px; border: 3px solid #3D352E;
    box-shadow: 6px 8px 0 #3D352E;
    overflow: hidden;
  }
  .rb-book:hover .rb-cover,
  .rb-book:focus-visible .rb-cover { transform: rotate(-3deg); box-shadow: 9px 11px 0 rgba(61,53,46,.55); }
  .rb-spine {
    position: absolute; left: 0; top: 0; bottom: 0; width: 26px;
    background: linear-gradient(90deg, rgba(0,0,0,.28), rgba(0,0,0,.08) 70%, rgba(255,255,255,.08));
    border-right: 2px solid rgba(0,0,0,.35);
  }
  .rb-spine::before, .rb-spine::after {
    content: ''; position: absolute; left: 0; right: 0; height: 3px; background: rgba(255,235,180,.55);
  }
  .rb-spine::before { top: 22px; box-shadow: 0 6px 0 rgba(255,235,180,.35); }
  .rb-spine::after  { bottom: 22px; box-shadow: 0 -6px 0 rgba(255,235,180,.35); }
  .rb-ribbon {
    position: absolute; right: 22px; top: -3px; width: 20px; height: 54px; background: #E8B84A;
    border: 2px solid #3D352E; border-top: none;
    clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%);
  }
  .rb-shelf-plank {
    height: 22px; border: 3px solid #3D352E; border-radius: 6px;
    background: linear-gradient(#A8743F, #8A5B2E); box-shadow: 0 8px 0 #3D352E;
  }
  @media (prefers-reduced-motion: reduce) {
    .rb-open-in { animation: none; }
    .rb-book-body, .rb-cover { transition: none; }
  }
`;

function BookCover({ book, onOpen }) {
  const Icon = book.icon;
  return (
    <button
      type="button"
      onClick={() => onOpen(book.id)}
      aria-label={`Mở ${book.number}: ${book.title}`}
      className="rb-book group block w-full max-w-[250px] mx-auto text-left cursor-pointer focus:outline-none"
    >
      <div className="rb-book-body" style={{ aspectRatio: '3 / 4' }}>
        {/* Mép giấy */}
        <div className="rb-pages" />

        {/* Bìa sách */}
        <div
          className="rb-cover absolute inset-0 flex flex-col text-[#FFF6DC]"
          style={{ background: `linear-gradient(135deg, ${book.cover}, ${book.coverDark})` }}
        >
          <div className="rb-spine" />
          <div className="rb-ribbon" />

          <div className="relative flex-1 flex flex-col pl-10 pr-5 pt-8 pb-5">
            <span className="text-[10px] font-black tracking-[.2em] text-[#F4D98A]">{book.number}</span>

            <div className="mt-3 w-11 h-11 rounded-full border-2 border-[#F4D98A] flex items-center justify-center bg-black/10">
              <Icon className="w-5 h-5 text-[#F4D98A]" />
            </div>

            <h3 className="mt-3 font-heading font-black text-[19px] leading-tight text-[#FFF6DC]">
              {book.title}
            </h3>

            <div className="mt-3 h-[2px] w-12 bg-[#F4D98A]/70" />
            <p className="mt-2 text-[11px] font-semibold leading-relaxed text-[#FFF6DC]/85 line-clamp-3">
              {book.subtitle}
            </p>

            <div className="mt-auto flex items-end gap-1.5">
              <span className="font-heading font-black text-3xl leading-none text-[#F4D98A]">{book.stat}</span>
              <span className="text-[11px] font-black uppercase tracking-wide text-[#FFF6DC]/80 pb-0.5">
                {book.statLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

export function PageExercises() {
  const { navigateTo } = useRoute();
  const { allExams, loading, error, bestScores } = useThptExams();

  // Quyển đang mở: null = đang ở kệ sách
  const [openBook, setOpenBook] = useState(() => {
    try {
      const saved = sessionStorage.getItem(RESUME_KEY);
      return BOOKS.some((b) => b.id === saved) ? saved : null;
    } catch (_) {
      return null;
    }
  });

  // Chỉ khôi phục quyển đang mở khi quay về từ phòng thi
  useEffect(() => {
    try { sessionStorage.removeItem(RESUME_KEY); } catch (_) { /* ignore */ }
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [customTimeModal, setCustomTimeModal] = useState(null);

  const handleOpenBook = useCallback((id) => {
    setOpenBook(id);
    setSearchQuery('');
    setActiveFilter('all');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  }, []);

  const handleCloseBook = useCallback(() => {
    setOpenBook(null);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  }, []);

  const handleStart = useCallback((examId, minutes) => {
    try { sessionStorage.setItem(RESUME_KEY, openBook || ''); } catch (_) { /* ignore */ }
    window._thptStartConfig = { examId, minutes };
    navigateTo('thpt-room', true);
  }, [navigateTo, openBook]);

  const handleOpenCustomTime = useCallback((examId, examTitle) => {
    setCustomTimeModal({ examId, examTitle });
  }, []);

  const handleCustomTimeStart = useCallback((examId, minutes) => {
    setCustomTimeModal(null);
    handleStart(examId, minutes);
  }, [handleStart]);

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
      className="page active min-h-screen bg-[#FAF5EB] font-sans antialiased text-[#382E2B] lg:pl-[var(--sidebar-w,244px)] pb-[calc(7rem+env(safe-area-inset-bottom,0px))] lg:pb-10"
    >
      <style>{BOOK_STYLES}</style>

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6">
        {!activeBookMeta ? (
          /* ======================== KỆ SÁCH ======================== */
          <div className="rb-open-in space-y-8">
            <div className="space-y-1.5 pb-3 border-b-2 border-[#3D352E]">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#EAF5E4] text-[#557A46] text-xs font-black border border-[#3D352E]">
                <BookMarked className="w-3.5 h-3.5" />
                <span>LỘ TRÌNH THPT 2026 - 2027</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-heading font-black text-[#302A24] tracking-tight">
                Lộ trình ôn thi THPT Quốc Gia
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-[#786F66]">
                Ba quyển sách trên kệ — chọn một quyển và bấm vào bìa để mở ra học.
              </p>
            </div>

            <section aria-label="Kệ sách lộ trình" className="pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-12 px-2 sm:px-6">
                {BOOKS.map((book) => (
                  <BookCover key={book.id} book={book} onOpen={handleOpenBook} />
                ))}
              </div>
              <div className="rb-shelf-plank mt-6 hidden sm:block" />
            </section>

            <p className="text-center text-xs font-bold text-[#9C8F85]">
              Gợi ý: bắt đầu từ Quyển 2 để nắm chắc lý thuyết, rồi thực chiến với Quyển 1 và Quyển 3.
            </p>
          </div>
        ) : (
          /* ======================== NỘI DUNG BÊN TRONG QUYỂN ======================== */
          <div key={activeBookMeta.id} className="rb-open-in space-y-5">
            <div
              className="flex items-center gap-3 rounded-2xl border-[3px] border-[#3D352E] shadow-[3px_4px_0px_#3D352E] px-3 sm:px-4 py-2.5 text-[#FFF6DC]"
              style={{ background: `linear-gradient(135deg, ${activeBookMeta.cover}, ${activeBookMeta.coverDark})` }}
            >
              <button
                type="button"
                onClick={handleCloseBook}
                className="min-h-[40px] px-3 rounded-xl bg-[#FFFDF9] text-[#302A24] border-2 border-[#3D352E] text-xs font-black flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-[0.98]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kệ sách</span>
              </button>
              <div className="min-w-0">
                <div className="text-[10px] font-black tracking-[.2em] text-[#F4D98A]">{activeBookMeta.number}</div>
                <div className="font-heading font-black text-sm sm:text-base leading-tight truncate">
                  {activeBookMeta.title}
                </div>
              </div>
            </div>

            {openBook === 'book2' ? (
              <RoadmapChuyenDeView />
            ) : (
              <div className="space-y-5">
                <div className="rounded-3xl bg-[#FFFDF9] border-[3px] border-[#3D352E] shadow-[4px_5px_0px_#3D352E] p-4 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg sm:text-xl font-heading font-black text-[#302A24]">
                        {openBook === 'book1' ? 'Quyển 1: 38 đề THPT trường, sở' : 'Quyển 3: Bộ 10 đề dự đoán THPT 2026'}
                      </h2>
                      <p className="text-xs sm:text-sm font-semibold text-[#786F66]">
                        {openBook === 'book1'
                          ? 'Tổng hợp 38 đề thi chính thức & khảo sát chất lượng từ các trường THPT Chuyên và Sở GD&ĐT.'
                          : 'Bộ 10 đề thi phát triển theo đúng ma trận cấu trúc minh họa mới nhất của Bộ Giáo dục và Đào tạo (40 câu / 50 phút).'}
                      </p>
                    </div>
                    <div className="px-3 py-1 rounded-2xl bg-[#EAF5E4] text-[#557A46] font-black text-xs border border-[#3D352E] shrink-0">
                      {currentBookExams.length} Đề thi
                    </div>
                  </div>

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

                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveFilter('all')}
                      className={`${pillBase} ${activeFilter === 'all' ? 'bg-[#3D352E] text-white shadow-[2px_2px_0px_#3D352E]' : 'bg-white text-[#302A24] hover:bg-[#FAF5EB]'}`}
                    >
                      Tất cả ({currentBookExams.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFilter('free')}
                      className={`${pillBase} ${activeFilter === 'free' ? 'bg-[#557A46] text-white shadow-[2px_2px_0px_#3D352E]' : 'bg-[#EAF5E4] text-[#4F7D4B] hover:bg-[#dcead4]'}`}
                    >
                      Miễn phí ({freeCount})
                    </button>
                    {proCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveFilter('pro')}
                        className={`${pillBase} ${activeFilter === 'pro' ? 'bg-[#B87C24] text-white shadow-[2px_2px_0px_#3D352E]' : 'bg-[#FFF6E6] text-[#B87C24] hover:bg-[#fceece]'}`}
                      >
                        Gói PRO ({proCount})
                      </button>
                    )}
                    {completedCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveFilter('completed')}
                        className={`${pillBase} ${activeFilter === 'completed' ? 'bg-[#557A46] text-white shadow-[2px_2px_0px_#3D352E]' : 'bg-white text-[#302A24]'}`}
                      >
                        Đã hoàn thành ({completedCount})
                      </button>
                    )}
                  </div>
                </div>

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
