import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clinicalApi } from '@/features/clinical/services/clinicalService';

import { useDeleteWeightRecord } from './useDeleteWeightRecord';

vi.mock('@/features/clinical/services/clinicalService', () => ({
  clinicalApi: {
    deleteWeight: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
};

describe('useDeleteWeightRecord', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes a record and refreshes weight queries', async () => {
    vi.mocked(clinicalApi.deleteWeight).mockResolvedValue({
      targetCalories: 2000,
      targetProtein: 120,
      targetCarbs: 200,
      targetFat: 60,
      targetWaterGlasses: 10,
    });

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const refetchSpy = vi.spyOn(queryClient, 'refetchQueries');
    const { result } = renderHook(() => useDeleteWeightRecord(), { wrapper });

    result.current.mutate('2026-05-18');

    await waitFor(() => {
      expect(clinicalApi.deleteWeight).toHaveBeenCalledWith('2026-05-18');
    });
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledTimes(2);
      expect(refetchSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });
});
