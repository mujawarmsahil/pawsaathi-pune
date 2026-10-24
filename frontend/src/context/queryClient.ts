import { QueryClient } from '@tanstack/react-query';

export const authQueryKey = ['auth', 'me'] as const;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
});

export function clearSessionCache(client: QueryClient = queryClient) {
  client.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' });
  client.setQueryData(authQueryKey, null);
}
