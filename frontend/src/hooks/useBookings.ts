import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { endpoints } from '../api/endpoints';

export function useBookings(enabled = true) {
  return useQuery({ queryKey: ['bookings'], queryFn: endpoints.bookings.list, enabled });
}

export function useBookingMutations() {
  const queryClient = useQueryClient();
  const refreshBookingQueries = () => queryClient.invalidateQueries({ queryKey: ['bookings'] });
  return {
    create: useMutation({
      mutationFn: endpoints.bookings.create,
      onSuccess: refreshBookingQueries,
    }),
    updateStatus: useMutation({
      mutationFn: ({ id, status, reason }: { id: number; status: string; reason?: string }) =>
        endpoints.bookings.updateStatus(id, status, reason),
      onSuccess: refreshBookingQueries,
    }),
  };
}
