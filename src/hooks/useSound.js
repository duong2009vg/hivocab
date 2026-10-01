// src/hooks/useSound.js
// React Hook for Sound Effects and Pronunciation
import { useState, useCallback, useEffect } from 'react';
import { HiSound, HiAudio } from '../services/audioService.js';

export function useSound() {
  const [muted, setMutedState] = useState(() => HiSound.isMuted());

  useEffect(() => {
    setMutedState(HiSound.isMuted());
  }, []);

  const toggleMute = useCallback(() => {
    const next = HiSound.toggleMute();
    setMutedState(next);
    return next;
  }, []);

  const setMuted = useCallback((isMute) => {
    HiSound.setMuted(isMute);
    setMutedState(isMute);
  }, []);

  const playCorrect = useCallback(() => {
    HiSound.playCorrect();
  }, []);

  const playIncorrect = useCallback(() => {
    HiSound.playIncorrect();
  }, []);

  const playComplete = useCallback(() => {
    HiSound.playComplete();
  }, []);

  const playWord = useCallback((word, rate = 0.9, lang = 'en') => {
    HiAudio.playWord(word, rate, lang);
  }, []);

  const stopWord = useCallback(() => {
    HiAudio.stop();
  }, []);

  return {
    isMuted: muted,
    setMuted,
    toggleMute,
    playCorrect,
    playIncorrect,
    playComplete,
    playWord,
    stopWord,
  };
}

export default useSound;
