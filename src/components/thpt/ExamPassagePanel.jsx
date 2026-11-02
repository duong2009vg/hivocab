// src/components/thpt/ExamPassagePanel.jsx
// Cột bên trái phòng thi THPT: hiển thị toàn bộ ngữ liệu đề bài theo section.
// Chuẩn phong cách HiVocab Exam Focus Mode: giấy thi trang nhã, công thái học đọc hiểu tiếng Anh.

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { BookOpen, ChevronDown, X } from 'lucide-react';
import {
  buildExamSections,
  formatBlanksInHtml,
  parseArrangementSentences,
  escHtml,
  extractHighlightTarget,
} from '../../utils/thptPassageUtils';

// ---------------------------------------------------------------------------
// Helper: build raw HTML string for one section card
// ---------------------------------------------------------------------------

/** Render arrangement section: one card per question with lettered sentence rows. */
function buildArrangementSectionHtml(sec, questions) {
  const secQuestions = questions.filter(
    (q) => q.number >= sec.startQ && q.number <= sec.endQ,
  );

  let arrCardsHtml = '';
  secQuestions.forEach((q) => {
    const sentences =
      q.arrangement_sentences && q.arrangement_sentences.length > 0
        ? q.arrangement_sentences
        : parseArrangementSentences(q.prompt);

    let sHtml = '';
    (sentences || []).forEach((item) => {
      let letter = '';
      let text = '';
      if (item && typeof item === 'object') {
        letter = item.letter || '';
        text = item.text || '';
      } else if (typeof item === 'string') {
        text = item;
      }
      letter = String(letter || '').trim();
      text = String(text || '').trim();
      if (!text) return;

      sHtml += `
        <div class="flex items-start gap-3 p-3 rounded-xl bg-[#FAF9F6] border border-[#EFE8D6] hover:bg-[#F3EFE6] transition-colors">
          <span class="w-6 h-6 rounded-lg bg-[#5a7d4d] text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
            ${escHtml(letter)}
          </span>
          <div class="text-[#2D2422] text-sm leading-relaxed q-text-size select-text font-sans flex-1">
            ${escHtml(text)}
          </div>
        </div>`;
    });

    arrCardsHtml += `
      <div id="passage-q-${q.number}"
           class="passage-q-arr-card p-5 rounded-2xl bg-white border border-[#EFE8D6] shadow-xs space-y-3.5 transition-all duration-200">
        <div class="flex items-center justify-between pb-2.5 border-b border-[#EFE8D6]">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-lg bg-[#5a7d4d]/10 text-[#486b3c] font-black text-xs flex items-center justify-center shrink-0">
              ${q.number}
            </span>
            <span class="font-bold text-xs uppercase tracking-wide text-[#2D2422] font-sans">
              Câu ${q.number}: Ngữ liệu sắp xếp câu
            </span>
          </div>
          <span class="text-[10px] font-bold text-[#486b3c] bg-[#5a7d4d]/10 px-2.5 py-0.5 rounded-full border border-[#5a7d4d]/20 font-sans">
            Sắp xếp logic
          </span>
        </div>

        ${
          q.arrangement_context
            ? `<div class="font-bold text-[#2D2422] italic text-sm pb-1">${escHtml(q.arrangement_context)}</div>`
            : ''
        }

        <div class="space-y-2">
          ${sHtml}
        </div>
      </div>`;
  });

  const sectionInstruction = sec.instruction
    ? `<div class="text-xs text-[#6B5A4E] font-medium italic pb-1 font-serif leading-relaxed border-l-2 border-[#5a7d4d] pl-3 py-1 bg-[#FAF5EB]/50 rounded-r-lg">
         ${escHtml(sec.instruction)}
       </div>`
    : '';

  return `
    <div id="passage-sec-${sec.index}"
         class="passage-sec-card p-6 md:p-8 rounded-2xl bg-white border border-[#EFE8D6] shadow-xs space-y-4 transition-all duration-300 font-sans">
      <div class="flex items-center justify-between pb-3 border-b border-[#EFE8D6] gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <span class="w-6 h-6 rounded-lg bg-[#5a7d4d]/10 text-[#486b3c] font-black text-xs flex items-center justify-center shrink-0">
            ${sec.index}
          </span>
          <h3 class="font-heading font-black text-xs sm:text-sm uppercase tracking-wide text-[#2D2422] truncate">
            ${escHtml(sec.name || sec.group || '')}
          </h3>
        </div>
        <span class="text-[11px] font-bold text-[#486b3c] bg-[#5a7d4d]/10 px-2.5 py-0.5 rounded-full border border-[#5a7d4d]/20 shrink-0">
          Câu ${sec.startQ} - ${sec.endQ}
        </span>
      </div>

      ${sectionInstruction}

      <div class="space-y-4">
        ${arrCardsHtml}
      </div>
    </div>`;
}

