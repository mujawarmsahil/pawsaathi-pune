import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { endpoints } from '../../api/endpoints';
import { AdminCustomerDetailPage } from '../../components/admin/AdminPages';
import { ToastProvider } from '../../context/ToastProvider';
import type { AdminBookingSummary, AdminCustomer } from '../../types/api';

const booking: AdminBookingSummary = {
  id: 42,
  status: 'COMPLETED',
  paymentStatus: 'SUCCEEDED',
  cancellationReason: null,
  rating: 5,
  review: 'Great care',
  startsAt: '2026-10-20T08:00:00',
  endsAt: '2026-10-20T10:00:00',
  durationMinutes: 120,
  hourlyRate: 500,
  totalAmount: 1000,
  serviceName: 'Pet sitting',
  petName: 'Bruno',
  customerName: 'Riya Deshmukh',
  customerEmail: 'riya@example.test',
  customerPhone: '9876543210',
  caretakerName: 'Priya Joshi',
  caretakerEmail: 'priya@example.test',
  caretakerPhone: '9900112233',
  customerPhotoUrl: null,
  caretakerPhotoUrl: null,
  petPhotoUrl: null,
  petSpecies: 'Dog',
  petBreed: 'Golden Retriever',
  petAgeYears: 3.5,
  petNotes: 'Friendly and energetic.',
  petFoodNotes: 'Chicken and rice twice a day.',
  createdAt: '2026-10-18T10:00:00Z',
};

const customer: AdminCustomer = {
  id: 1,
  name: 'Riya Deshmukh',
  email: 'riya@example.test',
  phone: '9876543210',
  photoUrl: null,
  status: 'ACTIVE',
  area: 'Baner, Pune',
  registeredAt: '2026-08-14T10:00:00Z',
  updatedAt: '2026-09-02T10:00:00Z',
  pets: [
    {
      id: 10,
      name: 'Bruno',
      species: 'Dog',
      breed: 'Golden Retriever',
      ageYears: 3.5,
      notes: 'Friendly and energetic.',
      foodNotes: 'Chicken and rice twice a day.',
      photoUrl: null,
    },
    {
      id: 11,
      name: 'Coco',
      species: 'Cat',
      breed: null,
      ageYears: null,
      notes: null,
      foodNotes: null,
      photoUrl: 'https://example.test/coco.jpg',
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
        <MemoryRouter initialEntries={['/admin/customers/1']}>
          <Routes>
            <Route path="/admin/customers/:id" element={<AdminCustomerDetailPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('admin customer details', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(endpoints.admin, 'customerBookings').mockResolvedValue([booking]);
  });

  it('shows the customer profile, area, contact details, pets, and bookings', async () => {
    vi.spyOn(endpoints.admin, 'customerDetail').mockResolvedValue(customer);
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Riya Deshmukh' })).toBeInTheDocument();
    expect(screen.getAllByText('Baner, Pune').length).toBeGreaterThan(0);
    expect(screen.getAllByText('riya@example.test').length).toBeGreaterThan(0);
    expect(screen.getAllByText('9876543210').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Bruno' }).closest('article')).toHaveAttribute(
      'id',
      'pet-10',
    );
    expect(screen.getByRole('img', { name: 'Coco profile picture' })).toHaveAttribute(
      'src',
      'https://example.test/coco.jpg',
    );
    expect(screen.getByText('Dog · Golden Retriever')).toBeInTheDocument();
    expect(screen.getByText('3.5 years')).toBeInTheDocument();
    expect(screen.getByText('Friendly and energetic.')).toBeInTheDocument();
    expect(screen.getByText('Chicken and rice twice a day.')).toBeInTheDocument();
    expect(screen.getByText('No care notes added.')).toBeInTheDocument();
    expect(await screen.findByText('Pet sitting · Bruno')).toBeInTheDocument();
    expect(screen.getByText('Priya Joshi')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View booking 42 details' })).toHaveAttribute(
      'href',
      '/admin/bookings/42',
    );
    expect(screen.getByText('1 total · 1 completed')).toBeInTheDocument();
  });

  it('deactivates an active customer with a success toast', async () => {
    vi.spyOn(endpoints.admin, 'customerDetail').mockResolvedValue(customer);
    const update = vi
      .spyOn(endpoints.admin, 'updateCustomer')
      .mockResolvedValue({ id: 1, status: 'DEACTIVATED' });
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Deactivate customer' }));

    await waitFor(() => expect(update).toHaveBeenCalledWith(1, 'DEACTIVATED'));
    expect(await screen.findByText('Customer deactivated')).toBeInTheDocument();
    expect(
      screen.getByText('Riya Deshmukh can no longer sign in or book services.'),
    ).toBeInTheDocument();
  });

  it('activates a deactivated customer', async () => {
    vi.spyOn(endpoints.admin, 'customerDetail').mockResolvedValue({
      ...customer,
      status: 'DEACTIVATED',
    });
    const update = vi
      .spyOn(endpoints.admin, 'updateCustomer')
      .mockResolvedValue({ id: 1, status: 'ACTIVE' });
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Activate customer' }));

    await waitFor(() => expect(update).toHaveBeenCalledWith(1, 'ACTIVE'));
    expect(await screen.findByText('Customer activated')).toBeInTheDocument();
  });

  it('shows an error toast when a status change fails', async () => {
    vi.spyOn(endpoints.admin, 'customerDetail').mockResolvedValue(customer);
    vi.spyOn(endpoints.admin, 'updateCustomer').mockRejectedValue(new Error('Service unavailable'));
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Deactivate customer' }));

    expect(await screen.findByText('Customer update failed')).toBeInTheDocument();
    expect(screen.getByText('Service unavailable')).toBeInTheDocument();
  });
});
