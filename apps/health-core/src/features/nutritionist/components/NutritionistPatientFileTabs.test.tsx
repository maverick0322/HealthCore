import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { render, screen } from '@/test/test-utils';
import type {
  NutritionPlanViewResponse,
  NutritionistPatientProfileResponse,
  ObservationResponse,
  WeightRecord,
} from '@/features/clinical/types/clinical.types';
import type { MealLogDTO, TodayDashboardSummary } from '@/features/tracking/types/tracking.types';

vi.mock('@/features/nutrition-plan/components/NutritionPlanWorkspace', () => ({
  NutritionPlanWorkspace: ({
    view,
    isLoading,
    onOpenCreateLocalFood,
  }: {
    view: { mode?: string } | null;
    isLoading?: boolean;
    onOpenCreateLocalFood: (name: string) => void;
  }) => (
    <div>
      <div data-testid="nutrition-plan-workspace">{isLoading ? 'loading' : view?.mode ?? 'no-view'}</div>
      <button onClick={() => onOpenCreateLocalFood('Apple')}>open-food-modal</button>
    </div>
  ),
}));

vi.mock('@/features/patient/components/PatientHistoryOverviewSection', () => ({
  PatientHistoryOverviewSection: ({
    weightRecords,
    selectedDateLabel,
    onPreviousDay,
    onNextDay,
  }: {
    weightRecords?: WeightRecord[];
    selectedDateLabel?: string;
    onPreviousDay: () => void;
    onNextDay: () => void;
  }) => (
    <div data-testid="patient-history-overview">
      {weightRecords?.length ?? 0} records - {selectedDateLabel}
      <button onClick={onPreviousDay}>previous-day</button>
      <button onClick={onNextDay}>next-day</button>
    </div>
  ),
}));

import { NutritionistPatientHistoryTab } from './NutritionistPatientHistoryTab';
import { NutritionistPatientObservationsTab } from './NutritionistPatientObservationsTab';
import { NutritionistPatientOverviewTab } from './NutritionistPatientOverviewTab';
import { NutritionistPatientPlanTab } from './NutritionistPatientPlanTab';

const patient: NutritionistPatientProfileResponse = {
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
};

const planView: NutritionPlanViewResponse = {
  mode: 'NUTRITIONIST',
  authorType: 'NUTRITIONIST',
  canEdit: true,
  dailyGoals: {
    targetCalories: 2000,
    targetProtein: 120,
    targetCarbs: 220,
    targetFat: 65,
    targetWaterGlasses: 8,
  },
  sections: [],
  contextSelfManagedPlan: null,
};

const trackingSummary: TodayDashboardSummary = {
  totalCalories: 1800,
  totalProteins: 120,
  totalCarbs: 150,
  totalFats: 50,
  totalWaterMl: 1500,
  currentStreak: 2,
  bestStreak: 5,
};

const historicalMacros = {
  caloriesHistory: [1800],
  caloriesAvg: 1800,
  macrosAvg: {
    protein: 120,
    carbs: 150,
    fat: 50,
  },
};

const logs: MealLogDTO[] = [
  {
    id: 'log-1',
    userId: 'patient-1',
    mealName: 'Breakfast',
    mealType: 'BREAKFAST',
    consumedAt: '2026-05-18T08:00:00Z',
    photoKey: null,
    items: [
      {
        barcode: 'food-1',
        foodName: 'Avena',
        consumedGrams: 100,
        calories: 320,
        proteins: 12,
        carbohydrates: 45,
        fats: 6,
        fiberGrams: 4,
        sodiumMg: 20,
        sugarGrams: 5,
        potassiumMg: 80,
      },
    ],
    totalCalories: 320,
    totalProteins: 12,
    totalCarbs: 45,
    totalFats: 6,
  },
];

const observations: ObservationResponse[] = [
  {
    id: 'obs-1',
    patientId: 'patient-1',
    nutritionistId: 'nutri-1',
    note: 'Increase hydration and keep breakfast consistent.',
    createdAt: '2026-05-18T12:00:00Z',
  },
];