/** Render paragraphs for reading/cloze/etc sections. */
function buildParagraphsHtml(sec, questions) {
  const { paragraphs, rawText, startQ, endQ, type } = sec;
  const isReadingComprehension =
    type === 'reading' && Array.isArray(paragraphs) && paragraphs.length > 1;

  let parasHtml = '';

  if (paragraphs && Array.isArray(paragraphs) && paragraphs.length > 0) {
    paragraphs.forEach((rawP, pIdx) => {
      const p = (typeof rawP === 'string' ? rawP : String(rawP || '')).trim();
      if (!p) return;

      const isBullet = /^[\u2022\u25cf\u2605\-\*]\s*|^[1-6]\.\s+/.test(p);
      const isHeader =
        !isBullet && p.length < 50 && (p.endsWith(':') || p === p.toUpperCase());
      const isSource =
        /^\((?:Adapted|Source)[^)]*\)$/i.test(p) ||
        /^(?:Adapted|Source)\s+from/i.test(p);

      if (isBullet) {
        parasHtml += `
          <div class="flex items-start gap-2.5 text-base text-[#2D2422] my-2 pl-2 leading-relaxed font-serif">
            <span class="w-1.5 h-1.5 rounded-full bg-[#5a7d4d] shrink-0 mt-2.5"></span>
            <div class="flex-1">${formatBlanksInHtml(
              p.replace(/^[\u2022\u25cf\u2605\-\*]\s*|^[1-6]\.\s*/, ''),
              startQ,
              endQ,
            )}</div>
          </div>`;
      } else if (isSource) {
        parasHtml += `
          <div class="text-right text-xs text-[#8C827A] italic mt-3 font-serif select-text">
            ${formatBlanksInHtml(p, startQ, endQ)}
          </div>`;
      } else if (isHeader) {
        parasHtml += `
          <div class="font-bold text-[#2D2422] text-xs uppercase tracking-wider mt-4 mb-2 font-sans">
            ${formatBlanksInHtml(p, startQ, endQ)}
          </div>`;
      } else if (isReadingComprehension) {
        parasHtml += `
          <div class="reading-para-block my-4 select-text">
            <div class="flex items-center gap-1.5 mb-1.5 select-none">
              <span class="inline-flex items-center text-[10px] font-black uppercase tracking-wider text-[#486b3c] bg-[#5a7d4d]/10 border border-[#5a7d4d]/20 px-2 py-0.5 rounded-md">
                Đoạn ${pIdx + 1}
              </span>
            </div>
            <p class="text-justify text-base text-[#2D2422] leading-relaxed md:leading-loose select-text font-serif">
              ${formatBlanksInHtml(p, startQ, endQ)}
            </p>
          </div>`;
      } else {
        parasHtml += `
          <p class="text-justify text-base text-[#2D2422] leading-relaxed md:leading-loose indent-6 my-3 font-serif">
            ${formatBlanksInHtml(p, startQ, endQ)}
          </p>`;
      }
    });
  } else if (rawText) {
    parasHtml = `
      <div class="text-[#2D2422] leading-relaxed md:leading-loose font-serif text-base q-text-size select-text whitespace-pre-line space-y-2.5">
        ${formatBlanksInHtml(rawText, startQ, endQ)}
      </div>`;
  } else {
    // Fall back to first question's passage if available
    const secQuestions = questions.filter(
      (q) => q.number >= startQ && q.number <= endQ,
    );
    if (secQuestions.length > 0 && secQuestions[0].passage) {
      parasHtml = `
        <div class="text-[#2D2422] leading-relaxed md:leading-loose font-serif text-base q-text-size select-text whitespace-pre-line space-y-2.5">
          ${formatBlanksInHtml(secQuestions[0].passage, startQ, endQ)}
        </div>`;
    } else {
      parasHtml =
        '<p class="text-xs text-[#8C827A] italic">Phần này bao gồm các câu hỏi độc lập (xem chi tiết ở cột bên phải).</p>';
    }
  }

  return parasHtml;
}

