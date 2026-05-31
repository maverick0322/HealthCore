import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { clinicalApi } from '@/features/clinical/services/clinicalService';
import type {
  NutritionPlanViewResponse,
  NutritionistPatientProfileResponse,
  ObservationResponse,
  WeightRecord,
} from '@/features/clinical/types/clinical.types';
import { exportNutritionistPatientFilePdf } from '@/features/nutritionist/services/patientFilePdfService';
import { buildHistoricalMacroRange, summarizeHistoricalMacros } from '@/features/tracking/hooks/useHistoricalMacros';
import { trackingService } from '@/features/tracking/services/trackingService';
import type {
  DailyMacroSummary,
  MealLogDTO,
  TodayDashboardSummary,
} from '@/features/tracking/types/tracking.types';
import { logClientError } from '@/core/utils/logger';

interface PatientFileFeedback {
  type: 'success' | 'error';
  message: string;
}

interface UseNutritionistPatientFilePdfExportOptions {
  patientId: string;
  patient: NutritionistPatientProfileResponse | null;
  activeTab: 'overview' | 'plan' | 'history' | 'observations';
  historyDate: string;
  historyDateLabel: string;
  observations: ObservationResponse[];
  nutritionPlanView: NutritionPlanViewResponse | null;
  loadNutritionPlan: () => Promise<NutritionPlanViewResponse | null>;
  weightHistory: WeightRecord[];
  refetchWeightHistory: () => Promise<{ data?: WeightRecord[] } | unknown>;
  patientTrackingSummary: TodayDashboardSummary | null;
  patientHistoricalMacroLogs: DailyMacroSummary[];
  patientDailyTrackingLogs: MealLogDTO[];
  patientGoalLabel: string;
  patientActivityLabel: string;
  patientDietLabel: string;
  setPageFeedback: Dispatch<SetStateAction<PatientFileFeedback | null>>;
}

const buildPdfLabels = (t: TFunction<'nutritionist' | 'patient'>) => ({
  title: t('patients.file.pdf.title'),
  generatedOn: t('patients.file.pdf.generatedOn'),
  sections: {
    overview: t('patients.file.tabOverview'),
    weightHistory: t('patients.file.tabHistory'),
    calorieTrend: t('history.calorieTrend', { ns: 'patient' }),
    macroBreakdown: t('history.macroBreakdown', { ns: 'patient' }),
    mealTimeline: t('history.mealLog', { ns: 'patient' }),
    nutritionPlan: t('patients.file.tabPlan'),
    observations: t('patients.file.tabObservations'),
  },
  fields: {
    patient: t('patients.file.pdf.patient'),
    age: t('patients.file.age'),
    weight: t('patients.file.weight'),
    height: t('patients.file.height'),
    goal: t('patients.file.objective'),
    activity: t('patients.file.pdf.activity'),
    dietType: t('patients.file.pdf.dietType'),
    allergies: t('patients.file.pdf.allergies'),
    excludedFoods: t('patients.file.pdf.excludedFoods'),
    latestRecord: t('patients.file.pdf.latestRecord'),
    date: t('history.table.date', { ns: 'patient' }),
    change: t('history.table.variation', { ns: 'patient' }),
    mealSlot: t('patients.file.pdf.mealSlot'),
    dishCount: t('patients.file.pdf.dishCount'),
    dailyGoals: t('patients.file.pdf.dailyGoals'),
    currentWeight: t('history.currentWeight', { ns: 'patient' }),
    periodChange: t('history.periodChange', { ns: 'patient' }),
    caloriesAverage: t('history.calorieAvg', { ns: 'patient' }),
    calorieGoal: t('history.calorieGoal', { ns: 'patient' }),
    protein: t('history.protein', { ns: 'patient' }),
    carbs: t('history.carbs', { ns: 'patient' }),
    fat: t('history.fat', { ns: 'patient' }),
    mealType: t('history.pdf.mealType', { ns: 'patient' }),
    time: t('history.pdf.time', { ns: 'patient' }),
    foods: t('history.pdf.foods', { ns: 'patient' }),
    calories: t('history.calories', { ns: 'patient' }),
    selectedDate: t('history.date', { ns: 'patient' }),
    streak: t('history.streak', { ns: 'patient' }),
    bestStreak: t('history.bestStreak', { ns: 'patient' }),
  },
  empty: {
    weightHistory: t('patients.file.pdf.noWeightHistory'),
    observations: t('patients.file.noObservations'),
    nutritionPlan: t('patients.file.pdf.noNutritionPlan'),
    none: t('patients.file.pdf.none'),
    tracking: t('history.pdf.noTrackingData', { ns: 'patient' }),
    mealTimeline: t('history.todayLogsEmpty', { ns: 'patient' }),
    noFoods: t('history.pdf.noFoods', { ns: 'patient' }),
  },
  mealSlots: {
    BREAKFAST: t('nutritionPlan.mealSlots.BREAKFAST'),
    LUNCH: t('nutritionPlan.mealSlots.LUNCH'),
    DINNER: t('nutritionPlan.mealSlots.DINNER'),
    SNACK: t('nutritionPlan.mealSlots.SNACK'),
  },
});

