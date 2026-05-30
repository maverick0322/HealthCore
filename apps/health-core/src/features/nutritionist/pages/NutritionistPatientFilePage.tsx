import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

import { NutritionistNav } from '@/features/nutritionist/components/NutritionistNav';
import { SettingsBar } from '@/shared/components/SettingsBar';
import { Card, CardContent } from '@/shared/ui/card';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import { formatPatientGoalLabel } from '@/features/onboarding/utils/profilePresentation';
import { useNutritionistPatientFilePdfExport } from '@/features/nutritionist/hooks/useNutritionistPatientFilePdfExport';
import { useNutritionistPatientClinicalData } from '@/features/nutritionist/hooks/useNutritionistPatientClinicalData';
import { useNutritionistPatientNutritionPlan } from '@/features/nutritionist/hooks/useNutritionistPatientNutritionPlan';
import { useNutritionistPatientMetrics } from '@/features/nutritionist/hooks/useNutritionistPatientMetrics';
import { useNutritionistPatientObservations } from '@/features/nutritionist/hooks/useNutritionistPatientObservations';
import { useNutritionistPatientTrackingData } from '@/features/nutritionist/hooks/useNutritionistPatientTrackingData';
import { useNutritionistPatientUnlink } from '@/features/nutritionist/hooks/useNutritionistPatientUnlink';
import { useNutritionistPatientWeightHistory } from '@/features/nutritionist/hooks/useNutritionistPatientWeightHistory';
import {
  getAgeFromBirthDate,
  getDisplayIdentity,
} from '@/features/nutritionist/utils/patientFilePresentation';
import { NutritionistPatientOverviewTab } from '@/features/nutritionist/components/NutritionistPatientOverviewTab';
import { NutritionistPatientPlanTab } from '@/features/nutritionist/components/NutritionistPatientPlanTab';
import { NutritionistPatientHistoryTab } from '@/features/nutritionist/components/NutritionistPatientHistoryTab';
import { NutritionistPatientObservationsTab } from '@/features/nutritionist/components/NutritionistPatientObservationsTab';
import { NutritionistPatientFileHeader } from '@/features/nutritionist/components/NutritionistPatientFileHeader';
import {
  NutritionistPatientFileTabsNav,
  type NutritionistPatientFileTab,
} from '@/features/nutritionist/components/NutritionistPatientFileTabsNav';
import { NutritionistPatientFileDialogs } from '@/features/nutritionist/components/NutritionistPatientFileDialogs';

const OBSERVATION_NOTE_MAX_LENGTH = 500;
const WEIGHT_INPUT_MAX_LENGTH = 5;
const HEIGHT_INPUT_MAX_LENGTH = 3;

