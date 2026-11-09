// src/components/pages/PageTopics.jsx
// Thư Viện Sách Cổ Kính (Antique 3D Wooden Bookcase & Crayon Folders)
// Connected to live production Supabase data via useTopics()
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Plus,
  ChevronRight,
  ChevronLeft,
  X,
  ArrowLeft,
  Trash2,
  Crown,
} from 'lucide-react';
import { useTopics } from '../../hooks/useTopics.js';
import { useModal } from '../../context/ModalContext.jsx';
import { useAuth } from '../../providers/AuthProvider.jsx';

// ---------------------------------------------------------------------------
// DESIGN SYSTEM TOKENS & VINTAGE BOOKBINDING PALETTE
// ---------------------------------------------------------------------------
const VINTAGE_BOOK_COLORS = [
  '#8C3B32', // Crimson Leather
  '#3F5E45', // Forest Sage
  '#B57C2E', // Aged Ochre
  '#3B586B', // Prussian Slate
  '#5E435D', // Vintage Aubergine
  '#7A4930', // Russet Saddle
  '#4B5D4E', // Moss Lichen
  '#99583D', // Burnt Terracotta
  '#3D4E5E', // Oxford Navy
  '#6B533B', // Raw Umber
];

// ---------------------------------------------------------------------------
// COMPACT PROPORTIONAL BOOK SCALING FORMULA (Damped Log Scale)
// Fits 12+ books comfortably on a single shelf row without extremes
// ---------------------------------------------------------------------------
function getBookDimensions(wordCount, isSingleShelfView = false) {
  const effectiveWords = wordCount > 0 ? wordCount : 120;
  const clamped = Math.max(25, Math.min(3500, effectiveWords));
  const minLog = Math.log10(25);
  const maxLog = Math.log10(3500);
  const ratio = (Math.log10(clamped) - minLog) / (maxLog - minLog);

  const scale = isSingleShelfView ? 1.14 : 1.0;
  const widthPx = Math.max(42, Math.round((38 + ratio * 20) * scale));
  const heightPx = Math.round((152 + ratio * 28) * scale);

  return { widthPx, heightPx, ratio };
}

// ---------------------------------------------------------------------------
// NATURAL LEANING POSTURE GENERATOR
// Makes books pack snugly and lean gently into neighbors instead of rigid gaps
// ---------------------------------------------------------------------------
function getBookLeanStyle(index, totalBooks) {
  const pattern = index % 7;
  if (totalBooks <= 2) {
    return index === 1
      ? { rotateDeg: -4.5, marginLeftPx: 5, marginRightPx: 2 }
      : { rotateDeg: -0.5, marginLeftPx: 0, marginRightPx: 0 };
  }
  if (pattern === 2) {
    return { rotateDeg: -4.8, marginLeftPx: 6, marginRightPx: 2 };
  }
  if (pattern === 5) {
    return { rotateDeg: -3.2, marginLeftPx: 4, marginRightPx: 1 };
  }
  if (pattern === 6 && index < totalBooks - 1) {
    return { rotateDeg: 2.6, marginLeftPx: 1, marginRightPx: 4 };
  }
  const microTilt = index % 2 === 0 ? -0.4 : 0.4;
  return { rotateDeg: microTilt, marginLeftPx: -1, marginRightPx: 0 };
}

// ---------------------------------------------------------------------------
// REALISTIC WEB AUDIO SYNTHESIZER FOR BOOK OPEN & PAGE FLIP
// ---------------------------------------------------------------------------
function playCrayonSound(type, muted) {
  if (muted || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'book-open') {
      const thumpOsc = ctx.createOscillator();
      const thumpGain = ctx.createGain();
      thumpOsc.type = 'sine';
      thumpOsc.frequency.setValueAtTime(105, now);
      thumpOsc.frequency.exponentialRampToValueAtTime(42, now + 0.14);
      thumpGain.gain.setValueAtTime(0.16, now);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      thumpOsc.connect(thumpGain);
      thumpGain.connect(ctx.destination);
      thumpOsc.start(now);
      thumpOsc.stop(now + 0.16);

      const duration = 0.36;
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.08 * white) / 1.08;
        lastOut = output[i];
        const t = i / ctx.sampleRate;
        const flutter = 0.65 + 0.35 * Math.sin(t * 95);
        output[i] *= flutter * 2.2;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(650, now + 0.03);
      filter.frequency.exponentialRampToValueAtTime(2100, now + 0.18);
      filter.frequency.exponentialRampToValueAtTime(950, now + 0.35);
      filter.Q.setValueAtTime(1.8, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.001, now);
      noiseGain.gain.linearRampToValueAtTime(0.18, now + 0.06);
      noiseGain.gain.exponentialRampToValueAtTime(0.12, now + 0.22);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      whiteNoise.start(now + 0.02);
      whiteNoise.stop(now + 0.36);
    } else if (type === 'page-flip' || type === 'book-pull') {
      const duration = 0.16;
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
      }

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, now);
      filter.frequency.exponentialRampToValueAtTime(2400, now + 0.07);
      filter.frequency.exponentialRampToValueAtTime(1100, now + 0.16);
      filter.Q.setValueAtTime(2.2, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.16);
    }
  } catch (_) {
    // Ignore audio context restrictions
  }
}

// ---------------------------------------------------------------------------
// SMART FORMATTERS FOR REAL SUPABASE TOPICS & FOLDERS
// ---------------------------------------------------------------------------
function formatShelfDisplayName(folderId, folderLabel, count) {
  const key = String(folderId || '').trim().toLowerCase();
  const suffix = count > 0 ? ` (${count} cuốn)` : '';
  if (key.includes('thpt') || key.includes('đgnl') || key.includes('dgnl')) {
    return 'THPT / ĐGNL 2026 (Cô MP)';
  }
  if (key === 'cam' || key.includes('cambridge')) {
    return `CAM — Cambridge IELTS${suffix}`;
  }
  if (key.includes('actual')) {
    return `IELTS Actual Tests${suffix}`;
  }
  if (key.includes('dest')) {
    return `Destination C1–C2${suffix}`;
  }
  if (key === 'ielts') {
    return `IELTS Trọng Điểm${suffix}`;
  }
  if (key.includes('cefr') || key.includes('oxford')) {
    return `CEFR — Oxford 3000™ & 5000™${suffix}`;
  }
  if (key.includes('sat')) {
    return `SAT — Digital SAT Barron 3500${suffix}`;
  }
  if (key.includes('toeic')) {
    return `TOEIC — Từ Vựng Thương Mại${suffix}`;
  }
  if (key.includes('common')) {
    return 'Common Words — 60 Chủ Đề Từ Vựng Đời Sống (60 cuốn)';
  }
  return `${folderLabel || folderId}${suffix}`;
}

