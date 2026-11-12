// src/components/exercises/TheoryContentRenderer.jsx
// HiVocab Scientific Theory Renderer: giao diện học lý thuyết & cẩm nang tra cứu 29 Chuyên đề 9+ THPT
// Thiết kế khoa học, chia section tabs, tìm kiếm tức thì, bảng so sánh responsive & ví dụ thực chiến

import React, { useState, useMemo, useRef } from 'react';
import {
  BookOpen,
  Search,
  X,
  Sparkles,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  ListFilter,
  GraduationCap,
  Layers,
  ChevronDown,
  ChevronUp,
  Clock,
  Play
} from 'lucide-react';

/**
 * Helper parse raw markdown into structured sections:
 * - Table of contents (headers)
 * - Markdown tables
 * - Example cards (Ví dụ thực chiến)
 * - Steps / Pipelines (BƯỚC 01, 02...)
 * - Notes & Tips callouts
 * - Regular text paragraphs
 */
function parseTheorySections(rawText) {
  if (!rawText) return [];

  const rawLines = rawText.split('\n');
  const sections = [];
  let currentSec = {
    id: 'sec-0',
    title: 'Tổng quan & Giới thiệu',
    blocks: [],
  };

  let i = 0;
  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // 1. Detect Header (### or Numbered Section Title)
    const isHeading =
      trimmed.startsWith('###') ||
      trimmed.startsWith('##') ||
      trimmed.startsWith('Dạng câu hỏi') ||
      trimmed.startsWith('CHIẾN THUẬT') ||
      trimmed.startsWith('CHUYÊN ĐỀ') ||
      /^[I|V|X]+\.\s+/.test(trimmed) ||
      /^\d+\.\d+\.?\s+/.test(trimmed);

    if (isHeading && (trimmed.length < 120 || trimmed.startsWith('###'))) {
      const cleanTitle = trimmed
        .replace(/^#{1,4}\s*/, '')
        .replace(/^[I|V|X]+\.\s+/, '')
        .replace(/\*\*/g, '')
        .trim();

      if (currentSec.blocks.length > 0 || currentSec.id !== 'sec-0') {
        sections.push(currentSec);
      }
      currentSec = {
        id: `sec-${sections.length + 1}`,
        title: cleanTitle || `Mục ${sections.length + 1}`,
        blocks: [],
      };
      i++;
      continue;
    }

    // 2. Detect Markdown Table
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.includes('|', 1)) {
      const tableLines = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('|') && rawLines[i].trim().endsWith('|')) {
        tableLines.push(rawLines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const headerRow = tableLines[0]
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());
        // Skip separator row (|---|---|)
        const rowStart = tableLines[1].includes('---') ? 2 : 1;
        const rows = tableLines.slice(rowStart).map((r) =>
          r
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim())
        );
        currentSec.blocks.push({
          type: 'table',
          headers: headerRow,
          rows,
        });
        continue;
      }
    }

    // 3. Detect Steps / Process (BƯỚC 01, BƯỚC 02...)
    if (/^BƯỚC\s+\d+/i.test(trimmed)) {
      const stepNumMatch = trimmed.match(/^BƯỚC\s+(\d+)/i);
      const stepNum = stepNumMatch ? stepNumMatch[1] : '1';
      // Look ahead for step content
      let stepContent = '';
      i++;
      while (i < rawLines.length && rawLines[i].trim() && !/^BƯỚC\s+\d+/i.test(rawLines[i].trim()) && !rawLines[i].trim().startsWith('###')) {
        stepContent += (stepContent ? ' ' : '') + rawLines[i].trim();
        i++;
      }
      currentSec.blocks.push({
        type: 'step',
        number: stepNum,
        title: trimmed,
        content: stepContent,
      });
      continue;
    }

    // 4. Detect Example Block (> 📝 or 💡 **Ví dụ or Ví dụ 1:)
    if (
      trimmed.startsWith('> 📝') ||
      trimmed.startsWith('💡 **Ví dụ') ||
      trimmed.startsWith('💡 **📌 Ví dụ') ||
      trimmed.startsWith('💡 **📍Ví dụ') ||
      trimmed.startsWith('❖ Ví dụ:') ||
      /^Ví dụ\s+\d+[:.]/i.test(trimmed)
    ) {
      let exTitle = trimmed.replace(/^[>💡📌📍❖\s*]+/, '').replace(/\*\*/g, '').trim();
      let exLines = [];
      i++;
      while (
        i < rawLines.length &&
        !rawLines[i].trim().startsWith('###') &&
        !rawLines[i].trim().startsWith('|') &&
        !/^BƯỚC\s+\d+/i.test(rawLines[i].trim()) &&
        !rawLines[i].trim().startsWith('💡 **Ví dụ') &&
        !rawLines[i].trim().startsWith('> 📝')
      ) {
        const nextT = rawLines[i].trim();
        // Stop if empty line followed by new major section
        if (!nextT && i + 1 < rawLines.length && rawLines[i + 1].trim().startsWith('###')) {
          break;
        }
        if (nextT) {
          exLines.push(nextT);
        }
        i++;
      }

      currentSec.blocks.push({
        type: 'example',
        title: exTitle || 'Ví dụ thực chiến',
        contentLines: exLines,
      });
      continue;
    }

    // 5. Detect Note / Tip (> 💡 or 💡 Lưu ý or Lưu ý: or ☞)
    if (
      trimmed.startsWith('> 💡') ||
      trimmed.startsWith('💡 Lưu ý') ||
      trimmed.startsWith('☞') ||
      trimmed.startsWith('★') ||
      trimmed.startsWith('Notes:') ||
      trimmed.startsWith('Lưu ý:')
    ) {
      const noteTitle = trimmed.replace(/^[>💡☞★\s*]+/, '').replace(/\*\*/g, '').trim();
      let noteBody = '';
      i++;
      while (i < rawLines.length && rawLines[i].trim() && !rawLines[i].trim().startsWith('###') && !rawLines[i].trim().startsWith('|')) {
        noteBody += (noteBody ? '\n' : '') + rawLines[i].trim();
        i++;
      }
      currentSec.blocks.push({
        type: 'note',
        title: noteTitle,
        content: noteBody,
      });
      continue;
    }

    // 6. Regular paragraph / List item
    if (trimmed) {
      currentSec.blocks.push({
        type: 'paragraph',
        text: trimmed,
      });
    }

    i++;
  }

  if (currentSec.blocks.length > 0) {
    sections.push(currentSec);
  }

  return sections;
}

