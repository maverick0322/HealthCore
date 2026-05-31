import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { NutritionistProfilePayload } from '@/features/clinical/types/clinical.types';

const {
  mockCreateNutritionistProfile,
  mockUpdateMyNutritionistProfile,
  mockNavigate,
  mockTranslate,
} = vi.hoisted(() => ({
  mockCreateNutritionistProfile: vi.fn(),
  mockUpdateMyNutritionistProfile: vi.fn(),
  mockNavigate: vi.fn(),
  mockTranslate: (key: string) => key,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockTranslate,
  }),
}));

vi.mock('@/features/clinical/services/clinicalService', () => ({
  clinicalApi: {
    createNutritionistProfile: mockCreateNutritionistProfile,
    updateMyNutritionistProfile: mockUpdateMyNutritionistProfile,
  },
}));

import { useNutritionistOnboardingSubmit } from './useNutritionistOnboardingSubmit';

const payload: NutritionistProfilePayload = {
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
};

describe('useNutritionistOnboardingSubmit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates the profile and redirects to the nutritionist dashboard', async () => {
    mockCreateNutritionistProfile.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useNutritionistOnboardingSubmit({
        mode: 'create',
        hasExistingProfile: false,
      }),
    );

    await act(async () => {
      await result.current.handleSubmit(payload);
    });

    expect(mockCreateNutritionistProfile).toHaveBeenCalledWith(payload);
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/nutritionist', { replace: true });
    expect(result.current.submitError).toBeNull();
    expect(result.current.isSubmitting).toBe(false);
  });

  it('stores the backend error message when submit fails', async () => {
    mockUpdateMyNutritionistProfile.mockRejectedValue({
      response: { data: { message: 'Custom backend error' } },
    });

    const { result } = renderHook(() =>
      useNutritionistOnboardingSubmit({
        mode: 'edit',
        hasExistingProfile: true,
      }),
    );

    await act(async () => {
      await result.current.handleSubmit(payload);
    });

    await waitFor(() => {
      expect(result.current.submitError).toBe('Custom backend error');
    });
    expect(result.current.isSubmitting).toBe(false);
  });
});