function getShortSpineTitle(rawName, category) {
  const title = String(rawName || '').trim();
  if (!title) return 'Chủ đề';

  // Cambridge IELTS shorthand
  const camMatch = title.match(/\b(?:cambridge(?:\s+ielts)?|cam)\s*(\d+(?:\s*[-–]\s*\d+)?)/i);
  if (camMatch && String(category || '').toLowerCase().includes('cam')) {
    return `CAM ${camMatch[1].replace(/\s+/g, '')}`;
  }

  // IELTS Actual Vol shorthand
  const volMatch = title.match(/\b(?:vol(?:ume)?\.?)\s*(\d+(?:\s*[-–]\s*\d+)?)/i);
  if (volMatch && String(category || '').toLowerCase().includes('actual')) {
    return `IELTS Vol ${volMatch[1].replace(/\s+/g, '')}`;
  }

  // Cô MP THPT topics shorthand with 2026 tags matching reference design
  if (title.toLowerCase().includes('300+') && title.toLowerCase().includes('trọng điểm')) {
    return '300+ Từ Trọng Điểm THPT 2026';
  }
  if (title.toLowerCase().includes('cấu trúc tiếng anh')) {
    return 'Cấu Trúc Tiếng Anh THPT 2026';
  }
  if (title.toLowerCase().includes('collocation')) {
    return 'Collocation Trọng Điểm 2026';
  }
  if (title.toLowerCase().includes('c1-c2') && title.toLowerCase().includes('thpt')) {
    return 'Từ Vựng Nâng Cao C1–C2 2026';
  }
  if (title.toLowerCase().includes('mở rộng') && (title.toLowerCase().includes('26-27') || title.toLowerCase().includes('2026') || title.toLowerCase().includes('trọng điểm'))) {
    return 'Mở Rộng Từ Trọng Điểm 26–27';
  }

  // Destination C1-C2 units shortening
  if (title.toLowerCase().includes('unit 26') && title.toLowerCase().includes('preference')) {
    return 'Unit 26: Preference & Leisure';
  }

  // Strip common verbose prefixes/suffixes for spine legibility
  return title
    .replace(/^\(Cô MP\)\s*/i, '')
    .replace(/^Chủ đề:\s*/i, '')
    .replace(/\s*[-—–]\s*Destination\s*C1[-–]C2$/i, '')
    .replace(/\s*[-—–]\s*Dễ xuất hiện.*$/i, '')
    .trim();
}

function inferBookCefr(rawName, category) {
  const text = `${rawName || ''} ${category || ''}`.toLowerCase();
  if (text.includes('c1-c2') || text.includes('c1–c2') || text.includes('dest') || text.includes('sat')) {
    return 'C1–C2';
  }
  if (text.includes('5000') || text.includes('7.5') || text.includes('cam') || text.includes('actual')) {
    return 'B2–C1';
  }
  if (text.includes('3000') || text.includes('cefr')) {
    return 'A1–B2';
  }
  if (text.includes('thpt') || text.includes('dgnl') || text.includes('đgnl') || text.includes('ielts')) {
    return 'B1–B2';
  }
  if (text.includes('toeic')) {
    return 'A2–B2';
  }
  return 'A2–B1';
}

function estimateFallbackWords(rawName, category, actualWords) {
  if (actualWords && actualWords > 0) return actualWords;
  const text = `${rawName || ''} ${category || ''}`.toLowerCase();
  if (text.includes('3500')) return 3500;
  if (text.includes('3000')) return 3000;
  if (text.includes('5000')) return 2000;
  if (text.includes('600')) return 600;
  if (text.includes('actual')) return 560;
  if (text.includes('cam')) return 450;
  if (text.includes('300+')) return 320;
  if (text.includes('dest')) return 185;
  return 100;
}

