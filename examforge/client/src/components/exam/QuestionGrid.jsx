import React from 'react';
import { useExamSessionStore } from '../../store/examSessionStore';

/**
 * QuestionGrid
 * Palette of numbered question bubbles.
 * Color legend:
 *   • Indigo filled  = attempted
 *   • Amber filled   = marked for review
 *   • Amber+check    = attempted & marked
 *   • White/slate    = not attempted (remaining)
 *   • Ring           = currently viewed
 */
export default function QuestionGrid({ onSelect }) {
  const { questions, currentIndex, answers, markedIds, isAttempted, isMarked } =
    useExamSessionStore();

  return (
    <div id="question-grid" className="flex flex-wrap gap-2">
      {questions.map((q, idx) => {
        const attempted = isAttempted(q._id);
        const marked = isMarked(q._id);
        const active = idx === currentIndex;

        return (
          <QuestionBubble
            key={q._id}
            number={idx + 1}
            attempted={attempted}
            marked={marked}
            active={active}
            onClick={() => onSelect(idx)}
          />
        );
      })}
    </div>
  );
}

function QuestionBubble({ number, attempted, marked, active, onClick }) {
  // Priority: active ring > marked+attempted > marked only > attempted > remaining
  let bg = 'bg-white border-line text-ink-dim';
  let icon = null;

  if (attempted && marked) {
    bg = 'bg-amber-500 border-amber-500 text-white';
    icon = '✓';
  } else if (marked) {
    bg = 'bg-amber-100 border-amber-400 text-amber-700';
  } else if (attempted) {
    bg = 'bg-primary border-primary text-white';
  }

  const ring = active
    ? 'ring-2 ring-offset-1 ring-primary scale-110'
    : 'hover:scale-105 hover:border-primary/60';

  return (
    <button
      id={`q-bubble-${number}`}
      onClick={onClick}
      aria-label={`Question ${number}${attempted ? ', answered' : ''}${marked ? ', marked' : ''}`}
      aria-current={active ? 'true' : undefined}
      className={`
        relative w-9 h-9 rounded-lg text-xs font-bold border transition-all duration-150
        ${bg} ${ring} select-none
      `}
    >
      {number}
      {icon && (
        <span className="absolute -top-1 -right-1 text-[9px] bg-white text-amber-600 rounded-full w-3.5 h-3.5 flex items-center justify-center border border-amber-400 font-bold">
          {icon}
        </span>
      )}
    </button>
  );
}