describe('Nutritionist patient file tab components', () => {
  it('renders the overview tab and keeps the edit action wired', async () => {
    const user = userEvent.setup();
    const onOpenEditMetrics = vi.fn();

    render(
      <NutritionistPatientOverviewTab
        patient={patient}
        patientAge={29}
        onOpenEditMetrics={onOpenEditMetrics}
      />
    );

    expect(screen.getByText(/29/)).toBeInTheDocument();
    expect(screen.getByText('1.68 m')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Modify' }));
    expect(onOpenEditMetrics).toHaveBeenCalledTimes(1);
  });

  it('renders the plan tab and preserves retry and create-food callbacks', async () => {
    const user = userEvent.setup();
    const onRetryNutritionPlanLoad = vi.fn().mockResolvedValue(undefined);
    const onSaveNutritionPlan = vi.fn().mockResolvedValue(planView);
    const onOpenCreateLocalFood = vi.fn();

    render(
      <NutritionistPatientPlanTab
        nutritionPlanView={planView}
        isLoadingNutritionPlan={false}
        nutritionPlanLoadError="We could not load the nutrition plan."
        onRetryNutritionPlanLoad={onRetryNutritionPlanLoad}
        onSaveNutritionPlan={onSaveNutritionPlan}
        onOpenCreateLocalFood={onOpenCreateLocalFood}
      />
    );

    expect(screen.getByTestId('nutrition-plan-workspace')).toHaveTextContent('NUTRITIONIST');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await user.click(screen.getByRole('button', { name: 'open-food-modal' }));
    expect(onRetryNutritionPlanLoad).toHaveBeenCalledTimes(1);
    expect(onOpenCreateLocalFood).toHaveBeenCalledWith('Apple');
  });

  it('renders the history tab and keeps date navigation callbacks', async () => {
    const user = userEvent.setup();
    const onPreviousHistoryDate = vi.fn();
    const onNextHistoryDate = vi.fn();

    render(
      <NutritionistPatientHistoryTab
        patientTrackingSummary={trackingSummary}
        isLoadingPatientTrackingSummary={false}
        patientTrackingSummaryError={null}
        weightHistory={[{ weightKg: 64, date: '2026-05-18' }]}
        isLoadingWeightHistory={false}
        isWeightHistoryError={false}
        onRetryWeightHistory={vi.fn()}
        patientHistoricalMacros={historicalMacros}
        isLoadingPatientHistoricalMacros={false}
        patientHistoricalMacrosError={null}
        onRetryHistoricalMacros={vi.fn().mockResolvedValue(undefined)}
        patientDailyTrackingLogs={logs}
        isLoadingPatientDailyTrackingLogs={false}
        patientDailyTrackingLogsError={null}
        historyDateLabel="Today"
        onPreviousHistoryDate={onPreviousHistoryDate}
        onNextHistoryDate={onNextHistoryDate}
        disableNextHistoryDate={true}
        calorieGoal={2000}
      />
    );

    expect(screen.getByTestId('patient-history-overview')).toHaveTextContent('1 records - Today');
    await user.click(screen.getByRole('button', { name: 'previous-day' }));
    await user.click(screen.getByRole('button', { name: 'next-day' }));
    expect(onPreviousHistoryDate).toHaveBeenCalledTimes(1);
    expect(onNextHistoryDate).toHaveBeenCalledTimes(1);
  });

  it('renders the observations tab and preserves edit and delete callbacks', async () => {
    const user = userEvent.setup();
    const onChangeNewNote = vi.fn();
    const onSaveObservation = vi.fn();
    const onEditObservation = vi.fn();
    const onDeleteObservation = vi.fn();

    render(
      <NutritionistPatientObservationsTab
        newNote="Plan note"
        onChangeNewNote={onChangeNewNote}
        isSavingNote={false}
        onSaveObservation={onSaveObservation}
        observations={observations}
        onEditObservation={onEditObservation}
        onDeleteObservation={onDeleteObservation}
        locale="en"
        maxNoteLength={500}
      />
    );

    expect(screen.getByRole('textbox')).toHaveValue('Plan note');
    expect(screen.getByText('Increase hydration and keep breakfast consistent.')).toBeInTheDocument();
    expect(screen.getByText('9/500')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /save observation/i }));
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onSaveObservation).toHaveBeenCalledTimes(1);
    expect(onEditObservation).toHaveBeenCalledWith(observations[0]);
    expect(onDeleteObservation).toHaveBeenCalledWith(observations[0]);
  });
});
