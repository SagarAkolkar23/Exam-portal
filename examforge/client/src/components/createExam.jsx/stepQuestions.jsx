import React from "react";
import QuestionBuilder from "../QuestionBuilder.jsx";
import { emptyQ } from "./constants.js";

function StepQuestions({ questions, setQuestions }) {
  const mcqCount = questions.filter((q) => (q.type || "mcq") === "mcq").length;
  const descCount = questions.filter((q) => q.type === "descriptive").length;
  const sumMarks = questions.reduce((acc, q) => acc + (q.marks || 1), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-base font-bold text-ink">
            Step 2: Question Builder
          </h2>
          <span className="badge badge-draft ml-1">
            {questions.length} question{questions.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() =>
              setQuestions((q) => [
                ...q,
                {
                  ...emptyQ(),
                  type: "descriptive",
                  options: undefined,
                  correctIndex: undefined,
                },
              ])
            }
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
            onChange={(u) =>
              setQuestions((qs) => qs.map((old, i) => (i === idx ? u : old)))
            }
            onRemove={() =>
              setQuestions((qs) => qs.filter((_, i) => i !== idx))
            }
            canRemove={questions.length > 1}
          />
        ))}
      </div>

      {/* Summary bar */}
      <div className="card px-6 py-4 flex items-center gap-6 text-sm">
        <span className="text-slate-500">Summary:</span>
        <span className="font-semibold text-ink">{questions.length} total</span>
        <span className="text-primary font-medium">{mcqCount} MCQ</span>
        <span className="text-amber-600 font-medium">
          {descCount} Descriptive
        </span>
        <span className="ml-auto text-slate-500">
          Total marks from questions:{" "}
          <strong className="text-ink">{sumMarks}</strong>
        </span>
      </div>
    </div>
  );
}

export default StepQuestions;
