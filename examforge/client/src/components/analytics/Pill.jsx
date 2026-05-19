import React from 'react';

export default function Pill({ label, value, color }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    emerald:'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber:  'bg-amber-50 text-amber-700 border-amber-100',
    rose:   'bg-rose-50 text-rose-700 border-rose-100',
  };
  return (
    <div className={`flex flex-col items-center px-5 py-3 rounded-2xl border ${colors[color]}`}>
      <span className="text-2xl font-black tracking-tight">{value ?? '—'}</span>
      <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 mt-0.5">{label}</span>
    </div>
  );
}
