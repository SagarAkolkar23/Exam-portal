import React from 'react';
import { useExamSessionStore } from '../../store/examSessionStore';
import QuestionGrid from './QuestionGrid';

/**
 * ExamSidebar
 * Right sidebar (desktop) / bottom sheet toggle (mobile):
 *   - Summary stats (Attempted / Marked / Remaining)
 *   - Question palette (QuestionGrid)
 *   - Submit button shortcut
 */
export default function ExamSidebar({ onSubmit, onSelect }) {
  const { getStats } = useExamSessionStore();
  const { total, attempted, remaining, marked } = getStats();

  return (
    <aside
      id="exam-sidebar"
      className="hidden lg:flex flex-col gap-5 w-64 xl:w-72 flex-shrink-0"
    >
      {/* Stats cards */}
      <div className="card p-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-3">
          Progress
        </h2>
        <div className="grid grid-cols-3 gap-2">
          <StatPill
            id="stat-attempted"
            label="Done"
            value={attempted}
            color="text-primary"
            bg="bg-primary-bg"
          />
          <StatPill
            id="stat-marked"
            label="Marked"
            value={marked}
            color="text-amber-600"
            bg="bg-amber-50"
          />
          <StatPill
            id="stat-remaining"
            label="Left"
            value={remaining}
            color="text-ink-dim"
            bg="bg-slate-50"
          />
        </div>
      </div>

      {/* Legend */}
      <div className="card p-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-3">
          Legend
        </h2>
        <div className="flex flex-col gap-2">
          <LegendItem color="bg-primary" label="Attempted" />
          <LegendItem color="bg-amber-400" label="Marked for Review" />
          <LegendItem color="bg-amber-500" label="Attempted + Marked" showCheck />
          <LegendItem color="bg-white border border-slate-300" label="Not Attempted" />
        </div>
      </div>

      {/* Palette */}
      <div className="card p-4 flex-1">
        <h2 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-3">
          Questions
        </h2>
        <QuestionGrid onSelect={onSelect} />
      </div>

      {/* Submit */}
      <button
        id="sidebar-submit-btn"
        onClick={onSubmit}
        className="btn btn-primary btn-lg w-full justify-center"
      >
        Submit Exam
      </button>
    </aside>
  );
}

function StatPill({ id, label, value, color, bg }) {
  return (
    <div id={id} className={`${bg} rounded-lg p-2.5 text-center`}>
      <p className={`text-xl font-extrabold ${color} leading-none`}>{value}</p>
      <p className="text-[10px] text-ink-muted mt-1 font-medium">{label}</p>
    </div>
  );
}

function LegendItem({ color, label, showCheck }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`relative w-6 h-6 rounded-md flex-shrink-0 ${color} flex items-center justify-center`}>
        {showCheck && <span className="text-white text-[9px] font-bold">✓</span>}
      </span>
      <span className="text-xs text-ink-dim font-medium">{label}</span>
    </div>
  );
}
