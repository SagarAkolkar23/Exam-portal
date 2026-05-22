import { useCustomMutation, useCustomQuery } from './useQuery';
import { useAnalyticsStore } from '../store/analyticsStore';

export const useTeacherLogin = () => {
  return useCustomMutation({
    mutationFn: (data) => ({
      url: '/auth/teacher/login',
      method: 'POST',
      data,
    }),
  });
};

export const useTeacherRegister = () => {
  return useCustomMutation({
    mutationFn: (data) => ({
      url: '/auth/teacher/register',
      method: 'POST',
      data,
    }),
  });
};

export const useStudentLogin = () => {
  return useCustomMutation({
    mutationFn: (data) => ({
      url: '/auth/student/login',
      method: 'POST',
      data,
    }),
  });
};

export const useStudentJoin = () => {
  return useCustomMutation({
    mutationFn: (data) => ({
      url: '/exams/attempt/join',
      method: 'POST',
      data,
    }),
  });
};

export const useGetExams = () => {
  return useCustomQuery({
    queryKey: ['exams'],
    queryFn: () => ({
      url: '/exams',
      method: 'GET',
    }),
  });
};

export const useGetPolls = () => {
  return useCustomQuery({
    queryKey: ['polls'],
    queryFn: () => ({
      url: '/polls',
      method: 'GET',
    }),
    refetchInterval: 10000,
  });
};

export const useAddTestStudent = () => {
  return useCustomMutation({
    mutationFn: (data) => ({
      url: '/students/seed',
      method: 'POST',
      data,
    }),
  });
};

export const useEndExam = () => {
  return useCustomMutation({
    mutationFn: (examId) => ({
      url: `/exams/${examId}/end`,
      method: 'POST',
    }),
  });
};

export const useTogglePoll = () => {
  return useCustomMutation({
    mutationFn: ({ pollId, isOpen }) => ({
      url: `/polls/${pollId}/${isOpen ? 'close' : 'open'}`,
      method: 'POST',
    }),
  });
};

export const useDeletePoll = () => {
  return useCustomMutation({
    mutationFn: (pollId) => ({
      url: `/polls/${pollId}`,
      method: 'DELETE',
    }),
  });
};

export const useGetExam = (id, enabled = true) => {
  return useCustomQuery({
    queryKey: ['exam', id],
    queryFn: () => ({
      url: `/exams/${id}`,
      method: 'GET',
    }),
    enabled: !!id && enabled,
  });
};

export const useGetStudents = (enabled = true) => {
  return useCustomQuery({
    queryKey: ['students'],
    queryFn: () => ({
      url: '/students',
      method: 'GET',
    }),
    enabled,
  });
};

export const useCreateExam = () => {
  return useCustomMutation({
    mutationFn: (data) => ({
      url: '/exams',
      method: 'POST',
      data,
    }),
  });
};

export const useUpdateExam = () => {
  return useCustomMutation({
    mutationFn: ({ id, payload }) => ({
      url: `/exams/${id}`,
      method: 'PUT',
      data: payload,
    }),
  });
};

export const usePublishExam = () => {
  return useCustomMutation({
    mutationFn: (examId) => ({
      url: `/exams/${examId}/publish`,
      method: 'POST',
    }),
  });
};

export const useGetExamResults = (id, enabled = true) => {
  return useCustomQuery({
    queryKey: ['examResults', id],
    queryFn: () => ({
      url: `/exams/${id}/results`,
      method: 'GET',
    }),
    enabled: !!id && enabled,
  });
};

export const useCreatePoll = () => {
  return useCustomMutation({
    mutationFn: (data) => ({
      url: '/polls',
      method: 'POST',
      data,
    }),
  });
};

export const useProctorEvent = () => {
  return useCustomMutation({
    mutationFn: (data) => ({
      url: '/proctor/event',
      method: 'POST',
      data,
    }),
  });
};

export const useSubmitExam = () => {
  return useCustomMutation({
    mutationFn: (data) => ({
      url: '/exams/attempt/submit',
      method: 'POST',
      data,
    }),
  });
};

export const useGetCheats = (examId, studentId, enabled = true) => {
  return useCustomQuery({
    queryKey: ['cheats', examId, studentId],
    queryFn: () => ({
      url: `/proctor/cheats/${examId}/${studentId}`,
      method: 'GET',
    }),
    enabled: !!examId && !!studentId && enabled,
  });
};

