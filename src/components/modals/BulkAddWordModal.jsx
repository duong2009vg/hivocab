// src/components/modals/BulkAddWordModal.jsx
// Modal thêm từ vựng hàng loạt đa năng - Phong cách Cozy Crayon ấm áp (Sáp màu & Sổ tay học tập)
// Hỗ trợ: Dán JSON từ AI (ChatGPT/Gemini), Dán bảng Excel, Tải file .xlsx / .csv / .json

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useModal } from '../../context/ModalContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { supabase } from '../../lib/supabaseClient.js';
import { getCachedTopics } from '../../services/db.js';

// Mẫu Prompt chuẩn hóa để người dùng sao chép gửi cho ChatGPT / Gemini / Claude
const AI_PROMPT_TEMPLATE = `Bạn là trợ lý học thuật tiếng Anh chuyên nghiệp cho nền tảng học từ vựng HiVocab.
Nhiệm vụ của bạn: Tiếp nhận danh sách từ vựng thô bên dưới và chuyển đổi thành một mảng JSON chuẩn (JSON Array) đầy đủ 5 trường dữ liệu để nạp trực tiếp vào hệ thống HiVocab.

YÊU CẦU ĐỊNH DẠNG ĐẦU RA:
Trả về duy nhất 1 mảng JSON (Array of Objects) hợp lệ, mỗi phần tử gồm đúng 5 thuộc tính:
- "word": từ vựng hoặc cụm từ tiếng Anh gốc (dạng chữ thường, trừ danh từ riêng).
- "phonetic": phiên âm quốc tế IPA chính xác, đặt trong cặp dấu gạch chéo /.../ (ví dụ: "/rɪˈzɪl.jənt/").
- "pos": từ loại viết tắt tiếng Anh (noun, verb, adj, adv, phrase, idiom).
- "meaning": định nghĩa tiếng Việt ngắn gọn, chuẩn xác, tự nhiên theo ngữ cảnh sử dụng.
- "example_sentence": đúng 1 câu ví dụ tiếng Anh tự nhiên, thực tế và giàu ngữ cảnh chứa từ vựng đó.

CẤU TRÚC MẪU BẮT BUỘC:
[
  {
    "word": "resilient",
    "phonetic": "/rɪˈzɪl.jənt/",
    "pos": "adj",
    "meaning": "kiên cường, có khả năng phục hồi nhanh sau khó khăn",
    "example_sentence": "She remained remarkably resilient throughout all the challenges."
  }
]

QUY TẮC BẮT BUỘC:
1. Đảm bảo đúng chuẩn JSON (không thừa dấu phẩy ở cuối, bao bọc bởi [ ]).
2. KHÔNG thêm bất kỳ văn bản giải thích, lời chào hay định dạng phụ nào trước và sau khối JSON.
3. CHỈ trả về duy nhất khối JSON để tôi sao chép trực tiếp vào HiVocab.

DANH SÁCH TỪ VỰNG THÔ CỦA TÔI:
[DÁN DANH SÁCH TỪ VỰNG CỦA BẠN VÀO ĐÂY]`;

