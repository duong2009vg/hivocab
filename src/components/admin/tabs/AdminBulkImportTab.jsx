// src/components/admin/tabs/AdminBulkImportTab.jsx
// Bulk Vocabulary Importer via CSV / JSON with Live Preview & Validation
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient.js';
import { useToast } from '../../../context/ToastContext.jsx';

export function AdminBulkImportTab() {
  const { showToast } = useToast();
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [rawText, setRawText] = useState('');
  const [parsedWords, setParsedWords] = useState([]);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    supabase
      .from('topics')
      .select('id, name, words(count)')
      .order('name', { ascending: true })
      .then(({ data }) => {
        const mapped = (data || []).map((t) => ({
          ...t,
          word_count: t.words?.[0]?.count || 0,
        }));
        setTopics(mapped);
        if (mapped && mapped.length > 0) setSelectedTopicId(mapped[0].id);
      });
  }, []);

  const handleParse = (text) => {
    setRawText(text);
    if (!text.trim()) {
      setParsedWords([]);
      return;
    }

    try {
      // 1. Try parsing JSON
      if (text.trim().startsWith('[') || text.trim().startsWith('{')) {
        const parsed = JSON.parse(text);
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        setParsedWords(
          arr.map((item) => ({
            word: String(item.word || '').trim(),
            phonetic: String(item.phonetic || '').trim(),
            pos: String(item.pos || '').trim(),
            meaning: String(item.meaning || '').trim(),
            example_sentence: String(item.example_sentence || item.example || '').trim(),
            isValid: Boolean(item.word && item.meaning),
          }))
        );
        return;
      }
    } catch {
      // Fall through to CSV
    }

    // 2. Parse CSV / TSV
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const results = [];

    lines.forEach((line) => {
      // Split by tab or comma
      const parts = line.includes('\t') ? line.split('\t') : line.split(',');
      if (parts.length >= 2) {
        const word = (parts[0] || '').trim().replace(/^"/, '').replace(/"$/, '');
        const phonetic = (parts[1] || '').trim().replace(/^"/, '').replace(/"$/, '');
        const pos = (parts[2] || '').trim().replace(/^"/, '').replace(/"$/, '');
        const meaning = (parts[3] || parts[1] || '').trim().replace(/^"/, '').replace(/"$/, '');
        const example = (parts[4] || '').trim().replace(/^"/, '').replace(/"$/, '');

        if (word) {
          results.push({
            word,
            phonetic: phonetic.startsWith('/') ? phonetic : '',
            pos,
            meaning,
            example_sentence: example,
            isValid: Boolean(word && meaning),
          });
        }
      }
    });

    setParsedWords(results);
  };

  const handleExecuteImport = async () => {
    if (!selectedTopicId) {
      showToast('Vui lòng chọn Chủ đề đích!', 'warning');
      return;
    }
    const validWords = parsedWords.filter((w) => w.isValid);
    if (validWords.length === 0) {
      showToast('Không có từ vựng hợp lệ nào để nạp!', 'warning');
      return;
    }

    setIsImporting(true);
    try {
      const payload = validWords.map((w, idx) => ({
        topic_id: selectedTopicId,
        word: w.word,
        phonetic: w.phonetic || null,
        pos: w.pos || null,
        meaning: w.meaning || null,
        example_sentence: w.example_sentence || null,
        word_order: idx + 1,
      }));

      const { error } = await supabase.from('words').insert(payload);
      if (error) throw error;

      // Update topic word count
      await supabase.rpc('increment_topic_word_count', {
        p_topic_id: selectedTopicId,
        p_count: payload.length,
      }).catch(() => {});

      showToast(`Đã nạp thành công ${payload.length} từ vựng vào chủ đề! 🎉`, 'success');
      setRawText('');
      setParsedWords([]);
    } catch (err) {
      console.error('Import error:', err);
      showToast(`Lỗi khi nạp: ${err.message}`, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-5 rounded-2xl bg-surface border border-outline-variant/20 space-y-4">
        <div>
          <h3 className="font-bold text-sm text-on-surface">Nhập Từ vựng Hàng loạt (Bulk CSV/JSON)</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Dán danh sách từ theo định dạng CSV (<code className="font-mono bg-surface-container px-1 py-0.5 rounded">word,phonetic,pos,meaning,example</code>) hoặc JSON
          </p>
        </div>

        {/* Target Topic Selector */}
        <div className="max-w-md">
          <label className="block text-xs font-bold text-on-surface mb-1">Chủ đề đích (Target Topic)</label>
          <select
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/20 text-xs font-semibold text-on-surface focus:outline-hidden focus:ring-1 focus:ring-primary"
          >
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.word_count || 0} từ)
              </option>
            ))}
          </select>
        </div>

        {/* Text Input Area */}
        <div>
          <label className="block text-xs font-bold text-on-surface mb-1">Dữ liệu từ vựng</label>
          <textarea
            rows={6}
            placeholder={`abandon, /ə'bændən/, verb, từ bỏ/ruồng bỏ, He abandoned his car.\nbenefit, /'benifit/, noun, lợi ích, For the benefit of all.`}
            value={rawText}
            onChange={(e) => handleParse(e.target.value)}
            className="w-full p-3 rounded-xl bg-surface-container/50 border border-outline-variant/20 font-mono text-xs text-on-surface focus:outline-hidden focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs font-semibold text-on-surface-variant">
            Đã nhận diện: <span className="font-bold text-on-surface">{parsedWords.filter((w) => w.isValid).length}</span> từ hợp lệ
          </div>

          <button
            onClick={handleExecuteImport}
            disabled={isImporting || parsedWords.filter((w) => w.isValid).length === 0}
            className="px-5 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all shadow-xs flex items-center gap-1.5"
          >
            {isImporting ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                <span>Đang nạp vào DB...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">upload</span>
                <span>Nạp vào Chủ đề</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview Table */}
      {parsedWords.length > 0 && (
        <div className="bg-surface rounded-2xl border border-outline-variant/20 overflow-hidden shadow-2xs">
          <div className="px-4 py-3 border-b border-outline-variant/15 flex items-center justify-between bg-surface-container/30">
            <h4 className="text-xs font-bold text-on-surface">Xem trước dữ liệu ({parsedWords.length} dòng)</h4>
          </div>

          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container/50 sticky top-0 border-b border-outline-variant/15 text-on-surface-variant font-bold text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">TỪ VỰNG</th>
                  <th className="py-2.5 px-4">PHIÊN ÂM</th>
                  <th className="py-2.5 px-4">TỪ LOẠI</th>
                  <th className="py-2.5 px-4">NGHĨA</th>
                  <th className="py-2.5 px-4">TRẠNG THÁI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {parsedWords.map((row, idx) => (
                  <tr key={idx} className="hover:bg-surface-container/30 transition-colors">
                    <td className="py-2 px-4 font-bold text-on-surface">{row.word}</td>
                    <td className="py-2 px-4 font-mono text-on-surface-variant">{row.phonetic || '—'}</td>
                    <td className="py-2 px-4 text-on-surface-variant">{row.pos || '—'}</td>
                    <td className="py-2 px-4 text-on-surface">{row.meaning || '—'}</td>
                    <td className="py-2 px-4">
                      {row.isValid ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">Hợp lệ</span>
                      ) : (
                        <span className="text-rose-500 font-bold text-[10px]">Thiếu nghĩa</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBulkImportTab;