export const useIncrementCheats = () => {
  return useCustomMutation({
    mutationFn: ({ examId, studentId }) => ({
      url: `/proctor/cheats/${examId}/${studentId}`,
      method: 'POST',
    }),
  });
};

export const useCreateStudent = () => {
  return useCustomMutation({
    mutationFn: (data) => ({
      url: '/students',
      method: 'POST',
      data,
    }),
  });
};

export const useImportStudents = () => {
  return useCustomMutation({
    mutationFn: (data) => ({
      url: '/students/import',
      method: 'POST',
      data,
    }),
  });
};

export const useUpdateStudent = () => {
  return useCustomMutation({
    mutationFn: ({ id, data }) => ({
      url: `/students/${id}`,
      method: 'PUT',
      data,
    }),
  });
};

export const useDeleteStudent = () => {
  return useCustomMutation({
    mutationFn: (id) => ({
      url: `/students/${id}`,
      method: 'DELETE',
    }),
  });
};

// ── Teacher Analytics Queries ───────────────────────────────────────────────

export const useGetTeacherAnalyticsExams = () => {
  return useCustomQuery({
    queryKey: ['teacher-analytics-overview'],
    queryFn: () => ({
      url: '/teacher/analytics/exams',
      method: 'GET',
    }),
    staleTime: 60_000,
  });
};

export const useGetScoreDistribution = (enabled = true) => {
  const { examId, semester, studentClass, division, year } = useAnalyticsStore();
  const params = {};
  if (semester) params.semester = semester;
  if (studentClass) params.studentClass = studentClass;
  if (division) params.division = division;
  if (year) params.year = year;

  return useCustomQuery({
    queryKey: ['score-distribution', examId, semester, studentClass, division, year],
    queryFn: () => ({
      url: `/teacher/analytics/exams/${examId}/score-distribution`,
      method: 'GET',
      params,
    }),
    enabled: !!examId && enabled,
    staleTime: 30_000,
  });
};

export const useGetCheatReport = (enabled = true) => {
  const { examId, semester, studentClass, division, year } = useAnalyticsStore();
  const params = {};
  if (semester) params.semester = semester;
  if (studentClass) params.studentClass = studentClass;
  if (division) params.division = division;
  if (year) params.year = year;

  return useCustomQuery({
    queryKey: ['cheat-report', examId, semester, studentClass, division, year],
    queryFn: () => ({
      url: `/teacher/analytics/exams/${examId}/cheat-report`,
      method: 'GET',
      params,
    }),
    enabled: !!examId && enabled,
    staleTime: 30_000,
  });
};

export const useGetQuestionAnalysis = (enabled = true) => {
  const { examId, semester, studentClass, division, year } = useAnalyticsStore();
  const params = {};
  if (semester) params.semester = semester;
  if (studentClass) params.studentClass = studentClass;
  if (division) params.division = division;
  if (year) params.year = year;

  return useCustomQuery({
    queryKey: ['question-analysis', examId, semester, studentClass, division, year],
    queryFn: () => ({
      url: `/teacher/analytics/exams/${examId}/question-analysis`,
      method: 'GET',
      params,
    }),
    enabled: !!examId && enabled,
    staleTime: 30_000,
  });
};

export const useGetClassesAndYears = () => {
  return useCustomQuery({
    queryKey: ['threshold-filters'],
    queryFn: () => ({
      url: '/teacher/analytics/classes-years',
      method: 'GET',
    }),
    staleTime: 60_000,
  });
};

export const useGetThresholdReport = (threshold, enabled = true) => {
  const { examId, semester, studentClass, division, year } = useAnalyticsStore();
  const params = { threshold: threshold.toString(), examId };
  if (semester) params.semester = semester;
  if (studentClass) params.studentClass = studentClass;
  if (division) params.division = division;
  if (year) params.year = year.toString();

  return useCustomQuery({
    queryKey: ['threshold-report', examId, threshold, semester, studentClass, division, year],
    queryFn: () => ({
      url: `/teacher/analytics/threshold-report`,
      method: 'GET',
      params,
    }),
    enabled: !!examId && enabled,
    staleTime: 10_000,
  });
};

