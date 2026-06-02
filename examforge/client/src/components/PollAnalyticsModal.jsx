import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']; // Indigo, Emerald, Amber, Rose, Violet, Cyan

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white/95 border border-slate-100 rounded-2xl px-4 py-2.5 shadow-xl text-xs font-semibold backdrop-blur-md">
      <p className="text-slate-500 mb-0.5 uppercase tracking-wider text-[9px]">Option Choice</p>
      <p className="text-slate-800 text-sm mb-1">{d.name}</p>
      <p style={{ color: d.payload.fill }} className="text-sm font-black">
        {d.value} vote{d.value !== 1 ? 's' : ''} ({d.payload.pct}%)
      </p>
    </div>
  );
};

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, percent }) => {
  if (value === 0) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      style={{ fontSize: 12, fontWeight: 900 }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

function PollAnalyticsModal({ poll, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('voted'); // 'voted' or 'pending'

  const totalVotes = useMemo(() => {
    return poll.options.reduce((sum, o) => sum + o.votes, 0);
  }, [poll]);

  // Format Recharts data
  const chartData = useMemo(() => {
    return poll.options.map((opt, idx) => {
      const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
      return {
        name: opt.text,
        value: opt.votes,
        pct,
        fill: COLORS[idx % COLORS.length]
      };
    }).filter(d => d.value > 0);
  }, [poll, totalVotes]);

  // Identify who voted and who is pending
  const votedResponses = useMemo(() => {
    return poll.responses || [];
  }, [poll]);

  const pendingStudents = useMemo(() => {
    const votedIds = new Set(votedResponses.map(r => r.student?._id?.toString() || r.student?.toString() || ''));
    const shared = poll.sharedWith || [];
    return shared.filter(s => s && !votedIds.has(s._id?.toString()));
  }, [poll, votedResponses]);

  // Search filter
  const displayedVoted = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return votedResponses;
    return votedResponses.filter(r => 
      r.student?.name?.toLowerCase().includes(term) ||
      r.student?.rollNumber?.toLowerCase().includes(term)
    );
  }, [votedResponses, searchTerm]);

  const displayedPending = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return pendingStudents;
    return pendingStudents.filter(s => 
      s.name?.toLowerCase().includes(term) ||
      s.rollNumber?.toLowerCase().includes(term)
    );
  }, [pendingStudents, searchTerm]);

  // Student Section formatting helper
  const formatSection = (s) => {
    if (!s) return 'N/A';
    return [
      s.semester ? `Sem ${s.semester}` : null,
      s.studentClass ? s.studentClass.toUpperCase() : null,
      s.division ? `Div ${s.division.toUpperCase()}` : null
    ].filter(Boolean).join(' · ') || 'Ungrouped';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto py-10 bg-slate-900/40 backdrop-blur-md">
      {/* Backdrop */}
      <div className="absolute inset-0 transition-opacity" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl p-8 overflow-hidden max-h-[90vh] flex flex-col border border-white/40">
        
        {/* Glow element */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 flex items-start justify-between border-b border-slate-100 pb-4 mb-6">
          <div>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-1 tracking-wider uppercase inline-block mb-2">
              🗳️ Poll Analytics
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
              {poll.question}
            </h2>
            {poll.title && (
              <p className="text-xs text-slate-400 font-semibold mt-1">Topic: {poll.title}</p>
            )}
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200/50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors cursor-pointer shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="relative z-10 flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-8 pr-1">
          
          {/* Left Panel: Chart & Legend (5 Cols) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center bg-slate-50/40 border border-slate-100/60 rounded-3xl p-6 min-h-[300px] h-full">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center mb-4">
              Response Distribution
            </h4>
            
            <div className="w-full h-44 relative flex items-center justify-center">
              {chartData.length === 0 ? (
                <div className="text-center py-10">
                  <span className="text-2xl">⏳</span>
                  <p className="text-slate-400 text-xs font-semibold mt-2">Awaiting student responses...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                      labelLine={false}
                      label={renderCustomLabel}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={entry.fill}
                          stroke="white"
                          strokeWidth={2}
                          style={{ outline: 'none' }}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Options list / legend */}
            <div className="w-full space-y-2 mt-6 overflow-y-auto max-h-36 pr-1">
              {poll.options.map((opt, idx) => {
                const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                const c = COLORS[idx % COLORS.length];
                return (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100 text-xs shadow-sm">
                    <div className="flex items-center gap-2 min-w-0 mr-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c }} />
                      <span className="font-bold text-slate-700 truncate">{opt.text}</span>
                    </div>
                    <div className="text-right shrink-0 font-bold text-slate-800">
                      <span>{opt.votes} vote{opt.votes !== 1 ? 's' : ''}</span>
                      <span className="text-slate-400 ml-1.5 font-normal">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Student list detail (7 Cols) */}
          <div className="md:col-span-7 flex flex-col h-full min-h-[300px]">
            
            {/* Header filters */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
              <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-semibold gap-0.5">
                <button
                  type="button"
                  onClick={() => { setActiveTab('voted'); setSearchTerm(''); }}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'voted' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Voted ({votedResponses.length})
                </button>
                {!poll.isPublic && (
                  <button
                    type="button"
                    onClick={() => { setActiveTab('pending'); setSearchTerm(''); }}
                    className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'pending' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Pending ({pendingStudents.length})
                  </button>
                )}
              </div>

              {/* Student Search */}
              <div className="relative w-44">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search students…"
                  className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 text-xs font-medium rounded-xl pl-8 pr-2 py-1.5 outline-none focus:border-indigo-400 focus:bg-white transition-all"
                />
                <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* List area */}
            <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-2.5 max-h-[350px]">
              {activeTab === 'voted' ? (
                displayedVoted.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-xs bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <p className="font-semibold">No voting responses found.</p>
                  </div>
                ) : (
                  displayedVoted.map((res, i) => {
                    const student = res.student || {};
                    const chosenText = poll.options[res.optionIndex]?.text || 'N/A';
                    const c = COLORS[res.optionIndex % COLORS.length];
                    return (
                      <div key={i} className="flex items-center justify-between p-3.5 bg-slate-50/40 border border-slate-100 hover:border-slate-200 rounded-2xl transition-all shadow-sm">
                        <div className="min-w-0 mr-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black border border-slate-200 px-1.5 py-0.5 rounded bg-white font-mono text-slate-500 tracking-wider">
                              {student.rollNumber || 'N/A'}
                            </span>
                            <h5 className="text-xs font-extrabold text-slate-800 truncate">{student.name}</h5>
                          </div>
                          <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                            {formatSection(student)}
                          </span>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="inline-block text-[10px] font-black border px-2 py-0.5 rounded-lg uppercase tracking-wide"
                            style={{ color: c, backgroundColor: `${c}08`, borderColor: `${c}1A` }}>
                            {chosenText}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                displayedPending.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-xs bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <p className="font-semibold">All assigned students have casted their votes! 🎉</p>
                  </div>
                ) : (
                  displayedPending.map((student, i) => (
                    <div key={i} className="flex items-center justify-between p-3.5 bg-white border border-slate-100 hover:border-slate-200 rounded-2xl transition-all shadow-sm">
                      <div className="min-w-0 mr-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black border border-slate-200 px-1.5 py-0.5 rounded bg-slate-50 font-mono text-slate-505">
                            {student?.rollNumber || 'N/A'}
                          </span>
                          <h5 className="text-xs font-extrabold text-slate-800 truncate">{student?.name}</h5>
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                          {formatSection(student)}
                        </span>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-[10px] font-bold text-amber-500 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full inline-block">
                          Pending Vote
                        </span>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>

            {/* Footer Summary info */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Total Votes: {totalVotes}</span>
              {!poll.isPublic && (
                <span>Participation Rate: {poll.sharedWith?.length > 0 ? Math.round((votedResponses.length / poll.sharedWith.length) * 100) : 0}%</span>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default PollAnalyticsModal;
