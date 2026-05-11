import { useCustomMutation, useCustomQuery } from './useQuery';

export const useTeacherLogin = () => {
  return useCustomMutation({
    mutationFn: (data) => ({
      url: '/auth/teacher/login',
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


