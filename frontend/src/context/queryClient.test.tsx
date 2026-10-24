import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { CurrentUser } from '../types/api';
import { authQueryKey, clearSessionCache } from './queryClient';

const admin: CurrentUser = {
  id: 1,
  name: 'Admin',
  email: 'admin@example.test',
  role: 'ADMIN',
  mustChangePassword: false,
};

function AuthProbe() {
  const auth = useQuery<CurrentUser | null>({
    queryKey: authQueryKey,
    queryFn: () => null,
  });
  return <p>{auth.data ? auth.data.name : 'Signed out'}</p>;
}

describe('session cache', () => {
  it('updates the active auth observer and removes other cached data', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false } },
    });
    client.setQueryData(authQueryKey, admin);
    client.setQueryData(['pets'], [{ id: 1 }]);

    render(
      <QueryClientProvider client={client}>
        <AuthProbe />
      </QueryClientProvider>,
    );
    expect(screen.getByText('Admin')).toBeInTheDocument();

    await act(async () => clearSessionCache(client));

    await waitFor(() => expect(screen.getByText('Signed out')).toBeInTheDocument());
    expect(client.getQueryData(['pets'])).toBeUndefined();
  });
});
