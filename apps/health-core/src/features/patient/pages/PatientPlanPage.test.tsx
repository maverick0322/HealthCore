import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { render, screen, waitFor } from '@/test/test-utils';

const {
  mockGetMyNutritionPlan,
  mockGetMyObservations,
  mockUpsertMyNutritionPlan,
  mockSearchCatalogFoods,
  mockLogClientError,
  mockLogClientInfo,
} = vi.hoisted(() => ({
  mockGetMyNutritionPlan: vi.fn(),
  mockGetMyObservations: vi.fn(),
  mockUpsertMyNutritionPlan: vi.fn(),
  mockSearchCatalogFoods: vi.fn(),
  mockLogClientError: vi.fn(),
  mockLogClientInfo: vi.fn(),
}));

vi.mock('@/features/clinical/services/clinicalService', () => ({
  clinicalApi: {
    getMyNutritionPlan: mockGetMyNutritionPlan,
    getMyObservations: mockGetMyObservations,
    upsertMyNutritionPlan: mockUpsertMyNutritionPlan,
    searchCatalogFoods: mockSearchCatalogFoods,
  },
}));

vi.mock('@/core/utils/logger', () => ({
  logClientError: mockLogClientError,
  logClientInfo: mockLogClientInfo,
}));

vi.mock('@/features/patient/components/PatientNav', () => ({
  PatientNav: () => <div data-testid="patient-nav" />,
}));

vi.mock('@/shared/components/SettingsBar', () => ({
  SettingsBar: () => <div data-testid="settings-bar" />,
}));

vi.mock('@/features/nutrition-plan/components/NutritionPlanWorkspace', () => ({
  NutritionPlanWorkspace: ({
    view,
    observations,
    isLoading,
  }: {
    view: { mode?: string } | null;
    observations?: Array<{ note: string }>;
    isLoading?: boolean;
  }) => (
    <div data-testid="nutrition-plan-workspace">
      {isLoading ? 'loading' : `${view?.mode ?? 'no-view'}:${observations?.length ?? 0}`}
    </div>
  ),
}));

import { PatientPlanPage } from './PatientPlanPage';

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

describe('PatientPlanPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMyObservations.mockResolvedValue([
      {
        id: 'obs-1',
        patientId: 'patient-1',
        nutritionistId: 'nutri-1',
        note: 'Ajustar hidratacion',
        createdAt: '2026-05-18T12:00:00Z',
      },
    ]);
    mockSearchCatalogFoods.mockResolvedValue([]);
    mockUpsertMyNutritionPlan.mockResolvedValue(mockView);
  });

  it('loads and renders the patient nutrition plan', async () => {
    mockGetMyNutritionPlan.mockResolvedValue(mockView);

    render(<PatientPlanPage />);

    await waitFor(() => {
      expect(screen.getByTestId('nutrition-plan-workspace')).toHaveTextContent('SELF_MANAGED:1');
    });

    expect(mockLogClientInfo).toHaveBeenCalledWith(
      'PatientPlanPage.load.success',
      expect.objectContaining({ mode: 'SELF_MANAGED', canEdit: true, sections: 0 }),
    );
  });

  it('shows a retryable error state when the plan request fails', async () => {
    const user = userEvent.setup();
    mockGetMyNutritionPlan
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(mockView);

    render(<PatientPlanPage />);

    expect(await screen.findByText('We could not load your nutrition plan.')).toBeInTheDocument();
    expect(mockLogClientError).toHaveBeenCalledWith(
      'PatientPlanPage.load.error',
      expect.any(Error),
    );

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(screen.getByTestId('nutrition-plan-workspace')).toHaveTextContent('SELF_MANAGED');
    });

    expect(screen.getByTestId('nutrition-plan-workspace')).toHaveTextContent('SELF_MANAGED:1');
    expect(mockGetMyNutritionPlan).toHaveBeenCalledTimes(2);
    expect(mockGetMyObservations).toHaveBeenCalledTimes(1);
    expect(mockLogClientInfo).toHaveBeenCalledWith('PatientPlanPage.retry.start');
  });
});
