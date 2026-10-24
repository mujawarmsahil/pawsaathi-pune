import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { endpoints } from '../../api/endpoints';
import { NotificationsPage } from '../../components/customer/CustomerPages';

describe('customer notifications', () => {
  it('marks an unread notification as read and refreshes the list', async () => {
    const notification = {
      id: 17,
      title: 'Booking confirmed',
      body: 'Your booking has been confirmed.',
      type: 'BOOKING',
      readAt: null,
      createdAt: '2025-02-14T10:00:00Z',
    };
    const list = vi
      .spyOn(endpoints.notifications, 'list')
      .mockResolvedValueOnce([notification])
      .mockResolvedValueOnce([{ ...notification, readAt: '2025-02-14T11:00:00Z' }]);
    const markRead = vi.spyOn(endpoints.notifications, 'markRead').mockResolvedValue();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={client}>
        <NotificationsPage />
      </QueryClientProvider>,
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Mark as read' }));
    await waitFor(() => expect(markRead.mock.calls[0]?.[0]).toBe(17));
    expect(await screen.findByText('Read')).toBeInTheDocument();
    expect(list).toHaveBeenCalledTimes(2);
  });
});
