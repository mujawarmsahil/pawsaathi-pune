import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { endpoints } from '../../api/endpoints';
import { AdminReviewsPage } from '../../components/admin/AdminPages';
import type { Review } from '../../types/api';

const reviews: Review[] = [
  {
    id: 1,
    rating: 5,
    comment: 'Excellent care!',
    bookingId: 10,
    caretakerId: 2,
    petId: 7,
    petName: 'Bruno',
    author: 'Riya Deshmukh',
    caretaker: 'Asha Rao',
    createdAt: '2026-10-30T09:15:00Z',
  },
  {
    id: 2,
    rating: 3,
    comment: 'Average experience.',
    bookingId: 11,
    caretakerId: 3,
    petId: 8,
    petName: 'Milo',
    author: 'Dev Shah',
    caretaker: 'Neha Rao',
    createdAt: '2026-10-29T09:15:00Z',
  },
  {
    id: 3,
    rating: 1,
    comment: null,
    bookingId: 12,
    caretakerId: 4,
    petId: 9,
    petName: 'Coco',
    author: 'Kabir Menon',
    caretaker: 'Meera Iyer',
    createdAt: '2026-10-28T09:15:00Z',
  },
];

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/admin/reviews']}>
        <Routes>
          <Route path="/admin/reviews" element={<AdminReviewsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function reviewCards() {
  return screen.getAllByRole('article');
}

describe('admin reviews', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('shows a loading skeleton while reviews are fetched', async () => {
    let resolveReviews: (value: Review[]) => void = () => undefined;
    vi.spyOn(endpoints.admin, 'reviews').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveReviews = resolve;
        }),
    );
    renderPage();

    expect(screen.getByRole('status', { name: 'Loading reviews' })).toBeInTheDocument();

    await act(async () => resolveReviews([]));

    expect(await screen.findByText('No 5-star reviews')).toBeInTheDocument();
  });

  it('shows five rating tabs with counts and defaults to five stars', async () => {
    vi.spyOn(endpoints.admin, 'reviews').mockResolvedValue(reviews);
    renderPage();

    expect(await screen.findByText('Excellent care!')).toBeInTheDocument();
    expect(screen.queryByText('Average experience.')).not.toBeInTheDocument();
    expect(screen.queryByText('No comment provided.')).not.toBeInTheDocument();
    expect(
      within(reviewCards()[0]).getByRole('link', { name: 'Owner Riya Deshmukh on booking 10' }),
    ).toHaveAttribute('href', '/admin/bookings/10#customer');
    expect(
      within(reviewCards()[0]).getByRole('link', { name: 'Caretaker Asha Rao' }),
    ).toHaveAttribute('href', '/admin/caretakers/2');
    expect(
      within(reviewCards()[0]).getByRole('link', { name: 'Pet Bruno on booking 10' }),
    ).toHaveAttribute('href', '/admin/bookings/10#pet');
    expect(within(reviewCards()[0]).getByText('5/5')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Booking #10' })).toHaveAttribute(
      'href',
      '/admin/bookings/10',
    );
    expect(screen.getByRole('tab', { name: /5 star/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /5 star/i })).toHaveTextContent('5 star1');
    expect(screen.getByRole('tab', { name: /4 star/i })).toHaveTextContent('4 star0');
    expect(screen.getByRole('tab', { name: /3 star/i })).toHaveTextContent('3 star1');
    expect(screen.getByRole('tab', { name: /2 star/i })).toHaveTextContent('2 star0');
    expect(screen.getByRole('tab', { name: /1 star/i })).toHaveTextContent('1 star1');
    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reject/i })).not.toBeInTheDocument();
  });

  it('shows only reviews matching the selected rating tab', async () => {
    const user = userEvent.setup();
    vi.spyOn(endpoints.admin, 'reviews').mockResolvedValue(reviews);
    renderPage();

    await screen.findByText('Excellent care!');
    await user.click(screen.getByRole('tab', { name: /3 star/i }));

    expect(screen.getByText('Average experience.')).toBeInTheDocument();
    expect(screen.queryByText('Excellent care!')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /1 star/i }));

    expect(screen.getByText('No comment provided.')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Owner Kabir Menon on booking 12' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Average experience.')).not.toBeInTheDocument();
  });

  it('filters reviews by owner name within the selected rating', async () => {
    const user = userEvent.setup();
    vi.spyOn(endpoints.admin, 'reviews').mockResolvedValue(reviews);
    renderPage();

    await screen.findByText('Excellent care!');
    await user.type(screen.getByLabelText('Owner name'), 'riya');

    expect(screen.getByText('Excellent care!')).toBeInTheDocument();
    expect(screen.queryByText('Average experience.')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /5 star/i })).toHaveTextContent('5 star1');
    expect(screen.getByRole('tab', { name: /3 star/i })).toHaveTextContent('3 star0');
  });

  it('filters reviews by caretaker name and rating tab', async () => {
    const user = userEvent.setup();
    vi.spyOn(endpoints.admin, 'reviews').mockResolvedValue(reviews);
    renderPage();

    await screen.findByText('Excellent care!');
    await user.type(screen.getByLabelText('Caretaker name'), 'neha');

    expect(screen.getByText('No matching 5-star reviews')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /3 star/i }));

    expect(screen.getByText('Average experience.')).toBeInTheDocument();
    expect(screen.queryByText('Excellent care!')).not.toBeInTheDocument();
    expect(screen.queryByText('No comment provided.')).not.toBeInTheDocument();
  });

  it('shows an empty state when filters match no reviews', async () => {
    const user = userEvent.setup();
    vi.spyOn(endpoints.admin, 'reviews').mockResolvedValue(reviews);
    renderPage();

    await screen.findByText('Excellent care!');
    await user.type(screen.getByLabelText('Owner name'), 'Riya');
    await user.type(screen.getByLabelText('Caretaker name'), 'Neha');

    expect(screen.getByText('No matching 5-star reviews')).toBeInTheDocument();
    expect(
      screen.getByText('Try a different rating, owner, or caretaker name.'),
    ).toBeInTheDocument();
  });

  it('shows an error state when reviews cannot be loaded', async () => {
    vi.spyOn(endpoints.admin, 'reviews').mockRejectedValue(new Error('Reviews unavailable'));
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Reviews unavailable');
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});
