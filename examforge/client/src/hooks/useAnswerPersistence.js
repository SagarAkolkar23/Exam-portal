import { useCallback, useRef } from 'react';
import { useExamSessionStore, storageKey } from '../store/examSessionStore';
import { useCustomMutation } from '../api/useQuery';

/**
 * useAnswerPersistence
 *
 * Central hook that owns every answer write + final submission.
 *
 * Responsibilities:
 *  1. Record MCQ / descriptive answers into Zustand (which auto-persists
 *     to localStorage via the persist middleware).
 *  2. Write a secondary per-exam localStorage snapshot on every answer change
 *     so the data is recoverable even if Zustand's storage key changes.
 *  3. Clear a previous answer (MCQ toggle-off, descriptive clear).
 *  4. Build the final answers array and POST to POST /attempt/submit.
 *  5. Clean up all storage after a successful submit.
 *
 * @param {string} examId
 * @returns {{
 *   answerMcq:         (questionId: string, selectedIndex: number) => void,
 *   answerDescriptive: (questionId: string, textAnswer: string) => void,
 *   clearAnswer:       (questionId: string) => void,
 *   submitExam:        (opts?: { isAuto?: boolean }) => Promise<any>,
 *   submitting:        boolean (tracked via ref — does not cause re-renders),
 * }}
 */
export function useAnswerPersistence(examId) {
  const {
    questions,
    answers,
    setMcqAnswer,
    setDescriptiveAnswer,
    clearAnswer: storeClearAnswer,
    markSubmitted,
    clearSession,
  } = useExamSessionStore();

  // ── Submit mutation ─────────────────────────────────────────────────────
  const { mutateAsync: submitMutation } = useCustomMutation({
    mutationFn: (payload) => ({
      url: '/attempt/submit',
      method: 'POST',
      data: payload,
    }),
  });

  const isSubmittingRef = useRef(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Internal: write answers to the per-exam localStorage snapshot
  // This runs in addition to Zustand's own persist middleware.
  // ─────────────────────────────────────────────────────────────────────────
  const flushToStorage = useCallback(
    (updatedAnswers) => {
      if (!examId) return;
      try {
        const key = storageKey(examId);
        const existing = (() => {
          try { return JSON.parse(localStorage.getItem(key) ?? '{}'); } catch { return {}; }
        })();

        localStorage.setItem(
          key,
          JSON.stringify({
            ...existing,
            answers: updatedAnswers,
            lastSavedAt: Date.now(),
          })
        );
      } catch {
        // Quota exceeded — Zustand's persist is still the safety net
      }
    },
    [examId]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // answerMcq
  // Handles: first answer, change of answer, toggle-off (same index → clear)
  // ─────────────────────────────────────────────────────────────────────────
  const answerMcq = useCallback(
    (questionId, selectedIndex) => {
      const current = answers[questionId];
      const question = questions.find((q) => q._id === questionId);
      const isMulti = question?.isMultiSelect || false;

      if (isMulti) {
        const currentIndices = current && Array.isArray(current.selectedIndices)
          ? current.selectedIndices
          : (current && current.selectedIndex !== undefined && current.selectedIndex !== null && current.selectedIndex !== -1 ? [current.selectedIndex] : []);
        
        const nextIndices = currentIndices.includes(selectedIndex)
          ? currentIndices.filter(i => i !== selectedIndex)
          : [...currentIndices, selectedIndex];

        if (nextIndices.length === 0) {
          storeClearAnswer(questionId);
          const next = { ...answers };
          delete next[questionId];
          flushToStorage(next);
          return;
        }

        const primaryIndex = nextIndices[0];
        setMcqAnswer(questionId, primaryIndex, nextIndices);

        const next = {
          ...answers,
          [questionId]: {
            selectedIndex: primaryIndex,
            selectedIndices: nextIndices,
            answeredAt: new Date().toISOString(),
          },
        };
        flushToStorage(next);
      } else {
        // Toggle off — clicking the already-selected option clears it
        if (current?.selectedIndex === selectedIndex) {
          storeClearAnswer(questionId);
          const next = { ...answers };
          delete next[questionId];
          flushToStorage(next);
          return;
        }

        setMcqAnswer(questionId, selectedIndex, [selectedIndex]);

        const next = {
          ...answers,
          [questionId]: {
            selectedIndex,
            selectedIndices: [selectedIndex],
            answeredAt: new Date().toISOString(),
          },
        };
        flushToStorage(next);
      }
    },
    [questions, answers, setMcqAnswer, storeClearAnswer, flushToStorage]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // answerDescriptive
  // ─────────────────────────────────────────────────────────────────────────
  const answerDescriptive = useCallback(
    (questionId, textAnswer) => {
      setDescriptiveAnswer(questionId, textAnswer);

      const next = {
        ...answers,
        [questionId]: {
          textAnswer,
          answeredAt: new Date().toISOString(),
        },
      };
      flushToStorage(next);
    },
    [answers, setDescriptiveAnswer, flushToStorage]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // clearAnswer (explicit clear button)
  // ─────────────────────────────────────────────────────────────────────────
  const clearAnswer = useCallback(
    (questionId) => {
      storeClearAnswer(questionId);
      const next = { ...answers };
      delete next[questionId];
      flushToStorage(next);
    },
    [answers, storeClearAnswer, flushToStorage]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // buildPayload — constructs the answers array for the API
  // ─────────────────────────────────────────────────────────────────────────
  const buildPayload = useCallback(
    (isAuto = false) => {
      const answersArray = questions.map((q) => {
        const ans = answers[q._id] ?? {};
        const base = {
          questionId:  q._id,
          answeredAt:  ans.answeredAt ?? null,
        };

        if (q.type === 'mcq') {
          return { 
            ...base, 
            selectedIndex: ans.selectedIndex ?? -1,
            selectedIndices: ans.selectedIndices ?? (ans.selectedIndex !== undefined && ans.selectedIndex !== null && ans.selectedIndex !== -1 ? [ans.selectedIndex] : [])
          };
        }
        return { ...base, textAnswer: ans.textAnswer ?? '' };
      });

      return {
        examId,
        answers: answersArray,
        isAutoSubmitted: isAuto,
      };
    },
    [examId, questions, answers]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // submitExam — POSTs to /attempt/submit, cleans up on success
  // ─────────────────────────────────────────────────────────────────────────
  const submitExam = useCallback(
    async ({ isAuto = false } = {}) => {
      if (isSubmittingRef.current) {
        throw new Error('Submission already in progress');
      }
      isSubmittingRef.current = true;

      try {
        const payload = buildPayload(isAuto);
        const result  = await submitMutation(payload);

        // Mark in store + wipe localStorage
        markSubmitted();
        clearSession(); // also removes per-exam localStorage key

        return result;
      } catch (err) {
        isSubmittingRef.current = false;
        throw err;
      }
      // Note: isSubmittingRef stays true on success intentionally —
      // the page will unmount/navigate away so there is nothing to reset.
    },
    [buildPayload, submitMutation, markSubmitted, clearSession]
  );

  return {
    answerMcq,
    answerDescriptive,
    clearAnswer,
    submitExam,
  };
}
