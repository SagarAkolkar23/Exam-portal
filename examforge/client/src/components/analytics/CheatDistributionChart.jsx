import React, { useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

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

export default function CheatDistributionChart({ report }) {
  const [selected, setSelected] = useState(null);

  if (!report || report.length === 0) {
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
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
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
        <div className="w-full lg:w-1/2" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={110}
                paddingAngle={3}
                dataKey="value"
                labelLine={false}
                label={renderCustomLabel}
                onClick={(_, i) => setSelected(selected === i ? null : i)}
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
        <div className="w-full lg:w-1/2 space-y-3">
          {BUCKET_LABELS.map((label, i) => (
            buckets[i] > 0 && (
              <div
                key={i}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${selected === i ? 'border-current shadow-sm' : 'border-slate-100 hover:border-slate-200'}`}
                style={selected === i ? { borderColor: BUCKET_COLORS[i], background: BUCKET_COLORS[i] + '10' } : {}}
                onClick={() => setSelected(selected === i ? null : i)}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: BUCKET_COLORS[i] }} />
                  <span className="text-sm font-semibold text-slate-700">{label}</span>
                </div>
                <span className="text-sm font-black" style={{ color: BUCKET_COLORS[i] }}>{buckets[i]}</span>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Drill-down table */}
      {selected !== null && bucketStudents[selected]?.length > 0 && (
        <div className="mt-6 border-t border-slate-100 pt-5">
          <p className="text-sm font-bold text-slate-700 mb-3">
            Students with {selected < 4 ? `exactly ${selected}` : '4 or more'} cheat{selected !== 1 ? 's' : ''}:
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {bucketStudents[selected].map((row, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{row.student?.name ?? 'Unknown'}</p>
                  <p className="text-xs text-slate-400">{row.student?.rollNumber} · {row.student?.department}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-700">{row.score ?? '—'} marks</p>
                  <p className="text-xs font-bold" style={{ color: BUCKET_COLORS[selected] }}>{row.cheats} cheat{row.cheats !== 1 ? 's' : ''}</p>
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
    <div className="bg-white border border-slate-100 rounded-3xl p-10 shadow-sm flex flex-col items-center justify-center gap-3 min-h-[260px]">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-2xl">🕵️</div>
      <p className="text-slate-400 font-medium text-sm">{message}</p>
    </div>
  );
}
