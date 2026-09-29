// src/hooks/useBilingualReading.js
// Centralized React Hook for Active Reading, Curtain Mode & Context Gap-Fill

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getPassage, getWordsInPassage, checkProAccess } from '../services/db.js';
import { playSound, speakWord } from '../utils/bilingualSoundUtils.js';

// In-memory cache across component mounts (instant 0ms switching)
const PASSAGE_CACHE = new Map();

function escapeRegex(string) {
  return (string || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function useBilingualReading(initialPassageId = null) {
  const [passageId, setPassageId] = useState(initialPassageId || null);
  const [passage, setPassage] = useState(null);
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tabs & Views
  const [activeTab, setActiveTab] = useState('reading'); // 'reading' | 'gap-fill'
  const [viewMode, setViewMode] = useState('bilingual'); // 'bilingual' | 'en' | 'vi'
  const [fontSize, setFontSize] = useState('base'); // 'sm' | 'base' | 'lg' | 'xl'

  // Curtain Mode state (Set of revealed paragraph indexes)
  const [revealedParas, setRevealedParas] = useState(() => new Set());

  // Tooltip state for highlighted words
  const [activeTooltip, setActiveTooltip] = useState(null);

  // Gap-fill state
  const [gapItems, setGapItems] = useState([]);
  const [currentGapIndex, setCurrentGapIndex] = useState(0);
  const completeSoundPlayedRef = useRef(false);

  // Determine target passageId on mount if not provided
  useEffect(() => {
    if (passageId) return;

    let target = null;
    if (typeof window !== 'undefined') {
      if (window._currentPassageId && window._currentPassageId !== '__unlinked__') {
        target = window._currentPassageId;
      } else if (window._camHierarchy?.tests) {
        for (const t of window._camHierarchy.tests) {
          const found = (t.passages || []).find((p) => p.contentEn || p.id);
          if (found) {
            target = found.id;
            break;
          }
        }
      }
    }

    if (target) {
      setPassageId(target);
    } else {
      setLoading(false);
      setError('Chưa chọn bài đọc song ngữ');
    }
  }, [passageId]);

  // Load passage and words whenever passageId changes
  useEffect(() => {
    if (!passageId) return;

    let cancelled = false;

    async function loadData() {
      // 1. Check PRO access
      try {
        const hasAccess = await checkProAccess({
          topicId: typeof window !== 'undefined' ? window._currentTopicId : undefined,
          passageId,
          showModal: true,
        });
        if (!hasAccess && !cancelled) {
          setLoading(false);
          setError('Tính năng đọc song ngữ yêu cầu gói Pro.');
          return;
        }
      } catch (_) {}

      // 2. Check in-memory cache
      if (PASSAGE_CACHE.has(passageId)) {
        const cached = PASSAGE_CACHE.get(passageId);
        if (!cancelled) {
          setPassage(cached.passage);
          setWords(cached.words);
          setRevealedParas(new Set());
          setLoading(false);
          setError(null);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Try finding passage in _camHierarchy first
        let foundPassage = null;
        if (typeof window !== 'undefined' && window._camHierarchy?.tests) {
          for (const t of window._camHierarchy.tests) {
            const found = (t.passages || []).find((p) => p.id === passageId);
            if (found) {
              foundPassage = {
                ...found,
                testName: t.name,
                topicName: window._currentTopicName || 'IELTS Actual Tests',
              };
              break;
            }
          }
        }

        const needFetchPassage = !foundPassage || (!foundPassage.contentEn && !foundPassage.contentVi);

        const [fetchedPassage, fetchedWords] = await Promise.all([
          needFetchPassage ? getPassage(passageId) : Promise.resolve(foundPassage),
          getWordsInPassage(passageId),
        ]);

        if (cancelled) return;

        let finalPassage = null;
        if (fetchedPassage) {
          finalPassage = {
            id: fetchedPassage.id,
            title: fetchedPassage.title || foundPassage?.title,
            passageNumber: fetchedPassage.passage_number || fetchedPassage.passageNumber || foundPassage?.passageNumber,
            topicLabel: fetchedPassage.topic_label || fetchedPassage.topicLabel || foundPassage?.topicLabel,
            contentEn: fetchedPassage.content_en || fetchedPassage.contentEn || foundPassage?.contentEn || '',
            contentVi: fetchedPassage.content_vi || fetchedPassage.contentVi || foundPassage?.contentVi || '',
            testName: foundPassage?.testName || (typeof window !== 'undefined' ? window._currentTestName : 'Test'),
            topicName: foundPassage?.topicName || (typeof window !== 'undefined' ? window._currentTopicName : 'IELTS'),
          };
        } else if (foundPassage) {
          finalPassage = foundPassage;
        }

        if (!finalPassage || (!finalPassage.contentEn && !finalPassage.contentVi)) {
          setError('Không tìm thấy nội dung bài đọc song ngữ.');
          setLoading(false);
          return;
        }

        const wordList = Array.isArray(fetchedWords) ? fetchedWords : [];

        // Save to cache
        PASSAGE_CACHE.set(passageId, { passage: finalPassage, words: wordList });

        setPassage(finalPassage);
        setWords(wordList);
        setRevealedParas(new Set());
        setLoading(false);
      } catch (err) {
        console.error('[useBilingualReading] Load error:', err);
        if (!cancelled) {
          setError(err.message || 'Không thể tải bài đọc.');
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [passageId]);

  // Paragraphs split
  const enParas = useMemo(() => {
    if (!passage?.contentEn) return [];
    return passage.contentEn
      .split(/\n\s*\n|\r\n\r\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [passage?.contentEn]);

  const viParas = useMemo(() => {
    if (!passage?.contentVi) return [];
    return passage.contentVi
      .split(/\n\s*\n|\r\n\r\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [passage?.contentVi]);

  const totalParas = Math.max(enParas.length, viParas.length);

  // Vocab Word Map & Regex for Highlighting
  const { vocabMap, vocabRegex } = useMemo(() => {
    const map = new Map();
    if (!words || words.length === 0) return { vocabMap: map, vocabRegex: null };

    words.forEach((w) => {
      if (w.word && w.word.trim().length >= 3) {
        map.set(w.word.trim().toLowerCase(), w);
      }
    });

    const sortedWords = Array.from(map.keys()).sort((a, b) => b.length - a.length);
    if (sortedWords.length === 0) return { vocabMap: map, vocabRegex: null };

    const escapedTokens = sortedWords.map(escapeRegex);
    const regex = new RegExp(`\\b(${escapedTokens.join('|')})(?:s|es|ed|ing)?\\b`, 'gi');
    return { vocabMap: map, vocabRegex: regex };
  }, [words]);

  // Curtain Mode Handlers
  const toggleParaCurtain = useCallback((idx) => {
    setRevealedParas((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const revealAllParas = useCallback(() => {
    const all = new Set();
    for (let i = 0; i < totalParas; i++) all.add(i);
    setRevealedParas(all);
  }, [totalParas]);

  const hideAllParas = useCallback(() => {
    setRevealedParas(new Set());
  }, []);

  // Font Size Handler
  const changeFontSize = useCallback((delta) => {
    const sizes = ['sm', 'base', 'lg', 'xl'];
    setFontSize((prev) => {
      let idx = sizes.indexOf(prev);
      if (idx === -1) idx = 1;
      const nextIdx = Math.max(0, Math.min(sizes.length - 1, idx + delta));
      return sizes[nextIdx];
    });
  }, []);

  // Tooltip Handlers
  const openVocabTooltip = useCallback((wordObj, clientX, clientY) => {
    const x = Math.min(Math.max(16, clientX - 100), window.innerWidth - 320);
    const y = Math.min(clientY + 20, window.innerHeight - 200);

    setActiveTooltip({
      word: wordObj.word,
      pos: wordObj.pos || '',
      phonetic: wordObj.phonetic || '',
      meaning: wordObj.meaning || '',
      x,
      y,
    });
  }, []);

  const closeVocabTooltip = useCallback(() => {
    setActiveTooltip(null);
  }, []);

  // ──────────────────────────────────────────────
  // Gap-fill Generator & Exercise Loop
  // ──────────────────────────────────────────────
  const prepareGapExercises = useCallback(() => {
    if (!words || words.length === 0 || !passage?.contentEn) {
      setGapItems([]);
      return;
    }

    const sentences = (passage.contentEn.match(/[^.!?\r\n]+[.!?]*/g) || [passage.contentEn])
      .map((s) => s.trim())
      .filter(Boolean);

    const targetWords = words.slice(0, 40);
    const items = [];

    targetWords.forEach((w, idx) => {
      if (!w.word) return;
      const cleanWord = w.word.trim();
      if (!cleanWord) return;

      let sentence = w.exampleSentence || w.example_sentence;
      if (!sentence && sentences.length > 0) {
        const lowerWord = cleanWord.toLowerCase();
        const found = sentences.find((s) => s.toLowerCase().includes(lowerWord));
        if (found) sentence = found;
      }

      if (!sentence) {
        sentence = `In this passage, the term "${cleanWord}" plays a significant role in understanding the topic.`;
      }

      const esc = escapeRegex(cleanWord);
      const wordRegex = new RegExp(`\\b(${esc})(s|es|ed|ing)?\\b`, 'i');
      const match = sentence.match(wordRegex);

      let before = sentence;
      let targetBlank = cleanWord;
      let after = '';

      if (match && match.index !== undefined) {
        before = sentence.substring(0, match.index);
        targetBlank = match[0];
        after = sentence.substring(match.index + match[0].length);
      }

      items.push({
        index: idx,
        wordId: w.id || idx,
        targetWord: cleanWord,
        blankWord: targetBlank,
        pos: w.pos || '',
        phonetic: w.phonetic || '',
        meaning: w.meaning || '',
        sentenceBefore: before,
        sentenceAfter: after,
        userAnswer: '',
        isCorrect: false,
        isRevealed: false,
        hintLevel: 0,
      });
    });

    setGapItems(items);
    setCurrentGapIndex(0);
    completeSoundPlayedRef.current = false;
  }, [words, passage?.contentEn]);

  // When switching to gap-fill tab, generate exercises if not generated
  useEffect(() => {
    if (activeTab === 'gap-fill' && gapItems.length === 0 && words.length > 0) {
      prepareGapExercises();
    }
  }, [activeTab, gapItems.length, words.length, prepareGapExercises]);

  const checkGapItem = useCallback(
    (idx, userVal) => {
      const item = gapItems[idx];
      if (!item || item.isCorrect) return false;

      const cleanVal = (userVal || '').trim();
      const targetClean = item.blankWord.trim().toLowerCase();
      const baseClean = item.targetWord.trim().toLowerCase();
      const userClean = cleanVal.toLowerCase();

      const isMatch = userClean === targetClean || userClean === baseClean;

      setGapItems((prev) =>
        prev.map((it, i) => (i === idx ? { ...it, userAnswer: cleanVal, isCorrect: isMatch } : it))
      );

      if (isMatch) {
        playSound('correct');
        speakWord(item.targetWord);

        // Check if all are complete
        const remaining = gapItems.filter((it, i) => i !== idx && !it.isCorrect);
        if (remaining.length === 0 && !completeSoundPlayedRef.current) {
          completeSoundPlayedRef.current = true;
          playSound('complete');
        } else {
          // Auto advance after 700ms
          setTimeout(() => {
            setGapItems((currentItems) => {
              let nextIdx = currentItems.findIndex((it, i) => i > idx && !it.isCorrect);
              if (nextIdx === -1) {
                nextIdx = currentItems.findIndex((it) => !it.isCorrect);
              }
              if (nextIdx !== -1) {
                setCurrentGapIndex(nextIdx);
              }
              return currentItems;
            });
          }, 700);
        }
        return true;
      } else {
        playSound('incorrect');
        return false;
      }
    },
    [gapItems]
  );

  const hintGapItem = useCallback((idx) => {
    setGapItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx || it.isCorrect) return it;
        const nextHint = Math.min(it.blankWord.length - 1, it.hintLevel + 1);
        return {
          ...it,
          hintLevel: nextHint,
          userAnswer: it.blankWord.slice(0, nextHint),
        };
      })
    );
  }, []);

  const revealGapItem = useCallback((idx) => {
    setGapItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, isRevealed: true, userAnswer: it.blankWord } : it))
    );
  }, []);

  const resetGapExercises = useCallback(() => {
    completeSoundPlayedRef.current = false;
    setGapItems((prev) =>
      prev.map((it) => ({
        ...it,
        isCorrect: false,
        isRevealed: false,
        userAnswer: '',
        hintLevel: 0,
      }))
    );
    setCurrentGapIndex(0);
  }, []);

  const nextGapItem = useCallback(
    (currentIdx) => {
      let nextIdx = gapItems.findIndex((it, i) => i > currentIdx && !it.isCorrect);
      if (nextIdx === -1) {
        nextIdx = gapItems.findIndex((it) => !it.isCorrect);
      }
      if (nextIdx !== -1) {
        setCurrentGapIndex(nextIdx);
      } else if (currentIdx < gapItems.length - 1) {
        setCurrentGapIndex(currentIdx + 1);
      }
    },
    [gapItems]
  );

  const prevGapItem = useCallback((currentIdx) => {
    if (currentIdx > 0) setCurrentGapIndex(currentIdx - 1);
  }, []);

  // Switch passage inside component
  const switchPassage = useCallback((newId) => {
    if (newId && typeof window !== 'undefined') {
      window._currentPassageId = newId;
    }
    setPassageId(newId);
  }, []);

  return {
    passageId,
    passage,
    words,
    loading,
    error,
    activeTab,
    setActiveTab,
    viewMode,
    setViewMode,
    fontSize,
    changeFontSize,
    enParas,
    viParas,
    totalParas,
    vocabMap,
    vocabRegex,
    revealedParas,
    toggleParaCurtain,
    revealAllParas,
    hideAllParas,
    activeTooltip,
    openVocabTooltip,
    closeVocabTooltip,
    // Gap fill
    gapItems,
    currentGapIndex,
    setCurrentGapIndex,
    checkGapItem,
    hintGapItem,
    revealGapItem,
    resetGapExercises,
    nextGapItem,
    prevGapItem,
    switchPassage,
  };
}

export default useBilingualReading;
