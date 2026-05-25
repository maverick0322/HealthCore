import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clinicalApi } from '@/features/clinical/services/clinicalService';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { useHealthGoals } from './useHealthGoals';

vi.mock('@/features/clinical/services/clinicalService');
vi.mock('@/features/auth/store/useAuthStore', () => ({
  useAuthStore: vi.fn(),
}));

const mockedUseAuthStore = vi.mocked(useAuthStore);

const mockUser = {
  email: 'patient@example.com',
  role: 'PATIENT' as const,
  provider: 'LOCAL' as const,
  emailVerified: true,
  enabled: true,
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useHealthGoals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAuthStore.mockImplementation((selector) =>
      selector({ user: mockUser } as never)
    );
  });

  it('fetches health goals for the authenticated user', async () => {
    const mockGoals = {
      targetCalories: 2200,
      targetProtein: 140,
      targetCarbs: 210,
      targetFat: 60,
      targetWaterGlasses: 10,
    };

    vi.mocked(clinicalApi.getMyGoals).mockResolvedValue(mockGoals);

    const { result } = renderHook(() => useHealthGoals(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockGoals);
    });

    expect(clinicalApi.getMyGoals).toHaveBeenCalledTimes(1);
  });

  it('starts in loading state while the request is pending', () => {
    vi.mocked(clinicalApi.getMyGoals).mockImplementation(
      () => new Promise(() => {}) as Promise<any>,
    );

    const { result } = renderHook(() => useHealthGoals(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });
});
