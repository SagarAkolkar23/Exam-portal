import React from "react";
import { STEPS } from "./constants.js";

function StepperBar({ currentStep }) {
  return (
    <div className="flex items-center justify-between mb-10 px-8 relative">
      <div className="absolute top-1/2 left-16 right-16 h-px bg-slate-200 -z-10 -translate-y-1/2" />
      {STEPS.map((label, i) => {
        const isActive = currentStep === i + 1;
        const isDone = currentStep > i + 1;
        return (
          <div
            key={i}
            className="flex flex-col items-center gap-2 bg-surface px-4"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                ${isDone || isActive ? "bg-primary text-white" : "bg-white border border-slate-300 text-slate-400"}`}
            >
              {isDone ? "✓" : i + 1}
            </div>
            <span
              className={`text-sm font-medium ${isActive ? "text-primary" : isDone ? "text-ink" : "text-slate-400"}`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default StepperBar;
