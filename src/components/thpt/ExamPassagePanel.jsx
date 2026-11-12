// src/components/thpt/ExamPassagePanel.jsx
// Cột bên trái phòng thi THPT: hiển thị toàn bộ ngữ liệu đề bài theo section.
// Chuẩn phong cách HiVocab Exam Focus Mode: giấy thi trang nhã, công thái học đọc hiểu tiếng Anh.

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { BookOpen, X } from 'lucide-react';
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

function getSecRange(sec) {
  const rawStart = sec.startQ ?? sec.start_q ?? sec.from_question ?? sec.from_q ?? 1;
  const rawEnd = sec.endQ ?? sec.end_q ?? sec.to_question ?? sec.to_q ?? 40;
  const s = Number(rawStart);
  const e = Number(rawEnd);
  return {
    startQ: !isNaN(s) && s > 0 ? s : 1,
    endQ: !isNaN(e) && e > 0 ? e : 40,
  };
}

/** Render arrangement section: one card per question with lettered sentence rows. */
function buildArrangementSectionHtml(sec, questions) {
  const { startQ, endQ } = getSecRange(sec);
  const secQuestions = questions.filter((q) => {
    const num = q.number ?? q.question_number;
    return num >= startQ && num <= endQ;
  });

  let arrCardsHtml = '';
  secQuestions.forEach((q) => {
    const qNum = q.number ?? q.question_number;
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
        const m = item.match(/^([a-zA-Z0-9]+)\.\s*(.+)$/s);
        if (m) {
          letter = m[1];
          text = m[2];
        } else {
          text = item;
        }
      }
      letter = String(letter || '').trim();
      text = String(text || '').trim();
      if (!text) return;

      sHtml += `
        <div class="flex items-start gap-3 p-3 rounded-xl bg-[#FAF9F6] border border-[#EFE8D6] hover:bg-[#F3EFE6] transition-colors">
          <span class="w-6 h-6 rounded-lg bg-[#5a7d4d] text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
            ${escHtml(letter)}
          </span>
          <div class="text-[#2D2422] leading-relaxed q-text-size select-text font-sans flex-1">
            ${escHtml(text)}
          </div>
        </div>`;
    });

    arrCardsHtml += `
      <div id="passage-q-${qNum}"
           class="passage-q-arr-card p-5 rounded-2xl bg-white border border-[#EFE8D6] shadow-xs space-y-3.5 transition-all duration-200">
        <div class="flex items-center justify-between pb-2.5 border-b border-[#EFE8D6]">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-lg bg-[#5a7d4d]/10 text-[#486b3c] font-black text-xs flex items-center justify-center shrink-0">
              ${qNum}
            </span>
            <span class="font-bold text-xs uppercase tracking-wide text-[#2D2422] font-sans">
              Câu ${qNum}: Ngữ liệu sắp xếp câu
            </span>
          </div>
          <span class="text-[10px] font-bold text-[#486b3c] bg-[#5a7d4d]/10 px-2.5 py-0.5 rounded-full border border-[#5a7d4d]/20 font-sans">
            Sắp xếp logic
          </span>
        </div>

        ${
          q.arrangement_context
            ? `<div class="font-medium text-[#2D2422] italic pb-1 whitespace-pre-line bg-[#FAF5EB]/40 p-2.5 rounded-lg border border-[#EFE8D6]/60">${escHtml(q.arrangement_context)}</div>`
            : ''
        }

        <div class="space-y-2">
          ${sHtml}
        </div>

        ${
          q.arrangement_closing
            ? `<div class="font-medium text-[#2D2422] italic whitespace-pre-line pl-1 pt-1">${escHtml(q.arrangement_closing)}</div>`
            : ''
        }
        ${
          q.arrangement_source
            ? `<div class="text-right text-xs text-[#8C827A] italic font-serif">${escHtml(q.arrangement_source)}</div>`
            : ''
        }
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
          Câu ${startQ} - ${endQ}
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
  let { paragraphs, rawText, type, title } = sec;
  const { startQ, endQ } = getSecRange(sec);

  // Defensive strip in case sec.paragraphs was passed without prior sanitization
  if (title && title.trim()) {
    const escapedTitle = title.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const titleRegex = new RegExp(`^${escapedTitle}[:\\-\\s]+`, 'i');
    if (Array.isArray(paragraphs) && paragraphs.length > 0) {
      const first = (paragraphs[0] || '').trim();
      if (first.toLowerCase() === title.trim().toLowerCase()) {
        paragraphs = paragraphs.slice(1);
      } else if (titleRegex.test(first)) {
        paragraphs = [first.replace(titleRegex, '').trim(), ...paragraphs.slice(1)];
      }
    }
    if (rawText && typeof rawText === 'string') {
      const trimmedRaw = rawText.trim();
      if (trimmedRaw.toLowerCase() === title.trim().toLowerCase()) {
        rawText = '';
      } else if (titleRegex.test(trimmedRaw)) {
        rawText = trimmedRaw.replace(titleRegex, '').trim();
      }
    }
  }

  const isReadingComprehension =
    type === 'reading' && Array.isArray(paragraphs) && paragraphs.length > 1;

  let parasHtml = '';
  let blockNo = 0;

  if (paragraphs && Array.isArray(paragraphs) && paragraphs.length > 0) {
    paragraphs.forEach((rawP) => {
      const p = (typeof rawP === 'string' ? rawP : String(rawP || '')).trim();
      if (!p) return;

      const plainP = p.replace(/\{\{\/?[BU]\}\}|\*\*/g, '').trim();
      const isBoldHeader =
        /^\{\{B\}\}[\s\S]+\{\{\/B\}\}$/.test(p) && p.split('{{B}}').length === 2;
      // Bullet chỉ khi mở đầu bằng ký hiệu bullet thật (KHÔNG coi "**" là bullet)
      const isBullet = /^(?:[\u2022\u25cf\u2605]\s*|-\s+)/.test(p);
      const isNumberedHeading =
        /^\d\.\s+/.test(plainP) && plainP.length < 70 && !/[.!?]$/.test(plainP);
      const isHeader =
        isBoldHeader ||
        isNumberedHeading ||
        (!isBullet &&
          plainP.length < 60 &&
          !p.includes('\n') &&
          (plainP.endsWith(':') ||
            plainP.endsWith('?') ||
            plainP.endsWith('!') ||
            plainP === plainP.toUpperCase()));
      const isSource =
        /^\((?:Adapted|Source)[^)]*\)$/i.test(plainP) ||
        /^(?:Adapted|Source)\s+from/i.test(plainP);

      if (isBullet) {
        parasHtml += `
          <div class="flex items-start gap-2.5 text-[#2D2422] my-2 pl-2 leading-relaxed font-serif">
            <span class="w-1.5 h-1.5 rounded-full bg-[#5a7d4d] shrink-0 mt-2.5"></span>
            <div class="flex-1 whitespace-pre-line">${formatBlanksInHtml(
              p.replace(/^(?:[\u2022\u25cf\u2605]\s*|-\s+)/, ''),
              startQ,
              endQ,
            )}</div>
          </div>`;
      } else if (isSource) {
        parasHtml += `
          <div class="text-right text-xs text-[#8C827A] italic mt-3 font-serif select-text">
            ${formatBlanksInHtml(plainP, startQ, endQ)}
          </div>`;
      } else if (isHeader) {
        parasHtml += `
          <div class="font-bold text-[#2D2422] text-sm tracking-wide mt-5 mb-1.5 font-sans select-text">
            ${formatBlanksInHtml(isBoldHeader ? plainP : p, startQ, endQ)}
          </div>`;
      } else if (isReadingComprehension) {
        blockNo += 1;
        parasHtml += `
          <div class="reading-para-block my-4 select-text" data-para-no="${blockNo}">
            <div class="flex items-center gap-1.5 mb-1.5 select-none">
              <span class="inline-flex items-center text-[10px] font-black uppercase tracking-wider text-[#486b3c] bg-[#5a7d4d]/10 border border-[#5a7d4d]/20 px-2 py-0.5 rounded-md">
                Đoạn ${blockNo}
              </span>
            </div>
            <p class="text-justify text-[#2D2422] leading-relaxed md:leading-loose select-text font-serif whitespace-pre-line">
              ${formatBlanksInHtml(p, startQ, endQ)}
            </p>
          </div>`;
      } else {
        parasHtml += `
          <p class="text-justify text-[#2D2422] leading-relaxed md:leading-loose indent-6 my-3 font-serif whitespace-pre-line select-text">
            ${formatBlanksInHtml(p, startQ, endQ)}
          </p>`;
      }
    });
  } else if (rawText) {
    parasHtml = `
      <div class="text-[#2D2422] leading-relaxed md:leading-loose font-serif q-text-size select-text whitespace-pre-line space-y-2.5">
        ${formatBlanksInHtml(rawText, startQ, endQ)}
      </div>`;
  } else {
    // Fall back to first question's passage if available
    const secQuestions = questions.filter((q) => {
      const num = q.number ?? q.question_number;
      return num >= startQ && num <= endQ;
    });
    const fallbackPassage = secQuestions[0]?.passage || secQuestions[0]?.context_passage;
    if (fallbackPassage) {
      parasHtml = `
        <div class="text-[#2D2422] leading-relaxed md:leading-loose font-serif q-text-size select-text whitespace-pre-line space-y-2.5">
          ${formatBlanksInHtml(fallbackPassage, startQ, endQ)}
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
  const { startQ, endQ } = getSecRange(sec);
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
          Câu ${startQ} - ${endQ}
        </span>
      </div>

      ${instructionHtml}
      ${titleHtml}

      <!-- Real Exam Paper Typography -->
      <div class="text-[#2D2422] leading-relaxed md:leading-loose font-serif q-text-size select-text space-y-1">
        ${parasHtml}
      </div>
    </div>`;
}

/** Render a theory/strategy section card for 29 Chuyên đề. */
function buildTheorySectionHtml(sec) {
  const content = sec.passage || sec.rawText || (Array.isArray(sec.paragraphs) ? sec.paragraphs.join('\n\n') : '');
  return `
    <div id="passage-sec-${sec.index}"
         class="passage-sec-card p-6 md:p-8 rounded-2xl bg-white border border-[#EFE8D6] shadow-xs space-y-4 font-sans">
      <div class="flex items-center justify-between pb-3 border-b border-[#EFE8D6]">
        <div class="flex items-center gap-2">
          <span class="w-6 h-6 rounded-lg bg-[#5a7d4d]/10 text-[#486b3c] font-black text-xs flex items-center justify-center shrink-0">
            📖
          </span>
          <h3 class="font-heading font-black text-xs sm:text-sm uppercase tracking-wide text-[#2D2422]">
            ${escHtml(sec.name || 'Lý thuyết trọng tâm & Chiến thuật')}
          </h3>
        </div>
        <span class="text-[11px] font-bold text-[#486b3c] bg-[#5a7d4d]/10 px-2.5 py-0.5 rounded-full border border-[#5a7d4d]/20">
          Chuyên đề
        </span>
      </div>
      <div class="text-[#2D2422] leading-relaxed select-text font-sans text-sm whitespace-pre-line space-y-3 bg-[#FAF8F5] p-4 rounded-xl border border-[#EFE8D6]/80">
        ${escHtml(content)}
      </div>
    </div>`;
}

// ---------------------------------------------------------------------------
// Word / sentence highlight helpers (DOM mutation, no state)
// ---------------------------------------------------------------------------

const ACTIVE_CLS = 'thpt-active-target';
const FALLBACK_CLS = 'thpt-word-highlight';

function clearWordHighlights(pane) {
  if (!pane) return;
  pane.querySelectorAll(`.${ACTIVE_CLS}`).forEach((el) => el.classList.remove(ACTIVE_CLS));
  pane.querySelectorAll(`.${FALLBACK_CLS}`).forEach((el) => {
    if (el.tagName === 'MARK') {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent), el);
        parent.normalize();
      }
    } else {
      el.classList.remove(FALLBACK_CLS);
    }
  });
}

/** Chuẩn hoá để so khớp: bỏ dấu câu, hạ chữ thường, gộp khoảng trắng. */
function normTerm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Lấy khối đoạn văn theo số "paragraph N" (1-based) trong đề. */
function getParaBlock(pane, paraIndex) {
  if (paraIndex === null || paraIndex === undefined || paraIndex < 0) return null;
  const blocks = pane.querySelectorAll('.reading-para-block');
  return blocks.length > paraIndex ? blocks[paraIndex] : null;
}

/** Các phần tử "mục tiêu" đã được in đậm/gạch chân từ đề gốc (chỉ lấy phần tử ngoài cùng). */
function getTargetElements(root) {
  const all = Array.from(root.querySelectorAll('.thpt-bold-word, .thpt-underlined-sentence'));
  return all.filter((el) => !all.some((o) => o !== el && o.contains(el)));
}

function scrollToEl(el) {
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Làm nổi bật ĐÚNG phần tử mục tiêu của câu hỏi hiện tại:
 *  1. Ưu tiên phần tử in đậm/gạch chân có sẵn trong đoạn "paragraph N" khớp từ/cụm cần tìm.
 *  2. Nếu đề không có sẵn định dạng thì chỉ đánh dấu lần xuất hiện ĐẦU TIÊN trong đoạn N.
 *  Không bao giờ tô mọi lần xuất hiện của từ (tránh tô nhầm "it", "them"…).
 */
function applyWordHighlight(pane, word, paraIndex) {
  clearWordHighlights(pane);
  if (!pane || !word) return false;

  const block = getParaBlock(pane, paraIndex);
  // Ưu tiên tìm trong đúng đoạn paraIndex trước; nếu không thấy (do lệch số đoạn trong đề gốc), fallback tìm trong toàn bộ bài đọc (pane)
  const roots = block ? [block, pane] : [pane];
  const want = normTerm(word);

  for (const root of roots) {
    const hit = getTargetElements(root).find((el) => normTerm(el.textContent) === want);
    if (hit) {
      hit.classList.add(ACTIVE_CLS);
      scrollToEl(hit);
      return true;
    }
  }

  // Fallback: không có định dạng sẵn → chỉ tô lần xuất hiện đầu tiên trong ĐÚNG đoạn
  if (!block) return false;
  const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const wordRegex = new RegExp(`(^|[^\\p{L}\\p{N}])(${escapedWord})(?![\\p{L}\\p{N}])`, 'iu');
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      let parent = node.parentNode;
      while (parent && parent !== block) {
        if (parent.tagName === 'BUTTON' || parent.classList?.contains(FALLBACK_CLS)) {
          return NodeFilter.FILTER_REJECT;
        }
        parent = parent.parentNode;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let node;
  while ((node = walker.nextNode())) {
    const m = wordRegex.exec(node.nodeValue);
    if (!m) continue;
    const start = m.index + m[1].length;
    const end = start + m[2].length;
    const frag = document.createDocumentFragment();
    if (start > 0) frag.appendChild(document.createTextNode(node.nodeValue.slice(0, start)));
    const mark = document.createElement('mark');
    mark.className = `${FALLBACK_CLS} bg-[#FEF08A] text-[#1E293B] rounded px-1 py-0.5 font-bold shadow-2xs`;
    mark.textContent = node.nodeValue.slice(start, end);
    frag.appendChild(mark);
    if (end < node.nodeValue.length) {
      frag.appendChild(document.createTextNode(node.nodeValue.slice(end)));
    }
    node.parentNode.replaceChild(frag, node);
    scrollToEl(mark);
    return true;
  }
  return false;
}

