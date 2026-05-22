import React from "react";

function StepBasicInfo({
  basic,
  setBasic,
  rules,
  addRule,
  updateRule,
  removeRule,
}) {
  return (
    <div className="card p-8">
      <div className="flex items-center gap-2 mb-6">
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
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h2 className="text-base font-bold text-ink">
          Step 1: Basic Information
        </h2>
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
            onChange={(e) =>
              setBasic((f) => ({ ...f, description: e.target.value }))
            }
          />
        </div>

        {/* Duration */}
        <div className="form-group">
          <label className="form-label text-slate-500">
            DURATION (MINUTES) *
          </label>
          <input
            type="number"
            min={1}
            className="form-input py-2.5"
            value={basic.duration}
            onChange={(e) =>
              setBasic((f) => ({ ...f, duration: Number(e.target.value) }))
            }
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
            onChange={(e) =>
              setBasic((f) => ({ ...f, totalMarks: e.target.value }))
            }
          />
          <p className="text-xs text-slate-400 mt-1">
            Displayed to students as "out of X". Leave 0 to auto-sum from
            question marks.
          </p>
        </div>

        {/* Number of Questions */}
        <div className="form-group">
          <label className="form-label text-slate-500">NUMBER OF QUESTIONS</label>
          <input
            type="number"
            min={1}
            className="form-input py-2.5"
            placeholder="e.g. 10"
            value={basic.numQuestions || ""}
            onChange={(e) =>
              setBasic((f) => ({ ...f, numQuestions: e.target.value }))
            }
          />
          <p className="text-xs text-slate-400 mt-1">
            Equally divide marks and automatically generate question templates.
          </p>
        </div>

        {/* Toggles */}
        <div className="md:col-span-2 mt-2 space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-line">
            <span className="text-sm font-medium text-ink">
              Shuffle questions &amp; options
            </span>
            <label className="toggle">
              <input
                type="checkbox"
                checked={basic.shuffleOptions}
                onChange={(e) =>
                  setBasic((f) => ({ ...f, shuffleOptions: e.target.checked }))
                }
              />
              <span className="toggle-slider" />
            </label>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-line">
            <span className="text-sm font-medium text-ink">
              Show score after submission
            </span>
            <label className="toggle">
              <input
                type="checkbox"
                checked={basic.showResultAfterSubmit}
                onChange={(e) =>
                  setBasic((f) => ({
                    ...f,
                    showResultAfterSubmit: e.target.checked,
                  }))
                }
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        {/* Rules */}
        <div className="md:col-span-2 mt-2">
          <div className="flex items-center justify-between mb-3">
            <label className="form-label text-slate-500 mb-0">
              EXAM RULES &amp; INSTRUCTIONS
            </label>
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
                      ? "e.g. No calculators are allowed"
                      : i === 1
                        ? "e.g. Attempt all questions"
                        : "Add a rule..."
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          {rules.filter((r) => r.trim()).length === 0 && (
            <p className="text-xs text-slate-400 mt-2">
              No rules added yet. Rules are shown to students before they start
              the exam.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default StepBasicInfo;
