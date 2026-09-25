// src/services/session.js
// Quản lý hàng đợi và tiến trình phiên học Flashcard & Luyện tập HiVocab

import { calculateNextReview } from './srs.js';

export class StudySessionEngine {
    constructor(words = [], options = {}) {
        this.rawWords = words;
        this.options = options;
        this.queue = [];
        this.currentIndex = 0;
        this.completed = [];
        this.history = [];
        this.startTime = Date.now();
        this.initQueue();
    }

    initQueue() {
        // Xáo trộn ngẫu nhiên danh sách từ
        const shuffled = [...this.rawWords].sort(() => Math.random() - 0.5);
        this.queue = shuffled.map((word, idx) => ({
            id: word.id || `temp-${idx}`,
            word: word,
            attempts: 0,
            ratings: [],
            isPassed: false,
        }));
        this.currentIndex = 0;
        this.completed = [];
    }

    getCurrentItem() {
        if (this.currentIndex >= this.queue.length) return null;
        return this.queue[this.currentIndex];
    }

    /**
     * Ghi nhận kết quả đánh giá (hard / good / easy)
     * @param {'hard'|'good'|'easy'} rating
     */
    submitRating(rating) {
        const current = this.getCurrentItem();
        if (!current) return { isDone: true };

        current.attempts += 1;
        current.ratings.push(rating);

        const currentLevel = current.word.word_progress?.level ?? current.word.level ?? 0;
        const srsCalculation = calculateNextReview(currentLevel, rating);

        const record = {
            wordId: current.word.id,
            word: current.word.word,
            rating,
            attempts: current.attempts,
            previousLevel: currentLevel,
            ...srsCalculation
        };

        this.history.push(record);

        if (rating === 'hard') {
            // Nếu đánh giá 'hard', đẩy từ về cuối hàng đợi để học lại trong phiên này
            const retestItem = { ...current, attempts: current.attempts };
            this.queue.push(retestItem);
        } else {
            // 'good' hoặc 'easy' coi như hoàn thành từ này
            current.isPassed = true;
            this.completed.push(record);
        }

        this.currentIndex += 1;

        const isDone = this.currentIndex >= this.queue.length;
        return {
            isDone,
            record,
            nextItem: this.getCurrentItem(),
            progress: this.getProgress()
        };
    }

    getProgress() {
        const total = this.rawWords.length;
        const passedCount = this.completed.length;
        const percent = total > 0 ? Math.round((passedCount / total) * 100) : 0;

        return {
            total,
            completed: passedCount,
            remaining: Math.max(0, total - passedCount),
            currentIndex: this.currentIndex,
            queueLength: this.queue.length,
            percent
        };
    }

    getSummary() {
        const durationSeconds = Math.round((Date.now() - this.startTime) / 1000);
        const easyCount = this.history.filter(h => h.rating === 'easy').length;
        const goodCount = this.history.filter(h => h.rating === 'good').length;
        const hardCount = this.history.filter(h => h.rating === 'hard').length;

        return {
            totalWords: this.rawWords.length,
            completedWords: this.completed.length,
            durationSeconds,
            easyCount,
            goodCount,
            hardCount,
            history: this.history
        };
    }
}

export function createStudySession(words, options) {
    return new StudySessionEngine(words, options);
}

export default StudySessionEngine;
