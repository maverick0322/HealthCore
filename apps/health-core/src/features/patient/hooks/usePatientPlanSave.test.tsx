import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const {
  mockUpsertMyNutritionPlan,
  mockLogClientError,
  mockLogClientInfo,
} = vi.hoisted(() => ({
  mockUpsertMyNutritionPlan: vi.fn(),
  mockLogClientError: vi.fn(),
  mockLogClientInfo: vi.fn(),
}));

vi.mock('@/features/clinical/services/clinicalService', () => ({
  clinicalApi: {
    upsertMyNutritionPlan: mockUpsertMyNutritionPlan,
  },
}));

vi.mock('@/core/utils/logger', () => ({
  logClientError: mockLogClientError,
  logClientInfo: mockLogClientInfo,
}));

import { usePatientPlanSave } from './usePatientPlanSave';

const mockView = {
  mode: 'SELF_MANAGED',
  authorType: 'SELF_MANAGED',
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
};

describe('usePatientPlanSave', () => {
  it('saves the patient plan and updates page state callbacks', async () => {
    const setView = vi.fn();
    const setLoadError = vi.fn();
    mockUpsertMyNutritionPlan.mockResolvedValue(mockView);

    const { result } = renderHook(() =>
      usePatientPlanSave({
        setView,
        setLoadError,
      })
    );

    await act(async () => {
      await result.current.handleSave({ sections: [] });
    });

    expect(mockUpsertMyNutritionPlan).toHaveBeenCalledWith({ sections: [] });
    expect(setView).toHaveBeenCalledWith(mockView);
    expect(setLoadError).toHaveBeenCalledWith(null);
    expect(mockLogClientInfo).toHaveBeenCalledWith(
      'PatientPlanPage.save.success',
      expect.objectContaining({ mode: 'SELF_MANAGED', canEdit: true })
    );
  });
});
