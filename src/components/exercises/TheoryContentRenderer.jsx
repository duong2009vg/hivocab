// src/components/exercises/TheoryContentRenderer.jsx
// Renderer Lý thuyết 29 Chuyên đề chuẩn 100% format DOCX gốc + Luyện tập thử tương tác cho Ví dụ minh họa
import React, { useState, useMemo, useRef } from 'react';
import { X, ArrowRight } from 'lucide-react';

/**
 * Render text containing:
 * - <br/> line breaks
 * - **bold** spans
 * - {{U}}underline{{/U}} spans
 * - Optional searchQuery highlight
 */
function highlightFragment(text, searchQuery, keyPrefix) {
  if (!searchQuery || !text) return text;
  const q = searchQuery.trim();
  if (!q) return text;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(${escaped})`, 'gi');
  const parts = String(text).split(re);
  if (parts.length === 1) return text;
  return parts.map((part, idx) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark key={`${keyPrefix}-m-${idx}`} className="bg-amber-200 text-slate-900 rounded px-0.5 font-semibold">
        {part}
      </mark>
    ) : (
      <React.Fragment key={`${keyPrefix}-t-${idx}`}>{part}</React.Fragment>
    )
  );
}

function renderInlineMarkup(text, searchQuery, keyPrefix = 'seg') {
  if (!text) return null;
  // Split on **bold** first, then inside each chunk parse {{U}}underline{{/U}}
  const boldParts = String(text).split(/(\*\*[\s\S]*?\*\*)/g);
  return boldParts.map((bPart, bIdx) => {
    const isBold = bPart.startsWith('**') && bPart.endsWith('**') && bPart.length > 4;
    const inner = isBold ? bPart.slice(2, -2) : bPart;

    const underParts = inner.split(/(\{\{U\}\}[\s\S]*?\{\{\/U\}\})/g);
    const renderedChildren = underParts.map((uPart, uIdx) => {
      const isUnder = uPart.startsWith('{{U}}') && uPart.endsWith('{{/U}}');
      const leaf = isUnder ? uPart.slice(5, -6) : uPart;
      if (!leaf) return null;
      const content = highlightFragment(leaf, searchQuery, `${keyPrefix}-${bIdx}-${uIdx}`);
      if (isUnder) {
        return (
          <span
            key={`${keyPrefix}-u-${bIdx}-${uIdx}`}
            className="underline decoration-2 underline-offset-2 decoration-[#3D352E]/80"
          >
            {content}
          </span>
        );
      }
      return <React.Fragment key={`${keyPrefix}-n-${bIdx}-${uIdx}`}>{content}</React.Fragment>;
    });

    if (isBold) {
      return (
        <strong key={`${keyPrefix}-b-${bIdx}`} className="font-bold text-[#1F1A17]">
          {renderedChildren}
        </strong>
      );
    }
    return <React.Fragment key={`${keyPrefix}-p-${bIdx}`}>{renderedChildren}</React.Fragment>;
  });
}

function FormattedText({ text, searchQuery = '', className = '' }) {
  if (!text) return null;
  const lines = String(text).split(/<br\s*\/?>|\n/g);
  return (
    <span className={className}>
      {lines.map((line, idx) => (
        <React.Fragment key={idx}>
          {renderInlineMarkup(line, searchQuery, `ln-${idx}`)}
          {idx < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </span>
  );
}

/**
 * Component "Luyện tập thử" tương tác ngay tại phần Ví dụ minh họa trong Lý thuyết
 */
function InteractiveExampleCard({ example, searchQuery }) {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [expandedSolutions, setExpandedSolutions] = useState({});

  if (!example) return null;
  const subQuestions = Array.isArray(example.questions) ? example.questions : [];

  const handleSelectOption = (qIdx, letter) => {
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: letter }));
    setExpandedSolutions((prev) => ({ ...prev, [qIdx]: true }));
  };

  const handleReset = (qIdx) => {
    setSelectedAnswers((prev) => {
      const copy = { ...prev };
      delete copy[qIdx];
      return copy;
    });
    setExpandedSolutions((prev) => ({ ...prev, [qIdx]: false }));
  };

  const handleToggleSolution = (qIdx) => {
    setExpandedSolutions((prev) => ({ ...prev, [qIdx]: !prev[qIdx] }));
  };

  return (
    <div className="rounded-2xl bg-[#FFFDF9] border border-[#C9B9A6] shadow-xs my-4 overflow-hidden">
      {/* Header bar */}
      <div className="px-4 py-2.5 bg-[#FAF5EB] border-b border-[#E5D9C8] flex items-center justify-between gap-2">
        <span className="font-heading font-black text-xs uppercase tracking-wide text-[#3D352E]">
          {example.title || 'Ví dụ minh họa'}
        </span>
        <span className="text-[11px] font-bold text-[#557A46] bg-[#EAF5E4] px-2.5 py-0.5 rounded-full border border-[#557A46]/30">
          Luyện tập thử
        </span>
      </div>

      <div className="p-4 sm:p-5 space-y-5">
        {/* Shared reading passage if present */}
        {example.passage && (
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#FAF8F4] border border-[#E5D9C8] font-serif text-sm sm:text-[15px] text-[#2B241E] leading-relaxed space-y-2.5">
            {example.passage.split('\n').filter(Boolean).map((para, pIdx) => (
              <p key={pIdx} className="leading-relaxed">
                <FormattedText text={para} searchQuery={searchQuery} />
              </p>
            ))}
          </div>
        )}

        {/* Sub-questions list */}
        <div className="space-y-6">
          {subQuestions.map((q, qIdx) => {
            const optionsObj = q.options || {};
            const optionKeys = ['A', 'B', 'C', 'D'].filter((k) => Boolean(optionsObj[k]));
            const chosen = selectedAnswers[qIdx] || null;
            const correct = (q.correctAnswer || '').toUpperCase();
            const isCorrect = Boolean(chosen && correct && chosen === correct);
            const showSol = Boolean(expandedSolutions[qIdx]);

            return (
              <div
                key={qIdx}
                className={qIdx > 0 ? 'pt-5 border-t border-dashed border-[#DECDBB] space-y-3.5' : 'space-y-3.5'}
              >
                {/* Prompt & Source */}
                <div className="space-y-1.5">
                  {subQuestions.length > 1 && q.label && (
                    <span className="inline-block text-[11px] font-black uppercase tracking-wider text-[#3D352E] bg-[#EFE8D6] px-2 py-0.5 rounded">
                      {q.label}
                    </span>
                  )}

                  {q.stem && (
                    <div className="font-serif text-sm sm:text-[15px] text-[#1F1A17] leading-relaxed space-y-1.5">
                      {q.stem.split('\n').filter(Boolean).map((line, lIdx) => (
                        <p key={lIdx} className="leading-relaxed">
                          <FormattedText text={line} searchQuery={searchQuery} />
                        </p>
                      ))}
                    </div>
                  )}

                  {q.source && (
                    <p className="text-xs italic text-[#786F66] text-right">
                      <FormattedText text={q.source} searchQuery={searchQuery} />
                    </p>
                  )}
                </div>

                {/* Clickable Options A B C D */}
                {optionKeys.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {optionKeys.map((letter) => {
                      const optVal = optionsObj[letter];
                      const isThisChosen = chosen === letter;
                      const isThisRight = correct === letter;

                      let cardCls =
                        'bg-white hover:bg-[#FAF5EB] text-[#302A24] border-[#DECDBB] hover:border-[#3D352E]';
                      let badgeCls = 'bg-[#FAF5EB] text-[#3D352E] border-[#C9B9A6]';

                      if (chosen) {
                        if (isThisRight) {
                          cardCls = 'bg-[#EAF5E4] border-[#557A46] text-[#1F3A19] font-semibold ring-1 ring-[#557A46]';
                          badgeCls = 'bg-[#557A46] text-white border-[#557A46]';
                        } else if (isThisChosen) {
                          cardCls = 'bg-rose-50 border-rose-500 text-rose-900 font-semibold ring-1 ring-rose-500';
                          badgeCls = 'bg-rose-500 text-white border-rose-500';
                        } else {
                          cardCls = 'bg-white/60 border-[#E8DFD3] text-[#8C827A] opacity-75';
                        }
                      }

                      return (
                        <button
                          key={letter}
                          type="button"
                          onClick={() => handleSelectOption(qIdx, letter)}
                          className={`w-full p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${cardCls}`}
                        >
                          <span
                            className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 border ${badgeCls}`}
                          >
                            {letter}
                          </span>
                          <span className="text-xs sm:text-sm leading-snug pt-0.5 flex-1">
                            <FormattedText text={optVal} searchQuery={searchQuery} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Feedback & Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    {chosen && (
                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                          isCorrect
                            ? 'bg-[#EAF5E4] text-[#2F5224] border-[#557A46]/40'
                            : 'bg-rose-50 text-rose-700 border-rose-300'
                        }`}
                      >
                        {isCorrect
                          ? `Chính xác (${correct})`
                          : `Chưa đúng — Đáp án đúng là ${correct}`}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {chosen && (
                      <button
                        type="button"
                        onClick={() => handleReset(qIdx)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#786F66] hover:text-[#302A24] bg-white border border-[#DECDBB] hover:bg-[#FAF5EB] cursor-pointer transition-all"
                      >
                        Thử lại
                      </button>
                    )}

                    {Array.isArray(q.explanation) && q.explanation.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleToggleSolution(qIdx)}
                        className="px-3 py-1 rounded-lg text-xs font-bold text-[#3D352E] bg-[#FAF5EB] hover:bg-[#EFE8D6] border border-[#C9B9A6] cursor-pointer transition-all"
                      >
                        {showSol ? 'Ẩn lời giải chi tiết' : 'Xem lời giải chi tiết'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Collapsible Detailed Explanation */}
                {showSol && Array.isArray(q.explanation) && q.explanation.length > 0 && (
                  <div className="p-3.5 sm:p-4 rounded-xl bg-[#F5F9F3] border border-[#557A46]/30 text-xs sm:text-[13px] text-[#2E2722] space-y-1.5 leading-relaxed">
                    <div className="font-heading font-black text-xs uppercase tracking-wider text-[#466839] pb-1 border-b border-[#557A46]/20">
                      Lời giải chi tiết
                    </div>
                    {q.explanation.map((line, eIdx) => (
                      <p key={eIdx} className="leading-relaxed">
                        <FormattedText text={line} searchQuery={searchQuery} />
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Parse raw DOCX-extracted markdown text into structured sections:
 * - Headings (### ...)
 * - Markdown tables (|...|)
 * - Interactive example placeholders ({{EXAMPLE_CARD:index}})
 * - Strategy steps (BƯỚC 01, Bước 1...)
 * - Note / Ghi chú blocks (Notes: / Lưu ý:)
 * - Paragraphs & bullets
 */
function parseTheorySections(rawText) {
  if (!rawText) return [];

  const rawLines = rawText.split('\n');
  const sections = [];
  let currentSec = {
    id: 'sec-0',
    title: 'Tổng quan & Trọng tâm',
    blocks: [],
  };

  let i = 0;
  while (i < rawLines.length) {
    const trimmed = rawLines[i].trim();
    const plain = trimmed.replace(/\*\*|\{\{\/?U\}\}/g, '').trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // 1. Heading
    const isHeading =
      trimmed.startsWith('###') ||
      trimmed.startsWith('##') ||
      /^(?:\d+\.\d+(?:\.\d+)?\.?\s+|I{1,3}V?\.\s+DẠNG|Phần\s+\d+\.\d+\s*-|Dạng câu hỏi về|TIPS LÀM BÀI)/i.test(plain);

    if (isHeading && (trimmed.length < 160 || trimmed.startsWith('###'))) {
      const cleanTitle = plain.replace(/^#{1,4}\s*/, '').trim();
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

    // 2. Interactive Example Card placeholder
    const exMatch = trimmed.match(/^\{\{EXAMPLE_CARD:(\d+)\}\}$/);
    if (exMatch) {
      currentSec.blocks.push({
        type: 'example_card',
        exampleIndex: Number(exMatch[1]),
      });
      i++;
      continue;
    }

    // 3. Markdown Table
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.includes('|', 1)) {
      const tableLines = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('|') && rawLines[i].trim().endsWith('|')) {
        tableLines.push(rawLines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const headerRow = tableLines[0].split('|').slice(1, -1).map((c) => c.trim());
        const rowStart = tableLines[1].includes('---') ? 2 : 1;
        const rows = tableLines.slice(rowStart).map((r) => r.split('|').slice(1, -1).map((c) => c.trim()));
        currentSec.blocks.push({
          type: 'table',
          headers: headerRow,
          rows,
        });
        continue;
      }
    }

    // 4. Steps (BƯỚC 01 / Bước 1:)
    if (/^BƯỚC\s+\d+\b/i.test(plain)) {
      const stepNumMatch = plain.match(/^BƯỚC\s+(\d+)/i);
      const stepNum = stepNumMatch ? stepNumMatch[1] : '1';
      let stepLines = [];
      i++;
      while (
        i < rawLines.length &&
        rawLines[i].trim() &&
        !/^BƯỚC\s+\d+\b/i.test(rawLines[i].trim().replace(/\*\*|\{\{\/?U\}\}/g, '')) &&
        !rawLines[i].trim().startsWith('###') &&
        !rawLines[i].trim().startsWith('|') &&
        !/^\{\{EXAMPLE_CARD:\d+\}\}$/.test(rawLines[i].trim())
      ) {
        stepLines.push(rawLines[i].trim());
        i++;
      }
      currentSec.blocks.push({
        type: 'step',
        number: stepNum,
        title: trimmed,
        lines: stepLines,
      });
      continue;
    }

    // 5. Note / Lưu ý blocks
    if (/^(?:Notes|Lưu ý(?:\s+\d+)?)\s*:/i.test(plain)) {
      const noteTitle = trimmed;
      const noteLines = [];
      i++;
      while (
        i < rawLines.length &&
        rawLines[i].trim() &&
        !rawLines[i].trim().startsWith('###') &&
        !rawLines[i].trim().startsWith('|') &&
        !/^\{\{EXAMPLE_CARD:\d+\}\}$/.test(rawLines[i].trim()) &&
        !/^(?:Notes|Lưu ý(?:\s+\d+)?)\s*:/i.test(rawLines[i].trim().replace(/\*\*|\{\{\/?U\}\}/g, ''))
      ) {
        noteLines.push(rawLines[i].trim());
        i++;
      }
      currentSec.blocks.push({
        type: 'note',
        title: noteTitle,
        lines: noteLines,
      });
      continue;
    }

    // 6. Regular paragraph / list line
    currentSec.blocks.push({
      type: 'paragraph',
      text: trimmed,
      plain,
    });
    i++;
  }

  if (currentSec.blocks.length > 0) {
    sections.push(currentSec);
  }

  return sections;
}

export function TheoryContentRenderer({
  theoryText,
  theoryExamples = [],
  chapterTitle = '',
  onOpenExamRoom,
  questionCount = 0,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSecId, setActiveSecId] = useState(null);
  const containerRef = useRef(null);

  const sections = useMemo(() => parseTheorySections(theoryText), [theoryText]);

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
          if (b.type === 'example_card') {
            const ex = theoryExamples[b.exampleIndex];
            if (!ex) return false;
            return (
              (ex.title || '').toLowerCase().includes(q) ||
              (ex.passage || '').toLowerCase().includes(q) ||
              (ex.questions || []).some(
                (qu) =>
                  (qu.stem || '').toLowerCase().includes(q) ||
                  Object.values(qu.options || {}).some((o) => String(o).toLowerCase().includes(q))
              )
            );
          }
          if (b.type === 'note' || b.type === 'step') {
            return (
              b.title.toLowerCase().includes(q) ||
              (b.lines || []).some((l) => l.toLowerCase().includes(q))
            );
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
  }, [sections, searchQuery, theoryExamples]);

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
        <p className="font-bold text-sm">Chưa có nội dung lý thuyết cho chuyên đề này.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-6 select-text">
      {/* Toolbar: Tra cứu & Chuyển trang Luyện tập THPT */}
      <div className="sticky top-2 z-20 bg-[#FFFDF9]/95 backdrop-blur-md rounded-2xl border-2 border-[#3D352E] shadow-[3px_4px_0px_#3D352E] p-3 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tra cứu nhanh cấu trúc, từ vựng, quy tắc..."
              className="w-full pl-3.5 pr-8 py-2 rounded-xl bg-white border border-[#DECDBB] text-xs sm:text-sm font-medium text-[#302A24] placeholder:text-[#A89F91] focus:outline-none focus:border-[#557A46] focus:ring-2 focus:ring-[#557A46]/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Xóa từ khóa tìm kiếm"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#786F66] hover:text-[#302A24] p-0.5 rounded-full hover:bg-[#FAF5EB] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {onOpenExamRoom && (
            <button
              type="button"
              onClick={onOpenExamRoom}
              className="px-4 py-2 rounded-xl bg-[#557A46] hover:bg-[#486b3c] text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-[2px_2px_0px_#3D352E] border border-[#3D352E] cursor-pointer active:scale-95 transition-all"
            >
              <span>Làm bài tập THPT ({questionCount} câu)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Section Quick Jump Chips */}
        {sections.length > 1 && !searchQuery && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
            <span className="text-[11px] font-bold text-[#8C827A] shrink-0 mr-1">Mục lục:</span>
            {sections.map((sec, idx) => {
              const isActive = activeSecId === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => handleJumpTo(sec.id)}
                  className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#3D352E] text-white border-[#3D352E]'
                      : 'bg-white hover:bg-[#FAF5EB] text-[#6B5A4E] border-[#DECDBB]'
                  }`}
                >
                  <span className="mr-1 opacity-75 font-mono">{idx + 1}.</span>
                  <span>{sec.title.length > 32 ? `${sec.title.slice(0, 32)}...` : sec.title}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Search banner */}
      {searchQuery && (
        <div className="text-xs font-semibold text-[#557A46] bg-[#EAF5E4] border border-[#557A46]/30 px-3.5 py-2 rounded-xl flex items-center justify-between">
          <span>
            Kết quả cho từ khóa: <strong>"{searchQuery}"</strong>
          </span>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-xs font-bold underline cursor-pointer text-[#486b3c]"
          >
            Xem toàn bộ
          </button>
        </div>
      )}

      {/* Main Content Sections */}
      <div className="space-y-5">
        {filteredSections.map((sec, sIdx) => (
          <section
            key={sec.id}
            id={sec.id}
            className="rounded-3xl bg-[#FFFDF9] border-2 border-[#3D352E]/25 p-5 sm:p-7 shadow-xs space-y-4"
          >
            {/* Clean Section Heading */}
            <div className="flex items-center gap-3 pb-3 border-b border-dashed border-[#DECDBB]">
              <span className="w-7 h-7 rounded-lg bg-[#FAF5EB] border border-[#C9B9A6] text-[#3D352E] font-mono font-black text-xs flex items-center justify-center shrink-0">
                {sIdx + 1}
              </span>
              <h2 className="font-heading font-black text-base sm:text-lg text-[#2D241E] leading-snug">
                {sec.title}
              </h2>
            </div>

            {/* Section Blocks */}
            <div className="space-y-3 text-sm text-[#2D241E] leading-relaxed">
              {sec.blocks.map((block, bIdx) => {
                // 1. Table
                if (block.type === 'table') {
                  return (
                    <div
                      key={bIdx}
                      className="overflow-hidden rounded-xl border border-[#C9B9A6] bg-white my-3"
                    >
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs sm:text-sm">
                          <thead>
                            <tr className="bg-[#FAF5EB] border-b border-[#C9B9A6] text-[#2D241E]">
                              {block.headers.map((h, hIdx) => (
                                <th
                                  key={hIdx}
                                  className="px-3.5 py-2.5 font-heading font-bold uppercase tracking-wide text-[11px] sm:text-xs"
                                >
                                  <FormattedText text={h} searchQuery={searchQuery} />
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#EFE8D6]">
                            {block.rows.map((row, rIdx) => (
                              <tr
                                key={rIdx}
                                className={rIdx % 2 === 1 ? 'bg-[#FCFBF8]' : 'bg-white'}
                              >
                                {row.map((cell, cIdx) => {
                                  const plainCell = cell.replace(/\*\*|\{\{\/?U\}\}/g, '').trim();
                                  const isSTT = cIdx === 0 && plainCell.length <= 4 && !isNaN(Number(plainCell));
                                  return (
                                    <td
                                      key={cIdx}
                                      className={`px-3.5 py-2.5 align-top leading-relaxed ${
                                        isSTT ? 'font-mono font-bold text-center text-[#786F66] w-14' : 'text-[#302A24]'
                                      }`}
                                    >
                                      <FormattedText text={cell} searchQuery={searchQuery} />
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                }

                // 2. Interactive Example Card
                if (block.type === 'example_card') {
                  return (
                    <InteractiveExampleCard
                      key={bIdx}
                      example={theoryExamples[block.exampleIndex]}
                      searchQuery={searchQuery}
                    />
                  );
                }

                // 3. Step block
                if (block.type === 'step') {
                  return (
                    <div
                      key={bIdx}
                      className="p-3.5 sm:p-4 rounded-xl bg-white border border-[#DECDBB] flex items-start gap-3 my-2"
                    >
                      <span className="px-2 py-1 rounded-md bg-[#FAF5EB] text-[#3D352E] font-mono font-bold text-xs shrink-0 border border-[#DECDBB]">
                        {block.number}
                      </span>
                      <div className="flex-1 space-y-1">
                        <div className="font-heading font-bold text-xs sm:text-sm text-[#2D241E]">
                          <FormattedText text={block.title} searchQuery={searchQuery} />
                        </div>
                        {(block.lines || []).map((l, lIdx) => (
                          <p key={lIdx} className="text-xs sm:text-sm text-[#4A3E38] leading-relaxed">
                            <FormattedText text={l} searchQuery={searchQuery} />
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                }

                // 4. Note block
                if (block.type === 'note') {
                  return (
                    <div
                      key={bIdx}
                      className="rounded-xl bg-[#FAF5EB]/70 border border-[#DECDBB] p-3.5 sm:p-4 text-xs sm:text-sm text-[#302A24] space-y-1.5 my-2.5"
                    >
                      <div className="font-heading font-bold text-xs sm:text-sm text-[#3D352E]">
                        <FormattedText text={block.title} searchQuery={searchQuery} />
                      </div>
                      {(block.lines || []).map((l, lIdx) => (
                        <p key={lIdx} className="text-[#4A3E38] leading-relaxed">
                          <FormattedText text={l} searchQuery={searchQuery} />
                        </p>
                      ))}
                    </div>
                  );
                }

                // 5. Paragraph / Subsection / Bullet
                const plain = block.plain || '';
                const isSubHeader = /^[a-d]\)\s+/i.test(plain) && plain.length < 110;
                const isBullet = /^[•\-*]\s+/.test(plain);

                if (isSubHeader) {
                  return (
                    <h3
                      key={bIdx}
                      className="font-heading font-bold text-sm sm:text-[15px] text-[#3D352E] pt-2"
                    >
                      <FormattedText text={block.text} searchQuery={searchQuery} />
                    </h3>
                  );
                }

                if (isBullet) {
                  return (
                    <p
                      key={bIdx}
                      className="pl-3.5 border-l-2 border-[#DECDBB] py-0.5 leading-relaxed text-[#302A24]"
                    >
                      <FormattedText text={block.text} searchQuery={searchQuery} />
                    </p>
                  );
                }

                return (
                  <p key={bIdx} className="leading-relaxed text-[#302A24]">
                    <FormattedText text={block.text} searchQuery={searchQuery} />
                  </p>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Bottom Mandatory THPT Practice CTA */}
      {onOpenExamRoom && (
        <div className="rounded-3xl bg-[#FFFDF9] border-[3px] border-[#3D352E] shadow-[4px_5px_0px_#3D352E] p-6 text-center space-y-3">
          <h3 className="font-heading font-black text-base sm:text-lg text-[#302A24]">
            Luyện tập thực chiến trên Phòng thi THPT
          </h3>
          <p className="text-xs sm:text-sm text-[#786F66] max-w-lg mx-auto">
            Làm trọn bộ {questionCount} câu hỏi của chuyên đề <strong className="text-[#302A24]">{chapterTitle}</strong> trực tiếp tại Phòng Luyện đề THPT Quốc Gia.
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={onOpenExamRoom}
              className="px-6 py-3 rounded-2xl bg-[#557A46] hover:bg-[#486b3c] text-white font-black text-sm border-2 border-[#3D352E] shadow-[2px_3px_0px_#3D352E] inline-flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <span>Vào trang Luyện tập THPT ({questionCount} câu)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
