import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { NutritionPlanViewResponse } from '@/features/clinical/types/clinical.types';

const {
  mockExportPatientNutritionPlanPdf,
  mockLogClientError,
} = vi.hoisted(() => ({
  mockExportPatientNutritionPlanPdf: vi.fn(),
  mockLogClientError: vi.fn(),
}));

vi.mock('@/features/patient/services/patientNutritionPlanPdfService', () => ({
  exportPatientNutritionPlanPdf: mockExportPatientNutritionPlanPdf,
}));

vi.mock('@/core/utils/logger', () => ({
  logClientError: mockLogClientError,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

import { usePatientPlanPdfExport } from './usePatientPlanPdfExport';

const mockView: NutritionPlanViewResponse = {
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

describe('usePatientPlanPdfExport', () => {
  it('exports the patient nutrition plan pdf with the current data', async () => {
    const setLoadError = vi.fn();
    mockExportPatientNutritionPlanPdf.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      usePatientPlanPdfExport({
        view: mockView,
        profile: {
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
        },
        observations: [],
        setLoadError,
      })
    );

    await act(async () => {
      await result.current.handleExportPdf();
    });

    await waitFor(() => {
      expect(mockExportPatientNutritionPlanPdf).toHaveBeenCalledWith(
        expect.objectContaining({
          patientName: 'Ana Lopez Ruiz',
          view: mockView,
          fileName: 'plan-nutricional-ana-lopez-ruiz.pdf',
        })
      );
    });
    expect(result.current.isExportingPdf).toBe(false);
    expect(setLoadError).not.toHaveBeenCalled();
  });
});
