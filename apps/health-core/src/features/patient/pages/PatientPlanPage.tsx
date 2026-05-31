import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle2, FileDown, RefreshCcw } from 'lucide-react';

import { clinicalApi } from '@/features/clinical/services/clinicalService';
import { NutritionPlanWorkspace } from '@/features/nutrition-plan/components/NutritionPlanWorkspace';
import { PatientNav } from '@/features/patient/components/PatientNav';
import { usePatientPlanData } from '@/features/patient/hooks/usePatientPlanData';
import { usePatientPlanPdfExport } from '@/features/patient/hooks/usePatientPlanPdfExport';
import { usePatientPlanQuickTrack } from '@/features/patient/hooks/usePatientPlanQuickTrack';
import { usePatientPlanSave } from '@/features/patient/hooks/usePatientPlanSave';
import { SettingsBar } from '@/shared/components/SettingsBar';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';

export const PatientPlanPage = () => {
  const { t } = useTranslation('patient');
  const {
    view,
    setView,
    observations,
    profile,
    hasLinkedNutritionist,
    isLoading,
    loadError,
    setLoadError,
    retryLoad,
  } = usePatientPlanData();
  const { handleSave } = usePatientPlanSave({
    setView,
    setLoadError,
  });
  const { isExportingPdf, handleExportPdf } = usePatientPlanPdfExport({
    view,
    profile,
    observations,
    setLoadError,
  });
  const { quickTrackFeedback, isLoggingFood, handleQuickTrack } = usePatientPlanQuickTrack();

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <PatientNav />

      <div className="md:pl-56">
        <SettingsBar />
      </div>

      <div className="relative overflow-hidden border-b border-border bg-primary/10 md:pl-56">
        <div
          aria-hidden
          className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl"
        />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-4 px-4 pb-6 pt-20 sm:px-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">{t('nutritionPlan.title')}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {t('nutritionPlan.subtitle')}
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            disabled={isLoading || isExportingPdf || !view}
            onClick={() => {
              void handleExportPdf();
            }}
          >
            <FileDown size={16} />
            {isExportingPdf ? t('nutritionPlan.exportingPdf') : t('nutritionPlan.downloadPdf')}
          </Button>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:px-6 md:pl-56">
        {quickTrackFeedback ? (
          <div
            className={`mb-6 flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${
              quickTrackFeedback.type === 'success'
                ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : 'border-destructive/25 bg-destructive/10 text-destructive'
            }`}
          >
            {quickTrackFeedback.type === 'success' ? (
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
            )}
            <span>{quickTrackFeedback.message}</span>
          </div>
        ) : null}

        {loadError && !isLoading ? (
          <Card className="mb-6 border-destructive/20">
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <div className="space-y-1">
                <p className="font-semibold">{loadError}</p>
                <p className="text-sm text-muted-foreground">{t('nutritionPlan.loadErrorHelp')}</p>
              </div>
              <Button variant="outline" className="gap-2" onClick={() => void retryLoad()}>
                <RefreshCcw size={14} />
                {t('nutritionPlan.retry')}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <NutritionPlanWorkspace
          namespace="patient"
          view={view}
          observations={observations}
          showObservations={hasLinkedNutritionist}
          isLoading={isLoading}
          onSave={handleSave}
          onSearchFoods={clinicalApi.searchCatalogFoods}
          onQuickTrack={handleQuickTrack}
          isQuickTracking={isLoggingFood}
        />
      </main>
    </div>
  );
};
