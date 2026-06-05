import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts';

const COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#fb7185'];

export default function PollResponseChart({ optionCounts }) {
  const chartData = (optionCounts || []).map((opt) => ({
    name: opt.text,
    votes: opt.votes,
  }));

  const maxVal = Math.max(...chartData.map((d) => d.votes), 1);

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm min-h-[360px] flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Option Responses</h3>
            <p className="text-sm text-slate-500 mt-1">Vote distribution per option for selected class/division</p>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="h-[240px] flex items-center justify-center text-slate-400">
            No options responses recorded.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis
                type="number"
                allowDecimals={false}
                domain={[0, maxVal + 1]}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <Tooltip cursor={{ fill: '#f1f5f9', radius: 8 }} />
              <Bar dataKey="votes" radius={[0, 10, 10, 0]} maxBarSize={32}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
                <LabelList
                  dataKey="votes"
                  position="right"
                  style={{ fontSize: 12, fontWeight: 700, fill: '#475569' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
