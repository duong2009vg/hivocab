// src/hooks/useThptSession.js
// Quản lý toàn bộ state của một buổi thi THPT:
// answers, flags, currentQIndex, review mode, results, progress save/load

import { useState, useCallback, useRef } from 'react';

const BEST_SCORES_KEY = 'thpt_best_scores';

export function useThptSession() {
  const [exam, setExam] = useState(null);            // dữ liệu đề thi hiện tại
  const [answers, setAnswers] = useState({});         // { [qNum]: 'A'|'B'|'C'|'D' }
  const [flags, setFlags] = useState({});             // { [qNum]: true }
  const [currentQIndex, setCurrentQIndex] = useState(0); // 0-based
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [results, setResults] = useState(null);
  const [fontSizeLevel, setFontSizeLevel] = useState(0); // -1,0,1,2
  const [mobileView, setMobileView] = useState('both');  // 'passage'|'both'|'questions'
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);

  // Ref for timer seconds (needed in submitExam without causing re-render)
  const timerSecondsRef = useRef(0);
  const initialSecondsRef = useRef(0);

  // ---------- PROGRESS PERSISTENCE ----------
  const saveProgress = useCallback((currentAnswers, currentFlags, timerSec, examObj) => {
    if (!examObj) return;
    try {
      localStorage.setItem('thpt_progress_' + examObj.id, JSON.stringify({
        examId: examObj.id,
        answers: currentAnswers,
        flags: currentFlags,
        timeRemaining: timerSec,
        initialSeconds: initialSecondsRef.current,
        savedAt: Date.now(),
        submitted: false,
      }));
    } catch (_) {}
  }, []);

  const loadSavedProgress = useCallback((examId) => {
    try {
      const str = localStorage.getItem('thpt_progress_' + examId);
      return str ? JSON.parse(str) : null;
    } catch (_) { return null; }
  }, []);

  const clearProgress = useCallback((examId) => {
    try { localStorage.removeItem('thpt_progress_' + examId); } catch (_) {}
  }, []);

  // ---------- BEST SCORES ----------
  const saveBestScore = useCallback((examId, res) => {
    try {
      const str = localStorage.getItem(BEST_SCORES_KEY);
      const all = str ? JSON.parse(str) : {};
      const existing = all[examId];
      if (!existing || res.score > existing.score) {
        all[examId] = { score: res.score, correct: res.correct, date: Date.now() };
        localStorage.setItem(BEST_SCORES_KEY, JSON.stringify(all));
      }
    } catch (_) {}
  }, []);

  // ---------- START EXAM ----------
  const startExam = useCallback((examData, minutes, savedProgress) => {
    const secs = (minutes || 50) * 60;
    initialSecondsRef.current = secs;

    setExam(examData);
    setIsReviewMode(false);
    setResults(null);
    setCurrentQIndex(0);
    setShowConfirmModal(false);
    setShowResultsModal(false);
    setFontSizeLevel(0);
    setMobileView('both');

    if (savedProgress && !savedProgress.submitted) {
      setAnswers(savedProgress.answers || {});
      setFlags(savedProgress.flags || {});
      timerSecondsRef.current = savedProgress.timeRemaining ?? secs;
      return { restoredSeconds: savedProgress.timeRemaining ?? secs };
    } else {
      setAnswers({});
      setFlags({});
      timerSecondsRef.current = secs;
      return { restoredSeconds: secs };
    }
  }, []);

  // ---------- ANSWER ----------
  const selectAnswer = useCallback((qNum, letter, timerSec, examObj) => {
    setAnswers(prev => {
      const next = { ...prev, [qNum]: letter };
      saveProgress(next, flags, timerSec, examObj);
      return next;
    });
    setCurrentQIndex(qNum - 1);
  }, [flags, saveProgress]);

  // We need the answers ref for saveProgress inside selectAnswer with latest flags
  // Use callback form to avoid stale closure:
  const selectAnswerFull = useCallback((qNum, letter, timerSec, currentFlags, examObj) => {
    setAnswers(prev => {
      const next = { ...prev, [qNum]: letter };
      saveProgress(next, currentFlags, timerSec, examObj);
      return next;
    });
    setCurrentQIndex(qNum - 1);
  }, [saveProgress]);

  // ---------- FLAG ----------
  const toggleFlag = useCallback((qNum, timerSec, currentAnswers, examObj) => {
    setFlags(prev => {
      const next = { ...prev, [qNum]: !prev[qNum] };
      saveProgress(currentAnswers, next, timerSec, examObj);
      return next;
    });
  }, [saveProgress]);

  // ---------- NAVIGATION ----------
  const jumpToQuestion = useCallback((qNum) => {
    setCurrentQIndex(qNum - 1);
  }, []);

  const prevQuestion = useCallback(() => {
    setCurrentQIndex(prev => Math.max(0, prev - 1));
  }, []);

  const nextQuestion = useCallback((totalQ) => {
    setCurrentQIndex(prev => Math.min(totalQ - 1, prev + 1));
  }, []);

  // ---------- SUBMIT ----------
  const submitExam = useCallback((currentAnswers, currentExam, currentTimerSecs) => {
    if (!currentExam) return;

    let correctCount = 0;
    const details = {};

    currentExam.questions.forEach(q => {
      const userAns = currentAnswers[q.number] || '';
      const isCorrect = userAns.toUpperCase() === (q.correct_answer || '').toUpperCase();
      if (isCorrect) correctCount++;
      details[q.number] = { userAns, correctAns: q.correct_answer, isCorrect };
    });

    const totalQ = currentExam.total_questions;
    const score = Math.round((correctCount / totalQ) * 10 * 100) / 100;
    const timeSpentSeconds = (initialSecondsRef.current || 0) - (currentTimerSecs || 0);

    const res = {
      examId: currentExam.id,
      title: currentExam.title,
      score,
      correct: correctCount,
      wrong: totalQ - correctCount,
      unanswered: totalQ - Object.keys(currentAnswers).length,
      total: totalQ,
      percentage: Math.round((correctCount / totalQ) * 100),
      timeSpentSeconds,
      submittedAt: Date.now(),
      details,
    };

    saveBestScore(currentExam.id, res);
    try {
      localStorage.setItem('thpt_progress_' + currentExam.id, JSON.stringify({
        examId: currentExam.id, submitted: true, results: res,
      }));
    } catch (_) {}

    setResults(res);
    setShowResultsModal(true);
    setShowConfirmModal(false);
    return res;
  }, [saveBestScore]);

  // ---------- REVIEW MODE ----------
  const enterReviewMode = useCallback(() => {
    setIsReviewMode(true);
    setShowResultsModal(false);
    setCurrentQIndex(0);
  }, []);

  // ---------- RETAKE ----------
  const retakeExam = useCallback((examData, minutes) => {
    if (examData) clearProgress(examData.id);
    return startExam(examData, minutes, null);
  }, [clearProgress, startExam]);

  // ---------- FONT SIZE ----------
  const changeFontSize = useCallback((delta) => {
    setFontSizeLevel(prev => Math.max(-1, Math.min(2, prev + delta)));
  }, []);

  const fontSizeClass = ['text-[12px]', 'text-[14px]', 'text-[16px]', 'text-[18px]'][fontSizeLevel + 1];

  // ---------- DERIVED ----------
  const answeredCount = Object.keys(answers).length;

  return {
    // State
    exam,
    answers,
    flags,
    currentQIndex,
    isReviewMode,
    results,
    fontSizeLevel,
    fontSizeClass,
    mobileView,
    showConfirmModal,
    showResultsModal,
    answeredCount,
    timerSecondsRef,
    initialSecondsRef,

    // Actions
    startExam,
    selectAnswer: selectAnswerFull,
    toggleFlag,
    jumpToQuestion,
    prevQuestion,
    nextQuestion,
    submitExam,
    enterReviewMode,
    retakeExam,
    changeFontSize,
    saveProgress,
    loadSavedProgress,
    clearProgress,

    // Modal controls
    setShowConfirmModal,
    setShowResultsModal,
    setMobileView,
    setExam,
  };
}
