// src/components/modals/BulkAddWordModal.jsx
// Modal thêm từ vựng hàng loạt - Phong cách Cozy Crayon ấm áp (Sáp màu & Sổ tay học tập)
// Hỗ trợ: Tải file Excel (.xlsx, .xls, .csv) do AI xuất trực tiếp, hoặc Dán bảng từ vựng

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useModal } from '../../context/ModalContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { supabase } from '../../lib/supabaseClient.js';
import { clearTopicCache } from '../../services/topicsService.js';

// Mẫu Prompt chuẩn hóa để người dùng sao chép gửi cho ChatGPT / Gemini / Claude
// Hướng dẫn AI xuất trực tiếp file Excel (.xlsx) tải về hoặc bảng dữ liệu chuẩn 5 cột
const AI_PROMPT_TEMPLATE = `Bạn là trợ lý học thuật tiếng Anh chuyên nghiệp cho nền tảng học từ vựng HiVocab.

NHIỆM VỤ:
Tiếp nhận danh sách từ vựng thô bên dưới, tra cứu thông tin chính xác và XUẤT RA FILE EXCEL (.xlsx) hoặc BẢNG DỮ LIỆU chuẩn 5 cột để nạp trực tiếp vào HiVocab:
1. word: Từ vựng hoặc cụm từ tiếng Anh (viết thường).
2. phonetic: Phiên âm quốc tế IPA chuẩn, đặt trong cặp dấu /.../ (ví dụ: /rɪˈzɪl.jənt/).
3. pos: Từ loại viết tắt tiếng Anh (noun, verb, adj, adv, phrase, idiom).
4. meaning: Định nghĩa tiếng Việt ngắn gọn, chuẩn xác, tự nhiên theo ngữ cảnh.
5. example_sentence: Đúng 1 câu ví dụ tiếng Anh thực tế và tự nhiên chứa từ vựng.

HƯỚNG DẪN XUẤT KẾT QUẢ (QUAN TRỌNG):
- ƯU TIÊN 1 (Nếu AI của bạn có tính năng tạo file / Python / Code Interpreter): Hãy chạy mã để tạo và gửi trực tiếp link tải FILE EXCEL (.xlsx) có tên "hivocab_words.xlsx" chứa đủ 5 cột trên để tôi tải về máy.
- ƯU TIÊN 2 (Nếu chỉ có thể trả lời bằng văn bản): Hãy xuất duy nhất một BẢNG DỮ LIỆU (Markdown Table) chuẩn 5 cột trên. Tuyệt đối không thêm lời chào, lời dẫn hay giải thích thừa để tôi sao chép trực tiếp vào HiVocab.

BẢNG CỘT MẪU:
| word | phonetic | pos | meaning | example_sentence |
| resilient | /rɪˈzɪl.jənt/ | adj | kiên cường, có khả năng phục hồi nhanh | She remained remarkably resilient throughout all the challenges. |

DANH SÁCH TỪ VỰNG THÔ CỦA TÔI:
[DÁN DANH SÁCH TỪ VỰNG HOẶC CHỦ ĐỀ BẠN MUỐN TẠO VÀO ĐÂY]`;

