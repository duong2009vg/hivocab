// src/components/dictionary/DictSearchInput.jsx
// Thanh tìm kiếm từ điển với gợi ý kho 70K từ & lịch sử tra cứu

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, History, ArrowRight } from 'lucide-react';
import { searchAppDatabase } from '../../services/supabase.js';

export function DictSearchInput({ onSearch, initialValue = '', recentSearches = [], onSelectRecent }) {
    const [query, setQuery] = useState(initialValue);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        setQuery(initialValue);
    }, [initialValue]);

    // Tìm kiếm gợi ý từ kho 70K từ
    useEffect(() => {
        const trimmed = query.trim();
        if (trimmed.length < 2) {
            setSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            const results = await searchAppDatabase(trimmed, 6);
            setSuggestions(results);
        }, 150);

        return () => clearTimeout(timer);
    }, [query]);

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = (e) => {
        e?.preventDefault();
        setShowSuggestions(false);
        if (query.trim()) {
            onSearch(query.trim());
        }
    };

    const handleSelectSuggestion = (word) => {
        setQuery(word);
        setShowSuggestions(false);
        onSearch(word);
    };

    const handleClear = () => {
        setQuery('');
        setSuggestions([]);
        inputRef.current?.focus();
    };

    return (
        <div ref={containerRef} className="w-full relative">
            <form onSubmit={handleSubmit} className="relative w-full">
                <div className="relative flex items-center">
                    <Search className="absolute left-4 w-5 h-5 text-on-surface-variant pointer-events-none" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder="Nhập từ tiếng Anh để tra cứu (vd: ubiquitous, resilient...)"
                        className="w-full pl-12 pr-24 py-3.5 sm:py-4 bg-surface-container-high/80 focus:bg-surface-container-highest border border-outline-variant/40 focus:border-primary rounded-2xl text-on-surface placeholder:text-on-surface-variant/60 font-medium text-base shadow-xs focus:ring-4 focus:ring-primary/10 transition-all outline-hidden"
                    />
                    <div className="absolute right-3 flex items-center gap-1.5">
                        {query && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={!query.trim()}
                            className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-40 text-on-primary font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1"
                        >
                            <span>Tra từ</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </form>

            {/* Dropdown Gợi ý tự động từ kho 70K từ */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-surface/95 backdrop-blur-xl border border-outline-variant/40 rounded-2xl shadow-xl overflow-hidden z-40 divide-y divide-outline-variant/10">
                    {suggestions.map((item) => (
                        <div
                            key={item.id || item.word}
                            onClick={() => handleSelectSuggestion(item.word)}
                            className="px-4 py-3 hover:bg-surface-container-high flex items-center justify-between gap-3 cursor-pointer transition-colors"
                        >
                            <div className="flex items-baseline gap-2 truncate">
                                <span className="font-bold text-on-surface text-sm sm:text-base">{item.word}</span>
                                {item.phonetic && (
                                    <span className="text-xs text-on-surface-variant font-mono">{item.phonetic}</span>
                                )}
                                {item.meaning && (
                                    <span className="text-xs text-on-surface-variant/80 truncate">· {item.meaning}</span>
                                )}
                            </div>
                            {item.pos && (
                                <span className="px-2 py-0.5 rounded-md bg-surface-container-highest text-[10px] font-semibold text-on-surface-variant uppercase shrink-0">
                                    {item.pos}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Các từ đã tra gần đây */}
            {recentSearches && recentSearches.length > 0 && (
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="text-xs text-on-surface-variant flex items-center gap-1 font-medium">
                        <History className="w-3.5 h-3.5" /> Gần đây:
                    </span>
                    {recentSearches.slice(0, 6).map((item) => (
                        <button
                            key={item}
                            onClick={() => onSelectRecent(item)}
                            className="px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-medium border border-outline-variant/30 transition-colors cursor-pointer"
                        >
                            {item}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default DictSearchInput;
