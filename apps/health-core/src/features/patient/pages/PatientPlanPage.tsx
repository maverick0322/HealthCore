import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileDown } from 'lucide-react';

import { clinicalApi } from '@/features/clinical/services/clinicalService';
import type { NutritionPlanViewResponse } from '@/features/clinical/types/clinical.types';
import { NutritionPlanWorkspace } from '@/features/nutrition-plan/components/NutritionPlanWorkspace';
import { PatientNav } from '@/features/patient/components/PatientNav';
import { SettingsBar } from '@/shared/components/SettingsBar';
import { Button } from '@/shared/ui/button';

export const PatientPlanPage = () => {
  const { t } = useTranslation('patient');
  const [view, setView] = useState<NutritionPlanViewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadPlan = async () => {
      try {
        const response = await clinicalApi.getMyNutritionPlan();
        if (mounted) {
          setView(response);
        }
      } catch (error) {
        console.error('Error loading patient nutrition plan:', error);
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
  }, []);

  const handleSave = async (payload: Parameters<typeof clinicalApi.upsertMyNutritionPlan>[0]) => {
    const response = await clinicalApi.upsertMyNutritionPlan(payload);
    setView(response);
    return response;
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
        <NutritionPlanWorkspace
          namespace="patient"
          view={view}
          isLoading={isLoading}
          onSave={handleSave}
          onSearchFoods={clinicalApi.searchCatalogFoods}
        />
      </main>
    </div>
  );
};
