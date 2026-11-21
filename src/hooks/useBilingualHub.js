// src/hooks/useBilingualHub.js
// Hook quản lý Thư viện Đọc Song Ngữ 2 Tầng: Tầng 1 (10 tập IELTS Vol 1-10) & Tầng 2 (Bài báo song ngữ)
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getTopics, getCachedTopics, getCamHierarchy, isUserPro as checkPro } from '../services/db.js';
import { getVolBookMeta } from '../data/bilingualVolMeta.js';

const SELECTED_BOOK_STORAGE_KEY = 'hivocab_bilingual_selected_book';
const LAST_READING_STORAGE_KEY = 'hivocab_last_bilingual_reading';

// Cache theo topicId trong phiên để chuyển qua lại giữa các tập sách tức thì
const HUB_HIERARCHY_CACHE = new Map();

function isBilingualBookTopic(topic) {
  if (!topic) return false;
  const category = String(topic.category || '').trim().toLowerCase();
  const name = String(topic.name || '').trim().toLowerCase();
  return (
    category === 'ielts actual tests' ||
    category.includes('actual tests') ||
    name.startsWith('ielts vol')
  );
}

function readStoredBookId() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(SELECTED_BOOK_STORAGE_KEY) || null;
  } catch (_) {
    return null;
  }
}

export function readLastBilingualReading() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LAST_READING_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.passageId ? parsed : null;
  } catch (_) {
    return null;
  }
}

export function saveLastBilingualReading(meta) {
  if (typeof window === 'undefined' || !meta?.passageId) return;
  try {
    window.localStorage.setItem(
      LAST_READING_STORAGE_KEY,
      JSON.stringify({
        passageId: meta.passageId,
        topicId: meta.topicId || null,
        topicName: meta.topicName || 'IELTS Actual Tests',
        testId: meta.testId || null,
        testName: meta.testName || 'Test',
        passageNumber: meta.passageNumber || null,
        title: meta.title || 'Bài đọc song ngữ',
        titleVi: meta.titleVi || null,
        topicLabel: meta.topicLabel || null,
        isNewsArticle: Boolean(meta.isNewsArticle),
        updatedAt: Date.now(),
      })
    );
  } catch (_) {}
}

