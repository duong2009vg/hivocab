// src/components/common/VisualInspector.jsx
// 🎯 Bộ công cụ Visual Component Inspector & Sửa giao diện trực tiếp
// Cho phép click chọn component hoặc bôi chọn vùng giao diện để sửa live hoặc tạo prompt gửi AI sửa ngay.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../providers/AuthProvider.jsx';
import { useModal } from '../../context/ModalContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

// Từ điển ánh xạ component thông dụng sang đường dẫn file mã nguồn
const KNOWN_FILE_MAP = {
  MainSidebar: 'src/components/layout/MainSidebar.jsx',
  MobileBottomNav: 'src/components/layout/MobileBottomNav.jsx',
  MobileProfileDropdown: 'src/components/layout/MobileProfileDropdown.jsx',
  PageDashboard: 'src/components/pages/PageDashboard.jsx',
  PageTopics: 'src/components/pages/PageTopics.jsx',
  PageTopicDetail: 'src/components/pages/PageTopicDetail.jsx',
  PageLessonDetail: 'src/components/pages/PageLessonDetail.jsx',
  PageExercises: 'src/components/pages/PageExercises.jsx',
  PageThptRoom: 'src/components/pages/PageThptRoom.jsx',
  PageLibrary: 'src/components/pages/PageLibrary.jsx',
  PageVocabulary: 'src/components/pages/PageVocabulary.jsx',
  PageDictionary: 'src/components/pages/PageDictionary.jsx',
  PageProfile: 'src/components/pages/PageProfile.jsx',
  PageSettings: 'src/components/pages/PageSettings.jsx',
  PageLearning: 'src/components/pages/PageLearning.jsx',
  PageLanding: 'src/components/pages/PageLanding.jsx',
  ExamCard: 'src/components/thpt/ExamCard.jsx',
  ExamHeader: 'src/components/thpt/ExamHeader.jsx',
  ExamPassagePanel: 'src/components/thpt/ExamPassagePanel.jsx',
  ExamQuestionsPanel: 'src/components/thpt/ExamQuestionsPanel.jsx',
  BilingualReadingView: 'src/components/bilingual/BilingualReadingView.jsx',
  BilingualGapFillView: 'src/components/bilingual/BilingualGapFillView.jsx',
  AddWordModal: 'src/components/modals/AddWordModal.jsx',
  CreateTopicModal: 'src/components/modals/CreateTopicModal.jsx',
  PricingModal: 'src/components/modals/PricingModal.jsx',
  BugReportModal: 'src/components/modals/BugReportModal.jsx',
  SaveWordToTopicModal: 'src/components/modals/SaveWordToTopicModal.jsx',
  BulkAddWordModal: 'src/components/modals/BulkAddWordModal.jsx',
  IeltsGoalModal: 'src/components/modals/IeltsGoalModal.jsx',
  SrsExplainerModal: 'src/components/modals/SrsExplainerModal.jsx',
};

function getReactComponentInfo(domNode) {
  if (!domNode) return null;

  let componentName = null;
  let fileHint = null;

  // 1. Dò tìm React Fiber để lấy tên Component React chuẩn xác
  const fiberKey = Object.keys(domNode).find(
    (k) => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$')
  );

  if (fiberKey) {
    let fiber = domNode[fiberKey];
    while (fiber) {
      if (fiber.type && typeof fiber.type === 'function') {
        const name = fiber.type.displayName || fiber.type.name;
        if (
          name &&
          !name.startsWith('_') &&
          !['Anonymous', 'Suspense', 'ErrorBoundary', 'RouteProvider', 'AuthProvider', 'ModalProvider'].includes(name)
        ) {
          componentName = name;
          break;
        }
      }
      fiber = fiber.return;
    }
  }

  // 2. Nhận diện qua data-purpose hoặc ID trang
  const purposeEl = domNode.closest('[data-purpose]');
  const purpose = purposeEl ? purposeEl.getAttribute('data-purpose') : null;

  const pageEl = domNode.closest('.page, [id^="page-"]');
  const pageId = pageEl ? pageEl.id : null;

  if (!componentName) {
    if (purpose) {
      componentName = purpose
        .split('-')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join('');
    } else if (pageId) {
      componentName = pageId
        .split('-')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join('');
    } else {
      componentName = domNode.tagName.toLowerCase();
    }
  }

  // 3. Tra cứu file nguồn
  fileHint =
    KNOWN_FILE_MAP[componentName] ||
    (componentName.startsWith('Page') ? `src/components/pages/${componentName}.jsx` : 'src/components/...');

  // Lấy danh sách class CSS thuần (bỏ các class của inspector nếu có)
  const rawClass = typeof domNode.className === 'string' ? domNode.className : '';
  const cleanClass = rawClass
    .replace(/hivocab-inspect-[a-z0-9_-]+/gi, '')
    .trim();

  // Lấy đoạn trích text hiển thị
  const innerText = (domNode.innerText || domNode.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80);

  // Lấy kích thước
  const rect = domNode.getBoundingClientRect();

  return {
    componentName,
    fileHint,
    purpose,
    pageId,
    tagName: domNode.tagName.toLowerCase(),
    className: cleanClass,
    innerText,
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    top: Math.round(rect.top),
    left: Math.round(rect.left),
  };
}

