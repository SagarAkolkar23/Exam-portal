import React, { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

/**
 * ExamResult
 *
 * Route: /exam/:examId/result
 * Receives data via router location.state.result (from submitExam response).
 *
 * Two modes:
 *  1. result present → full breakdown (score, stats, per-question review)
 *  2. result absent  → "results hidden" screen (submitted: true, no result)
 */
export default function ExamResult() {
  const { examId } = useParams();
  const navigate   = useNavigate();
  const location   = useLocation();

  const { result, message } = location.state ?? {};

  // ── Results hidden by teacher ────────────────────────────────────────────
  if (!result) {
    return <HiddenResult message={message} onBack={() => navigate('/student/join')} />;
  }

  return <FullResult result={result} message={message} onBack={() => navigate('/student/join')} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hidden result screen
// ─────────────────────────────────────────────────────────────────────────────
function HiddenResult({ message, onBack }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-3xl mx-auto mb-5">
          🎓
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Exam Submitted!</h1>
        <p className="text-sm text-slate-500 mb-1">
          {message ?? 'Your exam has been submitted successfully.'}
        </p>
        <p className="text-sm text-slate-400 mb-8">
          Results will be released by your examiner.
        </p>
        <button onClick={onBack} className="btn btn-primary w-full justify-center">
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Full result with breakdown
// ─────────────────────────────────────────────────────────────────────────────
function FullResult({ result, message, onBack }) {
  const {
    score,
    totalMarks,
    percentage,
    correctAnswers,
    wrongAnswers,
    unanswered,
    submittedAt,
    status,
    correctQuestions   = [],
    incorrectQuestions = [],
    unansweredQuestions = [],
  } = result;

  const isAutoSubmit = status === 'auto_submitted';

  const grade = useMemo(() => {
    if (percentage >= 90) return { label: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (percentage >= 75) return { label: 'Good',      color: 'text-indigo-600',  bg: 'bg-indigo-50'  };
    if (percentage >= 50) return { label: 'Average',   color: 'text-amber-600',   bg: 'bg-amber-50'   };
    return                       { label: 'Below Average', color: 'text-red-600', bg: 'bg-red-50'    };
  }, [percentage]);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* ── Header card ──────────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Coloured top stripe */}
          <div className={`h-2 w-full ${percentage >= 50 ? 'bg-gradient-to-r from-indigo-500 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-orange-400'}`} />

          <div className="p-8 text-center">
            {isAutoSubmit && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-300 mb-4">
                ⏰ Auto-submitted (time expired)
              </div>
            )}

            {/* Score circle */}
            <div className={`relative w-32 h-32 mx-auto mb-5`}>
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none"
                  stroke={percentage >= 50 ? '#4f46e5' : '#ef4444'}
                  strokeWidth="3"
                  strokeDasharray={`${percentage} ${100 - percentage}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-slate-900">{score}</span>
                <span className="text-xs text-slate-400 font-medium">/{totalMarks}</span>
              </div>
            </div>

            <p className={`text-4xl font-extrabold mb-1 ${grade.color}`}>{percentage}%</p>
            <span className={`inline-block px-3 py-0.5 rounded-full text-sm font-semibold ${grade.bg} ${grade.color} border border-current/20`}>
              {grade.label}
            </span>

            <p className="text-xs text-slate-400 mt-4">
              Submitted {submittedAt ? new Date(submittedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
            </p>
          </div>
        </div>

        {/* ── Stats row ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Correct"   value={correctAnswers}   color="emerald" icon="✓" />
          <StatCard label="Wrong"     value={wrongAnswers}     color="red"     icon="✕" />
          <StatCard label="Skipped"   value={unanswered}       color="slate"   icon="—" />
        </div>

        {/* ── Question review ───────────────────────────────────────────────── */}
        {(correctQuestions.length > 0 || incorrectQuestions.length > 0 || unansweredQuestions.length > 0) && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">
              Question Review
            </h2>

            {correctQuestions.map((q, i) => (
              <QuestionReviewCard key={q.questionId ?? i} q={q} status="correct" index={i} />
            ))}

            {incorrectQuestions.map((q, i) => (
              <QuestionReviewCard key={q.questionId ?? i} q={q} status="incorrect" index={correctQuestions.length + i} />
            ))}

            {unansweredQuestions.map((q, i) => (
              <QuestionReviewCard key={q.questionId ?? i} q={q} status="unanswered" index={correctQuestions.length + incorrectQuestions.length + i} />
            ))}
          </div>
        )}

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div className="flex justify-center pt-2 pb-8">
          <button onClick={onBack} className="btn btn-primary btn-lg px-10">
            Back to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat card
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon }) {
  const palette = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: 'bg-emerald-100 text-emerald-600' },
    red:     { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     icon: 'bg-red-100    text-red-600'    },
    slate:   { bg: 'bg-slate-50',   text: 'text-slate-700',   border: 'border-slate-200',   icon: 'bg-slate-100  text-slate-500'  },
  };
  const p = palette[color] ?? palette.slate;

  return (
    <div className={`${p.bg} ${p.border} border rounded-2xl p-5 flex flex-col items-center gap-2`}>
      <span className={`w-8 h-8 rounded-full ${p.icon} flex items-center justify-center text-sm font-bold`}>
        {icon}
      </span>
      <span className={`text-3xl font-extrabold ${p.text}`}>{value}</span>
      <span className="text-xs font-medium text-slate-500">{label}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-question review card
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  correct:    { border: 'border-emerald-300', bg: 'bg-emerald-50/60', badge: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: '✓', iconBg: 'bg-emerald-500',   label: 'Correct'   },
  incorrect:  { border: 'border-red-300',     bg: 'bg-red-50/60',     badge: 'bg-red-100    text-red-700    border-red-300',       icon: '✕', iconBg: 'bg-red-500',       label: 'Incorrect' },
  unanswered: { border: 'border-slate-200',   bg: 'bg-white',         badge: 'bg-slate-100  text-slate-600  border-slate-200',     icon: '—', iconBg: 'bg-slate-400',     label: 'Skipped'   },
};

function QuestionReviewCard({ q, status, index }) {
  const cfg = STATUS_CONFIG[status];

  return (
    <div
      id={`review-q-${index + 1}`}
      className={`border ${cfg.border} ${cfg.bg} rounded-2xl p-5 space-y-3 transition-all`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`flex-shrink-0 w-7 h-7 rounded-full ${cfg.iconBg} text-white text-xs font-bold flex items-center justify-center`}>
            {cfg.icon}
          </span>
          <span className="text-xs font-semibold text-slate-500">Q{index + 1}</span>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.badge}`}>
          {cfg.label}
          {status === 'correct' && q.marksAwarded != null && (
            <span className="ml-1 opacity-70">+{q.marksAwarded}</span>
          )}
        </span>
      </div>

      {/* Question text */}
      <p className="text-sm font-medium text-slate-800 leading-relaxed">
        {q.question}
      </p>

      {/* MCQ answer detail */}
      {(q.selectedOption || q.correctOption) && (
        <div className="space-y-1.5">
          {status !== 'unanswered' && q.selectedOption && (
            <AnswerRow
              label="Your answer"
              value={q.selectedOption}
              variant={status === 'correct' ? 'correct' : 'wrong'}
            />
          )}
          {status === 'incorrect' && q.correctOption && (
            <AnswerRow
              label="Correct answer"
              value={q.correctOption}
              variant="correct"
            />
          )}
        </div>
      )}

      {/* Explanation */}
      {status === 'incorrect' && q.explanation && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-800 leading-relaxed">
          <span className="font-semibold">Explanation: </span>
          {q.explanation}
        </div>
      )}
    </div>
  );
}

function AnswerRow({ label, value, variant }) {
  const cls = variant === 'correct'
    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
    : 'bg-red-50 border-red-200 text-red-800';

  return (
    <div className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-xs ${cls}`}>
      <span className="font-semibold flex-shrink-0">{label}:</span>
      <span>{value}</span>
    </div>
  );
}
