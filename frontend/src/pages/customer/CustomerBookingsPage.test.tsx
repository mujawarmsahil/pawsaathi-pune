import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { endpoints } from '../../api/endpoints';
import { CustomerBookingsPage } from '../../components/customer/CustomerPages';
import { AuthContext } from '../../context/AuthContext';

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
      <AuthContext.Provider
        value={{
          user: {
            id: 4,
            name: 'Riya Deshmukh',
            email: 'riya@example.test',
            role: 'CUSTOMER',
            mustChangePassword: false,
          },
          isLoading: false,
          error: null,
          reload: vi.fn().mockResolvedValue(null),
        }}
      >
        <MemoryRouter>
          <CustomerBookingsPage />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('customer booking actions', () => {
  it('cancels a booking only after confirmation with a reason', async () => {
    const updateStatus = vi
      .spyOn(endpoints.bookings, 'updateStatus')
      .mockResolvedValue({ ...booking, status: 'CANCELLED' });
    vi.spyOn(endpoints.bookings, 'list').mockResolvedValue([booking]);

    renderBookings();
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

    const dialog = screen.getByRole('dialog', { name: 'Cancel this booking?' });
    const confirmButton = within(dialog).getByRole('button', { name: 'Cancel booking' });
    expect(confirmButton).toBeDisabled();
    await userEvent.type(within(dialog).getByLabelText('Reason for cancellation'), 'Plans changed');
    await userEvent.click(confirmButton);

    await waitFor(() =>
      expect(updateStatus).toHaveBeenCalledWith(31, 'CANCELLED', 'Plans changed'),
    );
  });

  it('shows the cancellation reason on cancelled booking cards', async () => {
    vi.spyOn(endpoints.bookings, 'list').mockResolvedValue([
      { ...booking, status: 'CANCELLED', cancellationReason: 'Caretaker unavailable' },
    ]);

    renderBookings();

    expect(await screen.findByText('Cancellation reason')).toBeInTheDocument();
    expect(screen.getByText('Caretaker unavailable')).toBeInTheDocument();
  });

  it('waits for caretaker approval before offering payment', async () => {
    vi.spyOn(endpoints.bookings, 'list').mockResolvedValue([booking]);

    renderBookings();
    expect(await screen.findByText('Waiting for the caretaker to respond.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pay securely' })).not.toBeInTheDocument();
  });

  it('offers payment only after caretaker acceptance', async () => {
    vi.spyOn(endpoints.bookings, 'list').mockResolvedValue([
      { ...booking, status: 'PENDING_PAYMENT' },
    ]);

    renderBookings();
    expect(await screen.findByRole('button', { name: 'Pay securely' })).toBeInTheDocument();
  });
});
