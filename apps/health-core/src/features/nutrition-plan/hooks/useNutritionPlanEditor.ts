import { useEffect, useState } from 'react';

import type {
  CatalogFoodResponse,
  MealSlot,
  NutritionPlanIngredientRequest,
  NutritionPlanSectionRequest,
  NutritionPlanViewResponse,
} from '@/features/clinical/types/clinical.types';
import type {
  EditableIngredient,
  EditableSection,
  EditorState,
  EditorValidationErrors,
  PendingDeletionState,
} from '@/features/nutrition-plan/types/nutritionPlanWorkspace.types';
import {
  EMPTY_EDITOR_ERRORS,
  EMPTY_EDITOR_STATE,
  EMPTY_SECTIONS,
  hasValidationErrors,
  normalizeOption,
  recalculateIngredient,
  toEditableIngredient,
  toEditableSections,
  validateEditorState,
} from '@/features/nutrition-plan/utils/nutritionPlanWorkspace';

interface UseNutritionPlanEditorParams {
  view: NutritionPlanViewResponse | null;
  onSave?: (payload: {
    sections: NutritionPlanSectionRequest[];
  }) => Promise<NutritionPlanViewResponse>;
  t: (key: string, options?: Record<string, unknown>) => string;
}

export const useNutritionPlanEditor = ({
  view,
  onSave,
  t,
}: UseNutritionPlanEditorParams) => {
  const [sections, setSections] = useState<EditableSection[]>(EMPTY_SECTIONS);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorSection, setEditorSection] = useState<MealSlot>('BREAKFAST');
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [editorState, setEditorState] = useState<EditorState>(EMPTY_EDITOR_STATE);
  const [editorErrors, setEditorErrors] = useState<EditorValidationErrors>(EMPTY_EDITOR_ERRORS);
  const [pendingDeletion, setPendingDeletion] = useState<PendingDeletionState | null>(null);

  useEffect(() => {
    if (!view) {
      setSections(EMPTY_SECTIONS);
      return;
    }

    setSections(toEditableSections(view.sections));
    setIsDirty(false);
  }, [view]);

  const saveDraft = async () => {
    if (!onSave) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await onSave({
        sections: sections.map<NutritionPlanSectionRequest>((section) => ({
          mealSlot: section.mealSlot,
          options: section.options.map((option) => ({
            name: option.name,
            instructions: option.instructions,
            notes: option.notes,
            ingredients: option.ingredients.map<NutritionPlanIngredientRequest>((ingredient) => ({
              barcode: ingredient.barcode,
              unit: ingredient.unit,
              quantityAmount: ingredient.quantityAmount ?? 0,
            })),
          })),
        })),
      });

      setSections(toEditableSections(response.sections));
      setIsDirty(false);
    } finally {
      setIsSaving(false);
    }
  };

  const openCreateDialog = (mealSlot: MealSlot) => {
    setEditorSection(mealSlot);
    setEditingOptionId(null);
    setEditorState(EMPTY_EDITOR_STATE);
    setEditorErrors(EMPTY_EDITOR_ERRORS);
    setEditorOpen(true);
  };

  const openEditDialog = (mealSlot: MealSlot, optionId: string) => {
    const section = sections.find((item) => item.mealSlot === mealSlot);
    const option = section?.options.find((item) => item.id === optionId);
    if (!option) {
      return;
    }

    setEditorSection(mealSlot);
    setEditingOptionId(optionId);
    setEditorState({
      name: option.name,
      instructions: option.instructions,
      notes: option.notes,
      ingredients: option.ingredients,
    });
    setEditorErrors(EMPTY_EDITOR_ERRORS);
    setEditorOpen(true);
  };

  const removeOption = (mealSlot: MealSlot, optionId: string) => {
    setSections((current) =>
      current.map((section) =>
        section.mealSlot === mealSlot
          ? { ...section, options: section.options.filter((option) => option.id !== optionId) }
          : section,
      ),
    );
    setIsDirty(true);
  };

  const confirmRemoveOption = () => {
    if (!pendingDeletion) {
      return;
    }

    removeOption(pendingDeletion.mealSlot, pendingDeletion.optionId);
    setPendingDeletion(null);
  };

  const addSearchResult = (food: CatalogFoodResponse) => {
    const nextIngredient = toEditableIngredient(food, 100, 'GRAMS');
    setEditorState((current) => ({
      ...current,
      ingredients: [...current.ingredients, nextIngredient],
    }));
    setEditorErrors((current) => ({ ...current, ingredients: undefined }));
  };

  const updateEditorIngredient = (
    index: number,
    nextQuantity: number | null,
    nextUnit: EditableIngredient['unit'],
  ) => {
    setEditorState((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredient, ingredientIndex) =>
        ingredientIndex === index ? recalculateIngredient(ingredient, nextQuantity, nextUnit) : ingredient,
      ),
    }));
  };

  const removeEditorIngredient = (index: number) => {
    setEditorState((current) => ({
      ...current,
      ingredients: current.ingredients.filter((_, ingredientIndex) => ingredientIndex !== index),
    }));
  };

  const saveEditorOption = () => {
    const validationErrors = validateEditorState(editorState, t);
    if (hasValidationErrors(validationErrors)) {
      setEditorErrors(validationErrors);
      return false;
    }

    const normalized = normalizeOption(editorState, editingOptionId);
    if (!normalized) {
      return false;
    }

    setSections((current) =>
      current.map((section) => {
        if (section.mealSlot !== editorSection) {
          return section;
        }

        if (editingOptionId) {
          return {
            ...section,
            options: section.options.map((option) => (option.id === editingOptionId ? normalized : option)),
          };
        }

        return { ...section, options: [...section.options, normalized] };
      }),
    );
    setEditorOpen(false);
    setEditorState(EMPTY_EDITOR_STATE);
    setEditorErrors(EMPTY_EDITOR_ERRORS);
    setEditingOptionId(null);
    setIsDirty(true);
    return true;
  };

  return {
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
  };
};
