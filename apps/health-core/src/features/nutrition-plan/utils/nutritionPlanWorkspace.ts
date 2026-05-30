import type {
  CatalogFoodResponse,
  NutritionPlanViewResponse,
  PlanIngredientUnit,
  ReadonlyNutritionPlanResponse,
} from '@/features/clinical/types/clinical.types';
import type {
  EditableIngredient,
  EditableMealOption,
  EditableSection,
  EditorState,
  EditorValidationErrors,
} from '@/features/nutrition-plan/types/nutritionPlanWorkspace.types';

export const DISH_NAME_MAX_LENGTH = 120;
export const INSTRUCTIONS_MAX_LENGTH = 1200;
export const NOTES_MAX_LENGTH = 600;

export const EMPTY_EDITOR_STATE: EditorState = {
  name: '',
  instructions: '',
  notes: '',
  ingredients: [],
};

export const EMPTY_EDITOR_ERRORS: EditorValidationErrors = {};

export const EMPTY_SECTIONS: EditableSection[] = [
  { mealSlot: 'BREAKFAST', options: [] },
  { mealSlot: 'LUNCH', options: [] },
  { mealSlot: 'DINNER', options: [] },
  { mealSlot: 'SNACK', options: [] },
];

export const deriveBaseMacro = (total: number, quantityAmount: number): number => {
  if (!quantityAmount) {
    return 0;
  }

  return (total / quantityAmount) * 100;
};

export const toEditableSections = (
  sections: NutritionPlanViewResponse['sections'],
): EditableSection[] =>
  sections.map((section) => ({
    mealSlot: section.mealSlot,
    options: section.options.map((option) => ({
      id: option.id,
      name: option.name,
      instructions: option.instructions,
      notes: option.notes,
      ingredients: option.ingredients.map((ingredient) => ({
        ...ingredient,
        baseCaloriesPer100Units: deriveBaseMacro(ingredient.calories, ingredient.quantityAmount),
        baseProteinPer100Units: deriveBaseMacro(ingredient.proteinGrams, ingredient.quantityAmount),
        baseCarbsPer100Units: deriveBaseMacro(ingredient.carbsGrams, ingredient.quantityAmount),
        baseFatPer100Units: deriveBaseMacro(ingredient.fatGrams, ingredient.quantityAmount),
      })),
      totalCalories: option.totalCalories,
      totalProtein: option.totalProtein,
      totalCarbs: option.totalCarbs,
      totalFat: option.totalFat,
    })),
  }));

export const toEditableIngredient = (
  food: CatalogFoodResponse,
  quantityAmount: number,
  unit: PlanIngredientUnit,
): EditableIngredient => ({
  barcode: food.barcode,
  name: food.name,
  brand: food.brand,
  imageUrl: food.imageUrl,
  unit,
  quantityAmount,
  calories: Math.round((food.caloriesPer100Units * quantityAmount) / 100),
  proteinGrams: Math.round((food.proteinPer100Units * quantityAmount) / 100),
  carbsGrams: Math.round((food.carbsPer100Units * quantityAmount) / 100),
  fatGrams: Math.round((food.fatPer100Units * quantityAmount) / 100),
  baseCaloriesPer100Units: food.caloriesPer100Units,
  baseProteinPer100Units: food.proteinPer100Units,
  baseCarbsPer100Units: food.carbsPer100Units,
  baseFatPer100Units: food.fatPer100Units,
});

export const recalculateIngredient = (
  ingredient: EditableIngredient,
  quantityAmount: number | null,
  unit: PlanIngredientUnit,
): EditableIngredient => {
  const safeQuantityAmount = quantityAmount ?? 0;

  return {
    ...ingredient,
    unit,
    quantityAmount,
    calories: Math.round((ingredient.baseCaloriesPer100Units * safeQuantityAmount) / 100),
    proteinGrams: Math.round((ingredient.baseProteinPer100Units * safeQuantityAmount) / 100),
    carbsGrams: Math.round((ingredient.baseCarbsPer100Units * safeQuantityAmount) / 100),
    fatGrams: Math.round((ingredient.baseFatPer100Units * safeQuantityAmount) / 100),
  };
};

export const normalizeOption = (
  editorState: EditorState,
  editingOptionId: string | null,
): EditableMealOption | null => {
  const trimmedName = editorState.name.trim();
  if (
    !trimmedName ||
    editorState.ingredients.length === 0 ||
    editorState.ingredients.some(
      (ingredient) => ingredient.quantityAmount == null || ingredient.quantityAmount <= 0,
    )
  ) {
    return null;
  }

  const totalCalories = editorState.ingredients.reduce((sum, ingredient) => sum + ingredient.calories, 0);
  const totalProtein = editorState.ingredients.reduce(
    (sum, ingredient) => sum + ingredient.proteinGrams,
    0,
  );
  const totalCarbs = editorState.ingredients.reduce((sum, ingredient) => sum + ingredient.carbsGrams, 0);
  const totalFat = editorState.ingredients.reduce((sum, ingredient) => sum + ingredient.fatGrams, 0);

  return {
    id: editingOptionId ?? `meal-${crypto.randomUUID()}`,
    name: trimmedName,
    instructions: editorState.instructions.trim(),
    notes: editorState.notes.trim(),
    ingredients: editorState.ingredients.map((ingredient) => ({
      ...ingredient,
      quantityAmount: ingredient.quantityAmount ?? 0,
    })),
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
  };
};

export const formatAmount = (value: number | null): string => {
  if (value == null) {
    return '--';
  }

  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
};

export const formatObservationDate = (value: string, locale: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const validateEditorState = (
  editorState: EditorState,
  t: (key: string, options?: Record<string, unknown>) => string,
): EditorValidationErrors => {
  const errors: EditorValidationErrors = {};

  if (!editorState.name.trim()) {
    errors.name = t('nutritionPlan.validation.nameRequired');
  } else if (editorState.name.trim().length > DISH_NAME_MAX_LENGTH) {
    errors.name = t('nutritionPlan.validation.nameTooLong', { max: DISH_NAME_MAX_LENGTH });
  }

  if (editorState.ingredients.length === 0) {
    errors.ingredients = t('nutritionPlan.validation.ingredientsRequired');
  } else if (
    editorState.ingredients.some(
      (ingredient) =>
        ingredient.quantityAmount == null ||
        !Number.isFinite(ingredient.quantityAmount) ||
        ingredient.quantityAmount <= 0,
    )
  ) {
    errors.ingredients = t('nutritionPlan.validation.quantityInvalid');
  }

  if (editorState.instructions.trim().length > INSTRUCTIONS_MAX_LENGTH) {
    errors.instructions = t('nutritionPlan.validation.instructionsTooLong', {
      max: INSTRUCTIONS_MAX_LENGTH,
    });
  }

  if (editorState.notes.trim().length > NOTES_MAX_LENGTH) {
    errors.notes = t('nutritionPlan.validation.notesTooLong', { max: NOTES_MAX_LENGTH });
  }

  return errors;
};

export const hasValidationErrors = (errors: EditorValidationErrors): boolean =>
  Object.values(errors).some(Boolean);

export const getReadOnlyContextItems = (
  plan: ReadonlyNutritionPlanResponse,
): ReadonlyNutritionPlanResponse['sections'] => plan.sections;
