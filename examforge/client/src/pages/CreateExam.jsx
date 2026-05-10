import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import QuestionBuilder from '../components/QuestionBuilder';
import ExamReview from '../components/ExamReview';
import { getErrorMessage } from '../utils/helpers';

const STEPS = ['Basic info', 'Questions', 'Assign students', 'Review'];
const emptyQ = () => ({ text: '', type: 'mcq', options: ['', '', '', ''], correctIndex: 0, marks: 1 });

function CreateExam({ isEditing = false }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [basic, setBasic] = useState({
    title: '',
    description: '',
    duration: 60,
    totalMarks: '',
    scheduledStart: '',
    scheduledEnd: '',
    latestJoinTime: '',
    shuffleOptions: true,
    showResultAfterSubmit: false,
  });

  // Rules: array of rule strings
  const [rules, setRules] = useState(['']);

  const [questions, setQuestions] = useState([emptyQ()]);
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Auto-compute scheduledEnd from start + duration
  useEffect(() => {
    if (basic.scheduledStart && basic.duration) {
      const start = new Date(basic.scheduledStart);
      if (!isNaN(start)) {
        const end = new Date(start.getTime() + basic.duration * 60000);
        setBasic((f) => ({ ...f, scheduledEnd: end.toISOString().slice(0, 16) }));
      }
    }
  }, [basic.scheduledStart, basic.duration]);

  // Load existing exam if editing
  useEffect(() => {
    if (isEditing && id) {
      setLoading(true);
      api.get(`/exams/${id}`)
        .then(({ data }) => {
          const d = data.scheduledStart ? new Date(data.scheduledStart) : null;
          const lj = data.latestJoinTime ? new Date(data.latestJoinTime) : null;
          setBasic({
            title: data.title || '',
            description: data.description || '',
            duration: data.duration || 60,
            totalMarks: data.totalMarks || '',
            scheduledStart: d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
            scheduledEnd: '',
            latestJoinTime: lj ? new Date(lj.getTime() - lj.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
            shuffleOptions: data.shuffleOptions ?? true,
            showResultAfterSubmit: data.showResultAfterSubmit ?? false,
          });
          setRules(data.rules && data.rules.length ? data.rules : ['']);
          setQuestions(data.questions && data.questions.length ? data.questions : [emptyQ()]);
          setSelected((data.assignedStudents || []).map((s) => s._id || s));
          setStep(4); // Jump to review step
        })
        .catch((err) => setError(getErrorMessage(err)))
        .finally(() => setLoading(false));
    }
  }, [isEditing, id]);

  // Load students when reaching step 3 (or if editing so we have student details if they go back)
  useEffect(() => {
    if ((step !== 3 && !isEditing) || students.length) return;
    setLoadingStudents(true);
    api
      .get('/students')
      .then(({ data }) => setStudents(data))
      .catch(() => {})
      .finally(() => setLoadingStudents(false));
  }, [step, isEditing]);

  // ── Rules helpers ──────────────────────────────────────────────────────────
  const addRule = () => setRules((r) => [...r, '']);
  const updateRule = (i, val) =>
    setRules((r) => r.map((x, idx) => (idx === i ? val : x)));
  const removeRule = (i) =>
    setRules((r) => (r.length > 1 ? r.filter((_, idx) => idx !== i) : ['']));

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    if (step === 1) {
      if (!basic.title.trim()) {
        setError('Exam title is required.');
        return false;
      }
      if (!basic.duration || basic.duration < 1) {
        setError('Duration must be at least 1 minute.');
        return false;
      }
    }
    if (step === 2) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.text.trim()) {
          setError(`Question ${i + 1}: question text is required.`);
          return false;
        }
        if ((q.type || 'mcq') === 'mcq') {
          if (!q.options || q.options.some((o) => !o.trim())) {
            setError(`Question ${i + 1}: all 4 options must be filled.`);
            return false;
          }
          if (q.correctIndex === undefined || q.correctIndex === null) {
            setError(`Question ${i + 1}: please mark the correct answer.`);
            return false;
          }
        }
      }
    }
    setError('');
    return true;
  };

  const next = () => { if (validate()) setStep((s) => Math.min(s + 1, 4)); };
  const prev = () => { setError(''); setStep((s) => Math.max(s - 1, 1)); };

  // Jump to a specific step (used by 'Edit' buttons in review)
  const jumpToStep = (targetStep) => {
    setError('');
    setStep(targetStep);
  };

  const filtered = students.filter((s) =>
    [s.name, s.rollNumber, s.email].some((f) =>
      f?.toLowerCase().includes(search.toLowerCase())
    )
  );
  const toggle = (id) =>
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  // ── Save / Publish ─────────────────────────────────────────────────────────
  const handleSave = async (publish = false) => {
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      const cleanRules = rules.filter((r) => r.trim());
      const payload = {
        ...basic,
        duration: Number(basic.duration),
        totalMarks: basic.totalMarks !== '' ? Number(basic.totalMarks) : 0,
        scheduledStart: basic.scheduledStart || undefined,
        scheduledEnd: basic.scheduledEnd || undefined,
        latestJoinTime: basic.latestJoinTime || undefined,
        questions,
        assignedStudents: selected,
        rules: cleanRules,
      };

      let examId = id;
      if (isEditing && id) {
        await api.put(`/exams/${id}`, payload);
      } else {
        const { data } = await api.post('/exams', payload);
        examId = data._id;
      }
      
      if (publish) await api.post(`/exams/${examId}/publish`);
      navigate('/teacher/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Derived stats for review ───────────────────────────────────────────────
  const mcqCount = questions.filter((q) => (q.type || 'mcq') === 'mcq').length;
  const descCount = questions.filter((q) => q.type === 'descriptive').length;
  const sumMarks = questions.reduce((acc, q) => acc + (q.marks || 1), 0);

  return (
    <div className="animate-[fadeIn_0.3s_ease] max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-extrabold text-ink">{isEditing ? 'Edit Draft Exam' : 'Create New Exam'}</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/teacher/dashboard')}>
          Cancel
        </button>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-10 px-8 relative">
        <div className="absolute top-1/2 left-16 right-16 h-px bg-slate-200 -z-10 -translate-y-1/2" />
        {STEPS.map((label, i) => {
          const isActive = step === i + 1;
          const isDone = step > i + 1;
          return (
            <div key={i} className="flex flex-col items-center gap-2 bg-surface px-4">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                  ${isDone || isActive ? 'bg-primary text-white' : 'bg-white border border-slate-300 text-slate-400'}`}
              >
                {isDone ? '✓' : i + 1}
              </div>
              <span className={`text-sm font-medium ${isActive ? 'text-primary' : isDone ? 'text-ink' : 'text-slate-400'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {error && <div className="alert alert-error mb-6">{error}</div>}

      {/* ── Step 1: Basic Info ── */}
      {step === 1 && (
        <div className="card p-8">
          <div className="flex items-center gap-2 mb-6">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-base font-bold text-ink">Step 1: Basic Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="form-group md:col-span-2">
              <label className="form-label text-slate-500">EXAM TITLE *</label>
              <input
                type="text"
                className="form-input py-2.5"
                placeholder="e.g. Advanced Macroeconomics — Mid-Semester Test"
                value={basic.title}
                onChange={(e) => setBasic((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            {/* Description */}
            <div className="form-group md:col-span-2">
              <label className="form-label text-slate-500">DESCRIPTION</label>
              <textarea
                className="form-textarea"
                placeholder="Brief overview of the exam scope, topics covered, etc."
                rows={3}
                value={basic.description}
                onChange={(e) => setBasic((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            {/* Duration */}
            <div className="form-group">
              <label className="form-label text-slate-500">DURATION (MINUTES) *</label>
              <input
                type="number"
                min={1}
                className="form-input py-2.5"
                value={basic.duration}
                onChange={(e) => setBasic((f) => ({ ...f, duration: Number(e.target.value) }))}
              />
            </div>

            {/* Total Marks */}
            <div className="form-group">
              <label className="form-label text-slate-500">TOTAL MARKS</label>
              <input
                type="number"
                min={0}
                className="form-input py-2.5"
                placeholder="e.g. 100"
                value={basic.totalMarks}
                onChange={(e) => setBasic((f) => ({ ...f, totalMarks: e.target.value }))}
              />
              <p className="text-xs text-slate-400 mt-1">
                Displayed to students as "out of X". Leave 0 to auto-sum from question marks.
              </p>
            </div>

            {/* Scheduled Start */}
            <div className="form-group">
              <label className="form-label text-slate-500">SCHEDULED START TIME</label>
              <input
                type="datetime-local"
                className="form-input py-2.5"
                value={basic.scheduledStart}
                onChange={(e) => setBasic((f) => ({ ...f, scheduledStart: e.target.value }))}
              />
            </div>

            {/* Latest Join Time */}
            <div className="form-group">
              <label className="form-label text-slate-500">JOINING TIME</label>
              <input
                type="datetime-local"
                className="form-input py-2.5"
                value={basic.latestJoinTime}
                onChange={(e) => setBasic((f) => ({ ...f, latestJoinTime: e.target.value }))}
              />
              <p className="text-xs text-slate-400 mt-1">
                Students cannot join after this time. Leave empty to allow joining anytime.
              </p>
            </div>

            {/* Toggles */}
            <div className="md:col-span-2 mt-2 space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-line">
                <span className="text-sm font-medium text-ink">Shuffle questions &amp; options</span>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={basic.shuffleOptions}
                    onChange={(e) => setBasic((f) => ({ ...f, shuffleOptions: e.target.checked }))}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-line">
                <span className="text-sm font-medium text-ink">Show score after submission</span>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={basic.showResultAfterSubmit}
                    onChange={(e) => setBasic((f) => ({ ...f, showResultAfterSubmit: e.target.checked }))}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            {/* Rules */}
            <div className="md:col-span-2 mt-2">
              <div className="flex items-center justify-between mb-3">
                <label className="form-label text-slate-500 mb-0">EXAM RULES &amp; INSTRUCTIONS</label>
                <button
                  type="button"
                  onClick={addRule}
                  className="btn btn-secondary btn-sm"
                >
                  + Add Rule
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {rules.map((rule, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-5 text-center flex-shrink-0">
                      {i + 1}.
                    </span>
                    <input
                      type="text"
                      className="form-input py-2 flex-1"
                      placeholder={
                        i === 0
                          ? 'e.g. No calculators are allowed'
                          : i === 1
                          ? 'e.g. Attempt all questions'
                          : 'Add a rule...'
                      }
                      value={rule}
                      onChange={(e) => updateRule(i, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeRule(i)}
                      className="text-slate-300 hover:text-danger transition-colors flex-shrink-0"
                      title="Remove rule"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              {rules.filter((r) => r.trim()).length === 0 && (
                <p className="text-xs text-slate-400 mt-2">
                  No rules added yet. Rules are shown to students before they start the exam.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Questions ── */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-base font-bold text-ink">Step 2: Question Builder</h2>
              <span className="badge badge-draft ml-1">
                {questions.length} question{questions.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setQuestions((q) => [...q, { ...emptyQ(), type: 'descriptive', options: undefined, correctIndex: undefined }])}
              >
                + Descriptive
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setQuestions((q) => [...q, emptyQ()])}
              >
                + MCQ
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {questions.map((q, idx) => (
              <QuestionBuilder
                key={idx}
                index={idx}
                question={q}
                onChange={(u) => setQuestions((qs) => qs.map((old, i) => (i === idx ? u : old)))}
                onRemove={() => setQuestions((qs) => qs.filter((_, i) => i !== idx))}
                canRemove={questions.length > 1}
              />
            ))}
          </div>

          {/* Question type summary bar */}
          <div className="card px-6 py-4 flex items-center gap-6 text-sm">
            <span className="text-slate-500">Summary:</span>
            <span className="font-semibold text-ink">{questions.length} total</span>
            <span className="text-primary font-medium">{mcqCount} MCQ</span>
            <span className="text-amber-600 font-medium">{descCount} Descriptive</span>
            <span className="ml-auto text-slate-500">
              Total marks from questions: <strong className="text-ink">{sumMarks}</strong>
            </span>
          </div>
        </div>
      )}

      {/* ── Step 3: Assign Students ── */}
      {step === 3 && (
        <div className="card p-8">
          <div className="flex items-center gap-2 mb-6">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h2 className="text-base font-bold text-ink">Step 3: Assign Students</h2>
          </div>

          <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
            <div className="relative max-w-sm w-full">
              <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                className="form-input pl-10 py-2.5"
                placeholder="Search by name, roll no or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-primary">{selected.length} selected</span>
              <button
                className="text-sm font-medium text-slate-500 hover:text-ink"
                onClick={() => setSelected(filtered.map((s) => s._id))}
              >
                Select All
              </button>
              <button
                className="text-sm font-medium text-slate-500 hover:text-ink"
                onClick={() => setSelected([])}
              >
                Deselect All
              </button>
            </div>
          </div>

          {loadingStudents ? (
            <div className="flex justify-center py-12">
              <div className="spinner" />
            </div>
          ) : (
            <div className="border border-line rounded-xl overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 w-12"></th>
                    <th className="px-4 py-3 font-bold text-xs text-slate-500 uppercase">Student Name</th>
                    <th className="px-4 py-3 font-bold text-xs text-slate-500 uppercase">Roll No.</th>
                    <th className="px-4 py-3 font-bold text-xs text-slate-500 uppercase">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filtered.map((s) => {
                    const checked = selected.includes(s._id);
                    return (
                      <tr key={s._id} className="hover:bg-slate-50 cursor-pointer" onClick={() => toggle(s._id)}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            readOnly
                            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary"
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-ink">{s.name}</td>
                        <td className="px-4 py-3 font-mono text-slate-500">{s.rollNumber}</td>
                        <td className="px-4 py-3 text-slate-500">{s.email}</td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-slate-400 text-sm">
                        No students found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Step 4: Review ── */}
      {step === 4 && (
        <ExamReview
          basic={basic}
          questions={questions}
          rules={rules}
          selectedStudentsCount={selected.length}
          loading={loading}
          onJumpToStep={jumpToStep}
          onSave={handleSave}
        />
      )}

      {/* Nav buttons */}
      <div className="flex items-center justify-between mt-8">
        {step < 4 && (
          <>
            <button className="btn btn-secondary" onClick={prev} disabled={step === 1 || loading}>
              ← Previous
            </button>
            <button className="btn btn-primary" onClick={next}>
              Next Step →
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default CreateExam;
