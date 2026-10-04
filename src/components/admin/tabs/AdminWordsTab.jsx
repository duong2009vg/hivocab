// src/components/admin/tabs/AdminWordsTab.jsx
// Quản lý từ vựng phân cấp theo đúng cấu trúc học tập của App:
// Cấp 1: Danh mục (Category) -> Cấp 2: Chủ đề (Topic) -> Cấp 3: Bài học (Lesson / Test & Passage) -> Cấp 4: Danh sách từ vựng
// Cozy Crayon Handcrafted Design System
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { playWordAudio } from '../../../services/audioService.js';

const POS_OPTIONS = [
  { value: 'noun', label: 'Danh từ (n)' },
  { value: 'verb', label: 'Động từ (v)' },
  { value: 'adjective', label: 'Tính từ (adj)' },
  { value: 'adverb', label: 'Trạng từ (adv)' },
  { value: 'phrase', label: 'Cụm từ (phrase)' },
  { value: 'idiom', label: 'Thành ngữ (idiom)' },
  { value: 'preposition', label: 'Giới từ (prep)' },
];

export function AdminWordsTab() {
  const { showToast } = useToast();

  // ─── Hierarchy State ───
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('THPT/ĐGNL');

  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState('');

  // Cambridge Test & Passage hierarchy
  const [camTests, setCamTests] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState('');
  const [camPassages, setCamPassages] = useState([]);
  const [selectedPassageId, setSelectedPassageId] = useState('');

  // Standard non-cam lessons
  const [lessons, setLessons] = useState([]);
  const [selectedLessonIndex, setSelectedLessonIndex] = useState('all'); // 'all' | 0 | 1 | 2...

  // Words list & Loading
  const [words, setWords] = useState([]);
  const [totalTopicWords, setTotalTopicWords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state (Create & Edit)
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingWord, setEditingWord] = useState(null);
  const [wordForm, setWordForm] = useState({
    word: '',
    phonetic: '',
    pos: 'noun',
    meaning: '',
    example_sentence: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ──────────────────────────────────────────────
  // 1. Fetch Categories on Mount
  // ──────────────────────────────────────────────
  useEffect(() => {
    async function loadCategories() {
      try {
        const { data, error } = await supabase
          .from('topics')
          .select('category')
          .order('category', { ascending: true });

        if (error) throw error;
        const uniqueCats = Array.from(
          new Set((data || []).map((t) => t.category).filter(Boolean))
        );
        setCategories(uniqueCats);
        if (uniqueCats.includes('THPT/ĐGNL')) {
          setSelectedCategory('THPT/ĐGNL');
        } else if (uniqueCats.length > 0) {
          setSelectedCategory(uniqueCats[0]);
        }
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    }
    loadCategories();
  }, []);

  // ──────────────────────────────────────────────
  // 2. Fetch Topics when Category changes
  // ──────────────────────────────────────────────
  useEffect(() => {
    async function loadTopics() {
      if (!selectedCategory) return;
      try {
        let query = supabase
          .from('topics')
          .select('id, name, icon, is_pro, category, words(count)')
          .order('name', { ascending: true });

        if (selectedCategory !== 'all') {
          query = query.eq('category', selectedCategory);
        }

        const { data, error } = await query;
        if (error) throw error;

        const mapped = (data || []).map((t) => ({
          ...t,
          word_count: t.words?.[0]?.count || 0,
        }));

        setTopics(mapped);
        if (mapped.length > 0) {
          setSelectedTopicId(mapped[0].id);
        } else {
          setSelectedTopicId('');
          setWords([]);
        }
      } catch (err) {
        console.error('Error loading topics:', err);
        showToast('Không tải được danh sách chủ đề.', 'error');
      }
    }
    loadTopics();
  }, [selectedCategory, showToast]);

  const currentTopic = useMemo(() => {
    return topics.find((t) => t.id === selectedTopicId) || null;
  }, [topics, selectedTopicId]);

  const isCambridge = useMemo(() => {
    return selectedCategory === 'CAM' || (currentTopic?.name || '').toUpperCase().startsWith('CAM');
  }, [selectedCategory, currentTopic]);

  // ──────────────────────────────────────────────
  // 3. Fetch Sub-units (Tests/Passages for CAM or Lessons for Standard)
  // ──────────────────────────────────────────────
  useEffect(() => {
    if (!selectedTopicId) return;

    let isCancelled = false;

    async function loadSubUnits() {
      if (isCambridge) {
        // Load Cambridge Tests
        try {
          const { data: tests, error } = await supabase
            .from('tests')
            .select('id, name, test_order')
            .eq('topic_id', selectedTopicId)
            .order('test_order', { ascending: true });

          if (error) throw error;
          if (isCancelled) return;

          setCamTests(tests || []);
          if (tests && tests.length > 0) {
            setSelectedTestId(tests[0].id);
          } else {
            setSelectedTestId('');
            setCamPassages([]);
            setSelectedPassageId('');
          }
        } catch (err) {
          console.error('Error loading cam tests:', err);
        }
      } else {
        // Load Non-CAM Lessons
        try {
          setCamTests([]);
          setSelectedTestId('');
          setCamPassages([]);
          setSelectedPassageId('');

          // Check if there are named lessons
          const { data: wordsData, error } = await supabase
            .from('words')
            .select('id, lesson_name, lesson_order')
            .eq('topic_id', selectedTopicId);

          if (error) throw error;
          if (isCancelled) return;

          const count = (wordsData || []).length;
          setTotalTopicWords(count);

          const namedLessons = (wordsData || []).filter(
            (w) => w.lesson_name && w.lesson_order !== null
          );

          if (namedLessons.length > 0) {
            const groups = new Map();
            for (const w of namedLessons) {
              const order = Number(w.lesson_order);
              if (!groups.has(order)) {
                groups.set(order, { name: w.lesson_name, count: 0 });
              }
              groups.get(order).count += 1;
            }
            const sortedLessons = Array.from(groups.entries())
              .sort(([a], [b]) => a - b)
              .map(([order, g]) => ({
                index: order,
                name: g.name,
                count: g.count,
              }));
            setLessons(sortedLessons);
          } else {
            // Chunk by 50 words
            const LESSON_SIZE = 50;
            const totalLessons = Math.max(1, Math.ceil(count / LESSON_SIZE));
            const chunked = [];
            for (let i = 0; i < totalLessons; i++) {
              const start = i * LESSON_SIZE + 1;
              const end = Math.min((i + 1) * LESSON_SIZE, count);
              chunked.push({
                index: i,
                name: `Bài ${i + 1} (Từ ${start} - ${end || count})`,
                count: Math.max(0, end - start + 1),
              });
            }
            setLessons(chunked);
          }
          setSelectedLessonIndex('all');
        } catch (err) {
          console.error('Error loading non-cam lessons:', err);
        }
      }
    }

    loadSubUnits();
    return () => {
      isCancelled = true;
    };
  }, [selectedTopicId, isCambridge]);

  // ──────────────────────────────────────────────
  // 4. Fetch Passages when Cambridge Test changes
  // ──────────────────────────────────────────────
  useEffect(() => {
    if (!isCambridge || !selectedTestId) return;

    let isCancelled = false;
    async function loadPassages() {
      try {
        const { data: passages, error } = await supabase
          .from('passages')
          .select('id, title, passage_number')
          .eq('test_id', selectedTestId)
          .order('passage_number', { ascending: true });

        if (error) throw error;
        if (isCancelled) return;

        setCamPassages(passages || []);
        if (passages && passages.length > 0) {
          setSelectedPassageId(passages[0].id);
        } else {
          setSelectedPassageId('');
        }
      } catch (err) {
        console.error('Error loading passages:', err);
      }
    }
    loadPassages();
    return () => {
      isCancelled = true;
    };
  }, [isCambridge, selectedTestId]);

  // ──────────────────────────────────────────────
  // 5. Fetch Words for current Topic / Sub-unit
  // ──────────────────────────────────────────────
  const fetchWords = useCallback(async () => {
    if (!selectedTopicId) return;
    setLoading(true);

    try {
      if (isCambridge) {
        let query = supabase
          .from('words')
          .select('id, word, pos, phonetic, meaning, example_sentence, passage_id, word_order, created_at')
          .eq('topic_id', selectedTopicId);

        if (selectedPassageId) {
          query = query.eq('passage_id', selectedPassageId);
        }
        query = query.order('word_order', { ascending: true, nullsFirst: false });

        const { data, error } = await query;
        if (error) throw error;
        setWords(data || []);
      } else {
        let query = supabase
          .from('words')
          .select('id, word, pos, phonetic, meaning, example_sentence, lesson_name, lesson_order, word_order, created_at')
          .eq('topic_id', selectedTopicId);

        if (selectedLessonIndex !== 'all') {
          const idx = Number(selectedLessonIndex);
          const { data: checkData } = await supabase
            .from('words')
            .select('id')
            .eq('topic_id', selectedTopicId)
            .eq('lesson_order', idx)
            .limit(1);

          if (checkData && checkData.length > 0) {
            query = query.eq('lesson_order', idx);
          } else {
            const LESSON_SIZE = 50;
            query = query.range(idx * LESSON_SIZE, (idx + 1) * LESSON_SIZE - 1);
          }
        } else {
          query = query.limit(150);
        }

        query = query.order('word_order', { ascending: true, nullsFirst: false });

        const { data, error } = await query;
        if (error) throw error;
        setWords(data || []);
      }
    } catch (err) {
      console.error('fetchWords error:', err);
      showToast(`Lỗi nạp từ vựng: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedTopicId, isCambridge, selectedPassageId, selectedLessonIndex, showToast]);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  // ──────────────────────────────────────────────
  // 6. Filter words by quick search
  // ──────────────────────────────────────────────
  const filteredWords = useMemo(() => {
    if (!searchTerm.trim()) return words;
    const q = searchTerm.toLowerCase().trim();
    return words.filter((w) => {
      return (
        String(w.word || '').toLowerCase().includes(q) ||
        String(w.meaning || '').toLowerCase().includes(q) ||
        String(w.phonetic || '').toLowerCase().includes(q)
      );
    });
  }, [words, searchTerm]);

  // ──────────────────────────────────────────────
  // 7. Add & Edit Handlers
  // ──────────────────────────────────────────────
  const handleOpenAdd = () => {
    setWordForm({
      word: '',
      phonetic: '',
      pos: 'noun',
      meaning: '',
      example_sentence: '',
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (w) => {
    setEditingWord(w);
    setWordForm({
      word: w.word || '',
      phonetic: w.phonetic || '',
      pos: w.pos || 'noun',
      meaning: w.meaning || '',
      example_sentence: w.example_sentence || '',
    });
  };

  const handleSaveWord = async (e) => {
    e.preventDefault();
    if (!wordForm.word.trim()) {
      showToast('Từ tiếng Anh không được để trống!', 'warning');
      return;
    }
    if (!wordForm.meaning.trim()) {
      showToast('Nghĩa tiếng Việt không được để trống!', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingWord) {
        const { error } = await supabase
          .from('words')
          .update({
            word: wordForm.word.trim(),
            phonetic: wordForm.phonetic.trim() || null,
            pos: wordForm.pos.trim() || null,
            meaning: wordForm.meaning.trim(),
            example_sentence: wordForm.example_sentence.trim() || null,
          })
          .eq('id', editingWord.id);

        if (error) throw error;
        showToast(`Đã lưu từ "${wordForm.word}"! 🎉`, 'success');
        setWords((prev) =>
          prev.map((w) => (w.id === editingWord.id ? { ...w, ...wordForm } : w))
        );
        setEditingWord(null);
      } else {
        const newPayload = {
          topic_id: selectedTopicId,
          word: wordForm.word.trim(),
          phonetic: wordForm.phonetic.trim() || null,
          pos: wordForm.pos.trim() || null,
          meaning: wordForm.meaning.trim(),
          example_sentence: wordForm.example_sentence.trim() || null,
          passage_id: isCambridge ? selectedPassageId || null : null,
          lesson_order: !isCambridge && selectedLessonIndex !== 'all' ? Number(selectedLessonIndex) : 0,
          lesson_name:
            !isCambridge && selectedLessonIndex !== 'all'
              ? lessons[Number(selectedLessonIndex)]?.name || null
              : null,
          word_order: words.length + 1,
          created_at: new Date().toISOString(),
        };

        const { data, error } = await supabase.from('words').insert(newPayload).select();
        if (error) throw error;

        showToast(`Đã thêm từ "${wordForm.word}" vào bài học! 🎉`, 'success');
        if (data && data[0]) {
          setWords((prev) => [...prev, data[0]]);
        }
        setIsAddOpen(false);
      }
    } catch (err) {
      console.error('handleSaveWord error:', err);
      showToast(`Lỗi khi lưu từ: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWord = async (w) => {
    if (!window.confirm(`Bạn có chắc muốn xóa từ "${w.word}"?`)) return;
    try {
      const { error } = await supabase.from('words').delete().eq('id', w.id);
      if (error) throw error;
      showToast(`Đã xóa từ "${w.word}".`, 'success');
      setWords((prev) => prev.filter((item) => item.id !== w.id));
    } catch (err) {
      console.error('handleDeleteWord error:', err);
      showToast(`Lỗi xóa từ: ${err.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-nunito text-[#3D352E]">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* HIERARCHY SELECTOR PANEL (DANH MỤC -> CHỦ ĐỀ -> BÀI HỌC)     */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-white border-2 border-[#3D352E] shadow-[3.5px_4px_0px_#3D352E] space-y-5">
        {/* Step 1: Category Selector Pills */}
        <div>
          <label className="block text-[11px] font-black font-quicksand uppercase tracking-wider text-[#6E5D53] mb-2.5">
            1. Danh mục học tập (Category)
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black font-quicksand transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#3D352E] text-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E]'
                  : 'bg-[#FAF5EB] text-[#6E5D53] border-2 border-[#3D352E] hover:bg-[#F2ECE0]'
              }`}
            >
              Tất cả danh mục
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-black font-quicksand transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#3D352E] text-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E]'
                    : 'bg-[#FAF5EB] text-[#6E5D53] border-2 border-[#3D352E] hover:bg-[#F2ECE0]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Topic Selector & Sub-units */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t-2 border-[#FAF5EB]">
          {/* Topic Dropdown */}
          <div>
            <label className="block text-xs font-black font-quicksand uppercase tracking-wider text-[#6E5D53] mb-1.5">
              2. Chủ đề (Topic)
            </label>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-xs font-bold text-[#3D352E] focus:ring-2 focus:ring-[#557A46] focus:outline-none"
            >
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.icon ? `${t.icon} ` : ''}{t.name} ({t.word_count || 0} từ)
                </option>
              ))}
            </select>
          </div>

          {/* Step 3: Sub-unit (Cambridge Test/Passage OR Standard Lesson) */}
          {isCambridge ? (
            <>
              {/* Cambridge Test Selector */}
              <div>
                <label className="block text-xs font-black font-quicksand uppercase tracking-wider text-[#6E5D53] mb-1.5">
                  3. Bài Test (Cambridge)
                </label>
                <select
                  value={selectedTestId}
                  onChange={(e) => setSelectedTestId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-xs font-bold text-[#3D352E]"
                >
                  {camTests.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cambridge Passage Selector */}
              <div>
                <label className="block text-xs font-black font-quicksand uppercase tracking-wider text-[#6E5D53] mb-1.5">
                  4. Bài đọc (Passage)
                </label>
                <select
                  value={selectedPassageId}
                  onChange={(e) => setSelectedPassageId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-xs font-bold text-[#3D352E]"
                >
                  {camPassages.map((p) => (
                    <option key={p.id} value={p.id}>
                      Đoạn {p.passage_number}: {p.title || `Passage ${p.passage_number}`}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            /* Non-CAM: Standard Lesson Selector */
            <div className="sm:col-span-1 lg:col-span-2">
              <label className="block text-xs font-black font-quicksand uppercase tracking-wider text-[#6E5D53] mb-1.5">
                3. Bài học (Lesson)
              </label>
              <select
                value={selectedLessonIndex}
                onChange={(e) => setSelectedLessonIndex(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-xs font-bold text-[#3D352E]"
              >
                <option value="all">
                  Tất cả bài học ({totalTopicWords} từ trong chủ đề)
                </option>
                {lessons.map((l) => (
                  <option key={l.index} value={l.index}>
                    {l.name} ({l.count} từ)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TOOLBAR: SEARCH & ADD NEW WORD BUTTON                        */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="p-5 rounded-3xl bg-white border-2 border-[#3D352E] shadow-[3.5px_4px_0px_#3D352E] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-[18px] text-[#6E5D53]">
              search
            </span>
            <input
              type="text"
              placeholder="Tìm từ vựng, phiên âm, nghĩa tiếng Việt..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-xs font-bold text-[#3D352E] focus:ring-2 focus:ring-[#557A46] focus:outline-none placeholder:text-[#8C7A6B]/60"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs font-bold text-[#6E5D53]">
            Hiển thị <strong className="text-[#557A46] font-mono font-black text-sm">{filteredWords.length}</strong> từ
          </span>

          <button
            onClick={handleOpenAdd}
            disabled={!selectedTopicId}
            className="px-5 py-2.5 rounded-2xl bg-[#557A46] hover:bg-[#466638] text-white font-black text-xs flex items-center gap-1.5 border-2 border-[#3D352E] shadow-[2.5px_3px_0px_#3D352E] active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Thêm từ mới ✨</span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* WORDS LIST TABLE                                             */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border-2 border-[#3D352E] shadow-[3.5px_4px_0px_#3D352E] overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[#6E5D53] flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-[#557A46] text-[32px] animate-spin">
              refresh
            </span>
            <span className="text-xs font-bold">Đang tải danh sách từ vựng theo bài học...</span>
          </div>
        ) : filteredWords.length === 0 ? (
          <div className="py-16 text-center text-[#6E5D53] space-y-2">
            <div className="text-4xl mb-1">📖</div>
            <p className="text-sm font-black font-quicksand text-[#3D352E]">
              Chưa có từ vựng nào trong bài học này.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-3 px-5 py-2.5 rounded-2xl bg-[#557A46] text-white text-xs font-black inline-flex items-center gap-1.5 border-2 border-[#3D352E] shadow-[2px_2.5px_0px_#3D352E] active:translate-y-0.5 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Thêm từ đầu tiên 🚀</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF5EB] border-b-2 border-[#3D352E] text-[#6E5D53] font-black font-quicksand uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">TỪ VỰNG & PHÁT ÂM</th>
                  <th className="py-3 px-4">TỪ LOẠI</th>
                  <th className="py-3 px-4">NGHĨA TIẾNG VIỆT</th>
                  <th className="py-3 px-4">CÂU VÍ DỤ MINH HỌA</th>
                  <th className="py-3 px-4 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EADDC7]">
                {filteredWords.map((w, idx) => (
                  <tr key={w.id} className="hover:bg-[#FFF9EE] transition-colors">
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-[#6E5D53]">
                      {idx + 1}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => playWordAudio(w.word)}
                          className="w-8 h-8 rounded-xl bg-[#FAF5EB] hover:bg-[#F2ECE0] border-2 border-[#3D352E] text-[#557A46] shadow-[1.5px_1.5px_0px_#3D352E] flex items-center justify-center shrink-0 cursor-pointer active:translate-y-0.5 transition-all"
                          title="Nghe phát âm chuẩn"
                        >
                          <span className="material-symbols-outlined text-[16px]">volume_up</span>
                        </button>
                        <div>
                          <div className="font-black text-sm text-[#3D352E] font-quicksand">{w.word}</div>
                          {w.phonetic && (
                            <div className="text-[11px] font-mono font-bold text-[#6E5D53]">
                              {w.phonetic}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {w.pos ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FAF5EB] text-[#3D352E] border border-[#3D352E] uppercase">
                          {w.pos}
                        </span>
                      ) : (
                        <span className="text-[#6E5D53]">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#3D352E] text-xs">{w.meaning}</span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      {w.example_sentence ? (
                        <p className="text-[#6E5D53] italic text-[11px] line-clamp-2">
                          "{w.example_sentence}"
                        </p>
                      ) : (
                        <span className="text-[#6E5D53]/40">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(w)}
                          className="p-1.5 rounded-xl bg-[#FAF5EB] hover:bg-[#F2ECE0] border-2 border-[#3D352E] shadow-[1.5px_1.5px_0px_#3D352E] text-[#557A46] transition-all cursor-pointer"
                          title="Chỉnh sửa từ này"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteWord(w)}
                          className="p-1.5 rounded-xl text-[#DE5D53] hover:bg-[#FFF0E6] border border-transparent hover:border-[#DE5D53] transition-colors cursor-pointer"
                          title="Xóa từ"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ADD / EDIT WORD MODAL                                         */}
      {/* ───────────────────────────────────────────────────────────── */}
      {(isAddOpen || editingWord) && (
        <div className="fixed inset-0 z-50 bg-[#3D352E]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-nunito text-[#3D352E]">
          <div className="bg-[#FAF5EB] border-2 border-[#3D352E] rounded-3xl w-full max-w-lg shadow-[5px_6px_0px_#3D352E] overflow-hidden">
            <div className="p-5 border-b-2 border-[#3D352E] flex items-center justify-between bg-white">
              <h3 className="font-black text-base font-quicksand text-[#3D352E] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#557A46] text-[20px]">
                  {editingWord ? 'edit' : 'add_circle'}
                </span>
                <span>{editingWord ? `Sửa từ "${editingWord.word}"` : 'Thêm Từ Vựng Mới Vào Bài ✏️'}</span>
              </h3>
              <button
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingWord(null);
                }}
                className="w-8 h-8 rounded-full border-2 border-[#3D352E] bg-white hover:bg-[#FAF5EB] flex items-center justify-center text-[#3D352E] shadow-[2px_2px_0px_#3D352E] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveWord} className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-black font-quicksand uppercase text-[#6E5D53] mb-1">
                    Từ tiếng Anh (Word) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: resilient"
                    value={wordForm.word}
                    onChange={(e) => setWordForm({ ...wordForm, word: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-xs font-black text-[#3D352E] focus:ring-2 focus:ring-[#557A46]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black font-quicksand uppercase text-[#6E5D53] mb-1">
                    Phiên âm (Phonetic)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: /rɪˈzɪl.jənt/"
                    value={wordForm.phonetic}
                    onChange={(e) => setWordForm({ ...wordForm, phonetic: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-2xl bg-white border-2 border-[#3D352E] text-xs font-mono font-bold text-[#3D352E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black font-quicksand uppercase text-[#6E5D53] mb-1">
                    Từ loại (POS)
                  </label>
                  <select
                    value={wordForm.pos}
                    onChange={(e) => setWordForm({ ...wordForm, pos: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-2xl bg-white border-2 border-[#3D352E] text-xs font-bold text-[#3D352E]"
                  >
                    {POS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black font-quicksand uppercase text-[#6E5D53] mb-1">
                  Nghĩa tiếng Việt (Meaning) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: kiên cường, mau phục hồi"
                  value={wordForm.meaning}
                  onChange={(e) => setWordForm({ ...wordForm, meaning: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-xs font-bold text-[#3D352E] focus:ring-2 focus:ring-[#557A46]"
                />
              </div>

              <div>
                <label className="block text-xs font-black font-quicksand uppercase text-[#6E5D53] mb-1">
                  Câu ví dụ minh họa (Example sentence)
                </label>
                <textarea
                  rows={3}
                  placeholder="VD: The local economy is remarkably resilient despite global challenges."
                  value={wordForm.example_sentence}
                  onChange={(e) => setWordForm({ ...wordForm, example_sentence: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-2xl bg-white border-2 border-[#3D352E] text-xs text-[#3D352E] leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t-2 border-[#3D352E]/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    setEditingWord(null);
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-white hover:bg-[#FAF5EB] border-2 border-[#3D352E] shadow-[2px_2.5px_0px_#3D352E] text-xs font-bold text-[#3D352E] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-2xl bg-[#557A46] hover:bg-[#466638] text-white text-xs font-black flex items-center gap-1.5 border-2 border-[#3D352E] shadow-[2.5px_3px_0px_#3D352E] active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>{isSubmitting ? 'Đang lưu...' : 'Lưu Từ Vựng ✨'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminWordsTab;
