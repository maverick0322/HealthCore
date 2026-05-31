import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetMyNutritionistProfile,
  mockGetNutritionistPatients,
  mockFetchAppointments,
} = vi.hoisted(() => ({
  mockGetMyNutritionistProfile: vi.fn(),
  mockGetNutritionistPatients: vi.fn(),
  mockFetchAppointments: vi.fn(),
}));

vi.mock('@/features/clinical/services/clinicalService', () => ({
  clinicalApi: {
    getMyNutritionistProfile: mockGetMyNutritionistProfile,
    getNutritionistPatients: mockGetNutritionistPatients,
  },
}));

vi.mock('@/features/nutritionist/hooks/useNutritionistAppointments', () => ({
  useNutritionistAppointments: () => ({
    appointments: [
      {
        id: 'appt-1',
        patientId: 'patient-1',
        status: 'PENDING',
        startTime: '2099-05-18T10:00:00Z',
        endTime: '2099-05-18T10:30:00Z',
      },
      {
        id: 'appt-2',
        patientId: 'patient-2',
        status: 'CONFIRMED',
        startTime: '2099-05-18T12:00:00Z',
        endTime: '2099-05-18T12:30:00Z',
      },
    ],
    isLoading: false,
    error: null,
    fetchAppointments: mockFetchAppointments,
  }),
}));

import { useNutritionistDashboardData } from './useNutritionistDashboardData';

describe('useNutritionistDashboardData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMyNutritionistProfile.mockResolvedValue({
      userId: 'nutri-1',
      firstName: 'Laura',
      paternalLastName: 'Mendez',
      maternalLastName: '',
      fullName: 'Laura Mendez',
      specializations: ['CLINICAL'],
      customSpecialization: '',
      professionalLicense: '1234567',
      consultationTypes: ['ONLINE'],
      phone: '',
      clinicAddress: null,
      bio: 'Profile',
      profilePhotoUrl: null,
      profileCompleted: true,
    });
    mockGetNutritionistPatients.mockResolvedValue([
      {
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
    ]);
  });

  it('loads nutritionist dashboard data and derives summary values', async () => {
    const { result } = renderHook(() => useNutritionistDashboardData());

    await waitFor(() => {
      expect(result.current.profileLoading).toBe(false);
      expect(result.current.patientsLoading).toBe(false);
    });

    expect(result.current.displayName).toBe('Laura');
    expect(result.current.patients).toHaveLength(1);
    expect(result.current.upcomingAppointments).toHaveLength(2);
    expect(result.current.pendingAppointments).toBe(1);
    expect(mockFetchAppointments).toHaveBeenCalled();
  });

  it('sets the patients error when linked patients cannot be loaded', async () => {
    mockGetNutritionistPatients.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useNutritionistDashboardData());

    await waitFor(() => {
      expect(result.current.patientsLoading).toBe(false);
    });

    expect(result.current.patients).toEqual([]);
    expect(result.current.patientsError).toBe('patients.error');
  });
});
