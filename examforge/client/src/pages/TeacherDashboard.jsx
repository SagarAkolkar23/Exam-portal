import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { useGetExams } from "../api/queries";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/helpers";
import { useAnalyticsStore } from "../store/analyticsStore";
import ScoreDistributionChart from "../components/analytics/ScoreDistributionChart";
import CheatDistributionChart from "../components/analytics/CheatDistributionChart";
import QuestionAnalysisChart from "../components/analytics/QuestionAnalysisChart";
import Select from "../components/analytics/Select";
import Pill from "../components/analytics/Pill";
import Skeleton from "../components/analytics/Skeleton";
import AddStudentModal from "../components/createExam.jsx/addStudent";
import ThresholdAnalysis from "../components/analytics/ThresholdAnalysis";

function TeacherDashboard() {
  const { user } = useAuth();
  const { data: exams = [], error: examsError } = useGetExams();

  const [error, setError] = useState("");
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

  // 1. Fetch all exams overview
  const { data: overviewData = [], isLoading: overviewLoading } = useQuery({
    queryKey: ["teacher-analytics-overview"],
    queryFn: () => api.get("/teacher/analytics/exams").then((r) => r.data),
    staleTime: 60_000,
  });

  // Sync groups when exam list or selected exam changes
  useEffect(() => {
    if (examId && overviewData.length > 0) {
      const exam = overviewData.find((e) => e._id === examId);
      if (exam) setAvailableGroups(exam.groups ?? []);
    }
  }, [overviewData, examId]);

  const selectedExamGroups = useMemo(
    () => overviewData.find((e) => e._id === examId)?.groups ?? [],
    [overviewData, examId],
  );

  // 2. Score distribution
  const scoreQuery = useQuery({
    queryKey: ["score-distribution", examId, semester, studentClass, division, year],
    enabled: !!examId,
    queryFn: () => {
      const params = new URLSearchParams();
      if (semester) params.set("semester", semester);
      if (studentClass) params.set("studentClass", studentClass);
      if (division) params.set("division", division);
      if (year) params.set("year", year);
      return api
        .get(`/teacher/analytics/exams/${examId}/score-distribution?${params}`)
        .then((r) => r.data);
    },
    staleTime: 30_000,
  });

  // 3. Cheat report
  const cheatQuery = useQuery({
    queryKey: ["cheat-report", examId],
    enabled: !!examId,
    queryFn: () =>
      api
        .get(`/teacher/analytics/exams/${examId}/cheat-report`)
        .then((r) => r.data),
    staleTime: 30_000,
  });

  // 4. Question analysis
  const qAnalysisQuery = useQuery({
    queryKey: ["question-analysis", examId],
    enabled: !!examId,
    queryFn: () =>
      api
        .get(`/teacher/analytics/exams/${examId}/question-analysis`)
        .then((r) => r.data),
    staleTime: 30_000,
  });

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

  const scoreData = scoreQuery.data;
  const cheatData = cheatQuery.data;
  const qAnalysisData = qAnalysisQuery.data;

  useEffect(() => {
    if (examsError) setError(getErrorMessage(examsError));
  }, [examsError]);

  return (
    <div className="animate-[fadeIn_0.3s_ease] space-y-8">
      
      {/* ── Dashboard Header ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Analytics Dashboard</h1>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Analyze exam performance, track student progress, and monitor integrity.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* ── Filter bar ─────────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm">
          <div className="flex flex-wrap items-end gap-4">
            {/* Exam selector */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-[220px]">
              <label
                htmlFor="exam-select"
                className="text-[10px] font-bold uppercase tracking-wider text-slate-400"
              >
                Exam
              </label>
              {overviewLoading ? (
                <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
              ) : (
                <select
                  id="exam-select"
                  value={examId ?? ""}
                  onChange={(e) => handleExamChange(e.target.value || null)}
                  className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed min-w-[160px] cursor-pointer"
                >
                  <option value="">— Choose an exam —</option>
                  {examOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="h-10 w-px bg-slate-200 hidden sm:block self-end" />

            <Select
              id="semester-select"
              label="Semester"
              value={semester}
              onChange={(val) => setSemester(val, selectedExamGroups)}
              options={availableSemesters.map((s) => ({
                value: s,
                label: `Semester ${s}`,
              }))}
              placeholder="All Semesters"
              disabled={!examId || availableSemesters.length === 0}
            />

            <Select
              id="class-select"
              label="Class"
              value={studentClass}
              onChange={(val) =>
                setStudentClass(val, selectedExamGroups, semester)
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
          <div className="flex flex-col items-center justify-center py-24 gap-4">
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
            {scoreQuery.isLoading ? (
              <Skeleton />
            ) : (
              <ScoreDistributionChart
                data={scoreData?.distribution ?? []}
                totalMarks={scoreData?.exam?.totalMarks ?? 100}
              />
            )}

            {cheatQuery.isLoading ? (
              <Skeleton />
            ) : (
              <CheatDistributionChart report={cheatData?.report ?? []} />
            )}

            <div className="xl:col-span-2">
              {qAnalysisQuery.isLoading ? (
                <Skeleton />
              ) : (
                <QuestionAnalysisChart
                  questions={qAnalysisData?.questions ?? []}
                />
              )}
            </div>

            {/* ── Threshold Performance Analyzer ── */}
            <div className="xl:col-span-2">
              <ThresholdAnalysis
                examId={examId}
                totalMarks={scoreData?.exam?.totalMarks ?? 100}
                semester={semester}
                studentClass={studentClass}
                division={division}
                year={year}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Add Student Modal ──────────────────────────────────────────── */}
      {showStudentModal && (
        <AddStudentModal onClose={() => setShowStudentModal(false)} />
      )}
    </div>
  );
}

export default TeacherDashboard;
