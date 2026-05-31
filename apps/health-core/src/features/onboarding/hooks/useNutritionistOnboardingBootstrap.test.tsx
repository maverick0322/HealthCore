import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetMyNutritionistProfile } = vi.hoisted(() => ({
  mockGetMyNutritionistProfile: vi.fn(),
}));

vi.mock('@/features/clinical/services/clinicalService', () => ({
  clinicalApi: {
    getMyNutritionistProfile: mockGetMyNutritionistProfile,
  },
}));

import { useNutritionistOnboardingBootstrap } from './useNutritionistOnboardingBootstrap';

describe('useNutritionistOnboardingBootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hydrates the store when an existing profile is found', async () => {
    const hydrateFromProfile = vi.fn();
    const setHasExistingProfile = vi.fn();
    const reset = vi.fn();

    mockGetMyNutritionistProfile.mockResolvedValue({
      firstName: 'Laura',
      paternalLastName: 'Mendez',
      maternalLastName: '',
      specializations: ['CLINICAL'],
      customSpecialization: '',
      professionalLicense: '1234567',
      consultationTypes: ['ONLINE'],
      phone: '',
      clinicAddress: null,
      bio: 'Profile',
    });

    const { result } = renderHook(() =>
      useNutritionistOnboardingBootstrap({
        hydrateFromProfile,
        setHasExistingProfile,
        reset,
      }),
    );

    await waitFor(() => {
      expect(result.current.isLoadingProfile).toBe(false);
    });

    expect(hydrateFromProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Laura',
        professionalLicense: '1234567',
      }),
      true,
    );
    expect(setHasExistingProfile).not.toHaveBeenCalled();
    expect(reset).not.toHaveBeenCalled();
  });

  it('marks the profile as missing and resets the store when bootstrap fails', async () => {
    const hydrateFromProfile = vi.fn();
    const setHasExistingProfile = vi.fn();
    const reset = vi.fn();

    mockGetMyNutritionistProfile.mockRejectedValue(new Error('not found'));

    const { result } = renderHook(() =>
      useNutritionistOnboardingBootstrap({
        hydrateFromProfile,
        setHasExistingProfile,
        reset,
      }),
    );

    await waitFor(() => {
      expect(result.current.isLoadingProfile).toBe(false);
    });

    expect(hydrateFromProfile).not.toHaveBeenCalled();
    expect(setHasExistingProfile).toHaveBeenCalledWith(false);
    expect(reset).toHaveBeenCalled();
  });
});
