import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import useProctor from '../hooks/useProctor';
import useExamTimer from '../hooks/useExamTimer';
import Timer from '../components/Timer';
import { getErrorMessage } from '../utils/helpers';

const LABELS = ['A', 'B', 'C', 'D'];

function ExamAttempt() {
  const { examId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [examData, setExamData] = useState(location.state?.examData || null);
  const [loading] = useState(!location.state?.examData);
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showFSWarning, setShowFSWarning] = useState(false);
  const [showTabBanner, setShowTabBanner] = useState(false);
  const tabTimerRef = useRef(null);

  useEffect(() => {
    if (!examData) setError('Exam session lost. Please re-enter your access code.');
  }, [examData]);

  useEffect(() => {
    if (examData?.exam?.questions) {
      setAnswers(
        examData.exam.questions.map((q) => ({
          questionId: q._id,
          selectedIndex: (q.type || 'mcq') === 'mcq' ? -1 : undefined,
          textAnswer: (q.type || 'mcq') === 'descriptive' ? '' : undefined,
        }))
      );
    }
  }, [examData]);

  const handleExpire = useCallback(() => { if (!submitted) handleSubmit(true); }, [submitted]);
  const { formattedTime, isWarning, isExpired } = useExamTimer(
    examData ? examData.exam.duration * 60 : 0, handleExpire, started && !submitted
  );

  useProctor(examId, user?._id, examData?.submission?._id, {
    enabled: started && !submitted,
    onFullscreenExit: () => setShowFSWarning(true),
    onTabSwitch: () => {
      setShowTabBanner(true);
      clearTimeout(tabTimerRef.current);
      tabTimerRef.current = setTimeout(() => setShowTabBanner(false), 4000);
    },
  });

  const handleStart = async () => {
    try { await document.documentElement.requestFullscreen(); } catch { /* allow anyway */ }
    setStarted(true);
    try { await api.post('/proctor/event', { examId, type: 'exam_start', metadata: { submissionId: examData.submission._id } }); } catch {}
  };

  const selectAnswer = (qIdx, optIdx) =>
    setAnswers((p) => p.map((a, i) => (i === qIdx ? { ...a, selectedIndex: optIdx } : a)));

  const setTextAnswer = (qIdx, text) =>
    setAnswers((p) => p.map((a, i) => (i === qIdx ? { ...a, textAnswer: text } : a)));

  const handleSubmit = async (isAuto = false) => {
    if (submitted || submitting) return;
    const answered = answers.filter((a, i) => {
      const q = examData?.exam?.questions?.[i];
      if ((q?.type || 'mcq') === 'descriptive') return a.textAnswer && a.textAnswer.trim().length > 0;
      return a.selectedIndex >= 0;
    }).length;
    if (!isAuto && !window.confirm(`You answered ${answered}/${answers.length} questions. Submit?`)) return;
    setSubmitting(true);
    try { document.exitFullscreen(); } catch {}
    try {
      const { data } = await api.post('/exams/attempt/submit', {
        submissionId: examData.submission._id, answers, isAutoSubmitted: isAuto,
      });
      setSubmitted(true); setResult(data);
      if (!examData.exam.showResultAfterSubmit) setTimeout(() => navigate('/student/join'), 5000);
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setSubmitting(false); }
  };

  /* ─── Loading / Error screens ─── */
  if (loading || (!examData && !error)) return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4 text-ink-dim">
      <div className="spinner spinner-lg" /><p>Loading exam...</p>
    </div>
  );

  if (error && !examData) return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4 px-6">
      <div className="alert alert-error max-w-md">{error}</div>
      <button className="btn btn-primary" onClick={() => navigate('/student/join')}>← Back to Join</button>
    </div>
  );

  const exam = examData?.exam;
  const questions = exam?.questions || [];

  /* ─── Done screen ─── */
  if (submitted) return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6 py-12">
      <div className="card p-10 max-w-2xl w-full text-center flex flex-col gap-6 animate-[fadeInUp_0.4s_ease]">
        
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto text-emerald-500">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        
        <div>
          <h2 className="text-3xl font-extrabold text-ink mb-2">Exam Submitted!</h2>
          <p className="text-slate-500">Your responses have been successfully recorded.</p>
        </div>

        {result && exam.showResultAfterSubmit && result.result ? (
          <div className="text-left flex flex-col gap-6 mt-4">
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 bg-slate-50 border border-slate-200 rounded-2xl p-8">
              <div className="text-center">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Final Score</div>
                <div className="text-5xl font-extrabold text-ink">{result.result.score}<span className="text-2xl text-slate-400">/{result.result.totalQuestions}</span></div>
              </div>
              <div className="hidden md:block w-px h-16 bg-slate-200"></div>
              <div className="text-center">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Percentage</div>
                <div className="text-5xl font-extrabold text-primary">{result.result.percentage}%</div>
              </div>
            </div>
            
            {result.result.gradedAnswers && (
              <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-2">
                <h3 className="text-lg font-bold text-ink mb-2">Detailed Breakdown</h3>
                {result.result.gradedAnswers.map((ga, i) => (
                  <div key={i} className={`p-4 rounded-xl border flex gap-4 ${ga.isCorrect ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${ga.isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {ga.isCorrect ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-ink mb-1.5">Q{i+1}: {ga.questionText}</div>
                      <div className="text-xs flex flex-col gap-1">
                        <span className="text-slate-500">Your answer: <span className="font-medium text-ink">{ga.studentOption || 'Not answered'}</span></span>
                        {!ga.isCorrect && <span className="text-emerald-600 font-medium">Correct answer: {ga.correctOption}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mt-2">
            <p className="text-sm text-slate-500">Results will be shared by your instructor once the exam concludes.</p>
          </div>
        )}
        
        <button className="btn btn-primary btn-lg justify-center mt-4" onClick={() => navigate('/student/join')}>
          Return to Dashboard
        </button>
      </div>
    </div>
  );

  /* ─── Pre-start screen ─── */
  if (!started) {
    const examRules = exam?.rules || [];
    const mcqCount = questions.filter((q) => (q.type || 'mcq') === 'mcq').length;
    const descCount = questions.filter((q) => q.type === 'descriptive').length;
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-6 py-12">
        <div className="card p-10 max-w-xl w-full flex flex-col gap-6 animate-[fadeInUp_0.4s_ease]">

          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-primary mb-2">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-ink">{exam?.title}</h1>
            {exam?.description && <p className="text-slate-500 text-sm mt-2">{exam.description}</p>}
          </div>

          {/* Exam stats */}
          <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-4 divide-x divide-slate-200 border border-slate-200">
            <div className="flex flex-col items-center justify-center px-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Duration</span>
              <span className="text-sm font-bold text-ink text-center">{exam?.duration} min</span>
            </div>
            <div className="flex flex-col items-center justify-center px-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Questions</span>
              <span className="text-sm font-bold text-ink text-center">{questions.length}</span>
            </div>
            <div className="flex flex-col items-center justify-center px-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Marks</span>
              <span className="text-sm font-bold text-ink text-center">{exam?.totalMarks || '—'}</span>
            </div>
            <div className="flex flex-col items-center justify-center px-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Student</span>
              <span className="text-xs font-bold text-ink text-center truncate w-full">{user?.name?.split(' ')[0]}</span>
            </div>
          </div>

          {/* Question type breakdown */}
          {(mcqCount > 0 || descCount > 0) && (
            <div className="flex items-center gap-4 text-sm justify-center">
              {mcqCount > 0 && (
                <span className="badge badge-live">{mcqCount} MCQ</span>
              )}
              {descCount > 0 && (
                <span className="badge badge-scheduled">{descCount} Descriptive</span>
              )}
            </div>
          )}

          {/* Exam Rules */}
          {examRules.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Exam Rules &amp; Instructions</span>
              </div>
              <ol className="flex flex-col gap-2">
                {examRules.map((rule, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                    <span className="font-bold text-amber-500 flex-shrink-0">{i + 1}.</span>
                    {rule}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Proctoring notice */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 items-start">
            <svg className="w-5 h-5 text-danger flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <div className="text-sm text-red-800">
              <strong className="font-bold block mb-1">Proctored Session</strong>
              Fullscreen exits, tab switches, copy &amp; right-click attempts are recorded and reported to your instructor.
            </div>
          </div>

          <button className="btn btn-primary btn-lg w-full justify-center mt-2 py-3" onClick={handleStart}>
            Enter Fullscreen &amp; Start Exam
          </button>
        </div>
      </div>
    );
  }

  /* ─── Active exam ─── */
  const currentQuestion = questions[currentQ];
  const currentAnswer = answers[currentQ];
  const answeredCount = answers.filter((a, i) => {
    const q = questions[i];
    if ((q?.type || 'mcq') === 'descriptive') return a.textAnswer && a.textAnswer.trim().length > 0;
    return a.selectedIndex >= 0;
  }).length;

  return (
    <div className="h-screen flex flex-col bg-surface overflow-hidden relative selection:bg-primary/20">

      {/* Fullscreen overlay */}
      {showFSWarning && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center animate-[fadeIn_0.2s_ease]">
          <div className="card p-10 max-w-md text-center flex flex-col gap-5 border-2 border-danger shadow-xl">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto text-danger">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-ink mb-2">Fullscreen Exited</h2>
              <p className="text-slate-500 text-sm">This action has been recorded as a violation. Please return to fullscreen immediately to continue your exam.</p>
            </div>
            <button className="btn btn-primary btn-lg justify-center mt-2"
              onClick={() => { document.documentElement.requestFullscreen().catch(()=>{}); setShowFSWarning(false); }}>
              Return to Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* Tab switch banner */}
      {showTabBanner && (
        <div className="fixed top-0 inset-x-0 z-40 bg-danger text-white text-center py-2.5 text-sm font-bold shadow-md animate-[fadeIn_0.2s_ease]">
          ⚠️ Tab switch detected and recorded as a violation.
        </div>
      )}

      {/* Header */}
      <header className="h-16 px-6 flex items-center justify-between bg-white border-b border-line flex-shrink-0 shadow-sm z-10 relative">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-8 h-8 rounded bg-primary text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
            {`>`}_
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-ink truncate text-sm">{exam.title}</span>
            <span className="text-slate-400 text-xs truncate">Candidate: {user?.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-6 flex-shrink-0">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Progress</span>
            <span className="text-sm font-bold text-ink">{answeredCount}/{questions.length}</span>
          </div>
          <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
          <Timer formattedTime={formattedTime} isWarning={isWarning} isExpired={isExpired} />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-64 flex-shrink-0 bg-slate-50 border-r border-line p-5 overflow-y-auto flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Questions Navigator</span>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {questions.map((q, idx) => {
              const a = answers[idx];
              const isDesc = (q?.type || 'mcq') === 'descriptive';
              const answered = isDesc
                ? a?.textAnswer && a.textAnswer.trim().length > 0
                : a?.selectedIndex >= 0;
              const current  = idx === currentQ;

              let btnClass = "w-10 h-10 rounded-lg text-xs font-bold transition-all duration-200 border-2 ";
              if (current) {
                btnClass += "border-primary bg-white text-primary shadow-sm scale-105 z-10";
              } else if (answered) {
                btnClass += "border-transparent bg-indigo-50 text-primary hover:bg-indigo-100";
              } else {
                btnClass += "border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-600";
              }

              return (
                <button key={idx} onClick={() => setCurrentQ(idx)} className={btnClass} title={isDesc ? 'Descriptive' : 'MCQ'}>
                  {idx + 1}
                </button>
              );
            })}
          </div>
          
          <div className="flex flex-col gap-2.5 mt-4 p-4 bg-white border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2.5 text-xs font-medium text-slate-600">
              <span className="w-3 h-3 rounded bg-indigo-50 border-none" /> Answered
            </div>
            <div className="flex items-center gap-2.5 text-xs font-medium text-slate-600">
              <span className="w-3 h-3 rounded bg-white border-2 border-slate-200" /> Unanswered
            </div>
            <div className="flex items-center gap-2.5 text-xs font-medium text-slate-600">
              <span className="w-3 h-3 rounded bg-white border-2 border-primary" /> Current
            </div>
          </div>
          
          <button className="btn btn-danger w-full justify-center mt-auto py-2.5 shadow-sm" 
            onClick={() => handleSubmit(false)} disabled={submitting}>
            {submitting ? <span className="spinner spinner-sm border-white/30 border-t-white" /> : 'Finish Exam'}
          </button>
        </aside>

        {/* Question Panel */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-6 md:p-10 flex flex-col items-center">
          <div key={currentQ} className="w-full max-w-3xl flex flex-col gap-6 animate-[fadeInUp_0.2s_ease]">

            <div className="card p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-line">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Question {currentQ + 1}
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    (currentQuestion?.type || 'mcq') === 'descriptive'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-indigo-50 text-primary'
                  }`}>
                    {(currentQuestion?.type || 'mcq') === 'descriptive' ? 'Descriptive' : 'MCQ'}
                  </span>
                  {currentQuestion?.marks && (
                    <span className="text-xs text-slate-400 font-medium">[{currentQuestion.marks} mark{currentQuestion.marks !== 1 ? 's' : ''}]</span>
                  )}
                </div>
                {((currentQuestion?.type || 'mcq') === 'mcq'
                  ? currentAnswer?.selectedIndex === -1
                  : !currentAnswer?.textAnswer?.trim()) && (
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-md uppercase tracking-wide">
                    Unanswered
                  </span>
                )}
              </div>

              <h2 className="text-lg font-semibold text-ink leading-relaxed mb-8">{currentQuestion?.text}</h2>

              {/* MCQ Options */}
              {(currentQuestion?.type || 'mcq') === 'mcq' && (
                <div className="flex flex-col gap-3" role="radiogroup">
                  {currentQuestion?.options?.map((opt, optIdx) => {
                    const isSelected = currentAnswer?.selectedIndex === optIdx;
                    return (
                      <label key={optIdx}
                        className={`relative flex items-center gap-4 px-5 py-4 rounded-xl border-2 cursor-pointer transition-all duration-200 select-none
                          ${isSelected ? 'border-primary bg-indigo-50/50' : 'border-slate-200 bg-white hover:border-slate-300'}
                          ${showFSWarning ? 'opacity-50 pointer-events-none' : ''}`}>

                        <input type="radio" name={`q-${currentQ}`} value={optIdx} checked={isSelected}
                          onChange={() => !showFSWarning && selectAnswer(currentQ, optIdx)}
                          className="sr-only" disabled={showFSWarning} />

                        <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 flex-shrink-0"
                          style={{ borderColor: isSelected ? '#4f46e5' : '#cbd5e1' }}>
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                        </div>

                        <span className={`text-base font-medium leading-snug ${isSelected ? 'text-ink' : 'text-slate-600'}`}>
                          {opt}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Descriptive Textarea */}
              {(currentQuestion?.type || 'mcq') === 'descriptive' && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-slate-400 font-medium">Write your answer below. Be thorough and clear.</p>
                  <textarea
                    className={`w-full border-2 rounded-xl px-4 py-3 text-sm text-ink outline-none resize-y min-h-[180px] transition-all duration-200 placeholder:text-slate-300
                      ${showFSWarning ? 'opacity-50 pointer-events-none' : ''}
                      ${currentAnswer?.textAnswer?.trim() ? 'border-primary bg-indigo-50/20' : 'border-slate-200 focus:border-primary'}`}
                    placeholder="Type your answer here..."
                    value={currentAnswer?.textAnswer || ''}
                    onChange={(e) => !showFSWarning && setTextAnswer(currentQ, e.target.value)}
                    disabled={showFSWarning}
                  />
                  <p className="text-xs text-slate-400 text-right">
                    {(currentAnswer?.textAnswer || '').length} characters
                  </p>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-2">
              <button className="btn btn-secondary px-6 py-2.5 shadow-sm"
                onClick={() => setCurrentQ((q) => Math.max(0, q-1))} disabled={currentQ===0}>
                Previous
              </button>
              
              <button className="btn btn-primary px-8 py-2.5 shadow-sm"
                onClick={() => setCurrentQ((q) => Math.min(questions.length-1, q+1))} disabled={currentQ===questions.length-1}>
                Next Question
              </button>
            </div>
            
          </div>
        </main>
      </div>
    </div>
  );
}

export default ExamAttempt;
