import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  UserMinus,
  AlertCircle,
  FileDown,
  SquarePen,
  Trash2,
} from "lucide-react";

import { NutritionistNav } from "@/features/nutritionist/components/NutritionistNav";
import { SettingsBar } from "@/shared/components/SettingsBar";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { ProfileAvatar } from "@/shared/components/ProfileAvatar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { LoadingSpinner } from "@/shared/ui/LoadingSpinner";
import { CreateLocalFoodModal } from "@/features/admin/components/CreateLocalFoodModal";
import { formatPatientGoalLabel } from "@/features/onboarding/utils/profilePresentation";
import { useNutritionistPatientFilePdfExport } from "@/features/nutritionist/hooks/useNutritionistPatientFilePdfExport";
import { useNutritionistPatientClinicalData } from "@/features/nutritionist/hooks/useNutritionistPatientClinicalData";
import { useNutritionistPatientNutritionPlan } from "@/features/nutritionist/hooks/useNutritionistPatientNutritionPlan";
import { useNutritionistPatientMetrics } from "@/features/nutritionist/hooks/useNutritionistPatientMetrics";
import { useNutritionistPatientObservations } from "@/features/nutritionist/hooks/useNutritionistPatientObservations";
import { useNutritionistPatientTrackingData } from "@/features/nutritionist/hooks/useNutritionistPatientTrackingData";
import { useNutritionistPatientUnlink } from "@/features/nutritionist/hooks/useNutritionistPatientUnlink";
import { useNutritionistPatientWeightHistory } from "@/features/nutritionist/hooks/useNutritionistPatientWeightHistory";
import {
  getAgeFromBirthDate,
  getDisplayIdentity,
} from "@/features/nutritionist/utils/patientFilePresentation";
import { NutritionistPatientOverviewTab } from "@/features/nutritionist/components/NutritionistPatientOverviewTab";
import { NutritionistPatientPlanTab } from "@/features/nutritionist/components/NutritionistPatientPlanTab";
import { NutritionistPatientHistoryTab } from "@/features/nutritionist/components/NutritionistPatientHistoryTab";
import { NutritionistPatientObservationsTab } from "@/features/nutritionist/components/NutritionistPatientObservationsTab";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";

const OBSERVATION_NOTE_MAX_LENGTH = 500;
const WEIGHT_INPUT_MAX_LENGTH = 5;
const HEIGHT_INPUT_MAX_LENGTH = 3;