/** Render a reading/cloze section card. */
function buildReadingSectionHtml(sec, questions) {
  const parasHtml = buildParagraphsHtml(sec, questions);

  const instructionHtml = sec.instruction
    ? `<div class="italic text-[#6B5A4E] text-xs mb-3 font-serif leading-relaxed border-l-2 border-[#5a7d4d] pl-3 py-1 bg-[#FAF5EB]/50 rounded-r-lg">
         ${escHtml(sec.instruction)}
       </div>`
    : '';

  const titleHtml = sec.title
    ? `<h4 class="text-center font-heading font-black text-sm uppercase tracking-wider text-[#2D2422] my-4 pb-2 border-b border-[#EFE8D6]">
         ${escHtml(sec.title)}
       </h4>`
    : '';

  return `
    <div id="passage-sec-${sec.index}"
         class="passage-sec-card p-6 md:p-8 rounded-2xl bg-white border border-[#EFE8D6] shadow-xs space-y-4 transition-all duration-300 font-sans">
      <div class="flex items-center justify-between pb-3 border-b border-[#EFE8D6] gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <span class="w-6 h-6 rounded-lg bg-[#5a7d4d]/10 text-[#486b3c] font-black text-xs flex items-center justify-center shrink-0">
            ${sec.index}
          </span>
          <h3 class="font-heading font-black text-xs sm:text-sm uppercase tracking-wide text-[#2D2422] truncate">
            ${escHtml(sec.name || sec.group || '')}
          </h3>
        </div>
        <span class="text-[11px] font-bold text-[#486b3c] bg-[#5a7d4d]/10 px-2.5 py-0.5 rounded-full border border-[#5a7d4d]/20 shrink-0">
          Câu ${sec.startQ} - ${sec.endQ}
        </span>
      </div>

      ${instructionHtml}
      ${titleHtml}

      <!-- Real Exam Paper Typography -->
      <div class="text-[#2D2422] leading-relaxed md:leading-loose font-serif text-base q-text-size select-text space-y-1">
        ${parasHtml}
      </div>
    </div>`;
}

// ---------------------------------------------------------------------------
// Word / sentence highlight helpers (DOM mutation, no state)
// ---------------------------------------------------------------------------

function clearWordHighlights(pane) {
  if (!pane) return;
  pane.querySelectorAll('.thpt-word-highlight').forEach((el) => {
    if (el.tagName === 'MARK') {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent), el);
        parent.normalize();
      }
    } else {
      el.classList.remove('thpt-word-highlight');
    }
  });
}

