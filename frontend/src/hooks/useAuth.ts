import { useQuery } from '@tanstack/react-query';

import { endpoints } from '../api/endpoints';
import { ApiError } from '../api/errors';
import { authQueryKey } from '../context/queryClient';

export function useAuth() {
  return useQuery({
    queryKey: authQueryKey,
    queryFn: async () => {
      try {
        return await endpoints.auth.me();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    retry: false,
  });
}
