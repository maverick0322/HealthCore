import { useTranslation } from 'react-i18next';

import type { ReadonlyNutritionPlanResponse } from '@/features/clinical/types/clinical.types';
import type { Namespace } from '@/features/nutrition-plan/types/nutritionPlanWorkspace.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

interface NutritionPlanContextCardProps {
  namespace: Namespace;
  plan: ReadonlyNutritionPlanResponse;
}

export function NutritionPlanContextCard({
  namespace,
  plan,
}: Readonly<NutritionPlanContextCardProps>) {
  const { t } = useTranslation(namespace);

  return (
    <Card>
      <CardHeader className="border-b border-border/60">
        <CardTitle>{t('nutritionPlan.contextTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <p className="text-sm text-muted-foreground">{t('nutritionPlan.contextDescription')}</p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {plan.sections.map((section) => (
            <div key={section.mealSlot} className="rounded-2xl border border-border/60 bg-muted/20 p-4">
              <h4 className="font-semibold">{t(`nutritionPlan.mealSlots.${section.mealSlot}`)}</h4>
              <div className="mt-3 space-y-2">
                {section.options.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('nutritionPlan.emptyReadOnly')}</p>
                ) : (
                  section.options.map((option) => (
                    <div key={option.id} className="rounded-xl bg-background px-3 py-2 ring-1 ring-border/60">
                      <p className="font-medium">{option.name}</p>
                      <p className="text-xs text-muted-foreground">{option.totalCalories} kcal</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
