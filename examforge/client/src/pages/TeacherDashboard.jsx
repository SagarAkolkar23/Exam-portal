import React, { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/helpers";
import { useAnalyticsStore } from "../store/analyticsStore";
import {
  useGetTeacherAnalyticsExams,
  useGetScoreDistribution,
  useGetCheatReport,
  useGetPolls,
  useGetClassesAndYears,
  useGetPollAnalytics,
} from "../api/queries";
import ScoreDistributionChart from "../components/analytics/ScoreDistributionChart";
import CheatDistributionChart from "../components/analytics/CheatDistributionChart";
import QuestionAnalysisChart from "../components/analytics/QuestionAnalysisChart";
import Select from "../components/analytics/Select";
import Pill from "../components/analytics/Pill";
import Skeleton from "../components/analytics/Skeleton";
import AddStudentModal from "../components/createExam.jsx/addStudent";
import ThresholdAnalysis from "../components/analytics/ThresholdAnalysis";
import PollResponseChart from "../components/analytics/PollResponseChart";
import PollParticipationChart from "../components/analytics/PollParticipationChart";

function TeacherDashboard() {
  const { user } = useAuth();

  const [showStudentModal, setShowStudentModal] = useState(false);

  const {
    examId,
    examTitle,
    semester,
    studentClass,
    division,
    year,
    availableSemesters,
    availableClasses,
    availableDivisions,
    setExam,
    setAvailableGroups,
    setSemester,
    setStudentClass,
    setDivision,
    setYear,
  } = useAnalyticsStore();

  const [activeTab, setActiveTab] = useState("exams"); // "exams" or "polls"
  const [selectedPollId, setSelectedPollId] = useState("");
  const [pollClass, setPollClass] = useState("");
  const [pollDivision, setPollDivision] = useState("");
  const [pollSearch, setPollSearch] = useState("");

  const { data: overviewData = [], isLoading: overviewLoading, error: overviewError } = useGetTeacherAnalyticsExams();

  const selectedExamGroups = useMemo(
    () => overviewData.find((e) => e._id === examId)?.groups ?? [],
    [overviewData, examId],
  );

  const { data: scoreData } = useGetScoreDistribution(!!examId);
  const { data: cheatData } = useGetCheatReport(!!examId);

  const { data: pollList = [], isLoading: loadingPolls } = useGetPolls();
  const { data: filterData } = useGetClassesAndYears();
  const classesList = filterData?.classes || [];
  const divisionsList = filterData?.divisions || [];

  const { data: pollAnalytics, isLoading: loadingPollAnalytics } = useGetPollAnalytics(
    selectedPollId,
    pollClass || undefined,
    pollDivision || undefined,
    activeTab === "polls" && !!selectedPollId
  );

  const filteredStudentDetails = useMemo(() => {
    const details = pollAnalytics?.studentDetails || [];
    if (!pollSearch.trim()) return details;
    const term = pollSearch.toLowerCase();
    return details.filter((s) =>
      s.name?.toLowerCase().includes(term) ||
      s.rollNumber?.toLowerCase().includes(term) ||
      s.email?.toLowerCase().includes(term)
    );
  }, [pollAnalytics, pollSearch]);

  const pollOptions = useMemo(() => {
    return pollList.map((p) => ({
      value: p._id,
      label: p.title ? `${p.title} (${p.question.substring(0, 30)}...)` : p.question.substring(0, 40),
    }));
  }, [pollList]);

  const handleExamChange = (id) => {
    if (!id) {
      setExam(null, "");
      return;
    }
    const exam = overviewData.find((e) => e._id === id);
    setExam(id, exam?.title ?? "");
    setAvailableGroups(exam?.groups ?? []);
  };

  const examOptions = overviewData
    .filter((e) => e.status !== "draft")
    .map((e) => ({ value: e._id, label: `${e.title} (${e.status})` }));


  return (
    <div className="animate-[fadeIn_0.3s_ease] space-y-8">
      
      {overviewError && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-3xl text-sm text-rose-600 font-semibold shadow-sm animate-pulse">
          {getErrorMessage(overviewError)}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          className={`py-3 px-1 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "exams"
              ? "border-indigo-600 text-indigo-600 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
          onClick={() => setActiveTab("exams")}
        >
          📝 Exam Analytics
        </button>
        <button
          className={`py-3 px-1 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "polls"
              ? "border-indigo-600 text-indigo-600 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
          onClick={() => setActiveTab("polls")}
        >
          📊 Poll Analytics
        </button>
      </div>

      {activeTab === "exams" ? (
        <>
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-wrap gap-4 items-end">
              <Select
                id="exam-select"
                label="Selected Exam"
                value={examId}
                onChange={handleExamChange}
                options={examOptions}
                placeholder={overviewLoading ? "Loading exams..." : "Select an Exam"}
                disabled={overviewLoading}
              />

              <Select
                id="semester-select"
                label="Semester"
                value={semester}
                onChange={(sem) => setSemester(sem, selectedExamGroups)}
                options={availableSemesters.map((s) => ({
                  value: s.toString(),
                  label: `Semester ${s}`,
                }))}
                placeholder="All Semesters"
                disabled={!examId || availableSemesters.length === 0}
              />

              <Select
                id="class-select"
                label="Class"
                value={studentClass}
                onChange={(cls) =>
                  setStudentClass(cls, selectedExamGroups, semester)
                }
                options={availableClasses.map((c) => ({ value: c, label: c }))}
                placeholder="All Classes"
                disabled={!semester || availableClasses.length === 0}
              />

              <Select
                id="division-select"
                label="Division"
                value={division}
                onChange={setDivision}
                options={availableDivisions.map((d) => ({
                  value: d,
                  label: `Division ${d}`,
                }))}
                placeholder="All Divisions"
                disabled={!studentClass || availableDivisions.length === 0}
              />

              <Select
                id="batch-select"
                label="Batch (Year)"
                value={year}
                onChange={setYear}
                options={[
                  { value: "1", label: "Year 1" },
                  { value: "2", label: "Year 2" },
                  { value: "3", label: "Year 3" },
                  { value: "4", label: "Year 4" },
                ]}
                placeholder="All Batches"
                disabled={!examId}
              />

              {/* Active filter chips */}
              {(semester || studentClass || division || year) && (
                <div className="flex items-center gap-2 flex-wrap self-end">
                  {semester && (
                    <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full border border-indigo-100">
                      Sem {semester}
                    </span>
                  )}
                  {studentClass && (
                    <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full border border-indigo-100">
                      {studentClass}
                    </span>
                  )}
                  {division && (
                    <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full border border-indigo-100">
                      Div {division}
                    </span>
                  )}
                  {year && (
                    <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full border border-indigo-100">
                      Year {year}
                    </span>
                  )}
                </div>
              )}

              {/* ── Add Student button ── */}
              <button
                type="button"
                onClick={() => setShowStudentModal(true)}
                className="ml-auto self-end btn btn-primary flex items-center gap-2 shrink-0"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Student
              </button>
            </div>
          </div>

          {/* ── No exam selected ───────────────────────────────────────────── */}
          {!examId && (
            <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white border border-slate-200/60 rounded-3xl shadow-sm">
              <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center text-4xl shadow-sm">
                📊
              </div>
              <h2 className="text-xl font-bold text-slate-700">No exam selected</h2>
              <p className="text-slate-400 text-sm font-medium max-w-sm text-center">
                Pick an exam from the filter bar above to see score distributions,
                integrity reports, and question-level analytics.
              </p>
            </div>
          )}

          {/* ── Summary pills ──────────────────────────────────────────────── */}
          {examId && scoreData && (
            <div className="flex flex-wrap gap-4">
              <Pill
                label="Assigned"
                value={scoreData.totalEligible}
                color="indigo"
              />
              <Pill
                label="Attempted"
                value={scoreData.totalAttempted}
                color="emerald"
              />
              <Pill
                label="Total Marks"
                value={scoreData.exam?.totalMarks}
                color="amber"
              />
              <Pill
                label="Cheats Flagged"
                value={cheatData?.report?.filter((r) => r.cheats > 0).length}
                color="rose"
              />
            </div>
          )}

          {/* ── Charts ─────────────────────────────────────────────────────── */}
          {examId && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ScoreDistributionChart />

              <CheatDistributionChart />

              <div className="xl:col-span-2">
                <QuestionAnalysisChart />
              </div>

              {/* ── Threshold Performance Analyzer ── */}
              <div className="xl:col-span-2">
                <ThresholdAnalysis
                  totalMarks={scoreData?.exam?.totalMarks ?? 100}
                />
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Poll Selector Block */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-wrap gap-4 items-end">
              <Select
                id="poll-select"
                label="Selected Poll"
                value={selectedPollId}
                onChange={setSelectedPollId}
                options={pollOptions}
                placeholder={loadingPolls ? "Loading polls..." : "Select a Poll"}
                disabled={loadingPolls}
              />

              <Select
                id="poll-class-select"
                label="Class"
                value={pollClass}
                onChange={setPollClass}
                options={classesList.map((c) => ({ value: c, label: c }))}
                placeholder="All Classes"
                disabled={classesList.length === 0}
              />

              <Select
                id="poll-division-select"
                label="Division"
                value={pollDivision}
                onChange={setPollDivision}
                options={divisionsList.map((d) => ({ value: d, label: `Division ${d}` }))}
                placeholder="All Divisions"
                disabled={divisionsList.length === 0}
              />

              {/* Active filter chips */}
              {(pollClass || pollDivision) && (
                <div className="flex items-center gap-2 flex-wrap self-end">
                  {pollClass && (
                    <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full border border-indigo-100">
                      {pollClass}
                    </span>
                  )}
                  {pollDivision && (
                    <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full border border-indigo-100">
                      Div {pollDivision}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── No poll selected ───────────────────────────────────────────── */}
          {!selectedPollId && (
            <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white border border-slate-200/60 rounded-3xl shadow-sm">
              <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center text-4xl shadow-sm">
                🗳️
              </div>
              <h2 className="text-xl font-bold text-slate-700">No poll selected</h2>
              <p className="text-slate-400 text-sm font-medium max-w-sm text-center">
                Pick a poll from the filter bar above to see response graphs,
                participation breakdown, and student-level answers.
              </p>
            </div>
          )}

          {/* ── Summary pills ──────────────────────────────────────────────── */}
          {selectedPollId && pollAnalytics && (
            <div className="flex flex-wrap gap-4">
              <Pill
                label="Total Eligible"
                value={pollAnalytics.totalStudents}
                color="indigo"
              />
              <Pill
                label="Total Voted"
                value={pollAnalytics.votedCount}
                color="emerald"
              />
              <Pill
                label="Participation Rate"
                value={
                  pollAnalytics.totalStudents > 0
                    ? `${Math.round((pollAnalytics.votedCount / pollAnalytics.totalStudents) * 100)}%`
                    : "0%"
                }
                color="amber"
              />
              <div className="flex items-center">
                <span
                  className={`badge ${
                    pollAnalytics.poll?.isOpen ? "badge-live" : "badge-closed"
                  } py-2 px-4 text-xs font-bold`}
                >
                  {pollAnalytics.poll?.isOpen ? "● Live / Open" : "Closed"}
                </span>
              </div>
            </div>
          )}

          {/* ── Charts ─────────────────────────────────────────────────────── */}
          {selectedPollId && pollAnalytics && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <PollResponseChart optionCounts={pollAnalytics.optionCounts} />
              <PollParticipationChart
                votedCount={pollAnalytics.votedCount}
                totalStudents={pollAnalytics.totalStudents}
              />

              {/* ── Detailed Student Responses ── */}
              <div className="xl:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Student Responses</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Individual voting details for the selected student section
                    </p>
                  </div>

                  <div className="relative">
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
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
                      className="form-input pl-9 py-2 text-sm border-slate-200 max-w-xs"
                      placeholder="Search students..."
                      value={pollSearch}
                      onChange={(e) => setPollSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="border border-slate-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-xs">
                          Student Name
                        </th>
                        <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-xs">
                          Roll Number
                        </th>
                        <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-xs">
                          Section
                        </th>
                        <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-xs">
                          Status
                        </th>
                        <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-xs">
                          Chosen Option
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredStudentDetails.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-medium">
                            {loadingPollAnalytics ? "Loading analytics..." : "No student records found."}
                          </td>
                        </tr>
                      ) : (
                        filteredStudentDetails.map((student) => (
                          <tr key={student._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-semibold text-slate-800">{student.name}</td>
                            <td className="px-6 py-4 font-mono text-slate-500 text-xs">{student.rollNumber}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600 border border-slate-100">
                                {[
                                  student.semester ? `Sem ${student.semester}` : null,
                                  student.studentClass ? student.studentClass.toUpperCase() : null,
                                  student.division ? `Div ${student.division.toUpperCase()}` : null,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {student.hasVoted ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-100">
                                  ✓ Voted
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-500 border border-slate-200">
                                  Not Voted
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {student.hasVoted ? (
                                <span className="text-slate-800 font-medium text-sm">
                                  {student.optionText}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Add Student Modal ──────────────────────────────────────────── */}
      {showStudentModal && (
        <AddStudentModal onClose={() => setShowStudentModal(false)} />
      )}
    </div>
  );
}

export default TeacherDashboard;
