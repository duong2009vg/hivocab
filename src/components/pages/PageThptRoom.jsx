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
import { AlertTriangle, Flag, X, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient.js';
import { getExerciseTheory, getExerciseQuestions } from '../../services/exercisesService.js';

export function PageThptRoom() {
  const { navigateTo } = useRoute();
  const { isPro, loading: authLoading } = useAuth();
  const { openModal } = useModal();

  const [examMetadata, setExamMetadata] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [initError, setInitError] = useState(null);

  const session = useThptSession();
  const splitPanel = useSplitPanel(Boolean(session.exam && !isLocked));

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
    if (session.exam?.is_exercise || window._thptStartConfig?.isExercise) {
      sessionStorage.setItem('hv_roadmap_open_book', 'book2');
      const exId = session.exam?.id || window._thptStartConfig?.exerciseId || window._thptStartConfig?.examId;
      if (exId) {
        sessionStorage.setItem('hv_chuyende_active_id', exId);
      }
    }
    navigateTo('exercises', false);
  }, [timer, navigateTo, session.exam]);

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

        // ========================================================
        // 1. CHẾ ĐỘ 29 CHUYÊN ĐỀ HỌC TẬP THPT (Luyện tập chuyên đề)
        // ========================================================
        const isExercise = Boolean(
          config?.isExercise ||
          config?.exerciseId ||
          (examId && String(examId).startsWith('c0000000-'))
        );
        const exerciseId = config?.exerciseId || examId;

        if (isExercise) {
          if (!cancelled) {
            setIsLocked(false);
          }

          const [theoryText, rawQuestions] = await Promise.all([
            getExerciseTheory(exerciseId),
            getExerciseQuestions(exerciseId),
          ]);

          if (!rawQuestions || rawQuestions.length === 0) {
            throw new Error('Chuyên đề chưa có câu hỏi luyện tập.');
          }

          const normalizedQuestions = rawQuestions.map((q, idx) => {
            let opts = {};
            if (Array.isArray(q.options)) {
              const letters = ['A', 'B', 'C', 'D', 'E'];
              q.options.forEach((opt, oIdx) => {
                const letter = letters[oIdx] || 'A';
                const cleanText = typeof opt === 'string'
                  ? opt.replace(/^[A-E]\.\s*/, '').trim()
                  : String(opt || '');
                opts[letter] = cleanText;
              });
            } else if (q.options && typeof q.options === 'object') {
              opts = { ...q.options };
            }

            return {
              id: q.id,
              number: idx + 1,
              question_number: idx + 1,
              prompt: q.prompt,
              options: opts,
              correct_answer: (q.answer || '').toUpperCase().trim(),
              explanation: q.hint || '',
              passage: q.passage || '',
              context_passage: q.passage || '',
              is_arrangement: Boolean(q.is_arrangement),
              arrangement_sentences: q.arrangement_sentences || [],
              type: q.is_arrangement ? 'arrangement' : 'multiple_choice',
              question_type: q.question_type || (q.is_arrangement ? 'sentence_arrangement' : 'multiple_choice'),
            };
          });

          // Xây dựng sections cho bài tập chuyên đề
          const hasPassages = normalizedQuestions.some(
            (q) => q.passage && q.passage.trim().length > 0
          );
          let sections = [];

          if (hasPassages) {
            let currentPassage = null;
            let currentSec = null;
            normalizedQuestions.forEach((q) => {
              const p = (q.passage || '').trim();
              if (p !== currentPassage || !currentSec) {
                currentPassage = p;
                currentSec = {
                  index: sections.length + 1,
                  part: sections.length + 1,
                  name: p ? `Bài đọc ${sections.length + 1}` : 'Câu hỏi độc lập',
                  type: q.is_arrangement ? 'arrangement' : p ? 'reading' : 'theory',
                  startQ: q.number,
                  endQ: q.number,
                  start_q: q.number,
                  end_q: q.number,
                  from_question: q.number,
                  to_question: q.number,
                  instruction: 'Đọc kỹ ngữ liệu và chọn phương án trả lời đúng.',
                  passage: p || theoryText || '',
                  raw_text: p || theoryText || '',
                  paragraphs: p ? p.split(/\n\s*\n/).filter(Boolean) : [theoryText],
                };
                sections.push(currentSec);
              } else {
                currentSec.endQ = q.number;
                currentSec.end_q = q.number;
                currentSec.to_question = q.number;
              }
            });
          } else {
            // Không có bài đọc riêng (ngữ pháp / từ vựng) -> Cột trái hiển thị Lý thuyết chuyên đề
            sections = [
              {
                index: 1,
                part: 1,
                name: config.exerciseTitle || 'Lý thuyết trọng tâm & Chiến thuật',
                type: 'theory',
                startQ: 1,
                endQ: normalizedQuestions.length,
                start_q: 1,
                end_q: normalizedQuestions.length,
                from_question: 1,
                to_question: normalizedQuestions.length,
                instruction: 'Ôn tập lý thuyết ở cột bên trái và làm bài tập thực hành ở cột bên phải.',
                passage: theoryText || '',
                raw_text: theoryText || '',
                paragraphs: theoryText ? theoryText.split(/\n\s*\n/).filter(Boolean) : [],
              },
            ];
          }

          const examData = {
            id: exerciseId,
            title: config.exerciseTitle || 'Chuyên đề THPT',
            is_exercise: true,
            total_questions: normalizedQuestions.length,
            duration_minutes: 0,
            theory: theoryText,
            questions: normalizedQuestions,
            sections,
          };

          if (cancelled) return;

          setExamMetadata({
            id: exerciseId,
            title: examData.title,
            total_questions: examData.total_questions,
            is_pro: false,
          });

          const savedProgress = session.loadSavedProgress(exerciseId);
          const { restoredSeconds } = session.startExam(examData, 0, savedProgress);
          session.initialSecondsRef.current = restoredSeconds;
          session.timerSecondsRef.current = restoredSeconds;
          timer.start(restoredSeconds);
          return;
        }

        // ========================================================
        // 2. CHẾ ĐỘ THI THỬ THPT (Mock Exams)
        // ========================================================
        // A. Kiểm tra metadata đề thi từ cache summaries để xác định cờ is_pro
        let summary = null;
        try {
          const cachedSummaries = sessionStorage.getItem('thpt_exams_summaries_v20261111');
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
      <div id="page-thpt-room" className="page active fixed inset-0 z-[100] bg-[#FAF5EB] flex flex-col h-[100dvh] min-h-[100dvh] w-screen overflow-hidden">
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
            title="Đề Thi Dành Riêng Cho Gói PRO"
            description={`Đề thi "${examMetadata?.title || 'này'}" thuộc kho đề thi nâng cao của HiVocab PRO. Nâng cấp ngay để làm bài thi có bấm giờ tự động 50 phút, ma trận 40 câu hỏi và chấm điểm chi tiết!`}
            onUpgrade={() => openModal('pricingModal', { defaultPlanId: 'pro_6m' })}
            onBack={handleExit}
            ctaText="Nâng Cấp PRO Để Vào Thi Ngay"
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
      <div id="page-thpt-room" className="page active fixed inset-0 z-[100] bg-[#FAF5EB] flex flex-col h-[100dvh] min-h-[100dvh] w-screen overflow-hidden items-center justify-center p-6">
        <div className="bg-white rounded-3xl border-2 border-[#382E2B] p-8 max-w-md w-full text-center shadow-[4px_6px_0px_#382E2B]">
          <AlertTriangle className="w-10 h-10 text-[#C85A3F] mx-auto mb-3 shrink-0" />
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
      <div id="page-thpt-room" className="page active fixed inset-0 z-[100] bg-[#FAF5EB] flex flex-col h-[100dvh] min-h-[100dvh] w-screen overflow-hidden items-center justify-center gap-4">
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
    passage:   'hidden md:flex w-full md:w-1/2 flex-col bg-[#FAF9F6] overflow-hidden min-h-0 md:h-full transition-all border-l border-[#EFE8D6] md:border-l-0',
    questions: 'w-full md:w-1/2 flex flex-col bg-[#FAF9F6] overflow-hidden min-h-0 h-full transition-all border-l border-[#EFE8D6] md:border-l-0',
    both:      'w-full md:w-1/2 flex flex-col bg-[#FAF9F6] overflow-hidden min-h-0 h-1/2 md:h-full transition-all border-l border-[#EFE8D6] md:border-l-0',
  }[session.mobileView] || 'w-full md:w-1/2 flex flex-col bg-[#FAF9F6] overflow-hidden min-h-0 h-1/2 md:h-full';

  return (
    <div id="page-thpt-room" className="page active fixed inset-0 z-[100] bg-[#FAF9F6] flex flex-col h-[100dvh] min-h-[100dvh] w-screen overflow-hidden">
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
          className="hidden md:block w-2 bg-[#EFE8D6] hover:bg-[#5a7d4d] cursor-col-resize shrink-0 transition-colors z-10 select-none"
          title="Kéo sang trái/phải để thay đổi kích thước hai cột"
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
                <Flag className="w-4 h-4 text-[#C85A3F] shrink-0" />
                <span>Báo lỗi câu {reportModal.qNum}</span>
              </h3>
              <button
                type="button"
                onClick={() => setReportModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-xs font-bold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportSent ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle2 className="w-10 h-10 text-[#5a7d4d] mx-auto block shrink-0" />
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
                        const { error: insErr } = await supabase.from('answer_reports').insert([{
                          exam_id: String(session.exam.id),
                          question_number: Number(reportModal.qNum),
                          system_answer: reportModal.q?.correct_answer ? String(reportModal.q.correct_answer) : null,
                          reported_answer: String(reportSelAns),
                          note: reportNote ? String(reportNote) : null,
                          created_at: new Date().toISOString(),
                        }]);
                        if (insErr) {
                          console.warn('[PageThptRoom] answer_reports insert error:', insErr);
                        }
                      } catch (err) {
                        console.error('[PageThptRoom] Answer report exception:', err);
                      }
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
