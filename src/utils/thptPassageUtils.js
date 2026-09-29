// src/utils/thptPassageUtils.js
// Pure functions for passage content formatting (ported from thptExam.js)

/**
 * Escape HTML special characters
 */
export function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Format passage text: bold, underline, blank markers, insertion points
 * Returns HTML string for use with dangerouslySetInnerHTML
 */
export function formatBlanksInHtml(text, startQ, endQ) {
  if (!text) return '';
  let escaped = escHtml(text);

  // 1. **bold** → amber highlighted bold
  escaped = escaped.replace(/\*\*(.+?)\*\*/g,
    '<strong class="thpt-bold-word font-bold text-slate-900 bg-amber-100/70 border-b-2 border-amber-500 px-1 py-0.5 rounded-xs shadow-2xs">$1</strong>');

  // 2. {{U}}sentence{{/U}} → blue underline
  escaped = escaped.replace(/\{\{U\}\}(.+?)\{\{\/U\}\}/g,
    '<u class="thpt-underlined-sentence underline decoration-blue-600 decoration-2 underline-offset-4 font-semibold text-slate-900 bg-blue-50/70 px-1 py-0.5 rounded-xs">$1</u>');

  // 3. [I], [II], [III], [IV], [V] insertion markers
  escaped = escaped.replace(/\[(I{1,3}|IV|V)\]/g,
    '<span class="inline-flex items-center justify-center min-w-[22px] h-5 px-1 rounded bg-slate-200 text-slate-800 font-black text-[11px] mx-1 select-none border border-slate-300 shadow-2xs">[$1]</span>');

  // 4. Blank references: (18), _____(18)_____, etc.
  escaped = escaped.replace(/(?:[=_~-]*_{1,}[=_~-]*\s*)*\(\s*([1-3][0-9]|40|[1-9])\s*\)(?:\s*(?:_{1,}|\.{2,}|[-=_~]{1,}))*/g, (match, p1) => {
    const num = parseInt(p1, 10);
    if (num >= (startQ || 1) && num <= (endQ || 40)) {
      return `<button type="button" data-jump-q="${num}" class="inline-flex items-center justify-center px-2 py-0.5 mx-1 rounded-md bg-blue-100 hover:bg-blue-200 border border-blue-300 text-blue-800 font-mono font-bold text-xs shadow-2xs cursor-pointer transition-all">(${num}) _______</button>`;
    }
    return match;
  });

  return escaped;
}

/**
 * Build examSections array from exam data (mirrors thptExam.js buildExamSections)
 */
export function buildExamSections(exam) {
  if (!exam) return [];

  if (exam.sections && exam.sections.length > 0) {
    return exam.sections.map((s, idx) => ({
      index: s.part || (idx + 1),
      part: s.part || (idx + 1),
      type: s.type || 'reading',
      group: s.name || `Phần ${idx + 1}`,
      name: s.name || `Phần ${idx + 1}`,
      startQ: s.start_q,
      endQ: s.end_q,
      instruction: s.instruction || '',
      title: s.title || '',
      paragraphs: s.paragraphs || [],
      rawText: s.raw_text || '',
    }));
  }

  // Auto-group from questions
  const sections = [];
  let currentSec = null;
  (exam.questions || []).forEach(q => {
    const grpName = q.group || 'Ngữ Liệu Đề Thi';
    if (!currentSec || currentSec.group !== grpName) {
      currentSec = {
        index: sections.length + 1,
        group: grpName,
        name: grpName,
        type: 'reading',
        startQ: q.number,
        endQ: q.number,
        instruction: '',
        title: '',
        paragraphs: [],
        rawText: '',
      };
      sections.push(currentSec);
    } else {
      currentSec.endQ = q.number;
    }
  });
  return sections;
}

/**
 * Parse arrangement sentences from raw text like "a. sentence\nb. sentence"
 */
export function parseArrangementSentences(raw) {
  if (!raw) return [];
  const regex = /(?:^|\n)\s*([a-f])\.\s*([\s\S]*?)(?=(?:\n\s*[a-f]\.|\s*$))/gi;
  const items = [];
  let match;
  while ((match = regex.exec(raw)) !== null) {
    items.push({ letter: match[1].toLowerCase(), text: match[2].trim() });
  }
  return items;
}

/**
 * Extract word/phrase to highlight from question prompt
 */
export function extractHighlightTarget(prompt) {
  if (!prompt) return null;

  const paraPat = /in\s+paragraph\s+(\d+)/i;
  const mPara = paraPat.exec(prompt);
  const paraIndex = mPara ? (parseInt(mPara[1], 10) - 1) : null;

  const wordPat = /(?:the|what\s+does\s+the)\s+(?:underlined\s+|italicized\s+|bold(?:ed)?\s+)?(?:word|phrase|expression|term)\s+[\u201c\u201d\u2018\u2019"']([^\u201c\u201d\u2018\u2019"'\n]{1,80})[\u201c\u201d\u2018\u2019"']/i;
  const mWord = wordPat.exec(prompt);
  if (mWord) return { type: 'word', word: mWord[1].trim(), paraIndex };

  const sentPat = /(?:underlined\s+sentence|câu\s+(?:được\s+)?gạch\s+chân)/i;
  if (sentPat.test(prompt)) return { type: 'sentence', paraIndex };

  return null;
}
