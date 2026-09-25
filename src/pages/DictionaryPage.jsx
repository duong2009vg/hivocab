// src/pages/DictionaryPage.jsx
// Trang tra từ điển thông minh HiVocab sử dụng các component mô-đun

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, Search, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import { lookupWord, getRecentSearches } from '../services/dictionary.js';
import DictSearchInput from '../components/dictionary/DictSearchInput.jsx';
import DictCard from '../components/dictionary/DictCard.jsx';
import SaveWordModal from '../components/modals/SaveWordModal.jsx';

export function DictionaryPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialQuery = searchParams.get('q') || '';

    const [status, setStatus] = useState('empty'); // 'empty' | 'loading' | 'result' | 'error'
    const [loadingMessage, setLoadingMessage] = useState('Đang tra cứu từ điển...');
    const [loadingSubMessage, setLoadingSubMessage] = useState('Tra cứu định nghĩa song ngữ và ví dụ thực tế...');
    const [wordResult, setWordResult] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [recentList, setRecentList] = useState([]);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        setRecentList(getRecentSearches());
        if (initialQuery) {
            performSearch(initialQuery);
        }
    }, [initialQuery]);

    async function performSearch(targetWord) {
        const clean = (targetWord || '').trim();
        if (!clean) return;

        setSearchParams({ q: clean });
        setStatus('loading');
        setLoadingMessage('Đang tra cứu từ điển...');
        setLoadingSubMessage('Tra cứu định nghĩa song ngữ và ví dụ thực tế...');

        // Progressive Loading indicators
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
        } catch (e) {
            setErrorMessage('Có lỗi xảy ra trong quá trình tra cứu. Vui lòng thử lại.');
            setStatus('error');
        } finally {
            clearTimeout(t1);
            clearTimeout(t2);
        }
    }

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3000);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
            {/* Thanh tìm kiếm DictSearchInput */}
            <div className="space-y-4">
                <DictSearchInput
                    initialValue={initialQuery}
                    onSearch={performSearch}
                    recentSearches={recentList}
                    onSelectRecent={performSearch}
                />
            </div>

            {/* Trạng thái Loading */}
            {status === 'loading' && (
                <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-xs">
                    <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto" />
                    <div className="space-y-1">
                        <h3 className="font-bold text-lg text-on-surface">{loadingMessage}</h3>
                        <p className="text-xs sm:text-sm text-on-surface-variant max-w-md mx-auto">{loadingSubMessage}</p>
                    </div>
                </div>
            )}

            {/* Trạng thái Lỗi */}
            {status === 'error' && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-8 text-center space-y-3">
                    <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                    <p className="text-on-surface font-medium text-sm sm:text-base">{errorMessage}</p>
                    <button
                        onClick={() => performSearch(initialQuery)}
                        className="px-4 py-2 bg-rose-500 text-white font-bold text-xs rounded-xl hover:bg-rose-600 transition-colors cursor-pointer"
                    >
                        Thử lại
                    </button>
                </div>
            )}

            {/* Thẻ kết quả tra từ DictCard */}
            {status === 'result' && wordResult && (
                <DictCard
                    wordData={wordResult}
                    onSave={() => setIsSaveModalOpen(true)}
                />
            )}

            {/* Trạng thái Trống (Chưa nhập từ) */}
            {status === 'empty' && (
                <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 sm:p-12 text-center space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-xs">
                        <BookOpen className="w-8 h-8" />
                    </div>
                    <div className="space-y-1.5 max-w-md mx-auto">
                        <h3 className="text-lg font-bold text-on-surface">Khám phá kho từ vựng chuẩn Cambridge</h3>
                        <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                            Nhập bất kỳ từ tiếng Anh nào để nhận định nghĩa ngữ cảnh, phiên âm chuẩn xác và ví dụ song ngữ sinh động.
                        </p>
                    </div>
                </div>
            )}

            {/* Modal Lưu từ */}
            {isSaveModalOpen && wordResult && (
                <SaveWordModal
                    wordData={wordResult}
                    onClose={() => setIsSaveModalOpen(false)}
                    onSaved={() => showToast(`Đã lưu từ "${wordResult.word}" vào sổ từ vựng thành công!`)}
                />
            )}

            {/* Toast thông báo */}
            {toastMessage && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-slate-900 text-white font-semibold text-xs shadow-xl flex items-center gap-2 border border-slate-700 animate-slide-up">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{toastMessage}</span>
                </div>
            )}
        </div>
    );
}

export default DictionaryPage;
