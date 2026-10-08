// src/hooks/useDictionary.js
// Reactive hook for Dictionary search, suggestions, recent lookups, and audio
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { useModal } from '../context/ModalContext.jsx';
import { useAuth } from '../providers/AuthProvider.jsx';
import {
  lookupWord,
  getRecentSearches,
  removeRecentSearch,
  clearRecentSearches,
} from '../services/dictionaryService.js';
import { playWordAudio } from '../services/audioService.js';

const SB_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3ZWhkdHJxanlrbG1zZWZramRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTc4MDcsImV4cCI6MjA5Mzk3MzgwN30.dXRhEmvS8J21aJ3dwZ4jHaWuKbhNw2yys90YTIop2EU';
const SB_URL = 'https://swehdtrqjyklmsefkjdf.supabase.co/rest/v1/words';

const suggestCache = new Map();

export function useDictionary() {
  const { openModal } = useModal();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('empty'); // 'empty' | 'loading' | 'result' | 'error'
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestIdx, setActiveSuggestIdx] = useState(-1);

  const debounceTimerRef = useRef(null);

  // Sync recent searches from dictionaryService on mount
  const refreshRecent = useCallback(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  useEffect(() => {
    refreshRecent();
  }, [refreshRecent]);

  // Fetch autocomplete suggestions
  const fetchSuggestions = useCallback(async (q) => {
    if (!q || q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const cleanQ = q.toLowerCase().trim();
    if (suggestCache.has(cleanQ)) {
      const cached = suggestCache.get(cleanQ);
      setSuggestions(cached);
      setShowSuggestions(cached.length > 0);
      return;
    }

    try {
      let list = [];
      const { data, error } = await supabase
        .from('words')
        .select('word, meaning, pos')
        .ilike('word', `${cleanQ}%`)
        .order('word')
        .limit(8);

      if (!error && Array.isArray(data)) {
        list = data;
      }

      if (list.length === 0) {
        const res = await fetch(
          `${SB_URL}?word=ilike.${encodeURIComponent(cleanQ)}%25&select=word,meaning,pos&order=word&limit=8`,
          {
            headers: {
              apikey: SB_ANON_KEY,
              Authorization: `Bearer ${SB_ANON_KEY}`,
            },
          }
        );
        if (res.ok) {
          list = await res.json();
        }
      }

      const seen = new Set();
      const uniqueList = [];
      for (const item of list) {
        const wLower = (item.word || '').toLowerCase();
        if (wLower && !seen.has(wLower)) {
          seen.add(wLower);
          uniqueList.push(item);
        }
      }

      suggestCache.set(cleanQ, uniqueList);
      setSuggestions(uniqueList);
      setShowSuggestions(uniqueList.length > 0);
    } catch (err) {
      console.warn('[useDictionary] fetchSuggestions error:', err);
      setShowSuggestions(false);
    }
  }, []);

  const handleInputChange = useCallback(
    (val) => {
      setQuery(val);
      setActiveSuggestIdx(-1);
      clearTimeout(debounceTimerRef.current);
      if (!val || !val.trim()) {
        setShowSuggestions(false);
        setSuggestions([]);
        return;
      }
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(val.trim());
      }, 200);
    },
    [fetchSuggestions]
  );

  const searchWord = useCallback(
    async (wordToSearch) => {
      const term = (wordToSearch !== undefined ? wordToSearch : query).trim();
      if (!term) return;

      setShowSuggestions(false);
      setQuery(term);
      setStatus('loading');
      setErrorMessage('');

      try {
        const entry = await lookupWord(term);

        if (entry && entry.word) {
          setResult(entry);
          setStatus('result');
          if (typeof window !== 'undefined') {
            window._dictCurrentResult = entry;
          }
          refreshRecent();
        } else {
          setStatus('error');
          setErrorMessage(`Không thể tìm thấy thông tin cho từ "${term}". Vui lòng kiểm tra lại chính tả hoặc thử từ khác.`);
        }
      } catch (err) {
        console.error('[useDictionary] search error:', err);
        setStatus('error');
        setErrorMessage(err.message || 'Đã xảy ra lỗi trong quá trình tra từ điển.');
      }
    },
    [query, refreshRecent]
  );

  const clearInput = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setStatus('empty');
    setResult(null);
    setErrorMessage('');
  }, []);

  const removeRecent = useCallback((w) => {
    removeRecentSearch(w);
    setRecentSearches(getRecentSearches());
  }, []);

  const clearRecent = useCallback(() => {
    clearRecentSearches();
    setRecentSearches([]);
  }, []);

  const playAudio = useCallback((w, lang = 'en') => {
    const wordToPlay = w || (result && result.word);
    if (!wordToPlay) return;
    playWordAudio(wordToPlay, 0.9, lang);
  }, [result]);

  const copyWord = useCallback(async (w) => {
    const wordToCopy = w || (result && result.word);
    if (!wordToCopy) return;
    try {
      await navigator.clipboard.writeText(wordToCopy);
      if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
        window.showToast(`Đã sao chép "${wordToCopy}"`, 'success');
      }
    } catch (_) {
      // Fallback
    }
  }, [result]);

  const openSaveModal = useCallback((senseIdx = null) => {
    if (!user) {
      openModal('requireLogin', {
        title: 'Đăng nhập để lưu từ vựng 🐾',
        message: 'Bạn cần đăng nhập để lưu từ vựng vào sổ tay cá nhân và bắt đầu ôn tập theo phương pháp lặp lại ngắt quãng (SRS)!',
        actionName: 'Lưu từ vào sổ tay',
      });
      return;
    }
    if (!result || !result.word) return;
    let wordPayload = { ...result };
    if (typeof senseIdx === 'number' && result.entries?.[senseIdx]) {
      wordPayload = {
        ...result,
        meaning: result.entries[senseIdx].meaning,
        example: result.entries[senseIdx].example,
      };
    }
    openModal('saveWordToTopic', { wordData: wordPayload });
  }, [user, result, openModal]);

  return {
    query,
    setQuery,
    status,
    result,
    errorMessage,
    recentSearches,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    activeSuggestIdx,
    setActiveSuggestIdx,
    handleInputChange,
    searchWord,
    clearInput,
    removeRecent,
    clearRecent,
    playAudio,
    copyWord,
    openSaveModal,
  };
}

export default useDictionary;
