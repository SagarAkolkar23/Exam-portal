import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import TeacherLayout from './components/TeacherLayout';

import TeacherExams from './pages/TeacherExams';

// Pages
import TeacherLogin from './pages/TeacherLogin';
import StudentLogin from './pages/StudentLogin';
import TeacherDashboard from './pages/TeacherDashboard';
import CreateExam from './pages/CreateExam';
import ExamDetail from './pages/ExamDetail';
import CreatePoll from './pages/CreatePoll';
import StudentJoin from './pages/StudentJoin';
import ExamAttempt from './pages/ExamAttempt';
import ExamSession from './pages/ExamSession';
import ExamResult from './pages/ExamResult';
import StudentDashboard from './pages/StudentDashboard';
import ManageStudents from './pages/ManageStudents';

function App() {
  const { isAuthenticated, role } = useAuth();

  return (
    <Routes>
      {/* Root redirect */}
      <Route
        path="/"
        element={
          isAuthenticated
            ? <Navigate to={role === 'teacher' ? '/teacher/dashboard' : '/student/join'} replace />
            : <Navigate to="/teacher/login" replace />
        }
      />

      {/* Auth */}
      <Route path="/teacher/login" element={<TeacherLogin />} />
      <Route path="/student/login" element={<StudentLogin />} />

      {/* Teacher routes */}
      <Route
        path="/teacher/dashboard"
        element={
          <ProtectedRoute role="teacher">
            <TeacherLayout>
              <TeacherDashboard />
            </TeacherLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/exams"
        element={
          <ProtectedRoute role="teacher">
            <TeacherLayout>
              <TeacherExams />
            </TeacherLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/exams/create"
        element={
          <ProtectedRoute role="teacher">
            <TeacherLayout>
              <CreateExam />
            </TeacherLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/exams/:id/edit"
        element={
          <ProtectedRoute role="teacher">
            <TeacherLayout>
              <CreateExam isEditing={true} />
            </TeacherLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/exams/:id"
        element={
          <ProtectedRoute role="teacher">
            <TeacherLayout>
              <ExamDetail />
            </TeacherLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/polls/create"
        element={
          <ProtectedRoute role="teacher">
            <TeacherLayout>
              <CreatePoll />
            </TeacherLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/students"
        element={
          <ProtectedRoute role="teacher">
            <TeacherLayout>
              <ManageStudents />
            </TeacherLayout>
          </ProtectedRoute>
        }
      />

      {/* Student routes */}
      <Route
        path="/student/join"
        element={
          <ProtectedRoute role="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam/:examId"
        element={
          <ProtectedRoute role="student">
            <ExamAttempt />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam/:examId/attempt"
        element={
          <ProtectedRoute role="student">
            <ExamSession />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam/:examId/result"
        element={
          <ProtectedRoute role="student">
            <ExamResult />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
