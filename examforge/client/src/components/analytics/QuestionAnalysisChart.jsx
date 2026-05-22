import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell,
} from 'recharts';
import { useGetQuestionAnalysis } from '../../api/queries';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-xl text-sm max-w-xs">
      <p className="font-bold text-slate-800 mb-2 line-clamp-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-semibold" style={{ color: p.color }}>
          {p.name}: {p.value} student{p.value !== 1 ? 's' : ''}
        </p>
      ))}
    </div>
  );
};

export default function QuestionAnalysisChart() {
  const [selected, setSelected] = useState(null);

  const { data: qAnalysisData, isLoading, error } = useGetQuestionAnalysis();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-center min-h-[360px]">
        <div className="text-xs bg-red-50 text-red-700 border border-red-100 p-4 rounded-xl">
          Error retrieving question analysis: {error.message || 'Unknown error'}
        </div>
      </div>
    );
  }

  const questions = qAnalysisData?.questions ?? [];

  if (questions.length === 0) {
    return <EmptyChart message="No questions available for analysis." />;
  }

  const mcqQuestions = questions.filter((q) => q.type === 'mcq');

  const chartData = mcqQuestions.map((q, i) => ({
    name:    `Q${i + 1}`,
    fullText: q.text,
    correct: q.correctCount,
    wrong:   q.wrongCount,
    skipped: q.skippedCount,
    rate:    q.correctRate,
    _q:      q,
  }));

  const selectedQ = selected !== null ? chartData[selected] : null;

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm min-h-[360px]">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Question-wise Performance</h3>
          <p className="text-sm text-slate-500 mt-1">Correct vs wrong responses per MCQ question — click a bar for details</p>
        </div>
        <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full border border-emerald-100">
          {mcqQuestions.length} MCQ{mcqQuestions.length !== 1 ? 's' : ''}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} barCategoryGap="25%" onClick={(data, idx) => setSelected(selected === idx ? null : idx)}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 700 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 6 }} />
          <Legend
            wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: 12 }}
            formatter={(val) => <span className="text-slate-600">{val}</span>}
          />
          <Bar dataKey="correct" name="Correct" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={40}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={selected === i ? '#3730a3' : '#4f46e5'} />
            ))}
          </Bar>
          <Bar dataKey="wrong" name="Wrong" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={40}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={selected === i ? '#be123c' : '#f43f5e'} />
            ))}
          </Bar>
          <Bar dataKey="skipped" name="Skipped" fill="#cbd5e1" radius={[6, 6, 0, 0]} maxBarSize={40}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={selected === i ? '#94a3b8' : '#cbd5e1'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Drill-down panel */}
      {selectedQ && (
        <div className="mt-6 border-t border-slate-100 pt-5 animate-[fadeIn_0.2s_ease]">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{selectedQ.name}</p>
              <p className="text-sm font-semibold text-slate-800 leading-relaxed">{selectedQ.fullText}</p>
              {selectedQ._q.correctOption && (
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  Correct: {selectedQ._q.correctOption}
                </div>
              )}
            </div>
            <div className="ml-4 flex-shrink-0 text-right">
              <p className="text-2xl font-black text-indigo-600">{selectedQ.rate}%</p>
              <p className="text-xs text-slate-400 font-medium">success rate</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Correct', students: selectedQ._q.correct, color: 'emerald' },
              { label: 'Wrong',   students: selectedQ._q.wrong,   color: 'rose'    },
              { label: 'Skipped', students: selectedQ._q.skipped, color: 'slate'   },
            ].map(({ label, students, color }) => (
              <div key={label} className={`bg-${color}-50 border border-${color}-100 rounded-2xl p-3`}>
                <p className={`text-xs font-bold text-${color}-600 uppercase tracking-wide mb-2`}>{label} ({students.length})</p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {students.length === 0
                    ? <p className="text-xs text-slate-400 italic">None</p>
                    : students.map((s, i) => (
                      <div key={i} className="bg-white/70 rounded-lg px-2.5 py-1.5">
                        <p className="text-xs font-semibold text-slate-800 leading-tight">{s.name}</p>
                        <p className="text-[10px] text-slate-400">{s.rollNumber}</p>
                      </div>
                    ))
                  }
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
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-2xl animate-pulse">📝</div>
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
      <div className="h-[260px] bg-slate-50 rounded-2xl" />
    </div>
  );
}
