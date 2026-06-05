import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function PollParticipationChart({ votedCount, totalStudents }) {
  const notVotedCount = Math.max(0, totalStudents - votedCount);
  
  const data = [
    { name: 'Voted', value: votedCount, color: '#10b981' }, // emerald-500
    { name: 'Not Voted', value: notVotedCount, color: '#94a3b8' }, // slate-400
  ];

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm min-h-[360px] flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Participation Rate</h3>
            <p className="text-sm text-slate-500 mt-1">Voted vs Not Voted breakdown for selected class/division</p>
          </div>
        </div>

        {totalStudents === 0 ? (
          <div className="h-[240px] flex items-center justify-center text-slate-400">
            No eligible students found in the selected section.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
