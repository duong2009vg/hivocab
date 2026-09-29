// src/hooks/useThptTimer.js
// Đếm ngược thời gian thi với auto-submit callback

import { useState, useEffect, useRef, useCallback } from 'react';

export function useThptTimer({ initialSeconds, onTimeUp }) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  const onTimeUpRef = useRef(onTimeUp);

  // Keep onTimeUp ref stable
  useEffect(() => { onTimeUpRef.current = onTimeUp; }, [onTimeUp]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const start = useCallback((fromSeconds) => {
    stop();
    if (fromSeconds !== undefined) setSecondsLeft(fromSeconds);
    setIsRunning(true);
  }, [stop]);

  // Tick every second
  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setIsRunning(false);
          setTimeout(() => onTimeUpRef.current?.(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  // Format mm:ss display
  const displayText = (() => {
    if (initialSeconds === 0) return 'Không giới hạn';
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  })();

  const isWarning = initialSeconds > 0 && secondsLeft <= 300;

  return {
    secondsLeft,
    isRunning,
    displayText,
    isWarning,
    start,
    stop,
    setSecondsLeft,
  };
}
