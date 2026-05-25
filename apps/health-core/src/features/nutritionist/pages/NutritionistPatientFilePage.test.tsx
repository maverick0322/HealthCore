import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { render, screen, waitFor } from '@/test/test-utils';
import type { NutritionistPatientProfileResponse } from '@/features/clinical/types/clinical.types';

const {
  mockGetNutritionistPatientProfile,
  mockGetNutritionistPatientNutritionPlan,
  mockGetNutritionistPatientWeightHistory,
  mockUpsertNutritionistPatientNutritionPlan,
  mockSearchCatalogFoods,
  mockUnlinkNutritionist,
  mockGetPatientObservations,
  mockCreateObservation,
  mockUpdateObservation,
  mockDeleteObservation,
  mockExportPatientFilePdf,
  mockLogClientError,
  mockLogClientInfo,
} = vi.hoisted(() => ({
  mockGetNutritionistPatientProfile: vi.fn(),
  mockGetNutritionistPatientNutritionPlan: vi.fn(),
  mockGetNutritionistPatientWeightHistory: vi.fn(),
  mockUpsertNutritionistPatientNutritionPlan: vi.fn(),
  mockSearchCatalogFoods: vi.fn(),
  mockUnlinkNutritionist: vi.fn(),
  mockGetPatientObservations: vi.fn(),
  mockCreateObservation: vi.fn(),
  mockUpdateObservation: vi.fn(),
  mockDeleteObservation: vi.fn(),
  mockExportPatientFilePdf: vi.fn(),
  mockLogClientError: vi.fn(),
  mockLogClientInfo: vi.fn(),
}));

