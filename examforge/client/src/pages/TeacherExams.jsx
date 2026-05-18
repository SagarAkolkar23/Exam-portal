import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetExams, useGetPolls, useEndExam, useTogglePoll, useDeletePoll } from '../api/queries';
import { getErrorMessage, formatDate } from '../utils/helpers';

const FILTER_TABS = [
  {
    id: 'all',
    label: 'All Exams',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
  {
    id: 'live',
    label: 'Live',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M8.464 15.536a5 5 0 010-7.072m7.072 0a5 5 0 010 7.072M12 12h.01" />
      </svg>
    ),
  },
  {
    id: 'scheduled',
    label: 'Scheduled',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'draft',
    label: 'Drafts',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    id: 'ended',
    label: 'Completed',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'polls',
    label: 'Polls',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

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

function TeacherExams() {
  const navigate = useNavigate();

  const { data: exams = [], isLoading: loadingExams, refetch: fetchExams, error: examsError } = useGetExams();
  const { data: polls = [], isLoading: loadingPolls, refetch: fetchPolls } = useGetPolls();
  
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
          <h1 className="text-2xl font-extrabold text-ink mb-0.5">Exams</h1>
          <p className="text-sm text-ink-muted">
            Manage your tests, drafts, and live polls.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <section>
        <div className="flex items-center gap-4 mb-6">
          {/* ── Search Bar ── */}
          <div className="relative max-w-sm flex-1">
            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search exams by title or code..."
              className="form-input pl-10 py-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

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
              <div className="border border-line rounded-xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3 font-bold text-xs text-slate-500 uppercase tracking-wider">Question & Code</th>
                      <th className="px-5 py-3 font-bold text-xs text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3 font-bold text-xs text-slate-500 uppercase tracking-wider">Votes</th>
                      <th className="px-5 py-3 font-bold text-xs text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPolls.map((poll) => {
                      const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
                      return (
                        <tr key={poll._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4">
                            <p className="font-bold text-ink mb-1">{poll.question}</p>
                            <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors" onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(poll.accessCode);
                              alert('Copied to clipboard');
                            }}>
                              {poll.accessCode}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`badge ${poll.isOpen ? 'badge-open' : 'badge-closed'}`}>
                              {poll.isOpen ? 'Active' : 'Closed'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-semibold text-ink-dim bg-slate-100 px-2.5 py-1 rounded-md text-xs">{totalVotes} votes</span>
                          </td>
                          <td className="px-5 py-4 text-right space-x-2">
                            <button 
                              className={`btn btn-sm ${poll.isOpen ? 'btn-secondary text-warn' : 'btn-secondary text-success'}`}
                              onClick={() => handleTogglePoll(poll._id, poll.isOpen)}>
                              {poll.isOpen ? 'Close' : 'Reopen'}
                            </button>
                            <button className="btn btn-sm btn-ghost text-danger hover:bg-red-50 hover:text-danger"
                              onClick={() => handleDeletePoll(poll._id)}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
              {searchQuery.trim() && (
                <p className="text-xs text-ink-muted mb-4">
                  Showing <strong>{filteredExams.length}</strong> result{filteredExams.length !== 1 ? 's' : ''} for "{searchQuery}"
                </p>
              )}
              <div className="border border-line rounded-xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3 font-bold text-xs text-slate-500 uppercase tracking-wider">Title & Code</th>
                      <th className="px-5 py-3 font-bold text-xs text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3 font-bold text-xs text-slate-500 uppercase tracking-wider">Details</th>
                      <th className="px-5 py-3 font-bold text-xs text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-5 py-3 font-bold text-xs text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredExams.map((exam) => {
                      const STATUS_CONFIG = {
                        draft:     { label: 'Draft',     cls: 'badge-draft',     dot: '' },
                        scheduled: { label: 'Scheduled', cls: 'badge-scheduled', dot: '' },
                        live:      { label: 'Live',      cls: 'badge-live',      dot: 'animate-pulse' },
                        ended:     { label: 'Completed', cls: 'badge-ended',     dot: '' },
                      };
                      const status = STATUS_CONFIG[exam.status] || STATUS_CONFIG.draft;
                      return (
                        <tr key={exam._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4 cursor-pointer" onClick={() => navigate(`/teacher/exams/${exam._id}`)}>
                            <p className="font-bold text-ink mb-1 group-hover:text-primary transition-colors">{exam.title}</p>
                            <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors" onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(exam.accessCode);
                              alert('Copied to clipboard');
                            }}>
                              {exam.accessCode}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`badge ${status.cls} flex items-center gap-1.5 w-max`}>
                              {exam.status === 'live' && (
                                <span className={`w-1.5 h-1.5 rounded-full bg-indigo-500 ${status.dot}`} />
                              )}
                              {status.label}
                            </span>
                            {exam.status === 'live' && liveViolations[exam._id] > 0 && (
                              <div className="text-xs font-semibold text-danger mt-1.5 flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                {liveViolations[exam._id]} violation{liveViolations[exam._id] !== 1 ? 's' : ''}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-1 text-xs text-slate-500 font-medium">
                              <span>{exam.duration} mins</span>
                              <span>{exam.questions?.length || 0} Qs</span>
                              <span>{exam.assignedStudents?.length || 0} Students</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="text-xs text-ink-muted">
                              {exam.scheduledStart ? (
                                <>
                                  {exam.status === 'ended' ? 'Ended' : 'Starts'} <br />
                                  <span className="font-semibold text-ink">{formatDate(exam.scheduledStart)}</span>
                                </>
                              ) : (
                                <span className="text-slate-300">No schedule set</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                            {exam.status === 'draft' && (
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={(e) => { e.stopPropagation(); navigate(`/teacher/exams/${exam._id}/edit`); }}
                              >
                                Edit
                              </button>
                            )}
                            {(exam.status === 'ended' || exam.status === 'live') && (
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={(e) => { e.stopPropagation(); navigate(`/teacher/exams/${exam._id}`); }}
                              >
                                Results
                              </button>
                            )}
                            {exam.status === 'live' && (
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={(e) => { e.stopPropagation(); handleEndExam(exam._id); }}
                              >
                                End
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )
        )}
      </section>
    </div>
  );
}

export default TeacherExams;
