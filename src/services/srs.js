// src/services/srs.js
// Thuật toán lặp lại ngắt quãng SM-2 tùy chỉnh cho HiVocab

export const MEMORY_LEVELS = {
    0: { id: 0, name: 'Chưa học', color: 'text-slate-500 bg-slate-500/10 border-slate-500/20', label: 'Chưa học', interval: '0' },
    1: { id: 1, name: 'Mới học', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20', label: 'Cấp 1', interval: '1 giờ' },
    2: { id: 2, name: 'Nhận biết', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', label: 'Cấp 2', interval: '8 giờ' },
    3: { id: 3, name: 'Ghi nhớ', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20', label: 'Cấp 3', interval: '24 giờ' },
    4: { id: 4, name: 'Thành thạo', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', label: 'Cấp 4', interval: '5–7 ngày' },
    5: { id: 5, name: 'Khắc sâu', color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20', label: 'Cấp 5', interval: '15–30 ngày' },
};

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/**
 * Tính khoảng cách ôn tập (ms) dựa trên cấp độ nhớ
 */
export function getIntervalMs(level) {
    switch (level) {
        case 0: return HOUR;
        case 1: return HOUR;
        case 2: return 8 * HOUR;
        case 3: return DAY;
        case 4: return (5 + Math.random() * 2) * DAY;
        case 5: return (15 + Math.random() * 15) * DAY;
        default: return HOUR;
    }
}

/**
 * Trả về nhãn mô tả thời gian ôn kế tiếp
 */
export function getIntervalLabel(level) {
    switch (level) {
        case 0: return 'Chưa học';
        case 1: return '1 giờ';
        case 2: return '8 giờ';
        case 3: return '24 giờ';
        case 4: return '5–7 ngày';
        case 5: return '15–30 ngày';
        default: return 'N/A';
    }
}

/**
 * Tính cấp độ mới và thời điểm ôn tiếp theo
 * @param {number} currentLevel - 0 đến 5
 * @param {'easy'|'good'|'hard'} rating
 */
export function calculateNextReview(currentLevel = 0, rating = 'good') {
    let newLevel = currentLevel;

    if (currentLevel === 0) {
        // Từ mới: luôn lên cấp 1 khi bắt đầu học
        newLevel = 1;
    } else if (rating === 'easy') {
        newLevel = Math.min(currentLevel + 1, 5);
    } else if (rating === 'hard') {
        newLevel = Math.max(currentLevel - 1, 1);
    }
    // 'good' -> giữ nguyên level

    const intervalMs = getIntervalMs(newLevel);
    const nextReviewAt = new Date(Date.now() + intervalMs);

    return {
        newLevel,
        nextReviewAt,
        intervalMs,
        intervalLabel: getIntervalLabel(newLevel)
    };
}

/**
 * Lọc danh sách các từ đã đến hạn ôn tập hoặc chưa học
 */
export function filterDueWords(words = []) {
    const now = Date.now();
    return words.filter(w => {
        const level = w.word_progress?.level ?? w.level ?? 0;
        if (level === 0) return true; // Từ mới chưa học

        const nextReviewStr = w.word_progress?.next_review_at ?? w.next_review_at;
        if (!nextReviewStr) return true;

        const nextReviewTime = new Date(nextReviewStr).getTime();
        return nextReviewTime <= now;
    });
}

/**
 * Thống kê số lượng từ theo 5 cấp độ nhớ
 */
export function getMemoryDistribution(words = []) {
    const dist = { lv0: 0, lv1: 0, lv2: 0, lv3: 0, lv4: 0, lv5: 0, total: words.length };
    words.forEach(w => {
        const level = w.word_progress?.level ?? w.level ?? 0;
        const key = `lv${Math.min(Math.max(level, 0), 5)}`;
        dist[key] = (dist[key] || 0) + 1;
    });
    return dist;
}
