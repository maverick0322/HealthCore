import { useTranslation } from 'react-i18next';

import type { WeightRecord } from '@/features/clinical/types/clinical.types';
import { PatientHistoryOverviewSection } from '@/features/patient/components/PatientHistoryOverviewSection';
import type { MealLogDTO, TodayDashboardSummary } from '@/features/tracking/types/tracking.types';

interface HistoricalMacrosViewModel {
  caloriesHistory: number[];
  caloriesAvg: number;
  macrosAvg: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface NutritionistPatientHistoryTabProps {
  patientTrackingSummary: TodayDashboardSummary | null;
  isLoadingPatientTrackingSummary: boolean;
  patientTrackingSummaryError: string | null;
  weightHistory: WeightRecord[];
  isLoadingWeightHistory: boolean;
  isWeightHistoryError: boolean;
  onRetryWeightHistory: () => void;
  patientHistoricalMacros: HistoricalMacrosViewModel;
  isLoadingPatientHistoricalMacros: boolean;
  patientHistoricalMacrosError: string | null;
  onRetryHistoricalMacros: () => Promise<void>;
  patientDailyTrackingLogs: MealLogDTO[];
  isLoadingPatientDailyTrackingLogs: boolean;
  patientDailyTrackingLogsError: string | null;
  historyDateLabel: string;
  onPreviousHistoryDate: () => void;
  onNextHistoryDate: () => void;
  disableNextHistoryDate: boolean;
  calorieGoal: number | null;
}

export const NutritionistPatientHistoryTab = ({
  patientTrackingSummary,
  isLoadingPatientTrackingSummary,
  patientTrackingSummaryError,
  weightHistory,
  isLoadingWeightHistory,
  isWeightHistoryError,
  onRetryWeightHistory,
  patientHistoricalMacros,
  isLoadingPatientHistoricalMacros,
  patientHistoricalMacrosError,
  onRetryHistoricalMacros,
  patientDailyTrackingLogs,
  isLoadingPatientDailyTrackingLogs,
  patientDailyTrackingLogsError,
  historyDateLabel,
  onPreviousHistoryDate,
  onNextHistoryDate,
  disableNextHistoryDate,
  calorieGoal,
}: NutritionistPatientHistoryTabProps) => {
  const { t } = useTranslation(['nutritionist', 'patient']);

  return (
    <PatientHistoryOverviewSection
      streakSummary={{
        currentStreak: patientTrackingSummary?.currentStreak ?? 0,
        bestStreak: patientTrackingSummary?.bestStreak ?? 0,
        isLoading: isLoadingPatientTrackingSummary,
        error: patientTrackingSummaryError,
      }}
      weightRecords={weightHistory}
      isWeightLoading={isLoadingWeightHistory}
      isWeightError={isWeightHistoryError}
      onRetryWeight={onRetryWeightHistory}
      readOnlyWeightHistory
      historicalMacros={{
        caloriesHistory: patientHistoricalMacros.caloriesHistory,
        caloriesAvg: patientHistoricalMacros.caloriesAvg,
        macrosAvg: patientHistoricalMacros.macrosAvg,
        calorieGoal,
        isLoading: isLoadingPatientHistoricalMacros,
        error: patientHistoricalMacrosError,
      }}
      onRetryHistoricalMacros={onRetryHistoricalMacros}
      logs={patientDailyTrackingLogs}
      isLogsLoading={isLoadingPatientDailyTrackingLogs}
      logsError={patientDailyTrackingLogsError}
      selectedDateLabel={historyDateLabel}
      onPreviousDay={onPreviousHistoryDate}
      onNextDay={onNextHistoryDate}
      disableNextDay={disableNextHistoryDate}
      showTrackingInsights
      showMealTimeline
      showLogRegistrationCard={false}
      emptyLogsMessage={t('history.todayLogsEmpty', { ns: 'patient' })}
    />
  );
};