export function TheoryContentRenderer({
  theoryText,
  chapterTitle = '',
  onStartPractice,
  onOpenExamRoom,
  questionCount = 0,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSecId, setActiveSecId] = useState(null);
  const containerRef = useRef(null);

  // Parse sections
  const sections = useMemo(() => parseTheorySections(theoryText), [theoryText]);

  // Estimate read time (words / 180 words per min)
  const readTimeMin = useMemo(() => {
    if (!theoryText) return 2;
    const words = theoryText.trim().split(/\s+/).length;
    return Math.max(2, Math.round(words / 160));
  }, [theoryText]);

  // Filter sections if search query is entered
  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sections;

    return sections
      .map((sec) => {
        const titleMatches = sec.title.toLowerCase().includes(q);
        const matchingBlocks = sec.blocks.filter((b) => {
          if (b.type === 'table') {
            return (
              b.headers.some((h) => h.toLowerCase().includes(q)) ||
              b.rows.some((row) => row.some((cell) => cell.toLowerCase().includes(q)))
            );
          }
          if (b.type === 'example') {
            return (
              b.title.toLowerCase().includes(q) ||
              b.contentLines.some((l) => l.toLowerCase().includes(q))
            );
          }
          if (b.type === 'note') {
            return b.title.toLowerCase().includes(q) || (b.content && b.content.toLowerCase().includes(q));
          }
          if (b.type === 'step') {
            return b.title.toLowerCase().includes(q) || (b.content && b.content.toLowerCase().includes(q));
          }
          if (b.type === 'paragraph') {
            return b.text.toLowerCase().includes(q);
          }
          return false;
        });

        if (titleMatches || matchingBlocks.length > 0) {
          return {
            ...sec,
            blocks: titleMatches ? sec.blocks : matchingBlocks,
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [sections, searchQuery]);

  // Jump to section
  const handleJumpTo = (secId) => {
    setActiveSecId(secId);
    const el = document.getElementById(secId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!theoryText || sections.length === 0) {
    return (
      <div className="py-16 text-center text-[#786F66] bg-[#FFFDF9] rounded-3xl border-2 border-dashed border-[#DECDBB] p-8">
        <BookOpen className="w-10 h-10 mx-auto text-[#DECDBB] mb-3" />
        <p className="font-bold text-sm">Chưa có nội dung lý thuyết cho chuyên đề này.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-6 select-text">
      {/* ── Toolbar: Quick Search & Section Navigation Chips ─────────── */}
      <div className="sticky top-2 z-20 bg-[#FFFDF9]/95 backdrop-blur-md rounded-2xl border-2 border-[#3D352E] shadow-[3px_4px_0px_#3D352E] p-3 sm:p-4 space-y-3 transition-all">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-[#786F66] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tra cứu nhanh cấu trúc, từ vựng, quy tắc..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-[#DECDBB] text-xs sm:text-sm font-medium text-[#302A24] placeholder:text-[#A89F91] focus:outline-none focus:border-[#557A46] focus:ring-2 focus:ring-[#557A46]/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#786F66] hover:text-[#302A24] p-0.5 rounded-full hover:bg-[#FAF5EB]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Metrics & Start Action */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-[#786F66] bg-[#FAF5EB] px-2.5 py-1.5 rounded-xl border border-[#DECDBB]">
              <Clock className="w-3.5 h-3.5 text-[#557A46]" />
              <span>Đọc ~{readTimeMin} phút</span>
            </span>

            {onStartPractice && (
              <button
                type="button"
                onClick={onStartPractice}
                className="px-3.5 py-1.5 rounded-xl bg-[#557A46] hover:bg-[#486b3c] text-white font-black text-xs flex items-center gap-1.5 shadow-[2px_2px_0px_#3D352E] border border-[#3D352E] cursor-pointer active:scale-95 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Luyện tập ({questionCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Section Quick Jump Chips */}
        {sections.length > 1 && !searchQuery && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#A89F91] shrink-0 mr-1 flex items-center gap-1">
              <ListFilter className="w-3 h-3" />
              Mục:
            </span>
            {sections.map((sec, idx) => {
              const isActive = activeSecId === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => handleJumpTo(sec.id)}
                  className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#3D352E] text-white border-[#3D352E] shadow-2xs'
                      : 'bg-white hover:bg-[#FAF5EB] text-[#6B5A4E] border-[#DECDBB]'
                  }`}
                >
                  <span className="mr-1 text-[10px] opacity-75 font-mono">{idx + 1}.</span>
                  <span>{sec.title.length > 25 ? `${sec.title.slice(0, 25)}...` : sec.title}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Search results summary */}
      {searchQuery && (
        <div className="text-xs font-semibold text-[#557A46] bg-[#EAF5E4] border border-[#557A46]/30 px-3.5 py-2 rounded-xl flex items-center justify-between">
          <span>Tìm thấy kết quả phù hợp cho từ khóa: <strong>"{searchQuery}"</strong></span>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-xs font-bold underline cursor-pointer text-[#486b3c]"
          >
            Xem toàn bộ
          </button>
        </div>
      )}

      {/* ── Main Theory Content Sections ─────────────────────────────── */}
      <div className="space-y-6">
        {filteredSections.map((sec, sIdx) => (
          <section
            key={sec.id}
            id={sec.id}
            className="rounded-3xl bg-[#FFFDF9] border-2 border-[#3D352E]/30 p-5 sm:p-7 shadow-xs hover:border-[#3D352E] transition-all space-y-4"
          >
            {/* Section Header */}
            <div className="flex items-center gap-2.5 pb-3 border-b-2 border-dashed border-[#DECDBB]">
              <span className="w-7 h-7 rounded-xl bg-[#557A46] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs font-mono">
                {sIdx + 1}
              </span>
              <h2 className="font-heading font-black text-base sm:text-lg text-[#302A24] leading-snug">
                {sec.title}
              </h2>
            </div>

            {/* Section Content Blocks */}
            <div className="space-y-4 text-xs sm:text-sm text-[#302A24] leading-relaxed">
              {sec.blocks.map((block, bIdx) => {
                // 1. Table
                if (block.type === 'table') {
                  return (
                    <div
                      key={bIdx}
                      className="overflow-hidden rounded-2xl border-2 border-[#DECDBB] bg-white shadow-xs my-3"
                    >
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs sm:text-sm">
                          <thead>
                            <tr className="bg-[#FAF5EB] border-b-2 border-[#DECDBB] text-[#3D352E]">
                              {block.headers.map((h, hIdx) => (
                                <th
                                  key={hIdx}
                                  className="px-3.5 py-2.5 font-heading font-black uppercase tracking-wider text-[11px] sm:text-xs text-[#302A24]"
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#EFE8D6]">
                            {block.rows.map((row, rIdx) => {
                              const isZebra = rIdx % 2 === 1;
                              return (
                                <tr
                                  key={rIdx}
                                  className={`transition-colors hover:bg-[#F5EFE6] ${
                                    isZebra ? 'bg-[#FCFAF7]' : 'bg-white'
                                  }`}
                                >
                                  {row.map((cell, cIdx) => {
                                    const isSTT = cIdx === 0 && cell.length <= 4 && !isNaN(Number(cell));
                                    const isHighlight =
                                      searchQuery &&
                                      cell.toLowerCase().includes(searchQuery.toLowerCase());
                                    return (
                                      <td
                                        key={cIdx}
                                        className={`px-3.5 py-2.5 align-top ${
                                          isSTT
                                            ? 'font-mono font-bold text-center text-[#786F66] w-12'
                                            : cIdx === 1
                                            ? 'font-bold text-[#302A24]'
                                            : 'text-[#4A3E38]'
                                        }`}
                                      >
                                        {isHighlight ? (
                                          <mark className="bg-amber-200 text-slate-900 rounded px-1 font-bold">
                                            {cell}
                                          </mark>
                                        ) : (
                                          cell
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                }

                // 2. Example Card (Ví dụ thực chiến)
                if (block.type === 'example') {
                  return (
                    <div
                      key={bIdx}
                      className="rounded-2xl bg-[#FFFDF9] border-2 border-[#D97706]/40 p-4 sm:p-5 shadow-xs my-3 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#D97706]/20">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-300 font-heading font-black text-xs uppercase tracking-wide">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{block.title || 'Ví dụ thực chiến'}</span>
                        </span>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-full">
                          Đề thi THPT chuẩn
                        </span>
                      </div>

                      <div className="space-y-2">
                        {block.contentLines.map((line, lIdx) => {
                          const isSolution =
                            line.startsWith('Hướng dẫn giải:') ||
                            line.startsWith('⤷') ||
                            line.startsWith('Giải thích:') ||
                            line.startsWith('Tạm dịch:');

                          if (isSolution) {
                            return (
                              <div
                                key={lIdx}
                                className="p-3 rounded-xl bg-[#EAF5E4]/80 border border-[#557A46]/30 text-xs text-[#302A24] space-y-1 font-sans"
                              >
                                <span className="font-bold text-[#557A46] flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#557A46]" />
                                  Lời giải chi tiết & Tạm dịch:
                                </span>
                                <p className="leading-relaxed pl-4">
                                  {line.replace(/^(?:Hướng dẫn giải:|⤷|Giải thích:)\s*/i, '')}
                                </p>
                              </div>
                            );
                          }

                          // Option lines (A. B. C. D.)
                          const isOption = /^[A-D]\.\s+/i.test(line);
                          if (isOption) {
                            return (
                              <div
                                key={lIdx}
                                className="p-2 sm:p-2.5 rounded-xl bg-white border border-[#DECDBB] font-medium text-xs text-[#302A24] flex items-start gap-2 shadow-2xs"
                              >
                                <span className="w-5 h-5 rounded-md bg-[#FAF5EB] font-black text-[11px] flex items-center justify-center shrink-0 text-[#3D352E] border border-[#3D352E]/30">
                                  {line.slice(0, 1)}
                                </span>
                                <span className="pt-0.5">{line.slice(2).trim()}</span>
                              </div>
                            );
                          }

                          return (
                            <p
                              key={lIdx}
                              className="font-serif leading-relaxed text-[#2D2422] whitespace-pre-line select-text"
                            >
                              {line}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                // 3. Step / Pipeline (BƯỚC 01, 02...)
                if (block.type === 'step') {
                  return (
                    <div
                      key={bIdx}
                      className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#557A46]/30 shadow-xs flex items-start gap-3 my-2"
                    >
                      <span className="w-8 h-8 rounded-xl bg-[#EAF5E4] text-[#557A46] font-black text-xs flex items-center justify-center shrink-0 border border-[#557A46]/30">
                        {block.number}
                      </span>
                      <div className="flex-1 space-y-1">
                        <h4 className="font-heading font-black text-xs uppercase tracking-wide text-[#3D352E]">
                          {block.title}
                        </h4>
                        {block.content && (
                          <p className="text-xs text-[#6B5A4E] leading-relaxed">
                            {block.content}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                }

                // 4. Note & Tips Callout
                if (block.type === 'note') {
                  return (
                    <div
                      key={bIdx}
                      className="rounded-2xl bg-[#FEF3C7]/40 border-2 border-amber-300 p-4 sm:p-4.5 text-xs text-[#302A24] space-y-1.5 my-3 shadow-xs"
                    >
                      <div className="flex items-center gap-1.5 font-heading font-black text-xs text-amber-900 uppercase tracking-wide">
                        <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{block.title}</span>
                      </div>
                      {block.content && (
                        <p className="text-[#5C4524] leading-relaxed whitespace-pre-line pl-5">
                          {block.content}
                        </p>
                      )}
                    </div>
                  );
                }

                // 5. Regular text / bullet
                const isBullet = /^[•\-\*]\s+/.test(block.text) || /^[a-z]\)\s+/.test(block.text);
                return (
                  <p
                    key={bIdx}
                    className={`leading-relaxed ${
                      isBullet
                        ? 'pl-3 border-l-2 border-[#557A46]/40 py-0.5 my-1.5 font-medium'
                        : 'my-2 select-text'
                    }`}
                  >
                    {block.text}
                  </p>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* ── Bottom Call to Action ───────────────────────────────────── */}
      <div className="rounded-3xl bg-gradient-to-r from-[#FAF5EB] to-[#FFFDF9] border-[3px] border-[#3D352E] shadow-[4px_5px_0px_#3D352E] p-6 text-center space-y-3">
        <GraduationCap className="w-10 h-10 mx-auto text-[#557A46]" />
        <h3 className="font-heading font-black text-lg text-[#302A24]">
          Đã nắm vững lý thuyết chuyên đề?
        </h3>
        <p className="text-xs sm:text-sm text-[#786F66] max-w-md mx-auto">
          Thực hành ngay {questionCount} câu hỏi trắc nghiệm thực chiến trích từ các kỳ thi THPT chính thức & minh họa!
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onStartPractice && (
            <button
              type="button"
              onClick={onStartPractice}
              className="px-5 py-2.5 rounded-2xl bg-[#557A46] hover:bg-[#486b3c] text-white font-black text-xs sm:text-sm border-2 border-[#3D352E] shadow-[2px_3px_0px_#3D352E] flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Luyện tập ngay tại đây</span>
            </button>
          )}

          {onOpenExamRoom && (
            <button
              type="button"
              onClick={onOpenExamRoom}
              className="px-5 py-2.5 rounded-2xl bg-white hover:bg-[#FAF5EB] text-[#302A24] font-black text-xs sm:text-sm border-2 border-[#3D352E] shadow-[2px_3px_0px_#3D352E] flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <BookOpen className="w-4 h-4 text-[#557A46]" />
              <span>Vào Phòng luyện đề chuẩn THPT</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
