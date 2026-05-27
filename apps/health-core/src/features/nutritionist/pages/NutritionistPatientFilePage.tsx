import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCallback } from "react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  User,
  Ruler,
  Weight,
  Flame,
  UtensilsCrossed,
  CalendarDays,
  FileText,
  CheckCircle2,
  Loader2,
  UserMinus,
  AlertCircle,
  FileDown,
  Pencil,
  SquarePen,
  Trash2,
} from "lucide-react";

import { NutritionistNav } from "@/features/nutritionist/components/NutritionistNav";
import { SettingsBar } from "@/shared/components/SettingsBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { ProfileAvatar } from "@/shared/components/ProfileAvatar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  clinicalApi,
  createObservation,
  deleteObservation,
  getPatientObservations,
  updateObservation,
} from "../../clinical/services/clinicalService";
import type {
  ObservationResponse,
  NutritionistPatientProfileResponse,
  NutritionPlanViewResponse,
} from "../../clinical/types/clinical.types";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { LoadingSpinner } from "@/shared/ui/LoadingSpinner";
import { NutritionPlanWorkspace } from "@/features/nutrition-plan/components/NutritionPlanWorkspace";
import { logClientError, logClientInfo } from "@/core/utils/logger";
import { getNutritionistUnlinkErrorMessage } from "@/features/clinical/utils/linkingErrorMessages";
import { formatPatientGoalLabel } from "@/features/onboarding/utils/profilePresentation";
import { PatientHistoryOverviewSection } from "@/features/patient/components/PatientHistoryOverviewSection";
import { exportNutritionistPatientFilePdf } from "@/features/nutritionist/services/patientFilePdfService";
import { useNutritionistPatientWeightHistory } from "@/features/nutritionist/hooks/useNutritionistPatientWeightHistory";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { trackingService } from "@/features/tracking/services/trackingService";
import type { DailyMacroSummary, MealLogDTO, TodayDashboardSummary } from "@/features/tracking/types/tracking.types";
import { buildHistoricalMacroRange, summarizeHistoricalMacros } from "@/features/tracking/hooks/useHistoricalMacros";

const OBSERVATION_NOTE_MAX_LENGTH = 500;
const WEIGHT_INPUT_MAX_LENGTH = 5;
const HEIGHT_INPUT_MAX_LENGTH = 3;

const getDisplayIdentity = (userId: string): string => {
  const normalized = userId.trim();
  return normalized || "Paciente";
};

const getAgeFromBirthDate = (birthDate: string): number | null => {
  if (!birthDate) {
    return null;
  }

  const today = new Date();
  const parsedBirthDate = new Date(birthDate);
  if (Number.isNaN(parsedBirthDate.getTime())) {
    return null;
  }

  let age = today.getFullYear() - parsedBirthDate.getFullYear();
  const monthDiff = today.getMonth() - parsedBirthDate.getMonth();
  const dayDiff = today.getDate() - parsedBirthDate.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age;
};

const formatHeightInMeters = (heightCm: number): string => {
  return `${(heightCm / 100).toFixed(2)} m`;
};

const calculateBmi = (weightKg: number, heightCm: number): string => {
  return (weightKg / Math.pow(heightCm / 100, 2)).toFixed(1);
};

