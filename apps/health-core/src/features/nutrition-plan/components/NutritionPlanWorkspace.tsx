import { useTranslation } from 'react-i18next';
import {
  Droplets,
  Flame,
  Info,
  Loader2,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';

import type {
  PlanIngredientUnit,
  ReadonlyNutritionPlanResponse,
} from '@/features/clinical/types/clinical.types';
import { useNutritionPlanEditor } from '@/features/nutrition-plan/hooks/useNutritionPlanEditor';
import { useNutritionPlanFoodSearch } from '@/features/nutrition-plan/hooks/useNutritionPlanFoodSearch';
import type {
  Namespace,
  NutritionPlanWorkspaceProps,
} from '@/features/nutrition-plan/types/nutritionPlanWorkspace.types';
import {
  DISH_NAME_MAX_LENGTH,
  formatAmount,
  formatObservationDate,
  INSTRUCTIONS_MAX_LENGTH,
  NOTES_MAX_LENGTH,
} from '@/features/nutrition-plan/utils/nutritionPlanWorkspace';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/shared/ui/accordion';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

function MacroBadge({ value }: Readonly<{ value: string }>) {
  return (
    <span className="rounded-full border border-border/80 bg-background px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
      {value}
    </span>
  );
}

export function NutritionPlanWorkspace({
  namespace,
  view,
  observations = [],
  showObservations,
  isLoading = false,
  onSave,
  onSearchFoods,
  onOpenCreateLocalFood,
  onQuickTrack,
  isQuickTracking,
}: Readonly<NutritionPlanWorkspaceProps>) {
  const { t, i18n } = useTranslation(namespace);
  const {
    sections,
    isDirty,
    isSaving,
    editorOpen,
    setEditorOpen,
    editorSection,
    editingOptionId,
    editorState,
    setEditorState,
    editorErrors,
    setEditorErrors,
    pendingDeletion,
    setPendingDeletion,
    saveDraft,
    openCreateDialog,
    openEditDialog,
    confirmRemoveOption,
    addSearchResult,
    updateEditorIngredient,
    removeEditorIngredient,
    saveEditorOption,
  } = useNutritionPlanEditor({
    view,
    onSave,
    t,
  });
  const {
    searchQuery,
    searchResults,
    isSearching,
    searchFeedbackState,
    handleSearchQueryChange,
    resetSearch,
  } = useNutritionPlanFoodSearch({
    editorOpen,
    namespace,
    onSearchFoods,
  });

  const goals = view?.dailyGoals;
  const canEdit = Boolean(view?.canEdit);
  const showRegisterAction = namespace === 'patient' && !canEdit;
  const shouldShowObservations = showObservations ?? namespace === 'patient';
  const sectionSubtitleKey = canEdit
    ? namespace === 'nutritionist'
      ? 'nutritionPlan.sectionSubtitleNutritionist'
      : 'nutritionPlan.sectionSubtitleSelfManaged'
    : 'nutritionPlan.sectionSubtitleReadOnly';
  const emptySectionKey = canEdit
    ? namespace === 'nutritionist'
      ? 'nutritionPlan.emptyEditableNutritionist'
      : 'nutritionPlan.emptyEditablePatient'
    : 'nutritionPlan.emptyReadOnlyPatient';

  const sectionCards = sections.map((section) => (
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
                onClick={() => {
                  resetSearch();
                  openCreateDialog(section.mealSlot);
                }}
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
                    {showRegisterAction ? (
                      <Button 
                    className="w-full gap-2" 
                        disabled={isQuickTracking}
                        onClick={() => {
                          if (onQuickTrack) {
                            onQuickTrack({
                              mealSlot: section.mealSlot,
                              optionName: option.name,
                              ingredients: option.ingredients
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
                    ) : (
                      <div className="flex w-full items-center gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 gap-2"
                          onClick={() => {
                            resetSearch();
                            openEditDialog(section.mealSlot, option.id);
                          }}
                        >
                          <Pencil size={14} />
                          {t('nutritionPlan.edit')}
                        </Button>
                        <Button
                          variant="outline"
                          className="gap-2 text-destructive hover:text-destructive"
                          onClick={() =>
                            setPendingDeletion({
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
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </section>
      ));

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card>
          <CardContent className="space-y-4 py-6">
            <div className="h-8 w-32 animate-pulse rounded bg-muted" />
            <div className="h-24 animate-pulse rounded-2xl bg-muted" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-16 animate-pulse rounded-xl bg-muted" />
              <div className="h-16 animate-pulse rounded-xl bg-muted" />
            </div>
          </CardContent>
        </Card>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="h-32 animate-pulse py-6" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!view || !goals) {
    return (
      <Card className="border-dashed bg-muted/20">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          {t('nutritionPlan.unavailable')}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
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
              <Button className="w-full gap-2" onClick={() => void saveDraft()} disabled={!isDirty || isSaving}>
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
                          {formatObservationDate(observation.createdAt, i18n.language)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-8">{sectionCards}</div>
      </div>

      {namespace === 'nutritionist' && view.contextSelfManagedPlan ? (
        <ReadOnlyContextCard namespace={namespace} plan={view.contextSelfManagedPlan} />
      ) : null}

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-3xl p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>{t(editingOptionId ? 'nutritionPlan.editDish' : 'nutritionPlan.addDish')}</DialogTitle>
            <DialogDescription>
              {t('nutritionPlan.editorDescription', { meal: t(`nutritionPlan.mealSlots.${editorSection}`) })}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 pb-6">
            <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">{t('nutritionPlan.dishName')}</label>
                <Input
                  value={editorState.name}
                  maxLength={DISH_NAME_MAX_LENGTH}
                  onChange={(event) => {
                    setEditorState((current) => ({ ...current, name: event.target.value }));
                    setEditorErrors((current) => ({ ...current, name: undefined }));
                  }}
                  placeholder={t('nutritionPlan.dishNamePlaceholder')}
                  aria-invalid={Boolean(editorErrors.name)}
                />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-destructive">{editorErrors.name ?? ''}</p>
                  <p className="text-xs text-muted-foreground">
                    {editorState.name.length}/{DISH_NAME_MAX_LENGTH}
                  </p>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">{t('nutritionPlan.searchFood')}</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    value={searchQuery}
                    onChange={(event) => handleSearchQueryChange(event.target.value)}
                    maxLength={100}
                    placeholder={t('nutritionPlan.searchFoodPlaceholder')}
                  />
                </div>
                {isSearching ? (
                  <p className="text-sm text-muted-foreground">{t('nutritionPlan.searching')}</p>
                ) : null}
                {!isSearching && searchFeedbackState === 'service-unavailable' ? (
                  <p className="text-sm text-destructive">
                    {t('nutritionPlan.searchServiceUnavailable')}
                  </p>
                ) : null}
                {!isSearching && searchFeedbackState === 'no-results' ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-center">
                    <p className="mb-3 text-sm text-muted-foreground">
                      {t('nutritionPlan.searchNoResults', { query: searchQuery.trim() })}
                    </p>
                    
                    {/* UX Defensiva y SRP: 
                      Solo mostramos el botón si es nutriólogo y el padre inyectó la función.
                      Al hacer clic, delegamos la responsabilidad de abrir el modal de creación.
                    */}
                    {namespace === 'nutritionist' && onOpenCreateLocalFood ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="gap-2"
                        onClick={() => onOpenCreateLocalFood(searchQuery.trim())}
                      >
                        <Plus size={16} />
                        Crear "{searchQuery.trim()}" localmente
                      </Button>
                    ) : null}
                  </div>
                ) : null}
                {searchResults.length > 0 ? (
                  <div className="grid gap-2 rounded-2xl border border-border/60 bg-muted/20 p-3">
                    {searchResults.map((food) => (
                      <button
                        key={food.barcode}
                        type="button"
                        className="flex items-center justify-between rounded-xl bg-background px-3 py-2 text-left ring-1 ring-border/60 transition hover:ring-primary/50"
                        onClick={() => {
                          addSearchResult(food);
                          resetSearch();
                        }}
                      >
                        <div>
                          <p className="font-semibold text-foreground">{food.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {food.caloriesPer100Units} kcal / 100
                          </p>
                        </div>
                        <Plus size={16} className="text-primary" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="space-y-3 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">{t('nutritionPlan.ingredients')}</label>
                  <span className="text-xs text-muted-foreground">{editorState.ingredients.length}</span>
                </div>
                {editorErrors.ingredients ? (
                  <p className="text-xs text-destructive">{editorErrors.ingredients}</p>
                ) : null}

                {editorState.ingredients.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                    {t('nutritionPlan.emptyIngredients')}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {editorState.ingredients.map((ingredient, index) => (
                      <div
                        key={`${ingredient.barcode}-${index}`}
                        className="rounded-2xl border border-border/60 bg-background p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground">{ingredient.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {ingredient.calories} kcal | {ingredient.proteinGrams}g P | {ingredient.carbsGrams}g C | {ingredient.fatGrams}g G
                            </p>
                          </div>
                          <button
                            type="button"
                            className="rounded-xl p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => removeEditorIngredient(index)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_160px]">
                          <Input
                            type="number"
                            min={0}
                            step={1}
                            value={ingredient.quantityAmount ?? ''}
                            onChange={(event) => {
                              const rawValue = event.target.value.trim();
                              if (rawValue.length <= 5) {
                                updateEditorIngredient(
                                  index,
                                  rawValue === '' ? null : Number(rawValue),
                                  ingredient.unit
                                );
                              }
                            }}
                          />
                          <select
                            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                            value={ingredient.unit}
                            onChange={(event) =>
                              updateEditorIngredient(index, ingredient.quantityAmount, event.target.value as PlanIngredientUnit)
                            }
                          >
                            <option value="GRAMS">{t('nutritionPlan.units.GRAMS')}</option>
                            <option value="MILLILITERS">{t('nutritionPlan.units.MILLILITERS')}</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">{t('nutritionPlan.instructions')}</label>
                <Textarea
                  value={editorState.instructions}
                  maxLength={INSTRUCTIONS_MAX_LENGTH}
                  onChange={(event) => {
                    setEditorState((current) => ({ ...current, instructions: event.target.value }));
                    setEditorErrors((current) => ({ ...current, instructions: undefined }));
                  }}
                  placeholder={t('nutritionPlan.instructionsPlaceholder')}
                  aria-invalid={Boolean(editorErrors.instructions)}
                />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-destructive">{editorErrors.instructions ?? ''}</p>
                  <p className="text-xs text-muted-foreground">
                    {editorState.instructions.length}/{INSTRUCTIONS_MAX_LENGTH}
                  </p>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">{t('nutritionPlan.notes')}</label>
                <Textarea
                  value={editorState.notes}
                  maxLength={NOTES_MAX_LENGTH}
                  onChange={(event) => {
                    setEditorState((current) => ({ ...current, notes: event.target.value }));
                    setEditorErrors((current) => ({ ...current, notes: undefined }));
                  }}
                  placeholder={t('nutritionPlan.notesPlaceholder')}
                  aria-invalid={Boolean(editorErrors.notes)}
                />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-destructive">{editorErrors.notes ?? ''}</p>
                  <p className="text-xs text-muted-foreground">
                    {editorState.notes.length}/{NOTES_MAX_LENGTH}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border/60 px-6 pb-6 pt-4">
            <Button variant="outline" onClick={() => setEditorOpen(false)}>
              {t('nutritionPlan.cancel')}
            </Button>
            <Button onClick={saveEditorOption}>{t('nutritionPlan.confirmDish')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        isOpen={pendingDeletion !== null}
        onClose={() => setPendingDeletion(null)}
        onConfirm={confirmRemoveOption}
        title={t('nutritionPlan.deleteDishTitle')}
        description={t('nutritionPlan.deleteDishDescription', {
          name: pendingDeletion?.optionName ?? '',
        })}
        confirmText={t('nutritionPlan.deleteDishConfirm')}
        cancelText={t('nutritionPlan.cancel')}
        isDestructive
        icon={<Trash2 size={24} />}
      />
    </div>
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

function ReadOnlyContextCard({
  namespace,
  plan,
}: Readonly<{ namespace: Namespace; plan: ReadonlyNutritionPlanResponse }>) {
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
