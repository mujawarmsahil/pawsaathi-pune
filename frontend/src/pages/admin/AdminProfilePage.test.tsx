import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { endpoints } from '../../api/endpoints';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { AuthContext } from '../../context/AuthContext';
import { ToastProvider } from '../../context/ToastProvider';
import type { AccountProfile, CurrentUser } from '../../types/api';
import { AdminProfilePage } from './AdminPages';

const user: CurrentUser = {
  id: 1,
  name: 'PawSaathi Admin',
  email: 'admin-pawsaathi@pawsaathi.local',
  role: 'ADMIN',
  mustChangePassword: false,
};

const profile: AccountProfile = {
  ...user,
  phone: '9876543210',
  photoUrl: null,
  status: 'ACTIVE',
  verified: true,
  createdAt: '2026-01-02T03:04:05Z',
  updatedAt: '2026-02-03T04:05:06Z',
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ user, isLoading: false, error: null, reload: vi.fn() }}>
        <ToastProvider>
          <MemoryRouter initialEntries={['/admin/profile']}>
            <Routes>
              <Route element={<AdminLayout />}>
                <Route path="/admin/profile" element={<AdminProfilePage />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

describe('admin profile', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('links to and renders the admin account profile', async () => {
    vi.spyOn(endpoints.account, 'profile').mockResolvedValue(profile);
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Personal details' })).toBeInTheDocument();
    const profileLinks = screen.getAllByRole('link', { name: 'Profile' });
    expect(profileLinks).toHaveLength(1);
    expect(profileLinks[0]).toHaveAttribute('href', '/admin/profile');
    expect(profileLinks[0]).toHaveClass('profile-icon-link');
    expect(screen.getByText('Administrator')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toHaveValue('admin-pawsaathi@pawsaathi.local');
  });

  it('shows the profile photo in the header, left of My PawSaathi', async () => {
    const photoUrl = 'data:image/png;base64,aGVsbG8=';
    vi.spyOn(endpoints.account, 'profile').mockResolvedValue({ ...profile, photoUrl });
    renderPage();

    const profileLink = screen.getByRole('link', { name: 'Profile' });
    const myPawSaathi = screen.getByRole('link', { name: /My PawSaathi/ });
    expect(profileLink.compareDocumentPosition(myPawSaathi)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(
      await within(profileLink).findByRole('img', { name: /profile picture/i }),
    ).toHaveAttribute('src', photoUrl);
  });
});