export const NutritionistPatientFilePage = () => {
  const { id: patientIdParam } = useParams<{ id: string }>();
  const patientId = patientIdParam ? decodeURIComponent(patientIdParam) : "";
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(["nutritionist", "onboarding", "patient"]);

  const [activeTab, setActiveTab] = useState<"overview" | "plan" | "history" | "observations">("overview");
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [isCreateFoodModalOpen, setIsCreateFoodModalOpen] = useState(false);
  const [suggestedFoodName, setSuggestedFoodName] = useState("");
  const [pageFeedback, setPageFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const {
    patient,
    setPatient,
    isLoadingPatient,
    patientLoadError,
    observations,
    nutritionPlanView,
    setNutritionPlanView,
    isLoadingNutritionPlan,
    nutritionPlanLoadError,
    setNutritionPlanLoadError,
    loadPatient,
    loadObservations,
    loadNutritionPlan,
  } = useNutritionistPatientClinicalData({
    patientId,
    activeTab,
  });
  const {
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
    disableNextHistoryDate,
  } = useNutritionistPatientTrackingData({
    patientId,
    activeTab,
  });
  const {
    data: weightHistory,
    isLoading: isLoadingWeightHistory,
    isError: isWeightHistoryError,
    refetch: refetchWeightHistory,
  } = useNutritionistPatientWeightHistory(patientId, { enabled: activeTab === "history" });
  const {
    newNote,
    setNewNote,
    isSavingNote,
    editingObservation,
    editingObservationNote,
    setEditingObservationNote,
    isUpdatingObservation,
    observationToDelete,
    setObservationToDelete,
    isDeletingObservation,
    handleSaveObservation,
    handleStartEditObservation,
    resetEditingObservation,
    handleUpdateObservation,
    handleDeleteObservation,
  } = useNutritionistPatientObservations({
    patientId,
    loadObservations,
    setPageFeedback,
  });
  const {
    editMetricsOpen,
    setEditMetricsOpen,
    confirmEditMetricsOpen,
    setConfirmEditMetricsOpen,
    metricsWeightInput,
    setMetricsWeightInput,
    metricsHeightInput,
    setMetricsHeightInput,
    metricsErrors,
    isUpdatingMetrics,
    openEditMetricsDialog,
    resetMetricsDialog,
    handleReviewMetricsUpdate,
    handleConfirmMetricsUpdate,
  } = useNutritionistPatientMetrics({
    patientId,
    patient,
    nutritionPlanView,
    setPatient,
    loadNutritionPlan,
    refetchWeightHistory,
    setPageFeedback,
  });
  const { isUnlinking, confirmUnlinkPatient } = useNutritionistPatientUnlink({
    patientId,
    navigate,
    setPageFeedback,
    closeUnlinkModal: () => setShowUnlinkModal(false),
  });

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

  const patientIdentity = patient ? patient.fullName?.trim() || getDisplayIdentity(patient.userId) : "";
  const patientAge = patient ? getAgeFromBirthDate(patient.birthDate) : null;
  const patientGoalLabel = patient ? formatPatientGoalLabel(t, patient.goal) : "--";
  const patientActivityLabel = patient
    ? t(`onboarding:options.activityLevels.${patient.activityLevel}.label`)
    : "--";
  const patientDietLabel = patient
    ? t(`onboarding:options.diets.${patient.dietType}.label`)
    : "--";
  const { handleSaveNutritionPlan, retryNutritionPlanLoad } = useNutritionistPatientNutritionPlan({
    patientId,
    loadNutritionPlan,
    setNutritionPlanView,
    setNutritionPlanLoadError,
  });
  const { isExportingPdf, handleExportPatientFilePdf } = useNutritionistPatientFilePdfExport({
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
  });

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
        <NutritionistPatientOverviewTab
          patient={patient}
          patientAge={patientAge}
          onOpenEditMetrics={openEditMetricsDialog}
        />
      );
    }

    if (activeTab === "plan") {
      return (
        <NutritionistPatientPlanTab
          nutritionPlanView={nutritionPlanView}
          isLoadingNutritionPlan={isLoadingNutritionPlan}
          nutritionPlanLoadError={nutritionPlanLoadError}
          onRetryNutritionPlanLoad={retryNutritionPlanLoad}
          onSaveNutritionPlan={handleSaveNutritionPlan}
          onOpenCreateLocalFood={(name) => {
            setSuggestedFoodName(name);
            setIsCreateFoodModalOpen(true);
          }}
        />
      );
    }

    if (activeTab === "history") {
      return (
        <NutritionistPatientHistoryTab
          patientTrackingSummary={patientTrackingSummary}
          isLoadingPatientTrackingSummary={isLoadingPatientTrackingSummary}
          patientTrackingSummaryError={patientTrackingSummaryError}
          weightHistory={weightHistory}
          isLoadingWeightHistory={isLoadingWeightHistory}
          isWeightHistoryError={isWeightHistoryError}
          onRetryWeightHistory={() => {
            void refetchWeightHistory();
          }}
          patientHistoricalMacros={patientHistoricalMacros}
          isLoadingPatientHistoricalMacros={isLoadingPatientHistoricalMacros}
          patientHistoricalMacrosError={patientHistoricalMacrosError}
          onRetryHistoricalMacros={loadHistoricalMacros}
          patientDailyTrackingLogs={patientDailyTrackingLogs}
          isLoadingPatientDailyTrackingLogs={isLoadingPatientDailyTrackingLogs}
          patientDailyTrackingLogsError={patientDailyTrackingLogsError}
          historyDateLabel={historyDateLabel}
          onPreviousHistoryDate={goToPreviousHistoryDate}
          onNextHistoryDate={goToNextHistoryDate}
          disableNextHistoryDate={disableNextHistoryDate}
          calorieGoal={nutritionPlanView?.dailyGoals.targetCalories ?? null}
        />
      );
    }

    return (
      <NutritionistPatientObservationsTab
        newNote={newNote}
        onChangeNewNote={setNewNote}
        isSavingNote={isSavingNote}
        onSaveObservation={handleSaveObservation}
        observations={observations}
        onEditObservation={handleStartEditObservation}
        onDeleteObservation={setObservationToDelete}
        locale={i18n.language}
        maxNoteLength={OBSERVATION_NOTE_MAX_LENGTH}
      />
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
            {isLoadingPatient && !patient ? (
              <>
                <div
                  aria-hidden="true"
                  className="h-20 w-20 shrink-0 rounded-full bg-foreground/10 animate-pulse"
                />
                <div className="min-w-0">
                  <div
                    aria-hidden="true"
                    className="h-8 w-56 rounded-md bg-foreground/10 animate-pulse sm:h-9 sm:w-72"
                  />
                </div>
              </>
            ) : (
              <>
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
              </>
            )}

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
            resetEditingObservation();
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
              onClick={resetEditingObservation}
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

      {/* --- MODAL DE CREACIÓN DE ALIMENTOS (CU-13) --- */}
      <CreateLocalFoodModal
        isOpen={isCreateFoodModalOpen}
        onClose={() => setIsCreateFoodModalOpen(false)}
        initialName={suggestedFoodName}
        onSuccess={() => {
          setPageFeedback({
            type: "success",
            message: "Alimento local guardado exitosamente. Ya puedes buscarlo e integrarlo al plan.",
          });
          setTimeout(() => setPageFeedback(null), 5000);
        }}
      />
    </div>
  );
};

export default NutritionistPatientFilePage;

