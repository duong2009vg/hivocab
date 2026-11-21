// src/hooks/useThptSession.js
// Quản lý toàn bộ state của một buổi thi THPT:
// answers, flags, currentQIndex, review mode, results, progress save/load

import { useState, useCallback, useRef } from 'react';
import { saveExerciseScore } from '../services/exercisesService.js';
import { recordExamAttempt } from '../services/examHistoryService.js';

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
  const startedAtRef = useRef(Date.now());

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
  const startExam = useCallback((examData, minutes, savedProgress, { forceResetTime = false } = {}) => {
    const secs = (minutes === 0 ? 0 : (Number(minutes) > 0 ? Number(minutes) : 50)) * 60;
    initialSecondsRef.current = secs;
    startedAtRef.current = Date.now();

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
      const sameDuration = savedProgress.initialSeconds === secs;
      const restored = forceResetTime || !sameDuration
        ? secs
        : (secs === 0 ? 0 : (savedProgress.timeRemaining ?? secs));
      timerSecondsRef.current = restored;
      return { restoredSeconds: restored };
    } else {
      setAnswers({});
      setFlags({});
      timerSecondsRef.current = secs;
      return { restoredSeconds: secs };
    }
  }, []);

  // ---------- LOAD HISTORICAL ATTEMPT IN REVIEW MODE ----------
  const loadReviewAttempt = useCallback((examData, attempt) => {
    initialSecondsRef.current = 0;
    timerSecondsRef.current = 0;

    const details = attempt?.details && typeof attempt.details === 'object' ? attempt.details : {};
    const reconstructedAnswers = {};
    Object.entries(details).forEach(([qNum, entry]) => {
      if (entry?.userAns) {
        reconstructedAnswers[qNum] = entry.userAns;
      }
    });

    const totalQ = attempt?.total || examData?.total_questions || examData?.questions?.length || 40;
    const correctCount = Number(attempt?.correct || 0);

    setExam(examData);
    setAnswers(reconstructedAnswers);
    setFlags({});
    setCurrentQIndex(0);
    setShowConfirmModal(false);
    setShowResultsModal(false);
    setFontSizeLevel(0);
    setMobileView('both');
    setResults({
      examId: examData?.id || attempt?.examId,
      title: examData?.title || attempt?.title,
      score: Number(attempt?.score || 0),
      correct: correctCount,
      wrong: Math.max(0, totalQ - correctCount),
      unanswered: Math.max(0, totalQ - Object.keys(reconstructedAnswers).length),
      total: totalQ,
      percentage: Number(attempt?.percentage ?? Math.round((correctCount / Math.max(1, totalQ)) * 100)),
      timeSpentSeconds: Number(attempt?.timeSpentSeconds || 0),
      submittedAt: attempt?.submittedAt || Date.now(),
      details,
    });
    setIsReviewMode(true);
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
    const initSecs = initialSecondsRef.current || 0;
    const timeSpentSeconds = initSecs === 0
      ? Math.max(0, Math.round((Date.now() - (startedAtRef.current || Date.now())) / 1000))
      : Math.max(0, initSecs - (currentTimerSecs || 0));

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
    void recordExamAttempt({
      examId: currentExam.id,
      examTitle: currentExam.title,
      isExercise: Boolean(currentExam.is_exercise),
      score,
      correct: correctCount,
      total: totalQ,
      percentage: res.percentage,
      timeSpentSeconds,
      durationMinutes: Math.round(initSecs / 60),
      details,
      submittedAt: res.submittedAt,
    });
    if (currentExam.is_exercise) {
      try {
        saveExerciseScore(currentExam.id, correctCount, totalQ);
      } catch (_) {}
    }
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

  const fontSizeClass = ['text-[13px] sm:text-[14px]', 'text-[15px] sm:text-[16px]', 'text-[17px] sm:text-[18px]', 'text-[19px] sm:text-[20px]'][fontSizeLevel + 1];

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
    loadReviewAttempt,
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
