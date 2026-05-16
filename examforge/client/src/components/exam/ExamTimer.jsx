import React, { memo } from 'react';
import { useExamTimer } from '../../hooks/useExamTimer';
import { formatTime, getTimerVariant } from '../../utils/formatTime';

/**
 * ExamTimer
 *
 * Fully isolated, memo-wrapped component.
 * Only this component + its internal hook re-render every second.
 * The rest of the exam page tree is unaffected.
 *
 * Visual states:
 *   normal  → indigo/primary
 *   warning → amber  (< 15 min)
 *   danger  → red    (< 5 min)
 *   expired → red + pulse + "Time's up!"
 *
 * @param {{ onExpire: () => void }} props
 */
const ExamTimer = memo(function ExamTimer({ onExpire }) {
  const { displaySeconds, isRunning } = useExamTimer(onExpire);

  const variant = getTimerVariant(displaySeconds);
  const timeStr = formatTime(displaySeconds);

  return (
    <div
      id="exam-timer"
      role="timer"
      aria-live="polite"
      aria-label={`Time remaining: ${timeStr}`}
      className={timerClass(variant, isRunning)}
    >
      {/* Clock icon */}
      <span className="text-base leading-none" aria-hidden="true">
        {variant === 'expired' ? '⏰' : '⏱'}
      </span>

      {/* HH:MM:SS — tabular-nums prevents layout shift */}
      <span className="font-mono tabular-nums tracking-widest text-base font-bold">
        {variant === 'expired' ? '00:00:00' : timeStr}
      </span>

      {/* Contextual label */}
      {variant === 'warning' && (
        <span className="text-[11px] font-semibold opacity-80 hidden sm:inline">
          Hurry up!
        </span>
      )}
      {variant === 'danger' && (
        <span className="text-[11px] font-semibold opacity-90 hidden sm:inline animate-pulse">
          Last 5 min!
        </span>
      )}
      {variant === 'expired' && (
        <span className="text-[11px] font-semibold animate-pulse">
          Time&apos;s up!
        </span>
      )}
    </div>
  );
});

export default ExamTimer;

// ── Style helpers ─────────────────────────────────────────────────────────────
const VARIANT_CLASSES = {
  normal:  'bg-indigo-50  border-indigo-300 text-indigo-700',
  warning: 'bg-amber-50   border-amber-400  text-amber-700',
  danger:  'bg-red-50     border-red-400    text-red-600',
  expired: 'bg-red-100    border-red-500    text-red-700 animate-pulse',
};

function timerClass(variant, isRunning) {
  const base =
    'flex items-center gap-2 px-3.5 py-1.5 rounded-full border ' +
    'text-sm font-semibold whitespace-nowrap transition-colors duration-500 select-none';

  const variantCls = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.normal;

  // dim when not yet running (waiting for session to init)
  const runningCls = !isRunning && variant !== 'expired' ? 'opacity-50' : '';

  return `${base} ${variantCls} ${runningCls}`.trim();
}
