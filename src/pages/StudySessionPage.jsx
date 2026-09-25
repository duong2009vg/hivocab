// src/pages/StudySessionPage.jsx
// Phiên luyện tập Flashcard lặp lại ngắt quãng (SRS SM-2) cho HiVocab

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { getTopics, getWordsByTopic, getWordsDueForReview, reviewWord } from '../services/supabase.js';
import { calculateNextReview, getIntervalLabel } from '../services/srs.js';
import { playCorrect, playIncorrect, playComplete, playWord } from '../services/audio.js';
import { Volume2, ArrowLeft, RotateCw, CheckCircle2, Award, Zap, Brain } from 'lucide-react';

export function StudySessionPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const topicId = searchParams.get('topic');

    const [words, setWords] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isCompleted, setIsCompleted] = useState(false);
    const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0, hardCount: 0, easyCount: 0 });

    useEffect(() => {
        loadSessionWords();
    }, [topicId]);

    async function loadSessionWords() {
        setLoading(true);
        try {
            let sessionWords = [];
            if (topicId) {
                const res = await getWordsByTopic(topicId, 1, 30);
                sessionWords = res.words || [];
            } else {
                // Ưu tiên các từ đến hạn ôn tập hôm nay
                sessionWords = await getWordsDueForReview(25);
                if (sessionWords.length === 0) {
                    const topics = await getTopics();
                    if (topics.length > 0) {
                        const res = await getWordsByTopic(topics[0].id, 1, 20);
                        sessionWords = res.words || [];
                    }
                }
            }

            // Xáo trộn ngẫu nhiên danh sách từ
            sessionWords = [...sessionWords].sort(() => Math.random() - 0.5);
            setWords(sessionWords);
            setCurrentIndex(0);
            setIsFlipped(false);
            setIsCompleted(false);
            setSessionStats({ correct: 0, total: sessionWords.length, hardCount: 0, easyCount: 0 });
        } catch (_) {}
        finally {
            setLoading(false);
        }
    }

    const currentWord = words[currentIndex] || null;
    const currentLevel = currentWord?.level ?? currentWord?.word_progress?.level ?? 0;

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

    async function handleRate(rating) {
        // rating: 'hard' | 'good' | 'easy'
        if (rating === 'hard') {
            playIncorrect();
            setSessionStats(s => ({ ...s, hardCount: s.hardCount + 1 }));
        } else {
            playCorrect();
            setSessionStats(s => ({
                ...s,
                correct: s.correct + 1,
                easyCount: rating === 'easy' ? s.easyCount + 1 : s.easyCount
            }));
        }

        // Lưu kết quả SM-2 vào Supabase thật
        if (currentWord?.id) {
            try {
                await reviewWord(currentWord.id, rating);
            } catch (e) {
                console.warn('Lỗi ghi nhận kết quả ôn từ:', e);
            }
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
                    particleCount: 100,
                    spread: 80,
                    origin: { y: 0.6 }
                });
            } catch (_) {}
        }
    }

    if (loading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <p className="text-sm text-on-surface-variant font-medium">Đang chuẩn bị bộ thẻ ôn tập thông minh...</p>
            </div>
        );
    }

    if (words.length === 0) {
        return (
            <main className="max-w-md mx-auto w-full px-4 pt-16 flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                    <Brain className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-on-surface">Chưa có từ đến hạn ôn tập</h2>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                    Bạn đã hoàn thành các từ cần ôn hôm nay, hoặc chủ đề này chưa có từ vựng. Bạn có thể thêm từ mới vào sổ để tiếp tục.
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
                <div className="w-20 h-20 rounded-3xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shadow-lg border border-emerald-500/30">
                    <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                    <h2 className="text-2xl font-black text-on-surface tracking-tight">Xuất sắc! Hoàn thành phiên ôn tập</h2>
                    <p className="text-xs text-on-surface-variant">
                        Bạn vừa ôn luyện {sessionStats.total} từ vựng theo thuật toán lặp lại ngắt quãng SM-2.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full">
                    <div className="bg-surface-container-high/60 p-4 rounded-2xl border border-outline-variant/20">
                        <span className="text-[11px] font-bold text-on-surface-variant uppercase block mb-1">Số từ ôn tập</span>
                        <span className="text-2xl font-black text-on-surface">{sessionStats.total}</span>
                    </div>
                    <div className="bg-surface-container-high/60 p-4 rounded-2xl border border-outline-variant/20">
                        <span className="text-[11px] font-bold text-on-surface-variant uppercase block mb-1">Độ ghi nhớ</span>
                        <span className="text-2xl font-black text-emerald-500">{accuracy}%</span>
                    </div>
                </div>

                <div className="flex flex-col gap-2.5 w-full pt-2">
                    <button
                        onClick={loadSessionWords}
                        className="w-full py-3.5 rounded-2xl bg-primary text-on-primary font-bold text-sm shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                        <RotateCw className="w-4 h-4" />
                        <span>Ôn tập lượt tiếp theo</span>
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-3 rounded-2xl border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container font-bold text-xs transition-colors cursor-pointer"
                    >
                        Trở về Trang chủ
                    </button>
                </div>
            </main>
        );
    }

    const progressPercent = Math.round(((currentIndex + 1) / words.length) * 100);

    return (
        <main className="max-w-lg mx-auto w-full px-4 pt-6 pb-12 flex flex-col gap-5">
            {/* Top Bar Navigation & Progress */}
            <div className="flex items-center justify-between gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer"
                    title="Thoát phiên học"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="flex-1 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-on-surface-variant">
                        <span>Thẻ {currentIndex + 1} / {words.length}</span>
                        <span>{progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300 rounded-full"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Flashcard Component 3D Flip */}
            <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full min-h-[360px] sm:min-h-[400px] bg-surface-container-lowest/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 flex flex-col justify-between items-center text-center cursor-pointer border border-outline-variant/30 hover:border-primary/40 shadow-lg transition-all select-none relative overflow-hidden group"
            >
                <div className="w-full flex items-center justify-between text-xs text-on-surface-variant font-medium">
                    <span className="font-mono">{currentWord?.pos ? `[ ${currentWord.pos} ]` : ''}</span>
                    <span className="text-[11px] text-primary font-bold flex items-center gap-1">
                        <RotateCw className="w-3.5 h-3.5" />
                        {isFlipped ? 'Mặt sau (Nghĩa)' : 'Chạm để lật thẻ'}
                    </span>
                </div>

                {/* Card Content */}
                {!isFlipped ? (
                    /* MẶT TRƯỚC: TỪ VỰNG & PHIÊN ÂM */
                    <div className="flex flex-col items-center justify-center gap-3 my-auto animate-fade-in">
                        <h2 className="text-3xl sm:text-5xl font-black text-on-surface tracking-tight group-hover:text-primary transition-colors">
                            {currentWord?.word}
                        </h2>
                        {currentWord?.phonetic && (
                            <span className="text-sm sm:text-base font-mono text-on-surface-variant font-medium">
                                {currentWord.phonetic}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                playWord(currentWord?.word);
                            }}
                            className="mt-3 p-3 rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all cursor-pointer"
                        >
                            <Volume2 className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    /* MẶT SAU: NGHĨA & VÍ DỤ */
                    <div className="flex flex-col items-center justify-center gap-4 my-auto animate-fade-in max-w-md">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">Nghĩa tiếng Việt</span>
                        <p className="text-xl sm:text-2xl font-bold text-on-surface leading-snug">
                            {currentWord?.meaning}
                        </p>

                        {currentWord?.example_sentence && (
                            <div className="mt-2 p-3.5 rounded-2xl bg-surface-container-high/60 border border-outline-variant/20 text-xs sm:text-sm text-on-surface-variant italic leading-relaxed">
                                "{currentWord.example_sentence}"
                            </div>
                        )}
                    </div>
                )}

                <div className="text-[11px] text-on-surface-variant/70">
                    {isFlipped ? 'Đánh giá mức độ ghi nhớ để lập lịch ôn tập tiếp theo' : 'Nhấn vào thẻ để kiểm tra nghĩa'}
                </div>
            </div>

            {/* SRS Review Action Buttons */}
            <div className="grid grid-cols-3 gap-3">
                <button
                    onClick={() => handleRate('hard')}
                    className="py-3.5 px-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                >
                    <span className="font-black text-sm">Khó</span>
                    <span className="text-[10px] opacity-75 font-normal">Ôn sau 1 giờ</span>
                </button>

                <button
                    onClick={() => handleRate('good')}
                    className="py-3.5 px-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                >
                    <span className="font-black text-sm">Vừa</span>
                    <span className="text-[10px] opacity-75 font-normal">Ôn theo lịch</span>
                </button>

                <button
                    onClick={() => handleRate('easy')}
                    className="py-3.5 px-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                >
                    <span className="font-black text-sm">Dễ</span>
                    <span className="text-[10px] opacity-75 font-normal">Tăng cấp nhớ</span>
                </button>
            </div>
        </main>
    );
}

export default StudySessionPage;
