/**
 * formatTime
 * Converts total seconds into a zero-padded HH:MM:SS string.
 *
 * @param {number} totalSeconds - Non-negative integer seconds
 * @returns {string} e.g. "01:23:45"
 */
export function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  const pad = (n) => String(n).padStart(2, '0');

  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

/**
 * getTimerVariant
 * Returns a semantic variant string based on remaining seconds.
 *
 * @param {number} seconds
 * @returns {'normal' | 'warning' | 'danger' | 'expired'}
 */
export function getTimerVariant(seconds) {
  if (seconds <= 0) return 'expired';
  if (seconds <= 5 * 60) return 'danger';    // < 5 min → red
  if (seconds <= 15 * 60) return 'warning';  // < 15 min → yellow
  return 'normal';
}