export function useBilingualHub(enabled = true) {
  const [books, setBooks] = useState(() =>
    (getCachedTopics() || [])
      .filter(isBilingualBookTopic)
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' }))
  );
  const [booksLoading, setBooksLoading] = useState(books.length === 0);

  // 2-tier navigation: 'home' (2 wooden shelves) | 'vol' (clicked Vol tests & passages) | 'news' (bilingual news)
  const [activeShelf, setActiveShelf] = useState('home');
  const [selectedBookId, setSelectedBookId] = useState(() => readStoredBookId());
  const [hierarchy, setHierarchy] = useState(() =>
    selectedBookId && HUB_HIERARCHY_CACHE.has(selectedBookId) ? HUB_HIERARCHY_CACHE.get(selectedBookId) : null
  );
  const [hierarchyLoading, setHierarchyLoading] = useState(false);
  const [hierarchyError, setHierarchyError] = useState(null);
  const [isUserPro, setIsUserPro] = useState(() => (typeof window !== 'undefined' ? Boolean(window._isUserPro) : false));

  const [selectedTestId, setSelectedTestId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'free' | 'with-vocab'
  const [lastReading, setLastReading] = useState(() => readLastBilingualReading());

  // Tier 2: Bilingual News state (lazy loaded)
  const [newsCategories, setNewsCategories] = useState([]);
  const [newsArticles, setNewsArticles] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [selectedNewsCategory, setSelectedNewsCategory] = useState('all');
  const [newsSearchQuery, setNewsSearchQuery] = useState('');

  const refreshLastReading = useCallback(() => {
    setLastReading(readLastBilingualReading());
  }, []);

  // Load IELTS Vol books + user Pro status + lazy-load Bilingual News articles
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function loadBooks() {
      try {
        const [allTopics, pro] = await Promise.all([
          getTopics(),
          checkPro().catch(() => false),
        ]);
        if (cancelled) return;

        setIsUserPro(Boolean(pro));
        const filtered = (Array.isArray(allTopics) ? allTopics : [])
          .filter(isBilingualBookTopic)
          .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' }));

        setBooks(filtered);
        setBooksLoading(false);

        if (filtered.length > 0) {
          setSelectedBookId((prev) => {
            if (prev && filtered.some((b) => b.id === prev)) return prev;
            return filtered[0].id;
          });
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('[useBilingualHub] loadBooks error:', err);
          setBooksLoading(false);
        }
      }
    }

    async function loadNews() {
      try {
        const mod = await import('../data/bilingualNewsIndex.js');
        if (cancelled) return;
        setNewsCategories(mod.BILINGUAL_NEWS_CATEGORIES || []);
        setNewsArticles(mod.BILINGUAL_NEWS_INDEX || []);
        setNewsLoading(false);
      } catch (err) {
        if (!cancelled) {
          console.warn('[useBilingualHub] loadNews error:', err);
          setNewsLoading(false);
        }
      }
    }

    loadBooks();
    loadNews();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  // Persist selectedBookId
  useEffect(() => {
    if (!selectedBookId || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(SELECTED_BOOK_STORAGE_KEY, selectedBookId);
    } catch (_) {}
  }, [selectedBookId]);

  // Load hierarchy ONLY when entering a Vol detail screen (or when selectedBookId changes inside 'vol')
  useEffect(() => {
    if (!enabled || activeShelf !== 'vol' || !selectedBookId) return;
    let cancelled = false;

    setSelectedTestId('all');

    if (HUB_HIERARCHY_CACHE.has(selectedBookId)) {
      setHierarchy(HUB_HIERARCHY_CACHE.get(selectedBookId));
      setHierarchyLoading(false);
      setHierarchyError(null);
      return;
    }

    setHierarchyLoading(true);
    setHierarchyError(null);

    getCamHierarchy(selectedBookId)
      .then((data) => {
        if (cancelled) return;
        const normalized = data || { tests: [], totalWords: 0, learnedWords: 0, progress: 0 };
        HUB_HIERARCHY_CACHE.set(selectedBookId, normalized);
        setHierarchy(normalized);
        setHierarchyLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('[useBilingualHub] getCamHierarchy error:', err);
        setHierarchyError(err?.message || 'Không thể tải danh sách bài đọc.');
        setHierarchyLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, activeShelf, selectedBookId]);

  const openVolBook = useCallback((bookId) => {
    if (!bookId) return;
    setSelectedBookId(bookId);
    setSelectedTestId('all');
    setSearchQuery('');
    setFilterMode('all');
    setActiveShelf('vol');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openNewsShelf = useCallback((categoryId = 'all') => {
    setSelectedNewsCategory(categoryId || 'all');
    setNewsSearchQuery('');
    setActiveShelf('news');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const closeShelfDetail = useCallback(() => {
    setActiveShelf('home');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const selectedBook = useMemo(
    () => books.find((b) => b.id === selectedBookId) || null,
    [books, selectedBookId]
  );

  const selectedBookMeta = useMemo(() => {
    if (!selectedBook) return null;
    const idx = books.findIndex((b) => b.id === selectedBook.id);
    return getVolBookMeta(selectedBook, Math.max(0, idx));
  }, [selectedBook, books]);

  const tests = useMemo(() => {
    const raw = Array.isArray(hierarchy?.tests) ? hierarchy.tests : [];
    return raw.filter((t) => Array.isArray(t.passages) && t.passages.length > 0);
  }, [hierarchy]);

  const filteredTests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return tests
      .filter((t) => selectedTestId === 'all' || t.id === selectedTestId)
      .map((t) => {
        const passages = (t.passages || []).filter((p) => {
          const isLocked = Boolean(p.isPro || t.isPro || selectedBook?.is_pro) && !isUserPro;
          if (filterMode === 'free' && isLocked) return false;
          if (filterMode === 'with-vocab' && !(p.totalWords > 0)) return false;

          if (!q) return true;
          const haystack = `${p.title || ''} ${p.titleVi || ''} ${p.topicLabel || ''} ${t.name || ''} passage ${p.passageNumber || ''}`.toLowerCase();
          return haystack.includes(q);
        });

        return { ...t, passages };
      })
      .filter((t) => t.passages.length > 0);
  }, [tests, selectedTestId, searchQuery, filterMode, selectedBook, isUserPro]);

  const bookStats = useMemo(() => {
    let totalPassages = 0;
    let freePassages = 0;
    let totalWords = 0;
    let learnedWords = 0;

    for (const t of tests) {
      for (const p of t.passages || []) {
        totalPassages += 1;
        const pIsPro = Boolean(p.isPro || t.isPro || selectedBook?.is_pro);
        if (!pIsPro || isUserPro) freePassages += 1;
        totalWords += p.totalWords || 0;
        learnedWords += p.learnedWords || 0;
      }
    }

    return { totalPassages, freePassages, totalWords, learnedWords };
  }, [tests, selectedBook, isUserPro]);

  const filteredNewsArticles = useMemo(() => {
    const q = newsSearchQuery.trim().toLowerCase();
    return newsArticles.filter((a) => {
      if (selectedNewsCategory !== 'all' && a.categoryId !== selectedNewsCategory) return false;
      if (!q) return true;
      const hay = `${a.title || ''} ${a.titleVi || ''} ${a.topicLabel || ''} bài ${a.index}`.toLowerCase();
      return hay.includes(q);
    });
  }, [newsArticles, selectedNewsCategory, newsSearchQuery]);

  const newsCategoryCounts = useMemo(() => {
    const counts = { all: newsArticles.length };
    for (const a of newsArticles) {
      counts[a.categoryId] = (counts[a.categoryId] || 0) + 1;
    }
    return counts;
  }, [newsArticles]);

  return {
    activeShelf,
    openVolBook,
    openNewsShelf,
    closeShelfDetail,
    books,
    booksLoading,
    selectedBook,
    selectedBookMeta,
    selectedBookId,
    setSelectedBookId,
    hierarchy,
    hierarchyLoading,
    hierarchyError,
    isUserPro,
    tests,
    filteredTests,
    selectedTestId,
    setSelectedTestId,
    searchQuery,
    setSearchQuery,
    filterMode,
    setFilterMode,
    bookStats,
    lastReading,
    refreshLastReading,
    // Tier 2 News
    newsCategories,
    newsArticles,
    newsLoading,
    selectedNewsCategory,
    setSelectedNewsCategory,
    newsSearchQuery,
    setNewsSearchQuery,
    filteredNewsArticles,
    newsCategoryCounts,
  };
}

export default useBilingualHub;
