import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetNutritionistPatients,
  mockGetMyAppointments,
} = vi.hoisted(() => ({
  mockGetNutritionistPatients: vi.fn(),
  mockGetMyAppointments: vi.fn(),
}));

vi.mock('@/features/clinical/services/clinicalService', () => ({
  clinicalApi: {
    getNutritionistPatients: mockGetNutritionistPatients,
  },
}));

vi.mock('@/features/nutritionist/services/nutritionistAgendaService', () => ({
  nutritionistAgendaService: {
    getMyAppointments: mockGetMyAppointments,
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/features/onboarding/utils/profilePresentation', () => ({
  formatPatientGoalLabel: (_t: unknown, goal: string) => goal,
}));

import { useNutritionistPatientsPage } from './useNutritionistPatientsPage';

describe('useNutritionistPatientsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetNutritionistPatients.mockResolvedValue([
      {
        userId: 'patient-1',
        firstName: 'Ana',
        paternalLastName: 'Lopez',
        maternalLastName: '',
        fullName: 'Ana Lopez',
        weightKg: 62,
        heightCm: 165,
        birthDate: '1996-05-10',
        gender: 'FEMALE',
        activityLevel: 'LIGHTLY_ACTIVE',
        goal: 'health',
        dietType: 'omnivore',
        allergies: [],
        excludedFoods: [],
        nutritionistId: 'nutri-1',
        profilePhotoUrl: null,
        profileCompleted: true,
      },
    ]);
    mockGetMyAppointments.mockResolvedValue([
      {
        id: 'appt-1',
        slotId: 'slot-1',
        nutritionistId: 'nutri-1',
        patientId: 'patient-1',
        startTime: '2099-06-01T10:00:00Z',
        endTime: '2099-06-01T10:30:00Z',
        status: 'CONFIRMED',
        version: 1,
      },
    ]);
  });

  it('loads patients and derives their cards', async () => {
    const { result } = renderHook(() => useNutritionistPatientsPage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.patientCards).toHaveLength(1);
    expect(result.current.patientCards[0]?.futureAppointments).toBe(1);
    expect(result.current.loadError).toBeNull();
  });

  it('filters patients by the search term', async () => {
    const { result } = renderHook(() => useNutritionistPatientsPage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    result.current.setSearchTerm('zzz');

    await waitFor(() => {
      expect(result.current.filteredPatients).toEqual([]);
    });
  });
});
