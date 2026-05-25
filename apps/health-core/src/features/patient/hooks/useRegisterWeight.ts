import { useMutation, useQueryClient } from '@tanstack/react-query';

import { clinicalApi } from '@/features/clinical/services/clinicalService';
import { refreshWeightQueries } from './weightMutationUtils';

interface RegisterWeightPayload {
  weightKg: number;
  date: string;
}

export const useRegisterWeight = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ weightKg, date }: RegisterWeightPayload) => clinicalApi.updateWeight(weightKg, date),
    onSuccess: async () => {
      await refreshWeightQueries(queryClient);
    },
  });
};
