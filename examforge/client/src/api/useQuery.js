import { useQuery, useMutation } from '@tanstack/react-query';
import api from './axios';
import { queryClient } from './queryClient';

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

/**
 * Custom mutation wrapper.
 * Accepts an optional `invalidateKeys` array — on success,
 * each key will be invalidated via queryClient.invalidateQueries().
 */
export const useCustomMutation = ({ mutationFn, invalidateKeys = [], onSuccess: userOnSuccess, ...options }) => {
  return useMutation({
    mutationFn: async (variables) => {
      const config = mutationFn(variables);
      const response = await api(config);
      return response.data;
    },
    onSuccess: (...args) => {
      // Invalidate all specified query keys
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
      });
      // Call the caller's onSuccess if provided
      userOnSuccess?.(...args);
    },
    ...options,
  });
};
