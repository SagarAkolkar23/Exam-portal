import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreatePoll, useGetStudents } from '../api/queries';
import { getErrorMessage } from '../utils/helpers';

function CreatePoll() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Visibility and Assignment State
  const [isPublic, setIsPublic] = useState(true);
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [selectedSections, setSelectedSections] = useState([]);
  const [search, setSearch] = useState('');

  const { mutateAsync: createPoll } = useCreatePoll();

  // Fetch student roster only if private poll option is toggled
  const { data: students = [], isLoading: loadingStudents } = useGetStudents(!isPublic);

  /* ── Derive unique sections from student list ── */
  const sections = useMemo(() => {
    const map = new Map();
    students.forEach((s) => {
      const key = `${s.semester ?? ""}__${(s.studentClass ?? "").toLowerCase()}__${(s.division ?? "").toLowerCase()}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          semester: s.semester ?? null,
          studentClass: s.studentClass ?? "",
          division: s.division ?? "",
          count: 0,
          ids: [],
        });
      }
      const sec = map.get(key);
      sec.count++;
      sec.ids.push(s._id);
    });
    return Array.from(map.values()).sort((a, b) => {
      if (a.semester !== b.semester)
        return (a.semester ?? 0) - (b.semester ?? 0);
      if (a.studentClass !== b.studentClass)
        return a.studentClass.localeCompare(b.studentClass);
      return a.division.localeCompare(b.division);
    });
  }, [students]);

  /* ── Toggle a section card ── */
  const toggleSection = (sec) => {
    const isOn = selectedSections.includes(sec.key);
    const nextSections = isOn
      ? selectedSections.filter((k) => k !== sec.key)
      : [...selectedSections, sec.key];
    setSelectedSections(nextSections);

    /* Recompute selected student IDs from all active sections */
    const activeIds = new Set();
    sections.forEach((s) => {
      if (nextSections.includes(s.key))
        s.ids.forEach((id) => activeIds.add(id));
    });
    setAssignedStudents(Array.from(activeIds));
  };

  const selectAllSections = () => {
    setSelectedSections(sections.map((s) => s.key));
    setAssignedStudents(students.map((s) => s._id));
  };

  const clearAll = () => {
    setSelectedSections([]);
    setAssignedStudents([]);
  };

  /* ── Toggle individual student ── */
  const toggleStudent = (id) =>
    setAssignedStudents((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
    );

  /* ── Shown students: selected sections OR individually toggled ── */
  const shownStudents = useMemo(() => {
    const activeIds = new Set(assignedStudents);
    return students
      .filter((s) => activeIds.has(s._id))
      .filter((s) =>
        search.trim()
          ? s.name?.toLowerCase().includes(search.toLowerCase()) ||
            String(s.rollNumber ?? "").includes(search) ||
            s.email?.toLowerCase().includes(search.toLowerCase())
          : true
      );
  }, [students, assignedStudents, search]);

  /* ── Group label helper ── */
  const sectionLabel = (sec) => {
    const parts = [];
    if (sec.semester) parts.push(`Sem ${sec.semester}`);
    if (sec.studentClass) parts.push(sec.studentClass.toUpperCase());
    if (sec.division) parts.push(`Div ${sec.division.toUpperCase()}`);
    return parts.length ? parts.join(" · ") : "Ungrouped";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!question.trim()) { setError('Poll question is required.'); return; }
    if (options.some((o) => !o.trim())) { setError('All options must have text.'); return; }
    if (!isPublic && assignedStudents.length === 0) {
      setError('Please assign at least one student for private polls.');
      return;
    }
    setLoading(true);
    try {
      await createPoll({
        title,
        question,
        options: options.map((text) => ({ text })),
        isPublic,
        sharedWith: isPublic ? [] : assignedStudents
      });
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

          {/* Visibility toggle */}
          <div className="border-t border-line pt-6">
            <label className="form-label text-slate-500 mb-3">POLL VISIBILITY</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className={`flex flex-col items-start gap-1 p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  isPublic
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-line bg-white hover:border-slate-300'
                }`}
                onClick={() => { setIsPublic(true); setAssignedStudents([]); }}
              >
                <span className={`text-sm font-bold ${isPublic ? 'text-primary' : 'text-ink'}`}>Public</span>
                <span className="text-xs text-slate-400">All students can see and vote on this poll.</span>
              </button>
              <button
                type="button"
                className={`flex flex-col items-start gap-1 p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  !isPublic
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-line bg-white hover:border-slate-300'
                }`}
                onClick={() => setIsPublic(false)}
              >
                <span className={`text-sm font-bold ${!isPublic ? 'text-primary' : 'text-ink'}`}>Private</span>
                <span className="text-xs text-slate-400">Only specific students you assign will be notified and can vote.</span>
              </button>
            </div>
          </div>

          {/* Student Selector UI (Private only) */}
          {!isPublic && (
            <div className="border-t border-line pt-6 space-y-6 animate-[fadeIn_0.3s_ease]">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <h3 className="text-base font-bold text-ink">Assign Students</h3>
              </div>

              {loadingStudents ? (
                <div className="flex justify-center py-10">
                  <div className="spinner" />
                </div>
              ) : (
                <>
                  {/* Section picker */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select sections</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {selectedSections.length === 0
                            ? "Pick one or more sections — students will populate below"
                            : `${selectedSections.length} of ${sections.length} section${sections.length !== 1 ? "s" : ""} selected`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {selectedSections.length < sections.length && (
                          <button type="button" className="text-xs font-semibold text-primary hover:underline cursor-pointer" onClick={selectAllSections}>
                            Select all
                          </button>
                        )}
                        {selectedSections.length > 0 && (
                          <button type="button" className="text-xs font-semibold text-slate-400 hover:text-ink cursor-pointer" onClick={clearAll}>
                            Clear all
                          </button>
                        )}
                      </div>
                    </div>

                    {sections.length === 0 ? (
                      <div className="border border-dashed border-line rounded-xl py-6 text-center text-slate-400 text-sm">
                        No students available to form sections.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {sections.map((sec) => {
                          const active = selectedSections.includes(sec.key);
                          return (
                            <button
                              key={sec.key}
                              type="button"
                              onClick={() => toggleSection(sec)}
                              className={[
                                "relative flex flex-col items-start gap-1 rounded-xl border px-4 py-3 text-left transition-all cursor-pointer",
                                active
                                  ? "border-primary bg-primary/5 shadow-sm"
                                  : "border-line bg-white hover:border-slate-300 hover:bg-slate-50",
                              ].join(" ")}
                            >
                              <span className={[
                                "absolute top-2.5 right-2.5 w-4 h-4 rounded-full flex items-center justify-center transition-all",
                                active ? "bg-primary text-white" : "border border-slate-300 bg-white",
                              ].join(" ")}
                              >
                                {active && (
                                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                                  </svg>
                                )}
                              </span>
                              <span className={`text-xs font-bold pr-5 ${active ? "text-primary" : "text-ink"}`}>
                                {sectionLabel(sec)}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {sec.count} student{sec.count !== 1 ? "s" : ""}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Student Listing Table */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Students assigned to poll
                          {assignedStudents.length > 0 && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                              {assignedStudents.length}
                            </span>
                          )}
                        </p>
                      </div>

                      {assignedStudents.length > 0 && (
                        <div className="relative">
                          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7 7 0 103.5 10.5a7 7 0 0013.15 6.15z" />
                          </svg>
                          <input
                            type="text"
                            className="form-input pl-8 py-1 text-xs"
                            placeholder="Search students…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                          />
                        </div>
                      )}
                    </div>

                    <div className="border border-line rounded-xl overflow-hidden bg-slate-50/30">
                      {assignedStudents.length === 0 ? (
                        <div className="py-8 text-center bg-slate-50/50">
                          <p className="text-xs text-slate-400">No students selected yet. Choose a section above.</p>
                        </div>
                      ) : (
                        <div className="max-h-60 overflow-y-auto">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                              <tr>
                                <th className="px-4 py-2 w-10"></th>
                                <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wide">Name</th>
                                <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wide">Roll No.</th>
                                <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wide">Section</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {shownStudents.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="px-4 py-4 text-center text-slate-400">
                                    No students match your search.
                                  </td>
                                </tr>
                              ) : (
                                shownStudents.map((s) => {
                                  const isChecked = assignedStudents.includes(s._id);
                                  return (
                                    <tr
                                      key={s._id}
                                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                                      onClick={() => toggleStudent(s._id)}
                                    >
                                      <td className="px-4 py-2">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          readOnly
                                          className="w-4 h-4 rounded border-slate-300 accent-primary"
                                        />
                                      </td>
                                      <td className="px-4 py-2 font-medium text-ink">{s.name}</td>
                                      <td className="px-4 py-2 font-mono text-slate-500">{s.rollNumber}</td>
                                      <td className="px-4 py-2">
                                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                                          {[
                                            s.semester ? `Sem ${s.semester}` : null,
                                            s.studentClass ? s.studentClass.toUpperCase() : null,
                                            s.division ? `Div ${s.division.toUpperCase()}` : null,
                                          ].filter(Boolean).join(" · ")}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button type="submit" className="btn btn-primary btn-lg cursor-pointer" disabled={loading}>
              {loading ? <><span className="spinner spinner-sm border-white/30 border-t-white" /> Creating...</> : 'Publish Poll'}
            </button>
          </div>
          
        </div>
      </form>
    </div>
  );
}

export default CreatePoll;
