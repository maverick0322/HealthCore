import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetMyNutritionPlan,
  mockGetMyProfile,
  mockGetMyObservations,
  mockLogClientError,
  mockLogClientInfo,
} = vi.hoisted(() => ({
  mockGetMyNutritionPlan: vi.fn(),
  mockGetMyProfile: vi.fn(),
  mockGetMyObservations: vi.fn(),
  mockLogClientError: vi.fn(),
  mockLogClientInfo: vi.fn(),
}));

vi.mock('@/features/clinical/services/clinicalService', () => ({
  clinicalApi: {
    getMyNutritionPlan: mockGetMyNutritionPlan,
    getMyProfile: mockGetMyProfile,
    getMyObservations: mockGetMyObservations,
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

import { usePatientPlanData } from './usePatientPlanData';

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

describe('usePatientPlanData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMyNutritionPlan.mockResolvedValue(mockView);
    mockGetMyProfile.mockResolvedValue({
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
    mockGetMyObservations.mockResolvedValue([
      {
        id: 'obs-1',
        patientId: 'patient-1',
        nutritionistId: 'nutri-1',
        note: 'Ajustar hidratacion',
        createdAt: '2026-05-18T12:00:00Z',
      },
    ]);
  });

  it('loads the patient plan, profile and observations on mount', async () => {
    const { result } = renderHook(() => usePatientPlanData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.view?.mode).toBe('SELF_MANAGED');
    expect(result.current.hasLinkedNutritionist).toBe(true);
    expect(result.current.observations).toHaveLength(1);
    expect(mockGetMyNutritionPlan).toHaveBeenCalled();
    expect(mockGetMyProfile).toHaveBeenCalled();
    expect(mockGetMyObservations).toHaveBeenCalled();
  });

  it('skips observations when the patient has no linked nutritionist', async () => {
    mockGetMyProfile.mockResolvedValue({
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
      nutritionistId: null,
      profilePhotoUrl: null,
      profileCompleted: true,
    });

    const { result } = renderHook(() => usePatientPlanData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasLinkedNutritionist).toBe(false);
    expect(result.current.observations).toEqual([]);
    expect(mockGetMyObservations).not.toHaveBeenCalled();
  });

  it('refreshes the plan without re-enabling the loading state when requested', async () => {
    const { result } = renderHook(() => usePatientPlanData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialCallCount = mockGetMyNutritionPlan.mock.calls.length;

    await act(async () => {
      await result.current.loadPlan({ showLoading: false, source: 'focus' });
    });

    expect(result.current.isLoading).toBe(false);
    expect(mockGetMyNutritionPlan.mock.calls.length).toBe(initialCallCount + 1);
  });
});
