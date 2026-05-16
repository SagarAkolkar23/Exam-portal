import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import api from '../api/axios';
import { useExamSessionStore } from '../store/examSessionStore';

const HEARTBEAT_INTERVAL_MS = 30_000; // 30 seconds

/**
 * useHeartbeat
 *
 * Polls GET /attempt/heartbeat/:examId every 30 seconds via React Query.
 *
 * On each successful response:
 *  1. Calls syncTimer() to re-anchor the performance.now() baseline.
 *     This corrects any drift accumulated over the 30s window.
 *  2. If backend status is 'submitted' | 'auto_submitted', calls onFinalize.
 *
 * React Query handles:
 *  - Automatic retries on network failure
 *  - Re-fetching when the window regains focus (catches tab-switch scenarios)
 *  - Deduplication
 *
 * @param {string | null} examId
 * @param {{ onFinalize: (status: string) => void }} options
 */
export function useHeartbeat(examId, { onFinalize } = {}) {
  const syncTimer   = useExamSessionStore((s) => s.syncTimer);
  const examStatus  = useExamSessionStore((s) => s.examStatus);
  const submitted   = useExamSessionStore((s) => s.submitted);

  const onFinalizeRef = useRef(onFinalize);
  useEffect(() => { onFinalizeRef.current = onFinalize; }, [onFinalize]);

  // Only poll while exam is actively in progress
  const enabled =
    !!examId &&
    !submitted &&
    examStatus === 'in_progress';

  const query = useQuery({
    queryKey: ['heartbeat', examId],
    queryFn: async () => {
      const res = await api.get(`/attempt/heartbeat/${examId}`);
      return res.data;
    },
    enabled,
    refetchInterval: HEARTBEAT_INTERVAL_MS,
    refetchIntervalInBackground: true, // keep polling even if tab is hidden
    refetchOnWindowFocus: true,        // immediate resync when student returns to tab
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000), // exp backoff
    staleTime: HEARTBEAT_INTERVAL_MS - 1000,
  });

  // Process each heartbeat response
  useEffect(() => {
    const data = query.data;
    if (!data) return;

    const { remainingTime, status } = data;

    // Re-anchor performance baseline — corrects drift
    syncTimer(remainingTime, status);

    // Finalise if backend says exam is over
    if (status === 'submitted' || status === 'auto_submitted') {
      onFinalizeRef.current?.(status);
    }
  }, [query.data, syncTimer]);

  return {
    isOnline:    !query.isError,
    lastSynced:  query.dataUpdatedAt,
    syncError:   query.isError ? query.error?.message : null,
  };
}
