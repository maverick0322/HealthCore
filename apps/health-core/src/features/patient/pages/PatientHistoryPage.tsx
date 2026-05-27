import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FileDown, Loader2 } from "lucide-react";

import { clinicalApi } from "@/features/clinical/services/clinicalService";
import { SettingsBar } from "@/shared/components/SettingsBar";
import { PatientNav } from "@/features/patient/components/PatientNav";
import { Button } from "@/shared/ui/button";
import { PatientHistoryOverviewSection } from "@/features/patient/components/PatientHistoryOverviewSection";
import { useDailyLogs } from "@/features/tracking/hooks/useDailyLogs";
import { useHistoricalMacros } from "@/features/tracking/hooks/useHistoricalMacros";
import { useHealthGoals } from "@/features/patient/hooks/useHealthGoals";
import { exportPatientHistoryPdf } from "@/features/patient/services/patientHistoryPdfService";
import { logClientError } from "@/core/utils/logger";
import { useTodaySummary } from "@/features/tracking/hooks/useTodaySummary";

export const PatientHistoryPage = () => {
  const { t, i18n } = useTranslation("patient");
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const {
    caloriesHistory,
    caloriesAvg,
    macrosAvg,
    isLoading: isHistoryLoading,
    error: historicalMacrosError,
    refetch: refetchHistoricalMacros,
  } = useHistoricalMacros();
  const { data: healthGoals } = useHealthGoals();
  const { summary: todaySummary, isLoading: isLoadingTodaySummary, error: todaySummaryError } = useTodaySummary();
  const { logs, isLoading: isTimelineLoading, error: timelineError } = useDailyLogs(selectedDate);

  const changeDate = (offsetDays: number) => {
    const nextDate = new Date(`${selectedDate}T12:00:00`);
    nextDate.setDate(nextDate.getDate() + offsetDays);
    setSelectedDate(nextDate.toISOString().split("T")[0]);
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    setExportError(null);

    try {
      const weightHistory = await clinicalApi.getWeightHistory();
      await exportPatientHistoryPdf({
        fileName: `historial-nutricional-${selectedDate}.pdf`,
        locale: i18n.resolvedLanguage?.startsWith("en") ? "en-US" : "es-MX",
        title: t("history.title"),
        generatedOnLabel: t("history.pdf.generatedOn"),
        sections: {
          weightHistory: t("history.weightProgressTitle"),
          calorieTrend: t("history.calorieTrend"),
          macroBreakdown: t("history.macroBreakdown"),
          mealTimeline: t("history.mealLog"),
        },
        fields: {
          currentWeight: t("history.currentWeight"),
          periodChange: t("history.periodChange"),
          latestRecord: t("history.latestRecord"),
          caloriesAverage: t("history.calorieAvg"),
          calorieGoal: t("history.calorieGoal"),
          protein: t("history.protein"),
          carbs: t("history.carbs"),
          fat: t("history.fat"),
          selectedDate: t("history.date"),
          date: t("history.table.date"),
          weight: t("history.table.weight"),
          variation: t("history.table.variation"),
          mealType: t("history.pdf.mealType"),
          time: t("history.pdf.time"),
          foods: t("history.pdf.foods"),
          calories: t("history.calories"),
        },
        empty: {
          weightHistory: t("history.noWeightEntries"),
          tracking: t("history.pdf.noTrackingData"),
          mealTimeline: t("history.todayLogsEmpty"),
          noFoods: t("history.pdf.noFoods"),
        },
        mealTypeLabels: {
          BREAKFAST: t("nutritionPlan.mealSlots.BREAKFAST"),
          LUNCH: t("nutritionPlan.mealSlots.LUNCH"),
          DINNER: t("nutritionPlan.mealSlots.DINNER"),
          SNACK: t("nutritionPlan.mealSlots.SNACK"),
        },
        selectedDateLabel: selectedDate === todayStr ? t("history.today") : selectedDate,
        weightHistory,
        caloriesHistory,
        caloriesAvg,
        calorieGoal: healthGoals?.targetCalories ?? null,
        macrosAvg,
        logs,
      });
    } catch (error) {
      logClientError("PatientHistoryPage.pdf.export.error", error, { selectedDate });
      setExportError(t("history.pdf.error"));
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans transition-colors duration-500 ease-in-out">
      <PatientNav />

      <div className="md:pl-56">
        <SettingsBar />
      </div>

      <div className="relative overflow-hidden border-b border-border bg-primary/10 md:pl-56">
        <div
          aria-hidden
          className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-primary/20 blur-3xl pointer-events-none"
        />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-4 px-4 pb-6 pt-20 sm:px-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              {t("history.title", "Historial Nutricional")}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t("history.subtitle", "Tu evolución y registros detallados")}
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            disabled={isExportingPdf}
            onClick={() => {
              void handleExportPdf();
            }}
          >
            {isExportingPdf ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
            {isExportingPdf ? t("history.exportingPdf") : t("history.downloadPdf")}
          </Button>
        </div>
      </div>

      <main className="animate-in slide-in-from-bottom-2 fade-in mx-auto flex-1 w-full max-w-7xl space-y-5 px-4 py-6 pb-20 duration-500 sm:px-6 md:pl-56 md:pb-8">
        {exportError ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {exportError}
          </div>
        ) : null}

        <PatientHistoryOverviewSection
          streakSummary={{
            currentStreak: todaySummary?.currentStreak ?? 0,
            bestStreak: todaySummary?.bestStreak ?? 0,
            isLoading: isLoadingTodaySummary,
            error: todaySummaryError,
          }}
          historicalMacros={{
            caloriesHistory,
            caloriesAvg,
            macrosAvg,
            calorieGoal: healthGoals?.targetCalories ?? null,
            isLoading: isHistoryLoading,
            error: historicalMacrosError,
          }}
          onRetryHistoricalMacros={() => {
            void refetchHistoricalMacros();
          }}
          logs={logs}
          isLogsLoading={isTimelineLoading}
          logsError={timelineError}
          selectedDateLabel={selectedDate === todayStr ? t("history.today", "Hoy") : selectedDate}
          onPreviousDay={() => changeDate(-1)}
          onNextDay={() => changeDate(1)}
          disableNextDay={selectedDate === todayStr}
          showTrackingInsights
          showMealTimeline
        />
      </main>
    </div>
  );
};
