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
  if (!p?.expected || typeof p.heard !== 'string' || !p.heard.trim()) return null;
  if (String(p.expected).normalize('NFC').trim() === String(p.heard).normalize('NFC').trim()) {
    return 'good';
  }
  const c = Number(p.confidence);
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
    const expPhones =
      Array.isArray(expectedPhones[idx]) && expectedPhones[idx].length
        ? expectedPhones[idx]
        : aligned?.expected || [];
    let report = null;
    if (hasVoice && heardPhones.length) {
      if (aligned?.phones?.length) {
        report = { phones: aligned.phones };
      } else if (err) {
        report = { ...err, flagged: true };
      }
    }
    const plan = buildWordHighlightPlan(word, report, expPhones);
    const hasIssue = Boolean(
      aligned?.phones?.some((p) => {
        const s = getPhonemeSeverity(p);
        return s === 'bad' || s === 'near';
      }) || err
    );
    return {
      index: idx,
      word,
      expectedPhones: expPhones,
      actualPhones: aligned?.actual || err?.actual || [],
      phones: aligned?.phones || [],
      error: err || null,
      acceptedVariant: aligned?.acceptedVariant || false,
      hasIssue,
      ...plan,
    };
  });

  const mismatchedCount = wordViews.filter((w) => w.hasIssue).length;

  return {
    score: Math.max(0, Math.min(100, Number(data.score))),
    target: String(target || ''),
    transcription,
    hasVoice,
    mismatchedCount,
    wordViews,
    expectedPhones,
    heardPhones,
    prosody: data.prosody || {},
    phonemeErrorRate: diff.phoneme_error_rate,
    wordErrorRate: diff.word_error_rate,
  };
}
