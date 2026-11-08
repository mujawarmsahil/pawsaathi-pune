import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { endpoints } from '../../api/endpoints';
import { CaretakerDirectoryPage } from '../../components/public/CaretakerDirectoryPage';
import type { Caretaker } from '../../types/api';

const caretakers: Caretaker[] = [
  {
    id: 1,
    name: 'Asha Pawar',
    bio: 'A caring dog walker.',
    experienceYears: 4,
    hourlyRate: 399,
    serviceAreas: 'Kothrud',
    photoUrl: null,
    rating: null,
    reviewCount: 0,
  },
  {
    id: 2,
    name: 'Mira Shah',
    bio: 'A caring local companion.',
    experienceYears: 2,
    hourlyRate: 350,
    serviceAreas: 'Baner',
    photoUrl: null,
    rating: null,
    reviewCount: 0,
  },
];

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/caretakers']}>
        <CaretakerDirectoryPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('caretaker directory search', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('sends name and area searches to the API and shows matching results', async () => {
    vi.spyOn(endpoints, 'services').mockResolvedValue([]);
    vi.spyOn(endpoints, 'areas').mockResolvedValue([]);
    const search = vi.spyOn(endpoints, 'caretakers').mockImplementation(async (filters) => {
      const searchTerm = filters?.get('q')?.trim().toLowerCase();
      return searchTerm
        ? caretakers.filter(
            (caretaker) =>
              caretaker.name.toLowerCase().includes(searchTerm) ||
              caretaker.serviceAreas.toLowerCase().includes(searchTerm),
          )
        : caretakers;
    });
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Asha Pawar' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Mira Shah' })).toBeInTheDocument();
    const searchInput = screen.getByLabelText('Search');

    fireEvent.change(searchInput, { target: { value: 'asha' } });
    await waitFor(() => {
      expect(search.mock.calls.at(-1)?.[0]?.get('q')).toBe('asha');
    });
    expect(await screen.findByRole('heading', { name: 'Asha Pawar' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Mira Shah' })).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'Baner' } });
    await waitFor(() => {
      expect(search.mock.calls.at(-1)?.[0]?.get('q')).toBe('Baner');
    });
    expect(await screen.findByRole('heading', { name: 'Mira Shah' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Asha Pawar' })).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'no match' } });
    expect(
      await screen.findByRole('heading', { name: 'No approved caretakers found' }),
    ).toBeInTheDocument();
  });
});
