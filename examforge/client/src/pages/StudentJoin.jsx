import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAttemptStore } from '../store/attemptStore';
import { joinExam } from '../api/joinExam';

function StudentJoin() {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { accessCode, setAccessCode } = useAttemptStore();

  const { mutateAsync } = joinExam();

  const handleJoin = async (e) => {
    e.preventDefault();

    setError('');

    try {
      const response = await mutateAsync({
        accessCode,
      });

      navigate(`/exam/${response.exam._id}`, { state: { examData: response } });
    } catch (err) {
      setError(
        err?.response?.data?.message || 'Failed to join exam'
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] px-6">
      <div className="w-full max-w-md">
        
        <div className="card p-8 shadow-sm">
          
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-extrabold text-ink mb-2">
              Join Exam
            </h1>

            <p className="text-sm text-ink-muted">
              Enter your exam access code
            </p>
          </div>

          {error && (
            <div className="alert alert-error mb-4">
              {error}
            </div>
          )}

          <form
            onSubmit={handleJoin}
            className="flex flex-col gap-5"
          >
            <input
              type="text"
              value={accessCode}
              onChange={(e) =>
                setAccessCode(e.target.value.toUpperCase())
              }
              maxLength={6}
              placeholder="XXXXXX"
              className="
                w-full px-6 py-4 text-3xl font-extrabold
                font-mono tracking-[0.3em] text-center
                bg-slate-50 border-2 border-slate-200
                rounded-xl uppercase outline-none
                focus:border-primary focus:ring-4
                focus:ring-primary/20
              "
            />

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
            >
              Join Exam
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}

export default StudentJoin;