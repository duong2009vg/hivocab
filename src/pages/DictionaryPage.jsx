// src/pages/DictionaryPage.jsx
// React Dictionary Page for HiVocab

import React, { useState, useEffect, useRef } from 'react';
import { lookupWord, getRecentSearches, removeRecentSearch, clearRecentSearches } from '../services/dictionary.js';
import { searchAppDatabase } from '../services/supabase.js';
import { playWord } from '../services/audio.js';
import SaveWordModal from '../components/modals/SaveWordModal.jsx';

export function DictionaryPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [status, setStatus] = useState('empty'); // 'empty' | 'loading' | 'result' | 'error'
    const [loadingMessage, setLoadingMessage] = useState('Đang tra cứu từ điển...');
    const [loadingSubMessage, setLoadingSubMessage] = useState('Tra cứu định nghĩa song ngữ và ví dụ thực tế...');
    const [wordResult, setWordResult] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [recentList, setRecentList] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const suggestTimerRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        setRecentList(getRecentSearches());
    }, []);

    // Autocomplete khi gõ
    function handleInputChange(e) {
        const val = e.target.value;
        setSearchTerm(val);

        if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current);

        const trimmed = val.trim();
        if (trimmed.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        suggestTimerRef.current = setTimeout(async () => {
            const matches = await searchAppDatabase(trimmed, 6);
            setSuggestions(matches);
            setShowSuggestions(matches.length > 0);
        }, 150);
    }

    // Tra từ
    async function handleSearch(targetWord = searchTerm) {
        const clean = (targetWord || '').trim();
        if (!clean) return;

        setShowSuggestions(false);
        setStatus('loading');
        setLoadingMessage('Đang tra cứu từ điển...');
        setLoadingSubMessage('Tra cứu định nghĩa song ngữ và ví dụ thực tế...');

        // Progressive Loading
        const t1 = setTimeout(() => {
            setLoadingMessage('Đang phân tích nghĩa từ vựng...');
            setLoadingSubMessage('Đang tổng hợp phiên âm chuẩn, giải nghĩa chi tiết và câu ví dụ...');
        }, 1200);

        const t2 = setTimeout(() => {
            setLoadingMessage('Sắp hoàn tất...');
            setLoadingSubMessage('Đang hoàn thiện nội dung giải nghĩa, vui lòng đợi trong giây lát...');
        }, 6500);

        try {
            const res = await lookupWord(clean);
            if (res) {
                setWordResult(res);
                setStatus('result');
                setRecentList(getRecentSearches());
            } else {
                setErrorMessage(`Không thể tìm thấy thông tin cho từ "${clean}". Vui lòng thử lại.`);
                setStatus('error');
            }
        } catch (err) {
            setErrorMessage('Có lỗi xảy ra trong quá trình tra từ. Vui lòng thử lại.');
            setStatus('error');
        } finally {
            clearTimeout(t1);
            clearTimeout(t2);
        }
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    }

    function handleSelectSuggestion(word) {
        setSearchTerm(word);
        setShowSuggestions(false);
        handleSearch(word);
    }

    function handleCopy(text) {
        navigator.clipboard.writeText(text);
        showToast(`Đã sao chép "${text}"`);
    }

    function showToast(msg) {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 2500);
    }

    function handleDeleteRecent(e, word) {
        e.stopPropagation();
        removeRecentSearch(word);
        setRecentList(getRecentSearches());
    }

    function handleClearAllRecent() {
        clearRecentSearches();
        setRecentList([]);
    }

    return (
        <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-12 pt-6 lg:pt-8 flex flex-col gap-6">
            {/* Header */}
            <header className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[28px]">menu_book</span>
                    <h1 className="text-2xl lg:text-3xl font-bold text-on-surface">Từ điển</h1>
                </div>
            </header>

            {/* Search Input Box */}
            <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[22px]">
                    search
                </span>
                <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Nhập từ, cụm từ hoặc thành ngữ tiếng Anh..."
                    className="w-full pl-12 pr-28 py-4 bg-surface-container-lowest/80 backdrop-blur-[24px] border border-outline-variant/30 rounded-2xl text-on-surface placeholder:text-outline focus:border-primary focus:outline-none text-base md:text-lg transition-colors shadow-sm"
                />

                {searchTerm && (
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setShowSuggestions(false);
                            inputRef.current?.focus();
                        }}
                        className="absolute right-14 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1 rounded-full cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                )}

                <button
                    onClick={() => handleSearch()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-on-primary px-3.5 py-2 rounded-xl text-xs font-bold hover:opacity-95 active:scale-95 transition-all shadow-xs cursor-pointer"
                >
                    Tra từ
                </button>

                {/* Autocomplete Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-outline-variant/30 rounded-2xl shadow-xl overflow-hidden z-30">
                        {suggestions.map((item) => (
                            <div
                                key={item.id || item.word}
                                onClick={() => handleSelectSuggestion(item.word)}
                                className="px-4 py-3 hover:bg-surface-container flex items-center justify-between cursor-pointer border-b border-outline-variant/10 last:border-none"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-on-surface text-sm sm:text-base">{item.word}</span>
                                    {item.pos && (
                                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase font-bold">
                                            {item.pos}
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs text-on-surface-variant truncate max-w-[200px]">
                                    {item.meaning}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Trạng thái: Loading */}
            {status === 'loading' && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="relative w-14 h-14">
                        <div className="w-14 h-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                        <span className="material-symbols-outlined text-primary text-[22px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            menu_book
                        </span>
                    </div>
                    <p className="text-on-surface font-semibold text-base">{loadingMessage}</p>
                    <p className="text-on-surface-variant text-xs">{loadingSubMessage}</p>
                </div>
            )}

            {/* Trạng thái: Lỗi / Không tìm thấy */}
            {status === 'error' && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                    <span className="material-symbols-outlined text-[56px] text-outline">search_off</span>
                    <h3 className="font-bold text-on-surface text-xl">Không tìm thấy từ này</h3>
                    <p className="text-on-surface-variant text-sm max-w-sm">{errorMessage}</p>
                </div>
            )}

            {/* Trạng thái: Kết quả tra từ */}
            {status === 'result' && wordResult && (
                <div className="flex flex-col gap-6 animate-fade-in">
                    {/* Word Header Card */}
                    <div className="glass-card soft-shadow rounded-2xl p-6 md:p-8">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex flex-col gap-2">
                                <div className="flex flex-wrap items-center gap-3">
                                    <h2 className="text-3xl md:text-5xl font-black text-on-surface tracking-tight">
                                        {wordResult.word}
                                    </h2>
                                    {wordResult.cefr && (
                                        <span className="px-2.5 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-primary/10 text-primary border border-primary/20">
                                            {wordResult.cefr}
                                        </span>
                                    )}
                                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-surface-container text-on-surface-variant">
                                        {wordResult.pos || 'từ vựng'}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => handleCopy(wordResult.word)}
                                    title="Sao chép từ"
                                    className="w-10 h-10 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-on-surface transition-all active:scale-95 cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[20px]">content_copy</span>
                                </button>
                                <button
                                    onClick={() => setIsSaveModalOpen(true)}
                                    title="Lưu vào Sổ từ vựng"
                                    className="px-4 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm flex items-center gap-2 shadow hover:opacity-95 active:scale-95 transition-all cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[18px]">bookmark_add</span>
                                    <span>Lưu từ</span>
                                </button>
                            </div>
                        </div>

                        {/* Pronunciation & 1-tap audio button */}
                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-outline-variant/15 flex-wrap">
                            <button
                                onClick={() => playWord(wordResult.word)}
                                className="w-11 h-11 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
                                title="Phát âm tức thì"
                            >
                                <span className="material-symbols-outlined text-[24px]">volume_up</span>
                            </button>
                            {wordResult.phonetic && (
                                <span className="text-base sm:text-lg font-mono text-outline font-semibold">
                                    {wordResult.phonetic.startsWith('/') ? wordResult.phonetic : `/${wordResult.phonetic}/`}
                                </span>
                            )}
                        </div>

                        {/* Quick Meaning Banner */}
                        {(wordResult.meaning || wordResult.viSummary) && (
                            <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/15 flex items-start gap-3">
                                <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">
                                    translate
                                </span>
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary block mb-0.5">
                                        Nghĩa tiếng Việt
                                    </span>
                                    <p className="text-base font-bold text-on-surface">
                                        {wordResult.meaning || wordResult.viSummary}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Senses & Examples List */}
                    <div className="flex flex-col gap-4">
                        <h3 className="font-bold text-xs uppercase tracking-wider text-outline px-1">
                            Chi tiết nghĩa &amp; Ví dụ minh họa
                        </h3>

                        {wordResult.entries?.map((entry, idx) => (
                            <div key={idx} className="glass-card soft-shadow rounded-2xl p-6 flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                                        {idx + 1}
                                    </span>
                                    {entry.pos && (
                                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-primary/10 text-primary border border-primary/20 uppercase">
                                            {entry.pos}
                                        </span>
                                    )}
                                    <span className="font-bold text-base text-on-surface">{entry.meaning}</span>
                                </div>

                                {entry.example && (
                                    <div className="mt-1 p-3 rounded-xl bg-surface-container-low border border-outline-variant/15 flex flex-col gap-1">
                                        <div className="flex items-start gap-2">
                                            <span className="text-primary font-bold text-sm shrink-0">•</span>
                                            <p className="text-sm text-on-surface font-medium leading-relaxed italic">
                                                "{entry.example}"
                                            </p>
                                        </div>
                                        {entry.example_vi && (
                                            <p className="text-xs text-outline pl-4 font-normal">
                                                {entry.example_vi}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Searches */}
            {status === 'empty' && recentList.length > 0 && (
                <div className="flex flex-col gap-3 mt-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-outline uppercase tracking-wider">
                            Từ vừa tra gần đây
                        </span>
                        <button
                            onClick={handleClearAllRecent}
                            className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                        >
                            Xóa lịch sử
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {recentList.map((w) => (
                            <div
                                key={w}
                                onClick={() => {
                                    setSearchTerm(w);
                                    handleSearch(w);
                                }}
                                className="group flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container hover:bg-primary/10 hover:text-primary text-on-surface text-xs font-semibold border border-outline-variant/20 transition-all cursor-pointer"
                            >
                                <span>{w}</span>
                                <button
                                    onClick={(e) => handleDeleteRecent(e, w)}
                                    className="p-0.5 rounded-full hover:bg-rose-500/20 hover:text-rose-500 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[13px] leading-none">close</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Save Word Modal */}
            <SaveWordModal
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                wordData={wordResult}
                onSuccess={(word) => showToast(`Đã lưu "${word}" vào sổ từ vựng!`)}
            />

            {/* Toast notification */}
            {toastMessage && (
                <div className="fixed bottom-24 sm:bottom-8 right-6 z-[120] bg-surface-container-highest text-on-surface border border-outline-variant/40 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce-in text-sm font-bold">
                    <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                    <span>{toastMessage}</span>
                </div>
            )}
        </main>
    );
}

export default DictionaryPage;
