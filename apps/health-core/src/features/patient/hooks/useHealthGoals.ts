import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { clinicalApi } from '@/features/clinical/services/clinicalService';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import type { HealthGoalResponse } from '@/features/clinical/types/clinical.types';

export const HEALTH_GOALS_QUERY_KEY = ['clinical', 'health-goals'] as const;

interface UseHealthGoalsReturn {
  data: HealthGoalResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  error: AxiosError<unknown> | null;
}

export const useHealthGoals = (): UseHealthGoalsReturn => {
  const user = useAuthStore((state) => state.user);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [...HEALTH_GOALS_QUERY_KEY, user?.email ?? null],
    queryFn: async () => {
      if (!user?.email) {
        return undefined;
      }

      return clinicalApi.getMyGoals();
    },
    enabled: !!user?.email,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: 1,
  });

  return {
    data,
    isLoading,
    isError,
    error: error as AxiosError<unknown> | null,
  };
};
