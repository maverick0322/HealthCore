import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useOnboardingStatus } from './useOnboardingStatus';
import * as clinicalServiceModule from '@/features/clinical/services/clinicalService';

vi.mock('@/features/clinical/services/clinicalService');
vi.mock('@/features/auth/store/useAuthStore', () => {
  const mockUser = {
    email: 'patient@example.com',
    role: 'PATIENT',
    provider: 'LOCAL',
    emailVerified: true,
    enabled: true,
  };
  
  const mockStore = vi.fn((selector) => selector({ user: mockUser }));
  (mockStore as any).getState = vi.fn(() => ({ user: mockUser }));
  
  return { useAuthStore: mockStore };
});

describe('useOnboardingStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return "loading" on initial mount', () => {
    vi.mocked(clinicalServiceModule.clinicalApi.getMyGoals).mockImplementation(
      () => new Promise(() => {}) 
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
    const error404 = new Error('Not Found') as any;
    error404.response = { status: 404 };
    vi.mocked(clinicalServiceModule.clinicalApi.getMyGoals).mockRejectedValue(error404);

    const { result } = renderHook(() => useOnboardingStatus());

    await waitFor(() => {
      expect(result.current).toBe('pending');
    });
  });

  it('should return "completed" when getMyGoals throws any unknown error', async () => {
    const networkError = new Error('Network Error');
    vi.mocked(clinicalServiceModule.clinicalApi.getMyGoals).mockRejectedValue(networkError);

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

    rerender();

    expect(clinicalServiceModule.clinicalApi.getMyGoals).toHaveBeenCalledTimes(1);
  });
});
