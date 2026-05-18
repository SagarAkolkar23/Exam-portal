import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../utils/helpers';

const STATUS_CONFIG = {
  draft:     { label: 'Draft',     cls: 'badge-draft',     dot: '' },
  scheduled: { label: 'Scheduled', cls: 'badge-scheduled', dot: '' },
  live:      { label: 'Live',      cls: 'badge-live',      dot: 'animate-pulse' },
  ended:     { label: 'Completed', cls: 'badge-ended',     dot: '' },
};

function ExamCard({ exam, onEnd, liveViolationCount = 0 }) {
  const navigate = useNavigate();
  const status = STATUS_CONFIG[exam.status] || STATUS_CONFIG.draft;

  const mcqCount  = (exam.questions || []).filter((q) => (q.type || 'mcq') === 'mcq').length;
  const descCount = (exam.questions || []).filter((q) => q.type === 'descriptive').length;

  const [isCopied, setIsCopied] = React.useState(false);

  const handleCopyCode = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(exam.accessCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div
      onClick={() => navigate(`/teacher/exams/${exam._id}`)}
      className="card p-5 cursor-pointer flex flex-col gap-4 hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
    >
      {/* ── Header row ── */}
      <div className="flex items-center justify-between">
        <span className={`badge ${status.cls} flex items-center gap-1.5`}>
          {exam.status === 'live' && (
            <span className={`w-1.5 h-1.5 rounded-full bg-indigo-500 ${status.dot}`} />
          )}
          {status.label}
        </span>
        <button 
          onClick={handleCopyCode}
          title="Click to copy access code"
          className="font-mono text-[11px] font-semibold flex items-center gap-1 text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md uppercase tracking-widest hover:bg-slate-100 hover:text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {isCopied ? (
            <span className="text-emerald-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied
            </span>
          ) : (
            <>
              {exam.accessCode}
              <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </>
          )}
        </button>
      </div>

      {/* ── Title ── */}
      <div>
        <h3 className="text-base font-bold text-ink leading-tight mb-1 group-hover:text-primary transition-colors duration-150">
          {exam.title}
        </h3>
        {exam.description && (
          <p className="text-sm text-ink-muted line-clamp-2 leading-relaxed">
            {exam.description}
          </p>
        )}
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-3 gap-2 py-3 border-y border-line text-center">
        <div className="flex flex-col">
          <span className="text-lg font-bold text-ink">{exam.questions?.length || 0}</span>
          <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Qs</span>
        </div>
        <div className="flex flex-col border-x border-line">
          <span className="text-lg font-bold text-ink">{exam.duration}</span>
          <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Mins</span>
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold text-ink">{exam.assignedStudents?.length || 0}</span>
          <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Students</span>
        </div>
      </div>

      {/* ── Question type chips ── */}
      {(mcqCount > 0 || descCount > 0) && (
        <div className="flex items-center gap-2 flex-wrap">
          {mcqCount > 0 && (
            <span className="text-[10px] font-bold text-primary bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
              {mcqCount} MCQ
            </span>
          )}
          {descCount > 0 && (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
              {descCount} Descriptive
            </span>
          )}
          {exam.totalMarks > 0 && (
            <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full uppercase tracking-wide ml-auto">
              {exam.totalMarks} marks
            </span>
          )}
        </div>
      )}

      {/* ── Live violation alert ── */}
      {exam.status === 'live' && liveViolationCount > 0 && (
        <div className="flex items-center gap-2 text-xs font-semibold text-danger bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {liveViolationCount} violation{liveViolationCount !== 1 ? 's' : ''} detected
        </div>
      )}

      {/* ── Footer: schedule + actions ── */}
      <div className="flex items-center justify-between mt-auto">
        <div className="text-xs text-ink-muted">
          {exam.scheduledStart ? (
            <>
              {exam.status === 'ended' ? 'Ended' : 'Starts'}{' '}
              <span className="font-medium text-ink-dim">{formatDate(exam.scheduledStart)}</span>
            </>
          ) : (
            <span className="text-slate-300">No schedule set</span>
          )}
        </div>

        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {exam.status === 'draft' && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate(`/teacher/exams/${exam._id}/edit`)}
            >
              Edit
            </button>
          )}
          {(exam.status === 'ended' || exam.status === 'live') && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate(`/teacher/exams/${exam._id}`)}
            >
              Results
            </button>
          )}
          {exam.status === 'live' && (
            <button
              className="btn btn-danger btn-sm"
              onClick={() => onEnd && onEnd(exam._id)}
            >
              End
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExamCard;