// ---------------------------------------------------------------------------
// SUB-COMPONENT: SINGLE SHELF ROW INSIDE THE ANTIQUE BOOKCASE
// ---------------------------------------------------------------------------
function ShelfRowTier({
  shelf,
  isSingleShelfView,
  bookDisplayStyle,
  onSelectFolder,
  onOpenBook,
  onHoverBook,
  onAddBookToShelf,
  onDeleteFolder,
  onDeleteTopic,
}) {
  const scrollRef = useRef(null);

  const handleScrollShelf = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 340, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      {/* 1. MINIMALIST TOP BEAM FOR THIS FOLDER */}
      <div className="antique-folder-beam px-4 sm:px-6 py-2 border-y-[3px] border-[#3D352E] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => onSelectFolder(shelf.id)}
            className="brass-plaque min-h-[44px] px-3 sm:px-3.5 py-1.5 rounded-lg border-2 border-[#3D352E] flex items-center gap-2 cursor-pointer hover:brightness-105 active:scale-[0.98] transition-all min-w-0"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#3D352E] shrink-0" />
            <span className="font-display font-extrabold text-xs sm:text-sm text-[#302A24] tracking-wide truncate">
              {shelf.name}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#3D352E] shrink-0" />
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {shelf.books.length > 8 && (
            <div className="hidden sm:flex items-center gap-1 mr-1">
              <button
                type="button"
                onClick={() => handleScrollShelf(-1)}
                title="Kéo sang trái"
                className="w-8 h-8 rounded-lg bg-[#FAF5EB] hover:bg-[#FEF3C7] text-[#302A24] border-2 border-[#3D352E] cursor-pointer flex items-center justify-center active:scale-[0.96]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleScrollShelf(1)}
                title="Kéo sang phải"
                className="w-8 h-8 rounded-lg bg-[#FAF5EB] hover:bg-[#FEF3C7] text-[#302A24] border-2 border-[#3D352E] cursor-pointer flex items-center justify-center active:scale-[0.96]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {!isSingleShelfView ? (
            <button
              type="button"
              onClick={() => onSelectFolder(shelf.id)}
              className="min-h-[44px] px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#382010]/80 hover:bg-[#241308] text-[#FAF5EB] border border-[#D4AF37]/50 text-[11px] sm:text-xs font-bold cursor-pointer flex items-center gap-1 transition-all shrink-0 active:scale-[0.98]"
            >
              <span>Mở riêng<span className="hidden sm:inline"> kệ này</span><span className="sm:hidden text-[0px] leading-[0] opacity-0 select-none inline"> kệ này</span></span>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onDeleteFolder(shelf.id, shelf.code)}
                title={`Xóa thư mục "${shelf.code}"`}
                className="min-h-[44px] min-w-[44px] p-2 rounded-lg bg-[#FAF5EB] hover:bg-rose-100 text-rose-600 border-2 border-[#3D352E] cursor-pointer transition-all flex items-center justify-center shrink-0 active:scale-[0.98]"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onSelectFolder('all')}
                className="min-h-[44px] px-3.5 py-2 rounded-lg bg-[#FAF5EB] hover:bg-[#FEF3C7] text-[#302A24] border-2 border-[#3D352E] text-xs font-black cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-[0.98]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Xem tất cả giá sách</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. RECESSED WOODEN CAVITY WITH SNUG, GENTLY LEANING BOOKS */}
      <div className="flex items-stretch">
        <div className="w-3.5 sm:w-6 antique-pilaster antique-pilaster-flute border-r-[3px] border-[#3D352E] shrink-0" />

        <div
          ref={scrollRef}
          onScroll={() => onHoverBook(null)}
          className="flex-1 min-w-0 antique-recess-cavity px-4 sm:px-7 pt-9 pb-0 relative overflow-x-auto shelf-scrollbar"
        >
          <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2">
            <div className="w-14 h-1.5 bg-[#D4AF37]/80 border-x border-b border-[#3D352E] rounded-b-full shadow-[0_4px_14px_rgba(244,180,26,0.65)]" />
          </div>

          <div
            className={`flex items-end min-w-max pb-0.5 relative z-10 ${
              isSingleShelfView ? 'min-h-[218px]' : 'min-h-[188px]'
            }`}
          >
            {/* Left Wooden Bookend */}
            <div className="hidden sm:flex flex-col items-center justify-end mr-1.5 select-none shrink-0">
              <div className="w-6 h-12 rounded-t-lg bg-[#5B371E] border-2 border-[#3D352E] shadow-md" />
              <div className="w-8 h-2 bg-[#D4AF37] border border-[#3D352E]" />
            </div>

            {shelf.books.length === 0 ? (
              <div className="flex items-center gap-3 py-8 px-4 text-[#E6C98A]/85 text-xs font-bold">
                <span>Kệ sách này chưa có cuốn sách nào.</span>
                <button
                  type="button"
                  onClick={() => onAddBookToShelf(shelf.id)}
                  className="px-3 py-1.5 rounded-xl bg-[#557A46] hover:bg-[#48683B] text-white font-black border-2 border-[#3D352E] cursor-pointer"
                >
                  + Thêm chủ đề đầu tiên
                </button>
              </div>
            ) : (
              shelf.books.map((book, idx) => {
                const progress = book.progress;
                const dims = getBookDimensions(book.sizeWords, isSingleShelfView);
                const lean = getBookLeanStyle(idx, shelf.books.length);
                const showAsCover =
                  bookDisplayStyle === 'covers' ||
                  (bookDisplayStyle === 'mixed' && idx === 0);

                if (showAsCover) {
                  return (
                    <div
                      key={book.id}
                      onClick={() => onOpenBook(book, shelf)}
                      onMouseEnter={(e) => onHoverBook(book, shelf, e.currentTarget)}
                      onMouseMove={(e) => onHoverBook(book, shelf, e.currentTarget)}
                      onMouseLeave={() => onHoverBook(null)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') onOpenBook(book, shelf);
                      }}
                      style={{
                        height: `${dims.heightPx}px`,
                        backgroundColor: book.coverColor,
                      }}
                      className="book-cover-item group relative w-36 sm:w-40 mx-1.5 rounded-r-xl rounded-l-sm border-[2.5px] border-[#3D352E] shadow-[5px_4px_0px_#1A0E06] cursor-pointer flex flex-col justify-between p-3 text-[#FAF5EB] select-none shrink-0"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-3 border-r border-[#3D352E]/60 bg-black/20" />
                      <div className="pl-2 flex items-center justify-between gap-1 text-[9px] font-bold tracking-wider uppercase text-[#E6C98A]">
                        <span className="truncate">{shelf.code}</span>
                        {book.isLockedPro ? (
                          <span className="px-1.5 py-0.2 rounded bg-[#FEF3C7] text-[#302A24] border border-[#3D352E] font-black shrink-0">
                            PRO
                          </span>
                        ) : (
                          <span className="shrink-0">{book.cefr}</span>
                        )}
                      </div>
                      <div className="pl-2 my-auto py-2 border-y border-[#E6C98A]/35">
                        <p className="font-display font-bold text-xs leading-snug line-clamp-3 text-[#FAF5EB]">
                          {book.shortSpine}
                        </p>
                      </div>
                      <div className="pl-2 flex items-center justify-between text-[9px] text-[#E6C98A]/90 font-semibold">
                        <span>{book.wordCount > 0 ? `${book.wordCount} từ` : book.cefr}</span>
                        <div className="flex items-center gap-1">
                          <span>{progress}%</span>
                          {book.isCustom && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteTopic(book.id, book.title);
                              }}
                              title={`Xóa "${book.title}"`}
                              className="min-w-[36px] min-h-[36px] p-2 rounded-lg bg-black/40 hover:bg-rose-600 text-white transition-colors flex items-center justify-center relative z-20 cursor-pointer active:scale-[0.95]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={book.id}
                    onClick={() => onOpenBook(book, shelf)}
                    onMouseEnter={(e) => onHoverBook(book, shelf, e.currentTarget)}
                    onMouseMove={(e) => onHoverBook(book, shelf, e.currentTarget)}
                    onMouseLeave={() => onHoverBook(null)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') onOpenBook(book, shelf);
                    }}
                    style={{
                      width: `${dims.widthPx}px`,
                      height: `${dims.heightPx}px`,
                      backgroundColor: book.coverColor,
                      '--lean-deg': `${lean.rotateDeg}deg`,
                      marginLeft: `${lean.marginLeftPx}px`,
                      marginRight: `${lean.marginRightPx}px`,
                    }}
                    className="book-spine-leaning group relative rounded-t-[5px] border-[2.5px] border-[#3D352E] shadow-[3px_0px_6px_rgba(15,8,3,0.65)] cursor-pointer flex flex-col items-center justify-between py-2.5 px-1 select-none shrink-0 text-[#FAF5EB] active:scale-[0.98] before:absolute before:-top-6 before:bottom-0 before:inset-x-0"
                  >
                    {/* Top page edge stripes */}
                    <div
                      className="absolute -top-2 left-0.5 right-0.5 h-2 rounded-t-[3px] bg-[#EFE8D6] border-t-2 border-x border-[#3D352E] pointer-events-none"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(180deg, #FAF5EB 0px, #FAF5EB 1.5px, #D8C8B4 1.5px, #D8C8B4 2.5px)',
                      }}
                    />

                    {/* Spine lighting gradient */}
                    <div
                      className="pointer-events-none absolute inset-0 rounded-t-[3px]"
                      style={{
                        background:
                          'linear-gradient(90deg, rgba(255,255,255,0.16) 0%, transparent 24%, transparent 74%, rgba(0,0,0,0.38) 100%)',
                      }}
                    />

                    {/* Top brass foil bands */}
                    <div className="w-full flex flex-col gap-0.5 relative z-10 px-0.5">
                      <div className="w-full h-[1.5px] bg-[#E6C98A]/75" />
                      <div className="w-full h-[1px] bg-[#E6C98A]/40" />
                    </div>

                    {/* Vertical Spine Title */}
                    <div className="writing-vertical flex-1 flex items-center justify-center my-1 px-0.5 overflow-hidden relative z-10">
                      <span className="font-display font-bold text-[10.5px] sm:text-[11px] leading-tight tracking-wide text-[#FAF5EB] drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] truncate max-h-[118px]">
                        {book.shortSpine}
                      </span>
                    </div>

                    {/* Bottom status dot & foil band */}
                    <div className="w-full flex flex-col items-center gap-1 relative z-10 px-0.5">
                      {book.isLockedPro ? (
                        <Crown className="w-2.5 h-2.5 text-[#FEF3C7] fill-[#F4B41A]" />
                      ) : (
                        <span
                          className="w-1.5 h-1.5 rounded-full border border-[#3D352E]/60"
                          style={{
                            backgroundColor:
                              progress >= 80
                                ? '#A3D98B'
                                : progress > 0
                                ? '#F4B41A'
                                : '#E6C98A',
                          }}
                        />
                      )}
                      <div className="w-full h-[1.5px] bg-[#E6C98A]/75" />
                    </div>
                  </div>
                );
              })
            )}

            {/* Add New Book Button on Shelf */}
            <div className="flex flex-col items-center justify-end ml-2 select-none shrink-0">
              <button
                type="button"
                onClick={() => onAddBookToShelf(shelf.id)}
                title="Thêm chủ đề / sách mới vào kệ này"
                className="h-32 w-11 min-w-[44px] rounded-t-md border border-dashed border-[#E6C98A]/45 hover:border-[#FEF3C7] bg-white/5 hover:bg-white/15 flex flex-col items-center justify-center gap-1 text-[#E6C98A]/80 hover:text-[#FEF3C7] transition-all cursor-pointer active:scale-[0.96]"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="w-3.5 sm:w-6 antique-pilaster antique-pilaster-flute border-l-[3px] border-[#3D352E] shrink-0" />
      </div>

      {/* 3. WOODEN SHELF PLANK BASE */}
      <div>
        <div className="h-2.5 w-full antique-shelf-top-plane border-t-2 border-[#241308]" />
        <div className="antique-shelf-front-plank h-5 border-t border-[#3D352E]" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN PAGE COMPONENT: PageTopics
