import { fireEvent, render, screen, waitFor } from '@/test/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NutritionistPatientsPage } from './NutritionistPatientsPage';
import { clinicalApi } from '@/features/clinical/services/clinicalService';
import { nutritionistAgendaService } from '@/features/nutritionist/services/nutritionistAgendaService';

vi.mock('@/features/clinical/services/clinicalService', () => ({
  clinicalApi: {
    getNutritionistPatients: vi.fn(),
  },
}));

vi.mock('@/features/nutritionist/services/nutritionistAgendaService', () => ({
  nutritionistAgendaService: {
    getMyAppointments: vi.fn(),
  },
}));

vi.mock('@/features/nutritionist/components/NutritionistNav', () => ({
  NutritionistNav: () => <div data-testid="nutritionist-nav" />,
}));

vi.mock('@/shared/components/SettingsBar', () => ({
  SettingsBar: () => <div data-testid="settings-bar" />,
}));

vi.mock('@/shared/components/ProfileAvatar', () => ({
  ProfileAvatar: ({ name }: { name: string }) => <div>{name}</div>,
}));

describe('NutritionistPatientsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the linked-patients empty state and add-patient CTA when there are no linked patients', async () => {
    vi.mocked(clinicalApi.getNutritionistPatients).mockResolvedValue([]);
    vi.mocked(nutritionistAgendaService.getMyAppointments).mockResolvedValue([]);

    render(<NutritionistPatientsPage />);

    await waitFor(() => {
      expect(screen.getByText('You do not have linked patients yet.')).toBeInTheDocument();
    });

    expect(screen.getByText('Add your first patient to start your clinical follow-up.')).toBeInTheDocument();
    expect(screen.getAllByText('Add Patient').length).toBeGreaterThan(0);
  });

  it('keeps rendering patients even when appointment loading fails', async () => {
    vi.mocked(clinicalApi.getNutritionistPatients).mockResolvedValue([
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
    vi.mocked(nutritionistAgendaService.getMyAppointments).mockRejectedValue(new Error('agenda down'));

    render(<NutritionistPatientsPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Ana Lopez').length).toBeGreaterThan(0);
    });

    expect(screen.queryByText('Unable to load linked patients.')).not.toBeInTheDocument();
  });

  it('shows a search-specific empty state when there are linked patients but no matches', async () => {
    vi.mocked(clinicalApi.getNutritionistPatients).mockResolvedValue([
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
    vi.mocked(nutritionistAgendaService.getMyAppointments).mockResolvedValue([]);

    render(<NutritionistPatientsPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Ana Lopez').length).toBeGreaterThan(0);
    });

    fireEvent.change(screen.getByLabelText('Search patients by name:'), {
      target: { value: 'zzz' },
    });

    expect(screen.getByText('No patients matched your search.')).toBeInTheDocument();
  });
});