export const useNutritionistPatientFilePdfExport = ({
  patientId,
  patient,
  activeTab,
  historyDate,
  historyDateLabel,
  observations,
  nutritionPlanView,
  loadNutritionPlan,
  weightHistory,
  refetchWeightHistory,
  patientTrackingSummary,
  patientHistoricalMacroLogs,
  patientDailyTrackingLogs,
  patientGoalLabel,
  patientActivityLabel,
  patientDietLabel,
  setPageFeedback,
}: UseNutritionistPatientFilePdfExportOptions) => {
  const { t, i18n } = useTranslation(['nutritionist', 'patient']);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPatientFilePdf = async () => {
    if (!patient) {
      return;
    }

    setIsExportingPdf(true);
    setPageFeedback(null);

    try {
      const resolvedPlan = nutritionPlanView ?? (await loadNutritionPlan());
      const weightHistoryResult = activeTab === 'history'
        ? await refetchWeightHistory()
        : null;
      const resolvedWeightHistory =
        activeTab === 'history'
          ? ((weightHistoryResult as { data?: WeightRecord[] } | null)?.data ?? weightHistory)
          : await clinicalApi.getNutritionistPatientWeightHistory(patientId);
      const { startDate, endDate, last7Days } = buildHistoricalMacroRange();
      const resolvedTrackingSummary =
        patientTrackingSummary ?? await trackingService.getNutritionistPatientTodaySummary(patientId);
      const resolvedHistoricalMacroLogs =
        patientHistoricalMacroLogs.length > 0
          ? patientHistoricalMacroLogs
          : await trackingService.getNutritionistPatientHistoricalMacros(patientId, startDate, endDate);
      const resolvedHistoricalMacros = summarizeHistoricalMacros(
        resolvedHistoricalMacroLogs,
        last7Days
      );
      const resolvedDailyTrackingLogs =
        activeTab === 'history' && patientDailyTrackingLogs.length > 0
          ? patientDailyTrackingLogs
          : await trackingService.getNutritionistPatientDailyLogs(patientId, historyDate);
      const sanitizedPatientName = (patient.fullName ?? patient.userId)
        .replace(/[^\w-]+/g, '-')
        .toLowerCase();

      await exportNutritionistPatientFilePdf({
        patient,
        nutritionPlan: resolvedPlan,
        observations,
        weightHistory: resolvedWeightHistory,
        trackingSummary: resolvedTrackingSummary,
        historicalMacros: {
          caloriesHistory: resolvedHistoricalMacros.caloriesHistory,
          caloriesAvg: resolvedHistoricalMacros.caloriesAvg,
          calorieGoal: resolvedPlan?.dailyGoals.targetCalories ?? null,
          macrosAvg: resolvedHistoricalMacros.macrosAvg,
        },
        dailyTrackingLogs: resolvedDailyTrackingLogs,
        selectedTrackingDateLabel: historyDateLabel,
        locale: i18n.resolvedLanguage?.startsWith('en') ? 'en-US' : 'es-MX',
        goalLabel: patientGoalLabel,
        activityLabel: patientActivityLabel,
        dietLabel: patientDietLabel,
        fileName: `expediente-${sanitizedPatientName}.pdf`,
        labels: buildPdfLabels(t),
      });
    } catch (error) {
      logClientError('NutritionistPatientFilePage.pdf.export.error', error, { patientId });
      setPageFeedback({
        type: 'error',
        message: t('patients.file.pdf.error'),
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  return {
    isExportingPdf,
    handleExportPatientFilePdf,
  };
};
