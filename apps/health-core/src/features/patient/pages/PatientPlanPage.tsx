import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, FileDown, RefreshCcw } from 'lucide-react';

import { clinicalApi } from '@/features/clinical/services/clinicalService';
import type {
  NutritionPlanViewResponse,
  ObservationResponse,
  PatientProfileResponse,
} from '@/features/clinical/types/clinical.types';
import { NutritionPlanWorkspace } from '@/features/nutrition-plan/components/NutritionPlanWorkspace';
import { PatientNav } from '@/features/patient/components/PatientNav';
import { exportPatientNutritionPlanPdf } from '@/features/patient/services/patientNutritionPlanPdfService';
import { logClientError, logClientInfo } from '@/core/utils/logger';
import { SettingsBar } from '@/shared/components/SettingsBar';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';

export const PatientPlanPage = () => {
  const { t, i18n } = useTranslation('patient');
  const [view, setView] = useState<NutritionPlanViewResponse | null>(null);
  const [observations, setObservations] = useState<ObservationResponse[]>([]);
  const [profile, setProfile] = useState<PatientProfileResponse | null>(null);
  const [hasLinkedNutritionist, setHasLinkedNutritionist] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadPlan = useCallback(
    async ({
      showLoading = true,
      source = 'load',
    }: {
      showLoading?: boolean;
      source?: 'load' | 'retry' | 'focus';
    } = {}) => {
      if (showLoading) {
        setIsLoading(true);
      }

      try {
        logClientInfo(`PatientPlanPage.${source}.start`);
        setLoadError(null);
        const [response, profile] = await Promise.all([
          clinicalApi.getMyNutritionPlan(),
          clinicalApi.getMyProfile().catch(() => null),
        ]);
        const linkedNutritionist = Boolean(profile?.nutritionistId);
        let observationResponse: ObservationResponse[] = [];
        if (linkedNutritionist) {
          try {
            observationResponse = await clinicalApi.getMyObservations();
          } catch (error) {
            logClientError(`PatientPlanPage.observations.${source}.error`, error);
          }
        }

        setHasLinkedNutritionist(linkedNutritionist);
        setProfile(profile);
        setView(response);
        setObservations(observationResponse);

        logClientInfo(`PatientPlanPage.${source}.success`, {
          mode: response.mode,
          canEdit: response.canEdit,
          sections: response.sections.length,
          observations: observationResponse.length,
          linkedNutritionist,
        });
      } catch (error) {
        logClientError(`PatientPlanPage.${source}.error`, error);
        setLoadError(t('nutritionPlan.loadError'));
      } finally {
        if (showLoading) {
          setIsLoading(false);
        }
      }
    },
    [t]
  );

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  useEffect(() => {
    const handleWindowRefresh = () => {
      if (document.visibilityState === 'visible') {
        void loadPlan({ showLoading: false, source: 'focus' });
      }
    };

    window.addEventListener('focus', handleWindowRefresh);
    document.addEventListener('visibilitychange', handleWindowRefresh);

    return () => {
      window.removeEventListener('focus', handleWindowRefresh);
      document.removeEventListener('visibilitychange', handleWindowRefresh);
    };
  }, [loadPlan]);

  const handleSave = async (payload: Parameters<typeof clinicalApi.upsertMyNutritionPlan>[0]) => {
    try {
      logClientInfo('PatientPlanPage.save.start', { sections: payload.sections.length });
      const response = await clinicalApi.upsertMyNutritionPlan(payload);
      setView(response);
      setLoadError(null);
      logClientInfo('PatientPlanPage.save.success', { mode: response.mode, canEdit: response.canEdit });
      return response;
    } catch (error) {
      logClientError('PatientPlanPage.save.error', error, { sections: payload.sections.length });
      throw error;
    }
  };

  const handleExportPdf = async () => {
    if (!view) {
      return;
    }

    setIsExportingPdf(true);
    try {
      const patientName = profile?.fullName ?? profile?.firstName ?? null;
      const sanitizedPatientName = (patientName || 'plan-nutricional')
        .replace(/[^\w-]+/g, '-')
        .toLowerCase();

      await exportPatientNutritionPlanPdf({
        fileName: `plan-nutricional-${sanitizedPatientName}.pdf`,
        locale: i18n.language,
        patientName,
        view,
        observations,
        labels: {
          title: t('nutritionPlan.pdf.title'),
          generatedOn: t('nutritionPlan.pdf.generatedOn'),
          patient: t('nutritionPlan.pdf.patient'),
          sections: {
            dailyGoals: t('nutritionPlan.pdf.sections.dailyGoals'),
            currentPlan: t('nutritionPlan.pdf.sections.currentPlan'),
            previousPlan: t('nutritionPlan.contextTitle'),
            observations: t('nutritionPlan.observationsTitle'),
          },
          fields: {
            calories: t('nutritionPlan.calories'),
            protein: t('nutritionPlan.protein'),
            carbs: t('nutritionPlan.carbs'),
            fat: t('nutritionPlan.fat'),
            hydration: t('nutritionPlan.pdf.hydration'),
            mealSlot: t('nutritionPlan.pdf.mealSlot'),
            dish: t('nutritionPlan.pdf.dish'),
            ingredients: t('nutritionPlan.ingredients'),
            instructions: t('nutritionPlan.instructions'),
            notes: t('nutritionPlan.notes'),
            updatedAt: t('nutritionPlan.pdf.updatedAt'),
          },
          empty: {
            plan: t('nutritionPlan.pdf.empty.plan'),
            observations: t('nutritionPlan.noObservations'),
            previousPlan: t('nutritionPlan.pdf.empty.previousPlan'),
            none: t('nutritionPlan.pdf.empty.none'),
            noInstructions: t('nutritionPlan.noInstructions'),
            noNotes: t('nutritionPlan.noNotes'),
          },
          mealSlots: {
            BREAKFAST: t('nutritionPlan.mealSlots.BREAKFAST'),
            LUNCH: t('nutritionPlan.mealSlots.LUNCH'),
            DINNER: t('nutritionPlan.mealSlots.DINNER'),
            SNACK: t('nutritionPlan.mealSlots.SNACK'),
          },
          units: {
            GRAMS: t('nutritionPlan.units.GRAMS'),
            MILLILITERS: t('nutritionPlan.units.MILLILITERS'),
          },
        },
      });
    } catch (error) {
      logClientError('PatientPlanPage.pdf.export.error', error);
      setLoadError(t('nutritionPlan.pdf.error'));
    } finally {
      setIsExportingPdf(false);
    }
  };

  const retryLoad = async () => {
    await loadPlan({ showLoading: true, source: 'retry' });
  };

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
        />
      </main>
    </div>
  );
};
