import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Countdown timer hook.
 *
 * @param {number} durationSeconds - Total duration in seconds
 * @param {Function} onExpire - Callback when timer hits 0
 * @param {boolean} enabled - Whether the timer is running
 *
 * @returns {{
 *   timeLeft: number,
 *   formattedTime: string,
 *   isExpired: boolean,
 *   isWarning: boolean,  // true when <= 5 minutes left
 *   percentLeft: number,
 * }}
 */
function useExamTimer(durationSeconds, onExpire, enabled = false) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef(null);
  const hasExpiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  // Keep callback ref up to date without re-triggering effect
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    setTimeLeft(durationSeconds);
    setIsExpired(false);
    hasExpiredRef.current = false;
  }, [durationSeconds]);

  useEffect(() => {
    if (!enabled) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          if (!hasExpiredRef.current) {
            hasExpiredRef.current = true;
            setIsExpired(true);
            onExpireRef.current && onExpireRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [enabled]);

  const formatTime = useCallback((seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, []);

  return {
    timeLeft,
    formattedTime: formatTime(timeLeft),
    isExpired,
    isWarning: timeLeft <= 300 && timeLeft > 0, // last 5 minutes
    percentLeft: durationSeconds > 0 ? (timeLeft / durationSeconds) * 100 : 0,
  };
}

export default useExamTimer;
