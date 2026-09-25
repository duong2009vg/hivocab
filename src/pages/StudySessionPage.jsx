// src/pages/StudySessionPage.jsx
// Phiên luyện tập Flashcard lặp lại ngắt quãng (SRS) cho HiVocab

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { getTopics, getWordsByTopic } from '../services/supabase.js';
import { playCorrect, playIncorrect, playComplete, playWord } from '../services/audio.js';

export function StudySessionPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const topicId = searchParams.get('topic');

    const [words, setWords] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isCompleted, setIsCompleted] = useState(false);
    const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });

    useEffect(() => {
        loadSessionWords();
    }, [topicId]);

    async function loadSessionWords() {
        setLoading(true);
        try {
            let sessionWords = [];
            if (topicId) {
                const res = await getWordsByTopic(topicId, 1, 25);
                sessionWords = res.words || [];
            } else {
                const topics = await getTopics();
                if (topics.length > 0) {
                    const res = await getWordsByTopic(topics[0].id, 1, 20);
                    sessionWords = res.words || [];
                }
            }

            // Xáo trộn ngẫu nhiên danh sách từ
            sessionWords = [...sessionWords].sort(() => Math.random() - 0.5);
            setWords(sessionWords);
            setCurrentIndex(0);
            setIsFlipped(false);
            setIsCompleted(false);
            setSessionStats({ correct: 0, total: sessionWords.length });
        } catch (_) {}
        finally {
            setLoading(false);
        }
    }

    const currentWord = words[currentIndex] || null;

    // Tự động phát âm từ khi đổi sang thẻ mới
    useEffect(() => {
        if (currentWord?.word) {
            setIsFlipped(false);
            const timer = setTimeout(() => {
                playWord(currentWord.word);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [currentIndex, currentWord]);

    function handleRate(rating) {
        // rating: 'hard' | 'good' | 'easy'
        if (rating === 'hard') {
            playIncorrect();
        } else {
            playCorrect();
            setSessionStats((s) => ({ ...s, correct: s.correct + 1 }));
        }

        if (currentIndex + 1 < words.length) {
            setCurrentIndex((i) => i + 1);
            setIsFlipped(false);
        } else {
            // Hoàn thành phiên học
            setIsCompleted(true);
            playComplete();
            try {
                confetti({
                    particleCount: 80,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            } catch (_) {}
        }
    }

    if (loading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <p className="text-sm text-on-surface-variant font-medium">Đang chuẩn bị thẻ từ ôn tập...</p>
            </div>
        );
    }

    if (words.length === 0) {
        return (
            <main className="max-w-md mx-auto w-full px-4 pt-16 flex flex-col items-center text-center gap-4">
                <span className="material-symbols-outlined text-[64px] text-outline">school</span>
                <h2 className="text-xl font-bold text-on-surface">Chưa có từ để ôn tập</h2>
                <p className="text-xs text-on-surface-variant">
                    Chủ đề này chưa có từ vựng hoặc bạn chưa tạo chủ đề nào. Hãy thêm từ vào sổ để bắt đầu ôn tập.
                </p>
                <button
                    onClick={() => navigate('/vocabulary')}
                    className="mt-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-xs shadow-xs hover:opacity-95 cursor-pointer"
                >
                    Đi đến Sổ từ vựng
                </button>
            </main>
        );
    }

    if (isCompleted) {
        const accuracy = Math.round((sessionStats.correct / (sessionStats.total || 1)) * 100);

        return (
            <main className="max-w-md mx-auto w-full px-4 pt-12 flex flex-col items-center text-center gap-6 animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-[42px]">check_circle</span>
                </div>

                <div>
                    <h2 className="text-2xl font-black text-on-surface">Xuất sắc! Hoàn thành phiên học</h2>
                    <p className="text-xs text-on-surface-variant mt-1">
                        Bạn vừa ôn tập {sessionStats.total} từ vựng theo thuật toán lặp lại ngắt quãng.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full">
                    <div className="glass-card p-4 rounded-2xl border border-outline-variant/20">
                        <span className="text-xs font-bold text-outline uppercase block mb-1">Số từ ôn tập</span>
                        <span className="text-2xl font-black text-on-surface">{sessionStats.total}</span>
                    </div>
                    <div className="glass-card p-4 rounded-2xl border border-outline-variant/20">
                        <span className="text-xs font-bold text-outline uppercase block mb-1">Độ chính xác</span>
                        <span className="text-2xl font-black text-emerald-500">{accuracy}%</span>
                    </div>
                </div>

                <div className="flex flex-col gap-2 w-full pt-2">
                    <button
                        onClick={loadSessionWords}
                        className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
                    >
                        Ôn tập lượt tiếp theo
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-2.5 rounded-xl border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container font-semibold text-xs transition-colors cursor-pointer"
                    >
                        Trở về Trang chủ
                    </button>
                </div>
            </main>
        );
    }

    const progressPercent = Math.round(((currentIndex + 1) / words.length) * 100);

    return (
        <main className="max-w-xl mx-auto w-full px-4 sm:px-6 pt-6 flex flex-col gap-6">
            {/* Top Bar: Back & Progress */}
            <div className="flex items-center justify-between gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="w-9 h-9 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-on-surface transition-transform active:scale-95 cursor-pointer"
                >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                </button>

                <div className="flex-1 max-w-xs flex flex-col gap-1">
                    <div className="flex justify-between text-[11px] font-bold text-on-surface-variant">
                        <span>Thẻ {currentIndex + 1} / {words.length}</span>
                        <span>{progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300 rounded-full"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                <button
                    onClick={() => playWord(currentWord?.word)}
                    className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
                    title="Phát âm lại"
                >
                    <span className="material-symbols-outlined text-[20px]">volume_up</span>
                </button>
            </div>

            {/* Flashcard Component */}
            <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full min-h-[340px] sm:min-h-[380px] glass-card soft-shadow rounded-3xl p-6 sm:p-8 flex flex-col justify-between items-center text-center cursor-pointer border border-outline-variant/30 hover:border-primary/40 transition-all select-none relative overflow-hidden"
            >
                <div className="w-full flex items-center justify-between text-xs text-outline font-semibold">
                    <span>{currentWord?.pos ? `[ ${currentWord.pos} ]` : ''}</span>
                    <span className="text-[11px] text-primary font-bold">
                        {isFlipped ? 'Mặt sau (Nghĩa & Ví dụ)' : 'Chạm để lật thẻ ↻'}
                    </span>
                </div>

                {/* Card Content */}
                {!isFlipped ? (
                    /* MẶT TRƯỚC: TỪ VỰNG & PHIÊN ÂM */
                    <div className="flex flex-col items-center justify-center gap-3 my-auto animate-fade-in">
                        <h2 className="text-3xl sm:text-5xl font-black text-on-surface tracking-tight">
                            {currentWord?.word}
                        </h2>
                        {currentWord?.phonetic && (
                            <span className="text-sm sm:text-base font-mono text-outline font-semibold">
                                {currentWord.phonetic}
                            </span>
                        )}
                        <span className="mt-4 px-3 py-1 rounded-full text-xs font-semibold bg-surface-container text-on-surface-variant flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px]">touch_app</span>
                            Nhấn để xem nghĩa tiếng Việt
                        </span>
                    </div>
                ) : (
                    /* MẶT SAU: NGHĨA & VÍ DỤ */
                    <div className="flex flex-col items-center justify-center gap-4 my-auto animate-fade-in max-w-md">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">Nghĩa tiếng Việt</span>
                        <p className="text-xl sm:text-2xl font-bold text-on-surface leading-snug">
                            {currentWord?.meaning}
                        </p>

                        {currentWord?.example_sentence && (
                            <div className="mt-2 p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/15 text-xs sm:text-sm text-outline italic leading-relaxed">
                                "{currentWord.example_sentence}"
                            </div>
                        )}
                    </div>
                )}

                <div className="text-[11px] text-outline">
                    {isFlipped ? 'Chọn mức độ ghi nhớ của bạn bên dưới' : 'Nhấn vào thẻ để kiểm tra nghĩa'}
                </div>
            </div>

            {/* SRS Review Action Buttons */}
            <div className="grid grid-cols-3 gap-2.5">
                <button
                    onClick={() => handleRate('hard')}
                    className="py-3 px-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all cursor-pointer"
                >
                    <span className="material-symbols-outlined text-[18px]">sentiment_dissatisfied</span>
                    <span>Khó</span>
                </button>

                <button
                    onClick={() => handleRate('good')}
                    className="py-3 px-2 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all cursor-pointer"
                >
                    <span className="material-symbols-outlined text-[18px]">sentiment_neutral</span>
                    <span>Vừa</span>
                </button>

                <button
                    onClick={() => handleRate('easy')}
                    className="py-3 px-2 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all cursor-pointer"
                >
                    <span className="material-symbols-outlined text-[18px]">sentiment_very_satisfied</span>
                    <span>Dễ</span>
                </button>
            </div>
        </main>
    );
}

export default StudySessionPage;