/** Câu gạch chân: chỉ đánh dấu câu được gạch chân trong đúng đoạn "paragraph N". */
function applySentenceHighlight(pane, paraIndex) {
  clearWordHighlights(pane);
  if (!pane) return;

  const block = getParaBlock(pane, paraIndex);
  let pool = [];
  if (block) {
    const sents = getTargetElements(block).filter(
      (el) => normTerm(el.textContent).split(' ').length >= 4,
    );
    if (sents.length) pool = sents;
  }
  // Fallback nếu không có câu gạch chân trong đoạn chỉ định
  if (!pool.length) {
    const sents = getTargetElements(pane).filter(
      (el) => normTerm(el.textContent).split(' ').length >= 4,
    );
    pool = sents.length ? sents : Array.from(pane.querySelectorAll('.thpt-underlined-sentence, u'));
  }
  if (!pool.length) return;
  pool.forEach((el) => el.classList.add(ACTIVE_CLS));
  scrollToEl(pool[0]);
}

// ---------------------------------------------------------------------------
// Pill label builder
// ---------------------------------------------------------------------------

function buildPillLabel(sec) {
  if (sec.type === 'theory') {
    return 'Lý thuyết';
  }
  const { startQ, endQ } = getSecRange(sec);
  const name = sec.name || sec.group || `P.${sec.index}`;
  const shortened = name
    .replace(/^ph[aầ]n\s*/i, 'P.')
    .replace(/^part\s*/i, 'P.')
    .trim();
  const label = shortened.length > 8 ? `P.${sec.index}` : shortened;
  return `${label} (${startQ}-${endQ})`;
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
        if (sec.type === 'theory') {
          return buildTheorySectionHtml(sec);
        }
        const { startQ, endQ } = getSecRange(sec);
        const isArrangement =
          sec.type === 'arrangement' ||
          questions.some((q) => {
            const num = q.number ?? q.question_number;
            return (
              num >= startQ &&
              num <= endQ &&
              (q.is_arrangement || q.question_type === 'sentence_arrangement')
            );
          });
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

      const q =
        exam.questions.find((item) => (item.number ?? item.question_number) === qNum) ||
        exam.questions[qNum - 1];

      const isArr = Boolean(q?.is_arrangement || q?.question_type === 'sentence_arrangement');

      if (q && isArr) {
        // Scroll to the specific arrangement card
        const arrCard = pane.querySelector(`#passage-q-${qNum}`);
        if (arrCard) {
          arrCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          arrCard.classList.add('ring-2', 'ring-[#5a7d4d]', 'border-[#5a7d4d]', 'shadow-sm');
        }
        // Highlight the parent section pill
        const targetSec = sections.find((s) => {
          const { startQ, endQ } = getSecRange(s);
          return qNum >= startQ && qNum <= endQ;
        });
        if (targetSec) setActiveSecIndex(targetSec.index);
        clearWordHighlights(pane);
      } else {
        // Scroll to the section card
        const targetSec = sections.find((s) => {
          const { startQ, endQ } = getSecRange(s);
          return qNum >= startQ && qNum <= endQ;
        });
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
          className="absolute top-3 right-4 z-20 p-2 rounded-xl bg-white/95 backdrop-blur-sm border border-[#EFE8D6] shadow-xs hover:shadow-sm text-[#557A46] hover:bg-[#FAF5EB] flex items-center justify-center cursor-pointer transition-all active:scale-95"
          title="Mở thanh ngữ liệu đề bài"
          aria-label="Mở thanh ngữ liệu đề bài"
        >
          <BookOpen className="w-4 h-4 text-[#557A46]" />
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
            className="min-w-0 flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1 max-w-full"
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
                      ? 'px-3 py-1.5 min-h-[36px] flex items-center justify-center rounded-xl text-xs font-black whitespace-nowrap transition-all bg-[#5a7d4d] text-white shadow-2xs cursor-pointer shrink-0 font-sans'
                      : 'px-3 py-1.5 min-h-[36px] flex items-center justify-center rounded-xl text-xs font-bold whitespace-nowrap transition-all border border-[#EFE8D6] bg-white text-[#6B5A4E] hover:border-[#382E2B]/30 hover:text-[#2D2422] cursor-pointer shrink-0 font-sans'
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
            className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-[#8C827A] hover:text-[#2D2422] hover:bg-[#FAF5EB] transition-colors cursor-pointer shrink-0 ml-1"
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