function VisualInspectorInner() {
  const [isActive, setIsActive] = useState(false);
  const [hoveredRect, setHoveredRect] = useState(null);
  const [hoveredInfo, setHoveredInfo] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null); // DOM node
  const [selectedInfo, setSelectedInfo] = useState(null);
  const [highlightedText, setHighlightedText] = useState('');
  const [activeTab, setActiveTab] = useState('prompt'); // 'prompt' | 'liveEdit' | 'css'
  const [userPromptText, setUserPromptText] = useState('');
  const [isLiveEditingText, setIsLiveEditingText] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Backup original styles for live edit reset
  const originalStylesRef = useRef(null);

  const { openModal } = useModal ? useModal() : { openModal: () => {} };
  const { showToast } = useToast ? useToast() : { showToast: (msg) => alert(msg) };

  // Bật/tắt bằng phím tắt Alt + I hoặc Ctrl + Shift + X
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.altKey && (e.key === 'i' || e.key === 'I')) || (e.ctrlKey && e.shiftKey && (e.key === 'x' || e.key === 'X'))) {
        e.preventDefault();
        setIsActive((prev) => !prev);
        setSelectedTarget(null);
        setSelectedInfo(null);
      } else if (e.key === 'Escape') {
        if (selectedTarget) {
          setSelectedTarget(null);
          setSelectedInfo(null);
        } else if (isActive) {
          setIsActive(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, selectedTarget]);

  // Xử lý hover khi đang ở Inspect Mode
  useEffect(() => {
    if (!isActive || selectedTarget) {
      setHoveredRect(null);
      setHoveredInfo(null);
      return;
    }

    let rafId = null;

    const handleMouseMove = (e) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        if (!el || el.closest('[data-inspector-ui="true"]') || el === document.body || el === document.documentElement) {
          setHoveredRect(null);
          setHoveredInfo(null);
          return;
        }

        const rect = el.getBoundingClientRect();
        setHoveredRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
        setHoveredInfo(getReactComponentInfo(el));
      });
    };

    const handleClick = (e) => {
      // Bỏ qua các click bên trong giao diện Inspector
      if (e.target.closest('[data-inspector-ui="true"]')) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const el = e.target;
      const selText = window.getSelection() ? window.getSelection().toString().trim() : '';

      setSelectedTarget(el);
      setSelectedInfo(getReactComponentInfo(el));
      setHighlightedText(selText);
      setHoveredRect(null);
      setHoveredInfo(null);

      // Lưu lại style gốc để có thể hoàn tác khi sửa live
      originalStylesRef.current = {
        cssText: el.style.cssText,
        innerHTML: el.innerHTML,
      };

      // Đặt sẵn prompt mẫu phù hợp
      if (selText) {
        setUserPromptText(`Sửa đoạn văn bản "${selText}" thành: `);
      } else {
        setUserPromptText('');
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick, true);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick, true);
    };
  }, [isActive, selectedTarget]);

  // Bật/tắt chế độ gõ chữ trực tiếp trên element
  const toggleLiveTextEdit = useCallback(() => {
    if (!selectedTarget) return;
    const willEnable = !isLiveEditingText;
    selectedTarget.contentEditable = willEnable ? 'true' : 'false';
    if (willEnable) {
      selectedTarget.focus();
      if (showToast) showToast('Đã bật gõ chữ trực tiếp! Bạn bấm vào chữ trên web để sửa thử nhé ✏️', 'info');
    } else {
      if (showToast) showToast('Đã lưu bản sửa chữ xem thử.', 'success');
      // Cập nhật lại thông tin text
      setSelectedInfo(getReactComponentInfo(selectedTarget));
    }
    setIsLiveEditingText(willEnable);
  }, [selectedTarget, isLiveEditingText, showToast]);

  // Tinh chỉnh CSS nhanh (Padding, Margin, FontSize, Color)
  const adjustStyle = useCallback((property, delta, unit = 'px') => {
    if (!selectedTarget) return;
    const computed = window.getComputedStyle(selectedTarget);
    const currentVal = parseFloat(computed[property]) || 0;
    const newVal = Math.max(0, currentVal + delta);
    selectedTarget.style[property] = `${newVal}${unit}`;
    setSelectedInfo(getReactComponentInfo(selectedTarget));
  }, [selectedTarget]);

  // Hoàn tác các sửa đổi CSS & text live
  const handleResetLiveEdits = useCallback(() => {
    if (!selectedTarget || !originalStylesRef.current) return;
    selectedTarget.style.cssText = originalStylesRef.current.cssText;
    selectedTarget.innerHTML = originalStylesRef.current.innerHTML;
    selectedTarget.contentEditable = 'false';
    setIsLiveEditingText(false);
    setSelectedInfo(getReactComponentInfo(selectedTarget));
    if (showToast) showToast('Đã khôi phục trạng thái ban đầu của phần tử.', 'info');
  }, [selectedTarget, showToast]);

  // Sao chép prompt chuẩn cho AI
  const handleCopyAiPrompt = useCallback(() => {
    if (!selectedInfo) return;

    const prompt = `[Yêu cầu sửa UI Frontend]
- Component: <${selectedInfo.componentName} />
- File nguồn gợi ý: ${selectedInfo.fileHint || 'src/components/...'}
- Phần tử DOM: <${selectedInfo.tagName} class="${selectedInfo.className}">
${highlightedText ? `- Đoạn chữ bôi chọn: "${highlightedText}"\n` : ''}- Nội dung hiện tại: "${selectedInfo.innerText}"
- Kích thước: ${selectedInfo.width}px × ${selectedInfo.height}px
- Yêu cầu cụ thể: ${userPromptText || 'Tối ưu lại kích thước, khoảng cách và giao diện cho phần tử này giúp mình nhé.'}`;

    navigator.clipboard.writeText(prompt).then(() => {
      if (showToast) {
        showToast('Đã sao chép prompt! Dán vào chat để AI sửa ngay nhé 🚀', 'success');
      } else {
        alert('Đã sao chép prompt vào Clipboard!');
      }
    });
  }, [selectedInfo, highlightedText, userPromptText, showToast]);

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          1. Nút nổi Trigger kích hoạt chế độ Inspector (Góc dưới phải)
          ───────────────────────────────────────────────────────────── */}
      <div
        data-inspector-ui="true"
        className="fixed bottom-20 lg:bottom-5 right-4 z-[9999] select-none"
      >
        {!isCollapsed ? (
          <div className="flex items-center gap-1.5 p-1.5 bg-[#FFFDF9] rounded-2xl border-2 border-[#3D352E] shadow-[3px_3px_0px_#3D352E] transition-all">
            <button
              type="button"
              onClick={() => {
                setIsActive((prev) => !prev);
                setSelectedTarget(null);
                setSelectedInfo(null);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#4D6B53] text-white shadow-[1px_1px_0px_#3D352E]'
                  : 'bg-[#FAF3E7] hover:bg-[#F3E7D3] text-[#3D352E]'
              }`}
              title="Phím tắt: Alt + I hoặc Ctrl + Shift + X"
            >
              <span className={`text-sm ${isActive ? 'animate-spin' : ''}`}>🎯</span>
              <span>{isActive ? 'Đang bật chọn UI' : 'Sửa UI trực tiếp'}</span>
              <span className="text-[10px] opacity-75 font-mono px-1 py-0.5 rounded bg-black/10">Alt+I</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="w-7 h-7 rounded-xl hover:bg-gray-100 flex items-center justify-center text-[#786F66] text-xs font-bold transition"
              title="Thu nhỏ thanh công cụ"
            >
              ›
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="w-10 h-10 rounded-2xl bg-[#FFFDF9] border-2 border-[#3D352E] shadow-[2.5px_2.5px_0px_#3D352E] flex items-center justify-center text-lg hover:scale-105 active:scale-95 transition"
            title="Mở thanh công cụ chọn Component sửa UI"
          >
            🎯
          </button>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. Thanh thông báo trạng thái khi đang ở chế độ chọn Component
          ───────────────────────────────────────────────────────────── */}
      {isActive && !selectedTarget && (
        <div
          data-inspector-ui="true"
          className="fixed top-3 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
        >
          <div className="bg-[#3D352E]/90 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg border border-amber-300 flex items-center gap-2 animate-bounce">
            <span className="text-sm">👆</span>
            <span>Rê chuột và click vào component hoặc chữ bạn muốn sửa (Bấm Esc để thoát)</span>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. Khung viền Hover Highlight & Tooltip theo con trỏ chuột
          ───────────────────────────────────────────────────────────── */}
      {isActive && hoveredRect && !selectedTarget && (
        <div
          data-inspector-ui="true"
          className="fixed pointer-events-none z-[9998] transition-all duration-75"
          style={{
            top: `${hoveredRect.top}px`,
            left: `${hoveredRect.left}px`,
            width: `${hoveredRect.width}px`,
            height: `${hoveredRect.height}px`,
            border: '2px dashed #4D6B53',
            backgroundColor: 'rgba(77, 107, 83, 0.12)',
            borderRadius: '6px',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.7)',
          }}
        >
          {hoveredInfo && (
            <div
              className="absolute -top-7 left-0 bg-[#3D352E] text-white px-2.5 py-0.5 rounded-lg text-[11px] font-bold shadow-md whitespace-nowrap flex items-center gap-1.5 pointer-events-none border border-amber-200"
            >
              <span className="text-amber-300">🧩 &lt;{hoveredInfo.componentName}&gt;</span>
              <span className="opacity-75 font-mono text-[10px]">{hoveredInfo.width}×{hoveredInfo.height}</span>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. Khung viền cố định khi đã Click chọn Component
          ───────────────────────────────────────────────────────────── */}
      {selectedTarget && (
        <div
          data-inspector-ui="true"
          className="fixed pointer-events-none z-[9998]"
          style={{
            top: `${selectedTarget.getBoundingClientRect().top}px`,
            left: `${selectedTarget.getBoundingClientRect().left}px`,
            width: `${selectedTarget.getBoundingClientRect().width}px`,
            height: `${selectedTarget.getBoundingClientRect().height}px`,
            border: '3px solid #D96B43',
            backgroundColor: 'rgba(217, 107, 67, 0.1)',
            borderRadius: '8px',
            boxShadow: '0 0 15px rgba(217, 107, 67, 0.4)',
          }}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. Bảng điều khiển sửa giao diện (Inspector Action Modal)
          ───────────────────────────────────────────────────────────── */}
      {selectedTarget && selectedInfo && (
        <div
          data-inspector-ui="true"
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none"
          onClick={() => {
            setSelectedTarget(null);
            setSelectedInfo(null);
          }}
        >
          <div
            className="w-full max-w-lg bg-[#FFFDF9] rounded-3xl border-3 border-[#3D352E] shadow-[5px_6px_0px_#3D352E] overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#FAF3E7] px-5 py-3.5 border-b-2 border-[#3D352E] flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xl">🎯</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-black text-sm text-[#3D352E] truncate">
                      &lt;{selectedInfo.componentName} /&gt;
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-[#E8EFEA] text-[#4D6B53] text-[10px] font-bold border border-[#4D6B53]/40">
                      {selectedInfo.tagName}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-[#786F66] truncate mt-0.5">
                    📁 {selectedInfo.fileHint}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedTarget(null);
                  setSelectedInfo(null);
                }}
                className="w-8 h-8 rounded-xl bg-white hover:bg-rose-50 hover:text-rose-600 border-2 border-[#3D352E] text-xs font-black flex items-center justify-center transition active:scale-90 cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Tab navigation */}
            <div className="flex items-center border-b-2 border-[#E8DEC8] bg-[#F7F1E3] px-3 pt-2 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('prompt')}
                className={`px-3.5 py-2 rounded-t-xl transition-all cursor-pointer border-t-2 border-x-2 ${
                  activeTab === 'prompt'
                    ? 'bg-[#FFFDF9] text-[#3D352E] border-[#3D352E] -mb-[2px] font-black shadow-sm'
                    : 'border-transparent text-[#786F66] hover:text-[#3D352E]'
                }`}
              >
                🤖 Gửi lệnh cho AI
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('liveEdit')}
                className={`px-3.5 py-2 rounded-t-xl transition-all cursor-pointer border-t-2 border-x-2 ${
                  activeTab === 'liveEdit'
                    ? 'bg-[#FFFDF9] text-[#3D352E] border-[#3D352E] -mb-[2px] font-black shadow-sm'
                    : 'border-transparent text-[#786F66] hover:text-[#3D352E]'
                }`}
              >
                ✏️ Sửa Live trên Web
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('css')}
                className={`px-3.5 py-2 rounded-t-xl transition-all cursor-pointer border-t-2 border-x-2 ${
                  activeTab === 'css'
                    ? 'bg-[#FFFDF9] text-[#3D352E] border-[#3D352E] -mb-[2px] font-black shadow-sm'
                    : 'border-transparent text-[#786F66] hover:text-[#3D352E]'
                }`}
              >
                🔍 Thuộc tính CSS
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs select-text">
              {/* TAB 1: GỬI LỆNH CHO AI */}
              {activeTab === 'prompt' && (
                <div className="space-y-3.5">
                  <div className="bg-[#FAF3E7] p-3 rounded-2xl border border-[#3D352E]/30 space-y-1">
                    <div className="text-[11px] font-bold text-[#786F66] uppercase tracking-wider">
                      Phần tử đã chọn
                    </div>
                    <div className="font-semibold text-[#302A24] truncate">
                      <strong>Text:</strong> {highlightedText ? `"${highlightedText}" (Bôi chọn)` : `"${selectedInfo.innerText || 'Không có chữ'}"`}
                    </div>
                    <div className="text-[11px] font-mono text-[#554D45] truncate">
                      <strong>Kích thước:</strong> {selectedInfo.width}px × {selectedInfo.height}px
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#3D352E] mb-1.5">
                      Bạn muốn sửa gì ở phần này? ✏️
                    </label>
                    <textarea
                      rows={3}
                      value={userPromptText}
                      onChange={(e) => setUserPromptText(e.target.value)}
                      placeholder="Ví dụ: Đổi màu chữ sang trắng, tăng padding lên 12px, cho logo to ra 56px, sửa câu chữ..."
                      className="w-full p-3 rounded-2xl bg-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] font-medium text-xs focus:outline-none focus:ring-2 focus:ring-[#4D6B53] placeholder:text-gray-400"
                    />
                  </div>

                  <div className="pt-1 flex flex-col sm:flex-row items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleCopyAiPrompt}
                      className="w-full sm:flex-1 py-2.5 px-4 rounded-2xl bg-[#D96B43] hover:bg-[#C85A3F] text-white font-black text-xs border-2 border-[#3D352E] shadow-[2.5px_2.5px_0px_#3D352E] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>📋</span>
                      <span>Sao chép Prompt vào Chat</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('liveEdit')}
                      className="w-full sm:w-auto py-2.5 px-3.5 rounded-2xl bg-white hover:bg-[#FAF3E7] text-[#3D352E] font-bold text-xs border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>✏️</span>
                      <span>Sửa thử trước</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: SỬA TRỰC TIẾP (LIVE EDIT) */}
              {activeTab === 'liveEdit' && (
                <div className="space-y-4">
                  {/* Bật gõ chữ WYSIWYG */}
                  <div className="p-3 bg-amber-50 rounded-2xl border-2 border-amber-300 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-black text-[#3D352E] text-xs">Gõ sửa chữ trực tiếp trên màn hình</div>
                      <div className="text-[11px] text-[#665C52]">Click thẳng vào chữ trên trang để gõ thử</div>
                    </div>
                    <button
                      type="button"
                      onClick={toggleLiveTextEdit}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs border-2 border-[#3D352E] shadow-[1.5px_1.5px_0px_#3D352E] transition-all cursor-pointer shrink-0 ${
                        isLiveEditingText ? 'bg-amber-400 text-[#3D352E]' : 'bg-white hover:bg-gray-50 text-[#3D352E]'
                      }`}
                    >
                      {isLiveEditingText ? 'Đang bật gõ ✍️' : 'Bật gõ chữ ✏️'}
                    </button>
                  </div>

                  {/* Tăng giảm kích thước nhanh */}
                  <div className="space-y-2.5">
                    <div className="text-xs font-black text-[#3D352E]">Tinh chỉnh CSS nhanh tại chỗ:</div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Padding */}
                      <div className="bg-[#FAF3E7] p-2.5 rounded-xl border border-[#3D352E]/30 flex items-center justify-between">
                        <span className="font-bold">Padding:</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => adjustStyle('padding', -2)}
                            className="w-6 h-6 rounded-lg bg-white border border-[#3D352E] font-black hover:bg-gray-100 flex items-center justify-center"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustStyle('padding', 2)}
                            className="w-6 h-6 rounded-lg bg-white border border-[#3D352E] font-black hover:bg-gray-100 flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Margin */}
                      <div className="bg-[#FAF3E7] p-2.5 rounded-xl border border-[#3D352E]/30 flex items-center justify-between">
                        <span className="font-bold">Margin:</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => adjustStyle('margin', -2)}
                            className="w-6 h-6 rounded-lg bg-white border border-[#3D352E] font-black hover:bg-gray-100 flex items-center justify-center"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustStyle('margin', 2)}
                            className="w-6 h-6 rounded-lg bg-white border border-[#3D352E] font-black hover:bg-gray-100 flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Font size */}
                      <div className="bg-[#FAF3E7] p-2.5 rounded-xl border border-[#3D352E]/30 flex items-center justify-between">
                        <span className="font-bold">Cỡ chữ:</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => adjustStyle('fontSize', -1)}
                            className="w-6 h-6 rounded-lg bg-white border border-[#3D352E] font-black hover:bg-gray-100 flex items-center justify-center"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustStyle('fontSize', 1)}
                            className="w-6 h-6 rounded-lg bg-white border border-[#3D352E] font-black hover:bg-gray-100 flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Ẩn / Hiện */}
                      <div className="bg-[#FAF3E7] p-2.5 rounded-xl border border-[#3D352E]/30 flex items-center justify-between">
                        <span className="font-bold">Ẩn/Hiện:</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedTarget) {
                              selectedTarget.style.display =
                                selectedTarget.style.display === 'none' ? '' : 'none';
                            }
                          }}
                          className="px-2 py-1 rounded-lg bg-white border border-[#3D352E] font-bold text-[11px] hover:bg-gray-100"
                        >
                          👁️ Đổi
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleResetLiveEdits}
                      className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#3D352E] font-bold text-xs transition cursor-pointer"
                    >
                      🔄 Hoàn tác tất cả
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('prompt')}
                      className="px-3.5 py-1.5 rounded-xl bg-[#4D6B53] text-white font-bold text-xs border border-[#3D352E] shadow-xs hover:bg-[#3E5743] transition cursor-pointer"
                    >
                      Lấy Prompt gửi AI 🚀
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: THUỘC TÍNH CSS */}
              {activeTab === 'css' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-black text-[#3D352E] mb-1">
                      Các class Tailwind / CSS đang dùng:
                    </label>
                    <div className="p-2.5 bg-gray-100 rounded-xl font-mono text-[11px] text-[#3D352E] break-all border border-gray-300 max-h-28 overflow-y-auto">
                      {selectedInfo.className || '(Không có class)'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 bg-[#FAF3E7] rounded-lg">
                      <strong className="text-gray-500 block">Kích thước thực:</strong>
                      <span className="font-mono font-bold text-[#3D352E]">{selectedInfo.width}px × {selectedInfo.height}px</span>
                    </div>
                    <div className="p-2 bg-[#FAF3E7] rounded-lg">
                      <strong className="text-gray-500 block">Thẻ HTML:</strong>
                      <span className="font-mono font-bold text-[#3D352E]">&lt;{selectedInfo.tagName}&gt;</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedInfo.className);
                      if (showToast) showToast('Đã copy danh sách class CSS!', 'success');
                    }}
                    className="w-full py-2 bg-white hover:bg-gray-50 border-2 border-[#3D352E] rounded-xl font-bold text-xs shadow-xs"
                  >
                    📋 Sao chép danh sách class
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * VisualInspector Gatekeeper
 * Chỉ hiển thị và cấp quyền sử dụng tính năng cho tài khoản Quản trị viên (Admin).
 * Người học và khách bình thường sẽ không thấy và không dùng được công cụ này.
 */
export function VisualInspector() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return null;
  }

  return <VisualInspectorInner />;
}

export default VisualInspector;
