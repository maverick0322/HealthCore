import { useTranslation } from 'react-i18next';
import { Droplets, Flame, Save } from 'lucide-react';

import type {
  NutritionPlanViewResponse,
  ObservationResponse,
} from '@/features/clinical/types/clinical.types';
import type { Namespace } from '@/features/nutrition-plan/types/nutritionPlanWorkspace.types';
import { formatObservationDate } from '@/features/nutrition-plan/utils/nutritionPlanWorkspace';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

interface NutritionPlanGoalsSidebarProps {
  namespace: Namespace;
  goals: NutritionPlanViewResponse['dailyGoals'];
  canEdit: boolean;
  isDirty: boolean;
  isSaving: boolean;
  shouldShowObservations: boolean;
  observations: ObservationResponse[];
  locale: string;
  onSaveDraft: () => Promise<void>;
}

export function NutritionPlanGoalsSidebar({
  namespace,
  goals,
  canEdit,
  isDirty,
  isSaving,
  shouldShowObservations,
  observations,
  locale,
  onSaveDraft,
}: Readonly<NutritionPlanGoalsSidebarProps>) {
  const { t } = useTranslation(namespace);

  return (
    <Card className="lg:sticky lg:top-24">
      <CardHeader className="border-b border-border/60">
        <CardTitle className="flex items-center gap-2">
          <Flame size={18} className="text-primary" />
          {t('nutritionPlan.dailyGoals')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <div className="rounded-3xl border border-primary/20 bg-primary/5 p-5">
          <div className="text-sm font-medium text-muted-foreground">{t('nutritionPlan.calories')}</div>
          <div className="mt-2 text-4xl font-black tracking-tight text-primary">{goals.targetCalories}</div>
          <div className="text-sm text-muted-foreground">{t('nutritionPlan.perDay')}</div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <MetricCard label={t('nutritionPlan.protein')} value={`${goals.targetProtein}g`} />
          <MetricCard label={t('nutritionPlan.carbs')} value={`${goals.targetCarbs}g`} />
          <MetricCard label={t('nutritionPlan.fat')} value={`${goals.targetFat}g`} />
        </div>

        <div className="rounded-3xl border border-sky-500/20 bg-sky-500/10 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-500/20 p-2 text-sky-600">
              <Droplets size={18} />
            </div>
            <div>
              <div className="font-semibold text-sky-700">{t('nutritionPlan.hydrationGoal')}</div>
              <div className="text-sm text-sky-700/80">
                {t('nutritionPlan.hydrationValue', { count: goals.targetWaterGlasses })}
              </div>
            </div>
          </div>
        </div>

        {canEdit ? (
          <Button className="w-full gap-2" onClick={() => void onSaveDraft()} disabled={!isDirty || isSaving}>
            <Save size={14} />
            {isSaving ? t('nutritionPlan.saving') : t('nutritionPlan.savePlan')}
          </Button>
        ) : null}

        {shouldShowObservations ? (
          <div className="space-y-3 rounded-3xl border border-border/60 bg-muted/10 p-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold tracking-tight">{t('nutritionPlan.observationsTitle')}</h3>
              <p className="text-xs text-muted-foreground">
                {t('nutritionPlan.observationsSubtitle')}
              </p>
            </div>

            {observations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('nutritionPlan.noObservations')}
              </p>
            ) : (
              <div className="space-y-3">
                {observations.map((observation) => (
                  <div
                    key={observation.id}
                    className="rounded-2xl border border-border/60 bg-background px-3 py-3"
                  >
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {observation.note}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatObservationDate(observation.createdAt, locale)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function MetricCard({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 px-3 py-4 text-center">
      <div className="min-h-8 text-[11px] font-semibold leading-tight text-muted-foreground sm:text-xs">
        {label}
      </div>
      <div className="mt-2 text-lg font-black tracking-tight text-foreground">{value}</div>
    </div>
  );
}
