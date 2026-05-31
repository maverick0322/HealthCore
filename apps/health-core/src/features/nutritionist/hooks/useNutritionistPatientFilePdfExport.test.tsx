import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  NutritionPlanViewResponse,
  NutritionistPatientProfileResponse,
} from '@/features/clinical/types/clinical.types';

const {
  mockGetNutritionistPatientWeightHistory,
  mockGetNutritionistPatientTodaySummary,
  mockGetNutritionistPatientHistoricalMacros,
  mockGetNutritionistPatientDailyLogs,
  mockExportNutritionistPatientFilePdf,
  mockLogClientError,
} = vi.hoisted(() => ({
  mockGetNutritionistPatientWeightHistory: vi.fn(),
  mockGetNutritionistPatientTodaySummary: vi.fn(),
  mockGetNutritionistPatientHistoricalMacros: vi.fn(),
  mockGetNutritionistPatientDailyLogs: vi.fn(),
  mockExportNutritionistPatientFilePdf: vi.fn(),
  mockLogClientError: vi.fn(),
}));

vi.mock('@/features/clinical/services/clinicalService', () => ({
  clinicalApi: {
    getNutritionistPatientWeightHistory: mockGetNutritionistPatientWeightHistory,
  },
}));

vi.mock('@/features/tracking/services/trackingService', () => ({
  trackingService: {
    getNutritionistPatientTodaySummary: mockGetNutritionistPatientTodaySummary,
    getNutritionistPatientHistoricalMacros: mockGetNutritionistPatientHistoricalMacros,
    getNutritionistPatientDailyLogs: mockGetNutritionistPatientDailyLogs,
  },
}));

vi.mock('@/features/nutritionist/services/patientFilePdfService', () => ({
  exportNutritionistPatientFilePdf: mockExportNutritionistPatientFilePdf,
}));

vi.mock('@/core/utils/logger', () => ({
  logClientError: mockLogClientError,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: 'en' },
  }),
}));

import { useNutritionistPatientFilePdfExport } from './useNutritionistPatientFilePdfExport';

describe('useNutritionistPatientFilePdfExport', () => {
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

  const nutritionPlanView: NutritionPlanViewResponse = {
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
  };

  const loadNutritionPlan = vi.fn();
  const refetchWeightHistory = vi.fn();
  const setPageFeedback = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetNutritionistPatientWeightHistory.mockResolvedValue([
      { weightKg: 64, date: '2026-05-18' },
    ]);
    mockGetNutritionistPatientTodaySummary.mockResolvedValue({
      totalCalories: 1800,
      totalProteins: 120,
      totalCarbs: 150,
      totalFats: 50,
      totalWaterMl: 1500,
      currentStreak: 2,
      bestStreak: 5,
    });
    mockGetNutritionistPatientHistoricalMacros.mockResolvedValue([
      { date: '2026-05-18', totalCalories: 1800, totalProteins: 120, totalCarbs: 180, totalFats: 60 },
    ]);
    mockGetNutritionistPatientDailyLogs.mockResolvedValue([
      {
        id: 'log-1',
        userId: 'patient-1',
        mealType: 'BREAKFAST',
        consumedAt: '2026-05-18T08:00:00Z',
        photoKey: null,
        items: [{ foodName: 'Avena' }],
        totalCalories: 320,
        totalProteins: 12,
        totalCarbs: 45,
        totalFats: 6,
      },
    ]);
    mockExportNutritionistPatientFilePdf.mockResolvedValue(undefined);
    refetchWeightHistory.mockResolvedValue({ data: [{ weightKg: 64, date: '2026-05-18' }] });
    loadNutritionPlan.mockResolvedValue(nutritionPlanView);
  });

  it('exports the patient file using the available page data', async () => {
    const { result } = renderHook(() =>
      useNutritionistPatientFilePdfExport({
        patientId: 'patient-1',
        patient,
        activeTab: 'history',
        historyDate: '2026-05-18',
        historyDateLabel: 'Today',
        observations: [],
        nutritionPlanView,
        loadNutritionPlan,
        weightHistory: [{ weightKg: 64, date: '2026-05-18' }],
        refetchWeightHistory,
        patientTrackingSummary: null,
        patientHistoricalMacroLogs: [],
        patientDailyTrackingLogs: [],
        patientGoalLabel: 'Health',
        patientActivityLabel: 'Lightly active',
        patientDietLabel: 'Vegetarian',
        setPageFeedback,
      })
    );

    await act(async () => {
      await result.current.handleExportPatientFilePdf();
    });

    await waitFor(() => {
      expect(mockExportNutritionistPatientFilePdf).toHaveBeenCalledTimes(1);
    });
    expect(refetchWeightHistory).toHaveBeenCalled();
  });

  it('shows feedback when the export fails', async () => {
    mockExportNutritionistPatientFilePdf.mockRejectedValueOnce(new Error('export failed'));

    const { result } = renderHook(() =>
      useNutritionistPatientFilePdfExport({
        patientId: 'patient-1',
        patient,
        activeTab: 'history',
        historyDate: '2026-05-18',
        historyDateLabel: 'Today',
        observations: [],
        nutritionPlanView,
        loadNutritionPlan,
        weightHistory: [{ weightKg: 64, date: '2026-05-18' }],
        refetchWeightHistory,
        patientTrackingSummary: null,
        patientHistoricalMacroLogs: [],
        patientDailyTrackingLogs: [],
        patientGoalLabel: 'Health',
        patientActivityLabel: 'Lightly active',
        patientDietLabel: 'Vegetarian',
        setPageFeedback,
      })
    );

    await act(async () => {
      await result.current.handleExportPatientFilePdf();
    });

    await waitFor(() => {
      expect(setPageFeedback).toHaveBeenCalledWith({
        type: 'error',
        message: 'patients.file.pdf.error',
      });
    });
  });
});
