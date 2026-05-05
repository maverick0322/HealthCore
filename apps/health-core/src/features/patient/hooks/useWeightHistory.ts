import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { extractUserIdFromToken } from '@/core/utils/jwt';
import { clinicalApi } from '@/features/clinical/services/clinicalService';
import type { WeightRecord } from '@/features/clinical/types/clinical.types';
import { AxiosError } from 'axios';

const WEIGHT_HISTORY_QUERY_KEY = ['clinical', 'weight-history'];
const WEIGHT_HISTORY_CACHE_TIME = 5 * 60 * 1000;

interface UseWeightHistoryReturn {
  data: WeightRecord[];
  isLoading: boolean;
  isError: boolean;
  error: AxiosError<unknown> | null;
}

export const useWeightHistory = (): UseWeightHistoryReturn => {
  const { accessToken } = useAuthStore();

  const isAuthenticated = !!accessToken;
  let userId: string | null = null;

  if (isAuthenticated) {
    try {
      userId = extractUserIdFromToken(accessToken);
    } catch {
      // Token is invalid, disable the query
    }
  }

  const { data, isLoading, isError, error } = useQuery({
    queryKey: WEIGHT_HISTORY_QUERY_KEY,
    queryFn: async () => {
      try {
        return await clinicalApi.getWeightHistory();
      } catch (err: any) {
        if (err.response?.status === 404) {
          return [];
        }
        throw err;
      }
    },
    staleTime: WEIGHT_HISTORY_CACHE_TIME,
    retry: (count, err: any) => {
      if (err?.response?.status === 404) {
        return false;
      }
      return count < 2;
    },
    enabled: isAuthenticated && !!userId,
  });

  return {
    data: data || [],
    isLoading,
    isError,
    error: error as AxiosError<unknown> | null,
  };
};

export const transformWeightDataForChart = (data: WeightRecord[] | undefined) => {
  if (!data || data.length === 0) {
    return [];
  }

  return data.map((record) => ({
    date: new Date(record.date).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
    }),
    weight: record.weightKg,
    fullDate: record.date,
  }));
};
