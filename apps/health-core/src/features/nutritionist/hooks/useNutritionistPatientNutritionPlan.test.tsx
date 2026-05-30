import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockUpsertNutritionistPatientNutritionPlan,
  mockLogClientError,
  mockLogClientInfo,
} = vi.hoisted(() => ({
  mockUpsertNutritionistPatientNutritionPlan: vi.fn(),
  mockLogClientError: vi.fn(),
  mockLogClientInfo: vi.fn(),
}));

vi.mock('@/features/clinical/services/clinicalService', () => ({
  clinicalApi: {
    upsertNutritionistPatientNutritionPlan: mockUpsertNutritionistPatientNutritionPlan,
  },
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

import { useNutritionistPatientNutritionPlan } from './useNutritionistPatientNutritionPlan';

describe('useNutritionistPatientNutritionPlan', () => {
  const loadNutritionPlan = vi.fn();
  const setNutritionPlanView = vi.fn();
  const setNutritionPlanLoadError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpsertNutritionistPatientNutritionPlan.mockResolvedValue({
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

  it('saves the nutrition plan and updates the current view', async () => {
    const { result } = renderHook(() =>
      useNutritionistPatientNutritionPlan({
        patientId: 'patient-1',
        loadNutritionPlan,
        setNutritionPlanView,
        setNutritionPlanLoadError,
      })
    );

    await act(async () => {
      await result.current.handleSaveNutritionPlan({
        sections: [],
      });
    });

    expect(mockUpsertNutritionistPatientNutritionPlan).toHaveBeenCalledWith('patient-1', {
      sections: [],
    });
    expect(setNutritionPlanView).toHaveBeenCalled();
    expect(setNutritionPlanLoadError).toHaveBeenCalledWith(null);
  });

  it('retries loading the nutrition plan', async () => {
    const { result } = renderHook(() =>
      useNutritionistPatientNutritionPlan({
        patientId: 'patient-1',
        loadNutritionPlan,
        setNutritionPlanView,
        setNutritionPlanLoadError,
      })
    );

    await act(async () => {
      await result.current.retryNutritionPlanLoad();
    });

    expect(loadNutritionPlan).toHaveBeenCalledTimes(1);
  });
});
