import { render, screen } from '@/test/test-utils';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/patient/hooks/usePatientDashboardData', () => ({
  usePatientDashboardData: vi.fn(),
}));

vi.mock('@/features/tracking/hooks/useTodaySummary', () => ({
  useTodaySummary: () => ({
    summary: { totalWaterMl: 1200 },
    addWater: vi.fn(),
    removeWater: vi.fn(),
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/features/tracking/hooks/useTodayMeals', () => ({
  useTodayMeals: () => ({
    meals: [],
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/features/patient/components/PatientNav', () => ({
  PatientNav: () => <div data-testid="patient-nav" />,
}));

vi.mock('@/shared/components/SettingsBar', () => ({
  SettingsBar: () => <div data-testid="settings-bar" />,
}));

vi.mock('@/features/patient/components/DashboardWeightCard', () => ({
  DashboardWeightCard: () => <div data-testid="weight-card" />,
}));

vi.mock('@/features/patient/components/HealthGoalsCard', () => ({
  HealthGoalsCard: () => <div data-testid="goals-card" />,
}));

vi.mock('@/features/tracking/components/WaterTrackerCard', () => ({
  WaterTrackerCard: () => <div data-testid="water-card" />,
}));

vi.mock('@/features/tracking/components/TodayMealsList', () => ({
  TodayMealsList: () => <div data-testid="meals-list" />,
}));

import { usePatientDashboardData } from '@/features/patient/hooks/usePatientDashboardData';
import { PatientDashboardPage } from './PatientDashboardPage';

describe('PatientDashboardPage', () => {
  it('shows the no assigned nutritionist state and linking CTA', () => {
    vi.mocked(usePatientDashboardData).mockReturnValue({
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
        nutritionistId: null,
        profilePhotoUrl: null,
        profileCompleted: true,
      },
      nutritionistProfile: null,
      profileLoading: false,
      profileError: null,
      appointmentsLoading: false,
      appointmentsError: null,
      nextAppointment: null as never,
      displayName: 'Ana',
      nutritionistName: 'Assigned Nutritionist',
      specialtyChips: [],
      consultationChips: [],
      loadProfile: vi.fn(),
    });

    render(<PatientDashboardPage />);

    expect(screen.getByText('You do not have an assigned nutritionist yet')).toBeInTheDocument();
    expect(screen.getByText('Link nutritionist')).toBeInTheDocument();
  });

  it('shows the next appointment information when it is available', () => {
    vi.mocked(usePatientDashboardData).mockReturnValue({
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
      nutritionistProfile: {
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
      },
      profileLoading: false,
      profileError: null,
      appointmentsLoading: false,
      appointmentsError: null,
      nextAppointment: {
        id: 'appt-1',
        slotId: 'slot-1',
        nutritionistId: 'nutri-1',
        patientId: 'patient-1',
        status: 'CONFIRMED',
        startTime: '2099-06-01T10:00:00Z',
        endTime: '2099-06-01T10:30:00Z',
        version: 1,
      },
      displayName: 'Ana',
      nutritionistName: 'Laura Mendez',
      specialtyChips: ['Clinical'],
      consultationChips: ['Online'],
      loadProfile: vi.fn(),
    });

    render(<PatientDashboardPage />);

    expect(screen.getAllByText('Laura Mendez').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /reagendar|reschedule/i })).toBeInTheDocument();
  });
});
