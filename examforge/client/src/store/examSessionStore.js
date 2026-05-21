import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';


const storageKey = (examId) => `ef_session_${examId ?? 'default'}`;

export const useExamSessionStore = create(
  persist(
    (set, get) => ({
      examId: null,
      examTitle: '',
      startedAt: null,

      remainingTime: 0,
      timerBaseline: null,

      // ── Questions (not persisted — fetched from server / cache) ──────────
      questions: [],

      // ── Answers: persisted ────────────────────────────────────────────────
      // Map: questionId → { selectedIndex, answeredAt }
      //                  | { textAnswer,   answeredAt }
      answers: {},

      // ── Review marks: persisted ───────────────────────────────────────────
      // Stored as an array (Set is not JSON-serializable) and rehydrated
      markedIds: [],

      // ── Navigation: persisted ─────────────────────────────────────────────
      currentIndex: 0,

      // ── Lifecycle ─────────────────────────────────────────────────────────
      submitted: false,
      examStatus: 'in_progress',

      // ─────────────────────────────────────────────────────────────────────
      // initSession — called by useExamSession after startExam API responds
      // ─────────────────────────────────────────────────────────────────────
      initSession: ({
        examId,
        examTitle,
        startedAt,
        remainingTime,
        currentQuestionIndex,
        savedAnswers,
        questions,
      }) => {
        const currentState = get();

        // If resuming the same exam that's already persisted, keep local answers
        // (they may be newer than savedAnswers from the server)
        const isResume = currentState.examId === examId && Object.keys(currentState.answers).length > 0;

        let answers = currentState.answers;

        if (!isResume) {
          // Fresh start — seed from server savedAnswers
          answers = {};
          if (Array.isArray(savedAnswers)) {
            for (const a of savedAnswers) {
              if (!a.questionId) continue;
              const key = a.questionId.toString();
              answers[key] =
                a.textAnswer !== undefined && a.textAnswer !== ''
                  ? { textAnswer: a.textAnswer, answeredAt: a.answeredAt ?? new Date().toISOString() }
                  : { 
                      selectedIndex: a.selectedIndex ?? null, 
                      selectedIndices: a.selectedIndices ?? (a.selectedIndex !== undefined && a.selectedIndex !== null && a.selectedIndex !== -1 ? [a.selectedIndex] : []),
                      answeredAt: a.answeredAt ?? new Date().toISOString() 
                    };
            }
          }
        }

        set({
          examId,
          examTitle,
          startedAt,
          remainingTime,
          timerBaseline: { perf: performance.now(), remaining: remainingTime },
          questions,
          answers,
          markedIds: isResume ? currentState.markedIds : [],
          currentIndex: isResume ? currentState.currentIndex : (currentQuestionIndex ?? 0),
          submitted: false,
          examStatus: 'in_progress',
        });
      },

      // ─────────────────────────────────────────────────────────────────────
      // syncTimer — called by heartbeat every 30s
      // ─────────────────────────────────────────────────────────────────────
      syncTimer: (remainingTime, examStatus) => {
        set({
          remainingTime,
          timerBaseline: { perf: performance.now(), remaining: remainingTime },
          examStatus: examStatus ?? get().examStatus,
        });
      },

      // ─────────────────────────────────────────────────────────────────────
      // Navigation
      // ─────────────────────────────────────────────────────────────────────
      setCurrentIndex: (index) => set({ currentIndex: index }),

      goNext: () =>
        set((s) => ({
          currentIndex: Math.min(s.currentIndex + 1, s.questions.length - 1),
        })),

      goPrev: () =>
        set((s) => ({
          currentIndex: Math.max(s.currentIndex - 1, 0),
        })),

      // ─────────────────────────────────────────────────────────────────────
      // Answers — each write stamps answeredAt so the server gets audit trail
      // ─────────────────────────────────────────────────────────────────────
      setMcqAnswer: (questionId, selectedIndex, selectedIndices = []) =>
        set((s) => ({
          answers: {
            ...s.answers,
            [questionId]: {
              selectedIndex,
              selectedIndices,
              answeredAt: new Date().toISOString(),
            },
          },
        })),

      setDescriptiveAnswer: (questionId, textAnswer) =>
        set((s) => ({
          answers: {
            ...s.answers,
            [questionId]: {
              textAnswer,
              answeredAt: new Date().toISOString(),
            },
          },
        })),

      clearAnswer: (questionId) =>
        set((s) => {
          const next = { ...s.answers };
          delete next[questionId];
          return { answers: next };
        }),

      // ─────────────────────────────────────────────────────────────────────
      // Review marks — stored as array (JSON-safe)
      // ─────────────────────────────────────────────────────────────────────
      toggleMark: (questionId) =>
        set((s) => {
          const set_ = new Set(s.markedIds);
          set_.has(questionId) ? set_.delete(questionId) : set_.add(questionId);
          return { markedIds: Array.from(set_) };
        }),

      // ─────────────────────────────────────────────────────────────────────
      // Lifecycle
      // ─────────────────────────────────────────────────────────────────────
      markSubmitted: () => set({ submitted: true, examStatus: 'submitted' }),

      clearSession: () => {
        const examId = get().examId;

        // Wipe the persisted storage for this exam
        try {
          localStorage.removeItem(storageKey(examId));
        } catch {}

        set({
          examId: null,
          examTitle: '',
          startedAt: null,
          remainingTime: 0,
          timerBaseline: null,
          questions: [],
          answers: {},
          markedIds: [],
          currentIndex: 0,
          submitted: false,
          examStatus: 'in_progress',
        });
      },

      // ─────────────────────────────────────────────────────────────────────
      // Derived helpers
      // ─────────────────────────────────────────────────────────────────────
      isAttempted: (questionId) => {
        const ans = get().answers[questionId];
        if (!ans) return false;
        if ('selectedIndices' in ans)
          return Array.isArray(ans.selectedIndices) && ans.selectedIndices.length > 0;
        if ('selectedIndex' in ans)
          return ans.selectedIndex !== null && ans.selectedIndex !== undefined && ans.selectedIndex !== -1;
        if ('textAnswer' in ans) return ans.textAnswer.trim().length > 0;
        return false;
      },

      isMarked: (questionId) => get().markedIds.includes(questionId),

      getStats: () => {
        const { questions, answers, markedIds } = get();
        let attempted = 0;
        for (const q of questions) {
          const ans = answers[q._id];
          if (!ans) continue;
          if ('selectedIndices' in ans && Array.isArray(ans.selectedIndices) && ans.selectedIndices.length > 0) attempted++;
          else if ('selectedIndex' in ans && ans.selectedIndex !== null && ans.selectedIndex !== -1) attempted++;
          else if ('textAnswer' in ans && ans.textAnswer.trim()) attempted++;
        }
        return {
          total: questions.length,
          attempted,
          remaining: questions.length - attempted,
          marked: markedIds.length,
        };
      },
    }),

    {
      // ── Persist config ────────────────────────────────────────────────────
      name: storageKey(null), // initial key; overridden dynamically below
      storage: createJSONStorage(() => localStorage),

      // Only persist student-owned data — NOT timer/question content
      partialize: (state) => ({
        examId:       state.examId,
        answers:      state.answers,
        markedIds:    state.markedIds,
        currentIndex: state.currentIndex,
        examStatus:   state.examStatus,
      }),

      // Dynamic storage key: switches to ef_session_<examId> when examId is set
      // Zustand persist reads `name` once on init; to get per-exam isolation we
      // also manually write/read via clearSession and initSession.
    }
  )
);

/**
 * Helper used by useAnswerPersistence to read back the exam-specific storage key.
 * Zustand's persist writes to `name` on every set() — we compute the per-exam
 * key here and write directly so answers don't mix across exams.
 */
export { storageKey };
