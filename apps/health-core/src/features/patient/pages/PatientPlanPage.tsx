import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, FileDown, RefreshCcw } from 'lucide-react';

import { clinicalApi } from '@/features/clinical/services/clinicalService';
import type {
  NutritionPlanViewResponse,
  ObservationResponse,
} from '@/features/clinical/types/clinical.types';
import { NutritionPlanWorkspace } from '@/features/nutrition-plan/components/NutritionPlanWorkspace';
import { PatientNav } from '@/features/patient/components/PatientNav';
import { logClientError, logClientInfo } from '@/core/utils/logger';
import { SettingsBar } from '@/shared/components/SettingsBar';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';

export const PatientPlanPage = () => {
  const { t } = useTranslation('patient');
  const [view, setView] = useState<NutritionPlanViewResponse | null>(null);
  const [observations, setObservations] = useState<ObservationResponse[]>([]);
  const [hasLinkedNutritionist, setHasLinkedNutritionist] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadPlan = async () => {
      try {
        logClientInfo('PatientPlanPage.load.start');
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
            logClientError('PatientPlanPage.observations.load.error', error);
          }
        }
        if (mounted) {
          setHasLinkedNutritionist(linkedNutritionist);
          setView(response);
          setObservations(observationResponse);
        }
        logClientInfo('PatientPlanPage.load.success', {
          mode: response.mode,
          canEdit: response.canEdit,
          sections: response.sections.length,
          observations: observationResponse.length,
          linkedNutritionist,
        });
      } catch (error) {
        logClientError('PatientPlanPage.load.error', error);
        if (mounted) {
          setLoadError(t('nutritionPlan.loadError'));
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadPlan();

    return () => {
      mounted = false;
    };
  }, [t]);

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

  const retryLoad = async () => {
    logClientInfo('PatientPlanPage.retry.start');
    setIsLoading(true);
    try {
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
          logClientError('PatientPlanPage.observations.retry.error', error);
        }
      }
      setHasLinkedNutritionist(linkedNutritionist);
      setView(response);
      setObservations(observationResponse);
      setLoadError(null);
      logClientInfo('PatientPlanPage.retry.success', {
        mode: response.mode,
        canEdit: response.canEdit,
        observations: observationResponse.length,
        linkedNutritionist,
      });
    } catch (error) {
      logClientError('PatientPlanPage.retry.error', error);
      setLoadError(t('nutritionPlan.loadError'));
    } finally {
      setIsLoading(false);
    }
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
          <Button variant="outline" className="gap-2">
            <FileDown size={16} />
            {t('nutritionPlan.downloadPdf')}
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
