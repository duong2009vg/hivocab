// src/components/bilingual/BilingualHubView.jsx
// Thư viện Đọc Song Ngữ 2 Tầng - Thiết kế Kệ Sách Cổ Kính & Bìa Sách Bìa Cứng (Cozy Crayon)
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Search,
  BookOpen,
  PenTool,
  Lock,
  Sparkles,
  FileText,
  Play,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Layers,
  Newspaper,
} from 'lucide-react';
import { getVolBookMeta } from '../../data/bilingualVolMeta.js';

function ScrollablePillStrip({ children, className = '', fadeBgColor = '#FAF5EB', ariaLabel = '' }) {
  const scrollRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const checkOverflow = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hasOverflow = el.scrollWidth > el.clientWidth + 4;
    if (!hasOverflow) {
      setCanLeft(false);
      setCanRight(false);
      return;
    }
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkOverflow();
    const el = scrollRef.current;
    if (!el) return;
    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(checkOverflow);
      ro.observe(el);
    }
    window.addEventListener('resize', checkOverflow);
    const t = setTimeout(checkOverflow, 150);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', checkOverflow);
      clearTimeout(t);
    };
  }, [checkOverflow, children]);

  const scrollByStep = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 240, behavior: 'smooth' });
  };

  return (
    <div className="relative group/strip">
      {canLeft && (
        <>
          <div
            className="hidden sm:block pointer-events-none absolute left-0 top-0 bottom-0 w-10 z-10"
            style={{ background: `linear-gradient(to right, ${fadeBgColor}, transparent)` }}
          />
          <button
            type="button"
            onClick={() => scrollByStep(-1)}
            aria-label="Lướt sang trái"
            className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-white hover:bg-[#F4E3B4] text-[#302A24] border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] active:translate-y-0.5 transition-all absolute left-1 top-1/2 -translate-y-1/2 z-20 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </>
      )}

      <div
        ref={scrollRef}
        onScroll={checkOverflow}
        role="region"
        aria-label={ariaLabel}
        className={`flex items-center overflow-x-auto no-scrollbar ${className}`}
      >
        {children}
      </div>

      {canRight && (
        <>
          <div
            className="hidden sm:block pointer-events-none absolute right-0 top-0 bottom-0 w-10 z-10"
            style={{ background: `linear-gradient(to left, ${fadeBgColor}, transparent)` }}
          />
          <button
            type="button"
            onClick={() => scrollByStep(1)}
            aria-label="Lướt sang phải"
            className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-white hover:bg-[#F4E3B4] text-[#302A24] border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] active:translate-y-0.5 transition-all absolute right-1 top-1/2 -translate-y-1/2 z-20 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}

const PASSAGE_CARD_THEMES = [
  {
    badgeBg: 'bg-[#FFF5E6]',
    progBg: 'bg-[#E0F2E9] text-emerald-800 border-emerald-400',
    barColor: 'bg-[#4D6B53]',
  },
  {
    badgeBg: 'bg-[#EBF4FA]',
    progBg: 'bg-[#FEF3C7] text-amber-800 border-amber-300',
    barColor: 'bg-amber-500',
  },
  {
    badgeBg: 'bg-[#FFF0ED]',
    progBg: 'bg-[#F3EEEA] text-[#786F66] border-gray-300',
    barColor: 'bg-gray-300',
  },
];

function getPassagePreview(contentEn) {
  if (!contentEn || typeof contentEn !== 'string') return '';
  const cleaned = contentEn
    .replace(/\r?\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';
  return cleaned.length > 160 ? `${cleaned.slice(0, 160).trim()}...` : cleaned;
}

// Kệ sách gỗ cổ điển cho từng tầng
function WoodenShelfTier({
  plaqueLabel,
  badgeText,
  rightAction,
  booksLoading,
  children,
}) {
  const shelfScrollRef = useRef(null);

  const handleScrollShelf = (dir) => {
    if (!shelfScrollRef.current) return;
    shelfScrollRef.current.scrollBy({ left: dir * 340, behavior: 'smooth' });
  };

  return (
    <section className="rounded-2xl overflow-hidden border-[3px] border-[#3D352E] shadow-[5px_6px_0px_#3D352E] bg-[#382010]">
      {/* 1. Wooden Top Beam + Brass Plaque */}
      <div className="antique-folder-beam px-3.5 sm:px-6 py-2.5 border-b-[3px] border-[#3D352E] flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="brass-plaque px-3 sm:px-3.5 py-1.5 rounded-lg border-2 border-[#3D352E] flex items-center gap-2 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3D352E] shrink-0" />
            <span className="font-display font-extrabold text-xs sm:text-sm text-[#302A24] tracking-wide truncate">
              {plaqueLabel}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#3D352E] shrink-0" />
          </div>
          {badgeText && (
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-lg bg-[#241308]/75 border border-[#E6C98A]/40 text-[11px] font-black text-[#FEF3C7] shrink-0">
              {badgeText}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleScrollShelf(-1)}
              title="Kéo kệ sang trái"
              aria-label="Kéo kệ sang trái"
              className="w-8 h-8 rounded-lg bg-[#FAF5EB] hover:bg-[#FEF3C7] text-[#302A24] border-2 border-[#3D352E] cursor-pointer flex items-center justify-center active:scale-[0.96]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleScrollShelf(1)}
              title="Kéo kệ sang phải"
              aria-label="Kéo kệ sang phải"
              className="w-8 h-8 rounded-lg bg-[#FAF5EB] hover:bg-[#FEF3C7] text-[#302A24] border-2 border-[#3D352E] cursor-pointer flex items-center justify-center active:scale-[0.96]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {rightAction}
        </div>
      </div>

      {/* 2. Recessed Wooden Cavity with Books */}
      <div className="flex items-stretch">
        <div className="w-3 sm:w-5 antique-pilaster antique-pilaster-flute border-r-[3px] border-[#3D352E] shrink-0" />

        <div
          ref={shelfScrollRef}
          className="flex-1 min-w-0 antique-recess-cavity px-3.5 sm:px-6 pb-4 relative overflow-x-auto shelf-scrollbar"
        >
          {/* Top cabinet brass accent */}
          <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2">
            <div className="w-16 h-1.5 bg-[#D4AF37]/80 border-x border-b border-[#3D352E] rounded-b-full shadow-[0_4px_14px_rgba(244,180,26,0.65)]" />
          </div>

          {booksLoading ? (
            <div className="flex items-end gap-3.5 min-h-[214px]">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-[152px] sm:w-[164px] h-[206px] rounded-r-xl rounded-l-sm bg-white/10 border-2 border-[#E6C98A]/30 animate-pulse shrink-0"
                />
              ))}
            </div>
          ) : (
            <div className="flex items-end gap-3.5 sm:gap-4 min-w-max min-h-[214px] relative z-10 pt-1">
              {/* Left Wooden Bookend */}
              <div className="hidden sm:flex flex-col items-center justify-end select-none shrink-0">
                <div className="w-5 h-12 rounded-t-lg bg-[#5B371E] border-2 border-[#3D352E] shadow-md" />
                <div className="w-7 h-2 bg-[#D4AF37] border border-[#3D352E]" />
              </div>

              {children}
            </div>
          )}
        </div>

        <div className="w-3 sm:w-5 antique-pilaster antique-pilaster-flute border-l-[3px] border-[#3D352E] shrink-0" />
      </div>

      {/* 3. Wooden Shelf Plank Base */}
      <div>
        <div className="h-2.5 w-full antique-shelf-top-plane border-t-2 border-[#241308]" />
        <div className="antique-shelf-front-plank h-5 border-t border-[#3D352E]" />
      </div>
    </section>
  );
}

// Bìa sách cứng chuẩn phong cách Lộ trình & Chủ đề HiVocab
function HardcoverBookTile({
  code,
  topRightBadge,
  titlePrimary,
  titleSecondary,
  subtitle,
  footerLeft,
  cover,
  coverDark,
  accentColor,
  isProLocked = false,
  largeTitle = false,
  onClick,
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="book-cover-item group relative w-[154px] sm:w-[168px] min-h-[208px] rounded-r-xl rounded-l-sm border-[2.5px] border-[#3D352E] shadow-[4px_4px_0px_#1A0E06] hover:shadow-[6px_6px_0px_#1A0E06] cursor-pointer flex flex-col justify-between p-2.5 sm:p-3 text-[#FAF5EB] select-none shrink-0"
      style={{
        background: `linear-gradient(155deg, ${cover}, ${coverDark})`,
      }}
    >
      {/* Left Spine Crease */}
      <div className="absolute left-0 top-0 bottom-0 w-2.5 border-r border-[#3D352E]/60 bg-black/20 pointer-events-none" />

      {/* Top Meta Foil */}
      <div className="pl-2 flex items-center justify-between gap-1 text-[9px] font-bold tracking-wider uppercase text-[#E6C98A]">
        <span className="truncate">{code}</span>
        {isProLocked ? (
          <span className="px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#302A24] border border-[#3D352E] text-[8px] font-black shrink-0 leading-none">
            PRO
          </span>
        ) : (
          topRightBadge && (
            <span
              className="px-1.5 py-0.5 rounded bg-black/25 border border-[#E6C98A]/35 text-[8px] font-black shrink-0 leading-none"
              style={{ color: accentColor }}
            >
              {topRightBadge}
            </span>
          )
        )}
      </div>

      {/* Center Framed Title & Vietnamese Translation */}
      <div className="pl-2 my-auto py-2.5 border-y border-[#E6C98A]/35 space-y-1.5">
        {titleSecondary && (
          <div className="text-[10px] font-extrabold tracking-wide text-[#F4D98A] uppercase truncate">
            {titleSecondary}
          </div>
        )}
        <h3
          className={`font-heading text-[#FAF5EB] ${
            largeTitle
              ? 'font-black text-base sm:text-[18px] leading-tight tracking-tight'
              : 'font-bold text-xs sm:text-[13px] leading-snug line-clamp-2'
          }`}
        >
          {titlePrimary}
        </h3>
        {subtitle && (
          <p className="text-[10px] text-[#FAF5EB]/80 font-medium leading-snug line-clamp-2">
            {subtitle}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="pl-2 flex items-center justify-between gap-1 text-[9.5px] text-[#E6C98A]/95 font-semibold">
        <span className="truncate">{footerLeft}</span>
        <span className="inline-flex items-center gap-0.5 font-black text-[#FEF3C7] shrink-0">
          <span>Mở</span>
          <ChevronRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </div>
  );
}

export function BilingualHubView({
  activeShelf = 'home',
  onOpenVolBook,
  onOpenNewsShelf,
  onBackToShelves,
  books,
  booksLoading,
  selectedBook,
  selectedBookMeta,
  hierarchyLoading,
  hierarchyError,
  isUserPro,
  tests,
  filteredTests,
  selectedTestId,
  onSelectTest,
  searchQuery,
  onSearchChange,
  filterMode,
  onFilterModeChange,
  bookStats,
  lastReading,
  onResumeLastReading,
  onOpenPassage,
  onOpenProModal,
  // Tier 2 News
  newsCategories = [],
  newsArticles = [],
  newsLoading = false,
  selectedNewsCategory = 'all',
  onSelectNewsCategory,
  newsSearchQuery = '',
  onNewsSearchChange,
  filteredNewsArticles = [],
  newsCategoryCounts = {},
  onOpenNewsArticle,
}) {
  const activeNewsCategoryMeta =
    newsCategories.find((c) => c.id === selectedNewsCategory) ||
    newsCategories[0] || {
      id: 'all',
      name: 'Tuyển Tập Bài Báo Song Ngữ',
      subtitle: 'Tổng hợp trọn bộ báo song ngữ Anh–Việt',
      cover: '#3A5A40',
      coverDark: '#233A28',
      accentColor: '#F6E2A5',
    };

  return (
    <div
      id="page-bilingual-reading"
      className="page active min-h-screen bg-[#FAF5EB] font-sans antialiased text-[#382E2B] lg:pl-[var(--sidebar-w,244px)] pb-[calc(7rem+env(safe-area-inset-bottom,0px))] lg:pb-12"
    >
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6">
        {activeShelf === 'home' ? (
          /* ========================================================================= */
          /* MÀN HÌNH CHÍNH: KỆ SÁCH ĐỌC SONG NGỮ 2 TẦNG                               */
          /* ========================================================================= */
          <div className="space-y-6 animate-fadeIn">
            {/* Compact Top Stats Strip (same style as PageExercises) */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b-2 border-[#3D352E]">
              <div className="inline-flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E]">
                <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-[#FEF3C7] text-[#302A24]">
                  Tầng 1: {books.length || 10} Tập Vol IELTS
                </span>
                <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-[#EAF5E4] text-[#4D6B53]">
                  Tầng 2: {newsArticles.length || 112} Bài Báo Song Ngữ
                </span>
              </div>
            </div>

            {/* Recently Read Resume Card */}
            {lastReading?.passageId && (
              <section className="bg-[#FFFDF9] rounded-3xl p-4 sm:p-5 border-2 border-[#3D352E] shadow-[3px_4px_0px_#3D352E] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-[#D96B43]">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>Vừa đọc gần đây</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF3E7] border border-[#3D352E]/30 text-[#5C5248]">
                      {lastReading.isNewsArticle
                        ? lastReading.topicName || 'Báo Song Ngữ'
                        : getVolBookMeta(lastReading.topicName).titleVi}
                    </span>
                  </div>
                  <h2 className="font-['Playfair_Display',serif] font-bold text-base sm:text-lg text-[#302A24] truncate">
                    {lastReading.titleVi || lastReading.title}
                  </h2>
                  {lastReading.titleVi && (
                    <p className="text-xs font-bold text-[#5C5248] truncate">{lastReading.title}</p>
                  )}
                  <p className="text-xs font-semibold text-[#786F66] truncate">
                    {lastReading.isNewsArticle
                      ? `${lastReading.testName || 'Báo Song Ngữ'} · Bài số ${lastReading.passageNumber || ''}`
                      : `${lastReading.testName || 'Test'} · Passage ${lastReading.passageNumber || ''}`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onResumeLastReading}
                  className="w-full sm:w-auto shrink-0 py-2.5 px-5 rounded-xl bg-[#4D6B53] hover:bg-[#3F5944] text-white font-['Comfortaa',sans-serif] font-bold text-xs border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                  <span>Đọc tiếp bài này</span>
                </button>
              </section>
            )}

            {/* TẦNG 1: BỘ ĐỀ READING IELTS VOL 1 - VOL 10 */}
            <WoodenShelfTier
              plaqueLabel="Tầng 1 · Bộ Sách Đề Reading IELTS (Vol 1 – Vol 10)"
              badgeText={`${books.length || 10} tập sách`}
              booksLoading={booksLoading && books.length === 0}
            >
              {books.map((book, idx) => {
                const meta = getVolBookMeta(book, idx);
                const isLocked = Boolean(book.is_pro) && !isUserPro;
                return (
                  <HardcoverBookTile
                    key={book.id}
                    code={meta.code}
                    topRightBadge={meta.testsCount ? `${meta.testsCount} ĐỀ` : null}
                    titlePrimary={meta.titleEn}
                    subtitle={meta.subtitleVi}
                    footerLeft={meta.passagesCount ? `${meta.passagesCount} bài đọc` : 'Mở tập sách'}
                    cover={meta.cover}
                    coverDark={meta.coverDark}
                    accentColor={meta.accentColor}
                    isProLocked={isLocked}
                    largeTitle
                    onClick={() => onOpenVolBook(book.id)}
                  />
                );
              })}
            </WoodenShelfTier>

            {/* TẦNG 2: BÀI BÁO SONG NGỮ (NGUỒN CEP / PTE HELPER) */}
            <WoodenShelfTier
              plaqueLabel="Tầng 2 · Tuyển Tập Bài Báo Song Ngữ Anh–Việt"
              badgeText={`${newsArticles.length || 112} bài báo`}
              booksLoading={newsLoading && newsArticles.length === 0}
              rightAction={
                <button
                  type="button"
                  onClick={() => onOpenNewsShelf('all')}
                  className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#382010]/85 hover:bg-[#241308] text-[#FAF5EB] border border-[#D4AF37]/50 text-[11px] sm:text-xs font-bold cursor-pointer flex items-center gap-1 transition-all shrink-0 active:scale-[0.98]"
                >
                  <span>Mở tất cả bài báo</span>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              }
            >
              {newsCategories.map((cat) => {
                const count = newsCategoryCounts[cat.id] || 0;
                return (
                  <HardcoverBookTile
                    key={cat.id}
                    code={cat.id === 'all' ? 'TRỌN BỘ' : 'CHỦ ĐỀ'}
                    topRightBadge={`${count} BÀI`}
                    titleSecondary={cat.id === 'all' ? 'Báo Song Ngữ' : 'Chuyên mục'}
                    titlePrimary={cat.name}
                    subtitle={cat.subtitle}
                    footerLeft="Miễn phí"
                    cover={cat.cover}
                    coverDark={cat.coverDark}
                    accentColor={cat.accentColor}
                    onClick={() => onOpenNewsShelf(cat.id)}
                  />
                );
              })}
            </WoodenShelfTier>
          </div>
        ) : activeShelf === 'vol' ? (
          /* ========================================================================= */
          /* CHI TIẾT TẬP VOL ĐANG MỞ: DANH SÁCH TEST VÀ PASSAGES                     */
          /* ========================================================================= */
          <div className="space-y-5 animate-fadeIn">
            {/* Hardcover Banner Toolbar (same aesthetic as PageExercises book open view) */}
            <div
              className="flex items-center justify-between gap-3 rounded-3xl border-[3px] border-[#3D352E] shadow-[4px_5px_0px_#3D352E] px-4 sm:px-6 py-3.5 text-[#FFFDF9]"
              style={{
                background: `linear-gradient(135deg, ${selectedBookMeta?.cover || '#4D6B53'}, ${selectedBookMeta?.coverDark || '#2E4232'})`,
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={onBackToShelves}
                  className="min-h-[42px] px-3.5 sm:px-4 rounded-2xl bg-[#FFFDF9] hover:bg-[#FEF3C7] text-[#302A24] border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-xs font-black flex items-center gap-1.5 shrink-0 cursor-pointer active:translate-y-0.5 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kệ sách</span>
                </button>

                <div className="min-w-0">
                  <div className="text-[10px] font-black tracking-widest text-[#F4D98A] uppercase truncate">
                    {selectedBookMeta?.code || 'IELTS'} · {selectedBook?.name}
                  </div>
                  <h2 className="font-heading font-black text-base sm:text-lg leading-tight truncate">
                    {selectedBookMeta?.titleVi || selectedBook?.name}
                  </h2>
                  {selectedBookMeta?.subtitleVi && (
                    <p className="text-[11px] font-semibold text-white/80 truncate hidden sm:block">
                      {selectedBookMeta.subtitleVi}
                    </p>
                  )}
                </div>
              </div>

              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/25 border border-white/20 text-xs font-black shrink-0">
                <Layers className="w-3.5 h-3.5" style={{ color: selectedBookMeta?.accentColor || '#FEF3C7' }} />
                <span style={{ color: selectedBookMeta?.accentColor || '#FEF3C7' }}>
                  {bookStats.totalPassages || selectedBookMeta?.passagesCount || 30} bài đọc
                </span>
              </div>
            </div>

            {/* Search + Filter Bar + Test Pills */}
            <section className="bg-[#FFFDF9] rounded-3xl p-4 border-2 border-[#3D352E] shadow-[3px_3px_0px_#3D352E] space-y-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#786F66] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Tìm bài đọc theo tên tiếng Anh, tiếng Việt hoặc Test..."
                    className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-[#FAF5EB] border-2 border-[#3D352E]/60 focus:border-[#3D352E] focus:outline-none text-xs sm:text-sm font-bold text-[#302A24] placeholder:text-[#8E8377]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => onSearchChange('')}
                      aria-label="Xóa tìm kiếm"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-[#3D352E]/40 flex items-center justify-center text-[#5C5248] hover:bg-[#EFE8D6] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'all', label: 'Tất cả' },
                    { id: 'free', label: 'Miễn phí' },
                    { id: 'with-vocab', label: 'Có bộ từ vựng' },
                  ].map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => onFilterModeChange(chip.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-black border-2 transition-all cursor-pointer ${
                        filterMode === chip.id
                          ? 'bg-[#382E2B] text-white border-[#382E2B]'
                          : 'bg-[#FAF5EB] text-[#6E6359] border-[#3D352E]/30 hover:border-[#3D352E] hover:text-[#302A24]'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {tests.length > 1 && (
                <ScrollablePillStrip
                  className="gap-1.5 pt-1 pb-0.5"
                  fadeBgColor="#FFFDF9"
                  ariaLabel="Danh sách Test trong bộ sách"
                >
                  <button
                    type="button"
                    onClick={() => onSelectTest('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap shrink-0 border transition-all cursor-pointer ${
                      selectedTestId === 'all'
                        ? 'bg-[#F4E3B4] text-[#302A24] border-[#3D352E] shadow-[1.5px_1.5px_0px_#3D352E]'
                        : 'bg-white text-[#6E6359] border-[#E2D8C5] hover:border-[#3D352E]'
                    }`}
                  >
                    Tất cả Test ({tests.length})
                  </button>
                  {tests.map((test) => (
                    <button
                      key={test.id}
                      type="button"
                      onClick={() => onSelectTest(test.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap shrink-0 border transition-all cursor-pointer ${
                        selectedTestId === test.id
                          ? 'bg-[#F4E3B4] text-[#302A24] border-[#3D352E] shadow-[1.5px_1.5px_0px_#3D352E]'
                          : 'bg-white text-[#6E6359] border-[#E2D8C5] hover:border-[#3D352E]'
                      }`}
                    >
                      {test.name}
                    </button>
                  ))}
                </ScrollablePillStrip>
              )}
            </section>

            {/* Tests & Passages Grid */}
            {hierarchyLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <div
                    key={idx}
                    className="h-52 rounded-3xl bg-[#FFFDF9] border-2 border-[#3D352E]/20 p-5 animate-pulse space-y-3"
                  >
                    <div className="h-4 w-28 bg-[#EFE7D6] rounded-full" />
                    <div className="h-5 w-4/5 bg-[#EFE7D6] rounded-xl" />
                    <div className="h-12 w-full bg-[#FAF5EB] rounded-xl" />
                    <div className="h-9 w-full bg-[#EFE7D6] rounded-xl mt-4" />
                  </div>
                ))}
              </div>
            ) : hierarchyError ? (
              <div className="bg-[#FFFDF9] rounded-3xl p-8 border-2 border-[#3D352E] shadow-[3px_4px_0px_#3D352E] text-center max-w-md mx-auto space-y-3">
                <AlertTriangle className="w-10 h-10 text-[#C85A3F] mx-auto" />
                <h3 className="font-heading font-black text-lg text-[#302A24]">Chưa tải được danh sách bài đọc</h3>
                <p className="text-xs font-semibold text-[#786F66]">{hierarchyError}</p>
              </div>
            ) : filteredTests.length === 0 ? (
              <div className="bg-[#FFFDF9] rounded-3xl p-10 border-2 border-[#3D352E] shadow-[3px_4px_0px_#3D352E] text-center space-y-2">
                <BookOpen className="w-10 h-10 text-[#9B8E80] mx-auto" />
                <h3 className="font-heading font-black text-base text-[#302A24]">
                  Không tìm thấy bài đọc phù hợp
                </h3>
                <p className="text-xs font-semibold text-[#786F66]">
                  Thử đổi từ khóa tìm kiếm hoặc chọn tập sách khác nhé.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredTests.map((test) => (
                  <section key={test.id} className="space-y-3">
                    <div className="flex items-center justify-between gap-2 px-1">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-xl bg-[#EFE8D6] border border-[#3D352E] text-xs font-black text-[#302A24]">
                          {test.name}
                        </span>
                        <span className="text-xs font-bold text-[#786F66]">
                          {test.passages.length} bài đọc
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {test.passages.map((passage, pIdx) => {
                        const pNum = passage.passageNumber || pIdx + 1;
                        const pTitle = passage.title || `Passage ${pNum}`;
                        const pTitleVi = passage.titleVi || '';
                        const isLocked =
                          Boolean(passage.isPro || test.isPro || selectedBook?.is_pro) &&
                          !isUserPro &&
                          !passage.contentEn;
                        const preview = getPassagePreview(passage.contentEn);
                        const totalWords = passage.totalWords || passage.wordsCount || 0;
                        const progress = passage.progress || 0;
                        const learnedWords =
                          typeof passage.learnedWords === 'number'
                            ? passage.learnedWords
                            : Math.round((progress * totalWords) / 100);
                        const colorTheme = PASSAGE_CARD_THEMES[pIdx % PASSAGE_CARD_THEMES.length];

                        return (
                          <article
                            key={passage.id || pIdx}
                            className="p-5 flex flex-col justify-between hover:-translate-y-1 transition-all duration-200 group bg-white border-2 border-[#3D352E] rounded-[20px] shadow-[3px_4px_0px_#3D352E]"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className={`px-3 py-1 text-xs font-['Comfortaa',sans-serif] font-bold text-[#302A24] ${colorTheme.badgeBg} rounded-xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center gap-1.5`}
                                  >
                                    <FileText className="w-3.5 h-3.5 text-[#302A24] shrink-0" />
                                    <span>Passage {pNum}</span>
                                  </span>
                                  {isLocked && (
                                    <span className="px-2.5 py-0.5 text-xs font-black bg-[#FFE8C2] text-[#8C5311] border-2 border-[#3D352E] rounded-full shadow-[1.5px_1.5px_0px_#3D352E] flex items-center gap-1">
                                      <Lock className="w-3 h-3 text-[#8C5311] shrink-0" />
                                      <span>Gói PRO</span>
                                    </span>
                                  )}
                                </div>
                                <span
                                  className={`px-2.5 py-0.5 text-xs font-bold rounded-full border shrink-0 ${colorTheme.progBg}`}
                                >
                                  {progress}% hoàn thành
                                </span>
                              </div>

                              <h5
                                onClick={() =>
                                  isLocked
                                    ? onOpenProModal(passage)
                                    : onOpenPassage(passage, test, 'reading')
                                }
                                className="font-['Playfair_Display',serif] font-bold text-lg sm:text-xl text-[#302A24] tracking-tight leading-snug group-hover:text-[#C85A3F] transition-colors cursor-pointer uppercase"
                              >
                                {pTitle}
                              </h5>
                              {pTitleVi && (
                                <p className="text-xs sm:text-[13px] font-bold text-[#4D6B53] mt-1 leading-snug line-clamp-2">
                                  {pTitleVi}
                                </p>
                              )}

                              <div className="mt-3 w-full h-2 bg-[#EFE8DD] rounded-full border border-[#3D352E] overflow-hidden">
                                <div
                                  className={`h-full ${colorTheme.barColor} rounded-full transition-all duration-300`}
                                  style={{ width: `${Math.min(100, progress)}%` }}
                                />
                              </div>

                              <div className="mt-4 p-3.5 bg-[#FAF7F0] rounded-xl border border-dashed border-[#C4B9AA] text-xs text-[#302A24]/90 leading-relaxed font-['Playfair_Display',serif] italic relative">
                                <span className="text-lg font-['Playfair_Display',serif] text-[#C85A3F] font-bold absolute -top-1 left-2">
                                  “
                                </span>
                                <p className="pl-3.5 line-clamp-3">
                                  {isLocked
                                    ? 'Nội dung bài đọc học thuật IELTS này thuộc gói PRO. Vui lòng mở khóa để đọc toàn bộ bài đọc song ngữ và luyện tập từ vựng ngữ cảnh.'
                                    : preview ||
                                      'Đọc song ngữ Anh–Việt đối chiếu theo từng đoạn văn và chạm từ vựng để tra nghĩa trực tiếp trong ngữ cảnh.'}
                                </p>
                              </div>

                              <div className="mt-4 flex items-center justify-between text-xs py-2 border-y border-[#EBE4D8]">
                                <div className="flex items-center gap-1.5">
                                  <BookOpen className="w-4 h-4 text-[#3D352E] shrink-0" />
                                  <span className="font-bold text-[#3D352E]">
                                    {totalWords} từ vựng
                                  </span>
                                </div>
                                <div className="text-[11px] text-[#786F66]">
                                  Đã thuộc:{' '}
                                  <span className="font-bold text-[#4D6B53]">
                                    {learnedWords}/{totalWords}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-5">
                              {isLocked ? (
                                <button
                                  type="button"
                                  onClick={() => onOpenProModal(passage)}
                                  className="w-full py-2.5 px-4 text-xs font-['Comfortaa',sans-serif] font-bold text-white bg-[#D96C4D] hover:bg-[#C85A3F] rounded-xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                                >
                                  <Lock className="w-4 h-4 shrink-0" />
                                  <span>Mở khóa PRO</span>
                                </button>
                              ) : (
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => onOpenPassage(passage, test, 'reading')}
                                    className="py-2.5 px-3 text-xs font-['Comfortaa',sans-serif] font-bold text-white bg-[#4D6B53] hover:bg-[#3D5642] rounded-xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                                  >
                                    <BookOpen className="w-4 h-4 shrink-0" />
                                    <span>Đọc song ngữ</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onOpenPassage(passage, test, 'gap-fill')}
                                    className="py-2.5 px-3 text-xs font-['Comfortaa',sans-serif] font-bold text-[#302A24] bg-[#FAF7F0] hover:bg-[#EFE8DD] rounded-xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                                  >
                                    <PenTool className="w-4 h-4 text-[#C85A3F] shrink-0" />
                                    <span>Đục lỗ</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ========================================================================= */
          /* TẦNG 2 CHI TIẾT: TUYỂN TẬP BÀI BÁO SONG NGỮ (GIAO DIỆN HIVOCAB)          */
          /* ========================================================================= */
          <div className="space-y-5 animate-fadeIn">
            <div
              className="flex items-center justify-between gap-3 rounded-3xl border-[3px] border-[#3D352E] shadow-[4px_5px_0px_#3D352E] px-4 sm:px-6 py-3.5 text-[#FFFDF9]"
              style={{
                background: `linear-gradient(135deg, ${activeNewsCategoryMeta.cover}, ${activeNewsCategoryMeta.coverDark})`,
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={onBackToShelves}
                  className="min-h-[42px] px-3.5 sm:px-4 rounded-2xl bg-[#FFFDF9] hover:bg-[#FEF3C7] text-[#302A24] border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-xs font-black flex items-center gap-1.5 shrink-0 cursor-pointer active:translate-y-0.5 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kệ sách</span>
                </button>

                <div className="min-w-0">
                  <div className="text-[10px] font-black tracking-widest text-[#F4D98A] uppercase truncate">
                    TẦNG 2 · BÀI BÁO SONG NGỮ ANH–VIỆT
                  </div>
                  <h2 className="font-heading font-black text-base sm:text-lg leading-tight truncate">
                    {activeNewsCategoryMeta.name}
                  </h2>
                  <p className="text-[11px] font-semibold text-white/80 truncate hidden sm:block">
                    {activeNewsCategoryMeta.subtitle}
                  </p>
                </div>
              </div>

              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/25 border border-white/20 text-xs font-black shrink-0">
                <Newspaper className="w-3.5 h-3.5" style={{ color: activeNewsCategoryMeta.accentColor }} />
                <span style={{ color: activeNewsCategoryMeta.accentColor }}>
                  {filteredNewsArticles.length} bài báo
                </span>
              </div>
            </div>

            {/* Search + News Category Filter Pills */}
            <section className="bg-[#FFFDF9] rounded-3xl p-4 border-2 border-[#3D352E] shadow-[3px_3px_0px_#3D352E] space-y-3">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-[#786F66] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={newsSearchQuery}
                  onChange={(e) => onNewsSearchChange(e.target.value)}
                  placeholder="Tìm bài báo song ngữ theo tiêu đề tiếng Việt hoặc tiếng Anh..."
                  className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-[#FAF5EB] border-2 border-[#3D352E]/60 focus:border-[#3D352E] focus:outline-none text-xs sm:text-sm font-bold text-[#302A24] placeholder:text-[#8E8377]"
                />
                {newsSearchQuery && (
                  <button
                    type="button"
                    onClick={() => onNewsSearchChange('')}
                    aria-label="Xóa tìm kiếm"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-[#3D352E]/40 flex items-center justify-center text-[#5C5248] hover:bg-[#EFE8D6] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {newsCategories.length > 0 && (
                <ScrollablePillStrip
                  className="gap-1.5 pt-0.5 pb-0.5"
                  fadeBgColor="#FFFDF9"
                  ariaLabel="Chuyên mục bài báo song ngữ"
                >
                  {newsCategories.map((cat) => {
                    const count = newsCategoryCounts[cat.id] || 0;
                    const isActive = selectedNewsCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => onSelectNewsCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap shrink-0 border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#382E2B] text-white border-[#382E2B]'
                            : 'bg-white text-[#6E6359] border-[#E2D8C5] hover:border-[#3D352E]'
                        }`}
                      >
                        {cat.name} ({count})
                      </button>
                    );
                  })}
                </ScrollablePillStrip>
              )}
            </section>

            {/* Articles Grid */}
            {filteredNewsArticles.length === 0 ? (
              <div className="bg-[#FFFDF9] rounded-3xl p-10 border-2 border-[#3D352E] shadow-[3px_4px_0px_#3D352E] text-center space-y-2">
                <Newspaper className="w-10 h-10 text-[#9B8E80] mx-auto" />
                <h3 className="font-heading font-black text-base text-[#302A24]">
                  Không tìm thấy bài báo phù hợp
                </h3>
                <p className="text-xs font-semibold text-[#786F66]">
                  Thử đổi từ khóa tìm kiếm hoặc chọn chuyên mục khác nhé.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNewsArticles.map((article, idx) => {
                  const colorTheme = PASSAGE_CARD_THEMES[idx % PASSAGE_CARD_THEMES.length];
                  const preview = article.previewEn || getPassagePreview(article.contentEn);
                  return (
                    <article
                      key={article.id}
                      className="p-5 flex flex-col justify-between hover:-translate-y-1 transition-all duration-200 group bg-white border-2 border-[#3D352E] rounded-[20px] shadow-[3px_4px_0px_#3D352E]"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span
                            className={`px-3 py-1 text-xs font-['Comfortaa',sans-serif] font-bold text-[#302A24] ${colorTheme.badgeBg} rounded-xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center gap-1.5`}
                          >
                            <Newspaper className="w-3.5 h-3.5 text-[#302A24] shrink-0" />
                            <span>Bài #{article.index}</span>
                          </span>
                          <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full border bg-[#EAF5E4] text-[#4D6B53] border-[#8FB383] shrink-0">
                            {article.topicLabel}
                          </span>
                        </div>

                        <h5
                          onClick={() => onOpenNewsArticle(article)}
                          className="font-['Playfair_Display',serif] font-bold text-lg text-[#302A24] tracking-tight leading-snug group-hover:text-[#C85A3F] transition-colors cursor-pointer"
                        >
                          {article.titleVi}
                        </h5>
                        <p className="text-xs font-bold text-[#5C5248] mt-1 leading-snug line-clamp-2">
                          {article.title}
                        </p>

                        <div className="mt-4 p-3.5 bg-[#FAF7F0] rounded-xl border border-dashed border-[#C4B9AA] text-xs text-[#302A24]/90 leading-relaxed font-['Playfair_Display',serif] italic relative">
                          <span className="text-lg font-['Playfair_Display',serif] text-[#C85A3F] font-bold absolute -top-1 left-2">
                            “
                          </span>
                          <p className="pl-3.5 line-clamp-3">{preview}</p>
                        </div>
                      </div>

                      <div className="mt-5 space-y-2.5">
                        <div className="flex items-center justify-between text-xs py-1.5 border-y border-[#EBE4D8] text-[#786F66]">
                          <span className="font-bold text-[#3D352E]">{article.parasCount} đoạn song ngữ</span>
                          <span className="font-semibold text-[#4D6B53]">Miễn phí</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onOpenNewsArticle(article)}
                          className="w-full py-2.5 px-3 text-xs font-['Comfortaa',sans-serif] font-bold text-white bg-[#4D6B53] hover:bg-[#3D5642] rounded-xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                        >
                          <BookOpen className="w-4 h-4 shrink-0" />
                          <span>Đọc song ngữ</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default BilingualHubView;
