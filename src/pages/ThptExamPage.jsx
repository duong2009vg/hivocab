// src/pages/ThptExamPage.jsx
// Phòng luyện thi thử THPT Quốc Gia môn Tiếng Anh chuẩn format Bộ GD&ĐT

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { playComplete } from '../services/audio.js';

export function ThptExamPage() {
    const [timeLeft, setTimeLeft] = useState(50 * 60); // 50 phút
    const [isStarted, setIsStarted] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [userAnswers, setUserAnswers] = useState({});
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [score, setScore] = useState(0);

    // 10 câu hỏi mẫu chuẩn dạng đề thi THPT QG
    const sampleQuestions = [
        {
            id: 1,
            question: "Mark the letter A, B, C, or D to indicate the word whose underlined part differs from the other three in pronunciation.",
            options: [
                { key: 'A', text: 'stopp<u>ed</u>' },
                { key: 'B', text: 'look<u>ed</u>' },
                { key: 'C', text: 'watch<u>ed</u>' },
                { key: 'D', text: 'play<u>ed</u>' }
            ],
            correct: 'D',
            explanation: "'played' phát âm đuôi -ed là /d/, còn lại phát âm là /t/."
        },
        {
            id: 2,
            question: "Mark the letter A, B, C, or D to indicate the word that differs from the other three in the position of primary stress.",
            options: [
                { key: 'A', text: 'attract' },
                { key: 'B', text: 'decide' },
                { key: 'C', text: 'borrow' },
                { key: 'D', text: 'agree' }
            ],
            correct: 'C',
            explanation: "'borrow' trọng âm rơi vào âm tiết thứ nhất, các từ còn lại trọng âm rơi vào âm tiết thứ hai."
        },
        {
            id: 3,
            question: "If I _______ you, I would take that opportunity immediately.",
            options: [
                { key: 'A', text: 'am' },
                { key: 'B', text: 'were' },
                { key: 'C', text: 'had been' },
                { key: 'D', text: 'will be' }
            ],
            correct: 'B',
            explanation: "Câu điều kiện loại 2 giả định không có thật ở hiện tại: If + S + were/V-ed, S + would + V."
        },
        {
            id: 4,
            question: "The new highway _______ next month to ease the growing traffic congestion.",
            options: [
                { key: 'A', text: 'will open' },
                { key: 'B', text: 'will be opened' },
                { key: 'C', text: 'opens' },
                { key: 'D', text: 'is opening' }
            ],
            correct: 'B',
            explanation: "Chủ ngữ là vật 'The new highway' nên cần dùng thể bị động trong tương lai: will be + V-pII."
        },
        {
            id: 5,
            question: "Mark the letter A, B, C, or D to indicate the word CLOSEST in meaning to the underlined word: 'She gave a very <u>lucid</u> explanation of the complex process.'",
            options: [
                { key: 'A', text: 'vague' },
                { key: 'B', text: 'clear' },
                { key: 'C', text: 'lengthy' },
                { key: 'D', text: 'confusing' }
            ],
            correct: 'B',
            explanation: "'lucid' = rõ ràng, dễ hiểu = 'clear'."
        },
        {
            id: 6,
            question: "Mark the letter A, B, C, or D to indicate the word OPPOSITE in meaning to the underlined word: 'His sudden resignation came as a complete <u>bolt from the blue</u>.'",
            options: [
                { key: 'A', text: 'expected event' },
                { key: 'B', text: 'pleasant surprise' },
                { key: 'C', text: 'mysterious occurrence' },
                { key: 'D', text: 'unfortunate disaster' }
            ],
            correct: 'A',
            explanation: "'a bolt from the blue' = sét đánh ngang tai, hoàn toàn bất ngờ. Trái nghĩa là 'expected event' (sự việc đã được dự đoán trước)."
        },
        {
            id: 7,
            question: "The company decided to _______ the launch of their new smartphone until market conditions improved.",
            options: [
                { key: 'A', text: 'call off' },
                { key: 'B', text: 'put off' },
                { key: 'C', text: 'turn down' },
                { key: 'D', text: 'give up' }
            ],
            correct: 'B',
            explanation: "'put off' = hoãn lại (delay). 'call off' = hủy bỏ."
        },
        {
            id: 8,
            question: "Neither the teacher nor the students _______ satisfied with the exam results.",
            options: [
                { key: 'A', text: 'was' },
                { key: 'B', text: 'were' },
                { key: 'C', text: 'is' },
                { key: 'D', text: 'has been' }
            ],
            correct: 'B',
            explanation: "Cấu trúc 'Neither S1 nor S2': động từ chia theo chủ ngữ gần nó nhất (the students số nhiều -> were)."
        },
        {
            id: 9,
            question: "David: 'Would you mind helping me carry these books?' - Sarah: '_______'",
            options: [
                { key: 'A', text: 'Yes, I would.' },
                { key: 'B', text: "Not at all, I'd be glad to." },
                { key: 'C', text: "No, you're welcome." },
                { key: 'D', text: 'Never mind.' }
            ],
            correct: 'B',
            explanation: "Đáp lại lời đề nghị lịch sự 'Would you mind...?': 'Not at all' (Không hề phiền gì đâu)."
        },
        {
            id: 10,
            question: "_______ having worked for twelve hours straight, he still volunteered to help clean the lab.",
            options: [
                { key: 'A', text: 'Although' },
                { key: 'B', text: 'Despite' },
                { key: 'C', text: 'Because of' },
                { key: 'D', text: 'Even if' }
            ],
            correct: 'B',
            explanation: "'Despite + V-ing/Noun phrase': mặc dù đã làm việc liên tục 12 tiếng."
        }
    ];

    // Đồng hồ đếm ngược
    useEffect(() => {
        if (!isStarted || isSubmitted) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmitExam();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isStarted, isSubmitted]);

    function formatTime(secs) {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    function handleSelectOption(qId, key) {
        if (isSubmitted) return;
        setUserAnswers((prev) => ({ ...prev, [qId]: key }));
    }

    function handleSubmitExam() {
        let correctCount = 0;
        sampleQuestions.forEach((q) => {
            if (userAnswers[q.id] === q.correct) correctCount++;
        });

        const finalScore = ((correctCount / sampleQuestions.length) * 10).toFixed(1);
        setScore(finalScore);
        setIsSubmitted(true);
        playComplete();

        try {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        } catch (_) {}
    }

    const currentQ = sampleQuestions[currentQIndex];

    if (!isStarted) {
        return (
            <main className="max-w-2xl mx-auto w-full px-4 pt-12 flex flex-col items-center text-center gap-6">
                <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[42px]">school</span>
                </div>
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">Kỳ thi Tốt nghiệp THPT</span>
                    <h1 className="text-2xl sm:text-3xl font-black text-on-surface mt-1">
                        Đề thi Thử Tiếng Anh Chuẩn Cấu Trúc Bộ GD&amp;ĐT
                    </h1>
                    <p className="text-xs sm:text-sm text-on-surface-variant mt-2 leading-relaxed">
                        Bài thi gồm 50 câu trắc nghiệm với thời gian làm bài 50 phút. Hệ thống tính điểm và chấm đáp án chi tiết tức thì.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                    <div className="glass-card p-4 rounded-2xl border border-outline-variant/20">
                        <span className="text-xs font-bold text-outline uppercase block mb-0.5">Số câu hỏi</span>
                        <span className="text-xl font-black text-on-surface">50 câu</span>
                    </div>
                    <div className="glass-card p-4 rounded-2xl border border-outline-variant/20">
                        <span className="text-xs font-bold text-outline uppercase block mb-0.5">Thời gian</span>
                        <span className="text-xl font-black text-on-surface">50 phút</span>
                    </div>
                </div>

                <button
                    onClick={() => setIsStarted(true)}
                    className="px-8 py-3.5 rounded-full bg-primary text-on-primary font-bold text-sm shadow-md hover:opacity-95 active:scale-95 transition-all cursor-pointer"
                >
                    Bắt đầu làm bài thi
                </button>
            </main>
        );
    }

    return (
        <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-12 pt-6 flex flex-col gap-6">
            {/* Top Bar: Title + Timer + Submit */}
            <div className="glass-card soft-shadow rounded-2xl p-4 flex items-center justify-between gap-4 border border-outline-variant/30 flex-wrap">
                <div>
                    <h2 className="font-bold text-base text-on-surface">Đề Thi THPT QG Môn Tiếng Anh</h2>
                    <span className="text-xs text-on-surface-variant">
                        Đã làm: {Object.keys(userAnswers).length} / {sampleQuestions.length} câu
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container font-mono font-bold text-base text-primary border border-outline-variant/30">
                        <span className="material-symbols-outlined text-[18px]">timer</span>
                        <span>{formatTime(timeLeft)}</span>
                    </div>

                    {!isSubmitted ? (
                        <button
                            onClick={handleSubmitExam}
                            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 active:scale-95 transition-all shadow-xs cursor-pointer"
                        >
                            Nộp bài thi
                        </button>
                    ) : (
                        <span className="px-3 py-1 rounded-xl bg-primary text-on-primary font-black text-sm">
                            Điểm: {score}/10
                        </span>
                    )}
                </div>
            </div>

            {/* Main Exam View: Question Box + Question Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Col: Current Question */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                    <div className="glass-card soft-shadow rounded-3xl p-6 sm:p-8 flex flex-col gap-6 border border-outline-variant/30">
                        <div className="flex items-center justify-between border-b border-outline-variant/15 pb-3">
                            <span className="font-black text-primary text-base">
                                Câu hỏi {currentQIndex + 1}
                            </span>
                            <span className="text-xs text-outline font-semibold">
                                {userAnswers[currentQ.id] ? 'Đã chọn đáp án' : 'Chưa trả lời'}
                            </span>
                        </div>

                        {/* Question Text */}
                        <p className="text-base sm:text-lg text-on-surface font-semibold leading-relaxed">
                            {currentQ.question}
                        </p>

                        {/* Options */}
                        <div className="flex flex-col gap-2.5">
                            {currentQ.options.map((opt) => {
                                const isSelected = userAnswers[currentQ.id] === opt.key;
                                const isCorrect = currentQ.correct === opt.key;

                                let optionStyle = 'bg-surface-container-low hover:bg-surface-container border-outline-variant/20';
                                if (isSelected) {
                                    optionStyle = 'bg-primary/10 border-primary text-primary font-bold';
                                }
                                if (isSubmitted) {
                                    if (isCorrect) {
                                        optionStyle = 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold';
                                    } else if (isSelected && !isCorrect) {
                                        optionStyle = 'bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300 font-bold';
                                    }
                                }

                                return (
                                    <div
                                        key={opt.key}
                                        onClick={() => handleSelectOption(currentQ.id, opt.key)}
                                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${optionStyle}`}
                                    >
                                        <span className="w-8 h-8 rounded-full border border-current flex items-center justify-center font-bold text-xs shrink-0">
                                            {opt.key}
                                        </span>
                                        <span
                                            className="text-sm sm:text-base"
                                            dangerouslySetInnerHTML={{ __html: opt.text }}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Explanation (after submission) */}
                        {isSubmitted && (
                            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-xs sm:text-sm leading-relaxed text-on-surface">
                                <span className="font-bold text-primary block mb-1">Giải thích chi tiết:</span>
                                {currentQ.explanation}
                            </div>
                        )}

                        {/* Prev / Next controls */}
                        <div className="flex items-center justify-between pt-4 border-t border-outline-variant/15">
                            <button
                                disabled={currentQIndex <= 0}
                                onClick={() => setCurrentQIndex((i) => i - 1)}
                                className="px-4 py-2 rounded-xl text-xs font-bold border border-outline-variant/30 hover:bg-surface-container disabled:opacity-30 cursor-pointer"
                            >
                                &larr; Câu trước
                            </button>
                            <button
                                disabled={currentQIndex >= sampleQuestions.length - 1}
                                onClick={() => setCurrentQIndex((i) => i + 1)}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-on-primary hover:opacity-95 disabled:opacity-30 cursor-pointer"
                            >
                                Câu tiếp theo &rarr;
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Col: 50-Questions Navigation Grid */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                    <div className="glass-card soft-shadow rounded-3xl p-5 border border-outline-variant/30 flex flex-col gap-4">
                        <h3 className="font-bold text-sm text-on-surface">Bảng trả lời câu hỏi</h3>

                        <div className="grid grid-cols-5 gap-2 select-none">
                            {sampleQuestions.map((q, idx) => {
                                const isCurrent = currentQIndex === idx;
                                const isAnswered = !!userAnswers[q.id];

                                let btnClass = 'bg-surface-container text-on-surface hover:bg-surface-container-high';
                                if (isAnswered) btnClass = 'bg-primary text-on-primary font-bold';
                                if (isCurrent) btnClass += ' ring-2 ring-primary ring-offset-2';

                                if (isSubmitted) {
                                    if (userAnswers[q.id] === q.correct) {
                                        btnClass = 'bg-emerald-500 text-white font-bold';
                                    } else {
                                        btnClass = 'bg-rose-500 text-white font-bold';
                                    }
                                }

                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => setCurrentQIndex(idx)}
                                        className={`h-9 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center ${btnClass}`}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default ThptExamPage;
