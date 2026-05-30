import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetMyProfile,
  mockGetMyLinkedNutritionistProfile,
  mockFetchAppointments,
} = vi.hoisted(() => ({
  mockGetMyProfile: vi.fn(),
  mockGetMyLinkedNutritionistProfile: vi.fn(),
  mockFetchAppointments: vi.fn(),
}));

vi.mock('@/features/clinical/services/clinicalService', () => ({
  clinicalApi: {
    getMyProfile: mockGetMyProfile,
    getMyLinkedNutritionistProfile: mockGetMyLinkedNutritionistProfile,
  },
}));

vi.mock('@/features/patient/hooks/usePatientAppointments', () => ({
  usePatientAppointments: () => ({
    appointments: [
      {
        id: 'appt-1',
        status: 'CONFIRMED',
        startTime: '2099-06-01T10:00:00Z',
        endTime: '2099-06-01T10:30:00Z',
      },
      {
        id: 'appt-2',
        status: 'PENDING',
        startTime: '2099-06-02T09:00:00Z',
        endTime: '2099-06-02T09:30:00Z',
      },
    ],
    isLoading: false,
    error: null,
    fetchAppointments: mockFetchAppointments,
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

import { usePatientDashboardData } from './usePatientDashboardData';

describe('usePatientDashboardData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    mockGetMyLinkedNutritionistProfile.mockResolvedValue({
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
  });

  it('loads profile data, linked nutritionist data and derives the next appointment', async () => {
    const { result } = renderHook(() => usePatientDashboardData());

    await waitFor(() => {
      expect(result.current.profileLoading).toBe(false);
    });

    expect(result.current.displayName).toBe('Ana');
    expect(result.current.nutritionistName).toBe('Laura Mendez');
    expect(result.current.nextAppointment?.id).toBe('appt-1');
    expect(result.current.consultationChips).toHaveLength(1);
    expect(mockFetchAppointments).toHaveBeenCalled();
  });

  it('refreshes the profile without turning the loading state back on', async () => {
    const { result } = renderHook(() => usePatientDashboardData());

    await waitFor(() => {
      expect(result.current.profileLoading).toBe(false);
    });

    await act(async () => {
      await result.current.loadProfile({ showLoading: false });
    });

    expect(result.current.profileLoading).toBe(false);
    expect(mockGetMyProfile).toHaveBeenCalled();
  });
});