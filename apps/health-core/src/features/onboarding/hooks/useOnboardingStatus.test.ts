import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useOnboardingStatus } from './useOnboardingStatus';
import * as clinicalServiceModule from '@/features/clinical/services/clinicalService';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

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
    const mockUser = {
      email: 'patient@example.com',
      role: 'PATIENT' as const,
      provider: 'LOCAL' as const,
      emailVerified: true,
      enabled: true,
    };

    vi.mocked(useAuthStore).mockImplementation((selector) => selector({ user: mockUser } as never));
    (useAuthStore.getState as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ user: mockUser });
  });

  it('should return "loading" on initial mount', () => {
    vi.mocked(clinicalServiceModule.clinicalApi.getMyProfile).mockImplementation(
      () => new Promise(() => {}) 
    );

    const { result } = renderHook(() => useOnboardingStatus());

    expect(result.current).toBe('loading');
  });

  it('should return "completed" when the patient profile is complete', async () => {
    const mockProfile = {
      userId: 'patient@example.com',
      firstName: 'Carlos',
      paternalLastName: 'Gomez',
      maternalLastName: '',
      fullName: 'Carlos Gomez',
      weightKg: 75.5,
      heightCm: 180,
      birthDate: '1995-01-01',
      gender: 'MALE' as const,
      activityLevel: 'MODERATELY_ACTIVE' as const,
      goal: 'weight-loss' as const,
      dietType: 'omnivore' as const,
      allergies: [],
      excludedFoods: [],
      nutritionistId: null,
      profileCompleted: true,
    };

    vi.mocked(clinicalServiceModule.clinicalApi.getMyProfile).mockResolvedValue(mockProfile);

    const { result } = renderHook(() => useOnboardingStatus());

    await waitFor(() => {
      expect(result.current).toBe('completed');
    });
  });

  it('should return "pending" when the profile request throws 404', async () => {
    const error404 = new Error('Not Found') as any;
    error404.response = { status: 404 };
    vi.mocked(clinicalServiceModule.clinicalApi.getMyProfile).mockRejectedValue(error404);

    const { result } = renderHook(() => useOnboardingStatus());

    await waitFor(() => {
      expect(result.current).toBe('pending');
    });
  });

  it('should return "unavailable" when the profile request throws an unknown error', async () => {
    const networkError = new Error('Network Error');
    vi.mocked(clinicalServiceModule.clinicalApi.getMyProfile).mockRejectedValue(networkError);

    const { result } = renderHook(() => useOnboardingStatus());

    await waitFor(() => {
      expect(result.current).toBe('unavailable');
    });
  });

  it('should only check status once on mount', async () => {
    vi.mocked(clinicalServiceModule.clinicalApi.getMyProfile).mockResolvedValue({
      userId: 'patient@example.com',
      firstName: 'Carlos',
      paternalLastName: 'Gomez',
      maternalLastName: '',
      fullName: 'Carlos Gomez',
      weightKg: 75.5,
      heightCm: 180,
      birthDate: '1995-01-01',
      gender: 'MALE' as const,
      activityLevel: 'MODERATELY_ACTIVE' as const,
      goal: 'weight-loss' as const,
      dietType: 'omnivore' as const,
      allergies: [],
      excludedFoods: [],
      nutritionistId: null,
      profileCompleted: true,
    });

    const { rerender } = renderHook(() => useOnboardingStatus());

    await waitFor(() => {
      expect(clinicalServiceModule.clinicalApi.getMyProfile).toHaveBeenCalledTimes(1);
    });

    rerender();

    expect(clinicalServiceModule.clinicalApi.getMyProfile).toHaveBeenCalledTimes(1);
  });

  it('should resolve nutritionist status with the nutritionist profile endpoint', async () => {
    const nutritionistUser = {
      email: 'nutritionist@example.com',
      role: 'NUTRITIONIST' as const,
      provider: 'LOCAL' as const,
      emailVerified: true,
      enabled: true,
    };
    vi.mocked(useAuthStore).mockImplementation((selector) =>
      selector({ user: nutritionistUser } as never)
    );
    (useAuthStore.getState as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: nutritionistUser,
    });

    vi.mocked(clinicalServiceModule.clinicalApi.getMyNutritionistProfile).mockResolvedValue({
      userId: 'nutritionist@example.com',
      firstName: 'Daniel',
      paternalLastName: 'Martinez',
      maternalLastName: '',
      fullName: 'Daniel Martinez',
      specializations: ['CLINICAL'],
      customSpecialization: '',
      professionalLicense: '12345678',
      consultationTypes: ['PRESENTIAL'],
      phone: '',
      clinicAddress: null,
      bio: 'Bio',
      profileCompleted: true,
    });

    const { result } = renderHook(() => useOnboardingStatus());

    await waitFor(() => {
      expect(result.current).toBe('completed');
    });
    expect(clinicalServiceModule.clinicalApi.getMyNutritionistProfile).toHaveBeenCalledTimes(1);
  });
});
