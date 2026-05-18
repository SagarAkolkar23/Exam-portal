import React from "react";

function StepNavButtons({ step, loading, onPrev, onNext }) {
  if (step >= 4) return null;
  return (
    <div className="flex items-center justify-between mt-8">
      <button
        className="btn btn-secondary"
        onClick={onPrev}
        disabled={step === 1 || loading}
      >
        ← Previous
      </button>
      <button className="btn btn-primary" onClick={onNext}>
        Next Step →
      </button>
    </div>
  );
}

export default StepNavButtons;
