import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useAttemptStore } from '../store/attemptStore';
import { joinExam } from '../api/joinExam';
import api from '../api/axios';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}
function fmtDuration(min) {
  if (!min) return '—';
  const h = Math.floor(min / 60), m = min % 60;
  return h === 0 ? `${m} min` : m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}
function grade(pct) {
  if (pct >= 90) return { label: 'Excellent', cls: 'text-emerald-600' };
  if (pct >= 75) return { label: 'Good',      cls: 'text-indigo-600'  };
  if (pct >= 50) return { label: 'Average',   cls: 'text-amber-600'   };
  return               { label: 'Below Avg',  cls: 'text-red-600'     };
}

// ── Section header ─────────────────────────────────────────────────────────
function SectionHeader({ title, count, accent }) {
  const accents = {
    red:    'bg-red-500',
    blue:   'bg-blue-500',
    slate:  'bg-slate-400',
    indigo: 'bg-indigo-500',
  };
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-1 h-6 rounded-full ${accents[accent]}`} />
      <h2 className="text-base font-bold text-slate-800">{title}</h2>
      <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{count}</span>
    </div>
  );
}

// ── Exam card (scheduled / live / ended) ───────────────────────────────────
function ExamCard({ exam, onJoin }) {
  const isLive = exam.status === 'live';
  const isEnded = exam.status === 'ended';

  const stripeColor = isLive
    ? 'bg-gradient-to-r from-indigo-500 to-violet-500'
    : isEnded ? 'bg-slate-200' : 'bg-gradient-to-r from-blue-400 to-indigo-400';

  const ring = isLive ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-slate-200';

  return (
    <div id={`exam-card-${exam._id}`} className={`bg-white border rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow ${ring}`}>
      <div className={`h-1 w-full ${stripeColor}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-sm font-bold text-slate-900 leading-snug">{exam.title}</h3>
          {isLive && <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-300">🔴 LIVE</span>}
          {exam.status === 'scheduled' && <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">Scheduled</span>}
          {isEnded && <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">Ended</span>}
        </div>

        {exam.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{exam.description}</p>}

        <div className="grid grid-cols-2 gap-2 mb-4">
          <MetaChip icon="⏱" label="Duration" value={fmtDuration(exam.duration)} />
          <MetaChip icon="🏆" label="Marks" value={exam.totalMarks ?? '—'} />
          {exam.scheduledStart && (
            <MetaChip icon="📅" label={isEnded ? 'Was' : 'Starts'} value={fmtDate(exam.scheduledStart)} span />
          )}
        </div>

        {isLive
          ? <button onClick={onJoin} className="w-full btn btn-primary justify-center text-sm">Join Exam →</button>
          : isEnded
            ? <p className="text-center text-xs text-slate-400 py-1">This exam has ended</p>
            : <p className="text-center text-xs text-slate-400 py-1">Not live yet</p>
        }
      </div>
    </div>
  );
}

// ── Missed exam card (ended, not attempted) ────────────────────────────────
function MissedExamCard({ exam }) {
  return (
    <div id={`missed-exam-${exam._id}`} className="bg-white border border-red-100 rounded-2xl shadow-sm overflow-hidden opacity-80">
      <div className="h-1 w-full bg-gradient-to-r from-red-300 to-slate-300" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-sm font-bold text-slate-700 leading-snug">{exam.title}</h3>
          <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">✗ Missed</span>
        </div>

        {exam.description && <p className="text-xs text-slate-400 mb-3 line-clamp-2">{exam.description}</p>}

        <div className="grid grid-cols-2 gap-2 mb-3">
          <MetaChip icon="⏱" label="Duration" value={fmtDuration(exam.duration)} />
          <MetaChip icon="🏆" label="Marks"    value={exam.totalMarks ?? '—'} />
          {exam.scheduledStart && <MetaChip icon="📅" label="Was scheduled" value={fmtDate(exam.scheduledStart)} span />}
        </div>

        <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-xs text-red-400 font-medium text-center">
          You did not attempt this exam
        </div>
      </div>
    </div>
  );
}

// ── Completed card ─────────────────────────────────────────────────────────
function CompletedCard({ exam, submission, result, navigate }) {
  const isAuto = submission?.status === 'auto_submitted';
  const g = result ? grade(result.percentage) : null;

  return (
    <div id={`completed-exam-${exam._id}`} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className={`h-1 w-full ${!result ? 'bg-slate-200' : result.percentage >= 50 ? 'bg-gradient-to-r from-indigo-400 to-emerald-400' : 'bg-gradient-to-r from-red-400 to-orange-400'}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-sm font-bold text-slate-900 leading-snug">{exam.title}</h3>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">✓ Done</span>
            {isAuto && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">⏰ Auto</span>}
          </div>
        </div>

        {result ? (
          <div className="bg-slate-50 rounded-xl p-4 mb-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className={`text-2xl font-extrabold ${g.cls}`}>{result.percentage}%</p>
                <p className="text-xs text-slate-500">{result.score}/{result.totalMarks} marks · {g.label}</p>
              </div>
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="13" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                <circle cx="18" cy="18" r="13" fill="none"
                  stroke={result.percentage >= 50 ? '#4f46e5' : '#ef4444'}
                  strokeWidth="4"
                  strokeDasharray={`${(result.percentage / 100) * 81.68} ${81.68 - (result.percentage / 100) * 81.68}`}
                  strokeLinecap="round" />
              </svg>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <MiniStat label="Correct" value={result.correctAnswers} color="text-emerald-600" />
              <MiniStat label="Wrong"   value={result.wrongAnswers}   color="text-red-500" />
              <MiniStat label="Skipped" value={result.unanswered}     color="text-slate-400" />
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-xl p-3 mb-3 text-center">
            <p className="text-xs text-slate-500">📊 Results not released yet</p>
          </div>
        )}

        <p className="text-[11px] text-slate-400 mb-3">Submitted {fmtDate(submission?.submittedAt)}</p>

        {result && (
          <button
            onClick={() => navigate(`/exam/${exam._id}/result`, { state: { result, message: 'Exam submitted successfully.' } })}
            className="w-full btn btn-secondary text-sm justify-center"
          >
            View Detailed Result →
          </button>
        )}
      </div>
    </div>
  );
}

// ── Join Modal ─────────────────────────────────────────────────────────────
function JoinExamModal({ onClose, navigate }) {
  const { accessCode, setAccessCode } = useAttemptStore();
  const setExamId = useAttemptStore((s) => s.setExamId);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { mutateAsync } = joinExam();

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!accessCode.trim()) return;
    setError(''); setLoading(true);
    try {
      const res = await mutateAsync({ accessCode: accessCode.trim().toUpperCase() });
      setExamId(res.exam._id);
      onClose();
      navigate(`/exam/${res.exam._id}`, { state: { examData: res } });
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to join. Check your code.');
    } finally { setLoading(false); }
  };

  return (
    <div id="join-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div id="join-modal" className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Join an Exam</h2>
            <p className="text-xs text-slate-500 mt-0.5">Enter the 6-character access code</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">✕</button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg mb-4">⚠ {error}</div>}

        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <input
            id="access-code-input" type="text" value={accessCode} autoFocus maxLength={6}
            placeholder="XXXXXX"
            onChange={(e) => setAccessCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            className="w-full px-6 py-4 text-3xl font-extrabold font-mono tracking-[0.4em] text-center bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-300"
          />
          <div className="flex justify-center gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i < accessCode.length ? 'bg-indigo-500' : 'bg-slate-200'}`} />
            ))}
          </div>
          <button type="submit" id="join-submit-btn" disabled={loading || accessCode.length < 6} className="btn btn-primary btn-lg w-full justify-center">
            {loading
              ? <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />Joining…</span>
              : 'Join Exam →'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Tiny helpers ───────────────────────────────────────────────────────────
function MetaChip({ icon, label, value, span }) {
  return (
    <div className={`flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 ${span ? 'col-span-2' : ''}`}>
      <span className="text-sm" aria-hidden>{icon}</span>
      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 leading-none">{label}</p>
        <p className="text-xs font-semibold text-slate-700 truncate">{value}</p>
      </div>
    </div>
  );
}
function MiniStat({ label, value, color }) {
  return <div><p className={`text-base font-extrabold ${color}`}>{value}</p><p className="text-[10px] text-slate-400">{label}</p></div>;
}
function EmptySection({ message }) {
  return <p className="text-sm text-slate-400 italic py-4 pl-4">{message}</p>;
}
function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1,2,3,4].map(i => (
        <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 animate-pulse">
          <div className="h-4 bg-slate-100 rounded w-3/4 mb-3" />
          <div className="h-3 bg-slate-100 rounded w-1/2 mb-4" />
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="h-10 bg-slate-100 rounded-lg" /><div className="h-10 bg-slate-100 rounded-lg" />
          </div>
          <div className="h-9 bg-slate-100 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [joinOpen, setJoinOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: async () => { const res = await api.get('/student/dashboard'); return res.data; },
    staleTime: 60_000,
  });

  const liveExams      = data?.liveExams      ?? [];
  const scheduledExams = data?.scheduledExams  ?? [];
  const endedExams     = data?.endedExams      ?? [];
  const completedExams = data?.completedExams  ?? [];
  const counts         = data?.counts          ?? {};

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">E</span>
            </div>
            <span className="text-sm font-bold text-slate-800">ExamForge</span>
          </div>
          <div className="flex items-center gap-3">
            <button id="open-join-modal" onClick={() => setJoinOpen(true)} className="btn btn-primary gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Join Exam
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
                {user?.name?.[0]?.toUpperCase() ?? 'S'}
              </div>
              <div className="hidden sm:block text-xs">
                <p className="font-semibold text-slate-800 leading-tight">{user?.name}</p>
                <p className="text-slate-400">{user?.rollNumber}</p>
              </div>
              <button onClick={logout} title="Logout" className="ml-2 text-slate-400 hover:text-red-500 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 space-y-10">
        {/* Welcome */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Hello, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="text-sm text-slate-500 mt-0.5">{user?.department} · Year {user?.year}</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {[
              { label: 'Live',      value: counts.live,      color: 'bg-red-50    text-red-700    border-red-200'    },
              { label: 'Scheduled', value: counts.scheduled, color: 'bg-blue-50   text-blue-700   border-blue-200'   },
              { label: 'Ended',     value: counts.ended,     color: 'bg-slate-50  text-slate-600  border-slate-200'  },
              { label: 'Completed', value: counts.completed, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${color}`}>
                <span className="text-xl font-extrabold">{value ?? 0}</span>
                <span className="opacity-80">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {isLoading ? <LoadingGrid /> : isError ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <div className="text-4xl">😕</div>
            <p className="text-sm text-slate-500">Failed to load dashboard.</p>
            <button onClick={refetch} className="btn btn-secondary">Try Again</button>
          </div>
        ) : (
          <>
            {/* ── Live ──────────────────────────────────────────────── */}
            <section id="section-live">
              <SectionHeader title="Live Now" count={liveExams.length} accent="red" />
              {liveExams.length === 0
                ? <EmptySection message="No live exams right now." />
                : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {liveExams.map(({ exam }) => <ExamCard key={exam._id} exam={exam} onJoin={() => setJoinOpen(true)} />)}
                  </div>
              }
            </section>

            {/* ── Scheduled ─────────────────────────────────────────── */}
            <section id="section-scheduled">
              <SectionHeader title="Upcoming / Scheduled" count={scheduledExams.length} accent="blue" />
              {scheduledExams.length === 0
                ? <EmptySection message="No upcoming exams scheduled." />
                : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {scheduledExams.map(({ exam }) => <ExamCard key={exam._id} exam={exam} onJoin={() => setJoinOpen(true)} />)}
                  </div>
              }
            </section>

            {/* ── Missed ────────────────────────────────────────────── */}
            <section id="section-missed">
              <SectionHeader title="Missed Exams" count={endedExams.length} accent="slate" />
              {endedExams.length === 0
                ? <EmptySection message="You haven't missed any exams. 🎉" />
                : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {endedExams.map(({ exam }) => <MissedExamCard key={exam._id} exam={exam} />)}
                  </div>
              }
            </section>

            {/* ── Completed ─────────────────────────────────────────── */}
            <section id="section-completed">
              <SectionHeader title="Completed" count={completedExams.length} accent="indigo" />
              {completedExams.length === 0
                ? <EmptySection message="You haven't completed any exams yet." />
                : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {completedExams.map(({ exam, submission, result }) => (
                      <CompletedCard key={exam._id} exam={exam} submission={submission} result={result} navigate={navigate} />
                    ))}
                  </div>
              }
            </section>
          </>
        )}
      </main>

      {joinOpen && <JoinExamModal onClose={() => setJoinOpen(false)} navigate={navigate} />}
    </div>
  );
}