vi.mock('@/features/clinical/services/clinicalService', () => ({
  clinicalApi: {
    getNutritionistPatientProfile: mockGetNutritionistPatientProfile,
    updateNutritionistPatientMetrics: vi.fn(),
    getNutritionistPatientNutritionPlan: mockGetNutritionistPatientNutritionPlan,
    getNutritionistPatientWeightHistory: mockGetNutritionistPatientWeightHistory,
    upsertNutritionistPatientNutritionPlan: mockUpsertNutritionistPatientNutritionPlan,
    searchCatalogFoods: mockSearchCatalogFoods,
    unlinkNutritionist: mockUnlinkNutritionist,
  },
  getPatientObservations: mockGetPatientObservations,
  createObservation: mockCreateObservation,
  updateObservation: mockUpdateObservation,
  deleteObservation: mockDeleteObservation,
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
  ConfirmModal: ({
    isOpen,
    title,
    description,
    onConfirm,
    onClose,
    confirmText,
    cancelText,
  }: {
    isOpen: boolean;
    title: string;
    description?: string;
    onConfirm: () => void;
    onClose: () => void;
    confirmText?: string;
    cancelText?: string;
  }) =>
    isOpen ? (
      <div data-testid="confirm-modal">
        <p>{title}</p>
        {description ? <p>{description}</p> : null}
        <button onClick={onConfirm}>{confirmText ?? 'confirm'}</button>
        <button onClick={onClose}>{cancelText ?? 'cancel'}</button>
      </div>
    ) : null,
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

vi.mock('@/features/patient/components/PatientHistoryOverviewSection', () => ({
  PatientHistoryOverviewSection: ({
    weightRecords,
    isWeightLoading,
    selectedDateLabel,
  }: {
    weightRecords?: Array<{ date: string }>;
    isWeightLoading?: boolean;
    selectedDateLabel?: string;
  }) => (
    <div data-testid="patient-history-overview">
      {isWeightLoading ? 'loading' : `${weightRecords?.length ?? 0} records`} - {selectedDateLabel}
    </div>
  ),
}));

vi.mock('@/features/nutritionist/services/patientFilePdfService', () => ({
  exportNutritionistPatientFilePdf: mockExportPatientFilePdf,
}));

import { NutritionistPatientFilePage } from './NutritionistPatientFilePage';

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderPage = (initialEntries: string[] = ['/patients/nutritionist/patient-1']) => {
  const queryClient = createQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/patients/nutritionist/:id" element={<NutritionistPatientFilePage />} />
      </Routes>
    </QueryClientProvider>,
    { initialEntries }
  );
};

const patientResponse: NutritionistPatientProfileResponse = {
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

const updatedPatientResponse: NutritionistPatientProfileResponse = {
  ...patientResponse,
  weightKg: 74.5,
  heightCm: 180,
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
    mockGetNutritionistPatientWeightHistory.mockResolvedValue([
      { weightKg: 64, date: '2026-05-18' },
      { weightKg: 63.5, date: '2026-05-22' },
    ]);
    mockSearchCatalogFoods.mockResolvedValue([]);
    mockUpsertNutritionistPatientNutritionPlan.mockResolvedValue(nutritionPlanView);
    mockUpdateObservation.mockResolvedValue(undefined);
    mockDeleteObservation.mockResolvedValue(undefined);
    mockExportPatientFilePdf.mockResolvedValue(undefined);
  });

  it('loads and renders the nutrition plan tab for the nutritionist', async () => {
    const user = userEvent.setup();
    mockGetNutritionistPatientNutritionPlan.mockResolvedValue(nutritionPlanView);

    renderPage();

    await screen.findByText('Ana Lopez Ruiz');
    await user.click(screen.getByRole('button', { name: 'Nutrition Plan' }));

    await waitFor(() => {
      expect(screen.getByTestId('nutrition-plan-workspace')).toHaveTextContent('NUTRITIONIST');
    });

    expect(mockLogClientInfo).toHaveBeenCalledWith(
      'NutritionistPatientFilePage.plan.load.success',
      expect.objectContaining({ patientId: 'patient-1', mode: 'NUTRITIONIST', canEdit: true })
    );
  });

  it('updates patient metrics from the overview tab', async () => {
    const user = userEvent.setup();
    const mockedClinicalApi = await import('@/features/clinical/services/clinicalService');
    mockGetNutritionistPatientNutritionPlan.mockResolvedValue(nutritionPlanView);
    vi.mocked(mockedClinicalApi.clinicalApi.updateNutritionistPatientMetrics).mockResolvedValue(
      updatedPatientResponse
    );

    renderPage();

    await screen.findByText('Ana Lopez Ruiz');
    await user.click(screen.getByRole('button', { name: 'Modify' }));

    const inputs = screen.getAllByRole('textbox');
    await user.clear(inputs[0]);
    await user.type(inputs[0], '74.5');
    await user.clear(inputs[1]);
    await user.type(inputs[1], '180');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await user.click(screen.getAllByRole('button', { name: 'Save' }).at(-1)!);

    await waitFor(() => {
      expect(mockedClinicalApi.clinicalApi.updateNutritionistPatientMetrics).toHaveBeenCalledWith(
        'patient-1',
        { weightKg: 74.5, heightCm: 180 }
      );
    });

    await waitFor(() => {
      expect(mockGetNutritionistPatientWeightHistory).toHaveBeenCalledWith('patient-1');
    });
  });

  it('refreshes the overview data when the window regains focus', async () => {
    renderPage();

    await screen.findByText('Ana Lopez Ruiz');

    mockGetNutritionistPatientProfile.mockResolvedValue(updatedPatientResponse);

    window.dispatchEvent(new Event('focus'));

    await waitFor(() => {
      expect(mockGetNutritionistPatientProfile).toHaveBeenCalledTimes(2);
    });
  });

  it('shows a retryable error state when loading the nutrition plan fails', async () => {
    const user = userEvent.setup();
    mockGetNutritionistPatientNutritionPlan
      .mockRejectedValueOnce(new Error('plan failed'))
      .mockResolvedValueOnce(nutritionPlanView);

    renderPage();

    await screen.findByText('Ana Lopez Ruiz');
    await user.click(screen.getByRole('button', { name: 'Nutrition Plan' }));

    expect(await screen.findByText('We could not load the nutrition plan.')).toBeInTheDocument();
    expect(mockLogClientError).toHaveBeenCalledWith(
      'NutritionistPatientFilePage.plan.load.error',
      expect.any(Error),
      expect.objectContaining({ patientId: 'patient-1' })
    );

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(screen.getByTestId('nutrition-plan-workspace')).toHaveTextContent('NUTRITIONIST');
    });

    expect(mockGetNutritionistPatientNutritionPlan).toHaveBeenCalledTimes(2);
  });

  it('renders the observations tab and shows saved observations', async () => {
    const user = userEvent.setup();
    mockGetPatientObservations.mockResolvedValue([
      {
        id: 'obs-1',
        patientId: 'patient-1',
        nutritionistId: 'nutri-1',
        note: 'Increase hydration and keep breakfast consistent.',
        createdAt: '2026-05-18T12:00:00Z',
      },
    ]);

    renderPage();

    await screen.findByText('Ana Lopez Ruiz');

    const observationsTab = screen.getByRole('button', { name: 'Observations' });
    expect(observationsTab).toBeInTheDocument();

    await user.click(observationsTab);

    expect(
      await screen.findByText('Increase hydration and keep breakfast consistent.')
    ).toBeInTheDocument();
  });

  it('renders the history tab with the patient weight history', async () => {
    const user = userEvent.setup();

    renderPage();

    await screen.findByText('Ana Lopez Ruiz');
    await user.click(screen.getByRole('button', { name: 'History' }));

    expect(await screen.findByTestId('patient-history-overview')).toHaveTextContent('2 records');
    expect(mockGetNutritionistPatientWeightHistory).toHaveBeenCalledWith('patient-1');
  });

  it('updates and deletes observations from the observations tab', async () => {
    const user = userEvent.setup();
    mockGetPatientObservations.mockResolvedValue([
      {
        id: 'obs-1',
        patientId: 'patient-1',
        nutritionistId: 'nutri-1',
        note: 'Initial observation',
        createdAt: '2026-05-18T12:00:00Z',
      },
    ]);

    renderPage();

    await screen.findByText('Ana Lopez Ruiz');
    await user.click(screen.getByRole('button', { name: 'Observations' }));
    await screen.findByText('Initial observation');
    expect(screen.getByText('0/500')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, 'Updated observation');
    expect(screen.getByText('19/500')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(mockUpdateObservation).toHaveBeenCalledWith('obs-1', { note: 'Updated observation' });

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(screen.getAllByRole('button', { name: 'Delete' }).at(-1)!);

    expect(mockDeleteObservation).toHaveBeenCalledWith('obs-1');
  });

  it('exports a structured patient file pdf', async () => {
    const user = userEvent.setup();
    mockGetPatientObservations.mockResolvedValue([
      {
        id: 'obs-1',
        patientId: 'patient-1',
        nutritionistId: 'nutri-1',
        note: 'Initial observation',
        createdAt: '2026-05-18T12:00:00Z',
      },
    ]);

    renderPage();

    await screen.findByText('Ana Lopez Ruiz');
    await user.click(screen.getByRole('button', { name: 'Download Patient File PDF' }));

    await waitFor(() => {
      expect(mockExportPatientFilePdf).toHaveBeenCalledTimes(1);
    });
  });
});
