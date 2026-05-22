import React from 'react';

const LABELS = ['A', 'B', 'C', 'D'];

function QuestionBuilder({ index, question, onChange, onRemove, canRemove }) {
  const update = (field, value) => onChange({ ...question, [field]: value });
  const type = question.type || 'mcq';
  const isMultiSelect = question.isMultiSelect || false;
  const correctIndices = question.correctIndices || (question.correctIndex !== undefined ? [question.correctIndex] : [0]);

  const updateOption = (optIdx, value) => {
    const options = [...(question.options || ['', '', '', ''])];
    options[optIdx] = value;
    onChange({ ...question, options });
  };

  const switchType = (newType) => {
    if (newType === type) return;
    if (newType === 'mcq') {
      onChange({ 
        ...question, 
        type: 'mcq', 
        options: ['', '', '', ''], 
        correctIndex: 0,
        correctIndices: [0],
        isMultiSelect: false
      });
    } else {
      // Strip MCQ-specific fields for descriptive
      onChange({ 
        ...question, 
        type: 'descriptive', 
        options: undefined, 
        correctIndex: undefined,
        correctIndices: undefined,
        isMultiSelect: undefined
      });
    }
  };

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 px-6 py-3 border-b border-line flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg
            className="w-4 h-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h7"
            />
          </svg>
          <span className="text-sm font-bold text-primary tracking-wide uppercase">
            Question {index + 1}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Type Toggle Pill */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => switchType("mcq")}
              className={`px-3 py-1.5 rounded-md transition-all duration-150 ${
                type === "mcq"
                  ? "bg-white text-primary shadow-sm border border-primary/20"
                  : "text-slate-500 hover:text-ink"
              }`}
            >
              MCQ
            </button>
            <button
              type="button"
              onClick={() => switchType("descriptive")}
              className={`px-3 py-1.5 rounded-md transition-all duration-150 ${
                type === "descriptive"
                  ? "bg-white text-primary shadow-sm border border-primary/20"
                  : "text-slate-500 hover:text-ink"
              }`}
            >
              Descriptive
            </button>
          </div>

          {/* Marks input */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Marks:</span>
            <input
              type="number"
              value={question.marks ?? 1}
              readOnly
              className="w-16 text-center text-sm font-semibold text-slate-500 border border-line rounded-md px-2 py-1 outline-none bg-slate-100 cursor-not-allowed"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">CO:</span>
            <input
              type="text"
              value={question.description || ""}
              onChange={(e) => update("description", e.target.value)}
              className="w-16 text-center text-sm font-semibold text-ink border border-line rounded-md px-2 py-1 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white"
            />
          </div>

          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="text-slate-400 hover:text-danger transition-colors"
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="p-6 flex flex-col gap-6">
        {/* Question text */}
        <textarea
          className="w-full text-base font-semibold text-ink border-0 border-b border-transparent hover:border-slate-200 focus:border-primary focus:ring-0 px-0 py-2 resize-none outline-none transition-colors"
          placeholder={
            type === "mcq"
              ? "Type your multiple-choice question here..."
              : "Type your descriptive/open-ended question here..."
          }
          value={question.text || ""}
          onChange={(e) => update("text", e.target.value)}
          rows={2}
          required
        />

        {/* ── MCQ Options ── */}
        {type === "mcq" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between pb-1 border-b border-line">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                {isMultiSelect 
                  ? "Select all options that are correct answers" 
                  : "Select the option that is the correct answer"}
              </p>
              
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={isMultiSelect}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const nextIndices = checked 
                      ? (question.correctIndex !== undefined ? [question.correctIndex] : [0])
                      : (correctIndices[0] !== undefined ? correctIndices[0] : 0);
                    onChange({
                      ...question,
                      isMultiSelect: checked,
                      correctIndices: checked ? nextIndices : undefined,
                      correctIndex: checked ? undefined : nextIndices
                    });
                  }}
                  className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-600 hover:text-primary transition-colors">Multiple Correct Answers</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {LABELS.map((label, optIdx) => {
                const isCorrect = isMultiSelect 
                  ? correctIndices.includes(optIdx)
                  : question.correctIndex === optIdx;
                return (
                  <label
                    key={optIdx}
                    className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all duration-200
                      ${
                        isCorrect
                          ? "border-primary bg-indigo-50/50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                  >
                    {isMultiSelect ? (
                      <div
                        className="flex items-center justify-center w-5 h-5 rounded border-2 flex-shrink-0 transition-colors"
                        style={{ 
                          borderColor: isCorrect ? "#4f46e5" : "#cbd5e1",
                          backgroundColor: isCorrect ? "#4f46e5" : "transparent"
                        }}
                      >
                        {isCorrect && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    ) : (
                      <div
                        className="flex items-center justify-center w-5 h-5 rounded-full border-2 flex-shrink-0"
                        style={{ borderColor: isCorrect ? "#4f46e5" : "#cbd5e1" }}
                      >
                        {isCorrect && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        )}
                      </div>
                    )}

                    <input
                      type={isMultiSelect ? "checkbox" : "radio"}
                      name={isMultiSelect ? `correct-multi-${index}-${optIdx}` : `correct-${index}`}
                      value={optIdx}
                      checked={isCorrect}
                      onChange={() => {
                        if (isMultiSelect) {
                          const next = correctIndices.includes(optIdx)
                            ? correctIndices.filter(i => i !== optIdx)
                            : [...correctIndices, optIdx];
                          onChange({ ...question, correctIndices: next });
                        } else {
                          onChange({ ...question, correctIndex: optIdx });
                        }
                      }}
                      className="sr-only"
                    />

                    <span className="text-xs font-bold text-slate-400 mr-1">
                      {label}.
                    </span>

                    <input
                      type="text"
                      className="w-full bg-transparent text-sm font-medium text-ink outline-none placeholder:text-slate-400"
                      placeholder={`Option ${label}`}
                      value={
                        (question.options && question.options[optIdx]) || ""
                      }
                      onChange={(e) => updateOption(optIdx, e.target.value)}
                      required
                    />

                    {isCorrect && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary bg-indigo-100 px-2 py-1 rounded-md uppercase tracking-wide">
                        Correct
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Descriptive Info Banner ── */}
        {type === "descriptive" && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <svg
              className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0"
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
            <p className="text-xs text-amber-700 font-medium leading-relaxed">
              Students will type a written answer. Descriptive responses require
              manual grading — marks will be awarded 0 automatically and can be
              updated later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuestionBuilder;
