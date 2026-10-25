import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { endpoints } from '../../api/endpoints';
import { BookingDetailPage } from '../../components/admin/AdminPages';
import type { AdminBookingDetail } from '../../types/api';

const detail: AdminBookingDetail = {
  id: 10,
  status: 'CONFIRMED',
  startsAt: '2026-11-05T10:00:00',
  endsAt: '2026-11-05T12:00:00',
  durationMinutes: 120,
  hourlyRate: 500,
  totalAmount: 1000,
  location: 'Baner, Pune',
  notes: 'Bruno needs a walk before lunch.',
  cancellationReason: null,
  rating: null,
  review: null,
  createdAt: '2026-10-30T09:15:00Z',
  serviceName: 'Pet sitting',
  serviceDescription: 'In-home care and companionship.',
  customer: {
    id: 3,
    name: 'Riya Deshmukh',
    email: 'riya@example.test',
    phone: '9876543210',
  },
  caretaker: {
    id: 2,
    name: 'Asha Rao',
    email: 'asha@example.test',
    phone: '9988776655',
  },
  pet: {
    id: 7,
    name: 'Bruno',
    species: 'Dog',
    breed: 'Golden Retriever',
    ageYears: 3.5,
    notes: 'Friendly and energetic.',
    foodNotes: 'Chicken and rice twice a day.',
    photoUrl: null,
  },
  payment: {
    status: 'SUCCEEDED',
    amount: 1000,
    currency: 'INR',
  },
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/admin/bookings/10']}>
        <Routes>
          <Route path="/admin/bookings/:id" element={<BookingDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('admin booking details', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('shows the customer, pet, schedule, service, payment, and caretaker', async () => {
    vi.spyOn(endpoints.admin, 'bookingDetail').mockResolvedValue(detail);
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Pet sitting' })).toBeInTheDocument();
    expect(screen.getByText('Riya Deshmukh')).toBeInTheDocument();
    expect(screen.getByText('riya@example.test')).toBeInTheDocument();
    expect(screen.getByText('9876543210')).toBeInTheDocument();
    expect(screen.getByText('Bruno')).toBeInTheDocument();
    expect(screen.getByText('Dog · Golden Retriever · 3.5 years')).toBeInTheDocument();
    expect(screen.getByText('Friendly and energetic.')).toBeInTheDocument();
    expect(screen.getByText('2 hr')).toBeInTheDocument();
    expect(screen.getByText('Baner, Pune')).toBeInTheDocument();
    expect(screen.getByText('₹1,000')).toBeInTheDocument();
    expect(screen.getByText('Succeeded')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to Asha Rao/i })).toHaveAttribute(
      'href',
      '/admin/caretakers/2',
    );
    expect(screen.getByRole('link', { name: 'View caretaker profile' })).toHaveAttribute(
      'href',
      '/admin/caretakers/2',
    );
  });

  it('shows a fallback when no payment has been recorded', async () => {
    vi.spyOn(endpoints.admin, 'bookingDetail').mockResolvedValue({ ...detail, payment: null });
    renderPage();

    expect(await screen.findByText('No payment recorded for this booking.')).toBeInTheDocument();
  });

  it('shows the cancellation reason for cancelled bookings', async () => {
    vi.spyOn(endpoints.admin, 'bookingDetail').mockResolvedValue({
      ...detail,
      status: 'CANCELLED',
      cancellationReason: 'Owner travelling',
    });
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Cancellation reason' })).toBeInTheDocument();
    expect(screen.getByText('Owner travelling')).toBeInTheDocument();
  });

  it('shows the customer review for completed bookings', async () => {
    vi.spyOn(endpoints.admin, 'bookingDetail').mockResolvedValue({
      ...detail,
      status: 'COMPLETED',
      rating: 5,
      review: 'Excellent care',
    });
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Customer review' })).toBeInTheDocument();
    expect(screen.getByText('5/5')).toBeInTheDocument();
    expect(screen.getByText('"Excellent care"')).toBeInTheDocument();
  });
});
