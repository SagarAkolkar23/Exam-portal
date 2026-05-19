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
  if (pct >= 90) return { label: 'Excellent', cls: 'text-emerald-500', bg: 'bg-emerald-500/10' };
  if (pct >= 75) return { label: 'Good',      cls: 'text-blue-500',    bg: 'bg-blue-500/10'  };
  if (pct >= 50) return { label: 'Average',   cls: 'text-amber-500',   bg: 'bg-amber-500/10'   };
  return               { label: 'Below Avg',  cls: 'text-rose-500',    bg: 'bg-rose-500/10'     };
}

// ── Icons ──────────────────────────────────────────────────────────────────
const Icons = {
  Clock: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Trophy: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  Calendar: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  ArrowRight: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>,
  Close: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  LogOut: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  AllExams: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>,
  Live: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Completed: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Missed: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

// ── Shared UI ──────────────────────────────────────────────────────────────
function MetaBadge({ icon: Icon, label, value }) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-2xl bg-slate-50/50 border border-slate-100/50 backdrop-blur-sm group-hover:bg-white transition-colors duration-300">
      <div className="flex items-center gap-1.5 text-slate-400">
        <Icon />
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-sm font-semibold text-slate-800">{value}</span>
    </div>
  );
}

function SectionTitle({ title, count, gradient }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <h2 className="text-xl font-bold tracking-tight text-slate-900">{title}</h2>
      <div className={`flex items-center justify-center h-6 px-2.5 rounded-full text-xs font-bold ${gradient} text-white shadow-sm`}>
        {count}
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
    </div>
  );
}

