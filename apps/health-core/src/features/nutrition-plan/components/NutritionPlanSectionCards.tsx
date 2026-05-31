import { useTranslation } from 'react-i18next';
import { Info, Loader2, Pencil, Plus, Trash2, UtensilsCrossed } from 'lucide-react';

import type { MealSlot } from '@/features/clinical/types/clinical.types';
import type {
  EditableSection,
  Namespace,
  PendingDeletionState,
} from '@/features/nutrition-plan/types/nutritionPlanWorkspace.types';
import { formatAmount } from '@/features/nutrition-plan/utils/nutritionPlanWorkspace';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/shared/ui/accordion';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card';

interface NutritionPlanSectionCardsProps {
  namespace: Namespace;
  sections: EditableSection[];
  canEdit: boolean;
  showRegisterAction: boolean;
  emptySectionKey: string;
  sectionSubtitleKey: string;
  isQuickTracking?: boolean;
  onOpenCreateDialog: (mealSlot: MealSlot) => void;
  onOpenEditDialog: (mealSlot: MealSlot, optionId: string) => void;
  onRequestDelete: (nextState: PendingDeletionState) => void;
  onQuickTrack?: (payload: { mealSlot: MealSlot; optionName: string; ingredients: unknown[] }) => void;
}

export function NutritionPlanSectionCards({
  namespace,
  sections,
  canEdit,
  showRegisterAction,
  emptySectionKey,
  sectionSubtitleKey,
  isQuickTracking = false,
  onOpenCreateDialog,
  onOpenEditDialog,
  onRequestDelete,
  onQuickTrack,
}: Readonly<NutritionPlanSectionCardsProps>) {
  const { t } = useTranslation(namespace);
  const shouldShowQuickTrackAction = namespace === 'patient' && Boolean(onQuickTrack);

  return sections.map((section) => (
    <section key={section.mealSlot} className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold tracking-tight">
              {t(`nutritionPlan.mealSlots.${section.mealSlot}`)}
            </h3>
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {t(`nutritionPlan.mealWindows.${section.mealSlot}`)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t(sectionSubtitleKey)}
          </p>
        </div>
        {canEdit ? (
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => onOpenCreateDialog(section.mealSlot)}
          >
            <Plus size={14} />
            {t('nutritionPlan.addDish')}
          </Button>
        ) : null}
      </div>

      {section.options.length === 0 ? (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t(emptySectionKey)}
          </CardContent>
        </Card>
      ) : (
        <div className="flex snap-x gap-4 overflow-x-auto pb-2">
          {section.options.map((option) => (
            <Card key={option.id} className="min-w-[320px] max-w-[360px] snap-start border-border/70">
              <CardHeader className="border-b border-border/60">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <CardTitle>{option.name}</CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <MacroBadge value={`${option.totalCalories} kcal`} />
                      <MacroBadge value={`${option.totalProtein}g ${t('nutritionPlan.proteinShort')}`} />
                      <MacroBadge value={`${option.totalCarbs}g ${t('nutritionPlan.carbsShort')}`} />
                      <MacroBadge value={`${option.totalFat}g ${t('nutritionPlan.fatShort')}`} />
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                <Accordion type="single" collapsible>
                  <AccordionItem value="details" className="border-none">
                    <AccordionTrigger className="py-0 text-sm">
                      {t('nutritionPlan.details')}
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                          {t('nutritionPlan.ingredients')}
                        </h4>
                        <ul className="space-y-2">
                          {option.ingredients.map((ingredient) => (
                            <li
                              key={`${option.id}-${ingredient.barcode}`}
                              className="rounded-xl bg-muted/40 px-3 py-2 text-sm text-foreground/90"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="font-medium">{ingredient.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatAmount(ingredient.quantityAmount)} {ingredient.unit === 'GRAMS' ? 'g' : 'ml'}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                          {t('nutritionPlan.instructions')}
                        </h4>
                        <p className="text-sm leading-relaxed text-foreground/90">
                          {option.instructions || t('nutritionPlan.noInstructions')}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3">
                        <div className="mb-1 flex items-center gap-2 text-amber-700">
                          <Info size={14} />
                          <span className="text-xs font-bold uppercase tracking-[0.2em]">
                            {t('nutritionPlan.notes')}
                          </span>
                        </div>
                        <p className="text-sm text-amber-700/90">
                          {option.notes || t('nutritionPlan.noNotes')}
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>

              <CardFooter className="justify-between gap-2">
                <div className="w-full space-y-2">
                  {shouldShowQuickTrackAction ? (
                    <Button
                      className="w-full gap-2"
                      disabled={isQuickTracking}
                      onClick={() => {
                        if (onQuickTrack) {
                          onQuickTrack({
                            mealSlot: section.mealSlot,
                            optionName: option.name,
                            ingredients: option.ingredients,
                          });
                        }
                      }}
                    >
                      {isQuickTracking ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <UtensilsCrossed size={14} />
                      )}
                      {isQuickTracking ? 'Registrando...' : t('nutritionPlan.registerDish')}
                    </Button>
                  ) : null}

                  {!showRegisterAction ? (
                    <div className="flex w-full items-center gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 gap-2"
                        onClick={() => onOpenEditDialog(section.mealSlot, option.id)}
                      >
                        <Pencil size={14} />
                        {t('nutritionPlan.edit')}
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2 text-destructive hover:text-destructive"
                        onClick={() =>
                          onRequestDelete({
                            mealSlot: section.mealSlot,
                            optionId: option.id,
                            optionName: option.name,
                          })
                        }
                      >
                        <Trash2 size={14} />
                        {t('nutritionPlan.delete')}
                      </Button>
                    </div>
                  ) : null}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </section>
  ));
}

function MacroBadge({ value }: Readonly<{ value: string }>) {
  return (
    <span className="rounded-full border border-border/80 bg-background px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
      {value}
    </span>
  );
}
