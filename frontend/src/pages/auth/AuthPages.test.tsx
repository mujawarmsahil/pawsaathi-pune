import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { endpoints } from '../../api/endpoints';
import { LoginPage, RegisterPage } from '../../components/auth/AuthPages';
import { AuthContext } from '../../context/AuthContext';

const user = {
  id: 9,
  name: 'Asha Rao',
  email: 'asha@example.test',
  role: 'CUSTOMER' as const,
  mustChangePassword: false,
};

function renderAuth(path: string, page: React.ReactNode) {
  return render(
    <AuthContext.Provider
      value={{ user: null, isLoading: false, error: null, reload: vi.fn().mockResolvedValue(user) }}
    >
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={page} />
          <Route path="/register" element={page} />
          <Route path="/app/bookings" element={<h1>Customer bookings</h1>} />
          <Route path="/caretaker/onboarding" element={<h1>Caretaker onboarding</h1>} />
          <Route path="/admin" element={<h1>Admin overview</h1>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('authentication forms', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('validates and submits a login without persisting session data in the browser', async () => {
    const login = vi
      .spyOn(endpoints.auth, 'login')
      .mockResolvedValue({ token: 'memory-token', user });
    renderAuth('/login', <LoginPage />);
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'asha@example.test' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'UnpersistedPassword123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    await waitFor(() =>
      expect(login).toHaveBeenCalledWith({
        email: 'asha@example.test',
        password: 'UnpersistedPassword123!',
      }),
    );
    expect(await screen.findByRole('heading', { name: 'Customer bookings' })).toBeInTheDocument();
  });

  it('validates registration password strength and creates a customer account', async () => {
    const register = vi
      .spyOn(endpoints.auth, 'register')
      .mockResolvedValue({ token: 'memory-token', user });
    renderAuth('/register', <RegisterPage />);
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Asha Rao' } });
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'asha@example.test' },
    });
    fireEvent.change(screen.getByLabelText('Password', { exact: true }), {
      target: { value: 'Weakpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText(/uppercase/i)).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Password', { exact: true }), {
      target: { value: 'UnpersistedPassword123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => expect(register).toHaveBeenCalledOnce());
    expect(await screen.findByRole('heading', { name: 'Customer bookings' })).toBeInTheDocument();
  });

  it('shows the approval message when caretaker registration is pending', async () => {
    const register = vi.spyOn(endpoints.auth, 'register').mockResolvedValue({
      status: 'PENDING_APPROVAL',
      message: 'An administrator must approve your application before sign-in.',
    });
    renderAuth('/register', <RegisterPage />);
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Asha Rao' } });
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'asha@example.test' },
    });
    fireEvent.change(screen.getByLabelText('I’m here as'), {
      target: { value: 'CARETAKER' },
    });
    fireEvent.change(screen.getByLabelText('Password', { exact: true }), {
      target: { value: 'UnpersistedPassword123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText('Application submitted')).toBeInTheDocument();
    expect(
      screen.getByText('An administrator must approve your application before sign-in.'),
    ).toBeInTheDocument();
    expect(register).toHaveBeenCalledWith(expect.objectContaining({ role: 'CARETAKER' }));
  });
});