export const NutritionistPatientFilePage = () => {
  const { id: patientIdParam } = useParams<{ id: string }>();
  const patientId = patientIdParam ? decodeURIComponent(patientIdParam) : '';
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['nutritionist', 'onboarding', 'patient']);

  const [activeTab, setActiveTab] = useState<NutritionistPatientFileTab>('overview');
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [isCreateFoodModalOpen, setIsCreateFoodModalOpen] = useState(false);
  const [suggestedFoodName, setSuggestedFoodName] = useState('');
  const [pageFeedback, setPageFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
  } = useNutritionistPatientWeightHistory(patientId, { enabled: activeTab === 'history' });

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
      if (document.visibilityState !== 'visible' || !patientId) {
        return;
      }

      void loadPatient({ showLoading: false });

      if (activeTab === 'history') {
        void refetchWeightHistory();
      }

      if (activeTab === 'plan') {
        void loadNutritionPlan();
      }
    };

    window.addEventListener('focus', handleWindowRefresh);
    document.addEventListener('visibilitychange', handleWindowRefresh);

    return () => {
      window.removeEventListener('focus', handleWindowRefresh);
      document.removeEventListener('visibilitychange', handleWindowRefresh);
    };
  }, [activeTab, loadPatient, loadNutritionPlan, patientId, refetchWeightHistory]);

  const patientIdentity = patient ? patient.fullName?.trim() || getDisplayIdentity(patient.userId) : '';
  const patientAge = patient ? getAgeFromBirthDate(patient.birthDate) : null;
  const patientGoalLabel = patient ? formatPatientGoalLabel(t, patient.goal) : '--';
  const patientActivityLabel = patient
    ? t(`onboarding:options.activityLevels.${patient.activityLevel}.label`)
    : '--';
  const patientDietLabel = patient
    ? t(`onboarding:options.diets.${patient.dietType}.label`)
    : '--';

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
            <p>{patientLoadError ?? t('patients.file.error')}</p>
          </CardContent>
        </Card>
      );
    }

    if (activeTab === 'overview') {
      return (
        <NutritionistPatientOverviewTab
          patient={patient}
          patientAge={patientAge}
          onOpenEditMetrics={openEditMetricsDialog}
        />
      );
    }

    if (activeTab === 'plan') {
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

    if (activeTab === 'history') {
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

      <div className="md:pl-56">
        <NutritionistPatientFileHeader
          patient={patient}
          patientIdentity={patientIdentity}
          isLoadingPatient={isLoadingPatient}
          isExportingPdf={isExportingPdf}
          onBack={() => navigate('/patients/nutritionist')}
          onUnlink={() => setShowUnlinkModal(true)}
          onExportPdf={() => {
            void handleExportPatientFilePdf();
          }}
        />
      </div>

      <div className="relative md:pl-56">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <NutritionistPatientFileTabsNav activeTab={activeTab} onChangeTab={setActiveTab} />
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-8 md:pl-56 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {pageFeedback ? (
          <div
            className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${
              pageFeedback.type === 'success'
                ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : 'border-destructive/25 bg-destructive/10 text-destructive'
            }`}
          >
            {pageFeedback.type === 'success' ? (
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
            )}
            <span>{pageFeedback.message}</span>
          </div>
        ) : null}
        {renderMainContent()}
      </main>

      <NutritionistPatientFileDialogs
        showUnlinkModal={showUnlinkModal}
        onCloseUnlinkModal={() => setShowUnlinkModal(false)}
        onConfirmUnlink={confirmUnlinkPatient}
        isUnlinking={isUnlinking}
        observationToDelete={observationToDelete}
        onCloseDeleteObservation={() => setObservationToDelete(null)}
        onConfirmDeleteObservation={() => {
          void handleDeleteObservation();
        }}
        isDeletingObservation={isDeletingObservation}
        editMetricsOpen={editMetricsOpen}
        onChangeEditMetricsOpen={(open) => {
          if (open) {
            setEditMetricsOpen(true);
            return;
          }
          resetMetricsDialog();
        }}
        metricsWeightInput={metricsWeightInput}
        metricsHeightInput={metricsHeightInput}
        metricsErrors={metricsErrors}
        onChangeMetricsWeightInput={setMetricsWeightInput}
        onChangeMetricsHeightInput={setMetricsHeightInput}
        onResetMetricsDialog={resetMetricsDialog}
        onReviewMetricsUpdate={handleReviewMetricsUpdate}
        isUpdatingMetrics={isUpdatingMetrics}
        weightInputMaxLength={WEIGHT_INPUT_MAX_LENGTH}
        heightInputMaxLength={HEIGHT_INPUT_MAX_LENGTH}
        confirmEditMetricsOpen={confirmEditMetricsOpen}
        onCloseConfirmMetrics={() => {
          setConfirmEditMetricsOpen(false);
          setEditMetricsOpen(true);
        }}
        onConfirmMetricsUpdate={() => {
          void handleConfirmMetricsUpdate();
        }}
        editingObservation={editingObservation}
        editingObservationNote={editingObservationNote}
        onChangeEditingObservationNote={setEditingObservationNote}
        onCloseEditObservation={resetEditingObservation}
        onConfirmEditObservation={() => {
          void handleUpdateObservation();
        }}
        isUpdatingObservation={isUpdatingObservation}
        observationNoteMaxLength={OBSERVATION_NOTE_MAX_LENGTH}
        isCreateFoodModalOpen={isCreateFoodModalOpen}
        onCloseCreateFoodModal={() => setIsCreateFoodModalOpen(false)}
        suggestedFoodName={suggestedFoodName}
        onCreateFoodSuccess={() => {
          setPageFeedback({
            type: 'success',
            message: 'Alimento local guardado exitosamente. Ya puedes buscarlo e integrarlo al plan.',
          });
          setTimeout(() => setPageFeedback(null), 5000);
        }}
      />
    </div>
  );
};

export default NutritionistPatientFilePage;
