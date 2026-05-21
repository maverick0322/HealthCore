import { useMutation, useQueryClient } from '@tanstack/react-query';

import { clinicalApi } from '@/features/clinical/services/clinicalService';

import { WEIGHT_HISTORY_QUERY_KEY } from './useWeightHistory';

interface RegisterWeightPayload {
  weightKg: number;
  date: string;
}

export const useRegisterWeight = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ weightKg, date }: RegisterWeightPayload) => clinicalApi.updateWeight(weightKg, date),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: WEIGHT_HISTORY_QUERY_KEY });
      await queryClient.refetchQueries({ queryKey: WEIGHT_HISTORY_QUERY_KEY });
    },
  });
};
