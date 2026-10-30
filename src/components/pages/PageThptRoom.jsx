// src/components/pages/PageThptRoom.jsx
// Phòng thi THPT - Tích hợp kiểm tra cờ is_pro & CrayonLockOverlay trước khi nạp timer và câu hỏi

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
import { useAuth } from '../../providers/AuthProvider.jsx';
import { useModal } from '../../context/ModalContext.jsx';
import { CrayonLockOverlay } from '../common/CrayonLockOverlay.jsx';
import { supabase } from '../../lib/supabaseClient.js';

export function PageThptRoom() {
  const { navigateTo } = useRoute();
  const { isPro, loading: authLoading } = useAuth();
  const { openModal } = useModal();
  const session = useThptSession();
  const splitPanel = useSplitPanel();

  const [examMetadata, setExamMetadata] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [initError, setInitError] = useState(null);

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

  const handleExit = useCallback(() => {
    timer.stop();
    navigateTo('exercises', false);
  }, [timer, navigateTo]);

  // ──────────────────────────────────────────────
  // 1. Kiểm tra quyền PRO & Nạp đề thi
  // ──────────────────────────────────────────────
  useEffect(() => {
    const config = window._thptStartConfig;
    if (!config) {
      navigateTo('exercises');
      return;
    }

    if (authLoading) return; // Chờ xác thực xong

    const { examId, minutes } = config;
    let cancelled = false;

    async function verifyAndLoadExam() {
      try {
        setInitError(null);

        // A. Kiểm tra metadata đề thi từ cache summaries để xác định cờ is_pro
        let summary = null;
        try {
          const cachedSummaries = sessionStorage.getItem('thpt_exams_summaries_v20261030');
          if (cachedSummaries) {
            const arr = JSON.parse(cachedSummaries);
            if (Array.isArray(arr)) {
              summary = arr.find((e) => e.id === examId);
            }
          }
        } catch (_) {}

        // Nếu chưa có trong cache, gọi Supabase RPC để kiểm tra
        if (!summary) {
          try {
            const { data: supaSummaries } = await supabase.rpc('get_thpt_exam_summaries');
            if (Array.isArray(supaSummaries)) {
              summary = supaSummaries.find((e) => e.id === examId);
            }
          } catch (_) {}
        }

        if (summary && !cancelled) {
          setExamMetadata(summary);
        }

        const isExamPro = Boolean(summary?.is_pro || config?.isPro || config?.is_pro);

        // B. KIỂM SOÁT BẢN QUYỀN: Nếu đề là PRO mà user chưa là PRO -> KHÓA NGAY
        if (isExamPro && !isPro) {
          if (!cancelled) {
            setIsLocked(true);
          }
          return; // Dừng lại, tuyệt đối không nạp questions hay start timer!
        }

        // C. Người dùng hợp lệ: Mở khóa và nạp toàn bộ câu hỏi đề thi
        if (!cancelled) {
          setIsLocked(false);
        }

        let examData = null;

        // Thử nạp từ Supabase thpt_exams table (bảo vệ bằng RLS)
        try {
          const { data: supaExam, error: err } = await supabase
            .from('thpt_exams')
            .select('*')
            .eq('id', examId)
            .maybeSingle();

          if (!err && supaExam && Array.isArray(supaExam.questions) && supaExam.questions.length > 0) {
            examData = supaExam;
          }
        } catch (_) {}

        // Fallback sang tệp JSON tĩnh nếu Supabase không có hoặc offline
        if (!examData) {
          try {
            const res = await fetch(`data/thpt_exams.json?v=20260929`);
            if (res.ok) {
              const arr = await res.json();
              examData = arr.find((e) => e.id === examId);
            }
          } catch (_) {}
        }

        if (!examData) {
          throw new Error(`Không tìm được nội dung câu hỏi cho đề thi id: ${examId}`);
        }

        if (cancelled) return;

        // Load saved progress if any
        const savedProgress = session.loadSavedProgress(examId);

        // Bắt đầu phiên làm bài và đếm ngược thời gian
        const { restoredSeconds } = session.startExam(examData, minutes, savedProgress);
        session.initialSecondsRef.current = restoredSeconds;
        session.timerSecondsRef.current = restoredSeconds;
        timer.start(restoredSeconds);

      } catch (err) {
        if (!cancelled) {
          setInitError(err.message || 'Lỗi khi khởi tạo phòng thi');
        }
      }
    }

    verifyAndLoadExam();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isPro]);

  // ──────────────────────────────────────────────
  // 2. Keyboard navigation & Timer sync
  // ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const roomEl = document.getElementById('page-thpt-room');
      if (!roomEl || isLocked) return;

      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      const key = e.key;

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

      if (key === 'ArrowRight' || key === 'Enter') {
        e.preventDefault();
        session.nextQuestion(session.exam?.total_questions || 40);
      } else if (key === 'ArrowLeft') {
        e.preventDefault();
        session.prevQuestion();
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [session, isLocked]);

  useEffect(() => {
    session.timerSecondsRef.current = timer.secondsLeft;
  }, [timer.secondsLeft, session.timerSecondsRef]);

  // Handlers
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

  // ──────────────────────────────────────────────
  // 3. Render khi bị khóa (Lock Overlay Gating)
  // ──────────────────────────────────────────────
  if (isLocked) {
    return (
      <div id="page-thpt-room" className="page active fixed inset-0 z-[100] bg-[#FAF5EB] flex flex-col h-screen w-screen overflow-hidden">
        <header className="px-6 py-3.5 bg-[#FFFDF9] border-b-2 border-[#382E2B] flex items-center justify-between select-none">
          <button
            type="button"
            onClick={handleExit}
            className="px-3.5 py-1.5 rounded-xl bg-white border-2 border-[#382E2B] text-xs font-black shadow-[2px_2px_0px_#382E2B] flex items-center gap-1.5 cursor-pointer hover:bg-[#FAF5EB] active:translate-y-0.5"
          >
            <span>←</span>
            <span>Quay lại</span>
          </button>
          <div className="font-heading font-black text-sm text-[#382E2B]">
            {examMetadata?.title || 'Phòng Luyện Đề THPT Quốc Gia'}
          </div>
          <div className="w-20" />
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <CrayonLockOverlay
            mode="inline"
            title="Đề Thi Dành Riêng Cho Gói PRO 👑"
            description={`Đề thi "${examMetadata?.title || 'này'}" thuộc kho đề thi nâng cao của HiVocab PRO. Nâng cấp ngay để làm bài thi có bấm giờ tự động 50 phút, ma trận 40 câu hỏi và chấm điểm chi tiết!`}
            onUpgrade={() => openModal('pricingModal', { defaultPlanId: 'pro_6m' })}
            onBack={handleExit}
            ctaText="Nâng Cấp PRO Để Vào Thi Ngay 🚀"
            backText="Quay lại danh sách đề thi"
          />
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // 4. Render Loading & Error state
  // ──────────────────────────────────────────────
  if (initError) {
    return (
      <div id="page-thpt-room" className="page active fixed inset-0 z-[100] bg-[#FAF5EB] flex flex-col h-screen w-screen overflow-hidden items-center justify-center p-6">
        <div className="bg-white rounded-3xl border-2 border-[#382E2B] p-8 max-w-md w-full text-center shadow-[4px_6px_0px_#382E2B]">
          <span className="text-4xl mb-3 block">⚠️</span>
          <h3 className="font-heading font-black text-lg text-[#382E2B] mb-2">Không thể tải đề thi</h3>
          <p className="text-xs font-semibold text-[#766C5F] mb-6">{initError}</p>
          <button
            type="button"
            onClick={handleExit}
            className="w-full py-2.5 px-4 bg-[#5a7d4d] text-white font-black text-xs rounded-xl border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B]"
          >
            Quay lại danh sách đề thi
          </button>
        </div>
      </div>
    );
  }

  if (!session.exam) {
    return (
      <div id="page-thpt-room" className="page active fixed inset-0 z-[100] bg-[#FAF5EB] flex flex-col h-screen w-screen overflow-hidden items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-[#5a7d4d]/30 border-t-[#5a7d4d] rounded-full animate-spin" />
        <p className="text-[#382E2B] text-sm font-bold">Đang nạp đề thi THPT...</p>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // 5. Main Exam Room Interface
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

  return (
    <div id="page-thpt-room" className="page active fixed inset-0 z-[100] bg-[#f4f6f9] flex flex-col h-screen w-screen overflow-hidden">
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
        onNext={() => session.nextQuestion(session.exam?.total_questions || 40)}
        onChangeFontSize={session.changeFontSize}
        onToggleFullscreen={() => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          } else {
            document.exitFullscreen?.().catch(() => {});
          }
        }}
        onConfirmSubmit={handleConfirmSubmit}
        onShowResults={() => session.setShowResultsModal(true)}
        onExit={handleExit}
        onSetMobileView={session.setMobileView}
      />

      <div ref={splitPanel.containerRef} className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden relative">
        <div ref={splitPanel.leftRef} className={leftColClass}>
          <ExamPassagePanel
            exam={session.exam}
            currentQIndex={session.currentQIndex}
            fontSizeClass={session.fontSizeClass}
            onJumpToQuestion={handleJumpToQuestion}
            passagePaneRef={splitPanel.passagePaneRef}
          />
        </div>

        <div
          ref={splitPanel.dividerRef}
          className="hidden md:block w-1.5 bg-slate-200 hover:bg-blue-400 cursor-col-resize shrink-0 transition-colors"
          title="Kéo để thay đổi kích thước hai cột"
        />

        <div ref={splitPanel.rightRef} className={rightColClass}>
          <ExamQuestionsPanel
            exam={session.exam}
            currentQIndex={session.currentQIndex}
            answers={session.answers}
            flags={session.flags}
            isReviewMode={session.isReviewMode}
            results={session.results}
            fontSizeClass={session.fontSizeClass}
            questionsPaneRef={splitPanel.questionsPaneRef}
            onSelectAnswer={handleSelectAnswer}
            onToggleFlag={handleToggleFlag}
            onJumpToQuestion={handleJumpToQuestion}
            onReportAnswer={(qNum, q) => {
              setReportModal({ qNum, q });
              setReportSelAns(session.answers[qNum] || '');
              setReportNote('');
              setReportSent(false);
            }}
          />
        </div>
      </div>

      <ExamPalette
        exam={session.exam}
        currentQIndex={session.currentQIndex}
        answers={session.answers}
        flags={session.flags}
        isReviewMode={session.isReviewMode}
        results={session.results}
        onJumpToQuestion={handleJumpToQuestion}
      />

      {session.showConfirmModal && (
        <ExamConfirmModal
          exam={session.exam}
          answers={session.answers}
          onConfirm={handleDoSubmit}
          onCancel={() => session.setShowConfirmModal(false)}
        />
      )}

      {session.showResultsModal && (
        <ExamResultsModal
          results={session.results}
          onReview={handleEnterReview}
          onRetake={handleRetake}
          onExit={handleExit}
        />
      )}

      {/* Answer Report Modal */}
      {reportModal && (
        <div className="fixed inset-0 z-[150] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-[#382E2B] shadow-[5px_6px_0px_#382E2B] p-6 max-w-md w-full select-none animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-[#EFE8D6] mb-4">
              <h3 className="font-heading font-black text-base text-[#382E2B] flex items-center gap-2">
                <span>🚩</span>
                <span>Báo lỗi câu {reportModal.qNum}</span>
              </h3>
              <button
                type="button"
                onClick={() => setReportModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {reportSent ? (
              <div className="text-center py-6 space-y-3">
                <span className="text-4xl block">✅</span>
                <p className="font-bold text-sm text-[#382E2B]">Cảm ơn bạn đã phản hồi!</p>
                <p className="text-xs text-[#766C5F]">Đội ngũ giáo viên HiVocab sẽ kiểm tra và điều chỉnh câu hỏi sớm nhất.</p>
                <button
                  type="button"
                  onClick={() => setReportModal(null)}
                  className="mt-4 px-6 py-2 rounded-2xl bg-[#5a7d4d] text-white text-xs font-black border-2 border-[#382E2B] shadow-[2px_2px_0px_#382E2B]"
                >
                  Đóng
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs text-[#766C5F] mb-3">
                  Nếu bạn thấy đáp án hoặc nội dung câu hỏi có sai sót, hãy chọn đáp án bạn cho là đúng và gửi góp ý:
                </p>

                <div className="space-y-2 mb-4">
                  <label className="block text-xs font-bold text-[#382E2B]">Theo bạn đáp án đúng là:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['A', 'B', 'C', 'D'].map((letter) => (
                      <button
                        key={letter}
                        type="button"
                        onClick={() => setReportSelAns(letter)}
                        className={`py-2 rounded-xl text-xs font-black border-2 transition-all cursor-pointer ${
                          reportSelAns === letter
                            ? 'bg-[#D36135] text-white border-[#382E2B] shadow-[2px_2px_0px_#382E2B]'
                            : 'bg-white text-[#382E2B] border-[#382E2B]/30 hover:border-[#382E2B]'
                        }`}
                      >
                        {letter}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-bold text-[#382E2B] mb-1">Ghi chú thêm (không bắt buộc):</label>
                  <textarea
                    value={reportNote}
                    onChange={(e) => setReportNote(e.target.value)}
                    placeholder="Giải thích vì sao bạn nghĩ đáp án này đúng..."
                    rows={3}
                    className="w-full p-2.5 text-xs bg-[#FAF5EB] rounded-xl border border-[#382E2B]/40 focus:outline-none focus:border-[#382E2B] font-medium resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportModal(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold hover:bg-slate-200"
                  >
                    Huỷ
                  </button>
                  <button
                    type="button"
                    disabled={reportSending}
                    onClick={async () => {
                      if (!reportSelAns) {
                        alert('Vui lòng chọn đáp án bạn cho là đúng.');
                        return;
                      }
                      setReportSending(true);
                      try {
                        await supabase.from('answer_reports').insert([{
                          exam_id: session.exam.id,
                          question_number: reportModal.qNum,
                          system_answer: reportModal.q.correct_answer,
                          reported_answer: reportSelAns,
                          note: reportNote || null,
                          created_at: new Date().toISOString(),
                        }]);
                      } catch (_) {}
                      setReportSending(false);
                      setReportSent(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors disabled:opacity-60 border border-[#382E2B] shadow-[2px_2px_0px_#382E2B]"
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