function applyWordHighlight(pane, word, paraIndex) {
  clearWordHighlights(pane);
  if (!pane || !word) return false;

  let targetContainers = [];
  if (paraIndex !== null && paraIndex >= 0) {
    const paraBlocks = pane.querySelectorAll('.reading-para-block');
    if (paraBlocks.length > paraIndex) {
      targetContainers = [paraBlocks[paraIndex]];
    }
  }
  if (targetContainers.length === 0) {
    targetContainers = Array.from(
      pane.querySelectorAll(
        '.reading-para-block p, .reading-para-block, p.text-justify, .passage-sec-card p',
      ),
    );
  }
  if (targetContainers.length === 0) {
    targetContainers = [pane];
  }

  const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const wordRegex = new RegExp(`\\b(${escapedWord})\\b`, 'gi');

  let found = false;
  let firstMatch = null;

  targetContainers.forEach((container) => {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        let parent = node.parentNode;
        while (parent && parent !== container) {
          if (
            parent.tagName === 'BUTTON' ||
            parent.classList.contains('thpt-word-highlight')
          ) {
            return NodeFilter.FILTER_REJECT;
          }
          parent = parent.parentNode;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const textNodes = [];
    let currentNode;
    while ((currentNode = walker.nextNode())) {
      textNodes.push(currentNode);
    }

    textNodes.forEach((textNode) => {
      const text = textNode.nodeValue;
      wordRegex.lastIndex = 0;
      if (!wordRegex.test(text)) return;

      const frag = document.createDocumentFragment();
      let lastIdx = 0;
      let match;
      wordRegex.lastIndex = 0;
      while ((match = wordRegex.exec(text)) !== null) {
        if (match.index > lastIdx) {
          frag.appendChild(document.createTextNode(text.slice(lastIdx, match.index)));
        }
        const mark = document.createElement('mark');
        mark.className =
          'thpt-word-highlight bg-[#FEF08A] text-[#1E293B] rounded px-1 py-0.5 font-bold shadow-2xs';
        mark.textContent = match[1];
        frag.appendChild(mark);
        if (!firstMatch) firstMatch = mark;
        found = true;
        lastIdx = wordRegex.lastIndex;
      }
      if (lastIdx < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIdx)));
      }
      textNode.parentNode.replaceChild(frag, textNode);
    });
  });

  if (firstMatch) {
    firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  return found;
}

