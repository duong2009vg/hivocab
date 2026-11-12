// src/hooks/useSplitPanel.js
// Draggable split panel + drag-to-scroll + wheel forwarding
// Đảm bảo ref lifecycle đồng bộ khi session.exam được nạp xong

import { useEffect, useRef, useCallback } from 'react';

const SPLIT_RATIO_KEY = 'thpt_split_left_pct';

export function useSplitPanel(isReady = true) {
  const containerRef = useRef(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const dividerRef = useRef(null);
  const passagePaneRef = useRef(null);
  const questionsPaneRef = useRef(null);

  // Apply saved split ratio
  const applySavedRatio = useCallback(() => {
    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right) return;
    if (window.innerWidth >= 768) {
      const saved = parseFloat(localStorage.getItem(SPLIT_RATIO_KEY) || '50');
      const pct = !isNaN(saved) && saved >= 20 && saved <= 80 ? saved : 50;
      left.style.width = pct + '%';
      right.style.width = 100 - pct + '%';
    } else {
      left.style.width = '';
      right.style.width = '';
    }
  }, []);

  // Reset right column width when split mode is inactive (full-width questions mode)
  useEffect(() => {
    if (!isReady && rightRef.current) {
      rightRef.current.style.width = '';
    }
  }, [isReady]);

  // Drag divider
  useEffect(() => {
    if (!isReady) return;
    const divider = dividerRef.current;
    const left = leftRef.current;
    const right = rightRef.current;
    const container = containerRef.current;
    if (!divider || !left || !right || !container) return;

    applySavedRatio();

    let isDragging = false;

    const onStart = (e) => {
      if (window.innerWidth < 768) return;
      isDragging = true;
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
      left.style.transition = 'none';
      right.style.transition = 'none';
      divider.classList.add('bg-[#5a7d4d]', 'w-2.5');
    };

    const onMove = (e) => {
      if (!isDragging || window.innerWidth < 768) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const rect = container.getBoundingClientRect();
      if (!rect.width) return;
      let pct = ((clientX - rect.left) / rect.width) * 100;
      pct = Math.max(20, Math.min(80, pct));
      left.style.width = pct + '%';
      right.style.width = 100 - pct + '%';
    };

    const onEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      left.style.transition = '';
      right.style.transition = '';
      divider.classList.remove('bg-[#5a7d4d]', 'w-2.5');
      const rect = container.getBoundingClientRect();
      if (rect.width) {
        const leftW = left.getBoundingClientRect().width;
        const pct = (leftW / rect.width) * 100;
        localStorage.setItem(SPLIT_RATIO_KEY, pct.toFixed(1));
      }
    };

    divider.addEventListener('mousedown', onStart);
    divider.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchend', onEnd);
    window.addEventListener('resize', applySavedRatio);

    return () => {
      divider.removeEventListener('mousedown', onStart);
      divider.removeEventListener('touchstart', onStart);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('resize', applySavedRatio);
    };
  }, [applySavedRatio, isReady]);

  // Wheel forwarding + drag-to-scroll
  useEffect(() => {
    if (!isReady) return;
    const passagePane = passagePaneRef.current;
    const leftCol = leftRef.current;

    if (leftCol && passagePane) {
      const handler = (e) => {
        if (e.target === leftCol || !passagePane.contains(e.target)) {
          passagePane.scrollTop += e.deltaY;
        }
      };
      leftCol.addEventListener('wheel', handler, { passive: true });
      return () => leftCol.removeEventListener('wheel', handler);
    }
  }, [isReady]);

  useEffect(() => {
    if (!isReady) return;
    const questionsPane = questionsPaneRef.current;
    const rightCol = rightRef.current;
    if (rightCol && questionsPane) {
      const handler = (e) => {
        if (e.target === rightCol || !questionsPane.contains(e.target)) {
          questionsPane.scrollTop += e.deltaY;
        }
      };
      rightCol.addEventListener('wheel', handler, { passive: true });
      return () => rightCol.removeEventListener('wheel', handler);
    }
  }, [isReady]);

  return {
    containerRef,
    leftRef,
    rightRef,
    dividerRef,
    passagePaneRef,
    questionsPaneRef,
    applySavedRatio,
  };
}

export default useSplitPanel;
