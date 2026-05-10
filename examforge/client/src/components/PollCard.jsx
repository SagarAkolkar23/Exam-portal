import React from 'react';

function PollCard({ poll, onToggle, onDelete }) {
  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);

  return (
    <div className="card p-5 flex flex-col gap-4 hover:shadow-md hover:border-slate-300 transition-all duration-200">

      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className={`badge ${poll.isOpen ? 'badge-open' : 'badge-closed'}`}>
            {poll.isOpen ? 'Active' : 'Closed'}
          </span>
          <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded uppercase tracking-wider">
            {poll.accessCode}
          </span>
        </div>
        <span className="text-xs font-bold text-ink-dim bg-slate-100 px-2 py-1 rounded-md">{totalVotes} votes</span>
      </div>

      {/* Question */}
      <div>
        {poll.title && <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">{poll.title}</p>}
        <h3 className="text-base font-bold text-ink leading-tight">{poll.question}</h3>
      </div>

      {/* CSS Bar Chart */}
      <div className="flex flex-col gap-3 my-2">
        {poll.options.map((option, idx) => {
          const pct = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
          return (
            <div key={idx}>
              <div className="flex justify-between items-end mb-1.5">
                <span className="text-sm font-medium text-ink truncate pr-2">{option.text}</span>
                <span className="text-xs font-bold text-ink-muted whitespace-nowrap">{pct}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                  role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-4 border-t border-line">
        <button 
          className={`btn btn-sm ${poll.isOpen ? 'btn-secondary text-warn' : 'btn-secondary text-success'}`}
          onClick={() => onToggle && onToggle(poll._id, poll.isOpen)}>
          {poll.isOpen ? 'Close Poll' : 'Reopen'}
        </button>
        <button className="btn btn-sm btn-ghost text-danger hover:bg-red-50 hover:text-danger ml-auto"
          onClick={() => onDelete && onDelete(poll._id)}>
          Delete
        </button>
      </div>
    </div>
  );
}

export default PollCard;