// Hàm phân tích dữ liệu đa năng: JSON, TSV (Excel), CSV, Markdown table
export function parseBulkInput(text) {
  if (!text || !text.trim()) return [];

  const trimmed = text.trim();

  // 1. Thử nhận diện JSON (kể cả có bọc trong ```json ... ```)
  let cleanJson = trimmed;
  if (cleanJson.includes('```')) {
    cleanJson = cleanJson.replace(/```(?:json)?([\s\S]*?)```/g, '$1').trim();
  }

  const jsonStart = cleanJson.indexOf('[');
  const jsonEnd = cleanJson.lastIndexOf(']');
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    try {
      const jsonSlice = cleanJson.substring(jsonStart, jsonEnd + 1);
      const parsed = JSON.parse(jsonSlice);
      if (Array.isArray(parsed)) {
        return parsed.map((item, idx) => ({
          id: `row-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          word: String(item.word || item.vocab || item.term || item.Word || '').trim(),
          phonetic: String(item.phonetic || item.ipa || item.pronunciation || item.Phonetic || '').trim(),
          pos: String(item.pos || item.type || item.part_of_speech || item.POS || '').trim(),
          meaning: String(item.meaning || item.definition || item.vietnamese || item.vi || item.Meaning || '').trim(),
          example_sentence: String(item.example_sentence || item.example || item.sentence || item.Example || '').trim(),
        })).filter(row => row.word || row.meaning);
      }
    } catch (_) {}
  }

  // 2. Thử tách từng dòng (Bảng Markdown, Tab Excel, CSV, hoặc Dấu gạch ngang)
  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const rows = [];

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx].trim();

    // Bỏ qua dòng kẻ bảng Markdown |---|---|
    if (/^\|?\s*[-:]+[-|\s:]+$/.test(line)) continue;

    let parts = [];

    if (line.includes('|')) {
      // Markdown table
      parts = line
        .split('|')
        .map((s) => s.trim())
        .filter((s, i, a) => !(i === 0 && s === '') && !(i === a.length - 1 && s === ''));
      if (parts[0]?.toLowerCase() === 'word' || parts[0]?.toLowerCase() === 'từ vựng') continue;
    } else if (line.includes('\t')) {
      // Tab separated (Copy từ Excel / Google Sheets)
      parts = line.split('\t').map((s) => s.trim());
      if (parts[0]?.toLowerCase() === 'word' || parts[0]?.toLowerCase() === 'từ vựng') continue;
    } else if (line.includes(',') && !line.includes(' - ')) {
      // CSV
      parts = line.match(/(?:[^\s,"]+|"[^"]*")+/g) || line.split(',');
      parts = parts.map((s) => s.trim().replace(/^"|"$/g, ''));
      if (parts[0]?.toLowerCase() === 'word' || parts[0]?.toLowerCase() === 'từ vựng') continue;
    } else if (line.includes(' - ')) {
      parts = line.split(' - ').map((s) => s.trim());
    } else if (line.includes(' : ')) {
      parts = line.split(' : ').map((s) => s.trim());
    } else if (line.includes(':')) {
      parts = line.split(':').map((s) => s.trim());
    } else {
      parts = [line];
    }

    if (parts.length >= 5) {
      rows.push({
        id: `row-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        word: parts[0] || '',
        phonetic: parts[1] || '',
        pos: parts[2] || '',
        meaning: parts[3] || '',
        example_sentence: parts.slice(4).join(' ') || '',
      });
    } else if (parts.length === 4) {
      rows.push({
        id: `row-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        word: parts[0] || '',
        phonetic: parts[1] || '',
        pos: parts[2] || '',
        meaning: parts[3] || '',
        example_sentence: '',
      });
    } else if (parts.length === 3) {
      const isPos = /^(n|v|adj|adv|prep|conj|noun|verb|adjective|adverb|phrase|idiom)$/i.test(parts[1]);
      rows.push({
        id: `row-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        word: parts[0] || '',
        phonetic: isPos ? '' : parts[1] || '',
        pos: isPos ? parts[1] : '',
        meaning: parts[2] || '',
        example_sentence: '',
      });
    } else if (parts.length === 2) {
      rows.push({
        id: `row-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        word: parts[0] || '',
        phonetic: '',
        pos: '',
        meaning: parts[1] || '',
        example_sentence: '',
      });
    } else if (parts.length === 1 && parts[0]) {
      rows.push({
        id: `row-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        word: parts[0],
        phonetic: '',
        pos: '',
        meaning: '',
        example_sentence: '',
      });
    }
  }

  return rows;
}

export function BulkAddWordModal() {
  const { modals, openModal, closeModal } = useModal();
  const { success, error: toastError } = useToast();

  const isOpen = Boolean(modals?.bulkAdd?.open);

  // Bước hiện tại: 'guide' (Bước 1), 'input' (Bước 2), 'preview' (Bước 3)
  const [activeStep, setActiveStep] = useState('guide');

  // Input & Data
  const [rawText, setRawText] = useState('');
  const [parsedWords, setParsedWords] = useState([]);
  const [topicId, setTopicId] = useState('');
  const [lessonName, setLessonName] = useState('');
  const [topicsList, setTopicsList] = useState([]);

  // Trạng thái
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPromptCopied, setIsPromptCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isFileLoading, setIsFileLoading] = useState(false);

  const fileInputRef = useRef(null);

  // Tải danh sách chủ đề do người dùng tự tạo
  const loadTopics = useCallback(async (targetSelectId = null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTopicsList([]);
        setTopicId('');
        return;
      }

      const { data, error } = await supabase
        .from('topics')
        .select('id, name, category, user_id')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error || !data || data.length === 0) {
        setTopicsList([]);
        setTopicId('');
        return;
      }

      setTopicsList(data);

      if (targetSelectId && data.some((t) => t.id === targetSelectId)) {
        setTopicId(targetSelectId);
        setErrorMessage('');
      } else {
        const currentActiveTopic = typeof window !== 'undefined' ? window._currentTopicId : null;
        if (currentActiveTopic && data.some((t) => t.id === currentActiveTopic)) {
          setTopicId(currentActiveTopic);
        } else {
          setTopicId((prev) => (data.some((t) => t.id === prev) ? prev : data[0].id));
        }
      }
    } catch (err) {
      console.warn('[BulkAddWordModal] loadTopics error:', err);
    }
  }, []);

  // Khởi tạo khi mở modal
  useEffect(() => {
    if (!isOpen) return;

    setActiveStep('guide');
    setRawText('');
    setParsedWords([]);
    setLessonName('');
    setErrorMessage('');
    setIsSubmitting(false);

    loadTopics();
  }, [isOpen, loadTopics]);

  // Lắng nghe sự kiện tạo chủ đề mới từ CreateTopicModal
  useEffect(() => {
    const handleTopicsUpdated = (e) => {
      const newTopicId = e?.detail?.topic?.id;
      loadTopics(newTopicId);
    };
    window.addEventListener('hi:topics-updated', handleTopicsUpdated);
    return () => window.removeEventListener('hi:topics-updated', handleTopicsUpdated);
  }, [loadTopics]);

  if (!isOpen) return null;

  const handleClose = () => {
    setErrorMessage('');
    closeModal('bulkAdd');
  };

  // 1. Sao chép Prompt cho AI
  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(AI_PROMPT_TEMPLATE);
      setIsPromptCopied(true);
      success('✨ Đã sao chép Prompt! Hãy dán vào ChatGPT hoặc Gemini nhé 🐾');
      setTimeout(() => setIsPromptCopied(false), 3000);
    } catch (_) {
      // Fallback cho trình duyệt cũ
      const ta = document.createElement('textarea');
      ta.value = AI_PROMPT_TEMPLATE;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setIsPromptCopied(true);
      success('✨ Đã sao chép Prompt vào clipboard!');
      setTimeout(() => setIsPromptCopied(false), 3000);
    }
  };

  // 2. Phân tích văn bản khi người dùng dán hoặc nhập
  const handleParseText = () => {
    if (!rawText.trim()) {
      setErrorMessage('Vui lòng dán nội dung từ vựng hoặc JSON từ AI!');
      return;
    }
    const rows = parseBulkInput(rawText);
    if (rows.length === 0) {
      setErrorMessage('Không phân tích được từ vựng nào. Bạn hãy kiểm tra lại định dạng JSON hoặc bảng!');
      return;
    }
    setParsedWords(rows);
    setErrorMessage('');
    setActiveStep('preview');
    success(`Đã phân tích thành công ${rows.length} từ vựng! Hãy xem lại bảng bên dưới nhé.`);
  };

  // 5. Xử lý tải file lên (.xlsx, .csv, .json)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsFileLoading(true);
    setErrorMessage('');

    try {
      const fileName = file.name.toLowerCase();

      // Trường hợp 1: File JSON
      if (fileName.endsWith('.json')) {
        const text = await file.text();
        const rows = parseBulkInput(text);
        if (rows.length > 0) {
          setParsedWords(rows);
          setActiveStep('preview');
          success(`Đã đọc ${rows.length} từ từ file JSON! 🎉`);
        } else {
          setErrorMessage('Không tìm thấy dữ liệu từ vựng hợp lệ trong file JSON.');
        }
      }
      // Trường hợp 2: File Excel (.xlsx / .xls)
      else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const XLSX = await import('xlsx');
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(sheet);

        const rows = json
          .map((item, idx) => ({
            id: `row-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
            word: String(item.word || item.Word || item['Từ vựng'] || item['Từ'] || '').trim(),
            phonetic: String(item.phonetic || item.Phonetic || item['Phiên âm'] || '').trim(),
            pos: String(item.pos || item.POS || item['Loại từ'] || item['Từ loại'] || '').trim(),
            meaning: String(item.meaning || item.Meaning || item['Nghĩa'] || item['Định nghĩa'] || '').trim(),
            example_sentence: String(item.example_sentence || item.example || item.Example || item['Ví dụ'] || item['Câu ví dụ'] || '').trim(),
          }))
          .filter((r) => r.word || r.meaning);

        if (rows.length > 0) {
          setParsedWords(rows);
          setActiveStep('preview');
          success(`Đã đọc ${rows.length} từ từ file Excel! 🎉`);
        } else {
          setErrorMessage('File Excel không có dòng từ vựng nào hợp lệ. Vui lòng kiểm tra lại tiêu đề các cột.');
        }
      }
      // Trường hợp 3: File CSV / TSV / TXT
      else if (fileName.endsWith('.csv') || fileName.endsWith('.tsv') || fileName.endsWith('.txt')) {
        const text = await file.text();
        const rows = parseBulkInput(text);
        if (rows.length > 0) {
          setParsedWords(rows);
          setActiveStep('preview');
          success(`Đã nạp thành công ${rows.length} từ từ file! 🎉`);
        } else {
          setErrorMessage('Không phân tích được từ vựng từ file này.');
        }
      } else {
        setErrorMessage('Định dạng file không được hỗ trợ. Vui lòng chọn .xlsx, .csv hoặc .json');
      }
    } catch (err) {
      console.error('[BulkAddWordModal] file upload error:', err);
      setErrorMessage('Lỗi đọc file: ' + err.message);
    } finally {
      setIsFileLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 6. Mở pop-up Tạo chủ đề mới (với lựa chọn thư mục & biểu tượng)
  const handleOpenCreateTopic = () => {
    openModal('createTopic', { initialStep: 'topic' });
  };

  // 7. Chỉnh sửa bảng Live Preview
  const handleCellChange = (id, field, value) => {
    setParsedWords((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleDeleteRow = (id) => {
    setParsedWords((prev) => prev.filter((row) => row.id !== id));
  };

  const handleAddEmptyRow = () => {
    setParsedWords((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        word: '',
        phonetic: '',
        pos: '',
        meaning: '',
        example_sentence: '',
      },
    ]);
  };

  // 8. Lưu tất cả từ vào CSDL Supabase
  const handleSaveAll = async () => {
    if (!topicId) {
      setErrorMessage('Bạn chưa có chủ đề cá nhân để lưu từ vựng! Vui lòng quay lại Bước 2 để chọn hoặc tạo chủ đề mới nhé.');
      return;
    }

    const validWords = parsedWords.filter((w) => w.word?.trim() && w.meaning?.trim());
    if (validWords.length === 0) {
      setErrorMessage('Không có từ vựng nào hợp lệ để lưu (mỗi từ phải có ít nhất Từ tiếng Anh và Nghĩa tiếng Việt).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const wordsPayload = validWords.map((item, idx) => ({
        topic_id: topicId,
        word: item.word.trim(),
        phonetic: item.phonetic?.trim() || null,
        pos: item.pos?.trim() || null,
        meaning: item.meaning.trim(),
        example_sentence: item.example_sentence?.trim() || null,
        lesson_name: lessonName.trim() || null,
        word_order: idx + 1,
      }));

      // Chèn hàng loạt vào bảng words
      const { data: inserted, error: insertErr } = await supabase
        .from('words')
        .insert(wordsPayload)
        .select('id');

      if (insertErr) {
        if (insertErr.message?.includes('violates row-level security policy')) {
          throw new Error('Chủ đề này thuộc hệ thống hoặc của người dùng khác. Bạn hãy bấm "+ Tạo chủ đề mới" để lưu vào kho từ của riêng bạn nhé!');
        }
        throw insertErr;
      }

      // Khởi tạo word_progress (level = 1) cho người dùng để đưa vào chu kỳ Spaced Repetition (SRS)
      if (user?.id && inserted?.length > 0) {
        const now = new Date().toISOString();
        const progRows = inserted.map((w) => ({
          user_id: user.id,
          word_id: w.id,
          level: 1,
          next_review_at: now,
          review_count: 0,
          created_at: now,
        }));
        try {
          await supabase
            .from('word_progress')
            .upsert(progRows, { onConflict: 'user_id,word_id' });
        } catch (progErr) {
          console.warn('[BulkAddWordModal] word_progress init error:', progErr);
        }
      }

      success(`Đã nạp thành công ${validWords.length} từ vựng vào chủ đề! 🎉🐾`);
      handleClose();

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('hivocab:words-bulk-added', {
            detail: { count: validWords.length, topicId },
          })
        );
      }
    } catch (err) {
      console.error('[BulkAddWordModal] submit error:', err);
      setErrorMessage(err?.message || 'Có lỗi xảy ra khi nạp từ vựng vào cơ sở dữ liệu.');
      toastError(err?.message || 'Lỗi thêm từ hàng loạt.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validCount = parsedWords.filter((w) => w.word?.trim() && w.meaning?.trim()).length;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 select-none overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="w-full max-w-4xl bg-[#FFFDF9] rounded-3xl shadow-[6px_8px_0px_#382E2B] overflow-hidden border-[3px] border-[#382E2B] flex flex-col max-h-[92vh] font-sans my-auto">
        {/* Header Modal */}
        <div className="px-5 sm:px-6 py-4 border-b-2 border-[#382E2B] flex items-center justify-between shrink-0 bg-[#FFF8EE]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#E1EDDB] border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] flex items-center justify-center text-xl shrink-0">
              📋
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-heading font-black text-[#382E2B] flex items-center gap-2">
                <span>Thêm từ vựng hàng loạt</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E5EFE2] text-[#557A46] border border-[#8FB383] hidden sm:inline-block">
                  Tiết kiệm chi phí AI
                </span>
              </h2>
              <p className="text-xs font-semibold text-[#766C5F]">Dán JSON từ AI riêng (ChatGPT/Gemini) hoặc tải file Excel 🐾</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center rounded-2xl bg-white border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] text-[#382E2B] hover:bg-[#FAF5EB] active:translate-y-0.5 transition-all cursor-pointer font-black text-sm"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Thanh chuyển bước (3 Steps Navigation) */}
        <div className="flex border-b-2 border-[#382E2B] bg-[#FAF5EB] p-1.5 gap-1.5 sm:gap-2 shrink-0 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveStep('guide')}
            className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeStep === 'guide'
                ? 'bg-[#382E2B] text-white shadow-sm'
                : 'bg-white text-[#766C5F] hover:text-[#382E2B] border border-[#382E2B]/20'
            }`}
          >
            <span>🤖</span>
            <span>1. Lấy Prompt AI</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveStep('input')}
            className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeStep === 'input'
                ? 'bg-[#382E2B] text-white shadow-sm'
                : 'bg-white text-[#766C5F] hover:text-[#382E2B] border border-[#382E2B]/20'
            }`}
          >
            <span>📥</span>
            <span>2. Nạp dữ liệu / File</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (parsedWords.length > 0) setActiveStep('preview');
              else handleParseText();
            }}
            className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeStep === 'preview'
                ? 'bg-[#5a7d4d] text-white shadow-sm font-black'
                : 'bg-white text-[#766C5F] hover:text-[#382E2B] border border-[#382E2B]/20'
            }`}
          >
            <span>👁️</span>
            <span>3. Xem trước ({parsedWords.length})</span>
          </button>
        </div>

        {/* Nội dung các bước (Step Content) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* ════════════ BƯỚC 1: HƯỚNG DẪN & LẤY PROMPT AI ════════════ */}
          {activeStep === 'guide' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Thẻ hướng dẫn 3 bước */}
              <div className="bg-[#FFF8EE] p-4 sm:p-5 rounded-2xl border-2 border-dashed border-[#E5A13C] space-y-3">
                <h3 className="font-heading font-black text-sm sm:text-base text-[#382E2B] flex items-center gap-2">
                  <span>💡</span>
                  <span>Cách làm giàu từ vựng miễn phí với ChatGPT / Gemini của bạn:</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#5C5248]">
                  <div className="bg-white p-3 rounded-xl border border-[#DECDBB] space-y-1">
                    <div className="font-black text-[#D36135]">Bước 1.1:</div>
                    <p>Bấm nút <strong>"Sao chép prompt"</strong> màu cam bên dưới.</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#DECDBB] space-y-1">
                    <div className="font-black text-[#D36135]">Bước 1.2:</div>
                    <p>Mở <strong>ChatGPT</strong> hoặc <strong>Gemini</strong>, dán prompt kèm danh sách từ thô của bạn.</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#DECDBB] space-y-1">
                    <div className="font-black text-[#D36135]">Bước 1.3:</div>
                    <p>Copy kết quả JSON do AI tạo ra và dán vào Bước 2 của HiVocab để nạp tự động!</p>
                  </div>
                </div>
              </div>

              {/* Khung xem trước Prompt với nút Sao chép Prompt gọn gàng vừa vặn */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-[#766C5F]">
                  <span>Xem trước nội dung Prompt (Chuẩn 5 trường):</span>
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="px-3.5 py-1.5 rounded-xl bg-[#EA7349] hover:bg-[#d86238] text-white font-black text-xs border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{isPromptCopied ? '✅' : '📋'}</span>
                    <span>{isPromptCopied ? 'Đã sao chép!' : 'Sao chép prompt'}</span>
                  </button>
                </div>
                <div className="p-3.5 bg-white rounded-2xl border-2 border-[#382E2B]/30 max-h-52 overflow-y-auto text-xs font-mono text-[#4A4036] leading-relaxed whitespace-pre-wrap select-all">
                  {AI_PROMPT_TEMPLATE}
                </div>
              </div>

              {/* Nút chuyển sang Bước 2 */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveStep('input')}
                  className="px-6 py-2.5 rounded-2xl bg-[#5a7d4d] hover:bg-[#4d6d41] text-white font-black text-xs sm:text-sm border-2 border-[#382E2B] shadow-[2px_3px_0px_#382E2B] active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>Đã có dữ liệu ➔ Sang bước 2: Nạp dữ liệu</span>
                </button>
              </div>
            </div>
          )}

          {/* ════════════ BƯỚC 2: NẠP DỮ LIỆU / FILE ════════════ */}
          {activeStep === 'input' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Thông báo nếu chưa có chủ đề cá nhân */}
              {topicsList.length === 0 && (
                <div className="p-3.5 rounded-2xl bg-[#FFF3D6] border-2 border-[#D97706]/40 text-[#92400E] text-xs font-semibold flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="text-base shrink-0">⚠️</span>
                    <div>
                      <p className="font-bold text-[#B45309]">Bạn chưa có chủ đề cá nhân nào!</p>
                      <p className="text-[11px] mt-0.5">Bấm nút bên cạnh để mở pop-up tạo chủ đề & chọn thư mục nhé.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenCreateTopic}
                    className="px-3.5 py-2 bg-[#5a7d4d] hover:bg-[#4d6d41] text-white font-black text-xs rounded-xl border-2 border-[#382E2B] shadow-sm cursor-pointer active:translate-y-0.5 transition-all shrink-0 flex items-center gap-1"
                  >
                    <span>+ Tạo chủ đề</span>
                  </button>
                </div>
              )}

              {/* Cấu hình Chủ đề & Bài học con */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-2xl bg-[#FAF5EB] border-2 border-[#382E2B]/20">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black text-[#766C5F] uppercase tracking-wider">
                      Chủ đề cá nhân <span className="text-[#D36135]">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleOpenCreateTopic}
                      className="text-xs font-extrabold text-[#D36135] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>+ Tạo chủ đề mới</span>
                    </button>
                  </div>

                  {topicsList.length === 0 ? (
                    <button
                      type="button"
                      onClick={handleOpenCreateTopic}
                      className="w-full bg-white border-2 border-dashed border-[#382E2B] px-3.5 py-2.5 rounded-xl text-[#382E2B] text-xs font-bold shadow-sm hover:bg-[#FAF5EB] cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>📁</span>
                      <span>Bấm vào đây để tạo chủ đề & chọn thư mục</span>
                    </button>
                  ) : (
                    <select
                      value={topicId}
                      onChange={(e) => setTopicId(e.target.value)}
                      className="w-full bg-white border-2 border-[#382E2B] px-3.5 py-2.5 rounded-xl outline-none text-[#382E2B] text-sm font-bold shadow-sm transition-colors cursor-pointer"
                    >
                      {topicsList.map((t) => (
                        <option key={t.id} value={t.id}>
                          📂 {t.name} {t.category ? `(${t.category})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black text-[#766C5F] uppercase tracking-wider mb-1.5">
                    Nhóm bài học con <span className="text-[11px] font-normal text-[#A2978A]">(Tùy chọn)</span>
                  </label>
                  <input
                    type="text"
                    value={lessonName}
                    onChange={(e) => setLessonName(e.target.value)}
                    placeholder="VD: Lesson 1, Unit 2, Từ ngày 05/10..."
                    className="w-full bg-white border-2 border-[#382E2B] px-3.5 py-2.5 rounded-xl outline-none text-[#382E2B] text-sm font-bold shadow-sm transition-colors"
                  />
                </div>
              </div>

              {/* Ô dán văn bản / JSON trực tiếp */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-[#766C5F] uppercase tracking-wider">
                    Cách 1: Dán JSON từ AI hoặc Bảng Excel vào đây <span className="text-[#D36135]">*</span>
                  </label>
                  <span className="text-xs font-bold text-[#5a7d4d]">Tự động nhận diện 5 cột</span>
                </div>
                <textarea
                  rows={7}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`Dán kết quả JSON từ ChatGPT vào đây, ví dụ:\n[\n  {\n    "word": "resilient",\n    "phonetic": "/rɪˈzɪl.jənt/",\n    "pos": "adj",\n    "meaning": "kiên cường, bền bỉ",\n    "example_sentence": "She remained resilient despite difficulties."\n  }\n]\n\nHoặc dán trực tiếp bảng từ Excel copy sang.`}
                  className="w-full bg-white border-2 border-[#382E2B] focus:border-[#D36135] p-3.5 rounded-2xl outline-none text-[#382E2B] text-xs font-mono shadow-[1px_2px_0px_rgba(56,46,43,0.15)] transition-colors resize-none leading-relaxed"
                />
              </div>

              {/* Khu vực Tải file lên (Cách 2) */}
              <div className="p-4 rounded-2xl border-2 border-dashed border-[#DECDBB] bg-[#FFFDF7] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📁</span>
                  <div>
                    <h4 className="text-xs font-bold text-[#382E2B]">Cách 2: Hoặc tải file từ máy tính</h4>
                    <p className="text-[11px] text-[#766C5F]">Hỗ trợ file bảng tính <strong>.xlsx</strong>, <strong>.csv</strong> hoặc file <strong>.json</strong></p>
                  </div>
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,.tsv,.json,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="bulk-vocab-file-input"
                  />
                  <label
                    htmlFor="bulk-vocab-file-input"
                    className="px-4 py-2 rounded-xl bg-white hover:bg-[#FAF5EB] text-[#382E2B] font-bold text-xs border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] cursor-pointer inline-flex items-center gap-2 active:translate-y-0.5 transition-all"
                  >
                    {isFileLoading ? (
                      <>
                        <span className="animate-spin">🔄</span>
                        <span>Đang đọc file...</span>
                      </>
                    ) : (
                      <>
                        <span>📂</span>
                        <span>Chọn file tải lên</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Thông báo lỗi nếu có */}
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-[#FFECE4] border-2 border-[#EA7349] text-[#CF4F23] text-xs font-bold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Điều hướng */}
              <div className="pt-2 flex items-center justify-between border-t-2 border-dashed border-[#EFE8D6]">
                <button
                  type="button"
                  onClick={() => setActiveStep('guide')}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-[#766C5F] hover:text-[#382E2B] hover:bg-[#FAF5EB] transition-colors cursor-pointer"
                >
                  ‹ Quay lại xem Prompt
                </button>
                <button
                  type="button"
                  onClick={handleParseText}
                  className="px-6 py-2.5 rounded-2xl bg-[#5a7d4d] hover:bg-[#4d6d41] text-white font-black text-xs sm:text-sm border-2 border-[#382E2B] shadow-[2px_3px_0px_#382E2B] active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>Phân tích & Xem trước ➔</span>
                </button>
              </div>
            </div>
          )}

          {/* ════════════ BƯỚC 3: XEM TRƯỚC (LIVE PREVIEW GRID) ════════════ */}
          {activeStep === 'preview' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Thống kê từ vựng */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#FFF8EE] rounded-2xl border-2 border-[#382E2B]/20 text-xs font-bold text-[#382E2B]">
                <div className="flex items-center gap-2">
                  <span>📊 Tổng số từ: <strong>{parsedWords.length}</strong></span>
                  <span className="text-[#A2978A]">|</span>
                  <span className="text-[#557A46]">Hợp lệ: <strong>{validCount}</strong></span>
                  {parsedWords.length - validCount > 0 && (
                    <>
                      <span className="text-[#A2978A]">|</span>
                      <span className="text-[#CF4F23]">Thiếu từ/nghĩa: <strong>{parsedWords.length - validCount}</strong></span>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAddEmptyRow}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF5EB] border border-[#382E2B] text-xs font-bold text-[#382E2B] shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <span>+</span>
                  <span>Thêm 1 dòng</span>
                </button>
              </div>

              {/* Bảng xem trước có thể sửa trực tiếp (Editable Grid) */}
              <div className="border-2 border-[#382E2B] rounded-2xl overflow-hidden bg-white shadow-sm max-h-72 overflow-y-auto">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#FAF5EB] border-b-2 border-[#382E2B] text-[#766C5F] uppercase font-black tracking-wider sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">#</th>
                        <th className="py-2.5 px-3 min-w-[120px]">Từ vựng *</th>
                        <th className="py-2.5 px-3 min-w-[110px]">Phiên âm</th>
                        <th className="py-2.5 px-3 w-20">Loại từ</th>
                        <th className="py-2.5 px-3 min-w-[160px]">Nghĩa tiếng Việt *</th>
                        <th className="py-2.5 px-3 min-w-[200px]">Câu ví dụ</th>
                        <th className="py-2.5 px-2 w-10 text-center">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFE8D6]">
                      {parsedWords.map((row, idx) => {
                        const isRowValid = row.word?.trim() && row.meaning?.trim();
                        return (
                          <tr
                            key={row.id}
                            className={`hover:bg-[#FFFDF7] transition-colors ${
                              !isRowValid ? 'bg-[#FFF3EC]' : ''
                            }`}
                          >
                            <td className="py-2 px-3 text-center font-bold text-[#A2978A]">
                              {idx + 1}
                            </td>
                            <td className="py-1.5 px-2">
                              <input
                                type="text"
                                value={row.word}
                                onChange={(e) => handleCellChange(row.id, 'word', e.target.value)}
                                placeholder="Từ tiếng Anh"
                                className="w-full px-2 py-1.5 rounded-lg border border-[#DECDBB] focus:border-[#D36135] text-xs font-bold text-[#382E2B] outline-none"
                              />
                            </td>
                            <td className="py-1.5 px-2">
                              <input
                                type="text"
                                value={row.phonetic}
                                onChange={(e) => handleCellChange(row.id, 'phonetic', e.target.value)}
                                placeholder="/IPA/"
                                className="w-full px-2 py-1.5 rounded-lg border border-[#DECDBB] focus:border-[#D36135] text-xs text-[#5C5248] outline-none"
                              />
                            </td>
                            <td className="py-1.5 px-2">
                              <input
                                type="text"
                                value={row.pos}
                                onChange={(e) => handleCellChange(row.id, 'pos', e.target.value)}
                                placeholder="noun/adj"
                                className="w-full px-2 py-1.5 rounded-lg border border-[#DECDBB] focus:border-[#D36135] text-xs text-[#5C5248] outline-none"
                              />
                            </td>
                            <td className="py-1.5 px-2">
                              <input
                                type="text"
                                value={row.meaning}
                                onChange={(e) => handleCellChange(row.id, 'meaning', e.target.value)}
                                placeholder="Nghĩa tiếng Việt"
                                className="w-full px-2 py-1.5 rounded-lg border border-[#DECDBB] focus:border-[#D36135] text-xs font-semibold text-[#382E2B] outline-none"
                              />
                            </td>
                            <td className="py-1.5 px-2">
                              <input
                                type="text"
                                value={row.example_sentence}
                                onChange={(e) => handleCellChange(row.id, 'example_sentence', e.target.value)}
                                placeholder="Câu ví dụ..."
                                className="w-full px-2 py-1.5 rounded-lg border border-[#DECDBB] focus:border-[#D36135] text-xs text-[#5C5248] outline-none"
                              />
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(row.id)}
                                className="w-7 h-7 inline-flex items-center justify-center rounded-lg hover:bg-[#FFECE4] text-[#CF4F23] font-bold text-xs cursor-pointer"
                                title="Xóa dòng này"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Thông báo lỗi nếu có */}
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-[#FFECE4] border-2 border-[#EA7349] text-[#CF4F23] text-xs font-bold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Điều hướng lưu */}
              <div className="pt-2 flex items-center justify-between border-t-2 border-dashed border-[#EFE8D6]">
                <button
                  type="button"
                  onClick={() => setActiveStep('input')}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-[#766C5F] hover:text-[#382E2B] hover:bg-[#FAF5EB] transition-colors cursor-pointer"
                >
                  ‹ Quay lại sửa nguồn
                </button>

                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={isSubmitting || validCount === 0}
                  className="px-6 py-2.5 rounded-2xl bg-[#5a7d4d] hover:bg-[#4d6d41] text-white font-black text-xs sm:text-sm border-2 border-[#382E2B] shadow-[2px_3px_0px_#382E2B] active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin">🔄</span>
                      <span>Đang lưu {validCount} từ...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      <span>Lưu tất cả {validCount} từ vựng vào bộ từ ➔</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BulkAddWordModal;
