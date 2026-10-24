import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { endpoints } from '../api/endpoints';
import type { ApiRecord } from '../types/api';

export function usePets(enabled = true) {
  return useQuery({ queryKey: ['pets'], queryFn: endpoints.pets.list, enabled });
}

export function usePetMutations() {
  const queryClient = useQueryClient();
  const refreshPetQueries = () => queryClient.invalidateQueries({ queryKey: ['pets'] });
  return {
    create: useMutation({
      mutationFn: (body: ApiRecord) => endpoints.pets.create(body),
      onSuccess: refreshPetQueries,
    }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: number; body: ApiRecord }) =>
        endpoints.pets.update(id, body),
      onSuccess: refreshPetQueries,
    }),
    archive: useMutation({ mutationFn: endpoints.pets.archive, onSuccess: refreshPetQueries }),
  };
}
