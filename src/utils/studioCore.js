// src/utils/studioCore.js
// Cloned & adapted core algorithms from PeakFour_FullSource:
// - Dictation word-level Levenshtein alignment & scoring
// - Dictation sentence segmentation & deterministic progress keys
// - Shadowing timeline synchronization & YouTube ID parsing
// - OpenPronounce phoneme-to-grapheme alignment & severity classification

const ABBREVIATION_TITLE_RE = /(?:^|\s)(?:mr|mrs|ms|dr|prof|sr|jr|st)\.$/i;
const INITIAL_RE = /(?:^|\s)[A-Z]\.$/;

export function visibleTokens(value) {
  const source = String(value || '')
    .normalize('NFKC')
    .replace(/[\u2018\u2019\u02bc]/g, "'");
  return Array.from(source.matchAll(/[\p{L}\p{N}]+(?:'[\p{L}\p{N}]+)*/gu), (m) => m[0]);
}

function normalizeToken(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[\u2018\u2019\u02bc]/g, "'")
    .toLocaleLowerCase('en-US');
}

export function tokenizeDictation(value) {
  return visibleTokens(value).map(normalizeToken);
}

/**
 * Word-level minimum edit distance alignment for Dictation.
 * Independent of punctuation and case; retains contractions.
 */
export function compareDictation(expected, submission) {
  const original = visibleTokens(expected);
  const userWords = visibleTokens(submission);
  const reference = original.map(normalizeToken);
  const typed = userWords.map(normalizeToken);
  const n = reference.length;
  const m = typed.length;

  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = reference[i - 1] === typed[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }

  const alignment = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && reference[i - 1] === typed[j - 1] && dp[i][j] === dp[i - 1][j - 1]) {
      alignment.push({ kind: 'correct', expected: original[i - 1], actual: userWords[j - 1] });
      i--;
      j--;
    } else if (
      i > 0 &&
      j > 0 &&
      dp[i][j] === dp[i - 1][j - 1] + 1 &&
      !(i > 1 && reference[i - 2] === typed[j - 1] && dp[i][j] === dp[i - 1][j] + 1) &&
      !(j > 1 && reference[i - 1] === typed[j - 2] && dp[i][j] === dp[i][j - 1] + 1)
    ) {
      alignment.push({ kind: 'wrong', expected: original[i - 1], actual: userWords[j - 1] });
      i--;
      j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      alignment.push({ kind: 'missing', expected: original[i - 1], actual: null });
      i--;
    } else if (j > 0 && dp[i][j] === dp[i][j - 1] + 1) {
      alignment.push({ kind: 'extra', expected: null, actual: userWords[j - 1] });
      j--;
    } else if (i > 0 && j > 0) {
      alignment.push({ kind: 'wrong', expected: original[i - 1], actual: userWords[j - 1] });
      i--;
      j--;
    } else if (i > 0) {
      alignment.push({ kind: 'missing', expected: original[i - 1], actual: null });
      i--;
    } else {
      alignment.push({ kind: 'extra', expected: null, actual: userWords[j - 1] });
      j--;
    }
  }

  alignment.reverse();
  const counts = { correct: 0, wrong: 0, missing: 0, extra: 0 };
  for (const seg of alignment) {
    counts[seg.kind]++;
  }
  const score = n ? Math.max(0, Math.round(100 * (1 - dp[n][m] / Math.max(n, m, 1)))) : 0;

  return {
    alignment,
    counts,
    score,
    total: n,
    typedCount: m,
    correct: n > 0 && counts.correct === n && counts.extra === 0,
  };
}

export function maskExpectedWord(word) {
  const letters = String(word || '').match(/\p{L}/gu) || [];
  const digits = letters.length ? [] : String(word || '').match(/\p{N}/gu) || [];
  return '*'.repeat(Math.max(1, letters.length || digits.length));
}

