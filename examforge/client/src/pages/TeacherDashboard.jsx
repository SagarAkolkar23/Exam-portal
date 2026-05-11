import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetExams, useGetPolls, useAddTestStudent, useEndExam, useTogglePoll, useDeletePoll } from '../api/queries';
import { useAuth } from '../context/AuthContext';
import ExamCard from '../components/ExamCard';
import PollCard from '../components/PollCard';
import { getErrorMessage } from '../utils/helpers';

// ─── Filter tab config ────────────────────────────────────────────────────────

const FILTER_TABS = [
  {
    id: 'all',
    label: 'All Exams',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
  {
    id: 'live',
    label: 'Live',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M8.464 15.536a5 5 0 010-7.072m7.072 0a5 5 0 010 7.072M12 12h.01" />
      </svg>
    ),
  },
  {
    id: 'scheduled',
    label: 'Scheduled',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'draft',
    label: 'Drafts',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    id: 'ended',
    label: 'Completed',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'polls',
    label: 'Polls',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ title, value, subtext, subtextColor = 'text-ink-muted', icon, accent }) {
  return (
    <div className={`card p-5 flex items-center gap-4 hover:shadow-md transition-shadow duration-200`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-0.5">{title}</div>
        <div className="flex items-baseline gap-1.5">
          <div className="text-2xl font-extrabold text-ink">{value}</div>
          {subtext && <div className={`text-xs font-semibold ${subtextColor}`}>{subtext}</div>}
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ activeFilter, onCreate }) {
  const messages = {
    all:       { title: 'No exams yet',        body: 'Get started by creating your first exam.', action: '+ Create Exam' },
    draft:     { title: 'No draft exams',       body: 'Drafts you start will appear here.' },
    scheduled: { title: 'No scheduled exams',  body: 'Published exams with a future start time show here.' },
    live:      { title: 'No live exams',        body: 'Exams that are currently in progress will appear here.' },
    ended:     { title: 'No completed exams',   body: 'Exams that have ended and been graded will show here.' },
    polls:     { title: 'No polls yet',         body: 'Create a quick poll to gather live feedback.', action: '+ Create Poll' },
  };
  const msg = messages[activeFilter] || messages.all;

  return (
    <div className="card p-14 flex flex-col items-center justify-center text-center">
      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d={activeFilter === 'polls' 
              ? "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
              : "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"} />
        </svg>
      </div>
      <h3 className="text-base font-bold text-ink mb-1">{msg.title}</h3>
      <p className="text-sm text-ink-muted mb-5 max-w-xs">{msg.body}</p>
      {msg.action && (
        <button className={activeFilter === 'polls' ? "btn btn-secondary" : "btn btn-primary"} onClick={onCreate}>
          {msg.action}
        </button>
      )}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: exams = [], isLoading: loadingExams, refetch: fetchExams, error: examsError } = useGetExams();
  const { data: polls = [], isLoading: loadingPolls, refetch: fetchPolls } = useGetPolls();
  
  const { mutateAsync: addTestStudent } = useAddTestStudent();
  const { mutateAsync: endExam } = useEndExam();
  const { mutateAsync: togglePoll } = useTogglePoll();
  const { mutateAsync: deletePoll } = useDeletePoll();

  const [error, setError] = useState('');
  const [liveViolations, setLiveViolations] = useState({});
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (examsError) setError(getErrorMessage(examsError));
  }, [examsError]);

  // Temporary Add Student Modal
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [testStudent, setTestStudent] = useState({
    name: '', email: '', rollNumber: '', department: '', year: 1, password: ''
  });

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleAddTestStudent = async (e) => {
    e.preventDefault();
    try {
      await addTestStudent([testStudent]);
      alert('Student added successfully!');
      setShowStudentModal(false);
      setTestStudent({ name: '', email: '', rollNumber: '', department: '', year: 1, password: '' });
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleEndExam = async (examId) => {
    if (!window.confirm('End this exam? This cannot be undone.')) return;
    try { await endExam(examId); fetchExams(); }
    catch (err) { alert(getErrorMessage(err)); }
  };

  const handleTogglePoll = async (pollId, isOpen) => {
    try { await togglePoll({ pollId, isOpen }); fetchPolls(); }
    catch (err) { alert(getErrorMessage(err)); }
  };

  const handleDeletePoll = async (pollId) => {
    if (!window.confirm('Delete this poll?')) return;
    try { await deletePoll(pollId); fetchPolls(); }
    catch (err) { alert(getErrorMessage(err)); }
  };

  // ── Derived stats ──────────────────────────────────────────────────────────

  const liveCount      = exams.filter((e) => e.status === 'live').length;
  const scheduledCount = exams.filter((e) => e.status === 'scheduled').length;
  const draftCount     = exams.filter((e) => e.status === 'draft').length;
  const endedCount     = exams.filter((e) => e.status === 'ended').length;
  const totalStudents  = new Set(
    exams.flatMap((e) => (e.assignedStudents || []).map((s) => (s._id || s).toString()))
  ).size;

  // ── Filtered + searched exams ──────────────────────────────────────────────

  const filteredExams = exams
    .filter((e) => activeFilter === 'all' || e.status === activeFilter)
    .filter((e) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        e.accessCode?.toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q)
      );
    });

  // Count per tab for the badges
  const countFor = (id) => {
    if (id === 'all') return exams.length;
    if (id === 'polls') return polls.length;
    return exams.filter((e) => e.status === id).length;
  };

  const filteredPolls = polls.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (p.title || '').toLowerCase().includes(q) || (p.question || '').toLowerCase().includes(q);
  });

  return (
    <div className="animate-[fadeIn_0.3s_ease] space-y-8">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink mb-0.5">Dashboard</h1>
          <p className="text-sm text-ink-muted">
            Welcome back, <span className="font-semibold text-ink-dim">{user?.name?.split(' ')[0]}</span>. Here's what's happening.
          </p>
        </div>
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowStudentModal(true)}>
            + Add Test Student
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

    

      <section>
        

        {/* ── Filter Bar ── */}
        <div className="flex items-center gap-1.5 mb-6 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
          {FILTER_TABS.map((tab) => {
            const count = countFor(tab.id);
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveFilter(tab.id); setSearchQuery(''); }}
                className={`
                  flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold
                  transition-all duration-150 select-none whitespace-nowrap
                  ${isActive
                    ? 'bg-white text-primary shadow-sm border border-slate-200/80'
                    : 'text-slate-500 hover:text-ink hover:bg-slate-50'
                  }
                `}
              >
                {tab.icon}
                {tab.label}
                {count > 0 && (
                  <span className={`
                    text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center
                    ${isActive ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}
                  `}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {activeFilter === 'polls' ? (
          loadingPolls ? (
            <div className="flex justify-center py-16">
              <div className="spinner spinner-lg" />
            </div>
          ) : filteredPolls.length === 0 ? (
            <EmptyState activeFilter={activeFilter} onCreate={() => navigate('/teacher/polls/create')} />
          ) : (
            <>
              {searchQuery.trim() && (
                <p className="text-xs text-ink-muted mb-4">
                  Showing <strong>{filteredPolls.length}</strong> result{filteredPolls.length !== 1 ? 's' : ''} for "{searchQuery}"
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredPolls.map((poll) => (
                  <PollCard key={poll._id} poll={poll} onToggle={handleTogglePoll} onDelete={handleDeletePoll} />
                ))}
              </div>
            </>
          )
        ) : (
          loadingExams ? (
            <div className="flex justify-center py-16">
              <div className="spinner spinner-lg" />
            </div>
          ) : filteredExams.length === 0 ? (
            <EmptyState activeFilter={activeFilter} onCreate={() => navigate('/teacher/exams/create')} />
          ) : (
            <>
              {/* Result count hint */}
              {searchQuery.trim() && (
                <p className="text-xs text-ink-muted mb-4">
                  Showing <strong>{filteredExams.length}</strong> result{filteredExams.length !== 1 ? 's' : ''} for "{searchQuery}"
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredExams.map((exam) => (
                  <ExamCard
                    key={exam._id}
                    exam={exam}
                    onEnd={handleEndExam}
                    liveViolationCount={liveViolations[exam._id] || 0}
                  />
                ))}
              </div>
            </>
          )
        )}
      </section>

      {/* ── Temporary Add Student Modal ── */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-[slideUp_0.2s_ease]">
            <h3 className="text-xl font-bold text-ink mb-4">Add Test Student</h3>
            <form onSubmit={handleAddTestStudent} className="space-y-4">
              <div>
                <label className="form-label text-slate-500">Name</label>
                <input required type="text" className="form-input py-2" value={testStudent.name} onChange={e => setTestStudent({ ...testStudent, name: e.target.value })} />
              </div>
              <div>
                <label className="form-label text-slate-500">Email</label>
                <input required type="email" className="form-input py-2" value={testStudent.email} onChange={e => setTestStudent({ ...testStudent, email: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label text-slate-500">Roll Number</label>
                  <input required type="text" className="form-input py-2" value={testStudent.rollNumber} onChange={e => setTestStudent({ ...testStudent, rollNumber: e.target.value })} />
                </div>
                <div>
                  <label className="form-label text-slate-500">Year</label>
                  <input required type="number" min="1" max="4" className="form-input py-2" value={testStudent.year} onChange={e => setTestStudent({ ...testStudent, year: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="form-label text-slate-500">Department</label>
                <input required type="text" className="form-input py-2" value={testStudent.department} onChange={e => setTestStudent({ ...testStudent, department: e.target.value })} />
              </div>
              <div>
                <label className="form-label text-slate-500">Password</label>
                <input required type="text" className="form-input py-2" placeholder="e.g. password123" value={testStudent.password} onChange={e => setTestStudent({ ...testStudent, password: e.target.value })} />
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button type="button" className="btn btn-secondary" onClick={() => setShowStudentModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Student</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherDashboard;
