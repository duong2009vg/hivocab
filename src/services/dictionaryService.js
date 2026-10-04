// src/services/dictionaryService.js
// Dịch vụ tra cứu từ điển đa tầng - Pure React & Supabase + Free Dictionary API Fallback
import { supabase } from '../lib/supabaseClient.js';

const RECENT_KEY = 'hi_dict_recent_searches';
const CACHE_KEY = 'hi_dict_cache_v2';
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

export function playWordAudio(word) {
  if (!word || typeof window === 'undefined') return;
  try {
    if (window.speechSynthesis) {
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(word);
      utter.lang = 'en-US';
      utter.rate = 0.9;
      window.speechSynthesis.speak(utter);
    }
  } catch (err) {
    console.warn('[dictionaryService] Audio error:', err);
  }
}

/**
 * Tra cứu từ vựng đa tầng
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

  // 2. Tra cứu trong Supabase Words Database (~70.000 từ có sẵn nghĩa tiếng Việt)
  try {
    const { data: dbWords, error: dbErr } = await supabase
      .from('words')
      .select('id, word, meaning, pos, phonetic, example_sentence')
      .ilike('word', cleanWord)
      .limit(6);

    if (!dbErr && Array.isArray(dbWords) && dbWords.length > 0) {
      const main = dbWords.find((w) => w.phonetic && w.example_sentence) || dbWords[0];
      let phonetic = main.phonetic || dbWords.find((w) => w.phonetic)?.phonetic || '';
      let pos = extractPos(main.pos, main.meaning);
      const meaning = cleanMeaning(main.meaning);
      let example = main.example_sentence || dbWords.find((w) => w.example_sentence)?.example_sentence || '';

      // Nếu chưa có phiên âm IPA trong DB, thử lấy nhanh từ Free Dictionary API
      if (!phonetic) {
        try {
          const apiRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`);
          if (apiRes.ok) {
            const apiData = await apiRes.json();
            const first = apiData?.[0];
            if (first) {
              phonetic = first.phonetic || first.phonetics?.find((p) => p.text)?.text || '';
              if (!pos && first.meanings?.[0]?.partOfSpeech) {
                pos = first.meanings[0].partOfSpeech;
              }
              if (!example && first.meanings?.[0]?.definitions?.[0]?.example) {
                example = first.meanings[0].definitions[0].example;
              }
            }
          }
        } catch (_) {}
      }

      // Xây dựng danh sách entries cho các nét nghĩa
      const entries = [];
      const seen = new Set();
      for (const item of dbWords) {
        const cMean = cleanMeaning(item.meaning);
        if (cMean && !seen.has(cMean.toLowerCase())) {
          seen.add(cMean.toLowerCase());
          entries.push({
            meaning: cMean,
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
        example,
        example_vi: '',
        entries: entries.length > 0 ? entries : [{ meaning, pos, example, example_vi: '' }],
        source: 'database',
      };

      memoryCache.set(cacheKey, result);
      addRecentSearch(result.word);
      return result;
    }
  } catch (err) {
    console.warn('[dictionaryService] Supabase lookup error:', err);
  }

  // 3. Fallback: Free Dictionary API + Backend AI Dictionary API
  try {
    const apiRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`);
    if (apiRes.ok) {
      const apiData = await apiRes.json();
      const first = apiData?.[0];
      if (first) {
        const phonetic = first.phonetic || first.phonetics?.find((p) => p.text)?.text || '';
        const firstMeaning = first.meanings?.[0];
        const pos = firstMeaning?.partOfSpeech || 'từ vựng';
        const def = firstMeaning?.definitions?.[0];
        const example = def?.example || '';
        let meaningVi = '';

        // Thử lấy bản dịch tiếng Việt từ backend /api/ai-lookup hoặc /api/dictionary
        try {
          const aiRes = await fetch('/api/ai-lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ word: cleanWord }),
          });
          if (aiRes.ok) {
            const aiJson = await aiRes.json();
            if (aiJson.ok && aiJson.meaning) {
              meaningVi = aiJson.meaning;
            }
          }
        } catch (_) {}

        if (!meaningVi && def?.definition) {
          meaningVi = def.definition;
        }

        const entries = (first.meanings || []).slice(0, 3).map((m) => ({
          meaning: meaningVi || m.definitions?.[0]?.definition || '',
          pos: m.partOfSpeech || pos,
          example: m.definitions?.[0]?.example || '',
          example_vi: '',
        }));

        const result = {
          word: first.word || cleanWord,
          phonetic,
          pos,
          meaning: meaningVi,
          example,
          example_vi: '',
          entries: entries.length > 0 ? entries : [{ meaning: meaningVi, pos, example, example_vi: '' }],
          source: 'api',
        };

        memoryCache.set(cacheKey, result);
        addRecentSearch(result.word);
        return result;
      }
    }
  } catch (err) {
    console.warn('[dictionaryService] External API lookup error:', err);
  }

  // 4. Thử tra trực tiếp qua /api/dictionary (Cloudflare Pages Functions)
  try {
    const cfRes = await fetch('/api/dictionary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: cleanWord }),
    });
    if (cfRes.ok) {
      const cfJson = await cfRes.json();
      if (cfJson.ok && cfJson.data) {
        const d = cfJson.data;
        const result = {
          word: d.word || cleanWord,
          phonetic: d.phonetic || '',
          pos: d.pos || 'từ vựng',
          meaning: d.meaning || d.viSummary || '',
          example: d.example || '',
          example_vi: d.example_vi || '',
          entries: d.entries || [{ meaning: d.meaning || '', pos: d.pos || 'từ vựng', example: d.example || '', example_vi: '' }],
          source: 'cloudflare_api',
        };
        memoryCache.set(cacheKey, result);
        addRecentSearch(result.word);
        return result;
      }
    }
  } catch (_) {}

  return null;
}

// Gắn vào window.HiDict cho tương thích ngược
if (typeof window !== 'undefined') {
  window.HiDict = {
    lookupWord,
    getRecentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
    playWordAudio,
  };
}

export default {
  lookupWord,
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  playWordAudio,
};
