import { useMemo, useState } from "react";

function StepAssignStudents({
  basic,
  setBasic,
  students,
  loadingStudents,
  selected,
  setSelected,
}) {
  const [selectedSections, setSelectedSections] = useState([]);
  const [search, setSearch] = useState("");

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
    setSelected(Array.from(activeIds));
  };

  const selectAllSections = () => {
    setSelectedSections(sections.map((s) => s.key));
    setSelected(students.map((s) => s._id));
  };

  const clearAll = () => {
    setSelectedSections([]);
    setSelected([]);
  };

  /* ── Toggle individual student ── */
  const toggleStudent = (id) =>
    setSelected((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );

  /* ── Shown students: selected sections OR individually toggled ── */
  const shownStudents = useMemo(() => {
    const activeIds = new Set(selected);
    return students
      .filter((s) => activeIds.has(s._id))
      .filter((s) =>
        search.trim()
          ? s.name?.toLowerCase().includes(search.toLowerCase()) ||
            String(s.rollNumber ?? "").includes(search) ||
            s.email?.toLowerCase().includes(search.toLowerCase())
          : true,
      );
  }, [students, selected, search]);

  /* ── Group label helper ── */
  const sectionLabel = (sec) => {
    const parts = [];
    if (sec.semester) parts.push(`Sem ${sec.semester}`);
    if (sec.studentClass) parts.push(sec.studentClass.toUpperCase());
    if (sec.division) parts.push(`Div ${sec.division.toUpperCase()}`);
    return parts.length ? parts.join(" · ") : "Ungrouped";
  };

  return (
    <div className="card p-8 space-y-8">
      {/* ── Header ── */}
      <div className="flex items-center gap-2">
        <svg
          className="w-5 h-5 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
        <h2 className="text-base font-bold text-ink">
          Step 3: Assign Students
        </h2>
      </div>

      {loadingStudents ? (
        <div className="flex justify-center py-16">
          <div className="spinner" />
        </div>
      ) : (
        <>
          {/* ── SECTION PICKER ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-ink">
                  Select sections
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedSections.length === 0
                    ? "Pick one or more sections — students will populate below"
                    : `${selectedSections.length} of ${sections.length} section${sections.length !== 1 ? "s" : ""} selected`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {selectedSections.length < sections.length && (
                  <button
                    className="text-xs font-medium text-primary hover:underline"
                    onClick={selectAllSections}
                  >
                    Select all
                  </button>
                )}
                {selectedSections.length > 0 && (
                  <button
                    className="text-xs font-medium text-slate-400 hover:text-ink"
                    onClick={clearAll}
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {sections.length === 0 ? (
              <div className="border border-dashed border-line rounded-xl py-10 text-center text-slate-400 text-sm">
                No students available to form sections.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {sections.map((sec) => {
                  const active = selectedSections.includes(sec.key);
                  return (
                    <button
                      key={sec.key}
                      onClick={() => toggleSection(sec)}
                      className={[
                        "relative flex flex-col items-start gap-1 rounded-xl border px-4 py-3 text-left transition-all",
                        active
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-line bg-white hover:border-slate-300 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      {/* Checkmark */}
                      <span
                        className={[
                          "absolute top-2.5 right-2.5 w-4 h-4 rounded-full flex items-center justify-center transition-all",
                          active
                            ? "bg-primary text-white"
                            : "border border-slate-300 bg-white",
                        ].join(" ")}
                      >
                        {active && (
                          <svg
                            className="w-2.5 h-2.5"
                            fill="none"
                            viewBox="0 0 12 12"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2 6l3 3 5-5"
                            />
                          </svg>
                        )}
                      </span>

                      <span
                        className={`text-xs font-bold pr-5 ${active ? "text-primary" : "text-ink"}`}
                      >
                        {sectionLabel(sec)}
                      </span>
                      <span className="text-xs text-slate-400">
                        {sec.count} student{sec.count !== 1 ? "s" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── STUDENT TABLE ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-ink">
                  Students assigned for exam
                  {selected.length > 0 && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      {selected.length}
                    </span>
                  )}
                </p>
                {selected.length > 0 && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    You can still uncheck individual students below
                  </p>
                )}
              </div>

              {/* Search */}
              {selected.length > 0 && (
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-4.35-4.35m0 0A7 7 0 103.5 10.5a7 7 0 0013.15 6.15z"
                    />
                  </svg>
                  <input
                    type="text"
                    className="form-input pl-8 py-1.5 text-sm"
                    placeholder="Search students…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="border border-line rounded-xl overflow-hidden">
              {selected.length === 0 ? (
                <div className="py-14 text-center">
                  <svg
                    className="mx-auto mb-3 w-8 h-8 text-slate-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17 20h5v-1a4 4 0 00-5.916-3.516M9 20H4v-1a4 4 0 015.916-3.516M15 7a4 4 0 11-8 0 4 4 0 018 0zm6 3a3 3 0 11-6 0 3 3 0 016 0zm-18 0a3 3 0 116 0 3 3 0 01-6 0z"
                    />
                  </svg>
                  <p className="text-sm text-slate-400">
                    No students selected yet. Choose a section above.
                  </p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 w-10"></th>
                        <th className="px-4 py-3 font-bold text-xs text-slate-500 uppercase tracking-wide">
                          Name
                        </th>
                        <th className="px-4 py-3 font-bold text-xs text-slate-500 uppercase tracking-wide">
                          Roll No.
                        </th>
                        <th className="px-4 py-3 font-bold text-xs text-slate-500 uppercase tracking-wide">
                          Email
                        </th>
                        <th className="px-4 py-3 font-bold text-xs text-slate-500 uppercase tracking-wide">
                          Section
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {shownStudents.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-8 text-center text-slate-400 text-sm"
                          >
                            No students match your search.
                          </td>
                        </tr>
                      ) : (
                        shownStudents.map((s) => {
                          const isChecked = selected.includes(s._id);
                          return (
                            <tr
                              key={s._id}
                              className="hover:bg-slate-50 cursor-pointer transition-colors"
                              onClick={() => toggleStudent(s._id)}
                            >
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  readOnly
                                  className="w-4 h-4 rounded border-slate-300 accent-primary"
                                />
                              </td>
                              <td className="px-4 py-3 font-medium text-ink">
                                {s.name}
                              </td>
                              <td className="px-4 py-3 font-mono text-slate-500 text-xs">
                                {s.rollNumber}
                              </td>
                              <td className="px-4 py-3 text-slate-500">
                                {s.email}
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                  {[
                                    s.semester ? `Sem ${s.semester}` : null,
                                    s.studentClass
                                      ? s.studentClass.toUpperCase()
                                      : null,
                                    s.division
                                      ? `Div ${s.division.toUpperCase()}`
                                      : null,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}
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

            {/* Summary footer */}
            {selected.length > 0 && shownStudents.length > 0 && (
              <p className="mt-2 text-xs text-slate-400 text-right">
                Showing {shownStudents.length} of {selected.length} selected
                student{selected.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default StepAssignStudents;
