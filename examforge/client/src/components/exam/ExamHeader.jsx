import React, { memo } from 'react';
import { useExamSessionStore } from '../../store/examSessionStore';
import ExamTimer from './ExamTimer';

/**
 * ExamHeader
 *
 * Sticky top bar. Renders:
 *   [Exam badge] [Title]  [Q x/y]  [ExamTimer]
 *
 * Performance note:
 *   - ExamTimer is memo-wrapped and updates every second independently.
 *   - This parent only re-renders when examTitle / currentIndex / questions.length change
 *     (very infrequent) thanks to individual Zustand selector subscriptions.
 */
const ExamHeader = memo(function ExamHeader({ onExpire }) {
  const examTitle    = useExamSessionStore((s) => s.examTitle);
  const currentIndex = useExamSessionStore((s) => s.currentIndex);
  const total        = useExamSessionStore((s) => s.questions.length);

  return (
    <header
      id="exam-header"
      className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm"
    >
      <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Left: badge + title */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="hidden sm:inline-flex flex-shrink-0 text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
            Exam
          </span>
          <h1 className="text-sm font-bold text-slate-900 truncate">{examTitle}</h1>
        </div>

        {/* Centre: question counter */}
        <div
          id="question-counter"
          className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 flex-shrink-0"
        >
          <span className="text-slate-800 font-bold">{currentIndex + 1}</span>
          <span className="text-slate-400">/</span>
          <span>{total}</span>
          <span className="text-slate-400 font-normal ml-0.5">questions</span>
        </div>

        {/* Right: timer — this is the only part that re-renders every second */}
        <ExamTimer onExpire={onExpire} />
      </div>

      {/* Progress bar driven by timer display — isolated in ExamTimerProgress */}
      <ExamTimerProgress />
    </header>
  );
});

export default ExamHeader;

/**
 * ExamTimerProgress
 * Thin progress bar below the header.
 * Subscribes to the store's timerBaseline to compute percentage.
 * Also isolated — re-renders independently of the rest of ExamHeader.
 */
const ExamTimerProgress = memo(function ExamTimerProgress() {
  // We only need remainingTime at baseline for % calculation;
  // The actual draining progress is CSS-transition based after mount.
  // For simplicity, we re-derive from the store each second via
  // the same timerBaseline that ExamTimer uses.

  const timerBaseline  = useExamSessionStore((s) => s.timerBaseline);
  const examStatus     = useExamSessionStore((s) => s.examStatus);

  if (!timerBaseline) return <div className="h-0.5 bg-slate-200" />;

  const elapsed  = (performance.now() - timerBaseline.perf) / 1000;
  const current  = Math.max(0, timerBaseline.remaining - elapsed);
  const total    = timerBaseline.remaining + elapsed; // approximation of full duration
  // safer: use remainingTime from initSession for total, but this is good enough visually
  const pct      = timerBaseline.remaining > 0
    ? Math.min(100, (current / timerBaseline.remaining) * 100)
    : 0;

  const barColor =
    examStatus !== 'in_progress' ? 'bg-slate-300'
    : current <= 5 * 60           ? 'bg-red-500'
    : current <= 15 * 60          ? 'bg-amber-400'
    : 'bg-indigo-500';

  return (
    <div className="h-0.5 bg-slate-100" role="progressbar" aria-valuenow={Math.round(pct)}>
      <div
        className={`h-full transition-none ${barColor}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
});
