import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExamSession } from '../hooks/useExamSession';
import { useHeartbeat } from '../hooks/useHeartbeat';
import { useAnswerPersistence } from '../hooks/useAnswerPersistence';
import { useExamSessionStore } from '../store/examSessionStore';
import { useAuthStore } from '../store/authStore';
import { useIncrementCheats } from '../api/queries';

import ExamHeader from '../components/exam/ExamHeader';
import QuestionCard from '../components/exam/QuestionCard';
import NavigationBar from '../components/exam/NavigationBar';
import ExamSidebar from '../components/exam/ExamSidebar';
import MobilePalette from '../components/exam/MobilePalette';
import SubmitModal from '../components/exam/SubmitModal';
import WarningDialog from '../components/exam/alertBox';

export default function ExamSession() {
  const { examId } = useParams();
  const navigate   = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { mutateAsync: incrementCheats } = useIncrementCheats();

  // ── 1. Load session (fetches from server, seeds store) ───────────────────
  const { loading, error } = useExamSession(examId);

  const {
    questions,
    examStatus,
    setCurrentIndex,
  } = useExamSessionStore();
  console.log(questions)

  // ── 2. Answer persistence + submit (single source of truth) ─────────────
  const { submitExam } = useAnswerPersistence(examId);

  const [showModal, setShowModal]     = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState(null);
const [warningOpen, setWarningOpen] = useState(false);
const [warningsLeft, setWarningsLeft] = useState(3);
  // ── 3. Finalize — auto or manual, guarded against double-calls ──────────
  const isFinalizingRef = useRef(false);


  useExamProtection();

  const handleFinalize = useCallback(
    async (isAuto = false) => {
      if (isFinalizingRef.current) return;
      isFinalizingRef.current = true;

      setSubmitting(true);
      setSubmitError(null);
      setShowModal(false);

      try {
        const response = await submitExam({ isAuto });

        // response shape: { message, submitted, result? }
        // result is only present when exam.showResultAfterSubmit = true
        navigate(`/exam/${examId}/result`, {
          replace: true,
          state: {
            result:  response?.result ?? null,
            message: response?.message ?? null,
          },
        });
      } catch (err) {
        isFinalizingRef.current = false;
        setSubmitError(
          err?.response?.data?.message ?? 'Submission failed. Please try again.'
        );
        setSubmitting(false);
      }
    },
    [examId, submitExam, navigate]
  );

  // ── 4. Timer expiry → auto-submit ────────────────────────────────────────
  const handleExpire = useCallback(
    () => handleFinalize(true),
    [handleFinalize]
  );

  // ── 5. Heartbeat — syncs timer every 30s, catches server finalization ────
  const { isOnline } = useHeartbeat(examId, {
    onFinalize: (status) => {
      if (status === 'auto_submitted') handleFinalize(true);
      if (status === 'submitted')      handleFinalize(false);
    },
  });

  // ── 6. beforeunload warning ───────────────────────────────────────────────
  useEffect(() => {
    if (!examId || !questions.length) return;
    const handler = (e) => {
      if (examStatus !== 'in_progress') return;
      e.preventDefault();
      e.returnValue = 'Your exam is still running.';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [examId, questions.length, examStatus]);

  // ── 6.5 Tab Switch / Minimize Tracking ────────────────────────────────────
  useEffect(() => {
    if (!examId || !user?._id || examStatus !== 'in_progress') return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        try {
          const res = await incrementCheats({
            examId,
            studentId: user._id,
          });

          if (res && res.cheats >= 4) {
            handleFinalize(true);
          } else if (res) {
            setWarningsLeft(4 - res.cheats);

            setWarningOpen(true);
          }
        } catch (error) {
          console.error("Error incrementing cheat:", error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [examId, user?._id, examStatus, incrementCheats, handleFinalize]);

  // ── 7. Navigation ─────────────────────────────────────────────────────────
  const handleSelect = useCallback(
    (idx) => setCurrentIndex(idx),
    [setCurrentIndex]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Render states
  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <div className="w-10 h-10 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading exam…</p>
        <p className="text-xs text-slate-400">Questions load from cache if offline.</p>
      </div>
    );
  }

  if (error && !questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">😕</div>
          <h1 className="text-lg font-bold text-slate-900 mb-2">Could not load exam</h1>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <button onClick={() => navigate(-1)} className="btn btn-secondary w-full justify-center">
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 text-sm">No questions found for this exam.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header with isolated timer */}
      <ExamHeader onExpire={handleExpire} />

      {/* Offline / error banner */}
      {(!isOnline || error) && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-700 font-medium">
          {!isOnline
            ? "⚠ Network lost — timer running from last sync. Answers are saved locally."
            : error}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 max-w-screen-xl mx-auto w-full px-4 py-6 flex gap-6">
        <main className="flex-1 min-w-0 flex flex-col gap-5">
          {submitError && (
            <div
              role="alert"
              className="flex items-start gap-3 px-4 py-3 rounded-lg text-sm border bg-red-50 border-red-200 text-red-800"
            >
              <span aria-hidden="true">✕</span>
              {submitError}
            </div>
          )}

          {/* QuestionCard uses useAnswerPersistence internally */}
          <QuestionCard />
        </main>

        <ExamSidebar
          onSubmit={() => setShowModal(true)}
          onSelect={handleSelect}
        />
      </div>

      <NavigationBar onSubmit={() => setShowModal(true)} />

      <MobilePalette
        onSelect={handleSelect}
        onSubmit={() => setShowModal(true)}
      />

      {showModal && (
        <SubmitModal
          onConfirm={() => handleFinalize(false)}
          onCancel={() => setShowModal(false)}
          submitting={submitting}
        />
      )}

      <WarningDialog
        open={warningOpen}
        warningsLeft={warningsLeft}
        onClose={() => setWarningOpen(false)}
      />
    </div>
  );
}



const useExamProtection = () => {

  useEffect(() => {

    const preventCopy = (e) => {
      e.preventDefault();
    };

    const preventRightClick = (e) => {
      e.preventDefault();
    };

    const preventKeyShortcuts = (e) => {

      const blockedKeys = [
        'c',
        'v',
        'x',
        'a',
        's',
        'p',
        'u'
      ];

      if (
        (e.ctrlKey || e.metaKey) &&
        blockedKeys.includes(e.key.toLowerCase())
      ) {

        e.preventDefault();

      }

      // F12
      if (e.key === 'F12') {
        e.preventDefault();
      }

    };

    document.addEventListener(
      'copy',
      preventCopy
    );

    document.addEventListener(
      'cut',
      preventCopy
    );

    document.addEventListener(
      'paste',
      preventCopy
    );

    document.addEventListener(
      'contextmenu',
      preventRightClick
    );

    document.addEventListener(
      'keydown',
      preventKeyShortcuts
    );

    return () => {

      document.removeEventListener(
        'copy',
        preventCopy
      );

      document.removeEventListener(
        'cut',
        preventCopy
      );

      document.removeEventListener(
        'paste',
        preventCopy
      );

      document.removeEventListener(
        'contextmenu',
        preventRightClick
      );

      document.removeEventListener(
        'keydown',
        preventKeyShortcuts
      );

    };

  }, []);

};

