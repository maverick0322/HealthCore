import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetNutritionistPatientProfile,
  mockGetNutritionistPatientNutritionPlan,
  mockGetPatientObservations,
  mockLogClientError,
  mockLogClientInfo,
} = vi.hoisted(() => ({
  mockGetNutritionistPatientProfile: vi.fn(),
  mockGetNutritionistPatientNutritionPlan: vi.fn(),
  mockGetPatientObservations: vi.fn(),
  mockLogClientError: vi.fn(),
  mockLogClientInfo: vi.fn(),
}));

vi.mock('@/features/clinical/services/clinicalService', () => ({
  clinicalApi: {
    getNutritionistPatientProfile: mockGetNutritionistPatientProfile,
    getNutritionistPatientNutritionPlan: mockGetNutritionistPatientNutritionPlan,
  },
  getPatientObservations: mockGetPatientObservations,
}));

vi.mock('@/core/utils/logger', () => ({
  logClientError: mockLogClientError,
  logClientInfo: mockLogClientInfo,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

import { useNutritionistPatientClinicalData } from './useNutritionistPatientClinicalData';

describe('useNutritionistPatientClinicalData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetNutritionistPatientProfile.mockResolvedValue({
      userId: 'patient-1',
      firstName: 'Ana',
      paternalLastName: 'Lopez',
      maternalLastName: 'Ruiz',
      fullName: 'Ana Lopez Ruiz',
      weightKg: 64,
      heightCm: 168,
      birthDate: '1996-05-13',
      gender: 'FEMALE',
      activityLevel: 'LIGHTLY_ACTIVE',
      goal: 'health',
      dietType: 'vegetarian',
      allergies: [],
      excludedFoods: [],
      nutritionistId: 'nutri-1',
      profilePhotoUrl: null,
      profileCompleted: true,
    });
    mockGetPatientObservations.mockResolvedValue([]);
    mockGetNutritionistPatientNutritionPlan.mockResolvedValue({
      mode: 'NUTRITIONIST',
      authorType: 'NUTRITIONIST',
      canEdit: true,
      dailyGoals: {
        targetCalories: 2000,
        targetProtein: 120,
        targetCarbs: 220,
        targetFat: 65,
        targetWaterGlasses: 10,
      },
      sections: [],
      contextSelfManagedPlan: null,
    });
  });

  it('loads the patient profile and observations on mount', async () => {
    const { result } = renderHook(() =>
      useNutritionistPatientClinicalData({
        patientId: 'patient-1',
        activeTab: 'overview',
      })
    );

    await waitFor(() => {
      expect(result.current.isLoadingPatient).toBe(false);
    });

    expect(result.current.patient?.userId).toBe('patient-1');
    expect(result.current.observations).toEqual([]);
    expect(mockGetNutritionistPatientProfile).toHaveBeenCalledWith('patient-1');
    expect(mockGetPatientObservations).toHaveBeenCalledWith('patient-1');
  });

  it('loads the nutrition plan when the plan tab becomes active', async () => {
    const { result, rerender } = renderHook(
      ({ activeTab }) =>
        useNutritionistPatientClinicalData({
          patientId: 'patient-1',
          activeTab,
        }),
      {
        initialProps: { activeTab: 'overview' as const },
      }
    );

    await waitFor(() => {
      expect(result.current.isLoadingPatient).toBe(false);
    });

    expect(mockGetNutritionistPatientNutritionPlan).not.toHaveBeenCalled();

    rerender({ activeTab: 'plan' as const });

    await waitFor(() => {
      expect(result.current.nutritionPlanView?.mode).toBe('NUTRITIONIST');
    });

    expect(mockGetNutritionistPatientNutritionPlan).toHaveBeenCalledWith('patient-1');
  });

  it('can refresh the patient profile without turning the loading skeleton back on', async () => {
    const { result } = renderHook(() =>
      useNutritionistPatientClinicalData({
        patientId: 'patient-1',
        activeTab: 'overview',
      })
    );

    await waitFor(() => {
      expect(result.current.isLoadingPatient).toBe(false);
    });

    const callsBeforeManualRefresh = mockGetNutritionistPatientProfile.mock.calls.length;

    await act(async () => {
      await result.current.loadPatient({ showLoading: false });
    });

    expect(result.current.isLoadingPatient).toBe(false);
    expect(mockGetNutritionistPatientProfile.mock.calls.length).toBe(
      callsBeforeManualRefresh + 1
    );
  });
});
