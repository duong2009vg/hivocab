// src/components/admin/tabs/AdminBulkImportTab.jsx
// Bulk Vocabulary Importer via CSV / JSON with Live Preview & Validation
// Cozy Crayon Handcrafted Design System
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
    <div className="space-y-6 animate-fade-in font-nunito text-[#3D352E]">
      <div className="p-6 rounded-3xl bg-white border-2 border-[#3D352E] shadow-[3.5px_4px_0px_#3D352E] space-y-4">
        <div>
          <h3 className="font-black text-lg font-quicksand text-[#3D352E] flex items-center gap-2">
            <span>📥</span>
            <span>Nhập Từ Vựng Hàng Loạt (Bulk CSV / JSON)</span>
          </h3>
          <p className="text-xs font-semibold text-[#6E5D53] mt-1">
            Dán danh sách từ theo định dạng CSV (<code className="font-mono bg-[#FAF5EB] px-2 py-0.5 rounded-lg border border-[#3D352E]/30 text-[#DE5D53] font-bold">word,phonetic,pos,meaning,example</code>) hoặc JSON mảng đối tượng.
          </p>
        </div>

        {/* Target Topic Selector */}
        <div className="max-w-md">
          <label className="block text-xs font-black font-quicksand uppercase tracking-wider text-[#6E5D53] mb-1.5">
            Chủ đề Đích (Target Topic)
          </label>
          <select
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-2xl bg-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-xs font-bold text-[#3D352E] focus:ring-2 focus:ring-[#557A46] focus:outline-none"
          >
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.word_count || 0} từ hiện có)
              </option>
            ))}
          </select>
        </div>

        {/* Text Input Area */}
        <div>
          <label className="block text-xs font-black font-quicksand uppercase tracking-wider text-[#6E5D53] mb-1.5">
            Dữ liệu Từ Vựng (Paste văn bản vào đây)
          </label>
          <textarea
            rows={7}
            placeholder={`abandon, /ə'bændən/, verb, từ bỏ/ruồng bỏ, He abandoned his car.\nbenefit, /'benifit/, noun, lợi ích, For the benefit of all.`}
            value={rawText}
            onChange={(e) => handleParse(e.target.value)}
            className="w-full p-4 rounded-2xl bg-[#FFFDF9] border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] font-mono text-xs text-[#3D352E] leading-relaxed focus:ring-2 focus:ring-[#557A46] focus:outline-none placeholder:text-[#8C7A6B]/50"
          />
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
          <div className="text-xs font-bold text-[#6E5D53]">
            Đã nhận diện: <strong className="font-black text-[#557A46] font-mono text-sm">{parsedWords.filter((w) => w.isValid).length}</strong> từ vựng hợp lệ
          </div>

          <button
            onClick={handleExecuteImport}
            disabled={isImporting || parsedWords.filter((w) => w.isValid).length === 0}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-[#557A46] hover:bg-[#466638] text-white font-black text-xs border-2 border-[#3D352E] shadow-[2.5px_3px_0px_#3D352E] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isImporting ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                <span>Đang nạp vào CSDL...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">upload</span>
                <span>Nạp Từ Vựng Vào Chủ Đề 🚀</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview Table */}
      {parsedWords.length > 0 && (
        <div className="bg-white rounded-3xl border-2 border-[#3D352E] shadow-[3.5px_4px_0px_#3D352E] overflow-hidden">
          <div className="px-5 py-3.5 border-b-2 border-[#3D352E] flex items-center justify-between bg-[#FAF5EB]">
            <h4 className="text-xs font-black font-quicksand uppercase tracking-wider text-[#3D352E]">
              Xem trước dữ liệu ({parsedWords.length} dòng đã phân tích)
            </h4>
          </div>

          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF5EB] sticky top-0 border-b-2 border-[#3D352E] text-[#6E5D53] font-black font-quicksand uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">TỪ VỰNG</th>
                  <th className="py-2.5 px-4">PHIÊN ÂM</th>
                  <th className="py-2.5 px-4">TỪ LOẠI</th>
                  <th className="py-2.5 px-4">NGHĨA</th>
                  <th className="py-2.5 px-4">TRẠNG THÁI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EADDC7]">
                {parsedWords.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#FFF9EE] transition-colors">
                    <td className="py-2.5 px-4 font-bold text-[#3D352E]">{row.word}</td>
                    <td className="py-2.5 px-4 font-mono text-[#6E5D53]">{row.phonetic || '—'}</td>
                    <td className="py-2.5 px-4 font-semibold text-[#6E5D53]">{row.pos || '—'}</td>
                    <td className="py-2.5 px-4 font-semibold text-[#3D352E]">{row.meaning || '—'}</td>
                    <td className="py-2.5 px-4">
                      {row.isValid ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#EAF3E7] text-[#557A46] border border-[#557A46]">
                          ✓ Hợp lệ
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#FFF0E6] text-[#DE5D53] border border-[#DE5D53]">
                          ✕ Thiếu nghĩa
                        </span>
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
