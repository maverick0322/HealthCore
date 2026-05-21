import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clinicalApi } from '@/features/clinical/services/clinicalService';

import { useRegisterWeight } from './useRegisterWeight';

vi.mock('@/features/clinical/services/clinicalService', () => ({
  clinicalApi: {
    updateWeight: vi.fn(),
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

describe('useRegisterWeight', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends the mutation payload and invalidates weight history queries', async () => {
    vi.mocked(clinicalApi.updateWeight).mockResolvedValue({
      targetCalories: 2000,
      targetProtein: 120,
      targetCarbs: 200,
      targetFat: 60,
      targetWaterGlasses: 10,
    });

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const refetchSpy = vi.spyOn(queryClient, 'refetchQueries');
    const { result } = renderHook(() => useRegisterWeight(), { wrapper });

    result.current.mutate({ weightKg: 78.4, date: '2026-05-20' });

    await waitFor(() => {
      expect(clinicalApi.updateWeight).toHaveBeenCalledWith(78.4, '2026-05-20');
    });
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(refetchSpy).toHaveBeenCalled();
    });
  });
});
