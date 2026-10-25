import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { endpoints } from '../../api/endpoints';
import { AdminCaretakerDetailPage } from '../../components/admin/AdminPages';
import { ToastProvider } from '../../context/ToastProvider';
import type { AdminBookingSummary, AdminCaretakerDetail } from '../../types/api';

const profile: AdminCaretakerDetail = {
  id: 2,
  name: 'Asha Rao',
  email: 'asha@example.test',
  phone: '9876543210',
  photoUrl: 'https://example.test/asha.jpg',
  bio: 'Patient and gentle with senior dogs.',
  experienceYears: 4,
  hourlyRate: 500,
  serviceAreas: 'Baner',
  languages: 'English, Hindi, Marathi',
  approvalStatus: 'APPROVED',
  verified: true,
  registeredAt: '2026-08-14T10:00:00Z',
  updatedAt: '2026-09-02T10:00:00Z',
  rating: 5,
  reviewCount: 1,
  services: [{ id: 1, name: 'Pet sitting', description: 'In-home care', hourlyRate: 500 }],
  areas: [{ id: 1, name: 'Baner', city: 'Pune' }],
  reviews: [
    {
      id: 1,
      rating: 5,
      comment: 'Asha took wonderful care of Bruno.',
      moderationStatus: 'APPROVED',
      bookingId: 10,
      author: 'Riya Deshmukh',
      caretaker: 'Asha Rao',
      createdAt: '2026-09-01T10:00:00Z',
    },
  ],
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={['/admin/caretakers/2']}>
          <Routes>
            <Route path="/admin/caretakers/:id" element={<AdminCaretakerDetailPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

const booking: AdminBookingSummary = {
  id: 10,
  status: 'COMPLETED',
  paymentStatus: 'SUCCEEDED',
  cancellationReason: null,
  rating: 5,
  review: 'Excellent care',
  startsAt: '2026-09-04T10:00:00',
  endsAt: '2026-09-04T12:00:00',
  durationMinutes: 120,
  hourlyRate: 500,
  totalAmount: 1000,
  serviceName: 'Pet sitting',
  petName: 'Bruno',
  customerName: 'Riya Deshmukh',
  customerEmail: 'riya@example.test',
  customerPhone: '9876543210',
  caretakerName: 'Asha Rao',
  caretakerEmail: 'asha@example.test',
  caretakerPhone: '9988776655',
  customerPhotoUrl: null,
  caretakerPhotoUrl: null,
  petPhotoUrl: null,
  petSpecies: 'Dog',
  petBreed: 'Golden Retriever',
  petAgeYears: 3.5,
  petNotes: 'Friendly and energetic.',
  petFoodNotes: 'Chicken and rice twice a day.',
  createdAt: '2026-09-01T10:00:00Z',
};

describe('admin caretaker details', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('shows a profile loader while caretaker data is being fetched', () => {
    vi.spyOn(endpoints.admin, 'caretakerDetail').mockReturnValue(
      new Promise<AdminCaretakerDetail>(() => {}),
    );
    const { container } = renderPage();

    expect(screen.getByRole('status', { name: 'Loading caretaker profile' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(container.querySelector('.admin-profile-skeleton')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to caretakers/i })).toHaveAttribute(
      'href',
      '/admin/caretakers',
    );
  });

  it('shows the profile, contact information, services, and reviews', async () => {
    vi.spyOn(endpoints.admin, 'caretakerDetail').mockResolvedValue(profile);
    vi.spyOn(endpoints.admin, 'caretakerBookings').mockResolvedValue([]);
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Asha Rao' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Asha Rao profile picture' })).toHaveAttribute(
      'src',
      'https://example.test/asha.jpg',
    );
    expect(screen.getAllByText('asha@example.test').length).toBeGreaterThan(0);
    expect(screen.getAllByText('9876543210').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Baner').length).toBeGreaterThan(0);
    expect(screen.getByText('Pet sitting')).toBeInTheDocument();
    expect(screen.getByText('Asha took wonderful care of Bruno.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Suspend' })).toBeInTheDocument();
  });

  it('shows a success toast for every caretaker decision', async () => {
    vi.spyOn(endpoints.admin, 'caretakerDetail').mockResolvedValue(profile);
    vi.spyOn(endpoints.admin, 'caretakerBookings').mockResolvedValue([]);
    const update = vi.spyOn(endpoints.admin, 'updateCaretaker').mockResolvedValue();
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Suspend' }));

    await waitFor(() => expect(update).toHaveBeenCalledWith(2, 'SUSPENDED'));
    expect(await screen.findByText('Caretaker suspended')).toBeInTheDocument();
    expect(
      screen.getByText('Asha Rao can no longer sign in or accept bookings.'),
    ).toBeInTheDocument();
  });

  it('shows an error toast when a caretaker decision fails', async () => {
    vi.spyOn(endpoints.admin, 'caretakerDetail').mockResolvedValue(profile);
    vi.spyOn(endpoints.admin, 'caretakerBookings').mockResolvedValue([]);
    vi.spyOn(endpoints.admin, 'updateCaretaker').mockRejectedValue(
      new Error('Service unavailable'),
    );
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Suspend' }));

    expect(await screen.findByText('Caretaker update failed')).toBeInTheDocument();
    expect(screen.getByText('Service unavailable')).toBeInTheDocument();
  });

  it('lists bookings for suspended caretakers and links each one to its details', async () => {
    vi.spyOn(endpoints.admin, 'caretakerDetail').mockResolvedValue({
      ...profile,
      approvalStatus: 'SUSPENDED',
    });
    vi.spyOn(endpoints.admin, 'caretakerBookings').mockResolvedValue([booking]);
    renderPage();

    expect(await screen.findByText('Pet sitting · Bruno')).toBeInTheDocument();
    expect(screen.getAllByText('Riya Deshmukh').length).toBeGreaterThan(0);
    expect(screen.getByText('1 total · 1 completed')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View booking 10 details' })).toHaveAttribute(
      'href',
      '/admin/bookings/10',
    );
  });

  it('does not request or show booking history for pending caretakers', async () => {
    vi.spyOn(endpoints.admin, 'caretakerDetail').mockResolvedValue({
      ...profile,
      approvalStatus: 'PENDING',
      verified: false,
    });
    const bookingHistory = vi.spyOn(endpoints.admin, 'caretakerBookings').mockResolvedValue([]);
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Asha Rao' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Bookings' })).not.toBeInTheDocument();
    expect(bookingHistory).not.toHaveBeenCalled();
  });
});
