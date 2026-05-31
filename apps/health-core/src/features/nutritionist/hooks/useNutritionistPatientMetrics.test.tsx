import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  NutritionPlanViewResponse,
  NutritionistPatientProfileResponse,
} from '@/features/clinical/types/clinical.types';

const {
  mockUpdateNutritionistPatientMetrics,
  mockLogClientError,
} = vi.hoisted(() => ({
  mockUpdateNutritionistPatientMetrics: vi.fn(),
  mockLogClientError: vi.fn(),
}));

vi.mock('@/features/clinical/services/clinicalService', () => ({
  clinicalApi: {
    updateNutritionistPatientMetrics: mockUpdateNutritionistPatientMetrics,
  },
}));

vi.mock('@/core/utils/logger', () => ({
  logClientError: mockLogClientError,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

import { useNutritionistPatientMetrics } from './useNutritionistPatientMetrics';

describe('useNutritionistPatientMetrics', () => {
  const patient: NutritionistPatientProfileResponse = {
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
  };

  const setPatient = vi.fn();
  const loadNutritionPlan = vi.fn();
  const refetchWeightHistory = vi.fn();
  const setPageFeedback = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateNutritionistPatientMetrics.mockResolvedValue({
      ...patient,
      weightKg: 74.5,
      heightCm: 180,
    });
    refetchWeightHistory.mockResolvedValue(undefined);
    loadNutritionPlan.mockResolvedValue(null);
  });

  it('validates the metrics before opening the confirmation dialog', () => {
    const { result } = renderHook(() =>
      useNutritionistPatientMetrics({
        patientId: 'patient-1',
        patient,
        nutritionPlanView: null,
        setPatient,
        loadNutritionPlan,
        refetchWeightHistory,
        setPageFeedback,
      })
    );

    act(() => {
      result.current.openEditMetricsDialog();
    });

    act(() => {
      result.current.setMetricsWeightInput('12');
      result.current.setMetricsHeightInput('90');
    });

    act(() => {
      result.current.handleReviewMetricsUpdate();
    });

    expect(result.current.confirmEditMetricsOpen).toBe(false);
    expect(result.current.metricsErrors).toEqual({
      weightKg: 'patients.file.metrics.validation.weightRange',
      heightCm: 'patients.file.metrics.validation.heightInvalid',
    });
  });

  it('updates patient metrics and refreshes related data', async () => {
    const { result } = renderHook(() =>
      useNutritionistPatientMetrics({
        patientId: 'patient-1',
        patient,
        nutritionPlanView: {
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
        } satisfies NutritionPlanViewResponse,
        setPatient,
        loadNutritionPlan,
        refetchWeightHistory,
        setPageFeedback,
      })
    );

    act(() => {
      result.current.openEditMetricsDialog();
      result.current.setMetricsWeightInput('74.5');
      result.current.setMetricsHeightInput('180');
      result.current.handleReviewMetricsUpdate();
    });

    await act(async () => {
      await result.current.handleConfirmMetricsUpdate();
    });

    expect(mockUpdateNutritionistPatientMetrics).toHaveBeenCalledWith('patient-1', {
      weightKg: 74.5,
      heightCm: 180,
    });
    expect(setPatient).toHaveBeenCalled();
    expect(refetchWeightHistory).toHaveBeenCalled();
    expect(loadNutritionPlan).toHaveBeenCalled();
    await waitFor(() => {
      expect(result.current.editMetricsOpen).toBe(false);
      expect(result.current.confirmEditMetricsOpen).toBe(false);
    });
  });
});
