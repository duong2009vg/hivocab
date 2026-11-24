// src/services/dictionaryService.js
// Dịch vụ tra cứu từ điển: Tra cứu dữ liệu từ Supabase (70.000 từ) & Điền từ vựng tự động bằng DeepSeek AI API
import { supabase } from '../lib/supabaseClient.js';
import { HiAudio } from './audioService.js';

const RECENT_KEY = 'hi_dict_recent_searches';
const memoryCache = new Map();

function cleanMeaning(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw.replace(/^(\([a-zA-Z\s]+\)|\[[a-zA-Z\s]+\])\s*/, '').trim();
}

function extractPos(rawPos, rawMeaning) {
  if (rawPos && typeof rawPos === 'string' && rawPos.trim()) return rawPos.trim().toLowerCase();
  if (!rawMeaning || typeof rawMeaning !== 'string') return 'từ vựng';
  const m = rawMeaning.match(/^\(([a-zA-Z\s]+)\)/);
  if (m && m[1]) {
    const tag = m[1].toLowerCase().trim();
    if (tag === 'v') return 'verb';
    if (tag === 'n') return 'noun';
    if (tag === 'adj') return 'adjective';
    if (tag === 'adv') return 'adverb';
    if (tag === 'prep') return 'preposition';
    if (tag === 'conj') return 'conjunction';
    return tag;
  }
  return 'từ vựng';
}

export function getRecentSearches() {
  if (typeof localStorage === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch (_) {
    return [];
  }
}

export function addRecentSearch(word) {
  if (!word || typeof localStorage === 'undefined') return;
  const clean = word.trim();
  if (!clean) return;
  try {
    const current = getRecentSearches().filter((w) => w.toLowerCase() !== clean.toLowerCase());
    current.unshift(clean);
    localStorage.setItem(RECENT_KEY, JSON.stringify(current.slice(0, 15)));
  } catch (_) {}
}

export function removeRecentSearch(word) {
  if (!word || typeof localStorage === 'undefined') return;
  try {
    const current = getRecentSearches().filter((w) => w.toLowerCase() !== word.toLowerCase());
    localStorage.setItem(RECENT_KEY, JSON.stringify(current));
  } catch (_) {}
}

export function clearRecentSearches() {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch (_) {}
}

export function playWordAudio(word, rate = 0.9, lang = 'en') {
  if (!word || typeof window === 'undefined') return;
  try {
    return HiAudio.playWord(word, rate, lang);
  } catch (err) {
    console.warn('[dictionaryService] Audio error:', err);
  }
}

async function getApiAuthHeaders() {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : null;
  } catch {
    return null;
  }
}

/**
 * Tra cứu từ điển: Lấy dữ liệu trực tiếp từ Supabase Database (70.000 từ vựng tiếng Việt)
 * Nếu từ không có trong DB thì fallback sang DeepSeek AI (/api/dictionary hoặc /api/ai-lookup)
 */
