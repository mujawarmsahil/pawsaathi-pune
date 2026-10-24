import { useQuery } from '@tanstack/react-query';

import { endpoints } from '../api/endpoints';

export function useServices() {
  return useQuery({ queryKey: ['services'], queryFn: endpoints.services });
}

export function useAreas() {
  return useQuery({ queryKey: ['areas'], queryFn: endpoints.areas });
}

export function useCaretakers(params: URLSearchParams) {
  return useQuery({
    queryKey: ['caretakers', params.toString()],
    queryFn: () => endpoints.caretakers(params),
  });
}

export function useCaretaker(id: number) {
  return useQuery({
    queryKey: ['caretakers', id],
    queryFn: () => endpoints.caretaker(id),
    enabled: id > 0,
  });
}
