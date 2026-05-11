import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreatePoll } from '../api/queries';
import { getErrorMessage } from '../utils/helpers';

function CreatePoll() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { mutateAsync: createPoll } = useCreatePoll();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!question.trim()) { setError('Poll question is required.'); return; }
    if (options.some((o) => !o.trim())) { setError('All options must have text.'); return; }
    setLoading(true);
    try {
      await createPoll({ title, question, options: options.map((text) => ({ text })) });
      navigate('/teacher/dashboard');
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  return (
    <div className="animate-[fadeIn_0.3s_ease] max-w-3xl mx-auto pb-12">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-extrabold text-ink">Create New Poll</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/teacher/dashboard')}>Cancel</button>
      </div>

      {error && <div className="alert alert-error mb-6">{error}</div>}

      <form onSubmit={handleSubmit} className="card p-8">
        <div className="flex flex-col gap-6">
          
          <div className="form-group">
            <label className="form-label text-slate-500">POLL TITLE (OPTIONAL)</label>
            <input type="text" className="form-input py-2.5"
              placeholder="e.g. Course Feedback"
              value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label text-slate-500">QUESTION *</label>
            <textarea className="form-textarea" rows={3}
              placeholder="What would you like to ask?"
              value={question} onChange={(e) => setQuestion(e.target.value)} required />
          </div>

          <div className="border-t border-line pt-6">
            <div className="flex items-center justify-between mb-4">
              <label className="form-label text-slate-500 m-0">OPTIONS ({options.length}/6)</label>
              <button type="button" className="text-sm font-semibold text-primary hover:text-primary-dark"
                onClick={() => options.length < 6 && setOptions((o) => [...o, ''])}
                disabled={options.length >= 6}>
                + Add Option
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center
                                   justify-center text-xs font-bold text-slate-500 flex-shrink-0">
                    {idx + 1}
                  </span>
                  <input type="text" className="form-input flex-1 py-2"
                    placeholder={`Option ${idx + 1}`}
                    value={opt} onChange={(e) => setOptions((o) => o.map((x, i) => i===idx ? e.target.value : x))}
                    required />
                  {options.length > 2 && (
                    <button type="button" className="p-2 text-slate-400 hover:text-danger rounded-md transition-colors"
                      onClick={() => setOptions((o) => o.filter((_, i) => i !== idx))}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? <><span className="spinner spinner-sm border-white/30 border-t-white" /> Creating...</> : 'Publish Poll'}
            </button>
          </div>
          
        </div>
      </form>
    </div>
  );
}

export default CreatePoll;
