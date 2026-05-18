import React from "react";

function CancelModal({ onSaveDraft, onErase, onKeepEditing }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease]">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-[slideUp_0.2s_ease]">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-ink">Unsaved Changes</h3>
          </div>
          <p className="text-slate-500 mb-6">
            The exam will be lost. Do you want to save it as a draft or erase it
            completely?
          </p>
          <div className="flex flex-col gap-3">
            <button
              className="btn btn-primary w-full justify-center py-2.5"
              onClick={onSaveDraft}
            >
              Save as Draft
            </button>
            <button
              className="btn btn-secondary w-full justify-center py-2.5 !text-danger hover:!bg-red-50 hover:!border-red-200"
              onClick={onErase}
            >
              Erase Completely
            </button>
            <button
              className="text-sm font-semibold text-slate-500 hover:text-ink mt-2 transition-colors"
              onClick={onKeepEditing}
            >
              Keep Editing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CancelModal;
