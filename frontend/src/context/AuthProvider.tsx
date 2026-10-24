import { useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useCallback, useMemo } from 'react';

import { endpoints } from '../api/endpoints';
import { useAuth } from '../hooks/useAuth';
import { AuthContext } from './AuthContext';
import { authQueryKey } from './queryClient';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const auth = useAuth();
  const reload = useCallback(async () => {
    const user = await endpoints.auth.me();
    queryClient.setQueryData(authQueryKey, user);
    return user;
  }, [queryClient]);
  const value = useMemo(
    () => ({
      user: auth.data ?? null,
      isLoading: auth.isPending,
      error: auth.error instanceof Error ? auth.error : null,
      reload,
    }),
    [auth.data, auth.error, auth.isPending, reload],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
