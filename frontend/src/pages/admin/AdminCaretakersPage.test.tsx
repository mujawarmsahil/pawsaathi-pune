import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { endpoints } from '../../api/endpoints';
import { AdminCaretakersPage } from '../../components/admin/AdminPages';
import { ToastProvider } from '../../context/ToastProvider';
import type { CaretakerCandidate } from '../../types/api';

const candidates: CaretakerCandidate[] = [
  {
    id: 1,
    name: 'Aditi Kale',
    email: 'aditi@example.test',
    photoUrl: null,
    hourlyRate: 450,
    serviceAreas: 'Aundh',
    approvalStatus: 'PENDING',
    verified: false,
  },
  {
    id: 2,
    name: 'Asha Rao',
    email: 'asha@example.test',
    photoUrl: 'https://example.test/asha.jpg',
    hourlyRate: 500,
    serviceAreas: 'Baner',
    approvalStatus: 'APPROVED',
    verified: true,
  },
  {
    id: 3,
    name: 'Nisha Pawar',
    email: 'nisha@example.test',
    photoUrl: null,
    hourlyRate: 550,
    serviceAreas: 'Kothrud',
    approvalStatus: 'SUSPENDED',
    verified: true,
  },
];

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter>
          <AdminCaretakersPage />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('admin caretaker search', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('finds caretakers across pending, active, and suspended statuses', async () => {
    vi.spyOn(endpoints.admin, 'caretakers').mockResolvedValue(candidates);
    renderPage();

    expect(await screen.findByText('Aditi Kale')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Aditi Kale profile picture not uploaded' }),
    ).toHaveClass('profile-placeholder');
    const search = screen.getByLabelText('Search caretakers');

    fireEvent.change(search, { target: { value: 'nisha' } });
    expect(await screen.findByText('Nisha Pawar')).toBeInTheDocument();
    expect(screen.queryByText('Aditi Kale')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /suspended/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    fireEvent.change(search, { target: { value: 'baner' } });
    expect(await screen.findByText('Asha Rao')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Asha Rao profile picture' })).toHaveAttribute(
      'src',
      'https://example.test/asha.jpg',
    );
    expect(screen.getByRole('tab', { name: /caretakers/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    fireEvent.change(search, { target: { value: 'aditi' } });
    expect(await screen.findByText('Aditi Kale')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /pending/i })).toHaveAttribute('aria-selected', 'true');
  });
});
