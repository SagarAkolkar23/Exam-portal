import React, { useState, useCallback } from 'react';
import { useExamSessionStore } from '../../store/examSessionStore';

/**
 * SubmitModal
 * Confirmation dialog before final submission.
 * Shows warning if there are unanswered or marked questions.
 */
export default function SubmitModal({ onConfirm, onCancel, submitting }) {
  const { getStats } = useExamSessionStore();
  const { total, attempted, remaining, marked } = getStats();

  const hasWarnings = remaining > 0 || marked > 0;

  return (
    <div
      id="submit-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-modal-title"
    >
      <div
        id="submit-modal"
        className="card w-full max-w-md p-6 animate-[fadeInUp_0.2s_ease-out]"
        role="document"
      >
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${
              hasWarnings
                ? 'bg-amber-100 text-amber-600'
                : 'bg-emerald-100 text-emerald-600'
            }`}
          >
            {hasWarnings ? '⚠️' : '🎉'}
          </div>
        </div>

        <h2
          id="submit-modal-title"
          className="text-center text-lg font-bold text-ink mb-1"
        >
          Submit Exam?
        </h2>
        <p className="text-center text-sm text-ink-muted mb-5">
          This action is final and cannot be undone.
        </p>

        {/* Stats summary */}
        <div className="bg-surface-alt rounded-xl p-4 mb-5 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xl font-extrabold text-primary">{attempted}</p>
            <p className="text-[11px] text-ink-muted mt-0.5">Answered</p>
          </div>
          <div>
            <p className="text-xl font-extrabold text-amber-500">{marked}</p>
            <p className="text-[11px] text-ink-muted mt-0.5">Marked</p>
          </div>
          <div>
            <p className={`text-xl font-extrabold ${remaining > 0 ? 'text-danger' : 'text-ink-dim'}`}>
              {remaining}
            </p>
            <p className="text-[11px] text-ink-muted mt-0.5">Skipped</p>
          </div>
        </div>

        {/* Warnings */}
        {remaining > 0 && (
          <div className="alert alert-warning mb-3">
            <span aria-hidden="true">⚠</span>
            <span>{remaining} question{remaining > 1 ? 's' : ''} left unanswered.</span>
          </div>
        )}
        {marked > 0 && (
          <div className="alert alert-warning mb-3">
            <span aria-hidden="true">🔖</span>
            <span>{marked} question{marked > 1 ? 's' : ''} marked for review.</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-2">
          <button
            id="modal-cancel-btn"
            onClick={onCancel}
            disabled={submitting}
            className="btn btn-secondary flex-1 justify-center"
          >
            Go Back
          </button>
          <button
            id="modal-confirm-btn"
            onClick={onConfirm}
            disabled={submitting}
            className="btn btn-primary flex-1 justify-center"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="spinner spinner-sm" /> Submitting…
              </span>
            ) : (
              'Submit Now'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
