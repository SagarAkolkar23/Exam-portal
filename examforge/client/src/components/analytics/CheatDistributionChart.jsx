import React, { useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useGetCheatReport } from '../../api/queries';

// Cheat buckets: 0, 1, 2, 3, 4+
const BUCKET_LABELS = ['0 cheats (Clean)', '1 cheat', '2 cheats', '3 cheats', '4+ cheats'];
const BUCKET_COLORS = ['#10b981', '#f59e0b', '#f97316', '#ef4444', '#7f1d1d'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-xl text-sm">
      <p className="font-bold text-slate-800 mb-1">{d.name}</p>
      <p className="font-semibold" style={{ color: d.payload.fill }}>
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
      style={{ fontSize: 13, fontWeight: 800 }}>
      {value}
    </text>
  );
};

export default function CheatDistributionChart() {
  const [selected, setSelected] = useState(null);

  const { data: cheatData, isLoading, error } = useGetCheatReport();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-center min-h-[360px]">
        <div className="text-xs bg-red-50 text-red-700 border border-red-100 p-4 rounded-xl">
          Error retrieving integrity report: {error.message || 'Unknown error'}
        </div>
      </div>
    );
  }

  const report = cheatData?.report ?? [];

  if (report.length === 0) {
    return <EmptyChart message="No submissions for this exam yet." />;
  }

  // Bucket students by cheat count
  const buckets = [0, 0, 0, 0, 0];
  const bucketStudents = [[], [], [], [], []];

  for (const row of report) {
    const c = row.cheats ?? 0;
    const idx = Math.min(c, 4);
    buckets[idx]++;
    bucketStudents[idx].push(row);
  }

  const total = report.length;
  const chartData = BUCKET_LABELS.map((label, i) => ({
    name:  label,
    value: buckets[i],
    fill:  BUCKET_COLORS[i],
    pct:   total > 0 ? Math.round((buckets[i] / total) * 100) : 0,
  })).filter((d) => d.value > 0);

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm min-h-[360px] flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Integrity Report</h3>
            <p className="text-sm text-slate-500 mt-1">Students grouped by number of detected cheating incidents</p>
          </div>
          <span className="text-xs font-bold bg-rose-50 text-rose-600 px-3 py-1.5 rounded-full border border-rose-100">
            {report.length} Attempted
          </span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-center">
          <div className="w-full lg:w-1/2" style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomLabel}
                  onClick={(_, i) => setSelected(selected === i ? null : i)}
                  className="cursor-pointer"
                >
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} opacity={selected === null || selected === i ? 1 : 0.35} stroke="white" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend + top cheaters */}
          <div className="w-full lg:w-1/2 space-y-2">
            {BUCKET_LABELS.map((label, i) => (
              buckets[i] > 0 && (
                <button
                  key={i}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                    selected === i
                      ? 'border-rose-300 bg-rose-50/20 shadow-sm'
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                  onClick={() => setSelected(selected === i ? null : i)}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: BUCKET_COLORS[i] }} />
                    <span className="text-xs font-semibold text-slate-700">{label}</span>
                  </div>
                  <span className="text-xs font-black" style={{ color: BUCKET_COLORS[i] }}>{buckets[i]} students</span>
                </button>
              )
            ))}
          </div>
        </div>
      </div>

      {/* Drill-down table */}
      {selected !== null && bucketStudents[selected]?.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-4 animate-[fadeIn_0.2s_ease]">
          <p className="text-xs font-bold text-slate-700 mb-2">
            Students with {selected < 4 ? `exactly ${selected}` : '4 or more'} cheat{selected !== 1 ? 's' : ''}:
          </p>
          <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
            {bucketStudents[selected].map((row, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 hover:border-slate-200 transition-all">
                <div>
                  <p className="text-xs font-bold text-slate-800">{row.student?.name ?? 'Unknown'}</p>
                  <p className="text-[10px] text-slate-400 font-semibold">{row.student?.rollNumber} · {row.student?.department}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-slate-700">{row.score ?? '—'} marks</p>
                  <p className="text-[10px] font-bold" style={{ color: BUCKET_COLORS[selected] }}>{row.cheats} cheat{row.cheats !== 1 ? 's' : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-10 shadow-sm flex flex-col items-center justify-center gap-3 min-h-[360px]">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-2xl animate-pulse">🕵️</div>
      <p className="text-slate-400 font-medium text-sm">{message}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm min-h-[360px] animate-pulse space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-4 w-40 bg-slate-100 rounded" />
          <div className="h-3 w-60 bg-slate-50 rounded" />
        </div>
        <div className="h-6 w-20 bg-slate-100 rounded-full" />
      </div>
      <div className="flex gap-6 items-center">
        <div className="w-1/2 h-[200px] bg-slate-50 rounded-full" />
        <div className="w-1/2 space-y-2">
          <div className="h-8 bg-slate-50 rounded" />
          <div className="h-8 bg-slate-50 rounded" />
        </div>
      </div>
    </div>
  );
}
