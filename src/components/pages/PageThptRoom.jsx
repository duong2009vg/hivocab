// src/components/pages/PageThptRoom.jsx
// Phòng thi THPT - React thuần, không còn window.ThptExam injection

import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useThptSession } from '../../hooks/useThptSession';
import { useThptTimer } from '../../hooks/useThptTimer';
import { useSplitPanel } from '../../hooks/useSplitPanel';
import { ExamHeader } from '../thpt/ExamHeader';
import { ExamPassagePanel } from '../thpt/ExamPassagePanel';
import { ExamQuestionsPanel } from '../thpt/ExamQuestionsPanel';
import { ExamPalette } from '../thpt/ExamPalette';
import { ExamConfirmModal, ExamResultsModal } from '../thpt/ExamModals';
import { useRoute } from '../../router/RouteContext.jsx';

export function PageThptRoom() {
  const { navigateTo } = useRoute();
  const session = useThptSession();
  const splitPanel = useSplitPanel();

  // Report modal state (answer report)
  const [reportModal, setReportModal] = useState(null); // { qNum, q }
  const [reportSelAns, setReportSelAns] = useState('');
  const [reportNote, setReportNote] = useState('');
  const [reportSent, setReportSent] = useState(false);
  const [reportSending, setReportSending] = useState(false);

  // Timer — onTimeUp auto-submits
  const handleTimeUp = useCallback(() => {
    if (!session.exam) return;
    window.alert?.('Hết giờ làm bài! Hệ thống đang tự động nộp bài thi của bạn.');
    session.submitExam(session.answers, session.exam, 0);
    session.setShowResultsModal(true);
  }, [session]);

  const timer = useThptTimer({
    initialSeconds: session.initialSecondsRef.current,
    onTimeUp: handleTimeUp,
  });

  // ──────────────────────────────────────────────
  // 1. Load exam on mount from window._thptStartConfig
  // ──────────────────────────────────────────────
  useEffect(() => {
    const config = window._thptStartConfig;
    if (!config) return;

    const { examId, minutes } = config;

    async function loadAndStart() {
      // Try cache first
      let examData = null;
      try {
        const cached = sessionStorage.getItem('thpt_exams_cache_v20260929');
        if (cached) {
          const arr = JSON.parse(cached);
          examData = arr.find(e => e.id === examId);
        }
      } catch (_) {}

      // Fallback: fetch
      if (!examData) {
        try {
          const res = await fetch(`data/thpt_exams.json?v=20260929`);
          if (res.ok) {
            const arr = await res.json();
            examData = arr.find(e => e.id === examId);
            try { sessionStorage.setItem('thpt_exams_cache_v20260929', JSON.stringify(arr)); } catch (_) {}
          }
        } catch (_) {}
      }

      if (!examData) {
        console.error('[ThptRoom] Không tìm được đề thi id:', examId);
        return;
      }

      // Load saved progress if any
      const savedProgress = session.loadSavedProgress(examId);

      // Start session
      const { restoredSeconds } = session.startExam(examData, minutes, savedProgress);
      session.initialSecondsRef.current = restoredSeconds;
      session.timerSecondsRef.current = restoredSeconds;

      // Start timer
      timer.start(restoredSeconds);
    }

    loadAndStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ──────────────────────────────────────────────
  // 2. Keyboard navigation
  // ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const roomEl = document.getElementById('page-thpt-room');
      if (!roomEl) return;

      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      const key = e.key;

      // Answer selection keys
      if (!session.isReviewMode) {
        const keyUpper = key.toUpperCase();
        if (['A', 'B', 'C', 'D'].includes(keyUpper)) {
          e.preventDefault();
          handleSelectAnswer(session.currentQIndex + 1, keyUpper);
          return;
        }
        if (['1', '2', '3', '4'].includes(key)) {
          e.preventDefault();
          const map = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };
          handleSelectAnswer(session.currentQIndex + 1, map[key]);
          return;
        }
        if (key === 'f' || key === 'F') {
          e.preventDefault();
          handleToggleFlag(session.currentQIndex + 1);
          return;
        }
      }

      // Navigation
      if (key === 'ArrowRight' || key === 'Enter') {
        e.preventDefault();
        session.nextQuestion(session.exam?.total_questions || 40);
      } else if (key === 'ArrowLeft') {
        e.preventDefault();
        session.prevQuestion();
      } else if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' '].includes(key)) {
        const pane = splitPanel.questionsPaneRef.current || splitPanel.passagePaneRef.current;
        if (pane) {
          e.preventDefault();
          const amt = key === 'ArrowDown' ? 80 : key === 'ArrowUp' ? -80 : key === 'PageDown' || key === ' ' ? 320 : -320;
          pane.scrollBy({ top: amt, behavior: 'smooth' });
        }
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.isReviewMode, session.currentQIndex, session.exam]);

  // ──────────────────────────────────────────────
  // 3. Save timer seconds to ref every second
  // ──────────────────────────────────────────────
  useEffect(() => {
    session.timerSecondsRef.current = timer.secondsLeft;
  }, [timer.secondsLeft, session.timerSecondsRef]);

  // ──────────────────────────────────────────────
  // Handlers
  // ──────────────────────────────────────────────
  const handleSelectAnswer = useCallback((qNum, letter) => {
    session.selectAnswer(qNum, letter, timer.secondsLeft, session.flags, session.exam);
  }, [session, timer.secondsLeft]);

  const handleToggleFlag = useCallback((qNum) => {
    session.toggleFlag(qNum, timer.secondsLeft, session.answers, session.exam);
  }, [session, timer.secondsLeft]);

  const handleJumpToQuestion = useCallback((qNum) => {
    session.jumpToQuestion(qNum);
  }, [session]);

  const handleConfirmSubmit = useCallback(() => {
    session.setShowConfirmModal(true);
  }, [session]);

  const handleDoSubmit = useCallback(() => {
    timer.stop();
    session.submitExam(session.answers, session.exam, timer.secondsLeft);
  }, [session, timer]);

  const handleEnterReview = useCallback(() => {
    session.enterReviewMode();
  }, [session]);

  const handleRetake = useCallback(() => {
    const { restoredSeconds } = session.retakeExam(session.exam, session.initialSecondsRef.current / 60);
    timer.start(restoredSeconds);
  }, [session, timer]);

  const handleExit = useCallback(() => {
    timer.stop();
    navigateTo('exercises', false);
  }, [timer, navigateTo]);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  // ──────────────────────────────────────────────
  // Mobile view → CSS classes
  // ──────────────────────────────────────────────
  const leftColClass = {
    passage:   'w-full md:w-1/2 flex flex-col bg-white overflow-hidden min-h-0 h-full transition-all',
    questions: 'hidden md:flex w-full md:w-1/2 flex-col bg-white overflow-hidden min-h-0 md:h-full transition-all',
    both:      'w-full md:w-1/2 flex flex-col bg-white overflow-hidden min-h-0 h-1/2 md:h-full transition-all',
  }[session.mobileView] || 'w-full md:w-1/2 flex flex-col bg-white overflow-hidden min-h-0 h-1/2 md:h-full';

  const rightColClass = {
    passage:   'hidden md:flex w-full md:w-1/2 flex-col bg-slate-50/70 overflow-hidden min-h-0 md:h-full transition-all border-l border-slate-200 md:border-l-0',
    questions: 'w-full md:w-1/2 flex flex-col bg-slate-50/70 overflow-hidden min-h-0 h-full transition-all border-l border-slate-200 md:border-l-0',
    both:      'w-full md:w-1/2 flex flex-col bg-slate-50/70 overflow-hidden min-h-0 h-1/2 md:h-full transition-all border-l border-slate-200 md:border-l-0',
  }[session.mobileView] || 'w-full md:w-1/2 flex flex-col bg-slate-50/70 overflow-hidden min-h-0 h-1/2 md:h-full';

  // ──────────────────────────────────────────────
  // Loading state
  // ──────────────────────────────────────────────
  if (!session.exam) {
    return (
      <div id="page-thpt-room" className="page active fixed inset-0 z-[100] bg-[#f4f6f9] flex flex-col h-screen w-screen overflow-hidden items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Đang nạp đề thi...</p>
      </div>
    );
  }

  return (
    <div id="page-thpt-room" className="page active fixed inset-0 z-[100] bg-[#f4f6f9] flex flex-col h-screen w-screen overflow-hidden">

      {/* Header */}
      <ExamHeader
        exam={session.exam}
        currentQIndex={session.currentQIndex}
        answeredCount={session.answeredCount}
        isReviewMode={session.isReviewMode}
        results={session.results}
        timerDisplay={timer.displayText}
        isTimerWarning={timer.isWarning}
        mobileView={session.mobileView}
        onPrev={session.prevQuestion}
        onNext={() => session.nextQuestion(session.exam.total_questions)}
        onChangeFontSize={session.changeFontSize}
        onToggleFullscreen={handleToggleFullscreen}
        onConfirmSubmit={handleConfirmSubmit}
        onShowResults={() => session.setShowResultsModal(true)}
        onExit={handleExit}
        onSetMobileView={session.setMobileView}
      />

      {/* Split body */}
      <div
        ref={splitPanel.containerRef}
        id="exam-split-container"
        className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 relative"
      >
        {/* Left: Passage */}
        <div ref={splitPanel.leftRef} className={leftColClass}>
          <ExamPassagePanel
            exam={session.exam}
            currentQIndex={session.currentQIndex}
            fontSizeClass={session.fontSizeClass}
            onJumpToQuestion={handleJumpToQuestion}
            passagePaneRef={splitPanel.passagePaneRef}
          />
        </div>

        {/* Draggable divider */}
        <div
          ref={splitPanel.dividerRef}
          id="exam-drag-divider"
          className="hidden md:flex w-2 hover:w-2.5 bg-slate-200 hover:bg-blue-500 active:bg-blue-600 cursor-col-resize items-center justify-center transition-all group shrink-0 select-none z-20"
          title="Kéo sang trái hoặc phải để điều chỉnh tỷ lệ hiển thị 2 cột"
        >
          <div className="w-0.5 h-6 rounded-full bg-slate-400 group-hover:bg-white group-active:bg-white transition-colors pointer-events-none" />
        </div>

        {/* Right: Questions */}
        <div ref={splitPanel.rightRef} className={rightColClass}>
          <div className="h-[28px] min-h-[28px] max-h-[28px] px-3 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[16px]">checklist</span>
              <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700">Câu Hỏi &amp; Phương Án</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">Phím tắt: 1, 2, 3, 4 (hoặc A, B, C, D)</span>
          </div>
          <ExamQuestionsPanel
            exam={session.exam}
            answers={session.answers}
            flags={session.flags}
            currentQIndex={session.currentQIndex}
            isReviewMode={session.isReviewMode}
            results={session.results}
            fontSizeClass={session.fontSizeClass}
            questionsPaneRef={splitPanel.questionsPaneRef}
            onSelectAnswer={handleSelectAnswer}
            onToggleFlag={handleToggleFlag}
            onJumpToQuestion={handleJumpToQuestion}
            onReportAnswer={(qNum, q) => {
              setReportModal({ qNum, q });
              setReportSelAns('');
              setReportNote('');
              setReportSent(false);
            }}
          />
        </div>
      </div>

      {/* Bottom palette bar */}
      <div id="exam-bottom-bar" className="h-[34px] min-h-[34px] max-h-[34px] bg-[#0f172a] text-white border-t border-slate-700 px-2 flex items-center justify-between gap-1.5 shrink-0 z-30 select-none">
        <div className="hidden xl:flex items-center gap-1 text-[10px] font-bold text-slate-400 shrink-0 uppercase tracking-wider">
          <span className="material-symbols-outlined text-[13px] text-blue-400">grid_view</span>
          <span>{session.exam.total_questions} CÂU:</span>
        </div>
        <ExamPalette
          exam={session.exam}
          answers={session.answers}
          flags={session.flags}
          currentQIndex={session.currentQIndex}
          isReviewMode={session.isReviewMode}
          results={session.results}
          onJumpToQuestion={handleJumpToQuestion}
        />
      </div>

      {/* Confirm submit modal */}
      {session.showConfirmModal && (
        <ExamConfirmModal
          exam={session.exam}
          answers={session.answers}
          onConfirm={handleDoSubmit}
          onCancel={() => session.setShowConfirmModal(false)}
        />
      )}

      {/* Results modal */}
      {session.showResultsModal && session.results && (
        <ExamResultsModal
          results={session.results}
          onReview={handleEnterReview}
          onRetake={handleRetake}
          onExit={handleExit}
        />
      )}

      {/* Answer report modal */}
      {reportModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 font-sans">
            {reportSent ? (
              <div className="text-center space-y-3">
                <span className="material-symbols-outlined text-emerald-500 text-[48px]">check_circle</span>
                <p className="font-bold text-slate-800">Cảm ơn bạn đã báo cáo!</p>
                <p className="text-sm text-slate-500">Chúng tôi sẽ kiểm tra và cập nhật đáp án sớm nhất.</p>
                <button
                  onClick={() => setReportModal(null)}
                  className="px-6 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold"
                >
                  Đóng
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-rose-600">
                  <span className="material-symbols-outlined text-[22px]">report</span>
                  <h3 className="font-black text-base">Báo lỗi câu {reportModal.qNum}</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Đáp án hệ thống: <strong className="text-blue-700">{reportModal.q.correct_answer}</strong><br />
                  Bạn cho rằng đáp án đúng là?
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {['A', 'B', 'C', 'D'].map(l => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setReportSelAns(l)}
                      className={`py-2 rounded-xl border-2 text-sm font-black transition-all ${reportSelAns === l ? 'bg-rose-600 text-white border-rose-600' : 'border-slate-200 text-slate-700 hover:border-rose-400'}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <textarea
                  value={reportNote}
                  onChange={e => setReportNote(e.target.value)}
                  rows={2}
                  placeholder="Giải thích thêm (không bắt buộc)"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setReportModal(null)}
                    className="px-4 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Huỷ
                  </button>
                  <button
                    type="button"
                    disabled={reportSending}
                    onClick={async () => {
                      if (!reportSelAns) { alert('Vui lòng chọn đáp án bạn cho là đúng.'); return; }
                      setReportSending(true);
                      try {
                        const supabase = window._supabaseClient || window.supabase;
                        if (supabase) {
                          await supabase.from('answer_reports').insert([{
                            exam_id: session.exam.id,
                            question_number: reportModal.qNum,
                            system_answer: reportModal.q.correct_answer,
                            reported_answer: reportSelAns,
                            note: reportNote || null,
                            created_at: new Date().toISOString(),
                          }]);
                        }
                      } catch (_) {}
                      setReportSending(false);
                      setReportSent(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 transition-colors disabled:opacity-60"
                  >
                    {reportSending ? 'Đang gửi...' : 'Gửi báo cáo'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PageThptRoom;
