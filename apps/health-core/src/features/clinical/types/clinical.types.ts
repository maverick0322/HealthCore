export type Gender = 'MALE' | 'FEMALE';

export type ActivityLevel =
  | 'SEDENTARY'
  | 'LIGHTLY_ACTIVE'
  | 'MODERATELY_ACTIVE'
  | 'VERY_ACTIVE'
  | 'EXTRA_ACTIVE';

export type PatientGoal = 'weight-loss' | 'muscle-gain' | 'health' | 'performance';

export type DietType = 'omnivore' | 'vegetarian' | 'vegan' | 'keto' | 'paleo';

export type Allergy = 'gluten' | 'lactose' | 'nuts' | 'seafood' | 'egg';

export type NutritionistSpecialization =
  | 'CLINICAL'
  | 'SPORTS'
  | 'PEDIATRIC'
  | 'GERIATRIC'
  | 'FOOD_SAFETY'
  | 'PERINATAL'
  | 'FOOD_TECHNOLOGY'
  | 'OTHER';

export type ConsultationType = 'PRESENTIAL' | 'ONLINE' | 'HOME_VISIT';

export interface CreateProfilePayload {
  firstName: string;
  paternalLastName: string;
  maternalLastName?: string | null;
  weightKg: number;
  heightCm: number;
  birthDate: string;
  gender: Gender;
  activityLevel: ActivityLevel;
  goal: PatientGoal;
  dietType: DietType;
  allergies: Allergy[];
  excludedFoods: string[];
}

export interface HealthGoalResponse {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  targetWaterGlasses: number;
}

export type NutritionPlanMode = 'SELF_MANAGED' | 'READ_ONLY' | 'NUTRITIONIST';
export type NutritionPlanAuthorType = 'SELF_MANAGED' | 'NUTRITIONIST';
export type MealSlot = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
export type PlanIngredientUnit = 'GRAMS' | 'MILLILITERS';

export interface CatalogFoodResponse {
  barcode: string;
  name: string;
  brand: string;
  imageUrl: string;
  caloriesPer100Units: number;
  proteinPer100Units: number;
  carbsPer100Units: number;
  fatPer100Units: number;
}

export interface NutritionPlanIngredientRequest {
  barcode: string;
  unit: PlanIngredientUnit;
  quantityAmount: number;
}

export interface NutritionPlanMealOptionRequest {
  name: string;
  instructions: string;
  notes: string;
  ingredients: NutritionPlanIngredientRequest[];
}

export interface NutritionPlanSectionRequest {
  mealSlot: MealSlot;
  options: NutritionPlanMealOptionRequest[];
}

export interface NutritionPlanUpsertRequest {
  sections: NutritionPlanSectionRequest[];
}

export interface NutritionPlanIngredientResponse {
  barcode: string;
  name: string;
  brand: string;
  imageUrl: string;
  unit: PlanIngredientUnit;
  quantityAmount: number;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

export interface NutritionPlanMealOptionResponse {
  id: string;
  name: string;
  instructions: string;
  notes: string;
  ingredients: NutritionPlanIngredientResponse[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface NutritionPlanSectionResponse {
  mealSlot: MealSlot;
  options: NutritionPlanMealOptionResponse[];
}

export interface ReadonlyNutritionPlanResponse {
  authorType: NutritionPlanAuthorType;
  dailyGoals: HealthGoalResponse;
  sections: NutritionPlanSectionResponse[];
  updatedAt: string;
}

export interface NutritionPlanViewResponse {
  mode: NutritionPlanMode;
  authorType: NutritionPlanAuthorType | null;
  canEdit: boolean;
  dailyGoals: HealthGoalResponse;
  sections: NutritionPlanSectionResponse[];
  contextSelfManagedPlan: ReadonlyNutritionPlanResponse | null;
}

export interface WeightRecord {
  weightKg: number;
  date: string;
}

export interface ObservationResponse {
  id: string;
  patientId: string;
  nutritionistId: string;
  note: string;
  createdAt: string;
}

export interface CreateObservationRequest {
  patientId: string;
  note: string;
}

export interface UpdateObservationRequest {
  note: string;
}

export interface PatientProfileResponse extends CreateProfilePayload {
  userId: string;
  fullName: string | null;
  nutritionistId?: string | null;
  profilePhotoUrl: string | null;
  profileCompleted: boolean;
}

export interface ClinicAddressPayload {
  postalCode: string;
  state: string;
  city: string;
  municipality: string;
  neighborhood: string;
  street: string;
  exteriorNumber: string;
  interiorNumber?: string | null;
}

export interface PostalCodeLookupResponse {
  postalCode: string;
  state: string;
  city: string;
  municipality: string;
  colonies: string[];
}

export interface NutritionistProfilePayload {
  firstName: string;
  paternalLastName: string;
  maternalLastName?: string | null;
  specializations: NutritionistSpecialization[];
  customSpecialization?: string | null;
  professionalLicense: string;
  consultationTypes: ConsultationType[];
  phone?: string | null;
  clinicAddress?: ClinicAddressPayload | null;
  bio: string;
}

export interface NutritionistProfileResponse extends NutritionistProfilePayload {
  userId: string;
  fullName: string | null;
  profilePhotoUrl: string | null;
  profileCompleted: boolean;
}

export interface NutritionistPatientProfileResponse extends PatientProfileResponse {}

export interface NutritionistWeightProgressReportRowResponse {
  patientId: string;
  fullName: string;
  latestRecordDateInRange: string | null;
  startWeightKg: number | null;
  currentWeightKg: number | null;
  netChangeKg: number | null;
  hasRecordsInRange: boolean;
}

export interface NutritionistWeightProgressReportResponse {
  activePatients: number;
  patientsWithoutWeightInRange: number;
  rows: NutritionistWeightProgressReportRowResponse[];
}
