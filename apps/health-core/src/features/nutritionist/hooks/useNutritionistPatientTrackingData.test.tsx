import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetNutritionistPatientTodaySummary,
  mockGetNutritionistPatientHistoricalMacros,
  mockGetNutritionistPatientDailyLogs,
} = vi.hoisted(() => ({
  mockGetNutritionistPatientTodaySummary: vi.fn(),
  mockGetNutritionistPatientHistoricalMacros: vi.fn(),
  mockGetNutritionistPatientDailyLogs: vi.fn(),
}));

vi.mock('@/features/tracking/services/trackingService', () => ({
  trackingService: {
    getNutritionistPatientTodaySummary: mockGetNutritionistPatientTodaySummary,
    getNutritionistPatientHistoricalMacros: mockGetNutritionistPatientHistoricalMacros,
    getNutritionistPatientDailyLogs: mockGetNutritionistPatientDailyLogs,
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

import { useNutritionistPatientTrackingData } from './useNutritionistPatientTrackingData';
import { buildHistoricalMacroRange } from '@/features/tracking/hooks/useHistoricalMacros';

describe('useNutritionistPatientTrackingData', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetNutritionistPatientTodaySummary.mockResolvedValue({
      totalCalories: 1800,
      totalProteins: 120,
      totalCarbs: 150,
      totalFats: 50,
        totalWaterMl: 1500,
        currentStreak: 2,
        bestStreak: 5,
    });
    const { startDate } = buildHistoricalMacroRange();
    mockGetNutritionistPatientHistoricalMacros.mockResolvedValue([
      { date: startDate, totalCalories: 1800, totalProteins: 120, totalCarbs: 180, totalFats: 60 },
      { date: startDate, totalCalories: 1700, totalProteins: 110, totalCarbs: 160, totalFats: 55 },
    ]);
    mockGetNutritionistPatientDailyLogs.mockResolvedValue([
      {
        id: 'log-1',
        userId: 'patient-1',
        mealType: 'BREAKFAST',
        consumedAt: `${new Date().toISOString().split('T')[0]}T08:00:00Z`,
        photoKey: null,
        items: [{ foodName: 'Avena' }],
        totalCalories: 320,
        totalProteins: 12,
        totalCarbs: 45,
        totalFats: 6,
      },
    ]);
  });

  it('loads tracking summary, historical macros and daily logs on the history tab', async () => {
    const { startDate, endDate } = buildHistoricalMacroRange();
    const todayIso = new Date().toISOString().split('T')[0];
    const { result } = renderHook(() =>
      useNutritionistPatientTrackingData({
        patientId: 'patient-1',
        activeTab: 'history',
      })
    );

    await waitFor(() => {
      expect(result.current.isLoadingPatientTrackingSummary).toBe(false);
      expect(result.current.isLoadingPatientHistoricalMacros).toBe(false);
      expect(result.current.isLoadingPatientDailyTrackingLogs).toBe(false);
    });

    expect(result.current.patientTrackingSummary?.currentStreak).toBe(2);
    expect(result.current.patientDailyTrackingLogs).toHaveLength(1);
    expect(mockGetNutritionistPatientTodaySummary).toHaveBeenCalledWith('patient-1');
    expect(mockGetNutritionistPatientHistoricalMacros).toHaveBeenCalledWith(
      'patient-1',
      startDate,
      endDate
    );
    expect(mockGetNutritionistPatientDailyLogs).toHaveBeenCalledWith('patient-1', todayIso);
  });

  it('moves the selected history date backward and forward', async () => {
    const todayIso = new Date().toISOString().split('T')[0];
    const { result } = renderHook(() =>
      useNutritionistPatientTrackingData({
        patientId: 'patient-1',
        activeTab: 'history',
      })
    );

    await waitFor(() => {
      expect(result.current.isLoadingPatientDailyTrackingLogs).toBe(false);
    });

    const previousDate = new Date(`${todayIso}T12:00:00`);
    previousDate.setDate(previousDate.getDate() - 1);
    const previousDateIso = previousDate.toISOString().split('T')[0];

    act(() => {
      result.current.goToPreviousHistoryDate();
    });

    expect(result.current.historyDate).toBe(previousDateIso);

    act(() => {
      result.current.goToNextHistoryDate();
    });

    expect(result.current.historyDate).toBe(todayIso);
    expect(result.current.disableNextHistoryDate).toBe(true);
  });

  it('does not load tracking data outside the history tab', () => {
    renderHook(() =>
      useNutritionistPatientTrackingData({
        patientId: 'patient-1',
        activeTab: 'overview',
      })
    );

    expect(mockGetNutritionistPatientTodaySummary).not.toHaveBeenCalled();
    expect(mockGetNutritionistPatientHistoricalMacros).not.toHaveBeenCalled();
    expect(mockGetNutritionistPatientDailyLogs).not.toHaveBeenCalled();
  });
});