// Hàm phân tích dữ liệu đa năng: TSV (Excel), CSV, Markdown table (và fallback JSON an toàn)
export function parseBulkInput(text) {
  if (!text || !text.trim()) return [];

  const trimmed = text.trim();

  // 1. Silent fallback nhận diện JSON (nếu người dùng vô tình dán JSON cũ)
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

  // 2. Tách từng dòng (Bảng Markdown, Tab Excel, CSV, hoặc Dấu gạch ngang)
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

const MAX_SPREADSHEET_BYTES = 10 * 1024 * 1024;
const MAX_SPREADSHEET_ROWS = 5000;
const MAX_SPREADSHEET_CELL_CHARS = 2000;

function normalizeHeader(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function spreadsheetRowsToText(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return '';
  if (rows.length > MAX_SPREADSHEET_ROWS + 1) {
    throw new Error(`File Excel vượt quá giới hạn ${MAX_SPREADSHEET_ROWS.toLocaleString('vi-VN')} dòng.`);
  }

  const firstRow = Array.isArray(rows[0]) ? rows[0] : [];
  const headerNames = firstRow.map(normalizeHeader);
  const findColumn = (names, fallback) => {
    const index = headerNames.findIndex((header) => names.includes(header));
    return index >= 0 ? index : fallback;
  };
  const columns = [
    findColumn(['word', 'english', 'english_word', 'vocab', 'vocabulary', 'term', 'tu_vung', 'tu_tieng_anh', 'tu'], 0),
    findColumn(['phonetic', 'ipa', 'pronunciation', 'phien_am'], 1),
    findColumn(['pos', 'type', 'part_of_speech', 'tu_loai'], 2),
    findColumn(['meaning', 'definition', 'vietnamese', 'vietnamese_meaning', 'meaning_vi', 'vi', 'nghia', 'nghia_tieng_viet'], 3),
    findColumn(['example', 'example_sentence', 'sentence', 'vi_du', 'cau_vi_du'], 4),
  ];
  const hasHeader = headerNames.some((header) => [
    'word', 'english', 'english_word', 'vocab', 'vocabulary', 'term', 'tu_vung', 'tu_tieng_anh',
    'phonetic', 'ipa', 'pronunciation', 'pos', 'type', 'part_of_speech', 'tu_loai',
    'meaning', 'definition', 'vietnamese', 'vietnamese_meaning', 'meaning_vi', 'vi', 'nghia',
    'nghia_tieng_viet', 'example', 'example_sentence', 'sentence', 'vi_du', 'cau_vi_du'
  ].includes(header));

  const dataRows = hasHeader ? rows.slice(1) : rows;
  const cellToText = (value) => {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return String(value).replace(/[\r\n]+/g, ' ').slice(0, MAX_SPREADSHEET_CELL_CHARS);
  };

  return dataRows
    .map((row) => columns.map((column) => cellToText(Array.isArray(row) ? row[column] : '')).join('\t'))
    .filter((row) => row.replace(/\t/g, '').trim())
    .join('\n');
}

export function BulkAddWordModal() {
  const { modals, openModal, closeModal } = useModal();
  const { success, error: toastError } = useToast();

  const isOpen = Boolean(modals?.bulkAdd?.open);

  // Bước hiện tại: 'guide' (Bước 1: Prompt AI), 'input' (Bước 2: Nạp File Excel / Bảng), 'preview' (Bước 3: Xem trước & Lưu)
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
  const [isDragging, setIsDragging] = useState(false);

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
    setIsDragging(false);

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

  // 2. Phân tích văn bản khi người dùng dán bảng tính
  const handleParseText = () => {
    if (!rawText.trim()) {
      setErrorMessage('Vui lòng dán bảng từ vựng hoặc tải lên file Excel!');
      return;
    }
    const rows = parseBulkInput(rawText);
    if (rows.length === 0) {
      setErrorMessage('Không phân tích được từ vựng nào. Bạn hãy kiểm tra lại định dạng bảng hoặc copy từ file Excel!');
      return;
    }
    setParsedWords(rows);
    setErrorMessage('');
    setActiveStep('preview');
    success(`Đã nhận diện ${rows.length} từ vựng! Hãy xem lại bảng bên dưới nhé.`);
  };

  // 3. Xử lý đọc file Excel (.xlsx, .xls) hoặc CSV
  const processFile = async (file) => {
    if (!file) return;

    setIsFileLoading(true);
    setErrorMessage('');

    try {
      const fileName = file.name.toLowerCase();

      if (file.size > MAX_SPREADSHEET_BYTES) {
        throw new Error('File quá lớn. Vui lòng chọn file không quá 10 MB.');
      }

      // File Excel (.xlsx / .xls)
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const { default: xlsxModule } = await import('@e965/xlsx/dist/xlsx.mini.min.js');
        const XLSX = xlsxModule?.default || xlsxModule;
        const workbook = XLSX.read(await file.arrayBuffer(), {
          type: 'array',
          dense: true,
          cellFormula: false,
          cellHTML: false,
          cellStyles: false,
          bookVBA: false,
        });
        const firstSheetName = workbook.SheetNames?.[0];
        if (!firstSheetName) throw new Error('File Excel không có sheet dữ liệu.');
        const sheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          raw: false,
          defval: '',
          blankrows: false,
        });
        const rowsText = spreadsheetRowsToText(rows);
        const parsedRows = parseBulkInput(rowsText);
        if (parsedRows.length > 0) {
          setParsedWords(parsedRows);
          setActiveStep('preview');
          success(`Đã đọc thành công ${parsedRows.length} từ từ file Excel "${file.name}"! 🎉`);
        } else {
          setErrorMessage('Không tìm thấy dữ liệu từ vựng hợp lệ trong file Excel. Hãy kiểm tra các cột word, phonetic, pos, meaning, example_sentence.');
        }
      }
      // File CSV / TSV / TXT
      else if (fileName.endsWith('.csv') || fileName.endsWith('.tsv') || fileName.endsWith('.txt')) {
        const text = await file.text();
        const rows = parseBulkInput(text);
        if (rows.length > 0) {
          setParsedWords(rows);
          setActiveStep('preview');
          success(`Đã nạp thành công ${rows.length} từ từ file "${file.name}"! 🎉`);
        } else {
          setErrorMessage('Không phân tích được từ vựng từ file này.');
        }
      } else {
        setErrorMessage('Định dạng file không được hỗ trợ. Vui lòng chọn file Excel (.xlsx, .xls) hoặc .csv');
      }
    } catch (err) {
      console.error('[BulkAddWordModal] file upload error:', err);
      setErrorMessage(err?.message || 'Không thể đọc file Excel. Hãy kiểm tra lại file của bạn.');
    } finally {
      setIsFileLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  // 4. Mở pop-up Tạo chủ đề mới
  const handleOpenCreateTopic = () => {
    openModal('createTopic', { initialStep: 'topic' });
  };

  // 5. Chỉnh sửa bảng Live Preview
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

  // 6. Lưu tất cả từ vào CSDL Supabase
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

      const { error: insertErr } = await supabase
        .from('words')
        .insert(wordsPayload);

      if (insertErr) {
        if (insertErr.message?.includes('violates row-level security policy')) {
          throw new Error('Chủ đề này thuộc hệ thống hoặc của người dùng khác. Bạn hãy bấm "+ Tạo chủ đề mới" để lưu vào kho từ của riêng bạn nhé!');
        }
        throw insertErr;
      }

      clearTopicCache();
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
      <div className="w-full max-w-3xl bg-[#FFFDF9] rounded-3xl shadow-[6px_8px_0px_#382E2B] overflow-hidden border-[3px] border-[#382E2B] flex flex-col max-h-[92vh] font-sans my-auto">
        {/* Header Modal gọn gàng */}
        <div className="px-5 sm:px-6 py-3.5 border-b-2 border-[#382E2B] flex items-center justify-between shrink-0 bg-[#FFF8EE]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#E1EDDB] border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] flex items-center justify-center text-lg sm:text-xl shrink-0">
              📊
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-heading font-black text-[#382E2B]">
                Thêm từ vựng hàng loạt
              </h2>
              <p className="text-xs font-semibold text-[#766C5F]">Xuất file Excel từ AI hoặc tải file từ máy tính 🐾</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-2xl bg-white border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] text-[#382E2B] hover:bg-[#FAF5EB] active:translate-y-0.5 transition-all cursor-pointer font-black text-sm"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Thanh chuyển bước tinh giản (3 Steps) */}
        <div className="flex border-b-2 border-[#382E2B] bg-[#FAF5EB] p-1.5 gap-1.5 sm:gap-2 shrink-0 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveStep('guide')}
            className={`flex-1 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeStep === 'guide'
                ? 'bg-[#382E2B] text-white shadow-sm'
                : 'bg-white text-[#766C5F] hover:text-[#382E2B] border border-[#382E2B]/15'
            }`}
          >
            <span>🤖</span>
            <span>1. Mẫu Prompt AI</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep('input')}
            className={`flex-1 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeStep === 'input'
                ? 'bg-[#382E2B] text-white shadow-sm'
                : 'bg-white text-[#766C5F] hover:text-[#382E2B] border border-[#382E2B]/15'
            }`}
          >
            <span>📥</span>
            <span>2. Nạp File Excel / Bảng</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (parsedWords.length > 0) setActiveStep('preview');
              else handleParseText();
            }}
            className={`flex-1 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeStep === 'preview'
                ? 'bg-[#5a7d4d] text-white shadow-sm font-black'
                : 'bg-white text-[#766C5F] hover:text-[#382E2B] border border-[#382E2B]/15'
            }`}
          >
            <span>👁️</span>
            <span>3. Xem lại & Lưu {parsedWords.length > 0 ? `(${parsedWords.length})` : ''}</span>
          </button>
        </div>

        {/* Nội dung các bước */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* ════════════ BƯỚC 1: LẤY PROMPT AI XUẤT EXCEL ════════════ */}
          {activeStep === 'guide' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* Thẻ hướng dẫn 2 bước ngắn gọn */}
              <div className="bg-[#FFF8EE] p-3.5 sm:p-4 rounded-2xl border-2 border-dashed border-[#E5A13C] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="font-heading font-black text-sm text-[#382E2B] flex items-center gap-1.5">
                    <span>💡</span>
                    <span>Cách lấy file Excel nhanh từ ChatGPT / Gemini:</span>
                  </div>
                  <p className="text-[#6E6458] leading-relaxed">
                    Sao chép prompt bên dưới và gửi kèm danh sách từ của bạn. AI sẽ xuất file <strong>Excel (.xlsx)</strong> để tải về hoặc bảng dữ liệu chuẩn 5 cột!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="px-4 py-2 rounded-xl bg-[#EA7349] hover:bg-[#d86238] text-white font-black text-xs border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <span>{isPromptCopied ? '✅' : '📋'}</span>
                  <span>{isPromptCopied ? 'Đã sao chép!' : 'Sao chép Prompt AI'}</span>
                </button>
              </div>

              {/* Khung nội dung Prompt */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-[#766C5F]">
                  <span>Nội dung Prompt chuẩn hóa (Yêu cầu xuất Excel & Bảng 5 cột):</span>
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="text-[#D36135] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>{isPromptCopied ? 'Đã sao chép ✅' : 'Sao chép nhanh 📋'}</span>
                  </button>
                </div>
                <div className="p-3 bg-white rounded-2xl border-2 border-[#382E2B]/20 max-h-56 overflow-y-auto text-xs font-mono text-[#4A4036] leading-relaxed whitespace-pre-wrap select-all">
                  {AI_PROMPT_TEMPLATE}
                </div>
              </div>

              {/* Nút chuyển sang Bước 2 */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveStep('input')}
                  className="px-5 py-2.5 rounded-2xl bg-[#5a7d4d] hover:bg-[#4d6d41] text-white font-black text-xs sm:text-sm border-2 border-[#382E2B] shadow-[2px_3px_0px_#382E2B] active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>Đã có file từ AI ➔ Sang bước 2: Nạp File</span>
                </button>
              </div>
            </div>
          )}

          {/* ════════════ BƯỚC 2: NẠP FILE EXCEL / DÁN BẢNG ════════════ */}
          {activeStep === 'input' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Cảnh báo chưa có chủ đề */}
              {topicsList.length === 0 && (
                <div className="p-3 rounded-2xl bg-[#FFF3D6] border-2 border-[#D97706]/40 text-[#92400E] text-xs font-semibold flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base shrink-0">⚠️</span>
                    <span>Bạn chưa có chủ đề cá nhân nào. Hãy bấm nút tạo chủ đề mới để bắt đầu lưu từ nhé!</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenCreateTopic}
                    className="px-3 py-1.5 bg-[#5a7d4d] hover:bg-[#4d6d41] text-white font-black text-xs rounded-xl border-2 border-[#382E2B] shadow-sm cursor-pointer shrink-0"
                  >
                    + Tạo chủ đề
                  </button>
                </div>
              )}

              {/* Chọn Chủ đề & Tên bài học */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#FAF5EB] border-2 border-[#382E2B]/15">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-black text-[#766C5F] uppercase tracking-wider">
                      Chủ đề cá nhân <span className="text-[#D36135]">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleOpenCreateTopic}
                      className="text-[11px] font-bold text-[#D36135] hover:underline cursor-pointer"
                    >
                      + Tạo chủ đề mới
                    </button>
                  </div>

                  {topicsList.length === 0 ? (
                    <button
                      type="button"
                      onClick={handleOpenCreateTopic}
                      className="w-full bg-white border-2 border-dashed border-[#382E2B] px-3 py-2 rounded-xl text-[#382E2B] text-xs font-bold hover:bg-[#FAF5EB] cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>📁 Bấm để tạo chủ đề & chọn thư mục</span>
                    </button>
                  ) : (
                    <select
                      value={topicId}
                      onChange={(e) => setTopicId(e.target.value)}
                      className="w-full bg-white border-2 border-[#382E2B] px-3 py-2 rounded-xl outline-none text-[#382E2B] text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
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
                  <label className="block text-xs font-black text-[#766C5F] uppercase tracking-wider mb-1">
                    Nhóm bài học <span className="text-[11px] font-normal text-[#A2978A]">(Tùy chọn)</span>
                  </label>
                  <input
                    type="text"
                    value={lessonName}
                    onChange={(e) => setLessonName(e.target.value)}
                    placeholder="VD: Lesson 1, Unit 2, Từ ngày..."
                    className="w-full bg-white border-2 border-[#382E2B] px-3 py-2 rounded-xl outline-none text-[#382E2B] text-xs sm:text-sm font-bold shadow-sm transition-colors"
                  />
                </div>
              </div>

              {/* KHU VỰC CHÍNH: TẢI FILE EXCEL TRỰC TIẾP (Kéo thả hoặc Bấm chọn) */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`p-5 rounded-2xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center gap-2 cursor-pointer ${
                  isDragging
                    ? 'border-[#5a7d4d] bg-[#F3F8F1] scale-[1.01]'
                    : 'border-[#382E2B]/40 bg-[#FFFDF7] hover:bg-[#FFF8EE]'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-[#E1EDDB] border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] flex items-center justify-center text-2xl">
                  {isFileLoading ? '⏳' : '📊'}
                </div>

                <div>
                  <h4 className="text-sm font-heading font-black text-[#382E2B]">
                    {isDragging ? 'Thả file Excel vào đây ngay 🐾' : 'Kéo thả file Excel vào đây, hoặc bấm để chọn'}
                  </h4>
                  <p className="text-xs text-[#766C5F] mt-0.5">
                    Hỗ trợ file <strong>.xlsx</strong>, <strong>.xls</strong> hoặc <strong>.csv</strong> tải từ AI hoặc chuẩn bị sẵn (tối đa 10 MB)
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isFileLoading}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="mt-1 px-4 py-2 rounded-xl bg-white hover:bg-[#FAF5EB] text-[#382E2B] font-black text-xs border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B] active:translate-y-0.5 transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  {isFileLoading ? (
                    <>
                      <span className="animate-spin">🔄</span>
                      <span>Đang đọc file Excel...</span>
                    </>
                  ) : (
                    <>
                      <span>📂</span>
                      <span>Chọn file từ máy tính</span>
                    </>
                  )}
                </button>
              </div>

              {/* HOẶC DÁN BẢNG TỪ VỰNG */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#382E2B]/20"></div>
                </div>
                <div className="relative flex justify-center text-[11px] font-black uppercase tracking-wider text-[#A2978A]">
                  <span className="bg-[#FFFDF9] px-3">Hoặc dán bảng từ vựng trực tiếp</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <textarea
                  rows={4}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`Dán trực tiếp bảng từ copy từ Excel, Google Sheets hoặc bảng của AI vào đây...\n\nVí dụ định dạng:\nword\tphonetic\tpos\tmeaning\texample_sentence\nresilient\t/rɪˈzɪl.jənt/\tadj\tkiên cường, bền bỉ\tShe remained resilient despite difficulties.`}
                  className="w-full bg-white border-2 border-[#382E2B] focus:border-[#D36135] p-3 rounded-2xl outline-none text-[#382E2B] text-xs font-mono shadow-[1px_2px_0px_rgba(56,46,43,0.1)] transition-colors resize-none leading-relaxed"
                />
              </div>

              {/* Thông báo lỗi nếu có */}
              {errorMessage && (
                <div className="p-3 rounded-2xl bg-[#FFECE4] border-2 border-[#EA7349] text-[#CF4F23] text-xs font-bold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Điều hướng */}
              <div className="pt-1 flex items-center justify-between border-t-2 border-dashed border-[#EFE8D6]">
                <button
                  type="button"
                  onClick={() => setActiveStep('guide')}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#766C5F] hover:text-[#382E2B] hover:bg-[#FAF5EB] transition-colors cursor-pointer"
                >
                  ‹ Quay lại xem Prompt
                </button>
                <button
                  type="button"
                  onClick={handleParseText}
                  className="px-5 py-2.5 rounded-2xl bg-[#5a7d4d] hover:bg-[#4d6d41] text-white font-black text-xs sm:text-sm border-2 border-[#382E2B] shadow-[2px_3px_0px_#382E2B] active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>Phân tích & Xem trước ➔</span>
                </button>
              </div>
            </div>
          )}

          {/* ════════════ BƯỚC 3: XEM TRƯỚC (LIVE PREVIEW) ════════════ */}
          {activeStep === 'preview' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* Thống kê từ vựng & nút thêm dòng */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#FFF8EE] rounded-2xl border-2 border-[#382E2B]/15 text-xs font-bold text-[#382E2B]">
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
                  <span>Thêm dòng</span>
                </button>
              </div>

              {/* Bảng xem trước có thể sửa trực tiếp */}
              <div className="border-2 border-[#382E2B] rounded-2xl overflow-hidden bg-white shadow-sm max-h-72 overflow-y-auto">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#FAF5EB] border-b-2 border-[#382E2B] text-[#766C5F] uppercase font-black tracking-wider sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-2.5 min-w-[120px]">Từ vựng *</th>
                        <th className="py-2.5 px-2.5 min-w-[100px]">Phiên âm</th>
                        <th className="py-2.5 px-2.5 w-20">Loại từ</th>
                        <th className="py-2.5 px-2.5 min-w-[150px]">Nghĩa tiếng Việt *</th>
                        <th className="py-2.5 px-2.5 min-w-[180px]">Câu ví dụ</th>
                        <th className="py-2.5 px-2 w-9 text-center">Xóa</th>
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
                            <td className="py-1.5 px-1.5">
                              <input
                                type="text"
                                value={row.word}
                                onChange={(e) => handleCellChange(row.id, 'word', e.target.value)}
                                placeholder="Từ tiếng Anh"
                                className="w-full px-2 py-1.5 rounded-lg border border-[#DECDBB] focus:border-[#D36135] text-xs font-bold text-[#382E2B] outline-none"
                              />
                            </td>
                            <td className="py-1.5 px-1.5">
                              <input
                                type="text"
                                value={row.phonetic}
                                onChange={(e) => handleCellChange(row.id, 'phonetic', e.target.value)}
                                placeholder="/IPA/"
                                className="w-full px-2 py-1.5 rounded-lg border border-[#DECDBB] focus:border-[#D36135] text-xs text-[#5C5248] outline-none"
                              />
                            </td>
                            <td className="py-1.5 px-1.5">
                              <input
                                type="text"
                                value={row.pos}
                                onChange={(e) => handleCellChange(row.id, 'pos', e.target.value)}
                                placeholder="adj/noun"
                                className="w-full px-2 py-1.5 rounded-lg border border-[#DECDBB] focus:border-[#D36135] text-xs text-[#5C5248] outline-none"
                              />
                            </td>
                            <td className="py-1.5 px-1.5">
                              <input
                                type="text"
                                value={row.meaning}
                                onChange={(e) => handleCellChange(row.id, 'meaning', e.target.value)}
                                placeholder="Nghĩa tiếng Việt"
                                className="w-full px-2 py-1.5 rounded-lg border border-[#DECDBB] focus:border-[#D36135] text-xs font-semibold text-[#382E2B] outline-none"
                              />
                            </td>
                            <td className="py-1.5 px-1.5">
                              <input
                                type="text"
                                value={row.example_sentence}
                                onChange={(e) => handleCellChange(row.id, 'example_sentence', e.target.value)}
                                placeholder="Câu ví dụ..."
                                className="w-full px-2 py-1.5 rounded-lg border border-[#DECDBB] focus:border-[#D36135] text-xs text-[#5C5248] outline-none"
                              />
                            </td>
                            <td className="py-1.5 px-1.5 text-center">
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
                <div className="p-3 rounded-2xl bg-[#FFECE4] border-2 border-[#EA7349] text-[#CF4F23] text-xs font-bold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Điều hướng lưu */}
              <div className="pt-2 flex items-center justify-between border-t-2 border-dashed border-[#EFE8D6]">
                <button
                  type="button"
                  onClick={() => setActiveStep('input')}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#766C5F] hover:text-[#382E2B] hover:bg-[#FAF5EB] transition-colors cursor-pointer"
                >
                  ‹ Quay lại nạp nguồn
                </button>

                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={isSubmitting || validCount === 0}
                  className="px-5 py-2.5 rounded-2xl bg-[#5a7d4d] hover:bg-[#4d6d41] text-white font-black text-xs sm:text-sm border-2 border-[#382E2B] shadow-[2px_3px_0px_#382E2B] active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin">🔄</span>
                      <span>Đang lưu {validCount} từ...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      <span>Lưu tất cả {validCount} từ vào bộ từ ➔</span>
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
