import React from 'react';
import { useExamSessionStore } from '../../store/examSessionStore';

/**
 * NavigationBar
 * Bottom bar: Previous · Mark for Review · Next · Submit
 */
export default function NavigationBar({ onSubmit }) {
  const {
    currentIndex,
    questions,
    goPrev,
    goNext,
    toggleMark,
    isMarked,
    isAttempted,
  } = useExamSessionStore();

  const total = questions.length;
  const q = questions[currentIndex];
  if (!q) return null;

  const qId = q._id;
  const marked = isMarked(qId);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === total - 1;

  return (
    <div
      id="nav-bar"
      className="sticky bottom-0 z-20 bg-white border-t border-line shadow-[0_-2px_8px_rgba(0,0,0,0.06)]"
    >
      <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Previous */}
        <button
          id="btn-prev"
          onClick={goPrev}
          disabled={isFirst}
          className="btn btn-secondary gap-1.5"
          aria-label="Previous question"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Centre group */}
        <div className="flex items-center gap-2">
          {/* Mark for Review */}
          <button
            id="btn-mark"
            onClick={() => toggleMark(qId)}
            className={`btn gap-1.5 transition-all duration-200 ${
              marked
                ? 'bg-amber-500 border-amber-500 text-white hover:bg-amber-600'
                : 'btn-secondary text-amber-600 border-amber-300 hover:bg-amber-50 hover:border-amber-400'
            }`}
            aria-pressed={marked}
            aria-label={marked ? 'Unmark question' : 'Mark for review'}
          >
            <span aria-hidden="true">{marked ? '🔖' : '🏳️'}</span>
            <span className="text-xs font-semibold hidden sm:inline">
              {marked ? 'Marked' : 'Mark'}
            </span>
          </button>
        </div>

        {/* Right group: Next or Submit */}
        {isLast ? (
          <button
            id="btn-submit"
            onClick={onSubmit}
            className="btn btn-primary gap-1.5"
            aria-label="Submit exam"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Submit Exam
          </button>
        ) : (
          <button
            id="btn-next"
            onClick={goNext}
            className="btn btn-primary gap-1.5"
            aria-label="Next question"
          >
            <span className="hidden sm:inline">Next</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
