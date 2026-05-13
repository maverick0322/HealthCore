import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useOnboardingStatus } from './useOnboardingStatus';
import * as clinicalServiceModule from '@/features/clinical/services/clinicalService';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

vi.mock('@/features/clinical/services/clinicalService');

const mockUser = {
  email: 'patient@example.com',
  role: 'PATIENT' as const,
  provider: 'LOCAL' as const,
  emailVerified: true,
  enabled: true,
};

describe('useOnboardingStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: mockUser } as any);
  });

  afterEach(() => {
    useAuthStore.setState({ user: null } as any);
  });

  it('should return "loading" on initial mount', () => {
    vi.mocked(clinicalServiceModule.clinicalApi.getMyGoals).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => useOnboardingStatus());

    expect(result.current).toBe('loading');
  });

  it('should return "completed" when getMyGoals succeeds', async () => {
    const mockGoals = {
      targetCalories: 2500,
      targetProtein: 150,
      targetCarbs: 250,
      targetFat: 70,
    };

    vi.mocked(clinicalServiceModule.clinicalApi.getMyGoals).mockResolvedValue(mockGoals);

    const { result } = renderHook(() => useOnboardingStatus());

    await waitFor(() => {
      expect(result.current).toBe('completed');
    });
  });

  it('should return "pending" when getMyGoals throws 404 error', async () => {
    vi.mocked(clinicalServiceModule.clinicalApi.getMyGoals).mockRejectedValue({
      message: 'Not Found',
      response: { status: 404 },
    } as any);

    const { result } = renderHook(() => useOnboardingStatus());

    await waitFor(() => {
      expect(result.current).toBe('pending');
    });
  });

  it('should return "pending" when getMyGoals throws any error', async () => {
    vi.mocked(clinicalServiceModule.clinicalApi.getMyGoals).mockRejectedValue({
      message: 'Network Error',
    } as any);

    const { result } = renderHook(() => useOnboardingStatus());

    await waitFor(() => {
      expect(result.current).toBe('completed');
    });
  });

  it('should only check status once on mount', async () => {
    vi.mocked(clinicalServiceModule.clinicalApi.getMyGoals).mockResolvedValue({
      targetCalories: 2500,
      targetProtein: 150,
      targetCarbs: 250,
      targetFat: 70,
    });

    const { rerender } = renderHook(() => useOnboardingStatus());

    await waitFor(() => {
      expect(clinicalServiceModule.clinicalApi.getMyGoals).toHaveBeenCalledTimes(1);
    });

    // Re-render the hook
    rerender();

    // Should still be called only once (no new call on re-render)
    expect(clinicalServiceModule.clinicalApi.getMyGoals).toHaveBeenCalledTimes(1);
  });
});
