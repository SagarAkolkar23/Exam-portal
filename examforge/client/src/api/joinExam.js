import { useCustomMutation, useCustomQuery } from './useQuery';


export const joinExam = () => {
  return useCustomMutation({
    mutationFn: (data) => ({
      url: '/attempt/join',
      method: 'POST',
      data,
    }),
  });
};

