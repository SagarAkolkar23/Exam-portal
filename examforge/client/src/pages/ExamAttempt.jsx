import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAttemptStore } from '../store/attemptStore';

const formatDate = (iso) => {
  if (!iso) return '—';

  return new Date(iso).toLocaleString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const formatDuration = (minutes) => {
  if (!minutes) return '—';

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;

  return `${h} hr ${m} min`;
};

const DEFAULT_RULES = [
  'Do not refresh or close the browser tab during the exam.',
  'Ensure a stable internet connection before starting.',
  'Each question must be answered before moving to the next.',
  'Tab switching or window changes may be flagged.',
  'Submitting the exam is final and cannot be undone.',
];

export default function ExamAttempt() {
  const location = useLocation();
  const navigate = useNavigate();

  const [agreed, setAgreed] = useState(false);

  const examData = location.state?.examData;
  const exam = examData?.exam;
  const setExamId = useAttemptStore((state) => state.setExamId);


  
  if (!exam) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-zinc-50 px-4">
        <p className="text-sm text-zinc-500 text-center">
          No exam data found. Please go back and join again.
        </p>

        <button
          onClick={() => navigate(-1)}
          className="border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 transition"
        >
          ← Go Back
        </button>
      </div>
    );
  }

  const rules =
    Array.isArray(exam.rules) && exam.rules.length > 0
      ? exam.rules
      : DEFAULT_RULES;

  const handleStart = () => {
    setExamId(exam._id);
    navigate(`/exam/${exam._id}/attempt`, {
      state: { examData },
    });
  };

  return (
    <div className="min-h-screen bg-zinc-100 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm">

        {/* Header */}
        <div className="p-8">
          <div className="inline-block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 border border-zinc-300 px-2 py-1 rounded mb-4">
            Exam
          </div>

          <h1 className="text-4xl font-bold text-zinc-900 tracking-tight">
            {exam.title}
          </h1>

          {exam.description && (
            <p className="mt-3 text-sm leading-6 text-zinc-600 max-w-2xl">
              {exam.description}
            </p>
          )}
        </div>

        <div className="border-t border-zinc-200" />

        {/* Meta Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2">

          <MetaItem
            icon="⏱"
            label="Duration"
            value={formatDuration(exam.duration)}
          />

          <MetaItem
            icon="🏆"
            label="Total Marks"
            value={exam.totalMarks ?? '—'}
          />

          <MetaItem
            icon="📅"
            label="Starts"
            value={formatDate(exam.scheduledStart)}
          />

          <MetaItem
            icon="🔚"
            label="Ends"
            value={formatDate(exam.scheduledEnd)}
          />
        </div>

        <div className="border-t border-zinc-200" />

        {/* Settings */}
        <div className="p-8">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-5">
            Exam Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <Flag
              active={exam.shuffleOptions}
              label="Options shuffled"
              hint={
                exam.shuffleOptions
                  ? 'Answer options are randomised per attempt.'
                  : 'Answer options appear in fixed order.'
              }
            />

            <Flag
              active={exam.showResultAfterSubmit}
              label="Result shown after submission"
              hint={
                exam.showResultAfterSubmit
                  ? 'Your score will be visible immediately after submission.'
                  : 'Results will be released later by examiner.'
              }
            />
          </div>
        </div>

        <div className="border-t border-zinc-200" />

        {/* Rules */}
        <div className="p-8">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-5">
            Rules & Instructions
          </h2>

          <div className="space-y-1">
            {rules.map((rule, index) => (
              <div
                key={index}
                className="flex gap-4 py-4 border-b border-zinc-100 last:border-none"
              >
                <span className="text-xs font-bold text-zinc-400 pt-1">
                  {index + 1}
                </span>

                <p className="text-sm text-zinc-700 leading-6">
                  {rule}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-zinc-200" />

        {/* Footer */}
        <div className="p-8 flex flex-col gap-6">

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 h-4 w-4 accent-black"
            />

            <span className="text-sm text-zinc-700 leading-6">
              I have read all the instructions and agree to follow the exam
              rules.
            </span>
          </label>

          <div className="flex justify-end gap-3">

            <button
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 text-sm font-semibold border border-zinc-300 text-zinc-700 hover:bg-zinc-100 transition"
            >
              ← Back
            </button>

            <button
              disabled={!agreed}
              onClick={handleStart}
              className={`px-6 py-2.5 text-sm font-bold transition
                ${
                  agreed
                    ? 'bg-black text-white hover:bg-zinc-800'
                    : 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
                }
              `}
            >
              Start Exam →
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}

function MetaItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-4 p-6 border-b md:border-r border-zinc-200">
      <span className="text-xl">{icon}</span>

      <div>
        <p className="text-[11px] uppercase tracking-widest font-semibold text-zinc-400 mb-1">
          {label}
        </p>

        <p className="text-sm font-semibold text-zinc-900">
          {value}
        </p>
      </div>
    </div>
  );
}

function Flag({ active, label, hint }) {
  return (
    <div className="flex gap-3 items-start border border-zinc-200 bg-zinc-50 p-4 rounded-md">
      <div
        className={`w-2 h-2 rounded-full mt-2 ${
          active ? 'bg-green-600' : 'bg-zinc-400'
        }`}
      />

      <div>
        <p className="text-sm font-semibold text-zinc-900">
          {label}
        </p>

        <p className="text-xs text-zinc-500 mt-1 leading-5">
          {hint}
        </p>
      </div>
    </div>
  );
}