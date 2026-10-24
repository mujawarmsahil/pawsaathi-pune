import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { RoleRoute } from '../components/auth/RoleRoute';
import { AuthContext, type AuthContextValue } from '../context/AuthContext';
import { HomeRoute } from './HomeRoute';

function renderRoutes(auth: AuthContextValue, initialPath: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={auth}>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/login" element={<h1>Login page</h1>} />
            <Route path="/app/bookings" element={<h1>Customer bookings</h1>} />
            <Route path="/caretaker/bookings" element={<h1>Caretaker bookings</h1>} />
            <Route path="/change-password" element={<h1>Change password</h1>} />
            <Route element={<ProtectedRoute />}>
              <Route element={<RoleRoute roles={['ADMIN']} />}>
                <Route path="/admin" element={<h1>Admin console</h1>} />
              </Route>
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

describe('public and protected routes', () => {
  it('renders public discovery without a session', () => {
    renderRoutes({ user: null, isLoading: false, error: null, reload: vi.fn() }, '/');
    expect(screen.getByRole('heading', { name: /a little help/i })).toBeInTheDocument();
  });

  it('waits for the current-user check before rendering protected content', () => {
    renderRoutes({ user: null, isLoading: true, error: null, reload: vi.fn() }, '/admin');
    expect(screen.getByRole('status')).toHaveTextContent('Checking your session');
  });

  it('sends signed-in users from the root to their dashboard', () => {
    renderRoutes(
      {
        user: {
          id: 3,
          name: 'Asha',
          email: 'asha@example.test',
          role: 'CUSTOMER',
          mustChangePassword: false,
        },
        isLoading: false,
        error: null,
        reload: vi.fn(),
      },
      '/',
    );
    expect(screen.getByRole('heading', { name: 'Customer bookings' })).toBeInTheDocument();
  });

  it('sends signed-in admins from the root to the admin console', () => {
    renderRoutes(
      {
        user: {
          id: 4,
          name: 'Admin',
          email: 'admin@example.test',
          role: 'ADMIN',
          mustChangePassword: false,
        },
        isLoading: false,
        error: null,
        reload: vi.fn(),
      },
      '/',
    );
    expect(screen.getByRole('heading', { name: 'Admin console' })).toBeInTheDocument();
  });

  it('sends users who must change their password to the change-password page', () => {
    renderRoutes(
      {
        user: {
          id: 5,
          name: 'New Admin',
          email: 'new-admin@example.test',
          role: 'ADMIN',
          mustChangePassword: true,
        },
        isLoading: false,
        error: null,
        reload: vi.fn(),
      },
      '/',
    );
    expect(screen.getByRole('heading', { name: 'Change password' })).toBeInTheDocument();
  });

  it('sends signed-out users to login and blocks the wrong role', () => {
    const signedOut = renderRoutes(
      { user: null, isLoading: false, error: null, reload: vi.fn() },
      '/admin',
    );
    expect(screen.getByRole('heading', { name: 'Login page' })).toBeInTheDocument();
    signedOut.unmount();
    renderRoutes(
      {
        user: {
          id: 2,
          name: 'Ria',
          email: 'ria@example.test',
          role: 'CUSTOMER',
          mustChangePassword: false,
        },
        isLoading: false,
        error: null,
        reload: vi.fn(),
      },
      '/admin',
    );
    expect(screen.queryByRole('heading', { name: 'Admin console' })).not.toBeInTheDocument();
  });
});
