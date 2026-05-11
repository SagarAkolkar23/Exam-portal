import { useQuery, useMutation } from '@tanstack/react-query';
import api from './axios';

export const useCustomQuery = ({ queryKey, queryFn, enabled = true, ...options }) => {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const config = queryFn();
      const response = await api(config);
      return response.data;
    },
    enabled,
    ...options,
  });
};

export const useCustomMutation = ({ mutationFn, ...options }) => {
  return useMutation({
    mutationFn: async (variables) => {
      const config = mutationFn(variables);
      const response = await api(config);
      return response.data;
    },
    ...options,
  });
};
