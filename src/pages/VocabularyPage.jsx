// src/pages/VocabularyPage.jsx
// Sổ từ vựng & Quản lý chủ đề trong HiVocab

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTopics, createTopic, deleteTopic, getWordsByTopic, addWord, deleteWord } from '../services/supabase.js';
import { playWord } from '../services/audio.js';
import { useAuthStore } from '../stores/authStore.js';

export function VocabularyPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [topics, setTopics] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [wordsData, setWordsData] = useState({ words: [], total: 0, totalPages: 1 });
    const [page, setPage] = useState(1);
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    // Modals
    const [isCreateTopicOpen, setIsCreateTopicOpen] = useState(false);
    const [newTopicName, setNewTopicName] = useState('');
    const [newTopicCategory, setNewTopicCategory] = useState('general');

    const [isAddWordOpen, setIsAddWordOpen] = useState(false);
    const [newWord, setNewWord] = useState('');
    const [newMeaning, setNewMeaning] = useState('');
    const [newPhonetic, setNewPhonetic] = useState('');
    const [newPos, setNewPos] = useState('');
    const [newExample, setNewExample] = useState('');

    useEffect(() => {
        loadTopics();
    }, []);

    useEffect(() => {
        if (selectedTopic) {
            loadTopicWords(selectedTopic.id, page);
        }
    }, [selectedTopic, page]);

    async function loadTopics() {
        setLoading(true);
        try {
            const list = await getTopics();
            setTopics(list);
        } catch (_) {}
        finally {
            setLoading(false);
        }
    }

    async function loadTopicWords(topicId, targetPage = 1) {
        setLoading(true);
        try {
            const data = await getWordsByTopic(topicId, targetPage, 30);
            setWordsData(data);
        } catch (_) {}
        finally {
            setLoading(false);
        }
    }

    async function handleCreateTopic(e) {
        e.preventDefault();
        if (!newTopicName.trim()) return;
        try {
            await createTopic(newTopicName.trim(), 'menu_book', newTopicCategory);
            setIsCreateTopicOpen(false);
            setNewTopicName('');
            loadTopics();
        } catch (err) {
            alert(err.message || 'Không thể tạo chủ đề');
        }
    }

    async function handleDeleteTopic(e, topicId) {
        e.stopPropagation();
        if (!confirm('Bạn có chắc chắn muốn xóa chủ đề này? Toàn bộ từ vựng bên trong sẽ bị xóa.')) return;
        try {
            await deleteTopic(topicId);
            if (selectedTopic?.id === topicId) setSelectedTopic(null);
            loadTopics();
        } catch (err) {
            alert(err.message || 'Không thể xóa chủ đề');
        }
    }

    async function handleAddWord(e) {
        e.preventDefault();
        if (!newWord.trim() || !newMeaning.trim() || !selectedTopic) return;
        try {
            await addWord({
                topicId: selectedTopic.id,
                word: newWord.trim(),
                meaning: newMeaning.trim(),
                phonetic: newPhonetic.trim(),
                pos: newPos.trim(),
                example: newExample.trim()
            });
            setIsAddWordOpen(false);
            setNewWord('');
            setNewMeaning('');
            setNewPhonetic('');
            setNewPos('');
            setNewExample('');
            loadTopicWords(selectedTopic.id, 1);
            loadTopics();
        } catch (err) {
            alert(err.message || 'Không thể thêm từ');
        }
    }

    async function handleDeleteWord(wordId, wordText) {
        if (!confirm(`Bạn có chắc chắn muốn xóa từ "${wordText}"?`)) return;
        try {
            await deleteWord(wordId);
            loadTopicWords(selectedTopic.id, page);
            loadTopics();
        } catch (err) {
            alert(err.message || 'Không thể xóa từ');
        }
    }

    // Categories filter
    const categories = [
        { id: 'all', label: 'Tất cả' },
        { id: 'general', label: 'Cơ bản' },
        { id: 'ielts', label: 'IELTS' },
        { id: 'cambridge', label: 'Cambridge' },
        { id: 'thpt', label: 'THPT' }
    ];

    const filteredTopics = topics.filter((t) => {
        const matchesCategory = activeCategory === 'all' || (t.category || 'general').toLowerCase().includes(activeCategory);
        const matchesSearch = !searchQuery || (t.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const lvColor = [
        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
        'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300',
        'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
        'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300',
        'bg-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
    ];
    const lvLabel = ['Mới', 'Cấp 1', 'Cấp 2', 'Cấp 3', 'Cấp 4', 'Thuộc lòng'];

    return (
        <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-12 pt-6 lg:pt-8 flex flex-col gap-6">
            {/* VIEW 1: CHI TIẾT TỪ VỰNG TRONG CHỦ ĐỀ ĐƯỢC CHỌN */}
            {selectedTopic ? (
                <div className="flex flex-col gap-6 animate-fade-in">
                    {/* Back Button & Header */}
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSelectedTopic(null)}
                                className="w-10 h-10 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-on-surface transition-transform active:scale-95 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                            </button>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black text-on-surface">{selectedTopic.name}</h1>
                                <p className="text-xs text-on-surface-variant font-medium">
                                    {wordsData.total} từ vựng trong chủ đề
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => navigate(`/study?topic=${selectedTopic.id}`)}
                                className="px-4 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs hover:opacity-95 active:scale-95 transition-all cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[18px]">play_circle</span>
                                <span>Ôn chủ đề này</span>
                            </button>
                            <button
                                onClick={() => setIsAddWordOpen(true)}
                                className="px-4 py-2.5 rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-container-highest font-bold text-xs sm:text-sm flex items-center gap-1.5 border border-outline-variant/30 transition-all cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[18px]">add</span>
                                <span>Thêm từ</span>
                            </button>
                        </div>
                    </div>

                    {/* Word List */}
                    {wordsData.words.length === 0 ? (
                        <div className="glass-card soft-shadow rounded-2xl py-16 flex flex-col items-center justify-center text-center gap-3">
                            <span className="material-symbols-outlined text-[52px] text-outline">menu_book</span>
                            <h3 className="font-bold text-lg text-on-surface">Chưa có từ vựng nào</h3>
                            <p className="text-xs text-on-surface-variant max-w-xs">
                                Hãy thêm từ đầu tiên vào chủ đề này hoặc tra từ điển và lưu lại.
                            </p>
                            <button
                                onClick={() => setIsAddWordOpen(true)}
                                className="mt-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold shadow-xs hover:opacity-95 cursor-pointer"
                            >
                                + Thêm từ ngay
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {wordsData.words.map((w, i) => {
                                const globalIndex = (page - 1) * 30 + i + 1;
                                const lv = Math.min(Math.max(w.level || 0, 0), 5);

                                return (
                                    <div
                                        key={w.id}
                                        className="group bg-surface-container-lowest/90 backdrop-blur-sm border border-outline-variant/20 hover:border-primary/40 rounded-2xl p-4 sm:p-5 flex items-start gap-3 sm:gap-4 soft-shadow hover:shadow-md transition-all"
                                    >
                                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 text-primary font-black text-xs sm:text-sm flex items-center justify-center shrink-0 mt-0.5">
                                            {globalIndex}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-on-surface text-base sm:text-lg group-hover:text-primary transition-colors tracking-tight">
                                                    {w.word}
                                                </span>
                                                {w.pos && (
                                                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                                        {w.pos}
                                                    </span>
                                                )}
                                                {w.phonetic && (
                                                    <span className="text-xs sm:text-sm text-outline font-mono">
                                                        {w.phonetic}
                                                    </span>
                                                )}
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${lvColor[lv]}`}>
                                                    {lvLabel[lv]}
                                                </span>

                                                <div className="ml-auto flex items-center gap-1">
                                                    <button
                                                        onClick={() => playWord(w.word)}
                                                        className="p-1.5 rounded-full hover:bg-primary/10 transition-colors text-outline hover:text-primary cursor-pointer"
                                                        title="Phát âm"
                                                    >
                                                        <span className="material-symbols-outlined text-[19px]">volume_up</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteWord(w.id, w.word)}
                                                        className="p-1.5 rounded-full hover:bg-rose-500/10 transition-colors text-outline hover:text-rose-500 cursor-pointer opacity-70 group-hover:opacity-100"
                                                        title="Xóa từ"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                </div>
                                            </div>

                                            <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5 font-medium leading-relaxed">
                                                {w.meaning}
                                            </p>
                                            {w.example_sentence && (
                                                <p className="text-xs sm:text-sm text-outline italic mt-1.5 leading-relaxed bg-surface-container-lowest/60 p-2 rounded-xl border border-outline-variant/15">
                                                    "{w.example_sentence}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Pagination Controls */}
                            {wordsData.totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 pt-4">
                                    <button
                                        disabled={page <= 1}
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        className="px-3 py-1.5 rounded-xl border border-outline-variant/40 text-xs font-bold disabled:opacity-40 cursor-pointer"
                                    >
                                        &larr; Trước
                                    </button>
                                    <span className="text-xs font-bold px-3 py-1 text-on-surface-variant">
                                        Trang {page} / {wordsData.totalPages}
                                    </span>
                                    <button
                                        disabled={page >= wordsData.totalPages}
                                        onClick={() => setPage((p) => Math.min(wordsData.totalPages, p + 1))}
                                        className="px-3 py-1.5 rounded-xl border border-outline-variant/40 text-xs font-bold disabled:opacity-40 cursor-pointer"
                                    >
                                        Sau &rarr;
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                /* VIEW 2: DANH SÁCH CHỦ ĐỀ (TOPICS GRID) */
                <div className="flex flex-col gap-6">
                    {/* Header: Title + Create Topic Button */}
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-on-surface">Kho từ vựng &amp; Sổ từ</h1>
                            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
                                Quản lý toàn bộ danh sách chủ đề và từ vựng cá nhân của bạn.
                            </p>
                        </div>
                        <button
                            onClick={() => setIsCreateTopicOpen(true)}
                            className="px-4 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs hover:opacity-95 active:scale-95 transition-all cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[18px]">create_new_folder</span>
                            <span>Tạo chủ đề mới</span>
                        </button>
                    </div>

                    {/* Filter categories & Search */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
                            {categories.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => setActiveCategory(c.id)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                                        activeCategory === c.id
                                            ? 'bg-primary text-on-primary shadow-xs'
                                            : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                                    }`}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>

                        <div className="relative min-w-[220px]">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                                search
                            </span>
                            <input
                                type="text"
                                placeholder="Tìm chủ đề..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-xs sm:text-sm text-on-surface focus:border-primary focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Topics Grid */}
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-3">
                            <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                            <p className="text-xs text-on-surface-variant font-medium">Đang tải danh sách chủ đề...</p>
                        </div>
                    ) : filteredTopics.length === 0 ? (
                        <div className="glass-card soft-shadow rounded-2xl py-16 flex flex-col items-center justify-center text-center gap-3">
                            <span className="material-symbols-outlined text-[52px] text-outline">folder_open</span>
                            <h3 className="font-bold text-lg text-on-surface">Không tìm thấy chủ đề</h3>
                            <p className="text-xs text-on-surface-variant max-w-xs">
                                Chưa có chủ đề nào trong danh mục này hoặc từ khóa tìm kiếm.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredTopics.map((topic) => (
                                <div
                                    key={topic.id}
                                    onClick={() => {
                                        setSelectedTopic(topic);
                                        setPage(1);
                                    }}
                                    className="glass-card soft-shadow rounded-2xl p-5 hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between gap-4 group hover:-translate-y-1"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-[24px]">
                                                {topic.icon || 'menu_book'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => handleDeleteTopic(e, topic.id)}
                                            className="p-1 rounded-full text-outline hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                            title="Xóa chủ đề"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">delete</span>
                                        </button>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-base text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                                            {topic.name}
                                        </h3>
                                        <span className="text-xs text-on-surface-variant font-medium">
                                            {topic.totalWords || 0} từ vựng
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-outline-variant/15 text-xs font-semibold text-primary">
                                        <span>Xem chi tiết &rarr;</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modal: Tạo chủ đề mới */}
            {isCreateTopicOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <form
                        onSubmit={handleCreateTopic}
                        className="bg-surface border border-outline-variant/30 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative flex flex-col gap-4"
                    >
                        <h3 className="font-bold text-lg text-on-surface">Tạo chủ đề mới</h3>

                        <div>
                            <label className="text-xs font-bold text-on-surface block mb-1">Tên chủ đề</label>
                            <input
                                type="text"
                                required
                                placeholder="Ví dụ: Từ vựng IELTS Writing Task 2..."
                                value={newTopicName}
                                onChange={(e) => setNewTopicName(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-on-surface text-sm focus:border-primary focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-on-surface block mb-1">Danh mục</label>
                            <select
                                value={newTopicCategory}
                                onChange={(e) => setNewTopicCategory(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-on-surface text-sm focus:border-primary focus:outline-none cursor-pointer"
                            >
                                <option value="general">Cơ bản (General English)</option>
                                <option value="ielts">IELTS</option>
                                <option value="cambridge">Cambridge Practice</option>
                                <option value="thpt">Luyện thi THPT QG</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsCreateTopicOpen(false)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-on-primary shadow-xs hover:opacity-95 cursor-pointer"
                            >
                                Tạo chủ đề
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Modal: Thêm từ vựng thủ công */}
            {isAddWordOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <form
                        onSubmit={handleAddWord}
                        className="bg-surface border border-outline-variant/30 rounded-3xl max-w-md w-full p-6 shadow-2xl relative flex flex-col gap-3.5"
                    >
                        <h3 className="font-bold text-lg text-on-surface">Thêm từ mới vào "{selectedTopic?.name}"</h3>

                        <div>
                            <label className="text-xs font-bold text-on-surface block mb-1">Từ vựng (tiếng Anh) *</label>
                            <input
                                type="text"
                                required
                                placeholder="Ví dụ: resilient"
                                value={newWord}
                                onChange={(e) => setNewWord(e.target.value)}
                                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-on-surface text-sm focus:border-primary focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-on-surface block mb-1">Nghĩa tiếng Việt *</label>
                            <input
                                type="text"
                                required
                                placeholder="Ví dụ: kiên cường, có khả năng phục hồi nhanh"
                                value={newMeaning}
                                onChange={(e) => setNewMeaning(e.target.value)}
                                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-on-surface text-sm focus:border-primary focus:outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs font-bold text-on-surface block mb-1">Phiên âm IPA</label>
                                <input
                                    type="text"
                                    placeholder="/rɪˈzɪl.jənt/"
                                    value={newPhonetic}
                                    onChange={(e) => setNewPhonetic(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-on-surface text-xs focus:border-primary focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-on-surface block mb-1">Từ loại</label>
                                <input
                                    type="text"
                                    placeholder="adjective, noun..."
                                    value={newPos}
                                    onChange={(e) => setNewPos(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-on-surface text-xs focus:border-primary focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-on-surface block mb-1">Câu ví dụ</label>
                            <textarea
                                rows={2}
                                placeholder="Ví dụ: She remained resilient in the face of adversity."
                                value={newExample}
                                onChange={(e) => setNewExample(e.target.value)}
                                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-on-surface text-xs focus:border-primary focus:outline-none"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsAddWordOpen(false)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-on-primary shadow-xs hover:opacity-95 cursor-pointer"
                            >
                                Lưu từ
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </main>
    );
}

export default VocabularyPage;
