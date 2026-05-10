import React from 'react';

function Timer({ formattedTime, isWarning, isExpired }) {
  const base = 'flex items-center gap-2 px-4 py-2 rounded-full font-bold text-base border transition-all duration-200 whitespace-nowrap';
  const variant = isExpired
    ? 'border-danger bg-danger/10 text-danger'
    : isWarning
      ? 'border-warn bg-warn/10 text-warn animate-[timerPulse_1s_ease-in-out_infinite]'
      : 'border-line bg-card text-ink';

  return (
    <div id="exam-timer" role="timer" aria-live="polite"
      aria-label={`Time remaining: ${formattedTime}`}
      className={`${base} ${variant}`}>
      <span>{isExpired ? '⏰' : '⏱'}</span>
      <span className="tabular-nums text-lg tracking-wide">
        {isExpired ? '00:00' : formattedTime}
      </span>
      {isWarning && !isExpired && (
        <span className="text-xs font-medium opacity-80">Time running out!</span>
      )}
      {isExpired && (
        <span className="text-xs font-medium opacity-80">Time's up!</span>
      )}
    </div>
  );
}

export default Timer;
