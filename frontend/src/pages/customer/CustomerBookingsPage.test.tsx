import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { endpoints } from '../../api/endpoints';
import { CustomerBookingsPage } from '../../components/customer/CustomerPages';

const booking = {
  id: 31,
  customerId: 4,
  caretakerId: 9,
  petId: 12,
  serviceId: 3,
  status: 'REQUESTED',
  startsAt: '2030-02-14T10:00:00Z',
  endsAt: '2030-02-14T11:30:00Z',
  hourlyRate: 500,
};

function renderBookings() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CustomerBookingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('customer booking actions', () => {
  it('cancels a booking only after confirmation', async () => {
    const updateStatus = vi
      .spyOn(endpoints.bookings, 'updateStatus')
      .mockResolvedValue({ ...booking, status: 'CANCELLED' });
    vi.spyOn(endpoints.bookings, 'list').mockResolvedValue([booking]);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderBookings();
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(updateStatus.mock.calls[0]?.[0]).toBe(31));
    expect(updateStatus.mock.calls[0]?.[1]).toBe('CANCELLED');
  });

  it('clearly marks rescheduling unavailable instead of sending a dead API request', async () => {
    vi.spyOn(endpoints.bookings, 'list').mockResolvedValue([booking]);

    renderBookings();
    expect(await screen.findByText('Rescheduling is coming soon.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reschedule' })).not.toBeInTheDocument();
  });
});
