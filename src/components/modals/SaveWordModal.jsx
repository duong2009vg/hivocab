// src/components/modals/SaveWordModal.jsx
// Modal lưu từ vựng vào sổ từ cá nhân

import React, { useState, useEffect } from 'react';
import { getTopics, createTopic, addWord } from '../../services/supabase.js';
import { useAuthStore } from '../../stores/authStore.js';

export function SaveWordModal({ isOpen, onClose, wordData, onSuccess }) {
    const { user } = useAuthStore();
    const [topics, setTopics] = useState([]);
    const [selectedTopicId, setSelectedTopicId] = useState('');
    const [isCreatingTopic, setIsCreatingTopic] = useState(false);
    const [newTopicName, setNewTopicName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setError('');
            setIsCreatingTopic(false);
            setNewTopicName('');
            loadTopics();
        }
    }, [isOpen]);

    async function loadTopics() {
        try {
            const list = await getTopics();
            setTopics(list);
            if (list.length > 0 && !selectedTopicId) {
                setSelectedTopicId(list[0].id);
            }
        } catch (_) {}
    }

    if (!isOpen || !wordData) return null;

    async function handleSave() {
        if (!user) {
            setError('Vui lòng đăng nhập để lưu từ vựng.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            let topicIdToUse = selectedTopicId;

            // Nếu user chọn tạo chủ đề mới ngay trong modal
            if (isCreatingTopic) {
                if (!newTopicName.trim()) {
                    setError('Vui lòng nhập tên chủ đề mới.');
                    setLoading(false);
                    return;
                }
                const newTopic = await createTopic(newTopicName.trim(), 'menu_book');
                topicIdToUse = newTopic.id;
            }

            if (!topicIdToUse) {
                setError('Vui lòng chọn hoặc tạo một chủ đề.');
                setLoading(false);
                return;
            }

            await addWord({
                topicId: topicIdToUse,
                word: wordData.word,
                meaning: wordData.meaning || wordData.viSummary || '',
                phonetic: wordData.phonetic || '',
                pos: wordData.pos || '',
                example: wordData.example || '',
                exampleVi: wordData.example_vi || ''
            });

            if (onSuccess) onSuccess(wordData.word);
            onClose();
        } catch (err) {
            setError(err.message || 'Không thể lưu từ vựng lúc này.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface border border-outline-variant/30 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-outline-variant/15">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[22px]">bookmark_add</span>
                        <h3 className="font-bold text-lg text-on-surface">Lưu vào Sổ từ vựng</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="py-4 flex flex-col gap-4">
                    {/* Word preview card */}
                    <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xl text-on-surface">{wordData.word}</span>
                            {wordData.pos && (
                                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-primary/10 text-primary uppercase">
                                    {wordData.pos}
                                </span>
                            )}
                            {wordData.phonetic && (
                                <span className="text-xs text-outline font-mono">{wordData.phonetic}</span>
                            )}
                        </div>
                        <p className="text-sm text-on-surface-variant font-medium mt-1">
                            {wordData.meaning || wordData.viSummary}
                        </p>
                    </div>

                    {/* Topic selector */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-bold text-on-surface">Chọn Chủ đề</label>
                            <button
                                type="button"
                                onClick={() => setIsCreatingTopic(!isCreatingTopic)}
                                className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                            >
                                {isCreatingTopic ? 'Chọn từ danh sách có sẵn' : '+ Tạo chủ đề mới'}
                            </button>
                        </div>

                        {isCreatingTopic ? (
                            <input
                                type="text"
                                placeholder="Nhập tên chủ đề mới (ví dụ: IELTS Speaking...)"
                                value={newTopicName}
                                onChange={(e) => setNewTopicName(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-on-surface text-sm focus:border-primary focus:outline-none"
                            />
                        ) : (
                            <select
                                value={selectedTopicId}
                                onChange={(e) => setSelectedTopicId(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-on-surface text-sm focus:border-primary focus:outline-none cursor-pointer"
                            >
                                {topics.length === 0 && <option value="">Chưa có chủ đề nào</option>}
                                {topics.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name} ({t.totalWords || 0} từ)
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {error && (
                        <p className="text-xs font-semibold text-rose-500 bg-rose-500/10 p-2.5 rounded-xl">
                            {error}
                        </p>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-outline-variant/15">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={loading}
                        className="px-5 py-2 rounded-xl text-sm font-bold bg-primary text-on-primary hover:opacity-95 active:scale-95 transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                        {loading ? (
                            <span>Đang lưu...</span>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[18px]">check</span>
                                <span>Lưu từ</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SaveWordModal;
