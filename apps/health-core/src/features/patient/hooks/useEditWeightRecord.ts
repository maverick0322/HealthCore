import { useMutation, useQueryClient } from '@tanstack/react-query';

import { clinicalApi } from '@/features/clinical/services/clinicalService';

import { refreshWeightQueries } from './weightMutationUtils';

interface EditWeightRecordPayload {
  originalDate: string;
  weightKg: number;
  date: string;
}

export const useEditWeightRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ originalDate, weightKg, date }: EditWeightRecordPayload) =>
      clinicalApi.editWeight(originalDate, weightKg, date),
    onSuccess: async () => {
      await refreshWeightQueries(queryClient);
    },
  });
};