export async function lookupWord(rawWord) {
  if (!rawWord || !rawWord.trim()) return null;
  const cleanWord = rawWord.trim();
  const cacheKey = cleanWord.toLowerCase();

  // 1. Kiểm tra Memory Cache
  if (memoryCache.has(cacheKey)) {
    const cached = memoryCache.get(cacheKey);
    addRecentSearch(cached.word || cleanWord);
    return cached;
  }

  // 2. Tra cứu trực tiếp trong Supabase Database (~70.000 từ vựng có sẵn nghĩa tiếng Việt)
  try {
    let dbWords = null;
    let dbErr = null;
    const rpcRes = await supabase.rpc('lookup_dictionary_word_v2', { p_word: cleanWord });
    if (!rpcRes.error && Array.isArray(rpcRes.data)) {
      dbWords = rpcRes.data;
    } else if (rpcRes.error) {
      const tableRes = await supabase
        .from('words')
        .select('id, word, meaning, english_meaning, pos, phonetic, example_sentence')
        .ilike('word', cleanWord)
        .limit(6);
      dbWords = tableRes.data;
      dbErr = tableRes.error;
    }

    if (!dbErr && Array.isArray(dbWords) && dbWords.length > 0) {
      const main = dbWords.find((w) => w.english_meaning && w.phonetic && w.example_sentence)
        || dbWords.find((w) => w.phonetic && w.example_sentence)
        || dbWords[0];
      const phonetic = main.phonetic || dbWords.find((w) => w.phonetic)?.phonetic || '';
      const pos = extractPos(main.pos, main.meaning);
      const meaning = cleanMeaning(main.meaning);
      const englishMeaning = main.english_meaning || dbWords.find((w) => w.english_meaning)?.english_meaning || '';
      const example = main.example_sentence || dbWords.find((w) => w.example_sentence)?.example_sentence || '';

      // Xây dựng danh sách entries cho các nét nghĩa khác nhau trong DB
      const entries = [];
      const seen = new Set();
      for (const item of dbWords) {
        const cMean = cleanMeaning(item.meaning);
        const cEnMean = String(item.english_meaning || '').trim();
        if (cMean && !seen.has(`${cMean.toLowerCase()}::${cEnMean.toLowerCase()}`)) {
          seen.add(`${cMean.toLowerCase()}::${cEnMean.toLowerCase()}`);
          entries.push({
            meaning: cMean,
            english_meaning: cEnMean,
            pos: extractPos(item.pos, item.meaning),
            example: item.example_sentence || '',
            example_vi: '',
          });
        }
      }

      const result = {
        word: main.word || cleanWord,
        phonetic,
        pos,
        meaning,
        english_meaning: englishMeaning,
        example,
        example_vi: '',
        entries: entries.length > 0 ? entries : [{ meaning, english_meaning: englishMeaning, pos, example, example_vi: '' }],
        source: 'database',
        viSummary: meaning,
        senses: entries.map((e, idx) => ({
          id: idx + 1,
          grammar: e.pos ? `[ ${e.pos} ]` : '',
          definition_vi: e.meaning,
          definition_en: e.english_meaning || '',
          examples: e.example ? [{ en: e.example, vi: '' }] : [],
        })),
      };

      memoryCache.set(cacheKey, result);
      addRecentSearch(result.word);
      return result;
    }
  } catch (err) {
    console.warn('[dictionaryService] Supabase lookup error:', err);
  }

  // 3. Fallback: Nếu không có trong Supabase Database -> Tra qua DeepSeek AI (yêu cầu đăng nhập)
  const authHeaders = await getApiAuthHeaders();
  if (!authHeaders) {
    throw new Error(`Từ "${cleanWord}" chưa có trong kho từ điển có sẵn. Vui lòng đăng nhập để tra cứu bằng DeepSeek AI.`);
  }

  let aiErrorMessage = '';
  try {
    const cfRes = await fetch('/api/dictionary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ word: cleanWord }),
    });
    if (cfRes.ok) {
      const cfJson = await cfRes.json();
      if (cfJson.ok && cfJson.data) {
        const d = cfJson.data;
        const fallbackPos = d.pos || 'từ vựng';
        const fallbackMeaning = d.meaning || d.viSummary || '';
        const fallbackEnglishMeaning = d.english_meaning || d.englishMeaning || d.entries?.[0]?.english_meaning || '';
        const fallbackExample = d.example || '';
        const fallbackExampleVi = d.example_vi || '';
        const entries =
          Array.isArray(d.entries) && d.entries.length > 0
            ? d.entries
            : fallbackMeaning
              ? [{ meaning: fallbackMeaning, english_meaning: fallbackEnglishMeaning, pos: fallbackPos, example: fallbackExample, example_vi: fallbackExampleVi }]
              : [];
        const senses =
          Array.isArray(d.senses) && d.senses.length > 0
            ? d.senses
            : entries.map((e, idx) => ({
                id: idx + 1,
                grammar: e.pos ? `[ ${e.pos} ]` : '',
                definition_vi: e.meaning,
                definition_en: e.english_meaning || '',
                examples: e.example ? [{ en: e.example, vi: e.example_vi || '' }] : [],
              }));
        const result = {
          word: d.word || cleanWord,
          phonetic: d.phonetic || '',
          pos: fallbackPos,
          ...(d.cefr ? { cefr: d.cefr } : {}),
          meaning: fallbackMeaning,
          english_meaning: fallbackEnglishMeaning,
          example: fallbackExample,
          example_vi: fallbackExampleVi,
          entries,
          source: 'deepseek_ai',
          viSummary: fallbackMeaning,
          senses,
        };
        memoryCache.set(cacheKey, result);
        addRecentSearch(result.word);
        return result;
      }
      if (cfJson.error) aiErrorMessage = cfJson.error;
    } else {
      try {
        const errJson = await cfRes.json();
        if (errJson?.error) aiErrorMessage = errJson.error;
      } catch (_) {}
    }
  } catch (_) {}

  // 4. Dự phòng tiếp qua /api/ai-lookup (DeepSeek AI)
  try {
    const aiRes = await fetch('/api/ai-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ word: cleanWord }),
    });
    if (aiRes.ok) {
      const aiJson = await aiRes.json();
      if (aiJson.ok && (aiJson.meaning || aiJson.phonetic)) {
        const fallbackPos = aiJson.pos || 'từ vựng';
        const fallbackMeaning = aiJson.meaning || '';
        const fallbackEnglishMeaning = aiJson.english_meaning || aiJson.data?.english_meaning || '';
        const fallbackExample = aiJson.example || '';
        const entries = fallbackMeaning
          ? [{ meaning: fallbackMeaning, english_meaning: fallbackEnglishMeaning, pos: fallbackPos, example: fallbackExample, example_vi: '' }]
          : [];
        const result = {
          word: cleanWord,
          phonetic: aiJson.phonetic || '',
          pos: fallbackPos,
          meaning: fallbackMeaning,
          english_meaning: fallbackEnglishMeaning,
          example: fallbackExample,
          example_vi: '',
          entries,
          source: 'deepseek_ai',
          viSummary: fallbackMeaning,
          senses: entries.map((e, idx) => ({
            id: idx + 1,
            grammar: e.pos ? `[ ${e.pos} ]` : '',
            definition_vi: e.meaning,
            definition_en: e.english_meaning || '',
            examples: e.example ? [{ en: e.example, vi: '' }] : [],
          })),
        };
        memoryCache.set(cacheKey, result);
        addRecentSearch(result.word);
        return result;
      }
    }
  } catch (_) {}

  if (aiErrorMessage) {
    throw new Error(aiErrorMessage);
  }
  return null;
}

