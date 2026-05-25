import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWeightHistory } from './useWeightHistory';
import * as clinicalServiceModule from '@/features/clinical/services/clinicalService';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

vi.mock('@/features/clinical/services/clinicalService');
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(({ queryFn }) => {
    const result = queryFn();
    if (result instanceof Promise) {
      return {
        isLoading: false,
        isError: false,
        data: undefined,
      };
    }
    return {
      isLoading: false,
      isError: false,
      data: result,
    };
  }),
}));

vi.mock('@/features/auth/store/useAuthStore', () => ({
  useAuthStore: Object.assign(
    vi.fn((selector: (state: { user: { email: string } | null }) => unknown) =>
      selector({
        user: { email: 'patient@example.com' },
      })
    ),
    {
      getState: vi.fn(() => ({
        user: { email: 'patient@example.com' }
      })),
      setState: vi.fn(),
    }
  ),
}));

describe('useWeightHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        email: 'patient@example.com',
        role: 'PATIENT',
        provider: 'LOCAL',
        emailVerified: true,
        enabled: true,
      },
    } as any);
  });

  afterEach(() => {
    useAuthStore.setState({ user: null } as any);
  });

  it('should fetch weight history successfully', async () => {
    const mockData = [
      { weightKg: 80, date: '2024-01-01' },
      { weightKg: 79.5, date: '2024-01-08' },
      { weightKg: 79, date: '2024-01-15' },
    ];

    vi.mocked(clinicalServiceModule.clinicalApi.getWeightHistory).mockResolvedValue(mockData);

    renderHook(() => useWeightHistory());

    await waitFor(() => {
      expect(clinicalServiceModule.clinicalApi.getWeightHistory).toHaveBeenCalled();
    });
  });

  it('should handle empty weight history', async () => {
    vi.mocked(clinicalServiceModule.clinicalApi.getWeightHistory).mockResolvedValue([]);

    renderHook(() => useWeightHistory());

    await waitFor(() => {
      expect(clinicalServiceModule.clinicalApi.getWeightHistory).toHaveBeenCalled();
    });
  });
});
