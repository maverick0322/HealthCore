import type {
  CatalogFoodResponse,
  MealSlot,
  NutritionPlanUpsertRequest,
  NutritionPlanViewResponse,
  ObservationResponse,
  PlanIngredientUnit,
} from '@/features/clinical/types/clinical.types';

export type Namespace = 'patient' | 'nutritionist';

export interface EditableIngredient {
  barcode: string;
  name: string;
  brand: string;
  imageUrl: string;
  unit: PlanIngredientUnit;
  quantityAmount: number | null;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  baseCaloriesPer100Units: number;
  baseProteinPer100Units: number;
  baseCarbsPer100Units: number;
  baseFatPer100Units: number;
}

export interface EditableMealOption {
  id: string;
  name: string;
  instructions: string;
  notes: string;
  ingredients: EditableIngredient[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface EditableSection {
  mealSlot: MealSlot;
  options: EditableMealOption[];
}

export interface EditorState {
  name: string;
  instructions: string;
  notes: string;
  ingredients: EditableIngredient[];
}

export interface PendingDeletionState {
  mealSlot: MealSlot;
  optionId: string;
  optionName: string;
}

export interface EditorValidationErrors {
  name?: string;
  ingredients?: string;
  instructions?: string;
  notes?: string;
}

export type SearchFeedbackState = 'idle' | 'no-results' | 'service-unavailable';

export interface NutritionPlanWorkspaceProps {
  namespace: Namespace;
  view: NutritionPlanViewResponse | null;
  observations?: ObservationResponse[];
  showObservations?: boolean;
  isLoading?: boolean;
  onSave?: (payload: NutritionPlanUpsertRequest) => Promise<NutritionPlanViewResponse>;
  onSearchFoods?: (query: string) => Promise<CatalogFoodResponse[]>;
  onOpenCreateLocalFood?: (initialName: string) => void;
  onQuickTrack?: (payload: { mealSlot: MealSlot; optionName: string; ingredients: unknown[] }) => void;
  isQuickTracking?: boolean;
}
