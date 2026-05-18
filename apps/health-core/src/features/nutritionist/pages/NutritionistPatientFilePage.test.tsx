import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';

import { render, screen, waitFor } from '@/test/test-utils';

const {
  mockGetNutritionistPatientProfile,
  mockGetNutritionistPatientNutritionPlan,
  mockUpsertNutritionistPatientNutritionPlan,
  mockSearchCatalogFoods,
  mockUnlinkNutritionist,
  mockGetPatientObservations,
  mockCreateObservation,
  mockLogClientError,
  mockLogClientInfo,
} = vi.hoisted(() => ({
  mockGetNutritionistPatientProfile: vi.fn(),
  mockGetNutritionistPatientNutritionPlan: vi.fn(),
  mockUpsertNutritionistPatientNutritionPlan: vi.fn(),
  mockSearchCatalogFoods: vi.fn(),
  mockUnlinkNutritionist: vi.fn(),
  mockGetPatientObservations: vi.fn(),
  mockCreateObservation: vi.fn(),
  mockLogClientError: vi.fn(),
  mockLogClientInfo: vi.fn(),
}));

vi.mock('@/features/clinical/services/clinicalService', () => ({
  clinicalApi: {
    getNutritionistPatientProfile: mockGetNutritionistPatientProfile,
    getNutritionistPatientNutritionPlan: mockGetNutritionistPatientNutritionPlan,
    upsertNutritionistPatientNutritionPlan: mockUpsertNutritionistPatientNutritionPlan,
    searchCatalogFoods: mockSearchCatalogFoods,
    unlinkNutritionist: mockUnlinkNutritionist,
  },
  getPatientObservations: mockGetPatientObservations,
  createObservation: mockCreateObservation,
}));

vi.mock('@/core/utils/logger', () => ({
  logClientError: mockLogClientError,
  logClientInfo: mockLogClientInfo,
}));

vi.mock('@/features/nutritionist/components/NutritionistNav', () => ({
  NutritionistNav: () => <div data-testid="nutritionist-nav" />,
}));

vi.mock('@/shared/components/SettingsBar', () => ({
  SettingsBar: () => <div data-testid="settings-bar" />,
}));

vi.mock('@/shared/components/ConfirmModal', () => ({
  ConfirmModal: () => null,
}));

vi.mock('@/shared/ui/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner" />,
}));

vi.mock('@/features/nutrition-plan/components/NutritionPlanWorkspace', () => ({
  NutritionPlanWorkspace: ({
    view,
    isLoading,
  }: {
    view: { mode?: string } | null;
    isLoading?: boolean;
  }) => (
    <div data-testid="nutrition-plan-workspace">
      {isLoading ? 'loading' : view?.mode ?? 'no-view'}
    </div>
  ),
}));

import { NutritionistPatientFilePage } from './NutritionistPatientFilePage';

const patientResponse = {
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
  profileCompleted: true,
};

const nutritionPlanView = {
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

describe('NutritionistPatientFilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetNutritionistPatientProfile.mockResolvedValue(patientResponse);
    mockGetPatientObservations.mockResolvedValue([]);
    mockSearchCatalogFoods.mockResolvedValue([]);
    mockUpsertNutritionistPatientNutritionPlan.mockResolvedValue(nutritionPlanView);
  });

  it('loads and renders the nutrition plan tab for the nutritionist', async () => {
    const user = userEvent.setup();
    mockGetNutritionistPatientNutritionPlan.mockResolvedValue(nutritionPlanView);

    render(
      <Routes>
        <Route path="/patients/nutritionist/:id" element={<NutritionistPatientFilePage />} />
      </Routes>,
      { initialEntries: ['/patients/nutritionist/patient-1'] },
    );

    await screen.findByText('Ana Lopez Ruiz');
    await user.click(screen.getByRole('button', { name: 'Nutrition Plan' }));

    await waitFor(() => {
      expect(screen.getByTestId('nutrition-plan-workspace')).toHaveTextContent('NUTRITIONIST');
    });

    expect(mockLogClientInfo).toHaveBeenCalledWith(
      'NutritionistPatientFilePage.plan.load.success',
      expect.objectContaining({ patientId: 'patient-1', mode: 'NUTRITIONIST', canEdit: true }),
    );
  });

  it('shows a retryable error state when loading the nutrition plan fails', async () => {
    const user = userEvent.setup();
    mockGetNutritionistPatientNutritionPlan
      .mockRejectedValueOnce(new Error('plan failed'))
      .mockResolvedValueOnce(nutritionPlanView);

    render(
      <Routes>
        <Route path="/patients/nutritionist/:id" element={<NutritionistPatientFilePage />} />
      </Routes>,
      { initialEntries: ['/patients/nutritionist/patient-1'] },
    );

    await screen.findByText('Ana Lopez Ruiz');
    await user.click(screen.getByRole('button', { name: 'Nutrition Plan' }));

    expect(await screen.findByText('We could not load the nutrition plan.')).toBeInTheDocument();
    expect(mockLogClientError).toHaveBeenCalledWith(
      'NutritionistPatientFilePage.plan.load.error',
      expect.any(Error),
      expect.objectContaining({ patientId: 'patient-1' }),
    );

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(screen.getByTestId('nutrition-plan-workspace')).toHaveTextContent('NUTRITIONIST');
    });

    expect(mockGetNutritionistPatientNutritionPlan).toHaveBeenCalledTimes(2);
  });
});
