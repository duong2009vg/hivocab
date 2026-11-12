import fs from 'fs';
import { formatBlanksInHtml, buildExamSections, formatPromptHtml } from '../src/utils/thptPassageUtils.js';

const data = JSON.parse(fs.readFileSync('public/data/thpt_exams.json', 'utf8'));
let problems = 0;
for (const exam of data.filter((e) => e.id.startsWith('thpt-exam-dev-'))) {
  const secs = buildExamSections(exam);
  for (const s of secs) {
    if (s.type === 'arrangement') continue;
    const html = (s.paragraphs || []).map((p) => formatBlanksInHtml(p, s.startQ, s.endQ)).join('\n');
    const btns = [...html.matchAll(/data-jump-q="(\d+)"/g)].map((m) => +m[1]);
    const stray = (html.match(/\*\*|\{\{|\}\}/g) || []).length;
    if (['leaflet', 'cloze'].includes(s.type)) {
      const need = [];
      for (let n = s.startQ; n <= s.endQ; n++) if (!btns.includes(n)) need.push(n);
      if (need.length) { problems++; console.log(exam.id, 'sec', s.part, 'missing clickable blanks', need); }
    }
    if (stray) { problems++; console.log(exam.id, 'sec', s.part, 'stray markup', stray); }
    // each targeted question must find its target element in the right paragraph
  }
  for (const q of exam.questions) {
    const h = formatPromptHtml(q.prompt);
    if (/\*\*|\{\{|\}\}/.test(h)) { problems++; console.log(exam.id, 'Q', q.number, 'stray in prompt'); }
  }
}
console.log('problems:', problems);

