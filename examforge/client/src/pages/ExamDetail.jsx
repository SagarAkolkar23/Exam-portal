import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetExam, useGetExamResults, useEndExam } from '../api/queries';
import { useAuth } from '../context/AuthContext';
import { formatDate, getErrorMessage, exportCSV } from '../utils/helpers';

const STATUS_BADGE = { draft:'badge-draft', scheduled:'badge-scheduled', live:'badge-live', ended:'badge-ended' };

function ViolationPill({ count }) {
  if (!count) return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-500">
      <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      {count}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-600 border border-red-100">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      {count}
    </span>
  );
}

function StatCard({ title, value, subValue, subLabel, valueColor = 'text-ink', subValueColor = 'text-ink-muted' }) {
  return (
    <div className="card p-6 flex flex-col justify-center">
      <div className="text-sm font-semibold text-ink-dim mb-2">{title}</div>
      <div className="flex items-baseline gap-2">
        <div className={`text-3xl font-extrabold ${valueColor}`}>{value}</div>
        <div className="flex flex-col">
          {subValue && <span className={`text-sm font-bold ${subValueColor}`}>{subValue}</span>}
          {subLabel && <span className="text-xs text-slate-400 font-medium">{subLabel}</span>}
        </div>
      </div>
    </div>
  );
}

function ExamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { refetch: fetchExam } = useGetExam(id, false);
  const { refetch: fetchExamResults } = useGetExamResults(id, false);
  const { mutateAsync: endExam } = useEndExam();

  const [exam, setExam] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [ending, setEnding] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [eRes, rRes] = await Promise.all([
        fetchExam(),
        fetchExamResults().catch(() => ({ data: { results: [] } })),
      ]);
      if (eRes.isError) throw eRes.error;
      setExam(eRes.data);
      setResults(rRes.data?.results || []);
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [id, fetchExam, fetchExamResults]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleEnd = async () => {
    if (!window.confirm('End this exam?')) return;
    setEnding(true);
    try { await endExam(id); fetchData(); }
    catch (err) { alert(getErrorMessage(err)); }
    finally { setEnding(false); }
  };

  const handleCSV = () => {
    const headers = ['Name','Roll No','Email','Score','Total','%','Time(m)','Violations','Submitted'];
    const rows = results.map((r) => {
      const s = r.studentId;
      const t = r.startedAt && r.submittedAt ? Math.round((new Date(r.submittedAt) - new Date(r.startedAt)) / 60000) : '—';
      return [s?.name,s?.rollNumber,s?.email,r.score,r.totalQuestions,r.percentage,t,
              r.totalViolations||0, r.submittedAt?formatDate(r.submittedAt):'—'];
    });
    exportCSV([headers,...rows], `${exam.title}-results.csv`);
  };

  if (loading) return (
    <div className="flex justify-center pt-20"><div className="spinner spinner-lg" /></div>
  );

  if (error) return (
    <div className="alert alert-error max-w-2xl mt-8">{error}</div>
  );

  // Compute stats
  const avgScore = results.length ? (results.reduce((a,b)=>a+b.percentage,0)/results.length).toFixed(1) : 0;
  const highest = results.length ? [...results].sort((a,b)=>b.percentage-a.percentage)[0] : null;
  const lowest = results.length ? [...results].sort((a,b)=>a.percentage-b.percentage)[0] : null;
  const assignedCount = exam.assignedStudents?.length || 0;

  return (
    <div className="animate-[fadeIn_0.3s_ease]">
      
      {/* Breadcrumb & Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm">
          <button onClick={()=>navigate('/teacher/dashboard')} className="text-slate-500 hover:text-primary font-medium">Exams</button>
          <span className="text-slate-300">/</span>
          <span className="text-ink font-semibold">{exam.title}</span>
          <span className={`badge ml-2 ${STATUS_BADGE[exam.status]}`}>{exam.status}</span>
        </div>
        <div className="flex gap-2">
          {exam.status === 'live' && (
            <button className="btn btn-danger" onClick={handleEnd} disabled={ending}>
              {ending ? 'Ending...' : 'End Exam'}
            </button>
          )}
          {results.length > 0 && (
            <button className="btn btn-secondary" onClick={handleCSV}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          )}
        </div>
      </div>

      <h1 className="text-2xl font-extrabold text-ink mb-6">Detailed Submissions</h1>

      {exam.status === 'live' && (
        <div className="alert alert-warning mb-6">
          <strong className="font-bold">Live Exam in Progress.</strong>
        </div>
      )}

      {/* Stats Cards */}
      {(exam.status === 'live' || exam.status === 'ended') && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Average Score" 
            value={`${avgScore}%`} 
            valueColor="text-primary"
          />
          <StatCard 
            title="Highest Score" 
            value={`${highest.score}/${highest.totalQuestions}`} 
            subValue={highest.studentId?.name.split(' ')[0]} 
            subLabel="Top Performer"
          />
          <StatCard 
            title="Lowest Score" 
            value={`${lowest.score}/${lowest.totalQuestions}`} 
            valueColor={lowest.percentage < 50 ? 'text-danger' : 'text-ink'}
            subValue="Below threshold"
            subValueColor="text-danger"
          />
          <StatCard 
            title="Submissions" 
            value={`${results.length}/${assignedCount}`} 
            subValue={
              <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-primary" style={{width: `${(results.length/assignedCount)*100}%`}}></div>
              </div>
            }
          />
        </div>
      )}

      {/* Results Table */}
      {(exam.status === 'live' || exam.status === 'ended') && (
        <div className="card overflow-hidden">
          {results.length === 0 ? (
             <div className="p-12 text-center text-slate-500">No submissions yet.</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Roll No.</th>
                  <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider">%</th>
                  <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Time Taken</th>
                  <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Violations</th>
                  <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Submitted At</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((r, i) => {
                  const s = r.studentId;
                  const tMin = r.startedAt && r.submittedAt ? Math.round((new Date(r.submittedAt)-new Date(r.startedAt))/60000) : '—';
                  const initials = s?.name ? s.name.split(' ').map(n=>n[0]).join('') : '?';
                  const vCount = r.totalViolations || 0;
                  
                  return (
                    <React.Fragment key={r._id}>
                      <tr 
                        onClick={() => setExpandedRow(expandedRow===r._id ? null : r._id)}
                        className={`hover:bg-slate-50 cursor-pointer transition-colors ${expandedRow === r._id ? 'bg-slate-50' : 'bg-white'}`}
                      >
                        <td className="px-6 py-4 font-medium text-slate-400">{String(i+1).padStart(2,'0')}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                              {initials}
                            </div>
                            <span className="font-bold text-ink">{s?.name||'—'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-400 text-xs">{s?.rollNumber||'—'}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                            {r.score}/{r.totalQuestions}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-ink">{r.percentage}%</td>
                        <td className="px-6 py-4 font-medium text-slate-500">{tMin !== '—' ? `${tMin}m` : '—'}</td>
                        <td className="px-6 py-4"><ViolationPill count={vCount} /></td>
                        <td className="px-6 py-4 font-medium text-slate-500">{r.submittedAt ? formatDate(r.submittedAt) : '—'}</td>
                        <td className="px-6 py-4 text-slate-400 text-right">
                          <svg className={`w-5 h-5 transition-transform ${expandedRow === r._id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </td>
                      </tr>
                      
                      {expandedRow === r._id && (
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <td colSpan={9} className="px-6 py-6">
                            <div className="max-w-4xl">
                              <h4 className="text-sm font-bold text-ink mb-4">Question Breakdown</h4>
                              {r.gradedAnswers ? (
                                <div className="flex flex-wrap gap-4 mb-6">
                                  {r.gradedAnswers.map((ga, idx) => (
                                    <div key={idx} className="flex flex-col items-center gap-2">
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border
                                        ${ga.isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-500' : 'bg-red-50 border-red-200 text-red-500'}`}>
                                        {ga.isCorrect ? (
                                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        ) : (
                                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        )}
                                      </div>
                                      <span className="text-xs font-medium text-slate-500">Q{idx+1}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-slate-500 mb-6">Detailed breakdown not available.</p>
                              )}
                              
                              {vCount > 0 && (
                                <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 flex gap-3 items-start">
                                  <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                  <div>
                                    <h5 className="text-sm font-bold text-red-800 mb-1">Violation Details</h5>
                                    <p className="text-sm text-red-600">
                                      Tab switches: {r.violations?.tab_switch||0}. Fullscreen exits: {r.violations?.fullscreen_exit||0}. 
                                      Other anomalies detected.
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default ExamDetail;
