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
 * Helper to strip duplicated title from passage paragraphs or raw text
 */
function sanitizeSectionText(title, paragraphs, rawText) {
  let cleanParas = Array.isArray(paragraphs) ? [...paragraphs] : [];
  let cleanRaw = typeof rawText === 'string' ? rawText : '';

  if (title && title.trim()) {
    const escapedTitle = title.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const titlePrefixRegex = new RegExp(`^${escapedTitle}[:\\-\\s]+`, 'i');

    if (cleanParas.length > 0) {
      const first = (cleanParas[0] || '').trim();
      if (first.toLowerCase() === title.trim().toLowerCase()) {
        cleanParas.shift();
      } else if (titlePrefixRegex.test(first)) {
        cleanParas[0] = first.replace(titlePrefixRegex, '').trim();
      }
    }

    if (cleanRaw) {
      const trimmedRaw = cleanRaw.trim();
      if (trimmedRaw.toLowerCase() === title.trim().toLowerCase()) {
        cleanRaw = '';
      } else if (titlePrefixRegex.test(trimmedRaw)) {
        cleanRaw = trimmedRaw.replace(titlePrefixRegex, '').trim();
      }
    }
  }

  return {
    paragraphs: cleanParas.filter((p) => p && p.trim().length > 0),
    rawText: cleanRaw,
  };
}

/**
 * Build examSections array from exam data (mirrors thptExam.js buildExamSections)
 */
export function buildExamSections(exam) {
  if (!exam) return [];

  const questions = exam.questions || [];

  if (exam.sections && exam.sections.length > 0) {
    return exam.sections.map((s, idx) => {
      const startQ = Number(
        s.start_q ?? s.from_question ?? s.from_q ?? s.start ?? (idx * 10 + 1)
      );
      const endQ = Number(
        s.end_q ?? s.to_question ?? s.to_q ?? s.end ?? ((idx + 1) * 10)
      );
      const secQuestions = questions.filter((q) => {
        const num = q.number ?? q.question_number;
        return num >= startQ && num <= endQ;
      });
      const firstQ = secQuestions[0] || null;

      const groupName = (s.title || s.name || `Phần ${idx + 1}`).trim();
      let title = (firstQ?.passage_title || s.passage_title || '').trim();
      if (!title && s.title && !/^Phần\s+\d+/i.test(s.title)) {
        title = s.title.trim();
      }

      let instruction = (s.instruction || firstQ?.passage_instruction || '').trim();
      let paragraphs = Array.isArray(s.paragraphs) ? [...s.paragraphs] : [];
      let rawText = s.raw_text || '';

      // Determine passage source if section has no paragraphs/rawText
      const sourcePassage = firstQ?.passage || firstQ?.context_passage || '';

      if (sourcePassage && (!paragraphs || paragraphs.length === 0)) {
        rawText = sourcePassage;
        if (sourcePassage.includes('\n\n')) {
          paragraphs = sourcePassage.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
        } else if (sourcePassage.includes('\n')) {
          paragraphs = sourcePassage.split(/\n+/).map((p) => p.trim()).filter(Boolean);
        } else {
          paragraphs = [sourcePassage.trim()];
        }
      } else if (
        sourcePassage &&
        paragraphs.length === 1 &&
        (sourcePassage.includes('\n\n') || sourcePassage.includes('\n'))
      ) {
        const qParas = sourcePassage.includes('\n\n')
          ? sourcePassage.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
          : sourcePassage.split(/\n+/).map((p) => p.trim()).filter(Boolean);
        if (qParas.length > paragraphs.length) {
          paragraphs = qParas;
          if (!rawText) rawText = sourcePassage;
        }
      }

      // Auto-detect arrangement type
      const isArrangement =
        s.type === 'arrangement' ||
        s.part === 3 ||
        secQuestions.some(
          (q) =>
            q.is_arrangement ||
            q.question_type === 'sentence_arrangement' ||
            q.type === 'arrangement'
        );
      const type = isArrangement ? 'arrangement' : (s.type || 'reading');

      const sanitized = sanitizeSectionText(title, paragraphs, rawText);

      return {
        index: s.part || (idx + 1),
        part: s.part || (idx + 1),
        type,
        group: groupName,
        name: groupName,
        startQ,
        endQ,
        instruction,
        title,
        paragraphs: sanitized.paragraphs,
        rawText: sanitized.rawText,
      };
    });
  }

  // Auto-group from questions
  const sections = [];
  let currentSec = null;
  questions.forEach((q) => {
    const qNum = q.number ?? q.question_number;
    const grpName = q.group || 'Ngữ Liệu Đề Thi';
    if (!currentSec || currentSec.group !== grpName) {
      const isArr =
        q.is_arrangement ||
        q.type === 'arrangement' ||
        q.question_type === 'sentence_arrangement';
      currentSec = {
        index: sections.length + 1,
        group: grpName,
        name: grpName,
        type: isArr ? 'arrangement' : 'reading',
        startQ: qNum,
        endQ: qNum,
        instruction: q.passage_instruction || '',
        title: q.passage_title || '',
        paragraphs: q.passage
          ? (q.passage.includes('\n\n')
              ? q.passage.split(/\n\s*\n/)
              : q.passage.split(/\n+/))
              .map((p) => p.trim())
              .filter(Boolean)
          : [],
        rawText: q.passage || '',
      };
      sections.push(currentSec);
    } else {
      currentSec.endQ = qNum;
    }
  });

  return sections.map((sec) => {
    const sanitized = sanitizeSectionText(sec.title, sec.paragraphs, sec.rawText);
    return {
      ...sec,
      paragraphs: sanitized.paragraphs,
      rawText: sanitized.rawText,
    };
  });
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
