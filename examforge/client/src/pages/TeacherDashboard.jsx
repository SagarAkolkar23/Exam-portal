import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/helpers";
import { useAnalyticsStore } from "../store/analyticsStore";
import {
  useGetExams,
  useGetTeacherAnalyticsExams,
  useGetScoreDistribution,
  useGetCheatReport,
} from "../api/queries";
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

  const { data: overviewData = [], isLoading: overviewLoading } = useGetTeacherAnalyticsExams();

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

  const { data: scoreData } = useGetScoreDistribution(!!examId);
  const { data: cheatData } = useGetCheatReport(!!examId);

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

  useEffect(() => {
    if (examsError) setError(getErrorMessage(examsError));
  }, [examsError]);

  return (
    <div className="animate-[fadeIn_0.3s_ease] space-y-8">
      

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-3xl text-sm text-rose-600 font-semibold shadow-sm animate-pulse">
          {error}
        </div>
      )}

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

      {/* ── Add Student Modal ──────────────────────────────────────────── */}
      {showStudentModal && (
        <AddStudentModal onClose={() => setShowStudentModal(false)} />
      )}
    </div>
  );
}

export default TeacherDashboard;
