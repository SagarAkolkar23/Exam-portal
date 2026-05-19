import React from 'react';

export default function StatCard({
  title,
  value,
  subtext,
  subtextColor = "text-ink-muted",
  icon,
  accent,
}) {
  return (
    <div
      className={`card p-5 flex items-center gap-4 hover:shadow-md transition-shadow duration-200`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-0.5">
          {title}
        </div>
        <div className="flex items-baseline gap-1.5">
          <div className="text-2xl font-extrabold text-ink">{value}</div>
          {subtext && (
            <div className={`text-xs font-semibold ${subtextColor}`}>
              {subtext}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
