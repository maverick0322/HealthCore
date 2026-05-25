import type { QueryClient } from '@tanstack/react-query';

import { HEALTH_GOALS_QUERY_KEY } from './useHealthGoals';
import { WEIGHT_HISTORY_QUERY_KEY } from './useWeightHistory';

export const refreshWeightQueries = async (queryClient: QueryClient) => {
  await queryClient.invalidateQueries({
    queryKey: WEIGHT_HISTORY_QUERY_KEY,
    refetchType: 'all',
  });
  await queryClient.invalidateQueries({
    queryKey: HEALTH_GOALS_QUERY_KEY,
    refetchType: 'all',
  });
};
