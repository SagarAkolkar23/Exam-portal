import React, { useEffect, useState } from "react";

const WarningDialog = ({ open, warningsLeft, onClose }) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!open) return;

    setCountdown(5);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-[400px] rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-red-600">Warning</h2>

        <p className="mt-4 text-gray-700">
          Tab switching is not allowed during the exam.
        </p>

        <p className="mt-2 font-semibold text-red-500">
          Remaining warnings: {warningsLeft}
        </p>

        <p className="mt-2 text-sm text-gray-500">
          Repeated violations may auto-submit your exam.
        </p>

        <button
          disabled={countdown > 0}
          onClick={onClose}
          className={`mt-6 w-full rounded-xl px-4 py-3 text-white transition
            ${
              countdown > 0
                ? "cursor-not-allowed bg-gray-400"
                : "bg-red-600 hover:bg-red-700"
            }`}
        >
          {countdown > 0 ? `Wait ${countdown}s` : "I Understand"}
        </button>
      </div>
    </div>
  );
};

export default WarningDialog;
