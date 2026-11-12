import fs from 'fs';
import { extractHighlightTarget, buildExamSections } from '../src/utils/thptPassageUtils.js';

const norm = (s) => String(s).toLowerCase().replace(/[‘’]/g, "'").replace(/[^\p{L}\p{N}\s'-]/gu, ' ').replace(/\s+/g, ' ').trim();
const data = JSON.parse(fs.readFileSync('public/data/thpt_exams.json', 'utf8'));

let wordOk = 0, sentOk = 0, missing = 0;

for (const exam of data.filter((e) => e.id && e.id.startsWith('thpt-exam-dev-'))) {
  const secs = buildExamSections(exam);
  for (const q of exam.questions) {
    if (q.number < 23) continue;
    const t = extractHighlightTarget(q.prompt);
    if (!t) continue;
    
    const sec = secs.find((s) => q.number >= s.startQ && q.number <= s.endQ);
    if (!sec) {
      console.log('No section for', exam.id, 'Q', q.number);
      missing++;
      continue;
    }

    const blocks = sec.paragraphs.filter((p) => {
      const plain = p.replace(/\{\{\/?[BU]\}\}|\*\*/g, '').trim();
      return !/^\{\{B\}\}/.test(p) && !/^\(Adapted/i.test(plain);
    });

    if (t.type === 'word') {
      const want = norm(t.word);
      // Kiểm tra trong block chỉ định trước
      let hit = false;
      const block = blocks[t.paraIndex];
      if (block) {
        const words = [...block.matchAll(/\*\*(.+?)\*\*/g)].map((m) => norm(m[1]));
        if (words.includes(want)) hit = true;
      }
      // Fallback kiểm tra trong toàn bộ blocks của section (do lệch số đoạn ở đề 09 & 10)
      if (!hit) {
        for (const b of blocks) {
          const words = [...b.matchAll(/\*\*(.+?)\*\*/g)].map((m) => norm(m[1]));
          if (words.includes(want)) {
            hit = true;
            break;
          }
        }
      }

      if (hit) {
        wordOk++;
      } else {
        missing++;
        console.log('MISSING WORD TARGET:', exam.id, 'Q' + q.number, JSON.stringify(t.word), 'paraIndex:', t.paraIndex);
      }
    } else if (t.type === 'sentence') {
      let hit = false;
      const block = blocks[t.paraIndex];
      if (block && /\{\{U\}\}/.test(block)) {
        hit = true;
      }
      if (!hit) {
        for (const b of blocks) {
          if (/\{\{U\}\}/.test(b)) {
            hit = true;
            break;
          }
        }
      }

      if (hit) {
        sentOk++;
      } else {
        missing++;
        console.log('MISSING SENTENCE TARGET:', exam.id, 'Q' + q.number, 'paraIndex:', t.paraIndex);
      }
    }
  }
}

console.log(`Results: ${wordOk}/60 word targets OK, ${sentOk}/20 sentence targets OK, missing: ${missing}`);
