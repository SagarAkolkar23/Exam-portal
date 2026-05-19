import React from 'react';

export default function Skeleton() {
  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm animate-pulse">
      <div className="h-5 bg-slate-200 rounded-full w-1/3 mb-3" />
      <div className="h-3 bg-slate-100 rounded-full w-1/2 mb-8" />
      <div className="h-52 bg-slate-100 rounded-2xl" />
    </div>
  );
}
