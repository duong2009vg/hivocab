// src/components/dictionary/DictCard.jsx
// Thẻ hiển thị chi tiết từ vựng tra cứu chuẩn học thuật

import React from 'react';
import { Bookmark, Sparkles, BookOpen } from 'lucide-react';
import DictAudioBtn from './DictAudioBtn.jsx';

export function DictCard({ wordData, onSave }) {
    if (!wordData) return null;

    const {
        word,
        phonetic,
        pos,
        cefr,
        meanings = [],
        examples = [],
        meaning
    } = wordData;

    // CEFR badge styling
    const getCefrBadge = (level) => {
        if (!level) return null;
        const colors = {
            A1: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
            A2: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
            B1: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            B2: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
            C1: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
            C2: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
        };
        const colorClass = colors[level.toUpperCase()] || 'bg-primary/10 text-primary border-primary/20';

        return (
            <span className={`px-2.5 py-0.5 rounded-lg border text-xs font-black uppercase tracking-wider ${colorClass}`}>
                {level}
            </span>
        );
    };

    return (
        <div className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden transition-all animate-fade-in">
            {/* Header: Word, Phonetic, CEFR, POS, Audio, Save Button */}
            <div className="flex items-start justify-between gap-4 pb-6 border-b border-outline-variant/20">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-3xl sm:text-4xl font-black text-on-surface tracking-tight">
                            {word}
                        </h2>
                        {getCefrBadge(cefr)}
                        {pos && (
                            <span className="px-3 py-1 rounded-xl bg-surface-container-high text-on-surface-variant font-bold text-xs uppercase tracking-wider border border-outline-variant/20">
                                {pos}
                            </span>
                        )}
                    </div>
                    {phonetic && (
                        <p className="text-base text-on-surface-variant font-mono font-medium">
                            {phonetic}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <DictAudioBtn word={word} />
                    <button
                        onClick={onSave}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary/90 font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
                    >
                        <Bookmark className="w-4 h-4" />
                        <span className="hidden sm:inline">Lưu từ</span>
                    </button>
                </div>
            </div>

            {/* Meanings & Definitions */}
            <div className="py-6 space-y-4">
                <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span>Ý nghĩa & Định nghĩa</span>
                </h3>

                {meanings.length > 0 ? (
                    <div className="space-y-4">
                        {meanings.map((m, idx) => (
                            <div key={idx} className="flex items-start gap-3 bg-surface-container-high/40 p-4 rounded-2xl border border-outline-variant/20">
                                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                    {idx + 1}
                                </span>
                                <div className="space-y-1.5 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-bold text-on-surface text-base">
                                            {m.definition_vi || m.meaning}
                                        </p>
                                        {m.grammar && (
                                            <span className="text-[11px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                                {m.grammar}
                                            </span>
                                        )}
                                    </div>
                                    {m.definition_en && (
                                        <p className="text-sm text-on-surface-variant leading-relaxed">
                                            {m.definition_en}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : meaning ? (
                    <div className="bg-surface-container-high/40 p-4 rounded-2xl border border-outline-variant/20">
                        <p className="font-bold text-on-surface text-base">{meaning}</p>
                    </div>
                ) : null}
            </div>

            {/* Examples */}
            {examples.length > 0 && (
                <div className="pt-2 border-t border-outline-variant/20 space-y-3">
                    <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Câu ví dụ thực tế</span>
                    </h3>

                    <div className="space-y-2.5">
                        {examples.map((ex, idx) => (
                            <div key={idx} className="bg-surface-container-high/30 p-3.5 rounded-xl border border-outline-variant/15 text-sm space-y-1">
                                <p className="text-on-surface font-medium leading-relaxed">
                                    "{ex.en || ex.example || ex}"
                                </p>
                                {(ex.vi || ex.example_vi) && (
                                    <p className="text-xs text-on-surface-variant/90 leading-relaxed italic">
                                        {ex.vi || ex.example_vi}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default DictCard;