// ---------------------------------------------------------------------------
export function PageTopics() {
  const {
    loading,
    categories,
    activeCategory,
    setActiveCategory,
    folderList,
    isUserPro,
    searchQuery,
    setSearchQuery,
    openTopic,
    handleDeleteTopic,
    handleDeleteFolder,
  } = useTopics();

  const { openModal } = useModal();
  const { user, isPro: isAuthPro } = useAuth();
  const effectiveIsPro = Boolean(isUserPro || isAuthPro);

  const [libraryLayout, setLibraryLayout] = useState('shelf'); // 'shelf' | 'folders'
  const [bookDisplayStyle, setBookDisplayStyle] = useState('spines'); // 'spines' | 'mixed' | 'covers'
  const soundMuted = false;
  const [floatingTooltip, setFloatingTooltip] = useState(null);

  // Category horizontal scroll & drag state
  const categoryScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const isDraggingPills = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const hasDragged = useRef(false);

  const checkScrollState = useCallback(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 6);
    setHasOverflow(el.scrollWidth > el.clientWidth + 6);
  }, []);

  const handleCategoryWheel = useCallback((e) => {
    const el = categoryScrollRef.current;
    if (!el) return;
    if (e.deltaY !== 0) {
      el.scrollLeft += e.deltaY;
    }
  }, []);

  const scrollCategoryPills = useCallback((direction) => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const scrollAmount = 240;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }, []);

  const handleMouseDownPills = useCallback((e) => {
    const el = categoryScrollRef.current;
    if (!el) return;
    isDraggingPills.current = true;
    hasDragged.current = false;
    dragStartX.current = e.pageX - el.offsetLeft;
    dragScrollLeft.current = el.scrollLeft;
  }, []);

  const handleMouseMovePills = useCallback((e) => {
    if (!isDraggingPills.current) return;
    const el = categoryScrollRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - dragStartX.current) * 1.3;
    if (Math.abs(walk) > 4) {
      hasDragged.current = true;
    }
    el.scrollLeft = dragScrollLeft.current - walk;
  }, []);

  const handleMouseUpOrLeavePills = useCallback(() => {
    isDraggingPills.current = false;
  }, []);

  const handleOpenCreateTopic = useCallback(
    (defaultCategory) => {
      if (!user) {
        openModal('requireLogin', {
          title: 'Đăng nhập để tạo chủ đề',
          message:
            'Bạn cần đăng nhập tài khoản để tự tạo và xếp thêm sách từ vựng mới lên kệ nhé!',
          actionName: 'tạo chủ đề',
        });
        return;
      }
      if (defaultCategory && defaultCategory !== 'all') {
        openModal('createTopic', {
          initialStep: 'topic',
          defaultCategory,
        });
      } else {
        openModal('createTopic');
      }
    },
    [user, openModal]
  );

  // Transform live folderList & topics into Antique Bookcase shelves
  const shelves = useMemo(() => {
    return folderList.map((folder, shelfIdx) => {
      const folderCode = folder.label || folder.name || folder.id;
      const books = (folder.topics || []).map((topic, bookIdx) => {
        const actualWords = Number(topic.totalWords || topic.word_count || 0);
        const sizeWords = estimateFallbackWords(topic.name, folder.id, actualWords);
        const progress = Math.min(100, Math.max(0, Math.round(topic.progress || 0)));
        const learnedCount =
          actualWords > 0 ? Math.round((actualWords * progress) / 100) : 0;

        return {
          id: topic.id,
          title: topic.name || 'Chủ đề từ vựng',
          shortSpine: getShortSpineTitle(topic.name, folder.id),
          coverColor:
            VINTAGE_BOOK_COLORS[(shelfIdx * 3 + bookIdx) % VINTAGE_BOOK_COLORS.length],
          wordCount: actualWords,
          sizeWords,
          learnedCount,
          progress,
          cefr: inferBookCefr(topic.name, folder.id),
          isLockedPro: Boolean(topic.is_pro && !effectiveIsPro),
          isCustom: Boolean(topic.user_id),
          category: topic.category || folder.id,
        };
      });

      return {
        id: folder.id,
        code: folderCode,
        name: formatShelfDisplayName(folder.id, folderCode, books.length),
        totalTopicsCount: books.length,
        avgProgress: folder.avgProgress || 0,
        books,
      };
    });
  }, [folderList, effectiveIsPro]);

  // Filter shelves & books by activeCategory and searchQuery
  const filteredShelves = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return shelves
      .filter((shelf) => activeCategory === 'all' || shelf.id.toLowerCase() === activeCategory.toLowerCase())
      .map((shelf) => {
        if (!q) return shelf;
        const matchingBooks = shelf.books.filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.shortSpine.toLowerCase().includes(q) ||
            shelf.code.toLowerCase().includes(q)
        );
        if (
          shelf.name.toLowerCase().includes(q) ||
          shelf.code.toLowerCase().includes(q) ||
          matchingBooks.length > 0
        ) {
          return {
            ...shelf,
            books: matchingBooks.length > 0 ? matchingBooks : shelf.books,
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [shelves, activeCategory, searchQuery]);

  // Aggregate library stats
  const stats = useMemo(() => {
    let totalBooks = 0;
    let totalWords = 0;
    let learnedWords = 0;
    shelves.forEach((s) => {
      totalBooks += s.books.length;
      s.books.forEach((b) => {
        totalWords += b.wordCount;
        learnedWords += b.learnedCount;
      });
    });
    return {
      totalShelves: shelves.length,
      totalBooks,
      totalWords,
      learnedWords,
      percent: totalWords > 0 ? Math.round((learnedWords / totalWords) * 100) : 0,
    };
  }, [shelves]);

  // Dynamic category filter pills
  const categoryPills = useMemo(() => {
    const pills = [
      { id: 'all', label: 'Tất cả giá sách', count: stats.totalBooks },
    ];
    shelves.forEach((shelf) => {
      pills.push({
        id: shelf.id,
        label: shelf.code,
        count: shelf.books.length,
      });
    });
    return pills;
  }, [shelves, stats.totalBooks]);

  useEffect(() => {
    checkScrollState();
    const el = categoryScrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScrollState, { passive: true });
    window.addEventListener('resize', checkScrollState, { passive: true });
    return () => {
      el.removeEventListener('scroll', checkScrollState);
      window.removeEventListener('resize', checkScrollState);
    };
  }, [checkScrollState, categoryPills]);

  useEffect(() => {
    if (!categoryScrollRef.current) return;
    const activeEl = categoryScrollRef.current.querySelector('[data-active-pill="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeCategory]);

  const handleHoverBook = useCallback((book, shelf, targetEl) => {
    if (!book || !targetEl) {
      setFloatingTooltip(null);
      return;
    }
    const rect = targetEl.getBoundingClientRect();
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const clampedX = Math.max(140, Math.min(vw - 140, rect.left + rect.width / 2));
    const topY = Math.max(130, rect.top - 10);
    setFloatingTooltip({
      book,
      shelf,
      x: clampedX,
      y: topY,
    });
  }, []);

  // Clicking a book opens the existing live production Topic Detail flow!
  const handleOpenBook = useCallback(
    (book, shelf) => {
      setFloatingTooltip(null);
      playCrayonSound('book-open', soundMuted);
      openTopic(book.id, book.title, book.category || shelf?.id);
    },
    [soundMuted, openTopic]
  );

  return (
    <div
      id="page-topics"
      className="page active min-h-screen text-[#302A24] selection:bg-[#FEF3C7] selection:text-[#302A24] lg:pl-[var(--sidebar-w,244px)] pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] lg:pb-10 pwa-safe-top"
      style={{
        backgroundColor: '#FAF5EB',
        backgroundImage: 'radial-gradient(#E2D6C3 1.25px, transparent 1.25px)',
        backgroundSize: '22px 22px',
        fontFamily: "'Nunito', 'Quicksand', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@700;800&family=Nunito:wght@500;600;700;800;900&family=Patrick+Hand&family=Quicksand:wght@600;700;800&display=swap');

        .font-display {
          font-family: 'Comfortaa', 'Quicksand', sans-serif;
        }
        .font-hand {
          font-family: 'Patrick Hand', cursive;
        }
        .font-mono-ipa {
          font-family: 'SF Mono', Menlo, Consolas, monospace;
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .antique-cornice {
          background: linear-gradient(180deg, #432714 0%, #684024 45%, #4A2C17 100%);
          box-shadow: inset 0 2px 0 rgba(255, 235, 200, 0.22);
        }
        .antique-folder-beam {
          background: linear-gradient(180deg, #5C381E 0%, #462915 55%, #341D0E 100%);
          box-shadow: inset 0 1px 0 rgba(255, 230, 190, 0.2), 0 4px 10px rgba(15, 8, 3, 0.45);
        }
        .antique-dentil-trim {
          background-image: repeating-linear-gradient(
            90deg,
            #341D0E 0px,
            #341D0E 12px,
            #754A2B 12px,
            #754A2B 24px
          );
        }
        .brass-plaque {
          background: linear-gradient(135deg, #FFF5D6 0%, #EDD07E 52%, #D4AC42 100%);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.85), 0 2px 0 #241308;
        }
        .antique-recess-cavity {
          background-color: #2A190E;
          background-image:
            radial-gradient(ellipse at 50% 0%, rgba(255, 204, 102, 0.20) 0%, rgba(255, 180, 60, 0.05) 50%, transparent 75%),
            repeating-linear-gradient(
              90deg,
              rgba(18, 9, 3, 0.35) 0px,
              rgba(18, 9, 3, 0.35) 2px,
              transparent 2px,
              transparent 64px
            ),
            linear-gradient(180deg, #1C1008 0%, #331F12 32%, #422817 100%);
          box-shadow:
            inset 0 18px 24px -6px rgba(8, 4, 1, 0.85),
            inset 14px 0 20px -8px rgba(8, 4, 1, 0.7),
            inset -14px 0 20px -8px rgba(8, 4, 1, 0.7),
            inset 0 -6px 14px rgba(8, 4, 1, 0.65);
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-x: contain;
        }
        .antique-pilaster {
          background: linear-gradient(90deg, #341D0E 0%, #684024 35%, #7E5030 50%, #56341C 75%, #2E190B 100%);
        }
        .antique-pilaster-flute {
          background-image: repeating-linear-gradient(
            90deg,
            transparent 0px,
            transparent 4px,
            rgba(20, 10, 3, 0.45) 4px,
            rgba(20, 10, 3, 0.45) 7px
          );
        }
        .antique-shelf-top-plane {
          background: linear-gradient(180deg, #4B2E19 0%, #744A2C 65%, #8F5E3B 100%);
        }
        .antique-shelf-front-plank {
          background: linear-gradient(180deg, #875836 0%, #633E23 55%, #3E2514 100%);
          box-shadow: inset 0 1.5px 0 rgba(255, 230, 195, 0.25);
        }

        .shelf-scrollbar {
          scrollbar-color: #B58E58 #241308;
          scrollbar-width: thin;
        }
        .shelf-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        .shelf-scrollbar::-webkit-scrollbar-track {
          background: #241308;
        }
        .shelf-scrollbar::-webkit-scrollbar-thumb {
          background: #B58E58;
          border-radius: 9999px;
          border: 2px solid #241308;
        }
        .shelf-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #DFB54B;
        }

        .book-spine-leaning {
          transform: rotate(var(--lean-deg, 0deg));
          transform-origin: bottom center;
          transition: transform 0.26s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.22s ease, filter 0.2s ease;
        }
        @media (hover: hover) and (pointer: fine) {
          .book-spine-leaning:hover {
            transform: translateY(-14px) rotate(0deg) scale(1.06);
            filter: brightness(1.08);
            z-index: 35;
          }
        }
        .book-cover-item {
          transition: transform 0.26s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.22s ease;
        }
        @media (hover: hover) and (pointer: fine) {
          .book-cover-item:hover {
            transform: translateY(-10px) rotate(1deg) scale(1.03);
            z-index: 35;
          }
        }

        .writing-vertical {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
      `}</style>

      {/* FLOATING BOOK DETAIL CARD (Renders above wooden bookshelf beams on hover) */}
      {floatingTooltip && (() => {
        const { book, shelf, x, y } = floatingTooltip;
        const progress = book.progress;
        return (
          <div
            style={{
              left: `${x}px`,
              top: `${y}px`,
              transform: 'translate(-50%, -100%)',
            }}
            className="pointer-events-none hidden md:block fixed z-[90] w-60 p-3.5 rounded-2xl bg-[#FFFDF9] text-[#302A24] border-[3px] border-[#3D352E] shadow-[5px_6px_0px_#3D352E] transition-all duration-75"
          >
            <div className="flex items-center justify-between gap-1 text-[10px] font-black text-[#557A46] mb-1">
              <span className="px-2 py-0.5 rounded-md bg-[#EAF5E4] border border-[#3D352E] truncate max-w-[130px]">
                📁 {shelf?.code}
              </span>
              <span className="shrink-0">
                {book.wordCount > 0 ? `${book.wordCount} từ • ` : ''}
                {book.isLockedPro ? 'PRO' : book.cefr}
              </span>
            </div>
            <p className="font-display font-extrabold text-xs text-[#302A24] leading-snug mt-1">
              {book.title}
            </p>
            <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-[#786F66]">
              <span>
                {book.wordCount > 0
                  ? `Đã thuộc ${book.learnedCount}/${book.wordCount} từ`
                  : 'Tiến độ hoàn thành'}
              </span>
              <span className="text-[#557A46] font-black">{progress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#EFE8D6] border border-[#3D352E] overflow-hidden mt-1">
              <div
                className="h-full bg-[#557A46]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 py-1 px-2 rounded-lg bg-[#FEF3C7] text-[#302A24] text-[10px] font-black text-center border border-[#3D352E]">
              📖 Nhấp để mở sách học ngay →
            </div>
            <div className="w-3.5 h-3.5 bg-[#FFFDF9] border-r-[3px] border-b-[3px] border-[#3D352E] rotate-45 absolute -bottom-2 left-1/2 -translate-x-1/2" />
          </div>
        );
      })()}

      {/* MAIN LIBRARY CONTENT AREA */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-7 max-w-[1400px] mx-auto w-full">
        {/* COMPACT TOP HEADER BAR */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 sm:pb-4 border-b-2 border-dashed border-[#DECDBB]">
          <div className="hidden lg:block">
            <p className="text-xs sm:text-sm font-semibold text-[#786F66]">
              {stats.totalWords > 0 ? (
                <>
                  Đã thuộc{' '}
                  <strong className="text-[#557A46]">
                    {stats.learnedWords.toLocaleString()}
                  </strong>{' '}
                  / {stats.totalWords.toLocaleString()} từ vựng trên{' '}
                  <strong>{stats.totalBooks} cuốn sách</strong>
                </>
              ) : (
                <>
                  Khám phá <strong>{stats.totalBooks} cuốn sách</strong> trên{' '}
                  <strong>{stats.totalShelves} giá sách chuyên đề</strong>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[110px] sm:min-w-[160px] max-w-full sm:max-w-xs lg:w-56 lg:flex-initial">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#786F66] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm sách (CAM 21, Cô MP, SAT...)"
                className="w-full h-8 sm:h-9 pl-8 sm:pl-9 pr-7 sm:pr-8 py-1 rounded-xl bg-white border-2 border-[#3D352E] shadow-[1.5px_2px_0px_#3D352E] sm:shadow-[2px_3px_0px_#3D352E] text-xs font-bold text-[#302A24] placeholder-[#A89C92] focus:outline-none focus:ring-2 focus:ring-[#557A46]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Xóa tìm kiếm"
                  className="absolute right-0 top-0 bottom-0 min-w-[30px] sm:min-w-[34px] flex items-center justify-center text-[#786F66] hover:text-[#302A24] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              )}
            </div>

            {/* Extra-Compact Book Display Mode Switcher (Between search and profiles) */}
            <div className="flex items-center bg-[#F4EDE2] p-0.5 sm:p-1 rounded-xl border-2 border-[#3D352E] shadow-[1.5px_2px_0px_#3D352E] sm:shadow-[2px_3px_0px_#3D352E] shrink-0">
              {[
                { id: 'spines', label: 'Gáy sách' },
                { id: 'covers', label: 'Mặt bìa' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    playCrayonSound('page-flip', soundMuted);
                    setBookDisplayStyle(m.id);
                  }}
                  className={`h-7 sm:h-8 px-2 sm:px-2.5 rounded-lg text-[11px] sm:text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center whitespace-nowrap ${
                    bookDisplayStyle === m.id
                      ? 'bg-[#557A46] text-white shadow-sm'
                      : 'text-[#786F66] hover:text-[#302A24]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Mobile User Avatar Dropdown Trigger */}
            <button
              type="button"
              data-mobile-avatar="true"
              onClick={() => window.toggleMobileProfileDropdown?.()}
              aria-label="Mở menu tài khoản cá nhân"
              className="mobile-user-avatar lg:hidden w-8 h-8 sm:w-9 sm:h-9 min-w-[32px] min-h-[32px] sm:min-w-[36px] sm:min-h-[36px] rounded-full border-2 border-[#3D352E] shadow-[1.5px_2px_0px_#3D352E] sm:shadow-[2px_3px_0px_#3D352E] bg-[#FEF3C7] text-[#302A24] flex items-center justify-center font-display font-extrabold text-xs cursor-pointer select-none overflow-hidden shrink-0 active:scale-[0.96]"
            >
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt={user?.user_metadata?.full_name || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>
                  {(user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'H').charAt(0).toUpperCase()}
                </span>
              )}
            </button>

            {/* Create New Topic / Book Button - visible on desktop */}
            <button
              type="button"
              onClick={() => handleOpenCreateTopic(activeCategory)}
              className="hidden lg:flex h-9 py-1.5 px-3 sm:px-3.5 rounded-xl bg-[#DE5D53] hover:bg-[#C84F45] text-white font-black text-xs border-2 border-[#3D352E] shadow-[2px_3px_0px_#3D352E] active:translate-y-0.5 active:shadow-none transition-all items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Thêm sách mới</span>
            </button>
          </div>
        </header>

        {/* FOLDER / CATEGORY PILLS */}
        <section className="mt-4">
          <div className="flex items-center justify-between gap-2.5 mb-2 w-full min-w-0">
            {/* Scrollable Category Track with Left/Right Navigation */}
            <div className="flex-1 min-w-0 flex items-center gap-1.5">
              {hasOverflow && (
                <button
                  type="button"
                  onClick={() => scrollCategoryPills('left')}
                  disabled={!canScrollLeft}
                  aria-label="Cuộn sang trái"
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-[#3D352E] shadow-[1px_2px_0px_#3D352E] flex items-center justify-center shrink-0 transition-all ${
                    canScrollLeft
                      ? 'bg-white hover:bg-[#FEF3C7] text-[#302A24] cursor-pointer active:scale-95'
                      : 'opacity-25 cursor-not-allowed bg-[#EFE8D6] text-[#786F66]'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              <div
                ref={categoryScrollRef}
                onWheel={handleCategoryWheel}
                onMouseDown={handleMouseDownPills}
                onMouseMove={handleMouseMovePills}
                onMouseUp={handleMouseUpOrLeavePills}
                onMouseLeave={handleMouseUpOrLeavePills}
                className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth cursor-grab active:cursor-grabbing select-none"
              >
                {categoryPills.map((pill) => {
                  const active =
                    activeCategory.toLowerCase() === pill.id.toLowerCase();
                  return (
                    <button
                      key={pill.id}
                      type="button"
                      data-active-pill={active ? 'true' : undefined}
                      onClick={() => {
                        if (hasDragged.current) return;
                        playCrayonSound('page-flip', soundMuted);
                        setActiveCategory(pill.id);
                      }}
                      className={`min-h-[38px] px-3 sm:px-3.5 py-1.5 rounded-full font-extrabold text-xs whitespace-nowrap border-2 border-[#3D352E] transition-all cursor-pointer flex items-center gap-1.5 select-none shrink-0 ${
                        active
                          ? 'bg-[#557A46] text-white shadow-[2px_3px_0px_#3D352E] -translate-y-0.5'
                          : 'bg-[#FFFDF9] hover:bg-[#FEF3C7] text-[#302A24]'
                      }`}
                    >
                      <span>{pill.label}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-black border border-[#3D352E] ${
                          active
                            ? 'bg-[#FEF3C7] text-[#302A24]'
                            : 'bg-[#F4EDE2] text-[#786F66]'
                        }`}
                      >
                        {pill.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {hasOverflow && (
                <button
                  type="button"
                  onClick={() => scrollCategoryPills('right')}
                  disabled={!canScrollRight}
                  aria-label="Cuộn sang phải"
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-[#3D352E] shadow-[1px_2px_0px_#3D352E] flex items-center justify-center shrink-0 transition-all ${
                    canScrollRight
                      ? 'bg-white hover:bg-[#FEF3C7] text-[#302A24] cursor-pointer active:scale-95'
                      : 'opacity-25 cursor-not-allowed bg-[#EFE8D6] text-[#786F66]'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Compact Library Layout Switcher */}
            <div className="flex items-center bg-[#F4EDE2] p-1 rounded-xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] shrink-0">
              <button
                type="button"
                onClick={() => setLibraryLayout('shelf')}
                title="Chế độ Giá Sách Gỗ (Kệ 3D)"
                className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  libraryLayout === 'shelf'
                    ? 'bg-[#557A46] text-white shadow-sm'
                    : 'text-[#786F66] hover:text-[#302A24]'
                }`}
              >
                <span>📚</span>
                <span className="hidden sm:inline">Kệ 3D</span>
              </button>
              <button
                type="button"
                onClick={() => setLibraryLayout('folders')}
                title="Chế độ Tủ Folder Sáp Màu"
                className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  libraryLayout === 'folders'
                    ? 'bg-[#557A46] text-white shadow-sm'
                    : 'text-[#786F66] hover:text-[#302A24]'
                }`}
              >
                <span>📁</span>
                <span className="hidden sm:inline">Folder</span>
              </button>
            </div>
          </div>
        </section>

        {/* BOOKCASE OR CRAYON FOLDER GRID */}
        {loading && shelves.length === 0 ? (
          <div className="mt-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-56 rounded-2xl bg-[#341D0E]/90 border-[4px] border-[#3D352E] shadow-[6px_8px_0px_#3D352E] animate-pulse"
              />
            ))}
          </div>
        ) : filteredShelves.length === 0 ? (
          <div className="mt-6 text-center py-14 px-6 rounded-3xl bg-[#FFFDF9] border-[3px] border-[#3D352E] shadow-[5px_6px_0px_#3D352E]">
            <p className="font-display font-extrabold text-base text-[#302A24]">
              Không tìm thấy cuốn sách hoặc chủ đề nào phù hợp
            </p>
            <p className="text-xs font-semibold text-[#786F66] mt-1">
              Bạn có thể thử từ khóa khác hoặc tự đóng thêm cuốn sách từ vựng mới lên kệ nhé!
            </p>
            <button
              type="button"
              onClick={() => handleOpenCreateTopic(activeCategory)}
              className="mt-4 py-2.5 px-5 rounded-2xl bg-[#557A46] hover:bg-[#48683B] text-white font-black text-xs border-2 border-[#3D352E] shadow-[3px_4px_0px_#3D352E] cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm sách từ vựng mới</span>
            </button>
          </div>
        ) : libraryLayout === 'shelf' ? (
          <section className="mt-4">
            <div className="rounded-t-[26px] rounded-b-[18px] border-[4px] border-[#3D352E] shadow-[8px_10px_0px_#3D352E] overflow-hidden bg-[#341D0E]">
              <div className="antique-cornice border-b-[3px] border-[#3D352E]">
                <div className="h-2.5 w-full antique-dentil-trim border-b border-[#241308]/80" />
                <div className="px-5 py-2.5 hidden sm:flex items-center justify-center gap-2">
                  <span className="text-[11px] font-bold text-[#E6C98A] shrink-0">
                    Ấn vào tên Folder trên thanh gỗ để xem riêng kệ đó • Ấn vào sách để mở trang học
                  </span>
                </div>
              </div>

              <div className="divide-y-0">
                {filteredShelves.map((shelf) => (
                  <ShelfRowTier
                    key={shelf.id}
                    shelf={shelf}
                    isSingleShelfView={activeCategory !== 'all'}
                    bookDisplayStyle={bookDisplayStyle}
                    onSelectFolder={(folderId) => {
                      playCrayonSound('page-flip', soundMuted);
                      setActiveCategory(folderId);
                    }}
                    onOpenBook={handleOpenBook}
                    onHoverBook={handleHoverBook}
                    onAddBookToShelf={(shelfId) => handleOpenCreateTopic(shelfId)}
                    onDeleteFolder={handleDeleteFolder}
                    onDeleteTopic={handleDeleteTopic}
                  />
                ))}
              </div>

              <div className="antique-cornice h-6 border-t-[3px] border-[#3D352E] flex items-center justify-between px-3 sm:px-10">
                <div className="w-6 sm:w-12 h-2 rounded-full bg-[#241308] shrink-0" />
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider sm:tracking-widest text-[#E6C98A]/75 truncate px-1">
                  HIVOCAB CLASSICAL LIBRARY ARCHIVE
                </span>
                <div className="w-6 sm:w-12 h-2 rounded-full bg-[#241308] shrink-0" />
              </div>
            </div>
          </section>
        ) : (
          <section className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredShelves.map((shelf) => (
              <div
                key={shelf.id}
                onClick={() => {
                  playCrayonSound('page-flip', soundMuted);
                  setActiveCategory(shelf.id);
                  setLibraryLayout('shelf');
                }}
                className="rounded-3xl bg-[#FFFDF9] border-[3px] border-[#3D352E] shadow-[5px_6px_0px_#3D352E] p-5 cursor-pointer hover:-translate-y-1 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-xl bg-[#FEF3C7] border-2 border-[#3D352E] font-display font-extrabold text-xs text-[#302A24] truncate">
                      📁 {shelf.code}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-black text-[#557A46]">
                        {shelf.books.length} cuốn sách →
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(shelf.id, shelf.code);
                        }}
                        title={`Xóa thư mục "${shelf.code}"`}
                        className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-500 border border-[#3D352E] transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-display font-extrabold text-base text-[#302A24] mt-3">
                    {shelf.name}
                  </h3>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#786F66] mb-1">
                    <span>Tiến độ trung bình</span>
                    <span className="text-[#557A46] font-black">{shelf.avgProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#EFE8D6] border border-[#3D352E] overflow-hidden mb-3">
                    <div
                      className="h-full bg-[#557A46]"
                      style={{ width: `${Math.min(100, shelf.avgProgress || 0)}%` }}
                    />
                  </div>
                  <div className="pt-2.5 border-t border-dashed border-[#DECDBB] flex items-center justify-between text-xs font-bold text-[#786F66]">
                    <span>Ấn để mở kệ sách của Folder này</span>
                    <ChevronRight className="w-4 h-4 text-[#302A24]" />
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* MASCOT RECOMMENDATION BANNER */}
        <section className="mt-6 bg-[#FFFDF9] rounded-3xl border-[3px] border-[#3D352E] shadow-[5px_6px_0px_#3D352E] p-5 sm:p-6 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#FEF3C7] border-2 border-[#3D352E] shadow-[2px_3px_0px_#3D352E] flex items-center justify-center overflow-hidden shrink-0">
                <img
                  alt="Bé Hổ đọc sách"
                  className="w-full h-full object-contain p-1 mix-blend-multiply"
                  src="/mascot/mascot_reading.png"
                  onError={(e) => {
                    e.currentTarget.src = '/mascot/mascot_cozy.png';
                  }}
                />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EAF5E4] text-[#557A46] text-[11px] font-black border border-[#3D352E]">
                  <Sparkles className="w-3.5 h-3.5 text-[#557A46] shrink-0" />
                  <span>GÓC ĐỌC SÁCH CÙNG BÉ HỔ</span>
                </div>
                <h4 className="font-display font-extrabold text-sm sm:text-base text-[#302A24]">
                  "Mỗi chủ đề là một quyển sách nghiêng tựa vào nhau trên tủ gỗ — hãy rút một cuốn để bắt đầu học nhé!"
                </h4>
                <p className="text-xs text-[#786F66] font-semibold">
                  Độ dày của gáy sách tương ứng với số lượng từ vựng bên trong. Nhấp vào gáy sách hoặc mặt bìa để mở bài học.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default PageTopics;
