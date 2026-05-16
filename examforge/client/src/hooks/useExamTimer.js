import { useState, useEffect, useRef, useCallback } from 'react';
import { useExamSessionStore } from '../store/examSessionStore';

/**
 * useExamTimer
 *
 * Production-grade exam countdown timer.
 *
 * Design principles:
 *  • NEVER uses Date.now() for elapsed calculation
 *  • NEVER blindly decrements local state via setInterval alone
 *  • Uses performance.now() which is monotonic (immune to:
 *      - device clock changes
 *      - timezone changes
 *      - NTP adjustments
 *      - DST transitions)
 *  • Backend remainingTime is the single source of truth.
 *  • On every heartbeat, timerBaseline is re-anchored so drift
 *    corrects itself every 30 seconds automatically.
 *  • Only this hook + the <ExamTimer /> component re-render every second.
 *    The rest of the exam page is unaffected.
 *
 * @param {() => void} onExpire - Called exactly once when time reaches 0
 * @returns {{ displaySeconds: number, isRunning: boolean }}
 */
export function useExamTimer(onExpire) {
  const timerBaseline = useExamSessionStore((s) => s.timerBaseline);
  const examStatus    = useExamSessionStore((s) => s.examStatus);
  const submitted     = useExamSessionStore((s) => s.submitted);

  // Local display value — only this piece of state drives the UI
  const [displaySeconds, setDisplaySeconds] = useState(() => {
    if (!timerBaseline) return 0;
    const elapsed = (performance.now() - timerBaseline.perf) / 1000;
    return Math.max(0, Math.floor(timerBaseline.remaining - elapsed));
  });

  const onExpireRef = useRef(onExpire);
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  const hasExpiredRef = useRef(false);
  const rafRef        = useRef(null);

  // isRunning: timer ticks only when exam is in_progress and not submitted
  const isRunning =
    !submitted &&
    examStatus === 'in_progress' &&
    timerBaseline !== null;

  // Re-sync display when baseline changes (heartbeat correction)
  useEffect(() => {
    if (!timerBaseline) return;
    const elapsed = (performance.now() - timerBaseline.perf) / 1000;
    const corrected = Math.max(0, Math.floor(timerBaseline.remaining - elapsed));
    setDisplaySeconds(corrected);

    // If we got a new baseline and time was already 0 — we still expire
    if (corrected === 0 && !hasExpiredRef.current) {
      hasExpiredRef.current = true;
      onExpireRef.current?.();
    }
  }, [timerBaseline]);

  // rAF loop — runs every ~16ms but only updates state at 1-second boundaries
  useEffect(() => {
    if (!isRunning) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    let lastDisplayed = displaySeconds;

    const tick = () => {
      if (!timerBaseline) return;

      const elapsedMs = performance.now() - timerBaseline.perf;
      const current   = Math.max(0, Math.floor(timerBaseline.remaining - elapsedMs / 1000));

      // Only call setState when the integer second changes → 1 re-render/sec
      if (current !== lastDisplayed) {
        lastDisplayed = current;
        setDisplaySeconds(current);

        if (current === 0 && !hasExpiredRef.current) {
          hasExpiredRef.current = true;
          onExpireRef.current?.();
          return; // stop RAF
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // timerBaseline is intentionally in deps — RAF restarts on each heartbeat sync
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, timerBaseline]);

  // Reset expired flag when a new session starts
  useEffect(() => {
    if (timerBaseline && timerBaseline.remaining > 0) {
      hasExpiredRef.current = false;
    }
  }, [timerBaseline]);

  return { displaySeconds, isRunning };
}
