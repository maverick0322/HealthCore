import type { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Trash2 } from 'lucide-react';

import type {
  CatalogFoodResponse,
  MealSlot,
  PlanIngredientUnit,
} from '@/features/clinical/types/clinical.types';
import type {
  EditorState,
  EditorValidationErrors,
  Namespace,
  SearchFeedbackState,
} from '@/features/nutrition-plan/types/nutritionPlanWorkspace.types';
import {
  DISH_NAME_MAX_LENGTH,
  INSTRUCTIONS_MAX_LENGTH,
  NOTES_MAX_LENGTH,
} from '@/features/nutrition-plan/utils/nutritionPlanWorkspace';
import { Button } from '@/shared/ui/button';
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

interface NutritionPlanEditorDialogProps {
  namespace: Namespace;
  editorOpen: boolean;
  editingOptionId: string | null;
  editorSection: MealSlot;
  editorState: EditorState;
  editorErrors: EditorValidationErrors;
  searchQuery: string;
  searchResults: CatalogFoodResponse[];
  isSearching: boolean;
  searchFeedbackState: SearchFeedbackState;
  onOpenCreateLocalFood?: (initialName: string) => void;
  onOpenChange: (open: boolean) => void;
  setEditorState: Dispatch<SetStateAction<EditorState>>;
  setEditorErrors: Dispatch<SetStateAction<EditorValidationErrors>>;
  onSearchQueryChange: (value: string) => void;
  onSelectSearchResult: (food: CatalogFoodResponse) => void;
  onUpdateEditorIngredient: (index: number, nextQuantity: number | null, nextUnit: PlanIngredientUnit) => void;
  onRemoveEditorIngredient: (index: number) => void;
  onSaveEditorOption: () => void;
}

export function NutritionPlanEditorDialog({
  namespace,
  editorOpen,
  editingOptionId,
  editorSection,
  editorState,
  editorErrors,
  searchQuery,
  searchResults,
  isSearching,
  searchFeedbackState,
  onOpenCreateLocalFood,
  onOpenChange,
  setEditorState,
  setEditorErrors,
  onSearchQueryChange,
  onSelectSearchResult,
  onUpdateEditorIngredient,
  onRemoveEditorIngredient,
  onSaveEditorOption,
}: Readonly<NutritionPlanEditorDialogProps>) {
  const { t } = useTranslation(namespace);

  return (
    <Dialog open={editorOpen} onOpenChange={onOpenChange}>
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
                  onChange={(event) => onSearchQueryChange(event.target.value)}
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
                      onClick={() => onSelectSearchResult(food)}
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
                          onClick={() => onRemoveEditorIngredient(index)}
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
                              onUpdateEditorIngredient(
                                index,
                                rawValue === '' ? null : Number(rawValue),
                                ingredient.unit,
                              );
                            }
                          }}
                        />
                        <select
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                          value={ingredient.unit}
                          onChange={(event) =>
                            onUpdateEditorIngredient(
                              index,
                              ingredient.quantityAmount,
                              event.target.value as PlanIngredientUnit,
                            )
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('nutritionPlan.cancel')}
          </Button>
          <Button onClick={onSaveEditorOption}>{t('nutritionPlan.confirmDish')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
