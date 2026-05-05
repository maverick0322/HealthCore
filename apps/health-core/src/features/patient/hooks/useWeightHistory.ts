import { useQuery } from '@tanstack/react-query';
import { clinicalApi } from '@/features/clinical/services/clinicalService';
import type { WeightRecord } from '@/features/clinical/types/clinical.types';

const WEIGHT_HISTORY_QUERY_KEY = ['clinical', 'weight-history'];
const WEIGHT_HISTORY_CACHE_TIME = 5 * 60 * 1000; // 5 minutes

/**
 * Hook that fetches the user's weight history using TanStack Query.
 *
 * Provides automatic caching, retry logic, and loading/error states.
 *
 * @returns {Object} Query state with:
 *   - isLoading: boolean indicating if data is being fetched
 *   - isError: boolean indicating if fetch failed
 *   - data: array of WeightRecord objects
 *   - error: Error object if fetch failed
 */
export const useWeightHistory = () => {
  return useQuery({
    queryKey: WEIGHT_HISTORY_QUERY_KEY,
    queryFn: () => clinicalApi.getWeightHistory(),
    staleTime: WEIGHT_HISTORY_CACHE_TIME,
    retry: 2,
    enabled: true,
  });
};

/**
 * Transforms weight history data for chart rendering.
 * Handles edge cases like empty data.
 *
 * @param data - Array of WeightRecord objects
 * @returns Transformed data suitable for Recharts
 */
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
    fullDate: record.date, // Keep full date for reference
  }));
};
