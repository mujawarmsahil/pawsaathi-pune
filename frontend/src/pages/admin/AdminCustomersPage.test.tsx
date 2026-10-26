import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { endpoints } from '../../api/endpoints';
import { AdminCustomersPage } from '../../components/admin/AdminPages';
import { ToastProvider } from '../../context/ToastProvider';
import type { AdminCustomer } from '../../types/api';

const customers: AdminCustomer[] = [
  {
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
    ],
  },
  {
    id: 2,
    name: 'Dev Shah',
    email: 'dev@example.test',
    phone: null,
    photoUrl: null,
    status: 'DEACTIVATED',
    area: null,
    registeredAt: '2026-08-12T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
    pets: [],
  },
  {
    id: 3,
    name: 'Asha Rao',
    email: 'asha@example.test',
    phone: '9988776655',
    photoUrl: 'https://example.test/asha.jpg',
    status: 'ACTIVE',
    area: 'Aundh, Pune',
    registeredAt: '2026-08-10T10:00:00Z',
    updatedAt: '2026-09-03T10:00:00Z',
    pets: [
      {
        id: 11,
        name: 'Coco',
        species: 'Cat',
        breed: null,
        ageYears: 1,
        notes: null,
        foodNotes: 'Wet food only.',
        photoUrl: null,
      },
    ],
  },
];

function renderPage(
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  }),
) {
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={['/admin/customers']}>
          <AdminCustomersPage />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

function renderedCustomerNames() {
  return screen
    .getAllByRole('link', { name: /^(Riya Deshmukh|Dev Shah|Asha Rao)$/ })
    .map((link) => link.textContent);
}

describe('admin customers', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('lists customers with areas, pet links, and an unset-area fallback', async () => {
    vi.spyOn(endpoints.admin, 'customers').mockResolvedValue(customers);
    renderPage();

    expect(await screen.findByText('Riya Deshmukh')).toBeInTheDocument();
    expect(screen.getAllByText('Not set').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'View Bruno for Riya Deshmukh' })).toHaveAttribute(
      'href',
      '/admin/customers/1#pet-10',
    );
    expect(screen.getByText('No pets added')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /all/i })).toHaveAttribute('aria-selected', 'true');

    expect(renderedCustomerNames()).toEqual(['Asha Rao', 'Dev Shah', 'Riya Deshmukh']);
    fireEvent.change(screen.getByLabelText('Sort customers'), {
      target: { value: 'area' },
    });
    expect(renderedCustomerNames()).toEqual(['Asha Rao', 'Riya Deshmukh', 'Dev Shah']);
    fireEvent.change(screen.getByLabelText('Sort customers'), {
      target: { value: 'pet-name' },
    });
    expect(renderedCustomerNames()).toEqual(['Riya Deshmukh', 'Asha Rao', 'Dev Shah']);
  });

  it('searches across customer and pet details and filters by status', async () => {
    vi.spyOn(endpoints.admin, 'customers').mockResolvedValue(customers);
    renderPage();

    await screen.findByText('Riya Deshmukh');
    fireEvent.change(screen.getByLabelText('Search customers'), {
      target: { value: 'bruno' },
    });
    expect(screen.getByText('Riya Deshmukh')).toBeInTheDocument();
    expect(screen.queryByText('Dev Shah')).not.toBeInTheDocument();
    expect(screen.queryByText('Asha Rao')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Search customers'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('tab', { name: /deactivated/i }));
    expect(screen.getByText('Dev Shah')).toBeInTheDocument();
    expect(screen.queryByText('Riya Deshmukh')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /deactivated/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('deactivates and reactivates customers with a success toast', async () => {
    vi.spyOn(endpoints.admin, 'customers').mockResolvedValue(customers);
    const update = vi
      .spyOn(endpoints.admin, 'updateCustomer')
      .mockResolvedValue({ id: 1, status: 'DEACTIVATED' });
    renderPage();

    const activeCustomerCard = (await screen.findByText('Riya Deshmukh')).closest('article');
    expect(activeCustomerCard).not.toBeNull();
    fireEvent.click(
      within(activeCustomerCard as HTMLElement).getByRole('button', { name: 'Deactivate' }),
    );

    await waitFor(() => expect(update).toHaveBeenCalledWith(1, 'DEACTIVATED'));
    expect(await screen.findByText('Customer deactivated')).toBeInTheDocument();
    expect(
      screen.getByText('Riya Deshmukh can no longer sign in or book services.'),
    ).toBeInTheDocument();

    const deactivatedCustomerCard = screen.getByText('Dev Shah').closest('article');
    expect(deactivatedCustomerCard).not.toBeNull();
    fireEvent.click(
      within(deactivatedCustomerCard as HTMLElement).getByRole('button', { name: 'Activate' }),
    );

    await waitFor(() => expect(update).toHaveBeenCalledWith(2, 'ACTIVE'));
    expect(await screen.findByText('Customer activated')).toBeInTheDocument();
  });

  it('invalidates the cached customer detail after a list status change', async () => {
    vi.spyOn(endpoints.admin, 'customers').mockResolvedValue(customers);
    vi.spyOn(endpoints.admin, 'updateCustomer').mockResolvedValue({
      id: 1,
      status: 'DEACTIVATED',
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(['admin', 'customer', 1], customers[0]);
    renderPage(queryClient);

    const customerCard = (await screen.findByText('Riya Deshmukh')).closest('article');
    expect(customerCard).not.toBeNull();
    fireEvent.click(
      within(customerCard as HTMLElement).getByRole('button', { name: 'Deactivate' }),
    );

    await waitFor(() =>
      expect(queryClient.getQueryState(['admin', 'customer', 1])?.isInvalidated).toBe(true),
    );
  });

  it('shows an error toast when a status change fails', async () => {
    vi.spyOn(endpoints.admin, 'customers').mockResolvedValue(customers);
    vi.spyOn(endpoints.admin, 'updateCustomer').mockRejectedValue(new Error('Service unavailable'));
    renderPage();

    const customerCard = (await screen.findByText('Riya Deshmukh')).closest('article');
    expect(customerCard).not.toBeNull();
    fireEvent.click(
      within(customerCard as HTMLElement).getByRole('button', { name: 'Deactivate' }),
    );

    expect(await screen.findByText('Customer update failed')).toBeInTheDocument();
    expect(screen.getByText('Service unavailable')).toBeInTheDocument();
  });
});