const formatObservationDateTime = (value: string, locale: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const NutritionistPatientFilePage = () => {
  const { id: patientIdParam } = useParams<{ id: string }>();
  const patientId = useMemo(
    () => (patientIdParam ? decodeURIComponent(patientIdParam) : ""),
    [patientIdParam]
  );
  const [patient, setPatient] = useState<NutritionistPatientProfileResponse | null>(null);
  const [isLoadingPatient, setIsLoadingPatient] = useState(true);
  const [patientLoadError, setPatientLoadError] = useState<string | null>(null);
  const [observations, setObservations] = useState<ObservationResponse[]>([]);
  const [nutritionPlanView, setNutritionPlanView] = useState<NutritionPlanViewResponse | null>(null);
  const [isLoadingNutritionPlan, setIsLoadingNutritionPlan] = useState(false);
  const [nutritionPlanLoadError, setNutritionPlanLoadError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [editingObservation, setEditingObservation] = useState<ObservationResponse | null>(null);
  const [editingObservationNote, setEditingObservationNote] = useState("");
  const [isUpdatingObservation, setIsUpdatingObservation] = useState(false);
  const [observationToDelete, setObservationToDelete] = useState<ObservationResponse | null>(null);
  const [isDeletingObservation, setIsDeletingObservation] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [editMetricsOpen, setEditMetricsOpen] = useState(false);
  const [confirmEditMetricsOpen, setConfirmEditMetricsOpen] = useState(false);
  const [metricsWeightInput, setMetricsWeightInput] = useState("");
  const [metricsHeightInput, setMetricsHeightInput] = useState("");
  const [metricsErrors, setMetricsErrors] = useState<{ weightKg?: string; heightCm?: string }>({});
  const [isUpdatingMetrics, setIsUpdatingMetrics] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(["nutritionist", "onboarding", "patient"]);

  const [activeTab, setActiveTab] = useState<"overview" | "plan" | "history" | "observations">("overview");
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [pageFeedback, setPageFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const todayIso = new Date().toISOString().split("T")[0];
  const [historyDate, setHistoryDate] = useState(todayIso);
  const [patientTrackingSummary, setPatientTrackingSummary] = useState<TodayDashboardSummary | null>(null);
  const [isLoadingPatientTrackingSummary, setIsLoadingPatientTrackingSummary] = useState(false);
  const [patientTrackingSummaryError, setPatientTrackingSummaryError] = useState<string | null>(null);
  const [patientHistoricalMacroLogs, setPatientHistoricalMacroLogs] = useState<DailyMacroSummary[]>([]);
  const [isLoadingPatientHistoricalMacros, setIsLoadingPatientHistoricalMacros] = useState(false);
  const [patientHistoricalMacrosError, setPatientHistoricalMacrosError] = useState<string | null>(null);
  const [patientDailyTrackingLogs, setPatientDailyTrackingLogs] = useState<MealLogDTO[]>([]);
  const [isLoadingPatientDailyTrackingLogs, setIsLoadingPatientDailyTrackingLogs] = useState(false);
  const [patientDailyTrackingLogsError, setPatientDailyTrackingLogsError] = useState<string | null>(null);
  const hasHydratedOverviewRef = useRef(false);
  const {
    data: weightHistory,
    isLoading: isLoadingWeightHistory,
    isError: isWeightHistoryError,
    refetch: refetchWeightHistory,
  } = useNutritionistPatientWeightHistory(patientId, { enabled: activeTab === "history" });

  const loadPatient = useCallback(
    async ({ showLoading = true }: { showLoading?: boolean } = {}) => {
      if (!patientId) {
        setPatientLoadError(t("patients.file.error"));
        setIsLoadingPatient(false);
        return null;
      }

      try {
        if (showLoading) {
          setIsLoadingPatient(true);
        }
        setPatientLoadError(null);
        logClientInfo("NutritionistPatientFilePage.patient.load.start", { patientId });
        const response = await clinicalApi.getNutritionistPatientProfile(patientId);
        setPatient(response);
        logClientInfo("NutritionistPatientFilePage.patient.load.success", {
          patientId,
          patientUserId: response.userId,
        });
        return response;
      } catch (error) {
        logClientError("NutritionistPatientFilePage.patient.load.error", error, { patientId });
        setPatientLoadError(t("patients.file.error"));
        return null;
      } finally {
        if (showLoading) {
          setIsLoadingPatient(false);
        }
      }
    },
    [patientId, t]
  );

  useEffect(() => {
    void loadPatient();
  }, [loadPatient]);

  useEffect(() => {
    if (!patientId) {
      return;
    }

    void loadObservations();
  }, [patientId]);

  useEffect(() => {
    if (!patientId || activeTab !== "plan") {
      return;
    }

    void loadNutritionPlan();
  }, [activeTab, patientId]);

  useEffect(() => {
    if (!patientId || activeTab !== "history") {
      return;
    }

    const { startDate, endDate } = buildHistoricalMacroRange();

    const loadTrackingSummary = async () => {
      try {
        setIsLoadingPatientTrackingSummary(true);
        setPatientTrackingSummaryError(null);
        const summary = await trackingService.getNutritionistPatientTodaySummary(patientId);
        setPatientTrackingSummary(summary);
      } catch (error: any) {
        setPatientTrackingSummary(null);
        setPatientTrackingSummaryError(
          error?.response?.data?.message ?? t("history.weightErrorMessage", { ns: "patient" })
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
          error?.response?.data?.message ?? t("history.pdf.noTrackingData", { ns: "patient" })
        );
      } finally {
        setIsLoadingPatientHistoricalMacros(false);
      }
    };

    void Promise.all([loadTrackingSummary(), loadHistoricalMacros()]);
  }, [activeTab, patientId, t]);

  useEffect(() => {
    if (!patientId || activeTab !== "history") {
      return;
    }

    const loadDailyTrackingLogs = async () => {
      try {
        setIsLoadingPatientDailyTrackingLogs(true);
        setPatientDailyTrackingLogsError(null);
        const response = await trackingService.getNutritionistPatientDailyLogs(patientId, historyDate);
        setPatientDailyTrackingLogs(response ?? []);
      } catch (error: any) {
        setPatientDailyTrackingLogs([]);
        setPatientDailyTrackingLogsError(
          error?.response?.data?.message ?? t("history.todayLogsEmpty", { ns: "patient" })
        );
      } finally {
        setIsLoadingPatientDailyTrackingLogs(false);
      }
    };

    void loadDailyTrackingLogs();
  }, [activeTab, historyDate, patientId, t]);

  useEffect(() => {
    hasHydratedOverviewRef.current = false;
  }, [patientId]);

  useEffect(() => {
    if (!patientId || activeTab !== "overview") {
      return;
    }

    if (!hasHydratedOverviewRef.current) {
      hasHydratedOverviewRef.current = true;
      return;
    }

    void loadPatient({ showLoading: false });
  }, [activeTab, loadPatient, patientId]);

  useEffect(() => {
    const handleWindowRefresh = () => {
      if (document.visibilityState !== "visible" || !patientId) {
        return;
      }

      void loadPatient({ showLoading: false });

      if (activeTab === "history") {
        void refetchWeightHistory();
      }

      if (activeTab === "plan") {
        void loadNutritionPlan();
      }
    };

    window.addEventListener("focus", handleWindowRefresh);
    document.addEventListener("visibilitychange", handleWindowRefresh);

    return () => {
      window.removeEventListener("focus", handleWindowRefresh);
      document.removeEventListener("visibilitychange", handleWindowRefresh);
    };
  }, [activeTab, loadPatient, patientId, refetchWeightHistory]);

  const loadNutritionPlan = async () => {
    if (!patientId) {
      return null;
    }

    try {
      setIsLoadingNutritionPlan(true);
      setNutritionPlanLoadError(null);
      logClientInfo("NutritionistPatientFilePage.plan.load.start", { patientId });
      const response = await clinicalApi.getNutritionistPatientNutritionPlan(patientId);
      setNutritionPlanView(response);
      logClientInfo("NutritionistPatientFilePage.plan.load.success", {
        patientId,
        mode: response.mode,
        canEdit: response.canEdit,
        sections: response.sections.length,
      });
      return response;
    } catch (error) {
      logClientError("NutritionistPatientFilePage.plan.load.error", error, { patientId });
      setNutritionPlanView(null);
      setNutritionPlanLoadError(t("nutritionPlan.loadError"));
      return null;
    } finally {
      setIsLoadingNutritionPlan(false);
    }
  };

  const loadObservations = async () => {
    try {
      const data = await getPatientObservations(patientId);
      setObservations(data);
    } catch (error) {
      logClientError("NutritionistPatientFilePage.observations.load.error", error, { patientId });
    }
  };

  const confirmUnlinkPatient = async () => {
    if (!patientId) {
      return;
    }

    setIsUnlinking(true);
    setPageFeedback(null);
    try {
      await clinicalApi.unlinkNutritionist(patientId);
      navigate("/patients/nutritionist");
    } catch (error) {
      logClientError("NutritionistPatientFilePage.unlink.error", error, { patientId });
      setPageFeedback({
        type: "error",
        message: getNutritionistUnlinkErrorMessage(error, t),
      });
      setIsUnlinking(false);
      setShowUnlinkModal(false);
    }
  };

  const handleSaveObservation = async () => {
    if (!newNote.trim() || !patientId) {
      return;
    }

    setIsSavingNote(true);
    try {
      await createObservation({ patientId, note: newNote.trim() });
      setNewNote("");
      await loadObservations();
    } catch (error) {
      logClientError("NutritionistPatientFilePage.observation.save.error", error, { patientId });
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleStartEditObservation = (observation: ObservationResponse) => {
    setEditingObservation(observation);
    setEditingObservationNote(observation.note);
  };

  const handleUpdateObservation = async () => {
    if (!editingObservation || !editingObservationNote.trim()) {
      return;
    }

    setIsUpdatingObservation(true);
    try {
      await updateObservation(editingObservation.id, { note: editingObservationNote.trim() });
      setEditingObservation(null);
      setEditingObservationNote("");
      await loadObservations();
    } catch (error) {
      logClientError("NutritionistPatientFilePage.observation.update.error", error, {
        patientId,
        observationId: editingObservation.id,
      });
      setPageFeedback({
        type: "error",
        message: t("patients.file.observationUpdateError"),
      });
    } finally {
      setIsUpdatingObservation(false);
    }
  };

  const handleDeleteObservation = async () => {
    if (!observationToDelete) {
      return;
    }

    setIsDeletingObservation(true);
    try {
      await deleteObservation(observationToDelete.id);
      setObservationToDelete(null);
      await loadObservations();
    } catch (error) {
      logClientError("NutritionistPatientFilePage.observation.delete.error", error, {
        patientId,
        observationId: observationToDelete.id,
      });
      setPageFeedback({
        type: "error",
        message: t("patients.file.observationDeleteError"),
      });
    } finally {
      setIsDeletingObservation(false);
    }
  };

  const patientIdentity = patient ? patient.fullName?.trim() || getDisplayIdentity(patient.userId) : "";
  const patientAge = patient ? getAgeFromBirthDate(patient.birthDate) : null;
  const patientGoalLabel = patient ? formatPatientGoalLabel(t, patient.goal) : "--";
  const patientActivityLabel = patient
    ? t(`onboarding:options.activityLevels.${patient.activityLevel}.label`)
    : "--";
  const patientDietLabel = patient
    ? t(`onboarding:options.diets.${patient.dietType}.label`)
    : "--";
  const { last7Days } = useMemo(() => buildHistoricalMacroRange(), []);
  const patientHistoricalMacros = useMemo(
    () => summarizeHistoricalMacros(patientHistoricalMacroLogs, last7Days),
    [last7Days, patientHistoricalMacroLogs]
  );
  const historyDateLabel = historyDate === todayIso ? t("history.today", { ns: "patient" }) : historyDate;

  const resetMetricsDialog = () => {
    setEditMetricsOpen(false);
    setConfirmEditMetricsOpen(false);
    setMetricsErrors({});
    setMetricsWeightInput(patient?.weightKg?.toFixed(1) ?? "");
    setMetricsHeightInput(patient?.heightCm?.toFixed(0) ?? "");
  };

  const openEditMetricsDialog = () => {
    setMetricsWeightInput(patient?.weightKg?.toFixed(1) ?? "");
    setMetricsHeightInput(patient?.heightCm?.toFixed(0) ?? "");
    setMetricsErrors({});
    setConfirmEditMetricsOpen(false);
    setEditMetricsOpen(true);
  };

  const validateMetrics = () => {
    const nextErrors: { weightKg?: string; heightCm?: string } = {};
    const normalizedWeight = metricsWeightInput.trim();
    const normalizedHeight = metricsHeightInput.trim();

    if (!normalizedWeight) {
      nextErrors.weightKg = t("patients.file.metrics.validation.weightRequired");
    } else if (!/^\d{1,3}(?:\.\d)?$/.test(normalizedWeight)) {
      nextErrors.weightKg = t("patients.file.metrics.validation.weightInvalid");
    } else {
      const parsedWeight = Number(normalizedWeight);
      if (Number.isNaN(parsedWeight) || parsedWeight < 40 || parsedWeight > 200) {
        nextErrors.weightKg = t("patients.file.metrics.validation.weightRange");
      }
    }

    if (!normalizedHeight) {
      nextErrors.heightCm = t("patients.file.metrics.validation.heightRequired");
    } else if (!/^\d{3}$/.test(normalizedHeight)) {
      nextErrors.heightCm = t("patients.file.metrics.validation.heightInvalid");
    } else {
      const parsedHeight = Number(normalizedHeight);
      if (Number.isNaN(parsedHeight) || parsedHeight < 100 || parsedHeight > 250) {
        nextErrors.heightCm = t("patients.file.metrics.validation.heightRange");
      }
    }

    setMetricsErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleReviewMetricsUpdate = () => {
    if (!validateMetrics()) {
      return;
    }

    setEditMetricsOpen(false);
    setConfirmEditMetricsOpen(true);
  };

  const handleConfirmMetricsUpdate = async () => {
    if (!patientId) {
      return;
    }

    setIsUpdatingMetrics(true);
    setPageFeedback(null);
    try {
      const updatedPatient = await clinicalApi.updateNutritionistPatientMetrics(patientId, {
        weightKg: Number(metricsWeightInput),
        heightCm: Number(metricsHeightInput),
      });
      setPatient(updatedPatient);
      await refetchWeightHistory();
      if (nutritionPlanView) {
        await loadNutritionPlan();
      }
      setConfirmEditMetricsOpen(false);
      setEditMetricsOpen(false);
    } catch (error) {
      logClientError("NutritionistPatientFilePage.metrics.update.error", error, { patientId });
      setPageFeedback({
        type: "error",
        message: t("patients.file.metrics.updateError"),
      });
      setConfirmEditMetricsOpen(false);
      setEditMetricsOpen(true);
    } finally {
      setIsUpdatingMetrics(false);
    }
  };

  const handleSaveNutritionPlan = async (
    payload: Parameters<typeof clinicalApi.upsertNutritionistPatientNutritionPlan>[1]
  ) => {
    try {
      logClientInfo("NutritionistPatientFilePage.plan.save.start", {
        patientId,
        sections: payload.sections.length,
      });
      const response = await clinicalApi.upsertNutritionistPatientNutritionPlan(patientId, payload);
      setNutritionPlanView(response);
      setNutritionPlanLoadError(null);
      logClientInfo("NutritionistPatientFilePage.plan.save.success", {
        patientId,
        mode: response.mode,
        canEdit: response.canEdit,
      });
      return response;
    } catch (error) {
      logClientError("NutritionistPatientFilePage.plan.save.error", error, {
        patientId,
        sections: payload.sections.length,
      });
      throw error;
    }
  };

  const retryNutritionPlanLoad = async () => {
    if (!patientId) {
      return;
    }

    logClientInfo("NutritionistPatientFilePage.plan.retry.start", { patientId });
    await loadNutritionPlan();
  };

  const handleExportPatientFilePdf = async () => {
    if (!patient) {
      return;
    }

    setIsExportingPdf(true);
    setPageFeedback(null);

    try {
      const resolvedPlan = nutritionPlanView ?? (await loadNutritionPlan());
      const resolvedWeightHistory =
        activeTab === "history"
          ? (await refetchWeightHistory()).data ?? weightHistory
          : await clinicalApi.getNutritionistPatientWeightHistory(patientId);
      const { startDate, endDate, last7Days } = buildHistoricalMacroRange();
      const resolvedTrackingSummary =
        patientTrackingSummary ?? await trackingService.getNutritionistPatientTodaySummary(patientId);
      const resolvedHistoricalMacroLogs =
        patientHistoricalMacroLogs.length > 0
          ? patientHistoricalMacroLogs
          : await trackingService.getNutritionistPatientHistoricalMacros(patientId, startDate, endDate);
      const resolvedHistoricalMacros = summarizeHistoricalMacros(resolvedHistoricalMacroLogs, last7Days);
      const resolvedDailyTrackingLogs =
        activeTab === "history" && patientDailyTrackingLogs.length > 0
          ? patientDailyTrackingLogs
          : await trackingService.getNutritionistPatientDailyLogs(patientId, historyDate);
      const sanitizedPatientName = (patient.fullName ?? patient.userId).replace(/[^\w-]+/g, "-").toLowerCase();

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
        locale: i18n.resolvedLanguage?.startsWith("en") ? "en-US" : "es-MX",
        goalLabel: patientGoalLabel,
        activityLabel: patientActivityLabel,
        dietLabel: patientDietLabel,
        fileName: `expediente-${sanitizedPatientName}.pdf`,
        labels: {
          title: t("patients.file.pdf.title"),
          generatedOn: t("patients.file.pdf.generatedOn"),
          sections: {
            overview: t("patients.file.tabOverview"),
            weightHistory: t("patients.file.tabHistory"),
            calorieTrend: t("history.calorieTrend", { ns: "patient" }),
            macroBreakdown: t("history.macroBreakdown", { ns: "patient" }),
            mealTimeline: t("history.mealLog", { ns: "patient" }),
            nutritionPlan: t("patients.file.tabPlan"),
            observations: t("patients.file.tabObservations"),
          },
          fields: {
            patient: t("patients.file.pdf.patient"),
            age: t("patients.file.age"),
            weight: t("patients.file.weight"),
            height: t("patients.file.height"),
            goal: t("patients.file.objective"),
            activity: t("patients.file.pdf.activity"),
            dietType: t("patients.file.pdf.dietType"),
            allergies: t("patients.file.pdf.allergies"),
            excludedFoods: t("patients.file.pdf.excludedFoods"),
            latestRecord: t("patients.file.pdf.latestRecord"),
            date: t("history.table.date", { ns: "patient" }),
            change: t("history.table.variation", { ns: "patient" }),
            mealSlot: t("patients.file.pdf.mealSlot"),
            dishCount: t("patients.file.pdf.dishCount"),
            dailyGoals: t("patients.file.pdf.dailyGoals"),
            currentWeight: t("history.currentWeight", { ns: "patient" }),
            periodChange: t("history.periodChange", { ns: "patient" }),
            caloriesAverage: t("history.calorieAvg", { ns: "patient" }),
            calorieGoal: t("history.calorieGoal", { ns: "patient" }),
            protein: t("history.protein", { ns: "patient" }),
            carbs: t("history.carbs", { ns: "patient" }),
            fat: t("history.fat", { ns: "patient" }),
            mealType: t("history.pdf.mealType", { ns: "patient" }),
            time: t("history.pdf.time", { ns: "patient" }),
            foods: t("history.pdf.foods", { ns: "patient" }),
            calories: t("history.calories", { ns: "patient" }),
            selectedDate: t("history.date", { ns: "patient" }),
            streak: t("history.streak", { ns: "patient" }),
            bestStreak: t("history.bestStreak", { ns: "patient" }),
          },
          empty: {
            weightHistory: t("patients.file.pdf.noWeightHistory"),
            observations: t("patients.file.noObservations"),
            nutritionPlan: t("patients.file.pdf.noNutritionPlan"),
            none: t("patients.file.pdf.none"),
            tracking: t("history.pdf.noTrackingData", { ns: "patient" }),
            mealTimeline: t("history.todayLogsEmpty", { ns: "patient" }),
            noFoods: t("history.pdf.noFoods", { ns: "patient" }),
          },
          mealSlots: {
            BREAKFAST: t("nutritionPlan.mealSlots.BREAKFAST"),
            LUNCH: t("nutritionPlan.mealSlots.LUNCH"),
            DINNER: t("nutritionPlan.mealSlots.DINNER"),
            SNACK: t("nutritionPlan.mealSlots.SNACK"),
          },
        },
      });
    } catch (error) {
      logClientError("NutritionistPatientFilePage.pdf.export.error", error, { patientId });
      setPageFeedback({
        type: "error",
        message: t("patients.file.pdf.error"),
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const renderMainContent = () => {
    if (isLoadingPatient) {
      return (
        <div className="py-16 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      );
    }

    if (!patient || patientLoadError) {
      return (
        <Card>
          <CardContent className="py-12 flex flex-col items-center justify-center text-center text-muted-foreground gap-3">
            <AlertCircle size={32} className="opacity-40" />
            <p>{patientLoadError ?? t("patients.file.error")}</p>
          </CardContent>
        </Card>
      );
    }

    if (activeTab === "overview") {
      return (
        <div className="grid grid-cols-1 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3 border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <User size={18} className="text-primary" /> {t("patients.file.tabOverview")}
              </CardTitle>
              <Button type="button" size="sm" variant="outline" className="gap-2" onClick={openEditMetricsDialog}>
                <SquarePen size={14} />
                {t("patients.file.metrics.button")}
              </Button>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-muted/30 p-3 rounded-xl border border-border/50 text-center">
                  <CalendarDays size={18} className="mx-auto text-muted-foreground mb-1" />
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">
                    {t("patients.file.age")}
                  </p>
                  <p className="text-lg font-bold">
                    {patientAge !== null ? `${patientAge} ${t("patients.file.years")}` : "--"}
                  </p>
                </div>
                <div className="bg-muted/30 p-3 rounded-xl border border-border/50 text-center">
                  <Weight size={18} className="mx-auto text-muted-foreground mb-1" />
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">
                    {t("patients.file.weight")}
                  </p>
                  <p className="text-lg font-bold">{patient.weightKg} kg</p>
                </div>
                <div className="bg-muted/30 p-3 rounded-xl border border-border/50 text-center">
                  <Ruler size={18} className="mx-auto text-muted-foreground mb-1" />
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">
                    {t("patients.file.height")}
                  </p>
                  <p className="text-lg font-bold">{formatHeightInMeters(patient.heightCm)}</p>
                </div>
                <div className="bg-muted/30 p-3 rounded-xl border border-border/50 text-center flex flex-col justify-center">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">IMC</p>
                  <p className="text-xl font-bold text-primary">
                    {calculateBmi(patient.weightKg, patient.heightCm)}
                  </p>
                </div>
              </div>

              <div className="mt-6 bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 flex items-start gap-3">
                <Flame size={20} className="text-amber-500 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-amber-700 dark:text-amber-400 text-sm mb-1">
                    {t("patients.file.objective")}
                  </h4>
                  <p className="text-amber-600/90 dark:text-amber-400/90 text-sm">
                    {formatPatientGoalLabel(t, patient.goal)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (activeTab === "plan") {
      return (
        <Card>
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-base flex items-center gap-2">
              <UtensilsCrossed size={18} className="text-primary" /> {t("patients.file.tabPlan")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {nutritionPlanLoadError && !isLoadingNutritionPlan ? (
              <Card className="mb-6 border-destructive/20">
                <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
                  <AlertCircle className="size-8 text-destructive" />
                  <div className="space-y-1">
                    <p className="font-semibold">{nutritionPlanLoadError}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("nutritionPlan.loadErrorHelp")}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => void retryNutritionPlanLoad()}
                  >
                    {t("nutritionPlan.retry")}
                  </Button>
                </CardContent>
              </Card>
            ) : null}
            <NutritionPlanWorkspace
              namespace="nutritionist"
              view={nutritionPlanView}
              isLoading={isLoadingNutritionPlan}
              onSave={handleSaveNutritionPlan}
              onSearchFoods={clinicalApi.searchCatalogFoods}
            />
          </CardContent>
        </Card>
      );
    }

    if (activeTab === "history") {
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
          onRetryWeight={() => {
            void refetchWeightHistory();
          }}
          readOnlyWeightHistory
          historicalMacros={{
            caloriesHistory: patientHistoricalMacros.caloriesHistory,
            caloriesAvg: patientHistoricalMacros.caloriesAvg,
            macrosAvg: patientHistoricalMacros.macrosAvg,
            calorieGoal: nutritionPlanView?.dailyGoals.targetCalories ?? null,
            isLoading: isLoadingPatientHistoricalMacros,
            error: patientHistoricalMacrosError,
          }}
          onRetryHistoricalMacros={async () => {
            const { startDate, endDate } = buildHistoricalMacroRange();
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
                error?.response?.data?.message ?? t("history.pdf.noTrackingData", { ns: "patient" })
              );
            } finally {
              setIsLoadingPatientHistoricalMacros(false);
            }
          }}
          logs={patientDailyTrackingLogs}
          isLogsLoading={isLoadingPatientDailyTrackingLogs}
          logsError={patientDailyTrackingLogsError}
          selectedDateLabel={historyDateLabel}
          onPreviousDay={() => {
            const nextDate = new Date(`${historyDate}T12:00:00`);
            nextDate.setDate(nextDate.getDate() - 1);
            setHistoryDate(nextDate.toISOString().split("T")[0]);
          }}
          onNextDay={() => {
            const nextDate = new Date(`${historyDate}T12:00:00`);
            nextDate.setDate(nextDate.getDate() + 1);
            setHistoryDate(nextDate.toISOString().split("T")[0]);
          }}
          disableNextDay={historyDate === todayIso}
          showTrackingInsights
          showMealTimeline
          showLogRegistrationCard={false}
          emptyLogsMessage={t("history.todayLogsEmpty", { ns: "patient" })}
        />
      );
    }

    return (
      <Card>
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText size={18} className="text-primary" /> {t("patients.file.tabObservations")}
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-5 space-y-8">
          <div className="bg-muted/10 p-4 rounded-xl border border-border/50 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-foreground">{t("patients.file.newNote")}</p>
              <span className="text-xs text-muted-foreground">
                {newNote.length}/{OBSERVATION_NOTE_MAX_LENGTH}
              </span>
            </div>
            <Textarea
              value={newNote}
              onChange={(event) => setNewNote(event.target.value)}
              disabled={isSavingNote}
              placeholder={t("patients.file.newNotePlaceholder")}
              maxLength={OBSERVATION_NOTE_MAX_LENGTH}
              className="min-h-[80px] resize-y bg-background"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleSaveObservation}
                disabled={isSavingNote || !newNote.trim()}
                className="flex items-center gap-2"
              >
                {isSavingNote && <Loader2 className="w-4 h-4 animate-spin" />}
                {t("patients.file.saveObservation")}
              </Button>
            </div>
          </div>

          <div className="relative border-l-2 border-border/50 ml-3 space-y-6">
            {observations.length === 0 ? (
              <p className="text-sm text-muted-foreground italic pl-4">
                {t("patients.file.noObservations")}
              </p>
            ) : (
              observations.map((observation) => (
                <div key={observation.id} className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-background border-2 border-primary" />

                  <p className="text-xs font-bold text-muted-foreground mb-1">
                    {formatObservationDateTime(observation.createdAt, i18n.language)}
                  </p>

                  <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <p className="flex-1 text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                        {observation.note}
                      </p>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartEditObservation(observation)}
                        >
                          <Pencil size={14} />
                          {t("patients.file.editObservation")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setObservationToDelete(observation)}
                        >
                          <Trash2 size={14} />
                          {t("patients.file.deleteObservation")}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans transition-colors duration-500 ease-in-out">
      <NutritionistNav />

      <div className="md:pl-56">
        <SettingsBar />
      </div>

      <div className="relative bg-primary/10 border-b border-border overflow-hidden md:pl-56">
        <div
          aria-hidden
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/20 blur-3xl pointer-events-none"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-6 flex flex-col">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/patients/nutritionist")}
            className="w-fit mb-4 text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft size={16} className="mr-1.5" />
            {t("patients.file.back")}
          </Button>

          <div className="flex items-center gap-5">
            <ProfileAvatar
              name={patientIdentity || "Paciente"}
              photoUrl={patient?.profilePhotoUrl}
              size="lg"
              className="shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
                {patientIdentity || t("patients.file.loading")}
              </h1>
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-3 self-start sm:self-auto">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowUnlinkModal(true)}
                className="flex items-center gap-2"
                disabled={isLoadingPatient || !patient}
              >
                <UserMinus size={16} />
                {t("patients.file.unlink")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  void handleExportPatientFilePdf();
                }}
                className="flex items-center gap-2"
                disabled={isLoadingPatient || !patient || isExportingPdf}
              >
                {isExportingPdf ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
                {t("patients.file.downloadPdf")}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-8 overflow-x-auto hide-scrollbar border-b border-border/50 pb-px">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-3 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
                activeTab === "overview"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("patients.file.tabOverview")}
            </button>
            <button
              onClick={() => setActiveTab("plan")}
              className={`pb-3 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
                activeTab === "plan"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("patients.file.tabPlan")}
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`pb-3 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
                activeTab === "history"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("patients.file.tabHistory")}
            </button>
            <button
              onClick={() => setActiveTab("observations")}
              className={`pb-3 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
                activeTab === "observations"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("patients.file.tabObservations")}
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-8 md:pl-56 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {pageFeedback ? (
          <div
            className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${
              pageFeedback.type === "success"
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-destructive/25 bg-destructive/10 text-destructive"
            }`}
          >
            {pageFeedback.type === "success" ? (
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
            )}
            <span>{pageFeedback.message}</span>
          </div>
        ) : null}
        {renderMainContent()}
      </main>

      <ConfirmModal
        isOpen={showUnlinkModal}
        onClose={() => setShowUnlinkModal(false)}
        onConfirm={confirmUnlinkPatient}
        title={t("patients.file.unlinkTitle")}
        description={t("patients.file.confirmUnlink")}
        icon={<UserMinus size={24} />}
        isLoading={isUnlinking}
        isDestructive={true}
        confirmText={t("patients.file.unlink")}
        cancelText={t("common.cancel")}
      />

      <ConfirmModal
        isOpen={Boolean(observationToDelete)}
        onClose={() => setObservationToDelete(null)}
        onConfirm={() => {
          void handleDeleteObservation();
        }}
        title={t("patients.file.deleteObservationTitle")}
        description={t("patients.file.deleteObservationDescription", {
          note: observationToDelete?.note ?? "",
        })}
        icon={<Trash2 size={24} />}
        isLoading={isDeletingObservation}
        isDestructive
        confirmText={t("patients.file.deleteObservation")}
        cancelText={t("common.cancel")}
      />

      <Dialog
        open={editMetricsOpen}
        onOpenChange={(open) => {
          if (open) {
            setEditMetricsOpen(true);
            return;
          }
          resetMetricsDialog();
        }}
      >
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{t("patients.file.metrics.title")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="metrics-weight" className="text-sm font-medium">
                {t("patients.file.metrics.weightLabel")}
              </label>
              <Input
                id="metrics-weight"
                inputMode="decimal"
                value={metricsWeightInput}
                maxLength={WEIGHT_INPUT_MAX_LENGTH}
                onChange={(event) => setMetricsWeightInput(event.target.value.slice(0, WEIGHT_INPUT_MAX_LENGTH))}
                aria-invalid={Boolean(metricsErrors.weightKg)}
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-destructive">{metricsErrors.weightKg ?? ""}</p>
                <p className="text-xs text-muted-foreground">
                  {metricsWeightInput.length}/{WEIGHT_INPUT_MAX_LENGTH}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="metrics-height" className="text-sm font-medium">
                {t("patients.file.metrics.heightLabel")}
              </label>
              <Input
                id="metrics-height"
                inputMode="numeric"
                value={metricsHeightInput}
                maxLength={HEIGHT_INPUT_MAX_LENGTH}
                onChange={(event) => setMetricsHeightInput(event.target.value.slice(0, HEIGHT_INPUT_MAX_LENGTH))}
                aria-invalid={Boolean(metricsErrors.heightCm)}
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-destructive">{metricsErrors.heightCm ?? ""}</p>
                <p className="text-xs text-muted-foreground">
                  {metricsHeightInput.length}/{HEIGHT_INPUT_MAX_LENGTH}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={resetMetricsDialog} disabled={isUpdatingMetrics}>
              {t("patients.file.metrics.cancel")}
            </Button>
            <Button type="button" onClick={handleReviewMetricsUpdate} disabled={isUpdatingMetrics}>
              {t("patients.file.metrics.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        isOpen={confirmEditMetricsOpen}
        onClose={() => {
          setConfirmEditMetricsOpen(false);
          setEditMetricsOpen(true);
        }}
        onConfirm={() => {
          void handleConfirmMetricsUpdate();
        }}
        title={t("patients.file.metrics.confirmTitle")}
        description={t("patients.file.metrics.confirmDescription", {
          weight: metricsWeightInput || "--",
          height: metricsHeightInput || "--",
        })}
        icon={<SquarePen size={24} />}
        isLoading={isUpdatingMetrics}
        confirmText={t("patients.file.metrics.save")}
        cancelText={t("patients.file.metrics.back")}
      />

      <Dialog
        open={Boolean(editingObservation)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingObservation(null);
            setEditingObservationNote("");
          }
        }}
      >
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{t("patients.file.editObservationTitle")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-foreground">{t("patients.file.editObservationTitle")}</p>
              <span className="text-xs text-muted-foreground">
                {editingObservationNote.length}/{OBSERVATION_NOTE_MAX_LENGTH}
              </span>
            </div>
            <Textarea
              value={editingObservationNote}
              onChange={(event) => setEditingObservationNote(event.target.value)}
              disabled={isUpdatingObservation}
              maxLength={OBSERVATION_NOTE_MAX_LENGTH}
              className="min-h-[140px] resize-y bg-background"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditingObservation(null);
                setEditingObservationNote("");
              }}
              disabled={isUpdatingObservation}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => {
                void handleUpdateObservation();
              }}
              disabled={isUpdatingObservation || !editingObservationNote.trim()}
            >
              {isUpdatingObservation ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
              {t("patients.file.saveObservationChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

