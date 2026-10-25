import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { endpoints } from '../../api/endpoints';
import { BookingsPage } from '../../components/admin/AdminPages';
import type { AdminBookingSummary } from '../../types/api';

const bookings: AdminBookingSummary[] = [
  {
    id: 21,
    status: 'CONFIRMED',
    paymentStatus: 'PENDING',
    cancellationReason: null,
    rating: null,
    review: null,
    startsAt: '2026-11-06T10:00:00',
    endsAt: '2026-11-06T12:00:00',
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
    customerPhotoUrl: 'https://example.test/riya.jpg',
    caretakerPhotoUrl: 'https://example.test/asha.jpg',
    petPhotoUrl: 'https://example.test/bruno.jpg',
    petSpecies: 'Dog',
    petBreed: 'Golden Retriever',
    petAgeYears: 3.5,
    petNotes: 'Friendly and energetic.',
    petFoodNotes: 'Chicken and rice twice a day.',
    createdAt: '2026-10-30T09:15:00Z',
  },
  {
    id: 22,
    status: 'COMPLETED',
    paymentStatus: 'SUCCEEDED',
    cancellationReason: null,
    rating: 5,
    review: 'Excellent care',
    startsAt: '2026-11-04T14:00:00',
    endsAt: '2026-11-04T15:00:00',
    durationMinutes: 60,
    hourlyRate: 300,
    totalAmount: 300,
    serviceName: 'Dog walking',
    petName: 'Milo',
    customerName: 'Dev Shah',
    customerEmail: 'dev@example.test',
    customerPhone: null,
    caretakerName: 'Neha Rao',
    caretakerEmail: 'neha@example.test',
    caretakerPhone: null,
    customerPhotoUrl: null,
    caretakerPhotoUrl: null,
    petPhotoUrl: null,
    petSpecies: 'Cat',
    petBreed: 'Indie shorthair',
    petAgeYears: 2,
    petNotes: 'Shy around new people.',
    petFoodNotes: 'Wet food in the evening.',
    createdAt: '2026-10-29T09:15:00Z',
  },
  {
    id: 23,
    status: 'CANCELLED',
    paymentStatus: 'PENDING',
    cancellationReason: 'Owner travelling',
    rating: null,
    review: null,
    startsAt: '2026-11-02T11:00:00',
    endsAt: '2026-11-02T12:00:00',
    durationMinutes: 60,
    hourlyRate: 400,
    totalAmount: 400,
    serviceName: 'Grooming visit',
    petName: 'Simba',
    customerName: 'Nisha Kulkarni',
    customerEmail: 'nisha@example.test',
    customerPhone: '9000011111',
    caretakerName: 'Rahul Patil',
    caretakerEmail: 'rahul@example.test',
    caretakerPhone: '9000022222',
    customerPhotoUrl: null,
    caretakerPhotoUrl: null,
    petPhotoUrl: null,
    petSpecies: 'Cat',
    petBreed: 'Persian',
    petAgeYears: 4,
    petNotes: 'Needs a quiet groomer.',
    petFoodNotes: 'Dry food only.',
    createdAt: '2026-10-28T09:15:00Z',
  },
  {
    id: 24,
    status: 'REQUESTED',
    paymentStatus: 'PENDING',
    cancellationReason: null,
    rating: null,
    review: null,
    startsAt: '2026-11-03T09:00:00',
    endsAt: '2026-11-03T10:00:00',
    durationMinutes: 60,
    hourlyRate: 350,
    totalAmount: 350,
    serviceName: 'Drop-in visit',
    petName: 'Coco',
    customerName: 'Kabir Menon',
    customerEmail: 'kabir@example.test',
    customerPhone: '9000033333',
    caretakerName: 'Meera Iyer',
    caretakerEmail: 'meera@example.test',
    caretakerPhone: '9000044444',
    customerPhotoUrl: null,
    caretakerPhotoUrl: null,
    petPhotoUrl: null,
    petSpecies: 'Dog',
    petBreed: 'Beagle',
    petAgeYears: 1.5,
    petNotes: 'Friendly with children.',
    petFoodNotes: 'Half a cup of kibble twice a day.',
    createdAt: '2026-10-27T09:15:00Z',
  },
];

function renderBookings() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <BookingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('admin booking tabs', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('renders tabs with correct labels and counts', async () => {
    vi.spyOn(endpoints.admin, 'bookings').mockResolvedValue(bookings);
    renderBookings();

    await screen.findByRole('tablist');
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Ongoing bookings2' })).toBeInTheDocument();
    });
    expect(screen.getByRole('tab', { name: 'Completed bookings1' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Cancelled bookings1' })).toBeInTheDocument();
  });

  it('shows cancelled booking with cancellation reason', async () => {
    vi.spyOn(endpoints.admin, 'bookings').mockResolvedValue(bookings);
    renderBookings();

    await screen.findByRole('tab', { name: 'Cancelled bookings1' });
    await userEvent.click(screen.getByRole('tab', { name: 'Cancelled bookings1' }));

    expect(screen.getByText('Nisha Kulkarni')).toBeInTheDocument();
    expect(screen.getByText('Cancellation reason')).toBeInTheDocument();
    expect(screen.getByText('Owner travelling')).toBeInTheDocument();
    expect(screen.queryByText('Paid')).not.toBeInTheDocument();
  });

  it('sorts bookings by date within the active tab', async () => {
    vi.spyOn(endpoints.admin, 'bookings').mockResolvedValue(bookings);
    renderBookings();

    // Wait for data to load - Ongoing tab active by default
    await waitFor(() => {
      expect(screen.getByRole('listitem', { name: 'Pet sitting' })).toBeInTheDocument();
    });

    const sortSelect = screen.getByRole('combobox', { name: 'Sort by time slot' });
    await userEvent.selectOptions(sortSelect, 'oldest');

    // Ongoing tab has Pet sitting (6 Nov) and Drop-in visit (3 Nov)
    // Oldest first: Drop-in visit first, then Pet sitting
    await waitFor(() => {
      expect(screen.getByRole('listitem', { name: 'Drop-in visit' })).toBeInTheDocument();
    });
    expect(screen.getByRole('listitem', { name: 'Pet sitting' })).toBeInTheDocument();

    await userEvent.selectOptions(sortSelect, 'newest');

    // Newest first: Pet sitting first, then Drop-in visit
    expect(screen.getByRole('listitem', { name: 'Pet sitting' })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: 'Drop-in visit' })).toBeInTheDocument();
  });
});