// ── Cards ──────────────────────────────────────────────────────────────────
function ExamCard({ exam, onJoin }) {
  const isLive = exam.status === 'live';
  const isEnded = exam.status === 'ended';

  return (
    <div className="group relative bg-white/60 backdrop-blur-xl border border-white/40 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 overflow-hidden">
      {/* Dynamic Background Glow */}
      <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 -mr-20 -mt-20 transition-transform duration-700 group-hover:scale-150 ${isLive ? 'bg-indigo-500' : 'bg-blue-400'}`} />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {isLive && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-bold tracking-wide uppercase">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                  </span>
                  Live Now
                </span>
              )}
              {exam.status === 'scheduled' && (
                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold tracking-wide uppercase">Upcoming</span>
              )}
              {isEnded && (
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-bold tracking-wide uppercase">Ended</span>
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{exam.title}</h3>
          </div>
        </div>

        {exam.description && <p className="text-sm text-slate-500 mb-6 line-clamp-2 leading-relaxed">{exam.description}</p>}

        <div className="grid grid-cols-2 gap-3 mb-6 mt-auto">
          <MetaBadge icon={Icons.Clock} label="Duration" value={fmtDuration(exam.duration)} />
          <MetaBadge icon={Icons.Trophy} label="Marks" value={exam.totalMarks ?? '—'} />
          {exam.scheduledStart && (
            <div className="col-span-2">
              <MetaBadge icon={Icons.Calendar} label={isEnded ? 'Was Scheduled' : 'Starts At'} value={fmtDate(exam.scheduledStart)} />
            </div>
          )}
          {exam.status === 'scheduled' && exam.latestJoinTime && (
            <div className="col-span-2">
              <div className="flex flex-col gap-1 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/60 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 text-amber-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Enroll By</span>
                </div>
                <span className="text-sm font-semibold text-amber-700">{fmtDate(exam.latestJoinTime)}</span>
              </div>
            </div>
          )}
        </div>

        {isLive ? (
          <button onClick={onJoin} className="w-full relative overflow-hidden group/btn bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 px-4 font-semibold text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2">
            <span className="relative z-10 flex items-center gap-2">Join Exam <Icons.ArrowRight /></span>
            <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
          </button>
        ) : isEnded ? (
          <div className="w-full bg-slate-50 border border-slate-100 text-slate-400 rounded-xl py-3 px-4 text-center text-sm font-medium">Exam has ended</div>
        ) : (
          <div className="w-full bg-blue-50/50 border border-blue-100/50 text-blue-600 rounded-xl py-3 px-4 text-center text-sm font-medium">Not open yet</div>
        )}
      </div>
    </div>
  );
}

function MissedExamCard({ exam }) {
  return (
    <div className="group bg-white/40 border border-slate-200/60 rounded-[2rem] p-6 grayscale-[0.5] hover:grayscale-0 transition-all duration-500">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <span className="inline-block px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-bold tracking-wide uppercase mb-2">Missed</span>
          <h3 className="text-lg font-bold text-slate-700 leading-tight">{exam.title}</h3>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <MetaBadge icon={Icons.Clock} label="Duration" value={fmtDuration(exam.duration)} />
        <MetaBadge icon={Icons.Trophy} label="Marks" value={exam.totalMarks ?? '—'} />
      </div>
      <div className="w-full bg-slate-100 text-slate-500 rounded-xl py-3 px-4 text-center text-sm font-medium">No submission recorded</div>
    </div>
  );
}

function CompletedCard({ exam, submission, result, navigate }) {
  const isAuto = submission?.status === 'auto_submitted';
  const g = result ? grade(result.percentage) : null;

  return (
    <div className="group relative bg-white border border-slate-100 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold tracking-wide uppercase">✓ Completed</span>
            {isAuto && <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-bold tracking-wide uppercase">Auto</span>}
          </div>
          <h3 className="text-lg font-bold text-slate-900 leading-tight">{exam.title}</h3>
        </div>
      </div>

      {result ? (
        <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-100/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-baseline gap-1">
                <span className={`text-4xl font-black tracking-tighter ${g.cls}`}>{result.percentage}</span>
                <span className={`text-lg font-bold ${g.cls}`}>%</span>
              </div>
              <p className="text-sm font-medium text-slate-500 mt-1">{result.score} / {result.totalMarks} Marks</p>
            </div>
            
            {/* Circular Progress */}
            <div className="relative w-16 h-16">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" className="stroke-slate-200" strokeWidth="4" />
                <circle cx="18" cy="18" r="14" fill="none"
                  className={result.percentage >= 50 ? 'stroke-indigo-500' : 'stroke-rose-500'}
                  strokeWidth="4"
                  strokeDasharray={`${(result.percentage / 100) * 87.96} ${87.96 - (result.percentage / 100) * 87.96}`}
                  strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-slate-700">{result.percentage >= 50 ? 'P' : 'F'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <div className="flex-1 bg-white rounded-xl p-2 text-center shadow-sm">
              <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Correct</p>
              <p className="text-sm font-black text-emerald-500">{result.correctAnswers}</p>
            </div>
            <div className="flex-1 bg-white rounded-xl p-2 text-center shadow-sm">
              <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Wrong</p>
              <p className="text-sm font-black text-rose-500">{result.wrongAnswers}</p>
            </div>
            <div className="flex-1 bg-white rounded-xl p-2 text-center shadow-sm">
              <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Skipped</p>
              <p className="text-sm font-black text-slate-500">{result.unanswered}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-2xl p-6 mb-6 text-center border border-slate-100/50">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-xl">⏳</div>
          <p className="text-sm font-medium text-slate-600">Results pending release</p>
        </div>
      )}

      {result && (
        <button
          onClick={() => navigate(`/exam/${exam._id}/result`, { state: { result, message: 'Exam submitted successfully.' } })}
          className="w-full flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl py-3 px-4 font-semibold text-sm transition-colors"
        >
          View Full Analysis <Icons.ArrowRight />
        </button>
      )}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Join Exam</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Enter your 6-character access code</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
              <Icons.Close />
            </button>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleJoin} className="flex flex-col gap-6">
            <div>
              <input
                id="access-code-input" type="text" value={accessCode} autoFocus maxLength={6}
                placeholder="XXXXXX"
                onChange={(e) => setAccessCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                className="w-full px-6 py-5 text-4xl font-black font-mono tracking-[0.5em] text-center bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300 uppercase"
              />
              <div className="flex justify-center gap-3 mt-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i < accessCode.length ? 'bg-indigo-500 scale-110' : 'bg-slate-200'}`} />
                ))}
              </div>
            </div>

            <button type="submit" id="join-submit-btn" disabled={loading || accessCode.length < 6} 
              className="w-full relative overflow-hidden group bg-indigo-600 disabled:bg-slate-300 hover:bg-indigo-700 text-white rounded-2xl py-4 font-bold text-lg transition-all shadow-[0_8px_20px_rgb(99,102,241,0.3)] disabled:shadow-none active:scale-[0.98] flex items-center justify-center gap-2">
              {loading ? (
                <><span className="w-5 h-5 rounded-full border-3 border-white/30 border-t-white animate-spin" /> Authenticating...</>
              ) : (
                <>Enter Arena <Icons.ArrowRight /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard Component ────────────────────────────────────────────────────
export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [joinOpen, setJoinOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: async () => { const res = await api.get('/student/dashboard'); return res.data; },
    staleTime: 60_000,
  });

  const liveExams      = data?.liveExams      ?? [];
  const scheduledExams = data?.scheduledExams  ?? [];
  const endedExams     = data?.endedExams      ?? [];
  const completedExams = data?.completedExams  ?? [];
  const counts         = data?.counts          ?? { live: 0, scheduled: 0, ended: 0, completed: 0 };
  const totalExams     = liveExams.length + scheduledExams.length + endedExams.length + completedExams.length;

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-indigo-100 selection:text-indigo-900 relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-50/40 rounded-full blur-[120px] -mr-[400px] -mt-[400px] pointer-events-none" />
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">ExamForge</span>
          </div>
          
          <div className="flex items-center gap-6">
            <button onClick={() => setJoinOpen(true)} className="hidden sm:flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:shadow-lg active:scale-95">
              <span>Join Exam</span>
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">Alt+J</span>
            </button>
            
            <div className="h-8 w-px bg-slate-200 hidden sm:block" />
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-slate-900 leading-none">{user?.name}</p>
                <p className="text-xs font-medium text-slate-500 mt-1">{user?.rollNumber}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-100 border-2 border-white shadow-sm flex items-center justify-center text-indigo-700 font-bold text-sm">
                {user?.name?.[0]?.toUpperCase() ?? 'S'}
              </div>
              <button onClick={logout} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors" title="Logout">
                <Icons.LogOut />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto w-full px-6 py-12 space-y-16">
        
        {/* Welcome Banner */}
        <section className="relative overflow-hidden bg-white border border-slate-200/60 rounded-[2.5rem] p-8 md:p-12 shadow-sm">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-indigo-100/50 to-purple-100/50 rounded-full blur-3xl -mr-[200px] -mt-[200px]" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">{user?.name?.split(' ')[0]}</span> 👋
              </h1>
              <p className="text-lg text-slate-500 font-medium max-w-xl">
                Ready to ace your exams? You have <strong className="text-indigo-600">{counts.live} live</strong> and <strong className="text-blue-600">{counts.scheduled} upcoming</strong> exams.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              {[
                { label: 'Live Now',    value: counts.live,      color: 'bg-rose-500',   bg: 'bg-rose-50',   text: 'text-rose-700' },
                { label: 'Scheduled',   value: counts.scheduled, color: 'bg-blue-500',   bg: 'bg-blue-50',   text: 'text-blue-700' },
                { label: 'Completed',   value: counts.completed, color: 'bg-emerald-500',bg: 'bg-emerald-50',text: 'text-emerald-700' },
              ].map((stat, i) => (
                <div key={i} className={`flex-1 min-w-[120px] rounded-2xl p-4 ${stat.bg} border border-white/50 relative overflow-hidden group`}>
                  <div className={`absolute top-0 right-0 w-16 h-16 rounded-full blur-xl opacity-20 -mr-8 -mt-8 ${stat.color} transition-transform group-hover:scale-150`} />
                  <p className={`text-3xl font-black ${stat.text} mb-1 tracking-tight`}>{stat.value}</p>
                  <p className={`text-xs font-bold uppercase tracking-wider ${stat.text} opacity-80`}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          
          <button onClick={() => setJoinOpen(true)} className="sm:hidden mt-6 w-full bg-indigo-600 text-white rounded-xl py-3 font-semibold text-sm shadow-md flex items-center justify-center gap-2">
            Join Exam <Icons.ArrowRight />
          </button>
        </section>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white/50 border border-slate-100 rounded-[2rem] p-6 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-6" />
                <div className="h-20 bg-slate-100 rounded-xl mb-6" />
                <div className="h-12 bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200/60 rounded-[2.5rem]">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Unable to load dashboard</h3>
            <p className="text-slate-500 mb-6">There was a problem fetching your exams.</p>
            <button onClick={refetch} className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-slate-800 transition-colors">Try Again</button>
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide border-b border-slate-200/50">
              {[
                { id: 'all', label: 'All Exams', count: totalExams, icon: <Icons.AllExams /> },
                { id: 'live', label: 'Live Now', count: liveExams.length, icon: <Icons.Live /> },
                { id: 'scheduled', label: 'Scheduled', count: scheduledExams.length, icon: <Icons.Calendar /> },
                { id: 'completed', label: 'Completed', count: completedExams.length, icon: <Icons.Completed /> },
                { id: 'missed', label: 'Missed', count: endedExams.length, icon: <Icons.Missed /> },
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60'}`}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Live Section */}
            {(activeTab === 'all' || activeTab === 'live') && (activeTab === 'live' || liveExams.length > 0) && (
              <section>
                <SectionTitle title="Live & Active" count={liveExams.length} gradient="bg-gradient-to-r from-rose-500 to-pink-500" />
                {liveExams.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-12 text-center">
                    <p className="text-slate-500 font-medium">No live exams at the moment. Take a breather! ☕</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {liveExams.map(({ exam }) => <ExamCard key={exam._id} exam={exam} onJoin={() => setJoinOpen(true)} />)}
                  </div>
                )}
              </section>
            )}

            {/* Scheduled Section */}
            {(activeTab === 'all' || activeTab === 'scheduled') && (activeTab === 'scheduled' || scheduledExams.length > 0) && (
              <section>
                <SectionTitle title="Upcoming Exams" count={scheduledExams.length} gradient="bg-gradient-to-r from-blue-500 to-cyan-500" />
                {scheduledExams.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-12 text-center">
                    <p className="text-slate-500 font-medium">No upcoming exams scheduled.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {scheduledExams.map(({ exam }) => <ExamCard key={exam._id} exam={exam} onJoin={() => setJoinOpen(true)} />)}
                  </div>
                )}
              </section>
            )}

            {/* Completed Section */}
            {(activeTab === 'all' || activeTab === 'completed') && (activeTab === 'completed' || completedExams.length > 0) && (
              <section>
                <SectionTitle title="Completed Exams" count={completedExams.length} gradient="bg-gradient-to-r from-emerald-500 to-teal-500" />
                {completedExams.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-12 text-center">
                    <p className="text-slate-500 font-medium">No completed exams yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completedExams.map(({ exam, submission, result }) => (
                      <CompletedCard key={exam._id} exam={exam} submission={submission} result={result} navigate={navigate} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Missed Section */}
            {(activeTab === 'all' || activeTab === 'missed') && (activeTab === 'missed' || endedExams.length > 0) && (
              <section className="opacity-80">
                <SectionTitle title="Missed Exams" count={endedExams.length} gradient="bg-slate-400" />
                {endedExams.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-12 text-center">
                    <p className="text-slate-500 font-medium">You haven't missed any exams. Great job! 🎉</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {endedExams.map(({ exam }) => <MissedExamCard key={exam._id} exam={exam} />)}
                  </div>
                )}
              </section>
            )}

          </div>
        )}
      </main>

      {joinOpen && <JoinExamModal onClose={() => setJoinOpen(false)} navigate={navigate} />}
    </div>
  );
}
