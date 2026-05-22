import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useGetThresholdReport } from '../../api/queries';
import { useAnalyticsStore } from "../../store/analyticsStore";

const COLORS = ['#10b981', '#f43f5e']; // Emerald (>= threshold) and Rose (< threshold)

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-slate-100 rounded-2xl px-4 py-2.5 shadow-xl text-xs font-semibold">
      <p className="text-slate-800 mb-0.5">{d.name}</p>
      <p style={{ color: d.payload.fill }}>
        {d.value} student{d.value !== 1 ? 's' : ''} ({d.payload.pct}%)
      </p>
    </div>
  );
};

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
  if (value === 0) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      style={{ fontSize: 13, fontWeight: 900 }}>
      {value}
    </text>
  );
};


export default function ThresholdAnalysis({
  totalMarks = 100
}) {
  const { examId } = useAnalyticsStore();
  const [threshold, setThreshold] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSlice, setActiveSlice] = useState('above'); // 'above' or 'below'

  useEffect(() => {
    setThreshold(Math.round(totalMarks / 2));
  }, [examId, totalMarks]);

  const isQueryEnabled = !!examId;

  const { data: reportData, isLoading: loadingReport, error: reportError } = useGetThresholdReport(
    threshold,
    isQueryEnabled
  );

  // Recharts data
  const chartData = useMemo(() => {
    if (!reportData) return [];
    const total = reportData.totalStudents || 1;
    return [
      {
        name: `Scored ≥ ${threshold} Marks`,
        value: reportData.aboveCount,
        fill: COLORS[0],
        pct: Math.round((reportData.aboveCount / total) * 100),
        type: 'above'
      },
      {
        name: `Scored < ${threshold} Marks`,
        value: reportData.belowCount,
        fill: COLORS[1],
        pct: Math.round((reportData.belowCount / total) * 100),
        type: 'below'
      },
    ].filter(d => d.value > 0);
  }, [reportData, threshold]);

  // Handle click on slice
  const handleSliceClick = (entry) => {
    if (entry && entry.type) {
      setActiveSlice(entry.type);
    }
  };

  // Filter students by search term
  const displayedStudents = useMemo(() => {
    if (!reportData) return [];
    const list = activeSlice === 'above' ? reportData.aboveThreshold : reportData.belowThreshold;
    const term = searchTerm.toLowerCase().trim();
    if (!term) return list;
    return list.filter((s) =>
      s.name.toLowerCase().includes(term) ||
      s.rollNumber.toLowerCase().includes(term)
    );
  }, [reportData, activeSlice, searchTerm]);

  return (
    <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
        <div>
          <h3 className="text-md font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
            🎯 Custom Threshold Performance Analyzer  
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Benchmark and split student cohorts based on a customizable threshold mark.
          </p>
        </div>

        {/* Compact Direct Threshold Input */}
        <div className="flex items-center gap-2 shrink-0">
          <label htmlFor="thresh-input" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Threshold Mark:
          </label>
          <div className="relative flex items-center">
            <input
              id="thresh-input"
              type="number"
              min="0"
              max={totalMarks}
              value={threshold}
              onChange={(e) => {
                const val = Math.max(0, Math.min(totalMarks, Number(e.target.value)));
                setThreshold(val);
              }}
              className="w-24 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 text-xs font-black rounded-xl pl-3 pr-8 py-1.5 outline-none focus:border-indigo-400 focus:bg-white transition-all text-center"
            />
            <span className="absolute right-2 text-[9px] font-bold text-slate-400 pointer-events-none">
              / {totalMarks}
            </span>
          </div>
        </div>
      </div>

      {/* ── Results Dashboard ────────────────────────────────────────────── */}
      {!isQueryEnabled ? (
        <div className="flex flex-col items-center justify-center py-8 gap-1.5 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/20">
          <span className="text-xl">📊</span>
          <h4 className="text-xs font-bold text-slate-500">Awaiting Selector Input</h4>
          <p className="text-[10px] text-slate-400 max-w-[280px]">
            Please select an exam from the dashboard header filters to load the threshold analyzer.
          </p>
        </div>
      ) : loadingReport ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2">
          <div className="w-5 h-5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-[11px] text-slate-400 font-semibold">Running cohort split calculation...</p>
        </div>
      ) : reportError ? (
        <div className="text-xs bg-red-50 text-red-700 border border-red-100 p-3 rounded-xl">
          Error retrieving cohort performance: {reportError.message || 'Unknown error'}
        </div>
      ) : reportData?.totalStudents === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-slate-200 rounded-2xl">
          <span className="text-xl">👥</span>
          <h4 className="text-xs font-bold text-slate-500">No Students Match Active Filters</h4>
          <p className="text-[10px] text-slate-400 max-w-[280px]">
            There are no student accounts registered matching your active filter configuration.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-1 items-start animate-[fadeIn_0.2s_ease]">
          
          {/* Left: Recharts Pie Chart (5 cols) */}
          <div className="md:col-span-5 bg-slate-50/40 border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center relative min-h-[220px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider absolute top-3 left-4">
              Pie Chart (Click segment)
            </span>

            <div className="w-full h-[150px] mt-2 relative flex items-center justify-center">
              {chartData.length === 0 ? (
                <p className="text-slate-400 text-[10px] font-semibold">No data available to plot.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={58}
                      paddingAngle={3}
                      dataKey="value"
                      labelLine={false}
                      label={renderCustomLabel}
                      onClick={handleSliceClick}
                      className="cursor-pointer"
                    >
                      {chartData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.fill}
                          stroke="white"
                          strokeWidth={1.5}
                          style={{
                            outline: 'none',
                            filter: activeSlice === entry.type ? 'drop-shadow(0px 2px 4px rgba(0,0,0,0.15))' : 'none',
                            opacity: activeSlice === entry.type ? 1 : 0.65,
                            transition: 'all 0.2s ease'
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Micro Legend */}
            <div className="w-full grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={() => setActiveSlice('above')}
                className={`flex flex-col items-start p-2 rounded-xl border text-left transition-all ${
                  activeSlice === 'above'
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : 'border-slate-100 bg-white hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Score ≥ {threshold}</span>
                </div>
                <span className="text-xs font-black text-slate-800 mt-0.5">{reportData.aboveCount} students</span>
              </button>
              <button
                onClick={() => setActiveSlice('below')}
                className={`flex flex-col items-start p-2 rounded-xl border text-left transition-all ${
                  activeSlice === 'below'
                    ? 'border-rose-200 bg-rose-50/30'
                    : 'border-slate-100 bg-white hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#f43f5e]" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Score &lt; {threshold}</span>
                </div>
                <span className="text-xs font-black text-slate-800 mt-0.5">{reportData.belowCount} students</span>
              </button>
            </div>
          </div>

          {/* Right: Student cohort list (7 cols) */}
          <div className="md:col-span-7 bg-white border border-slate-100 rounded-2xl p-4 flex flex-col min-h-[220px]">
            
            {/* Header + Search bar */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${activeSlice === 'above' ? 'bg-[#10b981]' : 'bg-[#f43f5e]'}`} />
                {activeSlice === 'above' ? 'Scored ≥' : 'Scored <'} {threshold} Marks
              </span>

              <div className="relative w-36">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter name..."
                  className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 text-[10px] font-medium rounded-lg pl-6 pr-2 py-1 outline-none focus:border-indigo-400 focus:bg-white transition-all"
                />
                <svg className="w-2.5 h-2.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 mt-2.5 max-h-[145px] overflow-y-auto pr-0.5 space-y-1.5">
              {displayedStudents.length === 0 ? (
                <p className="text-center text-[10px] text-slate-400 py-6 font-medium">No students found matching filters.</p>
              ) : (
                displayedStudents.map((s) => (
                  <div key={s._id} className="flex items-center justify-between bg-slate-50/50 border border-slate-100/60 hover:border-slate-200 rounded-xl px-3 py-1.5 transition-all">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[8px] font-black border px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                          activeSlice === 'above'
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                            : 'bg-rose-50 border-rose-100 text-rose-700'
                        }`}>
                          {s.rollNumber}
                        </span>
                        <span className="text-[11px] font-bold text-slate-800 truncate">{s.name}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[11px] font-black block ${activeSlice === 'above' ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {s.attempted ? `${s.score} / ${totalMarks}` : `0 / ${totalMarks}`}
                      </span>
                      <span className="text-[8px] text-slate-400 font-bold block">
                        {s.attempted ? 'Attempted' : 'Absent'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
