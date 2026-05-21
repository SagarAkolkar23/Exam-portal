import React, { memo, useCallback } from 'react';
import { useExamSessionStore } from '../../store/examSessionStore';
import { useAnswerPersistence } from '../../hooks/useAnswerPersistence';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

/**
 * QuestionCard
 *
 * Renders the current question. All answer writes go through
 * useAnswerPersistence which handles Zustand + localStorage sync.
 *
 * MCQ:         4 labeled option buttons (click to select, click again to clear)
 * Descriptive: textarea with live word count
 */
export default function QuestionCard() {
  const questions    = useExamSessionStore((s) => s.questions);
  const currentIndex = useExamSessionStore((s) => s.currentIndex);
  const answers      = useExamSessionStore((s) => s.answers);
  const isMarked     = useExamSessionStore((s) => s.isMarked);
  const examId       = useExamSessionStore((s) => s.examId);

  const { answerMcq, answerDescriptive, clearAnswer } = useAnswerPersistence(examId);

  const question = questions[currentIndex];
  if (!question) return null;

  const qId    = question._id;
  const ans    = answers[qId];
  const marked = isMarked(qId);

  return (
    <div
      id="question-card"
      className={`bg-white border rounded-2xl shadow-sm p-6 md:p-8 transition-all duration-200 animate-[fadeInUp_0.25s_ease-out]
        ${marked ? 'ring-2 ring-amber-400 border-amber-200' : 'border-slate-200'}`}
    >
      {/* ── Header row ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
            {currentIndex + 1}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {question.type === 'mcq' ? 'Multiple Choice' : 'Descriptive'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {marked && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-300">
              🔖 Marked
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
          </span>
        </div>
      </div>

      {/* ── Question text ────────────────────────────────────────────────── */}
      <p className="text-base md:text-lg font-medium text-slate-900 leading-relaxed mb-6">
        {question.text}
      </p>

      {/* ── Answer area ──────────────────────────────────────────────────── */}
      {question.type === 'mcq' ? (
        <McqOptions
          options={question.options}
          isMultiSelect={question.isMultiSelect}
          selected={ans?.selectedIndex ?? null}
          selectedIndices={ans?.selectedIndices ?? []}
          onSelect={(idx) => answerMcq(qId, idx)}
          onClear={() => clearAnswer(qId)}
        />
      ) : (
        <DescriptiveInput
          value={ans?.textAnswer ?? ''}
          onChange={(val) => answerDescriptive(qId, val)}
          onClear={() => clearAnswer(qId)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MCQ Options
// ─────────────────────────────────────────────────────────────────────────────
const McqOptions = memo(function McqOptions({ options, isMultiSelect, selected, selectedIndices, onSelect, onClear }) {
  const isAnySelected = isMultiSelect 
    ? (Array.isArray(selectedIndices) && selectedIndices.length > 0)
    : (selected !== null && selected !== undefined && selected !== -1);

  return (
    <div className="flex flex-col gap-3">
      {isMultiSelect && (
        <div className="flex items-center gap-2 bg-indigo-50/50 border border-indigo-100 rounded-xl px-4 py-2.5 mb-2">
          <svg className="w-4 h-4 text-indigo-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs text-indigo-700 font-semibold leading-relaxed">
            Multiple correct answers: you must select ALL correct options to score.
          </span>
        </div>
      )}
      {(options ?? []).map((opt, idx) => {
        const isSelected = isMultiSelect 
          ? (Array.isArray(selectedIndices) && selectedIndices.includes(idx))
          : (selected === idx);
        return (
          <button
            key={idx}
            id={`mcq-option-${idx}`}
            onClick={() => onSelect(idx)}
            aria-pressed={isSelected}
            className={`
              group flex items-center gap-4 w-full text-left px-4 py-3.5 rounded-xl border
              text-sm font-medium transition-all duration-150
              ${isSelected
                ? 'bg-indigo-50 border-indigo-400 text-indigo-900 ring-2 ring-indigo-300/40'
                : 'bg-white border-slate-200 text-slate-800 hover:border-indigo-300 hover:bg-indigo-50/40'}
            `}
          >
            {/* Label box / circle */}
            <span
              className={`
                flex-shrink-0 w-7 h-7 flex items-center justify-center
                text-xs font-bold border transition-colors duration-150
                ${isMultiSelect ? 'rounded-md' : 'rounded-full'}
                ${isSelected
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-slate-100 border-slate-300 text-slate-500 group-hover:border-indigo-400'}
              `}
            >
              {OPTION_LABELS[idx]}
            </span>

            <span className="flex-1">{opt}</span>

            {isSelected && (
              <span className="text-indigo-600 text-base font-bold" aria-hidden="true">✓</span>
            )}
          </button>
        );
      })}

      {isAnySelected && (
        <button
          id="mcq-clear-btn"
          onClick={onClear}
          className="self-end text-xs text-slate-400 hover:text-red-500 underline mt-1 transition-colors"
        >
          Clear selection
        </button>
      )}
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Descriptive Input
// ─────────────────────────────────────────────────────────────────────────────
const DescriptiveInput = memo(function DescriptiveInput({ value, onChange, onClear }) {
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col gap-2">
      <textarea
        id="descriptive-answer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={8}
        placeholder="Write your answer here…"
        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm leading-relaxed outline-none resize-y
                   focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 placeholder:text-slate-400 transition-all"
        aria-label="Your answer"
      />
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
        {value.trim().length > 0 && (
          <button
            id="descriptive-clear-btn"
            onClick={onClear}
            className="text-red-400 hover:text-red-600 hover:underline transition-colors"
          >
            Clear answer
          </button>
        )}
      </div>
    </div>
  );
});
