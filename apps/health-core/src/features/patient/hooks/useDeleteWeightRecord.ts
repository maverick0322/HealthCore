import { useMutation, useQueryClient } from '@tanstack/react-query';

import { clinicalApi } from '@/features/clinical/services/clinicalService';

import { refreshWeightQueries } from './weightMutationUtils';

export const useDeleteWeightRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (date: string) => clinicalApi.deleteWeight(date),
    onSuccess: async () => {
      await refreshWeightQueries(queryClient);
    },
  });
};
