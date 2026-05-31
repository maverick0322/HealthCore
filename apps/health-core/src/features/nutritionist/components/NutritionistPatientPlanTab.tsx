import { useTranslation } from 'react-i18next';
import { AlertCircle, UtensilsCrossed } from 'lucide-react';

import { clinicalApi } from '@/features/clinical/services/clinicalService';
import type { NutritionPlanViewResponse } from '@/features/clinical/types/clinical.types';
import { NutritionPlanWorkspace } from '@/features/nutrition-plan/components/NutritionPlanWorkspace';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

interface NutritionistPatientPlanTabProps {
  nutritionPlanView: NutritionPlanViewResponse | null;
  isLoadingNutritionPlan: boolean;
  nutritionPlanLoadError: string | null;
  onRetryNutritionPlanLoad: () => Promise<void>;
  onSaveNutritionPlan: (
    payload: Parameters<typeof clinicalApi.upsertNutritionistPatientNutritionPlan>[1]
  ) => Promise<NutritionPlanViewResponse>;
  onOpenCreateLocalFood: (name: string) => void;
}

export const NutritionistPatientPlanTab = ({
  nutritionPlanView,
  isLoadingNutritionPlan,
  nutritionPlanLoadError,
  onRetryNutritionPlanLoad,
  onSaveNutritionPlan,
  onOpenCreateLocalFood,
}: NutritionistPatientPlanTabProps) => {
  const { t } = useTranslation('nutritionist');

  return (
    <Card>
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="text-base flex items-center gap-2">
          <UtensilsCrossed size={18} className="text-primary" /> {t('patients.file.tabPlan')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {nutritionPlanLoadError && !isLoadingNutritionPlan ? (
          <Card className="mb-6 border-destructive/20">
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <div className="space-y-1">
                <p className="font-semibold">{nutritionPlanLoadError}</p>
                <p className="text-sm text-muted-foreground">{t('nutritionPlan.loadErrorHelp')}</p>
              </div>
              <Button variant="outline" className="gap-2" onClick={() => void onRetryNutritionPlanLoad()}>
                {t('nutritionPlan.retry')}
              </Button>
            </CardContent>
          </Card>
        ) : null}
        <NutritionPlanWorkspace
          namespace="nutritionist"
          view={nutritionPlanView}
          isLoading={isLoadingNutritionPlan}
          onSave={onSaveNutritionPlan}
          onSearchFoods={clinicalApi.searchCatalogFoods}
          onOpenCreateLocalFood={onOpenCreateLocalFood}
        />
      </CardContent>
    </Card>
  );
};
