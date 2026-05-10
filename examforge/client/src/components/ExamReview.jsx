import React, { useState } from 'react';

function ExamReview({
  basic,
  questions,
  rules,
  selectedStudentsCount,
  loading,
  onJumpToStep,
  onSave,
}) {
  const [reviewSlide, setReviewSlide] = useState(0); // 0: Basic, 1: Rules, 2: Questions

  const sumMarks = questions.reduce((acc, q) => acc + (q.marks || 1), 0);
  const mcqCount = questions.filter((q) => (q.type || 'mcq') === 'mcq').length;
  const descCount = questions.filter((q) => q.type === 'descriptive').length;
  const cleanRulesPreview = rules.filter((r) => r.trim());

  return (
    <div className="space-y-6">
      <div className="card p-8">
        <div className="flex items-center gap-2 mb-6">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h2 className="text-base font-bold text-ink">Step 4: Review Preview</h2>
        </div>

        {/* Slide Navigation Tabs */}
        <div className="flex gap-2 border-b border-line mb-8 pb-4">
          {['Basic Details', 'Rules', 'Questions'].map((slideName, idx) => (
            <button
              key={idx}
              onClick={() => setReviewSlide(idx)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                reviewSlide === idx
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-ink'
              }`}
            >
              {slideName}
            </button>
          ))}
        </div>

        <div className="min-h-[300px]">
          {/* SLIDE 1: Basic Details */}
          {reviewSlide === 0 && (
            <div className="animate-[fadeIn_0.3s_ease]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-ink">Basic Details</h3>
                <button onClick={() => onJumpToStep(1)} className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  Edit Info
                </button>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 grid grid-cols-2 gap-y-5 gap-x-8">
                <div className="col-span-2">
                  <div className="text-xs text-slate-500 font-bold uppercase mb-1">Title</div>
                  <div className="text-sm font-semibold text-ink">{basic.title}</div>
                </div>
                {basic.description && (
                  <div className="col-span-2">
                    <div className="text-xs text-slate-500 font-bold uppercase mb-1">Description</div>
                    <div className="text-sm text-ink-dim">{basic.description}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-slate-500 font-bold uppercase mb-1">Duration</div>
                  <div className="text-sm font-medium text-ink">{basic.duration} mins</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold uppercase mb-1">Total Marks</div>
                  <div className="text-sm font-medium text-ink">
                    {basic.totalMarks !== '' && Number(basic.totalMarks) > 0
                      ? Number(basic.totalMarks)
                      : `${sumMarks} (from questions)`}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold uppercase mb-1">Scheduled Start</div>
                  <div className="text-sm font-medium text-ink">
                    {basic.scheduledStart ? new Date(basic.scheduledStart).toLocaleString() : 'Not scheduled'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold uppercase mb-1">Latest Joining Time</div>
                  <div className="text-sm font-medium text-ink">
                    {basic.latestJoinTime ? new Date(basic.latestJoinTime).toLocaleString() : 'Anytime after start'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold uppercase mb-1">Assigned Students</div>
                  <div className="text-sm font-medium text-ink">
                    {selectedStudentsCount} student{selectedStudentsCount !== 1 ? 's' : ''}{' '}
                    <button onClick={() => onJumpToStep(3)} className="text-primary hover:underline ml-1">(Edit)</button>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-slate-500 font-bold uppercase mb-1">Settings</div>
                  <div className="flex gap-3 flex-wrap">
                    <span className={`badge ${basic.shuffleOptions ? 'badge-open' : 'badge-closed'}`}>
                      Shuffle Options
                    </span>
                    <span className={`badge ${basic.showResultAfterSubmit ? 'badge-open' : 'badge-closed'}`}>
                      Show Results
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 2: Rules */}
          {reviewSlide === 1 && (
            <div className="animate-[fadeIn_0.3s_ease]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-ink">Exam Rules</h3>
                <button onClick={() => onJumpToStep(1)} className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  Edit Rules
                </button>
              </div>
              {cleanRulesPreview.length > 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                  <ol className="flex flex-col gap-3">
                    {cleanRulesPreview.map((rule, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-amber-900">
                        <span className="font-bold text-amber-500 flex-shrink-0 mt-0.5">{i + 1}.</span>
                        <span className="leading-relaxed">{rule}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm">
                  No rules have been added for this exam.
                </div>
              )}
            </div>
          )}

          {/* SLIDE 3: Questions */}
          {reviewSlide === 2 && (
            <div className="animate-[fadeIn_0.3s_ease]">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-ink">Questions</h3>
                  <span className="badge badge-live">{questions.length} Total</span>
                </div>
                <button onClick={() => onJumpToStep(2)} className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  Edit Questions
                </button>
              </div>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {questions.map((q, i) => {
                  const isDesc = (q.type || 'mcq') === 'descriptive';
                  return (
                    <div key={i} className="border border-slate-200 rounded-xl p-5 bg-white relative">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="font-bold text-slate-400 mt-0.5">Q{i + 1}.</span>
                          <p className="font-medium text-ink leading-relaxed whitespace-pre-wrap">{q.text}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="bg-indigo-50 text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                            {isDesc ? 'Descriptive' : 'MCQ'}
                          </span>
                          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {q.marks || 1} Mark{q.marks !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      {!isDesc && q.options && (
                        <ul className="ml-8 space-y-2 mt-4">
                          {q.options.map((opt, oi) => (
                            <li key={oi} className={`text-sm flex items-center gap-2 ${q.correctIndex === oi ? 'text-success font-bold' : 'text-slate-600'}`}>
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${q.correctIndex === oi ? 'border-success bg-green-50' : 'border-slate-300'}`}>
                                {q.correctIndex === oi && <div className="w-2 h-2 rounded-full bg-success" />}
                              </div>
                              {opt}
                            </li>
                          ))}
                        </ul>
                      )}
                      {isDesc && (
                        <div className="ml-8 mt-4 bg-slate-50 border border-slate-200 border-dashed rounded-lg p-4 text-center text-slate-400 text-sm italic">
                          Student will provide a text answer here.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Save / Publish actions row */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-line">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setReviewSlide((s) => Math.max(0, s - 1))}
              disabled={reviewSlide === 0}
              className={`btn btn-secondary btn-sm ${reviewSlide === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              ← Slide
            </button>
            <button
              onClick={() => setReviewSlide((s) => Math.min(2, s + 1))}
              disabled={reviewSlide === 2}
              className={`btn btn-secondary btn-sm ${reviewSlide === 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Slide →
            </button>
          </div>
          <div className="flex gap-4">
            <button className="btn btn-secondary btn-lg" onClick={() => onSave(false)} disabled={loading}>
              Save as Draft
            </button>
            <button className="btn btn-primary btn-lg" onClick={() => onSave(true)} disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner spinner-sm border-white/30 border-t-white" />
                  Publishing...
                </>
              ) : (
                'Publish Exam'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExamReview;
