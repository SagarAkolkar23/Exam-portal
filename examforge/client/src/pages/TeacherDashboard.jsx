import React, { useState, useEffect } from "react";
import { useGetExams } from "../api/queries";
import { useAuth } from "../context/AuthContext";
import { useAddTestStudent } from "../api/queries";
import { getErrorMessage } from "../utils/helpers";

function StatCard({
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

function TeacherDashboard() {
  const { user } = useAuth();
  const { data: exams = [], error: examsError } = useGetExams();
  const { mutateAsync: addTestStudent } = useAddTestStudent();

  const [error, setError] = useState("");

  // Temporary Add Student Modal
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [batchDetails, setBatchDetails] = useState({
    semester: 1,
    studentClass: "",
    division: "",
    department: "",
    year: 1,
  });
  const [studentsList, setStudentsList] = useState([
    { name: "", email: "", rollNumber: "", password: "" },
  ]);

  useEffect(() => {
    if (examsError) setError(getErrorMessage(examsError));
  }, [examsError]);

  const handleAddTestStudent = async (e) => {
    e.preventDefault();
    try {
      // Validate
      const validStudents = studentsList.filter(
        (s) => s.name && s.email && s.rollNumber,
      );
      if (validStudents.length === 0) {
        return alert("Please add at least one valid student.");
      }
      const payload = validStudents.map((s) => ({ ...batchDetails, ...s }));
      await addTestStudent(payload);
      alert("Students added successfully!");
      setShowStudentModal(false);
      setStudentsList([{ name: "", email: "", rollNumber: "", password: "" }]);
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const liveCount = exams.filter((e) => e.status === "live").length;
  const scheduledCount = exams.filter((e) => e.status === "scheduled").length;
  const draftCount = exams.filter((e) => e.status === "draft").length;
  const totalStudents = new Set(
    exams.flatMap((e) =>
      (e.assignedStudents || []).map((s) => (s._id || s).toString()),
    ),
  ).size;

  return (
    <div className="animate-[fadeIn_0.3s_ease] space-y-8">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex justify-end">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowStudentModal(true)}
          >
            + Add Students
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="Live Exams"
          value={liveCount}
          accent="bg-emerald-100 text-emerald-600"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M8.464 15.536a5 5 0 010-7.072m7.072 0a5 5 0 010 7.072M12 12h.01"
              />
            </svg>
          }
        />
        <StatCard
          title="Scheduled"
          value={scheduledCount}
          accent="bg-blue-100 text-blue-600"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          }
        />
        <StatCard
          title="Drafts"
          value={draftCount}
          accent="bg-amber-100 text-amber-600"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          }
        />
        <StatCard
          title="Total Students"
          value={totalStudents}
          accent="bg-purple-100 text-purple-600"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          }
        />
      </div>

      {/* ── Temporary Add Student Modal ── */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6 flex flex-col max-h-[90vh] animate-[slideUp_0.2s_ease]">
            <h3 className="text-xl font-bold text-ink mb-4">
              Add Test Students
            </h3>
            <form
              onSubmit={handleAddTestStudent}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="grid grid-cols-5 gap-4 mb-6 shrink-0">
                <div>
                  <label className="form-label text-slate-500">Semester</label>
                  <input
                    required
                    type="number"
                    min="1"
                    className="form-input py-1.5"
                    value={batchDetails.semester}
                    onChange={(e) =>
                      setBatchDetails({
                        ...batchDetails,
                        semester: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="form-label text-slate-500">Class</label>
                  <input
                    required
                    type="text"
                    className="form-input py-1.5"
                    placeholder="e.g. SY"
                    value={batchDetails.studentClass}
                    onChange={(e) =>
                      setBatchDetails({
                        ...batchDetails,
                        studentClass: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="form-label text-slate-500">Division</label>
                  <input
                    required
                    type="text"
                    className="form-input py-1.5"
                    placeholder="e.g. A"
                    value={batchDetails.division}
                    onChange={(e) =>
                      setBatchDetails({
                        ...batchDetails,
                        division: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="form-label text-slate-500">
                    Department
                  </label>
                  <input
                    required
                    type="text"
                    className="form-input py-1.5"
                    placeholder="e.g. CS"
                    value={batchDetails.department}
                    onChange={(e) =>
                      setBatchDetails({
                        ...batchDetails,
                        department: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="form-label text-slate-500">Year</label>
                  <input
                    required
                    type="number"
                    min="1"
                    className="form-input py-1.5"
                    value={batchDetails.year}
                    onChange={(e) =>
                      setBatchDetails({ ...batchDetails, year: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto min-h-[200px] border border-slate-200 rounded-lg p-2 bg-slate-50">
                {studentsList.map((student, idx) => (
                  <div key={idx} className="flex gap-2 items-center mb-2">
                    <input
                      required
                      type="text"
                      className="form-input py-1.5 text-sm w-1/4"
                      placeholder="Name"
                      value={student.name}
                      onChange={(e) => {
                        const updated = [...studentsList];
                        updated[idx].name = e.target.value;
                        setStudentsList(updated);
                      }}
                    />
                    <input
                      required
                      type="email"
                      className="form-input py-1.5 text-sm w-1/4"
                      placeholder="Email"
                      value={student.email}
                      onChange={(e) => {
                        const updated = [...studentsList];
                        updated[idx].email = e.target.value;
                        setStudentsList(updated);
                      }}
                    />
                    <input
                      required
                      type="text"
                      className="form-input py-1.5 text-sm w-1/4"
                      placeholder="Roll No"
                      value={student.rollNumber}
                      onChange={(e) => {
                        const updated = [...studentsList];
                        updated[idx].rollNumber = e.target.value;
                        setStudentsList(updated);
                      }}
                    />
                    <input
                      type="text"
                      className="form-input py-1.5 text-sm w-1/4"
                      placeholder="Password (opt)"
                      value={student.password}
                      onChange={(e) => {
                        const updated = [...studentsList];
                        updated[idx].password = e.target.value;
                        setStudentsList(updated);
                      }}
                    />
                    {studentsList.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setStudentsList(
                            studentsList.filter((_, i) => i !== idx),
                          )
                        }
                        className="text-danger hover:bg-red-50 p-1.5 rounded-md"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setStudentsList([
                      ...studentsList,
                      { name: "", email: "", rollNumber: "", password: "" },
                    ])
                  }
                  className="text-sm font-semibold text-primary hover:text-primary-focus mt-2 px-2"
                >
                  + Add Row
                </button>
              </div>

              <div className="flex gap-3 justify-end mt-6 shrink-0">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowStudentModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Students
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherDashboard;
