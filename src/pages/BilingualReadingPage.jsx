// src/pages/BilingualReadingPage.jsx
// Chế độ đọc song ngữ & Đọc chủ động (Active Reading) cho HiVocab

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { playWord } from '../services/audio.js';

export function BilingualReadingPage() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('bilingual'); // 'bilingual' | 'en' | 'vi'
    const [revealedParas, setRevealedParas] = useState(new Set());
    const [selectedWord, setSelectedWord] = useState(null);

    // Mẫu bài đọc IELTS chất lượng cao
    const samplePassage = {
        title: 'The Secret Life of Urban Trees',
        topic: 'IELTS Academic Reading • Cambridge 19',
        paragraphs: [
            {
                en: "Trees in cities face unprecedented environmental challenges, from compacted soil and limited root space to air pollution and artificial light. Despite these harsh conditions, urban trees provide vital ecosystem services, lowering street temperatures by several degrees through shade and transpiration.",
                vi: "Cây xanh ở các đô thị đối mặt với những thách thức môi trường chưa từng có, từ đất bị nén chặt và không gian rễ hạn chế cho đến ô nhiễm không khí và ánh sáng nhân tạo. Dẫu trong những điều kiện khắc nghiệt đó, cây đô thị vẫn đem lại các dịch vụ sinh thái thiết yếu, làm giảm nhiệt độ đường phố vài độ thông qua bóng râm và quá trình thoát hơi nước."
            },
            {
                en: "Recent ecological research indicates that urban trees can alter their biological rhythms in response to city environments. Many urban species extend their photosynthetic periods deeper into the autumn due to artificial street lighting and the urban heat island effect, demonstrating remarkable evolutionary adaptability.",
                vi: "Các nghiên cứu sinh thái gần đây chỉ ra rằng cây đô thị có thể thay đổi nhịp sinh học của chúng để thích ứng với môi trường thành phố. Nhiều loài kéo dài thời kỳ quang hợp sâu hơn vào mùa thu do ánh sáng đèn đường nhân tạo và hiệu ứng đảo nhiệt đô thị, chứng minh khả năng thích nghi tiến hóa vượt trội."
            },
            {
                en: "Urban foresters are now deploying smart sensors to monitor sap flow and soil moisture in real time. This precision forestry approach enables municipal planners to optimize irrigation schedules and strategically select climate-resilient species for future streetscapes.",
                vi: "Các chuyên gia quản lý rừng đô thị hiện đang triển khai các cảm biến thông minh để theo dõi dòng nhựa cây và độ ẩm của đất theo thời gian thực. Hướng tiếp cận lâm nghiệp chính xác này cho phép các nhà quy hoạch đô thị tối ưu hóa lịch tưới tiêu và chủ động chọn lọc những giống cây chống chịu tốt với khí hậu cho cảnh quan đường phố tương lai."
            }
        ]
    };

    function togglePara(idx) {
        setRevealedParas((prev) => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    }

    function toggleAll(reveal) {
        if (reveal) {
            setRevealedParas(new Set(samplePassage.paragraphs.map((_, i) => i)));
        } else {
            setRevealedParas(new Set());
        }
    }

    function handleWordClick(rawWord) {
        const clean = rawWord.replace(/[^a-zA-Z]/g, '').trim();
        if (clean) {
            setSelectedWord(clean);
            playWord(clean);
        }
    }

    return (
        <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-12 pt-6 lg:pt-8 flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/15">
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                        {samplePassage.topic}
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black text-on-surface mt-0.5">
                        {samplePassage.title}
                    </h1>
                </div>

                {/* View Mode controls */}
                <div className="flex items-center gap-2 select-none">
                    <div className="bg-surface-container p-1 rounded-xl flex items-center gap-1 border border-outline-variant/20">
                        <button
                            onClick={() => setViewMode('bilingual')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                viewMode === 'bilingual' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant'
                            }`}
                        >
                            Song ngữ
                        </button>
                        <button
                            onClick={() => setViewMode('en')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                viewMode === 'en' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant'
                            }`}
                        >
                            Chỉ tiếng Anh
                        </button>
                    </div>

                    {viewMode === 'bilingual' && (
                        <button
                            onClick={() => toggleAll(revealedParas.size === 0)}
                            className="px-3 py-1.5 rounded-xl border border-outline-variant/40 bg-surface-container text-xs font-semibold hover:bg-surface-container-high transition-colors cursor-pointer"
                        >
                            {revealedParas.size === 0 ? 'Mở tất cả' : 'Che bản dịch'}
                        </button>
                    )}
                </div>
            </div>

            {/* Reading Content */}
            <div className="flex flex-col gap-6">
                {samplePassage.paragraphs.map((p, idx) => {
                    const isRevealed = revealedParas.has(idx);

                    // Tách từng từ tiếng Anh thành span có thể bấm tra nhanh
                    const words = p.en.split(' ');

                    return (
                        <div
                            key={idx}
                            className="glass-card soft-shadow rounded-2xl p-6 flex flex-col gap-4 border border-outline-variant/20 hover:border-primary/30 transition-all"
                        >
                            {/* English Paragraph */}
                            <p className="text-base sm:text-lg text-on-surface font-medium leading-relaxed">
                                {words.map((w, wIdx) => (
                                    <span
                                        key={wIdx}
                                        onClick={() => handleWordClick(w)}
                                        className="hover:text-primary hover:bg-primary/10 rounded px-0.5 cursor-pointer transition-colors"
                                    >
                                        {w}{' '}
                                    </span>
                                ))}
                            </p>

                            {/* Vietnamese Translation (Curtain Mode) */}
                            {viewMode !== 'en' && (
                                <div
                                    onClick={() => togglePara(idx)}
                                    className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
                                        isRevealed
                                            ? 'bg-primary/5 border-primary/20 text-on-surface'
                                            : 'bg-surface-container/60 border-outline-variant/20 text-on-surface-variant/40 blur-[4px] hover:blur-none'
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary mb-1">
                                        <span className="material-symbols-outlined text-[16px]">translate</span>
                                        <span>Bản dịch đối ứng (Đoạn {idx + 1})</span>
                                        {!isRevealed && <span className="text-[11px] text-outline font-normal">(Chạm để mở)</span>}
                                    </div>
                                    <p className="text-sm font-medium leading-relaxed">{p.vi}</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Selected Word Popup Footer */}
            {selectedWord && (
                <div className="fixed bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-surface-container-highest border border-outline-variant/40 p-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-fade-in max-w-sm w-full mx-4">
                    <button
                        onClick={() => playWord(selectedWord)}
                        className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 cursor-pointer active:scale-90"
                    >
                        <span className="material-symbols-outlined text-[20px]">volume_up</span>
                    </button>
                    <div className="flex-1 min-w-0">
                        <span className="font-extrabold text-base text-on-surface block truncate">{selectedWord}</span>
                        <span className="text-xs text-on-surface-variant font-medium">Chạm để nghe phát âm</span>
                    </div>
                    <button
                        onClick={() => navigate(`/dictionary?q=${encodeURIComponent(selectedWord)}`)}
                        className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 cursor-pointer"
                    >
                        Xem chi tiết &rarr;
                    </button>
                    <button
                        onClick={() => setSelectedWord(null)}
                        className="p-1 rounded-full text-outline hover:text-on-surface cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                </div>
            )}
        </main>
    );
}

export default BilingualReadingPage;
