import { useEffect, useRef, useState } from 'react';
import { useAttemptStore } from '../store/attemptStore';
import { useExamSessionStore } from '../store/examSessionStore';
import { startExam } from '../api/joinExam';

/**
 * Cache key is scoped to this origin so it cannot be replayed cross-site.
 * Only the question list is cached — timer state always comes from server.
 */
const buildCacheKey = (examId) => `ef_exam_${examId}_questions`;

/**
 * useExamSession
 *
 * Calls POST /attempt/start, seeds the examSessionStore (including timer),
 * and caches the question list in localStorage for offline resilience.
 *
 * Timer state (remainingTime, startedAt) is NEVER taken from cache —
 * it is always computed fresh from the server response to prevent cheating.
 *
 * Returns { loading, error }
 */
export function useExamSession(examId) {
  const { mutateAsync }  = startExam();
  const setExamId        = useAttemptStore((s) => s.setExamId);
  const initSession      = useExamSessionStore((s) => s.initSession);
  const storeExamId      = useExamSessionStore((s) => s.examId);
  const storeRemainging  = useExamSessionStore((s) => s.remainingTime);

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (!examId || hasFetched.current) return;
    hasFetched.current = true;

    // Already initialised for this exam — do not re-fetch
    if (storeExamId === examId && storeRemainging > 0) return;

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        // Always call the server — timer state must be fresh
        const data = await mutateAsync();

        const questions    = data.questions ?? [];
        const examTitle    = data.exam?.title ?? '';
        const remainingTime = data.remainingTime ?? 0;
        const startedAt    = data.startedAt ?? null;
        const currentQuestionIndex = data.currentQuestionIndex ?? 0;
        const savedAnswers = data.savedAnswers ?? [];

        // Cache ONLY the question list (not timer — that must come from server)
        try {
          const cachePayload = {
            origin: window.location.origin,
            examId,
            questions,
            cachedAt: Date.now(),
          };
          localStorage.setItem(buildCacheKey(examId), JSON.stringify(cachePayload));
        } catch {
          // Quota exceeded — proceed without caching
        }

        initSession({
          examId,
          examTitle,
          startedAt,
          remainingTime,
          currentQuestionIndex,
          savedAnswers,
          questions,
        });

        setExamId(examId);
      } catch (err) {
        const serverMsg = err?.response?.data?.message;

        // If offline, try to restore question list from cache
        // (timer will be missing — we show a reconnect banner)
        if (!navigator.onLine) {
          const cached = readCache(examId);
          if (cached?.questions?.length) {
            // Partial restore — questions only, no timer
            initSession({
              examId,
              examTitle: '',
              startedAt: null,
              remainingTime: 0,
              currentQuestionIndex: 0,
              savedAnswers: [],
              questions: cached.questions,
            });
            setExamId(examId);
            setError('Offline — timer unavailable. Reconnect to sync.');
            return;
          }
        }

        setError(serverMsg ?? 'Failed to load exam. Please refresh.');
      } finally {
        setLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  return { loading, error };
}

function readCache(examId) {
  try {
    const raw = localStorage.getItem(`ef_exam_${examId}_questions`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.origin !== window.location.origin) return null;
    if (parsed.examId !== examId) return null;
    return parsed;
  } catch {
    return null;
  }
}
