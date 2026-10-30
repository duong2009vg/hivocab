// src/components/common/VisualInspector.jsx
// 🎯 Bộ công cụ Visual Component Inspector & Sửa giao diện trực tiếp (Dành riêng cho Admin)
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

  // Lấy danh sách class CSS thuần
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
  const [activeTab, setActiveTab] = useState('liveEdit'); // Mặc định mở tab sửa live
  const [userPromptText, setUserPromptText] = useState('');
  const [liveText, setLiveText] = useState('');
  const [isLiveEditingText, setIsLiveEditingText] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);

  // Backup original styles for live edit reset
  const originalStylesRef = useRef(null);

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
          if (selectedTarget.contentEditable === 'true') {
            selectedTarget.contentEditable = 'false';
          }
          setSelectedTarget(null);
          setSelectedInfo(null);
          setIsLiveEditingText(false);
        } else if (isActive) {
          setIsActive(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, selectedTarget]);

  // Xử lý hover khi đang ở Inspect Mode (chưa chọn phần tử)
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
      const info = getReactComponentInfo(el);
      setSelectedInfo(info);
      setHighlightedText(selText);
      setHoveredRect(null);
      setHoveredInfo(null);
      setIsPanelMinimized(false);

      // Điền sẵn nội dung text của phần tử vào ô sửa realtime
      setLiveText((el.innerText || el.textContent || '').trim());

      // Lưu lại style và html gốc để có thể hoàn tác
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

  // Sửa chữ realtime: Khi gõ trong textarea của panel, chữ trên trang web lập tức nhảy theo!
  const handleLiveTextChange = useCallback((e) => {
    const val = e.target.value;
    setLiveText(val);
    if (selectedTarget) {
      selectedTarget.innerText = val;
      setSelectedInfo((prev) => prev ? { ...prev, innerText: val.slice(0, 80) } : null);
    }
  }, [selectedTarget]);

  // Bật/tắt chế độ gõ chữ trực tiếp ngay trên trang web
  const toggleLiveTextEdit = useCallback(() => {
    if (!selectedTarget) return;
    const willEnable = !isLiveEditingText;
    selectedTarget.contentEditable = willEnable ? 'true' : 'false';

    if (willEnable) {
      selectedTarget.focus();
      if (showToast) {
        showToast('Đã bật gõ chữ trên trang! Bạn click thẳng vào dòng chữ để gõ nhé ✏️', 'info');
      }

      // Lắng nghe khi gõ trên trang để đồng bộ vào panel
      const onInput = () => {
        setLiveText((selectedTarget.innerText || '').trim());
      };
      selectedTarget._inspectorInputHandler = onInput;
      selectedTarget.addEventListener('input', onInput);
    } else {
      if (selectedTarget._inspectorInputHandler) {
        selectedTarget.removeEventListener('input', selectedTarget._inspectorInputHandler);
      }
      if (showToast) showToast('Đã lưu nội dung vừa sửa thử.', 'success');
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

  // Đổi màu sắc (Text Color hoặc Background Color)
  const applyColor = useCallback((property, colorValue) => {
    if (!selectedTarget) return;
    selectedTarget.style[property] = colorValue;
  }, [selectedTarget]);

  // Hoàn tác các sửa đổi CSS & text live về nguyên bản
  const handleResetLiveEdits = useCallback(() => {
    if (!selectedTarget || !originalStylesRef.current) return;
    selectedTarget.style.cssText = originalStylesRef.current.cssText;
    selectedTarget.innerHTML = originalStylesRef.current.innerHTML;
    selectedTarget.contentEditable = 'false';
    setIsLiveEditingText(false);
    setLiveText((selectedTarget.innerText || '').trim());
    setSelectedInfo(getReactComponentInfo(selectedTarget));
    if (showToast) showToast('Đã khôi phục lại trạng thái ban đầu.', 'info');
  }, [selectedTarget, showToast]);

  // Sao chép prompt chuẩn cho AI
  const handleCopyAiPrompt = useCallback(() => {
    if (!selectedInfo) return;

    const prompt = `[Yêu cầu sửa UI Frontend]
- Component: <${selectedInfo.componentName} />
- File nguồn gợi ý: ${selectedInfo.fileHint || 'src/components/...'}
- Phần tử DOM: <${selectedInfo.tagName} class="${selectedInfo.className}">
${highlightedText ? `- Đoạn chữ bôi chọn: "${highlightedText}"\n` : ''}- Nội dung hiển thị hiện tại: "${liveText || selectedInfo.innerText}"
- Kích thước: ${selectedInfo.width}px × ${selectedInfo.height}px
- Yêu cầu cụ thể: ${userPromptText || `Đổi nội dung thành "${liveText}" và tối ưu lại giao diện/khoảng cách giúp mình nhé.`}`;

    navigator.clipboard.writeText(prompt).then(() => {
      if (showToast) {
        showToast('Đã sao chép prompt! Dán vào chat để AI sửa mã nguồn ngay nhé 🚀', 'success');
      } else {
        alert('Đã sao chép prompt vào Clipboard!');
      }
    });
  }, [selectedInfo, highlightedText, liveText, userPromptText, showToast]);

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
                setIsLiveEditingText(false);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#4D6B53] text-white shadow-[1px_1px_0px_#3D352E]'
                  : 'bg-[#FAF3E7] hover:bg-[#F3E7D3] text-[#3D352E]'
              }`}
              title="Dành riêng cho Admin. Phím tắt: Alt + I"
            >
              <span className={`text-sm ${isActive ? 'animate-spin' : ''}`}>🎯</span>
              <span>{isActive ? 'Đang chọn phần tử' : 'Sửa UI trực tiếp'}</span>
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
            title="Mở thanh công cụ chọn Component sửa UI (Admin)"
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
            <span>Rê chuột và click vào phần tử hoặc chữ bạn muốn sửa (Bấm Esc để thoát)</span>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. Khung viền Hover Highlight theo con trỏ chuột
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
          4. Khung viền phần tử đang được chọn trên trang
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
            border: isLiveEditingText ? '3px dashed #10B981' : '3px solid #D96B43',
            backgroundColor: isLiveEditingText ? 'rgba(16, 185, 129, 0.08)' : 'rgba(217, 107, 67, 0.12)',
            borderRadius: '8px',
            boxShadow: '0 0 12px rgba(217, 107, 67, 0.35)',
          }}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. Bảng điều khiển sửa giao diện (Floating Docked Panel)
          * KHÔNG CÓ LỚP PHỦ CHE MÀN HÌNH (NO BACKDROP)
          * Cho phép thao tác đồng thời trên trang web và trên panel!
          ───────────────────────────────────────────────────────────── */}
      {selectedTarget && selectedInfo && (
        <aside
          data-inspector-ui="true"
          className={`fixed top-16 right-4 z-[10000] w-[390px] max-w-[calc(100vw-32px)] bg-[#FFFDF9] rounded-3xl border-3 border-[#3D352E] shadow-[6px_8px_0px_#3D352E] overflow-hidden flex flex-col transition-all duration-200 select-none pointer-events-auto ${
            isPanelMinimized ? 'max-h-13' : 'max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="bg-[#FAF3E7] px-4 py-3 border-b-2 border-[#3D352E] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg">🎯</span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-heading font-black text-xs sm:text-sm text-[#3D352E] truncate">
                    &lt;{selectedInfo.componentName} /&gt;
                  </h3>
                  <span className="px-1.5 py-0.2 rounded-md bg-[#E8EFEA] text-[#4D6B53] text-[9px] font-bold border border-[#4D6B53]/40">
                    {selectedInfo.tagName}
                  </span>
                </div>
                <p className="text-[10px] font-mono text-[#786F66] truncate">
                  📁 {selectedInfo.fileHint}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Nút thu nhỏ panel để dễ ngắm trang web */}
              <button
                type="button"
                onClick={() => setIsPanelMinimized(!isPanelMinimized)}
                className="w-7 h-7 rounded-lg bg-white hover:bg-gray-100 border border-[#3D352E] text-xs font-black flex items-center justify-center transition active:scale-90 cursor-pointer"
                title={isPanelMinimized ? 'Mở rộng bảng công cụ' : 'Thu nhỏ bảng công cụ'}
              >
                {isPanelMinimized ? '□' : '–'}
              </button>

              {/* Nút đóng hoàn tất */}
              <button
                type="button"
                onClick={() => {
                  if (selectedTarget && selectedTarget.contentEditable === 'true') {
                    selectedTarget.contentEditable = 'false';
                  }
                  setSelectedTarget(null);
                  setSelectedInfo(null);
                  setIsLiveEditingText(false);
                }}
                className="w-7 h-7 rounded-lg bg-white hover:bg-rose-50 hover:text-rose-600 border border-[#3D352E] text-xs font-black flex items-center justify-center transition active:scale-90 cursor-pointer"
                title="Đóng bảng công cụ"
              >
                ✕
              </button>
            </div>
          </div>

          {!isPanelMinimized && (
            <>
              {/* Tab navigation */}
              <div className="flex items-center border-b-2 border-[#E8DEC8] bg-[#F7F1E3] px-3 pt-2 gap-2 text-xs font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('liveEdit')}
                  className={`px-3 py-1.5 rounded-t-xl transition-all cursor-pointer border-t-2 border-x-2 text-[11px] ${
                    activeTab === 'liveEdit'
                      ? 'bg-[#FFFDF9] text-[#3D352E] border-[#3D352E] -mb-[2px] font-black shadow-sm'
                      : 'border-transparent text-[#786F66] hover:text-[#3D352E]'
                  }`}
                >
                  ✏️ Sửa Live trên Web
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('prompt')}
                  className={`px-3 py-1.5 rounded-t-xl transition-all cursor-pointer border-t-2 border-x-2 text-[11px] ${
                    activeTab === 'prompt'
                      ? 'bg-[#FFFDF9] text-[#3D352E] border-[#3D352E] -mb-[2px] font-black shadow-sm'
                      : 'border-transparent text-[#786F66] hover:text-[#3D352E]'
                  }`}
                >
                  🤖 Tạo Prompt gửi AI
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('css')}
                  className={`px-3 py-1.5 rounded-t-xl transition-all cursor-pointer border-t-2 border-x-2 text-[11px] ${
                    activeTab === 'css'
                      ? 'bg-[#FFFDF9] text-[#3D352E] border-[#3D352E] -mb-[2px] font-black shadow-sm'
                      : 'border-transparent text-[#786F66] hover:text-[#3D352E]'
                  }`}
                >
                  🔍 Thuộc tính CSS
                </button>
              </div>

              {/* Body */}
              <div className="p-4 overflow-y-auto space-y-3.5 text-xs select-text">
                {/* ─────────────────────────────────────────────────────────
                    TAB 1: SỬA TRỰC TIẾP (LIVE EDIT)
                    ───────────────────────────────────────────────────────── */}
                {activeTab === 'liveEdit' && (
                  <div className="space-y-3.5">
                    {/* Ô Gõ Chữ Trực Tiếp (Realtime Live Sync) */}
                    <div className="bg-[#FAF3E7] p-3 rounded-2xl border-2 border-[#3D352E] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="font-black text-xs text-[#3D352E] flex items-center gap-1.5">
                          <span>✍️ Gõ đổi chữ:</span>
                        </label>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded-md">
                          ● Nhảy chữ ngay trên trang
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        value={liveText}
                        onChange={handleLiveTextChange}
                        placeholder="Nhập chữ mới tại đây..."
                        className="w-full p-2.5 rounded-xl border-2 border-[#3D352E] bg-white text-xs font-semibold focus:ring-2 focus:ring-[#4D6B53] outline-none"
                      />
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-[#786F66]">
                          Hoặc bấm để gõ trực tiếp trên trang web:
                        </span>
                        <button
                          type="button"
                          onClick={toggleLiveTextEdit}
                          className={`px-2.5 py-1 rounded-lg font-black text-[11px] border border-[#3D352E] transition-all cursor-pointer ${
                            isLiveEditingText ? 'bg-emerald-400 text-[#3D352E]' : 'bg-white hover:bg-gray-100 text-[#3D352E]'
                          }`}
                        >
                          {isLiveEditingText ? 'Đang bật gõ trên trang 🟢' : 'Gõ thẳng trên trang ✏️'}
                        </button>
                      </div>
                    </div>

                    {/* Bộ chỉnh CSS trực tiếp */}
                    <div className="space-y-2">
                      <div className="text-xs font-black text-[#3D352E]">Tinh chỉnh CSS nhanh tại chỗ:</div>

                      <div className="grid grid-cols-2 gap-2">
                        {/* Padding */}
                        <div className="bg-[#FAF3E7] p-2 rounded-xl border border-[#3D352E]/30 flex items-center justify-between">
                          <span className="font-bold text-[11px]">Padding:</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => adjustStyle('padding', -2)}
                              className="w-6 h-6 rounded-md bg-white border border-[#3D352E] font-black hover:bg-gray-100 flex items-center justify-center cursor-pointer"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => adjustStyle('padding', 2)}
                              className="w-6 h-6 rounded-md bg-white border border-[#3D352E] font-black hover:bg-gray-100 flex items-center justify-center cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Margin */}
                        <div className="bg-[#FAF3E7] p-2 rounded-xl border border-[#3D352E]/30 flex items-center justify-between">
                          <span className="font-bold text-[11px]">Margin:</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => adjustStyle('margin', -2)}
                              className="w-6 h-6 rounded-md bg-white border border-[#3D352E] font-black hover:bg-gray-100 flex items-center justify-center cursor-pointer"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => adjustStyle('margin', 2)}
                              className="w-6 h-6 rounded-md bg-white border border-[#3D352E] font-black hover:bg-gray-100 flex items-center justify-center cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Font size */}
                        <div className="bg-[#FAF3E7] p-2 rounded-xl border border-[#3D352E]/30 flex items-center justify-between">
                          <span className="font-bold text-[11px]">Cỡ chữ:</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => adjustStyle('fontSize', -1)}
                              className="w-6 h-6 rounded-md bg-white border border-[#3D352E] font-black hover:bg-gray-100 flex items-center justify-center cursor-pointer"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => adjustStyle('fontSize', 1)}
                              className="w-6 h-6 rounded-md bg-white border border-[#3D352E] font-black hover:bg-gray-100 flex items-center justify-center cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Ẩn / Hiện */}
                        <div className="bg-[#FAF3E7] p-2 rounded-xl border border-[#3D352E]/30 flex items-center justify-between">
                          <span className="font-bold text-[11px]">Ẩn/Hiện:</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedTarget) {
                                selectedTarget.style.display =
                                  selectedTarget.style.display === 'none' ? '' : 'none';
                              }
                            }}
                            className="px-2 py-0.5 rounded-md bg-white border border-[#3D352E] font-bold text-[10px] hover:bg-gray-100 cursor-pointer"
                          >
                            👁️ Đổi
                          </button>
                        </div>

                        {/* Đổi màu chữ */}
                        <div className="bg-[#FAF3E7] p-2 rounded-xl border border-[#3D352E]/30 flex items-center justify-between">
                          <span className="font-bold text-[11px]">Màu chữ:</span>
                          <input
                            type="color"
                            onChange={(e) => applyColor('color', e.target.value)}
                            className="w-6 h-6 rounded border border-[#3D352E] cursor-pointer"
                            title="Chọn màu chữ"
                          />
                        </div>

                        {/* Đổi màu nền */}
                        <div className="bg-[#FAF3E7] p-2 rounded-xl border border-[#3D352E]/30 flex items-center justify-between">
                          <span className="font-bold text-[11px]">Màu nền:</span>
                          <input
                            type="color"
                            onChange={(e) => applyColor('backgroundColor', e.target.value)}
                            className="w-6 h-6 rounded border border-[#3D352E] cursor-pointer"
                            title="Chọn màu nền"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-gray-200">
                      <button
                        type="button"
                        onClick={handleResetLiveEdits}
                        className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#3D352E] font-bold text-xs transition cursor-pointer"
                      >
                        🔄 Hoàn tác
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

                {/* ─────────────────────────────────────────────────────────
                    TAB 2: TẠO PROMPT GỬI AI
                    ───────────────────────────────────────────────────────── */}
                {activeTab === 'prompt' && (
                  <div className="space-y-3">
                    <div className="bg-[#FAF3E7] p-2.5 rounded-xl border border-[#3D352E]/30 space-y-1">
                      <div className="font-semibold text-[#302A24] truncate">
                        <strong>Text hiện tại:</strong> "{liveText || selectedInfo.innerText || 'Không có chữ'}"
                      </div>
                      <div className="text-[11px] font-mono text-[#554D45]">
                        <strong>Kích thước:</strong> {selectedInfo.width}px × {selectedInfo.height}px
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-[#3D352E] mb-1">
                        Yêu cầu bạn muốn AI sửa trong code:
                      </label>
                      <textarea
                        rows={3}
                        value={userPromptText}
                        onChange={(e) => setUserPromptText(e.target.value)}
                        placeholder="Ví dụ: Đổi màu chữ sang trắng, tăng padding lên 12px, cho logo to ra 56px, sửa nội dung thành..."
                        className="w-full p-2.5 rounded-xl bg-white border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] font-medium text-xs focus:outline-none focus:ring-2 focus:ring-[#4D6B53] placeholder:text-gray-400"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyAiPrompt}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#D96B43] hover:bg-[#C85A3F] text-white font-black text-xs border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>📋</span>
                      <span>Sao chép Prompt vào Chat</span>
                    </button>
                  </div>
                )}

                {/* ─────────────────────────────────────────────────────────
                    TAB 3: THUỘC TÍNH CSS
                    ───────────────────────────────────────────────────────── */}
                {activeTab === 'css' && (
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-xs font-black text-[#3D352E] mb-1">
                        Các class Tailwind / CSS đang dùng:
                      </label>
                      <div className="p-2.5 bg-gray-100 rounded-xl font-mono text-[11px] text-[#3D352E] break-all border border-gray-300 max-h-24 overflow-y-auto">
                        {selectedInfo.className || '(Không có class)'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedInfo.className);
                        if (showToast) showToast('Đã copy danh sách class CSS!', 'success');
                      }}
                      className="w-full py-2 bg-white hover:bg-gray-50 border-2 border-[#3D352E] rounded-xl font-bold text-xs shadow-xs cursor-pointer"
                    >
                      📋 Sao chép danh sách class
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </aside>
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