function applySentenceHighlight(pane, paraIndex) {
  clearWordHighlights(pane);
  if (!pane) return;

  let el = null;
  if (paraIndex !== null && paraIndex >= 0) {
    const paraBlocks = pane.querySelectorAll('.reading-para-block');
    if (paraBlocks.length > paraIndex) {
      el =
        paraBlocks[paraIndex].querySelector('.thpt-underlined-sentence') ||
        paraBlocks[paraIndex].querySelector('u');
    }
  }
  if (!el) {
    el = pane.querySelector('.thpt-underlined-sentence') || pane.querySelector('u');
  }
  if (el) {
    el.classList.add('thpt-word-highlight');
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// ---------------------------------------------------------------------------
// Pill label builder
// ---------------------------------------------------------------------------

function buildPillLabel(sec) {
  const name = sec.name || sec.group || `P.${sec.index}`;
  const shortened = name
    .replace(/^ph[aầ]n\s*/i, 'P.')
    .replace(/^part\s*/i, 'P.')
    .trim();
  const label = shortened.length > 8 ? `P.${sec.index}` : shortened;
  return `${label} (${sec.startQ}-${sec.endQ})`;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ExamPassagePanel({
  exam,
  currentQIndex,
  fontSizeClass,
  onJumpToQuestion,
  passagePaneRef,
}) {
  if (!exam) return null;

  // 1. Build sections
  const sections = useMemo(() => buildExamSections(exam), [exam]);

  // 2. Active pill state (1-based section index)
  const [activeSecIndex, setActiveSecIndex] = useState(1);
  // State ẩn/hiện thanh ngữ liệu (mặc định ẩn để không vướng màn hình làm bài)
  const [showNav, setShowNav] = useState(false);

  // Internal ref for the scrollable content div
  const contentRef = useRef(null);

  // ---------------------------------------------------------------------------
  // 3. Build full passage HTML (memoised)
  // ---------------------------------------------------------------------------
  const passageHtml = useMemo(() => {
    if (!sections.length || !exam.questions) return '';
    const questions = exam.questions;
    return sections
      .map((sec) => {
        const isArrangement =
          sec.type === 'arrangement' ||
          questions.some(
            (q) => q.number >= sec.startQ && q.number <= sec.endQ && q.is_arrangement,
          );
        return isArrangement
          ? buildArrangementSectionHtml(sec, questions)
          : buildReadingSectionHtml(sec, questions);
      })
      .join('\n');
  }, [sections, exam]);

  // ---------------------------------------------------------------------------
  // 4. Event delegation for blank buttons (data-jump-q)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const pane = passagePaneRef?.current ?? contentRef.current;
    if (!pane) return;

    const handleClick = (e) => {
      const btn = e.target.closest('[data-jump-q]');
      if (!btn) return;
      const num = parseInt(btn.getAttribute('data-jump-q'), 10);
      if (!isNaN(num) && onJumpToQuestion) {
        onJumpToQuestion(num);
      }
    };

    pane.addEventListener('click', handleClick);
    return () => pane.removeEventListener('click', handleClick);
  }, [passagePaneRef, onJumpToQuestion]);

  // ---------------------------------------------------------------------------
  // 5. Auto-scroll + highlight when currentQIndex changes
  // ---------------------------------------------------------------------------
  const syncPassage = useCallback(
    (qNum) => {
      if (!sections.length) return;
      const pane = passagePaneRef?.current ?? contentRef.current;
      if (!pane) return;

      // Remove existing ring highlights
      pane.querySelectorAll('.passage-sec-card, .passage-q-arr-card').forEach((c) => {
        c.classList.remove('ring-2', 'ring-[#5a7d4d]', 'border-[#5a7d4d]', 'shadow-sm');
      });

      const q = exam.questions[qNum - 1];

      if (q && q.is_arrangement) {
        // Scroll to the specific arrangement card
        const arrCard = pane.querySelector(`#passage-q-${qNum}`);
        if (arrCard) {
          arrCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          arrCard.classList.add('ring-2', 'ring-[#5a7d4d]', 'border-[#5a7d4d]', 'shadow-sm');
        }
        // Highlight the parent section pill
        const targetSec = sections.find(
          (s) => qNum >= s.startQ && qNum <= s.endQ,
        );
        if (targetSec) setActiveSecIndex(targetSec.index);
        clearWordHighlights(pane);
      } else {
        // Scroll to the section card
        const targetSec = sections.find(
          (s) => qNum >= s.startQ && qNum <= s.endQ,
        );
        if (targetSec) {
          setActiveSecIndex(targetSec.index);
          const card = pane.querySelector(`#passage-sec-${targetSec.index}`);
          if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'start' });
            card.classList.add('ring-2', 'ring-[#5a7d4d]', 'border-[#5a7d4d]', 'shadow-sm');
          }
        }

        // Word / sentence highlight
        if (q) {
          const target = extractHighlightTarget(q.prompt || '');
          if (!target) {
            clearWordHighlights(pane);
          } else if (target.type === 'word') {
            applyWordHighlight(pane, target.word, target.paraIndex);
          } else if (target.type === 'sentence') {
            applySentenceHighlight(pane, target.paraIndex);
          }
        } else {
          clearWordHighlights(pane);
        }
      }
    },
    [sections, exam, passagePaneRef],
  );

  useEffect(() => {
    if (currentQIndex == null) return;
    syncPassage(currentQIndex + 1);
  }, [currentQIndex, syncPassage]);

  // ---------------------------------------------------------------------------
  // 6. Pill click → scroll section card into view
  // ---------------------------------------------------------------------------
  const handlePillClick = useCallback(
    (sec) => {
      setActiveSecIndex(sec.index);
      const pane = passagePaneRef?.current ?? contentRef.current;
      if (!pane) return;

      // Remove old highlights
      pane.querySelectorAll('.passage-sec-card, .passage-q-arr-card').forEach((c) => {
        c.classList.remove('ring-2', 'ring-[#5a7d4d]', 'border-[#5a7d4d]', 'shadow-sm');
      });

      const card = pane.querySelector(`#passage-sec-${sec.index}`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        card.classList.add('ring-2', 'ring-[#5a7d4d]', 'border-[#5a7d4d]', 'shadow-sm');
      }
    },
    [passagePaneRef],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="w-full flex flex-col bg-[#FAF9F6] overflow-hidden min-h-0 h-full relative">
      {/* Nút nổi mở thanh ngữ liệu (khi đang ẩn) */}
      {!showNav && (
        <button
          type="button"
          onClick={() => setShowNav(true)}
          className="absolute top-3 right-4 z-20 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-sm border border-[#EFE8D6] shadow-xs hover:shadow-sm text-xs font-bold text-[#382E2B] hover:text-[#557A46] flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
          title="Mở thanh danh sách phần ngữ liệu"
        >
          <BookOpen className="w-3.5 h-3.5 text-[#557A46]" />
          <span>Ngữ liệu ({sections.length} phần)</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#8C827A]" />
        </button>
      )}

      {/* Sub-header: label + section nav pills (chỉ hiện khi người dùng ấn mở) */}
      {showNav && (
        <div className="h-[44px] min-h-[44px] max-h-[44px] px-4 bg-[#FFFDF9] border-b border-[#EFE8D6] flex items-center justify-between shrink-0 gap-2 select-none animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-2 shrink-0">
            <BookOpen className="w-4 h-4 text-[#557A46]" />
            <span className="font-heading font-black text-xs uppercase tracking-wider text-[#382E2B]">
              Ngữ Liệu Đề Bài
            </span>
          </div>

          {/* Section pills */}
          <div
            id="exam-passage-nav-pills"
            className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1 max-w-full"
          >
            {sections.map((sec) => {
              const isActive = sec.index === activeSecIndex;
              return (
                <button
                  key={sec.index}
                  id={`passage-pill-${sec.index}`}
                  type="button"
                  title={sec.name || sec.group}
                  onClick={() => handlePillClick(sec)}
                  className={
                    isActive
                      ? 'px-3 py-1 rounded-xl text-xs font-black whitespace-nowrap transition-all bg-[#5a7d4d] text-white shadow-2xs cursor-pointer shrink-0 font-sans'
                      : 'px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border border-[#EFE8D6] bg-white text-[#6B5A4E] hover:border-[#382E2B]/30 hover:text-[#2D2422] cursor-pointer shrink-0 font-sans'
                  }
                >
                  {buildPillLabel(sec)}
                </button>
              );
            })}
          </div>

          {/* Nút ẩn / đóng thanh ngữ liệu */}
          <button
            type="button"
            onClick={() => setShowNav(false)}
            className="p-1 rounded-lg text-[#8C827A] hover:text-[#2D2422] hover:bg-[#FAF5EB] transition-colors cursor-pointer shrink-0 ml-1"
            title="Ẩn thanh ngữ liệu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Scrollable passage content */}
      <div
        ref={(el) => {
          contentRef.current = el;
          if (passagePaneRef) {
            passagePaneRef.current = el;
          }
        }}
        id="exam-passage-content"
        className={`flex-1 overflow-y-auto min-h-0 p-4 md:p-6 lg:p-8 select-text space-y-5 font-serif leading-relaxed text-[#2D2422]${
          !showNav ? ' pt-10 sm:pt-10' : ''
        }${fontSizeClass ? ` ${fontSizeClass}` : ''}`}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: passage HTML is generated server-side from controlled exam data
        dangerouslySetInnerHTML={{ __html: passageHtml }}
      />
    </div>
  );
}

export default ExamPassagePanel;
