// src/hooks/useSplitPanel.js
// Draggable split panel + drag-to-scroll + wheel forwarding

import { useEffect, useRef, useCallback } from 'react';

const SPLIT_RATIO_KEY = 'thpt_split_left_pct';

export function useSplitPanel() {
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
      const pct = (!isNaN(saved) && saved >= 20 && saved <= 80) ? saved : 50;
      left.style.width = pct + '%';
      right.style.width = (100 - pct) + '%';
    } else {
      left.style.width = '';
      right.style.width = '';
    }
  }, []);

  // Drag divider
  useEffect(() => {
    const divider = dividerRef.current;
    const left = leftRef.current;
    const right = rightRef.current;
    const container = containerRef.current;
    if (!divider || !left || !right || !container) return;

    applySavedRatio();

    let isDragging = false;

    const onStart = () => {
      if (window.innerWidth < 768) return;
      isDragging = true;
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
      divider.classList.add('bg-blue-600', 'w-3');
    };

    const onMove = (e) => {
      if (!isDragging || window.innerWidth < 768) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const rect = container.getBoundingClientRect();
      let pct = ((clientX - rect.left) / rect.width) * 100;
      pct = Math.max(20, Math.min(80, pct));
      left.style.width = pct + '%';
      right.style.width = (100 - pct) + '%';
    };

    const onEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      divider.classList.remove('bg-blue-600', 'w-3');
      const rect = container.getBoundingClientRect();
      const leftW = left.getBoundingClientRect().width;
      const pct = (leftW / rect.width) * 100;
      localStorage.setItem(SPLIT_RATIO_KEY, pct.toFixed(1));
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
  }, [applySavedRatio]);

  // Wheel forwarding + drag-to-scroll
  useEffect(() => {
    const passagePane = passagePaneRef.current;
    const questionsPane = questionsPaneRef.current;
    const leftCol = leftRef.current;
    const rightCol = rightRef.current;

    if (leftCol && passagePane) {
      const handler = (e) => {
        if (e.target === leftCol || !passagePane.contains(e.target)) {
          passagePane.scrollTop += e.deltaY;
        }
      };
      leftCol.addEventListener('wheel', handler, { passive: true });
      return () => leftCol.removeEventListener('wheel', handler);
    }
  }, []);

  useEffect(() => {
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
  }, []);

  // Enable drag-to-scroll on a pane
  const enableDragToScroll = useCallback((el) => {
    if (!el) return () => {};
    let isDown = false, startY = 0, scrollTop = 0, isDragging = false;

    const onMouseDown = (e) => {
      if (e.button !== 0) return;
      if (e.target.closest('button, input, select, textarea, a, .opt-btn, [onclick]')) return;
      const sel = window.getSelection();
      if (sel && sel.toString().length > 0) return;
      isDown = true;
      isDragging = false;
      startY = e.pageY - el.offsetTop;
      scrollTop = el.scrollTop;
    };

    const onMouseUp = () => {
      if (!isDown) return;
      isDown = false;
      if (isDragging) {
        isDragging = false;
        el.style.userSelect = '';
        el.style.cursor = '';
      }
    };

    const onMouseMove = (e) => {
      if (!isDown) return;
      const walk = (e.pageY - el.offsetTop) - startY;
      if (!isDragging && Math.abs(walk) > 5) {
        isDragging = true;
        el.style.userSelect = 'none';
        el.style.cursor = 'grab';
      }
      if (isDragging) el.scrollTop = scrollTop - walk;
    };

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mouseleave', onMouseUp);
    window.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mousemove', onMouseMove);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseleave', onMouseUp);
      window.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  useEffect(() => {
    const cleanup1 = enableDragToScroll(passagePaneRef.current);
    const cleanup2 = enableDragToScroll(questionsPaneRef.current);
    return () => { cleanup1(); cleanup2(); };
  }, [enableDragToScroll]);

  return {
    containerRef,
    leftRef,
    rightRef,
    dividerRef,
    passagePaneRef,
    questionsPaneRef,
  };
}
