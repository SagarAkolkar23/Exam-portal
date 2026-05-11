import { useEffect, useRef, useCallback } from 'react';
import { useProctorEvent } from '../api/queries';

/**
 * Anti-cheat hook for ExamAttempt page.
 * Implements fullscreen lock, tab/window switch detection, right-click block,
 * copy/paste block, devtools heuristic detection, and Socket.io event emission.
 *
 * @param {string} examId
 * @param {string} studentId
 * @param {string} submissionId
 * @param {object} options
 * @param {Function} options.onFullscreenExit - Called when fullscreen is exited
 * @param {Function} options.onTabSwitch - Called on tab/window switch
 * @param {boolean} options.enabled - Whether proctoring is active
 */
export function useProctor(examId, studentId, submissionId, { onFullscreenExit, onTabSwitch, enabled = false } = {}) {
  const lastEventTimeRef = useRef({}); // debounce tracker
  const devtoolsFiredRef = useRef(false);
  const devtoolsIntervalRef = useRef(null);
  const { mutateAsync: sendProctorEvent } = useProctorEvent();

  // ── Debounce helper ─────────────────────────────────────────────────────────
  const debounceEvent = useCallback((type, ms = 500) => {
    const now = Date.now();
    const last = lastEventTimeRef.current[type] || 0;
    if (now - last < ms) return false;
    lastEventTimeRef.current[type] = now;
    return true;
  }, []);

  // ── Send event (HTTP + Socket) ───────────────────────────────────────────────
  const sendEvent = useCallback(
    async (type, metadata = {}) => {
      if (!enabled || !examId || !studentId) return;

      const payload = { examId, studentId, type, timestamp: new Date().toISOString(), metadata };

      // HTTP save
      try {
        await sendProctorEvent({ examId, type, metadata });
      } catch (err) {
        console.warn('[Proctor] HTTP event save failed:', err.message);
      }
    },
    [enabled, examId, studentId, sendProctorEvent]
  );

  // ── Fullscreen Lock ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        if (debounceEvent('fullscreen_exit')) {
          sendEvent('fullscreen_exit');
          onFullscreenExit && onFullscreenExit();

          // Attempt to re-enter fullscreen
          setTimeout(() => {
            document.documentElement.requestFullscreen().catch(() => {});
          }, 100);
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [enabled, sendEvent, onFullscreenExit, debounceEvent]);

  // ── Tab / Visibility Switch ──────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden && debounceEvent('tab_switch')) {
        sendEvent('tab_switch');
        onTabSwitch && onTabSwitch();
      }
    };

    const handleWindowBlur = () => {
      if (debounceEvent('window_blur')) {
        sendEvent('window_blur');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [enabled, sendEvent, onTabSwitch, debounceEvent]);

  // ── Right-click Block ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const handleContextMenu = (e) => {
      e.preventDefault();
      if (debounceEvent('context_menu')) {
        sendEvent('context_menu');
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, [enabled, sendEvent, debounceEvent]);

  // ── Copy/Paste Block ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const handleCopy = (e) => {
      e.preventDefault();
      if (debounceEvent('copy_attempt')) {
        sendEvent('copy_attempt');
      }
    };

    const blockEvent = (e) => e.preventDefault();

    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', blockEvent);
    document.addEventListener('paste', blockEvent);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', blockEvent);
      document.removeEventListener('paste', blockEvent);
    };
  }, [enabled, sendEvent, debounceEvent]);

  // ── DevTools Detection ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    devtoolsIntervalRef.current = setInterval(() => {
      if (devtoolsFiredRef.current) return;
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      if (widthDiff > 160 || heightDiff > 160) {
        devtoolsFiredRef.current = true;
        sendEvent('devtools_open');
      }
    }, 4000);

    return () => {
      clearInterval(devtoolsIntervalRef.current);
    };
  }, [enabled, sendEvent]);

  // ── Cleanup on unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      devtoolsFiredRef.current = false;
      clearInterval(devtoolsIntervalRef.current);
    };
  }, []);

  return { sendEvent };
}

export default useProctor;
