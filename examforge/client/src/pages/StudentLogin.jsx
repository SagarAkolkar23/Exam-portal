import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStudentLogin } from '../api/queries';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/helpers';

function StudentLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { mutateAsync: studentLogin } = useStudentLogin();

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setServerError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const data = await studentLogin(form);
      login(data.token, data.student, 'student');
      navigate('/student/join');
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fa] px-6">
      
      {/* Brand */}
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded bg-primary text-white flex items-center justify-center font-bold text-sm">
            {`>`}_
          </div>
          <span className="text-2xl font-extrabold text-primary tracking-tight">ExamForge</span>
        </div>
        <h1 className="text-3xl font-extrabold text-ink mb-2">Student Portal</h1>
        <p className="text-sm text-ink-muted">Sign in to take your exams</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-[400px] bg-white border border-line rounded-2xl p-8 shadow-sm">
        
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          
          <div className="form-group">
            <label htmlFor="email" className="text-xs font-bold text-ink-dim mb-1.5">Email Address</label>
            <input 
              id="email" type="email" autoFocus autoComplete="email"
              className={`form-input py-2.5 ${errors.email || serverError ? 'error' : ''}`}
              placeholder="student@examforge.edu"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} 
            />
            {errors.email && <span className="form-error mt-1">{errors.email}</span>}
          </div>

          <div className="form-group">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="text-xs font-bold text-ink-dim">Password</label>
              <a href="#" className="text-xs font-semibold text-primary hover:text-primary-dark">Forgot password?</a>
            </div>
            <div className="relative">
              <input 
                id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                className={`form-input py-2.5 pr-10 ${errors.password || serverError ? 'error' : ''}`}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} 
              />
              <button 
                type="button" 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <span className="form-error mt-1">{errors.password}</span>}
          </div>

          {serverError && (
            <div className="flex items-center gap-1.5 text-xs text-danger font-medium mt-[-4px]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {serverError}
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer mt-2">
            <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary" />
            <span className="text-xs font-medium text-ink-dim">Remember this device</span>
          </label>

          <button type="submit" className="btn btn-primary btn-lg w-full justify-center mt-2 py-3" disabled={loading}>
            {loading ? <><span className="spinner spinner-sm border-white/30 border-t-white" /> Signing in...</> : 'Sign in'}
          </button>
        </form>

      </div>

      {/* Bottom Link */}
      <div className="mt-8">
        <Link to="/teacher/login" className="text-sm font-semibold text-ink-dim hover:text-ink">
          Teacher? Login here <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>

      {/* Footer */}
      <div className="mt-16 text-center">
        <p className="text-xs text-slate-400">© 2024 ExamForge Professional.</p>
        <p className="text-xs text-slate-400 mt-1">Secure student portal for academic assessment.</p>
      </div>

    </div>
  );
}

export default StudentLogin;
