import React, { useState } from 'react';
import { useExamSessionStore } from '../../store/examSessionStore';
import QuestionGrid from './QuestionGrid';

/**
 * MobilePalette
 * Floating FAB + bottom sheet for question palette on mobile/tablet.
 */
export default function MobilePalette({ onSelect, onSubmit }) {
  const [open, setOpen] = useState(false);
  const { getStats } = useExamSessionStore();
  const { total, attempted, remaining, marked } = getStats();

  return (
    <>
      {/* FAB */}
      <button
        id="mobile-palette-fab"
        onClick={() => setOpen(true)}
        aria-label="Open question palette"
        className="lg:hidden fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary-dark transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
        {/* Badge */}
        {remaining > 0 && (
          <span className="absolute -top-1 -right-1 bg-danger text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {remaining > 99 ? '99+' : remaining}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Bottom sheet */}
      <div
        id="mobile-palette-sheet"
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl
          transition-transform duration-300 ease-in-out ${open ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ maxHeight: '80vh', overflowY: 'auto' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-ink">Question Palette</h2>
            <button onClick={() => setOpen(false)} className="text-ink-muted hover:text-ink">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            <MobileStat label="Answered" value={attempted} colorClass="text-primary bg-primary-bg" />
            <MobileStat label="Marked" value={marked} colorClass="text-amber-600 bg-amber-50" />
            <MobileStat label="Remaining" value={remaining} colorClass="text-ink-dim bg-slate-50" />
          </div>

          {/* Grid */}
          <QuestionGrid
            onSelect={(idx) => {
              onSelect(idx);
              setOpen(false);
            }}
          />

          <div className="mt-5 pt-4 border-t border-line">
            <button
              id="mobile-submit-btn"
              onClick={() => {
                setOpen(false);
                onSubmit();
              }}
              className="btn btn-primary w-full justify-center btn-lg"
            >
              Submit Exam
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function MobileStat({ label, value, colorClass }) {
  return (
    <div className={`${colorClass} rounded-xl p-2.5 text-center`}>
      <p className="text-lg font-extrabold leading-none">{value}</p>
      <p className="text-[10px] text-ink-muted mt-1 font-medium">{label}</p>
    </div>
  );
}
