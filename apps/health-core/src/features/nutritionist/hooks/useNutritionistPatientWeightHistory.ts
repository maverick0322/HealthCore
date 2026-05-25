import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { clinicalApi } from '@/features/clinical/services/clinicalService';
import type { WeightRecord } from '@/features/clinical/types/clinical.types';

export const NUTRITIONIST_PATIENT_WEIGHT_HISTORY_QUERY_KEY = [
  'clinical',
  'nutritionist-patient-weight-history',
] as const;

interface UseNutritionistPatientWeightHistoryOptions {
  enabled?: boolean;
}

interface UseNutritionistPatientWeightHistoryReturn {
  data: WeightRecord[];
  isLoading: boolean;
  isError: boolean;
  error: AxiosError<unknown> | null;
  refetch: UseQueryResult<WeightRecord[], Error>['refetch'];
}

export const useNutritionistPatientWeightHistory = (
  patientId: string,
  { enabled = true }: UseNutritionistPatientWeightHistoryOptions = {}
): UseNutritionistPatientWeightHistoryReturn => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [...NUTRITIONIST_PATIENT_WEIGHT_HISTORY_QUERY_KEY, patientId || null],
    queryFn: async () => {
      if (!patientId) {
        return [];
      }

      try {
        return await clinicalApi.getNutritionistPatientWeightHistory(patientId);
      } catch (err: any) {
        if (err.response?.status === 404) {
          return [];
        }
        throw err;
      }
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: (count, err: any) => {
      if (err?.response?.status === 404) {
        return false;
      }
      return count < 2;
    },
    enabled: enabled && Boolean(patientId),
  });

  return {
    data: data || [],
    isLoading,
    isError,
    error: error as AxiosError<unknown> | null,
    refetch,
  };
};
