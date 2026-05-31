import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { trackingService } from '@/features/tracking/services/trackingService';
import type {
  DailyMacroSummary,
  MealLogDTO,
  TodayDashboardSummary,
} from '@/features/tracking/types/tracking.types';
import {
  buildHistoricalMacroRange,
  summarizeHistoricalMacros,
} from '@/features/tracking/hooks/useHistoricalMacros';

type PatientFileTab = 'overview' | 'plan' | 'history' | 'observations';

interface UseNutritionistPatientTrackingDataOptions {
  patientId: string;
  activeTab: PatientFileTab;
}

export const useNutritionistPatientTrackingData = ({
  patientId,
  activeTab,
}: UseNutritionistPatientTrackingDataOptions) => {
  const { t } = useTranslation(['nutritionist', 'patient']);
  const todayIso = new Date().toISOString().split('T')[0];
  const [historyDate, setHistoryDate] = useState(todayIso);
  const [patientTrackingSummary, setPatientTrackingSummary] =
    useState<TodayDashboardSummary | null>(null);
  const [isLoadingPatientTrackingSummary, setIsLoadingPatientTrackingSummary] = useState(false);
  const [patientTrackingSummaryError, setPatientTrackingSummaryError] = useState<string | null>(
    null
  );
  const [patientHistoricalMacroLogs, setPatientHistoricalMacroLogs] = useState<DailyMacroSummary[]>(
    []
  );
  const [isLoadingPatientHistoricalMacros, setIsLoadingPatientHistoricalMacros] = useState(false);
  const [patientHistoricalMacrosError, setPatientHistoricalMacrosError] = useState<string | null>(
    null
  );
  const [patientDailyTrackingLogs, setPatientDailyTrackingLogs] = useState<MealLogDTO[]>([]);
  const [isLoadingPatientDailyTrackingLogs, setIsLoadingPatientDailyTrackingLogs] = useState(false);
  const [patientDailyTrackingLogsError, setPatientDailyTrackingLogsError] = useState<string | null>(
    null
  );

  const { startDate, endDate, last7Days } = useMemo(() => buildHistoricalMacroRange(), []);

  const patientHistoricalMacros = useMemo(
    () => summarizeHistoricalMacros(patientHistoricalMacroLogs, last7Days),
    [last7Days, patientHistoricalMacroLogs]
  );

  const historyDateLabel = historyDate === todayIso ? t('history.today', { ns: 'patient' }) : historyDate;

  const loadTrackingSummary = async () => {
    try {
      setIsLoadingPatientTrackingSummary(true);
      setPatientTrackingSummaryError(null);
      const summary = await trackingService.getNutritionistPatientTodaySummary(patientId);
      setPatientTrackingSummary(summary);
    } catch (error: any) {
      setPatientTrackingSummary(null);
      setPatientTrackingSummaryError(
        error?.response?.data?.message ?? t('history.weightErrorMessage', { ns: 'patient' })
      );
    } finally {
      setIsLoadingPatientTrackingSummary(false);
    }
  };

  const loadHistoricalMacros = async () => {
    try {
      setIsLoadingPatientHistoricalMacros(true);
      setPatientHistoricalMacrosError(null);
      const response = await trackingService.getNutritionistPatientHistoricalMacros(
        patientId,
        startDate,
        endDate
      );
      setPatientHistoricalMacroLogs(response);
    } catch (error: any) {
      setPatientHistoricalMacroLogs([]);
      setPatientHistoricalMacrosError(
        error?.response?.data?.message ?? t('history.pdf.noTrackingData', { ns: 'patient' })
      );
    } finally {
      setIsLoadingPatientHistoricalMacros(false);
    }
  };

  const loadDailyTrackingLogs = async () => {
    try {
      setIsLoadingPatientDailyTrackingLogs(true);
      setPatientDailyTrackingLogsError(null);
      const response = await trackingService.getNutritionistPatientDailyLogs(patientId, historyDate);
      setPatientDailyTrackingLogs(response ?? []);
    } catch (error: any) {
      setPatientDailyTrackingLogs([]);
      setPatientDailyTrackingLogsError(
        error?.response?.data?.message ?? t('history.todayLogsEmpty', { ns: 'patient' })
      );
    } finally {
      setIsLoadingPatientDailyTrackingLogs(false);
    }
  };

  const goToPreviousHistoryDate = () => {
    const nextDate = new Date(`${historyDate}T12:00:00`);
    nextDate.setDate(nextDate.getDate() - 1);
    setHistoryDate(nextDate.toISOString().split('T')[0]);
  };

  const goToNextHistoryDate = () => {
    const nextDate = new Date(`${historyDate}T12:00:00`);
    nextDate.setDate(nextDate.getDate() + 1);
    setHistoryDate(nextDate.toISOString().split('T')[0]);
  };

  useEffect(() => {
    if (!patientId || activeTab !== 'history') {
      return;
    }

    void Promise.all([loadTrackingSummary(), loadHistoricalMacros()]);
  }, [activeTab, patientId, t]);

  useEffect(() => {
    if (!patientId || activeTab !== 'history') {
      return;
    }

    void loadDailyTrackingLogs();
  }, [activeTab, historyDate, patientId, t]);

  return {
    todayIso,
    historyDate,
    historyDateLabel,
    patientTrackingSummary,
    isLoadingPatientTrackingSummary,
    patientTrackingSummaryError,
    patientHistoricalMacroLogs,
    patientHistoricalMacros,
    isLoadingPatientHistoricalMacros,
    patientHistoricalMacrosError,
    patientDailyTrackingLogs,
    isLoadingPatientDailyTrackingLogs,
    patientDailyTrackingLogsError,
    loadHistoricalMacros,
    goToPreviousHistoryDate,
    goToNextHistoryDate,
    disableNextHistoryDate: historyDate === todayIso,
  };
};
