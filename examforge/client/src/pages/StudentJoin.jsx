import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage, formatDate } from '../utils/helpers';

function StudentJoin() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [scheduledStart, setScheduledStart] = useState(null);
  const [countdown, setCountdown] = useState('');
  const timerRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => () => clearInterval(timerRef.current), []);

  const startCountdown = (date) => {
    setScheduledStart(date);
    clearInterval(timerRef.current);
    const tick = () => {
      const diff = new Date(date) - new Date();
      if (diff <= 0) { setCountdown('Starting now…'); clearInterval(timerRef.current); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h}h ${m}m ${s}s`);
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError(''); setScheduledStart(null); clearInterval(timerRef.current);
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) { setError('Enter a valid 6-character access code.'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/exams/attempt/join', { accessCode: trimmed });
      navigate(`/exam/${data.exam._id}`, { state: { examData: data } });
    } catch (err) {
      const msg   = err.response?.data?.message || getErrorMessage(err);
      const start = err.response?.data?.scheduledStart;
      if (start) { startCountdown(start); setError(`Exam hasn't started yet. Scheduled for ${formatDate(start)}`); }
      else setError(msg);
    } finally { setLoading(false); }
  };

  const handleLogout = () => {
    logout();
    navigate('/student/login');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center">
      
      {/* Top Bar */}
      <div className="w-full h-16 bg-white border-b border-line px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary text-white flex items-center justify-center font-bold text-xs">
            {`>`}_
          </div>
          <span className="text-lg font-extrabold text-primary tracking-tight">ExamForge</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-sm text-right">
            <div className="font-semibold text-ink">{user?.name}</div>
            <div className="text-xs text-ink-muted">{user?.rollNumber}</div>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm text-slate-500 hover:text-danger">
            Logout
          </button>
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md flex flex-col gap-6 animate-[fadeInUp_0.4s_ease_forwards]">

          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-ink mb-2">Join an Exam</h1>
            <p className="text-sm text-ink-muted">Enter the 6-character access code provided by your instructor.</p>
          </div>

          {error && (
            <div className={`alert w-full ${scheduledStart ? 'alert-warning' : 'alert-error'}`}>{error}</div>
          )}

          {/* Countdown */}
          {scheduledStart && countdown && (
            <div className="w-full text-center bg-amber-50 border border-amber-200 rounded-2xl px-6 py-5 shadow-sm">
              <div className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2">Exam starts in</div>
              <div className="text-4xl font-extrabold font-mono text-amber-500">{countdown}</div>
            </div>
          )}

          <div className="card p-8 shadow-sm">
            <form onSubmit={handleJoin} className="w-full flex flex-col gap-5">
              <div className="form-group">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block text-center">Access Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="XXXXXX"
                  className="w-full px-6 py-4 text-3xl font-extrabold font-mono tracking-[0.3em] text-center
                             bg-slate-50 border-2 border-slate-200 rounded-xl text-ink uppercase
                             outline-none transition-all duration-150 placeholder:text-slate-300
                             focus:border-primary focus:ring-4 focus:ring-primary/20"
                />
              </div>
              
              <button type="submit" className="btn btn-primary btn-lg w-full justify-center py-3" disabled={loading}>
                {loading ? <><span className="spinner spinner-sm border-white/30 border-t-white" /> Connecting...</> : 'Join Exam'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}

export default StudentJoin;
