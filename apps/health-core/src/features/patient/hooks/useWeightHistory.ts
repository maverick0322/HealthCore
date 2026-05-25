import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { clinicalApi } from '@/features/clinical/services/clinicalService';
import type { WeightRecord } from '@/features/clinical/types/clinical.types';
import { AxiosError } from 'axios';

export const WEIGHT_HISTORY_QUERY_KEY = ['clinical', 'weight-history'] as const;

interface UseWeightHistoryReturn {
  data: WeightRecord[];
  isLoading: boolean;
  isError: boolean;
  error: AxiosError<unknown> | null;
  refetch: UseQueryResult<WeightRecord[], Error>['refetch'];
}

interface UseWeightHistoryOptions {
  enabled?: boolean;
}

export const useWeightHistory = ({ enabled = true }: UseWeightHistoryOptions = {}): UseWeightHistoryReturn => {
  const user = useAuthStore((state) => state.user);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [...WEIGHT_HISTORY_QUERY_KEY, user?.email ?? null],
    queryFn: async () => {
      if (!user?.email) {
        return [];
      }

      try {
        return await clinicalApi.getWeightHistory();
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
    enabled: enabled && !!user?.email,
  });

  return {
    data: data || [],
    isLoading,
    isError,
    error: error as AxiosError<unknown> | null,
    refetch,
  };
};
