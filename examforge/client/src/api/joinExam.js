import { useCustomMutation } from './useQuery';
import { useAttemptStore } from '../store/attemptStore';

export const joinExam = () => {
  return useCustomMutation({
    mutationFn: (data) => ({
      url: '/attempt/join',
      method: 'POST',
      data,
    }),
  });
};

export const startExam = () => {
  return useCustomMutation({
    mutationFn: () => {
      const examId = useAttemptStore
        .getState()
        .examId;

      return {
        url: '/attempt/start',
        method: 'POST',
        data: { examId },
      };
    },
  });
};