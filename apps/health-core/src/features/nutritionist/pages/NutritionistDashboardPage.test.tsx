import { render, screen, waitFor } from '@/test/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NutritionistDashboardPage } from './NutritionistDashboardPage';
import { clinicalApi } from '@/features/clinical/services/clinicalService';

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
});
