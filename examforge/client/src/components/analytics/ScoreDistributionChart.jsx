import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts';

const BAND_COLORS = ['#818cf8', '#6366f1', '#4f46e5', '#3730a3', '#312e81'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-xl text-sm">
      <p className="font-bold text-slate-800 mb-1">{label}</p>
      <p className="text-indigo-600 font-semibold">{payload[0].value} student{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  );
};

export default function ScoreDistributionChart({ data, totalMarks }) {
  if (!data || data.length === 0) {
    return <EmptyChart message="No submissions yet." />;
  }

  const chartData = data.map((band) => ({
    name:  band.label,
    count: band.count,
  }));

  const maxVal = Math.max(...chartData.map((d) => d.count), 1);

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Score Distribution</h3>
          <p className="text-sm text-slate-500 mt-1">Students grouped into 5 equal mark bands</p>
        </div>
        <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full border border-indigo-100">
          Total Marks: {totalMarks}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            allowDecimals={false}
            domain={[0, maxVal + 1]}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            width={30}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', radius: 8 }} />
          <Bar dataKey="count" radius={[10, 10, 0, 0]} maxBarSize={72}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={BAND_COLORS[i % BAND_COLORS.length]} />
            ))}
            <LabelList
              dataKey="count"
              position="top"
              style={{ fontSize: 12, fontWeight: 700, fill: '#475569' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend chips */}
      <div className="flex flex-wrap gap-2 mt-4">
        {data.map((band, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 rounded-full px-3 py-1 border border-slate-100">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: BAND_COLORS[i % BAND_COLORS.length] }} />
            <span className="font-semibold">{band.label}:</span>
            <span>{band.count} student{band.count !== 1 ? 's' : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-10 shadow-sm flex flex-col items-center justify-center gap-3 min-h-[260px]">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-2xl">📊</div>
      <p className="text-slate-400 font-medium text-sm">{message}</p>
    </div>
  );
}
