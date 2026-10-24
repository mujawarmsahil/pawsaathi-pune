import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { endpoints } from '../api/endpoints';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: endpoints.notifications.list,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: endpoints.notifications.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
