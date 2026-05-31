import { render, screen, waitFor } from '@/test/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NutritionistDashboardPage } from './NutritionistDashboardPage';
import { clinicalApi } from '@/features/clinical/services/clinicalService';

const { mockProfileAvatar } = vi.hoisted(() => ({
  mockProfileAvatar: vi.fn(),
}));

vi.mock('@/features/clinical/services/clinicalService', () => ({
  clinicalApi: {
    getMyNutritionistProfile: vi.fn(),
    getNutritionistPatients: vi.fn(),
  },
}));

vi.mock('@/features/nutritionist/hooks/useNutritionistAppointments', () => ({
  useNutritionistAppointments: () => ({
    appointments: [],
    isLoading: false,
    error: null,
    fetchAppointments: vi.fn(),
  }),
}));

vi.mock('@/features/nutritionist/components/NutritionistNav', () => ({
  NutritionistNav: () => <div data-testid="nutritionist-nav" />,
}));

vi.mock('@/shared/components/SettingsBar', () => ({
  SettingsBar: () => <div data-testid="settings-bar" />,
}));

vi.mock('@/shared/components/ProfileAvatar', () => ({
  ProfileAvatar: (props: { name: string; photoUrl?: string | null }) => {
    mockProfileAvatar(props);
    return <div data-testid="profile-avatar">{props.name}</div>;
  },
}));

describe('NutritionistDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the linked-patients empty state and add-patient CTA in the dashboard', async () => {
    vi.mocked(clinicalApi.getMyNutritionistProfile).mockResolvedValue({
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
    vi.mocked(clinicalApi.getNutritionistPatients).mockResolvedValue([]);

    render(<NutritionistDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('You do not have assigned patients yet.')).toBeInTheDocument();
    });

    expect(screen.getByText('Add Patient')).toBeInTheDocument();
  });

  it('shows the patients error without mixing it with the empty-state CTA', async () => {
    vi.mocked(clinicalApi.getMyNutritionistProfile).mockResolvedValue({
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
    vi.mocked(clinicalApi.getNutritionistPatients).mockRejectedValue(new Error('boom'));

    render(<NutritionistDashboardPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Unable to load linked patients.')).toHaveLength(2);
    });

    expect(screen.queryByText('You do not have assigned patients yet.')).not.toBeInTheDocument();
    expect(screen.queryByText('Add Patient')).not.toBeInTheDocument();
  });

  it('passes the linked patient photo url to the dashboard avatar preview', async () => {
    vi.mocked(clinicalApi.getMyNutritionistProfile).mockResolvedValue({
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
    vi.mocked(clinicalApi.getNutritionistPatients).mockResolvedValue([
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
        profilePhotoUrl: 'https://cdn.example.com/patient-photo.webp',
        profileCompleted: true,
      },
    ]);

    render(<NutritionistDashboardPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Ana Lopez Ruiz').length).toBeGreaterThan(0);
    });

    expect(mockProfileAvatar).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Ana Lopez Ruiz',
        photoUrl: 'https://cdn.example.com/patient-photo.webp',
      }),
    );
  });
});
