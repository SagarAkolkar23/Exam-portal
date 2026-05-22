import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useGetExam,
  useGetStudents,
  useCreateExam,
  useUpdateExam,
  usePublishExam,
} from "../api/queries";
import ExamReview from "../components/ExamReview";
import { getErrorMessage } from "../utils/helpers";
import { useExamStore } from "../store/examStore";
import { emptyQ } from "../components/createExam.jsx/constants.js";
import CancelModal from "../components/createExam.jsx/cancelModal.jsx";
import StepperBar from "../components/createExam.jsx/stepperbar.jsx";
import StepBasicInfo from "../components/createExam.jsx/stepBasicInfo.jsx";
import StepQuestions from "../components/createExam.jsx/stepQuestions.jsx";
import StepAssignStudents from "../components/createExam.jsx/stepAssignStudents.jsx";
import StepNavButtons from "../components/createExam.jsx/navButtons.jsx";

function CreateExam({ isEditing = false }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);

  const {
    basic,
    setBasic,
    rules,
    setRules,
    questions,
    setQuestions,
    assignedStudents: selected,
    setAssignedStudents: setSelected,
    clearExamState,
    setFullState,
    allClear,
  } = useExamStore();

  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const { mutateAsync: createExam } = useCreateExam();
  const { mutateAsync: updateExam } = useUpdateExam();
  const { mutateAsync: publishExam } = usePublishExam();

  const { refetch: fetchExam } = useGetExam(id, false);
  const { refetch: fetchStudents } = useGetStudents(false);

  // Load exam data when editing
  useEffect(() => {
    if (isEditing && id) {
      setLoading(true);
      fetchExam()
        .then(({ data, isError, error: fetchErr }) => {
          if (isError) {
            setError(getErrorMessage(fetchErr));
            return;
          }
          if (!data) return;
          const d = data.scheduledStart ? new Date(data.scheduledStart) : null;
          const lj = data.latestJoinTime ? new Date(data.latestJoinTime) : null;
          const fullState = {
            basic: {
              title: data.title || "",
              description: data.description || "",
              duration: data.duration || 60,
              totalMarks: data.totalMarks || "",
              scheduledStart: d
                ? new Date(d.getTime() - d.getTimezoneOffset() * 60000)
                    .toISOString()
                    .slice(0, 16)
                : "",
              scheduledEnd: "",
              latestJoinTime: lj
                ? new Date(lj.getTime() - lj.getTimezoneOffset() * 60000)
                    .toISOString()
                    .slice(0, 16)
                : "",
              shuffleOptions: data.shuffleOptions ?? true,
              showResultAfterSubmit: data.showResultAfterSubmit ?? false,
            },
            rules: data.rules && data.rules.length ? data.rules : [""],
            questions:
              data.questions && data.questions.length
                ? data.questions.map((q) => {
                    if ((q.type || "mcq") === "mcq") {
                      const correctIndices = Array.isArray(q.correctOptions) && q.correctOptions.length > 0
                        ? q.correctOptions.map(opt => q.options.indexOf(opt)).filter(idx => idx !== -1)
                        : (q.correctOption ? [q.options.indexOf(q.correctOption)] : [0]);

                      return {
                        ...q,
                        isMultiSelect: q.isMultiSelect || (Array.isArray(q.correctOptions) && q.correctOptions.length > 1),
                        correctIndices: correctIndices.length > 0 ? correctIndices : [0],
                        correctIndex: correctIndices.length > 0 ? correctIndices[0] : 0,
                      };
                    }
                    return q;
                  })
                : [emptyQ()],
            assignedStudents: (data.assignedStudents || []).map(
              (s) => s._id || s,
            ),
          };
          setFullState(fullState);
          setStep(4);
        })
        .catch((err) => setError(getErrorMessage(err)))
        .finally(() => setLoading(false));
    }
  }, [isEditing, id]);

  // Load students when reaching step 3
  useEffect(() => {
    if ((step !== 3 && !isEditing) || students.length) return;
    setLoadingStudents(true);
    fetchStudents()
      .then(({ data }) => setStudents(data || []))
      .catch(() => {})
      .finally(() => setLoadingStudents(false));
  }, [step, isEditing]);

  // ── Rules helpers ──────────────────────────────────────────────────────────
  const addRule = () => setRules((r) => [...r, ""]);
  const updateRule = (i, val) =>
    setRules((r) => r.map((x, idx) => (idx === i ? val : x)));
  const removeRule = (i) =>
    setRules((r) => (r.length > 1 ? r.filter((_, idx) => idx !== i) : [""]));

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    if (step === 1) {
      if (!basic.title.trim()) {
        setError("Exam title is required.");
        return false;
      }
      if (!basic.duration || basic.duration < 1) {
        setError("Duration must be at least 1 minute.");
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
        if ((q.type || "mcq") === "mcq") {
          if (!q.options || q.options.some((o) => !o.trim())) {
            setError(`Question ${i + 1}: all 4 options must be filled.`);
            return false;
          }
          if (q.isMultiSelect) {
            if (!q.correctIndices || q.correctIndices.length === 0) {
              setError(`Question ${i + 1}: please select at least one correct answer.`);
              return false;
            }
          } else {
            if (q.correctIndex === undefined || q.correctIndex === null) {
              setError(`Question ${i + 1}: please mark the correct answer.`);
              return false;
            }
          }
        }
      }
    }
    setError("");
    return true;
  };

  const checkAndGenerateQuestionTemplates = () => {
    const numQ = parseInt(basic.numQuestions);
    const totalM = parseFloat(basic.totalMarks);
    if (numQ > 0 && totalM > 0) {
      const marksPerQ = Number((totalM / numQ).toFixed(2));

      // If questions array only has 1 empty question, replace completely
      const isDefaultEmpty =
        questions.length === 1 &&
        !questions[0].text.trim() &&
        (!questions[0].options || !questions[0].options.some((o) => o.trim()));

      let newQuestions = [...questions];
      if (isDefaultEmpty) {
        newQuestions = Array.from({ length: numQ }, () => ({
          type: "mcq",
          text: "",
          marks: marksPerQ,
          options: ["", "", "", ""],
          correctIndex: 0,
          isMultiSelect: false,
        }));
      } else {
        // Pad or slice questions to match numQ
        if (newQuestions.length < numQ) {
          const extraCount = numQ - newQuestions.length;
          const extraQs = Array.from({ length: extraCount }, () => ({
            type: "mcq",
            text: "",
            marks: marksPerQ,
            options: ["", "", "", ""],
            correctIndex: 0,
            isMultiSelect: false,
          }));
          newQuestions = [...newQuestions, ...extraQs];
        } else if (newQuestions.length > numQ) {
          newQuestions = newQuestions.slice(0, numQ);
        }

        // Re-assign equal marks to all questions
        newQuestions = newQuestions.map((q) => ({
          ...q,
          marks: marksPerQ,
        }));
      }
      setQuestions(newQuestions);
    }
  };

  const next = () => {
    if (step === 1) {
      checkAndGenerateQuestionTemplates();
    }
    if (validate()) setStep((s) => Math.min(s + 1, 4));
  };
  const prev = () => {
    setError("");
    setStep((s) => Math.max(s - 1, 1));
  };
  const jumpToStep = (targetStep) => {
    if (step === 1 && targetStep > 1) {
      checkAndGenerateQuestionTemplates();
    }
    setError("");
    setStep(targetStep);
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async (status, scheduleData = {}) => {
    if (!validate()) return;
    setLoading(true);
    setError("");
    try {
      const cleanRules = rules.filter((r) => r.trim());
      const mappedQuestions = questions.map((q) => {
        if ((q.type || "mcq") === "mcq") {
          if (q.isMultiSelect) {
            const correctOpts = Array.isArray(q.correctIndices)
              ? q.correctIndices.map(idx => q.options[idx]).filter(Boolean)
              : [q.options[q.correctIndex || 0]];
            return {
              ...q,
              isMultiSelect: true,
              correctOptions: correctOpts,
              correctOption: correctOpts[0] || "",
            };
          } else {
            const correctOpt = q.options[q.correctIndex !== undefined ? q.correctIndex : 0];
            return {
              ...q,
              isMultiSelect: false,
              correctOption: correctOpt,
              correctOptions: [correctOpt],
            };
          }
        }
        return q;
      });
      const { numQuestions, ...basicWithoutNumQ } = basic;
      const payload = {
        ...basicWithoutNumQ,
        duration: Number(basic.duration),
        totalMarks: basic.totalMarks !== "" ? Number(basic.totalMarks) : 0,
        questions: mappedQuestions,
        assignedStudents: selected,
        rules: cleanRules,
        status,
        ...scheduleData,
      };
      if (isEditing && id) {
        await updateExam({ id, payload });
      } else {
        await createExam(payload);
      }
      clearExamState();
      navigate("/teacher/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-[fadeIn_0.3s_ease] max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-extrabold text-ink">
          {isEditing ? "Edit Draft Exam" : "Create New Exam"}
        </h1>
        <button
          className="btn btn-secondary"
          onClick={() => setShowCancelModal(true)}
        >
          Cancel
        </button>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <CancelModal
          onSaveDraft={async () => {
            setShowCancelModal(false);
            await handleSave("draft");
          }}
          onErase={() => {
            allClear();
            navigate("/teacher/dashboard");
          }}
          onKeepEditing={() => setShowCancelModal(false)}
        />
      )}

      {/* Stepper */}
      <StepperBar currentStep={step} />

      {/* Error */}
      {error && <div className="alert alert-error mb-6">{error}</div>}

      {/* Steps */}
      {step === 1 && (
        <StepBasicInfo
          basic={basic}
          setBasic={setBasic}
          rules={rules}
          addRule={addRule}
          updateRule={updateRule}
          removeRule={removeRule}
        />
      )}

      {step === 2 && (
        <StepQuestions questions={questions} setQuestions={setQuestions} />
      )}

      {step === 3 && (
        <StepAssignStudents
          basic={basic}
          setBasic={setBasic}
          students={students}
          loadingStudents={loadingStudents}
          selected={selected}
          setSelected={setSelected}
        />
      )}

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
      <StepNavButtons
        step={step}
        loading={loading}
        onPrev={prev}
        onNext={next}
      />
    </div>
  );
}

export default CreateExam;
