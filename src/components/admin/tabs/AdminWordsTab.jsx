// src/components/admin/tabs/AdminWordsTab.jsx
// Dictionary Word Database (66,000+ words) Inspector, Quick Search & In-place Editor
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { playWordAudio } from '../../../services/audioService.js';

export function AdminWordsTab() {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingWord, setEditingWord] = useState(null);
  const [editForm, setEditForm] = useState({
    word: '',
    phonetic: '',
    pos: '',
    meaning: '',
    example_sentence: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const searchWords = useCallback(async (query) => {
    setLoading(true);
    try {
      let q = supabase
        .from('words')
        .select('id, word, phonetic, pos, meaning, example_sentence, created_at')
        .order('word', { ascending: true })
        .limit(30);

      if (query && query.trim()) {
        q = q.ilike('word', `${query.trim()}%`);
      }

      const { data, error } = await q;
      if (error) throw error;
      setWords(data || []);
    } catch (err) {
      console.error('searchWords error:', err);
      showToast(`Lỗi tìm kiếm: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchWords(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, searchWords]);

  const handleOpenEdit = (w) => {
    setEditingWord(w);
    setEditForm({
      word: w.word || '',
      phonetic: w.phonetic || '',
      pos: w.pos || '',
      meaning: w.meaning || '',
      example_sentence: w.example_sentence || '',
    });
  };

  const handleSaveWord = async (e) => {
    e.preventDefault();
    if (!editForm.word.trim()) {
      showToast('Từ tiếng Anh không được để trống!', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('words')
        .update({
          word: editForm.word.trim(),
          phonetic: editForm.phonetic.trim() || null,
          pos: editForm.pos.trim() || null,
          meaning: editForm.meaning.trim() || null,
          example_sentence: editForm.example_sentence.trim() || null,
        })
        .eq('id', editingWord.id);

      if (error) throw error;
      showToast(`Đã lưu từ "${editForm.word}" thành công!`, 'success');
      setWords((prev) =>
        prev.map((w) => (w.id === editingWord.id ? { ...w, ...editForm } : w))
      );
      setEditingWord(null);
    } catch (err) {
      console.error('handleSaveWord error:', err);
      showToast(`Lỗi khi lưu từ: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search Header */}
      <div className="p-4 rounded-2xl bg-surface border border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-on-surface-variant">search</span>
          <input
            type="text"
            placeholder="Gõ từ tiếng Anh để tra cứu nhanh..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container/60 border border-outline-variant/20 text-xs text-on-surface focus:outline-hidden focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="text-xs text-on-surface-variant font-medium">
          Hiển thị tối đa 30 từ khớp nhất (Kho 66k từ vựng)
        </div>
      </div>

      {/* Edit Word Modal */}
      {editingWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface w-full max-w-md rounded-2xl border border-outline-variant/20 shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/15">
              <h3 className="text-sm font-bold text-on-surface">Chỉnh sửa Từ vựng</h3>
              <button onClick={() => setEditingWord(null)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveWord} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Từ tiếng Anh (Word)</label>
                <input
                  type="text"
                  value={editForm.word}
                  onChange={(e) => setEditForm({ ...editForm, word: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant/20 text-xs text-on-surface font-bold focus:outline-hidden focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Phiên âm IPA</label>
                  <input
                    type="text"
                    value={editForm.phonetic}
                    onChange={(e) => setEditForm({ ...editForm, phonetic: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant/20 text-xs text-on-surface font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Từ loại (POS)</label>
                  <input
                    type="text"
                    placeholder="noun, verb, adj..."
                    value={editForm.pos}
                    onChange={(e) => setEditForm({ ...editForm, pos: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant/20 text-xs text-on-surface"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Định nghĩa tiếng Việt</label>
                <textarea
                  rows={2}
                  value={editForm.meaning}
                  onChange={(e) => setEditForm({ ...editForm, meaning: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant/20 text-xs text-on-surface"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Câu ví dụ (Example)</label>
                <textarea
                  rows={2}
                  value={editForm.example_sentence}
                  onChange={(e) => setEditForm({ ...editForm, example_sentence: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant/20 text-xs text-on-surface italic"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingWord(null)}
                  className="px-3 py-1.5 rounded-xl border border-outline-variant/20 text-xs font-semibold text-on-surface hover:bg-surface-container"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-90 disabled:opacity-50"
                >
                  {isSaving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Words Table */}
      <div className="bg-surface rounded-2xl border border-outline-variant/20 overflow-hidden shadow-2xs">
        {loading ? (
          <div className="py-16 text-center text-on-surface-variant flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px] animate-spin">refresh</span>
            <span className="text-xs">Đang tìm kiếm trong kho từ điển...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container/40 border-b border-outline-variant/15 text-on-surface-variant font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">TỪ GỐC (WORD)</th>
                  <th className="py-3 px-4">PHIÊN ÂM & TỪ LOẠI</th>
                  <th className="py-3 px-4">ĐỊNH NGHĨA</th>
                  <th className="py-3 px-4">VÍ DỤ</th>
                  <th className="py-3 px-4 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {words.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-on-surface-variant">
                      Không tìm thấy từ vựng nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  words.map((w) => (
                    <tr key={w.id} className="hover:bg-surface-container/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => playWordAudio(w.word)}
                            className="p-1 rounded-md text-primary hover:bg-primary/10 transition-colors"
                            title="Nghe phát âm"
                          >
                            <span className="material-symbols-outlined text-[16px]">volume_up</span>
                          </button>
                          <span className="font-bold text-on-surface">{w.word}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono text-on-surface-variant">{w.phonetic || '—'}</span>
                        {w.pos && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-surface-container text-on-surface-variant font-semibold">
                            {w.pos}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 max-w-[200px] truncate text-on-surface" title={w.meaning}>
                        {w.meaning || '—'}
                      </td>

                      <td className="py-3 px-4 max-w-[220px] truncate italic text-on-surface-variant" title={w.example_sentence}>
                        {w.example_sentence || '—'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(w)}
                          className="px-2.5 py-1 rounded-lg border border-outline-variant/20 hover:bg-surface-container text-xs font-semibold text-on-surface transition-all"
                        >
                          Sửa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminWordsTab;