export function segmentSentences(value, lang = 'en') {
  const input = String(value || '').trim();
  if (!input) return [];
  let parts = [];
  if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    try {
      parts = [...new Intl.Segmenter(lang, { granularity: 'sentence' }).segment(input)]
        .map((s) => s.segment.trim())
        .filter(Boolean);
    } catch (_) {
      parts = [];
    }
  }
  if (!parts.length) {
    parts = input
      .split(/(?<=[.!?…])\s+(?=[“"'‘(]*[\p{Lu}\p{N}])/u)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (lang === 'en') {
    const merged = [];
    for (const part of parts) {
      if (
        merged.length &&
        (ABBREVIATION_TITLE_RE.test(merged[merged.length - 1]) ||
          INITIAL_RE.test(merged[merged.length - 1]))
      ) {
        merged[merged.length - 1] += ' ' + part;
      } else {
        merged.push(part);
      }
    }
    parts = merged;
  }
  return parts;
}

export function textFingerprint(text) {
  let hash = 2166136261;
  for (const ch of String(text || '').normalize('NFC')) {
    hash = Math.imul(hash ^ ch.codePointAt(0), 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

export function expandDictationLesson(lesson) {
  if (!lesson || !Array.isArray(lesson.lines) || lesson._sentenceUnitsVersion === 1) {
    return lesson;
  }
  const expanded = [];
  lesson.lines.forEach((line, originIndex) => {
    const en = segmentSentences(line.text, 'en');
    const vi = segmentSentences(line.vi, 'vi');
    const aligned = vi.length === en.length && vi.length > 0;
    en.forEach((text, partIndex) => {
      const single = en.length === 1;
      expanded.push({
        ...line,
        text,
        vi: single ? line.vi : aligned ? vi[partIndex] : '',
        _originIndex: originIndex,
        _partIndex: partIndex,
        _partCount: en.length,
        _progressKey: single
          ? String(originIndex)
          : `sentence:${originIndex}:${partIndex}:${textFingerprint(text)}`,
        _translationUnaligned: !single && !aligned,
      });
    });
  });
  return {
    ...lesson,
    lines: expanded,
    _originalTurnCount: lesson.lines.length,
    _sentenceUnitsVersion: 1,
  };
}

export function getSentenceProgressKey(lesson, index) {
  const line = lesson?.lines?.[index];
  return line && line._progressKey !== undefined ? line._progressKey : String(index);
}

// --- Shadowing utilities ---

export function extractYoutubeVideoId(input) {
  const raw = String(input || '').trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    if (host === 'youtu.be' || host.endsWith('.youtu.be')) {
      const candidate = url.pathname.replace(/^\/+/, '').split('/')[0];
      if (/^[a-zA-Z0-9_-]{11}$/.test(candidate)) return candidate;
    }
    if (host.includes('youtube.com') || host.includes('youtube-nocookie.com')) {
      const v = url.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      const parts = url.pathname.split('/').filter(Boolean);
      const embedIdx = parts.findIndex((p) => p === 'embed' || p === 'shorts' || p === 'live');
      if (embedIdx >= 0 && parts[embedIdx + 1] && /^[a-zA-Z0-9_-]{11}$/.test(parts[embedIdx + 1])) {
        return parts[embedIdx + 1];
      }
    }
  } catch (_) {
    // Fallback regex for malformed partial strings
    const match = raw.match(/(?:v=|youtu\.be\/|\/embed\/|\/shorts\/)([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];
  }
  return null;
}

export function formatCueTime(seconds) {
  const ms = Math.max(0, Math.round(Number(seconds || 0) * 1000));
  const m = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function resolveActiveCueIndex(localTimeSec, clip, cues) {
  if (!Number.isFinite(localTimeSec) || !clip || !Array.isArray(cues) || !cues.length) {
    return -1;
  }
  const length = Number(clip.end_seconds) - Number(clip.start_seconds);
  if (!Number.isFinite(length) || localTimeSec < 0 || localTimeSec >= length) {
    return -1;
  }
  if (clip.status === 'published' && !clip.personal && !clip.guest && !clip.preview) {
    let low = 0;
    let high = cues.length;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (Number(cues[mid].start) <= localTimeSec) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    return low - 1;
  }
  return cues.findIndex((c) => localTimeSec >= Number(c.start) && localTimeSec < Number(c.end));
}

function normalizeShadowingTokens(text) {
  return String(text || '')
    .normalize('NFKC')
    .toLocaleLowerCase('en')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^\p{L}\p{N}'-]+/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function compareShadowingWords(expected, actual) {
  const a = normalizeShadowingTokens(expected);
  const b = normalizeShadowingTokens(actual);
  const n = a.length;
  const m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? 1 + dp[i + 1][j + 1] : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  let i = 0;
  let j = 0;
  const matched = new Set();
  const extra = [];
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      matched.add(i);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++;
    } else {
      extra.push(b[j]);
      j++;
    }
  }
  while (j < m) extra.push(b[j++]);

  return {
    expected: a,
    matched,
    extra,
    correct: n > 0 && matched.size === n && b.length === n,
    score: n > 0 ? Math.round((matched.size / n) * 100) : 0,
  };
}

// --- OpenPronounce phoneme-to-grapheme alignment engine ---

const wordsOf = (t) => String(t || '').match(/[A-Za-z]+(?:'[A-Za-z]+)*/g) || [];
const normWord = (t) => String(t || '').toLowerCase().replace(/[^a-z']/g, '');
const phoneNorm = (t) =>
  String(t || '')
    .normalize('NFC')
    .replace(/[ˈˌː\s/]/g, '')
    .replace(/ɡ/g, 'g');

export const PHONE_SPELLINGS = Object.freeze({
  ɪ: ['i', 'y'],
  i: ['ee', 'ea', 'ie', 'ei', 'e'],
  'iː': ['ee', 'ea', 'ie', 'ei', 'e'],
  ʊ: ['oo', 'u'],
  u: ['oo', 'ue', 'ew', 'u'],
  'uː': ['oo', 'ue', 'ew', 'u'],
  ɛ: ['ea', 'e'],
  e: ['ea', 'e'],
  æ: ['a'],
  ɑ: ['a', 'o'],
  'ɑː': ['a', 'o'],
  ə: ['a', 'e', 'o', 'u'],
  ʌ: ['u', 'o'],
  ɚ: ['er', 'ir', 'ur', 'or'],
  ɜ: ['er', 'ir', 'ur'],
  ɝ: ['er', 'ir', 'ur'],
  eɪ: ['ay', 'ai', 'ey', 'ei', 'a'],
  aɪ: ['igh', 'ie', 'y', 'i'],
  ɔɪ: ['oy', 'oi'],
  aʊ: ['ow', 'ou'],
  oʊ: ['oa', 'ow', 'oe', 'o'],
  ɔ: ['aw', 'au', 'or', 'o'],
  p: ['p'],
  b: ['b'],
  t: ['t'],
  d: ['d'],
  k: ['ck', 'k', 'c'],
  g: ['g', 'gg'],
  f: ['ph', 'ff', 'f'],
  v: ['v'],
  θ: ['th'],
  ð: ['th'],
  s: ['ss', 's'],
  z: ['zz', 'z', 's'],
  ʃ: ['sh'],
  ʒ: ['s'],
  h: ['h'],
  l: ['ll', 'l'],
  ɹ: ['rr', 'r'],
  r: ['rr', 'r'],
  w: ['w'],
  j: ['y'],
  m: ['mm', 'm'],
  n: ['nn', 'n'],
  ŋ: ['ng'],
  tʃ: ['tch', 'ch'],
  dʒ: ['dge', 'j'],
});

export function getPhonemeSeverity(p) {
  if (!p?.expected) return null;
  const heard = typeof p.heard === 'string' ? p.heard.normalize('NFC').trim() : '';
  const c = Number(p.confidence);
  if (!heard) {
    if (!Number.isFinite(c)) return 'bad';
    if (c >= 0.7) return 'bad';
    if (c >= 0.25) return 'near';
    return 'bad';
  }
  if (String(p.expected).normalize('NFC').trim() === heard) {
    return 'good';
  }
  if (!Number.isFinite(c) || c < 0.25) return null;
  return c >= 0.7 ? 'bad' : 'near';
}

export function locateGrapheme(word, phone, expectedPhones = []) {
  const ph = phoneNorm(phone);
  const list = PHONE_SPELLINGS[ph];
  if (!list || !word || word.includes("'")) return null;
  if (expectedPhones.filter((p) => phoneNorm(p) === ph).length > 1) return null;
  const lower = word.toLowerCase();
  const candidates = [];
  for (const spelling of list) {
    let from = 0;
    let idx;
    while ((idx = lower.indexOf(spelling, from)) !== -1) {
      candidates.push({ start: idx, end: idx + spelling.length });
      from = idx + 1;
    }
  }
  if (!candidates.length) return null;
  const longest = Math.max(...candidates.map((c) => c.end - c.start));
  const longestCandidates = candidates.filter((c) => c.end - c.start === longest);
  return longestCandidates.length === 1 ? longestCandidates[0] : null;
}

export function buildWordHighlightPlan(word, report, expectedPhones = []) {
  if (!report) return { segments: [{ text: word, level: 'neutral', phone: null }], unknown: [] };
  const ranges = [];
  const unknown = [];
  const reports = Array.isArray(report.phones) ? report.phones : [];

  for (const p of reports) {
    const level = getPhonemeSeverity(p);
    if (!level) continue;
    const ipa = String(p.expected);
    let span = null;
    if (
      Number.isInteger(p.grapheme_start) &&
      Number.isInteger(p.grapheme_end) &&
      p.grapheme_start >= 0 &&
      p.grapheme_end <= word.length &&
      p.grapheme_end > p.grapheme_start
    ) {
      span = { start: p.grapheme_start, end: p.grapheme_end };
    } else {
      span = locateGrapheme(word, ipa, expectedPhones);
    }
    if (!span || ranges.some((r) => span.start < r.end && span.end > r.start)) {
      unknown.push({ phone: ipa, heard: p.heard || null, level });
      continue;
    }
    ranges.push({ ...span, phone: ipa, heard: p.heard || null, level });
  }

  ranges.sort((a, b) => a.start - b.start);
  if (!reports.length && report.flagged === true) {
    unknown.push({ phone: '', heard: null, level: 'unknown' });
  }

  const segments = [];
  let cursor = 0;
  for (const r of ranges) {
    if (r.start > cursor) {
      segments.push({ text: word.slice(cursor, r.start), level: 'neutral', phone: null });
    }
    segments.push({
      text: word.slice(r.start, r.end),
      level: r.level,
      phone: r.phone,
      heard: r.heard,
    });
    cursor = r.end;
  }
  if (cursor < word.length) {
    segments.push({ text: word.slice(cursor), level: 'neutral', phone: null });
  }
  return { segments, unknown };
}

export function buildSentencePronunciationView(data, target) {
  if (!data || typeof data !== 'object' || !data.differences || !Number.isFinite(Number(data.score))) {
    return null;
  }
  const diff = data.differences;
  const words = wordsOf(target);
  const errors = new Map();
  const claimed = new Set();

  for (const e of Array.isArray(diff.errors) ? diff.errors : []) {
    if (!e || !e.word) continue;
    let pos =
      Number.isInteger(e.position) &&
      e.position >= 0 &&
      e.position < words.length &&
      normWord(words[e.position]) === normWord(e.word)
        ? e.position
        : -1;
    if (pos < 0) {
      pos = words.findIndex((w, i) => !claimed.has(i) && normWord(w) === normWord(e.word));
    }
    if (pos >= 0) {
      errors.set(pos, e);
      claimed.add(pos);
    }
  }

  const alignments = new Map();
  for (const row of Array.isArray(diff.word_alignments) ? diff.word_alignments : []) {
    if (
      !row ||
      !Number.isInteger(row.position) ||
      row.position < 0 ||
      row.position >= words.length ||
      normWord(words[row.position]) !== normWord(row.word)
    ) {
      continue;
    }
    alignments.set(row.position, {
      actualWord: typeof row.actual_word === 'string' ? row.actual_word.trim() : '',
      expected: Array.isArray(row.expected) ? row.expected.map(String) : [],
      actual: Array.isArray(row.actual) ? row.actual.map(String) : [],
      phones: Array.isArray(row.phones)
        ? row.phones
            .filter((p) => p && p.expected)
            .map((p) => ({
              expected: String(p.expected),
              heard: typeof p.heard === 'string' ? p.heard : null,
              confidence: p.confidence,
              grapheme_start: p.grapheme_start,
              grapheme_end: p.grapheme_end,
            }))
        : [],
      acceptedVariant: row.accepted_variant === true,
    });
  }

  const expectedPhones = Array.isArray(diff.expected_phones) ? diff.expected_phones : [];
  const heardPhones = Array.isArray(diff.heard_phones) ? diff.heard_phones : [];
  const transcription = String(data.transcribe || '');
  const hasVoice = Boolean(transcription.trim() || heardPhones.length > 0);

  const wordViews = words.map((word, idx) => {
    const aligned = alignments.get(idx);
    const err = errors.get(idx);
    const actualWord =
      aligned?.actualWord ||
      (typeof err?.actual_word === 'string' ? err.actual_word.trim() : '') ||
      (typeof err?.actualWord === 'string' ? err.actualWord.trim() : '') ||
      '';
    const expPhones =
      Array.isArray(expectedPhones[idx]) && expectedPhones[idx].length
        ? expectedPhones[idx]
        : aligned?.expected || [];
    let report = null;
    if (hasVoice && (heardPhones.length || aligned?.phones?.length || err)) {
      if (aligned?.phones?.length) {
        report = { phones: aligned.phones };
      } else if (err) {
        report = { ...err, flagged: true };
      }
    }
    const plan = buildWordHighlightPlan(word, report, expPhones);
    const phoneRows = aligned?.phones || [];
    const badPhoneCount = phoneRows.filter((p) => getPhonemeSeverity(p) === 'bad').length;
    const nearPhoneCount = phoneRows.filter((p) => getPhonemeSeverity(p) === 'near').length;
    const hasIssue = Boolean(badPhoneCount > 0 || nearPhoneCount > 0 || err);

    let wordLevel = 'neutral';
    if (hasVoice) {
      if (aligned?.acceptedVariant) {
        wordLevel = 'good';
      } else if (badPhoneCount > 0) {
        wordLevel = 'bad';
      } else if (nearPhoneCount > 0) {
        wordLevel = 'near';
      } else if (err) {
        wordLevel = err.type === 'omitted' || (!actualWord && !phoneRows.length) ? 'bad' : 'near';
      } else if (!heardPhones.length && !aligned) {
        wordLevel = 'bad';
      } else {
        wordLevel = 'good';
      }
    }

    return {
      index: idx,
      word,
      actualWord,
      expectedPhones: expPhones,
      actualPhones: aligned?.actual || err?.actual || [],
      phones: phoneRows,
      error: err || null,
      acceptedVariant: aligned?.acceptedVariant || false,
      hasIssue,
      wordLevel,
      ...plan,
    };
  });

  const mismatchedCount = wordViews.filter((w) => w.hasIssue).length;
  const goodCount = wordViews.filter((w) => w.wordLevel === 'good').length;
  const nearCount = wordViews.filter((w) => w.wordLevel === 'near').length;
  const badCount = wordViews.filter((w) => w.wordLevel === 'bad').length;

  return {
    score: Math.max(0, Math.min(100, Number(data.score))),
    target: String(target || ''),
    transcription,
    hasVoice,
    mismatchedCount,
    goodCount,
    nearCount,
    badCount,
    wordViews,
    expectedPhones,
    heardPhones,
    prosody: data.prosody || {},
    phonemeErrorRate: diff.phoneme_error_rate,
    wordErrorRate: diff.word_error_rate,
    engine: data.engine || 'modal-ai',
  };
}

// --- Zero-credit local browser speech scorer (for instant 0s feedback) ---

const APPROX_GRAPHEME_RULES = [
  ['tch', 'tʃ'],
  ['dge', 'dʒ'],
  ['igh', 'aɪ'],
  ['sh', 'ʃ'],
  ['ch', 'tʃ'],
  ['th', 'θ'],
  ['ph', 'f'],
  ['ng', 'ŋ'],
  ['qu', 'kw'],
  ['ee', 'i'],
  ['ea', 'i'],
  ['oo', 'u'],
  ['ou', 'aʊ'],
  ['ow', 'aʊ'],
  ['ai', 'eɪ'],
  ['ay', 'eɪ'],
  ['oi', 'ɔɪ'],
  ['oy', 'ɔɪ'],
  ['oa', 'oʊ'],
  ['er', 'ɚ'],
  ['ir', 'ɚ'],
  ['ur', 'ɚ'],
  ['or', 'ɔ'],
  ['ar', 'ɑ'],
  ['aw', 'ɔ'],
  ['ck', 'k'],
];

const SINGLE_CHAR_PHONES = {
  a: 'æ',
  b: 'b',
  c: 'k',
  d: 'd',
  e: 'ɛ',
  f: 'f',
  g: 'g',
  h: 'h',
  i: 'ɪ',
  j: 'dʒ',
  k: 'k',
  l: 'l',
  m: 'm',
  n: 'n',
  o: 'ɑ',
  p: 'p',
  q: 'k',
  r: 'ɹ',
  s: 's',
  t: 't',
  u: 'ʌ',
  v: 'v',
  w: 'w',
  x: 'ks',
  y: 'j',
  z: 'z',
};

export function wordToApproxPhones(word) {
  let clean = normWord(word).replace(/'/g, '');
  if (!clean) return [];
  if (clean.length > 3 && clean.endsWith('e') && !clean.endsWith('ee')) {
    clean = clean.slice(0, -1);
  }
  const phones = [];
  let i = 0;
  while (i < clean.length) {
    let matchedRule = null;
    for (const [pat, ipa] of APPROX_GRAPHEME_RULES) {
      if (clean.startsWith(pat, i)) {
        matchedRule = [pat, ipa];
        break;
      }
    }
    if (matchedRule) {
      if (matchedRule[1] === 'kw') {
        phones.push('k', 'w');
      } else {
        phones.push(matchedRule[1]);
      }
      i += matchedRule[0].length;
      continue;
    }
    const ch = clean[i];
    if (i > 0 && ch === clean[i - 1]) {
      i += 1;
      continue;
    }
    if (SINGLE_CHAR_PHONES[ch] === 'ks') {
      phones.push('k', 's');
    } else if (SINGLE_CHAR_PHONES[ch]) {
      phones.push(SINGLE_CHAR_PHONES[ch]);
    }
    i += 1;
  }
  return phones;
}

function charLevenshtein(a, b) {
  const n = a.length;
  const m = b.length;
  if (!n) return m;
  if (!m) return n;
  let prev = Array.from({ length: m + 1 }, (_, j) => j);
  for (let i = 1; i <= n; i++) {
    const curr = [i];
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[m];
}

export function buildLocalPronunciationResult(expectedText, transcriptText) {
  const expectedWords = wordsOf(expectedText);
  const actualWords = wordsOf(transcriptText);
  const expNorm = expectedWords.map(normWord);
  const actNorm = actualWords.map(normWord);

  // Align expected words to actual spoken words using DP (supports substitutions, skips, extras)
  const n = expNorm.length;
  const m = actNorm.length;
  const dp = Array.from({ length: n + 1 }, () => new Float32Array(m + 1));
  const trace = Array.from({ length: n + 1 }, () => new Uint8Array(m + 1)); // 1=diag, 2=up(del), 3=left(ins)

  for (let i = 1; i <= n; i++) {
    dp[i][0] = i;
    trace[i][0] = 2;
  }
  for (let j = 1; j <= m; j++) {
    dp[0][j] = j * 0.7;
    trace[0][j] = 3;
  }

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      let subCost = 1.25;
      if (expNorm[i - 1] === actNorm[j - 1]) {
        subCost = 0;
      } else {
        const dist = charLevenshtein(expNorm[i - 1], actNorm[j - 1]);
        const maxLen = Math.max(expNorm[i - 1].length, actNorm[j - 1].length, 1);
        const ratio = dist / maxLen;
        if (ratio <= 0.6) subCost = ratio;
      }
      const diag = dp[i - 1][j - 1] + subCost;
      const del = dp[i - 1][j] + 1.0;
      const ins = dp[i][j - 1] + 0.7;
      if (diag <= del && diag <= ins) {
        dp[i][j] = diag;
        trace[i][j] = 1;
      } else if (del <= ins) {
        dp[i][j] = del;
        trace[i][j] = 2;
      } else {
        dp[i][j] = ins;
        trace[i][j] = 3;
      }
    }
  }

  const alignedActForExp = new Array(n).fill(null);
  let ci = n;
  let cj = m;
  while (ci > 0 || cj > 0) {
    const move = trace[ci][cj];
    if (move === 1) {
      alignedActForExp[ci - 1] = actualWords[cj - 1];
      ci -= 1;
      cj -= 1;
    } else if (move === 2) {
      ci -= 1;
    } else {
      cj -= 1;
    }
  }

  const expectedPhonesAll = [];
  const heardPhonesFlat = [];
  const wordAlignments = [];
  const errors = [];
  const wordsWithErrors = [];
  let totalPhones = 0;
  let errorPhones = 0;
  let wrongWordCount = 0;

  for (let i = 0; i < n; i++) {
    const word = expectedWords[i];
    const expPhones = wordToApproxPhones(word);
    expectedPhonesAll.push(expPhones);
    totalPhones += Math.max(1, expPhones.length);

    const matchedActual = alignedActForExp[i];
    const isExact = matchedActual && normWord(matchedActual) === expNorm[i];
    const actPhones = matchedActual ? wordToApproxPhones(matchedActual) : [];

    if (matchedActual) {
      heardPhonesFlat.push(...actPhones);
    }

    const phoneRows = expPhones.map((ep, pIdx) => {
      if (isExact) {
        return { expected: ep, heard: ep, confidence: 0 };
      }
      if (!matchedActual) {
        errorPhones += 1;
        return { expected: ep, heard: null, confidence: 0.9 };
      }
      const ap = actPhones[pIdx] || null;
      const dist = charLevenshtein(expNorm[i], normWord(matchedActual));
      const near = ap === ep || dist <= 2;
      if (ap === ep) {
        return { expected: ep, heard: ap, confidence: 0 };
      }
      errorPhones += near ? 0.5 : 1;
      return { expected: ep, heard: ap, confidence: near ? 0.55 : 0.9 };
    });

    if (!isExact) {
      wrongWordCount += 1;
      wordsWithErrors.push(word);
      errors.push({
        type: matchedActual ? 'substituted' : 'omitted',
        position: i,
        word,
        expected: expPhones.join(''),
        actual: actPhones.join(''),
        actual_word: matchedActual || '',
      });
    }

    wordAlignments.push({
      position: i,
      word,
      actual_word: matchedActual || '',
      expected: expPhones,
      actual: actPhones,
      phones: phoneRows,
      accepted_variant: false,
    });
  }

  const wer = n > 0 ? Math.min(1, wrongWordCount / n) : 1;
  const per = totalPhones > 0 ? Math.min(1, errorPhones / totalPhones) : 1;
  const rawScore = actualWords.length === 0 ? 0 : Math.round(Math.max(0, Math.min(100, (1 - 0.55 * wer - 0.45 * per) * 100)));

  return {
    score: rawScore,
    engine: 'local-browser',
    transcribe: String(transcriptText || '').trim(),
    language: 'en',
    differences: {
      errors,
      words_with_errors: wordsWithErrors,
      word_error_rate: Number(wer.toFixed(4)),
      phoneme_error_rate: Number(per.toFixed(4)),
      expected_phones: expectedPhonesAll,
      heard_phones: heardPhonesFlat,
      word_alignments: wordAlignments,
      feedback:
        wordsWithErrors.length === 0 && actualWords.length > 0
          ? 'Chấm nhanh trên trình duyệt: Đọc rõ và khớp từ tốt!'
          : `Cần chú ý các từ: ${wordsWithErrors.join(', ')}`,
    },
    prosody: { f0: [], energy: [] },
  };
}