/**
 * Điền tự động thông tin từ vựng bằng DeepSeek AI API (/api/ai-lookup)
 */
export async function autofillWordWithAI(rawWord) {
  if (!rawWord || !rawWord.trim()) return null;
  const cleanWord = rawWord.trim();

  // 1. Gọi trực tiếp DeepSeek AI API (/api/ai-lookup) nếu có phiên đăng nhập
  const authHeaders = await getApiAuthHeaders();
  if (authHeaders) {
    try {
      const res = await fetch('/api/ai-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ word: cleanWord }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.ok) {
          return {
            word: cleanWord,
            phonetic: data.phonetic || data.data?.phonetic || '',
            meaning: data.meaning || data.data?.meaning || '',
            english_meaning: data.english_meaning || data.data?.english_meaning || '',
            englishMeaning: data.english_meaning || data.data?.english_meaning || '',
            example: data.example || data.data?.example || '',
            pos: data.pos || data.data?.pos || 'từ vựng',
            source: 'deepseek_ai',
          };
        }
      }
    } catch (err) {
      console.warn('[autofillWordWithAI] DeepSeek API error:', err);
    }
  }

  // 2. Dự phòng: Lấy dữ liệu từ Supabase database nếu DeepSeek AI offline
  const dbEntry = await lookupWord(cleanWord);
  if (dbEntry) {
    return {
      word: dbEntry.word || cleanWord,
      phonetic: dbEntry.phonetic || '',
      meaning: dbEntry.meaning || '',
      english_meaning: dbEntry.english_meaning || '',
      englishMeaning: dbEntry.english_meaning || '',
      example: dbEntry.example || '',
      pos: dbEntry.pos || 'từ vựng',
      source: 'database',
    };
  }

  return null;
}

// Gắn vào window.HiDict cho tương thích ngược
if (typeof window !== 'undefined') {
  window.HiDict = {
    lookupWord,
    autofillWordWithAI,
    getRecentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
    playWordAudio,
  };
}

export default {
  lookupWord,
  autofillWordWithAI,
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  playWordAudio,
};
