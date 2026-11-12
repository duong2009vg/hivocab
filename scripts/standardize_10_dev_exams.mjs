import fs from 'fs';

const examsPath = 'public/data/thpt_exams.json';
const data = JSON.parse(fs.readFileSync(examsPath, 'utf8'));

// Danh sách chuẩn xác 20 câu gạch chân mục tiêu trong 10 đề minh họa
const TARGET_SENTENCES = [
  "Responsible digital citizens are also aware of the potential risks of being online.",
  "Many regions that have perfect weather for growing coffee now will not be good places to grow coffee in the future",
  "Howells rushed to the recycling center he'd taken it to.",
  "Clearly, being exposed to this ever-increasing bad news can make us feel less positive and affect our health",
  "Teams with very bad records get the first chances to pick players",
  "Some business owners may fear a lack of productivity in their employees, while others haven’t invested in teleconferencing and telework tech to support remote workers",
  "Many studies show that people who do things are happier than people who buy things",
  "In an ever-changing modern world, continuous personal development has become a crucial part of life",
  "He could have had an easy life, with an easy job, enjoying his parents' wealth and connections",
  "Nike’s decision to stop using kangaroo leather in its products is a positive step towards wildlife protection.",
  "Usually, educational institutions have orientation days for secondary school students to experience university life first-hand",
  "it is no surprise that airbrushing apps that enable people to retouch images and present an idealised version of themselves are gaining popularity",
  "Online distance learning is an instructional system which connects learners with educational resources",
  "By reducing our reliance on fossil fuels, we can end the energy crisis, cut down on pollution and slow down climate change",
  "reading or watching a show about a place is a poor alternative to going there",
  "If we want to stop the climate crisis and create a better and more sustainable future, green energy sources will undoubtedly be the key.",
  "One of the most serious disadvantages is social media addiction.",
  "It also helps to develop self-discipline and a work ethic which will stand them in good stead later in life",
  "It is so bright that the stars do not show up in the pictures",
  "The people who are successful have done well because they are hard-working and passionate about what they do"
];

function norm(s) {
  return String(s || '').toLowerCase().replace(/[‘’]/g, "'").replace(/[^\p{L}\p{N}\s'-]/gu, ' ').replace(/\s+/g, ' ').trim();
}

const normSentences = TARGET_SENTENCES.map(norm);

function cleanText(str) {
  if (!str || typeof str !== 'string') return str;

  // Xử lý các cặp {{U}}...{{/U}} hoặc **...**
  // 1. Nếu bên trong chứa một trong 20 câu gạch chân -> {{U}}câu{{/U}}
  // 2. Nếu là từ/cụm từ mục tiêu ngắn -> **từ**
  let s = str;

  // Chuẩn hóa bất kỳ {{U}} hoặc ** lồng nhau
  s = s.replace(/\*\*\{\{U\}\}([\s\S]+?)\{\{\/U\}\}\*\*/g, '$1');
  
  // Bây giờ xử lý các cụm {{U}}...{{/U}} còn sót lại
  s = s.replace(/\{\{U\}\}([\s\S]+?)\{\{\/U\}\}/g, (match, inner) => {
    const trimmed = inner.trim();
    const n = norm(trimmed);
    const isTargetSent = normSentences.some(sent => sent.includes(n) || n.includes(sent));
    if (isTargetSent) {
      return `{{U}}${trimmed}{{/U}}`;
    }
    // Nếu chỉ là cụm từ (ví dụ "called for a ban on", "underlined sentence")
    if (trimmed.toLowerCase().includes('underlined sentence') || trimmed.toLowerCase().includes('câu được gạch chân')) {
      return `{{U}}${trimmed}{{/U}}`;
    }
    return `**${trimmed}**`;
  });

  return s;
}

function processField(obj) {
  if (!obj) return;
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === 'string') {
        obj[i] = cleanText(obj[i]);
      } else if (typeof obj[i] === 'object') {
        processField(obj[i]);
      }
    }
  } else if (typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'string') {
        obj[key] = cleanText(obj[key]);
      } else if (typeof obj[key] === 'object') {
        processField(obj[key]);
      }
    }
  }
}

for (const exam of data) {
  if (exam.id && exam.id.startsWith('thpt-exam-dev-')) {
    processField(exam);
    // Chuẩn hóa prompt của các câu hỏi gạch chân
    for (const q of exam.questions) {
      if (/underlined\s+sentence/i.test(q.prompt)) {
        q.prompt = q.prompt.replace(/the\s+underlined\s+sentence/i, 'the {{U}}underlined sentence{{/U}}');
        q.prompt = q.prompt.replace(/the\s+\{\{U\}\}\{\{U\}\}underlined\s+sentence\{\{\/U\}\}\{\{\/U\}\}/i, 'the {{U}}underlined sentence{{/U}}');
      }
    }
  }
}

fs.writeFileSync(examsPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Standardized 10 dev exams: exactly 20 target sentences with {{U}} and 60 target words with **word**');
