import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { endpoints } from '../../api/endpoints';
import { CustomerProfilePage } from '../../components/customer/CustomerPages';
import { AuthContext } from '../../context/AuthContext';
import { ToastProvider } from '../../context/ToastProvider';
import type { AccountProfile, CurrentUser } from '../../types/api';

const user: CurrentUser = {
  id: 7,
  name: 'Riya Deshmukh',
  email: 'riya@example.test',
  role: 'CUSTOMER',
  mustChangePassword: false,
};

const profile: AccountProfile = {
  ...user,
  phone: '9876543210',
  photoUrl: null,
  status: 'ACTIVE',
  verified: false,
  createdAt: '2026-01-02T03:04:05Z',
  updatedAt: '2026-02-03T04:05:06Z',
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const reload = vi.fn().mockResolvedValue(user);
  render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ user, isLoading: false, error: null, reload }}>
        <ToastProvider>
          <MemoryRouter>
            <CustomerProfilePage />
          </MemoryRouter>
        </ToastProvider>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
  return { reload };
}

describe('customer profile', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('shows editable personal details and read-only account details', async () => {
    vi.spyOn(endpoints.account, 'profile').mockResolvedValue(profile);
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Personal details' })).toBeInTheDocument();
    expect(screen.getByLabelText('Full name')).toHaveValue('Riya Deshmukh');
    expect(screen.getByLabelText('Email address')).toHaveValue('riya@example.test');
    expect(screen.getByLabelText('Phone number')).toHaveValue('9876543210');
    expect(screen.getByText('Pet parent')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('2 January 2026')).toBeInTheDocument();
  });

  it('saves profile changes and refreshes the signed-in user', async () => {
    vi.spyOn(endpoints.account, 'profile').mockResolvedValue(profile);
    const update = vi.spyOn(endpoints.account, 'updateProfile').mockResolvedValue({
      ...profile,
      name: 'Riya S. Deshmukh',
      email: 'new@example.test',
      phone: '+91 98765 43210',
      updatedAt: '2026-03-04T05:06:07Z',
    });
    const { reload } = renderPage();

    const name = await screen.findByLabelText('Full name');
    await userEvent.clear(name);
    await userEvent.type(name, 'Riya S. Deshmukh');
    const email = screen.getByLabelText('Email address');
    await userEvent.clear(email);
    await userEvent.type(email, 'new@example.test');
    const phone = screen.getByLabelText('Phone number');
    await userEvent.clear(phone);
    await userEvent.type(phone, '+91 98765 43210');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(screen.getByRole('dialog', { name: 'Save profile changes?' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save profile' }));

    await waitFor(() =>
      expect(update.mock.calls[0]?.[0]).toEqual({
        name: 'Riya S. Deshmukh',
        email: 'new@example.test',
        phone: '+91 98765 43210',
        photoUrl: null,
      }),
    );
    expect(await screen.findByText('Profile saved')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(reload).toHaveBeenCalled();
    expect(screen.getByLabelText('Email address')).toHaveValue('new@example.test');
  });

  it('uploads a profile picture and saves it with the account', async () => {
    vi.spyOn(endpoints.account, 'profile').mockResolvedValue(profile);
    const update = vi.spyOn(endpoints.account, 'updateProfile').mockResolvedValue({
      ...profile,
      photoUrl: 'data:image/png;base64,aGVsbG8=',
    });
    renderPage();

    const input = await screen.findByLabelText('Profile picture');
    fireEvent.change(input, {
      target: { files: [new File(['hello'], 'avatar.png', { type: 'image/png' })] },
    });

    const save = screen.getByRole('button', { name: 'Save changes' });
    await waitFor(() => expect(save).toBeEnabled());
    await userEvent.click(save);
    await userEvent.click(screen.getByRole('button', { name: 'Save profile' }));

    await waitFor(() =>
      expect(update.mock.calls[0]?.[0]).toEqual({
        name: 'Riya Deshmukh',
        email: 'riya@example.test',
        phone: '9876543210',
        photoUrl: 'data:image/png;base64,aGVsbG8=',
      }),
    );
    expect(await screen.findByText('Profile saved')).toBeInTheDocument();
  });

  it('rejects an unsupported profile picture file', async () => {
    vi.spyOn(endpoints.account, 'profile').mockResolvedValue(profile);
    renderPage();

    const input = await screen.findByLabelText('Profile picture');
    fireEvent.change(input, {
      target: { files: [new File(['notes'], 'notes.txt', { type: 'text/plain' })] },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('Choose a JPG, PNG or WebP image.');
  });

  it('does not update the profile unless the confirmation is accepted', async () => {
    vi.spyOn(endpoints.account, 'profile').mockResolvedValue(profile);
    const update = vi.spyOn(endpoints.account, 'updateProfile');
    renderPage();

    const name = await screen.findByLabelText('Full name');
    await userEvent.clear(name);
    await userEvent.type(name, 'Riya S. Deshmukh');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(screen.getByRole('dialog', { name: 'Save profile changes?' })).toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();
  });

  it('shows an error toast when the profile update is rejected', async () => {
    vi.spyOn(endpoints.account, 'profile').mockResolvedValue(profile);
    vi.spyOn(endpoints.account, 'updateProfile').mockRejectedValue(
      new Error('An account with this email already exists.'),
    );
    renderPage();

    const email = await screen.findByLabelText('Email address');
    await userEvent.clear(email);
    await userEvent.type(email, 'taken@example.test');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save profile' }));

    expect(await screen.findByText('Profile update failed')).toBeInTheDocument();
    expect(screen.getByText('An account with this email already exists.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
