// src/components/modals/SaveWordToTopicModal.jsx
// Modal chọn chủ đề để lưu từ vựng từ Từ điển (hoặc các bài đọc)
// Phong cách Cozy Crayon Handcrafted ấm áp (Sáp màu & Sổ tay học tập)

import React, { useState, useEffect, useCallback } from 'react';
import { useModal } from '../../context/ModalContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useRoute } from '../../router/RouteContext.jsx';
import { supabase } from '../../lib/supabaseClient.js';
import { addWord } from '../../services/db.js';

export function SaveWordToTopicModal() {
  const { modals, openModal, closeModal } = useModal();
  const { success, error: toastError } = useToast();
  const { navigateTo } = useRoute();

  const isOpen = Boolean(modals?.saveWordToTopic?.open);
  const wordData = modals?.saveWordToTopic?.wordData || null;

  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingTopicId, setSavingTopicId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedMeaningIdx, setSelectedMeaningIdx] = useState(0);

  // Load user's personal topics
  const loadTopics = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoggedIn(false);
        setTopics([]);
        return;
      }
      setIsLoggedIn(true);

      const { data, error } = await supabase
        .from('topics')
        .select('id, name, category, icon, word_count')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) {
        console.warn('[SaveWordToTopicModal] loadTopics error, trying fallback:', error);
        const { data: fallbackData } = await supabase
          .from('topics')
          .select('id, name, category, icon')
          .eq('user_id', user.id)
          .order('name', { ascending: true });
        setTopics((fallbackData || []).map(t => ({ ...t, word_count: 0 })));
        return;
      }
      setTopics(data || []);
    } catch (err) {
      console.warn('[SaveWordToTopicModal] loadTopics error:', err);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: fb } = await supabase
            .from('topics')
            .select('id, name, category, icon')
            .eq('user_id', user.id)
            .order('name', { ascending: true });
          if (fb && fb.length > 0) {
            setTopics(fb.map(t => ({ ...t, word_count: 0 })));
            return;
          }
        }
      } catch (_) {}
      setTopics([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setFilterQuery('');
    setSelectedMeaningIdx(0);
    setSavingTopicId(null);
    loadTopics();
  }, [isOpen, loadTopics]);

  // Lắng nghe khi có chủ đề mới được tạo từ CreateTopicModal
  useEffect(() => {
    const handleUpdated = () => {
      loadTopics();
    };
    window.addEventListener('hi:topics-updated', handleUpdated);
    return () => window.removeEventListener('hi:topics-updated', handleUpdated);
  }, [loadTopics]);

  if (!isOpen || !wordData) return null;

  const word = String(wordData.word || '').trim();
  const phonetic = String(wordData.phonetic || wordData.phonetics?.us || wordData.phonetics?.uk || '').trim();
  const pos = String(wordData.pos || '').trim();

  // Danh sách các nét nghĩa để người dùng chọn nếu có nhiều nét nghĩa
  const entries = Array.isArray(wordData.entries) && wordData.entries.length > 0
    ? wordData.entries
    : Array.isArray(wordData.senses) && wordData.senses.length > 0
    ? wordData.senses.map((s) => ({
        meaning: s.definition_vi || s.definition_en || '',
        example: s.examples?.[0]?.en || '',
      }))
    : [
        {
          meaning: wordData.meaning || wordData.viSummary || '',
          example: wordData.example || '',
        },
      ];

  const currentEntry = entries[selectedMeaningIdx] || entries[0] || {};
  const currentMeaning = currentEntry.meaning || wordData.meaning || wordData.viSummary || '';
  const currentExample = currentEntry.example || wordData.example || '';

  // Xử lý lưu từ vào chủ đề
  const handleSaveToTopic = async (topic) => {
    if (savingTopicId) return;
    setSavingTopicId(topic.id);

    try {
      const payload = {
        topic_id: topic.id,
        word: word,
        phonetic: phonetic,
        pos: pos,
        meaning: currentMeaning.trim(),
        example_sentence: currentExample.trim(),
      };

      await addWord(topic.id, payload);

      success(`✨ Đã lưu từ "${word}" vào "${topic.name}" thành công! 🎉`);
      closeModal('saveWordToTopic');

      // Bắn sự kiện để các trang khác (Sổ từ, Dashboard, Chủ đề) cập nhật ngay
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('hivocab:words-bulk-added', {
            detail: { count: 1, topicId: topic.id },
          })
        );
        window.dispatchEvent(new CustomEvent('hi:topics-updated'));
      }
    } catch (err) {
      console.error('[SaveWordToTopicModal] save error:', err);
      toastError(err.message || 'Không thể lưu từ vựng. Vui lòng thử lại!');
    } finally {
      setSavingTopicId(null);
    }
  };

  const handleOpenCreateTopic = () => {
    closeModal('saveWordToTopic');
    if (!isLoggedIn) {
      openModal('requireLogin', {
        title: 'Đăng nhập để tạo chủ đề 📁',
        message: 'Đăng nhập tài khoản để tạo và sắp xếp các chủ đề từ vựng của riêng bạn nhé!',
        actionName: 'tạo chủ đề',
      });
      return;
    }
    openModal('createTopic');
  };

  const filteredTopics = topics.filter((t) =>
    t.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    (t.category && t.category.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => closeModal('saveWordToTopic')}
    >
      <div
        className="w-full max-w-md bg-[#FFFDF7] border-[3px] border-[#382E2B] rounded-[28px] shadow-[4px_6px_0px_#382E2B] p-5 sm:p-6 space-y-4 max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b-2 border-dashed border-[#DECDBB]">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-[#E6F3FB] border-2 border-[#382E2B] flex items-center justify-center text-xl shadow-xs">
              📁
            </span>
            <div>
              <h2 className="text-lg font-black text-[#382E2B] font-heading leading-tight">
                Lưu từ vào chủ đề
              </h2>
              <p className="text-xs text-[#766C5F] font-semibold mt-0.5">
                Chọn chủ đề cá nhân để lưu từ vựng này
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => closeModal('saveWordToTopic')}
            className="w-8 h-8 rounded-full border-2 border-[#382E2B] bg-[#FAF5EB] hover:bg-[#ebdcc8] flex items-center justify-center text-[#382E2B] font-bold text-xs transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Word Info Card */}
        <div className="bg-[#FAF5EB] p-3.5 rounded-2xl border-2 border-[#382E2B]/20 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-[#382E2B]">{word}</span>
              {pos && (
                <span className="bg-[#E5EFE2] text-[#557A46] text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#8FB383]">
                  {pos}
                </span>
              )}
            </div>
            {phonetic && (
              <span className="text-xs font-mono text-[#766C5F] font-semibold">
                {phonetic.startsWith('/') ? phonetic : `/${phonetic}/`}
              </span>
            )}
          </div>

          {/* Chọn nghĩa nếu có nhiều nét nghĩa */}
          {entries.length > 1 ? (
            <div className="space-y-1 pt-1">
              <span className="text-[11px] font-bold text-[#766C5F] block">Chọn nét nghĩa muốn lưu:</span>
              <div className="flex flex-col gap-1.5 max-h-28 overflow-y-auto pr-1">
                {entries.map((entry, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedMeaningIdx(idx)}
                    className={`text-left text-xs p-2 rounded-xl border transition-all cursor-pointer ${
                      selectedMeaningIdx === idx
                        ? 'bg-white border-2 border-[#382E2B] font-bold text-[#382E2B] shadow-2xs'
                        : 'bg-white/60 border border-[#DECDBB] text-[#5C5248] hover:bg-white'
                    }`}
                  >
                    <span className="text-[#D36135] font-black mr-1">#{idx + 1}:</span>
                    <span>{entry.meaning}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs font-bold text-[#382E2B] leading-snug">
              👉 {currentMeaning || 'Từ điển song ngữ'}
            </p>
          )}

          {currentExample && (
            <p className="text-[11px] font-serif italic text-[#766C5F] truncate">
              "{currentExample}"
            </p>
          )}
        </div>

        {/* Search input if multiple topics */}
        {topics.length > 4 && (
          <div className="relative">
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Tìm nhanh tên chủ đề..."
              className="w-full bg-white border-2 border-[#382E2B] px-3.5 py-2 pl-9 rounded-xl outline-none text-[#382E2B] text-xs font-bold shadow-2xs"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">🔍</span>
          </div>
        )}

        {/* Topics List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px] max-h-[260px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 text-[#766C5F] gap-2">
              <span className="animate-spin text-2xl">🔄</span>
              <span className="text-xs font-bold">Đang tải danh sách chủ đề...</span>
            </div>
          ) : !isLoggedIn ? (
            <div className="p-4 bg-[#FFF8EE] rounded-2xl border-2 border-dashed border-[#E5A13C] text-center space-y-3">
              <p className="text-xs font-bold text-[#92400E]">
                Vui lòng đăng nhập để lưu từ vựng vào kho cá nhân của bạn!
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    closeModal('saveWordToTopic');
                    navigateTo('login');
                  }}
                  className="px-4 py-2 bg-[#382E2B] text-white text-xs font-black rounded-xl border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] active:translate-y-0.5 transition-all cursor-pointer"
                >
                  🔑 Đăng nhập ngay
                </button>
                <button
                  type="button"
                  onClick={() => {
                    closeModal('saveWordToTopic');
                    if (typeof window !== 'undefined') window._initialAuthMode = 'signup';
                    navigateTo('login');
                  }}
                  className="px-4 py-2 bg-[#D36135] text-white text-xs font-black rounded-xl border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] active:translate-y-0.5 transition-all cursor-pointer"
                >
                  ✨ Tạo tài khoản mới
                </button>
              </div>
            </div>
          ) : topics.length === 0 ? (
            <div className="p-4 bg-[#FFF8EE] rounded-2xl border-2 border-dashed border-[#E5A13C] text-center space-y-2">
              <p className="text-xs font-bold text-[#92400E]">
                Bạn chưa có chủ đề cá nhân nào để lưu từ!
              </p>
              <p className="text-[11px] text-[#A2978A]">
                Hãy tạo chủ đề mới để bắt đầu lưu từ và học ôn tập nhé.
              </p>
            </div>
          ) : filteredTopics.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#766C5F] font-bold">
              Không tìm thấy chủ đề phù hợp với "{filterQuery}"
            </div>
          ) : (
            filteredTopics.map((topic) => {
              const isSaving = savingTopicId === topic.id;
              return (
                <button
                  key={topic.id}
                  type="button"
                  disabled={Boolean(savingTopicId)}
                  onClick={() => handleSaveToTopic(topic)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl bg-white border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] hover:bg-[#FAF5EB] active:translate-y-0.5 transition-all text-left cursor-pointer group ${
                    isSaving ? 'opacity-60 pointer-events-none' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="text-lg shrink-0">
                      {topic.icon ? (topic.icon === 'folder' ? '📁' : '📚') : '📁'}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-black text-[#382E2B] truncate group-hover:text-[#D36135] transition-colors">
                        {topic.name}
                      </h4>
                      <p className="text-[11px] text-[#A2978A] font-semibold truncate">
                        {topic.category ? `${topic.category} • ` : ''}
                        {topic.word_count || 0} từ
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-xl bg-[#FAF5EB] group-hover:bg-[#D36135] group-hover:text-white border border-[#382E2B] text-[11px] font-black text-[#382E2B] transition-colors shrink-0">
                    {isSaving ? 'Đang lưu...' : '+ Lưu vào đây'}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer: Nút tạo chủ đề mới */}
        <div className="pt-2 border-t-2 border-dashed border-[#DECDBB]">
          <button
            type="button"
            onClick={handleOpenCreateTopic}
            className="w-full py-2.5 px-4 bg-white hover:bg-[#FAF5EB] text-[#382E2B] font-black text-xs rounded-xl border-2 border-dashed border-[#382E2B] flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
          >
            <span>✨</span>
            <span>+ Tạo chủ đề mới</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SaveWordToTopicModal;
